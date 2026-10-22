import { describe, expect, it } from 'vitest';
import { creerCombat, intentionDe, lancer, tousEnnemis } from '../src/core/combat';
import { PORTEURS } from '../src/core/donnees';
import { MARQUES, bonusEscouade, nouveauJeu, progresMarque } from '../src/core/jeu';
import { REGLES } from '../src/core/regles';
import type { BonusMarques, CombatEtat } from '../src/core/types';

// Les Marques des six Porteurs qui n'en avaient pas (22 octobre 2026) : chacune change le combat
// quand son Porteur est dans l'escouade.

const equipe = () => PORTEURS.slice(0, 3).map((p) => ({ id: p.id, pv: p.pvMax, pvMax: p.pvMax, aTerre: false }));
const combat = (bonus?: BonusMarques, ennemiId = 'remanent-faible'): CombatEtat =>
  creerCombat({ porteurs: equipe(), ennemiId, rng: 3, ...(bonus ? { bonus } : {}) });

describe('Chaque Porteur a sa Marque', () => {
  it('les neuf Porteurs ont une Marque, avec un seuil et un bonus', () => {
    for (const p of PORTEURS) {
      const m = MARQUES[p.id];
      expect(m, p.id).toBeDefined();
      expect(m!.seuil).toBeGreaterThan(0);
      expect(Object.keys(m!.bonus).length).toBe(1);
    }
  });

  it('la Marque ne compte que si le Porteur est dans l’escouade et l’a gagnée', () => {
    const j = nouveauJeu(0, 1);
    j.porteurs.coursier!.faits = { combats: 39 };
    expect(bonusEscouade(j, ['coursier', 'doran', 'vela'])).toEqual({});
    j.porteurs.coursier!.faits.combats = 40;
    expect(progresMarque(j, 'coursier')!.acquise).toBe(true);
    expect(bonusEscouade(j, ['coursier', 'doran', 'vela'])).toEqual({ flux: 1 });
    expect(bonusEscouade(j, ['ilka', 'doran', 'vela'])).toEqual({});
  });
});

describe('Les effets des nouvelles Marques', () => {
  it('Foulée (Coursier) : le combat commence avec 1 Flux', () => {
    expect(combat().flux).toBe(0);
    expect(combat({ flux: 1 }).flux).toBe(1);
  });

  it('Guet (Guetteur) : une carte de plus dans la première main', () => {
    expect(combat().main.length).toBe(REGLES.tailleMain);
    expect(combat({ main: 1 }).main.length).toBe(REGLES.tailleMain + 1);
  });

  it('Œil de nuit (Nuit) : l’ennemi visé commence fissuré pendant deux tours', () => {
    const s = combat({ fissure: 0.25 });
    expect(s.ennemi.fissure).toBe(0.25);
    expect(s.ennemi.fissureTours).toBe(2);
  });

  it('Ombre courtoise (Aurel) : la première attaque annoncée perd 40 %', () => {
    const a = combat();
    const b = combat({ desarme: 0.4 });
    const va = intentionDe(a, a.ennemi), vb = intentionDe(b, b.ennemi);
    expect(va.type).toBe('atk');
    if (va.type === 'atk' && vb.type === 'atk') expect(vb.v).toBe(Math.round(va.v * 0.6));
    // dans un groupe, chaque ennemi est retenu
    const sans = creerCombat({ porteurs: equipe(), ennemiId: 'remanent', escorte: ['vigie'], rng: 3 });
    const avec = creerCombat({ porteurs: equipe(), ennemiId: 'remanent', escorte: ['vigie'], rng: 3, bonus: { desarme: 0.4 } });
    tousEnnemis(sans).forEach((en, k) => {
      const x = intentionDe(sans, en), y = intentionDe(avec, tousEnnemis(avec)[k]!);
      if (x.type === 'atk' && y.type === 'atk') expect(y.v).toBe(Math.round(x.v * 0.6));
    });
  });

  it('Bras de quai (Docker) : un quart du bouclier passe au tour suivant', () => {
    const s = combat({ garde: 0.25 });
    s.bouclier = 100;
    s.chaine = [{ id: 'a', uid: 'a', porteur: 'ilka', nom: 'T', f: 1, type: 'atk', v: 1 }];
    lancer(s, { silencieux: true });
    // l'ennemi a frappé dans le bouclier, puis un quart de ce qui reste est gardé
    expect(s.bouclier).toBeGreaterThan(0);
    const t = combat();
    t.bouclier = 100;
    t.chaine = [{ id: 'a', uid: 'a', porteur: 'ilka', nom: 'T', f: 1, type: 'atk', v: 1 }];
    lancer(t, { silencieux: true });
    expect(t.bouclier).toBe(0);
  });

  it('Seconde chance (Sasha) : le premier Porteur qui tombe se relève, une seule fois', () => {
    const s = combat({ releve: 0.25 });
    // tout le monde au bord de la chute : le coup du Rémanent en met au moins un à terre
    for (const p of s.porteurs) p.pv = 1;
    s.chaine = [{ id: 'a', uid: 'a', porteur: 'ilka', nom: 'T', f: 1, type: 'atk', v: 1 }];
    lancer(s, { silencieux: true });
    expect(s.releveFaite).toBe(true);
    const releve = s.porteurs.find((p) => p.pv > 1);
    expect(releve).toBeDefined();
    expect(releve!.pv).toBe(Math.round(releve!.pvMax * 0.25));
    expect(releve!.aTerre).toBeFalsy();
  });
});
