import { describe, expect, it } from 'vitest';
import { ajouter, capacite, cibler, creerCombat, lancer } from '../src/core/combat';
import { PORTEURS } from '../src/core/donnees';
import { analyserChaine } from '../src/core/regles';
import type { CombatEtat, Effet, Geste, TypeGeste } from '../src/core/types';

const equipe = () => PORTEURS.slice(0, 3).map((p) => ({ id: p.id, pv: p.pvMax, pvMax: p.pvMax, aTerre: false }));

let n = 0;
/** Un Geste d'Ilka (Tech) sur mesure ; le Rémanent est Résonant, donc Tech a l'avantage (+15 %) */
const geste = (f: number, type: TypeGeste, v: number, effet?: Effet, porteur = 'doran'): Geste =>
  ({ id: 'test', uid: `t${n++}`, porteur, nom: 'Test', f, type, v, ...(effet ? { effet } : {}) });

/** Un combat contre le Rémanent affaibli (Résonant, sans trait : les effets se lisent sans Évanescent ni Blindé), main remplacée */
function combat(main: Geste[]): CombatEtat {
  const s = creerCombat({ porteurs: equipe(), ennemiId: 'remanent-faible', rng: 3 });
  s.main = main;
  return s;
}
const jouer = (s: CombatEtat) => {
  for (const g of s.main.slice()) ajouter(s, g.uid);
  lancer(s);
};

