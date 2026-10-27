import { tireur } from './rng';
import type { BatimentId, Effet, EnnemiDef, GesteDef, Lignee, ModuleDef, PorteurDef, Rarete, TypeGeste } from './types';

// ---------- Porteurs ----------
// Trois Porteurs nommés + trois recrues anonymes, une par lignée.
export const PORTEURS: PorteurDef[] = [
  { id: 'ilka', nom: 'Ilka', lignee: 'tech', pvMax: 38, nomme: true },
  { id: 'doran', nom: 'Doran', lignee: 'bio', pvMax: 46, nomme: true },
  { id: 'vela', nom: 'Véla', lignee: 'reso', pvMax: 31, nomme: true },
  { id: 'coursier', nom: 'Coursier', lignee: 'tech', pvMax: 32, nomme: false },
  { id: 'docker', nom: 'Docker', lignee: 'bio', pvMax: 42, nomme: false },
  { id: 'guetteur', nom: 'Guetteur', lignee: 'reso', pvMax: 30, nomme: false },
  // Les trois Porteurs recrutables de la Bible : ils arrivent au fil de l'acte I, Aurel avec l'acte II
  { id: 'sasha', nom: 'Sasha Ndiaro', lignee: 'tech', pvMax: 36, nomme: true,
    arrivee: { forge: 2, replique: 'Si ça a une vis, ça a une seconde chance.' } },
  { id: 'nuit', nom: 'Nuit', lignee: 'bio', pvMax: 36, nomme: true,
    arrivee: { strate: 3, replique: 'Le noir n’est pas vide. Il attend juste qu’on regarde mieux.' } },
  { id: 'aurel', nom: 'Aurel Orsève', lignee: 'reso', pvMax: 30, nomme: true,
    arrivee: { strate: 5, replique: 'Mon ombre a de meilleures manières que moi. C’est bien ça, le problème.' } },
  // Bible, 23 octobre 2026 (« Devenir Résonant, Géné ou Augmenté ») : une Née-de-mue, la cousine Refusée d'Aurel,
  // et le Résonant que la Clinique trouve lors d'un Accord ouvert, quand le district lui fait confiance
  { id: 'kessa', nom: 'Kessa', lignee: 'bio', pvMax: 40, nomme: true,
    arrivee: { strate: 4, replique: 'On n’a rien choisi. Mais on est les seuls à pouvoir dire ce que ça fait.' } },
  { id: 'liane', nom: 'Liane Orsève', lignee: 'tech', pvMax: 34, nomme: true,
    arrivee: { strate: 6, replique: 'Ils m’ont pris la mèche d’or. J’ai fait pousser autre chose.' } },
  { id: 'joss', nom: 'Joss', lignee: 'reso', pvMax: 29, nomme: true,
    arrivee: { accord: true, replique: 'J’ai passé des années à cacher l’or des autres. Le mien, je le laisse briller.' } },
];

export const NOMS_LIGNEE: Record<Lignee | 'neutre', { nom: string; court: string }> = {
  tech: { nom: 'Augmenté', court: 'AUGMENTÉ' },
  bio: { nom: 'Géné', court: 'GÉNÉ' },
  reso: { nom: 'Résonant', court: 'RÉSONANT' },
  neutre: { nom: 'Spécial', court: 'SPÉCIAL' },
};

// ---------- Les cartes ----------
// Décision du 22 octobre 2026 : la carte qu'on collectionne est celle qu'on joue. Les Gestes, cartes d'action à part, ont disparu.
// Une carte = une place dans le deck. On la confie à un Porteur de sa lignée (6 cartes au plus par Porteur, voir jeu.ts) ;
// le deck de combat réunit les cartes des 3 Porteurs de l'escouade, plus les 2 cartes du district.
// (Le tableau garde son nom historique, MODULES : dans la première version, les cartes étaient des Modules greffés.)
//
// Une carte existe dans les cinq métaux. Un exemplaire se note « carte@métal » (« jambes-ressort@or »). Le métal :
// - règle la force (METAL_FORCE, par rapport au métal d'origine de la carte, son champ `rarete`) ;
// - ouvre l'effet de la carte à partir du cuivre, renforcé en or et en nacre (METAL_RENFORT) ;
// - ouvre ses Fréquences : 1 en fer et en cuivre, 2 en argent et en or, 3 en nacre (METAL_FREQ).
//   Une carte posée prend d'elle-même la Fréquence qui prolonge la suite, et on peut en changer : aucun tirage au sort.
// Chaque lignée a ses effets de prédilection :
// Augmentés = Perçant, Surcharge, Élan (la machine calcule) ;
// Génés = Siphon, Vague, Rempart (le corps encaisse et se refait) ;
// Résonants = Désarmer, Fissure, Accord, Crescendo (l'empreinte lit et amplifie).

/** id, nom, lignée, métal d'origine, action, force (dans le métal d'origine), Fréquences (de la principale à la plus rare), effet, lourde */
const c = (id: string, nom: string, lignee: Lignee, rarete: Rarete, type: TypeGeste, v: number, f: number[], effet?: Effet, lourd = false): ModuleDef =>
  ({ id, nom, lignee, rarete, type, v, f, ...(effet ? { effet } : {}), ...(lourd ? { lourd: true } : {}) });
/** une carte du Legs : en nacre, deux effets */
const legs = (id: string, nom: string, lignee: Lignee, type: TypeGeste, v: number, f: number[], effet: Effet, effet2: Effet, lourd = false): ModuleDef =>
  ({ ...c(id, nom, lignee, 'nacre', type, v, f, effet, lourd), effet2, legs: true });

