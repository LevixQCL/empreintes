import './ui/styles.css';
import './ui/scenes.css';
import './ui/face-carte.css';
import './ui/holo.css';
import './ui/combat.css';
import './ui/cristal.css';
import './ui/bureau.css';
import './ui/exploration.css';
import './ui/guide.css';
import './ui/porteurs.css';
import './ui/batiment.css';
import './ui/escouade.css';
import './ui/ecrans.css';
import * as C from './core/combat';
import { decouverteEnAttente } from './core/decouvertes';
import { ennemiDef, moduleDef, porteurDef } from './core/donnees';
import * as J from './core/jeu';
import type { BatimentId, CombatEtat, Evenement, Pas } from './core/types';
import { charger, enregistrer, type Enveloppe } from './save/local';
import { firebaseActif } from './net/firebase-config';
import { htmlCombat, type Ecran as EcranCombat, type Fin, type Compte } from './ui/vue';
import { ETAPES, htmlBriefing } from './ui/briefing';
import { brancherTableau, htmlArchipel, htmlCartes, htmlCodex, htmlCoupe, htmlEscouade, htmlRencontre, type EcranDistrict, NB_REPLIQUES } from './ui/district';
import { htmlPorteurs } from './ui/porteurs';
import { PLANS, htmlIntro } from './ui/intro';
import { animerCompteur, majIntro, precharger } from './ui/intro-lecteur';
import { htmlTitre } from './ui/titre';
import { htmlExploration } from './ui/exploration';
import { basculerSon, debloquerSon, impact, initImpacts } from './ui/impact';
import { glisser, horloge, initToucher, noter, vibrer } from './ui/toucher';
import './ui/toucher.css';
import './ui/matieres.css';
import { activerCartes } from './ui/carte';
import { NOMS_RARETE } from './core/collection';
import { trouveesDe, type OngletGuide } from './ui/guide';
import { comparer, montrer, relever } from './ui/gains';
import { initInstallation, installer } from './ui/installer';
import './ui/gains.css';
import './ui/rail.css';
import './ui/panneau-district.css';
import './ui/classements.css';
import { htmlClassements, tableauVide, type GrandTableau } from './ui/classements';
import { DELAI_PSEUDO, TABLEAUX, aChange, clePseudo, entreeAPublier, nettoyerNom, nomValide, pseudoInterdit, type Entree, type Periode, type TableauId } from './core/classements';

const racine = document.getElementById('app') as HTMLElement;
const reduit = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
initToucher(racine, reduit);
const pause = (ms: number) => new Promise((r) => setTimeout(r, reduit ? Math.min(ms, 120) : ms));

// ---------- État ----------

const sauvegarde = charger();
let jeu: J.Jeu = sauvegarde?.data ?? J.nouveauJeu(Date.now());
const absence = Date.now() - jeu.dernierTick;
const avantAbsence: J.Jeu = structuredClone(jeu);
const nouvellesAbsence = J.tick(jeu, Date.now());
/** résumé « Pendant ton absence », seulement après plus de 10 minutes */
const retourInitial = sauvegarde && absence > 10 * 60_000 && jeu.introVue ? J.resumeAbsence(avantAbsence, jeu, nouvellesAbsence) : [];

type Mode = 'titre' | 'intro' | 'district' | 'combat';
/** l'écran titre s'affiche à chaque lancement */
let mode: Mode = 'titre';
const apresTitre = (): Mode => !jeu.introVue ? 'intro' : jeu.expedition ? 'combat' : 'district';
let plan = 0;
let lignesVues = 1;
/** intro : texte masqué pour admirer l'illustration */
let texteCache = false;

const compteEtat: Compte = { actif: firebaseActif(), ouvert: false, utilisateur: null, occupe: false, erreur: '', info: '', synchro: 'aucune' };
const D: EcranDistrict = { j: jeu, vue: 'archipel', selection: null, escouade: [], strateChoisie: 1, message: '', compte: compteEtat, now: Date.now(), retour: retourInitial, menu: false, carte: null, deck: null, porteur: null, filtre: 'tout', onglet: 'chroniques', chapitre: null, retourBiblio: 'archipel', bulles: 0, etape: 0, fouille: null, epreuve: null, guide: null };
/** le Grand Tableau : lecture des classements en ligne, et ce qu'on a publié */
const G: GrandTableau = tableauVide();
try { D.panneauReplie = localStorage.getItem('empreintes.panneau') !== 'ouvert'; } catch { D.panneauReplie = true; }
D.grand = G;
const K: { verrou: boolean; regles: boolean; fuite: boolean; guide: OngletGuide | null; pops: EcranCombat['pops']; fin: Fin | null; etat: CombatEtat | null; traces: Record<string, number>; actif?: number; decouverteTour?: string; decouverteId?: string } = {
  verrou: false, regles: false, fuite: false, guide: null, pops: [], fin: null, etat: null, traces: {},
};

// ---------- Rendu ----------

/** zones qui défilent toutes seules : on garde leur position d'un rendu à l'autre (le district se redessine chaque seconde) */
const DEFILANTS = ['.feuille-corps', '.rangee', '.main', '.rail', '.fb-rangee', '.cl-filtres', '.es-cibles'];
/** une feuille, une fenêtre ou un message ne s'animent qu'à leur apparition */
function cles(): Record<string, string> {
  const t = (sel: string) => racine.querySelector(sel)?.querySelector('h2')?.textContent ?? racine.querySelector(sel)?.textContent ?? '';
  return { '.feuille': t('.feuille'), '.fenetre': t('.fenetre'), '.toast': t('.toast') };
}

