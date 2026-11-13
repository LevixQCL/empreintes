// Le Gardien de la ville (13 novembre 2026, proposition « Le jeu à plusieurs », validée par Bryan).
// Chaque lundi, ce qui remonte du réseau des Strates menace toutes les cuvettes. Toute la ville le combat jusqu'au dimanche :
// les dégâts de chacun, convertis en parts, remplissent une jauge commune (écrite par le serveur, jamais par le téléphone).
// - Une tentative par jour, cumulable jusqu'à 3 : rater deux jours ne fait rien perdre.
// - Un combat normal, avec son escouade et son deck, de 12 tours au plus. On ne peut pas perdre : seuls les dégâts comptent.
// - Le Gardien s'adapte à la Strate de chacun : 1 part = les dégâts d'un combat de gardien de sa Strate, joué en temps normal.
// - Une règle de salle par semaine (CONDITIONS), pour retoucher son deck.
// Ici : les règles, sans réseau. Le combat se rejoue à l'identique (rejouerGardien) : c'est ce que fait le serveur pour compter
// les parts lui-même (functions/gardien.js). Le téléphone, lui, n'écrit jamais la jauge de la ville.

import { CONDITIONS, ZONES, ennemiDef } from '../donnees';
import * as C from '../combat';
import { forceStrate, nouvelleExpedition } from '../expedition';
import { graine } from '../rng';
import { tirerChoix } from '../collection';
import type { BonusMarques, CombatEtat, GesteDef, PorteurEtat } from '../types';
import { bonusPv, debutJour, jourDe, log, non, porteursPresents, pvNiveau, semaineDe, strateVaincue, type Jeu, type Resultat } from './etat';
import { deckEscouade, escouadePrete, indiceEscouade } from './descentes';
import { quitterPostes } from './recompenses';
import { gagnerPerles } from './perles';
import { remonter as remonterFleche } from './fleche';
import type { Retour } from './descentes';
import { t as tr } from '../i18n';

export const GARDIEN_VILLE = {
  /** il remplace les Épreuves de la semaine, au même endroit : ouvert après −3 */
  ouverture: 3,
  /** tentatives : une de plus chaque jour (4 h du matin), jamais plus de 3 en réserve */
  parJour: 1,
  reserve: 3,
  /** un combat de 12 tours au plus */
  tours: 12,
  /** ses PV : ceux du gardien de la Strate du joueur, multipliés (personne ne l'abat seul) */
  pvFacteur: 40,
  /** 1 part = les PV d'un gardien de sa Strate, abattus en ce nombre de tours, ramenés aux 12 tours du combat.
   *  10 : un joueur moyen fait environ 1 part par frappe à −3, 1,3 à −10 (scripts/gardien-ville.ts, 13 novembre 2026) */
  toursReference: 10,
  /** une tentative ne compte jamais plus de 3 parts (un deck très au-dessus de sa Strate ne fait pas tout seul la semaine) */
  partsMax: 3,
  /** les PV de la ville (serveur) : 4 parts par joueur actif la semaine d'avant, jamais moins de 40 */
  partsParJoueur: 4,
  pvVilleMin: 40,
  /** les paliers de la ville, en part de ses PV */
  paliers: [0.25, 0.5, 0.75, 1, 1.5] as const,
  /** la Perle de nacre (13 novembre 2026) : toutes les deux semaines, après −10, quand la ville abat le Gardien ; ratée, elle attend le suivant */
  perle: { strate: 10, toutesLes: 2 },
};

/** La règle de salle de chaque semaine, dans cet ordre (une par semaine, en boucle) */
const REGLES_SEMAINE = ['echo', 'courants', 'brouillard', 'chant', 'inondee', 'sanctuaire', 'eboulis'] as const;

/** Le Gardien de la semaine : l'écho d'un gardien des Strates (les quatre en boucle), et sa règle de salle */
export function gardienDeLaSemaine(semaine: number): { ennemi: string; condition: string; nom: string } {
  const bosses = ZONES.map((z) => z.boss);
  const ennemi = bosses[((semaine % bosses.length) + bosses.length) % bosses.length]!;
  const condition = REGLES_SEMAINE[((semaine % REGLES_SEMAINE.length) + REGLES_SEMAINE.length) % REGLES_SEMAINE.length]!;
  return { ennemi, condition, nom: tr`L’écho ${ennemiDef(ennemi).nom.replace(/^L[ae] /, (m) => m.toLowerCase())}` };
}
export const regleDeLaSemaine = (semaine: number) => CONDITIONS[gardienDeLaSemaine(semaine).condition];

