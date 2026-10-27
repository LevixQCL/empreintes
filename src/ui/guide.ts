// Le mode d'emploi des cartes (22 octobre 2026). Bryan voulait un mode d'emploi pour construire son deck
// et une explication des cartes et de leurs effets. C'est une feuille à trois onglets (le deck, lire une carte,
// les effets), ouverte depuis l'écran Cartes, la feuille d'un Porteur, le détail d'une carte, l'escouade et l'aide du combat.
// Bryan n'aime pas les jeux « full texte » : une idée par ligne, et des visuels (la vraie carte annotée, l'échelle
// des Fréquences, le triangle). Tous les chiffres sont lus dans les données : ils suivent l'équilibrage tout seuls.
//
// Attention aux imports circulaires (vue.ts importe ce fichier) : rien d'importé de ./vue, ./carte ou ./coquille
// ne doit servir au chargement du module, seulement dans les fonctions.

import { CHARGE, COLLECTION, NOMS_RARETE, RARETES, chargeNiveau } from '../core/collection';
import { DECK_DEPART, GESTES_SPECIAUX, METAL_FORCE, METAL_FREQ, METAL_RENFORT, MODULES, carteId, gesteDeCarte, moduleDe, moduleDef } from '../core/donnees';
import { NOMS_EFFET } from '../core/effets';
import { DISTRICT, EPREUVE_DECK_MIN } from '../core/jeu';
import { REGLES, frequenceLibre } from '../core/regles';
import type { Geste, GesteDef, Lignee, TypeEffet, TypeGeste } from '../core/types';
import { socleAction, textureMetal } from './art';
import { COULEUR_RARETE, couleurFrequence, faceCarte } from './carte';
import { NOM_LIGNEES, avatar } from './coquille';
import { ICO } from './icones';
import { COULEUR, geste } from './vue';
import { echap } from './outils';

export type OngletGuide = 'deck' | 'carte' | 'effets';

const ONGLETS: { id: OngletGuide; nom: string }[] = [
  { id: 'deck', nom: 'Le deck' },
  { id: 'carte', nom: 'Lire une carte' },
  { id: 'effets', nom: 'Les effets' },
];

const LIGNEES: Lignee[] = ['tech', 'bio', 'reso'];
const pc = (x: number) => `${Math.round(x * 100)} %`;
/** Combien de Porteurs descendent ensemble */
const ESCOUADE = 3;

/**
 * La feuille du mode d'emploi.
 * @param trouvees les cartes déjà trouvées (id de base, sans métal) : l'onglet des effets ne dévoile que celles-là
 */
export function feuilleGuide(onglet: OngletGuide, trouvees: ReadonlySet<string>): string {
  const corps = onglet === 'deck' ? ongletDeck() : onglet === 'carte' ? ongletCarte() : ongletEffets(trouvees);
  return `<div class="voile-feuille" data-action="guide-fermer" aria-hidden="true"></div>`
    + `<section class="feuille guide" role="dialog" aria-modal="true" aria-labelledby="guide-titre"><span class="poignee" aria-hidden="true"></span>`
    + `<header class="feuille-tete"><div class="titres"><span class="surtitre">MODE D’EMPLOI</span><h2 id="guide-titre">Les cartes et le deck</h2></div>`
    + `<button type="button" class="btn-icone" data-action="guide-fermer" aria-label="Fermer">${ICO.fermer}</button></header>`
    + `<div class="segments-choix guide-onglets" role="tablist">`
    + ONGLETS.map((o) => `<button type="button" role="tab" class="seg${o.id === onglet ? ' actif' : ''}" data-action="guide" data-id="${o.id}" aria-selected="${o.id === onglet}">${o.nom}</button>`).join('')
    + `</div><div class="feuille-corps guide-corps" data-onglet="${onglet}">${corps}</div></section>`;
}

/** Les cartes trouvées (id de base) à partir des exemplaires de la collection (« carte@métal ») */
export const trouveesDe = (collection: Record<string, unknown>): Set<string> => new Set(Object.keys(collection).map(moduleDe));

