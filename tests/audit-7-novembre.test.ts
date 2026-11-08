import { describe, expect, it } from 'vitest';
import { ajouter, creerCombat, lancer, mainBloquee, tousEnnemis } from '../src/core/combat';
import { BATIMENTS, PORTEURS, gesteDeCarte } from '../src/core/donnees';

// Corrections de l'audit complet du 7 novembre 2026
const equipe = () => PORTEURS.slice(0, 3).map((p) => ({ id: p.id, pv: p.pvMax, pvMax: p.pvMax, aTerre: false }));
const jouerUneCarte = (s: ReturnType<typeof creerCombat>) => {
  s.main = [{ ...gesteDeCarte('bond@fer', 'ilka'), uid: 'b' }];
  ajouter(s, 'b'); lancer(s);
};

describe('Audit du 7 novembre : district', () => {
  it('chaque bâtiment a un coût pour chaque niveau jusqu’à son niveau max', () => {
    for (const b of BATIMENTS) expect(b.couts, b.id).toHaveLength(b.niveauMax);
  });
});

describe('Audit du 7 novembre : combat', () => {
  it('un renfort appelé avant −4 n’a pas de traits, comme le gardien qui l’appelle', () => {
    const s = creerCombat({ porteurs: equipe(), ennemiId: 'confluence', rng: 7, traitsEnnemis: false });
    s.ennemi.pv = s.ennemi.pvMax = 9999;
    s.intention = { type: 'appel', nom: 'Appel' };
    jouerUneCarte(s);
    const renfort = tousEnnemis(s).find((e) => e.rejeton)!;
    expect(renfort).toBeTruthy();
    expect(renfort.sansTraits).toBe(true);
  });

  it('un ennemi qui voulait soigner ou couvrir un allié tombé ne se protège pas lui-même', () => {
    for (const type of ['bouclier', 'soin'] as const) {
      const s = creerCombat({ porteurs: equipe(), ennemiId: 'pilleur', rng: 7 });
      s.ennemi.pv = s.ennemi.pvMax = 9999;
      s.ennemi.pv = 5000;
      s.intention = type === 'soin' ? { type, nom: 'Soigner les siens', v: 18, allie: true } : { type, v: 14, allie: true };
      jouerUneCarte(s);
      expect(s.ennemi.bouclier, type).toBe(0);
      if (type === 'soin') expect(s.ennemi.pv).toBeLessThanOrEqual(5000);
    }
  });

  const de = (l: string) => PORTEURS.slice(0, 3).find((p) => p.lignee === l)!.id;
  const degatsDe = (pv: number) => {
    const s = creerCombat({ porteurs: equipe(), ennemiId: 'pilleur', rng: 7 });
    s.ennemi.pv = s.ennemi.pvMax = 9999;
    const tech = s.porteurs.find((p) => p.id === de('tech'))!;
    tech.pv = pv;
    s.main = [{ ...gesteDeCarte('coeur-surregime@or', tech.id), uid: 'c' }];
    ajouter(s, 'c'); lancer(s);
    return { degats: 9999 - s.ennemi.pv, pv: tech.pv };
  };

  it('la Surtension à 1 PV ne coûte rien et ne donne rien', () => {
    const plein = degatsDe(60), a1 = degatsDe(1);
    expect(a1.degats).toBeLessThan(plein.degats);
  });

  it('la Ténacité ne dure que le tour ennemi', () => {
    const s = creerCombat({ porteurs: equipe(), ennemiId: 'pilleur', rng: 7 });
    s.ennemi.pv = s.ennemi.pvMax = 9999;
    s.main = [{ ...gesteDeCarte('racines-meres@nacre', de('bio')), uid: 'r' }];
    ajouter(s, 'r'); lancer(s);
    expect(s.tenace).toBeFalsy();
  });

  it('le Rappel ne renvoie pas une carte à usage unique déjà utilisée', () => {
    const s = creerCombat({ porteurs: equipe(), ennemiId: 'pilleur', rng: 7 });
    s.ennemi.pv = s.ennemi.pvMax = 9999;
    const forte = { ...gesteDeCarte('coeur-surregime@or', de('tech')), uid: 'u', v: 999 };
    s.main = [{ ...gesteDeCarte('boucle-memoire@argent', de('reso')), uid: 'r' }, forte];
    ajouter(s, 'r'); ajouter(s, 'u');
    forte.epuise = true;
    lancer(s);
    expect(s.pioche.includes(forte)).toBe(false);
    expect(s.main.includes(forte)).toBe(false);
  });

  it('une main faite de places vides permet de passer le tour', () => {
    const s = creerCombat({ porteurs: equipe(), ennemiId: 'pilleur', rng: 7 });
    s.main = s.main.map((g, i) => ({ ...g, uid: `v${i}`, vide: true, id: 'vide', v: 0 }));
    expect(mainBloquee(s)).toBe(true);
    const tour = s.tour;
    lancer(s);
    expect(s.tour).toBe(tour + 1);
    expect(s.main.some((g) => !g.vide)).toBe(true);
  });
});

