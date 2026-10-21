// Illustrations Midjourney (public/art/). Chaque fonction renvoie null quand l'image n'existe pas encore :
// l'affichage garde alors son visuel dessiné en SVG ou sa couleur de fond.

import type { BatimentId, Rarete } from '../core/types';

// URL absolue : une url() dans une variable CSS se résout depuis la feuille de style (assets/), pas depuis la page.
const base = new URL('art/', document.baseURI).href;

/** Porteurs illustrés (les recrues anonymes n'ont pas de portrait) */
const PORTEURS_ILLUSTRES = new Set(['ilka', 'doran', 'vela', 'sasha', 'nuit', 'aurel']);

/** Modules illustrés : id du Module dans donnees.ts → fichier */
const MODULES_ILLUSTRES: Record<string, string> = {
  'jambes-ressort': 'jambes-ressort',
  'oeil-relais': 'oeil-relais',
  'glande-ambre': 'glande-ambre',
  'carapace-mere': 'carapace-mere',
  'eclat-chant': 'eclat-chant',
};

/** Ennemis illustrés : id de l'ennemi → fichier (le Rémanent affaibli reprend le Rémanent) */
const ENNEMIS_ILLUSTRES: Record<string, string> = {
  'remanent-faible': 'remanent',
  remanent: 'remanent',
  vigie: 'vigie',
  confluence: 'confluence',
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
export const decor = (nom: 'archipel' | 'archipel-nuit' | 'coupe' | 'mer') => `${base}district/${nom}.webp`;

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

/** Fond de la carte : la mer vue d'en haut ; la nuit (avant 7 h, dès 20 h, heure locale) n'est qu'une teinte posée en CSS */
export function fondCarte(maintenant = new Date()): { url: string; nuit: boolean } {
  const h = maintenant.getHours();
  const nuit = h < 7 || h >= 20;
  return { url: decor('mer'), nuit };
}
