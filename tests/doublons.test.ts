// La refonte des quasi-doublons (1er novembre 2026, remarque de Luc : « c'est quasiment des doublons »).
// Aucune carte supprimée : celles qui faisaient la même chose en plus gros changent d'effet.
import { describe, expect, it } from 'vitest';
import { ajouter, creerCombat, detailForce, lancer } from '../src/core/combat';
import { MODULES, PORTEURS, moduleDef } from '../src/core/donnees';
import type { CombatEtat, Effet, Geste, TypeGeste } from '../src/core/types';

const equipe = () => PORTEURS.slice(0, 3).map((p) => ({ id: p.id, pv: p.pvMax, pvMax: p.pvMax, aTerre: false }));
let n = 0;
const geste = (f: number, type: TypeGeste, v: number, effet?: Effet, porteur = 'doran'): Geste =>
  ({ id: 'test', uid: `d${n++}`, porteur, nom: 'Test', f, type, v, ...(effet ? { effet } : {}) });
function combat(main: Geste[]): CombatEtat {
  const s = creerCombat({ porteurs: equipe(), ennemiId: 'remanent-faible', rng: 3 });
  s.main = main;
  return s;
}
const poser = (s: CombatEtat) => { for (const g of s.main.slice()) ajouter(s, g.uid); };
const degats = (s: CombatEtat) => s.ennemi.pvMax - s.ennemi.pv;

describe('Refonte des quasi-doublons', () => {
  it('Sourdine retire une part de ce que l’ennemi prépare, même un bouclier ou un soin', () => {
    for (const it of [{ type: 'bouclier', v: 12 }, { type: 'soin', nom: 'Soin', v: 12 }, { type: 'atk', nom: 'Coup', v: 12 }] as const) {
      const s = combat([geste(5, 'atk', 4, { type: 'sourdine', part: 0.25 }, 'vela')]);
      s.intention = { ...it };
      poser(s);
      lancer(s, { silencieux: true });
      expect(s.historique?.some((t) => t.lignes.some((l) => l.texte.includes('passe de 12 à 9')))).toBe(true);
    }
  });

  it('Amorce : la carte posée juste après gagne sa part de force, pas celle d’avant', () => {
    const s = combat([geste(5, 'atk', 4, { type: 'amorce', part: 0.4 }, 'vela'), geste(1, 'atk', 10, undefined, 'vela')]);
    poser(s);
    const d = detailForce(s, s.chaine[1]!.uid)!;
    expect(d.lignes.some((l) => l.nom.startsWith('Amorce'))).toBe(true);
    expect(detailForce(s, s.chaine[0]!.uid)!.lignes.some((l) => l.nom.startsWith('Amorce'))).toBe(false);
    const sans = combat([geste(5, 'atk', 4, undefined, 'vela'), geste(1, 'atk', 10, undefined, 'vela')]);
    poser(sans);
    s.intention = sans.intention = { type: 'bouclier', v: 0 };
    lancer(s, { silencieux: true }); lancer(sans, { silencieux: true });
    expect(degats(s) - degats(sans)).toBe(4);
  });

  it('Éclair captif ne prend qu’un Flux et garde le reste ; une Décharge ordinaire vide tout', () => {
    const captif = combat([geste(5, 'atk', 10, { type: 'decharge', part: 0.9, max: 1 }, 'ilka')]);
    const arc = combat([geste(5, 'atk', 10, { type: 'decharge', part: 0.5 }, 'ilka')]);
    captif.flux = arc.flux = 3;
    captif.intention = arc.intention = { type: 'bouclier', v: 0 };
    poser(captif); poser(arc);
    expect(detailForce(captif, captif.chaine[0]!.uid)!.lignes.find((l) => l.nom.startsWith('Décharge'))?.m).toBeCloseTo(1.9);
    lancer(captif, { silencieux: true }); lancer(arc, { silencieux: true });
    expect(captif.flux).toBe(2);
    expect(arc.flux).toBe(0);
  });

  it('Noyau instable remplit le Flux quand il le trouve vide, et le vide sinon', () => {
    const vide = combat([geste(5, 'atk', 10, { type: 'decharge', part: 0.65, recharge: 2 }, 'ilka')]);
    vide.flux = 0;
    vide.intention = { type: 'bouclier', v: 0 };
    poser(vide); lancer(vide, { silencieux: true });
    expect(vide.flux).toBe(2);
    const plein = combat([geste(5, 'atk', 10, { type: 'decharge', part: 0.65, recharge: 2 }, 'ilka')]);
    plein.flux = 2;
    plein.intention = { type: 'bouclier', v: 0 };
    poser(plein); lancer(plein, { silencieux: true });
    expect(plein.flux).toBe(0);
  });

  it('plus de paires presque identiques : même lignée, même action, même effet et même métal d’origine', () => {
    const vues = new Map<string, string>();
    // les familles des voies sont à part (une carte par métal) ; ne restent comparées que les cartes hors voie
    const doubles: string[] = [];
    for (const m of MODULES) {
      if (m.legs || m.lien) continue;
      const e = m.effet;
      const cle = `${m.lignee}|${m.type}|${m.rarete}|${e?.type}|${e && 'part' in e ? e.part : ''}|${e && 'max' in e ? e.max : ''}|${e && 'recharge' in e ? e.recharge : ''}`;
      if (vues.has(cle)) doubles.push(`${vues.get(cle)} / ${m.nom}`);
      else vues.set(cle, m.nom);
    }
    // restent pour le lot 2 : une carte de départ et une carte de fer trouvée qui font la même chose (docs/refonte-doublons.md)
    const connus = ['Plastron de choc / Canon à cristal', 'Talon de cristal / Jambes à ressort', 'Pistolet à faisceau / Gant à arc',
      'Plastron de choc / Œil-relais', 'Bracelet de déviation / Grappin à câble', 'Bol de sève / Glande d’ambre',
      'Front de roche / Yeux nocturnes', 'Cor de brume / Encre ancienne', 'Talon de cristal / Pas chassé'];
    expect(doubles.filter((d) => !connus.includes(d))).toEqual([]);
  });

  it('les cartes de la capture de Luc ont chacune leur effet', () => {
    expect(moduleDef('decharge-arc').effet).toEqual({ type: 'decharge', part: 0.5 });
    expect(moduleDef('eclair-captif').effet).toMatchObject({ max: 1 });
    expect(moduleDef('noyau-instable').effet).toMatchObject({ recharge: 2 });
    expect(moduleDef('gant-arc').effet?.type).not.toBe(moduleDef('coeur-turbine').effet?.type);
  });
});