/** Un bouton qui ouvre le mode d'emploi sur un onglet */
export const lienGuide = (onglet: OngletGuide, texte: string, classe = '') =>
  `<button type="button" class="lien-guide${classe ? ' ' + classe : ''}" data-action="guide" data-id="${onglet}">${ICO.aide}<span>${texte}</span></button>`;

// ---------- Ce que disent les données ----------

/** Combien de cartes de chaque lignée ont chaque Fréquence principale (1 à 9) */
function frequencesLignee(l: Lignee): number[] {
  const n = Array.from({ length: 9 }, () => 0);
  for (const m of MODULES) if (m.lignee === l && !frequenceLibre(m.effet)) n[m.f[0]! - 1]!++;
  return n;
}

/** Les Fréquences principales des cartes d'une lignée, de la plus basse à la plus haute (« 1 à 5 ») */
export function plageFrequences(l: Lignee): string {
  const ok = frequencesLignee(l).map((k, i) => (k ? i + 1 : 0)).filter(Boolean);
  return `${Math.min(...ok)} à ${Math.max(...ok)}`;
}

/** Les actions du deck de départ : le repère conseillé */
function actionsDepart(): Record<TypeGeste, number> {
  const n: Record<TypeGeste, number> = { atk: 0, bouclier: 0, soin: 0 };
  for (const g of DECK_DEPART) n[g.type]++;
  return n;
}

/** Les cartes portant un effet, et la lignée qui le porte le plus souvent */
function porteurs(t: TypeEffet) {
  const cartes = MODULES.filter((m) => m.effet?.type === t);
  const parLignee = LIGNEES.map((l) => ({ l, n: cartes.filter((m) => m.lignee === l).length })).sort((a, b) => b.n - a.n);
  return { cartes, lignee: parLignee[0]!.l };
}

/** La fourchette d'un effet chiffré, sur les cartes qui le portent (dans leur métal d'origine) */
function fourchette(t: TypeEffet): string {
  const parts = MODULES.map((m) => m.effet).filter((e): e is NonNullable<typeof e> & { part: number } => !!e && e.type === t && 'part' in e).map((e) => e.part);
  if (!parts.length) return '';
  const a = Math.min(...parts), b = Math.max(...parts);
  return a === b ? pc(a) : `${Math.round(a * 100)} à ${pc(b)}`;
}

/** Les effets de prédilection d'une lignée (au moins deux cartes), du plus courant au moins courant */
export function effetsLignee(l: Lignee): TypeEffet[] {
  const n = new Map<TypeEffet, number>();
  for (const m of MODULES) if (m.lignee === l && m.effet) n.set(m.effet.type, (n.get(m.effet.type) ?? 0) + 1);
  return [...n.entries()].filter(([, k]) => k >= 2).sort((a, b) => b[1] - a[1]).map(([t]) => t);
}

// ---------- Petits visuels ----------

/** Le socle peint des cartes : sa forme dit l'action (étoile de feu = attaque, écu de glace = protection, fleur d'émeraude = soin) */
const symbole = (t: TypeGeste, taille = 18) => `<img class="g-symbole" src="${socleAction(t)}" alt="" width="${taille}" height="${taille}" decoding="async">`;
const NOM_ACTION: Record<TypeGeste, string> = { atk: 'Attaque', bouclier: 'Protection', soin: 'Soin' };

/** Une carte de combat montrée en exemple : la vraie carte, qu'on ne peut pas jouer */
function carteExemple(g: GesteDef, taille: 'chaine' | 'main', o: { lourd?: boolean } = {}): string {
  const html = geste({ ...g, uid: `guide-${g.id}`, ...(o.lourd ? { lourd: true } : {}) } as Geste, taille, '');
  return html.replace(/^<button type="button"/, '<div role="img"').replace(/ data-action="" data-uid="[^"]*"/, '').replace(/<\/button>$/, '</div>');
}

