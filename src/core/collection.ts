// La collection : les cartes qui tombent dans les Strates, leurs raretés, les doublons et les niveaux.
// Tout le hasard passe par un état `rng` sauvegardé : aucun hasard n'est jamais payé.

import { VOIES, carteId, estCarteConnue, gesteDeCarte, moduleDef, renforcer, tirablesEn } from './donnees';
import { tireur } from './rng';
import type { Effet, GesteDef, Lignee, ModuleDef, Rarete } from './types';
import { t as tr } from './i18n';

export const RARETES: Rarete[] = ['fer', 'cuivre', 'argent', 'or', 'nacre'];
export const NOMS_RARETE: Record<Rarete, string> = { fer: tr('Fer'), cuivre: tr('Cuivre'), argent: tr('Argent'), or: tr('Or'), nacre: tr('Nacre') };

export const COLLECTION = {
  /** chance qu'un combat normal fasse tomber une carte */
  chanceCombat: 0.2,
  /** une trouvaille d'expédition est, à cette fréquence, un doublon d'une carte qu'on possède déjà dans ce métal :
   *  plus on joue, plus les cartes montent (étude du 22/10/2026 : les doublons se diluaient sur 225 exemplaires) */
  affinite: 0.4,
  /**
   * Les niveaux (10 novembre 2026, remarque de Luc : « trop de niveaux ça tue, entre 3 et 5 c'est suffisant ») : 5 niveaux pour
   * toutes les cartes, quel que soit le métal. Niveaux 2 et 4 : environ +15 % de la force de départ chacun (jamais moins
   * de +1 ; parcours simulé : −10 au jour 35 à +10 %, 26 à +20 %, 29,5 à +15 % comme avant la refonte) ; niveaux 3 et 5 : un cran d'effet chacun (+20 % de la part de l'effet : une Fissure
   * 25 % → 30 % → 35 %), ou, pour une carte sans part à renforcer (sans effet, Élan, Vague…), +5 % de force par cran.
   * Avant, une carte de fer avait 9 niveaux et une d'or 3 : le Voile du murmure passait de 5 à 14 de force (+180 %), plus
   * qu'une carte d'or. Le métal redevient la grande différence ; le niveau 5 garde le liseré de maîtrise.
   */
  bonusNiveau: 0.15,
  /** un cran d'effet : +20 % de la part ; ou, sans part, +5 % de force */
  cranEffet: 0.2,
  cranForce: 0.05,
  niveauMax: 5,
  /** niveau de départ selon la rareté : 1 pour toutes depuis le 10 novembre 2026 */
  niveauDepart: { fer: 1, cuivre: 1, argent: 1, or: 1, nacre: 1 } as Record<Rarete, number>,
  /** doublons pour passer au niveau suivant (2, 3, 4, 5) : moins de doublons tombent dans les métaux rares */
  doublons: {
    fer: [2, 4, 7, 12],
    cuivre: [1, 3, 5, 8],
    argent: [1, 2, 4, 6],
    or: [1, 2, 3, 4],
    nacre: [1, 1, 2, 3],
  } as Record<Rarete, number[]>,
  /** composants rendus par le recyclage d'un doublon */
  recyclage: { fer: 5, cuivre: 15, argent: 40, or: 100, nacre: 250 } as Record<Rarete, number>,
  /** refabriquer un exemplaire : environ 5 fois le recyclage, plus des Éclats, plus du temps de Forge.
   *  9 novembre 2026 (cristal unique) : tout se paie en cristaux (`energie`) = composants d'avant + énergie ÷ 20. */
  refabrication: {
    fer: { composants: 0, eclats: 0, minutes: 5, energie: 27 },
    cuivre: { composants: 0, eclats: 0, minutes: 20, energie: 81 },
    argent: { composants: 0, eclats: 2, minutes: 60, energie: 215 },
    or: { composants: 0, eclats: 5, minutes: 180, energie: 535 },
    nacre: { composants: 0, eclats: 12, minutes: 480, energie: 1330 },
  } as Record<Rarete, { composants: number; eclats: number; minutes: number; energie: number }>,
  /** garanties : après N cartes sans cette rareté (ou mieux), la suivante l'est forcément */
  garanties: { argent: 40, or: 150, nacre: 600 },
} as const;

