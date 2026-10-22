// Icônes de l'interface : un seul jeu, trait de 1,8 sur une grille de 24, coins vifs (rappel des cartes à coins coupés).
// Elles prennent la couleur du texte (currentColor) : la couleur se règle en CSS.

const svg = (corps: string, plein = false) =>
  `<svg class="ico" viewBox="0 0 24 24" ${plein ? 'fill="currentColor" stroke="none"' : 'fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"'} aria-hidden="true">${corps}</svg>`;

export const ICO = {
  // navigation
  district: svg('<path d="M4 20h16"/><path d="M6 20v-5l3-2 3 2v5"/><path d="M12 20V7l3-3 3 3v13"/><path d="M15 9.5v1.5M15 13.5v1.5"/><path d="M3 17c1.2-.8 2.4-.8 3 0"/>'),
  tour: svg('<path d="M9 3h6l1 4H8z"/><path d="M8.5 7v7h7V7"/><path d="M12 14v7"/><path d="M9 18l3 3 3-3"/><path d="M4 14h4M16 14h4"/>'),
  cartes: svg('<path d="M8 4h9l2 2v12H8z"/><path d="M5 7v13h10"/><path d="M11 9h5M11 12h5"/>'),
  codex: svg('<path d="M5 4h11l3 3v13H5z"/><path d="M16 4v3h3"/><path d="M8 10h8M8 13h8M8 16h5"/>'),
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
  porte: svg('<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="4"/><path d="M12 3v5M12 16v5M3 12h5M16 12h5"/>'),
  coffre: svg('<path d="M3 9h18v11H3z"/><path d="M3 9l2-5h14l2 5"/><path d="M10 13h4"/>'),
} as const;

export type Icone = keyof typeof ICO;

// ---------- Icônes peintes (Midjourney, public/art/icones/<nom>.webp) ----------
// Aux grandes tailles (ressources du haut, onglets du bas, gros boutons), une icône peinte remplace le trait SVG.
// Tant que le fichier n'est pas déposé, le SVG reste. Ajouter le nom ici dès que l'image est dans public/art/icones/.
const PEINTES = new Set<Icone>(['energie', 'composants', 'eclats', 'strate', 'district', 'tour', 'cartes', 'codex']);
const baseIcones = new URL('art/icones/', document.baseURI).href;

/** L'icône peinte si elle existe, sinon le trait SVG */
export function icone(nom: Icone): string {
  return PEINTES.has(nom) ? `<img class="ico peinte" src="${baseIcones}${nom}.webp" alt="" aria-hidden="true" decoding="async">` : ICO[nom];
}
