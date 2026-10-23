// L'état complet d'une partie : le district (ressources, bâtiments, Porteurs, Forge)
// et l'expédition en cours. Fonctions pures : le temps est toujours passé en paramètre (`now`, en ms),
// ce qui permet de rattraper le temps passé hors du jeu et de tester sans attendre.

import { BATIMENTS, CARTE_CHAMBRE, CARTES_DE_BASE, COLLECTION_DEPART, DEPART_PORTEURS, GESTES_SPECIAUX, MODULES, PORTEURS, batimentDef, carteId, moduleDe, moduleDef, porteurDef, ennemiDef, zoneDe } from './donnees';
import {
  COLLECTION, NOMS_RARETE, ajouterCarte, cartesEnJeu, composantsNiveau, doublonsRequis, tirerChoix, tirerTrouvaille,
  type CarteCollection,
} from './collection';
import { ORDRE_FRAGMENTS, fragmentDef } from './fragments';
import { FILS } from './fils';
import { cloturerCombat, combatSuivant, entrerSalle, forceStrate, fuirAuDistrict, lancerCombat, nouvelleExpedition, nouvelleExploration, peutRemonter, reculer, type CibleFouille, type Expedition } from './expedition';
import { graine, tireur } from './rng';
import { noterPalmares, type Palmares } from './classements';
import type { BatimentId, GesteDef, Lignee, PorteurEtat, Rarete, BonusMarques } from './types';

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
  /** cartes qu'un Porteur peut porter (décision du 22 octobre 2026 : la carte qu'on collectionne est celle qu'on joue) */
  cartesMax: 6,
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
export type Fait = 'expeditions' | 'fondations' | 'anciens' | 'scellees' | 'abysses' | 'gardiens' | 'combats' | 'missions';
/** court : l'effet en quelques mots, pour l'écran de l'escouade */
export interface MarqueDef { nom: string; fait: Fait; seuil: number; texte: string; court: string; quoi: string; bonus: BonusMarques }
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
  kessa: { nom: 'Née-de-mue', fait: 'fondations', seuil: 25, quoi: 'combats dans les Fondations', court: 'garde 20 % du bouclier', bonus: { garde: 0.2 },
    texte: 'Sa chitine ne cède pas d’un coup : à chaque tour, l’escouade garde 20 % de son bouclier pour le tour suivant.' },
  liane: { nom: 'Galons blancs', fait: 'scellees', seuil: 12, quoi: 'salles scellées ouvertes', court: '1 Flux au départ', bonus: { flux: 1 },
    texte: 'Chaque implant est un galon : chaque combat commence avec 1 Flux.' },
  joss: { nom: 'Nuit blanche', fait: 'combats', seuil: 35, quoi: 'combats gagnés', court: '+1 carte au premier tour', bonus: { main: 1 },
    texte: 'Le quartier entier l’a veillé : au premier tour de chaque combat, ta main compte une carte de plus.' },
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
export interface Fabrication {
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

export type TypeQuotidien = 'combats' | 'expedition' | 'chantier';
export const QUOTIDIENS: Record<TypeQuotidien, { titre: string; objectif: number }> = {
  combats: { titre: 'Gagner 4 combats', objectif: 4 },
  expedition: { titre: 'Vaincre un gardien, réussir une fouille ou une Épreuve', objectif: 1 },
  chantier: { titre: 'Lancer une amélioration de bâtiment', objectif: 1 },
};

export interface Jeu {
  version: number;
  energie: number;
  composants: number;
  batiments: Record<BatimentId, number>;
  porteurs: Record<string, PorteurDistrict>;
  forge: Fabrication | null;
  /** Strate la plus profonde ouverte (le prochain étage à creuser) */
  strate: number;
  dernierTick: number;
  expedition: Expedition | null;
  journal: string[];
  /** l'intro du premier lancement a été vue */
  introVue: boolean;
  /** la chambre scellée a été ouverte (fin du combat guidé) */
  chambre: boolean;
  /** les trois recrues anonymes ont rejoint le district */
  recrues: boolean;
  /** les Porteurs de l'histoire arrivés plus tard (Sasha, Nuit, Aurel) */
  arrives: string[];
  /** les grands choix de la campagne (Bible : un choix important par acte) */
  actes: { chambre?: GardeChambre; lecture?: LectureVela; fin?: FinCampagne };
  /** la Confiance des habitants, de 0 à 100 : elle ne destitue jamais le directeur, mais elle colore le jeu (Bible) */
  confiance: number;
  /** les mécaniques de combat déjà expliquées la première fois qu'elles sont apparues (decouvertes.ts) */
  decouvertes?: string[];
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
  /** Épreuves de la semaine déjà réussies (une récompense par Épreuve et par semaine) */
  epreuves: { semaine: number; faites: string[] };
  /** le Comptoir du jour : ses offres, celles déjà achetées, et son propre hasard (il ne touche pas aux trouvailles) */
  comptoir: Comptoir;
  /** « Mon escouade » (décision du 23 octobre 2026) : les trois Porteurs qui descendent. Elle ne change qu'au district,
   *  jamais pendant une descente (sinon c'est trop facile). Ancienne sauvegarde : complétée par `migrer`. */
  escouade: string[];
  /** les Porteurs et les cartes déjà vus par le joueur : le reste porte une pastille « Nouveau » (23 octobre 2026) */
  vus: { porteurs: string[]; cartes: string[] };
  /** les creuseurs du front de taille : il en faut assez pour creuser l'étage suivant (logés selon le niveau du Noyau) */
  creuseurs: number;
  /** le gardien de la Strate la plus profonde est vaincu : l'étage suivant attend d'être creusé */
  frontVaincu: boolean;
  /** les fils des Porteurs : nombre d'étapes faites par Porteur (23 octobre 2026) */
  fils?: Record<string, number>;
  /** le dernier âge du district montré au joueur (fenêtre « nouvel âge », 23 octobre 2026) */
  ageVu?: number;
  /** le Grand Tableau (23 octobre 2026) : records personnels et scores du début de semaine (classements.ts) */
  palmares?: Palmares;
  /** le nom de directeur choisi pour le Grand Tableau, et si on y apparaît (jamais l'e-mail du compte) */
  directeur?: { nom: string; public: boolean; /** dernier changement de pseudo (ms) : un par semaine au plus */ change?: number };
}

/** Acte I, le choix : qui garde la chambre ? */
export type GardeChambre = 'orseve' | 'district' | 'commission';
export const DECISION_CHAMBRE: { titre: string; texte: string; options: { id: GardeChambre; nom: string; phrase: string; effet: string }[] } = {
  titre: 'Qui garde la chambre ?',
  texte: 'La Confluence est tombée, et tout Vertiga parle de la chambre aux empreintes mêlées. Les Brigades du Serment de Veyr sont au pied de la Tour, les Veilleurs de Sédime demandent à l’étudier, et le quartier attend ta décision.',
  options: [
    { id: 'orseve', nom: 'La Maison Orsève', phrase: 'Nous n’héritons pas du pouvoir. Nous héritons de la responsabilité de le contenir.',
      effet: 'Les Brigades sécurisent la chambre et ne te barrent plus la route dans les Strates. Les Hauts paient : +1 Éclat sur chaque gardien vaincu.' },
    { id: 'district', nom: 'Le district seul', phrase: 'Ce qui est sous nos piliers est à nous.',
      effet: 'Le quartier se mobilise : +20 % de composants à chaque expédition. Mais les Brigades contestent, et tu les croiseras dans les salles closes.' },
    { id: 'commission', nom: 'Une commission avec les Veilleurs', phrase: 'Nous ne sommes pas les propriétaires du passé. Nous sommes les prochains à pouvoir le perdre.',
      effet: 'Les Veilleurs partagent leurs fouilles : 25 % de chances de carte par combat au lieu de 20 %.' },
  ],
};

/** Acte II, le choix : autoriser Véla à une dernière lecture profonde, au risque de briser le lien avec son empreinte */
export type LectureVela = 'autoriser' | 'refuser';
export const DECISION_LECTURE: { titre: string; texte: string; options: { id: LectureVela; nom: string; phrase: string; effet: string }[] } = {
  titre: 'La dernière lecture',
  texte: 'Sous les salles closes, les cristaux d’un même individu portent des souvenirs qui se contredisent. Véla pense pouvoir lire jusqu’au bout ce qu’ils cachent. Elle sait que son lien avec son empreinte pourrait ne pas y survivre. Elle attend ton accord.',
  options: [
    { id: 'autoriser', nom: 'Autoriser la lecture', phrase: 'Une empreinte ne ment jamais. C’est nous qui la lisons mal.',
      effet: 'Véla gagne une carte unique, Lecture profonde (Fréquence libre, forte attaque), en plus de ses 6 cartes. Son lien s’effiloche : −4 PV pour de bon.' },
    { id: 'refuser', nom: 'Refuser, la protéger', phrase: 'On n’entre pas deux fois chez quelqu’un sans y être invité.',
      effet: 'Véla garde son empreinte intacte et reprend des forces : +4 PV pour de bon. Ce que cachent les cristaux attendra.' },
  ],
};

/** Acte III, la vérité : trois fins, aucune n'est « la bonne » (Bible) */
export type FinCampagne = 'scellement' | 'pacte' | 'archives';
export const DECISION_FIN: { titre: string; texte: string; options: { id: FinCampagne; nom: string; phrase: string; effet: string }[] } = {
  titre: 'La vérité',
  texte: 'Le Premier Porteur est tombé, et son registre parle enfin : une autre civilisation s’est perdue en se gravant des empreintes, et ses premiers porteurs l’avaient écrit dès le début. Ces mêmes empreintes ont pourtant sauvé l’humanité après la Fonte. Le système qui les tient stables s’use. Il faut décider de ce qu’on en fait.',
  options: [
    { id: 'scellement', nom: 'Le Grand Scellement', phrase: 'Certaines vérités doivent rester enfouies.',
      effet: 'Les empreintes anciennes sont scellées à nouveau. Moins de risques : les ennemis perdent 10 % de leur force. Du savoir perdu : plus aucune carte en nacre ne tombe.' },
    { id: 'pacte', nom: 'Le Pacte des empreintes', phrase: 'Nous héritons de la responsabilité de les contenir, ensemble.',
      effet: 'Leur contrôle est partagé entre les Hauts et les districts. Une paix fragile : +10 % de composants. Une nouvelle bureaucratie : les chantiers durent 25 % plus longtemps.' },
    { id: 'archives', nom: 'Les Archives ouvertes', phrase: 'Une empreinte n’est qu’une donnée. Elle n’a rien de sacré.',
      effet: 'Tout est révélé et accessible à tous. Plus de liberté : deux fois plus de cartes en nacre. Des accidents de greffe : l’Usure des expéditions augmente de moitié.' },
  ],
};

export const DECISIONS = { chambre: DECISION_CHAMBRE, lecture: DECISION_LECTURE, fin: DECISION_FIN } as const;
export type Acte = keyof typeof DECISIONS;

/** Une décision de campagne attend le joueur : l'acte I se referme après la Strate −3, l'acte II après la Strate −6 */
export function decisionEnAttente(j: Jeu): Acte | null {
  if (!j.chambre) return null;
  if (j.strate >= 4 && !j.actes.chambre) return 'chambre';
  if (j.strate >= 7 && !j.actes.lecture) return 'lecture';
  if (j.strate >= 11 && !j.actes.fin) return 'fin';
  return null;
}

export function decider(j: Jeu, acte: string, choix: string): Resultat {
  const d = DECISIONS[acte as Acte];
  if (!d) return non('Décision inconnue.');
  const o = (d.options as readonly { id: string; nom: string }[]).find((x) => x.id === choix);
  if (!o) return non('Choix inconnu.');
  if (j.actes[acte as Acte]) return non('La décision est déjà prise.');
  (j.actes as Record<string, string>)[acte] = o.id;
  if (acte === 'chambre') confier(j, o.id === 'district' ? 10 : o.id === 'commission' ? 5 : -5);
  log(j, acte === 'chambre' ? `La chambre est confiée à : ${o.nom}.` : acte === 'lecture' ? `Véla : ${o.nom.toLowerCase()}.` : `Fin de la campagne : ${o.nom}. Les Strates continuent.`);
  return { ok: true, message: `Décision prise : ${o.nom}.` };
}

export const deciderChambre = (j: Jeu, choix: string) => decider(j, 'chambre', choix);

/** Ce que la dernière lecture a changé chez Véla */
export const bonusPv = (j: Jeu, id: string) => (id === 'vela' ? (j.actes.lecture === 'autoriser' ? -4 : j.actes.lecture === 'refuser' ? 4 : 0) : 0);
/** la carte que Véla gagne après la dernière lecture : la sienne, en plus de ses 6 cartes */
const LECTURE_PROFONDE: GesteDef = { id: 'lecture-profonde', porteur: 'vela', nom: 'Lecture profonde', f: 8, type: 'atk', v: 16, effet: { type: 'accord' } };

export interface Resultat {
  ok: boolean;
  message?: string;
}

const non = (message: string): Resultat => ({ ok: false, message });

const typeDuJour = (jour: number): TypeQuotidien => (['combats', 'expedition', 'chantier'] as const)[((jour % 3) + 3) % 3]!;

export function nouveauJeu(now: number, rng = graine()): Jeu {
  const porteurs: Record<string, PorteurDistrict> = {};
  for (const p of PORTEURS) porteurs[p.id] = { usure: 0, poste: null, modules: (DEPART_PORTEURS[p.id] ?? []).map((id) => carteId(id, 'fer')) };
  return {
    version: VERSION_JEU,
    energie: DISTRICT.depart.energie,
    composants: DISTRICT.depart.composants,
    batiments: { noyau: 1, generateur: 1, forge: 1, clinique: 1, comptoir: 0 },
    porteurs,
    forge: null,
    strate: 1,
    dernierTick: now,
    expedition: null,
    journal: ['Tu viens d’être élu à la tête du district. Les piliers t’attendent.'],
    introVue: false,
    chambre: false,
    recrues: false,
    arrives: [],
    actes: {},
    confiance: 50,
    decouvertes: [],
    objectif: 0,
    fragments: [],
    lus: [],
    luesRecompensees: [],
    kitRecrues: false,
    ravitaillement: { jour: jourDe(now), reserve: 1, ouverts: 0 },
    eclats: 0,
    collection: Object.fromEntries(COLLECTION_DEPART.map((id) => [id, { niveau: 1, doublons: 0 }])),
    sans: { argent: 0, or: 0, nacre: 0 },
    rng,
    chantiers: [],
    choix: [],
    quotidien: { jour: jourDe(now), reserve: 1, type: typeDuJour(jourDe(now)), progres: 0 },
    archive: { semaine: semaineDe(now), points: 0, aOuvrir: 0 },
    missions: [],
    epreuves: { semaine: semaineDe(now), faites: [] },
    creuseurs: 0,
    frontVaincu: false,
    comptoir: comptoirVide(now, rng),
    escouade: [...ESCOUADE_DEPART],
    fils: {},
    // l'escouade et les cartes de départ sont connues : seuls les nouveaux venus portent la pastille
    vus: { porteurs: [...ESCOUADE_DEPART], cartes: [...COLLECTION_DEPART] },
  };
}

export function estJeuValide(x: unknown): x is Jeu {
  const j = x as Jeu | null;
  if (!(!!j && (j.version === VERSION_JEU || (j.version >= 2 && j.version <= 6)) && typeof j.energie === 'number' && !!j.batiments && !!j.porteurs)) return false;
  migrer(j);
  return true;
}

const RENOMMES: Record<string, string> = { 'glande-amber': 'glande-ambre' };

/** Complète une sauvegarde d'une version précédente avec les nouveaux champs */
function migrer(j: Jeu) {
  const ancien = j.chambre === undefined;
  j.chambre ??= ancien && j.strate > 1;
  j.recrues ??= ancien;
  j.arrives ??= [];
  j.actes ??= {};
  j.confiance ??= 50;
  j.decouvertes ??= [];
  j.fils ??= {};
  for (const p of PORTEURS) j.porteurs[p.id] ??= { usure: 0, poste: null, modules: [] };
  j.objectif ??= ancien && j.strate > 1 ? OBJECTIFS.length : 0;
  j.fragments ??= [];
  j.lus ??= [];
  if (j.kitRecrues === undefined) { j.kitRecrues = false; if (j.recrues && j.collection) donnerKitRecrues(j); }
  j.ravitaillement ??= { jour: jourDe(j.dernierTick), reserve: 1, ouverts: 0 };
  j.missions ??= [];
  // sauvegarde d'avant les creuseurs : on commence avec une équipe vide, les Strates déjà ouvertes le restent
  j.creuseurs ??= 0;
  j.frontVaincu ??= false;
  j.epreuves ??= { semaine: semaineDe(j.dernierTick), faites: [] };
  // sauvegarde d'avant le Comptoir (23 octobre 2026) : il reste à construire
  j.batiments.comptoir ??= 0;
  j.comptoir ??= comptoirVide(j.dernierTick, j.rng ?? graine());
  // sauvegarde d'avant les pastilles « Nouveau » : tout ce qui est déjà là est considéré comme vu
  j.vus ??= { porteurs: porteursPresents(j), cartes: Object.keys(j.collection ?? {}) };
  // sauvegarde d'avant « Mon escouade » : l'escouade de départ, ou les trois premiers Porteurs présents
  j.escouade ??= ESCOUADE_DEPART.every((id) => porteursPresents(j).includes(id)) ? [...ESCOUADE_DEPART] : porteursPresents(j).slice(0, 3);
  if (!j.luesRecompensees) {
    // sauvegarde d'avant les récompenses de lecture : les chapitres déjà lus rapportent leur carte maintenant
    j.luesRecompensees = [];
    if (j.collection && j.rng !== undefined) for (const id of j.lus) recompenserLecture(j, id);
  }
  if (j.version === 2) {
    // version 3 : la collection de cartes, les Éclats, les chantiers, l'objectif du jour et l'Archive
    const now = j.dernierTick;
    j.version = 3;
    j.eclats = 0;
    j.collection = Object.fromEntries(COLLECTION_DEPART.map((id) => [id, { niveau: 1, doublons: 0 }]));
    for (const p of Object.values(j.porteurs)) {
      p.modules = p.modules.map((m) => RENOMMES[m] ?? m).filter((m) => MODULES.some((x) => x.id === m)).map((m) => carteId(m, moduleDef(m).rarete));
      for (const m of p.modules) {
        if (j.collection[m]) j.collection[m]!.doublons++;
        else j.collection[m] = { niveau: 1, doublons: 0 };
      }
    }
    if (j.forge) j.forge = { moduleId: RENOMMES[j.forge.moduleId] ?? j.forge.moduleId, debut: j.forge.debut, fin: j.forge.fin };
    j.sans = { argent: 0, or: 0, nacre: 0 };
    j.rng = graine();
    j.chantiers = [];
    j.choix = [];
    j.quotidien = { jour: jourDe(now), reserve: 1, type: typeDuJour(jourDe(now)), progres: 0 };
    j.archive = { semaine: semaineDe(now), points: 0, aOuvrir: 0 };
  }
  if (j.version === 3) {
    // version 4 : un Module peut exister dans les cinq métaux ; chaque exemplaire garde le métal d'origine de son Module
    j.version = 4;
    const existe = (id: string) => MODULES.some((m) => m.id === moduleDe(id));
    const cle = (id: string) => (id.includes('@') ? id : carteId(id, moduleDef(id).rarete));
    j.collection = Object.fromEntries(Object.entries(j.collection).filter(([id]) => existe(id)).map(([id, c]) => [cle(id), c]));
    for (const p of Object.values(j.porteurs)) p.modules = p.modules.filter(existe).map(cle);
    if (j.forge) j.forge = existe(j.forge.moduleId) ? { ...j.forge, moduleId: cle(j.forge.moduleId) } : null;
    j.choix = j.choix.map((c) => ({ ...c, options: c.options.filter(existe).map(cle) })).filter((c) => c.options.length);
  }
  if (j.version === 4) {
    // version 5 : réservée à la Fusion, retirée le 21 octobre (le métal se trouve, il ne se fabrique pas) ; rien à migrer
    j.version = 5;
    delete (j as Partial<Jeu> & { fusions?: unknown }).fusions;
  }
  if (j.version === 5) {
    // version 6 (22 octobre 2026) : la carte qu'on collectionne est celle qu'on joue. Les Gestes de base deviennent
    // 15 cartes en fer, portées par Ilka, Doran et Véla ; chacun garde ses cartes greffées, jusqu'à 6 cartes.
    j.version = 6;
    for (const id of CARTES_DE_BASE) j.collection[carteId(id, 'fer')] ??= { niveau: 1, doublons: 0 };
    const porte = new Set(Object.values(j.porteurs).flatMap((p) => p.modules));
    for (const [pid, depart] of Object.entries(DEPART_PORTEURS)) {
      const p = j.porteurs[pid];
      if (!p) continue;
      const base = depart.filter((id) => CARTES_DE_BASE.includes(id)).map((id) => carteId(id, 'fer'));
      // sa carte de départ, si elle n'est portée par personne
      const premiere = carteId(depart[depart.length - 1]!, 'fer');
      const greffes = p.modules.length || !j.collection[premiere] || porte.has(premiere) ? p.modules : [premiere];
      p.modules = [...greffes.slice(0, DISTRICT.cartesMax), ...base].slice(0, DISTRICT.cartesMax);
    }
    // le deuxième objectif apprend désormais à confier la carte de la chambre
    if (j.chambre && j.objectif <= 1) j.collection[CARTE_CHAMBRE] ??= { niveau: 1, doublons: 0 };
  }
  if (j.version === 6) {
    // version 7 (23 octobre 2026) : un quatrième objectif guidé, les creuseurs. Qui avait fini les trois anciens a fini.
    j.version = 7;
    if (j.objectif >= 3) j.objectif = OBJECTIFS.length;
  }
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

function multiplicateur(j: Jeu, b: Exclude<Poste, 'noyau'>): number {
  const id = posteDe(j, b);
  if (!id) return 1;
  return porteurDef(id).lignee === batimentDef(b).affinite ? DISTRICT.bonusAffinite : DISTRICT.bonusPoste;
}

export const energieParHeure = (j: Jeu) => Math.round((DISTRICT.energieParHeure[j.batiments.generateur] ?? 0) * multiplicateur(j, 'generateur') * effetConfiance(j));

// ---------- La Confiance des habitants ----------
// Elle monte avec les chantiers, les expéditions réussies et les choix qui protègent le quartier ; elle baisse avec les
// défaites et certains choix. Jamais pendant l'absence : rien ne se dégrade quand on ne joue pas.
export const CONFIANCE = { victoire: 3, chantier: 2, defaite: -2, haute: 70, basse: 30 } as const;
export function confier(j: Jeu, delta: number) {
  j.confiance = Math.max(0, Math.min(100, Math.round((j.confiance ?? 50) + delta)));
}
/** Haute : les habitants donnent un coup de main (+10 % d'énergie). Basse : le Générateur tourne au ralenti (−10 %). */
export const effetConfiance = (j: Jeu) => ((j.confiance ?? 50) >= CONFIANCE.haute ? 1.1 : (j.confiance ?? 50) <= CONFIANCE.basse ? 0.9 : 1);
export function humeurDistrict(j: Jeu): string {
  const c = j.confiance ?? 50;
  if (c >= CONFIANCE.haute) return 'Le quartier croit en toi : les habitants donnent un coup de main (+10 % d’énergie).';
  if (c <= CONFIANCE.basse) return 'Le quartier doute : le Générateur tourne au ralenti (−10 % d’énergie).';
  return 'Le quartier t’observe. Les chantiers et les expéditions réussies feront monter sa confiance.';
}
export const soinParHeure = (j: Jeu) => (DISTRICT.soinParHeure[j.batiments.clinique] ?? 0) * multiplicateur(j, 'clinique');

/** Ce que coûte la refabrication d'un exemplaire */
export const coutRefabrication = (moduleId: string) => COLLECTION.refabrication[moduleDef(moduleId).rarete];

/** Vitesse de la Forge selon son niveau : +25 % par niveau */
export const vitesseForge = (niveau: number) => 1 + 0.25 * (niveau - 1);

/** Durée de refabrication, en ms (plus rapide avec un forgeron de la bonne lignée et une Forge améliorée) */
export function dureeFabrication(j: Jeu, moduleId: string): number {
  const bonus = multiplicateur(j, 'forge');
  return Math.round((coutRefabrication(moduleId).minutes * 60_000 * DISTRICT.bonusPoste) / (bonus * vitesseForge(j.batiments.forge)));
}

export function coutAmelioration(j: Jeu, b: BatimentId) {
  const d = batimentDef(b);
  const n = j.batiments[b];
  return n >= d.niveauMax ? null : d.couts[n]!;
}

/** Durée du chantier pour monter un bâtiment au niveau suivant, en ms */
export const dureeChantier = (j: Jeu, b: BatimentId) => Math.round((DISTRICT.chantierMinutes[j.batiments[b] + 1] ?? 0) * 60_000 * (j.actes?.fin === 'pacte' ? 1.25 : 1));
export const chantierDe = (j: Jeu, b: BatimentId) => j.chantiers.find((c) => c.batiment === b) ?? null;
export const chantiersMax = (j: Jeu) => (j.batiments.noyau >= DISTRICT.chantiersNoyau2 ? 2 : 1);

/** Une chose que le niveau suivant d'un bâtiment change : un chiffre qui monte (avant → après) ou un déblocage */
export interface GainNiveau {
  quoi: 'energie' | 'soin' | 'stockage' | 'creuseurs' | 'strate' | 'forge' | 'plafond' | 'chantiers' | 'porteur' | 'entrainement' | 'offres' | 'argent';
  texte: string;
  avant?: number;
  apres?: number;
  /** Infinity pour « sans limite » */
  unite?: '%';
  detail?: string;
}

/** La Strate la plus profonde que le logement des creuseurs permet d'ouvrir à ce niveau du Noyau (Infinity : plus de limite) */
export function profondeurNoyau(niveau: number): number {
  const max = CREUSEURS.logement[CREUSEURS.logement.length - 1]!;
  if ((CREUSEURS.logement[niveau] ?? max) >= max) return Infinity;
  let s = 1;
  while (noyauRequis(s + 1) <= niveau) s++;
  return s;
}

/**
 * Ce que rapporte le niveau suivant d'un bâtiment, calculé avec les vraies règles sur une copie du district
 * (Porteur posté et Confiance compris) : la feuille du bâtiment l'affiche à côté du bouton Améliorer. Vide au niveau maximum.
 */
export function gainsAmelioration(j: Jeu, b: BatimentId): GainNiveau[] {
  const niv = j.batiments[b];
  if (niv >= batimentDef(b).niveauMax) return [];
  const apres: Jeu = { ...j, batiments: { ...j.batiments, [b]: niv + 1 } };
  const g: GainNiveau[] = [];
  if (b === 'generateur') g.push({ quoi: 'energie', texte: 'Énergie par heure', avant: energieParHeure(j), apres: energieParHeure(apres) });
  if (b === 'clinique') g.push({ quoi: 'soin', texte: 'Usure soignée par heure', avant: soinParHeure(j), apres: soinParHeure(apres), detail: 'pour chaque Porteur au repos' });
  if (b === 'clinique' && niv + 1 === ACCORD_OUVERT.clinique) {
    const joss = PORTEURS.find((p) => p.arrivee?.accord && !j.arrives.includes(p.id));
    if (joss) g.push({ quoi: 'porteur', texte: 'La Clinique peut organiser un Accord ouvert', detail: `un nouveau Résonant, quand la Confiance atteint ${ACCORD_OUVERT.confiance}` });
  }
  if (b === 'forge') {
    g.push({ quoi: 'forge', texte: 'Vitesse de refabrication', avant: Math.round(vitesseForge(niv) * 100), apres: Math.round(vitesseForge(niv + 1) * 100), unite: '%' });
    for (const p of PORTEURS) {
      if (p.arrivee?.forge !== niv + 1 || j.arrives.includes(p.id)) continue;
      g.push({ quoi: 'porteur', texte: `${p.nom} rejoint le district`, ...(j.chambre ? {} : { detail: 'une fois la chambre scellée' }) });
    }
  }
  if (b === 'comptoir') {
    g.push({ quoi: 'offres', texte: 'Cartes en vente chaque jour', avant: etalsDuComptoir(j).length, apres: etalsDuComptoir(apres).length });
    const argent = (x: Jeu) => (COMPTOIR.etals[x.batiments.comptoir] ?? []).includes('argent');
    if (argent(apres) && !argent(j)) g.push({ quoi: 'argent', texte: 'Des cartes en argent', ...(strateVaincue(j) < COMPTOIR.strateArgent ? { detail: `une fois la Strate −${COMPTOIR.strateArgent} vaincue` } : {}) });
  }
  if (b === 'noyau') {
    g.push({ quoi: 'stockage', texte: 'Stockage d’énergie', avant: stockage(j), apres: stockage(apres) });
    const prof = profondeurNoyau(niv + 1);
    g.push({ quoi: 'creuseurs', texte: 'Creuseurs logés', avant: logementCreuseurs(j), apres: logementCreuseurs(apres),
      detail: prof === Infinity ? 'plus aucune limite de profondeur' : `de quoi creuser jusqu’à la Strate −${prof}` });
    const manque = manquePourCreuser(j);
    if (manque && manque.creuseurs === 0 && noyauRequis(j.strate + 1) === niv + 1) g.push({ quoi: 'strate', texte: `Ouvre la Strate −${j.strate + 1}`, detail: 'les creuseurs attendent déjà la place' });
    g.push({ quoi: 'plafond', texte: 'Niveau max. des autres bâtiments', avant: niv, apres: niv + 1 });
    g.push({ quoi: 'entrainement', texte: 'Entraînement à la Tour', avant: xpEntrainement(j), apres: xpEntrainement(apres), detail: `XP par heure, jusqu’au niveau ${plafondEntrainement(apres)}` });
    if (niv + 1 === DISTRICT.chantiersNoyau2) g.push({ quoi: 'chantiers', texte: 'Deux chantiers en même temps' });
  }
  return g;
}

/** Les Porteurs qui portent déjà cette carte */
export const greffesDe = (j: Jeu, moduleId: string) => Object.keys(j.porteurs).filter((id) => j.porteurs[id]!.modules.includes(moduleId));

// ---------- Le temps qui passe ----------

/** Rattrape le temps écoulé : énergie, soins, Forge. Rien n'est perdu ni puni pendant l'absence. */
export function tick(j: Jeu, now: number): string[] {
  const nouvelles: string[] = [];
  nouvelles.push(...verifierArrivees(j));
  nouvelles.push(...avancerFils(j));
  const dt = Math.max(0, now - j.dernierTick);
  const heures = dt / 3_600_000;
  j.dernierTick = now;

  // l'énergie produite, moins ce que consomme l'entraînement tant qu'il dure (23 octobre 2026) :
  // si la Tour consomme plus que le Générateur ne produit, l'entraînement s'arrête quand la réserve est vide
  const prod = energieParHeure(j);
  const entrainement = heuresEntrainement(j, heures);
  const conso = energieEntrainement(j);
  let paye = entrainement;
  if (conso > prod && paye > 0) paye = Math.min(paye, j.energie / (conso - prod));
  j.energie = Math.max(0, Math.min(stockage(j), j.energie + (prod - conso) * paye));
  j.energie = Math.min(stockage(j), j.energie + prod * (heures - paye));

  const soin = soinParHeure(j) * heures;
  for (const id of Object.keys(j.porteurs)) {
    if (enExpedition(j, id)) continue;
    const p = j.porteurs[id]!;
    p.usure = Math.max(0, p.usure - soin);
  }

  if (j.forge && now >= j.forge.fin) {
    const f = j.forge;
    ajouterCarte(j, f.moduleId);
    j.forge = null;
    const t = `La Forge a refabriqué ${moduleDef(f.moduleId).nom} : un doublon de plus.`;
    log(j, t);
    nouvelles.push(t);
  }

  for (const c of j.chantiers.filter((x) => now >= x.fin)) {
    j.batiments[c.batiment]++;
    confier(j, CONFIANCE.chantier);
    if ((j.confiance ?? 50) >= CONFIANCE.haute && tireur(j).nombre() < CREUSEURS.confiance) gagnerCreuseurs(j, 1, 'le district a confiance, un volontaire se présente');
    if (c.batiment === 'noyau' && creuser(j)) nouvelles.push(`La Tour du Noyau loge assez de creuseurs : la Strate −${j.strate} est ouverte.`);
    const t = `Chantier terminé : ${batimentDef(c.batiment).nom} passe au niveau ${j.batiments[c.batiment]}.`;
    log(j, t);
    nouvelles.push(t);
  }
  j.chantiers = j.chantiers.filter((x) => now < x.fin);

  const entraine = entrainer(j, paye);
  if (entraine) nouvelles.push(entraine);

  for (const m of j.missions.filter((x) => now >= x.fin)) nouvelles.push(retourDeMission(j, m));
  j.missions = j.missions.filter((x) => now < x.fin);
  if (semaineDe(now) > j.epreuves.semaine) j.epreuves = { semaine: semaineDe(now), faites: [] };

  // un objectif du jour de plus en réserve chaque jour, 3 au plus : rien ne se perd pendant une courte absence
  const jour = jourDe(now);
  if (jour > j.quotidien.jour) {
    const avant = j.quotidien.reserve;
    j.quotidien.reserve = Math.min(3, j.quotidien.reserve + (jour - j.quotidien.jour));
    if (avant === 0) { j.quotidien.type = typeDuJour(jour); j.quotidien.progres = 0; }
    j.quotidien.jour = jour;
  }

  // un colis de ravitaillement de plus chaque jour, 3 au plus (aucune série à perdre)
  if (jour > j.ravitaillement.jour) {
    j.ravitaillement.reserve = Math.min(RAVITAILLEMENT.reserveMax, j.ravitaillement.reserve + (jour - j.ravitaillement.jour));
    j.ravitaillement.jour = jour;
  }

  // l'Archive de la semaine s'ouvre le lundi
  const semaine = semaineDe(now);
  if (semaine > j.archive.semaine) {
    const paliers = ARCHIVE.paliers.filter((p) => j.archive.points >= p).length;
    if (paliers > 0) {
      j.archive.aOuvrir = Math.max(j.archive.aOuvrir, paliers);
      const t = 'L’Archive de la semaine est prête à être ouverte.';
      log(j, t);
      nouvelles.push(t);
    }
    j.archive.points = 0;
    j.archive.semaine = semaine;
  }
  garnirComptoir(j, now);
  noterPalmares(j, now, semaineDe(now));
  return nouvelles;
}

/** Des points d'Archive et la progression de l'objectif du jour */
function progresser(j: Jeu, quoi: keyof typeof ARCHIVE.points, n = 1) {
  j.archive.points += ARCHIVE.points[quoi] * n;
  const q = j.quotidien;
  if (quoi === 'quotidien' || !quotidienActif(j)) return;
  if ((quoi === 'combat' && q.type === 'combats') || (quoi === 'expedition' && q.type === 'expedition') || (quoi === 'chantier' && q.type === 'chantier')) {
    q.progres = Math.min(QUOTIDIENS[q.type].objectif, q.progres + n);
  }
}

/** L'objectif du jour apparaît une fois les 3 objectifs guidés terminés */
export const quotidienActif = (j: Jeu) => j.objectif >= OBJECTIFS.length && j.quotidien.reserve > 0;
export const quotidienFait = (j: Jeu) => quotidienActif(j) && j.quotidien.progres >= QUOTIDIENS[j.quotidien.type].objectif;

// ---------- Actions du district ----------

/** Le bâtiment à proposer pour l'objectif « lancer une amélioration » : le premier qu'on peut lancer tout de suite,
 *  sinon le moins cher à atteindre (la Tour du Noyau en dernier recours) */
export function batimentConseille(j: Jeu): BatimentId {
  const ids = BATIMENTS.map((b) => b.id).filter((b) => j.batiments[b] > 0 || b === 'comptoir');
  const essai = (b: BatimentId) => { const c = structuredClone(j); return ameliorer(c, b).ok; };
  const pret = ids.find(essai);
  if (pret) return pret;
  const cout = (b: BatimentId) => { const c = coutAmelioration(j, b); return c ? c.energie + 3 * c.composants : Infinity; };
  return [...ids].sort((a, b) => cout(a) - cout(b))[0] ?? 'noyau';
}

export function ameliorer(j: Jeu, b: BatimentId, now = j.dernierTick): Resultat {
  const cout = coutAmelioration(j, b);
  if (!cout) return non('Niveau maximum atteint.');
  if (chantierDe(j, b)) return non('Un chantier est déjà en cours sur ce bâtiment.');
  if (b !== 'noyau' && j.batiments[b] >= j.batiments.noyau) return non('Améliore d’abord la Tour du Noyau.');
  if (b === 'noyau' && j.chantiers.length) return non('Termine d’abord les chantiers en cours avant d’agrandir la Tour du Noyau.');
  if (j.chantiers.length >= chantiersMax(j)) return non(chantiersMax(j) === 1 ? 'Un seul chantier à la fois pour l’instant (deux au Noyau niveau 4).' : 'Deux chantiers sont déjà en cours.');
  if (j.energie < cout.energie || j.composants < cout.composants || j.eclats < (cout.eclats ?? 0)) return non('Pas assez de ressources.');
  j.energie -= cout.energie;
  j.composants -= cout.composants;
  j.eclats -= cout.eclats ?? 0;
  const duree = dureeChantier(j, b);
  progresser(j, 'chantier');
  if (duree <= 0) {
    j.batiments[b]++;
    log(j, `${batimentDef(b).nom} passe au niveau ${j.batiments[b]}.`);
    if (b === 'noyau') creuser(j);
  } else {
    j.chantiers.push({ batiment: b, debut: now, fin: now + duree });
    log(j, `Chantier lancé : ${batimentDef(b).nom} vers le niveau ${j.batiments[b] + 1}.`);
  }
  return { ok: true };
}

export function poster(j: Jeu, id: string, b: Poste | null): Resultat {
  const p = j.porteurs[id];
  if (!p || !porteursPresents(j).includes(id)) return non('Porteur inconnu.');
  if (enExpedition(j, id)) return non('Ce Porteur est en expédition.');
  if (b === 'forge' && j.forge && p.poste === 'forge') return non('La Forge travaille : attends la fin de la fabrication.');
  if (b) {
    const occupant = posteDe(j, b);
    if (occupant && occupant !== id) {
      if (b === 'forge' && j.forge) return non('La Forge travaille : attends la fin de la fabrication.');
      j.porteurs[occupant]!.poste = null;
    }
  }
  if (p.poste === 'forge' && j.forge) return non('La Forge travaille : attends la fin de la fabrication.');
  p.poste = b;
  log(j, b === 'noyau' ? `${porteurDef(id).nom} s’entraîne à la Tour du Noyau.` : b ? `${porteurDef(id).nom} travaille maintenant : ${batimentDef(b).nom}.` : `${porteurDef(id).nom} se repose.`);
  return { ok: true };
}

/** La Forge refabrique un exemplaire d'une carte déjà trouvée : un doublon de plus */
export function fabriquer(j: Jeu, moduleId: string, now: number): Resultat {
  if (!j.collection[moduleId]) return non('On ne refabrique qu’une carte déjà trouvée.');
  if (j.forge) return non('La Forge est déjà occupée.');
  if (!posteDe(j, 'forge')) return non('Il faut un Porteur au travail à la Forge.');
  const c = coutRefabrication(moduleId);
  if (j.energie < c.energie) return non(`La Forge manque d’énergie : il en faut ${c.energie}.`);
  if (j.composants < c.composants || j.eclats < c.eclats) return non('Pas assez de ressources.');
  j.energie -= c.energie;
  j.composants -= c.composants;
  j.eclats -= c.eclats;
  j.forge = { moduleId, debut: now, fin: now + dureeFabrication(j, moduleId) };
  log(j, `La Forge refabrique ${moduleDef(moduleId).nom}.`);
  return { ok: true };
}

/** Recycle un doublon en Composants */
export function recycler(j: Jeu, moduleId: string): Resultat {
  const c = j.collection[moduleId];
  if (!c || c.doublons < 1) return non('Aucun doublon à recycler.');
  c.doublons--;
  const gain = COLLECTION.recyclage[moduleDef(moduleId).rarete];
  j.composants += gain;
  log(j, `Un doublon de ${moduleDef(moduleId).nom} recyclé : +${gain} composants.`);
  return { ok: true };
}

/** Monte une carte d'un niveau avec ses doublons */
export function monter(j: Jeu, moduleId: string): Resultat {
  const c = j.collection[moduleId];
  if (!c) return non('Carte inconnue.');
  const requis = doublonsRequis(moduleId, c.niveau);
  if (requis === null) return non('Niveau maximum atteint.');
  if (c.doublons < requis) return non(`Il faut ${requis} doublon${requis > 1 ? 's' : ''}.`);
  const cout = composantsNiveau(c.niveau + 1);
  if (j.composants < cout) return non('Pas assez de composants.');
  c.doublons -= requis;
  j.composants -= cout;
  c.niveau++;
  log(j, `${moduleDef(moduleId).nom} passe au niveau ${c.niveau}.`);
  return { ok: true };
}

/** Confie une carte à un Porteur de sa lignée (un exemplaire n'est porté que par un Porteur ; il passe de l'un à l'autre) */
export function greffer(j: Jeu, moduleId: string, porteurId: string): Resultat {
  const p = j.porteurs[porteurId];
  if (!j.collection[moduleId]) return non('Carte inconnue.');
  if (!p || !porteursPresents(j).includes(porteurId)) return non('Porteur inconnu.');
  if (enExpedition(j, porteurId)) return non('Ce Porteur est en expédition.');
  if (porteurDef(porteurId).lignee !== moduleDef(moduleId).lignee) return non('Cette carte ne convient qu’à sa lignée.');
  const ancien = greffesDe(j, moduleId)[0];
  if (ancien === porteurId) return { ok: true };
  if (p.modules.some((k) => k !== moduleId && moduleDe(k) === moduleDe(moduleId))) return non(`${porteurDef(porteurId).nom} porte déjà cette carte dans un autre métal.`);
  if (ancien && enExpedition(j, ancien)) return non('Cette carte est en expédition.');
  if (p.modules.length >= DISTRICT.cartesMax) return non(`${porteurDef(porteurId).nom} porte déjà ${DISTRICT.cartesMax} cartes : retires-en une.`);
  if (ancien) j.porteurs[ancien]!.modules = j.porteurs[ancien]!.modules.filter((m) => m !== moduleId);
  p.modules.push(moduleId);
  log(j, `${moduleDef(moduleId).nom} confiée à ${porteurDef(porteurId).nom}.`);
  return { ok: true };
}

export function degreffer(j: Jeu, moduleId: string): Resultat {
  const id = greffesDe(j, moduleId)[0];
  if (!id) return { ok: true };
  if (enExpedition(j, id)) return non('Ce Porteur est en expédition.');
  j.porteurs[id]!.modules = j.porteurs[id]!.modules.filter((m) => m !== moduleId);
  return { ok: true };
}

/** Résout le premier choix en attente : une des cartes, ou les Éclats si proposé (index -1) */
// ---------- Kit de départ des recrues ----------

/** Trois cartes en fer par recrue, de sa lignée, différentes des cartes de départ des Porteurs nommés */
export const KIT_RECRUES: Record<string, string[]> = {
  coursier: ['gant-arc', 'grappin-cable', 'coeur-turbine'],
  docker: ['crocs-fossiles', 'cuir-recif', 'yeux-nocturnes'],
  guetteur: ['miroir-brume', 'encre-ancienne', 'meche-or'],
};

/** Donne le kit (une seule fois) : la carte rejoint la collection et la recrue la porte si elle est libre */
export function donnerKitRecrues(j: Jeu): void {
  if (j.kitRecrues) return;
  j.kitRecrues = true;
  for (const [id, cartes] of Object.entries(KIT_RECRUES)) {
    const p = j.porteurs[id];
    if (!p) continue;
    for (const c of cartes) {
      const cle = carteId(c, 'fer');
      ajouterCarte(j, cle);
      const libre = !Object.values(j.porteurs).some((q) => q.modules.includes(cle));
      if (libre && p.modules.length < DISTRICT.cartesMax && !p.modules.some((k) => moduleDe(k) === c)) p.modules.push(cle);
    }
  }
}

// ---------- Récompenses de lecture et Ravitaillement du jour ----------
// Étude du 22 octobre 2026 : la découverte des cartes est rapide, mais un exemplaire précis reçoit très peu de doublons
// (45 cartes × 5 métaux). La lecture donne donc des cartes de départ (surtout au début), et le colis du jour donne
// un doublon d'une carte qu'on possède déjà, pour faire monter le deck sans gonfler la découverte.

export const RAVITAILLEMENT = {
  reserveMax: 3,
  /** composants du colis : base + par Strate ouverte */
  composants: 20,
  composantsParStrate: 10,
  /** tous les 7 colis ouverts (pas forcément d'affilée), une carte au choix d'au moins ce métal */
  cycle: 7,
  minimumCycle: 'cuivre' as Rarete,
} as const;

/** La lignée qui a le moins d'exemplaires : la carte de lecture va là où le deck manque le plus */
function ligneeLaMoinsFournie(j: Jeu): 'tech' | 'bio' | 'reso' {
  const n = { tech: 0, bio: 0, reso: 0 };
  for (const id of Object.keys(j.collection)) n[moduleDef(id).lignee]++;
  return (['tech', 'bio', 'reso'] as const).reduce((a, b) => (n[b] < n[a] ? b : a));
}

/** La première lecture d'un chapitre rapporte une carte en fer. Renvoie la carte, ou null si déjà récompensé. */
export function recompenserLecture(j: Jeu, chapitreId: string): string | null {
  if (j.luesRecompensees.includes(chapitreId)) return null;
  j.luesRecompensees.push(chapitreId);
  const lignee = ligneeLaMoinsFournie(j);
  const pool = MODULES.filter((m) => m.lignee === lignee);
  // d'abord une carte qu'on n'a pas encore en fer ; sinon un doublon
  const neuves = pool.filter((m) => !j.collection[carteId(m.id, 'fer')]);
  const liste = neuves.length ? neuves : pool;
  const id = carteId(liste[tireur(j).entier(liste.length)]!.id, 'fer');
  const neuve = ajouterCarte(j, id);
  log(j, `Lecture des Chroniques : ${moduleDef(id).nom} (Fer)${neuve ? '' : ', un doublon'}.`);
  return id;
}

/** Lit un chapitre (le marque comme lu) et donne sa carte à la première lecture */
export function lireChapitre(j: Jeu, chapitreId: string): string | null {
  if (!j.lus.includes(chapitreId)) j.lus.push(chapitreId);
  return recompenserLecture(j, chapitreId);
}

export const colisDisponible = (j: Jeu) => j.chambre && j.ravitaillement.reserve > 0;
/** colis restants avant la carte au choix */
export const colisAvantChoix = (j: Jeu) => RAVITAILLEMENT.cycle - (j.ravitaillement.ouverts % RAVITAILLEMENT.cycle);

export interface Colis { composants: number; doublon: string | null; choix: boolean }

/** Ouvre un colis : des composants, un doublon d'une carte possédée en fer, et tous les 7 colis une carte au choix */
export function ouvrirColis(j: Jeu): Resultat & { colis?: Colis } {
  if (!colisDisponible(j)) return non('Pas de colis pour l’instant : le prochain arrive demain.');
  const r = j.ravitaillement;
  r.reserve--;
  r.ouverts++;
  const composants = RAVITAILLEMENT.composants + RAVITAILLEMENT.composantsParStrate * j.strate;
  j.composants += composants;
  const enFer = Object.keys(j.collection).filter((id) => moduleDef(id).rarete === 'fer');
  const doublon = enFer.length ? enFer[tireur(j).entier(enFer.length)]! : null;
  if (doublon) ajouterCarte(j, doublon);
  const choix = r.ouverts % RAVITAILLEMENT.cycle === 0;
  if (choix) j.choix.push({ source: 'ravitaillement', options: tirerChoix(j, j.strate, RAVITAILLEMENT.minimumCycle) });
  log(j, `Ravitaillement : +${composants} composants${doublon ? `, un doublon de ${moduleDef(doublon).nom}` : ''}${choix ? ', et une carte au choix' : ''}.`);
  return { ok: true, colis: { composants, doublon, choix } };
}

export function prendre(j: Jeu, index: number): Resultat {
  const c = j.choix[0];
  if (!c) return non('Rien à choisir.');
  if (index === -1) {
    if (!c.eclats) return non('Pas d’Éclats proposés ici.');
    j.eclats += c.eclats;
    log(j, `+${c.eclats} Éclats.`);
  } else {
    const id = c.options[index];
    if (!id) return non('Choix inconnu.');
    const neuve = ajouterCarte(j, id);
    log(j, neuve ? `Nouvelle carte : ${moduleDef(id).nom} (${NOMS_RARETE[moduleDef(id).rarete]}).` : `Doublon : ${moduleDef(id).nom}.`);
  }
  j.choix.shift();
  return { ok: true };
}

/** Récupère l'objectif du jour : une carte au choix parmi 3, ou 2 Éclats */
export function reclamerQuotidien(j: Jeu): Resultat {
  if (!quotidienFait(j)) return non('Objectif du jour pas encore rempli.');
  j.choix.push({ source: 'quotidien', options: tirerChoix(j, j.strate), eclats: 2 });
  progresser(j, 'quotidien');
  const q = j.quotidien;
  q.reserve--;
  q.progres = 0;
  q.type = typeDuJour(q.jour + (3 - q.reserve));
  log(j, 'Objectif du jour rempli.');
  return { ok: true };
}

/** Ouvre l'Archive de la semaine passée */
export function ouvrirArchive(j: Jeu): Resultat {
  const n = j.archive.aOuvrir;
  if (!n) return non('L’Archive n’est pas encore prête.');
  j.composants += 40;
  j.choix.push({ source: 'archive', options: tirerChoix(j, j.strate) });
  if (n >= 2) j.eclats += 3;
  if (n >= 3) j.choix.push({ source: 'archive', options: tirerChoix(j, j.strate, 'argent') });
  if (n >= 4) { j.choix.push({ source: 'archive', options: tirerChoix(j, j.strate, 'argent') }); j.eclats += 5; }
  j.archive.aOuvrir = 0;
  log(j, `Archive de la semaine ouverte : palier ${n} sur ${ARCHIVE.paliers.length}.`);
  return { ok: true };
}

// ---------- Expéditions ----------

/** Les cartes qu'un Porteur apporte au deck de combat : celles qu'on lui a confiées, à leur niveau */
export function gestesDe(j: Jeu, id: string): GesteDef[] {
  const cartes = (j.porteurs[id]?.modules ?? []).filter((k) => j.collection[k]).map((k) => ({ id: k, niveau: j.collection[k]!.niveau }));
  const jeu = cartesEnJeu(id, cartes);
  // après la dernière lecture, Véla joue en plus sa Lecture profonde
  if (id === 'vela' && j.actes.lecture === 'autoriser') jeu.push(LECTURE_PROFONDE);
  return jeu;
}

/** Le deck de combat d'une escouade : les cartes de ses Porteurs, plus les cartes du district */
export const deckEscouade = (j: Jeu, escouade: string[]): GesteDef[] => [...escouade.flatMap((id) => gestesDe(j, id)), ...GESTES_SPECIAUX];

/** Les Porteurs de l'histoire qui rejoignent le district quand leur moment arrive ; renvoie les annonces */
export function verifierArrivees(j: Jeu): string[] {
  if (!j.chambre) return [];
  const annonces: string[] = [];
  for (const p of PORTEURS) {
    const a = p.arrivee;
    if (!a || j.arrives.includes(p.id)) continue;
    if ((a.strate && j.strate < a.strate) || (a.forge && j.batiments.forge < a.forge)) continue;
    if (a.accord && !accordOuvertPret(j)) continue;
    j.arrives.push(p.id);
    const t = a.accord
      ? `La Clinique a organisé un Accord ouvert : quarante volontaires, une seule pierre. Elle a pris sur ${p.nom}, et tout le quartier a veillé sa Nuit blanche. « ${a.replique} »`
      : `${p.nom} rejoint le district. « ${a.replique} »`;
    log(j, t);
    annonces.push(t);
  }
  return annonces;
}

/** Fait avancer les fils des Porteurs dont la condition est remplie ; renvoie les annonces */
export function avancerFils(j: Jeu): string[] {
  if (!j.chambre) return [];
  j.fils ??= {};
  const presents = porteursPresents(j);
  const c = { niveau: (id: string) => (j.porteurs[id] ? niveauPorteur(j, id).niveau : 0), present: (id: string) => presents.includes(id),
    strate: j.strate, fragments: j.fragments, batiments: j.batiments };
  const annonces: string[] = [];
  for (const [id, fil] of Object.entries(FILS)) {
    if (!presents.includes(id)) continue;
    let n = j.fils[id] ?? 0;
    while (n < fil.etapes.length && fil.etapes[n]!.test(c)) {
      const e = fil.etapes[n]!;
      j.fils[id] = ++n;
      gagnerXp(j, id, e.xp);
      if (e.confiance) confier(j, e.confiance);
      const t = `${porteurDef(id).nom} · ${fil.titre} : « ${e.titre} » (+${e.xp} XP). À lire dans sa fiche.`;
      log(j, t);
      annonces.push(t);
    }
  }
  return annonces;
}

/**
 * L'Accord ouvert (Bible, 23 octobre 2026) : quand le district a confiance en son directeur et que la Clinique
 * sait greffer, elle offre une pierre relevée à tout volontaire du quartier. Un nouveau Résonant rejoint le district.
 */
export const ACCORD_OUVERT = { clinique: 3, confiance: CONFIANCE.haute } as const;
export const accordOuvertPret = (j: Jeu) => j.batiments.clinique >= ACCORD_OUVERT.clinique && (j.confiance ?? 50) >= ACCORD_OUVERT.confiance;

/** Les Porteurs présents au district (les recrues n'arrivent qu'après la chambre scellée) */
export function porteursPresents(j: Jeu): string[] {
  return PORTEURS.filter((p) => (p.arrivee ? j.arrives.includes(p.id) : p.nomme || j.recrues)).map((p) => p.id);
}

export function disponibles(j: Jeu): string[] {
  return porteursPresents(j).filter((id) => !j.porteurs[id]!.poste && !enExpedition(j, id));
}

// ---------- Mon escouade (décision du 23 octobre 2026) ----------
// L'onglet Porteurs s'ouvre sur l'escouade : les trois qui descendent. On la compose au district, et elle est
// verrouillée pendant une descente : impossible de changer de Porteurs entre deux salles.

/** L'escouade de départ : Ilka, Doran et Véla */
export const ESCOUADE_DEPART = ['ilka', 'doran', 'vela'] as const;

/** L'escouade enregistrée (les Porteurs présents seulement, trois au plus) */
export function escouadeDe(j: Jeu): string[] {
  const presents = porteursPresents(j);
  return [...new Set(j.escouade ?? [])].filter((id) => presents.includes(id)).slice(0, 3);
}

/** Pourquoi l'escouade ne peut pas changer maintenant (null = elle peut) */
export function escouadeVerrouillee(j: Jeu): string | null {
  return j.expedition ? 'L’escouade est en descente : elle ne change qu’au district.' : null;
}

/** Pourquoi un Porteur ne peut pas entrer dans l'escouade (null = il peut).
 * Un Porteur au travail peut entrer (demande du 23 octobre 2026) : il quitte son poste au départ, qui reste vacant
 * (voir posteQuitte). Seuls bloquent : pas encore arrivé, en mission, ou forgeron d'une fabrication en cours. */
export function raisonHorsEscouade(j: Jeu, id: string): string | null {
  if (!porteursPresents(j).includes(id)) return 'Pas encore arrivé au district.';
  if (enMission(j, id)) return 'En mission.';
  if (j.porteurs[id]?.poste === 'forge' && j.forge) return 'Au travail · Forge (fabrication en cours).';
  return null;
}

/** Le poste qu'un Porteur laissera vacant s'il descend (null : il ne travaille pas) */
export function posteQuitte(j: Jeu, id: string): Poste | null {
  return j.porteurs[id]?.poste ?? null;
}

/** Ce que dit l'avertissement : « la Clinique restera sans Porteur », « il ne s'entraînera plus à la Tour » */
export function textePosteQuitte(j: Jeu, id: string): string | null {
  const b = posteQuitte(j, id);
  if (!b) return null;
  return b === 'noyau' ? 'quitte l’entraînement à la Tour du Noyau' : `quitte son poste : ${batimentDef(b).nom} restera vacant`;
}

/** Place un Porteur à la place `place` (0 à 2) de l'escouade. Déjà dans l'escouade : les deux échangent leur place. */
export function placerDansEscouade(j: Jeu, place: number, id: string): Resultat {
  const verrou = escouadeVerrouillee(j);
  if (verrou) return non(verrou);
  if (!Number.isInteger(place) || place < 0 || place > 2) return non('Place inconnue.');
  const actuelle = escouadeDe(j);
  const ancienne = actuelle.indexOf(id);
  if (ancienne < 0) {
    const raison = raisonHorsEscouade(j, id);
    if (raison) return non(`${porteurDef(id).nom} ne peut pas rejoindre l’escouade : ${raison.charAt(0).toLowerCase()}${raison.slice(1)}`);
  }
  const suite = [...actuelle];
  if (ancienne >= 0) {
    if (ancienne === place) return { ok: true };
    const autre = suite[place];
    suite[place] = id;
    if (autre) suite[ancienne] = autre; else suite.splice(ancienne, 1);
  } else if (place < suite.length) {
    const sortant = suite[place]!;
    suite[place] = id;
    log(j, `${porteurDef(id).nom} remplace ${porteurDef(sortant).nom} dans l’escouade.`);
  } else {
    suite.push(id);
    log(j, `${porteurDef(id).nom} rejoint l’escouade.`);
  }
  j.escouade = suite.slice(0, 3);
  return { ok: true };
}

/** Les Porteurs proposés au départ : l'escouade enregistrée (même au travail : ils quitteront leur poste),
 * complétée par des Porteurs libres si l'un d'eux ne peut vraiment pas partir */
export function escouadePourDepart(j: Jeu, interdits: readonly string[] = []): string[] {
  const peut = (id: string) => !interdits.includes(id) && !enExpedition(j, id) && !raisonHorsEscouade(j, id);
  const garde = escouadeDe(j).filter(peut);
  const libres = disponibles(j).filter((id) => peut(id) && !garde.includes(id));
  return [...garde, ...libres].slice(0, 3);
}

// ---------- Les nouveautés (23 octobre 2026) ----------
// Un Porteur arrivé ou une carte trouvée porte une pastille « Nouveau » jusqu'à ce que le joueur l'ait vu :
// en ouvrant sa fiche, ou en quittant l'écran où il était affiché.

/** Les Porteurs arrivés que le joueur n'a pas encore vus */
export const porteursNouveaux = (j: Jeu): string[] => porteursPresents(j).filter((id) => !j.vus.porteurs.includes(id));
/** Les cartes possédées que le joueur n'a pas encore vues */
export const cartesNouvelles = (j: Jeu): string[] => Object.keys(j.collection).filter((k) => !j.vus.cartes.includes(k));

/** Note des Porteurs ou des cartes comme vus ; renvoie true si quelque chose a changé (pour sauvegarder) */
export function marquerVus(j: Jeu, quoi: 'porteurs' | 'cartes', ids: string[]): boolean {
  const deja = new Set(j.vus[quoi]);
  const neufs = ids.filter((id) => !deja.has(id));
  if (neufs.length) j.vus[quoi] = [...j.vus[quoi], ...neufs];
  return neufs.length > 0;
}

/** Vérifie l'escouade et prépare ce qu'elle emporte : ses PV, son deck (filtré pour une Épreuve) et ses Marques */
/** La Strate vaincue la plus profonde (le front compte s'il a été vaincu) */
export const strateVaincue = (j: Jeu) => (j.frontVaincu ? j.strate : j.strate - 1);

const refus = (message: string) => ({ ok: false as const, message });

/** Au départ, ceux qui travaillaient quittent leur poste : il reste vacant jusqu'à ce qu'on y remette quelqu'un */
function quitterPostes(j: Jeu, escouade: string[]): void {
  for (const id of escouade) {
    const b = j.porteurs[id]!.poste;
    if (!b) continue;
    j.porteurs[id]!.poste = null;
    log(j, b === 'noyau' ? `${porteurDef(id).nom} quitte l’entraînement pour descendre.` : `${porteurDef(id).nom} quitte son poste (${batimentDef(b).nom}) pour descendre.`);
  }
}

function escouadePrete(j: Jeu, escouade: string[], filtre?: (g: GesteDef) => boolean, min: number = DISTRICT.deckMin):
  { ok: false; message: string } | { ok: true; message?: undefined; porteurs: PorteurEtat[]; deck: GesteDef[]; bonus: BonusMarques } {
  if (j.expedition) return refus('Une expédition est déjà en cours.');
  if (escouade.length !== 3 || new Set(escouade).size !== 3) return refus('Choisis 3 Porteurs.');
  for (const id of escouade) {
    if (!porteursPresents(j).includes(id)) return refus('Ce Porteur n’est pas encore arrivé au district.');
    if (enMission(j, id)) return refus(`${porteurDef(id).nom} est en mission.`);
    if (j.porteurs[id]?.poste === 'forge' && j.forge) return refus(`${porteurDef(id).nom} ne peut pas quitter la Forge pendant une fabrication.`);
  }
  if (!j.chambre) return refus('Ouvre d’abord la chambre scellée.');
  const deck = deckEscouade(j, escouade).filter((g) => !filtre || g.porteur === null || filtre(g));
  if (deck.length < min) return refus(`Ton deck n’a que ${deck.length} cartes : confie des cartes à ton escouade (${min} au moins).`);
  const porteurs: PorteurEtat[] = escouade.map((id) => ({ id, pv: pvMaxCombat(j, id), pvMax: pvMaxCombat(j, id), aTerre: false }));
  const bonus = bonusEscouade(j, escouade);
  return { ok: true, porteurs, deck, bonus };
}

export function partir(j: Jeu, escouade: string[], strate: number, rng = graine()): Resultat {
  const e = escouadePrete(j, escouade);
  if (!e.ok) return e;
  if (strate < 1 || strate > j.strate) return non('Cette Strate n’est pas encore creusée.');
  // la Strate se parcourt salle par salle (exploration), jusqu'à son gardien
  quitterPostes(j, escouade);
  j.expedition = nouvelleExploration({
    porteurs: e.porteurs, deck: e.deck, strate, rng, garde: j.actes.chambre, facteur: j.actes.fin === 'scellement' ? 0.9 : 1,
    ...(Object.keys(e.bonus).length ? { bonus: e.bonus } : {}),
  });
  j.escouade = [...escouade];
  log(j, `L’escouade descend dans la Strate −${strate}.`);
  return { ok: true };
}

// ---------- Les creuseurs ----------
// Décision du 22 octobre 2026 : on ne descend pas au rythme d'un minuteur, mais au rythme du jeu. Battre le gardien
// du front prépare l'étage suivant ; il ne se creuse qu'avec assez de creuseurs, et la Tour du Noyau doit pouvoir les loger.
// Les creuseurs qui percent un étage y restent pour l'étayer : on ne peut pas en faire de réserve pour plus tard.
// On gagne des creuseurs en jouant : fouilles ciblées, missions, Épreuves, gardiens vaincus et Confiance du district.

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
  /** un chantier terminé quand la Confiance est haute attire parfois un volontaire */
  confiance: 0.3,
} as const;

export const logementCreuseurs = (j: Pick<Jeu, 'batiments'>) => CREUSEURS.logement[j.batiments.noyau] ?? CREUSEURS.logement[CREUSEURS.logement.length - 1]!;
export function creuseursRequis(strate: number): number {
  const t = CREUSEURS.requis;
  const max = CREUSEURS.logement[CREUSEURS.logement.length - 1]!;
  return Math.min(max, strate < t.length ? t[strate]! : t[t.length - 1]! + CREUSEURS.parStrateEnsuite * (strate - t.length + 1));
}
/** Le niveau du Noyau qu'il faut pour loger les creuseurs d'une Strate */
export const noyauRequis = (strate: number) => Math.max(1, CREUSEURS.logement.findIndex((n) => n >= creuseursRequis(strate)));

/** Ajoute des creuseurs (dans la limite du logement) ; renvoie le nombre réellement arrivé */
export function gagnerCreuseurs(j: Jeu, n: number, raison: string): number {
  const avant = j.creuseurs ?? 0;
  j.creuseurs = Math.min(logementCreuseurs(j), avant + n);
  const arrives = j.creuseurs - avant;
  if (arrives > 0) log(j, `+${arrives} creuseur${arrives > 1 ? 's' : ''} : ${raison}.`);
  return arrives;
}

/** Ce qui manque pour creuser l'étage suivant (null s'il ne manque rien, ou si le gardien n'est pas vaincu) */
export function manquePourCreuser(j: Jeu): { creuseurs: number; noyau: number } | null {
  if (!j.frontVaincu) return null;
  const cible = j.strate + 1;
  const c = Math.max(0, creuseursRequis(cible) - j.creuseurs);
  const n = Math.max(0, noyauRequis(cible) - j.batiments.noyau);
  return c || n ? { creuseurs: c, noyau: n } : null;
}

/** Creuse l'étage suivant si tout est prêt ; renvoie true si une Strate s'est ouverte */
export function creuser(j: Jeu): boolean {
  if (!j.frontVaincu || manquePourCreuser(j)) return false;
  j.creuseurs -= creuseursRequis(j.strate + 1);
  j.strate++;
  j.frontVaincu = false;
  log(j, `Les creuseurs percent la roche : la Strate −${j.strate} est ouverte.`);
  return true;
}

// ---------- Les fouilles ciblées ----------
// Quand on bloque devant une Strate : une descente courte (4 rangées, sans gardien ni salle scellée) dans une Strate déjà
// vaincue, vers un filon choisi. Les cartes trouvées en route sont de la lignée visée ; le filon donne ce qu'on cherchait.

export const CIBLES_FOUILLE: Record<CibleFouille, { nom: string; texte: string }> = {
  tech: { nom: 'Cartes augmentées', texte: 'Les cartes trouvées sont des cartes d’Augmentés, et le filon en offre trois au choix.' },
  bio: { nom: 'Cartes génés', texte: 'Les cartes trouvées sont des cartes de Génés, et le filon en offre trois au choix.' },
  reso: { nom: 'Cartes résonantes', texte: 'Les cartes trouvées sont des cartes de Résonants, et le filon en offre trois au choix.' },
  composants: { nom: 'Composants', texte: 'Le filon double les composants rapportés, et en ajoute.' },
  eclats: { nom: 'Éclats', texte: 'Le filon rapporte des Éclats : 2, et 3 à partir de la Strate −5.' },
};
export const estLignee = (c?: CibleFouille): c is Lignee => c === 'tech' || c === 'bio' || c === 'reso';

export function fouiller(j: Jeu, escouade: string[], strate: number, cible: CibleFouille, rng = graine()): Resultat {
  const e = escouadePrete(j, escouade);
  if (!e.ok) return e;
  if (!CIBLES_FOUILLE[cible]) return non('Cible inconnue.');
  if (strate < 1 || strate > strateVaincue(j)) return non('On ne fouille que les Strates déjà vaincues.');
  quitterPostes(j, escouade);
  j.expedition = nouvelleExploration({
    porteurs: e.porteurs, deck: e.deck, strate, rng, garde: j.actes.chambre, facteur: j.actes.fin === 'scellement' ? 0.9 : 1, fouille: cible,
    ...(Object.keys(e.bonus).length ? { bonus: e.bonus } : {}),
  });
  j.escouade = [...escouade];
  log(j, `L’escouade part fouiller la Strate −${strate} (${CIBLES_FOUILLE[cible].nom.toLowerCase()}).`);
  return { ok: true };
}

// ---------- Les missions ----------
// Un Porteur qui ne travaille pas et ne descend pas peut partir en mission dans la dernière Strate vaincue.
// La mission tourne même jeu fermé ; au retour, il rapporte des composants et des doublons de cartes de sa lignée.

export const MISSIONS = {
  max: 2,
  // l'énergie au départ (23 octobre 2026) : vivres, lampes et piles pour l'expédition
  courte: { heures: 2, composants: 14, doublons: 1, nouvelle: 0, usure: 4, energie: 30 },
  longue: { heures: 8, composants: 45, doublons: 2, nouvelle: 0.35, usure: 8, energie: 100 },
} as const;
export type DureeMission = 'courte' | 'longue';
export interface Mission { porteur: string; strate: number; duree: DureeMission; debut: number; fin: number }

/** La Strate où partent les missions : la dernière vaincue */
export const strateMission = (j: Jeu) => strateVaincue(j);

export function envoyerMission(j: Jeu, id: string, duree: DureeMission, now: number): Resultat {
  const m = MISSIONS[duree];
  if (!m) return non('Durée inconnue.');
  if (!j.chambre || strateMission(j) < 1) return non('Il faut avoir vaincu une Strate pour y envoyer quelqu’un.');
  if (!porteursPresents(j).includes(id)) return non('Porteur inconnu.');
  if (j.porteurs[id]!.poste) return non(`${porteurDef(id).nom} travaille au district.`);
  if (enExpedition(j, id)) return non(`${porteurDef(id).nom} n’est pas au district.`);
  if (j.missions.length >= MISSIONS.max) return non(`${MISSIONS.max} missions au plus en même temps.`);
  if (j.energie < m.energie) return non(`Il faut ${m.energie} énergie pour équiper la mission.`);
  j.energie -= m.energie;
  j.missions.push({ porteur: id, strate: strateMission(j), duree, debut: now, fin: now + m.heures * 3_600_000 });
  log(j, `${porteurDef(id).nom} part en mission dans la Strate −${strateMission(j)} (${m.heures} h).`);
  return { ok: true };
}

/** Le retour d'une mission (appelé par tick) : renvoie l'annonce */
function retourDeMission(j: Jeu, m: Mission): string {
  const d = MISSIONS[m.duree];
  const p = porteurDef(m.porteur);
  const composants = Math.round(d.composants * (1 + 0.25 * (m.strate - 1)));
  j.composants += composants;
  const t = tireur(j);
  const cartes: string[] = [];
  // des doublons de cartes qu'on a déjà, dans la lignée du Porteur (fer et cuivre)
  const possedees = Object.keys(j.collection).filter((k) => moduleDef(k).lignee === p.lignee && ['fer', 'cuivre'].includes(moduleDef(k).rarete));
  for (let k = 0; k < d.doublons && possedees.length; k++) cartes.push(possedees[t.entier(possedees.length)]!);
  if (t.nombre() < d.nouvelle) cartes.push(tirerTrouvaille(j, m.strate, 'fer', p.lignee));
  for (const c of cartes) ajouterCarte(j, c);
  const recrues = t.nombre() < (m.duree === 'longue' ? CREUSEURS.missionLongue : CREUSEURS.missionCourte) ? 1 : 0;
  const arrives = recrues ? gagnerCreuseurs(j, recrues, `${p.nom} ramène des fouilleurs de mission`) : 0;
  if (arrives) creuser(j);
  const q = j.porteurs[m.porteur]!;
  q.usure = Math.min(usureMax(m.porteur), q.usure + d.usure);
  const avantMarque = progresMarque(j, m.porteur)?.acquise;
  q.faits = { ...q.faits, missions: (q.faits?.missions ?? 0) + 1 };
  const marque = progresMarque(j, m.porteur);
  if (marque?.acquise && !avantMarque) log(j, `${p.nom} gagne la Marque ${marque.nom} : ${marque.texte}`);
  const gainXp = Math.round(XP.missionHeure * d.heures * (1 + 0.25 * (m.strate - 1)));
  const monte = gagnerXp(j, m.porteur, gainXp);
  const texte = `${p.nom} rentre de mission : +${composants} composants, +${gainXp} XP${monte ? ` (niveau ${monte})` : ''}${cartes.length ? `, ${cartes.map((c) => moduleDef(c).nom).join(', ')}` : ''}${arrives ? `, +${arrives} creuseur${arrives > 1 ? 's' : ''}` : ''}.`;
  log(j, texte);
  return texte;
}

// ---------- L'entraînement à la Tour (23 octobre 2026) ----------
// Pour devenir plus fort sans descendre : un Porteur posté à la Tour du Noyau s'entraîne avec les creuseurs et gagne
// de l'XP avec le temps, même jeu fermé. Plus lent qu'une mission, sans risque ni Usure, et s'il rejoint l'escouade, il quitte l'entraînement.
// Plafond : 4 niveaux par niveau de la Tour ; au-delà, l'expérience se gagne dans les Strates.
export const ENTRAINEMENT = {
  /** XP par heure selon le niveau de la Tour du Noyau (index = niveau) */
  xpHeure: [0, 3, 4, 5, 6, 8],
  /** énergie consommée par heure d'entraînement (23 octobre 2026) : sans énergie, l'entraînement s'arrête */
  energieHeure: [0, 15, 25, 35, 50, 70],
  niveauxParNoyau: 4,
} as const;
export const xpEntrainement = (j: Jeu) => ENTRAINEMENT.xpHeure[j.batiments.noyau] ?? 0;
export const energieEntrainement = (j: Jeu) => ENTRAINEMENT.energieHeure[j.batiments.noyau] ?? ENTRAINEMENT.energieHeure[ENTRAINEMENT.energieHeure.length - 1]!;
export const plafondEntrainement = (j: Jeu) => Math.min(XP.niveauMax, ENTRAINEMENT.niveauxParNoyau * j.batiments.noyau);
/** XP totale pour atteindre un niveau depuis le niveau 1 */
const xpPourAtteindre = (niveau: number) => { let s = 0; for (let n = 1; n < niveau; n++) s += xpPourNiveau(n); return s; };

/** Les heures d'entraînement à compter sur une durée : 0 sans Porteur à la Tour, et pas au-delà du plafond
 *  (l'énergie, elle, est décomptée par tick) */
function heuresEntrainement(j: Jeu, heures: number): number {
  const id = posteDe(j, 'noyau');
  if (!id || heures <= 0 || enExpedition(j, id)) return 0;
  const plafond = plafondEntrainement(j);
  const n = niveauPorteur(j, id).niveau;
  if (n >= plafond) return 0;
  const tete = Math.max(...Object.keys(j.porteurs).map((k) => niveauPorteur(j, k).niveau));
  const parHeure = xpEntrainement(j) * (tete - n >= 2 ? XP.rattrapage : 1);
  if (parHeure <= 0) return 0;
  return Math.min(heures, (xpPourAtteindre(plafond) - (j.porteurs[id]!.xp ?? 0)) / parHeure);
}

/** Le temps passé à la Tour (appelé par tick) : renvoie l'annonce d'un niveau gagné */
function entrainer(j: Jeu, heures: number): string | null {
  const id = posteDe(j, 'noyau');
  if (!id || heures <= 0 || enExpedition(j, id)) return null;
  const d = j.porteurs[id]!;
  const plafond = plafondEntrainement(j);
  const avant = niveauPorteur(j, id).niveau;
  if (avant >= plafond) return null;
  const tete = Math.max(...Object.keys(j.porteurs).map((k) => niveauPorteur(j, k).niveau));
  const gain = xpEntrainement(j) * heures * (tete - avant >= 2 ? XP.rattrapage : 1);
  // l'XP s'accumule à la fraction près (le district se met à jour chaque seconde), sans dépasser le plafond
  d.xp = Math.min((d.xp ?? 0) + gain, xpPourAtteindre(plafond));
  const apres = niveauPorteur(j, id).niveau;
  if (apres <= avant) return null;
  const t = `${porteurDef(id).nom} s’est entraîné à la Tour : niveau ${apres}, ${pvNiveau(j, id)} PV.`;
  log(j, t);
  return t;
}

// ---------- Le Comptoir (23 octobre 2026) ----------
// « Forger, acheter ou combattre » : acheter manquait. Les fouilleurs du quartier y revendent chaque jour quelques cartes
// trouvées dans les Strates, à prix fixe : on voit la carte avant de payer, aucun hasard n'est jamais payé.
// L'or et la nacre ne s'y vendent jamais : ils restent à trouver. L'argent n'y paraît qu'une fois la Strate −4 vaincue.
// Une offre sur deux est, quand c'est possible, un doublon d'une carte qu'on possède : de quoi la faire monter.
export const COMPTOIR = {
  /** les étals de chaque jour selon le niveau du Comptoir (index = niveau ; 0 = pas encore construit) */
  etals: [[], ['fer', 'fer', 'cuivre'], ['fer', 'fer', 'cuivre', 'cuivre'], ['fer', 'cuivre', 'cuivre', 'argent'],
    ['fer', 'fer', 'cuivre', 'cuivre', 'argent'], ['fer', 'fer', 'cuivre', 'cuivre', 'argent', 'argent']] as Rarete[][],
  /** prix fixes : environ 1,5 fois la refabrication à la Forge (qui, elle, ne refait qu'une carte déjà trouvée) */
  prix: { fer: { composants: 40, eclats: 0 }, cuivre: { composants: 120, eclats: 0 }, argent: { composants: 300, eclats: 3 } } as Partial<Record<Rarete, { composants: number; eclats: number }>>,
  strateArgent: 4,
  partDoublons: 0.5,
} as const;

export interface Comptoir { jour: number; offres: string[]; achetes: number[]; rng: number }
function comptoirVide(now: number, rng: number): Comptoir {
  return { jour: jourDe(now), offres: [], achetes: [], rng: (rng ^ 0x9e3779b9) >>> 0 };
}

/** Les métaux des étals du jour (l'argent n'arrive qu'une fois la Strate −4 vaincue ; avant, du cuivre à sa place) */
export function etalsDuComptoir(j: Jeu): Rarete[] {
  return (COMPTOIR.etals[j.batiments.comptoir] ?? []).map((r) => (r === 'argent' && strateVaincue(j) < COMPTOIR.strateArgent ? 'cuivre' : r));
}
export const prixComptoir = (id: string) => COMPTOIR.prix[moduleDef(id).rarete] ?? { composants: 0, eclats: 0 };

/** Renouvelle les offres chaque jour ; un Comptoir agrandi dans la journée ajoute ses nouveaux étals sans toucher aux autres */
export function garnirComptoir(j: Jeu, now: number): void {
  const c = j.comptoir;
  const jour = jourDe(now);
  if (c.jour !== jour) { c.jour = jour; c.offres = []; c.achetes = []; }
  const etals = etalsDuComptoir(j);
  if (c.offres.length >= etals.length) return;
  const t = tireur(c);
  const bases = new Set(c.offres.map(moduleDe));
  for (let i = c.offres.length; i < etals.length; i++) {
    const r = etals[i]!;
    let id: string | undefined;
    const aMonter = Object.keys(j.collection).filter((k) => k.endsWith('@' + r) && !bases.has(moduleDe(k)) && doublonsRequis(k, j.collection[k]!.niveau) !== null);
    if (aMonter.length && t.nombre() < COMPTOIR.partDoublons) id = aMonter[t.entier(aMonter.length)];
    for (let g = 0; !id && g < 40; g++) {
      const m = MODULES[t.entier(MODULES.length)]!;
      if (!bases.has(m.id)) id = carteId(m.id, r);
    }
    if (!id) break;
    bases.add(moduleDe(id));
    c.offres.push(id);
  }
}

/** Achète l'offre n° index du Comptoir : la carte rejoint la collection (nouvelle carte, ou doublon) */
export function acheter(j: Jeu, index: number, now = j.dernierTick): Resultat {
  if (!j.batiments.comptoir) return non('Le Comptoir est fermé : remets-le d’abord en état.');
  garnirComptoir(j, now);
  const c = j.comptoir;
  const id = c.offres[index];
  if (!id) return non('Cette offre n’existe pas.');
  if (c.achetes.includes(index)) return non('Déjà acheté aujourd’hui : le Comptoir se renouvelle demain.');
  const p = prixComptoir(id);
  if (j.composants < p.composants || j.eclats < p.eclats) return non('Pas assez de ressources.');
  j.composants -= p.composants;
  j.eclats -= p.eclats;
  c.achetes.push(index);
  const neuve = ajouterCarte(j, id);
  log(j, neuve ? `Comptoir : nouvelle carte, ${moduleDef(id).nom} (${NOMS_RARETE[moduleDef(id).rarete]}).` : `Comptoir : un doublon de ${moduleDef(id).nom}.`);
  return { ok: true };
}

// ---------- Les Épreuves de la semaine ----------
// Trois combats à règle spéciale, renouvelés chaque lundi, contre le gardien de la dernière Strate vaincue.
// La première victoire de chaque Épreuve dans la semaine donne une carte au choix, dont une en argent au moins.

export interface EpreuveDef {
  id: string;
  nom: string;
  regle: string;
  /** les cartes qui restent au district (les cartes du district viennent toujours) */
  filtre?: (g: GesteDef) => boolean;
  /** les Porteurs qui ne peuvent pas venir */
  interdits?: string[];
  /** aucune Résonance de tout le combat */
  sansResonance?: boolean;
}
export const EPREUVES: EpreuveDef[] = [
  { id: 'brouillage', nom: 'Fréquences brouillées', regle: 'Aucune Résonance de tout le combat. Les Échos (trois Fréquences identiques) comptent toujours.', sansResonance: true },
  { id: 'fer', nom: 'Le fer seulement', regle: 'Seules tes cartes en fer descendent : c’est le moment de les avoir montées de niveau.', filtre: (g) => !!g.carte && moduleDef(g.carte).rarete === 'fer' },
  { id: 'nus', nom: 'À découvert', regle: 'Les cartes qui protègent restent au district : aucun bouclier.', filtre: (g) => g.type !== 'bouclier' },
  { id: 'sans-soin', nom: 'Sans soigneur', regle: 'Les cartes qui soignent restent au district.', filtre: (g) => g.type !== 'soin' },
  { id: 'releve', nom: 'La relève', regle: 'Ilka, Doran et Véla restent au district : ce combat est pour les autres.', interdits: ['ilka', 'doran', 'vela'] },
];
export const EPREUVE_DECK_MIN = 9;

/** Les trois Épreuves de la semaine (les mêmes pour tous les joueurs, tirées d'après le numéro de la semaine) */
export function epreuvesDeLaSemaine(now: number): EpreuveDef[] {
  const t = tireur({ rng: (semaineDe(now) * 2654435761) >>> 0 });
  return t.melanger(EPREUVES.slice()).slice(0, 3);
}
export const epreuveDef = (id: string) => EPREUVES.find((e) => e.id === id);
/** La Strate d'une Épreuve : la dernière vaincue */
export const strateEpreuve = (j: Jeu) => Math.max(1, strateVaincue(j));

export function partirEpreuve(j: Jeu, escouade: string[], id: string, now: number, rng = graine()): Resultat {
  const ep = epreuveDef(id);
  if (!ep || !epreuvesDeLaSemaine(now).some((e) => e.id === id)) return non('Cette Épreuve n’est pas au programme cette semaine.');
  if (strateVaincue(j) < 1) return non('Les Épreuves s’ouvrent après la première Strate vaincue.');
  const interdit = escouade.find((p) => ep.interdits?.includes(p));
  if (interdit) return non(`${porteurDef(interdit).nom} ne peut pas participer à cette Épreuve.`);
  const e = escouadePrete(j, escouade, ep.filtre, EPREUVE_DECK_MIN);
  if (!e.ok) return e;
  const strate = strateEpreuve(j);
  const x = nouvelleExpedition({
    porteurs: e.porteurs, deck: e.deck, strate, rng, sequence: [zoneDe(strate).boss], force: forceStrate(strate),
    ...(Object.keys(e.bonus).length ? { bonus: e.bonus } : {}),
  });
  if (ep.sansResonance) x.combat.sansResonance = true;
  quitterPostes(j, escouade);
  j.expedition = { ...x, epreuve: id };
  log(j, `Épreuve de la semaine : ${ep.nom}.`);
  return { ok: true };
}

/** Appelé quand le combat en cours vient de se terminer */
// ---------- L'exploration des Strates ----------

/** Les rencontres en route : chacune propose un petit choix qui touche au butin, aux PV ou au district */
export const RENCONTRES: Record<string, (j: Jeu) => { titre: string; texte: string; options: string[] }> = {
  veilleur: () => ({ titre: 'Un Veilleur sous les gravats', texte: 'Un fouilleur des Veilleurs de Sédime est coincé sous un éboulis. Il tient serré contre lui un carnet couvert de croquis.',
    options: ['Le dégager et le soigner (−4 PV chacun)', 'Prendre son carnet et repartir', 'Passer ton chemin'] }),
  pilleur: () => ({ titre: 'Un pilleur acculé', texte: 'Un pilleur de Strates, dos au mur, serre un sac plein de cristaux. Il ne cherche pas la bagarre.',
    options: ['Le laisser filer', 'Lui prendre son sac', 'L’affronter pour tout récupérer'] }),
  brigade: (j) => (j.actes.chambre === 'orseve'
    ? { titre: 'Une patrouille alliée', texte: 'Une patrouille des Brigades du Serment de Veyr vous salue : depuis l’accord avec la Maison Orsève, vous êtes du même côté.',
      options: ['Accepter leurs soins (+25 % de PV)', 'Les saluer et continuer'] }
    : { titre: 'Les Brigades barrent la route', texte: 'Une patrouille du Serment de Veyr bloque le couloir. Leur sergent réclame un « droit de passage ».',
      options: ['Payer le passage (20 composants)', 'Les contourner par les gaines (−5 PV chacun)', 'Forcer le passage'] }),
  cristal: () => ({ titre: 'Un cristal qui murmure', texte: 'Dans une niche, un cristal ancien murmure. Le son ressemble à une voix, sans les mots.',
    options: ['L’écouter', 'Le rapporter au district', 'Le laisser où il est'] }),
  marchand: () => ({ titre: 'Un marchand des bas-fonds', texte: 'Un marchand a installé son étal dans une ancienne salle, entre deux lampes à algues. Il a « de tout, pour qui sait payer ».',
    options: ['Échanger 30 composants contre une carte', 'Acheter des soins (15 composants, +30 % de PV)', 'Passer'] }),
  // Bible, 23 octobre 2026 : un Sauvage (greffé sans Clinique, sans Lecture) et un vendeur de pierres mortes
  sauvage: (j) => ({ titre: 'Un Sauvage', texte: 'Un homme recroquevillé contre un pilier, une mèche à peine dorée collée au front. Il s’est greffé une brisure achetée au marché noir, sans Lecture. Il gronde des mots qui ne sont pas les siens.',
    options: [j.expedition?.porteurs.some((p) => p.id === 'vela' && p.pv > 0) ? 'Laisser Véla lire sa pierre' : 'Lui parler doucement (−3 PV chacun)', 'L’affronter', 'Passer ton chemin'] }),
  faussaire: () => ({ titre: 'Un vendeur de pierres', texte: 'Sur une couverture, une rangée de cristaux tous identiques. « Des pierres d’Accord, directeur. Jamais portées. Une vierge pour vingt-cinq composants. » Elles sont ternes. Toutes.',
    options: ['Lui acheter une « vierge » (25 composants)', 'Lui faire rendre ses pierres', 'Passer'] }),
  source: () => ({ titre: 'Une source chaude', texte: 'Entre deux piliers, une source chaude jaillit de la roche. L’eau sent le fer et le sel.',
    options: ['S’y reposer (+25 % de PV)', 'Continuer sans s’arrêter'] }),
};

const soigner = (x: Expedition, part: number) => x.porteurs.map((p) => ({ ...p, pv: Math.min(p.pvMax, Math.max(0, p.pv) + Math.round(p.pvMax * part)) }));
const blesser = (x: Expedition, v: number) => x.porteurs.map((p) => ({ ...p, pv: p.pv > 0 ? Math.max(1, p.pv - v) : p.pv }));

export function entrer(j: Jeu, salle: number): Resultat {
  if (!j.expedition) return non('Aucune expédition en cours.');
  const r = entrerSalle(j.expedition, salle);
  j.expedition = r.x;
  return r.ok ? { ok: true } : non(r.message ?? 'Impossible d’aller par là.');
}

/** Répond à la rencontre en cours */
export function repondre(j: Jeu, choix: number): Resultat {
  const x = j.expedition;
  if (!x?.rencontre) return non('Personne à qui répondre.');
  const id = x.rencontre;
  const opts = RENCONTRES[id]!(j).options;
  if (choix < 0 || choix >= opts.length) return non('Choix inconnu.');
  const n = Math.round(8 * (1 + 0.25 * (x.strate - 1)));
  const gains = { ...x.gains! };
  let y: Expedition = { ...x, rencontre: undefined };
  let recit = 'L’escouade reprend sa route.';
  const allie = j.actes.chambre === 'orseve';
  if (id === 'veilleur') {
    if (choix === 0) { y.porteurs = blesser(x, 4); gains.eclats++; confier(j, 3); recit = 'Le Veilleur, reconnaissant, te confie un Éclat trouvé plus bas. Le quartier en entendra parler.'; }
    else if (choix === 1) { y.butin += n * 2; confier(j, -3); recit = `Le carnet se revend bien : +${n * 2} composants. Le Veilleur, lui, s’en souviendra.`; }
  } else if (id === 'pilleur') {
    if (choix === 0) { confier(j, 2); recit = 'Le pilleur file sans demander son reste. Il racontera que le directeur sait être juste.'; }
    else if (choix === 1) { y.butin += n * 2; recit = `Il lâche son sac et s’enfuit : +${n * 2} composants.`; }
    else { gains.cartes++; y = lancerCombat({ ...y, recit: 'Le pilleur sort un pied-de-biche. Son sac contient une carte : elle sera à toi.' }, 'pilleur'); }
  } else if (id === 'brigade') {
    if (allie) { if (choix === 0) { y.porteurs = soigner(x, 0.25); recit = 'Les Brigades pansent l’escouade (+25 % de PV).'; } }
    else if (choix === 0) { y.butin = Math.max(0, y.butin - 20); recit = 'Le sergent empoche les composants et s’écarte.'; }
    else if (choix === 1) { y.porteurs = blesser(x, 5); recit = 'Les gaines sont étroites et brûlantes, mais vous passez (−5 PV chacun).'; }
    else { confier(j, 2); y = lancerCombat({ ...y, recit: 'Le district ne paie pas pour passer chez lui.' }, 'brigadier'); }
  } else if (id === 'cristal') {
    const vela = x.porteurs.some((p) => p.id === 'vela' && p.pv > 0);
    if (choix === 0) {
      if (vela) { gains.eclats++; recit = 'Véla écoute longtemps. « Il a peur d’être oublié », dit-elle. Le cristal se fend et laisse un Éclat.'; }
      else { y.porteurs = blesser(x, 3); recit = 'Le murmure s’accroche aux pensées de l’escouade. Personne ne dort bien ce soir-là (−3 PV chacun).'; }
    } else if (choix === 1) { gains.cartes++; y.porteurs = blesser(x, 2); recit = 'Le cristal pèse lourd dans le sac, et il chuchote encore. Au district, il deviendra une carte (−2 PV chacun).'; }
  } else if (id === 'marchand') {
    if (choix === 0) {
      if (y.butin < 30) return non('Il te faut 30 composants dans le butin de l’expédition.');
      y.butin -= 30; gains.cartes++; recit = 'Le marchand glisse un cristal gravé dans ta main. Au district, il deviendra une carte.';
    } else if (choix === 1) {
      if (y.butin < 15) return non('Il te faut 15 composants dans le butin de l’expédition.');
      y.butin -= 15; y.porteurs = soigner(x, 0.3); recit = 'Onguents d’algues et bandages propres : +30 % de PV.';
    }
  } else if (id === 'source') {
    if (choix === 0) { y.porteurs = soigner(x, 0.25); recit = 'L’eau chaude délie les muscles (+25 % de PV).'; }
  } else if (id === 'sauvage') {
    const vela = x.porteurs.some((p) => p.id === 'vela' && p.pv > 0);
    if (choix === 0) {
      if (vela) { confier(j, 3); gains.eclats++; recit = 'Véla pose la main sur sa nuque. « C’est une brisure de créature des hauteurs. Elle a peur d’être enfermée. » Il se calme, et vous laisse un Éclat en remerciement. La Clinique le retirera.'; }
      else { y.porteurs = blesser(x, 3); confier(j, 2); recit = 'Il finit par se calmer et accepte qu’on le conduise à la Clinique. Ses accès ont laissé des bleus à tout le monde (−3 PV chacun).'; }
    } else if (choix === 1) { y = lancerCombat({ ...y, recit: 'Le penchant l’emporte : il se jette sur l’escouade.' }, 'sauvage'); }
  } else if (id === 'faussaire') {
    if (choix === 0) {
      if (y.butin < 25) return non('Il te faut 25 composants dans le butin de l’expédition.');
      y.butin -= 25; recit = 'Au district, la Clinique tranche : une pierre morte. Elle a refusé un Accord, et ne prendra plus jamais chez personne. Le quartier en rit encore.';
    } else if (choix === 1) { y.butin += n; confier(j, 2); recit = `Il remballe en grommelant et rend ce qu’il a pris aux fouilleurs : +${n} composants. Les familles volées sauront qui remercier.`; }
  }
  if (y.phase !== 'combat') y = { ...y, recit };
  y.gains = gains;
  j.expedition = y;
  return { ok: true };
}

/** Remonte au district depuis l'entrée ou un campement, avec tout ce qui a été trouvé */
export function retraite(j: Jeu): Resultat {
  const x = j.expedition;
  if (!x || !peutRemonter(x)) return non('On ne remonte qu’à l’entrée ou depuis un campement.');
  j.expedition = { ...x, retraite: true, terminee: true };
  return { ok: true };
}

/** Fuir le combat en reculant d'une salle sur la carte (l'ennemi frappe une dernière fois) */
export function fuirSalle(j: Jeu): Resultat {
  if (!j.expedition) return non('Aucune expédition en cours.');
  const r = reculer(j.expedition);
  if (!r.ok) return non(r.message ?? 'Impossible de reculer.');
  j.expedition = r.x;
  return { ok: true };
}

/** Fuir le combat jusqu'au district : à faire suivre de remonter(), qui garde 75 % des composants et ajoute de l'Usure */
export function fuir(j: Jeu): Resultat {
  if (!j.expedition) return non('Aucune expédition en cours.');
  const r = fuirAuDistrict(j.expedition);
  if (!r.ok) return non(r.message ?? 'Impossible de fuir.');
  j.expedition = r.x;
  return { ok: true };
}

export function finDeCombat(j: Jeu): void {
  if (!j.expedition) return;
  j.expedition = cloturerCombat(j.expedition);
}

export function continuer(j: Jeu): void {
  if (j.expedition) j.expedition = combatSuivant(j.expedition);
}

/** Retour au district : butin, Usure, et nouvel étage creusé après une victoire complète */
export interface Retour {
  butin: number; nouvelleStrate: boolean; victoire: boolean; fragment: string | null; tutoriel?: boolean;
  /** l'escouade a fui un combat */
  fuite?: boolean;
  /** cartes trouvées en route, Éclats gagnés */
  cartes: string[]; eclats: number;
  /** l'expérience gagnée par chaque Porteur de l'escouade, et les niveaux pris */
  xp?: { id: string; xp: number; niveau?: number }[];
}

export function remonter(j: Jeu): Retour {
  const x = j.expedition;
  if (!x) return { butin: 0, nouvelleStrate: false, victoire: false, fragment: null, cartes: [], eclats: 0 };
  const victoire = x.terminee && !x.retraite && x.combat.issue === 'victoire';
  const defaite = x.combat.issue === 'defaite' && !x.retraite;
  const brut = defaite ? Math.floor(x.butin * DISTRICT.butinDefaite) : x.fuite ? Math.floor(x.butin * DISTRICT.butinFuite) : x.butin;
  const butin = x.tutoriel ? brut : Math.round(brut * (j.actes.chambre === 'district' ? 1.2 : 1) * (j.actes.fin === 'pacte' ? 1.1 : 1));
  j.composants += butin;
  const finaux = x.carte && x.phase !== 'combat' ? x.porteurs : x.combat.porteurs;
  for (const p of finaux) {
    const d = j.porteurs[p.id]!;
    const usure = DISTRICT.usureExpedition * (j.actes.fin === 'archives' ? 1.5 : 1) * (x.fouille || x.epreuve ? 0.5 : 1);
    d.usure = Math.min(usureMax(p.id), d.usure + usure + (p.pv <= 0 ? DISTRICT.usureATerre : 0) + (x.fuite ? DISTRICT.usureFuite : 0));
  }
  let nouvelleStrate = false;
  let butinFilon = 0;
  let fragment: string | null = null;
  if (x.tutoriel) {
    j.expedition = null;
    if (victoire) {
      j.chambre = true;
      j.recrues = true;
      donnerKitRecrues(j);
      fragment = ajouterFragment(j);
      ajouterCarte(j, CARTE_CHAMBRE);
      log(j, 'La chambre scellée est ouverte. Trois recrues rejoignent le district : un Coursier, un Docker et un Guetteur.');
    } else log(j, 'Le gardien de la chambre a repoussé l’escouade. Elle se repose, puis réessaie.');
    return { butin, nouvelleStrate, victoire, fragment, tutoriel: true, cartes: victoire ? [CARTE_CHAMBRE] : [], eclats: 0 };
  }

  // les trouvailles : une chance de carte par combat normal gagné, un choix de 3 sur le boss
  const victoires = x.carte ? (x.gagnes ?? 0) : x.combat.issue === 'victoire' ? x.index + 1 : x.index;
  // une fouille finit sur le filon, pas sur un combat : tous ses combats sont des combats normaux
  const normales = victoires - (victoire && !x.fouille ? 1 : 0);
  const lignee = estLignee(x.fouille) ? x.fouille : undefined;
  const t = tireur(j);
  const cartes: string[] = [];
  let eclats = 0;
  for (let k = 0; k < normales; k++) {
    if (t.nombre() < COLLECTION.chanceCombat + (j.actes.chambre === 'commission' ? 0.05 : 0)) cartes.push(tirerTrouvaille(j, x.strate, 'fer', lignee));
    if (x.strate >= 5 && t.nombre() < 0.1) eclats++;
  }
  progresser(j, 'combat', victoires);
  if (victoire && x.fouille) {
    if (tireur(j).nombre() < CREUSEURS.fouille) gagnerCreuseurs(j, 1, 'un fouilleur perdu retrouvé pendant la fouille');
    // le filon : ce que la fouille visait
    if (lignee) j.choix.push({ source: 'fouille', options: tirerChoix(j, x.strate, 'fer', lignee) });
    else if (x.fouille === 'composants') { const plus = butin + Math.round(20 * (1 + 0.25 * (x.strate - 1))); j.composants += plus; butinFilon = plus; }
    else eclats += x.strate >= 5 ? 3 : 2;
    progresser(j, 'expedition');
  } else if (victoire && x.epreuve) {
    // la première victoire de la semaine dans cette Épreuve : une carte au choix, dont une en argent au moins
    if (!j.epreuves.faites.includes(x.epreuve)) {
      j.epreuves.faites.push(x.epreuve);
      gagnerCreuseurs(j, CREUSEURS.epreuve, 'l’Épreuve réussie fait des émules');
      j.choix.push({ source: 'epreuve', options: tirerChoix(j, x.strate, 'argent') });
    }
    progresser(j, 'expedition');
  } else if (victoire) {
    j.choix.push({ source: 'boss', options: tirerChoix(j, x.strate) });
    eclats += (x.strate >= 5 ? 2 : 1) + (j.actes.chambre === 'orseve' ? 1 : 0);
    progresser(j, 'expedition');
  }
  if (victoire && x.strate === j.strate && !j.frontVaincu) {
    // le gardien du front est vaincu : l'étage suivant est prêt à être creusé, s'il y a assez de creuseurs
    j.frontVaincu = true;
    gagnerCreuseurs(j, CREUSEURS.gardien, 'le gardien vaincu, des fouilleurs se joignent au chantier');
    nouvelleStrate = creuser(j);
    fragment = ajouterFragment(j);
    // dans les Fondations, les abris des années 2060 rendent deux papiers par Strate
    if (x.strate <= 3) ajouterFragment(j);
    j.composants += 20;
    cartes.push(tirerTrouvaille(j, x.strate));
    eclats += 2;
  }
  // les trouvailles de l'exploration : une carte par salle scellée, les cartes offertes en route, Éclats et archives
  if (x.gains) {
    for (let k = 0; k < x.gains.elites; k++) cartes.push(tirerTrouvaille(j, x.strate, 'cuivre'));
    for (let k = 0; k < x.gains.cartes; k++) cartes.push(tirerTrouvaille(j, x.strate, 'fer', lignee));
    eclats += x.gains.eclats;
    if (x.gains.fragment) fragment = ajouterFragment(j) ?? fragment;
  }
  for (const c of cartes) ajouterCarte(j, c);
  j.eclats += eclats;
  confier(j, victoire ? CONFIANCE.victoire : defaite ? CONFIANCE.defaite : 0);
  // l'expérience : chaque combat gagné, les salles scellées et le gardien ; toute l'escouade la partage, debout ou à terre
  const facteur = 1 + 0.25 * (x.strate - 1);
  const gardien = victoire && !x.fouille && !x.epreuve ? XP.gardien : 0;
  const brutXp = Math.round((victoires * XP.combat + (x.gains?.elites ?? 0) * XP.elite + gardien) * facteur * (x.epreuve || x.fouille ? 0.75 : 1));
  const xp = finaux.map((p) => { const avant = niveauPorteur(j, p.id).niveau; const n = gagnerXp(j, p.id, brutXp); return { id: p.id, xp: brutXp, ...(n && n > avant ? { niveau: n } : {}) }; });
  // ce que chacun a vécu, pour ses Marques
  const vaincus = x.sequence.slice(0, victoires);
  const anciens = vaincus.filter((id) => ennemiDef(id).lignee === 'reso').length;
  for (const p of finaux) {
    const f = (j.porteurs[p.id]!.faits ??= {});
    const avant = progresMarque(j, p.id)?.acquise;
    if (victoire) f.expeditions = (f.expeditions ?? 0) + 1;
    if (x.strate <= 3) f.fondations = (f.fondations ?? 0) + victoires;
    f.anciens = (f.anciens ?? 0) + anciens;
    f.combats = (f.combats ?? 0) + victoires;
    if (x.strate >= 4) f.abysses = (f.abysses ?? 0) + victoires;
    f.scellees = (f.scellees ?? 0) + (x.gains?.elites ?? 0);
    if (victoire && !x.fouille && !x.epreuve) f.gardiens = (f.gardiens ?? 0) + 1;
    const m = progresMarque(j, p.id);
    if (m?.acquise && !avant) log(j, `${porteurDef(p.id).nom} gagne la Marque ${m.nom} : ${m.texte}`);
  }
  j.expedition = null;
  log(j, victoire
    ? `L’escouade remonte victorieuse avec ${butin} composants.${nouvelleStrate ? ` Un nouvel étage est creusé : la Strate −${j.strate} est ouverte.` : ''}`
    : x.fuite ? `L’escouade a fui et remonte avec ${butin} composants. Elle rentre épuisée.`
    : `L’escouade remonte avec ${butin} composants. Elle a besoin de repos.`);
  return { butin: butin + butinFilon, nouvelleStrate, victoire, fragment, cartes, eclats, ...(x.fuite ? { fuite: true } : {}), ...(brutXp ? { xp } : {}) };
}

function ajouterFragment(j: Jeu): string | null {
  const id = ORDRE_FRAGMENTS.find((f) => !j.fragments.includes(f));
  if (!id) return null;
  j.fragments.push(id);
  log(j, `Fragment d’archives trouvé : « ${fragmentDef(id)!.titre} ». Il est rangé dans le Codex.`);
  return id;
}

// ---------- La chambre scellée (combat guidé) ----------

/** Ordre de pioche du combat guidé : une leçon par tour (au tour 2, un 3, un 4 et un 5 ; au tour 3, des boucliers) */
const ORDRE_TUTO = ['ruee', 'morsure', 'murmure', 'carapace', 'tir', 'bond', 'charge', 'grogner', 'esquive', 'repli', 'glande-ambre'];

export function ouvrirChambre(j: Jeu, rng = graine()): Resultat {
  if (j.chambre) return non('La chambre est déjà ouverte.');
  if (j.expedition) return non('Une expédition est déjà en cours.');
  const escouade = ['ilka', 'doran', 'vela'];
  for (const id of escouade) if (j.porteurs[id]!.poste) j.porteurs[id]!.poste = null;
  const tout = deckEscouade(j, escouade);
  const deck: GesteDef[] = [];
  for (const gid of ORDRE_TUTO) {
    const k = tout.findIndex((g) => moduleDe(g.id) === gid);
    if (k >= 0) deck.push(...tout.splice(k, 1));
  }
  deck.push(...tout);
  const porteurs: PorteurEtat[] = escouade.map((id) => ({ id, pv: pvMaxCombat(j, id), pvMax: pvMaxCombat(j, id), aTerre: false }));
  j.expedition = nouvelleExpedition({ porteurs, deck, strate: 1, rng, sequence: ['remanent-faible'], force: 1, tutoriel: true });
  log(j, 'Ilka, Doran et Véla descendent vers la porte scellée.');
  return { ok: true };
}

/** La consigne du combat guidé, selon le tour */
export function leconTutoriel(tour: number): string {
  if (tour === 1) return 'Leçon 1 : touche 3 cartes de ta main, puis « Lancer la chaîne ».';
  if (tour === 2) return 'Leçon 2 : pose un 3, puis un 4, puis un 5, dans cet ordre. Des chiffres qui se suivent font une Résonance : +30 % sur toute la chaîne.';
  if (tour === 3) return 'Leçon 3 : le Rémanent annonce une Entaille sur Doran. Pose des cartes à bouclier : elles protègent toute l’escouade pendant son attaque.';
  return 'Tu as l’essentiel : vise les suites, protège-toi des grosses attaques annoncées. Achève-le !';
}

// ---------- Objectifs guidés ----------

export interface Objectif {
  /** identifiant stable (l'interface s'en sert pour savoir quel onglet signaler) */
  id: 'district' | 'deck' | 'descendre' | 'creuseurs';
  titre: string;
  consigne: string;
  /** le bâtiment à signaler sur le district (null : l'objectif se fait ailleurs) */
  pilier: BatimentId | null;
  /** l'onglet du bas à signaler */
  onglet: 'archipel' | 'cartes' | 'coupe' | 'porteurs';
  recompense: { energie?: number; composants?: number; creuseurs?: number };
  fait: (j: Jeu) => boolean;
}

// Revus le 23 octobre 2026 après les grands changements (Mon escouade, les postes quittés au départ,
// l'exploration salle par salle et les creuseurs). Chaque objectif apprend une chose, dans l'ordre où on en a besoin :
// produire sans bloquer l'escouade, construire le deck, descendre, puis comprendre ce qui ouvre l'étage suivant.
export const OBJECTIFS: Objectif[] = [
  {
    id: 'district', titre: 'Allumer le district', pilier: 'generateur', onglet: 'archipel',
    consigne: 'Touche le Générateur et postes-y le Coursier, une recrue augmentée : il y produit deux fois plus. Garde Ilka, Doran et Véla pour l’escouade : en descendant, ils quitteraient leur poste.',
    recompense: { energie: 60 },
    fait: (j) => { const p = posteDe(j, 'generateur'); return !!p && !escouadeDe(j).includes(p); },
  },
  {
    id: 'deck', titre: 'Construire ton deck', pilier: null, onglet: 'cartes',
    consigne: 'Ouvre tes Cartes et confie l’Œil-relais, trouvé dans la chambre, à Ilka. Elle porte déjà 6 cartes : retires-en une. Les cartes de tes trois Porteurs forment ton deck.',
    recompense: { composants: 10 },
    fait: (j) => j.porteurs.ilka!.modules.some((k) => moduleDe(k) === 'oeil-relais'),
  },
  {
    id: 'descendre', titre: 'Vaincre la Strate −1', pilier: 'noyau', onglet: 'coupe',
    consigne: 'Ton escouade est prête (onglet Porteurs). Entre dans la Tour du Noyau et explore la Strate −1 salle par salle, jusqu’à son gardien.',
    recompense: { composants: 20 },
    fait: (j) => j.strate >= 2 || j.frontVaincu,
  },
  {
    id: 'creuseurs', titre: 'Trouver des creuseurs', pilier: 'noyau', onglet: 'coupe',
    consigne: `Pour percer la Strate −2, il faut ${creuseursRequis(2)} creuseurs : le gardien t’en a amené un. Dans la Tour, envoie une recrue en mission dans la Strate −1 : des volontaires suivront.`,
    recompense: { composants: 10, creuseurs: 1 },
    fait: (j) => j.strate >= 2 || j.missions.length > 0,
  },
];

export const objectifCourant = (j: Jeu): Objectif | null => (j.chambre ? OBJECTIFS[j.objectif] ?? null : null);

/** Récupère la récompense de l'objectif en cours s'il est rempli */
export function reclamer(j: Jeu): Resultat {
  const o = objectifCourant(j);
  if (!o || !o.fait(j)) return non('Objectif pas encore rempli.');
  j.energie = Math.min(stockage(j), j.energie + (o.recompense.energie ?? 0));
  j.composants += o.recompense.composants ?? 0;
  if (o.recompense.creuseurs && gagnerCreuseurs(j, o.recompense.creuseurs, 'des volontaires rejoignent le chantier')) creuser(j);
  j.objectif++;
  log(j, `Objectif rempli : ${o.titre}.`);
  return { ok: true };
}

// ---------- Le résumé du retour ----------

/** Ce qui a avancé pendant l'absence : on ne liste que du positif, et une suggestion au plus */
export function resumeAbsence(avant: Jeu, apres: Jeu, nouvelles: string[]): string[] {
  const l: string[] = [];
  const de = Math.floor(apres.energie) - Math.floor(avant.energie);
  if (de > 0) l.push(`+${de} énergie${apres.energie >= stockage(apres) ? ' (stockage plein : pense à améliorer la Tour du Noyau)' : ''}`);
  l.push(...nouvelles);
  const remis = Object.keys(apres.porteurs).filter((id) => avant.porteurs[id]!.usure >= 1 && apres.porteurs[id]!.usure < 1);
  for (const id of remis) l.push(`${porteurDef(id).nom} est remis de son Usure`);
  const soignes = Object.keys(apres.porteurs).filter((id) => !remis.includes(id) && avant.porteurs[id]!.usure - apres.porteurs[id]!.usure >= 1);
  if (soignes.length) l.push(`La Clinique a soigné ${soignes.map((id) => porteurDef(id).nom).join(', ')}`);
  if (!l.length) return l;
  const amelio = apres.chantiers.length >= chantiersMax(apres) ? undefined : BATIMENTS.find((b) => { const c = coutAmelioration(apres, b.id); return !!c && !chantierDe(apres, b.id) && apres.energie >= c.energie && apres.composants >= c.composants && apres.eclats >= (c.eclats ?? 0) && (b.id === 'noyau' || apres.batiments[b.id] < apres.batiments.noyau); });
  if (amelio) l.push(`Tu peux améliorer : ${amelio.nom}`);
  else if (!apres.expedition && apres.chambre) l.push(`La Strate −${apres.strate} t’attend`);
  return l;
}

export { BATIMENTS, MODULES };
export type { Rarete };
