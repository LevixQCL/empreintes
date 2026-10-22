import './ui/styles.css';
import './ui/scenes.css';
import './ui/face-carte.css';
import './ui/holo.css';
import './ui/combat.css';
import * as C from './core/combat';
import { ennemiDef, moduleDef, porteurDef } from './core/donnees';
import * as J from './core/jeu';
import type { BatimentId, CombatEtat, Evenement, Pas } from './core/types';
import { charger, enregistrer, type Enveloppe } from './save/local';
import { firebaseActif } from './net/firebase-config';
import { htmlCombat, type Ecran as EcranCombat, type Fin, type Compte } from './ui/vue';
import { ETAPES, htmlBriefing } from './ui/briefing';
import { brancherTableau, htmlArchipel, htmlCartes, htmlCodex, htmlCoupe, htmlEscouade, htmlRencontre, type EcranDistrict } from './ui/district';
import { PLANS, htmlIntro, imagesPlan } from './ui/intro';
import { htmlTitre } from './ui/titre';
import { htmlExploration } from './ui/exploration';
import { activerCartes } from './ui/carte';
import { NOMS_RARETE } from './core/collection';

const racine = document.getElementById('app') as HTMLElement;
const reduit = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
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
const D: EcranDistrict = { j: jeu, vue: 'archipel', selection: null, escouade: [], strateChoisie: 1, message: '', compte: compteEtat, now: Date.now(), retour: retourInitial, menu: false, carte: null, deck: null, filtre: 'tout', onglet: 'chroniques', chapitre: null, retourBiblio: 'archipel', bulles: 0, etape: 0 };
const K: { verrou: boolean; regles: boolean; pops: EcranCombat['pops']; fin: Fin | null; etat: CombatEtat | null; traces: Record<string, number> } = {
  verrou: false, regles: false, pops: [], fin: null, etat: null, traces: {},
};

// ---------- Rendu ----------

/** zones qui défilent toutes seules : on garde leur position d'un rendu à l'autre (le district se redessine chaque seconde) */
const DEFILANTS = '.feuille-corps, .rangee, .main, .rail';
/** une feuille, une fenêtre ou un message ne s'animent qu'à leur apparition */
function cles(): Record<string, string> {
  const t = (sel: string) => racine.querySelector(sel)?.querySelector('h2')?.textContent ?? racine.querySelector(sel)?.textContent ?? '';
  return { '.feuille': t('.feuille'), '.fenetre': t('.fenetre'), '.toast': t('.toast') };
}

function afficher() {
  D.j = jeu;
  D.now = Date.now();
  const email = (racine.querySelector('#email') as HTMLInputElement | null)?.value ?? '';
  const mdp = (racine.querySelector('#mdp') as HTMLInputElement | null)?.value ?? '';
  let h = '';
  if (mode === 'titre') h = htmlTitre(jeu.introVue, !reduit);
  else if (mode === 'intro') h = htmlIntro(plan, lignesVues, !reduit, texteCache);
  else if (mode === 'combat' && jeu.expedition?.carte && jeu.expedition.phase === 'carte') h = htmlExploration(jeu);
  else if (mode === 'combat' && jeu.expedition) {
    const etat = K.etat ?? jeu.expedition.combat;
    const lecon = jeu.expedition.tutoriel && etat.issue === 'en-cours' ? J.leconTutoriel(etat.tour) : undefined;
    h = htmlCombat({ x: jeu.expedition, etat, verrou: K.verrou, regles: K.regles, pops: K.pops, fin: K.fin, lecon, traces: K.traces });
  } else {
    mode = 'district';
    h = D.vue === 'coupe' ? htmlCoupe(D) : D.vue === 'escouade' ? htmlEscouade(D) : D.vue === 'rencontre' ? htmlRencontre(D.bulles) : D.vue === 'briefing' ? htmlBriefing(D.etape)
      : D.vue === 'codex' ? htmlCodex(D) : D.vue === 'cartes' ? htmlCartes(D) : htmlArchipel(D);
  }
  racine.dataset.mode = mode;
  const defile = [...racine.querySelectorAll<HTMLElement>(DEFILANTS)].map((el) => [el.scrollTop, el.scrollLeft] as const);
  const avant = cles();
  if (!(mode === 'intro' && majIntro(h))) racine.innerHTML = h;
  racine.querySelectorAll<HTMLElement>(DEFILANTS).forEach((el, i) => { const d = defile[i]; if (d) { el.scrollTop = d[0]; el.scrollLeft = d[1]; } });
  for (const [sel, cle] of Object.entries(cles())) if (cle && cle !== avant[sel]) racine.querySelector(sel)?.classList.add('entre');
  document.body.classList.toggle('fige', !!racine.querySelector('.feuille, .voile'));
  if (mode === 'district') { activerCartes(racine); brancherTableau(racine); }
  if (mode === 'intro') { precharger(plan); precharger(plan + 1); animerCompteur(); }
  const ie = racine.querySelector('#email') as HTMLInputElement | null;
  const im = racine.querySelector('#mdp') as HTMLInputElement | null;
  if (ie) ie.value = email;
  if (im) im.value = mdp;
}

