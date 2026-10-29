// Couche 3 — l'empreinte d'une carte (décision du 28 octobre 2026) : chaque carte garde la trace de ce qu'elle a vécu.
// Bryan : « qu'est-ce qui donne envie de collectionner ? » — une carte qu'on a portée longtemps n'est plus la même que celle
// d'un autre joueur. Elle retient où on l'a trouvée, qui l'a jouée d'abord, ses coups, ses Fêlures, ses Gardiens ;
// elle passe trois paliers (Trace, Sillon, Empreinte) qui allument son filigrane, et gagne des épithètes à choisir.
// Pur prestige : AUCUN effet en combat (une carte vétérane ne frappe pas plus fort, un nouveau joueur n'est pas désavantagé).
// Tout se lit dans le journal du combat (CombatEtat.historique) : rien à brancher dans le moteur.

import { estCarteConnue, moduleDef, porteurDef } from '../donnees';
import type { CombatEtat } from '../types';
import type { Jeu } from './etat';

/** Ce qu'une carte (un exemplaire « carte@métal ») a vécu. Clés courtes : la sauvegarde reste légère. */
export interface VecuCarte {
  /** Strate où elle a été trouvée (absente : arrivée autrement, kit, Comptoir, Forge…) */
  o?: number;
  /** le premier Porteur qui l'a jouée */
  p?: string;
  /** fois lancée dans une chaîne */
  l: number;
  /** combats gagnés où elle a été jouée */
  v: number;
  /** dégâts infligés, bouclier donné, soins donnés */
  d: number;
  b: number;
  s: number;
  /** derniers coups (elle a abattu le dernier ennemi d'un combat) */
  a: number;
  /** Fêlures brisées */
  f: number;
  /** la Strate la plus profonde où elle a gagné un combat */
  z: number;
  /** les Strates dont elle a vaincu le Gardien (présente dans la chaîne), et celles où elle a porté le dernier coup */
  g: number[];
  ga: number[];
  /** l'épithète choisi (son identifiant) ; absent : le plus récent débloqué */
  e?: string;
}

/**
 * Un vrai trophée (Bryan, 28 octobre 2026 : « pas s'obtenir dès qu'on a joué un peu »). Chaque palier demande des points
 * ET un exploit : on ne l'obtient pas en jouant longtemps à −1, il faut descendre avec la carte et qu'elle y fasse ses preuves.
 * Étude au robot (12 descentes par Strate, 6 cartes les plus jouées) : par descente, une carte gagne ~5 à 6 combats, ~0,7 dernier coup,
 * ~2,5 Fêlures à partir de −3, soit ~15 à 25 points (plus 10 pour chaque nouveau Gardien vaincu).
 *   Trace     250 pts  + un Gardien vaincu avec elle                         ≈ 12 descentes avec la même carte (une semaine)
 *   Sillon   1000 pts  + le dernier coup sur un Gardien + un combat gagné à −5 ≈ 45 descentes (3 à 4 semaines)
 *   Empreinte 3000 pts + un Gardien vaincu à −8 ou plus bas + 25 derniers coups ≈ 130 descentes (deux mois et plus)
 */
export const VECU = {
  points: { victoire: 2, dernierCoup: 4, felure: 3, gardien: 10 },
  paliers: [250, 1000, 3000] as number[],
} as const;

export const NOMS_PALIER = ['', 'Trace', 'Sillon', 'Empreinte'] as const;
export type Palier = 0 | 1 | 2 | 3;

export const vecuDe = (j: Jeu, cle: string): VecuCarte | undefined => j.vecu?.[cle];
function vecuOuNeuf(j: Jeu, cle: string): VecuCarte {
  const t = (j.vecu ??= {});
  return (t[cle] ??= { l: 0, v: 0, d: 0, b: 0, s: 0, a: 0, f: 0, z: 0, g: [], ga: [] });
}

export function pointsVecu(x: VecuCarte | undefined): number {
  if (!x) return 0;
  const P = VECU.points;
  return x.v * P.victoire + x.a * P.dernierCoup + x.f * P.felure + x.g.length * P.gardien;
}

