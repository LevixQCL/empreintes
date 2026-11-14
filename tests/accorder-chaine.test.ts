import { describe, expect, it } from 'vitest';
import { accorderChaine, analyserChaine } from '../src/core/regles';

describe('accorderChaine (14 novembre 2026)', () => {
  it('une carte 3/2 posée en premier passe au 2 devant un 3 puis un 4', () => {
    const c = [{ f: 3, fs: [3, 2] }, { f: 3 }, { f: 4 }];
    accorderChaine(c);
    expect(c.map((g) => g.f)).toEqual([2, 3, 4]);
    expect(analyserChaine(c).suite).toBe(3);
  });
  it('garde un Écho plutôt qu’une petite suite', () => {
    const c = [{ f: 4 }, { f: 4 }, { f: 4 }, { f: 4, fs: [4, 5] }];
    accorderChaine(c);
    expect(c[3]!.f).toBe(4);
  });
  it('ne touche pas une carte réglée à la main', () => {
    const c = [{ f: 3, fs: [3, 2], accorde: true }, { f: 3 }, { f: 4 }];
    accorderChaine(c);
    expect(c[0]!.f).toBe(3);
  });
  it('sans gain, reprend la Fréquence principale', () => {
    const c = [{ f: 2, fs: [9, 7] }, { f: 1 }];
    accorderChaine(c);
    expect(c[0]!.f).toBe(9);
  });
});
