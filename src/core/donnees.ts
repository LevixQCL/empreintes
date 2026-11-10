import { tireur } from './rng';
import type { BatimentId, Effet, EnnemiDef, GesteDef, Lignee, ModuleDef, PorteurDef, Rarete, TypeGeste } from './types';
import { langue, t as tr } from './i18n';

// ---------- Porteurs ----------
// Trois Porteurs nommés + trois recrues anonymes, une par lignée.
/** « de Doran », « d’Ilka », « d’Œil-relais » : l’élision devant une voyelle (en anglais : « of Doran ») */
export const deNom = (nom: string) => (langue() === 'en' ? `of ${nom}` : /^[aeiouyéèêëàâîïôöûüœh]/i.test(nom) && !/^h[aeo]/i.test(nom) ? `d’${nom}` : `de ${nom}`);
/** « il » ou « elle » selon le Porteur */
export const ilElle = (p: PorteurDef) => (langue() === 'en' ? (p.feminin ? 'she' : 'he') : p.feminin ? 'elle' : 'il');

export const PORTEURS: PorteurDef[] = [
  { id: 'ilka', nom: tr('Ilka'), lignee: 'tech', pvMax: 38, nomme: true, feminin: true },
  { id: 'doran', nom: tr('Doran'), lignee: 'bio', pvMax: 46, nomme: true },
  { id: 'vela', nom: tr('Véla'), lignee: 'reso', pvMax: 31, nomme: true, feminin: true },
  { id: 'coursier', nom: tr('Coursier'), lignee: 'tech', pvMax: 32, nomme: false },
  { id: 'docker', nom: tr('Docker'), lignee: 'bio', pvMax: 42, nomme: false },
  { id: 'guetteur', nom: tr('Guetteur'), lignee: 'reso', pvMax: 30, nomme: false },
  // Les trois Porteurs recrutables de la Bible : ils arrivent au fil de l'acte I, Aurel avec l'acte II
  { id: 'sasha', nom: tr('Sasha Ndiaro'), lignee: 'tech', pvMax: 36, nomme: true,
    arrivee: { forge: 2, replique: tr('Si ça a une vis, ça a une seconde chance.') } },
  { id: 'nuit', nom: tr('Nuit'), lignee: 'bio', pvMax: 36, nomme: true, feminin: true,
    arrivee: { strate: 3, replique: tr('Le noir n’est pas vide. Il attend juste qu’on regarde mieux.') } },
  { id: 'aurel', nom: tr('Aurel Orsève'), lignee: 'reso', pvMax: 30, nomme: true,
    arrivee: { strate: 5, replique: tr('Mon ombre a de meilleures manières que moi. C’est bien ça, le problème.') } },
  // Bible, 23 octobre 2026 (« Devenir Résonant, Géné ou Augmenté ») : une Née-de-mue, la cousine Refusée d'Aurel,
  // et le Résonant que la Clinique trouve lors d'un Accord ouvert, quand le district lui fait confiance
  { id: 'kessa', nom: tr('Kessa'), lignee: 'bio', pvMax: 40, nomme: true, feminin: true,
    arrivee: { strate: 4, replique: tr('On n’a rien choisi. Mais on est les seuls à pouvoir dire ce que ça fait.') } },
  { id: 'liane', nom: tr('Liane Orsève'), lignee: 'tech', pvMax: 34, nomme: true, feminin: true,
    arrivee: { strate: 6, replique: tr('Ils m’ont refusé la mèche d’or. J’ai fait pousser autre chose.') } },
  { id: 'joss', nom: tr('Joss'), lignee: 'reso', pvMax: 29, nomme: true,
    arrivee: { accord: true, replique: tr('J’ai passé des années à cacher l’or des autres. Le mien, je le laisse briller.') } },
];

export const NOMS_LIGNEE: Record<Lignee | 'neutre', { nom: string; court: string }> = {
  tech: { nom: tr('Augmenté'), court: tr('AUGMENTÉ') },
  bio: { nom: tr('Géné'), court: tr('GÉNÉ') },
  reso: { nom: tr('Résonant'), court: tr('RÉSONANT') },
  neutre: { nom: tr('Spécial'), court: tr('SPÉCIAL') },
};

// ---------- Les cartes ----------
// Décision du 22 octobre 2026 : la carte qu'on collectionne est celle qu'on joue. Les Gestes, cartes d'action à part, ont disparu.
// Une carte = une place dans le deck. On la confie à un Porteur de sa lignée (6 cartes au plus par Porteur, voir jeu.ts) ;
// le deck de combat réunit les cartes des 3 Porteurs de l'escouade, plus les 2 cartes du district.
// Rôles des lignées (29 octobre 2026, mesuré au robot, docs/robot-archetypes.md) : les attaques Génés passent à 65 % de leur force
// (les Génés tiennent, ils ne gagnaient plus besoin de personne) ; Voile du murmure, Miroir de brume, Mèche d’or et Sablier inversé
// deviennent des attaques « Troubler » (désarmer) à 70 % de leur ancien bouclier (les Résonants affaiblissent l'ennemi).
// Refonte des quasi-doublons (1er novembre 2026, remarque de Luc, docs/refonte-doublons.md) : aucune carte supprimée ; celles qui
// faisaient la même chose qu'une autre en plus gros changent d'effet (Miroir de brume : Amorce ; Mèche d’or : Lecture ;
// Sablier inversé : Sourdine ; Éclat qui chante : Diapason ; Éclair captif et Noyau instable : deux Décharges différentes ;
// Cœur-turbine : Élan ; Branchies : soin Vague ; Cuir de récif : Riposte ; Jambes à ressort : Fréquences 7-8-6).
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
/** une carte exclusive (28 octobre 2026) : elle n'existe que dans son métal d'origine, jamais dans un autre */
const x = (id: string, nom: string, lignee: Lignee, rarete: Rarete, type: TypeGeste, v: number, f: number[], effet: Effet, lourd = false): ModuleDef =>
  ({ ...c(id, nom, lignee, rarete, type, v, f, effet, lourd), seul: true });
/** une carte de l’Héritage : en nacre, deux effets */
const legs = (id: string, nom: string, lignee: Lignee, type: TypeGeste, v: number, f: number[], effet: Effet, effet2: Effet, lourd = false): ModuleDef =>
  ({ ...c(id, nom, lignee, 'nacre', type, v, f, effet, lourd), effet2, legs: true });

/** la carte du parrainage : exclusive, dans son seul métal, jamais tirée */
const lien = (id: string, nom: string, lignee: Lignee, rarete: Rarete, type: TypeGeste, v: number, f: number[], effet: Effet): ModuleDef =>
  ({ ...c(id, nom, lignee, rarete, type, v, f, effet), lien: true });

