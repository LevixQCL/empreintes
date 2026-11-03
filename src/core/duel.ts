// Le duel en temps réel (3 novembre 2026, demande de Bryan : « code toute la partie duel en temps réel, mais ne le branche pas au jeu »).
// Deux directeurs, deux escouades de trois Porteurs, chacun son deck : les cartes qu'il a confiées à ses Porteurs.
//
// Un tour se joue en même temps des deux côtés : chacun compose sa chaîne en secret, avec un chrono (DUEL.chrono).
// Quand les deux ont verrouillé (ou que le chrono tombe), les deux chaînes se résolvent ensemble, dans cet ordre :
//   1. les boucliers des deux côtés ; 2. Brèche et Rapt ; 3. les coups (calculés sur l'état du début du tour, appliqués ensemble) ;
//   4. les soins (Relève comprise) ; 5. ce qui vaut pour le tour suivant (Flux, Élan, Désarmer, Sourdine, Fissure, Rempart).
// Les règles des cartes sont celles des Strates (Résonance, Écho, Finisseur, triangle des lignées, cartes éteintes) ;
// les effets qui visent l'intention d'un ennemi ont leur « version duel » (voir docs/duel.md).
//
// Comme le reste de src/core : aucun navigateur, un état sérialisable (JSON), un hasard déterministe par côté.
// Les deux joueurs (et plus tard un serveur) rejouent les mêmes choix sur le même état et obtiennent le même duel.

import { carteId, moduleDef, porteurDef, DEPART_PORTEURS } from './donnees';
import { cartesEnJeu, placesVides, puissanceCarte, PLACES_PORTEUR } from './collection';
import { effetsEnJeu } from './combat';
import { REGLES, analyserChaine, avantage, frequenceLibre, frequencesEffectives, meilleureFrequence, multEcho, places } from './regles';
import { graine, tireur } from './rng';
import type { Effet, Geste, GesteDef, Lignee, LigneeGeste, PorteurEtat } from './types';

/** Les réglages chiffrés du duel (mesurés au robot : tests/duel.test.ts, « durée d'un duel ») */
export const DUEL = {
  /** secondes pour composer sa chaîne ; au-delà, la chaîne posée part telle quelle */
  chrono: 30,
  /** secondes de grâce après le chrono avant de pouvoir réclamer la victoire à un adversaire absent */
  grace: 45,
  /** au-delà, le duel se décide aux PV restants (en part des PV max) */
  tourMax: 30,
  /** les duels qui s'éternisent : dès le tour `des`, les coups grossissent et les soins fondent (comme l'usure des Strates) */
  usure: { des: 10, attaqueParTour: 0.15, soinParTour: 0.1 },
  /** PV des Porteurs en duel (× leurs PV au district) : les cartes d'un joueur frappent plus fort qu'un ennemi des Strates.
   *  Mesuré au robot (escouades de départ, 60 duels) : ×1,6 → 12 tours en moyenne ; ×1,3 → 10 tours (8 à 13), soit 3 à 5 minutes,
   *  entre un combat des Strates (≈ 7 tours) et un combat qui traîne. Avec `pvForce` (3 novembre 2026) : ×1,15. */
  pv: 1.15,
  /** Les PV suivent aussi la force moyenne des cartes des DEUX escouades (puissance d'une place, comparée aux escouades de départ),
   *  à la puissance `pvForce` : sans ça, un duel de fin de jeu durait 4 à 5 tours (les cartes grandissent bien plus vite que les PV).
   *  Le même facteur pour les deux côtés : l'escouade la plus forte garde tout son avantage, seul le rythme reste le même.
   *  Mesuré (npm run duel, 30 duels par étape) : avant, 10 tours au début et 4,8 en fin de jeu ; après, 8 à 10 tours à toutes les étapes. */
  pvForce: 0.6,
  /** le dernier Porteur debout tient un peu mieux (il ne reste que lui) */
  dernierDebout: 0.85,
  /** part du soin en trop qui devient bouclier au tour suivant (Débord) */
  debord: 1,
  /** place de la mise : une seule carte, d'un métal au plus égal à celui de l'adversaire (vérifié avant le duel) */
  miseMax: 1,
} as const;

/** Une graine de duel au hasard (l'hôte la tire et la partage) */
export const graineDuel = graine;

export type Camp = 0 | 1;
export const autre = (c: Camp): Camp => (c === 0 ? 1 : 0);

/** Ce qu'un directeur apporte au duel : son pseudo et son escouade (même forme que la garnison des pillages et de la Flèche) */
export interface EscouadeDuel {
  nom: string;
  porteurs: { id: string; pv: number; cartes: { id: string; niveau: number }[] }[];
}

export interface CoteDuel {
  nom: string;
  porteurs: PorteurEtat[];
  pioche: Geste[];
  main: Geste[];
  defausse: Geste[];
  /** la chaîne du tour : secrète jusqu'à la résolution */
  chaine: Geste[];
  /** le Porteur adverse visé par les coups (null : le plus faible) */
  cible: string | null;
  /** bouclier gardé du tour d'avant (Rempart, Débord) */
  bouclier: number;
  flux: number;
  /** places en plus ce tour-ci (Élan reçu, Flux dépensé) */
  capaBonus: number;
  /** ce qui vaudra au tour suivant */
  elan: number;
  piocheBonus: number;
  /** ce tour-ci : mes coups perdent cette part (Désarmer de l'adversaire) */
  desarme: number;
  /** ce tour-ci : toutes mes cartes perdent cette part (Sourdine de l'adversaire) */
  sourdine: number;
  /** je subis cette part de dégâts en plus, pendant `fissureTours` tours */
  fissure: number;
  fissureTours: number;
  /** Lecture : je vois, pendant ce tour, le genre de la chaîne verrouillée par l'adversaire */
  lit: boolean;
  /** Flux dépensé ce tour-ci (rejoué tel quel chez l'adversaire) */
  repioches: number;
  allonges: number;
  pret: boolean;
  rng: number;
}

