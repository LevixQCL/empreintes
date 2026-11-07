// L'enquête des Haltes (7 novembre 2026, Bryan : « le choix dans les haltes n'a aucun rapport et aucune incidence »)
import { describe, expect, it } from 'vitest';
import { accessibles, cloturerCombat, combatSuivant, RANG_HALTE, visionSalle } from '../src/core/expedition';
import { choisirHalte, entrer, nouveauJeu, partir } from '../src/core/jeu';
import { HALTES, nombreHaltes, pisteFinale, revelationDe } from '../src/core/strates';
import { SCENES, repliquesDe } from '../src/core/campagne';

const pret = (strate = 10) => { const j = nouveauJeu(0, 1); j.chambre = true; j.recrues = true; j.strate = strate; return j; };
const ESC = ['ilka', 'doran', 'vela'];
function allerALaHalte(j: ReturnType<typeof pret>) {
  for (let g = 0; g < 20 && !j.expedition!.enHalte && j.expedition!.carte!.salles[j.expedition!.carte!.position]!.type !== 'halte'; g++) {
    const x = j.expedition!;
    const s = accessibles(x).find((s) => s.type === 'halte') ?? accessibles(x)[0]!;
    entrer(j, s.id);
    let y = j.expedition!;
    if (y.rencontre) y = { ...y, rencontre: undefined };
    if (y.porte) y = { ...y, porte: undefined };
    if (y.phase === 'combat') { y.combat.issue = 'victoire'; y = combatSuivant(cloturerCombat(y)); }
    j.expedition = y;
  }
}

describe('L’enquête des Haltes', () => {
  it('chaque Halte propose les deux pistes, et chaque choix change le plan (lampe ou salle dévoilée)', () => {
    for (const h of HALTES) {
      expect(new Set(h.choix.map((c) => c.piste)).size, h.titre).toBe(2);
      for (const c of h.choix) expect(c.effet === 'lampe' || !!c.carte, `${h.titre} · ${c.texte}`).toBe(true);
    }
  });

  it('la dernière Halte de chaque Strate (dès −2) a une révélation par piste, qui dépend du choix d’avant', () => {
    for (let s = 2; s <= 10; s++) {
      const n = nombreHaltes(s);
      const h = HALTES.find((x) => x.strate === s && x.n === n)!;
      expect(h.revelation, `−${s}`).toBeTruthy();
      for (const p of ['nous', 'avant'] as const) {
        expect(h.revelation![p].fait.length).toBeGreaterThan(60);
        expect(h.revelation![p].voix.some((v) => !v.qui)).toBe(true);
      }
      if (s < 10) {
        const prec = HALTES.find((x) => x.strate === s && x.n === n - 1)!;
        for (const k of [0, 1]) expect(revelationDe({ [`${s}-${n - 1}`]: k }, s, n)!.piste).toBe(prec.choix[k]!.piste);
      }
    }
  });

  it('à −10, la fin de l’enquête suit la piste la plus suivie, et la scène finale le dit', () => {
    const tout = (p: 'nous' | 'avant') => Object.fromEntries(HALTES.map((h) => [`${h.strate}-${h.n}`, h.choix.findIndex((c) => c.piste === p)]));
    expect(pisteFinale(tout('nous'))).toBe('nous');
    expect(pisteFinale(tout('avant'))).toBe('avant');
    const fin = SCENES.find((s) => s.repliques.some((r) => r.qui === 'premier-porteur' && /gardés/.test(r.texte)))!;
    const ctx = (p: 'nous' | 'avant') => ({ strate: 11, vaincue: 10, actes: {}, presents: ESC, drapeaux: [], choixHaltes: tout(p) });
    const a = repliquesDe(fin, ctx('nous')).map((r) => r.texte), b = repliquesDe(fin, ctx('avant')).map((r) => r.texte);
    expect(a.some((t) => /chacun savait/.test(t))).toBe(true);
    expect(b.some((t) => /dans les cristaux/.test(t))).toBe(true);
    expect(a).not.toEqual(b);
  });

  it('le choix dévoile une salle après la Halte, sans rien dire du gain sur le bouton', () => {
    const j = pret(2);
    partir(j, ESC, 2, 11);
    allerALaHalte(j);
    expect(j.expedition!.enHalte).toBe(true);
    expect(choisirHalte(j, 1).ok).toBe(true); // « Recopier les quarante noms » : une réserve juste après
    const x = j.expedition!;
    const dev = x.carte!.salles.filter((s) => s.revelee);
    expect(dev).toHaveLength(1);
    expect(dev[0]!.type).toBe('cache');
    expect(dev[0]!.rang).toBe(RANG_HALTE + 1);
    expect(visionSalle(x, dev[0]!)).toBe('claire');
    expect(x.recit).toMatch(/composants/);
    expect(j.choixHaltes!['2-1']).toBe(1);
  });
});
