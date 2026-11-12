// Les chiffres qui défilent (12 novembre 2026) : les PV d'un Porteur, ceux de l'ennemi et le bouclier ne sautent plus
// d'une valeur à l'autre, ils y vont en comptant (comme la jauge, qui laisse sa traînée).
// L'écran écrit toujours la valeur finale ; ici, on se souvient de ce que chaque compteur montrait et on l'y amène.
// Un compteur se reconnaît à `data-compte` (son nom) et `data-v` (sa valeur).

import { AMPLE } from './rythme';

const montres = new Map<string, number>();
const courses = new Map<string, { de: number; a: number; debut: number }>();
let boucle = 0;
let scene: HTMLElement | null = null;

const ecrire = (el: Element, v: number) => { const t = String(Math.round(v)); if (el.textContent !== t) el.textContent = t; };

function pas() {
  boucle = 0;
  const t = performance.now();
  for (const [cle, c] of courses) {
    const k = Math.min(1, (t - c.debut) / AMPLE);
    const v = c.de + (c.a - c.de) * (1 - Math.pow(1 - k, 3));
    montres.set(cle, k >= 1 ? c.a : v);
    const el = scene?.querySelector(`[data-compte="${cle}"]`);
    if (el) ecrire(el, k >= 1 ? c.a : v);
    if (k >= 1) courses.delete(cle);
  }
  if (courses.size) boucle = requestAnimationFrame(pas);
}

/**
 * À appeler après chaque rendu. `neuf` : l'écran vient d'être créé (on entre en combat), les compteurs prennent
 * leur valeur sans compter. « Réduire les animations » : jamais de défilement.
 */
export function defiler(racine: HTMLElement, neuf: boolean, reduit: boolean): void {
  scene = racine;
  const vus = new Set<string>();
  racine.querySelectorAll<HTMLElement>('[data-compte]').forEach((el) => {
    const cle = el.dataset.compte!, v = Number(el.dataset.v);
    vus.add(cle);
    const montre = montres.get(cle);
    if (montre === undefined || neuf || reduit || !Number.isFinite(v)) { montres.set(cle, v); courses.delete(cle); return; }
    const c = courses.get(cle);
    if (c ? c.a !== v : montre !== v) courses.set(cle, { de: montre, a: v, debut: performance.now() });
    // l'écran vient d'écrire la valeur finale : on remet celle qui était montrée, la course l'emmènera
    if (courses.has(cle)) ecrire(el, montres.get(cle)!);
  });
  for (const cle of [...montres.keys()]) if (!vus.has(cle)) { montres.delete(cle); courses.delete(cle); }
  if (courses.size && !boucle) boucle = requestAnimationFrame(pas);
}
