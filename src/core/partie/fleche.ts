// Couche 5 ter — la Flèche (28 octobre 2026, Bryan : « commencer à coder la flèche et tout ce qui va avec »).
// La dernière flèche d'amarrage des Hauts (lore du 25 octobre, voir FLECHE dans classements.ts) : depuis la Clause de
// la Flèche des Accords de 2101, tout district peut y envoyer une escouade. On y monte quai par quai, chaque quai gardé
// par des gardiens payés par les Hauts, plus forts à chaque étage : vite en bas, lentement en haut.
//   - une victoire fait monter (4 quais en bas, 2 au milieu, 1 près du sommet) ;
//   - une défaite fait redescendre d'autant, jamais sous le dernier quai gravé atteint ;
//   - chaque quai gravé donne sa récompense une seule fois ;
//   - pas de jeton : on monte autant qu'on veut, l'Usure de l'escouade est la seule limite (rien à attendre pour jouer).
// Deux couches (29 octobre 2026, Bryan : « une partie histoire où l'on finit par réussir à monter et une partie
// compétition où l'on veut devenir le gardien de l'étage le plus haut ») :
//   - la montée (l'histoire) se fait toujours contre les gardiens payés par les Hauts : aucun joueur ne bloque personne ;
//   - la garde (la compétition) : on tient un quai libre déjà atteint, avec une escouade figée qui le garde pendant qu'on
//     continue de monter ; les Hauts versent un gage ; un quai déjà tenu se prend en défiant son gardien. Un défi perdu
//     ne coûte que l'Usure ; un gardien battu perd son quai (jamais sa progression dans l'histoire).
// Le sommet (les Sièges tenus par des joueurs, le passage d'une île) viendra plus tard.
// Fonctions pures : le temps est toujours passé en paramètre (`now`, en ms).

import { PORTEURS, porteurDef } from '../donnees';
import { creerCombat } from '../combat';
import { FLECHE } from '../classements';
import { nouvelleExpedition } from '../expedition';
import { graine, tireur } from '../rng';
import { CONFIANCE, XP, bonusPv, confier, gagnerXp, log, niveauPorteur, non, pvNiveau, usureAuRetour, type Jeu, type Resultat } from './etat';
import { escouadePrete, payerRatelier, type Retour } from './descentes';
import { quitterPostes } from './recompenses';
import { PILLAGE, remonter as remonterPillage, type Garnison } from './pillages';

export { FLECHE };

export const ASCENSION = {
  /** la force des gardiens (même échelle que les garnisons des pillages) : du premier quai au dernier, une montée régulière
   *  (+0,8 % par quai). Repères mesurés : l'escouade de départ fait 3,3 ; 18 cartes en fer niveau 1 font 5,0 ; une escouade
   *  mi-parcours (cuivre et argent niveau 5, Porteurs niveau 8) 5,3 à 6 ; la meilleure (or niveau 10, Porteurs niveau 20) 8,4.
   *  Au pied 3,4 : juste au-dessus de l’escouade de départ ; celle qui arrive à la Flèche (après la Strate −6) y grimpe vite.
   *  Au sommet 8,8 : un peu au-dessus de la meilleure escouade, il faut aussi bien jouer. */
  forcePied: 3.4,
  forceSommet: 8.8,
  /** les récompenses des quais gravés, une seule fois chacune */
  recompenses: {
    20: { composants: 150, eclats: 3 },
    40: { composants: 300, eclats: 5 },
    50: { composants: 400, eclats: 6 },
    60: { composants: 500, eclats: 7 },
    70: { composants: 650, eclats: 8 },
    80: { composants: 800, eclats: 10 },
    90: { composants: 1000, eclats: 12 },
    101: { composants: 1500, eclats: 20 },
  } as Record<number, { composants: number; eclats: number }>,
  /** tenir un quai : le gage par jour (composants = base + parQuai × quai ; Éclats à partir de certains quais) */
  gage: { base: 30, parQuai: 3, eclats: [{ des: 40, n: 1 }, { des: 80, n: 2 }] },
  /** le gage s'accumule au plus deux jours dans la caisse du quai (rien n'est perdu de ce qui est reçu) */
  caisseJours: 2,
  /** une défense tenue rapporte un quart de jour de gage */
  partDefense: 0.25,
} as const;

