// La Flèche (28 octobre 2026) : ouverture, force des gardiens, montée, descente, quais gravés, et vrais combats.
import { describe, expect, it } from 'vitest';
import { ASCENSION, FLECHE, etatFleche, flecheOuverte, forceEscouade, forceQuai, gardiensQuai, monterFleche, nouveauJeu, pas, plancher, remonter, remonterFleche } from '../src/core/jeu';
import { jouerTourMoyen } from '../src/core/robot';

const ESC = ['ilka', 'doran', 'vela'];
const pret = () => { const j = nouveauJeu(0, 1); j.chambre = true; j.recrues = true; j.frontVaincu = true; j.scenes = ['convocation']; return j; };

/** Joue l'assaut en cours jusqu'au bout (joueur moyen) et remonte */
function jouer(j: ReturnType<typeof pret>) {
  const s = j.expedition!.combat;
  for (let t = 0; s.issue === 'en-cours' && t < 80; t++) jouerTourMoyen(s);
  return remonter(j);
}

describe('La Flèche', () => {
  it('s’ouvre avec la lettre des Hauts', () => {
    const j = nouveauJeu(0, 1);
    j.chambre = true;
    expect(flecheOuverte(j)).toBe(false);
    expect(monterFleche(j, ESC).ok).toBe(false);
    j.scenes = ['convocation'];
    expect(flecheOuverte(j)).toBe(true);
  });

  it('les gardiens montent régulièrement du pied au sommet, et restent les mêmes pour un quai', () => {
    expect(forceQuai(1)).toBeCloseTo(ASCENSION.forcePied, 2);
    expect(forceQuai(FLECHE.quais)).toBeCloseTo(ASCENSION.forceSommet, 2);
    for (let q = 2; q <= FLECHE.quais; q++) expect(forceQuai(q)).toBeGreaterThan(forceQuai(q - 1));
    expect(gardiensQuai(37)).toEqual(gardiensQuai(37));
    expect(new Set(gardiensQuai(37)).size).toBe(3);
  });

  it('vite en bas, lentement en haut ; jamais sous le dernier quai gravé', () => {
    expect([pas(1), pas(40), pas(41), pas(70), pas(71), pas(100)]).toEqual([4, 4, 2, 2, 1, 1]);
    expect(plancher(19)).toBe(1);
    expect(plancher(20)).toBe(20);
    expect(plancher(64)).toBe(60);
  });

  it('une victoire fait monter et donne chaque quai gravé une seule fois', () => {
    const j = pret();
    const f = etatFleche(j);
    f.quai = 17; f.record = 17;
    expect(monterFleche(j, ESC).ok).toBe(true);
    j.expedition!.combat.issue = 'victoire';
    const avant = { c: j.composants, e: j.eclats };
    const r = remonterFleche(j, 1000)!;
    expect(r).toMatchObject({ victoire: true, de: 17, a: 21, record: true });
    expect(r.paliers).toEqual([{ quai: 20, ...ASCENSION.recompenses[20] }]);
    expect(j.composants - avant.c).toBe(ASCENSION.recompenses[20]!.composants);
    expect(j.eclats - avant.e).toBe(ASCENSION.recompenses[20]!.eclats);
    // redescendre puis remonter ne redonne rien
    f.quai = 18;
    for (const id of ESC) j.porteurs[id]!.usure = 0;
    monterFleche(j, ESC);
    j.expedition!.combat.issue = 'victoire';
    expect(remonterFleche(j, 2000)!.paliers).toEqual([]);
  });

  it('une défaite fait redescendre, mais pas sous le quai gravé', () => {
    const j = pret();
    const f = etatFleche(j);
    f.quai = 22; f.record = 22;
    monterFleche(j, ESC);
    j.expedition!.combat.issue = 'defaite';
    expect(remonterFleche(j, 0)).toMatchObject({ victoire: false, de: 22, a: 20 });
    expect(f.record).toBe(22);
    expect(f.defaites).toBe(1);
  });

  it('un vrai combat se joue jusqu’au bout, et l’escouade de départ ne s’envole pas', () => {
    const j = pret();
    expect(forceEscouade(j, ESC)).toBeLessThan(forceQuai(1));
    let victoires = 0;
    for (let k = 0; k < 6; k++) {
      for (const id of ESC) j.porteurs[id]!.usure = 0;
      expect(monterFleche(j, ESC).ok).toBe(true);
      expect(j.expedition!.fleche).toBeTruthy();
      if (jouer(j).victoire) victoires++;
      expect(j.expedition).toBeNull();
    }
    expect(etatFleche(j).victoires + etatFleche(j).defaites).toBe(6);
    expect(victoires).toBe(etatFleche(j).victoires);
    // l'escouade de départ ne s'envole pas vers le sommet
    expect(etatFleche(j).quai).toBeLessThan(40);
  });
});