function afficher() {
  D.j = jeu;
  D.uid = uid;
  compteEtat.pseudo = jeu.directeur?.nom;
  D.now = Date.now();
  const email = (racine.querySelector('#email') as HTMLInputElement | null)?.value ?? '';
  const mdp = (racine.querySelector('#mdp') as HTMLInputElement | null)?.value ?? '';
  const pseudoTape = (racine.querySelector('#gt-nom') as HTMLInputElement | null)?.value;
  let h = '';
  if (mode === 'titre') h = htmlTitre(jeu.introVue, !reduit);
  else if (mode === 'intro') h = htmlIntro(plan, lignesVues, !reduit, texteCache);
  else if (mode === 'combat' && jeu.expedition?.carte && jeu.expedition.phase === 'carte') h = htmlExploration(jeu);
  else if (mode === 'combat' && jeu.expedition) {
    const etat = K.etat ?? jeu.expedition.combat;
    const lecon = jeu.expedition.tutoriel && etat.issue === 'en-cours' ? J.leconTutoriel(etat.tour) : undefined;
    // une mécanique rencontrée pour la première fois : expliquée entre deux tours (jamais pendant le combat guidé)
    // une seule par tour (sauf la phase d'un gardien) : quatre fenêtres d'affilée noieraient le joueur
    const tourCombat = `${jeu.expedition.sequence.length}:${etat.tour}`;
    const enAttente = !K.verrou && !K.fin && !jeu.expedition.tutoriel && etat.issue === 'en-cours' ? decouverteEnAttente(jeu.decouvertes ?? [], etat) : null;
    const decouverte = enAttente && (enAttente.id === 'phase' || K.decouverteTour !== tourCombat || K.decouverteId === enAttente.id) ? enAttente : null;
    if (decouverte) { K.decouverteTour = tourCombat; K.decouverteId = decouverte.id; }
    h = htmlCombat({ x: jeu.expedition, etat, verrou: K.verrou, regles: K.regles, fuite: K.fuite, guide: K.guide, trouvees: trouveesDe(jeu.collection), pops: K.pops, fin: K.fin, lecon, traces: K.traces, ...(K.actif !== undefined ? { actif: K.actif } : {}), ...(decouverte ? { decouverte } : {}) });
  } else {
    mode = 'district';
    voirNouveautes();
    h = D.vue === 'coupe' ? htmlCoupe(D) : D.vue === 'escouade' ? htmlEscouade(D) : D.vue === 'rencontre' ? htmlRencontre(D.bulles) : D.vue === 'briefing' ? htmlBriefing(D.etape)
      : D.vue === 'codex' ? htmlCodex(D) : D.vue === 'cartes' ? htmlCartes(D) : D.vue === 'porteurs' ? htmlPorteurs(D) : D.vue === 'classements' ? htmlClassements(D, G, uid) : htmlArchipel(D);
  }
  racine.dataset.mode = mode;
  // chaque sorte de zone garde ses positions à part : une liste qui apparaît ou disparaît ne décale pas les autres
  const defile = DEFILANTS.map((sel) => [...racine.querySelectorAll<HTMLElement>(sel)].map((el) => [el.scrollTop, el.scrollLeft] as const));
  const avant = cles();
  const places = noter(racine);
  horloge(racine);
  if (!(mode === 'intro' && majIntro(racine, h, reduit))) racine.innerHTML = h;
  glisser(racine, places);
  DEFILANTS.forEach((sel, k) => racine.querySelectorAll<HTMLElement>(sel).forEach((el, i) => { const d = defile[k]?.[i]; if (d) { el.scrollTop = d[0]; el.scrollLeft = d[1]; } }));
  for (const [sel, cle] of Object.entries(cles())) if (cle && cle !== avant[sel]) racine.querySelector(sel)?.classList.add('entre');
  document.body.classList.toggle('fige', !!racine.querySelector('.feuille, .voile'));
  if (mode === 'district') { activerCartes(racine); brancherTableau(racine); }
  if (mode === 'intro') { precharger(plan); precharger(plan + 1); animerCompteur(racine, lignesVues, reduit); }
  D.uid = uid;
  const ie = racine.querySelector('#email') as HTMLInputElement | null;
  const im = racine.querySelector('#mdp') as HTMLInputElement | null;
  if (ie) ie.value = email;
  const ip = racine.querySelector('#gt-nom') as HTMLInputElement | null;
  if (ip && pseudoTape !== undefined) ip.value = pseudoTape;
  if (im) im.value = mdp;
}

// ---------- Sauvegarde ----------

let compte: typeof import('./net/compte') | null = null;
let uid: string | null = null;
let minuteur: number | undefined;

// Les pastilles « Nouveau » (23 octobre 2026) : elles restent tant qu'on est sur l'écran qui les montre,
// et s'effacent quand on le quitte (ou plus tôt, en ouvrant la fiche du Porteur ou le détail de la carte).
let ecranVu = '';
function voirNouveautes() {
  const ecran = D.vue === 'porteurs' && D.reserve ? 'tous-porteurs' : D.vue;
  let change = false;
  if (ecranVu === 'cartes' && ecran !== 'cartes') change = J.marquerVus(jeu, 'cartes', Object.keys(jeu.collection)) || change;
  if (ecranVu === 'tous-porteurs' && ecran !== 'tous-porteurs') change = J.marquerVus(jeu, 'porteurs', J.porteursPresents(jeu)) || change;
  if (D.porteur) change = J.marquerVus(jeu, 'porteurs', [D.porteur]) || change;
  if (D.carte) change = J.marquerVus(jeu, 'cartes', [D.carte]) || change;
  ecranVu = ecran;
  if (change) sauver();
}

function sauver() {
  const env = enregistrer(jeu);
  if (compte && uid) {
    clearTimeout(minuteur);
    minuteur = window.setTimeout(() => pousser(env), 1500);
    planifierPublication();
  }
}

// ---------- Le Grand Tableau en ligne ----------
// On publie son entrée quand un score change (au plus une fois toutes les 25 secondes, comme le veulent les règles Firestore),
// et on relit les classements à l'ouverture de l'écran (au plus une fois par minute, sauf « Actualiser »).

let tableauNet: typeof import('./net/classement') | null = null;
/** la feuille du pseudo ne s'ouvre d'elle-même qu'une fois par lancement */
let pseudoDemande = false;
/** la clé du pseudo dont la réservation en ligne est confirmée pendant ce lancement */
let pseudoReserve: string | null = null;
/** l'entrée telle qu'elle est en ligne (null = pas encore lue ou absente) */
let monEntree: Entree | null = null;
let monEntreeLue = false;
let dernierePublication = 0;
let minuteurPublication: number | undefined;

async function reseauTableau() {
  tableauNet ??= await import('./net/classement');
  return tableauNet;
}

async function lireTableau(force = false) {
  if (!compte || !uid) return;
  if (!force && G.etat === 'chargement') return;
  if (!force && G.lu && Date.now() - G.lu < 60_000) return;
  G.etat = 'chargement'; G.erreur = '';
  if (mode === 'district' && D.vue === 'classements') afficher();
  try {
    const net = await reseauTableau();
    G.entrees = await net.lire();
    monEntree = G.entrees.find((x) => x.uid === uid) ?? null;
    monEntreeLue = true;
    G.lu = Date.now(); G.etat = 'ok';
  } catch (e) {
    G.etat = 'erreur'; G.erreur = `Le Tableau ne répond pas pour l’instant (${(e as { code?: string })?.code ?? 'réseau'}).`;
    console.warn('Grand Tableau', e);
  }
  if (mode === 'district') afficher();
  planifierPublication();
}

function planifierPublication(delai = 2000) {
  if (!compte || !uid || !jeu.directeur?.public) return;
  clearTimeout(minuteurPublication);
  const attente = Math.max(delai, dernierePublication + 25_000 - Date.now());
  minuteurPublication = window.setTimeout(publierTableau, attente);
}