export const MODULES: ModuleDef[] = [
  // ---------- Les 15 cartes de base : 5 par Porteur nommé, qu'il porte dès le départ ----------
  c('ruee', 'Ruée', 'tech', 'fer', 'atk', 8, [3, 4, 2], { type: 'percant' }),
  c('bond', 'Bond', 'tech', 'fer', 'atk', 6, [4, 5, 3], { type: 'elan' }),
  c('esquive', 'Esquive', 'tech', 'fer', 'bouclier', 6, [5, 6, 4], { type: 'elan' }),
  c('tir', 'Tir', 'tech', 'fer', 'atk', 10, [6, 7, 5], { type: 'percant' }),
  c('tir-vif', 'Tir vif', 'tech', 'fer', 'atk', 5, [2, 1, 3], { type: 'flux', v: 1 }),
  c('morsure', 'Morsure', 'bio', 'fer', 'atk', 7, [2, 3, 1], { type: 'siphon', part: 0.5 }),
  c('carapace', 'Carapace', 'bio', 'fer', 'bouclier', 8, [1, 2, 3], { type: 'rempart', part: 0.5 }),
  c('regenerer', 'Régénérer', 'bio', 'fer', 'soin', 9, [4, 5, 3], { type: 'vague' }),
  c('charge', 'Charge', 'bio', 'fer', 'atk', 9, [5, 4, 6], { type: 'fissure', part: 0.25 }),
  c('grogner', 'Grogner', 'bio', 'fer', 'bouclier', 5, [3, 2, 4], { type: 'desarmer', part: 0.3 }),
  c('murmure', 'Murmure', 'reso', 'fer', 'bouclier', 7, [7, 6, 8], { type: 'desarmer', part: 0.3 }),
  c('echo', 'Écho', 'reso', 'fer', 'atk', 8, [9, 8, 7], { type: 'accord' }),
  c('souffle', 'Souffle', 'reso', 'fer', 'atk', 20, [8, 9, 7], { type: 'fissure', part: 0.25 }, true),
  c('apaiser', 'Apaiser', 'reso', 'fer', 'soin', 7, [6, 7, 5], { type: 'vague' }),
  c('eclat', 'Éclat', 'reso', 'fer', 'atk', 11, [8, 7, 9], { type: 'crescendo', part: 0.3 }),

  // ---------- Augmentés : Fréquences basses et moyennes ----------
  c('jambes-ressort', 'Jambes à ressort', 'tech', 'fer', 'atk', 11, [4, 5, 3], { type: 'elan' }),
  c('gant-arc', 'Gant à arc', 'tech', 'fer', 'atk', 13, [7, 6, 8], { type: 'flux', v: 1 }),
  c('oeil-relais', 'Œil-relais', 'tech', 'fer', 'atk', 14, [5, 3, 6], { type: 'percant' }),
  c('grappin-cable', 'Grappin à câble', 'tech', 'fer', 'bouclier', 8, [4, 5, 3], { type: 'elan' }),
  c('coeur-turbine', 'Cœur-turbine', 'tech', 'cuivre', 'atk', 15, [7, 6, 8], { type: 'flux', v: 1 }),
  c('oeil-brouilleur', 'Œil-brouilleur', 'tech', 'cuivre', 'atk', 11, [6, 7, 5], { type: 'desarmer', part: 0.3 }),
  c('bras-grue', 'Bras-grue', 'tech', 'argent', 'atk', 36, [8, 6, 4], { type: 'percant' }, true),
  c('dorsale', 'Dorsale renforcée', 'tech', 'argent', 'bouclier', 20, [3, 4, 7], { type: 'elan' }),
  c('lames-orbitales', 'Lames orbitales', 'tech', 'or', 'atk', 26, [9, 3, 2], { type: 'crescendo', part: 0.25 }, true),
  c('coeur-reprise', 'Cœur de reprise', 'tech', 'or', 'atk', 28, [6, 2, 5], { type: 'percant' }),

  // ---------- Génés : Fréquences basses ----------
  c('glande-ambre', 'Glande d’ambre', 'bio', 'fer', 'soin', 7, [3, 2, 4], { type: 'vague' }),
  c('crocs-fossiles', 'Crocs fossiles', 'bio', 'fer', 'atk', 15, [1, 3, 2], { type: 'siphon', part: 0.6 }),
  c('cuir-recif', 'Cuir de récif', 'bio', 'fer', 'bouclier', 11, [4, 5, 3], { type: 'rempart', part: 0.5 }),
  c('yeux-nocturnes', 'Yeux nocturnes', 'bio', 'fer', 'atk', 14, [3, 4, 2], { type: 'fissure', part: 0.25 }),
  c('poumons-abysse', 'Poumons d’abysse', 'bio', 'cuivre', 'bouclier', 15, [2, 4, 3], { type: 'rempart', part: 0.5 }),
  c('branchies', 'Branchies des Fondations', 'bio', 'cuivre', 'bouclier', 13, [2, 1, 3], { type: 'rempart', part: 0.5 }),
  c('carapace-mere', 'Carapace-mère', 'bio', 'argent', 'bouclier', 14, [5, 6, 1], { type: 'rempart', part: 0.75 }),
  c('sang-ambre', 'Sang d’ambre', 'bio', 'argent', 'soin', 8, [3, 2, 5], { type: 'vague' }),
  c('coeur-meute', 'Cœur de meute', 'bio', 'or', 'atk', 11, [5, 4, 3], { type: 'siphon', part: 0.5 }),
  c('mue-totale', 'Mue totale', 'bio', 'or', 'soin', 16, [1, 2, 4], { type: 'vague' }),

  // ---------- Résonants : Fréquences hautes ----------
  c('eclat-chant', 'Éclat qui chante', 'reso', 'fer', 'atk', 13, [8, 7, 9], { type: 'crescendo', part: 0.3 }),
  c('miroir-brume', 'Miroir de brume', 'reso', 'fer', 'bouclier', 10, [8, 9, 7], { type: 'desarmer', part: 0.3 }),
  c('encre-ancienne', 'Encre ancienne', 'reso', 'fer', 'atk', 11, [6, 7, 5], { type: 'fissure', part: 0.25 }),
  c('meche-or', 'Mèche d’or', 'reso', 'fer', 'bouclier', 11, [7, 8, 6], { type: 'desarmer', part: 0.3 }),
  c('plume-givre', 'Plume de givre', 'reso', 'cuivre', 'atk', 11, [9, 8, 7], { type: 'desarmer', part: 0.4 }),
  c('ombre-serpent', 'Ombre de serpent', 'reso', 'cuivre', 'atk', 14, [9, 6, 8], { type: 'fissure', part: 0.3 }),
  c('ombre-ailee', 'Ombre ailée', 'reso', 'argent', 'atk', 26, [9, 7, 8], { type: 'fissure', part: 0.4 }, true),
  c('pressentiment', 'Pressentiment', 'reso', 'argent', 'bouclier', 12, [7, 8, 6], { type: 'desarmer', part: 0.4 }),
  c('chant-abysses', 'Chant des abysses', 'reso', 'or', 'atk', 26, [7, 8, 9], { type: 'accord' }),
  c('souffle-wyrm', 'Souffle du wyrm', 'reso', 'or', 'atk', 22, [9, 8, 7], { type: 'crescendo', part: 0.3 }),

  // ---------- Les voies, étape 1 (27 octobre 2026, docs/familles-de-decks.md) : une voie par lignée ----------
  // Le Moteur (Liane) : remplir le Flux, puis tout vider d'un coup
  c('bobine-recuperation', 'Bobine de récupération', 'tech', 'fer', 'bouclier', 9, [3, 2, 4], { type: 'flux', v: 1 }),
  c('condensateur', 'Condensateur', 'tech', 'cuivre', 'atk', 12, [5, 4, 6], { type: 'flux', v: 1 }),
  c('decharge-arc', 'Décharge d’arc', 'tech', 'cuivre', 'atk', 16, [6, 7, 5], { type: 'decharge', part: 0.5 }),
  c('eclair-captif', 'Éclair captif', 'tech', 'argent', 'atk', 16, [4, 5, 7], { type: 'decharge', part: 0.55 }),
  c('noyau-instable', 'Noyau instable', 'tech', 'or', 'atk', 38, [7, 6, 2], { type: 'decharge', part: 0.65 }, true),
  // La Carapace (Doran) : parer, puis frapper avec tout le bouclier accumulé
  c('coup-epaule', 'Coup d’épaule', 'bio', 'fer', 'bouclier', 10, [3, 2, 4], { type: 'riposte', part: 0.5 }),
  c('queue-massue', 'Queue-massue', 'bio', 'cuivre', 'bouclier', 11, [4, 5, 3], { type: 'riposte', part: 0.6 }),
  c('belier-os', 'Bélier d’os', 'bio', 'argent', 'bouclier', 22, [5, 4, 1], { type: 'riposte', part: 0.85 }, true),
  c('retour-maree', 'Retour de marée', 'bio', 'or', 'bouclier', 18, [2, 3, 5], { type: 'riposte', part: 0.65 }),
  // Le Chœur (Joss) : répéter une même Fréquence (Écho)
  c('diapason-cristal', 'Diapason de cristal', 'reso', 'fer', 'bouclier', 9, [9, 8, 7], { type: 'diapason' }),
  c('voix-basse', 'Voix basse', 'reso', 'fer', 'atk', 9, [9, 8, 7], { type: 'unisson', part: 1.2 }),
  c('chorale-ombres', 'Chorale des ombres', 'reso', 'cuivre', 'atk', 10, [8, 9, 7], { type: 'unisson', part: 1.3 }),
  c('cloche-abysses', 'Cloche des abysses', 'reso', 'argent', 'bouclier', 15, [9, 7, 8], { type: 'diapason' }),
  c('grand-unisson', 'Grand unisson', 'reso', 'or', 'atk', 18, [9, 8, 6], { type: 'unisson', part: 1.4 }),
  // ---------- Le Legs du district (27 octobre 2026, docs/legs-du-district.md) ----------
  // Dix vierges cachées par l'ancienne directrice ; chaque joueur n'en reçoit qu'une (lettre de la directrice, LETTRE_LEGS).
  // Exclusives (jamais trouvées ailleurs : MODULES_TIRABLES), en nacre seulement, les seules à deux effets. La nacre renforce
  // leurs parts (×1,5) comme pour toute carte : les parts ci-dessous sont avant ce renfort. Une Fréquence libre est le premier effet.
  legs('foulee-directrice', 'Foulée de la directrice', 'tech', 'atk', 16, [4, 3, 5], { type: 'elan' }, { type: 'crescendo', part: 0.2 }),
  legs('bras-fonderie', 'Bras de la Fonderie', 'tech', 'atk', 44, [5, 6, 4], { type: 'percant' }, { type: 'elan' }, true),
  legs('coeur-glaciere', 'Cœur de la Glacière', 'tech', 'atk', 20, [6, 5, 7], { type: 'decharge', part: 0.5 }, { type: 'flux', v: 1 }),
  legs('carapace-fondations', 'Carapace des Fondations', 'bio', 'bouclier', 24, [2, 3, 1], { type: 'rempart', part: 0.5 }, { type: 'riposte', part: 0.4 }),
  legs('oeil-grande-nuit', 'Œil de la Grande Nuit', 'bio', 'atk', 18, [3, 2, 4], { type: 'fissure', part: 0.2 }, { type: 'siphon', part: 0.35 }),
  legs('premiere-mue', 'Première mue', 'bio', 'soin', 14, [1, 2, 3], { type: 'vague' }, { type: 'rempart', part: 0.35 }),
  legs('lanterne-lecture', 'Lanterne de la première Lecture', 'reso', 'atk', 20, [8, 7, 9], { type: 'accord' }, { type: 'desarmer', part: 0.3 }),
  legs('sceau-orseve', 'Sceau volé aux Orsève', 'reso', 'atk', 18, [7, 6, 8], { type: 'desarmer', part: 0.3 }, { type: 'fissure', part: 0.2 }),
  legs('voix-quartier', 'Voix du quartier', 'reso', 'atk', 14, [9, 8, 7], { type: 'diapason' }, { type: 'unisson', part: 0.7 }),
];

