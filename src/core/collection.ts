// La collection : les cartes qui tombent dans les Strates, leurs raretés, les doublons et les niveaux.
// Tout le hasard passe par un état `rng` sauvegardé : aucun hasard n'est jamais payé.

import { MODULES, NIVEAU_FORCE, VOIES, carteId, porteurDef, estCarteConnue, gesteDeCarte, horsAlbum, moduleDe, moduleDef, renforcer, tirablesEn } from './donnees';
import { tireur } from './rng';
import type { Effet, GesteDef, Lignee, ModuleDef, Rarete } from './types';
import { t as tr } from './i18n';

export const RARETES: Rarete[] = ['fer', 'cuivre', 'argent', 'or', 'nacre'];
export const NOMS_RARETE: Record<Rarete, string> = { fer: tr('Fer'), cuivre: tr('Cuivre'), argent: tr('Argent'), or: tr('Or'), nacre: tr('Nacre') };

export const COLLECTION = {
  /** chance qu'un combat normal fasse tomber une carte */
  chanceCombat: 0.2,
  /** une trouvaille d'expédition est, à cette fréquence, un doublon d'une carte qu'on possède déjà dans ce métal :
   *  plus on joue, plus les cartes montent (étude du 22/10/2026 : les doublons se diluaient sur 225 exemplaires) */
  affinite: 0.4,
  /**
   * Les niveaux (12 novembre 2026, promotion validée par Bryan après la remarque de Luc : « la même carte avec une rareté au-dessus,
   * c'est juste une carte en plus sans intérêt ») : 3 niveaux par métal. Niveau 2 : un palier de force (+10 % de la force, au moins +1 ; parcours simulé : −10 au jour 17 contre 16 avant, 18 à +6 %) ;
   * niveau 3 : un cran d'effet (+20 % de la part de l'effet), ou +6 % de force sans effet à renforcer. Au niveau 3, la carte se
   * promeut au métal suivant (promouvoir) : un métal au niveau 1 bat toujours le métal du dessous au niveau 3.
   * Avant (10 novembre) : 5 niveaux à +15 %, et un exemplaire d'or neuf était plus faible qu'un argent monté.
   */
  bonusNiveau: NIVEAU_FORCE.palier,
  /** un cran d'effet : +20 % de la part ; ou, sans part, +6 % de force */
  cranEffet: 0.2,
  cranForce: NIVEAU_FORCE.cran,
  niveauMax: 3,
  /** niveau de départ selon la rareté : 1 pour toutes depuis le 10 novembre 2026 */
  niveauDepart: { fer: 1, cuivre: 1, argent: 1, or: 1, nacre: 1 } as Record<Rarete, number>,
  /** doublons pour passer au niveau suivant (2, 3, 4, 5) : moins de doublons tombent dans les métaux rares */
  doublons: {
    fer: [1, 2],
    cuivre: [1, 2],
    argent: [1, 2],
    or: [1, 2],
    nacre: [1, 2],
  } as Record<Rarete, number[]>,
  /**
   * La promotion (12 novembre 2026) : une carte au niveau 3 passe au métal suivant, au niveau 1, avec 3 copies de plus et des cristaux.
   * Une copie d'un métal en dessous vaut un tiers de copie par métal d'écart (3 argent = 1 or) : aucune copie n'est perdue.
   * Trouver la carte directement dans un métal au-dessus la fait passer dans ce métal en gardant son niveau.
   */
  promotion: {
    copies: 3,
    rapport: 3,
    cristaux: { fer: 0, cuivre: 60, argent: 150, or: 400, nacre: 2500 } as Record<Rarete, number>,
  },
  /**
   * La Perle de nacre (13 novembre 2026, Bryan : « garder du fun, de la découverte, mais ne pas banaliser » ; « ça donne un vrai
   * choix sur quelle carte monter ») : la promotion de l'or à la nacre demande 5 copies et 1 Perle. Avant, la moitié de la
   * collection finissait en nacre (49 nacres au jour 120 d'un joueur occasionnel, 93 % par promotion) ; avec la Perle, 15.
   * Les Perles : les quais à nacre de la Flèche, la première victoire de −9 et de −10, un lundi sur deux une fois −10 vaincue,
   * la fonte de copies en or à la Forge, le pack Ossyra et le lot des trois Récits (une chacun).
   */
  perle: {
    copiesNacre: 5,
    /** fondre 8 copies en or (prises sur toutes les cartes en or, celles de l'escouade gardent les leurs) et des cristaux */
    fonte: { copies: 8, cristaux: 2000 },
    /** une Perle tous les deux lundis, une fois la Strate −10 vaincue */
    semaines: 2,
    /** la première victoire du gardien de ces Strates donne une Perle */
    strates: [9, 10] as readonly number[],
  },
  /** composants rendus par le recyclage d'un doublon */
  recyclage: { fer: 5, cuivre: 15, argent: 40, or: 100, nacre: 250 } as Record<Rarete, number>,
  /** refabriquer un exemplaire : environ 5 fois le recyclage, plus des Éclats, plus du temps de Forge.
   *  9 novembre 2026 (cristal unique) : tout se paie en cristaux (`energie`) = composants d'avant + énergie ÷ 20. */
  refabrication: {
    fer: { composants: 0, eclats: 0, minutes: 5, energie: 27 },
    cuivre: { composants: 0, eclats: 0, minutes: 20, energie: 81 },
    argent: { composants: 0, eclats: 2, minutes: 60, energie: 215 },
    or: { composants: 0, eclats: 5, minutes: 180, energie: 535 },
    nacre: { composants: 0, eclats: 12, minutes: 480, energie: 1330 },
  } as Record<Rarete, { composants: number; eclats: number; minutes: number; energie: number }>,
  /** garanties : après N cartes sans cette rareté (ou mieux), la suivante l'est forcément */
  garanties: { argent: 40, or: 150, nacre: 400 },
} as const;

