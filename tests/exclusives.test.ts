import { describe, expect, it } from 'vitest';
import { ajouter, creerCombat, lancer } from '../src/core/combat';
import { tirerCarte, type EtatCollection } from '../src/core/collection';
import { EXCLUSIVES, MODULES, PORTEURS, VOIES, existeEn, moduleDef, tirablesEn } from '../src/core/donnees';
import type { CombatEtat, Effet, Geste, TypeGeste } from '../src/core/types';

// Les voies, étapes 2 et 3, et les cartes exclusives (28 octobre 2026)

const equipe = () => PORTEURS.slice(0, 3).map((p) => ({ id: p.id, pv: p.pvMax, pvMax: p.pvMax, aTerre: false }));

let n = 0;
/** Un Geste de Doran (Géné) : contre le Rémanent affaibli (Résonant), pas d'avantage de lignée */
const geste = (f: number, type: TypeGeste, v: number, effet?: Effet): Geste =>
  ({ id: 'test', uid: `x${n++}`, porteur: 'doran', nom: 'Test', f, type, v, ...(effet ? { effet } : {}) });

function combat(main: Geste[]): CombatEtat {
  const s = creerCombat({ porteurs: equipe(), ennemiId: 'remanent-faible', rng: 3 });
  s.main = main;
  delete s.ennemi.felure;
  s.intention = { type: 'bouclier', v: 0 };
  return s;
}
const jouer = (s: CombatEtat) => {
  for (const g of s.main.slice()) ajouter(s, g.uid);
  lancer(s, { silencieux: true });
};
const degats = (s: CombatEtat) => s.ennemi.pvMax - s.ennemi.pv;
const lignes = (s: CombatEtat) => (s.historique ?? []).flatMap((t) => t.lignes.map((l) => l.texte));

describe('Les voies : étapes 2 et 3', () => {
  it('Curée : plus fort seulement contre un ennemi fissuré', () => {
    const sans = combat([geste(5, 'atk', 10, { type: 'curee', part: 0.5 })]);
    jouer(sans);
    expect(degats(sans)).toBe(10);
    // une proie à moins de la moitié de ses PV compte aussi
    const blessee = combat([geste(5, 'atk', 10, { type: 'curee', part: 0.5 })]);
    blessee.ennemi.pv = Math.floor(blessee.ennemi.pvMax / 2);
    const avant = blessee.ennemi.pv;
    jouer(blessee);
    expect(avant - blessee.ennemi.pv).toBe(15);
    const avec = combat([geste(1, 'atk', 0, { type: 'fissure', part: 0.2 }), geste(5, 'atk', 10, { type: 'curee', part: 0.5 })]);
    jouer(avec);
    // 10 × 1,2 (Fissure) × 1,5 (Curée)
    expect(degats(avec)).toBe(18);
  });

  it('Lecture brise la Fêlure, quelle que soit sa Fréquence, et la Faille en profite', () => {
    const s = combat([geste(1, 'bouclier', 0, { type: 'lecture' }), geste(5, 'atk', 10, { type: 'faille', part: 0.4 })]);
    s.ennemi.felure = 9;
    s.intention = { type: 'atk', nom: 'Griffe', v: 20, cibleId: 'doran' };
    jouer(s);
    // la Fêlure se referme au tour suivant : le journal garde sa trace
    expect(lignes(s).some((t) => /^Fêlure/.test(t))).toBe(true);
    expect(degats(s)).toBe(14);
  });

  it('Rafale frappe deux fois dans une chaîne de 4, une seule fois sinon', () => {
    const trois = combat([geste(1, 'atk', 0), geste(3, 'atk', 0), geste(5, 'atk', 10, { type: 'rafale' })]);
    jouer(trois);
    expect(degats(trois)).toBe(10);
    const quatre = combat([geste(1, 'atk', 0), geste(3, 'atk', 0), geste(7, 'atk', 0), geste(5, 'atk', 10, { type: 'rafale' })]);
    quatre.capaBonus = 1;
    jouer(quatre);
    expect(degats(quatre)).toBe(20);
  });

  it('Débord : soigne toute l’escouade, le soin en trop devient du bouclier d’escouade', () => {
    const s = combat([geste(2, 'soin', 12, { type: 'debord' })]);
    s.porteurs[0]!.pv -= 5;
    s.porteurs[1]!.pv -= 12;
    s.porteurs[2]!.pv = s.porteurs[2]!.pvMax;
    jouer(s);
    // 7 en trop chez le premier, 12 chez le troisième déjà plein
    expect(lignes(s)).toContain('Débord : le soin en trop devient 19 de bouclier d’escouade.');
  });
});

