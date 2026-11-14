// Les Confluences en ligne (14 novembre 2026) : l'alliance, ses membres, le quai de discussion et les demandes de copies.
// Chargé à la demande, comme le Cercle. Les règles sont dans firestore.rules. Rien ne s'écoute hors de l'écran du Cercle
// (offre gratuite de Firebase : chaque lecture compte).
//
// - `confluences/{id}`                  : l'alliance (nom, devise, pavillon, membres, Courant de la semaine et de toujours).
//                                          L'identifiant est le nom réduit : un nom ne sert qu'une fois.
// - `confluences/{id}/membres/{uid}`    : la fiche d'un directeur dans l'alliance (son apport de la semaine, ses dons).
// - `confluences/{id}/messages/{auto}`  : le quai : messages libres, messages rapides (par numéro) et événements (par code).
// - `confluences/{id}/demandes/{uid}`   : la demande de copies en cours de chaque directeur (une seule, remplacée par la suivante).
// - `adhesions/{uid}`                   : la Confluence d'un directeur (une seule à la fois).

import {
  collection, deleteDoc, doc, getDoc, getDocs, getFirestore, limit, limitToLast, onSnapshot, orderBy, query, runTransaction,
  writeBatch, type Unsubscribe,
} from 'firebase/firestore';
import { getApp } from 'firebase/app';

const db = () => getFirestore(getApp());

export interface Confluence {
  id: string;
  nom: string;
  devise: string;
  embleme: number;
  couleur: number;
  /** ouverte : tout directeur peut entrer ; fermée : plus personne */
  ouverte: boolean;
  fondateur: string;
  membres: string[];
  anciens: string[];
  bannis: string[];
  /** le Courant de la semaine `semaineC`, et celui de toujours */
  courant: number;
  semaineC: number;
  total: number;
  le: number;
  maj: number;
}

export interface Membre {
  uid: string;
  nom: string;
  porteur: string;
  strate: number;
  /** l'apport de la semaine `semaine`, et les dons faits cette semaine */
  apport: number;
  dons: number;
  semaine: number;
  /** le dernier message envoyé (contre les rafales) */
  dernierMsg: number;
  le: number;
  maj: number;
}

export type SorteMessage = 'texte' | 'rapide' | 'evenement';
export interface Message {
  id: string;
  de: string;
  nom: string;
  sorte: SorteMessage;
  /** le texte (message libre), le numéro du message rapide, ou le code de l'événement */
  texte: string;
  /** pour un événement : la carte et un nombre */
  carte?: string;
  n?: number;
  /** pour un don : le directeur qui reçoit */
  pour?: string;
  le: number;
}

export interface Demande {
  uid: string;
  nom: string;
  carte: string;
  voulu: number;
  recu: number;
  donneurs: string[];
  le: number;
  maj: number;
}

const conf = (id: string) => doc(db(), 'confluences', id);

// ---------- Lire ----------

export async function lireConfluence(id: string): Promise<Confluence | null> {
  const d = await getDoc(conf(id));
  return d.exists() ? (d.data() as Confluence) : null;
}

/** Les Confluences les plus fortes (le classement, et celles qui recrutent) */
export async function lireConfluences(n = 30): Promise<Confluence[]> {
  const q = await getDocs(query(collection(db(), 'confluences'), orderBy('total', 'desc'), limit(n)));
  return q.docs.map((d) => d.data() as Confluence);
}

export async function lireAdhesion(uid: string): Promise<string | null> {
  const d = await getDoc(doc(db(), 'adhesions', uid));
  return d.exists() ? String((d.data() as { confluence: string }).confluence) : null;
}

export async function lireMembres(id: string): Promise<Membre[]> {
  const q = await getDocs(collection(db(), 'confluences', id, 'membres'));
  return q.docs.map((d) => d.data() as Membre);
}

// ---------- Écouter (seulement l'écran ouvert) ----------

export function ecouterConfluence(id: string, cb: (c: Confluence | null) => void, err: (e: unknown) => void): Unsubscribe {
  return onSnapshot(conf(id), (d) => cb(d.exists() ? (d.data() as Confluence) : null), err);
}
export function ecouterMembres(id: string, cb: (l: Membre[]) => void, err: (e: unknown) => void): Unsubscribe {
  return onSnapshot(collection(db(), 'confluences', id, 'membres'), (q) => cb(q.docs.map((d) => d.data() as Membre)), err);
}
export function ecouterDemandes(id: string, cb: (l: Demande[]) => void, err: (e: unknown) => void): Unsubscribe {
  return onSnapshot(collection(db(), 'confluences', id, 'demandes'), (q) => cb(q.docs.map((d) => d.data() as Demande)), err);
}
/** Les 40 derniers messages du quai */
export function ecouterMessages(id: string, cb: (l: Message[]) => void, err: (e: unknown) => void): Unsubscribe {
  return onSnapshot(query(collection(db(), 'confluences', id, 'messages'), orderBy('le'), limitToLast(40)),
    (q) => cb(q.docs.map((d) => ({ ...(d.data() as Omit<Message, 'id'>), id: d.id }))), err);
}

