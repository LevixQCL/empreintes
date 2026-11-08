// La sauvegarde : sur l'appareil, puis sur le compte quand on est connecté (la partie la plus avancée gagne, l'autre est gardée en secours).

import * as J from '../core/jeu';
import { CLE_PARTIE, charger, enregistrer, garderSecours, lireSecours, stockeeIllisible, stockeeTropRecente, type Enveloppe } from '../save/local';
import { bloquerSauvegarde, reprendreSauvegarde, sauvegardeBloquee, suspendreSauvegarde } from './garde';
import { firebaseActif } from '../net/firebase-config';
import { effacerAppareil, enLignePermis } from '../save/age';
import { finPour } from './combat';
import { app, compteEtat, compteProtege, D, G, K, racine } from './etat';
import { afficher } from './rendu';
import { lireMonEntree, planifierPublication } from './tableau';
import { envoyerPillages, planifierGarnison, recevoirPillages } from './pillages';
import { envoyerAssauts, recevoirAssauts } from './fleche';
import { arreterCercle, C, suivreCercle } from './cercle';

let minuteur: number | undefined;
/** la partie à envoyer au compte (la plus récente), et quand on l'a envoyée la dernière fois */
let enAttente: Enveloppe | null = null;
let derniereEcriture = 0;

/** L'appareil garde la partie à chaque geste ; le compte en ligne la reçoit au plus une fois par minute
 *  (une écriture par geste viderait vite le quota gratuit de Firebase), et tout de suite quand on quitte le jeu */
const ECRIRE_APRES = 60_000;

/** la sauvegarde du compte a été lue et comparée : avant ça, on n'envoie rien (on écraserait une partie plus avancée) */
let reconcilie = false;
/** le jeton de la dernière écriture lue ou faite sur le compte par cet appareil (undefined : pas encore lu ; null : compte vide) */
let jetonDistant: number | null | undefined;

// une version plus récente du jeu a déjà sauvegardé sur cet appareil (onglet resté ouvert sur une ancienne version) : on n'écrit plus
if (stockeeTropRecente()) bloquerSauvegarde('version');
// une partie présente mais illisible par cette version : on n'écrit rien, ni ici ni sur le compte (4 novembre 2026)
else if (stockeeIllisible()) bloquerSauvegarde('illisible');
// un seul onglet écrit la partie : le dernier ouvert. En s'ouvrant, il prévient les autres, qui s'arrêtent
// (sans ça, deux onglets s'écrasaient l'un l'autre à chaque seconde). Sans BroadcastChannel : l'écriture d'un autre onglet suffit.
/** gardé au niveau du module : un canal sans référence peut être ramassé par le navigateur et ne plus rien entendre */
let canal: BroadcastChannel | null = null;
if (typeof BroadcastChannel !== 'undefined') {
  canal = new BroadcastChannel('empreintes.partie');
  canal.onmessage = (ev) => { if ((ev.data as { type?: string })?.type === 'ouvert') bloquerSauvegarde('onglet'); };
  canal.postMessage({ type: 'ouvert' });
} else addEventListener('storage', (ev) => { if (ev.key === CLE_PARTIE && ev.newValue !== null) bloquerSauvegarde('onglet'); });

export function sauver() {
  if (sauvegardeBloquee()) return;
  if (stockeeTropRecente()) { bloquerSauvegarde('version'); return; }
  const env = enregistrer(app.jeu);
  // le joueur vient de commencer (intro vue) : le compte invisible est créé maintenant, pas à la simple visite
  // (pas si le joueur a dit avoir moins de 13 ans : sa partie reste sur l'appareil)
  if (app.compte && !compteEtat.utilisateur && compteEtat.pret && app.jeu.introVue && enLignePermis()) app.compte.creerInvisible();
  if (app.compte && app.uid && reconcilie) {
    enAttente = env;
    if (minuteur === undefined) minuteur = window.setTimeout(envoyer, Math.max(1500, derniereEcriture + ECRIRE_APRES - Date.now()));
    planifierPublication();
    planifierGarnison();
  }
}

/** Relit la partie de secours pour le panneau Compte (seulement quand il s'ouvre ou que le secours change) */
export function majSecours() {
  const s = lireSecours();
  compteEtat.secours = s ? { strate: s.data.strate, le: s.updatedAt, actuelle: app.jeu.strate, confirmer: false } : null;
}