/** Chances de rareté selon la profondeur (en %) */
export const TABLES_RARETE: { jusqua: number; table: Record<Rarete, number> }[] = [
  // 12 novembre 2026 (révision complète, Bryan : « des cartes forcément de plus en plus fortes qui permettent de réussir les Strates ») :
  // le métal suit la Strate, un métal dominant par tranche (avant : du fer à 64-88 % à toutes les profondeurs)
  { jusqua: 2, table: { fer: 88, cuivre: 11, argent: 1, or: 0, nacre: 0 } },
  { jusqua: 4, table: { fer: 60, cuivre: 34, argent: 5.5, or: 0.5, nacre: 0 } },
  { jusqua: 6, table: { fer: 35, cuivre: 48, argent: 15, or: 2, nacre: 0 } },
  { jusqua: 8, table: { fer: 20, cuivre: 45, argent: 30, or: 5, nacre: 0 } },
  { jusqua: 10, table: { fer: 10, cuivre: 35, argent: 42, or: 12, nacre: 1 } },
  { jusqua: Infinity, table: { fer: 5, cuivre: 30, argent: 45, or: 18, nacre: 2 } },
];
/**
 * Le métal d'une tranche de Strates (12 novembre 2026) : fer de −1 à −2, cuivre de −3 à −6, argent de −7 à −10, or au Fond.
 * Une récompense ordinaire donne le métal de la tranche ; une récompense de prestige, celui du dessus (l'or au plus :
 * la nacre ne se donne jamais d'office).
 */
export const TRANCHES: { jusqua: number; metal: Rarete }[] = [
  { jusqua: 2, metal: 'fer' }, { jusqua: 6, metal: 'cuivre' }, { jusqua: 10, metal: 'argent' }, { jusqua: Infinity, metal: 'or' },
];
export const metalTranche = (strate: number): Rarete => (TRANCHES.find((t) => strate <= t.jusqua) ?? TRANCHES[TRANCHES.length - 1]!).metal;
export const metalDessus = (strate: number): Rarete => RARETES[Math.min(RARETES.indexOf('or'), RARETES.indexOf(metalTranche(strate)) + 1)]!;
/** le plus haut de deux métaux */
export const auMoins = (a: Rarete, b: Rarete): Rarete => (RARETES.indexOf(a) >= RARETES.indexOf(b) ? a : b);
export function tableRarete(strate: number): Record<Rarete, number> {
  return { ...(TABLES_RARETE.find((t) => strate <= t.jusqua) ?? TABLES_RARETE[TABLES_RARETE.length - 1]!).table };
}

export interface CarteCollection {
  niveau: number;
  /** doublons accumulés vers le niveau suivant (un tiers par métal d'écart pour une copie d'un métal en dessous) */
  doublons: number;
  /** trouvée dans ce métal alors que son Porteur n'en avait pas encore le niveau : elle y passera quand il l'aura (12 novembre 2026) */
  attente?: Rarete;
}

