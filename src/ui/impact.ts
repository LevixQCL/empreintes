// Le « langage d'impact » du combat : ce qui se voit et s'entend quand une chaîne part.
// Tout est dessiné sur un calque posé par-dessus l'écran (le combat se redessine à chaque étape, le calque, lui, reste).
// Trois règles pour ne jamais lasser :
//  1. la lignée de la carte change l'effet (Augmentés : arc électrique ; Génés : griffures d'ambre ; Résonants : ondes) ;
//  2. la place dans la chaîne fait monter l'intensité (tremblement, particules, note plus aiguë), comme une phrase musicale ;
//  3. un peu de hasard (angles, positions, hauteur du son) : deux coups ne se ressemblent jamais tout à fait.
// L'option « réduire les animations » du téléphone coupe les tremblements et les particules.

import type { Evenement, LigneeGeste } from '../core/types';
import { vibrer } from './toucher';
import { ondeDeChoc } from './verre';

const TEINTE: Record<LigneeGeste, string> = { tech: '#8FDCFF', bio: '#FFB44A', reso: '#B98CFF', neutre: '#EBD9A8' };
const SOIN = '#7CE3A0';
const BOUCLIER = '#E6F3FF';
const DANGER = '#FF6B5B';

interface Particule { x: number; y: number; vx: number; vy: number; vie: number; max: number; taille: number; couleur: string; gravite: number; trainee?: boolean; frein?: number; eclat?: { angle: number; tourne: number; forme: number[] } }
interface Trait { dessiner: (c: CanvasRenderingContext2D, t: number) => void; debut: number; duree: number }

let canvas: HTMLCanvasElement | null = null;
let ctx: CanvasRenderingContext2D | null = null;
let particules: Particule[] = [];
let traits: Trait[] = [];
let boucle = 0;
let reduit = false;
/** la dernière carte jouée : son effet se déclenche à l'impact qui suit */
let derniere: { lignee: LigneeGeste; rang: number; total: number; suite: number; type: string; effet?: string } | null = null;

const hasard = (a: number, b: number) => a + Math.random() * (b - a);
const maintenant = () => performance.now();

// ---------- Les textures peintes (Midjourney, détourées) ----------
// Chaque geste a sa texture ; tant qu'elle n'est pas chargée (ou si elle manque), le trait dessiné en code prend le relais.
type NomSprite = 'tech' | 'bio' | 'reso' | 'impact';
const sprites: Partial<Record<NomSprite, HTMLImageElement>> = {};
function chargerSprites() {
  const base = new URL('art/effets/', document.baseURI).href;
  for (const n of ['tech', 'bio', 'reso', 'impact'] as NomSprite[]) {
    if (sprites[n]) continue;
    const im = new Image();
    im.decoding = 'async';
    im.src = `${base}${n}.webp`;
    sprites[n] = im;
  }
}
const pret = (n: NomSprite) => { const im = sprites[n]; return im && im.complete && im.naturalWidth > 0 ? im : null; };

/** Dessine une texture centrée en (x, y), tournée de `angle`, à la largeur `largeur` */
function sprite(c: CanvasRenderingContext2D, im: HTMLImageElement, x: number, y: number, largeur: number, angle = 0, etirement = 1) {
  const h = (largeur * im.naturalHeight) / im.naturalWidth;
  c.translate(x, y); c.rotate(angle);
  c.drawImage(im, (-largeur * etirement) / 2, -h / 2, largeur * etirement, h);
}

export function initImpacts(mouvementReduit: boolean): void {
  chargerSprites();
  reduit = mouvementReduit;
  if (canvas) return;
  canvas = document.createElement('canvas');
  canvas.className = 'calque-impacts';
  canvas.setAttribute('aria-hidden', 'true');
  document.body.appendChild(canvas);
  ctx = canvas.getContext('2d');
  const taille = () => {
    const r = window.devicePixelRatio || 1;
    canvas!.width = Math.round(innerWidth * r);
    canvas!.height = Math.round(innerHeight * r);
    ctx?.setTransform(r, 0, 0, r, 0, 0);
  };
  taille();
  addEventListener('resize', taille);
}

function lancerBoucle() {
  if (boucle || !ctx) return;
  let avant = maintenant();
  const pas = () => {
    const t = maintenant();
    const dt = Math.min(0.05, (t - avant) / 1000);
    avant = t;
    const c = ctx!;
    c.clearRect(0, 0, innerWidth, innerHeight);
    c.globalCompositeOperation = 'lighter';
    traits = traits.filter((tr) => {
      const k = (t - tr.debut) / tr.duree;
      if (k < 0) return true;
      if (k >= 1) return false;
      c.save(); tr.dessiner(c, k); c.restore();
      return true;
    });
    particules = particules.filter((p) => {
      p.vie -= dt;
      if (p.vie <= 0) return false;
      // l'air freine : les étincelles jaillissent vite puis flottent, au lieu de filer droit
      const frein = Math.exp(-(p.frein ?? 0) * dt);
      p.vx *= frein; p.vy *= frein;
      p.vy += p.gravite * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      const a = Math.max(0, p.vie / p.max);
      if (p.eclat) dessinerEclat(c, p, a, dt);
      else if (p.trainee) {
        // une traînée de lumière : un halo coloré, un cœur blanc, une tête qui brille
        const queue = 0.05;
        c.lineCap = 'round';
        c.globalAlpha = a * 0.55;
        c.strokeStyle = p.couleur; c.lineWidth = p.taille * 2.4;
        c.beginPath(); c.moveTo(p.x, p.y); c.lineTo(p.x - p.vx * queue, p.y - p.vy * queue); c.stroke();
        c.globalAlpha = a;
        c.strokeStyle = '#fff'; c.lineWidth = Math.max(0.8, p.taille * 0.7);
        c.beginPath(); c.moveTo(p.x, p.y); c.lineTo(p.x - p.vx * queue * 0.6, p.y - p.vy * queue * 0.6); c.stroke();
        halo(c, p.x, p.y, p.taille * 4, p.couleur, a * 0.8);
      } else {
        // une braise : un halo doux et un point blanc au centre
        halo(c, p.x, p.y, p.taille * (2.5 + a * 2.5), p.couleur, a);
        c.globalAlpha = a; c.fillStyle = '#fff';
        c.beginPath(); c.arc(p.x, p.y, p.taille * 0.45 * (0.5 + a / 2), 0, Math.PI * 2); c.fill();
      }
      return true;
    });
    c.globalAlpha = 1;
    c.globalCompositeOperation = 'source-over';
    if (particules.length || traits.length) boucle = requestAnimationFrame(pas);
    else { boucle = 0; c.clearRect(0, 0, innerWidth, innerHeight); }
  };
  boucle = requestAnimationFrame(pas);
}

