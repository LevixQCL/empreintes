// Couche 5 ter — la Flèche (28 octobre 2026, Bryan : « commencer à coder la flèche et tout ce qui va avec »).
// La dernière flèche d'amarrage des Hauts (lore du 25 octobre, voir FLECHE dans classements.ts) : depuis la Clause de
// la Flèche des Accords de 2101, tout district peut y envoyer une escouade. On y monte quai par quai, chaque quai gardé
// par des gardiens payés par les Hauts, plus forts à chaque étage : vite en bas, lentement en haut.
//   - une victoire fait monter (4 quais en bas, 2 au milieu, 1 près du sommet) ;
//   - une défaite fait redescendre d'autant, jamais sous le dernier quai gravé atteint ;
//   - chaque quai gravé donne sa récompense une seule fois ;
//   - pas de jeton : on monte autant qu'on veut, l'Usure de l'escouade est la seule limite (rien à attendre pour jouer).
// Tenir un quai (29 octobre 2026, Bryan : « go pour 1+2 ») : l'escouade s'arrête sur son quai et remplace les gardiens
// payés ; les Hauts versent un gage tant qu'elle le tient ; ceux qui montent de ce quai l'affrontent (sa garnison figée
// au moment de s'installer) ; si elle tombe, le directeur redescend comme après une défaite.
// Le sommet (les Sièges tenus par des joueurs, le passage d'une île) viendra plus tard.
// Fonctions pures : le temps est toujours passé en paramètre (`now`, en ms).

import { PORTEURS, porteurDef } from '../donnees';
import { creerCombat } from '../combat';
import { FLECHE } from '../classements';
import { nouvelleExpedition } from '../expedition';
import { graine, tireur } from '../rng';
import { DISTRICT, XP, bonusPv, gagnerXp, log, niveauPorteur, non, pvNiveau, usureMax, type Jeu, type Resultat } from './etat';
import { escouadePrete, type Retour } from './descentes';
import { quitterPostes } from './recompenses';
import { PILLAGE, forceGarnison, remonter as remonterPillage, type Garnison } from './pillages';

export { FLECHE };

