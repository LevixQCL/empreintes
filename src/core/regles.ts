import { porteurDef } from './donnees';
import type { Geste, Lignee, LigneeGeste } from './types';

/** Les réglages chiffrés du combat, au même endroit pour l'équilibrage */
export const REGLES = {
  /** À quelle Strate chaque mécanique de combat apparaît (28 octobre 2026) : une nouveauté à la fois, rien n'est retiré.
   *  −1 : chaîne, Résonance, Flux ; −2 : Fêlure ; −3 : groupes ; −4 : traits d'ennemis ; −5 : conditions de salle.
   *  Les phases des gardiens restent dès la −2. */
  apparition: { felure: 2, groupes: 3, traits: 4, conditions: 5, assimilation: 6, troisiemePhase: 7 },
  /** 3ᵉ phase des gardiens (28 octobre 2026) : sous ce seuil de PV, une variante tirée au début du combat ; Déferlement : +X par tour, plafond */
  troisiemePhase: { seuil: 0.2, deferlement: 0.25, deferlementMax: 2, renfort: 0.2, renfortForce: 0.28 },
  tailleMain: 5,
  /** force d'une carte « éteinte » (son Porteur est à terre) : elle reste dans le deck, sans effet, et sa Fréquence compte (27 octobre 2026).
   *  Mesuré au pillage miroir (joueur moyen) : avant 44 % de victoires en 18 tours ; ×0,5 → 23 % ; ×0,85 → 39 % en 13 tours ; ×1 → 47 % */
  eteinte: 0.85,
  capaciteBase: 3,
  capaciteMax: 5,
  fluxMax: 3,
  bonusLignee: 1.15,
  /** Empreinte (carte exclusive, 28 octobre 2026) : sans effet à copier, la carte gagne cette force en plus.
   *  Mesuré au robot : sans elle, une Empreinte dans un deck encore en fer (aucun effet) ne valait rien. */
  empreinteSeule: 1.4,
  /** Écho (trois Fréquences identiques dans la chaîne) : les cartes qui résonnent ensemble frappent, protègent et soignent
   *  plus fort (27 octobre 2026). Avant : bouclier d'escouade +8, quelle que soit la chaîne — trop peu pour un tirage
   *  environ 10 fois plus rare qu'une suite de 3 dans un deck normal (3 à 7 % des mains contre ~40 %), et toujours du bouclier.
   *  Le bonus suit maintenant l'action des cartes ; +50 % se place entre la suite de 3 (+30 %) et celle de 4 (+60 %) : plus rare
   *  que la première, mais un deck qui empile une Fréquence peut le rendre fréquent (23 % des mains). Mesuré au robot
   *  (archétypes, 80 descentes) : de ×1,25 à ×1,6, le deck « tout en échos » ne bat jamais le deck normal chez le joueur moyen
   *  (−4 à −7 points) et reste loin derrière le deck « tout en suites » (voir docs/robot-archetypes.md). */
  echo: 1.5,
  /** multiplicateur selon la longueur de la meilleure suite */
  multSuite: { 3: 1.3, 4: 1.6, 5: 2 } as Record<number, number>,
  /** part du bonus de suite gardée quand toute la suite vient d'une seule lignée (1 = bonus entier) */
  suiteMono: 1,
  soinEntreCombats: 0.5,
  /** Fêlure (25 octobre 2026) : une carte de la Fréquence fêlée brise l'intention de l'ennemi visé */
  felure: {
    /** chance que la Fréquence fêlée soit tirée parmi celles de la main (sinon de 1 à 9) */
    chanceMain: 2 / 3,
    /** part retirée à l'attaque, au bouclier ou au soin annoncé ; les gardiens résistent mieux */
    part: 0.5,
    partGardien: 0.25,
    /** Flux gagné par Fêlure brisée, seulement si la chaîne fait aussi une Résonance (26 octobre 2026 : Bryan trouvait
     *  le Flux trop facile, une carte isolée suffisait ; le Flux redevient la récompense des suites) */
    flux: 1,
  },
  /** Coups d'éclat (25 octobre 2026) : Flux plein, un seul par combat */
  eclat: {
    /** Usure en plus pour le Porteur qui le déclenche (« deux jours de sommeil ») */
    usure: 3,
    /** Débridage : multiplicateur des dégâts de la chaîne (26 octobre 2026 : 2 → 1,5, Bryan trouvait qu'il finissait le combat
     *  à lui seul, quand Sursaut et Ombre agissante ne font que sauver l'escouade) */
    debride: 1.5,
    /** Sursaut : part des PV max rendue à chacun, et à celui qui se relève */
    sursaut: 0.4,
  },
} as const;

