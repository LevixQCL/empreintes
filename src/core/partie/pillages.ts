// Couche 5 bis — les pillages (26 octobre 2026, décidé avec Bryan) : l'escouade attaque l'archipel d'un autre directeur,
// défendu par sa garnison (ses Porteurs et leurs cartes) que le jeu joue à sa place. Une victoire rapporte des composants,
// plus une part du coffre du défenseur ; une défaite en laisse une part du sien.
// Le « coffre » : les composants gagnés en pillant ou en défendant. Ce sont les seuls qu'un pillage peut prendre :
// ceux des descentes, des missions et du district sont toujours à l'abri (aucune punition si on ne joue pas).
// On dépense le coffre en premier : il ne dépasse jamais les composants qu'on a.
// Fonctions pures : le temps est toujours passé en paramètre (`now`, en ms).

import { porteurDef } from '../donnees';
import { creerCombat } from '../combat';
import { puissanceCarte } from '../collection';
import { nouvelleExpedition } from '../expedition';

/** Un combat de référence pour les pillages : 6 composants × (1 + 0,25 × (Strate − 1)). Gardé tel quel quand les combats des Strates
 *  sont passés à 8 (30 octobre 2026), pour ne pas changer l'équilibre des pillages */
const butinCombat = (strate: number, _index: 0) => Math.round(6 * (1 + 0.25 * (strate - 1)));
import { graine, tireur } from '../rng';
import type { Lignee } from '../types';
import { CONFIANCE, XP, energieParHeure, bonusPv, confier, jourDe, escouadeDefense, escouadesDe, gagnerXp, log, niveauPorteur, non, porteursPresents, pvNiveau, strateVaincue, usureAuRetour, type Jeu, type Resultat } from './etat';
import { escouadePrete, payerRatelier, remonter as remonterDescente, type Retour } from './descentes';
import { quitterPostes } from './recompenses';

export const PILLAGE = {
  /** jetons de pillage : 5 au plus, un revient toutes les 4 h 48 (5 par jour) ; rien ne se perd pendant l'absence */
  jetonsMax: 5,
  rechargeMs: (24 * 3_600_000) / 5,
  /** un jeton de plus contre de l'énergie (idée de Luc, 31 octobre 2026) : 4 h de production du Générateur, 2 fois par jour au plus */
  achatHeures: 4,
  achatsJour: 2,
  /** les pillages s'ouvrent après la première Strate vaincue */
  strateMin: 1,
  /** butin de base d'une victoire : autant que ce nombre de combats de la Strate du défenseur (butinCombat) */
  combats: 2,
  /** part du coffre du défenseur prise par une victoire, plafonnée à `plafondVol` combats de sa Strate */
  partVolee: 0.1,
  plafondVol: 5,
  /** part de son propre coffre que l'attaquant laisse au défenseur quand il perd */
  perteDefaite: 0.05,
  /** le défenseur : bouclier de 8 h après une attaque perdue, 3 attaques subies par jour au plus */
  bouclierMs: 8 * 3_600_000,
  subiesMax: 3,
  /**
   * La force des gardes : K × √(puissance des cartes × PV de la garnison). Réglé au robot (26 octobre 2026) :
   * le joueur moyen qui attaque sa propre garnison gagne une fois sur deux, du deck de départ aux cartes en or niveau 10
   * (K mesuré entre 0,0235 et 0,0263 selon le deck ; refait après la Fêlure du 26 octobre).
   */
  K: 0.0245,
  /**
   * Chances du joueur moyen selon l'écart de force (force des gardes / force de l'escouade) : très tranchées,
   * 98 % à 0,85, 82 % à 0,92, 50 % à 1, 18 % à 1,08, presque rien à 1,2 (mesuré au robot, courbe logistique)
   */
  pente: 0.055,
  /** le butin suit l'écart : ×0,4 contre bien plus faible, ×1 à égalité, ×2 contre plus fort ; le meilleur gain moyen est à égalité */
  multPente: 8,
  multMin: 0.4,
  multMax: 2,
  /** les cibles proposées : de 0,85 à 1,15 fois la force de l'escouade */
  ecartMin: 0.85,
  ecartMax: 1.15,
  /** archipels proposés sur la carte */
  cibles: 6,
} as const;

// ---------- La garnison : ce qu'un directeur publie pour être pillé ----------