export type IssueDuel = 'en-cours' | 'gagne-0' | 'gagne-1' | 'egalite';

export interface LigneDuel { tour: number; camp: Camp | null; texte: string }

/** Ce qui se passe pendant la résolution, dans l'ordre, pour l'animation */
export type EvDuel =
  | { sorte: 'bouclier'; camp: Camp; uid: string; v: number }
  | { sorte: 'breche'; camp: Camp; uid: string; v: number; rapt: boolean }
  | { sorte: 'coup'; camp: Camp; uid: string; cible: string; v: number; absorbe: number; avantage: boolean }
  | { sorte: 'soin'; camp: Camp; uid: string | null; cible: string; v: number; releve?: boolean }
  | { sorte: 'terre'; camp: Camp; porteur: string }
  | { sorte: 'flux'; camp: Camp; v: number }
  | { sorte: 'fin'; issue: IssueDuel };

export interface DuelEtat {
  cotes: [CoteDuel, CoteDuel];
  tour: number;
  issue: IssueDuel;
  /** Abandon ou absence : le duel s'est arrêté avant la fin */
  abandon?: Camp;
  journal: LigneDuel[];
  /** ce qui s'est passé au dernier tour (animation, récapitulatif) */
  derniers: EvDuel[];
}

/**
 * Le choix d'un joueur pour un tour : c'est tout ce qui passe par le réseau. Le Flux dépensé d'abord (nouvelles mains,
 * places en plus), puis les cartes posées dans l'ordre, avec leur Fréquence et le Porteur soigné.
 */
export interface ChoixTour {
  repioches: number;
  allonges: number;
  chaine: { carte: string; f: number; soin?: string }[];
  cible: string | null;
}

export interface Resultat { ok: boolean; message?: string }
const non = (message: string): Resultat => ({ ok: false, message });
const OK: Resultat = { ok: true };

// ---------- Création ----------

/** Le deck de duel d'une escouade : les cartes de ses Porteurs à leur niveau, et leurs places vides (pas de cartes du district) */
export function deckDuel(e: EscouadeDuel): GesteDef[] {
  return e.porteurs.flatMap((p) => [...cartesEnJeu(p.id, p.cartes), ...placesVides(p.id, p.cartes.length)]);
}

/** Une escouade de duel valable : trois Porteurs différents, six cartes au plus chacun, des cartes qui existent */
export function validerEscouade(e: EscouadeDuel): Resultat {
  if (typeof e.nom !== 'string' || !e.nom.trim()) return non('Il faut un pseudo.');
  if (e.porteurs.length !== 3 || new Set(e.porteurs.map((p) => p.id)).size !== 3) return non('Il faut trois Porteurs différents.');
  for (const p of e.porteurs) {
    try { porteurDef(p.id); } catch { return non(`Porteur inconnu : ${p.id}.`); }
  }
  // Une escouade de duel réunit les trois lignées (3 novembre 2026, choix de Bryan : « c'est le seul moment où on a le contrôle »).
  // Mesuré avant (npm run duel) : une escouade d'une seule lignée battait une escouade mixte 80 % du temps (Augmentés, Génés).
  if (new Set(e.porteurs.map((p) => porteurDef(p.id).lignee)).size !== 3) return non('Il faut un Porteur de chaque lignée : un Augmenté, un Géné et un Résonant.');
  for (const p of e.porteurs) {
    if (!(p.pv > 0)) return non('Un Porteur sans PV ne peut pas combattre.');
    if (p.cartes.length > PLACES_PORTEUR) return non(`${porteurDef(p.id).nom} porte trop de cartes.`);
    for (const c of p.cartes) {
      try { moduleDef(c.id); } catch { return non(`Carte inconnue : ${c.id}.`); }
      if (!Number.isInteger(c.niveau) || c.niveau < 1) return non('Niveau de carte invalide.');
    }
  }
  return OK;
}

/** L'escouade de départ (Ilka, Doran, Véla et leurs cartes en fer) : pour essayer le duel sans partie */
export function escouadeDepart(nom: string): EscouadeDuel {
  return {
    nom,
    porteurs: Object.entries(DEPART_PORTEURS).map(([id, ids]) => ({ id, pv: porteurDef(id).pvMax, cartes: ids.map((m) => ({ id: carteId(m, 'fer'), niveau: 1 })) })),
  };
}

/** La puissance moyenne d'une place de l'escouade (une place vide compte zéro) */
export function puissanceEscouade(e: EscouadeDuel): number {
  const total = e.porteurs.reduce((n, p) => n + p.cartes.reduce((m, c) => m + puissanceCarte(c.id, c.niveau), 0), 0);
  return total / (PLACES_PORTEUR * Math.max(1, e.porteurs.length));
}
let REFERENCE = 0;
const reference = () => (REFERENCE ||= puissanceEscouade(escouadeDepart('')));

/** Le multiplicateur des PV d'un duel entre ces deux escouades (le même des deux côtés) */
export function multPvDuel(a: EscouadeDuel, b: EscouadeDuel): number {
  const f = (puissanceEscouade(a) + puissanceEscouade(b)) / 2 / reference();
  return DUEL.pv * Math.max(1, f) ** DUEL.pvForce;
}

