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
  | { type: 'unisson'; part: number }
  // ---------- Les voies, étapes 2 et 3 (28 octobre 2026) ----------
  /** Traque : une part de force en plus si l'ennemi visé est fissuré, ou sous la moitié de ses PV */
  | { type: 'curee'; part: number }
  /** Lecture : brise la Fêlure de l'ennemi visé, quelle que soit sa Fréquence (même cachée) */
  | { type: 'lecture' }
  /** Lecture : une part de force en plus si la Fêlure de l'ennemi visé est brisée */
  | { type: 'faille'; part: number }
  /** Cadence : frappe une seconde fois si la chaîne compte au moins 4 cartes */
  | { type: 'rafale' }
  /** Sève : soigne toute l'escouade, et le soin en trop (PV déjà pleins) devient du bouclier d'escouade */
  | { type: 'debord' }
  // ---------- Les exclusives (28 octobre 2026) : des effets qu'on ne trouve que sur une carte d'un seul métal ----------
  /** arrache tout le bouclier de l'ennemi visé et l'ajoute au bouclier d'escouade (avant de frapper) */
  | { type: 'rapt' }
  /** la carte la plus forte de la chaîne (hors elle-même) revient en tête de pioche : on la repioche au tour suivant */
  | { type: 'rappel' }
  /** le Porteur paie une part de ses PV max (jamais jusqu'à tomber) ; la carte gagne une part de force */
  | { type: 'surtension'; part: number; cout: number }
  /** copie l'effet de la carte posée juste avant (sauf une Fréquence libre ou une autre Empreinte) */
  | { type: 'empreinte' }
  /** relève le premier Porteur à terre avec tout le soin ; sinon, soigne normalement */
  | { type: 'releve' };

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
  /** une carte du parrainage (29 octobre 2026) : elle ne se trouve jamais, on la reçoit avec un ami, et seulement dans son métal */
  lien?: true;
  /** carte exclusive (28 octobre 2026) : elle n'existe que dans son métal d'origine (`rarete`), jamais dans un autre */
  seul?: true;
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

export type IntentionDef =
  | { type: 'atk'; nom: string; v: number; cible?: CibleRegle; zone?: boolean }
  /** allie : le bouclier va à un allié (soutiens d'un gardien en 3ᵉ phase) */
  | { type: 'bouclier'; v: number; allie?: boolean }
  | { type: 'boost' }
  /** se répare : regagne des PV (allie : soigne un allié à la place, 28 octobre 2026) */
  | { type: 'soin'; nom: string; v: number; allie?: boolean }
  /** appelle un renfort (gardien invocateur, 3ᵉ phase) */
  | { type: 'appel'; nom: string; rompu?: boolean }
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
  /** Aspiration (25 octobre 2026) : quand son coup passe le bouclier, il prend du Flux à l'escouade */
  | { type: 'aspire'; v: number }
  /** Assimilation (28 octobre 2026, idée de Luc) : à la fin de ta chaîne, il prend la lignée de la dernière carte qui l'a frappé */
  | { type: 'assimilation' };

/** Les quatre 3ᵉ phases d'un gardien (28 octobre 2026, idées de Luc) */
export type VariantePhase = 'front' | 'garde' | 'deferlement' | 'appel';
export type RoleEnnemi = 'front' | 'soutien' | 'invocateur' | 'assaut';

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
  /** Strates −2 et −3 : l'ennemi a sa Fêlure et sa seconde phase, mais pas encore ses traits (REGLES.apparition) */
  sansTraits?: boolean;
  /** Fêlure (25 octobre 2026) : la Fréquence qui brise son intention ce tour-ci, et si elle a déjà été brisée */
  felure?: number;
  felureBrisee?: boolean;
  /** Assimilation : la lignée qu'il a prise (à la place de la sienne) ; `frappe` = la dernière lignée qui l'a frappé dans la chaîne */
  assimile?: Lignee;
  frappe?: Lignee;
  /** avant REGLES.apparition.assimilation : l'Assimilation dort */
  sansAssimilation?: boolean;
  /** gardien : la 3ᵉ phase qu'il gardera sous REGLES.troisiemePhase.seuil (tirée au début du combat), et si elle est ouverte */
  phase3?: VariantePhase;
  phase3Active?: boolean;
  /** Déferlement : multiplicateur de ses attaques, qui monte à chaque tour */
  crescendo?: number;
  /** un rôle qui remplace ses gestes (3ᵉ phase d'un gardien) : voir MOTIFS_ROLE dans combat.ts */
  role?: RoleEnnemi;
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
  /** à la fin de chaque tour ennemi, le Porteur le plus blessé récupère cette part de ses PV max (Joss, Nuit blanche) */
  veille?: number;
  /** part des dégâts absorbés par le bouclier d'escouade renvoyée à l'ennemi qui frappe (Kessa, Née-de-mue) */
  chitine?: number;
  /** Flux en plus pour chaque Fêlure brisée par une chaîne qui résonne (Liane, Galons blancs) */
  felureFlux?: number;
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
  /** le Porteur que le bouclier couvre en premier sur une attaque de zone, choisi par le joueur pour ce tour (sinon proposé) */
  protege?: string;
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
  /** Marque de Docker (Bras de quai) : part du bouclier gardée à chaque tour, même sans Rempart */
  gardeMarque?: number;
  /** Marque de Sasha (Seconde chance) : part des PV rendue au premier Porteur qui tombe, et si elle a déjà servi */
  releve?: number;
  releveFaite?: boolean;
  /** Marque de Joss (Nuit blanche) : part des PV max rendue au plus blessé à la fin de chaque tour ennemi */
  veille?: number;
  /** Marque de Kessa (Née-de-mue) : part des dégâts absorbés par le bouclier renvoyée à l'attaquant */
  chitine?: number;
  /** Marque de Liane (Galons blancs) : Flux en plus par Fêlure brisée en résonance */
  felureFlux?: number;
  /** Épreuve « Fréquences brouillées » : aucune Résonance de tout le combat */
  sansResonance?: boolean;
  tour: number;
  /** la relance gratuite de la première main a servi (27 octobre 2026) */
  relance?: boolean;
  rng: number;
  issue: Issue;
  journal: string[];
  /** le journal complet, tour par tour (27 octobre 2026, Bryan : revoir les cartes jouées et comprendre les dégâts) */
  historique?: TourHisto[];
}

