/**
 * « Avant d'ouvrir » : entre la rencontre et le premier combat, Véla, Ilka et Doran montrent
 * au directeur, avec de vraies cartes du jeu, ce qu'est une carte, comment on la lit,
 * ce qu'est une chaîne et pourquoi il faut regarder ce que l'ennemi annonce.
 */
import { DECK_DEPART, porteurDef } from '../core/donnees';
import type { Geste } from '../core/types';
import { portrait } from './art';
import { avatar } from './coquille';
import { ICO } from './icones';
import { COULEUR, carteDemo } from './vue';
import { echap } from './outils';
import { t as tr } from '../core/i18n';

const carte = (id: string): Geste => {
  const g = DECK_DEPART.find((d) => d.id === `${id}@fer`) ?? DECK_DEPART[0]!;
  return { ...g, uid: `demo-${id}` };
};

interface Etape { qui: 'ilka' | 'doran' | 'vela'; titre: string; texte: string; demo: () => string; note?: string }

const demoTrois = () => `<div class="demo-rang">${[['ruee', 'ilka'], ['morsure', 'doran'], ['murmure', 'vela']].map(([c, p]) =>
  `<figure>${carteDemo(carte(c!))}<figcaption style="--c:${COULEUR[porteurDef(p!).lignee]}">${echap(porteurDef(p!).nom)}</figcaption></figure>`).join('')}</div>`;

const demoAnatomie = () => `<div class="demo-anatomie"><div class="demo-grande">${carteDemo(carte('ruee'))}<span class="repere r1">1</span><span class="repere r2">2</span><span class="repere r3">3</span></div>`
  + `<ol class="demo-legende"><li><i>1</i><span><b>${tr`La Fréquence`}</b>${tr`, de 1 à 9. C’est elle qui compte pour enchaîner.`}</span></li>`
  + `<li><i>2</i><span><b>${tr`La force`}</b> ${tr`et ce qu’elle fait :`}<span class="types"><span class="g-val atk">${ICO.atk}</span>${tr`frappe`} <span class="g-val bouclier">${ICO.bouclier}</span>${tr`protège`} <span class="g-val soin">${ICO.soin}</span>${tr`soigne`}</span></span></li>`
  + `<li><i>3</i><span><b>${tr`Le nom de la carte`}</b>${tr`, et l’effet spécial quand elle en a un.`}</span></li></ol></div>`;

const demoAide = () => `<div class="demo-aide"><span class="aide-faux" aria-hidden="true">${ICO.aide}</span><p>${tr`En combat, ce bouton rappelle toutes les règles. Pendant ce premier combat, une consigne t’attendra sous la chaîne à chaque tour.`}</p></div>`;

// 12 novembre 2026 (audit du début) : 3 écrans au lieu de 5. « La chaîne » et « Écoute ce qu'il annonce » répétaient
// mot pour mot les leçons 2 et 3 du combat guidé, et l'exemple de chaîne frappait avec un « Plastron de choc »
export const ETAPES: Etape[] = [
  {
    qui: 'vela', titre: tr('Des gestes, pas des armes'),
    texte: tr('Là-dessous, on ne se bat pas avec des armes. On se bat avec des gestes gravés dans les cristaux : ce sont tes cartes. Chacune appartient à l’un de nous, et sa couleur te dit qui la joue.'),
    demo: demoTrois,
  },
  {
    qui: 'ilka', titre: tr('Lire une carte'),
    texte: tr('Trois choses à regarder sur une carte. Le reste, tu l’apprendras en route.'),
    demo: demoAnatomie,
  },
  {
    qui: 'vela', titre: tr('Je reste avec toi'),
    texte: tr('La suite, tu l’apprendras en jouant : je te guiderai pendant ce premier combat, tour après tour. Et si tu as un doute, demande.'),
    demo: demoAide,
  },
];

// « Ton district », à l'arrivée au district, est devenu la visite de la Cuvette sur la vraie carte (visite.ts, 13 novembre 2026)

/** Le Porteur qui parle, peint en grand (portrait 3:4 fondu vers le bas) ; l'avatar si l'image manque */
const portraitParole = (id: string) => {
  const img = portrait(id);
  return `<figure class="bf-portrait" aria-hidden="true">${img ? `<img src="${img}" alt="" decoding="async">` : avatar(id, 96)}</figure>`;
};

/** Les explications d'avant la chambre (le combat) */
const SUITES = {
  chambre: { etapes: ETAPES, nom: tr('Avant d’ouvrir'), passer: 'ouvrir-chambre', action: 'briefing',
    fin: `<button type="button" class="btn prim large appel-porte" data-action="ouvrir-chambre">${ICO.porte}${tr`Ouvrir la porte`}</button>` },
};
export type Suite = keyof typeof SUITES;
export const nbEtapes = (s: Suite) => SUITES[s].etapes.length;

export function htmlBriefing(etape: number, suite: Suite = 'chambre'): string {
  const S = SUITES[suite];
  const i = Math.max(0, Math.min(etape, S.etapes.length - 1));
  const e = S.etapes[i]!;
  const d = porteurDef(e.qui);
  const dernier = i === S.etapes.length - 1;
  return `<section class="scene-briefing bf bf-${suite}" style="--image:url(./intro/00-titre.webp)" aria-label="${S.nom}" data-action="${S.action}-suite">`
    + `<div class="rencontre-fond" aria-hidden="true"><div class="rencontre-image"><img src="./intro/00-titre.webp" alt="" decoding="async"><span class="t-flamme"></span><span class="t-halo"></span></div></div>`
    + `<header class="bf-haut"><span class="bf-etape">${S.nom} <b>${i + 1}</b> / ${S.etapes.length}</span>`
    + `<button type="button" class="bf-passer" data-action="${S.passer}">${tr`Passer`}</button>`
    + `<div class="bf-points" aria-hidden="true">${S.etapes.map((_, k) => `<i class="${k === i ? 'ici' : k < i ? 'vu' : ''}"></i>`).join('')}</div></header>`
    + `<div class="bf-corps" data-etape="${i}" style="--c:${COULEUR[d.lignee]}">`
    + `<div class="bf-parole">${portraitParole(e.qui)}<div class="bf-tete"><span class="bf-qui">${echap(d.nom)}</span><h1>${echap(e.titre)}</h1></div>`
    + `<p class="bf-texte">${echap(e.texte)}</p></div>`
    + `<div class="bf-demo">${e.demo()}</div></div>`
    + `<footer class="bf-bas">`
    // 14 novembre 2026 : plus de Retour / Suite, on touche l'écran (à gauche pour revenir) ; seul le dernier garde son bouton
    + (dernier ? S.fin : `<span class="indice-bulle">${i === 0 ? tr`Touche à droite pour avancer, à gauche pour revenir` : ''}</span>`)
    + `</footer></section>`;
}
