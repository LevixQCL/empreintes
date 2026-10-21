// L'état complet d'une partie : le district (ressources, bâtiments, Porteurs, Forge)
// et l'expédition en cours. Fonctions pures : le temps est toujours passé en paramètre (`now`, en ms),
// ce qui permet de rattraper le temps passé hors du jeu et de tester sans attendre.

import { BATIMENTS, COLLECTION_DEPART, GESTES_SPECIAUX, MODULES, PORTEURS, batimentDef, carteId, moduleDe, moduleDef, porteurDef } from './donnees';
import {
  COLLECTION, NOMS_RARETE, ajouterCarte, gestesAvecModules, composantsNiveau, doublonsRequis, tirerCarte, tirerChoix,
  type CarteCollection,
} from './collection';
import { ORDRE_FRAGMENTS, fragmentDef } from './fragments';
import { cloturerCombat, combatSuivant, nouvelleExpedition, type Expedition } from './expedition';
import { graine, tireur } from './rng';
import type { BatimentId, GesteDef, PorteurEtat, Rarete } from './types';

export const VERSION_JEU = 4;

/** Réglages du district, au même endroit pour l'équilibrage */
export const DISTRICT = {
  /** énergie par heure selon le niveau du Générateur (index = niveau) */
  energieParHeure: [0, 60, 110, 180, 260, 350],
  /** stockage maximum selon le niveau du Noyau */
  stockage: [0, 300, 650, 1300, 2300, 4100],
  /** points d'Usure soignés par heure selon le niveau de la Clinique */
  soinParHeure: [0, 6, 10, 16, 22, 30],
  /** durée du chantier pour atteindre un niveau, en minutes (index = niveau visé) */
  chantierMinutes: [0, 0, 0, 5, 30, 120, 240, 720, 1440, 2160, 2880],
  /** chantiers en même temps : 1, puis 2 à partir du Noyau niveau 4 */
  chantiersNoyau2: 4,
  /** bonus d'un Porteur posté : de la bonne lignée / d'une autre lignée */
  bonusAffinite: 2,
  bonusPoste: 1.5,
  /** Usure gagnée par expédition, et en plus si le Porteur finit à terre */
  usureExpedition: 6,
  usureATerre: 3,
  /** Usure maximale, en fraction des PV max */
  usureMaxRatio: 0.5,
  modulesMax: 2,
  /** part du butin gardée après une défaite */
  butinDefaite: 0.5,
  depart: { energie: 120, composants: 20 },
} as const;

/** Points d'Archive gagnés, et paliers de la semaine */
export const ARCHIVE = {
  points: { combat: 2, expedition: 5, chantier: 3, quotidien: 5 },
  paliers: [30, 80, 160],
} as const;

/** Lundi 5 janvier 2026, 4 h du matin à Bruxelles : point de départ des jours et des semaines du jeu */
const EPOQUE = Date.UTC(2026, 0, 5, 3);
export const jourDe = (now: number) => Math.floor((now - EPOQUE) / 86_400_000);
export const semaineDe = (now: number) => Math.floor(jourDe(now) / 7);
/** Début de la semaine suivante, en ms */
export const lundiSuivant = (now: number) => EPOQUE + (semaineDe(now) + 1) * 7 * 86_400_000;

export type Poste = Exclude<BatimentId, 'noyau'>;
export const POSTES: Poste[] = ['generateur', 'forge', 'clinique'];

export interface PorteurDistrict {
  usure: number;
  poste: Poste | null;
  modules: string[];
}

/** La Forge refabrique un exemplaire d'une carte déjà trouvée */
export interface Fabrication {
  moduleId: string;
  debut: number;
  fin: number;
}

export interface Chantier {
  batiment: BatimentId;
  debut: number;
  fin: number;
}

/** Un choix de carte en attente (boss, objectif du jour, Archive) */
export interface Choix {
  source: 'boss' | 'quotidien' | 'archive';
  options: string[];
  /** le joueur peut prendre des Éclats à la place */
  eclats?: number;
}

export type TypeQuotidien = 'combats' | 'expedition' | 'chantier';
export const QUOTIDIENS: Record<TypeQuotidien, { titre: string; objectif: number }> = {
  combats: { titre: 'Gagner 4 combats', objectif: 4 },
  expedition: { titre: 'Vaincre une Strate jusqu’à son boss', objectif: 1 },
  chantier: { titre: 'Lancer une amélioration de bâtiment', objectif: 1 },
};