/**
 * Le journal du combat, tour par tour. Gardé dans la sauvegarde avec le combat : il doit rester léger
 * (seulement ce qu'il faut pour relire le tour : les cartes jouées, chaque ligne du journal et le calcul des coups).
 */
export interface TourHisto {
  tour: number;
  /** la chaîne lancée ce tour-ci, dans l'ordre (vide si le combat s'est arrêté avant) */
  chaine: CarteHisto[];
  /** la suite qui a résonné (3 à 5) et son multiplicateur */
  suite?: number;
  mult?: number;
  echo?: boolean;
  /** les Fréquences étaient brouillées : pas de Résonance */
  brouille?: boolean;
  lignes: LigneHisto[];
}

/** Une carte jouée, telle qu'elle était au lancer */
export interface CarteHisto {
  nom: string;
  porteur: string | null;
  carte?: string;
  type: TypeGeste;
  /** force de la carte (sans les bonus) */
  v: number;
  /** la Fréquence jouée */
  f: number;
  lourd?: boolean;
  effet?: Effet;
  effet2?: Effet;
  /** son Porteur était à terre */
  eteinte?: boolean;
}

/**
 * Une ligne du journal. camp : qui agit (le joueur, l'ennemi, ou la salle et les effets qui tombent d'eux-mêmes).
 * sorte : coup (dégâts à l'ennemi), blessure (dégâts à un Porteur), soin, protection (bouclier d'escouade),
 * ennemi-soin, ennemi-garde, flux, terre (un Porteur tombe), effet, info. v : le chiffre qui compte pour les totaux.
 */
export interface LigneHisto {
  camp: 'joueur' | 'ennemi' | 'neutre';
  sorte: 'coup' | 'blessure' | 'soin' | 'protection' | 'ennemi-soin' | 'ennemi-garde' | 'flux' | 'terre' | 'effet' | 'info';
  texte: string;
  v?: number;
  /** la place de la carte qui agit dans la chaîne (0 = la première) */
  rang?: number;
  /** le calcul (un par cible) */
  calculs?: CalculHisto[];
}

/** Le calcul d'un coup, d'une protection ou d'un soin : la base, chaque bonus et malus, ce que le bouclier a pris, le net */
export interface CalculHisto {
  /** sur qui (nom affiché) */
  cible: string;
  base: number;
  lignes: { nom: string; m?: number; v?: number }[];
  /** après les bonus et malus, avant le bouclier */
  brut: number;
  absorbe: number;
  net: number;
}

export type Evenement =
  | { kind: 'resonance'; suite: number; mult: number }
  /** une carte de la chaîne entre en jeu (pour l'animation) : sa place, sa lignée, son action */
  | { kind: 'carte'; rang: number; total: number; lignee: LigneeGeste; type: TypeGeste; porteur: string | null; suite: number; effet?: string }
  | { kind: 'degats'; cible: string; net: number; absorbe: number; rang?: number; source?: 'epines' | 'eboulis' | 'surtension'; zone?: boolean }
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
  | { kind: 'phase'; rang: number; id: string; nom: string }
  | { kind: 'a-terre'; cible: string }
  | { kind: 'fin'; issue: Issue };

/** Un pas d'animation : l'événement et l'état juste après lui */
export interface Pas {
  ev: Evenement;
  etat: CombatEtat;
}
