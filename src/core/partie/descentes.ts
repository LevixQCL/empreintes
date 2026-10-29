// Couche 5 — les descentes : départs (expédition, fouille ciblée, Épreuve), escouade, missions, exploration des Strates, chambre scellée.
// Fonctions pures : le temps est toujours passé en paramètre (`now`, en ms).

import { batimentDef, porteurDef, PORTEURS, BATIMENTS, CARTE_CHAMBRE, CLE_LEGS, GESTES_SPECIAUX, MODULES, moduleDe, moduleDef, ennemiDef, zoneDe } from '../donnees';
import { type Expedition, cloturerCombat, combatSuivant, entrerSalle, fuirAuDistrict, lancerCombat, nouvelleExpedition, peutRemonter, reculer, salleCourante, forceStrate, nouvelleExploration, type CibleFouille } from '../expedition';
import type { GesteDef, BonusMarques, PorteurEtat, Rarete, Lignee } from '../types';
import { COLLECTION, NIVEAU_METAL, ajouterCarte, cartesEnJeu, niveauRequis, placesVides, tirerChoix, tirerTrouvaille } from '../collection';
import { ORDRE_FRAGMENTS, fragmentDef } from '../fragments';
import { FILS } from '../fils';
import { graine, tireur } from '../rng';
import { ACCORD_OUVERT, CONFIANCE, naufragesDeLaStrate, niveauConfiance, chargeMax, chargePortee, CREUSEURS, DISTRICT, LECTURE_PROFONDE, RAPPORTS_LUS_MAX, XP, bonusEscouade, confier, enExpedition, enMission, escouadeActive, escouadeDe, escouadesDe, gagnerXp, jourDe, NB_ESCOUADES, log, niveauPorteur, non, porteursPresents, progresMarque, pvMaxCombat, semaineDe, stockage, strateVaincue, type DureeMission, type Jeu, type Mission, type Poste, type RapportMission, type Resultat, usureMax } from './etat';
import { barquesMax, chantierDe, chantiersMax, coutAmelioration, creuser, gagnerCreuseurs, progresser } from './district';
import { donnerKitRecrues, niveauLegsPour, quitterPostes, refus } from './recompenses';
import { noterCombat, noterExpedition } from './stats';
import { noterOrigine, noterVecu } from './vecu';
import { LIEUX, RECIT_BON, RECIT_MAUVAIS, RECIT_NEUTRE, affinite, lieuDef, type Affinite, type LieuDef, type SpecialiteLieu } from '../lieux';

// ---------- Expéditions ----------

/** Les cartes qu'un Porteur apporte au deck de combat : celles qu'on lui a confiées, à leur niveau */
export function gestesDe(j: Jeu, id: string): GesteDef[] {
  const cartes = (j.porteurs[id]?.modules ?? []).filter((k) => j.collection[k]).map((k) => ({ id: k, niveau: j.collection[k]!.niveau }));
  const jeu = cartesEnJeu(id, cartes);
  // après la dernière lecture, Véla joue en plus sa Lecture profonde
  if (id === 'vela' && j.actes.lecture === 'autoriser') jeu.push(LECTURE_PROFONDE);
  return jeu;
}

/** Le deck de combat d'une escouade : les cartes de ses Porteurs, plus les cartes du district */
export const deckEscouade = (j: Jeu, escouade: string[]): GesteDef[] => {
  const cle = cleDuLegs(j, escouade);
  return [...escouade.flatMap((id) => gestesDe(j, id)), ...GESTES_SPECIAUX, ...(cle ? [cle] : [])];
};

/** La Clé de l’Héritage, si le joueur l'a choisie et qu'un Porteur de l'escouade a le niveau de la nacre ; sa force suit le plus avancé */
export function cleDuLegs(j: Jeu, escouade: string[]): GesteDef | null {
  if (j.legs !== 'cle' || !escouade.length) return null;
  const n = Math.max(...escouade.map((id) => niveauPorteur(j, id).niveau));
  if (n < NIVEAU_METAL.nacre) return null;
  return { ...CLE_LEGS, v: Math.round(CLE_LEGS.v * (1 + COLLECTION.bonusNiveau * (niveauLegsPour(n) - COLLECTION.niveauDepart.nacre))) };
}

/** Les Porteurs de l'histoire qui rejoignent le district quand leur moment arrive ; renvoie les annonces */
export function verifierArrivees(j: Jeu): string[] {
  if (!j.chambre) return [];
  const annonces: string[] = [];
  for (const p of PORTEURS) {
    const a = p.arrivee;
    if (!a || j.arrives.includes(p.id)) continue;
    if ((a.strate && j.strate < a.strate) || (a.forge && j.batiments.forge < a.forge)) continue;
    if (a.accord && !accordOuvertPret(j)) continue;
    j.arrives.push(p.id);
    const t = a.accord
      ? `La Clinique a organisé un Accord ouvert : quarante volontaires, une seule pierre. Elle a pris sur ${p.nom}, et tout le quartier a veillé sa Nuit blanche. « ${a.replique} »`
      : `${p.nom} rejoint le district. « ${a.replique} »`;
    log(j, t);
    annonces.push(t);
  }
  return annonces;
}

/** Fait avancer les fils des Porteurs dont la condition est remplie ; renvoie les annonces */
export function avancerFils(j: Jeu): string[] {
  if (!j.chambre) return [];
  j.fils ??= {};
  const presents = porteursPresents(j);
  const c = { niveau: (id: string) => (j.porteurs[id] ? niveauPorteur(j, id).niveau : 0), present: (id: string) => presents.includes(id),
    strate: j.strate, fragments: j.fragments, batiments: j.batiments };
  const annonces: string[] = [];
  for (const [id, fil] of Object.entries(FILS)) {
    if (!presents.includes(id)) continue;
    let n = j.fils[id] ?? 0;
    while (n < fil.etapes.length && fil.etapes[n]!.test(c)) {
      const e = fil.etapes[n]!;
      j.fils[id] = ++n;
      gagnerXp(j, id, e.xp);
      if (e.confiance) confier(j, e.confiance);
      const t = `${porteurDef(id).nom} · ${fil.titre} : « ${e.titre} » (+${e.xp} XP). À lire dans sa fiche.`;
      log(j, t);
      annonces.push(t);
    }
  }
  return annonces;
}

const accordOuvertPret = (j: Jeu) => j.batiments.clinique >= ACCORD_OUVERT.clinique && niveauConfiance(j.confiance ?? 0).niveau >= ACCORD_OUVERT.confiance;

export function disponibles(j: Jeu): string[] {
  return porteursPresents(j).filter((id) => !j.porteurs[id]!.poste && !enExpedition(j, id));
}

// ---------- Mon escouade (décision du 23 octobre 2026) ----------
// L'onglet Porteurs s'ouvre sur l'escouade : les trois qui descendent. On la compose au district, et elle est
// verrouillée pendant une descente : impossible de changer de Porteurs entre deux salles.

/** L'escouade de départ : Ilka, Doran et Véla */
export const ESCOUADE_DEPART = ['ilka', 'doran', 'vela'] as const;

/** Pourquoi l'escouade ne peut pas changer maintenant (null = elle peut) */
export function escouadeVerrouillee(j: Jeu): string | null {
  return j.expedition ? 'L’escouade est en descente : elle ne change qu’au district.' : null;
}

/** Pourquoi un Porteur ne peut pas entrer dans l'escouade (null = il peut).
 * Un Porteur au travail peut entrer (demande du 23 octobre 2026) : il quitte son poste au départ, qui reste vacant
 * (voir posteQuitte). Seuls bloquent : pas encore arrivé, en mission, ou forgeron d'une fabrication en cours. */
export function raisonHorsEscouade(j: Jeu, id: string): string | null {
  if (!porteursPresents(j).includes(id)) return 'Pas encore arrivé au district.';
  if (enMission(j, id)) return 'En mission.';
  if (j.porteurs[id]?.poste === 'forge' && j.forge) return 'Au travail · Forge (fabrication en cours).';
  return null;
}

