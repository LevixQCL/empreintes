// « Deux heures » : prototype de la première épreuve du Récit d'Ilka (Pack des origines, 10 novembre 2026).
// 2111, les Hauts-Ponts. Ilka est coincée sous la passerelle, l'eau monte ; Doran lui tient la tête hors de l'eau
// en attendant la relance des pompes. L'ennemi, c'est l'eau : elle annonce sa montée comme un ennemi annonce son coup.
// Doran a deux mains : deux cartes au plus par tour, et chaque carte jouée est perdue (il s'épuise, on ne repioche pas la défausse).
// Ilka compte pour ne pas crier : une carte dont la Fréquence suit le compte (3 après 2) le prolonge et calme son souffle.
// Au tour 10, la station peut relancer : la carte « Relancez » arrive dans la main. La jouer gagne l'épreuve,
// et le joueur sait ce qu'elle coûte. Attendre fait perdre du souffle à Ilka.
// Pas de navigateur ici (règle de src/core) : l'écran est dans src/ui/recit.ts, les gestes dans src/app/recit.ts.

import { graine as nouvelleGraine, tireur } from './rng';
import { t } from './i18n';

export type GenreRecit = 'soulever' | 'respirer' | 'caler' | 'relancer';

export interface CarteRecit {
  id: string;
  genre: GenreRecit;
  /** la Fréquence (1 à 9), qu'Ilka compte ; 0 pour « Relancez » */
  frequence: number;
  /** soulever : l'eau repoussée ; respirer : le souffle rendu ; caler : l'eau repoussée maintenant et la montée suivante réduite */
  force: number;
}

export interface EtatDeuxHeures {
  rng: number;
  tour: number;
  /** la hauteur de l'eau : à DEUX_HEURES.eauMax, elle passe au-dessus */
  eau: number;
  /** le souffle d'Ilka : à 0, elle panique */
  souffle: number;
  /** le dernier nombre compté par Ilka (0 : elle n'a pas commencé) */
  compte: number;
  /** le plus haut nombre atteint, pour la troisième étoile */
  compteMax: number;
  pioche: CarteRecit[];
  main: CarteRecit[];
  /** les cartes posées ce tour (deux au plus) */
  posees: CarteRecit[];
  /** la montée suivante réduite par « Caler » */
  calage: number;
  /** les tours où « Relancez » est resté dans la main */
  attente: number;
  issue: 'en-cours' | 'victoire' | 'noyade' | 'panique';
  /** ce que le dernier tour a fait, pour l'écran */
  journal: string[];
}

/** Les réglages de l'épreuve : tout le réglage est ici (tests/deux-heures.test.ts le joue au robot) */
export const DEUX_HEURES = {
  tours: 12,
  /** la montée annoncée de chaque tour (l'eau qui remplit la cuvette pendant que les pompes sont à l'arrêt) */
  montees: [1, 2, 2, 2, 2, 2, 3, 2, 3, 3, 3, 3],
  eauDepart: 5,
  /** l'eau ne descend jamais sous ce niveau : Ilka reste coincée au fond */
  eauMin: 3,
  eauMax: 10,
  souffleDepart: 5,
  souffleMax: 10,
  /** le froid : le souffle perdu à chaque tour */
  froid: 1,
  /** l'eau aux lèvres : à partir de ce niveau, un souffle de plus est perdu */
  levres: 8,
  /** le compte prolongé : le souffle rendu */
  bonusCompte: 2,
  mainDepart: 5,
  /** Doran s'épuise : une seule carte piochée par tour */
  pioche: 1,
  mains: 2,
  /** le tour où la station peut relancer */
  tourRelance: 10,
  /** chaque tour où « Relancez » attend dans la main : le souffle perdu en plus */
  coutAttente: 2,
  /** deuxième étoile : le souffle restant ; troisième : le compte atteint */
  etoileSouffle: 4,
  etoileCompte: 5,
} as const;

/** Le deck de Doran : 18 cartes, toujours les mêmes, mélangées par la graine */
const DECK: Omit<CarteRecit, 'id'>[] = [
  { genre: 'soulever', frequence: 1, force: 1 }, { genre: 'soulever', frequence: 2, force: 2 }, { genre: 'soulever', frequence: 3, force: 1 },
  { genre: 'soulever', frequence: 4, force: 2 }, { genre: 'soulever', frequence: 5, force: 1 }, { genre: 'soulever', frequence: 6, force: 2 },
  { genre: 'soulever', frequence: 7, force: 3 }, { genre: 'soulever', frequence: 8, force: 1 }, { genre: 'soulever', frequence: 9, force: 2 },
  { genre: 'respirer', frequence: 1, force: 2 }, { genre: 'respirer', frequence: 3, force: 2 }, { genre: 'respirer', frequence: 5, force: 2 },
  { genre: 'respirer', frequence: 7, force: 2 }, { genre: 'respirer', frequence: 2, force: 3 },
  { genre: 'caler', frequence: 4, force: 1 }, { genre: 'caler', frequence: 6, force: 1 }, { genre: 'caler', frequence: 8, force: 1 },
  { genre: 'caler', frequence: 2, force: 1 },
];

export const RELANCEZ: CarteRecit = { id: 'relancez', genre: 'relancer', frequence: 0, force: 0 };

/** Le nom et le texte d'une carte, pour l'écran */
export function texteCarte(c: CarteRecit): { nom: string; texte: string } {
  switch (c.genre) {
    case 'soulever': return { nom: t('Soulever'), texte: t`Repousse l’eau de ${c.force}.` };
    case 'respirer': return { nom: t('Respire avec moi'), texte: t`Rend ${c.force} de souffle à Ilka.` };
    case 'caler': return { nom: t('Caler sa tête'), texte: t`Repousse l’eau de ${c.force}, et la prochaine montée de 1.` };
    case 'relancer': return { nom: t('Relancez'), texte: t('Trois éclats vers la station. Les pompes repartent, et le courant emporte tout ce qui est pris au fond.') };
  }
}

