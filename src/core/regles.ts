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

type Maillon = Pick<Geste, 'f'> & { effet?: Geste['effet'] };

/**
 * Fréquences réellement jouées : un Geste à Accord prend toujours la Fréquence
 * qui prolonge la suite (celle d'avant + 1, ou celle d'après − 1 s'il ouvre la chaîne).
 */
export function frequencesEffectives(chaine: Maillon[]): number[] {
  const r: number[] = [];
  chaine.forEach((g, i) => {
    if (g.effet?.type !== 'accord') r.push(g.f);
    else if (i > 0) r.push(r[i - 1]! + 1);
    else {
      const suivant = chaine[1];
      r.push(suivant && suivant.effet?.type !== 'accord' ? suivant.f - 1 : g.f);
    }
  });
  return r;
}

/** Résonance (suite 3-4-5…) et Écho (trois Fréquences identiques) */
export function analyserChaine(chaine: Maillon[]): Analyse {
  const fs = frequencesEffectives(chaine);
  let meilleur = fs.length ? 1 : 0;
  let serie = 1;
  for (let i = 1; i < fs.length; i++) {
    if (fs[i] === fs[i - 1]! + 1) {
      serie++;
      meilleur = Math.max(meilleur, serie);
    } else serie = 1;
  }
  const compte = new Map<number, number>();
  for (const f of fs) compte.set(f, (compte.get(f) ?? 0) + 1);
  const echo = [...compte.values()].some((n) => n >= 3);
  const mult = REGLES.multSuite[Math.min(meilleur, 5)] ?? 1;
  return { suite: meilleur, mult, echo };
}

/** Longueur de la suite qui se termine sur le dernier Geste posé */
export function serieFinale(chaine: Maillon[]): number {
  const fs = frequencesEffectives(chaine);
  let s = fs.length ? 1 : 0;
  for (let i = fs.length - 1; i > 0; i--) {
    if (fs[i] === fs[i - 1]! + 1) s++;
    else break;
  }
  return s;
}

export const places = (g: Pick<Geste, 'lourd'>) => (g.lourd ? 2 : 1);

/**
 * La Fréquence que prend une carte à plusieurs Fréquences quand on la pose (décision du 22 octobre 2026, sans tirage) :
 * celle qui prolonge la suite, sinon celle qui complète un Écho, sinon sa Fréquence principale.
 */
export function meilleureFrequence(chaine: Maillon[], fs: number[]): number {
  if (fs.length < 2) return fs[0]!;
  const eff = frequencesEffectives(chaine);
  const der = eff[eff.length - 1];
  if (der !== undefined && fs.includes(der + 1)) return der + 1;
  for (const f of fs) if (eff.filter((x) => x === f).length >= 2) return f;
  return fs[0]!;
}

/** La carte peut-elle prolonger la suite qui se termine sur `der` ? */
export const prolonge = (g: Pick<Geste, 'f' | 'fs' | 'effet'>, der: number | undefined) =>
  der !== undefined && (g.effet?.type === 'accord' || (g.fs ?? [g.f]).includes(der + 1));
