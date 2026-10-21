// Le moteur de combat. Fonctions pures sur un état sérialisable (JSON) :
// l'interface appelle ces fonctions puis anime les « pas » qu'elles renvoient.

import { DECK_DEPART, ennemiDef, porteurDef } from './donnees';
import { REGLES, analyserChaine, avantage, places } from './regles';
import { tireur } from './rng';
import type {
  CibleRegle, CombatEtat, Evenement, Geste, GesteDef, Intention, LigneeGeste, Pas, PorteurEtat,
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
}): CombatEtat {
  const e = ennemiDef(opts.ennemiId);
  const force = opts.force ?? 1;
  const s: CombatEtat = {
    porteurs: clone(opts.porteurs),
    ennemi: { id: e.id, pv: Math.round(e.pvMax * force), pvMax: Math.round(e.pvMax * force), force, bouclier: 0, etape: 0, boost: 1 },
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
  s.pioche = tireur(s).melanger(deck);
  log(s, `Un ${e.nom} surgit dans la Strate.`);
  choisirIntention(s);
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

export function texteIntention(s: CombatEtat): string {
  const it = s.intention;
  if (it.type === 'bouclier') return `Va se protéger : bouclier ${it.v}`;
  if (it.type === 'boost') return 'Se concentre : sa prochaine attaque fera double dégâts';
  const v = it.v * s.ennemi.boost;
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
    const fin = s.flux > 0 && capacite(s) < REGLES.capaciteMax ? ' Retire un Geste ou dépense 1 Flux (+1 place).' : ' Retire un Geste.';
    log(s, debut + fin);
    return { ok: false, message: debut + fin };
  }
  s.main = s.main.filter((x) => x !== g);
  s.chaine.push(g);
  return { ok: true };
}

export function retirer(s: CombatEtat, uid: string): Resultat {
  const g = s.chaine.find((x) => x.uid === uid);
  if (!g) return { ok: false };
  s.chaine = s.chaine.filter((x) => x !== g);
  s.main.push(g);
  return { ok: true };
}

export function viderChaine(s: CombatEtat): void {
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
export function lancer(s: CombatEtat): Pas[] {
  const pas: Pas[] = [];
  if (s.issue !== 'en-cours' || !s.chaine.length) return pas;
  const emettre = (ev: Evenement) => pas.push({ ev, etat: clone(s) });

  const a = analyserChaine(s.chaine);
  if (a.suite >= 3) {
    log(s, `Résonance ! Suite de ${a.suite} : effets +${Math.round((a.mult - 1) * 100)} %.`);
    emettre({ kind: 'resonance', suite: a.suite, mult: a.mult });
  }
  for (const g of s.chaine) {
    emettre(appliquer(s, g, a.mult));
    if (s.ennemi.pv <= 0) break;
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
  s.defausse.push(...s.chaine);
  s.chaine = [];
  s.capaBonus = 0;

  if (s.ennemi.pv <= 0) {
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
    const p = v.find((x) => porteurDef(x.id).lignee === regle);
    if (p) return p.id;
  }
  return v[tireur(s).entier(v.length)]!.id;
}

function choisirIntention(s: CombatEtat) {
  const e = ennemiDef(s.ennemi.id);
  const m = e.motif[s.ennemi.etape % e.motif.length]!;
  s.ennemi.etape++;
  const it: Intention = { ...m };
  if (it.type === 'atk' || it.type === 'bouclier') it.v = Math.round(it.v * s.ennemi.force);
  if (it.type === 'atk' && !it.zone) it.cibleId = choisirCible(s, it.cible);
  s.intention = it;
}

function plusBlesse(s: CombatEtat): PorteurEtat | undefined {
  return vivants(s).sort((a, b) => a.pv / a.pvMax - b.pv / b.pvMax)[0];
}

function appliquer(s: CombatEtat, g: Geste, mult: number): Evenement {
  const nomP = g.porteur ? porteurDef(g.porteur).nom : 'Spécial';
  if (g.type === 'atk') {
    const e = ennemiDef(s.ennemi.id);
    const av = avantage(ligneeGeste(g), e.lignee);
    const dmg = Math.round(g.v * mult * av);
    const abs = Math.min(s.ennemi.bouclier, dmg);
    s.ennemi.bouclier -= abs;
    const net = dmg - abs;
    s.ennemi.pv = Math.max(0, s.ennemi.pv - net);
    log(s, `${nomP} · ${g.nom} : ${net} dégâts${av > 1 ? ' (avantage de lignée)' : ''}${abs ? `, ${abs} absorbés` : ''}.`);
    return { kind: 'degats', cible: 'ennemi', net, absorbe: abs };
  }
  if (g.type === 'bouclier') {
    const v = Math.round(g.v * mult);
    s.bouclier += v;
    log(s, `${nomP} · ${g.nom} : bouclier d’escouade +${v}.`);
    return { kind: 'bouclier', cible: 'escouade', v };
  }
  const cible = plusBlesse(s);
  if (!cible) return { kind: 'soin', cible: 'escouade', v: 0 };
  const max = cible.pvMax;
  const avant = cible.pv;
  cible.pv = Math.min(max, cible.pv + Math.round(g.v * mult));
  log(s, `${nomP} · ${g.nom} : ${porteurDef(cible.id).nom} récupère ${cible.pv - avant} PV.`);
  return { kind: 'soin', cible: cible.id, v: cible.pv - avant };
}

function tourEnnemi(s: CombatEtat, emettre: (ev: Evenement) => void) {
  const e = ennemiDef(s.ennemi.id);
  const it = s.intention;
  s.ennemi.bouclier = 0;
  if (it.type === 'bouclier') {
    s.ennemi.bouclier = it.v;
    log(s, `${e.nom} se protège : bouclier ${it.v}.`);
    emettre({ kind: 'bouclier', cible: 'ennemi', v: it.v });
  } else if (it.type === 'boost') {
    s.ennemi.boost = 2;
    log(s, `${e.nom} se concentre. Sa prochaine attaque fera double dégâts.`);
    emettre({ kind: 'boost' });
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
      const dmg = Math.round(it.v * s.ennemi.boost * avantage(e.lignee, porteurDef(c.id).lignee));
      const abs = Math.min(s.bouclier, dmg);
      s.bouclier -= abs;
      const net = dmg - abs;
      c.pv = Math.max(0, c.pv - net);
      morceaux.push(`${porteurDef(c.id).nom} ${net ? '−' + net : 'protégé'}`);
      emettre({ kind: 'degats', cible: c.id, net, absorbe: abs });
    }
    s.ennemi.boost = 1;
    log(s, `${e.nom} · ${it.nom} : ${morceaux.join(', ')}.`);
  }
  for (const p of s.porteurs) {
    if (p.pv <= 0 && !p.aTerre) {
      p.aTerre = true;
      log(s, `${porteurDef(p.id).nom} est à terre : ses Gestes quittent le deck.`);
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
  s.bouclier = 0;
  s.tour++;
  choisirIntention(s);
  piocher(s);
}
