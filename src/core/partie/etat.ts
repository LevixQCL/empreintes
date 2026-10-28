// Couche 1 — l'état d'une partie : réglages du district, types, expérience et Marques des Porteurs, Confiance, creuseurs, escouade.
// Fonctions pures : le temps est toujours passé en paramètre (`now`, en ms).

import { batimentDef, porteurDef, PORTEURS } from '../donnees';
import { PLACES_PORTEUR, chargeNiveau, poidsCarte, type CarteCollection } from '../collection';
import type { Expedition } from '../expedition';
import type { Palmares } from '../classements';
import type { BatimentId, GesteDef, BonusMarques } from '../types';

export const VERSION_JEU = 7;

/** Réglages du district, au même endroit pour l'équilibrage */
export const DISTRICT = {
  /** énergie par heure selon le niveau du Générateur (index = niveau) */
  energieParHeure: [0, 60, 110, 180, 260, 350],
  /** stockage maximum selon le niveau du Noyau */
  stockage: [0, 300, 650, 1300, 2300, 4100],
  /** points d'Usure soignés par heure selon le niveau de la Clinique */
  soinParHeure: [0, 6, 10, 16, 22, 30],
  /** durée du chantier pour atteindre un niveau, en minutes (index = niveau visé) */
  chantierMinutes: [0, 0, 0, 5, 30, 120, 240, 720, 1440, 2160, 2880],
  /** chantiers en même temps : 1, puis 2 à partir du Noyau niveau 4 */
  chantiersNoyau2: 4,
  /** bonus d'un Porteur posté : de la bonne lignée / d'une autre lignée */
  bonusAffinite: 2,
  bonusPoste: 1.5,
  /** Usure gagnée par expédition, et en plus si le Porteur finit à terre */
  usureExpedition: 6,
  usureATerre: 3,
  /** Usure maximale, en fraction des PV max */
  usureMaxRatio: 0.5,
  /** cartes qu'un Porteur peut porter (décision du 22 octobre 2026 : la carte qu'on collectionne est celle qu'on joue) ;
   *  ce sont aussi ses places en combat, remplies ou vides (`PLACES_PORTEUR`) */
  cartesMax: PLACES_PORTEUR,
  /** cartes qu'il faut au deck de l'escouade (cartes du district comprises) pour descendre */
  deckMin: 12,
  /** part du butin gardée après une défaite */
  butinDefaite: 0.5,
  /** fuir un combat jusqu'au district (22 octobre 2026) : part des composants gardée, et Usure en plus pour chaque Porteur */
  butinFuite: 0.75,
  usureFuite: 3,
  depart: { energie: 120, composants: 20 },
} as const;

/** Points d'Archive gagnés, et paliers de la semaine */
export const ARCHIVE = {
  points: { combat: 2, expedition: 5, chantier: 3, quotidien: 5 },
  /** le 4e palier récompense les joueurs assidus : un choix d'argent de plus et des Éclats */
  paliers: [30, 80, 160, 300],
} as const;

/** Lundi 5 janvier 2026, 4 h du matin à Bruxelles : point de départ des jours et des semaines du jeu */
const EPOQUE = Date.UTC(2026, 0, 5, 3);
export const jourDe = (now: number) => Math.floor((now - EPOQUE) / 86_400_000);
export const semaineDe = (now: number) => Math.floor(jourDe(now) / 7);
/** Le début d'un jour du jeu, en ms (4 h du matin à Bruxelles) */
export const debutJour = (jour: number) => EPOQUE + jour * 86_400_000;
/** Début de la semaine suivante, en ms */
export const lundiSuivant = (now: number) => EPOQUE + (semaineDe(now) + 1) * 7 * 86_400_000;

/** Les postes du district : les trois bâtiments qui produisent (POSTES), et l'entraînement à la Tour du Noyau */
export type Poste = Exclude<BatimentId, 'comptoir'>;
export const POSTES: Exclude<Poste, 'noyau'>[] = ['generateur', 'forge', 'clinique'];