/** Les cartes qu'on peut trouver, acheter ou fabriquer : toutes, sauf celles du Legs */
export const MODULES_TIRABLES = MODULES.filter((m) => !m.legs);

/**
 * Les voies (docs/familles-de-decks.md) : chaque Porteur nommé incarne une façon de gagner. Les cartes restent liées à la lignée
 * (n'importe quel Porteur de la lignée peut les porter) ; le Porteur de la voie prête son portrait aux cartes encore sans illustration.
 */
export const VOIES: { id: string; nom: string; porteur: string; cartes: string[] }[] = [
  { id: 'moteur', nom: 'Le Moteur', porteur: 'liane', cartes: ['bobine-recuperation', 'condensateur', 'decharge-arc', 'eclair-captif', 'noyau-instable'] },
  { id: 'carapace', nom: 'La Carapace', porteur: 'doran', cartes: ['coup-epaule', 'queue-massue', 'belier-os', 'retour-maree'] },
  { id: 'choeur', nom: 'Le Chœur', porteur: 'joss', cartes: ['diapason-cristal', 'voix-basse', 'chorale-ombres', 'cloche-abysses', 'grand-unisson'] },
];
/** La voie d'une carte (« voix-basse@or » → le Chœur), s'il y en a une */
export const voieDe = (cle: string) => VOIES.find((v) => v.cartes.includes(cle.split('@')[0]!));

