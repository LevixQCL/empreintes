// « Toutes les courses » (prototype du Récit d'Ilka, 11 novembre 2026) : tracer la route devant Ilka, qui ne s'arrête jamais.
// Le district est une grille vue de dessus. À chaque tour, le joueur fait une action (poser une des 3 cartes proposées,
// prendre un raccourci, ou laisser passer), puis Ilka avance d'une case sur sa route, quoi qu'il arrive.
// Si la route s'arrête sous ses pieds, elle tombe. Les passerelles rouillées et les quais sont des raccourcis gratuits,
// mais une rouillée cède deux tours après qu'on s'y engage, et les quais ferment à heure fixe : ce qui n'est pas encore
// passé est coupé. Une fois par course, « le geste d'une autre » : les jambes connaissent une route de 2070 (un Câble offert).
// Pas de navigateur ici : l'écran est dans src/ui/course-ilka.ts, les gestes dans src/app/course-ilka.ts.

import { graine as nouvelleGraine, tireur } from './rng';
import { t } from './i18n';

/** eau, tour (infranchissable), rouillée, quai, pourboire, départ, arrivée */
export type Case = '~' | '#' | 'R' | 'Q' | '$' | 'D' | 'A';
export type GenreCarte = 'passerelle' | 'cable' | 'pont';
export type Dir = 'h' | 'b' | 'g' | 'd';
export interface Pos { l: number; c: number }

export const DIRS: Record<Dir, Pos> = { h: { l: -1, c: 0 }, b: { l: 1, c: 0 }, g: { l: 0, c: -1 }, d: { l: 0, c: 1 } };

export interface CarteCourse { id: string; genre: GenreCarte }

export const CARTES: Record<GenreCarte, { nom: string; texte: string; longueur: number }> = {
  passerelle: { nom: t('Passerelle'), texte: t('1 case, sur l’eau.'), longueur: 1 },
  cable: { nom: t('Câble'), texte: t('2 cases tout droit, par-dessus une tour.'), longueur: 2 },
  pont: { nom: t('Grand pont'), texte: t('3 cases tout droit, sur l’eau seulement.'), longueur: 3 },
};

/** La carte du prototype : la nuit du colis payé triple. Lignes de haut (l'arrivée) en bas (la tour d'Ilka). */
export const CARTE_NUIT = [
  '~~#A~~',
  '~#~~#~',
  '~R~~$~',
  '~R#~~~',
  '#~~#Q~',
  '~~#~Q~',
  '~#~~Q#',
  '~R~#~~',
  '~~D~~#',
];

export const COURSE = {
  /** le tour où les quais ferment */
  fermetureQuais: 6,
  /** une rouillée cède ce nombre de tours après qu'on s'y est engagé */
  tenueRouillee: 2,
  /** la route posée d'avance devant la tour d'Ilka */
  avanceDepart: 2,
  offre: 3,
  /** l'aube : passé ce tour, le colis est en retard */
  aube: 13,
  /** le tirage des cartes proposées (poids) */
  poids: { passerelle: 5, cable: 3, pont: 2 } as Record<GenreCarte, number>,
} as const;

export interface EtatCourse {
  rng: number;
  tour: number;
  grille: Case[][];
  /** la route, de la tour d'Ilka à la dernière case posée */
  route: Pos[];
  /** la position d'Ilka dans la route */
  ilka: number;
  offre: CarteCourse[];
  geste: boolean;
  /** les rouillées engagées : la case et le tour où elle cède */
  fragiles: { p: Pos; cede: number }[];
  pourboire: boolean;
  issue: 'en-cours' | 'arrivee' | 'chute' | 'retard';
  journal: string[];
  compteur: number;
}

const eq = (a: Pos, b: Pos) => a.l === b.l && a.c === b.c;
const add = (a: Pos, d: Pos, k = 1): Pos => ({ l: a.l + d.l * k, c: a.c + d.c * k });

export function caseEn(e: EtatCourse, p: Pos): Case | null {
  return e.grille[p.l]?.[p.c] ?? null;
}
const surRoute = (e: EtatCourse, p: Pos) => e.route.some((q) => eq(q, p));
export const finRoute = (e: EtatCourse): Pos => e.route[e.route.length - 1]!;
/** les cases de route devant Ilka */
export const avance = (e: EtatCourse): number => e.route.length - 1 - e.ilka;

function tirerOffre(e: EtatCourse) {
  const r = tireur(e);
  const sac: GenreCarte[] = [];
  for (const [g, n] of Object.entries(COURSE.poids) as [GenreCarte, number][]) for (let i = 0; i < n; i++) sac.push(g);
  e.offre = Array.from({ length: COURSE.offre }, () => ({ id: `c${e.compteur++}`, genre: sac[r.entier(sac.length)]! }));
}

export function nouvelleCourse(graine = nouvelleGraine(), carte = CARTE_NUIT): EtatCourse {
  const grille = carte.map((l) => [...l] as Case[]);
  const l = grille.findIndex((r) => r.includes('D'));
  const depart = { l, c: grille[l]!.indexOf('D') };
  const e: EtatCourse = {
    rng: graine, tour: 1, grille, route: [depart], ilka: 0, offre: [], geste: true, fragiles: [], pourboire: false,
    issue: 'en-cours', journal: [], compteur: 0,
  };
  for (let k = 1; k <= COURSE.avanceDepart; k++) e.route.push(add(depart, DIRS.h, k));
  tirerOffre(e);
  return e;
}

