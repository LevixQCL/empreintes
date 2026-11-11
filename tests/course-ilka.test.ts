// « Toutes les courses » (prototype du Récit d'Ilka) : les règles, et le réglage joué au robot.
import { describe, expect, it } from 'vitest';
import {
  COURSE, avance, directionsPossibles, etoilesCourse, finRoute, laisserPasser, nouvelleCourse, poserCarte, prendreRaccourci, raccourci,
  type EtatCourse,
} from '../src/core/course-ilka';

type Action = (x: EtatCourse) => void;
function actions(e: EtatCourse): Action[] {
  const a: Action[] = [];
  for (const c of e.offre) for (const d of directionsPossibles(e, c.genre)) a.push((x) => { poserCarte(x, c.id, d); });
  if (e.geste) for (const d of directionsPossibles(e, 'cable')) a.push((x) => { poserCarte(x, 'geste', d); });
  if (raccourci(e)) a.push((x) => { prendreRaccourci(x); });
  return a;
}
/** la distance du bout de la route à l'arrivée, par les cases franchissables */
function distance(e: EtatCourse): number {
  const g = e.grille, s = finRoute(e);
  const vues = new Set(e.route.map((p) => `${p.l},${p.c}`));
  const file: [number, number, number][] = [[s.l, s.c, 0]];
  while (file.length) {
    const [l, c, k] = file.shift()!;
    if (g[l]![c] === 'A') return k;
    for (const [dl, dc] of [[1, 0], [-1, 0], [0, 1], [0, -1]] as const) {
      const nl = l + dl, nc = c + dc, cle = `${nl},${nc}`;
      if (!g[nl]?.[nc] || g[nl]![nc] === '#' || vues.has(cle)) continue;
      vues.add(cle); file.push([nl, nc, k + 1]);
    }
  }
  return 99;
}
const note = (x: EtatCourse) => x.issue === 'arrivee' ? 1000 : x.issue !== 'en-cours' ? -1000 : -distance(x) * 10 + Math.min(avance(x), 3) * 6 + (x.geste ? 4 : 0);
/** le joueur attentif : regarde deux coups devant */
const attentif = (e: EtatCourse) => {
  let meilleur = -Infinity, choix: Action = laisserPasser;
  for (const f of [...actions(e), laisserPasser]) {
    const x = structuredClone(e); f(x);
    let s = note(x);
    if (x.issue === 'en-cours') s = (s + 2 * Math.max(...[...actions(x), laisserPasser].map((g) => { const y = structuredClone(x); g(y); return note(y); }))) / 3;
    if (s > meilleur) { meilleur = s; choix = f; }
  }
  choix(e);
};
let graine = 7;
const auHasard = (e: EtatCourse) => { graine = (graine * 1103515245 + 12345) & 0x7fffffff; const a = actions(e); (a[graine % Math.max(1, a.length)] ?? laisserPasser)(e); };
const jouer = (g: number, f: Action) => { const e = nouvelleCourse(g); for (let k = 0; e.issue === 'en-cours' && k < 60; k++) f(e); return e; };

describe('Toutes les courses', () => {
  it('Ilka avance à chaque tour, et tombe au bout de la route', () => {
    const e = nouvelleCourse(1);
    expect(avance(e)).toBe(COURSE.avanceDepart);
    for (let i = 0; i < COURSE.avanceDepart; i++) laisserPasser(e);
    expect(avance(e)).toBe(0);
    laisserPasser(e);
    expect(e.issue).toBe('chute');
  });

  it('une carte posée allonge la route de sa longueur', () => {
    const e = nouvelleCourse(2);
    const c = e.offre[0]!;
    const d = directionsPossibles(e, c.genre)[0]!;
    const avant = e.route.length;
    poserCarte(e, c.id, d);
    expect(e.route.length).toBeGreaterThan(avant);
  });

  it('réglage : un joueur attentif livre presque toujours, un joueur au hasard rarement', () => {
    const N = 120;
    const a = Array.from({ length: N }, (_, i) => jouer(i + 1, attentif));
    const h = Array.from({ length: N }, (_, i) => jouer(i + 1, auHasard));
    const taux = (l: EtatCourse[]) => l.filter((x) => x.issue === 'arrivee').length / N;
    // eslint-disable-next-line no-console
    console.log(`Course d'Ilka · attentif ${Math.round(taux(a) * 100)} % · au hasard ${Math.round(taux(h) * 100)} % · étoiles ${(a.reduce((s, x) => s + etoilesCourse(x), 0) / N).toFixed(1)}`);
    expect(taux(a)).toBeGreaterThan(0.85);
    expect(taux(h)).toBeLessThan(0.3);
  });
});