export interface PorteurDistrict {
  usure: number;
  poste: Poste | null;
  /** les cartes qu'on lui a confiées (exemplaires « carte@métal ») : sa part du deck de combat */
  modules: string[];
  /** ce que le Porteur a vécu, pour ses Marques */
  faits?: Partial<Record<Fait, number>>;
  /** expérience gagnée en combattant et en mission (décision du 22 octobre 2026) */
  xp?: number;
}

// ---------- L'expérience des Porteurs (décision du 22 octobre 2026) ----------
// Les cartes montent avec les doublons ; les Porteurs, eux, montent en combattant : leurs PV suivent la force des cartes.
// Un niveau = +4 % des PV de base. Le niveau ne touche pas aux cartes : la force vient toujours de la collection.
export const XP = {
  /** par combat gagné dans une Strate, ×(1 + 0,25 × (Strate − 1)) */
  combat: 10,
  /** en plus pour une salle scellée vaincue, et pour le gardien */
  elite: 10,
  gardien: 30,
  /** par heure de mission */
  missionHeure: 4,
  /** un Porteur en retard de 2 niveaux ou plus sur le plus avancé du district apprend plus vite (×1,5) */
  rattrapage: 1.5,
  niveauMax: 20,
  pvParNiveau: 0.04,
};
/** XP pour passer du niveau n au niveau n+1 */
export const xpPourNiveau = (n: number) => Math.round(12 * n ** 1.6);
/** Niveau d'un Porteur, et ce qu'il a déjà vers le suivant */
export function niveauPorteur(j: Pick<Jeu, 'porteurs'>, id: string): { niveau: number; xp: number; requis: number | null } {
  let reste = Math.floor(j.porteurs[id]?.xp ?? 0);
  let n = 1;
  while (n < XP.niveauMax && reste >= xpPourNiveau(n)) { reste -= xpPourNiveau(n); n++; }
  return { niveau: n, xp: reste, requis: n >= XP.niveauMax ? null : xpPourNiveau(n) };
}
/** PV de base d'un Porteur à son niveau (avant l'Usure et les choix d'histoire) */
export const pvNiveau = (j: Pick<Jeu, 'porteurs'>, id: string) => Math.round(porteurDef(id).pvMax * (1 + XP.pvParNiveau * (niveauPorteur(j, id).niveau - 1)));
/** La Charge qu'un Porteur peut porter à son niveau, et celle que pèsent ses cartes */
export const chargeMax = (j: Pick<Jeu, 'porteurs'>, id: string) => chargeNiveau(niveauPorteur(j, id).niveau);
export const chargePortee = (j: Pick<Jeu, 'porteurs'>, id: string) => (j.porteurs[id]?.modules ?? []).reduce((n, k) => n + poidsCarte(k), 0);
/** Donne de l'XP à un Porteur ; renvoie son nouveau niveau s'il en a pris un */
export function gagnerXp(j: Jeu, id: string, xp: number): number | null {
  const d = j.porteurs[id];
  if (!d || xp <= 0) return null;
  const avant = niveauPorteur(j, id).niveau;
  const tete = Math.max(...Object.keys(j.porteurs).map((k) => niveauPorteur(j, k).niveau));
  d.xp = (d.xp ?? 0) + Math.round(xp * (tete - avant >= 2 ? XP.rattrapage : 1));
  const apres = niveauPorteur(j, id).niveau;
  if (apres > avant) {
    log(j, `${porteurDef(id).nom} passe au niveau ${apres} : ${pvNiveau(j, id)} PV.`);
    return apres;
  }
  return null;
}

