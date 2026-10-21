import { describe, expect, it } from 'vitest';
import { COLLECTION, ajouterCarte, doublonsRequis, multNiveau, tableRarete, tirerCarte, type EtatCollection } from '../src/core/collection';
import { moduleDef } from '../src/core/donnees';
import {
  ARCHIVE, OBJECTIFS, ameliorer, estJeuValide, jourDe, monter, nouveauJeu, ouvrirArchive, prendre, quotidienFait,
  reclamerQuotidien, recycler, semaineDe, tick, type Jeu,
} from '../src/core/jeu';

const MIN = 60_000;
const J1 = 86_400_000;
/** une partie après le tutoriel et les objectifs guidés */
const avance = (now = Date.UTC(2026, 9, 21, 12)) => {
  const j = nouveauJeu(now, 42);
  j.chambre = true; j.recrues = true; j.objectif = OBJECTIFS.length;
  return j;
};

describe('Chantiers', () => {
  it('niveau 2 immédiat, niveau 3 en 5 minutes, un seul chantier à la fois', () => {
    const j = nouveauJeu(0);
    j.energie = 5000; j.composants = 500;
    expect(ameliorer(j, 'noyau', 0).ok).toBe(true);
    expect(j.batiments.noyau).toBe(2);
    expect(ameliorer(j, 'generateur', 0).ok).toBe(true);
    expect(j.batiments.generateur).toBe(2);
    expect(ameliorer(j, 'noyau', 0).ok).toBe(true); // vers 3 : chantier
    expect(j.batiments.noyau).toBe(2);
    expect(ameliorer(j, 'forge', 0).ok).toBe(false); // un seul chantier
    tick(j, 5 * MIN);
    expect(j.batiments.noyau).toBe(3);
    expect(j.chantiers).toHaveLength(0);
  });

  it('les niveaux 4 et 5 demandent des Éclats', () => {
    const j = nouveauJeu(0);
    j.energie = 5000; j.composants = 500; j.batiments.noyau = 3;
    expect(ameliorer(j, 'noyau', 0).ok).toBe(false);
    j.eclats = 3;
    expect(ameliorer(j, 'noyau', 0).ok).toBe(true);
    expect(j.eclats).toBe(0);
  });
});

describe('Collection', () => {
  it('les taux de rareté font 100 % à chaque profondeur', () => {
    for (const s of [1, 3, 6, 12]) {
      const t = tableRarete(s);
      expect(Object.values(t).reduce((a, b) => a + b, 0)).toBeCloseTo(100, 5);
    }
  });

  it('surtout des communes en haut, et la garantie d’argent tombe au plus tard à la 41e carte', () => {
    const e: EtatCollection = { collection: {}, sans: { argent: 0, or: 0, nacre: 0 }, rng: 7 };
    const tirages = Array.from({ length: 2000 }, () => moduleDef(tirerCarte(e, 1)).rarete);
    const fer = tirages.filter((r) => r === 'fer').length / tirages.length;
    expect(fer).toBeGreaterThan(0.8);
    let sans = 0, max = 0;
    for (const r of tirages) { sans = r === 'argent' || r === 'or' ? 0 : sans + 1; max = Math.max(max, sans); }
    expect(max).toBeLessThan(COLLECTION.garanties.argent);
  });

  it('un doublon fait monter une carte, +5 % par niveau', () => {
    const j = avance();
    expect(ajouterCarte(j, 'jambes-ressort')).toBe(false);
    expect(doublonsRequis('jambes-ressort', 1)).toBe(1);
    expect(monter(j, 'jambes-ressort').ok).toBe(true);
    expect(j.collection['jambes-ressort']).toEqual({ niveau: 2, doublons: 0 });
    expect(multNiveau('jambes-ressort', 10)).toBeCloseTo(1.45, 5);
    // une carte en or démarre au niveau 7
    expect(ajouterCarte(j, 'lames-orbitales')).toBe(true);
    expect(j.collection['lames-orbitales']!.niveau).toBe(7);
  });

  it('recycler un doublon rend des composants', () => {
    const j = avance();
    const avant = j.composants;
    expect(recycler(j, 'jambes-ressort').ok).toBe(false);
    ajouterCarte(j, 'jambes-ressort');
    expect(recycler(j, 'jambes-ressort').ok).toBe(true);
    expect(j.composants).toBe(avant + COLLECTION.recyclage.fer);
  });
});

describe('Objectif du jour et Archive de la semaine', () => {
  it('l’objectif du jour s’accumule jusqu’à 3 jours et donne une carte au choix ou 2 Éclats', () => {
    const now = Date.UTC(2026, 9, 21, 12);
    const j = avance(now);
    expect(j.quotidien.reserve).toBe(1);
    tick(j, now + 10 * J1);
    expect(j.quotidien.reserve).toBe(3);
    j.quotidien.progres = 99;
    expect(quotidienFait(j)).toBe(true);
    expect(reclamerQuotidien(j).ok).toBe(true);
    expect(j.quotidien.reserve).toBe(2);
    expect(j.choix[0]!.options).toHaveLength(3);
    expect(prendre(j, -1).ok).toBe(true);
    expect(j.eclats).toBe(2);
  });

  it('l’Archive s’ouvre le lundi selon les paliers atteints', () => {
    const now = Date.UTC(2026, 9, 21, 12); // un mercredi
    const j = avance(now);
    j.archive.points = ARCHIVE.paliers[2];
    tick(j, now + 2 * J1);
    expect(j.archive.aOuvrir).toBe(0); // toujours la même semaine
    tick(j, now + 6 * J1);
    expect(semaineDe(now + 6 * J1)).toBe(semaineDe(now) + 1);
    expect(j.archive.aOuvrir).toBe(3);
    expect(j.archive.points).toBe(0);
    expect(ouvrirArchive(j).ok).toBe(true);
    expect(j.choix).toHaveLength(2);
    expect(j.eclats).toBe(3);
    expect(['argent', 'or', 'nacre']).toContain(moduleDef(j.choix[1]!.options[0]!).rarete);
  });

  it('les jours du jeu changent à 4 h du matin', () => {
    expect(jourDe(Date.UTC(2026, 0, 5, 3))).toBe(0);
    expect(jourDe(Date.UTC(2026, 0, 6, 2, 59))).toBe(0);
    expect(jourDe(Date.UTC(2026, 0, 6, 3))).toBe(1);
  });
});

describe('Migration', () => {
  it('une sauvegarde de la version 2 passe en version 3 sans rien perdre', () => {
    const v2 = nouveauJeu(0) as Partial<Jeu> & Record<string, unknown>;
    for (const k of ['eclats', 'collection', 'sans', 'rng', 'chantiers', 'choix', 'quotidien', 'archive']) delete v2[k];
    v2.version = 2;
    v2.porteurs!.doran!.modules = ['glande-amber'];
    expect(estJeuValide(v2)).toBe(true);
    const j = v2 as Jeu;
    expect(j.version).toBe(3);
    expect(j.porteurs.doran!.modules).toEqual(['glande-ambre']);
    expect(j.collection['glande-ambre']!.doublons).toBe(1);
    expect(j.chantiers).toEqual([]);
  });
});
