import { describe, expect, it } from 'vitest';
import * as J from '../src/core/jeu';

const pret = () => { const j = J.nouveauJeu(Date.UTC(2026, 9, 22, 8), 5); j.chambre = true; return j; };
const ids = (j: J.Jeu) => J.enAttente(j).map((a) => a.id);

describe('Ce qui attend le directeur (fiche et cristal)', () => {
  it('le colis du jour attend, mais un colis ordinaire n’allume pas le cristal', () => {
    const j = pret();
    j.objectif = J.OBJECTIFS.length;
    j.ravitaillement.reserve = 1;
    j.ravitaillement.ouverts = 0;
    expect(ids(j)).toContain('colis');
    expect(J.appelDuCristal(j)).toBe(false);
  });
  it('le colis qui contient une carte au choix allume le cristal', () => {
    const j = pret();
    j.objectif = J.OBJECTIFS.length;
    j.ravitaillement.reserve = 1;
    j.ravitaillement.ouverts = J.RAVITAILLEMENT.cycle - 1;
    expect(J.colisAvantChoix(j)).toBe(1);
    expect(J.appelDuCristal(j)).toBe(true);
  });
  it('un objectif du jour rempli et le Butin prêt attendent et allument le cristal', () => {
    const j = pret();
    j.objectif = J.OBJECTIFS.length;
    j.ravitaillement.reserve = 0;
    expect(J.appelDuCristal(j)).toBe(false);
    j.quotidien.progres = J.QUOTIDIENS[j.quotidien.type].objectif;
    j.archive.aOuvrir = 2;
    expect(ids(j)).toEqual(['jour', 'butin']);
    expect(J.appelDuCristal(j)).toBe(true);
  });
  it('le Butin attend la fin des objectifs guidés, comme au district', () => {
    const j = pret();
    j.objectif = 0;
    j.archive.aOuvrir = 1;
    expect(ids(j)).not.toContain('butin');
  });
  it('rien n’attend avant la chambre scellée', () => {
    const j = J.nouveauJeu(Date.UTC(2026, 9, 22, 8), 5);
    expect(J.enAttente(j)).toEqual([]);
  });
  it('récupérer vide la liste : l’objectif du jour pousse une carte au choix, le Butin se referme', () => {
    const j = pret();
    j.objectif = J.OBJECTIFS.length;
    j.ravitaillement.reserve = 0;
    j.quotidien.progres = J.QUOTIDIENS[j.quotidien.type].objectif;
    j.archive.aOuvrir = 1;
    expect(J.reclamerQuotidien(j).ok).toBe(true);
    expect(J.ouvrirArchive(j).ok).toBe(true);
    expect(ids(j)).toEqual([]);
  });
});