/** Le poste qu'un Porteur laissera vacant s'il descend (null : il ne travaille pas) */
export function posteQuitte(j: Jeu, id: string): Poste | null {
  return j.porteurs[id]?.poste ?? null;
}

/** Ce que dit l'avertissement : « la Clinique restera sans Porteur », « il ne s'entraînera plus à la Tour » */
export function textePosteQuitte(j: Jeu, id: string): string | null {
  const b = posteQuitte(j, id);
  if (!b) return null;
  return b === 'noyau' ? 'quitte l’entraînement à la Tour du Noyau' : `quitte son poste : ${batimentDef(b).nom} restera vacant`;
}

/** Enregistre les trois escouades ; celle qui descend est recopiée dans `j.escouade` */
function ranger(j: Jeu, toutes: string[][]): void {
  j.escouades = toutes.map((l) => l.slice(0, 3));
  j.escouade = [...j.escouades[escouadeActive(j)]!];
}

/** Retient l'escouade qui part (l'écran de départ a pu la changer) : elle devient celle qui descend,
 * et ses Porteurs quittent les autres escouades */
function retenirDepart(j: Jeu, escouade: string[]): void {
  const a = escouadeActive(j);
  ranger(j, escouadesDe(j).map((l, k) => (k === a ? [...escouade] : l.filter((id) => !escouade.includes(id)))));
}

/**
 * Place un Porteur à la place `place` (0 à 2) de l'escouade `n` (par défaut, celle qui descend).
 * Déjà dans cette escouade : les deux échangent leur place. Dans une autre escouade : il la quitte,
 * et le Porteur qu'il remplace prend sa place là-bas (un Porteur n'est que dans une seule escouade).
 */
export function placerDansEscouade(j: Jeu, place: number, id: string, n = escouadeActive(j)): Resultat {
  const verrou = escouadeVerrouillee(j);
  if (verrou) return non(verrou);
  if (!Number.isInteger(place) || place < 0 || place > 2) return non('Place inconnue.');
  if (!Number.isInteger(n) || n < 0 || n >= NB_ESCOUADES) return non('Escouade inconnue.');
  const toutes = escouadesDe(j).map((l) => [...l]);
  const suite = toutes[n]!;
  const ancienne = suite.indexOf(id);
  const ailleurs = toutes.findIndex((l, k) => k !== n && l.includes(id));
  if (ancienne < 0) {
    const raison = raisonHorsEscouade(j, id);
    if (raison) return non(`${porteurDef(id).nom} ne peut pas rejoindre l’escouade : ${raison.charAt(0).toLowerCase()}${raison.slice(1)}`);
  }
  if (ancienne >= 0) {
    if (ancienne === place) return { ok: true };
    const autre = suite[place];
    suite[place] = id;
    if (autre) suite[ancienne] = autre; else suite.splice(ancienne, 1);
  } else {
    const sortant = place < suite.length ? suite[place]! : null;
    if (sortant) suite[place] = id; else suite.push(id);
    if (ailleurs >= 0) {
      // il quitte son autre escouade ; celui qu'il remplace prend sa place là-bas
      const la = toutes[ailleurs]!;
      const q = la.indexOf(id);
      if (sortant) la[q] = sortant; else la.splice(q, 1);
    }
    log(j, sortant ? `${porteurDef(id).nom} remplace ${porteurDef(sortant).nom} dans l’escouade ${n + 1}.` : `${porteurDef(id).nom} rejoint l’escouade ${n + 1}.`);
  }
  ranger(j, toutes);
  return { ok: true };
}

/** Choisit l'escouade qui descend (0 à 2) */
export function choisirEscouade(j: Jeu, n: number): Resultat {
  const verrou = escouadeVerrouillee(j);
  if (verrou) return non(verrou);
  if (!Number.isInteger(n) || n < 0 || n >= NB_ESCOUADES) return non('Escouade inconnue.');
  const toutes = escouadesDe(j);
  if (!toutes[n]!.length) return non('Cette escouade est vide : choisis-lui d’abord des Porteurs.');
  j.escouadeActive = n;
  ranger(j, toutes);
  log(j, `L’escouade ${n + 1} descendra la prochaine fois.`);
  return { ok: true };
}

/** Les Porteurs proposés au départ : l'escouade enregistrée (même au travail : ils quitteront leur poste),
 * complétée par des Porteurs libres si l'un d'eux ne peut vraiment pas partir */
export function escouadePourDepart(j: Jeu, interdits: readonly string[] = []): string[] {
  const peut = (id: string) => !interdits.includes(id) && !enExpedition(j, id) && !raisonHorsEscouade(j, id);
  const garde = escouadeDe(j).filter(peut);
  const libres = disponibles(j).filter((id) => peut(id) && !garde.includes(id));
  return [...garde, ...libres].slice(0, 3);
}

// ---------- Les missions ----------
// Un Porteur qui ne travaille pas et ne descend pas peut partir en mission dans la dernière Strate vaincue.
// La mission tourne même jeu fermé ; au retour, il rapporte des composants et des doublons de cartes de sa lignée.

export const MISSIONS = {
  // l'énergie au départ (23 octobre 2026) : vivres, lampes et piles pour l'expédition
  courte: { heures: 2, composants: 14, doublons: 1, nouvelle: 0, usure: 4, energie: 30 },
  longue: { heures: 8, composants: 45, doublons: 2, nouvelle: 0.35, usure: 8, energie: 100 },
  // le Porteur compte (28 octobre 2026, Bryan) : son niveau et son affinité avec le lieu multiplient le butin et l'XP (jamais les creuseurs)
  parNiveau: 0.03,
  affinite: { bon: 1.3, neutre: 1, mauvais: 0.8 },
  /** le mauvais Porteur au mauvais endroit rentre plus usé */
  usureMauvais: 2,
  /**
   * Le butin annoncé de chaque destination (28 octobre 2026, Bryan : « parfois une carte plutôt que des pièces ») :
   * compo = part des composants d'une mission ordinaire. Chaque semaine, 21 destinations, 7 par lignée,
   * et pour chaque lignée 2 cargaisons, 2 pierres, 2 naufragés, 1 éclats : aucune classe n'est avantagée sur la semaine.
   * Missions illimitées (28 octobre 2026), réglées au robot sur 16 parties : Strate −10 au jour 30 (occasionnel), 20 (assidu)
   * et 17 (acharné, 8 sessions par jour en missions de 2 h), contre 32, 20 et 20 avec l'ancienne limite de destinations.
   */
  butins: {
    cargaison: { compo: 1.4 },
    pierre: { compo: 0.4, nouvelle: { courte: 0.4, longue: 0.6 }, nouvelleMax: 0.9 },
    // les naufragés d'un lieu ne montent qu'une fois par jour dans une barque (la première) ; la même durée ou presque
    // rapporte un creuseur, pour ne plus forcer les missions longues. Une barque arrivée après (ou au-delà du plafond
    // de la Strate) trouve le lieu vide de monde : elle ramène des composants comme une cargaison ordinaire.
    naufrages: { compo: 0.4, compoPlafond: 1, creuseurs: { courte: 1, longue: 1.5 } },
    eclats: { compo: 0.4, eclats: { courte: 1, longue: 1.5 } },
  },
  parLignee: { cargaison: 2, pierre: 2, naufrages: 2, eclats: 1 },
  /** le nombre de destinations de chaque jour de la semaine (mélangé chaque semaine) : 21 en tout */
  parJour: [2, 2, 2, 3, 3, 4, 5],
  /**
   * Missions illimitées (28 octobre 2026) : les premiers départs du jour reviennent pleins, les suivants rapportent moins,
   * parce que le passeur va chercher plus loin des ruines déjà fouillées. Par paquets de `pleines` départs : 100 %, puis 50 %, puis 25 %.
   * L'XP reste entière (on peut toujours monter ses Porteurs de réserve) ; les creuseurs ont leur propre plafond par Strate.
   */
  pleines: 4,
  rendements: [1, 0.5, 0.25],
} as const;

