// L'écran titre, affiché à chaque lancement.
// Illustration Midjourney : public/intro/titre-mobile-*.webp (téléphone) et titre-pc-*.webp (PC).

import { particules } from './intro';
import { LOGOTYPE } from './logotype';
import { ICO } from './icones';
import { peutInstaller } from './installer';
import { echap } from './outils';

/**
 * L'illustration (9 novembre 2026) : l'escalier englouti, sous la digue, qui plonge vers les Strates.
 * Deux cadrages peints sur Midjourney : vertical pour le téléphone, panoramique pour le PC (mer et ciel libres à droite, sous le logo).
 * Les anciens effets de la lanterne et de la porte restent sur 00-titre.webp, encore utilisée par la rencontre et le briefing.
 */
const imageAnimee = () => `<div class="titre-image titre-escalier"><picture>`
  + `<source media="(min-width:1100px) and (min-height:600px)" srcset="./intro/titre-pc-1600.webp 1600w, ./intro/titre-pc-2560.webp 2560w" sizes="100vw">`
  + `<img src="./intro/titre-mobile-1600.webp" srcset="./intro/titre-mobile-1600.webp 897w, ./intro/titre-mobile-2560.webp 1435w" sizes="57vh" alt="" decoding="async">`
  + `</picture></div>`;

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

/**
 * Premier lancement sur cet appareil (28 octobre 2026) : deux choix de même poids, avant l'intro.
 * Qui a déjà joué ailleurs retrouve sa partie tout de suite, sans traverser l'intro ni chercher le compte dans le menu.
 */
export const premierLancement = (introVue: boolean, c: TitreCompte | null) => !introVue && c?.etat === 'invite';

/** Les boutons du bas */
function basTitre(introVue: boolean, c: TitreCompte | null): string {
  if (premierLancement(introVue, c)) return `<div class="titre-bas titre-accueil">`
    + `<button type="button" class="prim titre-go" data-action="titre-jouer">Nouvelle partie</button>`
    + `<button type="button" class="titre-retrouver" data-action="titre-compte">${ICO.compte}<span><b>J’ai déjà une partie</b><small>Je me connecte pour la retrouver</small></span></button>`
    + `<div class="titre-sec"><button type="button" class="btn-sec" data-action="bibliotheque">Chroniques</button></div>`
    + (peutInstaller() ? `<button type="button" class="titre-installer" data-action="installer"><img src="./favicon-32.png" alt="" width="16" height="16">Installer le jeu sur l’écran d’accueil</button>` : '')
    + `<small class="titre-version">Alpha</small></div>`;
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
  // toucher l'écran ouvre la partie, sauf pendant qu'on récupère celle du compte,
  // et au premier lancement : un toucher à côté ne doit pas lancer une nouvelle partie à la place de « J'ai déjà une partie »
  const toucher = c?.etat !== 'attente' && !premierLancement(introVue, c);
  return `<section class="titre"${toucher ? ' data-action="titre-jouer"' : ''} style="--image:url(./intro/titre-mobile-1600.webp)" aria-label="Ossyra, écran titre">`
    + `<div class="titre-fond" aria-hidden="true">${imageAnimee()}</div>`
    + (mouvement ? particules('cristal') : '')
    + `<div class="titre-voile" aria-hidden="true"></div>`
    + `<header class="titre-haut"><img class="titre-logo" src="./art/logo.webp" alt="" width="640" height="854" decoding="async"><h1 class="titre-nom">${LOGOTYPE}</h1>`
    + `<p class="titre-sous">2121 · Sous les eaux, d’autres se souviennent encore.</p></header>`
    + basTitre(introVue, c) + `</section>`
    + (c?.panneau ? `<div class="titre-voile-feuille" data-action="titre-compte" aria-hidden="true"></div>`
      + `<section class="titre-feuille" role="dialog" aria-modal="true" aria-label="Compte">`
      + `<button type="button" class="titre-fermer" data-action="titre-compte" aria-label="Fermer">${ICO.fermer}</button>${c.panneau}</section>` : '');
}
