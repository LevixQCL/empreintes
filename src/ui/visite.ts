/**
 * La visite de la Cuvette (13 novembre 2026). Bryan : « On ne découvre pas la Cuvette. En arrivant au district, on enchaîne
 * les tutoriels puis la fiche du Générateur. On ne prend jamais le temps de regarder son district. » Les quatre écrans
 * « Ton district » (portrait sur fond sombre) sont remplacés par une visite sur la vraie carte : la Cuvette survolée avec
 * son histoire en trois lignes, puis le joueur touche lui-même la digue, la Tour, les bâtiments, ses cristaux et le Générateur.
 * Un seul point lumineux à la fois, le reste de l'écran voilé ; qui parle et ce qu'il dit tiennent dans une bulle.
 *
 * Les cibles sont posées après le rendu (placerVisite) : un lieu de la carte, un rectangle du repère 400 × 600 de la Cuvette,
 * ou un élément de l'écran (les cristaux de la barre du haut).
 */
import { porteurDef } from '../core/donnees';
import { t as tr } from '../core/i18n';
import { portrait } from './art';
import { avatar } from './coquille';
import { echap } from './outils';
import { COULEUR } from './vue';

type Cible = { lieux: string[] } | { zone: [number, number, number, number] } | { sel: string };

interface EtapeVisite {
  qui: 'ilka' | 'doran' | 'vela';
  titre: string;
  texte: string;
  /** ce qu'il faut toucher ; sans cible, la carte entière se montre et un bouton fait la suite */
  cible?: Cible;
  consigne?: string;
}

// 13 novembre 2026, après l'avis du game designer : 4 étapes au lieu de 6. La Forge et la Clinique se découvrent par l'objectif
// du jour (leurs noms sont sur la carte), les cristaux par le Générateur ; la porte ouverte ce matin donne sa raison à la Tour.
export const VISITE: EtapeVisite[] = [
  {
    qui: 'vela', titre: tr('Ta Cuvette'),
    texte: tr('Un chantier des années 2060 : une digue en anneau, un puits au centre. Les ouvriers ont été payés en anneaux. Leurs familles vivent ici, plus bas que la mer.'),
  },
  {
    // le mur lisse de l'anneau, à droite : la pierre nue de la digue, côté mer
    qui: 'doran', titre: tr('La digue'),
    texte: tr('Les pompes la gardent au sec depuis cinquante ans. Mais cette année, la ligne bleue peinte sur la digue est passée sous la marée.'),
    cible: { zone: [354, 250, 46, 205] }, consigne: tr('Touche la digue'),
  },
  {
    qui: 'doran', titre: tr('La Tour du Noyau'),
    texte: tr('Ce matin, on a ouvert la porte sous la Tour. Scellée depuis cinquante-cinq ans. Ce qu’il y a dessous, on va le chercher.'),
    cible: { lieux: ['noyau'] }, consigne: tr('Touche la Tour'),
  },
  {
    qui: 'vela', titre: tr('Le Générateur'),
    texte: tr('Il taille nos cristaux, même quand tu dors. Et les cristaux paient tout. Mets-y une recrue.'),
    cible: { lieux: ['generateur'] }, consigne: tr('Touche le Générateur'),
  },
];

/** Le voile, le point lumineux et la bulle, posés par-dessus l'archipel */
export function htmlVisite(etape: number): string {
  const i = Math.max(0, Math.min(etape, VISITE.length - 1));
  const e = VISITE[i]!;
  const d = porteurDef(e.qui);
  const dernier = i === VISITE.length - 1;
  const img = portrait(e.qui);
  const action = dernier ? `data-action="accueil-fin" data-id="generateur"` : `data-action="accueil-suite"`;
  return `<div class="visite${e.cible ? ' a-cible' : ' survol'}" data-etape="${i}" role="dialog" aria-modal="true" aria-labelledby="vi-titre">`
    + `<div class="vi-garde" aria-hidden="true"></div>`
    + (e.cible ? `<button type="button" class="vi-trou" ${action} aria-label="${echap(e.consigne ?? tr('Suite'))}" data-cible="${echap(JSON.stringify(e.cible))}"><i class="vi-doigt" aria-hidden="true"></i></button>` : '')
    + `<section class="vi-bulle" style="--c:${COULEUR[d.lignee]}">`
    + `<header class="vi-haut"><span class="vi-points" aria-label="${tr`Étape ${i + 1} sur ${VISITE.length}`}">${VISITE.map((_, k) => `<i class="${k === i ? 'ici' : k < i ? 'vu' : ''}"></i>`).join('')}</span>`
    + `<button type="button" class="vi-passer" data-action="accueil-fin">${tr`Passer`}</button></header>`
    + `<div class="vi-parole"><figure class="vi-portrait" aria-hidden="true">${img ? `<img src="${img}" alt="" decoding="async">` : avatar(e.qui, 56)}</figure>`
    + `<div class="vi-mots"><span class="vi-qui">${echap(d.nom)}</span><h2 id="vi-titre">${echap(e.titre)}</h2></div></div>`
    + `<p class="vi-texte">${echap(e.texte)}</p>`
    + `<footer class="vi-bas">`
    + (e.cible ? `<span class="vi-consigne"><i class="vi-pouls" aria-hidden="true"></i>${echap(e.consigne ?? '')}</span>`
      : `<button type="button" class="btn prim vi-suite" ${action}>${tr`Visiter`}</button>`)
    + `</footer></section></div>`;
}

