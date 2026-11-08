// Un nom d'action ne doit être traité que par un seul thème (8 novembre 2026) : l'écran d'âge et la fenêtre
// « Le quartier s'éveille » partageaient « age-ok », et le premier thème appelé avalait le toucher du second.
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('actions', () => {
  it('chaque nom d’action n’est traité que dans un seul fichier de src/app/actions', () => {
    const dossier = join(__dirname, '..', 'src', 'app', 'actions');
    const vus = new Map<string, string[]>();
    for (const f of readdirSync(dossier).filter(n => n.endsWith('.ts'))) {
      const texte = readFileSync(join(dossier, f), 'utf8');
      for (const [, nom = ''] of texte.matchAll(/case '([a-z0-9-]+)'/g)) vus.set(nom, [...new Set([...(vus.get(nom) ?? []), f])]);
    }
    const doubles = [...vus].filter(([, fichiers]) => fichiers.length > 1).map(([nom, fichiers]) => `${nom} : ${fichiers.join(', ')}`);
    expect(doubles).toEqual([]);
  });
});
