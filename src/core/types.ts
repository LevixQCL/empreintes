// Types du jeu. Aucun import du DOM ici : le cœur doit pouvoir tourner sur un serveur ou dans des tests.

export type Lignee = 'tech' | 'bio' | 'reso';
export type LigneeGeste = Lignee | 'neutre';
export type TypeGeste = 'atk' | 'bouclier' | 'soin';

/**
 * Effet spécial d'un Geste. Les cartes rares apportent des effets, pas de plus gros chiffres.
 * `part` est une fraction (0.25 = 25 %).
 */
export type Effet =
  /** ignore le bouclier de l'ennemi */
  | { type: 'percant' }
  /** soigne le Porteur le plus blessé d'une part des dégâts infligés */
  | { type: 'siphon'; part: number }
  /** remplit le Flux */
  | { type: 'flux'; v: number }
  /** la prochaine attaque ennemie perd une part de sa force */
  | { type: 'desarmer'; part: number }
  /** l'ennemi subit une part de dégâts en plus, ce tour-ci et le suivant */
  | { type: 'fissure'; part: number }
  /** +1 place dans la chaîne au tour suivant */
  | { type: 'elan' }
  /** une part de force en plus pour chaque Geste posé avant lui dans la chaîne */
  | { type: 'crescendo'; part: number }
  /** Fréquence libre : prolonge toujours la suite */
  | { type: 'accord' }
  /** le soin touche toute l'escouade */
  | { type: 'vague' }
  /** une part du bouclier d'escouade restant est gardée au tour suivant */
  | { type: 'rempart'; part: number };

export type TypeEffet = Effet['type'];

export interface PorteurDef {
  id: string;
  nom: string;
  lignee: Lignee;
  pvMax: number;
  /** Porteur nommé (illustré) ou recrue anonyme */
  nomme: boolean;
  /** Porteur qui rejoint le district plus tard dans l'histoire, et à quelle condition */
  arrivee?: { strate?: number; forge?: number; replique: string };
}

export type BatimentId = 'noyau' | 'generateur' | 'forge' | 'clinique';

/** Rareté d'une carte : le métal de son exemplaire, du fer, commun, à la nacre, presque introuvable */
export type Rarete = 'fer' | 'cuivre' | 'argent' | 'or' | 'nacre';

/**
 * Une carte de collection, celle qu'on joue en combat (décision du 22 octobre 2026).
 * On la confie à un Porteur de sa lignée ; elle prend une place dans le deck.
 * Le type garde son nom historique (ModuleDef) : dans la première version, les cartes étaient des Modules greffés.
 */
export interface ModuleDef {
  /** « jambes-ressort » pour la carte dans son métal d'origine, « jambes-ressort@or » pour un exemplaire dans un métal */
  id: string;
  /** la carte de base, quand `id` désigne un exemplaire dans un métal (« jambes-ressort ») */
  base?: string;
  nom: string;
  lignee: Lignee;
  /** métal d'origine de la carte, ou métal de l'exemplaire */
  rarete: Rarete;
  /** ce que fait la carte : attaque, bouclier d'escouade ou soin */
  type: TypeGeste;
  /** force (dans le métal d'origine, ou celle de l'exemplaire) */
  v: number;
  /** prend 2 places dans la chaîne */
  lourd?: boolean;
  /** Fréquences, de la principale à la plus rare ; un exemplaire ne garde que celles que son métal ouvre */
  f: number[];
  /** l'effet de la carte ; un exemplaire ne l'a qu'à partir du cuivre */
  effet?: Effet;
}

/** Une carte en jeu, telle que le moteur de combat la manipule */
export interface GesteDef {
  id: string;
  /** l'exemplaire de carte (« ruee@fer ») : son illustration ; absent pour les cartes d'une sauvegarde ancienne */
  carte?: string;
  /** Porteur qui joue cette carte ; null = carte du district */
  porteur: string | null;
  nom: string;
  /** Fréquence jouée, de 1 à 9 */
  f: number;
  /** les Fréquences que la carte peut prendre (argent et plus) ; `f` est celle choisie */
  fs?: number[];
  type: TypeGeste;
  /** Force : dégâts, bouclier ou soin */
  v: number;
  /** Prend 2 places dans la chaîne */
  lourd?: boolean;
  effet?: Effet;
}