export interface Garnison {
  /** les trois Porteurs de l'escouade, leurs PV (niveau compris, sans l'Usure) et leurs cartes */
  porteurs: { id: string; pv: number; cartes: { id: string; niveau: number }[] }[];
  /** la Strate la plus profonde vaincue : elle fixe le butin */
  strate: number;
  /** le coffre au moment de la publication (composants qu'un pillage peut prendre) */
  coffre: number;
}

/** La garnison d'un district : l'escouade choisie pour défendre le port (complétée par les premiers Porteurs présents) */
export function garnisonDe(j: Jeu): Garnison {
  const presents = porteursPresents(j);
  const ids = [...new Set([...escouadesDe(j)[escouadeDefense(j)]!, ...presents])].slice(0, 3);
  return {
    porteurs: ids.map((id) => ({
      id,
      pv: pvNiveau(j, id) + bonusPv(j, id),
      cartes: (j.porteurs[id]?.modules ?? []).filter((k) => j.collection[k]).map((k) => ({ id: k, niveau: j.collection[k]!.niveau })),
    })),
    strate: Math.max(1, strateVaincue(j)),
    coffre: Math.floor(etatPillage(j).coffre),
  };
}

/** La force d'une garnison (ou d'une escouade) : K × √(puissance des cartes × PV) */
export function forceGarnison(g: Pick<Garnison, 'porteurs'>): number {
  const p = g.porteurs.reduce((n, x) => n + x.cartes.reduce((m, c) => m + puissanceCarte(c.id, c.niveau), 0), 0);
  const pv = g.porteurs.reduce((n, x) => n + x.pv, 0);
  return Math.round(PILLAGE.K * Math.sqrt(Math.max(1, p) * Math.max(1, pv)) * 1000) / 1000;
}

/** La force de l'escouade qui part piller (mêmes règles que la garnison, Usure comprise) */
export function forceEscouade(j: Jeu, escouade: string[]): number {
  return forceGarnison({
    porteurs: escouade.map((id) => ({
      id,
      pv: Math.max(1, pvNiveau(j, id) + bonusPv(j, id) - Math.floor(j.porteurs[id]?.usure ?? 0)),
      cartes: (j.porteurs[id]?.modules ?? []).filter((k) => j.collection[k]).map((k) => ({ id: k, niveau: j.collection[k]!.niveau })),
    })),
  });
}

/** Les chances du joueur moyen selon l'écart de force (gardes / escouade) */
export const chanceVictoire = (ecart: number) => 1 / (1 + Math.exp((ecart - 1) / PILLAGE.pente));

/** Le multiplicateur du butin selon l'écart de force */
export const multButin = (ecart: number) => Math.min(PILLAGE.multMax, Math.max(PILLAGE.multMin, 1 + PILLAGE.multPente * (ecart - 1)));

/** Ce qu'un pillage gagné rapporte : la base (créée par le jeu) et la part prise au coffre du défenseur */
export function butinPillage(cible: { strate: number; coffre: number }, ecart: number): { base: number; vol: number } {
  const unCombat = butinCombat(Math.max(1, cible.strate), 0);
  return {
    base: Math.round(PILLAGE.combats * unCombat * multButin(ecart)),
    vol: Math.min(Math.floor(Math.max(0, cible.coffre) * PILLAGE.partVolee), PILLAGE.plafondVol * unCombat),
  };
}

/** Une appréciation lisible de l'écart, pour la carte */
export function difficulte(ecart: number): { nom: string; niveau: 1 | 2 | 3 | 4 } {
  const c = chanceVictoire(ecart);
  if (c >= 0.85) return { nom: 'Facile', niveau: 1 };
  if (c >= 0.5) return { nom: 'Équilibré', niveau: 2 };
  if (c >= 0.15) return { nom: 'Risqué', niveau: 3 };
  return { nom: 'Redoutable', niveau: 4 };
}

/** Choisit l'escouade qui garde le port (27 octobre 2026). Possible à tout moment, même pendant une descente :
 * la garnison ne quitte pas le district, elle se défend seule. */
export function choisirDefense(j: Jeu, n: number): Resultat {
  if (!Number.isInteger(n) || n < 0 || n >= escouadesDe(j).length) return non('Escouade inconnue.');
  if (!escouadesDe(j)[n]!.length) return non('Cette escouade est vide : choisis-lui d’abord des Porteurs.');
  j.escouadeDefense = n;
  log(j, `L’escouade ${n + 1} garde désormais le port.`);
  return { ok: true };
}

// ---------- L'état du joueur : jetons et coffre ----------

