import { describe, expect, it } from 'vitest';
import { ACCORD_OUVERT, CONFIANCE, avancerFils, gagnerXp, nouveauJeu, porteursPresents, verifierArrivees } from '../src/core/jeu';
import { FILS } from '../src/core/fils';
import { ORIGINES, PRESENTATIONS, origineDe } from '../src/core/lore-porteurs';
import { RANG_METAL } from '../src/core/lore-cartes';
import { RUMEURS, rumeurDuJour } from '../src/core/rumeurs';
import { PORTEURS } from '../src/core/donnees';

const partie = () => { const j = nouveauJeu(0); j.chambre = true; j.recrues = true; return j; };

describe('Lignées et origines (23 octobre 2026)', () => {
  it('chaque Porteur a une présentation et une histoire qui s’ouvre avec son niveau', () => {
    for (const p of PORTEURS) {
      expect(PRESENTATIONS[p.id]).toBeTruthy();
      expect(ORIGINES[p.id]?.length).toBeGreaterThan(0);
    }
    const ilka = origineDe('ilka', 1);
    expect(ilka[0]!.ouvert).toBe(true);
    expect(ilka.some((x) => !x.ouvert)).toBe(true);
  });

  it('l’Accord ouvert amène Joss seulement quand Clinique et Confiance sont assez hautes', () => {
    const j = partie();
    verifierArrivees(j);
    expect(porteursPresents(j)).not.toContain('joss');
    j.batiments.clinique = ACCORD_OUVERT.clinique;
    j.confiance = ACCORD_OUVERT.confiance * CONFIANCE.palier; // 150 habitants
    const annonces = verifierArrivees(j);
    expect(porteursPresents(j)).toContain('joss');
    expect(annonces.join(' ')).toContain('Accord ouvert');
  });

  it('les fils avancent tout seuls, étape par étape, et rapportent de l’XP', () => {
    const j = partie();
    expect(avancerFils(j)).toEqual([]);
    gagnerXp(j, 'ilka', 500);
    const xp = j.porteurs.ilka!.xp ?? 0;
    const annonces = avancerFils(j);
    expect(annonces.length).toBe(1);
    expect(j.fils?.ilka).toBe(1);
    expect(j.porteurs.ilka!.xp).toBeGreaterThan(xp);
    expect(avancerFils(j)).toEqual([]);
    j.arrives.push('sasha');
    avancerFils(j);
    expect(j.fils?.ilka).toBe(2);
  });

  it('les fils restent courts et cohérents', () => {
    for (const f of Object.values(FILS)) expect(f.etapes.length).toBe(3);
  });

  it('chaque métal a son rang, et une rumeur par jour', () => {
    for (const r of ['fer', 'cuivre', 'argent', 'or', 'nacre'] as const) expect(RANG_METAL[r].rang).toBeTruthy();
    expect(RANG_METAL.nacre.rang).toBe('Vierge');
    expect(rumeurDuJour(3, 1)).toBe(rumeurDuJour(3, 1));
    expect(new Set(Array.from({ length: 30 }, (_, i) => rumeurDuJour(i, 10))).size).toBe(RUMEURS.length);
  });
});
