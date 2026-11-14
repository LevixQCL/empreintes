// Le duel en temps réel, branché au jeu par le Cercle des quais (3 novembre 2026). Le moteur (core/duel.ts), la session
// (duel/session.ts), le transport en ligne (duel/en-ligne.ts) et l'écran (ui/duel.ts) sont ceux de duel.html, tels quels.
// Ici : ouvrir un salon et y inviter un ami (un défi), rejoindre le salon d'un défi reçu, jouer contre le robot,
// puis noter la fin du duel dans la partie (victoires de la semaine, src/core/partie/cercle.ts).
// Pendant un duel, l'application est en mode « duel » : le district ne se redessine plus chaque seconde, seul le chrono bouge.

import * as J from '../core/jeu';
import { DUEL, creerDuel, graineDuel, validerEscouade, type Camp, type Consigne, type DuelEtat, type EscouadeDuel } from '../core/duel';
import { moduleDef } from '../core/donnees';
import { htmlTraversee } from '../ui/vue';
import { envoyerPillages, planifierGarnison } from './pillages';
import { escouadeDuelDe } from '../core/duel-escouade';
import { SessionDuel, transportRobot, type Transport } from '../duel/session';
import { transportEnLigne } from '../duel/en-ligne';
import { ecransDifferes } from './differes';
import { C, envoyerDefi, marquerDefi, publierVitrine } from './cercle';
import { app, D, racine } from './etat';
import { afficher } from './rendu';
import { sauver } from './synchro';
import { t as tr } from '../core/i18n';

type Net = typeof import('../net/duel');
let net: Net | null = null;
const reseau = async () => (net ??= await import('../net/duel'));

/** Le duel en cours (ou l'attente de l'ami) */
export const DL: {
  session: SessionDuel | null;
  transport: Transport | null;
  /** l'ami affronté (absent : le robot), son nom, le mode, le défi et le salon */
  ami?: string;
  nomAmi?: string;
  mode: 'libre' | 'egal';
  defi?: string;
  code?: string;
  /** on attend que l'ami rejoigne le salon */
  attente: boolean;
  message: string;
  /** ce que la fin du duel a rapporté (montré sur la fenêtre de fin) */
  gain: { composants: number; eclats: number } | null;
  note: boolean;
  arreterSalon: (() => void) | null;
  /** un pillage en duel (14 novembre 2026) : le district attaqué, la traversée en cours, ce que le retour a donné */
  pillage?: { nom: string; consigne: Consigne } | null;
  traversee?: { nom: string; fin: number; revanche: boolean } | null;
  retourPillage?: J.RetourPillage | null;
} = { session: null, transport: null, mode: 'libre', attente: false, message: '', gain: null, note: false, arreterSalon: null };

/** L'écran du mode duel */
export function htmlModeDuel(): string {
  if (DL.traversee && !DL.session) return `<div class="ecran duel-traversee"></div>` + htmlTraversee(DL.traversee.nom, DL.traversee.fin - Date.now(), DL.traversee.revanche);
  const E = ecransDifferes();
  if (!E) return `<div class="ecran chargement"><p class="chargement-ecran" role="status">${tr`Chargement du duel…`}</p></div>`;
  const { htmlDuel, htmlAttenteDuel } = E;
  if (DL.session) return htmlDuel(DL.session, Date.now(), finCercle());
  const refuse = C.defisEnvoyes.find((d) => d.id === DL.defi)?.etat === 'refuse';
  return htmlAttenteDuel({ nom: DL.nomAmi ?? tr('ton ami'), code: DL.code ?? '', mode: DL.mode, message: refuse ? tr`${DL.nomAmi ?? tr('Ton ami')} a décliné le défi.` : DL.message });
}

/** Ce que la fenêtre de fin ajoute au Cercle : le gain de la semaine, la revanche */
function finCercle(): { recompense?: string; revanche?: boolean } {
  const s = DL.session;
  if (!s?.fini) return {};
  if (DL.pillage) {
    const r = DL.retourPillage;
    if (!r) return {};
    const carte = r.carte ? moduleDef(r.carte).nom : '';
    return { recompense: r.victoire
      ? tr`${r.nom} est pillé : +${r.gain} minerai${r.renom ? tr`, +${r.renom} Renom` : ''}${carte ? tr`, empreinte « ${carte} »${r.nouvelle ? tr(' (nouvelle carte !)') : ''}` : ''}.`
      : tr`${r.nom} tient bon${r.perte ? tr` : −${r.perte} minerai` : ''}${r.renom ? tr`, ${r.renom} Renom` : ''}.` };
  }
  const g = DL.gain;
  return {
    ...(g ? { recompense: tr`+${g.composants} cristaux · +${g.eclats} Éclat${g.eclats > 1 ? 's' : ''} : première victoire de la semaine contre ${DL.nomAmi}` } : {}),
    ...(DL.ami ? { revanche: true } : {}),
  };
}