const plusProfond = (t: number[]) => (t.length ? Math.max(...t) : 0);
/** L'exploit demandé par chaque palier, en plus des points (index = palier − 1) */
export const EXPLOITS: { texte: string; ok: (x: VecuCarte) => boolean }[][] = [
  [{ texte: 'Vaincre un Gardien avec elle dans la chaîne', ok: (x) => x.g.length > 0 }],
  [
    { texte: 'Porter le dernier coup à un Gardien', ok: (x) => x.ga.length > 0 },
    { texte: 'Gagner un combat à −5 ou plus bas', ok: (x) => x.z >= 5 },
  ],
  [
    { texte: 'Vaincre un Gardien à −8 ou plus bas', ok: (x) => plusProfond(x.g) >= 8 },
    { texte: 'Porter 25 derniers coups', ok: (x) => x.a >= 25 },
  ],
];

export function palierDe(x: VecuCarte | undefined): Palier {
  if (!x) return 0;
  const pts = pointsVecu(x);
  let p = 0;
  while (p < 3 && pts >= VECU.paliers[p]! && EXPLOITS[p]!.every((e) => e.ok(x))) p++;
  return p as Palier;
}
export const palierCarte = (j: Jeu, cle: string): Palier => palierDe(vecuDe(j, cle));

/** Ce qu'il manque pour le palier suivant : les points, et chaque exploit (fait ou non). null au dernier palier. */
export function versPalierSuivant(x: VecuCarte | undefined): { palier: Palier; points: number; seuil: number; depart: number; exploits: { texte: string; fait: boolean }[] } | null {
  const p = palierDe(x);
  if (p >= 3) return null;
  return {
    palier: (p + 1) as Palier, points: pointsVecu(x), seuil: VECU.paliers[p]!, depart: p ? VECU.paliers[p - 1]! : 0,
    exploits: EXPLOITS[p]!.map((e) => ({ texte: e.texte, fait: !!x && e.ok(x) })),
  };
}

// ---------- Les épithètes ----------
// Tournures sans accord (« qui a tenu à −7 ») : une carte est tantôt féminine, tantôt masculine.

interface EpitheteDef { id: string; texte: (x: VecuCarte) => string; ok: (x: VecuCarte, type: string) => boolean; aide: string }
const max = (t: number[]) => (t.length ? Math.max(...t) : 0);

export const EPITHETES: EpitheteDef[] = [
  // les seuils suivent l'étude au robot : chacun demande plusieurs semaines avec la même carte, ou un exploit rare
  { id: 'premier', texte: () => 'qui achève', ok: (x) => x.a >= 10, aide: 'Porter 10 derniers coups.' },
  { id: 'profond', texte: (x) => `qui a vu −${x.z}`, ok: (x) => x.z >= 5, aide: 'Gagner un combat à la Strate −5 ou plus bas.' },
  { id: 'gardien', texte: (x) => `qui a fendu le Gardien de −${max(x.ga)}`, ok: (x) => x.ga.length > 0, aide: 'Porter le dernier coup à un Gardien.' },
  { id: 'felures', texte: () => 'qui fend les Fêlures', ok: (x) => x.f >= 60, aide: 'Briser 60 Fêlures.' },
  { id: 'tenu', texte: (x) => `qui a tenu à −${x.z}`, ok: (x, t) => t === 'bouclier' && x.b >= 1500 && x.z >= 4, aide: 'Une carte de bouclier : donner 1 500 de bouclier et gagner à −4 ou plus bas.' },
  { id: 'veille', texte: () => 'qui n’a laissé tomber personne', ok: (x, t) => t === 'soin' && x.s >= 1500, aide: 'Une carte de soin : soigner 1 500 PV.' },
  { id: 'mille', texte: () => 'aux mille coups', ok: (x, t) => t === 'atk' && x.d >= 6000, aide: 'Une carte d’attaque : infliger 6 000 dégâts.' },
  { id: 'veteran', texte: () => 'de toutes les descentes', ok: (x) => x.v >= 300, aide: 'Gagner 300 combats.' },
];

