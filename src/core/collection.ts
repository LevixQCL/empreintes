// La collection : les cartes qui tombent dans les Strates, leurs raretés, les doublons et les niveaux.
// Tout le hasard passe par un état `rng` sauvegardé : aucun hasard n'est jamais payé.

import { MODULES_TIRABLES, carteId, gesteDeCarte, moduleDef } from './donnees';
import { tireur } from './rng';
import type { GesteDef, Lignee, Rarete } from './types';

export const RARETES: Rarete[] = ['fer', 'cuivre', 'argent', 'or', 'nacre'];
export const NOMS_RARETE: Record<Rarete, string> = { fer: 'Fer', cuivre: 'Cuivre', argent: 'Argent', or: 'Or', nacre: 'Nacre' };

export const COLLECTION = {
  /** chance qu'un combat normal fasse tomber une carte */
  chanceCombat: 0.2,
  /** une trouvaille d'expédition est, à cette fréquence, un doublon d'une carte qu'on possède déjà dans ce métal :
   *  plus on joue, plus les cartes montent (étude du 22/10/2026 : les doublons se diluaient sur 225 exemplaires) */
  affinite: 0.4,
  /** +5 % de force par niveau */
  bonusNiveau: 0.05,
  niveauMax: 10,
  /** niveau de départ selon la rareté */
  niveauDepart: { fer: 1, cuivre: 3, argent: 5, or: 7, nacre: 8 } as Record<Rarete, number>,
  /** doublons pour passer au niveau suivant, depuis le niveau de départ */
  doublons: {
    fer: [1, 2, 3, 4, 6, 8, 10, 13, 16],
    cuivre: [1, 2, 3, 4, 5, 7, 9],
    argent: [1, 2, 3, 4, 5],
    or: [1, 2, 3],
    nacre: [1, 1],
  } as Record<Rarete, number[]>,
  /** composants rendus par le recyclage d'un doublon */
  recyclage: { fer: 5, cuivre: 15, argent: 40, or: 100, nacre: 250 } as Record<Rarete, number>,
  /** refabriquer un exemplaire : environ 5 fois le recyclage, plus des Éclats, plus du temps de Forge.
   *  La Forge tourne à l'énergie (23 octobre 2026) : l'énergie devient une ressource à part entière, pas seulement des chantiers. */
  refabrication: {
    fer: { composants: 25, eclats: 0, minutes: 5, energie: 40 },
    cuivre: { composants: 75, eclats: 0, minutes: 20, energie: 120 },
    argent: { composants: 200, eclats: 2, minutes: 60, energie: 300 },
    or: { composants: 500, eclats: 5, minutes: 180, energie: 700 },
    nacre: { composants: 1250, eclats: 12, minutes: 480, energie: 1600 },
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

/** Tire une carte : un métal, puis une carte parmi toutes (chaque carte existe dans les cinq métaux) */
export function tirerCarte(e: EtatCollection, strate: number, minimum: Rarete = 'fer', lignee?: Lignee): string {
  const r = tirerRarete(e, strate, minimum);
  const pool = lignee ? MODULES_TIRABLES.filter((m) => m.lignee === lignee) : MODULES_TIRABLES;
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
  const pool = lignee ? MODULES_TIRABLES.filter((m) => m.lignee === lignee) : MODULES_TIRABLES;
  return carteId(pool[t.entier(pool.length)]!.id, r);
}

/** Trois cartes différentes au choix (boss, objectif du jour, Archive), toujours trois cartes de base différentes */
export function tirerChoix(e: EtatCollection, strate: number, minimum: Rarete = 'fer', lignee?: Lignee): string[] {
  const choix: string[] = [];
  let garde = 0;
  while (choix.length < 3 && garde++ < 30) {
    const id = tirerCarte(e, strate, choix.length === 0 ? minimum : 'fer', lignee);
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
  if (moduleDef(id).legs) return null;
  const r = moduleDef(id).rarete;
  if (niveau >= COLLECTION.niveauMax) return null;
  return COLLECTION.doublons[r][niveau - COLLECTION.niveauDepart[r]] ?? null;
}

/** Composants demandés pour monter au niveau suivant */
export const composantsNiveau = (niveau: number) => 8 * niveau;

/** Multiplicateur de force d'une carte selon son niveau */
export function multNiveau(id: string, niveau: number): number {
  const depart = COLLECTION.niveauDepart[moduleDef(id).rarete];
  return 1 + COLLECTION.bonusNiveau * (niveau - depart);
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
export const niveauRequis = (cle: string): number => NIVEAU_METAL[moduleDef(cle).rarete];

/** Les cartes qu'un Porteur apporte au deck de combat : celles qu'on lui a confiées, à leur niveau */
export function cartesEnJeu(porteurId: string, cartes: { id: string; niveau: number }[]): GesteDef[] {
  return cartes.map(({ id, niveau }) => gesteDeCarte(id, porteurId, multNiveau(id, niveau)));
}

/**
 * Un Porteur combat toujours avec ses 6 places (26 octobre 2026) : chaque place qu'on ne remplit pas entre dans le deck
 * comme une place vide, qui prend une place dans la main sans se jouer. Sans elles, trois grosses cartes par Porteur
 * revenaient en main à chaque tour et battaient six cartes bien choisies, à Charge égale.
 */
export const PLACES_PORTEUR = 6;
export function placesVides(porteurId: string, nb: number): GesteDef[] {
  return Array.from({ length: Math.max(0, PLACES_PORTEUR - nb) }, () => ({ id: 'vide', porteur: porteurId, nom: 'Place vide', f: 0, type: 'atk', v: 0, vide: true }));
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
  if (m.type !== 'atk') v *= 1.1;
  return v * (1 + 0.15 * (m.f.length - 1));
}

export type TriCartes = 'puissance' | 'metal' | 'niveau' | 'nouvelles';
export const TRIS: { id: TriCartes; nom: string; texte: string }[] = [
  { id: 'puissance', nom: 'Puissance', texte: 'La force de la carte à son niveau, ajustée de ses effets, de ses Fréquences et des places qu’elle prend' },
  { id: 'metal', nom: 'Métal', texte: 'De la nacre au fer' },
  { id: 'niveau', nom: 'Niveau', texte: 'Du plus haut au plus bas' },
  { id: 'nouvelles', nom: 'Nouvelles', texte: 'Les cartes pas encore vues d’abord, puis par puissance' },
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
