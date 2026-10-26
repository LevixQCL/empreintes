// Le moteur de combat. Fonctions pures sur un état sérialisable (JSON) :
// l'interface appelle ces fonctions puis anime les « pas » qu'elles renvoient.

import { DECK_DEPART, FAVEUR_CONDITION, ZONES, ennemiDef, porteurDef } from './donnees';
import { REGLES, analyserChaine, avantage, frequencesEffectives, meilleureFrequence, places } from './regles';
import { tireur } from './rng';
import type {
  BonusMarques, CibleRegle, CombatEtat, EnnemiEtat, Evenement, Geste, GesteDef, Intention, Lignee, LigneeGeste, Pas, PorteurEtat, Trait,
} from './types';

export interface Resultat {
  ok: boolean;
  message?: string;
}

const clone = <T>(x: T): T => structuredClone(x);

export function creerCombat(opts: {
  porteurs: PorteurEtat[];
  ennemiId: string;
  rng: number;
  deck?: GesteDef[];
  /** puissance de l'ennemi (1 = Strate −1) */
  force?: number;
  /** pioche dans l'ordre du deck, sans mélange (combat guidé) */
  ordonne?: boolean;
  /** ce que les Marques des Porteurs apportent */
  bonus?: BonusMarques;
  /** les ennemis qui accompagnent le premier (combat à plusieurs) */
  escorte?: string[];
  /** la condition de la salle (CONDITIONS) */
  condition?: string;
  /** false : les ennemis jouent sans traits ni seconde phase (Strate −1) */
  traits?: boolean;
}): CombatEtat {
  const e = ennemiDef(opts.ennemiId);
  const groupe = [opts.ennemiId, ...(opts.escorte ?? [])];
  // un groupe se partage la puissance d'un ennemi seul (un peu plus au total : il faut choisir qui frapper)
  const force = (opts.force ?? 1) * (PART_GROUPE[groupe.length] ?? PART_GROUPE[3]!);
  const etat = (id: string, rang: number): EnnemiEtat => {
    const d = ennemiDef(id);
    const pv = Math.round(d.pvMax * force);
    return { id, pv, pvMax: pv, force, bouclier: 0, etape: rang, boost: 1, ...(groupe.length > 1 ? { rang } : {}), ...(opts.traits === false ? { simple: true } : {}) };
  };
  const s: CombatEtat = {
    porteurs: clone(opts.porteurs),
    ennemi: etat(opts.ennemiId, 0),
    ...(groupe.length > 1 ? { autres: groupe.slice(1).map((id, k) => etat(id, k + 1)) } : {}),
    forceBase: opts.force ?? 1,
    ...(opts.condition ? { condition: opts.condition } : {}),
    intention: { type: 'boost' },
    pioche: [],
    defausse: [],
    main: [],
    chaine: [],
    capaBonus: 0,
    bouclier: 0,
    flux: 0,
    tour: 1,
    rng: opts.rng,
    issue: 'en-cours',
    journal: [],
  };
  const deck: Geste[] = (opts.deck ?? DECK_DEPART).map((g, k) => ({ ...g, uid: `g${k}` }));
  s.pioche = opts.ordonne ? deck.slice().reverse() : tireur(s).melanger(deck);
  log(s, groupe.length > 1 ? `${groupe.map((id) => ennemiDef(id).nom).join(', ')} : un groupe surgit dans la Strate.` : `Un ${e.nom} surgit dans la Strate.`);
  const b = opts.bonus;
  if (b?.places) s.capaBonus = b.places;
  if (b?.bouclier) s.bouclier = b.bouclier;
  if (b?.lucide) s.lucide = true;
  if (b?.flux) s.flux = Math.min(REGLES.fluxMax, b.flux);
  if (b?.garde) s.gardeMarque = b.garde;
  if (b?.releve) s.releve = b.releve;
  if (b?.fissure) { s.ennemi.fissure = b.fissure; s.ennemi.fissureTours = 2; }
  for (const en of tousEnnemis(s)) choisirIntention(s, en);
  // Ombre courtoise (Aurel) : la première attaque annoncée de chaque ennemi est retenue
  if (b?.desarme) for (const en of tousEnnemis(s)) { const it = intentionDe(s, en); if (it.type === 'atk') it.v = Math.round(it.v * (1 - b.desarme)); }
  piocher(s, REGLES.tailleMain + (b?.main ?? 0));
  fixerFelures(s);
  return s;
}

// ---------- Lecture ----------

const porteurEtat = (s: CombatEtat, id: string) => s.porteurs.find((p) => p.id === id);
export const vivants = (s: CombatEtat) => s.porteurs.filter((p) => p.pv > 0);
const estATerre = (s: CombatEtat, id: string | null) => !!id && (porteurEtat(s, id)?.pv ?? 0) <= 0;
export const capacite = (s: CombatEtat) => REGLES.capaciteBase + s.capaBonus;
export const placesPrises = (s: CombatEtat) => s.chaine.reduce((n, g) => n + places(g), 0);
export const placesLibres = (s: CombatEtat) => capacite(s) - placesPrises(s);
export const ligneeGeste = (g: GesteDef): LigneeGeste => (g.porteur ? porteurDef(g.porteur).lignee : 'neutre');

/** PV et attaques de chaque ennemi d'un groupe, par rapport à un ennemi seul (×1,28 de PV au total pour deux, ×1,35 pour trois ; réglé au joueur moyen : un groupe pèse à peu près autant que ses membres affrontés seuls) */
export const PART_GROUPE: Record<number, number> = { 1: 1, 2: 0.64, 3: 0.45 };

/** Le trait d'un ennemi, s'il l'a */
export function trait<T extends Trait['type']>(en: EnnemiEtat, type: T): Extract<Trait, { type: T }> | undefined {
  if (en.simple) return undefined;
  return ennemiDef(en.id).traits?.find((t) => t.type === type) as Extract<Trait, { type: T }> | undefined;
}
/** Furie : sous la moitié de ses PV, un ennemi frappe 30 % plus fort */
export const FURIE = 1.3;
/** Ce qui multiplie les attaques d'un ennemi : sa concentration, et sa furie */
export const puissance = (en: EnnemiEtat) => en.boost * (trait(en, 'furie') && en.pv > 0 && en.pv <= en.pvMax / 2 ? FURIE : 1);
/**
 * Combats qui s'éternisent : à partir du tour 10, les ennemis se soignent de moins en moins (plus du tout au tour 20),
 * et à partir du tour 25 leurs attaques grossissent de 10 % par tour. Aucun combat ne peut tourner en rond.
 */
