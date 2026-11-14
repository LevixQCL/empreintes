// Les pillages (26 octobre 2026) : garnison, force des gardes, butin, coffre, jetons et attaques subies.
import { describe, expect, it } from 'vitest';
import {
  ESCOUADES_STRATE,
  PILLAGE, butinPillage, chanceVictoire, choisirDefense, cibleDe, escouadeDefense, escouadesDe, placerDansEscouade, ciblesBots, etatPillage, forceEscouade, garnisonDe, majJetons, multButin,
  nouveauJeu, piller, protege, remonter, subirPillages, type Cible,
  changerPavillon, pavillonDe, lancerPillageDuel, finirPillageDuel, pillageEnSuspens, choisirConsigne, noterChoixDuel, rejouerDuel, exposeDe, perteDe, porteeDe, placeDe, distance, traversee, revanchesOuvertes,
} from '../src/core/jeu';
import { jouerTourMoyen } from '../src/core/robot';
import { appliquerChoix, choixRobot, creerDuel, resoudreTour } from '../src/core/duel';
import { escouadeDuelDe } from '../src/core/duel-escouade';

const ESC = ['ilka', 'doran', 'vela'];
// les pillages s'ouvrent après le gardien de −3 (2 novembre 2026)
const pret = (strate: number = PILLAGE.strateMin) => { const j = nouveauJeu(0, 1); j.chambre = true; j.recrues = true; j.strate = strate; j.frontVaincu = true; return j; };

/** Joue le pillage en cours jusqu'au bout (joueur moyen) et remonte */
function jouer(j: ReturnType<typeof pret>) {
  const s = j.expedition!.combat;
  for (let t = 0; s.issue === 'en-cours' && t < 80; t++) jouerTourMoyen(s);
  return remonter(j);
}

