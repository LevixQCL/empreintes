// Une expédition : l'escouade descend dans une Strate. Depuis le 22 octobre 2026, la Strate est une carte à explorer
// salle par salle (combats, salles scellées, caches, rencontres, campements, archives, puis le gardien).
// L'ancien mode linéaire (trois combats d'affilée) reste pour la chambre scellée et le robot d'équilibrage.

import { creerCombat } from './combat';
import { ZONES, sequenceStrate, zoneDe } from './donnees';
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
}

export interface Gains {
  /** salles scellées vaincues : une carte garantie chacune */
  elites: number;
  /** cartes offertes en route (rencontres) */
  cartes: number;
  eclats: number;
  /** une archive trouvée sur place */
  fragment: boolean;
}

export type TypeSalle = 'entree' | 'combat' | 'elite' | 'cache' | 'rencontre' | 'camp' | 'archive' | 'gardien';
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
  rencontre?: string;
  faite: boolean;
}
export interface CarteStrate {
  zone: number;
  salles: Salle[];
  position: number;
  /** hasard des salles (déterministe, sauvegardé) */
  rng: number;
}

/** Les rencontres possibles en route ; leurs choix sont dans jeu.ts (elles touchent au district) */
export const RENCONTRES_IDS = ['veilleur', 'pilleur', 'brigade', 'cristal', 'marchand', 'source'] as const;

/** Puissance des ennemis selon la profondeur */
export const forceStrate = (strate: number) => 1 + 0.15 * (strate - 1);
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
    combat: creerCombat({ porteurs, ennemiId: x.sequence[index]!, rng: x.combat.rng, deck: x.deck, force: forceStrate(x.strate) * (x.facteur ?? 1), bonus: x.bonus }),
  };
}

// ---------- L'exploration ----------

const gainsVides = (): Gains => ({ elites: 0, cartes: 0, eclats: 0, fragment: false });
export const salleCourante = (x: Expedition): Salle => x.carte!.salles[x.carte!.position]!;
/** Les salles où l'escouade peut aller : les voisines de la salle où elle se trouve */
export const accessibles = (x: Expedition): Salle[] => (x.carte ? salleCourante(x).voisins.map((id) => x.carte!.salles[id]!) : []);
/** On ne peut remonter de soi-même qu'à l'entrée ou depuis un campement */
export const peutRemonter = (x: Expedition) => !!x.carte && x.phase === 'carte' && !x.rencontre && ['entree', 'camp'].includes(salleCourante(x).type);

const POIDS: [TypeSalle, number][] = [['combat', 46], ['cache', 14], ['rencontre', 16], ['elite', 9], ['camp', 8], ['archive', 7]];

/** Une carte de Strate : 7 rangées, l'entrée en haut, le gardien tout en bas, 2 ou 3 salles par rangée */
export function genererCarte(strate: number, rng: number, garde?: string): CarteStrate {
  const etat = { rng: (rng ^ 0x27d4eb2f) >>> 0 };
  const t = tireur(etat);
  const z = zoneDe(strate);
  const zone = ZONES.indexOf(z);
  const suivante = ZONES[Math.min(zone + 1, ZONES.length - 1)]!;
  const pool = garde === 'orseve' ? z.ennemis.filter((id) => id !== 'brigadier') : z.ennemis;
  const salles: Salle[] = [];
  const rangs: number[][] = [];
  const RANGS = 7;
  for (let r = 0; r < RANGS; r++) {
    const n = r === 0 || r === RANGS - 1 ? 1 : 2 + t.entier(2);
    const ids: number[] = [];
    for (let c = 0; c < n; c++) {
      let type: TypeSalle;
      if (r === 0) type = 'entree';
      else if (r === RANGS - 1) type = 'gardien';
      else if (r === 1) type = 'combat';
      else if (r === RANGS - 2 && c === 0) type = 'camp';
      else {
        let v = t.nombre() * 100;
        type = 'combat';
        for (const [ty, p] of POIDS) { if (v < p) { type = ty; break; } v -= p; }
      }
      const salle: Salle = { id: salles.length, rang: r, col: c, nCol: n, type, voisins: [], faite: r === 0 };
      if (type === 'combat') salle.ennemi = pool[t.entier(pool.length)]!;
      if (type === 'elite') salle.ennemi = suivante.ennemis[t.entier(suivante.ennemis.length)]!;
      if (type === 'gardien') salle.ennemi = z.boss;
      if (type === 'rencontre') salle.rencontre = RENCONTRES_IDS[t.entier(RENCONTRES_IDS.length)]!;
      if (garde === 'district' && type === 'combat' && z.ennemis.includes('brigadier') && t.nombre() < 0.35) salle.ennemi = 'brigadier';
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
  return { zone, salles, position: 0, rng: etat.rng };
}

/** Une nouvelle expédition en exploration */
export function nouvelleExploration(opts: {
  porteurs: PorteurEtat[]; deck: GesteDef[]; strate: number; rng: number; garde?: string; facteur?: number; bonus?: BonusMarques;
}): Expedition {
  const carte = genererCarte(opts.strate, opts.rng, opts.garde);
  const premier = carte.salles.find((s) => s.ennemi)!.ennemi!;
  // le combat n'existe qu'une fois une salle de combat ouverte : en attendant, un combat clôturé tient la place
  const attente = creerCombat({ porteurs: opts.porteurs, ennemiId: premier, rng: opts.rng, deck: opts.deck });
  attente.issue = 'victoire';
  return {
    strate: opts.strate, sequence: [], index: -1, porteurs: opts.porteurs, deck: opts.deck, combat: attente,
    butin: 0, terminee: false, cloture: true, carte, phase: 'carte', gagnes: 0, gains: gainsVides(),
    recit: `L’escouade entre dans ${ZONES[carte.zone]!.nom.toLowerCase()}. Choisis ton chemin : le gardien attend tout au fond.`,
    ...(opts.facteur && opts.facteur !== 1 ? { facteur: opts.facteur } : {}),
    ...(opts.bonus ? { bonus: opts.bonus } : {}),
  };
}

/** Ouvre un combat dans la salle courante */
export function lancerCombat(x: Expedition, ennemi: string, renfort = 1): Expedition {
  const porteurs = x.porteurs.map((p) => ({ ...p, aTerre: p.pv <= 0 }));
  const sequence = [...x.sequence, ennemi];
  return {
    ...x, phase: 'combat', sequence, index: sequence.length - 1, cloture: false, porteurs,
    combat: creerCombat({ porteurs, ennemiId: ennemi, rng: x.combat.rng ^ (sequence.length * 0x9e3779b1), deck: x.deck,
      force: forceStrate(x.strate) * (x.facteur ?? 1) * renfort, bonus: x.bonus }),
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
      y = lancerCombat(y, salle.ennemi!);
      break;
    case 'elite':
      y = lancerCombat({ ...y, recit: 'Une salle scellée : son occupant est plus coriace, mais quelque chose de précieux dort derrière lui.' }, salle.ennemi!, 1.15);
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
    default:
      break;
  }
  return { x: y, ok: true };
}