export const usureCombat = (s: CombatEtat) => ({
  soins: s.tour <= 10 ? 1 : Math.max(0, 1 - (s.tour - 10) / 10),
  attaque: s.tour <= 25 ? 1 : 1 + 0.1 * (s.tour - 25),
});
/** Éboulis : ce que les pierres retirent à chacun, à chaque tour ennemi */
export const eboulis = (s: CombatEtat) => Math.max(1, Math.round(2 * (s.forceBase ?? s.ennemi.force)));

/** Tous les ennemis du combat, dans l'ordre où ils se tiennent (le visé compris) */
export const tousEnnemis = (s: CombatEtat): EnnemiEtat[] =>
  (s.autres?.length ? [s.ennemi, ...s.autres].sort((a, b) => (a.rang ?? 0) - (b.rang ?? 0)) : [s.ennemi]);
export const ennemisDebout = (s: CombatEtat) => tousEnnemis(s).filter((e) => e.pv > 0);
export const enGroupe = (s: CombatEtat) => !!s.autres?.length;
/** L'intention d'un ennemi : celle du visé est dans `s.intention`, celle des autres dans leur état */
export const intentionDe = (s: CombatEtat, en: EnnemiEtat): Intention => (en === s.ennemi ? s.intention : en.intention ?? { type: 'boost' });
const fixerIntention = (s: CombatEtat, en: EnnemiEtat, it: Intention) => { if (en === s.ennemi) s.intention = it; else en.intention = it; };

/**
 * Vise un autre ennemi du groupe : toute la chaîne le frappera (Désarmer et Fissure aussi).
 * L'ennemi visé passe dans `s.ennemi` (et son intention dans `s.intention`) : le reste du moteur ne change pas.
 */
export function viser(s: CombatEtat, rang: number): Resultat {
  if (!s.autres?.length || (s.ennemi.rang ?? 0) === rang) return { ok: false };
  const k = s.autres.findIndex((e) => e.rang === rang);
  if (k < 0 || s.autres[k]!.pv <= 0) return { ok: false };
  const nouveau = s.autres[k]!;
  const ancien = s.ennemi;
  ancien.intention = s.intention;
  s.intention = nouveau.intention ?? { type: 'boost' };
  delete nouveau.intention;
  s.autres[k] = ancien;
  s.ennemi = nouveau;
  return { ok: true };
}

/** Ennemi suivant à viser quand le visé tombe : le plus à gauche encore debout */
function viserSuivant(s: CombatEtat): boolean {
  const r = s.autres?.filter((e) => e.pv > 0).sort((a, b) => (a.rang ?? 0) - (b.rang ?? 0))[0];
  return !!r && viser(s, r.rang ?? 0).ok;
}

export function texteIntention(s: CombatEtat, en: EnnemiEtat = s.ennemi): string {
  const it = intentionDe(s, en);
  if (it.type === 'bouclier') return `Va se protéger : bouclier ${it.v}`;
  if (it.type === 'boost') return 'Se concentre : sa prochaine attaque fera double dégâts';
  if (it.type === 'soin') return `Va se réparer : ${it.nom} +${it.v} PV`;
  if (it.type === 'dissonance') return `${it.nom} : va brouiller tes Fréquences, pas de Résonance au tour suivant`;
  const v = Math.round(it.v * puissance(en) * usureCombat(s).attaque);
  if (it.zone) return `Va frapper toute l’escouade : ${it.nom} ${v}`;
  const cible = it.cibleId ? porteurDef(it.cibleId).nom : '?';
  return `Va frapper ${cible} : ${it.nom} ${v}`;
}

// ---------- Actions du joueur ----------

export function ajouter(s: CombatEtat, uid: string): Resultat {
  if (s.issue !== 'en-cours') return { ok: false };
  const g = s.main.find((x) => x.uid === uid);
  if (!g) return { ok: false };
  if (estATerre(s, g.porteur)) return { ok: false, message: 'Ce Porteur est à terre.' };
  if (places(g) > placesLibres(s)) {
    const debut = g.lourd ? `${g.nom} prend 2 places, il n’en reste ${placesLibres(s)}.` : 'La chaîne est pleine.';
    const fin = s.flux > 0 && capacite(s) < REGLES.capaciteMax ? ' Retire une carte ou dépense 1 Flux (+1 place).' : ' Retire une carte.';
    log(s, debut + fin);
    return { ok: false, message: debut + fin };
  }
  s.main = s.main.filter((x) => x !== g);
  // une carte à plusieurs Fréquences prend celle qui prolonge la suite
  if (g.fs && g.fs.length > 1) g.f = meilleureFrequence(s.chaine, g.fs);
  // une carte de soin (hors Vague) reçoit une cible proposée : le joueur peut la changer
  if (soigneUnSeul(g)) g.cible = cibleConseillee(s);
  else delete g.cible;
  s.chaine.push(g);
  return { ok: true };
}

/** Une carte qui soigne un seul Porteur (la Vague soigne toute l'escouade) */
export const soigneUnSeul = (g: Geste) => g.type === 'soin' && g.effet?.type !== 'vague';

/**
 * La cible proposée pour un soin : le Porteur visé par l'attaque annoncée s'il risque de tomber bas,
 * sinon le plus blessé.
 */
function cibleConseillee(s: CombatEtat): string | undefined {
  const coups = new Map<string, number>();
  for (const en of ennemisDebout(s)) {
    const it = intentionDe(s, en);
    if (it.type === 'atk' && !it.zone && it.cibleId) coups.set(it.cibleId, (coups.get(it.cibleId) ?? 0) + it.v * puissance(en));
  }
  for (const [id, v] of coups) {
    const p = s.porteurs.find((x) => x.id === id && x.pv > 0);
    if (p && p.pv - v <= p.pvMax * 0.3) return p.id;
  }
  return plusBlesse(s)?.id;
}