/** Un pillage joué, à envoyer au défenseur (le réseau s'en charge ; rien pour un archipel sans directeur) */
export interface PillageJoue { cible: string; victoire: boolean; vol: number; perte: number; le: number }

export interface EtatPillage {
  /** composants gagnés en pillant ou en défendant : les seuls qu'un pillage peut prendre */
  coffre: number;
  jetons: number;
  /** quand le dernier jeton compté est revenu */
  jetonsLe: number;
  gagnes: number;
  perdus: number;
  /** les pillages joués contre de vrais directeurs, en attente d'envoi */
  aEnvoyer: PillageJoue[];
  /** les jetons achetés avec l'énergie, et le jour de ces achats */
  achats?: { jour: number; n: number };
  /** les archipels déjà attaqués aujourd'hui (un seul pillage par archipel et par jour), et ce jour */
  faits?: string[];
  jour?: number;
  /** le journal du port (27 octobre 2026) : les derniers pillages faits et subis, du plus récent au plus ancien */
  historique?: EntreeHistorique[];
  /** les attaques subies déjà comptées (deux jours) : pour le bouclier, et pour ne rien compter deux fois */
  recus?: { id: string; victoire: boolean; le: number; refusee?: boolean }[];
}

/** Une ligne du journal du port, vue du joueur : `gagne` dit s'il l'a emporté, `composants` ce que son coffre a gagné (+) ou perdu (−) */
export interface EntreeHistorique {
  sens: 'attaque' | 'defense';
  nom: string;
  gagne: boolean;
  composants: number;
  le: number;
  /** un archipel sans directeur (attaque seulement) */
  bot?: boolean;
  /** une attaque subie sans effet : bouclier levé ou trois attaques déjà reçues ce jour-là */
  refusee?: boolean;
}

/** Les lignes gardées dans le journal du port */
export const HISTORIQUE_MAX = 30;

/** Ajoute une ligne au journal du port (les plus récentes d'abord) */
export function noterHistorique(j: Jeu, e: EntreeHistorique) {
  const h = (etatPillage(j).historique ??= []);
  h.push(e);
  h.sort((a, b) => b.le - a.le);
  h.length = Math.min(h.length, HISTORIQUE_MAX);
}

export function etatPillage(j: Jeu): EtatPillage {
  j.pillage ??= { coffre: 0, jetons: PILLAGE.jetonsMax, jetonsLe: j.dernierTick, gagnes: 0, perdus: 0, aEnvoyer: [] };
  // on dépense le coffre en premier : il ne dépasse jamais les composants qu'on a
  j.pillage.coffre = Math.max(0, Math.min(j.pillage.coffre, j.composants));
  return j.pillage;
}

/** Les jetons revenus depuis la dernière fois ; renvoie l'heure du prochain (null s'ils sont tous là) */
export function majJetons(j: Jeu, now: number): number | null {
  const e = etatPillage(j);
  if (e.jetons >= PILLAGE.jetonsMax) { e.jetonsLe = now; return null; }
  const n = Math.floor(Math.max(0, now - e.jetonsLe) / PILLAGE.rechargeMs);
  if (n > 0) {
    e.jetons = Math.min(PILLAGE.jetonsMax, e.jetons + n);
    e.jetonsLe = e.jetons >= PILLAGE.jetonsMax ? now : e.jetonsLe + n * PILLAGE.rechargeMs;
  }
  return e.jetons >= PILLAGE.jetonsMax ? null : e.jetonsLe + PILLAGE.rechargeMs;
}

// ---------- Les cibles ----------

export interface Cible {
  /** l'uid du directeur, ou « bot-… » pour un archipel sans directeur */
  id: string;
  nom: string;
  /** archipel sans directeur, tenu par un intendant (le jeu le fabrique : la carte n'est jamais vide) */
  bot?: boolean;
  /** les Porteurs de la garnison (lignées et portraits des gardes) */
  porteurs: string[];
  force: number;
  strate: number;
  coffre: number;
}

/** Les archipels attaqués aujourd'hui (la liste repart à zéro chaque jour) */
export function faitsDuJour(j: Jeu, now: number): string[] {
  const e = etatPillage(j);
  const jour = jourDe(now);
  if (e.jour !== jour) { e.jour = jour; e.faits = []; }
  return (e.faits ??= []);
}

/**
 * Les archipels de la carte : les vrais directeurs à portée d'abord, complétés par des archipels sans directeur,
 * rangés du plus facile au plus dur pour l'escouade qui part. Ceux déjà attaqués aujourd'hui restent visibles (marqués).
 */
