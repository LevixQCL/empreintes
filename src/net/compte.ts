// Comptes et synchronisation de la sauvegarde avec Firestore.
// Chargé seulement si Firebase est configuré (import dynamique), pour que le jeu hors ligne reste léger.

import { initializeApp } from 'firebase/app';
import {
  EmailAuthProvider, GoogleAuthProvider, createUserWithEmailAndPassword, getAuth, linkWithCredential, linkWithPopup, onAuthStateChanged,
  sendPasswordResetEmail, signInAnonymously, signInWithCredential, signInWithEmailAndPassword, signInWithPopup, signOut, type User,
} from 'firebase/auth';
import { doc, getDoc, getFirestore, serverTimestamp, setDoc, Timestamp } from 'firebase/firestore';
import { firebaseConfig } from './firebase-config';
import { estJeuValide, VERSION_JEU } from '../core/jeu';
import type { Enveloppe } from '../save/local';

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
auth.languageCode = 'fr';
const db = getFirestore(app);

/** anonyme : le compte invisible créé au premier lancement, pas encore relié à Google ou à un e-mail */
type Utilisateur = { uid: string; nom: string; anonyme: boolean };

const versUtilisateur = (u: User): Utilisateur => ({ uid: u.uid, nom: u.displayName || u.email || 'Joueur', anonyme: u.isAnonymous });

let prevenir: ((u: Utilisateur | null) => void) | null = null;

/**
 * Le compte invisible (25 octobre 2026) : sans compte, le jeu en crée un anonyme tout seul, et la partie est sauvegardée en ligne
 * dès la première minute. Le relier plus tard à Google ou à un e-mail garde la même partie (même identifiant).
 * Si la connexion anonyme n'est pas activée dans Firebase, ou hors ligne, on reste sans compte, comme avant.
 */
export function surChangement(cb: (u: Utilisateur | null) => void): void {
  prevenir = cb;
  onAuthStateChanged(auth, (u) => {
    if (u) { cb(versUtilisateur(u)); return; }
    signInAnonymously(auth).catch(() => cb(null));
  });
}

/** relier le compte invisible ne change pas d'utilisateur : Firebase ne prévient pas, on le fait */
async function apresLiaison(): Promise<void> {
  await auth.currentUser?.reload();
  if (auth.currentUser) prevenir?.(versUtilisateur(auth.currentUser));
}

export async function connexionGoogle(): Promise<void> {
  const fournisseur = new GoogleAuthProvider();
  const u = auth.currentUser;
  if (!u?.isAnonymous) { await signInWithPopup(auth, fournisseur); return; }
  try {
    await linkWithPopup(u, fournisseur);
    await apresLiaison();
  } catch (e) {
    // ce compte Google a déjà une partie : on s'y connecte (la plus avancée des deux est gardée, l'autre part en secours)
    const deja = GoogleAuthProvider.credentialFromError(e as Parameters<typeof GoogleAuthProvider.credentialFromError>[0]);
    if ((e as { code?: string })?.code === 'auth/credential-already-in-use' && deja) await signInWithCredential(auth, deja);
    else throw e;
  }
}

export async function connexionEmail(email: string, mdp: string, creer: boolean): Promise<void> {
  const u = auth.currentUser;
  if (creer && u?.isAnonymous) {
    // créer un compte depuis le compte invisible : on le relie, la partie reste la même
    await linkWithCredential(u, EmailAuthProvider.credential(email, mdp));
    await apresLiaison();
  } else if (creer) await createUserWithEmailAndPassword(auth, email, mdp);
  else await signInWithEmailAndPassword(auth, email, mdp);
}

export async function motDePasseOublie(email: string): Promise<void> {
  await sendPasswordResetEmail(auth, email);
}

export async function deconnexion(): Promise<void> {
  await signOut(auth);
}

export async function lireDistante(uid: string): Promise<Enveloppe | null> {
  const snap = await getDoc(doc(db, 'saves', uid));
  if (!snap.exists()) return null;
  const d = snap.data() as { data: string; updatedAt: Timestamp | null };
  try {
    const data = JSON.parse(d.data);
    if (!estJeuValide(data)) return null;
    return { data, updatedAt: d.updatedAt ? d.updatedAt.toMillis() : 0 };
  } catch {
    return null;
  }
}

export async function ecrireDistante(uid: string, env: Enveloppe): Promise<void> {
  // Sauvegarde stockée en texte JSON : un seul champ, facile à faire évoluer avec `version`.
  await setDoc(doc(db, 'saves', uid), {
    data: JSON.stringify(env.data),
    updatedAt: serverTimestamp(),
    version: VERSION_JEU,
  });
}

/** Message lisible pour les erreurs Firebase courantes */
export function messageErreur(e: unknown): string {
  const code = (e as { code?: string })?.code ?? '';
  const m: Record<string, string> = {
    'auth/invalid-credential': 'E-mail ou mot de passe incorrect.',
    'auth/credential-already-in-use': 'Ce compte est déjà utilisé par une autre partie. Connecte-toi avec lui.',
    'auth/provider-already-linked': 'Ta partie est déjà reliée à ce compte.',
    'auth/invalid-email': 'Adresse e-mail invalide.',
    'auth/email-already-in-use': 'Un compte existe déjà avec cette adresse.',
    'auth/weak-password': 'Mot de passe trop court (6 caractères minimum).',
    'auth/popup-closed-by-user': 'Fenêtre de connexion fermée.',
    'auth/unauthorized-domain': 'Ce site n’est pas encore autorisé dans Firebase (Authentication › Paramètres › Domaines autorisés).',
    'auth/network-request-failed': 'Pas de connexion réseau.',
    'auth/popup-blocked': 'La fenêtre de connexion Google a été bloquée. Autorise les fenêtres pour ce site, ou ouvre le jeu dans Chrome.',
    'auth/cancelled-popup-request': 'Une autre fenêtre de connexion était déjà ouverte. Réessaie.',
    'auth/web-storage-unsupported': 'Ce navigateur bloque la connexion (stockage désactivé). Ouvre le jeu dans Chrome ou Safari.',
    'auth/operation-not-supported-in-this-environment': 'La connexion Google ne marche pas dans ce navigateur intégré. Ouvre le jeu dans Chrome ou Safari.',
  };
  // le code entre parenthèses permet de savoir ce qui bloque (une capture suffit)
  return m[code] ?? `La connexion a échoué. Réessaie dans un instant.${code ? ` (${code})` : ''}`;
}
