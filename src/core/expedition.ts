// Une expédition : l'escouade descend dans une Strate. Depuis le 22 octobre 2026, la Strate est une carte à explorer
// salle par salle (combats, salles scellées, caches, rencontres, campements, archives, puis le gardien).
// L'ancien mode linéaire (trois combats d'affilée) reste pour la chambre scellée et le robot d'équilibrage.

import { coupDeFuite, creerCombat } from './combat';
import { CONDITIONS, ZONES, ennemiDef, porteurDef, sequenceStrate, zoneDe } from './donnees';
import { tireur } from './rng';
import { REGLES } from './regles';
import type { BonusMarques, CombatEtat, GesteDef, PorteurEtat } from './types';

export interface Expedition {
  strate: number;
  sequence: string[];
  index: number;
  porteurs: PorteurEtat[];
  deck: GesteDef[];
  combat: CombatEtat;
  /** composants trouvés pendant l'expédition (versés au district au retour) */
  butin: number;
  /** l'expédition est finie (victoire finale ou défaite) */
  terminee: boolean;
  /** le combat courant a déjà été clôturé (évite de compter deux fois le butin) */
  cloture: boolean;
  /** la chambre scellée : combat guidé du premier lancement */
  tutoriel?: boolean;
  /** multiplicateur de la force des ennemis (la fin choisie par le joueur peut l'adoucir) */
  facteur?: number;
  /** ce que les Marques des Porteurs apportent à chaque combat */
  bonus?: BonusMarques;
  /** la carte de la Strate (exploration salle par salle) */
  carte?: CarteStrate;
  /** sur la carte, ou dans un combat */
  phase?: 'carte' | 'combat';
  /** combats gagnés pendant l'exploration */
  gagnes?: number;
  /** trouvailles de l'exploration, versées au district au retour */
  gains?: Gains;
  /** ce qui vient de se passer, raconté sur la carte */
  recit?: string;
  /** une rencontre attend une réponse */
  rencontre?: string;
  /** l'escouade est remontée d'elle-même depuis un campement */
  retraite?: boolean;
  /** l'escouade a fui un combat pour remonter au district (75 % des composants, de l'Usure en plus) */
  fuite?: boolean;
  /** une fouille ciblée : courte descente sans gardien dans une Strate déjà vaincue, vers un filon choisi */
  fouille?: CibleFouille;
  /** une Épreuve de la semaine : un seul combat à règle spéciale */
  /** un pillage (pillages.ts) : un seul combat contre la garnison d'un autre archipel */
  pillage?: import('./partie/pillages').PillageEnCours;
  epreuve?: string;
}

/** Ce que cherche une fouille ciblée : les cartes d'une lignée, des composants ou des Éclats */
export type CibleFouille = 'tech' | 'bio' | 'reso' | 'composants' | 'eclats';

interface Gains {
  /** salles scellées vaincues : une carte garantie chacune */
  elites: number;
  /** cartes offertes en route (rencontres) */
  cartes: number;
  eclats: number;
  /** une archive trouvée sur place */
  fragment: boolean;
}

export type TypeSalle = 'entree' | 'combat' | 'elite' | 'cache' | 'rencontre' | 'camp' | 'archive' | 'gardien' | 'filon';
export interface Salle {
  id: number;
  /** profondeur dans la Strate (0 = entrée) */
  rang: number;
  /** position dans sa rangée, et nombre de salles de la rangée */
  col: number;
  nCol: number;
  type: TypeSalle;
  voisins: number[];
  ennemi?: string;
  /** les ennemis qui accompagnent le premier (salle de combat à plusieurs) */
  escorte?: string[];
  /** la condition de la salle (CONDITIONS : inondée, éboulis…), visible avant d'entrer */
  condition?: string;
  rencontre?: string;
  faite: boolean;
}
interface CarteStrate {
  zone: number;
  salles: Salle[];
  position: number;
  /** hasard des salles (déterministe, sauvegardé) */
  rng: number;
}

/** Les rencontres possibles en route ; leurs choix sont dans jeu.ts (elles touchent au district) */
const RENCONTRES_IDS = ['veilleur', 'pilleur', 'brigade', 'cristal', 'marchand', 'source', 'sauvage', 'faussaire'] as const;

