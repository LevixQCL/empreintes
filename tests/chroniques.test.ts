import { describe, expect, it } from 'vitest';
import { CHAPITRES, chapitreOuvert } from '../src/core/chroniques';

describe('Chroniques', () => {
  it('ont des identifiants uniques et des chapitres non vides', () => {
    expect(new Set(CHAPITRES.map((c) => c.id)).size).toBe(CHAPITRES.length);
    for (const c of CHAPITRES) expect(c.paragraphes.length).toBeGreaterThan(0);
  });

  it('ouvrent les chapitres profonds seulement en descendant', () => {
    const avant = CHAPITRES.find((c) => c.id === 'avant')!;
    expect(chapitreOuvert(avant, 1)).toBe(false);
    expect(chapitreOuvert(avant, 10)).toBe(true);
    expect(CHAPITRES.filter((c) => chapitreOuvert(c, 1)).length).toBeGreaterThan(10);
  });

  it('ne nomment aucune personne ni aucun mouvement réels repérés en relecture', () => {
    const texte = CHAPITRES.flatMap((c) => c.paragraphes).join(' ');
    for (const interdit of ['vendredi', 'sablier', 'dieux', 'ça va. Dix']) expect(texte).not.toContain(interdit);
  });
});
