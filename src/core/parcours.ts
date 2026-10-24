// Le parcours d'un joueur : une partie entière jouée par le robot, avec le vrai district et la vraie économie.
// Il ouvre ses colis, lit les Chroniques, prend ses cartes, monte ses niveaux, construit son deck, améliore ses bâtiments,
// et descend dans les Strates (exploration salle par salle) au rythme d'un joueur occasionnel ou assidu.
// Ce qu'on mesure : le jour où chaque Strate s'ouvre, et le nombre d'expéditions qu'il a fallu pour l'ouvrir.
// Une progression « progressive » : ce nombre grandit petit à petit, sans mur ni Strate gratuite.
// Aucun DOM ici : il tourne dans les tests et dans `npm run robot`.

import { CHAPITRES, chapitreOuvert } from './chroniques';
import { puissanceCarte } from './collection';
import { DEPART_PORTEURS, moduleDe, moduleDef, porteurDef } from './donnees';
import { accessibles, salleCourante } from './expedition';
import {
  acheter, garnirComptoir, prixComptoir,
  DECISIONS, OBJECTIFS, RENCONTRES, ameliorer, colisDisponible, decider, decisionEnAttente, degreffer, entrer, fabriquer,
  finDeCombat, continuer, greffer, lireChapitre, monter, nouveauJeu, ouvrirArchive, ouvrirChambre, ouvrirColis, partir,
  enMission, envoyerMission, epreuvesDeLaSemaine, fouiller, partirEpreuve,
  porteursPresents, posteDe, poster, prendre, pvMaxCombat, quotidienFait, reclamerQuotidien, remonter, repondre, retraite, tick,
  coutRefabrication, type Jeu, type Poste,
} from './jeu';
import { jouerTour, jouerTourMoyen } from './robot';
// (les creuseurs se gagnent par les fouilles, missions et Épreuves que joue déjà ce joueur simulé)
import type { CombatEtat, Lignee } from './types';

export interface Profil {
  nom: string;
  /** heures des sessions dans la journée (une expédition par session) */
  sessions: number[];
}

export const PROFILS: Record<'occasionnel' | 'assidu', Profil> = {
  occasionnel: { nom: 'Occasionnel (2 expéditions par jour)', sessions: [12.5, 20.5] },
  assidu: { nom: 'Assidu (5 expéditions par jour)', sessions: [8, 12, 17, 20, 22.5] },
};

export interface Parcours {
  /** jour (1 = le jour du premier lancement) où chaque Strate est ouverte : ouverture[n] pour la Strate −n */
  ouverture: Record<number, number>;
  /** expéditions faites avant d'ouvrir chaque Strate (depuis l'ouverture de la précédente) */
  expeditions: Record<number, number>;
  /** expéditions au front (la Strate la plus profonde) et victoires au front */
  front: { tentatives: number; victoires: number };
  /** Strate la plus profonde ouverte à la fin */
  strate: number;
}

const HEURE = 3_600_000;
const JOUR = 24 * HEURE;
const LIGNEES: Lignee[] = ['tech', 'bio', 'reso'];
/** Le Porteur nommé de chaque lignée : son deck de départ donne la part d'attaques et de défenses à garder */
const NOMME: Record<Lignee, string> = { tech: 'ilka', bio: 'doran', reso: 'vela' };
const DEFENSES: Record<Lignee, number> = Object.fromEntries(
  LIGNEES.map((l) => [l, DEPART_PORTEURS[NOMME[l]]!.filter((id) => moduleDef(id).type !== 'atk').length]),
) as Record<Lignee, number>;

/** Chaque lignée n'a pas la même force brute au départ : on compare les decks à leur valeur de départ */
const DEFENSES_POIDS: Record<Lignee, number> = Object.fromEntries(
  LIGNEES.map((l) => [l, DEPART_PORTEURS[NOMME[l]]!.reduce((n, id) => n + valeurCarte(id + '@fer', 1), 0)]),
) as Record<Lignee, number>;

/** Ce que vaut une carte pour le deck, à son niveau (estimation simple : force, effet, Fréquences, place prise) */
export function valeurCarte(id: string, niveau: number): number { return puissanceCarte(id, niveau); }