/**
 * Puissance des ennemis selon la profondeur (PV et attaques) : une table par Strate, réglée avec le robot
 * (parcours d'un joueur, `src/core/parcours.ts`), puis une hausse régulière au-delà de la table.
 */
export const FORCE = {
  // ×1,15 à partir de −2 (25 octobre 2026) : la Fêlure et les Coups d'éclat rendent l'escouade plus forte ; réglé au robot
  // pour garder ~1 victoire sur 3 au front (joueur moyen) et la Strate −10 vers le jour 28-30.
  // −7 % à partir de −2 (26 octobre 2026) : la Fêlure ne donne plus de Flux hors d'une suite ; réglé au robot pour garder
  // les mêmes repères (front 41 % / 37 %, Strate −10 au jour 29 / 22).
  //      −1   −2     −3     −4     −5     −6     −7     −8     −9     −10    −11    −12    −13    −14
  table: [1, 1.39, 1.818, 2.139, 2.46, 2.781, 2.888, 3.016, 3.102, 3.262, 3.475, 3.743, 3.936, 4.064] as number[],
  /** hausse par Strate au-delà de la table */
  ensuite: 1.04,
  /** hausse par Strate pour suivre les niveaux des Porteurs. À 0 depuis les traits, phases et conditions (22 octobre 2026), qui
   *  durcissent autant : au front, le joueur moyen gagne ~3 fois sur 10, un joueur qui calcule tout ~5 fois sur 10 */
  niveaux: 0.0,
};
export const forceStrate = (strate: number) => {
  const t = FORCE.table;
  const base = strate <= t.length ? t[Math.max(0, strate - 1)]! : t[t.length - 1]! * FORCE.ensuite ** (strate - t.length);
  return Math.round(base * (1 + FORCE.niveaux * Math.max(0, strate - 1)) * 1000) / 1000;
};
/** Composants gagnés par victoire */
export const butinCombat = (strate: number, index: number) => Math.round((index === 2 ? 14 : 6) * (1 + 0.25 * (strate - 1)));

export function nouvelleExpedition(opts: {
  porteurs: PorteurEtat[]; deck: GesteDef[]; strate: number; rng: number;
  sequence?: string[]; force?: number; tutoriel?: boolean; facteur?: number; bonus?: BonusMarques;
}): Expedition {
  const sequence = opts.sequence ?? sequenceStrate(opts.strate, opts.rng);
  return {
    strate: opts.strate,
    sequence,
    index: 0,
    porteurs: opts.porteurs,
    deck: opts.deck,
    combat: creerCombat({
      porteurs: opts.porteurs, ennemiId: sequence[0]!, rng: opts.rng, deck: opts.deck,
      force: opts.force ?? forceStrate(opts.strate) * (opts.facteur ?? 1), ordonne: opts.tutoriel, bonus: opts.bonus,
      ...(opts.strate < 2 ? { traits: false } : {}),
    }),
    butin: 0,
    terminee: false,
    cloture: false,
    ...(opts.tutoriel ? { tutoriel: true } : {}),
    ...(opts.facteur && opts.facteur !== 1 ? { facteur: opts.facteur } : {}),
    ...(opts.bonus ? { bonus: opts.bonus } : {}),
  };
}

/** À appeler une fois quand un combat se termine : butin, et fin d'expédition en cas de défaite */
export function cloturerCombat(x: Expedition): Expedition {
  if (x.cloture) return x;
  if (x.carte) {
    if (x.combat.issue === 'victoire') {
      const salle = salleCourante(x);
      const fin = salle.type === 'gardien';
      const gain = fin ? butinCombat(x.strate, 2) : salle.type === 'elite' ? Math.round(butinCombat(x.strate, 0) * 1.7) : butinCombat(x.strate, 0);
      const gains = { ...(x.gains ?? gainsVides()), elites: (x.gains?.elites ?? 0) + (salle.type === 'elite' ? 1 : 0) };
      return { ...x, butin: x.butin + gain, terminee: fin, cloture: true, gagnes: (x.gagnes ?? 0) + 1, gains, porteurs: x.combat.porteurs.map((p) => ({ ...p })) };
    }
    if (x.combat.issue === 'defaite') return { ...x, terminee: true, cloture: true };
    return x;
  }
  if (x.combat.issue === 'victoire') {
    const fin = x.index >= x.sequence.length - 1;
    return { ...x, butin: x.butin + butinCombat(x.strate, x.index), terminee: fin, cloture: true };
  }
  if (x.combat.issue === 'defaite') return { ...x, terminee: true, cloture: true };
  return x;
}

