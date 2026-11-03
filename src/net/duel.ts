// Le duel en temps réel en ligne (3 novembre 2026, pas encore branché au jeu : voir docs/duel.md).
//
// Un salon `duels/{code}` : l'hôte le crée avec son escouade et une graine, l'invité le rejoint avec la sienne (le code se partage entre amis).
// Chaque tour, chacun écrit dans `duels/{code}/choix/{tour}-{camp}` en deux temps, pour que personne ne puisse lire la chaîne de l'autre
// avant d'avoir verrouillé la sienne :
//   1. le sceau : l'empreinte SHA-256 de son choix (et d'un sel) ;
//   2. quand les deux sceaux sont posés, le choix lui-même, que l'autre vérifie contre le sceau.
// Les deux joueurs rejouent alors les deux choix sur le même état (core/duel.ts) : même graine, mêmes choix, même duel.
// Chargé à la demande (import dynamique), comme les autres modules en ligne. Les règles Firestore proposées sont dans docs/duel.md.

import {
  collection, doc, getFirestore, onSnapshot, runTransaction, setDoc, updateDoc, type Unsubscribe,
} from 'firebase/firestore';
import { getApp } from 'firebase/app';
import { validerEscouade, type Camp, type ChoixTour, type EscouadeDuel } from '../core/duel';

const db = () => getFirestore(getApp());

export interface JoueurSalon { uid: string; escouade: EscouadeDuel; mise: string | null }
export interface Salon {
  code: string;
  etat: 'attente' | 'en-cours' | 'fini';
  graine: number;
  hote: JoueurSalon;
  invite?: JoueurSalon;
  /** quand l'invité est arrivé (ms) : le premier tour commence là */
  debut?: number;
  /** le camp gagnant, le camp qui abandonne */
  gagnant?: Camp | null;
  abandon?: Camp;
  maj: number;
}

/** Ce que chaque joueur écrit pour un tour */
export interface ChoixEnLigne { uid: string; tour: number; camp: Camp; sceau: string; choix?: ChoixTour; sel?: string; le: number }

// sans 0, O, 1, I, L : un code qu'on se dicte sans se tromper
const LETTRES = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
export function nouveauCode(): string {
  const a = new Uint32Array(6);
  crypto.getRandomValues(a);
  return [...a].map((n) => LETTRES[n % LETTRES.length]).join('');
}

const hex = (b: ArrayBuffer) => [...new Uint8Array(b)].map((x) => x.toString(16).padStart(2, '0')).join('');
/** L'empreinte d'un choix : on ne peut ni la deviner, ni changer son choix après l'avoir posée */
export async function sceller(choix: ChoixTour, sel: string): Promise<string> {
  return hex(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(`${sel}|${JSON.stringify(choix)}`)));
}
export function nouveauSel(): string {
  const a = new Uint8Array(16);
  crypto.getRandomValues(a);
  return [...a].map((x) => x.toString(16).padStart(2, '0')).join('');
}

/** Crée un salon et renvoie son code */
export async function creerSalon(uid: string, escouade: EscouadeDuel, mise: string | null = null): Promise<string> {
  const v = validerEscouade(escouade);
  if (!v.ok) throw new Error(v.message);
  const code = nouveauCode();
  const graine = crypto.getRandomValues(new Uint32Array(1))[0]!;
  const s: Salon = { code, etat: 'attente', graine, hote: { uid, escouade, mise }, maj: Date.now() };
  await setDoc(doc(db(), 'duels', code), s);
  return code;
}

/** Rejoint le salon d'un ami (une seule fois : le premier qui rejoint prend la place) */
export async function rejoindreSalon(code: string, uid: string, escouade: EscouadeDuel, mise: string | null = null): Promise<Salon> {
  const v = validerEscouade(escouade);
  if (!v.ok) throw new Error(v.message);
  return runTransaction(db(), async (t) => {
    const ref = doc(db(), 'duels', code.trim().toUpperCase());
    const d = await t.get(ref);
    if (!d.exists()) throw new Error('Aucun duel ne porte ce code.');
    const s = d.data() as Salon;
    if (s.hote.uid === uid) throw new Error('C’est ton propre duel : partage le code à un ami.');
    if (s.etat !== 'attente' || s.invite) throw new Error('Ce duel a déjà commencé.');
    const maj = { invite: { uid, escouade, mise }, etat: 'en-cours' as const, debut: Date.now(), maj: Date.now() };
    t.update(ref, maj);
    return { ...s, ...maj };
  });
}

/** Suit le salon (arrivée de l'invité, fin, abandon) */
export function ecouterSalon(code: string, cb: (s: Salon | null) => void): Unsubscribe {
  return onSnapshot(doc(db(), 'duels', code), (d) => cb(d.exists() ? (d.data() as Salon) : null));
}

/** Suit les choix des deux joueurs, tour après tour */
export function ecouterChoix(code: string, cb: (l: ChoixEnLigne[]) => void): Unsubscribe {
  return onSnapshot(collection(db(), 'duels', code, 'choix'), (q) => cb(q.docs.map((d) => d.data() as ChoixEnLigne)));
}

const refChoix = (code: string, tour: number, camp: Camp) => doc(db(), 'duels', code, 'choix', `${tour}-${camp}`);

/** Étape 1 : poser son sceau (le choix reste secret) */
export async function poserSceau(code: string, uid: string, tour: number, camp: Camp, sceau: string): Promise<void> {
  const c: ChoixEnLigne = { uid, tour, camp, sceau, le: Date.now() };
  await setDoc(refChoix(code, tour, camp), c);
}

/** Étape 2 : révéler son choix, une fois les deux sceaux posés */
export async function reveler(code: string, tour: number, camp: Camp, choix: ChoixTour, sel: string): Promise<void> {
  await updateDoc(refChoix(code, tour, camp), { choix, sel });
}

/** Le duel est fini : on le note (chacun l'écrit, le même résultat) */
export async function finirSalon(code: string, gagnant: Camp | null): Promise<void> {
  await updateDoc(doc(db(), 'duels', code), { etat: 'fini', gagnant, maj: Date.now() });
}

/** Abandonner (ou constater l'absence de l'adversaire au-delà de la grâce : `camp` est alors celui de l'absent) */
export async function abandonnerSalon(code: string, camp: Camp): Promise<void> {
  await updateDoc(doc(db(), 'duels', code), { etat: 'fini', abandon: camp, gagnant: camp === 0 ? 1 : 0, maj: Date.now() });
}