/** Ce que la collection a besoin de connaître de la partie */
export interface EtatCollection {
  collection: Record<string, CarteCollection>;
  /** cartes tirées depuis la dernière de chaque rareté (pour les garanties) */
  sans: { argent: number; or: number; nacre: number };
  rng: number;
  /** la fin choisie change les trouvailles (Grand Scellement : plus de nacre ; Archives ouvertes : deux fois plus) */
  actes?: { fin?: string };
  /** ce qui, dans la partie, désigne une carte par sa clé (pour la renommer quand elle change de métal) */
  porteurs?: Record<string, { modules: string[] } | undefined>;
  /** les Perles de nacre en réserve (13 novembre 2026) */
  perles?: number;
  vecu?: Record<string, unknown>;
  vus?: { cartes: string[] };
}

const rang = (r: Rarete) => RARETES.indexOf(r);

/** Tire une rareté, en appliquant les garanties */
export function tirerRarete(e: EtatCollection, strate: number, minimum: Rarete = 'fer'): Rarete {
  const t = tireur(e);
  const table = { ...tableRarete(strate) };
  if (e.actes?.fin === 'scellement') { table.or += table.nacre; table.nacre = 0; }
  if (e.actes?.fin === 'archives') { table.fer -= table.nacre; table.nacre *= 2; }
  let r: Rarete = 'fer';
  let v = t.nombre() * 100;
  for (const x of [...RARETES].reverse()) {
    if (table[x] > 0 && v < table[x]) { r = x; break; }
    v -= table[x];
  }
  const g = COLLECTION.garanties;
  if (strate >= 10 && e.sans.nacre + 1 >= g.nacre && e.actes?.fin !== 'scellement') r = 'nacre';
  else if (strate >= 5 && e.sans.or + 1 >= g.or && rang(r) < rang('or')) r = 'or';
  else if (e.sans.argent + 1 >= g.argent && rang(r) < rang('argent')) r = 'argent';
  if (rang(r) < rang(minimum)) r = minimum;
  e.sans.argent = rang(r) >= rang('argent') ? 0 : e.sans.argent + 1;
  e.sans.or = rang(r) >= rang('or') ? 0 : e.sans.or + 1;
  e.sans.nacre = r === 'nacre' ? 0 : e.sans.nacre + 1;
  return r;
}

/** Tire une carte : un métal, puis une carte parmi celles qui existent dans ce métal (les exclusives n'existent que dans le leur) */
export function tirerCarte(e: EtatCollection, strate: number, minimum: Rarete = 'fer', lignee?: Lignee): string {
  const r = tirerRarete(e, strate, minimum);
  const pool = tirablesEn(r).filter((m) => !lignee || m.lignee === lignee);
  return carteId(pool[tireur(e).entier(pool.length)]!.id, r);
}

/**
 * Une trouvaille d'expédition (combat, salle scellée, cache) : comme tirerCarte, mais une fois sur 2,5 (COLLECTION.affinite)
 * c'est un doublon d'une carte déjà possédée dans le métal tiré. Les choix (boss, objectif, Archive) restent tirerChoix.
 */
export function tirerTrouvaille(e: EtatCollection, strate: number, minimum: Rarete = 'fer', lignee?: Lignee): string {
  const r = tirerRarete(e, strate, minimum);
  const t = tireur(e);
  // jamais le doublon d'une carte qui ne monte pas avec des doublons (Héritage, origine) : la trouvaille serait perdue
  const possedees = Object.keys(e.collection).filter((id) => id.endsWith('@' + r) && !moduleDef(id).legs && !moduleDef(id).origine && (!lignee || moduleDef(id).lignee === lignee));
  if (possedees.length && t.nombre() < COLLECTION.affinite) return possedees[t.entier(possedees.length)]!;
  const pool = tirablesEn(r).filter((m) => !lignee || m.lignee === lignee);
  return carteId(pool[t.entier(pool.length)]!.id, r);
}

/** Trois cartes différentes au choix (boss, objectif du jour, Archive), toujours trois cartes de base différentes.
 *  `presents` (10 novembre 2026, audit) : les Porteurs déjà au district ; une carte de voie dont le Porteur n'est pas encore arrivé
 *  n'est proposée qu'en dernier recours (au premier gardien, les trois cartes proposées pouvaient être « à venir »). */
export function tirerChoix(e: EtatCollection, strate: number, minimum: Rarete = 'fer', lignee?: Lignee, presents?: string[], toutes = false): string[] {
  const absente = (id: string) => !!presents && VOIES.some((v) => !presents.includes(v.porteur) && v.cartes.includes(moduleDef(id).base ?? moduleDef(id).id));
  const choix: string[] = [];
  let garde = 0;
  while (choix.length < 3 && garde++ < 30) {
    // toutes (10 novembre 2026, quais gravés de la Flèche) : les trois cartes sont au moins du métal demandé
    const id = tirerCarte(e, strate, choix.length === 0 || toutes ? minimum : 'fer', lignee);
    if (absente(id) && garde < 24) continue;
    if (!choix.some((c) => moduleDef(c).base === moduleDef(id).base)) choix.push(id);
  }
  return choix;
}