/** Change la cible d'une carte de soin de la chaîne : passe au Porteur suivant encore debout */
export function cibler(s: CombatEtat, uid: string, porteurId?: string): Resultat {
  const g = s.chaine.find((x) => x.uid === uid);
  if (!g || !soigneUnSeul(g)) return { ok: false };
  const debout = vivants(s).map((p) => p.id);
  if (porteurId) {
    if (!debout.includes(porteurId)) return { ok: false };
    g.cible = porteurId;
  } else g.cible = debout[(debout.indexOf(g.cible ?? '') + 1) % debout.length];
  return { ok: true };
}

/** Change la Fréquence d'une carte posée dans la chaîne (cartes à plusieurs Fréquences : argent et plus) */
export function accorder(s: CombatEtat, uid: string, f?: number): Resultat {
  if (s.issue !== 'en-cours') return { ok: false };
  const g = s.chaine.find((x) => x.uid === uid);
  if (!g || !g.fs || g.fs.length < 2) return { ok: false };
  const k = g.fs.indexOf(g.f);
  g.f = f !== undefined && g.fs.includes(f) ? f : g.fs[(k + 1) % g.fs.length]!;
  return { ok: true };
}

export function retirer(s: CombatEtat, uid: string): Resultat {
  const g = s.chaine.find((x) => x.uid === uid);
  if (!g) return { ok: false };
  s.chaine = s.chaine.filter((x) => x !== g);
  if (g.fs) g.f = g.fs[0]!;
  s.main.push(g);
  // les cartes à plusieurs Fréquences qui restent reprennent celle qui prolonge la nouvelle suite
  s.chaine.forEach((x, i) => { if (x.fs && x.fs.length > 1) x.f = meilleureFrequence(s.chaine.slice(0, i), x.fs); });
  return { ok: true };
}

/** Déplace une carte posée à une autre place de la chaîne, sans la renvoyer en main (une suite mal posée se répare) */
export function deplacer(s: CombatEtat, uid: string, vers: number): Resultat {
  if (s.issue !== 'en-cours') return { ok: false };
  const de = s.chaine.findIndex((x) => x.uid === uid);
  if (de < 0) return { ok: false };
  const a = Math.max(0, Math.min(s.chaine.length - 1, vers));
  if (a === de) return { ok: false };
  const [g] = s.chaine.splice(de, 1);
  s.chaine.splice(a, 0, g!);
  // les cartes à plusieurs Fréquences reprennent celle qui prolonge la suite à leur nouvelle place
  s.chaine.forEach((x, i) => { if (x.fs && x.fs.length > 1) x.f = meilleureFrequence(s.chaine.slice(0, i), x.fs); });
  return { ok: true };
}

export function viderChaine(s: CombatEtat): void {
  for (const g of s.chaine) if (g.fs) g.f = g.fs[0]!;
  s.main.push(...s.chaine);
  s.chaine = [];
}

export function allonger(s: CombatEtat): Resultat {
  if (s.flux < 1 || capacite(s) >= REGLES.capaciteMax) return { ok: false };
  s.flux--;
  s.capaBonus++;
  log(s, 'Flux dépensé : la chaîne gagne une place ce tour-ci.');
  return { ok: true };
}

export function repiocher(s: CombatEtat): Resultat {
  if (s.flux < 1) return { ok: false };
  s.flux--;
  s.defausse.push(...s.main);
  s.main = [];
  piocher(s);
  log(s, 'Flux dépensé : nouvelle main.');
  return { ok: true };
}

/**
 * Ce que la chaîne posée fera si on la lance (26 octobre 2026). Bryan : « ça fait beaucoup de calculs à faire avant de lancer
 * une attaque ». La chaîne est jouée sur une copie du combat, avec exactement les règles du vrai lancer (Résonance, lignées,
 * Blindé, Fissure, bouclier de l'ennemi…) : le total affiché est celui qui tombera. Rien n'est modifié.
 */
export function apercuChaine(s: CombatEtat): { degats: number; absorbe: number; bouclier: number; soin: number; vaincus: number } {
  const r = { degats: 0, absorbe: 0, bouclier: 0, soin: 0, vaincus: 0 };
  if (s.issue !== 'en-cours' || !s.chaine.length) return r;
  const copie = clone(s);
  const debout = ennemisDebout(copie).length;
  lancer(copie, {
    apercu: (ev) => {
      if (ev.kind === 'degats' && ev.cible === 'ennemi') { r.degats += ev.net; r.absorbe += ev.absorbe; }
      else if (ev.kind === 'bouclier' && ev.cible === 'escouade') r.bouclier += ev.v;
      else if (ev.kind === 'echo') r.bouclier += REGLES.bouclierEcho;
      else if (ev.kind === 'soin' && ev.cible !== 'ennemi' && ev.cible !== 'escouade') r.soin += ev.v;
    },
  });
  r.vaincus = debout - ennemisDebout(copie).length;
  return r;
}

