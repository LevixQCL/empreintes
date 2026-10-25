// Les calculs de l'outil d'analyse : à partir de toutes les sauvegardes, ce qui sert à équilibrer le jeu.
// Fonctions pures (aucun navigateur) : testées dans tests/analyse.test.ts.

import { ENNEMIS, GESTES_SPECIAUX, moduleDef } from '../core/donnees';
import { jourDe, niveauPorteur, type Jeu } from '../core/jeu';

/** Une sauvegarde lue dans Firestore */
export interface Partie {
  uid: string;
  jeu: Jeu;
  /** dernière sauvegarde envoyée (ms) */
  maj: number;
}

export interface Ligne { cle: string; nom: string; valeur: number; detail?: string }

export interface LigneEnnemi { id: string; nom: string; combats: number; victoires: number; defaites: number; fuites: number; tours: number }
export interface LigneStrate { strate: number; expeditions: number; gardien: number; defaites: number; fuites: number; retraites: number }

export interface Analyse {
  joueurs: number;
  /** sauvegardes d'avant les statistiques : comptées dans la progression, pas dans le reste */
  sansStats: number;
  actifs: { jour: number; semaine: number; mois: number };
  /** les 14 derniers jours, du plus ancien au plus récent */
  parJour: { jour: number; actifs: number; nouveaux: number }[];
  retention: { delai: number; eligibles: number; revenus: number }[];
  entonnoir: Ligne[];
  strates: Ligne[];
  ennemis: LigneEnnemi[];
  expeditions: LigneStrate[];
  cartes: Ligne[];
  /** médianes par joueur */
  mediane: { minutes: number; sessions: number; jours: number };
  appareils: Ligne[];
  comptes: Ligne[];
}

const JOUR = 86_400_000;

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

/** Les vraies parties, et combien de parties de test ont été écartées */
export function sansTests(parties: Partie[]): { parties: Partie[]; tests: number } {
  const vraies = parties.filter((p) => !estPartieDeTest(p));
  return { parties: vraies, tests: parties.length - vraies.length };
}

const mediane = (l: number[]) => {
  if (!l.length) return 0;
  const t = [...l].sort((a, b) => a - b);
  const m = Math.floor(t.length / 2);
  return t.length % 2 ? t[m]! : (t[m - 1]! + t[m]!) / 2;
};

function nomEnnemi(id: string): string {
  return ENNEMIS.find((e) => e.id === id)?.nom ?? id;
}

function nomCarte(id: string): string {
  try { return moduleDef(id).nom; } catch { return GESTES_SPECIAUX.find((g) => g.id === id)?.nom ?? id; }
}

