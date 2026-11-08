import { porteurDef } from './donnees';
import type { Geste, Lignee, LigneeGeste } from './types';

/** Les réglages chiffrés du combat, au même endroit pour l'équilibrage */
export const REGLES = {
  /** Combats qui s'éternisent (`usureCombat`, combat.ts) : les soins ennemis baissent dès le tour `soinsDes`, à zéro `soinsSur` tours plus tard ;
   *  les attaques ennemies grossissent de `attaqueParTour` par tour à partir du tour `attaqueDes`.
   *  3 novembre 2026, validé par Bryan après le diagnostic au robot : avant, +10 % dès le tour 25, et une escouade de Génés seuls
   *  (boucliers et soins en cuivre) tenait indéfiniment et gagnait ~93 % (deck mélangé ~50 %). Dès le tour 12 à +15 % : Génés seuls ~25 %
   *  pour le joueur moyen, combats normaux (≈ 7 tours) inchangés, les Génés restent ceux qui tiennent, mais tenir ne suffit plus seul. */
  usure: { soinsDes: 10, soinsSur: 10, attaqueDes: 12, attaqueParTour: 0.15 },
  /** À quelle Strate chaque mécanique de combat apparaît (28 octobre 2026) : une nouveauté à la fois, rien n'est retiré.
   *  −1 : chaîne, Résonance, Flux ; −2 : Fêlure ; −3 : groupes ; −4 : traits d'ennemis ; −5 : conditions de salle.
   *  Les phases des gardiens restent dès la −2. */
  apparition: { felure: 2, groupes: 3, traits: 4, conditions: 5, assimilation: 6, troisiemePhase: 7 },
  /** Les aides aux suites (cartes qui s'éclairent, chiffre attendu dans la place vide, « ajoute un 6 ») : jusqu'à cette Strate,
   *  puis seul le résultat s'affiche (3 novembre 2026, Bryan : « ça fait peut-être un peu trop d'assistanat ») */
  aideSuitesJusqua: 2,
  /** Brouillard sur le plan des Strates (30 octobre 2026, idée de Bryan après une remarque de Luc) : on ne sait plus d'avance où mène un chemin.
   *  Les salles voisines sont claires jusqu'à la Strate `indices` − 1, puis elles ne montrent qu'un indice (bruits, lueur…).
   *  Au-delà des voisines, tout est dans la brume ; jusqu'à la Strate `loin`, on devine encore les indices de la rangée d'après.
   *  Un Résonant debout dans l'escouade « sent » une rangée de plus (indices seulement). Le gardien se voit toujours. */
  brouillard: { loin: 1, indices: 4 },
  /** Ce que rapportent les salles (30 octobre 2026, Luc : « quel intérêt de faire le combat ? La cache donne plus et on ne perd pas de PV ») :
   *  le combat rapporte plus de composants que la cache, en plus de l'XP et de la chance de carte ; la cache devient la voie sûre et modeste,
   *  qui panse un peu l'escouade. Avant : combat 6, cache 8 (sans soin). Tout est multiplié par 1 + 0,25 × (Strate − 1). */
  salles: { combat: 8, cache: 5, cacheSoin: 0.1, archive: 4, gardien: 14, elite: 1.7, parStrate: 0.25 },
  /** Ce qu'Explorer rapporte de plus qu'une fouille (audit du 7 novembre 2026 : à −5, 25 de valeur par minute en exploration
   *  contre 49 en fouille facile). Pour les combats d'une expédition salle par salle (pas les fouilles) : composants ×`composants`,
   *  chance de carte par combat gagné +`carte`, et dès la Strate −`eclatsDes` une chance d'Éclat `eclats` (fouilles : `eclatsFouille`). */
  exploration: { composants: 1.5, carte: 0.05, eclatsDes: 5, eclats: 0.2, eclatsFouille: 0.1 },
  /** 3ᵉ phase des gardiens (28 octobre 2026) : sous ce seuil de PV, une variante tirée au début du combat ; Déferlement : +X par tour, plafond */
  troisiemePhase: { seuil: 0.2, deferlement: 0.25, deferlementMax: 2, renfort: 0.2, renfortForce: 0.28 },
  tailleMain: 5,
  /** force d'une carte « éteinte » (son Porteur est à terre) : elle reste dans le deck, sans effet, et sa Fréquence compte (27 octobre 2026).
   *  Mesuré au pillage miroir (joueur moyen) : avant 44 % de victoires en 18 tours ; ×0,5 → 23 % ; ×0,85 → 39 % en 13 tours ; ×1 → 47 % */
  eteinte: 0.85,
  capaciteBase: 3,
  capaciteMax: 5,
  fluxMax: 3,
  bonusLignee: 1.15,
  /** Empreinte (carte exclusive, 28 octobre 2026) : sans effet à copier, la carte gagne cette force en plus.
   *  Mesuré au robot : sans elle, une Empreinte dans un deck encore en fer (aucun effet) ne valait rien. */
  empreinteSeule: 1.4,
  /** Écho (trois Fréquences identiques dans la chaîne) : les cartes qui résonnent ensemble frappent, protègent et soignent
   *  plus fort (27 octobre 2026). Avant : bouclier d'escouade +8, quelle que soit la chaîne — trop peu pour un tirage
   *  environ 10 fois plus rare qu'une suite de 3 dans un deck normal (3 à 7 % des mains contre ~40 %), et toujours du bouclier.
   *  Le bonus suit maintenant l'action des cartes ; +50 % se place entre la suite de 3 (+30 %) et celle de 4 (+60 %) : plus rare
   *  que la première, mais un deck qui empile une Fréquence peut le rendre fréquent (23 % des mains). Mesuré au robot
   *  (archétypes, 80 descentes) : de ×1,25 à ×1,6, le deck « tout en échos » ne bat jamais le deck normal chez le joueur moyen
   *  (−4 à −7 points) et reste loin derrière le deck « tout en suites » (voir docs/robot-archetypes.md). */
  echo: 1.3,
  /** Écho à 4 et à 5 cartes (1er novembre 2026, demande de Bryan) : chaque carte de plus est 4 à 5 fois plus rare, mais elle
   *  ajoute déjà une carte entière renforcée ; le palier reste donc modéré pour ne pas pousser au deck « une seule Fréquence ».
   *  Avant : +50 % quel que soit le nombre de cartes. La quintuplette (qui demande une place de Flux) rend en plus 1 Flux. */
  echoPaliers: { 3: 1.3, 4: 1.45, 5: 1.6 } as Record<number, number>,
  /** Flux en plus rendu par une quintuplette (cinq Fréquences identiques) */
  fluxEcho5: 1,
  /** multiplicateur selon la longueur de la meilleure suite.
   *  8 novembre 2026 (audit du soir, validé par Bryan) : à 3 places de chaîne, l'Écho (+50 %) payait plus que la suite (+30 %).
   *  Écho 1,5 / 1,65 / 1,8 → 1,3 / 1,45 / 1,6 et suite de 3 : 1,3 → 1,4. Robot (archétypes, joueur moyen, −3) :
   *  force 83 → 78 %, suites 60 → 63 %, échos 75 → 71 % (bruit ±9 points). */
  multSuite: { 3: 1.4, 4: 1.6, 5: 2 } as Record<number, number>,
  /** part du bonus de suite gardée quand toute la suite vient d'une seule lignée (1 = bonus entier) */
  suiteMono: 1,
  /** force en plus de toutes les cartes quand l'escouade réunit les trois lignées (1 = aucun bonus) */
  trioLignees: 1,
  /** Finisseur (29 octobre 2026, rôles des lignées) : la carte Augmentée qui termine une suite de 3 au moins frappe plus fort.
   *  Les Augmentés « frappent », les Génés « tiennent », les Résonants « troublent » : aucune lignée ne gagne seule. */
  finisseur: 1.25 as number,
  /** part gardée par un bouclier (ou un soin) pour chaque carte du même genre déjà posée dans la chaîne (1 = aucune perte) */
  empilement: { bouclier: 1, soin: 1 },
  soinEntreCombats: 0.5,
  /** Fêlure (25 octobre 2026) : une carte de la Fréquence fêlée brise l'intention de l'ennemi visé */
  felure: {
    /** chance que la Fréquence fêlée soit tirée parmi celles de la main (sinon de 1 à 9) */
    chanceMain: 2 / 3,
    /** part retirée à l'attaque, au bouclier ou au soin annoncé ; les gardiens résistent mieux */
    part: 0.5,
    partGardien: 0.25,
    /** Flux gagné par Fêlure brisée, seulement si la chaîne fait aussi une Résonance (26 octobre 2026 : Bryan trouvait
     *  le Flux trop facile, une carte isolée suffisait ; le Flux redevient la récompense des suites) */
    flux: 1,
  },
  /** Coups d'éclat (25 octobre 2026) : Flux plein, un seul par combat */
  eclat: {
    /** Usure en plus pour le Porteur qui le déclenche (« deux jours de sommeil ») */
    usure: 3,
    /** Débridage : multiplicateur des dégâts de la chaîne (26 octobre 2026 : 2 → 1,5, Bryan trouvait qu'il finissait le combat
     *  à lui seul, quand Sursaut et Ombre agissante ne font que sauver l'escouade) */
    debride: 1.5,
    /** Sursaut : part des PV max rendue à chacun, et à celui qui se relève */
    sursaut: 0.4,
  },
} as const;

