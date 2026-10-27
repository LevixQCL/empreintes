// La face d'une carte (refonte validée par Bryan le 27 octobre 2026, docs/carte-optimale.md) :
// - l'illustration Midjourney entière, sans aucune coupe : elle occupe toute la carte ;
// - un cadre dans la matière du métal (texture public/art/metaux), dont l'arête intérieure prend la couleur de l'action ;
//   la Nacre n'a aucun cadre ;
// - en haut à gauche, les Fréquences dans une capsule de verre (la principale, puis les autres à sa droite) ;
// - une barre de séparation aux trois quarts, la valeur posée dessus à droite (icône au trait + chiffre) ;
// - dessous, sur un voile dans la matière du métal : la roue de niveau (couleur de la lignée) et le nom, puis l'effet ;
// - en main (carte étroite), il ne reste que la Fréquence, la valeur et, sous la barre, l'icône de l'effet.
// Les tailles sont en unités de conteneur (cqw) : la même carte s'affiche en grand ou en petit.

import { NOMS_EFFET, effetsDe, formuleEffet, nomsEffets } from '../core/effets';
import { DEPART_PORTEURS, NOMS_LIGNEE, PORTEUR_LEGS, voieDe } from '../core/donnees';
import { frequenceLibre, signeLibre } from '../core/regles';
import { COLLECTION, NOMS_RARETE } from '../core/collection';
import type { Effet, ModuleDef, Rarete, TypeEffet } from '../core/types';
import { illustrationModule, portrait, textureMetal } from './art';
import { COULEUR } from './vue';
import { echap, mouvementReduit as reduit } from './outils';

/** une couleur par Fréquence, du 1 (chaud) au 9 (froid) : des Fréquences qui se suivent ont des couleurs voisines */
export const couleurFrequence = (f: number) => `hsl(${8 + (f - 1) * 34} 52% 38%)`;

/** la couleur de chaque métal (titres, jauges, gemmes) */
export const COULEUR_RARETE: Record<Rarete, string> = { fer: '#8E949C', cuivre: '#C47A48', argent: '#B8C4CE', or: '#E2B44A', nacre: '#E6D3EE' };

type Action = 'atk' | 'bouclier' | 'soin';
const trait = (d: string, w = 2.2) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
/** l'action, au trait : une épée, un écu, un + */
export const ICONES_ACTION: Record<Action, string> = {
  atk: trait('<path d="M20.5 3.5l-1 5.5L9.5 19 5 14.5l10-10z"/><path d="M4 13.5l6.5 6.5"/><path d="M3 21l3.5-3.5"/>'),
  bouclier: trait('<path d="M12 2.5l8 3v6c0 5-3.4 8.6-8 10-4.6-1.4-8-5-8-10v-6z"/><path d="M12 7v10"/>'),
  soin: trait('<path d="M12 5v14M5 12h14"/>', 2.6),
};
/** une icône dorée par effet : devant son nom sur la carte, et seule sous la barre en main */
export const ICONES_EFFET: Record<TypeEffet, string> = {
  percant: trait('<path d="M3 12h15"/><path d="M14 7l5 5-5 5"/><path d="M9 4v16" stroke-dasharray="2 3"/>'),
  siphon: trait('<path d="M19 12a7 7 0 1 1-2-4.9"/><path d="M19 3v5h-5"/>'),
  flux: trait('<path d="M13 2L4 14h7l-1 8 9-12h-7z"/>'),
  desarmer: trait('<path d="M20.5 3.5l-1 5.5-3 3"/><path d="M12.5 14l-3 3L7 14.5l3-3"/><path d="M4 13.5l6.5 6.5"/>'),
  fissure: trait('<path d="M13 2l-4 6 5 4-4 5 2 5"/>'),
  elan: trait('<path d="M5 6l6 6-6 6"/><path d="M12 6l6 6-6 6"/>'),
  crescendo: trait('<path d="M5 20v-4M12 20v-9M19 20V5"/>', 2.8),
  accord: trait('<path d="M8 3v7a4 4 0 0 0 8 0V3"/><path d="M12 14v8"/>'),
  vague: trait('<path d="M2 14c3-4 5-4 7 0s4 4 7 0 4-4 6-1"/><path d="M2 19c3-3 5-3 7 0s4 3 7 0 4-3 6-1"/>'),
  rempart: trait('<path d="M3 21V9h3v3h3V9h3v3h3V9h3v3h3v9z"/>'),
  // les voies (27 octobre 2026)
  riposte: trait('<path d="M12 2.5l7 2.6v5.2c0 4.4-3 7.6-7 8.8-4-1.2-7-4.4-7-8.8V5.1z"/><path d="M14 8l-4 4h4l-4 4"/>'),
  decharge: trait('<path d="M5 9h10a3 3 0 0 1 0 6H5z"/><path d="M19 11v2"/><path d="M8 3l-2 4h4l-2 4"/>'),
  diapason: trait('<path d="M8 3v7a4 4 0 0 0 8 0V3"/><path d="M12 14v8"/><path d="M4 8h2M18 8h2"/>'),
  unisson: trait('<path d="M4 9v6M9 6v12M14 6v12M19 9v6"/>', 2.6),
};
/** la couleur de l'arête du cadre, de la barre et de la capsule de valeur */
const COULEUR_ACTION: Record<Action, string> = { atk: '#ff6a4a', bouclier: '#5fb0ff', soin: '#7fe06a' };
const ACTION = { atk: 'Attaque', bouclier: 'Bouclier', soin: 'Soin' } as const;