/** Les départs déjà faits aujourd'hui */
export const departsDuJour = (j: Jeu, now: number): number => (j.departsJour?.jour === jourDe(now) ? j.departsJour.n : 0);

/** La part du butin du prochain départ (1 = pleine cargaison), et combien de départs il reste à ce rendement */
export function rendementMission(j: Jeu, now: number): { part: number; restants: number } {
  const n = departsDuJour(j, now);
  const bloc = Math.floor(n / MISSIONS.pleines);
  const r = MISSIONS.rendements;
  return { part: r[Math.min(bloc, r.length - 1)]!, restants: bloc >= r.length - 1 ? Infinity : MISSIONS.pleines * (bloc + 1) - n };
}

/** Le niveau des missions : celui de la dernière Strate vaincue (il fixe les gains) */
export const strateMission = (j: Jeu) => strateVaincue(j);

export type Butin = keyof typeof MISSIONS.butins;
export const NOM_BUTIN: Record<Butin, string> = { cargaison: 'Cargaison', pierre: 'Pierre oubliée', naufrages: 'Naufragés', eclats: 'Éclats' };
/** Une destination du jour : un lieu, son butin annoncé, et sa clé (une seule barque par destination) */
export interface Destination { cle: string; lieu: LieuDef; butin: Butin }

/** Le multiplicateur de butin d'un Porteur envoyé vers un lieu : niveau (+3 % par niveau) × affinité */
export function bonusMission(j: Jeu, porteur: string, lieu: string): { affinite: Affinite; mult: number; niveau: number } {
  const l = lieuDef(lieu);
  const a = l ? affinite(l.lignee, porteurDef(porteur).lignee) : 'neutre';
  const niveau = j.porteurs[porteur] ? niveauPorteur(j, porteur).niveau : 1;
  return { affinite: a, mult: (1 + MISSIONS.parNiveau * (niveau - 1)) * MISSIONS.affinite[a], niveau };
}

/** Les composants que rapporterait une mission (pour l'afficher avant le départ) */
export function composantsMission(j: Jeu, porteur: string, lieu: string, duree: DureeMission, butin: Butin, strate = strateMission(j), rendement = 1, secours = !naufragesPleins(j)): number {
  const part = butin === 'naufrages' && !secours ? MISSIONS.butins.naufrages.compoPlafond : MISSIONS.butins[butin].compo;
  return Math.round(MISSIONS[duree].composants * (1 + 0.25 * (strate - 1)) * part * bonusMission(j, porteur, lieu).mult * rendement);
}

/** La chance de ramener une carte nouvelle (destination « Pierre oubliée ») ; sinon c'est un doublon */
export const chanceNouvelleMission = (mult: number, duree: DureeMission) => Math.min(MISSIONS.butins.pierre.nouvelleMax, MISSIONS.butins.pierre.nouvelle[duree] * mult);

const TENDANCE: Record<Butin, SpecialiteLieu | null> = { cargaison: 'composants', pierre: 'cartes', naufrages: 'rescapes', eclats: null };

/**
 * Les destinations du jour au Port : de 2 à 5 selon le jour, les mêmes pour tous, qui changent à 4 h.
 * Tirées par semaine : chaque lignée a autant de lieux et de chaque butin. Un lieu va de préférence avec le butin de sa spécialité.
 */
export function destinationsDuJour(now: number): Destination[] {
  const jour = jourDe(now);
  const semaine = Math.floor(jour / 7);
  const t = tireur({ rng: (Math.imul(semaine + 1, 2654435761) ^ 0x5eed) >>> 0 });
  const slots: { lignee: Lignee; butin: Butin }[] = [];
  for (const lg of ['tech', 'bio', 'reso'] as const)
    for (const [b, n] of Object.entries(MISSIONS.parLignee) as [Butin, number][]) for (let k = 0; k < n; k++) slots.push({ lignee: lg, butin: b });
  const melange = t.melanger(slots);
  const comptes = t.melanger([...MISSIONS.parJour]);
  const idx = ((jour % 7) + 7) % 7;
  const debut = comptes.slice(0, idx).reduce((a, n) => a + n, 0);
  const choix: Destination[] = [];
  melange.slice(debut, debut + comptes[idx]!).forEach((sl, i) => {
    const pris = new Set(choix.map((d) => d.lieu.id));
    const libres = LIEUX.filter((l) => l.lignee === sl.lignee && !pris.has(l.id));
    const tend = libres.filter((l) => l.specialite === TENDANCE[sl.butin]);
    const liste = tend.length ? tend : libres;
    // le lieu suit le jour : la même destination ne revient pas tous les jours
    const lieu = liste[(((jour + i) % liste.length) + liste.length) % liste.length]!;
    choix.push({ cle: `${jour}-${i}`, lieu, butin: sl.butin });
  });
  return choix;
}

/** Les barques en mer vers chaque destination du jour (missions illimitées depuis le 28 octobre 2026 : on y retourne autant qu'on veut) */
export const barquesVers = (j: Jeu, d: Destination): number => j.missions.filter((m) => m.lieu === d.lieu.id && m.butin === d.butin).length;

/** Les naufragés ramènent-ils encore des creuseurs pendant cette Strate ? Sinon, ils paient leur passage en composants */
export const naufragesPleins = (j: Jeu): boolean => naufragesDeLaStrate(j).restants === 0;

/** Des naufragés attendent-ils encore à cette destination aujourd'hui ? (une seule barque les recueille par jour, dans le plafond de la Strate) */
export const secoursPossible = (j: Jeu, d: Destination, now: number): boolean =>
  d.butin === 'naufrages' && !naufragesPleins(j) && !(j.secoursJour?.jour === jourDe(now) && j.secoursJour.cles.includes(d.cle));

/**
 * Les missions en mer (28 octobre 2026, Bryan : les missions partent du Port) : un Porteur prend le bateau du passeur
 * vers un pilier abandonné ou une ruine noyée, et en revient avec ce qu'il a récupéré. Le lieu ne change rien aux gains :
 * il est tiré de l'heure de retour et du Porteur, toujours le même pour une mission donnée.
 */
export const LIEUX_MISSION = [
  'le phare couché de Basse-Lune', 'les serres noyées du Jardin d’Hiver', 'le pilier effondré de Sombreverse',
  'la station de pompage engloutie', 'les toits du vieux marché des Basses-Eaux', 'l’épave du transbordeur Héron',
  'la gare suspendue à demi noyée', 'les silos de la digue rompue', 'le pilier sans nom au large de Brume-Haute',
  'l’usine de dessalement abandonnée', 'les quais morts de l’ancienne criée', 'le clocher de verre sous la marée',
] as const;
export function lieuMission(m: { porteur: string; fin: number; lieu?: string }): string {
  const l = m.lieu ? lieuDef(m.lieu) : undefined;
  if (l) return l.nom;
  const h = [...m.porteur].reduce((a, c) => (Math.imul(a, 31) + c.charCodeAt(0)) >>> 0, (m.fin / 60_000) >>> 0);
  return LIEUX_MISSION[h % LIEUX_MISSION.length]!;
}

/** L'id du lieu d'une mission (les anciennes missions sans lieu retrouvent le leur d'après leur nom) */
export const lieuIdMission = (m: { porteur: string; fin: number; lieu?: string }): string | undefined =>
  m.lieu ?? LIEUX.find((l) => l.nom === lieuMission(m))?.id;

/**
 * Envoie un Porteur en mer vers une destination du jour (par sa clé). Sans clé, il part vers la meilleure destination
 * pour lui (le robot et les tests). Plus de destination « prise » : seules les barques limitent les départs.
 */