/** L'échelle des Fréquences 1 à 9, et la part de chaque lignée */
function echelleFrequences(): string {
  let h = `<div class="g-echelle" role="img" aria-label="Les Fréquences de chaque lignée : Génés en bas, Augmentés au milieu, Résonants en haut">`
    + `<span></span>${Array.from({ length: 9 }, (_, i) => `<b style="--fc:${couleurFrequence(i + 1)}">${i + 1}</b>`).join('')}`;
  for (const l of ['bio', 'tech', 'reso'] as Lignee[]) {
    const n = frequencesLignee(l);
    const max = Math.max(...n);
    h += `<small style="--c:${COULEUR[l]}">${NOM_LIGNEES[l]}</small>`
      + n.map((k) => `<i style="--c:${COULEUR[l]};--a:${k ? 0.25 + 0.75 * (k / max) : 0}"></i>`).join('');
  }
  return h + `</div>`;
}

/** Le triangle des lignées : chacune bat la suivante */
function triangle(): string {
  const bonus = Math.round((REGLES.bonusLignee - 1) * 100);
  const noeud = (x: number, y: number, l: Lignee) =>
    `<g transform="translate(${x} ${y})"><circle r="25" fill="var(--bg-2)" stroke="${COULEUR[l]}" stroke-width="1.5"/><text y="4" text-anchor="middle" fill="${COULEUR[l]}">${NOM_LIGNEES[l].slice(0, -1)}</text></g>`;
  // une flèche de a vers b, raccourcie pour ne pas entrer dans les cercles
  const fleche = (ax: number, ay: number, bx: number, by: number) => {
    const d = Math.hypot(bx - ax, by - ay), ux = (bx - ax) / d, uy = (by - ay) / d;
    return `<line x1="${ax + ux * 31}" y1="${ay + uy * 31}" x2="${bx - ux * 33}" y2="${by - uy * 33}" marker-end="url(#g-pointe)"/>`;
  };
  return `<svg class="g-triangle" viewBox="0 0 240 172" role="img" aria-label="Augmenté bat Résonant, Résonant bat Géné, Géné bat Augmenté : plus ${bonus} % de dégâts">`
    + `<defs><marker id="g-pointe" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" fill="var(--gold)"/></marker></defs>`
    + `<g class="g-fleches">${fleche(120, 30, 205, 142)}${fleche(205, 142, 35, 142)}${fleche(35, 142, 120, 30)}</g>`
    + `<text class="g-bonus" x="120" y="104" text-anchor="middle">+${bonus} %</text>`
    + noeud(120, 30, 'tech') + noeud(205, 142, 'reso') + noeud(35, 142, 'bio') + `</svg>`;
}

/** Une idée, avec son icône et une ligne d'explication */
const idee = (ico: string, titre: string, texte: string, visuel = '') =>
  `<li class="g-idee"><span class="g-ico" aria-hidden="true">${ico}</span><div><strong>${titre}</strong><p>${texte}</p>${visuel}</div></li>`;

const titre = (ico: string, t: string) => `<h3 class="titre-bloc">${ico}${t}</h3>`;
const ICO_TRIANGLE = '<svg class="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" aria-hidden="true"><path d="M12 4l8 14H4z"/><circle cx="12" cy="4" r="1.6" fill="currentColor"/><circle cx="20" cy="18" r="1.6" fill="currentColor"/><circle cx="4" cy="18" r="1.6" fill="currentColor"/></svg>';

// ---------- Onglet 1 : le deck ----------

