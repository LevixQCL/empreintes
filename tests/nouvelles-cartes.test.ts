import { describe, expect, it } from 'vitest';
import { ajouter, creerCombat, lancer, placesLibres, placesPrises } from '../src/core/combat';
import { EXCLUSIVES, MODULES_TIRABLES, VOIES, moduleDef } from '../src/core/donnees';
import { placesChaine } from '../src/core/regles';
import type { CombatEtat, Effet, Geste, TypeGeste } from '../src/core/types';

// Les nouvelles cartes (4 novembre 2026, docs/nouvelles-cartes.md) : Servo, Contrepoint, Exécution, Ténacité

const equipe = () => [
  { id: 'ilka', pv: 38, pvMax: 38, aTerre: false },
  { id: 'doran', pv: 46, pvMax: 46, aTerre: false },
  { id: 'vela', pv: 31, pvMax: 31, aTerre: false },
];
let n = 0;
const geste = (porteur: string, f: number, type: TypeGeste, v: number, effet?: Effet, lourd = false): Geste =>
  ({ id: 'test', uid: `n${n++}`, porteur, nom: 'Test', f, type, v, ...(effet ? { effet } : {}), ...(lourd ? { lourd: true } : {}) });

function combat(main: Geste[]): CombatEtat {
  const s = creerCombat({ porteurs: equipe(), ennemiId: 'remanent-faible', rng: 3 });
  s.main = main;
  delete s.ennemi.felure;
  s.intention = { type: 'bouclier', v: 0 };
  return s;
}
const poser = (s: CombatEtat) => { for (const g of s.main.slice()) ajouter(s, g.uid); };

describe('Les nouvelles cartes', () => {
  it('une centaine de cartes à trouver', () => {
    expect(MODULES_TIRABLES.length).toBeGreaterThanOrEqual(100);
    expect(VOIES.map((v) => v.id)).toEqual(expect.arrayContaining(['machines', 'harmonie']));
    expect(EXCLUSIVES.filter((m) => m.rarete === 'nacre').map((m) => m.lignee).sort()).toEqual(['bio', 'bio', 'reso', 'reso', 'tech', 'tech']);
  });

  it('Servo : une carte lourde ne prend qu’une place, un Servo par carte lourde', () => {
    const servo = { type: 'servo' } as const;
    expect(placesChaine([{ lourd: true }, { effet: servo }])).toBe(2);
    expect(placesChaine([{ lourd: true }, { lourd: true }, { effet: servo }])).toBe(4);
    expect(placesChaine([{ effet: servo }, { effet: servo }])).toBe(2);
    // en combat : 3 places ; lourde + Servo + une carte de plus tiennent
    const s = combat([geste('ilka', 5, 'atk', 20, undefined, true), geste('ilka', 4, 'bouclier', 8, servo), geste('doran', 3, 'atk', 5)]);
    poser(s);
    expect(s.chaine.length).toBe(3);
    expect(placesPrises(s)).toBe(3);
    // sans Servo, la dernière carte ne rentre pas
    const t = combat([geste('ilka', 5, 'atk', 20, undefined, true), geste('ilka', 4, 'bouclier', 8), geste('doran', 3, 'atk', 5)]);
    poser(t);
    expect(t.chaine.length).toBe(2);
    expect(placesLibres(t)).toBe(0);
  });

  it('Contrepoint : +part par autre lignée de la suite qui résonne', () => {
    const cp = { type: 'contrepoint', part: 0.2 } as const;
    // suite 5 (Ilka) → 6 (Véla, Contrepoint) → 7 (Doran) : deux autres lignées
    const trois = combat([geste('ilka', 5, 'atk', 0), geste('vela', 6, 'atk', 10, cp), geste('doran', 7, 'atk', 0)]);
    poser(trois);
    lancer(trois, { silencieux: true });
    const mixte = trois.ennemi.pvMax - trois.ennemi.pv;
    // la même suite d'une seule lignée : pas de bonus de Contrepoint
    const seule = combat([geste('vela', 5, 'atk', 0), geste('vela', 6, 'atk', 10, cp), geste('vela', 7, 'atk', 0)]);
    poser(seule);
    lancer(seule, { silencieux: true });
    const mono = seule.ennemi.pvMax - seule.ennemi.pv;
    expect(mixte).toBeGreaterThan(mono);
    // hors suite : rien
    const rien = combat([geste('ilka', 2, 'atk', 0), geste('vela', 6, 'atk', 10, cp), geste('doran', 9, 'atk', 0)]);
    poser(rien);
    lancer(rien, { silencieux: true });
    expect(rien.ennemi.pvMax - rien.ennemi.pv).toBe(10);
  });

  it('Exécution : achève sous le seuil, jamais un gardien', () => {
    const s = combat([geste('ilka', 5, 'atk', 5, { type: 'execution', part: 0.2 })]);
    s.ennemi.pv = Math.round(s.ennemi.pvMax * 0.2) + 4;
    poser(s);
    lancer(s, { silencieux: true });
    expect(s.ennemi.pv).toBe(0);
    // au-dessus du seuil après le coup : il reste debout
    const t = combat([geste('ilka', 5, 'atk', 5, { type: 'execution', part: 0.2 })]);
    poser(t);
    lancer(t, { silencieux: true });
    expect(t.ennemi.pv).toBeGreaterThan(0);
  });

  it('Ténacité : au tour ennemi, un coup fatal laisse le Porteur à 1 PV', () => {
    const coup = { type: 'atk', nom: 'Griffe', v: 999, cibleId: 'vela' } as const;
    const s = combat([geste('doran', 2, 'bouclier', 0, { type: 'tenacite' })]);
    s.intention = { ...coup };
    poser(s);
    lancer(s, { silencieux: true });
    expect(s.porteurs.find((p) => p.id === 'vela')!.pv).toBe(1);
    // sans Ténacité, elle tombe
    const t = combat([geste('doran', 2, 'bouclier', 0)]);
    t.intention = { ...coup };
    poser(t);
    lancer(t, { silencieux: true });
    expect(t.porteurs.find((p) => p.id === 'vela')!.pv).toBe(0);
  });

  it('les nouvelles cartes ont leur effet dès le cuivre, et rien en fer', () => {
    expect(moduleDef('servo-bras@fer').effet).toBeUndefined();
    expect(moduleDef('servo-bras@cuivre').effet).toEqual({ type: 'servo' });
    expect(moduleDef('nuee-chorale@nacre').effet).toEqual({ type: 'contrepoint', part: 0.45 });
  });
});