/** Les 15 cartes de base (celles que les Porteurs nommés portent au départ, en plus de leur carte de départ) */
export const CARTES_DE_BASE = MODULES.slice(0, 15).map((m) => m.id);

// ---------- Les métaux ----------
// Décision du 21 octobre 2026 : le métal est fixé quand on trouve l'exemplaire, il ne change jamais (pas de montée de métal).
// Décision du 22 octobre 2026 : le métal ouvre aussi des Fréquences, pour se glisser plus facilement dans une suite.
export const METAL_FORCE: Record<Rarete, number> = { fer: 1, cuivre: 1.18, argent: 1.32, or: 1.46, nacre: 1.6 };
export const METAL_FREQ: Record<Rarete, number> = { fer: 1, cuivre: 1, argent: 2, or: 2, nacre: 3 };
/** 0 : pas d'effet ; 1 : l'effet de la carte ; au-delà : l'effet renforcé (parts ×1,25 en or, ×1,5 en nacre, Surcharge +1 en nacre) */
export const METAL_RENFORT: Record<Rarete, number> = { fer: 0, cuivre: 1, argent: 1, or: 1.25, nacre: 1.5 };

function renforcer(e: Effet, k: number): Effet {
  // la Décharge ne se renforce pas : en or et en nacre, les Fréquences en plus font déjà plus de Résonances, donc plus de Flux à vider
  if (k <= 1 || e.type === 'decharge') return e;
  if (e.type === 'flux') return { ...e, v: e.v + (k >= 1.5 ? 1 : 0) };
  // un plafond pour les parts qui retirent ou gardent (90 %) et pour le Siphon (100 %) ; les bonus de force des voies n'en ont pas
  const plafond = e.type === 'siphon' ? 1 : e.type === 'riposte' || e.type === 'unisson' ? Infinity : 0.9;
  if ('part' in e) return { ...e, part: Math.min(plafond, Math.round(e.part * k * 100) / 100) };
  return e;
}
const METAUX: Rarete[] = ['fer', 'cuivre', 'argent', 'or', 'nacre'];

/** L'identifiant d'un exemplaire : une carte dans un métal */
export const carteId = (moduleId: string, metal: Rarete) => `${moduleId}@${metal}`;
/** La carte de base d'un exemplaire (« jambes-ressort@or » → « jambes-ressort ») */
export const moduleDe = (cle: string) => cle.split('@')[0]!;

/** Les cartes que chaque Porteur nommé porte au départ, en fer : ses 5 cartes de base et sa carte de départ */
export const DEPART_PORTEURS: Record<string, string[]> = {
  ilka: ['ruee', 'bond', 'esquive', 'tir', 'tir-vif', 'jambes-ressort'],
  doran: ['morsure', 'carapace', 'regenerer', 'charge', 'grogner', 'glande-ambre'],
  vela: ['murmure', 'echo', 'souffle', 'apaiser', 'eclat', 'eclat-chant'],
};
/** La collection de départ : les 18 cartes portées par Ilka, Doran et Véla */
export const COLLECTION_DEPART = Object.values(DEPART_PORTEURS).flat().map((id) => carteId(id, 'fer'));
/** La carte que laisse la chambre scellée : le deuxième objectif apprend à la confier */
export const CARTE_CHAMBRE = carteId('oeil-relais', 'fer');

// ---------- Le paquetage du district ----------
// Fourni à chaque escouade qui descend, joué par personne en particulier (il ne disparaît pas quand un Porteur tombe).
// Pas de métal : on ne le trouve pas, on ne le fabrique pas, il ne monte pas de niveau (25 octobre 2026).
const special = (id: string, nom: string, f: number, type: TypeGeste, v: number, effet?: Effet): GesteDef =>
  ({ id, carte: id, porteur: null, nom, f, type, v, ...(effet ? { effet } : {}) });
export const GESTES_SPECIAUX: GesteDef[] = [special('stimulant', 'Stimulant', 1, 'soin', 5, { type: 'vague' }), special('repli', 'Repli', 9, 'bouclier', 10)];
/**
 * La Clé du Legs (27 octobre 2026) : la dixième vierge, pour le directeur qui répond « tout le monde à la fois » à la lettre.
 * Elle rejoint le paquetage (jouée par personne, elle reste quand un Porteur tombe) dès qu'un Porteur de l'escouade a le niveau
 * de la nacre, et grandit avec le plus avancé d'entre eux (comme une carte du Legs : niveaux 8, 9 et 10, +5 % par niveau).
 */
export const CLE_LEGS: GesteDef = special('cle-legs', 'Clé du Legs', 1, 'bouclier', 18, { type: 'accord' });
CLE_LEGS.effet2 = { type: 'rempart', part: 0.75 };

/** D'où vient chaque carte du paquetage : le bâtiment qui la fournit et ce qu'elle est */
export const ORIGINE_PAQUETAGE: Record<string, { batiment: string; texte: string }> = {
  stimulant: { batiment: 'Clinique', texte: 'Une seringue de lumière verte, préparée par la Clinique pour chaque escouade.' },
  repli: { batiment: 'Tour du Noyau', texte: 'Une balise de la Tour du Noyau : une porte blindée s’ouvre, l’escouade s’y abrite.' },
  'cle-legs': { batiment: 'Legs du district', texte: 'La dixième vierge de l’ancienne directrice : une clé de nacre qui ouvre toutes les portes, et les tient fermées derrière l’escouade.' },
};