function creerCote(e: EscouadeDuel, prefixe: string, rng: number, multPv: number): CoteDuel {
  const deck: Geste[] = deckDuel(e).map((g, k) => ({ ...g, uid: `${prefixe}${k}` }));
  const c: CoteDuel = {
    nom: e.nom,
    porteurs: e.porteurs.map((p) => { const pv = Math.round(p.pv * multPv); return { id: p.id, pv, pvMax: pv, aTerre: false }; }),
    pioche: [], main: [], defausse: [], chaine: [],
    cible: null, bouclier: 0, flux: 0, capaBonus: 0, elan: 0, piocheBonus: 0, desarme: 0, sourdine: 0, fissure: 0, fissureTours: 0,
    lit: false, repioches: 0, allonges: 0, pret: false, rng: rng >>> 0,
  };
  c.pioche = tireur(c).melanger(deck);
  piocher(c, REGLES.tailleMain);
  return c;
}

/** Un nouveau duel : la même graine et les mêmes escouades donnent le même duel chez les deux joueurs */
export function creerDuel(a: EscouadeDuel, b: EscouadeDuel, graine: number): DuelEtat {
  const s: DuelEtat = {
    // chaque côté a son propre hasard : ce que pioche l'un ne dépend pas de ce que fait l'autre
    cotes: [creerCote(a, 'a', graine, multPvDuel(a, b)), creerCote(b, 'b', Math.imul(graine ^ 0x9e3779b9, 2654435761), multPvDuel(a, b))],
    tour: 1,
    issue: 'en-cours',
    journal: [],
    derniers: [],
  };
  log(s, null, `${a.nom} affronte ${b.nom}.`);
  return s;
}

// ---------- Lecture ----------

const clone = <T>(x: T): T => structuredClone(x);
const log = (s: DuelEtat, camp: Camp | null, texte: string) => { s.journal.push({ tour: s.tour, camp, texte }); };
export const debout = (c: CoteDuel) => c.porteurs.filter((p) => p.pv > 0);
const aTerre = (c: CoteDuel, id: string | null) => !!id && (c.porteurs.find((p) => p.id === id)?.pv ?? 1) <= 0;
export const ligneeDe = (g: Pick<GesteDef, 'porteur'>): LigneeGeste => (g.porteur ? porteurDef(g.porteur).lignee : 'neutre');
export const capaciteDuel = (c: CoteDuel) => Math.min(REGLES.capaciteMax, REGLES.capaciteBase + c.capaBonus);
export const placesPrisesDuel = (c: CoteDuel) => c.chaine.reduce((n, g) => n + places(g), 0);
export const placesLibresDuel = (c: CoteDuel) => capaciteDuel(c) - placesPrisesDuel(c);
const nomP = (id: string) => porteurDef(id).nom;

/** Le Porteur adverse que frapperont les coups : celui qu'on vise, sinon le plus entamé (en part de ses PV) */
export function cibleEffective(s: DuelEtat, camp: Camp): PorteurEtat | undefined {
  const adv = s.cotes[autre(camp)];
  const v = debout(adv);
  const choisi = v.find((p) => p.id === s.cotes[camp].cible);
  return choisi ?? v.slice().sort((x, y) => x.pv / x.pvMax - y.pv / y.pvMax || x.pv - y.pv)[0];
}

/** Le Porteur de son côté qui a le plus besoin de soin */
function plusBlesse(c: CoteDuel): PorteurEtat | undefined {
  return debout(c).sort((x, y) => x.pv / x.pvMax - y.pv / y.pvMax)[0];
}

/** Multiplicateurs de l'usure du duel à ce tour */
export function usureDuel(tour: number): { attaque: number; soin: number } {
  const n = tour - DUEL.usure.des + 1;
  if (n <= 0) return { attaque: 1, soin: 1 };
  return { attaque: 1 + DUEL.usure.attaqueParTour * n, soin: Math.max(0, 1 - DUEL.usure.soinParTour * n) };
}

// ---------- Composer sa chaîne (en local, sur une copie de l'état) ----------

function pret(s: DuelEtat, camp: Camp): Resultat | null {
  if (s.issue !== 'en-cours') return non('Le duel est terminé.');
  if (s.cotes[camp].pret) return non('Ta chaîne est déjà verrouillée.');
  return null;
}

/** Pose une carte de la main au bout de la chaîne (Fréquence : celle qui fait la meilleure suite, ou celle demandée) */
export function poserDuel(s: DuelEtat, camp: Camp, uid: string, f?: number): Resultat {
  const r = pret(s, camp);
  if (r) return r;
  const c = s.cotes[camp];
  const i = c.main.findIndex((g) => g.uid === uid);
  if (i < 0) return non('Cette carte n’est pas dans ta main.');
  const g = c.main[i]!;
  if (g.vide) return non('Une place vide ne se joue pas.');
  if (places(g) > placesLibresDuel(c)) return non('Plus de place dans la chaîne.');
  const fs = g.fs ?? [g.f];
  if (f !== undefined && !frequenceLibre(g.effet) && !fs.includes(f)) return non('Cette carte ne prend pas cette Fréquence.');
  c.main.splice(i, 1);
  if (!frequenceLibre(g.effet)) g.f = f ?? meilleureFrequence(c.chaine, fs);
  if (g.type === 'soin' && g.effet?.type !== 'vague' && g.effet?.type !== 'debord') g.cible = plusBlesse(c)?.id;
  c.chaine.push(g);
  return OK;
}

/** Reprend une carte de la chaîne dans la main */
export function reprendreDuel(s: DuelEtat, camp: Camp, uid: string): Resultat {
  const r = pret(s, camp);
  if (r) return r;
  const c = s.cotes[camp];
  const i = c.chaine.findIndex((g) => g.uid === uid);
  if (i < 0) return non('Cette carte n’est pas dans la chaîne.');
  const [g] = c.chaine.splice(i, 1);
  if (g!.fs) g!.f = g!.fs[0]!;
  delete g!.cible;
  c.main.push(g!);
  return OK;
}

