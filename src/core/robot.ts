// Le robot d'équilibrage : un joueur automatique qui joue de vraies expéditions avec le vrai moteur.
// Il sert à mesurer ce qu'une carte change aux chances de victoire, à chaque modification de chiffre.
// Aucun DOM ici : il tourne dans les tests et dans `npm run robot`.

import { allonger, ajouter, capacite, placesLibres, vivants } from './combat';
import { lancer } from './combat';
import { gestesAvecModules } from './collection';
import { GESTES_SPECIAUX, porteurDef } from './donnees';
import { cloturerCombat, combatSuivant, nouvelleExpedition } from './expedition';
import { REGLES, places } from './regles';
import type { CombatEtat, Geste } from './types';

/** Copie rapide d'un combat (les Gestes eux-mêmes ne sont jamais modifiés, on peut les partager) */
const clone = (s: CombatEtat): CombatEtat => ({
  ...s,
  porteurs: s.porteurs.map((p) => ({ ...p })),
  ennemi: { ...s.ennemi },
  intention: { ...s.intention },
  pioche: s.pioche.slice(),
  defausse: s.defausse.slice(),
  main: s.main.slice(),
  chaine: s.chaine.slice(),
  journal: s.journal.slice(),
});

/** Les ordres de jeu à essayer pour un même groupe de Gestes */
function ordres(groupe: Geste[]): Geste[][] {
  if (groupe.length <= 3) return permutations(groupe);
  // au-delà, l'ordre croissant est presque toujours le meilleur ; on essaie aussi Crescendo en dernier
  const croissant = groupe.slice().sort((a, b) => a.f - b.f);
  const r = [croissant];
  const cresc = croissant.filter((g) => g.effet?.type === 'crescendo');
  if (cresc.length) r.push([...croissant.filter((g) => !cresc.includes(g)), ...cresc]);
  const accords = croissant.filter((g) => g.effet?.type === 'accord');
  for (const a of accords) {
    const reste = croissant.filter((g) => g !== a);
    for (let i = 0; i <= reste.length; i++) r.push([...reste.slice(0, i), a, ...reste.slice(i)]);
  }
  return r;
}

function permutations<T>(a: T[]): T[][] {
  if (a.length <= 1) return [a.slice()];
  return a.flatMap((x, i) => permutations([...a.slice(0, i), ...a.slice(i + 1)]).map((p) => [x, ...p]));
}

function sousGroupes<T>(a: T[]): T[][] {
  const r: T[][] = [];
  for (let m = 1; m < 1 << a.length; m++) r.push(a.filter((_, i) => m & (1 << i)));
  return r;
}

/** Note d'une situation, du point de vue de l'escouade */
function note(s: CombatEtat): number {
  if (s.issue === 'victoire') return 1e6 + vivants(s).reduce((n, p) => n + p.pv, 0);
  if (s.issue === 'defaite') return -1e6;
  return -1.2 * s.ennemi.pv
    + s.porteurs.reduce((n, p) => n + p.pv, 0)
    + 20 * vivants(s).length
    + 5 * s.flux
    + 0.6 * s.bouclier
    + 6 * s.capaBonus;
}

/**
 * Joue un tour : essaie toutes les chaînes raisonnables, simule chacune avec le vrai moteur
 * (tour ennemi compris) et garde la meilleure. Peut dépenser 1 Flux pour une place de plus.
 */
export function jouerTour(s: CombatEtat): void {
  let meilleur: { score: number; uids: string[]; allonge: boolean } | null = null;
  const essais = [false];
  if (s.flux > 0 && capacite(s) < REGLES.capaciteMax) essais.push(true);
  for (const allonge of essais) {
    const cap = capacite(s) + (allonge ? 1 : 0);
    for (const groupe of sousGroupes(s.main)) {
      if (groupe.reduce((n, g) => n + places(g), 0) > cap) continue;
      for (const ordre of ordres(groupe)) {
        const t = clone(s);
        if (allonge) allonger(t);
        for (const g of ordre) ajouter(t, g.uid);
        if (t.chaine.length !== ordre.length) continue;
        lancer(t, { silencieux: true });
        const score = note(t) - (allonge ? 4 : 0);
        if (!meilleur || score > meilleur.score) meilleur = { score, uids: ordre.map((g) => g.uid), allonge };
      }
    }
  }
  if (!meilleur) {
    // main injouable (ne devrait pas arriver) : on pose ce qui rentre
    for (const g of s.main.slice()) if (placesLibres(s) >= places(g)) ajouter(s, g.uid);
  } else {
    if (meilleur.allonge) allonger(s);
    for (const uid of meilleur.uids) ajouter(s, uid);
  }
  lancer(s, { silencieux: true });
}

export interface Escouade {
  /** id du Porteur → cartes greffées, avec leur niveau */
  [porteurId: string]: { id: string; niveau: number }[];
}

export interface ResultatExpedition {
  victoire: boolean;
  /** combats gagnés (0 à 3) */
  combats: number;
  /** progression de 0 à 1 : combats gagnés + part des PV retirés au dernier ennemi, sur le nombre de combats */
  progres: number;
  tours: number;
}

/** Une expédition complète, jouée par le robot */
export function simulerExpedition(escouade: Escouade, strate: number, rng: number): ResultatExpedition {
  const ids = Object.keys(escouade);
  const porteurs = ids.map((id) => ({ id, pv: porteurDef(id).pvMax, pvMax: porteurDef(id).pvMax, aTerre: false }));
  const deck = [...ids.flatMap((id) => gestesAvecModules(id, escouade[id]!)), ...GESTES_SPECIAUX];
  let x = nouvelleExpedition({ porteurs, deck, strate, rng });
  let tours = 0;
  let combats = 0;
  while (!x.terminee && tours < 400) {
    if (x.combat.issue !== 'en-cours') {
      if (x.combat.issue === 'victoire') combats++;
      x = cloturerCombat(x);
      if (!x.terminee) x = combatSuivant(x);
      continue;
    }
    jouerTour(x.combat);
    tours++;
  }
  const e = x.combat.ennemi;
  const partiel = x.combat.issue === 'victoire' ? 0 : 1 - e.pv / e.pvMax;
  return {
    victoire: x.combat.issue === 'victoire' && combats === x.sequence.length,
    combats,
    progres: Math.min(1, (combats + partiel) / x.sequence.length),
    tours,
  };
}

export interface Mesure {
  /** part des expéditions gagnées */
  victoire: number;
  /** progression moyenne (plus fine que la victoire seule) */
  progres: number;
}

/** Joue `parties` expéditions (graines fixes, donc reproductible) */
export function mesurer(escouade: Escouade, strate: number, parties: number, graineDepart = 1): Mesure {
  let v = 0;
  let p = 0;
  for (let k = 0; k < parties; k++) {
    const r = simulerExpedition(escouade, strate, graineDepart + k * 7919);
    if (r.victoire) v++;
    p += r.progres;
  }
  return { victoire: v / parties, progres: p / parties };
}

export const tauxVictoire = (escouade: Escouade, strate: number, parties: number, graineDepart = 1) =>
  mesurer(escouade, strate, parties, graineDepart).victoire;
