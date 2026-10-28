// L'empreinte des cartes (28 octobre 2026) : ce qu'une carte retient de ses combats, ses paliers et ses épithètes.
import { describe, expect, it } from 'vitest';
import { epitheteAffiche, epithetesDe, journalCarte, noterOrigine, noterVecu, palierCarte, palierDe, pointsVecu, VECU, vecuDe } from '../src/core/jeu';
import { nouveauJeu } from '../src/core/jeu';
import { DEPART_PORTEURS, carteId } from '../src/core/donnees';
import type { CombatEtat, TourHisto } from '../src/core/types';

const ATK = carteId(DEPART_PORTEURS.ilka![0]!, 'fer');
const AUTRE = carteId(DEPART_PORTEURS.doran![0]!, 'fer');

/** un combat réduit à son journal : deux cartes jouées, la seconde porte le dernier coup */
function combat(issue: CombatEtat['issue'], felure = false): CombatEtat {
  const t: TourHisto = {
    tour: 1,
    chaine: [
      { nom: 'A', porteur: 'ilka', carte: ATK, type: 'atk', v: 10, f: 1 },
      { nom: 'B', porteur: 'doran', carte: AUTRE, type: 'atk', v: 10, f: 2 },
    ],
    lignes: [
      { camp: 'joueur', sorte: 'coup', texte: 'coup', v: 30, rang: 0 },
      ...(felure ? [{ camp: 'joueur' as const, sorte: 'effet' as const, texte: 'Fêlure : il vacille.', rang: 0 }] : []),
      { camp: 'joueur', sorte: 'coup', texte: 'coup', v: 12, rang: 1 },
      { camp: 'ennemi', sorte: 'blessure', texte: 'aïe', v: 9 },
    ],
  };
  return { issue, historique: [t] } as unknown as CombatEtat;
}

describe('Empreinte des cartes', () => {
  it('une victoire inscrit coups, Fêlures, profondeur et dernier coup', () => {
    const j = nouveauJeu(0);
    noterVecu(j, combat('victoire', true), { strate: 4, gardien: false });
    const a = vecuDe(j, ATK)!, b = vecuDe(j, AUTRE)!;
    expect(a).toMatchObject({ l: 1, v: 1, d: 30, f: 1, z: 4, a: 0, p: 'ilka' });
    expect(b).toMatchObject({ l: 1, v: 1, d: 12, a: 1, z: 4 });
  });

  it('une défaite garde les coups mais pas la victoire', () => {
    const j = nouveauJeu(0);
    noterVecu(j, combat('defaite'), { strate: 2, gardien: false });
    expect(vecuDe(j, ATK)).toMatchObject({ l: 1, v: 0, d: 30, z: 0, a: 0 });
  });

  it('le Gardien : chaque carte présente, et le dernier coup à part', () => {
    const j = nouveauJeu(0);
    noterVecu(j, combat('victoire'), { strate: 6, gardien: true });
    expect(vecuDe(j, ATK)!.g).toEqual([6]);
    expect(vecuDe(j, ATK)!.ga).toEqual([]);
    expect(vecuDe(j, AUTRE)!.ga).toEqual([6]);
    expect(epitheteAffiche(AUTRE, vecuDe(j, AUTRE))).toContain('Gardien de −6');
    expect(journalCarte(vecuDe(j, AUTRE))).toContain('A fendu le Gardien de −6.');
  });

  it('les paliers suivent les seuils', () => {
    expect(palierDe(undefined)).toBe(0);
    const x = { l: 0, v: 0, d: 0, b: 0, s: 0, a: 0, f: 0, z: 0, g: [], ga: [] };
    for (const [i, seuil] of VECU.paliers.entries()) {
      const v = Math.ceil(seuil / VECU.points.victoire);
      expect(palierDe({ ...x, v })).toBe(i + 1);
      expect(pointsVecu({ ...x, v: v - 1 })).toBeLessThan(seuil);
    }
  });

  it('une descente ordinaire allume la Trace', () => {
    const j = nouveauJeu(0);
    for (let k = 0; k < 5; k++) noterVecu(j, combat('victoire', k % 2 === 0), { strate: 2, gardien: false });
    noterVecu(j, combat('victoire'), { strate: 2, gardien: true });
    expect(palierCarte(j, ATK)).toBe(1);
  });

  it('l’origine ne s’écrit qu’une fois', () => {
    const j = nouveauJeu(0);
    noterOrigine(j, ATK, 3);
    noterOrigine(j, ATK, 7);
    expect(vecuDe(j, ATK)!.o).toBe(3);
    expect(epithetesDe(ATK, vecuDe(j, ATK))).toEqual([]);
  });
});

describe('Empreinte : une vraie descente', () => {
  it('les cartes jouées par le moteur s’inscrivent, et une descente allume au moins une Trace', async () => {
    const { partir, entrer, repondre, RENCONTRES, finDeCombat, continuer, remonter } = await import('../src/core/jeu');
    const { jouerTour } = await import('../src/core/robot');
    const j = nouveauJeu(0); j.chambre = true; j.recrues = true;
    expect(partir(j, ['ilka', 'doran', 'vela'], 1, 3).ok).toBe(true);
    let garde = 0;
    while (j.expedition && !j.expedition.terminee && garde++ < 3000) {
      const x = j.expedition;
      if (x.phase === 'carte') {
        if (x.rencontre) repondre(j, RENCONTRES[x.rencontre]!(j).options.length - 1);
        else entrer(j, x.carte!.salles[x.carte!.position]!.voisins[0]!);
        continue;
      }
      const s = x.combat;
      if (s.issue !== 'en-cours') { finDeCombat(j); if (!j.expedition.terminee) continuer(j); continue; }
      jouerTour(s);
    }
    remonter(j);
    const tout = Object.values(j.vecu ?? {});
    expect(tout.length).toBeGreaterThan(5);
    expect(tout.reduce((n, x) => n + x.l, 0)).toBeGreaterThan(20);
    expect(tout.reduce((n, x) => n + x.d + x.b + x.s, 0)).toBeGreaterThan(0);
    if (tout.some((x) => x.v > 0)) expect(tout.some((x) => x.a > 0)).toBe(true);
    // une descente gagnée allume la Trace des cartes les plus jouées (étude du 28/10 : 14 à 28 points par carte)
    if (j.strate > 1 || j.frontVaincu) expect(Object.keys(j.vecu!).some((k) => palierCarte(j, k) >= 1)).toBe(true);
  });
});
