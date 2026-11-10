// L'audit des testeurs (10 novembre 2026) : le Registre suit firestore.rules, et les choix de cartes évitent les Porteurs absents.
import { describe, expect, it } from 'vitest';
import { REGISTRE_DELAI, REGISTRE_PAS_MAX, entreeAPublier, type Entree } from '../src/core/classements';
import { tirerChoix } from '../src/core/collection';
import { VOIES, moduleDef } from '../src/core/donnees';
import { nouveauJeu, porteursPresents, semaineDe, tick } from '../src/core/jeu';

const entree = (p: Partial<Entree> = {}): Entree => ({
  uid: 'u', nom: 'Bryan', cle: 'bryan', porteur: 'ilka', profondeur: 2, profondeurLe: 0, registre: 0, decouvertes: 0,
  semaine: 1, profondeurSemaine: 0, registreSemaine: 0, fleche: 0, flecheLe: 0, flecheSemaine: 0, maj: 0, ...p,
});
/** une partie dont le Registre vaut beaucoup plus que le plafond d'une publication */
const riche = () => {
  const j = nouveauJeu(0, 1);
  tick(j, 1000);
  j.palmares!.registre = 20_000;
  return j;
};

describe('Le Registre en ligne', () => {
  it('une entrée neuve part de peu', () => {
    expect(entreeAPublier(riche(), 'u', 'Bryan', null, 5000, semaineDe(5000))!.registre).toBe(REGISTRE_PAS_MAX);
  });
  it('il monte au plus de REGISTRE_PAS_MAX par publication, et pas avant REGISTRE_DELAI', () => {
    const t = 10 * 60_000;
    expect(entreeAPublier(riche(), 'u', 'Bryan', entree({ registre: 3000, maj: t - REGISTRE_DELAI }), t, semaineDe(t))!.registre).toBe(3000 + REGISTRE_PAS_MAX);
    expect(entreeAPublier(riche(), 'u', 'Bryan', entree({ registre: 3000, maj: t - 60_000 }), t, semaineDe(t))!.registre).toBe(3000);
  });
});

describe('Les choix de cartes', () => {
  it('ne proposent pas de carte de voie dont le Porteur n’est pas encore arrivé', () => {
    const j = nouveauJeu(0, 7);
    const presents = porteursPresents(j);
    const absentes = new Set(VOIES.filter((v) => !presents.includes(v.porteur)).flatMap((v) => v.cartes));
    for (let i = 0; i < 40; i++) {
      for (const id of tirerChoix(j, 1, 'fer', undefined, presents)) expect(absentes.has(moduleDef(id).base ?? moduleDef(id).id)).toBe(false);
    }
  });
});