/** Ce que la partie garde du Gardien de la semaine */
export interface EtatGardien {
  semaine: number;
  /** tentatives en réserve, et le dernier jour où la réserve a été remplie */
  tentatives: number;
  jour: number;
  /** parts comptées par le serveur cette semaine, et la plus belle frappe */
  parts: number;
  meilleure: number;
  /** les frappes jouées, pas encore comptées par le serveur */
  aEnvoyer: FrappeGardien[];
  /** les paliers de la ville déjà touchés cette semaine (en part : 0.25, 0.5…) */
  recus: number[];
  /** la ville a abattu le Gardien d'une semaine paire après −10 sans que la Perle soit encore donnée : elle attend */
  perleDue?: boolean;
  /** la dernière semaine dont la Perle a été réglée (donnée ou reportée) */
  perleSemaine?: number;
}

/** Une frappe : de quoi la rejouer à l'identique (le serveur recompte tout, il ne lit jamais les dégâts du téléphone) */
export interface FrappeGardien {
  semaine: number;
  le: number;
  depart: DepartGardien;
  journal: ActionCombat[];
  /** ce que le téléphone a compté (pour l'affichage en attendant le serveur) */
  parts: number;
}

/** Tout ce qu'il faut pour recréer le combat */
export interface DepartGardien {
  escouade: string[];
  porteurs: PorteurEtat[];
  deck: GesteDef[];
  bonus?: BonusMarques;
  ennemi: string;
  condition: string;
  force: number;
  rng: number;
}

/** Une action du joueur pendant le combat, dans l'ordre (combat.ts) */
export type ActionCombat =
  | ['ajouter', string] | ['retirer', string] | ['accorder', string, number?] | ['proteger', string] | ['soignerVers', string]
  | ['cibler', string, string?] | ['viser', number] | ['deplacer', string, number] | ['allonger'] | ['repiocher']
  | ['relancerMain'] | ['viderChaine'] | ['eclater', string] | ['lancer'];

/** Les actions que le journal note (app/combat-note.ts) */
export const ACTIONS_NOTEES = new Set<string>(['ajouter', 'retirer', 'accorder', 'proteger', 'soignerVers', 'cibler', 'viser', 'deplacer', 'allonger', 'repiocher', 'relancerMain', 'viderChaine', 'eclater', 'lancer']);

export const gardienOuvert = (j: Jeu) => strateVaincue(j) >= GARDIEN_VILLE.ouverture;

/** L'état de la semaine (remis à neuf le lundi), réserve de tentatives remplie */
export function etatGardien(j: Jeu, now: number): EtatGardien {
  const semaine = semaineDe(now);
  const jour = jourDe(now);
  let g = j.gardienVille;
  if (!g) g = j.gardienVille = { semaine, tentatives: GARDIEN_VILLE.parJour, jour, parts: 0, meilleure: 0, aEnvoyer: [], recus: [] };
  if (g.semaine !== semaine) {
    // une nouvelle semaine : les parts et les paliers repartent de zéro ; la réserve de tentatives, elle, se garde
    g.semaine = semaine; g.parts = 0; g.meilleure = 0; g.recus = [];
    g.aEnvoyer = g.aEnvoyer.filter((f) => f.semaine === semaine);
  }
  if (jour > g.jour) {
    g.tentatives = Math.min(GARDIEN_VILLE.reserve, g.tentatives + (jour - g.jour) * GARDIEN_VILLE.parJour);
    g.jour = jour;
  }
  return g;
}

/** L'heure où la prochaine tentative arrive (null : la réserve est pleine) */
export function prochaineTentative(j: Jeu, now: number): number | null {
  const g = etatGardien(j, now);
  return g.tentatives >= GARDIEN_VILLE.reserve ? null : debutJour(g.jour + 1);
}

/** Le combat du Gardien, tel qu'on le crée et tel que le serveur le recrée */
export function combatGardien(d: DepartGardien): CombatEtat {
  const s = C.creerCombat({
    porteurs: d.porteurs.map((p) => ({ ...p })), deck: d.deck.map((g) => ({ ...g })), ennemiId: d.ennemi, rng: d.rng,
    force: d.force, condition: d.condition, troisiemePhase: false,
    ...(d.bonus && Object.keys(d.bonus).length ? { bonus: d.bonus } : {}),
  });
  // personne ne l'abat seul
  // ses traits jouent sans ses PV multipliés : sa Régénération soignerait chaque tour plus qu'une escouade ne frappe. La règle de
  // la semaine fait la variété à leur place.
  for (const en of C.tousEnnemis(s)) { en.pvMax *= GARDIEN_VILLE.pvFacteur; en.pv = en.pvMax; en.sansTraits = true; }
  return s;
}

