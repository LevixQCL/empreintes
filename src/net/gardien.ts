// Le Gardien de la ville, côté réseau (13 novembre 2026). Chargé à la demande, après compte.ts qui initialise Firebase.
// - `gardien/{semaine}` : la jauge de la ville (PV, parts, directeurs, fil des dernières frappes), écrite par le serveur seul.
// - `compterFrappes` : la fonction serveur qui rejoue les combats envoyés et inscrit les parts (functions/gardien.js).

import { getApp } from 'firebase/app';
import { doc, getDoc, getFirestore } from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { REGION_FONCTIONS } from './vente';
import type { FrappeGardien, VilleGardien } from '../core/jeu';

/** La jauge de la ville pour une semaine (null : personne n'a encore frappé) */
export async function lireVille(semaine: number): Promise<VilleGardien | null> {
  const snap = await getDoc(doc(getFirestore(getApp()), 'gardien', String(semaine)));
  if (!snap.exists()) return null;
  const d = snap.data() as Partial<VilleGardien>;
  return { semaine, pv: Number(d.pv) || 40, parts: Number(d.parts) || 0, frappeurs: Number(d.frappeurs) || 0, fil: Array.isArray(d.fil) ? d.fil.slice(0, 12) : [] };
}

export interface ReponseFrappes { semaine: number; parts: number; acceptees: number; refus: string[]; ville: VilleGardien }

/** Envoie les frappes jouées : le serveur les rejoue et rend ses parts et la jauge de la ville */
export async function envoyerFrappes(frappes: FrappeGardien[]): Promise<ReponseFrappes> {
  const f = httpsCallable<{ frappes: FrappeGardien[] }, ReponseFrappes>(getFunctions(getApp(), REGION_FONCTIONS), 'compterFrappes');
  return (await f({ frappes })).data;
}
