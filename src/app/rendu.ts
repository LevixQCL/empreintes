// Le rendu : redessine l'écran courant à partir de l'état (positions de défilement et champs de saisie gardés).

import { htmlPillages } from '../ui/pillages';
import { htmlFleche } from '../ui/fleche';
import { repliqueGardien, sceneDef } from '../core/campagne';
import { tousEnnemis } from '../core/combat';
import { ennemiDef } from '../core/donnees';
import { decouvertesEnAttente, decouvertesExploration } from '../core/decouvertes';
import * as J from '../core/jeu';
import { htmlBriefing } from '../ui/briefing';
import { htmlScene } from '../ui/campagne';
import { activerCartes } from '../ui/carte';
import { htmlClassements } from '../ui/classements';
import { htmlRecruter } from '../ui/parrainage';
import { choisirDos } from '../ui/gains';
import { R } from './parrainage';
import { brancherTableau, htmlArchipel, htmlCartes, htmlCodex, htmlCoupe, htmlEscouade, htmlRencontre } from '../ui/district';
import { htmlExploration } from '../ui/exploration';
import { trouveesDe } from '../ui/guide';
import { htmlIntro } from '../ui/intro';
import { animerCompteur, majIntro, precharger } from '../ui/intro-lecteur';
import { htmlPorteurs } from '../ui/porteurs';
import { visuel as ageDistrict } from '../ui/art';
import { htmlTitre, type TitreCompte } from '../ui/titre';
import { glisser, horloge, noter } from '../ui/toucher';
import { htmlCombat, htmlDecouverte, panneauCompte } from '../ui/vue';
import { annoncerGardien } from '../ui/bandeau';
import { app, compteEtat, D, G, K, racine, reduit } from './etat';
import { sauver } from './synchro';
import { signaler } from './incident';

// ---------- Rendu ----------

/** zones qui défilent toutes seules : on garde leur position d'un rendu à l'autre (le district se redessine chaque seconde) */
const DEFILANTS = ['.feuille-corps', '.rangee', '.main', '.rail', '.fb-rangee', '.cl-filtres', '.es-cibles'];
/** une feuille, une fenêtre ou un message ne s'animent qu'à leur apparition */
function cles(): Record<string, string> {
  const t = (sel: string) => racine.querySelector(sel)?.querySelector('h2')?.textContent ?? racine.querySelector(sel)?.textContent ?? '';
  return { '.feuille': t('.feuille'), '.fenetre': t('.fenetre'), '.toast': t('.toast') };
}

/**
 * L'écran titre déjà affiché (le compte qui répond, le panneau qui s'ouvre) : on ne remplace que le bas et la feuille du compte,
 * pour ne pas rejouer l'apparition du logotype ni recadrer l'illustration.
 */
function majTitre(h: string): boolean {
  const section = racine.querySelector<HTMLElement>(':scope > .titre');
  const bas = section?.querySelector('.titre-bas');
  if (!section || !bas) return false;
  const neuf = document.createElement('template');
  neuf.innerHTML = h;
  const nouveau = neuf.content.querySelector('.titre');
  const nouveauBas = nouveau?.querySelector('.titre-bas');
  if (!nouveau || !nouveauBas) return false;
  nouveauBas.classList.add('vu');
  bas.replaceWith(nouveauBas);
  section.toggleAttribute('data-action', nouveau.hasAttribute('data-action'));
  if (nouveau.hasAttribute('data-action')) section.dataset.action = nouveau.getAttribute('data-action')!;
  racine.querySelectorAll(':scope > .titre-voile-feuille, :scope > .titre-feuille').forEach((el) => el.remove());
  racine.append(...[...neuf.content.children].filter((el) => el !== nouveau));
  return true;
}

/** les Strates où le jeu propose de protéger la partie ; ensuite, toutes les 5 Strates */
const PALIERS_RAPPEL = [2, 4, 7, 10];
const palierRappel = (strate: number) => (strate >= 15 ? strate - (strate % 5) : [...PALIERS_RAPPEL].reverse().find((p) => strate >= p) ?? 0);

/**
 * « Protège ta partie » : au retour sur l'archipel, une fois par palier, tant que la partie n'est reliée à aucun compte.
 * Jamais par-dessus une autre fenêtre (résumé du retour, nouvel âge du district, décision de la campagne).
 */
