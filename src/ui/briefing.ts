/**
 * « Avant d'ouvrir » : entre la rencontre et le premier combat, Véla, Ilka et Doran montrent
 * au directeur, avec de vraies cartes du jeu, ce qu'est une carte, comment on la lit,
 * ce qu'est une chaîne et pourquoi il faut regarder ce que l'ennemi annonce.
 */
import { DECK_DEPART, porteurDef } from '../core/donnees';
import { REGLES } from '../core/regles';
import type { Geste } from '../core/types';
import { portrait } from './art';
import { avatar } from './coquille';
import { ICO, icone } from './icones';
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

/** les vrais chiffres de la démonstration : la force de chaque carte, puis la même chaîne en Résonance (suite de 3) */
const demoChaine = () => {
  const cs = ['ruee', 'bond', 'charge'].map(carte);
  const mult = REGLES.multSuite[3] ?? 1;
  const brut = cs.reduce((t, g) => t + g.v, 0);
  const reso = cs.reduce((t, g) => t + Math.round(g.v * mult), 0);
  return `<div class="demo-chaine"><div class="demo-rail">${cs.map((g, i) => (i ? '<span class="fleche" aria-hidden="true">›</span>' : '') + carteDemo(g, 'chaine')).join('')}</div>`
    + `<p class="demo-suite"><b>${cs.map((g) => g.f).join('</b> → <b>')}</b>${tr` : les chiffres se suivent.`}</p>`
    + `<dl class="demo-calcul"><div><dt>${tr`Sans suite`}</dt><dd>${cs.map((g) => g.v).join(' + ')} = <b>${brut}</b></dd></div>`
    + `<div class="reso"><dt>${tr`Résonance +${Math.round((mult - 1) * 100)} %`}</dt><dd><b>${reso}</b> ${tr`dégâts`}</dd></div></dl></div>`;
};

const demoIntention = () => {
  const cs = ['grogner', 'carapace'].map(carte);
  return `<div class="demo-intention"><div class="intention danger" role="img" aria-label="${tr`Exemple d’intention : Entaille sur Doran`}"><span class="int-ico">${ICO.atk}</span><span class="int-txt"><small>${tr`INTENTION`}</small>${tr`Entaille sur Doran`}</span></div>`
    + `<div class="demo-rang serre">${cs.map((g) => carteDemo(g)).join('')}<span class="demo-plus">${ICO.bouclier}<b>+${cs.reduce((t, g) => t + g.v, 0)}</b><span>${tr`de bouclier`}<br>${tr`pour les trois`}</span></span></div></div>`;
};

const demoAide = () => `<div class="demo-aide"><span class="aide-faux" aria-hidden="true">${ICO.aide}</span><p>${tr`En combat, ce bouton rappelle toutes les règles. Pendant ce premier combat, une consigne t’attendra sous la chaîne à chaque tour.`}</p></div>`;

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
    qui: 'ilka', titre: tr('La chaîne'),
    texte: tr('À chaque tour, tu as cinq cartes en main. Tu en poses jusqu’à trois : c’est la chaîne. Tu la lances, et elles agissent l’une après l’autre. Si trois chiffres se suivent, la chaîne entre en Résonance : +40 % sur toute la chaîne. Deux ne suffisent pas.'),
    demo: demoChaine,
  },
  {
    qui: 'doran', titre: tr('Écoute ce qu’il annonce'),
    texte: tr('Ce qui vit là-dessous ne frappe jamais sans prévenir. Avant chaque tour, il annonce ce qu’il va faire. Si c’est une grosse attaque, glisse des boucliers dans ta chaîne : ils protègent toute l’escouade.'),
    demo: demoIntention,
  },
  {
    qui: 'vela', titre: tr('Je reste avec toi'),
    texte: tr('Je te guiderai pendant ce premier combat, tour après tour. Et si tu as un doute, demande.'),
    demo: demoAide,
  },
];