/** Lance la chaîne, puis joue le tour ennemi. Renvoie les pas à animer. */
export function lancer(s: CombatEtat, opts: { silencieux?: boolean; apercu?: (ev: Evenement) => void } = {}): Pas[] {
  const pas: Pas[] = [];
  if (s.issue !== 'en-cours' || !s.chaine.length) return pas;
  // en mode silencieux (robot d'équilibrage), on ne garde pas les étapes d'animation
  const emettre = opts.apercu ?? (opts.silencieux ? () => {} : (ev: Evenement) => { pas.push({ ev, etat: clone(s) }); });

  const analyse = analyserChaine(s.chaine);
  // Écho ancien : une suite de 4 résonne comme une suite de 5
  const brut = s.condition === 'echo' && analyse.suite === 4 ? { ...analyse, mult: REGLES.multSuite[5]! } : analyse;
  // Dissonance : l'ennemi a brouillé les Fréquences, la suite ne compte pas ce tour-ci
  const brouille = s.dissonance || s.sansResonance;
  const a = brouille ? { ...brut, suite: 0, mult: 1 } : brut;
  if (brouille && brut.suite >= 3) {
    log(s, 'Fréquences brouillées : pas de Résonance ce tour-ci.');
    emettre({ kind: 'effet', cible: 'escouade', texte: 'Brouillé' });
  }
  s.dissonance = false;
  if (a.suite >= 3) {
    log(s, `Résonance ! Suite de ${a.suite} : effets +${Math.round((a.mult - 1) * 100)} %.`);
    emettre({ kind: 'resonance', suite: a.suite, mult: a.mult });
  }
  const freqs = frequencesEffectives(s.chaine);
  for (const [i, g] of s.chaine.entries()) {
    emettre({ kind: 'carte', rang: i, total: s.chaine.length, lignee: ligneeGeste(g), type: g.type, porteur: g.porteur, suite: a.suite, ...(g.effet ? { effet: g.effet.type } : {}) });
    for (const ev of appliquer(s, g, a.mult, i)) emettre(ev);
    if (s.ennemi.pv > 0 && freqs[i] === s.ennemi.felure && !s.ennemi.felureBrisee) briser(s, s.ennemi, emettre, a.suite >= 3);
    phaseGardien(s, s.ennemi, emettre);
    if (s.ennemi.pv <= 0) tombe(s, s.ennemi, emettre);
    if (s.ennemi.pv <= 0) {
      // dans un groupe, le reste de la chaîne passe à l'ennemi suivant
      if (i < s.chaine.length - 1 && viserSuivant(s)) {
        log(s, `${ennemiDef(s.ennemi.id).nom} est visé à son tour.`);
        emettre({ kind: 'cible', rang: s.ennemi.rang ?? 0 });
      } else break;
    }
  }
  if (a.echo) {
    s.bouclier += REGLES.bouclierEcho;
    log(s, `Écho : trois Fréquences identiques, bouclier d’escouade +${REGLES.bouclierEcho}.`);
    emettre({ kind: 'echo' });
  }
  const gain = (a.suite >= 3 ? 1 : 0) + (a.echo ? 1 : 0);
  if (gain) {
    const avant = s.flux;
    s.flux = Math.min(REGLES.fluxMax, s.flux + gain);
    if (s.flux > avant) {
      log(s, `La Résonance remplit le Flux (+${s.flux - avant}).`);
      emettre({ kind: 'flux', gain: s.flux - avant });
    }
  }
  // l'aperçu s'arrête là : seule la chaîne compte, pas la riposte
  if (opts.apercu) return pas;
  s.debride = false;
  for (const g of s.chaine) if (g.fs) g.f = g.fs[0]!;
  s.defausse.push(...s.chaine);
  s.chaine = [];
  // Élan : les places gagnées servent au tour suivant
  s.capaBonus = Math.min(REGLES.capaciteMax - REGLES.capaciteBase, s.capaProchain ?? 0);
  s.capaProchain = 0;
  // Fissure : dure ce tour-ci et le suivant
  for (const en of tousEnnemis(s)) {
    if (en.fissureTours) {
      en.fissureTours--;
      if (!en.fissureTours) en.fissure = 0;
    }
  }
  // le visé est tombé en fin de chaîne : on vise le suivant pour le tour d'après
  if (s.ennemi.pv <= 0) viserSuivant(s);

  if (!ennemisDebout(s).length) {
    s.issue = 'victoire';
    emettre({ kind: 'fin', issue: 'victoire' });
    return pas;
  }
  tourEnnemi(s, emettre);
  return pas;
}

// ---------- Interne ----------

function log(s: CombatEtat, t: string) {
  s.journal.unshift(t);
  s.journal = s.journal.slice(0, 6);
}

/**
 * Une escouade décimée joue moins de cartes (24 octobre 2026, Bryan : seul, un Porteur devenait « pratiquement imbattable »
 * en alternant dégâts, soin et bouclier, car sa main de 5 cartes reprenait presque tout son deck de 6 à chaque tour).
 * Une carte de moins en main par Porteur à terre : 5 à trois, 4 à deux, 3 seul.
 */
const tailleMainDe = (s: CombatEtat) => REGLES.tailleMain - s.porteurs.filter((p) => p.pv <= 0).length;

function piocher(s: CombatEtat, taille: number = tailleMainDe(s)) {
  const r = tireur(s);
  let garde = 0;
  while (s.main.length < taille && garde++ < 80) {
    if (!s.pioche.length) {
      if (!s.defausse.length) break;
      s.pioche = r.melanger(s.defausse);
      s.defausse = [];
    }
    const g = s.pioche.pop() as Geste;
    if (estATerre(s, g.porteur)) {
      s.defausse.push(g);
      continue;
    }
    s.main.push(g);
  }
}

function choisirCible(s: CombatEtat, regle: CibleRegle = 'hasard'): string | null {
  const v = vivants(s);
  if (!v.length) return null;
  if (regle === 'faible') {
    return v.slice().sort((a, b) => a.pv / a.pvMax - b.pv / b.pvMax)[0]!.id;
  }
  if (regle !== 'hasard') {
    const p = v.find((x) => x.id === regle) ?? v.find((x) => porteurDef(x.id).lignee === regle);
    if (p) return p.id;
  }
  return v[tireur(s).entier(v.length)]!.id;
}

function choisirIntention(s: CombatEtat, en: EnnemiEtat) {
  const e = ennemiDef(en.id);
  const motif = en.phase2 && e.phase ? e.phase.motif : e.motif;
  const m = motif[en.etape % motif.length]!;
  en.etape++;
  const it: Intention = { ...m };
  if (it.type === 'atk' || it.type === 'bouclier' || it.type === 'soin') it.v = Math.round(it.v * en.force);
  if (it.type === 'atk' && !it.zone) it.cibleId = choisirCible(s, it.cible);
  fixerIntention(s, en, it);
}

function plusBlesse(s: CombatEtat): PorteurEtat | undefined {
  return vivants(s).sort((a, b) => a.pv / a.pvMax - b.pv / b.pvMax)[0];
}