function ongletDeck(): string {
  const total = ESCOUADE * DISTRICT.cartesMax + GESTES_SPECIAUX.length;
  const depart = actionsDepart();
  const nDepart = DECK_DEPART.length;
  let h = '';

  // le schéma : trois Porteurs, leurs cartes, et les cartes du district
  const colonne = (id: string, l: Lignee) => `<div class="g-col" style="--c:${COULEUR[l]}">${avatar(id, 38)}<span class="g-cases">${'<i></i>'.repeat(DISTRICT.cartesMax)}</span><small>${NOM_LIGNEES[l].slice(0, -1)}</small></div>`;
  h += `<section class="g-schema" aria-label="Le deck : ${ESCOUADE} Porteurs de ${DISTRICT.cartesMax} cartes, plus ${GESTES_SPECIAUX.length} cartes du paquetage du district, soit ${total} cartes">`
    + `<div class="g-cols">${colonne('ilka', 'tech')}<b class="g-op">+</b>${colonne('doran', 'bio')}<b class="g-op">+</b>${colonne('vela', 'reso')}<b class="g-op">+</b>`
    + `<div class="g-col district"><span class="g-blason" aria-hidden="true">${ICO.district}</span><span class="g-cases">${'<i></i>'.repeat(GESTES_SPECIAUX.length)}</span><small>District</small></div></div>`
    + `<p class="g-egal"><b>${total}</b> cartes au plus · main de <b>${REGLES.tailleMain}</b> · chaîne de <b>${REGLES.capaciteBase}</b> places</p></section>`;

  // le mode d'emploi, en trois gestes
  h += `<section class="bloc">${titre(ICO.greffe, 'En trois gestes')}<ol class="g-etapes">`
    + `<li><b>Choisis ton escouade.</b> Onglet <em>Escouade</em> : tes ${ESCOUADE} Porteurs, leur Marque et toutes leurs cartes. « Changer » à côté de l’un d’eux en fait entrer un autre. Elle ne change qu’au district, jamais pendant une descente.</li>`
    + `<li><b>Confie-leur des cartes.</b> « Gérer ses cartes » au-dessus de la liste d’un Porteur. Ou, dans le volet <em>Collection</em>, touche une carte puis un Porteur sous « Confier à » (le filtre « Libres » montre celles que personne ne porte).</li>`
    + `<li><b>Vérifie le deck.</b> En haut de l’onglet <em>Escouade</em>, l’échelle des Fréquences montre ce que donnent les cartes de ton escouade, et où ta suite se coupe.</li>`
    + `</ol></section>`;

  // les règles, sans exception
  h += `<section class="bloc">${titre(ICO.verrou, 'Les règles du deck')}<ul class="g-regles">`
    + `<li>Une carte va à un Porteur <b>de sa lignée</b> : Augmenté, Géné ou Résonant.</li>`
    + `<li><b>${DISTRICT.cartesMax} cartes</b> au plus par Porteur, et <b>${DISTRICT.deckMin}</b> au moins dans le deck pour descendre (${EPREUVE_DECK_MIN} pour une Épreuve).</li>`
    + `<li>Chaque carte <b>pèse</b> selon sa force (le chiffre de glace sur sa tuile). Un Porteur porte une <b>Charge</b> de ${chargeNiveau(1)} au niveau 1, +${CHARGE.parNiveau} par niveau : une très grosse carte laisse moins de place aux autres.</li>`
    + `<li>Un Porteur combat toujours avec ses <b>${DISTRICT.cartesMax} places</b> : une place laissée vide se pioche comme une carte et <b>ne se joue pas</b> (sauf dans les Épreuves).</li>`
    + `<li>Une carte n’a qu’<b>un Porteur à la fois</b>. Un Porteur ne porte pas deux fois la même carte, même dans deux métaux.</li>`
    + `<li><b>Stimulant</b> et <b>Repli</b>, le paquetage du district, sont toujours dans le deck.</li>`
    + `<li>Changer d’escouade change le deck. Un Porteur au travail (ou à l’entraînement) peut descendre : il quitte son poste, qui reste vacant.</li>`
    + `<li>Un Porteur en expédition ou en mission garde ses cartes jusqu’à son retour.</li>`
    + `<li>En combat, un Porteur <b>à terre</b> emporte ses cartes : elles quittent le deck tant qu’il ne s’est pas relevé, à un campement.</li>`
    + `</ul></section>`;

  // les conseils
  const barre = (['atk', 'bouclier', 'soin'] as TypeGeste[]).map((t) =>
    `<span class="g-part ${t}" style="flex:${depart[t]}">${symbole(t, 22)}<b>${depart[t]}</b></span>`).join('');
  const suite = Object.entries(REGLES.multSuite).map(([n, m]) => `${n} = +${Math.round((m - 1) * 100)} %`).join(', ');
  h += `<section class="bloc">${titre(ICO.boost, 'Bien construire')}<ul class="g-idees">`
    + idee(ICO.flux, 'Couvre les Fréquences de 1 à 9', `Des Fréquences qui se suivent font une Résonance (suite de ${suite}). Chaque lignée a sa zone : une escouade des trois lignées couvre l’échelle, et un chiffre absent coupe tes suites.`, echelleFrequences())
    + idee(ICO.cartes, 'Double les Fréquences utiles', `Deux ou trois cartes sur la même Fréquence, et tu l’as plus souvent en main. Trois identiques dans une chaîne font un Écho : bouclier d’escouade +${REGLES.bouclierEcho} et +1 Flux.`)
    + idee(ICO.atk, 'Mélange les actions', `Attaque, protection et soin. Le deck de départ en compte ${depart.atk}, ${depart.bouclier} et ${depart.soin} sur ${nDepart} : un bon repère.`, `<div class="g-barre" role="img" aria-label="${depart.atk} attaques, ${depart.bouclier} protections, ${depart.soin} soins">${barre}</div>`)
    + idee(ICO.cristal, 'Choisis aussi pour les Marques', 'Chaque Porteur gagne une Marque par ses exploits, presque toujours en combattant. Elle ne joue que s’il est dans l’escouade : l’onglet Escouade dit ce qu’elle fait et combien il en reste à accomplir.')
    + idee(ICO.soin, 'Répartis les soins', 'Un Porteur à terre emporte ses cartes. Si tous tes soins sont chez lui, l’escouade n’en a plus au pire moment.')
    + idee(ICO.place, 'Peu de cartes lourdes', `« 2 PL. » : la carte est forte mais prend deux places. Avec une autre carte, elle remplit une chaîne de ${REGLES.capaciteBase} places : pas de suite de 3 sans Flux ni Élan.`)
    + idee('<b class="g-etoile">∗</b>', 'Des jokers pour les suites', 'Une carte ∗ (Accord) prend toujours la Fréquence qui prolonge ta suite. En argent et en or, une carte porte 2 Fréquences, en nacre 3.')
    + idee(ICO_TRIANGLE, 'Pense au triangle', `Augmenté bat Résonant, Résonant bat Géné, Géné bat Augmenté : +${Math.round((REGLES.bonusLignee - 1) * 100)} % de dégâts. Les ennemis en profitent aussi contre tes Porteurs. Le dessin est dans « Lire une carte ».`)
    + idee(ICO.repiocher, 'Un deck court tourne plus vite', `Un Porteur peut porter moins de ${DISTRICT.cartesMax} cartes : tes meilleures reviennent plus souvent en main, mais tu couvres moins de Fréquences.`)
    + idee(ICO.monter, 'Fais monter tes favorites', `Doublons et composants : +${Math.round(COLLECTION.bonusNiveau * 100)} % de force par niveau. Confie-les aux Porteurs que tu emmènes le plus souvent.`)
    + `</ul></section>`;
  return h;
}

