import { describe, expect, it } from 'vitest';
import { creerCombat, genreSuivant, lancer, tousEnnemis } from '../src/core/combat';
import { PORTEURS } from '../src/core/donnees';
import { MARQUES, PALIERS_MARQUE, bonusEscouade, gagnerXp, niveauPorteur, nouveauJeu, progresMarque, xpPourNiveau, type Jeu } from '../src/core/jeu';
import { REGLES } from '../src/core/regles';
import type { BonusMarques, CombatEtat } from '../src/core/types';

// Les paliers des Marques (1er novembre 2026, Bryan : monter un Porteur doit changer quelque chose) :
// la Marque se gagne par l'exploit, s'affirme au niveau 10 et se grave au niveau 20.

const equipe = () => PORTEURS.slice(0, 3).map((p) => ({ id: p.id, pv: p.pvMax, pvMax: p.pvMax, aTerre: false }));
const combat = (bonus?: BonusMarques, ennemiId = 'remanent-faible', escorte?: string[]): CombatEtat =>
  creerCombat({ porteurs: equipe(), ennemiId, rng: 3, ...(bonus ? { bonus } : {}), ...(escorte ? { escorte } : {}) });
const frappe = (s: CombatEtat) => { s.chaine = [{ id: 'a', uid: 'a', porteur: 'ilka', nom: 'T', f: 1, type: 'atk', v: 1 }]; lancer(s, { silencieux: true }); };
const auNiveau = (j: Jeu, id: string, n: number) => { j.porteurs[id]!.xp = 0; for (let k = 1; k < n; k++) j.porteurs[id]!.xp! += xpPourNiveau(k); };
const gagner = (j: Jeu, id: string) => { const m = MARQUES[id]!; j.porteurs[id]!.faits = { [m.fait]: m.seuil }; };

describe('Les paliers des Marques', () => {
  it('chaque Marque a deux paliers, et aucun palier ne répète l’effet d’un autre', () => {
    const vus = new Set<string>();
    for (const [id, m] of Object.entries(MARQUES)) {
      expect(m.paliers, id).toHaveLength(2);
      // le palier gravé apporte un effet nouveau, pas seulement un chiffre plus fort
      const grave = Object.keys(m.paliers[1].bonus);
      for (const k of grave) { expect(vus.has(k), `${id} : ${k}`).toBe(false); vus.add(k); }
    }
  });

  it('le niveau ne débloque rien sans l’exploit, puis la Marque s’affirme et se grave', () => {
    const j = nouveauJeu(0, 1);
    auNiveau(j, 'doran', 20);
    expect(niveauPorteur(j, 'doran').niveau).toBe(20);
    expect(bonusEscouade(j, ['doran'])).toEqual({});
    gagner(j, 'doran');
    expect(bonusEscouade(j, ['doran'])).toEqual({ bouclier: 12, rempart: 12 });
    auNiveau(j, 'doran', PALIERS_MARQUE[0]);
    expect(progresMarque(j, 'doran')!.palier).toBe(1);
    expect(bonusEscouade(j, ['doran'])).toEqual({ bouclier: 12 });
    auNiveau(j, 'doran', PALIERS_MARQUE[0] - 1);
    expect(bonusEscouade(j, ['doran'])).toEqual({ bouclier: 8 });
  });

  it('le passage au niveau 10 annonce la Marque affirmée', () => {
    const j = nouveauJeu(0, 1);
    gagner(j, 'ilka');
    auNiveau(j, 'ilka', 9);
    gagnerXp(j, 'ilka', xpPourNiveau(9));
    expect(j.journal.some((l) => l.includes('Marque affirmée'))).toBe(true);
  });
});

