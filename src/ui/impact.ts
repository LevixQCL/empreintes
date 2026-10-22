// Le « langage d'impact » du combat : ce qui se voit et s'entend quand une chaîne part.
// Tout est dessiné sur un calque posé par-dessus l'écran (le combat se redessine à chaque étape, le calque, lui, reste).
// Trois règles pour ne jamais lasser :
//  1. la lignée de la carte change l'effet (Augmentés : arc électrique ; Génés : griffures d'ambre ; Résonants : ondes) ;
//  2. la place dans la chaîne fait monter l'intensité (tremblement, particules, note plus aiguë), comme une phrase musicale ;
//  3. un peu de hasard (angles, positions, hauteur du son) : deux coups ne se ressemblent jamais tout à fait.
// L'option « réduire les animations » du téléphone coupe les tremblements et les particules.

import type { Evenement, LigneeGeste } from '../core/types';

const TEINTE: Record<LigneeGeste, string> = { tech: '#8FDCFF', bio: '#FFB44A', reso: '#B98CFF', neutre: '#EBD9A8' };
const SOIN = '#7CE3A0';
const BOUCLIER = '#E6F3FF';
const DANGER = '#FF6B5B';

interface Particule { x: number; y: number; vx: number; vy: number; vie: number; max: number; taille: number; couleur: string; gravite: number; trainee?: boolean }
interface Trait { dessiner: (c: CanvasRenderingContext2D, t: number) => void; debut: number; duree: number }

let canvas: HTMLCanvasElement | null = null;
let ctx: CanvasRenderingContext2D | null = null;
let particules: Particule[] = [];
let traits: Trait[] = [];
let boucle = 0;
let reduit = false;
/** la dernière carte jouée : son effet se déclenche à l'impact qui suit */
let derniere: { lignee: LigneeGeste; rang: number; total: number; suite: number } | null = null;

const hasard = (a: number, b: number) => a + Math.random() * (b - a);
const maintenant = () => performance.now();

