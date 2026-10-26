import { describe, expect, it } from 'vitest';
import { accessibles, combatSuivant, cloturerCombat, genererCarte, salleCourante } from '../src/core/expedition';
import { entrer, nouveauJeu, partir, remonter, repondre, retraite, RENCONTRES } from '../src/core/jeu';

const pret = () => { const j = nouveauJeu(0, 1); j.chambre = true; j.recrues = true; return j; };

describe('La carte d’une Strate', () => {
  it('une entrée, un gardien au fond, un campement juste avant, et toutes les salles atteignables', () => {
    for (const rng of [1, 2, 3, 77, 1234]) {
      const c = genererCarte(5, rng);
      expect(c.salles[0]!.type).toBe('entree');
      const fond = c.salles[c.salles.length - 1]!;
      expect(fond.type).toBe('gardien');
      expect(fond.ennemi).toBe('gardien-registres');
      expect(c.salles.some((s) => s.type === 'camp' && s.rang === fond.rang - 1)).toBe(true);
      // tout est atteignable depuis l'entrée, et les couloirs descendent toujours
      const vus = new Set([0]); const file = [0];
      while (file.length) { const s = c.salles[file.pop()!]!; for (const v of s.voisins) { expect(c.salles[v]!.rang).toBe(s.rang + 1); if (!vus.has(v)) { vus.add(v); file.push(v); } } }
      expect(vus.size).toBe(c.salles.length);
    }
  });

  it('la même graine donne la même carte', () => {
    expect(genererCarte(2, 99)).toEqual(genererCarte(2, 99));
  });
});

describe('Explorer', () => {
  it('on part sur la carte ; une salle de combat ouvre un combat, la victoire ramène sur la carte', () => {
    const j = pret();
    expect(partir(j, ['ilka', 'doran', 'vela'], 1, 5).ok).toBe(true);
    const x = j.expedition!;
    expect(x.phase).toBe('carte');
    const cible = accessibles(x)[0]!;
    expect(cible.type).toBe('combat'); // la première rangée est toujours un combat
    expect(entrer(j, 999).ok).toBe(false);
    expect(entrer(j, cible.id).ok).toBe(true);
    expect(j.expedition!.phase).toBe('combat');
    j.expedition!.combat.issue = 'victoire';
    j.expedition = combatSuivant(cloturerCombat(j.expedition!));
    expect(j.expedition.phase).toBe('carte');
    expect(salleCourante(j.expedition).faite).toBe(true);
    expect(j.expedition.gagnes).toBe(1);
    expect(j.expedition.butin).toBeGreaterThan(0);
  });

  it('on ne remonte de soi-même qu’à l’entrée ou depuis un campement, en gardant tout le butin', () => {
    const j = pret();
    partir(j, ['ilka', 'doran', 'vela'], 1, 5);
    j.expedition!.butin = 40;
    expect(retraite(j).ok).toBe(true); // à l'entrée
    const r = remonter(j);
    expect(r.victoire).toBe(false);
    expect(r.butin).toBe(40);
  });

  it('une rencontre attend une réponse avant de repartir, et ses choix comptent', () => {
    const j = pret();
    partir(j, ['ilka', 'doran', 'vela'], 1, 5);
    j.expedition = { ...j.expedition!, rencontre: 'marchand', butin: 50 };
    expect(entrer(j, accessibles(j.expedition)[0]!.id).ok).toBe(false);
    expect(RENCONTRES.marchand!(j).options).toHaveLength(3);
    expect(repondre(j, 0).ok).toBe(true);
    expect(j.expedition!.butin).toBe(20);
    expect(j.expedition!.gains!.cartes).toBe(1);
    expect(j.expedition!.rencontre).toBeUndefined();
    const avant = Object.keys(j.collection).length + Object.values(j.collection).reduce((n, c) => n + c.doublons, 0);
    retraite(j);
    remonter(j);
    const apres = Object.keys(j.collection).length + Object.values(j.collection).reduce((n, c) => n + c.doublons, 0);
    expect(apres).toBe(avant + 1);
  });
});

import { simulerExploration } from '../src/core/robot';
import { DEPART_PORTEURS, carteId } from '../src/core/donnees';
describe('Le robot sait explorer', () => {
  it('le deck de départ va au bout d’une Strate des Fondations', () => {
    const depart = Object.fromEntries(Object.entries(DEPART_PORTEURS).map(([p, ids]) => [p, ids.map((id) => ({ id: carteId(id, 'fer'), niveau: 1 }))]));
    const r = simulerExploration(depart, 1, 7);
    expect(r.combats).toBeGreaterThanOrEqual(3);
  });
});
