import { describe, expect, it } from 'vitest';
import { BATIMENTS } from '../src/core/donnees';
import { DISTRICT, gainsAmelioration, logementCreuseurs, nouveauJeu, profondeurNoyau, vitesseForge, type Jeu } from '../src/core/jeu';

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
    for (const id of Object.keys(j.porteurs)) j.porteurs[id]!.poste = null;
    const t = gainsAmelioration(j, 'generateur').find((x) => x.quoi === 'energie')!;
    expect(t.avant).toBe(DISTRICT.tailleHeures[1]);
    expect(t.apres).toBe(DISTRICT.tailleHeures[2]);
    void g;
    const f = gainsAmelioration(j, 'forge').find((x) => x.quoi === 'forge')!;
    expect([f.avant, f.apres]).toEqual([Math.round(vitesseForge(1) * 100), Math.round(vitesseForge(2) * 100)]);
    const n = gainsAmelioration(j, 'noyau');
    expect(n.find((x) => x.quoi === 'stockage')).toBeUndefined();
    // 12 novembre 2026 : les creuseurs logés raccourcissent la creuse, la Tour l'annonce
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

  it('la Tour ne limite plus la profondeur, à aucun niveau (12 novembre 2026 : plus de verrou)', () => {
    // avant : la profondeur permise montait avec la Tour (−9 demandait la Tour 8). Le calcul doit aussi s'arrêter : il bouclait sans fin.
    for (let n = 1; n <= 10; n++) expect(profondeurNoyau(n)).toBe(Infinity);
  });
});