export interface Jeu {
  version: number;
  energie: number;
  composants: number;
  batiments: Record<BatimentId, number>;
  porteurs: Record<string, PorteurDistrict>;
  forge: Fabrication | null;
  /** Strate la plus profonde ouverte (le prochain étage à creuser) */
  strate: number;
  dernierTick: number;
  expedition: Expedition | null;
  journal: string[];
  /** l'intro du premier lancement a été vue */
  introVue: boolean;
  /** la chambre scellée a été ouverte (fin du combat guidé) */
  chambre: boolean;
  /** les trois recrues anonymes ont rejoint le district */
  recrues: boolean;
  /** index de l'objectif guidé en cours (OBJECTIFS.length = tous faits) */
  objectif: number;
  /** fragments d'archives trouvés, dans l'ordre */
  fragments: string[];
  eclats: number;
  /** les cartes possédées */
  collection: Record<string, CarteCollection>;
  /** cartes tirées depuis la dernière de chaque rareté, pour les garanties */
  sans: { argent: number; or: number; nacre: number };
  /** hasard des trouvailles (déterministe, sauvegardé) */
  rng: number;
  chantiers: Chantier[];
  choix: Choix[];
  /** objectif du jour : jours en réserve (3 au plus) et progression */
  quotidien: { jour: number; reserve: number; type: TypeQuotidien; progres: number };
  /** Archive de la semaine : points de la semaine en cours, paliers à ouvrir de la semaine passée */
  archive: { semaine: number; points: number; aOuvrir: number };
}

export interface Resultat {
  ok: boolean;
  message?: string;
}

const non = (message: string): Resultat => ({ ok: false, message });

const typeDuJour = (jour: number): TypeQuotidien => (['combats', 'expedition', 'chantier'] as const)[((jour % 3) + 3) % 3]!;

export function nouveauJeu(now: number, rng = graine()): Jeu {
  const porteurs: Record<string, PorteurDistrict> = {};
  for (const p of PORTEURS) porteurs[p.id] = { usure: 0, poste: null, modules: [] };
  return {
    version: VERSION_JEU,
    energie: DISTRICT.depart.energie,
    composants: DISTRICT.depart.composants,
    batiments: { noyau: 1, generateur: 1, forge: 1, clinique: 1 },
    porteurs,
    forge: null,
    strate: 1,
    dernierTick: now,
    expedition: null,
    journal: ['Tu viens d’être élu à la tête du district. Les piliers t’attendent.'],
    introVue: false,
    chambre: false,
    recrues: false,
    objectif: 0,
    fragments: [],
    eclats: 0,
    collection: Object.fromEntries(COLLECTION_DEPART.map((id) => [id, { niveau: 1, doublons: 0 }])),
    sans: { argent: 0, or: 0, nacre: 0 },
    rng,
    chantiers: [],
    choix: [],
    quotidien: { jour: jourDe(now), reserve: 1, type: typeDuJour(jourDe(now)), progres: 0 },
    archive: { semaine: semaineDe(now), points: 0, aOuvrir: 0 },
  };
}

export function estJeuValide(x: unknown): x is Jeu {
  const j = x as Jeu | null;
  if (!(!!j && (j.version === VERSION_JEU || j.version === 2 || j.version === 3) && typeof j.energie === 'number' && !!j.batiments && !!j.porteurs)) return false;
  migrer(j);
  return true;
}

const RENOMMES: Record<string, string> = { 'glande-amber': 'glande-ambre' };

