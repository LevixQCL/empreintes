// Illustrations Midjourney (public/art/). Chaque fonction renvoie null quand l'image n'existe pas encore :
// l'affichage garde alors son visuel dessiné en SVG ou sa couleur de fond.

import type { BatimentId, Rarete } from '../core/types';

// URL absolue : une url() dans une variable CSS se résout depuis la feuille de style (assets/), pas depuis la page.
const base = new URL('art/', document.baseURI).href;

/** Porteurs illustrés (tous ont maintenant un portrait ; un nouveau Porteur sans image garde son initiale) */
/** à changer quand les portraits sont repeints sous le même nom : le navigateur recharge alors les nouveaux au lieu de garder les anciens en cache */
const VERSION_PORTRAITS = 2;
/** idem pour les illustrations des cartes */
const VERSION_CARTES = 15;
const PORTEURS_ILLUSTRES = new Set(['ilka', 'doran', 'vela', 'sasha', 'nuit', 'aurel', 'coursier', 'docker', 'guetteur', 'kessa', 'liane', 'joss']);

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
  // les voies, étape 1 (27 octobre 2026)
  'bobine-recuperation': 'bobine-recuperation',
  condensateur: 'condensateur',
  'decharge-arc': 'decharge-arc',
  'eclair-captif': 'eclair-captif',
  'noyau-instable': 'noyau-instable',
  'coup-epaule': 'coup-epaule',
  'queue-massue': 'queue-massue',
  'belier-os': 'belier-os',
  'retour-maree': 'retour-maree',
  'diapason-cristal': 'diapason-cristal',
  'voix-basse': 'voix-basse',
  'chorale-ombres': 'chorale-ombres',
  'cloche-abysses': 'cloche-abysses',
  'grand-unisson': 'grand-unisson',
  // l'Héritage du district (27 octobre 2026)
  'carapace-fondations': 'carapace-fondations',
  'oeil-grande-nuit': 'oeil-grande-nuit',
  'premiere-mue': 'premiere-mue',
  'lanterne-lecture': 'lanterne-lecture',
  'cle-legs': 'cle-legs',
  'foulee-directrice': 'foulee-directrice',
  'bras-fonderie': 'bras-fonderie',
  'coeur-glaciere': 'coeur-glaciere',
  'sceau-orseve': 'sceau-orseve',
  'voix-quartier': 'voix-quartier',
  // le parrainage (29 octobre 2026)
  'empreinte-jumelle': 'empreinte-jumelle',
  // les voies, étapes 2 et 3, et les exclusives (28 octobre 2026)
  'lames-jumelles': 'lames-jumelles',
  'oeil-lecteur': 'oeil-lecteur',
  'boucle-memoire': 'boucle-memoire',
  'lame-doute': 'lame-doute',
  'seve-piliers': 'seve-piliers',
  'miroir-hauts': 'miroir-hauts',
  'seconde-naissance': 'seconde-naissance',
  'pollen-ambre': 'pollen-ambre',
  'gantelet-pillard': 'gantelet-pillard',
  'coeur-surregime': 'coeur-surregime',
  'silence-avant': 'silence-avant',
  'floraison': 'floraison',
  'verdict': 'verdict',
  'empreinte-vive': 'empreinte-vive',
  'poings-pistons': 'poings-pistons',
  'sentence-muette': 'sentence-muette',
  'regard-biais': 'regard-biais',
  'mue-verre': 'mue-verre',
  'flair': 'flair',
  'cadence-folle': 'cadence-folle',
  'pas-chasse': 'pas-chasse',
  'peau-ancetre': 'peau-ancetre',
  'machoire-miroir': 'machoire-miroir',
  'crocs-verre': 'crocs-verre',
  'hallali': 'hallali',
  'bond-predateur': 'bond-predateur',
  'coeur-etoile': 'coeur-etoile',
  'chasse-aveugle': 'chasse-aveugle',
  'mitraille': 'mitraille',
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
  sauvage: 'sauvage',
};

/**
 * Le cadrage vertical de chaque portrait dans une tuile large de l'escouade (background-position, en %) : les yeux tombent
 * au tiers haut de la tuile. 18 % par défaut ; Véla, encapuchonnée, a le visage nettement plus bas.
 */
