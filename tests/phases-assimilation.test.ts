import { describe, expect, it } from 'vitest';
import { ajouter, creerCombat, lancer, ligneeEnnemi, nomPhase, puissance, tousEnnemis, VARIANTES } from '../src/core/combat';
import { PORTEURS, gesteDeCarte, porteurDef } from '../src/core/donnees';
import { lancerCombat, nouvelleExpedition } from '../src/core/expedition';
import { REGLES } from '../src/core/regles';
import type { CombatEtat, VariantePhase } from '../src/core/types';

const equipe = () => PORTEURS.slice(0, 3).map((p) => ({ id: p.id, pv: 999, pvMax: 999, aTerre: false }));

/** Un gardien des Strates profondes, déjà en seconde phase, juste au-dessus de son dernier seuil */
function gardien(variante: VariantePhase): CombatEtat {
  const s = creerCombat({ porteurs: equipe(), ennemiId: 'tisseuse', rng: 11, troisiemePhase: true });
  s.ennemi.phase3 = variante;
  s.ennemi.phase2 = true;
  s.ennemi.pvMax = 1000;
  s.ennemi.pv = 202;
  s.ennemi.bouclier = 0;
  s.main = [{ ...gesteDeCarte('bond@fer', 'ilka'), uid: 'a' }];
  return s;
}
const frapper = (s: CombatEtat) => { ajouter(s, 'a'); lancer(s); };

describe('La 3ᵉ phase des gardiens (idées de Luc, 28 octobre 2026)', () => {
  it('s’ouvre sous le dernier quart des PV, avec la variante tirée au début', () => {
    const s = gardien('deferlement');
    expect(nomPhase(s.ennemi)).toBe('Trame rompue');
    frapper(s);
    expect(s.ennemi.pv).toBeLessThanOrEqual(s.ennemi.pvMax * REGLES.troisiemePhase.seuil);
    expect(s.ennemi.phase3Active).toBe(true);
    expect(nomPhase(s.ennemi)).toBe('Déferlement');
  });

  it('Déferlement : ses coups enflent à chaque tour, jusqu’au plafond', () => {
    const s = gardien('deferlement');
    frapper(s);
    const p1 = puissance(s.ennemi);
    expect(p1).toBeGreaterThan(1);
    s.ennemi.crescendo = 99;
    s.main = [{ ...gesteDeCarte('bond@fer', 'ilka'), uid: 'b' }];
    ajouter(s, 'b'); lancer(s);
    expect(s.ennemi.crescendo).toBe(REGLES.troisiemePhase.deferlementMax);
  });

  it('Front commun : un renfort surgit, et les deux ne font plus qu’attaquer', () => {
    const s = gardien('front');
    frapper(s);
    const ennemis = tousEnnemis(s).filter((en) => en.pv > 0);
    expect(ennemis.length).toBe(2);
    for (const en of ennemis) expect(en === s.ennemi ? s.intention.type : en.intention?.type).toBe('atk');
  });

  it('Garde rapprochée : deux soutiens soignent ou couvrent le gardien', () => {
    const s = gardien('garde');
    frapper(s);
    const soutiens = tousEnnemis(s).filter((en) => en.role === 'soutien');
    expect(soutiens.length).toBe(2);
    const pv = s.ennemi.pv;
    // un tour de plus : les soutiens agissent sur le gardien
    s.main = [{ ...gesteDeCarte('bond@fer', 'ilka'), uid: 'b' }];
    s.ennemi.pv = pv;
    ajouter(s, 'b');
    lancer(s);
    expect(s.journal.some((l) => l.includes('Panser le gardien') || l.includes('couvre Tisseuse'))).toBe(true);
  });

  it('Appel des profondeurs : le gardien ne frappe plus, il rappelle des renforts quand ils tombent', () => {
    const s = gardien('appel');
    frapper(s);
    expect(s.ennemi.role).toBe('invocateur');
    expect(tousEnnemis(s).filter((en) => en.role === 'assaut' && en.pv > 0).length).toBe(2);
    for (const en of tousEnnemis(s)) if (en.role === 'assaut') en.pv = 0;
    s.main = [{ ...gesteDeCarte('bond@fer', 'ilka'), uid: 'b' }];
    ajouter(s, 'b'); lancer(s);
    // sans renfort debout, son geste suivant est un appel
    expect(s.intention.type === 'appel' || tousEnnemis(s).some((en) => en.role === 'assaut' && en.pv > 0)).toBe(true);
  });

  it('n’existe qu’à partir de la Strate −7, et la variante change d’un combat à l’autre', () => {
    const tirer = (strate: number, rng: number) => {
      const x = nouvelleExpedition({ porteurs: equipe(), deck: undefined as never, strate, rng, sequence: ['tisseuse'] });
      return lancerCombat(x, 'tisseuse').combat.ennemi.phase3;
    };
    expect(tirer(6, 3)).toBeUndefined();
    const vues = new Set(Array.from({ length: 40 }, (_, k) => tirer(7, k * 97)));
    expect(vues.size).toBe(VARIANTES.length);
  });
});

describe('L’Assimilation (idée de Luc, 28 octobre 2026)', () => {
  it('prend la lignée de la dernière carte qui l’a frappé, à la fin de la chaîne', () => {
    const s = creerCombat({ porteurs: equipe(), ennemiId: 'echo-veilleur', rng: 5 });
    s.ennemi.pv = s.ennemi.pvMax = 999;
    expect(ligneeEnnemi(s.ennemi)).toBe('reso');
    s.main = [{ ...gesteDeCarte('bond@fer', 'ilka'), uid: 'a' }];
    frapper(s);
    expect(ligneeEnnemi(s.ennemi)).toBe(porteurDef('ilka').lignee);
    expect(s.journal.some((l) => l.includes('assimile'))).toBe(true);
  });

  it('dort avant la Strate −6', () => {
    const s = creerCombat({ porteurs: equipe(), ennemiId: 'echo-veilleur', rng: 5, assimilation: false });
    s.ennemi.pv = s.ennemi.pvMax = 999;
    s.main = [{ ...gesteDeCarte('bond@fer', 'ilka'), uid: 'a' }];
    frapper(s);
    expect(ligneeEnnemi(s.ennemi)).toBe('reso');
  });
});
