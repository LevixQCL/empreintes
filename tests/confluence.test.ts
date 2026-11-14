// Les Confluences (14 novembre 2026) : fonder (prix remboursable), le Courant de la semaine, les paliers de la Crue
// (une seule fois chacun, seulement si on a apporté), les demandes de copies (8 h, par métal) et les dons.
import { describe, expect, it } from 'vitest';
import { carteId, tirablesEn } from '../src/core/donnees';
import {
  CONFLUENCE, apportSemaine, cleConfluence, demanderCopies, donnerCopie, annulerDon, entrerConfluence, etatConfluence, nouveauJeu,
  paliersARecevoir, paliersCrue, payerFondation, quitterConfluence, raisonDemande, raisonDon, raisonNom, recevoirDons, recevoirPalier,
  rembourserFondation, finirDuelAmi, semaineDe,
} from '../src/core/jeu';

const JOUR = 86_400_000;
const T = 300 * JOUR;
const fer = tirablesEn('fer').filter((m) => !m.seul);
const F1 = carteId(fer[0]!.id, 'fer'), F2 = carteId(fer[1]!.id, 'fer');
const AR = carteId(tirablesEn('argent').filter((m) => !m.seul)[0]!.id, 'argent');

function partie(cercle = 1) {
  const j = nouveauJeu(0, 7);
  j.chambre = true; j.recrues = true;
  j.strate = 6; j.frontVaincu = false;
  j.batiments.noyau = 10;
  j.batiments.cercle = cercle;
  j.energie = 1000;
  j.collection[F1] = { niveau: 1, doublons: 3 };
  j.collection[F2] = { niveau: 1, doublons: 0 };
  return j;
}

describe('Fonder et entrer', () => {
  it('le nom donne l’identifiant, sans accents ni espaces', () => {
    expect(cleConfluence('Les Écluses d’Or')).toBe('leseclusesdor');
    expect(raisonNom('ab')).not.toBeNull();
    expect(raisonNom('La Digue')).toBeNull();
    expect(raisonNom('<script>')).not.toBeNull();
  });
  it('fonder coûte des cristaux, remboursés si l’écriture en ligne échoue', () => {
    const j = partie();
    expect(payerFondation(j).ok).toBe(true);
    expect(j.energie).toBe(1000 - CONFLUENCE.prixFondation);
    rembourserFondation(j);
    expect(j.energie).toBe(1000);
    const k = partie(0);
    expect(payerFondation(k).ok).toBe(false);
  });
  it('quitter oublie la demande en cours', () => {
    const j = partie();
    entrerConfluence(j, 'ladigue', 'La Digue', T);
    expect(demanderCopies(j, F1, T).ok).toBe(true);
    quitterConfluence(j, T);
    expect(etatConfluence(j, T).id).toBeUndefined();
    expect(etatConfluence(j, T).demande).toBeUndefined();
  });
});

describe('Le Courant et la Crue', () => {
  it('les dons et les Joutes de la semaine font l’apport', () => {
    const j = partie();
    entrerConfluence(j, 'ladigue', 'La Digue', T);
    expect(apportSemaine(j, T).total).toBe(0);
    donnerCopie(j, F1, T);
    finirDuelAmi(j, 'ami1', true, T);
    const a = apportSemaine(j, T);
    expect(a.dons).toBe(CONFLUENCE.apport.don);
    expect(a.joutes).toBe(CONFLUENCE.apport.joute);
    // la semaine suivante repart de zéro
    expect(apportSemaine(j, T + 7 * JOUR).dons).toBe(0);
  });
  it('les paliers grandissent avec l’effectif, avec un plancher de 3 directeurs', () => {
    expect(paliersCrue(1)).toEqual(paliersCrue(3));
    expect(paliersCrue(10)[0]).toBe(CONFLUENCE.paliersParMembre[0] * 10);
  });
  it('un palier se reçoit une fois, et seulement si on a apporté quelque chose', () => {
    const j = partie();
    entrerConfluence(j, 'ladigue', 'La Digue', T);
    const seuil = paliersCrue(5)[0]!;
    expect(paliersARecevoir(j, seuil, 5, T)).toEqual([]);
    donnerCopie(j, F1, T);
    expect(paliersARecevoir(j, seuil, 5, T)).toEqual([0]);
    const avant = j.energie;
    expect(recevoirPalier(j, 0, seuil, 5, T).ok).toBe(true);
    expect(j.energie).toBe(avant + CONFLUENCE.recompenses[0]!.cristaux!);
    expect(recevoirPalier(j, 0, seuil, 5, T).ok).toBe(false);
    // le troisième palier offre un choix de carte
    const max = paliersCrue(5)[2]!;
    expect(recevoirPalier(j, 2, max, 5, T).ok).toBe(true);
    expect(j.choix.some((c) => c.source === 'confluence')).toBe(true);
    // la semaine suivante, tout est à regagner
    expect(etatConfluence(j, T + 7 * JOUR).crue).toEqual([]);
    expect(semaineDe(T + 7 * JOUR)).toBe(semaineDe(T) + 1);
  });
});

