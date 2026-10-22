// L'expérience des Porteurs (décision du 22 octobre 2026) : ils montent en combattant, et leurs PV suivent.
import { describe, expect, it } from 'vitest';
import { porteurDef } from '../src/core/donnees';
import { XP, gagnerXp, niveauPorteur, nouveauJeu, pvMaxCombat, pvNiveau, remonter, partir, xpPourNiveau } from '../src/core/jeu';

const pret = () => { const j = nouveauJeu(0, 1); j.chambre = true; j.recrues = true; return j; };

describe('Les niveaux des Porteurs', () => {
  it('chacun commence au niveau 1, avec ses PV de base', () => {
    const j = pret();
    expect(niveauPorteur(j, 'ilka')).toEqual({ niveau: 1, xp: 0, requis: xpPourNiveau(1) });
    expect(pvMaxCombat(j, 'ilka')).toBe(porteurDef('ilka').pvMax);
  });

  it('l’XP fait monter de niveau, et chaque niveau donne +4 % de PV de base', () => {
    const j = pret();
    expect(gagnerXp(j, 'ilka', xpPourNiveau(1) + xpPourNiveau(2))).toBe(3);
    expect(niveauPorteur(j, 'ilka').niveau).toBe(3);
    expect(pvNiveau(j, 'ilka')).toBe(Math.round(porteurDef('ilka').pvMax * (1 + 2 * XP.pvParNiveau)));
    expect(pvMaxCombat(j, 'ilka')).toBeGreaterThan(porteurDef('ilka').pvMax);
  });

  it('le niveau plafonne', () => {
    const j = pret();
    gagnerXp(j, 'doran', 1e9);
    expect(niveauPorteur(j, 'doran')).toMatchObject({ niveau: XP.niveauMax, requis: null });
  });

  it('un Porteur en retard apprend plus vite', () => {
    const j = pret();
    gagnerXp(j, 'ilka', 1e9);
    gagnerXp(j, 'doran', 100);
    expect(j.porteurs.doran!.xp).toBe(Math.round(100 * XP.rattrapage));
  });

  it('remonter d’une expédition donne de l’XP à toute l’escouade', () => {
    const j = pret();
    partir(j, ['ilka', 'doran', 'vela'], 1, 5);
    const x = j.expedition!;
    j.expedition = { ...x, gagnes: 2 };
    const r = remonter(j);
    expect(r.xp?.map((e) => e.id).sort()).toEqual(['doran', 'ilka', 'vela']);
    expect(r.xp![0]!.xp).toBe(2 * XP.combat);
    for (const id of ['ilka', 'doran', 'vela']) expect(j.porteurs[id]!.xp).toBe(2 * XP.combat);
  });
});