export function ciblesDuJour(j: Jeu, escouade: string[], now: number, enLigne: Cible[] = []): Cible[] {
  const force = forceEscouade(j, escouade);
  const aPortee = enLigne.filter((c) => c.force >= force * PILLAGE.ecartMin && c.force <= force * PILLAGE.ecartMax).slice(0, PILLAGE.cibles);
  const bots = ciblesBots(j, force, jourDe(now), PILLAGE.cibles - aPortee.length);
  return [...aPortee, ...bots].sort((a, b) => a.force - b.force);
}

/** Une cible à partir de la garnison publiée d'un directeur */
export const cibleDe = (id: string, nom: string, g: Garnison): Cible =>
  ({ id, nom, porteurs: g.porteurs.map((p) => p.id), force: forceGarnison(g), strate: g.strate, coffre: g.coffre });

const NOMS_BOTS = ['Haut-Treuil', 'Cendrevigne', 'Ancrefroide', 'Verrelune', 'Salvebrume', 'Pilier-Gris', 'Brisecôte', 'Les Pontons d’Ambre', 'Lierre-Haut', 'Quai Sourd', 'Vasque-Morte', 'Givrecorde'];

/**
 * Les archipels sans directeur du jour : de 0,85 à 1,15 fois la force de l'escouade, renouvelés chaque jour
 * (les mêmes toute la journée). Ils complètent la carte tant qu'il y a peu de vrais directeurs à portée.
 */
export function ciblesBots(j: Jeu, force: number, jour: number, n: number): Cible[] {
  const t = tireur({ rng: (jour * 2654435761) >>> 0 });
  const lignees: Record<Lignee, string[]> = { tech: [], bio: [], reso: [] };
  for (const id of porteursPresents(j)) lignees[porteurDef(id).lignee].push(id);
  const tous = ['ilka', 'doran', 'vela', ...porteursPresents(j)];
  const noms = t.melanger(NOMS_BOTS);
  const r: Cible[] = [];
  for (let k = 0; k < n; k++) {
    // des écarts répartis sur toute la plage, du plus facile au plus dur
    const ecart = PILLAGE.ecartMin + ((k + t.nombre()) / n) * (PILLAGE.ecartMax - PILLAGE.ecartMin);
    const porteurs = t.melanger([...new Set(tous)]).slice(0, 3);
    const strate = Math.max(1, strateVaincue(j));
    r.push({
      id: `bot-${jour}-${k}`, nom: noms[k % noms.length]!, bot: true, porteurs,
      force: Math.round(force * ecart * 1000) / 1000, strate,
      coffre: Math.round(butinCombat(strate, 0) * (2 + 4 * t.nombre())),
    });
  }
  return r;
}

// ---------- Le pillage ----------

/** Un pillage en cours (dans l'expédition) */
export interface PillageEnCours {
  cible: string;
  nom: string;
  bot?: boolean;
  ecart: number;
  base: number;
  vol: number;
}

/** Ce que coûte un jeton de pillage en énergie : quelques heures de production du Générateur, arrondi à la dizaine */
export const coutJeton = (j: Jeu) => Math.max(60, Math.round((energieParHeure(j) * PILLAGE.achatHeures) / 10) * 10);

/** Les jetons qu'on peut encore acheter aujourd'hui */
export function achatsRestants(j: Jeu, now: number): number {
  const a = etatPillage(j).achats;
  return Math.max(0, PILLAGE.achatsJour - (a && a.jour === jourDe(now) ? a.n : 0));
}

/** Acheter un jeton de pillage avec l'énergie du Générateur */
export function acheterJeton(j: Jeu, now: number): Resultat {
  majJetons(j, now);
  const e = etatPillage(j);
  if (j.batiments.generateur < 1) return non('Le Générateur est à l’arrêt.');
  if (e.jetons >= PILLAGE.jetonsMax) return non('Tous tes jetons sont déjà là.');
  if (achatsRestants(j, now) < 1) return non(`Déjà ${PILLAGE.achatsJour} jetons achetés aujourd’hui : reviens demain.`);
  const cout = coutJeton(j);
  if (j.energie < cout) return non(`Il faut ${cout} énergie pour armer une barque de plus.`);
  j.energie -= cout;
  const jour = jourDe(now);
  e.achats = { jour, n: (e.achats?.jour === jour ? e.achats.n : 0) + 1 };
  e.jetons++;
  if (e.jetons >= PILLAGE.jetonsMax) e.jetonsLe = now;
  return { ok: true, message: 'Le Générateur charge une barque de plus : +1 jeton de pillage.' };
}