/** Déplace une carte dans la chaîne (l'ordre fait les suites) */
export function deplacerDuel(s: DuelEtat, camp: Camp, uid: string, vers: number): Resultat {
  const r = pret(s, camp);
  if (r) return r;
  const c = s.cotes[camp];
  const i = c.chaine.findIndex((g) => g.uid === uid);
  if (i < 0) return non('Cette carte n’est pas dans la chaîne.');
  const [g] = c.chaine.splice(i, 1);
  c.chaine.splice(Math.max(0, Math.min(c.chaine.length, vers)), 0, g!);
  return OK;
}

/** Choisit le Porteur adverse à frapper */
export function viserDuel(s: DuelEtat, camp: Camp, porteur: string | null): Resultat {
  const r = pret(s, camp);
  if (r) return r;
  if (porteur !== null && !debout(s.cotes[autre(camp)]).some((p) => p.id === porteur)) return non('Ce Porteur est déjà à terre.');
  s.cotes[camp].cible = porteur;
  return OK;
}

/** Choisit qui soigne une carte de soin posée */
export function soignerDuel(s: DuelEtat, camp: Camp, uid: string, porteur: string): Resultat {
  const r = pret(s, camp);
  if (r) return r;
  const c = s.cotes[camp];
  const g = c.chaine.find((x) => x.uid === uid);
  if (!g || g.type !== 'soin') return non('Ce n’est pas une carte de soin posée.');
  if (!debout(c).some((p) => p.id === porteur)) return non('On ne soigne pas un Porteur à terre (sauf une Relève).');
  g.cible = porteur;
  return OK;
}

/** Dépense 1 Flux : une place de plus ce tour-ci */
export function allongerDuel(s: DuelEtat, camp: Camp): Resultat {
  const r = pret(s, camp);
  if (r) return r;
  const c = s.cotes[camp];
  if (c.flux < 1 || capaciteDuel(c) >= REGLES.capaciteMax) return non('Pas assez de Flux, ou chaîne déjà au plus long.');
  c.flux--;
  c.capaBonus++;
  c.allonges++;
  return OK;
}

/** Dépense 1 Flux : la main et la chaîne posée partent à la défausse, nouvelle main */
export function repiocherDuel(s: DuelEtat, camp: Camp): Resultat {
  const r = pret(s, camp);
  if (r) return r;
  const c = s.cotes[camp];
  if (c.flux < 1) return non('Pas assez de Flux.');
  c.flux--;
  for (const g of c.chaine) { if (g.fs) g.f = g.fs[0]!; delete g.cible; }
  c.defausse.push(...c.main, ...c.chaine);
  c.main = [];
  c.chaine = [];
  piocher(c, REGLES.tailleMain);
  c.repioches++;
  return OK;
}

/** Ce qu'on envoie à l'adversaire en verrouillant : rien d'autre ne passe par le réseau */
export function choixDe(s: DuelEtat, camp: Camp): ChoixTour {
  const c = s.cotes[camp];
  return {
    repioches: c.repioches,
    allonges: c.allonges,
    chaine: c.chaine.map((g) => ({ carte: g.uid, f: g.f, ...(g.cible ? { soin: g.cible } : {}) })),
    cible: c.cible,
  };
}

/** Un choix vide (chrono tombé sans rien poser, ou adversaire absent) */
export const CHOIX_VIDE: ChoixTour = { repioches: 0, allonges: 0, chaine: [], cible: null };

/**
 * Rejoue le choix d'un joueur sur l'état commun et verrouille son côté. Un choix impossible (triche, désynchronisation)
 * est refusé en entier : rien n'est modifié.
 */
export function appliquerChoix(s: DuelEtat, camp: Camp, choix: ChoixTour): Resultat {
  const r = pret(s, camp);
  if (r) return r;
  const essai = clone(s);
  const c = essai.cotes[camp];
  if (!Number.isInteger(choix.repioches) || !Number.isInteger(choix.allonges) || choix.repioches < 0 || choix.allonges < 0) return non('Choix invalide.');
  for (let k = 0; k < choix.repioches; k++) { const x = repiocherDuel(essai, camp); if (!x.ok) return x; }
  for (let k = 0; k < choix.allonges; k++) { const x = allongerDuel(essai, camp); if (!x.ok) return x; }
  if (choix.cible !== null) { const x = viserDuel(essai, camp, choix.cible); if (!x.ok) return x; }
  for (const p of choix.chaine) {
    const x = poserDuel(essai, camp, p.carte, p.f);
    if (!x.ok) return x;
    if (p.soin) { const y = soignerDuel(essai, camp, p.carte, p.soin); if (!y.ok) return y; }
  }
  c.pret = true;
  Object.assign(s, essai);
  return OK;
}

/** Verrouille la chaîne déjà composée sur cet état (jeu local, sans réseau). En ligne : appliquerChoix sur l'état commun. */
export function verrouillerDuel(s: DuelEtat, camp: Camp): Resultat {
  const r = pret(s, camp);
  if (r) return r;
  s.cotes[camp].pret = true;
  return OK;
}

/** Les deux côtés ont verrouillé : on peut résoudre */
export const deuxPrets = (s: DuelEtat) => s.cotes[0].pret && s.cotes[1].pret;

