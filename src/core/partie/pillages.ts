// Couche 5 bis — les pillages (26 octobre 2026, décidé avec Bryan) : l'escouade attaque la cuvette d'un autre directeur,
// défendue par sa garnison (ses Porteurs et leurs cartes) que le jeu joue à sa place.
//
// Refonte du 14 novembre 2026 (Bryan : « ça ne rapporte rien », « le combat favorise trop le défenseur », « le social tient
// vraiment les joueurs » ; débat avec un game designer senior) :
// - le pavillon : chacun choisit d'être neutre (jamais attaqué par un directeur) ou pirate. Un neutre qui attaque un vrai
//   directeur hisse le pavillon pirate, et ne peut le rabattre que 72 h après sa dernière attaque (pas d'attaque éclair) ;
//   les districts sans directeur restent ouverts à tous, sans changer de pavillon ;
// - un vrai enjeu, sans dégoûter : un pirate battu en défense perd 3 % de son minerai, plafonné ; l'attaquant battu en laisse 2 % ;
//   jamais de cristaux, de cartes ni d'Éclats ; 8 h de bouclier, 3 attaques subies par jour au plus ;
// - le butin : trois fois plus de minerai, et l'empreinte volée (une copie d'une carte de la garnison vaincue, dans le métal
//   de sa propre tranche : le défenseur ne perd rien) ; le Renom des pirates et leur classement ; la revanche gratuite ;
// - la carte fixe : chaque district a sa place sur la mer des piliers ; la traversée prend quelques secondes selon la distance ;
// - un combat juste : les gardes ont les PV d'un groupe ordinaire, l'Usure d'un pillage est réduite de moitié, la courbe
//   des chances est remesurée au robot (`scripts/pillages.ts`).
// Fonctions pures : le temps est toujours passé en paramètre (`now`, en ms).

import { ennemiDef, moduleDe, carteId, moduleDef, porteurDef, tirablesEn, MODULES_TIRABLES } from '../donnees';
import { creerCombat } from '../combat';
import { ajouterCarte, doublonsRequis, metalJouable, metalTranche, puissanceCarte } from '../collection';
import { forceStrate, nouvelleExpedition } from '../expedition';

/** Un combat de référence pour les pillages : 6 composants × (1 + 0,25 × (Strate − 1)) */
const butinCombat = (strate: number) => Math.round(6 * (1 + 0.25 * (Math.max(1, strate) - 1)));
import { graine, tireur } from '../rng';
import { CONFIANCE, XP, facteurXp, bonusPv, confier, jourDe, escouadeDefense, escouadesDe, gagnerXp, log, niveauPorteur, non, porteursPresents, pvNiveau, strateVaincue, usureAuRetour, type Jeu, type Resultat } from './etat';
import { escouadePrete, payerRatelier, remonter as remonterDescente, type Retour } from './descentes';
import { quitterPostes } from './recompenses';
import { t as tr } from '../i18n';
import { CHOIX_VIDE, appliquerChoix, choixRobot, creerDuel, resoudreTour, type ChoixTour, type Consigne, type DuelEtat, type EscouadeDuel } from '../duel';

const HEURE = 3_600_000;

export const PILLAGE = {
  /** jetons de pillage : 5 au plus, un revient toutes les 4 h 48 (5 par jour) ; rien ne se perd pendant l'absence */
  jetonsMax: 5,
  rechargeMs: (24 * HEURE) / 5,
  /** un jeton de plus contre des cristaux (idée de Luc, 31 octobre 2026 ; prix fixe depuis le 9 novembre 2026), 2 fois par jour au plus */
  jetonCristaux: 30,
  achatsJour: 2,
  /** les pillages s'ouvrent après le gardien de −4 (12 novembre 2026) ; le Port et ses missions en mer, eux, après −1 */
  strateMin: 4,
  strateDuPort: 1,
  /** butin de base d'une victoire : autant que ce nombre de combats de la Strate de la cible (×4 le 14 novembre 2026 : de 2 à 8) */
  combats: 8,
  /** le butin suit l'écart de force : ×0,5 contre plus faible, ×1 à égalité, ×1,6 contre la cible de prestige (le gain moyen est le meilleur à force égale) */
  multPente: 8,
  multMin: 0.5,
  multMax: 1.6,
  /** l'enjeu d'un pirate (14 novembre 2026, Bryan : « il faut y laisser quelque chose, mais pas trop pour ne pas dégoûter ») :
   *  battu en défense, il perd `partVolee` de son minerai ; l'attaquant battu laisse `perteDefaite` du sien ;
   *  l'un et l'autre plafonnés à `plafondVol` combats de sa Strate */
  partVolee: 0.03,
  perteDefaite: 0.02,
  plafondVol: 4,
  /** le défenseur : bouclier de 8 h après une attaque perdue, 3 attaques subies par jour au plus */
  bouclierMs: 8 * HEURE,
  subiesMax: 3,
  /** le pavillon : un pirate ne redevient neutre que 72 h après sa dernière attaque contre un directeur */
  neutreApresMs: 72 * HEURE,
  /** la revanche : 24 h pour rendre la pareille à qui t'a pillé, sans jeton */
  revancheMs: 24 * HEURE,
  /** l'empreinte volée : toujours contre un directeur, une fois sur trois contre un district sans directeur */
  copieBot: 0.35,
  /** le Renom des pirates (contre de vrais directeurs seulement) ; jamais sous zéro */
  renom: { attaque: 12, attaqueRatee: -5, defense: 4, defenseRatee: -6 },
  /** l'Usure d'un pillage : une escarmouche, pas une descente (la moitié des PV perdus) */
  usure: 0.5,
  /**
   * La force des gardes : K × √(puissance des cartes × PV de la garnison). Remesuré le 14 novembre 2026 (gardes aux PV
   * d'un groupe ordinaire) : à force égale, le joueur moyen gagne environ une fois sur deux.
   */
  K: 0.0245,
  /** la force des gardes en combat, par rapport à leur force annoncée : remesurée le 14 novembre 2026 avec les PV de groupe
   *  (`scripts/pillages.ts`) pour qu'à force égale le joueur moyen gagne environ une fois sur deux. K reste tel quel :
   *  il sert aussi à la force conseillée des Strates */
  gardes: 1.2,
  /** chances du joueur moyen selon l'écart de force (gardes / escouade), courbe logistique mesurée au robot */
  pente: 0.085,
  centre: 1,
  /** les cibles à portée : de 0,85 à 1,05 fois la force de l'escouade, plus une cible de prestige jusqu'à 1,15 (une chance sur cinq environ) */
  ecartMin: 0.85,
  ecartMax: 1.05,
  prestige: 1.15,
  /** les districts sans directeur sur la carte (places fixes autour du sien) */
  bots: 5,
  /** les vrais directeurs montrés sur la carte (les plus proches) */
  voisins: 4,
  /** la traversée : quelques secondes selon la distance sur la carte */
  traversee: { min: 3, max: 10, parMille: 0.03 },
} as const;