async function publierTableau() {
  if (!compte || !uid || !jeu.directeur?.public || !jeu.directeur.nom) return;
  // l'entrée en ligne d'abord : sa profondeur et sa date décident de ce qu'on a le droit d'envoyer
  if (!monEntreeLue) { await lireTableau(true); return; }
  const e = entreeAPublier(jeu, uid, jeu.directeur.nom, monEntree, Date.now(), J.semaineDe(Date.now()));
  if (!e || !aChange(e, monEntree)) return;
  // le pseudo doit être réservé à ce compte (sauvegarde d'avant les réservations, ou autre appareil)
  if (pseudoReserve !== e.cle) {
    try {
      await (await reseauTableau()).reserver(uid, jeu.directeur.nom, null);
      pseudoReserve = e.cle;
    } catch (err) {
      const net = await reseauTableau();
      if (err instanceof net.PseudoPris) {
        G.edition = true; G.accueil = false;
        G.erreur = `« ${jeu.directeur.nom} » a été réservé par un autre directeur. Choisis un autre pseudo.`;
        jeu.directeur.change = 0;
        if (mode === 'district') afficher();
      } else planifierPublication(30_000);
      return;
    }
  }
  try {
    const net = await reseauTableau();
    await net.publier(e);
    dernierePublication = Date.now();
    monEntree = e;
    G.entrees = [...G.entrees.filter((x) => x.uid !== uid), e];
    if (mode === 'district' && D.vue === 'classements') afficher();
    // la profondeur ne monte que de deux Strates par publication : le reste suit à la prochaine
    if (jeu.palmares && e.profondeur < jeu.palmares.profondeur) planifierPublication(25_000);
  } catch {
    // refusée (trop tôt, ou l'entrée a changé ailleurs) : on relit, puis on réessaie plus tard
    monEntreeLue = false;
    dernierePublication = Date.now();
    planifierPublication(30_000);
  }
}

async function pousser(env: Enveloppe) {
  if (!compte || !uid) return;
  compteEtat.synchro = 'en-cours';
  try {
    await compte.ecrireDistante(uid, env);
    compteEtat.synchro = 'ok';
    compteEtat.codeErreur = '';
  } catch (e) {
    compteEtat.synchro = 'erreur';
    compteEtat.codeErreur = 'écriture : ' + ((e as { code?: string })?.code ?? String(e).slice(0, 60));
    console.warn('Synchronisation', e);
  }
  if (compteEtat.ouvert && mode === 'district') afficher();
}

async function reconcilier() {
  if (!compte || !uid) return;
  try {
    const distante = await compte.lireDistante(uid);
    const locale = charger();
    if (distante && (!locale || distante.updatedAt > locale.updatedAt)) {
      enregistrer(distante.data, distante.updatedAt);
      jeu = distante.data;
      J.tick(jeu, Date.now());
      compteEtat.info = 'Progression du compte chargée.';
      mode = jeu.expedition ? 'combat' : 'district';
      K.etat = null;
      K.fin = finPour();
      afficher();
    } else if (locale) await pousser(locale);
  } catch (e) {
    compteEtat.synchro = 'erreur';
    compteEtat.codeErreur = 'lecture : ' + ((e as { code?: string })?.code ?? String(e).slice(0, 60));
    console.warn('Synchronisation', e);
  }
}

async function demarrerCompte() {
  if (!firebaseActif()) return;
  compte = await import('./net/compte');
  compte.surChangement((u) => {
    compteEtat.utilisateur = u;
    uid = u?.uid ?? null;
    compteEtat.synchro = 'aucune';
    G.entrees = []; G.lu = 0; G.etat = 'repos'; monEntree = null; monEntreeLue = false;
    if (uid) {
      // à la connexion (ou au premier lancement connecté), le jeu demande un pseudo s'il n'y en a pas encore,
      // après avoir récupéré la sauvegarde du compte : elle en a peut-être déjà un
      reconcilier().then(() => {
        if (uid && !jeu.directeur?.nom && !pseudoDemande) { pseudoDemande = true; G.edition = true; G.accueil = true; G.erreur = ''; if (mode === 'district') afficher(); }
      });
      lireTableau(true);
    }
    if (mode === 'district') afficher();
  });
}

// ---------- Intro : avance automatique ----------

function avancerIntro(): boolean {
  if (lignesVues < PLANS[plan]!.lignes.length) { lignesVues++; return true; }
  if (plan < PLANS.length - 1) { plan++; lignesVues = 1; return true; }
  return false;
}
function reculerIntro(): boolean {
  if (lignesVues > 1) { lignesVues--; return true; }
  if (plan > 0) { plan--; lignesVues = PLANS[plan]!.lignes.length; return true; }
  return false;
}

document.addEventListener('keydown', (ev) => {
  if (mode === 'titre' && (ev.key === 'Enter' || ev.key === ' ')) {
    ev.preventDefault(); mode = apresTitre(); if (mode === 'combat') K.fin = finPour(); afficher(); return;
  }
  if (ev.key === 'Escape') {
    if (mode === 'district' && (D.selection || D.carte || D.deck || D.menu || D.porteur || D.place != null)) { D.selection = null; D.carte = null; D.deck = null; D.menu = false; D.porteur = null; D.place = null; afficher(); return; }
    if (mode === 'combat' && K.regles) { K.regles = false; afficher(); return; }
  }
  if (mode !== 'intro' || ev.altKey || ev.ctrlKey || ev.metaKey) return;
  let change = false;
  if (ev.key === 'ArrowRight' || ev.key === ' ' || ev.key === 'PageDown') { ev.preventDefault(); if (texteCache) { texteCache = false; change = true; } else change = avancerIntro(); }
  else if (ev.key === 'ArrowLeft' || ev.key === 'PageUp') { ev.preventDefault(); texteCache = false; change = reculerIntro(); }
  else if (ev.key.toLowerCase() === 'h') { texteCache = !texteCache; change = true; }
  if (change) afficher();
});

// ---------- Combat ----------

