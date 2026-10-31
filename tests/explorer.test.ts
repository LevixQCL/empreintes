import { describe, expect, it } from 'vitest';
import { cloturerCombat, entrerSalle, genererCarte, nouvelleExploration, visionSalle, type Expedition } from '../src/core/expedition';
import { etoilesDe, fouiller, gardienEveille, nouveauJeu, partir, remonter, rodeurDispo, strateRelevee, totalEtoiles, vestigesManquants } from '../src/core/jeu';
import { EXPLORER, PALIERS_ETOILES, RELEVES, RODEURS, VESTIGES, vestigesDe } from '../src/core/explorer';
import { BESTIAIRE } from '../src/core/strates';
import { ZONES, ennemiDef } from '../src/core/donnees';
import { jouerTour } from '../src/core/robot';
import { DECK_DEPART } from '../src/core/donnees';

const pret = (strate = 10) => { const j = nouveauJeu(0, 1); j.chambre = true; j.recrues = true; j.strate = strate; return j; };
const ESC = ['ilka', 'doran', 'vela'];
const porteurs = () => ESC.map((id) => ({ id, pv: 40, pvMax: 40, aTerre: false }));

describe('Le contenu d’Explorer', () => {
  it('5 Vestiges et une histoire par Strate, −1 à −10 ; un Rôdeur et une fiche par zone', () => {
    for (let s = 1; s <= 10; s++) expect(vestigesDe(s)).toHaveLength(5);
    expect(new Set(VESTIGES.map((v) => v.id)).size).toBe(50);
    expect(RELEVES.map((r) => r.strate)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    expect(RODEURS.map((r) => r.zone)).toEqual([0, 1, 2, 3]);
    for (const r of RODEURS) { expect(ennemiDef(r.id).tag).toMatch(/RÔDEUR/); expect(BESTIAIRE[r.id], r.id).toBeTruthy(); }
    // les paliers d'étoiles montent, jusqu'aux 30 étoiles de −1 à −10
    expect(PALIERS_ETOILES.map((p) => p.etoiles)).toEqual([5, 10, 15, 20, 25, 30]);
  });
});

describe('Les Vestiges', () => {
  it('2 sur la carte jusqu’à −5, 3 plus bas, sur des rangées différentes ; les deux premiers sur un même chemin ; aucun en fouille', () => {
    for (const [strate, n] of [[2, 2], [7, 3]] as const) {
      for (const rng of [1, 2, 3, 4, 5, 6]) {
        const ids = vestigesDe(strate).map((v) => v.id);
        const x = nouvelleExploration({ porteurs: porteurs(), deck: DECK_DEPART, strate, rng, vestiges: ids });
        const poses = x.carte!.salles.filter((s) => s.vestige);
        expect(poses).toHaveLength(n);
        expect(new Set(poses.map((s) => s.rang)).size).toBe(n);
        for (const s of poses) expect(s.type === 'halte' || s.quete || s.rodeur).toBeFalsy();
        // le Vestige suivant attend derrière le passage secret
        expect(ids).toContain(x.vestigeSecret);
      }
    }
    const f = nouvelleExploration({ porteurs: porteurs(), deck: DECK_DEPART, strate: 3, rng: 4, fouille: 'composants', vestiges: vestigesDe(3).map((v) => v.id) });
    expect(f.carte!.salles.some((s) => s.vestige)).toBe(false);
  });

  it('ramassés en route, ils comptent au retour même après une défaite ; les cinq relèvent la Strate', () => {
    const j = pret(3);
    j.vestiges = vestigesDe(2).slice(0, 4).map((v) => v.id);
    partir(j, ESC, 2, 7);
    const x = j.expedition!;
    x.gains = { ...x.gains!, vestiges: vestigesManquants(j, 2) };
    x.combat.issue = 'defaite';
    const r = remonter(j);
    expect(r.explorer?.vestiges).toHaveLength(1);
    expect(r.explorer?.releve).toBe(2);
    expect(strateRelevee(j, 2)).toBe(true);
    expect(j.choix.some((c) => c.source === 'releve')).toBe(true);
    // une fouille de la Strate relevée voit tout le plan
    fouiller(j, ESC, 2, 'composants', 3);
    const y = j.expedition!;
    expect(y.releve).toBe(true);
    for (const s of y.carte!.salles) expect(visionSalle(y, s)).toBe('claire');
  });

  it('derrière un combat, il faut le gagner ; derrière une cache, il suffit d’entrer', () => {
    const ids = vestigesDe(4).map((v) => v.id);
    for (let rng = 1; rng < 40; rng++) {
      const x = nouvelleExploration({ porteurs: porteurs(), deck: DECK_DEPART, strate: 4, rng, vestiges: ids });
      const s = x.carte!.salles.find((v) => v.vestige && (v.type === 'cache' || v.type === 'combat'));
      if (!s) continue;
      const avant = x.carte!.salles.find((v) => v.voisins.includes(s.id))!;
      const y = entrerSalle({ ...x, carte: { ...x.carte!, position: avant.id } } as Expedition, s.id).x;
      if (s.type === 'cache') expect(y.gains?.vestiges).toEqual([s.vestige]);
      else {
        expect(y.gains?.vestiges ?? []).toEqual([]);
        y.combat.issue = 'victoire';
        expect(cloturerCombat(y).gains?.vestiges).toEqual([s.vestige]);
      }
      return;
    }
    throw new Error('aucune carte de test');
  });
});

describe('Les étoiles', () => {
  it('★1 d’office pour une Strate vaincue ; le gardien vaincu sans chute ni campement donne les trois, une seule fois', () => {
    const j = pret(4);
    expect(etoilesDe(j, 2)).toEqual([1]);
    expect(totalEtoiles(j)).toBe(3);
    partir(j, ESC, 2, 9);
    const x = j.expedition!;
    Object.assign(x, { terminee: true });
    x.combat.issue = 'victoire';
    const avant = j.eclats;
    const r = remonter(j);
    expect(r.explorer?.etoiles).toEqual([2, 3]);
    expect(etoilesDe(j, 2)).toEqual([1, 2, 3]);
    expect(j.eclats - avant).toBeGreaterThanOrEqual(4);
    // 5 étoiles : le premier palier, versé au retour
    expect(r.explorer?.paliers).toBe(1);
    expect(j.choix.some((c) => c.source === 'etoiles')).toBe(true);
    partir(j, ESC, 2, 10);
    Object.assign(j.expedition!, { terminee: true });
    j.expedition!.combat.issue = 'victoire';
    expect(remonter(j).explorer?.etoiles).toEqual([]);
  });

  it('une chute ou un campement retient l’étoile correspondante', () => {
    const j = pret(4);
    partir(j, ESC, 3, 11);
    Object.assign(j.expedition!, { terminee: true, chute: true, campe: true });
    j.expedition!.combat.issue = 'victoire';
    expect(remonter(j).explorer?.etoiles).toEqual([]);
  });
});

describe('Le gardien éveillé', () => {
  it('seulement dans une Strate déjà vaincue, jamais au front', () => {
    const j = pret(4);
    expect(gardienEveille(j, 3)).toBe(true);
    expect(gardienEveille(j, 4)).toBe(false);
    partir(j, ESC, 4, 3);
    expect(j.expedition!.eveille).toBeFalsy();
    j.expedition = null;
    partir(j, ESC, 3, 3);
    expect(j.expedition!.eveille).toBe(true);
  });
});

describe('Le Rôdeur', () => {
  it('ne rôde que là où une Strate de sa zone est vaincue, et plus du tout une fois abattu', () => {
    const j = pret(2);
    expect(rodeurDispo(j, 1)?.id).toBe('maree-basse');
    expect(rodeurDispo(j, 4)).toBeUndefined();
    j.rodeurs = { 'maree-basse': { part: 0, rencontres: 3, abattu: true } };
    expect(rodeurDispo(j, 1)).toBeUndefined();
  });

  it('il se bat quelques tours puis s’enfuit avec ses blessures ; abattu, il laisse un trophée', () => {
    const x = nouvelleExploration({ porteurs: porteurs(), deck: DECK_DEPART, strate: 2, rng: 5, rodeur: { id: 'maree-basse', part: 0.5 } });
    const salle = x.carte!.salles.find((s) => s.rodeur)!;
    expect(salle.ennemi).toBe('maree-basse');
    const avant = x.carte!.salles.find((v) => v.voisins.includes(salle.id))!;
    let y = entrerSalle({ ...x, carte: { ...x.carte!, position: avant.id } } as Expedition, salle.id).x;
    expect(y.combat.ennemi.pv).toBe(Math.round(y.combat.ennemi.pvMax * 0.5));
    expect(y.combat.fuyard).toBe(EXPLORER.rodeur.tours);
    for (let k = 0; k < 20 && y.combat.issue === 'en-cours'; k++) jouerTour(y.combat);
    expect(y.combat.tour).toBeLessThanOrEqual(EXPLORER.rodeur.tours + 1);
    y = cloturerCombat(y);
    if (y.combat.enfui) expect(y.gains?.rodeur?.part).toBeGreaterThan(0);
    else if (y.combat.issue === 'victoire') expect(y.gains?.rodeur?.part).toBe(0);
    // au retour : l'état du Rôdeur est gardé ; abattu, un choix de carte
    const j = pret(3);
    partir(j, ESC, 1, 2);
    j.expedition!.gains = { ...j.expedition!.gains!, rodeur: { id: 'maree-basse', part: 0 } };
    remonter(j);
    expect(j.rodeurs?.['maree-basse']?.abattu).toBe(true);
    expect(j.choix.some((c) => c.source === 'rodeur')).toBe(true);
  });

  it('jamais en fouille ; jamais dans la zone d’après', () => {
    const f = nouvelleExploration({ porteurs: porteurs(), deck: DECK_DEPART, strate: 2, rng: 5, fouille: 'bio', rodeur: { id: 'maree-basse', part: 1 } });
    expect(f.carte!.salles.some((s) => s.rodeur)).toBe(false);
    expect(ZONES.length).toBe(RODEURS.length);
    expect(genererCarte(2, 5).salles.some((s) => s.rodeur)).toBe(false);
  });
});