// Tech bat Résonant, Résonant bat Géné, Géné bat Tech
const BAT: Record<Lignee, Lignee> = { tech: 'reso', reso: 'bio', bio: 'tech' };
export const BATTU_PAR: Record<Lignee, Lignee> = { reso: 'tech', bio: 'reso', tech: 'bio' };

export function avantage(att: LigneeGeste, def: Lignee): number {
  return att !== 'neutre' && BAT[att] === def ? REGLES.bonusLignee : 1;
}

interface Analyse {
  /** longueur de la meilleure suite croissante consécutive (1, 2, 3…) */
  suite: number;
  mult: number;
  echo: boolean;
  /** la Fréquence qui fait l'Écho (celle des cartes renforcées), s'il y en a un */
  echoF?: number;
  /** combien de cartes font l'Écho (3, 4 ou 5) */
  echoN?: number;
}

type Maillon = Pick<Geste, 'f'> & { effet?: Geste['effet']; porteur?: Geste['porteur'] };

/** Une carte à Fréquence libre : l'Accord (prolonge la suite) et le Diapason (répète la Fréquence d'avant) */
export const frequenceLibre = (e?: { type: string }) => e?.type === 'accord' || e?.type === 'diapason';
/**
 * La zone de Fréquences de chaque lignée (1er novembre 2026, Bryan : « il faut un truc cohérent »).
 * La Fréquence principale d'une carte est toujours dans la zone de sa lignée ; les autres (débloquées par le métal)
 * peuvent en déborder d'un cran ; seules les exclusives, l'Héritage et la carte du parrainage s'écartent plus loin.
 * Les trois zones se chevauchent et couvrent ensemble l'échelle 1 à 9 (tests/zones-frequences.test.ts).
 */