/** Les 6 meilleures cartes d'une lignée, en gardant autant de défenses que le deck de départ */
function meilleures(j: Jeu, l: Lignee): string[] {
  const cartes = Object.keys(j.collection).filter((id) => moduleDef(id).lignee === l)
    .sort((a, b) => valeurCarte(b, j.collection[b]!.niveau) - valeurCarte(a, j.collection[a]!.niveau));
  const pris: string[] = [];
  const bases = new Set<string>();
  const prendreSi = (ok: (id: string) => boolean, n: number) => {
    for (const id of cartes) {
      if (pris.length >= 6 || n <= 0) return;
      if (bases.has(moduleDe(id)) || !ok(id)) continue;
      pris.push(id); bases.add(moduleDe(id)); n--;
    }
  };
  prendreSi((id) => moduleDef(id).type !== 'atk', DEFENSES[l]);
  prendreSi((id) => moduleDef(id).type === 'atk', 6 - pris.length);
  prendreSi(() => true, 6 - pris.length);
  return pris;
}

/** Choisit l'escouade (un Porteur par lignée, le plus solide), lui confie les meilleures cartes et poste les autres */
function preparer(j: Jeu): string[] {
  const forgeron = j.forge ? posteDe(j, 'forge') : null;
  const presents = porteursPresents(j).filter((id) => !enMission(j, id));
  for (const id of presents) if (id !== forgeron) poster(j, id, null);
  const escouade = LIGNEES.map((l) => presents.filter((id) => id !== forgeron && porteurDef(id).lignee === l)
    .sort((a, b) => pvMaxCombat(j, b) - pvMaxCombat(j, a))[0]!).filter(Boolean);
  for (const id of escouade) {
    const voulues = meilleures(j, porteurDef(id).lignee);
    for (const k of j.porteurs[id]!.modules.slice()) if (!voulues.includes(k)) degreffer(j, k);
    for (const k of voulues) greffer(j, k, id);
  }
  // les autres travaillent : Générateur et Forge pour les Augmentés, Clinique pour les Génés
  const libres = presents.filter((id) => !escouade.includes(id) && id !== forgeron);
  const postes: [Poste, Lignee][] = [['generateur', 'tech'], ['clinique', 'bio'], ['forge', 'tech']];
  for (const [b, l] of postes) {
    if (posteDe(j, b)) continue;
    const k = libres.findIndex((id) => porteurDef(id).lignee === l);
    const id = libres.splice(k >= 0 ? k : 0, 1)[0];
    if (id) poster(j, id, b);
  }
  // ceux qui restent partent en mission (longue : le joueur revient plus tard) ; s'il n'y a plus de place, ils s'entraînent à la Tour
  for (const id of libres) if (!envoyerMission(j, id, 'longue', j.dernierTick).ok && !posteDe(j, 'noyau')) poster(j, id, 'noyau');
  return escouade;
}

/** Ce que fait le joueur au district entre deux expéditions */
function gerer(j: Jeu, now: number): void {
  const acte = decisionEnAttente(j);
  if (acte) decider(j, acte, DECISIONS[acte].options[0]!.id);
  for (const c of CHAPITRES) if (chapitreOuvert(c, j.strate) && !j.luesRecompensees.includes(c.id)) lireChapitre(j, c.id);
  while (colisDisponible(j)) ouvrirColis(j);
  if (quotidienFait(j)) reclamerQuotidien(j);
  ouvrirArchive(j);
  while (j.choix.length) {
    const c = j.choix[0]!;
    const note = (id: string) => valeurCarte(id, j.collection[id]?.niveau ?? 1) * (j.collection[id] ? 0.8 : 1);
    const k = c.options.reduce((best, id, i) => (note(id) > note(c.options[best]!) ? i : best), 0);
    prendre(j, k);
  }
  // les niveaux d'abord pour les cartes du deck, puis les bâtiments
  const enDeck = new Set(Object.values(j.porteurs).flatMap((p) => p.modules));
  const ordre = Object.keys(j.collection).sort((a, b) => Number(enDeck.has(b)) - Number(enDeck.has(a)));
  for (const id of ordre) while (monter(j, id).ok);
  for (const b of ['noyau', 'generateur', 'clinique', 'forge', 'comptoir'] as const) ameliorer(j, b, now);
  // le Comptoir : il achète les doublons des cartes de son deck, et une carte neuve si elle vaut mieux que la plus faible,
  // en gardant de quoi monter ses niveaux (une réserve de 2 fois le prix)
  garnirComptoir(j, now);
  const plusFaible = Math.min(...[...enDeck].map((id) => valeurCarte(id, j.collection[id]?.niveau ?? 1)));
  j.comptoir.offres.forEach((id, i) => {
    const utile = enDeck.has(id) || (!j.collection[id] && valeurCarte(id, 1) > plusFaible);
    if (utile && j.composants >= 2 * prixComptoir(id).composants) acheter(j, i, now);
  });
  // la Forge refabrique la carte du deck la plus proche de son prochain niveau, si les composants le permettent
  if (!j.forge && posteDe(j, 'forge')) {
    const cible = [...enDeck].filter((id) => j.collection[id] && coutRefabrication(id).eclats === 0)
      .sort((a, b) => j.collection[b]!.doublons - j.collection[a]!.doublons)[0];
    if (cible && j.composants >= 3 * coutRefabrication(cible).composants) fabriquer(j, cible, now);
  }
}

