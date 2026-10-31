import { describe, expect, it } from 'vitest';
import { creuseursRequis, nouveauJeu, noyauRequis, tick } from '../src/core/jeu';

describe('La roche se perce dès que tout est prêt (31 octobre 2026, Luc)', () => {
  it('gardien vaincu, assez de creuseurs, Tour assez haute : la Strate suivante s’ouvre au prochain passage du temps', () => {
    const j = nouveauJeu(0, 1);
    j.chambre = true; j.recrues = true; j.introVue = true;
    j.strate = 5; j.frontVaincu = true;
    j.batiments.noyau = Math.max(j.batiments.noyau, noyauRequis(6));
    j.creuseurs = creuseursRequis(6);
    tick(j, 60_000);
    expect(j.strate).toBe(6);
    expect(j.frontVaincu).toBe(false);
  });
});