// ---------- La carte fixe de la mer des piliers ----------

/** Un nombre tiré d'une chaîne, toujours le même (FNV-1a) */
function hache(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}

/** La place d'un district sur la mer des piliers (en milles, de 0 à 1 000), fixe pour toujours */
export function placeDe(id: string): { x: number; y: number } {
  const h = hache('mer:' + id), g = hache('pilier:' + id);
  return { x: (h % 100_000) / 100, y: (g % 100_000) / 100 };
}

/** La distance entre deux districts, en milles (la mer se referme sur elle-même : pas de bord) */
export function distance(a: string, b: string): number {
  const p = placeDe(a), q = placeDe(b);
  const dx = Math.min(Math.abs(p.x - q.x), 1000 - Math.abs(p.x - q.x)), dy = Math.min(Math.abs(p.y - q.y), 1000 - Math.abs(p.y - q.y));
  return Math.round(Math.hypot(dx, dy));
}

/** La traversée vers une cible, en secondes */
export const traversee = (milles: number) =>
  Math.round(Math.max(PILLAGE.traversee.min, Math.min(PILLAGE.traversee.max, PILLAGE.traversee.min + milles * PILLAGE.traversee.parMille)));

// ---------- La garnison : ce qu'un directeur publie pour être pillé ----------

export type Pavillon = 'neutre' | 'pirate';

export interface Garnison {
  /** les trois Porteurs de l'escouade, leurs PV (niveau compris, sans l'Usure) et leurs cartes */
  porteurs: { id: string; pv: number; cartes: { id: string; niveau: number }[] }[];
  /** la Strate la plus profonde vaincue : elle fixe le butin */
  strate: number;
  /** le minerai exposé : ce qu'une attaque gagnée lui prendrait (0 pour un neutre) */
  coffre: number;
  pavillon?: Pavillon;
  renom?: number;
  /** la consigne que suit la garnison (14 novembre 2026) */
  consigne?: Consigne;
}

/** Le minerai qu'un pirate expose : 3 % de son minerai, plafonné à 4 combats de sa Strate */
export const exposeDe = (composants: number, strate: number) =>
  Math.max(0, Math.min(Math.floor(composants * PILLAGE.partVolee), PILLAGE.plafondVol * butinCombat(strate)));
/** Ce qu'un attaquant battu laisse : 2 % de son minerai, même plafond */
export const perteDe = (composants: number, strate: number) =>
  Math.max(0, Math.min(Math.floor(composants * PILLAGE.perteDefaite), PILLAGE.plafondVol * butinCombat(strate)));

/** La garnison d'un district : l'escouade choisie pour défendre le port (complétée par les premiers Porteurs présents) */
export function garnisonDe(j: Jeu): Garnison {
  const presents = porteursPresents(j);
  const ids = [...new Set([...escouadesDe(j)[escouadeDefense(j)]!, ...presents])].slice(0, 3);
  const strate = Math.max(1, strateVaincue(j));
  const e = etatPillage(j);
  return {
    porteurs: ids.map((id) => ({
      id,
      pv: pvNiveau(j, id) + bonusPv(j, id),
      cartes: (j.porteurs[id]?.modules ?? []).filter((k) => j.collection[k]).map((k) => ({ id: metalJouable(k, niveauPorteur(j, id).niveau), niveau: j.collection[k]!.niveau })),
    })),
    strate,
    coffre: e.pavillon === 'pirate' ? exposeDe(j.composants, strate) : 0,
    pavillon: e.pavillon ?? 'neutre',
    renom: e.renom ?? 0,
    consigne: consigneDe(j),
  };
}

/** La consigne de la garnison : Riposte tant qu'on n'en a pas choisi */
export const consigneDe = (j: Jeu): Consigne => etatPillage(j).consigne ?? 'riposte';
export function choisirConsigne(j: Jeu, c: Consigne): Resultat {
  if (!['rempart', 'riposte', 'harcelement'].includes(c)) return non(tr('Consigne inconnue.'));
  etatPillage(j).consigne = c;
  return { ok: true };
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
      cartes: (j.porteurs[id]?.modules ?? []).filter((k) => j.collection[k]).map((k) => ({ id: metalJouable(k, niveauPorteur(j, id).niveau), niveau: j.collection[k]!.niveau })),
    })),
  });
}

/** Les chances du joueur moyen selon l'écart de force (gardes / escouade) */
export const chanceVictoire = (ecart: number) => 1 / (1 + Math.exp((ecart - PILLAGE.centre) / PILLAGE.pente));

/** Le multiplicateur du butin selon l'écart de force */
export const multButin = (ecart: number) => Math.min(PILLAGE.multMax, Math.max(PILLAGE.multMin, 1 + PILLAGE.multPente * (ecart - 1)));

/** Ce qu'un pillage gagné rapporte : la base (créée par le jeu) et le minerai exposé du défenseur */
export function butinPillage(cible: { strate: number; coffre: number }, ecart: number): { base: number; vol: number } {
  const unCombat = butinCombat(cible.strate);
  return {
    base: Math.round(PILLAGE.combats * unCombat * multButin(ecart)),
    vol: Math.min(Math.max(0, Math.floor(cible.coffre)), PILLAGE.plafondVol * unCombat),
  };
}

/** Une appréciation lisible de l'écart, pour la carte */
export function difficulte(ecart: number): { nom: string; niveau: 1 | 2 | 3 | 4 } {
  const c = chanceVictoire(ecart);
  if (c >= 0.8) return { nom: tr('Facile'), niveau: 1 };
  if (c >= 0.45) return { nom: tr('Équilibré'), niveau: 2 };
  if (c >= 0.2) return { nom: tr('Risqué'), niveau: 3 };
  return { nom: tr('Redoutable'), niveau: 4 };
}

/** Choisit l'escouade qui garde le port (27 octobre 2026). Possible à tout moment, même pendant une descente */
export function choisirDefense(j: Jeu, n: number): Resultat {
  if (!Number.isInteger(n) || n < 0 || n >= escouadesDe(j).length) return non(tr('Escouade inconnue.'));
  if (!escouadesDe(j)[n]!.length) return non(tr('Cette escouade est vide : choisis-lui d’abord des Porteurs.'));
  j.escouadeDefense = n;
  log(j, tr`L’escouade ${n + 1} garde désormais le port.`);
  return { ok: true };
}