/** Chances de rareté selon la profondeur (en %) */
export function tableRarete(strate: number): Record<Rarete, number> {
  if (strate <= 2) return { fer: 88, cuivre: 11, argent: 1, or: 0, nacre: 0 };
  if (strate <= 4) return { fer: 78, cuivre: 18, argent: 3.5, or: 0.5, nacre: 0 };
  if (strate <= 9) return { fer: 70, cuivre: 22, argent: 6.6, or: 1.4, nacre: 0 };
  return { fer: 64, cuivre: 25, argent: 8.4, or: 2.4, nacre: 0.2 };
}

export interface CarteCollection {
  niveau: number;
  /** doublons accumulés vers le niveau suivant */
  doublons: number;
}

/** Ce que la collection a besoin de connaître de la partie */
export interface EtatCollection {
  collection: Record<string, CarteCollection>;
  /** cartes tirées depuis la dernière de chaque rareté (pour les garanties) */
  sans: { argent: number; or: number; nacre: number };
  rng: number;
  /** la fin choisie change les trouvailles (Grand Scellement : plus de nacre ; Archives ouvertes : deux fois plus) */
  actes?: { fin?: string };
}

const rang = (r: Rarete) => RARETES.indexOf(r);

/** Tire une rareté, en appliquant les garanties */
export function tirerRarete(e: EtatCollection, strate: number, minimum: Rarete = 'fer'): Rarete {
  const t = tireur(e);
  const table = { ...tableRarete(strate) };
  if (e.actes?.fin === 'scellement') { table.or += table.nacre; table.nacre = 0; }
  if (e.actes?.fin === 'archives') { table.fer -= table.nacre; table.nacre *= 2; }
  let r: Rarete = 'fer';
  let v = t.nombre() * 100;
  for (const x of [...RARETES].reverse()) {
    if (table[x] > 0 && v < table[x]) { r = x; break; }
    v -= table[x];
  }
  const g = COLLECTION.garanties;
  if (strate >= 10 && e.sans.nacre + 1 >= g.nacre && e.actes?.fin !== 'scellement') r = 'nacre';
  else if (strate >= 5 && e.sans.or + 1 >= g.or && rang(r) < rang('or')) r = 'or';
  else if (e.sans.argent + 1 >= g.argent && rang(r) < rang('argent')) r = 'argent';
  if (rang(r) < rang(minimum)) r = minimum;
  e.sans.argent = rang(r) >= rang('argent') ? 0 : e.sans.argent + 1;
  e.sans.or = rang(r) >= rang('or') ? 0 : e.sans.or + 1;
  e.sans.nacre = r === 'nacre' ? 0 : e.sans.nacre + 1;
  return r;
}

/** Tire une carte : un métal, puis une carte parmi celles qui existent dans ce métal (les exclusives n'existent que dans le leur) */
export function tirerCarte(e: EtatCollection, strate: number, minimum: Rarete = 'fer', lignee?: Lignee): string {
  const r = tirerRarete(e, strate, minimum);
  const pool = tirablesEn(r).filter((m) => !lignee || m.lignee === lignee);
  return carteId(pool[tireur(e).entier(pool.length)]!.id, r);
}

/**
 * Une trouvaille d'expédition (combat, salle scellée, cache) : comme tirerCarte, mais une fois sur 2,5 (COLLECTION.affinite)
 * c'est un doublon d'une carte déjà possédée dans le métal tiré. Les choix (boss, objectif, Archive) restent tirerChoix.
 */
export function tirerTrouvaille(e: EtatCollection, strate: number, minimum: Rarete = 'fer', lignee?: Lignee): string {
  const r = tirerRarete(e, strate, minimum);
  const t = tireur(e);
  const possedees = Object.keys(e.collection).filter((id) => id.endsWith('@' + r) && !moduleDef(id).legs && (!lignee || moduleDef(id).lignee === lignee));
  if (possedees.length && t.nombre() < COLLECTION.affinite) return possedees[t.entier(possedees.length)]!;
  const pool = tirablesEn(r).filter((m) => !lignee || m.lignee === lignee);
  return carteId(pool[t.entier(pool.length)]!.id, r);
}

