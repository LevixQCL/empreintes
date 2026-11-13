// Le parcours d'un joueur : une partie entière jouée par le robot, avec le vrai district et la vraie économie.
// Il ouvre ses colis, lit les Chroniques, prend ses cartes, monte ses niveaux, construit son deck, améliore ses bâtiments,
// et descend dans les Strates (exploration salle par salle) au rythme d'un joueur occasionnel ou assidu.
// Ce qu'on mesure : le jour où chaque Strate s'ouvre, et le nombre d'expéditions qu'il a fallu pour l'ouvrir.
// Une progression « progressive » : ce nombre grandit petit à petit, sans mur ni Strate gratuite.
// Aucun DOM ici : il tourne dans les tests et dans `npm run robot`.

import { CHAPITRES, chapitreOuvert } from './chroniques';
import { clePossedee, niveauRequis, poidsCarte, puissanceCarte } from './collection';
import { DEPART_PORTEURS, MODULES, moduleDe, moduleDef, porteurDef } from './donnees';
import { accessibles, mainAccordable, reperentPassage, salleCourante, typeApparent } from './expedition';
import { envoyerBasses, libresPourBasses, prochainSecours, escouadeDe,
  acheterEclat, prixEclatComptoir, promouvoir, choisirLegs, choisirHalte, ouvrirPorte, passerPorte, relancerPorte, suivrePassage, acheter, garnirComptoir, prixComptoir,
  DECISIONS, OBJECTIFS, RENCONTRES, ameliorer, colisDisponible, decider, decisionEnAttente, degreffer, entrer, fabriquer,
  finDeCombat, continuer, greffer, lireChapitre, monter, nouveauJeu, ouvrirArchive, ouvrirChambre, ouvrirColis, partir,
  enMission, envoyerMission, destinationsDuJour, secoursPossible, epreuvesDeLaSemaine, fouiller, partirEpreuve,
  chargeMax, brutEnAttente, coutAmelioration, niveauPorteur, porteursPresents, posteDe, poster, prendre, pvMaxCombat, quotidienFait, reclamerQuotidien, remonter, repondre, retraite, tick as tickJeu,
  coutRefabrication, soignerVite, placesEntrainement, seancesDe, type Jeu, type Poste,
  contratsDuMoment, envoyerContrat, equipeConseillee, mareesDe, raisonHorsContrat, tauxContrat, sceneCampagne, voirScene,
} from './jeu';
import { jouerTour, jouerTourMoyen } from './robot';
import { pillagesPermis, achatsRestants, acheterJeton, ciblesDuJour, coutJeton, difficulte, forceEscouade, peutPiller, piller } from './partie/pillages';
import { strateVaincue, jourDe } from './partie/etat';
import { strateRemuee } from './partie/descentes';
import { chanceQuai, etatFleche, flecheOuverte, monterFleche, peutMonter } from './partie/fleche';
import { confieesOuvertes, confierFouille, peutConfier } from './partie/confiees';
import { avancementExode, exodeOuvert, lancerExode } from './partie/exode';
// (les creuseurs se gagnent par les fouilles, missions et Épreuves que joue déjà ce joueur simulé)
import type { CombatEtat, Lignee } from './types';
import { t as tr } from './i18n';

interface Profil {
  nom: string;
  /** heures des sessions dans la journée (une expédition par session) */
  sessions: number[];
}

