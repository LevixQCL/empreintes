// « Toucher et poids » : ce qui fait passer l'écran de combat d'une page web à des objets qu'on manipule.
//  1. Les cartes glissent : l'écran se redessine à chaque action (innerHTML), alors on note où était chaque carte
//     avant, et on la fait voler de son ancienne place à la nouvelle (technique « FLIP »), avec un léger dépassement.
//     Une carte qui n'existait pas (pioche) arrive du bas, distribuée l'une après l'autre.
//  2. La carte saisie se soulève et s'incline sous le doigt.
//  3. Les animations en boucle (respiration de l'ennemi, reflets) ne repartent plus de zéro à chaque redessin :
//     elles se calent sur une horloge commune (--horloge), sinon elles « sautent » à chaque toucher.
//  4. La vibration du téléphone (Android ; iOS ne la permet pas dans un navigateur) accompagne les gros moments.
// L'option « réduire les animations » coupe le vol, l'inclinaison et la vibration.

type Positions = Map<string, DOMRect>;

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
  const m: Positions = new Map();
  if (racine.dataset.mode !== 'combat') return m;
  racine.querySelectorAll<HTMLElement>('.geste[data-uid]').forEach((el) => {
    const r = el.getBoundingClientRect();
    if (r.width) m.set(el.dataset.uid!, r);
  });
  return m;
}

/** juste après le redessin : chaque carte part de son ancienne place et rejoint la nouvelle */
export function glisser(racine: HTMLElement, avant: Positions): void {
  if (reduit || racine.dataset.mode !== 'combat' || !avant.size) return;
  let arrivee = 0;
  racine.querySelectorAll<HTMLElement>('.geste[data-uid]').forEach((el) => {
    const apres = el.getBoundingClientRect();
    if (!apres.width) return;
    const de = avant.get(el.dataset.uid!);
    if (!de) {
      // une carte neuve (pioche) : elle monte du bas de l'écran, tournée, et se pose
      const i = arrivee++;
      el.animate([
        { transform: `translate(${(innerWidth / 2 - apres.left - apres.width / 2) * 0.35}px, ${innerHeight - apres.top + 20}px) rotate(${i % 2 ? 9 : -9}deg) scale(.85)`, opacity: 0.4 },
        { transform: 'translateY(-6px) rotate(0) scale(1.04)', opacity: 1, offset: 0.78 },
        { transform: 'none', opacity: 1 },
      ], { duration: 420, delay: 40 + i * 55, easing: 'cubic-bezier(.2,.75,.3,1)', fill: 'backwards' });
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
    ], { duration: loin ? 360 : 240, easing: loin ? 'cubic-bezier(.25,.8,.35,1)' : 'cubic-bezier(.2,.9,.3,1.15)' });
    if (loin) vibrer(6);
  });
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
