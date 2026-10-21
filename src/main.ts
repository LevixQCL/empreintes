import './ui/styles.css';
import * as C from './core/combat';
import { ennemiDef } from './core/donnees';
import * as J from './core/jeu';
import type { BatimentId, CombatEtat, Evenement, Pas } from './core/types';
import { charger, enregistrer, type Enveloppe } from './save/local';
import { firebaseActif } from './net/firebase-config';
import { htmlCombat, type Ecran as EcranCombat, type Fin, type Compte } from './ui/vue';
import { htmlArchipel, htmlCoupe, htmlEscouade, type EcranDistrict } from './ui/district';
import { PLANS, htmlIntro } from './ui/intro';

const racine = document.getElementById('app') as HTMLElement;
const reduit = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const pause = (ms: number) => new Promise((r) => setTimeout(r, reduit ? Math.min(ms, 120) : ms));

// ---------- État ----------

const sauvegarde = charger();
let jeu: J.Jeu = sauvegarde?.data ?? J.nouveauJeu(Date.now());
J.tick(jeu, Date.now());

type Mode = 'intro' | 'district' | 'combat';
let mode: Mode = !jeu.introVue ? 'intro' : jeu.expedition ? 'combat' : 'district';
let plan = 0;
let lignesVues = 1;

const compteEtat: Compte = { actif: firebaseActif(), ouvert: false, utilisateur: null, occupe: false, erreur: '', info: '', synchro: 'aucune' };
const D: EcranDistrict = { j: jeu, vue: 'archipel', selection: null, escouade: [], strateChoisie: 1, message: '', compte: compteEtat, now: Date.now() };
const K: { verrou: boolean; regles: boolean; pops: EcranCombat['pops']; fin: Fin | null; etat: CombatEtat | null } = {
  verrou: false, regles: !jeu.introVue || jeu.strate === 1, pops: [], fin: null, etat: null,
};

// ---------- Rendu ----------