/** L'état du joueur sur la Flèche ; absent tant qu'il n'y est pas monté */
export interface EtatFleche {
  /** le quai où se tient l'escouade (1 = le pied) */
  quai: number;
  /** le plus haut quai atteint, et quand */
  record: number;
  recordLe: number;
  /** les quais gravés dont la récompense a été reçue */
  recus: number[];
  victoires: number;
  defaites: number;
  /** le quai tenu par l'escouade (absent si elle ne tient rien) */
  garde?: GardeQuai;
  /** les assauts subis déjà comptés (ids en ligne, deux jours) */
  assautsRecus?: { id: string; le: number }[];
  /** les défis joués contre des directeurs gardiens, pas encore envoyés en ligne */
  aEnvoyer?: AssautJoue[];
}

/** Un quai tenu : la garnison figée au moment de s'installer, et la caisse du gage */
export interface GardeQuai {
  quai: number;
  depuis: number;
  /** jusqu'où le gage a été versé */
  gageLe: number;
  garnison: Garnison;
  repousses: number;
}

/** Un directeur qui tient un quai (lu en ligne) */
export interface GardienQuai { id: string; nom: string; quai: number; porteurs: string[]; force: number; /** son installation (en ligne) */ depuis?: number }

/** Un assaut joué contre un directeur gardien (à noter chez lui) */
export interface AssautJoue { cible: string; quai: number; victoire: boolean; le: number; /** l'installation du gardien défié */ depuis?: number }

/** Un assaut subi, reçu du réseau (victoire : celle de l'attaquant) */
export interface AssautSubi { id: string; nom: string; quai: number; victoire: boolean; le: number }

/** Une ascension en cours (dans l'expédition) */
export interface AscensionEnCours { quai: number; force: number; gardien?: { id: string; nom: string; depuis?: number }; defi?: boolean }

/** Ce que le retour d'un combat de la Flèche a donné */
export interface RetourFleche {
  victoire: boolean;
  /** le quai d'avant et celui d'après */
  de: number; a: number;
  /** les quais gravés passés pour la première fois, et ce qu'ils ont donné */
  paliers: { quai: number; composants: number; eclats: number }[];
  record: boolean;
  /** un défi contre un directeur gardien : son nom, et le quai pris (victoire) ou visé */
  defi?: { nom: string; quai: number };
}

/** La Flèche s'ouvre avec la lettre des Hauts (la scène « La convocation », après le gardien de la Strate −6) */
export const flecheOuverte = (j: Jeu) => (j.scenes ?? []).includes('convocation');

export function etatFleche(j: Jeu): EtatFleche {
  j.fleche ??= { quai: 1, record: 1, recordLe: 0, recus: [], victoires: 0, defaites: 0 };
  return j.fleche;
}

/** La force des gardiens d'un quai */
export function forceQuai(quai: number): number {
  const q = Math.min(FLECHE.quais, Math.max(1, quai));
  const f = ASCENSION.forcePied * (ASCENSION.forceSommet / ASCENSION.forcePied) ** ((q - 1) / (FLECHE.quais - 1));
  return Math.round(f * 1000) / 1000;
}

/** Les quais gagnés (ou perdus) par un combat depuis ce quai */
export const pas = (quai: number) => FLECHE.montee.find((m) => quai <= m.jusqua)?.quais ?? 1;

/** Le dernier quai gravé atteint : une défaite n'en fait jamais redescendre */
export const plancher = (record: number) => [...FLECHE.paliers].filter((p) => p <= record).pop() ?? 1;