// ---------- Les Marques des Porteurs (Bible) ----------
// Un seuil franchi laisse une Marque permanente, qui change le combat quand le Porteur est dans l'escouade.
// Depuis le 22 octobre 2026, chaque Porteur a la sienne (Bryan : choisir un Porteur doit changer quelque chose).
/** Ce que vit un Porteur et qu'on compte pour sa Marque */
type Fait = 'expeditions' | 'fondations' | 'anciens' | 'scellees' | 'abysses' | 'gardiens' | 'combats' | 'missions';
/** court : l'effet en quelques mots, pour l'écran de l'escouade */
interface MarqueDef { nom: string; fait: Fait; seuil: number; texte: string; court: string; quoi: string; bonus: BonusMarques }
export const MARQUES: Record<string, MarqueDef> = {
  ilka: { nom: 'Raccourci', fait: 'expeditions', seuil: 30, quoi: 'expéditions réussies', court: '+1 place au premier tour', bonus: { places: 1 },
    texte: 'Elle connaît tous les raccourcis : +1 place dans la chaîne au premier tour de chaque combat.' },
  doran: { nom: 'Fondations', fait: 'fondations', seuil: 20, quoi: 'combats dans les Fondations', court: '8 de bouclier au départ', bonus: { bouclier: 8 },
    texte: 'Il couvre les siens : chaque combat commence avec 8 de bouclier d’escouade.' },
  vela: { nom: 'Lectrice', fait: 'anciens', seuil: 10, quoi: 'empreintes anciennes vaincues', court: 'insensible à la Dissonance', bonus: { lucide: true },
    texte: 'Elle lit les Échos : la Dissonance n’a plus de prise sur l’escouade.' },
  sasha: { nom: 'Seconde chance', fait: 'scellees', seuil: 10, quoi: 'salles scellées ouvertes', court: 'relève le premier qui tombe', bonus: { releve: 0.25 },
    texte: 'Il remet tout le monde d’aplomb : une fois par combat, le premier Porteur qui tombe se relève avec 25 % de ses PV.' },
  nuit: { nom: 'Œil de nuit', fait: 'abysses', seuil: 25, quoi: 'combats gagnés sous la Strate −3', court: 'l’ennemi commence fissuré', bonus: { fissure: 0.25 },
    texte: 'Elle voit la faille dans le noir : l’ennemi visé commence chaque combat fissuré (+25 % de dégâts pendant deux tours).' },
  aurel: { nom: 'Ombre courtoise', fait: 'gardiens', seuil: 6, quoi: 'gardiens vaincus', court: '1re attaque ennemie −40 %', bonus: { desarme: 0.4 },
    texte: 'Son ombre retient le premier coup : au premier tour, l’attaque annoncée de chaque ennemi perd 40 % de sa force.' },
  coursier: { nom: 'Foulée', fait: 'combats', seuil: 40, quoi: 'combats gagnés', court: '1 Flux au départ', bonus: { flux: 1 },
    texte: 'Il court devant l’escouade : chaque combat commence avec 1 Flux.' },
  docker: { nom: 'Bras de quai', fait: 'missions', seuil: 8, quoi: 'missions accomplies', court: 'garde 25 % du bouclier', bonus: { garde: 0.25 },
    texte: 'Il ne lâche rien : à chaque tour, l’escouade garde 25 % de son bouclier pour le tour suivant.' },
  guetteur: { nom: 'Guet', fait: 'anciens', seuil: 12, quoi: 'empreintes anciennes vaincues', court: '+1 carte au premier tour', bonus: { main: 1 },
    texte: 'Il voit venir de loin : au premier tour de chaque combat, ta main compte une carte de plus.' },
  kessa: { nom: 'Née-de-mue', fait: 'fondations', seuil: 25, quoi: 'combats dans les Fondations', court: 'le bouclier renvoie 30 % des coups', bonus: { chitine: 0.3 },
    texte: 'Sa chitine pique qui la frappe : quand le bouclier d’escouade encaisse un coup, 30 % de ce qu’il absorbe revient à l’ennemi.' },
  liane: { nom: 'Galons blancs', fait: 'scellees', seuil: 12, quoi: 'salles scellées ouvertes', court: '+1 Flux par Fêlure résonnante', bonus: { felureFlux: 1 },
    texte: 'Chaque implant est un galon : une Fêlure brisée par une chaîne qui résonne donne 1 Flux de plus.' },
  joss: { nom: 'Nuit blanche', fait: 'combats', seuil: 35, quoi: 'combats gagnés', court: 'soigne le plus blessé chaque tour', bonus: { veille: 0.06 },
    texte: 'Le quartier entier l’a veillé, il veille à son tour : à la fin de chaque tour ennemi, le Porteur le plus blessé récupère 6 % de ses PV.' },
};
export const progresMarque = (j: Jeu, id: string) => {
  const m = MARQUES[id];
  return m ? { ...m, n: j.porteurs[id]?.faits?.[m.fait] ?? 0, acquise: (j.porteurs[id]?.faits?.[m.fait] ?? 0) >= m.seuil } : null;
};
/** Les Marques acquises des Porteurs de l'escouade : chacune apporte son bonus au combat */
export function bonusEscouade(j: Jeu, escouade: string[]): BonusMarques {
  const b: BonusMarques = {};
  for (const id of escouade) if (progresMarque(j, id)?.acquise) Object.assign(b, MARQUES[id]!.bonus);
  return b;
}

