// Les Récits des origines (Pack des origines, 11 novembre 2026) : les cartes d'origine et leur équivalent gratuit.
import { describe, expect, it } from 'vitest';
import { MODULES, MODULES_TIRABLES, carteId, moduleDef } from '../src/core/donnees';
import { RECITS_ORIGINES, carteDuRecit, garderCarteRecit, nouveauJeu, raisonNonEchangeable } from '../src/core/jeu';

const origines = MODULES.filter((m) => m.equivalent);

describe('Récits des origines', () => {
  it('chaque carte d’origine a un équivalent gratuit aux chiffres identiques', () => {
    expect(origines.length).toBeGreaterThan(0);
    for (const m of origines) {
      const eq = moduleDef(m.equivalent!);
      expect(MODULES_TIRABLES).toContain(eq);
      for (const k of ['lignee', 'rarete', 'type', 'v', 'f', 'effet', 'lourd'] as const) expect(m[k], `${m.id}.${k}`).toEqual(eq[k]);
    }
  });

  it('une carte d’origine ne tombe jamais ailleurs', () => {
    for (const m of origines) expect(MODULES_TIRABLES).not.toContain(m);
  });

  it('chaque choix d’un récit est une carte d’origine de la lignée de son personnage', () => {
    for (const r of Object.values(RECITS_ORIGINES)) for (const c of r.choix) expect(moduleDef(c.carte).equivalent).toBeTruthy();
  });

  it('garder une carte, puis changer d’avis : la nouvelle prend la place de l’ancienne', () => {
    const j = nouveauJeu(1);
    expect(garderCarteRecit(j, 'ilka', 'cle-des-pompes').ok).toBe(true);
    const a = carteId('cle-des-pompes', 'cuivre'), b = carteId('toutes-les-courses', 'cuivre');
    expect(j.collection[a]).toBeTruthy();
    j.porteurs.ilka!.modules.push(a);
    j.collection[a]!.niveau = 3;
    expect(garderCarteRecit(j, 'ilka', 'toutes-les-courses').ok).toBe(true);
    expect(j.collection[a]).toBeUndefined();
    expect(j.collection[b]!.niveau).toBe(3);
    expect(j.porteurs.ilka!.modules).toContain(b);
    expect(carteDuRecit(j, 'ilka')).toBe('toutes-les-courses');
  });

  it('une carte d’origine ne s’échange pas au Cercle', () => {
    const j = nouveauJeu(2);
    garderCarteRecit(j, 'ilka', 'cle-des-pompes');
    expect(raisonNonEchangeable(j, carteId('cle-des-pompes', 'cuivre'))).toMatch(/origine/);
  });
});
