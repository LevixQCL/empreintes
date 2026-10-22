// Illustrations Midjourney (public/art/). Chaque fonction renvoie null quand l'image n'existe pas encore :
// l'affichage garde alors son visuel dessiné en SVG ou sa couleur de fond.

import type { BatimentId, Rarete } from '../core/types';

// URL absolue : une url() dans une variable CSS se résout depuis la feuille de style (assets/), pas depuis la page.
const base = new URL('art/', document.baseURI).href;

/** Porteurs illustrés (tous ont maintenant un portrait ; un nouveau Porteur sans image garde son initiale) */
const PORTEURS_ILLUSTRES = new Set(['ilka', 'doran', 'vela', 'sasha', 'nuit', 'aurel', 'coursier', 'docker', 'guetteur']);

/** Modules illustrés : id du Module dans donnees.ts → fichier */
const MODULES_ILLUSTRES: Record<string, string> = {
  'jambes-ressort': 'jambes-ressort',
  'oeil-relais': 'oeil-relais',
  'glande-ambre': 'glande-ambre',
  'carapace-mere': 'carapace-mere',
  'eclat-chant': 'eclat-chant',
  'gant-arc': 'gant-arc',
  'coeur-turbine': 'coeur-turbine',
  'bras-grue': 'bras-grue',
  'lames-orbitales': 'lames-orbitales',
  'crocs-fossiles': 'crocs-fossiles',
  'cuir-recif': 'cuir-recif',
  'poumons-abysse': 'poumons-abysse',
  'coeur-meute': 'coeur-meute',
  'miroir-brume': 'miroir-brume',
  'encre-ancienne': 'encre-ancienne',
  'plume-givre': 'plume-givre',
  'ombre-ailee': 'ombre-ailee',
  'chant-abysses': 'chant-abysses',
  // les 12 Modules du 22 octobre
  'grappin-cable': 'grappin-cable',
  'oeil-brouilleur': 'oeil-brouilleur',
  'dorsale': 'dorsale',
  'coeur-reprise': 'coeur-reprise',
  'yeux-nocturnes': 'yeux-nocturnes',
  'branchies': 'branchies',
  'sang-ambre': 'sang-ambre',
  'mue-totale': 'mue-totale',
  'meche-or': 'meche-or',
  'ombre-serpent': 'ombre-serpent',
  'pressentiment': 'pressentiment',
  'souffle-wyrm': 'souffle-wyrm',
  // les 15 cartes de base et les deux cartes du district
  'ruee': 'ruee',
  'bond': 'bond',
  'esquive': 'esquive',
  'tir': 'tir',
  'tir-vif': 'tir-vif',
  'morsure': 'morsure',
  'carapace': 'carapace',
  'regenerer': 'regenerer',
  'charge': 'charge',
  'grogner': 'grogner',
  'murmure': 'murmure',
  'echo': 'echo',
  'apaiser': 'apaiser',
  'eclat': 'eclat',
  souffle: 'souffle',
  'stimulant': 'stimulant',
  'repli': 'repli',
};

/** Ennemis illustrés : id de l'ennemi → fichier (le Rémanent affaibli reprend le Rémanent) */
const ENNEMIS_ILLUSTRES: Record<string, string> = {
  'remanent-faible': 'remanent',
  remanent: 'remanent',
  vigie: 'vigie',
  confluence: 'confluence',
  'rampeur': 'rampeur',
  'pilleur': 'pilleur',
  'brigadier': 'brigadier',
  'echo-veilleur': 'echo-veilleur',
  'sentinelle-verre': 'sentinelle-verre',
  'gardien-registres': 'gardien-registres',
  'double': 'double',
  'essaim-ambre': 'essaim-ambre',
  'automate-graveur': 'automate-graveur',
  'tisseuse': 'tisseuse',
  'premier-porteur': 'premier-porteur',
};

export const portrait = (id: string): string | null => (PORTEURS_ILLUSTRES.has(id) ? `${base}porteurs/${id}.webp` : null);
/** l'illustration ne dépend pas du métal : « jambes-ressort@or » reprend celle de « jambes-ressort » */
export const illustrationModule = (cle: string): string | null => {
  const id = cle.split('@')[0]!;
  return MODULES_ILLUSTRES[id] ? `${base}modules/${MODULES_ILLUSTRES[id]}.webp` : null;
};
export const illustrationEnnemi = (id: string): string | null => (ENNEMIS_ILLUSTRES[id] ? `${base}ennemis/${ENNEMIS_ILLUSTRES[id]}.webp` : null);
/** Texture du métal d'une rareté (plaque et liseré des cartes) */
export const textureMetal = (r: Rarete) => `${base}metaux/${r}.webp`;
/** Fond de la carte d'une Strate, une illustration par zone (0 Fondations, 1 salles closes, 2 mémoires, 3 le fond), quand elle existe */
const STRATES_ILLUSTREES = new Set<number>([0, 1, 2, 3]);
export const decorStrate = (zone: number): string | null => (STRATES_ILLUSTREES.has(zone) ? `${base}strates/zone-${zone}.webp` : null);
export const decor = (nom: 'archipel' | 'archipel-nuit' | 'coupe') => `${base}district/${nom}.webp`;

/**
 * Le visuel d'un bâtiment selon son niveau (bible : « L'apparence des bâtiments ») :
 * bricolé 1 à 3, solide 4 à 7, prestigieux 8 et 9, légendaire 10.
 */
export function visuel(niveau: number): 1 | 2 | 3 | 4 {
  if (niveau >= 10) return 4;
  if (niveau >= 8) return 3;
  if (niveau >= 4) return 2;
  return 1;
}

export const illustrationBatiment = (id: BatimentId, niveau: number) => `${base}batiments/${id}-${visuel(niveau)}.webp`;

/** Niveau où le bâtiment change d'apparence la prochaine fois (null au légendaire) */
export function prochainVisuel(niveau: number): number | null {
  const seuils = [4, 8, 10];
  return seuils.find((s) => s > niveau) ?? null;
}

/** Style CSS d'une pastille de Porteur : sa couleur de fond, et son portrait s'il existe */
export function stylePastille(id: string, fond: string | undefined): string {
  const p = portrait(id);
  return `--fond:${fond ?? '#2A2438'}${p ? `;--img:url(${p})` : ''}`;
}

/**
 * Tableau du district : un tableau complet par âge, l'âge suit le niveau de la Tour du Noyau
 * (les autres bâtiments ne peuvent pas le dépasser).
 * La nuit (avant 7 h, dès 20 h, heure locale) n'est qu'une teinte posée en CSS.
 */
const AGES_PEINTS = 4;
/** Âges dont l'animation (boucle Midjourney ralentie, raccord fondu) existe ; l'âge 4 reste fixe pour l'instant */
const AGES_ANIMES = new Set([1, 2, 3]);
export function sceneDistrict(niveauNoyau: number, maintenant = new Date()): { age: 1 | 2 | 3 | 4; url: string; video: string | null; nuit: boolean } {
  const age = visuel(niveauNoyau);
  const h = maintenant.getHours();
  return {
    age,
    url: `${base}district/age-${Math.min(age, AGES_PEINTS)}.webp`,
    video: AGES_ANIMES.has(age) ? `${base}district/age-${age}.mp4` : null,
    nuit: h < 7 || h >= 20,
  };
}
