import { describe, expect, it } from 'vitest';
import { creerCombat, usureCombat } from '../src/core/combat';
import { apercuDuel, creerDuel, escouadeDepart, usureDuel, DUEL } from '../src/core/duel';
import { PORTEURS } from '../src/core/donnees';
import { REGLES, peutPayerSurtension } from '../src/core/regles';

// Corrections de l'audit du 8 novembre 2026
const equipe = () => PORTEURS.slice(0, 3).map((p) => ({ id: p.id, pv: p.pvMax, pvMax: p.pvMax, aTerre: false }));

describe('Audit du 8 novembre : usure', () => {
  it('les ennemis frappent plus fort dès le tour 12 (pas le 13)', () => {
    const s = creerCombat({ porteurs: equipe(), ennemiId: 'remanent-faible', rng: 1 });
    s.tour = REGLES.usure.attaqueDes - 1;
    expect(usureCombat(s).attaque).toBe(1);
    s.tour = REGLES.usure.attaqueDes;
    expect(usureCombat(s).attaque).toBeCloseTo(1 + REGLES.usure.attaqueParTour);
    s.tour = REGLES.usure.soinsDes - 1;
    expect(usureCombat(s).soins).toBe(1);
    s.tour = REGLES.usure.soinsDes;
    expect(usureCombat(s).soins).toBeLessThan(1);
  });
});

describe('Audit du 8 novembre : Surtension en duel', () => {
  it('à 1 PV, le Porteur ne paie plus la Surtension et sa carte n’a pas le bonus (comme dans les Strates)', () => {
    expect(peutPayerSurtension({ pv: 1 })).toBe(false);
    expect(peutPayerSurtension({ pv: 2 })).toBe(true);
    const degats = (pv: number) => {
      const s = creerDuel(escouadeDepart('A'), escouadeDepart('B'), 3);
      const c = s.cotes[0];
      const g = c.main.find((x) => x.type === 'atk')!;
      g.effet = { type: 'surtension', part: 0.6, cout: 0.12 };
      c.chaine = [g];
      c.main = c.main.filter((x) => x !== g);
      c.porteurs.find((p) => p.id === g.porteur)!.pv = pv;
      return apercuDuel(s, 0).degats;
    };
    expect(degats(1)).toBeLessThan(degats(20));
  });
  it('l’usure du duel touche aussi la Riposte et le Siphon (vérifié par le multiplicateur)', () => {
    expect(usureDuel(DUEL.usure.des).attaque).toBeGreaterThan(1);
    expect(usureDuel(DUEL.usure.des).soin).toBeLessThan(1);
  });
});
