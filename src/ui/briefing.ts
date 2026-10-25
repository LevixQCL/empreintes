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

const carte = (id: string): Geste => {
  const g = DECK_DEPART.find((d) => d.id === `${id}@fer`) ?? DECK_DEPART[0]!;
  return { ...g, uid: `demo-${id}` };
};

interface Etape { qui: 'ilka' | 'doran' | 'vela'; titre: string; texte: string; demo: () => string; note?: string }

const demoTrois = () => `<div class="demo-rang">${[['ruee', 'ilka'], ['morsure', 'doran'], ['murmure', 'vela']].map(([c, p]) =>
  `<figure>${carteDemo(carte(c!))}<figcaption style="--c:${COULEUR[porteurDef(p!).lignee]}">${echap(porteurDef(p!).nom)}</figcaption></figure>`).join('')}</div>`;

const demoAnatomie = () => `<div class="demo-anatomie"><div class="demo-grande">${carteDemo(carte('ruee'))}<span class="repere r1">1</span><span class="repere r2">2</span><span class="repere r3">3</span></div>`
  + `<ol class="demo-legende"><li><i>1</i><span><b>La Fréquence</b>, de 1 à 9. C’est elle qui compte pour enchaîner.</span></li>`
  + `<li><i>2</i><span><b>La force</b> et ce qu’elle fait :<span class="types"><span class="g-val atk">${ICO.atk}</span>frappe <span class="g-val bouclier">${ICO.bouclier}</span>protège <span class="g-val soin">${ICO.soin}</span>soigne</span></span></li>`
  + `<li><i>3</i><span><b>Son nom</b>, et l’effet spécial quand elle en a un.</span></li></ol></div>`;

/** les vrais chiffres de la démonstration : la force de chaque carte, puis la même chaîne en Résonance (suite de 3) */
const demoChaine = () => {
  const cs = ['ruee', 'bond', 'charge'].map(carte);
  const mult = REGLES.multSuite[3] ?? 1;
  const brut = cs.reduce((t, g) => t + g.v, 0);
  const reso = cs.reduce((t, g) => t + Math.round(g.v * mult), 0);
  return `<div class="demo-chaine"><div class="demo-rail">${cs.map((g, i) => (i ? '<span class="fleche" aria-hidden="true">›</span>' : '') + carteDemo(g, 'chaine')).join('')}</div>`
    + `<p class="demo-suite"><b>${cs.map((g) => g.f).join('</b> → <b>')}</b> : les chiffres se suivent.</p>`
    + `<dl class="demo-calcul"><div><dt>Sans suite</dt><dd>${cs.map((g) => g.v).join(' + ')} = <b>${brut}</b></dd></div>`
    + `<div class="reso"><dt>Résonance +${Math.round((mult - 1) * 100)} %</dt><dd><b>${reso}</b> dégâts</dd></div></dl></div>`;
};

const demoIntention = () => {
  const cs = ['grogner', 'carapace'].map(carte);
  return `<div class="demo-intention"><div class="intention danger" role="img" aria-label="Exemple d’intention : Entaille sur Doran"><span class="int-ico">${ICO.atk}</span><span class="int-txt"><small>INTENTION</small>Entaille sur Doran</span></div>`
    + `<div class="demo-rang serre">${cs.map((g) => carteDemo(g)).join('')}<span class="demo-plus">${ICO.bouclier}<b>+${cs.reduce((t, g) => t + g.v, 0)}</b><span>de bouclier<br>pour les trois</span></span></div></div>`;
};

const demoAide = () => `<div class="demo-aide"><span class="aide-faux" aria-hidden="true">${ICO.aide}</span><p>En combat, ce bouton rappelle toutes les règles. Pendant ce premier combat, une consigne t’attendra sous la chaîne à chaque tour.</p></div>`;

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

// ---------- « Ton district » : juste après la chambre (25 octobre 2026) ----------
// Bryan, sur la capture de sa première ouverture : « logique qu’on soit perdu ». Le combat était expliqué,
// pas le district : à quoi servent les ressources, qui travaille et qui descend, et le but (creuser plus bas).

const demoRessources = () => `<ul class="demo-liste">`
  + `<li>${icone('energie')}<span><b>L’énergie</b>Le Générateur la produit chaque heure, même quand tu ne joues pas. Elle paie les chantiers.</span></li>`
  + `<li>${icone('composants')}<span><b>Les composants</b>Ce que l’escouade rapporte d’en bas. Avec l’énergie, ils améliorent les bâtiments.</span></li>`
  + `<li>${icone('eclats')}<span><b>Les Éclats</b>Rares, trouvés en profondeur. Pour les cartes précieuses.</span></li>`
  + `</ul>`;

