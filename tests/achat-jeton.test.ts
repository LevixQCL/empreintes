import { describe, expect, it } from 'vitest';
import { PILLAGE, acheterJeton, coutJeton, etatPillage, nouveauJeu } from '../src/core/jeu';

describe('jetons de pillage achetés avec l’énergie', () => {
  it('coûte de l’énergie, 2 fois par jour au plus, jamais au-delà du maximum', () => {
    const j = nouveauJeu(Date.parse('2026-10-31T10:00:00Z'));
    const now = j.dernierTick;
    j.batiments.generateur = Math.max(1, j.batiments.generateur);
    const e = etatPillage(j);
    expect(acheterJeton(j, now).ok).toBe(false); // déjà 5 jetons
    e.jetons = 1; e.jetonsLe = now;
    j.energie = 10_000;
    const cout = coutJeton(j);
    expect(acheterJeton(j, now).ok).toBe(true);
    expect(e.jetons).toBe(2);
    expect(j.energie).toBe(10_000 - cout);
    expect(acheterJeton(j, now).ok).toBe(true);
    expect(acheterJeton(j, now).ok).toBe(false); // limite du jour
    expect(e.jetons).toBe(3);
    // le lendemain, on peut de nouveau
    e.jetons = 1; e.jetonsLe = now + 86_400_000;
    expect(acheterJeton(j, now + 86_400_000).ok).toBe(true);
    expect(e.jetons).toBeLessThanOrEqual(PILLAGE.jetonsMax);
  });
});