function finPour(): Fin | null {
  const x = jeu.expedition;
  if (!x) return null;
  const s = x.combat;
  if (x.carte && x.phase === 'carte') return null;
  if (x.tutoriel) {
    if (s.issue === 'victoire') return { titre: 'La porte cède', texte: 'Le gardien se dissipe en poussière lumineuse. Derrière lui, des cristaux aux souvenirs mélangés, et un vieux papier tamponné.', bouton: 'Remonter avec ce qu’on a trouvé', action: 'remonter' };
    if (s.issue === 'defaite') return { titre: 'Repoussés', texte: 'Le gardien a eu le dessus, cette fois. Vise les suites et protège-toi quand il annonce une grosse attaque.', bouton: 'Remonter et réessayer', action: 'remonter' };
    return null;
  }
  if (x.epreuve) {
    const ep = J.epreuveDef(x.epreuve);
    if (s.issue === 'victoire') return { titre: 'Épreuve réussie', texte: `${ep?.nom ?? 'L’Épreuve'} : ${ennemiDef(s.ennemi.id).nom} se dissipe.${jeu.epreuves.faites.includes(x.epreuve) ? ' Tu l’avais déjà réussie cette semaine : pas de nouvelle carte.' : ' Une carte au choix t’attend au district.'}`, bouton: 'Remonter au district', action: 'remonter' };
    if (s.issue === 'defaite') return { titre: 'Épreuve manquée', texte: 'L’escouade a été repoussée. Tu peux la retenter quand tu veux cette semaine : change de cartes ou de Porteurs pour contourner la règle.', bouton: 'Remonter au district', action: 'remonter' };
    return null;
  }
  if (s.issue === 'defaite') {
    return { titre: 'Défaite', texte: `Toute l’escouade est à terre. Elle remonte avec la moitié du butin (${Math.floor(x.butin * J.DISTRICT.butinDefaite)} composants) et devra se reposer à la Clinique.`, bouton: 'Remonter au district', action: 'remonter' };
  }
  if (s.issue === 'victoire') {
    const nom = s.autres?.length ? 'Le groupe' : ennemiDef(s.ennemi.id).nom;
    if (x.terminee) {
      return { titre: `Strate −${x.strate} vaincue`, texte: `${nom} se disperse. L’escouade remonte avec ${x.butin} composants.${x.strate === jeu.strate ? ' Le passage est libre : avec assez de creuseurs, l’étage suivant pourra être percé (voir la Tour du Noyau).' : ''}`, bouton: 'Remonter au district', action: 'remonter' };
    }
    if (x.carte) return { titre: 'Victoire', texte: `${nom} se dissipe. Butin : ${x.butin} composants. L’escouade reprend sa route : les PV remontent surtout aux campements.`, bouton: 'Retour à la carte', action: 'suivant' };
    return { titre: 'Victoire', texte: `${nom} se dissipe. Butin : ${x.butin} composants. L’escouade souffle un peu (+50 % de PV) : tu continues, ou tu remontes avec ce que tu as ?`, bouton: 'Combat suivant', action: 'suivant', bouton2: 'Remonter avec le butin', action2: 'remonter' };
  }
  return null;
}

let idPop = 0;
function pop(cible: string, texte: string, couleur: string, echelle = 1) {
  const id = ++idPop;
  K.pops.push({ id, cible, texte, couleur, echelle });
  setTimeout(() => {
    K.pops = K.pops.filter((p) => p.id !== id);
    if (mode === 'combat') afficher();
  }, 900);
}

function popsDe(ev: Evenement, etat?: CombatEtat) {
  // dans un groupe, ce qui touche un ennemi qui n'est pas visé s'affiche sur sa vignette
  if ('rang' in ev && ev.rang !== undefined && 'cible' in ev && ev.cible === 'ennemi' && etat?.autres?.length && (etat.ennemi.rang ?? 0) !== ev.rang) {
    ev = { ...ev, cible: `ennemi-${ev.rang}` } as Evenement;
  }
  // un coup sur l'ennemi grossit avec sa place dans la chaîne et avec sa taille : la fin d'une suite se lit de loin
  if (ev.kind === 'degats') pop(ev.cible, ev.net ? `−${ev.net}` : 'bloqué', 'var(--danger)', ev.cible === 'ennemi' && ev.net ? Math.min(2, 1 + 0.18 * (K.actif ?? 0) + (ev.net >= 25 ? 0.25 : 0) + (ev.net >= 45 ? 0.2 : 0)) : 1);
  else if (ev.kind === 'bouclier') pop(ev.cible, `+${ev.v}`, 'var(--ivory)');
  else if (ev.kind === 'soin' && ev.v) pop(ev.cible, `+${ev.v}`, 'var(--bio)');
  else if (ev.kind === 'echo') pop('escouade', 'Écho', 'var(--gold)');
  else if (ev.kind === 'effet') pop(ev.cible, ev.texte, 'var(--gold)');
  else if (ev.kind === 'flux') pop('escouade', `+${ev.gain} Flux`, 'var(--gold)');
}

/** un toucher pendant l'animation la fait passer plus vite */
let rapide = false;
async function jouer(pas: Pas[]) {
  K.verrou = true;
  rapide = false;
  initImpacts(reduit);
  let bonus = 0;
  for (const p of pas) {
    const base = p.ev.kind === 'carte' ? 130 : p.ev.kind === 'resonance' ? 250 : p.ev.kind === 'degats' && p.ev.cible === 'ennemi' ? 300 : 380;
    await pause((base + bonus) * (rapide ? 0.35 : 1));
    // la jauge touchée garde une traînée de ses PV d'avant le coup, qui se vide
    if (p.ev.kind === 'degats' && p.ev.net > 0) {
      const avant = K.etat ?? jeu.expedition?.combat;
      const cible = p.ev.cible;
      const ev = p.ev;
      const c = cible === 'ennemi' ? (avant && C.tousEnnemis(avant).find((e) => (e.rang ?? 0) === (ev.rang ?? 0))) ?? avant?.ennemi : avant?.porteurs.find((x) => x.id === cible);
      if (c) {
        K.traces[cible] = Math.max(0, Math.min(100, (100 * c.pv) / c.pvMax));
        setTimeout(() => { delete K.traces[cible]; }, 1100);
      }
    }
    K.etat = p.etat;
    if (p.ev.kind === 'carte') K.actif = p.ev.rang;
    else if (p.ev.kind === 'fin' || (p.ev.kind === 'degats' && p.ev.cible !== 'ennemi' && !p.ev.source)) K.actif = undefined;
    popsDe(p.ev, p.etat);
    afficher();
    bonus = impact(p.ev, racine);
  }
  await pause(300 + bonus * (rapide ? 0.35 : 1));
  K.actif = undefined;
  K.etat = null;
  if (jeu.expedition && jeu.expedition.combat.issue !== 'en-cours') J.finDeCombat(jeu);
  K.fin = finPour();
  K.verrou = false;
  sauver();
  afficher();
}

/**
 * Fuir : l'attaque annoncée touche pendant la fuite. On la joue comme un vrai coup (traînée de la jauge, chiffres, secousse),
 * puis on quitte l'écran de combat. L'état du combat n'est pas modifié ici : jeu.ts applique le même coup.
 */
