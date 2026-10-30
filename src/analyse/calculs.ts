// Les calculs de l'outil d'analyse : à partir de toutes les sauvegardes, tout ce qui sert à équilibrer le jeu.
// Fonctions pures (aucun navigateur) : testées dans tests/analyse.test.ts.
// Les seuils des « points d'attention » sont regroupés dans SEUILS, en bas de l'en-tête.

import { BATIMENTS, ENNEMIS, GESTES_SPECIAUX, MODULES, PORTEURS, moduleDef } from '../core/donnees';
import { jourDe, niveauPorteur, OBJECTIFS, porteursPresents, type Jeu } from '../core/jeu';
import type { BatimentId, Rarete } from '../core/types';

/** Une sauvegarde lue dans Firestore */
export interface Partie {
  uid: string;
  jeu: Jeu;
  /** dernière sauvegarde reçue par le serveur (ms) */
  maj: number;
}

export interface Ligne { cle: string; nom: string; valeur: number; detail?: string }
export interface Alerte { niveau: 'attention' | 'info'; theme: string; texte: string }

export interface LigneEnnemi { id: string; nom: string; combats: number; victoires: number; defaites: number; fuites: number; tours: number; joueurs: number }
export interface LigneStrate { strate: number; expeditions: number; gardien: number; defaites: number; fuites: number; retraites: number }
export interface LigneJalon { cle: string; nom: string; joueurs: number; minutes: number }
export interface LignePorteur { id: string; nom: string; presents: number; niveau: number; expeditions: number; gardien: number }
export interface LigneCarte { id: string; nom: string; metal: Rarete; jouee: number; part: number; possedee: number; niveau: number }
export interface LigneEconomie { tranche: string; joueurs: number; energie: number; composants: number; eclats: number; creuseurs: number; confiance: number; batiments: Record<BatimentId, number> }
export interface LigneJoueur {
  joueur: number; strate: number; minutes: number; sessions: number; jours: number; derniere: number; premierJour: number | null;
  appareil: string; compte: string; cartes: number; porteurs: number; noyau: number;
  /** l’Héritage reçu (id de la carte, « cle »), « attend » si la lettre n'est pas encore lue, ou « — » avant la chambre (29 octobre 2026) */
  heritage: string;
  /** la descente en cours (Strate), ou 0 */
  descente: number;
}
export interface Cohorte { debut: number; taille: number; retention: (number | null)[] }

export interface Analyse {
  joueurs: number;
  sansStats: number;
  actifs: { jour: number; semaine: number; mois: number };
  nouveaux7: number;
  mediane: { minutes: number; sessions: number; jours: number; session: number };
  heuresTotales: number;
  parJour: { jour: number; actifs: number; nouveaux: number }[];
  heures: number[];
  durees: Ligne[];
  retention: { delai: number; eligibles: number; revenus: number }[];
  cohortes: Cohorte[];
  entonnoir: Ligne[];
  objectifs: Ligne[];
  strates: Ligne[];
  jalons: LigneJalon[];
  ennemis: LigneEnnemi[];
  expeditions: LigneStrate[];
  chaines: Ligne[];
  suites: Ligne[];
  porteurs: LignePorteur[];
  cartes: LigneCarte[];
  metaux: Ligne[];
  economie: LigneEconomie[];
  campagne: { titre: string; lignes: Ligne[] }[];
  fonctions: Ligne[];
  actions: Ligne[];
  eclats: Ligne[];
  appareils: Ligne[];
  comptes: Ligne[];
  liste: LigneJoueur[];
  alertes: Alerte[];
}

/** Les filtres du tableau de bord */
export interface Filtre {
  /** joueurs actifs dans la période (dernière sauvegarde) */
  periode: 'tout' | '30' | '7';
  segment: 'tous' | 'telephone' | 'pc' | 'protege' | 'invisible' | 'aucun';
}

const JOUR = 86_400_000;
const DELAIS = [1, 3, 7, 14, 30];
const METAUX: Rarete[] = ['fer', 'cuivre', 'argent', 'or', 'nacre'];
const NOMS_METAUX: Record<Rarete, string> = { fer: 'Fer', cuivre: 'Cuivre', argent: 'Argent', or: 'Or', nacre: 'Nacre' };

