// Dépenser l'énergie (27 octobre 2026) : le convertisseur du Générateur et les soins intensifs de la Clinique.
import { describe, expect, it } from 'vitest';
import { CONVERTISSEUR, SOINS_INTENSIFS, convertir, nouveauJeu, soignerVite, tauxConversion } from '../src/core/jeu';

const JOUR = 86_400_000;
const pret = () => { const j = nouveauJeu(0, 1); j.chambre = true; j.recrues = true; return j; };

describe('Le convertisseur du Générateur', () => {
  it('un lot d’énergie devient des composants, à un taux qui baisse dans la journée et repart le lendemain', () => {
    const j = pret();
    j.energie = 5000; j.composants = 0;
    const t0 = j.dernierTick;
    const gains: number[] = [];
    for (let k = 0; k < 12; k++) { const avant = j.composants; expect(convertir(j, t0).ok).toBe(true); gains.push(j.composants - avant); }
    expect(gains).toEqual([10, 10, 10, 10, 10, 6, 6, 6, 6, 6, 3, 3]);
    expect(j.energie).toBe(5000 - 12 * CONVERTISSEUR.lot);
    expect(tauxConversion(j, t0 + JOUR)).toBe(10);
    for (let k = 12; k < CONVERTISSEUR.lotsParJour; k++) expect(convertir(j, t0).ok).toBe(true);
    expect(convertir(j, t0).ok).toBe(false);
    expect(convertir(j, t0 + JOUR).ok).toBe(true);
  });
  it('refuse sans assez d’énergie', () => {
    const j = pret();
    j.energie = CONVERTISSEUR.lot - 1;
    expect(convertir(j).ok).toBe(false);
  });
});

describe('Les soins intensifs de la Clinique', () => {
  it('effacent l’Usure contre de l’énergie, autant que la réserve le permet', () => {
    const j = pret();
    j.porteurs.ilka!.usure = 9;
    j.energie = SOINS_INTENSIFS.energieParUsure * 4;
    expect(soignerVite(j, 'ilka').ok).toBe(true);
    expect(j.porteurs.ilka!.usure).toBe(5);
    expect(j.energie).toBe(0);
    j.energie = 1000;
    expect(soignerVite(j, 'ilka').ok).toBe(true);
    expect(j.porteurs.ilka!.usure).toBe(0);
    expect(soignerVite(j, 'ilka').ok).toBe(false);
  });
});
