import { describe, expect, it } from 'vitest';
import * as J from '../src/core/jeu';
import { noterCombat, noterExpedition } from '../src/core/partie/stats';
import type { CombatEtat } from '../src/core/types';

const T = Date.parse('2026-10-25T10:00:00Z');
const actif = { actif: true, appareil: 'telephone' as const, compte: 'invisible' as const };

describe('Statistiques de la partie', () => {
  it('compte les sessions, les jours joués et le temps actif', () => {
    const j = J.nouveauJeu(T);
    for (let s = 0; s < 90; s++) J.noterTemps(j, T + s * 1000, actif);
    J.noterTemps(j, T + 100_000, { ...actif, actif: false });
    expect(j.stats).toMatchObject({ sessions: 1, secondes: 90, appareil: 'telephone', compte: 'invisible' });
    // une heure sans rien toucher : nouvelle session ; le lendemain : un jour de plus
    J.noterTemps(j, T + 3_600_000, actif);
    J.noterTemps(j, T + 86_400_000, actif);
    expect(j.stats!.sessions).toBe(3);
    expect(j.stats!.jours).toHaveLength(2);
    expect(j.stats!.premierJour).toBe(j.stats!.jours[0]);
  });

  it('range les combats par ennemi et les expéditions par Strate', () => {
    const j = J.nouveauJeu(T);
    const c = { ennemi: { id: 'vigie' }, tour: 4 } as CombatEtat;
    noterCombat(j, c, 'victoire');
    noterCombat(j, c, 'fuite');
    noterExpedition(j, 2, 'gardien');
    noterExpedition(j, 2, 'defaite');
    expect(j.stats!.ennemis.vigie).toEqual([1, 0, 1, 8]);
    expect(j.stats!.strates[2]).toEqual([2, 1, 1, 0, 0]);
  });

  it('compte les cartes lancées', () => {
    const j = J.nouveauJeu(T);
    J.noterChaine(j, [{ id: 'ruee' }, { id: 'ruee' }, { id: 'parade' }] as Parameters<typeof J.noterChaine>[1]);
    expect(j.stats!.cartes).toEqual({ ruee: 2, parade: 1 });
  });
});