export function envoyerMission(j: Jeu, id: string, duree: DureeMission, now: number, cle?: string): Resultat {
  const m = MISSIONS[duree];
  if (!m) return non('Durée inconnue.');
  const libres = destinationsDuJour(now);
  const lg = porteurDef(id)?.lignee;
  const rang = { bon: 0, neutre: 1, mauvais: 2 } as const;
  const dest = cle ? libres.find((d) => d.cle === cle)
    : libres.slice().sort((a, b) => (lg ? rang[affinite(a.lieu.lignee, lg)] - rang[affinite(b.lieu.lignee, lg)] : 0))[0];
  if (!dest) return non(cle ? 'Cette destination n’est plus au programme du passeur : de nouvelles s’ouvrent chaque jour à 4 h.' : 'Aucune destination aujourd’hui.');
  if (!j.chambre || strateMission(j) < 1) return non('Il faut avoir vaincu une Strate pour y envoyer quelqu’un.');
  if (!porteursPresents(j).includes(id)) return non('Porteur inconnu.');
  if (j.porteurs[id]!.poste) return non(`${porteurDef(id).nom} travaille au district.`);
  if (enExpedition(j, id)) return non(`${porteurDef(id).nom} n’est pas au district.`);
  const nb = barquesMax(j);
  if (j.missions.length >= nb) return non(nb > 1 ? `${nb} barques au plus en mer en même temps : monte la Tour du Noyau pour en armer d’autres.` : 'Une seule barque en mer à la fois : monte la Tour du Noyau pour en armer d’autres.');
  if (j.energie < m.energie) return non(`Il faut ${m.energie} énergie pour équiper la mission.`);
  j.energie -= m.energie;
  const rendement = rendementMission(j, now).part;
  const secours = secoursPossible(j, dest, now);
  if (secours) j.secoursJour = { jour: jourDe(now), cles: [...(j.secoursJour?.jour === jourDe(now) ? j.secoursJour.cles : []), dest.cle] };
  j.missions.push({ porteur: id, strate: strateMission(j), duree, debut: now, fin: now + m.heures * 3_600_000, lieu: dest.lieu.id, butin: dest.butin, rendement, ...(dest.butin === 'naufrages' ? { secours } : {}) });
  j.departsJour = { jour: jourDe(now), n: departsDuJour(j, now) + 1 };
  log(j, `${porteurDef(id).nom} prend le bateau vers ${lieuMission(j.missions[j.missions.length - 1]!)} (${m.heures} h).`);
  return { ok: true };
}

/** Le retour d'une mission (appelé par tick) : range un rapport à lire au district et renvoie l'annonce */
export function retourDeMission(j: Jeu, m: Mission): string {
  const d = MISSIONS[m.duree];
  const p = porteurDef(m.porteur);
  const lieuId = lieuIdMission(m);
  const b = lieuId ? bonusMission(j, m.porteur, lieuId) : { affinite: 'neutre' as Affinite, mult: 1 };
  const t = tireur(j);
  const sf = 1 + 0.25 * (m.strate - 1);
  const cartes: string[] = [];
  let composants: number;
  let recrues = 0;
  let eclats = 0;
  // des doublons de cartes qu'on a déjà, dans la lignée du Porteur (fer et cuivre)
  const possedees = Object.keys(j.collection).filter((k) => moduleDef(k).lignee === p.lignee && ['fer', 'cuivre'].includes(moduleDef(k).rarete));
  if (m.butin && lieuId) {
    // le butin annoncé de la destination (28 octobre 2026)
    const bt = MISSIONS.butins;
    const rd = m.rendement ?? 1;
    // les naufragés recueillis au départ, et encore dans le plafond de la Strate au retour
    const secours = m.butin === 'naufrages' && (m.secours ?? true) && !naufragesPleins(j);
    composants = composantsMission(j, m.porteur, lieuId, m.duree, m.butin, m.strate, rd, secours);
    // une ruine déjà fouillée n'a plus toujours sa pierre : la carte devient une chance égale au rendement
    if (m.butin === 'pierre' && (rd >= 1 || t.nombre() < rd)) {
      // une carte à coup sûr : nouvelle (fer, ou cuivre en mission longue) ou un doublon de sa lignée
      if (!possedees.length || t.nombre() < chanceNouvelleMission(b.mult, m.duree)) cartes.push(tirerTrouvaille(j, m.strate, m.duree === 'longue' ? 'cuivre' : 'fer', p.lignee));
      else cartes.push(possedees[t.entier(possedees.length)]!);
    }
    if (secours) { const c = bt.naufrages.creuseurs[m.duree]; recrues = Math.floor(c) + (t.nombre() < c % 1 ? 1 : 0); }
    if (m.butin === 'eclats') { const e = bt.eclats.eclats[m.duree] * b.mult * rd; eclats = Math.floor(e) + (t.nombre() < e % 1 ? 1 : 0); j.eclats += eclats; }
  } else {
    // une mission partie avant le 28 octobre 2026 : les gains d'avant
    composants = Math.round(d.composants * sf);
    for (let k = 0; k < d.doublons && possedees.length; k++) cartes.push(possedees[t.entier(possedees.length)]!);
    if (t.nombre() < d.nouvelle) cartes.push(tirerTrouvaille(j, m.strate, 'fer', p.lignee));
    recrues = t.nombre() < (m.duree === 'longue' ? CREUSEURS.missionLongue : CREUSEURS.missionCourte) ? 1 : 0;
  }
  // le plafond de la Strate (missions illimitées) : au-delà, les naufragés restent au Port
  const nf = naufragesDeLaStrate(j);
  recrues = Math.min(recrues, nf.restants);
  j.composants += composants;
  const trouvees = cartes.map((c) => ({ id: c, nouvelle: ajouterCarte(j, c) }));
  const arrives = recrues ? gagnerCreuseurs(j, recrues, `${p.nom} ramène des naufragés`) : 0;
  if (arrives) { j.naufrages = { strate: j.strate, n: nf.ramenes + arrives }; creuser(j); }
  const q = j.porteurs[m.porteur]!;
  const usureAvant = q.usure;
  q.usure = Math.min(usureMax(m.porteur), q.usure + d.usure + (b.affinite === 'mauvais' ? MISSIONS.usureMauvais : 0));
  const avantMarque = progresMarque(j, m.porteur)?.acquise;
  q.faits = { ...q.faits, missions: (q.faits?.missions ?? 0) + 1 };
  const marque = progresMarque(j, m.porteur);
  const nouvelleMarque = marque?.acquise && !avantMarque ? marque : null;
  if (nouvelleMarque) log(j, `${p.nom} gagne la Marque ${nouvelleMarque.nom} : ${nouvelleMarque.texte}`);
  const gainXp = Math.round(XP.missionHeure * d.heures * sf * b.mult);
  const monte = gagnerXp(j, m.porteur, gainXp);
  const texte = `${p.nom} rentre de mission : +${composants} composants, +${gainXp} XP${monte ? ` (niveau ${monte})` : ''}${cartes.length ? `, ${cartes.map((c) => moduleDef(c).nom).join(', ')}` : ''}${arrives ? `, +${arrives} creuseur${arrives > 1 ? 's' : ''}` : ''}${eclats ? `, +${eclats} Éclat${eclats > 1 ? 's' : ''}` : ''}.`;
  log(j, texte);
  const rapport: RapportMission = {
    porteur: m.porteur, strate: m.strate, duree: m.duree, fin: m.fin, lieu: lieuId, butin: m.butin, eclats, rendement: m.rendement ?? 1, affinite: b.affinite, mult: Math.round(b.mult * 100) / 100, recit: [],
    composants, xp: gainXp, niveau: monte || null, cartes: trouvees, creuseurs: arrives,
    usure: Math.round((q.usure - usureAvant) * 10) / 10, marque: nouvelleMarque ? nouvelleMarque.nom : null, lu: false,
  };
  rapport.recit = recitMission(rapport);
  rangerRapport(j, rapport);
  return texte;
}

/** Range un rapport : les non lus restent tous, on ne garde que les derniers lus */
function rangerRapport(j: Jeu, r?: RapportMission) {
  const tous = [...(j.rapports ?? []), ...(r ? [r] : [])].sort((x, y) => x.fin - y.fin);
  const garder = new Set(tous.filter((x) => x.lu).slice(-RAPPORTS_LUS_MAX));
  j.rapports = tous.filter((x) => !x.lu || garder.has(x));
}

