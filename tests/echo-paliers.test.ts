import { describe, expect, it } from 'vitest';
import { ajouter, creerCombat, lancer } from '../src/core/combat';
import { PORTEURS } from '../src/core/donnees';
import { REGLES, analyserChaine, meilleureFrequence, multEcho } from '../src/core/regles';
import type { CombatEtat, Geste, TypeGeste } from '../src/core/types';

// Écho à 4 et à 5 cartes (1er novembre 2026) : un palier par carte en plus, et la carte à deux Fréquences ne casse plus l'Écho

const equipe = () => PORTEURS.slice(0, 3).map((p) => ({ id: p.id, pv: p.pvMax, pvMax: p.pvMax, aTerre: false }));
let n = 0;
const geste = (f: number, type: TypeGeste, v: number, fs?: number[]): Geste =>
  ({ id: 'test', uid: `e${n++}`, porteur: 'doran', nom: 'Test', f, type, v, ...(fs ? { fs } : {}) });
function combat(main: Geste[]): CombatEtat {
  const s = creerCombat({ porteurs: equipe(), ennemiId: 'remanent-faible', rng: 3 });
  s.main = main;
  delete s.ennemi.felure;
  s.intention = { type: 'bouclier', v: 0 };
  return s;
}

describe('Paliers de l’Écho', () => {
  it('3, 4 et 5 cartes identiques : +50 %, +65 %, +80 %', () => {
    expect(analyserChaine([{ f: 4 }, { f: 4 }, { f: 4 }]).echoN).toBe(3);
    expect(multEcho([{ f: 4 }, { f: 4 }, { f: 4 }, { f: 4 }], 3)).toBe(REGLES.echoPaliers[4]);
    expect(multEcho([{ f: 6 }, { f: 6 }, { f: 6 }, { f: 6 }, { f: 6 }], 0)).toBe(REGLES.echoPaliers[5]);
    expect(REGLES.echoPaliers[4]!).toBeGreaterThan(REGLES.echo);
    expect(REGLES.echoPaliers[5]!).toBeGreaterThan(REGLES.echoPaliers[4]!);
  });

  it('Après trois 4, une carte 4/5 prend le 4 (quadruplette) et non le 5 (suite 4 → 5 sans valeur)', () => {
    expect(meilleureFrequence([{ f: 4 }, { f: 4 }, { f: 4 }], [4, 5])).toBe(4);
    // une vraie Résonance reste prioritaire
    expect(meilleureFrequence([{ f: 2 }, { f: 3 }], [3, 4])).toBe(4);
    // sans Écho possible, elle prolonge la suite naissante
    expect(meilleureFrequence([{ f: 3 }], [3, 4].reverse())).toBe(4);
  });

  it('En combat, la quadruplette renforce les quatre cartes', () => {
    const s = combat([geste(4, 'atk', 10), geste(4, 'atk', 10), geste(4, 'atk', 10), geste(4, 'atk', 10, [4, 5])]);
    s.capaBonus = 1;
    for (const g of s.main.slice()) ajouter(s, g.uid);
    expect(s.chaine[3]!.f).toBe(4);
    lancer(s, { silencieux: true });
    expect(s.ennemi.pvMax - s.ennemi.pv).toBe(4 * Math.round(10 * REGLES.echoPaliers[4]!));
  });

  it('La quintuplette rend 1 Flux de plus', () => {
    const s = combat([1, 2, 3, 4, 5].map(() => geste(6, 'bouclier', 5)));
    s.capaBonus = 2;
    const flux = s.flux;
    for (const g of s.main.slice()) ajouter(s, g.uid);
    lancer(s, { silencieux: true });
    expect(s.flux).toBe(Math.min(REGLES.fluxMax, flux + 1 + REGLES.fluxEcho5));
  });
});