/** Les PV d'un gardien de cette force, combattu normalement (la base d'une part) */
export function pvReference(d: Pick<DepartGardien, 'ennemi' | 'force' | 'condition'>): number {
  const s = C.creerCombat({ porteurs: [{ id: 'doran', pv: 1, pvMax: 1, aTerre: false }], ennemiId: d.ennemi, rng: 1, force: d.force, condition: d.condition });
  return s.ennemi.pvMax;
}

/** Les dégâts infligés (tous les ennemis du combat) */
export const degatsInfliges = (s: CombatEtat) => C.tousEnnemis(s).reduce((n, en) => n + Math.max(0, en.pvMax - en.pv), 0);

/** Les dégâts en parts : 1 part = un gardien de sa Strate abattu en 10 tours, ramené aux 12 tours du combat */
export function partsDe(d: DepartGardien, degats: number): number {
  const ref = (pvReference(d) * GARDIEN_VILLE.tours) / GARDIEN_VILLE.toursReference;
  return Math.min(GARDIEN_VILLE.partsMax, Math.round((degats / Math.max(1, ref)) * 10) / 10);
}

/** Le combat est-il fini (12 tours joués, ou l'escouade à terre) ? */
export const combatGardienFini = (s: CombatEtat) => s.issue !== 'en-cours' || s.tour > GARDIEN_VILLE.tours;

/** Rejoue un combat à l'identique, action par action. Une action refusée arrête tout (journal faux ou falsifié). */
export function rejouerGardien(d: DepartGardien, journal: readonly ActionCombat[]): { ok: true; degats: number; parts: number; tours: number } | { ok: false; message: string } {
  const s = combatGardien(d);
  for (const a of journal) {
    if (combatGardienFini(s)) return { ok: false, message: 'Action après la fin du combat.' };
    const r = appliquer(s, a);
    if (r === false) return { ok: false, message: `Action refusée : ${a[0]}.` };
  }
  const degats = degatsInfliges(s);
  return { ok: true, degats, parts: partsDe(d, degats), tours: Math.min(s.tour, GARDIEN_VILLE.tours) };
}

/** Applique une action du journal ; false si elle est refusée par les règles du combat */
export function appliquer(s: CombatEtat, a: ActionCombat): boolean {
  const ok = (r: { ok: boolean } | void) => !r || r.ok;
  switch (a[0]) {
    case 'ajouter': return ok(C.ajouter(s, a[1]));
    case 'retirer': return ok(C.retirer(s, a[1]));
    case 'accorder': return ok(C.accorder(s, a[1], a[2]));
    case 'proteger': return ok(C.proteger(s, a[1]));
    case 'soignerVers': return ok(C.soignerVers(s, a[1]));
    case 'cibler': return ok(C.cibler(s, a[1], a[2]));
    case 'viser': return ok(C.viser(s, a[1]));
    case 'deplacer': return ok(C.deplacer(s, a[1], a[2]));
    case 'allonger': return ok(C.allonger(s));
    case 'repiocher': return ok(C.repiocher(s));
    case 'relancerMain': return ok(C.relancerMain(s));
    case 'viderChaine': C.viderChaine(s); return true;
    case 'eclater': if (!C.eclatsPossibles(s).some((e) => e.porteur === a[1])) return false; C.eclater(s, a[1], { silencieux: true }); return true;
    case 'lancer': if (!s.chaine.length) return false; C.lancer(s, { silencieux: true }); return true;
    default: return false;
  }
}

export function peutFrapper(j: Jeu, now: number): Resultat {
  if (!gardienOuvert(j)) return non(tr`Le Gardien de la ville se montre aux directeurs qui ont vaincu la Strate −${GARDIEN_VILLE.ouverture}.`);
  if (j.expedition) return non(tr('Une expédition est déjà en cours.'));
  if (etatGardien(j, now).tentatives < 1) return non(tr('Plus de tentative aujourd’hui : la prochaine arrive demain matin.'));
  return { ok: true };
}