/** Un halo de lumière : un dégradé radial peint une fois par couleur, puis simplement recopié (bien moins cher qu'une ombre floue) */
const halos = new Map<string, HTMLCanvasElement>();
function halo(c: CanvasRenderingContext2D, x: number, y: number, rayon: number, couleur: string, alpha: number) {
  let h = halos.get(couleur);
  if (!h) {
    h = document.createElement('canvas');
    h.width = h.height = 64;
    const g = h.getContext('2d')!;
    const d = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    d.addColorStop(0, couleur); d.addColorStop(0.25, couleur + 'AA'); d.addColorStop(1, couleur + '00');
    g.fillStyle = d; g.fillRect(0, 0, 64, 64);
    halos.set(couleur, h);
  }
  c.globalAlpha = alpha;
  c.drawImage(h, x - rayon, y - rayon, rayon * 2, rayon * 2);
}

/** Un éclat de verre : un petit polygone qui tourne et lance un reflet quand il fait face à la lumière */
function dessinerEclat(c: CanvasRenderingContext2D, p: Particule, a: number, dt: number) {
  const e = p.eclat!;
  e.angle += e.tourne * dt;
  // la face visible s'amincit et s'élargit en tournant ; le reflet éclate quand elle est de face
  const face = Math.cos(e.angle * 1.7);
  const reflet = Math.pow(Math.abs(face), 8);
  c.save();
  c.translate(p.x, p.y); c.rotate(e.angle); c.scale(1, 0.25 + Math.abs(face) * 0.75);
  c.globalAlpha = a * (0.35 + reflet * 0.65);
  c.fillStyle = reflet > 0.5 ? '#fff' : p.couleur;
  c.strokeStyle = '#fff'; c.lineWidth = 0.8;
  c.beginPath();
  for (let i = 0; i < e.forme.length; i += 2) c[i ? 'lineTo' : 'moveTo'](e.forme[i]! * p.taille, e.forme[i + 1]! * p.taille);
  c.closePath(); c.fill(); c.stroke();
  c.restore();
  if (reflet > 0.6) halo(c, p.x, p.y, p.taille * 3.5, '#FFFFFF', a * reflet * 0.7);
}

/** Des éclats de verre qui sautent du point d'impact */
function verre(x: number, y: number, n: number, couleur: string, force: number) {
  if (reduit) return;
  n = Math.min(n, MAX_PARTICULES - particules.length);
  for (let i = 0; i < n; i++) {
    const a = hasard(-Math.PI, 0.2) - 0.3; // surtout vers le haut et les côtés
    const v = hasard(140, 260 + force * 40);
    const vie = hasard(0.6, 1.1);
    const forme = [0, -1, hasard(0.4, 0.9), hasard(-0.2, 0.4), hasard(-0.1, 0.2), 1, hasard(-0.9, -0.4), hasard(-0.1, 0.3)];
    particules.push({ x: x + hasard(-10, 10), y: y + hasard(-10, 10), vx: Math.cos(a) * v, vy: Math.sin(a) * v, vie, max: vie, taille: hasard(3, 5.5 + force * 0.4), couleur, gravite: 520, frein: 1.2, eclat: { angle: hasard(0, 6.28), tourne: hasard(-14, 14), forme } });
  }
  lancerBoucle();
}

/** plafond de particules à l'écran, pour les téléphones modestes */
const MAX_PARTICULES = 220;

function eclats(x: number, y: number, n: number, couleur: string, o: { vitesse?: number; gravite?: number; taille?: number; vie?: number; trainee?: boolean; angle?: number; ouverture?: number; frein?: number } = {}) {
  if (reduit) return;
  n = Math.min(n, MAX_PARTICULES - particules.length);
  for (let i = 0; i < n; i++) {
    const a = (o.angle ?? 0) + hasard(-1, 1) * (o.ouverture ?? Math.PI);
    const v = hasard(0.3, 1) * (o.vitesse ?? 260);
    const vie = hasard(0.5, 1) * (o.vie ?? 0.7);
    particules.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, vie, max: vie, taille: hasard(0.6, 1.2) * (o.taille ?? 3), couleur, gravite: o.gravite ?? 300, trainee: o.trainee, frein: o.frein ?? (o.trainee ? 3 : 1) });
  }
  lancerBoucle();
}

function trait(dessiner: Trait['dessiner'], duree: number, delai = 0) {
  if (reduit) return;
  traits.push({ dessiner, debut: maintenant() + delai, duree });
  lancerBoucle();
}

// ---------- Les gestes de chaque lignée ----------

/** Augmentés : un arc électrique brisé qui file de la carte à l'ennemi, avec deux ramifications */
function arc(de: DOMPoint, a: DOMPoint, couleur: string, force: number) {
  const tex = pret('tech');
  if (tex) {
    // l'éclair peint, étiré de la carte à l'ennemi, qui grésille (deux tirages légèrement décalés)
    const dx = a.x - de.x, dy = a.y - de.y;
    const long = Math.hypot(dx, dy), angle = Math.atan2(dy, dx);
    const cx = (de.x + a.x) / 2, cy = (de.y + a.y) / 2;
    trait((c, k) => {
      const ouvert = Math.min(1, k * 3.5);
      c.globalAlpha = (1 - k) * (0.85 + Math.random() * 0.15);
      c.save(); c.beginPath(); c.translate(de.x, de.y); c.rotate(angle); c.rect(-10, -200, long * ouvert + 20, 400); c.restore(); c.clip();
      c.save(); sprite(c, tex, cx, cy, long, angle); c.restore();
      c.globalAlpha *= 0.5; c.save(); sprite(c, tex, cx + hasard(-3, 3), cy + hasard(-4, 4), long * 1.02, angle + hasard(-0.03, 0.03), 1); c.restore();
    }, 280);
    return;
  }
  const segments = 9;
  const points: [number, number][] = [];
  for (let i = 0; i <= segments; i++) {
    const k = i / segments;
    const ecart = i === 0 || i === segments ? 0 : hasard(-1, 1) * 22 * (1 - Math.abs(k - 0.5));
    points.push([de.x + (a.x - de.x) * k + ecart, de.y + (a.y - de.y) * k + ecart * 0.4]);
  }
  const branches = [3, 6].map((i) => { const [x, y] = points[i]!; return [[x, y], [x + hasard(-40, 40), y + hasard(-30, 10)]] as [number, number][]; });
  trait((c, k) => {
    c.globalAlpha = 1 - k;
    c.strokeStyle = couleur; c.shadowColor = couleur; c.shadowBlur = 14;
    c.lineWidth = 2 + force; c.lineJoin = 'round';
    const n = Math.max(1, Math.ceil(Math.min(1, k * 4) * points.length));
    c.beginPath(); points.slice(0, n).forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y))); c.stroke();
    c.lineWidth = 1;
    for (const b of branches) { c.beginPath(); c.moveTo(...b[0]!); c.lineTo(...b[1]!); c.stroke(); }
  }, 260);
}