/** Complète une sauvegarde d'une version précédente avec les nouveaux champs */
function migrer(j: Jeu) {
  const ancien = j.chambre === undefined;
  j.chambre ??= ancien && j.strate > 1;
  j.recrues ??= ancien;
  j.objectif ??= ancien && j.strate > 1 ? OBJECTIFS.length : 0;
  j.fragments ??= [];
  if (j.version === 2) {
    // version 3 : la collection de cartes, les Éclats, les chantiers, l'objectif du jour et l'Archive
    const now = j.dernierTick;
    j.version = 3;
    j.eclats = 0;
    j.collection = Object.fromEntries(COLLECTION_DEPART.map((id) => [id, { niveau: 1, doublons: 0 }]));
    for (const p of Object.values(j.porteurs)) {
      p.modules = p.modules.map((m) => RENOMMES[m] ?? m).filter((m) => MODULES.some((x) => x.id === m)).map((m) => carteId(m, moduleDef(m).rarete));
      for (const m of p.modules) {
        if (j.collection[m]) j.collection[m]!.doublons++;
        else j.collection[m] = { niveau: 1, doublons: 0 };
      }
    }
    if (j.forge) j.forge = { moduleId: RENOMMES[j.forge.moduleId] ?? j.forge.moduleId, debut: j.forge.debut, fin: j.forge.fin };
    j.sans = { argent: 0, or: 0, nacre: 0 };
    j.rng = graine();
    j.chantiers = [];
    j.choix = [];
    j.quotidien = { jour: jourDe(now), reserve: 1, type: typeDuJour(jourDe(now)), progres: 0 };
    j.archive = { semaine: semaineDe(now), points: 0, aOuvrir: 0 };
  }
  if (j.version === 3) {
    // version 4 : un Module peut exister dans les cinq métaux ; chaque exemplaire garde le métal d'origine de son Module
    j.version = 4;
    const existe = (id: string) => MODULES.some((m) => m.id === moduleDe(id));
    const cle = (id: string) => (id.includes('@') ? id : carteId(id, moduleDef(id).rarete));
    j.collection = Object.fromEntries(Object.entries(j.collection).filter(([id]) => existe(id)).map(([id, c]) => [cle(id), c]));
    for (const p of Object.values(j.porteurs)) p.modules = p.modules.filter(existe).map(cle);
    if (j.forge) j.forge = existe(j.forge.moduleId) ? { ...j.forge, moduleId: cle(j.forge.moduleId) } : null;
    j.choix = j.choix.map((c) => ({ ...c, options: c.options.filter(existe).map(cle) })).filter((c) => c.options.length);
  }
}

function log(j: Jeu, t: string) {
  j.journal.unshift(t);
  j.journal = j.journal.slice(0, 8);
}

// ---------- Lecture ----------

export const enExpedition = (j: Jeu, id: string) => !!j.expedition && j.expedition.porteurs.some((p) => p.id === id);
export const posteDe = (j: Jeu, b: Poste) => Object.keys(j.porteurs).find((id) => j.porteurs[id]!.poste === b) ?? null;
export const stockage = (j: Jeu) => DISTRICT.stockage[j.batiments.noyau] ?? 0;
export const pvMaxCombat = (j: Jeu, id: string) => porteurDef(id).pvMax - Math.floor(j.porteurs[id]!.usure);
export const usureMax = (id: string) => Math.floor(porteurDef(id).pvMax * DISTRICT.usureMaxRatio);

function multiplicateur(j: Jeu, b: Poste): number {
  const id = posteDe(j, b);
  if (!id) return 1;
  return porteurDef(id).lignee === batimentDef(b).affinite ? DISTRICT.bonusAffinite : DISTRICT.bonusPoste;
}

export const energieParHeure = (j: Jeu) => Math.round((DISTRICT.energieParHeure[j.batiments.generateur] ?? 0) * multiplicateur(j, 'generateur'));
export const soinParHeure = (j: Jeu) => (DISTRICT.soinParHeure[j.batiments.clinique] ?? 0) * multiplicateur(j, 'clinique');

/** Ce que coûte la refabrication d'un exemplaire */
export const coutRefabrication = (moduleId: string) => COLLECTION.refabrication[moduleDef(moduleId).rarete];

/** Durée de refabrication, en ms (plus rapide avec un forgeron de la bonne lignée et une Forge améliorée) */
export function dureeFabrication(j: Jeu, moduleId: string): number {
  const bonus = multiplicateur(j, 'forge');
  const niveau = 1 + 0.25 * (j.batiments.forge - 1);
  return Math.round((coutRefabrication(moduleId).minutes * 60_000 * DISTRICT.bonusPoste) / (bonus * niveau));
}

export function coutAmelioration(j: Jeu, b: BatimentId) {
  const d = batimentDef(b);
  const n = j.batiments[b];
  return n >= d.niveauMax ? null : d.couts[n]!;
}

/** Durée du chantier pour monter un bâtiment au niveau suivant, en ms */
export const dureeChantier = (j: Jeu, b: BatimentId) => (DISTRICT.chantierMinutes[j.batiments[b] + 1] ?? 0) * 60_000;
export const chantierDe = (j: Jeu, b: BatimentId) => j.chantiers.find((c) => c.batiment === b) ?? null;
export const chantiersMax = (j: Jeu) => (j.batiments.noyau >= DISTRICT.chantiersNoyau2 ? 2 : 1);

/** Les Porteurs qui portent déjà cette carte */
export const greffesDe = (j: Jeu, moduleId: string) => Object.keys(j.porteurs).filter((id) => j.porteurs[id]!.modules.includes(moduleId));

