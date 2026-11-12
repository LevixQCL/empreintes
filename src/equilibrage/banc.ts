// Le banc d'équilibrage (equilibrage.html, 12 novembre 2026) : ce que le robot mesure pour chaque carte, sans passer par Claude.
// Même méthode que la refonte des quasi-doublons (scripts/refonte.ts) : la carte prend la place de la carte de départ de sa lignée,
// dans son métal d'origine (en cuivre pour une carte de fer : le fer n'a pas d'effet), et l'escouade de départ descend une Strate −3
// entière. On compare la part de descentes gagnées avec celle du deck de départ, sur les mêmes graines (mêmes salles, mêmes tirages).
// Fonctions pures (aucun navigateur) : testées dans tests/banc.test.ts.

import { COLLECTION, NOMS_RARETE, RARETES, puissanceCarte } from '../core/collection';
import { CARTES_DE_BASE, DEPART_PORTEURS, ENNEMIS, METAL_FORCE, METAL_FREQ, METAL_RENFORT, MODULES, PORTEURS, carteId, moduleDef } from '../core/donnees';
import { FORCE } from '../core/expedition';
import { REGLES } from '../core/regles';
import type { Escouade } from '../core/robot';
import type { Lignee, ModuleDef, Rarete } from '../core/types';

/** La Strate de la mesure : là où une carte de plus ou de moins se voit le mieux (rapport du robot) */
export const STRATE_BANC = 3;

/** Les écarts qui font signaler une carte, en points de victoire (+10 = une descente gagnée de plus sur dix) */
export const SEUILS = {
  /** au-delà de cet écart avec la moyenne de son métal, la carte sort du lot (comme le robot : 8 points) */
  ecart: 8,
  /** une carte qui bat la moyenne du métal au-dessus d'elle de plus de tant est trop forte (et l'inverse) */
  voisin: 4,
  /** les cartes à part (Héritage, origine, parrainage) sont faites pour être plus fortes : tolérance doublée */
  facteurSpeciales: 2,
  /** il faut au moins tant de cartes mesurées dans un métal pour en faire une moyenne */
  minParMetal: 3,
  /** repérage sans simulation : écart à la médiane du métal (en %) qui fait regarder une carte de plus près */
  estimation: 35,
};

/** Les trois modes : nombre de descentes par mesure, et le bruit qui va avec (± en points, à peu près) */
export const MODES = {
  rapide: { nom: 'Rapide', parties: 60 },
  normal: { nom: 'Normal', parties: 150 },
  precis: { nom: 'Précis', parties: 300 },
} as const;
export type Mode = keyof typeof MODES;
/** Le bruit d'une mesure : les graines communes le réduisent, ~1,4 écart-type d'une proportion autour de 50 % */
export const bruit = (parties: number) => Math.round(140 * Math.sqrt(0.25 / parties));

/** Le Porteur nommé de chaque lignée, et sa carte de départ (celle qu'une carte mesurée remplace) */
export const DEPART: Record<Lignee, { porteur: string; carte: string }> = {
  tech: { porteur: 'ilka', carte: 'jambes-ressort' },
  bio: { porteur: 'doran', carte: 'glande-ambre' },
  reso: { porteur: 'vela', carte: 'eclat-chant' },
};

/** Le métal dans lequel on mesure une carte : son métal d'origine, en cuivre pour une carte de fer */
export const metalMesure = (id: string): Rarete => (moduleDef(id).rarete === 'fer' ? 'cuivre' : moduleDef(id).rarete);

/** Carte à part : faite pour être plus forte que les autres de son métal */
export const estSpeciale = (m: ModuleDef) => !!(m.legs || m.origine || m.lien);

/** L'escouade de la mesure : les 6 cartes de fer de chaque Porteur nommé, la carte mesurée à la place de la carte de départ de sa lignée */
export function escouadeBanc(remplace?: string): Escouade {
  const e: Escouade = {};
  const m = remplace ? moduleDef(remplace) : undefined;
  for (const l of ['tech', 'bio', 'reso'] as Lignee[]) {
    const { porteur, carte } = DEPART[l];
    e[porteur] = DEPART_PORTEURS[porteur]!.map((id) => {
      const cle = id === carte && m?.lignee === l ? carteId(remplace!, metalMesure(remplace!)) : carteId(id, 'fer');
      return { id: cle, niveau: COLLECTION.niveauDepart[moduleDef(cle).rarete] };
    });
  }
  return e;
}

