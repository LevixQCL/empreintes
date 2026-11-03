// Petits outils d'affichage partagés par les écrans.

/** Échappe un texte avant de le poser dans du HTML */
export const echap = (t: string) => t.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);

/** Le joueur a demandé moins d'animations (réglage du téléphone) */
export const mouvementReduit = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

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