/** les effets sur l'illustration, du Fer à la Nacre */
const FX: Record<Rarete, string> = {
  fer: '',
  cuivre: '<span class="fc-fx fc-lueur"></span>',
  argent: '<span class="fc-fx fc-reflet"></span>',
  or: '<canvas class="fc-fx fc-dore" data-fx="or"></canvas><canvas class="fc-fx" data-fx="paillettes"></canvas>',
  nacre: '<canvas class="fc-fx fc-cristal" data-fx="cristal"></canvas><span class="fc-fx fc-holo"></span>',
};

/** Ce qu'affiche une face de carte, qu'elle soit dans la collection ou en combat */
export interface Face {
  /** clé de la carte pour l'illustration (sans le métal) */
  carte?: string;
  /** image de remplacement quand la carte n'a pas d'illustration (le portrait du Porteur) */
  repli?: string | null;
  metal: Rarete;
  type: Action;
  v: number;
  /** les Fréquences, la principale d'abord */
  fs: number[];
  nom: string;
  effet?: Effet;
  /** second effet (cartes de l'Héritage) */
  effet2?: Effet;
  lourd?: boolean;
  /** niveau de la carte (absent : un losange de lignée à la place de la roue, en combat ou pour une carte du paquetage) */
  niveau?: number;
  /** couleur de la lignée (la roue de niveau) */
  lignee: string;
  /** effets de métal sur l'illustration (collection) */
  fx?: boolean;
  /** la Fréquence principale s'allume : la carte prolonge la suite (combat) */
  suite?: boolean;
}

