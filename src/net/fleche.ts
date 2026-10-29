// La Flèche en ligne (29 octobre 2026) : le directeur qui tient un quai publie sa garnison figée dans `quais/{uid}` ;
// celui qui monte de ce quai la lit (une requête sur le numéro du quai) et note l'assaut joué dans
// `quais/{gardien}/assauts`. Le gardien lit les siens à l'ouverture du jeu et les applique (subirAssauts).
// Chargé à la demande (import dynamique). Règles : firestore.rules (quaiValide, assautValide).

import { addDoc, collection, deleteDoc, doc, getDocs, getFirestore, limit, query, setDoc, where } from 'firebase/firestore';
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

/**
 * Le directeur qui tient un quai : le plus ancien installé, s'il n'a pas déjà été délogé depuis
 * (un délogé garde sa fiche tant qu'il n'a pas rouvert le jeu). `valide` écarte les garnisons que ce jeu ne sait pas jouer.
 */
export async function lireGardien(uid: string, quai: number, valide: (g: Garnison, force: number) => boolean): Promise<GardienQuai | null> {
  const snap = await getDocs(query(collection(db(), 'quais'), where('quai', '==', quai), limit(8)));
  const l: (GardienQuai & { depuis: number })[] = [];
  snap.forEach((s) => {
    if (s.id === uid) return;
    const d = s.data();
    if (typeof d.nom !== 'string' || typeof d.force !== 'number' || typeof d.depuis !== 'number' || !Array.isArray(d.porteurs)) return;
    const porteurs = (d.porteurs as { id?: unknown; pv?: unknown; cartes?: unknown }[]).slice(0, 3).flatMap((p) =>
      typeof p.id === 'string' && typeof p.pv === 'number' && Array.isArray(p.cartes)
        ? [{ id: p.id, pv: p.pv, cartes: (p.cartes as { id?: unknown; niveau?: unknown }[]).filter((c) => typeof c.id === 'string' && typeof c.niveau === 'number').slice(0, 8).map((c) => ({ id: c.id as string, niveau: c.niveau as number })) }]
        : []);
    if (porteurs.length !== 3 || !valide({ porteurs, strate: 1, coffre: 0 }, d.force)) return;
    l.push({ id: s.id, nom: d.nom, quai, porteurs: porteurs.map((p) => p.id), force: d.force, depuis: d.depuis });
  });
  for (const g of l.sort((a, b) => a.depuis - b.depuis)) {
    const perdus = await getDocs(query(collection(db(), 'quais', g.id, 'assauts'), where('victoire', '==', true), limit(5)));
    if (perdus.docs.some((s) => (s.data().le ?? 0) >= g.depuis)) continue;
    const { depuis: _, ...gardien } = g;
    return gardien;
  }
  return null;
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

export async function envoyerAssaut(uid: string, nom: string, a: AssautJoue): Promise<void> {
  await addDoc(collection(db(), 'quais', a.cible, 'assauts'), { attaquant: uid, nom, quai: a.quai, victoire: a.victoire, le: Date.now() });
}

/** Efface ses assauts subis trop anciens (plus de deux jours) */
export async function nettoyerAssauts(uid: string, avant: number): Promise<void> {
  const snap = await getDocs(query(collection(db(), 'quais', uid, 'assauts'), where('le', '<', avant)));
  await Promise.all(snap.docs.map((s) => deleteDoc(s.ref)));
}
