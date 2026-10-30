import { describe, expect, it } from 'vitest';
import { creerCombat, lancer } from '../src/core/combat';
import { ENNEMIS, PORTEURS, ZONES, sequenceStrate, zoneDe } from '../src/core/donnees';
import type { Geste } from '../src/core/types';

const equipe = () => PORTEURS.slice(0, 3).map((p) => ({ id: p.id, pv: p.pvMax, pvMax: p.pvMax, aTerre: false }));
const geste = (f: number, uid: string): Geste => ({ id: uid, uid, porteur: 'ilka', nom: 'Test', f, type: 'atk', v: 10 });

describe('Les zones des Strates', () => {
  it('chaque profondeur a sa zone, et chaque ennemi de zone existe', () => {
    expect(zoneDe(1).nom).toBe('Les Seuils');
    expect(zoneDe(5).nom).toBe('Les Salles closes');
    expect(zoneDe(8).nom).toBe('Les Registres');
    expect(zoneDe(14).nom).toBe('Le Fond');
    for (const z of ZONES) for (const id of [...z.ennemis, z.boss]) expect(ENNEMIS.some((e) => e.id === id)).toBe(true);
  });

  it('une expédition : deux ennemis différents de la zone, puis son gardien, toujours les mêmes pour une même graine', () => {
    for (const rng of [1, 7, 42, 999]) {
      const s = sequenceStrate(5, rng);
      expect(s).toHaveLength(3);
      expect(s[0]).not.toBe(s[1]);
      expect(ZONES[1]!.ennemis).toContain(s[0]);
      expect(s[2]).toBe('gardien-registres');
      expect(sequenceStrate(5, rng)).toEqual(s);
    }
  });
});

describe('Nouvelles intentions ennemies', () => {
  it('la Dissonance supprime la Résonance de la chaîne suivante', () => {
    const s = creerCombat({ porteurs: equipe(), ennemiId: 'brigadier', rng: 3 });
    expect(s.intention.type).toBe('dissonance');
    // premier tour : une chaîne quelconque, puis le Brigadier brouille les Fréquences
    s.main = [geste(1, 'a')]; s.chaine = [s.main.pop()!];
    lancer(s, { silencieux: true });
    expect(s.dissonance).toBe(true);
    // la suite 3-4-5 ne résonne pas : 30 dégâts exactement (10 + 10 + 10, avantage de lignée Tech contre Résonant)
    const avant = s.ennemi.pv;
    s.ennemi.bouclier = 0;
    s.chaine = [geste(3, 'b'), geste(4, 'c'), geste(5, 'd')];
    lancer(s, { silencieux: true });
    expect(avant - s.ennemi.pv).toBe(Math.round(10 * 1.15) * 3);
    expect(s.dissonance).toBe(false);
  });

  it('un ennemi qui se répare regagne des PV, sans dépasser son maximum', () => {
    const s = creerCombat({ porteurs: equipe(), ennemiId: 'pilleur', rng: 3 });
    s.ennemi.etape = 3; // la prochaine intention est Stimulant
    s.main = [geste(1, 'a')]; s.chaine = [s.main.pop()!];
    lancer(s, { silencieux: true }); // joue l'intention du tour 1 (Pied-de-biche)
    expect(s.intention.type).toBe('soin');
    s.ennemi.pv -= 20;
    const avant = s.ennemi.pv;
    s.chaine = [geste(9, 'z')]; s.chaine[0]!.v = 0;
    lancer(s, { silencieux: true });
    expect(s.ennemi.pv).toBeGreaterThan(avant);
    expect(s.ennemi.pv).toBeLessThanOrEqual(s.ennemi.pvMax);
  });
});

import { nouveauJeu, porteursPresents, tick, verifierArrivees } from '../src/core/jeu';

