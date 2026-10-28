// Une nouveauté de combat à la fois (28 octobre 2026) : rien n'est retiré, chaque mécanique arrive à sa Strate (REGLES.apparition).
import { describe, expect, it } from 'vitest';
import { escorteDe, nouvelleExpedition } from '../src/core/expedition';
import { porteurDef } from '../src/core/donnees';
import { traitsActifs } from '../src/core/combat';
import { REGLES } from '../src/core/regles';

describe('Les mécaniques de combat arrivent Strate après Strate', () => {
  it('l’ordre décidé : Fêlure, puis groupes, puis traits, puis conditions', () => {
    expect(REGLES.apparition).toEqual({ felure: 2, groupes: 3, traits: 4, conditions: 5 });
  });
  it('pas de groupe avant la Strate −3', () => {
    for (let id = 0; id < 60; id++) expect(escorteDe(2, 7, id, ['vigie'])).toEqual([]);
    let n = 0;
    for (let id = 0; id < 60; id++) n += escorteDe(3, 7, id, ['vigie']).length;
    expect(n).toBeGreaterThan(0);
  });
  it('Strate −1 : ennemis simples ; −2 et −3 : Fêlure sans traits ; −4 : tout', () => {
    const ennemi = (strate: number) => {
      const porteurs = ['ilka', 'doran', 'vela'].map((id) => ({ id, pv: porteurDef(id).pvMax, pvMax: porteurDef(id).pvMax, aTerre: false }));
      return nouvelleExpedition({ strate, rng: 3, porteurs, deck: [] }).combat.ennemi;
    };
    expect(ennemi(1).simple).toBe(true);
    for (const st of [2, 3]) { const en = ennemi(st); expect(en.simple).toBeFalsy(); expect(traitsActifs(en)).toBe(false); }
    expect(traitsActifs(ennemi(4))).toBe(true);
  });
});
