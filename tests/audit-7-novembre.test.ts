import { describe, expect, it } from 'vitest';
import { ajouter, creerCombat, lancer, mainBloquee, tousEnnemis } from '../src/core/combat';
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

  const de = (l: string) => PORTEURS.slice(0, 3).find((p) => p.lignee === l)!.id;
  const degatsDe = (pv: number) => {
    const s = creerCombat({ porteurs: equipe(), ennemiId: 'pilleur', rng: 7 });
    s.ennemi.pv = s.ennemi.pvMax = 9999;
    const tech = s.porteurs.find((p) => p.id === de('tech'))!;
    tech.pv = pv;
    s.main = [{ ...gesteDeCarte('coeur-surregime@or', tech.id), uid: 'c' }];
    ajouter(s, 'c'); lancer(s);
    return { degats: 9999 - s.ennemi.pv, pv: tech.pv };
  };

  it('la Surtension à 1 PV ne coûte rien et ne donne rien', () => {
    const plein = degatsDe(60), a1 = degatsDe(1);
    expect(a1.degats).toBeLessThan(plein.degats);
  });

  it('la Ténacité ne dure que le tour ennemi', () => {
    const s = creerCombat({ porteurs: equipe(), ennemiId: 'pilleur', rng: 7 });
    s.ennemi.pv = s.ennemi.pvMax = 9999;
    s.main = [{ ...gesteDeCarte('racines-meres@nacre', de('bio')), uid: 'r' }];
    ajouter(s, 'r'); lancer(s);
    expect(s.tenace).toBeFalsy();
  });

  it('le Rappel ne renvoie pas une carte à usage unique déjà utilisée', () => {
    const s = creerCombat({ porteurs: equipe(), ennemiId: 'pilleur', rng: 7 });
    s.ennemi.pv = s.ennemi.pvMax = 9999;
    const forte = { ...gesteDeCarte('coeur-surregime@or', de('tech')), uid: 'u', v: 999 };
    s.main = [{ ...gesteDeCarte('boucle-memoire@argent', de('reso')), uid: 'r' }, forte];
    ajouter(s, 'r'); ajouter(s, 'u');
    forte.epuise = true;
    lancer(s);
    expect(s.pioche.includes(forte)).toBe(false);
    expect(s.main.includes(forte)).toBe(false);
  });

  it('une main faite de places vides permet de passer le tour', () => {
    const s = creerCombat({ porteurs: equipe(), ennemiId: 'pilleur', rng: 7 });
    s.main = s.main.map((g, i) => ({ ...g, uid: `v${i}`, vide: true, id: 'vide', v: 0 }));
    expect(mainBloquee(s)).toBe(true);
    const tour = s.tour;
    lancer(s);
    expect(s.tour).toBe(tour + 1);
    expect(s.main.some((g) => !g.vide)).toBe(true);
  });
});
