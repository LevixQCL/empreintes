import { describe, expect, it } from 'vitest';
import { COLLECTION, ajouterCarte, doublonsRequis, multNiveau, tableRarete, tirerCarte, type EtatCollection } from '../src/core/collection';
import { moduleDef } from '../src/core/donnees';
import {
  ARCHIVE, OBJECTIFS, VERSION_JEU, ameliorer, estJeuValide, greffer, jourDe, monter, nouveauJeu, ouvrirArchive, prendre, quotidienFait,
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
    expect(ajouterCarte(j, 'jambes-ressort@fer')).toBe(false);
    expect(doublonsRequis('jambes-ressort@fer', 1)).toBe(1);
    expect(monter(j, 'jambes-ressort@fer').ok).toBe(true);
    expect(j.collection['jambes-ressort@fer']).toEqual({ niveau: 2, doublons: 0 });
    expect(multNiveau('jambes-ressort@fer', 10)).toBeCloseTo(1.45, 5);
    // une carte en or démarre au niveau 7
    expect(ajouterCarte(j, 'lames-orbitales@or')).toBe(true);
    expect(j.collection['lames-orbitales@or']!.niveau).toBe(7);
  });

  it('recycler un doublon rend des composants', () => {
    const j = avance();
    const avant = j.composants;
    expect(recycler(j, 'jambes-ressort@fer').ok).toBe(false);
    ajouterCarte(j, 'jambes-ressort@fer');
    expect(recycler(j, 'jambes-ressort@fer').ok).toBe(true);
    expect(j.composants).toBe(avant + COLLECTION.recyclage.fer);
  });
});

