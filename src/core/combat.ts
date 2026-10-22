// Le moteur de combat. Fonctions pures sur un état sérialisable (JSON) :
// l'interface appelle ces fonctions puis anime les « pas » qu'elles renvoient.

import { DECK_DEPART, ennemiDef, porteurDef } from './donnees';
import { REGLES, analyserChaine, avantage, meilleureFrequence, places } from './regles';
import { tireur } from './rng';
import type {
  BonusMarques, CibleRegle, CombatEtat, EnnemiEtat, Evenement, Geste, GesteDef, Intention, LigneeGeste, Pas, PorteurEtat,
} from './types';

export interface Resultat {
  ok: boolean;
  message?: string;
}

const clone = <T>(x: T): T => JSON.parse(JSON.stringify(x)) as T;

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
}): CombatEtat {
  const e = ennemiDef(opts.ennemiId);
  const groupe = [opts.ennemiId, ...(opts.escorte ?? [])];
  // un groupe se partage la puissance d'un ennemi seul (un peu plus au total : il faut choisir qui frapper)
  const force = (opts.force ?? 1) * (PART_GROUPE[groupe.length] ?? PART_GROUPE[3]!);
  const etat = (id: string, rang: number): EnnemiEtat => {
    const d = ennemiDef(id);
    const pv = Math.round(d.pvMax * force);
    return { id, pv, pvMax: pv, force, bouclier: 0, etape: rang, boost: 1, ...(groupe.length > 1 ? { rang } : {}) };
  };
  const s: CombatEtat = {
    porteurs: clone(opts.porteurs),
    ennemi: etat(opts.ennemiId, 0),
    ...(groupe.length > 1 ? { autres: groupe.slice(1).map((id, k) => etat(id, k + 1)) } : {}),
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
  for (const en of tousEnnemis(s)) choisirIntention(s, en);
  piocher(s);
  return s;
}

// ---------- Lecture ----------

export const porteurEtat = (s: CombatEtat, id: string) => s.porteurs.find((p) => p.id === id);
export const vivants = (s: CombatEtat) => s.porteurs.filter((p) => p.pv > 0);
export const estATerre = (s: CombatEtat, id: string | null) => !!id && (porteurEtat(s, id)?.pv ?? 0) <= 0;
export const capacite = (s: CombatEtat) => REGLES.capaciteBase + s.capaBonus;
export const placesPrises = (s: CombatEtat) => s.chaine.reduce((n, g) => n + places(g), 0);
export const placesLibres = (s: CombatEtat) => capacite(s) - placesPrises(s);
export const ligneeGeste = (g: GesteDef): LigneeGeste => (g.porteur ? porteurDef(g.porteur).lignee : 'neutre');

/** PV et attaques de chaque ennemi d'un groupe, par rapport à un ennemi seul (×1,28 de PV au total pour deux, ×1,35 pour trois ; réglé au joueur moyen : un groupe pèse à peu près autant que ses membres affrontés seuls) */
export const PART_GROUPE: Record<number, number> = { 1: 1, 2: 0.64, 3: 0.45 };

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
  const v = it.v * en.boost;
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
export function cibleConseillee(s: CombatEtat): string | undefined {
  const coups = new Map<string, number>();
  for (const en of ennemisDebout(s)) {
    const it = intentionDe(s, en);
    if (it.type === 'atk' && !it.zone && it.cibleId) coups.set(it.cibleId, (coups.get(it.cibleId) ?? 0) + it.v * en.boost);
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

/** Lance la chaîne, puis joue le tour ennemi. Renvoie les pas à animer. */
export function lancer(s: CombatEtat, opts: { silencieux?: boolean } = {}): Pas[] {
  const pas: Pas[] = [];
  if (s.issue !== 'en-cours' || !s.chaine.length) return pas;
  // en mode silencieux (robot d'équilibrage), on ne garde pas les étapes d'animation
  const emettre = opts.silencieux ? () => {} : (ev: Evenement) => { pas.push({ ev, etat: clone(s) }); };

  const brut = analyserChaine(s.chaine);
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
  for (const [i, g] of s.chaine.entries()) {
    emettre({ kind: 'carte', rang: i, total: s.chaine.length, lignee: ligneeGeste(g), type: g.type, porteur: g.porteur, suite: a.suite, ...(g.effet ? { effet: g.effet.type } : {}) });
    for (const ev of appliquer(s, g, a.mult, i)) emettre(ev);
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

function piocher(s: CombatEtat) {
  const r = tireur(s);
  let garde = 0;
  while (s.main.length < REGLES.tailleMain && garde++ < 80) {
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
  const m = e.motif[en.etape % e.motif.length]!;
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
  const force = g.v * mult * cresc;

  if (g.type === 'atk') {
    const e = ennemiDef(s.ennemi.id);
    const av = avantage(ligneeGeste(g), e.lignee);
    const dmg = Math.round(force * av * (1 + (s.ennemi.fissure ?? 0)));
    const abs = ef?.type === 'percant' ? 0 : Math.min(s.ennemi.bouclier, dmg);
    s.ennemi.bouclier -= abs;
    const net = dmg - abs;
    s.ennemi.pv = Math.max(0, s.ennemi.pv - net);
    log(s, `${nomP} · ${g.nom} : ${net} dégâts${av > 1 ? ' (avantage de lignée)' : ''}${abs ? `, ${abs} absorbés` : ''}${ef?.type === 'percant' && s.ennemi.bouclier ? ', bouclier transpercé' : ''}.`);
    evs.push({ kind: 'degats', cible: 'ennemi', net, absorbe: abs, rang: s.ennemi.rang ?? 0 });
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
      const dmg = Math.round(it.v * en.boost * avantage(e.lignee, porteurDef(c.id).lignee));
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
  const groupe = enGroupe(s);
  for (const en of ennemisDebout(s)) {
    if (!vivants(s).length) break;
    if (groupe) emettre({ kind: 'ennemi-agit', rang: en.rang ?? 0 });
    agir(s, en, intentionDe(s, en), emettre);
  }
  for (const p of s.porteurs) {
    if (p.pv <= 0 && !p.aTerre) {
      p.aTerre = true;
      log(s, `${porteurDef(p.id).nom} est à terre : ses cartes quittent le deck.`);
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
  // Rempart : une part du bouclier restant passe au tour suivant
  const garde = Math.round(s.bouclier * (s.garde ?? 0));
  if (garde) log(s, `Rempart : ${garde} de bouclier gardés.`);
  s.bouclier = garde;
  s.garde = 0;
  s.tour++;
  for (const en of ennemisDebout(s)) choisirIntention(s, en);
  piocher(s);
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
    en.pv = Math.min(en.pvMax, en.pv + it.v);
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
      const dmg = Math.round(it.v * en.boost * avantage(e.lignee, porteurDef(c.id).lignee));
      const abs = Math.min(s.bouclier, dmg);
      s.bouclier -= abs;
      const net = dmg - abs;
      c.pv = Math.max(0, c.pv - net);
      morceaux.push(`${porteurDef(c.id).nom} ${net ? '−' + net : 'protégé'}`);
      emettre({ kind: 'degats', cible: c.id, net, absorbe: abs, rang });
    }
    en.boost = 1;
    log(s, `${e.nom} · ${it.nom} : ${morceaux.join(', ')}.`);
  }
}
