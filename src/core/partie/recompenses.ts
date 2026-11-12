// Couche 4 — ce que le district donne : kit des recrues, lectures et Ravitaillement, nouveautés.
// Fonctions pures : le temps est toujours passé en paramètre (`now`, en ms).

import { batimentDef, porteurDef, MODULES, tirablesEn, NOMS_LIGNEE, moduleDe, moduleDef, carteId, deNom } from '../donnees';
import type { Rarete } from '../types';
import { COLLECTION, NIVEAU_METAL, ajouterCarte, auMoins, metalDessus, metalTranche, tirerChoix, NOMS_RARETE } from '../collection';
import { tireur } from '../rng';
import { CHAPITRES, chapitreOuvert } from '../chroniques';
import { ARCHIVE, DISTRICT, log, niveauPorteur, non, porteursPresents, strateVaincue, type Jeu, type Resultat, typeDuJour } from './etat';
import { interrompreSeance, progresser, quotidienFait } from './district';
import { t, minuscule } from '../i18n';

// ---------- Kit de départ des recrues ----------

/** Trois cartes en fer par recrue, de sa lignée, différentes des cartes de départ des Porteurs nommés */
export const KIT_RECRUES: Record<string, string[]> = {
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
  /** colis gardés au plus : une semaine d'absence (audit du 7 novembre 2026 : avant 3, les suivants étaient perdus) */
  reserveMax: 7,
  /** composants du colis : base + par Strate ouverte */
  composants: 20,
  composantsParStrate: 10,
  /** tous les 7 colis ouverts (pas forcément d'affilée), une carte au choix d'au moins ce métal */
  cycle: 7,
  minimumCycle: 'cuivre' as Rarete,
} as const;

/**
 * Le métal d'une récompense gardée en réserve est fixé le jour où elle est gagnée, pas le jour où on l'ouvre (12 novembre 2026,
 * Bryan, après les Chroniques : garder sept colis pour les ouvrir une tranche plus bas donnait de meilleures cartes).
 * Chaque colis, objectif du jour ou Butin en réserve garde la Strate ouverte ce jour-là, le plus ancien en tête.
 */
export function noterStrates(r: { reserve: number; strates?: number[] }, strate: number): void {
  const s = (r.strates ?? []).slice(0, r.reserve);
  while (s.length < r.reserve) s.push(strate);
  r.strates = s;
}
/** La Strate du plus ancien de la réserve (celle d'aujourd'hui pour une réserve d'avant cette règle) */
const strateGagnee = (r: { strates?: number[] }, j: Jeu): number => r.strates?.shift() ?? j.strate;

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
  // 12 novembre 2026 : le métal est celui de la tranche de la Strate qui ouvre le chapitre, pas celle du jour où on le lit
  // (Bryan : « si j'attends la fin du jeu avant de lire les Chroniques, je n'aurai que des bonnes cartes ? »)
  const metal = metalTranche(CHAPITRES.find((c) => c.id === chapitreId)?.strate ?? 1);
  const pool = tirablesEn(metal).filter((m) => m.lignee === lignee);
  // d'abord une carte qu'on n'a pas encore dans ce métal ; sinon un doublon
  const neuves = pool.filter((m) => !j.collection[carteId(m.id, metal)]);
  const liste = neuves.length ? neuves : pool;
  const id = carteId(liste[tireur(j).entier(liste.length)]!.id, metal);
  const neuve = ajouterCarte(j, id);
  log(j, t`Lecture des Chroniques : ${moduleDef(id).nom} (${NOMS_RARETE[metal]})${neuve ? '' : t(', un doublon')}.`);
  return id;
}

/** Les chapitres ouverts dont la carte de lecture n'a pas encore été donnée */
export const chapitresALire = (j: Jeu) => CHAPITRES.filter((c) => chapitreOuvert(c, j.strate) && !j.luesRecompensees.includes(c.id)).length;

/** Lit un chapitre (le marque comme lu) et donne sa carte à la première lecture */
export function lireChapitre(j: Jeu, chapitreId: string): string | null {
  if (!j.lus.includes(chapitreId)) j.lus.push(chapitreId);
  return recompenserLecture(j, chapitreId);
}

/** les jours où le filleul d'un parrain reçoit des colis doublés (parrainage.ts) */
export const COLIS_DOUBLES_JOURS = 3;

export const colisDisponible = (j: Jeu) => j.chambre && j.ravitaillement.reserve > 0;
/** colis restants avant la carte au choix */
export const colisAvantChoix = (j: Jeu) => RAVITAILLEMENT.cycle - (j.ravitaillement.ouverts % RAVITAILLEMENT.cycle);

interface Colis { composants: number; doublon: string | null; choix: boolean }

