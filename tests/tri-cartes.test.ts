import { describe, expect, it } from 'vitest';
import { estTri, trierCartes } from '../src/core/collection';

describe('tri des cartes', () => {
  const col = { 'tir@fer': { niveau: 1 }, 'noyau-instable@nacre': { niveau: 5 }, 'dorsale@argent': { niveau: 3 } };
  const cles = Object.keys(col);
  it('« Nouvelles » met en tête les cartes pas encore vues', () => {
    const r = trierCartes(cles, col, 'nouvelles', ['noyau-instable@nacre', 'dorsale@argent']);
    expect(r[0]).toBe('tir@fer');
  });
  it('« Niveau » va du plus haut au plus bas', () => {
    expect(trierCartes(cles, col, 'niveau')).toEqual(['noyau-instable@nacre', 'dorsale@argent', 'tir@fer']);
  });
  it('reconnaît les tris connus seulement', () => {
    expect(estTri('nouvelles')).toBe(true);
    expect(estTri('n\'importe')).toBe(false);
  });
});