/** Lecture (version duel) : le genre de la chaîne verrouillée par l'adversaire, sans la force ni la cible */
export function lectureAdverse(s: DuelEtat, camp: Camp): { atk: number; bouclier: number; soin: number } | null {
  if (!s.cotes[camp].lit) return null;
  const adv = s.cotes[autre(camp)];
  if (!adv.pret) return null;
  const n = (t: string) => adv.chaine.filter((g) => g.type === t).length;
  return { atk: n('atk'), bouclier: n('bouclier'), soin: n('soin') };
}

// ---------- La force d'une carte ----------

type Contexte = { s: DuelEtat; camp: Camp; chaine: Geste[]; mult: number; flux: number };
const de = <T extends Effet['type']>(effets: (Effet | undefined)[], t: T) => effets.find((e): e is Extract<Effet, { type: T }> => e?.type === t);

/** La force d'une carte dans sa chaîne, avant ce que la cible y change (lignée, Fissure, bouclier) */
function forceCarte(x: Contexte, g: Geste, rang: number): { v: number; effets: (Effet | undefined)[] } {
  const c = x.s.cotes[x.camp];
  const eteinte = aTerre(c, g.porteur);
  const effets = effetsEnJeu(g, x.chaine, rang, eteinte);
  let m = x.mult * multEcho(x.chaine, rang);
  // Finisseur : la carte Augmentée qui termine une suite qui résonne
  if (REGLES.finisseur !== 1 && x.mult > 1 && g.type === 'atk' && ligneeDe(g) === 'tech') {
    const fs = frequencesEffectives(x.chaine);
    if (rang >= 2 && fs[rang - 1] === fs[rang]! - 1 && fs[rang - 2] === fs[rang]! - 2 && fs[rang + 1] !== fs[rang]! + 1) m *= REGLES.finisseur;
  }
  const cr = de(effets, 'crescendo');
  if (cr) m *= 1 + cr.part * rang;
  const sc = de(effets, 'secours');
  const tombes = c.porteurs.filter((p) => p.pv <= 0).length;
  if (sc && tombes) m *= 1 + sc.part * tombes;
  const dc = de(effets, 'decharge');
  if (dc) m *= 1 + dc.part * Math.min(x.flux, dc.max ?? REGLES.fluxMax);
  const prec = rang > 0 ? x.chaine[rang - 1] : undefined;
  const am = prec ? de(effetsEnJeu(prec, x.chaine, rang - 1, aTerre(c, prec.porteur)), 'amorce') : undefined;
  if (am) m *= 1 + am.part;
  const un = de(effets, 'unisson');
  if (un) {
    const fs = frequencesEffectives(x.chaine);
    m *= 1 + un.part * fs.filter((f, k) => k !== rang && f === fs[rang]).length;
  }
  if (!eteinte && g.effet?.type === 'empreinte' && !effets[0]) m *= REGLES.empreinteSeule;
  const st = de(effets, 'surtension');
  if (st) m *= 1 + st.part;
  if (eteinte) m *= REGLES.eteinte;
  if (c.sourdine) m *= 1 - c.sourdine;
  if (g.type === 'atk') {
    if (c.desarme) m *= 1 - c.desarme;
    m *= usureDuel(x.s.tour).attaque;
  }
  if (g.type === 'soin') m *= usureDuel(x.s.tour).soin;
  return { v: Math.max(0, Math.round(g.v * m)), effets };
}

function contexte(s: DuelEtat, camp: Camp): Contexte {
  const c = s.cotes[camp];
  const a = analyserChaine(c.chaine);
  return { s, camp, chaine: c.chaine, mult: a.mult, flux: c.flux };
}

/** Ce qu'un coup fait à la cible : triangle des lignées, Fissure, Curée */
function multCible(s: DuelEtat, camp: Camp, g: Geste, effets: (Effet | undefined)[], cible: PorteurEtat, fissure: number): number {
  let m = avantage(ligneeDe(g), porteurDef(cible.id).lignee as Lignee);
  if (fissure) m *= 1 + fissure;
  const cu = de(effets, 'curee');
  if (cu && (fissure || cible.pv <= cible.pvMax / 2)) m *= 1 + cu.part;
  const fa = de(effets, 'faille');
  if (fa && s.cotes[camp].lit) m *= 1 + fa.part;
  if (debout(s.cotes[autre(camp)]).length === 1) m *= DUEL.dernierDebout;
  return m;
}

/** Ce que la chaîne posée fera (sans connaître celle de l'adversaire) : pour l'aperçu et le robot */
export function apercuDuel(s: DuelEtat, camp: Camp): { degats: number; bouclier: number; soin: number; cible: string | null } {
  const x = contexte(s, camp);
  const adv = s.cotes[autre(camp)];
  const cible = cibleEffective(s, camp);
  let degats = 0, bouclier = 0, soin = 0, fissure = adv.fissure;
  x.chaine.forEach((g, rang) => {
    if (g.vide) return;
    const { v, effets } = forceCarte(x, g, rang);
    if (g.type === 'bouclier') bouclier += v;
    else if (g.type === 'soin') soin += v;
    else if (cible) {
      const fois = de(effets, 'rafale') && x.chaine.length >= 4 ? 2 : 1;
      degats += Math.round(v * multCible(s, camp, g, effets, cible, fissure)) * fois;
    }
    const fi = de(effets, 'fissure');
    if (fi) fissure = Math.max(fissure, fi.part);
  });
  return { degats, bouclier, soin, cible: cible?.id ?? null };
}

// ---------- La résolution du tour ----------

interface Coup { camp: Camp; uid: string; cible: PorteurEtat; v: number; percant: boolean; siphon: number; porteur: string | null; avantage: boolean }

