import { affinite, lieuDef } from '../src/core/lieux';
import { describe, expect, it } from 'vitest';
import { FORCE, accessibles, genererCarte, salleCourante } from '../src/core/expedition';
import { moduleDef, porteurDef } from '../src/core/donnees';
import {
  EPREUVES, MISSIONS, barquesMax, naufragesDeLaStrate, rendementMission, secoursPossible, creuseursRequis, CREUSEURS, entrer, envoyerMission, destinationsDuJour, bonusMission, niveauPorteur, jourDe, lireRapport, rapportALire, epreuvesDeLaSemaine, fouiller, nouveauJeu, partir, partirEpreuve, poster,
  remonter, tick, type Jeu,
} from '../src/core/jeu';
import { simulerParcours, PROFILS } from '../src/core/parcours';

const H = 3_600_000;
const T0 = Date.UTC(2026, 9, 21, 12);
/** une partie qui a vaincu les Strates −1 à −3 */
const avance = (): Jeu => { const j = nouveauJeu(T0, 1); j.chambre = true; j.recrues = true; j.strate = 4; return j; };

describe('La difficulté des Strates', () => {
  it('la force des ennemis monte à chaque Strate, sans jamais redescendre', () => {
    for (let s = 1; s < 20; s++) expect(FORCE.table.length).toBeGreaterThan(0);
    const f = Array.from({ length: 20 }, (_, i) => FORCE.table[i] ?? FORCE.table[FORCE.table.length - 1]! * FORCE.ensuite ** (i + 1 - FORCE.table.length));
    for (let i = 1; i < f.length; i++) expect(f[i]).toBeGreaterThan(f[i - 1]!);
  });
});

describe('Fouilles ciblées', () => {
  it('une carte de fouille est courte et finit sur un filon, sans gardien ni salle scellée', () => {
    for (const rng of [1, 5, 42]) {
      const c = genererCarte(3, rng, undefined, true);
      expect(Math.max(...c.salles.map((s) => s.rang))).toBe(3);
      expect(c.salles[c.salles.length - 1]!.type).toBe('filon');
      expect(c.salles.some((s) => s.type === 'gardien' || s.type === 'elite')).toBe(false);
    }
  });

  it('on ne fouille que les Strates déjà vaincues', () => {
    const j = avance();
    expect(fouiller(j, ['ilka', 'doran', 'vela'], 4, 'tech', 3).ok).toBe(false);
    expect(fouiller(j, ['ilka', 'doran', 'vela'], 2, 'tech', 3).ok).toBe(true);
    expect(j.expedition!.fouille).toBe('tech');
  });

  it('atteindre le filon d’une fouille de cartes donne trois cartes au choix de la lignée visée', () => {
    const j = avance();
    fouiller(j, ['ilka', 'doran', 'vela'], 2, 'bio', 3);
    let garde = 0;
    while (!j.expedition!.terminee && garde++ < 20) {
      const x = j.expedition!;
      if (x.rencontre) { j.expedition = { ...x, rencontre: undefined }; continue; }
      if (x.phase === 'combat') { j.expedition = { ...x, phase: 'carte', combat: { ...x.combat, issue: 'victoire' } }; continue; }
      entrer(j, accessibles(j.expedition!)[0]!.id);
    }
    expect(salleCourante(j.expedition!).type).toBe('filon');
    const r = remonter(j);
    expect(r.victoire).toBe(true);
    expect(r.nouvelleStrate).toBe(false);
    const choix = j.choix.find((c) => c.source === 'fouille')!;
    expect(choix.options).toHaveLength(3);
    for (const id of choix.options) expect(moduleDef(id).lignee).toBe('bio');
  });
});

