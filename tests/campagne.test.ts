import { describe, expect, it } from 'vitest';
import { PERSONNAGES, SCENES, chapitreCampagne, paroleDescente, repliqueGardien, repliquesDe, type ContexteCampagne } from '../src/core/campagne';
import { ENNEMIS, PORTEURS } from '../src/core/donnees';
import { contexteCampagne, decider, decisionEnAttente, estJeuValide, nouveauJeu, sceneCampagne, voirScene } from '../src/core/jeu';

const connu = (qui: string) => PORTEURS.some((p) => p.id === qui) || ENNEMIS.some((e) => e.id === qui) || !!PERSONNAGES[qui];

describe('La campagne vécue : les scènes', () => {
  it('chaque scène a un identifiant unique, et chaque orateur existe', () => {
    expect(new Set(SCENES.map((s) => s.id)).size).toBe(SCENES.length);
    for (const s of SCENES) for (const r of s.repliques) expect(connu(r.qui), `${s.id} : ${r.qui}`).toBe(true);
  });

  it('chaque scène garde au moins trois répliques, quelles que soient les décisions et les Porteurs arrivés', () => {
    const gardes = ['orseve', 'district', 'commission'], lectures = ['autoriser', 'refuser'], fins = ['scellement', 'pacte', 'archives'];
    for (const chambre of gardes) for (const lecture of lectures) for (const fin of fins) for (const presents of [['ilka', 'doran', 'vela'], PORTEURS.map((p) => p.id)]) {
      const c: ContexteCampagne = { strate: 12, vaincue: 12, actes: { chambre, lecture, fin }, presents };
      for (const s of SCENES) expect(repliquesDe(s, c).length, s.id).toBeGreaterThanOrEqual(3);
    }
  });

  it('se jouent dans l’ordre : le gardien vaincu, puis l’étage ouvert, et l’acte suivant attend la décision', () => {
    const j = nouveauJeu(0, 1);
    expect(sceneCampagne(j)).toBeNull(); // pas avant la chambre
    j.chambre = true;
    expect(sceneCampagne(j)).toBeNull();
    j.frontVaincu = true;
    expect(sceneCampagne(j)?.id).toBe('gardien-1');
    expect(voirScene(j, 'gardien-1')).toBe(true);
    expect(voirScene(j, 'gardien-1')).toBe(false);
    expect(sceneCampagne(j)).toBeNull(); // la Strate −2 n'est pas encore percée
    j.strate = 2; j.frontVaincu = false;
    expect(sceneCampagne(j)?.id).toBe('entree-2');
    // à −3 vaincue : la scène, puis la décision ; l'acte II attend la décision
    j.scenes = SCENES.slice(0, 4).map((s) => s.id);
    j.strate = 4; j.frontVaincu = false;
    expect(sceneCampagne(j)?.id).toBe('gardien-3');
    voirScene(j, 'gardien-3');
    expect(decisionEnAttente(j)).toBe('chambre');
    expect(sceneCampagne(j)).toBeNull();
    decider(j, 'chambre', 'commission');
    expect(sceneCampagne(j)?.id).toBe('entree-4');
  });

  it('jamais pendant une descente', () => {
    const j = nouveauJeu(0, 1);
    j.chambre = true; j.frontVaincu = true;
    j.expedition = {} as never;
    expect(sceneCampagne(j)).toBeNull();
  });

  it('une ancienne sauvegarde ne rejoue que la dernière scène atteinte', () => {
    const j = nouveauJeu(0, 1) as Partial<ReturnType<typeof nouveauJeu>>;
    j.chambre = true; j.strate = 5; j.actes = { chambre: 'orseve' };
    delete j.scenes;
    expect(estJeuValide(j)).toBe(true);
    const k = j as ReturnType<typeof nouveauJeu>;
    expect(sceneCampagne(k)?.id).toBe('entree-5');
    expect(k.scenes).toContain('gardien-3');
  });
});

describe('La campagne vécue : la Tour, les gardiens, l’escouade', () => {
  it('la Tour dit l’enjeu de la Strate en cours, puis ce qui pousse plus bas', () => {
    const j = nouveauJeu(0, 1);
    j.chambre = true; j.strate = 2;
    expect(chapitreCampagne(contexteCampagne(j))?.texte).toMatch(/pilleurs/);
    j.frontVaincu = true;
    expect(chapitreCampagne(contexteCampagne(j))?.texte).toMatch(/Brigades/);
    j.strate = 10; j.actes = { chambre: 'orseve', lecture: 'refuser', fin: 'pacte' };
    expect(chapitreCampagne(contexteCampagne(j))).toBeNull();
  });

  it('chaque gardien parle en entrant et au passage de phase, même au-delà de −10', () => {
    for (let n = 1; n <= 14; n++) {
      expect(repliqueGardien(n, 'avant').length).toBeGreaterThan(5);
      expect(repliqueGardien(n, 'phase').length).toBeGreaterThan(5);
    }
  });

  it('un Porteur de l’escouade parle dans chaque zone, toujours le même pour une même carte', () => {
    for (let z = 0; z < 4; z++) {
      const p = paroleDescente(z, 'entree', ['ilka', 'doran', 'vela'], 42);
      expect(p?.texte.length).toBeGreaterThan(5);
      expect(paroleDescente(z, 'entree', ['ilka', 'doran', 'vela'], 42)).toEqual(p);
    }
    expect(paroleDescente(0, 'gardien', ['coursier'], 1)).toBeNull();
  });
});
