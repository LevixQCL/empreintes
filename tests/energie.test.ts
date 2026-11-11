// L'économie à cristal unique (9 novembre 2026, docs/economie-cristal.md) : le Générateur taille le minerai rapporté en jouant
// (`composants`) en cristaux (`energie`), rien ne se perd ; et les soins intensifs de la Clinique, payés en cristaux.
import { describe, expect, it } from 'vitest';
import { DISTRICT, SOINS_INTENSIFS, VERSION_JEU, brutEnAttente, heuresDeTaille, nouveauJeu, raffiner, raffinageParHeure, soignerVite, tick } from '../src/core/jeu';

const HEURE = 3_600_000;
const pret = () => { const j = nouveauJeu(0, 1); j.chambre = true; j.recrues = true; return j; };

describe('Le Générateur taille le minerai', () => {
  it('ne crée rien de lui-même : sans minerai, aucun cristal', () => {
    const j = pret();
    j.batiments.generateur = 10; j.composants = 0; j.energie = 0;
    tick(j, j.dernierTick + 48 * HEURE);
    expect(j.energie).toBe(0);
  });
  it('taille 1 pour 1, sans jamais rien perdre ni plafonner', () => {
    const j = pret();
    j.batiments.generateur = 3; j.composants = 5000; j.energie = 100_000;
    tick(j, j.dernierTick + 240 * HEURE);
    expect(j.composants).toBeLessThan(1);
    expect(Math.round(j.energie)).toBe(105_000);
  });
  it('chaque heure, le Générateur taille une part de ce qui attend (1/16 au niveau 1, 1/4 au niveau 10), et au moins son plancher', () => {
    for (const [niv, heures] of [[1, 16], [5, 9], [10, 4]] as const) {
      const j = pret();
      j.batiments.generateur = niv;
      for (const id of Object.keys(j.porteurs)) j.porteurs[id]!.poste = null;
      expect(heuresDeTaille(j)).toBe(heures);
      j.composants = 600;
      // en `heures` heures, plus de la moitié est taillée ; le reste file au plancher du niveau
      raffiner(j, heures);
      expect(j.composants).toBeLessThan(600 * 0.4);
      expect(brutEnAttente(j).heures).toBeLessThanOrEqual(Math.ceil(heures * 2.5));
    }
  });
  it('un Porteur de la bonne lignée au Générateur taille deux fois plus vite', () => {
    const j = pret();
    j.batiments.generateur = 4;
    for (const id of Object.keys(j.porteurs)) j.porteurs[id]!.poste = null;
    j.composants = 1000;
    const seul = raffinageParHeure(j);
    j.porteurs.ilka!.poste = 'generateur';
    expect(raffinageParHeure(j)).toBe(seul * DISTRICT.bonusAffinite);
  });
  it('un Générateur à l’arrêt ne taille rien', () => {
    const j = pret();
    j.batiments.generateur = 0; j.composants = 300;
    expect(raffiner(j, 10)).toBe(0);
    expect(j.composants).toBe(300);
  });
});

describe('Les soins intensifs de la Clinique', () => {
  it('effacent l’Usure contre des cristaux, autant que la réserve le permet', () => {
    const j = pret();
    j.soinOffert = true;
    j.porteurs.ilka!.usure = 9;
    j.energie = 4 / SOINS_INTENSIFS.usureParCristal;
    expect(soignerVite(j, 'ilka').ok).toBe(true);
    expect(j.porteurs.ilka!.usure).toBe(5);
    expect(j.energie).toBe(0);
    j.energie = 1000;
    expect(soignerVite(j, 'ilka').ok).toBe(true);
    expect(j.porteurs.ilka!.usure).toBe(0);
    expect(soignerVite(j, 'ilka').ok).toBe(false);
  });
});

describe('Les premiers soins intensifs', () => {
  it('sont offerts une seule fois, puis se paient', () => {
    const j = pret();
    j.porteurs.ilka!.usure = 30;
    j.energie = 0;
    expect(soignerVite(j, 'ilka').ok).toBe(true);
    expect(j.porteurs.ilka!.usure).toBe(0);
    expect(j.energie).toBe(0);
    expect(j.soinOffert).toBe(true);
    j.porteurs.ilka!.usure = 4;
    expect(soignerVite(j, 'ilka').ok).toBe(false);
  });
});

describe('Les anciennes sauvegardes (version 9 → 10)', () => {
  it('les composants deviennent du minerai, l’énergie des cristaux au taux de 20 pour 1, sans rien rembourser en trop', async () => {
    const { estJeuValide } = await import('../src/core/jeu');
    const j = pret();
    const ancien = j as typeof j & { conversion?: unknown };
    j.version = 9; j.energie = 20_000; j.composants = 1_234;
    ancien.conversion = { jour: 3, lots: 5 };
    j.porteurs.doran!.poste = 'noyau';
    j.seances = [{ porteur: 'doran', cible: 12, xpTotale: 100, xpGagnee: 0, xpHeure: 10, energie: 2640 }];
    expect(estJeuValide(j)).toBe(true);
    expect(j.version).toBe(VERSION_JEU);
    expect(j.energie).toBe(1000);
    expect(j.composants).toBe(1234);
    expect(j.seances![0]!.energie).toBe(132);
    expect(ancien.conversion).toBeUndefined();
  });
});
