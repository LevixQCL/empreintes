import { describe, expect, it } from 'vitest';
import { DEPART, cartesMesurables, empreinteCarte, empreinteReglages, escouadeBanc, metalMesure, rapportTexte, tableau, type Mesure } from '../src/equilibrage/banc';
import { CARTES_DE_BASE, moduleDef } from '../src/core/donnees';

describe('Banc d’équilibrage', () => {
  const R = empreinteReglages();
  const mesure = (id: string, points: number, o: Partial<Mesure> = {}): Mesure => ({ points, parties: 150, reglages: R, carte: empreinteCarte(id), date: 0, ...o });

  it('mesure toutes les cartes sauf celles du deck de départ', () => {
    const ids = cartesMesurables().map((m) => m.id);
    expect(ids.length).toBeGreaterThan(50);
    for (const b of CARTES_DE_BASE) expect(ids).not.toContain(b);
  });

  it('met la carte à la place de la carte de départ de sa lignée, en cuivre si elle est de fer', () => {
    const fer = cartesMesurables().find((m) => m.rarete === 'fer')!;
    const e = escouadeBanc(fer.id);
    const { porteur, carte } = DEPART[fer.lignee];
    const ids = e[porteur]!.map((c) => c.id);
    expect(ids).toContain(`${fer.id}@cuivre`);
    expect(ids).not.toContain(`${carte}@fer`);
    expect(metalMesure(fer.id)).toBe('cuivre');
    // les autres Porteurs gardent leurs 6 cartes de fer
    expect(Object.values(e).flat().length).toBe(18);
  });

  it('les empreintes sont stables et suivent la carte', () => {
    expect(empreinteReglages()).toBe(R);
    const [a, b] = cartesMesurables();
    expect(empreinteCarte(a!.id)).toBe(empreinteCarte(a!.id));
    expect(empreinteCarte(a!.id)).not.toBe(empreinteCarte(b!.id));
  });

  it('signale la carte qui sort du lot de son métal, et celle mesurée sur d’anciens réglages', () => {
    const argent = cartesMesurables().filter((m) => m.rarete === 'argent' && !m.legs && !m.origine && !m.lien).map((m) => m.id);
    const mesures: Record<string, Mesure> = {};
    argent.slice(0, 5).forEach((id) => (mesures[id] = mesure(id, 10)));
    mesures[argent[5]!] = mesure(argent[5]!, 30);
    mesures[argent[6]!] = mesure(argent[6]!, -10);
    mesures[argent[7]!] = mesure(argent[7]!, 10, { reglages: 'ancien' });
    const t = tableau(mesures, R);
    const v = (id: string) => t.find((l) => l.m.id === id)!.verdict;
    expect(v(argent[0]!)).toBe("ok");
    expect(v(argent[5]!)).toBe('forte');
    expect(v(argent[6]!)).toBe('faible');
    expect(v(argent[7]!)).toBe('perimee');
    expect(v(cartesMesurables().find((m) => m.rarete === 'or')!.id)).toBe('aucune');
    const r = rapportTexte(t, 0.9, 0.5);
    expect(r).toContain(moduleDef(argent[5]!).nom);
    expect(r).toContain('TROP FORTE');
  });
});
