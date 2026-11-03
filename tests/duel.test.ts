// Le duel en temps réel (src/core/duel.ts) : pas encore branché au jeu, mais ses règles sont tenues.
import { describe, expect, it } from 'vitest';
import {
  CHOIX_VIDE, DUEL, allongerDuel, appliquerChoix, choixDe, choixRobot, creerDuel, deckDuel, deuxPrets, escouadeDepart, lectureAdverse,
  poserDuel, regleMise, repiocherDuel, resoudreTour, reprendreDuel, usureDuel, validerEscouade, verrouillerDuel, abandonner, type DuelEtat,
} from '../src/core/duel';
import { REGLES } from '../src/core/regles';

const nouveau = (graine = 42) => creerDuel(escouadeDepart('Bryan'), escouadeDepart('Luc'), graine);

/** joue un duel complet robot contre robot ; renvoie le duel et la suite des choix (pour le rejouer) */
function jouer(graine: number): { s: DuelEtat; choix: [ReturnType<typeof choixRobot>, ReturnType<typeof choixRobot>][] } {
  const s = creerDuel(escouadeDepart('A'), escouadeDepart('B'), graine);
  const choix: [ReturnType<typeof choixRobot>, ReturnType<typeof choixRobot>][] = [];
  while (s.issue === 'en-cours') {
    const a = choixRobot(s, 0), b = choixRobot(s, 1);
    expect(appliquerChoix(s, 0, a).ok).toBe(true);
    expect(appliquerChoix(s, 1, b).ok).toBe(true);
    resoudreTour(s);
    choix.push([a, b]);
  }
  return { s, choix };
}

describe('Duel : création', () => {
  it('chaque côté a son deck (18 cartes de départ), une main de 5 et des PV de duel', () => {
    const s = nouveau();
    expect(deckDuel(escouadeDepart('x'))).toHaveLength(18);
    for (const c of s.cotes) {
      expect(c.main).toHaveLength(REGLES.tailleMain);
      expect(c.main.length + c.pioche.length).toBe(18);
      for (const p of c.porteurs) expect(p.pv).toBe(p.pvMax);
    }
    expect(new Set([...s.cotes[0].main, ...s.cotes[1].main].map((g) => g.uid)).size).toBe(10);
  });
  it('refuse une escouade bancale', () => {
    const e = escouadeDepart('x');
    expect(validerEscouade(e).ok).toBe(true);
    expect(validerEscouade({ ...e, porteurs: e.porteurs.slice(0, 2) }).ok).toBe(false);
    expect(validerEscouade({ ...e, porteurs: [e.porteurs[0]!, e.porteurs[0]!, e.porteurs[1]!] }).ok).toBe(false);
    expect(validerEscouade({ ...e, porteurs: [{ ...e.porteurs[0]!, cartes: [{ id: 'inconnue@fer', niveau: 1 }] }, e.porteurs[1]!, e.porteurs[2]!] }).ok).toBe(false);
    // les trois lignées sont obligatoires (Ilka est Augmentée, Coursier aussi)
    expect(validerEscouade({ ...e, porteurs: [e.porteurs[0]!, { ...e.porteurs[1]!, id: 'coursier' }, e.porteurs[2]!] }).ok).toBe(false);
  });
});

describe('Duel : composer et verrouiller', () => {
  it('on pose, reprend, et la chaîne ne dépasse pas ses places', () => {
    const s = nouveau();
    const main = s.cotes[0].main.filter((g) => !g.vide);
    for (const g of main) poserDuel(s, 0, g.uid);
    expect(s.cotes[0].chaine.reduce((n, g) => n + (g.lourd ? 2 : 1), 0)).toBeLessThanOrEqual(REGLES.capaciteBase);
    const premier = s.cotes[0].chaine[0]!.uid;
    expect(reprendreDuel(s, 0, premier).ok).toBe(true);
    expect(s.cotes[0].main.some((g) => g.uid === premier)).toBe(true);
  });
  it('le choix envoyé se rejoue à l’identique chez l’adversaire', () => {
    const local = nouveau(7);
    const commun = nouveau(7);
    for (const g of local.cotes[0].main.filter((x) => !x.vide).slice(0, 2)) poserDuel(local, 0, g.uid);
    const choix = choixDe(local, 0);
    expect(appliquerChoix(commun, 0, choix).ok).toBe(true);
    expect(commun.cotes[0].chaine.map((g) => [g.uid, g.f])).toEqual(local.cotes[0].chaine.map((g) => [g.uid, g.f]));
    expect(commun.cotes[0].pret).toBe(true);
    expect(deuxPrets(commun)).toBe(false);
  });
  it('un choix impossible (carte absente de la main, Flux qu’on n’a pas) est refusé en entier', () => {
    const s = nouveau();
    const avant = JSON.stringify(s);
    expect(appliquerChoix(s, 0, { ...CHOIX_VIDE, chaine: [{ carte: 'b0', f: 1 }] }).ok).toBe(false);
    expect(appliquerChoix(s, 0, { ...CHOIX_VIDE, repioches: 1 }).ok).toBe(false);
    expect(appliquerChoix(s, 0, { ...CHOIX_VIDE, allonges: 1 }).ok).toBe(false);
    expect(JSON.stringify(s)).toBe(avant);
  });
  it('le Flux allonge la chaîne ou donne une nouvelle main', () => {
    const s = nouveau();
    s.cotes[0].flux = 2;
    expect(allongerDuel(s, 0).ok).toBe(true);
    expect(repiocherDuel(s, 0).ok).toBe(true);
    expect(s.cotes[0].flux).toBe(0);
    const commun = nouveau();
    commun.cotes[0].flux = 2;
    expect(appliquerChoix(commun, 0, choixDe(s, 0)).ok).toBe(true);
    expect(commun.cotes[0].main.map((g) => g.uid)).toEqual(s.cotes[0].main.map((g) => g.uid));
  });
  it('on ne touche plus à sa chaîne une fois verrouillée', () => {
    const s = nouveau();
    appliquerChoix(s, 0, CHOIX_VIDE);
    expect(poserDuel(s, 0, s.cotes[0].main[0]!.uid).ok).toBe(false);
    expect(appliquerChoix(s, 0, CHOIX_VIDE).ok).toBe(false);
  });
});