// ---------- L'état du joueur : pavillon, jetons, Renom ----------

/** Le récit d'une défense, vu par le défenseur : la durée, les Porteurs qu'elle a mis à terre, la carte qui a le plus compté */
export interface RecitDefense { tours: number; abattus: number; carte?: string }

/** Un pillage joué, à envoyer au défenseur (le réseau s'en charge ; rien pour un district sans directeur) */
export interface PillageJoue { cible: string; victoire: boolean; vol: number; perte: number; le: number; recit?: RecitDefense }

export interface EtatPillage {
  /** plus utilisé depuis le 14 novembre 2026 (le minerai exposé se calcule) ; gardé pour les sauvegardes */
  coffre: number;
  jetons: number;
  /** quand le dernier jeton compté est revenu */
  jetonsLe: number;
  gagnes: number;
  perdus: number;
  /** les pillages joués contre de vrais directeurs, en attente d'envoi */
  aEnvoyer: PillageJoue[];
  /** les jetons achetés, et le jour de ces achats */
  achats?: { jour: number; n: number };
  /** les districts déjà attaqués aujourd'hui (un seul pillage par district et par jour), et ce jour */
  faits?: string[];
  jour?: number;
  /** le journal du port : les derniers pillages faits et subis, du plus récent au plus ancien */
  historique?: EntreeHistorique[];
  /** les attaques subies déjà comptées (deux jours) : pour le bouclier, et pour ne rien compter deux fois */
  recus?: { id: string; victoire: boolean; le: number; refusee?: boolean }[];
  /** le pavillon (14 novembre 2026) : neutre par défaut */
  pavillon?: Pavillon;
  /** la dernière attaque contre un vrai directeur (pour rabattre le pavillon) */
  pirateLe?: number;
  /** depuis quand le district est neutre (une attaque jouée avant ne compte plus) */
  neutreLe?: number;
  /** le Renom des pirates */
  renom?: number;
  /** les revanches ouvertes : qui t'a pillé, et jusqu'à quand */
  revanches?: { id: string; nom: string; jusqua: number }[];
  /** la consigne de la garnison */
  consigne?: Consigne;
  /** un pillage contre un directeur en cours (le duel se joue dans l'application). Le duel est gardé tour par tour (le départ et
   *  les choix de l'attaquant ; le robot rejoue les siens à l'identique) : une page rechargée le reprend là où il en était */
  enCours?: PillageEnCours & { escouade: string[]; debut: number; duel?: { depart: DepartDuel; choix: ChoixTour[] } };
}

