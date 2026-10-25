// Ce que le district donne : kit des recrues, lectures et Ravitaillement, nouveautés, fouilles ciblées, Épreuves.
// Fonctions pures : le temps est toujours passé en paramètre (`now`, en ms).

import { MODULES, batimentDef, carteId, moduleDe, moduleDef, porteurDef, zoneDe } from '../donnees';
import { NOMS_RARETE, ajouterCarte, tirerChoix } from '../collection';
import { forceStrate, nouvelleExpedition, nouvelleExploration, type CibleFouille } from '../expedition';
import { graine, tireur } from '../rng';
import type { GesteDef, Lignee, PorteurEtat, Rarete, BonusMarques } from '../types';
import { ARCHIVE, DISTRICT, type Jeu, type Resultat, bonusEscouade, enMission, log, non, pvMaxCombat, semaineDe, typeDuJour } from './etat';
import { progresser, quotidienFait } from './district';
import { deckEscouade, porteursPresents } from './descentes';

// ---------- Kit de départ des recrues ----------

/** Trois cartes en fer par recrue, de sa lignée, différentes des cartes de départ des Porteurs nommés */
const KIT_RECRUES: Record<string, string[]> = {
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

interface Colis { composants: number; doublon: string | null; choix: boolean }

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
  const porteurs: PorteurEtat[] = escouade.map((id) => {
    const u = Math.floor(j.porteurs[id]!.usure);
    return { id, pv: pvMaxCombat(j, id), pvMax: pvMaxCombat(j, id), aTerre: false, ...(u > 0 ? { usure: u } : {}) };
  });
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

// ---------- Les fouilles ciblées ----------
// Quand on bloque devant une Strate : une descente courte (4 rangées, sans gardien ni salle scellée) dans une Strate déjà
// vaincue, vers un filon choisi. Les cartes trouvées en route sont de la lignée visée ; le filon donne ce qu'on cherchait.

/** composants du filon par combat gagné pendant la fouille, en Strate −1 (+25 % par Strate) */
export const FILON_COMPOSANTS = 8;

export const CIBLES_FOUILLE: Record<CibleFouille, { nom: string; texte: string }> = {
  tech: { nom: 'Cartes augmentées', texte: 'Les cartes trouvées sont des cartes d’Augmentés, et le filon en offre trois au choix.' },
  bio: { nom: 'Cartes génés', texte: 'Les cartes trouvées sont des cartes de Génés, et le filon en offre trois au choix.' },
  reso: { nom: 'Cartes résonantes', texte: 'Les cartes trouvées sont des cartes de Résonants, et le filon en offre trois au choix.' },
  composants: { nom: 'Composants', texte: 'Le filon rapporte des composants pour chaque combat gagné en route : plus le chemin est long, plus il donne.' },
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

// ---------- Les Épreuves de la semaine ----------
// Trois combats à règle spéciale, renouvelés chaque lundi, contre le gardien de la dernière Strate vaincue.
// La première victoire de chaque Épreuve dans la semaine donne une carte au choix, dont une en argent au moins.

interface EpreuveDef {
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
