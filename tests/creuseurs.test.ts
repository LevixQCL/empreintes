import { describe, expect, it } from 'vitest';
import {
  CREUSEURS, creuser, creuseursRequis, fouiller, gagnerCreuseurs, logementCreuseurs, manquePourCreuser, noyauRequis,
  nouveauJeu, remonter, partir, strateVaincue, type Jeu,
} from '../src/core/jeu';

const T0 = Date.UTC(2026, 9, 21, 12);
const pret = (strate: number): Jeu => { const j = nouveauJeu(T0, 1); j.chambre = true; j.recrues = true; j.strate = strate; return j; };
/** une victoire contre le gardien du front, sans jouer le combat */
function vaincreGardien(j: Jeu) {
  expect(partir(j, ['ilka', 'doran', 'vela'], j.strate, 3).ok).toBe(true);
  const x = j.expedition!;
  x.combat.issue = 'victoire';
  j.expedition = { ...x, terminee: true, cloture: true, phase: 'combat', carte: { ...x.carte!, position: x.carte!.salles.length - 1 } };
  return remonter(j);
}

describe('Les creuseurs', () => {
  it('chaque étage demande au moins autant de creuseurs que le précédent, et jamais plus que le logement maximum', () => {
    for (let s = 2; s < 30; s++) expect(creuseursRequis(s)).toBeGreaterThanOrEqual(creuseursRequis(s - 1));
    expect(creuseursRequis(60)).toBeLessThanOrEqual(CREUSEURS.logement[CREUSEURS.logement.length - 1]!);
    expect(noyauRequis(10)).toBeGreaterThan(noyauRequis(5));
  });

  it('dès la Strate −2, il faut des creuseurs : le gardien vaincu en amène un, il en faut un de plus (22 octobre 2026)', () => {
    const j = pret(1);
    const r = vaincreGardien(j);
    expect(r.nouvelleStrate).toBe(false);
    expect(j.frontVaincu).toBe(true);
    expect(manquePourCreuser(j)).toEqual({ creuseurs: creuseursRequis(2) - CREUSEURS.gardien, noyau: 0 });
    gagnerCreuseurs(j, creuseursRequis(2), 'test');
    expect(creuser(j)).toBe(true);
    expect(j.strate).toBe(2);
    expect(j.frontVaincu).toBe(false);
  });

  it('plus bas, le gardien vaincu prépare l’étage, qui attend ses creuseurs puis consomme ceux qui le percent', () => {
    const j = pret(5);
    j.batiments.noyau = 3;
    const r = vaincreGardien(j);
    expect(r.nouvelleStrate).toBe(false);
    expect(j.strate).toBe(5);
    expect(j.frontVaincu).toBe(true);
    expect(strateVaincue(j)).toBe(5);
    expect(manquePourCreuser(j)!.creuseurs).toBeGreaterThan(0);
    // on peut fouiller le front vaincu pour trouver des creuseurs
    expect(fouiller(j, ['ilka', 'doran', 'vela'], 5, 'composants', 4).ok).toBe(true);
    j.expedition = null;
    gagnerCreuseurs(j, 20, 'test');
    expect(j.creuseurs).toBe(logementCreuseurs(j));
    const avant = j.creuseurs;
    expect(creuser(j)).toBe(true);
    expect(j.strate).toBe(6);
    expect(j.creuseurs).toBe(avant - creuseursRequis(6));
  });

  it('sans un Noyau assez grand, les creuseurs ne sont pas logés et l’étage attend', () => {
    const j = pret(9);
    j.frontVaincu = true;
    j.batiments.noyau = 2;
    gagnerCreuseurs(j, 50, 'test');
    expect(j.creuseurs).toBe(logementCreuseurs(j));
    expect(manquePourCreuser(j)!.noyau).toBeGreaterThan(0);
    expect(creuser(j)).toBe(false);
  });
});
