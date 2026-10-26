import { describe, expect, it } from 'vitest';
import { ajouter, apercuChaine, creerCombat, lancer } from '../src/core/combat';
import { PORTEURS, gesteDeCarte } from '../src/core/donnees';

const equipe = () => PORTEURS.slice(0, 3).map((p) => ({ id: p.id, pv: p.pvMax, pvMax: p.pvMax, aTerre: false }));

describe('L’aperçu de la chaîne', () => {
  it('annonce exactement les dégâts que le lancer fera, sans toucher au combat', () => {
    for (const ennemiId of ['remanent', 'vigie']) {
      const s = creerCombat({ porteurs: equipe(), ennemiId, rng: 11 });
      s.ennemi.pv = s.ennemi.pvMax = 999;
      s.ennemi.fissure = 0.4;
      // une suite 3 → 4 → 5 : Résonance ×1,3
      s.main = [
        { ...gesteDeCarte('ruee@fer', 'ilka'), uid: 'a' },
        { ...gesteDeCarte('bond@fer', 'ilka'), uid: 'b' },
        { ...gesteDeCarte('charge@fer', 'doran'), uid: 'c' },
      ];
      for (const uid of ['a', 'b', 'c']) ajouter(s, uid);
      const avant = JSON.stringify(s);
      const a = apercuChaine(s);
      expect(JSON.stringify(s)).toBe(avant);
      expect(a.degats).toBeGreaterThan(0);
      lancer(s);
      expect(999 - s.ennemi.pv).toBe(a.degats);
    }
  });

  it('sans chaîne, rien à annoncer', () => {
    const s = creerCombat({ porteurs: equipe(), ennemiId: 'remanent', rng: 2 });
    expect(apercuChaine(s).degats).toBe(0);
  });
});