describe('Les Porteurs de l’histoire', () => {
  it('Sasha arrive avec la Forge niveau 2, Nuit à la Strate −3, Aurel à la Strate −5', () => {
    const j = nouveauJeu(0, 1);
    j.chambre = true; j.recrues = true;
    expect(porteursPresents(j)).not.toContain('sasha');
    j.batiments.forge = 2;
    expect(verifierArrivees(j)[0]).toContain('Sasha Ndiaro');
    expect(porteursPresents(j)).toContain('sasha');
    j.strate = 3;
    tick(j, 1000);
    expect(porteursPresents(j)).toContain('nuit');
    expect(porteursPresents(j)).not.toContain('aurel');
    j.strate = 5;
    // Kessa (Strate −4) et Aurel (Strate −5) arrivent ensemble quand on saute de −3 à −5
    expect(verifierArrivees(j)).toHaveLength(2);
    expect(porteursPresents(j)).toContain('kessa');
    expect(porteursPresents(j)).toContain('aurel');
    expect(verifierArrivees(j)).toHaveLength(0); // une seule fois
  });

  it('personne n’arrive avant l’ouverture de la chambre', () => {
    const j = nouveauJeu(0, 1);
    j.strate = 9; j.batiments.forge = 5;
    expect(verifierArrivees(j)).toHaveLength(0);
  });
});

import { decisionEnAttente, deciderChambre } from '../src/core/jeu';

describe('Acte I : qui garde la chambre ?', () => {
  it('la décision arrive après la Strate −3, une seule fois', () => {
    const j = nouveauJeu(0, 1);
    j.chambre = true; j.strate = 3;
    expect(decisionEnAttente(j)).toBeNull();
    j.frontVaincu = true; // le gardien de −3 tombe : la décision suit la scène, sans attendre l'étage suivant
    expect(decisionEnAttente(j)).toBe('chambre');
    expect(deciderChambre(j, 'personne').ok).toBe(false);
    expect(deciderChambre(j, 'commission').ok).toBe(true);
    expect(decisionEnAttente(j)).toBeNull();
    expect(deciderChambre(j, 'orseve').ok).toBe(false);
  });

  it('les Brigades disparaissent si Orsève garde la chambre, et s’imposent si le district la garde seul', () => {
    for (let rng = 1; rng < 40; rng++) {
      expect(sequenceStrate(5, rng, 'orseve')).not.toContain('brigadier');
      expect(sequenceStrate(5, rng, 'district')).toContain('brigadier');
    }
  });
});

import { decider, gestesDe, pvMaxCombat } from '../src/core/jeu';

describe('Acte II : la dernière lecture de Véla', () => {
  it('arrive après la Strate −6, une fois la chambre confiée', () => {
    const j = nouveauJeu(0, 1);
    j.chambre = true; j.strate = 7;
    expect(decisionEnAttente(j)).toBe('chambre'); // l'acte I d'abord
    decider(j, 'chambre', 'district');
    expect(decisionEnAttente(j)).toBe('lecture');
  });

  it('autoriser : Lecture profonde et −4 PV ; refuser : +4 PV', () => {
    const a = nouveauJeu(0, 1); a.chambre = true; a.strate = 7; a.actes.chambre = 'orseve';
    const pv = pvMaxCombat(a, 'vela');
    expect(decider(a, 'lecture', 'autoriser').ok).toBe(true);
    expect(pvMaxCombat(a, 'vela')).toBe(pv - 4);
    expect(gestesDe(a, 'vela').map((g) => g.nom)).toContain('Lecture profonde');
    const r = nouveauJeu(0, 1); r.chambre = true; r.strate = 7; r.actes.chambre = 'orseve';
    decider(r, 'lecture', 'refuser');
    expect(pvMaxCombat(r, 'vela')).toBe(pv + 4);
    expect(gestesDe(r, 'vela').map((g) => g.nom)).not.toContain('Lecture profonde');
  });
});

import { tirerRarete } from '../src/core/collection';
import { dureeChantier, partir } from '../src/core/jeu';

