import { describe, expect, it } from 'vitest';
import { ajouter, apercuChaine, creerCombat, detailForce, lancer } from '../src/core/combat';
import { PORTEURS, gesteDeCarte } from '../src/core/donnees';

const equipe = () => PORTEURS.slice(0, 3).map((p) => ({ id: p.id, pv: p.pvMax, pvMax: p.pvMax, aTerre: false }));

describe('L’aperçu de la chaîne', () => {
  it('annonce exactement les dégâts que le lancer fera, sans toucher au combat', () => {
    for (const ennemiId of ['remanent', 'vigie']) {
      const s = creerCombat({ porteurs: equipe(), ennemiId, rng: 11 });
      s.ennemi.pv = s.ennemi.pvMax = 999;
      s.ennemi.fissure = 0.4;
      // une suite 3 → 4 → 5 : Résonance ×1,3
      s.main = [
        { ...gesteDeCarte('ruee@fer', 'ilka'), uid: 'a' },
        { ...gesteDeCarte('bond@fer', 'ilka'), uid: 'b' },
        { ...gesteDeCarte('charge@fer', 'doran'), uid: 'c' },
      ];
      for (const uid of ['a', 'b', 'c']) ajouter(s, uid);
      const avant = JSON.stringify(s);
      const a = apercuChaine(s);
      expect(JSON.stringify(s)).toBe(avant);
      expect(a.degats).toBeGreaterThan(0);
      lancer(s);
      expect(999 - s.ennemi.pv).toBe(a.degats);
    }
  });

  it('sans chaîne, rien à annoncer', () => {
    const s = creerCombat({ porteurs: equipe(), ennemiId: 'remanent', rng: 2 });
    expect(apercuChaine(s).degats).toBe(0);
  });

  it('le chiffre affiché sur chaque carte est celui qui tombera (bonus et malus compris)', () => {
    for (const ennemiId of ['remanent', 'vigie']) {
      const s = creerCombat({ porteurs: equipe(), ennemiId, rng: 11 });
      s.ennemi.pv = s.ennemi.pvMax = 999;
      s.ennemi.bouclier = 0;
      s.ennemi.fissure = 0.4;
      s.main = [
        { ...gesteDeCarte('ruee@fer', 'ilka'), uid: 'a' },
        { ...gesteDeCarte('bond@fer', 'ilka'), uid: 'b' },
        { ...gesteDeCarte('charge@fer', 'doran'), uid: 'c' },
      ];
      ajouter(s, 'a');
      ajouter(s, 'b');
      // en main, la carte annonce ce qu'elle fera posée au bout de la chaîne
      const enMain = detailForce(s, 'c')!;
      expect(enMain.siPosee).toBe(true);
      ajouter(s, 'c');
      const poses = ['a', 'b', 'c'].map((u) => detailForce(s, u)!);
      expect(poses[2]!.total).toBe(enMain.total);
      // la Résonance (suite de 3) apparaît dans le détail
      expect(poses[0]!.lignes.some((l) => l.nom.startsWith('Résonance'))).toBe(true);
      const somme = poses.reduce((t, d) => t + d.total, 0);
      lancer(s);
      expect(999 - s.ennemi.pv).toBe(somme);
    }
  });

  it('une carte d’un Porteur à terre affiche son malus', () => {
    const s = creerCombat({ porteurs: equipe(), ennemiId: 'remanent', rng: 3 });
    s.porteurs.find((p) => p.id === 'ilka')!.pv = 0;
    s.main = [{ ...gesteDeCarte('ruee@fer', 'ilka'), uid: 'a' }];
    const d = detailForce(s, 'a')!;
    expect(d.lignes.some((l) => l.nom === 'Porteur à terre')).toBe(true);
    expect(d.total).toBeLessThan(d.base);
  });
});
