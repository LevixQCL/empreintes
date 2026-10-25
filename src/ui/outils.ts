// Petits outils d'affichage partagés par les écrans.

/** Échappe un texte avant de le poser dans du HTML */
export const echap = (t: string) => t.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);

/** Le joueur a demandé moins d'animations (réglage du téléphone) */
export const mouvementReduit = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/** Le centre d'un élément à l'écran */
export const centreDe = (el: Element) => { const r = el.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; };

/** Un nombre à une décimale, avec la virgule française (2,5) */
export const virgule = (n: number) => String(Math.round(n * 10) / 10).replace('.', ',');
