// Icônes de l'interface : un seul jeu, trait de 1,8 sur une grille de 24, coins vifs (rappel des cartes à coins coupés).
// Elles prennent la couleur du texte (currentColor) : la couleur se règle en CSS.

const svg = (corps: string, plein = false) =>
  `<svg class="ico" viewBox="0 0 24 24" ${plein ? 'fill="currentColor" stroke="none"' : 'fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"'} aria-hidden="true">${corps}</svg>`;

export const ICO = {
  // la recherche du glossaire (31 octobre 2026)
  chercher: svg('<circle cx="10.5" cy="10.5" r="6"/><path d="M15 15l5 5"/>'),
  // navigation
  district: svg('<path d="M4 20h16"/><path d="M6 20v-5l3-2 3 2v5"/><path d="M12 20V7l3-3 3 3v13"/><path d="M15 9.5v1.5M15 13.5v1.5"/><path d="M3 17c1.2-.8 2.4-.8 3 0"/>'),
  tour: svg('<path d="M9 3h6l1 4H8z"/><path d="M8.5 7v7h7V7"/><path d="M12 14v7"/><path d="M9 18l3 3 3-3"/><path d="M4 14h4M16 14h4"/>'),
  cartes: svg('<path d="M8 4h9l2 2v12H8z"/><path d="M5 7v13h10"/><path d="M11 9h5M11 12h5"/>'),
  codex: svg('<path d="M5 4h11l3 3v13H5z"/><path d="M16 4v3h3"/><path d="M8 10h8M8 13h8M8 16h5"/>'),
  // une carte marine pliée en trois, une route pointillée vers une île (les Pillages, 28 octobre 2026)
  carte: svg('<path d="M3 6l6-2 6 2 6-2v14l-6 2-6-2-6 2z"/><path d="M9 4v14M15 6v14"/><path d="M5.5 14.5c1.5-1 2.5-1 3.5-2.5" stroke-dasharray="1.4 1.6"/><path d="M17 9.5l1.5 1.5M18.5 9.5 17 11"/>'),
  // la Flèche d'amarrage : une aiguille effilée, ses quais en traverses, le cristal du sommet (28 octobre 2026)
  fleche: svg('<path d="M12 2l1.4 3h-2.8z"/><path d="M10.6 5h2.8l1.6 16H9z"/><path d="M8 9h8M7 13.5h10M6 18h12"/><path d="M4 21h16"/>'),
  plus: svg('<circle cx="6" cy="12" r="1.4"/><circle cx="12" cy="12" r="1.4"/><circle cx="18" cy="12" r="1.4"/>'),
  // ressources
  energie: svg('<path d="M13 2 5 13h6l-1 9 8-11h-6z"/>'),
  composants: svg('<path d="M12 3l7.8 4.5v9L12 21l-7.8-4.5v-9z"/><circle cx="12" cy="12" r="3"/>'),
  eclats: svg('<path d="M12 2l5 6-5 14-5-14z"/><path d="M7 8h10"/><path d="M12 2v6"/>'),
  strate: svg('<path d="M3 8l9-4 9 4-9 4z"/><path d="M3 12.5l9 4 9-4"/><path d="M3 17l9 4 9-4"/>'),
  // combat
  atk: svg('<path d="M14.5 3H21v6.5L10 20.5 3.5 14z"/><path d="M6 17l-3 3"/>'),
  bouclier: svg('<path d="M12 2.5l8 3v6c0 5-3.5 8.6-8 10-4.5-1.4-8-5-8-10v-6z"/>'),
  soin: svg('<path d="M9 3h6v6h6v6h-6v6H9v-6H3V9h6z"/>'),
  boost: svg('<circle cx="12" cy="13" r="8"/><path d="M12 9v4l3 2"/><path d="M9 2h6"/>'),
  flux: svg('<path d="M3 12c3-6 6 6 9 0s6 6 9 0"/>'),
  repiocher: svg('<path d="M20 11a8 8 0 0 0-14.5-4.5L4 8"/><path d="M4 3v5h5"/><path d="M4 13a8 8 0 0 0 14.5 4.5L20 16"/><path d="M20 21v-5h-5"/>'),
  place: svg('<path d="M5 5h10l4 4v10H5z"/><path d="M12 9v6M9 12h6"/>'),
  lancer: svg('<path d="M5 12h12"/><path d="M13 6l6 6-6 6"/>'),
  retirer: svg('<path d="M4 7h16"/><path d="M9 7V4h6v3"/><path d="M6 7l1 13h10l1-13"/>'),
  // général
  /** un parchemin roulé : l'objectif du moment (la bulle du district) */
  objectif: svg('<path d="M7 4h10a2 2 0 0 1 2 2v1H9V6a2 2 0 0 0-2-2 2 2 0 0 0-2 2v11a3 3 0 0 0 3 3h9a2 2 0 0 0 2-2V8"/><path d="M11 11h5M11 15h3"/>'),
  fermer: svg('<path d="M6 6l12 12M18 6 6 18"/>'),
  aide: svg('<circle cx="12" cy="12" r="9"/><path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.7.3-1 .9-1 1.7"/><circle cx="12" cy="17" r=".6" fill="currentColor"/>'),
  verrou: svg('<rect x="5" y="11" width="14" height="10" rx="1"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>'),
  ok: svg('<path d="M4 12.5l5 5L20 6.5"/>'),
  chrono: svg('<circle cx="12" cy="13" r="8"/><path d="M12 9v4h3"/><path d="M10 2h4"/>'),
  marteau: svg('<path d="M14 4l6 6-3 3-6-6z"/><path d="M11 7 3 15l3 3 8-8"/>'),
  descendre: svg('<path d="M12 4v15"/><path d="M6 13l6 6 6-6"/>'),
  retour: svg('<path d="M19 12H5"/><path d="M11 6l-6 6 6 6"/>'),
  porteurs: svg('<circle cx="9" cy="8" r="3.4"/><path d="M2.8 20c.7-3.6 3.2-5.6 6.2-5.6s5.5 2 6.2 5.6"/><path d="M15.2 4.8a3.4 3.4 0 0 1 0 6.4"/><path d="M17.6 14.8c2 .7 3.2 2.4 3.6 5.2"/>'),
  compte: svg('<circle cx="12" cy="8" r="4"/><path d="M4 21c1-4 4.5-6 8-6s7 2 8 6"/>'),
  film: svg('<rect x="3" y="5" width="18" height="14" rx="1"/><path d="M10 9l5 3-5 3z"/>'),
  journal: svg('<path d="M5 6h14M5 12h14M5 18h9"/>'),
  ouvrier: svg('<path d="M5 13a7 7 0 0 1 14 0"/><path d="M3 13h18"/><path d="M12 6V4"/><path d="M8 17v3M16 17v3"/>'),
  recycler: svg('<path d="M7 19H4l3-5"/><path d="M10 5l2-3 3 5"/><path d="M20 15l-2 4h-6"/><path d="M5.5 11.5 8 7.5"/><path d="M16 9.5l2.5 4"/>'),
  monter: svg('<path d="M12 20V6"/><path d="M6 12l6-6 6 6"/><path d="M5 3h14"/>'),
  greffe: svg('<path d="M12 3v6"/><path d="M8 9h8l-1 4H9z"/><path d="M12 13v8"/><path d="M8 21h8"/>'),
  cristal: svg('<path d="M12 2l4 5-4 15-4-15z"/>', true),
  // une gemme fêlée : la Fêlure de l'ennemi (25 octobre 2026)
  fele: svg('<path d="M12 2l6 7-6 13-6-13z"/><path d="M13 4l-2.5 5 3 3-2 5"/>'),
  // le Coup d'éclat : une étoile à quatre branches
  eclat: svg('<path d="M12 2l2.2 7.8L22 12l-7.8 2.2L12 22l-2.2-7.8L2 12l7.8-2.2z"/>', true),
  porte: svg('<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="4"/><path d="M12 3v5M12 16v5M3 12h5M16 12h5"/>'),
  coffre: svg('<path d="M3 9h18v11H3z"/><path d="M3 9l2-5h14l2 5"/><path d="M10 13h4"/>'),
  // le grappin des pillages (26 octobre 2026)
  grappin: svg('<circle cx="12" cy="4.5" r="1.8"/><path d="M12 6.3V20"/><path d="M8.5 9.5h7"/><path d="M4.5 13.5a7.5 7.5 0 0 0 15 0"/><path d="M4.5 13.5 3 11.5M19.5 13.5l1.5-2"/>'),
  // le brouillard des Strates (30 octobre 2026) : ce qu'on devine d'une salle avant d'y entrer
  bruits: svg('<path d="M4 10v4"/><path d="M8 7v10"/><path d="M12 4v16"/><path d="M16 8v8"/><path d="M20 11v2"/>'),
  lueur: svg('<path d="M12 4l1.6 5.4L19 11l-5.4 1.6L12 18l-1.6-5.4L5 11l5.4-1.6z"/><path d="M18.5 3.5v3M17 5h3"/><path d="M5.5 17.5v2.5M4.25 18.75h2.5"/>'),
  silence: svg('<path d="M4 15h16"/><path d="M6 19h12"/><circle cx="8" cy="10" r=".9"/><circle cx="13" cy="7.5" r=".9"/><circle cx="16.5" cy="11" r=".9"/>'),
  traces: svg('<path d="M8.5 4.5c1.4 0 2 1.6 2 3.2S9.8 11 8.5 11 6.5 9.3 6.5 7.7s.6-3.2 2-3.2z"/><path d="M7.4 13.5h2.2"/><path d="M15.5 9.5c1.4 0 2 1.6 2 3.2s-.7 3.3-2 3.3-2-1.7-2-3.3.6-3.2 2-3.2z"/><path d="M14.4 18.5h2.2"/>'),
  chaleur: svg('<path d="M12 3c1 3 4.5 5 4.5 9.5A4.5 4.5 0 0 1 12 17a4.5 4.5 0 0 1-4.5-4.5C7.5 9.5 10 8 10 5.5c1 .8 1.5 1.8 2-2.5z"/><path d="M5 21h14"/>'),
  brume: svg('<path d="M4 8h11"/><path d="M8 12h12"/><path d="M3 16h10"/><path d="M15 16h3"/>'),
  // le contenu des Strates (31 octobre 2026) : la Halte (une stèle gravée), la quête (une étoile de fouilleur), le mur, la fissure, le fil
  halte: svg('<path d="M7 21V7a5 5 0 0 1 10 0v14"/><path d="M5 21h14"/><path d="M10 9h4M10 12.5h4M10 16h2.5"/>'),
  // Explorer (31 octobre 2026) : le Vestige (un losange taillé), les traces du Rôdeur (trois griffures), l'étoile de Strate
  vestige: svg('<path d="M12 2.5l6.5 7-6.5 12-6.5-12z"/><path d="M5.5 9.5h13M9 9.5l3 12 3-12M9 9.5l3-7 3 7"/>'),
  griffes: svg('<path d="M6 4c1 4 1 9-1 16"/><path d="M11.5 3c1 5 1 11-1 18"/><path d="M17 4c1 4 1 9-1 16"/>'),
  etoile: svg('<path d="M12 3l2.6 5.6 6.1.7-4.5 4.2 1.2 6L12 16.6 6.6 19.5l1.2-6L3.3 9.3l6.1-.7z"/>', true),
  etoileVide: svg('<path d="M12 3l2.6 5.6 6.1.7-4.5 4.2 1.2 6L12 16.6 6.6 19.5l1.2-6L3.3 9.3l6.1-.7z"/>'),
  quete: svg('<path d="M12 2.5l1.9 6.2 6.6.1-5.3 3.9 2 6.3L12 15.2 6.8 19l2-6.3-5.3-3.9 6.6-.1z"/>', true),
  mur: svg('<path d="M3 5h18v14H3z"/><path d="M3 9.7h18M3 14.3h18"/><path d="M9 5v4.7M15 5v4.7M6 9.7v4.6M12 9.7v4.6M18 9.7v4.6M9 14.3V19M15 14.3V19"/>'),
  fissure: svg('<path d="M13 2l-3 6 4 3-4 4 3 3-2 4"/><path d="M14 11l4-1M10 15l-4 1"/>'),
  fil: svg('<path d="M3 14c3-6 6-6 9 0s6 6 9 0"/><circle cx="3" cy="14" r="1.6"/><circle cx="21" cy="14" r="1.6"/>'),
  bestiaire: svg('<path d="M5 4h11l3 3v13H5z"/><path d="M9 14c0-2.5 1.3-4 3-4s3 1.5 3 4"/><circle cx="10.5" cy="9" r=".8"/><circle cx="13.5" cy="9" r=".8"/><path d="M8.5 17h7"/>'),
} as const;