/** La Forge refabrique un exemplaire d'une carte déjà trouvée */
interface Fabrication {
  moduleId: string;
  debut: number;
  fin: number;
}

export interface Chantier {
  batiment: BatimentId;
  debut: number;
  fin: number;
}

/** Un choix de carte en attente (boss, objectif du jour, Archive) */
export interface Choix {
  source: 'boss' | 'quotidien' | 'archive' | 'ravitaillement' | 'fouille' | 'epreuve';
  options: string[];
  /** le joueur peut prendre des Éclats à la place */
  eclats?: number;
}

type TypeQuotidien = 'combats' | 'expedition' | 'chantier';
export const QUOTIDIENS: Record<TypeQuotidien, { titre: string; objectif: number }> = {
  combats: { titre: 'Gagner 4 combats', objectif: 4 },
  expedition: { titre: 'Vaincre un gardien, réussir une fouille ou une Épreuve', objectif: 1 },
  chantier: { titre: 'Lancer une amélioration de bâtiment', objectif: 1 },
};

/** Une séance d'entraînement à la Tour du Noyau : un niveau, payé au lancement (refonte du 28 octobre 2026) */
export interface Seance {
  porteur: string;
  /** le niveau que la séance fait atteindre */
  cible: number;
  xpTotale: number;
  xpGagnee: number;
  xpHeure: number;
  /** énergie payée au lancement (0 pour une séance reprise d'une ancienne sauvegarde) */
  energie: number;
}