/** Le prochain quai gravé au-dessus d'un quai (null au sommet) */
export const prochainPalier = (quai: number) => FLECHE.paliers.find((p) => p > quai) ?? null;

/** Les gardiens d'un quai : trois Porteurs loués par les Hauts, toujours les mêmes pour un même quai */
export function gardiensQuai(quai: number): string[] {
  const t = tireur({ rng: (quai * 2246822519 + 3266489917) >>> 0 });
  return t.melanger(PORTEURS.map((p) => p.id)).slice(0, 3);
}

export function peutMonter(j: Jeu): Resultat {
  if (!flecheOuverte(j)) return non('La Flèche s’ouvrira quand les Hauts t’y auront convié.');
  if (j.expedition) return non('Une expédition est déjà en cours.');
  if (etatFleche(j).quai >= FLECHE.quais) return non('Ton escouade tient le dernier quai : les Sièges s’ouvriront au passage de la prochaine île.');
  return { ok: true };
}

/** Lance un combat de la Flèche (gardiens payés, ou garnison d'un directeur pour un défi) */
function combatFleche(j: Jeu, escouade: string[], quai: number, force: number, porteurs: string[], journal: string, rng: number, defi?: GardienQuai): Resultat {
  const e = escouadePrete(j, escouade);
  if (!e.ok) return e;
  const gardes = porteurs.map((id) => `garde-${porteurDef(id).lignee}`);
  const x = nouvelleExpedition({ porteurs: e.porteurs, deck: e.deck, strate: 1, rng, sequence: [gardes[0]!], force });
  x.combat = creerCombat({
    porteurs: e.porteurs, ennemiId: gardes[0]!, escorte: gardes.slice(1), rng, deck: e.deck, force, pvPleins: true,
    ...(Object.keys(e.bonus).length ? { bonus: e.bonus } : {}),
  });
  x.combat.ennemi.porteur = porteurs[0];
  x.combat.autres?.forEach((en, k) => { en.porteur = porteurs[k + 1]; });
  x.combat.journal = [journal];
  payerRatelier(j);
  quitterPostes(j, escouade);
  j.expedition = { ...x, fleche: { quai, force, ...(defi ? { gardien: { id: defi.id, nom: defi.nom, ...(defi.depuis !== undefined ? { depuis: defi.depuis } : {}) }, defi: true } : {}) } };
  return { ok: true };
}

/** Monte affronter les gardiens payés du quai suivant : un seul combat (jamais un joueur : personne ne bloque l'histoire) */
export function monterFleche(j: Jeu, escouade: string[], rng = graine()): Resultat {
  const p = peutMonter(j);
  if (!p.ok) return p;
  const quai = etatFleche(j).quai;
  const porteurs = gardiensQuai(quai);
  const r = combatFleche(j, escouade, quai, forceQuai(quai), porteurs,
    `Quai ${quai} de la Flèche : les gardiens des Hauts barrent la passerelle (${porteurs.map((id) => porteurDef(id).nom).join(', ')}).`, rng);
  if (r.ok) log(j, `L’escouade monte à l’assaut du quai ${quai} de la Flèche.`);
  return r;
}

export function peutDefier(j: Jeu, gardien: GardienQuai | null | undefined): Resultat {
  if (!flecheOuverte(j)) return non('La Flèche s’ouvrira quand les Hauts t’y auront convié.');
  if (j.expedition) return non('Une expédition est déjà en cours.');
  if (!gardien || gardien.porteurs.length < 1) return non('Aucun gardien à défier.');
  const f = etatFleche(j);
  if (gardien.quai > f.record) return non(`Il faut avoir atteint le quai ${gardien.quai} pour en défier le gardien.`);
  if (f.garde && f.garde.quai >= gardien.quai) return non(`Tu tiens déjà un quai plus haut que le ${gardien.quai}.`);
  return { ok: true };
}

