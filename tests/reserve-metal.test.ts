// 12 novembre 2026 : le métal d'une récompense gardée en réserve (colis, objectif du jour, Butin de la semaine) est fixé
// le jour où elle est gagnée, pas le jour où on l'ouvre.
import { describe, expect, it } from 'vitest';
import * as J from '../src/core/jeu';
import { ARCHIVE, estJeuValide } from '../src/core/jeu';
import { OBJECTIFS } from '../src/core/partie/objectifs';
import { QUOTIDIENS } from '../src/core/partie/etat';
import { RARETES, metalDessus, metalTranche } from '../src/core/collection';
import { moduleDef } from '../src/core/donnees';

const JOUR = 86_400_000;
const pret = (graine = 5) => { const j = J.nouveauJeu(Date.UTC(2026, 9, 22, 8), graine); j.chambre = true; j.objectif = OBJECTIFS.length; return j; };
const rang = (cle: string) => RARETES.indexOf(moduleDef(cle).rarete);
const dernier = (j: J.Jeu, source: string) => [...j.choix].reverse().find((c) => c.source === source)!;

describe('Le métal d’une récompense en réserve', () => {
  it('un colis gagné à −2 puis ouvert à −7 donne la carte de −2', () => {
    for (let g = 1; g <= 12; g++) {
      const j = pret(g);
      j.strate = 2;
      j.ravitaillement.ouverts = 6;
      J.tick(j, j.dernierTick + JOUR);
      expect(j.ravitaillement.strates).toEqual([2, 2]);
      j.strate = 7;
      J.ouvrirColis(j);
      const c = dernier(j, 'ravitaillement');
      // la première carte : le dessus de la tranche de −2 (cuivre), pas celui de −7 (or)
      expect(rang(c.options[0]!), `graine ${g}`).toBeLessThan(RARETES.indexOf(metalDessus(7)));
      expect(rang(c.options[0]!)).toBeGreaterThanOrEqual(RARETES.indexOf(metalDessus(2)));
      expect(j.ravitaillement.strates).toEqual([2]);
    }
  });

  it('un colis arrivé après la descente prend le métal du jour où il arrive', () => {
    const j = pret();
    j.strate = 2;
    J.tick(j, j.dernierTick + JOUR);
    j.strate = 7;
    J.tick(j, j.dernierTick + JOUR);
    expect(j.ravitaillement.strates).toEqual([2, 2, 7]);
    // la réserve pleine ne garde que les sept plus anciens, comme avant
    J.tick(j, j.dernierTick + 30 * JOUR);
    expect(j.ravitaillement.strates).toEqual([2, 2, 7, 7, 7, 7, 7]);
  });

  it('l’objectif du jour gardé en réserve garde la Strate du jour où il est arrivé', () => {
    for (let g = 1; g <= 12; g++) {
      const j = pret(g);
      j.strate = 2;
      J.tick(j, j.dernierTick + JOUR);
      expect(j.quotidien.strates).toEqual([2, 2]);
      j.strate = 8;
      j.quotidien.progres = QUOTIDIENS[j.quotidien.type].objectif;
      expect(J.reclamerQuotidien(j).ok).toBe(true);
      // à −2 la tranche est le fer : aucune carte n'est forcée en argent, comme elle le serait à −8
      expect(rang(dernier(j, 'quotidien').options[0]!), `graine ${g}`).toBeLessThan(RARETES.indexOf(metalTranche(8)));
      expect(j.quotidien.strates).toEqual([2]);
    }
  });

  it('chaque Butin de la semaine garde la Strate du lundi où il a été gagné, même empilé', () => {
    const j = pret();
    j.strate = 2;
    j.archive.points = ARCHIVE.paliers[3]!;
    J.tick(j, j.dernierTick + 7 * JOUR);
    expect(j.archive.strates).toEqual([2]);
    j.strate = 7;
    j.archive.points = ARCHIVE.paliers[2]!;
    J.tick(j, j.dernierTick + 7 * JOUR);
    expect(j.archive.aOuvrir).toBe(4);
    expect(j.archive.enAttente).toEqual([3]);
    expect(j.archive.strates).toEqual([2, 7]);
    j.strate = 11;
    expect(J.ouvrirArchive(j).ok).toBe(true);
    // gagné à −2 : les choix de prestige sont en argent (le minimum du Butin), pas en or comme au Fond
    const choix = j.choix.filter((c) => c.source === 'archive');
    expect(choix).toHaveLength(3);
    for (const c of choix.slice(1)) expect(moduleDef(c.options[0]!).rarete).toBe('argent');
    expect(j.archive.strates).toEqual([7]);
    expect(J.ouvrirArchive(j).ok).toBe(true);
    expect(j.archive.strates).toBeUndefined();
    expect(j.archive.aOuvrir).toBe(0);
  });

  it('une sauvegarde d’avant garde, pour ses récompenses en attente, la Strate ouverte au chargement', () => {
    const j = pret();
    j.strate = 4;
    j.ravitaillement.reserve = 3;
    j.quotidien.reserve = 2;
    j.archive.aOuvrir = 2;
    j.archive.enAttente = [1];
    expect(estJeuValide(j)).toBe(true);
    expect(j.ravitaillement.strates).toEqual([4, 4, 4]);
    expect(j.quotidien.strates).toEqual([4, 4]);
    expect(j.archive.strates).toEqual([4, 4]);
    // rechargée plus bas, elle ne bouge plus
    j.strate = 9;
    expect(estJeuValide(j)).toBe(true);
    expect(j.ravitaillement.strates).toEqual([4, 4, 4]);
    expect(j.archive.strates).toEqual([4, 4]);
  });
});