/** Ouvre un colis : des composants, un doublon d'une carte possédée en fer, et tous les 7 colis une carte au choix */
export function ouvrirColis(j: Jeu): Resultat & { colis?: Colis } {
  if (!colisDisponible(j)) return non(t('Pas de colis pour l’instant : le prochain arrive demain.'));
  const r = j.ravitaillement;
  const gagne = strateGagnee(r, j);
  r.reserve--;
  r.ouverts++;
  // le filleul d'un parrain : colis doublés pendant ses premiers jours (parrainage.ts ; même règle, sans importer la couche du dessus)
  const p = j.parrainage?.parrain;
  const double = !!p && r.jour < p.jour + COLIS_DOUBLES_JOURS;
  const composants = (RAVITAILLEMENT.composants + RAVITAILLEMENT.composantsParStrate * j.strate) * (double ? 2 : 1);
  // les récompenses arrivent déjà taillées (9 novembre 2026) : des cristaux, pas du brut
  j.energie += composants;
  // 12 novembre 2026 : le doublon est celui d'une carte portée par un Porteur, quel que soit son métal (avant : une carte en fer,
  // qui ne servait plus dès que le deck avait changé de métal) ; à défaut, une carte de la collection
  const portees = [...new Set(Object.values(j.porteurs).flatMap((p) => p.modules))].filter((id) => j.collection[id] && !moduleDef(id).legs && !moduleDef(id).origine);
  const possibles = portees.length ? portees : Object.keys(j.collection).filter((id) => !moduleDef(id).legs && !moduleDef(id).origine);
  const doublon = possibles.length ? possibles[tireur(j).entier(possibles.length)]! : null;
  if (doublon) ajouterCarte(j, doublon);
  const choix = r.ouverts % RAVITAILLEMENT.cycle === 0;
  if (choix) j.choix.push({ source: 'ravitaillement', options: tirerChoix(j, gagne, auMoins(RAVITAILLEMENT.minimumCycle, metalDessus(gagne)), undefined, porteursPresents(j)) });
  log(j, t`Ravitaillement : +${composants} cristaux${doublon ? t`, un doublon ${deNom(moduleDef(doublon).nom)}` : ''}${choix ? t(', et une carte au choix') : ''}.`);
  return { ok: true, colis: { composants, doublon, choix } };
}

export function prendre(j: Jeu, index: number): Resultat {
  const c = j.choix[0];
  if (!c) return non(t('Rien à choisir.'));
  if (index === -1) {
    if (!c.eclats) return non(t('Pas d’Éclats proposés ici.'));
    j.eclats += c.eclats;
    log(j, t`+${c.eclats} Éclats.`);
  } else {
    const id = c.options[index];
    if (!id) return non(t('Choix inconnu.'));
    const neuve = ajouterCarte(j, id);
    log(j, neuve ? t`Nouvelle carte : ${moduleDef(id).nom} (${NOMS_RARETE[moduleDef(id).rarete]}).` : t`Doublon : ${moduleDef(id).nom}.`);
  }
  j.choix.shift();
  return { ok: true };
}

/** les Éclats qu'on peut prendre à la place de la carte de l'objectif du jour */
export const QUOTIDIEN_ECLATS = 2;

/** Récupère l'objectif du jour : une carte au choix parmi 3, ou 2 Éclats */
export function reclamerQuotidien(j: Jeu): Resultat {
  if (!quotidienFait(j)) return non(t('Objectif du jour pas encore rempli.'));
  const gagne = strateGagnee(j.quotidien, j);
  j.choix.push({ source: 'quotidien', options: tirerChoix(j, gagne, metalTranche(gagne), undefined, porteursPresents(j)), eclats: QUOTIDIEN_ECLATS });
  progresser(j, 'quotidien');
  const q = j.quotidien;
  q.reserve--;
  q.progres = 0;
  q.type = typeDuJour(q.jour + (3 - q.reserve));
  log(j, t('Objectif du jour rempli.'));
  return { ok: true };
}

/** Ouvre l'Archive de la semaine passée */
export function ouvrirArchive(j: Jeu): Resultat {
  const n = j.archive.aOuvrir;
  if (!n) return non(t('Le Butin de la semaine n’est pas encore prêt.'));
  j.energie += ARCHIVE.composants;
  // le métal est celui de la Strate ouverte le lundi où ce Butin a été gagné
  const gagne = strateGagnee(j.archive, j);
  const prestige = () => tirerChoix(j, gagne, auMoins('argent', metalDessus(gagne)), undefined, porteursPresents(j));
  j.choix.push({ source: 'archive', options: tirerChoix(j, gagne, metalTranche(gagne), undefined, porteursPresents(j)) });
  if (n >= 2) j.eclats += ARCHIVE.eclatsPalier2;
  if (n >= 3) j.choix.push({ source: 'archive', options: prestige() });
  if (n >= 4) { j.choix.push({ source: 'archive', options: prestige() }); j.eclats += ARCHIVE.eclatsPalier4; }
  // le Butin suivant, s'il y en a un qui attend
  j.archive.aOuvrir = j.archive.enAttente?.shift() ?? 0;
  if (j.archive.enAttente && !j.archive.enAttente.length) delete j.archive.enAttente;
  if (!j.archive.aOuvrir) delete j.archive.strates;
  log(j, t`Butin de la semaine ouvert : palier ${n} sur ${ARCHIVE.paliers.length}.`);
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
    if (b === 'noyau') interrompreSeance(j, id);
    j.porteurs[id]!.poste = null;
    log(j, b === 'noyau' ? t`${porteurDef(id).nom} quitte l’entraînement pour descendre.` : t`${porteurDef(id).nom} quitte son poste (${batimentDef(b).nom}) pour descendre.`);
  }
}