describe('Les effets affirmés et gravés', () => {
  it('Raccourci (Ilka) : la place en plus revient au deuxième tour', () => {
    const s = combat({ places: 1, places2: 1 });
    frappe(s);
    expect(s.capaBonus).toBe(1);
    const t = combat({ places: 1 });
    frappe(t);
    expect(t.capaBonus).toBe(0);
  });

  it('Fondations gravées (Doran) : le bouclier se reforme une fois sous la moitié des PV', () => {
    const s = combat({ rempart: 12 });
    s.ennemi.pv = s.ennemi.pvMax = 9999;
    for (const p of s.porteurs) p.pv = Math.floor(p.pvMax * 0.4);
    frappe(s);
    expect(s.rempartFait).toBe(true);
  });

  it('Lectrice gravée (Véla) : une Dissonance repoussée trouble la prochaine attaque', () => {
    const s = combat({ lucide: true, retourne: 0.3 });
    s.ennemi.pv = s.ennemi.pvMax = 9999;
    s.intention = { type: 'dissonance', nom: 'Brouillage' };
    frappe(s);
    expect(JSON.stringify(s.journal)).toContain('renvoie son brouillage');
  });

  it('Seconde chance gravée (Sasha) : deux relèves par combat', () => {
    const s = combat({ releve: 0.25, releveFois: 2 });
    for (const p of s.porteurs) p.pv = 1;
    frappe(s);
    expect(s.releves).toBe(1);
    expect(s.releveFaite).toBeFalsy();
  });

  it('Œil de nuit : affirmé 3 tours, gravé tout le groupe', () => {
    expect(combat({ fissure: 0.25, fissureTours: 3 }).ennemi.fissureTours).toBe(3);
    const g = combat({ fissure: 0.25, fissureGroupe: true }, 'remanent', ['vigie']);
    for (const en of tousEnnemis(g)) expect(en.fissure).toBe(0.25);
  });

  it('Foulée affirmée (Coursier) : 2 Flux contre un gardien seulement', () => {
    expect(combat({ flux: 1, fluxGardien: 2 }).flux).toBe(1);
  });

  it('Guet affirmé (Guetteur) : on voit le genre de l’intention d’après', () => {
    const s = combat({ presage: true });
    expect(genreSuivant(s, s.ennemi)).not.toBeNull();
    expect(genreSuivant(combat(), combat().ennemi)).toBeNull();
  });

  it('Née-de-mue gravée (Kessa) : le renvoi peut achever l’ennemi, et le combat est gagné', () => {
    const s = combat({ chitine: 0.4, chitineAcheve: true });
    s.bouclier = 9999;
    s.chaine = [];
    s.ennemi.pv = 2;
    s.intention = { type: 'atk', nom: 'Coup', v: 20, cibleId: s.porteurs[0]!.id };
    s.chaine = [{ id: 'a', uid: 'a', porteur: 'ilka', nom: 'T', f: 1, type: 'bouclier', v: 1 }];
    lancer(s, { silencieux: true });
    expect(s.ennemi.pv).toBe(0);
    expect(s.issue).toBe('victoire');
  });

  it('Bras de quai gravé (Docker) : à la victoire, le bouclier restant soigne', () => {
    const s = combat({ soinQuai: 0.5 });
    s.bouclier = 40;
    s.porteurs[1]!.pv = 5;
    s.ennemi.pv = 1;
    frappe(s);
    expect(s.issue).toBe('victoire');
    expect(s.porteurs[1]!.pv).toBe(5 + 20);
  });

  it('Nuit blanche gravée (Joss) : les deux plus blessés sont soignés', () => {
    const s = combat({ veille: 0.08, veilleDeux: true });
    s.ennemi.pv = s.ennemi.pvMax = 9999;
    s.bouclier = 9999;
    s.porteurs[1]!.pv = 5;
    s.porteurs[2]!.pv = 6;
    frappe(s);
    expect(s.porteurs[1]!.pv).toBeGreaterThan(5);
    expect(s.porteurs[2]!.pv).toBeGreaterThan(6);
  });

  it('les cartes de la main ne dépassent jamais la règle sans palier', () => {
    expect(combat().main.length).toBe(REGLES.tailleMain);
  });
});