/** Part affronter le Gardien de la semaine : une tentative, un combat de 12 tours au plus */
export function frapperGardien(j: Jeu, escouade: string[], now: number, rng = graine()): Resultat {
  const p = peutFrapper(j, now);
  if (!p.ok) return p;
  const e = escouadePrete(j, escouade, undefined, undefined, 'courte');
  if (!e.ok) return e;
  const g = etatGardien(j, now);
  const sem = gardienDeLaSemaine(g.semaine);
  const depart: DepartGardien = {
    escouade: [...escouade], porteurs: e.porteurs, deck: e.deck, ennemi: sem.ennemi, condition: sem.condition,
    force: forceStrate(Math.max(1, strateVaincue(j))), rng,
    ...(Object.keys(e.bonus).length ? { bonus: e.bonus } : {}),
  };
  const x = nouvelleExpedition({ porteurs: e.porteurs, deck: e.deck, strate: 1, rng, sequence: [sem.ennemi], force: depart.force });
  x.combat = combatGardien(depart);
  x.combat.journal = [tr`${sem.nom} remonte par le puits. Douze tours pour le repousser : chaque coup compte pour la ville.`];
  x.gardienVille = { depart, journal: [] };
  g.tentatives--;
  quitterPostes(j, escouade);
  j.expedition = x;
  log(j, tr`L’escouade descend au puits repousser ${sem.nom.toLowerCase()}.`);
  return { ok: true };
}

/** Le retour du combat du Gardien : la frappe part au serveur ; pas d'Usure, pas de défaite (on ne peut pas perdre) */
export interface RetourGardien { degats: number; parts: number; meilleure: boolean }

export function remonterGardien(j: Jeu, now: number): RetourGardien | null {
  const x = j.expedition;
  if (!x?.gardienVille) return null;
  const g = etatGardien(j, now);
  const degats = degatsInfliges(x.combat);
  const parts = partsDe(x.gardienVille.depart, degats);
  g.aEnvoyer.push({ semaine: g.semaine, le: now, depart: x.gardienVille.depart, journal: x.gardienVille.journal, parts });
  const meilleure = parts > g.meilleure;
  if (meilleure) g.meilleure = parts;
  j.expedition = null;
  log(j, tr`Le Gardien de la ville a encaissé ${degats} dégâts : ${parts.toLocaleString()} part${parts >= 2 ? 's' : ''} pour la ville.`);
  return { degats, parts, meilleure };
}

/** Remonter d'une sortie, quelle qu'elle soit (le Gardien, sinon la Flèche, les pillages et les Strates) */
export function remonter(j: Jeu): Retour & { gardien?: RetourGardien } {
  if (!j.expedition?.gardienVille) return remonterFleche(j);
  const r = remonterGardien(j, j.dernierTick)!;
  return { butin: 0, nouvelleStrate: false, victoire: true, fragment: null, cartes: [], eclats: 0, gardien: r };
}

// ---------- La jauge de la ville (lue sur le serveur) et ses paliers ----------

/** Ce que le serveur publie pour la semaine (gardien/{semaine}) */
export interface VilleGardien {
  semaine: number;
  /** PV de la ville, en parts */
  pv: number;
  /** parts infligées par toute la ville */
  parts: number;
  /** directeurs qui ont frappé */
  frappeurs: number;
  /** les dernières frappes (pseudo, Strate, parts) */
  fil?: { nom: string; strate: number; parts: number }[];
}

export type RecompensePalier =
  | { palier: number; type: 'cristaux'; n: number }
  | { palier: number; type: 'eclats'; n: number }
  | { palier: number; type: 'carte' }
  | { palier: number; type: 'perle' }
  | { palier: number; type: 'decor' };

/** Les paliers touchés et non encore reçus (le joueur a frappé au moins une fois cette semaine) : on les donne ici */
export function recevoirPaliers(j: Jeu, ville: VilleGardien, now: number, productionHeure: number): RecompensePalier[] {
  const g = etatGardien(j, now);
  if (ville.semaine !== g.semaine || (g.parts <= 0 && !g.aEnvoyer.length && g.meilleure <= 0)) return [];
  const part = ville.parts / Math.max(1, ville.pv);
  const dons: RecompensePalier[] = [];
  for (const p of GARDIEN_VILLE.paliers) {
    if (part < p || g.recus.includes(p)) continue;
    g.recus.push(p);
    if (p === 0.25) { const n = Math.round(productionHeure * 12); j.energie += n; dons.push({ palier: p, type: 'cristaux', n }); }
    else if (p === 0.5) { j.eclats += 10; dons.push({ palier: p, type: 'eclats', n: 10 }); }
    else if (p === 0.75) { j.choix.push({ source: 'gardien', options: tirerChoix(j, Math.max(1, strateVaincue(j)), undefined, undefined, porteursPresents(j)) }); dons.push({ palier: p, type: 'carte' }); }
    else if (p === 1) {
      const n = Math.round(productionHeure * 24); j.energie += n; dons.push({ palier: p, type: 'cristaux', n });
      if (perleDeLaSemaine(j, g.semaine)) { gagnerPerles(j, 1, tr('le Gardien de la ville')); g.perleDue = false; dons.push({ palier: p, type: 'perle' }); }
    } else dons.push({ palier: p, type: 'decor' });
  }
  return dons;
}

