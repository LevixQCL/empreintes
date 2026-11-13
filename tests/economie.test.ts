import { describe, expect, it } from 'vitest';
import { nouveauNiveau } from '../src/core/partie/nouvelle';
import { xpPourAtteindre } from '../src/core/partie/district';
import { COLLECTION, ajouterCarte, doublonsRequis, effetNiveau, NIVEAU_METAL, freinPromotion, multNiveau, puissanceCarte, tableRarete, tirerCarte, type EtatCollection } from '../src/core/collection';
import { moduleDef } from '../src/core/donnees';
import {
  ARCHIVE, OBJECTIFS, VERSION_JEU, ameliorer, estJeuValide, jourDe, monter, nouveauJeu, ouvrirArchive, prendre, quotidienFait,
  gagnerXp, promouvoir, reclamerQuotidien, recycler, semaineDe, tick, type Jeu,
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
    j.energie = 5000; j.composants = 500; j.batiments.noyau = 3; j.strate = 4;
    expect(ameliorer(j, 'noyau', 0).ok).toBe(false);
    j.eclats = 3;
    expect(ameliorer(j, 'noyau', 0).ok).toBe(true);
    expect(j.eclats).toBe(0);
  });

  it('la Tour ne passe au niveau 4 qu’une fois le gardien de la Strate −3 vaincu', () => {
    const j = nouveauJeu(0);
    j.energie = 5000; j.eclats = 10; j.batiments.noyau = 3; j.strate = 3;
    expect(ameliorer(j, 'noyau', 0).ok).toBe(false);
    j.frontVaincu = true;
    expect(ameliorer(j, 'noyau', 0).ok).toBe(true);
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

  it('un doublon fait monter une carte : 3 niveaux, force au niveau 2, effet au niveau 3 (12 novembre 2026)', () => {
    const j = avance();
    expect(ajouterCarte(j, 'jambes-ressort@fer')).toBe(false);
    expect(doublonsRequis('jambes-ressort@fer', 1)).toBe(1);
    expect(monter(j, 'jambes-ressort@fer').ok).toBe(true);
    expect(j.collection['jambes-ressort@fer']).toEqual({ niveau: 2, doublons: 0 });
    expect(Math.round(10 * multNiveau('jambes-ressort@fer', 1)) / 10).toBe(1);
    for (const cle of ['jambes-ressort@fer', 'jambes-ressort@cuivre']) {
      let avant = 0;
      for (let n = 1; n <= 3; n++) { const f = Math.round(moduleDef(cle).v * multNiveau(cle, n)); expect(f).toBeGreaterThanOrEqual(avant); avant = f; }
    }
    expect(multNiveau('jambes-ressort@fer', 9)).toBe(multNiveau('jambes-ressort@fer', 3));
    expect(effetNiveau({ type: 'fissure', part: 0.25 }, 3)).toEqual({ type: 'fissure', part: 0.3 });
    expect(effetNiveau({ type: 'rempart', part: 0.9 }, 3)).toEqual({ type: 'rempart', part: 0.9 });
    expect(doublonsRequis('jambes-ressort@fer', 3)).toBeNull();
  });

  it('chaque métal au niveau 1 bat le métal du dessous au niveau 3', () => {
    for (const m of ['jambes-ressort', 'bond', 'morsure', 'murmure', 'lames-jumelles']) {
      const r = ['fer', 'cuivre', 'argent', 'or', 'nacre'];
      for (let i = r.indexOf(moduleDef(m).rarete); i < 4; i++) expect(puissanceCarte(`${m}@${r[i + 1]}`, 1)).toBeGreaterThan(puissanceCarte(`${m}@${r[i]}`, 3));
    }
  });

  it('promotion : niveau 3, 3 copies, des cristaux, et la profondeur ouvre le métal', () => {
    const j = avance();
    const k = 'jambes-ressort@fer';
    j.collection[k] = { niveau: 3, doublons: 2 };
    expect(promouvoir(j, k).ok).toBe(false); // il manque une copie
    ajouterCarte(j, k);
    j.energie = 1000;
    expect(promouvoir(j, k).ok).toBe(true);
    expect(j.collection[k]).toBeUndefined();
    expect(j.collection['jambes-ressort@cuivre']).toEqual({ niveau: 1, doublons: 0 });
    expect(j.porteurs.ilka!.modules).toContain('jambes-ressort@cuivre');
    expect(j.energie).toBe(1000 - COLLECTION.promotion.cristaux.cuivre);
    // l'argent demande que son Porteur soit niveau 5 (12 novembre 2026 : la carte évolue avec son Porteur)
    j.collection['jambes-ressort@cuivre'] = { niveau: 3, doublons: 3 };
    expect(freinPromotion(j, 'jambes-ressort@cuivre')).toMatch(/niveau 5/);
    j.porteurs.ilka!.xp = xpPourAtteindre(5);
    expect(freinPromotion(j, 'jambes-ressort@cuivre')).toBeNull();
    // libre, elle n'évolue pas
    j.porteurs.ilka!.modules = j.porteurs.ilka!.modules.filter((k) => k !== 'jambes-ressort@cuivre');
    expect(freinPromotion(j, 'jambes-ressort@cuivre')).toMatch(/Confie-la/);
  });

  it('version 11 : les anciens niveaux sur 10 passent sur 5, le chemin parcouru gardé', () => {
    expect(nouveauNiveau(1, 'fer')).toBe(1);
    expect(nouveauNiveau(5, 'fer')).toBe(3);
    expect(nouveauNiveau(10, 'fer')).toBe(5);
    expect(nouveauNiveau(7, 'or')).toBe(1);
    expect(nouveauNiveau(9, 'or')).toBe(4);
    expect(nouveauNiveau(10, 'nacre')).toBe(5);
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
  it('trouvée dans un métal trop haut pour son Porteur, la carte attend son niveau, puis y passe sans rien payer', () => {
    const j = avance();
    j.collection['jambes-ressort@fer'] = { niveau: 2, doublons: 0 };
    expect(j.porteurs.ilka!.modules).toContain('jambes-ressort@fer');
    expect(ajouterCarte(j, 'jambes-ressort@or')).toBe(false);
    expect(j.collection['jambes-ressort@fer']).toEqual({ niveau: 2, doublons: 0, attente: 'or' });
    // une copie du même métal en attente compte comme une copie
    ajouterCarte(j, 'jambes-ressort@or');
    expect(j.collection['jambes-ressort@fer']!.doublons).toBe(1);
    gagnerXp(j, 'ilka', xpPourAtteindre(NIVEAU_METAL.or) + 10);
    expect(j.collection['jambes-ressort@fer']).toBeUndefined();
    expect(j.collection['jambes-ressort@or']!.niveau).toBe(2);
    expect(j.porteurs.ilka!.modules).toContain('jambes-ressort@or');
    expect(j.journal.some((l) => /Jambes à ressort passe en or/.test(l))).toBe(true);
  });

  it('un seul exemplaire par carte : un meilleur métal la fait passer en gardant son niveau, un moins bon vaut un tiers', () => {
    const j = avance();
    j.collection['jambes-ressort@fer'] = { niveau: 2, doublons: 0.5 };
    j.porteurs.ilka!.xp = xpPourAtteindre(NIVEAU_METAL.argent);
    expect(ajouterCarte(j, 'jambes-ressort@argent')).toBe(true);
    expect(j.collection['jambes-ressort@fer']).toBeUndefined();
    expect(j.collection['jambes-ressort@argent']!.niveau).toBe(2);
    expect(j.collection['jambes-ressort@argent']!.doublons).toBeCloseTo(0.5 / 9, 3);
    expect(j.porteurs.ilka!.modules).toContain('jambes-ressort@argent');
    expect(j.porteurs.ilka!.modules).not.toContain('jambes-ressort@fer');
    ajouterCarte(j, 'jambes-ressort@cuivre');
    expect(j.collection['jambes-ressort@argent']!.doublons).toBeCloseTo(0.5 / 9 + 1 / 3, 3);
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
    expect(moduleDef('lames-orbitales@fer').f).toEqual([7]);
    expect(moduleDef('lames-orbitales@fer').effet).toBeUndefined();
  });

  it('l’or et la nacre renforcent l’effet', () => {
    // Crocs fossiles et Gant à arc refondus le 8 novembre 2026 (Désarmer, Crescendo)
    expect(moduleDef('crocs-fossiles@cuivre').effet).toEqual({ type: 'desarmer', part: 0.3 });
    expect(moduleDef('crocs-fossiles@argent').effet).toEqual({ type: 'desarmer', part: 0.3 });
    expect(moduleDef('crocs-fossiles@or').effet).toEqual({ type: 'desarmer', part: 0.38 });
    expect(moduleDef('crocs-fossiles@nacre').effet).toEqual({ type: 'desarmer', part: 0.45 });
    expect(moduleDef('tir-vif@or').effet).toEqual({ type: 'flux', v: 1 });
    expect(moduleDef('tir-vif@nacre').effet).toEqual({ type: 'flux', v: 2 });
  });

  it('version 14 : les exemplaires d’une carte se fondent dans le plus haut métal, au meilleur niveau', () => {
    const j = avance();
    j.collection['jambes-ressort@fer'] = { niveau: 5, doublons: 1 };
    j.collection['jambes-ressort@or'] = { niveau: 1, doublons: 0 };
    j.porteurs.coursier ??= { usure: 0, poste: null, modules: [] };
    j.version = 13;
    expect(estJeuValide(j)).toBe(true);
    expect(j.collection['jambes-ressort@fer']).toBeUndefined();
    expect(j.collection['jambes-ressort@or']!.niveau).toBe(3);
    expect(j.collection['jambes-ressort@or']!.doublons).toBeCloseTo(2 / 27, 3);
    expect(j.porteurs.ilka!.modules).toContain('jambes-ressort@or');
  });

  it('les tirages donnent des cartes de tous les métaux d’origine dans chaque métal', () => {
    const e: EtatCollection = { collection: {}, sans: { argent: 0, or: 0, nacre: 0 }, rng: 11 };
    // 12 novembre 2026 : le fer est rare au Fond (5 %) ; on le cherche là où il domine, à la Strate −2
    const tirages = [...Array.from({ length: 600 }, () => tirerCarte(e, 12)), ...Array.from({ length: 600 }, () => tirerCarte(e, 2))];
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
    // (puis les niveaux sur 5, version 11 : un pas sur neuf reste au niveau 1)
    expect(v3.collection['jambes-ressort@fer']).toEqual({ niveau: 1, doublons: 1 });
    expect(v3.collection['lames-orbitales@or']).toEqual({ niveau: 1, doublons: 0 });
    expect(Object.keys(v3.collection)).toHaveLength(17); // + les 15 cartes de base (version 6)
    // la carte en or reste chez Ilka (12 novembre 2026) : elle se joue dans le métal qu'Ilka peut porter (metalJouable)
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
    v5.porteurs.ilka!.xp = 12; // niveau 2 : sa Charge tient ses 6 cartes
    expect(estJeuValide(v5)).toBe(true);
    expect(v5.version).toBe(VERSION_JEU);
    expect(v5.porteurs.ilka!.modules).toEqual(['jambes-ressort@fer', 'gant-arc@cuivre', 'ruee@fer', 'bond@fer', 'esquive@fer', 'tir@fer']);
    expect(v5.porteurs.doran!.modules).toHaveLength(6); // sa Glande d'ambre, libre, lui revient
    expect(v5.porteurs.doran!.modules[0]).toBe('glande-ambre@fer');
    expect(v5.collection['ruee@fer']).toEqual({ niveau: 1, doublons: 0 });
    expect(v5.collection['jambes-ressort@fer']!.niveau).toBe(2); // 3 sur 10 → 2 sur 5 (version 11)
    expect(v5.collection['oeil-relais@fer']).toBeDefined(); // pour l'objectif « Construire ton deck »
    // même si le premier objectif n'est pas encore réclamé
    const w = nouveauJeu(0);
    w.version = 5; w.chambre = true; w.objectif = 0;
    delete w.collection['oeil-relais@fer'];
    expect(estJeuValide(w)).toBe(true);
    expect(w.collection['oeil-relais@fer']).toBeDefined();
  });
});
