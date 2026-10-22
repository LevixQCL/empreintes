import { describe, expect, it } from 'vitest';
import * as J from '../src/core/jeu';
import { estJeuValide } from '../src/core/jeu';

const JOUR = 86_400_000;
const pret = () => { const j = J.nouveauJeu(Date.UTC(2026, 9, 22, 8), 5); j.chambre = true; return j; };

describe('Récompenses de lecture', () => {
  it('la première lecture d’un chapitre donne une carte en fer, une seule fois', () => {
    const j = pret();
    const avant = Object.keys(j.collection).length;
    const c = J.lireChapitre(j, 'lettre');
    expect(c).toMatch(/@fer$/);
    expect(Object.keys(j.collection).length).toBe(avant + 1);
    expect(J.lireChapitre(j, 'lettre')).toBeNull();
    expect(j.lus).toContain('lettre');
  });
  it('une ancienne sauvegarde reçoit les cartes des chapitres déjà lus', () => {
    const j = pret() as Partial<J.Jeu> & J.Jeu;
    j.lus = ['lettre', 'ligne-bleue'];
    delete (j as Partial<J.Jeu>).luesRecompensees;
    delete (j as Partial<J.Jeu>).ravitaillement;
    const avant = Object.keys(j.collection).length;
    expect(estJeuValide(j)).toBe(true);
    expect(j.luesRecompensees).toEqual(['lettre', 'ligne-bleue']);
    expect(Object.keys(j.collection).length).toBe(avant + 2);
    expect(j.ravitaillement.reserve).toBe(1);
  });
});

describe('Ravitaillement du jour', () => {
  it('un colis par jour, 3 en réserve au plus, aucune série perdue', () => {
    const j = pret();
    const t0 = j.dernierTick;
    expect(J.ouvrirColis(j).ok).toBe(true);
    expect(J.ouvrirColis(j).ok).toBe(false);
    J.tick(j, t0 + 10 * JOUR);
    expect(j.ravitaillement.reserve).toBe(3);
  });
  it('donne des composants, un doublon possédé, et une carte au choix tous les 7 colis', () => {
    const j = pret();
    const comp = j.composants;
    const r = J.ouvrirColis(j);
    expect(j.composants).toBe(comp + J.RAVITAILLEMENT.composants + J.RAVITAILLEMENT.composantsParStrate * j.strate);
    expect(j.collection[r.colis!.doublon!]!.doublons).toBeGreaterThan(0);
    for (let k = 1; k < 7; k++) { j.ravitaillement.reserve = 1; J.ouvrirColis(j); }
    expect(j.choix.some((c) => c.source === 'ravitaillement')).toBe(true);
  });
});