// ---------- « Ton district » : juste après la chambre (25 octobre 2026) ----------
// Bryan, sur la capture de sa première ouverture : « logique qu’on soit perdu ». Le combat était expliqué,
// pas le district : à quoi servent les ressources, qui travaille et qui descend, et le but (creuser plus bas).

const demoRessources = () => `<ul class="demo-liste">`
  + `<li>${icone('composants')}<span><b>${tr`Le minerai`}</b>${tr`Ce que l’escouade rapporte d’en bas : de la pierre bleue encore prise dans sa gangue.`}</span></li>`
  + `<li>${icone('energie')}<span><b>${tr`Les cristaux`}</b>${tr`Le Générateur taille le minerai en cristaux, même quand tu ne joues pas. Ils paient tout : bâtiments, cartes, entraînement.`}</span></li>`
  + `<li>${icone('eclats')}<span><b>${tr`Les Éclats`}</b>${tr`Rares, trouvés en profondeur. Pour les cartes précieuses.`}</span></li>`
  + `</ul>`;

const groupe = (titre: string, ids: string[], texte: string) => `<div class="demo-groupe"><span class="surtitre">${titre}</span>`
  + `<div class="demo-avatars">${ids.map((id) => `<figure>${avatar(id, 44)}<figcaption>${echap(porteurDef(id).nom)}</figcaption></figure>`).join('')}</div><p>${texte}</p></div>`;

const demoEquipes = () => `<div class="demo-equipes">`
  + groupe(tr('Au district'), ['coursier', 'docker', 'guetteur'], tr('Postés dans un bâtiment, ils le font produire davantage.'))
  + groupe(tr('L’escouade'), ['ilka', 'doran', 'vela'], tr('Elle descend combattre. Un Porteur qui descend quitte son poste.'))
  + `</div>`;

const demoBoucle = () => `<ol class="demo-boucle">`
  + `<li><i>1</i>${icone('porte')}<span><b>${tr`Vaincre le gardien`}</b>${tr`On descend par la Tour du Noyau.`}</span></li>`
  + `<li><i>2</i>${icone('strate')}<span><b>${tr`Renforcer l’escouade`}</b>${tr`Fouilles, missions en mer, niveaux des cartes.`}</span></li>`
  + `<li><i>3</i>${icone('porte')}<span><b>${tr`Revenir plus fort`}</b>${tr`L’écran de départ dit si l’escouade est prête.`}</span></li>`
  + `<li class="fin">${icone('strate')}<span><b>${tr`La Strate suivante s’ouvre`}</b>${tr`Plus profond, plus précieux.`}</span></li></ol>`;

const demoRepere = () => `<ul class="demo-liste">`
  + `<li>${ICO.ok}<span><b>${tr`L’objectif, en haut`}</b>${tr`Il dit quoi faire ensuite, et donne une récompense.`}</span></li>`
  + `<li><span class="demo-pastille" aria-hidden="true"><i class="pastille-alerte"></i></span><span><b>${tr`Les pastilles orange`}</b>${tr`Quelque chose t’attend dans cet onglet ou ce bâtiment.`}</span></li>`
  + `<li>${icone('coffre')}<span><b>${tr`Le ravitaillement du jour`}</b>${tr`Un colis chaque jour : des cristaux et des cartes.`}</span></li></ul>`;

