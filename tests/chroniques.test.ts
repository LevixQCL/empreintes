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

  it('racontent 2026 à 2030 dès le départ, avec leurs papiers d’époque, et gardent la Glacière pour la Strate −8', () => {
    for (const id of ['caves', 'detroit', 'pieds-mouilles', 'noir', 'sans-glace']) {
      const c = CHAPITRES.find((x) => x.id === id)!;
      expect(c.livre).toBe(1);
      expect(chapitreOuvert(c, 0)).toBe(true);
      expect(c.documents?.length).toBeGreaterThan(0);
      for (const d of c.documents!) expect(d.lignes.length).toBeGreaterThan(0);
    }
    const glaciere = CHAPITRES.find((c) => c.id === 'glaciere')!;
    expect(chapitreOuvert(glaciere, 7)).toBe(false);
    expect(chapitreOuvert(glaciere, 8)).toBe(true);
  });

  it('ne nomment aucune personne ni aucun mouvement réels repérés en relecture', () => {
    const texte = CHAPITRES.flatMap((c) => c.paragraphes).join(' ');
    for (const interdit of ['vendredi', 'sablier', 'dieux', 'ça va. Dix']) expect(texte).not.toContain(interdit);
  });
});

import { FRAGMENTS, ORDRE_FRAGMENTS } from '../src/core/fragments';
describe('Fragments d’archives', () => {
  it('ont un ordre qui couvre chaque fragment exactement une fois', () => {
    expect([...ORDRE_FRAGMENTS].sort()).toEqual(FRAGMENTS.map((f) => f.id).sort());
  });
});