/** Après une victoire : soin partiel puis combat suivant (ou, en exploration, retour sur la carte) */
export function combatSuivant(x: Expedition): Expedition {
  if (x.combat.issue !== 'victoire' || x.terminee) return x;
  if (x.carte) return { ...x, phase: 'carte', recit: `Victoire. ${x.gains?.elites && salleCourante(x).type === 'elite' ? 'Derrière la salle scellée, une carte t’attend : elle te sera remise au retour. ' : ''}L’escouade reprend sa route.` };
  const porteurs = x.combat.porteurs.map((p) => ({
    ...p,
    pv: Math.min(p.pvMax, Math.max(p.pv, 0) + Math.round(p.pvMax * REGLES.soinEntreCombats)),
    aTerre: false,
  }));
  const index = x.index + 1;
  return {
    ...x,
    index,
    porteurs,
    cloture: false,
    combat: creerCombat({ porteurs, ennemiId: x.sequence[index]!, rng: x.combat.rng, deck: x.deck, force: forceStrate(x.strate) * (x.facteur ?? 1), bonus: x.bonus, ...(x.strate < 2 ? { traits: false } : {}) }),
  };
}

// ---------- L'exploration ----------

const gainsVides = (): Gains => ({ elites: 0, cartes: 0, eclats: 0, fragment: false });
export const salleCourante = (x: Expedition): Salle => x.carte!.salles[x.carte!.position]!;
/** Les salles où l'escouade peut aller : les voisines de la salle où elle se trouve */
export const accessibles = (x: Expedition): Salle[] => (x.carte ? salleCourante(x).voisins.map((id) => x.carte!.salles[id]!) : []);
/** La salle d'où vient l'escouade : sur la rangée d'avant, déjà visitée, et reliée à la salle courante */
export function sallePrecedente(x: Expedition): Salle | undefined {
  if (!x.carte) return undefined;
  const ici = salleCourante(x);
  return x.carte.salles.find((s) => s.rang === ici.rang - 1 && s.faite && s.voisins.includes(ici.id));
}
/** On peut fuir un combat en cours, sauf dans la chambre scellée (le combat guidé du premier lancement) */
export const peutFuir = (x: Expedition) => x.phase !== 'carte' && x.combat.issue === 'en-cours' && !x.tutoriel && !x.cloture;
/** Reculer d'une salle : seulement en exploration, et si quelqu'un tient encore debout après le dernier coup */
export const peutReculer = (x: Expedition) => peutFuir(x) && !!sallePrecedente(x) && coupDeFuite(x.combat).porteurs.some((p) => p.pv > 0);

/** Le récit du dernier coup encaissé en fuyant */
function recitCoup(x: Expedition): string {
  const { coups, attaque } = coupDeFuite(x.combat);
  const touches = coups.filter((c) => c.net > 0);
  if (!attaque) return x.combat.autres?.length ? 'Aucun ne préparait d’attaque : l’escouade s’échappe sans un coup.' : 'L’ennemi ne préparait pas d’attaque : l’escouade s’échappe sans un coup.';
  if (!touches.length) return `${attaque} s’écrase sur le bouclier : l’escouade s’échappe sans une égratignure.`;
  return `En fuyant, ${touches.map((c) => `${porteurDef(c.id).nom} encaisse ${attaque} (−${c.net})`).join(', ')}.`;
}

/**
 * Fuir vers la salle d'avant (décision du 22 octobre 2026) : l'ennemi frappe une dernière fois, l'escouade revient sur la carte
 * à la salle d'où elle venait. L'ennemi garde sa salle (elle redevient « à faire ») : on peut prendre un autre chemin,
 * ou revenir l'affronter plus tard (un combat neuf). Les PV perdus restent perdus.
 */
