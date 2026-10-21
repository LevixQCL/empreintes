// La face d'une carte Module, validée par Bryan le 21 octobre 2026 (maquette « Jambes à ressort, des cinq métaux ») :
// - l'illustration Midjourney en haut, une silhouette à deux coins coupés, un onglet de métal qui porte le nom, une plaque pour les Gestes ;
// - le métal (texture Midjourney, public/art/metaux) dit la rareté, avec une gemme de forme différente par métal ;
// - un effet sur l'illustration monte avec la rareté : rien, lueur, reflet, paillettes d'or, cristaux qui pulsent ;
// - la Nacre n'a pas de cadre : l'illustration va jusqu'aux bords.
// Les tailles sont en unités de conteneur (cqw) : la même carte s'affiche en grand ou en petit.

import { NOMS_EFFET } from '../core/effets';
import { NOMS_LIGNEE } from '../core/donnees';
import { NOMS_RARETE } from '../core/collection';
import type { ModuleDef, Rarete } from '../core/types';
import { illustrationModule, textureMetal } from './art';
import { COULEUR, echap } from './vue';

/** une couleur par Fréquence, du 1 (chaud) au 9 (froid) : des Fréquences qui se suivent ont des couleurs voisines */
export const couleurFrequence = (f: number) => `hsl(${8 + (f - 1) * 34} 52% 38%)`;

const ICONES = {
  atk: '<svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"><path d="M10.5 1.5h4v4l-7.8 7.8-1.4-1.4 1.1-1.1-2.1-2.1-1.1 1.1-1.4-1.4z"/><path d="M2 12.6l1.4 1.4-1.6 1.6-1.4-1.4z"/></svg>',
  bouclier: '<svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"><path d="M8 1l6 2v4.6c0 3.6-2.6 6.4-6 7.4-3.4-1-6-3.8-6-7.4V3z"/></svg>',
  soin: '<svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"><path d="M6 1.5h4v4.5h4.5v4H10v4.5H6V10H1.5V6H6z"/></svg>',
} as const;
const LIBELLE = { atk: 'attaque', bouclier: 'protection', soin: 'soin' } as const;

/** les effets sur l'illustration, du Fer à la Nacre */
const FX: Record<Rarete, string> = {
  fer: '',
  cuivre: '<span class="fc-fx fc-lueur"></span>',
  argent: '<span class="fc-fx fc-reflet"></span>',
  or: '<canvas class="fc-fx fc-dore" data-fx="or"></canvas><canvas class="fc-fx" data-fx="paillettes"></canvas>',
  nacre: '<canvas class="fc-fx fc-cristal" data-fx="cristal"></canvas><span class="fc-fx fc-holo"></span>',
};

/**
 * La face de la carte.
 * @param niveau niveau à afficher (celui de la carte possédée, ou de départ pour une carte proposée)
 * @param mult multiplicateur de force du niveau (1 au niveau de départ)
 */
export function faceCarte(m: ModuleDef, niveau: number, mult = 1): string {
  const ill = illustrationModule(m.id);
  const art = ill
    ? `<img src="${ill}" alt="" decoding="async" data-src-fx="${ill}">`
    : `<span class="fc-sans-image" style="--c:${COULEUR[m.lignee]}"></span>`;
  const gestes = m.gestes.map((g) => {
    const accord = g.effet?.type === 'accord';
    const tags = (g.lourd ? '<em>lourd</em>' : '') + (g.effet ? `<em>${NOMS_EFFET[g.effet.type]}</em>` : '');
    return `<li><span class="fc-freq" style="--fc:${accord ? '#5d5470' : couleurFrequence(g.f)}" title="${accord ? 'Accord : prend la Fréquence qui prolonge ta suite' : `Fréquence ${g.f}`}">${accord ? '∗' : g.f}</span>`
      + `<span class="fc-gn">${echap(g.nom)}${tags}</span>`
      + `<span class="fc-val ${g.type}" title="${LIBELLE[g.type]}">${ICONES[g.type]}${Math.round(g.v * mult)}</span></li>`;
  }).join('');
  return `<div class="fc-ombre fo-${m.rarete}"><div class="fc-carte fr-${m.rarete}" style="--tex:url(${textureMetal(m.rarete)})" aria-label="${echap(m.nom)}, ${NOMS_RARETE[m.rarete]}, niveau ${niveau}">`
    + `<div class="fc-art">${art}${ill ? FX[m.rarete] : ''}<span class="fc-puces"><span>Niv. ${niveau}</span><span class="fc-lignee" style="--c:${COULEUR[m.lignee]}">${NOMS_LIGNEE[m.lignee].court}</span></span></div>`
    + `<div class="fc-plaque"><span class="fc-lumiere"></span><div class="fc-titre"><span class="fc-gemme" title="${NOMS_RARETE[m.rarete]}"></span><span class="fc-nom">${echap(m.nom)}</span></div><ul class="fc-gestes">${gestes}</ul></div>`
    + `</div></div>`;
}

// ---------- Effets : le code lit l'illustration pour y trouver les cristaux bleus et les zones claires ----------

interface Masques { cristal: HTMLCanvasElement; or: HTMLCanvasElement; points: [number, number, number, number][]; W: number; H: number }
const cache = new Map<string, Promise<Masques>>();
const reduit = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
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

/** même recadrage que l'image (object-fit: cover, centrée à 26 % de la hauteur) */
function couvre(iw: number, ih: number, bw: number, bh: number) { const k = Math.max(bw / iw, bh / ih), w = iw * k, h = ih * k; return [(bw - w) * 0.5, (bh - h) * 0.26, w, h] as const; }

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