// ---------- Sauvegarde ----------

let compte: typeof import('./net/compte') | null = null;
let uid: string | null = null;
let minuteur: number | undefined;

function sauver() {
  const env = enregistrer(jeu);
  if (compte && uid) {
    clearTimeout(minuteur);
    minuteur = window.setTimeout(() => pousser(env), 1500);
  }
}

async function pousser(env: Enveloppe) {
  if (!compte || !uid) return;
  compteEtat.synchro = 'en-cours';
  try {
    await compte.ecrireDistante(uid, env);
    compteEtat.synchro = 'ok';
  } catch {
    compteEtat.synchro = 'erreur';
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
  } catch {
    compteEtat.synchro = 'erreur';
  }
}

async function demarrerCompte() {
  if (!firebaseActif()) return;
  compte = await import('./net/compte');
  compte.surChangement((u) => {
    compteEtat.utilisateur = u;
    uid = u?.uid ?? null;
    compteEtat.synchro = 'aucune';
    if (uid) reconcilier();
    if (mode === 'district') afficher();
  });
}

// ---------- Intro : avance automatique ----------

/**
 * Mise à jour de l'intro sans tout reconstruire :
 * - même illustration : on la garde, pour que le mouvement de caméra (ou la vidéo) continue ;
 * - nouvelle illustration : l'ancienne reste par-dessus et s'efface (fondu enchaîné) ;
 * - même plan : les particules continuent aussi.
 */
function majIntro(h: string): boolean {
  const ancien = racine.querySelector<HTMLElement>('.intro');
  if (!ancien) return false;
  const t = document.createElement('template');
  t.innerHTML = h;
  const neuf = t.content.querySelector<HTMLElement>('.intro');
  if (!neuf) return false;
  const memePlan = ancien.dataset.plan === neuf.dataset.plan;
  const fA = ancien.querySelector<HTMLElement>(':scope > .intro-fond:not(.sortant)');
  const fN = neuf.querySelector<HTMLElement>(':scope > .intro-fond');
  const memeFond = !!fA && !!fN && fA.dataset.fond === fN.dataset.fond;
  const garder = (e: Element) => e.classList.contains('intro-fond') || (memePlan && e.classList.contains('intro-particules'));
  for (const e of [...ancien.children]) if (!garder(e)) e.remove();
  if (!memeFond) {
    if (fA) { fA.classList.add('sortant'); window.setTimeout(() => fA.remove(), reduit ? 0 : 1200); }
    if (fN) ancien.insertBefore(fN, ancien.firstChild);
  }
  for (const e of [...neuf.children]) {
    if (e.classList.contains('intro-fond')) continue;
    if (memePlan && e.classList.contains('intro-particules') && ancien.querySelector(':scope > .intro-particules')) continue;
    if (!memePlan && e.classList.contains('intro-scene')) e.classList.add('scene-entre');
    ancien.append(e);
  }
  ancien.className = neuf.className;
  ancien.dataset.plan = neuf.dataset.plan ?? '';
  ancien.dataset.k = neuf.dataset.k ?? '';
  return true;
}

