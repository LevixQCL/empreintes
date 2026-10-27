// Types du jeu. Aucun import du DOM ici : le cœur doit pouvoir tourner sur un serveur ou dans des tests.

export type Lignee = 'tech' | 'bio' | 'reso';
export type LigneeGeste = Lignee | 'neutre';
export type TypeGeste = 'atk' | 'bouclier' | 'soin';

/**
 * Effet spécial d'un Geste. Les cartes rares apportent des effets, pas de plus gros chiffres.
 * `part` est une fraction (0.25 = 25 %).
 */
export type Effet =
  /** ignore le bouclier et le blindage de l'ennemi */
  | { type: 'percant' }
  /** le Porteur qui joue la carte récupère une part des dégâts infligés (le plus blessé s'il est à terre) */
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
  | { type: 'rempart'; part: number }
  // ---------- Les voies (27 octobre 2026, docs/familles-de-decks.md) ----------
  /** Carapace (sur une carte de bouclier) : après son bouclier, frappe d'une part du bouclier d'escouade (sans le dépenser) */
  | { type: 'riposte'; part: number }
  /** Moteur : vide le Flux, une part de force en plus par Flux vidé */
  | { type: 'decharge'; part: number }
  /** Chœur : Fréquence libre, prend celle de la carte posée juste avant (le pendant de l'Accord) */
  | { type: 'diapason' }
  /** Chœur : une part de force en plus pour chaque autre carte de la même Fréquence dans la chaîne */
  | { type: 'unisson'; part: number };

export type TypeEffet = Effet['type'];

export interface PorteurDef {
  id: string;
  nom: string;
  lignee: Lignee;
  pvMax: number;
  /** Porteur nommé (illustré) ou recrue anonyme */
  nomme: boolean;
  /** Porteur qui rejoint le district plus tard dans l'histoire, et à quelle condition */
  /** accord : arrive par un Accord ouvert de la Clinique (Clinique et Confiance assez hautes : `ACCORD_OUVERT`) */
  arrivee?: { strate?: number; forge?: number; accord?: boolean; replique: string };
}

export type BatimentId = 'noyau' | 'generateur' | 'forge' | 'clinique' | 'comptoir';

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
  /** second effet : seules les cartes de l’Héritage en ont un (une Fréquence libre est toujours le premier) */
  effet2?: Effet;
  /** carte de l’Héritage du district : exclusive, jamais trouvée ailleurs (docs/heritage-du-district.md) */
  legs?: true;
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
  /** second effet (cartes de l’Héritage) */
  effet2?: Effet;
  /** Place vide : un Porteur combat toujours avec 6 places ; celle qu'on ne remplit pas se pioche et ne se joue pas */
  vide?: boolean;
}

/** Un exemplaire de carte dans un combat (uid unique) */
export interface Geste extends GesteDef {
  uid: string;
  /** carte de soin dans la chaîne : le Porteur qu'elle soigne (choisi à la pose, modifiable) */
  cible?: string;
}

/** 'hasard', 'faible', une lignée, ou l'id d'un Porteur précis */
export type CibleRegle = 'hasard' | 'faible' | Lignee | (string & {});

type IntentionDef =
  | { type: 'atk'; nom: string; v: number; cible?: CibleRegle; zone?: boolean }
  | { type: 'bouclier'; v: number }
  | { type: 'boost' }
  /** se répare : regagne des PV */
  | { type: 'soin'; nom: string; v: number }
  /** brouille les Fréquences : la prochaine chaîne du joueur ne fait pas de Résonance */
  | { type: 'dissonance'; nom: string };

export type Intention = IntentionDef & { cibleId?: string | null };

/**
 * Les traits d'un ennemi (décision du 22 octobre 2026 : varier les combats). Affichés sous son nom.
 * - blinde : chaque coup perd `v` dégâts (×la puissance de l'ennemi) ; Perçant passe outre
 * - regeneration : regagne `part` de ses PV max à la fin de son tour
 * - epines : renvoie `part` des dégâts reçus au Porteur qui a frappé (sans jamais le mettre à terre)
 * - evanescent : hors Résonance, il ne subit que `1 − part` des dégâts
 * - essaim : quand il tombe, un rejeton surgit (`part` de ses PV) — une seule fois
 * - vengeur : quand un allié tombe, sa prochaine attaque est doublée
 * - furie : sous la moitié de ses PV, ses attaques font +30 %
 */
export type Trait =
  | { type: 'blinde'; v: number }
  | { type: 'regeneration'; part: number }
  | { type: 'epines'; part: number }
  | { type: 'evanescent'; part: number }
  | { type: 'essaim'; part: number }
  | { type: 'vengeur' }
  | { type: 'furie' }
  /** Aspiration (25 octobre 2026) : quand il frappe, il vide une part du Flux de l'escouade */
  | { type: 'aspire'; v: number };

export interface EnnemiDef {
  id: string;
  nom: string;
  lignee: Lignee;
  tag: string;
  pvMax: number;
  motif: IntentionDef[];
  traits?: Trait[];
  /** gardien à deux phases : sous `seuil` de ses PV, il change de geste et appelle des renforts */
  phase?: { seuil: number; nom: string; texte: string; motif: IntentionDef[]; renforts?: string[] };
}

