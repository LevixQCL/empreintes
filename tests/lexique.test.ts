// Le lexique (31 octobre 2026, Luc) : les mots du jeu sont reconnus dans le texte des cartes.
import { describe, expect, it } from 'vitest';
import { LEXIQUE, decouper, termeDe } from '../src/core/lexique';
import { NOMS_EFFET, texteEffet } from '../src/core/effets';

const marques = (t: string) => decouper(t).filter((m) => m.terme).map((m) => m.terme);

describe('lexique', () => {
  it('« fissuré » dans la Curée renvoie à la Fissure', () => {
    expect(marques(texteEffet({ type: 'curee', part: 0.7 } as never))).toContain('fissure');
  });
  it('un mot dans un mot n’est pas marqué, ni deux fois le même', () => {
    expect(marques('Les Strates sont profondes')).toEqual(['strate']);
    expect(marques('Résonance')).toEqual(['resonance']);
    expect(marques('Les Résonants et la Résonance')).toEqual(['resonants', 'resonance']);
    expect(marques('Fréquence, puis Fréquence')).toEqual(['frequence']);
  });
  it('le texte découpé se recolle à l’identique', () => {
    const t = 'Son métal ne lui ouvre qu’une Fréquence ; en argent et en or, elle en a 2, en nacre 3.';
    expect(decouper(t).map((m) => m.texte).join('')).toBe(t);
  });
  it('le journal trouve toujours ses termes', () => {
    expect(termeDe('Fissure')?.nom).toBe('Fissure');
    expect(termeDe('Résonance (suite de 3)')?.nom).toBe('Résonance');
  });
  it('chaque effet de carte du lexique porte le nom de l’effet', () => {
    const noms = new Set(Object.values(NOMS_EFFET));
    for (const t of Object.values(LEXIQUE)) if (t.theme === 'effet') expect(noms.has(t.nom)).toBe(true);
  });
});