export const MODULES: ModuleDef[] = [
  // ---------- Les 15 cartes de base : 5 par Porteur nommé, qu'il porte dès le départ ----------
  c('ruee', tr('Plastron de choc'), 'tech', 'fer', 'atk', 8, [3, 4, 2], { type: 'percant' }),
  c('bond', tr('Talon de cristal'), 'tech', 'fer', 'atk', 6, [4, 5, 3], { type: 'elan' }),
  c('esquive', tr('Bracelet de déviation'), 'tech', 'fer', 'bouclier', 6, [5, 6, 4], { type: 'elan' }),
  c('tir', tr('Canon à cristal'), 'tech', 'fer', 'atk', 10, [6, 7, 5], { type: 'percant' }),
  c('tir-vif', tr('Pistolet à faisceau'), 'tech', 'fer', 'atk', 5, [3, 2, 4], { type: 'flux', v: 1 }),
  c('morsure', tr('Pince de récif'), 'bio', 'fer', 'atk', 5, [2, 3, 1], { type: 'siphon', part: 0.5 }),
  c('carapace', tr('Carapace'), 'bio', 'fer', 'bouclier', 8, [1, 2, 3], { type: 'rempart', part: 0.5 }),
  c('regenerer', tr('Bol de sève'), 'bio', 'fer', 'soin', 9, [4, 5, 3], { type: 'vague' }),
  c('charge', tr('Front de roche'), 'bio', 'fer', 'atk', 6, [5, 4, 6], { type: 'fissure', part: 0.25 }),
  c('grogner', tr('Conque de garde'), 'bio', 'fer', 'bouclier', 5, [3, 2, 4], { type: 'desarmer', part: 0.3 }),
  c('murmure', tr('Voile du murmure'), 'reso', 'fer', 'atk', 5, [7, 6, 8], { type: 'desarmer', part: 0.3 }),
  c('echo', tr('Cristal d’écho'), 'reso', 'fer', 'atk', 8, [9, 8, 7], { type: 'accord' }),
  c('souffle', tr('Cor de brume'), 'reso', 'fer', 'atk', 20, [8, 9, 7], { type: 'fissure', part: 0.25 }, true),
  c('apaiser', tr('Cœur d’améthyste'), 'reso', 'fer', 'soin', 7, [6, 7, 5], { type: 'vague' }),
  c('eclat', tr('Éclat'), 'reso', 'fer', 'atk', 11, [8, 7, 9], { type: 'crescendo', part: 0.3 }),

  // ---------- Augmentés : Fréquences moyennes (zone 3 à 7, ZONES_FREQUENCES) ----------
  c('jambes-ressort', tr('Jambes à ressort'), 'tech', 'fer', 'atk', 11, [7, 8, 6], { type: 'elan' }),
  c('gant-arc', tr('Gant à arc'), 'tech', 'fer', 'atk', 13, [7, 6, 8], { type: 'crescendo', part: 0.3 }),
  c('oeil-relais', tr('Œil-relais'), 'tech', 'fer', 'atk', 12, [5, 3, 6], { type: 'curee', part: 0.6 }),
  c('grappin-cable', tr('Grappin à câble'), 'tech', 'fer', 'bouclier', 8, [4, 5, 3], { type: 'amorce', part: 0.5 }),
  c('coeur-turbine', tr('Cœur-turbine'), 'tech', 'cuivre', 'atk', 13, [6, 8, 7], { type: 'elan' }),
  c('oeil-brouilleur', tr('Œil-brouilleur'), 'tech', 'cuivre', 'atk', 11, [6, 7, 5], { type: 'desarmer', part: 0.3, zone: true }),
  c('bras-grue', 'Bras-grue', 'tech', 'argent', 'atk', 40, [6, 8, 4], { type: 'percant' }, true),
  c('dorsale', tr('Dorsale renforcée'), 'tech', 'argent', 'bouclier', 20, [3, 4, 7], { type: 'elan' }),
  c('lames-orbitales', tr('Lames orbitales'), 'tech', 'or', 'atk', 40, [7, 3, 2], { type: 'crescendo', part: 0.3 }, true),
  c('coeur-reprise', tr('Cœur de reprise'), 'tech', 'or', 'atk', 28, [6, 2, 5], { type: 'secours', part: 0.5 }),

  // ---------- Génés : Fréquences basses ----------
  c('glande-ambre', tr('Glande d’ambre'), 'bio', 'fer', 'soin', 7, [3, 2, 4], { type: 'vague', mot: 'ouverture' }),
  c('crocs-fossiles', tr('Crocs fossiles'), 'bio', 'fer', 'atk', 10, [1, 3, 2], { type: 'desarmer', part: 0.3 }),
  c('cuir-recif', tr('Cuir de récif'), 'bio', 'fer', 'bouclier', 11, [4, 5, 3], { type: 'secours', part: 0.5 }),
  c('yeux-nocturnes', tr('Yeux nocturnes'), 'bio', 'fer', 'atk', 9, [3, 4, 2], { type: 'fissure', part: 0.25, mot: 'ouverture' }),
  c('poumons-abysse', tr('Poumons d’abysse'), 'bio', 'cuivre', 'bouclier', 12, [2, 4, 3], { type: 'rempart', part: 0.5, mot: 'final' }),
  c('branchies', tr('Branchies des Fondations'), 'bio', 'cuivre', 'soin', 7, [2, 1, 3], { type: 'vague' }),
  c('carapace-mere', tr('Carapace-mère'), 'bio', 'argent', 'bouclier', 14, [5, 6, 1], { type: 'rempart', part: 0.5, mot: 'ouverture' }),
  c('sang-ambre', tr('Sang d’ambre'), 'bio', 'argent', 'soin', 8, [3, 2, 5], { type: 'vague', mot: 'final' }),
  c('coeur-meute', tr('Cœur de meute'), 'bio', 'or', 'atk', 12, [5, 4, 3], { type: 'siphon', part: 0.5, mode: 'meute' }),
  c('mue-totale', tr('Mue totale'), 'bio', 'or', 'soin', 16, [1, 2, 4], { type: 'vague' }),

  // ---------- Résonants : Fréquences hautes ----------
  c('eclat-chant', tr('Éclat qui chante'), 'reso', 'fer', 'atk', 11, [7, 9, 8], { type: 'diapason' }),
  c('miroir-brume', tr('Miroir de brume'), 'reso', 'fer', 'atk', 7, [8, 9, 7], { type: 'amorce', part: 0.5 }),
  c('encre-ancienne', tr('Encre ancienne'), 'reso', 'fer', 'atk', 11, [6, 7, 5], { type: 'fissure', part: 0.25 }),
  c('meche-or', tr('Mèche d’or'), 'reso', 'fer', 'atk', 9, [7, 8, 6], { type: 'lecture' }),
  c('plume-givre', tr('Plume de givre'), 'reso', 'cuivre', 'atk', 11, [9, 8, 7], { type: 'desarmer', part: 1, total: true }),
  c('ombre-serpent', tr('Ombre de serpent'), 'reso', 'cuivre', 'atk', 17, [9, 6, 8], { type: 'fissure', part: 0.25, zone: true }),
  c('ombre-ailee', tr('Ombre ailée'), 'reso', 'argent', 'atk', 32, [9, 7, 8], { type: 'fissure', part: 0.25, tours: 3 }, true),
  c('pressentiment', tr('Sablier inversé'), 'reso', 'argent', 'atk', 8, [6, 8, 7], { type: 'sourdine', part: 0.35 }),
  c('chant-abysses', tr('Chant des abysses'), 'reso', 'or', 'atk', 14, [7, 8, 9], { type: 'accord' }),
  c('souffle-wyrm', tr('Souffle du wyrm'), 'reso', 'or', 'atk', 22, [9, 8, 7], { type: 'crescendo', part: 0.3, zone: true }),

  // ---------- Les voies, étape 1 (27 octobre 2026, docs/familles-de-decks.md) : une voie par lignée ----------
  // Le Moteur (Liane) : remplir le Flux, puis tout vider d'un coup
  c('bobine-recuperation', tr('Bobine de récupération'), 'tech', 'fer', 'bouclier', 9, [3, 2, 4], { type: 'flux', v: 1 }),
  c('condensateur', tr('Condensateur'), 'tech', 'cuivre', 'atk', 12, [5, 4, 6], { type: 'flux', v: 1, mot: 'ouverture' }),
  c('decharge-arc', tr('Décharge d’arc'), 'tech', 'cuivre', 'atk', 16, [6, 7, 5], { type: 'decharge', part: 0.5 }),
  c('eclair-captif', tr('Éclair captif'), 'tech', 'argent', 'atk', 16, [4, 5, 7], { type: 'decharge', part: 0.9, max: 1 }),
  c('noyau-instable', tr('Noyau instable'), 'tech', 'or', 'atk', 38, [7, 6, 2], { type: 'decharge', part: 0.65, recharge: 2 }, true),
  // La Carapace (Doran) : parer, puis frapper avec tout le bouclier accumulé
  c('coup-epaule', tr('Épaulière de roche'), 'bio', 'fer', 'bouclier', 10, [3, 2, 4], { type: 'riposte', part: 0.5 }),
  c('queue-massue', 'Queue-massue', 'bio', 'cuivre', 'bouclier', 11, [4, 5, 3], { type: 'riposte', part: 0.5 }),
  c('belier-os', tr('Bélier d’os'), 'bio', 'argent', 'bouclier', 20, [5, 4, 1], { type: 'riposte', part: 0.5 }, true),
  c('retour-maree', tr('Coquille de marée'), 'bio', 'or', 'bouclier', 18, [2, 3, 5], { type: 'riposte', part: 1.3, vide: true }),
  // Le Chœur (Joss) : répéter une même Fréquence (Écho)
  c('diapason-cristal', tr('Diapason de cristal'), 'reso', 'fer', 'bouclier', 9, [9, 8, 7], { type: 'diapason' }),
  c('voix-basse', tr('Voix basse'), 'reso', 'fer', 'atk', 9, [9, 8, 7], { type: 'unisson', part: 1.2 }),
  c('chorale-ombres', tr('Chorale des ombres'), 'reso', 'cuivre', 'atk', 12, [8, 9, 7], { type: 'unisson', part: 1.2, mot: 'final' }),
  c('cloche-abysses', tr('Cloche des abysses'), 'reso', 'argent', 'atk', 17, [9, 7, 8], { type: 'diapason', premiere: true }),
  c('grand-unisson', tr('Grand unisson'), 'reso', 'or', 'atk', 18, [9, 8, 6], { type: 'unisson', part: 2.5, toute: true }),
  // ---------- Les voies, étapes 2 et 3 (28 octobre 2026, docs/familles-de-decks.md) ----------
  // La Traque (Nuit) : fissurer, puis achever
  c('flair', tr('Flair'), 'bio', 'fer', 'bouclier', 8, [2, 3, 1], { type: 'fissure', part: 0.25 }),
  c('bond-predateur', tr('Bond du prédateur'), 'bio', 'fer', 'atk', 8, [4, 3, 5], { type: 'curee', part: 0.6 }),
  c('crocs-verre', tr('Crocs de verre'), 'bio', 'cuivre', 'atk', 9, [3, 4, 2], { type: 'fissure', part: 0.25, mot: 'final' }),
  c('chasse-aveugle', tr('Chasse à l’aveugle'), 'bio', 'argent', 'atk', 13, [5, 4, 2], { type: 'curee', part: 0.6, aveugle: 0.3 }),
  c('hallali', tr('Hallali'), 'bio', 'or', 'atk', 14, [4, 5, 1], { type: 'curee', part: 2, deux: true }),
  // La Lecture (Aurel) : briser la Fêlure à coup sûr, puis frapper dans la faille
  c('regard-biais', tr('Regard en biais'), 'reso', 'fer', 'bouclier', 11, [6, 7, 9], { type: 'lecture' }),
  c('lame-doute', tr('Lame de doute'), 'reso', 'fer', 'atk', 13, [7, 8, 6], { type: 'faille', part: 0.5 }),
  c('oeil-lecteur', tr('Œil du Lecteur'), 'reso', 'cuivre', 'atk', 15, [8, 7, 9], { type: 'lecture', zone: true }),
  c('verdict', tr('Verdict'), 'reso', 'argent', 'atk', 15, [6, 8, 7], { type: 'amorce', part: 0.5 }),
  c('sentence-muette', tr('Sentence muette'), 'reso', 'or', 'atk', 20, [8, 6, 9], { type: 'faille', part: 0.5 }),
  // La Sève (Kessa) : soigner en continu, le surplus devient bouclier
  c('pollen-ambre', tr('Pollen d’ambre'), 'bio', 'fer', 'soin', 6, [2, 1, 3], { type: 'debord' }),
  c('seve-piliers', tr('Sève des piliers'), 'bio', 'cuivre', 'soin', 7, [4, 3, 5], { type: 'debord', mot: 'ouverture' }),
  c('mue-verre', tr('Mue de verre'), 'bio', 'argent', 'soin', 8, [3, 4, 1], { type: 'debord', mot: 'final' }),
  c('floraison', tr('Floraison des Fondations'), 'bio', 'or', 'soin', 13, [5, 4, 2], { type: 'debord', x: 2 }),
  // La Cadence (Ilka) : les longues chaînes, chaque coup doublé
  c('pas-chasse', tr('Pas chassé'), 'tech', 'fer', 'atk', 10, [3, 2, 4], { type: 'elan', mot: 'final' }),
  c('lames-jumelles', tr('Lames jumelles'), 'tech', 'fer', 'atk', 11, [4, 5, 3], { type: 'rafale' }),
  c('poings-pistons', 'Poings-pistons', 'tech', 'cuivre', 'atk', 12, [5, 4, 6], { type: 'rafale', min: 3 }),
  c('mitraille', tr('Mitraille de clous'), 'tech', 'argent', 'atk', 14, [6, 5, 7], { type: 'rafale', zone: true }),
  c('cadence-folle', tr('Cadence folle'), 'tech', 'or', 'atk', 15, [3, 4, 5], { type: 'rafale', cadence: true }),

  // ---------- Les nouvelles cartes (4 novembre 2026, docs/nouvelles-cartes.md) ----------
  // Bryan : sortir le jeu avec une centaine de cartes, équilibrées, qui respectent les voies ; « une carte +14 et une +15 se valent,
  // on prendra toujours +15 » : les nouvelles se distinguent par ce qu'elles font, pas par un point de force en plus.
  // Les Machines (Sasha) : la dernière voie de docs/familles-de-decks.md. Des cartes lourdes, rendues légères par le Servo.
  c('servo-bras', 'Servo-bras', 'tech', 'fer', 'bouclier', 8, [4, 5, 3], { type: 'servo' }),
  c('marteau-piston', 'Marteau-piston', 'tech', 'fer', 'atk', 21, [5, 6, 4], { type: 'desarmer', part: 0.3 }, true),
  c('verin', tr('Vérin hydraulique'), 'tech', 'cuivre', 'bouclier', 12, [3, 4, 2], { type: 'servo' }),
  c('exo-chantier', tr('Exo de chantier'), 'tech', 'argent', 'bouclier', 38, [5, 7, 4], { type: 'flux', v: 2 }, true),
  c('foreuse', tr('Foreuse des Strates'), 'tech', 'or', 'atk', 36, [5, 4, 6], { type: 'elan' }, true),
  // L’Harmonie (Véla) : le Contrepoint récompense les suites qui passent par les trois lignées (plus dures à faire qu'une suite d'une seule)
  c('contre-chant', 'Contre-chant', 'reso', 'cuivre', 'atk', 14, [7, 6, 8], { type: 'contrepoint', part: 0.25 }),
  c('fil-accord', tr('Fil d’accord'), 'reso', 'argent', 'atk', 15, [8, 7, 6], { type: 'contrepoint', part: 0.25, mot: 'final' }),
  c('nuee-chorale', tr('Nuée chorale'), 'reso', 'or', 'atk', 20, [6, 8, 7], { type: 'contrepoint', part: 0.5, exige: true }),
  // Des cartes qui comblent un trou (une Fréquence ou un effet absent d'un métal). Chiffres réglés au robot : docs/nouvelles-rapport.md
  c('riveteuse', tr('Riveteuse'), 'tech', 'cuivre', 'atk', 15, [4, 3, 5], { type: 'percant' }),
  c('suture-vive', tr('Suture vive'), 'bio', 'cuivre', 'soin', 11, [5, 1, 4], { type: 'rempart', part: 0.5 }),
  c('lamproie', tr('Lamproie des piliers'), 'bio', 'argent', 'atk', 11, [2, 4, 1], { type: 'siphon', part: 0.5, mode: 'trop' }),
  c('berceuse', tr('Berceuse des Strates'), 'reso', 'or', 'atk', 19, [7, 9, 6], { type: 'sourdine', part: 0.35 }),

  // ---------- Les exclusives (28 octobre 2026) : une carte, un seul métal ----------
  // Bryan : « une carte ne doit pas spécialement être déclinée dans tous les métaux ». Elles ne tombent que dans leur métal,
  // et portent des effets qu'on ne trouve nulle part ailleurs. Leurs Fréquences sont volontairement mal commodes pour les suites
  // (écartées, parfois hors de la plage de la lignée) : les meilleurs effets ne doivent pas rendre les Résonances faciles.
  // Argent
  x('gantelet-pillard', 'Gantelet-pillard', 'tech', 'argent', 'atk', 17, [6, 2], { type: 'rapt' }),
  x('machoire-miroir', tr('Mâchoire-miroir'), 'bio', 'argent', 'atk', 18, [5, 1], { type: 'empreinte' }),
  x('boucle-memoire', tr('Boucle de mémoire'), 'reso', 'argent', 'atk', 21, [6, 9], { type: 'rappel' }),
  // Or
  x('coeur-surregime', tr('Cœur en surrégime'), 'tech', 'or', 'atk', 20, [7, 2], { type: 'surtension', part: 0.6, cout: 0.12 }),
  x('peau-ancetre', tr('Peau de l’Ancêtre'), 'bio', 'or', 'bouclier', 26, [1, 4], { type: 'rapt' }),
  x('miroir-hauts', tr('Miroir des Hauts'), 'reso', 'or', 'atk', 20, [9, 6], { type: 'empreinte' }),
  // Nacre
  x('coeur-etoile', tr('Cœur d’étoile'), 'tech', 'nacre', 'atk', 46, [7, 4, 2], { type: 'surtension', part: 0.4, cout: 0.15 }, true),
  x('seconde-naissance', tr('Seconde naissance'), 'bio', 'nacre', 'soin', 30, [1, 3, 5], { type: 'releve' }),
  x('empreinte-vive', tr('Empreinte vive'), 'reso', 'nacre', 'atk', 18, [9, 6, 3], { type: 'empreinte', forte: true }),
  x('silence-avant', tr('Silence d’avant'), 'reso', 'nacre', 'atk', 24, [7, 4, 9], { type: 'rappel' }),
  // 4 novembre 2026 : une nacre de plus pour les Augmentés et les Génés (deux par lignée)
  x('couperet-hauts', tr('Couperet des Hauts'), 'tech', 'nacre', 'atk', 30, [6, 3, 8], { type: 'execution', part: 0.15 }),
  x('racines-meres', tr('Racines-mères'), 'bio', 'nacre', 'bouclier', 28, [5, 2, 4], { type: 'tenacite' }),

  // ---------- L’Héritage du district (27 octobre 2026, docs/heritage-du-district.md) ----------
  // Dix vierges cachées par l'ancienne directrice ; chaque joueur n'en reçoit qu'une (lettre de la directrice, LETTRE_LEGS).
  // Exclusives (jamais trouvées ailleurs : MODULES_TIRABLES), en nacre seulement, les seules à deux effets. La nacre renforce
  // leurs parts (×1,5) comme pour toute carte : les parts ci-dessous sont avant ce renfort. Une Fréquence libre est le premier effet.
  legs('foulee-directrice', tr('Foulée de la directrice'), 'tech', 'atk', 19, [4, 3, 5], { type: 'elan' }, { type: 'crescendo', part: 0.2 }),
  legs('bras-fonderie', tr('Bras de la Fonderie'), 'tech', 'atk', 40, [5, 6, 4], { type: 'percant' }, { type: 'elan' }, true),
  legs('coeur-glaciere', tr('Cœur de la Glacière'), 'tech', 'atk', 17, [6, 5, 7], { type: 'decharge', part: 0.5 }, { type: 'flux', v: 1 }),
  legs('carapace-fondations', tr('Carapace des Fondations'), 'bio', 'bouclier', 13, [2, 3, 1], { type: 'rempart', part: 0.35 }, { type: 'riposte', part: 0.35 }),
  legs('oeil-grande-nuit', tr('Œil de la Grande Nuit'), 'bio', 'atk', 12, [3, 2, 4], { type: 'fissure', part: 0.2 }, { type: 'siphon', part: 0.6 }),
  legs('premiere-mue', tr('Première mue'), 'bio', 'soin', 18, [1, 2, 3], { type: 'vague' }, { type: 'rempart', part: 0.35 }),
  legs('lanterne-lecture', tr('Lanterne de la première Lecture'), 'reso', 'atk', 12, [8, 7, 9], { type: 'accord' }, { type: 'desarmer', part: 0.2 }),
  legs('sceau-orseve', tr('Sceau volé aux Orsève'), 'reso', 'atk', 14, [7, 6, 8], { type: 'desarmer', part: 0.2 }, { type: 'fissure', part: 0.1 }),
  legs('voix-quartier', tr('Voix du quartier'), 'reso', 'atk', 17, [9, 8, 7], { type: 'diapason' }, { type: 'unisson', part: 0.7 }),

  // ---------- Le parrainage (29 octobre 2026) ----------
  // Reçue par le parrain et son filleul quand le filleul monte sa Tour du Noyau au niveau 3. Une Résonante (les Résonants orchestrent) :
  // la force et l'effet d'une carte de cuivre ordinaire (comme Plume de givre), pour ne jamais faire du parrainage un avantage en combat.
  lien('empreinte-jumelle', tr('Empreinte jumelle'), 'reso', 'cuivre', 'atk', 5, [7, 8, 6], { type: 'accord' }),
];