async function jouerFuite() {
  const s = jeu.expedition?.combat;
  if (!s) return;
  const { coups } = C.coupDeFuite(s);
  K.fuite = false;
  const pas: Pas[] = [];
  let etat = structuredClone(s);
  for (const c of coups) {
    etat = structuredClone(etat);
    const p = etat.porteurs.find((q) => q.id === c.id)!;
    p.pv = Math.max(0, p.pv - c.net);
    etat.bouclier = Math.max(0, etat.bouclier - c.absorbe);
    pas.push({ ev: { kind: 'degats', cible: c.id, net: c.net, absorbe: c.absorbe }, etat });
    if (p.pv <= 0) { p.aTerre = true; pas.push({ ev: { kind: 'a-terre', cible: c.id }, etat }); }
  }
  if (pas.length) await jouer(pas);
}

// ---------- Actions ----------

const champ = (id: string) => ((racine.querySelector('#' + id) as HTMLInputElement | null)?.value ?? '').trim();

async function actionCompte(f: () => Promise<void>) {
  if (!compte) return;
  compteEtat.occupe = true;
  compteEtat.erreur = '';
  afficher();
  try {
    await f();
  } catch (e) {
    compteEtat.erreur = compte.messageErreur(e);
  }
  compteEtat.occupe = false;
  afficher();
}

/** change d'onglet : ferme ce qui était ouvert et remonte en haut */
function ouvrir(v: EcranDistrict['vue']) {
  if (D.vue !== v) window.scrollTo(0, 0);
  D.vue = v; D.selection = null; D.carte = null; D.deck = null; D.menu = false; D.guide = null; D.porteur = null; D.place = null;
  if (v === 'porteurs') D.reserve = false;
}

const centreDe = (el: Element) => { const r = el.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; };
const resultat = (r: J.Resultat) => { D.message = r.ok ? '' : r.message ?? ''; if (r.ok) sauver(); };

racine.addEventListener('pointerdown', () => { if (K.verrou) rapide = true; });
/** le dernier endroit touché : les gains en jaillissent */
let touche = { x: 0, y: 0 };
racine.addEventListener('pointerdown', (ev) => { touche = { x: ev.clientX, y: ev.clientY }; }, true);

/* appui long sur une carte de combat : montre son nom, sans la jouer */
let appui: { el: HTMLElement; t: number; x: number; y: number } | null = null;
let annulerClic = false;
const finAppui = () => { if (appui) { clearTimeout(appui.t); const el = appui.el; appui = null; setTimeout(() => el.classList.remove('nom-visible'), 1200); } };
racine.addEventListener('pointerdown', (ev) => {
  const el = (ev.target as HTMLElement).closest<HTMLElement>('.geste');
  if (!el || mode !== 'combat') return;
  annulerClic = false;
  appui = { el, x: ev.clientX, y: ev.clientY, t: window.setTimeout(() => { el.classList.add('nom-visible'); annulerClic = true; }, 450) };
});
racine.addEventListener('pointermove', (ev) => { if (appui && Math.hypot(ev.clientX - appui.x, ev.clientY - appui.y) > 10) { clearTimeout(appui.t); appui = null; } });
for (const t of ['pointerup', 'pointercancel', 'pointerleave'] as const) racine.addEventListener(t, finAppui);
racine.addEventListener('contextmenu', (ev) => { if (mode === 'combat' && (ev.target as HTMLElement).closest('.geste')) ev.preventDefault(); });
racine.addEventListener('click', (ev) => { if (annulerClic) { annulerClic = false; ev.stopImmediatePropagation(); ev.preventDefault(); } }, true);