const precharges = new Set<string>();
function precharger(i: number) {
  for (const src of imagesPlan(i)) {
    if (precharges.has(src)) continue;
    precharges.add(src);
    const im = new Image();
    im.src = src;
  }
}

/** Compteur d'années : il défile à l'arrivée sur un plan, puis reste sur l'année finale */
function animerCompteur() {
  const el = racine.querySelector<HTMLElement>('.compteur[data-de]');
  if (!el) return;
  const de = Number(el.dataset.de), a = Number(el.dataset.a);
  if (lignesVues > 1 || reduit) { el.textContent = String(a); return; }
  const debut = performance.now() + 500, duree = 2200;
  const pas = (now: number) => {
    if (!el.isConnected) return;
    const x = Math.min(1, Math.max(0, (now - debut) / duree));
    el.textContent = String(Math.round(de + (a - de) * (1 - (1 - x) ** 3)));
    if (x < 1) requestAnimationFrame(pas);
  };
  requestAnimationFrame(pas);
}

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
    if (mode === 'district' && (D.selection || D.carte || D.deck || D.menu)) { D.selection = null; D.carte = null; D.deck = null; D.menu = false; afficher(); return; }
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
  if (s.issue === 'defaite') {
    return { titre: 'Défaite', texte: `Toute l’escouade est à terre. Elle remonte avec la moitié du butin (${Math.floor(x.butin * J.DISTRICT.butinDefaite)} composants) et devra se reposer à la Clinique.`, bouton: 'Remonter au district', action: 'remonter' };
  }
  if (s.issue === 'victoire') {
    const nom = ennemiDef(s.ennemi.id).nom;
    if (x.terminee) {
      return { titre: `Strate −${x.strate} vaincue`, texte: `${nom} se disperse. L’escouade remonte avec ${x.butin} composants.${x.strate === jeu.strate ? ' Les ouvriers vont pouvoir creuser un nouvel étage.' : ''}`, bouton: 'Remonter au district', action: 'remonter' };
    }
    if (x.carte) return { titre: 'Victoire', texte: `${nom} se dissipe. Butin : ${x.butin} composants. L’escouade reprend sa route : les PV ne remontent qu’aux campements.`, bouton: 'Retour à la carte', action: 'suivant' };
    return { titre: 'Victoire', texte: `${nom} se dissipe. Butin : ${x.butin} composants. L’escouade souffle un peu (+50 % de PV) : tu continues, ou tu remontes avec ce que tu as ?`, bouton: 'Combat suivant', action: 'suivant', bouton2: 'Remonter avec le butin', action2: 'remonter' };
  }
  return null;
}

let idPop = 0;
function pop(cible: string, texte: string, couleur: string) {
  const id = ++idPop;
  K.pops.push({ id, cible, texte, couleur });
  setTimeout(() => {
    K.pops = K.pops.filter((p) => p.id !== id);
    if (mode === 'combat') afficher();
  }, 900);
}

function popsDe(ev: Evenement) {
  if (ev.kind === 'degats') pop(ev.cible, ev.net ? `−${ev.net}` : 'bloqué', 'var(--danger)');
  else if (ev.kind === 'bouclier') pop(ev.cible, `+${ev.v}`, 'var(--ivory)');
  else if (ev.kind === 'soin' && ev.v) pop(ev.cible, `+${ev.v}`, 'var(--bio)');
  else if (ev.kind === 'echo') pop('escouade', 'Écho', 'var(--gold)');
  else if (ev.kind === 'effet') pop(ev.cible, ev.texte, 'var(--gold)');
  else if (ev.kind === 'flux') pop('escouade', `+${ev.gain} Flux`, 'var(--gold)');
}