/** L'escouade du joueur pour un duel, à armes égales si le mode le veut ; null + message si elle ne convient pas */
function monEscouade(mode: 'libre' | 'egal'): EscouadeDuel | null {
  let e = escouadeDuelDe(app.jeu);
  e = { ...e, nom: app.jeu.directeur?.nom || e.nom };
  if (mode === 'egal') e = J.aArmesEgales(e);
  const v = validerEscouade(e);
  if (!v.ok) {
    C.message = tr`Ton escouade active ne peut pas jouer en duel : ${v.message} Change-la dans l’onglet Escouade.`;
    return null;
  }
  return e;
}

function lancer(s: DuelEtat, camp: Camp, t: Transport, debut?: number) {
  DL.transport?.fermer?.();
  DL.transport = t;
  DL.attente = false;
  DL.gain = null;
  DL.note = false;
  DL.session = new SessionDuel(s, camp, t, rendreDuel, debut);
  app.mode = 'duel';
  rendreDuel();
}

/** Redessine l'écran du duel ; à la fin, note le résultat une seule fois */
export function rendreDuel() {
  const s = DL.session;
  if (s?.fini && !DL.note) {
    DL.note = true;
    if (DL.pillage) {
      const c = s.commun;
      const bilan = c.bilan?.[1] ?? {};
      const meilleure = Object.entries(bilan).sort((a, b) => b[1] - a[1])[0]?.[0];
      DL.retourPillage = J.finirPillageDuel(app.jeu, {
        victoire: s.gagne,
        porteurs: c.cotes[0].porteurs.map((p) => ({ id: p.id, pv: p.pv, pvMax: p.pvMax })),
        recit: { tours: Math.max(1, c.tour - 1), abattus: c.cotes[0].porteurs.filter((p) => p.pv <= 0).length, ...(meilleure ? { carte: meilleure } : {}) },
      }, Date.now());
      sauver();
      envoyerPillages();
      planifierGarnison();
    } else if (DL.ami) {
      DL.gain = J.finirDuelAmi(app.jeu, DL.ami, s.gagne, Date.now());
      sauver();
      publierVitrine();
    }
  }
  if (app.mode === 'duel') afficher();
}

/** Défier un ami : ouvre un salon, puis lui envoie le défi avec son code */
export async function defierAmi(ami: string, mode: 'libre' | 'egal') {
  const uid = app.uid;
  const a = C.amis.find((x) => x.uid === ami);
  if (!uid || !a) return;
  const e = monEscouade(mode);
  if (!e) return;
  try {
    const n = await reseau();
    const code = await n.creerSalon(uid, e);
    const defi = await envoyerDefi(ami, code, mode);
    if (!defi) { return; }
    Object.assign(DL, { ami, nomAmi: a.nom, mode, defi, code, attente: true, message: '' });
    app.mode = 'duel';
    DL.arreterSalon?.();
    DL.arreterSalon = n.ecouterSalon(code, (s) => {
      if (s?.etat === 'en-cours' && s.invite && !DL.session) {
        lancer(creerDuel(s.hote.escouade, s.invite.escouade, s.graine), 0, transportEnLigne(n, code, uid, 0, signaler), s.debut);
      }
      if (s?.etat === 'fini' && DL.session && !DL.session.fini && s.abandon === 1) DL.session.adversaireParti();
    });
    afficher();
  } catch (err) {
    C.message = (err as Error).message || tr('Le duel n’a pas pu s’ouvrir.');
    afficher();
  }
}

/** Accepter un défi reçu : rejoindre le salon de l'ami */
export async function accepterDefi(id: string) {
  const uid = app.uid;
  const d = C.defisRecus.find((x) => x.id === id);
  if (!uid || !d) return;
  const e = monEscouade(d.mode);
  if (!e) { afficher(); return; }
  try {
    const n = await reseau();
    const s = await n.rejoindreSalon(d.code, uid, e);
    Object.assign(DL, { ami: d.de, nomAmi: d.nomDe, mode: d.mode, defi: id, code: s.code, message: '' });
    marquerDefi(id, 'accepte');
    lancer(creerDuel(s.hote.escouade, s.invite!.escouade, s.graine), 1, transportEnLigne(n, s.code, uid, 1, signaler), s.debut);
    DL.arreterSalon?.();
    DL.arreterSalon = n.ecouterSalon(s.code, (x) => { if (x?.etat === 'fini' && DL.session && !DL.session.fini && x.abandon === 0) DL.session.adversaireParti(); });
  } catch (err) {
    C.message = (err as Error).message || tr('Ce défi n’est plus valable.');
    marquerDefi(id, 'refuse');
    afficher();
  }
}

