// La Fusion : deux cartes du même métal et de la même lignée, plus des Éclats, tentent de donner une carte
// d'un métal au-dessus. C'est le seul chemin choisi vers les métaux rares, et il est risqué :
// - la carte d'un autre Module de la lignée sort au hasard (pas de montée de métal d'une carte précise) ;
// - en cas d'échec, la carte risquée est perdue, la carte de base est gardée et la moitié des Éclats est rendue ;
// - chaque échec rend la tentative suivante plus sûre (+5 %), pour cette lignée et ce métal visé.
// Le hasard ne touche que des ressources gagnées en jouant : rien de tout cela ne s'achète.

import { MODULES, carteId, moduleDef } from './donnees';
import { NOMS_RARETE, RARETES, ajouterCarte } from './collection';
import { tireur } from './rng';
import { greffesDe, log, type Jeu } from './jeu';
import type { Lignee, Rarete } from './types';

export const FUSION = {
  /** chance de réussite selon le métal visé */
  chance: { cuivre: 0.7, argent: 0.5, or: 0.35, nacre: 0.2 } as Record<Exclude<Rarete, 'fer'>, number>,
  /** bonus par échec d'affilée (même lignée, même métal visé), remis à zéro par une réussite */
  bonusEchec: 0.05,
  /** Éclats demandés selon le métal visé ; la moitié (arrondie au-dessus) est rendue en cas d'échec */
  eclats: { cuivre: 2, argent: 4, or: 8, nacre: 15 } as Record<Exclude<Rarete, 'fer'>, number>,
  /** niveau de Forge nécessaire selon le métal visé */
  forge: { cuivre: 2, argent: 3, or: 4, nacre: 5 } as Record<Exclude<Rarete, 'fer'>, number>,
} as const;

export type MetalVise = Exclude<Rarete, 'fer'>;

/** Le métal juste au-dessus (null pour la nacre) */
export function metalSuivant(r: Rarete): MetalVise | null {
  return (RARETES[RARETES.indexOf(r) + 1] as MetalVise | undefined) ?? null;
}

const cleEchecs = (lignee: Lignee, cible: MetalVise) => `${lignee}@${cible}`;

/** Échecs d'affilée pour cette lignée et ce métal visé */
export const echecsFusion = (j: Jeu, lignee: Lignee, cible: MetalVise) => j.fusions[cleEchecs(lignee, cible)] ?? 0;

/** Chance de réussite actuelle (de 0 à 1) */
export function chanceFusion(j: Jeu, lignee: Lignee, cible: MetalVise): number {
  return Math.min(1, FUSION.chance[cible] + FUSION.bonusEchec * echecsFusion(j, lignee, cible));
}

/** Exemplaires d'une carte qu'on peut engager : les doublons, plus la carte elle-même si elle n'est greffée sur personne */
export function exemplairesLibres(j: Jeu, id: string): number {
  const c = j.collection[id];
  if (!c) return 0;
  return c.doublons + (greffesDe(j, id).length ? 0 : 1);
}

export interface Apercu {
  ok: boolean;
  message?: string;
  cible?: MetalVise;
  lignee?: Lignee;
  chance?: number;
  eclats?: number;
  /** les Modules qui peuvent sortir (ids de base), tous de la même lignée */
  possibles?: string[];
}

/**
 * Ce que donnerait la Fusion de `base` (gardée en cas d'échec) et `risquee` (perdue en cas d'échec).
 * Les deux peuvent être la même carte si on en a un doublon.
 */
