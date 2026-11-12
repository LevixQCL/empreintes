import { describe, expect, it } from 'vitest';
import {
  CREUSE, creuser, creuseursRequis, dureeCreuse, finCreuse, heuresCreuse, fouiller, gagnerCreuseurs, logementCreuseurs, manquePourCreuser, noyauRequis,
  nouveauJeu, remonter, partir, type Jeu,
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

  // 12 novembre 2026, soir (Bryan : « un délai de creuse pour freiner un petit peu ») : la galerie se perce en un temps fixe,
  // qui grandit avec la profondeur ; chaque creuseur logé le raccourcit. Plus bas que −2, rien ne s'ouvre avant la fin.
  it('plus bas, la galerie se perce en un temps fixe, sans Tour ni creuseur à réunir', () => {
    const j = pret(9);
    j.batiments.noyau = 1;
    j.creuseurs = 0;
    j.dernierTick = T0;
    const r = vaincreGardien(j);
    expect(r.nouvelleStrate).toBe(false);
    expect(j.strate).toBe(9);
    // le gardien amène un creuseur : la creuse est déjà un peu plus courte
    expect(finCreuse(j)).toBe(T0 + dureeCreuse(j, 10));
    expect(dureeCreuse(j, 10)).toBeLessThan(heuresCreuse(10) * 3_600_000);
    j.dernierTick = finCreuse(j)! - 1;
    expect(creuser(j)).toBe(false);
    j.dernierTick = finCreuse(j)!;
    expect(creuser(j)).toBe(true);
    expect(j.strate).toBe(10);
    expect(j.creuseDebut).toBeUndefined();
  });

  it('la creuse grandit avec la profondeur, et les creuseurs la raccourcissent jusqu’à 40 %', () => {
    for (let s = 4; s <= 10; s++) expect(heuresCreuse(s)).toBeGreaterThan(heuresCreuse(s - 1));
    expect(heuresCreuse(2)).toBe(0);
    expect(heuresCreuse(15)).toBe(heuresCreuse(10));
    expect(dureeCreuse({ creuseurs: 4 }, 10)).toBe(Math.round(heuresCreuse(10) * 3_600_000 * 0.8));
    expect(dureeCreuse({ creuseurs: 60 }, 10)).toBe(Math.round(heuresCreuse(10) * 3_600_000 * (1 - CREUSE.plafond)));
  });

  it('on gagne toujours des creuseurs, logés par la Tour', () => {
    const j = pret(5);
    gagnerCreuseurs(j, 50, 'test');
    expect(j.creuseurs).toBe(logementCreuseurs(j));
    expect(creuser(j)).toBe(false);
    expect(fouiller(j, ['ilka', 'doran', 'vela'], 4, 'composants', 4).ok).toBe(true);
  });
});