export interface Jeu {
  version: number;
  energie: number;
  composants: number;
  batiments: Record<BatimentId, number>;
  porteurs: Record<string, PorteurDistrict>;
  forge: Fabrication | null;
  /** la séance d'entraînement en cours à la Tour (null : salle libre) */
  seance?: Seance | null;
  /** le dernier Porteur à avoir fini une séance, proposé en premier pour la relancer */
  derniereSeance?: string;
  /** Strate la plus profonde ouverte (le prochain étage à creuser) */
  strate: number;
  dernierTick: number;
  expedition: Expedition | null;
  journal: string[];
  /** l'intro du premier lancement a été vue */
  introVue: boolean;
  /** le tuto « Ton district » (après la chambre) a été lu jusqu'au bout : tant qu'il ne l'est pas, il revient à l'ouverture */
  accueilVu?: boolean;
  /** la chambre scellée a été ouverte (fin du combat guidé) */
  chambre: boolean;
  /** les trois recrues anonymes ont rejoint le district */
  recrues: boolean;
  /** les Porteurs de l'histoire arrivés plus tard (Sasha, Nuit, Aurel) */
  arrives: string[];
  /** les grands choix de la campagne (Bible : un choix important par acte) */
  actes: { chambre?: GardeChambre; lecture?: LectureVela; fin?: FinCampagne };
  /** la Confiance du quartier, en points cumulés (elle ne fait que monter ; le niveau se lit avec `niveauConfiance`) */
  confiance: number;
  /** niveaux de Confiance déjà récompensés (un creuseur volontaire par niveau) */
  confianceRecue?: number;
  /** les mécaniques de combat déjà expliquées la première fois qu'elles sont apparues (decouvertes.ts) */
  decouvertes?: string[];
  /** les scènes de la campagne déjà jouées, dans l'ordre (campagne.ts) */
  scenes?: string[];
  /** index de l'objectif guidé en cours (OBJECTIFS.length = tous faits) */
  objectif: number;
  /** fragments d'archives trouvés, dans l'ordre */
  fragments: string[];
  /** chapitres des Chroniques déjà lus */
  lus: string[];
  /** chapitres dont la première lecture a déjà rapporté sa carte */
  luesRecompensees: string[];
  /** les recrues ont reçu leur kit de départ (3 cartes chacune) */
  kitRecrues: boolean;
  /** Ravitaillement du jour : colis en réserve (3 au plus, rien ne se perd), dernier jour compté, colis déjà ouverts */
  ravitaillement: { jour: number; reserve: number; ouverts: number };
  /** les pillages : jetons, coffre et attaques à envoyer (pillages.ts) ; absent avant le premier */
  pillage?: import('./pillages').EtatPillage;
  /** la Flèche : le quai atteint, le record, les quais gravés reçus (fleche.ts) ; absente avant la première montée */
  fleche?: import('./fleche').EtatFleche;
  eclats: number;
  /** les cartes possédées */
  collection: Record<string, CarteCollection>;
  /** cartes tirées depuis la dernière de chaque rareté, pour les garanties */
  sans: { argent: number; or: number; nacre: number };
  /** hasard des trouvailles (déterministe, sauvegardé) */
  rng: number;
  chantiers: Chantier[];
  choix: Choix[];
  /** objectif du jour : jours en réserve (3 au plus) et progression */
  quotidien: { jour: number; reserve: number; type: TypeQuotidien; progres: number };
  /** Archive de la semaine : points de la semaine en cours, paliers à ouvrir de la semaine passée */
  archive: { semaine: number; points: number; aOuvrir: number };
  /** les Porteurs partis en mission dans une Strate déjà vaincue */
  missions: Mission[];
  /** les rapports des missions rentrées : ceux pas encore lus s'ouvrent au district, les derniers lus restent consultables */
  rapports?: RapportMission[];
  /** Épreuves de la semaine déjà réussies (une récompense par Épreuve et par semaine) */
  epreuves: { semaine: number; faites: string[] };
  /** le Comptoir du jour : ses offres, celles déjà achetées, et son propre hasard (il ne touche pas aux trouvailles) */
  comptoir: Comptoir;
  /** le convertisseur du Générateur : le jour du jeu et les lots déjà convertis ce jour-là */
  conversion?: { jour: number; lots: number };
  /** « Mon escouade » (décision du 23 octobre 2026) : les trois Porteurs qui descendent. Elle ne change qu'au district,
   *  jamais pendant une descente (sinon c'est trop facile). Ancienne sauvegarde : complétée par `migrer`. */
  escouade: string[];
  /** les trois escouades enregistrées (25 octobre 2026) : un Porteur n'est que dans une seule. Celle d'indice
   *  `escouadeActive` est celle qui descend, et `escouade` en est toujours la copie (c'est elle qui fait foi). */
  escouades: string[][];
  escouadeActive: number;
  /** l'escouade qui garde le port contre les pillages (27 octobre 2026) ; absente : celle qui descend */
  escouadeDefense?: number;
  /** les Porteurs et les cartes déjà vus par le joueur : le reste porte une pastille « Nouveau » (23 octobre 2026) */
  vus: { porteurs: string[]; cartes: string[] };
  /** les creuseurs du front de taille : il en faut assez pour creuser l'étage suivant (logés selon le niveau du Noyau) */
  creuseurs: number;
  /** le gardien de la Strate la plus profonde est vaincu : l'étage suivant attend d'être creusé */
  frontVaincu: boolean;
  /** les fils des Porteurs : nombre d'étapes faites par Porteur (23 octobre 2026) */
  fils?: Record<string, number>;
  /** l’Héritage du district choisi dans la lettre de la directrice (27 octobre 2026) : une carte de l’Héritage, ou « cle » (la Clé de l’Héritage) */
  legs?: string;
  /** le dernier âge du district montré au joueur (fenêtre « nouvel âge », 23 octobre 2026) */
  ageVu?: number;
  /** la dernière Strate où le jeu a proposé de protéger la partie (compte invisible) : une seule fois par palier */
  rappelCompte?: number;
  /** les statistiques pour l'équilibrage (partie/stats.ts) */
  stats?: import('./stats').Stats;
  /** le Grand Tableau (23 octobre 2026) : records personnels et scores du début de semaine (classements.ts) */
  palmares?: Palmares;
  /** le nom de directeur choisi pour le Grand Tableau, et si on y apparaît (jamais l'e-mail du compte) */
  directeur?: { nom: string; public: boolean; /** dernier changement de pseudo (ms) : un par semaine au plus */ change?: number };
}