/** Les seuils des points d'attention */
const SEUILS = {
  /** un échantillon plus petit ne déclenche rien : trop de hasard */
  minJoueurs: 5, minCombats: 20, minExpeditions: 10,
  retentionJ1: 0.4, retentionJ7: 0.2,
  /** défaites + fuites au-delà : ennemi peut-être trop fort ; victoires au-delà : trop facile */
  echecEnnemi: 0.35, victoireEnnemi: 0.97,
  gardienStrate: 0.15,
  /** une carte possédée par beaucoup mais presque jamais lancée, ou une carte qui écrase les autres */
  possessionCarte: 0.3, partFaible: 0.005, partDominante: 0.12,
  fonctionPeuUtilisee: 0.2,
  chuteEntonnoir: 0.4,
};

const mediane = (l: number[]) => {
  if (!l.length) return 0;
  const t = [...l].sort((a, b) => a - b);
  const m = Math.floor(t.length / 2);
  return t.length % 2 ? t[m]! : (t[m - 1]! + t[m]!) / 2;
};
const moyenne = (l: number[]) => (l.length ? l.reduce((a, b) => a + b, 0) / l.length : 0);
const pct = (n: number, sur: number) => (sur ? Math.round((100 * n) / sur) : 0);

/** les boutons du jeu (data-action), en clair */
const NOMS_ACTIONS: Record<string, string> = {
  'titre-jouer': 'Écran titre : jouer', 'titre-compte': 'Écran titre : compte', 'intro-suivant': 'Intro : suivant', 'intro-precedent': 'Intro : retour', 'intro-passer': 'Intro : passer',
  'intro-oeil': 'Intro : cacher le texte', intro: 'Revoir l’intro', batiment: 'Ouvrir un bâtiment', fermer: 'Fermer un bâtiment', ameliorer: 'Améliorer un bâtiment',
  'vers-amelioration': 'Aller à l’amélioration', poster: 'Poster un Porteur', liberer: 'Libérer un Porteur', acheter: 'Comptoir : acheter', fabriquer: 'Forge : refabriquer',
  archipel: 'Onglet District', coupe: 'Onglet Tour', porteurs: 'Onglet Porteurs', cartes: 'Onglet Cartes', codex: 'Onglet Chroniques', bibliotheque: 'Écran titre : Chroniques',
  menu: 'Menu', ressource: 'Détail d’une ressource', porteur: 'Fiche d’un Porteur', 'porteur-fermer': 'Fermer une fiche de Porteur', 'porteurs-tous': 'Tous les Porteurs',
  'porteurs-escouade': 'Mon escouade', 'escouade-place': 'Changer un Porteur de l’escouade', 'escouade-mettre': 'Mettre dans l’escouade', 'escouade-fermer': 'Fermer le choix d’escouade', 'ratelier': 'Ouvrir le Râtelier', 'ratelier-fermer': 'Fermer le Râtelier', 'ratelier-basculer': 'Changer une carte du Râtelier',
  carte: 'Détail d’une carte', 'carte-fermer': 'Fermer une carte', deck: 'Cartes d’un Porteur', 'deck-fermer': 'Fermer les cartes d’un Porteur', greffer: 'Confier une carte',
  degreffer: 'Reprendre une carte', monter: 'Monter une carte de niveau', recycler: 'Recycler une carte', filtre: 'Filtrer les cartes', tri: 'Trier les cartes',
  guide: 'Mode d’emploi des cartes', 'guide-fermer': 'Fermer le mode d’emploi', descendre: 'Préparer une descente', 'fouiller-choix': 'Préparer une fouille ciblée', cible: 'Choisir la cible d’une fouille',
  epreuve: 'Préparer une Épreuve', choisir: 'Choisir un Porteur pour descendre', partir: 'Partir en expédition', mission: 'Envoyer en mission', entrer: 'Entrer dans la Tour',
  salle: 'Entrer dans une salle', 'salle-voir': 'Voir une salle sur le plan', repondre: 'Répondre à une rencontre', ajouter: 'Combat : ajouter une carte', retirer: 'Combat : retirer une carte', accorder: 'Combat : accorder une carte',
  cibler: 'Combat : cibler un soin', viser: 'Combat : viser un ennemi', vider: 'Combat : vider la chaîne', allonger: 'Combat : allonger la main', repiocher: 'Combat : repiocher', relancer: 'Combat : relancer la première main',
  lancer: 'Combat : lancer la chaîne', regles: 'Combat : règles', fuir: 'Combat : fuir (choix)', 'fuir-salle': 'Fuir d’une salle', 'fuir-district': 'Fuir au district', suivant: 'Combat suivant',
  retraite: 'Remonter (retraite)', remonter: 'Remonter au district', reprendre: 'Reprendre l’expédition', 'decouverte-ok': 'Fermer une découverte', son: 'Son',
  colis: 'Ouvrir le Ravitaillement', 'reclamer-jour': 'Objectif du jour', reclamer: 'Réclamer un objectif guidé', 'objectif-aller': 'Aller vers l’objectif', prendre: 'Prendre une carte au choix',
  'ouvrir-archive': 'Ouvrir une archive', 'ouvrir-chambre': 'Ouvrir la chambre scellée', decider: 'Décision de campagne', chapitre: 'Lire un chapitre', 'chapitre-fermer': 'Fermer un chapitre',
  'biblio-onglet': 'Chroniques : changer d’onglet', 'biblio-retour': 'Chroniques : retour', rencontre: 'Rencontre', 'rencontre-suite': 'Rencontre : suite', briefing: 'Avant d’ouvrir',
  'briefing-suite': 'Avant d’ouvrir : suite', 'briefing-retour': 'Avant d’ouvrir : retour', 'retour-ok': 'Fermer le résumé du retour', 'age-ok': 'Nouvel âge du district', 'ok-message': 'Fermer un message',
  panneau: 'Replier le panneau (PC)', classements: 'Grand Tableau', 'gt-tableau': 'Grand Tableau : onglet', 'gt-periode': 'Grand Tableau : période', 'gt-regles': 'Grand Tableau : règles',
  'gt-actualiser': 'Grand Tableau : actualiser', 'gt-connexion': 'Grand Tableau : se connecter', 'gt-nom': 'Choisir un pseudo', 'gt-nom-ok': 'Valider le pseudo', 'gt-nom-fermer': 'Fermer le pseudo',
  'gt-retirer': 'Ne plus apparaître (choix)', 'gt-retirer-ok': 'Se retirer du Tableau', compte: 'Panneau Compte', google: 'Connexion Google', connexion: 'Connexion e-mail',
  inscription: 'Créer un compte', oubli: 'Mot de passe oublié', deconnexion: 'Se déconnecter', secours: 'Partie de secours (choix)', 'secours-confirmer': 'Restaurer la partie de secours',
  'rappel-proteger': 'Rappel : protéger ma partie', 'rappel-plus-tard': 'Rappel : plus tard', installer: 'Installer le jeu',
};

