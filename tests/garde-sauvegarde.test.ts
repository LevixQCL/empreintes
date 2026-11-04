// La garde de la sauvegarde : une partie n'en écrase jamais une autre (version plus récente, autre appareil).
import { describe, expect, it } from 'vitest';
import { VERSION_JEU } from '../src/core/jeu';
import { decisionEcriture, prochainJeton, tropRecente, versionDe } from '../src/save/garde';

describe('Garde de la sauvegarde', () => {
  it('reconnaît une sauvegarde faite par une version plus récente du jeu', () => {
    expect(tropRecente({ version: VERSION_JEU })).toBe(false);
    expect(tropRecente({ version: VERSION_JEU - 1 })).toBe(false);
    expect(tropRecente({ version: VERSION_JEU + 1 })).toBe(true);
    expect(tropRecente(null)).toBe(false);
    expect(versionDe({ version: 'x' })).toBe(0);
  });

  it("n'écrit jamais par-dessus une version plus récente", () => {
    expect(decisionEcriture({ existe: true, version: VERSION_JEU + 1, jeton: 5 }, 5)).toBe('trop-recente');
  });

  it("écrit quand personne n'a écrit depuis la dernière lecture", () => {
    expect(decisionEcriture({ existe: true, version: VERSION_JEU, jeton: 1000 }, 1000)).toBe('ecrire');
    expect(decisionEcriture({ existe: false, version: 0, jeton: null }, null)).toBe('ecrire');
  });

  it('refuse quand un autre appareil a écrit entre-temps', () => {
    expect(decisionEcriture({ existe: true, version: VERSION_JEU, jeton: 2000 }, 1000)).toBe('autre-appareil');
    // le compte était vide à la lecture, et une partie y est apparue
    expect(decisionEcriture({ existe: true, version: VERSION_JEU, jeton: 2000 }, null)).toBe('autre-appareil');
    // rien lu encore : on attend la réconciliation
    expect(decisionEcriture({ existe: false, version: 0, jeton: null }, undefined)).toBe('autre-appareil');
  });

  it("le jeton grandit toujours, même si l'horloge de l'appareil retarde", () => {
    expect(prochainJeton(null, 1000)).toBe(1000);
    expect(prochainJeton(5000, 1000)).toBe(5001);
    expect(prochainJeton(5000, 9000)).toBe(9000);
  });
});

import { estJeuValide, nouveauJeu } from '../src/core/jeu';
describe('versions de sauvegarde', () => {
  it('une sauvegarde de chaque version précédente reste valide (3 novembre 2026 : la version 7 était refusée)', () => {
    for (let v = 2; v <= VERSION_JEU; v++) {
      const j = nouveauJeu(0) as unknown as { version: number };
      j.version = v;
      expect(estJeuValide(j)).toBe(true);
    }
    const futur = nouveauJeu(0) as unknown as { version: number };
    futur.version = VERSION_JEU + 1;
    expect(estJeuValide(futur)).toBe(false);
  });
});

import { etatStocke } from '../src/save/garde';
describe('une partie illisible n’est jamais écrasée', () => {
  const env = (data: unknown) => JSON.stringify({ data, updatedAt: 1 });
  it('reconnaît chaque cas', () => {
    expect(etatStocke(null, estJeuValide)).toBe('vide');
    expect(etatStocke('{pas du json', estJeuValide)).toBe('illisible');
    expect(etatStocke(env(nouveauJeu(0)), estJeuValide)).toBe('lisible');
    expect(etatStocke(env({ ...nouveauJeu(0), version: VERSION_JEU + 1 }), estJeuValide)).toBe('trop-recente');
    // une version que le jeu ne sait pas lire (l'incident du 3 novembre 2026 : la version 7 refusée par la version 8)
    expect(etatStocke(env({ ...nouveauJeu(0), version: 1 }), estJeuValide)).toBe('illisible');
    expect(etatStocke(env(nouveauJeu(0)), () => false)).toBe('illisible');
  });
});
