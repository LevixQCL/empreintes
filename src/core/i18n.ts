// Les langues du jeu (9 novembre 2026).
// Le français reste la langue source : le texte est écrit en français dans le code, entouré de t(…) ou t`…`.
// Ce texte français sert lui-même de clé (méthode « gettext ») : quand on le modifie, sa traduction n'est plus trouvée,
// et `npm run i18n` la signale à refaire (avec l'ancienne traduction en appui). Rien d'autre n'est à tenir à jour.
// Sans catalogue chargé (français, tests, robot, serveur), t() rend le texte tel quel : zéro différence pour le jeu actuel.
// Pas de DOM ici : le choix de la langue et le chargement du catalogue se font au démarrage (src/main.ts).
// Mode d'emploi complet : docs/traduction/README.md

export type Langue = 'fr' | 'en';

/** Les langues proposées aux joueurs. L'anglais n'y entre que lorsqu'il est complet (npm run i18n -- couverture). */
export const LANGUES_PUBLIEES: readonly Langue[] = ['fr'];
/** Toutes les langues qui ont un catalogue (traductions/<langue>/) */
export const LANGUES: readonly Langue[] = ['fr', 'en'];

let langueActive: Langue = 'fr';
let catalogue: ReadonlyMap<string, string> | null = null;

/** La langue en cours d'affichage */
export const langue = (): Langue => langueActive;

/**
 * Active une langue avec son catalogue (texte français → traduction).
 * À appeler AVANT le chargement des modules qui définissent leurs textes au démarrage (Chroniques, Strates…).
 */
export function definirLangue(l: Langue, cat: ReadonlyMap<string, string> | null): void {
  langueActive = l;
  catalogue = l === 'fr' ? null : cat;
}

/** La clé d'un gabarit t`…${x}…` : les morceaux fixes, reliés par {0}, {1}… dans l'ordre des valeurs */
export const cleGabarit = (morceaux: readonly string[]): string =>
  morceaux.reduce((cle, m, i) => (i === 0 ? m : `${cle}{${i - 1}}${m}`), '');

const remplir = (modele: string, valeurs: readonly unknown[]): string =>
  modele.replace(/\{(\d+)\}/g, (tout, n: string) => (Number(n) < valeurs.length ? String(valeurs[Number(n)]) : tout));

/**
 * Traduit un texte du jeu.
 *   t('Le texte en français.')
 *   t`Il reste ${n} cristaux.`        (clé : « Il reste {0} cristaux. » ; la traduction peut déplacer {0})
 * Un texte sans traduction reste en français : rien ne casse pendant que la traduction avance.
 */
export function t(texte: string): string;
export function t(morceaux: TemplateStringsArray, ...valeurs: unknown[]): string;
export function t(texte: string | TemplateStringsArray, ...valeurs: unknown[]): string {
  if (typeof texte === 'string') return catalogue?.get(texte) || texte;
  if (!catalogue) return texte.reduce((s, m, i) => (i === 0 ? m : s + String(valeurs[i - 1]) + m), '');
  const cle = cleGabarit(texte);
  return remplir(catalogue.get(cle) || cle, valeurs);
}

/** Les {0}, {1}… (et les {nom} remplacés ailleurs) d’un texte : une traduction doit tous les garder */
export const valeursDe = (texte: string): string[] => (texte.match(/\{\w+\}/g) ?? []).sort();
