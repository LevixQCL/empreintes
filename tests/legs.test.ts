import { describe, expect, it } from 'vitest';
import { choisirLegs, cleDuLegs, deckEscouade, eveillerLegs, greffer, legsEnAttente, LETTRE_LEGS, nouveauJeu } from '../src/core/jeu';
import { ajouter, creerCombat, lancer } from '../src/core/combat';
import { MODULES, MODULES_TIRABLES, PORTEURS, moduleDef } from '../src/core/donnees';
import { tirerCarte, tirerTrouvaille } from '../src/core/collection';
import type { Geste } from '../src/core/types';

// Le Legs du district (27 octobre 2026, docs/legs-du-district.md)

/** XP d'un Porteur pour un niveau donné (xpPourNiveau : 12 × n^1,6) */
const xpPour = (niveau: number) => Array.from({ length: niveau - 1 }, (_, i) => Math.round(12 * (i + 1) ** 1.6)).reduce((a, b) => a + b, 0);

describe('Le Legs du district', () => {
  it('dix vierges, toutes en nacre, à deux effets, et la lettre en propose chacune une fois', () => {
    const legs = MODULES.filter((m) => m.legs);
    expect(legs).toHaveLength(9);
    expect(legs.every((m) => m.rarete === 'nacre' && m.effet && m.effet2)).toBe(true);
    const proposees = Object.values(LETTRE_LEGS.voies).flatMap((v) => v.options.map((o) => o.id));
    expect(proposees.sort()).toEqual(legs.map((m) => m.id).sort());
    expect(LETTRE_LEGS.lignees.some((l) => l.id === 'cle')).toBe(true);
  });

  it('jamais trouvées ailleurs : ni dans les trouvailles, ni dans les choix', () => {
    expect(MODULES_TIRABLES.some((m) => m.legs)).toBe(false);
    const e = { collection: {}, sans: { argent: 0, or: 0, nacre: 0 }, rng: 7 };
    for (let i = 0; i < 400; i++) {
      expect(moduleDef(tirerCarte(e, 12)).legs).toBeUndefined();
      expect(moduleDef(tirerTrouvaille(e, 12)).legs).toBeUndefined();
    }
  });

  it('une seule par joueur, après la chambre, et définitive', () => {
    const j = nouveauJeu(0);
    expect(legsEnAttente(j)).toBe(false);
    j.chambre = true;
    expect(legsEnAttente(j)).toBe(true);
    expect(choisirLegs(j, 'carapace-fondations').ok).toBe(true);
    expect(j.collection['carapace-fondations@nacre']).toEqual({ niveau: 8, doublons: 0 });
    expect(legsEnAttente(j)).toBe(false);
    expect(choisirLegs(j, 'voix-quartier').ok).toBe(false);
    expect(j.collection['voix-quartier@nacre']).toBeUndefined();
  });

  it('scellée jusqu’à un Porteur de niveau 10, puis elle s’éveille avec lui (niveaux 13 et 16)', () => {
    const j = nouveauJeu(0);
    j.chambre = true;
    choisirLegs(j, 'carapace-fondations');
    j.porteurs.doran!.modules = j.porteurs.doran!.modules.slice(0, 3);
    expect(greffer(j, 'carapace-fondations@nacre', 'doran').ok).toBe(false);
    j.porteurs.doran!.xp = xpPour(10);
    expect(greffer(j, 'carapace-fondations@nacre', 'doran').ok).toBe(true);
    j.porteurs.doran!.xp = xpPour(13);
    eveillerLegs(j);
    expect(j.collection['carapace-fondations@nacre']!.niveau).toBe(9);
    j.porteurs.doran!.xp = xpPour(16);
    eveillerLegs(j);
    expect(j.collection['carapace-fondations@nacre']!.niveau).toBe(10);
  });

  it('les deux effets jouent : Carapace des Fondations garde son bouclier et riposte', () => {
    const s = creerCombat({ porteurs: PORTEURS.slice(0, 3).map((p) => ({ id: p.id, pv: p.pvMax, pvMax: p.pvMax, aTerre: false })), ennemiId: 'remanent-faible', rng: 3 });
    const m = moduleDef('carapace-fondations@nacre');
    const g: Geste = { id: m.id, carte: m.id, uid: 'l1', porteur: 'doran', nom: m.nom, f: m.f[0]!, type: m.type, v: 20, effet: m.effet!, effet2: m.effet2! };
    s.main = [g];
    delete s.ennemi.felure;
    s.intention = { type: 'bouclier', v: 0 };
    ajouter(s, 'l1');
    lancer(s, { silencieux: true });
    // Riposte (0,4 × 1,5 en nacre = 60 %) sur 20 de bouclier : 12 ; Rempart (75 %) : 15 gardés pour le tour suivant
    expect(s.ennemi.pvMax - s.ennemi.pv).toBe(12);
    expect(s.bouclier).toBe(15);
  });

  it('la Clé du Legs rejoint le paquetage quand un Porteur de l’escouade a le niveau 10', () => {
    const j = nouveauJeu(0);
    j.chambre = true;
    expect(choisirLegs(j, 'cle').ok).toBe(true);
    const esc = ['ilka', 'doran', 'vela'];
    expect(cleDuLegs(j, esc)).toBeNull();
    expect(deckEscouade(j, esc).some((g) => g.id === 'cle-legs')).toBe(false);
    j.porteurs.vela!.xp = xpPour(10);
    expect(deckEscouade(j, esc).some((g) => g.id === 'cle-legs')).toBe(true);
    j.porteurs.vela!.xp = xpPour(16);
    expect(cleDuLegs(j, esc)!.v).toBeGreaterThan(cleDuLegs({ ...j, porteurs: { ...j.porteurs, vela: { ...j.porteurs.vela!, xp: xpPour(10) } } }, esc)!.v);
  });
});