/** Génés : trois griffures d'ambre en travers de l'ennemi, puis des gouttes de résine */
function griffes(p: DOMPoint, couleur: string, force: number) {
  const tex = pret('bio');
  if (tex) {
    // la griffure peinte, révélée en un geste de haut en bas, un peu tournée au hasard
    const angle = hasard(-0.35, 0.35) + (Math.random() < 0.3 ? Math.PI / 2 : 0);
    const larg = 120 + force * 18;
    const miroir = Math.random() < 0.5 ? -1 : 1;
    trait((c, k) => {
      const ouvert = Math.min(1, k * 3.2);
      c.globalAlpha = k < 0.55 ? 1 : 1 - (k - 0.55) / 0.45;
      c.translate(p.x, p.y); c.rotate(angle); c.scale(miroir, 1);
      const h = (larg * tex.naturalHeight) / tex.naturalWidth;
      c.beginPath(); c.rect(-larg / 2, -h / 2, larg, h * ouvert); c.clip();
      c.drawImage(tex, -larg / 2, -h / 2, larg, h);
    }, 420);
    setTimeout(() => eclats(p.x, p.y, 6 + force * 3, couleur, { vitesse: 140, gravite: 520, taille: 3.5, vie: 0.9 }), 120);
    return;
  }
  const angle = hasard(-0.9, -0.5) + (Math.random() < 0.5 ? 0 : Math.PI / 2.4);
  const long = 70 + force * 14;
  for (let i = 0; i < 3; i++) {
    const dx = Math.cos(angle + Math.PI / 2) * (i - 1) * 16;
    const dy = Math.sin(angle + Math.PI / 2) * (i - 1) * 16;
    trait((c, k) => {
      const ouvert = Math.min(1, k * 3);
      c.globalAlpha = 1 - k * k;
      c.strokeStyle = couleur; c.shadowColor = couleur; c.shadowBlur = 12; c.lineCap = 'round';
      c.lineWidth = (3 + force) * (1 - k * 0.6);
      const x0 = p.x + dx - Math.cos(angle) * long / 2, y0 = p.y + dy - Math.sin(angle) * long / 2;
      c.beginPath(); c.moveTo(x0, y0); c.lineTo(x0 + Math.cos(angle) * long * ouvert, y0 + Math.sin(angle) * long * ouvert); c.stroke();
    }, 340, i * 45);
  }
  setTimeout(() => eclats(p.x, p.y, 6 + force * 3, couleur, { vitesse: 140, gravite: 520, taille: 3.5, vie: 0.9 }), 120);
}

/** Résonants : des ondes qui s'élargissent depuis l'ennemi, et des lucioles qui s'en échappent */
function ondes(p: DOMPoint, couleur: string, force: number) {
  const tex = pret('reso');
  if (tex) {
    // l'anneau peint qui s'élargit, deux ou trois fois, en tournant doucement
    for (let i = 0; i < 2 + Math.min(1, Math.floor(force / 2)); i++) {
      const sens = Math.random() < 0.5 ? -1 : 1, depart = hasard(0, Math.PI * 2);
      trait((c, k) => {
        c.globalAlpha = (1 - k) * 0.95;
        c.save(); sprite(c, tex, p.x, p.y, (60 + force * 12) * (0.5 + k * 1.6), depart + sens * k * 0.8); c.restore();
      }, 560, i * 120);
    }
    eclats(p.x, p.y, 8 + force * 3, couleur, { vitesse: 90, gravite: -60, taille: 2.6, vie: 1.1 });
    return;
  }
  for (let i = 0; i < 2 + Math.min(2, force); i++) {
    trait((c, k) => {
      c.globalAlpha = (1 - k) * 0.9;
      c.strokeStyle = couleur; c.shadowColor = couleur; c.shadowBlur = 16;
      c.lineWidth = 3 * (1 - k) + 1;
      c.beginPath(); c.ellipse(p.x, p.y, 20 + k * (90 + force * 18), (20 + k * (90 + force * 18)) * 0.62, 0, 0, Math.PI * 2); c.stroke();
    }, 520, i * 110);
  }
  eclats(p.x, p.y, 8 + force * 3, couleur, { vitesse: 90, gravite: -60, taille: 2.6, vie: 1.1 });
}

/** Le chemin de la carte vers l'ennemi, pour les Génés et les Résonants : une comète courte */
function comete(de: DOMPoint, a: DOMPoint, couleur: string) {
  trait((c, k) => {
    const x = de.x + (a.x - de.x) * k, y = de.y + (a.y - de.y) * k;
    const g = c.createRadialGradient(x, y, 0, x, y, 14);
    g.addColorStop(0, '#fff'); g.addColorStop(0.3, couleur); g.addColorStop(1, 'transparent');
    c.fillStyle = g; c.beginPath(); c.arc(x, y, 14, 0, Math.PI * 2); c.fill();
  }, 170);
}

function bouclierSur(p: DOMRect) {
  trait((c, k) => {
    c.globalAlpha = Math.sin(k * Math.PI) * 0.8;
    c.strokeStyle = BOUCLIER; c.shadowColor = '#9FD8FF'; c.shadowBlur = 18; c.lineWidth = 2;
    const cx = p.left + p.width / 2, cy = p.top + p.height / 2, rx = p.width / 2 + 6, ry = p.height / 2 + 4;
    c.beginPath();
    for (let i = 0; i <= 6; i++) { const a = (i / 6) * Math.PI * 2 + Math.PI / 6; c[i ? 'lineTo' : 'moveTo'](cx + Math.cos(a) * rx, cy + Math.sin(a) * ry); }
    c.stroke();
    const x = p.left + k * p.width;
    c.globalAlpha *= 0.6; c.lineWidth = 10; c.beginPath(); c.moveTo(x, p.top); c.lineTo(x - 30, p.bottom); c.stroke();
  }, 520);
}

/** Un voile rouge sur les bords de l'écran, qui s'efface (force de 0 à 1) */
function voileRouge(force: number) {
  traits.push({
    debut: maintenant(), duree: 520,
    dessiner: (c, k) => {
      const w = innerWidth, h = innerHeight;
      const g = c.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.5, w / 2, h / 2, Math.max(w, h) * 0.72);
      g.addColorStop(0, 'rgba(255,40,30,0)');
      g.addColorStop(1, `rgba(220,30,20,${force * (1 - k)})`);
      c.globalCompositeOperation = 'source-over';
      c.fillStyle = g; c.fillRect(0, 0, w, h);
    },
  });
  lancerBoucle();
}

// ---------- Les effets des cartes (22 octobre 2026) ----------
// Chaque effet a son geste à lui, par-dessus celui de la lignée : on reconnaît un Perçant ou une Fissure sans lire le texte.