/** Trois cartes différentes au choix (boss, objectif du jour, Archive), toujours trois cartes de base différentes.
 *  `presents` (10 novembre 2026, audit) : les Porteurs déjà au district ; une carte de voie dont le Porteur n'est pas encore arrivé
 *  n'est proposée qu'en dernier recours (au premier gardien, les trois cartes proposées pouvaient être « à venir »). */
export function tirerChoix(e: EtatCollection, strate: number, minimum: Rarete = 'fer', lignee?: Lignee, presents?: string[], toutes = false): string[] {
  const absente = (id: string) => !!presents && VOIES.some((v) => !presents.includes(v.porteur) && v.cartes.includes(moduleDef(id).base ?? moduleDef(id).id));
  const choix: string[] = [];
  let garde = 0;
  while (choix.length < 3 && garde++ < 30) {
    // toutes (10 novembre 2026, quais gravés de la Flèche) : les trois cartes sont au moins du métal demandé
    const id = tirerCarte(e, strate, choix.length === 0 || toutes ? minimum : 'fer', lignee);
    if (absente(id) && garde < 24) continue;
    if (!choix.some((c) => moduleDef(c).base === moduleDef(id).base)) choix.push(id);
  }
  return choix;
}

/** Ajoute une carte : nouvelle carte, ou doublon si on l'a déjà. Renvoie true si c'est une découverte. */
export function ajouterCarte(e: EtatCollection, id: string): boolean {
  const c = e.collection[id];
  if (!c) {
    e.collection[id] = { niveau: COLLECTION.niveauDepart[moduleDef(id).rarete], doublons: 0 };
    return true;
  }
  c.doublons++;
  return false;
}

/** Doublons nécessaires pour le niveau suivant (null au niveau max) */
export function doublonsRequis(id: string, niveau: number): number | null {
  // une carte de l’Héritage est unique : elle ne monte pas avec des doublons, elle s'éveille avec son Porteur (eveillerLegs)
  // une carte d'origine aussi : elle grandit avec son Porteur (eveillerOrigines)
  if (moduleDef(id).legs || moduleDef(id).origine) return null;
  const r = moduleDef(id).rarete;
  if (niveau >= COLLECTION.niveauMax) return null;
  return COLLECTION.doublons[r][niveau - COLLECTION.niveauDepart[r]] ?? null;
}

/** Cristaux demandés pour monter au niveau suivant (le nom date d'avant le 9 novembre 2026) */
export const composantsNiveau = (niveau: number) => 20 * niveau;

/** Ce qu'un palier de force ajoute à une carte : un entier, au moins +1 */
export function gainNiveau(id: string): number {
  return Math.max(1, Math.round(moduleDef(id).v * COLLECTION.bonusNiveau));
}

const borneNiveau = (n: number) => Math.max(1, Math.min(COLLECTION.niveauMax, n));
/** Paliers de force gagnés à ce niveau (niveaux 2 et 4) */
export const paliersForce = (niveau: number) => (borneNiveau(niveau) >= 2 ? 1 : 0) + (borneNiveau(niveau) >= 4 ? 1 : 0);
/** Crans d'effet gagnés à ce niveau (niveaux 3 et 5) */
export const cransEffet = (niveau: number) => (borneNiveau(niveau) >= 3 ? 1 : 0) + (borneNiveau(niveau) >= 5 ? 1 : 0);
/** Le niveau renforce-t-il cet effet, ou la force à sa place ? (la Décharge se règle carte par carte, l'Accord n'a rien à renforcer) */
const effetMontant = (e: Effet | undefined): boolean => !!e && 'part' in e && e.type !== 'decharge';

/** L'effet d'une carte à son niveau : ses crans d'effet appliqués (avec les mêmes plafonds que le métal) */
export function effetNiveau(e: Effet | undefined, niveau: number): Effet | undefined {
  const k = cransEffet(niveau);
  return e && k && effetMontant(e) ? renforcer(e, 1 + COLLECTION.cranEffet * k) : e;
}