function proposerProtection() {
  const j = app.jeu;
  const palier = palierRappel(j.strate);
  if (!compteEtat.utilisateur?.anonyme || D.rappel || !palier || palier <= (j.rappelCompte ?? 0)) return;
  if (D.vue !== 'archipel' || D.menu || D.selection || D.ressource || D.retour.length || J.decisionEnAttente(j)) return;
  if ((j.ageVu ?? 1) < ageDistrict(j.batiments.noyau)) return;
  j.rappelCompte = palier;
  D.rappel = true;
  sauver();
}

/** Le compte tel que l'écran titre le montre (rien si Firebase n'est pas configuré) */
function compteTitre(): TitreCompte | null {
  if (!compteEtat.actif) return null;
  const u = compteEtat.utilisateur;
  return {
    etat: !compteEtat.pret ? 'attente' : u?.anonyme ? 'invisible' : u ? 'connecte' : 'invite',
    nom: app.jeu.directeur?.nom ?? u?.nom ?? '',
    strate: app.jeu.strate,
    panneau: compteEtat.ouvert ? panneauCompte(compteEtat, !app.jeu.introVue) : null,
  };
}

/** Redessine l'écran. Une erreur d'affichage ouvre la fenêtre du filet de sécurité au lieu de figer le jeu */
export function afficher() {
  try { dessiner(); } catch (e) { signaler(e, 'affichage', afficher); }
}

