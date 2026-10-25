// Couche 2 — les statistiques de la partie (25 octobre 2026), pour équilibrer le jeu avec de vrais joueurs.
// Ce sont de petits compteurs rangés dans la sauvegarde : ils partent avec elle, sans aucun envoi en plus.
// L'outil d'analyse (analyse.html) les lit ; le jeu, lui, ne les affiche jamais.

import type { CombatEtat, Geste } from '../types';
import { jourDe, type Jeu } from './etat';

export interface Stats {
  /** le premier jour de jeu (jourDe) et tous les jours où l'on a joué : la rétention se calcule avec */
  premierJour: number;
  jours: number[];
  /** une session = un retour après plus d'une demi-heure sans rien toucher */
  sessions: number;
  /** temps de jeu actif (écran affiché, joueur qui touche), en secondes */
  secondes: number;
  /** dernière activité, en ms */
  vu: number;
  appareil?: 'telephone' | 'pc';
  compte?: 'aucun' | 'invisible' | 'protege';
  /** par ennemi : [victoires, défaites, fuites, tours joués] */
  ennemis: Record<string, [number, number, number, number]>;
  /** par Strate : [expéditions, gardien vaincu, défaites, fuites, retraites] */
  strates: Record<string, [number, number, number, number, number]>;
  /** combien de fois chaque carte a été lancée dans une chaîne (id de la carte, tous métaux confondus) */
  cartes: Record<string, number>;
}

const SESSION = 30 * 60_000;

/** Les statistiques de la partie (créées au premier besoin : les anciennes sauvegardes n'en ont pas) */
function statsDe(j: Jeu, now = Date.now()): Stats {
  j.stats ??= { premierJour: jourDe(now), jours: [], sessions: 0, secondes: 0, vu: 0, ennemis: {}, strates: {}, cartes: {} };
  return j.stats;
}

/** Chaque seconde (l'horloge de l'application) : sessions, jours joués, temps actif */
export function noterTemps(j: Jeu, now: number, o: { actif: boolean; appareil: Stats['appareil']; compte: Stats['compte'] }): void {
  if (!o.actif) return;
  const s = statsDe(j, now);
  if (now - s.vu > SESSION) s.sessions++;
  const jour = jourDe(now);
  if (s.jours[s.jours.length - 1] !== jour) s.jours.push(jour);
  s.secondes++;
  s.vu = now;
  s.appareil = o.appareil;
  s.compte = o.compte;
}

/** Une chaîne lancée : les cartes qu'elle contenait */
export function noterChaine(j: Jeu, chaine: Geste[]): void {
  const s = statsDe(j);
  for (const g of chaine) s.cartes[g.id] = (s.cartes[g.id] ?? 0) + 1;
}

/** La fin d'un combat (victoire ou défaite), ou une fuite : contre qui, et en combien de tours */
export function noterCombat(j: Jeu, c: CombatEtat, issue: 'victoire' | 'defaite' | 'fuite'): void {
  const s = statsDe(j);
  for (const e of [c.ennemi, ...(c.autres ?? [])]) {
    const t = (s.ennemis[e.id] ??= [0, 0, 0, 0]);
    t[issue === 'victoire' ? 0 : issue === 'defaite' ? 1 : 2]++;
    t[3] += c.tour;
  }
}

/** Le retour d'une expédition dans une Strate */
export function noterExpedition(j: Jeu, strate: number, fin: 'gardien' | 'defaite' | 'fuite' | 'retraite' | 'autre'): void {
  const t = (statsDe(j).strates[strate] ??= [0, 0, 0, 0, 0]);
  t[0]++;
  if (fin === 'gardien') t[1]++;
  else if (fin === 'defaite') t[2]++;
  else if (fin === 'fuite') t[3]++;
  else if (fin === 'retraite') t[4]++;
}
