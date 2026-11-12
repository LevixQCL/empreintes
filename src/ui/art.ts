// Illustrations Midjourney (public/art/). Chaque fonction renvoie null quand l'image n'existe pas encore :
// l'affichage garde alors son visuel dessiné en SVG ou sa couleur de fond.

import type { BatimentId, Rarete } from '../core/types';

// URL absolue : une url() dans une variable CSS se résout depuis la feuille de style (assets/), pas depuis la page.
const base = new URL('art/', document.baseURI).href;

/** Porteurs illustrés (tous ont maintenant un portrait ; un nouveau Porteur sans image garde son initiale) */
/** à changer quand les portraits sont repeints sous le même nom : le navigateur recharge alors les nouveaux au lieu de garder les anciens en cache */
const VERSION_PORTRAITS = 2;
/** idem pour les illustrations des cartes */
const VERSION_CARTES = 24;
const PORTEURS_ILLUSTRES = new Set(['ilka', 'doran', 'vela', 'sasha', 'nuit', 'aurel', 'coursier', 'docker', 'guetteur', 'kessa', 'liane', 'joss']);

/** Modules illustrés : id du Module dans donnees.ts → fichier */
const MODULES_ILLUSTRES: Record<string, string> = {
  // les cartes d'origine des Récits (11 novembre 2026)
  'cle-des-pompes': 'cle-des-pompes',
  'toutes-les-courses': 'toutes-les-courses',
  'quarante-jours': 'quarante-jours',
  'berceuse-a-compter': 'berceuse-a-compter',
  'ombre-nette': 'ombre-nette',
  'nuit-blanche': 'nuit-blanche',
  // les nouvelles cartes (4 novembre 2026)
  'riveteuse': 'riveteuse',
  'racines-meres': 'racines-meres',
  'exo-chantier': 'exo-chantier',
  'suture-vive': 'suture-vive',
  'marteau-piston': 'marteau-piston',
  'berceuse': 'berceuse',
  'nuee-chorale': 'nuee-chorale',
  'servo-bras': 'servo-bras',
  'lamproie': 'lamproie',
  'fil-accord': 'fil-accord',
  'contre-chant': 'contre-chant',
  'verin': 'verin',
  'foreuse': 'foreuse',
  'couperet-hauts': 'couperet-hauts',
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
  // les cartes communes du Râtelier (30 octobre 2026)
  'lame-atelier': 'lame-atelier',
  'plan-galeries': 'plan-galeries',
  'groupe-secours': 'groupe-secours',
  breche: 'breche',
  'ampoule-releve': 'ampoule-releve',
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
/** Les Rôdeurs déjà peints (à compléter à l'arrivée des images), et le cousin dont ils empruntent le portrait en attendant */
const RODEURS_PEINTS = new Set<string>(['maree-basse', 'sentinelle-orpheline', 'liseur', 'plongeur']);
const RODEURS_PROVISOIRES: Record<string, string> = { 'maree-basse': 'rampeur', 'sentinelle-orpheline': 'sentinelle-verre', liseur: 'echo-veilleur', plongeur: 'automate-graveur' };
/** Un Rôdeur sans son propre portrait : l'image empruntée est teintée (classe .provisoire) pour ne pas le confondre avec son cousin */
export const portraitProvisoire = (id: string) => id in RODEURS_PROVISOIRES && !RODEURS_PEINTS.has(id);
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
  // les Rôdeurs (31 octobre 2026) : leur portrait Midjourney s'il est là (ennemis/<id>.webp), sinon celui d'un cousin de leur zone
  ...Object.fromEntries(Object.entries(RODEURS_PROVISOIRES).map(([id, cousin]) => [id, RODEURS_PEINTS.has(id) ? id : cousin])),
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
/** Les gardes de la Flèche déjà peints (public/art/ennemis/<id>.webp, prompts dans docs/prompts-gardes-fleche.md : un visage
 *  par garde) ; en attendant le sien, un garde porte l'uniforme des Brigades. La capitaine Hald a déjà son portrait. */
const GARDES_PEINTS = new Set<string>([
  'flc-arrimeur', 'flc-treuilliste', 'flc-gaffeur', 'flc-debardeuse', 'flc-brigadier', 'flc-vigie', 'flc-canonnier', 'flc-mecanicienne', 'flc-aile-verre', 'flc-cordiere', 'flc-ecouteuse', 'flc-brigadiere', 'flc-lancier', 'flc-duelliste', 'flc-orseve', 'flc-intendante', 'flc-heraut', 'flc-chantre', 'flc-contremaitre', 'flc-commandeur', 'flc-champion',
]);
function illustrationGarde(id: string): string {
  if (id === 'flc-hald') return `${base}personnages/hald.webp`;
  if (!GARDES_PEINTS.has(id)) return `${base}ennemis/brigadier.webp`;
  return `${base}ennemis/${id}.webp`;
}
export const illustrationEnnemi = (id: string): string | null =>
  (id.startsWith('flc-') ? illustrationGarde(id) : ENNEMIS_ILLUSTRES[id] ? `${base}ennemis/${ENNEMIS_ILLUSTRES[id]}.webp` : null);
/**
 * Visage d'un garde de garnison (pillages) ou d'un garde posté par un autre directeur (Flèche) : 9 novembre 2026,
 * recensement des images, on se battait contre « sa » propre Ilka. Le garde garde le nom du Porteur qu'il sert,
 * mais prend un visage de garde de sa lignée, en deux variantes pour que deux gardes d'une même lignée diffèrent.
 * Prompts : docs/prompts-recensement.md. Tant qu'un visage n'est pas peint, le garde reprend le portrait du Porteur
 * (10 et 11 novembre 2026 : tous peints).
 */
const GARNISONS_PEINTES = new Set<string>(['garnison-tech-1', 'garnison-tech-2', 'garnison-bio-1', 'garnison-bio-2', 'garnison-reso-1', 'garnison-reso-2']);
export function visageGarnison(lignee: string, variante: number, porteur: string): string | null {
  const id = `garnison-${lignee}-${(variante % 2) + 1}`;
  return GARNISONS_PEINTES.has(id) ? `${base}ennemis/${id}.webp` : portrait(porteur);
}
/** Texture du métal d'une rareté (plaque et liseré des cartes) */
export const textureMetal = (r: Rarete) => `${base}metaux/${r}.webp`;
/** Le filigrane d'empreinte d'une carte vétérane (28 octobre 2026) : Trace (bleu), Sillon (or), Empreinte (irisée) */
export const filigrane = (palier: 1 | 2 | 3) => `${base}empreinte/${['trace', 'sillon', 'empreinte'][palier - 1]}.webp`;
/**
 * Décor d'une Strate : une illustration et une ambiance par Strate (28 octobre 2026, Bryan : « des thèmes différents »),
 * de −1 (fondations noyées, vert d'eau) à −10 (le fond, obsidienne et braise), puis les Strates du Fond −11 à −15
 * (11 novembre 2026 : l'eau d'en bas, la forêt de cristal, le registre, ton pilier, les vannes). Au-delà, le décor de −15.
 * Les anciennes images par zone (strates/zone-N.webp) restent pour les --sref des prompts.
 */
const STRATES_PEINTES = 15;
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
const SCENES_ILLUSTREES = new Set(['entree-2', 'entree-4', 'entree-5', 'entree-6', 'gardien-2', 'gardien-3', 'convocation', 'entree-8', 'gardien-9', 'epilogue',
  // les onze dernières (30 octobre 2026) : toute la campagne est illustrée
  'gardien-1', 'entree-3', 'gardien-4', 'gardien-5', 'gardien-6', 'entree-7', 'gardien-7', 'gardien-8', 'entree-9', 'entree-10', 'gardien-10']);
/** Le décor des combats de la Flèche : une plateforme d'amarrage au-dessus des nuages (28 octobre 2026) */
export const fondFleche = `${base}scenes/fleche.webp`;
/** La Flèche peinte (30 octobre 2026) : la Flèche entière, le médaillon de l'escouade, les plaques, les fanions, la passerelle, le sceau du gardien */
export const artFleche = (n: 'fleche-entiere' | 'medaillon' | 'plaque' | 'fanion' | 'passerelle' | 'sceau-gardien') => `${base}fleche/${n}.webp`;
export const illustrationScene = (id: string): string | null => (SCENES_ILLUSTREES.has(id) ? `${base}scenes/${id}.webp` : null);
/** Les images charnières du suspense (11 novembre 2026) : une par Strate, toutes peintes */
const CHARNIERES = new Set([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
export const imageCharniere = (n: number): string | null => (CHARNIERES.has(n) ? `${base}scenes/charniere-${n}.webp` : null);
/** Le gros plan sur la cheville d'Ilka : l'écran est vide sur l'image, le jeu y dessine ce qu'il affiche */
export const imageCheville = `${base}scenes/cheville.webp`;
/** La salle d'entraînement de la Tour du Noyau (23 octobre 2026) */
export const salleEntrainement = `${base}salles/entrainement.webp`;
/** L'intérieur peint d'un bâtiment (12 novembre 2026) : la scène en tête de sa feuille (prompts dans docs/prompts-interieurs.md).
 *  Le Cercle n'en a pas encore : sa feuille garde l'en-tête sans image. */
const INTERIEURS: Partial<Record<BatimentId, string>> = {
  noyau: 'entrainement', forge: 'forge', generateur: 'generateur', clinique: 'clinique', comptoir: 'comptoir',
};
export const interieurBatiment = (id: BatimentId): string | null => (INTERIEURS[id] ? `${base}salles/${INTERIEURS[id]}.webp` : null);
export const decor = (nom: 'coupe') => `${base}district/${nom}.webp`;
/** Le Mur des empreintes (7 novembre 2026) : les 48 mains peintes, découpées en une planche de 8 × 6 (dans l'ordre des familles) */
export const planchEmpreintes = `${base}district/mur-empreintes.webp`;
/** Le flanc de la digue, vu en coupe (les Basses, 7 novembre 2026) : 720 × 1285, du haut (Lavoirs) au bas (Palier) */
export const flancBasses = `${base}district/basses.webp`;
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

/**
 * Les paliers des bâtiments de la Cuvette (3 novembre 2026) : trois apparences par bâtiment, peintes dans la Cuvette avec l'éditeur de
 * Midjourney (zooms et prompts : docs/prompts-paliers.md). Bricolé aux niveaux 1 à 3, le tableau tel quel de 4 à 7, prestigieux dès 8.
 * Le tableau (cuvette.webp) montre le palier du milieu ; un palier bas ou haut est un calque posé dessus (art/district/paliers),
 * qui recouvre aussi le sol sous l'ancien bâtiment. Les feuilles des bâtiments : art/batiments/<id>-1 à 4.webp (3 et 4 identiques).
 */
export const PALIERS_PEINTS = true;
export type PalierCuvette = 'bas' | 'milieu' | 'haut';
export const palierCuvette = (niveau: number): PalierCuvette => (niveau >= 8 ? 'haut' : niveau >= 4 ? 'milieu' : 'bas');
/** Les calques des paliers bas et haut, en pixels du tableau (800 × 1200) : gauche, haut, largeur, hauteur. Les lieux sont listés
 *  du fond vers l'avant : c'est l'ordre où ils se posent (un bâtiment plus proche passe devant). */
/** Un calque de palier : sa boîte (gauche, haut, largeur, hauteur, en pixels du tableau 800 × 1200), les éclats de ses cristaux
 *  (repère 400 × 600) et, au palier haut, la zone cliquable du bâtiment agrandi (repère 400 × 600) */
type CalqueCuvette = { lieu: string; bas: readonly number[]; haut: readonly number[]; eclats: Record<'bas' | 'haut', readonly (readonly number[])[]> & { milieu?: readonly (readonly number[])[] }; zoneHaut: string;
  /** un palier du milieu en calque, quand le tableau montre encore autre chose à cet endroit (le Cercle, à la place du Labo) */
  milieu?: readonly number[] };
export const CALQUES_CUVETTE: readonly CalqueCuvette[] = [
  { lieu: 'noyau', bas: [334, 285, 157, 296], haut: [278, 267, 278, 320], eclats: { bas: [[206, 251], [237, 251]], haut: [[215, 151], [202, 153]] }, zoneHaut: '210,136 240,146 270,172 275,258 232,286 202,291 182,287 167,277 141,209 173,146 191,138' },
  // le Cercle des quais (3 novembre 2026) : ses trois paliers sont des calques, le milieu compris (le tableau montre encore l'ancien Labo)
  { lieu: 'cercle', bas: [567, 446, 156, 184], milieu: [562, 446, 166, 182], haut: [543, 405, 204, 226], eclats: { bas: [[341, 294], [301, 297]], milieu: [[318, 261], [327, 260]], haut: [[323, 212], [320, 291]] }, zoneHaut: '371,214 371,290 361,302 349,309 327,313 302,311 285,303 274,290 274,214 321,205' },
  { lieu: 'forge', bas: [134, 376, 158, 265], haut: [128, 350, 204, 302], eclats: { bas: [[98, 280], [92, 309]], haut: [[124, 296], [122, 304]] }, zoneHaut: '163,202 144,311 134,318 115,323 74,318 68,305 68,257 79,183 99,179' },
  { lieu: 'clinique', bas: [118, 634, 168, 145], haut: [111, 556, 187, 228], eclats: { bas: [[124, 367]], haut: [[78, 301], [83, 367]] }, zoneHaut: '148,386 104,398 62,392 60,326 73,282 85,281 141,315 146,330' },
  { lieu: 'comptoir', bas: [454, 611, 198, 226], haut: [455, 567, 213, 270], eclats: { bas: [[289, 399], [300, 393]], haut: [[280, 406], [280, 366]] }, zoneHaut: '329,287 331,314 316,402 280,420 240,410 231,309 263,287' },
  { lieu: 'generateur', bas: [244, 650, 199, 226], haut: [235, 587, 221, 289], eclats: { bas: [[176, 357], [201, 386]], haut: [[178, 318], [174, 347]] }, zoneHaut: '216,420 176,438 140,430 121,396 125,324 171,297 189,299 224,385 224,398' },
  { lieu: 'port', bas: [591, 1020, 245, 143], haut: [590, 953, 249, 210], eclats: { bas: [[335, 515], [311, 549]], haut: [[321, 494], [313, 554]] }, zoneHaut: '400,588 300,590 296,520 299,504 310,481 327,480 400,520' },
];
/** Le Cercle des quais a pris la place du Labo (3 novembre 2026) : tant que ses paliers ne sont pas peints, il garde ceux du Labo */
export const CERCLE_PEINT = true;
const fichierLieu = (lieu: string) => (lieu === 'cercle' && !CERCLE_PEINT ? 'labo' : lieu);
export const calquePalier = (lieu: string, p: PalierCuvette, lueur = false) => `${base}district/paliers/${fichierLieu(lieu)}-${p}${lueur ? '-lueur' : ''}.webp`;
/** Le haut de la cheminée de la Forge à chaque palier (repère 400 × 600) : la fumée en sort */
export const FUMEE_FORGE: Record<PalierCuvette, [number, number]> = { bas: [96, 236], milieu: [90, 196], haut: [95, 187] };
const unSeulVisuel = () => CUVETTE && !PALIERS_PEINTS;
export const illustrationBatiment = (id: BatimentId, niveau: number) =>
  unSeulVisuel() ? `${base}batiments/${fichierLieu(id)}.webp` : `${base}batiments/${fichierLieu(id)}-${visuel(niveau)}.webp`;

/** Niveau où le bâtiment change d'apparence la prochaine fois (null au légendaire). Pour la Tour, c'est aussi l'âge du district. */
export function prochainVisuel(niveau: number): number | null {
  if (unSeulVisuel()) return null;
  return [4, 8, 10].find((s) => s > niveau) ?? null;
}
/** Le prochain niveau où un bâtiment de la Cuvette change vraiment d'allure (trois paliers : le 10 garde l'allure du 8) */
export function prochainPalier(niveau: number): number | null {
  if (unSeulVisuel()) return null;
  return [4, 8].find((s) => s > niveau) ?? null;
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
/** Le bandeau du Port : le port sur pilotis au pied de la digue de la Cuvette, devant son sas (Midjourney, 12 novembre 2026) */
export const bandeauPort = `${base}district/port-bandeau.webp`;
export const PILIERS_LARGE: readonly { x: number; y: number; miroir: boolean }[] = [
  { x: 3590, y: 415, miroir: false }, { x: 3710, y: 415, miroir: false }, { x: 360, y: 410, miroir: true },
];
/** Les reflets qui glissent sur la mer prolongée (PC) */
export const reflets = `${base}district/mer-reflets.webp`;
/** Âges dont l'animation existe. Vide depuis la Cuvette (3 novembre 2026) : les boucles et les mers prolongées de
 *  l'archipel (age-N.mp4, mer-2 à 4.webp) sont rangées dans sources/art/district, hors du jeu publié. */
const AGES_ANIMES = new Set<number>();
/** Un archipel vu de loin (carte des pillages) : le tableau du district à cet âge */
/** L'âge d'un archipel d'après sa profondeur : plus il a creusé, plus il a grandi */
export const ageArchipel = (strate: number) => (strate <= 2 ? 1 : strate <= 5 ? 2 : strate <= 9 ? 3 : 4);
/** Ton propre district vu de loin (pillages, missions en mer) : la Cuvette */
export const vignetteDistrict = (age: number) => (CUVETTE ? `${base}district/cuvette-vignette.webp` : vignetteArchipel(age));
/**
 * Un district voisin (pillages) : une cuvette peinte, 4 âges selon sa profondeur et 4 variantes par âge (3 novembre 2026,
 * docs/prompts-voisins.md). La variante vient du nom du district : un même voisin garde toujours la même image.
 * `mini` : le médaillon carré de la carte des pillages (240 px) ; sinon le tableau entier (800 × 1200, décor du combat).
 */
export const vignetteArchipel = (age: number, graine = '', mini = false) => {
  let h = 0;
  for (const c of graine) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return `${base}district/voisin-${Math.max(1, Math.min(age, AGES_PEINTS))}-${(h % 4) + 1}${mini ? '-mini' : ''}.webp`;
};
/**
 * La Cuvette (2 novembre 2026) : un seul tableau peint pour tous les âges en attendant les paliers des bâtiments
 * (art/district/cuvette.webp, 800 × 1200, recadré de sources/art/district/cuvette2-batiments.webp).
 */
export const CUVETTE = true;
export function sceneDistrict(niveauNoyau: number, maintenant = new Date()): { age: 1 | 2 | 3 | 4; url: string; mer: string; horizon: number; video: string | null; nuit: boolean; houle?: string; merMasque?: string } {
  const age = visuel(niveauNoyau);
  const h = maintenant.getHours();
  if (CUVETTE) return { age, url: `${base}district/cuvette.webp`, mer: `${base}district/cuvette-large.webp`, horizon: 0, video: null, nuit: h < 7 || h >= 20, houle: [1, 2, 3].map((i) => `${base}district/cuvette-anim-${i}.webp`).join(' '), merMasque: `${base}district/cuvette-large-mer.webp` };
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
