import { describe, expect, it } from 'vitest';
import { ajouter, creerCombat, eclater, eclatsPossibles, estGardien, lancer } from '../src/core/combat';
import { PORTEURS, gesteDeCarte } from '../src/core/donnees';
import type { CombatEtat } from '../src/core/types';

const equipe = () => PORTEURS.slice(0, 3).map((p) => ({ id: p.id, pv: p.pvMax, pvMax: p.pvMax, aTerre: false }));

/** Un combat où l'ennemi annonce une attaque de 20 sur Ilka, et une main d'une seule carte (Bond, Fréquence 4) */
function preparer(ennemiId: string, felure: number): CombatEtat {
  const s = creerCombat({ porteurs: equipe(), ennemiId, rng: 7 });
  s.ennemi.pv = s.ennemi.pvMax = 999;
  s.intention = { type: 'atk', nom: 'Coup', v: 20, cibleId: 'ilka' };
  s.ennemi.felure = felure;
  s.main = [{ ...gesteDeCarte('bond@fer', 'ilka'), uid: 'a' }];
  s.flux = 0;
  return s;
}
const pvIlka = (s: CombatEtat) => s.porteurs.find((p) => p.id === 'ilka')!.pv;

describe('La Fêlure', () => {
  it('chaque ennemi montre une Fréquence fêlée dès le début du combat', () => {
    const s = creerCombat({ porteurs: equipe(), ennemiId: 'remanent', rng: 3 });
    expect(s.ennemi.felure).toBeGreaterThanOrEqual(1);
    expect(s.ennemi.felure).toBeLessThanOrEqual(9);
  });

  it('une carte de la Fréquence fêlée divise l’attaque par deux et remplit le Flux', () => {
    const brise = preparer('remanent', 4);
    const rate = preparer('remanent', 9);
    const avant = pvIlka(brise);
    ajouter(brise, 'a'); lancer(brise);
    ajouter(rate, 'a'); lancer(rate);
    expect(brise.journal.some((l) => l.startsWith('Fêlure'))).toBe(true);
    expect(brise.flux).toBe(1);
    expect(rate.flux).toBe(0);
    expect(avant - pvIlka(brise)).toBeLessThan(avant - pvIlka(rate));
  });

  it('un gardien résiste mieux : un quart seulement', () => {
    expect(estGardien('confluence')).toBe(true);
    expect(estGardien('remanent')).toBe(false);
    const s = preparer('confluence', 4);
    ajouter(s, 'a'); lancer(s);
    expect(s.journal.find((l) => l.startsWith('Fêlure'))).toContain('de 20 à 15');
  });

  it('pas de Fêlure à la Strate −1 (ennemis simples)', () => {
    const s = creerCombat({ porteurs: equipe(), ennemiId: 'remanent', rng: 3, traits: false });
    expect(s.ennemi.felure).toBeUndefined();
  });
});

describe('Les Coups d’éclat', () => {
  const plein = (s: CombatEtat) => { s.flux = 3; return s; };

  it('il faut le Flux plein, et un seul par combat', () => {
    const s = preparer('remanent', 9);
    expect(eclatsPossibles(s)).toHaveLength(0);
    plein(s);
    const choix = eclatsPossibles(s);
    expect(new Set(choix.map((c) => c.lignee)).size).toBe(choix.length);
    eclater(s, choix[0]!.porteur);
    expect(s.flux).toBe(0);
    plein(s);
    expect(eclatsPossibles(s)).toHaveLength(0);
    expect(s.porteurs.find((p) => p.id === choix[0]!.porteur)!.usureEclat).toBe(3);
  });

  it('Débridage : la chaîne frappe deux fois plus fort', () => {
    const normal = preparer('remanent', 9), debride = plein(preparer('remanent', 9));
    eclater(debride, eclatsPossibles(debride).find((c) => c.lignee === 'tech')!.porteur);
    ajouter(normal, 'a'); lancer(normal);
    ajouter(debride, 'a'); lancer(debride);
    expect(999 - debride.ennemi.pv).toBe(2 * (999 - normal.ennemi.pv));
  });

  it('Ombre agissante : aucune attaque ne porte au tour ennemi suivant', () => {
    const s = plein(preparer('remanent', 9));
    const avant = pvIlka(s);
    eclater(s, eclatsPossibles(s).find((c) => c.lignee === 'reso')!.porteur);
    ajouter(s, 'a'); lancer(s);
    expect(pvIlka(s)).toBe(avant);
    expect(s.ombre).toBe(false);
  });

  it('Sursaut : soigne l’escouade et relève un Porteur à terre', () => {
    const s = plein(preparer('remanent', 9));
    const bio = eclatsPossibles(s).find((c) => c.lignee === 'bio')!.porteur;
    const autre = s.porteurs.find((p) => p.id !== bio)!;
    autre.pv = 0; autre.aTerre = true;
    eclater(s, bio);
    expect(autre.pv).toBe(Math.round(autre.pvMax * 0.4));
    expect(autre.aTerre).toBe(false);
  });
});
