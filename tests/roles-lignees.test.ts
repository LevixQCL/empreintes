import { describe, expect, it } from 'vitest';
import { creerCombat, lancer } from '../src/core/combat';
import { PORTEURS, moduleDef } from '../src/core/donnees';
import { REGLES } from '../src/core/regles';
import type { Geste } from '../src/core/types';

// Rôles des lignées (29 octobre 2026) : les Augmentés frappent, les Génés tiennent, les Résonants troublent l'ennemi
const equipe = () => PORTEURS.slice(0, 3).map((p) => ({ id: p.id, pv: p.pvMax, pvMax: p.pvMax, aTerre: false }));
const geste = (f: number, uid: string, porteur = 'ilka'): Geste => ({ id: uid, uid, porteur, nom: 'Test', f, type: 'atk', v: 10 });

describe('Rôles des lignées', () => {
  it("l'Augmenté qui termine une suite frappe plus fort (Finisseur), pas celui qui l'ouvre", () => {
    const degats = (chaine: Geste[]) => {
      const s = creerCombat({ porteurs: equipe(), ennemiId: 'pilleur', rng: 3 });
      s.ennemi.bouclier = 0;
      s.ennemi.pv = s.ennemi.pvMax = 999;
      s.chaine = chaine;
      lancer(s, { silencieux: true });
      return 999 - s.ennemi.pv;
    };
    const suite = () => [geste(3, 'a'), geste(4, 'b'), geste(5, 'c')];
    const r = REGLES as { finisseur: number };
    const f = r.finisseur;
    expect(f).toBeGreaterThan(1);
    const avec = degats(suite());
    r.finisseur = 1;
    const sans = degats(suite());
    r.finisseur = f;
    // seule la troisième carte (×1,3 de Résonance) gagne le Finisseur
    expect(avec - sans).toBeGreaterThan(0);
    expect(avec - sans).toBeLessThanOrEqual(Math.ceil(sans / 3 * (f - 1)) + 1);
    // ouverte par un Augmenté mais terminée par Véla : aucun Finisseur
    const parVela = () => [geste(3, 'a'), geste(4, 'b'), geste(5, 'c', 'vela')];
    const v1 = degats(parVela());
    r.finisseur = 1;
    const v2 = degats(parVela());
    r.finisseur = f;
    expect(v1).toBe(v2);
  });

  it('les quatre cartes « Troubler » sont des attaques qui désarment', () => {
    for (const id of ['murmure', 'miroir-brume', 'meche-or', 'pressentiment']) {
      const m = moduleDef(id);
      expect(m.type).toBe('atk');
      expect(m.effet?.type).toBe('desarmer');
    }
  });
});
