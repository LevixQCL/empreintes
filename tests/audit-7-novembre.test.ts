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
  noyauRequis, pvMaxCombat, partPvClinique } from '../src/core/jeu';
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

  it('le Comptoir vend quelques Éclats par jour contre des cristaux', () => {
    const j = partie();
    j.batiments.comptoir = 6;
    j.energie = 10_000;
    const max = eclatsAuComptoir(j).max;
    // 8 novembre 2026 : de 1 à 6 par jour selon le niveau (4 au niveau 6) ; 9 novembre 2026 : 300, 450 puis 650 cristaux
    expect(max).toBe(4);
    const e0 = j.eclats;
    for (let k = 0; k < max; k++) expect(acheterEclat(j, T0).ok).toBe(true);
    expect(acheterEclat(j, T0).ok).toBe(false);
    expect(j.eclats).toBe(e0 + max);
    expect(j.energie).toBe(10_000 - (300 + 450 + 650 + 650));
    expect(COMPTOIR.eclats.parJour[1]).toBe(1);
    expect(COMPTOIR.eclats.parJour[10]).toBe(6);
    expect(acheterEclat(j, T0 + JOUR).ok).toBe(true);
  });

  it('la Clinique donne des PV max à partir du niveau 4', () => {
    const j = partie();
    j.batiments.clinique = 3;
    const avant = pvMaxCombat(j, 'doran');
    expect(partPvClinique(j)).toBe(0);
    j.batiments.clinique = 10;
    expect(pvMaxCombat(j, 'doran')).toBeGreaterThan(avant * 1.1);
  });

  it('les fouilles profondes ramènent plus de creuseurs, et la Tour ne retient plus aucune Strate', () => {
    expect(chanceCreuseurFouille(5)).toBe(CREUSEURS.fouille);
    expect(chanceCreuseurFouille(6)).toBeGreaterThan(CREUSEURS.fouille);
    // 12 novembre 2026 : plus de verrou après le gardien (avant : Noyau 8 pour −9, 9 pour −10)
    for (let s = 2; s <= 15; s++) expect(noyauRequis(s)).toBe(1);
  });

  it('les Épreuves s’allègent à partir de −4', () => {
    const ep = EPREUVES.find((e) => !e.imposee && !e.forceBas)!;
    expect(forceEpreuve(ep, 3) / forceStrate(3)).toBeCloseTo(ep.force, 5);
    expect(forceEpreuve(ep, 4) / forceStrate(4)).toBeLessThan(ep.force);
  });

  // 8 novembre 2026 : les Éclats du Comptoir et du Générateur accélèrent la Tour ; mesuré j25 (médiane de 16), voir le rapport du jour.
  // 8 novembre, midi : chantiers 6-10 en énergie, fouilleurs du jour, pillages simulés : j29 (cible de Bryan : le jour 30)
  // 8 novembre, après-midi : 32 parties au lieu de 16 (avec 16, la médiane bougeait de 4 jours selon les parties tirées)
  // les 32 mêmes parties servent aux deux tests qui suivent (elles ne sont jouées qu'une fois)
  let parties: ReturnType<typeof simulerParcours>[] | null = null;
  const jouees = () => (parties ??= Array.from({ length: 32 }, (_, i) => simulerParcours(PROFILS.occasionnel, 40, 1000 + i * 7919, { joueur: 'moyen', jusqua: 10 })));

  // 12 novembre 2026 (révision complète, Bryan : « tu ne dois pas te fixer jour 30, le jeu doit durer mais ça ne doit pas être
  // un objectif à tout prix ») : sans verrou, avec le métal par tranche et des ennemis réglés Strate par Strate, le joueur qui
  // tente le front à chaque session ouvre −10 au jour 14 (médiane de ces 32 parties ; avant : le jour 32, tenu par la défaite).
  it('un joueur occasionnel qui fonce ouvre la Strate −10 entre le jour 10 et le jour 18', () => {
    const d = mediane(jouees().map((r) => r.ouverture[10] ?? Infinity));
    expect(d).toBeGreaterThanOrEqual(10);
    expect(d).toBeLessThanOrEqual(18);
  }, 300_000);

  // 11 novembre 2026 (audit du 10 : « le jour 30 est tenu, mais par la défaite », et aucun test ne surveillait le taux de victoire).
  // À chaque fois que le joueur a reçu plus de ressources, la force des ennemis a été relevée pour garder le jour 30 : le front
  // se gagnait de moins en moins souvent sans que rien ne le signale. Mesuré ce jour-là sur ces 32 parties, jusqu'à l'ouverture
  // de −10 : 26 % (19 % sur 50 jours, gardien de −10 compris). Le plancher est là pour que ça ne baisse plus ; la cible reste
  // « environ une victoire sur trois » : le relever quand FORCE.table sera réglée (`npm run front` donne les chiffres).
  // 12 novembre 2026, révision complète : 41 % sur ces 32 parties (avant 26 %). Le plancher suit.
  it('au front, le joueur occasionnel gagne au moins une expédition sur trois', () => {
    const t = jouees().reduce((n, r) => n + r.front.tentatives, 0), v = jouees().reduce((n, r) => n + r.front.victoires, 0);
    expect(v / t).toBeGreaterThanOrEqual(0.34);
  }, 300_000);
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

describe('Économie à cristal unique (9 novembre 2026)', () => {
  it('plus rien ne se perd : tout le minerai finit en cristaux, même après des jours d’absence', async () => {
    const { nouveauJeu, tick } = await import('../src/core/jeu');
    const j = nouveauJeu(0, 1);
    j.batiments.generateur = 6; j.energie = 0; j.composants = 3000;
    tick(j, j.dernierTick + 7 * 86_400_000);
    expect(j.composants).toBeLessThan(1);
    expect(Math.round(j.energie)).toBe(3000);
  });
});