/** Une ligne du journal du port, vue du joueur : `gagne` dit s'il l'a emporté, `composants` ce que son minerai a gagné (+) ou perdu (−) */
export interface EntreeHistorique {
  sens: 'attaque' | 'defense';
  nom: string;
  gagne: boolean;
  composants: number;
  le: number;
  /** un district sans directeur (attaque seulement) */
  bot?: boolean;
  /** une attaque subie sans effet : bouclier levé, trois attaques déjà reçues, ou district neutre */
  refusee?: boolean;
  /** le Renom gagné (+) ou perdu (−) */
  renom?: number;
  /** l'empreinte volée */
  carte?: string;
  /** l'attaquant (défense) : pour la revanche */
  par?: string;
  /** une revanche */
  revanche?: boolean;
  /** le récit d'une défense */
  recit?: RecitDefense;
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

/** Les pillages sont ouverts : après le gardien de −4 ; une partie qui a déjà pillé ou défendu les garde */
export const pillagesPermis = (j: Jeu) => strateVaincue(j) >= PILLAGE.strateMin || !!(j.pillage && (j.pillage.gagnes || j.pillage.perdus || j.pillage.historique?.length));

export function etatPillage(j: Jeu): EtatPillage {
  j.pillage ??= { coffre: 0, jetons: PILLAGE.jetonsMax, jetonsLe: j.dernierTick, gagnes: 0, perdus: 0, aEnvoyer: [] };
  return j.pillage;
}

export const pavillonDe = (j: Jeu): Pavillon => etatPillage(j).pavillon ?? 'neutre';

/** Quand le pirate pourra redevenir neutre (null : tout de suite, ou il l'est déjà) */
export function neutreDes(j: Jeu, now: number): number | null {
  const e = etatPillage(j);
  if (e.pavillon !== 'pirate' || !e.pirateLe) return null;
  const quand = e.pirateLe + PILLAGE.neutreApresMs;
  return quand > now ? quand : null;
}

/** Hisser ou rabattre le pavillon */
export function changerPavillon(j: Jeu, p: Pavillon, now: number): Resultat {
  const e = etatPillage(j);
  if ((e.pavillon ?? 'neutre') === p) return { ok: true };
  if (p === 'neutre') {
    const quand = neutreDes(j, now);
    if (quand) return non(tr`Ton dernier pillage est trop récent : le pavillon pirate reste hissé encore ${Math.ceil((quand - now) / HEURE)} h.`);
    e.pavillon = 'neutre';
    e.neutreLe = now;
    log(j, tr('Ton district rabat le pavillon : il redevient neutre.'));
    return { ok: true, message: tr('Pavillon neutre : aucun directeur ne peut plus t’attaquer.') };
  }
  e.pavillon = 'pirate';
  log(j, tr('Ton district hisse le pavillon pirate.'));
  return { ok: true, message: tr('Pavillon pirate : tu peux piller les autres pirates, et ils peuvent te piller.') };
}

/** Le Renom, et son rang */
export const RANGS_RENOM = [
  { min: 0, nom: tr('Mousse') }, { min: 60, nom: tr('Matelot') }, { min: 180, nom: tr('Corsaire') },
  { min: 400, nom: tr('Capitaine') }, { min: 800, nom: tr('Écumeur des piliers') },
] as const;
export function rangRenom(renom: number): { nom: string; suivant: number | null } {
  let k = 0;
  while (k + 1 < RANGS_RENOM.length && renom >= RANGS_RENOM[k + 1]!.min) k++;
  return { nom: RANGS_RENOM[k]!.nom, suivant: RANGS_RENOM[k + 1]?.min ?? null };
}
function ajouterRenom(j: Jeu, delta: number): number {
  const e = etatPillage(j);
  const avant = e.renom ?? 0;
  e.renom = Math.max(0, avant + delta);
  return e.renom - avant;
}

/** Les revanches encore ouvertes */
export function revanchesOuvertes(j: Jeu, now: number) {
  const e = etatPillage(j);
  e.revanches = (e.revanches ?? []).filter((r) => r.jusqua > now);
  return e.revanches;
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
  /** l'uid du directeur, ou « bot-… » pour un district sans directeur */
  id: string;
  nom: string;
  /** district sans directeur, tenu par un intendant (le jeu le fabrique : la carte n'est jamais vide) */
  bot?: boolean;
  /** les Porteurs de la garnison (lignées et portraits des gardes) */
  porteurs: string[];
  /** les cartes de la garnison (pour l'empreinte volée) */
  cartes?: string[];
  force: number;
  strate: number;
  coffre: number;
  pavillon?: Pavillon;
  renom?: number;
  /** la distance en milles depuis son district */
  milles?: number;
  /** la garnison complète d'un directeur (ses Porteurs, leurs PV, leurs cartes et sa consigne) : son escouade en duel */
  garnison?: Garnison;
  /** une revanche (l'écran la prépare) */
  revanche?: boolean;
}

/** Peut-on attaquer cette cible ? 'ok', ou la raison : neutre, trop faible, trop forte */
export type Portee = 'ok' | 'neutre' | 'faible' | 'forte';
export function porteeDe(c: Cible, force: number, revanche = false): Portee {
  if (c.bot || revanche) return 'ok';
  if (c.pavillon !== 'pirate') return 'neutre';
  const e = c.force / Math.max(0.01, force);
  return e < PILLAGE.ecartMin ? 'faible' : e > PILLAGE.prestige ? 'forte' : 'ok';
}

/** Les districts attaqués aujourd'hui (la liste repart à zéro chaque jour) */
export function faitsDuJour(j: Jeu, now: number): string[] {
  const e = etatPillage(j);
  const jour = jourDe(now);
  if (e.jour !== jour) { e.jour = jour; e.faits = []; }
  return (e.faits ??= []);
}

/**
 * La carte de la mer des piliers : les vrais directeurs les plus proches (pirates et neutres : on voit qui vit autour de soi),
 * et des districts sans directeur à des places fixes, toujours de quoi piller.
 */
export function ciblesDuJour(j: Jeu, escouade: string[], now: number, enLigne: Cible[] = [], monId = 'moi'): Cible[] {
  const force = forceEscouade(j, escouade);
  const voisins = enLigne.filter((c) => c.id !== monId).map((c) => ({ ...c, milles: distance(monId, c.id) }))
    .sort((a, b) => a.milles - b.milles).slice(0, PILLAGE.voisins);
  return [...voisins, ...ciblesBots(j, force, jourDe(now), PILLAGE.bots, monId)];
}

/** Une cible à partir de la garnison publiée d'un directeur */
export const cibleDe = (id: string, nom: string, g: Garnison): Cible => ({
  id, nom, garnison: g, porteurs: g.porteurs.map((p) => p.id), cartes: g.porteurs.flatMap((p) => p.cartes.map((c) => c.id)),
  force: forceGarnison(g), strate: g.strate, coffre: g.coffre, pavillon: g.pavillon ?? 'neutre', renom: g.renom ?? 0,
});

const NOMS_BOTS = ['Haut-Treuil', tr('Cendrevigne'), tr('Ancrefroide'), tr('Verrelune'), tr('Salvebrume'), 'Pilier-Gris', tr('Brisecôte'), tr('Les Pontons d’Ambre'), 'Lierre-Haut', tr('Quai Sourd'), 'Vasque-Morte', tr('Givrecorde')];

/**
 * Les districts sans directeur : à des places fixes autour du sien, avec un nom fixe ; seule leur garnison change chaque jour,
 * de 0,85 à 1,15 fois la force de l'escouade (la dernière, la plus forte, est la cible de prestige).
 */
export function ciblesBots(j: Jeu, force: number, jour: number, n: number, monId = 'moi'): Cible[] {
  const t = tireur({ rng: (jour * 2654435761 + hache(monId)) >>> 0 });
  const tous = ['ilka', 'doran', 'vela', ...porteursPresents(j)];
  const ordre = tireur({ rng: hache('noms:' + monId) }).melanger(NOMS_BOTS);
  const strate = Math.max(1, strateVaincue(j));
  const r: Cible[] = [];
  for (let k = 0; k < n; k++) {
    // des écarts répartis sur la plage à portée, du plus facile au plus dur ; le dernier est la cible de prestige
    const ecart = k === n - 1 && n > 1 ? PILLAGE.ecartMax + t.nombre() * (PILLAGE.prestige - PILLAGE.ecartMax)
      : PILLAGE.ecartMin + ((k + t.nombre()) / Math.max(1, n - 1)) * (PILLAGE.ecartMax - PILLAGE.ecartMin);
    const porteurs = t.melanger([...new Set(tous)]).slice(0, 3);
    // sa place : autour du district, à 60 à 260 milles
    const angle = (hache(`bot${k}:${monId}`) % 360) * (Math.PI / 180), rayon = 60 + (hache(`r${k}:${monId}`) % 200);
    r.push({
      id: `bot-${k}`, nom: ordre[k % ordre.length]!, bot: true, porteurs,
      force: Math.round(force * ecart * 1000) / 1000, strate, coffre: 0, milles: rayon,
      ...{ angle },
    } as Cible);
  }
  return r;
}

/** L'angle d'un district sur la carte autour du sien (en radians) */
export function angleDe(c: Cible, monId = 'moi'): number {
  const a = (c as Cible & { angle?: number }).angle;
  if (a !== undefined) return a;
  const p = placeDe(monId), q = placeDe(c.id);
  const dx = ((q.x - p.x + 1500) % 1000) - 500, dy = ((q.y - p.y + 1500) % 1000) - 500;
  return Math.atan2(dy, dx);
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
  /** ce que l'attaquant laisse s'il perd (contre un directeur) */
  perte?: number;
  /** l'arrivée de la barque (ms) : le combat commence après la traversée */
  arrivee?: number;
  /** une carte de la garnison, pour l'empreinte volée */
  cartes?: string[];
  revanche?: boolean;
}

/** Un jeton de plus : un prix fixe en cristaux (9 novembre 2026) */
export const coutJeton = (_j: Jeu) => PILLAGE.jetonCristaux;

/** Les jetons qu'on peut encore acheter aujourd'hui */
export function achatsRestants(j: Jeu, now: number): number {
  const a = etatPillage(j).achats;
  return Math.max(0, PILLAGE.achatsJour - (a && a.jour === jourDe(now) ? a.n : 0));
}

/** Acheter un jeton de pillage avec des cristaux */
export function acheterJeton(j: Jeu, now: number): Resultat {
  majJetons(j, now);
  const e = etatPillage(j);
  if (j.batiments.generateur < 1) return non(tr('Le Générateur est à l’arrêt.'));
  if (e.jetons >= PILLAGE.jetonsMax) return non(tr('Ta barque est déjà comme neuve.'));
  if (achatsRestants(j, now) < 1) return non(tr`Déjà ${PILLAGE.achatsJour} radoubs aujourd’hui : reviens demain.`);
  const cout = coutJeton(j);
  if (j.energie < cout) return non(tr`Il faut ${cout} cristaux pour radouber la barque.`);
  j.energie -= cout;
  const jour = jourDe(now);
  e.achats = { jour, n: (e.achats?.jour === jour ? e.achats.n : 0) + 1 };
  e.jetons++;
  if (e.jetons >= PILLAGE.jetonsMax) e.jetonsLe = now;
  return { ok: true, message: tr('Les charpentiers radoubent la coque : un pillage de plus.') };
}

export function peutPiller(j: Jeu, now: number, revanche = false): Resultat {
  if (!pillagesPermis(j)) return non(tr`Les pillages s’ouvrent quand le gardien de la Strate −${PILLAGE.strateMin} est vaincu.`);
  if (j.expedition) return non(tr('Une expédition est déjà en cours.'));
  majJetons(j, now);
  if (!revanche && etatPillage(j).jetons < 1) return non(tr('La coque est trop usée : laisse les charpentiers la réparer.'));
  return { ok: true };
}

/** Ce que les deux sortes de pillage vérifient et paient au départ (jeton, district du jour, pavillon) */
function preparerPillage(j: Jeu, escouade: string[], cible: Cible, now: number, opts: { revanche?: boolean }):
  { ok: false; message?: string } | { ok: true; revanche: boolean; ecart: number; butin: { base: number; vol: number }; e: Extract<ReturnType<typeof escouadePrete>, { ok: true }> } {
  const revanche = !!(opts.revanche ?? cible.revanche) && !cible.bot && revanchesOuvertes(j, now).some((r) => r.id === cible.id);
  const p = peutPiller(j, now, revanche);
  if (!p.ok) return { ok: false, ...(p.message ? { message: p.message } : {}) };
  if (etatPillage(j).enCours) return { ok: false, message: tr('Un pillage est déjà en cours.') };
  const faits = faitsDuJour(j, now);
  if (!revanche && faits.includes(cible.id)) return { ok: false, message: tr`${cible.nom} a déjà été attaqué aujourd’hui.` };
  const force = forceEscouade(j, escouade);
  const portee = porteeDe(cible, force, revanche);
  if (portee === 'neutre') return { ok: false, message: tr`${cible.nom} vogue sous pavillon neutre : on ne l’attaque pas.` };
  if (portee !== 'ok') return { ok: false, message: tr`${cible.nom} n’est pas à ta portée.` };
  const e = escouadePrete(j, escouade, undefined, undefined, 'courte');
  if (!e.ok) return { ok: false, ...(e.message ? { message: e.message } : {}) };
  const ecart = cible.force / Math.max(0.01, force);
  return { ok: true, revanche, ecart, butin: butinPillage(cible, ecart), e };
}

/** Le départ payé : postes quittés, jeton dépensé (sauf revanche), pavillon hissé contre un directeur */
function payerDepart(j: Jeu, escouade: string[], cible: Cible, now: number, revanche: boolean) {
  const etat = etatPillage(j);
  payerRatelier(j, escouade, 'courte');
  quitterPostes(j, escouade);
  if (!revanche) {
    faitsDuJour(j, now).push(cible.id);
    if (etat.jetons >= PILLAGE.jetonsMax) etat.jetonsLe = now;
    etat.jetons--;
  } else etat.revanches = (etat.revanches ?? []).filter((r) => r.id !== cible.id);
  if (!cible.bot) {
    if (etat.pavillon !== 'pirate') { etat.pavillon = 'pirate'; log(j, tr('En attaquant un directeur, ton district hisse le pavillon pirate.')); }
    etat.pirateLe = now;
  }
}

/** Part piller une cible en combat contre ses gardes (les districts sans directeur ; un directeur se pille en duel) */
export function piller(j: Jeu, escouade: string[], cible: Cible, now: number, rng = graine(), opts: { revanche?: boolean } = {}): Resultat {
  const pr = preparerPillage(j, escouade, cible, now, opts);
  if (!pr.ok) return non(pr.message ?? '');
  const { revanche, ecart, butin, e } = pr;
  const gardes = cible.porteurs.slice(0, 3).map((id) => `garde-${porteurDef(id).lignee}`);
  const x = nouvelleExpedition({ porteurs: e.porteurs, deck: e.deck, strate: Math.max(1, cible.strate), rng, sequence: [gardes[0]!], force: cible.force * PILLAGE.gardes });
  // un groupe de gardes, un par Porteur de la garnison, aux PV d'un groupe ordinaire (14 novembre 2026 : plus de PV pleins)
  x.combat = creerCombat({
    porteurs: e.porteurs, ennemiId: gardes[0]!, escorte: gardes.slice(1), rng, deck: e.deck, force: cible.force * PILLAGE.gardes,
    ...(Object.keys(e.bonus).length ? { bonus: e.bonus } : {}),
  });
  x.combat.ennemi.porteur = cible.porteurs[0];
  x.combat.autres?.forEach((en, k) => { en.porteur = cible.porteurs[k + 1]; });
  x.combat.journal = [tr`La garnison de ${cible.nom} sort à ta rencontre : ${gardes.map((id) => ennemiDef(id).nom).join(', ')}.`];
  payerDepart(j, escouade, cible, now, revanche);
  const milles = cible.milles ?? 0;
  j.expedition = {
    ...x,
    pillage: {
      cible: cible.id, nom: cible.nom, ...(cible.bot ? { bot: true } : {}), ecart: Math.round(ecart * 1000) / 1000, base: butin.base, vol: butin.vol,
      perte: cible.bot ? 0 : perteDe(j.composants, strateVaincue(j)), arrivee: now + traversee(milles) * 1000,
      ...(cible.cartes?.length ? { cartes: cible.cartes.slice(0, 18) } : {}), ...(revanche ? { revanche: true } : {}),
    },
  };
  log(j, revanche ? tr`L’escouade part prendre sa revanche sur ${cible.nom}.` : tr`L’escouade part piller ${cible.nom}.`);
  return { ok: true };
}

/** L'empreinte volée : une copie d'une carte de la garnison, dans le métal de la tranche du pillard (jamais une exclusive) */
export function empreinteVolee(j: Jeu, pi: PillageEnCours, rng: number): string | null {
  const t = tireur({ rng: rng >>> 0 });
  const metal = metalTranche(Math.max(1, strateVaincue(j)));
  const tirables = new Set(MODULES_TIRABLES.map((m) => m.id));
  let base: string | null = null;
  if (!pi.bot) {
    const l = (pi.cartes ?? []).map(moduleDe).filter((m) => tirables.has(m));
    if (l.length) base = l[t.entier(l.length)]!;
  } else if (t.nombre() < PILLAGE.copieBot) {
    const l = tirablesEn(metal);
    if (l.length) base = l[t.entier(l.length)]!.id;
  }
  if (!base) return null;
  // la carte n'existe peut-être pas dans ce métal : le métal le plus proche en dessous
  const metaux = ['fer', 'cuivre', 'argent', 'or'] as const;
  for (let k = metaux.indexOf(metal as typeof metaux[number]); k >= 0; k--) {
    const id = carteId(base, metaux[k]!);
    try { moduleDef(id); return id; } catch { /* pas dans ce métal */ }
  }
  return null;
}

// ---------- Le pillage d'un directeur : un duel contre sa vraie escouade (14 novembre 2026) ----------
// Bryan : « avoir une influence sur la défense et faire des choix ». La garnison d'un directeur se bat avec ses vrais Porteurs et
// ses vraies cartes, jouées par le robot du duel selon sa consigne. Le duel se joue dans l'application ; ici, le départ et le retour.

/** Ce qu'il faut pour lancer le duel : les deux escouades, la graine et la consigne du défenseur */
export interface DepartDuel { attaque: EscouadeDuel; defense: EscouadeDuel; graine: number; consigne: Consigne; secondes: number }

/** L'escouade qui attaque, en duel : PV du moment (Usure comprise), cartes à leur niveau */
function escouadeAttaque(j: Jeu, escouade: string[]): EscouadeDuel {
  return {
    nom: j.directeur?.nom || tr('Directeur'),
    porteurs: escouade.map((id) => ({
      id,
      pv: Math.max(1, pvNiveau(j, id) + bonusPv(j, id) - Math.floor(j.porteurs[id]?.usure ?? 0)),
      cartes: (j.porteurs[id]?.modules ?? []).filter((k) => j.collection[k]).map((k) => ({ id: metalJouable(k, niveauPorteur(j, id).niveau), niveau: j.collection[k]!.niveau })),
    })),
  };
}

/** Part piller un directeur : le jeton, le pavillon, puis le duel (que l'application joue) */
export function lancerPillageDuel(j: Jeu, escouade: string[], cible: Cible, now: number, rng = graine(), opts: { revanche?: boolean } = {}): Resultat & { depart?: DepartDuel } {
  if (cible.bot || !cible.garnison) return non(tr('Ce district ne se pille pas en duel.'));
  const pr = preparerPillage(j, escouade, cible, now, opts);
  if (!pr.ok) return non(pr.message ?? '');
  const { revanche, ecart, butin } = pr;
  payerDepart(j, escouade, cible, now, revanche);
  const secondes = traversee(cible.milles ?? 0);
  etatPillage(j).enCours = {
    cible: cible.id, nom: cible.nom, ecart: Math.round(ecart * 1000) / 1000, base: butin.base, vol: butin.vol,
    perte: perteDe(j.composants, strateVaincue(j)), arrivee: now + secondes * 1000,
    ...(cible.cartes?.length ? { cartes: cible.cartes.slice(0, 18) } : {}), ...(revanche ? { revanche: true } : {}),
    escouade: escouade.slice(), debut: now,
  };
  log(j, revanche ? tr`L’escouade part prendre sa revanche sur ${cible.nom}.` : tr`L’escouade part piller ${cible.nom}.`);
  const g = cible.garnison;
  const depart: DepartDuel = {
    attaque: escouadeAttaque(j, escouade),
    defense: { nom: cible.nom, porteurs: g.porteurs.map((p) => ({ id: p.id, pv: p.pv, cartes: p.cartes.map((c) => ({ ...c })) })) },
    graine: rng >>> 0, consigne: g.consigne ?? 'riposte', secondes,
  };
  etatPillage(j).enCours!.duel = { depart, choix: [] };
  return { ok: true, depart };
}

/** Note le choix de l'attaquant pour un tour du duel (gardé dans la partie, pour reprendre après un rechargement) */
export function noterChoixDuel(j: Jeu, tour: number, choix: ChoixTour) {
  const d = etatPillage(j).enCours?.duel;
  if (!d || tour < 1 || tour > d.choix.length + 1) return;
  d.choix[tour - 1] = structuredClone(choix);
}

/**
 * Le duel en cours, rejoué depuis le départ : le robot du défenseur choisit au début de chaque tour, sur le même état,
 * donc exactement comme la première fois. Recharger la page ne change rien à la partie : on reprend au tour où l'on était.
 */
export function rejouerDuel(j: Jeu): DuelEtat | null {
  const d = etatPillage(j).enCours?.duel;
  if (!d) return null;
  const s = creerDuel(d.depart.attaque, d.depart.defense, d.depart.graine);
  for (const choix of d.choix) {
    if (s.issue !== 'en-cours') break;
    const robot = choixRobot(s, 1, d.depart.consigne);
    if (!appliquerChoix(s, 0, choix).ok) appliquerChoix(s, 0, CHOIX_VIDE);
    if (!appliquerChoix(s, 1, robot).ok) appliquerChoix(s, 1, CHOIX_VIDE);
    resoudreTour(s);
  }
  return s;
}

/** Ce que le duel a donné : l'issue, les PV restants de l'escouade (à l'échelle du duel), et de quoi faire le récit du défenseur */
export interface FinDuel { victoire: boolean; porteurs: { id: string; pv: number; pvMax: number }[]; recit: RecitDefense }

/** Le retour d'un pillage joué en duel : butin ou perte, Renom, empreinte volée, Usure (la moitié de la part de PV perdue) et XP */
export function finirPillageDuel(j: Jeu, fin: FinDuel, now: number): RetourPillage | null {
  const etat = etatPillage(j);
  const pi = etat.enCours;
  if (!pi) return null;
  delete etat.enCours;
  const victoire = fin.victoire;
  let gain = 0, perte = 0, renom = 0, carte: string | null = null, nouvelle = false;
  if (victoire) {
    gain = pi.base + pi.vol;
    j.composants += gain;
    etat.gagnes++;
    carte = empreinteVolee(j, pi, (now ^ pi.debut) >>> 0);
    if (carte) nouvelle = ajouterCarte(j, carte);
    renom = ajouterRenom(j, Math.round(PILLAGE.renom.attaque * multButin(pi.ecart)));
  } else {
    perte = Math.min(pi.perte ?? 0, j.composants);
    j.composants -= perte;
    etat.perdus++;
    renom = ajouterRenom(j, PILLAGE.renom.attaqueRatee);
  }
  etat.aEnvoyer.push({ cible: pi.cible, victoire, vol: victoire ? pi.vol : 0, perte, le: now, recit: fin.recit });
  noterHistorique(j, { sens: 'attaque', nom: pi.nom, gagne: victoire, composants: victoire ? gain : -perte, le: now,
    ...(renom ? { renom } : {}), ...(carte ? { carte } : {}), ...(pi.revanche ? { revanche: true } : {}) });
  // l'Usure : la part de PV perdue en duel, ramenée aux PV du district, et réduite de moitié comme tout pillage
  const xp = victoire ? Math.round(XP.combat * facteurXp(Math.max(1, strateVaincue(j))) * 0.75) : 0;
  for (const id of pi.escouade) {
    const d = j.porteurs[id];
    if (!d) continue;
    const f = fin.porteurs.find((p) => p.id === id);
    const pvMax = pvNiveau(j, id) + bonusPv(j, id);
    const part = f ? 1 - Math.max(0, f.pv) / Math.max(1, f.pvMax) : 0;
    const avantUsure = d.usure;
    usureAuRetour(j, { id, pv: Math.round(pvMax * (1 - part)), pvMax });
    d.usure = avantUsure + (d.usure - avantUsure) * PILLAGE.usure;
    if (xp) { const avant = niveauPorteur(j, id).niveau; const n = gagnerXp(j, id, xp); if (n && n > avant) log(j, tr`${porteurDef(id).nom} passe au niveau ${n} !`); }
    if (victoire) { const fa = (d.faits ??= {}); fa.combats = (fa.combats ?? 0) + 1; }
  }
  log(j, victoire
    ? tr`Pillage réussi à ${pi.nom} : +${gain} minerai${pi.vol ? tr`, dont ${pi.vol} pris à ses réserves` : ''}.`
    : tr`Pillage repoussé à ${pi.nom}.${perte ? tr` L’escouade y laisse ${perte} minerai.` : ''}`);
  return { nom: pi.nom, victoire, gain, perte, renom, carte, nouvelle };
}

/** Un pillage resté en plan sans duel à reprendre (ancienne sauvegarde) : il compte perdu ; un duel gardé, lui, se reprend */
export function pillageEnSuspens(j: Jeu, now: number): RetourPillage | null {
  const pi = etatPillage(j).enCours;
  if (!pi || pi.duel) return null;
  return finirPillageDuel(j, { victoire: false, porteurs: [], recit: { tours: 0, abattus: 0 } }, now);
}

/** Ce que le retour d'un pillage a donné */
export interface RetourPillage { nom: string; victoire: boolean; gain: number; perte: number; renom: number; carte: string | null; nouvelle: boolean }

/** Le retour d'un pillage : butin ou perte, Renom, empreinte volée, Usure et expérience ; à appeler par remonter() */
export function remonterPillage(j: Jeu, now: number): RetourPillage | null {
  const x = j.expedition;
  if (!x?.pillage) return null;
  const pi = x.pillage;
  const victoire = x.combat.issue === 'victoire';
  const etat = etatPillage(j);
  let gain = 0, perte = 0, renom = 0, carte: string | null = null, nouvelle = false;
  if (victoire) {
    gain = pi.base + pi.vol;
    j.composants += gain;
    etat.gagnes++;
    carte = empreinteVolee(j, pi, x.combat.rng ?? now);
    if (carte) nouvelle = ajouterCarte(j, carte);
    if (!pi.bot) renom = ajouterRenom(j, Math.round(PILLAGE.renom.attaque * multButin(pi.ecart)));
  } else {
    perte = Math.min(pi.perte ?? 0, j.composants);
    j.composants -= perte;
    etat.perdus++;
    if (!pi.bot) renom = ajouterRenom(j, PILLAGE.renom.attaqueRatee);
  }
  if (!pi.bot) etat.aEnvoyer.push({ cible: pi.cible, victoire, vol: victoire ? pi.vol : 0, perte, le: now });
  noterHistorique(j, { sens: 'attaque', nom: pi.nom, gagne: victoire, composants: victoire ? gain : -perte, le: now,
    ...(pi.bot ? { bot: true } : {}), ...(renom ? { renom } : {}), ...(carte ? { carte } : {}), ...(pi.revanche ? { revanche: true } : {}) });
  // l'Usure : une escarmouche (la moitié des PV perdus), et l'expérience d'un combat
  const xp = victoire ? Math.round(XP.combat * facteurXp(x.strate) * 0.75) : 0;
  for (const p of x.combat.porteurs) {
    const d = j.porteurs[p.id]!;
    const avantUsure = d.usure;
    usureAuRetour(j, p);
    d.usure = avantUsure + (d.usure - avantUsure) * PILLAGE.usure;
    if (xp) { const avant = niveauPorteur(j, p.id).niveau; const n = gagnerXp(j, p.id, xp); if (n && n > avant) log(j, tr`${porteurDef(p.id).nom} passe au niveau ${n} !`); }
    if (victoire) { const f = (d.faits ??= {}); f.combats = (f.combats ?? 0) + 1; }
  }
  j.expedition = null;
  log(j, victoire
    ? tr`Pillage réussi à ${pi.nom} : +${gain} minerai${pi.vol ? tr`, dont ${pi.vol} pris à ses réserves` : ''}.`
    : tr`Pillage repoussé à ${pi.nom}.${perte ? tr` L’escouade y laisse ${perte} minerai.` : ''}`);
  return { nom: pi.nom, victoire, gain, perte, renom, carte, nouvelle };
}

/** Une attaque subie, reçue du réseau à l'ouverture du jeu (id : celui du document en ligne ; par : l'attaquant) */
export interface PillageSubi { id?: string; par?: string; nom: string; victoire: boolean; vol: number; perte: number; le: number; recit?: RecitDefense }

/**
 * Applique les attaques subies pendant l'absence. Le défenseur fait lui-même respecter les limites (un attaquant tricheur ne
 * peut pas les contourner) : chaque attaque n'est comptée qu'une fois, au plus 3 par jour, aucune pendant les 8 h de bouclier
 * après une attaque perdue, aucune s'il est neutre ; ce qui est pris ou laissé est plafonné.
 */
export function subirPillages(j: Jeu, subis: PillageSubi[]): string[] {
  const etat = etatPillage(j);
  const recus = (etat.recus ??= []);
  const strate = Math.max(1, strateVaincue(j));
  const plafond = PILLAGE.plafondVol * butinCombat(strate);
  const l: string[] = [];
  for (const s of subis.slice().sort((a, b) => a.le - b.le)) {
    if (s.id && recus.some((r) => r.id === s.id)) continue;
    const neutre = etat.pavillon !== 'pirate' || (etat.neutreLe ?? 0) > s.le;
    const refusee = neutre || protege(recus, s.le);
    recus.push({ id: s.id ?? `${s.le}`, victoire: s.victoire && !refusee, le: s.le, ...(refusee ? { refusee: true } : {}) });
    if (refusee) { noterHistorique(j, { sens: 'defense', nom: s.nom, gagne: true, composants: 0, le: s.le, refusee: true }); continue; }
    if (s.victoire) {
      const pris = Math.min(Math.max(0, Math.floor(s.vol)), exposeDe(j.composants, strate), plafond);
      j.composants -= pris;
      const renom = ajouterRenom(j, PILLAGE.renom.defenseRatee);
      noterHistorique(j, { sens: 'defense', nom: s.nom, gagne: false, composants: -pris, le: s.le, ...(renom ? { renom } : {}), ...(s.par ? { par: s.par } : {}), ...(s.recit ? { recit: s.recit } : {}) });
      if (s.par) {
        const r = (etat.revanches ??= []).filter((x) => x.id !== s.par);
        r.push({ id: s.par, nom: s.nom, jusqua: s.le + PILLAGE.revancheMs });
        etat.revanches = r;
      }
      l.push(tr`${s.nom} a pillé ton district${pris ? tr` et pris ${pris} minerai` : ''}.${s.par ? tr(' La revanche t’attend au Port.') : ''}`);
    } else {
      const gagne = Math.min(Math.max(0, Math.floor(s.perte)), plafond);
      j.composants += gagne;
      const renom = ajouterRenom(j, PILLAGE.renom.defense);
      noterHistorique(j, { sens: 'defense', nom: s.nom, gagne: true, composants: gagne, le: s.le, ...(renom ? { renom } : {}), ...(s.recit ? { recit: s.recit } : {}) });
      const venus = confier(j, CONFIANCE.defense, 'defense');
      l.push(tr`Ta garnison a repoussé ${s.nom}${gagne ? tr` : +${gagne} minerai laissé sur tes quais` : ''}.${venus ? tr` Le quartier l’a vu : ${venus > 1 ? tr`${venus} familles te rejoignent` : tr('une famille te rejoint')}.` : tr(' Le quartier l’a vu.')}`);
    }
  }
  // on ne garde que deux jours d'attaques : assez pour le bouclier et pour ne rien compter deux fois
  const dernier = recus.reduce((m, r) => Math.max(m, r.le), 0);
  etat.recus = recus.filter((r) => dernier - r.le < 48 * HEURE);
  for (const m of l) log(j, m);
  return l;
}

/** Le défenseur est-il protégé ? (bouclier après une attaque perdue, ou trop d'attaques aujourd'hui) */
export function protege(subis: { victoire: boolean; le: number; refusee?: boolean }[], now: number): boolean {
  const jour = subis.filter((s) => !s.refusee && now - s.le < 24 * HEURE && now >= s.le);
  if (jour.length >= PILLAGE.subiesMax) return true;
  return jour.some((s) => s.victoire && now - s.le < PILLAGE.bouclierMs);
}

/** Le retour au district : celui d'un pillage, ou celui d'une descente (jeu.ts l'expose sous le nom remonter) */
export function remonter(j: Jeu): Retour {
  if (!j.expedition?.pillage) return remonterDescente(j);
  const p = remonterPillage(j, j.dernierTick)!;
  return { butin: p.gain, nouvelleStrate: false, victoire: p.victoire, fragment: null, cartes: p.carte ? [p.carte] : [], eclats: 0, pillage: p };
}

// ---------- Prêt à descendre ? (12 novembre 2026, révision complète) ----------
// Bryan : la progression doit venir de la force du deck qui grandit, et le joueur doit voir quand il est prêt, au lieu de
// perdre quatre fois sur cinq sans savoir pourquoi. La force conseillée d'une Strate est celle où le joueur moyen gagne son
// front une fois sur deux (mesurée sur 32 parties, `npx tsx scripts/puissance.ts`) : environ 2,2 fois la force de ses ennemis,
// plus pour les gardiens de −4 et de −10. Même échelle que les pillages et la Flèche, Usure comprise : une escouade fatiguée
// le voit aussi.
export const CONSEIL = {
  ratio: 2.2,
  strates: { 4: 5.3, 10: 7.5 } as Record<number, number>,
  /** en dessous de cette part de la force conseillée, le front est « risqué » ; entre les deux, « jouable » */
  jouable: 0.85,
  /** un Porteur est « fatigué » quand l'Usure lui a pris cette part de ses PV */
  fatigue: 0.2,
} as const;
export const forceConseillee = (strate: number): number => CONSEIL.strates[strate] ?? Math.round(CONSEIL.ratio * forceStrate(strate) * 10) / 10;
export type EtatFront = 'risque' | 'jouable' | 'pret';

/** L'escouade est-elle prête pour cette Strate ? Sa force, la force conseillée, et ce qui la renforcerait tout de suite */
export function pretAuFront(j: Jeu, escouade: string[], strate: number): { force: number; conseillee: number; etat: EtatFront; aMonter: string[]; fatigues: string[] } {
  const force = Math.round(forceEscouade(j, escouade) * 10) / 10, conseillee = forceConseillee(strate);
  const etat: EtatFront = force >= conseillee ? 'pret' : force >= CONSEIL.jouable * conseillee ? 'jouable' : 'risque';
  // les cartes de l'escouade qui ont déjà leurs doublons : un niveau à prendre avant de partir
  const aMonter = [...new Set(escouade.flatMap((id) => j.porteurs[id]?.modules ?? []))].filter((k) => {
    const c = j.collection[k];
    const requis = c ? doublonsRequis(k, c.niveau) : null;
    return !!c && requis !== null && c.doublons >= requis;
  });
  const fatigues = escouade.filter((id) => (j.porteurs[id]?.usure ?? 0) >= CONSEIL.fatigue * (pvNiveau(j, id) + bonusPv(j, id)));
  return { force, conseillee, etat, aMonter, fatigues };
}