describe('Les pillages', () => {
  it('la garnison reprend l’escouade, ses PV et ses cartes', () => {
    const g = garnisonDe(pret(1));
    expect(g.porteurs.map((p) => p.id)).toEqual(ESC);
    expect(g.porteurs.every((p) => p.pv > 0 && p.cartes.length > 0)).toBe(true);
    expect(g.strate).toBe(1);
  });

  it('la garnison se choisit parmi les escouades, pas forcément celle qui descend', () => {
    const j = pret(ESCOUADES_STRATE);
    expect(placerDansEscouade(j, 0, 'vela', 1).ok).toBe(true);
    expect(escouadesDe(j)[1]).toEqual(['vela']);
    expect(choisirDefense(j, 2).ok).toBe(false);
    expect(choisirDefense(j, 1).ok).toBe(true);
    expect(escouadeDefense(j)).toBe(1);
    expect(garnisonDe(j).porteurs[0]!.id).toBe('vela');
    // l'escouade qui descend ne change pas
    expect(escouadesDe(j)[0]).not.toContain('vela');
  });

  it('le journal du port garde les pillages faits et subis, les plus récents d’abord', () => {
    const j = pret();
    const cible = { ...cibleDe('miroir', 'Miroir', garnisonDe(j)), pavillon: 'pirate' as const };
    expect(piller(j, ESC, cible, 1000, 7).ok).toBe(true);
    j.dernierTick = 2000;
    const r = jouer(j);
    subirPillages(j, [{ id: 'a', nom: 'Rival', victoire: false, vol: 0, perte: 3, le: 5000 }]);
    const h = etatPillage(j).historique!;
    expect(h.map((x) => x.sens)).toEqual(['defense', 'attaque']);
    expect(h[1]!.gagne).toBe(r.victoire);
    expect(h[0]).toMatchObject({ nom: 'Rival', gagne: true });
  });

  it('contre sa propre garnison, le joueur moyen gagne environ une fois sur deux', () => {
    let v = 0;
    const n = 60;
    for (let k = 0; k < n; k++) {
      const j = pret();
      const cible = { ...cibleDe('miroir', 'Miroir', garnisonDe(j)), pavillon: 'pirate' as const };
      expect(piller(j, ESC, cible, 0, 1 + k * 7919).ok).toBe(true);
      if (jouer(j).victoire) v++;
    }
    expect(v / n).toBeGreaterThan(0.3);
    expect(v / n).toBeLessThan(0.75);
  });

  it('le butin suit l’écart de force, et le meilleur gain moyen est à force égale ou un peu au-dessus', () => {
    expect(multButin(0.8)).toBe(PILLAGE.multMin);
    expect(multButin(1)).toBe(1);
    expect(multButin(1.3)).toBe(PILLAGE.multMax);
    const moyen = (e: number) => chanceVictoire(e) * multButin(e);
    expect(moyen(1)).toBeGreaterThan(moyen(0.85));
    expect(moyen(1)).toBeGreaterThan(moyen(1.15));
  });

  it('une victoire prend tout le minerai exposé, plafonné ; un pirate expose 3 % de son minerai, un neutre rien', () => {
    expect(butinPillage({ strate: 5, coffre: 20 }, 1).vol).toBe(20);
    expect(butinPillage({ strate: 5, coffre: 100000 }, 1).vol).toBe(PILLAGE.plafondVol * 12);
    expect(exposeDe(1000, 5)).toBe(30);
    expect(exposeDe(100000, 5)).toBe(PILLAGE.plafondVol * 12);
    const j = pret();
    j.composants = 1000;
    expect(garnisonDe(j).coffre).toBe(0);
    changerPavillon(j, 'pirate', 0);
    expect(garnisonDe(j).coffre).toBe(exposeDe(1000, PILLAGE.strateMin));
  });

  it('un neutre qui attaque un directeur devient pirate, et ne rabat le pavillon que 72 h après', () => {
    const j = pret();
    expect(pavillonDe(j)).toBe('neutre');
    const bot = ciblesBots(j, forceEscouade(j, ESC), 0, 6)[0]!;
    expect(piller(j, ESC, bot, 0, 1).ok).toBe(true);
    jouer(j);
    expect(pavillonDe(j)).toBe('neutre');
    for (const id of ESC) j.porteurs[id]!.usure = 0;
    const rival: Cible = { ...cibleDe('rival', 'Rival', garnisonDe(pret())), pavillon: 'pirate' };
    const neutre: Cible = { ...rival, id: 'calme', pavillon: 'neutre' };
    expect(piller(j, ESC, neutre, 0, 2).ok).toBe(false);
    expect(piller(j, ESC, rival, 1000, 2).ok).toBe(true);
    expect(pavillonDe(j)).toBe('pirate');
    jouer(j);
    expect(changerPavillon(j, 'neutre', 1000 + 71 * 3_600_000).ok).toBe(false);
    expect(changerPavillon(j, 'neutre', 1000 + 72 * 3_600_000).ok).toBe(true);
  });

  it('les cibles hors de portée, la carte fixe et la traversée', () => {
    const c: Cible = { id: 'a', nom: 'A', porteurs: ESC, force: 10, strate: 5, coffre: 0, pavillon: 'pirate' };
    expect(porteeDe(c, 10)).toBe('ok');
    expect(porteeDe({ ...c, force: 8 }, 10)).toBe('faible');
    expect(porteeDe({ ...c, force: 12 }, 10)).toBe('forte');
    expect(porteeDe({ ...c, force: 12 }, 10, true)).toBe('ok');
    expect(porteeDe({ ...c, pavillon: 'neutre' }, 10)).toBe('neutre');
    expect(placeDe('abc')).toEqual(placeDe('abc'));
    expect(distance('abc', 'xyz')).toBe(distance('xyz', 'abc'));
    expect(distance('abc', 'xyz')).toBeLessThanOrEqual(708);
    expect(traversee(0)).toBe(PILLAGE.traversee.min);
    expect(traversee(5000)).toBe(PILLAGE.traversee.max);
    // les districts sans directeur gardent leur place et leur nom d'un jour à l'autre
    const j = pret();
    const a = ciblesBots(j, 5, 1, 6, 'moi'), b = ciblesBots(j, 5, 2, 6, 'moi');
    expect(a.map((x) => x.nom)).toEqual(b.map((x) => x.nom));
    expect(a.map((x) => x.milles)).toEqual(b.map((x) => x.milles));
  });

  it('un jeton par pillage, cinq au plus, un revient toutes les 4 h 48', () => {
    const j = pret();
    const bots = ciblesBots(j, forceEscouade(j, ESC), 0, 6);
    expect(bots).toHaveLength(6);
    for (let k = 0; k < PILLAGE.jetonsMax; k++) {
      expect(piller(j, ESC, bots[k]!, 0, k + 1).ok).toBe(true);
      jouer(j);
      for (const id of ESC) j.porteurs[id]!.usure = 0; // la Clinique a fait son œuvre entre deux pillages
    }
    expect(piller(j, ESC, bots[5]!, 0).ok).toBe(false);
    expect(majJetons(j, PILLAGE.rechargeMs - 1)).toBe(PILLAGE.rechargeMs);
    majJetons(j, PILLAGE.rechargeMs * 2 + 5);
    expect(etatPillage(j).jetons).toBe(2);
    majJetons(j, PILLAGE.rechargeMs * 50);
    expect(etatPillage(j).jetons).toBe(PILLAGE.jetonsMax);
  });

  it('une victoire rapporte le butin et le Renom ; une défaite laisse 2 % du minerai ; un district par jour', () => {
    const j = pret();
    const facile: Cible = { id: 'x', nom: 'Proie', porteurs: ESC, cartes: ['ruee@fer'], force: 0.5, strate: 1, coffre: 5, pavillon: 'pirate' };
    j.composants = 0;
    // la proie est hors de portée (trop faible) : seule une revanche le permettrait
    expect(piller(j, ESC, facile, 0, 3).ok).toBe(false);
    etatPillage(j).revanches = [{ id: 'x', nom: 'Proie', jusqua: 10 }];
    expect(piller(j, ESC, facile, 0, 3, { revanche: true }).ok).toBe(true);
    expect(etatPillage(j).jetons).toBe(PILLAGE.jetonsMax);
    const r = jouer(j);
    expect(r.victoire).toBe(true);
    expect(r.pillage!.gain).toBe(butinPillage(facile, 0.5 / forceEscouade(pret(), ESC)).base + 5);
    expect(r.pillage!.carte).toBe('ruee@cuivre');
    expect(j.composants).toBe(r.pillage!.gain);
    expect(etatPillage(j).renom).toBeGreaterThan(0);
    expect(j.pillage!.aEnvoyer).toEqual([{ cible: 'x', victoire: true, vol: 5, perte: 0, le: j.dernierTick }]);

    for (const id of ESC) j.porteurs[id]!.usure = 0;
    j.composants = 1000;
    const fort: Cible = { ...facile, id: 'y', force: forceEscouade(j, ESC) * 1.1 };
    // gardes très forts en combat, pour être sûr de perdre
    (PILLAGE as { gardes: number }).gardes = 30;
    expect(piller(j, ESC, fort, 0, 4).ok).toBe(true);
    const d = jouer(j);
    (PILLAGE as { gardes: number }).gardes = 1.2;
    expect(d.victoire).toBe(false);
    expect(d.pillage!.perte).toBe(perteDe(1000, PILLAGE.strateMin));
    expect(j.composants).toBe(1000 - d.pillage!.perte);
    expect(piller(j, ESC, fort, 0, 5).ok).toBe(false);
  });

  it('les attaques subies ne touchent qu’un pirate, plafonnées, chacune une seule fois, et ouvrent la revanche', () => {
    const j = pret(1);
    j.composants = 500;
    const subis = [
      { id: 'a', par: 'u1', nom: 'Ilse', victoire: false, vol: 0, perte: 7, le: 1 },
      { id: 'b', par: 'u2', nom: 'Bryan', victoire: true, vol: 100, perte: 0, le: 2 },
    ];
    // neutre : rien ne passe
    subirPillages(j, subis);
    expect(j.composants).toBe(500);
    const k = pret(1);
    k.composants = 500;
    changerPavillon(k, 'pirate', 0);
    expect(subirPillages(k, subis)).toHaveLength(2);
    // +7 laissés, puis 3 % de 507 (15), sous le plafond de 4 combats de −1 (24)
    expect(k.composants).toBe(507 - 15);
    expect(revanchesOuvertes(k, 3)).toEqual([{ id: 'u2', nom: 'Bryan', jusqua: 2 + PILLAGE.revancheMs }]);
    expect(subirPillages(k, subis)).toHaveLength(0);
  });

  it('le défenseur applique lui-même son bouclier et la limite du jour', () => {
    const j = pret();
    j.composants = 500;
    changerPavillon(j, 'pirate', 0);
    const h = 3_600_000;
    const l = subirPillages(j, [
      { id: 'a', nom: 'A', victoire: true, vol: 5, perte: 0, le: 0 },
      { id: 'b', nom: 'B', victoire: true, vol: 5, perte: 0, le: h },
      { id: 'c', nom: 'C', victoire: false, vol: 0, perte: 3, le: 9 * h },
      { id: 'd', nom: 'D', victoire: true, vol: 5, perte: 0, le: 18 * h },
      { id: 'e', nom: 'E', victoire: false, vol: 0, perte: 3, le: 20 * h },
    ]);
    // b tombe sous le bouclier de a ; c passe ; d ouvre un nouveau bouclier ; e est la 4e du jour
    expect(l.map((m) => m.charAt(0))).toEqual(['A', 'T', 'D']);
  });

  it('bouclier de 8 h après une attaque perdue, 3 attaques subies par jour au plus', () => {
    const h = 3_600_000;
    expect(protege([], 0)).toBe(false);
    expect(protege([{ victoire: true, le: 0 }], 7 * h)).toBe(true);
    expect(protege([{ victoire: true, le: 0 }], 9 * h)).toBe(false);
    expect(protege([{ victoire: false, le: 0 }], h)).toBe(false);
    expect(protege([{ victoire: false, le: 0 }, { victoire: false, le: 1 }, { victoire: false, le: 2 }], h)).toBe(true);
  });
});

