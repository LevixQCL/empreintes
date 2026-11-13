// Le Gardien de la ville, côté serveur (13 novembre 2026). Ce fichier est empaqueté pour les Cloud Functions
// (npm run serveur → functions/gardien-core.js) : functions/gardien.js lui passe la sauvegarde du joueur et ses frappes,
// il rejoue chaque combat avec le moteur du jeu et rend les parts à inscrire. Il ne touche jamais au réseau.
// Le téléphone ne dit jamais combien il a frappé : il envoie de quoi rejouer le combat, et le serveur compte lui-même.

import { estJeuValide } from '../core/partie/nouvelle';
import { semaineDe, debutJour, strateVaincue, type Jeu } from '../core/partie/etat';
import { departValide, frappesPermises, pvDeLaVille, rejouerGardien, type FrappeGardien } from '../core/partie/gardien';

/** Ce que le serveur garde pour un directeur, la semaine en cours (gardien/{semaine}/directeurs/{uid}) */
export interface FicheDirecteur {
  parts: number;
  frappes: number;
  meilleure: number;
  /** les frappes déjà comptées (leur graine et leur heure) : une frappe envoyée deux fois ne compte qu'une fois */
  vues: string[];
}

export interface BilanFrappes {
  /** la fiche mise à jour du directeur */
  fiche: FicheDirecteur;
  /** les parts ajoutées à la ville */
  ajout: number;
  /** frappes acceptées / refusées (et pourquoi) */
  acceptees: number;
  refus: string[];
  /** la Strate du directeur (pour le fil des frappes) */
  strate: number;
}

/** Lit la partie telle que le jeu la sauve (un texte JSON) ; null si elle est illisible */
export function lirePartie(texte: unknown): Jeu | null {
  if (typeof texte !== 'string' || texte.length > 900_000) return null;
  try {
    const j = JSON.parse(texte) as unknown;
    return estJeuValide(j) ? (j as Jeu) : null;
  } catch {
    return null;
  }
}

export { frappesPermises };

/** Compte les frappes envoyées par un directeur : rejeu, vérification du départ contre sa sauvegarde, doublons, plafonds */
export function compterFrappes(partie: Jeu, frappes: unknown, fiche: FicheDirecteur | null, now: number): BilanFrappes {
  const semaine = semaineDe(now);
  const f: FicheDirecteur = fiche ? { ...fiche, vues: [...fiche.vues] } : { parts: 0, frappes: 0, meilleure: 0, vues: [] };
  const refus: string[] = [];
  let ajout = 0;
  let acceptees = 0;
  const liste = Array.isArray(frappes) ? (frappes as FrappeGardien[]).slice(0, 6) : [];
  for (const x of liste) {
    if (!x || typeof x !== 'object' || !x.depart || !Array.isArray(x.journal)) { refus.push('Frappe illisible.'); continue; }
    if (x.semaine !== semaine) { refus.push('Frappe d’une autre semaine.'); continue; }
    if (typeof x.le !== 'number' || x.le < debutJour(semaine * 7) || x.le > now + 60_000) { refus.push('Heure impossible.'); continue; }
    if (x.journal.length > 400) { refus.push('Combat trop long.'); continue; }
    const cle = `${x.depart.rng}:${x.le}`;
    if (f.vues.includes(cle)) continue;
    if (f.frappes >= frappesPermises(now)) { refus.push('Plus de frappes que de tentatives.'); continue; }
    const pb = departValide(partie, x.depart, semaine);
    if (pb) { refus.push(pb); continue; }
    const r = rejouerGardien(x.depart, x.journal);
    if (!r.ok) { refus.push(r.message); continue; }
    f.vues.push(cle);
    f.frappes++;
    f.parts = Math.round((f.parts + r.parts) * 10) / 10;
    f.meilleure = Math.max(f.meilleure, r.parts);
    ajout += r.parts;
    acceptees++;
  }
  return { fiche: f, ajout: Math.round(ajout * 10) / 10, acceptees, refus, strate: strateVaincue(partie) };
}

/** Les PV de la ville pour une nouvelle semaine : 4 parts par directeur qui a frappé la semaine d'avant, 40 au moins */
export { semaineDe };

export const pvVille = pvDeLaVille;
