// Le Cercle des quais (3 novembre 2026) : un bâtiment qui s'ouvre après la Strate −2, des échanges entre amis (une carte en double
// contre une carte du même métal, mise de côté jusqu'à la réponse), des souhaits, une vitrine, et des duels sans butin par duel.
import { describe, expect, it } from 'vitest';
import { carteId, tirablesEn } from '../src/core/donnees';
import { escouadeDepart } from '../src/core/duel';
import { COLLECTION } from '../src/core/collection';
import {
  CERCLE, aArmesEgales, accepterEchange, ameliorer, basculerSouhait, basculerVitrine, cercleOuvert, conclureEchange, doublesEchangeables,
  echangesRestants, etatCercle, finirDuelAmi, nouveauJeu, proposerEchange, propositionsExpirees, raisonNonEchangeable, raisonSansEchange,
  rendreEchange, verifierProposition,
} from '../src/core/jeu';

const JOUR = 86_400_000;
const T = 100 * JOUR;
const ami = T - 5 * JOUR;
const [a, b, c] = tirablesEn('argent').filter((m) => !m.seul);
const A = carteId(a!.id, 'argent'), B = carteId(b!.id, 'argent'), Cu = carteId(c!.id, 'cuivre');

function partie(niveau = 1) {
  const j = nouveauJeu(0, 7);
  j.chambre = true; j.recrues = true;
  j.strate = 3; j.frontVaincu = false; // −2 vaincue
  j.batiments.noyau = 10;
  j.batiments.cercle = niveau;
  j.energie = 1000;
  j.collection[A] = { niveau: 5, doublons: 2 };
  j.collection[Cu] = { niveau: 3, doublons: 1 };
  return j;
}

describe('Le bâtiment', () => {
  it('ne se construit qu’après la Strate −2', () => {
    const j = nouveauJeu(0, 7);
    j.chambre = true; j.energie = 99999; j.composants = 99999;
    expect(cercleOuvert(j)).toBe(false);
    expect(ameliorer(j, 'cercle').ok).toBe(false);
    j.strate = 3;
    j.batiments.noyau = 2;
    expect(cercleOuvert(j)).toBe(true);
    expect(ameliorer(j, 'cercle', 0).ok).toBe(true);
  });
  it('une nouvelle partie le compte à zéro', () => {
    expect(nouveauJeu(0, 1).batiments.cercle).toBe(0);
  });
});