// ---------- Bâtiments ----------
interface BatimentDef {
  id: BatimentId;
  nom: string;
  role: string;
  /** lignée qui y travaille le mieux (+50 %) */
  affinite: Lignee | null;
  /** coût pour passer au niveau n+1 (index = niveau actuel) */
  couts: { energie: number; composants: number; eclats?: number }[];
  niveauMax: number;
}

export const BATIMENTS: BatimentDef[] = [
  { id: 'noyau', nom: 'Tour du Noyau', role: 'Le cœur du district. Son niveau limite celui des autres bâtiments, le stockage et les creuseurs qu’il loge pour percer les Strates. Un Porteur peut s’y entraîner.', affinite: null,
    couts: [{ energie: 0, composants: 0 }, { energie: 120, composants: 15 }, { energie: 300, composants: 40 }, { energie: 650, composants: 80, eclats: 3 }, { energie: 1300, composants: 160, eclats: 8 }], niveauMax: 5 },
  { id: 'generateur', nom: 'Générateur', role: 'Produit de l’énergie en continu, même quand tu ne joues pas.', affinite: 'tech',
    couts: [{ energie: 0, composants: 0 }, { energie: 80, composants: 10 }, { energie: 200, composants: 25 }, { energie: 450, composants: 55, eclats: 2 }, { energie: 900, composants: 110, eclats: 5 }], niveauMax: 5 },
  { id: 'forge', nom: 'Forge', role: 'Refabrique un exemplaire d’une carte déjà trouvée : un doublon de plus. Il faut un Porteur au travail.', affinite: 'tech',
    couts: [{ energie: 0, composants: 0 }, { energie: 100, composants: 12 }, { energie: 240, composants: 30 }, { energie: 500, composants: 60, eclats: 2 }, { energie: 1000, composants: 120, eclats: 5 }], niveauMax: 5 },
  { id: 'clinique', nom: 'Clinique', role: 'Soigne l’Usure des Porteurs présents au district, même au travail.', affinite: 'bio',
    couts: [{ energie: 0, composants: 0 }, { energie: 90, composants: 10 }, { energie: 220, composants: 28 }, { energie: 480, composants: 58, eclats: 2 }, { energie: 950, composants: 115, eclats: 5 }], niveauMax: 5 },
  // 23 octobre 2026 : le « acheter » de « forger, acheter ou combattre ». Il commence au niveau 0 : on le construit.
  { id: 'comptoir', nom: 'Comptoir', role: 'Les fouilleurs du quartier y revendent chaque jour quelques cartes trouvées dans les Strates. Prix fixes : tu vois toujours ce que tu achètes.', affinite: null,
    couts: [{ energie: 150, composants: 20 }, { energie: 220, composants: 30 }, { energie: 480, composants: 60, eclats: 2 }, { energie: 950, composants: 115, eclats: 5 }, { energie: 1500, composants: 180, eclats: 8 }], niveauMax: 5 },
];