/** Défie le directeur qui tient un quai : gagner, c'est prendre sa place ; perdre ne coûte que l'Usure */
export function defierGardien(j: Jeu, escouade: string[], gardien: GardienQuai, rng = graine()): Resultat {
  const p = peutDefier(j, gardien);
  if (!p.ok) return p;
  const porteurs = [...gardien.porteurs, ...gardiensQuai(gardien.quai)].slice(0, 3);
  const r = combatFleche(j, escouade, gardien.quai, gardien.force, porteurs,
    `Quai ${gardien.quai} de la Flèche : l’escouade de ${gardien.nom}, qui tient le quai, accepte le défi.`, rng, gardien);
  if (r.ok) log(j, `L’escouade défie ${gardien.nom}, gardien du quai ${gardien.quai}.`);
  return r;
}

/** Le retour d'un combat de la Flèche : montée ou descente (ou quai pris au défi), quais gravés, Usure et expérience */
export function remonterFleche(j: Jeu, now: number): RetourFleche | null {
  const x = j.expedition;
  if (!x?.fleche) return null;
  const f = etatFleche(j);
  const victoire = x.combat.issue === 'victoire';
  const de = f.quai;
  const paliers: RetourFleche['paliers'] = [];
  let record = false;
  const defi = x.fleche.defi && x.fleche.gardien ? { ...x.fleche.gardien, quai: x.fleche.quai } : null;
  if (defi) {
    // la compétition : la montée de l'histoire ne bouge pas
    (f.aEnvoyer ??= []).push({ cible: defi.id, quai: defi.quai, victoire, le: now, ...(defi.depuis !== undefined ? { depuis: defi.depuis } : {}) });
    if (victoire) {
      if (f.garde) recevoirGage(j, now);
      f.garde = { quai: defi.quai, depuis: now, gageLe: now, garnison: garnisonFleche(j, x.combat.porteurs.map((p) => p.id)), repousses: 0 };
    }
  } else if (victoire) {
    f.victoires++;
    f.quai = Math.min(FLECHE.quais, de + pas(de));
    if (f.quai > f.record) { f.record = f.quai; f.recordLe = now; record = true; }
    for (const q of FLECHE.paliers) {
      if (q > f.quai || f.recus.includes(q)) continue;
      const r = ASCENSION.recompenses[q] ?? { composants: 0, eclats: 0 };
      f.recus.push(q);
      j.composants += r.composants;
      j.eclats += r.eclats;
      // un quai gravé, c'est de la place gagnée sur les îles (30 octobre 2026)
      confier(j, CONFIANCE.quaiGrave, 'fleche', now);
      paliers.push({ quai: q, ...r });
    }
  } else {
    f.defaites++;
    f.quai = Math.max(plancher(f.record), de - pas(de));
  }
  // l'Usure (les PV perdus) et l'expérience d'un combat, comme un pillage
  const q = x.fleche.quai;
  const xp = victoire ? Math.round(XP.combat * (1 + 0.04 * (q - 1)) * 0.75) : 0;
  for (const p of x.combat.porteurs) {
    const d = j.porteurs[p.id]!;
    usureAuRetour(j, p);
    if (xp) { const avant = niveauPorteur(j, p.id).niveau; const n = gagnerXp(j, p.id, xp); if (n && n > avant) log(j, `${porteurDef(p.id).nom} passe au niveau ${n} !`); }
    if (victoire) { const fa = (d.faits ??= {}); fa.combats = (fa.combats ?? 0) + 1; }
  }
  j.expedition = null;
  log(j, defi ? (victoire ? `Flèche : ${defi.nom} est battu, ton escouade tient désormais le quai ${defi.quai}.` : `Flèche : ${defi.nom} garde le quai ${defi.quai}.`)
    : victoire ? `Flèche : le quai ${de} tombe, l’escouade monte au quai ${f.quai}.`
    : `Flèche : repoussés au quai ${de}${f.quai < de ? `, l’escouade redescend au quai ${f.quai}` : ''}.`);
  return { victoire, de, a: f.quai, paliers, record, ...(defi ? { defi: { nom: defi.nom, quai: defi.quai } } : {}) };
}

