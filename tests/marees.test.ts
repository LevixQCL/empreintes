import { describe, expect, it } from 'vitest';
import { lieuDef } from '../src/core/lieux';
import { moduleDef, porteurDef } from '../src/core/donnees';
import {
  CONTRAT, CONTRATS, MAREES, contratsDuMoment, cycleMaree, enMission, envoyerContrat, equipeConseillee, jourDe, nouveauJeu, partir, poster, rapportALire,
  raisonHorsContrat, tauxContrat, tick, type ContratDef, type Jeu,
} from '../src/core/jeu';

const H = 3_600_000;
const T0 = Date.UTC(2026, 9, 21, 12);
/** une partie qui a vaincu les Strates −1 à −n */
const avance = (n: number): Jeu => {
  const j = nouveauJeu(T0, 1); j.chambre = true; j.recrues = true; j.strate = n + 1; j.energie = 5000;
  for (const id of Object.keys(j.porteurs)) poster(j, id, null);
  return j;
};
const montante = (j: Jeu) => contratsDuMoment(j, T0).find((c) => c.rang === 'montante')!;

describe('Contrats de marée (31 octobre 2026)', () => {
  it('chaque contrat va vers un lieu existant, avec le bon nombre d’épreuves et des lignées selon son rang', () => {
    for (const c of CONTRATS) {
      expect(lieuDef(c.lieu)).toBeTruthy();
      expect(c.epreuves).toHaveLength(MAREES[c.rang].porteurs);
      const lg = new Set(c.epreuves.map((e) => e.lignee));
      if (c.rang === 'montante') expect(lg.size).toBe(2);
      if (c.rang === 'vive') expect(lg.size).toBe(3);
      if (c.rang === 'grande') expect(c.epreuves.filter((e) => e.lignee === lieuDef(c.lieu)!.lignee)).toHaveLength(2);
    }
    // aucune lignée n'est avantagée : autant de contrats par lignée de lieu dans chaque rang
    for (const rang of ['montante', 'vive', 'grande'] as const) {
      const n = (['tech', 'bio', 'reso'] as const).map((l) => CONTRATS.filter((c) => c.rang === rang && lieuDef(c.lieu)!.lignee === l).length);
      expect(new Set(n).size).toBe(1);
    }
  });

  it('les cycles : une marée montante par jour, deux vives-eaux et une grande marée par semaine, sans trou', () => {
    for (const rang of ['montante', 'vive', 'grande'] as const) {
      const vus = new Set<number>();
      for (let h = 0; h < 24 * 28; h += 1) {
        const now = T0 + h * H;
        const c = cycleMaree(rang, now);
        expect(now).toBeGreaterThanOrEqual(c.debut);
        expect(now).toBeLessThan(c.fin);
        vus.add(c.n);
      }
      expect(vus.size).toBeGreaterThanOrEqual(rang === 'montante' ? 28 : rang === 'vive' ? 8 : 4);
      expect(vus.size).toBeLessThanOrEqual(rang === 'montante' ? 29 : rang === 'vive' ? 9 : 5);
    }
  });

  it('les rangs s’ouvrent avec les Strates vaincues : −3, −6, −9', () => {
    expect(contratsDuMoment(avance(2), T0).map((c) => c.ouvert)).toEqual([false, false, false]);
    expect(contratsDuMoment(avance(3), T0).map((c) => c.ouvert)).toEqual([true, false, false]);
    expect(contratsDuMoment(avance(9), T0).map((c) => c.ouvert)).toEqual([true, true, true]);
    const j = avance(2);
    const c = montante(j);
    expect(envoyerContrat(j, c.id, equipeConseillee(j, c.def) as string[], T0).ok).toBe(false);
  });

  it('le taux : la bonne lignée et le niveau le font monter, borné entre 15 et 95 %', () => {
    const j = avance(5);
    const def: ContratDef = { rang: 'montante', lieu: 'pompage', titre: '', ambiance: '', epreuves: [{ nom: 'a', lignee: 'tech' }, { nom: 'b', lignee: 'bio' }] };
    const niv = (id: string, n: number) => { j.porteurs[id]!.xp = 0; for (let k = 1; k < n; k++) j.porteurs[id]!.xp! += 10 ** 6; };
    // les exemples du game designer : Ilka niv. 7 (1,05) et Véla niv. 6 sur Tenir (neutre 0,6) → 72 %
    j.porteurs.ilka!.xp = 0; j.porteurs.vela!.xp = 0;
    const tech = Object.keys(j.porteurs).find((id) => porteurDef(id).lignee === 'tech')!;
    expect(tauxContrat(j, def, [null, null])).toBe(CONTRAT.min);
    const bon = tauxContrat(j, def, ['ilka', 'doran']);
    const croise = tauxContrat(j, def, ['doran', 'ilka']);
    expect(bon).toBeGreaterThan(croise);
    expect(tauxContrat(j, def, ['ilka', 'doran'], 2)).toBe(Math.min(CONTRAT.max, bon + 2 * CONTRAT.indice));
    expect(tauxContrat(j, def, ['ilka', 'doran'], 9)).toBe(tauxContrat(j, def, ['ilka', 'doran'], 2)); // deux Indices au plus
    niv(tech, 30);
    expect(tauxContrat(j, def, [tech, 'doran'])).toBeLessThanOrEqual(CONTRAT.max);
    // l'équipe conseillée met chaque lignée sur son épreuve
    const eq = equipeConseillee(j, def, ['vela', 'ilka', 'doran']);
    expect(eq).toEqual(['ilka', 'doran']);
  });

  it('un contrat part sur la gabare (sans prendre de barque), immobilise son équipe, et rentre avec un rapport', () => {
    const j = avance(3);
    const c = montante(j);
    const eq = equipeConseillee(j, c.def) as string[];
    const energie = j.energie;
    expect(envoyerContrat(j, c.id, eq, T0).ok).toBe(true);
    expect(j.energie).toBe(energie - MAREES.montante.energie);
    expect(j.missions).toHaveLength(0);
    for (const id of eq) { expect(enMission(j, id)).toBe(true); expect(raisonHorsContrat(j, id)).toBeTruthy(); }
    // un seul contrat à la fois, et l'équipe ne peut pas descendre
    expect(envoyerContrat(j, c.id, eq, T0).ok).toBe(false);
    expect(partir(j, [eq[0]!, 'vela', 'doran'].filter((x, i, a) => a.indexOf(x) === i), 1, 3).ok).toBe(false);
    const compo = j.composants;
    tick(j, T0 + MAREES.montante.heures * H + 1);
    expect(j.marees!.contrat).toBeNull();
    for (const id of eq) expect(enMission(j, id)).toBe(false);
    expect(j.composants).toBeGreaterThan(compo);
    const r = rapportALire(j)!;
    expect(r.contrat?.porteurs).toEqual(eq);
    expect(r.creuseurs).toBe(0);
    if (r.contrat!.reussi) {
      expect(r.cartes).toHaveLength(1);
      expect(moduleDef(r.cartes[0]!.id).rarete).toBe('cuivre');
      expect(moduleDef(r.cartes[0]!.id).lignee).toBe(c.lieu.lignee);
      expect(contratsDuMoment(j, T0 + 5 * H).find((x) => x.id === c.id)!.reussi).toBe(true);
    } else {
      expect(r.cartes).toHaveLength(0);
      expect(j.marees!.indices[c.id]).toBe(1);
    }
  });

  it('un échec laisse un Indice (+15 points), une réussite ferme le contrat ; jamais de creuseurs', () => {
    let echecs = 0, reussites = 0;
    for (let g = 1; g <= 40; g++) {
      const j = avance(3); j.rng = g * 7919;
      const c = montante(j);
      const eq = equipeConseillee(j, c.def) as string[];
      const creuseurs = j.creuseurs;
      envoyerContrat(j, c.id, eq, T0);
      tick(j, T0 + 4 * H + 1);
      expect(j.creuseurs).toBe(creuseurs);
      const r = rapportALire(j)!;
      if (r.contrat!.reussi) reussites++;
      else {
        echecs++;
        expect(r.contrat!.cedee).toBeTruthy();
        expect(contratsDuMoment(j, T0 + 5 * H).find((x) => x.id === c.id)!.indices).toBe(1);
        // (l'XP gagnée a pu faire monter un Porteur : le taux ne peut que monter)
        expect(tauxContrat(j, c.def, eq, 1)).toBeGreaterThanOrEqual(Math.min(CONTRAT.max, r.contrat!.taux + CONTRAT.indice));
      }
    }
    expect(reussites).toBeGreaterThan(0);
    expect(echecs).toBeGreaterThan(0);
  });

  it('une grande marée réussie offre un choix de trois cartes de la lignée, la première en argent au moins', () => {
    let vu = 0;
    for (let g = 1; g <= 30 && vu < 3; g++) {
      const j = avance(9); j.rng = g * 104729;
      const now = Date.UTC(2026, 9, 30, 12);
      const c = contratsDuMoment(j, now).find((x) => x.rang === 'grande')!;
      expect(envoyerContrat(j, c.id, equipeConseillee(j, c.def) as string[], now).ok).toBe(true);
      tick(j, now + MAREES.grande.heures * H + 1);
      const ch = j.choix.find((x) => x.source === 'maree');
      if (!rapportALire(j)!.contrat!.reussi) { expect(ch).toBeUndefined(); continue; }
      vu++;
      expect(ch!.options).toHaveLength(3);
      for (const id of ch!.options) expect(moduleDef(id).lignee).toBe(c.lieu.lignee);
      expect(['argent', 'or', 'nacre']).toContain(moduleDef(ch!.options[0]!).rarete);
    }
    expect(vu).toBeGreaterThan(0);
    expect(jourDe(T0)).toBeGreaterThan(0);
  });
});