/** La carte du parrainage */
export const PARRAINAGE_CARTE = 'empreinte-jumelle';

/** Le Porteur dont chaque carte de l’Héritage est la pièce maîtresse de la voie (il prête son portrait en attendant l'illustration) */
export const PORTEUR_LEGS: Record<string, string> = {
  'foulee-directrice': 'ilka', 'bras-fonderie': 'sasha', 'coeur-glaciere': 'liane',
  'carapace-fondations': 'doran', 'oeil-grande-nuit': 'nuit', 'premiere-mue': 'kessa',
  'lanterne-lecture': 'vela', 'sceau-orseve': 'aurel', 'voix-quartier': 'joss',
};

/** Les cartes qu'on peut trouver, acheter ou fabriquer : toutes, sauf celles de l’Héritage */
export const MODULES_TIRABLES = MODULES.filter((m) => !m.legs && !m.lien);
/** Une carte existe-t-elle dans ce métal ? Toutes, sauf les exclusives (seulement dans leur métal) et l’Héritage (en nacre) */
export const existeEn = (m: ModuleDef, metal: Rarete) => (!m.seul && !m.legs && !m.lien) || m.rarete === metal;
/** Les cartes qui peuvent tomber dans un métal donné (une exclusive ne tombe que dans le sien) */
export const tirablesEn = (metal: Rarete) => MODULES_TIRABLES.filter((m) => existeEn(m, metal));
/** Les cartes exclusives : un seul métal */
export const EXCLUSIVES = MODULES.filter((m) => m.seul);