/** Résout le tour (les deux côtés doivent avoir verrouillé). Renvoie ce qui s'est passé, dans l'ordre, pour l'animation. */
export function resoudreTour(s: DuelEtat): EvDuel[] {
  if (s.issue !== 'en-cours' || !deuxPrets(s)) return [];
  const ev: EvDuel[] = [];
  const camps: Camp[] = [0, 1];
  const ctx = camps.map((k) => contexte(s, k)) as [Contexte, Contexte];
  const forces = camps.map((k) => ctx[k].chaine.map((g, rang) => (g.vide ? { v: 0, effets: [] as (Effet | undefined)[] } : forceCarte(ctx[k], g, rang)))) as [ReturnType<typeof forceCarte>[], ReturnType<typeof forceCarte>[]];
  const analyse = camps.map((k) => analyserChaine(ctx[k].chaine));
  for (const k of camps) {
    const a = analyse[k]!;
    if (a.suite >= 3) log(s, k, `${s.cotes[k].nom} : Résonance, suite de ${a.suite}.`);
    if (a.echo) log(s, k, `${s.cotes[k].nom} : Écho ×${a.echoN ?? 3}.`);
  }

  // 1. Les boucliers (Riposte : la carte frappera d'une part du bouclier, une fois tous les boucliers posés)
  for (const k of camps) {
    const c = s.cotes[k];
    c.chaine.forEach((g, rang) => {
      if (g.type !== 'bouclier' || g.vide) return;
      const v = forces[k][rang]!.v;
      c.bouclier += v;
      ev.push({ sorte: 'bouclier', camp: k, uid: g.uid, v });
    });
  }
  // 2. Brèche (brise le bouclier adverse) et Rapt (le prend pour soi), avant les coups.
  //    Les deux côtés agissent sur les boucliers posés à l'étape 1, en même temps : aucun n'est avantagé par son camp.
  const bouclierPose = [s.cotes[0].bouclier, s.cotes[1].bouclier];
  const brise = [false, false];
  const vole = [0, 0];
  for (const k of camps) {
    const adv = autre(k);
    s.cotes[k].chaine.forEach((g, rang) => {
      const ef = forces[k][rang]!.effets;
      const rapt = !!de(ef, 'rapt');
      if (!rapt && !de(ef, 'breche')) return;
      const pris = brise[adv] ? 0 : bouclierPose[adv]!;
      brise[adv] = true;
      if (rapt) vole[k]! += pris;
      ev.push({ sorte: 'breche', camp: k, uid: g.uid, v: pris, rapt });
      if (pris) log(s, k, `${g.nom} ${rapt ? 'arrache' : 'brise'} ${pris} de bouclier.`);
    });
  }
  for (const k of camps) s.cotes[k].bouclier = (brise[k] ? 0 : bouclierPose[k]!) + vole[k]!;
  // 3. Les coups : calculés sur l'état du début des coups, appliqués ensemble (un Porteur qui tombe frappe quand même ce tour-ci)
  const coups: Coup[] = [];
  const nouvellesFissures: [number, number] = [0, 0];
  for (const k of camps) {
    const c = s.cotes[k];
    const adv = s.cotes[autre(k)];
    let fissure = adv.fissure;
    c.chaine.forEach((g, rang) => {
      const { v, effets } = forces[k][rang]!;
      const cible = cibleEffective(s, k);
      if (cible) {
        const percant = !!de(effets, 'percant');
        const siphon = de(effets, 'siphon')?.part ?? 0;
        const tirer = (val: number, uid = g.uid) => {
          const mc = multCible(s, k, g, effets, cible, fissure);
          coups.push({ camp: k, uid, cible, v: Math.round(val * mc), percant, siphon, porteur: g.porteur, avantage: avantage(ligneeDe(g), porteurDef(cible.id).lignee) > 1 });
        };
        if (g.type === 'atk' && !g.vide) {
          tirer(v);
          if (de(effets, 'rafale') && c.chaine.length >= 4) tirer(v);
        }
        const rp = g.type === 'bouclier' ? de(effets, 'riposte') : undefined;
        if (rp) tirer(Math.round(c.bouclier * rp.part));
      }
      const fi = de(effets, 'fissure');
      if (fi) { fissure = Math.max(fissure, fi.part); nouvellesFissures[k] = Math.max(nouvellesFissures[k], fi.part); }
    });
  }
  const infliges: [number, number] = [0, 0];
  const soinsSiphon: { camp: Camp; porteur: string | null; v: number; uid: string }[] = [];
  for (const co of coups) {
    const adv = s.cotes[autre(co.camp)];
    const absorbe = co.percant ? 0 : Math.min(adv.bouclier, co.v);
    adv.bouclier -= absorbe;
    const net = co.v - absorbe;
    const avant = co.cible.pv;
    co.cible.pv = Math.max(0, co.cible.pv - net);
    ev.push({ sorte: 'coup', camp: co.camp, uid: co.uid, cible: co.cible.id, v: net, absorbe, avantage: co.avantage });
    infliges[co.camp] += avant - co.cible.pv;
    if (co.siphon && avant > co.cible.pv) soinsSiphon.push({ camp: co.camp, porteur: co.porteur, v: Math.round((avant - co.cible.pv) * co.siphon), uid: co.uid });
  }
  // la Surtension se paie en PV (jamais jusqu'à tomber)
  for (const k of camps) {
    s.cotes[k].chaine.forEach((g, rang) => {
      const st = de(forces[k][rang]!.effets, 'surtension');
      const p = s.cotes[k].porteurs.find((q) => q.id === g.porteur);
      if (st && p && p.pv > 1) p.pv = Math.max(1, p.pv - Math.round(p.pvMax * st.cout));
    });
  }

  // 4. Les soins (et la Relève, qui peut relever un Porteur tombé ce tour-ci)
  const surplus: [number, number] = [0, 0];
  const soigner = (k: Camp, p: PorteurEtat, v: number, uid: string | null, releve = false) => {
    const avant = p.pv;
    p.pv = Math.min(p.pvMax, p.pv + v);
    if (p.pv > 0) p.aTerre = false;
    ev.push({ sorte: 'soin', camp: k, uid, cible: p.id, v: p.pv - avant, ...(releve ? { releve } : {}) });
    return v - (p.pv - avant);
  };
  for (const k of camps) {
    const c = s.cotes[k];
    c.chaine.forEach((g, rang) => {
      if (g.type !== 'soin' || g.vide) return;
      const { v, effets } = forces[k][rang]!;
      if (de(effets, 'releve')) {
        const tombe = c.porteurs.find((p) => p.pv <= 0);
        if (tombe) {
          soigner(k, tombe, v, g.uid, true);
          log(s, k, `${g.nom} relève ${nomP(tombe.id)}.`);
          if (g.unique) g.epuise = true;
          return;
        }
      }
      if (de(effets, 'vague') || de(effets, 'debord')) {
        let trop = 0;
        for (const p of debout(c)) trop += soigner(k, p, v, g.uid);
        if (de(effets, 'debord')) surplus[k] += Math.round(trop * DUEL.debord);
        return;
      }
      const p = debout(c).find((q) => q.id === g.cible) ?? plusBlesse(c);
      if (p) soigner(k, p, v, g.uid);
    });
  }
  for (const sp of soinsSiphon) {
    const c = s.cotes[sp.camp];
    const p = debout(c).find((q) => q.id === sp.porteur) ?? plusBlesse(c);
    if (p && sp.v > 0) soigner(sp.camp, p, sp.v, sp.uid);
  }

  // 5. Ce qui vaut pour le tour suivant
  for (const k of camps) {
    const c = s.cotes[k];
    const adv = s.cotes[autre(k)];
    for (const p of c.porteurs) {
      if (p.pv <= 0 && !p.aTerre) { p.aTerre = true; ev.push({ sorte: 'terre', camp: k, porteur: p.id }); log(s, k, `${nomP(p.id)} (${c.nom}) est à terre.`); }
    }
    const a = analyse[k]!;
    let flux = (a.suite >= 3 ? 1 : 0) + (a.echo ? 1 : 0) + ((a.echoN ?? 0) >= 5 ? REGLES.fluxEcho5 : 0);
    let elan = 0, pioche = 0, desarme = 0, sourdine = 0, rempart = 0, vide = 0, lit = false;
    c.chaine.forEach((_g, rang) => {
      const ef = forces[k][rang]!.effets;
      const fl = de(ef, 'flux'); if (fl) flux += fl.v;
      const dc = de(ef, 'decharge');
      if (dc) { const pris = Math.min(c.flux, dc.max ?? REGLES.fluxMax); vide += pris; if (!pris && dc.recharge) flux += dc.recharge; }
      if (de(ef, 'elan')) elan++;
      if (de(ef, 'pioche')) pioche++;
      if (de(ef, 'lecture')) lit = true;
      const ds = de(ef, 'desarmer'); if (ds) desarme = Math.max(desarme, ds.part);
      const so = de(ef, 'sourdine'); if (so) sourdine = Math.max(sourdine, so.part);
      const rp = de(ef, 'rempart'); if (rp) rempart = Math.max(rempart, rp.part);
    });
    c.flux = Math.max(0, Math.min(REGLES.fluxMax, c.flux - vide + flux));
    if (flux) ev.push({ sorte: 'flux', camp: k, v: flux });
    c.bouclier = Math.round(c.bouclier * rempart) + surplus[k];
    c.elan = elan;
    c.piocheBonus = pioche;
    c.lit = lit;
    adv.desarme = desarme;
    adv.sourdine = sourdine;
    // la Fissure posée ce tour-ci vaut encore tout le tour suivant
    if (nouvellesFissures[k]) { adv.fissure = Math.max(adv.fissure, nouvellesFissures[k]); adv.fissureTours = 2; }
  }
  for (const k of camps) {
    const c = s.cotes[k];
    if (c.fissureTours > 0 && --c.fissureTours === 0) c.fissure = 0;
  }

  // 6. L'issue, puis le tour suivant
  const tombes = camps.map((k) => debout(s.cotes[k]).length === 0);
  // les deux escouades tombent ensemble : le duel va à celle qui a frappé le plus fort ce tour-ci (sinon trop d'égalités : 15 % au robot)
  if (tombes[0] && tombes[1]) s.issue = infliges[0] === infliges[1] ? 'egalite' : infliges[0] > infliges[1] ? 'gagne-0' : 'gagne-1';
  else if (tombes[0]) s.issue = 'gagne-1';
  else if (tombes[1]) s.issue = 'gagne-0';
  else if (s.tour >= DUEL.tourMax) {
    const part = (c: CoteDuel) => c.porteurs.reduce((n, p) => n + p.pv, 0) / c.porteurs.reduce((n, p) => n + p.pvMax, 0);
    const a = part(s.cotes[0]), b = part(s.cotes[1]);
    s.issue = Math.abs(a - b) < 1e-9 ? 'egalite' : a > b ? 'gagne-0' : 'gagne-1';
    log(s, null, 'Le duel s’éternise : il se décide aux PV restants.');
  }
  if (s.issue !== 'en-cours') {
    ev.push({ sorte: 'fin', issue: s.issue });
    log(s, null, s.issue === 'egalite' ? 'Égalité.' : `${s.cotes[s.issue === 'gagne-0' ? 0 : 1].nom} remporte le duel.`);
  }
  for (const k of camps) finirTour(s.cotes[k], forces[k]);
  s.tour++;
  s.derniers = ev;
  return ev;
}