/** Acte I, le choix : qui garde la chambre ? */
export type GardeChambre = 'orseve' | 'district' | 'commission';
/** Acte II, le choix : autoriser Véla à une dernière lecture profonde, au risque de briser le lien avec son empreinte */
export type LectureVela = 'autoriser' | 'refuser';
/** Acte III, la vérité : trois fins, aucune n'est « la bonne » (Bible) */
export type FinCampagne = 'scellement' | 'pacte' | 'archives';
/** Ce que la dernière lecture a changé chez Véla */
export const bonusPv = (j: Jeu, id: string) => (id === 'vela' ? (j.actes.lecture === 'autoriser' ? -4 : j.actes.lecture === 'refuser' ? 4 : 0) : 0);
/** la carte que Véla gagne après la dernière lecture : la sienne, en plus de ses 6 cartes */
export const LECTURE_PROFONDE: GesteDef = { id: 'lecture-profonde', porteur: 'vela', nom: 'Lecture profonde', f: 8, type: 'atk', v: 16, effet: { type: 'accord' } };

export interface Resultat {
  ok: boolean;
  message?: string;
}

export const non = (message: string): Resultat => ({ ok: false, message });

export const typeDuJour = (jour: number): TypeQuotidien => (['combats', 'expedition', 'chantier'] as const)[((jour % 3) + 3) % 3]!;

/**
 * Jusqu'où une partie est allée, pour choisir entre deux sauvegardes (appareil ou compte) sans jamais faire reculer
 * le joueur (25 octobre 2026 : une partie neuve sur PC, plus « récente », écrasait celle avancée sur le téléphone).
 * Profondeur d'abord, puis l'expérience des Porteurs, puis les niveaux des bâtiments, puis la collection.
 */
export function avancement(j: Jeu): number[] {
  const xp = Object.values(j.porteurs ?? {}).reduce((n, p) => n + (p.xp ?? 0), 0);
  const bat = Object.values(j.batiments ?? {}).reduce((n, v) => n + v, 0);
  return [j.strate * 2 + (j.frontVaincu ? 1 : 0), Math.floor(xp), bat, Object.keys(j.collection ?? {}).length];
}
/** 1 si a est plus avancée que b, -1 si moins, 0 si à égalité */
export function compareAvancement(a: Jeu, b: Jeu): number {
  const x = avancement(a), y = avancement(b);
  for (let i = 0; i < x.length; i++) if (x[i] !== y[i]) return x[i]! > y[i]! ? 1 : -1;
  return 0;
}