/** Le rapport à lire en premier (le plus ancien pas encore lu) */
export const rapportALire = (j: Jeu) => (j.rapports ?? []).find((x) => !x.lu) ?? null;

/** Marque comme lu le plus ancien rapport pas encore lu */
export function lireRapport(j: Jeu): Resultat {
  const r = rapportALire(j);
  if (!r) return non('Aucun rapport à lire.');
  r.lu = true;
  rangerRapport(j);
  return { ok: true };
}

/**
 * Le petit récit d'une mission : quelques phrases choisies selon ce qui s'est passé.
 * Le choix des tournures ne touche pas au hasard des trouvailles (il dépend seulement de la mission elle-même).
 */
export function recitMission(r: RapportMission): string[] {
  const nom = porteurDef(r.porteur).nom;
  const lieu = lieuMission(r);
  let h = (r.fin >>> 0) ^ [...r.porteur].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7);
  const choisir = <T,>(l: T[]): T => { h = (Math.imul(h ^ (h >>> 15), 2246822507) + 0x9e3779b9) >>> 0; return l[h % l.length]!; };
  const heures = MISSIONS[r.duree].heures;
  const recit: string[] = [];
  const l = r.lieu ? lieuDef(r.lieu) : undefined;
  const avec = (t: string) => t.replaceAll('{nom}', nom);
  if (l) {
    recit.push(avec(l.arrivee));
    const a = r.affinite ?? 'neutre';
    recit.push(a === 'bon' ? avec(RECIT_BON[l.lignee]) : a === 'mauvais' ? avec(RECIT_MAUVAIS[l.lignee]) : RECIT_NEUTRE);
  } else recit.push(choisir([
    `Le passeur a déposé ${nom} devant ${lieu}, à marée basse.`,
    `${heures} heures de mer : ${nom} a gagné ${lieu} sur la barque du passeur.`,
    `Lampe à algues au poing, ${nom} a plongé dans ${lieu}, salle après salle.`,
    `Au lever du brouillard, la barque a touché ${lieu}. ${nom} est monté seul.`,
  ]));
  if ((r.rendement ?? 1) < 1) recit.push(`D’autres barques étaient passées avant aujourd’hui : ${nom} a dû chercher plus loin, dans des salles à moitié vidées.`);
  if (r.butin === 'naufrages' && !r.creuseurs) recit.push('Plus personne à recueillir sur place : les naufragés étaient déjà partis. La barque est revenue chargée de matériel.');
  recit.push(choisir([
    `Sous l’eau dormait encore du matériel d’avant : ${r.composants} composants hissés à bord.`,
    `Une réserve oubliée, au sec sous un toit effondré : ${r.composants} composants rapportés au district.`,
    `Des machines noyées, démontées pièce par pièce : ${r.composants} composants.`,
  ]));
  const nouvelles = r.cartes.filter((c) => c.nouvelle);
  const doublons = r.cartes.filter((c) => !c.nouvelle);
  for (const c of nouvelles) {
    const md = moduleDef(c.id);
    recit.push(choisir([
      `Dans un coffre scellé par le sel, une pierre jamais vue : ${md.nom}. Elle rejoint tes cartes.`,
      `Au fond d’une salle noyée, ${nom} a trouvé ce que personne n’avait encore rapporté : ${md.nom}.`,
    ]));
  }
  if (doublons.length) {
    const noms = [...new Set(doublons.map((c) => moduleDef(c.id).nom))];
    recit.push(choisir([
      `${nom} a reconnu des pierres familières : ${noms.join(', ')}. De quoi faire monter des cartes.`,
      `Des éclats de sa propre lignée attendaient dans les ruines : ${noms.join(', ')}.`,
    ]));
  }
  if (!r.cartes.length) recit.push('Aucune pierre à rapporter cette fois : les ruines étaient muettes.');
  if (r.creuseurs) recit.push(`Des rescapés vivaient sur place : ils sont montés dans la barque et creuseront pour toi (+${r.creuseurs} creuseur${r.creuseurs > 1 ? 's' : ''}).`);
  if (r.marque) recit.push(`Un exploit qui ne s’oublie pas : ${nom} gagne la Marque ${r.marque}.`);
  if (r.niveau) recit.push(`L’expérience paie : ${nom} passe au niveau ${r.niveau}.`);
  recit.push(r.usure > 0
    ? choisir([`Le retour s’est fait sans encombre, mais l’eau froide laisse des traces : la Clinique s’en chargera.`, `${nom} rentre trempé et fourbu : un peu de repos à la Clinique ne sera pas de trop.`])
    : `${nom} rentre sans une égratignure.`);
  return recit;
}

// ---------- L'exploration des Strates ----------

/** Les rencontres en route : chacune propose un petit choix qui touche au butin, aux PV ou au district */
export const RENCONTRES: Record<string, (j: Jeu) => { titre: string; texte: string; options: string[] }> = {
  veilleur: () => ({ titre: 'Un Veilleur sous les gravats', texte: 'Un fouilleur des Veilleurs de Sédime est coincé sous un éboulis. Il tient serré contre lui un carnet couvert de croquis.',
    options: ['Le dégager et le soigner (−4 PV chacun)', 'Prendre son carnet et repartir', 'Passer ton chemin'] }),
  pilleur: () => ({ titre: 'Un pilleur acculé', texte: 'Un pilleur de Strates, dos au mur, serre un sac plein de cristaux. Il ne cherche pas la bagarre.',
    options: ['Le laisser filer', 'Lui prendre son sac', 'L’affronter pour tout récupérer'] }),
  brigade: (j) => (j.actes.chambre === 'orseve'
    ? { titre: 'Une patrouille alliée', texte: 'Une patrouille des Brigades du Serment de Veyr vous salue : depuis l’accord avec la Maison Orsève, vous êtes du même côté.',
      options: ['Accepter leurs soins (+25 % de PV)', 'Les saluer et continuer'] }
    : { titre: 'Les Brigades barrent la route', texte: 'Une patrouille du Serment de Veyr bloque le couloir. Leur sergent réclame un « droit de passage ».',
      options: ['Payer le passage (20 composants)', 'Les contourner par les gaines (−5 PV chacun)', 'Forcer le passage'] }),
  cristal: () => ({ titre: 'Un cristal qui murmure', texte: 'Dans une niche, un cristal ancien murmure. Le son ressemble à une voix, sans les mots.',
    options: ['L’écouter', 'Le rapporter au district', 'Le laisser où il est'] }),
  marchand: () => ({ titre: 'Un marchand des bas-fonds', texte: 'Un marchand a installé son étal dans une ancienne salle, entre deux lampes à algues. Il a « de tout, pour qui sait payer ».',
    options: ['Échanger 30 composants contre une carte', 'Acheter des soins (15 composants, +30 % de PV)', 'Passer'] }),
  // Bible, 23 octobre 2026 : un Sauvage (greffé sans Clinique, sans Lecture) et un vendeur de pierres mortes
  sauvage: (j) => ({ titre: 'Un Sauvage', texte: 'Un homme recroquevillé contre un pilier, une mèche à peine dorée collée au front. Il s’est greffé une brisure achetée au marché noir, sans Lecture. Il gronde des mots qui ne sont pas les siens.',
    options: [j.expedition?.porteurs.some((p) => p.id === 'vela' && p.pv > 0) ? 'Laisser Véla lire sa pierre' : 'Lui parler doucement (−3 PV chacun)', 'L’affronter', 'Passer ton chemin'] }),
  faussaire: () => ({ titre: 'Un vendeur de pierres', texte: 'Sur une couverture, une rangée de cristaux tous identiques. « Des pierres d’Accord, directeur. Jamais portées. Une vierge pour vingt-cinq composants. » Elles sont ternes. Toutes.',
    options: ['Lui acheter une « vierge » (25 composants)', 'Lui faire rendre ses pierres', 'Passer'] }),
  source: () => ({ titre: 'Une source chaude', texte: 'Entre deux piliers, une source chaude jaillit de la roche. L’eau sent le fer et le sel.',
    options: ['S’y reposer (+25 % de PV)', 'Continuer sans s’arrêter'] }),
};

