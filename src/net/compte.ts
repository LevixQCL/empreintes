// Comptes et synchronisation de la sauvegarde avec Firestore.
// Chargé seulement si Firebase est configuré (import dynamique), pour que le jeu hors ligne reste léger.

import { initializeApp } from 'firebase/app';
import {
  GoogleAuthProvider, createUserWithEmailAndPassword, getAuth, onAuthStateChanged,
  sendPasswordResetEmail, signInWithEmailAndPassword, signInWithPopup, signOut, type User,
} from 'firebase/auth';
import { doc, getDoc, getFirestore, serverTimestamp, setDoc, Timestamp } from 'firebase/firestore';
import { firebaseConfig } from './firebase-config';
import { estJeuValide, VERSION_JEU } from '../core/jeu';
import type { Enveloppe } from '../save/local';

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
auth.languageCode = 'fr';
const db = getFirestore(app);

type Utilisateur = { uid: string; nom: string };

const versUtilisateur = (u: User): Utilisateur => ({ uid: u.uid, nom: u.displayName || u.email || 'Joueur' });

export function surChangement(cb: (u: Utilisateur | null) => void): void {
  onAuthStateChanged(auth, (u) => cb(u ? versUtilisateur(u) : null));
}

export async function connexionGoogle(): Promise<void> {
  await signInWithPopup(auth, new GoogleAuthProvider());
}

export async function connexionEmail(email: string, mdp: string, creer: boolean): Promise<void> {
  if (creer) await createUserWithEmailAndPassword(auth, email, mdp);
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
