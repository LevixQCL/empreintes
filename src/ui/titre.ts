// L'écran titre, affiché à chaque lancement.
// Illustration Midjourney attendue dans public/intro/00-titre.webp ; tant qu'elle manque, un fond animé en code la remplace.

import { particules } from './intro';

/** passe à true quand public/intro/00-titre.webp est déposée */
export const IMAGE_TITRE = true;
/** courte vidéo en boucle aller-retour (public/intro/00-titre.mp4/.webm), sa première image sert d'affiche */
export const VIDEO_TITRE = false;

const fondCode = () => `<svg class="titre-scene" viewBox="0 0 360 640" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
  <defs>
    <linearGradient id="t-ciel" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1B2236"/><stop offset=".45" stop-color="#7A4E3A"/><stop offset=".62" stop-color="#E8A05A"/></linearGradient>
    <linearGradient id="t-mer" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2F5C72"/><stop offset="1" stop-color="#0C1218"/></linearGradient>
    <radialGradient id="t-lueur"><stop offset="0" stop-color="#B9A6FF" stop-opacity=".55"/><stop offset="1" stop-color="#B9A6FF" stop-opacity="0"/></radialGradient>
  </defs>
  <rect width="360" height="400" fill="url(#t-ciel)"/>
  <g class="t-hauts">${([[60, 120], [250, 90], [320, 160]] as [number, number][]).map(([x, y]) => `<ellipse cx="${x}" cy="${y}" rx="26" ry="6" fill="#3A3448"/><path d="M${x - 22} ${y} L${x} ${y + 20} L${x + 22} ${y} Z" fill="#2A2436"/>`).join('')}</g>
  ${[[30, 250, 26], [80, 210, 30], [140, 180, 36], [215, 200, 30], [275, 230, 28], [325, 260, 22]].map(([x, y, w]) => `<rect x="${x}" y="${y}" width="${w}" height="${400 - y!}" fill="#221B24"/>${[0, 1, 2, 3].map((r) => `<rect class="t-fenetre" style="--i:${(x! + r) % 5}" x="${x! + 6}" y="${y! + 16 + r * 30}" width="5" height="7" fill="#FFD98A"/>`).join('')}`).join('')}
  <rect y="400" width="360" height="240" fill="url(#t-mer)"/>
  <path class="t-vague" d="M0 402 Q 45 396 90 402 T 180 402 T 270 402 T 360 402 V 412 H 0 Z" fill="#7FB4D8" opacity=".35"/>
  <circle cx="180" cy="560" r="120" fill="url(#t-lueur)" class="t-pouls"/>
  ${([[150, 560], [190, 585], [215, 545], [170, 600]] as [number, number][]).map(([x, y]) => `<path d="M${x} ${y - 16} L${x + 7} ${y} L${x} ${y + 8} L${x - 7} ${y} Z" fill="#B9A6FF" opacity=".8"/>`).join('')}
</svg>`;

/**
 * L'illustration fixe, avec des effets en code posés exactement sur elle (positions en % de l'image) :
 * la flamme de la lanterne qui vacille et la lueur violette des joints de la porte qui pulse.
 * Le cadre garde les proportions de l'image et se recadre comme object-position: 28 % 50 %.
 */
const imageAnimee = () => `<div class="titre-image">`
  + `<img src="./intro/00-titre.webp" alt="" decoding="async">`
  + `<span class="t-porte"></span><span class="t-flamme"></span><span class="t-halo"></span></div>`;

export function htmlTitre(introVue: boolean, mouvement: boolean): string {
  return `<section class="titre" data-action="titre-jouer" aria-label="EMPREINTES, écran titre">`
    + `<div class="titre-fond" aria-hidden="true">${IMAGE_TITRE ? imageAnimee() : fondCode()}</div>`
    + (mouvement ? particules('cristal') : '')
    + `<div class="titre-voile" aria-hidden="true"></div>`
    + `<header class="titre-haut"><h1 class="titre-nom">${[...'EMPREINTES'].map((c, i) => `<span style="--i:${i}">${c}</span>`).join('')}</h1>`
    + `<p class="titre-sous">2121 · La mer monte. Le passé dort en dessous.</p></header>`
    + `<div class="titre-bas"><button type="button" class="prim titre-go" data-action="titre-jouer">${introVue ? 'Reprendre' : 'Commencer'}</button>`
    + `<div class="titre-sec">${introVue ? `<button type="button" class="btn-sec" data-action="intro">Revoir l’intro</button>` : ''}<button type="button" class="btn-sec" data-action="bibliotheque">Chroniques</button></div>`
    + `<span class="titre-indice">Touche l’écran</span><small class="titre-version">Alpha</small></div></section>`;
}