async function jouer(pas: Pas[]) {
  K.verrou = true;
  for (const p of pas) {
    await pause(p.ev.kind === 'resonance' ? 250 : 380);
    // la jauge touchée garde une traînée de ses PV d'avant le coup, qui se vide
    if (p.ev.kind === 'degats' && p.ev.net > 0) {
      const avant = K.etat ?? jeu.expedition?.combat;
      const cible = p.ev.cible;
      const c = cible === 'ennemi' ? avant?.ennemi : avant?.porteurs.find((x) => x.id === cible);
      if (c) {
        K.traces[cible] = Math.max(0, Math.min(100, (100 * c.pv) / c.pvMax));
        setTimeout(() => { delete K.traces[cible]; }, 1100);
      }
    }
    K.etat = p.etat;
    popsDe(p.ev);
    afficher();
  }
  await pause(300);
  K.etat = null;
  if (jeu.expedition && jeu.expedition.combat.issue !== 'en-cours') J.finDeCombat(jeu);
  K.fin = finPour();
  K.verrou = false;
  sauver();
  afficher();
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
  D.vue = v; D.selection = null; D.carte = null; D.deck = null; D.menu = false;
}

const resultat = (r: J.Resultat) => { D.message = r.ok ? '' : r.message ?? ''; if (r.ok) sauver(); };

