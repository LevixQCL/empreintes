// La logique de la partie est rangée en couches (src/core/partie/) : un fichier n'importe que les couches d'en dessous.
// Sans cette règle, une constante lue au chargement d'un fichier qui n'est pas encore prêt casse le jeu au démarrage.
import { readdirSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const COUCHES = ['etat', 'stats', 'vecu', 'objectifs', 'district', 'recompenses', 'descentes', 'pillages', 'fleche', 'temps', 'nouvelle'];
const dossier = resolve(import.meta.dirname, '../src/core/partie');

describe('Couches de src/core/partie', () => {
  it('chaque fichier a sa place dans la liste', () => {
    expect(readdirSync(dossier).map((f) => f.replace(/\.ts$/, '')).sort()).toEqual([...COUCHES].sort());
  });
  for (const f of COUCHES) {
    it(`${f} n'importe que des couches d'en dessous`, () => {
      const texte = readFileSync(resolve(dossier, `${f}.ts`), 'utf8');
      const importes = [...texte.matchAll(/^import [^;]* from '\.\/(\w+)';/gm)].map((m) => m[1]!);
      for (const i of importes) expect(COUCHES.indexOf(i), `${f} importe ${i}`).toBeLessThan(COUCHES.indexOf(f));
    });
  }
});
