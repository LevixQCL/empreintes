// « Mon escouade » (décision du 23 octobre 2026) : l'escouade est enregistrée, et ne change qu'au district.
import { describe, expect, it } from 'vitest';
import { cartesNouvelles, marquerVus, porteursNouveaux, escouadeDe, escouadePourDepart, nouveauJeu, partir, placerDansEscouade, poster, estJeuValide, type Jeu } from '../src/core/jeu';

const pret = () => { const j = nouveauJeu(0, 1); j.chambre = true; j.recrues = true; return j; };

describe('Mon escouade', () => {
  it('commence avec Ilka, Doran et Véla', () => {
    expect(escouadeDe(pret())).toEqual(['ilka', 'doran', 'vela']);
  });

  it('une ancienne sauvegarde reçoit l’escouade de départ', () => {
    const j = pret() as Partial<Jeu>;
    delete j.escouade;
    expect(estJeuValide(j)).toBe(true);
    expect(escouadeDe(j as Jeu)).toEqual(['ilka', 'doran', 'vela']);
  });

  it('on remplace un Porteur à sa place, et deux membres échangent leur place', () => {
    const j = pret();
    const autre = escouadePourDepart({ ...j, escouade: [] }).find((id) => !['ilka', 'doran', 'vela'].includes(id));
    if (autre) {
      expect(placerDansEscouade(j, 1, autre).ok).toBe(true);
      expect(escouadeDe(j)).toEqual(['ilka', autre, 'vela']);
    }
    expect(placerDansEscouade(j, 0, 'vela').ok).toBe(true);
    expect(escouadeDe(j)[0]).toBe('vela');
    expect(escouadeDe(j)[2]).toBe('ilka');
  });

  it('elle ne change pas pendant une descente', () => {
    const j = pret();
    expect(partir(j, ['ilka', 'doran', 'vela'], 1).ok).toBe(true);
    const r = placerDansEscouade(j, 0, 'doran');
    expect(r.ok).toBe(false);
    expect(r.message).toMatch(/district/);
    expect(escouadeDe(j)).toEqual(['ilka', 'doran', 'vela']);
  });

  it('un Porteur au travail peut entrer et partir : son poste reste vacant', () => {
    const j = pret();
    expect(poster(j, 'doran', 'clinique').ok).toBe(true);
    expect(escouadePourDepart(j)).toEqual(['ilka', 'doran', 'vela']);
    expect(partir(j, ['ilka', 'doran', 'vela'], 1).ok).toBe(true);
    expect(j.porteurs.doran!.poste).toBeNull();
    expect(Object.values(j.porteurs).some((p) => p.poste === 'clinique')).toBe(false);
  });

  it('un départ refusé ne libère personne', () => {
    const j = pret();
    expect(poster(j, 'doran', 'generateur').ok).toBe(true);
    expect(partir(j, ['ilka', 'doran', 'vela'], 99).ok).toBe(false);
    expect(j.porteurs.doran!.poste).toBe('generateur');
  });

  it('un Porteur au travail peut rejoindre Mon escouade', () => {
    const j = pret();
    const libre = escouadePourDepart({ ...j, escouade: [] }).find((id) => !['ilka', 'doran', 'vela'].includes(id));
    if (!libre) return;
    expect(poster(j, libre, 'generateur').ok).toBe(true);
    expect(placerDansEscouade(j, 0, libre).ok).toBe(true);
  });

  it('partir enregistre l’escouade choisie au départ', () => {
    const j = pret();
    expect(partir(j, ['vela', 'ilka', 'doran'], 1).ok).toBe(true);
    expect(j.escouade).toEqual(['vela', 'ilka', 'doran']);
  });
});

describe('Les pastilles « Nouveau »', () => {
  it('une nouvelle partie ne montre rien de nouveau', () => {
    const j = nouveauJeu(0, 1);
    expect(porteursNouveaux(j)).toEqual([]);
    expect(cartesNouvelles(j)).toEqual([]);
  });

  it('les recrues et une carte trouvée sont nouvelles jusqu’à ce qu’on les voie', () => {
    const j = pret();
    expect(porteursNouveaux(j).length).toBeGreaterThan(0);
    j.collection['test@fer'] = { niveau: 1, doublons: 0 };
    expect(cartesNouvelles(j)).toEqual(['test@fer']);
    expect(marquerVus(j, 'cartes', ['test@fer'])).toBe(true);
    expect(marquerVus(j, 'cartes', ['test@fer'])).toBe(false);
    expect(cartesNouvelles(j)).toEqual([]);
    marquerVus(j, 'porteurs', porteursNouveaux(j));
    expect(porteursNouveaux(j)).toEqual([]);
  });

  it('une ancienne sauvegarde considère tout ce qu’elle a comme déjà vu', () => {
    const j = pret() as Partial<Jeu>;
    delete j.vus;
    expect(estJeuValide(j)).toBe(true);
    expect(porteursNouveaux(j as Jeu)).toEqual([]);
    expect(cartesNouvelles(j as Jeu)).toEqual([]);
  });
});

describe('Changer d’appareil (25 octobre 2026)', () => {
  it('la partie la plus avancée gagne, pas la plus récente', async () => {
    const { compareAvancement } = await import('../src/core/jeu');
    const neuve = nouveauJeu(0, 1);
    const avancee = nouveauJeu(0, 2);
    avancee.strate = 4;
    expect(compareAvancement(avancee, neuve)).toBe(1);
    expect(compareAvancement(neuve, avancee)).toBe(-1);
    expect(compareAvancement(neuve, nouveauJeu(0, 3))).toBe(0);
  });
});