/** Perçant : une lance de lumière qui traverse l'ennemi de part en part (le bouclier ne l'arrête pas) */
function lance(de: DOMPoint, a: DOMPoint, couleur: string, force: number) {
  const dx = a.x - de.x, dy = a.y - de.y;
  const long = Math.hypot(dx, dy) || 1;
  const ux = dx / long, uy = dy / long;
  const fin = new DOMPoint(a.x + ux * (90 + force * 20), a.y + uy * (90 + force * 20));
  trait((c, k) => {
    const t = Math.min(1, k * 2.4);
    const x = de.x + (fin.x - de.x) * t, y = de.y + (fin.y - de.y) * t;
    c.globalAlpha = k < 0.5 ? 1 : 1 - (k - 0.5) * 2;
    c.lineCap = 'round';
    c.strokeStyle = couleur; c.shadowColor = couleur; c.shadowBlur = 18; c.lineWidth = 5 + force;
    c.beginPath(); c.moveTo(de.x + (x - de.x) * 0.55, de.y + (y - de.y) * 0.55); c.lineTo(x, y); c.stroke();
    c.strokeStyle = '#fff'; c.lineWidth = 1.6; c.stroke();
  }, 300);
  // la sortie : une gerbe d'étincelles dans le prolongement
  setTimeout(() => eclats(fin.x - ux * 60, fin.y - uy * 60, 12 + force * 3, couleur, { vitesse: 320, taille: 2, trainee: true, gravite: 80, angle: Math.atan2(uy, ux), ouverture: 0.35 }), 110);
}

/** Fissure : des lézardes dorées qui courent depuis l'impact et restent un instant */
function fissures(p: DOMPoint) {
  const n = 5 + Math.floor(hasard(0, 3));
  const chemins: [number, number][][] = [];
  for (let i = 0; i < n; i++) {
    let a = (i / n) * Math.PI * 2 + hasard(-0.3, 0.3);
    let x = p.x, y = p.y;
    const pts: [number, number][] = [[x, y]];
    const seg = 4 + Math.floor(hasard(0, 3));
    for (let j = 0; j < seg; j++) { a += hasard(-0.5, 0.5); const l = hasard(10, 20); x += Math.cos(a) * l; y += Math.sin(a) * l * 0.8; pts.push([x, y]); }
    chemins.push(pts);
  }
  trait((c, k) => {
    const ouvert = Math.min(1, k * 3);
    c.globalAlpha = k < 0.6 ? 1 : 1 - (k - 0.6) / 0.4;
    c.strokeStyle = '#FFD98A'; c.shadowColor = '#FF9E3D'; c.shadowBlur = 10; c.lineWidth = 2; c.lineJoin = 'round';
    for (const pts of chemins) {
      const m = Math.max(2, Math.ceil(pts.length * ouvert));
      c.beginPath(); pts.slice(0, m).forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y))); c.stroke();
    }
  }, 900);
  note(1800, 'square', 0.08, 0.02, 0.6);
}

/** Désarmer : l'intention de l'ennemi est frappée, elle tremble et pâlit ; une gerbe d'étincelles métalliques */
function desarme(el: Element | null) {
  const p = centre(el);
  if (p) eclats(p.x, p.y, 14, '#E8EEF5', { vitesse: 240, taille: 1.8, trainee: true, gravite: 260 });
  if (el && !reduit) (el as HTMLElement).animate([
    { transform: 'none', filter: 'none' }, { transform: 'translateX(-6px) rotate(-3deg)', filter: 'grayscale(.8) brightness(1.6)' },
    { transform: 'translateX(5px) rotate(2deg)' }, { transform: 'none', filter: 'none' }], { duration: 420, easing: 'ease-out' });
  note(2400, 'triangle', 0.12, 0.03, 0.7);
}

/** Élan : des traînées de vitesse qui montent depuis la chaîne */
function elan(r: DOMRect) {
  for (let i = 0; i < 7; i++) {
    const x = hasard(r.left + 10, r.right - 10), y = hasard(r.top + r.height * 0.4, r.bottom);
    const l = hasard(30, 60);
    trait((c, k) => {
      c.globalAlpha = Math.sin(k * Math.PI) * 0.9;
      c.strokeStyle = '#F3D27A'; c.shadowColor = '#F3D27A'; c.shadowBlur = 8; c.lineWidth = 2; c.lineCap = 'round';
      c.beginPath(); c.moveTo(x, y - k * 50); c.lineTo(x, y - k * 50 - l); c.stroke();
    }, 380, i * 30);
  }
  note(700, 'triangle', 0.18, 0.025, 1.6);
}

/** Rempart : des pans hexagonaux qui se posent l'un après l'autre devant l'escouade */
function remparts(r: DOMRect) {
  const n = 6;
  for (let i = 0; i < n; i++) {
    const cx = r.left + ((i + 0.5) / n) * r.width, cy = r.top + r.height * 0.55, t = Math.min(r.width / n, r.height) * 0.42;
    trait((c, k) => {
      const pose = Math.min(1, k * 4);
      c.globalAlpha = (k < 0.7 ? 1 : 1 - (k - 0.7) / 0.3) * 0.85;
      c.strokeStyle = BOUCLIER; c.shadowColor = '#9FD8FF'; c.shadowBlur = 14; c.lineWidth = 2;
      c.fillStyle = 'rgba(159,216,255,.12)';
      c.beginPath();
      for (let j = 0; j <= 6; j++) { const a = (j / 6) * Math.PI * 2 + Math.PI / 6; c[j ? 'lineTo' : 'moveTo'](cx + Math.cos(a) * t, cy - (1 - pose) * 30 + Math.sin(a) * t); }
      c.fill(); c.stroke();
    }, 620, i * 50);
  }
}

/** Vague : une onde verte qui balaie toute l'escouade, de gauche à droite */
function vague(r: DOMRect) {
  trait((c, k) => {
    const x = r.left - 40 + k * (r.width + 80);
    const g = c.createLinearGradient(x - 70, 0, x + 20, 0);
    g.addColorStop(0, 'transparent'); g.addColorStop(0.7, 'rgba(124,227,160,.55)'); g.addColorStop(1, 'transparent');
    c.globalAlpha = Math.sin(k * Math.PI);
    c.fillStyle = g; c.fillRect(x - 70, r.top - 6, 90, r.height + 12);
  }, 560);
  for (let i = 0; i < 4; i++) setTimeout(() => eclats(r.left + (i + 0.5) * (r.width / 4), r.bottom - 6, 6, SOIN, { vitesse: 60, gravite: -140, taille: 2.2, vie: 0.9, angle: -Math.PI / 2, ouverture: 0.8 }), i * 120);
}

/** Crescendo : un anneau doré qui grandit avec la place de la carte dans la chaîne */
function crescendo(p: DOMPoint, rang: number) {
  trait((c, k) => {
    c.globalAlpha = (1 - k) * 0.9;
    c.strokeStyle = '#F3D27A'; c.shadowColor = '#FFB44A'; c.shadowBlur = 16; c.lineWidth = 2 + rang;
    c.beginPath(); c.arc(p.x, p.y, 16 + k * (50 + rang * 22), 0, Math.PI * 2); c.stroke();
  }, 480);
}