/** La clé possédée d'une carte de base (« lames-jumelles » → « lames-jumelles@or »), s'il y en a une : un seul métal par carte */
export function clePossedee(e: Pick<EtatCollection, 'collection'>, base: string): string | undefined {
  let mieux: string | undefined;
  for (const k of Object.keys(e.collection)) if (moduleDe(k) === base && (!mieux || rang(moduleDef(k).rarete) > rang(moduleDef(mieux).rarete))) mieux = k;
  return mieux;
}

/** Une carte change de clé (elle passe à un autre métal) : collection, decks des Porteurs, vécu et pastilles « nouveau » suivent */
export function renommerCarte(e: EtatCollection, avant: string, apres: string): void {
  if (avant === apres) return;
  const c = e.collection[avant];
  if (c) { delete e.collection[avant]; e.collection[apres] = c; }
  for (const p of Object.values(e.porteurs ?? {})) if (p) p.modules = [...new Set(p.modules.map((k) => (k === avant ? apres : k)))];
  if (e.vecu?.[avant] !== undefined) { e.vecu[apres] ??= e.vecu[avant]; delete e.vecu[avant]; }
  if (e.vus?.cartes) e.vus.cartes = [...new Set(e.vus.cartes.map((k) => (k === avant ? apres : k)))];
}

/** Ce que vaut une copie du métal `de` pour une carte en métal `vers` (un tiers par métal d'écart vers le bas) */
export const valeurCopie = (de: Rarete, vers: Rarete): number => COLLECTION.promotion.rapport ** -Math.max(0, rang(vers) - rang(de));
const arrondi = (x: number) => Math.round(x * 1000) / 1000;

/** Une carte qui monte avec des copies (pas l'Héritage, pas une carte d'origine) */
const monteAvecCopies = (id: string) => !moduleDef(id).legs && !moduleDef(id).origine;

/**
 * Ajoute une carte (12 novembre 2026, promotion) : on ne possède qu'un exemplaire de chaque carte, dans un seul métal.
 * - pas encore possédée : elle entre au niveau 1 (découverte) ;
 * - même métal : un doublon ;
 * - métal en dessous : un tiers de doublon par métal d'écart (3 argent = 1 or) ;
 * - métal au-dessus : la carte passe dans ce métal en gardant son niveau ; ses doublons suivent, au même rapport.
 * Renvoie true si une clé nouvelle apparaît (découverte, ou carte passée à un meilleur métal).
 */
export function ajouterCarte(e: EtatCollection, id: string): boolean {
  if (!monteAvecCopies(id)) {
    const c = e.collection[id];
    if (!c) { e.collection[id] = { niveau: COLLECTION.niveauDepart[moduleDef(id).rarete], doublons: 0 }; return true; }
    c.doublons++;
    return false;
  }
  const k = clePossedee(e, moduleDe(id));
  if (!k) {
    e.collection[id] = { niveau: COLLECTION.niveauDepart[moduleDef(id).rarete], doublons: 0 };
    return true;
  }
  const c = e.collection[k]!;
  const avant = moduleDef(k).rarete, recu = moduleDef(id).rarete;
  if (rang(recu) <= rang(avant)) { c.doublons = arrondi(c.doublons + valeurCopie(recu, avant)); return false; }
  // trouvée dans un métal que son Porteur ne peut pas encore porter : la carte garde son métal et attend son niveau
  const qui = porteurDeLaCarte(e, k);
  if (qui && NIVEAU_METAL[recu] > qui.niveau) {
    if (c.attente && rang(c.attente) >= rang(recu)) c.doublons = arrondi(c.doublons + 1);
    else c.attente = recu;
    return false;
  }
  passerAuMetal(e, k, recu);
  return true;
}

/** La carte passe dans un meilleur métal en gardant son niveau ; ses doublons suivent, au tiers par métal d'écart */
function passerAuMetal(e: EtatCollection, k: string, vers: Rarete): string {
  const c = e.collection[k]!;
  const nouvelle = carteId(moduleDe(k), vers);
  c.doublons = arrondi(c.doublons * valeurCopie(moduleDef(k).rarete, vers));
  if (c.attente && rang(c.attente) <= rang(vers)) delete c.attente;
  renommerCarte(e, k, nouvelle);
  return nouvelle;
}

/**
 * Le Porteur qui porte une carte et son niveau (null si personne ne la porte). La collection ne connaît pas l'XP :
 * la partie (etat.ts) branche ce calcul au chargement.
 */