// ---------- Ennemis ----------
export const ENNEMIS: EnnemiDef[] = [
  {
    id: 'remanent-faible', nom: 'Rémanent affaibli', lignee: 'reso', tag: 'GARDIEN DE LA CHAMBRE', pvMax: 75,
    motif: [
      { type: 'atk', nom: 'Griffe', v: 4, cible: 'hasard' },
      { type: 'atk', nom: 'Griffe', v: 5, cible: 'faible' },
      { type: 'atk', nom: 'Entaille', v: 13, cible: 'doran' },
      { type: 'atk', nom: 'Griffe', v: 5, cible: 'hasard' },
    ],
  },
  {
    id: 'remanent', nom: 'Rémanent', lignee: 'reso', tag: 'ANCIEN', pvMax: 72,
    traits: [{ type: 'evanescent', part: 0.25 }],
    motif: [
      { type: 'atk', nom: 'Griffe', v: 8, cible: 'hasard' },
      { type: 'atk', nom: 'Griffe', v: 10, cible: 'faible' },
      { type: 'bouclier', v: 8 },
      { type: 'atk', nom: 'Entaille', v: 14, cible: 'hasard' },
    ],
  },
  {
    id: 'vigie', nom: 'Vigie de dépôt', lignee: 'tech', tag: 'ANCIENNE MACHINE', pvMax: 95,
    traits: [{ type: 'blinde', v: 2 }, { type: 'aspire', v: 1 }],
    motif: [
      { type: 'atk', nom: 'Rayon', v: 10, cible: 'reso' },
      { type: 'atk', nom: 'Balayage', v: 5, zone: true },
      { type: 'atk', nom: 'Rayon', v: 11, cible: 'reso' },
      { type: 'bouclier', v: 10 },
    ],
  },
  {
    id: 'confluence', nom: 'Confluence', lignee: 'bio', tag: 'BOSS · EMPREINTES MÊLÉES', pvMax: 165,
    traits: [{ type: 'regeneration', part: 0.015 }],
    phase: { seuil: 0.5, nom: 'Crue', texte: 'Les empreintes mêlées débordent : la Confluence appelle ce qui rampe dans les piliers.', renforts: ['rampeur'],
      motif: [{ type: 'atk', nom: 'Crue', v: 9, zone: true }, { type: 'atk', nom: 'Ressac', v: 13, cible: 'faible' }, { type: 'soin', nom: 'Refluer', v: 12 }, { type: 'atk', nom: 'Fracture', v: 11, cible: 'hasard' }] },
    motif: [
      { type: 'atk', nom: 'Ressac', v: 12, cible: 'hasard' },
      { type: 'atk', nom: 'Débordement', v: 7, zone: true },
      { type: 'boost' },
      { type: 'atk', nom: 'Fracture', v: 9, cible: 'faible' },
      { type: 'bouclier', v: 12 },
    ],
  },
  // ---------- Les salles closes (−4 à −6) ----------
  {
    id: 'brigadier', nom: 'Brigadier du Serment', lignee: 'reso', tag: 'BRIGADES DU SERMENT DE VEYR', pvMax: 85,
    traits: [{ type: 'furie' }],
    motif: [
      { type: 'dissonance', nom: 'Sommation' },
      { type: 'atk', nom: 'Matraque', v: 11, cible: 'hasard' },
      { type: 'bouclier', v: 12 },
      { type: 'atk', nom: 'Charge', v: 7, zone: true },
    ],
  },
  {
    id: 'echo-veilleur', nom: 'Écho de veilleur', lignee: 'reso', tag: 'ÉCHO', pvMax: 78,
    traits: [{ type: 'evanescent', part: 0.25 }],
    motif: [
      { type: 'atk', nom: 'Griffe d’ombre', v: 12, cible: 'faible' },
      { type: 'dissonance', nom: 'Murmure' },
      { type: 'atk', nom: 'Hurlement', v: 7, zone: true },
      { type: 'soin', nom: 'Reflux', v: 10 },
    ],
  },
  {
    id: 'sentinelle-verre', nom: 'Sentinelle de verre', lignee: 'tech', tag: 'ANCIENNE MACHINE', pvMax: 100,
    traits: [{ type: 'epines', part: 0.1 }],
    motif: [
      { type: 'bouclier', v: 15 },
      { type: 'atk', nom: 'Réfraction', v: 11, cible: 'bio' },
      { type: 'boost' },
      { type: 'atk', nom: 'Rayon brisé', v: 11, cible: 'hasard' },
    ],
  },
  {
    id: 'gardien-registres', nom: 'Gardien des registres', lignee: 'reso', tag: 'BOSS · LES SALLES CLOSES', pvMax: 175,
    traits: [{ type: 'blinde', v: 3 }],
    phase: { seuil: 0.5, nom: 'Registre ouvert', texte: 'Le Gardien ouvre son registre et appelle un brigadier à la barre.', renforts: ['brigadier'],
      motif: [{ type: 'atk', nom: 'Rature', v: 14, cible: 'faible' }, { type: 'dissonance', nom: 'Sceau' }, { type: 'atk', nom: 'Liste des noms', v: 9, zone: true }, { type: 'boost' }] },
    motif: [
      { type: 'dissonance', nom: 'Sceau' },
      { type: 'atk', nom: 'Effacement', v: 13, cible: 'hasard' },
      { type: 'atk', nom: 'Liste des noms', v: 8, zone: true },
      { type: 'boost' },
      { type: 'atk', nom: 'Effacement', v: 12, cible: 'faible' },
      { type: 'bouclier', v: 14 },
    ],
  },
  // ---------- Les mémoires contradictoires (−7 à −9) ----------
  {
    id: 'double', nom: 'Double', lignee: 'reso', tag: 'ÉCHO DÉDOUBLÉ', pvMax: 90,
    traits: [{ type: 'essaim', part: 0.35 }],
    motif: [
      { type: 'atk', nom: 'Premier souvenir', v: 12, cible: 'hasard' },
      { type: 'atk', nom: 'Second souvenir', v: 12, cible: 'hasard' },
      { type: 'dissonance', nom: 'Contradiction' },
      { type: 'soin', nom: 'Se rassembler', v: 12 },
    ],
  },
  {
    id: 'essaim-ambre', nom: 'Essaim d’ambre', lignee: 'bio', tag: 'FAUNE DES STRATES', pvMax: 80,
    traits: [{ type: 'essaim', part: 0.4 }],
    motif: [
      { type: 'atk', nom: 'Piqûres', v: 6, zone: true },
      { type: 'atk', nom: 'Piqûres', v: 6, zone: true },
      { type: 'bouclier', v: 10 },
      { type: 'boost' },
    ],
  },
  {
    id: 'automate-graveur', nom: 'Automate graveur', lignee: 'tech', tag: 'ANCIENNE MACHINE', pvMax: 110,
    traits: [{ type: 'blinde', v: 3 }],
    motif: [
      { type: 'atk', nom: 'Burin', v: 13, cible: 'reso' },
      { type: 'bouclier', v: 12 },
      { type: 'atk', nom: 'Burin', v: 12, cible: 'faible' },
      { type: 'soin', nom: 'Polissage', v: 10 },
    ],
  },
  {
    id: 'tisseuse', nom: 'Tisseuse de souvenirs', lignee: 'bio', tag: 'BOSS · MÉMOIRES MÊLÉES', pvMax: 190,
    traits: [{ type: 'epines', part: 0.08 }],
    phase: { seuil: 0.5, nom: 'Trame rompue', texte: 'La Tisseuse déchire sa trame : un essaim d’ambre s’en échappe.', renforts: ['essaim-ambre'],
      motif: [{ type: 'atk', nom: 'Fil tranchant', v: 13, cible: 'faible' }, { type: 'atk', nom: 'Trame', v: 9, zone: true }, { type: 'soin', nom: 'Retisser', v: 12 }, { type: 'boost' }] },
    motif: [
      { type: 'atk', nom: 'Fil', v: 11, cible: 'faible' },
      { type: 'atk', nom: 'Trame', v: 8, zone: true },
      { type: 'dissonance', nom: 'Nœud' },
      { type: 'soin', nom: 'Retisser', v: 14 },
      { type: 'boost' },
      { type: 'atk', nom: 'Fil', v: 12, cible: 'hasard' },
    ],
  },
  // ---------- Le fond (−10 et plus) ----------
  {
    id: 'premier-porteur', nom: 'Le Premier Porteur', lignee: 'reso', tag: 'BOSS · CEUX D’AVANT', pvMax: 185,
    traits: [{ type: 'evanescent', part: 0.3 }],
    phase: { seuil: 0.5, nom: 'Ceux d’avant', texte: 'Le Premier Porteur rappelle son double : ceux d’avant ne se battent jamais seuls.', renforts: ['double'],
      motif: [{ type: 'atk', nom: 'Marée ancienne', v: 10, zone: true }, { type: 'dissonance', nom: 'Dernière mise en garde' }, { type: 'atk', nom: 'Souvenir de feu', v: 15, cible: 'hasard' }, { type: 'boost' }, { type: 'atk', nom: 'Dernier mot', v: 14, cible: 'faible' }] },
    motif: [
      { type: 'dissonance', nom: 'Mise en garde' },
      { type: 'atk', nom: 'Souvenir de feu', v: 13, cible: 'hasard' },
      { type: 'atk', nom: 'Marée ancienne', v: 8, zone: true },
      { type: 'soin', nom: 'Se souvenir', v: 15 },
      { type: 'boost' },
      { type: 'atk', nom: 'Dernier mot', v: 12, cible: 'faible' },
      { type: 'bouclier', v: 16 },
    ],
  },
  // ---------- Les Fondations (−1 à −3), en plus du Rémanent et de la Vigie ----------
  {
    id: 'rampeur', nom: 'Rampeur des piliers', lignee: 'bio', tag: 'FAUNE DES FONDATIONS', pvMax: 80,
    traits: [{ type: 'regeneration', part: 0.04 }],
    motif: [
      { type: 'atk', nom: 'Morsure', v: 9, cible: 'faible' },
      { type: 'bouclier', v: 9 },
      { type: 'atk', nom: 'Constriction', v: 5, zone: true },
      { type: 'atk', nom: 'Morsure', v: 10, cible: 'hasard' },
    ],
  },
  {
    // Bible, 23 octobre 2026 : un Résonant greffé sans Clinique ni Lecture, une brisure de marché noir (un « doré pâle »)
    id: 'sauvage', nom: 'Sauvage', lignee: 'reso', tag: 'GREFFÉ SANS CLINIQUE', pvMax: 66,
    traits: [{ type: 'vengeur' }],
    motif: [
      { type: 'atk', nom: 'Penchant mal lu', v: 10, cible: 'hasard' },
      { type: 'bouclier', v: 9 },
      { type: 'atk', nom: 'Accès', v: 12, cible: 'faible' },
      { type: 'atk', nom: 'Ombre qui tremble', v: 5, zone: true },
    ],
  },
  {
    id: 'pilleur', nom: 'Pilleur de Strates', lignee: 'tech', tag: 'FOUILLEUR SANS LICENCE', pvMax: 70,
    traits: [{ type: 'vengeur' }],
    motif: [
      { type: 'atk', nom: 'Pied-de-biche', v: 9, cible: 'hasard' },
      { type: 'bouclier', v: 11 },
      { type: 'atk', nom: 'Coup bas', v: 11, cible: 'faible' },
      { type: 'soin', nom: 'Stimulant', v: 8 },
    ],
  },
  // ---------- Les gardes d'un archipel pillé (pillage.ts) : un par Porteur de la garnison, joués par le district attaqué ----------
  {
    id: 'garde-tech', nom: 'Garde augmenté', lignee: 'tech', tag: 'GARNISON', pvMax: 72,
    motif: [
      { type: 'atk', nom: 'Salve', v: 10, cible: 'hasard' },
      { type: 'bouclier', v: 9 },
      { type: 'atk', nom: 'Frappe ciblée', v: 12, cible: 'faible' },
      { type: 'atk', nom: 'Balayage', v: 6, zone: true },
    ],
  },
  {
    id: 'garde-bio', nom: 'Garde géné', lignee: 'bio', tag: 'GARNISON', pvMax: 80,
    motif: [
      { type: 'atk', nom: 'Morsure', v: 9, cible: 'faible' },
      { type: 'bouclier', v: 11 },
      { type: 'soin', nom: 'Sève', v: 9 },
      { type: 'atk', nom: 'Charge', v: 11, cible: 'hasard' },
    ],
  },
  {
    id: 'garde-reso', nom: 'Garde résonant', lignee: 'reso', tag: 'GARNISON', pvMax: 64,
    motif: [
      { type: 'dissonance', nom: 'Contre-chant' },
      { type: 'atk', nom: 'Onde', v: 11, cible: 'hasard' },
      { type: 'atk', nom: 'Écho', v: 6, zone: true },
      { type: 'bouclier', v: 9 },
    ],
  },
];

