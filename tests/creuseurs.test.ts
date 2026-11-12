import { describe, expect, it } from 'vitest';
import {
  creuser, creuseursRequis, fouiller, gagnerCreuseurs, logementCreuseurs, manquePourCreuser, noyauRequis,
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
  // 12 novembre 2026 (Bryan : « je roule sur tout le monde, mais je dois attendre mes creuseurs pour avancer ») :
  // plus de verrou après le gardien. Les creuseurs restent dans l'histoire et se gagnent toujours, mais ne ferment plus de porte.
  it('aucune Strate ne demande plus de creuseurs ni de niveau de Tour, même au Fond', () => {
    for (let s = 1; s < 30; s++) expect(creuseursRequis(s)).toBe(0);
    for (let s = 2; s < 30; s++) expect(noyauRequis(s)).toBe(1);
  });

  it('le gardien vaincu ouvre la Strate suivante, sans attendre', () => {
    const j = pret(1);
    const r = vaincreGardien(j);
    expect(r.nouvelleStrate).toBe(true);
    expect(j.strate).toBe(2);
    expect(j.frontVaincu).toBe(false);
    expect(manquePourCreuser(j)).toBeNull();
  });

  it('plus bas aussi, avec une Tour au niveau 1 et sans un seul creuseur', () => {
    const j = pret(9);
    j.batiments.noyau = 1;
    j.creuseurs = 0;
    const r = vaincreGardien(j);
    expect(r.nouvelleStrate).toBe(true);
    expect(j.strate).toBe(10);
    expect(strateVaincue(j)).toBe(9);
  });

  it('on gagne toujours des creuseurs, logés par la Tour', () => {
    const j = pret(5);
    gagnerCreuseurs(j, 50, 'test');
    expect(j.creuseurs).toBe(logementCreuseurs(j));
    expect(creuser(j)).toBe(false);
    expect(fouiller(j, ['ilka', 'doran', 'vela'], 4, 'composants', 4).ok).toBe(true);
  });
});