describe('Audit du 7 novembre : Empreinte', () => {
  it('l’Empreinte ne copie pas l’effet d’une carte éteinte (son Porteur est à terre)', async () => {
    const { effetsEnJeu } = await import('../src/core/combat');
    const fissure = { effet: { type: 'fissure' as const, part: 0.5 } };
    const empreinte = { effet: { type: 'empreinte' as const } };
    expect(effetsEnJeu(empreinte, [fissure, empreinte], 1)[0]?.type).toBe('fissure');
    expect(effetsEnJeu(empreinte, [fissure, empreinte], 1, false, true)[0]).toBeUndefined();
  });
});

describe('Audit du 7 novembre : Accord', () => {
  it('après un 9, l’Accord reste à 9 (pas de Fréquence 10) ; en tête devant un 1, il reste à 1', async () => {
    const { frequencesEffectives } = await import('../src/core/regles');
    const accord = { f: 5, effet: { type: 'accord' as const } };
    expect(frequencesEffectives([{ f: 7 }, { f: 8 }, { f: 9 }, accord] as never)).toEqual([7, 8, 9, 9]);
    expect(frequencesEffectives([accord, { f: 1 }, { f: 2 }] as never)).toEqual([1, 1, 2]);
  });
});

// Audit de l'économie du 7 novembre 2026 (scripts/audit-economie.ts) : ce qui était perdu, inutile ou en mur
import { nouveauJeu, tick, ouvrirArchive, acheterEclat, eclatsAuComptoir, COMPTOIR, ARCHIVE, CREUSEURS, chanceCreuseurFouille,
  noyauRequis, stockage, energieParHeure, pvMaxCombat, partPvClinique } from '../src/core/jeu';
import { EPREUVES, forceEpreuve } from '../src/core/partie/descentes';
import { forceStrate } from '../src/core/expedition';
import { PROFILS, mediane, simulerParcours } from '../src/core/parcours';

const T0 = Date.UTC(2026, 10, 2, 9); // un lundi
const JOUR = 86_400_000;
const partie = () => { const j = nouveauJeu(T0, 3); j.chambre = true; j.recrues = true; return j; };

describe('Audit du 7 novembre : économie', () => {
  it('un Butin de la semaine pas ouvert n’est plus écrasé par le suivant', () => {
    const j = partie();
    j.archive.points = ARCHIVE.paliers[3]!;
    tick(j, T0 + 7 * JOUR);
    j.archive.points = ARCHIVE.paliers[0]!;
    tick(j, T0 + 14 * JOUR);
    expect(j.archive.aOuvrir).toBe(4);
    expect(ouvrirArchive(j).ok).toBe(true);
    expect(j.archive.aOuvrir).toBe(1);
    expect(ouvrirArchive(j).ok).toBe(true);
    expect(ouvrirArchive(j).ok).toBe(false);
  });

  it('le Comptoir vend quelques Éclats par jour contre des composants', () => {
    const j = partie();
    j.batiments.comptoir = 6;
    j.composants = 10_000;
    const max = eclatsAuComptoir(j).max;
    // 8 novembre 2026 : de 1 à 6 par jour selon le niveau (4 au niveau 6), à 500, 700 puis 1 000 composants
    expect(max).toBe(4);
    const e0 = j.eclats;
    for (let k = 0; k < max; k++) expect(acheterEclat(j, T0).ok).toBe(true);
    expect(acheterEclat(j, T0).ok).toBe(false);
    expect(j.eclats).toBe(e0 + max);
    expect(j.composants).toBe(10_000 - (500 + 700 + 1000 + 1000));
    expect(COMPTOIR.eclats.parJour[1]).toBe(1);
    expect(COMPTOIR.eclats.parJour[10]).toBe(6);
    expect(acheterEclat(j, T0 + JOUR).ok).toBe(true);
  });

  it('la réserve d’énergie tient au moins une journée de production', () => {
    const j = partie();
    j.batiments.generateur = 10;
    j.batiments.noyau = 6;
    expect(stockage(j)).toBeGreaterThanOrEqual(energieParHeure(j) * 24 - 100);
  });

  it('la Clinique donne des PV max à partir du niveau 4', () => {
    const j = partie();
    j.batiments.clinique = 3;
    const avant = pvMaxCombat(j, 'doran');
    expect(partPvClinique(j)).toBe(0);
    j.batiments.clinique = 10;
    expect(pvMaxCombat(j, 'doran')).toBeGreaterThan(avant * 1.1);
  });

  it('les fouilles profondes ramènent plus de creuseurs, et le Noyau freine encore à −10', () => {
    expect(chanceCreuseurFouille(5)).toBe(CREUSEURS.fouille);
    expect(chanceCreuseurFouille(6)).toBeGreaterThan(CREUSEURS.fouille);
    // 8 novembre 2026 : Noyau 8 pour −9, 9 pour −10 (avant 7 : atteint au jour 10, il ne freinait plus rien)
    expect(noyauRequis(9)).toBe(8);
    expect(noyauRequis(10)).toBe(9);
    for (let s = 3; s <= 10; s++) expect(noyauRequis(s)).toBeGreaterThanOrEqual(noyauRequis(s - 1));
  });

  it('les Épreuves s’allègent à partir de −4', () => {
    const ep = EPREUVES.find((e) => !e.imposee && !e.forceBas)!;
    expect(forceEpreuve(ep, 3) / forceStrate(3)).toBeCloseTo(ep.force, 5);
    expect(forceEpreuve(ep, 4) / forceStrate(4)).toBeLessThan(ep.force);
  });

  // 8 novembre 2026 : les Éclats du Comptoir et du Générateur accélèrent la Tour ; mesuré j25 (médiane de 16), voir le rapport du jour.
  // 8 novembre, midi : chantiers 6-10 en énergie, fouilleurs du jour, pillages simulés : j29 (cible de Bryan : le jour 30)
  it('un joueur occasionnel ouvre la Strate −10 entre le jour 27 et le jour 32', () => {
    const jours = Array.from({ length: 16 }, (_, i) => simulerParcours(PROFILS.occasionnel, 40, 1000 + i * 7919, { joueur: 'moyen', jusqua: 10 }).ouverture[10] ?? Infinity);
    const d = mediane(jours);
    expect(d).toBeGreaterThanOrEqual(27);
    expect(d).toBeLessThanOrEqual(32);
  }, 120_000);
});