describe('Missions', () => {
  it('un Porteur libre part en mission, n’est plus disponible, et revient avec des composants et des cartes de sa lignée', () => {
    const j = avance();
    for (const id of ['coursier', 'docker', 'guetteur']) poster(j, id, null);
    j.batiments.noyau = 3; // deux barques au niveau 3 de la Tour
    const compo = j.composants;
    j.energie = MISSIONS.courte.energie + MISSIONS.longue.energie;
    expect(envoyerMission(j, 'docker', 'courte', T0).ok).toBe(true);
    // une mission s'équipe avec de l'énergie (23 octobre 2026)
    expect(j.energie).toBe(MISSIONS.longue.energie);
    expect(partir(j, ['ilka', 'docker', 'vela'], 1, 3).ok).toBe(false);
    expect(envoyerMission(j, 'coursier', 'longue', T0).ok).toBe(true);
    expect(envoyerMission(j, 'guetteur', 'courte', T0).ok).toBe(false); // deux barques au plus à ce niveau
    tick(j, T0 + 2 * H + 1);
    expect(j.missions).toHaveLength(1);
    expect(j.composants).toBeGreaterThan(compo);
    expect(j.porteurs.docker!.usure).toBeGreaterThanOrEqual(MISSIONS.courte.usure); // +2 si la seule destination libre est du mauvais type
    tick(j, T0 + 8 * H + 1);
    expect(j.missions).toHaveLength(0);
  });

  it('chaque retour laisse un rapport à lire, même quand deux missions rentrent ensemble (28 octobre 2026)', () => {
    const j = avance();
    for (const id of ['coursier', 'docker']) poster(j, id, null);
    j.batiments.noyau = 3;
    j.energie = 2 * MISSIONS.courte.energie;
    envoyerMission(j, 'docker', 'courte', T0);
    envoyerMission(j, 'coursier', 'courte', T0 + 1000);
    tick(j, T0 + 3 * H); // les deux rentrent pendant la même absence
    expect(j.rapports!.filter((r) => !r.lu).map((r) => r.porteur)).toEqual(['docker', 'coursier']);
    const r = rapportALire(j)!;
    expect(r.recit.length).toBeGreaterThanOrEqual(3);
    expect(r.composants).toBeGreaterThan(0);
    expect(lireRapport(j).ok).toBe(true);
    expect(rapportALire(j)!.porteur).toBe('coursier');
    lireRapport(j);
    expect(rapportALire(j)).toBeNull();
    expect(j.rapports).toHaveLength(2); // gardés pour les relire à la Tour
  });

  it('les barques en mer suivent la Tour du Noyau : 1, puis 2 au niveau 3, 3 au 6, 4 au 9 (28 octobre 2026)', () => {
    const j = avance();
    expect([1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => { j.batiments.noyau = n; return barquesMax(j); })).toEqual([1, 1, 2, 2, 2, 3, 3, 3, 4, 4]);
    for (const id of ['coursier', 'docker']) poster(j, id, null);
    j.batiments.noyau = 1;
    j.energie = 2 * MISSIONS.courte.energie;
    expect(envoyerMission(j, 'docker', 'courte', T0).ok).toBe(true);
    expect(envoyerMission(j, 'coursier', 'courte', T0).ok).toBe(false);
  });

  it('de 2 à 5 destinations par jour, et sur la semaine autant pour chaque lignée et chaque butin (28 octobre 2026)', () => {
    const lundi = T0 - (((jourDe(T0) % 7) + 7) % 7) * 24 * H;
    const semaine = Array.from({ length: 7 }, (_, k) => destinationsDuJour(lundi + k * 24 * H));
    for (const jour of semaine) {
      expect(jour.length).toBeGreaterThanOrEqual(2);
      expect(jour.length).toBeLessThanOrEqual(5);
      expect(new Set(jour.map((d) => d.lieu.id)).size).toBe(jour.length); // jamais deux fois le même lieu le même jour
    }
    const toutes = semaine.flat();
    expect(toutes).toHaveLength(21);
    for (const lg of ['tech', 'bio', 'reso']) {
      const l = toutes.filter((d) => d.lieu.lignee === lg);
      expect(l).toHaveLength(7);
      expect(l.filter((d) => d.butin === 'cargaison')).toHaveLength(2);
      expect(l.filter((d) => d.butin === 'pierre')).toHaveLength(2);
      expect(l.filter((d) => d.butin === 'naufrages')).toHaveLength(2);
      expect(l.filter((d) => d.butin === 'eclats')).toHaveLength(1);
    }
    expect(destinationsDuJour(T0 + H).map((d) => d.cle)).toEqual(destinationsDuJour(T0).map((d) => d.cle)); // les mêmes toute la journée
  });

  it('le niveau et l’affinité changent le butin ; la pierre rapporte une carte à coup sûr', () => {
    const j = avance();
    for (const id of ['coursier', 'docker', 'guetteur']) poster(j, id, null);
    j.energie = 500;
    const n = niveauPorteur(j, 'docker').niveau;
    const lg = porteurDef('docker').lignee;
    const lieuDe = (a: 'bon' | 'mauvais' | 'neutre') => ['pompage', 'serres', 'clocher'].find((id) => affinite(lieuDef(id)!.lignee, lg) === a)!;
    expect(bonusMission(j, 'docker', lieuDe('bon')).mult).toBeCloseTo((1 + 0.03 * (n - 1)) * 1.3);
    expect(bonusMission(j, 'docker', lieuDe('mauvais')).mult).toBeCloseTo((1 + 0.03 * (n - 1)) * 0.8);
    expect(bonusMission(j, 'docker', lieuDe('neutre')).mult).toBeCloseTo(1 + 0.03 * (n - 1));
    // une destination Pierre oubliée, cherchée sur quelques jours
    let t = T0;
    let d = destinationsDuJour(t).find((x) => x.butin === 'pierre');
    for (let k = 1; !d && k < 14; k++) { t = T0 + k * 24 * H; d = destinationsDuJour(t).find((x) => x.butin === 'pierre'); }
    expect(d).toBeDefined();
    const cartes = Object.values(j.collection).reduce((a, x) => a + (typeof x === 'number' ? x : 1), 0);
    expect(envoyerMission(j, 'docker', 'courte', t, d!.cle).ok).toBe(true);
    expect(envoyerMission(j, 'coursier', 'courte', t, d!.cle).ok).toBe(false); // une seule barque au niveau 1 de la Tour
    tick(j, t + 2 * H + 1);
    const r = rapportALire(j)!;
    expect(r.butin).toBe('pierre');
    expect(r.cartes).toHaveLength(1);
    expect(cartes).toBeGreaterThan(0);
  });

  it('pas de mission avant d’avoir vaincu une Strate', () => {
    const j = avance();
    j.strate = 1;
    expect(envoyerMission(j, 'docker', 'courte', T0).ok).toBe(false);
  });
});