let porteurDeLaCarte: (e: EtatCollection, cle: string) => { id: string; niveau: number } | null = () => null;
export function brancherPorteurDeLaCarte(f: typeof porteurDeLaCarte) { porteurDeLaCarte = f; }

/** Une carte trouvée trop tôt (attente) passe dans son métal si son Porteur en a désormais le niveau, ou si personne ne la porte */
export function appliquerAttente(e: EtatCollection, cle: string): string | null {
  const c = e.collection[cle];
  if (!c?.attente) return null;
  const qui = porteurDeLaCarte(e, cle);
  if (qui && NIVEAU_METAL[c.attente] > qui.niveau) return null;
  return passerAuMetal(e, cle, c.attente);
}

/** Le métal suivant (null après la nacre) */
export const metalSuivant = (r: Rarete): Rarete | null => RARETES[rang(r) + 1] ?? null;

/**
 * Pourquoi une carte ne peut pas encore être promue (null si elle le peut), hors coût en cristaux.
 * 12 novembre 2026 (Bryan : « le niveau du Porteur devrait être ce qui permet de la faire évoluer ») : une carte évolue avec
 * le Porteur qui la porte ; le métal suivant demande son niveau (argent 5, or 9, nacre 13).
 */
export function freinPromotion(e: EtatCollection, id: string): string | null {
  const c = e.collection[id];
  if (!c) return tr('Carte inconnue.');
  // une carte d'origine passe en nacre avec une Perle, sans copies, quand son Porteur a le niveau de la nacre (14 novembre 2026)
  if (moduleDef(id).origine) return freinOrigine(e, id);
  if (!monteAvecCopies(id)) return tr('Cette carte grandit avec son Porteur.');
  const vers = metalSuivant(moduleDef(id).rarete);
  if (!vers) return tr('La nacre est le plus haut métal.');
  if (c.niveau < COLLECTION.niveauMax) return tr`Il faut d’abord le niveau ${COLLECTION.niveauMax}.`;
  const qui = porteurDeLaCarte(e, id);
  if (!qui) return tr('Confie-la à un Porteur : elle évolue avec lui.');
  if (NIVEAU_METAL[vers] > qui.niveau) return tr`Pour passer en ${NOMS_RARETE[vers].toLowerCase()}, son Porteur doit être niveau ${NIVEAU_METAL[vers]} (${porteurDef(qui.id).nom} est niveau ${qui.niveau}).`;
  const copies = copiesPromotion(vers);
  if (c.doublons < copies) return tr`Il faut ${copies} copies.`;
  if (vers === 'nacre' && (e.perles ?? 0) < 1) return tr('Il faut une Perle de nacre.');
  return null;
}

/**
 * La carte d'origine en nacre (Bryan, 14 novembre 2026 : « il faudrait quand même pouvoir la passer en nacre avec une perle ») :
 * elle n'a pas de copies, donc il ne faut qu'une Perle et les cristaux de la nacre, et un Porteur de niveau 13 comme toute nacre.
 * Elle garde son niveau et ses deux effets. Face à un autre joueur, elle perd toujours son effet en plus (sansBonusOrigine).
 */
function freinOrigine(e: EtatCollection, id: string): string | null {
  const vers = metalSuivant(moduleDef(id).rarete);
  if (vers !== 'nacre') return tr('La nacre est le plus haut métal.');
  const qui = porteurDeLaCarte(e, id);
  if (!qui) return tr('Confie-la à un Porteur : elle évolue avec lui.');
  if (NIVEAU_METAL.nacre > qui.niveau) return tr`Pour passer en nacre, son Porteur doit être niveau ${NIVEAU_METAL.nacre} (${porteurDef(qui.id).nom} est niveau ${qui.niveau}).`;
  if ((e.perles ?? 0) < 1) return tr('Il faut une Perle de nacre.');
  return null;
}

/** Une carte d'origine encore en or : elle peut passer en nacre (avec une Perle, sans copies) */
export const origineVersNacre = (id: string): boolean => !!moduleDef(id).origine && moduleDef(id).rarete === 'or';

/** Les copies qu'il faut pour passer à ce métal : 5 pour la nacre (avec une Perle), 3 sinon */
export const copiesPromotion = (vers: Rarete): number => (vers === 'nacre' ? COLLECTION.perle.copiesNacre : COLLECTION.promotion.copies);

