import { describe, expect, it } from 'vitest';
import { ennemiDef } from '../src/core/donnees';
import { FLECHE, chefDeQuai, gardiensQuai, nouveauJeu, voixDuQuartier } from '../src/core/jeu';

describe('Les gardes de la Flèche (31 octobre 2026)', () => {
  it('trois gardes des Hauts par quai, un par lignée, jamais des Porteurs du joueur', () => {
    for (const q of [1, 5, 33, 51, 77, 99]) {
      const g = gardiensQuai(q);
      expect(g).toHaveLength(3);
      for (const id of g) expect(id.startsWith('flc-')).toBe(true);
      expect(new Set(g.map((id) => ennemiDef(id).lignee)).size).toBe(3);
    }
  });
  it('le combat qui passe un quai gravé est mené par un chef de quai', () => {
    expect(gardiensQuai(17)[0]).toBe(chefDeQuai(20));
    expect(gardiensQuai(49)[0]).toBe('flc-hald');
    expect(gardiensQuai(FLECHE.quais - 1)[0]).toBe('flc-champion');
  });
  it('le quartier rappelle que l’eau vient d’en bas, jusqu’au gardien de −10', () => {
    const j = nouveauJeu(0, 1);
    j.strate = 7;
    expect(voixDuQuartier(j, 3)).toBeTruthy();
    j.strate = 10; j.frontVaincu = true;
    expect(voixDuQuartier(j, 3)).toBeNull();
  });
});