/** Les cartes qu'on peut mesurer : toutes sauf les 15 cartes de base, déjà dans le deck de départ */
export const cartesMesurables = (): ModuleDef[] => MODULES.filter((m) => !CARTES_DE_BASE.includes(m.id));

/** Une empreinte courte (FNV-1a) : sert à savoir si une mesure a été faite sur les réglages d'aujourd'hui */
export function empreinte(x: unknown): string {
  const s = JSON.stringify(x);
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193); }
  return (h >>> 0).toString(16).padStart(8, '0');
}

/** Tout ce qui change le résultat de toutes les cartes à la fois : ennemis, règles, métaux, Porteurs et cartes du deck de départ */
export function empreinteReglages(): string {
  const depart = Object.values(DEPART_PORTEURS).flat().map((id) => moduleDef(id));
  return empreinte({ v: 1, ENNEMIS, REGLES, FORCE, COLLECTION, PORTEURS, METAL_FORCE, METAL_FREQ, METAL_RENFORT, depart, STRATE_BANC });
}

/** Ce qui change le résultat d'une seule carte : sa définition */
export const empreinteCarte = (id: string) => empreinte(moduleDef(id));

/** Une mesure gardée par la page */
export interface Mesure {
  /** points de victoire par rapport au deck de départ */
  points: number;
  parties: number;
  /** empreintes au moment de la mesure */
  reglages: string;
  carte: string;
  date: number;
}

/** seule : mesurée, mais trop peu de cartes de son métal le sont pour la comparer */
export type Verdict = 'forte' | 'faible' | 'ok' | 'seule' | 'perimee' | 'aucune';

export interface LigneBanc {
  m: ModuleDef;
  metal: Rarete;
  /** puissance estimée sans simulation (puissanceCarte), et son écart en % à la médiane de son métal */
  estimation: number;
  ecartEstimation: number;
  mesure?: Mesure;
  verdict: Verdict;
  /** pourquoi la carte est signalée */
  raison: string;
}

const moyenne = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : NaN);
const mediane = (xs: number[]) => {
  if (!xs.length) return NaN;
  const s = xs.slice().sort((a, b) => a - b);
  const k = Math.floor(s.length / 2);
  return s.length % 2 ? s[k]! : (s[k - 1]! + s[k]!) / 2;
};
const signe = (x: number) => `${x >= 0 ? '+' : '−'}${Math.abs(Math.round(x))}`;

/** Une mesure compte si elle a été faite sur les réglages et la carte d'aujourd'hui */
export const aJour = (me: Mesure | undefined, id: string, reglages: string): boolean =>
  !!me && me.reglages === reglages && me.carte === empreinteCarte(id);

/**
 * Le tableau : chaque carte mesurable, son estimation sans simulation, sa mesure et son verdict.
 * Une carte est signalée quand elle s'écarte de plus de SEUILS.ecart de la moyenne de son métal,
 * ou quand elle bat la moyenne du métal au-dessus (fait moins bien que celle du métal en dessous) de plus de SEUILS.voisin.
 */