describe('Missions illimitées (idée de Luc, 28 octobre 2026)', () => {
  /** un jour qui propose des naufragés */
  const jourAvec = (butin: string) => { let t = T0; for (let k = 0; k < 14 && !destinationsDuJour(t).some((x) => x.butin === butin); k++) t = T0 + k * 24 * H; return t; };

  it('on retourne à la même destination autant qu’on veut, et seules les barques limitent les départs', () => {
    const j = avance();
    for (const id of ['coursier', 'docker', 'guetteur']) poster(j, id, null);
    j.energie = 5000;
    const t = jourAvec('cargaison');
    const d = destinationsDuJour(t).find((x) => x.butin === 'cargaison')!;
    for (let k = 0; k < 5; k++) {
      expect(envoyerMission(j, 'docker', 'courte', t + k * 2.5 * H, d.cle).ok).toBe(true);
      tick(j, t + k * 2.5 * H + 2 * H + 1);
    }
    expect(j.rapports!.length).toBe(5);
  });

  it('les premiers départs du jour reviennent pleins, les suivants rapportent moins (100 %, 50 %, 25 %)', () => {
    const j = avance();
    j.energie = 5000;
    const parts: number[] = [];
    for (let k = 0; k < 10; k++) { parts.push(rendementMission(j, T0).part); j.departsJour = { jour: jourDe(T0), n: k + 1 }; }
    expect(parts).toEqual([1, 1, 1, 1, 0.5, 0.5, 0.5, 0.5, 0.25, 0.25]);
    expect(rendementMission(j, T0 + 24 * H).part).toBe(1); // le lendemain, tout repart à plein
  });

  it('les naufragés d’un lieu ne montent qu’une fois par jour, et pas au-delà du plafond de la Strate', () => {
    const j = avance();
    for (const id of ['coursier', 'docker', 'guetteur']) poster(j, id, null);
    j.energie = 5000;
    const t = jourAvec('naufrages');
    const d = destinationsDuJour(t).find((x) => x.butin === 'naufrages')!;
    const nf = naufragesDeLaStrate(j);
    expect(nf.plafond).toBe(Math.max(1, Math.round(creuseursRequis(j.strate + 1) * CREUSEURS.naufragesParStrate)));
    expect(secoursPossible(j, d, t)).toBe(true);
    expect(envoyerMission(j, 'docker', 'courte', t, d.cle).ok).toBe(true);
    expect(secoursPossible(j, d, t)).toBe(false); // recueillis par la première barque
    tick(j, t + 2 * H + 1);
    expect(j.rapports!.at(-1)!.creuseurs).toBe(1);
    expect(envoyerMission(j, 'docker', 'courte', t + 3 * H, d.cle).ok).toBe(true);
    tick(j, t + 5 * H + 1);
    expect(j.rapports!.at(-1)!.creuseurs).toBe(0); // plus personne : des composants à la place
    // plafond atteint : plus de creuseurs en mer pour cette Strate, même le lendemain
    j.naufrages = { strate: j.strate, n: nf.plafond };
    expect(naufragesDeLaStrate(j).restants).toBe(0);
    expect(secoursPossible(j, d, t + 24 * H)).toBe(false);
    // la Strate suivante ouvre un nouveau plafond
    j.strate++;
    expect(naufragesDeLaStrate(j).restants).toBeGreaterThan(0);
  });
});

