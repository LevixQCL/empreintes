// La Flèche (28 octobre 2026) : ouverture, force des gardiens, montée, descente, quais gravés, et vrais combats.
import { describe, expect, it } from 'vitest';
import { ASCENSION, FLECHE, etatFleche, flecheOuverte, forceEscouade, forceQuai, gardiensQuai, monterFleche, nouveauJeu, pas, plancher, remonter, remonterFleche } from '../src/core/jeu';
import { defierGardien, gageEnCaisse, gageJour, peutDefier, peutTenir, quitterQuai, recevoirGage, subirAssauts, tenirQuai } from '../src/core/jeu';
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

// Deux couches (29 octobre 2026) : la montée de l'histoire, la garde et les défis de la compétition
describe('Tenir un quai et défier les gardiens', () => {
  const H = 3_600_000;
  const surQuai = (q: number, record = q) => { const j = pret(); etatFleche(j).quai = q; etatFleche(j).record = record; return j; };
  const GARDIEN = { id: 'uid-x', nom: 'Haut-Treuil', quai: 20, porteurs: ['doran', 'vela', 'ilka'], force: 3.5 };

  it('on tient un quai déjà atteint (pas le pied), et l’on continue de monter en le tenant', () => {
    const j = surQuai(23, 31);
    expect(peutTenir(j, ESC, 1).ok).toBe(false);
    expect(peutTenir(j, ESC, 32).ok).toBe(false);
    expect(tenirQuai(j, ESC, 31, 0).ok).toBe(true);
    expect(monterFleche(j, ESC).ok).toBe(true);
  });

  it('le gage court, plafonné à deux jours ; changer de quai verse le précédent', () => {
    const j = surQuai(20);
    tenirQuai(j, ESC, 20, 0);
    expect(gageJour(20)).toEqual({ composants: 90, eclats: 0 });
    expect(gageEnCaisse(j, 12 * H).composants).toBe(45);
    expect(gageEnCaisse(j, 10 * 24 * H).composants).toBe(180);
    const avant = j.composants;
    expect(recevoirGage(j, 12 * H).composants).toBe(45);
    expect(j.composants).toBe(avant + 45);
    tenirQuai(j, ESC, 12, 24 * H);
    expect(j.composants).toBe(avant + 90);
    expect(etatFleche(j).garde!.quai).toBe(12);
    expect(quitterQuai(j, 24 * H)!.composants).toBe(0);
    expect(etatFleche(j).garde).toBeUndefined();
  });

  it('une défense tenue rapporte ; une défense perdue fait perdre le quai, jamais la montée', () => {
    const j = surQuai(64);
    tenirQuai(j, ESC, 64, 0);
    const avant = j.composants;
    subirAssauts(j, [{ id: 'a', nom: 'Verrelune', quai: 64, victoire: false, le: H }]);
    subirAssauts(j, [{ id: 'a', nom: 'Verrelune', quai: 64, victoire: false, le: H }]);
    expect(etatFleche(j).garde!.repousses).toBe(1);
    expect(j.composants).toBe(avant + Math.round(gageJour(64).composants * ASCENSION.partDefense));
    subirAssauts(j, [{ id: 'b', nom: 'X', quai: 30, victoire: true, le: 2 * H }]);
    expect(etatFleche(j).garde).toBeDefined();
    subirAssauts(j, [{ id: 'c', nom: 'Brisecôte', quai: 64, victoire: true, le: 12 * H }]);
    expect(etatFleche(j).garde).toBeUndefined();
    expect(etatFleche(j).quai).toBe(64);
  });

  it('on ne défie qu’un quai déjà atteint, et plus haut que celui qu’on tient', () => {
    expect(peutDefier(surQuai(10, 15), GARDIEN).ok).toBe(false);
    const j = surQuai(20);
    tenirQuai(j, ESC, 20, 0);
    expect(peutDefier(j, GARDIEN).ok).toBe(false);
    expect(peutDefier(surQuai(5, 20), GARDIEN).ok).toBe(true);
  });

  it('un défi ne fait ni monter ni descendre : gagné, il donne le quai ; il part en ligne', () => {
    const j = surQuai(5, 24);
    expect(defierGardien(j, ESC, GARDIEN, 7).ok).toBe(true);
    expect(j.expedition!.combat.ennemi.porteur).toBe('doran');
    const r = jouer(j);
    expect(r.fleche!.defi).toEqual({ nom: 'Haut-Treuil', quai: 20 });
    expect(etatFleche(j).quai).toBe(5);
    expect(etatFleche(j).garde?.quai).toBe(r.victoire ? 20 : undefined);
    expect(etatFleche(j).aEnvoyer).toEqual([{ cible: 'uid-x', quai: 20, victoire: r.victoire, le: expect.any(Number) }]);
  });

  it('la montée de l’histoire n’affronte jamais un joueur', () => {
    const j = surQuai(20);
    monterFleche(j, ESC, 7);
    expect(j.expedition!.fleche!.gardien).toBeUndefined();
    jouer(j);
    expect(etatFleche(j).aEnvoyer ?? []).toEqual([]);
  });
});
