// Couche 2 — les statistiques de la partie (25 octobre 2026), pour équilibrer le jeu avec de vrais joueurs.
// Ce sont de petits compteurs rangés dans la sauvegarde : ils partent avec elle, sans aucun envoi en plus.
// L'outil d'analyse (analyse.html) les lit ; le jeu, lui, ne les affiche jamais.

import { analyserChaine } from '../regles';
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
  /** temps actif par heure de la journée (heure de l'appareil), en secondes : 24 cases */
  heures?: number[];
  /** durée des dernières sessions, en secondes (les 30 plus récentes) */
  durees?: number[];
  /** le temps de jeu (secondes) au moment où chaque étape est atteinte pour la première fois : « strate-3 », « noyau-4 », « chambre »… */
  jalons?: Record<string, number>;
  /** par Porteur : [expéditions, gardien vaincu] */
  porteurs?: Record<string, [number, number]>;
  /** chaînes lancées, par nombre de cartes (index = longueur) et par longueur de la meilleure suite */
  chaines?: number[];
  suites?: number[];
  /** combien de fois chaque bouton du jeu a été utilisé (data-action) : l'usage de chaque fonction */
  actions?: Record<string, number>;
  /** Coups d'éclat déclenchés, par lignée ; « tech-decharge » : un Débridage avec des cartes à Décharge dans le deck
   *  (27 octobre 2026 : le Moteur fait-il oublier le Débridage ?) */
  eclats?: Record<string, number>;
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
  const durees = (s.durees ??= []);
  if (now - s.vu > SESSION) {
    s.sessions++;
    durees.push(0);
    if (durees.length > 30) durees.shift();
  }
  if (!durees.length) durees.push(0);
  durees[durees.length - 1]!++;
  const jour = jourDe(now);
  if (s.jours[s.jours.length - 1] !== jour) s.jours.push(jour);
  s.secondes++;
  s.vu = now;
  s.appareil = o.appareil;
  s.compte = o.compte;
  const heures = (s.heures ??= Array<number>(24).fill(0));
  heures[new Date(now).getHours()]!++;
  noterJalons(j, s);
}

/** Les étapes de la partie : le temps de jeu qu'il a fallu pour y arriver (seulement la première fois) */
function noterJalons(j: Jeu, s: Stats): void {
  const jalons = (s.jalons ??= {});
  const atteint = (cle: string) => { if (jalons[cle] === undefined) jalons[cle] = s.secondes; };
  if (j.introVue) atteint('intro');
  if (j.chambre) atteint('chambre');
  if (j.recrues) atteint('recrues');
  for (let n = 2; n <= j.strate; n++) atteint(`strate-${n}`);
  for (let n = 2; n <= j.batiments.noyau; n++) atteint(`noyau-${n}`);
}

/** Un bouton du jeu utilisé */
export function noterAction(j: Jeu, action: string): void {
  const actions = (statsDe(j).actions ??= {});
  actions[action] = (actions[action] ?? 0) + 1;
}

/** Une chaîne lancée : les cartes qu'elle contenait */
export function noterChaine(j: Jeu, chaine: Geste[]): void {
  const s = statsDe(j);
  for (const g of chaine) s.cartes[g.id] = (s.cartes[g.id] ?? 0) + 1;
  const chaines = (s.chaines ??= []);
  chaines[chaine.length] = (chaines[chaine.length] ?? 0) + 1;
  const suite = analyserChaine(chaine).suite;
  const suites = (s.suites ??= []);
  suites[suite] = (suites[suite] ?? 0) + 1;
}

/** Un Coup d'éclat : sa lignée, et si le deck porte des cartes à Décharge (le Moteur) */
export function noterEclat(j: Jeu, c: CombatEtat, lignee: string): void {
  const e = (statsDe(j).eclats ??= {});
  e[lignee] = (e[lignee] ?? 0) + 1;
  const decharge = [...c.pioche, ...c.defausse, ...c.main, ...c.chaine].some((g) => g.effet?.type === 'decharge' || g.effet2?.type === 'decharge');
  if (decharge) e[`${lignee}-decharge`] = (e[`${lignee}-decharge`] ?? 0) + 1;
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
export function noterExpedition(j: Jeu, strate: number, fin: 'gardien' | 'defaite' | 'fuite' | 'retraite' | 'autre', escouade: string[] = []): void {
  const s = statsDe(j);
  const porteurs = (s.porteurs ??= {});
  for (const id of escouade) {
    const p = (porteurs[id] ??= [0, 0]);
    p[0]++;
    if (fin === 'gardien') p[1]++;
  }
  const t = (s.strates[strate] ??= [0, 0, 0, 0, 0]);
  t[0]++;
  if (fin === 'gardien') t[1]++;
  else if (fin === 'defaite') t[2]++;
  else if (fin === 'fuite') t[3]++;
  else if (fin === 'retraite') t[4]++;
}
