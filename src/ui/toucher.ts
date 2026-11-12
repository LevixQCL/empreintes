// « Toucher et poids » : ce qui fait passer l'écran de combat d'une page web à des objets qu'on manipule.
//  1. Les cartes glissent : l'écran se redessine à chaque action (innerHTML), alors on note où était chaque carte
//     avant, et on la fait voler de son ancienne place à la nouvelle (technique « FLIP »), avec un léger dépassement.
//     Une carte qui n'existait pas (pioche) arrive du bas, distribuée l'une après l'autre.
//  2. La carte saisie se soulève et s'incline sous le doigt.
//  3. Les animations en boucle (respiration de l'ennemi, reflets) ne repartent plus de zéro à chaque redessin :
//     elles se calent sur une horloge commune (--horloge), sinon elles « sautent » à chaque toucher.
//  4. La vibration du téléphone (Android ; iOS ne la permet pas dans un navigateur) accompagne les gros moments.
// L'option « réduire les animations » coupe le vol, l'inclinaison et la vibration.

import { AMPLE, ENTREE, NET, RESSORT, SORTIE } from './rythme';

/** où était chaque carte avant le redessin (et l'élément lui-même : s'il disparaît, c'est lui qui part à la défausse) */
interface Positions { cartes: Map<string, { r: DOMRect; el: HTMLElement }>; combat: boolean }

let reduit = false;
export function initToucher(racine: HTMLElement, mouvementReduit: boolean): void {
  reduit = mouvementReduit;
  brancherInclinaison(racine);
}

/** cale toutes les boucles CSS sur la même horloge, quel que soit le moment où l'élément a été recréé */
export function horloge(racine: HTMLElement): void {
  racine.style.setProperty('--horloge', `${-Math.round(performance.now() % 600000)}ms`);
}

/** à appeler juste avant de redessiner : où est chaque carte ? */
export function noter(racine: HTMLElement): Positions {
  const cartes: Positions['cartes'] = new Map();
  const combat = !!racine.querySelector(':scope > .ecran-combat');
  if (racine.dataset.mode !== 'combat') return { cartes, combat };
  racine.querySelectorAll<HTMLElement>('.geste[data-uid]').forEach((el) => {
    const r = el.getBoundingClientRect();
    if (r.width) cartes.set(el.dataset.uid!, { r, el });
  });
  return { cartes, combat };
}

/** le centre des piles (pioche et défausse), d'où viennent et où repartent les cartes */
function piles(racine: HTMLElement): { x: number; y: number; el: HTMLElement } | null {
  const el = racine.querySelector<HTMLElement>('.piles');
  const r = el?.getBoundingClientRect();
  return el && r && r.width ? { x: r.left + r.width / 2, y: r.top + r.height / 2, el } : null;
}

/**
 * Une carte qui quitte la table (chaîne jouée, main repiochée) : elle ne disparaît plus d'un coup, elle file vers la défausse.
 * L'ancien élément, sorti de l'écran par le redessin, sert de copie volante.
 */
function partir(el: HTMLElement, r: DOMRect, vers: { x: number; y: number; el: HTMLElement } | null, i: number) {
  const w = el.offsetWidth || r.width, h = el.offsetHeight || r.height;
  el.classList.remove('en-jeu', 'saisie');
  el.removeAttribute('data-action');
  el.querySelectorAll('[data-action]').forEach((x) => x.removeAttribute('data-action'));
  const cadre = document.createElement('div');
  cadre.className = 'carte-volante sortante';
  cadre.setAttribute('aria-hidden', 'true');
  cadre.style.cssText = `left:${r.left + r.width / 2 - w / 2}px;top:${r.top + r.height / 2 - h / 2}px;width:${w}px;height:${h}px`;
  cadre.appendChild(el);
  document.body.appendChild(cadre);
  const base = r.width / (w || 1);
  const dx = vers ? vers.x - (r.left + r.width / 2) : 0, dy = vers ? vers.y - (r.top + r.height / 2) : 40;
  const sens = dx >= 0 ? 1 : -1;
  const a = cadre.animate([
    { transform: `scale(${base})`, opacity: 1, easing: ENTREE },
    { transform: `translate(${dx * 0.08}px, -12px) rotate(${-sens * 5}deg) scale(${base * 1.04})`, opacity: 1, offset: 0.28, easing: SORTIE },
    { transform: `translate(${dx}px, ${dy}px) rotate(${sens * 16}deg) scale(${base * 0.22})`, opacity: 0.15 },
  ], { duration: AMPLE, delay: i * 55, fill: 'both' });
  const fin = () => {
    cadre.remove();
    // la pile accuse réception : un petit éclat, une fois par carte
    if (vers?.el.isConnected) vers.el.animate([{ filter: 'brightness(1.7)' }, { filter: 'none' }], { duration: NET, easing: ENTREE });
  };
  a.finished.then(fin, fin);
}