// ---------- Les fouilles ciblées ----------
// Quand on bloque devant une Strate : une descente courte (4 rangées, sans gardien ni salle scellée) dans une Strate déjà
// vaincue, vers un filon choisi. Les cartes trouvées en route sont de la lignée visée ; le filon donne ce qu'on cherchait.

// ---------- Les Épreuves de la semaine ----------
// Trois combats à règle spéciale, renouvelés chaque lundi, contre le gardien de la dernière Strate vaincue.
// La première victoire de chaque Épreuve dans la semaine donne une carte au choix, dont une en argent au moins.

/** Appelé quand le combat en cours vient de se terminer */

// ---------- L’Héritage du district (27 octobre 2026, docs/heritage-du-district.md) ----------
// L'ancienne directrice a caché dix vierges (cartes en nacre) sous la Tour du Noyau. Chaque joueur n'en reçoit qu'une, par la
// lettre qu'elle a laissée : deux questions sur le directeur qu'il veut être, sans un chiffre. Le choix est définitif.
// Comme toute nacre, la carte se porte à partir d'un Porteur de niveau 10 (NIVEAU_METAL), puis s'éveille avec lui.

/** La lettre de la directrice : la première question choisit la lignée (ou la Clé), la seconde la voie */
export const LETTRE_LEGS = {
  titre: t('La lettre de la directrice'),
  texte: t('Sous la Tour du Noyau, derrière une plaque, les ouvriers avaient trouvé un coffre de nacre, gravé à la main : « Pour celui qui remontera de la deuxième Strate. Pas avant. » Ce soir, Ilka te le tend. Dedans, une lettre.'),
  /** la lettre elle-même, mise à part (31 octobre 2026) */
  lettre: t('Directeur, une Strate, n’importe qui peut la descendre une fois, par chance ou par orgueil. Deux, et revenir avec les siens, c’est autre chose : tu iras plus bas que moi. Ce qui dort sous la Tour, je n’ai jamais osé le regarder en face. Avant de partir, j’ai mis de côté dix originaux, jamais recopiés, que les Hauts n’auront pas. Un seul est pour toi : dis-moi qui tu es, et je te dirai lequel.'),
  question: t('Qu’est-ce qui tient un district debout ?'),
  lignees: [
    { id: 'tech', nom: t('La machine'), phrase: t('Des mains qui réparent ce que les autres jettent.') },
    { id: 'bio', nom: t('Le corps'), phrase: t('Des épaules qui encaissent pour ceux qui ne peuvent pas.') },
    { id: 'reso', nom: t('L’empreinte'), phrase: t('Des yeux qui voient ce que les autres ont oublié.') },
    { id: 'cle', nom: t('Tout le monde à la fois'), phrase: t('Personne ne tient seul. Le district non plus.') },
  ],
  voies: {
    tech: { question: t('Et quand la machine s’emballe ?'), options: [
      { id: 'foulee-directrice', phrase: t('On court devant elle, plus vite qu’elle.') },
      { id: 'bras-fonderie', phrase: t('On frappe plus fort qu’elle, une bonne fois.') },
      { id: 'coeur-glaciere', phrase: t('On garde son énergie, et on la relâche au bon moment.') },
    ] },
    bio: { question: t('Et quand les coups pleuvent ?'), options: [
      { id: 'carapace-fondations', phrase: t('On encaisse ensemble, et on rend chaque coup.') },
      { id: 'oeil-grande-nuit', phrase: t('On ne lâche jamais une proie.') },
      { id: 'premiere-mue', phrase: t('On se relève toujours, tous ensemble.') },
    ] },
    reso: { question: t('Et quand personne ne veut entendre ?'), options: [
      { id: 'lanterne-lecture', phrase: t('On éclaire la suite, pas à pas.') },
      { id: 'sceau-orseve', phrase: t('On lit la faute de l’autre, et on la lui rend.') },
      { id: 'voix-quartier', phrase: t('On chante plus fort, tous sur la même note.') },
    ] },
  },
} as const;

