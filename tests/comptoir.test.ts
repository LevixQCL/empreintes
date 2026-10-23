// Devenir plus fort sans descendre (23 octobre 2026) : le Comptoir (acheter) et l'entraînement à la Tour du Noyau.
import { describe, expect, it } from 'vitest';
import { moduleDe, moduleDef } from '../src/core/donnees';
import {
  COMPTOIR, ENTRAINEMENT, XP, acheter, ameliorer, estJeuValide, etalsDuComptoir, gainsAmelioration, garnirComptoir, niveauPorteur,
  nouveauJeu, partir, plafondEntrainement, poster, prixComptoir, tick, xpEntrainement,
} from '../src/core/jeu';

const HEURE = 3_600_000;
const JOUR = 24 * HEURE;
const pret = () => { const j = nouveauJeu(0, 1); j.chambre = true; j.recrues = true; j.energie = 1e6; j.composants = 1e6; j.eclats = 1e3; return j; };
const construit = (niveau = 1) => { const j = pret(); j.batiments.comptoir = niveau; j.batiments.noyau = Math.max(j.batiments.noyau, niveau); garnirComptoir(j, 0); return j; };

describe('Le Comptoir', () => {
  it('commence à construire : aucune offre tant qu’il n’existe pas', () => {
    const j = pret();
    expect(j.batiments.comptoir).toBe(0);
    tick(j, HEURE);
    expect(j.comptoir.offres).toEqual([]);
    expect(acheter(j, 0).ok).toBe(false);
  });

  it('se construit comme un bâtiment, sans dépasser la Tour du Noyau', () => {
    const j = pret();
    expect(ameliorer(j, 'comptoir', 0).ok).toBe(true);
    expect(j.batiments.comptoir).toBe(1);
    expect(ameliorer(j, 'comptoir', 0).ok).toBe(false);
  });

  it('propose chaque jour des cartes différentes, du métal de chaque étal', () => {
    const j = construit(2);
    expect(j.comptoir.offres.map((id) => moduleDef(id).rarete)).toEqual(COMPTOIR.etals[2]);
    expect(new Set(j.comptoir.offres.map(moduleDe)).size).toBe(j.comptoir.offres.length);
    const hier = j.comptoir.offres.slice();
    tick(j, JOUR + HEURE);
    expect(j.comptoir.offres).toHaveLength(hier.length);
    expect(j.comptoir.offres).not.toEqual(hier);
  });

  it('ne vend jamais d’or ni de nacre, et l’argent seulement après la Strate −4', () => {
    for (const etals of COMPTOIR.etals) for (const r of etals) expect(['fer', 'cuivre', 'argent']).toContain(r);
    const j = construit(5);
    expect(etalsDuComptoir(j)).not.toContain('argent');
    j.strate = COMPTOIR.strateArgent; j.frontVaincu = true;
    expect(etalsDuComptoir(j)).toContain('argent');
  });

  it('un achat : la carte rejoint la collection, une seule fois par offre et par jour', () => {
    const j = construit(1);
    const id = j.comptoir.offres[0]!;
    const avant = j.composants;
    const doublons = j.collection[id]?.doublons;
    expect(acheter(j, 0).ok).toBe(true);
    expect(j.composants).toBe(avant - prixComptoir(id).composants);
    if (doublons === undefined) expect(j.collection[id]).toBeDefined();
    else expect(j.collection[id]!.doublons).toBe(doublons + 1);
    expect(acheter(j, 0).ok).toBe(false);
    tick(j, JOUR + HEURE);
    expect(j.comptoir.achetes).toEqual([]);
  });

  it('refuse un achat trop cher', () => {
    const j = construit(1);
    j.composants = 0;
    expect(acheter(j, 0).ok).toBe(false);
    expect(j.comptoir.achetes).toEqual([]);
  });

  it('agrandi dans la journée, il ajoute ses nouveaux étals sans changer les autres', () => {
    const j = construit(1);
    const avant = j.comptoir.offres.slice();
    j.batiments.comptoir = 2;
    garnirComptoir(j, HEURE);
    expect(j.comptoir.offres.slice(0, avant.length)).toEqual(avant);
    expect(j.comptoir.offres).toHaveLength(COMPTOIR.etals[2]!.length);
  });

  it('n’entame pas le hasard des trouvailles', () => {
    const j = construit(3);
    const rng = j.rng;
    tick(j, 3 * JOUR);
    expect(j.rng).toBe(rng);
  });

  it('montre ce que rapporte son niveau suivant', () => {
    const j = construit(1);
    expect(gainsAmelioration(j, 'comptoir')[0]).toMatchObject({ quoi: 'offres', avant: 3, apres: 4 });
  });

  it('une ancienne sauvegarde reçoit un Comptoir à construire', () => {
    const j = pret() as unknown as Record<string, unknown> & { batiments: Record<string, number> };
    delete j.comptoir;
    delete j.batiments.comptoir;
    expect(estJeuValide(j)).toBe(true);
    expect(j.batiments.comptoir).toBe(0);
    expect(j.comptoir).toMatchObject({ offres: [], achetes: [] });
  });
});

describe('L’entraînement à la Tour du Noyau', () => {
  it('un Porteur posté à la Tour gagne de l’XP avec le temps', () => {
    const j = pret();
    expect(poster(j, 'doran', 'noyau').ok).toBe(true);
    tick(j, 10 * HEURE);
    expect(j.porteurs.doran!.xp).toBeCloseTo(10 * xpEntrainement(j), 5);
    expect(j.porteurs.ilka!.xp ?? 0).toBe(0);
  });

  it('l’XP s’accumule aussi seconde par seconde', () => {
    const j = pret();
    poster(j, 'doran', 'noyau');
    for (let s = 1; s <= 3600; s++) tick(j, s * 1000);
    expect(j.porteurs.doran!.xp).toBeCloseTo(xpEntrainement(j), 5);
  });

  it('plafonne à 4 niveaux par niveau de la Tour', () => {
    const j = pret();
    poster(j, 'doran', 'noyau');
    tick(j, 1000 * JOUR);
    expect(plafondEntrainement(j)).toBe(ENTRAINEMENT.niveauxParNoyau);
    expect(niveauPorteur(j, 'doran').niveau).toBe(plafondEntrainement(j));
    j.batiments.noyau = 5;
    expect(plafondEntrainement(j)).toBe(XP.niveauMax);
  });

  it('s’il descend, il quitte l’entraînement', () => {
    const j = pret();
    poster(j, 'doran', 'noyau');
    // il peut descendre quand même (23 octobre 2026) : il quitte la Tour, l'entraînement s'arrête
    expect(partir(j, ['ilka', 'doran', 'vela'], 1, 5).ok).toBe(true);
    expect(j.porteurs.doran!.poste).toBeNull();
  });

  it('la Tour montre son entraînement au niveau suivant', () => {
    const j = pret();
    expect(gainsAmelioration(j, 'noyau').find((g) => g.quoi === 'entrainement')).toMatchObject({ avant: xpEntrainement(j), apres: ENTRAINEMENT.xpHeure[2] });
  });
});
