// Les morceaux d'affichage de l'outil d'analyse : chiffres clés, barres, colonnes, tableaux triables, carte de chaleur.
// Une seule série par graphique (pas de légende de couleurs) ; chaque valeur a une infobulle et un tableau la double au besoin.

import { echap } from '../ui/outils';
import type { Ligne } from './calculs';

export const fr = (n: number, decimales = 0) => n.toLocaleString('fr-BE', { maximumFractionDigits: decimales, minimumFractionDigits: decimales });
export const pct = (n: number, sur: number) => (sur ? `${Math.round((100 * n) / sur)} %` : '—');

export const tuile = (nom: string, valeur: string, detail = '') =>
  `<div class="an-tuile"><span>${nom}</span><b>${valeur}</b>${detail ? `<small>${detail}</small>` : ''}</div>`;

export const vide = (texte: string) => `<p class="an-vide">${texte}</p>`;

/** Barres horizontales, une ligne par valeur ; sur = la valeur qui remplit la barre */
export function barres(l: Ligne[], sur = Math.max(1, ...l.map((x) => x.valeur))): string {
  if (!l.length) return vide('Pas encore de données.');
  return `<ul class="an-barres">${l.map((x) => `<li data-tip="${echap(x.nom)} : ${fr(x.valeur)}${x.detail ? ` · ${echap(x.detail)}` : ''}">`
    + `<span class="an-nom">${echap(x.nom)}</span><span class="an-piste"><i style="width:${(100 * x.valeur) / sur}%"></i></span>`
    + `<b>${fr(x.valeur)}</b>${x.detail ? `<small>${echap(x.detail)}</small>` : '<small></small>'}</li>`).join('')}</ul>`;
}

/** Colonnes verticales (une par case), étiquette tous les `pas` ; tip = le texte de l'infobulle */
export function colonnes(l: { valeur: number; etiquette: string; tip: string }[], pas: number, legende: string): string {
  const max = Math.max(1, ...l.map((x) => x.valeur));
  return `<div class="an-colonnes" style="--n:${l.length}" role="img" aria-label="${echap(legende)}">${l.map((x, i) =>
    `<div class="an-col" data-tip="${echap(x.tip)}"><i style="height:${(100 * x.valeur) / max}%"></i>`
    // une étiquette tous les `pas` ; sur téléphone, une sur deux seulement (classe « sec »)
    + (i % pas === 0 ? `<span${(i / pas) % 2 ? ' class="sec"' : ''}>${echap(x.etiquette)}</span>` : '') + `</div>`).join('')}</div>`;
}

export interface Colonne<T> {
  cle: string;
  nom: string;
  /** la valeur qui sert au tri */
  val: (x: T) => number | string;
  /** l'affichage (par défaut la valeur) */
  aff?: (x: T) => string;
  /** colonne de texte, alignée à gauche */
  texte?: boolean;
}
export interface Tri { cle: string; desc: boolean }

/** Un tableau triable : toucher un en-tête trie la colonne (puis l'inverse) */
export function table<T>(id: string, cols: Colonne<T>[], lignes: T[], tri: Tri | undefined, max = Infinity): string {
  if (!lignes.length) return vide('Pas encore de données.');
  const c = tri && cols.find((x) => x.cle === tri.cle);
  const triees = c ? [...lignes].sort((a, b) => {
    const va = c.val(a); const vb = c.val(b);
    const r = typeof va === 'number' && typeof vb === 'number' ? va - vb : String(va).localeCompare(String(vb), 'fr');
    return tri!.desc ? -r : r;
  }) : lignes;
  const montrees = triees.slice(0, max);
  return `<div class="an-table"><table><thead><tr>${cols.map((x) => {
    const actif = tri?.cle === x.cle;
    return `<th class="${x.texte ? 'txt' : ''}" aria-sort="${actif ? (tri!.desc ? 'descending' : 'ascending') : 'none'}">`
      + `<button type="button" data-action="trier" data-table="${id}" data-cle="${x.cle}">${echap(x.nom)}${actif ? (tri!.desc ? ' ↓' : ' ↑') : ''}</button></th>`;
  }).join('')}</tr></thead><tbody>${montrees.map((l) => `<tr>${cols.map((x) => `<td class="${x.texte ? 'txt' : ''}">${x.aff ? x.aff(l) : echap(String(x.val(l)))}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`
    + (triees.length > montrees.length ? `<p class="an-vide">${fr(montrees.length)} lignes affichées sur ${fr(triees.length)} (toutes sont dans l’export).</p>` : '');
}

/** Carte de chaleur (rétention par cohorte) : une seule teinte, plus foncée = plus haut ; le chiffre est toujours écrit */
export function chaleur(lignes: { nom: string; detail: string; cases: (number | null)[] }[], entetes: string[]): string {
  if (!lignes.length) return vide('Pas encore de cohorte.');
  return `<div class="an-table"><table class="an-chaleur"><thead><tr><th class="txt">Semaine de début</th><th>Joueurs</th>${entetes.map((e) => `<th>${e}</th>`).join('')}</tr></thead><tbody>`
    + lignes.map((l) => `<tr><td class="txt">${echap(l.nom)}</td><td>${echap(l.detail)}</td>${l.cases.map((v) => v === null
      ? '<td class="attente">·</td>'
      : `<td style="--v:${v.toFixed(2)}">${Math.round(v * 100)} %</td>`).join('')}</tr>`).join('')
    + `</tbody></table></div>`;
}

export const bloc = (id: string, titre: string, aide: string, contenu: string) =>
  `<section class="an-bloc" id="${id}"><h3>${titre}</h3>${aide ? `<p class="an-aide">${aide}</p>` : ''}${contenu}</section>`;

/** Un chapitre du tableau de bord (ancre de la navigation) */
export const chapitre = (id: string, titre: string, contenu: string) =>
  `<section class="an-chapitre" id="${id}"><h2>${titre}</h2>${contenu}</section>`;
