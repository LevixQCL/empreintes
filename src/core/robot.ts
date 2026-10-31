// Le robot d'équilibrage : un joueur automatique qui joue de vraies expéditions avec le vrai moteur.
// Il sert à mesurer ce qu'une carte change aux chances de victoire, à chaque modification de chiffre.
// Aucun DOM ici : il tourne dans les tests et dans `npm run robot`.

import { allonger, ajouter, capacite, eclater, eclatsPossibles, ennemisDebout, felureVisible, intentionDe, placesLibres, tousEnnemis, viser, vivants } from './combat';
import { lancer, voixAdmise } from './combat';
import { cartesEnJeu, placesVides } from './collection';
import { GESTES_SPECIAUX, porteurDef } from './donnees';
import { accessibles, cloturerCombat, combatSuivant, entrerSalle, nouvelleExpedition, nouvelleExploration, salleCourante, typeApparent } from './expedition';
import { REGLES, analyserChaine, frequenceLibre, places } from './regles';
import type { CombatEtat, Geste, GesteDef } from './types';

/** Copie rapide d'un combat (les cartes à plusieurs Fréquences changent de Fréquence : on les copie aussi) */
const clone = (s: CombatEtat): CombatEtat => ({
  ...s,
  porteurs: s.porteurs.map((p) => ({ ...p })),
  ennemi: { ...s.ennemi },
  intention: { ...s.intention },
  ...(s.autres ? { autres: s.autres.map((e) => ({ ...e, ...(e.intention ? { intention: { ...e.intention } } : {}) })) } : {}),
  pioche: s.pioche.slice(),
  defausse: s.defausse.slice(),
  main: s.main.map((g) => (g.fs ? { ...g } : g)),
  chaine: s.chaine.map((g) => (g.fs ? { ...g } : g)),
  journal: s.journal.slice(),
  // le journal complet reste au vrai combat : les chaînes essayées puis jetées n'y laissent aucune trace
  historique: undefined,
  ...(s.eclat ? { eclat: { ...s.eclat } } : {}),
});