// ---------- Tenir un quai (la compétition) ----------

/** Le gage d'un quai pour un jour */
export function gageJour(quai: number): { composants: number; eclats: number } {
  const G = ASCENSION.gage;
  return { composants: G.base + G.parQuai * quai, eclats: [...G.eclats].filter((e) => quai >= e.des).pop()?.n ?? 0 };
}

/** La garnison que l'escouade laisse sur le quai (PV pleins, sans l'Usure) */
export function garnisonFleche(j: Jeu, escouade: string[]): Garnison {
  return {
    porteurs: escouade.slice(0, 3).map((id) => ({
      id,
      pv: pvNiveau(j, id) + bonusPv(j, id),
      cartes: (j.porteurs[id]?.modules ?? []).filter((k) => j.collection[k]).map((k) => ({ id: k, niveau: j.collection[k]!.niveau })),
    })),
    strate: 1,
    coffre: 0,
  };
}

/** Le plus haut quai qu'on peut tenir : son record (le dernier quai attend les Sièges) */
export const quaiMaxTenable = (j: Jeu) => Math.min(FLECHE.quais - 1, etatFleche(j).record);

/** Le gardien qu'on peut défier : le plus haut des quais atteints, au-dessus du quai qu'on tient (portee : triée du plus haut au plus bas) */
export const cibleDefiDe = (j: Jeu, portee: GardienQuai[]): GardienQuai | null =>
  portee.find((g) => g.quai <= etatFleche(j).record && g.quai > (j.fleche?.garde?.quai ?? 0)) ?? null;

/** Le plus haut quai libre qu'on peut tenir (les quais tenus par d'autres sont dans portee) */
export function quaiLibreDe(j: Jeu, portee: GardienQuai[]): number | null {
  const pris = new Set(portee.map((g) => g.quai));
  for (let q = quaiMaxTenable(j); q >= 2; q--) if (!pris.has(q)) return q;
  return null;
}

/**
 * Tenir un quai libre déjà atteint (la liberté du quai se vérifie en ligne, avant). Changer de quai verse le gage
 * du précédent. L'escouade reste libre : c'est une copie figée qui garde le quai.
 */
export function peutTenir(j: Jeu, escouade: string[], quai: number): Resultat {
  if (!flecheOuverte(j)) return non('La Flèche s’ouvrira quand les Hauts t’y auront convié.');
  const f = etatFleche(j);
  if (quai < 2) return non('Le pied de la Flèche n’a pas de gardien : monte d’abord d’un quai.');
  if (quai > quaiMaxTenable(j)) return non(`Il faut avoir atteint le quai ${quai} pour le tenir.`);
  if (f.garde?.quai === quai) return non(`Ton escouade tient déjà le quai ${quai}.`);
  if (escouade.length < 3) return non('Il faut trois Porteurs pour tenir un quai.');
  return { ok: true };
}

export function tenirQuai(j: Jeu, escouade: string[], quai: number, now: number): Resultat {
  const p = peutTenir(j, escouade, quai);
  if (!p.ok) return p;
  const f = etatFleche(j);
  if (f.garde) recevoirGage(j, now);
  f.garde = { quai, depuis: now, gageLe: now, garnison: garnisonFleche(j, escouade), repousses: 0 };
  log(j, `Ton escouade s’installe sur le quai ${quai} de la Flèche : elle en devient le gardien.`);
  return { ok: true };
}

/** Ce que la caisse du quai contient à cet instant (au plus deux jours) */
export function gageEnCaisse(j: Pick<Jeu, 'fleche'>, now: number): { composants: number; eclats: number } {
  const g = j.fleche?.garde;
  if (!g) return { composants: 0, eclats: 0 };
  const jours = Math.min(ASCENSION.caisseJours, Math.max(0, now - g.gageLe) / 86_400_000);
  const d = gageJour(g.quai);
  return { composants: Math.floor(d.composants * jours), eclats: Math.floor(d.eclats * jours) };
}