const soigner = (x: Expedition, part: number) => x.porteurs.map((p) => ({ ...p, pv: Math.min(p.pvMax, Math.max(0, p.pv) + Math.round(p.pvMax * part)) }));
const blesser = (x: Expedition, v: number) => x.porteurs.map((p) => ({ ...p, pv: p.pv > 0 ? Math.max(1, p.pv - v) : p.pv }));

export function entrer(j: Jeu, salle: number): Resultat {
  if (!j.expedition) return non('Aucune expédition en cours.');
  const r = entrerSalle(j.expedition, salle);
  j.expedition = r.x;
  return r.ok ? { ok: true } : non(r.message ?? 'Impossible d’aller par là.');
}

/** Répond à la rencontre en cours */
export function repondre(j: Jeu, choix: number): Resultat {
  const x = j.expedition;
  if (!x?.rencontre) return non('Personne à qui répondre.');
  const id = x.rencontre;
  const opts = RENCONTRES[id]!(j).options;
  if (choix < 0 || choix >= opts.length) return non('Choix inconnu.');
  const n = Math.round(8 * (1 + 0.25 * (x.strate - 1)));
  const gains = { ...x.gains! };
  let y: Expedition = { ...x, rencontre: undefined };
  let recit = 'L’escouade reprend sa route.';
  const allie = j.actes.chambre === 'orseve';
  if (id === 'veilleur') {
    if (choix === 0) { y.porteurs = blesser(x, 4); gains.eclats++; confier(j, 3); recit = 'Le Veilleur, reconnaissant, te confie un Éclat trouvé plus bas. Le quartier en entendra parler.'; }
    else if (choix === 1) { y.butin += n * 2; recit = `Le carnet se revend bien : +${n * 2} composants. Le Veilleur, lui, s’en souviendra.`; }
  } else if (id === 'pilleur') {
    if (choix === 0) { confier(j, 2); recit = 'Le pilleur file sans demander son reste. Il racontera que le directeur sait être juste.'; }
    else if (choix === 1) { y.butin += n * 2; recit = `Il lâche son sac et s’enfuit : +${n * 2} composants.`; }
    else { gains.cartes++; y = lancerCombat({ ...y, recit: 'Le pilleur sort un pied-de-biche. Son sac contient une carte : elle sera à toi.' }, 'pilleur'); }
  } else if (id === 'brigade') {
    if (allie) { if (choix === 0) { y.porteurs = soigner(x, 0.25); recit = 'Les Brigades pansent l’escouade (+25 % de PV).'; } }
    else if (choix === 0) { y.butin = Math.max(0, y.butin - 20); recit = 'Le sergent empoche les composants et s’écarte.'; }
    else if (choix === 1) { y.porteurs = blesser(x, 5); recit = 'Les gaines sont étroites et brûlantes, mais vous passez (−5 PV chacun).'; }
    else { confier(j, 2); y = lancerCombat({ ...y, recit: 'Le district ne paie pas pour passer chez lui.' }, 'brigadier'); }
  } else if (id === 'cristal') {
    const vela = x.porteurs.some((p) => p.id === 'vela' && p.pv > 0);
    if (choix === 0) {
      if (vela) { gains.eclats++; recit = 'Véla écoute longtemps. « Il a peur d’être oublié », dit-elle. Le cristal se fend et laisse un Éclat.'; }
      else { y.porteurs = blesser(x, 3); recit = 'Le murmure s’accroche aux pensées de l’escouade. Personne ne dort bien ce soir-là (−3 PV chacun).'; }
    } else if (choix === 1) { gains.cartes++; y.porteurs = blesser(x, 2); recit = 'Le cristal pèse lourd dans le sac, et il chuchote encore. Au district, il deviendra une carte (−2 PV chacun).'; }
  } else if (id === 'marchand') {
    if (choix === 0) {
      if (y.butin < 30) return non('Il te faut 30 composants dans le butin de l’expédition.');
      y.butin -= 30; gains.cartes++; recit = 'Le marchand glisse un cristal gravé dans ta main. Au district, il deviendra une carte.';
    } else if (choix === 1) {
      if (y.butin < 15) return non('Il te faut 15 composants dans le butin de l’expédition.');
      y.butin -= 15; y.porteurs = soigner(x, 0.3); recit = 'Onguents d’algues et bandages propres : +30 % de PV.';
    }
  } else if (id === 'source') {
    if (choix === 0) { y.porteurs = soigner(x, 0.25); recit = 'L’eau chaude délie les muscles (+25 % de PV).'; }
  } else if (id === 'sauvage') {
    const vela = x.porteurs.some((p) => p.id === 'vela' && p.pv > 0);
    if (choix === 0) {
      if (vela) { confier(j, 3); gains.eclats++; recit = 'Véla pose la main sur sa nuque. « C’est une brisure de créature des hauteurs. Elle a peur d’être enfermée. » Il se calme, et vous laisse un Éclat en remerciement. La Clinique le retirera.'; }
      else { y.porteurs = blesser(x, 3); confier(j, 2); recit = 'Il finit par se calmer et accepte qu’on le conduise à la Clinique. Ses accès ont laissé des bleus à tout le monde (−3 PV chacun).'; }
    } else if (choix === 1) { y = lancerCombat({ ...y, recit: 'Le penchant l’emporte : il se jette sur l’escouade.' }, 'sauvage'); }
  } else if (id === 'faussaire') {
    if (choix === 0) {
      if (y.butin < 25) return non('Il te faut 25 composants dans le butin de l’expédition.');
      y.butin -= 25; recit = 'Au district, la Clinique tranche : une pierre morte. Elle a refusé un Accord, et ne prendra plus jamais chez personne. Le quartier en rit encore.';
    } else if (choix === 1) { y.butin += n; confier(j, 2); recit = `Il remballe en grommelant et rend ce qu’il a pris aux fouilleurs : +${n} composants. Les familles volées sauront qui remercier.`; }
  }
  if (y.phase !== 'combat') y = { ...y, recit };
  y.gains = gains;
  j.expedition = y;
  return { ok: true };
}

/** Remonte au district depuis l'entrée ou un campement, avec tout ce qui a été trouvé */
export function retraite(j: Jeu): Resultat {
  const x = j.expedition;
  if (!x || !peutRemonter(x)) return non('On ne remonte qu’à l’entrée ou depuis un campement.');
  j.expedition = { ...x, retraite: true, terminee: true };
  return { ok: true };
}

/** Fuir le combat en reculant d'une salle sur la carte (l'ennemi frappe une dernière fois) */
export function fuirSalle(j: Jeu): Resultat {
  if (!j.expedition) return non('Aucune expédition en cours.');
  const r = reculer(j.expedition);
  if (!r.ok) return non(r.message ?? 'Impossible de reculer.');
  noterCombat(j, j.expedition.combat, 'fuite');
  j.expedition = r.x;
  return { ok: true };
}

/** Fuir le combat jusqu'au district : à faire suivre de remonter(), qui garde 75 % des composants et ajoute de l'Usure */
export function fuir(j: Jeu): Resultat {
  if (!j.expedition) return non('Aucune expédition en cours.');
  const r = fuirAuDistrict(j.expedition);
  if (!r.ok) return non(r.message ?? 'Impossible de fuir.');
  noterCombat(j, j.expedition.combat, 'fuite');
  j.expedition = r.x;
  return { ok: true };
}

export function finDeCombat(j: Jeu): void {
  if (!j.expedition) return;
  const c = j.expedition.combat;
  if (c.issue === 'victoire' || c.issue === 'defaite') {
    noterCombat(j, c, c.issue);
    // l'empreinte des cartes jouées (pas pendant le tutoriel)
    const x = j.expedition;
    if (!x.tutoriel) noterVecu(j, c, { strate: x.strate, gardien: !x.fouille && !x.epreuve && !!x.carte && salleCourante(x).type === 'gardien' });
  }
  j.expedition = cloturerCombat(j.expedition);
}