export function peutPiller(j: Jeu, now: number): Resultat {
  if (strateVaincue(j) < PILLAGE.strateMin) return non('Les pillages s’ouvrent après la première Strate vaincue.');
  if (j.expedition) return non('Une expédition est déjà en cours.');
  majJetons(j, now);
  if (etatPillage(j).jetons < 1) return non('Plus de jeton de pillage : le prochain revient bientôt.');
  return { ok: true };
}

/** Part piller une cible : un seul combat contre les gardes de sa garnison */
export function piller(j: Jeu, escouade: string[], cible: Cible, now: number, rng = graine()): Resultat {
  const p = peutPiller(j, now);
  if (!p.ok) return p;
  const faits = faitsDuJour(j, now);
  if (faits.includes(cible.id)) return non(`${cible.nom} a déjà été attaqué aujourd’hui.`);
  const e = escouadePrete(j, escouade);
  if (!e.ok) return e;
  const ecart = cible.force / Math.max(0.01, forceEscouade(j, escouade));
  const butin = butinPillage(cible, ecart);
  const gardes = cible.porteurs.slice(0, 3).map((id) => `garde-${porteurDef(id).lignee}`);
  const x = nouvelleExpedition({ porteurs: e.porteurs, deck: e.deck, strate: Math.max(1, cible.strate), rng, sequence: [gardes[0]!], force: cible.force });
  // un groupe de gardes, un par Porteur de la garnison ; chacun garde le visage de son Porteur
  x.combat = creerCombat({
    porteurs: e.porteurs, ennemiId: gardes[0]!, escorte: gardes.slice(1), rng, deck: e.deck, force: cible.force, pvPleins: true,
    ...(Object.keys(e.bonus).length ? { bonus: e.bonus } : {}),
  });
  x.combat.ennemi.porteur = cible.porteurs[0];
  x.combat.autres?.forEach((en, k) => { en.porteur = cible.porteurs[k + 1]; });
  x.combat.journal = [`La garnison de ${cible.nom} sort à ta rencontre : ${cible.porteurs.slice(0, 3).map((id) => porteurDef(id).nom).join(', ')}.`];
  payerRatelier(j, escouade);
  quitterPostes(j, escouade);
  faits.push(cible.id);
  const etat = etatPillage(j);
  if (etat.jetons >= PILLAGE.jetonsMax) etat.jetonsLe = now;
  etat.jetons--;
  j.expedition = { ...x, pillage: { cible: cible.id, nom: cible.nom, ...(cible.bot ? { bot: true } : {}), ecart: Math.round(ecart * 1000) / 1000, base: butin.base, vol: butin.vol } };
  log(j, `L’escouade part piller ${cible.nom}.`);
  return { ok: true };
}

/** Ce que le retour d'un pillage a donné */
export interface RetourPillage { nom: string; victoire: boolean; gain: number; perte: number }

/** Le retour d'un pillage : butin ou perte, Usure et expérience ; à appeler par remonter() */
export function remonterPillage(j: Jeu, now: number): RetourPillage | null {
  const x = j.expedition;
  if (!x?.pillage) return null;
  const pi = x.pillage;
  const victoire = x.combat.issue === 'victoire';
  const etat = etatPillage(j);
  let gain = 0, perte = 0;
  if (victoire) {
    gain = pi.base + pi.vol;
    j.composants += gain;
    etat.coffre += gain;
    etat.gagnes++;
  } else {
    perte = Math.floor(etat.coffre * PILLAGE.perteDefaite);
    j.composants -= perte;
    etat.coffre -= perte;
    etat.perdus++;
  }
  if (!pi.bot) etat.aEnvoyer.push({ cible: pi.cible, victoire, vol: victoire ? pi.vol : 0, perte, le: now });
  noterHistorique(j, { sens: 'attaque', nom: pi.nom, gagne: victoire, composants: victoire ? gain : -perte, le: now, ...(pi.bot ? { bot: true } : {}) });
  // l'Usure (les PV perdus) et l'expérience d'un combat, comme une fouille
  const xp = victoire ? Math.round(XP.combat * (1 + 0.25 * (x.strate - 1)) * 0.75) : 0;
  for (const p of x.combat.porteurs) {
    const d = j.porteurs[p.id]!;
    usureAuRetour(j, p);
    if (xp) { const avant = niveauPorteur(j, p.id).niveau; const n = gagnerXp(j, p.id, xp); if (n && n > avant) log(j, `${porteurDef(p.id).nom} passe au niveau ${n} !`); }
    if (victoire) { const f = (d.faits ??= {}); f.combats = (f.combats ?? 0) + 1; }
  }
  j.expedition = null;
  log(j, victoire
    ? `Pillage réussi à ${pi.nom} : +${gain} composants${pi.vol ? `, dont ${pi.vol} pris à son coffre` : ''}.`
    : `Pillage repoussé à ${pi.nom}.${perte ? ` L’escouade laisse ${perte} composants de son coffre.` : ''}`);
  return { nom: pi.nom, victoire, gain, perte };
}