const CADRAGE: Record<string, number> = { vela: 52, nuit: 25, sasha: 25, coursier: 20 };
export const cadragePortrait = (id: string): number => CADRAGE[id] ?? 18;
/** La miniature d'un portrait (120 × 132 px, le visage cadré comme dans les avatars) : pour les petits hexagones, quelques Ko au lieu de 80 */
export const miniature = (id: string): string | null => (PORTEURS_ILLUSTRES.has(id) ? `${base}porteurs/mini/${id}.webp?v=${VERSION_PORTRAITS}` : null);
export const portrait = (id: string): string | null => (PORTEURS_ILLUSTRES.has(id) ? `${base}porteurs/${id}.webp?v=${VERSION_PORTRAITS}` : null);
/** l'illustration ne dépend pas du métal : « jambes-ressort@or » reprend celle de « jambes-ressort » */
export const illustrationModule = (cle: string): string | null => {
  const id = cle.split('@')[0]!;
  return MODULES_ILLUSTRES[id] ? `${base}modules/${MODULES_ILLUSTRES[id]}.webp?v=${VERSION_CARTES}` : null;
};
/** Les ornements peints des gardiens (27 octobre 2026) : plaque du nom, cadre de la barre de vie, cran de phase, bandeau d'annonce */
export const artGardien = (n: 'plaque' | 'barre' | 'cran' | 'bandeau') => `${base}boss/${n}.webp`;
export const illustrationEnnemi = (id: string): string | null => (ENNEMIS_ILLUSTRES[id] ? `${base}ennemis/${ENNEMIS_ILLUSTRES[id]}.webp` : null);
/** Texture du métal d'une rareté (plaque et liseré des cartes) */
export const textureMetal = (r: Rarete) => `${base}metaux/${r}.webp`;
/** Le filigrane d'empreinte d'une carte vétérane (28 octobre 2026) : Trace (bleu), Sillon (or), Empreinte (irisée) */
export const filigrane = (palier: 1 | 2 | 3) => `${base}empreinte/${['trace', 'sillon', 'empreinte'][palier - 1]}.webp`;
/**
 * Décor d'une Strate : une illustration et une ambiance par Strate (28 octobre 2026, Bryan : « des thèmes différents »),
 * de −1 (fondations noyées, vert d'eau) à −10 (le fond, obsidienne et braise). Au-delà de −10, le décor du fond.
 * Les anciennes images par zone (strates/zone-N.webp) restent pour les --sref des prompts.
 */
const STRATES_PEINTES = 10;
const numStrate = (strate: number) => Math.min(STRATES_PEINTES, Math.max(1, Math.round(strate) || 1));
export const decorStrate = (strate: number): string => `${base}strates/strate-${numStrate(strate)}.webp`;
/**
 * Fond de l'écran de combat : la même illustration de Strate, floutée et assombrie d'avance (strates/strate-N-fond.webp, 600 × 750).
 * Floutée dans le fichier plutôt qu'en CSS : un filtre plein écran coûte cher sur téléphone, une petite image floue s'agrandit sans défaut.
 */
export const fondCombat = (strate: number): string => `${base}strates/strate-${numStrate(strate)}-fond.webp`;
/** Icônes peintes des conditions de salle (23 octobre 2026), les sept */
const CONDITIONS_PEINTES = new Set(['inondee', 'courants', 'chant', 'echo', 'sanctuaire', 'eboulis', 'brouillard']);
export const iconeCondition = (id: string): string | null => (CONDITIONS_PEINTES.has(id) ? `${base}conditions/${id}.webp` : null);
/** Ysé, l'archiviste des Chroniques (23 octobre 2026) */
export const portraitYse = `${base}personnages/yse.webp`;
/** Les personnages de la campagne illustrés (campagne.ts) : les autres gardent leur initiale */
const PERSONNAGES_ILLUSTRES = new Set(['yse', 'hald', 'isaure', 'brac', 'tobin']);
export const portraitPersonnage = (id: string): string | null => (PERSONNAGES_ILLUSTRES.has(id) ? `${base}personnages/${id}.webp` : null);
/** Les scènes de la campagne qui ont leur propre illustration (public/art/scenes/) ; les autres reprennent un décor existant */
const SCENES_ILLUSTREES = new Set(['entree-2', 'entree-4', 'entree-5', 'entree-6', 'gardien-2', 'gardien-3', 'convocation', 'entree-8', 'gardien-9', 'epilogue']);
/** Le décor des combats de la Flèche : une plateforme d'amarrage au-dessus des nuages (28 octobre 2026) */
export const fondFleche = `${base}scenes/fleche.webp`;
export const illustrationScene = (id: string): string | null => (SCENES_ILLUSTREES.has(id) ? `${base}scenes/${id}.webp` : null);
/** La salle d'entraînement de la Tour du Noyau (23 octobre 2026) */
export const salleEntrainement = `${base}salles/entrainement.webp`;
export const decor = (nom: 'archipel' | 'archipel-nuit' | 'coupe') => `${base}district/${nom}.webp`;
/** Le Grand Tableau : les écrans de cristal du marché de nuit (Midjourney, 23 octobre 2026) */
export const fondTableau = `${base}classements/tableau.webp`;

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