// ---------- Fonder, entrer, sortir ----------

type FicheMembre = Pick<Membre, 'uid' | 'nom' | 'porteur' | 'strate'>;
const ficheNeuve = (m: FicheMembre, semaine: number, now: number): Membre => ({ ...m, apport: 0, dons: 0, semaine, dernierMsg: 0, le: now, maj: now });

/** Fonder : le nom doit être libre ; la Confluence, la fiche du fondateur et son adhésion sont écrites ensemble */
export async function fonder(c: Pick<Confluence, 'id' | 'nom' | 'devise' | 'embleme' | 'couleur'>, m: FicheMembre, semaine: number): Promise<'ok' | 'pris'> {
  return runTransaction(db(), async (t) => {
    const ref = conf(c.id);
    if ((await t.get(ref)).exists()) return 'pris';
    const now = Date.now();
    t.set(ref, { ...c, ouverte: true, fondateur: m.uid, membres: [m.uid], anciens: [], bannis: [], courant: 0, semaineC: semaine, total: 0, le: now, maj: now } satisfies Confluence);
    t.set(doc(db(), 'confluences', c.id, 'membres', m.uid), ficheNeuve(m, semaine, now));
    t.set(doc(db(), 'adhesions', m.uid), { confluence: c.id, le: now });
    t.set(doc(collection(db(), 'confluences', c.id, 'messages')), { de: m.uid, nom: m.nom, sorte: 'evenement', texte: 'fondee', le: now });
    return 'ok';
  });
}

/** Entrer dans une Confluence ouverte et pas pleine */
export async function rejoindre(id: string, m: FicheMembre, semaine: number, max: number): Promise<'ok' | 'pleine' | 'fermee' | 'absente'> {
  return runTransaction(db(), async (t) => {
    const ref = conf(id);
    const d = await t.get(ref);
    if (!d.exists()) return 'absente';
    const c = d.data() as Confluence;
    if (!c.ouverte || c.bannis.includes(m.uid)) return 'fermee';
    if (c.membres.includes(m.uid)) return 'ok';
    if (c.membres.length >= max) return 'pleine';
    const now = Date.now();
    t.update(ref, { membres: [...c.membres, m.uid], maj: now });
    t.set(doc(db(), 'confluences', id, 'membres', m.uid), ficheNeuve(m, semaine, now));
    t.set(doc(db(), 'adhesions', m.uid), { confluence: id, le: now });
    t.set(doc(collection(db(), 'confluences', id, 'messages')), { de: m.uid, nom: m.nom, sorte: 'evenement', texte: 'arrivee', le: now });
    return 'ok';
  });
}

/**
 * Sortir. Le fondateur passe d'abord le flambeau au directeur qui a le plus apporté (un ancien en priorité) ;
 * seul, il dissout la Confluence.
 */
export async function quitter(id: string, uid: string, nom: string, successeur: string | null): Promise<void> {
  const now = Date.now();
  await runTransaction(db(), async (t) => {
    const ref = conf(id);
    const d = await t.get(ref);
    if (!d.exists()) return;
    const c = d.data() as Confluence;
    const reste = c.membres.filter((x) => x !== uid);
    if (!reste.length) { t.delete(ref); }
    else {
      const maj: Partial<Confluence> = { membres: reste, anciens: c.anciens.filter((x) => x !== uid), maj: now };
      if (c.fondateur === uid) maj.fondateur = successeur && reste.includes(successeur) ? successeur : reste[0]!;
      t.update(ref, maj);
      t.set(doc(collection(db(), 'confluences', id, 'messages')), { de: uid, nom, sorte: 'evenement', texte: 'depart', le: now });
    }
    t.delete(doc(db(), 'confluences', id, 'membres', uid));
    t.delete(doc(db(), 'confluences', id, 'demandes', uid));
  });
  await deleteDoc(doc(db(), 'adhesions', uid)).catch(() => {});
}

// ---------- Le fondateur ----------