/** Une rencontre : la réponse d'un joueur prudent mais curieux */
function reponse(j: Jeu, id: string, sante: number): number {
  const x = j.expedition!;
  switch (id) {
    case 'veilleur': return sante > 0.5 ? 0 : 2;
    case 'pilleur': return sante > 0.7 ? 2 : 1;
    case 'brigade': return j.actes.chambre === 'orseve' ? 0 : x.butin >= 20 ? 0 : 1;
    case 'cristal': return sante > 0.5 ? 1 : 0;
    case 'marchand': return x.butin >= 30 ? 0 : x.butin >= 15 && sante < 0.6 ? 1 : 2;
    default: return 0;
  }
}

/** Joue une expédition jusqu'au retour au district ; renvoie la victoire */
/** tours joués par combat, par type de salle (mesure du rythme) */
export type ToursCombat = Record<'normal' | 'gardien' | 'epreuve', number[]>;

function jouerExpedition(j: Jeu, depart: () => boolean, jouer: (s: CombatEtat) => void, tours?: ToursCombat): boolean {
  if (!depart()) return false;
  let garde = 0;
  while (j.expedition && garde++ < 5000) {
    const x = j.expedition;
    if (!x.carte) {
      // un combat seul (Épreuve)
      if (x.combat.issue === 'en-cours') jouer(x.combat);
      else if (!x.cloture) { tours?.epreuve.push(x.combat.tour); finDeCombat(j); }
      else if (x.terminee) return remonter(j).victoire;
      else continuer(j);
      continue;
    }
    if (x.phase === 'combat' && x.combat.issue === 'en-cours') { jouer(x.combat); continue; }
    if (x.phase === 'combat' && !x.cloture) { tours?.[salleCourante(x).type === 'gardien' ? 'gardien' : 'normal'].push(x.combat.tour); finDeCombat(j); continue; }
    if (j.expedition.terminee) return remonter(j).victoire;
    if (x.phase === 'combat') { continuer(j); continue; }
    const sante = x.porteurs.reduce((n, p) => n + Math.max(0, p.pv), 0) / x.porteurs.reduce((n, p) => n + p.pvMax, 0);
    if (x.rencontre) {
      if (!repondre(j, reponse(j, x.rencontre, sante)).ok) repondre(j, RENCONTRES[x.rencontre]!(j).options.length - 1);
      continue;
    }
    if (salleCourante(x).type === 'camp' && sante < 0.3) { retraite(j); continue; }
    const choix = accessibles(x);
    if (!choix.length) break;
    const prefere = (t: string) => (t === 'camp' ? (sante < 0.7 ? 0 : 3) : t === 'cache' || t === 'archive' ? 1 : t === 'elite' ? (sante > 0.8 ? 1.5 : 4) : 2);
    entrer(j, choix.slice().sort((a, b) => prefere(a.type) - prefere(b.type))[0]!.id);
  }
  if (j.expedition) return remonter(j).victoire;
  return false;
}

/**
 * Une partie de `jours` jours au rythme du profil. Au front, le joueur retente la Strate la plus profonde ;
 * après deux échecs d'affilée, il remonte faire une expédition dans la Strate d'au-dessus (pour ses cartes), puis retente.
 */