/** Une attaque subie, reçue du réseau à l'ouverture du jeu (id : celui du document en ligne) */
export interface PillageSubi { id?: string; nom: string; victoire: boolean; vol: number; perte: number; le: number }

/**
 * Applique les attaques subies pendant l'absence : le coffre perd ce qui a été pris, gagne ce que les perdants ont laissé.
 * Le défenseur fait lui-même respecter les limites (un attaquant tricheur ne peut pas les contourner) : chaque attaque
 * n'est comptée qu'une fois, au plus 3 par jour, aucune pendant les 8 h de bouclier après une attaque perdue,
 * et ce qu'un perdant laisse est plafonné comme un vol.
 */
export function subirPillages(j: Jeu, subis: PillageSubi[]): string[] {
  const etat = etatPillage(j);
  const recus = (etat.recus ??= []);
  const plafond = PILLAGE.plafondVol * butinCombat(Math.max(1, strateVaincue(j)), 0);
  const l: string[] = [];
  for (const s of subis.slice().sort((a, b) => a.le - b.le)) {
    if (s.id && recus.some((r) => r.id === s.id)) continue;
    const refusee = protege(recus, s.le);
    recus.push({ id: s.id ?? `${s.le}`, victoire: s.victoire && !refusee, le: s.le, ...(refusee ? { refusee: true } : {}) });
    if (refusee) { noterHistorique(j, { sens: 'defense', nom: s.nom, gagne: true, composants: 0, le: s.le, refusee: true }); continue; }
    if (s.victoire) {
      const pris = Math.min(Math.max(0, Math.floor(s.vol)), Math.floor(etat.coffre), plafond);
      etat.coffre -= pris;
      j.composants -= pris;
      noterHistorique(j, { sens: 'defense', nom: s.nom, gagne: false, composants: -pris, le: s.le });
      l.push(`${s.nom} a pillé ton archipel${pris ? ` et pris ${pris} composants de ton coffre` : ''}.`);
    } else {
      const gagne = Math.min(Math.max(0, Math.floor(s.perte)), plafond);
      etat.coffre += gagne;
      j.composants += gagne;
      noterHistorique(j, { sens: 'defense', nom: s.nom, gagne: true, composants: gagne, le: s.le });
      const venus = confier(j, CONFIANCE.defense, 'defense');
      l.push(`Ta garnison a repoussé ${s.nom}${gagne ? ` : +${gagne} composants laissés dans ton coffre` : ''}.${venus ? ` Le quartier l’a vu : +${venus} habitants te suivent.` : ''}`);
    }
  }
  // on ne garde que deux jours d'attaques : assez pour le bouclier et pour ne rien compter deux fois
  const dernier = recus.reduce((m, r) => Math.max(m, r.le), 0);
  etat.recus = recus.filter((r) => dernier - r.le < 48 * 3_600_000);
  for (const m of l) log(j, m);
  return l;
}

/** Le défenseur est-il protégé ? (bouclier après une attaque perdue, ou trop d'attaques aujourd'hui) */
export function protege(subis: { victoire: boolean; le: number; refusee?: boolean }[], now: number): boolean {
  const jour = subis.filter((s) => !s.refusee && now - s.le < 24 * 3_600_000 && now >= s.le);
  if (jour.length >= PILLAGE.subiesMax) return true;
  return jour.some((s) => s.victoire && now - s.le < PILLAGE.bouclierMs);
}

/** Le retour au district : celui d'un pillage, ou celui d'une descente (jeu.ts l'expose sous le nom remonter) */
export function remonter(j: Jeu): Retour {
  if (!j.expedition?.pillage) return remonterDescente(j);
  const p = remonterPillage(j, j.dernierTick)!;
  return { butin: p.gain, nouvelleStrate: false, victoire: p.victoire, fragment: null, cartes: [], eclats: 0, pillage: p };
}
