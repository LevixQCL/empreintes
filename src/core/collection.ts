// La collection : les cartes qui tombent dans les Strates, leurs raretés, les doublons et les niveaux.
// Tout le hasard passe par un état `rng` sauvegardé : aucun hasard n'est jamais payé.

import { MODULES, carteId, gesteDeCarte, moduleDef } from './donnees';
import { tireur } from './rng';
import type { GesteDef, Rarete } from './types';

export const RARETES: Rarete[] = ['fer', 'cuivre', 'argent', 'or', 'nacre'];
export const NOMS_RARETE: Record<Rarete, string> = { fer: 'Fer', cuivre: 'Cuivre', argent: 'Argent', or: 'Or', nacre: 'Nacre' };

export const COLLECTION = {
  /** chance qu'un combat normal fasse tomber une carte */
  chanceCombat: 0.15,
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
  /** refabriquer un exemplaire : environ 5 fois le recyclage, plus des Éclats, plus du temps de Forge */
  refabrication: {
    fer: { composants: 25, eclats: 0, minutes: 5 },
    cuivre: { composants: 75, eclats: 0, minutes: 20 },
    argent: { composants: 200, eclats: 2, minutes: 60 },
    or: { composants: 500, eclats: 5, minutes: 180 },
    nacre: { composants: 1250, eclats: 12, minutes: 480 },
  } as Record<Rarete, { composants: number; eclats: number; minutes: number }>,
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
export function tirerCarte(e: EtatCollection, strate: number, minimum: Rarete = 'fer'): string {
  const r = tirerRarete(e, strate, minimum);
  return carteId(MODULES[tireur(e).entier(MODULES.length)]!.id, r);
}

/** Trois cartes différentes au choix (boss, objectif du jour, Archive), toujours trois cartes de base différentes */
export function tirerChoix(e: EtatCollection, strate: number, minimum: Rarete = 'fer'): string[] {
  const choix: string[] = [];
  let garde = 0;
  while (choix.length < 3 && garde++ < 30) {
    const id = tirerCarte(e, strate, choix.length === 0 ? minimum : 'fer');
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

/** Les cartes qu'un Porteur apporte au deck de combat : celles qu'on lui a confiées, à leur niveau */
export function cartesEnJeu(porteurId: string, cartes: { id: string; niveau: number }[]): GesteDef[] {
  return cartes.map(({ id, niveau }) => gesteDeCarte(id, porteurId, multNiveau(id, niveau)));
}
