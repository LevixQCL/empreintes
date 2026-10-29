// La Flèche en ligne (29 octobre 2026) : le directeur qui tient un quai publie sa garnison figée dans `quais/{uid}` ;
// les autres lisent les gardiens (les plus hauts, et ceux à leur portée), et celui qui défie note le défi joué dans
// `quais/{gardien}/assauts` (le vainqueur efface la fiche du battu). Le gardien lit les siens à l'ouverture du jeu et les applique (subirAssauts).
// Chargé à la demande (import dynamique). Règles : firestore.rules (quaiValide, assautValide).

import { addDoc, collection, deleteDoc, doc, getDocs, getFirestore, limit, orderBy, query, setDoc, where } from 'firebase/firestore';
import { getApp } from 'firebase/app';
import type { AssautJoue, AssautSubi, Garnison, GardienQuai } from '../core/jeu';

const db = () => getFirestore(getApp());

export interface GardePubliee { nom: string; quai: number; force: number; depuis: number; garnison: Garnison }

export async function publierGarde(uid: string, g: GardePubliee): Promise<void> {
  await setDoc(doc(db(), 'quais', uid), {
    nom: g.nom, quai: g.quai, force: g.force, depuis: g.depuis, maj: Date.now(),
    porteurs: g.garnison.porteurs.map((p) => ({ id: p.id, pv: p.pv, cartes: p.cartes.map((c) => ({ id: c.id, niveau: c.niveau })) })),
  });
}

export async function retirerGarde(uid: string): Promise<void> {
  await deleteDoc(doc(db(), 'quais', uid));
}

/** Les gardiens lus en ligne : un seul par quai (le premier installé) */
export type GardienLu = GardienQuai & { depuis: number };


function gardiensDe(docs: { id: string; data: () => Record<string, unknown> }[], uid: string, valide: (g: Garnison, force: number) => boolean): GardienLu[] {
  const l: GardienLu[] = [];
  for (const s of docs) {
    if (s.id === uid) continue;
    const d = s.data();
    if (typeof d.nom !== 'string' || typeof d.quai !== 'number' || typeof d.force !== 'number' || typeof d.depuis !== 'number' || !Array.isArray(d.porteurs)) continue;
    const porteurs = (d.porteurs as { id?: unknown; pv?: unknown; cartes?: unknown }[]).slice(0, 3).flatMap((p) =>
      typeof p.id === 'string' && typeof p.pv === 'number' && Array.isArray(p.cartes)
        ? [{ id: p.id, pv: p.pv, cartes: (p.cartes as { id?: unknown; niveau?: unknown }[]).filter((c) => typeof c.id === 'string' && typeof c.niveau === 'number').slice(0, 8).map((c) => ({ id: c.id as string, niveau: c.niveau as number })) }]
        : []);
    if (porteurs.length !== 3 || !valide({ porteurs, strate: 1, coffre: 0 }, d.force)) continue;
    l.push({ id: s.id, nom: d.nom, quai: d.quai, porteurs: porteurs.map((p) => p.id), force: d.force, depuis: d.depuis });
  }
  // un seul gardien par quai : le premier installé
  return l.sort((a, b) => b.quai - a.quai || a.depuis - b.depuis).filter((g, i, t) => i === 0 || t[i - 1]!.quai !== g.quai);
}

/**
 * Les gardiens de la Flèche : les plus hauts (le classement), et ceux à portée (quais déjà atteints : le défi
 * et les quais libres). Un gardien battu disparaît aussitôt : le vainqueur efface sa fiche.
 */
export async function lireGardiens(uid: string, max: number, valide: (g: Garnison, force: number) => boolean): Promise<{ top: GardienLu[]; portee: GardienLu[] }> {
  const [top, portee] = await Promise.all([
    getDocs(query(collection(db(), 'quais'), orderBy('quai', 'desc'), limit(12))),
    max >= 2 ? getDocs(query(collection(db(), 'quais'), where('quai', '<=', max), orderBy('quai', 'desc'), limit(25))) : Promise.resolve(null),
  ]);
  return { top: gardiensDe(top.docs, '', valide), portee: portee ? gardiensDe(portee.docs, uid, valide) : [] };
}

export async function lireAssauts(uid: string, depuis: number): Promise<AssautSubi[]> {
  const snap = await getDocs(query(collection(db(), 'quais', uid, 'assauts'), where('le', '>=', depuis)));
  const l: AssautSubi[] = [];
  snap.forEach((s) => {
    const d = s.data();
    if (typeof d.nom === 'string' && typeof d.quai === 'number' && typeof d.victoire === 'boolean' && typeof d.le === 'number') {
      l.push({ id: s.id, nom: d.nom, quai: d.quai, victoire: d.victoire, le: d.le });
    }
  });
  return l;
}

/**
 * Note un défi chez le gardien. Une victoire porte un identifiant fixe (attaquant + installation du gardien) : c'est
 * ce qui permet au vainqueur d'effacer la fiche du battu (firestore.rules), pour qu'il disparaisse aussitôt de la Flèche.
 */
export async function envoyerAssaut(uid: string, nom: string, a: AssautJoue): Promise<void> {
  const d = { attaquant: uid, nom, quai: a.quai, victoire: a.victoire, le: Date.now() };
  if (!a.victoire || a.depuis === undefined) { await addDoc(collection(db(), 'quais', a.cible, 'assauts'), d); return; }
  await setDoc(doc(db(), 'quais', a.cible, 'assauts', `${uid}_${a.depuis}`), d);
  await deleteDoc(doc(db(), 'quais', a.cible)).catch(() => {});
}

/** Efface ses assauts subis trop anciens (plus de deux jours) */
export async function nettoyerAssauts(uid: string, avant: number): Promise<void> {
  const snap = await getDocs(query(collection(db(), 'quais', uid, 'assauts'), where('le', '<', avant)));
  await Promise.all(snap.docs.map((s) => deleteDoc(s.ref)));
}