/** Échange la partie en cours et la partie de secours : rien n'est perdu, on peut revenir en arrière */
export function restaurerSecours() {
  if (sauvegardeBloquee()) return;
  const s = lireSecours();
  if (!s) return;
  garderSecours({ data: app.jeu, updatedAt: Date.now() });
  app.jeu = s.data;
  J.tick(app.jeu, Date.now());
  sauver();
  majSecours();
  compteEtat.info = `Partie de secours restaurée : Strate −${app.jeu.strate}.`;
  D.message = compteEtat.info;
  app.mode = app.jeu.expedition ? 'combat' : 'district';
  K.etat = null;
  K.fin = finPour();
}

/** Envoie tout de suite la partie en attente (le joueur quitte le jeu ou passe à une autre application) */
export async function envoyer() {
  clearTimeout(minuteur);
  minuteur = undefined;
  const env = enAttente;
  enAttente = null;
  if (env) await pousser(env);
}

async function pousser(env: Enveloppe) {
  if (!app.compte || !app.uid || sauvegardeBloquee()) return;
  const uid = app.uid;
  compteEtat.synchro = 'en-cours';
  derniereEcriture = Date.now();
  try {
    const jeton = await app.compte.ecrireDistante(uid, env, jetonDistant);
    if (app.uid === uid) jetonDistant = jeton;
    compteEtat.synchro = 'ok';
    compteEtat.codeErreur = '';
  } catch (e) {
    if (e instanceof app.compte.RefusEcriture) {
      // une version plus récente, ou un autre appareil a écrit entre-temps : on n'écrase rien, le joueur recharge
      bloquerSauvegarde(e.code === 'trop-recente' ? 'version' : 'appareil');
      compteEtat.synchro = 'aucune';
      return;
    }
    compteEtat.synchro = 'erreur';
    compteEtat.codeErreur = 'écriture : ' + ((e as { code?: string })?.code ?? String(e).slice(0, 60));
    console.warn('Synchronisation', e);
    // hors ligne ou réseau lent : la partie repartira à la prochaine occasion (avant, elle attendait le geste suivant)
    if (app.uid === uid && !enAttente) {
      enAttente = env;
      if (minuteur === undefined) minuteur = window.setTimeout(envoyer, ECRIRE_APRES);
    }
  }
  if (compteEtat.ouvert && app.mode === 'district') afficher();
}

async function reconcilier() {
  if (!app.compte || !app.uid) return;
  try {
    const lue = await app.compte.lireDistante(app.uid);
    if (lue.tropRecente) { bloquerSauvegarde('version'); return; }
    if (lue.illisible) { bloquerSauvegarde('illisible-compte'); return; }
    jetonDistant = lue.jeton;
    const distante = lue.env;
    const locale = charger();
    // garder la partie la plus AVANCÉE (pas la plus récente) : une partie neuve ouverte sur un autre appareil
    // ne doit jamais écraser celle du compte ; à avancement égal, la plus récente. L'autre est gardée en secours.
    const cmp = distante && locale ? J.compareAvancement(distante.data, locale.data) : 0;
    const prendreDistante = !!distante && (!locale || cmp > 0 || (cmp === 0 && distante.updatedAt > locale.updatedAt));
    if (prendreDistante && distante) {
      if (locale) { garderSecours(locale); majSecours(); }
      enregistrer(distante.data, Math.max(distante.updatedAt, Date.now()));
      app.jeu = distante.data;
      J.tick(app.jeu, Date.now());
      compteEtat.info = 'Progression du compte chargée.';
      D.message = `Progression du compte chargée : Strate −${app.jeu.strate}.`;
      app.mode = app.mode === 'titre' || app.mode === 'intro' ? app.mode : app.jeu.expedition ? 'combat' : 'district';
      K.etat = null;
      K.fin = finPour();
      afficher();
    } else if (locale) {
      if (distante && cmp < 0) { garderSecours(distante); majSecours(); }
      await pousser(locale);
    }
    reconcilie = !sauvegardeBloquee();
  } catch (e) {
    compteEtat.synchro = 'erreur';
    compteEtat.codeErreur = 'lecture : ' + ((e as { code?: string })?.code ?? String(e).slice(0, 60));
    console.warn('Synchronisation', e);
  }
}

/** Le compte est prêt : l'écran titre peut ouvrir la partie */
function comptePret() {
  if (compteEtat.pret) return;
  compteEtat.pret = true;
  if (app.mode === 'titre') afficher();
}

/** au-delà, l'écran titre ouvre la partie de l'appareil (hors ligne, réseau lent) ; celle du compte la remplacera si elle arrive */
const ATTENTE_COMPTE = 8000;

