import { describe, expect, it } from 'vitest';
import { creerCombat, ajouter, retirer, viderChaine, brumeActive, estEngagee } from '../src/core/combat';
import { porteurDef } from '../src/core/donnees';

const equipe = () => ['ilka', 'doran', 'vela'].map((id) => ({ id, pv: porteurDef(id).pvMax, pvMax: porteurDef(id).pvMax, aTerre: false }));

describe('Brouillard', () => {
  it('la première carte lève la brume et ne peut plus être retirée', () => {
    const s = creerCombat({ porteurs: equipe(), ennemiId: 'vigie', condition: 'brouillard', rng: 1 });
    expect(brumeActive(s)).toBe(true);
    const a = s.main.find((g) => !g.vide && !g.lourd)!;
    expect(ajouter(s, a.uid).ok).toBe(true);
    expect(brumeActive(s)).toBe(false);
    expect(estEngagee(s, a.uid)).toBe(true);
    expect(retirer(s, a.uid).ok).toBe(false);
    viderChaine(s);
    expect(s.chaine.map((g) => g.uid)).toEqual([a.uid]);
    expect(brumeActive(s)).toBe(false);
  });
  it('sans brouillard, rien n’est engagé', () => {
    const s = creerCombat({ porteurs: equipe(), ennemiId: 'vigie', rng: 1 });
    const a = s.main.find((g) => !g.vide && !g.lourd)!;
    ajouter(s, a.uid);
    expect(retirer(s, a.uid).ok).toBe(true);
  });
});