export function nouvelleEpreuve(graine = nouvelleGraine()): EtatDeuxHeures {
  const e: EtatDeuxHeures = {
    rng: graine, tour: 1, eau: DEUX_HEURES.eauDepart, souffle: DEUX_HEURES.souffleDepart, compte: 0, compteMax: 0,
    pioche: [], main: [], posees: [], calage: 0, attente: 0, issue: 'en-cours', journal: [],
  };
  e.pioche = tireur(e).melanger(DECK.map((c, i) => ({ ...c, id: `d${i}` })));
  e.main = e.pioche.splice(0, DEUX_HEURES.mainDepart);
  return e;
}

/** La montée annoncée pour ce tour (le calage déjà retiré) */
export function monteeAnnoncee(e: EtatDeuxHeures): number {
  return Math.max(0, (DEUX_HEURES.montees[e.tour - 1] ?? 3) - e.calage);
}

/** L'heure du tour : 22 h 00, puis dix minutes par tour */
export function heure(tour: number): string {
  const m = 22 * 60 + (tour - 1) * 10;
  return `${Math.floor(m / 60) % 24} h ${String(m % 60).padStart(2, '0')}`;
}

/** Poser ou reprendre une carte de la main (deux mains : deux cartes au plus) */
export function basculer(e: EtatDeuxHeures, id: string): boolean {
  if (e.issue !== 'en-cours') return false;
  const i = e.posees.findIndex((c) => c.id === id);
  if (i >= 0) { e.main.push(...e.posees.splice(i, 1)); return true; }
  const j = e.main.findIndex((c) => c.id === id);
  if (j < 0 || e.posees.length >= DEUX_HEURES.mains) return false;
  // « Relancez » se joue seule : Doran lâche tout pour la lampe
  if (e.main[j]!.genre === 'relancer') e.main.push(...e.posees.splice(0));
  else if (e.posees.some((c) => c.genre === 'relancer')) return false;
  e.posees.push(...e.main.splice(j, 1));
  return true;
}

/** Ce que le tour posé va faire, avant de le jouer (l'aperçu de l'écran) */
export function apercu(e: EtatDeuxHeures): { eau: number; souffle: number; compte: number } {
  const copie = structuredClone(e);
  resoudre(copie, false);
  return { eau: copie.eau, souffle: copie.souffle, compte: copie.compte };
}

/** Joue le tour : les cartes posées, puis l'eau monte, puis le froid. Rend l'issue. */
export function tenir(e: EtatDeuxHeures): EtatDeuxHeures['issue'] {
  if (e.issue !== 'en-cours') return e.issue;
  resoudre(e, true);
  return e.issue;
}

function resoudre(e: EtatDeuxHeures, pour_de_vrai: boolean) {
  const R = DEUX_HEURES;
  const j: string[] = [];
  if (e.posees.some((c) => c.genre === 'relancer')) {
    e.posees = [];
    e.main = e.main.filter((c) => c.genre !== 'relancer');
    e.issue = 'victoire';
    e.journal = [t('Les pompes repartent.')];
    return;
  }
  let repousse = 0;
  let calage = 0;
  for (const c of e.posees) {
    if (c.genre === 'soulever') repousse += c.force;
    if (c.genre === 'caler') { repousse += c.force; calage += 1; }
    if (c.genre === 'respirer') e.souffle += c.force;
    // Ilka compte : la Fréquence qui suit le compte le prolonge, une autre le fait repartir de là
    if (c.frequence === e.compte + 1) {
      e.compte += 1;
      e.souffle += R.bonusCompte;
      j.push(t`Ilka compte : ${e.compte}.`);
    } else e.compte = c.frequence;
    e.compteMax = Math.max(e.compteMax, e.compte);
  }
  const montee = monteeAnnoncee(e);
  e.eau = Math.max(R.eauMin, e.eau + montee - repousse);
  j.push(montee - repousse > 0 ? t`L’eau monte de ${montee - repousse}.` : montee - repousse < 0 ? t`L’eau recule de ${repousse - montee}.` : t('L’eau ne gagne rien.'));
  e.calage = calage;
  let perte = R.froid + (e.eau >= R.levres ? 1 : 0);
  if (e.main.some((c) => c.genre === 'relancer')) { perte += R.coutAttente; e.attente += 1; }
  e.souffle = Math.min(R.souffleMax, e.souffle - perte);
  if (e.eau >= R.levres) j.push(t('L’eau est à ses lèvres.'));
  e.posees = [];
  if (e.eau >= R.eauMax) e.issue = 'noyade';
  else if (e.souffle <= 0) e.issue = 'panique';
  if (!pour_de_vrai || e.issue !== 'en-cours') { e.journal = j; return; }
  e.tour += 1;
  e.main.push(...e.pioche.splice(0, R.pioche));
  if (e.tour === R.tourRelance) { e.main.push({ ...RELANCEZ }); j.push(t('La station peut relancer.')); }
  // au dernier tour, il ne reste que la lampe
  if (e.tour >= R.tours && e.main.some((c) => c.genre === 'relancer')) e.main = e.main.filter((c) => c.genre === 'relancer');
  e.journal = j;
}

/** Les étoiles gagnées (0 tant que ce n'est pas une victoire) */
export function etoiles(e: EtatDeuxHeures): number {
  if (e.issue !== 'victoire') return 0;
  return 1 + (e.souffle >= DEUX_HEURES.etoileSouffle ? 1 : 0) + (e.compteMax >= DEUX_HEURES.etoileCompte ? 1 : 0);
}
