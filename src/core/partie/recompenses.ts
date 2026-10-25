// Couche 4 — ce que le district donne : kit des recrues, lectures et Ravitaillement, nouveautés.
// Fonctions pures : le temps est toujours passé en paramètre (`now`, en ms).

import { batimentDef, porteurDef, MODULES, moduleDe, moduleDef, carteId } from '../donnees';
import type { Rarete } from '../types';
import { ajouterCarte, tirerChoix, NOMS_RARETE } from '../collection';
import { tireur } from '../rng';
import { ARCHIVE, DISTRICT, log, non, porteursPresents, type Jeu, type Resultat, typeDuJour } from './etat';
import { progresser, quotidienFait } from './district';

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
export const refus = (message: string) => ({ ok: false as const, message });

/** Au départ, ceux qui travaillaient quittent leur poste : il reste vacant jusqu'à ce qu'on y remette quelqu'un */
export function quitterPostes(j: Jeu, escouade: string[]): void {
  for (const id of escouade) {
    const b = j.porteurs[id]!.poste;
    if (!b) continue;
    j.porteurs[id]!.poste = null;
    log(j, b === 'noyau' ? `${porteurDef(id).nom} quitte l’entraînement pour descendre.` : `${porteurDef(id).nom} quitte son poste (${batimentDef(b).nom}) pour descendre.`);
  }
}

// ---------- Les fouilles ciblées ----------
// Quand on bloque devant une Strate : une descente courte (4 rangées, sans gardien ni salle scellée) dans une Strate déjà
// vaincue, vers un filon choisi. Les cartes trouvées en route sont de la lignée visée ; le filon donne ce qu'on cherchait.

// ---------- Les Épreuves de la semaine ----------
// Trois combats à règle spéciale, renouvelés chaque lundi, contre le gardien de la dernière Strate vaincue.
// La première victoire de chaque Épreuve dans la semaine donne une carte au choix, dont une en argent au moins.

/** Appelé quand le combat en cours vient de se terminer */
