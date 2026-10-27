// Le journal complet du combat (27 octobre 2026) : chaque tour garde sa chaîne et des chiffres qui collent aux PV.
import { describe, expect, it } from 'vitest';
import { HISTO_MAX, ajouter, creerCombat, lancer, placesLibres } from '../src/core/combat';
import { ENNEMIS, PORTEURS } from '../src/core/donnees';
import { places } from '../src/core/regles';
import type { CombatEtat } from '../src/core/types';

const equipe = () => PORTEURS.slice(0, 3).map((p) => ({ id: p.id, pv: p.pvMax, pvMax: p.pvMax, aTerre: false }));

/** joue un combat jusqu'au bout : à chaque tour, les cartes de la main dans l'ordre tant qu'il reste de la place */
function jouerTout(s: CombatEtat, max = 60) {
  for (let t = 0; t < max && s.issue === 'en-cours'; t++) {
    for (const g of [...s.main]) if (!g.vide && places(g) <= placesLibres(s)) ajouter(s, g.uid);
    lancer(s, { silencieux: true });
  }
}

describe('Journal du combat', () => {
  it('chaque tour garde la chaîne lancée et ses lignes', () => {
    const s = creerCombat({ porteurs: equipe(), ennemiId: 'remanent', rng: 7 });
    jouerTout(s);
    const h = s.historique!;
    expect(h.length).toBeGreaterThan(1);
    expect(h[0]!.tour).toBe(1);
    for (const t of h) {
      expect(t.chaine.length).toBeGreaterThan(0);
      expect(t.lignes.length).toBeGreaterThan(0);
      for (const c of t.chaine) expect(c.f).toBeGreaterThanOrEqual(1);
    }
  });

  it('les dégâts du journal collent aux PV perdus', () => {
    for (const rng of [1, 2, 3, 4, 5, 6, 7, 8]) {
      const s = creerCombat({ porteurs: equipe(), ennemiId: 'remanent', rng });
      const pv0 = s.porteurs.reduce((n, p) => n + p.pv, 0);
      jouerTout(s);
      const lignes = s.historique!.flatMap((t) => t.lignes);
      const somme = (sorte: string) => lignes.filter((l) => l.sorte === sorte).reduce((n, l) => n + (l.v ?? 0), 0);
      // l'ennemi : ce qu'il a pris, moins ce qu'il a regagné (le dernier coup peut dépasser ses PV restants)
      const ennemi = somme('coup') - somme('ennemi-soin');
      if (s.ennemi.pv > 0) expect(s.ennemi.pvMax - s.ennemi.pv).toBe(ennemi);
      else expect(ennemi).toBeGreaterThanOrEqual(s.ennemi.pvMax);
      // l'escouade : ce qu'elle a pris, moins ce qu'elle a regagné
      const escouade = somme('blessure') - somme('soin');
      if (s.porteurs.every((p) => p.pv > 0)) expect(pv0 - s.porteurs.reduce((n, p) => n + p.pv, 0)).toBe(escouade);
      else expect(escouade).toBeGreaterThanOrEqual(pv0 - s.porteurs.reduce((n, p) => n + p.pv, 0));
    }
  });

  it('chaque coup porté a son calcul, et le net = brut − absorbé', () => {
    const s = creerCombat({ porteurs: equipe(), ennemiId: 'remanent', rng: 11 });
    jouerTout(s);
    const coups = s.historique!.flatMap((t) => t.lignes).filter((l) => l.sorte === 'coup' && l.camp === 'joueur');
    expect(coups.length).toBeGreaterThan(0);
    for (const l of coups) {
      const c = l.calculs![0]!;
      expect(c.net).toBe(c.brut - c.absorbe);
      expect(c.net).toBe(l.v);
      expect(l.rang).toBeGreaterThanOrEqual(0);
    }
  });

  it('tous les ennemis, en groupe et dans les éboulis : chaque calcul tombe juste', () => {
    for (const [k, e] of ENNEMIS.entries()) {
      const autre = ENNEMIS[(k + 1) % ENNEMIS.length]!.id;
      const s = creerCombat({ porteurs: equipe(), ennemiId: e.id, escorte: [autre], rng: k + 1, force: 1.5, condition: 'eboulis' });
      jouerTout(s);
      for (const l of s.historique!.flatMap((t) => t.lignes)) {
        for (const c of l.calculs ?? []) expect(c.net).toBe(c.brut - c.absorbe);
        if (l.calculs?.length && (l.sorte === 'coup' || l.sorte === 'blessure')) expect(l.calculs.reduce((n, c) => n + c.net, 0)).toBe(l.v);
      }
    }
  });

  it('les messages passagers ne vont pas dans le journal', () => {
    const s = creerCombat({ porteurs: equipe(), ennemiId: 'remanent', rng: 3 });
    for (const g of [...s.main]) ajouter(s, g.uid);
    expect(s.historique!.flatMap((t) => t.lignes).some((l) => /pleine|places/.test(l.texte))).toBe(false);
  });

  it('le journal reste léger : au plus HISTO_MAX tours', () => {
    const s = creerCombat({ porteurs: equipe().map((p) => ({ ...p, pv: 9999, pvMax: 9999 })), ennemiId: 'remanent', rng: 5, force: 40 });
    jouerTout(s, HISTO_MAX + 15);
    expect(s.historique!.length).toBeLessThanOrEqual(HISTO_MAX);
    expect(JSON.stringify(s.historique).length).toBeLessThan(80_000);
  });
});