/** Les épithètes débloqués, dans l'ordre de la liste */
export function epithetesDe(cle: string, x: VecuCarte | undefined): { id: string; texte: string }[] {
  if (!x || !estCarteConnue(cle)) return [];
  const type = moduleDef(cle).type;
  return EPITHETES.filter((e) => e.ok(x, type)).map((e) => ({ id: e.id, texte: e.texte(x) }));
}
/** L'épithète affiché : celui choisi, sinon le dernier débloqué */
export function epitheteAffiche(cle: string, x: VecuCarte | undefined): string | null {
  const liste = epithetesDe(cle, x);
  if (!liste.length) return null;
  return (liste.find((e) => e.id === x?.e) ?? liste[liste.length - 1]!).texte;
}
export function choisirEpithete(j: Jeu, cle: string, id: string): boolean {
  const x = vecuDe(j, cle);
  if (!x || !epithetesDe(cle, x).some((e) => e.id === id)) return false;
  x.e = id;
  return true;
}

/** Le journal de la carte, en quelques phrases (sans accord, pour la même raison) */
export function journalCarte(x: VecuCarte | undefined): string[] {
  if (!x) return [];
  const l: string[] = [];
  if (x.o) l.push(`Mise au jour à −${x.o}.`);
  if (x.p) l.push(`Premier Porteur : ${porteurDef(x.p).nom}.`);
  if (x.l) l.push(`${x.l} lancer${x.l > 1 ? 's' : ''} · ${x.v} combat${x.v > 1 ? 's' : ''} gagné${x.v > 1 ? 's' : ''}.`);
  if (x.a || x.f) l.push([x.a ? `${x.a} dernier${x.a > 1 ? 's' : ''} coup${x.a > 1 ? 's' : ''}` : '', x.f ? `${x.f} Fêlure${x.f > 1 ? 's' : ''} brisée${x.f > 1 ? 's' : ''}` : ''].filter(Boolean).join(' · ') + '.');
  if (x.ga.length) l.push(`A fendu le Gardien de −${max(x.ga)}.`);
  else if (x.g.length) l.push(`Était là contre le Gardien de −${max(x.g)}.`);
  if (x.z) l.push(`Profondeur atteinte : −${x.z}.`);
  return l;
}

// ---------- Ce qui s'inscrit ----------

/** Une carte trouvée dans une Strate : le lieu reste gravé (seulement la première fois) */
export function noterOrigine(j: Jeu, cle: string, strate: number): void {
  if (strate < 1 || !estCarteConnue(cle)) return;
  const x = vecuOuNeuf(j, cle);
  x.o ??= strate;
}

/**
 * La fin d'un combat gagné ou perdu : chaque carte jouée y inscrit ses coups, protections, soins et Fêlures ;
 * une victoire inscrit le combat gagné, la profondeur, le dernier coup et le Gardien.
 */
export function noterVecu(j: Jeu, c: CombatEtat, o: { strate: number; gardien: boolean }): void {
  const histo = c.historique ?? [];
  const victoire = c.issue === 'victoire';
  const jouees = new Set<string>();
  let dernier: string | undefined;
  for (const t of histo) {
    for (const k of t.chaine) {
      // les cartes du district (Stimulant, Pavois de cuivre) n'ont pas d'empreinte
      if (!k.carte || !estCarteConnue(k.carte)) continue;
      const x = vecuOuNeuf(j, k.carte);
      x.l++;
      if (!x.p && k.porteur) x.p = k.porteur;
      jouees.add(k.carte);
    }
    for (const ligne of t.lignes) {
      if (ligne.camp !== 'joueur' || ligne.rang === undefined) continue;
      const cle = t.chaine[ligne.rang]?.carte;
      if (!cle || !estCarteConnue(cle)) continue;
      const x = vecuOuNeuf(j, cle);
      const v = Math.max(0, Math.round(ligne.v ?? 0));
      if (ligne.sorte === 'coup') { x.d += v; dernier = cle; }
      else if (ligne.sorte === 'protection') x.b += v;
      else if (ligne.sorte === 'soin') x.s += v;
      else if (ligne.sorte === 'effet' && ligne.texte.startsWith('Fêlure')) x.f++;
    }
  }
  if (!victoire) return;
  for (const cle of jouees) {
    const x = vecuOuNeuf(j, cle);
    x.v++;
    x.z = Math.max(x.z, o.strate);
    if (o.gardien && !x.g.includes(o.strate)) x.g.push(o.strate);
  }
  if (dernier) {
    const x = vecuOuNeuf(j, dernier);
    x.a++;
    if (o.gardien && !x.ga.includes(o.strate)) x.ga.push(o.strate);
  }
}
