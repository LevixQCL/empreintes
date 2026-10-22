/**
 * « Avant d'ouvrir » : entre la rencontre et le premier combat, Véla, Ilka et Doran montrent
 * au directeur, avec de vraies cartes du jeu, ce qu'est une carte, comment on la lit,
 * ce qu'est une chaîne et pourquoi il faut regarder ce que l'ennemi annonce.
 */
import { DECK_DEPART, porteurDef } from '../core/donnees';
import type { Geste } from '../core/types';
import { avatar } from './coquille';
import { ICO } from './icones';
import { COULEUR, carteDemo, echap } from './vue';

const carte = (id: string): Geste => {
  const g = DECK_DEPART.find((d) => d.id === `${id}@fer`) ?? DECK_DEPART[0]!;
  return { ...g, uid: `demo-${id}` };
};

interface Etape { qui: 'ilka' | 'doran' | 'vela'; titre: string; texte: string; demo: () => string; note?: string }

const demoTrois = () => `<div class="demo-rang">${[['ruee', 'ilka'], ['morsure', 'doran'], ['murmure', 'vela']].map(([c, p]) =>
  `<figure>${carteDemo(carte(c!))}<figcaption style="--c:${COULEUR[porteurDef(p!).lignee]}">${echap(porteurDef(p!).nom)}</figcaption></figure>`).join('')}</div>`;

const demoAnatomie = () => `<div class="demo-anatomie"><div class="demo-grande">${carteDemo(carte('ruee'))}<span class="repere r1">1</span><span class="repere r2">2</span><span class="repere r3">3</span></div>`
  + `<ol class="demo-legende"><li><b>1 · La Fréquence</b>, de 1 à 9. C’est elle qui compte pour enchaîner.</li>`
  + `<li><b>2 · La force</b> et ce qu’elle fait :<span class="types"><span class="g-val atk">${ICO.atk}</span> frappe <span class="g-val bouclier">${ICO.bouclier}</span> protège <span class="g-val soin">${ICO.soin}</span> soigne</span></li>`
  + `<li><b>3 · Son nom</b>, et l’effet spécial quand elle en a un.</li></ol></div>`;

const demoChaine = () => `<div class="demo-chaine"><div class="demo-tete"><span class="surtitre">CHAÎNE · 3 / 3</span><span class="badge-reso">${ICO.flux}RÉSONANCE ×1,3</span></div>`
  + `<div class="demo-rail">${['ruee', 'bond', 'charge'].map((c, i) => (i ? '<span class="fleche" aria-hidden="true">›</span>' : '') + carteDemo(carte(c), 'chaine')).join('')}</div>`
  + `<p class="demo-suite"><b>3</b> → <b>4</b> → <b>5</b> : les chiffres se suivent.</p></div>`;

const demoIntention = () => `<div class="demo-intention"><div class="intention danger" role="img" aria-label="Exemple d’intention : Entaille sur Doran"><span class="int-ico">${ICO.atk}</span><span class="int-txt"><small>INTENTION</small>Entaille sur Doran</span></div>`
  + `<div class="demo-rang serre">${['grogner', 'carapace'].map((c) => carteDemo(carte(c))).join('')}<span class="demo-plus">${ICO.bouclier}<span>protège<br>les trois</span></span></div></div>`;

const demoAide = () => `<div class="demo-aide"><span class="btn-icone faux" aria-hidden="true">${ICO.aide}</span><p>En combat, ce bouton rappelle toutes les règles. Pendant ce premier combat, une consigne t’attendra sous la chaîne à chaque tour.</p></div>`;

export const ETAPES: Etape[] = [
  {
    qui: 'vela', titre: 'Des gestes, pas des armes',
    texte: 'Là-dessous, on ne se bat pas avec des armes. On se bat avec des gestes gravés dans les cristaux : ce sont tes cartes. Chacune appartient à l’un de nous, et sa couleur te dit qui la joue.',
    demo: demoTrois,
  },
  {
    qui: 'ilka', titre: 'Lire une carte',
    texte: 'Trois choses à regarder sur une carte. Le reste, tu l’apprendras en route.',
    demo: demoAnatomie,
  },
  {
    qui: 'ilka', titre: 'La chaîne',
    texte: 'À chaque tour, tu as cinq cartes en main. Tu en poses jusqu’à trois : c’est la chaîne. Tu la lances, et elles agissent l’une après l’autre. Si leurs chiffres se suivent, la chaîne entre en Résonance : +30 % sur toute la chaîne.',
    demo: demoChaine,
  },
  {
    qui: 'doran', titre: 'Écoute ce qu’il annonce',
    texte: 'Ce qui vit là-dessous ne frappe jamais sans prévenir. Avant chaque tour, il annonce ce qu’il va faire. Si c’est une grosse attaque, glisse des boucliers dans ta chaîne : ils protègent toute l’escouade.',
    demo: demoIntention,
  },
  {
    qui: 'vela', titre: 'Je reste avec toi',
    texte: 'Je te guiderai pendant ce premier combat, tour après tour. Et si tu as un doute, demande.',
    demo: demoAide,
  },
];

export function htmlBriefing(etape: number): string {
  const i = Math.max(0, Math.min(etape, ETAPES.length - 1));
  const e = ETAPES[i]!;
  const d = porteurDef(e.qui);
  const dernier = i === ETAPES.length - 1;
  return `<section class="scene-briefing" aria-label="Avant d’ouvrir">`
    + `<div class="rencontre-fond" aria-hidden="true"><div class="rencontre-image"><img src="./intro/00-titre.webp" alt="" decoding="async"><span class="t-flamme"></span><span class="t-halo"></span></div></div>`
    + `<header class="briefing-haut"><div><span class="label">AVANT D’OUVRIR · ${i + 1} / ${ETAPES.length}</span><h1>${echap(e.titre)}</h1></div>`
    + `<button type="button" class="btn-sec" data-action="ouvrir-chambre">Passer</button></header>`
    + `<div class="briefing-points" aria-hidden="true">${ETAPES.map((_, k) => `<i class="${k === i ? 'ici' : k < i ? 'vu' : ''}"></i>`).join('')}</div>`
    + `<div class="briefing-corps" data-etape="${i}">`
    + `<div class="briefing-parole" style="--c:${COULEUR[d.lignee]}">${avatar(e.qui, 46)}<div class="bulle-plate"><strong>${echap(d.nom)}</strong><p>${echap(e.texte)}</p></div></div>`
    + `<div class="briefing-demo">${e.demo()}</div></div>`
    + `<footer class="briefing-bas">`
    + (i > 0 ? `<button type="button" class="btn sec" data-action="briefing-retour">${ICO.retour}Retour</button>` : '<span></span>')
    + (dernier
      ? `<button type="button" class="btn prim large appel-porte" data-action="ouvrir-chambre">${ICO.porte}Ouvrir la porte</button>`
      : `<button type="button" class="btn prim" data-action="briefing-suite">Suite</button>`)
    + `</footer></section>`;
}