export function continuer(j: Jeu): void {
  if (j.expedition) j.expedition = combatSuivant(j.expedition);
}

/** Retour au district : butin, Usure, et nouvel étage creusé après une victoire complète */
export interface Retour {
  butin: number; nouvelleStrate: boolean; victoire: boolean; fragment: string | null; tutoriel?: boolean;
  /** l'escouade a fui un combat */
  fuite?: boolean;
  /** cartes trouvées en route, Éclats gagnés */
  cartes: string[]; eclats: number;
  /** l'expérience gagnée par chaque Porteur de l'escouade, et les niveaux pris */
  xp?: { id: string; xp: number; niveau?: number }[];
  /** le retour d'un pillage (pillages.ts) */
  pillage?: { nom: string; victoire: boolean; gain: number; perte: number };
  /** le retour d'un combat de la Flèche (fleche.ts) */
  fleche?: import('./fleche').RetourFleche;
}

export function remonter(j: Jeu): Retour {
  const x = j.expedition;
  if (!x) return { butin: 0, nouvelleStrate: false, victoire: false, fragment: null, cartes: [], eclats: 0 };
  const victoire = x.terminee && !x.retraite && x.combat.issue === 'victoire';
  const defaite = x.combat.issue === 'defaite' && !x.retraite;
  if (!x.tutoriel) noterExpedition(j, x.strate, victoire && !x.fouille && !x.epreuve ? 'gardien' : defaite ? 'defaite' : x.fuite ? 'fuite' : x.retraite ? 'retraite' : 'autre', x.porteurs.map((p) => p.id));
  const brut = defaite ? Math.floor(x.butin * DISTRICT.butinDefaite) : x.fuite ? Math.floor(x.butin * DISTRICT.butinFuite) : x.butin;
  const butin = x.tutoriel ? brut : Math.round(brut * (j.actes.chambre === 'district' ? 1.2 : 1) * (j.actes.fin === 'pacte' ? 1.1 : 1));
  j.composants += butin;
  const finaux = x.carte && x.phase !== 'combat' ? x.porteurs : x.combat.porteurs;
  for (const p of finaux) {
    const d = j.porteurs[p.id]!;
    const usure = DISTRICT.usureExpedition * (j.actes.fin === 'archives' ? 1.5 : 1) * (x.fouille || x.epreuve ? 0.5 : 1);
    d.usure = Math.min(usureMax(p.id), d.usure + usure + (p.pv <= 0 ? DISTRICT.usureATerre : 0) + (x.fuite ? DISTRICT.usureFuite : 0) + (p.usureEclat ?? 0));
  }
  let nouvelleStrate = false;
  let butinFilon = 0;
  let fragment: string | null = null;
  if (x.tutoriel) {
    j.expedition = null;
    if (victoire) {
      j.chambre = true;
      j.recrues = true;
      donnerKitRecrues(j);
      fragment = ajouterFragment(j);
      ajouterCarte(j, CARTE_CHAMBRE);
      log(j, 'La chambre scellée est ouverte. Trois recrues rejoignent le district : un Coursier, un Docker et un Guetteur.');
    } else log(j, 'Le gardien de la chambre a repoussé l’escouade. Elle se repose, puis réessaie.');
    return { butin, nouvelleStrate, victoire, fragment, tutoriel: true, cartes: victoire ? [CARTE_CHAMBRE] : [], eclats: 0 };
  }

  // les trouvailles : une chance de carte par combat normal gagné, un choix de 3 sur le boss
  const victoires = x.carte ? (x.gagnes ?? 0) : x.combat.issue === 'victoire' ? x.index + 1 : x.index;
  // une fouille finit sur le filon, pas sur un combat : tous ses combats sont des combats normaux
  const normales = victoires - (victoire && !x.fouille ? 1 : 0);
  const lignee = estLignee(x.fouille) ? x.fouille : undefined;
  const t = tireur(j);
  const cartes: string[] = [];
  let eclats = 0;
  for (let k = 0; k < normales; k++) {
    if (t.nombre() < COLLECTION.chanceCombat + (j.actes.chambre === 'commission' ? 0.05 : 0)) cartes.push(tirerTrouvaille(j, x.strate, 'fer', lignee));
    if (x.strate >= 5 && t.nombre() < 0.1) eclats++;
  }
  progresser(j, 'combat', victoires);
  if (victoire && x.fouille) {
    if (tireur(j).nombre() < CREUSEURS.fouille) gagnerCreuseurs(j, 1, 'un fouilleur perdu retrouvé pendant la fouille');
    // le filon : ce que la fouille visait
    if (lignee) j.choix.push({ source: 'fouille', options: tirerChoix(j, x.strate, 'fer', lignee) });
    // le filon « composants » rapporte selon l'effort (24 octobre 2026) : une part par combat gagné dans la fouille,
    // au lieu de doubler le butin et d'ajouter une prime fixe (un chemin d'un seul combat rapportait ~3 fois plus par combat qu'une expédition)
    else if (x.fouille === 'composants') { const plus = Math.max(1, victoires) * Math.round(FILON_COMPOSANTS * (1 + 0.25 * (x.strate - 1))); j.composants += plus; butinFilon = plus; }
    else eclats += x.strate >= 5 ? 3 : 2;
    progresser(j, 'expedition');
  } else if (victoire && x.epreuve) {
    // la première victoire de la semaine dans cette Épreuve : une carte au choix, dont une en argent au moins
    if (!j.epreuves.faites.includes(x.epreuve)) {
      j.epreuves.faites.push(x.epreuve);
      gagnerCreuseurs(j, CREUSEURS.epreuve, 'l’Épreuve réussie fait des émules');
      j.choix.push({ source: 'epreuve', options: tirerChoix(j, x.strate, 'argent') });
    }
    progresser(j, 'expedition');
  } else if (victoire) {
    // le gardien est généreux (24 octobre 2026, Bryan : « toujours des cartes fer, on est un peu radin ») :
    // à partir de la Strate −3, la première des trois cartes est au moins en cuivre
    j.choix.push({ source: 'boss', options: tirerChoix(j, x.strate, x.strate >= 3 ? 'cuivre' : 'fer') });
    eclats += (x.strate >= 5 ? 2 : 1) + (j.actes.chambre === 'orseve' ? 1 : 0);
    progresser(j, 'expedition');
  }
  if (victoire && x.strate === j.strate && !j.frontVaincu) {
    // le gardien du front est vaincu : l'étage suivant est prêt à être creusé, s'il y a assez de creuseurs
    j.frontVaincu = true;
    gagnerCreuseurs(j, CREUSEURS.gardien, 'le gardien vaincu, des fouilleurs se joignent au chantier');
    nouvelleStrate = creuser(j);
    fragment = ajouterFragment(j);
    // dans les Seuils, les abris des années 2060 rendent deux papiers par Strate
    if (x.strate <= 3) ajouterFragment(j);
    j.composants += 20;
    cartes.push(tirerTrouvaille(j, x.strate));
    eclats += 2;
  }
  // les trouvailles de l'exploration : une carte par salle scellée, les cartes offertes en route, Éclats et archives
  if (x.gains) {
    for (let k = 0; k < x.gains.elites; k++) cartes.push(tirerTrouvaille(j, x.strate, 'cuivre'));
    for (let k = 0; k < x.gains.cartes; k++) cartes.push(tirerTrouvaille(j, x.strate, 'fer', lignee));
    eclats += x.gains.eclats;
    if (x.gains.fragment) fragment = ajouterFragment(j) ?? fragment;
  }
  for (const c of cartes) { ajouterCarte(j, c); if (!x.tutoriel) noterOrigine(j, c, x.strate); }
  j.eclats += eclats;
  // la Confiance du quartier : chaque combat gagné, et la descente réussie (elle ne baisse jamais)
  confier(j, victoires * CONFIANCE.combat + (victoire ? CONFIANCE.victoire : 0));
  // l'expérience : chaque combat gagné, les salles scellées et le gardien ; toute l'escouade la partage, debout ou à terre
  const facteur = 1 + 0.25 * (x.strate - 1);
  const gardien = victoire && !x.fouille && !x.epreuve ? XP.gardien : 0;
  const brutXp = Math.round((victoires * XP.combat + (x.gains?.elites ?? 0) * XP.elite + gardien) * facteur * (x.epreuve || x.fouille ? 0.75 : 1));
  const xp = finaux.map((p) => { const avant = niveauPorteur(j, p.id).niveau; const n = gagnerXp(j, p.id, brutXp); return { id: p.id, xp: brutXp, ...(n && n > avant ? { niveau: n } : {}) }; });
  // ce que chacun a vécu, pour ses Marques
  const vaincus = x.sequence.slice(0, victoires);
  const anciens = vaincus.filter((id) => ennemiDef(id).lignee === 'reso').length;
  for (const p of finaux) {
    const f = (j.porteurs[p.id]!.faits ??= {});
    const avant = progresMarque(j, p.id)?.acquise;
    if (victoire) f.expeditions = (f.expeditions ?? 0) + 1;
    if (x.strate <= 3) f.fondations = (f.fondations ?? 0) + victoires;
    f.anciens = (f.anciens ?? 0) + anciens;
    f.combats = (f.combats ?? 0) + victoires;
    if (x.strate >= 4) f.abysses = (f.abysses ?? 0) + victoires;
    f.scellees = (f.scellees ?? 0) + (x.gains?.elites ?? 0);
    if (victoire && !x.fouille && !x.epreuve) f.gardiens = (f.gardiens ?? 0) + 1;
    const m = progresMarque(j, p.id);
    if (m?.acquise && !avant) log(j, `${porteurDef(p.id).nom} gagne la Marque ${m.nom} : ${m.texte}`);
  }
  j.expedition = null;
  log(j, victoire
    ? `L’escouade remonte victorieuse avec ${butin} composants.${nouvelleStrate ? ` Un nouvel étage est creusé : la Strate −${j.strate} est ouverte.` : ''}`
    : x.fuite ? `L’escouade a fui et remonte avec ${butin} composants. Elle rentre épuisée.`
    : `L’escouade remonte avec ${butin} composants. Elle a besoin de repos.`);
  return { butin: butin + butinFilon, nouvelleStrate, victoire, fragment, cartes, eclats, ...(x.fuite ? { fuite: true } : {}), ...(brutXp ? { xp } : {}) };
}