describe('Épreuves de la semaine', () => {
  it('trois Épreuves différentes par semaine, les mêmes pour tous, qui changent d’une semaine à l’autre', () => {
    const a = epreuvesDeLaSemaine(T0).map((e) => e.id);
    expect(new Set(a).size).toBe(3);
    expect(epreuvesDeLaSemaine(T0 + H).map((e) => e.id)).toEqual(a);
    const semaines = new Set(Array.from({ length: 6 }, (_, k) => epreuvesDeLaSemaine(T0 + k * 7 * 24 * H).map((e) => e.id).join()));
    expect(semaines.size).toBeGreaterThan(1);
  });

  it('une Épreuve applique sa règle, et sa première victoire de la semaine donne un choix avec une carte en argent au moins', () => {
    for (const ep of EPREUVES) {
      const j = avance();
      const semaine = Array.from({ length: 30 }, (_, k) => T0 + k * 7 * 24 * H).find((t) => epreuvesDeLaSemaine(t).some((e) => e.id === ep.id))!;
      tick(j, semaine);
      const escouade = ep.interdits ? ['coursier', 'docker', 'guetteur'] : ['ilka', 'doran', 'vela'];
      for (const id of escouade) poster(j, id, null);
      const r = partirEpreuve(j, escouade, ep.id, semaine, 3);
      if (!r.ok) { expect(r.message).toMatch(/deck/); continue; }
      const x = j.expedition!;
      expect(x.epreuve).toBe(ep.id);
      if (ep.sansResonance) expect(x.combat.sansResonance).toBe(true);
      if (ep.filtre) for (const g of x.deck) expect(g.porteur === null || ep.filtre(g)).toBe(true);
      x.combat.issue = 'victoire';
      j.expedition = { ...x, terminee: true, cloture: true };
      remonter(j);
      const c = j.choix.find((k) => k.source === 'epreuve')!;
      expect(['argent', 'or', 'nacre']).toContain(moduleDef(c.options[0]!).rarete);
      // une seule récompense par semaine
      j.choix = [];
      partirEpreuve(j, escouade, ep.id, semaine, 4);
      j.expedition!.combat.issue = 'victoire';
      j.expedition = { ...j.expedition!, terminee: true, cloture: true };
      remonter(j);
      expect(j.choix.some((k) => k.source === 'epreuve')).toBe(false);
    }
  });

  it('La relève refuse Ilka, Doran et Véla', () => {
    const j = avance();
    const semaine = Array.from({ length: 30 }, (_, k) => T0 + k * 7 * 24 * H).find((t) => epreuvesDeLaSemaine(t).some((e) => e.id === 'releve'))!;
    expect(partirEpreuve(j, ['ilka', 'docker', 'guetteur'], 'releve', semaine, 3).ok).toBe(false);
  });
});

describe('Le parcours d’un joueur', () => {
  it('une partie simulée avance de Strate en Strate et reste reproductible', () => {
    const a = simulerParcours(PROFILS.occasionnel, 8, 7);
    expect(a.strate).toBeGreaterThanOrEqual(2);
    expect(simulerParcours(PROFILS.occasionnel, 8, 7)).toEqual(a);
  });
});

describe('L’énergie, ressource à part entière (23 octobre 2026)', () => {
  it('une mission sans assez d’énergie ne part pas', () => {
    const j = avance();
    for (const id of ['coursier', 'docker', 'guetteur']) poster(j, id, null);
    j.energie = MISSIONS.courte.energie - 1;
    expect(envoyerMission(j, 'docker', 'courte', T0).ok).toBe(false);
  });
});

describe('La Forge tourne à l’énergie', () => {
  it('refabriquer coûte de l’énergie', async () => {
    const { fabriquer, coutRefabrication } = await import('../src/core/jeu');
    const j = avance();
    const forgeron = Object.keys(j.porteurs).find((id) => !j.porteurs[id]!.poste && id !== 'ilka')!;
    poster(j, forgeron, 'forge');
    const carte = Object.keys(j.collection)[0]!;
    const c = coutRefabrication(carte);
    j.composants = c.composants; j.eclats = c.eclats; j.energie = c.energie - 1;
    expect(fabriquer(j, carte, T0).ok).toBe(false);
    j.energie = c.energie;
    expect(fabriquer(j, carte, T0).ok).toBe(true);
    expect(j.energie).toBe(0);
  });
});