/** Surcharge (et Flux gagné) : un filet d'énergie file jusqu'à la jauge de Flux */
function versFlux(de: DOMPoint | null, a: DOMPoint | null) {
  if (!de || !a) return;
  for (let i = 0; i < 5; i++) {
    trait((c, k) => {
      const t = Math.min(1, k * 1.3);
      const cx = (de.x + a.x) / 2 + (i - 2) * 14, cy = Math.min(de.y, a.y) - 30;
      const x = (1 - t) * (1 - t) * de.x + 2 * (1 - t) * t * cx + t * t * a.x;
      const y = (1 - t) * (1 - t) * de.y + 2 * (1 - t) * t * cy + t * t * a.y;
      const g = c.createRadialGradient(x, y, 0, x, y, 6);
      g.addColorStop(0, '#fff'); g.addColorStop(0.4, '#F3D27A'); g.addColorStop(1, 'transparent');
      c.fillStyle = g; c.beginPath(); c.arc(x, y, 6, 0, Math.PI * 2); c.fill();
    }, 380, i * 40);
  }
}

/** Le coup d'un ennemi, selon sa lignée : rayon (Tech), griffes (Génés), onde qui se referme (Résonants) */
const TEINTE_ENNEMI: Record<LigneeGeste, string> = { tech: '#FF5A6E', bio: '#FF7A3A', reso: '#C46BFF', neutre: DANGER };
function coupEnnemi(de: DOMPoint | null, p: DOMPoint, lignee: LigneeGeste) {
  const coul = TEINTE_ENNEMI[lignee];
  if (lignee === 'tech' && de) {
    trait((c, k) => {
      c.globalAlpha = (1 - k) * (0.8 + Math.random() * 0.2);
      c.lineCap = 'round'; c.strokeStyle = coul; c.shadowColor = coul; c.shadowBlur = 16; c.lineWidth = 6 * (1 - k) + 1;
      c.beginPath(); c.moveTo(de.x, de.y); c.lineTo(p.x, p.y); c.stroke();
      c.strokeStyle = '#fff'; c.lineWidth = 1.2; c.stroke();
    }, 260);
    eclats(p.x, p.y, 10, coul, { vitesse: 200, taille: 2, trainee: true });
  } else if (lignee === 'bio') {
    const angle = hasard(-0.8, -0.4) + (Math.random() < 0.5 ? 0 : Math.PI / 2.5);
    for (let i = 0; i < 3; i++) {
      const ox = Math.cos(angle + Math.PI / 2) * (i - 1) * 10, oy = Math.sin(angle + Math.PI / 2) * (i - 1) * 10;
      trait((c, k) => {
        const o = Math.min(1, k * 3.2);
        c.globalAlpha = 1 - k * k; c.strokeStyle = coul; c.shadowColor = coul; c.shadowBlur = 10; c.lineCap = 'round'; c.lineWidth = 3 * (1 - k * 0.5);
        const x0 = p.x + ox - Math.cos(angle) * 30, y0 = p.y + oy - Math.sin(angle) * 30;
        c.beginPath(); c.moveTo(x0, y0); c.lineTo(x0 + Math.cos(angle) * 60 * o, y0 + Math.sin(angle) * 60 * o); c.stroke();
      }, 300, i * 40);
    }
    eclats(p.x, p.y, 8, coul, { vitesse: 140, taille: 2.4, gravite: 420 });
  } else {
    trait((c, k) => {
      c.globalAlpha = Math.sin(k * Math.PI) * 0.9;
      c.strokeStyle = coul; c.shadowColor = coul; c.shadowBlur = 18; c.lineWidth = 3;
      c.beginPath(); c.arc(p.x, p.y, 70 * (1 - k) + 8, 0, Math.PI * 2); c.stroke();
    }, 360);
    setTimeout(() => eclats(p.x, p.y, 10, coul, { vitesse: 150, taille: 2.2, gravite: 0, vie: 0.6 }), 300);
  }
}

/** Un bouclier qui se pose sur l'ennemi : une coque hexagonale qui scintille */
function coqueEnnemi(el: Element | null) {
  const r = el?.getBoundingClientRect();
  if (!r) return;
  const cx = r.left + r.width / 2, cy = r.top + r.height * 0.45, t = Math.min(r.width, r.height) * 0.38;
  trait((c, k) => {
    c.globalAlpha = Math.sin(k * Math.PI) * 0.85;
    c.strokeStyle = '#CFE6FF'; c.shadowColor = '#7FB8FF'; c.shadowBlur = 20; c.lineWidth = 2.5;
    c.beginPath();
    for (let j = 0; j <= 6; j++) { const a = (j / 6) * Math.PI * 2 + k * 0.4; c[j ? 'lineTo' : 'moveTo'](cx + Math.cos(a) * t, cy + Math.sin(a) * t); }
    c.stroke();
  }, 620);
  note(880, 'sine', 0.3, 0.025, 0.8);
}

// ---------- Sons (synthétisés : aucun fichier à charger) ----------

let audio: AudioContext | null = null;
/** iOS ne laisse jouer le son que s'il a été ouvert pendant un toucher : à appeler dans le clic « Lancer la chaîne » */
export function debloquerSon(): void {
  if (!sonActif()) return;
  try { audio ??= new AudioContext(); if (audio.state === 'suspended') void audio.resume(); } catch { /* pas d'audio */ }
}
export const sonActif = () => { try { return localStorage.getItem('empreintes.son') !== '0'; } catch { return true; } };
export function basculerSon(): boolean {
  const on = !sonActif();
  try { localStorage.setItem('empreintes.son', on ? '1' : '0'); } catch { /* stockage indisponible */ }
  return on;
}
/** gamme pentatonique : chaque carte de la chaîne monte d'un cran */
const GAMME = [1, 9 / 8, 5 / 4, 3 / 2, 5 / 3, 2];
const BASE: Record<LigneeGeste, { f: number; forme: OscillatorType }> = {
  tech: { f: 523, forme: 'square' }, bio: { f: 330, forme: 'sawtooth' }, reso: { f: 440, forme: 'sine' }, neutre: { f: 392, forme: 'triangle' },
};

function note(f: number, forme: OscillatorType, duree: number, volume: number, glisse = 1) {
  if (!sonActif()) return;
  try {
    audio ??= new AudioContext();
    const t = audio.currentTime;
    const o = audio.createOscillator(), g = audio.createGain(), filtre = audio.createBiquadFilter();
    o.type = forme; o.frequency.setValueAtTime(f, t); o.frequency.exponentialRampToValueAtTime(f * glisse, t + duree);
    filtre.type = 'lowpass'; filtre.frequency.value = forme === 'sine' ? 6000 : 2200;
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(volume, t + 0.012); g.gain.exponentialRampToValueAtTime(0.0001, t + duree);
    o.connect(filtre); filtre.connect(g); g.connect(audio.destination);
    o.start(t); o.stop(t + duree + 0.02);
  } catch { /* pas d'audio : tant pis */ }
}
const sonCarte = (l: LigneeGeste, rang: number) => {
  const b = BASE[l];
  const f = b.f * GAMME[Math.min(rang, GAMME.length - 1)]! * hasard(0.985, 1.015);
  note(f, b.forme, 0.22, 0.05);
  if (l === 'reso') note(f * 1.5, 'sine', 0.35, 0.025);
};
const sonImpact = (fort: number) => note(hasard(90, 110), 'sine', 0.18 + fort * 0.04, 0.12 + fort * 0.03, 0.45);
const sonResonance = (suite: number) => [1, 5 / 4, 3 / 2, 2].slice(0, Math.min(4, suite - 1)).forEach((k, i) => setTimeout(() => note(392 * k, 'triangle', 0.5, 0.04), i * 40));