/** Les copies qu'il faut pour le prochain pas d'une carte : le niveau suivant, ou la promotion au niveau maximum (null : plus rien) */
export function copiesRequises(id: string, niveau: number): { n: number; promotion: boolean } | null {
  const d = doublonsRequis(id, niveau);
  if (d !== null) return { n: d, promotion: false };
  if (!monteAvecCopies(id) || !metalSuivant(moduleDef(id).rarete)) return null;
  return { n: copiesPromotion(metalSuivant(moduleDef(id).rarete)!), promotion: true };
}

/** Promeut une carte au métal suivant, au niveau 1 (le coût en cristaux se paie à côté) ; renvoie la nouvelle clé */
export function promouvoirCarte(e: EtatCollection, id: string): string {
  const vers = metalSuivant(moduleDef(id).rarete)!;
  const nouvelle = carteId(moduleDe(id), vers);
  const c = e.collection[id]!;
  // une carte d'origine n'a pas de copies et garde son niveau : il vient de son Porteur, pas du métal
  if (!moduleDef(id).origine) {
    c.doublons = arrondi((c.doublons - copiesPromotion(vers)) * valeurCopie(moduleDef(id).rarete, vers));
    c.niveau = COLLECTION.niveauDepart[vers];
  }
  renommerCarte(e, id, nouvelle);
  return nouvelle;
}

/** Doublons nécessaires pour le niveau suivant (null au niveau max) */
export function doublonsRequis(id: string, niveau: number): number | null {
  // une carte de l’Héritage est unique : elle ne monte pas avec des doublons, elle s'éveille avec son Porteur (eveillerLegs)
  // une carte d'origine aussi : elle grandit avec son Porteur (eveillerOrigines)
  if (moduleDef(id).legs || moduleDef(id).origine) return null;
  const r = moduleDef(id).rarete;
  if (niveau >= COLLECTION.niveauMax) return null;
  return COLLECTION.doublons[r][niveau - COLLECTION.niveauDepart[r]] ?? null;
}

/** Cristaux demandés pour monter au niveau suivant (le nom date d'avant le 9 novembre 2026) */
export const composantsNiveau = (niveau: number) => 20 * niveau;

/** Ce qu'un palier de force ajoute à une carte : un entier, au moins +1 */
export function gainNiveau(id: string): number {
  return Math.max(1, Math.round(moduleDef(id).v * COLLECTION.bonusNiveau));
}

const borneNiveau = (n: number) => Math.max(1, Math.min(COLLECTION.niveauMax, n));
/** Paliers de force gagnés à ce niveau (niveau 2) */
export const paliersForce = (niveau: number) => (borneNiveau(niveau) >= 2 ? 1 : 0);
/** Crans d'effet gagnés à ce niveau (niveau 3) */
export const cransEffet = (niveau: number) => (borneNiveau(niveau) >= 3 ? 1 : 0);
/** Le niveau renforce-t-il cet effet, ou la force à sa place ? (la Décharge se règle carte par carte, l'Accord n'a rien à renforcer) */
const effetMontant = (e: Effet | undefined): boolean => !!e && 'part' in e && e.type !== 'decharge';

/** L'effet d'une carte à son niveau : ses crans d'effet appliqués (avec les mêmes plafonds que le métal) */
export function effetNiveau(e: Effet | undefined, niveau: number): Effet | undefined {
  const k = cransEffet(niveau);
  return e && k && effetMontant(e) ? renforcer(e, 1 + COLLECTION.cranEffet * k) : e;
}

/** La carte telle qu'elle joue à son niveau : sa force et ses effets */
export function carteNiveau(m: ModuleDef, niveau: number): ModuleDef {
  return { ...m, v: forceNiveau(m.id, niveau), ...(m.effet ? { effet: effetNiveau(m.effet, niveau) } : {}), ...(m.effet2 ? { effet2: effetNiveau(m.effet2, niveau) } : {}) };
}

/** La force d'une carte à son niveau : sa force de départ, plus ses paliers de force (et ses crans, sans effet à renforcer) */
export function forceNiveau(id: string, niveau: number): number {
  const m = moduleDef(id);
  const crans = effetMontant(m.effet) ? 0 : cransEffet(niveau) * Math.max(1, Math.round(m.v * COLLECTION.cranForce));
  return m.v + gainNiveau(id) * paliersForce(niveau) + crans;
}

/** Multiplicateur de force d'une carte selon son niveau (tombe pile sur `forceNiveau` une fois arrondi) */
export function multNiveau(id: string, niveau: number): number {
  const v = moduleDef(id).v;
  return v > 0 ? forceNiveau(id, niveau) / v : 1;
}