describe('Effets des Gestes', () => {
  it('Accord prolonge toujours la suite, au début comme au milieu', () => {
    expect(analyserChaine([{ f: 3 }, { f: 9, effet: { type: 'accord' } }, { f: 5 }]).suite).toBe(3);
    expect(analyserChaine([{ f: 1, effet: { type: 'accord' } }, { f: 6 }, { f: 7 }]).suite).toBe(3);
  });

  it('Perçant ignore le bouclier ennemi', () => {
    const a = combat([geste(5, 'atk', 10)]);
    const b = combat([geste(5, 'atk', 10, { type: 'percant' })]);
    a.ennemi.bouclier = b.ennemi.bouclier = 6;
    jouer(a); jouer(b);
    expect(a.ennemi.pvMax - a.ennemi.pv).toBe(4);
    expect(b.ennemi.pvMax - b.ennemi.pv).toBe(10);
  });

  it('Siphon soigne le Porteur qui a joué la carte, d’une part des dégâts', () => {
    const s = combat([geste(5, 'atk', 10, { type: 'siphon', part: 0.5 })]);
    const doran = s.porteurs.find((p) => p.id === 'doran')!;
    doran.pv = 20;
    s.porteurs.find((p) => p.id === 'vela')!.pv = 10;
    s.intention = { type: 'bouclier', v: 0 };
    jouer(s);
    expect(doran.pv).toBe(25);
  });

  it('Siphon : si celui qui a joué la carte est à terre, le plus blessé boit la vie', () => {
    const s = combat([geste(5, 'atk', 10, { type: 'siphon', part: 0.5 }, 'vela')]);
    const vela = s.porteurs.find((p) => p.id === 'vela')!;
    s.porteurs.find((p) => p.id === 'doran')!.pv = 10;
    s.intention = { type: 'bouclier', v: 0 };
    ajouter(s, s.main[0]!.uid);
    vela.pv = 0; vela.aTerre = true;
    lancer(s, { silencieux: true });
    expect(s.porteurs.find((p) => p.id === 'doran')!.pv).toBe(15);
  });

  it('un soin vise le plus blessé par défaut, et on peut changer sa cible', () => {
    const s = combat([geste(5, 'soin', 10)]);
    s.intention = { type: 'bouclier', v: 0 };
    s.porteurs.find((p) => p.id === 'doran')!.pv = 20;
    ajouter(s, s.main[0]!.uid);
    const g = s.chaine[0]!;
    expect(g.cible).toBe('doran');
    expect(cibler(s, g.uid).ok).toBe(true);
    expect(g.cible).not.toBe('doran');
    expect(cibler(s, g.uid, 'ilka').ok).toBe(true);
    s.porteurs.find((p) => p.id === 'ilka')!.pv = 20;
    lancer(s, { silencieux: true });
    expect(s.porteurs.find((p) => p.id === 'ilka')!.pv).toBe(30);
  });

  it('le soin proposé protège le Porteur visé par une grosse attaque annoncée', () => {
    const s = combat([geste(5, 'soin', 10)]);
    s.porteurs.find((p) => p.id === 'doran')!.pv = 20;
    const vela = s.porteurs.find((p) => p.id === 'vela')!;
    vela.pv = 14;
    s.intention = { type: 'atk', nom: 'Entaille', v: 12, cibleId: 'vela' };
    ajouter(s, s.main[0]!.uid);
    expect(s.chaine[0]!.cible).toBe('vela');
  });

  it('Surcharge remplit le Flux', () => {
    const s = combat([geste(5, 'atk', 5, { type: 'flux', v: 1 })]);
    jouer(s);
    expect(s.flux).toBe(1);
  });

  it('Désarmer affaiblit l’attaque annoncée', () => {
    const s = combat([geste(5, 'bouclier', 0, { type: 'desarmer', part: 0.5 })]);
    s.intention = { type: 'atk', nom: 'Griffe', v: 20, cibleId: 'doran' };
    const avant = s.porteurs[1]!.pv;
    jouer(s);
    // 20 → 10, puis +15 % car le Rémanent (Résonant) bat Doran (Géné)
    expect(avant - s.porteurs[1]!.pv).toBe(12);
  });

  it('Fissure augmente les dégâts ce tour-ci et le suivant, pas après', () => {
    const s = combat([geste(1, 'atk', 10, { type: 'fissure', part: 0.5 }), geste(2, 'atk', 10)]);
    s.intention = { type: 'bouclier', v: 0 };
    jouer(s);
    // 10 (la Fissure s'applique après son propre coup) + 15
    expect(s.ennemi.pvMax - s.ennemi.pv).toBe(25);
    expect(s.ennemi.fissure).toBe(0.5);
    s.main = [geste(5, 'atk', 10)]; s.intention = { type: 'bouclier', v: 0 }; s.ennemi.bouclier = 0;
    jouer(s);
    expect(s.ennemi.pvMax - s.ennemi.pv).toBe(40);
    expect(s.ennemi.fissure).toBe(0);
  });

  it('Élan donne une place de plus au tour suivant seulement', () => {
    const s = combat([geste(5, 'bouclier', 3, { type: 'elan' })]);
    jouer(s);
    expect(capacite(s)).toBe(4);
    s.main = [geste(5, 'bouclier', 3)];
    jouer(s);
    expect(capacite(s)).toBe(3);
  });

  it('Crescendo frappe plus fort en fin de chaîne', () => {
    const s = combat([geste(1, 'bouclier', 1), geste(5, 'bouclier', 1), geste(9, 'atk', 10, { type: 'crescendo', part: 0.25 })]);
    s.intention = { type: 'bouclier', v: 0 };
    jouer(s);
    expect(s.ennemi.pvMax - s.ennemi.pv).toBe(15);
  });

  it('Vague soigne toute l’escouade', () => {
    const s = combat([geste(5, 'soin', 5, { type: 'vague' })]);
    for (const p of s.porteurs) p.pv = 10;
    s.intention = { type: 'bouclier', v: 0 };
    jouer(s);
    expect(s.porteurs.map((p) => p.pv)).toEqual([15, 15, 15]);
  });

  it('Rempart garde une part du bouclier restant', () => {
    const s = combat([geste(5, 'bouclier', 20, { type: 'rempart', part: 0.5 })]);
    s.intention = { type: 'atk', nom: 'Griffe', v: 4, cibleId: 'doran' };
    jouer(s);
    expect(s.bouclier).toBe(8);
  });
});
