import { describe, expect, it } from 'vitest';
import { CARTES_DE_BASE, DEPART_PORTEURS, MODULES, carteId, porteurDef } from '../src/core/donnees';
import { mesurer, simulerExpedition, type Escouade } from '../src/core/robot';

/** le vrai deck de départ : 6 cartes en fer par Porteur nommé (+ les 2 cartes du district, ajoutées par le robot) */
const depart = (): Escouade => Object.fromEntries(Object.entries(DEPART_PORTEURS).map(([p, ids]) => [p, ids.map((id) => ({ id: carteId(id, 'fer'), niveau: 1 }))]));
const porteurDe = { tech: 'ilka', bio: 'doran', reso: 'vela' } as const;

describe('Robot d’équilibrage', () => {
  it('gagne la Strate −1 avec le deck de départ', () => {
    expect(mesurer(depart(), 1, 20).victoire).toBeGreaterThanOrEqual(0.9);
  });

  it('joue chaque carte sans blocage', () => {
    for (const m of MODULES.filter((x) => !CARTES_DE_BASE.includes(x.id))) {
      const e = depart();
      // la carte, en nacre, à la place de la carte de départ du Porteur de sa lignée
      e[porteurDe[m.lignee]]![5] = { id: carteId(m.id, 'nacre'), niveau: 10 };
      const r = simulerExpedition(e, 4, 11);
      expect(r.tours, m.nom).toBeLessThan(400);
      expect(porteurDef(porteurDe[m.lignee]).lignee).toBe(m.lignee);
    }
  });

  it('est reproductible : même graine, même résultat', () => {
    expect(simulerExpedition(depart(), 6, 5)).toEqual(simulerExpedition(depart(), 6, 5));
  });
});