/**
 * La lettre attend le joueur au district, tant qu'il n'a pas reçu son Héritage, une fois le gardien de la Strate −2 vaincu
 * (31 octobre 2026, Bryan : à l'arrivée au district, le joueur ne savait pas encore ce que sont les lignées ; 8 novembre 2026,
 * audit du soir : à −1, une trentaine de notions arrivaient d'un coup, la lettre passe après −2). Aussi pendant une descente.
 */
export const LEGS_STRATE = 2;
export const legsEnAttente = (j: Jeu) => !!j.chambre && !j.legs && strateVaincue(j) >= LEGS_STRATE;

/** Le joueur répond à la lettre : sa carte de l’Héritage (ou la Clé) lui revient, scellée jusqu'à un Porteur de niveau 10 */
export function choisirLegs(j: Jeu, id: string): Resultat {
  if (!j.chambre) return non(t('Ouvre d’abord la chambre scellée.'));
  if (j.legs) return non(t('Tu as déjà reçu ton Héritage.'));
  if (id === 'cle') {
    j.legs = 'cle';
    log(j, t`L’Héritage du district : la Clé de l’Héritage rejoint le paquetage de tes escouades (avec un Porteur de niveau ${NIVEAU_METAL.nacre}).`);
    return { ok: true };
  }
  const m = MODULES.find((x) => x.id === id && x.legs);
  if (!m) return non(t('Cette carte ne fait pas partie de l’Héritage.'));
  j.legs = id;
  ajouterCarte(j, carteId(id, 'nacre'));
  log(j, t`L’Héritage du district : ${m.nom} est à toi. Elle se portera avec un Porteur ${minuscule(NOMS_LIGNEE[m.lignee].nom)} de niveau ${NIVEAU_METAL.nacre}.`);
  return { ok: true };
}

/** L'éveil : la carte de l’Héritage passe au niveau 3 avec un Porteur de niveau 13, au niveau 5 avec un Porteur de niveau 16 */
// (10 novembre 2026 : niveaux 3 et 5 sur 5, au lieu de 9 et 10 sur 10)
// 12 novembre 2026 : la nacre se porte au niveau 13 (avant 10) ; l'éveil suit, à 16 et 19 (avant 13 et 16)
export const EVEIL_LEGS: { porteur: number; niveau: number }[] = [{ porteur: 16, niveau: 3 }, { porteur: 19, niveau: 5 }];
export const niveauLegsPour = (niveauDuPorteur: number) =>
  EVEIL_LEGS.reduce((n, e) => (niveauDuPorteur >= e.porteur ? Math.max(n, e.niveau) : n), COLLECTION.niveauDepart.nacre);

/** Une carte d'origine n'a pas de doublons : elle grandit avec le Porteur qui la porte (11 novembre 2026).
 *  Plus tôt que l'Héritage : elle doit aider dès les premières Strates, et finir sa montée au milieu du jeu. */
export const EVEIL_ORIGINE: { porteur: number; niveau: number }[] = [{ porteur: 4, niveau: 2 }, { porteur: 8, niveau: 3 }, { porteur: 12, niveau: 4 }, { porteur: 16, niveau: 5 }];
export const niveauOriginePour = (niveauDuPorteur: number) =>
  EVEIL_ORIGINE.reduce((n, e) => (niveauDuPorteur >= e.porteur ? Math.max(n, e.niveau) : n), 1);

/** À chaque tick : chaque carte d'origine portée grandit avec son Porteur (elle ne redescend jamais) */
export function eveillerOrigines(j: Jeu) {
  for (const [id, p] of Object.entries(j.porteurs)) {
    for (const cle of p.modules) {
      const c = j.collection[cle];
      if (!c || !moduleDef(cle).origine) continue;
      const n = niveauOriginePour(niveauPorteur(j, id).niveau);
      if (n > c.niveau) {
        c.niveau = n;
        log(j, t`${moduleDef(cle).nom} grandit avec ${porteurDef(id).nom} : niveau ${n}.`);
      }
    }
  }
}

/** À chaque tick : la carte de l’Héritage s'éveille avec le Porteur qui la porte (elle ne redescend jamais) */
export function eveillerLegs(j: Jeu) {
  if (!j.legs || j.legs === 'cle') return;
  const cle = carteId(j.legs, 'nacre');
  const c = j.collection[cle];
  const porteur = Object.keys(j.porteurs).find((id) => j.porteurs[id]!.modules.includes(cle));
  if (!c || !porteur) return;
  const n = niveauLegsPour(niveauPorteur(j, porteur).niveau);
  if (n > c.niveau) {
    c.niveau = n;
    log(j, t`${moduleDef(cle).nom} s’éveille avec ${porteurDef(porteur).nom} : niveau ${n}.`);
  }
}