// ---------- Le temps qui passe ----------

/** Rattrape le temps écoulé : énergie, soins, Forge. Rien n'est perdu ni puni pendant l'absence. */
export function tick(j: Jeu, now: number): string[] {
  const nouvelles: string[] = [];
  const dt = Math.max(0, now - j.dernierTick);
  const heures = dt / 3_600_000;
  j.dernierTick = now;

  j.energie = Math.min(stockage(j), j.energie + energieParHeure(j) * heures);

  const soin = soinParHeure(j) * heures;
  for (const id of Object.keys(j.porteurs)) {
    if (enExpedition(j, id)) continue;
    const p = j.porteurs[id]!;
    p.usure = Math.max(0, p.usure - soin);
  }

  if (j.forge && now >= j.forge.fin) {
    const f = j.forge;
    ajouterCarte(j, f.moduleId);
    j.forge = null;
    const t = `La Forge a refabriqué ${moduleDef(f.moduleId).nom} : un doublon de plus.`;
    log(j, t);
    nouvelles.push(t);
  }

  for (const c of j.chantiers.filter((x) => now >= x.fin)) {
    j.batiments[c.batiment]++;
    const t = `Chantier terminé : ${batimentDef(c.batiment).nom} passe au niveau ${j.batiments[c.batiment]}.`;
    log(j, t);
    nouvelles.push(t);
  }
  j.chantiers = j.chantiers.filter((x) => now < x.fin);

  // un objectif du jour de plus en réserve chaque jour, 3 au plus : rien ne se perd pendant une courte absence
  const jour = jourDe(now);
  if (jour > j.quotidien.jour) {
    const avant = j.quotidien.reserve;
    j.quotidien.reserve = Math.min(3, j.quotidien.reserve + (jour - j.quotidien.jour));
    if (avant === 0) { j.quotidien.type = typeDuJour(jour); j.quotidien.progres = 0; }
    j.quotidien.jour = jour;
  }

  // l'Archive de la semaine s'ouvre le lundi
  const semaine = semaineDe(now);
  if (semaine > j.archive.semaine) {
    const paliers = ARCHIVE.paliers.filter((p) => j.archive.points >= p).length;
    if (paliers > 0) {
      j.archive.aOuvrir = Math.max(j.archive.aOuvrir, paliers);
      const t = 'L’Archive de la semaine est prête à être ouverte.';
      log(j, t);
      nouvelles.push(t);
    }
    j.archive.points = 0;
    j.archive.semaine = semaine;
  }
  return nouvelles;
}

/** Des points d'Archive et la progression de l'objectif du jour */
function progresser(j: Jeu, quoi: keyof typeof ARCHIVE.points, n = 1) {
  j.archive.points += ARCHIVE.points[quoi] * n;
  const q = j.quotidien;
  if (quoi === 'quotidien' || !quotidienActif(j)) return;
  if ((quoi === 'combat' && q.type === 'combats') || (quoi === 'expedition' && q.type === 'expedition') || (quoi === 'chantier' && q.type === 'chantier')) {
    q.progres = Math.min(QUOTIDIENS[q.type].objectif, q.progres + n);
  }
}

/** L'objectif du jour apparaît une fois les 3 objectifs guidés terminés */
export const quotidienActif = (j: Jeu) => j.objectif >= OBJECTIFS.length && j.quotidien.reserve > 0;
export const quotidienFait = (j: Jeu) => quotidienActif(j) && j.quotidien.progres >= QUOTIDIENS[j.quotidien.type].objectif;

// ---------- Actions du district ----------

export function ameliorer(j: Jeu, b: BatimentId, now = j.dernierTick): Resultat {
  const cout = coutAmelioration(j, b);
  if (!cout) return non('Niveau maximum atteint.');
  if (chantierDe(j, b)) return non('Un chantier est déjà en cours sur ce bâtiment.');
  if (b !== 'noyau' && j.batiments[b] >= j.batiments.noyau) return non('Améliore d’abord la Tour du Noyau.');
  if (b === 'noyau' && j.chantiers.length) return non('Termine d’abord les chantiers en cours avant d’agrandir la Tour du Noyau.');
  if (j.chantiers.length >= chantiersMax(j)) return non(chantiersMax(j) === 1 ? 'Un seul chantier à la fois pour l’instant (deux au Noyau niveau 4).' : 'Deux chantiers sont déjà en cours.');
  if (j.energie < cout.energie || j.composants < cout.composants || j.eclats < (cout.eclats ?? 0)) return non('Pas assez de ressources.');
  j.energie -= cout.energie;
  j.composants -= cout.composants;
  j.eclats -= cout.eclats ?? 0;
  const duree = dureeChantier(j, b);
  progresser(j, 'chantier');
  if (duree <= 0) {
    j.batiments[b]++;
    log(j, `${batimentDef(b).nom} passe au niveau ${j.batiments[b]}.`);
  } else {
    j.chantiers.push({ batiment: b, debut: now, fin: now + duree });
    log(j, `Chantier lancé : ${batimentDef(b).nom} vers le niveau ${j.batiments[b] + 1}.`);
  }
  return { ok: true };
}

