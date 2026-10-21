import { describe, expect, it } from 'vitest';
import { MODULES, porteurDef } from '../src/core/donnees';
import { mesurer, simulerExpedition, type Escouade } from '../src/core/robot';

const depart = (): Escouade => ({
  ilka: [{ id: 'jambes-ressort', niveau: 1 }],
  doran: [{ id: 'glande-ambre', niveau: 1 }],
  vela: [{ id: 'eclat-chant', niveau: 1 }],
});
const porteurDe = { tech: 'ilka', bio: 'doran', reso: 'vela' } as const;

describe('Robot d’équilibrage', () => {
  it('gagne la Strate −1 avec le deck de départ', () => {
    expect(mesurer(depart(), 1, 20).victoire).toBeGreaterThanOrEqual(0.9);
  });

  it('joue chaque carte sans blocage', () => {
    for (const m of MODULES) {
      const e = depart();
      e[porteurDe[m.lignee]]!.push({ id: m.id, niveau: 10 });
      const r = simulerExpedition(e, 4, 11);
      expect(r.tours, m.nom).toBeLessThan(400);
      expect(porteurDef(porteurDe[m.lignee]).lignee).toBe(m.lignee);
    }
  });

  it('est reproductible : même graine, même résultat', () => {
    expect(simulerExpedition(depart(), 6, 5)).toEqual(simulerExpedition(depart(), 6, 5));
  });
});