export const ZONES_FREQUENCES: Record<Lignee, readonly [number, number]> = { bio: [1, 5], tech: [3, 7], reso: [6, 9] };

/** Le signe d'une Fréquence libre sur la carte : ∗ pour l'Accord, = pour le Diapason */
export const signeLibre = (e?: { type: string }) => (e?.type === 'diapason' ? '=' : '∗');

/**
 * Fréquences réellement jouées : un Geste à Accord prend toujours la Fréquence
 * qui prolonge la suite (celle d'avant + 1, ou celle d'après − 1 s'il ouvre la chaîne) ;
 * un Geste à Diapason reprend celle d'avant (ou celle d'après s'il ouvre la chaîne).
 */
export function frequencesEffectives(chaine: Maillon[]): number[] {
  const r: number[] = [];
  chaine.forEach((g, i) => {
    if (!frequenceLibre(g.effet)) { r.push(g.f); return; }
    const pas = g.effet?.type === 'accord' ? 1 : 0;
    // les Fréquences vont de 1 à 9 : après un 9, l'Accord reste à 9 (il ne joue jamais un 10 ; audit du 7 novembre 2026)
    const borne = (f: number) => Math.min(9, Math.max(1, f));
    if (i > 0) { r.push(borne(r[i - 1]! + pas)); return; }
    const suivant = chaine[1];
    r.push(suivant && !frequenceLibre(suivant.effet) ? borne(suivant.f - pas) : g.f);
  });
  return r;
}

