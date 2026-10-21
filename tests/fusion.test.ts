import { describe, expect, it } from 'vitest';
import { moduleDef } from '../src/core/donnees';
import { FUSION, apercuFusion, chanceFusion, fusionner, partenairesFusion } from '../src/core/fusion';
import { OBJECTIFS, estJeuValide, greffer, nouveauJeu, type Jeu } from '../src/core/jeu';

const partie = (rng = 7): Jeu => {
  const j = nouveauJeu(0, rng);
  j.chambre = true; j.recrues = true; j.objectif = OBJECTIFS.length;
  j.batiments = { noyau: 5, generateur: 5, forge: 5, clinique: 5 };
  j.eclats = 500;
  return j;
};

/** Cherche une graine qui donne la réussite (ou l'échec) voulue à la première tentative */
function avecIssue(reussite: boolean, prep: (j: Jeu) => void, base: string, risquee: string) {
  for (let g = 1; g < 500; g++) {
    const j = partie(g);
    prep(j);
    const avant = structuredClone(j);
    const r = fusionner(j, base, risquee);
    if (r.reussite === reussite) return { j, r, avant };
  }
  throw new Error('aucune graine trouvée');
}

describe('Fusion', () => {
  it('refuse deux métaux ou deux lignées différents, et la nacre', () => {
    const j = partie();
    j.collection['gant-arc@cuivre'] = { niveau: 3, doublons: 0 };
    j.collection['crocs-fossiles@fer'] = { niveau: 1, doublons: 0 };
    j.collection['bras-grue@nacre'] = { niveau: 8, doublons: 1 };
    expect(apercuFusion(j, 'jambes-ressort@fer', 'gant-arc@cuivre').ok).toBe(false);
    expect(apercuFusion(j, 'jambes-ressort@fer', 'crocs-fossiles@fer').ok).toBe(false);
    expect(apercuFusion(j, 'bras-grue@nacre', 'bras-grue@nacre').message).toMatch(/nacre/);
  });

  it('demande deux exemplaires libres : un doublon, ou une carte qui n’est pas greffée', () => {
    const j = partie();
    expect(apercuFusion(j, 'jambes-ressort@fer', 'jambes-ressort@fer').ok).toBe(false);
    j.collection['jambes-ressort@fer']!.doublons = 1;
    expect(apercuFusion(j, 'jambes-ressort@fer', 'jambes-ressort@fer').ok).toBe(true);
    expect(greffer(j, 'jambes-ressort@fer', 'ilka').ok).toBe(true);
    expect(apercuFusion(j, 'jambes-ressort@fer', 'jambes-ressort@fer').ok).toBe(false);
    j.collection['gant-arc@fer'] = { niveau: 1, doublons: 0 };
    expect(apercuFusion(j, 'gant-arc@fer', 'jambes-ressort@fer').ok).toBe(true); // le doublon reste libre
    expect(partenairesFusion(j, 'gant-arc@fer')).toEqual(['jambes-ressort@fer']);
  });

  it('suit le niveau de la Forge et demande des Éclats', () => {
    const j = partie();
    j.collection['jambes-ressort@fer']!.doublons = 1;
    j.batiments.forge = 1;
    expect(apercuFusion(j, 'jambes-ressort@fer', 'jambes-ressort@fer').message).toMatch(/Forge niveau 2/);
    j.batiments.forge = 2;
    j.eclats = 1;
    expect(apercuFusion(j, 'jambes-ressort@fer', 'jambes-ressort@fer').message).toMatch(/Éclats/);
    j.eclats = FUSION.eclats.cuivre;
    const ap = apercuFusion(j, 'jambes-ressort@fer', 'jambes-ressort@fer');
    expect(ap).toMatchObject({ ok: true, cible: 'cuivre', chance: 0.7, lignee: 'tech' });
    expect(ap.possibles!.every((m) => moduleDef(m).lignee === 'tech')).toBe(true);
  });

  it('réussite : les deux cartes partent, une carte de la lignée arrive un métal au-dessus', () => {
    const prep = (j: Jeu) => { j.collection['gant-arc@fer'] = { niveau: 1, doublons: 0 }; };
    const { j, r, avant } = avecIssue(true, prep, 'jambes-ressort@fer', 'gant-arc@fer');
    expect(r.carte).toMatch(/@cuivre$/);
    expect(moduleDef(r.carte!).lignee).toBe('tech');
    expect(j.collection['jambes-ressort@fer']).toBeUndefined();
    expect(j.collection['gant-arc@fer']).toBeUndefined();
    expect(j.collection[r.carte!]).toBeDefined();
    expect(j.eclats).toBe(avant.eclats - FUSION.eclats.cuivre);
  });

  it('échec : la carte risquée est perdue, la base reste, la moitié des Éclats revient', () => {
    const prep = (j: Jeu) => { j.collection['gant-arc@fer'] = { niveau: 1, doublons: 0 }; };
    const { j, r, avant } = avecIssue(false, prep, 'jambes-ressort@fer', 'gant-arc@fer');
    expect(j.collection['jambes-ressort@fer']).toBeDefined();
    expect(j.collection['gant-arc@fer']).toBeUndefined();
    expect(r.rendus).toBe(1);
    expect(j.eclats).toBe(avant.eclats - FUSION.eclats.cuivre + 1);
    expect(chanceFusion(j, 'tech', 'cuivre')).toBeCloseTo(0.75);
    expect(chanceFusion(j, 'tech', 'argent')).toBeCloseTo(0.5); // les échecs ne se reportent pas sur un autre métal
    expect(chanceFusion(j, 'bio', 'cuivre')).toBeCloseTo(0.7); // ni sur une autre lignée
  });

  it('un doublon engagé ne retire qu’un exemplaire', () => {
    const prep = (j: Jeu) => { j.collection['jambes-ressort@fer']!.doublons = 3; };
    const { j } = avecIssue(false, prep, 'jambes-ressort@fer', 'jambes-ressort@fer');
    expect(j.collection['jambes-ressort@fer']).toEqual({ niveau: 1, doublons: 2 });
  });

  it('les échecs finissent par garantir la réussite, puis le compteur repart de zéro', () => {
    const j = partie(3);
    j.collection['bras-grue@or'] = { niveau: 7, doublons: 200 };
    let echecs = 0;
    for (;;) {
      const r = fusionner(j, 'bras-grue@or', 'bras-grue@or');
      expect(r.ok).toBe(true);
      if (r.reussite) break;
      echecs++;
    }
    expect(echecs).toBeLessThanOrEqual(16); // 20 % + 16 × 5 % = 100 %
    expect(chanceFusion(j, 'tech', 'nacre')).toBeCloseTo(0.2);
  });

  it('les taux tiennent sur des milliers de tentatives', () => {
    const j = partie(11);
    j.collection['jambes-ressort@fer']!.doublons = 100_000;
    j.eclats = 1e9;
    let reussites = 0;
    const n = 4000;
    for (let i = 0; i < n; i++) {
      j.fusions = {}; // mesure le taux de base, sans le bonus d'échec
      if (fusionner(j, 'jambes-ressort@fer', 'jambes-ressort@fer').reussite) reussites++;
    }
    expect(reussites / n).toBeGreaterThan(0.67);
    expect(reussites / n).toBeLessThan(0.73);
  });

  it('une sauvegarde v4 gagne le compteur de Fusions', () => {
    const j = partie() as Partial<Jeu> & Jeu;
    j.version = 4;
    delete (j as Partial<Jeu>).fusions;
    expect(estJeuValide(j)).toBe(true);
    expect(j.version).toBe(5);
    expect(j.fusions).toEqual({});
  });
});
