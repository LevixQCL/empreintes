// Une expédition : l'escouade descend dans une Strate. Depuis le 22 octobre 2026, la Strate est une carte à explorer
// salle par salle (combats, salles scellées, caches, rencontres, campements, archives, puis le gardien).
// L'ancien mode linéaire (trois combats d'affilée) reste pour la chambre scellée et le robot d'équilibrage.

import { coupDeFuite, creerCombat } from './combat';
import { CONDITIONS, ZONES, ennemiDef, porteurDef, sequenceStrate, zoneDe } from './donnees';
import { tireur } from './rng';
import { REGLES, analyserChaine } from './regles';
import { CONTENU, SECRETS, nombreHaltes, particularite } from './strates';
import { EXPLORER, STRATE_RODEUR, rodeurDef } from './explorer';
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
  /** un combat de la Flèche (fleche.ts) : les gardiens d'un quai */
  fleche?: import('./partie/fleche').AscensionEnCours;
  epreuve?: string;
  /** l'Épreuve est tentée au palier Fêlé (plus fort, mieux récompensé) */
  felee?: boolean;
  /** les règles de combat de l'Épreuve, gardées pour chaque combat de l'enchaînement */
  regles?: { sansResonance?: boolean; chrono?: number; sansChute?: boolean; monoLignee?: boolean };
  /** puissance des ennemis fixée par l'Épreuve (sinon celle de la Strate) */
  forceFixe?: number;
  /** part des PV rendue entre deux combats d'un enchaînement (sinon REGLES.soinEntreCombats) */
  soinEntre?: number;
  /** l'escouade est partie avec la moitié de ses PV (« À mi-souffle ») : rendue au retour, pour ne pas compter comme de l'Usure */
  demiPv?: boolean;
  /** « Les recrues » : escouade imposée, pas d'Usure au retour */
  imposee?: boolean;
  // ---------- le contenu des Strates (31 octobre 2026, strates.ts) ----------
  /** la Halte de cette descente : son numéro dans la Strate, ou « connu » quand toutes ont été vues */
  halte?: number | 'connu';
  /** l'escouade est dans la Halte et doit choisir */
  enHalte?: boolean;
  /** une porte à Fréquence est ouverte devant l'escouade : les cartes tirées (rangs dans le deck) et la relance déjà prise */
  porte?: { main: number[]; relance: boolean };
  /** la lampe à algues : les salles jusqu'à cette rangée sont éclairées */
  lumiere?: number;
  /** le fil de la Strate −9 a déjà servi */
  filPris?: boolean;
  /** le passage secret de la carte a été suivi */
  secretVu?: boolean;
  // ---------- Explorer ou fouiller (31 octobre 2026, explorer.ts) ----------
  /** le gardien d'une Strate déjà vaincue s'est éveillé : plus fort, plus généreux */
  eveille?: boolean;
  /** la Strate est relevée (ses 5 Vestiges) : une fouille y voit tout le plan */
  releve?: boolean;
  /** un Porteur est tombé pendant la descente (étoile 2), l'escouade est entrée dans un campement (étoile 3) */
  chute?: boolean;
  campe?: boolean;
  /** le Vestige que rend le passage secret, s'il est suivi */
  vestigeSecret?: string;
  /** le Rôdeur de la carte, et la part de vie qu'il lui reste en arrivant */
  rodeur?: { id: string; part: number };
}

/** Ce que cherche une fouille ciblée : les cartes d'une lignée, des composants ou des Éclats */
export type CibleFouille = 'tech' | 'bio' | 'reso' | 'composants' | 'eclats';

interface Gains {
  /** salles scellées vaincues : une carte garantie chacune */
  elites: number;
  /** cartes offertes en route (rencontres) */
  cartes: number;
  eclats: number;
  /** une archive trouvée sur place (au plus une par descente, toutes sources confondues : archives, passage) */
  fragment: boolean;
  /** Haltes vues pour la première fois (XP d'une salle scellée chacune) */
  haltes?: number;
  /** l'étape de la quête de la Strate a été trouvée */
  etape?: boolean;
  /** portes à Fréquence ouvertes, passages suivis */
  portes?: number;
  /** les Vestiges ramassés (explorer.ts) */
  vestiges?: string[];
  /** le Rôdeur affronté : la part de vie qu'il garde en s'enfuyant (0 : abattu) */
  rodeur?: { id: string; part: number };
}

export type TypeSalle = 'entree' | 'combat' | 'elite' | 'cache' | 'rencontre' | 'camp' | 'archive' | 'gardien' | 'filon' | 'halte' | 'porte';
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
  /** −2 : une cache murée (un Augmenté la force et y trouve le double) */
  mur?: boolean;
  /** −7 : le second occupant possible de la salle (on choisit lequel affronter) */
  double?: string;
  /** −9 : la salle de la même rangée que relie un fil */
  fil?: number;
  /** la marque ✦ de la quête de la Strate */
  quete?: boolean;
  /** un passage secret (SECRETS), que seuls certains Porteurs repèrent */
  secret?: string;
  /** un Vestige (explorer.ts), ramassé en entrant, en gagnant le combat ou en ouvrant la porte */
  vestige?: string;
  /** la salle du Rôdeur de la zone (son ennemi est le Rôdeur) */
  rodeur?: string;
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
  // −15 % dans la Strate −1 (27 octobre 2026, Bryan : trop dure pour un nouveau joueur) : Pilleur 70 → 60 PV, Vigie 95 → 81, Confluence 165 → 140.
  table: [0.85, 1.39, 1.818, 2.139, 2.46, 2.781, 2.888, 3.016, 3.102, 3.262, 3.475, 3.743, 3.936, 4.064] as number[],
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
export const butinCombat = (strate: number, index: number) => Math.round((index === 2 ? 14 : REGLES.salles.combat) * (1 + 0.25 * (strate - 1)));
/** Composants d'une cache, et d'une salle d'archives */
export const butinCache = (strate: number) => Math.round(REGLES.salles.cache * (1 + 0.25 * (strate - 1)));
export const butinArchive = (strate: number) => Math.round(REGLES.salles.archive * (1 + 0.25 * (strate - 1)));

