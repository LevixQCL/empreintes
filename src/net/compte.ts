// Comptes et synchronisation de la sauvegarde avec Firestore.
// Chargé seulement si Firebase est configuré (import dynamique), pour que le jeu hors ligne reste léger.

import { initializeApp } from 'firebase/app';
import {
  EmailAuthProvider, GoogleAuthProvider, createUserWithEmailAndPassword, getAuth, linkWithCredential, linkWithPopup, onAuthStateChanged,
  deleteUser, sendPasswordResetEmail, signInAnonymously, signInWithCredential, signInWithEmailAndPassword, signInWithPopup, signOut, type User,
} from 'firebase/auth';
import { collection, deleteDoc, doc, getDoc, getDocs, getFirestore, query, runTransaction, Timestamp, where, type DocumentReference, type Query } from 'firebase/firestore';
import { activerAppCheck } from './app-check';
import { firebaseConfig } from './firebase-config';
import { estJeuValide, VERSION_JEU } from '../core/jeu';
import type { Enveloppe } from '../save/local';
import { decisionEcriture, prochainJeton, versionDe } from '../save/garde';

const app = initializeApp(firebaseConfig);
// App Check avant toute requête (net/app-check.ts)
activerAppCheck(app);
const auth = getAuth(app);
auth.languageCode = 'fr';
const db = getFirestore(app);

/** anonyme : le compte invisible créé au premier lancement, pas encore relié à Google ou à un e-mail */
/** verifie : relié à Google, ou à un e-mail vérifié (le parrainage ne rapporte qu'à partir de là, firestore.rules) */
/** via et email : avec quoi le joueur est connecté, rappelé dans le panneau Compte (9 novembre 2026) */
type Utilisateur = { uid: string; nom: string; anonyme: boolean; verifie: boolean; via?: 'google' | 'email'; email?: string };

const versUtilisateur = (u: User): Utilisateur => ({ uid: u.uid, nom: u.displayName || u.email || 'Joueur', anonyme: u.isAnonymous,
  verifie: !u.isAnonymous && (u.emailVerified || u.providerData.some((p) => p.providerId === 'google.com')),
  via: u.providerData.some((p) => p.providerId === 'google.com') ? 'google' : u.providerData.some((p) => p.providerId === 'password') ? 'email' : undefined,
  email: u.email ?? u.providerData.find((p) => p.email)?.email ?? undefined });

let prevenir: ((u: Utilisateur | null) => void) | null = null;

/**
 * Le compte invisible (25 octobre 2026) : sans compte, le jeu en crée un anonyme tout seul, et la partie est sauvegardée en ligne
 * dès que le joueur a vraiment commencé (intro vue) : une simple visite (robot, aperçu de lien) ne crée plus de compte.
 * Le relier plus tard à Google ou à un e-mail garde la même partie (même identifiant).
 * Si la connexion anonyme n'est pas activée dans Firebase, ou hors ligne, on reste sans compte, comme avant.
 */
export function surChangement(cb: (u: Utilisateur | null) => void, commence: () => boolean): void {
  prevenir = cb;
  onAuthStateChanged(auth, (u) => {
    if (u) { cb(versUtilisateur(u)); return; }
    if (commence()) creerInvisible();
    else cb(null);
  });
}

let invisibleDemande = false;

