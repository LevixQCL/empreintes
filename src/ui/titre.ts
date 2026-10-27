// L'écran titre, affiché à chaque lancement.
// Illustration Midjourney : public/intro/00-titre.webp.

import { particules } from './intro';
import { LOGOTYPE } from './logotype';
import { ICO } from './icones';
import { peutInstaller } from './installer';
import { echap } from './outils';

/**
 * L'illustration fixe, avec des effets en code posés exactement sur elle (positions en % de l'image) :
 * la flamme de la lanterne qui vacille et la lueur violette des joints de la porte qui pulse.
 * Le cadre garde les proportions de l'image et se recadre comme object-position: 28 % 50 %.
 */
const imageAnimee = () => `<div class="titre-image">`
  + `<img src="./intro/00-titre.webp" alt="" decoding="async">`
  + `<span class="t-porte"></span><span class="t-flamme"></span><span class="t-halo"></span></div>`;

/**
 * Le compte sur l'écran titre (25 octobre 2026) : on attend la partie du compte avant d'ouvrir le jeu,
 * on dit avec quel compte on joue, et on peut s'y connecter sans entrer dans le district.
 * panneau : le contenu du panneau Compte quand il est ouvert.
 */
export interface TitreCompte {
  etat: 'attente' | 'connecte' | 'invisible' | 'invite';
  nom: string;
  strate: number;
  panneau: string | null;
}

function ligneCompte(c: TitreCompte): string {
  // pendant l'attente, la place de la ligne est gardée : les boutons ne sautent pas quand elle arrive
  if (c.etat === 'attente') return `<span class="titre-compte fantome" aria-hidden="true">${ICO.compte}<span>&nbsp;</span></span>`;
  if (c.etat === 'connecte') return `<button type="button" class="titre-compte connecte" data-action="titre-compte" aria-label="Compte : ${echap(c.nom)}, Strate −${c.strate}">`
    + `${ICO.ok}<span>${echap(c.nom)}</span><small>Strate −${c.strate}</small></button>`;
  if (c.etat === 'invisible') return `<button type="button" class="titre-compte" data-action="titre-compte">${ICO.compte}<span>Partie de ce téléphone · <b>La protéger</b></span></button>`;
  return `<button type="button" class="titre-compte" data-action="titre-compte">${ICO.compte}<span>Déjà un compte ? <b>Se connecter</b></span></button>`;
}

/** Les boutons du bas */
function basTitre(introVue: boolean, c: TitreCompte | null): string {
  const go = c?.etat === 'attente'
    ? `<button type="button" class="prim titre-go attente" disabled aria-busy="true"><span class="titre-anneau" aria-hidden="true"></span>Récupération de ta partie…</button>`
    : `<button type="button" class="prim titre-go" data-action="titre-jouer">${introVue ? 'Reprendre' : 'Commencer'}</button>`;
  return `<div class="titre-bas">${go}`
    + `<div class="titre-sec">${introVue ? `<button type="button" class="btn-sec" data-action="intro">Revoir l’intro complète</button>` : ''}<button type="button" class="btn-sec" data-action="bibliotheque">Chroniques</button></div>`
    + (c ? ligneCompte(c) : '')
    + (peutInstaller() ? `<button type="button" class="titre-installer" data-action="installer"><img src="./favicon-32.png" alt="" width="16" height="16">Installer le jeu sur l’écran d’accueil</button>` : '')
    + `<small class="titre-version">Alpha</small></div>`;
}

export function htmlTitre(introVue: boolean, mouvement: boolean, c: TitreCompte | null = null): string {
  // toucher l'écran ouvre la partie, sauf pendant qu'on récupère celle du compte
  return `<section class="titre"${c?.etat === 'attente' ? '' : ' data-action="titre-jouer"'} style="--image:url(./intro/00-titre.webp)" aria-label="EMPREINTES, écran titre">`
    + `<div class="titre-fond" aria-hidden="true">${imageAnimee()}</div>`
    + (mouvement ? particules('cristal') : '')
    + `<div class="titre-voile" aria-hidden="true"></div>`
    + `<header class="titre-haut"><h1 class="titre-nom">${LOGOTYPE}</h1>`
    + `<p class="titre-sous">2121 · Sous les eaux, d’autres se souviennent encore.</p></header>`
    + basTitre(introVue, c) + `</section>`
    + (c?.panneau ? `<div class="titre-voile-feuille" data-action="titre-compte" aria-hidden="true"></div>`
      + `<section class="titre-feuille" role="dialog" aria-modal="true" aria-label="Compte">`
      + `<button type="button" class="titre-fermer" data-action="titre-compte" aria-label="Fermer">${ICO.fermer}</button>${c.panneau}</section>` : '');
}