// Les Strates du Fond (audit du 7 novembre 2026) : après −10, une particularité empruntée qui change chaque semaine
import { FOND, modeleStrate, particularite } from '../src/core/strates';
import { nouvelleExploration } from '../src/core/expedition';
import { gageJour } from '../src/core/partie/fleche';

describe('Audit du 7 novembre : le Fond', () => {
  it('au-dessus de −11 rien ne change ; dessous, la particularité tourne chaque semaine', () => {
    for (let s = 1; s <= 10; s++) expect(modeleStrate(s, 5)).toBe(s);
    const vues = new Set(Array.from({ length: FOND.ordre.length }, (_, w) => modeleStrate(11, w)));
    expect(vues.size).toBe(FOND.ordre.length);
    expect(modeleStrate(11, 0)).not.toBe(modeleStrate(11, 1));
    for (const m of FOND.ordre) expect(particularite(m)).toBeDefined();
  });

  it('une exploration du Fond garde la particularité empruntée et la pose sur son plan', () => {
    const p = { id: 'ilka', pv: 30, pvMax: 30, aTerre: false };
    const w = FOND.ordre.indexOf(7) - (12 - FOND.des);
    const x = nouvelleExploration({ porteurs: [p], deck: [], strate: 12, rng: 42, semaine: (w + 70) % FOND.ordre.length });
    expect(x.modele).toBe(7);
    expect(x.carte!.salles.some((s) => s.double)).toBe(true);
  });

  it('la garde d’un quai rapporte un Éclat par jour dès le quai 10', () => {
    expect(gageJour(9).eclats).toBe(0);
    expect(gageJour(10).eclats).toBe(1);
  });
});

describe('Audit du 8 novembre : l’énergie en trop', () => {
  it('le Générateur condense des Éclats à partir du niveau 4, de 1 à 3 par jour', async () => {
    const { nouveauJeu, cristalliser, cristallisationsMax, CRISTALLISEUR } = await import('../src/core/jeu');
    const j = nouveauJeu(0, 1);
    j.batiments.generateur = 3;
    j.energie = 10_000;
    expect(cristalliser(j, 0).ok).toBe(false);
    j.batiments.generateur = 4;
    expect(cristallisationsMax(j)).toBe(1);
    j.batiments.generateur = 9;
    expect(cristallisationsMax(j)).toBe(3);
    const e0 = j.eclats;
    for (let k = 0; k < 3; k++) expect(cristalliser(j, 0).ok).toBe(true);
    expect(cristalliser(j, 0).ok).toBe(false);
    expect(j.eclats).toBe(e0 + 3);
    expect(j.energie).toBe(10_000 - 3 * CRISTALLISEUR.energie);
  });
});