export function tableau(mesures: Record<string, Mesure>, reglages: string): LigneBanc[] {
  const cartes = cartesMesurables();
  // l'estimation : la même que le tri « Puissance » de l'écran Cartes, comparée à la médiane du métal de la mesure
  const est = new Map(cartes.map((m) => [m.id, puissanceCarte(carteId(m.id, metalMesure(m.id)), 1)]));
  const medEst = {} as Record<Rarete, number>;
  for (const r of RARETES) medEst[r] = mediane(cartes.filter((m) => metalMesure(m.id) === r && !estSpeciale(m)).map((m) => est.get(m.id)!));
  // les moyennes des mesures à jour, par métal (sans les cartes à part, faites pour être plus fortes)
  const moy = {} as Record<Rarete, number>;
  for (const r of RARETES) {
    const xs = cartes.filter((m) => metalMesure(m.id) === r && !estSpeciale(m) && aJour(mesures[m.id], m.id, reglages)).map((m) => mesures[m.id]!.points);
    moy[r] = xs.length >= SEUILS.minParMetal ? moyenne(xs) : NaN;
  }
  return cartes.map((m) => {
    const metal = metalMesure(m.id);
    const e = est.get(m.id)!;
    const ecartEstimation = Number.isNaN(medEst[metal]) ? 0 : Math.round((100 * (e - medEst[metal])) / medEst[metal]);
    const mesure = mesures[m.id];
    const base = { m, metal, estimation: Math.round(e * 10) / 10, ecartEstimation, ...(mesure ? { mesure } : {}) };
    if (!mesure) return { ...base, verdict: 'aucune' as const, raison: '' };
    if (!aJour(mesure, m.id, reglages)) {
      return { ...base, verdict: 'perimee' as const, raison: mesure.carte !== empreinteCarte(m.id) ? 'La carte a changé depuis la mesure' : 'Les réglages du jeu ont changé depuis la mesure' };
    }
    const k = estSpeciale(m) ? SEUILS.facteurSpeciales : 1;
    const p = mesure.points, i = RARETES.indexOf(metal);
    const dessus = moy[RARETES[i + 1] ?? metal], dessous = i > 0 ? moy[RARETES[i - 1]!] : NaN;
    const nm = NOMS_RARETE[metal].toLowerCase();
    if (!Number.isNaN(moy[metal]) && p > moy[metal] + SEUILS.ecart * k) return { ...base, verdict: 'forte' as const, raison: `${signe(p - moy[metal])} points au-dessus de la moyenne du ${nm} (${signe(moy[metal])})` };
    if (i < RARETES.length - 1 && !Number.isNaN(dessus) && p > dessus + SEUILS.voisin * k) return { ...base, verdict: 'forte' as const, raison: `Fait mieux que la moyenne du ${NOMS_RARETE[RARETES[i + 1]!].toLowerCase()} (${signe(dessus)})` };
    if (!Number.isNaN(moy[metal]) && p < moy[metal] - SEUILS.ecart * k) return { ...base, verdict: 'faible' as const, raison: `${signe(moy[metal] - p).replace('+', '')} points sous la moyenne du ${nm} (${signe(moy[metal])})` };
    if (!Number.isNaN(dessous) && p < dessous - SEUILS.voisin * k) return { ...base, verdict: 'faible' as const, raison: `Fait moins bien que la moyenne du ${NOMS_RARETE[RARETES[i - 1]!].toLowerCase()} (${signe(dessous)})` };
    if (Number.isNaN(moy[metal])) return { ...base, verdict: 'seule' as const, raison: `Pas encore assez de cartes mesurées en ${nm} pour comparer` };
    return { ...base, verdict: 'ok' as const, raison: '' };
  });
}

/** Les moyennes par métal (mesures à jour, sans les cartes à part), pour l'en-tête */
export function moyennes(lignes: LigneBanc[]): { metal: Rarete; moyenne: number; n: number }[] {
  return RARETES.map((metal) => {
    const xs = lignes.filter((l) => l.metal === metal && !estSpeciale(l.m) && l.verdict !== 'aucune' && l.verdict !== 'perimee' && l.verdict !== 'seule').map((l) => l.mesure!.points);
    // « seule » : la carte est mesurée, elle compte quand même dans la moyenne affichée
    xs.push(...lignes.filter((l) => l.metal === metal && !estSpeciale(l.m) && l.verdict === 'seule').map((l) => l.mesure!.points));
    return { metal, moyenne: moyenne(xs), n: xs.length };
  });
}

/** Le rapport à copier (texte court, à coller dans une conversation si besoin) */
export function rapportTexte(lignes: LigneBanc[], facteur: number, base: number | null): string {
  const d = new Date().toISOString().slice(0, 10);
  let t = `Banc d'équilibrage Ossyra · ${d} · Strate −${STRATE_BANC}, ennemis ×${facteur.toFixed(2)}`;
  if (base !== null) t += `, deck de départ ${Math.round(base * 100)} %`;
  t += '\n';
  t += 'Moyennes : ' + moyennes(lignes).filter((x) => x.n).map((x) => `${NOMS_RARETE[x.metal]} ${signe(x.moyenne)} (${x.n})`).join(' · ') + '\n\n';
  const signalees = lignes.filter((l) => l.verdict === 'forte' || l.verdict === 'faible');
  t += signalees.length ? 'Cartes signalées :\n' : 'Aucune carte signalée.\n';
  for (const l of signalees) t += `- ${l.m.nom} (${NOMS_RARETE[l.metal]}) : ${signe(l.mesure!.points)} · ${l.verdict === 'forte' ? 'TROP FORTE' : 'trop faible'} · ${l.raison}\n`;
  const autres = lignes.filter((l) => l.verdict === 'ok' || l.verdict === 'seule');
  if (autres.length) t += '\nDans la norme : ' + autres.map((l) => `${l.m.nom} ${signe(l.mesure!.points)}`).join(', ') + '\n';
  const manque = lignes.filter((l) => l.verdict === 'aucune' || l.verdict === 'perimee').length;
  if (manque) t += `\n${manque} carte(s) pas mesurée(s) ou à remesurer.\n`;
  return t;
}