function afficher() {
  D.j = jeu;
  D.now = Date.now();
  const email = (racine.querySelector('#email') as HTMLInputElement | null)?.value ?? '';
  const mdp = (racine.querySelector('#mdp') as HTMLInputElement | null)?.value ?? '';
  let h = '';
  if (mode === 'intro') h = htmlIntro(plan, lignesVues);
  else if (mode === 'combat' && jeu.expedition) {
    h = htmlCombat({ x: jeu.expedition, etat: K.etat ?? jeu.expedition.combat, verrou: K.verrou, regles: K.regles, pops: K.pops, fin: K.fin });
  } else {
    mode = 'district';
    h = D.vue === 'coupe' ? htmlCoupe(D) : D.vue === 'escouade' ? htmlEscouade(D) : htmlArchipel(D);
  }
  racine.dataset.mode = mode;
  racine.innerHTML = h;
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

// ---------- Combat ----------

function finPour(): Fin | null {
  const x = jeu.expedition;
  if (!x) return null;
  const s = x.combat;
  if (s.issue === 'defaite') {
    return { titre: 'Défaite', texte: `Toute l’escouade est à terre. Elle remonte avec la moitié du butin (${Math.floor(x.butin * J.DISTRICT.butinDefaite)} composants) et devra se reposer à la Clinique.`, bouton: 'Remonter au district', action: 'remonter' };
  }
  if (s.issue === 'victoire') {
    const nom = ennemiDef(s.ennemi.id).nom;
    if (x.terminee) {
      return { titre: `Strate −${x.strate} vaincue`, texte: `${nom} se disperse. L’escouade remonte avec ${x.butin} composants.${x.strate === jeu.strate ? ' Les ouvriers vont pouvoir creuser un nouvel étage.' : ''}`, bouton: 'Remonter au district', action: 'remonter' };
    }
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
}

async function jouer(pas: Pas[]) {
  K.verrou = true;
  for (const p of pas) {
    await pause(p.ev.kind === 'resonance' ? 250 : 380);
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

const resultat = (r: J.Resultat) => { D.message = r.ok ? '' : r.message ?? ''; if (r.ok) sauver(); };

racine.addEventListener('click', async (ev) => {
  const b = (ev.target as HTMLElement).closest<HTMLElement>('[data-action]');
  if (!b || (b as HTMLButtonElement).disabled) return;
  const a = b.dataset.action;
  const id = b.dataset.id ?? '';
  const x = jeu.expedition;
  const s = x?.combat;
  D.message = a === 'poster' || a === 'liberer' || a === 'fabriquer' || a === 'ameliorer' || a === 'choisir' ? D.message : '';

  switch (a) {
    // intro
    case 'intro-suivant':
      if (lignesVues < PLANS[plan]!.lignes.length) lignesVues++;
      else if (plan < PLANS.length - 1) { plan++; lignesVues = 1; }
      break;
    case 'intro-precedent': if (plan > 0) { plan--; lignesVues = PLANS[plan]!.lignes.length; } break;
    case 'intro-passer': jeu.introVue = true; mode = jeu.expedition ? 'combat' : 'district'; sauver(); break;
    case 'intro': plan = 0; lignesVues = 1; mode = 'intro'; break;

    // district
    case 'batiment': D.selection = D.selection === id ? null : (id as BatimentId); break;
    case 'fermer': D.selection = null; break;
    case 'chantier': D.message = 'Ce pilier accueillera le Labo génétique dans une prochaine version.'; break;
    case 'ameliorer': resultat(J.ameliorer(jeu, id as BatimentId)); break;
    case 'poster': resultat(J.poster(jeu, id, (b.dataset.poste as J.Poste) ?? null)); break;
    case 'liberer': resultat(J.poster(jeu, id, null)); break;
    case 'fabriquer': resultat(J.fabriquer(jeu, b.dataset.module ?? '', id, Date.now())); break;
    case 'entrer': D.vue = 'coupe'; D.selection = null; break;
    case 'archipel': D.vue = 'archipel'; break;
    case 'coupe': D.vue = 'coupe'; break;
    case 'descendre': D.strateChoisie = Number(b.dataset.strate ?? 1); D.escouade = J.disponibles(jeu).slice(0, 3); D.vue = 'escouade'; break;
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

    // combat
    case 'ajouter': if (s && !K.verrou) { C.ajouter(s, id || b.dataset.uid || ''); sauver(); } break;
    case 'retirer': if (s && !K.verrou) { C.retirer(s, b.dataset.uid ?? ''); sauver(); } break;
    case 'vider': if (s && !K.verrou) { C.viderChaine(s); sauver(); } break;
    case 'allonger': if (s && !K.verrou) { C.allonger(s); sauver(); } break;
    case 'repiocher': if (s && !K.verrou) { C.repiocher(s); sauver(); } break;
    case 'lancer': if (s && !K.verrou) { await jouer(C.lancer(s)); return; } break;
    case 'regles': K.regles = !K.regles; break;
    case 'suivant': J.continuer(jeu); K.fin = null; sauver(); window.scrollTo(0, 0); break;
    case 'remonter': {
      const r = J.remonter(jeu);
      K.fin = null;
      mode = 'district';
      D.vue = 'coupe';
      D.message = r.nouvelleStrate ? `Un nouvel étage est creusé : la Strate −${jeu.strate} est ouverte.` : `+${r.butin} composants rapportés.`;
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
  const vite = !!jeu.forge || nouvelles.length > 0;
  if (vite || Date.now() - dernierRendu > 15_000) {
    dernierRendu = Date.now();
    // ne pas redessiner pendant que le joueur tape dans le panneau Compte
    if (document.activeElement?.tagName !== 'INPUT') afficher();
  }
}, 1000);
document.addEventListener('visibilitychange', () => { if (!document.hidden) { J.tick(jeu, Date.now()); sauver(); if (mode === 'district') afficher(); } });

K.fin = mode === 'combat' ? finPour() : null;
afficher();
demarrerCompte();
