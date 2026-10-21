import { describe, expect, it } from 'vitest';
import { ajouter, allonger, capacite, creerCombat, lancer, placesLibres } from '../src/core/combat';
import { nouvelleExpedition, combatSuivant, cloturerCombat } from '../src/core/expedition';
import { analyserChaine, serieFinale } from '../src/core/regles';
import { DECK_DEPART, PORTEURS } from '../src/core/donnees';
import type { CombatEtat } from '../src/core/types';

const f = (...xs: number[]) => xs.map((x) => ({ f: x }));
const equipe = () => PORTEURS.slice(0, 3).map((p) => ({ id: p.id, pv: p.pvMax, pvMax: p.pvMax, aTerre: false }));

describe('Résonance et Écho', () => {
  it('pas de bonus sans suite', () => {
    expect(analyserChaine(f(3, 7, 1))).toMatchObject({ suite: 1, mult: 1, echo: false });
  });
  it('suite de 3 = +30 %', () => {
    expect(analyserChaine(f(3, 4, 5))).toMatchObject({ suite: 3, mult: 1.3 });
  });
  it('suite de 4 = +60 %, de 5 = +100 %', () => {
    expect(analyserChaine(f(2, 3, 4, 5)).mult).toBe(1.6);
    expect(analyserChaine(f(1, 2, 3, 4, 5)).mult).toBe(2);
  });
  it('l’ordre compte : 5, 4, 3 ne résonne pas', () => {
    expect(analyserChaine(f(5, 4, 3)).suite).toBe(1);
  });
  it('trois Fréquences identiques = Écho', () => {
    expect(analyserChaine(f(7, 7, 7)).echo).toBe(true);
  });
  it('série finale', () => {
    expect(serieFinale(f(1, 3, 4))).toBe(2);
  });
});

describe('Combat', () => {
  it('même graine, même combat', () => {
    const a = creerCombat({ porteurs: equipe(), ennemiId: 'remanent', rng: 42 });
    const b = creerCombat({ porteurs: equipe(), ennemiId: 'remanent', rng: 42 });
    expect(a.main.map((g) => g.uid)).toEqual(b.main.map((g) => g.uid));
  });

  it('main de 5 et chaîne de 3 au départ', () => {
    const s = creerCombat({ porteurs: equipe(), ennemiId: 'remanent', rng: 1 });
    expect(s.main).toHaveLength(5);
    expect(capacite(s)).toBe(3);
  });

  it('un Geste lourd refuse s’il ne reste qu’une place', () => {
    const s = creerCombat({ porteurs: equipe(), ennemiId: 'remanent', rng: 1 });
    const souffle = { porteur: 'vela', nom: 'Souffle', f: 8, type: 'atk' as const, v: 20, lourd: true, id: 'souffle', uid: 'x' };
    s.chaine = [s.main.pop()!, s.main.pop()!].map((g) => ({ ...g, lourd: false }));
    s.main.push(souffle);
    expect(placesLibres(s)).toBe(1);
    expect(ajouter(s, 'x').ok).toBe(false);
    s.flux = 1;
    expect(allonger(s).ok).toBe(true);
    expect(ajouter(s, 'x').ok).toBe(true);
  });

  it('un joueur au hasard termine toujours une expédition (pas de blocage)', () => {
    for (let seed = 1; seed <= 30; seed++) {
      let x = nouvelleExpedition({ porteurs: equipe(), deck: DECK_DEPART, strate: 1, rng: seed });
      let garde = 0;
      while (!x.terminee && garde++ < 500) {
        const s: CombatEtat = x.combat;
        if (s.issue !== 'en-cours') { x = cloturerCombat(x); if (!x.terminee) x = combatSuivant(x); continue; }
        for (const g of s.main.slice()) if (placesLibres(s) > 0) ajouter(s, g.uid);
        if (!s.chaine.length) throw new Error('main injouable');
        lancer(s);
      }
      expect(garde).toBeLessThan(500);
    }
  });
});