// ---------- Réactions de l'écran et de l'ennemi ----------

function secouer(el: Element | null, force: number) {
  if (!el || reduit || force <= 0) return;
  const a = 2 + force * 2.2;
  const pas = Array.from({ length: 6 }, (_, i) => ({ transform: `translate(${hasard(-a, a) * (1 - i / 6)}px, ${hasard(-a, a) * 0.6 * (1 - i / 6)}px)` }));
  (el as HTMLElement).animate([...pas, { transform: 'none' }], { duration: 180 + force * 40, easing: 'ease-out' });
}

/**
 * Le coup qui porte. Trois temps, comme dans les jeux de combat :
 *  1. l'arrêt sur image (« hit stop ») : la cible s'écrase sous le choc, blanchie, et reste figée un instant ;
 *  2. le recul, dans le sens du coup ;
 *  3. le retour, qui dépasse un peu avant de se poser : c'est ce dépassement qui donne du poids.
 */
function touche(el: Element | null, couleur: string, force: number) {
  if (!el) return;
  const flash = { filter: `brightness(${1.9 + force * 0.2}) saturate(.6) drop-shadow(0 0 12px ${couleur})` };
  if (reduit) { (el as HTMLElement).animate([flash, { filter: 'none' }], { duration: 260, easing: 'ease-out' }); return; }
  const fige = 50 + force * 14; // l'arrêt grandit avec la puissance du coup
  const duree = fige + 300 + force * 30;
  const k = fige / duree;
  const recul = 4 + force * 2.2, dx = recul * hasard(-0.6, 0.6), tourne = hasard(-2.5, 2.5);
  const ecrase = `scale(${1 + 0.03 * force}, ${1 - 0.025 * force})`;
  (el as HTMLElement).animate([
    { ...flash, transform: ecrase },
    { ...flash, transform: ecrase, offset: k },
    { filter: 'brightness(1.25)', transform: `translate(${dx}px, -${recul}px) rotate(${tourne}deg) scale(1.01)`, offset: k + (1 - k) * 0.3 },
    { filter: 'none', transform: `translate(${-dx * 0.25}px, ${recul * 0.2}px) rotate(${-tourne * 0.3}deg)`, offset: k + (1 - k) * 0.65 },
    { filter: 'none', transform: 'none' },
  ], { duration: duree, easing: 'cubic-bezier(.25,.8,.35,1)' });
}

const centre = (el: Element | null, dy = 0) => {
  const r = el?.getBoundingClientRect();
  return r ? new DOMPoint(r.left + r.width / 2, r.top + r.height * (0.5 + dy)) : null;
};

/**
 * Joue l'effet d'un événement, juste après que l'écran l'a affiché.
 * Renvoie un temps de pause en plus (ms), pour les grands moments.
 */