describe('Une carte, cinq métaux', () => {
  it('une même carte existe dans chaque métal, chaque exemplaire à part', () => {
    const j = avance();
    expect(ajouterCarte(j, 'jambes-ressort@or')).toBe(true); // nouvelle carte, pas un doublon du fer
    expect(j.collection['jambes-ressort@or']!.niveau).toBe(7);
    expect(j.collection['jambes-ressort@fer']!.doublons).toBe(0);
    expect(moduleDef('jambes-ressort@or').base).toBe('jambes-ressort');
    expect(moduleDef('jambes-ressort@or').nom).toBe('Jambes à ressort');
  });

  it('le métal règle la force, les Fréquences et l’effet', () => {
    const k = (m: string) => moduleDef(`jambes-ressort@${m}`);
    expect(k('or').v).toBeGreaterThan(k('fer').v);
    expect(['fer', 'cuivre', 'argent', 'or', 'nacre'].map((m) => k(m).f.length)).toEqual([1, 1, 2, 2, 3]);
    expect(k('fer').effet).toBeUndefined();
    expect(k('cuivre').effet).toEqual({ type: 'elan' });
    // une carte d'origine or trouvée en fer : plus faible, une seule Fréquence, sans effet
    expect(moduleDef('lames-orbitales').rarete).toBe('or');
    expect(moduleDef('lames-orbitales@fer').v).toBeLessThan(moduleDef('lames-orbitales').v);
    expect(moduleDef('lames-orbitales@fer').f).toEqual([9]);
    expect(moduleDef('lames-orbitales@fer').effet).toBeUndefined();
  });

  it('l’or et la nacre renforcent l’effet', () => {
    expect(moduleDef('crocs-fossiles@cuivre').effet).toEqual({ type: 'siphon', part: 0.6 });
    expect(moduleDef('crocs-fossiles@argent').effet).toEqual({ type: 'siphon', part: 0.6 });
    expect(moduleDef('crocs-fossiles@or').effet).toEqual({ type: 'siphon', part: 0.75 });
    expect(moduleDef('crocs-fossiles@nacre').effet).toEqual({ type: 'siphon', part: 0.9 });
    expect(moduleDef('gant-arc@or').effet).toEqual({ type: 'flux', v: 1 });
    expect(moduleDef('gant-arc@nacre').effet).toEqual({ type: 'flux', v: 2 });
  });

  it('un Porteur ne porte pas deux fois la même carte : un meilleur métal remplace l’ancien (24 octobre 2026)', () => {
    const j = avance();
    ajouterCarte(j, 'jambes-ressort@or');
    expect(j.porteurs.ilka!.modules).toContain('jambes-ressort@fer');
    const avant = j.porteurs.ilka!.modules.length;
    expect(greffer(j, 'jambes-ressort@or', 'ilka').ok).toBe(true);
    expect(j.porteurs.ilka!.modules).toContain('jambes-ressort@or');
    expect(j.porteurs.ilka!.modules).not.toContain('jambes-ressort@fer');
    expect(j.porteurs.ilka!.modules.length).toBe(avant);
    expect(greffer(j, 'jambes-ressort@fer', 'coursier').ok).toBe(true);
  });

  it('les tirages donnent des cartes de tous les métaux d’origine dans chaque métal', () => {
    const e: EtatCollection = { collection: {}, sans: { argent: 0, or: 0, nacre: 0 }, rng: 11 };
    const tirages = Array.from({ length: 600 }, () => tirerCarte(e, 12));
    expect(tirages.some((k) => k.startsWith('lames-orbitales@fer'))).toBe(true);
    expect(tirages.every((k) => /@(fer|cuivre|argent|or|nacre)$/.test(k))).toBe(true);
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
  it('une sauvegarde de la version 2 passe en version 4 sans rien perdre', () => {
    const v2 = nouveauJeu(0) as Partial<Jeu> & Record<string, unknown>;
    for (const k of ['eclats', 'collection', 'sans', 'rng', 'chantiers', 'choix', 'quotidien', 'archive']) delete v2[k];
    v2.version = 2;
    for (const p of Object.values(v2.porteurs!)) p.modules = [];
    v2.porteurs!.doran!.modules = ['glande-amber'];
    expect(estJeuValide(v2)).toBe(true);
    const j = v2 as Jeu;
    expect(j.version).toBe(VERSION_JEU);
    // version 6 : sa carte greffée d'abord, puis ses cartes de base
    expect(j.porteurs.doran!.modules).toEqual(['glande-ambre@fer', 'morsure@fer', 'carapace@fer', 'regenerer@fer', 'charge@fer', 'grogner@fer']);
    expect(j.collection['glande-ambre@fer']!.doublons).toBe(1);
    expect(j.chantiers).toEqual([]);
  });

  it('une sauvegarde de la version 3 garde chaque carte dans le métal d’origine de son Module', () => {
    const v3 = nouveauJeu(0);
    v3.version = 3;
    v3.collection = { 'jambes-ressort': { niveau: 2, doublons: 1 }, 'lames-orbitales': { niveau: 7, doublons: 0 } };
    for (const p of Object.values(v3.porteurs)) p.modules = [];
    v3.porteurs.ilka!.modules = ['lames-orbitales'];
    v3.forge = { moduleId: 'jambes-ressort', debut: 0, fin: 10 };
    v3.choix = [{ source: 'boss', options: ['bras-grue', 'crocs-fossiles', 'disparu'] }];
    expect(estJeuValide(v3)).toBe(true);
    expect(v3.version).toBe(VERSION_JEU);
    expect(v3.collection['jambes-ressort@fer']).toEqual({ niveau: 2, doublons: 1 });
    expect(v3.collection['lames-orbitales@or']).toEqual({ niveau: 7, doublons: 0 });
    expect(Object.keys(v3.collection)).toHaveLength(17); // + les 15 cartes de base (version 6)
    expect(v3.porteurs.ilka!.modules).toEqual(['lames-orbitales@or', 'ruee@fer', 'bond@fer', 'esquive@fer', 'tir@fer', 'tir-vif@fer']);
    expect(v3.forge!.moduleId).toBe('jambes-ressort@fer');
    expect(v3.choix[0]!.options).toEqual(['bras-grue@argent', 'crocs-fossiles@fer']);
  });

  it('une sauvegarde de la version 5 : les Gestes de base deviennent des cartes portées, 6 au plus', () => {
    const v5 = nouveauJeu(0);
    v5.version = 5;
    v5.chambre = true;
    v5.objectif = 1;
    v5.collection = { 'jambes-ressort@fer': { niveau: 3, doublons: 0 }, 'glande-ambre@fer': { niveau: 1, doublons: 0 }, 'eclat-chant@fer': { niveau: 1, doublons: 0 }, 'gant-arc@cuivre': { niveau: 3, doublons: 0 } };
    for (const p of Object.values(v5.porteurs)) p.modules = [];
    v5.porteurs.ilka!.modules = ['jambes-ressort@fer', 'gant-arc@cuivre'];
    expect(estJeuValide(v5)).toBe(true);
    expect(v5.version).toBe(VERSION_JEU);
    expect(v5.porteurs.ilka!.modules).toEqual(['jambes-ressort@fer', 'gant-arc@cuivre', 'ruee@fer', 'bond@fer', 'esquive@fer', 'tir@fer']);
    expect(v5.porteurs.doran!.modules).toHaveLength(6); // sa Glande d'ambre, libre, lui revient
    expect(v5.porteurs.doran!.modules[0]).toBe('glande-ambre@fer');
    expect(v5.collection['ruee@fer']).toEqual({ niveau: 1, doublons: 0 });
    expect(v5.collection['jambes-ressort@fer']!.niveau).toBe(3);
    expect(v5.collection['oeil-relais@fer']).toBeDefined(); // pour l'objectif « Construire ton deck »
    // même si le premier objectif n'est pas encore réclamé
    const w = nouveauJeu(0);
    w.version = 5; w.chambre = true; w.objectif = 0;
    delete w.collection['oeil-relais@fer'];
    expect(estJeuValide(w)).toBe(true);
    expect(w.collection['oeil-relais@fer']).toBeDefined();
  });
});