/** Le dedans d'une carte : à poser dans un conteneur `.nf` (voir `faceCarte` et `geste`) */
export function corpsFace(d: Face): string {
  const ill = d.carte ? illustrationModule(d.carte) : null;
  const art = ill
    ? `<img src="${ill}" alt="" decoding="async"${d.fx ? ` data-src-fx="${ill}"` : ''}>`
    : d.repli ? `<img class="nf-repli" src="${d.repli}" alt="" decoding="async">`
      : `<span class="nf-sans-image"></span>`;
  // une Fréquence libre : ∗ pour l'Accord, = pour le Diapason
  const accord = frequenceLibre(d.effet);
  const segs = accord
    ? `<span class="nf-seg p" style="--fc:#5d5470">${signeLibre(d.effet)}</span>`
    : d.fs.map((f, i) => `<span class="nf-seg${i ? '' : ' p'}" style="--fc:${couleurFrequence(f)}">${f}</span>`).join('');
  const roue = d.niveau !== undefined
    ? `<i class="nf-roue${d.niveau >= COLLECTION.niveauMax ? ' max' : ''}" style="--n:${d.niveau};--max:${COLLECTION.niveauMax}"></i>`
    // sans niveau (en combat, carte du paquetage) : un losange de la couleur de la lignée
    : '<i class="nf-lg"></i>';
  // une carte de l'Héritage a deux effets : une ligne et une icône chacun
  const effet = effetsDe(d).map((e) => `<span class="nf-regle"><i class="nf-ico">${ICONES_EFFET[e.type]}</i><strong>${NOMS_EFFET[e.type]}</strong><span>${formuleEffet(e)}</span></span>`).join('');
  return `<span class="nf-art">${art}${ill && d.fx ? FX[d.metal] : ''}</span>`
    // une carte de l'Héritage (la seule à deux effets) porte son sceau en haut
    + (d.effet2 ? '<span class="nf-heritage">Héritage</span>' : '')
    + `<span class="nf-freqs"><span class="nf-caps">${segs}</span>${d.lourd ? '<b class="nf-lourd">2 PL.</b>' : ''}</span>`
    + `<span class="nf-voile"><span class="nf-barre"></span>`
    + `<span class="nf-val ${d.type}">${ICONES_ACTION[d.type]}<b>${d.v}</b></span>`
    + (d.effet ? `<span class="nf-eff">${effetsDe(d).map((e) => ICONES_EFFET[e.type]).join('')}</span>` : '')
    + `<span class="nf-ligne">${roue}<span class="nf-nom">${echap(d.nom)}</span></span>${effet}</span>`;
}

/** les variables de couleur et de matière d'une face */
export const styleFace = (d: Pick<Face, 'metal' | 'type' | 'lignee'>) =>
  `--ac:${COULEUR_ACTION[d.type]};--lc:${d.lignee};--tex:url(${textureMetal(d.metal)})`;

/**
 * La face de la carte, dans la collection, la boutique, le détail et le guide.
 * @param niveau niveau à afficher (celui de la carte possédée, ou de départ pour une carte proposée)
 * @param mult multiplicateur de force du niveau (1 au niveau de départ)
 */
export function faceCarte(m: ModuleDef, niveau: number, mult = 1, o: { origine?: string } = {}): string {
  // une carte de base sans illustration prend, en attendant, le portrait du Porteur qui la porte au départ
  const base = m.base ?? m.id;
  // (une carte de voie ou de l'Héritage : le portrait du Porteur de sa voie)
  const qui = Object.keys(DEPART_PORTEURS).find((p) => DEPART_PORTEURS[p]!.slice(0, 5).includes(base)) ?? voieDe(base)?.porteur ?? PORTEUR_LEGS[base];
  const v = Math.round(m.v * mult);
  const accord = frequenceLibre(m.effet);
  const d: Face = {
    carte: m.id, repli: qui ? portrait(qui) : null, metal: m.rarete, type: m.type, v, fs: m.f, nom: m.nom, effet: m.effet, ...(m.effet2 ? { effet2: m.effet2 } : {}), lourd: m.lourd,
    // une carte du paquetage n'a ni niveau ni lignée : le bâtiment qui la fournit est écrit sous elle
    niveau: o.origine ? undefined : niveau, lignee: o.origine ? '#CDEFFF' : COULEUR[m.lignee], fx: true,
  };
  const label = `${m.nom}, ${o.origine ? `fournie par la ${o.origine}` : `${NOMS_RARETE[m.rarete]}, niveau ${niveau} sur ${COLLECTION.niveauMax}, ${NOMS_LIGNEE[m.lignee].nom}`}, ${ACTION[m.type]} ${v}, Fréquence ${accord ? 'libre' : m.f.join(' ou ')}${m.effet ? ', ' + nomsEffets(m) : ''}${m.lourd ? ', prend 2 places' : ''}`;
  return `<div class="fc-ombre fo-${m.rarete}${m.legs ? ' fo-legs' : ''}"><div class="fc-carte nf nf-${m.rarete}" style="${styleFace(d)}" role="img" aria-label="${echap(label)}">`
    + corpsFace(d) + `</div></div>`;
}

