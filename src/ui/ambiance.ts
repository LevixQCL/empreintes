// La vie de la Cuvette (12 novembre 2026, Bryan : « rendre la vue un peu plus accueillante ») : des habitants qui passent
// avec leur lanterne, des fenêtres qui respirent, la lueur chaude du quartier habité et, au large, les feux de quelques
// barques. Plus de familles te suivent, plus il y a de passants et de fenêtres allumées. Rien de cliquable, rien à lire.
import './ambiance.css';
import { mouvementReduit } from './outils';

type Point = readonly [number, number];

/** Les chemins des passants, en pixels du tableau (800 × 1200) : le haut de la digue, l'escalier de la Tour, l'escalier
 *  du Générateur, le socle du Comptoir, le ponton du Port. Du plus visible au plus discret. */
const CHEMINS: readonly (readonly Point[])[] = [
  [[70, 285], [130, 222], [215, 185], [330, 165]],
  [[680, 1165], [790, 1095]],
  [[425, 588], [425, 652]],
  [[485, 835], [540, 866], [600, 866], [650, 838]],
  [[330, 165], [400, 161], [482, 160]],
  [[322, 852], [300, 902]],
];

/** Les fenêtres des habitations (pas celles des bâtiments à monter : leurs calques changent avec le niveau) :
 *  position dans le tableau 800 × 1200 et taille du halo en % de sa largeur */
const FENETRES: readonly (readonly [number, number, number])[] = [
  [715, 150, 9], [520, 165, 5], [410, 262, 5], [608, 165, 5], [557, 232, 4.5], [455, 260, 4.5],
  [690, 315, 4.5], [370, 264, 4], [445, 236, 3.5], [683, 268, 4], [770, 215, 5],
];

/** Quatre points à égale distance le long d'un chemin : le passant y marche d'un pas régulier */
function quatrePoints(c: readonly Point[]): Point[] {
  const longueurs = c.slice(1).map((p, i) => Math.hypot(p[0] - c[i]![0], p[1] - c[i]![1]));
  const total = longueurs.reduce((a, b) => a + b, 0);
  return [0, 1, 2, 3].map((k) => {
    let reste = (total * k) / 3;
    for (let i = 0; i < longueurs.length; i++) {
      const l = longueurs[i]!;
      if (reste <= l || i === longueurs.length - 1) {
        const t = l ? Math.min(1, reste / l) : 0;
        return [c[i]![0] + (c[i + 1]![0] - c[i]![0]) * t, c[i]![1] + (c[i + 1]![1] - c[i]![1]) * t] as const;
      }
      reste -= l;
    }
    return c[0]!;
  });
}
const longueur = (c: readonly Point[]) => c.slice(1).reduce((a, p, i) => a + Math.hypot(p[0] - c[i]![0], p[1] - c[i]![1]), 0);

/** Combien de passants et de fenêtres pour ce nombre de familles (au moins un peu de vie dès le début) */
export const nbPassants = (familles: number) => Math.min(CHEMINS.length * 2, 2 + Math.floor(familles / 5));
export const nbFenetres = (familles: number) => Math.min(FENETRES.length, 4 + Math.floor(familles / 4));

/** Ce qui se pose sur le tableau, sous les repères des bâtiments : la lueur du quartier, les fenêtres, les passants */
export function ambianceTableau(familles: number, nuit: boolean, maintenant = Date.now()): string {
  let h = `<div class="ambiance${nuit ? ' nuit' : ''}" aria-hidden="true"><i class="amb-halo"></i>`;
  h += FENETRES.slice(0, nbFenetres(familles)).map(([x, y, w], i) =>
    `<i class="amb-fenetre" style="left:${x / 8}%;top:${y / 12}%;width:${w}%;--p:${5 + (i * 7 % 5) * .9}s;--d:${-(i * 13 % 9) * .8}s"></i>`).join('');
  if (!mouvementReduit()) {
    const n = nbPassants(familles);
    for (let k = 0; k < n; k++) {
      const chemin = CHEMINS[k % CHEMINS.length]!;
      const [a, b, c, d] = quatrePoints(chemin);
      // un aller prend le temps de sa longueur (un pas tranquille) ; le second passant d'un chemin part à contretemps.
      // Le retard suit l'horloge : quand l'écran se redessine, chacun reste où il était au lieu de repartir du bout du chemin.
      const aller = Math.round(14 + longueur(chemin) / 7);
      const retard = ((maintenant / 1000 + k * 11.3 + (k >= CHEMINS.length ? aller * .9 : 0)) % (aller * 2)).toFixed(1);
      const pt = (p: Point) => `${(p[0] / 8 * 100).toFixed(0)}%,${(p[1] / 12 * 100).toFixed(0)}%`;
      h += `<i class="amb-passant" style="--a:${pt(a!)};--b:${pt(b!)};--c:${pt(c!)};--e:${pt(d!)};animation-duration:${aller}s;animation-delay:-${retard}s"></i>`;
    }
  }
  return h + '</div>';
}

/** Au-dessus du tableau, sur téléphone : la brume du large qui glisse et les feux de trois barques au loin */
export const ambianceLarge = (nuit: boolean): string =>
  `<div class="amb-large${nuit ? ' nuit' : ''}" aria-hidden="true"><i class="amb-brume"></i><i class="amb-brume b2"></i>`
  + `<i class="amb-feu" style="left:47%;top:19%;--p:6.5s;--d:-1s"></i><i class="amb-feu" style="left:63%;top:9%;--p:8s;--d:-4s"></i><i class="amb-feu" style="left:36%;top:6%;--p:7.2s;--d:-2.5s"></i></div>`;
