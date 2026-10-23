import { describe, expect, it } from 'vitest';
import * as C from '../src/core/combat';
import { envoyerMission,
  DISTRICT, ameliorer, degreffer, disponibles, energieParHeure, fabriquer, greffer, finDeCombat, continuer, gestesDe, nouveauJeu, partir, poster, pvMaxCombat, remonter, stockage, tick, ouvrirChambre, objectifCourant, reclamer, resumeAbsence, entrer, repondre, RENCONTRES,
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

  it('confier une carte : une place dans le deck, 6 au plus, de sa lignée ; la Forge refabrique un doublon', () => {
    const j = ouvert();
    j.collection['oeil-relais@fer'] = { niveau: 1, doublons: 0 };
    expect(gestesDe(j, 'ilka')).toHaveLength(DISTRICT.cartesMax); // Ilka porte déjà ses 6 cartes de départ
    expect(greffer(j, 'oeil-relais@fer', 'doran').ok).toBe(false); // mauvaise lignée
    expect(greffer(j, 'oeil-relais@fer', 'ilka').ok).toBe(false); // déjà 6 cartes
    expect(degreffer(j, 'tir-vif@fer').ok).toBe(true);
    expect(greffer(j, 'oeil-relais@fer', 'ilka').ok).toBe(true);
    const noms = gestesDe(j, 'ilka').map((g) => g.nom);
    expect(noms).toContain('Œil-relais');
    expect(noms).not.toContain('Tir vif');
    expect(noms).toHaveLength(6);
    // un exemplaire passe d'un Porteur à l'autre, de la même lignée
    expect(greffer(j, 'oeil-relais@fer', 'coursier').ok).toBe(true);
    expect(gestesDe(j, 'ilka')).toHaveLength(5);
    expect(gestesDe(j, 'coursier').map((g) => g.nom)).toEqual(['Œil-relais']);
    // un deck trop maigre ne descend pas
    const r = partir(j, ['coursier', 'docker', 'guetteur'], 1);
    expect(r.ok).toBe(false);
    expect(r.message).toMatch(/cartes/);
    expect(fabriquer(j, 'jambes-ressort@fer', 0).ok).toBe(false); // personne à la Forge
    poster(j, 'docker', 'forge');
    j.composants = 100;
    expect(fabriquer(j, 'lames-orbitales@or', 0).ok).toBe(false); // jamais trouvée
    expect(fabriquer(j, 'jambes-ressort@fer', 0).ok).toBe(true);
    tick(j, j.forge!.fin);
    expect(j.forge).toBeNull();
    expect(j.collection['jambes-ressort@fer']!.doublons).toBe(1);
  });
});

describe('Expédition depuis le district', () => {
  it('un Porteur au travail peut partir (son poste reste vacant), l’Usure réduit les PV et la Clinique soigne', () => {
    const j = ouvert();
    poster(j, 'ilka', 'generateur');
    expect(disponibles(j)).not.toContain('ilka');
    expect(partir(j, ['doran', 'vela', 'guetteur'], 1, 7).ok).toBe(true);

    // joue jusqu'à la fin de l'expédition
    let garde = 0;
    while (j.expedition && !j.expedition.terminee && garde++ < 2000) {
      const x = j.expedition;
      if (x.phase === 'carte') {
        // sur la carte : répondre aux rencontres (dernier choix), sinon descendre vers la première salle accessible
        if (x.rencontre) repondre(j, RENCONTRES[x.rencontre]!(j).options.length - 1);
        else entrer(j, x.carte!.salles[x.carte!.position]!.voisins[0]!);
        continue;
      }
      const s = x.combat;
      if (s.issue !== 'en-cours') { finDeCombat(j); if (!j.expedition.terminee) continuer(j); continue; }
      for (const g of s.main.slice()) if (C.placesLibres(s) > 0) C.ajouter(s, g.uid);
      C.lancer(s);
    }
    const r = remonter(j);
    expect(j.expedition).toBeNull();
    expect(j.porteurs.doran!.usure).toBeGreaterThanOrEqual(DISTRICT.usureExpedition);
    expect(pvMaxCombat(j, 'doran')).toBeLessThan(46);
    if (r.victoire) { expect(j.frontVaincu || j.strate === 2).toBe(true); expect(j.fragments.length).toBeGreaterThanOrEqual(2); } // deux papiers par Strate dans les Fondations

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
    // un Porteur de l'escouade au Générateur ne compte pas : il ne pourrait plus descendre
    poster(j, 'ilka', 'generateur');
    expect(reclamer(j).ok).toBe(false);
    poster(j, 'coursier', 'generateur');
    expect(reclamer(j).ok).toBe(true);
    expect(objectifCourant(j)!.titre).toBe('Construire ton deck');
    j.collection['oeil-relais@fer'] = { niveau: 1, doublons: 0 };
    expect(reclamer(j).ok).toBe(false);
    degreffer(j, 'bond@fer');
    greffer(j, 'oeil-relais@fer', 'ilka');
    expect(reclamer(j).ok).toBe(true);
    expect(objectifCourant(j)!.id).toBe('descendre');
    j.frontVaincu = true;
    j.creuseurs = 1;
    expect(reclamer(j).ok).toBe(true);
    // les creuseurs : une mission envoyée suffit, et le creuseur offert perce la Strate −2
    expect(objectifCourant(j)!.id).toBe('creuseurs');
    expect(reclamer(j).ok).toBe(false);
    expect(envoyerMission(j, 'docker', 'courte', 0).ok).toBe(true);
    expect(reclamer(j).ok).toBe(true);
    expect(j.strate).toBe(2);
    expect(objectifCourant(j)).toBeNull();
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