/**
 * Les Accords bloqués au bout de l'échelle (8 novembre 2026, audit) : un Accord après un 9 reste à 9 (ou à 1 s'il ouvre devant
 * un 1). Il ne prolonge alors aucune suite, et il ne compte pas non plus dans un Écho : sinon 9-9-Accord faisait un Écho gratuit.
 */
export function accordsBloques(chaine: Maillon[]): boolean[] {
  const fs = frequencesEffectives(chaine);
  return chaine.map((g, i) => {
    if (g.effet?.type !== 'accord') return false;
    if (i > 0) return fs[i] === fs[i - 1];
    const suivant = chaine[1];
    return !!suivant && !frequenceLibre(suivant.effet) && fs[0] === suivant.f;
  });
}

/** Résonance (suite 3-4-5…) et Écho (trois Fréquences identiques) */
export function analyserChaine(chaine: Maillon[]): Analyse {
  const fs = frequencesEffectives(chaine);
  let meilleur = fs.length ? 1 : 0;
  let serie = 1;
  let fin = 0;
  for (let i = 1; i < fs.length; i++) {
    if (fs[i] === fs[i - 1]! + 1) {
      serie++;
      if (serie > meilleur) { meilleur = serie; fin = i; }
    } else serie = 1;
  }
  const compte = new Map<number, number>();
  const bloques = accordsBloques(chaine);
  fs.forEach((f, i) => { if (!bloques[i]) compte.set(f, (compte.get(f) ?? 0) + 1); });
  const echoE = [...compte.entries()].filter(([, n]) => n >= 3).sort((x, y) => y[1] - x[1])[0];
  const echoF = echoE?.[0];
  let mult = REGLES.multSuite[Math.min(meilleur, 5)] ?? 1;
  // suite d'une seule lignée : bonus réduit (les lignées se complètent sur l'échelle 1 à 9)
  if (meilleur >= 3 && REGLES.suiteMono < 1) {
    const ls = new Set(chaine.slice(fin - meilleur + 1, fin + 1).map((m) => (m.porteur ? porteurDef(m.porteur).lignee : null)).filter(Boolean));
    if (ls.size === 1) mult = 1 + (mult - 1) * REGLES.suiteMono;
  }
  return { suite: meilleur, mult, echo: echoF !== undefined, ...(echoE ? { echoF, echoN: echoE[1] } : {}) };
}

/** Multiplicateur d'Écho de la carte au rang donné : seules les cartes de la Fréquence répétée sont renforcées */
export function multEcho(chaine: Maillon[], rang: number): number {
  const a = analyserChaine(chaine);
  return a.echoF !== undefined && frequencesEffectives(chaine)[rang] === a.echoF && !accordsBloques(chaine)[rang] ? multEchoN(a.echoN ?? 3) : 1;
}

