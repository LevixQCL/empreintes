// La carte d'origine en nacre (Bryan, 14 novembre 2026) : une Perle et les cristaux de la nacre, sans copies, Porteur niveau 13
import { describe, expect, it } from 'vitest';
import { carteId, moduleDef } from '../src/core/donnees';
import { garderCarteRecit, nouveauJeu, promouvoir } from '../src/core/jeu';
import { COLLECTION, sansBonusOrigine, freinPromotion } from '../src/core/collection';
import { gesteDeCarte } from '../src/core/donnees';
import { xpPourNiveau } from '../src/core/partie/etat';

const xpAuNiveau = (n: number) => Array.from({ length: n - 1 }, (_, k) => xpPourNiveau(k + 1)).reduce((a, b) => a + b, 0);

function jeuAvecOrigine(niveauIlka: number) {
  const j = nouveauJeu(1);
  garderCarteRecit(j, 'ilka', 'cle-des-pompes');
  const or = carteId('cle-des-pompes', 'or');
  j.porteurs.ilka!.modules.push(or);
  j.porteurs.ilka!.xp = xpAuNiveau(niveauIlka);
  j.collection[or]!.niveau = 4;
  j.energie = 10000;
  return { j, or, nacre: carteId('cle-des-pompes', 'nacre') };
}

describe('carte d’origine en nacre', () => {
  it('demande un Porteur de niveau 13 et une Perle, mais aucune copie', () => {
    const { j, or } = jeuAvecOrigine(12);
    j.perles = 1;
    expect(freinPromotion(j, or)).toMatch(/niveau 13/);
    const k = jeuAvecOrigine(13);
    expect(freinPromotion(k.j, k.or)).toMatch(/Perle/);
    k.j.perles = 1;
    expect(freinPromotion(k.j, k.or)).toBeNull();
  });

  it('passe en nacre au même niveau, dans le même deck, et consomme une Perle et les cristaux', () => {
    const { j, or, nacre } = jeuAvecOrigine(13);
    j.perles = 2;
    const r = promouvoir(j, or);
    expect(r.ok).toBe(true);
    expect(j.perles).toBe(1);
    expect(j.energie).toBe(10000 - COLLECTION.promotion.cristaux.nacre);
    expect(j.collection[or]).toBeUndefined();
    expect(j.collection[nacre]!.niveau).toBe(4);
    expect(j.porteurs.ilka!.modules).toContain(nacre);
    expect(moduleDef(nacre).v).toBeGreaterThan(moduleDef(or).v);
    expect(freinPromotion(j, nacre)).toBe('La nacre est le plus haut métal.');
  });

  it('face à un autre joueur, la nacre d’origine perd toujours son effet en plus', () => {
    const g = sansBonusOrigine(gesteDeCarte(carteId('cle-des-pompes', 'nacre'), 'ilka'));
    expect(g.effet2).toBeUndefined();
  });

  it('changer d’avis après la nacre garde la nacre (la Perle n’est pas perdue)', () => {
    const { j, or, nacre } = jeuAvecOrigine(13);
    j.perles = 1;
    promouvoir(j, or);
    expect(garderCarteRecit(j, 'ilka', 'toutes-les-courses').ok).toBe(true);
    expect(j.collection[nacre]).toBeUndefined();
    expect(j.collection[carteId('toutes-les-courses', 'nacre')]!.niveau).toBe(4);
    expect(j.porteurs.ilka!.modules).toContain(carteId('toutes-les-courses', 'nacre'));
  });
});
