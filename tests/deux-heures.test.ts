// « Deux heures » (prototype du Récit d'Ilka) : les règles, et le réglage joué au robot sur 500 graines.
import { describe, expect, it } from 'vitest';
import { DEUX_HEURES, apercu, basculer, etoiles, monteeAnnoncee, nouvelleEpreuve, tenir, type EtatDeuxHeures } from '../src/core/recit-deux-heures';

/** joue « Relancez » dès qu'elle arrive ; sinon une stratégie donnée */
function partie(graine: number, choisir: (e: EtatDeuxHeures) => void): EtatDeuxHeures {
  const e = nouvelleEpreuve(graine);
  while (e.issue === 'en-cours' && e.tour < 30) {
    const r = e.main.find((c) => c.genre === 'relancer');
    if (r) basculer(e, r.id);
    else choisir(e);
    tenir(e);
  }
  return e;
}

/** le joueur pressé : pose deux cartes au hasard à chaque tour */
const auHasard = (e: EtatDeuxHeures) => {
  for (let i = 0; i < 2 && e.main.length; i++) basculer(e, e.main[Math.floor(Math.random() * e.main.length)]!.id);
};

/** le joueur attentif (un minimum : il ne garde rien pour le compte des tours suivants) : la paire qui laisse le plus de marge */
const attentif = (e: EtatDeuxHeures) => {
  const ids = e.main.map((c) => c.id);
  const choix: string[][] = [[]];
  for (let a = 0; a < ids.length; a++) { choix.push([ids[a]!]); for (let b = a + 1; b < ids.length; b++) choix.push([ids[a]!, ids[b]!]); }
  let meilleur: string[] = [];
  let score = -Infinity;
  for (const c of choix) {
    const essai = structuredClone(e);
    for (const id of c) basculer(essai, id);
    const p = apercu(essai);
    const marge = Math.min(DEUX_HEURES.eauMax - 1 - p.eau, p.souffle - 1);
        const s = marge * 10 + (p.souffle >= 3 ? 2 : 0) + p.compte * 0.5;
    if (s > score) { score = s; meilleur = c; }
  }
  for (const id of meilleur) basculer(e, id);
};

describe('Deux heures', () => {
  it('le départ : cinq cartes, l’eau au menton, la montée annoncée', () => {
    const e = nouvelleEpreuve(42);
    expect(e.main).toHaveLength(DEUX_HEURES.mainDepart);
    expect(e.eau).toBe(DEUX_HEURES.eauDepart);
    expect(monteeAnnoncee(e)).toBe(DEUX_HEURES.montees[0]);
  });

  it('deux mains : jamais plus de deux cartes posées', () => {
    const e = nouvelleEpreuve(1);
    for (const c of [...e.main]) basculer(e, c.id);
    expect(e.posees).toHaveLength(2);
  });

  it('« Relancez » arrive au tour 10, et la jouer gagne', () => {
    const e = partie(7, attentif);
    expect(['victoire', 'noyade', 'panique']).toContain(e.issue);
    const v = Array.from({ length: 50 }, (_, i) => partie(i, attentif)).find((x) => x.issue === 'victoire')!;
    expect(v.tour).toBe(DEUX_HEURES.tourRelance);
    expect(etoiles(v)).toBeGreaterThanOrEqual(1);
  });

  it('attendre avec « Relancez » en main coûte du souffle', () => {
    const e = nouvelleEpreuve(3);
    e.tour = DEUX_HEURES.tourRelance;
    e.main = [{ id: 'relancez', genre: 'relancer', frequence: 0, force: 0 }];
    const avant = e.souffle;
    tenir(e);
    expect(avant - e.souffle).toBeGreaterThanOrEqual(DEUX_HEURES.froid + DEUX_HEURES.coutAttente);
  });

  it('le compte : une Fréquence qui suit le compte rend du souffle', () => {
    const e = nouvelleEpreuve(5);
    e.compte = 2;
    e.main = [{ id: 'x', genre: 'soulever', frequence: 3, force: 1 }];
    basculer(e, 'x');
    expect(apercu(e).compte).toBe(3);
  });

  it('réglage : un joueur attentif gagne presque toujours, un joueur pressé souvent pas', () => {
    const N = 500;
    const attentifs = Array.from({ length: N }, (_, i) => partie(i + 1, attentif));
    const presses = Array.from({ length: N }, (_, i) => partie(i + 1, auHasard));
    const taux = (l: EtatDeuxHeures[]) => l.filter((x) => x.issue === 'victoire').length / N;
    const trois = attentifs.filter((x) => etoiles(x) === 3).length / N;
    // eslint-disable-next-line no-console
    console.log(`Deux heures · attentif ${Math.round(taux(attentifs) * 100)} % (3 étoiles : ${Math.round(trois * 100)} %) · au hasard ${Math.round(taux(presses) * 100)} %`);
    expect(taux(attentifs)).toBeGreaterThan(0.7);
    expect(taux(presses)).toBeLessThan(0.65);
    expect(trois).toBeLessThan(0.75);
  });
});