describe('Les échanges', () => {
  it('ne donnent jamais la carte elle-même, seulement un double', () => {
    const j = partie();
    expect(doublesEchangeables(j)).toContain(A);
    j.collection[A]!.doublons = 0;
    expect(verifierProposition(j, A, B, ami, T).ok).toBe(false);
  });
  it('demandent le même métal, refusent la nacre, et l’or avant le niveau 5', () => {
    const j = partie();
    expect(verifierProposition(j, A, carteId(b!.id, 'cuivre'), ami, T).message).toMatch(/même métal/);
    expect(raisonNonEchangeable(j, carteId(a!.id, 'nacre'))).toMatch(/nacre/);
    expect(raisonNonEchangeable(j, carteId(a!.id, 'or'))).toMatch(/niveau 5/);
    j.batiments.cercle = 5;
    expect(raisonNonEchangeable(j, carteId(a!.id, 'or'))).toBeNull();
  });
  it('attendent quelques jours d’amitié', () => {
    const j = partie();
    expect(raisonSansEchange(j, T - JOUR, T)).toMatch(/jours/);
    expect(raisonSansEchange(j, T - CERCLE.amitieJours * JOUR, T)).toBeNull();
  });
  it('mettent la carte et le prix de côté, puis livrent la carte reçue une seule fois', () => {
    const j = partie();
    const r = proposerEchange(j, { id: 'p1', ami: 'u2', nomAmi: 'Luc', donne: A, recoit: B }, ami, T);
    expect(r.ok).toBe(true);
    expect(j.collection[A]!.doublons).toBe(1);
    expect(j.energie).toBe(1000 - CERCLE.cout.argent);
    expect(conclureEchange(j, 'p1')?.recue).toBe(B);
    expect(j.collection[B]).toBeDefined();
    expect(conclureEchange(j, 'p1')).toBeNull();
    expect(etatCercle(j).enAttente).toHaveLength(0);
  });
  it('rendent tout si l’ami refuse', () => {
    const j = partie();
    proposerEchange(j, { id: 'p1', ami: 'u2', nomAmi: 'Luc', donne: A, recoit: B }, ami, T);
    const avant = echangesRestants(j, T);
    rendreEchange(j, 'p1', T);
    expect(j.collection[A]!.doublons).toBe(2);
    expect(j.energie).toBe(1000);
    expect(echangesRestants(j, T)).toBe(avant + 1);
  });
  it('fer et cuivre sont gratuits', () => {
    const j = partie();
    const D = carteId(a!.id, 'cuivre');
    proposerEchange(j, { id: 'p2', ami: 'u2', nomAmi: 'Luc', donne: Cu, recoit: D }, ami, T);
    expect(j.energie).toBe(1000);
  });
  it('se limitent par jour et par propositions ouvertes', () => {
    const j = partie(1);
    expect(proposerEchange(j, { id: 'x1', ami: 'u2', nomAmi: 'Luc', donne: A, recoit: B }, ami, T).ok).toBe(true);
    // niveau 1 : une seule proposition ouverte à la fois
    expect(proposerEchange(j, { id: 'x2', ami: 'u2', nomAmi: 'Luc', donne: A, recoit: B }, ami, T).message).toMatch(/attente/);
  });
  it('acceptée : on donne son double, on reçoit la carte, une seule fois', () => {
    const j = partie();
    const r = accepterEchange(j, 'q1', A, B, ami, T);
    expect(r.ok).toBe(true);
    expect(r.nouvelle).toBe(true);
    expect(j.collection[A]!.doublons).toBe(1);
    expect(accepterEchange(j, 'q1', A, B, ami, T).ok).toBe(false);
  });
  it('une proposition sans réponse expire au bout de 48 h', () => {
    const j = partie();
    proposerEchange(j, { id: 'p1', ami: 'u2', nomAmi: 'Luc', donne: A, recoit: B }, ami, T);
    expect(propositionsExpirees(j, T + 47 * 3_600_000)).toHaveLength(0);
    expect(propositionsExpirees(j, T + 49 * 3_600_000)).toHaveLength(1);
  });
});

describe('Souhaits et vitrine', () => {
  it('une vitrine à la taille du Cercle', () => {
    const j = partie(1);
    expect(basculerVitrine(j, A).ok).toBe(true);
    expect(basculerVitrine(j, Cu).ok).toBe(false);
    j.batiments.cercle = 4;
    expect(basculerVitrine(j, Cu).ok).toBe(true);
  });
  it('les souhaits se notent et se retirent', () => {
    const j = partie();
    expect(basculerSouhait(j, B).ok).toBe(true);
    expect(etatCercle(j).souhaits).toEqual([B]);
    basculerSouhait(j, B);
    expect(etatCercle(j).souhaits).toEqual([]);
    expect(basculerSouhait(j, carteId(a!.id, 'nacre')).ok).toBe(false);
  });
});

describe('Les duels', () => {
  it('rapportent une fois par ami et par semaine, trois amis au plus', () => {
    const j = partie();
    expect(finirDuelAmi(j, 'u2', true, T)).not.toBeNull();
    expect(finirDuelAmi(j, 'u2', true, T)).toBeNull();
    expect(finirDuelAmi(j, 'u3', true, T)).not.toBeNull();
    expect(finirDuelAmi(j, 'u4', true, T)).not.toBeNull();
    expect(finirDuelAmi(j, 'u5', true, T)).toBeNull();
    expect(finirDuelAmi(j, 'u2', true, T + 7 * JOUR)).not.toBeNull();
    expect(finirDuelAmi(j, 'u6', false, T)).toBeNull();
    expect(etatCercle(j).victoires).toBe(6);
    expect(etatCercle(j).defaites).toBe(1);
  });
  it('à armes égales : niveaux de départ et PV de base', () => {
    const e = escouadeDepart('Moi');
    e.porteurs[0]!.pv = 999;
    e.porteurs[0]!.cartes[0]!.niveau = 9;
    const g = aArmesEgales(e);
    expect(g.porteurs[0]!.pv).not.toBe(999);
    expect(g.porteurs[0]!.cartes[0]!.niveau).toBe(COLLECTION.niveauDepart.fer);
  });
});
