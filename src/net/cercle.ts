// Le Cercle des quais en ligne (3 novembre 2026) : les vitrines, les amitiés, les propositions d'échange et les défis en duel.
// Chargé à la demande (import dynamique), comme les autres modules en ligne. Les règles sont dans firestore.rules.
//
// - `profils/{uid}`       : la vitrine d'un directeur (pseudo, Strate, Porteur fétiche, cartes exposées, doubles, souhaits).
// - `amities/{a_b}`       : une amitié entre deux directeurs (identifiants triés) : demandée par l'un, acceptée par l'autre.
// - `echanges/{id}`       : une proposition d'échange entre amis : une carte contre une carte du même métal.
// - `defis/{id}`          : un défi en duel envoyé à un ami, avec le code du salon (`duels/{code}`, src/net/duel.ts).
// Chaque client applique lui-même à sa partie ce qui le concerne (src/core/partie/cercle.ts) ; un échange accepté n'est jamais appliqué deux fois.

import {
  collection, deleteDoc, doc, getDoc, getDocs, getFirestore, onSnapshot, query, runTransaction, setDoc, updateDoc, where, type Unsubscribe,
} from 'firebase/firestore';
import { getApp } from 'firebase/app';

const db = () => getFirestore(getApp());

export interface Profil {
  uid: string;
  nom: string;
  /** la clé du pseudo réservé */
  cle: string;
  strate: number;
  /** le Porteur fétiche */
  porteur: string;
  vitrine: { id: string; niveau: number }[];
  /** les exemplaires en double qu'il peut échanger */
  doubles: string[];
  souhaits: string[];
  /** niveau du Cercle */
  cercle: number;
  victoires: number;
  maj: number;
}

export interface Amitie {
  id: string;
  membres: [string, string];
  /** celui qui a demandé, et à qui */
  de: string;
  a: string;
  nomDe: string;
  nomA: string;
  etat: 'attente' | 'ok';
  le: number;
  /** quand l'amitié a été acceptée */
  depuis?: number;
}

export interface Proposition {
  id: string;
  de: string;
  a: string;
  nomDe: string;
  nomA: string;
  /** l'exemplaire que donne l'auteur, et celui qu'il demande */
  donne: string;
  demande: string;
  etat: 'propose' | 'accepte' | 'refuse' | 'annule';
  le: number;
  maj: number;
}

export interface Defi {
  id: string;
  de: string;
  a: string;
  nomDe: string;
  code: string;
  mode: 'libre' | 'egal';
  etat: 'envoye' | 'accepte' | 'refuse';
  le: number;
}

export const idAmitie = (x: string, y: string) => [x, y].sort().join('_');

// ---------- Les vitrines ----------

export async function publierProfil(p: Profil): Promise<void> {
  await setDoc(doc(db(), 'profils', p.uid), p);
}

export async function lireProfils(uids: string[]): Promise<Profil[]> {
  const l = await Promise.all(uids.map((u) => getDoc(doc(db(), 'profils', u)).catch(() => null)));
  return l.filter((d) => d?.exists()).map((d) => d!.data() as Profil);
}

/** Retrouve un directeur par son pseudo (la fiche `pseudos/{cle}`) */
export async function trouverParPseudo(cle: string): Promise<{ uid: string; nom: string } | null> {
  const d = await getDoc(doc(db(), 'pseudos', cle));
  return d.exists() ? (d.data() as { uid: string; nom: string }) : null;
}

// ---------- Les amitiés ----------

export async function demanderAmi(moi: string, monNom: string, lui: string, sonNom: string): Promise<'envoyee' | 'acceptee' | 'deja'> {
  const id = idAmitie(moi, lui);
  return runTransaction(db(), async (t) => {
    const ref = doc(db(), 'amities', id);
    const d = await t.get(ref);
    if (d.exists()) {
      const a = d.data() as Amitie;
      if (a.etat === 'ok') return 'deja';
      // il m'avait déjà demandé : on accepte
      if (a.a === moi) { t.update(ref, { etat: 'ok', depuis: Date.now() }); return 'acceptee'; }
      return 'deja';
    }
    const membres = [moi, lui].sort() as [string, string];
    const a: Amitie = { id, membres, de: moi, a: lui, nomDe: monNom, nomA: sonNom, etat: 'attente', le: Date.now() };
    t.set(ref, a);
    return 'envoyee';
  });
}