describe('Duel : résolution', () => {
  it('rien ne se résout tant qu’un des deux n’a pas verrouillé', () => {
    const s = nouveau();
    appliquerChoix(s, 0, CHOIX_VIDE);
    expect(resoudreTour(s)).toEqual([]);
    expect(s.tour).toBe(1);
  });
  it('les deux chaînes frappent en même temps, puis tout le monde repioche', () => {
    const s = nouveau(3);
    for (const k of [0, 1] as const) {
      const atk = s.cotes[k].main.find((g) => g.type === 'atk' && !g.vide);
      if (atk) poserDuel(s, k, atk.uid);
      verrouillerDuel(s, k);
    }
    const ev = resoudreTour(s);
    expect(ev.filter((e) => e.sorte === 'coup').map((e) => e.camp).sort()).toEqual([0, 1]);
    expect(s.tour).toBe(2);
    for (const c of s.cotes) { expect(c.main.filter((g) => !g.vide).length + c.main.filter((g) => g.vide).length).toBe(REGLES.tailleMain); expect(c.pret).toBe(false); }
  });
  it('le bouclier passe avant les coups du même tour', () => {
    const s = nouveau(5);
    s.cotes[1].bouclier = 1000;
    const atk = s.cotes[0].main.find((g) => g.type === 'atk' && !g.vide)!;
    poserDuel(s, 0, atk.uid);
    verrouillerDuel(s, 0);
    verrouillerDuel(s, 1);
    const ev = resoudreTour(s);
    const coup = ev.find((e) => e.sorte === 'coup')!;
    expect(coup.sorte === 'coup' && coup.v).toBe(0);
    for (const p of s.cotes[1].porteurs) expect(p.pv).toBe(p.pvMax);
  });
  it('un duel se rejoue à l’identique avec la même graine et les mêmes choix', () => {
    const { s, choix } = jouer(1234);
    const t = creerDuel(escouadeDepart('A'), escouadeDepart('B'), 1234);
    for (const [a, b] of choix) { appliquerChoix(t, 0, a); appliquerChoix(t, 1, b); resoudreTour(t); }
    expect(t.issue).toBe(s.issue);
    expect(t.cotes.map((c) => c.porteurs.map((p) => p.pv))).toEqual(s.cotes.map((c) => c.porteurs.map((p) => p.pv)));
  });
  it('l’usure du duel ne commence qu’au tour prévu', () => {
    expect(usureDuel(DUEL.usure.des - 1)).toEqual({ attaque: 1, soin: 1 });
    expect(usureDuel(DUEL.usure.des).attaque).toBeGreaterThan(1);
    expect(usureDuel(DUEL.usure.des + 20).soin).toBe(0);
  });
});

describe('Duel : durée et équilibre (robot contre robot, escouades de départ)', () => {
  it('un duel dure entre 6 et 15 tours, se termine toujours, et ne favorise pas un côté', () => {
    const tours: number[] = [];
    const gains = [0, 0];
    for (let g = 1; g <= 16; g++) {
      const { s } = jouer((g * 2654435761) >>> 0);
      expect(s.issue).not.toBe('en-cours');
      tours.push(s.tour - 1);
      if (s.issue === 'gagne-0') gains[0]!++;
      if (s.issue === 'gagne-1') gains[1]!++;
    }
    const moyenne = tours.reduce((a, b) => a + b) / tours.length;
    expect(moyenne).toBeGreaterThanOrEqual(6);
    expect(moyenne).toBeLessThanOrEqual(15);
    expect(Math.max(...tours)).toBeLessThanOrEqual(DUEL.tourMax);
    expect(Math.min(...gains)).toBeGreaterThanOrEqual(3);
  }, 60000);
});

describe('Duel : fin, abandon, mise, Lecture', () => {
  it('abandonner donne la victoire à l’autre', () => {
    const s = nouveau();
    abandonner(s, 1);
    expect(s.issue).toBe('gagne-0');
    expect(regleMise(s, ['ruee@fer', 'morsure@fer'])).toEqual({ gagnant: 0, gagne: 'morsure@fer', perdant: 1, perdu: 'morsure@fer' });
  });
  it('pas de mise réglée tant que le duel continue', () => {
    expect(regleMise(nouveau(), ['ruee@fer', null])).toBeNull();
  });
  it('la Lecture montre le genre de la chaîne adverse verrouillée, jamais sa force', () => {
    const s = nouveau(9);
    expect(lectureAdverse(s, 0)).toBeNull();
    s.cotes[0].lit = true;
    const g = s.cotes[1].main.find((x) => !x.vide)!;
    poserDuel(s, 1, g.uid);
    verrouillerDuel(s, 1);
    const l = lectureAdverse(s, 0)!;
    expect(l.atk + l.bouclier + l.soin).toBe(1);
  });
});