function dessiner() {
  D.j = app.jeu;
  choisirDos(J.aCosmetique(app.jeu, 'dos-partage') ? 'dos-partage' : '');
  D.uid = app.uid;
  compteEtat.pseudo = app.jeu.directeur?.nom;
  D.now = Date.now();
  const email = (racine.querySelector('#email') as HTMLInputElement | null)?.value ?? '';
  const mdp = (racine.querySelector('#mdp') as HTMLInputElement | null)?.value ?? '';
  const pseudoTape = (racine.querySelector('#gt-nom') as HTMLInputElement | null)?.value;
  let h = '';
  if (app.mode === 'titre') h = htmlTitre(app.jeu.introVue, !reduit, compteTitre());
  else if (app.mode === 'intro') h = htmlIntro(app.plan, app.lignesVues, !reduit, app.texteCache, app.introLongue);
  else if (app.mode === 'combat' && app.jeu.expedition?.carte && app.jeu.expedition.phase === 'carte') {
    h = htmlExploration(app.jeu, K.salleVue, { details: K.halteVus ?? [], porte: K.porteChoix ?? [] });
    // le contenu des Strates s'explique la première fois qu'il apparaît (31 octobre 2026), une fenêtre à la fois
    const vues = app.jeu.decouvertes ?? [];
    const toutes = decouvertesExploration(app.jeu.expedition, app.jeu.quetes);
    const attente = toutes.filter((d) => !vues.includes(d.id));
    if (attente[0]) {
      const lot = toutes.filter((d) => !vues.includes(d.id) || K.decouvertesExpl?.includes(d.id));
      K.decouvertesExpl = lot.map((d) => d.id);
      h += htmlDecouverte(attente[0], lot.length > 1 ? { n: lot.length - attente.length + 1, total: lot.length } : undefined);
    } else K.decouvertesExpl = undefined;
  }
  else if (app.mode === 'combat' && app.jeu.expedition) {
    const etat = K.etat ?? app.jeu.expedition.combat;
    const lecon = app.jeu.expedition.tutoriel && etat.issue === 'en-cours' ? J.leconTutoriel(etat.tour) : undefined;
    // une mécanique rencontrée pour la première fois : expliquée avant d'en avoir besoin (jamais pendant le combat guidé).
    // Au premier tour, tout ce qui compte dès le départ s'enchaîne avant le premier coup (« 1 / 3 ») ;
    // ensuite une seule par tour (sauf la phase d'un gardien), au moment où elle s'allume
    const tourCombat = `${app.jeu.expedition.sequence.length}:${etat.tour}`;
    const attente = !K.verrou && !K.fin && !app.jeu.expedition.tutoriel && etat.issue === 'en-cours' ? decouvertesEnAttente(app.jeu.decouvertes ?? [], etat) : [];
    const enAttente = attente[0] ?? null;
    const lot = etat.tour === 1 && !etat.chaine.length;
    const decouverte = enAttente && (lot || enAttente.id === 'phase' || K.decouverteTour !== tourCombat || K.decouverteId === enAttente.id) ? enAttente : null;
    let page: { n: number; total: number } | undefined;
    if (decouverte) {
      if (K.decouverteTour !== tourCombat) K.decouverteLot = 0;
      if (K.decouverteId !== decouverte.id) K.decouverteLot = (K.decouverteLot ?? 0) + 1;
      K.decouverteTour = tourCombat; K.decouverteId = decouverte.id;
      const total = lot ? (K.decouverteLot ?? 1) - 1 + attente.length : 1;
      if (total > 1) page = { n: K.decouverteLot ?? 1, total };
    }
    const parole = paroleGardien(etat);
    h = htmlCombat({ x: app.jeu.expedition, etat, parole, verrou: K.verrou, regles: K.regles, journal: K.journal, fuite: K.fuite, eclats: K.eclats, ...(K.tuile ? { tuile: K.tuile } : {}), guide: K.guide, trouvees: trouveesDe(app.jeu.collection), pops: K.pops, fin: K.fin, lecon, traces: K.traces, ...(K.actif !== undefined ? { actif: K.actif } : {}), ...(decouverte ? { decouverte, ...(page ? { decouvertePage: page } : {}) } : {}) });
  } else {
    app.mode = 'district';
    voirNouveautes();
    proposerProtection();
    h = D.vue === 'coupe' ? htmlCoupe(D) : D.vue === 'escouade' ? htmlEscouade(D) : D.vue === 'rencontre' ? htmlRencontre(D.bulles) : D.vue === 'briefing' ? htmlBriefing(D.etape) : D.vue === 'accueil' ? htmlBriefing(D.etape, 'district')
      : D.vue === 'codex' ? htmlCodex(D) : D.vue === 'cartes' ? htmlCartes(D) : D.vue === 'porteurs' ? htmlPorteurs(D) : D.vue === 'classements' ? htmlClassements(D, G, app.uid) : D.vue === 'pillages' ? htmlPillages(D) : D.vue === 'fleche' ? htmlFleche(D) : D.vue === 'recruter' ? htmlRecruter(D, R, !!app.uid) : htmlArchipel(D);
    // une scène de la campagne : au retour sur l'archipel ou dans la Tour, par-dessus tout (ou rejouée depuis la Bibliothèque)
    const revoir = D.revoir ? sceneDef(D.revoir) : undefined;
    const scene = revoir ?? (!D.menu && (D.vue === 'archipel' || D.vue === 'coupe') ? J.sceneCampagne(app.jeu) : null);
    if (scene) h = htmlScene(scene, J.contexteCampagne(app.jeu), D.scene ?? 0, !!revoir);
    else D.scene = 0;
  }
  racine.dataset.mode = app.mode;
  // chaque sorte de zone garde ses positions à part : une liste qui apparaît ou disparaît ne décale pas les autres
  const defile = DEFILANTS.map((sel) => [...racine.querySelectorAll<HTMLElement>(sel)].map((el) => [el.scrollTop, el.scrollLeft] as const));
  const avant = cles();
  // les volets dépliés (journal du combat…) restent dépliés d'un rendu à l'autre : ceux qui portent un id
  const deplies = new Set([...racine.querySelectorAll<HTMLDetailsElement>('details[id]')].map((d) => `${d.id}:${d.open}`));
  const places = noter(racine);
  horloge(racine);
  if (!(app.mode === 'intro' && majIntro(racine, h, reduit)) && !(app.mode === 'titre' && majTitre(h))) racine.innerHTML = h;
  for (const d of racine.querySelectorAll<HTMLDetailsElement>('details[id]')) {
    if (deplies.has(`${d.id}:true`)) d.open = true;
    else if (deplies.has(`${d.id}:false`)) d.open = false;
  }
  glisser(racine, places);
  DEFILANTS.forEach((sel, k) => racine.querySelectorAll<HTMLElement>(sel).forEach((el, i) => { const d = defile[k]?.[i]; if (d) { el.scrollTop = d[0]; el.scrollLeft = d[1]; } }));
  for (const [sel, cle] of Object.entries(cles())) if (cle && cle !== avant[sel]) racine.querySelector(sel)?.classList.add('entre');
  document.body.classList.toggle('fige', !!racine.querySelector('.feuille, .voile'));
  if (app.mode === 'district') { activerCartes(racine); brancherTableau(racine); }
  if (app.mode === 'combat') { entreeGardien(); centrerPlan(); }
  if (app.mode === 'intro') { precharger(app.plan); precharger(app.plan + 1); animerCompteur(racine, app.lignesVues, reduit); }
  D.uid = app.uid;
  const ie = racine.querySelector('#email') as HTMLInputElement | null;
  const im = racine.querySelector('#mdp') as HTMLInputElement | null;
  if (ie) ie.value = email;
  const ip = racine.querySelector('#gt-nom') as HTMLInputElement | null;
  if (ip && pseudoTape !== undefined) ip.value = pseudoTape;
  if (im) im.value = mdp;
}

