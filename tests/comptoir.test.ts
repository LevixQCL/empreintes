// Devenir plus fort sans descendre (23 octobre 2026) : le Comptoir (acheter) et l'entraînement à la Tour du Noyau.
import { describe, expect, it } from 'vitest';
import { moduleDe, moduleDef } from '../src/core/donnees';
import {
  COMPTOIR, ENTRAINEMENT, XP, acheter, ameliorer, estJeuValide, etalsDuComptoir, gainsAmelioration, garnirComptoir, niveauPorteur,
  nouveauJeu, partir, plafondEntrainement, poster, prixComptoir, tick, apercuSeance, accorderSeance, DISTRICT, placesEntrainement,
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

describe('L’entraînement à la Tour : des séances d’un niveau (28 octobre 2026)', () => {
  it('une séance fait monter d’un seul niveau, puis le Porteur quitte la salle', () => {
    const j = pret();
    const a = apercuSeance(j, 'doran')!;
    expect(a.cible).toBe(2);
    expect(poster(j, 'doran', 'noyau').ok).toBe(true);
    const annonces = tick(j, j.dernierTick + 1000 * JOUR);
    expect(niveauPorteur(j, 'doran').niveau).toBe(2);
    expect(j.porteurs.doran!.poste).toBeNull();
    expect(j.seances).toEqual([]);
    expect(j.derniereSeance).toBe('doran');
    expect(annonces.some((t) => t.includes('séance'))).toBe(true);
    // rien ne se relance tout seul
    tick(j, j.dernierTick + 1000 * JOUR);
    expect(niveauPorteur(j, 'doran').niveau).toBe(2);
  });

  it('l’énergie se paie au lancement, et la durée annoncée est respectée', () => {
    const j = pret();
    j.energie = 200;
    const a = apercuSeance(j, 'doran')!;
    poster(j, 'doran', 'noyau');
    expect(j.energie).toBe(200 - a.energie);
    tick(j, j.dernierTick + (a.heures * HEURE) / 2);
    expect(niveauPorteur(j, 'doran').niveau).toBe(1);
    tick(j, j.dernierTick + (a.heures * HEURE) / 2 + 1000);
    expect(niveauPorteur(j, 'doran').niveau).toBe(2);
  });

  it('l’XP s’accumule aussi seconde par seconde', () => {
    const j = pret();
    const a = apercuSeance(j, 'doran')!;
    poster(j, 'doran', 'noyau');
    for (let s = 1; s <= 600; s++) tick(j, j.dernierTick + 1000);
    expect(j.porteurs.doran!.xp).toBeCloseTo((a.xp / a.heures) / 6, 5);
  });

  it('sans assez d’énergie, la séance ne se lance pas', () => {
    const j = pret();
    j.energie = 0;
    expect(poster(j, 'doran', 'noyau').ok).toBe(false);
    expect(j.porteurs.doran!.poste).not.toBe('noyau');
  });

  it('interrompre garde l’XP gagnée et rend l’énergie du reste', () => {
    const j = pret();
    j.batiments.generateur = 0;
    j.energie = 100;
    const a = apercuSeance(j, 'doran')!;
    poster(j, 'doran', 'noyau');
    tick(j, j.dernierTick + (a.heures * HEURE) / 2);
    const xp = j.porteurs.doran!.xp!;
    const avant = j.energie;
    expect(poster(j, 'doran', null).ok).toBe(true);
    expect(j.porteurs.doran!.xp).toBe(xp);
    expect(j.energie - avant).toBe(Math.floor(a.energie / 2));
    expect(j.seances).toEqual([]);
  });

  it('la séance suivante reprend là où l’XP s’était arrêtée : moins longue et moins chère', () => {
    const j = pret();
    const plein = apercuSeance(j, 'doran')!;
    poster(j, 'doran', 'noyau');
    tick(j, j.dernierTick + (plein.heures * HEURE) / 2);
    poster(j, 'doran', null);
    const suite = apercuSeance(j, 'doran')!;
    expect(suite.heures).toBeCloseTo(plein.heures / 2, 5);
    expect(suite.energie).toBeLessThanOrEqual(Math.ceil(plein.energie / 2));
  });

  it('plafonne à 4 niveaux par niveau de la Tour', () => {
    const j = pret();
    for (let k = 0; k < 10; k++) { poster(j, 'doran', 'noyau'); tick(j, j.dernierTick + 10 * JOUR); }
    expect(plafondEntrainement(j)).toBe(ENTRAINEMENT.niveauxParNoyau);
    expect(niveauPorteur(j, 'doran').niveau).toBe(plafondEntrainement(j));
    expect(poster(j, 'doran', 'noyau').ok).toBe(false);
    j.batiments.noyau = 5;
    expect(plafondEntrainement(j)).toBe(XP.niveauMax);
  });

  it('chaque séance coûte moins que le stockage de la Tour qui l’autorise', () => {
    const j = pret();
    for (let noyau = 1; noyau <= 5; noyau++) {
      j.batiments.noyau = noyau;
      j.porteurs.doran!.xp = 0;
      const max = plafondEntrainement(j);
      // le Porteur juste sous le plafond : la séance la plus chère de cette Tour
      let xp = 0; for (let n = 1; n < max - 1; n++) xp += Math.round(12 * n ** 1.6);
      j.porteurs.doran!.xp = xp;
      expect(apercuSeance(j, 'doran')!.energie).toBeLessThan(DISTRICT.stockage[noyau]!);
    }
  });

  it('s’il descend, il quitte l’entraînement et récupère l’énergie du reste', () => {
    const j = pret();
    poster(j, 'doran', 'noyau');
    expect(partir(j, ['ilka', 'doran', 'vela'], 1, 5).ok).toBe(true);
    expect(j.porteurs.doran!.poste).toBeNull();
    expect(j.seances).toEqual([]);
  });

  it('les places de la Tour suivent son niveau : 1, puis 2 au niveau 3, 3 au niveau 5 (28 octobre 2026)', () => {
    const j = pret();
    j.energie = 5000;
    expect([1, 2, 3, 4, 5].map((n) => { j.batiments.noyau = n; return placesEntrainement(j); })).toEqual([1, 1, 2, 2, 3]);
    j.batiments.noyau = 1;
    expect(poster(j, 'doran', 'noyau').ok).toBe(true);
    // la place est prise : un autre ne chasse plus le premier
    expect(poster(j, 'ilka', 'noyau').ok).toBe(false);
    expect(j.porteurs.doran!.poste).toBe('noyau');
    j.batiments.noyau = 3;
    expect(poster(j, 'ilka', 'noyau').ok).toBe(true);
    expect(j.seances!.map((s) => s.porteur)).toEqual(['doran', 'ilka']);
    // chaque séance avance de son côté, et l'arrêt de l'une ne touche pas l'autre
    poster(j, 'doran', null);
    expect(j.seances!.map((s) => s.porteur)).toEqual(['ilka']);
    tick(j, j.dernierTick + 1000 * JOUR);
    expect(niveauPorteur(j, 'ilka').niveau).toBe(2);
    expect(j.seances).toEqual([]);
  });

  it('une ancienne sauvegarde à une seule séance la retrouve dans la liste', () => {
    const j = pret();
    poster(j, 'doran', 'noyau');
    j.seance = j.seances![0]!;
    delete j.seances;
    accorderSeance(j);
    expect(j.seance).toBeUndefined();
    expect(j.seances).toMatchObject([{ porteur: 'doran', cible: 2 }]);
  });

  it('une ancienne sauvegarde avec un Porteur posté reçoit une séance offerte', () => {
    const j = pret();
    j.porteurs.doran!.poste = 'noyau';
    delete j.seances;
    accorderSeance(j);
    expect(j.seances).toMatchObject([{ porteur: 'doran', cible: 2, energie: 0 }]);
  });

  it('la Tour montre le plafond d’entraînement au niveau suivant', () => {
    const j = pret();
    expect(gainsAmelioration(j, 'noyau').find((g) => g.quoi === 'entrainement')).toMatchObject({ avant: 4, apres: 8 });
  });
});