const MARGE = 10;

/** Pose le point lumineux sur sa cible et la bulle du côté libre de l'écran */
export function placerVisite(racine: HTMLElement) {
  const v = racine.querySelector<HTMLElement>('.visite');
  if (!v) return;
  const trou = v.querySelector<HTMLElement>('.vi-trou');
  if (!trou) { v.dataset.cote = 'bas'; return; }
  const c = JSON.parse(trou.dataset.cible ?? '{}') as Cible;
  let r: { l: number; t: number; r: number; b: number } | null = null;
  const unir = (b: DOMRect) => { r = r ? { l: Math.min(r.l, b.left), t: Math.min(r.t, b.top), r: Math.max(r.r, b.right), b: Math.max(r.b, b.bottom) } : { l: b.left, t: b.top, r: b.right, b: b.bottom }; };
  // le bâtiment et son repère (pastille de niveau, nom) : le cadre ne coupe jamais une étiquette
  if ('lieux' in c) for (const l of c.lieux) racine.querySelectorAll<Element>(`.zone-bat[data-lieu="${l}"], .toile .balise[data-lieu="${l}"]`).forEach((z) => unir(z.getBoundingClientRect()));
  else if ('sel' in c) { const el = racine.querySelector<HTMLElement>(c.sel); if (el) unir(el.getBoundingClientRect()); }
  else {
    const t = racine.querySelector<HTMLElement>('.archipel .toile')?.getBoundingClientRect();
    if (t) {
      const [x, y, w, h] = c.zone;
      unir(new DOMRect(t.left + (x / 400) * t.width, t.top + (y / 600) * t.height, (w / 400) * t.width, (h / 600) * t.height));
    }
  }
  if (!r) return;
  const box = r as { l: number; t: number; r: number; b: number };
  // jamais hors de l'écran (la Cuvette déborde à gauche sur téléphone)
  const W = window.innerWidth, H = window.innerHeight;
  const l = Math.max(4, box.l - MARGE), t = Math.max(4, box.t - MARGE);
  const w = Math.min(W - 4, box.r + MARGE) - l, h = Math.min(H - 4, box.b + MARGE) - t;
  trou.style.cssText = `left:${l}px;top:${t}px;width:${w}px;height:${h}px`;
  // la bulle va du côté où il reste le plus de place
  v.dataset.cote = t + h / 2 > H * 0.5 ? 'haut' : 'bas';
}

/**
 * Le toucher répond avant d'avancer (game designer : « l'interactivité était factice ») : le bâtiment s'éclaire un instant
 * dans le cadre, la pastille de niveau pulse, puis vient l'étape suivante. Renvoie faux si rien n'est à animer.
 */
export function toucherVisite(racine: HTMLElement, ensuite: () => void): boolean {
  const v = racine.querySelector<HTMLElement>('.visite');
  const trou = v?.querySelector<HTMLElement>('.vi-trou');
  if (!v || !trou || v.classList.contains('touchee') || matchMedia('(prefers-reduced-motion: reduce)').matches) return false;
  v.classList.add('touchee');
  const c = JSON.parse(trou.dataset.cible ?? '{}') as Cible;
  if ('lieux' in c) for (const l of c.lieux) racine.querySelectorAll(`.zone-bat[data-lieu="${l}"], .toile .balise[data-lieu="${l}"]`).forEach((z) => z.classList.add('vi-eclat'));
  setTimeout(ensuite, 420);
  return true;
}

let ecoute = false;
/** Une rotation ou une fenêtre redimensionnée : le point suit sa cible */
export function suivreVisite(racine: HTMLElement) {
  placerVisite(racine);
  if (ecoute) return;
  ecoute = true;
  window.addEventListener('resize', () => placerVisite(racine));
}