/**
 * La Charge (26 octobre 2026, Bryan : « une carte qui fait 30 face à une qui fait 8 ») : chaque carte pèse selon sa puissance
 * (celle du tri « Puissance », dans son métal, à son niveau de départ : monter une carte ne l'alourdit pas), et chaque Porteur
 * porte une Charge qui grandit avec son niveau. Le robot a montré qu'un poids qui suit la puissance laisse « une grosse carte
 * et des petites » et « six cartes moyennes » à égalité ; un poids qui grimpe plus vite écrase les grosses cartes.
 */
export const CHARGE = {
  /** une carte pèse sa puissance divisée par ce nombre (1 au moins) */
  diviseur: 4,
  /** Charge d'un Porteur au niveau 1, et ce qu'il gagne par niveau */
  // 12 novembre 2026 (Bryan : « ça complique quand même bien le jeu ») : la Charge ne limite plus le deck, seuls les places
  // et le niveau demandé par le métal comptent (avant : 16). L'affichage de la Charge reste à retirer (chantier 5).
  base: 150,
  parNiveau: 1,
};
export const poidsCarte = (cle: string): number =>
  Math.max(1, Math.round(puissanceCarte(cle, COLLECTION.niveauDepart[moduleDef(cle).rarete]) / CHARGE.diviseur));
export const chargeNiveau = (niveau: number): number => CHARGE.base + CHARGE.parNiveau * (niveau - 1);

/**
 * Le niveau de Porteur qu'un métal demande (27 octobre 2026, Bryan : « un niveau 1 ne devrait pas pouvoir porter d'or »).
 * Une carte trouvée trop tôt entre quand même dans la collection et y monte avec ses doublons : on sait quel Porteur faire monter.
 */
// 12 novembre 2026 : sans la Charge, ce niveau est la seule limite avec les places : seuils étalés (avant : argent 4, or 7, nacre 10)
export const NIVEAU_METAL: Record<Rarete, number> = { fer: 1, cuivre: 1, argent: 5, or: 9, nacre: 13 };
/** une carte d'origine se porte dès le niveau 1 : elle est là pour aider au début (11 novembre 2026) */
export const niveauRequis = (cle: string): number => (moduleDef(cle).origine && moduleDef(cle).rarete !== 'nacre' ? 1 : NIVEAU_METAL[moduleDef(cle).rarete]);

/**
 * Le métal dans lequel un Porteur joue une carte (12 novembre 2026, promotion) : une carte qu'il portait déjà et qui passe à un métal
 * trop haut pour son niveau (trouvaille ou promotion) reste dans son deck, jouée dans le plus haut métal qu'il peut porter,
 * jusqu'à ce qu'il ait le niveau. Jamais en dessous du métal d'origine de la carte.
 */
export function metalJouable(cle: string, niveauPorteur: number): string {
  if (niveauRequis(cle) <= niveauPorteur) return cle;
  const plancher = rang(MODULES.find((m) => m.id === moduleDe(cle))?.rarete ?? 'fer');
  for (let i = rang(moduleDef(cle).rarete) - 1; i >= plancher; i--) if (NIVEAU_METAL[RARETES[i]!] <= niveauPorteur) return carteId(moduleDe(cle), RARETES[i]!);
  return carteId(moduleDe(cle), RARETES[plancher]!);
}

/** Les cartes qu'un Porteur apporte au deck de combat : celles qu'on lui a confiées, à leur niveau */
export function cartesEnJeu(porteurId: string, cartes: { id: string; niveau: number }[]): GesteDef[] {
  return cartes.map(({ id, niveau }) => gesteDeCarte(id, porteurId, multNiveau(id, niveau), cransEffet(niveau)));
}

/** Face à un autre joueur, une carte d'origine (payante) perd l'effet qu'elle a en plus : elle y vaut une carte d'or ordinaire.
 *  Le pay-to-win ne compte qu'entre joueurs (Bryan, 11 novembre 2026) : l'avantage vendu reste dans les Strates. */
export function sansBonusOrigine(g: GesteDef): GesteDef {
  const bonus = g.carte && estCarteConnue(g.carte) ? moduleDef(g.carte).origine : undefined;
  if (!bonus) return g;
  const { effet2, ...reste } = g;
  if (effet2?.type === bonus) return reste;
  return g.effet?.type === bonus ? (effet2 ? { ...reste, effet: effet2 } : (({ effet: _e, ...r }) => r)(reste)) : g;
}

/**
 * Un Porteur combat toujours avec ses 6 places (26 octobre 2026) : chaque place qu'on ne remplit pas entre dans le deck
 * comme une place vide, qui prend une place dans la main sans se jouer. Sans elles, trois grosses cartes par Porteur
 * revenaient en main à chaque tour et battaient six cartes bien choisies, à Charge égale.
 */
