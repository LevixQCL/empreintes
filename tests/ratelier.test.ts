import { describe, expect, it } from 'vitest';
import { ajouter, creerCombat, lancer } from '../src/core/combat';
import { CARTES_COMMUNES, PORTEURS, communeDef, forceCommune } from '../src/core/donnees';
import { basculerRatelier, choisirRatelier, coutRatelier, deckEscouade, gestesCommuns, nouveauJeu, placesRatelier, ratelierDe, ratelierPayable } from '../src/core/jeu';
import type { CombatEtat, Effet, Geste, TypeGeste } from '../src/core/types';

// Le Râtelier du district (30 octobre 2026) : les cartes communes, leur bâtiment, leurs emplacements, leur énergie

describe('Le Râtelier du district', () => {
  it('une partie neuve descend avec le Stimulant et le Pavois, comme avant', () => {
    const j = nouveauJeu(0);
    expect(ratelierDe(j)).toEqual(['stimulant', 'repli']);
    expect(deckEscouade(j, ['ilka', 'doran', 'vela']).filter((g) => g.porteur === null).map((g) => g.id)).toEqual(['stimulant', 'repli']);
    expect(coutRatelier(j)).toBe(0);
  });

  it('chaque carte commune vient d’un bâtiment, sans effet de lignée', () => {
    const interdits = ['percant', 'flux', 'elan', 'rempart', 'desarmer', 'fissure', 'lecture', 'accord', 'diapason'];
    for (const c of CARTES_COMMUNES) {
      expect(c.geste.porteur).toBeNull();
      expect(c.texte.length).toBeGreaterThan(10);
      expect(interdits.includes(c.geste.effet?.type ?? '')).toBe(false);
    }
  });

  it('une carte ne s’ouvre qu’au niveau de son bâtiment', () => {
    const j = nouveauJeu(0);
    expect(choisirRatelier(j, ['lame-atelier']).ok).toBe(false);
    j.batiments.forge = 2;
    expect(choisirRatelier(j, ['lame-atelier', 'stimulant']).ok).toBe(true);
    expect(ratelierDe(j)).toEqual(['lame-atelier', 'stimulant']);
  });

  it('2 emplacements, 3 au niveau 5 de la Tour, 4 au niveau 9', () => {
    const j = nouveauJeu(0);
    expect(placesRatelier(j)).toBe(2);
    j.batiments.noyau = 5;
    expect(placesRatelier(j)).toBe(3);
    j.batiments.noyau = 9;
    expect(placesRatelier(j)).toBe(4);
    j.batiments.noyau = 1;
    j.batiments.forge = 2;
    expect(basculerRatelier(j, 'lame-atelier').ok).toBe(false); // plein
    expect(basculerRatelier(j, 'repli').ok).toBe(true);
    expect(basculerRatelier(j, 'lame-atelier').ok).toBe(true);
  });

  it('les cartes au-delà de la 2e coûtent de l’énergie au départ ; sans énergie, elles restent au district', () => {
    const j = nouveauJeu(0);
    j.batiments.noyau = 9;
    j.batiments.forge = 2;
    j.batiments.clinique = 7;
    expect(choisirRatelier(j, ['stimulant', 'repli', 'lame-atelier', 'ampoule-releve']).ok).toBe(true);
    j.energie = 1000;
    expect(coutRatelier(j)).toBe(450);
    expect(ratelierPayable(j)).toHaveLength(4);
    j.energie = 200;
    expect(ratelierPayable(j)).toEqual(['stimulant', 'repli', 'lame-atelier']);
    expect(gestesCommuns(j)).toHaveLength(3);
    j.energie = 0;
    expect(ratelierPayable(j)).toEqual(['stimulant', 'repli']);
  });

  it('jamais pendant une descente', () => {
    const j = nouveauJeu(0);
    j.expedition = {} as typeof j.expedition;
    expect(choisirRatelier(j, ['stimulant']).ok).toBe(false);
  });

  it('la force monte avec le bâtiment (+6 % par niveau), jamais l’effet', () => {
    const pavois = communeDef('repli')!;
    expect(forceCommune(pavois, 1)).toBe(10);
    expect(forceCommune(pavois, 10)).toBe(15);
    const j = nouveauJeu(0);
    j.batiments.noyau = 10;
    expect(gestesCommuns(j).find((g) => g.id === 'repli')!.v).toBe(15);
  });
});

// ---------- Les effets des cartes communes ----------

const equipe = () => PORTEURS.slice(0, 3).map((p) => ({ id: p.id, pv: p.pvMax, pvMax: p.pvMax, aTerre: false }));
let n = 0;
const geste = (f: number, type: TypeGeste, v: number, effet?: Effet, unique?: boolean): Geste =>
  ({ id: 'test', uid: `r${n++}`, porteur: null, nom: 'Test', f, type, v, ...(effet ? { effet } : {}), ...(unique ? { unique } : {}) });
function combat(main: Geste[]): CombatEtat {
  const s = creerCombat({ porteurs: equipe(), ennemiId: 'remanent-faible', rng: 3 });
  s.main = main;
  delete s.ennemi.felure;
  s.intention = { type: 'bouclier', v: 0 };
  return s;
}
const jouer = (s: CombatEtat) => {
  for (const g of s.main.slice()) ajouter(s, g.uid);
  lancer(s, { silencieux: true });
};

describe('Les effets des cartes communes', () => {
  it('Brèche brise le bouclier de l’ennemi avant de frapper', () => {
    const s = combat([geste(8, 'atk', 5, { type: 'breche' })]);
    s.ennemi.bouclier = 20;
    jouer(s);
    expect(s.ennemi.pvMax - s.ennemi.pv).toBeGreaterThan(0);
  });

  it('Plan des galeries : une carte de plus dans la main suivante', () => {
    const s = combat([geste(5, 'bouclier', 4, { type: 'pioche' })]);
    jouer(s);
    expect(s.main.length).toBe(6);
  });

  it('Groupe de secours frappe plus fort pour chaque Porteur à terre', () => {
    const a = combat([geste(7, 'atk', 6, { type: 'secours', part: 0.6 })]);
    jouer(a);
    const b = combat([geste(7, 'atk', 6, { type: 'secours', part: 0.6 })]);
    b.porteurs[0]!.pv = 0; b.porteurs[0]!.aTerre = true;
    jouer(b);
    expect(b.ennemi.pvMax - b.ennemi.pv).toBeGreaterThan(a.ennemi.pvMax - a.ennemi.pv);
  });

  it('Ampoule de relève : une seule fois par combat, elle quitte le combat après avoir relevé', () => {
    const amp = geste(6, 'soin', 8, { type: 'releve' }, true);
    const s = combat([amp]);
    const vela = s.porteurs.find((p) => p.id === 'vela')!;
    vela.pv = 0; vela.aTerre = true;
    jouer(s);
    expect(vela.pv).toBe(8);
    expect([...s.pioche, ...s.main, ...s.defausse].some((g) => g.uid === amp.uid)).toBe(false);
  });
});
