// L'état complet d'une partie : le district (ressources, bâtiments, Porteurs, Forge)
// et l'expédition en cours. Fonctions pures : le temps est toujours passé en paramètre (`now`, en ms),
// ce qui permet de rattraper le temps passé hors du jeu et de tester sans attendre.

import { BATIMENTS, GESTES_PORTEUR, GESTES_SPECIAUX, MODULES, PORTEURS, batimentDef, moduleDef, porteurDef } from './donnees';
import { ORDRE_FRAGMENTS, fragmentDef } from './fragments';
import { cloturerCombat, combatSuivant, nouvelleExpedition, type Expedition } from './expedition';
import { graine } from './rng';
import type { BatimentId, GesteDef, PorteurEtat } from './types';

export const VERSION_JEU = 2;

/** Réglages du district, au même endroit pour l'équilibrage */
export const DISTRICT = {
  /** énergie par heure selon le niveau du Générateur (index = niveau) */
  energieParHeure: [0, 60, 110, 180],
  /** stockage maximum selon le niveau du Noyau */
  stockage: [0, 300, 650, 1300],
  /** points d'Usure soignés par heure selon le niveau de la Clinique */
  soinParHeure: [0, 6, 10, 16],
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

export type Poste = Exclude<BatimentId, 'noyau'>;
export const POSTES: Poste[] = ['generateur', 'forge', 'clinique'];

export interface PorteurDistrict {
  usure: number;
  poste: Poste | null;
  modules: string[];
}

export interface Fabrication {
  moduleId: string;
  porteur: string;
  debut: number;
  fin: number;
}

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
}

export interface Resultat {
  ok: boolean;
  message?: string;
}

const non = (message: string): Resultat => ({ ok: false, message });

export function nouveauJeu(now: number): Jeu {
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
  };
}

export function estJeuValide(x: unknown): x is Jeu {
  const j = x as Jeu | null;
  if (!(!!j && j.version === VERSION_JEU && typeof j.energie === 'number' && !!j.batiments && !!j.porteurs)) return false;
  migrer(j);
  return true;
}

/** Complète une sauvegarde d'une version précédente avec les nouveaux champs */
function migrer(j: Jeu) {
  const ancien = j.chambre === undefined;
  j.chambre ??= ancien && j.strate > 1;
  j.recrues ??= ancien;
  j.objectif ??= ancien && j.strate > 1 ? OBJECTIFS.length : 0;
  j.fragments ??= [];
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

/** Durée de fabrication d'un Module, en ms (plus rapide avec un forgeron de la bonne lignée) */
export function dureeFabrication(j: Jeu, moduleId: string): number {
  const m = moduleDef(moduleId);
  const bonus = multiplicateur(j, 'forge');
  const niveau = 1 + 0.25 * (j.batiments.forge - 1);
  return Math.round((m.minutes * 60_000 * DISTRICT.bonusPoste) / (bonus * niveau));
}

export function coutAmelioration(j: Jeu, b: BatimentId) {
  const d = batimentDef(b);
  const n = j.batiments[b];
  return n >= d.niveauMax ? null : d.couts[n]!;
}

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
    const m = moduleDef(f.moduleId);
    const p = j.porteurs[f.porteur]!;
    if (p.modules.length < DISTRICT.modulesMax) p.modules.push(f.moduleId);
    j.forge = null;
    const t = `La Forge a terminé ${m.nom} : greffé sur ${porteurDef(f.porteur).nom}, 2 nouveaux Gestes.`;
    log(j, t);
    nouvelles.push(t);
  }
  return nouvelles;
}

// ---------- Actions du district ----------

export function ameliorer(j: Jeu, b: BatimentId): Resultat {
  const cout = coutAmelioration(j, b);
  if (!cout) return non('Niveau maximum atteint.');
  if (b !== 'noyau' && j.batiments[b] >= j.batiments.noyau) return non('Améliore d’abord la Tour du Noyau.');
  if (j.energie < cout.energie || j.composants < cout.composants) return non('Pas assez de ressources.');
  j.energie -= cout.energie;
  j.composants -= cout.composants;
  j.batiments[b]++;
  log(j, `${batimentDef(b).nom} passe au niveau ${j.batiments[b]}.`);
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

export function fabriquer(j: Jeu, moduleId: string, porteurId: string, now: number): Resultat {
  const m = moduleDef(moduleId);
  if (j.forge) return non('La Forge est déjà occupée.');
  if (!posteDe(j, 'forge')) return non('Il faut un Porteur au travail à la Forge.');
  const cible = j.porteurs[porteurId];
  if (!cible) return non('Porteur inconnu.');
  if (porteurDef(porteurId).lignee !== m.lignee) return non('Ce Module ne convient qu’à sa lignée.');
  if (cible.modules.length >= DISTRICT.modulesMax) return non('Ce Porteur a déjà 2 Modules.');
  if (j.energie < m.cout.energie || j.composants < m.cout.composants) return non('Pas assez de ressources.');
  j.energie -= m.cout.energie;
  j.composants -= m.cout.composants;
  j.forge = { moduleId, porteur: porteurId, debut: now, fin: now + dureeFabrication(j, moduleId) };
  log(j, `La Forge commence ${m.nom} pour ${porteurDef(porteurId).nom}.`);
  return { ok: true };
}

// ---------- Expéditions ----------

/** Les Gestes qu'un Porteur apporte : les siens + ceux de ses Modules */
export function gestesDe(j: Jeu, id: string): GesteDef[] {
  const base = GESTES_PORTEUR[id] ?? [];
  const mods = (j.porteurs[id]?.modules ?? []).flatMap((mid) =>
    moduleDef(mid).gestes.map((x, k) => ({ id: `${mid}-${k}`, porteur: id, ...x })),
  );
  return [...base, ...mods];
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
export interface Retour { butin: number; nouvelleStrate: boolean; victoire: boolean; fragment: string | null; tutoriel?: boolean }

export function remonter(j: Jeu): Retour {
  const x = j.expedition;
  if (!x) return { butin: 0, nouvelleStrate: false, victoire: false, fragment: null };
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
    return { butin, nouvelleStrate, victoire, fragment, tutoriel: true };
  }
  if (victoire && x.strate === j.strate) {
    j.strate++;
    nouvelleStrate = true;
    fragment = ajouterFragment(j);
  }
  j.expedition = null;
  log(j, victoire
    ? `L’escouade remonte victorieuse avec ${butin} composants.${nouvelleStrate ? ` Un nouvel étage est creusé : la Strate −${j.strate} est ouverte.` : ''}`
    : `L’escouade remonte avec ${butin} composants. Elle a besoin de repos.`);
  return { butin, nouvelleStrate, victoire, fragment };
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
    titre: 'Forger', pilier: 'forge',
    consigne: 'Poste une recrue à la Forge, puis fabrique un premier Module pour Ilka : 2 nouveaux Gestes pour le deck.',
    recompense: { composants: 10 },
    fait: (j) => !!j.forge || j.porteurs.ilka!.modules.length > 0,
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
  const amelio = BATIMENTS.find((b) => { const c = coutAmelioration(apres, b.id); return !!c && apres.energie >= c.energie && apres.composants >= c.composants && (b.id === 'noyau' || apres.batiments[b.id] < apres.batiments.noyau); });
  if (amelio) l.push(`Tu peux améliorer : ${amelio.nom}`);
  else if (!apres.expedition && apres.chambre) l.push(`La Strate −${apres.strate} t’attend`);
  return l;
}

export { BATIMENTS, MODULES };
