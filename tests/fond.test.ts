import { describe, expect, it } from 'vitest';
import { nouveauJeu, creuser, estJeuValide, finCreuse, manquePourCreuser, fondFerme, FOND } from '../src/core/jeu';

const JOUR = 86_400_000;
/** une partie dont le gardien de −10 vient de tomber, avec tout ce qu'il faut pour creuser */
function auPuits() {
  const j = nouveauJeu(0);
  j.strate = 10; j.frontVaincu = true; j.batiments.noyau = 10; j.creuseurs = 99; j.creuseDebut = 0;
  return j;
}

describe('Le Fond fermé au jeu gratuit (13 novembre 2026)', () => {
  it('sous −10, la roche ne cède pas sans le Fond', () => {
    const j = auPuits();
    expect(fondFerme(j)).toBe(true);
    expect(finCreuse(j)).toBeNull();
    expect(manquePourCreuser(j)).toBeNull();
    j.dernierTick = 30 * JOUR;
    expect(creuser(j)).toBe(false);
    expect(j.strate).toBe(10);
  });

  it('avec le Fond ouvert (pack Ossyra, compte d’administration), on creuse vers −11', () => {
    const j = auPuits();
    j.fond = true;
    expect(fondFerme(j)).toBe(false);
    j.dernierTick = 30 * JOUR;
    expect(creuser(j)).toBe(true);
    expect(j.strate).toBe(FOND.premiere);
  });

  it('les Strates −1 à −10 se creusent comme avant', () => {
    const j = nouveauJeu(0);
    j.strate = 9; j.frontVaincu = true; j.batiments.noyau = 10; j.creuseurs = 99; j.creuseDebut = 0; j.dernierTick = 30 * JOUR;
    expect(fondFerme(j)).toBe(false);
    expect(creuser(j)).toBe(true);
    expect(j.strate).toBe(10);
  });

  it('une partie déjà descendue dans le Fond le garde au chargement', () => {
    const dedans = JSON.parse(JSON.stringify(nouveauJeu(0)));
    dedans.strate = 13;
    expect(estJeuValide(dedans)).toBe(true);
    expect(dedans.fond).toBe(true);
    const dessus = JSON.parse(JSON.stringify(nouveauJeu(0)));
    dessus.strate = 10;
    expect(estJeuValide(dessus)).toBe(true);
    expect(dessus.fond).toBeUndefined();
  });
});
