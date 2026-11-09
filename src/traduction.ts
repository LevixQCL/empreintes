// Le chargement d'un catalogue de traduction dans le navigateur (traductions/<langue>/**/*.json).
// Chaque fichier ne se télécharge que pour la langue choisie : un joueur francophone ne charge rien de plus.
// Le format des fichiers est décrit dans docs/traduction/README.md (et écrit par scripts/i18n.ts).

import type { Langue } from './core/i18n';

interface Entree { fr: string; en?: string }
interface FichierTraduction { source: string; entrees: Entree[] }

const FICHIERS = {
  en: import.meta.glob<FichierTraduction>('../traductions/en/**/*.json', { import: 'default' }),
} as const satisfies Partial<Record<Langue, unknown>>;

/** Texte français → traduction ; les entrées encore vides ne sont pas reprises (le français s'affiche) */
export async function chargerCatalogue(l: Langue): Promise<Map<string, string>> {
  const cat = new Map<string, string>();
  if (l === 'fr') return cat;
  const fichiers = await Promise.all(Object.values(FICHIERS[l]).map((charger) => charger()));
  for (const f of fichiers) for (const e of f.entrees) { const tr = e[l as 'en']; if (tr) cat.set(e.fr, tr); }
  return cat;
}