export function reculer(x: Expedition): { x: Expedition; ok: boolean; message?: string } {
  if (!peutFuir(x) || !x.carte) return { x, ok: false, message: 'On ne recule que pendant un combat d’exploration.' };
  const prec = sallePrecedente(x);
  if (!prec) return { x, ok: false, message: 'Pas de salle où se replier.' };
  const { porteurs } = coupDeFuite(x.combat);
  if (!porteurs.some((p) => p.pv > 0)) return { x, ok: false, message: 'L’escouade ne tiendrait plus debout : il faut remonter.' };
  const ici = salleCourante(x);
  const salles = x.carte.salles.map((s) => (s.id === ici.id ? { ...s, faite: false } : s));
  // l'ennemi fui ne compte pas parmi les combats livrés (les Marques comptent les ennemis vaincus dans l'ordre)
  const sequence = x.sequence.slice(0, -1);
  const groupe = !!x.combat.autres?.length;
  const nom = groupe ? 'Le groupe' : ennemiDef(x.combat.ennemi.id).nom;
  return {
    ok: true,
    x: {
      ...x, carte: { ...x.carte, salles, position: prec.id }, phase: 'carte', sequence, index: sequence.length - 1, cloture: true,
      porteurs, combat: { ...x.combat, porteurs: porteurs.map((p) => ({ ...p })) },
      recit: `${recitCoup(x)} L’escouade se replie d’une salle. ${nom} garde la sienne : prends un autre chemin, ou reviens l’affronter.`,
    },
  };
}

/** Fuir jusqu'au district : l'ennemi frappe une dernière fois, puis l'escouade remonte (remonter() applique le prix de la fuite) */
export function fuirAuDistrict(x: Expedition): { x: Expedition; ok: boolean; message?: string } {
  if (!peutFuir(x)) return { x, ok: false, message: 'On ne fuit que pendant un combat.' };
  const { porteurs } = coupDeFuite(x.combat);
  return {
    ok: true,
    x: { ...x, fuite: true, terminee: true, cloture: true, porteurs, combat: { ...x.combat, porteurs: porteurs.map((p) => ({ ...p })) }, recit: recitCoup(x) },
  };
}

/** On ne peut remonter de soi-même qu'à l'entrée ou depuis un campement */
export const peutRemonter = (x: Expedition) => !!x.carte && x.phase === 'carte' && !x.rencontre && ['entree', 'camp'].includes(salleCourante(x).type);

// plus de combats par descente (22 octobre 2026, Bryan voulait l'esprit Baten Kaitos) : ~6 au lieu de ~4, avec les 9 rangées
const POIDS: [TypeSalle, number][] = [['combat', 58], ['cache', 10], ['rencontre', 13], ['elite', 9], ['camp', 5], ['archive', 5]];

/** Rangées d'une carte de Strate : 9 pour une expédition (7 jusqu'au 22 octobre 2026), 4 pour une fouille ciblée */
const RANGS_EXPEDITION = 9;
const RANGS_FOUILLE = 4;
/** Nombre de rangées d'une carte */
export const rangsDe = (c: CarteStrate) => Math.max(...c.salles.map((s) => s.rang)) + 1;

/**
 * Une carte de Strate : l'entrée en haut, 2 ou 3 salles par rangée, et tout en bas le gardien
 * (ou, pour une fouille ciblée, le filon : une carte plus courte, sans gardien ni salle scellée).
 */
