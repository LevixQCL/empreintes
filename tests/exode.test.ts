import { describe, expect, it } from 'vitest';
import { nouveauJeu, FLECHE } from '../src/core/jeu';
import { EXODE, ETAPES_EXODE, avancementExode, avancerExode, etapeExode, exodeOuvert, lancerExode, raisonExode } from '../src/core/partie/exode';

const H = 3_600_000;
function pret() {
  const j = nouveauJeu(0);
  j.strate = 11; j.batiments.noyau = 10; j.energie = 1_000_000; j.eclats = 5000;
  return j;
}
/** fait toutes les étapes jusqu'à `n` terminées */
function faire(j: ReturnType<typeof pret>, n: number) {
  let now = 0;
  while ((j.exode?.etape ?? 0) < n) { expect(lancerExode(j, now).ok).toBe(true); now = j.exode!.fin!; avancerExode(j, now); }
  return now;
}

describe('L’Exode', () => {
  it('s’ouvre une fois le gardien de −10 vaincu et la Tour au niveau 10', () => {
    const j = nouveauJeu(0);
    j.energie = 100_000; j.eclats = 500;
    expect(exodeOuvert(j)).toBe(false);
    expect(lancerExode(j, 0).ok).toBe(false);
    j.strate = 10; j.frontVaincu = true;
    expect(exodeOuvert(j)).toBe(false);
    j.batiments.noyau = 10;
    expect(exodeOuvert(j)).toBe(true);
    expect(lancerExode(j, 0).ok).toBe(true);
  });

  it('le barème (13 novembre 2026) : 670 cristaux et 5 Éclats la première étape, environ 131 000 et 860 en tout', () => {
    expect(etapeExode(0)).toEqual({ cristaux: 670, eclats: 5, heures: 2 });
    expect(etapeExode(49).heures).toBe(12);
    const total = Array.from({ length: ETAPES_EXODE }, (_, i) => etapeExode(i)).reduce((t, e) => ({ c: t.c + e.cristaux, e: t.e + e.eclats }), { c: 0, e: 0 });
    expect(total.c).toBeGreaterThan(129_000);
    expect(total.c).toBeLessThan(133_000);
    expect(total.e).toBeGreaterThan(820);
    expect(total.e).toBeLessThan(900);
  });

  it('une étape se paie, prend du temps, et une seule tourne à la fois', () => {
    const j = pret();
    expect(lancerExode(j, 0).ok).toBe(true);
    expect(j.energie).toBe(1_000_000 - 670);
    expect(j.eclats).toBe(5000 - 5);
    expect(lancerExode(j, 0).ok).toBe(false);
    expect(avancerExode(j, 2 * H - 1)).toEqual([]);
    expect(avancerExode(j, 2 * H).length).toBe(1);
    expect(avancementExode(j).habitants).toBe(EXODE.habitantsParEtape);
    expect(raisonExode(j)).toBeNull();
  });

  it('un chantier fini donne une Perle de nacre (13 novembre 2026), plus de carte de nacre', () => {
    const j = pret();
    faire(j, 9);
    expect(j.perles ?? 0).toBe(0);
    faire(j, 10);
    expect(j.perles).toBe(1);
    expect(j.choix.filter((x) => x.source === 'exode').length).toBe(0);
    expect(avancementExode(j).chantier).toBe(1);
  });

  it('le Passage demande le sommet de la Flèche, puis les convois partent sans fin', () => {
    const j = pret();
    let now = faire(j, 40);
    expect(lancerExode(j, now).ok).toBe(false);
    j.fleche = { quai: FLECHE.quais, record: FLECHE.quais, recordLe: 0, recus: [], victoires: 0, defaites: 0 };
    now = faire(j, ETAPES_EXODE);
    const a = avancementExode(j);
    expect(a.fini).toBe(true);
    expect(a.habitants).toBe(a.habitantsMax);
    const avant = j.energie;
    expect(lancerExode(j, now).ok).toBe(true);
    expect(avant - j.energie).toBe(EXODE.convoi.cristaux);
    avancerExode(j, j.exode!.fin!);
    expect(j.exode!.convois).toBe(1);
    expect(j.exode!.etape).toBe(ETAPES_EXODE);
    expect(avancementExode(j).familles).toBe(EXODE.convoi.familles);
  });
});

describe('Le Livre V des Chroniques (13 novembre 2026)', () => {
  it('un chapitre s’ouvre à chaque chantier fini, le dernier avec le Passage', async () => {
    const { CHAPITRES, chapitreOuvert } = await import('../src/core/chroniques');
    const { chantiersExodeFinis } = await import('../src/core/partie/etat');
    const livre5 = CHAPITRES.filter((c) => c.livre === 5);
    expect(livre5.length).toBe(5);
    const j = pret();
    expect(livre5.filter((c) => chapitreOuvert(c, j.strate, chantiersExodeFinis(j))).length).toBe(0);
    faire(j, 20);
    expect(livre5.filter((c) => chapitreOuvert(c, j.strate, chantiersExodeFinis(j))).map((c) => c.id)).toEqual(['six-cents', 'porte-mer']);
  });
});

it('chantiersExodeFinis (etat.ts) suit le barème de l’Exode', async () => {
  const { chantiersExodeFinis } = await import('../src/core/partie/etat');
  const j = pret();
  expect(CHANTIERS_EXODE_NB()).toBe(5);
  expect(EXODE.etapes).toBe(10);
  j.exode = { etape: ETAPES_EXODE, convois: 3 };
  expect(chantiersExodeFinis(j)).toBe(5);
});
function CHANTIERS_EXODE_NB() { return ETAPES_EXODE / EXODE.etapes; }
