import { describe, expect, it } from 'vitest';
import { COLLECTION, tirerTrouvaille, type EtatCollection } from '../src/core/collection';

describe('Trouvailles orientées vers les cartes possédées', () => {
  it('environ 40 % des trouvailles en fer sont un doublon d’une carte possédée en fer', () => {
    const e: EtatCollection = { collection: { 'tir@fer': { niveau: 1, doublons: 0 } }, sans: { argent: 0, or: 0, nacre: 0 }, rng: 99 };
    let fer = 0, tir = 0;
    for (let k = 0; k < 4000; k++) { e.sans = { argent: 0, or: 0, nacre: 0 }; const c = tirerTrouvaille(e, 1); if (c.endsWith('@fer')) { fer++; if (c === 'tir@fer') tir++; } }
    const part = tir / fer;
    expect(part).toBeGreaterThan(COLLECTION.affinite - 0.05);
    expect(part).toBeLessThan(COLLECTION.affinite + 0.08);
  });
});