export function genererCarte(strate: number, rng: number, garde?: string, fouille = false): CarteStrate {
  const etat = { rng: (rng ^ 0x27d4eb2f) >>> 0 };
  const t = tireur(etat);
  const z = zoneDe(strate);
  const zone = ZONES.indexOf(z);
  const suivante = ZONES[Math.min(zone + 1, ZONES.length - 1)]!;
  const pool = garde === 'orseve' ? z.ennemis.filter((id) => id !== 'brigadier') : z.ennemis;
  const salles: Salle[] = [];
  const rangs: number[][] = [];
  const RANGS = fouille ? RANGS_FOUILLE : RANGS_EXPEDITION;
  for (let r = 0; r < RANGS; r++) {
    const n = r === 0 || r === RANGS - 1 ? 1 : 2 + t.entier(2);
    const ids: number[] = [];
    for (let c = 0; c < n; c++) {
      let type: TypeSalle;
      if (r === 0) type = 'entree';
      else if (r === RANGS - 1) type = fouille ? 'filon' : 'gardien';
      else if (r === 1) type = 'combat';
      else if (r === RANGS - 2 && c === 0) type = 'camp';
      else {
        let v = t.nombre() * 100;
        type = 'combat';
        for (const [ty, p] of POIDS) { if (v < p) { type = ty; break; } v -= p; }
        if (fouille && type === 'elite') type = 'combat';
      }
      const salle: Salle = { id: salles.length, rang: r, col: c, nCol: n, type, voisins: [], faite: r === 0 };
      if (type === 'combat') salle.ennemi = pool[t.entier(pool.length)]!;
      if (type === 'elite') salle.ennemi = suivante.ennemis[t.entier(suivante.ennemis.length)]!;
      if (type === 'gardien') salle.ennemi = z.boss;
      if (type === 'rencontre') salle.rencontre = RENCONTRES_IDS[t.entier(RENCONTRES_IDS.length)]!;
      if (garde === 'district' && type === 'combat' && z.ennemis.includes('brigadier') && t.nombre() < 0.35) salle.ennemi = 'brigadier';
      if (type === 'combat') {
        const escorte = escorteDe(strate, rng, salle.id, pool);
        if (escorte.length) salle.escorte = escorte;
      }
      if (salle.ennemi) {
        const condition = conditionDe(strate, rng, salle.id, type);
        if (condition) salle.condition = condition;
      }
      salles.push(salle);
      ids.push(salle.id);
    }
    rangs.push(ids);
  }
  // les couloirs : chaque salle mène à une ou deux salles de la rangée suivante, et chaque salle est atteignable
  for (let r = 0; r < RANGS - 1; r++) {
    const ici = rangs[r]!, la = rangs[r + 1]!;
    for (const [k, id] of ici.entries()) {
      const centre = Math.round(((k + 0.5) / ici.length) * la.length - 0.5);
      const cibles = new Set([Math.max(0, Math.min(la.length - 1, centre))]);
      if (la.length > 1 && t.nombre() < 0.55) cibles.add(Math.max(0, Math.min(la.length - 1, centre + (t.nombre() < 0.5 ? -1 : 1))));
      salles[id]!.voisins = [...cibles].map((c) => la[c]!);
    }
    for (const id of la) {
      if (!ici.some((a) => salles[a]!.voisins.includes(id))) {
        const proche = ici[Math.min(ici.length - 1, Math.round((salles[id]!.col / Math.max(1, la.length - 1)) * (ici.length - 1)))]!;
        salles[proche]!.voisins.push(id);
      }
    }
  }
  distinguerChemins(salles, pool, t);
  return { zone, salles, position: 0, rng: etat.rng };
}

/** Ce qui rend une salle reconnaissable sur la carte : deux salles de même signature sont un faux choix */
// (une rencontre ou une cache ne montre pas son contenu avant d'entrer : deux rencontres se ressemblent toujours)
const signatureSalle = (s: Salle) => [s.type, s.ennemi ?? '', (s.escorte ?? []).join('+'), s.condition ?? ''].join('|');

/**
 * Pas de faux choix (Bryan, 27 octobre 2026) : quand une salle ouvre sur plusieurs chemins, ils ne se ressemblent jamais.
 * Un combat en double change d'ennemi (ou devient une cache s'il n'y a qu'un ennemi possible) ; deux rencontres, deux caches
 * ou deux autres salles sans combat : la seconde devient un combat. Le gardien et le campement ne bougent pas.
 */