// ---------- Effets : le code lit l'illustration pour y trouver les cristaux bleus et les zones claires ----------

interface Masques { cristal: HTMLCanvasElement; or: HTMLCanvasElement; points: [number, number, number, number][]; W: number; H: number }
const cache = new Map<string, Promise<Masques>>();
const lisse = (a: number, b: number, x: number) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };

function calculer(img: HTMLImageElement): Masques {
  const W = 320, H = Math.round(img.naturalHeight * W / img.naturalWidth);
  const src = document.createElement('canvas'); src.width = W; src.height = H;
  const c = src.getContext('2d', { willReadFrequently: true })!; c.drawImage(img, 0, 0, W, H);
  const px = c.getImageData(0, 0, W, H).data;
  const toile = () => { const cv = document.createElement('canvas'); cv.width = W; cv.height = H; return cv; };
  const cri = toile(), bri = toile();
  const dc = cri.getContext('2d')!.createImageData(W, H), db = bri.getContext('2d')!.createImageData(W, H);
  const points: Masques['points'] = [];
  let graine = 4517; const alea = () => (graine = (graine * 16807) % 2147483647) / 2147483647;
  for (let i = 0; i < W * H; i++) {
    const r = px[i * 4]! / 255, g = px[i * 4 + 1]! / 255, b = px[i * 4 + 2]! / 255;
    const mx = Math.max(r, g, b), mn = Math.min(r, g, b), sat = mx ? (mx - mn) / mx : 0, lum = 0.3 * r + 0.59 * g + 0.11 * b;
    const bleu = b > r + 0.12 && b >= g - 0.02;
    const aC = bleu ? lisse(0.45, 0.8, mx) * lisse(0.25, 0.5, sat) : 0;   // cristaux : bleus, saturés, lumineux
    const aB = !bleu && r >= b ? lisse(0.5, 0.78, lum) : 0;                 // zones claires chaudes : métal, reflets, lampes
    dc.data.set([200, 240, 255, aC * 255], i * 4);
    db.data.set([255, 206, 92, aB * 255], i * 4);
    if (aB > 0.6 && alea() < 0.02) points.push([(i % W) / W, Math.floor(i / W) / H, alea() * 6.28, 0.6 + alea() * 0.8]);
  }
  cri.getContext('2d')!.putImageData(dc, 0, 0);
  bri.getContext('2d')!.putImageData(db, 0, 0);
  const halo = toile(), hc = halo.getContext('2d')!;
  hc.filter = 'blur(7px)'; hc.drawImage(cri, 0, 0); hc.drawImage(cri, 0, 0); hc.drawImage(cri, 0, 0); hc.filter = 'none'; hc.drawImage(cri, 0, 0);
  return { cristal: halo, or: bri, points, W, H };
}

function masques(url: string): Promise<Masques> {
  let p = cache.get(url);
  if (!p) {
    p = new Promise((ok, ko) => { const img = new Image(); img.onload = () => ok(calculer(img)); img.onerror = ko; img.src = url; });
    cache.set(url, p);
  }
  return p;
}

/** même recadrage que l'image (object-fit: cover, centrée) */
function couvre(iw: number, ih: number, bw: number, bh: number) { const k = Math.max(bw / iw, bh / ih), w = iw * k, h = ih * k; return [(bw - w) * 0.5, (bh - h) * 0.5, w, h] as const; }

function preparer(cv: HTMLCanvasElement) {
  const dpr = Math.min(window.devicePixelRatio || 1, 2), bw = cv.clientWidth, bh = cv.clientHeight;
  if (!bw) return null;
  if (cv.width !== Math.round(bw * dpr)) { cv.width = Math.round(bw * dpr); cv.height = Math.round(bh * dpr); }
  const c = cv.getContext('2d')!; c.setTransform(dpr, 0, 0, dpr, 0, 0); c.clearRect(0, 0, bw, bh);
  return { c, bw, bh };
}

