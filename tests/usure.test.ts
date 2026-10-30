// Les PV perdus en bas restent perdus au retour (30 octobre 2026, demande de Bryan) : la Clinique les rend au repos.
import { describe, expect, it } from 'vitest';
import { accessibles } from '../src/core/expedition';
import { tick } from '../src/core/partie/temps';
import { entrer, nouveauJeu, partir, pvMaxCombat, pvMinDepart, remonter, soinParHeure, soignerVite, usureMax, DISTRICT } from '../src/core/jeu';

function descente() {
  const j = nouveauJeu(0, 1); j.chambre = true; j.recrues = true;
  expect(partir(j, ['ilka', 'doran', 'vela'], 1, 5).ok).toBe(true);
  entrer(j, accessibles(j.expedition!)[0]!.id);
  return j;
}

describe('Les PV perdus restent perdus au retour', () => {
  it('Ilka remonte à 3 PV : il lui en reste 3 au district', () => {
    const j = descente();
    j.expedition!.combat.porteurs.find((p) => p.id === 'ilka')!.pv = 3;
    j.expedition!.retraite = true;
    remonter(j);
    expect(pvMaxCombat(j, 'ilka')).toBe(3);
    // un Porteur indemne ne prend pas d'Usure
    expect(pvMaxCombat(j, 'doran')).toBe(usureMax(j, 'doran'));
  });

  it('à terre, il ne redescend qu’après avoir retrouvé un quart de ses PV', () => {
    const j = descente();
    j.expedition!.combat.porteurs.find((p) => p.id === 'ilka')!.pv = 0;
    j.expedition!.retraite = true;
    remonter(j);
    expect(pvMaxCombat(j, 'ilka')).toBe(0);
    const r = partir(j, ['ilka', 'doran', 'vela'], 1, 6);
    expect(r.ok).toBe(false);
    expect(r.message).toContain('Clinique');
    // la Clinique le remet sur pied au repos
    const heures = Math.ceil(pvMinDepart(j, 'ilka') / soinParHeure(j)) + 1;
    tick(j, j.dernierTick + heures * 3_600_000);
    expect(pvMaxCombat(j, 'ilka')).toBeGreaterThanOrEqual(pvMinDepart(j, 'ilka'));
    expect(partir(j, ['ilka', 'doran', 'vela'], 1, 6).ok).toBe(true);
  });

  it('les soins intensifs rendent les PV contre de l’énergie', () => {
    const j = descente();
    j.expedition!.combat.porteurs.find((p) => p.id === 'ilka')!.pv = 10;
    j.expedition!.retraite = true;
    remonter(j);
    j.energie = 1000;
    expect(soignerVite(j, 'ilka').ok).toBe(true);
    expect(pvMaxCombat(j, 'ilka')).toBe(usureMax(j, 'ilka'));
    expect(DISTRICT.pvMinDepart).toBe(0.25);
  });
});
