// Les contrôles d'un catalogue de traduction (utilisés par scripts/i18n.ts et par tests/i18n.test.ts).
// Erreurs (bloquent le déploiement via les tests) : une valeur {n} perdue ou ajoutée, une balise HTML perdue ou ajoutée.
// Avertissements (n'empêchent rien) : un terme du glossaire traduit autrement que prévu.

import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { valeursDe } from '../src/core/i18n';

export interface Entree { fr: string; en?: string; ancien?: { fr: string; en: string } }
export interface FichierTraduction { source: string; entrees: Entree[] }
export interface Terme { fr: string; en: string; /** formes françaises (regex, insensible à la casse de la 1re lettre) */ formesFr?: string; formesEn?: string; /** emplois français qui n'appellent pas ce terme */ sauf?: string; note?: string }

export const RACINE = join(import.meta.dirname, '..');
export const DOSSIER_TRADUCTIONS = join(RACINE, 'traductions');

export function fichiersCatalogue(langue: string): string[] {
  const dossier = join(DOSSIER_TRADUCTIONS, langue);
  const liste: string[] = [];
  const parcourir = (d: string) => {
    let noms: string[] = [];
    try { noms = readdirSync(d); } catch { return; }
    for (const n of noms.sort()) {
      const p = join(d, n);
      if (statSync(p).isDirectory()) parcourir(p);
      else if (n.endsWith('.json')) liste.push(p);
    }
  };
  parcourir(dossier);
  return liste;
}

export const lireCatalogue = (chemin: string): FichierTraduction => JSON.parse(readFileSync(chemin, 'utf8')) as FichierTraduction;

export function lireGlossaire(): Terme[] {
  try { return (JSON.parse(readFileSync(join(DOSSIER_TRADUCTIONS, 'glossaire.json'), 'utf8')) as { termes: Terme[] }).termes; } catch { return []; }
}

/** Les balises HTML d'un texte, triées (on compare l'ensemble, pas l'ordre : l'anglais peut déplacer un <b>) */
export const balisesDe = (texte: string): string[] => (texte.match(/<\/?[a-zA-Z][^>]*>/g) ?? []).map((b) => b.replace(/\s+/g, ' ')).sort();

const memes = (a: string[], b: string[]) => a.length === b.length && a.every((x, i) => x === b[i]);

const regexTerme = (formes: string) => new RegExp(`(?<![\\p{L}])(?:${formes})(?![\\p{L}])`, 'u');
const formesParDefaut = (mot: string) => {
  const echappe = mot.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const [premiere, reste] = [echappe.slice(0, 1), echappe.slice(1)];
  return `[${premiere.toLowerCase()}${premiere.toUpperCase()}]${reste}s?`;
};

export interface Probleme { fichier: string; fr: string; message: string; grave: boolean }

export function controlerEntree(fichier: string, e: Entree, glossaire: Terme[]): Probleme[] {
  const pb: Probleme[] = [];
  if (!e.en) return pb;
  const court = e.fr.length > 70 ? `${e.fr.slice(0, 70)}…` : e.fr;
  if (!memes(valeursDe(e.fr), valeursDe(e.en))) pb.push({ fichier, fr: court, grave: true, message: `valeurs {n} différentes : ${valeursDe(e.fr).join(' ')} → ${valeursDe(e.en).join(' ')}` });
  if (!memes(balisesDe(e.fr), balisesDe(e.en))) pb.push({ fichier, fr: court, grave: true, message: 'balises HTML différentes' });
  for (const g of glossaire) {
    if (g.sauf && new RegExp(g.sauf, 'u').test(e.fr)) continue;
    if (regexTerme(g.formesFr ?? formesParDefaut(g.fr)).test(e.fr) && !regexTerme(g.formesEn ?? formesParDefaut(g.en)).test(e.en)) {
      pb.push({ fichier, fr: court, grave: false, message: `glossaire : « ${g.fr} » devrait donner « ${g.en} »` });
    }
  }
  return pb;
}

export function controlerTout(langue: string): Probleme[] {
  const glossaire = lireGlossaire();
  const pb: Probleme[] = [];
  for (const chemin of fichiersCatalogue(langue)) {
    const nom = relative(RACINE, chemin);
    for (const e of lireCatalogue(chemin).entrees) pb.push(...controlerEntree(nom, e, glossaire));
  }
  return pb;
}

export const compterMots = (texte: string): number => texte.replace(/<[^>]*>/g, ' ').replace(/\{\d+\}/g, ' ').split(/\s+/).filter((m) => /\p{L}/u.test(m)).length;
