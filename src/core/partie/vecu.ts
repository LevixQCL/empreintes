// Couche 3 — l'empreinte d'une carte (décision du 28 octobre 2026) : chaque carte garde la trace de ce qu'elle a vécu.
// Bryan : « qu'est-ce qui donne envie de collectionner ? » — une carte qu'on a portée longtemps n'est plus la même que celle
// d'un autre joueur. Elle retient où on l'a trouvée, qui l'a jouée d'abord, ses coups, ses Fêlures, ses Gardiens ;
// elle passe trois paliers (Trace, Sillon, Empreinte) qui allument son filigrane, et gagne des épithètes à choisir.
// Pur prestige : AUCUN effet en combat (une carte vétérane ne frappe pas plus fort, un nouveau joueur n'est pas désavantagé).
// Tout se lit dans le journal du combat (CombatEtat.historique) : rien à brancher dans le moteur.

import { moduleDef, porteurDef } from '../donnees';
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
 * Les réglages (étude du 28 octobre 2026, une vraie descente jouée par le robot à −1) : une carte du deck y gagne 14 à 28 points,
 * dont 10 pour un Gardien vaincu pour la première fois ; une descente de plus dans une Strate déjà vaincue en rapporte ~12.
 * La Trace s'allume donc dès la 1re descente pour les cartes les plus jouées (récompense immédiate), le Sillon vers la 9e,
 * l'Empreinte vers la 28e (une à deux semaines pour un joueur régulier, plus pour une carte qu'on change souvent).
 */
export const VECU = {
  points: { victoire: 2, dernierCoup: 4, felure: 3, gardien: 10 },
  paliers: [20, 120, 360] as number[],
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

export function palierDe(x: VecuCarte | undefined): Palier {
  const pts = pointsVecu(x);
  return (VECU.paliers.filter((s) => pts >= s).length) as Palier;
}
export const palierCarte = (j: Jeu, cle: string): Palier => palierDe(vecuDe(j, cle));

/** Ce qu'il manque pour le palier suivant (null au dernier) */
export function versPalierSuivant(x: VecuCarte | undefined): { palier: Palier; points: number; seuil: number; depart: number } | null {
  const p = palierDe(x);
  if (p >= 3) return null;
  return { palier: (p + 1) as Palier, points: pointsVecu(x), seuil: VECU.paliers[p]!, depart: p ? VECU.paliers[p - 1]! : 0 };
}

// ---------- Les épithètes ----------
// Tournures sans accord (« qui a tenu à −7 ») : une carte est tantôt féminine, tantôt masculine.

interface EpitheteDef { id: string; texte: (x: VecuCarte) => string; ok: (x: VecuCarte, type: string) => boolean; aide: string }
const max = (t: number[]) => (t.length ? Math.max(...t) : 0);

export const EPITHETES: EpitheteDef[] = [
  { id: 'premier', texte: () => 'qui a porté le dernier coup', ok: (x) => x.a >= 1, aide: 'Abattre le dernier ennemi d’un combat.' },
  { id: 'profond', texte: (x) => `qui a vu −${x.z}`, ok: (x) => x.z >= 3, aide: 'Gagner un combat à la Strate −3 ou plus bas.' },
  { id: 'gardien', texte: (x) => `qui a fendu le Gardien de −${max(x.ga)}`, ok: (x) => x.ga.length > 0, aide: 'Porter le dernier coup à un Gardien.' },
  { id: 'felures', texte: () => 'qui fend les Fêlures', ok: (x) => x.f >= 10, aide: 'Briser 10 Fêlures.' },
  { id: 'tenu', texte: (x) => `qui a tenu à −${x.z}`, ok: (x, t) => t === 'bouclier' && x.b >= 600 && x.z >= 2, aide: 'Une carte de bouclier : protéger beaucoup, loin dans les Strates.' },
  { id: 'veille', texte: () => 'qui n’a laissé tomber personne', ok: (x, t) => t === 'soin' && x.s >= 500, aide: 'Une carte de soin : soigner beaucoup.' },
  { id: 'mille', texte: () => 'aux mille coups', ok: (x, t) => t === 'atk' && x.d >= 3000, aide: 'Une carte d’attaque : infliger 3 000 dégâts.' },
  { id: 'veteran', texte: () => 'de toutes les descentes', ok: (x) => x.v >= 60, aide: 'Gagner 60 combats.' },
];

/** Les épithètes débloqués, dans l'ordre de la liste */
export function epithetesDe(cle: string, x: VecuCarte | undefined): { id: string; texte: string }[] {
  if (!x) return [];
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
  if (strate < 1) return;
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
      if (!k.carte) continue;
      const x = vecuOuNeuf(j, k.carte);
      x.l++;
      if (!x.p && k.porteur) x.p = k.porteur;
      jouees.add(k.carte);
    }
    for (const ligne of t.lignes) {
      if (ligne.camp !== 'joueur' || ligne.rang === undefined) continue;
      const cle = t.chaine[ligne.rang]?.carte;
      if (!cle) continue;
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
