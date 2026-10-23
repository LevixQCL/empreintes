// Le Grand Tableau (23 octobre 2026) : scores, ordre, fenêtre autour du joueur, entrée publiée conforme aux règles Firestore.
import { describe, expect, it } from 'vitest';
import {
  VALEUR_DECOUVERTE, VALEUR_METAL, aChange, classer, demiStrates, ecartDevant, entreeAPublier, fenetre, noterPalmares, nomValide,
  clePseudo, pseudoInterdit, profondeurDe, valeurExemplaire, valeurRegistre, type Entree,
} from '../src/core/classements';
import { nouveauJeu, semaineDe, tick } from '../src/core/jeu';

const entree = (uid: string, p: Partial<Entree> = {}): Entree => ({
  uid, nom: uid, cle: uid, porteur: 'ilka', profondeur: 2, profondeurLe: 0, registre: 0, decouvertes: 0,
  semaine: 1, profondeurSemaine: 0, registreSemaine: 0, maj: 0, ...p,
});

describe('Le Registre', () => {
  it('un métal rare vaut plus, un niveau monté ajoute 10 %, chaque carte découverte compte', () => {
    expect(valeurExemplaire('ruee@fer', 1)).toBe(VALEUR_METAL.fer);
    expect(valeurExemplaire('ruee@fer', 3)).toBe(12);
    expect(valeurExemplaire('ruee@or', 7)).toBe(VALEUR_METAL.or);
    const v = valeurRegistre({ 'ruee@fer': { niveau: 1 }, 'ruee@cuivre': { niveau: 3 }, 'bond@fer': { niveau: 1 } });
    expect(v.decouvertes).toBe(2);
    expect(v.points).toBe(10 + 25 + 10 + 2 * VALEUR_DECOUVERTE);
  });

  it('découvrir compte plus que monter : une nouvelle carte en fer vaut plus que 2 niveaux d’une carte en fer', () => {
    const une = valeurRegistre({ 'ruee@fer': { niveau: 3 } }).points;
    const deux = valeurRegistre({ 'ruee@fer': { niveau: 1 }, 'bond@fer': { niveau: 1 } }).points;
    expect(deux).toBeGreaterThan(une);
  });

  it('ignore une clé inconnue au lieu de planter', () => {
    expect(valeurRegistre({ 'inconnue@fer': { niveau: 1 } }).points).toBe(0);
  });
});

describe('Le palmarès', () => {
  it('se crée au premier tick, garde la date d’arrivée et ne redescend pas', () => {
    const j = nouveauJeu(1000, 1);
    tick(j, 2000);
    expect(j.palmares?.profondeur).toBe(profondeurDe(j));
    const le = j.palmares!.profondeurLe;
    j.frontVaincu = true;
    tick(j, 5000);
    expect(j.palmares!.profondeur).toBe(3);
    expect(j.palmares!.profondeurLe).toBeGreaterThan(le);
    const record = j.palmares!.registre;
    j.collection = {};
    tick(j, 6000);
    expect(j.palmares!.registre).toBe(record);
  });

  it('la semaine repart des records du lundi', () => {
    const j = { strate: 3, frontVaincu: false, collection: {} as Record<string, { niveau: number }> };
    noterPalmares(j, 0, 10);
    (j as { strate: number }).strate = 4;
    noterPalmares(j, 1, 10);
    expect((j as { palmares?: { profondeur: number; profondeurDebut: number } }).palmares!.profondeurDebut).toBe(6);
    noterPalmares(j, 2, 11);
    expect((j as { palmares?: { profondeur: number; profondeurDebut: number } }).palmares!.profondeurDebut).toBe(8);
  });
});

