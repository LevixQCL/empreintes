// Le mode d'emploi des cartes (22 octobre 2026). Bryan voulait un mode d'emploi pour construire son deck
// et une explication des cartes et de leurs effets. C'est une feuille à trois onglets (le deck, lire une carte,
// les effets), ouverte depuis l'écran Cartes, la feuille d'un Porteur, le détail d'une carte, l'escouade et l'aide du combat.
// Bryan n'aime pas les jeux « full texte » : une idée par ligne, et des visuels (la vraie carte annotée, l'échelle
// des Fréquences, le triangle). Tous les chiffres sont lus dans les données : ils suivent l'équilibrage tout seuls.
//
// Attention aux imports circulaires (vue.ts importe ce fichier) : rien d'importé de ./vue, ./carte ou ./coquille
// ne doit servir au chargement du module, seulement dans les fonctions.

import { CHARGE, COLLECTION, NIVEAU_METAL, NOMS_RARETE, RARETES, chargeNiveau } from '../core/collection';
import { DECK_DEPART, GESTES_SPECIAUX, METAL_FORCE, METAL_FREQ, METAL_RENFORT, MODULES_TIRABLES as MODULES, carteId, gesteDeCarte, moduleDe, moduleDef } from '../core/donnees';
import { NOMS_EFFET } from '../core/effets';
import { DISTRICT, EPREUVE_DECK_MIN } from '../core/jeu';
import { REGLES, ZONES_FREQUENCES, frequenceLibre, pctEcho } from '../core/regles';
import type { Geste, GesteDef, Lignee, TypeEffet, TypeGeste } from '../core/types';
import { textureMetal } from './art';
import { COULEUR_RARETE, ICONES_ACTION, SIGNE_LOURD, couleurFrequence, faceCarte } from './carte';
import { NOM_LIGNEES, avatar } from './coquille';
import { ICO, baseIcones } from './icones';
import { COULEUR, geste } from './vue';
import { echap } from './outils';
import { avecMots, ongletGlossaire } from './lexique';
import { t as tr, pourCent } from '../core/i18n';

export type OngletGuide = 'deck' | 'carte' | 'effets' | 'glossaire';

const ONGLETS: { id: OngletGuide; nom: string }[] = [
  { id: 'deck', nom: tr('Le deck') },
  { id: 'carte', nom: tr('Lire une carte') },
  { id: 'effets', nom: tr('Les effets') },
  // 31 octobre 2026 (Luc) : tous les mots du jeu au même endroit
  { id: 'glossaire', nom: tr('Glossaire') },
];

const LIGNEES: Lignee[] = ['tech', 'bio', 'reso'];
const pc = (x: number) => pourCent(Math.round(x * 100));
/** Combien de Porteurs descendent ensemble */
const ESCOUADE = 3;

/**
 * La feuille du mode d'emploi.
 * @param trouvees les cartes déjà trouvées (id de base, sans métal) : l'onglet des effets ne dévoile que celles-là
 */