export function poster(j: Jeu, id: string, b: Poste | null): Resultat {
  const p = j.porteurs[id];
  if (!p || !porteursPresents(j).includes(id)) return non('Porteur inconnu.');
  if (enExpedition(j, id)) return non('Ce Porteur est en expédition.');
  if (b === 'forge' && j.forge && p.poste === 'forge') return non('La Forge travaille : attends la fin de la fabrication.');
  if (b) {
    const occupant = posteDe(j, b);
    if (occupant && occupant !== id) {
      if (b === 'forge' && j.forge) return non('La Forge travaille : attends la fin de la fabrication.');
      j.porteurs[occupant]!.poste = null;
    }
  }
  if (p.poste === 'forge' && j.forge) return non('La Forge travaille : attends la fin de la fabrication.');
  p.poste = b;
  log(j, b ? `${porteurDef(id).nom} travaille maintenant : ${batimentDef(b).nom}.` : `${porteurDef(id).nom} se repose.`);
  return { ok: true };
}

/** La Forge refabrique un exemplaire d'une carte déjà trouvée : un doublon de plus */
export function fabriquer(j: Jeu, moduleId: string, now: number): Resultat {
  if (!j.collection[moduleId]) return non('On ne refabrique qu’une carte déjà trouvée.');
  if (j.forge) return non('La Forge est déjà occupée.');
  if (!posteDe(j, 'forge')) return non('Il faut un Porteur au travail à la Forge.');
  const c = coutRefabrication(moduleId);
  if (j.composants < c.composants || j.eclats < c.eclats) return non('Pas assez de ressources.');
  j.composants -= c.composants;
  j.eclats -= c.eclats;
  j.forge = { moduleId, debut: now, fin: now + dureeFabrication(j, moduleId) };
  log(j, `La Forge refabrique ${moduleDef(moduleId).nom}.`);
  return { ok: true };
}

/** Recycle un doublon en Composants */
export function recycler(j: Jeu, moduleId: string): Resultat {
  const c = j.collection[moduleId];
  if (!c || c.doublons < 1) return non('Aucun doublon à recycler.');
  c.doublons--;
  const gain = COLLECTION.recyclage[moduleDef(moduleId).rarete];
  j.composants += gain;
  log(j, `Un doublon de ${moduleDef(moduleId).nom} recyclé : +${gain} composants.`);
  return { ok: true };
}

/** Monte une carte d'un niveau avec ses doublons */
export function monter(j: Jeu, moduleId: string): Resultat {
  const c = j.collection[moduleId];
  if (!c) return non('Carte inconnue.');
  const requis = doublonsRequis(moduleId, c.niveau);
  if (requis === null) return non('Niveau maximum atteint.');
  if (c.doublons < requis) return non(`Il faut ${requis} doublon${requis > 1 ? 's' : ''}.`);
  const cout = composantsNiveau(c.niveau + 1);
  if (j.composants < cout) return non('Pas assez de composants.');
  c.doublons -= requis;
  j.composants -= cout;
  c.niveau++;
  log(j, `${moduleDef(moduleId).nom} passe au niveau ${c.niveau}.`);
  return { ok: true };
}

