import { describe, expect, it } from 'vitest';
import { creerCombat, ajouter, retirer, brumeActive } from '../src/core/combat';
import { porteurDef } from '../src/core/donnees';

const equipe = () => ['ilka', 'doran', 'vela'].map((id) => ({ id, pv: porteurDef(id).pvMax, pvMax: porteurDef(id).pvMax, aTerre: false }));

describe('Brouillard', () => {
  it('reste actif tout le tour, même après avoir posé puis retiré une carte', () => {
    const s = creerCombat({ porteurs: equipe(), ennemiId: 'vigie', condition: 'brouillard', rng: 1 });
    expect(brumeActive(s)).toBe(true);
    const a = s.main.find((g) => !g.vide && !g.lourd)!;
    expect(ajouter(s, a.uid).ok).toBe(true);
    expect(brumeActive(s)).toBe(true);
    expect(retirer(s, a.uid).ok).toBe(true);
    expect(brumeActive(s)).toBe(true);
  });
  it('sans brouillard, rien n’est caché', () => {
    const s = creerCombat({ porteurs: equipe(), ennemiId: 'vigie', rng: 1 });
    expect(brumeActive(s)).toBe(false);
  });
});
