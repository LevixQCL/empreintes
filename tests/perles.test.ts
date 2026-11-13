import { describe, expect, it } from 'vitest';
import { xpPourAtteindre } from '../src/core/partie/district';
import { COLLECTION, freinPromotion } from '../src/core/collection';
import { fondrePerle, perleDesRecits, perlesDuLundi, rattraperPerles } from '../src/core/partie/perles';
import { ASCENSION } from '../src/core/partie/fleche';
import { tick } from '../src/core/partie/temps';
import { OBJECTIFS, nouveauJeu, promouvoir, semaineDe } from '../src/core/jeu';

const debut = Date.UTC(2026, 9, 21, 12);
const avance = () => {
  const j = nouveauJeu(debut, 42);
  j.chambre = true; j.recrues = true; j.objectif = OBJECTIFS.length;
  return j;
};

describe('La Perle de nacre (13 novembre 2026)', () => {
  it('passer de l’or à la nacre demande 5 copies et une Perle, qui part avec la promotion', () => {
    const j = avance();
    const k = 'jambes-ressort@or';
    j.collection[k] = { niveau: 3, doublons: 5 };
    j.porteurs.ilka!.modules.push(k);
    j.porteurs.ilka!.xp = xpPourAtteindre(13);
    j.energie = 5000;
    expect(freinPromotion(j, k)).toMatch(/Perle/);
    expect(promouvoir(j, k).ok).toBe(false);
    j.perles = 1;
    j.collection[k] = { niveau: 3, doublons: 4 };
    expect(freinPromotion(j, k)).toMatch(/5 copies/);
    j.collection[k] = { niveau: 3, doublons: 5 };
    expect(promouvoir(j, k).ok).toBe(true);
    expect(j.perles).toBe(0);
    expect(j.energie).toBe(5000 - COLLECTION.promotion.cristaux.nacre);
    expect(j.collection['jambes-ressort@nacre']).toBeDefined();
  });

  it('la fonte : 8 copies en or prises sur toutes les cartes, celles de l’escouade gardent leurs 5', () => {
    const j = avance();
    j.energie = 5000;
    j.collection['jambes-ressort@or'] = { niveau: 3, doublons: 9 };
    j.porteurs.ilka!.modules.push('jambes-ressort@or');
    expect(fondrePerle(j).ok).toBe(false); // 4 copies en trop seulement
    j.collection['carapace@or'] = { niveau: 1, doublons: 4 };
    expect(fondrePerle(j).ok).toBe(true);
    expect(j.perles).toBe(1);
    expect(j.collection['jambes-ressort@or']!.doublons + j.collection['carapace@or']!.doublons).toBe(5);
    expect(j.collection['jambes-ressort@or']!.doublons).toBeGreaterThanOrEqual(5);
    expect(j.energie).toBe(5000 - COLLECTION.perle.fonte.cristaux);
  });

  it('un lundi sur deux une fois −10 vaincue, sans rien perdre pendant une absence', () => {
    const j = avance();
    j.strate = 10; j.frontVaincu = false;
    expect(perlesDuLundi(j, debut)).toBeNull(); // −10 pas encore vaincue
    j.frontVaincu = true;
    expect(perlesDuLundi(j, debut)).toBeNull(); // le compte commence
    expect(j.perles ?? 0).toBe(0);
    const s = semaineDe(debut);
    const lundi = (n: number) => debut + ((j.perleSemaine! + n) - s) * 7 * 86_400_000;
    expect(perlesDuLundi(j, lundi(1))).toBeNull();
    expect(perlesDuLundi(j, lundi(2))).not.toBeNull();
    expect(j.perles).toBe(1);
    // six semaines d'absence : les trois Perles attendent
    perlesDuLundi(j, lundi(8));
    expect(j.perles).toBe(4);
  });

  it('le lot des trois Récits : une Perle, une seule fois', () => {
    const j = avance();
    expect(perleDesRecits(j)).not.toBeNull();
    expect(perleDesRecits(j)).toBeNull();
    expect(j.perles).toBe(1);
  });

  it('une partie déjà avancée récupère une fois les Perles de −9, −10 et des quais à nacre déjà passés', () => {
    const j = avance();
    expect(j.perlesRattrapees).toBe(true); // une partie neuve n'a rien à rattraper
    delete j.perlesRattrapees;
    j.strate = 10; j.frontVaincu = true;
    j.fleche = { quai: 82, record: 82, recordLe: 0, recus: [20, 40, 50, 60, 70, 75, 80], victoires: 9, defaites: 0 };
    const nacre = Object.keys(ASCENSION.cartes).map(Number).filter((q) => ASCENSION.cartes[q] === 'nacre');
    // la Perle de −9 était déjà arrivée (notée au journal) : elle n'est pas donnée deux fois
    j.journal.unshift('Une Perle de nacre (gardien de la Strate −9) : à la Forge, elle fait passer une carte en or en nacre.');
    expect(rattraperPerles(j, nacre)).toMatch(/3 Perles/);
    expect(j.perles).toBe(3); // −10, quais 75 et 80
    expect(rattraperPerles(j, nacre)).toBeNull();
    expect(j.perles).toBe(3);
  });

  it('le rattrapage passe tout seul au chargement d’une ancienne partie', () => {
    const j = avance();
    delete j.perlesRattrapees;
    j.strate = 9; j.frontVaincu = true;
    tick(j, debut + 60_000);
    expect(j.perles).toBe(1);
    expect(j.perlesRattrapees).toBe(true);
  });
});

