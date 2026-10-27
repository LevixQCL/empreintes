import { describe, expect, it } from 'vitest';
import * as J from '../src/core/jeu';
import { noterCombat, noterExpedition } from '../src/core/partie/stats';
import { creerCombat } from '../src/core/combat';
import { PORTEURS, gesteDeCarte } from '../src/core/donnees';
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

  it('note les étapes, les heures, la durée des sessions, les Porteurs, les chaînes et les boutons', () => {
    const j = J.nouveauJeu(T);
    j.introVue = true;
    J.noterTemps(j, T, actif);
    j.strate = 3;
    for (let s = 1; s < 10; s++) J.noterTemps(j, T + s * 1000, actif);
    expect(j.stats!.jalons).toMatchObject({ intro: 1, 'strate-2': 2, 'strate-3': 2 });
    expect(j.stats!.durees).toEqual([10]);
    expect(j.stats!.heures!.reduce((a, b) => a + b, 0)).toBe(10);
    noterExpedition(j, 3, 'gardien', ['ilka', 'doran']);
    expect(j.stats!.porteurs).toEqual({ ilka: [1, 1], doran: [1, 1] });
    J.noterChaine(j, [{ id: 'a', f: 2 }, { id: 'b', f: 3 }, { id: 'c', f: 7 }] as Parameters<typeof J.noterChaine>[1]);
    expect(j.stats!.chaines![3]).toBe(1);
    expect(j.stats!.suites![2]).toBe(1);
    J.noterAction(j, 'forge'); J.noterAction(j, 'forge');
    expect(j.stats!.actions).toEqual({ forge: 2 });
  });
});

describe('Coups d’éclat (27 octobre 2026)', () => {
  it('compte chaque Coup d’éclat par lignée, et ceux d’un deck du Moteur à part', () => {
    const j = J.nouveauJeu(0);
    const porteurs = PORTEURS.slice(0, 3).map((p) => ({ id: p.id, pv: p.pvMax, pvMax: p.pvMax, aTerre: false }));
    const sans = creerCombat({ porteurs, ennemiId: 'remanent', rng: 1 });
    const avec = creerCombat({ porteurs, ennemiId: 'remanent', rng: 1, deck: [gesteDeCarte('decharge-arc@cuivre', 'ilka'), gesteDeCarte('ruee@fer', 'ilka')] });
    J.noterEclat(j, sans, 'tech');
    J.noterEclat(j, avec, 'tech');
    J.noterEclat(j, sans, 'bio');
    expect(j.stats!.eclats).toEqual({ tech: 2, 'tech-decharge': 1, bio: 1 });
  });
});