describe('Le pillage d’un directeur, en duel contre sa vraie escouade (14 novembre 2026)', () => {
  const pirate = (j: ReturnType<typeof pret>, id = 'rival'): Cible => {
    const g = { ...garnisonDe(j), pavillon: 'pirate' as const, consigne: 'rempart' as const, coffre: 9 };
    return { ...cibleDe(id, 'Rival', g), milles: 120 };
  };

  it('le départ donne les deux escouades, la consigne du défenseur et la traversée ; le retour règle le pillage', () => {
    const j = pret();
    j.composants = 1000;
    const c = pirate(pret());
    const r = lancerPillageDuel(j, ESC, c, 1000, 42);
    expect(r.ok).toBe(true);
    expect(r.depart!.defense.porteurs.map((p) => p.id)).toEqual(ESC);
    expect(r.depart!.consigne).toBe('rempart');
    expect(r.depart!.secondes).toBe(traversee(120));
    expect(pavillonDe(j)).toBe('pirate');
    expect(etatPillage(j).jetons).toBe(PILLAGE.jetonsMax - 1);
    // un seul pillage à la fois
    expect(lancerPillageDuel(j, ESC, { ...c, id: 'autre' }, 1000).ok).toBe(false);
    const avant = j.composants;
    const fin = finirPillageDuel(j, { victoire: true, porteurs: ESC.map((id) => ({ id, pv: 50, pvMax: 100 })), recit: { tours: 9, abattus: 1, carte: 'carapace@fer' } }, 2000)!;
    expect(fin.victoire).toBe(true);
    expect(j.composants).toBe(avant + fin.gain);
    expect(fin.gain).toBe(c.coffre + butinPillage(c, c.force / forceEscouade(pret(), ESC)).base);
    expect(fin.carte).not.toBeNull();
    expect(etatPillage(j).enCours).toBeUndefined();
    expect(j.pillage!.aEnvoyer[0]).toMatchObject({ cible: 'rival', victoire: true, vol: 9, recit: { tours: 9, abattus: 1, carte: 'carapace@fer' } });
    // la moitié de la part de PV perdue en duel devient de l'Usure
    for (const id of ESC) expect(j.porteurs[id]!.usure).toBeGreaterThan(0);
  });

  it('un pillage resté en plan sans duel à reprendre compte perdu ; un district sans directeur ne se pille pas en duel', () => {
    const j = pret();
    j.composants = 1000;
    expect(lancerPillageDuel(j, ESC, ciblesBots(j, 5, 0, 5)[0]!, 0).ok).toBe(false);
    expect(lancerPillageDuel(j, ESC, pirate(pret()), 0).ok).toBe(true);
    delete etatPillage(j).enCours!.duel; // une sauvegarde d'avant la reprise des duels
    const r = pillageEnSuspens(j, 10)!;
    expect(r.victoire).toBe(false);
    expect(j.composants).toBe(1000 - perteDe(1000, PILLAGE.strateMin));
    expect(pillageEnSuspens(j, 20)).toBeNull();
  });

  it('le défenseur choisit sa consigne et lit le récit de sa défense', () => {
    const j = pret();
    expect(garnisonDe(j).consigne).toBe('riposte');
    expect(choisirConsigne(j, 'harcelement').ok).toBe(true);
    expect(garnisonDe(j).consigne).toBe('harcelement');
    changerPavillon(j, 'pirate', 0);
    j.composants = 500;
    subirPillages(j, [{ id: 'a', par: 'u1', nom: 'Ilse', victoire: false, vol: 0, perte: 4, le: 1, recit: { tours: 11, abattus: 2, carte: 'carapace@fer' } }]);
    expect(etatPillage(j).historique![0]!.recit).toEqual({ tours: 11, abattus: 2, carte: 'carapace@fer' });
  });

  it('une page rechargée en plein duel le reprend exactement où il en était', () => {
    const j = pret();
    j.composants = 1000;
    const r = lancerPillageDuel(j, ESC, pirate(pret()), 0, 99);
    expect(r.ok).toBe(true);
    const d = r.depart!;
    // le duel joué en direct : le robot du défenseur choisit au début du tour, l'attaquant verrouille, puis la résolution
    const s = creerDuel(d.attaque, d.defense, d.graine);
    for (let tour = 1; tour <= 4 && s.issue === 'en-cours'; tour++) {
      const robot = choixRobot(s, 1, d.consigne);
      const moi = choixRobot(s, 0);
      noterChoixDuel(j, s.tour, moi);
      appliquerChoix(s, 0, moi); appliquerChoix(s, 1, robot); resoudreTour(s);
    }
    // la sauvegarde relue (JSON), puis rejouée
    const relu = JSON.parse(JSON.stringify(j));
    expect(rejouerDuel(relu)).toEqual(s);
    // un pillage gardé en duel ne compte pas perdu à la réouverture : il se reprend
    expect(pillageEnSuspens(relu, 10)).toBeNull();
  });

  it('la consigne change ce que le robot de la garnison joue', () => {
    const a = escouadeDuelDe(pret()), b = escouadeDuelDe(pret());
    const differents = [1, 2, 3, 4, 5, 6, 7, 8].some((g) => {
      const s = creerDuel(a, b, g);
      return JSON.stringify(choixRobot(s, 1, 'rempart')) !== JSON.stringify(choixRobot(s, 1, 'riposte'));
    });
    expect(differents).toBe(true);
  });
});
