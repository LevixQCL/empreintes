// Le lecteur de l'intro (main.ts) :
// mise à jour sans tout reconstruire, préchargement des illustrations, compteur d'années.

import { imagesPlan } from './intro';

/**
 * Mise à jour de l'intro sans tout reconstruire :
 * - même illustration : on la garde, pour que le mouvement de caméra (ou la vidéo) continue ;
 * - nouvelle illustration : l'ancienne reste par-dessus et s'efface (fondu enchaîné) ;
 * - même plan : les particules continuent aussi.
 */
export function majIntro(racine: HTMLElement, h: string, reduit: boolean): boolean {
  const ancien = racine.querySelector<HTMLElement>('.intro');
  if (!ancien) return false;
  const t = document.createElement('template');
  t.innerHTML = h;
  const neuf = t.content.querySelector<HTMLElement>('.intro');
  if (!neuf) return false;
  const memePlan = ancien.dataset.plan === neuf.dataset.plan;
  const fA = ancien.querySelector<HTMLElement>(':scope > .intro-fond:not(.sortant)');
  const fN = neuf.querySelector<HTMLElement>(':scope > .intro-fond');
  const memeFond = !!fA && !!fN && fA.dataset.fond === fN.dataset.fond;
  const garder = (e: Element) => e.classList.contains('intro-fond') || (memePlan && e.classList.contains('intro-particules'));
  for (const e of [...ancien.children]) if (!garder(e)) e.remove();
  if (!memeFond) {
    if (fA) { fA.classList.add('sortant'); window.setTimeout(() => fA.remove(), reduit ? 0 : 1200); }
    if (fN) ancien.insertBefore(fN, ancien.firstChild);
  }
  for (const e of [...neuf.children]) {
    if (e.classList.contains('intro-fond')) continue;
    if (memePlan && e.classList.contains('intro-particules') && ancien.querySelector(':scope > .intro-particules')) continue;
    if (!memePlan && e.classList.contains('intro-scene')) e.classList.add('scene-entre');
    ancien.append(e);
  }
  ancien.className = neuf.className;
  ancien.dataset.plan = neuf.dataset.plan ?? '';
  ancien.dataset.k = neuf.dataset.k ?? '';
  ancien.setAttribute('style', neuf.getAttribute('style') ?? '');
  return true;
}

const precharges = new Set<string>();
/** Charge à l'avance les illustrations du plan i */
export function precharger(i: number) {
  for (const src of imagesPlan(i)) {
    if (precharges.has(src)) continue;
    precharges.add(src);
    const im = new Image();
    im.src = src;
  }
}

/** Compteur d'années : il défile à l'arrivée sur un plan, puis reste sur l'année finale */
export function animerCompteur(racine: HTMLElement, lignesVues: number, reduit: boolean) {
  const el = racine.querySelector<HTMLElement>('.compteur[data-de]');
  if (!el) return;
  const de = Number(el.dataset.de), a = Number(el.dataset.a);
  if (lignesVues > 1 || reduit) { el.textContent = String(a); return; }
  const debut = performance.now() + 500, duree = 2200;
  const pas = (now: number) => {
    if (!el.isConnected) return;
    const x = Math.min(1, Math.max(0, (now - debut) / duree));
    el.textContent = String(Math.round(de + (a - de) * (1 - (1 - x) ** 3)));
    if (x < 1) requestAnimationFrame(pas);
  };
  requestAnimationFrame(pas);
}