describe('Acte III : les trois fins', () => {
  it('la fin arrive après le Premier Porteur (Strate −10), une fois les deux autres choix faits', () => {
    const j = nouveauJeu(0, 1);
    j.chambre = true; j.strate = 11; j.actes = { chambre: 'commission', lecture: 'refuser' };
    expect(decisionEnAttente(j)).toBe('fin');
    expect(decider(j, 'fin', 'pacte').ok).toBe(true);
    expect(decisionEnAttente(j)).toBeNull();
  });

  it('le Grand Scellement adoucit les ennemis et fait disparaître la nacre', () => {
    const j = nouveauJeu(0, 1);
    j.chambre = true; j.recrues = true; j.strate = 12; j.actes = { chambre: 'orseve', lecture: 'refuser', fin: 'scellement' };
    expect(partir(j, ['ilka', 'doran', 'vela'], 12, 5).ok).toBe(true);
    expect(j.expedition!.facteur).toBe(0.9);
    const e = { collection: {}, sans: { argent: 0, or: 0, nacre: 599 }, rng: 3, actes: { fin: 'scellement' } };
    for (let k = 0; k < 300; k++) expect(tirerRarete(e, 12)).not.toBe('nacre');
  });

  it('le Pacte allonge les chantiers', () => {
    const j = nouveauJeu(0, 1);
    j.batiments.forge = 3;
    const avant = dureeChantier(j, 'forge');
    expect(avant).toBeGreaterThan(0);
    j.actes.fin = 'pacte';
    expect(dureeChantier(j, 'forge')).toBe(Math.round(avant * 1.25));
  });
});

import { CONFIANCE, CREUSEURS, confier, coutPompe, energieParHeure, niveauConfiance, nuitDesLignes, pomper, recompenserConfiance } from '../src/core/jeu';
import { ORDRE_FAMILLES } from '../src/core/fragments';
import { estJeuValide } from '../src/core/jeu';

describe('La Confiance du quartier (30 octobre 2026 : les habitants qui te suivent)', () => {
  it('commence à 20 habitants, ne baisse jamais et plafonne à 600', () => {
    const j = nouveauJeu(0, 1);
    expect(j.confiance).toBe(CONFIANCE.depart);
    confier(j, -50);
    expect(j.confiance).toBe(CONFIANCE.depart);
    expect(niveauConfiance(CONFIANCE.palier - 1).niveau).toBe(0);
    expect(niveauConfiance(CONFIANCE.palier).niveau).toBe(1);
    expect(niveauConfiance(2 * CONFIANCE.palier + 10)).toEqual({ niveau: 2, dans: 10, requis: CONFIANCE.palier });
    expect(confier(j, 10_000)).toBe(CONFIANCE.population - CONFIANCE.depart);
    expect(j.confiance).toBe(CONFIANCE.population);
    expect(niveauConfiance(j.confiance)).toEqual({ niveau: 8, dans: CONFIANCE.palier, requis: 0 });
  });

  it('chaque palier amène un creuseur volontaire et un souvenir de famille, une seule fois', () => {
    const j = nouveauJeu(0, 1); j.chambre = true;
    j.creuseurs = 0;
    confier(j, 2 * CONFIANCE.palier);
    expect(recompenserConfiance(j)).toHaveLength(2);
    expect(j.creuseurs).toBe(2 * CREUSEURS.confiance);
    expect(j.fragments.filter((f) => ORDRE_FAMILLES.includes(f))).toEqual(ORDRE_FAMILLES.slice(0, 2));
    expect(recompenserConfiance(j)).toHaveLength(0);
  });

  it('les pompes : 7 par semaine, six heures de production chacune, +3 habitants', () => {
    const j = nouveauJeu(0, 1); j.chambre = true; j.batiments.generateur = 3;
    j.energie = 1e6;
    const cout = coutPompe(j);
    expect(cout).toBe(Math.round(energieParHeure(j) * 6 / 10) * 10);
    const avant = j.confiance;
    for (let k = 0; k < CONFIANCE.pompesSemaine; k++) expect(pomper(j, 0).ok).toBe(true);
    expect(pomper(j, 0).ok).toBe(false);
    expect(j.confiance - avant).toBe(CONFIANCE.pompesSemaine * CONFIANCE.pompe);
    expect(j.energie).toBe(1e6 - CONFIANCE.pompesSemaine * cout);
    // la semaine suivante, les pompes repartent
    expect(pomper(j, 8 * 86_400_000).ok).toBe(true);
  });

  it('la Nuit des lignes ajoute 15 % des habitants gagnés de la semaine, et rien si on n’a pas joué', () => {
    const j = nouveauJeu(0, 1); j.chambre = true;
    confier(j, 40, 'naufrages', 0);
    const avant = j.confiance;
    expect(nuitDesLignes(j, 7 * 86_400_000 * 2)).toContain('Nuit des lignes');
    expect(j.confiance - avant).toBe(6);
    expect(j.lignes?.derniere).toMatchObject({ gagnes: 40, bonus: 6, sources: { naufrages: 40 } });
    // une semaine sans rien : pas de bilan, rien de perdu
    expect(nuitDesLignes(j, 7 * 86_400_000 * 4)).toBeNull();
    expect(j.confiance).toBe(avant + 6);
  });


  it('le choix de l’acte I la fait monter', () => {
    const j = nouveauJeu(0, 1); j.chambre = true; j.strate = 4;
    decider(j, 'chambre', 'district');
    expect(j.confiance).toBe(CONFIANCE.depart + 10);
  });
});