/** Greffe une carte sur un Porteur de sa lignée (une carte ne se porte qu'une fois) */
export function greffer(j: Jeu, moduleId: string, porteurId: string): Resultat {
  const p = j.porteurs[porteurId];
  if (!j.collection[moduleId]) return non('Carte inconnue.');
  if (!p || !porteursPresents(j).includes(porteurId)) return non('Porteur inconnu.');
  if (enExpedition(j, porteurId)) return non('Ce Porteur est en expédition.');
  if (porteurDef(porteurId).lignee !== moduleDef(moduleId).lignee) return non('Cette carte ne convient qu’à sa lignée.');
  const ancien = greffesDe(j, moduleId)[0];
  if (ancien === porteurId) return { ok: true };
  if (p.modules.some((k) => k !== moduleId && moduleDe(k) === moduleDe(moduleId))) return non(`${porteurDef(porteurId).nom} porte déjà cette carte dans un autre métal.`);
  if (ancien && enExpedition(j, ancien)) return non('Cette carte est en expédition.');
  if (p.modules.length >= DISTRICT.modulesMax) return non(`${porteurDef(porteurId).nom} porte déjà ${DISTRICT.modulesMax} cartes : retires-en une.`);
  if (ancien) j.porteurs[ancien]!.modules = j.porteurs[ancien]!.modules.filter((m) => m !== moduleId);
  p.modules.push(moduleId);
  log(j, `${moduleDef(moduleId).nom} greffé sur ${porteurDef(porteurId).nom}.`);
  return { ok: true };
}

export function degreffer(j: Jeu, moduleId: string): Resultat {
  const id = greffesDe(j, moduleId)[0];
  if (!id) return { ok: true };
  if (enExpedition(j, id)) return non('Ce Porteur est en expédition.');
  j.porteurs[id]!.modules = j.porteurs[id]!.modules.filter((m) => m !== moduleId);
  return { ok: true };
}

/** Résout le premier choix en attente : une des cartes, ou les Éclats si proposé (index -1) */
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
  j.archive.aOuvrir = 0;
  log(j, `Archive de la semaine ouverte : palier ${n} sur 3.`);
  return { ok: true };
}

// ---------- Expéditions ----------

/** Les Gestes qu'un Porteur apporte : les siens + ceux de ses Modules */
export function gestesDe(j: Jeu, id: string): GesteDef[] {
  const mods = (j.porteurs[id]?.modules ?? []).map((mid) => ({ id: mid, niveau: j.collection[mid]?.niveau ?? 1 }));
  return gestesAvecModules(id, mods);
}

/** Les Porteurs présents au district (les recrues n'arrivent qu'après la chambre scellée) */
export function porteursPresents(j: Jeu): string[] {
  return PORTEURS.filter((p) => p.nomme || j.recrues).map((p) => p.id);
}

export function disponibles(j: Jeu): string[] {
  return porteursPresents(j).filter((id) => !j.porteurs[id]!.poste && !enExpedition(j, id));
}

export function partir(j: Jeu, escouade: string[], strate: number, rng = graine()): Resultat {
  if (j.expedition) return non('Une expédition est déjà en cours.');
  if (escouade.length !== 3 || new Set(escouade).size !== 3) return non('Choisis 3 Porteurs.');
  for (const id of escouade) {
    if (!porteursPresents(j).includes(id)) return non('Ce Porteur n’est pas encore arrivé au district.');
    if (j.porteurs[id]?.poste) return non(`${porteurDef(id).nom} travaille au district.`);
  }
  if (!j.chambre) return non('Ouvre d’abord la chambre scellée.');
  if (strate < 1 || strate > j.strate) return non('Cette Strate n’est pas encore creusée.');
  const porteurs: PorteurEtat[] = escouade.map((id) => ({ id, pv: pvMaxCombat(j, id), pvMax: pvMaxCombat(j, id), aTerre: false }));
  const deck = [...escouade.flatMap((id) => gestesDe(j, id)), ...GESTES_SPECIAUX];
  j.expedition = nouvelleExpedition({ porteurs, deck, strate, rng });
  log(j, `L’escouade descend dans la Strate −${strate}.`);
  return { ok: true };
}

/** Appelé quand le combat en cours vient de se terminer */
export function finDeCombat(j: Jeu): void {
  if (!j.expedition) return;
  j.expedition = cloturerCombat(j.expedition);
}

export function continuer(j: Jeu): void {
  if (j.expedition) j.expedition = combatSuivant(j.expedition);
}

/** Retour au district : butin, Usure, et nouvel étage creusé après une victoire complète */
export interface Retour {
  butin: number; nouvelleStrate: boolean; victoire: boolean; fragment: string | null; tutoriel?: boolean;
  /** cartes trouvées en route, Éclats gagnés */
  cartes: string[]; eclats: number;
}