racine.addEventListener('click', async (ev) => {
  const b = (ev.target as HTMLElement).closest<HTMLElement>('[data-action]');
  if (!b || (b as HTMLButtonElement).disabled) return;
  const a = b.dataset.action;
  const id = b.dataset.id ?? '';
  const x = jeu.expedition;
  const s = x?.combat;
  // ce que le joueur reçoit grâce à cette action (comparé après le rendu, en bas de ce gestionnaire)
  const avantGains = relever(jeu);
  const depart = ev.detail === 0 ? centreDe(b) : touche;
  D.message = a === 'poster' || a === 'liberer' || a === 'fabriquer' || a === 'ameliorer' || a === 'choisir' || a === 'greffer' || a === 'monter' || a === 'carte' || a === 'colis' || a === 'chapitre' ? D.message : '';

  switch (a) {
    // intro
    case 'titre-jouer':
      mode = apresTitre();
      if (mode === 'combat') K.fin = finPour();
      if (mode === 'intro') { plan = 0; lignesVues = 1; texteCache = false; }
      break;
    case 'intro-suivant': if (texteCache) texteCache = false; else avancerIntro(); break;
    case 'intro-precedent': texteCache = false; reculerIntro(); break;
    case 'intro-oeil': texteCache = !texteCache; break;
    case 'intro-passer':
      jeu.introVue = true;
      mode = jeu.expedition ? 'combat' : 'district';
      D.vue = jeu.chambre ? 'archipel' : 'rencontre';
      D.bulles = 0;
      sauver();
      break;
    case 'installer': ev.stopPropagation(); await installer(); afficher(); return;
    case 'intro': plan = 0; lignesVues = 1; texteCache = false; mode = 'intro'; D.menu = false; break;

    // district
    case 'batiment': D.selection = D.selection === id ? null : (id as typeof D.selection); D.menu = false;
      if (b.dataset.amelio !== undefined) requestAnimationFrame(() => document.getElementById('fb-amelio')?.scrollIntoView({ block: 'start' }));
      break;
    case 'ok-message': D.message = ''; break;
    case 'ressource': D.ressource = id && D.ressource !== id ? (id as typeof D.ressource) : null; D.menu = false; D.selection = null; break;
    case 'menu': D.ressource = null; D.menu = !D.menu; D.selection = null; D.carte = null; D.deck = null; D.guide = null; D.porteur = null; break;
    // le mode d'emploi des cartes : ouvrir sur un onglet, changer d'onglet, fermer (district et combat)
    case 'guide': if (mode === 'combat') { K.guide = id as OngletGuide; K.regles = false; } else D.guide = id as OngletGuide; break;
    case 'guide-fermer': if (mode === 'combat') { K.guide = null; K.regles = true; } else D.guide = null; break;
    case 'carte': D.carte = id; break;
    case 'carte-fermer': D.carte = null; break;
    case 'filtre': D.filtre = (id as typeof D.filtre) || 'tout'; window.scrollTo(0, 0); break;
    case 'fermer': D.selection = null; break;
    case 'ameliorer': resultat(J.ameliorer(jeu, id as BatimentId, Date.now())); break;
    case 'poster': resultat(J.poster(jeu, id, (b.dataset.poste as J.Poste) ?? null)); break;
    case 'liberer': resultat(J.poster(jeu, id, null)); break;
    case 'acheter': resultat(J.acheter(jeu, Number(b.dataset.index ?? -1), Date.now())); break;
    case 'fabriquer': resultat(J.fabriquer(jeu, b.dataset.module ?? '', Date.now())); break;
    case 'cartes': ouvrir('cartes'); break;
    case 'porteurs': ouvrir('porteurs'); break;
    case 'porteur': D.porteur = id; D.deck = null; D.place = null; break;
    // « Mon escouade » (23 octobre 2026) : l'onglet Porteurs s'ouvre sur l'escouade ; « Tous les Porteurs » à part
    case 'porteurs-tous': D.reserve = true; D.place = null; D.porteur = null; D.deck = null; window.scrollTo(0, 0); break;
    case 'porteurs-escouade': D.reserve = false; D.porteur = null; D.deck = null; window.scrollTo(0, 0); break;
    case 'escouade-place': D.place = Number(b.dataset.index ?? 0); D.porteur = null; D.deck = null; break;
    case 'escouade-fermer': D.place = null; break;
    case 'escouade-mettre': {
      const r = J.placerDansEscouade(jeu, Number(b.dataset.index ?? 0), id);
      if (r.ok) J.marquerVus(jeu, 'porteurs', [id]);
      resultat(r);
      if (r.ok) D.place = null;
      break;
    }
    case 'porteur-fermer': D.porteur = null; break;
    case 'greffer': {
      // un Porteur déjà plein : on ouvre ses cartes pour qu'il en rende une
      const r = J.greffer(jeu, b.dataset.module ?? '', id);
      resultat(r);
      const plein = !r.ok && !!r.message?.includes(`${J.DISTRICT.cartesMax} cartes`);
      if (plein) { D.carte = null; D.deck = id; D.message = `${porteurDef(id).nom} porte déjà ${J.DISTRICT.cartesMax} cartes : reprends-en une, puis confie-lui ${moduleDef(b.dataset.module ?? '').nom}.`; }
      break;
    }
    case 'deck': D.deck = id; D.carte = null; break;
    case 'deck-fermer': D.deck = null; break;
    case 'degreffer': resultat(J.degreffer(jeu, b.dataset.module ?? '')); break;
    case 'monter': resultat(J.monter(jeu, b.dataset.module ?? '')); break;
    case 'recycler': resultat(J.recycler(jeu, b.dataset.module ?? '')); break;
    case 'prendre': resultat(J.prendre(jeu, Number(b.dataset.index ?? 0))); break;
    case 'reclamer-jour': resultat(J.reclamerQuotidien(jeu)); break;
    case 'colis': {
      const r = J.ouvrirColis(jeu);
      resultat(r);
      if (r.colis) D.message = `Ravitaillement : +${r.colis.composants} composants${r.colis.doublon ? `, un doublon de ${moduleDef(r.colis.doublon).nom}` : ''}.${r.colis.choix ? ' Et une carte au choix !' : ''}`;
      break;
    }
    case 'ouvrir-archive': resultat(J.ouvrirArchive(jeu)); break;
    case 'entrer': ouvrir('coupe'); break;
    case 'vers-amelioration': document.getElementById('fb-amelio')?.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' }); return;
    case 'archipel': ouvrir('archipel'); break;
    case 'coupe': ouvrir('coupe'); break;
    case 'descendre': D.deck = null; D.fouille = null; D.epreuve = null; D.strateChoisie = Number(b.dataset.strate ?? 1); D.escouade = J.escouadePourDepart(jeu); D.vue = 'escouade'; D.porteur = null; window.scrollTo(0, 0); break;
    case 'fouiller-choix': D.deck = null; D.fouille = 'composants'; D.epreuve = null; D.strateChoisie = Number(b.dataset.strate ?? 1); D.escouade = J.escouadePourDepart(jeu); D.vue = 'escouade'; D.porteur = null; window.scrollTo(0, 0); break;
    case 'cible': D.fouille = id as typeof D.fouille; break;
    case 'epreuve': {
      const ep = J.epreuveDef(id);
      D.deck = null; D.fouille = null; D.epreuve = id; D.strateChoisie = J.strateEpreuve(jeu);
      D.escouade = J.escouadePourDepart(jeu, ep?.interdits ?? []); D.vue = 'escouade'; D.porteur = null; window.scrollTo(0, 0);
      break;
    }
    case 'mission': resultat(J.envoyerMission(jeu, id, (b.dataset.duree as J.DureeMission) ?? 'courte', Date.now())); break;
    case 'choisir':
      if (D.escouade.includes(id)) D.escouade = D.escouade.filter((p) => p !== id);
      else if (D.escouade.length < 3) D.escouade = [...D.escouade, id];
      else D.message = 'Trois Porteurs maximum : retires-en un d’abord.';
      break;
    case 'partir': {
      const r = D.epreuve ? J.partirEpreuve(jeu, D.escouade, D.epreuve, Date.now())
        : D.fouille ? J.fouiller(jeu, D.escouade, D.strateChoisie, D.fouille)
          : J.partir(jeu, D.escouade, D.strateChoisie);
      resultat(r);
      if (r.ok) { mode = 'combat'; K.fin = null; K.etat = null; window.scrollTo(0, 0); }
      break;
    }
    case 'reprendre': mode = 'combat'; K.fin = finPour(); break;
    case 'rencontre': D.vue = 'rencontre'; D.bulles = 0; break;
    case 'rencontre-suite': D.bulles = Math.min(D.bulles + 1, NB_REPLIQUES); break;
    case 'briefing': D.vue = 'briefing'; D.etape = 0; window.scrollTo(0, 0); break;
    case 'briefing-suite': D.etape = Math.min(D.etape + 1, ETAPES.length - 1); break;
    case 'briefing-retour': D.etape = Math.max(D.etape - 1, 0); break;
    case 'codex':
    case 'bibliotheque':
      D.retourBiblio = mode === 'titre' ? 'titre' : D.vue === 'coupe' ? 'coupe' : 'archipel';
      if (mode === 'titre') mode = 'district';
      ouvrir('codex'); D.chapitre = null; window.scrollTo(0, 0);
      break;
    case 'biblio-onglet': D.onglet = id === 'archives' ? 'archives' : 'chroniques'; D.chapitre = null; break;
    case 'chapitre':
      D.onglet = 'chroniques'; D.chapitre = id;
      if (!jeu.lus.includes(id) || !jeu.luesRecompensees.includes(id)) {
        const carte = J.lireChapitre(jeu, id);
        if (carte) D.message = `Ysé glisse une carte entre les pages : ${moduleDef(carte).nom} (Fer) rejoint tes Cartes.`;
        sauver();
      }
      window.scrollTo(0, 0);
      break;
    case 'chapitre-fermer': D.chapitre = null; window.scrollTo(0, 0); break;
    case 'biblio-retour':
      D.chapitre = null;
      // revenu à l'écran titre, « Reprendre » doit ramener au district, pas à la Bibliothèque
      if (D.retourBiblio === 'titre') { mode = 'titre'; ouvrir('archipel'); }
      else ouvrir(D.retourBiblio);
      break;
    case 'ouvrir-chambre': {
      const r = J.ouvrirChambre(jeu);
      resultat(r);
      if (r.ok) { mode = 'combat'; K.fin = null; K.etat = null; window.scrollTo(0, 0); }
      break;
    }
    case 'reclamer': resultat(J.reclamer(jeu)); break;
    case 'decider': resultat(J.decider(jeu, b.dataset.acte ?? 'chambre', id)); break;
    case 'retour-ok': D.retour = []; break;

    // combat
    case 'ajouter': if (s && !K.verrou) { C.ajouter(s, id || b.dataset.uid || ''); vibrer(5); sauver(); } break;
    case 'retirer': if (s && !K.verrou) { C.retirer(s, b.dataset.uid ?? ''); sauver(); } break;
    case 'accorder': if (s && !K.verrou) { C.accorder(s, b.dataset.uid ?? ''); sauver(); } break;
    case 'cibler': if (s && !K.verrou) { C.cibler(s, b.dataset.uid ?? ''); sauver(); } break;
    case 'viser': if (s && !K.verrou) { C.viser(s, Number(b.dataset.id)); sauver(); } break;
    case 'decouverte-ok': { const id = b.dataset.id ?? ''; if (id && !(jeu.decouvertes ??= []).includes(id)) jeu.decouvertes.push(id); sauver(); break; }
    case 'vider': if (s && !K.verrou) { C.viderChaine(s); sauver(); } break;
    case 'allonger': if (s && !K.verrou) { C.allonger(s); sauver(); } break;
    case 'repiocher': if (s && !K.verrou) { C.repiocher(s); sauver(); } break;
    case 'lancer': if (s && !K.verrou) { debloquerSon(); await jouer(C.lancer(s)); montrer(comparer(avantGains, relever(jeu))); return; } break;
    case 'regles': K.regles = !K.regles; K.fuite = false; K.guide = null; break;
    case 'fuir': if (!K.verrou) { K.fuite = !K.fuite; K.regles = false; K.guide = null; } break;
    case 'fuir-salle': {
      if (K.verrou || !x) break;
      await jouerFuite();
      const r = J.fuirSalle(jeu);
      if (!r.ok) { D.message = r.message ?? ''; afficher(); return; }
      K.fin = null; K.etat = null; sauver(); window.scrollTo(0, 0);
      break;
    }
    case 'son': basculerSon(); break;
    case 'suivant': J.continuer(jeu); K.fin = null; sauver(); window.scrollTo(0, 0); break;
    case 'salle': {
      const r = J.entrer(jeu, Number(id));
      if (!r.ok && jeu.expedition) jeu.expedition.recit = r.message ?? '';
      K.fin = null; K.etat = null; sauver(); window.scrollTo(0, 0);
      break;
    }
    case 'repondre': {
      const r = J.repondre(jeu, Number(id));
      if (!r.ok && jeu.expedition) jeu.expedition.recit = r.message ?? '';
      K.fin = null; K.etat = null; sauver();
      break;
    }
    case 'retraite':
      if (!J.retraite(jeu).ok) break;
    // falls through : remonter avec le butin
    case 'fuir-district':
      if (a === 'fuir-district') {
        if (K.verrou || !x) break;
        await jouerFuite();
        if (!J.fuir(jeu).ok) break;
      }
    // falls through : remonter avec 75 % du butin
    case 'remonter': {
      const r = J.remonter(jeu);
      K.fin = null;
      mode = 'district';
      if (r.tutoriel) {
        D.vue = 'archipel';
        D.message = r.victoire
          ? 'La chambre est ouverte. Derrière la porte, une carte : l’Œil-relais. Trois recrues rejoignent le district, et un premier fragment d’archives attend dans les Chroniques (onglet Archives).'
          : 'L’escouade se repose. La porte scellée t’attend toujours.';
      } else {
        const fuite = r.fuite ? `L’escouade a fui : elle rentre épuisée (+${J.DISTRICT.usureFuite} d’Usure chacun). ` : '';
        D.vue = jeu.choix.length ? 'archipel' : 'coupe';
        const manque = J.manquePourCreuser(jeu);
        D.message = fuite + (r.nouvelleStrate ? `Un nouvel étage est creusé : la Strate −${jeu.strate} est ouverte.`
          : r.victoire && manque && jeu.frontVaincu && r.butin >= 0 && J.strateVaincue(jeu) === jeu.strate
            ? `Le gardien est vaincu, mais l’étage suivant attend : ${manque.creuseurs ? `il manque ${manque.creuseurs} creuseur${manque.creuseurs > 1 ? 's' : ''}` : ''}${manque.creuseurs && manque.noyau ? ' et ' : ''}${manque.noyau ? `la Tour du Noyau doit passer au niveau ${J.noyauRequis(jeu.strate + 1)}` : ''}. +${r.butin} composants rapportés.`
            : `+${r.butin} composants rapportés.`)
          + (r.cartes.length ? ` Carte${r.cartes.length > 1 ? 's' : ''} trouvée${r.cartes.length > 1 ? 's' : ''} : ${r.cartes.map((c) => `${moduleDef(c).nom} (${NOMS_RARETE[moduleDef(c).rarete]})`).join(', ')}.` : '')
          + (r.eclats ? ` +${r.eclats} Éclat${r.eclats > 1 ? 's' : ''}.` : '')
          + (r.fragment ? ' Un fragment d’archives rejoint le Codex.' : '')
          + (r.xp?.length ? ` +${r.xp[0]!.xp} XP pour l’escouade.${r.xp.filter((e) => e.niveau).map((e) => ` ${porteurDef(e.id).nom} passe au niveau ${e.niveau} !`).join('')}` : '');
      }
      sauver();
      window.scrollTo(0, 0);
      break;
    }

    case 'panneau':
      D.panneauReplie = D.panneauReplie === false;
      try { localStorage.setItem('empreintes.panneau', D.panneauReplie ? 'replie' : 'ouvert'); } catch { /* stockage bloqué */ }
      break;

    // le Grand Tableau
    case 'classements':
      ouvrir('classements');
      if (id && TABLEAUX.some((t) => t.id === id)) G.tableau = id as TableauId;
      D.ressource = null;
      lireTableau();
      break;
    case 'gt-tableau': G.tableau = id as TableauId; G.regles = false; break;
    case 'gt-periode': G.periode = id as Periode; break;
    case 'gt-regles': G.regles = !G.regles; break;
    case 'gt-actualiser': await lireTableau(true); return;
    case 'gt-connexion': D.menu = true; compteEtat.ouvert = true; break;
    case 'gt-nom': G.edition = true; G.accueil = false; G.erreur = ''; lireTableau(); break;
    case 'gt-nom-fermer': G.edition = false; G.accueil = false; G.erreur = ''; break;
    case 'gt-nom-ok': {
      const nom = nettoyerNom((racine.querySelector('#gt-nom') as HTMLInputElement | null)?.value ?? '');
      const avant = jeu.directeur?.nom ?? null;
      if (!nomValide(nom)) { G.erreur = 'De 3 à 18 caractères : lettres (alphabet latin), chiffres, espaces, points, tirets.'; break; }
      if (pseudoInterdit(nom)) { G.erreur = 'Ce pseudo n’est pas accepté. Choisis-en un autre.'; break; }
      const change = !!avant && clePseudo(avant) !== clePseudo(nom);
      const depuis = jeu.directeur?.change ?? 0;
      if (change && Date.now() - depuis < DELAI_PSEUDO) {
        G.erreur = `Un changement de pseudo par semaine : le prochain est possible le ${new Date(depuis + DELAI_PSEUDO).toLocaleDateString('fr-BE', { weekday: 'long', day: 'numeric', month: 'long' })}.`;
        break;
      }
      if (G.entrees.some((x) => x.uid !== uid && x.cle === clePseudo(nom))) { G.erreur = 'Ce pseudo est déjà pris par un autre directeur.'; break; }
      // la réservation en ligne : c'est elle qui garantit qu'il n'y a pas deux fois le même pseudo
      if (compte && uid) {
        G.etat = 'chargement'; afficher();
        try {
          await (await reseauTableau()).reserver(uid, nom, avant);
          G.etat = 'ok';
        } catch (e) {
          G.etat = 'ok';
          const net = await reseauTableau();
          G.erreur = e instanceof net.PseudoPris ? 'Ce pseudo est déjà pris par un autre directeur.' : `Impossible de réserver ce pseudo pour l’instant (${(e as { code?: string })?.code ?? 'réseau'}).`;
          break;
        }
        pseudoReserve = clePseudo(nom);
      }
      jeu.directeur = { nom, public: jeu.directeur ? jeu.directeur.public || D.vue === 'classements' : true, change: change || !avant ? Date.now() : depuis };
      G.edition = false; G.accueil = false; G.erreur = '';
      D.message = `Bienvenue, ${nom} : c’est ce nom que verront les autres joueurs.`;
      sauver();
      planifierPublication(0);
      break;
    }
    case 'gt-retirer': G.retrait = !G.retrait; break;
    case 'gt-retirer-ok': {
      G.retrait = false;
      if (!uid) break;
      try {
        await (await reseauTableau()).retirer(uid);
        if (jeu.directeur) jeu.directeur.public = false;
        G.entrees = G.entrees.filter((x) => x.uid !== uid);
        monEntree = null;
        sauver();
      } catch { G.erreur = 'Impossible de te retirer pour l’instant. Réessaie dans un instant.'; G.etat = 'erreur'; }
      break;
    }

    // compte
    case 'compte': compteEtat.ouvert = !compteEtat.ouvert; compteEtat.erreur = ''; compteEtat.info = ''; break;
    case 'google': await actionCompte(() => compte!.connexionGoogle()); return;
    case 'connexion': await actionCompte(() => compte!.connexionEmail(champ('email'), champ('mdp'), false)); return;
    case 'inscription': await actionCompte(() => compte!.connexionEmail(champ('email'), champ('mdp'), true)); return;
    case 'oubli': await actionCompte(async () => { await compte!.motDePasseOublie(champ('email')); compteEtat.info = 'E-mail de réinitialisation envoyé.'; }); return;
    case 'deconnexion': await actionCompte(() => compte!.deconnexion()); return;
    default: return;
  }
  afficher();
  // les gains de l'action : après le rendu, pour que les compteurs visés soient à l'écran
  if (mode !== 'titre' && mode !== 'intro') montrer(comparer(avantGains, relever(jeu)), depart);
  // un nouvel onglet du guide s'ouvre en haut, pas à la hauteur de l'onglet d'avant
  if (a === 'guide') racine.querySelector('.guide-corps')?.scrollTo(0, 0);
});

