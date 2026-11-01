import { describe, expect, it } from 'vitest';
import { MODULES } from '../src/core/donnees';
import { ZONES_FREQUENCES } from '../src/core/regles';

describe('Zones de Fréquences des lignées (1er novembre 2026)', () => {
  it('la Fréquence principale de chaque carte est dans la zone de sa lignée', () => {
    for (const m of MODULES) {
      const [a, b] = ZONES_FREQUENCES[m.lignee];
      expect(m.f[0]!, m.id).toBeGreaterThanOrEqual(a);
      expect(m.f[0]!, m.id).toBeLessThanOrEqual(b);
    }
  });

  it('les autres Fréquences d’une carte ordinaire ne débordent que d’un cran', () => {
    for (const m of MODULES) {
      if (m.seul || m.legs || m.lien) continue;
      const [a, b] = ZONES_FREQUENCES[m.lignee];
      for (const f of m.f) expect(f >= a - 1 && f <= b + 1, `${m.id} : ${f}`).toBe(true);
    }
  });

  it('les trois zones couvrent ensemble l’échelle 1 à 9', () => {
    for (let f = 1; f <= 9; f++) expect(Object.values(ZONES_FREQUENCES).some(([a, b]) => f >= a && f <= b)).toBe(true);
  });
});