export interface PorteurEtat {
  id: string;
  pv: number;
  /** PV max pour ce combat (réduits par l'Usure) */
  pvMax: number;
  aTerre: boolean;
  /** les PV que l'Usure retire à ce Porteur pour toute la descente (affichés hachurés au bout de sa jauge) */
  usure?: number;
  /** Usure en plus pour avoir déclenché un Coup d'éclat (comptée au retour de l'expédition) */
  usureEclat?: number;
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
  /** place dans le groupe (0 = le premier, à gauche) ; absent pour un ennemi seul */
  rang?: number;
  /** l'intention d'un ennemi qui n'est pas visé (celle de l'ennemi visé est dans `CombatEtat.intention`) */
  intention?: Intention;
  /** surgi pendant le combat (rejeton d'un essaim, renfort d'un gardien) : il ne se divise pas à son tour */
  rejeton?: boolean;
  /** gardien passé dans sa seconde phase */
  phase2?: boolean;
  /** Strate −1 : l'ennemi joue sans ses traits ni sa seconde phase (on apprend d'abord les bases) */
  simple?: boolean;
  /** Fêlure (25 octobre 2026) : la Fréquence qui brise son intention ce tour-ci, et si elle a déjà été brisée */
  felure?: number;
  felureBrisee?: boolean;
  /** garde d'un archipel pillé : le Porteur de la garnison dont il prend le visage et le nom */
  porteur?: string;
}

type Issue = 'en-cours' | 'victoire' | 'defaite';

/** Ce que les Marques des Porteurs apportent au début de chaque combat */
export interface BonusMarques {
  /** places en plus dans la chaîne au premier tour (Ilka, Raccourci) */
  places?: number;
  /** bouclier d'escouade au début du combat (Doran, Fondations) */
  bouclier?: number;
  /** la Dissonance n'a pas de prise (Véla, Lectrice) */
  lucide?: boolean;
  /** une fois par combat, le premier Porteur qui tombe se relève avec cette part de ses PV (Sasha, Seconde chance) */
  releve?: number;
  /** Flux au début du combat (Coursier, Foulée) */
  flux?: number;
  /** Fissure posée sur l'ennemi visé au début du combat, pour deux tours (Nuit, Œil de nuit) */
  fissure?: number;
  /** part du bouclier d'escouade gardée d'un tour à l'autre (Docker, Bras de quai) */
  garde?: number;
  /** part retirée à l'attaque annoncée de chaque ennemi au premier tour (Aurel, Ombre courtoise) */
  desarme?: number;
  /** cartes en plus dans la main du premier tour (Guetteur, Guet) */
  main?: number;
}

export interface CombatEtat {
  porteurs: PorteurEtat[];
  /** l'ennemi visé par la chaîne (le seul ennemi, hors groupes) */
  ennemi: EnnemiEtat;
  /** l'intention de l'ennemi visé */
  intention: Intention;
  /** les autres ennemis d'un groupe (combats à plusieurs, décision du 22 octobre 2026), avec leur propre intention */
  autres?: EnnemiEtat[];
  /** puissance de la Strate (avant le partage d'un groupe) : sert aux ennemis qui surgissent en cours de combat */
  forceBase?: number;
  /** la condition de la salle (inondée, éboulis…), voir CONDITIONS */
  condition?: string;
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
  /** Coup d'éclat (25 octobre 2026) : un seul par combat ; celui qui a été déclenché, et ses effets en cours */
  eclat?: { porteur: string; lignee: Lignee };
  /** Débridage : la chaîne de ce tour frappe deux fois plus fort */
  debride?: boolean;
  /** Ombre agissante : aucune attaque ennemie ne porte ce tour-ci */
  ombre?: boolean;
  /** l'ennemi a brouillé les Fréquences : la prochaine chaîne ne fait pas de Résonance */
  dissonance?: boolean;
  /** Marque de Véla (Lectrice) : la Dissonance n'a pas de prise sur l'escouade */
  lucide?: boolean;
  /** Brouillard (27 octobre 2026, Bryan : poser puis retirer une carte révélait l'intention gratuitement) :
   *  la brume est levée pour ce tour, et la carte qui l'a levée est engagée (elle ne revient plus en main) */
  brumeLevee?: boolean;
  engagee?: string;
  /** Marque de Docker (Bras de quai) : part du bouclier gardée à chaque tour, même sans Rempart */
  gardeMarque?: number;
  /** Marque de Sasha (Seconde chance) : part des PV rendue au premier Porteur qui tombe, et si elle a déjà servi */
  releve?: number;
  releveFaite?: boolean;
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
  | { kind: 'carte'; rang: number; total: number; lignee: LigneeGeste; type: TypeGeste; porteur: string | null; suite: number; effet?: string }
  | { kind: 'degats'; cible: string; net: number; absorbe: number; rang?: number; source?: 'epines' | 'eboulis' }
  | { kind: 'bouclier'; cible: 'escouade' | 'ennemi'; v: number; rang?: number }
  | { kind: 'soin'; cible: string; v: number; rang?: number }
  | { kind: 'echo' }
  | { kind: 'flux'; gain: number }
  | { kind: 'boost'; rang?: number }
  | { kind: 'effet'; cible: string; texte: string; rang?: number }
  /** un ennemi d'un groupe tombe : la chaîne passe au suivant (rang : le nouvel ennemi visé) */
  | { kind: 'cible'; rang: number }
  /** un ennemi d'un groupe agit pendant le tour ennemi (pour l'animation) */
  | { kind: 'ennemi-agit'; rang: number }
  /** un ennemi surgit en cours de combat (rejeton, renfort) */
  | { kind: 'renfort'; rang: number; id: string }
  /** un gardien entre dans sa seconde phase */
  | { kind: 'phase'; rang: number; nom: string }
  | { kind: 'a-terre'; cible: string }
  | { kind: 'fin'; issue: Issue };

/** Un pas d'animation : l'événement et l'état juste après lui */
export interface Pas {
  ev: Evenement;
  etat: CombatEtat;
}