/** Multiplicateur d'un Écho de n cartes (3, 4 ou 5) */
export const multEchoN = (n: number) => REGLES.echoPaliers[Math.min(5, Math.max(3, n))] ?? REGLES.echo;
/** « +65 % » pour un Écho de n cartes */
export const pctEcho = (n = 3) => `+${Math.round((multEchoN(n) - 1) * 100)} %`;
/** « Écho », « Écho ×4 », « Écho ×5 » */
export const nomEcho = (n = 3) => (n >= 4 ? `Écho ×${Math.min(5, n)}` : 'Écho');

/** Longueur de la suite qui se termine sur le dernier Geste posé */
export function serieFinale(chaine: Maillon[]): number {
  const fs = frequencesEffectives(chaine);
  let s = fs.length ? 1 : 0;
  for (let i = fs.length - 1; i > 0; i--) {
    if (fs[i] === fs[i - 1]! + 1) s++;
    else break;
  }
  return s;
}

/**
 * La Surtension se paie en PV, jamais jusqu'à tomber : un Porteur à 1 PV ne peut plus la payer, et sa carte n'a alors pas le bonus.
 * Une seule règle pour les Strates et le duel (8 novembre 2026, audit : le duel donnait encore le bonus à 1 PV).
 */
export const peutPayerSurtension = (p?: { pv: number }) => !!p && p.pv > 1;

export const places = (g: Pick<Geste, 'lourd'>) => (g.lourd ? 2 : 1);

type Place = Pick<Geste, 'lourd'> & { effet?: Geste['effet'] };
/**
 * Les places que prend une chaîne (Servo, 4 novembre 2026) : chaque Servo rend une place à une carte lourde de la chaîne,
 * où qu'elle soit. `eteinte` : les cartes d'un Porteur à terre n'ont plus d'effet, leur Servo ne compte pas.
 */
export function placesChaine<T extends Place>(chaine: readonly T[], eteinte?: (g: T) => boolean): number {
  let n = 0, lourdes = 0, servos = 0;
  for (const g of chaine) {
    n += places(g);
    if (g.lourd) lourdes++;
    if (g.effet?.type === 'servo' && !eteinte?.(g)) servos++;
  }
  return n - Math.min(lourdes, servos);
}
/** Les places qu'une carte de plus prendrait dans cette chaîne (0 pour un Servo posé après une carte lourde) */
export const placesEnPlus = <T extends Place>(chaine: readonly T[], g: T, eteinte?: (g: T) => boolean) =>
  placesChaine([...chaine, g], eteinte) - placesChaine(chaine, eteinte);

/**
 * La Fréquence que prend une carte à plusieurs Fréquences quand on la pose (décision du 22 octobre 2026, sans tirage) :
 * celle qui fait tout de suite une Résonance (suite de 3 ou plus), sinon celle qui complète ou agrandit un Écho,
 * sinon celle qui prolonge une suite naissante, sinon sa Fréquence principale.
 * (1er novembre 2026 : avant, un 4/5 posé après trois 4 prenait le 5 pour une suite 4 → 5 sans valeur, et cassait la quadruplette.)
 */
export function meilleureFrequence(chaine: Maillon[], fs: number[]): number {
  if (fs.length < 2) return fs[0]!;
  const eff = frequencesEffectives(chaine);
  const der = eff[eff.length - 1];
  const prolonge = der !== undefined && fs.includes(der + 1);
  if (prolonge && serieFinale([...chaine, { f: der + 1 }]) >= 3) return der + 1;
  let echo: number | undefined;
  for (const f of fs) {
    const n = eff.filter((x) => x === f).length;
    if (n >= 2 && (echo === undefined || n > eff.filter((x) => x === echo).length)) echo = f;
  }
  if (echo !== undefined) return echo;
  if (prolonge) return der + 1;
  return fs[0]!;
}

/** La carte peut-elle prolonger la suite qui se termine sur `der` ? */
export const prolonge = (g: Pick<Geste, 'f' | 'fs' | 'effet'>, der: number | undefined) =>
  der !== undefined && (g.effet?.type === 'accord' || (g.fs ?? [g.f]).includes(der + 1));
