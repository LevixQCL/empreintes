// Les Récits des origines (Pack des origines, 11 novembre 2026) : les cartes d'origine, exclusives, en argent, à deux effets.
import { describe, expect, it } from 'vitest';
import { MODULES, MODULES_TIRABLES, METAL_FORCE, carteId, existeEn, gesteDeCarte, moduleDef } from '../src/core/donnees';
import { RECITS_ORIGINES, carteDuRecit, garderCarteRecit, nouveauJeu, raisonNonEchangeable, EVEIL_ORIGINE, eveillerOrigines, niveauOriginePour, estJeuValide, VERSION_JEU } from '../src/core/jeu';
import { doublonsRequis, niveauRequis, sansBonusOrigine } from '../src/core/collection';
import { deckDuel } from '../src/core/duel';
import { xpPourNiveau } from '../src/core/partie/etat';

/** l'XP total d'un Porteur arrivé au niveau n */
const xpAuNiveau = (n: number) => Array.from({ length: n - 1 }, (_, k) => xpPourNiveau(k + 1)).reduce((a, b) => a + b, 0);

const origines = MODULES.filter((m) => m.origine);
const DEPUIS: Record<string, string> = {
  'cle-des-pompes': 'verin', 'toutes-les-courses': 'condensateur', 'quarante-jours': 'poumons-abysse',
  'berceuse-a-compter': 'branchies', 'ombre-nette': 'ombre-serpent', 'nuit-blanche': 'plume-givre',
};

