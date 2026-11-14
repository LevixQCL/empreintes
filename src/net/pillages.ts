// Les pillages en ligne (26 octobre 2026) : chaque directeur publie sa garnison `garnisons/{uid}` (avec son pavillon et son
// Renom depuis le 14 novembre 2026) ; les autres lisent les plus récentes (une quarantaine de lectures, au plus toutes les 10 min) et notent chaque pillage joué
// dans `garnisons/{défenseur}/subis`. Le défenseur lit les siens à l'ouverture du jeu et les applique (subirPillages).
// Chargé avec compte.ts (import dynamique). Règles : firestore.rules (garnisonValide, subiValide).

import { collection, deleteDoc, doc, getDoc, getDocs, getFirestore, limit, orderBy, query, setDoc, where } from 'firebase/firestore';
import { getApp } from 'firebase/app';
import { cibleDe, type Cible, type Garnison, type PillageJoue, type PillageSubi } from '../core/jeu';

const db = () => getFirestore(getApp());

/** Ce qui est publié : la garnison, le nom affiché, la force (pour la requête) et l'heure */
export interface GarnisonPubliee extends Garnison { nom: string; force: number; maj: number }

export async function publierGarnison(uid: string, g: GarnisonPubliee): Promise<void> {
  await setDoc(doc(db(), 'garnisons', uid), {
    nom: g.nom, strate: g.strate, coffre: Math.floor(g.coffre), force: g.force, maj: g.maj,
    pavillon: g.pavillon === 'pirate' ? 'pirate' : 'neutre', renom: Math.max(0, Math.floor(g.renom ?? 0)),
    porteurs: g.porteurs.map((p) => ({ id: p.id, pv: p.pv, cartes: p.cartes.map((c) => ({ id: c.id, niveau: c.niveau })) })),
  });
}

/** Une garnison lue en ligne, vérifiée champ par champ (null si elle est incomplète) */
function garnisonDe(d: Record<string, unknown>): (Garnison & { nom: string }) | null {
  if (typeof d.nom !== 'string' || typeof d.strate !== 'number' || typeof d.coffre !== 'number' || !Array.isArray(d.porteurs)) return null;
  const porteurs = (d.porteurs as unknown[]).slice(0, 3).flatMap((p) => {
    const x = p as { id?: unknown; pv?: unknown; cartes?: unknown };
    if (typeof x.id !== 'string' || typeof x.pv !== 'number' || !Array.isArray(x.cartes)) return [];
    const cartes = (x.cartes as { id?: unknown; niveau?: unknown }[]).slice(0, 8)
      .filter((c) => typeof c.id === 'string' && typeof c.niveau === 'number').map((c) => ({ id: c.id as string, niveau: c.niveau as number }));
    return [{ id: x.id, pv: x.pv, cartes }];
  });
  if (!porteurs.length) return null;
  return { nom: d.nom, strate: d.strate, coffre: d.coffre, porteurs, pavillon: d.pavillon === 'pirate' ? 'pirate' : 'neutre', renom: typeof d.renom === 'number' ? d.renom : 0 };
}

/**
 * Les directeurs de la mer des piliers (14 novembre 2026, carte fixe) : les garnisons publiées le plus récemment, pirates et
 * neutres ; le jeu garde les plus proches. Une carte inconnue écarte la garnison.
 */
export async function lireCibles(uid: string, valide: (g: Garnison) => boolean, n = 40): Promise<Cible[]> {
  const snap = await getDocs(query(collection(db(), 'garnisons'), orderBy('maj', 'desc'), limit(n)));
  const l: Cible[] = [];
  snap.forEach((s) => {
    if (s.id === uid) return;
    const g = garnisonDe(s.data());
    if (g && valide(g)) l.push(cibleDe(s.id, g.nom, g));
  });
  return l;
}

/** La garnison d'un directeur précis (pour une revanche) ; null s'il n'en publie plus */
export async function lireGarnison(uid: string, valide: (g: Garnison) => boolean): Promise<Cible | null> {
  const s = await getDoc(doc(db(), 'garnisons', uid));
  if (!s.exists()) return null;
  const g = garnisonDe(s.data());
  return g && valide(g) ? cibleDe(uid, g.nom, g) : null;
}

/** Les pirates les plus redoutés : le classement du Renom */
export async function lireRenom(n = 15): Promise<{ id: string; nom: string; renom: number }[]> {
  const snap = await getDocs(query(collection(db(), 'garnisons'), orderBy('renom', 'desc'), limit(n)));
  const l: { id: string; nom: string; renom: number }[] = [];
  snap.forEach((s) => {
    const d = s.data();
    if (typeof d.nom === 'string' && typeof d.renom === 'number' && d.renom > 0) l.push({ id: s.id, nom: d.nom, renom: d.renom });
  });
  return l;
}

/** Les attaques qu'un archipel a subies ces dernières 24 h (pour son bouclier) */
export async function lireSubis(uid: string, depuis: number): Promise<PillageSubi[]> {
  const snap = await getDocs(query(collection(db(), 'garnisons', uid, 'subis'), where('le', '>=', depuis)));
  const l: PillageSubi[] = [];
  snap.forEach((s) => {
    const d = s.data();
    if (typeof d.nom === 'string' && typeof d.victoire === 'boolean' && typeof d.vol === 'number' && typeof d.perte === 'number' && typeof d.le === 'number') {
      l.push({ id: s.id, ...(typeof d.attaquant === 'string' ? { par: d.attaquant } : {}), nom: d.nom, victoire: d.victoire, vol: d.vol, perte: d.perte, le: d.le });
    }
  });
  return l;
}

/** Note un pillage joué dans les attaques subies du défenseur */
export async function envoyerPillage(uid: string, nom: string, p: PillageJoue): Promise<void> {
  const le = Date.now();
  // un identifiant par attaquant et par demi-journée (3 novembre 2026) : les règles refusent les rafales contre un même défenseur
  await setDoc(doc(db(), 'garnisons', p.cible, 'subis', `${uid}_${Math.floor(le / DEMI_JOURNEE)}`), { attaquant: uid, nom, victoire: p.victoire, vol: p.vol, perte: p.perte, le });
}
const DEMI_JOURNEE = 12 * 3_600_000;

/** Efface ses attaques subies trop anciennes (plus de deux jours) */
export async function nettoyerSubis(uid: string, avant: number): Promise<void> {
  const snap = await getDocs(query(collection(db(), 'garnisons', uid, 'subis'), where('le', '<', avant)));
  await Promise.all(snap.docs.map((s) => deleteDoc(s.ref)));
}