/**
 * Tableau du district : un tableau complet par âge, l'âge suit le niveau de la Tour du Noyau
 * (les autres bâtiments ne peuvent pas le dépasser).
 * La nuit (avant 7 h, dès 20 h, heure locale) n'est qu'une teinte posée en CSS.
 */
const AGES_PEINTS = 4;
/** L'horizon de chaque âge, en % de la hauteur de mer-N.webp (scripts/mer-district.py : HORIZONS, le tableau commence à 300 px sur 1500) */
const HORIZON_MER = [24.6, 24.47, 24.27, 24.27];
/**
 * Les missions en mer (28 octobre 2026) : chaque lieu a son décor peint (art/missions/<lieu>.webp, panorama 3:1, l'ordre est celui de
 * LIEUX_MISSION) et la barque du passeur est une image détourée (art/missions/barque.webp, proue vers la droite).
 * Tant qu'un lieu n'est pas peint, sa carte montre le large de la mer du district (mer-1.webp) et ses piliers abandonnés.
 */
export const LIEUX_SLUGS = ['phare', 'serres', 'pilier-effondre', 'pompage', 'marche', 'transbordeur', 'gare', 'silos', 'pilier-sans-nom', 'dessalement', 'criee', 'clocher'] as const;
const LIEUX_PEINTS = new Set<string>(LIEUX_SLUGS);
export const decorLieu = (i: number): string | null => {
  const s = LIEUX_SLUGS[i];
  return s && LIEUX_PEINTS.has(s) ? `${base}missions/${s}.webp` : null;
};
export const BARQUE_PEINTE = true;
export const barque = `${base}missions/barque.webp`;
/**
 * Le large, faute de décor peint : la mer du premier âge (4000 × 1500) et un de ses piliers abandonnés (centre x, y en pixels).
 * Seuls les piliers du bord servent : le district, au centre du panorama, reste hors du cadre ; le premier est vu en miroir.
 */
export const merLarge = `${base}district/mer-1.webp`;
export const PILIERS_LARGE: readonly { x: number; y: number; miroir: boolean }[] = [
  { x: 3590, y: 415, miroir: false }, { x: 3710, y: 415, miroir: false }, { x: 360, y: 410, miroir: true },
];
/** Les reflets qui glissent sur la mer prolongée (PC) */
export const reflets = `${base}district/mer-reflets.webp`;
/** Âges dont l'animation (boucle Midjourney ralentie, raccord fondu) existe. Vide depuis les nouveaux tableaux à 7 bâtiments
 *  (23 octobre 2026) : les anciennes boucles montraient les anciens tableaux ; on rebranche les nouvelles dès qu'elles existent. */
const AGES_ANIMES = new Set<number>([1, 2, 3, 4]);
/** Un archipel vu de loin (carte des pillages) : le tableau du district à cet âge */
/** L'âge d'un archipel d'après sa profondeur : plus il a creusé, plus il a grandi */
export const ageArchipel = (strate: number) => (strate <= 2 ? 1 : strate <= 5 ? 2 : strate <= 9 ? 3 : 4);
export const vignetteArchipel = (age: number) => `${base}district/age-${Math.max(1, Math.min(age, AGES_PEINTS))}.webp`;
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