const nomEnnemi = (id: string) => ENNEMIS.find((e) => e.id === id)?.nom ?? id;
function nomCarte(id: string): string {
  try { return moduleDef(id).nom; } catch { return GESTES_SPECIAUX.find((g) => g.id === id)?.nom ?? id; }
}

/** l'heure figée des captures automatiques (scripts/visuel.ts) */
const HEURE_DES_TESTS = Date.parse('2026-10-25T10:00:00Z');

/**
 * Les parties créées par les tests automatiques du 25 octobre 2026, avant qu'ils soient coupés de Firebase :
 * l'horloge figée des captures (la partie dit 10 h, le serveur l'a reçue bien plus tard),
 * ou la sauvegarde de démonstration (scripts/etat-demo.ts) presque intacte.
 */
export function estPartieDeTest(p: Partie): boolean {
  const j = p.jeu;
  const horlogeFigee = Math.abs(j.dernierTick - HEURE_DES_TESTS) < 10 * 60_000 && p.maj - j.dernierTick > 30 * 60_000;
  const demo = j.strate === 5 && j.objectif === 4 && j.confiance === 64 && j.eclats === 7 && Object.keys(j.collection).length === 51;
  return horlogeFigee || demo;
}

/**
 * Une simple visite, pas un joueur : l'écran titre ouvert sans jamais commencer (robot, aperçu de lien, navigateur intégré).
 * Avant le 26 octobre 2026, le compte invisible était créé dès l'ouverture du site et envoyait cette partie vide.
 */
export function estVisite(p: Partie): boolean {
  return !p.jeu.introVue && (p.jeu.stats?.secondes ?? 0) < 60;
}

/** Les vraies parties, et combien de parties de test et de simples visites ont été écartées */
export function sansTests(parties: Partie[]): { parties: Partie[]; tests: number; visites: number } {
  const sansT = parties.filter((p) => !estPartieDeTest(p));
  const vraies = sansT.filter((p) => !estVisite(p));
  return { parties: vraies, tests: parties.length - sansT.length, visites: sansT.length - vraies.length };
}

export function filtrer(parties: Partie[], f: Filtre, now: number): Partie[] {
  return parties.filter((p) => {
    if (f.periode !== 'tout' && now - p.maj > Number(f.periode) * JOUR) return false;
    const s = p.jeu.stats;
    if (f.segment === 'tous') return true;
    if (f.segment === 'telephone' || f.segment === 'pc') return s?.appareil === f.segment;
    return (s?.compte ?? 'aucun') === f.segment;
  });
}

