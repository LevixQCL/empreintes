import { describe, expect, it } from 'vitest';
import { ajouter, coupsAttendus, creerCombat, lancer } from '../src/core/combat';
import { PORTEURS, gesteDeCarte } from '../src/core/donnees';

const equipe = () => PORTEURS.slice(0, 3).map((p) => ({ id: p.id, pv: p.pvMax, pvMax: p.pvMax, aTerre: false }));

/** Une attaque annoncée sur un seul Porteur, pour des tests qui ne dépendent pas du tirage */
function combatVise(cibleId: string, v = 12) {
  const s = creerCombat({ porteurs: equipe(), ennemiId: 'remanent', rng: 3 });
  s.ennemi.pv = s.ennemi.pvMax = 999;
  s.intention = { type: 'atk', nom: 'Griffe', v, cibleId };
  return s;
}

describe('Les coups attendus sur l’escouade', () => {
  it('seul le Porteur visé est marqué, avec ce que le vrai tour lui retire', () => {
    const cible = PORTEURS[1]!.id;
    const s = combatVise(cible);
    const avant = JSON.stringify(s);
    const c = coupsAttendus(s);
    expect(JSON.stringify(s)).toBe(avant);
    expect([...c.keys()]).toEqual([cible]);
    const pv = s.porteurs.find((p) => p.id === cible)!.pv;
    s.main = [{ ...gesteDeCarte('ruee@fer', PORTEURS[0]!.id), uid: 'a' }];
    ajouter(s, 'a');
    const prevu = coupsAttendus(s).get(cible)![0]!.net;
    lancer(s);
    expect(pv - s.porteurs.find((p) => p.id === cible)!.pv).toBe(prevu);
  });

  it('le bouclier est déduit : un bouclier assez grand prend tout', () => {
    const cible = PORTEURS[0]!.id;
    const s = combatVise(cible, 8);
    const brut = coupsAttendus(s).get(cible)![0]!;
    s.bouclier = brut.net + 50;
    const c = coupsAttendus(s).get(cible)![0]!;
    expect(c.net).toBe(0);
    expect(c.absorbe).toBe(brut.net);
  });

  it('rien sous le brouillard', () => {
    const s = combatVise(PORTEURS[0]!.id);
    s.condition = 'brouillard';
    expect(coupsAttendus(s).size).toBe(0);
  });
});