function ajouterFragment(j: Jeu): string | null {
  const id = ORDRE_FRAGMENTS.find((f) => !j.fragments.includes(f));
  if (!id) return null;
  j.fragments.push(id);
  log(j, `Fragment d’archives trouvé : « ${fragmentDef(id)!.titre} ». Il est rangé dans le Codex.`);
  return id;
}

// ---------- La chambre scellée (combat guidé) ----------

/** Ordre de pioche du combat guidé : une leçon par tour (au tour 2, un 3, un 4 et un 5 ; au tour 3, des boucliers) */
const ORDRE_TUTO = ['ruee', 'morsure', 'murmure', 'carapace', 'tir', 'bond', 'charge', 'grogner', 'esquive', 'repli', 'glande-ambre'];

export function ouvrirChambre(j: Jeu, rng = graine()): Resultat {
  if (j.chambre) return non('La chambre est déjà ouverte.');
  if (j.expedition) return non('Une expédition est déjà en cours.');
  const escouade = ['ilka', 'doran', 'vela'];
  for (const id of escouade) if (j.porteurs[id]!.poste) j.porteurs[id]!.poste = null;
  const tout = deckEscouade(j, escouade);
  const deck: GesteDef[] = [];
  for (const gid of ORDRE_TUTO) {
    const k = tout.findIndex((g) => moduleDe(g.id) === gid);
    if (k >= 0) deck.push(...tout.splice(k, 1));
  }
  deck.push(...tout);
  const porteurs: PorteurEtat[] = escouade.map((id) => {
    const u = Math.floor(j.porteurs[id]!.usure);
    return { id, pv: pvMaxCombat(j, id), pvMax: pvMaxCombat(j, id), aTerre: false, ...(u > 0 ? { usure: u } : {}) };
  });
  j.expedition = nouvelleExpedition({ porteurs, deck, strate: 1, rng, sequence: ['remanent-faible'], force: 1, tutoriel: true });
  log(j, 'Ilka, Doran et Véla descendent vers la porte scellée.');
  return { ok: true };
}

/** La consigne du combat guidé, selon le tour */
export function leconTutoriel(tour: number): string {
  if (tour === 1) return 'Leçon 1 : touche 3 cartes de ta main, puis « Lancer la chaîne ».';
  if (tour === 2) return 'Leçon 2 : pose un 3, puis un 4, puis un 5, dans cet ordre. Des chiffres qui se suivent font une Résonance : +30 % sur toute la chaîne.';
  if (tour === 3) return 'Leçon 3 : le Rémanent annonce une Entaille sur Doran. Pose des cartes à bouclier : elles protègent toute l’escouade pendant son attaque.';
  return 'Tu as l’essentiel : vise les suites, protège-toi des grosses attaques annoncées. Achève-le !';
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

// ---------- Les départs : expédition, fouille ciblée, Épreuve ----------

export function escouadePrete(j: Jeu, escouade: string[], filtre?: (g: GesteDef) => boolean, min: number = DISTRICT.deckMin):
  { ok: false; message: string } | { ok: true; message?: undefined; porteurs: PorteurEtat[]; deck: GesteDef[]; bonus: BonusMarques } {
  if (j.expedition) return refus('Une expédition est déjà en cours.');
  if (escouade.length !== 3 || new Set(escouade).size !== 3) return refus('Choisis 3 Porteurs.');
  for (const id of escouade) {
    if (!porteursPresents(j).includes(id)) return refus('Ce Porteur n’est pas encore arrivé au district.');
    if (enMission(j, id)) return refus(`${porteurDef(id).nom} est en mission.`);
    if (j.porteurs[id]?.poste === 'forge' && j.forge) return refus(`${porteurDef(id).nom} ne peut pas quitter la Forge pendant une fabrication.`);
  }
  if (!j.chambre) return refus('Ouvre d’abord la chambre scellée.');
  for (const id of escouade) {
    if (chargePortee(j, id) > chargeMax(j, id)) return refus(`${porteurDef(id).nom} porte trop lourd (${chargePortee(j, id)} de Charge sur ${chargeMax(j, id)}) : reprends-lui une carte.`);
    const haute = j.porteurs[id]?.modules.find((k) => niveauRequis(k) > niveauPorteur(j, id).niveau);
    if (haute) return refus(`${moduleDef(haute).nom} demande un Porteur de niveau ${niveauRequis(haute)} : reprends-la à ${porteurDef(id).nom}.`);
  }
  const cartes = deckEscouade(j, escouade).filter((g) => !filtre || g.porteur === null || filtre(g));
  if (cartes.length < min) return refus(`Ton deck n’a que ${cartes.length} cartes : confie des cartes à ton escouade (${min} au moins).`);
  // chaque Porteur combat avec ses 6 places : celles qu'on n'a pas remplies descendent vides (pas dans les Épreuves, qui retirent des cartes)
  const deck = filtre ? cartes : [...cartes, ...escouade.flatMap((id) => placesVides(id, (j.porteurs[id]?.modules ?? []).filter((k) => j.collection[k]).length))];
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
  retenirDepart(j, escouade);
  log(j, `L’escouade descend dans la Strate −${strate}.`);
  return { ok: true };
}

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
  retenirDepart(j, escouade);
  log(j, `L’escouade part fouiller la Strate −${strate} (${CIBLES_FOUILLE[cible].nom.toLowerCase()}).`);
  return { ok: true };
}

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