export async function regler(id: string, r: Partial<Pick<Confluence, 'devise' | 'ouverte' | 'embleme' | 'couleur'>>): Promise<void> {
  await writeBatch(db()).update(conf(id), { ...r, maj: Date.now() }).commit();
}

/** Nommer ou défaire un ancien (il peut accueillir et modérer le quai) */
export async function basculerAncien(id: string, uid: string): Promise<void> {
  await runTransaction(db(), async (t) => {
    const ref = conf(id);
    const c = (await t.get(ref)).data() as Confluence;
    const anciens = c.anciens.includes(uid) ? c.anciens.filter((x) => x !== uid) : [...c.anciens, uid].slice(0, 6);
    t.update(ref, { anciens, maj: Date.now() });
  });
}

/** Écarter un directeur (il ne pourra plus revenir) */
export async function ecarter(id: string, uid: string): Promise<void> {
  await runTransaction(db(), async (t) => {
    const ref = conf(id);
    const c = (await t.get(ref)).data() as Confluence;
    t.update(ref, { membres: c.membres.filter((x) => x !== uid), anciens: c.anciens.filter((x) => x !== uid), bannis: [...c.bannis, uid].slice(-30), maj: Date.now() });
    t.delete(doc(db(), 'confluences', id, 'membres', uid));
    t.delete(doc(db(), 'confluences', id, 'demandes', uid));
  });
}

// ---------- Le Courant ----------

/** Publier son apport de la semaine : sa fiche, et l'écart ajouté au Courant de la Confluence */
export async function publierApport(id: string, m: FicheMembre & { apport: number; dons: number }, ecart: number, semaine: number): Promise<void> {
  await runTransaction(db(), async (t) => {
    const ref = conf(id);
    const d = await t.get(ref);
    if (!d.exists()) return;
    const c = d.data() as Confluence;
    const now = Date.now();
    const plus = Math.max(0, Math.min(200, ecart));
    t.update(ref, { courant: (c.semaineC === semaine ? c.courant : 0) + plus, semaineC: semaine, total: c.total + plus, maj: now });
    t.update(doc(db(), 'confluences', id, 'membres', m.uid), { nom: m.nom, porteur: m.porteur, strate: m.strate, apport: m.apport, dons: m.dons, semaine, maj: now });
  });
}

// ---------- Le quai ----------

/** Écrire sur le quai (la fiche du membre garde l'heure du message : une rafale est refusée par les règles) */
export async function ecrire(id: string, uid: string, nom: string, sorte: SorteMessage, texte: string, extra: { carte?: string; n?: number } = {}): Promise<void> {
  const now = Date.now();
  const b = writeBatch(db());
  b.set(doc(collection(db(), 'confluences', id, 'messages')), { de: uid, nom, sorte, texte, ...extra, le: now });
  b.update(doc(db(), 'confluences', id, 'membres', uid), { dernierMsg: now, maj: now });
  await b.commit();
}

export async function effacerMessage(id: string, msg: string): Promise<void> {
  await deleteDoc(doc(db(), 'confluences', id, 'messages', msg));
}

// ---------- Les demandes de copies ----------

export async function demander(id: string, d: Pick<Demande, 'uid' | 'nom' | 'carte' | 'voulu' | 'le'>): Promise<void> {
  const b = writeBatch(db());
  b.set(doc(db(), 'confluences', id, 'demandes', d.uid), { ...d, recu: 0, donneurs: [], maj: d.le } satisfies Demande);
  b.set(doc(collection(db(), 'confluences', id, 'messages')), { de: d.uid, nom: d.nom, sorte: 'evenement', texte: 'demande', carte: d.carte, n: d.voulu, le: d.le });
  await b.commit();
}

/** Donner une copie : une seule à la fois, tant que la demande n'est pas remplie (false : déjà remplie ou disparue) */
export async function donner(id: string, pour: string, uid: string, nom: string): Promise<{ carte: string; nomPour: string } | null> {
  return runTransaction(db(), async (t) => {
    const ref = doc(db(), 'confluences', id, 'demandes', pour);
    const d = await t.get(ref);
    if (!d.exists()) return null;
    const x = d.data() as Demande;
    if (x.recu >= x.voulu || x.uid === uid) return null;
    const now = Date.now();
    t.update(ref, { recu: x.recu + 1, donneurs: [...x.donneurs, uid], maj: now });
    t.set(doc(collection(db(), 'confluences', id, 'messages')), { de: uid, nom, sorte: 'evenement', texte: 'don', carte: x.carte, n: 1, le: now, pour: x.nom });
    return { carte: x.carte, nomPour: x.nom };
  });
}