export function log(j: Jeu, t: string) {
  j.journal.unshift(t);
  j.journal = j.journal.slice(0, 8);
}

// ---------- Lecture ----------

export const enExpedition = (j: Jeu, id: string) => (!!j.expedition && j.expedition.porteurs.some((p) => p.id === id)) || enMission(j, id);
export const enMission = (j: Jeu, id: string) => !!j.missions?.some((m) => m.porteur === id);
export const posteDe = (j: Jeu, b: Poste) => Object.keys(j.porteurs).find((id) => j.porteurs[id]!.poste === b) ?? null;
export const stockage = (j: Jeu) => DISTRICT.stockage[j.batiments.noyau] ?? 0;
export const pvMaxCombat = (j: Jeu, id: string) => pvNiveau(j, id) + bonusPv(j, id) - Math.floor(j.porteurs[id]!.usure);
export const usureMax = (id: string) => Math.floor(porteurDef(id).pvMax * DISTRICT.usureMaxRatio);

export function multiplicateur(j: Jeu, b: Exclude<Poste, 'noyau'>): number {
  const id = posteDe(j, b);
  if (!id) return 1;
  return porteurDef(id).lignee === batimentDef(b).affinite ? DISTRICT.bonusAffinite : DISTRICT.bonusPoste;
}

export const energieParHeure = (j: Jeu) => Math.round((DISTRICT.energieParHeure[j.batiments.generateur] ?? 0) * multiplicateur(j, 'generateur'));

// ---------- La Confiance du quartier ----------
// Refaite le 27 octobre 2026 (Bryan : « celui qui joue est récompensé », plutôt que « celui qui ne joue pas est puni ») :
// elle ne fait que monter, par niveaux (une roue dans la barre du haut). Chaque niveau atteint amène un creuseur volontaire
// (`recompenserConfiance` dans district.ts). Elle ne baisse jamais : ni défaite, ni absence, ni mauvais choix.
export const CONFIANCE = {
  /** par combat gagné en descente, en plus pour une descente réussie, par chantier terminé, par pillage réussi */
  combat: 1, victoire: 3, chantier: 2, pillage: 4,
  /** points pour passer du niveau n au niveau n + 1 : `seuil × (n + 1)` (20, puis 40, 60…) */
  seuil: 20,
  /** niveau de Confiance qu'il faut pour l'Accord ouvert (avec la Clinique) */
  accord: 2,
} as const;

/** Le niveau de Confiance, les points dans ce niveau et ceux qu'il faut pour le suivant */
export function niveauConfiance(points: number): { niveau: number; dans: number; requis: number } {
  let niveau = 0, base = 0;
  while (points >= base + CONFIANCE.seuil * (niveau + 1)) { base += CONFIANCE.seuil * (niveau + 1); niveau++; }
  return { niveau, dans: points - base, requis: CONFIANCE.seuil * (niveau + 1) };
}

/** La Confiance gagnée (jamais perdue : un nombre négatif ou nul ne fait rien) */
export function confier(j: Jeu, delta: number) {
  if (delta > 0) j.confiance = Math.round((j.confiance ?? 0) + delta);
}

/**
 * L'Accord ouvert (Bible, 23 octobre 2026) : quand le quartier fait confiance à son directeur et que la Clinique
 * sait greffer, elle offre une pierre relevée à tout volontaire du quartier. Un nouveau Résonant rejoint le district.
 */
export const ACCORD_OUVERT = { clinique: 3, confiance: CONFIANCE.accord } as const;