// Tech bat Résonant, Résonant bat Géné, Géné bat Tech
const BAT: Record<Lignee, Lignee> = { tech: 'reso', reso: 'bio', bio: 'tech' };
export const BATTU_PAR: Record<Lignee, Lignee> = { reso: 'tech', bio: 'reso', tech: 'bio' };

export function avantage(att: LigneeGeste, def: Lignee): number {
  return att !== 'neutre' && BAT[att] === def ? REGLES.bonusLignee : 1;
}

interface Analyse {
  /** longueur de la meilleure suite croissante consécutive (1, 2, 3…) */
  suite: number;
  mult: number;
  echo: boolean;
  /** la Fréquence qui fait l'Écho (celle des cartes renforcées), s'il y en a un */
  echoF?: number;
}

type Maillon = Pick<Geste, 'f'> & { effet?: Geste['effet']; porteur?: Geste['porteur'] };

/** Une carte à Fréquence libre : l'Accord (prolonge la suite) et le Diapason (répète la Fréquence d'avant) */
export const frequenceLibre = (e?: { type: string }) => e?.type === 'accord' || e?.type === 'diapason';
/** Le signe d'une Fréquence libre sur la carte : ∗ pour l'Accord, = pour le Diapason */
export const signeLibre = (e?: { type: string }) => (e?.type === 'diapason' ? '=' : '∗');

/**
 * Fréquences réellement jouées : un Geste à Accord prend toujours la Fréquence
 * qui prolonge la suite (celle d'avant + 1, ou celle d'après − 1 s'il ouvre la chaîne) ;
 * un Geste à Diapason reprend celle d'avant (ou celle d'après s'il ouvre la chaîne).
 */
export function frequencesEffectives(chaine: Maillon[]): number[] {
  const r: number[] = [];
  chaine.forEach((g, i) => {
    if (!frequenceLibre(g.effet)) { r.push(g.f); return; }
    const pas = g.effet?.type === 'accord' ? 1 : 0;
    if (i > 0) { r.push(r[i - 1]! + pas); return; }
    const suivant = chaine[1];
    r.push(suivant && !frequenceLibre(suivant.effet) ? suivant.f - pas : g.f);
  });
  return r;
}

/** Résonance (suite 3-4-5…) et Écho (trois Fréquences identiques) */
export function analyserChaine(chaine: Maillon[]): Analyse {
  const fs = frequencesEffectives(chaine);
  let meilleur = fs.length ? 1 : 0;
  let serie = 1;
  let fin = 0;
  for (let i = 1; i < fs.length; i++) {
    if (fs[i] === fs[i - 1]! + 1) {
      serie++;
      if (serie > meilleur) { meilleur = serie; fin = i; }
    } else serie = 1;
  }
  const compte = new Map<number, number>();
  for (const f of fs) compte.set(f, (compte.get(f) ?? 0) + 1);
  const echoF = [...compte.entries()].find(([, n]) => n >= 3)?.[0];
  let mult = REGLES.multSuite[Math.min(meilleur, 5)] ?? 1;
  // suite d'une seule lignée : bonus réduit (les lignées se complètent sur l'échelle 1 à 9)
  if (meilleur >= 3 && REGLES.suiteMono < 1) {
    const ls = new Set(chaine.slice(fin - meilleur + 1, fin + 1).map((m) => (m.porteur ? porteurDef(m.porteur).lignee : null)).filter(Boolean));
    if (ls.size === 1) mult = 1 + (mult - 1) * REGLES.suiteMono;
  }
  return { suite: meilleur, mult, echo: echoF !== undefined, ...(echoF !== undefined ? { echoF } : {}) };
}

/** Multiplicateur d'Écho de la carte au rang donné : seules les cartes de la Fréquence répétée sont renforcées */
export function multEcho(chaine: Maillon[], rang: number): number {
  const a = analyserChaine(chaine);
  return a.echoF !== undefined && frequencesEffectives(chaine)[rang] === a.echoF ? REGLES.echo : 1;
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
