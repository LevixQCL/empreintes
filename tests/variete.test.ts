// Varier les combats (décision du 22 octobre 2026) : traits des ennemis, conditions de salle, gardiens à deux phases.
import { describe, expect, it } from 'vitest';
import { FURIE, ajouter, creerCombat, eboulis, ennemisDebout, intentionDe, lancer, puissance, tousEnnemis, usureCombat } from '../src/core/combat';
import { CONDITIONS, ennemiDef, porteurDef } from '../src/core/donnees';
import { conditionDe, genererCarte } from '../src/core/expedition';
import { REGLES } from '../src/core/regles';
import type { CombatEtat, Effet, Geste, TypeGeste } from '../src/core/types';

const equipe = () => ['ilka', 'doran', 'vela'].map((id) => ({ id, pv: porteurDef(id).pvMax, pvMax: porteurDef(id).pvMax, aTerre: false }));
let n = 0;
const geste = (f: number, type: TypeGeste, v: number, effet?: Effet, porteur = 'doran'): Geste =>
  ({ id: 'test', uid: `v${n++}`, porteur, nom: 'Test', f, type, v, ...(effet ? { effet } : {}) });
function combat(ennemiId: string, main: Geste[], o: { condition?: string; escorte?: string[] } = {}): CombatEtat {
  const s = creerCombat({ porteurs: equipe(), ennemiId, rng: 3, ...o });
  s.main = main;
  for (const e of tousEnnemis(s)) { e.bouclier = 0; }
  s.intention = { type: 'bouclier', v: 0 };
  return s;
}
const jouer = (s: CombatEtat) => { for (const g of s.main.slice()) ajouter(s, g.uid); return lancer(s); };
const perdu = (s: CombatEtat, avant: number) => avant - s.ennemi.pv;

describe('Les traits des ennemis', () => {
  it('Blindé : chaque coup perd quelques points ; Perçant passe outre', () => {
    // Vigie (Tech) contre une carte de Doran (Géné : avantage)
    const a = combat('vigie', [geste(1, 'atk', 20)]);
    const pv = a.ennemi.pv;
    jouer(a);
    const b = combat('vigie', [geste(1, 'atk', 20, { type: 'percant' })]);
    jouer(b);
    expect(perdu(b, pv) - perdu(a, pv)).toBe(2);
  });

  it('Évanescent : hors Résonance, il ne prend qu’une part des coups', () => {
    const a = combat('remanent', [geste(1, 'atk', 20)]);
    const pv = a.ennemi.pv;
    jouer(a);
    const t = combat('remanent-faible', [geste(1, 'atk', 20)]);
    jouer(t);
    expect(perdu(a, pv)).toBe(Math.round(perdu(t, t.ennemi.pvMax) * 0.75));
  });

  it('Épines : le Porteur qui frappe se blesse, sans jamais tomber', () => {
    const s = combat('sentinelle-verre', [geste(1, 'atk', 40, undefined, 'ilka')]);
    s.porteurs.find((p) => p.id === 'ilka')!.pv = 2;
    const pas = jouer(s);
    expect(pas.some((p) => p.ev.kind === 'degats' && p.ev.source === 'epines')).toBe(true);
    expect(s.porteurs.find((p) => p.id === 'ilka')!.pv).toBeGreaterThanOrEqual(1);
  });

  it('Régénération : il regagne des PV à la fin de son tour', () => {
    const s = combat('rampeur', [geste(1, 'bouclier', 5)]);
    s.ennemi.pv = 40;
    jouer(s);
    expect(s.ennemi.pv).toBeGreaterThan(40);
  });

  it('Essaim : quand il tombe, un rejeton surgit, une seule fois', () => {
    const s = combat('essaim-ambre', [geste(1, 'atk', 999)]);
    const pas = jouer(s);
    expect(pas.some((p) => p.ev.kind === 'renfort')).toBe(true);
    expect(s.issue).toBe('en-cours');
    const rejeton = ennemisDebout(s)[0]!;
    expect(rejeton.rejeton).toBe(true);
    expect(rejeton.pvMax).toBeLessThan(ennemiDef('essaim-ambre').pvMax);
    s.main = [geste(1, 'atk', 999)];
    jouer(s);
    expect(s.issue).toBe('victoire');
  });

  it('Vengeur : quand un allié tombe, sa prochaine attaque est doublée', () => {
    const s = combat('rampeur', [geste(1, 'atk', 999)], { escorte: ['pilleur'] });
    jouer(s);
    const pilleur = tousEnnemis(s).find((e) => e.id === 'pilleur')!;
    expect(pilleur.boost).toBe(2);
  });

  it('Furie : sous la moitié de ses PV, il frappe 30 % plus fort', () => {
    const s = combat('brigadier', []);
    expect(puissance(s.ennemi)).toBe(1);
    s.ennemi.pv = Math.floor(s.ennemi.pvMax / 2);
    expect(puissance(s.ennemi)).toBe(FURIE);
  });

  it('dans la Strate −1, les ennemis jouent sans leurs traits', () => {
    const s = creerCombat({ porteurs: equipe(), ennemiId: 'vigie', rng: 3, traits: false });
    expect(s.ennemi.simple).toBe(true);
  });
});