export function remonter(j: Jeu): Retour {
  const x = j.expedition;
  if (!x) return { butin: 0, nouvelleStrate: false, victoire: false, fragment: null, cartes: [], eclats: 0 };
  const victoire = x.terminee && x.combat.issue === 'victoire';
  const butin = victoire || x.combat.issue !== 'defaite' ? x.butin : Math.floor(x.butin * DISTRICT.butinDefaite);
  j.composants += butin;
  for (const p of x.combat.porteurs) {
    const d = j.porteurs[p.id]!;
    d.usure = Math.min(usureMax(p.id), d.usure + DISTRICT.usureExpedition + (p.pv <= 0 ? DISTRICT.usureATerre : 0));
  }
  let nouvelleStrate = false;
  let fragment: string | null = null;
  if (x.tutoriel) {
    j.expedition = null;
    if (victoire) {
      j.chambre = true;
      j.recrues = true;
      fragment = ajouterFragment(j);
      log(j, 'La chambre scellée est ouverte. Trois recrues rejoignent le district : un Coursier, un Docker et un Guetteur.');
    } else log(j, 'Le gardien de la chambre a repoussé l’escouade. Elle se repose, puis réessaie.');
    return { butin, nouvelleStrate, victoire, fragment, tutoriel: true, cartes: [], eclats: 0 };
  }

  // les trouvailles : une chance de carte par combat normal gagné, un choix de 3 sur le boss
  const victoires = x.combat.issue === 'victoire' ? x.index + 1 : x.index;
  const normales = victoires - (victoire ? 1 : 0);
  const t = tireur(j);
  const cartes: string[] = [];
  let eclats = 0;
  for (let k = 0; k < normales; k++) {
    if (t.nombre() < COLLECTION.chanceCombat) cartes.push(tirerCarte(j, x.strate));
    if (x.strate >= 5 && t.nombre() < 0.1) eclats++;
  }
  progresser(j, 'combat', victoires);
  if (victoire) {
    j.choix.push({ source: 'boss', options: tirerChoix(j, x.strate) });
    eclats += x.strate >= 5 ? 2 : 1;
    progresser(j, 'expedition');
  }
  if (victoire && x.strate === j.strate) {
    j.strate++;
    nouvelleStrate = true;
    fragment = ajouterFragment(j);
    j.composants += 20;
    cartes.push(tirerCarte(j, x.strate));
    eclats += 2;
  }
  for (const c of cartes) ajouterCarte(j, c);
  j.eclats += eclats;
  j.expedition = null;
  log(j, victoire
    ? `L’escouade remonte victorieuse avec ${butin} composants.${nouvelleStrate ? ` Un nouvel étage est creusé : la Strate −${j.strate} est ouverte.` : ''}`
    : `L’escouade remonte avec ${butin} composants. Elle a besoin de repos.`);
  return { butin, nouvelleStrate, victoire, fragment, cartes, eclats };
}

function ajouterFragment(j: Jeu): string | null {
  const id = ORDRE_FRAGMENTS.find((f) => !j.fragments.includes(f));
  if (!id) return null;
  j.fragments.push(id);
  log(j, `Fragment d’archives trouvé : « ${fragmentDef(id)!.titre} ». Il est rangé dans le Codex.`);
  return id;
}

// ---------- La chambre scellée (combat guidé) ----------

/** Ordre de pioche du combat guidé : une leçon par tour */
const ORDRE_TUTO = ['ruee', 'morsure', 'murmure', 'carapace', 'tir', 'ruee', 'bond', 'charge', 'grogner', 'esquive'];

export function ouvrirChambre(j: Jeu, rng = graine()): Resultat {
  if (j.chambre) return non('La chambre est déjà ouverte.');
  if (j.expedition) return non('Une expédition est déjà en cours.');
  const escouade = ['ilka', 'doran', 'vela'];
  for (const id of escouade) if (j.porteurs[id]!.poste) j.porteurs[id]!.poste = null;
  const tout = [...escouade.flatMap((id) => gestesDe(j, id)), ...GESTES_SPECIAUX];
  const deck: GesteDef[] = [];
  for (const gid of ORDRE_TUTO) {
    const k = tout.findIndex((g) => g.id === gid);
    if (k >= 0) deck.push(...tout.splice(k, 1));
  }
  deck.push(...tout);
  const porteurs: PorteurEtat[] = escouade.map((id) => ({ id, pv: pvMaxCombat(j, id), pvMax: pvMaxCombat(j, id), aTerre: false }));
  j.expedition = nouvelleExpedition({ porteurs, deck, strate: 1, rng, sequence: ['remanent-faible'], force: 1, tutoriel: true });
  log(j, 'Ilka, Doran et Véla descendent vers la porte scellée.');
  return { ok: true };
}