// ---------- Les traits des ennemis (décision du 22 octobre 2026) : leur nom et ce qu'ils font, pour l'écran ----------
export function texteTrait(t: import('./types').Trait): { nom: string; texte: string } {
  switch (t.type) {
    case 'blinde': return { nom: 'Blindé', texte: `Chaque coup perd ${t.v} dégâts (un peu plus en profondeur). Perçant passe outre. Sa Fêlure ne retire qu’un quart de son intention.` };
    case 'regeneration': return { nom: 'Régénération', texte: `Regagne ${Math.round(t.part * 100)} % de ses PV à la fin de son tour.` };
    case 'epines': return { nom: 'Épines', texte: `Renvoie ${Math.round(t.part * 100)} % des dégâts au Porteur qui frappe (sans le mettre à terre).` };
    case 'evanescent': return { nom: 'Évanescent', texte: `Hors Résonance, il ne prend que ${Math.round((1 - t.part) * 100)} % des coups : fais des suites. Sa Fêlure reste cachée.` };
    case 'essaim': return { nom: 'Essaim', texte: 'Quand il tombe, un rejeton plus petit surgit (une fois).' };
    case 'vengeur': return { nom: 'Vengeur', texte: 'Quand un allié tombe, sa prochaine attaque est doublée.' };
    case 'furie': return { nom: 'Furie', texte: 'Sous la moitié de ses PV, ses attaques font +30 %.' };
    case 'aspire': return { nom: 'Aspiration', texte: `Quand il frappe, il aspire ${t.v} Flux de l’escouade : ne garde pas ton Flux trop longtemps.` };
  }
}

