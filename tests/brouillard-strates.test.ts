import { describe, expect, it } from 'vitest';
import { accessibles, butinCache, butinCombat, entrerSalle, indiceSalle, nouvelleExploration, salleCourante, typeApparent, visionSalle, type Expedition } from '../src/core/expedition';
import { porteurDef } from '../src/core/donnees';
import { REGLES } from '../src/core/regles';

const escouade = (ids = ['ilka', 'doran', 'vela']) => ids.map((id) => ({ id, pv: porteurDef(id).pvMax, pvMax: porteurDef(id).pvMax, aTerre: false }));
const exploration = (strate: number, rng = 7, ids?: string[]): Expedition => nouvelleExploration({ porteurs: escouade(ids), deck: [], strate, rng });

describe('Brouillard sur le plan des Strates (30 octobre 2026)', () => {
  it('les voisines sont claires en surface, puis ne montrent qu’un indice', () => {
    const haut = exploration(2);
    for (const s of accessibles(haut)) expect(visionSalle(haut, s)).toBe('claire');
    const bas = exploration(REGLES.brouillard.indices);
    for (const s of accessibles(bas)) expect(visionSalle(bas, s)).toBe('indice');
  });
  it('au-delà de la portée, tout est dans la brume ; le gardien se voit toujours', () => {
    for (const strate of [1, 3, 6]) {
      const x = exploration(strate);
      const ici = salleCourante(x);
      for (const s of x.carte!.salles) {
        if (s.type === 'gardien') expect(visionSalle(x, s)).toBe('claire');
        else if (s.rang - ici.rang > 3) expect(visionSalle(x, s)).toBe('brume');
      }
    }
  });
  it('un Résonant debout voit une rangée de plus', () => {
    const avec = exploration(3, 11);
    const sans = exploration(3, 11, ['ilka', 'doran']);
    const rang2 = (x: Expedition) => x.carte!.salles.filter((s) => s.rang === 2).map((s) => visionSalle(x, s));
    expect(rang2(avec).every((v) => v === 'indice')).toBe(true);
    expect(rang2(sans).every((v) => v === 'brume')).toBe(true);
  });
  it('la brume se lève salle après salle', () => {
    let x = exploration(6, 3);
    const cible = accessibles(x)[0]!;
    const apres = x.carte!.salles.find((s) => cible.voisins.includes(s.id))!;
    expect(visionSalle(x, apres)).not.toBe('claire');
    x = entrerSalle(x, cible.id).x;
    expect(visionSalle(x, cible)).toBe('claire');
    expect(visionSalle(x, apres)).toBe('indice');
  });
  it('un indice reste ambigu : une lueur peut être une cache, une salle scellée ou un Résonant', () => {
    const x = exploration(6);
    for (const s of x.carte!.salles) {
      const i = indiceSalle(s);
      if (s.type === 'camp') expect(i).toBe('chaleur');
      if (s.type === 'elite') expect(i).toBe('lueur');
      if (s.type === 'cache') expect(['lueur', 'silence']).toContain(i);
    }
  });
  it('les robots ne voient que ce que le brouillard laisse voir', () => {
    const x = exploration(6);
    for (const s of x.carte!.salles) if (visionSalle(x, s) === 'brume') expect(typeApparent(x, s)).toBe('combat');
  });
});

describe('Le combat rapporte plus que la cache (30 octobre 2026, Luc)', () => {
  it('à chaque Strate, un combat gagné donne plus de composants qu’une cache', () => {
    for (let s = 1; s <= 14; s++) expect(butinCombat(s, 0)).toBeGreaterThan(butinCache(s));
  });
  it('la cache panse un peu l’escouade debout, pas celle à terre', () => {
    for (let rng = 1; rng < 400; rng++) {
      const x1 = exploration(3, rng);
      const depart = x1.carte!.salles.find((s) => s.voisins.some((v) => x1.carte!.salles[v]!.type === 'cache'));
      if (!depart) continue;
      const x0: Expedition = { ...x1, carte: { ...x1.carte!, position: depart.id } };
      const cache = accessibles(x0).find((s) => s.type === 'cache')!;
      const blesses = x0.porteurs.map((p, k) => ({ ...p, pv: k === 2 ? 0 : 10 }));
      const y = entrerSalle({ ...x0, porteurs: blesses }, cache.id).x;
      expect(y.butin).toBe(butinCache(3));
      expect(y.porteurs[0]!.pv).toBe(10 + Math.round(y.porteurs[0]!.pvMax * REGLES.salles.cacheSoin));
      expect(y.porteurs[2]!.pv).toBe(0);
      return;
    }
    throw new Error('aucune cache voisine trouvée');
  });
});