/** La carte telle qu'elle joue à son niveau : sa force et ses effets */
export function carteNiveau(m: ModuleDef, niveau: number): ModuleDef {
  return { ...m, v: forceNiveau(m.id, niveau), ...(m.effet ? { effet: effetNiveau(m.effet, niveau) } : {}), ...(m.effet2 ? { effet2: effetNiveau(m.effet2, niveau) } : {}) };
}

/** La force d'une carte à son niveau : sa force de départ, plus ses paliers de force (et ses crans, sans effet à renforcer) */
export function forceNiveau(id: string, niveau: number): number {
  const m = moduleDef(id);
  const crans = effetMontant(m.effet) ? 0 : cransEffet(niveau) * Math.max(1, Math.round(m.v * COLLECTION.cranForce));
  return m.v + gainNiveau(id) * paliersForce(niveau) + crans;
}

/** Multiplicateur de force d'une carte selon son niveau (tombe pile sur `forceNiveau` une fois arrondi) */
export function multNiveau(id: string, niveau: number): number {
  const v = moduleDef(id).v;
  return v > 0 ? forceNiveau(id, niveau) / v : 1;
}

/**
 * La Charge (26 octobre 2026, Bryan : « une carte qui fait 30 face à une qui fait 8 ») : chaque carte pèse selon sa puissance
 * (celle du tri « Puissance », dans son métal, à son niveau de départ : monter une carte ne l'alourdit pas), et chaque Porteur
 * porte une Charge qui grandit avec son niveau. Le robot a montré qu'un poids qui suit la puissance laisse « une grosse carte
 * et des petites » et « six cartes moyennes » à égalité ; un poids qui grimpe plus vite écrase les grosses cartes.
 */
export const CHARGE = {
  /** une carte pèse sa puissance divisée par ce nombre (1 au moins) */
  diviseur: 4,
  /** Charge d'un Porteur au niveau 1, et ce qu'il gagne par niveau */
  base: 16,
  parNiveau: 1,
};
export const poidsCarte = (cle: string): number =>
  Math.max(1, Math.round(puissanceCarte(cle, COLLECTION.niveauDepart[moduleDef(cle).rarete]) / CHARGE.diviseur));
export const chargeNiveau = (niveau: number): number => CHARGE.base + CHARGE.parNiveau * (niveau - 1);

/**
 * Le niveau de Porteur qu'un métal demande (27 octobre 2026, Bryan : « un niveau 1 ne devrait pas pouvoir porter d'or »).
 * Une carte trouvée trop tôt entre quand même dans la collection et y monte avec ses doublons : on sait quel Porteur faire monter.
 */
export const NIVEAU_METAL: Record<Rarete, number> = { fer: 1, cuivre: 1, argent: 4, or: 7, nacre: 10 };
/** une carte d'origine se porte dès le niveau 1 : elle est là pour aider au début (11 novembre 2026) */
export const niveauRequis = (cle: string): number => (moduleDef(cle).origine ? 1 : NIVEAU_METAL[moduleDef(cle).rarete]);

/** Les cartes qu'un Porteur apporte au deck de combat : celles qu'on lui a confiées, à leur niveau */
export function cartesEnJeu(porteurId: string, cartes: { id: string; niveau: number }[]): GesteDef[] {
  return cartes.map(({ id, niveau }) => gesteDeCarte(id, porteurId, multNiveau(id, niveau), cransEffet(niveau)));
}

/** Face à un autre joueur, une carte d'origine (payante) perd l'effet qu'elle a en plus : elle y vaut une carte d'argent ordinaire.
 *  Le pay-to-win ne compte qu'entre joueurs (Bryan, 11 novembre 2026) : l'avantage vendu reste dans les Strates. */
export function sansBonusOrigine(g: GesteDef): GesteDef {
  const bonus = g.carte && estCarteConnue(g.carte) ? moduleDef(g.carte).origine : undefined;
  if (!bonus) return g;
  const { effet2, ...reste } = g;
  if (effet2?.type === bonus) return reste;
  return g.effet?.type === bonus ? (effet2 ? { ...reste, effet: effet2 } : (({ effet: _e, ...r }) => r)(reste)) : g;
}