/** Verse le gage : composants et Éclats entiers ; le reste (la fraction) continue de courir */
export function recevoirGage(j: Jeu, now: number): { composants: number; eclats: number } {
  const g = j.fleche?.garde;
  if (!g) return { composants: 0, eclats: 0 };
  const r = gageEnCaisse(j, now);
  const d = gageJour(g.quai);
  if (!r.composants && !r.eclats) return r;
  const plein = now - g.gageLe >= ASCENSION.caisseJours * 86_400_000;
  g.gageLe = plein ? now : g.gageLe + Math.floor((r.composants / d.composants) * 86_400_000);
  j.composants += r.composants;
  j.eclats += r.eclats;
  return r;
}

/** Quitter son quai : le gage est versé */
export function quitterQuai(j: Jeu, now: number): { composants: number; eclats: number } | null {
  const f = j.fleche;
  if (!f?.garde) return null;
  const r = recevoirGage(j, now);
  log(j, `Ton escouade quitte le quai ${f.garde.quai} de la Flèche.`);
  delete f.garde;
  return r;
}

/**
 * Les défis subis pendant l'absence, dans l'ordre : une défense tenue rapporte un quart de jour de gage ;
 * une défense perdue fait perdre le quai (le gage dû jusque-là est versé), jamais la progression de la montée.
 * Chaque défi n'est compté qu'une fois ; ceux d'un autre quai ou d'avant l'installation sont ignorés.
 */
export function subirAssauts(j: Jeu, assauts: AssautSubi[]): string[] {
  const f = j.fleche;
  if (!f) return [];
  const recus = (f.assautsRecus ??= []);
  const l: string[] = [];
  for (const a of assauts.slice().sort((x, y) => x.le - y.le)) {
    if (recus.some((r) => r.id === a.id)) continue;
    recus.push({ id: a.id, le: a.le });
    const g = f.garde;
    if (!g || a.quai !== g.quai || a.le < g.depuis) continue;
    if (!a.victoire) {
      g.repousses++;
      const bonus = Math.round(gageJour(g.quai).composants * ASCENSION.partDefense);
      j.composants += bonus;
      l.push(`Ton escouade a tenu le quai ${g.quai} face à ${a.nom} : les Hauts versent +${bonus} composants.`);
    } else {
      const r = recevoirGage(j, Math.max(g.gageLe, a.le));
      delete f.garde;
      l.push(`${a.nom} t’a pris le quai ${g.quai}.${r.composants ? ` Gage versé : +${r.composants} composants${r.eclats ? `, +${r.eclats} Éclats` : ''}.` : ''} Ta montée, elle, ne bouge pas.`);
    }
  }
  const dernier = recus.reduce((m, r) => Math.max(m, r.le), 0);
  f.assautsRecus = recus.filter((r) => dernier - r.le < 48 * 3_600_000);
  for (const m of l) log(j, m);
  return l;
}

/** Le retour au district : Flèche, pillage ou descente (jeu.ts l'expose sous le nom remonter) */
export function remonter(j: Jeu): Retour {
  if (!j.expedition?.fleche) return remonterPillage(j);
  const r = remonterFleche(j, j.dernierTick)!;
  return { butin: 0, nouvelleStrate: false, victoire: r.victoire, fragment: null, cartes: [], eclats: r.paliers.reduce((n, p) => n + p.eclats, 0), fleche: r };
}

/** Les chances du joueur moyen contre les gardiens d'un quai (même courbe que les pillages) */
export const chanceQuai = (forceEscouade: number, quai: number) => 1 / (1 + Math.exp((forceQuai(quai) / Math.max(0.01, forceEscouade) - 1) / PILLAGE.pente));
