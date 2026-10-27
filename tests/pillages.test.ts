// Les pillages (26 octobre 2026) : garnison, force des gardes, butin, coffre, jetons et attaques subies.
import { describe, expect, it } from 'vitest';
import {
  PILLAGE, butinPillage, chanceVictoire, choisirDefense, cibleDe, escouadeDefense, escouadesDe, placerDansEscouade, ciblesBots, etatPillage, forceEscouade, garnisonDe, majJetons, multButin,
  nouveauJeu, piller, protege, remonter, subirPillages, type Cible,
} from '../src/core/jeu';
import { jouerTourMoyen } from '../src/core/robot';

const ESC = ['ilka', 'doran', 'vela'];
const pret = () => { const j = nouveauJeu(0, 1); j.chambre = true; j.recrues = true; j.frontVaincu = true; return j; };

/** Joue le pillage en cours jusqu'au bout (joueur moyen) et remonte */
function jouer(j: ReturnType<typeof pret>) {
  const s = j.expedition!.combat;
  for (let t = 0; s.issue === 'en-cours' && t < 80; t++) jouerTourMoyen(s);
  return remonter(j);
}

describe('Les pillages', () => {
  it('la garnison reprend l’escouade, ses PV et ses cartes', () => {
    const g = garnisonDe(pret());
    expect(g.porteurs.map((p) => p.id)).toEqual(ESC);
    expect(g.porteurs.every((p) => p.pv > 0 && p.cartes.length > 0)).toBe(true);
    expect(g.strate).toBe(1);
  });

  it('la garnison se choisit parmi les escouades, pas forcément celle qui descend', () => {
    const j = pret();
    expect(placerDansEscouade(j, 0, 'vela', 1).ok).toBe(true);
    expect(escouadesDe(j)[1]).toEqual(['vela']);
    expect(choisirDefense(j, 2).ok).toBe(false);
    expect(choisirDefense(j, 1).ok).toBe(true);
    expect(escouadeDefense(j)).toBe(1);
    expect(garnisonDe(j).porteurs[0]!.id).toBe('vela');
    // l'escouade qui descend ne change pas
    expect(escouadesDe(j)[0]).not.toContain('vela');
  });

  it('contre sa propre garnison, le joueur moyen gagne environ une fois sur deux', () => {
    let v = 0;
    const n = 60;
    for (let k = 0; k < n; k++) {
      const j = pret();
      const cible = cibleDe('miroir', 'Miroir', garnisonDe(j));
      expect(piller(j, ESC, cible, 0, 1 + k * 7919).ok).toBe(true);
      if (jouer(j).victoire) v++;
    }
    expect(v / n).toBeGreaterThan(0.3);
    expect(v / n).toBeLessThan(0.75);
  });

  it('le butin suit l’écart de force, et le meilleur gain moyen est à force égale', () => {
    expect(multButin(0.8)).toBe(PILLAGE.multMin);
    expect(multButin(1)).toBe(1);
    expect(multButin(1.3)).toBe(PILLAGE.multMax);
    const moyen = (e: number) => chanceVictoire(e) * multButin(e);
    expect(moyen(1)).toBeGreaterThan(moyen(0.88));
    expect(moyen(1)).toBeGreaterThan(moyen(1.1));
  });

  it('une victoire prend au plus 10 % du coffre, plafonné', () => {
    expect(butinPillage({ strate: 5, coffre: 100 }, 1).vol).toBe(10);
    expect(butinPillage({ strate: 5, coffre: 100000 }, 1).vol).toBe(PILLAGE.plafondVol * 12);
  });

  it('le coffre ne dépasse jamais les composants : on le dépense en premier', () => {
    const j = pret();
    j.composants = 100;
    etatPillage(j).coffre = 80;
    j.composants = 30;
    expect(etatPillage(j).coffre).toBe(30);
  });

  it('un jeton par pillage, cinq au plus, un revient toutes les 4 h 48', () => {
    const j = pret();
    const bots = ciblesBots(j, forceEscouade(j, ESC), 0, 6);
    expect(bots).toHaveLength(6);
    for (let k = 0; k < PILLAGE.jetonsMax; k++) {
      expect(piller(j, ESC, bots[k]!, 0, k + 1).ok).toBe(true);
      jouer(j);
    }
    expect(piller(j, ESC, bots[5]!, 0).ok).toBe(false);
    expect(majJetons(j, PILLAGE.rechargeMs - 1)).toBe(PILLAGE.rechargeMs);
    majJetons(j, PILLAGE.rechargeMs * 2 + 5);
    expect(etatPillage(j).jetons).toBe(2);
    majJetons(j, PILLAGE.rechargeMs * 50);
    expect(etatPillage(j).jetons).toBe(PILLAGE.jetonsMax);
  });

  it('une victoire remplit le coffre ; une défaite en laisse 5 % ; un archipel par jour', () => {
    const j = pret();
    const facile: Cible = { id: 'x', nom: 'Proie', porteurs: ESC, force: 0.5, strate: 1, coffre: 50 };
    j.composants = 0;
    piller(j, ESC, facile, 0, 3);
    const r = jouer(j);
    expect(r.victoire).toBe(true);
    expect(r.pillage!.gain).toBe(butinPillage(facile, 0.5 / forceEscouade(pret(), ESC)).base + 5);
    expect(j.composants).toBe(r.pillage!.gain);
    expect(etatPillage(j).coffre).toBe(r.pillage!.gain);
    expect(j.pillage!.aEnvoyer).toEqual([{ cible: 'x', victoire: true, vol: 5, perte: 0, le: j.dernierTick }]);

    j.composants = 1000;
    etatPillage(j).coffre = 200;
    const fort: Cible = { ...facile, id: 'y', force: 40 };
    expect(piller(j, ESC, facile, 0, 4).ok).toBe(false);
    expect(piller(j, ESC, fort, 0, 4).ok).toBe(true);
    const d = jouer(j);
    expect(d.victoire).toBe(false);
    expect(d.pillage!.perte).toBe(10);
    expect(j.composants).toBe(990);
    expect(etatPillage(j).coffre).toBe(190);
  });

  it('les attaques subies ne touchent que le coffre, plafonnées, chacune une seule fois', () => {
    const j = pret();
    j.composants = 500;
    etatPillage(j).coffre = 40;
    const subis = [
      { id: 'a', nom: 'Ilse', victoire: false, vol: 0, perte: 7, le: 1 },
      { id: 'b', nom: 'Bryan', victoire: true, vol: 100, perte: 0, le: 2 },
    ];
    expect(subirPillages(j, subis)).toHaveLength(2);
    // le vol est plafonné à 5 combats de sa Strate (−1 : 30 composants)
    expect(etatPillage(j).coffre).toBe(17);
    expect(j.composants).toBe(477);
    expect(subirPillages(j, subis)).toHaveLength(0);
    expect(j.composants).toBe(477);
  });

  it('le défenseur applique lui-même son bouclier et la limite du jour', () => {
    const j = pret();
    j.composants = 500;
    etatPillage(j).coffre = 200;
    const h = 3_600_000;
    const l = subirPillages(j, [
      { id: 'a', nom: 'A', victoire: true, vol: 5, perte: 0, le: 0 },
      { id: 'b', nom: 'B', victoire: true, vol: 5, perte: 0, le: h },
      { id: 'c', nom: 'C', victoire: false, vol: 0, perte: 3, le: 9 * h },
      { id: 'd', nom: 'D', victoire: true, vol: 5, perte: 0, le: 18 * h },
      { id: 'e', nom: 'E', victoire: false, vol: 0, perte: 3, le: 20 * h },
    ]);
    // b tombe sous le bouclier de a ; c passe ; d ouvre un nouveau bouclier ; e est la 4e du jour
    expect(l.map((m) => m.charAt(0))).toEqual(['A', 'T', 'D']);
  });

  it('bouclier de 8 h après une attaque perdue, 3 attaques subies par jour au plus', () => {
    const h = 3_600_000;
    expect(protege([], 0)).toBe(false);
    expect(protege([{ victoire: true, le: 0 }], 7 * h)).toBe(true);
    expect(protege([{ victoire: true, le: 0 }], 9 * h)).toBe(false);
    expect(protege([{ victoire: false, le: 0 }], h)).toBe(false);
    expect(protege([{ victoire: false, le: 0 }, { victoire: false, le: 1 }, { victoire: false, le: 2 }], h)).toBe(true);
  });
});