/** La Perle des deux semaines : due une semaine paire (après −10), ou reportée d'un Gardien raté */
export function perleDeLaSemaine(j: Jeu, semaine: number): boolean {
  if (strateVaincue(j) < GARDIEN_VILLE.perle.strate) return false;
  const g = j.gardienVille;
  return !!g?.perleDue || semaine % GARDIEN_VILLE.perle.toutesLes === 0;
}

/** Une semaine finie : si la Perle était due et que la ville n'a pas abattu le Gardien, elle attend le suivant */
export function reporterPerle(j: Jeu, semaine: number, villeAbattu: boolean): void {
  const g = j.gardienVille;
  if (!g || g.perleSemaine === semaine) return;
  g.perleSemaine = semaine;
  if (!villeAbattu && perleDeLaSemaine(j, semaine)) g.perleDue = true;
}

/** Les parts comptées par le serveur pour cette partie (après envoi) */
export function partsComptees(j: Jeu, semaine: number, parts: number, envoyees: number): void {
  const g = j.gardienVille;
  if (!g || g.semaine !== semaine) return;
  g.parts = parts;
  g.aEnvoyer = g.aEnvoyer.slice(envoyees);
}

/** Pour valider un départ côté serveur : le deck et les PV max qu'aurait l'escouade d'après la sauvegarde (sans l'Usure) */
export function bornesDepart(j: Jeu, escouade: string[]): { deck: GesteDef[]; pvMax: Record<string, number> } | null {
  if (escouade.length !== 3 || new Set(escouade).size !== 3 || escouade.some((id) => !j.porteurs[id])) return null;
  const deck = deckEscouade(j, escouade, indiceEscouade(j, escouade), 'courte');
  const pvMax: Record<string, number> = {};
  for (const id of escouade) pvMax[id] = pvNiveau(j, id) + bonusPv(j, id);
  return { deck, pvMax };
}

/** Le départ envoyé par le téléphone est-il possible avec cette sauvegarde ? (cartes possédées, forces et PV pas plus hauts,
 *  ennemi, règle et force de la semaine) */
export function departValide(j: Jeu, d: DepartGardien, semaine: number): string | null {
  const b = bornesDepart(j, d.escouade);
  if (!b) return 'Escouade inconnue.';
  if (d.porteurs.length !== 3 || d.porteurs.some((p, k) => p.id !== d.escouade[k] || p.pvMax > (b.pvMax[p.id] ?? 0) || p.pv > p.pvMax)) return 'Porteurs impossibles.';
  const sem = gardienDeLaSemaine(semaine);
  if (d.ennemi !== sem.ennemi || d.condition !== sem.condition) return 'Ce n’est pas le Gardien de cette semaine.';
  if (d.force > forceStrate(Math.max(1, strateVaincue(j))) + 1e-9) return 'Force du Gardien impossible.';
  // chaque carte du départ doit exister dans le deck de la sauvegarde, avec une force au plus égale
  const dispo = new Map<string, number[]>();
  for (const g of b.deck) dispo.set(`${g.porteur}|${g.id}`, [...(dispo.get(`${g.porteur}|${g.id}`) ?? []), g.v]);
  for (const g of d.deck) {
    if (g.vide) continue;
    const l = dispo.get(`${g.porteur}|${g.id}`);
    const k = l?.findIndex((v) => g.v <= v) ?? -1;
    if (!l || k < 0) return `Carte impossible : ${g.id}.`;
    l.splice(k, 1);
  }
  return null;
}

/** Les fonctions du combat, qui notent chaque action réussie dans le journal (le téléphone joue par elles, le serveur rejoue le journal) */
export function combatNote(journal: ActionCombat[]): typeof C {
  return new Proxy(C, {
    get(cible, cle: string) {
      const f = (cible as unknown as Record<string, unknown>)[cle];
      if (typeof f !== 'function' || !ACTIONS_NOTEES.has(cle)) return f;
      return (s: CombatEtat, ...args: unknown[]) => {
        const r = (f as (...a: unknown[]) => unknown)(s, ...args);
        const reussi = r === undefined || Array.isArray(r) || (r as { ok?: boolean }).ok !== false;
        // les options d'affichage (silencieux, apercu) ne changent rien au combat : on ne garde que les arguments utiles
        const utiles = cle === 'lancer' ? [] : cle === 'eclater' ? args.slice(0, 1) : args.filter((x) => x !== undefined);
        if (reussi) journal.push([cle, ...utiles] as unknown as ActionCombat);
        return r;
      };
    },
  });
}