function finirTour(c: CoteDuel, forces: { effets: (Effet | undefined)[] }[]) {
  // Rappel : la carte la plus forte de la chaîne (hors elle) revient en tête de pioche
  const rappel = c.chaine.findIndex((_g, k) => !!de(forces[k]?.effets ?? [], 'rappel'));
  const rappelee = rappel >= 0 ? c.chaine.filter((g, k) => k !== rappel && !g.vide && g.effet?.type !== 'rappel').sort((a, b) => b.v - a.v)[0] : undefined;
  for (const g of c.chaine) {
    if (g.fs) g.f = g.fs[0]!;
    delete g.cible;
    if (g === rappelee || g.epuise) continue;
    c.defausse.push(g);
  }
  if (rappelee) c.pioche.push(rappelee);
  c.chaine = [];
  c.defausse.push(...c.main.filter((g) => g.vide));
  c.main = c.main.filter((g) => !g.vide);
  piocher(c, REGLES.tailleMain + c.piocheBonus);
  c.piocheBonus = 0;
  c.capaBonus = c.elan;
  c.elan = 0;
  c.repioches = 0;
  c.allonges = 0;
  c.pret = false;
  // une cible tombée est simplement ignorée (cibleEffective reprend le plus entamé)
}

function piocher(c: CoteDuel, taille: number) {
  const r = tireur(c);
  let garde = 0;
  while (c.main.length < taille && garde++ < 80) {
    if (!c.pioche.length) {
      if (!c.defausse.length) break;
      c.pioche = r.melanger(c.defausse);
      c.defausse = [];
    }
    c.main.push(c.pioche.pop()!);
  }
}