export function feuilleGuide(onglet: OngletGuide, trouvees: ReadonlySet<string>): string {
  const corps = onglet === 'deck' ? ongletDeck() : onglet === 'carte' ? ongletCarte() : onglet === 'glossaire' ? ongletGlossaire((t) => REGLE[t]()) : ongletEffets(trouvees);
  return `<div class="voile-feuille" data-action="guide-fermer" aria-hidden="true"></div>`
    + `<section class="feuille guide" role="dialog" aria-modal="true" aria-labelledby="guide-titre"><span class="poignee" aria-hidden="true"></span>`
    + `<header class="feuille-tete"><div class="titres"><span class="surtitre">${tr`MODE D’EMPLOI`}</span><h2 id="guide-titre">${tr`Les cartes et le deck`}</h2></div>`
    + `<button type="button" class="btn-icone" data-action="guide-fermer" aria-label="${tr`Fermer`}">${ICO.fermer}</button></header>`
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

/** La zone de Fréquences d'une lignée (« 1 à 5 »), la même que dans les règles */
export function plageFrequences(l: Lignee): string {
  const [a, b] = ZONES_FREQUENCES[l];
  return tr`${a} à ${b}`;
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
  return a === b ? pc(a) : tr`${Math.round(a * 100)} à ${pc(b)}`;
}

/** Les effets de prédilection d'une lignée (au moins deux cartes), du plus courant au moins courant */
export function effetsLignee(l: Lignee): TypeEffet[] {
  const n = new Map<TypeEffet, number>();
  for (const m of MODULES) if (m.lignee === l && m.effet) n.set(m.effet.type, (n.get(m.effet.type) ?? 0) + 1);
  return [...n.entries()].filter(([, k]) => k >= 2).sort((a, b) => b[1] - a[1]).map(([t]) => t);
}

// ---------- Petits visuels ----------

/** Le symbole de l'action, comme sur les cartes : une épée (attaque), un écu (protection), un + (soin), dans sa couleur */
const symbole = (t: TypeGeste, taille = 18) => `<span class="g-symbole ${t}" style="width:${taille}px;height:${taille}px">${ICONES_ACTION[t]}</span>`;
const NOM_ACTION: Record<TypeGeste, string> = { atk: tr('Attaque'), bouclier: tr('Protection'), soin: tr('Soin') };

/** Une carte de combat montrée en exemple : la vraie carte, qu'on ne peut pas jouer */
function carteExemple(g: GesteDef, taille: 'chaine' | 'main', o: { lourd?: boolean } = {}): string {
  const html = geste({ ...g, uid: `guide-${g.id}`, ...(o.lourd ? { lourd: true } : {}) } as Geste, taille, '');
  return html.replace(/^<button type="button"/, '<div role="img"').replace(/ data-action="" data-uid="[^"]*"/, '').replace(/<\/button>$/, '</div>');
}

const dansZone = (l: Lignee, f: number) => f >= ZONES_FREQUENCES[l][0] && f <= ZONES_FREQUENCES[l][1];

/** L'échelle des Fréquences 1 à 9 : la zone de chaque lignée, plus vive là où ses cartes sont nombreuses */
function echelleFrequences(): string {
  let h = `<div class="g-echelle" role="img" aria-label="${tr`Les Fréquences de chaque lignée : Génés en bas, Augmentés au milieu, Résonants en haut`}">`
    + `<span></span>${Array.from({ length: 9 }, (_, i) => `<b style="--fc:${couleurFrequence(i + 1)}">${i + 1}</b>`).join('')}`;
  for (const l of ['bio', 'tech', 'reso'] as Lignee[]) {
    const n = frequencesLignee(l);
    const max = Math.max(...n);
    h += `<small style="--c:${COULEUR[l]}">${NOM_LIGNEES[l]}</small>`
      + n.map((k, i) => `<i style="--c:${COULEUR[l]};--a:${dansZone(l, i + 1) ? 0.25 + 0.75 * (k / max) : 0}"></i>`).join('');
  }
  return h + `</div>`;
}

/** Le triangle des lignées : chacune bat la suivante */
function triangle(): string {
  const bonus = Math.round((REGLES.bonusLignee - 1) * 100);
  const noeud = (x: number, y: number, l: Lignee) =>
    `<g transform="translate(${x} ${y})"><circle r="25" fill="var(--bg-2)" stroke="${COULEUR[l]}" stroke-width="1.5"/><image href="${baseIcones}lignee-${l}.webp" x="-17" y="-17" width="34" height="34"/><text y="40" text-anchor="middle" fill="${COULEUR[l]}">${NOM_LIGNEES[l].slice(0, -1)}</text></g>`;
  // une flèche de a vers b, raccourcie pour ne pas entrer dans les cercles
  const fleche = (ax: number, ay: number, bx: number, by: number) => {
    const d = Math.hypot(bx - ax, by - ay), ux = (bx - ax) / d, uy = (by - ay) / d;
    return `<line x1="${ax + ux * 31}" y1="${ay + uy * 31}" x2="${bx - ux * 33}" y2="${by - uy * 33}" marker-end="url(#g-pointe)"/>`;
  };
  return `<svg class="g-triangle" viewBox="0 0 240 190" role="img" aria-label="${tr`Augmenté bat Résonant, Résonant bat Géné, Géné bat Augmenté : plus ${bonus} % de dégâts`}">`
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
  h += `<section class="g-schema" aria-label="${tr`Le deck : ${ESCOUADE} Porteurs de ${DISTRICT.cartesMax} cartes, plus ${GESTES_SPECIAUX.length} cartes du Râtelier de l’escouade (jusqu’à 4), soit ${total} cartes`}">`
    + `<div class="g-cols">${colonne('ilka', 'tech')}<b class="g-op">+</b>${colonne('doran', 'bio')}<b class="g-op">+</b>${colonne('vela', 'reso')}<b class="g-op">+</b>`
    + `<div class="g-col district"><span class="g-blason" aria-hidden="true">${ICO.district}</span><span class="g-cases">${'<i></i>'.repeat(GESTES_SPECIAUX.length)}</span><small>${tr`District`}</small></div></div>`
    + `<p class="g-egal"><b>${total}</b> ${tr`cartes au plus · main de`} <b>${REGLES.tailleMain}</b> ${tr`· chaîne de`} <b>${REGLES.capaciteBase}</b> ${tr`places`}</p></section>`;

  // le mode d'emploi, en trois gestes
  h += `<section class="bloc">${titre(ICO.greffe, tr('En trois gestes'))}<ol class="g-etapes">`
    + `<li><b>${tr`Choisis ton escouade.`}</b> ${tr`Onglet`} <em>${tr`Escouade`}</em> ${tr`: tes ${ESCOUADE} Porteurs, leur Marque et toutes leurs cartes. « Changer » à côté de l’un d’eux en fait entrer un autre. Elle ne change qu’au district, jamais pendant une descente.`}</li>`
    + `<li><b>${tr`Confie-leur des cartes.`}</b> ${tr`« Gérer ses cartes » au-dessus de la liste d’un Porteur. Ou, dans le volet`} <em>${tr`Collection`}</em>${tr`, touche une carte puis un Porteur sous « Confier à » (le filtre « Libres » montre celles que personne ne porte).`}</li>`
    + `<li><b>${tr`Vérifie le deck.`}</b> ${tr`En haut de l’onglet`} <em>${tr`Escouade`}</em>${tr`, l’échelle des Fréquences montre ce que donnent les cartes de ton escouade, et où ta suite se coupe.`}</li>`
    + `</ol></section>`;

  // les règles, sans exception
  h += `<section class="bloc">${titre(ICO.verrou, tr('Les règles du deck'))}<ul class="g-regles">`
    + `<li>${tr`Une carte va à un Porteur`} <b>${tr`de sa lignée`}</b> ${tr`: Augmenté, Géné ou Résonant.`}</li>`
    + `<li><b>${tr`${DISTRICT.cartesMax} cartes`}</b> ${tr`au plus par Porteur, et`} <b>${DISTRICT.deckMin}</b> ${tr`au moins dans le deck pour descendre (${EPREUVE_DECK_MIN} pour une Épreuve).`}</li>`
    + `<li>${tr`Chaque carte`} <b>${tr`pèse`}</b> ${tr`selon sa force (le chiffre de glace sur sa tuile). Un Porteur porte une`} <b>${tr`Charge`}</b> ${tr`de ${chargeNiveau(1)} au niveau 1, +${CHARGE.parNiveau} par niveau : une très grosse carte laisse moins de place aux autres.`}</li>`
    + `<li>${tr`Un Porteur combat toujours avec ses`} <b>${tr`${DISTRICT.cartesMax} places`}</b> ${tr`: une place laissée vide se pioche comme une carte et`} <b>${tr`ne se joue pas`}</b> ${tr`(sauf dans les Épreuves).`}</li>`
    + `<li>${tr`Une carte n’a qu’`}<b>${tr`un Porteur à la fois`}</b>${tr`. Un Porteur ne porte pas deux fois la même carte, même dans deux métaux.`}</li>`
    + `<li>${tr`Les cartes communes du`} <b>${tr`Râtelier`}</b> ${tr`de l’escouade (2 à 4, choisies au district) s’ajoutent au deck, si les cristaux du départ sont payés.`}</li>`
    + `<li>${tr`Changer d’escouade change le deck. Un Porteur au travail (ou à l’entraînement) peut descendre : il quitte son poste, qui reste vacant.`}</li>`
    + `<li>${tr`Un Porteur en expédition ou en mission garde ses cartes jusqu’à son retour.`}</li>`
    + `<li>${tr`En combat, les cartes d’un Porteur`} <b>${tr`à terre`}</b> ${tr`s’éteignent : elles restent dans le deck un peu moins fortes (−15 %) et sans effet, et leur Fréquence compte toujours pour les suites. Il se relève à un campement.`}</li>`
    + `</ul></section>`;

  // les conseils
  const barre = (['atk', 'bouclier', 'soin'] as TypeGeste[]).map((t) =>
    `<span class="g-part ${t}" style="flex:${depart[t]}">${symbole(t, 22)}<b>${depart[t]}</b></span>`).join('');
  const suite = Object.entries(REGLES.multSuite).map(([n, m]) => `${n} = +${pourCent(Math.round((m - 1) * 100))}`).join(', ');
  h += `<section class="bloc">${titre(ICO.boost, tr('Bien construire'))}<ul class="g-idees">`
    + idee(ICO.flux, tr('Couvre les Fréquences de 1 à 9'), tr`Des Fréquences qui se suivent font une Résonance (suite de ${suite}). Chaque lignée a sa zone : une escouade des trois lignées couvre l’échelle, et un chiffre absent coupe tes suites.`, echelleFrequences())
    + idee(ICO.cartes, tr('Double les Fréquences utiles'), tr`Deux ou trois cartes sur la même Fréquence, et tu l’as plus souvent en main. Trois identiques dans une chaîne font un Écho : ces cartes +${Math.round((REGLES.echo - 1) * 100)} % et +1 Flux (quatre : ${pctEcho(4)}, cinq : ${pctEcho(5)}). Mais une Fréquence empilée, ce sont moins de suites.`)
    + idee(ICO.atk, tr('Mélange les actions'), tr`Attaque, protection et soin. Le deck de départ en compte ${depart.atk}, ${depart.bouclier} et ${depart.soin} sur ${nDepart} : un bon repère.`, `<div class="g-barre" role="img" aria-label="${tr`${depart.atk} attaques, ${depart.bouclier} protections, ${depart.soin} soins`}">${barre}</div>`)
    + idee(ICO.cristal, tr('Choisis aussi pour les Marques'), tr('Chaque Porteur gagne une Marque par ses exploits, presque toujours en combattant. Elle ne joue que s’il est dans l’escouade : l’onglet Escouade dit ce qu’elle fait et combien il en reste à accomplir.'))
    + idee(ICO.soin, tr('Répartis les soins'), tr('Les cartes d’un Porteur à terre s’éteignent. Si tous tes soins sont chez lui, ils perdent leur effet au pire moment.'))
    + idee(ICO.place, tr('Peu de cartes lourdes'), tr`Deux lames (deux places) : la carte est forte mais prend deux places. Avec une autre carte, elle remplit une chaîne de ${REGLES.capaciteBase} places : pas de suite de 3 sans Flux ni Élan.`)
    + idee('<b class="g-etoile">∗</b>', tr('Des jokers pour les suites'), tr('Une carte ∗ (Accord) prend toujours la Fréquence qui prolonge ta suite. En argent et en or, une carte porte 2 Fréquences, en nacre 3.'))
    + idee(ICO_TRIANGLE, tr('Pense au triangle'), tr`Augmenté bat Résonant, Résonant bat Géné, Géné bat Augmenté : +${Math.round((REGLES.bonusLignee - 1) * 100)} % de dégâts. Les ennemis en profitent aussi contre tes Porteurs. Le dessin est dans « Lire une carte ».`)
    + idee(ICO.repiocher, tr('Un deck court tourne plus vite'), tr`Un Porteur peut porter moins de ${DISTRICT.cartesMax} cartes : tes meilleures reviennent plus souvent en main, mais tu couvres moins de Fréquences.`)
    + idee(ICO.monter, tr('Fais monter tes favorites'), tr`Doublons et cristaux : 5 niveaux par carte, qui renforcent sa force puis son effet (une carte de 10 passe à 13 de force au niveau 4). Confie-les aux Porteurs que tu emmènes le plus souvent.`)
    + `</ul></section>`;
  return h;
}

// ---------- Onglet 2 : lire une carte ----------

/** La carte annotée : un exemple réel, et ce que dit chaque partie */
const EXEMPLE = carteId('coeur-meute', 'or');

function ongletCarte(): string {
  const ex = gesteDeCarte(EXEMPLE, 'doran');
  let h = `<section class="bloc">${titre(ICO.cartes, tr('La carte'))}<div class="g-anatomie">`
    + `<div class="g-anat-carte">${faceCarte(moduleDef(EXEMPLE), COLLECTION.niveauDepart.or)}`
    + ['freq', 'force', 'niveau', 'effet', 'cadre'].map((k, i) => `<i class="g-num n-${k}" aria-hidden="true">${i + 1}</i>`).join('')
    + `</div><ol class="g-legende">`
    + `<li><b>${tr`Fréquences`}</b>${tr`, en haut à gauche : la principale d’abord ; leur couleur suit la Fréquence.`}</li>`
    + `<li><b>${tr`Action et force`}</b> ${tr`: l’icône dit ce qu’elle fait (épée = attaque, écu = protection, + = soin), le chiffre combien. La barre et le bord de l’image prennent sa couleur.`}</li>`
    + `<li><b>${tr`Niveau et nom`}</b> ${tr`: la roue compte les niveaux (${COLLECTION.niveauMax} crans, dorée au maximum), dans la couleur de la lignée.`}</li>`
    + `<li><b>${tr`Effet`}</b> ${tr`: son icône, son nom et ce qu’il fait, en bref.`}</li>`
    + `<li><b>${tr`Cadre`}</b> ${tr`: le métal de la carte, jusque sous le nom. La nacre n’en a pas.`}</li>`
    + `</ol></div><ul class="g-regles">`
    + `<li>${tr`Des Fréquences qui se suivent font une`} <b>${tr`Résonance`}</b>${tr`. Une carte à plusieurs Fréquences (argent et plus) prend seule celle qui prolonge ta suite ; en combat, le bouton sous la carte permet d’en changer.`}</li>`
    + `<li>${tr`Dans la Collection (onglet Escouade), la jauge sous la carte compte les`} <b>${tr`doublons`}</b> ${tr`qu’il faut pour monter. Touche la carte pour lire son effet en entier et sa petite histoire.`}</li>`
    + `</ul></section>`;

  // la même carte en combat
  h += `<section class="bloc">${titre(ICO.codex, tr('En combat'))}<div class="g-collection"><div class="g-main">${carteExemple(ex, 'main')}</div>`
    + `<ul class="g-regles"><li>${tr`En main, la carte garde l’essentiel : la`} <b>${tr`Fréquence`}</b>${tr`, la`} <b>${tr`force`}</b> ${tr`en bas à droite et, en bas à gauche, le`} <b>${tr`losange de la lignée`}</b> ${tr`avec l’`}<b>${tr`icône de l’effet`}</b> ${tr`(liseré d’or quand la carte en a un). Posée dans la chaîne, elle montre aussi son`} <b>${tr`nom`}</b>.</li><li><b>${tr`Garde le doigt`}</b> ${tr`sur une carte (ou le bouton de la souris) : elle s’affiche en grand avec ses effets en entier. Lâche : elle revient à sa place, sans être jouée.`}</li>`
    + `<li>${tr`La carte qui prolonge ta suite se soulève et sa capsule de Fréquence s’allume en or.`}</li></ul></div></section>`;

  // les trois actions
  h += `<section class="bloc">${titre(ICO.atk, tr('Trois actions'))}<ul class="g-actions">`
    + `<li>${symbole('atk', 36)}<div><b>${tr`Attaque`}</b><p>${tr`Des dégâts à l’ennemi visé. Son bouclier encaisse d’abord.`}</p></div></li>`
    + `<li>${symbole('bouclier', 36)}<div><b>${tr`Protection`}</b><p>${tr`Un bouclier pour toute l’escouade. Il encaisse les coups de l’ennemi, puis disparaît (sauf Rempart).`}</p></div></li>`
    + `<li>${symbole('soin', 36)}<div><b>${tr`Soin`}</b><p>${tr`Des PV à un Porteur : touche son nom sous la carte, dans la chaîne, pour choisir qui. Avec Vague, toute l’escouade.`}</p></div></li>`
    + `<li><span class="g-lourd signe-lourd">${SIGNE_LOURD}</span><div><b>${tr`Carte lourde`}</b><p>${tr`Plus forte, mais elle prend deux places dans la chaîne.`}</p></div></li>`
    + `</ul></section>`;

  // les métaux
  const lignes: [string, (r: typeof RARETES[number]) => string][] = [
    [tr('Force'), (r) => pc(METAL_FORCE[r] / METAL_FORCE.fer)],
    [tr('Effet'), (r) => (METAL_RENFORT[r] === 0 ? tr('non') : METAL_RENFORT[r] === 1 ? tr('oui') : `+${pourCent(Math.round((METAL_RENFORT[r] - 1) * 100))}`)],
    [tr('Fréquences'), (r) => String(METAL_FREQ[r])],
    [tr('Porteur requis'), (r) => (NIVEAU_METAL[r] > 1 ? `niv. ${NIVEAU_METAL[r]}` : '—')],
  ];
  h += `<section class="bloc">${titre(ICO.cristal, tr('Cinq métaux'))}<div class="g-metaux" role="table" aria-label="${tr`Ce que change le métal`}">`
    + `<div role="row" class="g-metal-tete"><span role="columnheader"></span>${RARETES.map((r) => `<span role="columnheader" style="--r:${COULEUR_RARETE[r]}"><i style="--tex:url(${textureMetal(r)})"></i>${NOMS_RARETE[r]}</span>`).join('')}</div>`
    + lignes.map(([nom, f]) => `<div role="row"><span role="rowheader">${nom}</span>${RARETES.map((r) => `<span role="cell">${f(r)}</span>`).join('')}</div>`).join('')
    + `</div><ul class="g-regles"><li>${tr`Une même carte existe dans les cinq métaux. Le métal est fixé quand tu la trouves : il ne change jamais.`}</li>`
    + `<li>${tr`En fer, une carte n’a pas d’effet. Il s’ouvre en cuivre ; en or et en nacre, ses chiffres montent.`}</li>`
    + `<li>${tr`Un métal rare demande un Porteur expérimenté : argent au niveau ${NIVEAU_METAL.argent}, or au niveau ${NIVEAU_METAL.or}, nacre au niveau ${NIVEAU_METAL.nacre}. Trouvée plus tôt, la carte t’attend dans ta collection.`}</li>`
    + `<li>${tr`Deux métaux d’une carte sont deux cartes à part, chacune avec ses doublons et son niveau.`}</li>`
    + `<li>${tr`Doublons et cristaux font monter une carte, de 1 à ${COLLECTION.niveauMax} quel que soit son métal. Niveaux 2 et 4 : environ +${Math.round(COLLECTION.bonusNiveau * 100)} % de sa force de départ ; niveaux 3 et 5 : son effet se renforce (une Fissure 25 % passe à 30 %, puis 35 %), ou sa force, si elle n’a pas d’effet à renforcer. Au maximum, la carte est`} <b>${tr`maîtrisée`}</b> ${tr`: un liseré de lumière parcourt son cadre.`}</li></ul></section>`;

  // les lignées
  const plages = plageFrequences;
  h += `<section class="bloc">${titre(ICO_TRIANGLE, tr('Trois lignées'))}<ul class="g-lignees">`
    + LIGNEES.map((l) => `<li style="--c:${COULEUR[l]}"><b>${NOM_LIGNEES[l]}</b><span><em>${tr`Fréquences`}</em>${plages(l)}</span><small>${effetsLignee(l).map((t) => NOMS_EFFET[t]).join(' · ')}</small></li>`).join('')
    + `</ul>${triangle()}<p class="aide">${tr`Chaque flèche donne +${Math.round((REGLES.bonusLignee - 1) * 100)} % de dégâts à la lignée qui bat l’autre, dans les deux sens : tes cartes contre les ennemis, et les ennemis contre tes Porteurs.`}</p></section>`;
  return h;
}

// ---------- Onglet 3 : les effets ----------

const REGLE: Record<TypeEffet, () => string> = {
  percant: () => tr('Passe à travers le bouclier et le blindage de l’ennemi.'),
  flux: () => tr('Remplit le Flux : +1 (+2 en nacre). Le Flux achète une place de plus dans la chaîne, ou une nouvelle main.'),
  elan: () => tr`Ta prochaine chaîne a une place de plus (${REGLES.capaciteMax} au plus).`,
  siphon: () => tr`Le Porteur qui la joue récupère ${fourchette('siphon')} des dégâts infligés (sans effet si son Porteur est à terre).`,
  vague: () => tr('Le soin touche toute l’escouade au lieu d’un seul Porteur.'),
  rempart: () => tr`${fourchette('rempart').replace(/^./, (c) => c.toUpperCase())} du bouclier d’escouade qui reste après l’attaque ennemie passe au tour suivant.`,
  desarmer: () => tr`La prochaine attaque de l’ennemi visé perd ${fourchette('desarmer')} de sa force.`,
  fissure: () => tr`L’ennemi visé subit ${fourchette('fissure')} de dégâts en plus, ce tour-ci et le suivant.`,
  accord: () => tr('Fréquence libre, notée ∗ : la carte prend toujours celle qui prolonge ta suite.'),
  crescendo: () => tr`+${fourchette('crescendo')} de force pour chaque carte posée avant elle dans la chaîne.`,
  riposte: () => tr`Une carte de bouclier qui riposte : après avoir donné son bouclier, elle frappe l’ennemi de ${fourchette('riposte')} du bouclier d’escouade. Le bouclier n’est pas dépensé.`,
  decharge: () => tr`Vide tout le Flux : +${fourchette('decharge')} de force par Flux vidé. Sans Flux, elle frappe normalement. Deux variantes : l’Éclair captif ne prend qu’un Flux et garde le reste ; le Noyau instable, s’il trouve le Flux vide, le remplit.`,
  diapason: () => tr('Fréquence libre, notée = : la carte reprend la Fréquence de celle posée juste avant (en tête de chaîne, celle d’après).'),
  unisson: () => tr`+${fourchette('unisson')} de force pour chaque autre carte de la même Fréquence dans la chaîne.`,
  curee: () => tr`+${fourchette('curee')} de force si l’ennemi visé est fissuré (une Fissure posée plus tôt, ce tour-ci ou le précédent), ou s’il lui reste moins de la moitié de ses PV.`,
  lecture: () => tr('Brise la Fêlure de l’ennemi visé, quelle que soit sa Fréquence, même cachée. Brisée en Résonance, elle rapporte du Flux comme d’habitude.'),
  faille: () => tr`+${fourchette('faille')} de force si la Fêlure de l’ennemi visé est déjà brisée ce tour-ci.`,
  rafale: () => tr('Si la chaîne compte au moins 4 cartes, elle frappe une seconde fois, avec la même force.'),
  debord: () => tr('Soigne toute l’escouade, et le soin qui dépasse les PV max n’est pas perdu : il devient du bouclier d’escouade.'),
  rapt: () => tr('Avant d’agir, la carte arrache tout le bouclier de l’ennemi visé et l’ajoute au bouclier d’escouade.'),
  rappel: () => tr('Après le lancer, la carte la plus forte de la chaîne ne va pas à la défausse : elle revient en tête de pioche, tu la retrouves dans ta prochaine main.'),
  surtension: () => tr('Le Porteur qui la joue brûle une part de ses PV max (jamais au point de tomber), et la carte frappe beaucoup plus fort.'),
  empreinte: () => tr`La carte copie l’effet de celle posée juste avant elle (pas une Fréquence libre). S’il n’y a rien à copier (en tête de chaîne, après une carte sans effet), elle frappe +${Math.round((REGLES.empreinteSeule - 1) * 100)} % plus fort.`,
  pioche: () => tr('Au tour suivant, tu pioches une carte de plus : plus de choix pour trouver ta suite.'),
  breche: () => tr('Avant d’agir, la carte brise tout le bouclier de l’ennemi visé.'),
  secours: () => tr('La carte gagne de la force pour chaque Porteur à terre : le district tient quand l’escouade s’effondre.'),
  releve: () => tr('Si un Porteur est à terre, il se relève avec tout le soin. Sinon, la carte soigne comme une autre.'),
  sourdine: () => tr`L’ennemi visé perd ${fourchette('sourdine')} de ce qu’il prépare, quoi que ce soit : son attaque, son bouclier ou son soin.`,
  amorce: () => tr`La carte posée juste après elle dans la chaîne gagne +${fourchette('amorce')} de force.`,
  servo: () => tr('Une carte lourde de la chaîne ne prend qu’une place au lieu de deux. Un Servo par carte lourde, où qu’il soit dans la chaîne.'),
  contrepoint: () => tr`Si la carte est dans une suite qui résonne, elle gagne +${fourchette('contrepoint')} de force pour chaque autre lignée présente dans cette suite (deux au plus).`,
  execution: () => tr`Après le coup, si l’ennemi visé n’a plus que ${fourchette('execution')} de ses PV ou moins, il tombe. Un gardien n’est jamais achevé ainsi.`,
  tenacite: () => tr('Pendant le tour ennemi qui suit, aucun Porteur ne peut tomber : un coup qui l’aurait mis à terre le laisse à 1 PV.'),
};

function astuce(t: TypeEffet): string {
  switch (t) {
    case 'percant': return tr('Garde-la pour un ennemi qui vient de se protéger, ou contre un Blindé.');
    case 'flux': return tr`Une chaîne n’a que ${REGLES.capaciteBase} places : le Flux ouvre les suites de 4 et de 5.`;
    case 'elan': return tr('Joue-la quand ta main n’a pas de belle suite : au tour suivant, vise une suite de 4.');
    case 'siphon': return tr('Plus elle frappe fort, plus elle soigne : place-la dans une Résonance, chez un Porteur blessé.');
    case 'vague': return tr('Contre les attaques de zone et les groupes, quand tout le monde a pris des coups.');
    case 'rempart': return tr('Quand l’ennemi se protège au lieu de frapper : une partie de ton bouclier sert encore au tour suivant.');
    case 'desarmer': return tr('Quand l’ennemi annonce un gros coup. S’il n’annonce pas d’attaque, l’effet ne fait rien.');
    case 'fissure': return tr('Pose-la tôt : seules les cartes jouées après elle en profitent, et encore au tour suivant.');
    case 'accord': return tr('Elle bouche le trou d’une suite. En tête de chaîne, elle se cale juste avant la carte qui la suit.');
    case 'riposte': return tr('Pose-la en dernier : elle profite de tout le bouclier déjà monté dans la chaîne, et de celui gardé par un Rempart ou la Marque de Doran.');
    case 'decharge': return tr`Remplis le Flux (Surcharge, Résonance, Écho), puis vide-le d’un coup : à ${REGLES.fluxMax} Flux, la force fait plus que doubler. Mais ce Flux ne servira ni au Coup d’éclat ni à une place de plus.`;
    case 'diapason': return tr`Elle complète un Écho : deux cartes de même Fréquence et un Diapason, et ces trois cartes sont renforcées de +${Math.round((REGLES.echo - 1) * 100)} %, avec 1 Flux.`;
    case 'unisson': return tr('Trois cartes de même Fréquence : chacune compte les deux autres. La Dissonance coupe les suites et l’Écho, mais pas l’Unisson.');
    case 'curee': return tr('Fissure d’abord, Curée ensuite : la Fissure dure deux tours. Et quand l’ennemi passe sous la moitié de ses PV, toutes tes Curées mordent.');
    case 'lecture': return tr('Contre un Évanescent, elle trouve la Fêlure cachée ; contre un gros coup annoncé, elle le casse sans chercher la bonne Fréquence.');
    case 'faille': return tr('Pose-la après une Lecture, ou après la carte qui a la Fréquence fêlée.');
    case 'rafale': return tr('Une chaîne de 4 demande de la place : Élan et Flux la préparent.');
    case 'debord': return tr('Même quand personne n’est blessé, elle protège : joue-la avant un gros coup annoncé.');
    case 'rapt': return tr('Garde-la pour le tour où l’ennemi vient de se protéger : son bouclier devient le tien.');
    case 'rappel': return tr('Monte une chaîne autour de ta meilleure carte : elle revient tout de suite au tour d’après.');
    case 'surtension': return tr('Quand le Porteur a de la marge, et qu’un soin suit : chaque PV brûlé se rachète.');
    case 'empreinte': return tr('Pose-la juste après ta meilleure carte d’effet : un Perçant, un Siphon, une Fissure…');
    case 'releve': return tr('Garde-la en main quand un Porteur faiblit : elle annule la chute au lieu de la prévenir.');
    case 'pioche': return tr('Pose-la quand ta main ne fait pas de suite : la prochaine aura plus de chances.');
    case 'breche': return tr('Garde-la pour le tour où l’ennemi vient de se protéger.');
    case 'secours': return tr('Ta carte de dernier recours : plus l’escouade tombe, plus elle frappe.');
    case 'sourdine': return tr('Moins forte que Troubler contre une attaque, mais elle sert aussi quand l’ennemi va se protéger ou se soigner.');
    case 'amorce': return tr('Pose-la juste avant ta carte la plus forte : la suivante profite de tout le bonus.');
    case 'servo': return tr('Avec une carte lourde en main, elle rend sa place : un gros coup et une suite de 3 dans la même chaîne.');
    case 'contrepoint': return tr('Une suite qui passe par les trois lignées (Génés, Augmentés, Résonants) lui donne tout son bonus.');
    case 'execution': return tr('Termine la chaîne par elle : les cartes d’avant font descendre l’ennemi, elle l’achève.');
    case 'tenacite': return tr('Le tour où l’ennemi annonce un coup qui tuerait : tout le monde reste debout, puis on soigne.');
    case 'crescendo': {
      const parts = MODULES.map((m) => m.effet).filter((e): e is { type: 'crescendo'; part: number } => e?.type === 'crescendo').map((e) => e.part);
      const max = REGLES.capaciteMax - 1;
      return tr`En dernière place d’une longue chaîne : cinquième, elle gagne +${Math.round(Math.min(...parts) * max * 100)} à ${Math.round(Math.max(...parts) * max * 100)} %.`;
    }
  }
}

function ongletEffets(trouvees: ReadonlySet<string>): string {
  const renfort = (r: 'or' | 'nacre') => Math.round((METAL_RENFORT[r] - 1) * 100);
  let h = `<p class="g-chapeau">${tr`En`} <b>${tr`fer`}</b>${tr`, une carte n’a pas d’effet. Il s’ouvre en`} <b style="color:${COULEUR_RARETE.cuivre}">${tr`cuivre`}</b>${tr`. En`} <b style="color:${COULEUR_RARETE.or}">${tr`or`}</b>${tr`, les effets en pourcentage sont ${renfort('or')} % plus forts, en`} <b style="color:${COULEUR_RARETE.nacre}">${tr`nacre`}</b> ${renfort('nacre')} %.</p>`;
  const types = Object.keys(NOMS_EFFET) as TypeEffet[];
  for (const l of LIGNEES) {
    const ici = types.map((t) => ({ t, ...porteurs(t) })).filter((x) => x.lignee === l).sort((a, b) => b.cartes.length - a.cartes.length);
    if (!ici.length) continue;
    h += `<section class="bloc"><h3 class="titre-bloc" style="--c:${COULEUR[l]}"><i class="g-pastille" style="--c:${COULEUR[l]}"></i>${tr`Surtout chez les ${NOM_LIGNEES[l]}`}</h3><ul class="g-effets">`;
    for (const { t, cartes } of ici) {
      const vues = cartes.filter((m) => trouvees.has(m.id));
      const reste = cartes.length - vues.length;
      const liste = (vues.length ? vues.map((m) => `<span style="--c:${COULEUR[m.lignee]}">${echap(m.nom)}</span>`).join('') : '')
        + (reste ? `<span class="a-trouver">${tr`${vues.length ? '+ ' : ''}${reste} à trouver`}</span>` : '');
      h += `<li style="--c:${COULEUR[l]}"><div class="g-effet-tete"><b>${NOMS_EFFET[t]}</b></div><p>${avecMots(REGLE[t](), [t])}</p><p class="g-astuce">${ICO.cristal}<span>${avecMots(astuce(t), [t])}</span></p><div class="g-sur">${liste}</div></li>`;
    }
    h += `</ul></section>`;
  }
  // le paquetage du district
  h += `<section class="bloc">${titre(ICO.district, tr('Le Râtelier de l’escouade'))}<div class="g-district">`
    + GESTES_SPECIAUX.map((g) => `<div class="g-carte-district">${carteExemple(g, 'main')}<p><b>${echap(g.nom)}</b>${tr`${NOM_ACTION[g.type]} ${g.v}, Fréquence ${g.f}${g.effet ? `, ${NOMS_EFFET[g.effet.type]}` : ''}.`}</p></div>`).join('')
    + `</div><p class="aide">${tr`Au départ, le district fournit ces deux cartes communes : le Stimulant vient de la Clinique, le Pavois de cuivre de la Tour du Noyau. En montant, tes bâtiments en préparent d’autres (Lame d’atelier, Plan des galeries, Brèche, Groupe de secours, Ampoule de relève), et leur force grandit avec eux : chaque niveau du bâtiment leur ajoute de la force (touche une carte pour voir son échelle). Tu choisis celles qui descendent dans le Râtelier de l’escouade : 2 emplacements, 3 au niveau 5 de la Tour du Noyau, 4 au niveau 9. Chaque départ coûte quelques cristaux pour tout le Râtelier à la fois (10 pour explorer, 5 pour une sortie courte) ; sans assez de cristaux, l’escouade part sans elles. Jouées par personne, elles ne s’éteignent jamais quand un Porteur tombe.`}</p></section>`;
  return h;
}