/** Un exemplaire de carte dans un combat (uid unique) */
export interface Geste extends GesteDef {
  uid: string;
  /** carte de soin dans la chaîne : le Porteur qu'elle soigne (choisi à la pose, modifiable) */
  cible?: string;
}

/** 'hasard', 'faible', une lignée, ou l'id d'un Porteur précis */
export type CibleRegle = 'hasard' | 'faible' | Lignee | (string & {});

export type IntentionDef =
  | { type: 'atk'; nom: string; v: number; cible?: CibleRegle; zone?: boolean }
  | { type: 'bouclier'; v: number }
  | { type: 'boost' }
  /** se répare : regagne des PV */
  | { type: 'soin'; nom: string; v: number }
  /** brouille les Fréquences : la prochaine chaîne du joueur ne fait pas de Résonance */
  | { type: 'dissonance'; nom: string };

export type Intention = IntentionDef & { cibleId?: string | null };

export interface EnnemiDef {
  id: string;
  nom: string;
  lignee: Lignee;
  tag: string;
  pvMax: number;
  motif: IntentionDef[];
}

export interface PorteurEtat {
  id: string;
  pv: number;
  /** PV max pour ce combat (réduits par l'Usure) */
  pvMax: number;
  aTerre: boolean;
}

export interface EnnemiEtat {
  id: string;
  pv: number;
  pvMax: number;
  /** multiplicateur de puissance selon la profondeur de la Strate */
  force: number;
  bouclier: number;
  etape: number;
  boost: number;
  /** Fissure : part de dégâts en plus, et tours restants */
  fissure?: number;
  fissureTours?: number;
}

export type Issue = 'en-cours' | 'victoire' | 'defaite';

/** Ce que les Marques des Porteurs apportent au début de chaque combat */
export interface BonusMarques {
  /** places en plus dans la chaîne au premier tour (Ilka, Raccourci) */
  places?: number;
  /** bouclier d'escouade au début du combat (Doran, Fondations) */
  bouclier?: number;
  /** la Dissonance n'a pas de prise (Véla, Lectrice) */
  lucide?: boolean;
}

export interface CombatEtat {
  porteurs: PorteurEtat[];
  ennemi: EnnemiEtat;
  intention: Intention;
  pioche: Geste[];
  defausse: Geste[];
  main: Geste[];
  chaine: Geste[];
  capaBonus: number;
  /** places en plus gagnées pour le tour suivant (Élan) */
  capaProchain?: number;
  bouclier: number;
  /** part du bouclier d'escouade gardée à la fin du tour ennemi (Rempart) */
  garde?: number;
  flux: number;
  /** l'ennemi a brouillé les Fréquences : la prochaine chaîne ne fait pas de Résonance */
  dissonance?: boolean;
  /** Marque de Véla (Lectrice) : la Dissonance n'a pas de prise sur l'escouade */
  lucide?: boolean;
  /** Épreuve « Fréquences brouillées » : aucune Résonance de tout le combat */
  sansResonance?: boolean;
  tour: number;
  rng: number;
  issue: Issue;
  journal: string[];
}

export type Evenement =
  | { kind: 'resonance'; suite: number; mult: number }
  /** une carte de la chaîne entre en jeu (pour l'animation) : sa place, sa lignée, son action */
  | { kind: 'carte'; rang: number; total: number; lignee: LigneeGeste; type: TypeGeste; porteur: string | null; suite: number }
  | { kind: 'degats'; cible: string; net: number; absorbe: number }
  | { kind: 'bouclier'; cible: 'escouade' | 'ennemi'; v: number }
  | { kind: 'soin'; cible: string; v: number }
  | { kind: 'echo' }
  | { kind: 'flux'; gain: number }
  | { kind: 'boost' }
  | { kind: 'effet'; cible: string; texte: string }
  | { kind: 'a-terre'; cible: string }
  | { kind: 'fin'; issue: Issue };

/** Un pas d'animation : l'événement et l'état juste après lui */
export interface Pas {
  ev: Evenement;
  etat: CombatEtat;
}
