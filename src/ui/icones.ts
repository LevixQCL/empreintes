import type { Lignee } from '../core/types';
import { t } from '../core/i18n';
// Icônes de l'interface (refaites le 3 novembre 2026, matière « cristal et lumière ») : grille de 24, trait de 1,7, arrondis.
// Chaque icône a un corps en verre teinté (classe v), un reflet de lumière (r), parfois une touche d'or (o) ou un plein (p).
// Elles prennent la couleur du texte (currentColor) : la couleur se règle en CSS (styles.css, « .ico »).

const svg = (corps: string, plein = false) =>
  `<svg class="ico" viewBox="0 0 24 24" ${plein ? 'fill="currentColor" stroke="none"' : 'fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"'} aria-hidden="true">${corps}</svg>`;

/** l'étoile à cinq branches (Strate, quête) */
const ETOILE = 'M12 3l2.6 5.6 6.1.7-4.5 4.2 1.2 6L12 16.6 6.6 19.5l1.2-6L3.3 9.3l6.1-.7z';

export const ICO = {
  // la recherche du glossaire (31 octobre 2026)
  chercher: svg('<circle class="v" cx="10.5" cy="10.5" r="6.3"/><path class="r" d="M7.4 9a3.4 3.4 0 0 1 2.3-2.2"/><path d="M15.2 15.2l5.3 5.3" stroke-width="2.4"/>'),
  // navigation
  district: svg('<path class="v" d="M5.5 12.5 12 6.5l6.5 6v6.5h-13z"/><path d="M3.5 12.8 12 5l8.5 7.8"/><path class="o p" d="M10.6 14h2.8v5h-2.8z"/><path d="M2.5 21.5c1.6-.9 3.2-.9 4.8 0s3.2.9 4.8 0 3.2-.9 4.8 0 2.4.6 3.6.2" opacity=".7"/>'),
  tour: svg('<path class="v" d="M9 4.5h6l1.5 3.5h-9z"/><path class="v" d="M8.5 8h7l-1.2 9H9.7z"/><path class="r" d="M10.6 9.8v4.6"/><path d="M12 17v3.5M8 20.5h8"/><path class="o p" d="M12 1.2l1.3 2.3h-2.6z"/>'),
  cartes: svg('<rect x="3.5" y="5.5" width="10.5" height="15" rx="2" opacity=".55" transform="rotate(-9 8.75 13)"/><rect class="v" x="9.5" y="3.5" width="10.5" height="15" rx="2"/><path class="o p" d="M14.75 8l1.7 3-1.7 3-1.7-3z"/>'),
  codex: svg('<path class="v" d="M5 4.5h11.5a2 2 0 0 1 2 2V19.5H7a2 2 0 0 1-2-2z"/><path d="M5 17.5a2 2 0 0 1 2-2h11.5"/><path d="M9 8.5h6M9 11.5h4"/><path class="o" d="M18.5 19.5v1.5"/>'),
  // une carte marine pliée en trois, une route pointillée vers une île (les Pillages, 28 octobre 2026)
  carte: svg('<path class="v" d="M3 6.2 9 4l6 2.2L21 4v13.8L15 20l-6-2.2L3 20z"/><path d="M9 4v13.8M15 6.2V20" opacity=".55"/><path class="o" d="M5.5 14.5c1.5-1 2.5-1 3.5-2.5" stroke-dasharray="1.4 1.6"/><path class="o" d="M17 9.5l1.5 1.5M18.5 9.5 17 11"/>'),
  // la Flèche d'amarrage : une aiguille effilée, ses quais en traverses, le cristal du sommet (28 octobre 2026)
  fleche: svg('<path class="v" d="M12 3.5 14.7 21H9.3z"/><path d="M7.5 9h9M6.5 13.5h11M5.5 18h13"/><path d="M4 21h16"/><path class="o p" d="M12 .8l1.2 2.4h-2.4z"/>'),
  plus: svg('<circle class="p" cx="6" cy="12" r="1.8"/><circle class="p" cx="12" cy="12" r="1.8"/><circle class="p" cx="18" cy="12" r="1.8"/>'),
  // le Cercle des quais (3 novembre 2026) : un pavillon ouvert sur son estrade ronde ; un échange (deux flèches) ; ajouter un ami
  cercle: svg('<ellipse class="v" cx="12" cy="18.3" rx="8.5" ry="2.6"/><path class="v" d="M3.5 10 12 4l8.5 6z"/><path d="M6.5 10.5v6.2M12 10.5v7M17.5 10.5v6.2"/><path class="o p" d="M12 6.2l1 1.4-1 1.4-1-1.4z"/>'),
  ajouter: svg('<path d="M12 5v14M5 12h14" stroke-width="2"/>'),
  echange: svg('<path d="M4 8.5h14l-3.5-3.5"/><path class="o" d="M20 15.5H6l3.5 3.5"/>'),
  ami: svg('<circle class="v" cx="9" cy="8" r="3.4"/><path class="v" d="M3 20c.7-3.5 3-5.6 6-5.6s5.3 2.1 6 5.6z"/><path class="o" d="M18.5 7.5v6M15.5 10.5h6"/>'),
  // ressources
  // 9 novembre 2026 (cristal unique) : la clé « energie » est la monnaie, les cristaux (une pierre bleue taillée en trois facettes) ;
  // « composants » est le minerai, la pierre encore prise dans sa gangue (en attendant les icônes peintes)
  energie: svg('<path class="v" d="M12 2.5 18 8.5 12 21.5 6 8.5z"/><path d="M6 8.5h12M12 2.5 9.6 8.5 12 21.5 14.4 8.5z" opacity=".6"/><path class="r" d="M9 7.2 10.8 4.6"/>'),
  composants: svg('<path d="M4 15.5 6.5 9l5-3 6 1.5 3 6-2.5 5.5-7.5 1z" opacity=".85"/><path class="v" d="M10 9.5 13 7.8 14.5 12 12 15.5 9.5 13z"/><path class="r" d="M11 10.2 12.6 9.2"/>'),
  eclats: svg('<path class="v" d="M12 2.2 17.5 8.5 12 21.8 6.5 8.5z"/><path d="M6.5 8.5h11M12 2.2v6.3" opacity=".6"/><path class="r" d="M9.4 6.6l1.5-1.9"/>'),
  strate: svg('<path class="v" d="M3 8l9-4 9 4-9 4z"/><path d="M3 12.5l9 4 9-4"/><path d="M3 17l9 4 9-4" opacity=".6"/><path class="r" d="M8 7.3l3.6-1.6"/>'),
  // combat
  atk: svg('<path class="v" d="M14.5 3H21v6.5L10 20.5 3.5 14z"/><path class="r" d="M17.4 5.4 9 13.8"/><path d="M6 17l-3 3"/>'),
  bouclier: svg('<path class="v" d="M12 2.5l8 3v6c0 5-3.5 8.6-8 10-4.5-1.4-8-5-8-10v-6z"/><path class="r" d="M7 7.4l4-1.5"/>'),
  soin: svg('<path class="v" d="M9.5 3.2h5v6.3h6.3v5h-6.3v6.3h-5v-6.3H3.2v-5h6.3z"/><path class="r" d="M11.4 5.4v3"/>'),
  boost: svg('<circle class="v" cx="12" cy="13" r="8"/><path d="M12 9v4l3 2"/><path d="M9.5 2h5"/><path class="r" d="M7.4 10a5.5 5.5 0 0 1 2.4-2.4"/>'),
  flux: svg('<path d="M3 12c3-6 6 6 9 0s6 6 9 0" stroke-width="2"/>'),
  repiocher: svg('<path d="M20 11a8 8 0 0 0-14.5-4.5L4 8"/><path d="M4 3v5h5"/><path d="M4 13a8 8 0 0 0 14.5 4.5L20 16"/><path d="M20 21v-5h-5"/>'),
  place: svg('<rect class="v" x="5" y="3.5" width="14" height="17" rx="2.5"/><path class="o" d="M12 8.8v6.4M8.8 12h6.4"/>'),
  lancer: svg('<path d="M5 12h12"/><path d="M13 6l6 6-6 6"/>'),
  retirer: svg('<path d="M4 7h16"/><path d="M9 7V4.5h6V7"/><path class="v" d="M6 7l1 12.5a1.5 1.5 0 0 0 1.5 1.5h7a1.5 1.5 0 0 0 1.5-1.5L18 7z"/><path d="M10 11v6M14 11v6" opacity=".6"/>'),
  // général
  /** un parchemin roulé : l'objectif du moment (la bulle du district) */
  objectif: svg('<path class="v" d="M7 4h10a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H8a3 3 0 0 1-3-3V6a2 2 0 0 1 2-2z"/><path d="M11 9.5h5M11 13h3"/><circle class="o p" cx="7.8" cy="16.8" r="1.8"/>'),
  fermer: svg('<path d="M6 6l12 12M18 6 6 18" stroke-width="2"/>'),
  aide: svg('<circle class="v" cx="12" cy="12" r="9"/><path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.7.3-1 .9-1 1.7"/><circle class="p" cx="12" cy="17" r="1"/>'),
  verrou: svg('<path d="M8 11V8a4 4 0 0 1 8 0v3"/><rect class="v" x="5" y="11" width="14" height="10" rx="2.2"/><path class="o" d="M12 14.6v2.6"/>'),
  ok: svg('<path d="M4 12.5l5 5L20 6.5" stroke-width="2"/>'),
  chrono: svg('<circle class="v" cx="12" cy="13" r="8"/><path d="M12 9v4h3"/><path d="M10 2h4"/><path class="r" d="M7.4 10a5.5 5.5 0 0 1 2.4-2.4"/>'),
  marteau: svg('<path class="v" d="M13.5 3.5 20.5 10.5 17.5 13.5 10.5 6.5z"/><path d="M12 8 3.5 16.5l3 3L15 11" stroke-width="2"/>'),
  descendre: svg('<path d="M12 4v15"/><path d="M6 13l6 6 6-6"/>'),
  retour: svg('<path d="M19 12H5"/><path d="M11 6l-6 6 6 6"/>'),
  porteurs: svg('<circle class="v" cx="9" cy="8" r="3.4"/><path class="v" d="M2.8 20c.7-3.6 3.2-5.6 6.2-5.6s5.5 2 6.2 5.6z"/><path d="M15.2 4.8a3.4 3.4 0 0 1 0 6.4" opacity=".7"/><path d="M17.6 14.8c2 .7 3.2 2.4 3.6 5.2" opacity=".7"/>'),
  compte: svg('<circle class="v" cx="12" cy="8" r="4"/><path class="v" d="M4 21c1-4 4.5-6 8-6s7 2 8 6z"/>'),
  film: svg('<rect class="v" x="3" y="5" width="18" height="14" rx="2.5"/><path class="o p" d="M10 9l5 3-5 3z"/>'),
  journal: svg('<path d="M5 6h14M5 12h14M5 18h9"/>'),
  // un poste à pourvoir : une silhouette et un « + » (bulle du district, 2 novembre 2026)
  posteLibre: svg('<circle class="v" cx="10" cy="7.6" r="3.6"/><path class="v" d="M3.4 20c.7-3.9 3.4-5.9 6.6-5.9 1.3 0 2.5.3 3.5.9V20z"/><path class="o" d="M18 13.2v7M14.5 16.7h7"/>'),
  ouvrier: svg('<path class="v" d="M4.5 14a7.5 7.5 0 0 1 15 0z"/><path d="M3 14h18"/><path d="M12 6.5v-2"/><path d="M8 17.5v2.5M16 17.5v2.5"/><path class="r" d="M8 11a4.5 4.5 0 0 1 2-2.3"/>'),
  // Changer (un Porteur, une carte) : deux flèches qui tournent autour d'un éclat d'or
  recycler: svg('<path d="M19.3 9.5A7.8 7.8 0 0 0 5.6 6.8"/><path d="M5 3.2v4.3h4.3"/><path d="M4.7 14.5a7.8 7.8 0 0 0 13.7 2.7"/><path d="M19 20.8v-4.3h-4.3"/><path class="o v" d="M12 8.6l2.4 3.4-2.4 3.4-2.4-3.4z"/>'),
  monter: svg('<path d="M12 20V7"/><path d="M6.5 12.5 12 7l5.5 5.5"/><path class="o" d="M5 3.5h14"/>'),
  // Gérer ses cartes, confier une carte : deux cartes en éventail, la plus haute sertie d'or
  greffe: svg('<rect x="3.2" y="6.2" width="10" height="14" rx="2" opacity=".55" transform="rotate(-12 8.2 13.2)"/><rect class="v" x="10" y="3.8" width="10" height="14" rx="2" transform="rotate(7 15 10.8)"/><path class="o p" d="M14.9 7.8l1.6 2.9-1.6 2.9-1.6-2.9z"/>'),
  cristal: svg('<path class="v" d="M12 2 16.5 7.5 12 22 7.5 7.5z"/><path d="M7.5 7.5h9" opacity=".6"/><path class="r" d="M10.2 6.4 11.6 4.4"/>'),
  // une gemme fêlée : la Fêlure de l'ennemi (25 octobre 2026)
  fele: svg('<path class="v" d="M12 2l6 7-6 13-6-13z"/><path d="M13 4l-2.5 5 3 3-2 5"/>'),
  // le Coup d'éclat : une étoile à quatre branches
  eclat: svg('<path d="M12 2l2.2 7.8L22 12l-7.8 2.2L12 22l-2.2-7.8L2 12l7.8-2.2z"/>', true),
  porte: svg('<circle class="v" cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="4"/><path d="M12 3v5M12 16v5M3 12h5M16 12h5"/><circle class="o p" cx="12" cy="12" r="1.4"/>'),
  coffre: svg('<path class="v" d="M3 9.5h18V19a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 19z"/><path class="v" d="M3 9.5 5 5a1.5 1.5 0 0 1 1.4-1h11.2A1.5 1.5 0 0 1 19 5l2 4.5"/><path class="o" d="M10.5 13h3v2.5h-3z"/>'),
  // le grappin des pillages (26 octobre 2026)
  grappin: svg('<circle class="v" cx="12" cy="4.5" r="1.8"/><path d="M12 6.3V20"/><path d="M8.5 9.5h7"/><path d="M4.5 13.5a7.5 7.5 0 0 0 15 0"/><path d="M4.5 13.5 3 11.5M19.5 13.5l1.5-2"/>'),
  // le brouillard des Strates (30 octobre 2026) : ce qu'on devine d'une salle avant d'y entrer
  bruits: svg('<path d="M4 10v4"/><path d="M8 7v10"/><path d="M12 4v16"/><path d="M16 8v8"/><path d="M20 11v2"/>'),
  lueur: svg('<path class="v" d="M12 4l1.6 5.4L19 11l-5.4 1.6L12 18l-1.6-5.4L5 11l5.4-1.6z"/><path class="o" d="M18.5 3.5v3M17 5h3"/><path class="o" d="M5.5 17.5v2.5M4.25 18.75h2.5"/>'),
  silence: svg('<path d="M4 15h16"/><path d="M6 19h12"/><circle class="p" cx="8" cy="10" r="1"/><circle class="p" cx="13" cy="7.5" r="1"/><circle class="p" cx="16.5" cy="11" r="1"/>'),
  traces: svg('<path class="v" d="M8.5 4.5c1.4 0 2 1.6 2 3.2S9.8 11 8.5 11 6.5 9.3 6.5 7.7s.6-3.2 2-3.2z"/><path d="M7.4 13.5h2.2"/><path class="v" d="M15.5 9.5c1.4 0 2 1.6 2 3.2s-.7 3.3-2 3.3-2-1.7-2-3.3.6-3.2 2-3.2z"/><path d="M14.4 18.5h2.2"/>'),
  chaleur: svg('<path class="v" d="M12 3c1 3 4.5 5 4.5 9.5A4.5 4.5 0 0 1 12 17a4.5 4.5 0 0 1-4.5-4.5C7.5 9.5 10 8 10 5.5c1 .8 1.5 1.8 2-2.5z"/><path d="M5 21h14"/>'),
  brume: svg('<path d="M4 8h11"/><path d="M8 12h12"/><path d="M3 16h10"/><path d="M15 16h3"/>'),
  // le contenu des Strates (31 octobre 2026) : la Halte (une stèle gravée), la quête (une étoile de fouilleur), le mur, la fissure, le fil
  halte: svg('<path class="v" d="M7 21V7a5 5 0 0 1 10 0v14z"/><path d="M5 21h14"/><path d="M10 9h4M10 12.5h4M10 16h2.5"/>'),
  // Explorer (31 octobre 2026) : le Vestige (un losange taillé), les traces du Rôdeur (trois griffures), l'étoile de Strate
  vestige: svg('<path class="v" d="M12 2.5l6.5 7-6.5 12-6.5-12z"/><path d="M5.5 9.5h13M9 9.5l3 12 3-12M9 9.5l3-7 3 7" opacity=".6"/>'),
  griffes: svg('<path d="M6 4c1 4 1 9-1 16"/><path d="M11.5 3c1 5 1 11-1 18"/><path d="M17 4c1 4 1 9-1 16"/>'),
  etoile: svg(`<path d="${ETOILE}"/>`, true),
  etoileVide: svg(`<path class="v" d="${ETOILE}"/>`),
  quete: svg('<path d="M12 2.5l1.9 6.2 6.6.1-5.3 3.9 2 6.3L12 15.2 6.8 19l2-6.3-5.3-3.9 6.6-.1z"/>', true),
  mur: svg('<rect class="v" x="3" y="5" width="18" height="14" rx="1.5"/><path d="M3 9.7h18M3 14.3h18"/><path d="M9 5v4.7M15 5v4.7M6 9.7v4.6M12 9.7v4.6M18 9.7v4.6M9 14.3V19M15 14.3V19"/>'),
  fissure: svg('<path d="M13 2l-3 6 4 3-4 4 3 3-2 4"/><path d="M14 11l4-1M10 15l-4 1"/>'),
  fil: svg('<path d="M3 14c3-6 6-6 9 0s6 6 9 0"/><circle class="o p" cx="3" cy="14" r="1.7"/><circle class="o p" cx="21" cy="14" r="1.7"/>'),
  bestiaire: svg('<path class="v" d="M5 4.5h11.5a2 2 0 0 1 2 2V19.5H7a2 2 0 0 1-2-2z"/><path d="M9 14c0-2.5 1.3-4 3-4s3 1.5 3 4"/><circle class="p" cx="10.5" cy="9" r=".9"/><circle class="p" cx="13.5" cy="9" r=".9"/><path d="M8.5 17h7"/>'),
} as const;