/** La consigne du combat guidé, selon le tour */
export function leconTutoriel(tour: number): string {
  if (tour === 1) return 'Leçon 1 : touche 3 Gestes de ta main, puis « Lancer la chaîne ».';
  if (tour === 2) return 'Leçon 2 : pose un 3, puis un 4, puis un 5, dans cet ordre. Des chiffres qui se suivent font une Résonance : +30 % sur toute la chaîne.';
  if (tour === 3) return 'Leçon 3 : le Rémanent annonce une Lacération sur Doran. Pose des Gestes à bouclier : ils protègent toute l’escouade pendant son attaque.';
  return 'Tu as l’essentiel : vise les suites, protège-toi des grosses attaques annoncées. Achève-le !';
}

// ---------- Objectifs guidés ----------

export interface Objectif {
  titre: string;
  consigne: string;
  pilier: BatimentId;
  recompense: { energie?: number; composants?: number };
  fait: (j: Jeu) => boolean;
}

export const OBJECTIFS: Objectif[] = [
  {
    titre: 'Allumer le district', pilier: 'generateur',
    consigne: 'Touche le Générateur et poste Ilka au travail. Une Augmentée y produit deux fois plus.',
    recompense: { energie: 60 },
    fait: (j) => posteDe(j, 'generateur') === 'ilka',
  },
  {
    titre: 'Greffer une carte', pilier: 'noyau',
    consigne: 'Ouvre tes Cartes et greffe les Jambes à ressort sur Ilka : 2 Gestes plus forts remplacent Tir vif et Bond.',
    recompense: { composants: 10 },
    fait: (j) => j.porteurs.ilka!.modules.length > 0,
  },
  {
    titre: 'Descendre', pilier: 'noyau',
    consigne: 'Entre dans la Tour du Noyau et vaincs la Strate −1, sans Ilka qui travaille. Un nouvel étage se creusera.',
    recompense: { composants: 20 },
    fait: (j) => j.strate >= 2,
  },
];

export const objectifCourant = (j: Jeu): Objectif | null => (j.chambre ? OBJECTIFS[j.objectif] ?? null : null);

/** Récupère la récompense de l'objectif en cours s'il est rempli */
export function reclamer(j: Jeu): Resultat {
  const o = objectifCourant(j);
  if (!o || !o.fait(j)) return non('Objectif pas encore rempli.');
  j.energie = Math.min(stockage(j), j.energie + (o.recompense.energie ?? 0));
  j.composants += o.recompense.composants ?? 0;
  j.objectif++;
  log(j, `Objectif rempli : ${o.titre}.`);
  return { ok: true };
}

// ---------- Le résumé du retour ----------

/** Ce qui a avancé pendant l'absence : on ne liste que du positif, et une suggestion au plus */
export function resumeAbsence(avant: Jeu, apres: Jeu, nouvelles: string[]): string[] {
  const l: string[] = [];
  const de = Math.floor(apres.energie) - Math.floor(avant.energie);
  if (de > 0) l.push(`+${de} énergie${apres.energie >= stockage(apres) ? ' (stockage plein : pense à améliorer la Tour du Noyau)' : ''}`);
  l.push(...nouvelles);
  const remis = Object.keys(apres.porteurs).filter((id) => avant.porteurs[id]!.usure >= 1 && apres.porteurs[id]!.usure < 1);
  for (const id of remis) l.push(`${porteurDef(id).nom} est remis de son Usure`);
  const soignes = Object.keys(apres.porteurs).filter((id) => !remis.includes(id) && avant.porteurs[id]!.usure - apres.porteurs[id]!.usure >= 1);
  if (soignes.length) l.push(`La Clinique a soigné ${soignes.map((id) => porteurDef(id).nom).join(', ')}`);
  if (!l.length) return l;
  const amelio = apres.chantiers.length >= chantiersMax(apres) ? undefined : BATIMENTS.find((b) => { const c = coutAmelioration(apres, b.id); return !!c && !chantierDe(apres, b.id) && apres.energie >= c.energie && apres.composants >= c.composants && apres.eclats >= (c.eclats ?? 0) && (b.id === 'noyau' || apres.batiments[b.id] < apres.batiments.noyau); });
  if (amelio) l.push(`Tu peux améliorer : ${amelio.nom}`);
  else if (!apres.expedition && apres.chambre) l.push(`La Strate −${apres.strate} t’attend`);
  return l;
}

export { BATIMENTS, MODULES };
export type { Rarete };