/**
 * Un Porteur combat toujours avec ses 6 places (26 octobre 2026) : chaque place qu'on ne remplit pas entre dans le deck
 * comme une place vide, qui prend une place dans la main sans se jouer. Sans elles, trois grosses cartes par Porteur
 * revenaient en main à chaque tour et battaient six cartes bien choisies, à Charge égale.
 */
export const PLACES_PORTEUR = 6;
export function placesVides(porteurId: string, nb: number): GesteDef[] {
  return Array.from({ length: Math.max(0, PLACES_PORTEUR - nb) }, () => ({ id: 'vide', porteur: porteurId, nom: tr('Place vide'), f: 0, type: 'atk', v: 0, vide: true }));
}

// ---------- Trier la collection (24 octobre 2026) ----------

/**
 * La puissance d'une carte pour le deck, à son niveau : sa force, ajustée de ce qu'elle apporte en plus.
 * C'est la même estimation que le parcours simulé de l'équilibrage (parcours.ts) : une carte lourde compte pour 60 %
 * (elle prend deux places), un effet +25 %, une défense ou un soin +10 %, et +15 % par Fréquence en plus.
 */
export function puissanceCarte(cle: string, niveau: number): number {
  const m = moduleDef(cle);
  let v = m.v * multNiveau(cle, niveau);
  if (m.lourd) v *= 0.6;
  if (m.effet) v *= 1.25;
  // lot 3 (9 novembre 2026) : les cartes « à prix » (Cadence folle, Nuée chorale, Plume de givre, Hallali, Grand unisson,
  // Coquille de marée) ne donnent toute leur force que dans le bon deck : hors de lui, elles valent moins que leur force affichée
  const e = m.effet;
  if (e && (('total' in e && e.total) || ('cadence' in e && e.cadence) || ('exige' in e && e.exige) || ('deux' in e && e.deux) || ('toute' in e && e.toute) || ('vide' in e && e.vide))) v *= 0.7;
  if (m.type !== 'atk') v *= 1.1;
  return v * (1 + 0.15 * (m.f.length - 1));
}

export type TriCartes = 'puissance' | 'metal' | 'niveau' | 'nouvelles';
export const TRIS: { id: TriCartes; nom: string; texte: string }[] = [
  { id: 'puissance', nom: tr('Puissance'), texte: tr('La force de la carte à son niveau, ajustée de ses effets, de ses Fréquences et des places qu’elle prend') },
  { id: 'metal', nom: tr('Métal'), texte: tr('De la nacre au fer') },
  { id: 'niveau', nom: tr('Niveau'), texte: tr('Du plus haut au plus bas') },
  { id: 'nouvelles', nom: tr('Nouvelles'), texte: tr('Les cartes pas encore vues d’abord, puis par puissance') },
];
export const estTri = (t: unknown): t is TriCartes => TRIS.some((x) => x.id === t);

/** Trie des exemplaires (clés carte@métal) : le critère choisi d'abord, puis la puissance, le métal, le nom ; « nouvelles » met en tête celles qui ne sont pas dans `vues` */
export function trierCartes(cles: string[], collection: Record<string, { niveau: number }>, tri: TriCartes, vues: readonly string[] = []): string[] {
  const p = (k: string) => puissanceCarte(k, collection[k]?.niveau ?? 1);
  const r = (k: string) => RARETES.indexOf(moduleDef(k).rarete);
  const n = (k: string) => collection[k]?.niveau ?? 1;
  const vu = new Set(vues);
  const cle = (k: string): number[] => tri === 'metal' ? [r(k), p(k)] : tri === 'niveau' ? [n(k), p(k), r(k)]
    : tri === 'nouvelles' ? [Number(!vu.has(k)), p(k), r(k), n(k)] : [p(k), r(k), n(k)];
  return [...cles].sort((a, b) => {
    const x = cle(a), y = cle(b);
    for (let i = 0; i < x.length; i++) if (x[i] !== y[i]) return y[i]! - x[i]!;
    return moduleDef(a).nom.localeCompare(moduleDef(b).nom, 'fr');
  });
}