/** Les cases que poserait une carte dans une direction, ou null si c'est impossible */
export function casesPosees(e: EtatCourse, genre: GenreCarte, d: Dir): Pos[] | null {
  const n = CARTES[genre].longueur;
  const fin = finRoute(e);
  const cases: Pos[] = [];
  for (let k = 1; k <= n; k++) {
    const p = add(fin, DIRS[d], k);
    const c = caseEn(e, p);
    if (c === null || surRoute(e, p) || cases.some((q) => eq(q, p))) return null;
    const derniere = k === n;
    if (genre === 'pont' && !['~', '$', 'A'].includes(c)) return null;
    if (genre === 'cable' && !derniere) { cases.push(p); continue; } // le câble passe au-dessus de tout
    if (c === '#' || c === 'D') return null;
    cases.push(p);
  }
  return cases;
}

/** Le raccourci au bout de la route : les rouillées ou quais en ligne droite (3 au plus), ou null */
export function raccourci(e: EtatCourse): { dir: Dir; cases: Pos[]; genre: 'R' | 'Q' } | null {
  const fin = finRoute(e);
  for (const d of Object.keys(DIRS) as Dir[]) {
    const p = add(fin, DIRS[d]);
    const c = caseEn(e, p);
    if ((c !== 'R' && c !== 'Q') || surRoute(e, p)) continue;
    const cases: Pos[] = [];
    let q = p;
    while (caseEn(e, q) === c && !surRoute(e, q) && cases.length < 3) { cases.push(q); q = add(q, DIRS[d]); }
    return { dir: d, cases, genre: c };
  }
  return null;
}

function finDeTour(e: EtatCourse, j: string[]) {
  // Ilka avance d'une case, quoi qu'il arrive
  if (avance(e) <= 0) { e.issue = 'chute'; j.push(t('La route s’arrête sous ses pieds. Ilka tombe.')); e.journal = j; return; }
  e.ilka += 1;
  const ici = e.route[e.ilka]!;
  const c = caseEn(e, ici);
  if (c === '$' && !e.pourboire) { e.pourboire = true; j.push(t('Pourboire empoché.')); }
  if (c === 'A') { e.issue = 'arrivee'; j.push(t('Colis livré.')); e.journal = j; return; }
  e.tour += 1;
  if (e.tour > COURSE.aube) { e.issue = 'retard'; j.push(t('L’aube se lève. Le colis est en retard.')); e.journal = j; return; }
  // ce qui cède ou ferme coupe la route devant Ilka
  const coupures: Pos[] = [];
  for (const f of e.fragiles) if (f.cede === e.tour) coupures.push(f.p);
  if (e.tour === COURSE.fermetureQuais) e.route.forEach((p) => { if (caseEn(e, p) === 'Q') coupures.push(p); });
  for (const p of coupures) {
    const quai = caseEn(e, p) === 'Q';
    e.grille[p.l]![p.c] = quai ? '#' : '~';
    const i = e.route.findIndex((q) => eq(q, p));
    if (i > e.ilka) { e.route = e.route.slice(0, i); j.push(quai ? t('Les quais ferment. La route est coupée devant elle.') : t('La passerelle rouillée cède devant elle.')); }
  }
  if (e.tour === COURSE.fermetureQuais) {
    e.grille.forEach((r) => r.forEach((c, i) => { if (c === 'Q') r[i] = '#'; }));
  }
  e.fragiles = e.fragiles.filter((f) => f.cede > e.tour);
  tirerOffre(e);
  e.journal = j;
}

/** Poser une carte de l'offre (ou le Câble du geste) dans une direction */
export function poserCarte(e: EtatCourse, id: string | 'geste', d: Dir): boolean {
  if (e.issue !== 'en-cours') return false;
  const genre: GenreCarte | undefined = id === 'geste' ? (e.geste ? 'cable' : undefined) : e.offre.find((c) => c.id === id)?.genre;
  if (!genre) return false;
  const cases = casesPosees(e, genre, d);
  if (!cases) return false;
  e.route.push(...cases);
  if (id === 'geste') e.geste = false;
  finDeTour(e, id === 'geste' ? [t('Le geste d’une autre : ses jambes connaissent une route de 2070.')] : []);
  return true;
}

/** Prendre le raccourci (rouillée ou quai) : gratuit, mais fragile */
export function prendreRaccourci(e: EtatCourse): boolean {
  if (e.issue !== 'en-cours') return false;
  const r = raccourci(e);
  if (!r) return false;
  e.route.push(...r.cases);
  const j: string[] = [];
  if (r.genre === 'R') {
    for (const p of r.cases) e.fragiles.push({ p, cede: e.tour + COURSE.tenueRouillee });
    j.push(t`La passerelle rouillée grince. Elle cédera dans ${COURSE.tenueRouillee} tours.`);
  } else j.push(t`Les quais : rapides, mais ils ferment au tour ${COURSE.fermetureQuais}.`);
  finDeTour(e, j);
  return true;
}

/** Ne rien poser : Ilka avance quand même */
export function laisserPasser(e: EtatCourse): void {
  if (e.issue === 'en-cours') finDeTour(e, [t('Rien de posé. Ilka avance quand même.')]);
}

/** Les étoiles : arriver, empocher le pourboire, garder le geste */
export function etoilesCourse(e: EtatCourse): number {
  return e.issue !== 'arrivee' ? 0 : 1 + (e.pourboire ? 1 : 0) + (e.geste ? 1 : 0);
}

/** Les directions jouables pour une carte (pour l'écran et le robot) */
export function directionsPossibles(e: EtatCourse, genre: GenreCarte): Dir[] {
  return (Object.keys(DIRS) as Dir[]).filter((d) => casesPosees(e, genre, d));
}