let paillettes: { cv: HTMLCanvasElement; m: Masques }[] = [];
let boucle = 0;
function animer(ms: number) {
  paillettes = paillettes.filter((p) => p.cv.isConnected);
  if (!paillettes.length) { boucle = 0; return; }
  const t = ms / 1000;
  for (const { cv, m } of paillettes) {
    const p = preparer(cv); if (!p) continue;
    const [x, y, w, h] = couvre(m.W, m.H, p.bw, p.bh);
    for (const [u, v, ph, sz] of m.points) {
      const a = Math.pow(Math.max(0, Math.sin(t * 1.6 + ph)), 6); if (a < 0.02) continue;
      const px = x + u * w, py = y + v * h, r = (2 + sz * 3) * (p.bw / 290) * (0.5 + a * 0.5);
      p.c.globalAlpha = a; p.c.fillStyle = '#fff6d6'; p.c.beginPath();
      p.c.moveTo(px, py - r); p.c.lineTo(px + r * 0.22, py - r * 0.22); p.c.lineTo(px + r, py); p.c.lineTo(px + r * 0.22, py + r * 0.22);
      p.c.lineTo(px, py + r); p.c.lineTo(px - r * 0.22, py + r * 0.22); p.c.lineTo(px - r, py); p.c.lineTo(px - r * 0.22, py - r * 0.22); p.c.closePath(); p.c.fill();
    }
    p.c.globalAlpha = 1;
  }
  boucle = requestAnimationFrame(animer);
}

/** À appeler après chaque rendu : peint les effets des cartes présentes dans `racine` */
export function activerCartes(racine: ParentNode) {
  racine.querySelectorAll<HTMLElement>('.fc-carte').forEach((carte) => {
    const img = carte.querySelector<HTMLImageElement>('img[data-src-fx]');
    const toiles = carte.querySelectorAll<HTMLCanvasElement>('canvas[data-fx]');
    if (!img || !toiles.length) return;
    masques(img.dataset.srcFx!).then((m) => {
      toiles.forEach((cv) => {
        if (cv.dataset.fx === 'paillettes') { if (!reduit()) paillettes.push({ cv, m }); return; }
        const p = preparer(cv); if (!p) return;
        const [x, y, w, h] = couvre(m.W, m.H, p.bw, p.bh);
        p.c.drawImage(cv.dataset.fx === 'or' ? m.or : m.cristal, x, y, w, h);
      });
      if (paillettes.length && !boucle) boucle = requestAnimationFrame(animer);
    }).catch(() => { /* image absente : la carte reste sans effet */ });
  });
}

// La lumière et l'inclinaison suivent le doigt ou la souris (un seul écouteur pour toutes les cartes)
let carteActive: HTMLElement | null = null;
document.addEventListener('pointermove', (e) => {
  const c = (e.target as Element | null)?.closest?.<HTMLElement>('.fc-carte') ?? null;
  if (carteActive && carteActive !== c) relacher(carteActive);
  carteActive = c;
  if (!c) return;
  const b = c.getBoundingClientRect(), x = (e.clientX - b.left) / b.width, y = (e.clientY - b.top) / b.height;
  c.classList.add('touchee');
  c.style.setProperty('--mx', `${x * 100}%`); c.style.setProperty('--my', `${y * 100}%`);
  if (!reduit()) { c.style.setProperty('--ry', `${(x - 0.5) * 12}deg`); c.style.setProperty('--rx', `${(0.5 - y) * 12}deg`); }
}, { passive: true });
function relacher(c: HTMLElement) {
  c.classList.remove('touchee');
  for (const p of ['--mx', '--my', '--rx', '--ry']) c.style.removeProperty(p);
}
// au doigt, la carte se repose quand on le lève
const lever = (e: PointerEvent) => { if (e.pointerType !== 'mouse' && carteActive) { relacher(carteActive); carteActive = null; } };
document.addEventListener('pointerup', lever, { passive: true });
document.addEventListener('pointercancel', lever, { passive: true });