export const ASCENSION = {
  /** la force des gardiens (même échelle que les garnisons des pillages) : du premier quai au dernier, une montée régulière
   *  (+0,8 % par quai). Repères mesurés : l'escouade de départ fait 3,3 ; 18 cartes en fer niveau 1 font 5,0 ; une escouade
   *  mi-parcours (cuivre et argent niveau 5, Porteurs niveau 8) 5,3 à 6 ; la meilleure (or niveau 10, Porteurs niveau 20) 8,4.
   *  Au pied 3,4 : juste au-dessus de l’escouade de départ ; celle qui arrive à la Flèche (après la Strate −6) y grimpe vite.
   *  Au sommet 8,8 : un peu au-dessus de la meilleure escouade, il faut aussi bien jouer. */
  forcePied: 3.4,
  forceSommet: 8.8,
  /** l'Usure d'un combat de la Flèche : la moitié d'une expédition, comme un pillage */
  usure: 0.5,
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
  /** les Hauts ne confient un quai qu'à une escouade à sa mesure : au plus 1,25 fois la force des gardiens payés */
  mesure: 1.25,
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
  /** les assauts joués contre des directeurs gardiens, pas encore envoyés en ligne */
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

/** Un directeur qui tient le quai qu'on veut quitter (lu en ligne) */
export interface GardienQuai { id: string; nom: string; quai: number; porteurs: string[]; force: number }

/** Un assaut joué contre un directeur gardien (à noter chez lui) */
export interface AssautJoue { cible: string; quai: number; victoire: boolean; le: number }

/** Un assaut subi, reçu du réseau (victoire : celle de l'attaquant) */
export interface AssautSubi { id: string; nom: string; quai: number; victoire: boolean; le: number }

/** Une ascension en cours (dans l'expédition) */
export interface AscensionEnCours { quai: number; force: number; gardien?: { id: string; nom: string } }

/** Ce que le retour d'un combat de la Flèche a donné */
export interface RetourFleche {
  victoire: boolean;
  /** le quai d'avant et celui d'après */
  de: number; a: number;
  /** les quais gravés passés pour la première fois, et ce qu'ils ont donné */
  paliers: { quai: number; composants: number; eclats: number }[];
  record: boolean;
  /** le directeur gardien affronté, s'il y en avait un */
  gardien?: string;
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
  if (etatFleche(j).garde) return non('Ton escouade tient son quai : quitte-le pour reprendre la montée.');
  if (etatFleche(j).quai >= FLECHE.quais) return non('Ton escouade tient le dernier quai : les Sièges s’ouvriront au passage de la prochaine île.');
  return { ok: true };
}

/** Monte affronter les gardiens du quai suivant : un seul combat */
export function monterFleche(j: Jeu, escouade: string[], rng = graine(), gardien?: GardienQuai | null): Resultat {
  const p = peutMonter(j);
  if (!p.ok) return p;
  const e = escouadePrete(j, escouade);
  if (!e.ok) return e;
  const quai = etatFleche(j).quai;
  // un directeur tient le quai : c'est sa garnison qui barre la passerelle
  const g = gardien && gardien.quai === quai && gardien.porteurs.length ? gardien : null;
  const force = g ? g.force : forceQuai(quai);
  const porteurs = g ? [...g.porteurs, ...gardiensQuai(quai)].slice(0, 3) : gardiensQuai(quai);
  const gardes = porteurs.map((id) => `garde-${porteurDef(id).lignee}`);
  const x = nouvelleExpedition({ porteurs: e.porteurs, deck: e.deck, strate: 1, rng, sequence: [gardes[0]!], force });
  x.combat = creerCombat({
    porteurs: e.porteurs, ennemiId: gardes[0]!, escorte: gardes.slice(1), rng, deck: e.deck, force, pvPleins: true,
    ...(Object.keys(e.bonus).length ? { bonus: e.bonus } : {}),
  });
  x.combat.ennemi.porteur = porteurs[0];
  x.combat.autres?.forEach((en, k) => { en.porteur = porteurs[k + 1]; });
  x.combat.journal = [g ? `Quai ${quai} de la Flèche : l’escouade de ${g.nom}, qui tient le quai, barre la passerelle.`
    : `Quai ${quai} de la Flèche : les gardiens des Hauts barrent la passerelle (${porteurs.map((id) => porteurDef(id).nom).join(', ')}).`];
  quitterPostes(j, escouade);
  j.expedition = { ...x, fleche: { quai, force, ...(g ? { gardien: { id: g.id, nom: g.nom } } : {}) } };
  log(j, `L’escouade monte à l’assaut du quai ${quai} de la Flèche.`);
  return { ok: true };
}

/** Le retour d'un combat de la Flèche : montée ou descente, quais gravés, Usure et expérience */
export function remonterFleche(j: Jeu, now: number): RetourFleche | null {
  const x = j.expedition;
  if (!x?.fleche) return null;
  const f = etatFleche(j);
  const victoire = x.combat.issue === 'victoire';
  const de = f.quai;
  const paliers: RetourFleche['paliers'] = [];
  let record = false;
  if (victoire) {
    f.victoires++;
    f.quai = Math.min(FLECHE.quais, de + pas(de));
    if (f.quai > f.record) { f.record = f.quai; f.recordLe = now; record = true; }
    for (const q of FLECHE.paliers) {
      if (q > f.quai || f.recus.includes(q)) continue;
      const r = ASCENSION.recompenses[q] ?? { composants: 0, eclats: 0 };
      f.recus.push(q);
      j.composants += r.composants;
      j.eclats += r.eclats;
      paliers.push({ quai: q, ...r });
    }
  } else {
    f.defaites++;
    f.quai = Math.max(plancher(f.record), de - pas(de));
  }
  // l'Usure (la moitié d'une expédition) et l'expérience d'un combat, comme un pillage
  const xp = victoire ? Math.round(XP.combat * (1 + 0.04 * (de - 1)) * 0.75) : 0;
  for (const p of x.combat.porteurs) {
    const d = j.porteurs[p.id]!;
    d.usure = Math.min(usureMax(p.id), d.usure + DISTRICT.usureExpedition * ASCENSION.usure + (p.pv <= 0 ? DISTRICT.usureATerre : 0) + (p.usureEclat ?? 0));
    if (xp) { const avant = niveauPorteur(j, p.id).niveau; const n = gagnerXp(j, p.id, xp); if (n && n > avant) log(j, `${porteurDef(p.id).nom} passe au niveau ${n} !`); }
    if (victoire) { const fa = (d.faits ??= {}); fa.combats = (fa.combats ?? 0) + 1; }
  }
  if (x.fleche.gardien) (f.aEnvoyer ??= []).push({ cible: x.fleche.gardien.id, quai: de, victoire, le: now });
  j.expedition = null;
  log(j, victoire ? `Flèche : le quai ${de} tombe, l’escouade monte au quai ${f.quai}.`
    : `Flèche : repoussés au quai ${de}${f.quai < de ? `, l’escouade redescend au quai ${f.quai}` : ''}.`);
  return { victoire, de, a: f.quai, paliers, record, ...(x.fleche.gardien ? { gardien: x.fleche.gardien.nom } : {}) };
}

// ---------- Tenir un quai ----------

/** Le gage d'un quai pour un jour */
export function gageJour(quai: number): { composants: number; eclats: number } {
  const G = ASCENSION.gage;
  return { composants: G.base + G.parQuai * quai, eclats: [...G.eclats].filter((e) => quai >= e.des).pop()?.n ?? 0 };
}

/** La garnison que l'escouade laisserait sur le quai (PV pleins, sans l'Usure) */
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

/** La force la plus haute qu'on accepte sur un quai */
export const mesureQuai = (quai: number) => Math.round(forceQuai(quai) * ASCENSION.mesure * 1000) / 1000;

export function peutTenir(j: Jeu, escouade: string[]): Resultat {
  if (!flecheOuverte(j)) return non('La Flèche s’ouvrira quand les Hauts t’y auront convié.');
  const f = etatFleche(j);
  if (f.garde) return non(`Ton escouade tient déjà le quai ${f.garde.quai}.`);
  if (j.expedition) return non('Une expédition est déjà en cours.');
  if (f.quai < 2) return non('Le pied de la Flèche n’a pas de gardien : monte d’abord d’un quai.');
  if (f.quai >= FLECHE.quais) return non('Le dernier quai attend les Sièges.');
  if (escouade.length < 3) return non('Il faut trois Porteurs pour tenir un quai.');
  const force = forceGarnison(garnisonFleche(j, escouade));
  if (force > mesureQuai(f.quai)) return non(`Ton escouade est trop forte pour le quai ${f.quai} : les Hauts la veulent plus haut.`);
  return { ok: true };
}

/** S'installer sur son quai : la garnison est figée, le gage commence à courir */
export function tenirQuai(j: Jeu, escouade: string[], now: number): Resultat {
  const p = peutTenir(j, escouade);
  if (!p.ok) return p;
  const f = etatFleche(j);
  f.garde = { quai: f.quai, depuis: now, gageLe: now, garnison: garnisonFleche(j, escouade), repousses: 0 };
  log(j, `L’escouade s’installe sur le quai ${f.quai} de la Flèche : elle en devient le gardien.`);
  return { ok: true };
}

/** Ce que la caisse du quai contient à cet instant (au plus deux jours) */
export function gageEnCaisse(j: Jeu, now: number): { composants: number; eclats: number } {
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
  // on avance l'horloge de ce qui a été payé en composants (les Éclats suivent le même temps)
  const plein = now - g.gageLe >= ASCENSION.caisseJours * 86_400_000;
  g.gageLe = plein ? now : g.gageLe + Math.floor((r.composants / d.composants) * 86_400_000);
  j.composants += r.composants;
  j.eclats += r.eclats;
  return r;
}

/** Quitter son quai : le gage est versé, l'escouade reprend la montée */
export function quitterQuai(j: Jeu, now: number): { composants: number; eclats: number } | null {
  const f = j.fleche;
  if (!f?.garde) return null;
  const r = recevoirGage(j, now);
  log(j, `L’escouade quitte le quai ${f.garde.quai} de la Flèche.`);
  delete f.garde;
  return r;
}

/**
 * Les assauts subis pendant l'absence, dans l'ordre : une défense tenue rapporte un quart de jour de gage ;
 * une défense perdue fait quitter le quai (le gage dû jusque-là est versé) et redescendre comme une défaite.
 * Chaque assaut n'est compté qu'une fois ; ceux d'un autre quai ou d'avant l'installation sont ignorés.
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
      // le gage court jusqu'à l'assaut perdu
      const r = recevoirGage(j, Math.max(g.gageLe, a.le));
      const de = g.quai;
      delete f.garde;
      f.quai = Math.max(plancher(f.record), de - pas(de));
      l.push(`${a.nom} a délogé ton escouade du quai ${de}${f.quai < de ? ` : elle redescend au quai ${f.quai}` : ''}.${r.composants ? ` Gage versé : +${r.composants} composants${r.eclats ? `, +${r.eclats} Éclats` : ''}.` : ''}`);
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
