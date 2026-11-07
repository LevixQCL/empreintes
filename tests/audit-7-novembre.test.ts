import { describe, expect, it } from 'vitest';
import { ajouter, creerCombat, lancer, tousEnnemis } from '../src/core/combat';
import { BATIMENTS, PORTEURS, gesteDeCarte } from '../src/core/donnees';

// Corrections de l'audit complet du 7 novembre 2026
const equipe = () => PORTEURS.slice(0, 3).map((p) => ({ id: p.id, pv: p.pvMax, pvMax: p.pvMax, aTerre: false }));
const jouerUneCarte = (s: ReturnType<typeof creerCombat>) => {
  s.main = [{ ...gesteDeCarte('bond@fer', 'ilka'), uid: 'b' }];
  ajouter(s, 'b'); lancer(s);
};

describe('Audit du 7 novembre : district', () => {
  it('chaque bâtiment a un coût pour chaque niveau jusqu’à son niveau max', () => {
    for (const b of BATIMENTS) expect(b.couts, b.id).toHaveLength(b.niveauMax);
  });
});

describe('Audit du 7 novembre : combat', () => {
  it('un renfort appelé avant −4 n’a pas de traits, comme le gardien qui l’appelle', () => {
    const s = creerCombat({ porteurs: equipe(), ennemiId: 'confluence', rng: 7, traitsEnnemis: false });
    s.ennemi.pv = s.ennemi.pvMax = 9999;
    s.intention = { type: 'appel', nom: 'Appel' };
    jouerUneCarte(s);
    const renfort = tousEnnemis(s).find((e) => e.rejeton)!;
    expect(renfort).toBeTruthy();
    expect(renfort.sansTraits).toBe(true);
  });

  it('un ennemi qui voulait soigner ou couvrir un allié tombé ne se protège pas lui-même', () => {
    for (const type of ['bouclier', 'soin'] as const) {
      const s = creerCombat({ porteurs: equipe(), ennemiId: 'pilleur', rng: 7 });
      s.ennemi.pv = s.ennemi.pvMax = 9999;
      s.ennemi.pv = 5000;
      s.intention = type === 'soin' ? { type, nom: 'Soigner les siens', v: 18, allie: true } : { type, v: 14, allie: true };
      jouerUneCarte(s);
      expect(s.ennemi.bouclier, type).toBe(0);
      if (type === 'soin') expect(s.ennemi.pv).toBeLessThanOrEqual(5000);
    }
  });
});