describe('Récits des origines', () => {
  it('chaque carte d’origine part d’une carte gratuite : en argent seulement, sa force d’argent, et un effet en plus', () => {
    expect(origines.map((m) => m.id).sort()).toEqual(Object.keys(DEPUIS).sort());
    for (const m of origines) {
      const de = moduleDef(DEPUIS[m.id]!);
      expect(m.rarete).toBe('argent');
      expect(existeEn(m, 'argent')).toBe(true);
      for (const r of ['fer', 'cuivre', 'or', 'nacre'] as const) expect(existeEn(m, r), `${m.id} en ${r}`).toBe(false);
      expect(m.v).toBe(Math.round(de.v * METAL_FORCE.argent / METAL_FORCE.cuivre));
      for (const k of ['lignee', 'type', 'f', 'lourd'] as const) expect(m[k], `${m.id}.${k}`).toEqual(de[k]);
      // les deux effets : celui de la carte gratuite, et celui qu'elle a en plus
      expect([m.effet, m.effet2]).toContainEqual(de.effet);
      expect([m.effet!.type, m.effet2!.type]).toContain(m.origine);
      expect(m.origine).not.toBe(de.effet!.type);
    }
  });

  it('elle se porte dès le niveau 1 et grandit avec son Porteur, sans doublons', () => {
    const j = nouveauJeu(5);
    garderCarteRecit(j, 'ilka', 'toutes-les-courses');
    const cle = carteId('toutes-les-courses', 'argent');
    expect(niveauRequis(cle)).toBe(1);
    expect(doublonsRequis(cle, 1)).toBeNull();
    j.porteurs.ilka!.modules.push(cle);
    eveillerOrigines(j);
    expect(j.collection[cle]!.niveau).toBe(1);
    for (const e of EVEIL_ORIGINE) {
      j.porteurs.ilka!.xp = xpAuNiveau(e.porteur);
      eveillerOrigines(j);
      expect(j.collection[cle]!.niveau).toBe(e.niveau);
    }
    expect(niveauOriginePour(99)).toBe(5);
  });

  it('face à un autre joueur, elle perd l’effet qu’elle a en plus (duel, défi d’un quai)', () => {
    for (const m of origines) {
      const cle = carteId(m.id, 'argent');
      const g = sansBonusOrigine(gesteDeCarte(cle, 'ilka'));
      expect(g.effet2, m.id).toBeUndefined();
      expect(g.effet, m.id).toEqual(moduleDef(DEPUIS[m.id]!).effet);
      expect(g.v).toBe(m.v);
    }
    // une carte ordinaire ne change pas
    const g = gesteDeCarte(carteId('verin', 'cuivre'), 'ilka');
    expect(sansBonusOrigine(g)).toBe(g);
    const deck = deckDuel({ nom: 'x', porteurs: [{ id: 'vela', pv: 30, cartes: [{ id: carteId('ombre-nette', 'argent'), niveau: 1 }] }] });
    expect(deck[0]!.effet!.type).toBe('fissure');
    expect(deck[0]!.effet2).toBeUndefined();
  });

  it('une sauvegarde d’avant garde sa carte : le cuivre devient l’argent, au même niveau, dans le même deck', () => {
    const j = nouveauJeu(6);
    const avant = carteId('quarante-jours', 'cuivre'), apres = carteId('quarante-jours', 'argent');
    j.version = 11;
    j.collection[avant] = { niveau: 2, doublons: 0 };
    j.porteurs.doran!.modules.push(avant);
    j.recits = { doran: { carte: 'quarante-jours' } };
    expect(estJeuValide(j)).toBe(true);
    expect(j.version).toBe(VERSION_JEU);
    expect(j.collection[avant]).toBeUndefined();
    expect(j.collection[apres]!.niveau).toBe(2);
    expect(j.porteurs.doran!.modules).toContain(apres);
  });

  it('une carte d’origine ne tombe jamais ailleurs', () => {
    for (const m of origines) expect(MODULES_TIRABLES).not.toContain(m);
  });

  it('chaque choix d’un récit est une carte d’origine de la lignée de son personnage', () => {
    for (const r of Object.values(RECITS_ORIGINES)) for (const c of r.choix) expect(moduleDef(c.carte).origine).toBeTruthy();
  });

  it('garder une carte, puis changer d’avis : la nouvelle prend la place de l’ancienne', () => {
    const j = nouveauJeu(1);
    expect(garderCarteRecit(j, 'ilka', 'cle-des-pompes').ok).toBe(true);
    const a = carteId('cle-des-pompes', 'argent'), b = carteId('toutes-les-courses', 'argent');
    expect(j.collection[a]).toBeTruthy();
    j.porteurs.ilka!.modules.push(a);
    j.collection[a]!.niveau = 3;
    expect(garderCarteRecit(j, 'ilka', 'toutes-les-courses').ok).toBe(true);
    expect(j.collection[a]).toBeUndefined();
    expect(j.collection[b]!.niveau).toBe(3);
    expect(j.porteurs.ilka!.modules).toContain(b);
    expect(carteDuRecit(j, 'ilka')).toBe('toutes-les-courses');
  });

  it('une carte d’origine ne s’échange pas au Cercle', () => {
    const j = nouveauJeu(2);
    garderCarteRecit(j, 'ilka', 'cle-des-pompes');
    expect(raisonNonEchangeable(j, carteId('cle-des-pompes', 'argent'))).toMatch(/origine/);
  });

  it('Doran (Géné) : un bouclier Rempart et un soin d’escouade, de sa lignée', () => {
    const r = RECITS_ORIGINES.doran!;
    expect(r.choix.map((c) => c.carte)).toEqual(['quarante-jours', 'berceuse-a-compter']);
    for (const c of r.choix) expect(moduleDef(c.carte).lignee).toBe('bio');
    const j = nouveauJeu(3);
    expect(garderCarteRecit(j, 'doran', 'cle-des-pompes').ok).toBe(false);
    expect(garderCarteRecit(j, 'doran', 'berceuse-a-compter').ok).toBe(true);
    expect(carteDuRecit(j, 'doran')).toBe('berceuse-a-compter');
    expect(carteDuRecit(j, 'ilka')).toBeNull();
  });

  it('Véla (Résonante) : une Fissure de groupe et un Désarmement, de sa lignée', () => {
    const r = RECITS_ORIGINES.vela!;
    expect(r.choix.map((c) => c.carte)).toEqual(['ombre-nette', 'nuit-blanche']);
    for (const c of r.choix) expect(moduleDef(c.carte).lignee).toBe('reso');
    const j = nouveauJeu(4);
    expect(garderCarteRecit(j, 'vela', 'quarante-jours').ok).toBe(false);
    expect(garderCarteRecit(j, 'vela', 'ombre-nette').ok).toBe(true);
    expect(carteDuRecit(j, 'vela')).toBe('ombre-nette');
  });
});