const groupe = (titre: string, ids: string[], texte: string) => `<div class="demo-groupe"><span class="surtitre">${titre}</span>`
  + `<div class="demo-avatars">${ids.map((id) => `<figure>${avatar(id, 44)}<figcaption>${echap(porteurDef(id).nom)}</figcaption></figure>`).join('')}</div><p>${texte}</p></div>`;

const demoEquipes = () => `<div class="demo-equipes">`
  + groupe('Au district', ['coursier', 'docker', 'guetteur'], 'Postés dans un bâtiment, ils le font produire davantage.')
  + groupe('L’escouade', ['ilka', 'doran', 'vela'], 'Elle descend combattre. Un Porteur qui descend quitte son poste.')
  + `</div>`;

const demoBoucle = () => `<ol class="demo-boucle">`
  + `<li><i>1</i>${icone('porte')}<span><b>Vaincre le gardien</b>On descend par la Tour du Noyau.</span></li>`
  + `<li><i>2</i>${icone('ouvrier')}<span><b>Trouver des creuseurs</b>Missions, fouilles, Épreuves.</span></li>`
  + `<li><i>3</i>${icone('tour')}<span><b>Monter la Tour du Noyau</b>Pour loger les creuseurs.</span></li>`
  + `<li class="fin">${icone('strate')}<span><b>La Strate suivante s’ouvre</b>Plus profond, plus précieux.</span></li></ol>`;

const demoRepere = () => `<ul class="demo-liste">`
  + `<li>${ICO.ok}<span><b>L’objectif, en haut</b>Il dit quoi faire ensuite, et donne une récompense.</span></li>`
  + `<li><span class="demo-pastille" aria-hidden="true"><i class="pastille-alerte"></i></span><span><b>Les pastilles orange</b>Quelque chose t’attend dans cet onglet ou ce bâtiment.</span></li>`
  + `<li>${icone('coffre')}<span><b>Le ravitaillement du jour</b>Un colis chaque jour : composants et cartes.</span></li></ul>`;

export const ETAPES_DISTRICT: Etape[] = [
  {
    qui: 'vela', titre: 'Ton district',
    texte: 'Ici, tout tourne avec trois ressources. Tu les vois en haut de l’écran : touche-en une pour tout savoir sur elle.',
    demo: demoRessources,
  },
  {
    qui: 'ilka', titre: 'Ceux qui restent, ceux qui descendent',
    texte: 'Les trois recrues travaillent au district. Nous trois, on descend. Garde-nous pour l’escouade et poste les recrues dans les bâtiments.',
    demo: demoEquipes,
  },
  {
    qui: 'doran', titre: 'Toujours plus bas',
    texte: 'Le but, c’est de creuser. Chaque Strate a un gardien qui garde le passage. Pour percer l’étage suivant, il faut trois choses, dans cet ordre.',
    demo: demoBoucle,
  },
  {
    qui: 'vela', titre: 'Un pas à la fois',
    texte: 'Tu n’as pas à tout retenir. Suis l’objectif en haut du district : il te montre la prochaine chose à faire. On commence par allumer le Générateur.',
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
  chambre: { etapes: ETAPES, nom: 'Avant d’ouvrir', passer: 'ouvrir-chambre', action: 'briefing',
    fin: `<button type="button" class="btn prim large appel-porte" data-action="ouvrir-chambre">${ICO.porte}Ouvrir la porte</button>` },
  district: { etapes: ETAPES_DISTRICT, nom: 'Ton district', passer: 'accueil-fin', action: 'accueil',
    fin: `<button type="button" class="btn prim large appel-porte" data-action="accueil-fin" data-id="generateur">${ICO.energie}Allumer le Générateur</button>` },
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
    + `<button type="button" class="bf-passer" data-action="${S.passer}">Passer</button>`
    + `<div class="bf-points" aria-hidden="true">${S.etapes.map((_, k) => `<i class="${k === i ? 'ici' : k < i ? 'vu' : ''}"></i>`).join('')}</div></header>`
    + `<div class="bf-corps" data-etape="${i}" style="--c:${COULEUR[d.lignee]}">`
    + `<div class="bf-parole">${portraitParole(e.qui)}<div class="bf-tete"><span class="bf-qui">${echap(d.nom)}</span><h1>${echap(e.titre)}</h1></div>`
    + `<p class="bf-texte">${echap(e.texte)}</p></div>`
    + `<div class="bf-demo">${e.demo()}</div></div>`
    + `<footer class="bf-bas">`
    + (i > 0 ? `<button type="button" class="btn sec" data-action="${S.action}-retour">${ICO.retour}Retour</button>` : '<span></span>')
    + (dernier ? S.fin : `<button type="button" class="btn prim" data-action="${S.action}-suite">Suite</button>`)
    + `</footer></section>`;
}