function appliquer(s: CombatEtat, g: Geste, mult: number, rang: number): Evenement[] {
  const nomP = g.porteur ? porteurDef(g.porteur).nom : 'Spécial';
  const ef = g.effet;
  const evs: Evenement[] = [];
  // Crescendo : plus la carte arrive tard dans la chaîne, plus elle frappe fort
  const cresc = ef?.type === 'crescendo' ? 1 + ef.part * rang : 1;
  // les conditions de salle : une lignée favorisée, une source qui renforce les soins
  const faveur = s.condition && FAVEUR_CONDITION[s.condition] === ligneeGeste(g) ? 1.2 : 1;
  const source = s.condition === 'sanctuaire' && g.type === 'soin' ? 1.3 : 1;
  // Débridage (Coup d'éclat des Augmentés) : les coups de ce tour frappent deux fois plus fort
  const debride = s.debride && g.type === 'atk' ? REGLES.eclat.debride : 1;
  const force = g.v * mult * cresc * faveur * source * debride;

  if (g.type === 'atk') {
    const e = ennemiDef(s.ennemi.id);
    const av = avantage(ligneeGeste(g), e.lignee);
    // Évanescent : hors Résonance, l'ennemi ne prend qu'une part des coups ; Blindé : chaque coup perd quelques points (Perçant passe outre)
    const evan = trait(s.ennemi, 'evanescent');
    // l'armure grandit doucement avec la puissance de l'ennemi (sinon les petites cartes ne servent plus à rien en profondeur)
    const blinde = ef?.type === 'percant' ? 0 : Math.round((trait(s.ennemi, 'blinde')?.v ?? 0) * (1 + 0.4 * (s.ennemi.force - 1)));
    const dmg = Math.max(0, Math.round(force * av * (1 + (s.ennemi.fissure ?? 0)) * (evan && mult <= 1 ? 1 - evan.part : 1)) - blinde);
    const abs = ef?.type === 'percant' ? 0 : Math.min(s.ennemi.bouclier, dmg);
    s.ennemi.bouclier -= abs;
    const net = dmg - abs;
    s.ennemi.pv = Math.max(0, s.ennemi.pv - net);
    log(s, `${nomP} · ${g.nom} : ${net} dégâts${av > 1 ? ' (avantage de lignée)' : ''}${abs ? `, ${abs} absorbés` : ''}${ef?.type === 'percant' && s.ennemi.bouclier ? ', bouclier transpercé' : ''}.`);
    evs.push({ kind: 'degats', cible: 'ennemi', net, absorbe: abs, rang: s.ennemi.rang ?? 0 });
    // Épines : une part du coup revient au Porteur qui a frappé, sans jamais le mettre à terre
    const epines = trait(s.ennemi, 'epines');
    const frappeur = epines && net > 0 ? s.porteurs.find((p) => p.id === g.porteur && p.pv > 1) : undefined;
    if (epines && frappeur) {
      const retour = Math.min(frappeur.pv - 1, Math.max(1, Math.round(net * epines.part)));
      frappeur.pv -= retour;
      log(s, `Épines : ${porteurDef(frappeur.id).nom} se blesse (−${retour}).`);
      evs.push({ kind: 'degats', cible: frappeur.id, net: retour, absorbe: 0, source: 'epines' });
    }
    if (ef?.type === 'siphon' && net > 0) {
      // le Siphon soigne le Porteur qui a joué la carte : c'est lui qui boit la vie (s'il est à terre, le plus blessé)
      const lui = s.porteurs.find((p) => p.id === g.porteur && p.pv > 0);
      const c = lui ?? plusBlesse(s);
      if (c) {
        const avant = c.pv;
        c.pv = Math.min(c.pvMax, c.pv + Math.round(net * ef.part));
        if (c.pv > avant) {
          log(s, `Siphon : ${porteurDef(c.id).nom} récupère ${c.pv - avant} PV.`);
          evs.push({ kind: 'soin', cible: c.id, v: c.pv - avant });
        }
      }
    }
  } else if (g.type === 'bouclier') {
    const v = Math.round(force);
    s.bouclier += v;
    log(s, `${nomP} · ${g.nom} : bouclier d’escouade +${v}.`);
    evs.push({ kind: 'bouclier', cible: 'escouade', v });
  } else {
    const choisi = g.cible ? s.porteurs.find((p) => p.id === g.cible && p.pv > 0) : undefined;
    const cibles = ef?.type === 'vague' ? vivants(s) : [choisi ?? plusBlesse(s)].filter((x): x is PorteurEtat => !!x);
    const morceaux: string[] = [];
    for (const c of cibles) {
      const avant = c.pv;
      c.pv = Math.min(c.pvMax, c.pv + Math.round(force));
      morceaux.push(`${porteurDef(c.id).nom} +${c.pv - avant}`);
      evs.push({ kind: 'soin', cible: c.id, v: c.pv - avant });
    }
    if (!cibles.length) evs.push({ kind: 'soin', cible: 'escouade', v: 0 });
    else log(s, `${nomP} · ${g.nom} : ${morceaux.join(', ')} PV.`);
  }

  // effets qui ne dépendent pas du type de la carte
  if (ef?.type === 'flux') {
    const avant = s.flux;
    s.flux = Math.min(REGLES.fluxMax, s.flux + ef.v);
    if (s.flux > avant) {
      log(s, `Surcharge : Flux +${s.flux - avant}.`);
      evs.push({ kind: 'flux', gain: s.flux - avant });
    }
  } else if (ef?.type === 'desarmer' && s.intention.type === 'atk') {
    const avant = s.intention.v;
    s.intention.v = Math.round(avant * (1 - ef.part));
    log(s, `Désarmé : sa prochaine attaque passe de ${avant} à ${s.intention.v}.`);
    evs.push({ kind: 'effet', cible: 'ennemi', texte: 'Désarmé', rang: s.ennemi.rang ?? 0 });
  } else if (ef?.type === 'fissure' && s.ennemi.pv > 0) {
    s.ennemi.fissure = Math.max(s.ennemi.fissure ?? 0, ef.part);
    s.ennemi.fissureTours = 2;
    log(s, `Fissure : l’ennemi subit +${Math.round(ef.part * 100)} % de dégâts jusqu’au tour prochain.`);
    evs.push({ kind: 'effet', cible: 'ennemi', texte: 'Fissure', rang: s.ennemi.rang ?? 0 });
  } else if (ef?.type === 'elan') {
    s.capaProchain = (s.capaProchain ?? 0) + 1;
    log(s, 'Élan : la prochaine chaîne aura une place de plus.');
    evs.push({ kind: 'effet', cible: 'escouade', texte: 'Élan' });
  } else if (ef?.type === 'rempart') {
    s.garde = Math.max(s.garde ?? 0, ef.part);
    evs.push({ kind: 'effet', cible: 'escouade', texte: 'Rempart' });
  }
  return evs;
}

