// Les langues (9 novembre 2026) : la fonction t(), et la santé des catalogues de traduction.
// Ces tests tournent au déploiement : une traduction qui perd une valeur {n} ou une balise, ou un catalogue
// pas remis à jour après un changement de texte, empêche la publication. Réparer : `npm run i18n` (voir docs/traduction/README.md).

import { afterEach, describe, expect, it } from 'vitest';
import { existsSync } from 'node:fs';
import { cleGabarit, definirLangue, langue, t } from '../src/core/i18n';
import { controlerTout, fichiersCatalogue, lireCatalogue } from '../scripts/i18n-controle';
import { cheminCatalogue, textesDuCode } from '../scripts/i18n';

afterEach(() => definirLangue('fr', null));

describe('t()', () => {
  it('rend le français tel quel sans catalogue (le jeu actuel ne change pas)', () => {
    expect(t('Le district dort.')).toBe('Le district dort.');
    const n = 3;
    expect(t`Il reste ${n} cristaux.`).toBe('Il reste 3 cristaux.');
  });

  it('traduit un texte et un gabarit, et la traduction peut déplacer les valeurs', () => {
    const cat = new Map([
      ['Le district dort.', 'The district sleeps.'],
      ['{0} a vaincu {1}.', '{1} was defeated by {0}.'],
    ]);
    definirLangue('en', cat);
    expect(langue()).toBe('en');
    expect(t('Le district dort.')).toBe('The district sleeps.');
    const qui = 'Ilka'; const quoi = 'le Rôdeur';
    expect(t`${qui} a vaincu ${quoi}.`).toBe('le Rôdeur was defeated by Ilka.');
  });

  it('garde le français quand une traduction manque', () => {
    definirLangue('en', new Map());
    const n = 2;
    expect(t('Pas encore traduit.')).toBe('Pas encore traduit.');
    expect(t`Encore ${n} à faire.`).toBe('Encore 2 à faire.');
  });

  it('construit la clé d’un gabarit avec {0}, {1}…', () => {
    expect(cleGabarit(['A ', ' et ', '.'])).toBe('A {0} et {1}.');
    expect(cleGabarit(['Seul'])).toBe('Seul');
  });
});

describe('catalogues de traduction', () => {
  it('aucune traduction ne perd ni n’ajoute de valeur {n} ou de balise HTML', () => {
    const graves = controlerTout('en').filter((p) => p.grave).map((p) => `${p.fichier} : ${p.message} — « ${p.fr} »`);
    expect(graves).toEqual([]);
  });

  it('les catalogues suivent le code (sinon : npm run i18n)', () => {
    const { parSource } = textesDuCode();
    const attendus = new Set<string>();
    for (const [source, cles] of parSource) {
      const chemin = cheminCatalogue('en', source);
      attendus.add(chemin);
      expect(existsSync(chemin), `catalogue manquant pour ${source} : lancer npm run i18n`).toBe(true);
      expect(lireCatalogue(chemin).entrees.map((e) => e.fr), `${source} a changé : lancer npm run i18n`).toEqual(cles);
    }
    for (const chemin of fichiersCatalogue('en')) expect(attendus.has(chemin), `${chemin} ne correspond plus à aucun fichier : lancer npm run i18n`).toBe(true);
  }, 60_000);
});
