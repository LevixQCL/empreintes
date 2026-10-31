// Le combat automatique (31 octobre 2026) : dans une Strate déjà vaincue, un combat ordinaire peut se jouer tout seul,
// avec le « joueur moyen » du parcours simulé et le vrai moteur. Le front, le gardien et les salles scellées restent à la main.
import { describe, expect, it } from 'vitest';
import { lancer, viderChaine } from '../src/core/combat';
import { accessibles, salleCourante } from '../src/core/expedition';
import { combatAutoPermis, entrer, nouveauJeu, partir } from '../src/core/jeu';
import { composerTourMoyen } from '../src/core/robot';

/** une descente dans la Strate −1, entrée dans la première salle de combat ordinaire */
function enCombat(vaincue: boolean) {
  const j = nouveauJeu(0, 1);
  j.chambre = true; j.recrues = true;
  j.frontVaincu = vaincue;
  partir(j, ['ilka', 'doran', 'vela'], 1, 5);
  const salle = accessibles(j.expedition!).find((x) => x.type === 'combat')!;
  expect(salle).toBeDefined();
  entrer(j, salle.id);
  return j;
}

describe('Le combat automatique', () => {
  it('est permis dans un combat ordinaire d’une Strate déjà vaincue', () => {
    const j = enCombat(true);
    expect(salleCourante(j.expedition!).type).toBe('combat');
    expect(combatAutoPermis(j)).toBe(true);
  });

  it('n’est jamais permis au front, sur la carte, ni hors des combats ordinaires', () => {
    expect(combatAutoPermis(enCombat(false))).toBe(false);
    const j = enCombat(true);
    j.expedition!.phase = 'carte';
    expect(combatAutoPermis(j)).toBe(false);
    const k = enCombat(true);
    salleCourante(k.expedition!).type = 'gardien';
    expect(combatAutoPermis(k)).toBe(false);
    const e = enCombat(true);
    e.expedition!.epreuve = 'x';
    expect(combatAutoPermis(e)).toBe(false);
    expect(combatAutoPermis(nouveauJeu(0, 1))).toBe(false);
  });

  it('mène le combat à son terme avec le vrai moteur', () => {
    const j = enCombat(true);
    const s = j.expedition!.combat;
    for (let n = 0; n < 60 && s.issue === 'en-cours'; n++) {
      viderChaine(s);
      composerTourMoyen(s);
      expect(s.chaine.length).toBeGreaterThan(0);
      lancer(s);
    }
    expect(s.issue).not.toBe('en-cours');
  });
});