/**
 * Le plan de la Strate (28 octobre 2026) : à chaque nouvelle salle, le plan défile pour montrer l'escouade et les salles
 * où elle peut aller (sur téléphone, le plan est plus haut que l'écran). Une fois par salle : le joueur reste libre de faire défiler.
 */
let planCentre = '';
function centrerPlan() {
  const x = app.jeu.expedition;
  const ici = racine.querySelector<HTMLElement>('.ex-salle.ici');
  if (!x?.carte || !ici) return;
  const cle = `${x.strate}:${x.carte.rng}:${x.carte.position}`;
  if (cle === planCentre) return;
  planCentre = cle;
  // l'entrée est déjà en haut de l'écran : on ne bouge que plus bas dans la Strate
  if (x.carte.salles[x.carte.position]?.type === 'entree') return;
  requestAnimationFrame(() => ici.scrollIntoView({ block: 'center', behavior: reduit ? 'auto' : 'smooth' }));
}

/** L'entrée d'un gardien (27 octobre 2026) : un bandeau, une fois, quand l'escouade entre dans sa salle */
let gardienAnnonce = '';
function entreeGardien() {
  const x = app.jeu.expedition;
  const etat = K.etat ?? x?.combat;
  if (!x?.carte || x.phase !== 'combat' || x.tutoriel || !etat || etat.issue !== 'en-cours' || etat.tour !== 1 || etat.chaine.length) return;
  const salle = x.carte.salles[x.carte.position];
  if (salle?.type !== 'gardien' || !salle.ennemi) return;
  const cle = `${x.strate}:${x.sequence.length}:${x.carte.position}`;
  // une fenêtre ouverte (première rencontre d'une mécanique) passe d'abord : le bandeau viendra quand elle sera fermée
  if (cle === gardienAnnonce || racine.querySelector('.voile, .fenetre')) return;
  gardienAnnonce = cle;
  annoncerGardien(salle.ennemi, x.strate, reduit);
}

/**
 * Ce que dit le gardien (campagne.ts) : en entrant dans sa salle, tant que la première chaîne n'est pas lancée,
 * puis au tour qui suit son passage en seconde phase (la réplique remplace le conseil sous la chaîne, tant qu'elle est vide). Jamais dans une fouille, une Épreuve ou le combat guidé.
 */
function paroleGardien(etat: import('../core/types').CombatEtat): { nom: string; texte: string } | undefined {
  const x = app.jeu.expedition;
  if (!x?.carte || x.fouille || x.epreuve || x.tutoriel || etat.issue !== 'en-cours') return undefined;
  if (x.carte.salles[x.carte.position]?.type !== 'gardien') return undefined;
  const boss = tousEnnemis(etat).find((en) => en.id === x.carte!.salles[x.carte!.position]!.ennemi);
  if (!boss) return undefined;
  const nom = ennemiDef(boss.id).nom;
  // la phase change pendant la chaîne du joueur : sa réplique s'affiche au tour suivant, tant que la chaîne est vide
  if (boss.phase2 && boss.pv > 0) {
    K.phaseTour ??= etat.tour;
    return etat.tour <= K.phaseTour + 1 && !etat.chaine.length ? { nom, texte: repliqueGardien(x.strate, 'phase') } : undefined;
  }
  K.phaseTour = undefined;
  return etat.tour === 1 && !etat.chaine.length ? { nom, texte: repliqueGardien(x.strate, 'avant') } : undefined;
}

// Les pastilles « Nouveau » (23 octobre 2026) : elles restent tant qu'on est sur l'écran qui les montre,
// et s'effacent quand on le quitte (ou plus tôt, en ouvrant la fiche du Porteur ou le détail de la carte).
let ecranVu = '';
function voirNouveautes() {
  const ecran = D.vue === 'porteurs' && D.reserve ? 'tous-porteurs' : D.vue;
  let change = false;
  if (ecranVu === 'cartes' && ecran !== 'cartes') change = J.marquerVus(app.jeu, 'cartes', Object.keys(app.jeu.collection)) || change;
  if (ecranVu === 'tous-porteurs' && ecran !== 'tous-porteurs') change = J.marquerVus(app.jeu, 'porteurs', J.porteursPresents(app.jeu)) || change;
  if (D.porteur) change = J.marquerVus(app.jeu, 'porteurs', [D.porteur]) || change;
  if (D.carte) change = J.marquerVus(app.jeu, 'cartes', [D.carte]) || change;
  ecranVu = ecran;
  if (change) sauver();
}