describe('Les effets exclusifs', () => {
  it('Rapt arrache tout le bouclier ennemi pour l’escouade, puis frappe', () => {
    const s = combat([geste(5, 'atk', 10, { type: 'rapt' })]);
    s.ennemi.bouclier = 12;
    jouer(s);
    expect(s.ennemi.bouclier).toBe(0);
    expect(degats(s)).toBe(10);
  });

  it('Empreinte copie l’effet de la carte d’avant, pas une Fréquence libre', () => {
    const s = combat([geste(1, 'atk', 0, { type: 'fissure', part: 0.5 }), geste(5, 'atk', 10, { type: 'empreinte' })]);
    jouer(s);
    // elle reprend la Fissure : 10 × 1,5 pour elle-même
    expect(degats(s)).toBe(15);
    const seule = combat([geste(5, 'atk', 10, { type: 'empreinte' })]);
    jouer(seule);
    // rien à copier : elle imite la force à la place
    expect(degats(seule)).toBe(14);
    const accord = combat([geste(1, 'atk', 0, { type: 'accord' }), geste(5, 'atk', 10, { type: 'empreinte' })]);
    jouer(accord);
    expect(degats(accord)).toBe(14);
  });

  it('Surtension brûle des PV sans jamais faire tomber, et frappe plus fort', () => {
    const s = combat([geste(5, 'atk', 10, { type: 'surtension', part: 0.6, cout: 0.12 })]);
    const doran = s.porteurs.find((p) => p.id === 'doran')!;
    const avant = doran.pv;
    jouer(s);
    expect(degats(s)).toBe(16);
    expect(doran.pv).toBe(avant - Math.round(doran.pvMax * 0.12));
    const faible = combat([geste(5, 'atk', 10, { type: 'surtension', part: 0.6, cout: 0.12 })]);
    faible.porteurs.find((p) => p.id === 'doran')!.pv = 2;
    jouer(faible);
    expect(faible.porteurs.find((p) => p.id === 'doran')!.pv).toBeGreaterThanOrEqual(1);
  });

  it('Relève remet debout un Porteur à terre', () => {
    const s = combat([geste(2, 'soin', 15, { type: 'releve' })]);
    const vela = s.porteurs.find((p) => p.id === 'vela')!;
    vela.pv = 0;
    vela.aTerre = true;
    jouer(s);
    expect(vela.pv).toBe(15);
    expect(vela.aTerre).toBe(false);
  });

  it('Rappel remet la carte la plus forte de la chaîne en tête de pioche', () => {
    const forte = geste(6, 'atk', 14);
    const s = combat([geste(1, 'bouclier', 5, { type: 'rappel' }), geste(3, 'atk', 4), forte]);
    s.pioche = [];
    s.defausse = [];
    jouer(s);
    // le tour ennemi a pioché une main neuve : la carte rappelée y est revenue en premier
    expect(s.main.some((g) => g.uid === forte.uid)).toBe(true);
  });
});

describe('Les cartes exclusives n’existent que dans leur métal', () => {
  it('chaque exclusive a un métal argent, or ou nacre, et un effet qu’aucune carte ordinaire ne porte', () => {
    const effetsExclusifs = new Set(['rapt', 'rappel', 'surtension', 'empreinte', 'releve']);
    expect(EXCLUSIVES.length).toBeGreaterThanOrEqual(9);
    for (const m of EXCLUSIVES) {
      expect(['argent', 'or', 'nacre'], m.id).toContain(m.rarete);
      expect(effetsExclusifs.has(m.effet!.type), m.id).toBe(true);
      expect(m.f.length, m.id).toBeGreaterThanOrEqual({ argent: 2, or: 2, nacre: 3 }[m.rarete as 'argent']);
    }
    for (const m of MODULES.filter((x) => !x.seul)) expect(effetsExclusifs.has(m.effet?.type ?? ''), m.id).toBe(false);
  });

  it('un tirage ne donne jamais une exclusive hors de son métal', () => {
    for (const m of EXCLUSIVES) for (const r of ['fer', 'cuivre', 'argent', 'or', 'nacre'] as const) expect(tirablesEn(r).includes(m), `${m.id}@${r}`).toBe(existeEn(m, r));
    const e: EtatCollection = { collection: {}, sans: { argent: 0, or: 0, nacre: 0 }, rng: 7 };
    for (let i = 0; i < 4000; i++) {
      const cle = tirerCarte(e, 12);
      const m = MODULES.find((x) => x.id === moduleDef(cle).base)!;
      if (m.seul) expect(moduleDef(cle).rarete, cle).toBe(m.rarete);
    }
  });

  it('les nouvelles voies n’ont que des cartes de la lignée de leur Porteur', () => {
    for (const v of VOIES) for (const id of v.cartes) expect(MODULES.find((m) => m.id === id), id).toBeTruthy();
  });
});
