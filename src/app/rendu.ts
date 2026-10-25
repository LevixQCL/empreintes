// Le rendu : redessine l'écran courant à partir de l'état (positions de défilement et champs de saisie gardés).

import { decouverteEnAttente } from '../core/decouvertes';
import * as J from '../core/jeu';
import { htmlBriefing } from '../ui/briefing';
import { activerCartes } from '../ui/carte';
import { htmlClassements } from '../ui/classements';
import { brancherTableau, htmlArchipel, htmlCartes, htmlCodex, htmlCoupe, htmlEscouade, htmlRencontre } from '../ui/district';
import { htmlExploration } from '../ui/exploration';
import { trouveesDe } from '../ui/guide';
import { htmlIntro } from '../ui/intro';
import { animerCompteur, majIntro, precharger } from '../ui/intro-lecteur';
import { htmlPorteurs } from '../ui/porteurs';
import { visuel as ageDistrict } from '../ui/art';
import { htmlTitre, type TitreCompte } from '../ui/titre';
import { glisser, horloge, noter } from '../ui/toucher';
import { htmlCombat, panneauCompte } from '../ui/vue';
import { app, compteEtat, D, G, K, racine, reduit } from './etat';
import { sauver } from './synchro';

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
    panneau: compteEtat.ouvert ? panneauCompte(compteEtat) : null,
  };
}

export function afficher() {
  D.j = app.jeu;
  D.uid = app.uid;
  compteEtat.pseudo = app.jeu.directeur?.nom;
  D.now = Date.now();
  const email = (racine.querySelector('#email') as HTMLInputElement | null)?.value ?? '';
  const mdp = (racine.querySelector('#mdp') as HTMLInputElement | null)?.value ?? '';
  const pseudoTape = (racine.querySelector('#gt-nom') as HTMLInputElement | null)?.value;
  let h = '';
  if (app.mode === 'titre') h = htmlTitre(app.jeu.introVue, !reduit, compteTitre());
  else if (app.mode === 'intro') h = htmlIntro(app.plan, app.lignesVues, !reduit, app.texteCache);
  else if (app.mode === 'combat' && app.jeu.expedition?.carte && app.jeu.expedition.phase === 'carte') h = htmlExploration(app.jeu);
  else if (app.mode === 'combat' && app.jeu.expedition) {
    const etat = K.etat ?? app.jeu.expedition.combat;
    const lecon = app.jeu.expedition.tutoriel && etat.issue === 'en-cours' ? J.leconTutoriel(etat.tour) : undefined;
    // une mécanique rencontrée pour la première fois : expliquée entre deux tours (jamais pendant le combat guidé)
    // une seule par tour (sauf la phase d'un gardien) : quatre fenêtres d'affilée noieraient le joueur
    const tourCombat = `${app.jeu.expedition.sequence.length}:${etat.tour}`;
    const enAttente = !K.verrou && !K.fin && !app.jeu.expedition.tutoriel && etat.issue === 'en-cours' ? decouverteEnAttente(app.jeu.decouvertes ?? [], etat) : null;
    const decouverte = enAttente && (enAttente.id === 'phase' || K.decouverteTour !== tourCombat || K.decouverteId === enAttente.id) ? enAttente : null;
    if (decouverte) { K.decouverteTour = tourCombat; K.decouverteId = decouverte.id; }
    h = htmlCombat({ x: app.jeu.expedition, etat, verrou: K.verrou, regles: K.regles, fuite: K.fuite, eclats: K.eclats, guide: K.guide, trouvees: trouveesDe(app.jeu.collection), pops: K.pops, fin: K.fin, lecon, traces: K.traces, ...(K.actif !== undefined ? { actif: K.actif } : {}), ...(decouverte ? { decouverte } : {}) });
  } else {
    app.mode = 'district';
    voirNouveautes();
    proposerProtection();
    h = D.vue === 'coupe' ? htmlCoupe(D) : D.vue === 'escouade' ? htmlEscouade(D) : D.vue === 'rencontre' ? htmlRencontre(D.bulles) : D.vue === 'briefing' ? htmlBriefing(D.etape)
      : D.vue === 'codex' ? htmlCodex(D) : D.vue === 'cartes' ? htmlCartes(D) : D.vue === 'porteurs' ? htmlPorteurs(D) : D.vue === 'classements' ? htmlClassements(D, G, app.uid) : htmlArchipel(D);
  }
  racine.dataset.mode = app.mode;
  // chaque sorte de zone garde ses positions à part : une liste qui apparaît ou disparaît ne décale pas les autres
  const defile = DEFILANTS.map((sel) => [...racine.querySelectorAll<HTMLElement>(sel)].map((el) => [el.scrollTop, el.scrollLeft] as const));
  const avant = cles();
  const places = noter(racine);
  horloge(racine);
  if (!(app.mode === 'intro' && majIntro(racine, h, reduit)) && !(app.mode === 'titre' && majTitre(h))) racine.innerHTML = h;
  glisser(racine, places);
  DEFILANTS.forEach((sel, k) => racine.querySelectorAll<HTMLElement>(sel).forEach((el, i) => { const d = defile[k]?.[i]; if (d) { el.scrollTop = d[0]; el.scrollLeft = d[1]; } }));
  for (const [sel, cle] of Object.entries(cles())) if (cle && cle !== avant[sel]) racine.querySelector(sel)?.classList.add('entre');
  document.body.classList.toggle('fige', !!racine.querySelector('.feuille, .voile'));
  if (app.mode === 'district') { activerCartes(racine); brancherTableau(racine); }
  if (app.mode === 'intro') { precharger(app.plan); precharger(app.plan + 1); animerCompteur(racine, app.lignesVues, reduit); }
  D.uid = app.uid;
  const ie = racine.querySelector('#email') as HTMLInputElement | null;
  const im = racine.querySelector('#mdp') as HTMLInputElement | null;
  if (ie) ie.value = email;
  const ip = racine.querySelector('#gt-nom') as HTMLInputElement | null;
  if (ip && pseudoTape !== undefined) ip.value = pseudoTape;
  if (im) im.value = mdp;
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