export function analyser(parties: Partie[], now: number): Analyse {
  const aujourdHui = jourDe(now);
  const avecStats = parties.filter((p) => p.jeu.stats);
  const compter = (f: (p: Partie) => boolean) => parties.filter(f).length;

  const parJour = Array.from({ length: 14 }, (_, k) => {
    const jour = aujourdHui - 13 + k;
    return {
      jour,
      actifs: avecStats.filter((p) => p.jeu.stats!.jours.includes(jour)).length,
      nouveaux: avecStats.filter((p) => p.jeu.stats!.premierJour === jour).length,
    };
  });

  // rétention : parmi ceux qui ont commencé il y a au moins N jours, combien ont rejoué N jours (ou plus) après leur début
  const retention = [1, 7, 30].map((delai) => {
    const eligibles = avecStats.filter((p) => p.jeu.stats!.premierJour <= aujourdHui - delai);
    return { delai, eligibles: eligibles.length, revenus: eligibles.filter((p) => p.jeu.stats!.jours.some((d) => d >= p.jeu.stats!.premierJour + delai)).length };
  });

  const entonnoir: Ligne[] = ([
    ['intro', 'Intro vue', (j: Jeu) => j.introVue],
    ['chambre', 'Chambre ouverte', (j: Jeu) => j.chambre],
    ['s2', 'Strate −2', (j: Jeu) => j.strate >= 2],
    ['s3', 'Strate −3', (j: Jeu) => j.strate >= 3],
    ['s5', 'Strate −5', (j: Jeu) => j.strate >= 5],
    ['s7', 'Strate −7', (j: Jeu) => j.strate >= 7],
    ['s10', 'Strate −10', (j: Jeu) => j.strate >= 10],
  ] as const).map(([cle, nom, f]) => ({ cle, nom, valeur: compter((p) => !!f(p.jeu)) }));

  const plusProfonde = Math.max(1, ...parties.map((p) => p.jeu.strate));
  const strates: Ligne[] = Array.from({ length: plusProfonde }, (_, k) => ({ cle: String(k + 1), nom: `Strate −${k + 1}`, valeur: compter((p) => p.jeu.strate === k + 1) }));

  const ennemis = new Map<string, LigneEnnemi>();
  const expeditions = new Map<number, LigneStrate>();
  const cartes = new Map<string, number>();
  for (const p of avecStats) {
    const s = p.jeu.stats!;
    for (const [id, [v, d, f, t]] of Object.entries(s.ennemis)) {
      const l = ennemis.get(id) ?? { id, nom: nomEnnemi(id), combats: 0, victoires: 0, defaites: 0, fuites: 0, tours: 0 };
      l.victoires += v; l.defaites += d; l.fuites += f; l.tours += t; l.combats += v + d + f;
      ennemis.set(id, l);
    }
    for (const [st, [n, g, d, f, r]] of Object.entries(s.strates)) {
      const strate = Number(st);
      const l = expeditions.get(strate) ?? { strate, expeditions: 0, gardien: 0, defaites: 0, fuites: 0, retraites: 0 };
      l.expeditions += n; l.gardien += g; l.defaites += d; l.fuites += f; l.retraites += r;
      expeditions.set(strate, l);
    }
    for (const [id, n] of Object.entries(s.cartes)) cartes.set(id, (cartes.get(id) ?? 0) + n);
  }
  const totalCartes = [...cartes.values()].reduce((a, b) => a + b, 0);

  return {
    joueurs: parties.length,
    sansStats: parties.length - avecStats.length,
    actifs: { jour: compter((p) => now - p.maj < JOUR), semaine: compter((p) => now - p.maj < 7 * JOUR), mois: compter((p) => now - p.maj < 30 * JOUR) },
    parJour,
    retention,
    entonnoir,
    strates,
    ennemis: [...ennemis.values()].sort((a, b) => b.combats - a.combats),
    expeditions: [...expeditions.values()].sort((a, b) => a.strate - b.strate),
    cartes: [...cartes.entries()].sort((a, b) => b[1] - a[1]).slice(0, 20)
      .map(([id, n]) => ({ cle: id, nom: nomCarte(id), valeur: n, detail: `${Math.round((100 * n) / Math.max(1, totalCartes))} %` })),
    mediane: {
      minutes: Math.round(mediane(avecStats.map((p) => p.jeu.stats!.secondes)) / 60),
      sessions: mediane(avecStats.map((p) => p.jeu.stats!.sessions)),
      jours: mediane(avecStats.map((p) => p.jeu.stats!.jours.length)),
    },
    appareils: (['telephone', 'pc'] as const).map((a) => ({ cle: a, nom: a === 'pc' ? 'PC' : 'Téléphone', valeur: avecStats.filter((p) => p.jeu.stats!.appareil === a).length })),
    comptes: (['protege', 'invisible', 'aucun'] as const).map((c) => ({
      cle: c, nom: { protege: 'Compte Google ou e-mail', invisible: 'Compte invisible', aucun: 'Sans compte' }[c], valeur: avecStats.filter((p) => p.jeu.stats!.compte === c).length,
    })),
  };
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
        palmares: j.palmares,
        stats: j.stats ?? null,
      };
    }),
  };
}
