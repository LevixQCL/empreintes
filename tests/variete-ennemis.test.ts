import { describe, expect, it } from 'vitest';
import { genererCarte } from '../src/core/expedition';

// 4 novembre 2026 (test critique) : une descente de −1 croisait parfois trois ennemis seulement, deux fois chacun
describe('La variété des ennemis d’une Strate', () => {
  it('une carte de −1 fait croiser au moins quatre ennemis différents quand elle a au moins cinq combats', () => {
    for (let graine = 1; graine <= 60; graine++) {
      const c = genererCarte(1, graine * 7919, undefined, false, { halte: true, quete: true });
      const ennemis = c.salles.filter((s) => s.type === 'combat').map((s) => s.ennemi!);
      if (ennemis.length >= 5) expect(new Set(ennemis).size).toBeGreaterThanOrEqual(4);
    }
  });
});