/** juste après le redessin : chaque carte part de son ancienne place et rejoint la nouvelle */
export function glisser(racine: HTMLElement, avant: Positions): void {
  if (reduit || racine.dataset.mode !== 'combat' || !racine.querySelector(':scope > .ecran-combat')) return;
  const pile = piles(racine);
  const presentes = new Set<string>();
  let arrivee = 0;
  racine.querySelectorAll<HTMLElement>('.geste[data-uid]').forEach((el) => {
    presentes.add(el.dataset.uid!);
    const apres = el.getBoundingClientRect();
    if (!apres.width) return;
    const de = avant.cartes.get(el.dataset.uid!)?.r;
    if (!de) {
      // la chaîne affichée à l'ouverture de l'écran (combat repris en route) ne se redistribue pas
      if (!avant.combat && !el.closest('.zone-main')) return;
      // une carte neuve (pioche) : elle sort de la pile, tournée, et vient se poser à sa place
      const i = arrivee++;
      const cx = apres.left + apres.width / 2, cy = apres.top + apres.height / 2;
      const [ox, oy] = pile ? [pile.x - cx, pile.y - cy] : [(innerWidth / 2 - cx) * 0.35, innerHeight - apres.top + 20];
      el.animate([
        { transform: `translate(${ox}px, ${oy}px) rotate(${i % 2 ? 12 : -12}deg) scale(${pile ? 0.25 : 0.85})`, opacity: 0.2 },
        { transform: 'translateY(-6px) rotate(0) scale(1.04)', opacity: 1, offset: 0.78 },
        { transform: 'none', opacity: 1 },
      ], { duration: AMPLE, delay: 40 + i * 55, easing: ENTREE, fill: 'backwards' });
      return;
    }
    const dx = de.left - apres.left, dy = de.top - apres.top;
    if (Math.abs(dx) < 3 && Math.abs(dy) < 3) return;
    const sx = de.width / apres.width, sy = de.height / apres.height;
    const loin = Math.hypot(dx, dy) > 60;
    // un grand saut (main → chaîne) décrit un petit arc et prend de la hauteur ; un petit décalage glisse simplement
    el.animate(loin ? [
      { transform: `translate(${dx}px, ${dy}px) scale(${sx}, ${sy})`, zIndex: 5 },
      { transform: `translate(${dx * 0.45}px, ${dy * 0.45 - 18}px) scale(1.12) rotate(${dx > 0 ? -4 : 4}deg)`, filter: 'brightness(1.15) drop-shadow(0 14px 14px rgba(0,0,0,.55))', offset: 0.45, zIndex: 5 },
      { transform: 'translate(0, 2px) scale(.97, 1.03)', offset: 0.82, zIndex: 5 },
      { transform: 'none', zIndex: 5 },
    ] : [
      { transform: `translate(${dx}px, ${dy}px) scale(${sx}, ${sy})` },
      { transform: 'none' },
    ], { duration: loin ? (NET + AMPLE) / 2 : NET, easing: loin ? ENTREE : RESSORT });
    if (loin) vibrer(6);
  });
  // les cartes qui ne sont plus là : jouées ou repiochées, elles filent vers la défausse l'une après l'autre
  if (!avant.combat) return;
  let depart = 0;
  for (const [uid, { r, el }] of avant.cartes) if (!presentes.has(uid) && !el.isConnected) partir(el, r, pile, depart++);
}

/** la carte saisie suit le doigt : elle se soulève et s'incline (sans gêner le clic, l'appui long ni le défilement) */
function brancherInclinaison(racine: HTMLElement) {
  let carte: HTMLElement | null = null;
  const incliner = (ev: PointerEvent) => {
    if (!carte) return;
    const r = carte.getBoundingClientRect();
    const x = (ev.clientX - r.left) / r.width - 0.5, y = (ev.clientY - r.top) / r.height - 0.5;
    carte.style.setProperty('--ry', `${(x * 18).toFixed(1)}deg`);
    carte.style.setProperty('--rx', `${(-y * 14).toFixed(1)}deg`);
    carte.style.setProperty('--lx', `${Math.round((x + 0.5) * 100)}%`);
    carte.style.setProperty('--ly', `${Math.round((y + 0.5) * 100)}%`);
  };
  const lacher = () => { if (carte) { carte.classList.remove('saisie'); carte = null; } };
  racine.addEventListener('pointerdown', (ev) => {
    if (reduit || racine.dataset.mode !== 'combat') return;
    const el = (ev.target as HTMLElement).closest<HTMLElement>('.geste');
    if (!el || (el as HTMLButtonElement).disabled) return;
    carte = el;
    el.classList.add('saisie');
    incliner(ev);
  });
  racine.addEventListener('pointermove', incliner);
  for (const t of ['pointerup', 'pointercancel', 'pointerleave'] as const) racine.addEventListener(t, lacher);
}

export function vibrer(motif: number | number[]): void {
  if (reduit) return;
  try { navigator.vibrate?.(motif); } catch { /* pas de vibreur */ }
}