export const PROFILS: Record<'occasionnel' | 'assidu', Profil> = {
  occasionnel: { nom: tr('Occasionnel (2 expéditions par jour)'), sessions: [12.5, 20.5] },
  assidu: { nom: tr('Assidu (5 expéditions par jour)'), sessions: [8, 12, 17, 20, 22.5] },
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
function valeurCarte(id: string, niveau: number): number { return puissanceCarte(id, niveau); }

/**
 * Les 6 meilleures cartes d'une lignée que le Porteur peut porter (Charge comprise), en gardant autant de défenses que
 * le deck de départ quand c'est possible : un sac à dos, un seul métal par carte.
 */
function meilleures(j: Jeu, l: Lignee, charge: number, niveau: number): string[] {
  const parBase = new Map<string, string[]>();
  // les cartes parties avec un Porteur absent (mission, fouille confiée) ne se reprennent pas
  const parties = new Set(Object.entries(j.porteurs).filter(([id]) => enMission(j, id)).flatMap(([, p]) => p.modules));
  for (const id of Object.keys(j.collection)) if (moduleDef(id).lignee === l && niveauRequis(id) <= niveau && !parties.has(id)) parBase.set(moduleDe(id), [...(parBase.get(moduleDe(id)) ?? []), id]);
  // etat[n][d][w] : meilleure valeur avec n cartes, d défenses (plafonnées), w de Charge
  type Case = { v: number; pris: string[] } | null;
  const D = DEFENSES[l];
  let etat: Case[][][] = Array.from({ length: 7 }, () => Array.from({ length: D + 1 }, () => Array<Case>(charge + 1).fill(null)));
  etat[0]![0]![0] = { v: 0, pris: [] };
  for (const copies of parBase.values()) {
    const suite = etat.map((a) => a.map((b) => b.slice()));
    for (let n = 0; n < 6; n++) for (let d = 0; d <= D; d++) for (let w = 0; w <= charge; w++) {
      const c = etat[n]![d]![w];
      if (!c) continue;
      for (const id of copies) {
        const w2 = w + poidsCarte(id);
        if (w2 > charge) continue;
        const d2 = Math.min(D, d + (moduleDef(id).type !== 'atk' ? 1 : 0));
        const v = c.v + valeurCarte(id, j.collection[id]!.niveau);
        const t = suite[n + 1]![d2]![w2];
        if (!t || v > t.v) suite[n + 1]![d2]![w2] = { v, pris: [...c.pris, id] };
      }
    }
    etat = suite;
  }
  // une place vide se pioche sans se jouer : six cartes d'abord, puis les défenses, puis la valeur
  for (let n = 6; n >= 0; n--) for (let d = D; d >= 0; d--) {
    const meilleur = etat[n]![d]!.reduce<Case>((a, b) => (b && (!a || b.v > a.v) ? b : a), null);
    if (meilleur) return meilleur.pris;
  }
  return [];
}

/** Choisit l'escouade (un Porteur par lignée, le plus solide), lui confie les meilleures cartes et poste les autres */
function preparer(j: Jeu, duree: 'courte' | 'longue' = 'longue', ancien = false): string[] {
  const forgeron = j.forge ? posteDe(j, 'forge') : null;
  const presents = porteursPresents(j).filter((id) => !enMission(j, id));
  for (const id of presents) if (id !== forgeron) poster(j, id, null);
  const escouade = LIGNEES.map((l) => presents.filter((id) => id !== forgeron && porteurDef(id).lignee === l)
    .sort((a, b) => pvMaxCombat(j, b) - pvMaxCombat(j, a))[0]!).filter(Boolean);
  for (const id of escouade) {
    const voulues = meilleures(j, porteurDef(id).lignee, chargeMax(j, id), niveauPorteur(j, id).niveau);
    for (const k of j.porteurs[id]!.modules.slice()) if (!voulues.includes(k)) degreffer(j, k);
    for (const k of voulues) greffer(j, k, id);
  }
  // les autres travaillent : Générateur pour les Augmentés, Clinique pour les Génés, Forge pour les Résonants
  const libres = presents.filter((id) => !escouade.includes(id) && id !== forgeron);
  const postes: [Poste, Lignee][] = [['generateur', 'tech'], ['clinique', 'bio'], ['forge', 'reso']];
  for (const [b, l] of postes) {
    if (posteDe(j, b)) continue;
    const k = libres.findIndex((id) => porteurDef(id).lignee === l);
    const id = libres.splice(k >= 0 ? k : 0, 1)[0];
    if (id) poster(j, id, b);
  }
  // la fouille confiée (12 novembre 2026) : une deuxième escouade (un Porteur par lignée, les cartes que personne ne porte)
  // part fouiller seule la Strate vaincue la plus profonde qu'elle peut tenir ; la lignée cherchée change chaque jour
  if (!ancien && confieesOuvertes(j) && !j.confiee) {
    const seconde = LIGNEES.map((l) => libres.filter((id) => porteurDef(id).lignee === l).sort((a, b) => pvMaxCombat(j, b) - pvMaxCombat(j, a))[0]!).filter(Boolean);
    if (seconde.length === 3) {
      const portees = new Set(Object.values(j.porteurs).flatMap((p) => p.modules));
      for (const id of seconde) {
        const l = porteurDef(id).lignee, niveau = niveauPorteur(j, id).niveau;
        const vues = new Set(j.porteurs[id]!.modules.map(moduleDe));
        for (const k of Object.keys(j.collection).filter((c) => moduleDef(c).lignee === l && !portees.has(c) && niveauRequis(c) <= niveau)
          .sort((a, b) => valeurCarte(b, j.collection[b]!.niveau) - valeurCarte(a, j.collection[a]!.niveau))) {
          if (vues.has(moduleDe(k))) continue;
          if (greffer(j, k, id).ok) { vues.add(moduleDe(k)); portees.add(k); }
        }
      }
      const cible = LIGNEES[jourDe(j.dernierTick) % 3]!;
      for (let st = strateVaincue(j); st >= 1; st--) {
        if (!peutConfier(j, seconde, st, cible).ok) continue;
        if (confierFouille(j, seconde, st, cible, j.dernierTick).ok) for (const id of seconde) libres.splice(libres.indexOf(id), 1);
        break;
      }
    }
  }
  // les contrats de marée (31 octobre 2026) : la gabare emmène les Porteurs de réserve, si l'équipe a au moins une chance sur deux
  if (!mareesDe(j).contrat) {
    for (const c of contratsDuMoment(j, j.dernierTick).filter((x) => x.ouvert && !x.reussi).reverse()) {
      const eq = equipeConseillee(j, c.def, libres.filter((id) => !raisonHorsContrat(j, id)));
      if (eq.some((x) => !x) || tauxContrat(j, c.def, eq, c.indices) < 50) continue;
      if (envoyerContrat(j, c.id, eq as string[], j.dernierTick).ok) { for (const id of eq) libres.splice(libres.indexOf(id!), 1); break; }
    }
  }
  // ceux qui restent partent en mission (longue : le joueur revient plus tard) ; s'il n'y a plus de place, ils s'entraînent à la Tour
  // (28 octobre 2026) les naufragés d'abord tant qu'ils ramènent des creuseurs (plafond par Strate), sinon la meilleure destination pour lui
  for (const id of libres) {
    const nauf = destinationsDuJour(j.dernierTick).find((d) => secoursPossible(j, d, j.dernierTick));
    if (!envoyerMission(j, id, duree, j.dernierTick, nauf?.cle).ok && seancesDe(j).length < placesEntrainement(j)) poster(j, id, 'noyau');
  }
  return escouade;
}

/** Ce que fait le joueur au district entre deux expéditions */
function gerer(j: Jeu, now: number): void {
  const acte = decisionEnAttente(j);
  if (acte) decider(j, acte, DECISIONS[acte].options[0]!.id);
  // les scènes de la campagne se regardent au district : la convocation des Hauts ouvre la Flèche (12 novembre 2026)
  for (let sc = sceneCampagne(j); sc && voirScene(j, sc.id); sc = sceneCampagne(j));
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
  // 9 novembre 2026 (cristal unique) : tout se paie en cristaux. Un joueur moyen monte d'abord les cartes de son deck
  // (peu chères, c'est sa force en bas), lance ses chantiers, puis garde de côté de quoi payer le prochain (60 %)
  // avant d'acheter au Comptoir ou de refabriquer.
  const enDeck = new Set(Object.values(j.porteurs).flatMap((p) => p.modules));
  // 12 novembre 2026 : il monte ses cartes du deck, puis les promeut au métal suivant dès qu'il le peut
  for (let id of Object.keys(j.collection).filter((x) => enDeck.has(x))) {
    for (let g = 0; g < 12; g++) {
      if (monter(j, id).ok) continue;
      const p = promouvoir(j, id);
      if (!p.ok) break;
      id = p.cle!;
    }
  }
  // un chantier de la Tour bloqué faute d'Éclats : il en achète au Comptoir
  const tour = coutAmelioration(j, 'noyau');
  if (tour && j.eclats < (tour.eclats ?? 0) && j.energie >= tour.energie) while (j.batiments.comptoir && j.eclats < (tour.eclats ?? 0) && j.energie - prixEclatComptoir(j) >= tour.energie && acheterEclat(j, now).ok);
  for (const b of ['noyau', 'generateur', 'clinique', 'forge', 'comptoir'] as const) ameliorer(j, b, now);
  const prochain = (['noyau', 'generateur', 'clinique', 'forge', 'comptoir'] as const).map((b) => coutAmelioration(j, b))
    .filter((c): c is NonNullable<typeof c> => !!c && j.eclats >= (c.eclats ?? 0)).reduce((m, c) => Math.min(m, c.energie), Infinity);
  // l'Exode (10 novembre 2026), une fois ouvert : il lance l'étape suivante dès qu'il le peut, et met de côté pour elle
  // comme pour un chantier (le grand projet passe avant les achats au Comptoir)
  if (exodeOuvert(j) && !avancementExode(j).enCours) {
    const c = avancementExode(j).cout;
    // il complète ses Éclats au Comptoir, comme pour la Tour
    while (j.batiments.comptoir && j.eclats < c.eclats && j.energie - prixEclatComptoir(j) >= c.cristaux && acheterEclat(j, now).ok);
    lancerExode(j, now);
  }
  const exo = exodeOuvert(j) && !avancementExode(j).enCours ? avancementExode(j).cout.cristaux + Math.max(0, avancementExode(j).cout.eclats - j.eclats) * prixEclatComptoir(j) : Infinity;
  const aMettreDeCote = Math.min(prochain, exo);
  const reserve = Number.isFinite(aMettreDeCote) ? (aMettreDeCote === exo ? 1 : 0.6) * aMettreDeCote : 0;
  const libre = () => j.energie - reserve;
  // des Éclats au Comptoir (audit du 7 novembre 2026), s'il reste de quoi faire le reste (trois fois le prix)
  while (j.batiments.comptoir && libre() >= 3 * prixEclatComptoir(j) && acheterEclat(j, now).ok);
  // les secours en mer (12 novembre 2026) : il envoie un Porteur hors escouade chercher la prochaine famille
  {
    const secours = prochainSecours(j);
    const qui = libresPourBasses(j).find((id) => !escouadeDe(j).includes(id));
    if (secours && qui) envoyerBasses(j, secours.lieu.id, qui, now);
  }
  // le Comptoir : il achète les doublons des cartes de son deck, et une carte neuve si elle vaut mieux que la plus faible,
  // en gardant de quoi monter ses niveaux (une réserve de 2 fois le prix)
  garnirComptoir(j, now);
  const plusFaible = Math.min(...[...enDeck].map((id) => valeurCarte(id, j.collection[id]?.niveau ?? 1)));
  const basesDeck = new Set([...enDeck].map(moduleDe));
  j.comptoir.offres.forEach((id, i) => {
    // 12 novembre 2026 : une copie d'une carte du deck sert dans n'importe quel métal (un tiers par métal d'écart, ou elle la fait monter)
    const utile = basesDeck.has(moduleDe(id)) || (!clePossedee(j, moduleDe(id)) && valeurCarte(id, 1) > plusFaible);
    if (utile && libre() >= 2 * prixComptoir(id).composants) acheter(j, i, now);
  });
  // la Forge refabrique la carte du deck la plus proche de son prochain niveau, si les cristaux le permettent
  if (!j.forge && posteDe(j, 'forge')) {
    const cible = [...enDeck].filter((id) => j.collection[id] && coutRefabrication(id).eclats === 0)
      .sort((a, b) => j.collection[b]!.doublons - j.collection[a]!.doublons)[0];
    if (cible && libre() >= 2 * coutRefabrication(cible).energie) fabriquer(j, cible, now);
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
/** La durée des combats (en tours), par sorte de combat ; `strates` les range aussi par Strate (« groupe5 » : les groupes à −5) */
export type ToursCombat = Record<'normal' | 'groupe' | 'gardien' | 'epreuve', number[]> & { strates?: Record<string, number[]> };

export function jouerExpedition(j: Jeu, depart: () => boolean, jouer: (s: CombatEtat) => void, tours?: ToursCombat, bilan?: { retour?: ReturnType<typeof remonter> }): boolean {
  const fin = () => { const r = remonter(j); if (bilan) bilan.retour = r; return r.victoire; };
  if (!depart()) return false;
  let garde = 0;
  while (j.expedition && garde++ < 5000) {
    const x = j.expedition;
    if (!x.carte) {
      // un combat seul (Épreuve)
      if (x.combat.issue === 'en-cours') jouer(x.combat);
      else if (!x.cloture) { tours?.epreuve.push(x.combat.tour); finDeCombat(j); }
      else if (x.terminee) return fin();
      else continuer(j);
      continue;
    }
    if (x.phase === 'combat' && x.combat.issue === 'en-cours') { jouer(x.combat); continue; }
    if (x.phase === 'combat' && !x.cloture) {
      const sorte = salleCourante(x).type === 'gardien' ? 'gardien' : salleCourante(x).escorte?.length ? 'groupe' : 'normal';
      tours?.[sorte].push(x.combat.tour);
      if (tours?.strates) (tours.strates[sorte + x.strate] ??= []).push(x.combat.tour);
      finDeCombat(j); continue;
    }
    if (j.expedition.terminee) return fin();
    if (x.phase === 'combat') { continuer(j); continue; }
    const sante = x.porteurs.reduce((n, p) => n + Math.max(0, p.pv), 0) / x.porteurs.reduce((n, p) => n + p.pvMax, 0);
    if (x.rencontre) {
      if (!repondre(j, reponse(j, x.rencontre, sante)).ok) repondre(j, RENCONTRES[x.rencontre]!(j).options.length - 1);
      continue;
    }
    // le contenu des Strates (31 octobre 2026) : le joueur choisit à la Halte, essaie les portes, suit les passages qu'il voit
    if (x.enHalte) { choisirHalte(j, x.strate % 2); continue; }
    if (x.porte) {
      const main = mainAccordable(x);
      if (main) ouvrirPorte(j, main); else if (!x.porte.relance) relancerPorte(j); else passerPorte(j);
      continue;
    }
    if (reperentPassage(x, salleCourante(x)).length) { suivrePassage(j); continue; }
    if (salleCourante(x).type === 'camp' && sante < 0.3) { retraite(j); continue; }
    const choix = accessibles(x);
    if (!choix.length) break;
    // 30 octobre 2026 : le combat rapporte plus (composants, XP, carte) ; la cache est la voie sûre quand l'escouade est entamée.
    // Il ne voit que ce que le brouillard laisse voir.
    const prefere = (t: string) => (t === 'camp' ? (sante < 0.7 ? 0 : 3) : t === 'cache' || t === 'archive' ? (sante < 0.6 ? 1 : 2.5) : t === 'elite' ? (sante > 0.8 ? 1.5 : 4) : 2);
    entrer(j, choix.slice().sort((a, b) => prefere(typeApparent(x, a)) - prefere(typeApparent(x, b)))[0]!.id);
  }
  if (j.expedition) return fin();
  return false;
}

/**
 * Une partie de `jours` jours au rythme du profil. Au front, le joueur retente la Strate la plus profonde ;
 * après deux échecs d'affilée, il remonte faire une expédition dans la Strate d'au-dessus (pour ses cartes), puis retente.
 */
export function simulerParcours(
  profil: Profil, jours: number, graine: number,
  opts: { trace?: (j: Jeu, jour: number, escouade: string[]) => void; jusqua?: number;
    /** la Strate la plus profonde ouverte au joueur (le jeu gratuit s'arrête à −10, 12 novembre 2026) : plus bas, il ne tente plus le front */
    plafond?: number;
    /** appelé avant chaque expédition (attente : le gardien du front est vaincu, il manque des creuseurs) */
    session?: (j: Jeu, jour: number, attente: boolean) => void;
    /** les cristaux taillés, et le brut qui attendait à chaque session (en heures de taille) */
    energie?: { produite: number; attente: number[] }; joueur?: 'robot' | 'moyen'; tours?: ToursCombat; duree?: 'courte' | 'longue'; fin?: (j: Jeu) => void;
    /** appelé après chaque tentative au front : la Strate, la force de l'escouade au départ (forceEscouade) et l'issue */
    tentative?: (strate: number, force: number, victoire: boolean, j: Jeu) => void;
    /** faut-il tenter le front à cette session ? (sinon : une fouille juste au-dessus) ; par défaut, le joueur le tente toujours */
    oser?: (j: Jeu, strate: number, force: number) => boolean;
    /** le jeu d'avant le 12 novembre 2026 (ni fouille confiée, ni Strate remuée, ni Flèche pendant les paliers) : pour comparer */
    ancien?: boolean;
    /** appelé à chaque séance : ce que le joueur y a fait (front, fouille d'une Strate vaincue, Strate remuée du jour, Flèche) */
    sorte?: (sorte: 'front' | 'fouille' | 'remuee' | 'fleche', jour: number, strate: number) => void } = {},
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
  // l’Héritage du district : chaque partie simulée reçoit une vierge différente (les neuf cartes et la Clé, tour à tour)
  const legs = [...MODULES.filter((m) => m.legs).map((m) => m.id), 'cle'];
  choisirLegs(j, legs[graine % legs.length]!);
  for (const o of OBJECTIFS) { j.energie += (o.recompense.energie ?? 0) + (o.recompense.composants ?? 0); j.creuseurs += o.recompense.creuseurs ?? 0; }
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
      if (opts.jusqua && derniere >= opts.jusqua) { r.strate = j.strate; opts.fin?.(j); return true; }
    }
    return false;
  };
  let echecs = 0;
  const tick = (jj: Jeu, now: number) => {
    const avant = jj.energie;
    tickJeu(jj, now);
    // 9 novembre 2026 : plus rien ne se perd ; on note les cristaux taillés et le brut qui attend encore (en heures de taille)
    if (opts.energie) { opts.energie.produite += Math.max(0, jj.energie - avant); opts.energie.attente.push(Math.min(240, brutEnAttente(jj).heures)); }
  };
  for (let d = 0; d < jours; d++) {
    for (const h of profil.sessions) {
      const now = debut + d * JOUR + h * HEURE;
      tick(j, now);
      gerer(j, now);
      if (noter(d, [])) return r;
      const escouade = preparer(j, opts.duree, opts.ancien);
      const front = j.strate;
      const jouer = opts.joueur === 'robot' ? jouerTour : jouerTourMoyen;
      // une fois par jour, les Épreuves de la semaine pas encore réussies
      if (h === profil.sessions[0] && front >= 2) {
        const ep = epreuvesDeLaSemaine(now, j).find((e) => !j.epreuves.faites.includes(e.id));
        if (ep) { jouerExpedition(j, () => partirEpreuve(j, escouade, ep.id, now, suivant()).ok, jouer, opts.tours); gerer(j, now); }
      }
      // les pillages (8 novembre 2026 : jusque-là absents de la simulation) : à chaque session, un archipel
      // à sa portée (« facile » ou « équilibré »), et deux jetons achetés par jour s'il reste de l'énergie aux chantiers
      if (pillagesPermis(j)) {
        while (achatsRestants(j, now) && j.energie >= coutJeton(j) + 400 && acheterJeton(j, now).ok);
        for (let k = 0; k < 1; k++) {
          const c = ciblesDuJour(j, escouade, now).find((x) => difficulte(x.force / Math.max(0.01, forceEscouade(j, escouade))).niveau <= 2);
          if (!c || !peutPiller(j, now).ok) break;
          jouerExpedition(j, () => piller(j, escouade, c, now, suivant()).ok, jouer);
          gerer(j, now);
        }
      }
      // bloqué au front (deux échecs d'affilée) : une fouille ciblée juste au-dessus, pour la lignée la plus faible du deck
      // le gardien du front est vaincu, mais il manque des creuseurs : on fouille le front pour en retrouver
      const attente = j.frontVaincu;
      opts.session?.(j, d + 1, attente);
      const forceDepart = opts.tentative || opts.oser ? forceEscouade(j, escouade) : 0;
      const prudent = !!opts.oser && !attente && front > 1 && !opts.oser(j, front, forceDepart);
      const bloque = !!opts.plafond && front > opts.plafond;
      const cible = bloque ? opts.plafond! : attente ? front : prudent || (echecs >= 2 && front > 1) ? front - 1 : front;
      const faible = LIGNEES.map((l) => ({ l, v: meilleures(j, l, Math.max(...escouade.filter((id) => porteurDef(id).lignee === l).map((id) => chargeMax(j, id)), chargeMax(j, NOMME[l])), Math.max(...escouade.filter((id) => porteurDef(id).lignee === l).map((id) => niveauPorteur(j, id).niveau), niveauPorteur(j, NOMME[l]).niveau)).reduce((n, id) => n + valeurCarte(id, j.collection[id]!.niveau), 0) / DEFENSES_POIDS[l] }))
        .sort((a, b) => a.v - b.v)[0]!.l;
      // un joueur moyen paie les soins intensifs avant de retenter le front, si l'énergie ne manque pas aux chantiers
      if (cible === front && !attente) for (const id of escouade) if (j.energie >= 150) soignerVite(j, id);
      const g = suivant();
      // 12 novembre 2026 : quand il ne tente pas le front, il ne refouille plus la même Strate par défaut. D'abord la Strate
      // remuée du jour (une fois), puis la Flèche tant qu'il a une chance sur deux d'y monter, sinon la fouille d'avant.
      const auFront = cible === front && !attente && !bloque;
      const rem = auFront || opts.ancien ? null : strateRemuee(j, now);
      const monte = !auFront && !opts.ancien && !(rem && !rem.faite) && flecheOuverte(j) && peutMonter(j).ok && chanceQuai(forceEscouade(j, escouade), etatFleche(j).quai) >= 0.5;
      const sorte = auFront ? 'front' : rem && !rem.faite ? 'remuee' : monte ? 'fleche' : 'fouille';
      opts.sorte?.(sorte, d + 1, front);
      const victoire = jouerExpedition(j, () => (sorte === 'front' ? partir(j, escouade, cible, g) : sorte === 'remuee' ? fouiller(j, escouade, rem!.strate, faible, g)
        : sorte === 'fleche' ? monterFleche(j, escouade, g) : fouiller(j, escouade, cible, faible, g)).ok, jouer, opts.tours);
      depuis++;
      if (attente) { /* fouille d'attente : ne compte pas comme une tentative au front */ } else if (cible === front) {
        r.front.tentatives++;
        if (victoire) r.front.victoires++;
        opts.tentative?.(front, forceDepart, victoire, j);
        echecs = victoire ? 0 : echecs + 1;
      } else echecs = 1;
      if (noter(d, escouade)) return r;
      tick(j, now + 15 * 60_000);
      gerer(j, now + 15 * 60_000);
    }
  }
  r.strate = j.strate;
  opts.fin?.(j);
  return r;
}

/** La médiane d'une liste (Infinity pour « jamais ») */
export const mediane = (xs: number[]) => {
  const s = xs.slice().sort((a, b) => a - b);
  return s.length ? s[Math.floor(s.length / 2)]! : NaN;
};