export function analyser(parties: Partie[], now: number): Analyse {
  const aujourdHui = jourDe(now);
  const stats = parties.filter((p) => p.jeu.stats).map((p) => ({ p, s: p.jeu.stats! }));
  const n = parties.length;
  const compter = (f: (j: Jeu) => unknown) => parties.filter((p) => f(p.jeu)).length;

  // ---------- activité ----------
  const parJour = Array.from({ length: 30 }, (_, k) => {
    const jour = aujourdHui - 29 + k;
    return { jour, actifs: stats.filter(({ s }) => s.jours.includes(jour)).length, nouveaux: stats.filter(({ s }) => s.premierJour === jour).length };
  });
  const heures = Array<number>(24).fill(0);
  for (const { s } of stats) s.heures?.forEach((v, h) => { heures[h]! += v; });
  const toutesDurees = stats.flatMap(({ s }) => s.durees ?? []);
  const TRANCHES: [string, number, number][] = [['Moins d’1 min', 0, 60], ['1 à 5 min', 60, 300], ['5 à 15 min', 300, 900], ['15 à 30 min', 900, 1800], ['30 min à 1 h', 1800, 3600], ['Plus d’1 h', 3600, Infinity]];
  const durees = TRANCHES.map(([nom, a, b]) => ({ cle: nom, nom, valeur: toutesDurees.filter((d) => d >= a && d < b).length }));

  // ---------- rétention ----------
  const revenu = (s: NonNullable<Jeu['stats']>, delai: number) => s.jours.some((d) => d >= s.premierJour + delai);
  const retention = DELAIS.map((delai) => {
    const el = stats.filter(({ s }) => s.premierJour <= aujourdHui - delai);
    return { delai, eligibles: el.length, revenus: el.filter(({ s }) => revenu(s, delai)).length };
  });
  // cohortes : par semaine de premier jeu, les 8 dernières semaines
  const cohortes: Cohorte[] = Array.from({ length: 8 }, (_, k) => {
    const debut = aujourdHui - (8 - k) * 7 + 1;
    const groupe = stats.filter(({ s }) => s.premierJour >= debut && s.premierJour < debut + 7);
    return {
      debut,
      taille: groupe.length,
      retention: [1, 7, 14, 30].map((delai) => {
        const el = groupe.filter(({ s }) => s.premierJour <= aujourdHui - delai);
        return el.length ? el.filter(({ s }) => revenu(s, delai)).length / el.length : null;
      }),
    };
  }).filter((c) => c.taille > 0);

  // ---------- progression ----------
  const etapes: [string, string, (j: Jeu) => boolean][] = [
    ['intro', 'Intro vue', (j) => j.introVue],
    ['chambre', 'Chambre scellée ouverte', (j) => j.chambre],
    ['recrues', 'Recrues arrivées', (j) => j.recrues],
    ...[2, 3, 4, 5, 7, 10].map((s): [string, string, (j: Jeu) => boolean] => [`s${s}`, `Strate −${s}`, (j) => j.strate >= s]),
  ];
  const entonnoir = etapes.map(([cle, nom, f], i) => {
    const v = compter(f);
    const avant = i ? compter(etapes[i - 1]![2]) : n;
    return { cle, nom, valeur: v, detail: i ? `${pct(v, avant)} % de l’étape d’avant` : `${pct(v, n)} %` };
  });
  const objectifs = [...OBJECTIFS.map((o, i) => ({ cle: o.id, nom: o.titre, valeur: compter((j) => j.objectif > i) })),
    { cle: 'fini', nom: 'Tous les objectifs guidés remplis', valeur: compter((j) => j.objectif >= OBJECTIFS.length) }];
  const plusProfonde = Math.max(1, ...parties.map((p) => p.jeu.strate));
  const strates = Array.from({ length: plusProfonde }, (_, k) => ({ cle: String(k + 1), nom: `Strate −${k + 1}`, valeur: compter((j) => j.strate === k + 1) }));
  const clesJalons = [['intro', 'Intro vue'], ['chambre', 'Chambre scellée ouverte'], ['recrues', 'Recrues arrivées'],
    ...Array.from({ length: 9 }, (_, k) => [`strate-${k + 2}`, `Strate −${k + 2} ouverte`]),
    ...Array.from({ length: 4 }, (_, k) => [`noyau-${k + 2}`, `Tour du Noyau niveau ${k + 2}`])];
  const jalons = clesJalons.map(([cle, nom]) => {
    const t = stats.map(({ s }) => s.jalons?.[cle!]).filter((v): v is number => v !== undefined);
    return { cle: cle!, nom: nom!, joueurs: t.length, minutes: Math.round(mediane(t) / 60) };
  }).filter((l) => l.joueurs > 0);

  // ---------- combats ----------
  const ennemis = new Map<string, LigneEnnemi>();
  const expeditions = new Map<number, LigneStrate>();
  const chaines: number[] = []; const suites: number[] = [];
  for (const { s } of stats) {
    for (const [id, [v, d, f, t]] of Object.entries(s.ennemis)) {
      const l = ennemis.get(id) ?? { id, nom: nomEnnemi(id), combats: 0, victoires: 0, defaites: 0, fuites: 0, tours: 0, joueurs: 0 };
      l.victoires += v; l.defaites += d; l.fuites += f; l.tours += t; l.combats += v + d + f; l.joueurs++;
      ennemis.set(id, l);
    }
    for (const [st, [nb, g, d, f, r]] of Object.entries(s.strates)) {
      const strate = Number(st);
      const l = expeditions.get(strate) ?? { strate, expeditions: 0, gardien: 0, defaites: 0, fuites: 0, retraites: 0 };
      l.expeditions += nb; l.gardien += g; l.defaites += d; l.fuites += f; l.retraites += r;
      expeditions.set(strate, l);
    }
    s.chaines?.forEach((v, i) => { chaines[i] = (chaines[i] ?? 0) + (v ?? 0); });
    s.suites?.forEach((v, i) => { suites[i] = (suites[i] ?? 0) + (v ?? 0); });
  }
  const histo = (t: number[], nom: (i: number) => string) => Array.from({ length: t.length }, (_, i) => ({ cle: String(i), nom: nom(i), valeur: t[i] ?? 0 })).filter((l, i) => i > 0 || l.valeur > 0);

  // ---------- Porteurs ----------
  const porteurs: LignePorteur[] = PORTEURS.map((d) => {
    const chez = parties.filter((p) => porteursPresents(p.jeu).includes(d.id));
    let exp = 0; let gardien = 0;
    for (const { s } of stats) { const t = s.porteurs?.[d.id]; if (t) { exp += t[0]; gardien += t[1]; } }
    return { id: d.id, nom: d.nom, presents: chez.length, niveau: moyenne(chez.map((p) => niveauPorteur(p.jeu, d.id).niveau)), expeditions: exp, gardien };
  }).filter((l) => l.presents > 0 || l.expeditions > 0).sort((a, b) => b.presents - a.presents || b.expeditions - a.expeditions);

  // ---------- cartes ----------
  const jouees = new Map<string, number>();
  for (const { s } of stats) for (const [id, v] of Object.entries(s.cartes)) jouees.set(id, (jouees.get(id) ?? 0) + v);
  const totalJouees = [...jouees.values()].reduce((a, b) => a + b, 0);
  const cartes: LigneCarte[] = MODULES.map((m) => {
    const exemplaires = parties.map((p) => Object.entries(p.jeu.collection).filter(([k]) => k.split('@')[0] === m.id));
    const possedee = exemplaires.filter((e) => e.length).length;
    const niveaux = exemplaires.flat().map(([, c]) => c.niveau);
    const v = jouees.get(m.id) ?? 0;
    return { id: m.id, nom: m.nom, metal: m.rarete, jouee: v, part: totalJouees ? v / totalJouees : 0, possedee, niveau: moyenne(niveaux) };
  });
  // les cartes du district (Stimulant, Pavois de cuivre) : dans tous les decks, jamais dans la collection
  for (const [id, v] of jouees) {
    if (!MODULES.some((m) => m.id === id)) cartes.push({ id, nom: nomCarte(id), metal: 'fer', jouee: v, part: totalJouees ? v / totalJouees : 0, possedee: n, niveau: 1 });
  }
  cartes.sort((a, b) => b.jouee - a.jouee || b.possedee - a.possedee);
  const metaux = METAUX.map((m) => ({ cle: m, nom: NOMS_METAUX[m], valeur: parties.reduce((t, p) => t + Object.keys(p.jeu.collection).filter((k) => k.endsWith('@' + m)).length, 0) }));

  // ---------- économie, par avancée ----------
  const TRANCHES_STRATE: [string, number, number][] = [['Strate −1', 1, 1], ['Strates −2 et −3', 2, 3], ['Strates −4 à −6', 4, 6], ['Strate −7 et plus', 7, Infinity]];
  const economie = TRANCHES_STRATE.map(([tranche, a, b]) => {
    const g = parties.filter((p) => p.jeu.strate >= a && p.jeu.strate <= b).map((p) => p.jeu);
    return {
      tranche, joueurs: g.length,
      energie: mediane(g.map((j) => Math.floor(j.energie))), composants: mediane(g.map((j) => Math.floor(j.composants))), eclats: mediane(g.map((j) => j.eclats)),
      creuseurs: mediane(g.map((j) => j.creuseurs ?? 0)), confiance: mediane(g.map((j) => j.confiance ?? 50)),
      batiments: Object.fromEntries(BATIMENTS.map((d) => [d.id, moyenne(g.map((j) => j.batiments[d.id] ?? 0))])) as Record<BatimentId, number>,
    };
  }).filter((l) => l.joueurs > 0);

  // ---------- campagne ----------
  const choix = (titre: string, cle: 'chambre' | 'lecture' | 'fin', noms: Record<string, string>) => ({
    titre, lignes: Object.entries(noms).map(([id, nom]) => ({ cle: id, nom, valeur: compter((j) => j.actes[cle] === id) })),
  });
  const campagne = [
    choix('Qui garde la chambre ?', 'chambre', { orseve: 'La Maison Orsève', district: 'Le district seul', commission: 'Une commission avec les Veilleurs' }),
    choix('La dernière lecture', 'lecture', { autoriser: 'Autoriser la lecture', refuser: 'Refuser, la protéger' }),
    choix('La vérité', 'fin', { scellement: 'Le Grand Scellement', pacte: 'Le pacte', archives: 'Les archives' }),
  ].filter((c) => c.lignes.some((l) => l.valeur > 0));

  // ---------- fonctions utilisées ----------
  const utilise = (s: NonNullable<Jeu['stats']>, cles: string[]) => cles.some((c) => (s.actions?.[c] ?? 0) > 0);
  const avecActions = stats.filter(({ s }) => s.actions);
  const FONCTIONS: [string, string, string[]][] = [
    ['missions', 'Missions', ['mission']], ['comptoir', 'Comptoir (achats)', ['acheter']], ['forge', 'Forge (refabriquer)', ['fabriquer']],
    ['ameliorer', 'Améliorer un bâtiment', ['ameliorer']], ['poster', 'Poster un Porteur', ['poster']], ['greffer', 'Confier une carte', ['greffer']],
    ['monter', 'Monter une carte de niveau', ['monter']], ['recycler', 'Recycler une carte', ['recycler']], ['escouade', 'Changer l’escouade', ['escouade-mettre']],
    ['fouille', 'Fouille ciblée', ['fouiller-choix']], ['epreuve', 'Épreuves', ['epreuve']], ['colis', 'Ravitaillement', ['colis']],
    ['quotidien', 'Objectif du jour', ['reclamer-jour']], ['chroniques', 'Lire les Chroniques', ['chapitre']], ['tableau', 'Grand Tableau', ['classements']],
    ['guide', 'Mode d’emploi des cartes', ['guide']], ['fuite', 'Fuir un combat', ['fuir-salle', 'fuir-district']],
  ];
  const fonctions = FONCTIONS.map(([cle, nom, cles]) => {
    const v = avecActions.filter(({ s }) => utilise(s, cles)).length;
    return { cle, nom, valeur: v, detail: `${pct(v, avecActions.length)} %` };
  }).sort((a, b) => b.valeur - a.valeur);
  const totalActions = new Map<string, number>();
  for (const { s } of avecActions) for (const [a, v] of Object.entries(s.actions!)) totalActions.set(a, (totalActions.get(a) ?? 0) + v);
  // les Coups d'éclat, par lignée ; pour les Augmentés, la part déclenchée par un deck du Moteur (cartes à Décharge)
  const totalEclats = new Map<string, number>();
  for (const { s } of stats) for (const [k, v] of Object.entries(s.eclats ?? {})) totalEclats.set(k, (totalEclats.get(k) ?? 0) + v);
  const NOMS_ECLATS: Record<string, string> = { tech: 'Débridage (Augmentés)', 'tech-decharge': 'dont avec un deck du Moteur', bio: 'Sursaut (Génés)', reso: 'Ombre agissante (Résonants)' };
  const eclats = ['tech', 'tech-decharge', 'bio', 'reso'].map((k) => ({ cle: k, nom: NOMS_ECLATS[k]!, valeur: totalEclats.get(k) ?? 0 }));
  const actions = [...totalActions.entries()].sort((a, b) => b[1] - a[1]).slice(0, 30).map(([a, v]) => ({ cle: a, nom: NOMS_ACTIONS[a] ?? a, valeur: v }));

  // ---------- joueurs ----------
  const liste: LigneJoueur[] = parties.map((p, i) => {
    const s = p.jeu.stats;
    return {
      joueur: i + 1, strate: p.jeu.strate, minutes: Math.round((s?.secondes ?? 0) / 60), sessions: s?.sessions ?? 0, jours: s?.jours.length ?? 0,
      derniere: p.maj, premierJour: s?.premierJour ?? null, appareil: s?.appareil ?? '—', compte: s?.compte ?? '—',
      cartes: Object.keys(p.jeu.collection).length, porteurs: Object.keys(p.jeu.porteurs).length, noyau: p.jeu.batiments.noyau,
      heritage: p.jeu.legs ?? (p.jeu.chambre ? 'attend' : '—'), descente: p.jeu.expedition ? p.jeu.expedition.strate || -1 : 0,
    };
  }).sort((a, b) => b.derniere - a.derniere);

  const a: Analyse = {
    joueurs: n,
    sansStats: n - stats.length,
    actifs: { jour: parties.filter((p) => now - p.maj < JOUR).length, semaine: parties.filter((p) => now - p.maj < 7 * JOUR).length, mois: parties.filter((p) => now - p.maj < 30 * JOUR).length },
    nouveaux7: stats.filter(({ s }) => s.premierJour > aujourdHui - 7).length,
    mediane: {
      minutes: Math.round(mediane(stats.map(({ s }) => s.secondes)) / 60),
      sessions: mediane(stats.map(({ s }) => s.sessions)),
      jours: mediane(stats.map(({ s }) => s.jours.length)),
      session: Math.round(mediane(toutesDurees) / 60),
    },
    heuresTotales: Math.round(stats.reduce((t, { s }) => t + s.secondes, 0) / 3600),
    parJour, heures, durees, retention, cohortes,
    entonnoir, objectifs, strates, jalons,
    ennemis: [...ennemis.values()].sort((x, y) => y.combats - x.combats),
    expeditions: [...expeditions.values()].sort((x, y) => x.strate - y.strate),
    chaines: histo(chaines, (i) => `${i} carte${i > 1 ? 's' : ''}`),
    suites: histo(suites, (i) => (i ? `Suite de ${i}` : 'Pas de suite')),
    porteurs, cartes, metaux, economie, campagne, fonctions, actions, eclats,
    appareils: (['telephone', 'pc'] as const).map((x) => ({ cle: x, nom: x === 'pc' ? 'PC' : 'Téléphone', valeur: stats.filter(({ s }) => s.appareil === x).length })),
    comptes: (['protege', 'invisible', 'aucun'] as const).map((c) => ({
      cle: c, nom: { protege: 'Compte Google ou e-mail', invisible: 'Compte invisible', aucun: 'Sans compte' }[c], valeur: stats.filter(({ s }) => s.compte === c).length,
    })),
    liste,
    alertes: [],
  };
  a.alertes = alertes(a);
  return a;
}