function distinguerChemins(salles: Salle[], pool: string[], t: ReturnType<typeof tireur>) {
  for (let passe = 0; passe < 3; passe++) {
    let change = false;
    for (const s of salles) {
      const vus = new Map<string, Salle>();
      for (const id of s.voisins) {
        let v = salles[id]!;
        const deja = vus.get(signatureSalle(v));
        if (!deja) { vus.set(signatureSalle(v), v); continue; }
        // le campement garanti (avant le gardien) et le fond de la carte ne changent jamais : on change l'autre salle
        const garde = (x: Salle) => x.type === 'gardien' || x.type === 'filon' || (x.type === 'camp' && x.col === 0);
        if (garde(v)) { if (garde(deja)) continue; vus.set(signatureSalle(v), v); v = deja; }
        change = true;
        if (v.type === 'combat' || v.type === 'elite') {
          const autres = pool.filter((e) => e !== v.ennemi);
          if (v.escorte?.length) delete v.escorte;
          else if (autres.length && v.type === 'combat') v.ennemi = autres[t.entier(autres.length)]!;
          else { v.type = 'cache'; delete v.ennemi; delete v.escorte; delete v.condition; }
        } else if (pool.length) {
          v.type = 'combat'; v.ennemi = pool[t.entier(pool.length)]!; delete v.rencontre;
        }
        vus.set(signatureSalle(v), v);
      }
    }
    if (!change) break;
  }
}

/** Une nouvelle expédition en exploration */
export function nouvelleExploration(opts: {
  porteurs: PorteurEtat[]; deck: GesteDef[]; strate: number; rng: number; garde?: string; facteur?: number; bonus?: BonusMarques;
  fouille?: CibleFouille;
}): Expedition {
  const carte = genererCarte(opts.strate, opts.rng, opts.garde, !!opts.fouille);
  const premier = carte.salles.find((s) => s.ennemi)!.ennemi!;
  // le combat n'existe qu'une fois une salle de combat ouverte : en attendant, un combat clôturé tient la place
  const attente = creerCombat({ porteurs: opts.porteurs, ennemiId: premier, rng: opts.rng, deck: opts.deck });
  attente.issue = 'victoire';
  return {
    strate: opts.strate, sequence: [], index: -1, porteurs: opts.porteurs, deck: opts.deck, combat: attente,
    butin: 0, terminee: false, cloture: true, carte, phase: 'carte', gagnes: 0, gains: gainsVides(),
    recit: opts.fouille
      ? `L’escouade descend fouiller ${ZONES[carte.zone]!.nom.toLowerCase()}. Pas de gardien cette fois : le filon est au fond.`
      : `L’escouade entre dans ${ZONES[carte.zone]!.nom.toLowerCase()}. Choisis ton chemin : le gardien attend tout au fond.`,
    ...(opts.fouille ? { fouille: opts.fouille } : {}),
    ...(opts.facteur && opts.facteur !== 1 ? { facteur: opts.facteur } : {}),
    ...(opts.bonus ? { bonus: opts.bonus } : {}),
  };
}

/**
 * Combats à plusieurs (décision du 22 octobre 2026) : à partir de la Strate −2, une salle de combat sur trois abrite un groupe
 * (deux ennemis, trois à partir de la Strate −5). Tirage à part, pour ne pas changer le reste de la carte.
 */
export function escorteDe(strate: number, rng: number, salleId: number, pool: string[]): string[] {
  if (strate < 2 || !pool.length) return [];
  const t = tireur({ rng: (rng ^ Math.imul(salleId + 1, 0x85ebca6b)) >>> 0 });
  if (t.nombre() >= (strate >= 5 ? 0.4 : 0.32)) return [];
  const n = strate >= 5 && t.nombre() < 0.4 ? 2 : 1;
  return Array.from({ length: n }, () => pool[t.entier(pool.length)]!);
}

/**
 * Conditions de salle (décision du 22 octobre 2026) : à partir de la Strate −2, environ une salle de combat sur trois
 * (une sur deux pour le gardien). Tirage à part, pour ne pas changer le reste de la carte.
 */
export function conditionDe(strate: number, rng: number, salleId: number, type: TypeSalle): string | null {
  if (strate < 2) return null;
  const t = tireur({ rng: (rng ^ Math.imul(salleId + 7, 0xc2b2ae35)) >>> 0 });
  if (t.nombre() >= (type === 'gardien' ? 0.5 : 0.33)) return null;
  const ids = Object.keys(CONDITIONS);
  return ids[t.entier(ids.length)]!;
}