describe('Les demandes de copies', () => {
  it('une demande toutes les 8 heures, et le nombre de copies suit le métal', () => {
    const j = partie();
    expect(raisonDemande(j, F1, T)).not.toBeNull(); // pas de Confluence
    entrerConfluence(j, 'ladigue', 'La Digue', T);
    const r = demanderCopies(j, F1, T);
    expect(r.ok).toBe(true);
    expect(r.demande!.voulu).toBe(CONFLUENCE.copiesDemandees.fer);
    expect(demanderCopies(j, F2, T + 3_600_000).ok).toBe(false);
    expect(demanderCopies(j, F2, T + 8 * 3_600_000).ok).toBe(true);
  });
  it('l’argent attend le niveau 3 du Cercle, l’or ne se demande pas', () => {
    const j = partie(1);
    entrerConfluence(j, 'ladigue', 'La Digue', T);
    j.collection[AR] = { niveau: 1, doublons: 0 };
    expect(raisonDemande(j, AR, T)).not.toBeNull();
    j.batiments.cercle = 3;
    expect(raisonDemande(j, AR, T)).toBeNull();
  });
  it('les copies reçues en ligne s’ajoutent une seule fois', () => {
    const j = partie();
    entrerConfluence(j, 'ladigue', 'La Digue', T);
    const d = demanderCopies(j, F2, T).demande!;
    const avant = j.collection[F2]!.doublons;
    expect(recevoirDons(j, d.le, 2, T)?.n).toBe(2);
    expect(recevoirDons(j, d.le, 2, T)).toBeNull();
    expect(recevoirDons(j, d.le, 99, T)?.n).toBe(d.voulu - 2);
    expect(j.collection[F2]!.doublons).toBeGreaterThan(avant);
    expect(recevoirDons(j, d.le + 1, 5, T)).toBeNull(); // une autre demande
  });
});

describe('Les dons', () => {
  it('donner un double rapporte des cristaux, au plus douze dons récompensés par jour', () => {
    const j = partie();
    entrerConfluence(j, 'ladigue', 'La Digue', T);
    j.collection[F1]!.doublons = 30;
    let gagne = 0;
    for (let i = 0; i < CONFLUENCE.donsJour + 2; i++) gagne += donnerCopie(j, F1, T).cristaux ?? 0;
    expect(gagne).toBe(CONFLUENCE.donsJour * CONFLUENCE.recompenseDon.fer);
    expect(j.collection[F1]!.doublons).toBe(30 - CONFLUENCE.donsJour - 2);
    expect(donnerCopie(j, F1, T + JOUR).cristaux).toBe(CONFLUENCE.recompenseDon.fer);
  });
  it('sans double, rien ne part ; un don refusé en ligne est rendu', () => {
    const j = partie();
    entrerConfluence(j, 'ladigue', 'La Digue', T);
    expect(raisonDon(j, F2)).not.toBeNull();
    const avant = j.energie;
    const r = donnerCopie(j, F1, T);
    annulerDon(j, F1, r.cristaux ?? 0, T);
    expect(j.collection[F1]!.doublons).toBe(3);
    expect(j.energie).toBe(avant);
    expect(etatConfluence(j, T).dons).toBe(0);
  });
});