describe('Le classement', () => {
  it('à profondeur égale, le premier arrivé passe devant', () => {
    const l = classer([entree('b', { profondeur: 9, profondeurLe: 200 }), entree('a', { profondeur: 9, profondeurLe: 100 }), entree('c', { profondeur: 10 })], 'profondeur', 'total', 1);
    expect(l.map((x) => x.e.uid)).toEqual(['c', 'a', 'b']);
    expect(l.map((x) => x.rang)).toEqual([1, 2, 3]);
  });

  it('au Registre, les ex æquo partagent leur rang', () => {
    const l = classer([entree('a', { registre: 50 }), entree('b', { registre: 50 }), entree('c', { registre: 10 })], 'registre', 'total', 1);
    expect(l.map((x) => x.rang)).toEqual([1, 1, 3]);
  });

  it('la semaine ne montre que ceux qui ont progressé cette semaine', () => {
    const l = classer([entree('a', { semaine: 1, registreSemaine: 30 }), entree('b', { semaine: 0, registreSemaine: 90 }), entree('c', { semaine: 1 })], 'registre', 'semaine', 1);
    expect(l.map((x) => x.e.uid)).toEqual(['a']);
  });

  it('dit ce qu’il manque pour passer devant le joueur juste au-dessus', () => {
    const l = classer([entree('a', { registre: 120 }), entree('moi', { registre: 100 })], 'registre', 'total', 1);
    expect(ecartDevant(l, 'moi')).toEqual({ nom: 'a', manque: 21 });
    expect(ecartDevant(l, 'a')).toBeNull();
  });

  it('montre tout le monde entre amis, sinon le podium et les voisins du joueur', () => {
    const peu = classer(Array.from({ length: 8 }, (_, i) => entree('j' + i, { registre: i })), 'registre', 'total', 1);
    expect(fenetre(peu, 'j0')).toHaveLength(8);
    const beaucoup = classer(Array.from({ length: 40 }, (_, i) => entree('j' + i, { registre: 100 - i })), 'registre', 'total', 1);
    const f = fenetre(beaucoup, 'j20');
    const ids = f.filter((x) => x !== 'ellipse').map((x) => (x as { e: Entree }).e.uid);
    expect(ids).toEqual(['j0', 'j1', 'j2', 'j18', 'j19', 'j20', 'j21', 'j22']);
    expect(f.filter((x) => x === 'ellipse')).toHaveLength(2);
  });

  it('écrit les demi-Strates de la semaine', () => {
    expect(demiStrates(0)).toBe('0');
    expect(demiStrates(1)).toBe('½');
    expect(demiStrates(4)).toBe('2');
    expect(demiStrates(5)).toBe('2½');
  });
});

describe('L’entrée publiée suit les règles Firestore', () => {
  const partie = () => {
    const j = nouveauJeu(0, 1);
    j.strate = 8;
    tick(j, 1000);
    return j;
  };

  it('première publication : records de la partie, entiers, sans e-mail', () => {
    const j = partie();
    const e = entreeAPublier(j, 'u', '  Bryan  ', null, 5000, semaineDe(5000))!;
    expect(e.nom).toBe('Bryan');
    expect(e.profondeur).toBe(16);
    for (const v of [e.profondeur, e.profondeurLe, e.registre, e.decouvertes, e.semaine, e.profondeurSemaine, e.registreSemaine, e.maj]) expect(Number.isInteger(v)).toBe(true);
  });

  it('la profondeur ne monte que de deux Strates par publication, et la date devient « maintenant »', () => {
    const j = partie();
    const e = entreeAPublier(j, 'u', 'Bryan', entree('u', { profondeur: 6, profondeurLe: 42 }), 9999, semaineDe(9999))!;
    expect(e.profondeur).toBe(10);
    expect(e.profondeurLe).toBe(9999);
  });

  it('sans progrès de profondeur, la date publiée ne bouge pas', () => {
    const j = partie();
    const e = entreeAPublier(j, 'u', 'Bryan', entree('u', { profondeur: 16, profondeurLe: 42 }), 9999, semaineDe(9999))!;
    expect(e.profondeurLe).toBe(42);
    expect(aChange(e, { ...e, maj: 1 })).toBe(false);
    expect(aChange(e, { ...e, registre: e.registre + 1 })).toBe(true);
  });

  it('un nom de directeur valide', () => {
    expect(nomValide('Bryan')).toBe(true);
    expect(nomValide('Le Directeur d’Iris')).toBe(false); // 19 caractères
    expect(nomValide('Élo-42')).toBe(true);
    expect(nomValide('ab')).toBe(false);
    expect(nomValide('<script>')).toBe(false);
  });
});

describe('Les pseudos', () => {
  it('une seule clé pour les variantes d’un même pseudo', () => {
    for (const n of ['Bryan', 'bryan', 'BRYAN', 'Bryän', 'B.r-y_a n', 'Bry’an']) expect(clePseudo(n)).toBe('bryan');
    expect(clePseudo('Élo-42')).toBe('elo42');
    expect(clePseudo('Cœur')).toBe('coeur');
  });

  it('refuse les alphabets qui permettent des sosies', () => {
    expect(nomValide('Вryan')).toBe(false); // В cyrillique
    expect(nomValide('Bryan')).toBe(true);
  });

  it('filtre les grossièretés et les faux noms officiels, sans bloquer les prénoms', () => {
    for (const n of ['Connard', 'c0nnard', 'Admin', 'Modo', 'Support Empreintes', 'FDP', 'Hitler88']) expect(pseudoInterdit(n)).toBe(true);
    for (const n of ['Dominique', 'Nazim', 'Montenegro', 'Pedro', 'Kevin', 'Steph', 'Verhelle', 'Marie', 'Pascal', 'Charlotte', 'Bryan']) expect(pseudoInterdit(n)).toBe(false);
  });
});
