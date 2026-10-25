// L'écran titre, affiché à chaque lancement.
// Illustration Midjourney : public/intro/00-titre.webp.

import { particules } from './intro';
import { LOGOTYPE } from './logotype';
import { peutInstaller } from './installer';
import './debut.css';

/**
 * L'illustration fixe, avec des effets en code posés exactement sur elle (positions en % de l'image) :
 * la flamme de la lanterne qui vacille et la lueur violette des joints de la porte qui pulse.
 * Le cadre garde les proportions de l'image et se recadre comme object-position: 28 % 50 %.
 */
const imageAnimee = () => `<div class="titre-image">`
  + `<img src="./intro/00-titre.webp" alt="" decoding="async">`
  + `<span class="t-porte"></span><span class="t-flamme"></span><span class="t-halo"></span></div>`;

/** Les boutons du bas */
function basTitre(introVue: boolean): string {
  return `<div class="titre-bas"><button type="button" class="prim titre-go" data-action="titre-jouer">${introVue ? 'Reprendre' : 'Commencer'}</button>`
    + `<div class="titre-sec">${introVue ? `<button type="button" class="btn-sec" data-action="intro">Revoir l’intro</button>` : ''}<button type="button" class="btn-sec" data-action="bibliotheque">Chroniques</button></div>`
    + (peutInstaller() ? `<button type="button" class="titre-installer" data-action="installer"><img src="./favicon-32.png" alt="" width="16" height="16">Installer le jeu sur l’écran d’accueil</button>` : '')
    + `<small class="titre-version">Alpha</small></div>`;
}

export function htmlTitre(introVue: boolean, mouvement: boolean): string {
  return `<section class="titre" data-action="titre-jouer" style="--image:url(./intro/00-titre.webp)" aria-label="EMPREINTES, écran titre">`
    + `<div class="titre-fond" aria-hidden="true">${imageAnimee()}</div>`
    + (mouvement ? particules('cristal') : '')
    + `<div class="titre-voile" aria-hidden="true"></div>`
    + `<header class="titre-haut"><h1 class="titre-nom">${LOGOTYPE}</h1>`
    + `<p class="titre-sous">2121 · Sous les eaux, d’autres se souviennent encore.</p></header>`
    + basTitre(introVue) + `</section>`;
}
