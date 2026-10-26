import { describe, expect, it } from 'vitest';
import { CHARGE, PLACES_PORTEUR, chargeNiveau, poidsCarte } from '../src/core/collection';
import { ajouter, creerCombat, lancer } from '../src/core/combat';
import { DEPART_PORTEURS, carteId, gesteDeCarte } from '../src/core/donnees';
import { chargeMax, chargePortee, echanger, estJeuValide, greffer, nouveauJeu, partir } from '../src/core/jeu';
import { mesurer } from '../src/core/robot';

describe('La Charge', () => {
  it('une carte pèse selon sa force : la plus forte pèse le plus', () => {
    expect(poidsCarte('tir-vif@fer')).toBe(1);
    expect(poidsCarte('ruee@fer')).toBe(2);
    expect(poidsCarte('coeur-reprise@or')).toBeGreaterThan(poidsCarte('coeur-reprise@fer'));
    expect(poidsCarte('coeur-reprise@or')).toBeGreaterThanOrEqual(9);
  });

  it('le deck de départ de chaque Porteur nommé tient dans sa Charge au niveau 1', () => {
    for (const ids of Object.values(DEPART_PORTEURS)) expect(ids.reduce((n, id) => n + poidsCarte(carteId(id, 'fer')), 0)).toBeLessThanOrEqual(chargeNiveau(1));
  });

  it('la Charge grandit avec le niveau du Porteur', () => {
    const j = nouveauJeu(0);
    expect(chargeMax(j, 'ilka')).toBe(CHARGE.base);
    j.porteurs.ilka!.xp = 12;
    expect(chargeMax(j, 'ilka')).toBe(CHARGE.base + CHARGE.parNiveau);
  });

  it('une carte trop lourde est refusée, à l’ajout comme à l’échange', () => {
    const j = nouveauJeu(0);
    j.chambre = true;
    j.collection['coeur-reprise@or'] = { niveau: 7, doublons: 0 };
    j.porteurs.ilka!.modules = j.porteurs.ilka!.modules.slice(0, 5);
    const avant = chargePortee(j, 'ilka');
    const r = greffer(j, 'coeur-reprise@or', 'ilka');
    expect(r.ok).toBe(false);
    expect(r.message).toMatch(/Trop lourd/);
    expect(chargePortee(j, 'ilka')).toBe(avant);
    // à la place d'une carte légère, elle ne tient pas non plus
    expect(echanger(j, j.porteurs.ilka!.modules[0]!, 'coeur-reprise@or', 'ilka').ok).toBe(false);
  });

  it('une vieille sauvegarde trop lourde rend des cartes à la collection, sans rien perdre', () => {
    const j = nouveauJeu(0);
    j.chambre = true;
    for (const k of ['bras-grue@argent', 'dorsale@argent', 'coeur-reprise@or']) j.collection[k] = { niveau: 5, doublons: 0 };
    j.porteurs.ilka!.modules = ['bras-grue@argent', 'dorsale@argent', 'coeur-reprise@or', 'ruee@fer', 'bond@fer', 'tir-vif@fer'];
    expect(estJeuValide(j)).toBe(true);
    expect(chargePortee(j, 'ilka')).toBeLessThanOrEqual(chargeMax(j, 'ilka'));
    expect(j.collection['coeur-reprise@or']).toBeDefined();
    expect(j.journal[0]).toMatch(/La Charge : Ilka/);
  });
});

describe('Les places vides', () => {
  it('une escouade descend avec 6 places par Porteur : celles qui manquent sont vides', () => {
    const j = nouveauJeu(0);
    j.chambre = true;
    j.porteurs.ilka!.modules = j.porteurs.ilka!.modules.slice(0, 4);
    expect(partir(j, ['ilka', 'doran', 'vela'], 1, 1).ok).toBe(true);
    const deck = j.expedition!.deck;
    expect(deck.filter((g) => g.vide)).toHaveLength(2);
    expect(deck.filter((g) => g.porteur === 'ilka')).toHaveLength(PLACES_PORTEUR);
  });

  it('une place vide ne se joue pas et quitte la main à la fin du tour', () => {
    const vide = { id: 'vide', porteur: 'ilka', nom: 'Place vide', f: 0, type: 'atk' as const, v: 0, vide: true };
    const ruee = gesteDeCarte('ruee@fer', 'ilka');
    const s = creerCombat({ porteurs: [{ id: 'ilka', pv: 38, pvMax: 38, aTerre: false }], ennemiId: 'remanent-faible', rng: 1, force: 1, ordonne: true,
      deck: [vide, vide, ruee, ruee, ruee, vide, vide, vide] });
    const vides = s.main.filter((g) => g.vide);
    expect(vides).toHaveLength(2);
    expect(ajouter(s, vides[0]!.uid).ok).toBe(false);
    expect(ajouter(s, s.main.find((g) => !g.vide)!.uid).ok).toBe(true);
    lancer(s, { silencieux: true });
    expect(s.defausse.filter((g) => g.vide).map((g) => g.uid).sort()).toEqual(vides.map((g) => g.uid).sort());
  });

  it('trois grosses cartes par Porteur ne battent plus six cartes bien choisies, à Charge égale', () => {
    const fin = (ids: string[]) => ids.map((id) => ({ id, niveau: 1 }));
    // 6 cartes en fer contre 3 des plus lourdes (le reste vide), pour un poids voisin
    const six = { ilka: fin(DEPART_PORTEURS.ilka!.map((id) => carteId(id, 'fer'))), doran: fin(DEPART_PORTEURS.doran!.map((id) => carteId(id, 'fer'))), vela: fin(DEPART_PORTEURS.vela!.map((id) => carteId(id, 'fer'))) };
    const trois = { ilka: fin(['oeil-relais@fer', 'gant-arc@fer', 'jambes-ressort@fer']), doran: fin(['crocs-fossiles@fer', 'yeux-nocturnes@fer', 'cuir-recif@fer']), vela: fin(['eclat-chant@fer', 'meche-or@fer', 'miroir-brume@fer']) };
    expect(mesurer(trois, 2, 40).progres).toBeLessThanOrEqual(mesurer(six, 2, 40).progres + 0.05);
  });
});
