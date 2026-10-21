import { describe, expect, it } from 'vitest';
import * as C from '../src/core/combat';
import {
  DISTRICT, ameliorer, disponibles, energieParHeure, fabriquer, greffer, finDeCombat, continuer, gestesDe, nouveauJeu,
  partir, poster, pvMaxCombat, remonter, stockage, tick, ouvrirChambre, objectifCourant, reclamer, resumeAbsence,
} from '../src/core/jeu';

const H = 3_600_000;
/** une partie où la chambre scellée est déjà ouverte */
const ouvert = () => { const j = nouveauJeu(0); j.chambre = true; j.recrues = true; return j; };

describe('District', () => {
  it('le Générateur produit pendant l’absence, plafonné par le stockage', () => {
    const j = nouveauJeu(0);
    tick(j, 1 * H);
    expect(j.energie).toBeCloseTo(DISTRICT.depart.energie + 60, 5);
    tick(j, 100 * H);
    expect(j.energie).toBe(stockage(j));
  });

  it('un Porteur de la bonne lignée double la production', () => {
    const j = nouveauJeu(0);
    poster(j, 'ilka', 'generateur');
    expect(energieParHeure(j)).toBe(120);
    poster(j, 'doran', 'generateur');
    expect(energieParHeure(j)).toBe(90);
    expect(j.porteurs.ilka!.poste).toBeNull();
  });

  it('un bâtiment ne dépasse pas le niveau du Noyau', () => {
    const j = nouveauJeu(0);
    j.energie = 1000; j.composants = 100;
    expect(ameliorer(j, 'generateur').ok).toBe(false);
    expect(ameliorer(j, 'noyau').ok).toBe(true);
    expect(ameliorer(j, 'generateur').ok).toBe(true);
  });

  it('greffer une carte remplace des Gestes de base par les siens ; la Forge refabrique un doublon', () => {
    const j = ouvert();
    expect(greffer(j, 'jambes-ressort@fer', 'doran').ok).toBe(false); // mauvaise lignée
    const avant = gestesDe(j, 'ilka').length;
    expect(greffer(j, 'jambes-ressort@fer', 'ilka').ok).toBe(true);
    const apres = gestesDe(j, 'ilka');
    expect(apres.length).toBe(avant); // le deck garde sa taille
    expect(apres.map((g) => g.nom)).toContain('Détente');
    expect(apres.map((g) => g.nom)).not.toContain('Tir vif'); // le premier Geste de base à céder sa place
    expect(fabriquer(j, 'jambes-ressort@fer', 0).ok).toBe(false); // personne à la Forge
    poster(j, 'coursier', 'forge');
    j.composants = 100;
    expect(fabriquer(j, 'lames-orbitales@or', 0).ok).toBe(false); // jamais trouvée
    expect(fabriquer(j, 'jambes-ressort@fer', 0).ok).toBe(true);
    tick(j, j.forge!.fin);
    expect(j.forge).toBeNull();
    expect(j.collection['jambes-ressort@fer']!.doublons).toBe(1);
  });
});

describe('Expédition depuis le district', () => {
  it('un Porteur au travail ne part pas, l’Usure réduit les PV et la Clinique soigne', () => {
    const j = ouvert();
    poster(j, 'ilka', 'generateur');
    expect(partir(j, ['ilka', 'doran', 'vela'], 1).ok).toBe(false);
    expect(disponibles(j)).not.toContain('ilka');
    expect(partir(j, ['doran', 'vela', 'guetteur'], 1, 7).ok).toBe(true);

    // joue jusqu'à la fin de l'expédition
    let garde = 0;
    while (j.expedition && !j.expedition.terminee && garde++ < 600) {
      const s = j.expedition.combat;
      if (s.issue !== 'en-cours') { finDeCombat(j); if (!j.expedition.terminee) continuer(j); continue; }
      for (const g of s.main.slice()) if (C.placesLibres(s) > 0) C.ajouter(s, g.uid);
      C.lancer(s);
    }
    const r = remonter(j);
    expect(j.expedition).toBeNull();
    expect(j.porteurs.doran!.usure).toBeGreaterThanOrEqual(DISTRICT.usureExpedition);
    expect(pvMaxCombat(j, 'doran')).toBeLessThan(46);
    if (r.victoire) { expect(j.strate).toBe(2); expect(j.fragments.length).toBe(1); }

    const u = j.porteurs.doran!.usure;
    tick(j, j.dernierTick + H);
    expect(j.porteurs.doran!.usure).toBeLessThan(u);
  });
});

describe('Premier lancement', () => {
  it('les recrues n’arrivent qu’après la chambre scellée, qui se joue dans l’ordre prévu', () => {
    const j = nouveauJeu(0);
    expect(disponibles(j)).toEqual(['ilka', 'doran', 'vela']);
    expect(partir(j, ['ilka', 'doran', 'vela'], 1).ok).toBe(false);
    expect(ouvrirChambre(j, 3).ok).toBe(true);
    const s = j.expedition!.combat;
    expect(s.main.map((g) => g.f)).toEqual([3, 2, 7, 1, 6]);
    expect(j.expedition!.tutoriel).toBe(true);
    let garde = 0;
    while (j.expedition && !j.expedition.terminee && garde++ < 300) {
      const c = j.expedition.combat;
      if (c.issue !== 'en-cours') { finDeCombat(j); continue; }
      for (const g of c.main.slice()) if (C.placesLibres(c) > 0) C.ajouter(c, g.uid);
      C.lancer(c);
    }
    const r = remonter(j);
    if (r.victoire) {
      expect(j.chambre).toBe(true);
      expect(disponibles(j)).toHaveLength(6);
      expect(j.fragments).toEqual(['mure']);
    }
  });

  it('les objectifs guidés se remplissent et se récupèrent dans l’ordre', () => {
    const j = ouvert();
    expect(objectifCourant(j)!.titre).toBe('Allumer le district');
    expect(reclamer(j).ok).toBe(false);
    poster(j, 'ilka', 'generateur');
    expect(reclamer(j).ok).toBe(true);
    expect(objectifCourant(j)!.titre).toBe('Greffer une carte');
  });

  it('le résumé du retour ne liste que ce qui a avancé', () => {
    const j = ouvert();
    j.porteurs.doran!.usure = 6;
    const avant = structuredClone(j);
    const nouvelles = tick(j, 2 * H);
    const r = resumeAbsence(avant, j, nouvelles);
    expect(r[0]).toMatch(/énergie/);
    expect(r.some((l) => l.includes('Doran'))).toBe(true);
  });
});