export function initImpacts(mouvementReduit: boolean): void {
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
      p.vy += p.gravite * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      const a = Math.max(0, p.vie / p.max);
      c.globalAlpha = a;
      c.fillStyle = p.couleur;
      if (p.trainee) {
        c.strokeStyle = p.couleur;
        c.lineWidth = p.taille;
        c.beginPath(); c.moveTo(p.x, p.y); c.lineTo(p.x - p.vx * 0.04, p.y - p.vy * 0.04); c.stroke();
      } else {
        c.beginPath(); c.arc(p.x, p.y, p.taille * (0.5 + a / 2), 0, Math.PI * 2); c.fill();
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

function eclats(x: number, y: number, n: number, couleur: string, o: { vitesse?: number; gravite?: number; taille?: number; vie?: number; trainee?: boolean; angle?: number; ouverture?: number } = {}) {
  if (reduit) return;
  for (let i = 0; i < n; i++) {
    const a = (o.angle ?? 0) + hasard(-1, 1) * (o.ouverture ?? Math.PI);
    const v = hasard(0.3, 1) * (o.vitesse ?? 260);
    const vie = hasard(0.5, 1) * (o.vie ?? 0.7);
    particules.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, vie, max: vie, taille: hasard(0.6, 1.2) * (o.taille ?? 3), couleur, gravite: o.gravite ?? 300, trainee: o.trainee });
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

// ---------- Sons (synthétisés : aucun fichier à charger) ----------

let audio: AudioContext | null = null;
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

function touche(el: Element | null, couleur: string, force: number) {
  if (!el) return;
  const recul = reduit ? 0 : 4 + force * 2;
  (el as HTMLElement).animate([
    { filter: `brightness(${1.8 + force * 0.2}) drop-shadow(0 0 12px ${couleur})`, transform: `translate(${recul * hasard(-0.6, 0.6)}px, -${recul}px) scale(${1 + 0.02 * force}) rotate(${hasard(-2, 2)}deg)` },
    { filter: 'none', transform: 'none' },
  ], { duration: 260 + force * 30, easing: 'cubic-bezier(.2,.8,.3,1)' });
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
  const ennemi = racine.querySelector('.scene-ennemi .ennemi-art');
  const scene = racine.querySelector('.scene-ennemi');
  const pEnnemi = centre(ennemi ?? scene, -0.08);
  switch (ev.kind) {
    case 'carte': {
      derniere = { lignee: ev.lignee, rang: ev.rang, total: ev.total, suite: ev.suite };
      sonCarte(ev.lignee, ev.rang);
      const zone = racine.querySelector('.zone-chaine')?.getBoundingClientRect();
      const de = zone ? new DOMPoint(zone.left + (zone.width * (ev.rang + 0.5)) / Math.max(1, ev.total), zone.top + zone.height * 0.55) : null;
      if (ev.type === 'atk' && de && pEnnemi) {
        if (ev.lignee === 'tech') arc(de, pEnnemi, TEINTE.tech, ev.rang);
        else comete(de, pEnnemi, TEINTE[ev.lignee]);
      }
      if (ev.type === 'bouclier') { const r = racine.querySelector('.escouade-combat')?.getBoundingClientRect(); if (r) bouclierSur(r); }
      if (ev.type === 'soin') for (const el of racine.querySelectorAll('.combattant:not(.ko)')) { const p = centre(el); if (p) eclats(p.x, p.y, 7, SOIN, { vitesse: 60, gravite: -120, taille: 2.4, vie: 0.9 }); }
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
          trait((c, k) => {
            const g = c.createRadialGradient(pEnnemi.x, pEnnemi.y, 0, pEnnemi.x, pEnnemi.y, rayon * (0.6 + k));
            g.addColorStop(0, `rgba(255,255,255,${0.9 * (1 - k)})`); g.addColorStop(0.35, couleur); g.addColorStop(1, 'transparent');
            c.globalAlpha = 1 - k; c.fillStyle = g; c.beginPath(); c.arc(pEnnemi.x, pEnnemi.y, rayon * (0.6 + k), 0, Math.PI * 2); c.fill();
          }, 200);
          if (d.lignee === 'bio') griffes(pEnnemi, couleur, force);
          else if (d.lignee === 'reso') ondes(pEnnemi, couleur, force);
          eclats(pEnnemi.x, pEnnemi.y, 10 + force * 6, couleur, { vitesse: 260 + force * 40, taille: 2.4, trainee: true, gravite: 200 });
        }
        touche(ennemi, couleur, force);
        secouer(racine, force - 1);
        sonImpact(force);
        return force >= 4 ? 40 : 0;
      }
      const el = [...racine.querySelectorAll('.combattant')].find((x) => x.getAttribute('data-porteur') === ev.cible);
      const p = centre(el ?? null);
      if (p && ev.net) {
        trait((c, k) => {
          c.globalAlpha = 1 - k; c.strokeStyle = DANGER; c.shadowColor = DANGER; c.shadowBlur = 10; c.lineWidth = 3; c.lineCap = 'round';
          c.beginPath(); c.moveTo(p.x - 30, p.y - 12); c.lineTo(p.x - 30 + 60 * Math.min(1, k * 3), p.y - 12 + 24 * Math.min(1, k * 3)); c.stroke();
        }, 300);
        eclats(p.x, p.y, 8, DANGER, { vitesse: 160, taille: 2, trainee: true });
      }
      if (el) { touche(el, DANGER, 1); secouer(el, 2); }
      if (ev.net) note(hasard(70, 80), 'sine', 0.22, 0.14, 0.5);
      return 0;
    }
    case 'resonance': {
      sonResonance(ev.suite);
      const zone = racine.querySelector('.zone-chaine');
      if (zone) (zone as HTMLElement).animate([{ filter: 'brightness(1.9)', boxShadow: '0 0 40px rgba(216,180,101,.8)' }, { filter: 'none', boxShadow: 'none' }], { duration: 520, easing: 'ease-out' });
      if (ev.suite >= 5) {
        // la grande suite : un arrêt sur image, un éclair blanc, puis tout part
        racine.animate([{ filter: 'brightness(2.2) saturate(.4)' }, { filter: 'none' }], { duration: 420, easing: 'ease-out' });
        const r = zone?.getBoundingClientRect();
        if (r) eclats(r.left + r.width / 2, r.top + r.height / 2, 40, '#F3D27A', { vitesse: 380, taille: 2.6, trainee: true, gravite: 0, vie: 0.6 });
        return 260;
      }
      return ev.suite >= 4 ? 80 : 0;
    }
    case 'echo': {
      const r = racine.querySelector('.escouade-combat')?.getBoundingClientRect();
      if (r) { bouclierSur(r); eclats(r.left + r.width / 2, r.top, 14, '#F3D27A', { vitesse: 120, gravite: -40, taille: 2.2 }); }
      note(660, 'triangle', 0.4, 0.04);
      return 0;
    }
    case 'boost': {
      if (ennemi) (ennemi as HTMLElement).animate([{ filter: `drop-shadow(0 0 0 ${DANGER})` }, { filter: `drop-shadow(0 0 24px ${DANGER}) brightness(1.2)` }, { filter: 'none' }], { duration: 600 });
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
        return 700;
      }
      if (ev.issue === 'defaite') note(110, 'sawtooth', 0.9, 0.05, 0.5);
      return 0;
    }
    case 'a-terre': {
      const el = [...racine.querySelectorAll('.combattant')].find((x) => x.getAttribute('data-porteur') === ev.cible);
      const p = centre(el ?? null);
      if (p) eclats(p.x, p.y, 16, '#8a8f99', { vitesse: 90, gravite: 160, taille: 2.4, vie: 1 });
      return 0;
    }
    default:
      return 0;
  }
}
