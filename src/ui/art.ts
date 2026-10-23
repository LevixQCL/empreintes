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
/**
 * Cadre peint d'une rareté (Midjourney, Retexture de nos modèles de carte, 22 octobre 2026) : de plus en plus fin avec la rareté.
 * Fer et or sont des cadres droits, cuivre et argent ont les deux coins coupés. La nacre n'a pas de cadre.
 */
/** Pierre gravée d'une Fréquence (Midjourney, 22 octobre 2026) */
export const pierreFrequence = (f: number) => `${base}frequences/${f}.webp`;
/** Symbole peint d'une action : épée, bouclier, croix de jade (Midjourney, 22 octobre 2026) */
export const symboleAction = (t: 'atk' | 'bouclier' | 'soin') => `${base}actions/${t}.webp`;
/** Socle peint d'une action, porte la force au centre et la Fréquence sur le pourtour (Midjourney, 22 octobre 2026) */
export const socleAction = (t: 'atk' | 'bouclier' | 'soin') => `${base}socles/${t}.webp`;
/**
 * Cadres peints d'un seul tenant (Midjourney, Retexture, 22 octobre 2026) : cadre du métal + cristal de la Fréquence en haut à gauche
 * + socle de l'action en bas à droite, un cadre par métal et par action. Le jeu ne pose que les deux chiffres (et teinte le cristal).
 * f = centre du cristal, v = centre du disque de force, en % de la carte (mesurés sur l'image, puis vérifiés à l'écran).
 */
export const CADRES_PLEINS: Partial<Record<Rarete, Partial<Record<'atk' | 'bouclier' | 'soin', { f: [number, number]; v: [number, number] }>>>> = {
  fer: {
    atk: { f: [11.5, 12.0], v: [80.8, 85.5] },
    bouclier: { f: [11.7, 12.2], v: [80.9, 85.6] },
    soin: { f: [11.5, 12.1], v: [81.3, 86.8] },
  },
  cuivre: {
    atk: { f: [11.8, 12.2], v: [80.1, 84.8] },
    bouclier: { f: [13.2, 13.4], v: [81.6, 86.4] },
    soin: { f: [11.7, 11.7], v: [81.1, 86.3] },
  },
  argent: {
    atk: { f: [10.6, 12.4], v: [80.4, 85.3] },
    bouclier: { f: [11.1, 12.5], v: [82.0, 86.8] },
    soin: { f: [11.3, 11.9], v: [81.0, 86.2] },
  },
  or: {
    atk: { f: [12.0, 12.2], v: [80.3, 85.1] },
    bouclier: { f: [11.7, 12.0], v: [80.4, 85.2] },
    soin: { f: [11.5, 12.0], v: [81.1, 86.2] },
  },
  nacre: {
    atk: { f: [12.0, 12.2], v: [80.3, 85.1] },
    bouclier: { f: [11.7, 12.0], v: [80.4, 85.2] },
    soin: { f: [11.5, 12.0], v: [81.1, 86.2] },
  },
};
export const cadrePlein = (r: Rarete, t: 'atk' | 'bouclier' | 'soin') => (CADRES_PLEINS[r]?.[t] ? { ...CADRES_PLEINS[r]![t]!, img: `${base}cadres/${r}-${t}-plein.webp`, masque: `${base}cadres/${r}-${t}-cristal.png` } : null);
export const cadreMetal = (r: Rarete): string | null => (r === 'nacre' ? null : `${base}cadres/${r}.webp`);
/** Fond de la carte d'une Strate, une illustration par zone (0 Fondations, 1 salles closes, 2 mémoires, 3 le fond), quand elle existe */
const STRATES_ILLUSTREES = new Set<number>([0, 1, 2, 3]);
export const decorStrate = (zone: number): string | null => (STRATES_ILLUSTREES.has(zone) ? `${base}strates/zone-${zone}.webp` : null);
/**
 * Fond de l'écran de combat : la même illustration de zone, floutée et assombrie d'avance (strates/zone-N-fond.webp, 600 × 750).
 * Floutée dans le fichier plutôt qu'en CSS : un filtre plein écran coûte cher sur téléphone, une petite image floue s'agrandit sans défaut.
 */
export const fondCombat = (zone: number): string | null => (STRATES_ILLUSTREES.has(zone) ? `${base}strates/zone-${zone}-fond.webp` : null);
/** Icônes peintes des conditions de salle (23 octobre 2026) ; inondée et éboulis gardent le cristal en attendant leur image */
const CONDITIONS_PEINTES = new Set(['courants', 'chant', 'echo', 'sanctuaire', 'brouillard']);
export const iconeCondition = (id: string): string | null => (CONDITIONS_PEINTES.has(id) ? `${base}conditions/${id}.webp` : null);
/** Ysé, l'archiviste des Chroniques (23 octobre 2026) */
export const portraitYse = `${base}personnages/yse.webp`;
/** La salle d'entraînement de la Tour du Noyau (23 octobre 2026) */
export const salleEntrainement = `${base}salles/entrainement.webp`;
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
/** L'horizon de chaque âge, en % de la hauteur de mer-N.webp (scripts/mer-district.py : HORIZONS, le tableau commence à 300 px sur 1500) */
const HORIZON_MER = [24.6, 24.47, 24.27, 24.27];
/** Les reflets qui glissent sur la mer prolongée (PC) */
export const reflets = `${base}district/mer-reflets.webp`;
/** Âges dont l'animation (boucle Midjourney ralentie, raccord fondu) existe. Vide depuis les nouveaux tableaux à 7 bâtiments
 *  (23 octobre 2026) : les anciennes boucles montraient les anciens tableaux ; on rebranche les nouvelles dès qu'elles existent. */
const AGES_ANIMES = new Set<number>([1, 2, 3, 4]);
export function sceneDistrict(niveauNoyau: number, maintenant = new Date()): { age: 1 | 2 | 3 | 4; url: string; mer: string; horizon: number; video: string | null; nuit: boolean } {
  const age = visuel(niveauNoyau);
  const h = maintenant.getHours();
  return {
    age,
    url: `${base}district/age-${Math.min(age, AGES_PEINTS)}.webp`,
    // sur PC : le tableau prolongé par sa mer et son ciel (scripts/mer-district.py), 4000 × 1500, le tableau au centre en bas
    mer: `${base}district/mer-${Math.min(age, AGES_PEINTS)}.webp`,
    horizon: HORIZON_MER[Math.min(age, AGES_PEINTS) - 1]!,
    video: AGES_ANIMES.has(age) ? `${base}district/age-${age}.mp4` : null,
    nuit: h < 7 || h >= 20,
  };
}
