// Le Gardien de la ville (13 novembre 2026) : la semaine, les tentatives, le combat de 12 tours, et le rejeu à l'identique
// (c'est ce que fait le serveur pour compter les parts lui-même).
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { nouveauJeu, etatGardien, frapperGardien, gardienDeLaSemaine, GARDIEN_VILLE, rejouerGardien, remonter, departValide, combatGardienFini, prochaineTentative, recevoirPaliers, perleDeLaSemaine, reporterPerle, ficheApres, frappesPermises, pvDeLaVille } from '../src/core/jeu';
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

// 13 novembre 2026 : sans serveur, chaque directeur écrit sa fiche ; ficheApres suit les bornes de firestore.rules
describe('La fiche du Gardien écrite par le directeur (offre gratuite de Firebase)', () => {
  const lundi = debutJour(semaineDe(Date.UTC(2026, 10, 16, 12)) * 7) + 3_600_000;
  const qui = { nom: 'Ilka', strate: 5 };
  const frappe = (le: number, parts: number) => ({ semaine: semaineDe(le), le, parts });

  it('une frappe de plus à la fois, 3 parts au plus, une frappe déjà comptée ne recompte pas', () => {
    const a = ficheApres(null, frappe(lundi, 9), qui, lundi + 1000)!;
    expect(a).toMatchObject({ frappes: 1, parts: 3, meilleure: 3, dernier: lundi });
    expect(ficheApres(a, frappe(lundi, 1), qui, lundi + 2000)).toBeNull();
    const b = ficheApres(a, frappe(lundi + 60_000, 1.25), qui, lundi + 70_000)!;
    expect(b).toMatchObject({ frappes: 2, parts: 4.3, meilleure: 3 });
  });

  it('pas plus de frappes que de jours écoulés + la réserve, et seulement la semaine en cours', () => {
    let f = null as ReturnType<typeof ficheApres>;
    for (let i = 0; i < GARDIEN_VILLE.reserve; i++) f = ficheApres(f, frappe(lundi + i * 1000, 1), qui, lundi + 10_000);
    expect(f!.frappes).toBe(3);
    expect(frappesPermises(lundi)).toBe(3);
    expect(ficheApres(f, frappe(lundi + 5000, 1), qui, lundi + 10_000)).toBeNull();
    expect(ficheApres(f, frappe(lundi + 86_400_000, 1), qui, lundi + 86_400_000)!.frappes).toBe(4);
    expect(ficheApres(null, frappe(lundi - 7 * 86_400_000, 1), qui, lundi)).toBeNull();
  });

  it('les PV de la ville : 4 parts par directeur de la semaine d’avant, 40 au moins', () => {
    expect(pvDeLaVille(0)).toBe(40);
    expect(pvDeLaVille(25)).toBe(100);
  });

  it('firestore.rules garde les mêmes bornes (3 parts, réserve de 3, jour du jeu)', () => {
    const regles = readFileSync(new URL('../firestore.rules', import.meta.url), 'utf8');
    expect(GARDIEN_VILLE.partsMax).toBe(3);
    expect(regles).toContain(`request.time.toMillis() - ${Date.UTC(2026, 0, 5, 3)}`);
    expect(regles).toContain(`jourJeu() - int(jourJeu() / 7) * 7 + ${GARDIEN_VILLE.reserve}`);
    expect(regles).toContain('request.resource.data.parts <= resource.data.parts + 3.0001');
  });
});

// 13 novembre 2026 (Bryan) : le classement en dégâts purs, et un trio libre pour le Gardien
describe('Le Gardien de la ville : trio libre et dégâts purs', () => {
  it('un Porteur blessé ou au travail frappe quand même, à PV pleins, et garde son poste', () => {
    const j = pret();
    j.porteurs.ilka!.usure = 999; j.porteurs.doran!.poste = 'clinique';
    expect(frapperGardien(j, ESC, LUNDI, 7).ok).toBe(true);
    const p = j.expedition!.combat.porteurs.find((x) => x.id === 'ilka')!;
    expect(p.pv).toBe(p.pvMax);
    expect(p.pvMax).toBeGreaterThan(1);
    expect(j.porteurs.doran!.poste).toBe('clinique');
    jouerNote(j.expedition!.combat, j.expedition!.gardienVille!.journal);
    const r = remonter(j);
    expect(j.gardienVille!.aEnvoyer[0]!.degats).toBe(r.gardien!.degats);
    expect(j.gardienVille!.record).toBe(r.gardien!.degats);
    const rejeu = rejouerGardien(j.gardienVille!.aEnvoyer[0]!.depart, j.gardienVille!.aEnvoyer[0]!.journal);
    expect(rejeu.ok && rejeu.degats).toBe(r.gardien!.degats);
  });

  it('la fiche additionne les dégâts, plafonnés par frappe comme dans firestore.rules', () => {
    const lundi = debutJour(semaineDe(Date.UTC(2026, 10, 16, 12)) * 7) + 3_600_000;
    const qui = { nom: null, strate: 5 };
    const a = ficheApres(null, { semaine: semaineDe(lundi), le: lundi, parts: 1, degats: 800 }, qui, lundi + 1000)!;
    const b = ficheApres(a, { semaine: semaineDe(lundi), le: lundi + 5000, parts: 1, degats: 99_999 }, qui, lundi + 6000)!;
    expect(a).toMatchObject({ degats: 800, record: 800 });
    expect(b).toMatchObject({ degats: 800 + GARDIEN_VILLE.degatsMax, record: GARDIEN_VILLE.degatsMax });
    const regles = readFileSync(new URL('../firestore.rules', import.meta.url), 'utf8');
    expect(regles).toContain(`d.record <= ${GARDIEN_VILLE.degatsMax}`);
  });
});