/** crée le compte invisible (une seule tentative par lancement) */
export function creerInvisible(): void {
  if (auth.currentUser || invisibleDemande) return;
  invisibleDemande = true;
  signInAnonymously(auth).catch(() => prevenir?.(null));
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

/** La suppression demande une connexion récente (règle de sécurité de Google) : il faut se reconnecter puis recommencer */
export class ReconnexionRequise extends Error {}

/**
 * Supprimer son compte et toutes ses données en ligne (RGPD, 8 novembre 2026) : la sauvegarde, l'entrée du Grand Tableau,
 * le pseudo, la garnison et la garde de la Flèche (avec ce qu'on y a subi), la vitrine, les amitiés, les échanges et défis,
 * le code de parrainage et sa fiche de filleul, les salons de duel ouverts ; puis le compte lui-même.
 * pseudo : la clé du pseudo réservé ; code : son code de parrainage.
 */
export async function supprimerCompte(pseudo: string | null, code: string | null): Promise<void> {
  const u = auth.currentUser;
  if (!u) return;
  const uid = u.uid;
  // vérifier d'abord que Google accepte la suppression maintenant : sinon on garderait un compte vide
  const derniere = Date.parse(u.metadata.lastSignInTime ?? '') || 0;
  if (!u.isAnonymous && Date.now() - derniere > 4 * 60_000) throw new ReconnexionRequise();
  const effacer = (ref: DocumentReference) => deleteDoc(ref).catch(() => {});
  const effacerTous = async (q: Query) => {
    const snap = await getDocs(q).catch(() => null);
    await Promise.all((snap?.docs ?? []).map((d) => effacer(d.ref)));
  };
  await Promise.all([
    effacerTous(query(collection(db, 'garnisons', uid, 'subis'))),
    effacerTous(query(collection(db, 'quais', uid, 'assauts'))),
    effacerTous(query(collection(db, 'amities'), where('membres', 'array-contains', uid))),
    effacerTous(query(collection(db, 'echanges'), where('de', '==', uid))),
    // les propositions reçues portent aussi son pseudo (8 novembre 2026, après-midi) ; un échange accepté depuis moins
    // de 7 jours reste (firestore.rules : l'effacer rendrait la carte à son auteur)
    effacerTous(query(collection(db, 'echanges'), where('a', '==', uid))),
    effacerTous(query(collection(db, 'defis'), where('de', '==', uid))),
    effacerTous(query(collection(db, 'defis'), where('a', '==', uid))),
    effacerTous(query(collection(db, 'duels'), where('hote.uid', '==', uid))),
  ]);
  // le classement d'abord : la fiche de recrue ne s'efface qu'une fois le classement parti (firestore.rules)
  await effacer(doc(db, 'classement', uid));
  await Promise.all([
    effacer(doc(db, 'garnisons', uid)), effacer(doc(db, 'quais', uid)),
    effacer(doc(db, 'profils', uid)), effacer(doc(db, 'recrues', uid)),
    pseudo ? effacer(doc(db, 'pseudos', pseudo)) : null,
    code ? effacer(doc(db, 'parrains', code)) : null,
  ]);
  await deleteDoc(doc(db, 'saves', uid));
  try { await deleteUser(u); } catch (e) {
    if ((e as { code?: string })?.code === 'auth/requires-recent-login') throw new ReconnexionRequise();
    throw e;
  }
}

/** Ce que contient le compte : la partie (si elle est lisible par cette version), le jeton de la dernière écriture,
 *  et si elle vient d'une version plus récente du jeu (alors on ne la touche pas) */
export interface Distante {
  env: Enveloppe | null;
  jeton: number | null;
  tropRecente: boolean;
  /** une partie est sur le compte mais cette version ne sait pas la lire : on ne l'écrase surtout pas */
  illisible?: boolean;
}

const millis = (t: unknown): number | null => (t instanceof Timestamp ? t.toMillis() : null);

export async function lireDistante(uid: string): Promise<Distante> {
  const snap = await getDoc(doc(db, 'saves', uid));
  if (!snap.exists()) return { env: null, jeton: null, tropRecente: false };
  const d = snap.data() as { data: string; updatedAt: unknown; version?: number };
  const jeton = millis(d.updatedAt);
  if ((d.version ?? 0) > VERSION_JEU) return { env: null, jeton, tropRecente: true };
  try {
    const data = JSON.parse(d.data);
    if (versionDe(data) > VERSION_JEU) return { env: null, jeton, tropRecente: true };
    if (!estJeuValide(data)) return { env: null, jeton, tropRecente: false, illisible: true };
    return { env: { data, updatedAt: jeton ?? 0 }, jeton, tropRecente: false };
  } catch {
    return { env: null, jeton, tropRecente: false, illisible: true };
  }
}

/** L'écriture est refusée : `code` dit pourquoi (une version plus récente du jeu, ou un autre appareil a écrit entre-temps) */
export class RefusEcriture extends Error {
  constructor(readonly code: 'trop-recente' | 'autre-appareil') { super(code); }
}

/**
 * Écrit la partie sur le compte, seulement si personne d'autre n'a écrit depuis `attendu` (le jeton lu ou écrit en dernier).
 * Une transaction : la lecture du jeton et l'écriture ne peuvent pas être séparées par l'écriture d'un autre appareil.
 * Renvoie le nouveau jeton.
 */
export async function ecrireDistante(uid: string, env: Enveloppe, attendu: number | null | undefined): Promise<number> {
  const ref = doc(db, 'saves', uid);
  return runTransaction(db, async (t) => {
    const snap = await t.get(ref);
    const d = snap.exists() ? (snap.data() as { updatedAt?: unknown; version?: number }) : null;
    const actuel = d ? millis(d.updatedAt) : null;
    const decision = decisionEcriture({ existe: !!d, version: d?.version ?? 0, jeton: actuel }, attendu);
    if (decision !== 'ecrire') throw new RefusEcriture(decision);
    const jeton = prochainJeton(actuel, Date.now());
    // Sauvegarde stockée en texte JSON : un seul champ, facile à faire évoluer avec `version`.
    // updatedAt sert aussi de jeton d'écriture (heure de l'appareil, toujours croissante pour ce document).
    t.set(ref, { data: JSON.stringify(env.data), updatedAt: Timestamp.fromMillis(jeton), version: VERSION_JEU });
    return jeton;
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