/** S'échauffer contre le robot : sa propre escouade face à elle-même, rien à gagner */
export function duelRobot() {
  const e = monEscouade('libre');
  if (!e) { afficher(); return; }
  Object.assign(DL, { ami: undefined, nomAmi: undefined, defi: undefined, code: undefined, mode: 'libre', message: '' });
  lancer(creerDuel(e, { ...e, nom: tr('Robot d’entraînement') }, graineDuel()), 0, transportRobot(1));
}

/**
 * Piller un directeur (14 novembre 2026) : la barque traverse quelques secondes, puis le duel s'ouvre contre sa vraie escouade,
 * jouée par le robot selon sa consigne. La fin du duel règle le pillage (rendreDuel).
 */
/** Le robot du défenseur, et chaque choix de l'attaquant gardé dans la partie dès qu'il est verrouillé */
function transportPillage(consigne: Consigne): Transport {
  const t = transportRobot(1, undefined, consigne);
  const envoyer = t.envoyer.bind(t);
  t.envoyer = (tour, choix) => { J.noterChoixDuel(app.jeu, tour, choix); sauver(); envoyer(tour, choix); };
  return t;
}

/** Un duel de pillage gardé dans la partie, sans session ouverte (page rechargée) : on le rejoue et on le reprend. Vrai si repris */
export function reprendrePillage(): boolean {
  const pi = J.etatPillage(app.jeu).enCours;
  if (!pi?.duel || DL.session || DL.traversee) return false;
  const s = J.rejouerDuel(app.jeu);
  if (!s) return false;
  Object.assign(DL, { ami: undefined, nomAmi: undefined, defi: undefined, code: undefined, mode: 'libre', message: '', retourPillage: null });
  DL.pillage = { nom: pi.nom, consigne: pi.duel.depart.consigne };
  lancer(s, 0, transportPillage(pi.duel.depart.consigne));
  return true;
}

export function lancerPillage(depart: J.DepartDuel, revanche = false) {
  Object.assign(DL, { ami: undefined, nomAmi: undefined, defi: undefined, code: undefined, mode: 'libre', message: '', retourPillage: null });
  DL.pillage = { nom: depart.defense.nom, consigne: depart.consigne };
  DL.traversee = { nom: depart.defense.nom, fin: Date.now() + depart.secondes * 1000, revanche };
  app.mode = 'duel';
  afficher();
  setTimeout(() => {
    if (!DL.pillage || DL.session) return;
    DL.traversee = null;
    lancer(creerDuel(depart.attaque, depart.defense, depart.graine), 0, transportPillage(depart.consigne));
  }, depart.secondes * 1000);
}

/** La revanche : le même ami, le même mode */
export async function revanche() {
  const ami = DL.ami, mode = DL.mode;
  quitterDuel();
  if (ami) await defierAmi(ami, mode);
}

/** Quitter l'écran du duel (fin, ou attente annulée) et revenir au Cercle */
export function quitterDuel() {
  if (DL.pillage) {
    DL.transport?.fermer?.();
    DL.session = null; DL.transport = null; DL.pillage = null; DL.traversee = null; DL.retourPillage = null; DL.message = '';
    app.mode = 'district';
    D.vue = 'pillages';
    D.voletPort = 'pillages';
    afficher();
    return;
  }
  DL.transport?.fermer?.();
  DL.arreterSalon?.();
  DL.arreterSalon = null;
  // un défi jamais joué : on le retire
  if (DL.attente && DL.defi) import('../net/cercle').then((n) => n.effacerDefi(DL.defi!)).catch(() => {});
  DL.session = null; DL.transport = null; DL.attente = false; DL.message = '';
  app.mode = 'district';
  D.vue = 'cercle';
  C.onglet = 'duels';
  afficher();
}

function signaler(message: string) {
  DL.message = message;
  if (!DL.session) afficher();
}

// abandonner : un second toucher dans les 3 secondes
let quitterArme = 0;
export function confirmerAbandon(): boolean {
  if (Date.now() - quitterArme < 3000) return true;
  quitterArme = Date.now();
  const b = racine.querySelector('.dl-quitter');
  if (b) b.textContent = tr('Toucher encore pour abandonner');
  return false;
}

// le chrono : seul lui change chaque seconde (redessiner tout l'écran ferait perdre un toucher tombé pile à ce moment-là)
let absentAffiche = false;
setInterval(() => {
  const s = DL.session;
  if (app.mode !== 'duel' || !s || s.fini) return;
  const avant = s.verrouille;
  s.tick();
  if (s.verrouille !== avant) return;
  if (s.absent() !== absentAffiche) { absentAffiche = s.absent(); afficher(); return; }
  const c = racine.querySelector<HTMLElement>('.dl-chrono');
  if (!c || s.verrouille) return;
  const r = s.restant();
  c.style.setProperty('--p', `${(r / DUEL.chrono) * 100}%`);
  c.classList.toggle('urgent', r <= 5);
  c.setAttribute('aria-label', `${r} secondes`);
  const b = c.querySelector('b');
  if (b) b.textContent = String(r);
}, 1000);
