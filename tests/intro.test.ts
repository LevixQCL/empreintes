import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';

// L'intro est lue d'un bout à l'autre : le compteur d'années ne doit jamais revenir en arrière.
// (lecture du source : src/ui/intro.ts dépend de l'affichage et ne se charge pas hors navigateur)
const source = readFileSync(new URL('../src/ui/intro.ts', import.meta.url), 'utf8');
const annees = [...source.matchAll(/annees: \[(\d+), (\d+)\]/g)].map((m) => [Number(m[1]), Number(m[2])] as const);

describe('intro', () => {
  it('a des années pour chaque plan', () => {
    expect(annees.length).toBeGreaterThanOrEqual(10);
  });
  it('avance dans le temps, sans jamais revenir en arrière', () => {
    for (const [de, a] of annees) expect(a).toBeGreaterThanOrEqual(de);
    for (let i = 1; i < annees.length; i++) expect(annees[i]![0], `plan ${i + 1}`).toBeGreaterThanOrEqual(annees[i - 1]![1]);
  });
  it('commence avant 2026 et finit en 2121', () => {
    expect(annees[0]![0]).toBeLessThan(2026);
    expect(annees[annees.length - 1]![1]).toBe(2121);
  });
});