export const CREUSEURS = {
  /** creuseurs logés selon le niveau du Noyau (index = niveau) */
  logement: [0, 4, 7, 10, 14, 24],
  /** creuseurs qu'il faut pour ouvrir la Strate −n, qui y restent (au-delà de la table : +1 par Strate, au plus le logement) */
  requis: [0, 0, 2, 3, 4, 5, 6, 7, 9, 11, 13] as number[],
  parStrateEnsuite: 1,
  gardien: 1,
  /** chances de ramener un fouilleur perdu : fouille ciblée, mission courte, mission longue */
  fouille: 0.25,
  missionCourte: 0.1,
  missionLongue: 0.3,
  epreuve: 1,
  /** creuseurs volontaires par niveau de Confiance atteint */
  confiance: 1,
} as const;

export function creuseursRequis(strate: number): number {
  const t = CREUSEURS.requis;
  const max = CREUSEURS.logement[CREUSEURS.logement.length - 1]!;
  return Math.min(max, strate < t.length ? t[strate]! : t[t.length - 1]! + CREUSEURS.parStrateEnsuite * (strate - t.length + 1));
}

/** Les Porteurs présents au district (les recrues n'arrivent qu'après la chambre scellée) */
export function porteursPresents(j: Jeu): string[] {
  return PORTEURS.filter((p) => (p.arrivee ? j.arrives.includes(p.id) : p.nomme || j.recrues)).map((p) => p.id);
}

/** L'escouade enregistrée (les Porteurs présents seulement, trois au plus) */
export function escouadeDe(j: Jeu): string[] {
  const presents = porteursPresents(j);
  return [...new Set(j.escouade ?? [])].filter((id) => presents.includes(id)).slice(0, 3);
}

/** Combien d'escouades on peut enregistrer */
export const NB_ESCOUADES = 3;

/** L'indice de l'escouade qui descend (0 à 2) */
export const escouadeActive = (j: Jeu): number => (Number.isInteger(j.escouadeActive) && j.escouadeActive >= 0 && j.escouadeActive < NB_ESCOUADES ? j.escouadeActive : 0);

/** L'indice de l'escouade qui défend le port (27 octobre 2026) : celle choisie, ou celle qui descend si elle est vide */
export function escouadeDefense(j: Jeu): number {
  const d = j.escouadeDefense;
  if (Number.isInteger(d) && d! >= 0 && d! < NB_ESCOUADES && escouadesDe(j)[d!]!.length) return d!;
  return escouadeActive(j);
}

/** Les trois escouades enregistrées (25 octobre 2026) : celle qui descend d'abord rangée à sa place,
 * puis les autres, chacune sans les Porteurs déjà pris par une autre (un Porteur n'est que dans une seule) */
export function escouadesDe(j: Jeu): string[][] {
  const presents = porteursPresents(j);
  const a = escouadeActive(j);
  const pris = new Set(escouadeDe(j));
  return Array.from({ length: NB_ESCOUADES }, (_, k) => {
    if (k === a) return escouadeDe(j);
    const liste = [...new Set(j.escouades?.[k] ?? [])].filter((id) => presents.includes(id) && !pris.has(id)).slice(0, 3);
    liste.forEach((id) => pris.add(id));
    return liste;
  });
}

/** La Strate vaincue la plus profonde (le front compte s'il a été vaincu) */
export const strateVaincue = (j: Jeu) => (j.frontVaincu ? j.strate : j.strate - 1);

export interface Mission { porteur: string; strate: number; duree: DureeMission; debut: number; fin: number }

/** Le rapport d'une mission rentrée (demande de Luc, 28 octobre 2026) : un petit récit et tout ce qu'elle a rapporté */
export interface RapportMission {
  porteur: string; strate: number; duree: DureeMission; fin: number;
  recit: string[];
  composants: number; xp: number; niveau: number | null;
  cartes: { id: string; nouvelle: boolean }[];
  creuseurs: number; usure: number; marque: string | null;
  lu: boolean;
}
/** rapports lus gardés pour les relire (les non lus ne sont jamais effacés) */
export const RAPPORTS_LUS_MAX = 5;

export interface Comptoir { jour: number; offres: string[]; achetes: number[]; rng: number }

export type DureeMission = 'courte' | 'longue';