/** Les points d'attention : ce qui mérite un coup d'œil pour l'équilibrage, du plus important au moins important */
function alertes(a: Analyse): Alerte[] {
  const l: Alerte[] = [];
  const S = SEUILS;
  if (a.sansStats) l.push({ niveau: 'info', theme: 'Données', texte: `${a.sansStats} sauvegarde(s) d’avant les statistiques : elles comptent dans la progression, pas dans les combats ni la rétention.` });
  // les premières étapes (l'accueil du jeu) : plus loin, une chute est normale, les joueurs n'ont pas encore eu le temps
  const ACCUEIL = new Set(['chambre', 'recrues', 's2']);
  for (let i = 1; i < a.entonnoir.length; i++) {
    const avant = a.entonnoir[i - 1]!.valeur; const apres = a.entonnoir[i]!.valeur;
    if (ACCUEIL.has(a.entonnoir[i]!.cle) && avant >= S.minJoueurs && 1 - apres / avant >= S.chuteEntonnoir) {
      l.push({ niveau: 'attention', theme: 'Progression', texte: `${pct(avant - apres, avant)} % des joueurs arrivés à « ${a.entonnoir[i - 1]!.nom} » ne vont pas jusqu’à « ${a.entonnoir[i]!.nom} ».` });
    }
  }
  for (const r of a.retention) {
    const seuil = r.delai === 1 ? S.retentionJ1 : r.delai === 7 ? S.retentionJ7 : null;
    if (seuil !== null && r.eligibles >= S.minJoueurs && r.revenus / r.eligibles < seuil) {
      l.push({ niveau: 'attention', theme: 'Rétention', texte: `Seulement ${pct(r.revenus, r.eligibles)} % des joueurs reviennent après ${r.delai} jour${r.delai > 1 ? 's' : ''} (${r.revenus} sur ${r.eligibles}).` });
    }
  }
  for (const e of a.ennemis) {
    if (e.combats < S.minCombats) continue;
    const echec = (e.defaites + e.fuites) / e.combats;
    if (echec >= S.echecEnnemi) l.push({ niveau: 'attention', theme: 'Combats', texte: `${e.nom} : ${pct(e.defaites + e.fuites, e.combats)} % de défaites ou de fuites sur ${e.combats} combats. Trop fort ?` });
    else if (e.victoires / e.combats >= S.victoireEnnemi) l.push({ niveau: 'info', theme: 'Combats', texte: `${e.nom} : ${pct(e.victoires, e.combats)} % de victoires sur ${e.combats} combats. Trop facile ?` });
  }
  for (const s of a.expeditions) {
    if (s.expeditions >= S.minExpeditions && s.gardien / s.expeditions < S.gardienStrate) {
      l.push({ niveau: 'attention', theme: 'Strates', texte: `Strate −${s.strate} : le gardien n’est vaincu que dans ${pct(s.gardien, s.expeditions)} % des ${s.expeditions} expéditions.` });
    }
  }
  if (a.joueurs >= S.minJoueurs) {
    for (const c of a.cartes) {
      if (c.part >= S.partDominante) l.push({ niveau: 'attention', theme: 'Cartes', texte: `${c.nom} représente ${pct(c.part * 1000, 1000)} % de toutes les cartes lancées : elle écrase peut-être les autres.` });
      else if (c.possedee / a.joueurs >= S.possessionCarte && c.part < S.partFaible) l.push({ niveau: 'info', theme: 'Cartes', texte: `${c.nom} : possédée par ${pct(c.possedee, a.joueurs)} % des joueurs, mais presque jamais lancée.` });
    }
    const avecActions = a.fonctions.length ? Math.max(...a.fonctions.map((f) => f.valeur)) : 0;
    if (avecActions >= S.minJoueurs) {
      for (const f of a.fonctions) {
        const part = Number(f.detail?.replace(' %', '') ?? 0) / 100;
        if (part < S.fonctionPeuUtilisee) l.push({ niveau: 'info', theme: 'Fonctions', texte: `« ${f.nom} » n’est utilisé que par ${f.detail} des joueurs : peu découvert, ou peu utile ?` });
      }
    }
  }
  return l.sort((x, y) => (x.niveau === y.niveau ? 0 : x.niveau === 'attention' ? -1 : 1));
}

