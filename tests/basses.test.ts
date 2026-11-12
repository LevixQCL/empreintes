import { describe, expect, it } from 'vitest';
import { nouveauJeu, tick, BASSES, bulleBasses, envoyerBasses, nbFoyers, prochainSecours, raisonLieu, secteurSuivant, secteursOuverts } from '../src/core/jeu';
import { MAREE_REELLE, SECTEURS, coefMaree, etatMaree, indexBasse } from '../src/core/digue';
import { FAMILLES_DISTRICT, familleDef } from '../src/core/familles';

const H = 3_600_000;

function partie(strate = 2) {
  const j = nouveauJeu(0, 1);
  j.chambre = true; j.recrues = true;
  j.strate = strate + 1;
  j.energie = 1e6;
  return j;
}

describe('La marée réelle (ambiance)', () => {
  it('une marée basse toutes les 12 h 25, haute à mi-chemin', () => {
    const t0 = MAREE_REELLE.epoque;
    expect(etatMaree(t0).niveau).toBeCloseTo(0, 5);
    expect(etatMaree(t0 + MAREE_REELLE.periode / 2).niveau).toBeCloseTo(1, 5);
    expect(indexBasse(t0 + 2.5 * MAREE_REELLE.periode)).toBe(2);
    const e = etatMaree(t0 + H);
    expect(e.montante).toBe(true);
    expect(e.prochaineBasse).toBeCloseTo(t0 + MAREE_REELLE.periode, -1);
  });
  it('les grandes marées tombent aux nouvelles et pleines lunes, pas aux quartiers', () => {
    const nl = MAREE_REELLE.nouvelleLune + 300 * MAREE_REELLE.lunaison;
    expect(coefMaree(nl)).toBe(115);
    expect(coefMaree(nl + MAREE_REELLE.lunaison / 2)).toBe(115);
    expect(coefMaree(nl + MAREE_REELLE.lunaison / 4)).toBe(25);
    expect(etatMaree(nl).grande).toBe(true);
  });
});

describe('Secourir une famille (12 novembre 2026 : les Basses fondues dans le Port)', () => {
  it('48 familles : 20 à secourir, une par lieu, toutes différentes', () => {
    const lieux = SECTEURS.flatMap((s) => s.lieux);
    expect(lieux).toHaveLength(20);
    expect(new Set(lieux.map((l) => l.famille)).size).toBe(20);
    for (const l of lieux) expect(familleDef(l.famille)?.arrivee, l.id).toBe('basses');
    expect(FAMILLES_DISTRICT.filter((f) => f.arrivee === 'basses')).toHaveLength(20);
  });

  it('les secours partent après la Strate −2, un quartier noyé de plus tous les deux Strates', () => {
    expect(prochainSecours(partie(1))).toBeNull();
    expect(secteursOuverts(partie(2)).map((s) => s.id)).toEqual(['lavoirs']);
    expect(secteursOuverts(partie(5))).toHaveLength(3);
    expect(secteurSuivant(partie(2))?.id).toBe('treuils');
  });

  it('plus de batardeau : la prochaine famille se propose toute seule, dans l’ordre du flanc', () => {
    const j = partie();
    const [premier, second] = SECTEURS[0]!.lieux;
    expect(prochainSecours(j)?.lieu.id).toBe(premier!.id);
    expect(raisonLieu(j, premier!.id)).toBeNull();
    expect(bulleBasses(j, 0).aFaire).toBe(true);
    const foyers = nbFoyers(j);
    expect(envoyerBasses(j, premier!.id, 'ilka', 0).ok).toBe(true);
    // une seule équipe de secours à la fois
    expect(envoyerBasses(j, second!.id, 'doran', 0).ok).toBe(false);
    expect(bulleBasses(j, 0)).toEqual({ expedition: true, aFaire: false });
    tick(j, BASSES.heures * H + 1);
    expect(j.foyers).toContain(premier!.famille);
    expect(nbFoyers(j)).toBe(foyers + 1);
    expect(j.rapports?.at(-1)?.basses).toEqual({ lieu: premier!.id, famille: premier!.famille });
    expect(raisonLieu(j, premier!.id)).toContain('déjà');
    expect(prochainSecours(j)?.lieu.id).toBe(second!.id);
  });

  it('un quartier trop bas sur le flanc attend sa Strate ; tout le flanc vidé, plus rien à proposer', () => {
    const j = partie();
    expect(raisonLieu(j, SECTEURS[1]!.lieux[0]!.id)).toContain('−3');
    j.basses = { batardeau: null, semaine: -1, vu: -1, depots: 0, expedition: null, faits: SECTEURS[0]!.lieux.map((l) => l.id) };
    expect(prochainSecours(j)).toBeNull();
    const fin = partie(10);
    fin.basses = { batardeau: null, semaine: -1, vu: -1, depots: 0, expedition: null, faits: SECTEURS.flatMap((s) => s.lieux.map((l) => l.id)) };
    expect(prochainSecours(fin)).toBeNull();
    expect(secteurSuivant(fin)).toBeNull();
  });

  it('une sauvegarde d’avant : le batardeau est oublié, les dépôts qui attendaient sont rendus en minerai', () => {
    const j = partie(3);
    j.basses = { batardeau: 'treuils', semaine: 3, vu: 12, depots: 2, expedition: null, faits: ['bac-cordes'] };
    const avant = j.composants;
    tick(j, H);
    expect(j.basses.depots).toBe(0);
    expect(j.composants).toBe(avant + 2 * Math.round(BASSES.depot * 1.5));
    expect(prochainSecours(j)?.lieu.id).toBe('maison-eclusier');
  });
});

import { confierSouvenir, raisonSouvenir, souvenirsLibres, journalCarte, VECU } from '../src/core/jeu';

describe('Les souvenirs confiés aux cartes (fusion avec le vécu)', () => {
  it('seulement sur une carte au palier Sillon, une famille par carte et une carte par famille, aucun effet', () => {
    const j = partie();
    const [a, b] = Object.keys(j.collection);
    expect(raisonSouvenir(j, a!)).toContain('Sillon');
    expect(confierSouvenir(j, a!, 'ruel')).toBe(false);
    const sillon = { l: 0, v: VECU.paliers[1]! / 2, d: 0, b: 0, s: 0, a: 0, f: 0, z: 5, g: [3], ga: [3] };
    j.vecu = { [a!]: { ...sillon }, [b!]: { ...sillon, g: [3], ga: [3] } };
    expect(confierSouvenir(j, a!, 'pellan')).toBe(false); // pas encore au district
    expect(confierSouvenir(j, a!, 'ruel')).toBe(true);
    expect(confierSouvenir(j, a!, 'abady')).toBe(false);
    expect(confierSouvenir(j, b!, 'ruel')).toBe(false);
    expect(souvenirsLibres(j)).toEqual(['abady']);
    expect(journalCarte(j.vecu[a!]).at(-1)).toContain('Porte le souvenir des Ruel');
  });
});