export type Icone = keyof typeof ICO;

// ---------- Icônes peintes (Midjourney, public/art/icones/<nom>.webp) ----------
// Aux grandes tailles (ressources du haut, onglets du bas, gros boutons), une icône peinte remplace le trait SVG.
// Tant que le fichier n'est pas déposé, le SVG reste. Ajouter le nom ici dès que l'image est dans public/art/icones/.
const PEINTES = new Set<Icone>(['energie', 'composants', 'eclats', 'strate', 'district', 'tour', 'porteurs', 'cartes', 'codex', 'plus',
  // le lot du 23 octobre 2026
  'marteau', 'coffre', 'chrono', 'verrou', 'journal', 'ouvrier',
  // les onglets Pillages et Flèche (28 octobre 2026)
  'carte', 'fleche',
  // l'objectif du district, un parchemin scellé (29 octobre 2026)
  'objectif',
  // les indices du brouillard des Strates (30 octobre 2026)
  'bruits', 'lueur', 'silence', 'traces', 'chaleur', 'brume']);
export const baseIcones = new URL('art/icones/', document.baseURI).href;

/** L'icône peinte si elle existe, sinon le trait SVG */
export function icone(nom: Icone): string {
  return PEINTES.has(nom) ? `<img class="ico peinte" src="${baseIcones}${nom}.webp" alt="" aria-hidden="true" decoding="async">` : ICO[nom];
}
