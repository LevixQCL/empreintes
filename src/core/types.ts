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
}

export type BatimentId = 'noyau' | 'generateur' | 'forge' | 'clinique';

/** Rareté d'une carte (Module) : du fer, commun, à la nacre, presque introuvable */
export type Rarete = 'fer' | 'cuivre' | 'argent' | 'or' | 'nacre';

/** Un Module est une carte de collection : il se greffe sur un Porteur de sa lignée et ses Gestes remplacent une partie des siens */
export interface ModuleDef {
  /** « jambes-ressort » pour le Module dans son métal d'origine, « jambes-ressort@or » pour un exemplaire dans un autre métal */
  id: string;
  /** le Module de base, quand `id` désigne un exemplaire dans un métal (« jambes-ressort ») */
  base?: string;
  nom: string;
  lignee: Lignee;
  rarete: Rarete;
  gestes: { nom: string; f: number; type: TypeGeste; v: number; lourd?: boolean; effet?: Effet }[];
}

export interface GesteDef {
  id: string;
  /** Porteur qui joue ce Geste ; null = Geste spécial (tactique) */
  porteur: string | null;
  nom: string;
  /** Fréquence, de 1 à 9 */
  f: number;
  type: TypeGeste;
  /** Force : dégâts, bouclier ou soin */
  v: number;
  /** Prend 2 places dans la chaîne */
  lourd?: boolean;
  effet?: Effet;
}

/** Un exemplaire de Geste dans un combat (uid unique) */
export interface Geste extends GesteDef {
  uid: string;
}

/** 'hasard', 'faible', une lignée, ou l'id d'un Porteur précis */
export type CibleRegle = 'hasard' | 'faible' | Lignee | (string & {});

export type IntentionDef =
  | { type: 'atk'; nom: string; v: number; cible?: CibleRegle; zone?: boolean }
  | { type: 'bouclier'; v: number }
  | { type: 'boost' };

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
  tour: number;
  rng: number;
  issue: Issue;
  journal: string[];
}

export type Evenement =
  | { kind: 'resonance'; suite: number; mult: number }
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
