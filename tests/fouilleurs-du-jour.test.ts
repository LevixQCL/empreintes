// Les fouilleurs du jour (8 novembre 2026, audit : −10 au jour 16 à cinq sessions par jour, au jour 40 à une seule)
import { describe, expect, it } from 'vitest';
import { CREUSEURS, chanceCreuseurDuJour, chanceCreuseurFouille, fouilleursDuJour, jourDe } from '../src/core/jeu';

const now = Date.UTC(2026, 10, 8, 12);
const ramenes = (n: number, jour = jourDe(now)) => ({ fouilleurs: { jour, n } });

describe('Les fouilleurs du jour', () => {
  it('au-dessus de −6, rien ne change', () => {
    expect(chanceCreuseurDuJour({}, 5, now)).toBe(chanceCreuseurFouille(5));
    expect(chanceCreuseurDuJour(ramenes(4), 5, now)).toBe(chanceCreuseurFouille(5));
  });

  it('à partir de −6, la première fouille réussie du jour ramène un creuseur à coup sûr', () => {
    expect(chanceCreuseurDuJour({}, 6, now)).toBe(1);
    expect(chanceCreuseurDuJour(ramenes(0), 10, now)).toBe(1);
  });

  it('ensuite la chance normale, puis une chance réduite au-delà de deux creuseurs dans la journée', () => {
    const r = CREUSEURS.fouilleursDuJour;
    expect(chanceCreuseurDuJour(ramenes(r.garantis), 8, now)).toBe(chanceCreuseurFouille(8));
    expect(chanceCreuseurDuJour(ramenes(r.parJour), 8, now)).toBe(r.chanceEnsuite);
    expect(r.chanceEnsuite).toBeLessThan(chanceCreuseurFouille(8));
  });

  it('le compteur repart à zéro le lendemain', () => {
    expect(fouilleursDuJour(ramenes(5, jourDe(now) - 1), now)).toBe(0);
    expect(chanceCreuseurDuJour(ramenes(5, jourDe(now) - 1), 8, now)).toBe(1);
  });
});

// La première exploration du front de la journée (8 novembre 2026, audit : explorer rapportait moins à la minute que fouiller)
import { nouveauJeu, partir } from '../src/core/jeu';
describe('La première exploration du front de la journée', () => {
  const pret = () => { const j = nouveauJeu(0, 1); j.chambre = true; j.recrues = true; j.strate = 4; return j; };
  const ESC = ['ilka', 'doran', 'vela'];
  it('rapporte double une fois par jour, au front seulement', () => {
    const j = pret();
    expect(partir(j, ESC, 4, 7).ok).toBe(true);
    expect(j.expedition!.premiere).toBe(true);
    j.expedition = null;
    expect(partir(j, ESC, 4, 8).ok).toBe(true);
    expect(j.expedition!.premiere).toBeFalsy();
    j.expedition = null;
    const k = pret();
    expect(partir(k, ESC, 3, 9).ok).toBe(true);
    expect(k.expedition!.premiere).toBeFalsy();
  });
});
