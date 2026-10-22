import { describe, expect, it } from 'vitest';
import { BATIMENTS } from '../src/core/donnees';
import { DISTRICT, gainsAmelioration, logementCreuseurs, nouveauJeu, profondeurNoyau, stockage, vitesseForge, type Jeu } from '../src/core/jeu';

const T0 = Date.UTC(2026, 9, 22, 12);
const jeu = (): Jeu => { const j = nouveauJeu(T0, 1); j.chambre = true; j.recrues = true; return j; };

describe('Ce que rapporte le niveau suivant (22 octobre 2026)', () => {
  it('chaque bâtiment annonce au moins un gain tant qu’il peut monter, et rien au niveau maximum', () => {
    const j = jeu();
    for (const b of BATIMENTS) {
      for (let n = 1; n < b.niveauMax; n++) {
        j.batiments[b.id] = n;
        expect(gainsAmelioration(j, b.id).length, `${b.id} niveau ${n}`).toBeGreaterThan(0);
      }
      j.batiments[b.id] = b.niveauMax;
      expect(gainsAmelioration(j, b.id)).toEqual([]);
      j.batiments[b.id] = 1;
    }
  });

  it('les chiffres annoncés sont ceux que le jeu appliquera vraiment', () => {
    const j = jeu();
    const g = gainsAmelioration(j, 'generateur').find((x) => x.quoi === 'energie')!;
    expect(g.avant).toBe(DISTRICT.energieParHeure[1]);
    expect(g.apres).toBe(DISTRICT.energieParHeure[2]);
    const f = gainsAmelioration(j, 'forge').find((x) => x.quoi === 'forge')!;
    expect([f.avant, f.apres]).toEqual([Math.round(vitesseForge(1) * 100), Math.round(vitesseForge(2) * 100)]);
    const n = gainsAmelioration(j, 'noyau');
    expect(n.find((x) => x.quoi === 'stockage')).toMatchObject({ avant: stockage(j), apres: DISTRICT.stockage[2] });
    expect(n.find((x) => x.quoi === 'creuseurs')).toMatchObject({ avant: logementCreuseurs(j) });
  });

  it('la Tour du Noyau annonce le deuxième chantier au bon niveau, et la Forge l’arrivée de Sasha', () => {
    const j = jeu();
    j.batiments.noyau = DISTRICT.chantiersNoyau2 - 1;
    expect(gainsAmelioration(j, 'noyau').some((x) => x.quoi === 'chantiers')).toBe(true);
    j.batiments.noyau = 1;
    expect(gainsAmelioration(j, 'noyau').some((x) => x.quoi === 'chantiers')).toBe(false);
    expect(gainsAmelioration(j, 'forge').some((x) => x.quoi === 'porteur' && x.texte.startsWith('Sasha'))).toBe(true);
    j.arrives.push('sasha');
    expect(gainsAmelioration(j, 'forge').some((x) => x.quoi === 'porteur')).toBe(false);
  });

  it('la profondeur permise par le logement des creuseurs augmente avec la Tour, puis n’a plus de limite', () => {
    for (let n = 2; n <= 5; n++) expect(profondeurNoyau(n)).toBeGreaterThan(profondeurNoyau(n - 1));
    expect(profondeurNoyau(5)).toBe(Infinity);
  });
});
