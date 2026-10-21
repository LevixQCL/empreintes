import type { Geste, Lignee, LigneeGeste } from './types';

/** Les réglages chiffrés du combat, au même endroit pour l'équilibrage */
export const REGLES = {
  tailleMain: 5,
  capaciteBase: 3,
  capaciteMax: 5,
  fluxMax: 3,
  bonusLignee: 1.15,
  bouclierEcho: 8,
  /** multiplicateur selon la longueur de la meilleure suite */
  multSuite: { 3: 1.3, 4: 1.6, 5: 2 } as Record<number, number>,
  soinEntreCombats: 0.5,
} as const;

// Tech bat Résonant, Résonant bat Géné, Géné bat Tech
const BAT: Record<Lignee, Lignee> = { tech: 'reso', reso: 'bio', bio: 'tech' };
export const BATTU_PAR: Record<Lignee, Lignee> = { reso: 'tech', bio: 'reso', tech: 'bio' };

export function avantage(att: LigneeGeste, def: Lignee): number {
  return att !== 'neutre' && BAT[att] === def ? REGLES.bonusLignee : 1;
}

export interface Analyse {
  /** longueur de la meilleure suite croissante consécutive (1, 2, 3…) */
  suite: number;
  mult: number;
  echo: boolean;
}

/** Résonance (suite 3-4-5…) et Écho (trois Fréquences identiques) */
export function analyserChaine(chaine: Pick<Geste, 'f'>[]): Analyse {
  let meilleur = chaine.length ? 1 : 0;
  let serie = 1;
  for (let i = 1; i < chaine.length; i++) {
    if ((chaine[i] as Geste).f === (chaine[i - 1] as Geste).f + 1) {
      serie++;
      meilleur = Math.max(meilleur, serie);
    } else serie = 1;
  }
  const compte = new Map<number, number>();
  for (const g of chaine) compte.set(g.f, (compte.get(g.f) ?? 0) + 1);
  const echo = [...compte.values()].some((n) => n >= 3);
  const mult = REGLES.multSuite[Math.min(meilleur, 5)] ?? 1;
  return { suite: meilleur, mult, echo };
}

/** Longueur de la suite qui se termine sur le dernier Geste posé */
export function serieFinale(chaine: Pick<Geste, 'f'>[]): number {
  let s = chaine.length ? 1 : 0;
  for (let i = chaine.length - 1; i > 0; i--) {
    if ((chaine[i] as Geste).f === (chaine[i - 1] as Geste).f + 1) s++;
    else break;
  }
  return s;
}

export const places = (g: Pick<Geste, 'lourd'>) => (g.lourd ? 2 : 1);
