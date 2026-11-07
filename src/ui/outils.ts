// Petits outils d'affichage partagés par les écrans.

/** Échappe un texte avant de le poser dans du HTML */
export const echap = (t: string) => t.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);

/** Le joueur a demandé moins d'animations (réglage du téléphone) */
/** le réglage « Animations réduites » du menu (audit du 7 novembre 2026), en plus de celui du téléphone */
export const animationsReduites = (): boolean => { try { return localStorage.getItem('empreintes.animations') === 'reduites'; } catch { return false; } };
/** Applique le réglage à la page : la classe anim-reduites coupe les animations et transitions (styles.css) */
export function appliquerAnimations(): void { document.documentElement.classList.toggle('anim-reduites', animationsReduites()); }
export function basculerAnimations(): void {
  try { localStorage.setItem('empreintes.animations', animationsReduites() ? 'completes' : 'reduites'); } catch { /* stockage indisponible */ }
  appliquerAnimations();
}
export const mouvementReduit = () => animationsReduites() || window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/** Le centre d'un élément à l'écran */
export const centreDe = (el: Element) => { const r = el.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; };

/** Un nombre à une décimale, avec la virgule française (2,5) */
export const virgule = (n: number) => String(Math.round(n * 10) / 10).replace('.', ',');

/**
 * Un texte d'aide long, replié (audit du 3 novembre 2026 : trop de paragraphes avant l'action, comme dans un manuel) :
 * la première phrase reste lisible, la suite se déplie d'un toucher sur « Lire la suite ». Le volet porte un id,
 * pour rester déplié d'un rendu à l'autre (rendu.ts). Un texte déjà court reste un simple paragraphe.
 */
export function texteReplie(html: string, id: string, classe = ''): string {
  const m = /^(.+?[.!?…])\s+([\s\S]+)$/.exec(html);
  if (!m || m[2]!.length < 70) return `<p class="${classe}">${html}</p>`;
  return `<details class="replie ${classe}" id="replie-${id}"><summary><span>${m[1]}</span> <b class="replie-plus">Lire la suite</b></summary><p>${m[2]}</p></details>`;
}

/**
 * Les rangées qui défilent de côté (filtres, portraits, cibles) montrent qu'il y a une suite (audit du 7 novembre 2026) :
 * un fondu au bord où il reste quelque chose à voir, qui disparaît une fois au bout. styles.css : .deborde-d / .deborde-g
 */
const RANGEES = '.cl-filtres,.fb-rangee,.rangee,.es-cibles,.cr-rangee,.cr-filtres,.gt-onglets';
function marquer(el: HTMLElement) {
  const reste = el.scrollWidth - el.clientWidth;
  el.classList.toggle('deborde-d', reste > 2 && el.scrollLeft < reste - 2);
  el.classList.toggle('deborde-g', reste > 2 && el.scrollLeft > 2);
}
export function marquerDebordements(racine: HTMLElement): void {
  // la feuille d'un bâtiment défilée : un bandeau de verre passe derrière le bouton Fermer, qui ne flotte plus sur les cartes
  for (const corps of racine.querySelectorAll<HTMLElement>('.fiche-bat > .feuille-corps')) {
    const f = corps.parentElement!;
    const maj = () => f.classList.toggle('defile', corps.scrollTop > 24);
    maj();
    if (!corps.dataset.fondu) { corps.dataset.fondu = '1'; corps.addEventListener('scroll', maj, { passive: true }); }
  }
  for (const el of racine.querySelectorAll<HTMLElement>(RANGEES)) {
    marquer(el);
    if (!el.dataset.fondu) { el.dataset.fondu = '1'; el.addEventListener('scroll', () => marquer(el), { passive: true }); }
  }
}