export async function accepterAmi(id: string): Promise<void> {
  await updateDoc(doc(db(), 'amities', id), { etat: 'ok', depuis: Date.now() });
}

export async function retirerAmi(id: string): Promise<void> {
  await deleteDoc(doc(db(), 'amities', id));
}

export function ecouterAmities(uid: string, cb: (l: Amitie[]) => void, erreur: (e: unknown) => void): Unsubscribe {
  return onSnapshot(query(collection(db(), 'amities'), where('membres', 'array-contains', uid)),
    (q) => cb(q.docs.map((d) => d.data() as Amitie)), erreur);
}

// ---------- Les échanges ----------

export async function proposer(p: Omit<Proposition, 'id' | 'etat' | 'le' | 'maj'>): Promise<string> {
  const ref = doc(collection(db(), 'echanges'));
  const maintenant = Date.now();
  await setDoc(ref, { ...p, id: ref.id, etat: 'propose', le: maintenant, maj: maintenant } satisfies Proposition);
  return ref.id;
}

/** Accepter ou refuser (le destinataire), annuler (l'auteur) : une seule fois, tant qu'elle est proposée */
export async function repondre(id: string, etat: 'accepte' | 'refuse' | 'annule'): Promise<boolean> {
  return runTransaction(db(), async (t) => {
    const ref = doc(db(), 'echanges', id);
    const d = await t.get(ref);
    if (!d.exists() || (d.data() as Proposition).etat !== 'propose') return false;
    t.update(ref, { etat, maj: Date.now() });
    return true;
  });
}

export async function effacerProposition(id: string): Promise<void> {
  await deleteDoc(doc(db(), 'echanges', id));
}

export function ecouterEchanges(uid: string, cb: (envoyees: Proposition[], recues: Proposition[]) => void, erreur: (e: unknown) => void): Unsubscribe {
  let env: Proposition[] = [], rec: Proposition[] = [];
  const a = onSnapshot(query(collection(db(), 'echanges'), where('de', '==', uid)), (q) => { env = q.docs.map((d) => d.data() as Proposition); cb(env, rec); }, erreur);
  const b = onSnapshot(query(collection(db(), 'echanges'), where('a', '==', uid)), (q) => { rec = q.docs.map((d) => d.data() as Proposition); cb(env, rec); }, erreur);
  return () => { a(); b(); };
}

// ---------- Les défis ----------

export async function defier(d: Omit<Defi, 'id' | 'etat' | 'le'>): Promise<string> {
  const ref = doc(collection(db(), 'defis'));
  await setDoc(ref, { ...d, id: ref.id, etat: 'envoye', le: Date.now() } satisfies Defi);
  return ref.id;
}

export async function repondreDefi(id: string, etat: 'accepte' | 'refuse'): Promise<void> {
  await updateDoc(doc(db(), 'defis', id), { etat });
}

export async function effacerDefi(id: string): Promise<void> {
  await deleteDoc(doc(db(), 'defis', id));
}

export function ecouterDefis(uid: string, cb: (envoyes: Defi[], recus: Defi[]) => void, erreur: (e: unknown) => void): Unsubscribe {
  let env: Defi[] = [], rec: Defi[] = [];
  const a = onSnapshot(query(collection(db(), 'defis'), where('de', '==', uid)), (q) => { env = q.docs.map((d) => d.data() as Defi); cb(env, rec); }, erreur);
  const b = onSnapshot(query(collection(db(), 'defis'), where('a', '==', uid)), (q) => { rec = q.docs.map((d) => d.data() as Defi); cb(env, rec); }, erreur);
  return () => { a(); b(); };
}

/** Les vieux défis et propositions finies, effacés par leur auteur */
export async function nettoyer(uid: string, avant: number): Promise<void> {
  const q1 = await getDocs(query(collection(db(), 'defis'), where('de', '==', uid)));
  for (const d of q1.docs) if ((d.data() as Defi).le < avant) await deleteDoc(d.ref).catch(() => {});
  const q2 = await getDocs(query(collection(db(), 'echanges'), where('de', '==', uid)));
  for (const d of q2.docs) { const p = d.data() as Proposition; if (p.etat !== 'propose' && p.maj < avant) await deleteDoc(d.ref).catch(() => {}); }
}