export function nouvelleExpedition(opts: {
  porteurs: PorteurEtat[]; deck: GesteDef[]; strate: number; rng: number;
  sequence?: string[]; force?: number; tutoriel?: boolean; facteur?: number; bonus?: BonusMarques;
  /** ce que l'Épreuve change au premier combat (escorte, condition, 3ᵉ phase, règles) */
  combat?: { escorte?: string[]; condition?: string; troisiemePhase?: boolean; traitsEnnemis?: false; assimilation?: false; epreuve?: Expedition['regles'] };
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
      ...mecaniques(opts.strate), ...(opts.combat ?? {}),
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
      let gains: Gains = { ...(x.gains ?? gainsVides()), elites: (x.gains?.elites ?? 0) + (salle.type === 'elite' ? 1 : 0), ...(salle.quete ? { etape: true } : {}) };
      if (salle.vestige) gains = ramasser(gains, salle.vestige);
      // le Rôdeur : enfui, il garde la part de vie qui lui reste ; abattu, il compte comme une salle scellée
      if (salle.rodeur) {
        const part = x.combat.enfui ? Math.max(0.01, x.combat.ennemi.pv / x.combat.ennemi.pvMax) : 0;
        gains = { ...gains, rodeur: { id: salle.rodeur, part }, ...(part ? {} : { elites: gains.elites + 1 }) };
      }
      const chute = x.chute || x.combat.porteurs.some((p) => p.pv <= 0 || p.aTerre);
      return { ...x, butin: x.butin + gain, terminee: fin, cloture: true, gagnes: (x.gagnes ?? 0) + 1, gains, porteurs: x.combat.porteurs.map((p) => ({ ...p })), ...(chute ? { chute: true } : {}) };
    }
    if (x.combat.issue === 'defaite') return { ...x, terminee: true, cloture: true, chute: true };
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
    pv: Math.min(p.pvMax, Math.max(p.pv, 0) + Math.round(p.pvMax * (x.soinEntre ?? REGLES.soinEntreCombats))),
    aTerre: false,
  }));
  const index = x.index + 1;
  return {
    ...x,
    index,
    porteurs,
    cloture: false,
    combat: creerCombat({ porteurs, ennemiId: x.sequence[index]!, rng: x.combat.rng, deck: x.deck, force: x.forceFixe ?? forceStrate(x.strate) * (x.facteur ?? 1), bonus: x.bonus, ...mecaniques(x.strate), ...(x.regles ? { epreuve: x.regles } : {}) }),
  };
}

// ---------- L'exploration ----------