/**
 * Fuir un combat (décision du 22 octobre 2026) : l'attaque que l'ennemi annonçait touche l'escouade pendant qu'elle s'enfuit.
 * Rien si l'ennemi ne préparait pas d'attaque. Même calcul que son vrai tour (élan, triangle des lignées), et le bouclier
 * de l'escouade protège encore. Un Porteur peut finir à terre, jamais plus : personne ne meurt dans EMPREINTES.
 * Ne modifie pas l'état : renvoie les PV d'après le coup, et les coups portés (pour l'animation).
 */
export function coupDeFuite(s: CombatEtat): { porteurs: PorteurEtat[]; coups: { id: string; net: number; absorbe: number }[]; attaque: string | null } {
  const porteurs = s.porteurs.map((p) => ({ ...p }));
  let bouclier = s.bouclier;
  const coups: { id: string; net: number; absorbe: number }[] = [];
  const noms: string[] = [];
  for (const en of ennemisDebout(s)) {
    const it = intentionDe(s, en);
    if (it.type !== 'atk') continue;
    const e = ennemiDef(en.id);
    const debout = porteurs.filter((p) => p.pv > 0);
    let cibles: PorteurEtat[];
    if (it.zone) cibles = debout;
    else {
      const visee = it.cibleId ? debout.find((p) => p.id === it.cibleId) : undefined;
      cibles = visee ? [visee] : debout.slice(0, 1);
    }
    for (const c of cibles) {
      const dmg = Math.round(it.v * puissance(en) * usureCombat(s).attaque * avantage(e.lignee, porteurDef(c.id).lignee));
      const absorbe = Math.min(bouclier, dmg);
      bouclier -= absorbe;
      const net = dmg - absorbe;
      c.pv = Math.max(0, c.pv - net);
      if (c.pv <= 0) c.aTerre = true;
      coups.push({ id: c.id, net, absorbe });
    }
    noms.push(it.nom);
  }
  return { porteurs, coups, attaque: noms.length ? noms.join(', ') : null };
}

function tourEnnemi(s: CombatEtat, emettre: (ev: Evenement) => void) {
  if (s.condition === 'eboulis') {
    // Éboulis : des pierres sur tout le monde, sans mettre personne à terre ni achever un ennemi
    const v = eboulis(s);
    for (const p of vivants(s)) { const n = Math.min(v, p.pv - 1); if (n > 0) { p.pv -= n; emettre({ kind: 'degats', cible: p.id, net: n, absorbe: 0, source: 'eboulis' }); } }
    for (const en of ennemisDebout(s)) { const n = Math.min(v, en.pv - 1); if (n > 0) { en.pv -= n; emettre({ kind: 'degats', cible: 'ennemi', net: n, absorbe: 0, rang: en.rang ?? 0, source: 'eboulis' }); } }
    log(s, `Éboulis : des pierres tombent (−${v} chacun).`);
  }
  const groupe = enGroupe(s);
  for (const en of ennemisDebout(s)) {
    if (!vivants(s).length) break;
    if (groupe) emettre({ kind: 'ennemi-agit', rang: en.rang ?? 0 });
    agir(s, en, intentionDe(s, en), emettre);
  }
  for (const p of s.porteurs) {
    if (p.pv <= 0 && !p.aTerre) {
      // Seconde chance (Sasha) : le premier qui tombe se relève, une fois par combat
      if (s.releve && !s.releveFaite) {
        s.releveFaite = true;
        p.pv = Math.max(1, Math.round(p.pvMax * s.releve));
        log(s, `Seconde chance : ${porteurDef(p.id).nom} se relève (${p.pv} PV).`);
        emettre({ kind: 'soin', cible: p.id, v: p.pv });
        continue;
      }
      p.aTerre = true;
      log(s, `${porteurDef(p.id).nom} est à terre : ses cartes quittent le deck, et la main perd une carte.`);
      emettre({ kind: 'a-terre', cible: p.id });
    }
  }
  const horsJeu = s.main.filter((g) => estATerre(s, g.porteur));
  if (horsJeu.length) {
    s.main = s.main.filter((g) => !horsJeu.includes(g));
    s.defausse.push(...horsJeu);
  }
  if (!vivants(s).length) {
    s.issue = 'defaite';
    emettre({ kind: 'fin', issue: 'defaite' });
    return;
  }
  // Rempart (et la Marque de Docker) : une part du bouclier restant passe au tour suivant
  const part = Math.max(s.garde ?? 0, s.gardeMarque ?? 0);
  const garde = Math.round(s.bouclier * part);
  if (garde) log(s, `${(s.garde ?? 0) >= part ? 'Rempart' : 'Bras de quai'} : ${garde} de bouclier gardés.`);
  s.bouclier = garde;
  s.garde = 0;
  s.ombre = false;
  s.tour++;
  for (const en of ennemisDebout(s)) choisirIntention(s, en);
  piocher(s);
  fixerFelures(s);
}

// ---------- Les Coups d'éclat (25 octobre 2026) ----------
// Quand le Flux est plein, un Porteur peut déclencher le coup de sa lignée, une seule fois par combat pour toute
// l'escouade : le Flux se vide, et il le paiera en Usure au retour. Garder son Flux ou le dépenser, c'est le dilemme.

export const ECLATS: Record<Lignee, { nom: string; texte: string }> = {
  tech: { nom: 'Débridage', texte: 'Les coups de ta chaîne frappent deux fois plus fort ce tour-ci.' },
  bio: { nom: 'Sursaut', texte: 'Toute l’escouade récupère 40 % de ses PV, et un Porteur à terre se relève.' },
  reso: { nom: 'Ombre agissante', texte: 'Aucune attaque ennemie ne porte au prochain tour ennemi.' },
};