export type Icone = keyof typeof ICO;

// ---------- Icônes peintes (Midjourney, public/art/icones/<nom>.webp) ----------
// Aux grandes tailles (ressources du haut, onglets du bas, gros boutons), une icône peinte remplace le trait SVG.
// Tant que le fichier n'est pas déposé, le SVG reste. Ajouter le nom ici dès que l'image est dans public/art/icones/.
const PEINTES = new Set<Icone>(['eclats', 'strate', 'district', 'tour', 'porteurs', 'cartes', 'codex', 'plus',
  // le lot du 23 octobre 2026
  'marteau', 'coffre', 'chrono', 'verrou', 'journal', 'ouvrier',
  // les onglets Pillages et Flèche (28 octobre 2026)
  'carte', 'fleche',
  // l'objectif du district, un parchemin scellé (29 octobre 2026)
  'objectif',
  // les indices du brouillard des Strates (30 octobre 2026)
  'bruits', 'lueur', 'silence', 'traces', 'chaleur', 'brume',
  // le contenu des Strates et Explorer (31 octobre 2026)
  'halte', 'porte', 'quete', 'fissure', 'mur', 'fil', 'bestiaire', 'vestige', 'griffes',
  // l'économie à cristal unique : les cristaux et le minerai (10 novembre 2026)
  'energie', 'composants']);
