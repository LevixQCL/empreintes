import { describe, expect, it } from 'vitest';
import { coupsAttendus, creerCombat, lancer, proteger, protegeDe, zoneAnnoncee, ajouter } from '../src/core/combat';
import { PORTEURS, gesteDeCarte } from '../src/core/donnees';

const equipe = () => PORTEURS.slice(0, 3).map((p) => ({ id: p.id, pv: p.pvMax, pvMax: p.pvMax, aTerre: false }));

/** Une attaque de zone annoncée, un bouclier d'escouade déjà posé */
function combatZone(bouclier: number) {
  const s = creerCombat({ porteurs: equipe(), ennemiId: 'remanent', rng: 3 });
  s.ennemi.pv = s.ennemi.pvMax = 999;
  s.intention = { type: 'atk', nom: 'Balayage', v: 10, zone: true };
  s.bouclier = bouclier;
  return s;
}

describe('Le protégé : sur une zone, le bouclier couvre d’abord un Porteur', () => {
  it('le jeu propose le plus menacé, et c’est lui que le bouclier couvre', () => {
    const s = combatZone(8);
    const faible = s.porteurs[2]!;
    faible.pv = 6;
    expect(zoneAnnoncee(s)).toBe(true);
    expect(protegeDe(s)).toBe(faible.id);
    const c = coupsAttendus(s);
    expect(c.get(faible.id)![0]!.absorbe).toBeGreaterThan(0);
    expect(c.get(s.porteurs[0]!.id)![0]!.absorbe).toBe(0);
  });

  it('le joueur peut choisir un autre protégé ; le vrai tour suit l’aperçu', () => {
    const s = combatZone(8);
    const choisi = s.porteurs[1]!.id;
    expect(proteger(s, choisi).ok).toBe(true);
    expect(protegeDe(s)).toBe(choisi);
    const prevu = coupsAttendus(s);
    s.main = [{ ...gesteDeCarte('ruee@fer', PORTEURS[0]!.id), uid: 'a' }];
    ajouter(s, 'a');
    const avant = s.porteurs.map((p) => p.pv);
    const apres = coupsAttendus(s);
    lancer(s);
    s.porteurs.forEach((p, i) => expect(avant[i]! - p.pv).toBe(apres.get(p.id)?.reduce((t, x) => t + x.net, 0) ?? 0));
    expect(prevu.get(choisi)![0]!.absorbe).toBeGreaterThan(0);
    // le choix ne vaut que pour le tour
    expect(s.protege).toBeUndefined();
  });

  it('on ne protège pas un Porteur à terre', () => {
    const s = combatZone(5);
    s.porteurs[0]!.pv = 0;
    expect(proteger(s, s.porteurs[0]!.id).ok).toBe(false);
  });
});