/** Les Coups d'éclat qu'on peut déclencher maintenant : un par lignée, porté par le premier Porteur debout de cette lignée */
export function eclatsPossibles(s: CombatEtat): { porteur: string; lignee: Lignee }[] {
  if (s.issue !== 'en-cours' || s.eclat || s.flux < REGLES.fluxMax) return [];
  const r: { porteur: string; lignee: Lignee }[] = [];
  for (const p of vivants(s)) {
    const l = porteurDef(p.id).lignee;
    if (!r.some((x) => x.lignee === l)) r.push({ porteur: p.id, lignee: l });
  }
  return r;
}

/** Déclenche le Coup d'éclat d'un Porteur. Renvoie les pas à animer (vide si c'est impossible). */
export function eclater(s: CombatEtat, porteurId: string, opts: { silencieux?: boolean } = {}): Pas[] {
  const pas: Pas[] = [];
  const choix = eclatsPossibles(s).find((x) => x.porteur === porteurId);
  if (!choix) return pas;
  const emettre = opts.silencieux ? () => {} : (ev: Evenement) => { pas.push({ ev, etat: clone(s) }); };
  s.flux = 0;
  s.eclat = choix;
  const p = porteurEtat(s, porteurId)!;
  p.usureEclat = (p.usureEclat ?? 0) + REGLES.eclat.usure;
  const nom = porteurDef(porteurId).nom;
  emettre({ kind: 'effet', cible: porteurId, texte: ECLATS[choix.lignee].nom });
  if (choix.lignee === 'tech') {
    s.debride = true;
    log(s, `Débridage : ${nom} pousse ses implants au-delà du raisonnable. La chaîne frappera deux fois plus fort.`);
  } else if (choix.lignee === 'reso') {
    s.ombre = true;
    log(s, `Ombre agissante : l’ombre de ${nom} se lève et retiendra les coups du prochain tour.`);
  } else {
    const aTerre = s.porteurs.find((x) => x.pv <= 0);
    if (aTerre) {
      aTerre.pv = Math.max(1, Math.round(aTerre.pvMax * REGLES.eclat.sursaut));
      aTerre.aTerre = false;
      emettre({ kind: 'soin', cible: aTerre.id, v: aTerre.pv });
    }
    for (const c of vivants(s)) {
      if (c === aTerre) continue;
      const avant = c.pv;
      c.pv = Math.min(c.pvMax, c.pv + Math.round(c.pvMax * REGLES.eclat.sursaut));
      if (c.pv > avant) emettre({ kind: 'soin', cible: c.id, v: c.pv - avant });
    }
    log(s, `Sursaut : le corps de ${nom} répond pour tous.${aTerre ? ` ${porteurDef(aTerre.id).nom} se relève.` : ''}`);
  }
  return pas;
}

// ---------- La Fêlure (25 octobre 2026) ----------
// Chaque tour, chaque ennemi montre une Fréquence fêlée. Une carte de cette Fréquence, posée dans la chaîne pendant
// qu'il est visé, brise son intention (attaque, bouclier ou soin réduits de moitié, d'un quart chez un gardien ou un blindé) ;
// si la chaîne fait aussi une Résonance, elle remplit le Flux.
// Deux fois sur trois, la Fréquence fêlée est l'une de celles de la main : jouable, pas automatique.
// Un évanescent la cache (elle n'est pas affichée, mais existe) ; la Vigie aspire le Flux de ceux qui le gardent.

export const estGardien = (id: string) => ZONES.some((z) => z.boss === id);
/** La Fêlure d'un ennemi est-elle visible ? (cachée chez les évanescents tant qu'elle n'est pas brisée) */
export const felureVisible = (en: EnnemiEtat) => en.felure !== undefined && (!!en.felureBrisee || !trait(en, 'evanescent'));

function fixerFelures(s: CombatEtat) {
  const r = tireur(s);
  const enMain = [...new Set(s.main.flatMap((g) => (g.effet?.type === 'accord' ? [] : g.fs ?? [g.f])))];
  for (const en of tousEnnemis(s)) {
    delete en.felureBrisee;
    if (en.pv <= 0 || en.simple) { delete en.felure; continue; }
    en.felure = enMain.length && r.nombre() < REGLES.felure.chanceMain ? enMain[r.entier(enMain.length)]! : 1 + r.entier(9);
  }
}

/** La part retirée à l'intention quand la Fêlure se brise : les gardiens et les blindés résistent mieux (un quart seulement) */
export const partFelure = (en: EnnemiEtat) => (estGardien(en.id) || trait(en, 'blinde') ? REGLES.felure.partGardien : REGLES.felure.part);

/** La Fréquence fêlée d'un ennemi est touchée : son intention se brise ; le Flux monte si la chaîne résonne */
function briser(s: CombatEtat, en: EnnemiEtat, emettre: (ev: Evenement) => void, resonne: boolean) {
  en.felureBrisee = true;
  const it = intentionDe(s, en);
  const part = partFelure(en);
  const nom = ennemiDef(en.id).nom;
  if (it.type === 'atk' || it.type === 'bouclier' || it.type === 'soin') {
    const avant = it.v;
    it.v = Math.round(avant * (1 - part));
    log(s, `Fêlure : ${nom} vacille, ${it.type === 'atk' ? 'son attaque' : it.type === 'bouclier' ? 'son bouclier' : 'son soin'} passe de ${avant} à ${it.v}.`);
  } else log(s, `Fêlure : ${nom} vacille.`);
  emettre({ kind: 'effet', cible: 'ennemi', texte: 'Fêlure', rang: en.rang ?? 0 });
  if (!resonne) return;
  const avant = s.flux;
  s.flux = Math.min(REGLES.fluxMax, s.flux + REGLES.felure.flux);
  if (s.flux > avant) emettre({ kind: 'flux', gain: s.flux - avant });
}