// ---------- Onglet 2 : lire une carte ----------

/** La carte annotée : un exemple réel, et ce que dit chaque partie */
const EXEMPLE = carteId('coeur-meute', 'or');

function ongletCarte(): string {
  const ex = gesteDeCarte(EXEMPLE, 'doran');
  let h = `<section class="bloc">${titre(ICO.cartes, 'En combat')}<div class="g-anatomie">`
    + `<div class="g-anat-carte">${carteExemple(ex, 'chaine')}`
    + ['freq', 'effet', 'force', 'nom', 'cadre'].map((k, i) => `<i class="g-num n-${k}" aria-hidden="true">${i + 1}</i>`).join('')
    + `</div><ol class="g-legende">`
    + `<li><b>Fréquence</b> : le chiffre du cristal, en haut à gauche ; sa couleur suit la Fréquence.</li>`
    + `<li><b>Effet</b>, en lettres d’or.</li>`
    + `<li><b>Action et force</b> : la forme du socle dit ce qu’elle fait (étoile = attaque, écu = défense, fleur = soin), le chiffre combien.</li>`
    + `<li><b>Nom</b> de la carte.</li>`
    + `<li><b>Cadre</b> : le métal de la carte.</li>`
    + `</ol></div><ul class="g-regles">`
    + `<li>Des Fréquences qui se suivent font une <b>Résonance</b>. Une carte à plusieurs Fréquences (argent et plus) prend seule celle qui prolonge ta suite ; en combat, le bouton sous la carte permet d’en changer.</li>`
    + `<li>Plus le métal est rare, plus le cadre est fin. La nacre n’en a pas.</li>`
    + `<li>Le <b>nom</b> est en bas à gauche de la carte.</li>`
    + `</ul></section>`;

  // la même carte dans la collection
  h += `<section class="bloc">${titre(ICO.codex, 'Dans ta collection')}<div class="g-collection"><div class="g-face">${faceCarte(moduleDef(EXEMPLE), COLLECTION.niveauDepart.or)}</div>`
    + `<ul class="g-regles"><li>En haut, son <b>niveau</b> et sa <b>lignée</b>.</li><li>Dans la Collection (onglet Escouade), la jauge sous la carte compte les <b>doublons</b> qu’il faut pour monter.</li><li>Touche la carte pour lire son effet en entier et sa petite histoire.</li></ul></div></section>`;

  // les trois actions
  h += `<section class="bloc">${titre(ICO.atk, 'Trois actions')}<ul class="g-actions">`
    + `<li>${symbole('atk', 36)}<div><b>Attaque</b><p>Des dégâts à l’ennemi visé. Son bouclier encaisse d’abord.</p></div></li>`
    + `<li>${symbole('bouclier', 36)}<div><b>Protection</b><p>Un bouclier pour toute l’escouade. Il encaisse les coups de l’ennemi, puis disparaît (sauf Rempart).</p></div></li>`
    + `<li>${symbole('soin', 36)}<div><b>Soin</b><p>Des PV à un Porteur : touche son nom sous la carte, dans la chaîne, pour choisir qui. Avec Vague, toute l’escouade.</p></div></li>`
    + `<li><span class="g-lourd">2 PL.</span><div><b>Carte lourde</b><p>Plus forte, mais elle prend deux places dans la chaîne.</p></div></li>`
    + `</ul></section>`;

  // les métaux
  const lignes: [string, (r: typeof RARETES[number]) => string][] = [
    ['Force', (r) => pc(METAL_FORCE[r] / METAL_FORCE.fer)],
    ['Effet', (r) => (METAL_RENFORT[r] === 0 ? 'non' : METAL_RENFORT[r] === 1 ? 'oui' : `+${Math.round((METAL_RENFORT[r] - 1) * 100)} %`)],
    ['Fréquences', (r) => String(METAL_FREQ[r])],
    ['Niveau de départ', (r) => String(COLLECTION.niveauDepart[r])],
  ];
  h += `<section class="bloc">${titre(ICO.cristal, 'Cinq métaux')}<div class="g-metaux" role="table" aria-label="Ce que change le métal">`
    + `<div role="row" class="g-metal-tete"><span role="columnheader"></span>${RARETES.map((r) => `<span role="columnheader" style="--r:${COULEUR_RARETE[r]}"><i style="--tex:url(${textureMetal(r)})"></i>${NOMS_RARETE[r]}</span>`).join('')}</div>`
    + lignes.map(([nom, f]) => `<div role="row"><span role="rowheader">${nom}</span>${RARETES.map((r) => `<span role="cell">${f(r)}</span>`).join('')}</div>`).join('')
    + `</div><ul class="g-regles"><li>Une même carte existe dans les cinq métaux. Le métal est fixé quand tu la trouves : il ne change jamais.</li>`
    + `<li>En fer, une carte n’a pas d’effet. Il s’ouvre en cuivre ; en or et en nacre, ses chiffres montent.</li>`
    + `<li>Deux métaux d’une carte sont deux cartes à part, chacune avec ses doublons et son niveau.</li>`
    + `<li>Doublons et composants font monter une carte : +${Math.round(COLLECTION.bonusNiveau * 100)} % de force par niveau, jusqu’au niveau ${COLLECTION.niveauMax}.</li></ul></section>`;

  // les lignées
  const plages = plageFrequences;
  h += `<section class="bloc">${titre(ICO_TRIANGLE, 'Trois lignées')}<ul class="g-lignees">`
    + LIGNEES.map((l) => `<li style="--c:${COULEUR[l]}"><b>${NOM_LIGNEES[l]}</b><span><em>Fréquences</em>${plages(l)}</span><small>${effetsLignee(l).map((t) => NOMS_EFFET[t]).join(' · ')}</small></li>`).join('')
    + `</ul>${triangle()}<p class="aide">Chaque flèche donne +${Math.round((REGLES.bonusLignee - 1) * 100)} % de dégâts à la lignée qui bat l’autre, dans les deux sens : tes cartes contre les ennemis, et les ennemis contre tes Porteurs.</p></section>`;
  return h;
}