/** Abandon (ou absence prolongée constatée par l'adversaire) */
export function abandonner(s: DuelEtat, camp: Camp): void {
  if (s.issue !== 'en-cours') return;
  s.abandon = camp;
  s.issue = camp === 0 ? 'gagne-1' : 'gagne-0';
  log(s, camp, `${s.cotes[camp].nom} quitte le duel.`);
}

/** Le gagnant (null : égalité ou duel en cours) */
export const gagnant = (s: DuelEtat): Camp | null => (s.issue === 'gagne-0' ? 0 : s.issue === 'gagne-1' ? 1 : null);

/**
 * La mise (idée de Bryan du 29 octobre 2026 : « éventuellement en pariant une carte, le gagnant la remporte ») :
 * chacun met une carte ; le gagnant reprend la sienne et prend celle de l'autre ; en cas d'égalité, chacun garde la sienne.
 * Pas de hasard payant : la mise se gagne au jeu, jamais à un tirage. À relier à la collection le jour du branchement.
 */
export function regleMise(s: DuelEtat, mises: [string | null, string | null]): { gagnant: Camp; gagne: string | null; perdant: Camp; perdu: string | null } | null {
  const g = gagnant(s);
  if (g === null) return null;
  return { gagnant: g, gagne: mises[autre(g)], perdant: autre(g), perdu: mises[autre(g)] };
}

// ---------- Le robot de duel (pour s'entraîner, et mesurer l'équilibre) ----------

/**
 * Le robot cherche la meilleure chaîne de sa main (toutes les suites de cartes qui tiennent dans la chaîne, et chaque cible) :
 * dégâts qui passent, Porteur achevé, bouclier et soins utiles. Il ne voit pas la chaîne de l'adversaire.
 */
export function choixRobot(s: DuelEtat, camp: Camp): ChoixTour {
  const base = clone(s);
  const c = base.cotes[camp];
  if (c.pret || base.issue !== 'en-cours') return CHOIX_VIDE;
  // une place de plus quand le Flux le permet et que la main est grande
  if (c.flux >= 2 && c.main.filter((g) => !g.vide).length >= 4) allongerDuel(base, camp);
  const jouables = c.main.filter((g) => !g.vide).map((g) => g.uid);
  const adv = base.cotes[autre(camp)];
  const cibles = debout(adv).map((p) => p.id);
  const menace = debout(adv).length ? 1 : 0;
  let meilleur: { score: number; choix: ChoixTour } = { score: -Infinity, choix: choixDe(base, camp) };
  const essayer = (ordre: string[]) => {
    for (const cible of cibles) {
      const t = clone(base);
      viserDuel(t, camp, cible);
      let ok = true;
      for (const uid of ordre) if (!poserDuel(t, camp, uid).ok) { ok = false; break; }
      if (!ok) continue;
      const a = apercuDuel(t, camp);
      const cp = t.cotes[autre(camp)].porteurs.find((p) => p.id === cible)!;
      const passe = Math.max(0, a.degats - adv.bouclier * 0.5);
      const acheve = passe >= cp.pv ? 40 + cp.pvMax * 0.3 : 0;
      const manque = debout(t.cotes[camp]).reduce((n, p) => n + (p.pvMax - p.pv), 0);
      const score = Math.min(passe, cp.pv) + acheve + a.bouclier * 0.6 * menace + Math.min(a.soin, manque) * 0.8 + t.cotes[camp].chaine.length * 0.01;
      if (score > meilleur.score) meilleur = { score, choix: choixDe(t, camp) };
    }
  };
  const cap = capaciteDuel(c);
  const visiter = (ordre: string[], restant: string[], placesPrises: number) => {
    if (ordre.length) essayer(ordre);
    for (const uid of restant) {
      const g = c.main.find((x) => x.uid === uid)!;
      if (placesPrises + places(g) > cap) continue;
      visiter([...ordre, uid], restant.filter((x) => x !== uid), placesPrises + places(g));
    }
  };
  visiter([], jouables, 0);
  return meilleur.choix;
}
