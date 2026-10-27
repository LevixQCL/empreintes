// Combats à plusieurs ennemis (décision du 22 octobre 2026) : choisir qui frapper.
import { describe, expect, it } from 'vitest';
import { PV_GROUPE, pvProfondeur, coupDeFuite, creerCombat, ennemisDebout, intentionDe, lancer, tousEnnemis, viser } from '../src/core/combat';
import { ennemiDef, porteurDef } from '../src/core/donnees';
import { escorteDe, genererCarte } from '../src/core/expedition';
import type { CombatEtat, PorteurEtat } from '../src/core/types';

const porteurs = (): PorteurEtat[] => ['ilka', 'doran', 'vela'].map((id) => {
  const pv = porteurDef(id).pvMax;
  return { id, pv, pvMax: pv, aTerre: false };
});
const groupe = (escorte = ['vigie']) => creerCombat({ porteurs: porteurs(), ennemiId: 'pilleur', escorte, rng: 7 });
/** pose les cartes d'attaque de la main dans la chaîne */
function poserAttaques(s: CombatEtat) {
  for (const g of s.main.filter((x) => x.type === 'atk').slice(0, 3)) {
    s.main = s.main.filter((x) => x !== g);
    s.chaine.push(g);
  }
}

describe('Un groupe d’ennemis', () => {
  it('chaque ennemi a sa place, ses PV (partagés) et sa propre intention', () => {
    const s = groupe(['vigie', 'rampeur']);
    const es = tousEnnemis(s);
    expect(es.map((e) => e.rang)).toEqual([0, 1, 2]);
    expect(es.map((e) => e.id)).toEqual(['pilleur', 'vigie', 'rampeur']);
    expect(es[1]!.pvMax).toBe(Math.round(ennemiDef('vigie').pvMax * PV_GROUPE[3]! * pvProfondeur(1)));
    for (const e of es) expect(intentionDe(s, e).type).toBeTruthy();
  });

  it('un ennemi seul ne change pas', () => {
    const s = creerCombat({ porteurs: porteurs(), ennemiId: 'pilleur', rng: 7 });
    expect(s.autres).toBeUndefined();
    expect(s.ennemi.rang).toBeUndefined();
    expect(s.ennemi.pvMax).toBe(ennemiDef('pilleur').pvMax);
  });

  it('viser un autre ennemi : il prend la place du visé, avec son intention', () => {
    const s = groupe();
    const itVigie = intentionDe(s, tousEnnemis(s)[1]!);
    expect(viser(s, 1).ok).toBe(true);
    expect(s.ennemi.id).toBe('vigie');
    expect(s.intention).toEqual(itVigie);
    expect(tousEnnemis(s).map((e) => e.id)).toEqual(['pilleur', 'vigie']);
    expect(viser(s, 1).ok).toBe(false);
  });

  it('la chaîne frappe le visé ; s’il tombe, le reste passe au suivant', () => {
    const s = groupe();
    s.ennemi.pv = 1;
    const autre = tousEnnemis(s)[1]!;
    const pvAutre = autre.pv;
    poserAttaques(s);
    expect(s.chaine.length).toBeGreaterThan(1);
    const pas = lancer(s);
    expect(pas.some((p) => p.ev.kind === 'cible')).toBe(true);
    expect(tousEnnemis(s)[0]!.pv).toBe(0);
    expect(tousEnnemis(s)[1]!.pv).toBeLessThan(pvAutre);
    expect(s.ennemi.id).toBe('vigie');
  });

  it('la victoire ne vient qu’une fois tout le groupe à terre', () => {
    const s = groupe();
    s.ennemi.pv = 1;
    tousEnnemis(s)[1]!.pv = 9999;
    const g = s.main.find((x) => x.type === 'atk')!;
    s.main = s.main.filter((x) => x !== g);
    s.chaine.push(g);
    lancer(s);
    expect(s.issue).toBe('en-cours');
    expect(ennemisDebout(s).map((e) => e.id)).toEqual(['vigie']);
  });

  it('au tour ennemi, chacun agit', () => {
    const s = groupe();
    for (const e of tousEnnemis(s)) e.pv = 9999;
    s.intention = { type: 'atk', nom: 'A', v: 3, cibleId: 'ilka' };
    tousEnnemis(s)[1]!.intention = { type: 'atk', nom: 'B', v: 4, cibleId: 'doran' };
    const g = s.main.find((x) => x.type === 'bouclier') ?? s.main[0]!;
    s.main = s.main.filter((x) => x !== g);
    s.chaine.push(g);
    const pas = lancer(s);
    expect(pas.filter((p) => p.ev.kind === 'ennemi-agit').map((p) => (p.ev as { rang: number }).rang)).toEqual([0, 1]);
  });

  it('en fuyant, toutes les attaques annoncées touchent', () => {
    const s = groupe();
    s.bouclier = 0;
    s.intention = { type: 'atk', nom: 'A', v: 3, cibleId: 'ilka' };
    tousEnnemis(s)[1]!.intention = { type: 'atk', nom: 'B', v: 4, cibleId: 'doran' };
    tousEnnemis(s)[1]!.boost = 1;
    s.ennemi.boost = 1;
    const r = coupDeFuite(s);
    expect(r.coups.map((c) => c.id).sort()).toEqual(['doran', 'ilka']);
    expect(r.attaque).toBe('A, B');
  });
});

describe('Les groupes dans les Strates', () => {
  it('aucun groupe dans la Strate −1, des groupes plus bas', () => {
    expect(genererCarte(1, 3).salles.some((s) => s.escorte)).toBe(false);
    let n = 0;
    for (let r = 0; r < 20; r++) n += genererCarte(3, r).salles.filter((s) => s.escorte).length;
    expect(n).toBeGreaterThan(5);
  });
  it('trois ennemis seulement à partir de la Strate −5', () => {
    const pool = ['remanent', 'vigie'];
    for (let id = 0; id < 200; id++) expect(escorteDe(4, 11, id, pool).length).toBeLessThanOrEqual(1);
    expect(Array.from({ length: 200 }, (_, id) => escorteDe(6, 11, id, pool).length).some((n) => n === 2)).toBe(true);
  });
});