// ---------- Onglet 3 : les effets ----------

const REGLE: Record<TypeEffet, () => string> = {
  percant: () => 'Passe à travers le bouclier et le blindage de l’ennemi.',
  flux: () => 'Remplit le Flux : +1 (+2 en nacre). Le Flux achète une place de plus dans la chaîne, ou une nouvelle main.',
  elan: () => `Ta prochaine chaîne a une place de plus (${REGLES.capaciteMax} au plus).`,
  siphon: () => `Le Porteur qui la joue récupère ${fourchette('siphon')} des dégâts infligés (le plus blessé, s’il est à terre).`,
  vague: () => 'Le soin touche toute l’escouade au lieu d’un seul Porteur.',
  rempart: () => `${fourchette('rempart').replace(/^./, (c) => c.toUpperCase())} du bouclier d’escouade qui reste après l’attaque ennemie passe au tour suivant.`,
  desarmer: () => `La prochaine attaque de l’ennemi visé perd ${fourchette('desarmer')} de sa force.`,
  fissure: () => `L’ennemi visé subit ${fourchette('fissure')} de dégâts en plus, ce tour-ci et le suivant.`,
  accord: () => 'Fréquence libre, notée ∗ : la carte prend toujours celle qui prolonge ta suite.',
  crescendo: () => `+${fourchette('crescendo')} de force pour chaque carte posée avant elle dans la chaîne.`,
  riposte: () => `Une carte de bouclier qui riposte : après avoir donné son bouclier, elle frappe l’ennemi de ${fourchette('riposte')} du bouclier d’escouade. Le bouclier n’est pas dépensé.`,
  decharge: () => `Vide tout le Flux : +${fourchette('decharge')} de force par Flux vidé. Sans Flux, elle frappe normalement.`,
  diapason: () => 'Fréquence libre, notée = : la carte reprend la Fréquence de celle posée juste avant (en tête de chaîne, celle d’après).',
  unisson: () => `+${fourchette('unisson')} de force pour chaque autre carte de la même Fréquence dans la chaîne.`,
};