// ---------- Les conditions de salle (décision du 22 octobre 2026 : varier les combats) ----------
// Tirées sur la carte de la Strate, visibles avant d'entrer : elles changent la façon de jouer la salle, pas seulement les chiffres.
interface ConditionDef { id: string; nom: string; texte: string }
export const CONDITIONS: Record<string, ConditionDef> = {
  inondee: { id: 'inondee', nom: 'Salle inondée', texte: 'L’eau porte les Génés : leurs cartes font +20 %.' },
  courants: { id: 'courants', nom: 'Câbles à nu', texte: 'Le courant court partout : les cartes des Augmentés font +20 %.' },
  chant: { id: 'chant', nom: 'Pierre qui chante', texte: 'La roche résonne : les cartes des Résonants font +20 %.' },
  echo: { id: 'echo', nom: 'Écho ancien', texte: 'Une suite de 4 résonne comme une suite de 5.' },
  sanctuaire: { id: 'sanctuaire', nom: 'Source tiède', texte: 'Les soins de l’escouade font +30 %.' },
  eboulis: { id: 'eboulis', nom: 'Éboulis', texte: 'À chaque tour ennemi, des pierres tombent sur tout le monde (escouade et ennemis), sans jamais mettre personne à terre.' },
  brouillard: { id: 'brouillard', nom: 'Brouillard', texte: 'L’intention de l’ennemi ne se lit qu’une fois la première carte posée.' },
};
/** La lignée que favorise une condition (+20 % à ses cartes) */
export const FAVEUR_CONDITION: Record<string, Lignee> = { inondee: 'bio', courants: 'tech', chant: 'reso' };

/**
 * Les zones des Strates : plus on descend, plus c'est ancien (Bible du lore).
 * Une expédition = deux combats tirés dans la zone, puis son gardien.
 */
export const ZONES: { nom: string; jusqua: number; ennemis: string[]; boss: string }[] = [
  { nom: 'Les Fondations', jusqua: 3, ennemis: ['remanent', 'vigie', 'rampeur', 'pilleur', 'sauvage'], boss: 'confluence' },
  { nom: 'Les salles closes', jusqua: 6, ennemis: ['brigadier', 'echo-veilleur', 'sentinelle-verre', 'remanent'], boss: 'gardien-registres' },
  { nom: 'Les mémoires contradictoires', jusqua: 9, ennemis: ['double', 'essaim-ambre', 'automate-graveur', 'echo-veilleur'], boss: 'tisseuse' },
  { nom: 'Le fond', jusqua: Infinity, ennemis: ['double', 'automate-graveur', 'sentinelle-verre', 'echo-veilleur'], boss: 'premier-porteur' },
];
export const zoneDe = (strate: number) => ZONES.find((z) => strate <= z.jusqua)!;

/**
 * La séquence d'une expédition : deux ennemis différents de la zone, puis son gardien (déterministe selon `rng`).
 * Le choix de l'acte I la change : les Brigades alliées (Orsève) disparaissent, les Brigades hostiles (district seul) s'imposent.
 */
export function sequenceStrate(strate: number, rng: number, garde?: string): string[] {
  const z = zoneDe(strate);
  const etat = { rng: (rng ^ 0x5bd1e995) >>> 0 };
  let pool = z.ennemis;
  if (garde === 'orseve') pool = pool.filter((id) => id !== 'brigadier');
  let [a, b] = tireur(etat).melanger(pool);
  if (garde === 'district' && pool.includes('brigadier') && a !== 'brigadier' && b !== 'brigadier') b = 'brigadier';
  return [a!, b!, z.boss];
}


export const porteurDef = (id: string): PorteurDef => {
  const p = PORTEURS.find((x) => x.id === id);
  if (!p) throw new Error('Porteur inconnu : ' + id);
  return p;
};

export const ennemiDef = (id: string): EnnemiDef => {
  const e = ENNEMIS.find((x) => x.id === id);
  if (!e) throw new Error('Ennemi inconnu : ' + id);
  return e;
};

export const batimentDef = (id: BatimentId): BatimentDef => BATIMENTS.find((b) => b.id === id)!;
const declinaisons = new Map<string, ModuleDef>();

/**
 * Une carte (« jambes-ressort ») : sa définition complète, toutes Fréquences et effet compris, qui ne se joue jamais telle quelle ;
 * ou un exemplaire dans un métal (« jambes-ressort@or »), le seul qu'on possède et qu'on joue.
 */
export const moduleDef = (cle: string): ModuleDef => {
  const deja = declinaisons.get(cle);
  if (deja) return deja;
  const [id, metal] = cle.split('@') as [string, Rarete | undefined];
  const m = MODULES.find((x) => x.id === id);
  if (!m || (metal !== undefined && !METAUX.includes(metal))) throw new Error('Carte inconnue : ' + cle);
  if (metal === undefined) return m;
  const def: ModuleDef = { ...m, id: cle, base: id, rarete: metal, v: Math.round(m.v * METAL_FORCE[metal] / METAL_FORCE[m.rarete]), f: m.f.slice(0, METAL_FREQ[metal]) };
  delete def.effet;
  delete def.effet2;
  if (m.effet && METAL_RENFORT[metal] > 0) def.effet = renforcer(m.effet, METAL_RENFORT[metal]);
  if (m.effet2 && METAL_RENFORT[metal] > 0) def.effet2 = renforcer(m.effet2, METAL_RENFORT[metal]);
  declinaisons.set(cle, def);
  return def;
};

/** Une carte en jeu, telle que le moteur de combat la manipule : `porteur` est celui qui la joue, `mult` vient de son niveau */
export function gesteDeCarte(cle: string, porteur: string, mult = 1): GesteDef {
  const m = moduleDef(cle);
  return {
    id: cle, carte: cle, porteur, nom: m.nom, f: m.f[0]!, ...(m.f.length > 1 ? { fs: m.f.slice() } : {}), type: m.type, v: Math.round(m.v * mult),
    ...(m.lourd ? { lourd: true } : {}), ...(m.effet ? { effet: m.effet } : {}), ...(m.effet2 ? { effet2: m.effet2 } : {}),
  };
}

/** Le deck de départ : les 6 cartes en fer d'Ilka, de Doran et de Véla, plus les 2 cartes du district (20 cartes) */
export const DECK_DEPART: GesteDef[] = [
  ...Object.entries(DEPART_PORTEURS).flatMap(([p, ids]) => ids.map((id) => gesteDeCarte(carteId(id, 'fer'), p))),
  ...GESTES_SPECIAUX,
];