const gainsVides = (): Gains => ({ elites: 0, cartes: 0, eclats: 0, fragment: false });
/** Un Vestige ramassé (une seule fois par descente) */
const ramasser = (g: Gains | undefined, id: string): Gains => {
  const b = g ?? gainsVides();
  return b.vestiges?.includes(id) ? b : { ...b, vestiges: [...(b.vestiges ?? []), id] };
};
export const salleCourante = (x: Expedition): Salle => x.carte!.salles[x.carte!.position]!;
/** Les salles où l'escouade peut aller : les voisines de la salle où elle se trouve */
export const accessibles = (x: Expedition): Salle[] => {
  if (!x.carte) return [];
  const ici = salleCourante(x);
  const l = ici.voisins.map((id) => x.carte!.salles[id]!);
  // −9 : un fil relie la salle à sa voisine de rangée ; on le suit une fois
  if (ici.fil !== undefined && !x.filPris && !x.carte.salles[ici.fil]!.faite) l.push(x.carte.salles[ici.fil]!);
  return l;
};
/** La salle d'où vient l'escouade : sur la rangée d'avant, déjà visitée, et reliée à la salle courante */
export function sallePrecedente(x: Expedition): Salle | undefined {
  if (!x.carte) return undefined;
  const ici = salleCourante(x);
  return x.carte.salles.find((s) => s.rang === ici.rang - 1 && s.faite && s.voisins.includes(ici.id))
    ?? (ici.fil !== undefined && x.filPris && x.carte.salles[ici.fil]!.faite ? x.carte.salles[ici.fil] : undefined);
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

// ---------- Le brouillard (30 octobre 2026) ----------

/** Ce qu'on voit d'une salle : tout, un simple indice, ou rien (la brume) */
export type Vision = 'claire' | 'indice' | 'brume';
/** Les indices : volontairement ambigus (une lueur peut être une cache, une salle scellée… ou un ennemi Résonant) */
export type Indice = 'bruits' | 'lueur' | 'silence' | 'traces' | 'chaleur';
export const INDICES: Record<Indice, { nom: string; texte: string }> = {
  bruits: { nom: 'Des bruits', texte: 'Des pas, un grattement, quelque chose qui respire derrière la paroi.' },
  lueur: { nom: 'Une lueur', texte: 'Une lueur bleutée au bout du couloir. Quelque chose de précieux… ou quelqu’un qui résonne.' },
  silence: { nom: 'Le silence', texte: 'Rien ne bouge. De la poussière, des gravats : une salle oubliée.' },
  traces: { nom: 'Des traces', texte: 'Des traces fraîches dans la poussière. Quelqu’un est passé il y a peu.' },
  chaleur: { nom: 'De la chaleur', texte: 'Une odeur de feu éteint, un air plus doux. Des fouilleurs ont fait halte ici.' },
};

/** L'indice que laisse deviner une salle (toujours le même pour une même salle) */
export function indiceSalle(s: Salle): Indice {
  switch (s.type) {
    case 'camp': return 'chaleur';
    case 'rencontre': return 'traces';
    case 'archive': return 'silence';
    case 'porte': return 'lueur';
    case 'cache': return s.id % 2 ? 'silence' : 'lueur';
    case 'elite': return 'lueur';
    default: return s.ennemi && !s.escorte?.length && ennemiDef(s.ennemi).lignee === 'reso' ? 'lueur' : 'bruits';
  }
}

/** Ce que l'escouade voit d'une salle du plan, d'après la Strate, sa position et la présence d'un Résonant debout */
export function visionSalle(x: Expedition, s: Salle): Vision {
  if (!x.carte) return 'claire';
  const ici = salleCourante(x);
  if (s.faite || s.id === ici.id || s.type === 'gardien' || s.type === 'filon' || s.type === 'entree' || s.type === 'halte') return 'claire';
  // une Strate relevée (ses 5 Vestiges) : ses fouilles voient tout le plan
  if (x.releve) return 'claire';
  // −7 : une salle à deux souvenirs se montre telle qu'elle est quand on arrive devant (le choix se fait en connaissance de cause)
  if (s.double && ici.voisins.includes(s.id)) return 'claire';
  // la lampe à algues (strates.ts) éclaire les rangées devant elle
  if (x.lumiere !== undefined && s.rang <= x.lumiere && s.rang >= ici.rang) return 'claire';
  const proche: Vision = x.strate >= REGLES.brouillard.indices ? 'indice' : 'claire';
  // une salle déjà passée : on l'a vue comme voisine d'une salle visitée, ou jamais
  if (s.rang <= ici.rang) return x.carte.salles.some((v) => v.faite && v.voisins.includes(s.id)) ? proche : 'brume';
  if (ici.voisins.includes(s.id)) return proche;
  // −3, le noir complet (strates.ts) : même un Résonant n'y sent rien au-delà des salles voisines
  const resonant = x.strate !== 3 && x.porteurs.some((p) => p.pv > 0 && porteurDef(p.id).lignee === 'reso');
  const portee = 1 + (x.strate <= REGLES.brouillard.loin ? 1 : 0) + (resonant ? 1 : 0);
  return s.rang - ici.rang <= portee ? 'indice' : 'brume';
}

/** Ce qu'un joueur croit trouver dans une salle d'après ce qu'il en voit (pour les robots, qui ne trichent pas) */
export function typeApparent(x: Expedition, s: Salle): TypeSalle {
  const v = visionSalle(x, s);
  if (v === 'claire') return s.type;
  if (v === 'brume') return 'combat';
  return ({ chaleur: 'camp', traces: 'rencontre', silence: 'cache', lueur: 'cache', bruits: 'combat' } as const)[indiceSalle(s)];
}

/** Ce qui retient l'escouade sur place : une rencontre, la Halte, ou une porte à Fréquence (on ne repart qu'après avoir choisi) */
export const enAttente = (x: Expedition) => !!x.rencontre || !!x.enHalte || !!x.porte;

/** On ne peut remonter de soi-même qu'à l'entrée ou depuis un campement */
export const peutRemonter = (x: Expedition) => !!x.carte && x.phase === 'carte' && !enAttente(x) && ['entree', 'camp'].includes(salleCourante(x).type);

// plus de combats par descente (22 octobre 2026, Bryan voulait l'esprit Baten Kaitos) : ~6 au lieu de ~4, avec les 9 rangées
const POIDS: [TypeSalle, number][] = [['combat', 58], ['cache', 10], ['rencontre', 13], ['elite', 9], ['camp', 5], ['archive', 5]];
/** La particularité d'une Strate change ses poids (strates.ts) : −4 deux fois plus de salles scellées, −6 plus d'archives */
function poidsDe(strate: number): [TypeSalle, number][] {
  if (strate === 4) return POIDS.map(([t, p]) => [t, t === 'elite' ? 18 : t === 'combat' ? 49 : p]);
  if (strate === 6) return POIDS.map(([t, p]) => [t, t === 'archive' ? 10 : t === 'rencontre' ? 8 : p]);
  return POIDS;
}
/** La rangée de la Halte (31 octobre 2026) : une seule salle, au milieu de la carte ; la carte a alors 10 rangées */
export const RANG_HALTE = 5;

/** Rangées d'une carte de Strate : 9 pour une expédition (7 jusqu'au 22 octobre 2026), 10 avec une Halte, 4 pour une fouille ciblée */
const RANGS_EXPEDITION = 9;
const RANGS_FOUILLE = 4;
/** Nombre de rangées d'une carte */
export const rangsDe = (c: CarteStrate) => Math.max(...c.salles.map((s) => s.rang)) + 1;

/**
 * Une carte de Strate : l'entrée en haut, 2 ou 3 salles par rangée, et tout en bas le gardien
 * (ou, pour une fouille ciblée, le filon : une carte plus courte, sans gardien ni salle scellée).
 */
export function genererCarte(strate: number, rng: number, garde?: string, fouille = false, contenu: { halte?: boolean; quete?: boolean; vestiges?: string[]; rodeur?: string } = {}): CarteStrate {
  const etat = { rng: (rng ^ 0x27d4eb2f) >>> 0 };
  const t = tireur(etat);
  const z = zoneDe(strate);
  const zone = ZONES.indexOf(z);
  const suivante = ZONES[Math.min(zone + 1, ZONES.length - 1)]!;
  const pool = garde === 'orseve' ? z.ennemis.filter((id) => id !== 'brigadier') : z.ennemis;
  const salles: Salle[] = [];
  const rangs: number[][] = [];
  const halte = !fouille && !!contenu.halte;
  const RANGS = fouille ? RANGS_FOUILLE : RANGS_EXPEDITION + (halte ? 1 : 0);
  const poids = poidsDe(strate);
  for (let r = 0; r < RANGS; r++) {
    const seule = r === 0 || r === RANGS - 1 || (halte && r === RANG_HALTE);
    const n = seule ? 1 : 2 + t.entier(2);
    const ids: number[] = [];
    for (let c = 0; c < n; c++) {
      let type: TypeSalle;
      if (r === 0) type = 'entree';
      else if (r === RANGS - 1) type = fouille ? 'filon' : 'gardien';
      else if (halte && r === RANG_HALTE) type = 'halte';
      else if (r === 1) type = 'combat';
      else if (r === RANGS - 2 && c === 0) type = 'camp';
      else {
        let v = t.nombre() * 100;
        type = 'combat';
        for (const [ty, p] of poids) { if (v < p) { type = ty; break; } v -= p; }
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
  particularites(salles, strate, rng, pool, fouille, !!contenu.quete);
  if (!fouille) explorer(salles, rng, contenu.vestiges ?? [], contenu.rodeur);
  return { zone, salles, position: 0, rng: etat.rng };
}

/** Les salles qu'on peut atteindre depuis une salle (elle comprise), en descendant */
function descendants(salles: Salle[], id: number): Set<number> {
  const vus = new Set<number>([id]);
  const pile = [id];
  while (pile.length) for (const v of salles[pile.pop()!]!.voisins) if (!vus.has(v)) { vus.add(v); pile.push(v); }
  return vus;
}
/** Deux salles sur un même chemin (l'une mène à l'autre) */
const memeChemin = (salles: Salle[], a: Salle, b: Salle) => (a.rang < b.rang ? descendants(salles, a.id).has(b.id) : descendants(salles, b.id).has(a.id));

/**
 * Explorer (31 octobre 2026, explorer.ts), tirage à part posé après tout le reste : la salle du Rôdeur, puis les Vestiges.
 * Les Vestiges vont sur des rangées différentes ; le deuxième est sur un même chemin que le premier (revue du game designer :
 * un chemin doit pouvoir en ramasser deux), le troisième n'importe où. Le premier préfère une salle scellée ou une porte.
 */
function explorer(salles: Salle[], rng: number, vestiges: readonly string[], rodeur?: string) {
  const t = tireur({ rng: (rng ^ 0x5f356495) >>> 0 });
  const fond = Math.max(...salles.map((s) => s.rang));
  const libre = (s: Salle) => s.rang > 0 && s.rang < fond && s.type !== 'halte' && !(s.type === 'camp' && s.rang === fond - 1 && s.col === 0) && !s.quete && !s.secret && !s.rodeur && !s.vestige;
  const prendre = (l: Salle[]) => (l.length ? l[t.entier(l.length)]! : undefined);
  if (rodeur) {
    const c = prendre(salles.filter((s) => libre(s) && s.type === 'combat' && s.rang >= 2 && s.rang <= fond - 2));
    if (c) { c.rodeur = rodeur; c.ennemi = rodeur; delete c.escorte; delete c.condition; delete c.double; }
  }
  const poses: Salle[] = [];
  for (const v of vestiges) {
    const rangs = new Set(poses.map((p) => p.rang));
    let l = salles.filter((s) => libre(s) && !rangs.has(s.rang));
    if (poses.length === 1) { const lie = l.filter((s) => memeChemin(salles, poses[0]!, s)); if (lie.length) l = lie; }
    if (!poses.length) { const rare = l.filter((s) => s.type === 'elite' || s.type === 'porte'); if (rare.length) l = rare; }
    const c = prendre(l);
    if (!c) break;
    c.vestige = v;
    poses.push(c);
  }
}

/**
 * Le contenu des Strates (31 octobre 2026, strates.ts), posé après le reste avec un tirage à part : la particularité de la Strate,
 * la marque de sa quête, son passage secret et ses portes à Fréquence. Aucune salle n'est ajoutée : on change celles qui existent.
 */
function particularites(salles: Salle[], strate: number, rng: number, pool: string[], fouille: boolean, quete: boolean) {
  const t = tireur({ rng: (rng ^ 0x1b873593) >>> 0 });
  const fond = Math.max(...salles.map((s) => s.rang));
  /** les salles du milieu, qu'on peut changer : ni l'entrée, ni le fond, ni la Halte, ni le campement garanti */
  const milieu = salles.filter((s) => s.rang > 0 && s.rang < fond && s.type !== 'halte' && !(s.type === 'camp' && s.rang === fond - 1 && s.col === 0));
  const prendre = (l: Salle[]) => (l.length ? l[t.entier(l.length)]! : undefined);
  const caches = () => milieu.filter((s) => s.type === 'cache' && !s.mur);
  if (strate === 2) for (let k = 0; k < CONTENU.murs; k++) { const c = prendre(caches()); if (c) c.mur = true; }
  if (strate === 7) {
    for (let k = 0; k < CONTENU.doubles; k++) {
      const c = prendre(milieu.filter((s) => s.type === 'combat' && !s.escorte?.length && !s.double));
      const autres = pool.filter((e) => e !== c?.ennemi);
      if (c && autres.length) c.double = autres[t.entier(autres.length)]!;
    }
  }
  if (strate === 8 && !fouille && !milieu.some((s) => s.rencontre === 'veilleur')) {
    // un Veilleur égaré attend toujours sur le plan : une rencontre ou une cache, sinon un combat des premières rangées
    const c = prendre(milieu.filter((s) => s.type === 'rencontre')) ?? prendre(caches()) ?? prendre(milieu.filter((s) => s.type === 'combat' && s.rang <= 4));
    if (c) { c.type = 'rencontre'; c.rencontre = 'veilleur'; delete c.ennemi; delete c.escorte; delete c.condition; delete c.double; }
  }
  if (strate === 9) {
    const rangees = [...new Set(milieu.map((s) => s.rang))].filter((r) => milieu.filter((s) => s.rang === r).length >= 2);
    const r = rangees.length ? rangees[t.entier(rangees.length)]! : -1;
    const ligne = milieu.filter((s) => s.rang === r).sort((a, b) => a.col - b.col);
    if (ligne.length >= 2) {
      const k = t.entier(ligne.length - 1);
      ligne[k]!.fil = ligne[k + 1]!.id;
      ligne[k + 1]!.fil = ligne[k]!.id;
    }
  }
  // les portes à Fréquence : des caches deviennent des portes (toutes à −10, ou presque)
  if (strate >= CONTENU.porte.depuis) {
    for (const c of caches()) if (t.nombre() < (strate >= 10 ? 0.85 : CONTENU.porte.chance)) c.type = 'porte';
  }
  // le passage secret (à partir de −2) : une salle du milieu, ni Halte, ni porte
  if (strate >= 2 && t.nombre() < CONTENU.secret) {
    const c = prendre(milieu.filter((s) => s.type !== 'porte'));
    if (c) c.secret = SECRETS[t.entier(SECRETS.length)]!.id;
  }
  // la marque de la quête : une salle du milieu, n'importe laquelle
  if (quete) { const c = prendre(milieu); if (c) c.quete = true; }
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
  /** la Halte de cette descente (strates.ts) et la quête de la Strate encore à finir */
  halte?: number | 'connu'; quete?: boolean;
  /** Explorer (explorer.ts) : les Vestiges encore à trouver dans la Strate, son Rôdeur, le gardien éveillé, la Strate relevée */
  vestiges?: string[]; rodeur?: { id: string; part: number }; eveille?: boolean; releve?: boolean;
}): Expedition {
  // les Vestiges de la carte : 2 jusqu'à −5, 3 plus bas, tirés parmi ceux qui manquent ; le suivant attend derrière le passage secret
  const manque = opts.fouille ? [] : tireur({ rng: (opts.rng ^ 0x2545f491) >>> 0 }).melanger([...(opts.vestiges ?? [])]);
  const n = opts.strate <= 5 ? EXPLORER.vestiges.haut : EXPLORER.vestiges.bas;
  const rodeur = opts.fouille ? undefined : opts.rodeur;
  const carte = genererCarte(opts.strate, opts.rng, opts.garde, !!opts.fouille, { halte: !opts.fouille && opts.halte !== undefined, quete: !!opts.quete, vestiges: manque.slice(0, n), ...(rodeur ? { rodeur: rodeur.id } : {}) });
  const places = new Set(carte.salles.map((s) => s.vestige).filter(Boolean));
  const secret = manque.find((v) => !places.has(v));
  const traque = rodeur && carte.salles.some((s) => s.rodeur) ? rodeur : undefined;
  const premier = carte.salles.find((s) => s.ennemi)!.ennemi!;
  // le combat n'existe qu'une fois une salle de combat ouverte : en attendant, un combat clôturé tient la place
  const attente = creerCombat({ porteurs: opts.porteurs, ennemiId: premier, rng: opts.rng, deck: opts.deck });
  attente.issue = 'victoire';
  return {
    strate: opts.strate, sequence: [], index: -1, porteurs: opts.porteurs, deck: opts.deck, combat: attente,
    butin: 0, terminee: false, cloture: true, carte, phase: 'carte', gagnes: 0, gains: gainsVides(),
    recit: opts.fouille
      ? `L’escouade descend fouiller ${ZONES[carte.zone]!.nom.replace(/^L/, 'l')}. Pas de gardien cette fois : le filon est au fond.`
      : `L’escouade entre dans ${ZONES[carte.zone]!.nom.replace(/^L/, 'l')}. Choisis ton chemin : le gardien attend tout au fond.${particularite(opts.strate) ? ` ${particularite(opts.strate)!.nom}. ${particularite(opts.strate)!.texte}` : ''}${carte.salles.some((s) => s.quete) ? ` Une marque de quête ✦ brille quelque part sur le plan.` : ''}${places.size ? ` ${places.size > 1 ? `${places.size} Vestiges dorment` : 'Un Vestige dort'} sur le plan.` : ''}${traque ? ` ${rodeurDef(traque.id)!.traces}` : ''}`,
    ...(opts.fouille ? { fouille: opts.fouille } : {}),
    ...(opts.facteur && opts.facteur !== 1 ? { facteur: opts.facteur } : {}),
    ...(opts.bonus ? { bonus: opts.bonus } : {}),
    ...(!opts.fouille && opts.halte !== undefined ? { halte: opts.halte } : {}),
    ...(!opts.fouille && opts.eveille ? { eveille: true } : {}),
    ...(opts.fouille && opts.releve ? { releve: true } : {}),
    ...(secret ? { vestigeSecret: secret } : {}),
    ...(traque ? { rodeur: traque } : {}),
  };
}

/**
 * Combats à plusieurs (décision du 22 octobre 2026) : à partir de la Strate −2, une salle de combat sur trois abrite un groupe
 * (deux ennemis, trois à partir de la Strate −5). Tirage à part, pour ne pas changer le reste de la carte.
 */
export function escorteDe(strate: number, rng: number, salleId: number, pool: string[]): string[] {
  if (strate < REGLES.apparition.groupes || !pool.length) return [];
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
  if (strate < REGLES.apparition.conditions) return null;
  const t = tireur({ rng: (rng ^ Math.imul(salleId + 7, 0xc2b2ae35)) >>> 0 });
  if (t.nombre() >= (type === 'gardien' ? 0.5 : 0.33)) return null;
  const ids = Object.keys(CONDITIONS);
  return ids[t.entier(ids.length)]!;
}

/**
 * Les mécaniques de combat présentes à cette Strate (REGLES.apparition, 28 octobre 2026) : à la −1 les bases seules,
 * puis la Fêlure (et les phases des gardiens), puis les traits des ennemis, l'Assimilation (−6) et la 3ᵉ phase des gardiens (−7). Groupes et conditions se règlent au tirage de la salle.
 */
function mecaniques(strate: number): { traits?: false; traitsEnnemis?: false; assimilation?: false; troisiemePhase?: true } {
  if (strate < REGLES.apparition.felure) return { traits: false };
  if (strate < REGLES.apparition.traits) return { traitsEnnemis: false };
  // puis l'Assimilation, puis la 3ᵉ phase des gardiens (28 octobre 2026)
  return {
    ...(strate < REGLES.apparition.assimilation ? { assimilation: false as const } : {}),
    ...(strate >= REGLES.apparition.troisiemePhase ? { troisiemePhase: true as const } : {}),
  };
}

/** Ouvre un combat dans la salle courante */
export function lancerCombat(x: Expedition, ennemi: string, renfort = 1, escorte?: string[], condition?: string,
  opts: { fuyard?: { tours: number; part: number }; force?: number; troisiemePhase?: boolean } = {}): Expedition {
  const porteurs = x.porteurs.map((p) => ({ ...p, aTerre: p.pv <= 0 }));
  const sequence = [...x.sequence, ennemi];
  return {
    ...x, phase: 'combat', sequence, index: sequence.length - 1, cloture: false, porteurs,
    combat: creerCombat({ porteurs, ennemiId: ennemi, rng: x.combat.rng ^ (sequence.length * 0x9e3779b1), deck: x.deck,
      force: (opts.force ?? forceStrate(x.strate)) * (x.facteur ?? 1) * renfort, bonus: x.bonus, ...(escorte?.length ? { escorte } : {}), ...(condition ? { condition } : {}),
      ...mecaniques(x.strate), ...(opts.troisiemePhase ? { troisiemePhase: true } : {}), ...(opts.fuyard ? { fuyard: opts.fuyard } : {}) }),
  };
}

/**
 * L'escouade avance dans une salle voisine. Combats, caches, campements et archives se règlent ici ;
 * une rencontre reste en attente d'une réponse (jeu.ts).
 */
export function entrerSalle(x: Expedition, id: number, second = false): { x: Expedition; ok: boolean; message?: string } {
  if (!x.carte || x.phase !== 'carte' || x.terminee) return { x, ok: false };
  if (x.rencontre) return { x, ok: false, message: 'Réponds d’abord à la rencontre.' };
  if (x.enHalte) return { x, ok: false, message: 'Fais d’abord ton choix à la Halte.' };
  if (x.porte) return { x, ok: false, message: 'Ouvre la porte, ou passe ton chemin.' };
  const ici = salleCourante(x);
  const parFil = ici.fil === id && !x.filPris;
  if (!ici.voisins.includes(id) && !parFil) return { x, ok: false, message: 'Cette salle n’est pas accessible d’ici.' };
  // −7 : la salle à deux occupants ; on affronte le second si on l'a choisi (il devient l'occupant de la salle)
  const choisi = (s: Salle): Salle => (second && s.double ? { ...s, ennemi: s.double, double: s.ennemi } : s);
  const salles = x.carte.salles.map((s) => (s.id === id ? { ...choisi(s), faite: true } : s));
  const salle = salles[id]!;
  const etat = { rng: x.carte.rng };
  const t = tireur(etat);
  let y: Expedition = { ...x, carte: { ...x.carte, salles, position: id, rng: etat.rng }, ...(parFil ? { filPris: true } : {}) };
  // la marque de la quête : trouvée en entrant, sauf dans un combat (il faut d'abord le gagner : cloturerCombat)
  if (salle.quete && !salle.ennemi) y.gains = { ...(y.gains ?? gainsVides()), etape: true };
  // un Vestige : ramassé en entrant, sauf derrière un combat (il faut le gagner) ou une porte (il faut l'ouvrir)
  if (salle.vestige && !salle.ennemi && salle.type !== 'porte') y.gains = ramasser(y.gains, salle.vestige);
  const avant = parFil ? 'L’escouade suit le fil d’une salle à l’autre. ' : '';
  switch (salle.type) {
    case 'combat':
      if (salle.rodeur && x.rodeur) {
        // le Rôdeur : la force de la Strate la plus profonde de sa zone, sa vie d'avant, et il fuit au bout de quelques tours
        const def = rodeurDef(salle.rodeur)!;
        y = lancerCombat({ ...y, recit: def.traces }, salle.ennemi!, 1, undefined, undefined,
          { force: forceStrate(STRATE_RODEUR[def.zone]!), fuyard: { tours: EXPLORER.rodeur.tours, part: x.rodeur.part } });
      } else y = lancerCombat(y, salle.ennemi!, 1, salle.escorte, salle.condition);
      break;
    case 'gardien':
      y = x.eveille
        ? lancerCombat(y, salle.ennemi!, EXPLORER.eveille.force, salle.escorte, salle.condition, { troisiemePhase: true })
        : lancerCombat(y, salle.ennemi!, 1, salle.escorte, salle.condition);
      break;
    case 'halte':
      // la Halte : un choix à faire (descentes.ts, choisirHalte), ou un lieu déjà connu
      if (typeof x.halte === 'number') y = { ...y, enHalte: true, recit: '' };
      else y = { ...y, recit: 'Un lieu que l’escouade connaît, maintenant. Elle s’y arrête le temps de reprendre son souffle, puis repart.' };
      break;
    case 'porte': {
      // une porte à Fréquence : une main tirée parmi les cartes des Porteurs debout (ouvrirPorte, passerPorte)
      const main = mainPorte(y, t);
      y = main.length ? { ...y, porte: { main, relance: false }, recit: '' } : { ...y, recit: 'Une porte ancienne, gravée de Fréquences. Personne dans l’escouade ne tient debout pour l’accorder.' };
      break;
    }
    case 'elite':
      y = lancerCombat({ ...y, recit: 'Une salle scellée : son occupant est plus coriace, mais quelque chose de précieux dort derrière lui.' }, salle.ennemi!, 1.15, undefined, salle.condition);
      break;
    case 'cache': {
      // −2 : une cache murée, qu'un Augmenté debout force (le double) ; −5 : une niche, où dort parfois une carte (strates.ts)
      const force = salle.mur && y.porteurs.some((p) => p.pv > 0 && porteurDef(p.id).lignee === 'tech');
      const n = butinCache(x.strate) * (force ? 2 : 1);
      const niche = x.strate === 5;
      const carte = niche && t.nombre() < CONTENU.niche;
      const eclat = !niche && x.strate >= 3 && t.nombre() < 0.3;
      const gains = { ...(y.gains ?? gainsVides()), eclats: (y.gains?.eclats ?? 0) + (eclat ? 1 : 0), cartes: (y.gains?.cartes ?? 0) + (carte ? 1 : 0) };
      // la voie sûre panse un peu l'escouade (30 octobre 2026) : bandages et eau propre oubliés avec les composants
      const porteurs = y.porteurs.map((p) => (p.pv > 0 ? { ...p, pv: Math.min(p.pvMax, p.pv + Math.round(p.pvMax * REGLES.salles.cacheSoin)) } : p));
      const debut = salle.mur
        ? force ? 'Un abri muré en 2066. Ton Augmenté enfonce le parpaing d’un coup d’épaule : derrière, une réserve intacte'
          : 'Un abri muré en 2066. Sans Augmenté pour forcer le mur, l’escouade ne fouille que les gravats devant'
        : niche ? (carte ? 'Une niche du Treillis, oubliée par les Hauts : un cristal y dort encore. Il deviendra une carte au district' : 'Une niche du Treillis, vidée et scellée de cire blanche. Il reste ce que les préleveurs ont laissé tomber')
        : 'Une cache de fouilleur, oubliée sous des gravats';
      y = { ...y, porteurs, butin: y.butin + n, gains, recit: `${avant}${debut} : +${n} composants${eclat ? ', un Éclat' : ''} et de quoi panser l’escouade.` };
      break;
    }
    case 'camp': {
      const porteurs = y.porteurs.map((p) => ({ ...p, pv: Math.min(p.pvMax, Math.max(0, p.pv) + Math.round(p.pvMax * 0.35)), aTerre: false }));
      y = { ...y, porteurs, campe: true, recit: 'Un campement de fouilleurs, encore tiède. L’escouade souffle (+35 % de PV). Tu peux remonter d’ici avec ce que tu as trouvé.' };
      break;
    }
    case 'archive': {
      const gains = { ...(y.gains ?? gainsVides()), fragment: true };
      const n = butinArchive(x.strate);
      y = { ...y, gains, butin: y.butin + n, recit: `Une salle d’archives : des papiers d’époque, rangés avec soin. Tu les rapporteras au district (+${n} composants).` };
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


// ---------- Les portes à Fréquence (31 octobre 2026, strates.ts) ----------

/** La suite demandée par une porte : 3, et 4 au fond */
export const suitePorte = (strate: number) => (strate >= 10 ? CONTENU.porte.suiteFond : CONTENU.porte.suite);

/** Une main de 5 cartes tirée du deck, parmi celles des Porteurs debout (et les cartes du district) */
function mainPorte(x: Expedition, t: ReturnType<typeof tireur>): number[] {
  const debout = new Set(x.porteurs.filter((p) => p.pv > 0).map((p) => p.id));
  if (!debout.size) return [];
  const rangs = x.deck.map((g, i) => (!g.vide && (!g.porteur || debout.has(g.porteur)) ? i : -1)).filter((i) => i >= 0);
  return t.melanger(rangs).slice(0, CONTENU.porte.main);
}

/** Les cartes choisies font-elles une suite assez longue ? (chaque carte d'argent et plus essaie toutes ses Fréquences, dans tous les ordres) */
export function cartesAccordees(cartes: readonly GesteDef[], suite: number): boolean {
  if (cartes.length < suite) return false;
  const choix = (g: GesteDef) => (g.fs?.length ? g.fs : [g.f]);
  const essayer = (reste: GesteDef[], chaine: { f: number; effet?: GesteDef['effet'] }[]): boolean => {
    if (!reste.length) return analyserChaine(chaine).suite >= suite;
    return reste.some((g, i) => choix(g).some((f) => essayer([...reste.slice(0, i), ...reste.slice(i + 1)], [...chaine, { f, effet: g.effet }])));
  };
  return essayer([...cartes], []);
}

/** La main de la porte contient-elle une suite ? (pour l'aide de l'écran et les robots) */
export function mainAccordable(x: Expedition): number[] | null {
  if (!x.porte) return null;
  const n = suitePorte(x.strate);
  const main = x.porte.main;
  const combis = (k: number, de: number[]): number[][] => (k === 0 ? [[]] : de.flatMap((v, i) => combis(k - 1, de.slice(i + 1)).map((c) => [v, ...c])));
  return combis(n, main).find((c) => cartesAccordees(c.map((i) => x.deck[i]!), n)) ?? null;
}

/** Ouvrir la porte avec les cartes choisies (rangs dans le deck) : un Éclat (deux au fond) et des composants */
export function ouvrirPorte(x: Expedition, rangs: number[]): { x: Expedition; ok: boolean; message?: string } {
  if (!x.porte) return { x, ok: false, message: 'Aucune porte à ouvrir.' };
  const n = suitePorte(x.strate);
  if (rangs.length !== n || rangs.some((r) => !x.porte!.main.includes(r)) || new Set(rangs).size !== n) return { x, ok: false, message: `Choisis ${n} cartes de la main.` };
  if (!cartesAccordees(rangs.map((r) => x.deck[r]!), n)) return { x, ok: false, message: `Ces Fréquences ne se suivent pas : il faut une suite de ${n} (par exemple ${Array.from({ length: n }, (_, k) => k + 3).join(', ')}).` };
  const eclats = x.strate >= 10 ? CONTENU.porte.eclatsFond : CONTENU.porte.eclats;
  const plus = Math.round(butinCache(x.strate) * CONTENU.porte.composants);
  let gains: Gains = { ...(x.gains ?? gainsVides()), eclats: (x.gains?.eclats ?? 0) + eclats, portes: (x.gains?.portes ?? 0) + 1 };
  const vestige = x.carte ? salleCourante(x).vestige : undefined;
  if (vestige) gains = ramasser(gains, vestige);
  return { ok: true, x: { ...x, porte: undefined, gains, butin: x.butin + plus,
    recit: `Les Fréquences s’accordent. La porte tourne sur elle-même sans un bruit : derrière, ${eclats > 1 ? `${eclats} Éclats` : 'un Éclat'} et ${plus} composants, rangés là depuis toujours.` } };
}

/** Une seule relance par porte : une nouvelle main */
export function relancerPorte(x: Expedition): { x: Expedition; ok: boolean; message?: string } {
  if (!x.porte || x.porte.relance || !x.carte) return { x, ok: false, message: 'La porte ne se laisse essayer qu’une seconde fois.' };
  const etat = { rng: x.carte.rng };
  const main = mainPorte(x, tireur(etat));
  return { ok: true, x: { ...x, carte: { ...x.carte, rng: etat.rng }, porte: { main, relance: true } } };
}

/** Laisser la porte fermée : rien n'est perdu */
export function passerPorte(x: Expedition): { x: Expedition; ok: boolean } {
  if (!x.porte) return { x, ok: false };
  return { ok: true, x: { ...x, porte: undefined, recit: 'La porte reste fermée. Elle a attendu des siècles ; elle attendra bien encore.' } };
}

// ---------- Les passages secrets ----------

/** Les Porteurs debout qui repèrent le passage de la salle (aucun : on ne voit rien) */
export function reperentPassage(x: Expedition, s: Salle): string[] {
  const def = s.secret ? SECRETS.find((d) => d.id === s.secret) : undefined;
  if (!def || x.secretVu) return [];
  return x.porteurs.filter((p) => p.pv > 0 && def.voix[p.id]).map((p) => p.id);
}

/** Suivre le passage repéré dans la salle où se trouve l'escouade : la réplique du Porteur, ce qu'il y a derrière, des composants et une archive */
export function suivrePassage(x: Expedition): { x: Expedition; ok: boolean; message?: string; qui?: string } {
  if (!x.carte || x.phase !== 'carte' || enAttente(x)) return { x, ok: false };
  const ici = salleCourante(x);
  const qui = reperentPassage(x, ici)[0];
  const def = SECRETS.find((d) => d.id === ici.secret);
  if (!qui || !def) return { x, ok: false, message: 'Personne ne voit de passage ici.' };
  const plus = butinCache(x.strate);
  let gains: Gains = { ...(x.gains ?? gainsVides()), fragment: true, portes: (x.gains?.portes ?? 0) + 1 };
  // derrière le passage, un Vestige de plus quand il en manque encore (explorer.ts)
  if (x.vestigeSecret) gains = ramasser(gains, x.vestigeSecret);
  return { ok: true, qui, x: { ...x, secretVu: true, gains, butin: x.butin + plus,
    recit: `${def.derriere[Math.min(3, x.carte.zone)]} L’escouade en rapporte ${plus} composants et des papiers d’époque${x.vestigeSecret ? ', et un Vestige posé là, comme pour vous' : ''}.` } };
}

/** Les Haltes encore à voir dans une Strate (strates.ts) : la prochaine, ou « connu » */
export const halteSuivante = (strate: number, vues: number): number | 'connu' | undefined =>
  nombreHaltes(strate) ? (vues < nombreHaltes(strate) ? vues + 1 : 'connu') : undefined;
