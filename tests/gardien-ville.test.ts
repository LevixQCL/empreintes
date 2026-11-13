// Le Gardien de la ville (13 novembre 2026) : la semaine, les tentatives, le combat de 12 tours, et le rejeu à l'identique
// (c'est ce que fait le serveur pour compter les parts lui-même).
import { describe, expect, it } from 'vitest';
import { nouveauJeu, etatGardien, frapperGardien, gardienDeLaSemaine, GARDIEN_VILLE, rejouerGardien, remonter, departValide, combatGardienFini, prochaineTentative, recevoirPaliers, perleDeLaSemaine, reporterPerle } from '../src/core/jeu';
import { combatNote, type ActionCombat } from '../src/core/partie/gardien';
import { debutJour, jourDe, semaineDe } from '../src/core/partie/etat';
import type { CombatEtat } from '../src/core/types';

const ESC = ['ilka', 'doran', 'vela'];
const LUNDI = debutJour(7 * 300) + 3_600_000;
function pret(strate = 4) {
  const j = nouveauJeu(0, 1);
  j.chambre = true; j.recrues = true; j.strate = strate; j.frontVaincu = true; j.dernierTick = LUNDI;
  return j;
}

/** Joue comme un joueur simple, par les fonctions qui notent : vise le premier, remplit la chaîne, lance */
function jouerNote(s: CombatEtat, journal: ActionCombat[]) {
  const C = combatNote(journal);
  for (let t = 0; t < 40 && !combatGardienFini(s); t++) {
    for (const g of [...s.main].sort((a, b) => Number(b.type === 'atk') - Number(a.type === 'atk'))) C.ajouter(s, g.uid);
    if (!s.chaine.length) { C.repiocher(s); continue; }
    C.lancer(s);
  }
}

describe('Le Gardien de la ville', () => {
  it('change chaque semaine, en boucle', () => {
    const a = gardienDeLaSemaine(100), b = gardienDeLaSemaine(101);
    expect(a.ennemi === b.ennemi && a.condition === b.condition).toBe(false);
    expect(gardienDeLaSemaine(100)).toEqual(a);
  });

  it('s’ouvre après −3, une tentative par jour, trois au plus', () => {
    const j = pret(2);
    expect(frapperGardien(j, ESC, LUNDI).ok).toBe(false);
    j.strate = 4;
    const g = etatGardien(j, LUNDI);
    expect(g.tentatives).toBe(1);
    expect(etatGardien(j, LUNDI + 5 * 86_400_000).tentatives).toBe(GARDIEN_VILLE.reserve);
    expect(prochaineTentative(j, LUNDI + 5 * 86_400_000)).toBeNull();
    expect(jourDe(LUNDI) >= 0 && semaineDe(LUNDI) >= 0).toBe(true);
  });

  it('un combat de 12 tours au plus, sans défaite qui coûte, et le serveur le rejoue à l’identique', () => {
    const j = pret();
    expect(frapperGardien(j, ESC, LUNDI, 12345).ok).toBe(true);
    const x = j.expedition!;
    jouerNote(x.combat, x.gardienVille!.journal);
    expect(combatGardienFini(x.combat)).toBe(true);
    expect(x.combat.ennemi.pv).toBeGreaterThan(0);
    const usureAvant = ESC.map((id) => j.porteurs[id]!.usure);
    const r = remonter(j);
    expect(r.gardien!.parts).toBeGreaterThan(0);
    expect(ESC.map((id) => j.porteurs[id]!.usure)).toEqual(usureAvant);
    const f = j.gardienVille!.aEnvoyer[0]!;
    const rejeu = rejouerGardien(f.depart, f.journal);
    expect(rejeu.ok).toBe(true);
    if (rejeu.ok) expect(rejeu.parts).toBe(f.parts);
    // le serveur vérifie le départ contre la sauvegarde
    expect(departValide(j, f.depart, f.semaine)).toBeNull();
  });

  it('un journal truqué ou un deck gonflé est refusé', () => {
    const j = pret();
    frapperGardien(j, ESC, LUNDI, 777);
    const x = j.expedition!;
    jouerNote(x.combat, x.gardienVille!.journal);
    remonter(j);
    const f = j.gardienVille!.aEnvoyer[0]!;
    const faux = rejouerGardien(f.depart, [...f.journal, ['ajouter', 'carte-inventee']]);
    expect(faux.ok).toBe(false);
    const gonfle = { ...f.depart, deck: f.depart.deck.map((g) => ({ ...g, v: g.v * 10 })) };
    expect(departValide(j, gonfle, f.semaine)).not.toBeNull();
    const pvs = { ...f.depart, porteurs: f.depart.porteurs.map((p) => ({ ...p, pv: 999, pvMax: 999 })) };
    expect(departValide(j, pvs, f.semaine)).not.toBeNull();
  });

  it('les paliers de la ville se reçoivent une fois, la Perle une semaine sur deux après −10', () => {
    const j = pret(11);
    j.gardienVille = { semaine: semaineDe(LUNDI), tentatives: 1, jour: jourDe(LUNDI), parts: 2, meilleure: 1, aEnvoyer: [], recus: [] };
    const sem = semaineDe(LUNDI);
    const dons = recevoirPaliers(j, { semaine: sem, pv: 100, parts: 120, frappeurs: 30 }, LUNDI);
    expect([...new Set(dons.map((d) => d.palier))]).toEqual([0.25, 0.5, 0.75, 1]);
    expect(recevoirPaliers(j, { semaine: sem, pv: 100, parts: 120, frappeurs: 30 }, LUNDI)).toEqual([]);
    expect(dons.some((d) => d.type === 'perle')).toBe(sem % 2 === 0);
    // la Perle ratée attend le Gardien suivant
    const k = pret(11);
    reporterPerle(k, 2 * 500, false);
    expect(k.gardienVille).toBeUndefined();
    etatGardien(k, LUNDI);
    reporterPerle(k, 2 * 500, false);
    expect(perleDeLaSemaine(k, 2 * 500 + 1)).toBe(true);
  });
});
