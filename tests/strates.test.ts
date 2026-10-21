import { describe, expect, it } from 'vitest';
import { creerCombat, lancer } from '../src/core/combat';
import { ENNEMIS, PORTEURS, ZONES, sequenceStrate, zoneDe } from '../src/core/donnees';
import type { Geste } from '../src/core/types';

const equipe = () => PORTEURS.slice(0, 3).map((p) => ({ id: p.id, pv: p.pvMax, pvMax: p.pvMax, aTerre: false }));
const geste = (f: number, uid: string): Geste => ({ id: uid, uid, porteur: 'ilka', nom: 'Test', f, type: 'atk', v: 10 });

describe('Les zones des Strates', () => {
  it('chaque profondeur a sa zone, et chaque ennemi de zone existe', () => {
    expect(zoneDe(1).nom).toBe('Les Fondations');
    expect(zoneDe(5).nom).toBe('Les salles closes');
    expect(zoneDe(8).nom).toBe('Les mémoires contradictoires');
    expect(zoneDe(14).nom).toBe('Le fond');
    for (const z of ZONES) for (const id of [...z.ennemis, z.boss]) expect(ENNEMIS.some((e) => e.id === id)).toBe(true);
  });

  it('une expédition : deux ennemis différents de la zone, puis son gardien, toujours les mêmes pour une même graine', () => {
    for (const rng of [1, 7, 42, 999]) {
      const s = sequenceStrate(5, rng);
      expect(s).toHaveLength(3);
      expect(s[0]).not.toBe(s[1]);
      expect(ZONES[1]!.ennemis).toContain(s[0]);
      expect(s[2]).toBe('gardien-registres');
      expect(sequenceStrate(5, rng)).toEqual(s);
    }
  });
});

describe('Nouvelles intentions ennemies', () => {
  it('la Dissonance supprime la Résonance de la chaîne suivante', () => {
    const s = creerCombat({ porteurs: equipe(), ennemiId: 'brigadier', rng: 3 });
    expect(s.intention.type).toBe('dissonance');
    // premier tour : une chaîne quelconque, puis le Brigadier brouille les Fréquences
    s.main = [geste(1, 'a')]; s.chaine = [s.main.pop()!];
    lancer(s, { silencieux: true });
    expect(s.dissonance).toBe(true);
    // la suite 3-4-5 ne résonne pas : 30 dégâts exactement (10 + 10 + 10, avantage de lignée Tech contre Résonant)
    const avant = s.ennemi.pv;
    s.ennemi.bouclier = 0;
    s.chaine = [geste(3, 'b'), geste(4, 'c'), geste(5, 'd')];
    lancer(s, { silencieux: true });
    expect(avant - s.ennemi.pv).toBe(Math.round(10 * 1.15) * 3);
    expect(s.dissonance).toBe(false);
  });

  it('un ennemi qui se répare regagne des PV, sans dépasser son maximum', () => {
    const s = creerCombat({ porteurs: equipe(), ennemiId: 'pilleur', rng: 3 });
    s.ennemi.etape = 3; // la prochaine intention est Stimulant
    s.main = [geste(1, 'a')]; s.chaine = [s.main.pop()!];
    lancer(s, { silencieux: true }); // joue l'intention du tour 1 (Pied-de-biche)
    expect(s.intention.type).toBe('soin');
    s.ennemi.pv -= 20;
    const avant = s.ennemi.pv;
    s.chaine = [geste(9, 'z')]; s.chaine[0]!.v = 0;
    lancer(s, { silencieux: true });
    expect(s.ennemi.pv).toBeGreaterThan(avant);
    expect(s.ennemi.pv).toBeLessThanOrEqual(s.ennemi.pvMax);
  });
});