/** Ce que fait un ennemi à son tour */
function agir(s: CombatEtat, en: EnnemiEtat, it: Intention, emettre: (ev: Evenement) => void) {
  const e = ennemiDef(en.id);
  const rang = en.rang ?? 0;
  en.bouclier = 0;
  if (it.type === 'bouclier') {
    en.bouclier = it.v;
    log(s, `${e.nom} se protège : bouclier ${it.v}.`);
    emettre({ kind: 'bouclier', cible: 'ennemi', v: it.v, rang });
  } else if (it.type === 'boost') {
    en.boost = 2;
    log(s, `${e.nom} se concentre. Sa prochaine attaque fera double dégâts.`);
    emettre({ kind: 'boost', rang });
  } else if (it.type === 'soin') {
    const avant = en.pv;
    en.pv = Math.min(en.pvMax, en.pv + Math.round(it.v * usureCombat(s).soins));
    log(s, `${e.nom} · ${it.nom} : +${en.pv - avant} PV.`);
    emettre({ kind: 'soin', cible: 'ennemi', v: en.pv - avant, rang });
  } else if (it.type === 'dissonance' && s.lucide) {
    log(s, `${e.nom} · ${it.nom} : Véla lit le brouillage, tes Fréquences restent nettes.`);
    emettre({ kind: 'effet', cible: 'escouade', texte: 'Lucide' });
  } else if (it.type === 'dissonance') {
    s.dissonance = true;
    log(s, `${e.nom} · ${it.nom} : tes Fréquences sont brouillées, pas de Résonance au prochain tour.`);
    emettre({ kind: 'effet', cible: 'escouade', texte: 'Dissonance' });
  } else {
    let cibles: PorteurEtat[];
    if (it.zone) cibles = vivants(s);
    else {
      const visee = it.cibleId ? porteurEtat(s, it.cibleId) : undefined;
      const id = visee && visee.pv > 0 ? visee.id : choisirCible(s);
      cibles = id ? [porteurEtat(s, id)!] : [];
    }
    const morceaux: string[] = [];
    for (const c of cibles) {
      // Ombre agissante (Coup d'éclat des Résonants) : l'ombre retient le coup
      const dmg = s.ombre ? 0 : Math.round(it.v * puissance(en) * usureCombat(s).attaque * avantage(e.lignee, porteurDef(c.id).lignee));
      const abs = Math.min(s.bouclier, dmg);
      s.bouclier -= abs;
      const net = dmg - abs;
      c.pv = Math.max(0, c.pv - net);
      morceaux.push(`${porteurDef(c.id).nom} ${net ? '−' + net : 'protégé'}`);
      emettre({ kind: 'degats', cible: c.id, net, absorbe: abs, rang });
    }
    en.boost = 1;
    const aspire = trait(en, 'aspire');
    if (aspire && !s.ombre && s.flux > 0) {
      const pris = Math.min(s.flux, aspire.v);
      s.flux -= pris;
      log(s, `${e.nom} aspire ${pris} Flux.`);
      emettre({ kind: 'effet', cible: 'escouade', texte: 'Flux aspiré' });
    }
    log(s, s.ombre ? `${e.nom} · ${it.nom} : l’ombre retient le coup.` : `${e.nom} · ${it.nom} : ${morceaux.join(', ')}.`);
  }
  // Régénération : il regagne une part de ses PV à la fin de son tour
  const regen = trait(en, 'regeneration');
  if (regen && en.pv > 0 && en.pv < en.pvMax && usureCombat(s).soins > 0) {
    const avant = en.pv;
    en.pv = Math.min(en.pvMax, en.pv + Math.max(1, Math.round(en.pvMax * regen.part * usureCombat(s).soins)));
    log(s, `${e.nom} se régénère (+${en.pv - avant}).`);
    emettre({ kind: 'soin', cible: 'ennemi', v: en.pv - avant, rang });
  }
}

/** Un ennemi surgit en cours de combat (rejeton d'un essaim, renfort d'un gardien) : le combat devient un groupe */
function invoquer(s: CombatEtat, id: string, part: number, emettre: (ev: Evenement) => void) {
  const tous = tousEnnemis(s);
  if (ennemisDebout(s).length >= 4) return;
  if (s.ennemi.rang === undefined) s.ennemi.rang = 0;
  s.autres ??= [];
  const rang = Math.max(...tous.map((e) => e.rang ?? 0)) + 1;
  const force = (s.forceBase ?? s.ennemi.force) * part;
  const pv = Math.max(1, Math.round(ennemiDef(id).pvMax * force));
  const en: EnnemiEtat = { id, pv, pvMax: pv, force, bouclier: 0, etape: 0, boost: 1, rang, rejeton: true };
  s.autres.push(en);
  choisirIntention(s, en);
  log(s, `${ennemiDef(id).nom} surgit.`);
  emettre({ kind: 'renfort', rang, id });
}

/** Un ennemi tombe : l'essaim laisse un rejeton, les vengeurs s'enragent */
function tombe(s: CombatEtat, en: EnnemiEtat, emettre: (ev: Evenement) => void) {
  const essaim = trait(en, 'essaim');
  if (essaim && !en.rejeton) invoquer(s, en.id, essaim.part, emettre);
  for (const autre of ennemisDebout(s)) {
    if (autre !== en && trait(autre, 'vengeur') && autre.boost < 2) {
      autre.boost = 2;
      log(s, `${ennemiDef(autre.id).nom} venge son allié : sa prochaine attaque est doublée.`);
      emettre({ kind: 'boost', rang: autre.rang ?? 0 });
    }
  }
}

/** Gardien à deux phases : sous son seuil de PV, il change de gestes et appelle des renforts */
function phaseGardien(s: CombatEtat, en: EnnemiEtat, emettre: (ev: Evenement) => void) {
  const ph = ennemiDef(en.id).phase;
  if (!ph || en.simple || en.phase2 || en.pv <= 0 || en.pv > en.pvMax * ph.seuil) return;
  en.phase2 = true;
  en.etape = 0;
  log(s, `${ennemiDef(en.id).nom} : ${ph.nom}. ${ph.texte}`);
  emettre({ kind: 'phase', rang: en.rang ?? 0, nom: ph.nom });
  choisirIntention(s, en);
  for (const id of ph.renforts ?? []) invoquer(s, id, 0.25, emettre);
}
