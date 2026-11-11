// La vente des Récits des origines (11 novembre 2026) : les prix du jeu et ceux du serveur disent la même chose,
// un droit n'ouvre que son récit, et personne d'autre que le serveur n'écrit les achats.
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { describe, expect, it } from 'vitest';
import { LOT_RECITS, PRODUITS, RECITS_ORIGINES, aRecit, droitRecit, lotProposable, prixEuros } from '../src/core/jeu';

const require = createRequire(import.meta.url);
const serveur = require('../functions/droits.js') as {
  PRODUITS: Record<string, { prix: number; nom: string; droits: string[] }>;
  retourPermis: (r: unknown) => string | null;
  droitsNouveaux: (produit: string, acquis: string[]) => string[];
};

describe('Vente des Récits', () => {
  it('le jeu et le serveur vendent les mêmes produits, au même prix, pour les mêmes droits', () => {
    expect(Object.keys(serveur.PRODUITS).sort()).toEqual(Object.keys(PRODUITS).sort());
    for (const [id, p] of Object.entries(PRODUITS)) {
      expect(serveur.PRODUITS[id]!.prix, id).toBe(p.prix);
      expect(serveur.PRODUITS[id]!.droits, id).toEqual(p.droits);
      expect(serveur.PRODUITS[id]!.nom.length, id).toBeGreaterThan(0);
    }
  });

  it('chaque récit du jeu a son produit, et le lot donne les trois', () => {
    for (const r of Object.keys(RECITS_ORIGINES)) expect(PRODUITS[droitRecit(r)], r).toBeTruthy();
    expect(PRODUITS[LOT_RECITS]!.droits.sort()).toEqual(Object.keys(RECITS_ORIGINES).map(droitRecit).sort());
    // le lot coûte moins que les trois à l'unité, et plus que deux : il n'est proposé qu'avant le premier achat
    const unite = PRODUITS[droitRecit('ilka')]!.prix;
    expect(PRODUITS[LOT_RECITS]!.prix).toBeLessThan(3 * unite);
    expect(PRODUITS[LOT_RECITS]!.prix).toBeGreaterThan(2 * unite);
  });

  it('un droit n’ouvre que son récit', () => {
    expect(aRecit([], 'ilka')).toBe(false);
    expect(aRecit(['recit-doran'], 'ilka')).toBe(false);
    expect(aRecit(['recit-ilka'], 'ilka')).toBe(true);
    expect(lotProposable([])).toBe(true);
    expect(lotProposable(['recit-vela'])).toBe(false);
  });

  it('les prix s’écrivent en euros', () => {
    expect(prixEuros(299).replace(/\s/g, ' ')).toBe('2,99 €');
  });

  it('le serveur ne revend pas un récit déjà acquis et ne ramène que vers le jeu publié', () => {
    expect(serveur.droitsNouveaux('recit-ilka', ['recit-ilka'])).toEqual([]);
    expect(serveur.droitsNouveaux('recits-trio', ['recit-ilka'])).toEqual(['recit-doran', 'recit-vela']);
    expect(serveur.droitsNouveaux('constructor', [])).toEqual([]);
    expect(serveur.retourPermis('https://levixqcl.github.io/empreintes/')).toBe('https://levixqcl.github.io/empreintes/');
    expect(serveur.retourPermis('https://ailleurs.example/')).toBeNull();
    expect(serveur.retourPermis(undefined)).toBeNull();
  });

  it('aucune règle ne laisse un joueur écrire ses achats', () => {
    const regles = readFileSync(new URL('../firestore.rules', import.meta.url), 'utf8');
    const debut = regles.indexOf('match /achats/{uid}');
    expect(debut).toBeGreaterThan(0);
    const bloc = regles.slice(debut, regles.indexOf('// Le Grand Tableau', debut));
    expect(bloc).not.toMatch(/allow[^:]*\b(write|create|update|delete)\b/);
    expect(bloc).toMatch(/allow get: if request\.auth != null && request\.auth\.uid == uid;/);
  });
});