racine.addEventListener('click', async (ev) => {
  const b = (ev.target as HTMLElement).closest<HTMLElement>('[data-action]');
  if (!b || (b as HTMLButtonElement).disabled) return;
  const a = b.dataset.action;
  const id = b.dataset.id ?? '';
  const x = jeu.expedition;
  const s = x?.combat;
  D.message = a === 'poster' || a === 'liberer' || a === 'fabriquer' || a === 'ameliorer' || a === 'choisir' || a === 'greffer' || a === 'monter' || a === 'carte' ? D.message : '';

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
    case 'intro': plan = 0; lignesVues = 1; texteCache = false; mode = 'intro'; D.menu = false; break;

    // district
    case 'batiment': D.selection = D.selection === id ? null : (id as BatimentId); D.menu = false; break;
    case 'ok-message': D.message = ''; break;
    case 'menu': D.menu = !D.menu; D.selection = null; D.carte = null; D.deck = null; break;
    case 'carte': D.carte = id; break;
    case 'carte-fermer': D.carte = null; break;
    case 'filtre': D.filtre = (id as typeof D.filtre) || 'tout'; window.scrollTo(0, 0); break;
    case 'fermer': D.selection = null; break;
    case 'chantier': D.message = 'Ce pilier accueillera le Labo génétique dans une prochaine version.'; break;
    case 'ameliorer': resultat(J.ameliorer(jeu, id as BatimentId, Date.now())); break;
    case 'poster': resultat(J.poster(jeu, id, (b.dataset.poste as J.Poste) ?? null)); break;
    case 'liberer': resultat(J.poster(jeu, id, null)); break;
    case 'fabriquer': resultat(J.fabriquer(jeu, b.dataset.module ?? '', Date.now())); break;
    case 'cartes': ouvrir('cartes'); break;
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
    case 'ouvrir-archive': resultat(J.ouvrirArchive(jeu)); break;
    case 'entrer': ouvrir('coupe'); break;
    case 'archipel': ouvrir('archipel'); break;
    case 'coupe': ouvrir('coupe'); break;
    case 'descendre': D.deck = null; D.strateChoisie = Number(b.dataset.strate ?? 1); D.escouade = J.disponibles(jeu).slice(0, 3); D.vue = 'escouade'; break;
    case 'choisir':
      if (D.escouade.includes(id)) D.escouade = D.escouade.filter((p) => p !== id);
      else if (D.escouade.length < 3) D.escouade = [...D.escouade, id];
      else D.message = 'Trois Porteurs maximum : retires-en un d’abord.';
      break;
    case 'partir': {
      const r = J.partir(jeu, D.escouade, D.strateChoisie);
      resultat(r);
      if (r.ok) { mode = 'combat'; K.fin = null; K.etat = null; window.scrollTo(0, 0); }
      break;
    }
    case 'reprendre': mode = 'combat'; K.fin = finPour(); break;
    case 'rencontre': D.vue = 'rencontre'; D.bulles = 0; break;
    case 'rencontre-suite': D.bulles = Math.min(D.bulles + 1, 3); break;
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
      if (!jeu.lus.includes(id)) { jeu.lus.push(id); sauver(); }
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
    case 'ajouter': if (s && !K.verrou) { C.ajouter(s, id || b.dataset.uid || ''); sauver(); } break;
    case 'retirer': if (s && !K.verrou) { C.retirer(s, b.dataset.uid ?? ''); sauver(); } break;
    case 'accorder': if (s && !K.verrou) { C.accorder(s, b.dataset.uid ?? ''); sauver(); } break;
    case 'vider': if (s && !K.verrou) { C.viderChaine(s); sauver(); } break;
    case 'allonger': if (s && !K.verrou) { C.allonger(s); sauver(); } break;
    case 'repiocher': if (s && !K.verrou) { C.repiocher(s); sauver(); } break;
    case 'lancer': if (s && !K.verrou) { await jouer(C.lancer(s)); return; } break;
    case 'regles': K.regles = !K.regles; break;
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
    case 'remonter': {
      const r = J.remonter(jeu);
      K.fin = null;
      mode = 'district';
      if (r.tutoriel) {
        D.vue = 'archipel';
        D.message = r.victoire
          ? 'La chambre est ouverte. Derrière la porte, une carte : l’Œil-relais. Trois recrues rejoignent le district, et un premier fragment d’archives attend dans le Codex (Tour du Noyau).'
          : 'L’escouade se repose. La porte scellée t’attend toujours.';
      } else {
        D.vue = jeu.choix.length ? 'archipel' : 'coupe';
        D.message = (r.nouvelleStrate ? `Un nouvel étage est creusé : la Strate −${jeu.strate} est ouverte.` : `+${r.butin} composants rapportés.`)
          + (r.cartes.length ? ` Carte${r.cartes.length > 1 ? 's' : ''} trouvée${r.cartes.length > 1 ? 's' : ''} : ${r.cartes.map((c) => `${moduleDef(c).nom} (${NOMS_RARETE[moduleDef(c).rarete]})`).join(', ')}.` : '')
          + (r.eclats ? ` +${r.eclats} Éclat${r.eclats > 1 ? 's' : ''}.` : '')
          + (r.fragment ? ' Un fragment d’archives rejoint le Codex.' : '');
      }
      sauver();
      window.scrollTo(0, 0);
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
});

// ---------- Le temps qui passe ----------

let dernierRendu = 0;
setInterval(() => {
  const nouvelles = J.tick(jeu, Date.now());
  if (nouvelles.length) { D.message = nouvelles[0]!; sauver(); }
  if (mode !== 'district') return;
  const vite = !!jeu.forge || jeu.chantiers.length > 0 || nouvelles.length > 0;
  if (vite || Date.now() - dernierRendu > 15_000) {
    dernierRendu = Date.now();
    // ne pas redessiner pendant que le joueur tape dans le panneau Compte
    if (document.activeElement?.tagName !== 'INPUT') afficher();
  }
}, 1000);
document.addEventListener('visibilitychange', () => { if (!document.hidden) { J.tick(jeu, Date.now()); sauver(); if (mode === 'district') afficher(); } });

K.fin = null;
afficher();
demarrerCompte();