export async function demarrerCompte() {
  if (!firebaseActif()) return;
  // un navigateur piloté (tests, captures automatiques) ne crée pas de compte et n'écrit rien dans les vraies données
  if (navigator.webdriver) { comptePret(); return; }
  window.setTimeout(() => { if (!compteEtat.pret) { compteEtat.info = 'Hors ligne : partie de cet appareil.'; comptePret(); } }, ATTENTE_COMPTE);
  try {
    app.compte = await import('../net/compte');
  } catch {
    comptePret();
    return;
  }
  app.compte.surChangement((u) => {
    compteEtat.utilisateur = u;
    app.uid = u?.uid ?? null;
    compteEtat.synchro = 'aucune';
    G.entrees = []; G.lu = 0; G.etat = 'repos'; app.monEntree = null; app.monEntreeLue = false; reconcilie = false; jetonDistant = undefined;
    // une partie en attente pour l'ancien compte ne part pas sur le nouveau (la réconciliation s'en charge)
    clearTimeout(minuteur); minuteur = undefined; enAttente = null;
    if (app.uid) {
      // à la connexion (ou au premier lancement connecté), le jeu demande un pseudo s'il n'y en a pas encore,
      // après avoir récupéré la sauvegarde du compte : elle en a peut-être déjà un
      reconcilier().then(() => {
        // connecté depuis l'écran titre : le panneau se referme, « Reprendre » ouvre la partie du compte
        if (app.mode === 'titre') compteEtat.ouvert = false;
        comptePret();
        // les pillages : attaques subies pendant l'absence, pillages pas encore envoyés, garnison à jour
        if (reconcilie) recevoirPillages().then((change) => { if (change) sauver(); envoyerPillages(); planifierGarnison(); });
        // la Flèche : assauts subis sur son quai, assauts pas encore envoyés, garde à jour
        if (reconcilie) recevoirAssauts().then((change) => { if (change) sauver(); envoyerAssauts(); });
        // le Cercle des quais : amis, propositions et défis en attente (la bulle du bâtiment), vitrine à jour
        if (reconcilie) suivreCercle();
        // une recrue sans compte protégé se voit aussi proposer un pseudo, une fois, après l'accueil du district (3 novembre 2026)
        if (app.uid && (compteProtege() || (app.jeu.accueilVu && !app.jeu.pseudoPropose)) && !app.jeu.directeur?.nom && !app.pseudoDemande) { app.pseudoDemande = true; app.jeu.pseudoPropose = true; G.edition = true; G.accueil = true; G.erreur = ''; if (app.mode === 'district') afficher(); }
      });
      lireMonEntree();
    } else { comptePret(); arreterCercle(); C.reseau = 'hors-ligne'; }
    if (app.mode === 'district' || app.mode === 'titre') afficher();
  }, () => app.jeu.introVue);
}

// ---------- Actions ----------

export const champ = (id: string) => ((racine.querySelector('#' + id) as HTMLInputElement | null)?.value ?? '').trim();

/**
 * Supprimer son compte (8 novembre 2026) : tout ce qu'il a publié en ligne, puis le compte, puis la partie de cet appareil.
 * La sauvegarde est bloquée pendant ce temps (rien ne doit repartir en ligne), et le jeu se recharge à zéro.
 */
export async function supprimerCompte() {
  const n = app.compte;
  if (!n) return;
  compteEtat.occupe = true; compteEtat.erreur = '';
  afficher();
  try {
    const nom = app.jeu.directeur?.nom;
    const { clePseudo } = await import('../core/classements');
    suspendreSauvegarde();
    await n.supprimerCompte(nom ? clePseudo(nom) : null, app.jeu.parrainage?.code ?? null);
    effacerAppareil();
    location.reload();
    return;
  } catch (e) {
    reprendreSauvegarde();
    compteEtat.erreur = e instanceof n.ReconnexionRequise
      ? 'Par sécurité, Google demande une connexion récente : touche « Se déconnecter », reconnecte-toi, puis supprime ton compte tout de suite après.'
      : n.messageErreur(e);
  }
  compteEtat.occupe = false;
  compteEtat.supprimer = 0;
  afficher();
}

export async function actionCompte(f: () => Promise<void>) {
  if (!app.compte) return;
  compteEtat.occupe = true;
  compteEtat.erreur = '';
  afficher();
  try {
    // la dernière progression part sur le compte actuel avant d'en changer
    await envoyer();
    await f();
  } catch (e) {
    compteEtat.erreur = app.compte.messageErreur(e);
  }
  compteEtat.occupe = false;
  afficher();
}
