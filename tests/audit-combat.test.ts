import { describe, expect, it } from 'vitest';
import { accorder, ajouter, coupDeFuite, creerCombat, lancer, protectionUtile, retirer, tousEnnemis } from '../src/core/combat';
import { PORTEURS, gesteDeCarte } from '../src/core/donnees';
import type { CombatEtat } from '../src/core/types';

// Corrections de l'audit de cohérence du 2 novembre 2026
const equipe = () => PORTEURS.slice(0, 3).map((p) => ({ id: p.id, pv: p.pvMax, pvMax: p.pvMax, aTerre: false }));
const vela = () => PORTEURS.slice(0, 3).find((p) => p.lignee === 'reso')!.id;

describe('Audit du 2 novembre : combat', () => {
  it('la Lecture ne brise qu’une Fêlure et ne donne le Flux qu’une fois', () => {
    const s = creerCombat({ porteurs: equipe(), ennemiId: 'pilleur', escorte: ['rampeur'], rng: 7 });
    for (const en of tousEnnemis(s)) en.pv = en.pvMax = 999;
    const g = { ...gesteDeCarte('meche-or@cuivre', vela()), uid: 'a' };
    // la Fêlure du visé ne correspond pas à la carte, celle de l'autre ennemi oui : la Lecture brise quand même celle du visé, et seulement elle
    tousEnnemis(s)[0]!.felure = g.f === 1 ? 2 : 1;
    tousEnnemis(s)[1]!.felure = g.f;
    s.main = [g];
    ajouter(s, 'a'); lancer(s);
    expect(s.journal.filter((l) => l.startsWith('Fêlure'))).toHaveLength(1);
    expect(tousEnnemis(s)[1]!.felureBrisee).toBeFalsy();
  });

  it('fuir sous l’Ombre agissante ne coûte aucun coup', () => {
    const s: CombatEtat = creerCombat({ porteurs: equipe(), ennemiId: 'pilleur', rng: 7 });
    s.intention = { type: 'atk', nom: 'Coup', v: 20, cibleId: 'ilka' };
    s.ombre = true;
    expect(coupDeFuite(s).coups.every((c) => c.net === 0)).toBe(true);
  });

  it('sous le brouillard, on peut encore choisir qui protéger', () => {
    const s = creerCombat({ porteurs: equipe(), ennemiId: 'pilleur', rng: 7 });
    s.condition = 'brouillard';
    expect(protectionUtile(s)).toBe(true);
  });

  it('une Fréquence choisie à la main n’est pas écrasée quand on retire une autre carte', () => {
    const s = creerCombat({ porteurs: equipe(), ennemiId: 'pilleur', rng: 7 });
    const multi = { ...gesteDeCarte('meche-or@nacre', vela()), uid: 'm' };
    const autre = { ...gesteDeCarte('bond@fer', 'ilka'), uid: 'b' };
    s.main = [autre, multi];
    ajouter(s, 'b'); ajouter(s, 'm');
    const choisie = multi.fs!.find((f) => f !== multi.f)!;
    accorder(s, 'm', choisie);
    retirer(s, 'b');
    expect(s.chaine.find((x) => x.uid === 'm')!.f).toBe(choisie);
  });
});