import { bonusEscouade, progresMarque, remonter } from '../src/core/jeu';
import { creerCombat as creer } from '../src/core/combat';

describe('Les Marques des Porteurs', () => {
  it('Doran gagne Fondations après 20 combats dans les Fondations, et l’escouade commence avec du bouclier', () => {
    const j = nouveauJeu(0, 1);
    j.chambre = true; j.recrues = true;
    j.porteurs.doran!.faits = { fondations: 19 };
    expect(progresMarque(j, 'doran')!.acquise).toBe(false);
    j.porteurs.doran!.faits.fondations = 20;
    expect(bonusEscouade(j, ['ilka', 'doran', 'vela'])).toEqual({ bouclier: 8 });
    expect(partir(j, ['ilka', 'doran', 'vela'], 1, 3).ok).toBe(true);
    expect(j.expedition!.bonus).toEqual({ bouclier: 8 });
  });

  it('Véla Lectrice : la Dissonance n’a plus de prise', () => {
    const s = creer({ porteurs: PORTEURS.slice(0, 3).map((p) => ({ id: p.id, pv: p.pvMax, pvMax: p.pvMax, aTerre: false })), ennemiId: 'brigadier', rng: 3, bonus: { lucide: true } });
    s.chaine = [{ id: 'a', uid: 'a', porteur: 'ilka', nom: 'T', f: 1, type: 'atk', v: 1 }];
    lancer(s, { silencieux: true });
    expect(s.dissonance).toBeFalsy();
  });

  it('une expédition remontée compte pour les Marques', () => {
    const j = nouveauJeu(0, 1);
    j.chambre = true; j.recrues = true;
    partir(j, ['ilka', 'doran', 'vela'], 1, 3);
    j.expedition!.combat.issue = 'defaite';
    j.expedition!.terminee = true;
    remonter(j);
    expect(j.porteurs.ilka!.faits).toBeDefined();
  });
});

describe('Les habitants viennent de ce qui protège les gens (30 octobre 2026)', () => {
  it('les combats ordinaires et les chantiers n’en rapportent plus ; une vieille sauvegarde est convertie', () => {
    const j = nouveauJeu(0, 1); j.chambre = true;
    j.chantiers.push({ batiment: 'forge', debut: 0, fin: 1 } as never);
    const avant = j.confiance;
    tick(j, 10);
    expect(j.confiance).toBe(avant);
    // une sauvegarde aux anciens points (385 au jour 30) : 20 + 80 % des points, paliers acquis sans creuseur d'un coup
    const vieille = JSON.parse(JSON.stringify(nouveauJeu(0, 2))) as typeof j;
    delete vieille.confianceV; vieille.confiance = 385; vieille.confianceRecue = 5; vieille.creuseurs = 3;
    expect(estJeuValide(vieille)).toBe(true);
    expect(vieille.confiance).toBe(328);
    expect(vieille.confianceRecue).toBe(5);
    expect(vieille.fragments.filter((f) => ORDRE_FAMILLES.includes(f))).toHaveLength(5);
    expect(recompenserConfiance(vieille)).toHaveLength(0);
    expect(vieille.creuseurs).toBe(3);
  });
});