export function apercuFusion(j: Jeu, base: string, risquee: string): Apercu {
  const non = (message: string): Apercu => ({ ok: false, message });
  if (!j.collection[base] || !j.collection[risquee]) return non('Carte inconnue.');
  const a = moduleDef(base);
  const b = moduleDef(risquee);
  if (a.rarete !== b.rarete) return non('Les deux cartes doivent être du même métal.');
  if (a.lignee !== b.lignee) return non('Les deux cartes doivent être de la même lignée.');
  const cible = metalSuivant(a.rarete);
  if (!cible) return non('La nacre ne se fusionne plus : c’est déjà le sommet.');
  const besoin = base === risquee ? 2 : 1;
  if (exemplairesLibres(j, base) < besoin || exemplairesLibres(j, risquee) < 1) {
    return non(base === risquee
      ? 'Il faut deux exemplaires libres de cette carte (un doublon, ou la retirer de son Porteur).'
      : 'Une carte greffée sans doublon ne peut pas entrer dans la Fusion : retire-la d’abord de son Porteur.');
  }
  if (j.batiments.forge < FUSION.forge[cible]) return non(`Fusion vers le ${NOMS_RARETE[cible].toLowerCase()} : Forge niveau ${FUSION.forge[cible]} nécessaire.`);
  const eclats = FUSION.eclats[cible];
  const possibles = MODULES.filter((m) => m.lignee === a.lignee).map((m) => m.id);
  const apercu: Apercu = { ok: true, cible, lignee: a.lignee, chance: chanceFusion(j, a.lignee, cible), eclats, possibles };
  if (j.eclats < eclats) return { ...apercu, ok: false, message: `Il faut ${eclats} Éclats.` };
  return apercu;
}

/** Retire un exemplaire : un doublon s'il y en a, sinon la carte quitte la collection */
function retirer(j: Jeu, id: string) {
  const c = j.collection[id]!;
  if (c.doublons > 0) c.doublons--;
  else delete j.collection[id];
}

export interface ResultatFusion {
  ok: boolean;
  message?: string;
  reussite?: boolean;
  /** la carte obtenue (en cas de réussite) */
  carte?: string;
  /** true si la carte obtenue est une découverte, false si c'est un doublon */
  neuve?: boolean;
  /** la chance qu'avait la tentative */
  chance?: number;
  /** Éclats rendus (en cas d'échec) */
  rendus?: number;
}

/** Tente la Fusion. Le hasard passe par l'état `rng` de la partie, comme toutes les trouvailles. */
export function fusionner(j: Jeu, base: string, risquee: string): ResultatFusion {
  const ap = apercuFusion(j, base, risquee);
  if (!ap.ok) return { ok: false, message: ap.message };
  const { cible, lignee, chance, eclats, possibles } = ap as Required<Apercu>;
  const t = tireur(j);
  j.eclats -= eclats;
  const cle = cleEchecs(lignee, cible);
  if (t.nombre() < chance) {
    retirer(j, risquee);
    retirer(j, base);
    const carte = carteId(possibles[t.entier(possibles.length)]!, cible);
    const neuve = ajouterCarte(j, carte);
    delete j.fusions[cle];
    log(j, `Fusion réussie : ${moduleDef(carte).nom} en ${NOMS_RARETE[cible].toLowerCase()}${neuve ? ', une nouvelle carte !' : ' (doublon).'}`);
    return { ok: true, reussite: true, carte, neuve, chance };
  }
  retirer(j, risquee);
  const rendus = Math.ceil(eclats / 2);
  j.eclats += rendus;
  j.fusions[cle] = (j.fusions[cle] ?? 0) + 1;
  log(j, `Fusion ratée : ${moduleDef(risquee).nom} est perdu. ${rendus} Éclats rendus, la prochaine tentative sera plus sûre.`);
  return { ok: true, reussite: false, chance, rendus };
}

/** Toutes les paires possibles avec cette carte comme base (pour proposer des partenaires à l'écran) */
export function partenairesFusion(j: Jeu, base: string): string[] {
  if (!j.collection[base]) return [];
  const a = moduleDef(base);
  return Object.keys(j.collection).filter((id) => {
    const b = moduleDef(id);
    return b.rarete === a.rarete && b.lignee === a.lignee && (id !== base || exemplairesLibres(j, base) >= 2) && exemplairesLibres(j, id) >= 1;
  });
}