export const PLACES_PORTEUR = 6;
export function placesVides(porteurId: string, nb: number): GesteDef[] {
  return Array.from({ length: Math.max(0, PLACES_PORTEUR - nb) }, () => ({ id: 'vide', porteur: porteurId, nom: tr('Place vide'), f: 0, type: 'atk', v: 0, vide: true }));
}

// ---------- L'album (12 novembre 2026) ----------

/**
 * L'album d'une lignée : les cartes possédées (dans un métal au moins), puis celles qui restent à trouver.
 * Une carte hors album (Héritage, parrainage, origine) n'y figure que possédée : on ne peut pas toutes les avoir,
 * elle n'est donc jamais « à trouver » (Bryan : « des cartes en plus dans la collection, pas des cartes à compléter »).
 */
export function album(collection: Record<string, unknown>, lignee: Lignee): { possedees: ModuleDef[]; aTrouver: ModuleDef[] } {
  const trouvees = new Set(Object.keys(collection).filter(estCarteConnue).map(moduleDe));
  const cartes = MODULES.filter((m) => m.lignee === lignee);
  return { possedees: cartes.filter((m) => trouvees.has(m.id)), aTrouver: cartes.filter((m) => !trouvees.has(m.id) && !horsAlbum(m)) };
}

// ---------- Trier la collection (24 octobre 2026) ----------

/**
 * La puissance d'une carte pour le deck, à son niveau : sa force, ajustée de ce qu'elle apporte en plus.
 * C'est la même estimation que le parcours simulé de l'équilibrage (parcours.ts) : une carte lourde compte pour 60 %
 * (elle prend deux places), un effet +25 %, une défense ou un soin +10 %, et +15 % par Fréquence en plus.
 */
export function puissanceCarte(cle: string, niveau: number): number {
  const m = moduleDef(cle);
  let v = m.v * multNiveau(cle, niveau);
  if (m.lourd) v *= 0.6;
  if (m.effet) v *= 1.25;
  // lot 3 (9 novembre 2026) : les cartes « à prix » (Cadence folle, Nuée chorale, Plume de givre, Hallali, Grand unisson,
  // Coquille de marée) ne donnent toute leur force que dans le bon deck : hors de lui, elles valent moins que leur force affichée
  const e = m.effet;
  if (e && (('total' in e && e.total) || ('cadence' in e && e.cadence) || ('exige' in e && e.exige) || ('deux' in e && e.deux) || ('toute' in e && e.toute) || ('vide' in e && e.vide))) v *= 0.7;
  if (m.type !== 'atk') v *= 1.1;
  return v * (1 + 0.15 * (m.f.length - 1));
}

export type TriCartes = 'puissance' | 'metal' | 'niveau' | 'nouvelles';
export const TRIS: { id: TriCartes; nom: string; texte: string }[] = [
  { id: 'puissance', nom: tr('Puissance'), texte: tr('La force de la carte à son niveau, ajustée de ses effets, de ses Fréquences et des places qu’elle prend') },
  { id: 'metal', nom: tr('Métal'), texte: tr('De la nacre au fer') },
  { id: 'niveau', nom: tr('Niveau'), texte: tr('Du plus haut au plus bas') },
  { id: 'nouvelles', nom: tr('Nouvelles'), texte: tr('Les cartes pas encore vues d’abord, puis par puissance') },
];
export const estTri = (t: unknown): t is TriCartes => TRIS.some((x) => x.id === t);

/** Trie des exemplaires (clés carte@métal) : le critère choisi d'abord, puis la puissance, le métal, le nom ; « nouvelles » met en tête celles qui ne sont pas dans `vues` */
export function trierCartes(cles: string[], collection: Record<string, { niveau: number }>, tri: TriCartes, vues: readonly string[] = []): string[] {
  const p = (k: string) => puissanceCarte(k, collection[k]?.niveau ?? 1);
  const r = (k: string) => RARETES.indexOf(moduleDef(k).rarete);
  const n = (k: string) => collection[k]?.niveau ?? 1;
  const vu = new Set(vues);
  const cle = (k: string): number[] => tri === 'metal' ? [r(k), p(k)] : tri === 'niveau' ? [n(k), p(k), r(k)]
    : tri === 'nouvelles' ? [Number(!vu.has(k)), p(k), r(k), n(k)] : [p(k), r(k), n(k)];
  return [...cles].sort((a, b) => {
    const x = cle(a), y = cle(b);
    for (let i = 0; i < x.length; i++) if (x[i] !== y[i]) return y[i]! - x[i]!;
    return moduleDef(a).nom.localeCompare(moduleDef(b).nom, 'fr');
  });
}