/**
 * Les voies (docs/familles-de-decks.md) : chaque Porteur nommé incarne une façon de gagner. Les cartes restent liées à la lignée
 * (n'importe quel Porteur de la lignée peut les porter) ; le Porteur de la voie prête son portrait aux cartes encore sans illustration.
 */
export const VOIES: { id: string; nom: string; porteur: string; cartes: string[] }[] = [
  { id: 'moteur', nom: tr('Le Moteur'), porteur: 'liane', cartes: ['bobine-recuperation', 'condensateur', 'decharge-arc', 'eclair-captif', 'noyau-instable'] },
  { id: 'carapace', nom: tr('La Carapace'), porteur: 'doran', cartes: ['coup-epaule', 'queue-massue', 'belier-os', 'retour-maree'] },
  { id: 'choeur', nom: tr('Le Chœur'), porteur: 'joss', cartes: ['diapason-cristal', 'voix-basse', 'chorale-ombres', 'cloche-abysses', 'grand-unisson'] },
  // étapes 2 et 3 (28 octobre 2026)
  { id: 'traque', nom: tr('La Traque'), porteur: 'nuit', cartes: ['flair', 'bond-predateur', 'crocs-verre', 'chasse-aveugle', 'hallali'] },
  { id: 'lecture', nom: tr('La Lecture'), porteur: 'aurel', cartes: ['regard-biais', 'lame-doute', 'oeil-lecteur', 'verdict', 'sentence-muette'] },
  { id: 'seve', nom: tr('La Sève'), porteur: 'kessa', cartes: ['pollen-ambre', 'seve-piliers', 'mue-verre', 'floraison'] },
  { id: 'cadence', nom: tr('La Cadence'), porteur: 'ilka', cartes: ['pas-chasse', 'lames-jumelles', 'poings-pistons', 'mitraille', 'cadence-folle'] },
  // 4 novembre 2026
  { id: 'machines', nom: tr('Les Machines'), porteur: 'sasha', cartes: ['servo-bras', 'marteau-piston', 'verin', 'exo-chantier', 'foreuse'] },
  { id: 'harmonie', nom: tr('L’Harmonie'), porteur: 'vela', cartes: ['contre-chant', 'fil-accord', 'nuee-chorale'] },
];
/** Les exclusives sans illustration prêtent, en attendant, le portrait du Porteur qui leur ressemble le plus */
export const PORTEUR_EXCLUSIVES: Record<string, string> = {
  'gantelet-pillard': 'sasha', 'machoire-miroir': 'nuit', 'boucle-memoire': 'joss',
  'coeur-surregime': 'liane', 'peau-ancetre': 'doran', 'miroir-hauts': 'vela',
  'coeur-etoile': 'sasha', 'seconde-naissance': 'kessa', 'empreinte-vive': 'aurel', 'silence-avant': 'guetteur',
  'empreinte-jumelle': 'vela',
  'couperet-hauts': 'ilka', 'racines-meres': 'doran',
  'riveteuse': 'sasha', 'suture-vive': 'kessa', 'lamproie': 'nuit', 'berceuse': 'joss',
};
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

