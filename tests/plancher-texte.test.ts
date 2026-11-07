// Le plancher de 12 px et les trois polices (audit du 7 novembre 2026) : rien ne s'écrit sous 12 px sur téléphone,
// et IBM Plex Sans ne revient pas. Les tailles fixes des feuilles de style sont vérifiées ici ; les tailles relatives
// (em, cqw) passent par max(var(--t-min), …) et sont mesurées à l'écran par npm run visuel.
import { readdirSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const dossier = resolve(import.meta.dirname, '../src/ui');
const feuilles = readdirSync(dossier).filter((f) => f.endsWith('.css')).map((f) => ({ f, css: readFileSync(resolve(dossier, f), 'utf8') }));

describe('Lisibilité des feuilles de style', () => {
  it('aucune taille de texte fixe sous 12 px', () => {
    const fautes: string[] = [];
    for (const { f, css } of feuilles) {
      for (const m of css.matchAll(/font-size:\s*([0-9]*\.?[0-9]+)px/g)) if (Number(m[1]) < 12) fautes.push(`${f} : ${m[0]}`);
      for (const m of css.matchAll(/font:[^;{}]*?\b([0-9]*\.?[0-9]+)px\s*[/ ]/g)) if (Number(m[1]) < 12) fautes.push(`${f} : ${m[0]}`);
    }
    expect(fautes).toEqual([]);
  });

  it('IBM Plex Sans ne sert plus nulle part', () => {
    expect(feuilles.filter(({ css }) => /plex/i.test(css)).map(({ f }) => f)).toEqual([]);
  });
});