export function simulerParcours(
  profil: Profil, jours: number, graine: number,
  opts: { trace?: (j: Jeu, jour: number, escouade: string[]) => void; jusqua?: number; joueur?: 'robot' | 'moyen'; tours?: ToursCombat } = {},
): Parcours {
  const debut = Date.UTC(2026, 9, 5, 6); // un lundi matin
  const j = nouveauJeu(debut, graine);
  let rng = (graine * 2654435761) >>> 0;
  const suivant = () => (rng = (Math.imul(rng ^ (rng >>> 15), 0x2c1b3c6d) + 0x9e3779b9) >>> 0);
  // la chambre scellée, puis les objectifs guidés (leurs récompenses comprises)
  ouvrirChambre(j, suivant());
  while (j.expedition && j.expedition.combat.issue === 'en-cours') (opts.joueur === 'robot' ? jouerTour : jouerTourMoyen)(j.expedition.combat);
  remonter(j);
  if (!j.chambre) { j.chambre = true; j.recrues = true; }
  for (const o of OBJECTIFS) { j.energie += o.recompense.energie ?? 0; j.composants += o.recompense.composants ?? 0; j.creuseurs += o.recompense.creuseurs ?? 0; }
  j.objectif = OBJECTIFS.length;

  const r: Parcours = { ouverture: { 1: 1 }, expeditions: {}, front: { tentatives: 0, victoires: 0 }, strate: 1 };
  let depuis = 0;
  let derniere = j.strate;
  /** note chaque Strate ouverte depuis la dernière fois (au front, ou par une mission, un chantier du Noyau…) */
  const noter = (d: number, escouade: string[]): boolean => {
    while (derniere < j.strate) {
      derniere++;
      r.ouverture[derniere] = d + 1;
      r.expeditions[derniere] = depuis;
      depuis = 0;
      opts.trace?.(j, d + 1, escouade);
      if (opts.jusqua && derniere >= opts.jusqua) { r.strate = j.strate; return true; }
    }
    return false;
  };
  let echecs = 0;
  for (let d = 0; d < jours; d++) {
    for (const h of profil.sessions) {
      const now = debut + d * JOUR + h * HEURE;
      tick(j, now);
      gerer(j, now);
      if (noter(d, [])) return r;
      const escouade = preparer(j);
      const front = j.strate;
      const jouer = opts.joueur === 'robot' ? jouerTour : jouerTourMoyen;
      // une fois par jour, les Épreuves de la semaine pas encore réussies
      if (h === profil.sessions[0] && front >= 2) {
        const ep = epreuvesDeLaSemaine(now).find((e) => !j.epreuves.faites.includes(e.id) && !e.interdits);
        if (ep) { jouerExpedition(j, () => partirEpreuve(j, escouade, ep.id, now, suivant()).ok, jouer, opts.tours); gerer(j, now); }
      }
      // bloqué au front (deux échecs d'affilée) : une fouille ciblée juste au-dessus, pour la lignée la plus faible du deck
      // le gardien du front est vaincu, mais il manque des creuseurs : on fouille le front pour en retrouver
      const attente = j.frontVaincu;
      const cible = attente ? front : echecs >= 2 && front > 1 ? front - 1 : front;
      const faible = LIGNEES.map((l) => ({ l, v: meilleures(j, l).reduce((n, id) => n + valeurCarte(id, j.collection[id]!.niveau), 0) / DEFENSES_POIDS[l] }))
        .sort((a, b) => a.v - b.v)[0]!.l;
      const g = suivant();
      const victoire = jouerExpedition(j, () => (cible === front && !attente ? partir(j, escouade, cible, g) : fouiller(j, escouade, cible, faible, g)).ok, jouer, opts.tours);
      depuis++;
      if (attente) { /* fouille d'attente : ne compte pas comme une tentative au front */ } else if (cible === front) {
        r.front.tentatives++;
        if (victoire) r.front.victoires++;
        echecs = victoire ? 0 : echecs + 1;
      } else echecs = 1;
      if (noter(d, escouade)) return r;
      tick(j, now + 15 * 60_000);
      gerer(j, now + 15 * 60_000);
    }
  }
  r.strate = j.strate;
  return r;
}

/** La médiane d'une liste (Infinity pour « jamais ») */
export const mediane = (xs: number[]) => {
  const s = xs.slice().sort((a, b) => a - b);
  return s.length ? s[Math.floor(s.length / 2)]! : NaN;
};