/** Ouvre un combat dans la salle courante */
export function lancerCombat(x: Expedition, ennemi: string, renfort = 1, escorte?: string[], condition?: string): Expedition {
  const porteurs = x.porteurs.map((p) => ({ ...p, aTerre: p.pv <= 0 }));
  const sequence = [...x.sequence, ennemi];
  return {
    ...x, phase: 'combat', sequence, index: sequence.length - 1, cloture: false, porteurs,
    combat: creerCombat({ porteurs, ennemiId: ennemi, rng: x.combat.rng ^ (sequence.length * 0x9e3779b1), deck: x.deck,
      force: forceStrate(x.strate) * (x.facteur ?? 1) * renfort, bonus: x.bonus, ...(escorte?.length ? { escorte } : {}), ...(condition ? { condition } : {}),
      ...(x.strate < 2 ? { traits: false } : {}) }),
  };
}

/**
 * L'escouade avance dans une salle voisine. Combats, caches, campements et archives se règlent ici ;
 * une rencontre reste en attente d'une réponse (jeu.ts).
 */
export function entrerSalle(x: Expedition, id: number): { x: Expedition; ok: boolean; message?: string } {
  if (!x.carte || x.phase !== 'carte' || x.terminee) return { x, ok: false };
  if (x.rencontre) return { x, ok: false, message: 'Réponds d’abord à la rencontre.' };
  const ici = salleCourante(x);
  if (!ici.voisins.includes(id)) return { x, ok: false, message: 'Cette salle n’est pas accessible d’ici.' };
  const salles = x.carte.salles.map((s) => (s.id === id ? { ...s, faite: true } : s));
  const salle = salles[id]!;
  const etat = { rng: x.carte.rng };
  const t = tireur(etat);
  let y: Expedition = { ...x, carte: { ...x.carte, salles, position: id, rng: etat.rng } };
  const n = Math.round(8 * (1 + 0.25 * (x.strate - 1)));
  switch (salle.type) {
    case 'combat':
    case 'gardien':
      y = lancerCombat(y, salle.ennemi!, 1, salle.escorte, salle.condition);
      break;
    case 'elite':
      y = lancerCombat({ ...y, recit: 'Une salle scellée : son occupant est plus coriace, mais quelque chose de précieux dort derrière lui.' }, salle.ennemi!, 1.15, undefined, salle.condition);
      break;
    case 'cache': {
      const eclat = x.strate >= 3 && t.nombre() < 0.3;
      const gains = { ...(y.gains ?? gainsVides()), eclats: (y.gains?.eclats ?? 0) + (eclat ? 1 : 0) };
      y = { ...y, butin: y.butin + n, gains, recit: `Une cache de fouilleur, oubliée sous des gravats : +${n} composants${eclat ? ' et un Éclat' : ''}.` };
      break;
    }
    case 'camp': {
      const porteurs = y.porteurs.map((p) => ({ ...p, pv: Math.min(p.pvMax, Math.max(0, p.pv) + Math.round(p.pvMax * 0.35)), aTerre: false }));
      y = { ...y, porteurs, recit: 'Un campement de fouilleurs, encore tiède. L’escouade souffle (+35 % de PV). Tu peux remonter d’ici avec ce que tu as trouvé.' };
      break;
    }
    case 'archive': {
      const gains = { ...(y.gains ?? gainsVides()), fragment: true };
      y = { ...y, gains, butin: y.butin + Math.round(n / 2), recit: `Une salle d’archives : des papiers d’époque, rangés avec soin. Tu les rapporteras au district (+${Math.round(n / 2)} composants).` };
      break;
    }
    case 'rencontre':
      y = { ...y, rencontre: salle.rencontre!, recit: '' };
      break;
    case 'filon':
      // fin de la fouille : ce qu'on cherchait est là, l'escouade remonte avec
      y = { ...y, terminee: true, recit: 'Le filon est là, intact. L’escouade le dégage et remonte avec.' };
      break;
    default:
      break;
  }
  return { x: y, ok: true };
}