// ---------- Le temps qui passe ----------

let dernierRendu = 0;
/** le dernier contact ou défilement du joueur : le redessin automatique attend qu'il ait fini */
let dernierGeste = 0;
for (const t of ['touchstart', 'touchmove', 'pointerdown', 'wheel'] as const) racine.addEventListener(t, () => { dernierGeste = Date.now(); }, { passive: true, capture: true });
racine.addEventListener('scroll', () => { dernierGeste = Date.now(); }, { passive: true, capture: true });
setInterval(() => {
  const avantTick = relever(jeu);
  const nouvelles = J.tick(jeu, Date.now());
  if (nouvelles.length) { D.message = nouvelles[0]!; sauver(); }
  if (mode !== 'district') return;
  const vite = !!jeu.forge || jeu.chantiers.length > 0 || nouvelles.length > 0;
  if (vite || Date.now() - dernierRendu > 15_000) {
    dernierRendu = Date.now();
    // ne pas redessiner pendant que le joueur tape dans le panneau Compte, ni pendant qu'il fait défiler une liste
    // (un redessin en plein glissement couperait le geste et ramènerait la liste au début)
    if (document.activeElement?.tagName !== 'INPUT' && Date.now() - dernierGeste > 2500) {
      afficher();
      // la Forge qui livre, une mission qui rentre, un Porteur qui arrive : sans la production d'énergie, qui coule toute seule
      if (nouvelles.length) montrer(comparer(avantTick, relever(jeu), { energie: false }));
    }
  }
}, 1000);
document.addEventListener('visibilitychange', () => { if (!document.hidden) { J.tick(jeu, Date.now()); sauver(); if (mode === 'district') afficher(); } });

K.fin = null;
afficher();
demarrerCompte();
initInstallation(() => { if (mode === 'titre') afficher(); });
// pour essayer les gains à la main pendant le développement (absent du site publié)
if (import.meta.env.DEV) Object.assign(window, {
  __gains: { montrer },
  // pour voir le Grand Tableau sans compte : __tableau(entrées, ton uid)
  __pseudo: () => { G.edition = true; G.accueil = true; afficher(); },
  __tableau: (l: Entree[], moi: string) => { G.entrees = l; G.etat = 'ok'; G.lu = Date.now(); uid = moi; compteEtat.utilisateur = { nom: 'Essai' }; afficher(); },
});