function astuce(t: TypeEffet): string {
  switch (t) {
    case 'percant': return 'Garde-la pour un ennemi qui vient de se protéger, ou contre un Blindé.';
    case 'flux': return `Une chaîne n’a que ${REGLES.capaciteBase} places : le Flux ouvre les suites de 4 et de 5.`;
    case 'elan': return 'Joue-la quand ta main n’a pas de belle suite : au tour suivant, vise une suite de 4.';
    case 'siphon': return 'Plus elle frappe fort, plus elle soigne : place-la dans une Résonance, chez un Porteur blessé.';
    case 'vague': return 'Contre les attaques de zone et les groupes, quand tout le monde a pris des coups.';
    case 'rempart': return 'Quand l’ennemi se protège au lieu de frapper : une partie de ton bouclier sert encore au tour suivant.';
    case 'desarmer': return 'Quand l’ennemi annonce un gros coup. S’il n’annonce pas d’attaque, l’effet ne fait rien.';
    case 'fissure': return 'Pose-la tôt : seules les cartes jouées après elle en profitent, et encore au tour suivant.';
    case 'accord': return 'Elle bouche le trou d’une suite. En tête de chaîne, elle se cale juste avant la carte qui la suit.';
    case 'riposte': return 'Pose-la en dernier : elle profite de tout le bouclier déjà monté dans la chaîne, et de celui gardé par un Rempart ou la Marque de Doran.';
    case 'decharge': return `Remplis le Flux (Surcharge, Résonance, Écho), puis vide-le d’un coup : à ${REGLES.fluxMax} Flux, la force fait plus que doubler. Mais ce Flux ne servira ni au Coup d’éclat ni à une place de plus.`;
    case 'diapason': return `Elle complète un Écho : deux cartes de même Fréquence et un Diapason, et l’escouade gagne ${REGLES.bouclierEcho} de bouclier et 1 Flux.`;
    case 'unisson': return 'Trois cartes de même Fréquence : chacune compte les deux autres. La Dissonance ne brouille que les suites, pas l’Unisson ni l’Écho.';
    case 'crescendo': {
      const parts = MODULES.map((m) => m.effet).filter((e): e is { type: 'crescendo'; part: number } => e?.type === 'crescendo').map((e) => e.part);
      const max = REGLES.capaciteMax - 1;
      return `En dernière place d’une longue chaîne : cinquième, elle gagne +${Math.round(Math.min(...parts) * max * 100)} à ${Math.round(Math.max(...parts) * max * 100)} %.`;
    }
  }
}

