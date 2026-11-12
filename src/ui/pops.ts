// Les chiffres du combat (12 novembre 2026) : dégâts, « bloqué », soins, bouclier, Flux, Écho.
// Avant, chaque chiffre était écrit dans l'écran lui-même : il naissait toujours au même point (« Fêlure −7 » sous l'éclat
// d'impact, puis sous le « −11 »), sa disparition redessinait tout l'écran, et la ligne sous l'escouade n'existait que le
// temps d'un « +13 » : tout le haut de l'écran remontait puis redescendait.
// Ils vivent maintenant sur un calque à part, posé par-dessus l'écran :
//  - les coups se rangent autour du point d'impact, jamais l'un sur l'autre ;
//  - ce qui n'est pas un coup (Fêlure, Fissure, Troublé…) s'écrit plus petit, sur une ligne à part, au-dessus ;
//  - le bouclier s'écrit sur l'écu du portrait, le Flux sur sa jauge.

export type Voie = 'coup' | 'info';
interface Pose { el: HTMLElement; cle: string; place: number }

let calque: HTMLElement | null = null;
const poses: Pose[] = [];
const DUREE = 1000;

/** les places autour du point d'impact de l'ennemi, en pixels d'un téléphone : au centre, puis en quinconce vers le haut */
const AUTOUR: [number, number][] = [[0, 0], [-58, -30], [58, -36], [-34, -66], [38, -72], [0, -98]];

function ancre(racine: HTMLElement, cible: string, voie: Voie, ou?: string): { x: number; y: number; genre: 'ennemi' | 'vignette' | 'porteur' | 'escouade'; k: number } | null {
  const rect = (sel: string) => { const r = racine.querySelector(sel)?.getBoundingClientRect(); return r && r.width ? r : null; };
  const precis = ou ? rect(ou) : null;
  if (cible === 'ennemi') {
    const r = rect('.scene-ennemi .ennemi-art') ?? rect('.scene-ennemi');
    if (!r) return null;
    // la même échelle que les effets : 1 sur téléphone, plus sur un grand écran
    const k = Math.min(2.4, Math.max(1, Math.sqrt(r.width * r.height) / 300));
    return { x: r.left + r.width / 2, y: r.top + r.height * (voie === 'coup' ? 0.42 : 0.2), genre: 'ennemi', k };
  }
  if (cible.startsWith('ennemi-')) {
    const r = rect(`.vignette-ennemi[data-id="${cible.slice(7)}"]`);
    return r ? { x: r.left + r.width / 2, y: r.top + r.height * 0.3, genre: 'vignette', k: 1 } : null;
  }
  if (cible === 'escouade') {
    const r = precis ?? rect('.escouade-combat');
    return r ? { x: r.left + r.width / 2, y: precis ? r.top - 22 : r.top + r.height * 0.3, genre: 'escouade', k: 1 } : null;
  }
  const r = rect(`.combattant[data-porteur="${cible}"]`);
  return r ? { x: r.left + r.width / 2, y: r.top + r.height * 0.18, genre: 'porteur', k: 1 } : null;
}

/**
 * Fait jaillir un chiffre sur sa cible. `ou` : un endroit plus précis que la cible (l'écu du portrait, la jauge de Flux).
 * Sans endroit où le poser (l'écran a changé), il ne s'affiche pas.
 */
export function montrerPop(racine: HTMLElement, o: { cible: string; texte: string; couleur: string; echelle?: number; voie?: Voie; ou?: string; reduit?: boolean }): void {
  const voie = o.voie ?? 'coup';
  const a = ancre(racine, o.cible, voie, o.ou);
  if (!a) return;
  if (!calque || !calque.isConnected) {
    calque = document.createElement('div');
    calque.className = 'calque-pops';
    calque.setAttribute('aria-hidden', 'true');
    document.body.appendChild(calque);
  }
  // la première place libre pour cette cible et cette voie
  const cle = `${o.cible}|${voie}|${o.ou ?? ''}`;
  const prises = new Set(poses.filter((p) => p.cle === cle).map((p) => p.place));
  let place = 0;
  while (prises.has(place)) place++;
  let dx = 0, dy = 0;
  if (a.genre === 'ennemi' && voie === 'coup') { const [x, y] = AUTOUR[place % AUTOUR.length]!; dx = x * a.k; dy = y * a.k; }
  else if (a.genre === 'ennemi') dy = place * 24 * a.k;
  else if (a.genre === 'vignette') dy = place * 18;
  else dy = -place * 22;
  const echelle = o.echelle ?? 1;
  const el = document.createElement('span');
  el.className = `pop pop-libre sur-${a.genre}${voie === 'info' ? ' info' : ''}${echelle >= 1.5 ? ' gros' : ''}`;
  el.textContent = o.texte;
  const x = Math.max(44, Math.min(innerWidth - 44, a.x + dx));
  const y = Math.max(20, a.y + dy);
  el.style.cssText = `left:${Math.round(x)}px;top:${Math.round(y)}px;--pc:${o.couleur};--ps:${echelle};--pk:${a.k.toFixed(2)};--pr:${Math.round((Math.random() * 2 - 1) * 8)}deg`;
  // « réduire les animations » : le chiffre s'affiche simplement, puis s'en va
  if (o.reduit) el.style.animation = 'none';
  calque.appendChild(el);
  const pose: Pose = { el, cle, place };
  poses.push(pose);
  setTimeout(() => { el.remove(); const i = poses.indexOf(pose); if (i >= 0) poses.splice(i, 1); }, o.reduit ? 900 : DUREE);
}

/** en quittant le combat : plus aucun chiffre à l'écran */
export function viderPops(): void {
  for (const p of poses) p.el.remove();
  poses.length = 0;
}