export const ETAPES_DISTRICT: Etape[] = [
  {
    qui: 'vela', titre: tr('Ton district'),
    texte: tr('Ici, tout tourne avec trois ressources. Tu les vois en haut de l’écran : touches-en une pour tout savoir sur elle.'),
    demo: demoRessources,
  },
  {
    qui: 'ilka', titre: tr('Ceux qui restent, ceux qui descendent'),
    texte: tr('Les trois recrues travaillent au district. Nous trois, on descend. Garde-nous pour l’escouade et poste les recrues dans les bâtiments.'),
    demo: demoEquipes,
  },
  {
    qui: 'doran', titre: tr('Toujours plus bas'),
    texte: tr('Le but, c’est de creuser. Chaque Strate a un gardien qui garde le passage. Pour percer l’étage suivant, il faut trois choses, dans cet ordre.'),
    demo: demoBoucle,
  },
  {
    qui: 'vela', titre: tr('Un pas à la fois'),
    texte: tr('Tu n’as pas à tout retenir. Suis l’objectif en haut du district : il te montre la prochaine chose à faire. On commence par mettre une recrue au travail au Générateur.'),
    demo: demoRepere,
  },
];

/** Le Porteur qui parle, peint en grand (portrait 3:4 fondu vers le bas) ; l'avatar si l'image manque */
const portraitParole = (id: string) => {
  const img = portrait(id);
  return `<figure class="bf-portrait" aria-hidden="true">${img ? `<img src="${img}" alt="" decoding="async">` : avatar(id, 96)}</figure>`;
};

/** Les deux suites d'explications : avant la chambre (le combat), puis à l'arrivée au district */
const SUITES = {
  chambre: { etapes: ETAPES, nom: tr('Avant d’ouvrir'), passer: 'ouvrir-chambre', action: 'briefing',
    fin: `<button type="button" class="btn prim large appel-porte" data-action="ouvrir-chambre">${ICO.porte}${tr`Ouvrir la porte`}</button>` },
  district: { etapes: ETAPES_DISTRICT, nom: tr('Ton district'), passer: 'accueil-fin', action: 'accueil',
    fin: `<button type="button" class="btn prim large appel-porte" data-action="accueil-fin" data-id="generateur">${icone('ouvrier')}${tr`Poster une recrue`}</button>` },
};
export type Suite = keyof typeof SUITES;
export const nbEtapes = (s: Suite) => SUITES[s].etapes.length;

export function htmlBriefing(etape: number, suite: Suite = 'chambre'): string {
  const S = SUITES[suite];
  const i = Math.max(0, Math.min(etape, S.etapes.length - 1));
  const e = S.etapes[i]!;
  const d = porteurDef(e.qui);
  const dernier = i === S.etapes.length - 1;
  return `<section class="scene-briefing bf bf-${suite}" style="--image:url(./intro/00-titre.webp)" aria-label="${S.nom}">`
    + `<div class="rencontre-fond" aria-hidden="true"><div class="rencontre-image"><img src="./intro/00-titre.webp" alt="" decoding="async"><span class="t-flamme"></span><span class="t-halo"></span></div></div>`
    + `<header class="bf-haut"><span class="bf-etape">${S.nom} <b>${i + 1}</b> / ${S.etapes.length}</span>`
    + `<button type="button" class="bf-passer" data-action="${S.passer}">${tr`Passer`}</button>`
    + `<div class="bf-points" aria-hidden="true">${S.etapes.map((_, k) => `<i class="${k === i ? 'ici' : k < i ? 'vu' : ''}"></i>`).join('')}</div></header>`
    + `<div class="bf-corps" data-etape="${i}" style="--c:${COULEUR[d.lignee]}">`
    + `<div class="bf-parole">${portraitParole(e.qui)}<div class="bf-tete"><span class="bf-qui">${echap(d.nom)}</span><h1>${echap(e.titre)}</h1></div>`
    + `<p class="bf-texte">${echap(e.texte)}</p></div>`
    + `<div class="bf-demo">${e.demo()}</div></div>`
    + `<footer class="bf-bas">`
    + (i > 0 ? `<button type="button" class="btn sec" data-action="${S.action}-retour">${ICO.retour}${tr`Retour`}</button>` : '<span></span>')
    + (dernier ? S.fin : `<button type="button" class="btn prim" data-action="${S.action}-suite">${tr`Suite`}</button>`)
    + `</footer></section>`;
}