function ongletEffets(trouvees: ReadonlySet<string>): string {
  const renfort = (r: 'or' | 'nacre') => Math.round((METAL_RENFORT[r] - 1) * 100);
  let h = `<p class="g-chapeau">En <b>fer</b>, une carte n’a pas d’effet. Il s’ouvre en <b style="color:${COULEUR_RARETE.cuivre}">cuivre</b>. En <b style="color:${COULEUR_RARETE.or}">or</b>, les effets en pourcentage sont ${renfort('or')} % plus forts, en <b style="color:${COULEUR_RARETE.nacre}">nacre</b> ${renfort('nacre')} %.</p>`;
  const types = Object.keys(NOMS_EFFET) as TypeEffet[];
  for (const l of LIGNEES) {
    const ici = types.map((t) => ({ t, ...porteurs(t) })).filter((x) => x.lignee === l).sort((a, b) => b.cartes.length - a.cartes.length);
    if (!ici.length) continue;
    h += `<section class="bloc"><h3 class="titre-bloc" style="--c:${COULEUR[l]}"><i class="g-pastille" style="--c:${COULEUR[l]}"></i>Surtout chez les ${NOM_LIGNEES[l]}</h3><ul class="g-effets">`;
    for (const { t, cartes } of ici) {
      const vues = cartes.filter((m) => trouvees.has(m.id));
      const reste = cartes.length - vues.length;
      const liste = (vues.length ? vues.map((m) => `<span style="--c:${COULEUR[m.lignee]}">${echap(m.nom)}</span>`).join('') : '')
        + (reste ? `<span class="a-trouver">${vues.length ? '+ ' : ''}${reste} à trouver</span>` : '');
      h += `<li style="--c:${COULEUR[l]}"><div class="g-effet-tete"><b>${NOMS_EFFET[t]}</b></div><p>${REGLE[t]()}</p><p class="g-astuce">${ICO.cristal}<span>${astuce(t)}</span></p><div class="g-sur">${liste}</div></li>`;
    }
    h += `</ul></section>`;
  }
  // le paquetage du district
  h += `<section class="bloc">${titre(ICO.district, 'Le paquetage du district')}<div class="g-district">`
    + GESTES_SPECIAUX.map((g) => `<div class="g-carte-district">${carteExemple(g, 'main')}<p><b>${echap(g.nom)}</b>${NOM_ACTION[g.type]} ${g.v}, Fréquence ${g.f}${g.effet ? `, ${NOMS_EFFET[g.effet.type]}` : ''}.</p></div>`).join('')
    + `</div><p class="aide">Le district les fournit à chaque escouade qui descend : le Stimulant vient de la Clinique, le Repli de la Tour du Noyau. Jouées par personne, elles restent même quand un Porteur tombe. Elles n’ont pas de métal et ne montent pas de niveau.</p></section>`;
  return h;
}
