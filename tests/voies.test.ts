import { describe, expect, it } from 'vitest';
import { ajouter, creerCombat, lancer } from '../src/core/combat';
import { MODULES, PORTEURS, VOIES, porteurDef } from '../src/core/donnees';
import { analyserChaine, frequencesEffectives } from '../src/core/regles';
import type { CombatEtat, Effet, Geste, TypeGeste } from '../src/core/types';

// Les voies, étape 1 (27 octobre 2026) : Riposte (Carapace), Décharge (Moteur), Diapason et Unisson (Chœur)

const equipe = () => PORTEURS.slice(0, 3).map((p) => ({ id: p.id, pv: p.pvMax, pvMax: p.pvMax, aTerre: false }));

let n = 0;
/** Un Geste de Doran (Géné) sur mesure : contre le Rémanent affaibli (Résonant), pas d'avantage de lignée */
const geste = (f: number, type: TypeGeste, v: number, effet?: Effet): Geste =>
  ({ id: 'test', uid: `v${n++}`, porteur: 'doran', nom: 'Test', f, type, v, ...(effet ? { effet } : {}) });

function combat(main: Geste[]): CombatEtat {
  const s = creerCombat({ porteurs: equipe(), ennemiId: 'remanent-faible', rng: 3 });
  s.main = main;
  // pas de Fêlure : elle changerait l'intention, pas les dégâts, mais on garde le test lisible
  delete s.ennemi.felure;
  return s;
}
const jouer = (s: CombatEtat) => {
  for (const g of s.main.slice()) ajouter(s, g.uid);
  lancer(s, { silencieux: true });
};
const degats = (s: CombatEtat) => s.ennemi.pvMax - s.ennemi.pv;

describe('Les voies : étape 1', () => {
  it('Riposte : après son bouclier, elle frappe d’une part du bouclier d’escouade, sans le dépenser', () => {
    const s = combat([geste(2, 'bouclier', 10), geste(6, 'bouclier', 10, { type: 'riposte', part: 0.5 })]);
    s.bouclier = 10;
    s.intention = { type: 'bouclier', v: 0 };
    jouer(s);
    // 10 au départ + 10 + ses 10 : elle frappe de 50 % de 30
    expect(degats(s)).toBe(15);
  });

  it('Riposte ne profite pas des boucliers posés après elle', () => {
    const s = combat([geste(6, 'bouclier', 10, { type: 'riposte', part: 0.5 }), geste(2, 'bouclier', 10)]);
    s.intention = { type: 'bouclier', v: 0 };
    jouer(s);
    expect(degats(s)).toBe(5);
  });

  it('Décharge vide le Flux et gagne une part de force par Flux vidé', () => {
    const s = combat([geste(5, 'atk', 10, { type: 'decharge', part: 0.3 })]);
    s.flux = 3;
    s.intention = { type: 'bouclier', v: 0 };
    jouer(s);
    expect(degats(s)).toBe(19);
    expect(s.flux).toBe(0);
  });

  it('Décharge sans Flux frappe normalement', () => {
    const s = combat([geste(5, 'atk', 10, { type: 'decharge', part: 0.3 })]);
    s.intention = { type: 'bouclier', v: 0 };
    jouer(s);
    expect(degats(s)).toBe(10);
  });

  it('Diapason reprend la Fréquence d’avant, ou celle d’après en tête de chaîne', () => {
    expect(frequencesEffectives([{ f: 7 }, { f: 1, effet: { type: 'diapason' } }])).toEqual([7, 7]);
    expect(frequencesEffectives([{ f: 1, effet: { type: 'diapason' } }, { f: 4 }])).toEqual([4, 4]);
    // il complète un Écho, il ne prolonge pas une suite
    expect(analyserChaine([{ f: 9 }, { f: 9 }, { f: 2, effet: { type: 'diapason' } }]).echo).toBe(true);
    expect(analyserChaine([{ f: 5 }, { f: 6 }, { f: 2, effet: { type: 'diapason' } }]).suite).toBe(2);
  });

  it('Unisson compte chaque autre carte de la même Fréquence, Diapason compris', () => {
    const s = combat([geste(9, 'atk', 10, { type: 'unisson', part: 0.6 }), geste(9, 'bouclier', 5), geste(1, 'bouclier', 5, { type: 'diapason' })]);
    s.intention = { type: 'bouclier', v: 0 };
    jouer(s);
    expect(degats(s)).toBe(22);
  });

  it('La Dissonance brouille les suites, pas l’Unisson ni l’Écho', () => {
    const s = combat([geste(9, 'atk', 10, { type: 'unisson', part: 0.3 }), geste(9, 'bouclier', 5), geste(9, 'bouclier', 5)]);
    s.dissonance = true;
    s.intention = { type: 'bouclier', v: 0 };
    const flux = s.flux;
    jouer(s);
    expect(degats(s)).toBe(16);
    expect(s.flux).toBe(flux + 1);
  });

  it('Chaque voie de l’étape 1 a ses cartes, dans sa lignée et sa plage de Fréquences', () => {
    const voie = (t: string) => MODULES.filter((m) => m.effet?.type === t);
    expect(voie('riposte').every((m) => m.lignee === 'bio' && m.f.every((f) => f <= 5))).toBe(true);
    expect(voie('decharge').every((m) => m.lignee === 'tech' && m.f.every((f) => f >= 2 && f <= 7))).toBe(true);
    expect([...voie('diapason'), ...voie('unisson')].every((m) => m.lignee === 'reso' && m.f.every((f) => f >= 6))).toBe(true);
    expect(voie('riposte').length + voie('decharge').length + voie('diapason').length + voie('unisson').length).toBe(12);
    // chaque carte de voie existe et appartient à la lignée du Porteur de sa voie
    for (const v of VOIES) for (const id of v.cartes) expect(MODULES.find((m) => m.id === id)?.lignee, id).toBe(porteurDef(v.porteur).lignee);
  });
});
