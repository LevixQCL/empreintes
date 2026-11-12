// L'album (12 novembre 2026) : l’Héritage, la carte du parrainage et les cartes d'origine sont des cartes en plus,
// jamais des cartes à compléter (Bryan : « on ne peut pas avoir toutes les cartes d'origine, comme pour l’Héritage »).
import { describe, expect, it } from 'vitest';
import { MODULES, MODULES_TIRABLES, carteId, horsAlbum } from '../src/core/donnees';
import { album, tirerTrouvaille } from '../src/core/collection';
import { valeurRegistre } from '../src/core/classements';
import { choisirLegs, fabriquer, garderCarteRecit, nouveauJeu } from '../src/core/jeu';
import type { Lignee } from '../src/core/types';

const LIGNEES: Lignee[] = ['tech', 'bio', 'reso'];
const legs = MODULES.filter((m) => m.legs), origines = MODULES.filter((m) => m.origine), liens = MODULES.filter((m) => m.lien);

describe('L’album', () => {
  it('les cartes hors album sont l’Héritage, le parrainage et les origines, et aucune ne se trouve', () => {
    expect(legs).toHaveLength(9);
    expect(origines).toHaveLength(6);
    expect(liens.length).toBeGreaterThan(0);
    expect(MODULES.filter(horsAlbum)).toHaveLength(legs.length + origines.length + liens.length);
    expect(MODULES_TIRABLES.some(horsAlbum)).toBe(false);
    expect(MODULES_TIRABLES).toHaveLength(MODULES.length - MODULES.filter(horsAlbum).length);
  });

  it('une partie neuve : rien de l’Héritage ni des origines n’est « à trouver », et toutes les autres cartes le sont', () => {
    const j = nouveauJeu(0, 5);
    const cases = LIGNEES.map((l) => album(j.collection, l));
    expect(cases.flatMap((a) => a.aTrouver).some(horsAlbum)).toBe(false);
    expect(cases.flatMap((a) => a.possedees).some(horsAlbum)).toBe(false);
    expect(cases.reduce((n, a) => n + a.possedees.length + a.aTrouver.length, 0)).toBe(MODULES_TIRABLES.length);
  });

  it('une carte de l’Héritage ou d’origine reçue apparaît dans l’album, sans ouvrir de case pour les autres', () => {
    const j = nouveauJeu(0, 5);
    j.chambre = true;
    expect(choisirLegs(j, 'bras-fonderie').ok).toBe(true);
    garderCarteRecit(j, 'ilka', 'toutes-les-courses');
    const tech = album(j.collection, 'tech');
    expect(tech.possedees.map((m) => m.id)).toEqual(expect.arrayContaining(['bras-fonderie', 'toutes-les-courses']));
    for (const l of LIGNEES) expect(album(j.collection, l).aTrouver.some(horsAlbum), l).toBe(false);
  });

  it('le Registre compte les cartes à trouver sur un total qu’on peut atteindre, les autres en plus', () => {
    const tout = Object.fromEntries(MODULES_TIRABLES.map((m) => [carteId(m.id, m.rarete), { niveau: 1 }]));
    const plein = valeurRegistre(tout);
    expect(plein.total).toBe(MODULES_TIRABLES.length);
    expect(plein.decouvertes).toBe(plein.total);
    expect(plein.enPlus).toBe(0);
    const avec = valeurRegistre({ ...tout, [carteId('bras-fonderie', 'nacre')]: { niveau: 1 }, [carteId('toutes-les-courses', 'or')]: { niveau: 1 } });
    expect(avec.decouvertes).toBe(avec.total);
    expect(avec.enPlus).toBe(2);
  });

  it('une trouvaille n’est jamais le doublon d’une carte de l’Héritage ou d’origine, et la Forge ne les refait pas', () => {
    const j = nouveauJeu(0, 5);
    j.chambre = true;
    choisirLegs(j, 'bras-fonderie');
    for (const m of origines) j.collection[carteId(m.id, 'or')] = { niveau: 1, doublons: 0 };
    for (let k = 0; k < 400; k++) {
      const id = tirerTrouvaille(j, 12, k % 2 ? 'or' : 'nacre');
      expect(horsAlbum(MODULES.find((m) => id.startsWith(m.id + '@'))!), id).toBe(false);
    }
    expect(fabriquer(j, carteId('bras-fonderie', 'nacre'), 0).ok).toBe(false);
    expect(fabriquer(j, carteId('toutes-les-courses', 'or'), 0).ok).toBe(false);
  });
});