/**
 * L'export pour l'analyse détaillée : une ligne par joueur, sans identifiant de compte, ni pseudo, ni journal.
 * Ce qu'il faut pour équilibrer : progression, bâtiments, Porteurs, cartes, choix de campagne, statistiques.
 */
export function exporter(parties: Partie[], now: number) {
  return {
    genere: new Date(now).toISOString(),
    joueurs: parties.map((p, i) => {
      const j = p.jeu;
      return {
        joueur: i + 1,
        derniereSauvegarde: new Date(p.maj).toISOString(),
        version: j.version,
        strate: j.strate,
        gardienVaincu: j.frontVaincu,
        objectif: j.objectif,
        ressources: { energie: Math.floor(j.energie), composants: Math.floor(j.composants), eclats: j.eclats },
        batiments: j.batiments,
        creuseurs: j.creuseurs,
        confiance: j.confiance,
        actes: j.actes,
        escouade: j.escouade,
        porteurs: Object.fromEntries(Object.entries(j.porteurs).map(([id, d]) => [id, { niveau: niveauPorteur(j, id).niveau, usure: Math.round(d.usure), cartes: d.modules }])),
        collection: j.collection,
        chroniquesLues: j.lus.length,
        fragments: j.fragments.length,
        palmares: j.palmares,
        stats: j.stats ?? null,
      };
    }),
  };
}

/** La liste des joueurs en CSV (tableur), séparateur point-virgule pour Excel en français */
export function csvJoueurs(l: LigneJoueur[]): string {
  const tete = ['joueur', 'strate', 'minutes', 'sessions', 'jours', 'derniere_sauvegarde', 'premier_jour', 'appareil', 'compte', 'cartes', 'porteurs', 'noyau'];
  const lignes = l.map((x) => [x.joueur, x.strate, x.minutes, x.sessions, x.jours, new Date(x.derniere).toISOString(), x.premierJour ?? '', x.appareil, x.compte, x.cartes, x.porteurs, x.noyau].join(';'));
  return [tete.join(';'), ...lignes].join('\n');
}