export function impact(ev: Evenement, racine: HTMLElement): number {
  // on secoue l'écran de combat, pas la page : secouer la page déplacerait les éléments fixes (boutons du bas)
  const ecran = racine.querySelector('.ecran-combat');
  const ennemi = racine.querySelector('.scene-ennemi .ennemi-art');
  const scene = racine.querySelector('.scene-ennemi');
  const pEnnemi = centre(ennemi ?? scene, -0.08);
  switch (ev.kind) {
    case 'ennemi-agit': {
      // dans un groupe, l'ennemi qui agit s'avance un instant
      const v = racine.querySelector(`.vignette-ennemi[data-id="${ev.rang}"]`);
      if (v) { v.classList.remove('agit'); void (v as HTMLElement).offsetWidth; v.classList.add('agit'); }
      return 120;
    }
    case 'phase': {
      // le gardien change de phase : un éclair, la scène tremble, une note grave qui monte
      if (ennemi && !reduit) (ennemi as HTMLElement).animate([{ filter: 'none' }, { filter: `brightness(2.2) drop-shadow(0 0 30px ${DANGER})`, transform: 'scale(1.05)' }, { filter: 'none', transform: 'none' }], { duration: 700, easing: 'ease-out' });
      secouer(ecran, 3);
      voileRouge(0.25);
      note(80, 'sawtooth', 0.8, 0.07, 2);
      return 500;
    }
    case 'renfort': {
      // un ennemi surgit : sa vignette apparaît dans une gerbe de poussière
      const v = racine.querySelector(`.vignette-ennemi[data-id="${ev.rang}"]`);
      const p = centre(v);
      if (p) eclats(p.x, p.y, 18, '#c9b8a0', { vitesse: 120, gravite: 120, taille: 2.4, vie: 0.8 });
      if (v && !reduit) (v as HTMLElement).animate([{ opacity: 0, transform: 'translateY(-14px) scale(.6)' }, { opacity: 1, transform: 'none' }], { duration: 420, easing: 'cubic-bezier(.2,.8,.3,1.3)' });
      note(180, 'triangle', 0.3, 0.05, 1.4);
      return 250;
    }
    case 'cible': {
      // le visé est tombé : le suivant entre en scène
      if (ennemi && !reduit) (ennemi as HTMLElement).animate([{ opacity: 0, transform: 'scale(1.06)' }, { opacity: 1, transform: 'none' }], { duration: 320, easing: 'ease-out' });
      return 80;
    }
    case 'carte': {
      derniere = { lignee: ev.lignee, rang: ev.rang, total: ev.total, suite: ev.suite, type: ev.type, ...(ev.effet ? { effet: ev.effet } : {}) };
      sonCarte(ev.lignee, ev.rang);
      // la carte qui part : celle de la chaîne à cette place (une carte lourde prend deux places, d'où l'élément réel)
      const carte = racine.querySelectorAll('.zone-chaine .rail > :not(.place-vide)')[ev.rang];
      const de = centre(carte ?? racine.querySelector('.zone-chaine'), -0.1);
      if (ev.type === 'atk' && de && pEnnemi) {
        if (ev.effet === 'percant') lance(de, pEnnemi, TEINTE[ev.lignee], ev.rang);
        else if (ev.lignee === 'tech') arc(de, pEnnemi, TEINTE.tech, ev.rang);
        else comete(de, pEnnemi, TEINTE[ev.lignee]);
      }
      const esc = racine.querySelector('.escouade-combat')?.getBoundingClientRect();
      if (ev.type === 'bouclier' && esc) { if (ev.effet === 'rempart') remparts(esc); else bouclierSur(esc); }
      if (ev.type === 'soin' && ev.effet === 'vague' && esc) vague(esc);
      if (ev.effet === 'flux') versFlux(de, centre(racine.querySelector('.flux .segments')));
      return 0;
    }
    case 'degats': {
      if (ev.cible === 'ennemi') {
        const d = derniere ?? { lignee: 'neutre' as LigneeGeste, rang: 0, total: 1, suite: 0 };
        // l'intensité monte avec la place dans la chaîne, la Résonance, et la taille du coup
        const force = Math.min(5, d.rang + (d.suite >= 3 ? 1 : 0) + (ev.net >= 25 ? 1 : 0));
        const couleur = TEINTE[d.lignee];
        if (!ev.net) { if (pEnnemi) eclats(pEnnemi.x, pEnnemi.y, 6, '#9aa4b2', { vitesse: 200, taille: 2, trainee: true }); note(1400, 'triangle', 0.08, 0.03); return 0; }
        if (pEnnemi) {
          // l'éclair blanc de l'impact, plus large à chaque carte de la chaîne
          const rayon = 34 + force * 14;
          const etoile = pret('impact');
          if (etoile) {
            const angle = hasard(0, Math.PI * 2);
            trait((c, k) => {
              const pop = k < 0.25 ? 0.55 + (k / 0.25) * 0.6 : 1.15 - (k - 0.25) * 0.25;
              c.globalAlpha = k < 0.3 ? 1 : 1 - (k - 0.3) / 0.7;
              c.save(); sprite(c, etoile, pEnnemi.x, pEnnemi.y, rayon * 2.2 * pop, angle + k * 0.3); c.restore();
            }, 260);
          } else trait((c, k) => {
            const g = c.createRadialGradient(pEnnemi.x, pEnnemi.y, 0, pEnnemi.x, pEnnemi.y, rayon * (0.6 + k));
            g.addColorStop(0, `rgba(255,255,255,${0.9 * (1 - k)})`); g.addColorStop(0.35, couleur); g.addColorStop(1, 'transparent');
            c.globalAlpha = 1 - k; c.fillStyle = g; c.beginPath(); c.arc(pEnnemi.x, pEnnemi.y, rayon * (0.6 + k), 0, Math.PI * 2); c.fill();
          }, 200);
          if (derniere?.effet === 'crescendo') crescendo(pEnnemi, d.rang);
          if (d.lignee === 'bio') griffes(pEnnemi, couleur, force);
          else if (d.lignee === 'reso') ondes(pEnnemi, couleur, force);
          eclats(pEnnemi.x, pEnnemi.y, 10 + force * 6, couleur, { vitesse: 420 + force * 60, taille: 2.2, trainee: true, gravite: 160 });
          verre(pEnnemi.x, pEnnemi.y, 3 + force, '#DDEBFF', force);
          if (!reduit) ondeDeChoc(pEnnemi.x, pEnnemi.y, couleur, force);
        }
        touche(ennemi, couleur, force);
        secouer(ecran, force - 1);
        sonImpact(force);
        vibrer(8 + force * 6);
        // l'arrêt sur image retient aussi la suite de la chaîne : le coup suivant attend que celui-ci ait « porté »
        return force >= 2 ? 20 + force * 14 : 0;
      }
      const el = [...racine.querySelectorAll('.combattant')].find((x) => x.getAttribute('data-porteur') === ev.cible);
      const p = centre(el ?? null);
      if (p && ev.net) {
        // d'où vient le coup : la vignette de l'ennemi qui agit (groupe), sinon l'ennemi de la scène ; sa lignée choisit le geste
        const src = (ev.rang !== undefined ? racine.querySelector(`.vignette-ennemi[data-id="${ev.rang}"]:not(.visee)`) : null) ?? ennemi ?? scene;
        const porteuse = src?.closest('.vignette-ennemi') ?? scene;
        const lignee = (['tech', 'bio', 'reso'] as const).find((l) => porteuse?.classList.contains(`l-${l}`)) ?? 'neutre';
        coupEnnemi(centre(src, -0.05), p, lignee);
      }
      if (el) { touche(el, DANGER, 1); secouer(el, 2); }
      if (ev.net) {
        // ce qu'encaisse l'escouade : un voile rouge sur les bords, proportionné au coup (gardé même avec « réduire les animations »),
        // et les cartes qui frémissent ; l'écran ne tremble que pour les gros coups
        const pvMax = Number(el?.getAttribute('data-pvmax')) || 40;
        const part = Math.min(1, ev.net / pvMax);
        voileRouge(0.1 + part * 0.3);
        if (!reduit) {
          racine.querySelectorAll('.zone-main .geste, .zone-chaine .geste').forEach((c, i) => {
            const a = 1.5 + part * 4;
            (c as HTMLElement).animate([{ transform: 'none' }, { transform: `translate(${hasard(-a, a)}px, ${a * 0.6}px) rotate(${hasard(-1.2, 1.2)}deg)` }, { transform: 'none' }],
              { duration: 220, delay: i * 18, easing: 'ease-out' });
          });
          if (part >= 0.3) secouer(ecran, 2);
        }
        note(hasard(70, 80), 'sine', 0.22, 0.14, 0.5);
        vibrer(part >= 0.3 ? [30, 40, 25] : 18);
      }
      return 0;
    }
    case 'resonance': {
      sonResonance(ev.suite);
      const zone = racine.querySelector('.zone-chaine');
      if (zone) (zone as HTMLElement).animate([{ filter: 'brightness(1.9)', boxShadow: '0 0 40px rgba(216,180,101,.8)' }, { filter: 'none', boxShadow: 'none' }], { duration: 520, easing: 'ease-out' });
      // la salle derrière l'interface s'éclaire elle aussi, d'autant plus que la suite est longue
      racine.querySelector('.fond-lieu .fl-lueur')?.animate([{ opacity: 0 }, { opacity: Math.min(1, 0.45 + (ev.suite - 3) * 0.28), offset: 0.18 }, { opacity: 0 }],
        { duration: 900 + ev.suite * 120, easing: 'ease-out' });
      vibrer(ev.suite >= 5 ? [15, 30, 15, 30, 50] : 12);
      if (ev.suite >= 5) {
        // la grande suite : un arrêt sur image, un éclair blanc, puis tout part
        if (!reduit) ecran?.animate([{ filter: 'brightness(2.2) saturate(.4)' }, { filter: 'none' }], { duration: 420, easing: 'ease-out' });
        const r = zone?.getBoundingClientRect();
        if (r) eclats(r.left + r.width / 2, r.top + r.height / 2, 40, '#F3D27A', { vitesse: 380, taille: 2.6, trainee: true, gravite: 0, vie: 0.6 });
        return 260;
      }
      return ev.suite >= 4 ? 80 : 0;
    }
    case 'soin': {
      if (!ev.v) return 0;
      if (ev.cible === 'ennemi') {
        // l'ennemi se répare : une lueur verte qui remonte sur lui
        if (pEnnemi) eclats(pEnnemi.x, pEnnemi.y + 30, 14, SOIN, { vitesse: 70, gravite: -140, taille: 2.6, vie: 1, angle: -Math.PI / 2, ouverture: 0.9 });
        if (ennemi) (ennemi as HTMLElement).animate([{ filter: `drop-shadow(0 0 0 ${SOIN})` }, { filter: `drop-shadow(0 0 18px ${SOIN})` }, { filter: 'none' }], { duration: 600 });
        note(520, 'sine', 0.35, 0.03, 1.25);
        return 0;
      }
      const el = [...racine.querySelectorAll('.combattant')].find((x) => x.getAttribute('data-porteur') === ev.cible);
      const p = centre(el ?? null);
      if (!p) return 0;
      if (derniere?.type === 'atk' && pEnnemi) {
        // Siphon : la vie arrachée à l'ennemi file jusqu'au Porteur, en un filet de particules
        const de = pEnnemi;
        for (let i = 0; i < 6; i++) {
          trait((c, k) => {
            const t = Math.min(1, k * 1.2);
            const cx = (de.x + p.x) / 2 + (i - 2.5) * 12, cy = Math.min(de.y, p.y) - 40;
            const x = (1 - t) * (1 - t) * de.x + 2 * (1 - t) * t * cx + t * t * p.x;
            const y = (1 - t) * (1 - t) * de.y + 2 * (1 - t) * t * cy + t * t * p.y;
            const g = c.createRadialGradient(x, y, 0, x, y, 7);
            g.addColorStop(0, '#fff'); g.addColorStop(0.4, SOIN); g.addColorStop(1, 'transparent');
            c.globalAlpha = 1 - k * 0.5; c.fillStyle = g; c.beginPath(); c.arc(x, y, 7, 0, Math.PI * 2); c.fill();
          }, 420, i * 45);
        }
        setTimeout(() => eclats(p.x, p.y, 8, SOIN, { vitesse: 70, gravite: -120, taille: 2.4, vie: 0.8 }), 380);
      } else {
        eclats(p.x, p.y, 8, SOIN, { vitesse: 60, gravite: -120, taille: 2.4, vie: 0.9 });
      }
      if (el) (el as HTMLElement).animate([{ filter: `brightness(1.4) drop-shadow(0 0 10px ${SOIN})` }, { filter: 'none' }], { duration: 500 });
      note(660 * hasard(0.98, 1.02), 'sine', 0.3, 0.03, 1.12);
      return 0;
    }
    case 'effet': {
      if (ev.texte === 'Fissure' && pEnnemi) fissures(pEnnemi);
      else if (ev.texte === 'Désarmé') desarme(racine.querySelector('.scene-ennemi .intention'));
      else if (ev.texte === 'Élan') { const r = racine.querySelector('.zone-chaine')?.getBoundingClientRect(); if (r) elan(r); }
      else if (ev.texte === 'Dissonance' && !reduit) racine.querySelector('.zone-chaine')?.animate([{ filter: 'none' }, { filter: 'hue-rotate(70deg) blur(1px)', transform: 'translateX(3px)' }, { filter: 'hue-rotate(-50deg)', transform: 'translateX(-3px)' }, { filter: 'none', transform: 'none' }], { duration: 480 });
      return 0;
    }
    case 'bouclier': {
      if (ev.cible === 'ennemi') {
        const src = (ev.rang !== undefined ? racine.querySelector(`.vignette-ennemi[data-id="${ev.rang}"]:not(.visee) img`) : null) ?? ennemi ?? scene;
        coqueEnnemi(src);
      }
      return 0;
    }
    case 'echo': {
      const r = racine.querySelector('.escouade-combat')?.getBoundingClientRect();
      if (r) { bouclierSur(r); eclats(r.left + r.width / 2, r.top, 14, '#F3D27A', { vitesse: 120, gravite: -40, taille: 2.2 }); }
      note(660, 'triangle', 0.4, 0.04);
      return 0;
    }
    case 'boost': {
      const qui = (ev.rang !== undefined ? racine.querySelector(`.vignette-ennemi[data-id="${ev.rang}"]:not(.visee) img`) : null) ?? ennemi;
      if (qui) (qui as HTMLElement).animate([{ filter: `drop-shadow(0 0 0 ${DANGER})` }, { filter: `drop-shadow(0 0 24px ${DANGER}) brightness(1.2)` }, { filter: 'none' }], { duration: 600 });
      note(150, 'sawtooth', 0.4, 0.04, 1.6);
      return 0;
    }
    case 'fin': {
      derniere = null;
      if (ev.issue === 'victoire' && pEnnemi) {
        // l'ennemi se dissout en poussière lumineuse, de la couleur de sa lignée
        const lignee = (['tech', 'bio', 'reso'] as const).find((l) => scene?.classList.contains(`l-${l}`)) ?? 'neutre';
        const r = (ennemi ?? scene)!.getBoundingClientRect();
        for (let i = 0; i < 6; i++) setTimeout(() => eclats(hasard(r.left + r.width * 0.2, r.right - r.width * 0.2), hasard(r.top + r.height * 0.2, r.bottom - r.height * 0.3), 14, TEINTE[lignee], { vitesse: 70, gravite: -90, taille: 2.6, vie: 1.4, ouverture: Math.PI }), i * 60);
        if (ennemi && !reduit) (ennemi as HTMLElement).animate([{ opacity: 1, filter: 'none' }, { opacity: 0, filter: 'blur(6px) brightness(2)', transform: 'translateY(-10px) scale(1.04)' }], { duration: 900, fill: 'forwards', easing: 'ease-in' });
        [1, 5 / 4, 3 / 2, 2].forEach((k, i) => setTimeout(() => note(523 * k, 'triangle', 0.6, 0.035), i * 90));
        vibrer([20, 60, 20, 60, 40]);
        return 700;
      }
      if (ev.issue === 'defaite') note(110, 'sawtooth', 0.9, 0.05, 0.5);
      return 0;
    }
    case 'a-terre': {
      const el = [...racine.querySelectorAll('.combattant')].find((x) => x.getAttribute('data-porteur') === ev.cible);
      const p = centre(el ?? null);
      if (p) eclats(p.x, p.y, 16, '#8a8f99', { vitesse: 90, gravite: 160, taille: 2.4, vie: 1 });
      if (el) (el as HTMLElement).animate([{ filter: 'brightness(1.6)' }, { filter: 'grayscale(1) brightness(.45)' }], { duration: 500, easing: 'ease-in' });
      voileRouge(0.35);
      note(62, 'sine', 0.7, 0.16, 0.6);
      vibrer([60, 50, 90]);
      return 400;
    }
    default:
      return 0;
  }
}