/** Les ordres de jeu à essayer pour un même groupe de Gestes */
function ordres(groupe: Geste[]): Geste[][] {
  if (groupe.length <= 3) return permutations(groupe);
  // au-delà, l'ordre croissant est presque toujours le meilleur ; on essaie aussi Crescendo en dernier
  const croissant = groupe.slice().sort((a, b) => a.f - b.f);
  const r = [croissant];
  // Crescendo et Riposte en dernier (la Riposte profite des boucliers posés avant elle)
  for (const t of ['crescendo', 'riposte']) {
    const fin = croissant.filter((g) => g.effet?.type === t);
    if (fin.length) r.push([...croissant.filter((g) => !fin.includes(g)), ...fin]);
  }
  // les Fréquences libres (Accord, Diapason) : à chaque place possible
  const accords = croissant.filter((g) => frequenceLibre(g.effet));
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
  return -1.2 * tousEnnemis(s).reduce((n, e) => n + e.pv, 0)
    + 25 * (tousEnnemis(s).length - ennemisDebout(s).length)
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
/** Les cartes communes du district que le robot emporte (par défaut, les deux de départ) : pour mesurer le Râtelier */
let COMMUNES_ROBOT: GesteDef[] = GESTES_SPECIAUX;
export function communesRobot(g: GesteDef[] = GESTES_SPECIAUX): void { COMMUNES_ROBOT = g; }

export function jouerTour(s: CombatEtat): void {
  let meilleur: { score: number; uids: string[]; allonge: boolean; eclat: string | null } | null = null;
  // Coup d'éclat (Flux plein) : il essaie aussi chaque coup possible avant sa chaîne ; le Flux vidé se paie dans la note
  const eclats: (string | null)[] = [null, ...eclatsPossibles(s).map((c) => c.porteur)];
  // dans un groupe, il essaie de viser chacun des ennemis debout
  const cibles = ennemisDebout(s).map((e) => e.rang ?? 0);
  let meilleurRang = s.ennemi.rang ?? 0;
  for (const eclat of eclats) {
    const base = clone(s);
    if (eclat) eclater(base, eclat, { silencieux: true });
    const essais = [false];
    if (base.flux > 0 && capacite(base) < REGLES.capaciteMax) essais.push(true);
    for (const rang of cibles) for (const allonge of essais) {
      const cap = capacite(base) + (allonge ? 1 : 0);
      for (const groupe of sousGroupes(base.main.filter((g) => !g.vide))) {
        if (groupe.reduce((n, g) => n + places(g), 0) > cap || !voixAdmise(base, groupe)) continue;
        for (const ordre of ordres(groupe)) {
          const t = clone(base);
          viser(t, rang);
          if (allonge) allonger(t);
          for (const g of ordre) ajouter(t, g.uid);
          if (t.chaine.length !== ordre.length) continue;
          lancer(t, { silencieux: true });
          const score = note(t) - (allonge ? 4 : 0) - (eclat ? 6 : 0);
          if (!meilleur || score > meilleur.score) { meilleur = { score, uids: ordre.map((g) => g.uid), allonge, eclat }; meilleurRang = rang; }
        }
      }
    }
  }
  if (meilleur?.eclat) eclater(s, meilleur.eclat, { silencieux: true });
  viser(s, meilleurRang);
  if (!meilleur) {
    // main injouable (ne devrait pas arriver) : on pose ce qui rentre
    for (const g of s.main.slice()) if (placesLibres(s) >= places(g)) ajouter(s, g.uid);
  } else {
    if (meilleur.allonge) allonger(s);
    for (const uid of meilleur.uids) ajouter(s, uid);
  }
  lancer(s, { silencieux: true });
}

/**
 * Le joueur moyen : il ne calcule pas la suite du combat comme le robot. Il regarde ce qui est affiché :
 * la force des cartes, le bonus de suite, l'attaque annoncée. Il ordonne sa chaîne par Fréquence croissante,
 * se protège si l'attaque annoncée fait mal, soigne si quelqu'un est bas, et ignore les effets spéciaux et les lignées.
 * C'est la référence pour régler la difficulté : le robot, lui, gagne bien plus souvent qu'un vrai joueur.
 */
export function jouerTourMoyen(s: CombatEtat): void {
  // il garde son Flux pour le Coup d'éclat tant qu'il ne l'a pas déclenché ; ensuite, il s'offre une place de plus
  if (s.eclat && s.flux >= 2 && capacite(s) < REGLES.capaciteMax) allonger(s);
  // dans un groupe, il frappe le plus entamé (le plus proche de tomber)
  const proie = ennemisDebout(s).sort((a, b) => a.pv - b.pv)[0];
  if (proie) viser(s, proie.rang ?? 0);
  const cap = capacite(s);
  const vie = vivants(s);
  const pvTotal = vie.reduce((n, p) => n + p.pv, 0);
  let menace = 0;
  let unCoupFatal = false;
  for (const en of ennemisDebout(s)) {
    const it = intentionDe(s, en);
    if (it.type !== 'atk') continue;
    menace += (it.v ?? 0) * (it.zone ? vie.length : 1);
    if (vie.some((p) => p.pv <= (it.v ?? 0))) unCoupFatal = true;
  }
  const danger = menace >= 0.2 * pvTotal || unCoupFatal;
  const blesse = vie.some((p) => p.pv / p.pvMax < 0.4);
  // Coup d'éclat, au plus simple : relever un Porteur à terre, sinon survivre à un coup fatal, sinon frapper fort
  const eclats = eclatsPossibles(s);
  const choix = (s.porteurs.some((p) => p.pv <= 0) || pvTotal < 0.35 * s.porteurs.reduce((n, p) => n + p.pvMax, 0) ? eclats.find((c) => c.lignee === 'bio') : undefined)
    ?? (unCoupFatal ? eclats.find((c) => c.lignee === 'reso') : undefined)
    ?? eclats.find((c) => c.lignee === 'tech');
  if (choix) eclater(s, choix.porteur, { silencieux: true });
  // la Fêlure affichée sur l'ennemi qu'il frappe : une carte de cette Fréquence brise son intention
  const fel = s.ennemi.felureBrisee || !felureVisible(s.ennemi) ? undefined : s.ennemi.felure;
  const itVise = intentionDe(s, s.ennemi);
  const gainFelure = fel === undefined ? 0 : (itVise.type === 'atk' ? itVise.v * 0.5 * (danger ? 1.5 : 1) : itVise.type === 'bouclier' || itVise.type === 'soin' ? itVise.v * 0.5 : 0);
  let meilleur: { score: number; ordre: Geste[] } | null = null;
  for (const groupe of sousGroupes(s.main.filter((g) => !g.vide))) {
    if (groupe.reduce((n, g) => n + places(g), 0) > cap || !voixAdmise(s, groupe)) continue;
    const ordre = groupe.slice().sort((a, b) => a.f - b.f);
    const mult = analyserChaine(ordre).mult;
    // une carte éteinte (son Porteur est à terre) se lit à sa force affichée : la moitié
    const somme = (t: string) => ordre.filter((g) => g.type === t).reduce((n, g) => n + g.v * (s.porteurs.some((p) => p.id === g.porteur && p.pv <= 0) ? REGLES.eteinte : 1), 0) * mult;
    const brise = fel !== undefined && ordre.some((g) => !frequenceLibre(g.effet) && (g.fs ?? [g.f]).includes(fel));
    const score = somme('atk') + (danger ? 1.5 * Math.min(somme('bouclier'), menace) : 0.3 * somme('bouclier')) + (blesse ? somme('soin') : 0.2 * somme('soin')) + (brise ? gainFelure + (mult > 1 ? 4 : 0) : 0);
    if (!meilleur || score > meilleur.score) meilleur = { score, ordre };
  }
  for (const g of meilleur?.ordre ?? []) ajouter(s, g.uid);
  lancer(s, { silencieux: true });
}

export interface Escouade {
  /** id du Porteur → cartes qu'il porte (exemplaires « carte@métal » ou cartes dans leur métal d'origine), avec leur niveau */
  [porteurId: string]: { id: string; niveau: number }[];
}

interface ResultatExpedition {
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
  const deck = [...ids.flatMap((id) => [...cartesEnJeu(id, escouade[id]!), ...placesVides(id, escouade[id]!.length)]), ...COMMUNES_ROBOT];
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
  const es = tousEnnemis(x.combat);
  const partiel = x.combat.issue === 'victoire' ? 0 : 1 - es.reduce((n, e) => n + e.pv, 0) / es.reduce((n, e) => n + e.pvMax, 0);
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

/**
 * Une descente en exploration, jouée par le robot : il choisit son chemin (campement quand l'escouade est entamée,
 * sinon combat, cache ou archive plutôt que salle scellée), passe son chemin aux rencontres, et va jusqu'au gardien.
 */
export function simulerExploration(escouade: Escouade, strate: number, rng: number, jouer = jouerTour, facteur = 1, tours?: { normal: number[]; gardien: number[] }): { victoire: boolean; combats: number } {
  const ids = Object.keys(escouade);
  const porteurs = ids.map((id) => ({ id, pv: porteurDef(id).pvMax, pvMax: porteurDef(id).pvMax, aTerre: false }));
  const deck = [...ids.flatMap((id) => [...cartesEnJeu(id, escouade[id]!), ...placesVides(id, escouade[id]!.length)]), ...COMMUNES_ROBOT];
  let x = nouvelleExploration({ porteurs, deck, strate, rng, ...(facteur !== 1 ? { facteur } : {}) });
  let garde = 0;
  while (!x.terminee && garde++ < 3000) {
    if (x.phase === 'carte') {
      if (x.rencontre) { x = { ...x, rencontre: undefined }; continue; }
      const choix = accessibles(x);
      if (!choix.length) break;
      const sante = x.porteurs.reduce((n, p) => n + Math.max(0, p.pv), 0) / x.porteurs.reduce((n, p) => n + p.pvMax, 0);
      const prefere = (t: string) => (t === 'camp' ? (sante < 0.7 ? 0 : 3) : t === 'cache' || t === 'archive' ? 1 : t === 'combat' || t === 'gardien' ? 2 : t === 'rencontre' ? 2 : 4);
      // il ne voit que ce que le brouillard laisse voir (30 octobre 2026)
      const cible = choix.slice().sort((a, b) => prefere(typeApparent(x, a)) - prefere(typeApparent(x, b)))[0]!;
      x = entrerSalle(x, cible.id).x;
      continue;
    }
    if (x.combat.issue !== 'en-cours') {
      if (tours && !x.cloture) (salleCourante(x).type === 'gardien' ? tours.gardien : tours.normal).push(x.combat.tour);
      x = cloturerCombat(x);
      if (!x.terminee) x = combatSuivant(x);
      continue;
    }
    jouer(x.combat);
  }
  return { victoire: x.terminee && x.combat.issue === 'victoire' && salleCourante(x).type === 'gardien', combats: x.gagnes ?? 0 };
}

export function tauxExploration(escouade: Escouade, strate: number, parties: number, graineDepart = 1, jouer = jouerTour, facteur = 1, tours?: { normal: number[]; gardien: number[] }): { victoire: number; combats: number } {
  let v = 0, c = 0;
  for (let k = 0; k < parties; k++) {
    const r = simulerExploration(escouade, strate, graineDepart + k * 7919, jouer, facteur, tours);
    if (r.victoire) v++;
    c += r.combats;
  }
  return { victoire: v / parties, combats: c / parties };
}