export function renforcer(e: Effet, k: number): Effet {
  // la Décharge ne se renforce pas : en or et en nacre, les Fréquences en plus font déjà plus de Résonances, donc plus de Flux à vider
  if (k <= 1 || e.type === 'decharge') return e;
  if (e.type === 'flux') return { ...e, v: e.v + (k >= 1.5 ? 1 : 0) };
  // un plafond pour les parts qui retirent ou gardent (90 %) et pour le Siphon (100 %) ; les bonus de force des voies n'en ont pas
  const plafond = e.type === 'siphon' ? 1 : ['riposte', 'unisson', 'curee', 'faille', 'surtension', 'amorce', 'contrepoint'].includes(e.type) ? Infinity : 0.9;
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
export const GESTES_SPECIAUX: GesteDef[] = [special('stimulant', tr('Stimulant'), 1, 'soin', 5, { type: 'vague' }), special('repli', tr('Pavois de cuivre'), 9, 'bouclier', 10)];

// ---------- Le Râtelier du district (30 octobre 2026) ----------
// Bryan et Luc : « on aime l'idée des cartes communes et de leur provenance, mais il en faut des nouvelles et pouvoir les échanger ».
// Les cartes communes restent sans lignée, sans métal, portées par personne. Chacune vient d'un bâtiment, s'ouvre à un niveau
// de ce bâtiment, et gagne de la force quand il monte. Au district, le Râtelier choisit celles qui descendent.
export interface CarteCommuneDef {
  geste: GesteDef;
  batiment: BatimentId;
  /** niveau du bâtiment qui ouvre la carte */
  niveau: number;
  /** d'où elle vient, en une phrase */
  texte: string;
}
// Revue d'un game designer (30 octobre 2026) : le district fournit la logistique, pas la puissance. Ses cartes garantissent un
// minimum (soin, bouclier, de quoi relier une suite), servent de filet quand un Porteur tombe (elles ne s'éteignent jamais),
// et ne prennent jamais l'effet d'une lignée. Écartées pour ça : soin ciblé fort (Génés), Rempart (Génés), Désarmer et Fissure
// (Résonants). Une carte d'attaque commune reste sous une carte de fer (7 contre 8-9) : elle ne s'éteint pas, ça vaut déjà un surplus.
const commune = (g: GesteDef, batiment: BatimentId, niveau: number, texte: string): CarteCommuneDef => ({ geste: g, batiment, niveau, texte });
const ampoule = special('ampoule-releve', tr('Ampoule de relève'), 6, 'soin', 8, { type: 'releve' });
ampoule.unique = true;
export const CARTES_COMMUNES: CarteCommuneDef[] = [
  commune(GESTES_SPECIAUX[0]!, 'clinique', 1, tr('Une seringue de lumière verte, préparée par la Clinique pour chaque escouade.')),
  commune(GESTES_SPECIAUX[1]!, 'noyau', 1, tr('Une balise de la Tour du Noyau : une porte blindée s’ouvre, l’escouade s’y abrite.')),
  commune(special('lame-atelier', tr('Lame d’atelier'), 4, 'atk', 7), 'forge', 2, tr('Une lame de récupération, affûtée à la Forge entre deux commandes. Rien de rare : elle ne lâche jamais.')),
  commune(special('plan-galeries', tr('Plan des galeries'), 5, 'bouclier', 4, { type: 'pioche' }), 'noyau', 4, tr('Les creuseurs de la Tour tiennent le plan des galeries à jour : on sait où se mettre à l’abri, et ce qui vient ensuite.')),
  commune(special('groupe-secours', tr('Groupe de secours'), 7, 'atk', 6, { type: 'secours', part: 0.6 }), 'generateur', 6, tr('Une équipe du Générateur, prête à descendre au premier signal : plus l’escouade tombe, plus elle frappe fort.')),
  commune(special('breche', tr('Brèche'), 8, 'atk', 5, { type: 'breche' }), 'forge', 6, tr('Une charge de forge, posée contre la carapace de l’ennemi : elle ne fait pas mal, elle ouvre.')),
  commune(ampoule, 'clinique', 7, tr('La dernière trouvaille de la Clinique : une ampoule qui remet un Porteur debout. Une seule par combat.')),
];
/** Les cartes communes qui descendent sans rien choisir (une partie neuve, une ancienne sauvegarde) */
export const RATELIER_DEPART = ['stimulant', 'repli'];
/**
 * La force d'une carte commune monte avec son bâtiment, comme une carte de collection avec ses niveaux (31 octobre 2026,
 * Luc : « savoir améliorer les cartes de district ») : un gain entier par niveau au-delà de celui qui l'ouvre, environ 10 %
 * de sa force et au moins +1, pour que chaque niveau du bâtiment se voie (avant : +6 % arrondi, des niveaux sans rien).
 */
export const gainCommune = (c: CarteCommuneDef) => Math.max(1, Math.round(c.geste.v * 0.1));
export const forceCommune = (c: CarteCommuneDef, niveauBatiment: number) =>
  c.geste.v + gainCommune(c) * Math.max(0, niveauBatiment - c.niveau);
export const communeDef = (id: string) => CARTES_COMMUNES.find((c) => c.geste.id === id);
/**
 * La Clé de l’Héritage (27 octobre 2026) : la dixième vierge, pour le directeur qui répond « tout le monde à la fois » à la lettre.
 * Elle rejoint le paquetage (jouée par personne, elle reste quand un Porteur tombe) dès qu'un Porteur de l'escouade a le niveau
 * de la nacre, et grandit avec le plus avancé d'entre eux (comme une carte de l’Héritage : niveaux 1, 3 et 5 ; +10 % de force aux niveaux 3 et 5).
 */
export const CLE_LEGS: GesteDef = special('cle-legs', tr('Clé de l’Héritage'), 1, 'bouclier', 18, { type: 'accord' });
CLE_LEGS.effet2 = { type: 'rempart', part: 0.75 };

/** D'où vient chaque carte du paquetage : le bâtiment qui la fournit et ce qu'elle est */
const NOM_BATIMENT_COMMUNE: Record<BatimentId, string> = { noyau: tr('Tour du Noyau'), generateur: tr('Générateur'), forge: tr('Forge'), clinique: tr('Clinique'), comptoir: tr('Comptoir'), cercle: tr('Cercle des quais') };
export const ORIGINE_PAQUETAGE: Record<string, { batiment: string; texte: string }> = {
  ...Object.fromEntries(CARTES_COMMUNES.map((c) => [c.geste.id, { batiment: NOM_BATIMENT_COMMUNE[c.batiment], texte: c.texte }])),
  'cle-legs': { batiment: tr('Héritage du district'), texte: tr('La dixième vierge de l’ancienne directrice : une clé de nacre qui ouvre toutes les portes, et les tient fermées derrière l’escouade.') },
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

// 9 novembre 2026 (économie à cristal unique) : un seul prix en cristaux (`energie`) = composants d'avant + énergie ÷ 40 : l'énergie débordait, elle ne freinait pas
// vraiment les chantiers ; ce sont les composants qui les payaient. Réglé au robot pour garder −10 vers le jour 30.
// 28 octobre 2026 (Bryan : « tout est censé monter ») : dix niveaux par bâtiment, comme les quatre âges du district
// (âge 2 au niveau 4 de la Tour, âge 3 au 8, âge 4 au 10). Les niveaux 1 à 5 sont inchangés ; 6 à 10 les prolongent.
export const BATIMENTS: BatimentDef[] = [
  { id: 'noyau', nom: tr('Tour du Noyau'), role: tr('Le cœur du district : il fixe le niveau des autres bâtiments et loge les creuseurs qui percent les Strates.'), affinite: null,
    couts: [{ energie: 0, composants: 0 }, { energie: 18, composants: 0 }, { energie: 50, composants: 0 }, { energie: 95, composants: 0, eclats: 3 }, { energie: 190, composants: 0, eclats: 8 },
      { energie: 305, composants: 0, eclats: 6 }, { energie: 490, composants: 0, eclats: 7 }, { energie: 750, composants: 0, eclats: 8 }, { energie: 1115, composants: 0, eclats: 10 }, { energie: 1600, composants: 0, eclats: 12 }], niveauMax: 10 },
  { id: 'generateur', nom: tr('Générateur'), role: tr('Taille en cristaux le minerai rapporté d’en bas et de la mer, même quand tu ne joues pas.'), affinite: 'tech',
    couts: [{ energie: 0, composants: 0 }, { energie: 12, composants: 0 }, { energie: 30, composants: 0 }, { energie: 65, composants: 0, eclats: 2 }, { energie: 130, composants: 0, eclats: 5 },
      { energie: 215, composants: 0, eclats: 4 }, { energie: 355, composants: 0, eclats: 5 }, { energie: 545, composants: 0, eclats: 7 }, { energie: 830, composants: 0, eclats: 9 }, { energie: 1210, composants: 0, eclats: 11 }], niveauMax: 10 },
  // 27 octobre 2026 (Bryan) : la Forge passe aux Résonants, pour que chaque lignée ait son poste idéal
  // (Générateur : Augmentés, Clinique : Génés, Forge : Résonants).
  { id: 'forge', nom: tr('Forge'), role: tr('Refabrique une carte déjà trouvée : un doublon de plus. Il faut un Porteur au travail.'), affinite: 'reso',
    couts: [{ energie: 0, composants: 0 }, { energie: 14, composants: 0 }, { energie: 35, composants: 0 }, { energie: 70, composants: 0, eclats: 2 }, { energie: 145, composants: 0, eclats: 5 },
      { energie: 240, composants: 0, eclats: 4 }, { energie: 385, composants: 0, eclats: 5 }, { energie: 600, composants: 0, eclats: 7 }, { energie: 905, composants: 0, eclats: 9 }, { energie: 1320, composants: 0, eclats: 11 }], niveauMax: 10 },
  { id: 'clinique', nom: tr('Clinique'), role: tr('Soigne l’Usure des Porteurs présents au district, même au travail.'), affinite: 'bio',
    couts: [{ energie: 0, composants: 0 }, { energie: 12, composants: 0 }, { energie: 35, composants: 0 }, { energie: 70, composants: 0, eclats: 2 }, { energie: 140, composants: 0, eclats: 5 },
      { energie: 230, composants: 0, eclats: 4 }, { energie: 370, composants: 0, eclats: 5 }, { energie: 570, composants: 0, eclats: 7 }, { energie: 875, composants: 0, eclats: 9 }, { energie: 1270, composants: 0, eclats: 11 }], niveauMax: 10 },
  // 23 octobre 2026 : le « acheter » de « forger, acheter ou combattre ». Il commence au niveau 0 : on le construit.
  { id: 'comptoir', nom: tr('Comptoir'), role: tr('Les fouilleurs du quartier y revendent chaque jour quelques cartes trouvées dans les Strates. Prix fixes : tu vois toujours ce que tu achètes.'), affinite: null,
    couts: [{ energie: 25, composants: 0 }, { energie: 35, composants: 0 }, { energie: 70, composants: 0, eclats: 2 }, { energie: 140, composants: 0, eclats: 5 }, { energie: 220, composants: 0, eclats: 8 },
      { energie: 315, composants: 0, eclats: 5 }, { energie: 490, composants: 0, eclats: 6 }, { energie: 740, composants: 0, eclats: 8 }, { energie: 1095, composants: 0, eclats: 10 }, { energie: 1580, composants: 0, eclats: 12 }], niveauMax: 10 },
  // 3 novembre 2026 (Bryan) : le bâtiment social, à la place du Labo génétique (mis en réserve). Il commence au niveau 0
  // et ne se construit qu'après la Strate −2 (CERCLE_OUVERTURE) : amis, vitrines, duels entre directeurs, échanges de cartes.
  { id: 'cercle', nom: tr('Cercle des quais'), role: tr('Les directeurs des autres districts y accostent : on s’y fait des amis, on s’y défie en duel et on y échange ses cartes en double.'), affinite: null,
    couts: [{ energie: 30, composants: 0 }, { energie: 40, composants: 0 }, { energie: 80, composants: 0, eclats: 2 }, { energie: 145, composants: 0, eclats: 5 }, { energie: 230, composants: 0, eclats: 8 },
      { energie: 325, composants: 0, eclats: 5 }, { energie: 500, composants: 0, eclats: 6 }, { energie: 750, composants: 0, eclats: 8 }, { energie: 1105, composants: 0, eclats: 10 }, { energie: 1600, composants: 0, eclats: 12 }], niveauMax: 10 },
];

// ---------- Ennemis ----------
export const ENNEMIS: EnnemiDef[] = [
  {
    id: 'remanent-faible', nom: tr('Rémanent affaibli'), lignee: 'reso', tag: tr('GARDIEN DE LA CHAMBRE'), pvMax: 75,
    motif: [
      { type: 'atk', nom: tr('Griffe'), v: 4, cible: 'hasard' },
      { type: 'atk', nom: tr('Griffe'), v: 5, cible: 'faible' },
      { type: 'atk', nom: tr('Entaille'), v: 13, cible: 'doran' },
      { type: 'atk', nom: tr('Griffe'), v: 5, cible: 'hasard' },
    ],
  },
  {
    id: 'remanent', nom: tr('Rémanent'), lignee: 'reso', tag: 'ANCIEN', pvMax: 72,
    traits: [{ type: 'evanescent', part: 0.25 }],
    motif: [
      { type: 'atk', nom: tr('Griffe'), v: 8, cible: 'hasard' },
      { type: 'atk', nom: tr('Griffe'), v: 10, cible: 'faible' },
      { type: 'bouclier', v: 8 },
      { type: 'atk', nom: tr('Entaille'), v: 14, cible: 'hasard' },
    ],
  },
  {
    id: 'vigie', nom: tr('Vigie de dépôt'), lignee: 'tech', tag: tr('ANCIENNE MACHINE'), pvMax: 95,
    traits: [{ type: 'blinde', v: 2 }, { type: 'aspire', v: 1 }],
    motif: [
      { type: 'atk', nom: tr('Rayon'), v: 10, cible: 'reso' },
      { type: 'atk', nom: tr('Balayage'), v: 5, zone: true },
      { type: 'atk', nom: tr('Rayon'), v: 11, cible: 'reso' },
      { type: 'bouclier', v: 10 },
    ],
  },
  {
    id: 'confluence', nom: tr('Confluence'), lignee: 'bio', tag: tr('BOSS · EMPREINTES MÊLÉES'), pvMax: 165,
    traits: [{ type: 'regeneration', part: 0.015 }],
    phase: { seuil: 0.5, nom: tr('Crue'), texte: tr('Les empreintes mêlées débordent : la Confluence appelle ce qui rampe dans les piliers.'), renforts: ['rampeur'],
      motif: [{ type: 'atk', nom: tr('Crue'), v: 9, zone: true }, { type: 'atk', nom: tr('Ressac'), v: 13, cible: 'faible' }, { type: 'soin', nom: tr('Refluer'), v: 12 }, { type: 'atk', nom: tr('Fracture'), v: 11, cible: 'hasard' }] },
    motif: [
      { type: 'atk', nom: tr('Ressac'), v: 12, cible: 'hasard' },
      { type: 'atk', nom: tr('Débordement'), v: 7, zone: true },
      { type: 'boost' },
      { type: 'atk', nom: tr('Fracture'), v: 9, cible: 'faible' },
      { type: 'bouclier', v: 12 },
    ],
  },
  // ---------- Les Salles closes (−4 à −6) ----------
  {
    id: 'brigadier', nom: tr('Brigadier du Serment'), lignee: 'reso', tag: tr('BRIGADES DU SERMENT DE VEYR'), pvMax: 85,
    traits: [{ type: 'furie' }],
    motif: [
      { type: 'dissonance', nom: tr('Sommation') },
      { type: 'atk', nom: tr('Matraque'), v: 11, cible: 'hasard' },
      { type: 'bouclier', v: 12 },
      { type: 'atk', nom: tr('Charge'), v: 7, zone: true },
    ],
  },
  {
    id: 'echo-veilleur', nom: tr('Rémanent de veilleur'), lignee: 'reso', tag: tr('RÉMANENT'), pvMax: 78,
    traits: [{ type: 'evanescent', part: 0.25 }, { type: 'assimilation' }],
    motif: [
      { type: 'atk', nom: tr('Griffe d’ombre'), v: 12, cible: 'faible' },
      { type: 'dissonance', nom: tr('Murmure') },
      { type: 'atk', nom: tr('Hurlement'), v: 7, zone: true },
      { type: 'soin', nom: tr('Reflux'), v: 10 },
    ],
  },
  {
    id: 'sentinelle-verre', nom: tr('Sentinelle de verre'), lignee: 'tech', tag: tr('ANCIENNE MACHINE'), pvMax: 100,
    traits: [{ type: 'epines', part: 0.1 }],
    motif: [
      { type: 'bouclier', v: 15 },
      { type: 'atk', nom: tr('Réfraction'), v: 11, cible: 'bio' },
      { type: 'boost' },
      { type: 'atk', nom: tr('Rayon brisé'), v: 11, cible: 'hasard' },
    ],
  },
  {
    id: 'gardien-registres', nom: tr('Gardien des registres'), lignee: 'reso', tag: tr('BOSS · LES SALLES CLOSES'), pvMax: 175,
    traits: [{ type: 'blinde', v: 3 }],
    phase: { seuil: 0.5, nom: tr('Registre ouvert'), texte: tr('Le Gardien ouvre son registre et appelle un brigadier à la barre.'), renforts: ['brigadier'],
      motif: [{ type: 'atk', nom: tr('Rature'), v: 14, cible: 'faible' }, { type: 'dissonance', nom: tr('Sceau') }, { type: 'atk', nom: tr('Liste des noms'), v: 9, zone: true }, { type: 'boost' }] },
    motif: [
      { type: 'dissonance', nom: tr('Sceau') },
      { type: 'atk', nom: tr('Effacement'), v: 13, cible: 'hasard' },
      { type: 'atk', nom: tr('Liste des noms'), v: 8, zone: true },
      { type: 'boost' },
      { type: 'atk', nom: tr('Effacement'), v: 12, cible: 'faible' },
      { type: 'bouclier', v: 14 },
    ],
  },
  // ---------- Les Registres (−7 à −9) ----------
  {
    id: 'double', nom: tr('Double'), lignee: 'reso', tag: tr('ÉCHO DÉDOUBLÉ'), pvMax: 90,
    traits: [{ type: 'essaim', part: 0.35 }, { type: 'assimilation' }],
    motif: [
      { type: 'atk', nom: tr('Premier souvenir'), v: 12, cible: 'hasard' },
      { type: 'atk', nom: tr('Second souvenir'), v: 12, cible: 'hasard' },
      { type: 'dissonance', nom: tr('Contradiction') },
      { type: 'soin', nom: tr('Se rassembler'), v: 12 },
    ],
  },
  {
    id: 'essaim-ambre', nom: tr('Essaim d’ambre'), lignee: 'bio', tag: tr('FAUNE DES STRATES'), pvMax: 80,
    traits: [{ type: 'essaim', part: 0.4 }],
    motif: [
      { type: 'atk', nom: tr('Piqûres'), v: 6, zone: true },
      { type: 'atk', nom: tr('Piqûres'), v: 6, zone: true },
      { type: 'bouclier', v: 10 },
      { type: 'boost' },
    ],
  },
  {
    id: 'automate-graveur', nom: tr('Automate graveur'), lignee: 'tech', tag: tr('ANCIENNE MACHINE'), pvMax: 110,
    traits: [{ type: 'blinde', v: 3 }],
    motif: [
      { type: 'atk', nom: tr('Burin'), v: 13, cible: 'reso' },
      { type: 'bouclier', v: 12 },
      { type: 'atk', nom: tr('Burin'), v: 12, cible: 'faible' },
      { type: 'soin', nom: tr('Polissage'), v: 10 },
    ],
  },
  {
    id: 'tisseuse', nom: tr('Tisseuse de souvenirs'), lignee: 'bio', tag: tr('BOSS · MÉMOIRES MÊLÉES'), pvMax: 190,
    traits: [{ type: 'epines', part: 0.08 }],
    phase: { seuil: 0.5, nom: tr('Trame rompue'), texte: tr('La Tisseuse déchire sa trame : un essaim d’ambre s’en échappe.'), renforts: ['essaim-ambre'],
      motif: [{ type: 'atk', nom: tr('Fil tranchant'), v: 13, cible: 'faible' }, { type: 'atk', nom: tr('Trame'), v: 9, zone: true }, { type: 'soin', nom: tr('Retisser'), v: 12 }, { type: 'boost' }] },
    motif: [
      { type: 'atk', nom: tr('Fil'), v: 11, cible: 'faible' },
      { type: 'atk', nom: tr('Trame'), v: 8, zone: true },
      { type: 'dissonance', nom: tr('Nœud') },
      { type: 'soin', nom: tr('Retisser'), v: 14 },
      { type: 'boost' },
      { type: 'atk', nom: tr('Fil'), v: 12, cible: 'hasard' },
    ],
  },
  // ---------- Le Fond (−10 et plus) ----------
  {
    id: 'premier-porteur', nom: tr('Le Premier Porteur'), lignee: 'reso', tag: tr('BOSS · CEUX D’AVANT'), pvMax: 185,
    traits: [{ type: 'evanescent', part: 0.3 }],
    phase: { seuil: 0.5, nom: tr('Ceux d’avant'), texte: tr('Le Premier Porteur rappelle son double : ceux d’avant ne se battent jamais seuls.'), renforts: ['double'],
      motif: [{ type: 'atk', nom: tr('Marée ancienne'), v: 10, zone: true }, { type: 'dissonance', nom: tr('Dernière mise en garde') }, { type: 'atk', nom: tr('Souvenir de feu'), v: 15, cible: 'hasard' }, { type: 'boost' }, { type: 'atk', nom: tr('Dernier mot'), v: 14, cible: 'faible' }] },
    motif: [
      { type: 'dissonance', nom: tr('Mise en garde') },
      { type: 'atk', nom: tr('Souvenir de feu'), v: 13, cible: 'hasard' },
      { type: 'atk', nom: tr('Marée ancienne'), v: 8, zone: true },
      { type: 'soin', nom: tr('Se souvenir'), v: 15 },
      { type: 'boost' },
      { type: 'atk', nom: tr('Dernier mot'), v: 12, cible: 'faible' },
      { type: 'bouclier', v: 16 },
    ],
  },
  // ---------- Les Seuils (−1 à −3), en plus du Rémanent et de la Vigie ----------
  {
    id: 'rampeur', nom: tr('Rampeur des piliers'), lignee: 'bio', tag: tr('FAUNE DES SEUILS'), pvMax: 80,
    traits: [{ type: 'regeneration', part: 0.04 }],
    motif: [
      { type: 'atk', nom: tr('Morsure'), v: 9, cible: 'faible' },
      { type: 'bouclier', v: 9 },
      { type: 'atk', nom: tr('Constriction'), v: 5, zone: true },
      { type: 'atk', nom: tr('Morsure'), v: 10, cible: 'hasard' },
    ],
  },
  {
    // Bible, 23 octobre 2026 : un Résonant greffé sans Clinique ni Lecture, une brisure de marché noir (un « doré pâle »)
    id: 'sauvage', nom: tr('Sauvage'), lignee: 'reso', tag: tr('GREFFÉ SANS CLINIQUE'), pvMax: 66,
    traits: [{ type: 'vengeur' }],
    motif: [
      { type: 'atk', nom: tr('Penchant mal lu'), v: 10, cible: 'hasard' },
      { type: 'bouclier', v: 9 },
      { type: 'atk', nom: tr('Accès'), v: 12, cible: 'faible' },
      { type: 'atk', nom: tr('Ombre qui tremble'), v: 5, zone: true },
    ],
  },
  {
    id: 'pilleur', nom: tr('Pilleur de Strates'), lignee: 'tech', tag: tr('FOUILLEUR SANS LICENCE'), pvMax: 70,
    traits: [{ type: 'vengeur' }],
    motif: [
      { type: 'atk', nom: 'Pied-de-biche', v: 9, cible: 'hasard' },
      { type: 'bouclier', v: 11 },
      { type: 'atk', nom: tr('Coup bas'), v: 11, cible: 'faible' },
      { type: 'soin', nom: tr('Stimulant'), v: 8 },
    ],
  },
  // ---------- Les gardes d'un archipel pillé (pillage.ts) : un par Porteur de la garnison, joués par le district attaqué ----------
  {
    id: 'garde-tech', nom: tr('Garde augmenté'), lignee: 'tech', tag: 'GARNISON', pvMax: 72,
    motif: [
      { type: 'atk', nom: tr('Salve'), v: 10, cible: 'hasard' },
      { type: 'bouclier', v: 9 },
      { type: 'atk', nom: tr('Frappe ciblée'), v: 12, cible: 'faible' },
      { type: 'atk', nom: tr('Balayage'), v: 6, zone: true },
    ],
  },
  {
    id: 'garde-bio', nom: tr('Garde géné'), lignee: 'bio', tag: 'GARNISON', pvMax: 80,
    motif: [
      { type: 'atk', nom: tr('Morsure'), v: 9, cible: 'faible' },
      { type: 'bouclier', v: 11 },
      { type: 'soin', nom: tr('Sève'), v: 9 },
      { type: 'atk', nom: tr('Charge'), v: 11, cible: 'hasard' },
    ],
  },
  {
    id: 'garde-reso', nom: tr('Garde résonant'), lignee: 'reso', tag: 'GARNISON', pvMax: 64,
    motif: [
      { type: 'dissonance', nom: 'Contre-chant' },
      { type: 'atk', nom: tr('Onde'), v: 11, cible: 'hasard' },
      { type: 'atk', nom: tr('Réverbération'), v: 6, zone: true },
      { type: 'bouclier', v: 9 },
    ],
  },
  // ---------- Les Rôdeurs (31 octobre 2026, explorer.ts) : un par zone, croisé seulement en Explorer ----------
  // Il se bat quelques tours puis s'enfuit ; sa vie est gardée d'une descente à l'autre. Sa force est celle de la Strate
  // la plus profonde de sa zone (STRATE_RODEUR). Pas de trait au-delà d'un seul, lisible : c'est sa vie qui fait le défi.
  {
    id: 'maree-basse', nom: tr('Marée-Basse'), lignee: 'bio', tag: tr('RÔDEUR DES SEUILS'), pvMax: 175,
    traits: [{ type: 'regeneration', part: 0.02 }],
    motif: [
      { type: 'atk', nom: tr('Ressac'), v: 8, zone: true },
      { type: 'atk', nom: tr('Étreinte'), v: 13, cible: 'faible' },
      { type: 'bouclier', v: 12 },
      { type: 'atk', nom: tr('Ressac'), v: 9, zone: true },
    ],
  },
  {
    id: 'sentinelle-orpheline', nom: tr('Sentinelle orpheline'), lignee: 'tech', tag: tr('RÔDEUR DES SALLES CLOSES'), pvMax: 170,
    traits: [{ type: 'blinde', v: 2 }],
    motif: [
      { type: 'atk', nom: tr('Éclat perdu'), v: 13, cible: 'hasard' },
      { type: 'boost' },
      { type: 'atk', nom: tr('Seuil de verre'), v: 8, zone: true },
      { type: 'bouclier', v: 14 },
    ],
  },
  {
    id: 'liseur', nom: tr('Le Liseur'), lignee: 'reso', tag: tr('RÔDEUR DES REGISTRES'), pvMax: 150,
    traits: [{ type: 'evanescent', part: 0.2 }],
    motif: [
      { type: 'atk', nom: tr('Nom prononcé'), v: 14, cible: 'faible' },
      { type: 'dissonance', nom: tr('Lecture à voix haute') },
      { type: 'atk', nom: tr('Page tournée'), v: 8, zone: true },
      { type: 'soin', nom: tr('Relire'), v: 10 },
    ],
  },
  {
    id: 'plongeur', nom: tr('Le Plongeur'), lignee: 'tech', tag: tr('RÔDEUR DU FOND'), pvMax: 185,
    traits: [{ type: 'blinde', v: 3 }],
    motif: [
      { type: 'atk', nom: tr('Poids mort'), v: 15, cible: 'hasard' },
      { type: 'bouclier', v: 14 },
      { type: 'atk', nom: tr('Pression'), v: 9, zone: true },
      { type: 'atk', nom: tr('Poids mort'), v: 15, cible: 'faible' },
    ],
  },
];

/**
 * Les gardes de la Flèche (31 octobre 2026, Bryan : de vrais adversaires plutôt que ses propres Porteurs, et pas deux fois le même visage).
 * Payés par les Hauts. Mêmes forces que les gardes des pillages de leur lignée (la force du quai fait le reste) : seuls le visage et le nom changent.
 * Trois hauteurs (celles de la montée : quais 1 à 40, 41 à 70, 71 à 101), deux gardes par lignée et par hauteur ; un chef de quai
 * mène le combat qui passe un quai gravé. Prompts : docs/prompts-gardes-fleche.md.
 */
export const GARDES_FLC: { id: string; nom: string; lignee: Lignee; hauteur: 'bas' | 'milieu' | 'haut' | 'chef'; tag: string }[] = [
  { id: 'flc-arrimeur', nom: tr('Arrimeur des quais'), lignee: 'tech', hauteur: 'bas', tag: tr('GARDE DE LA FLÈCHE · QUAIS DU BAS') },
  { id: 'flc-treuilliste', nom: tr('Treuilliste'), lignee: 'tech', hauteur: 'bas', tag: tr('GARDE DE LA FLÈCHE · QUAIS DU BAS') },
  { id: 'flc-gaffeur', nom: tr('Gaffeur des Hauts'), lignee: 'bio', hauteur: 'bas', tag: tr('GARDE DE LA FLÈCHE · QUAIS DU BAS') },
  { id: 'flc-debardeuse', nom: tr('Débardeuse à carapace'), lignee: 'bio', hauteur: 'bas', tag: tr('GARDE DE LA FLÈCHE · QUAIS DU BAS') },
  { id: 'flc-brigadier', nom: tr('Brigadier de la Flèche'), lignee: 'reso', hauteur: 'bas', tag: tr('BRIGADES DU SERMENT DE VEYR') },
  { id: 'flc-vigie', nom: tr('Vigie des fanions'), lignee: 'reso', hauteur: 'bas', tag: tr('GARDE DE LA FLÈCHE · QUAIS DU BAS') },
  { id: 'flc-canonnier', nom: tr('Canonnier des nuages'), lignee: 'tech', hauteur: 'milieu', tag: tr('GARDE DE LA FLÈCHE · QUAIS DES NUAGES') },
  { id: 'flc-mecanicienne', nom: tr('Mécanicienne d’amarrage'), lignee: 'tech', hauteur: 'milieu', tag: tr('GARDE DE LA FLÈCHE · QUAIS DES NUAGES') },
  { id: 'flc-aile-verre', nom: tr('Sentinelle aux ailes de verre'), lignee: 'bio', hauteur: 'milieu', tag: tr('GARDE DE LA FLÈCHE · QUAIS DES NUAGES') },
  { id: 'flc-cordiere', nom: tr('Gardienne des cordages'), lignee: 'bio', hauteur: 'milieu', tag: tr('GARDE DE LA FLÈCHE · QUAIS DES NUAGES') },
  { id: 'flc-ecouteuse', nom: tr('Écouteuse des vents'), lignee: 'reso', hauteur: 'milieu', tag: tr('GARDE DE LA FLÈCHE · QUAIS DES NUAGES') },
  { id: 'flc-brigadiere', nom: tr('Brigadière du Serment'), lignee: 'reso', hauteur: 'milieu', tag: tr('BRIGADES DU SERMENT DE VEYR') },
  { id: 'flc-lancier', nom: tr('Lancier de la Garde blanche'), lignee: 'tech', hauteur: 'haut', tag: tr('GARDE DE LA FLÈCHE · QUAIS DES ÎLES') },
  { id: 'flc-duelliste', nom: tr('Duelliste de la Garde blanche'), lignee: 'tech', hauteur: 'haut', tag: tr('GARDE DE LA FLÈCHE · QUAIS DES ÎLES') },
  { id: 'flc-orseve', nom: tr('Garde de la Maison Orsève'), lignee: 'bio', hauteur: 'haut', tag: tr('GARDE DE LA FLÈCHE · QUAIS DES ÎLES') },
  { id: 'flc-intendante', nom: tr('Intendante des Hauts'), lignee: 'bio', hauteur: 'haut', tag: tr('GARDE DE LA FLÈCHE · QUAIS DES ÎLES') },
  { id: 'flc-heraut', nom: tr('Héraut de la Clause'), lignee: 'reso', hauteur: 'haut', tag: tr('GARDE DE LA FLÈCHE · QUAIS DES ÎLES') },
  { id: 'flc-chantre', nom: tr('Chantre des Sièges'), lignee: 'reso', hauteur: 'haut', tag: tr('GARDE DE LA FLÈCHE · QUAIS DES ÎLES') },
  { id: 'flc-contremaitre', nom: tr('Contremaître des quais'), lignee: 'bio', hauteur: 'chef', tag: tr('CHEF DE QUAI · QUAIS GRAVÉS 20 ET 40') },
  { id: 'flc-hald', nom: tr('Capitaine Hald'), lignee: 'reso', hauteur: 'chef', tag: tr('CHEF DE QUAI · BRIGADES DU SERMENT') },
  { id: 'flc-commandeur', nom: tr('Commandeur de la Garde blanche'), lignee: 'tech', hauteur: 'chef', tag: tr('CHEF DE QUAI · QUAIS GRAVÉS 80 ET 90') },
  { id: 'flc-champion', nom: tr('Champion des Hauts'), lignee: 'tech', hauteur: 'chef', tag: tr('CHEF DE QUAI · LE DERNIER QUAI') },
];
for (const g of GARDES_FLC) {
  const modele = ENNEMIS.find((e) => e.id === `garde-${g.lignee}`)!;
  ENNEMIS.push({ ...modele, id: g.id, nom: g.nom, tag: g.tag });
}

// ---------- Les traits des ennemis (décision du 22 octobre 2026) : leur nom et ce qu'ils font, pour l'écran ----------
export function texteTrait(t: import('./types').Trait): { nom: string; texte: string } {
  switch (t.type) {
    case 'blinde': return { nom: tr('Blindé'), texte: tr`Chaque carte qui le frappe perd ${t.v} dégâts, un peu plus quand il est plus fort (plus bas dans les Strates). Perçant passe outre. Sa Fêlure ne retire qu’un quart de son intention.` };
    case 'regeneration': return { nom: tr('Régénération'), texte: tr`Regagne ${Math.round(t.part * 100)} % de ses PV max à la fin de son tour.` };
    case 'epines': return { nom: tr('Épines'), texte: tr`Renvoie ${Math.round(t.part * 100)} % des dégâts au Porteur qui frappe (sans le mettre à terre).` };
    case 'evanescent': return { nom: tr('Évanescent'), texte: tr`Hors Résonance, tes coups ne lui font que ${Math.round((1 - t.part) * 100)} % de leurs dégâts : fais des suites. Sa Fêlure reste cachée.` };
    case 'essaim': return { nom: tr('Essaim'), texte: tr('Quand il tombe, un rejeton plus petit surgit (une fois).') };
    case 'vengeur': return { nom: tr('Vengeur'), texte: tr('Quand un allié tombe, sa prochaine attaque est doublée.') };
    case 'furie': return { nom: tr('Furie'), texte: tr('Sous la moitié de ses PV, ses attaques font +30 %.') };
    case 'assimilation': return { nom: tr('Assimilation'), texte: tr('À la fin de ta chaîne, il prend la lignée de la dernière carte qui l’a frappé : ses forces et ses faiblesses changent avec elle.') };
    case 'aspire': return { nom: tr('Aspiration'), texte: tr`Si son coup passe ton bouclier, il aspire ${t.v} Flux à l’escouade. Bloque-le, ou dépense ton Flux avant.` };
  }
}

// ---------- Les conditions de salle (décision du 22 octobre 2026 : varier les combats) ----------
// Tirées sur la carte de la Strate, visibles avant d'entrer : elles changent la façon de jouer la salle, pas seulement les chiffres.
interface ConditionDef { id: string; nom: string; texte: string }
export const CONDITIONS: Record<string, ConditionDef> = {
  inondee: { id: 'inondee', nom: tr('Salle inondée'), texte: tr('L’eau porte les Génés : leurs cartes font +20 %.') },
  courants: { id: 'courants', nom: tr('Câbles à nu'), texte: tr('Le courant court partout : les cartes des Augmentés font +20 %.') },
  chant: { id: 'chant', nom: tr('Pierre qui chante'), texte: tr('La roche résonne : les cartes des Résonants font +20 %.') },
  echo: { id: 'echo', nom: tr('Écho ancien'), texte: tr('Une suite de 4 résonne comme une suite de 5.') },
  sanctuaire: { id: 'sanctuaire', nom: tr('Source tiède'), texte: tr('Les soins de l’escouade font +30 %.') },
  eboulis: { id: 'eboulis', nom: tr('Éboulis'), texte: tr('À chaque tour ennemi, des pierres tombent sur tout le monde (escouade et ennemis), sans jamais mettre personne à terre.') },
  brouillard: { id: 'brouillard', nom: tr('Brouillard'), texte: tr('Tout le combat, on voit ce que prépare l’ennemi, mais jamais combien ni sur qui. Sa Fêlure reste cachée.') },
};
/** La lignée que favorise une condition (+20 % à ses cartes) */
export const FAVEUR_CONDITION: Record<string, Lignee> = { inondee: 'bio', courants: 'tech', chant: 'reso' };

/**
 * Les zones des Strates : plus on descend, plus c'est ancien (Bible du lore).
 * Une expédition = deux combats tirés dans la zone, puis son gardien.
 */
export const ZONES: { nom: string; jusqua: number; ennemis: string[]; boss: string }[] = [
  { nom: tr('Les Seuils'), jusqua: 3, ennemis: ['remanent', 'vigie', 'rampeur', 'pilleur', 'sauvage'], boss: 'confluence' },
  { nom: tr('Les Salles closes'), jusqua: 6, ennemis: ['brigadier', 'echo-veilleur', 'sentinelle-verre', 'remanent'], boss: 'gardien-registres' },
  { nom: tr('Les Registres'), jusqua: 9, ennemis: ['double', 'essaim-ambre', 'automate-graveur', 'echo-veilleur'], boss: 'tisseuse' },
  { nom: tr('Le Fond'), jusqua: Infinity, ennemis: ['double', 'automate-graveur', 'sentinelle-verre', 'echo-veilleur'], boss: 'premier-porteur' },
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
  if (!p) throw new Error(tr('Porteur inconnu : ') + id);
  return p;
};

export const ennemiDef = (id: string): EnnemiDef => {
  const e = ENNEMIS.find((x) => x.id === id);
  if (!e) throw new Error(tr('Ennemi inconnu : ') + id);
  return e;
};

/** Une vraie carte de collection ? (les cartes du district, Stimulant et Pavois de cuivre, n'en sont pas) */
export const estCarteConnue = (cle: string): boolean => { try { moduleDef(cle); return true; } catch { return false; } };

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
  if (!m || (metal !== undefined && !METAUX.includes(metal))) throw new Error(tr('Carte inconnue : ') + cle);
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
/** @param crans crans d'effet gagnés par le niveau de la carte (collection.ts : niveaux 3 et 5, +20 % de la part chacun) */
export function gesteDeCarte(cle: string, porteur: string, mult = 1, crans = 0): GesteDef {
  const m = moduleDef(cle);
  const monte = (e: Effet) => (crans && 'part' in e && e.type !== 'decharge' ? renforcer(e, 1 + 0.2 * crans) : e);
  return {
    id: cle, carte: cle, porteur, nom: m.nom, f: m.f[0]!, ...(m.f.length > 1 ? { fs: m.f.slice() } : {}), type: m.type, v: Math.round(m.v * mult),
    ...(m.lourd ? { lourd: true } : {}), ...(m.effet ? { effet: monte(m.effet) } : {}), ...(m.effet2 ? { effet2: monte(m.effet2) } : {}),
  };
}

/** Le deck de départ : les 6 cartes en fer d'Ilka, de Doran et de Véla, plus les 2 cartes du district (20 cartes) */
export const DECK_DEPART: GesteDef[] = [
  ...Object.entries(DEPART_PORTEURS).flatMap(([p, ids]) => ids.map((id) => gesteDeCarte(carteId(id, 'fer'), p))),
  ...GESTES_SPECIAUX,
];
