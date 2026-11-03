// duel.html : la page d'essai du duel en temps réel (3 novembre 2026). Jamais chargée par le jeu, aucun lien vers elle :
// on y joue contre le robot, ou contre un ami avec un code. Le jour du branchement, l'écran (src/ui/duel.ts) et la session
// (src/duel/session.ts) passent dans le jeu tels quels ; seul ce fichier reste ici.

import '../ui/feuilles';
import '../ui/duel.css';
import { creerDuel, escouadeDepart, graineDuel, validerEscouade, type Camp, type EscouadeDuel } from '../core/duel';
import { escouadeDuelDe } from '../core/duel-escouade';
import { charger } from '../save/local';
import { firebaseActif } from '../net/firebase-config';
import { htmlDuel, htmlSalon } from '../ui/duel';
import { loupe } from '../ui/vue';
import { SessionDuel, transportRobot, type Transport } from './session';
import { transportEnLigne } from './en-ligne';

const racine = document.getElementById('app') as HTMLElement;

// l'escouade : celle de la partie de cet appareil, sinon l'escouade de départ
function monEscouade(): { e: EscouadeDuel; source: string } {
  const env = charger();
  if (env) {
    const e = escouadeDuelDe(env.data);
    if (validerEscouade(e).ok) return { e, source: 'ton escouade active' };
  }
  return { e: escouadeDepart('Directeur'), source: 'escouade de départ (aucune partie sur cet appareil)' };
}
const { e: escouade, source } = monEscouade();

type Net = typeof import('../net/duel');
let net: Net | null = null;
let uid: string | null = null;
let session: SessionDuel | null = null;
let transport: Transport | null = null;
let salon: { code?: string; attente?: boolean; message?: string } = {};
let arreterSalon: (() => void) | null = null;

function rendre() {
  racine.innerHTML = session ? htmlDuel(session) : htmlSalon({ nom: escouade.nom, source, enLigne: !!uid, ...salon });
}

function lancer(s: ReturnType<typeof creerDuel>, camp: Camp, t: Transport, debut?: number) {
  transport?.fermer?.();
  transport = t;
  session = new SessionDuel(s, camp, t, rendre, debut);
  rendre();
}

function retour() {
  transport?.fermer?.();
  arreterSalon?.();
  transport = null;
  session = null;
  arreterSalon = null;
  salon = {};
  rendre();
}

// ---------- Les gestes ----------

racine.addEventListener('click', (ev) => {
  const el = (ev.target as HTMLElement).closest<HTMLElement>('[data-action]');
  if (!el || el.tagName === 'FORM') return;
  const a = el.dataset.action!;
  const s = session;
  if (a === 'duel-robot') {
    const adverse: EscouadeDuel = { ...escouade, nom: 'Robot d’entraînement' };
    lancer(creerDuel(escouade, adverse, graineDuel()), 0, transportRobot(1));
  } else if (a === 'duel-creer') creerSalonEnLigne();
  else if (a === 'duel-retour') retour();
  else if (!s) return;
  else if (a === 'duel-poser') s.poser(el.dataset.uid!);
  else if (a === 'duel-reprendre') s.reprendre(el.dataset.uid!);
  else if (a === 'duel-viser') s.viser(el.dataset.porteur!);
  else if (a === 'duel-soigner') {
    const soin = [...s.brouillon.cotes[s.camp].chaine].reverse().find((g) => g.type === 'soin');
    if (soin) s.soigner(soin.uid, el.dataset.porteur!);
  } else if (a === 'duel-allonger') s.allonger();
  else if (a === 'duel-repiocher') s.repiocher();
  else if (a === 'duel-verrouiller') s.verrouiller();
  else if (a === 'duel-reclamer') s.reclamer();
  else if (a === 'duel-quitter') { if (confirmerQuitter()) s.quitter(); }
});

// abandonner : un second toucher dans les 3 secondes (pas de fenêtre du navigateur)
let quitterArme = 0;
function confirmerQuitter(): boolean {
  if (Date.now() - quitterArme < 3000) return true;
  quitterArme = Date.now();
  const b = racine.querySelector('.dl-quitter');
  if (b) b.textContent = 'Toucher encore pour abandonner';
  return false;
}

racine.addEventListener('submit', (ev) => {
  ev.preventDefault();
  const code = String(new FormData(ev.target as HTMLFormElement).get('code') ?? '').trim().toUpperCase();
  if (code.length === 6) rejoindreSalonEnLigne(code);
});

// la loupe : un appui long sur une carte la montre en grand
let appui: ReturnType<typeof setTimeout> | undefined;
racine.addEventListener('pointerdown', (ev) => {
  const el = (ev.target as HTMLElement).closest<HTMLElement>('.geste[data-uid]');
  if (!el) return;
  appui = setTimeout(() => {
    const h = loupe(el.dataset.uid!);
    if (!h) return;
    document.body.insertAdjacentHTML('beforeend', h);
    const fermer = () => { document.querySelector('.loupe')?.remove(); window.removeEventListener('pointerup', fermer); };
    window.addEventListener('pointerup', fermer);
    el.addEventListener('click', (e) => { e.stopPropagation(); e.preventDefault(); }, { once: true, capture: true });
  }, 450);
});
for (const t of ['pointerup', 'pointercancel', 'pointerleave']) racine.addEventListener(t, () => clearTimeout(appui));

// le chrono : une seconde à la fois
setInterval(() => { if (session && !session.fini) { session.tick(); rendre(); } }, 1000);

// ---------- En ligne ----------

async function connecter() {
  if (!firebaseActif()) { rendre(); return; }
  const compte = await import('../net/compte');
  compte.surChangement((u) => { uid = u?.uid ?? null; rendre(); }, () => true);
  net = await import('../net/duel');
}

async function creerSalonEnLigne() {
  if (!net || !uid) return;
  try {
    const code = await net.creerSalon(uid, escouade);
    salon = { code, attente: true };
    rendre();
    arreterSalon = net.ecouterSalon(code, (s) => {
      if (s?.etat === 'en-cours' && s.invite && !session) {
        lancer(creerDuel(s.hote.escouade, s.invite.escouade, s.graine), 0, transportEnLigne(net!, code, uid!, 0, signaler), s.debut);
      }
      if (s?.etat === 'fini' && session && !session.fini && s.abandon === 1) session.adversaireParti();
    });
  } catch (e) { salon = { message: (e as Error).message }; rendre(); }
}

async function rejoindreSalonEnLigne(code: string) {
  if (!net || !uid) return;
  try {
    const s = await net.rejoindreSalon(code, uid, escouade);
    lancer(creerDuel(s.hote.escouade, s.invite!.escouade, s.graine), 1, transportEnLigne(net, s.code, uid, 1, signaler), s.debut);
    arreterSalon = net.ecouterSalon(s.code, (x) => { if (x?.etat === 'fini' && session && !session.fini && x.abandon === 0) session.adversaireParti(); });
  } catch (e) { salon = { message: (e as Error).message }; rendre(); }
}

function signaler(message: string) {
  salon = { ...salon, message };
  if (!session) rendre();
}

rendre();
connecter();
