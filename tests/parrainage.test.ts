// Le parrainage (29 octobre 2026) : un départ boosté pour le filleul, des récompenses pour le parrain quand son filleul joue vraiment,
// plafonnées à 5 recrues, des distinctions cosmétiques, et une carte qui ne se trouve jamais ailleurs.
import { describe, expect, it } from 'vitest';
import { MODULES_TIRABLES, PARRAINAGE_CARTE, carteId, moduleDef, tirablesEn } from '../src/core/donnees';
import {
  PARRAINAGE, codeDe, devenirFilleul, journalCarte, lireCode, nouveauJeu, ouvrirColis, paliersAPublier, peutEtreParraine,
  reclamerRecrues, tick, vecuDe, type Recrue,
} from '../src/core/jeu';
import { entreeAPublier } from '../src/core/classements';

const JOUR = 86_400_000;
const pret = () => { const j = nouveauJeu(0, 1); j.chambre = true; j.recrues = true; return j; };
const parrain = { uid: 'p1', code: 'ABCDEF', nom: 'Bryan' };
const recrue = (uid: string, ...paliers: Recrue['paliers']): Recrue => ({ uid, nom: `Ami ${uid}`, paliers });
const liee = carteId(PARRAINAGE_CARTE, 'cuivre');

describe('Le code', () => {
  it('vient du compte : 6 caractères lisibles, toujours le même, un autre avec un sel', () => {
    const c = codeDe('uid-abc');
    expect(c).toMatch(/^[A-HJKMNP-Z2-9]{6}$/);
    expect(codeDe('uid-abc')).toBe(c);
    expect(codeDe('uid-abc', 1)).not.toBe(c);
    expect(codeDe('uid-abd')).not.toBe(c);
  });
  it('se saisit comme on veut : minuscules, préfixe, tirets', () => {
    expect(lireCode('emp-7kq2x9')).toBe('7KQ2X9');
    expect(lireCode(' 7KQ 2X9 ')).toBe('7KQ2X9');
    expect(lireCode('7KQ2X')).toBeNull();
    expect(lireCode('7KQ2X0')).toBeNull();
  });
});

describe('Le filleul', () => {
  it('reçoit son départ : composants, une carte au choix d’au moins du cuivre', () => {
    const j = pret();
    const avant = j.composants;
    expect(devenirFilleul(j, parrain, 0).ok).toBe(true);
    expect(j.composants).toBe(avant + PARRAINAGE.depart.composants);
    const choix = j.choix.at(-1)!;
    expect(choix.source).toBe('parrainage');
    expect(choix.options).toHaveLength(3);
    for (const o of choix.options) expect(moduleDef(o).rarete).not.toBe('fer');
  });
  it('n’a qu’un parrain, et seulement au début de la partie', () => {
    const j = pret();
    devenirFilleul(j, parrain, 0);
    expect(devenirFilleul(j, { ...parrain, uid: 'p2' }, 0).ok).toBe(false);
    const avance = pret();
    avance.strate = 3; avance.frontVaincu = false;
    expect(peutEtreParraine(avance)).toBe(false);
  });
  it('ouvre des colis doublés pendant 3 jours, puis normaux', () => {
    const j = pret();
    devenirFilleul(j, parrain, 0);
    j.ravitaillement.reserve = 1;
    const a = j.composants; ouvrirColis(j);
    const double = j.composants - a;
    tick(j, 3 * JOUR + 1000);
    j.ravitaillement.reserve = 1;
    const b = j.composants; ouvrirColis(j);
    expect(double).toBe(2 * (j.composants - b));
  });
  it('publie ses paliers et reçoit sa part à −3 et au Noyau 3, une seule fois', () => {
    const j = pret();
    devenirFilleul(j, parrain, 0);
    j.choix = [];
    expect(paliersAPublier(j)).toEqual([]);
    j.strate = 3; j.frontVaincu = false;
    expect(paliersAPublier(j)).toEqual(['strate1', 'strate3']);
    tick(j, 1000);
    expect(j.choix.filter((c) => c.source === 'parrainage')).toHaveLength(1);
    j.batiments.noyau = 3;
    tick(j, 2000);
    tick(j, 3000);
    expect(j.collection[liee]).toBeDefined();
    expect(j.collection[liee]!.doublons).toBe(0);
    expect(journalCarte(vecuDe(j, liee))[0]).toBe('Liée à Bryan.');
  });
});

describe('Le parrain', () => {
  it('n’est récompensé que quand sa recrue joue, chaque palier une fois', () => {
    const j = pret();
    const c = j.composants;
    expect(reclamerRecrues(j, [recrue('a')])).toEqual([]);
    reclamerRecrues(j, [recrue('a', 'strate1')]);
    expect(j.composants).toBe(c + PARRAINAGE.strate1.composants);
    reclamerRecrues(j, [recrue('a', 'strate1')]);
    expect(j.composants).toBe(c + PARRAINAGE.strate1.composants);
    reclamerRecrues(j, [recrue('a', 'strate1', 'strate3', 'noyau3')]);
    expect(j.choix.filter((x) => x.source === 'parrainage')).toHaveLength(1);
    expect(journalCarte(vecuDe(j, liee))[0]).toBe('Liée à Ami a.');
  });
  it('est récompensé pour 5 recrues au plus, mais les distinctions comptent toutes les recrues actives', () => {
    const j = pret();
    const c = j.composants;
    const l = ['a', 'b', 'c', 'd', 'e', 'f', 'g'].map((u) => recrue(u, 'strate1'));
    reclamerRecrues(j, l);
    expect(j.composants).toBe(c + 5 * PARRAINAGE.strate1.composants);
    expect(j.parrainage!.cosmetiques).toEqual(['dos-partage', 'recruteur']);
    // une recrue déjà payée continue de rapporter ses paliers suivants
    reclamerRecrues(j, l.map((r, i) => (i === 0 ? { ...r, paliers: ['strate1', 'strate3'] } : r)));
    expect(j.choix.filter((x) => x.source === 'parrainage')).toHaveLength(1);
  });
  it('affiche « Recruteur » sur le Grand Tableau', () => {
    const j = pret();
    j.palmares = { profondeur: 2, profondeurLe: 0, registre: 0, semaine: 0, profondeurDebut: 2, registreDebut: 0 } as NonNullable<typeof j.palmares>;
    expect(entreeAPublier(j, 'u', 'Bryan', null, 0, 0)!.insigne).toBeUndefined();
    reclamerRecrues(j, ['a', 'b', 'c', 'd', 'e'].map((u) => recrue(u, 'strate1')));
    expect(entreeAPublier(j, 'u', 'Bryan', null, 0, 0)!.insigne).toBe('recruteur');
  });
});

describe('La carte du parrainage', () => {
  it('ne se trouve jamais ailleurs, et n’existe qu’en cuivre', () => {
    expect(MODULES_TIRABLES.some((m) => m.id === PARRAINAGE_CARTE)).toBe(false);
    for (const metal of ['fer', 'cuivre', 'argent', 'or', 'nacre'] as const) expect(tirablesEn(metal).some((m) => m.id === PARRAINAGE_CARTE)).toBe(false);
    expect(moduleDef(liee).rarete).toBe('cuivre');
  });
});
