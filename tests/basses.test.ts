import { describe, expect, it } from 'vitest';
import { nouveauJeu, tick, BASSES, bulleBasses, coutBatardeau, dresserBatardeau, envoyerBasses, nbFoyers, ramasserDepot, raisonLieu, secteursOuverts } from '../src/core/jeu';
import { MAREE_REELLE, SECTEURS, coefMaree, etatMaree, indexBasse } from '../src/core/digue';
import { FAMILLES_DISTRICT, familleDef } from '../src/core/familles';

const H = 3_600_000;
const JOUR = 24 * H;

function partie(strate = 1) {
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

describe('Les Basses (7 novembre 2026)', () => {
  it('48 familles : 20 dans les Basses, une par lieu, toutes différentes', () => {
    const lieux = SECTEURS.flatMap((s) => s.lieux);
    expect(lieux).toHaveLength(20);
    expect(new Set(lieux.map((l) => l.famille)).size).toBe(20);
    for (const l of lieux) expect(familleDef(l.famille)?.arrivee, l.id).toBe('basses');
    expect(FAMILLES_DISTRICT.filter((f) => f.arrivee === 'basses')).toHaveLength(20);
  });

  it('l’écluse s’ouvre après la Strate −1, un secteur tous les deux Strates', () => {
    expect(ramasserDepot(partie(0), 0).ok).toBe(false);
    expect(secteursOuverts(partie(1)).map((s) => s.id)).toEqual(['lavoirs']);
    expect(secteursOuverts(partie(5))).toHaveLength(3);
  });

  it('chaque marée basse laisse un dépôt, deux au plus, et ils attendent sans limite', () => {
    const j = partie();
    const t = MAREE_REELLE.epoque + 10 * MAREE_REELLE.periode;
    tick(j, t);
    expect(j.basses!.depots).toBe(1);
    tick(j, t + 30 * JOUR);
    expect(j.basses!.depots).toBe(BASSES.depotsMax);
    const avant = j.composants;
    expect(ramasserDepot(j, t + 30 * JOUR).ok).toBe(true);
    expect(ramasserDepot(j, t + 30 * JOUR).ok).toBe(true);
    expect(ramasserDepot(j, t + 30 * JOUR).ok).toBe(false);
    expect(j.composants).toBeGreaterThan(avant);
  });

  it('le batardeau : le premier est gratuit, puis un déplacement par semaine pour six heures de production', () => {
    const j = partie(3);
    const e = j.energie;
    expect(dresserBatardeau(j, 'lavoirs', 0).ok).toBe(true);
    expect(j.energie).toBe(e);
    expect(dresserBatardeau(j, 'ecole', 0).ok).toBe(false);
    const cout = coutBatardeau(j);
    expect(dresserBatardeau(j, 'treuils', 0).ok).toBe(true);
    expect(j.energie).toBe(e - cout);
    expect(dresserBatardeau(j, 'lavoirs', 0).ok).toBe(false);
    expect(dresserBatardeau(j, 'lavoirs', 8 * JOUR).ok).toBe(true);
  });

  it('un Porteur va chercher la famille d’un lieu à sec : elle rejoint le district, une seule fois', () => {
    const j = partie();
    const lieu = SECTEURS[0]!.lieux[0]!;
    expect(raisonLieu(j, lieu.id)).toContain('batardeau');
    dresserBatardeau(j, 'lavoirs', 0);
    expect(bulleBasses(j, 0).aFaire).toBe(true);
    const foyers = nbFoyers(j);
    expect(envoyerBasses(j, lieu.id, 'ilka', 0).ok).toBe(true);
    expect(envoyerBasses(j, SECTEURS[0]!.lieux[1]!.id, 'doran', 0).ok).toBe(false);
    tick(j, BASSES.heures * H + 1);
    expect(j.foyers).toContain(lieu.famille);
    expect(nbFoyers(j)).toBe(foyers + 1);
    expect(j.rapports?.at(-1)?.basses).toEqual({ lieu: lieu.id, famille: lieu.famille });
    expect(raisonLieu(j, lieu.id)).toContain('déjà');
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