export const baseIcones = new URL('art/icones/', document.baseURI).href;

// ---------- Les symboles des trois lignées (7 novembre 2026, Bryan) ----------
// Hexagone d'implant (Augmentés), feuille de chitine (Génés), flamme d'améthyste à mèche d'or (Résonants) :
// trois silhouettes différentes, lisibles même à 16 px et sans compter sur la couleur. Ils remplacent « Faible contre… ».
/** Le symbole d'une lignée ; `nom` le rend lisible aux lecteurs d'écran (sinon purement décoratif) */
export function sigle(l: Lignee, nom = false): string {
  return `<img class="sigle" src="${baseIcones}lignee-${l}.webp" alt="${nom ? { tech: t('Augmentés'), bio: t('Génés'), reso: t('Résonants') }[l] : ''}"${nom ? '' : ' aria-hidden="true"'} decoding="async">`;
}

/** La Perle de nacre (13 novembre 2026, Midjourney) : une perle dans une coquille d'or */
export const perle = (classe = 'ico peinte'): string => `<img class="${classe}" src="${baseIcones}perle.webp" alt="" aria-hidden="true" decoding="async">`;

/** L'icône peinte si elle existe, sinon le trait SVG */
export function icone(nom: Icone): string {
  return PEINTES.has(nom) ? `<img class="ico peinte" src="${baseIcones}${nom}.webp" alt="" aria-hidden="true" decoding="async">` : ICO[nom];
}

// ---------- Chantier en cours (12 novembre 2026, Bryan) ----------
// Un marteau au trait qui frappe en boucle, avec une étincelle d'or à l'impact : on voit d'un coup d'œil que ça travaille.
// Animation dans chantier.css (coupée si le joueur réduit les animations).
export const CHANTIER = `<svg class="ico chantier-anime" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">`
  + `<path class="ch-enclume" d="M9 20.5h11"/>`
  + `<g class="ch-marteau"><path class="v" d="M13.5 3.5 20.5 10.5 17.5 13.5 10.5 6.5z"/><path d="M12 8 3.5 16.5l3 3L15 11" stroke-width="2"/></g>`
  + `<g class="ch-etincelle"><path d="M19 17.2v-1.6M21.3 18.2l1.1-1.1M16.7 18.2l-1.1-1.1"/></g></svg>`;
