import './ui/styles.css';
import * as C from './core/combat';
import { combatSuivant, nouvelleExpedition, type Expedition } from './core/expedition';
import { ennemiDef } from './core/donnees';
import type { Evenement, Pas } from './core/types';
import { charger, enregistrer, type Enveloppe } from './save/local';
import { firebaseActif } from './net/firebase-config';
import { rendre, type Ecran, type Fin } from './ui/vue';

const racine = document.getElementById('app') as HTMLElement;
const reduit = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const pause = (ms: number) => new Promise((r) => setTimeout(r, reduit ? Math.min(ms, 120) : ms));

const sauvegarde = charger();
const x0: Expedition = sauvegarde?.data ?? nouvelleExpedition();

const E: Ecran = {
  x: x0,
  etat: x0.combat,
  verrou: false,
  regles: !sauvegarde,
  pops: [],
  fin: null,
  compte: { actif: firebaseActif(), ouvert: false, utilisateur: null, occupe: false, erreur: '', info: '', synchro: 'aucune' },
};

const afficher = () => rendre(racine, E);

// ---------- Sauvegarde ----------

let compte: typeof import('./net/compte') | null = null;
let uid: string | null = null;
let minuteur: number | undefined;

function sauver() {
  const env = enregistrer(E.x);
  if (compte && uid) {
    clearTimeout(minuteur);
    minuteur = window.setTimeout(() => pousser(env), 1500);
  }
}

async function pousser(env: Enveloppe) {
  if (!compte || !uid) return;
  E.compte.synchro = 'en-cours';
  try {
    await compte.ecrireDistante(uid, env);
    E.compte.synchro = 'ok';
  } catch {
    E.compte.synchro = 'erreur';
  }
  if (E.compte.ouvert && !E.verrou) afficher();
}

/** À la connexion : on garde la sauvegarde la plus récente entre l'appareil et le compte */
async function reconcilier() {
  if (!compte || !uid) return;
  try {
    const distante = await compte.lireDistante(uid);
    const locale = charger();
    if (distante && (!locale || distante.updatedAt > locale.updatedAt)) {
      enregistrer(distante.data, distante.updatedAt);
      E.x = distante.data;
      E.etat = E.x.combat;
      E.fin = finPour(E.x);
      E.compte.info = 'Progression du compte chargée.';
      afficher();
    } else if (locale) {
      await pousser(locale);
    }
  } catch {
    E.compte.synchro = 'erreur';
  }
}

async function demarrerCompte() {
  if (!firebaseActif()) return;
  compte = await import('./net/compte');
  compte.surChangement((u) => {
    E.compte.utilisateur = u;
    uid = u?.uid ?? null;
    E.compte.synchro = 'aucune';
    if (uid) reconcilier();
    afficher();
  });
}

// ---------- Fin de combat ----------

function finPour(x: Expedition): Fin | null {
  const s = x.combat;
  if (s.issue === 'defaite') {
    return { titre: 'Défaite', texte: 'Toute l’escouade est à terre. Fais tourner tes Porteurs, garde du bouclier pour les grosses attaques annoncées, et vise les suites.', bouton: 'Recommencer', action: 'recommencer' };
  }
  if (s.issue === 'victoire') {
    if (x.index >= x.sequence.length - 1) {
      return { titre: `${ennemiDef(s.ennemi.id).nom} se disperse`, texte: 'Strate terminée : trois combats remportés. La suite arrivera avec le district.', bouton: 'Rejouer', action: 'recommencer' };
    }
    return { titre: 'Victoire', texte: `Le ${ennemiDef(s.ennemi.id).nom} se dissipe. Ton escouade souffle un peu (+50 % de PV) avant de descendre plus bas.`, bouton: 'Combat suivant', action: 'suivant' };
  }
  return null;
}

// ---------- Animation ----------

let idPop = 0;
function pop(cible: string, texte: string, couleur: string) {
  const id = ++idPop;
  E.pops.push({ id, cible, texte, couleur });
  setTimeout(() => {
    E.pops = E.pops.filter((p) => p.id !== id);
    afficher();
  }, 900);
}

function popsDe(ev: Evenement) {
  if (ev.kind === 'degats') pop(ev.cible, ev.net ? `−${ev.net}` : 'bloqué', 'var(--danger)');
  else if (ev.kind === 'bouclier') pop(ev.cible, `+${ev.v}`, 'var(--ivory)');
  else if (ev.kind === 'soin' && ev.v) pop(ev.cible, `+${ev.v}`, 'var(--bio)');
  else if (ev.kind === 'echo') pop('escouade', 'Écho', 'var(--gold)');
}

async function jouer(pas: Pas[]) {
  E.verrou = true;
  for (const p of pas) {
    await pause(p.ev.kind === 'resonance' ? 250 : 380);
    E.etat = p.etat;
    popsDe(p.ev);
    afficher();
  }
  await pause(300);
  E.etat = E.x.combat;
  E.fin = finPour(E.x);
  E.verrou = false;
  sauver();
  afficher();
}

// ---------- Actions ----------

racine.addEventListener('click', async (ev) => {
  const b = (ev.target as HTMLElement).closest<HTMLButtonElement>('[data-action]');
  if (!b || b.disabled) return;
  const s = E.x.combat;
  const uidGeste = b.dataset.uid ?? '';
  switch (b.dataset.action) {
    case 'ajouter': if (!E.verrou) { C.ajouter(s, uidGeste); sauver(); } break;
    case 'retirer': if (!E.verrou) { C.retirer(s, uidGeste); sauver(); } break;
    case 'vider': if (!E.verrou) { C.viderChaine(s); sauver(); } break;
    case 'allonger': if (!E.verrou) { C.allonger(s); sauver(); } break;
    case 'repiocher': if (!E.verrou) { C.repiocher(s); sauver(); } break;
    case 'lancer': if (!E.verrou) { await jouer(C.lancer(s)); return; } break;
    case 'regles': E.regles = !E.regles; break;
    case 'suivant': E.x = combatSuivant(E.x); E.etat = E.x.combat; E.fin = null; sauver(); break;
    case 'recommencer': E.x = nouvelleExpedition(); E.etat = E.x.combat; E.fin = null; sauver(); break;
    case 'compte': E.compte.ouvert = !E.compte.ouvert; E.compte.erreur = ''; E.compte.info = ''; break;
    case 'google': await actionCompte(() => compte!.connexionGoogle()); return;
    case 'connexion': await actionCompte(() => compte!.connexionEmail(champ('email'), champ('mdp'), false)); return;
    case 'inscription': await actionCompte(() => compte!.connexionEmail(champ('email'), champ('mdp'), true)); return;
    case 'oubli': await actionCompte(async () => { await compte!.motDePasseOublie(champ('email')); E.compte.info = 'E-mail de réinitialisation envoyé.'; }); return;
    case 'deconnexion': await actionCompte(() => compte!.deconnexion()); return;
  }
  E.etat = E.x.combat;
  afficher();
});

const champ = (id: string) => ((racine.querySelector('#' + id) as HTMLInputElement | null)?.value ?? '').trim();

async function actionCompte(f: () => Promise<void>) {
  if (!compte) return;
  E.compte.occupe = true;
  E.compte.erreur = '';
  afficher();
  try {
    await f();
  } catch (e) {
    E.compte.erreur = compte.messageErreur(e);
  }
  E.compte.occupe = false;
  afficher();
}

E.fin = finPour(E.x);
afficher();
demarrerCompte();