describe('Les gardiens à deux phases', () => {
  it('sous la moitié de ses PV, le gardien change de gestes et appelle un renfort', () => {
    const s = combat('confluence', [geste(1, 'atk', 1)]);
    s.ennemi.pv = Math.floor(s.ennemi.pvMax * 0.5) + 1;
    const pas = jouer(s);
    expect(pas.some((p) => p.ev.kind === 'phase')).toBe(true);
    expect(tousEnnemis(s).some((e) => e.id === 'rampeur' && e.rejeton)).toBe(true);
    const gardien = tousEnnemis(s).find((e) => e.id === 'confluence')!;
    expect(gardien.phase2).toBe(true);
    const noms = ennemiDef('confluence').phase!.motif.map((m) => ('nom' in m ? m.nom : m.type));
    const it = intentionDe(s, gardien);
    expect(noms).toContain('nom' in it ? it.nom : it.type);
  });
});

describe('Les conditions de salle', () => {
  it('une salle favorise une lignée : +20 % à ses cartes', () => {
    const a = combat('remanent-faible', [geste(1, 'atk', 20)]);
    jouer(a);
    const b = combat('remanent-faible', [geste(1, 'atk', 20)], { condition: 'inondee' });
    jouer(b);
    expect(b.ennemi.pvMax - b.ennemi.pv).toBe(Math.round((a.ennemi.pvMax - a.ennemi.pv) * 1.2));
  });

  it('Écho ancien : une suite de 4 résonne comme une suite de 5', () => {
    const s = combat('remanent-faible', [3, 4, 5, 6].map((f) => geste(f, 'atk', 5)), { condition: 'echo' });
    s.capaBonus = 1;
    const pas = jouer(s);
    const r = pas.find((p) => p.ev.kind === 'resonance')!.ev as { mult: number };
    expect(r.mult).toBe(REGLES.multSuite[5]);
  });

  it('Éboulis : tout le monde perd des PV, personne ne tombe', () => {
    const s = combat('remanent-faible', [geste(1, 'bouclier', 1)], { condition: 'eboulis' });
    s.porteurs[0]!.pv = 1;
    const pv = s.porteurs[1]!.pv;
    jouer(s);
    expect(s.porteurs[0]!.pv).toBe(1);
    expect(s.porteurs[1]!.pv).toBeLessThanOrEqual(pv - eboulis(s) + 0);
  });

  it('les conditions apparaissent à partir de la Strate −2, plus souvent chez le gardien', () => {
    expect(genererCarte(1, 3).salles.some((x) => x.condition)).toBe(false);
    let k = 0;
    for (let r = 0; r < 20; r++) k += genererCarte(4, r).salles.filter((x) => x.condition).length;
    expect(k).toBeGreaterThan(10);
    for (let id = 0; id < 50; id++) { const c = conditionDe(5, 9, id, 'combat'); if (c) expect(CONDITIONS[c]).toBeTruthy(); }
  });
});

describe('Un combat ne tourne jamais en rond', () => {
  it('au tour 20, les ennemis ne se soignent plus ; après le tour 25, ils frappent de plus en plus fort', () => {
    const s = combat('remanent-faible', []);
    s.tour = 20;
    expect(usureCombat(s).soins).toBe(0);
    s.tour = 30;
    expect(usureCombat(s).attaque).toBeGreaterThan(1);
  });
});
