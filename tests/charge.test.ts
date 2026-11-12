import { describe, expect, it } from 'vitest';
import { CHARGE, NIVEAU_METAL, PLACES_PORTEUR, chargeNiveau, metalJouable, poidsCarte } from '../src/core/collection';
import { ajouter, creerCombat, lancer } from '../src/core/combat';
import { DEPART_PORTEURS, carteId, gesteDeCarte } from '../src/core/donnees';
import { chargeMax, chargePortee, echanger, estJeuValide, greffer, niveauPorteur, nouveauJeu, partir } from '../src/core/jeu';
import { gestesDe } from '../src/core/partie/descentes';
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

  // 12 novembre 2026 (Bryan : « ça complique quand même bien le jeu ») : la Charge ne limite plus le deck
  it('plus de carte « trop lourde » : seuls les places et le niveau demandé par le métal comptent', () => {
    const j = nouveauJeu(0);
    j.chambre = true;
    j.collection['coeur-reprise@or'] = { niveau: 5, doublons: 0 };
    for (const k of ['bras-grue@argent', 'dorsale@argent']) j.collection[k] = { niveau: 5, doublons: 0 };
    j.porteurs.ilka!.xp = 1_000_000;
    j.porteurs.ilka!.modules = ['bras-grue@argent', 'dorsale@argent', 'ruee@fer'];
    expect(niveauPorteur(j, 'ilka').niveau).toBeGreaterThanOrEqual(NIVEAU_METAL.or);
    expect(greffer(j, 'coeur-reprise@or', 'ilka').ok).toBe(true);
    expect(chargePortee(j, 'ilka')).toBeLessThanOrEqual(chargeMax(j, 'ilka'));
    // la dernière place prise, plus rien n'entre : ce sont les places qui limitent
    for (const k of ['bond@fer', 'tir@fer', 'esquive@fer']) if (j.porteurs.ilka!.modules.length < PLACES_PORTEUR && !j.porteurs.ilka!.modules.includes(k)) j.porteurs.ilka!.modules.push(k);
    expect(j.porteurs.ilka!.modules).toHaveLength(PLACES_PORTEUR);
    expect(echanger(j, 'ruee@fer', 'tir-vif@fer', 'ilka').ok).toBe(true);
  });

  it('une carte d’un métal trop haut pour son Porteur reste dans son deck, jouée dans le métal qu’il peut porter (12 novembre 2026)', () => {
    const j = nouveauJeu(0);
    j.chambre = true;
    for (const k of ['jambes-ressort@or']) j.collection[k] = { niveau: 3, doublons: 0 };
    j.porteurs.ilka!.modules = ['jambes-ressort@or', 'ruee@fer', 'bond@fer', 'tir-vif@fer'];
    expect(estJeuValide(j)).toBe(true);
    expect(j.porteurs.ilka!.modules).toContain('jambes-ressort@or');
    expect(niveauPorteur(j, 'ilka').niveau).toBeLessThan(NIVEAU_METAL.argent);
    const jouees = gestesDe(j, 'ilka').map((g) => g.carte);
    expect(jouees).toContain(metalJouable('jambes-ressort@or', niveauPorteur(j, 'ilka').niveau));
    expect(jouees).not.toContain('jambes-ressort@or');
  });

  it('le métal demande un niveau de Porteur : argent 5, or 9, nacre 13 (12 novembre 2026 ; avant 4, 7 et 10)', () => {
    const j = nouveauJeu(0);
    j.chambre = true;
    j.collection['coeur-reprise@or'] = { niveau: 5, doublons: 0 };
    j.porteurs.ilka!.modules = j.porteurs.ilka!.modules.slice(0, 4);
    const r = greffer(j, 'coeur-reprise@or', 'ilka');
    expect(r.ok).toBe(false);
    expect(r.message).toMatch(new RegExp(`niveau ${NIVEAU_METAL.or}`));
    expect(NIVEAU_METAL).toMatchObject({ argent: 5, or: 9, nacre: 13 });
    j.porteurs.ilka!.xp = 1_000_000;
    expect(greffer(j, 'coeur-reprise@or', 'ilka').ok).toBe(true);
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

describe('Courbe d’XP du 3 novembre 2026', () => {
  it('une ancienne sauvegarde garde le niveau de ses Porteurs', () => {
    const j = nouveauJeu(0);
    // niveau 14 et un peu plus avec l'ancienne courbe (12·n^1,6)
    let ancien = 0; for (let n = 1; n < 14; n++) ancien += Math.round(12 * n ** 1.6);
    j.porteurs.ilka!.xp = ancien + 400;
    delete j.xpV;
    const k = JSON.parse(JSON.stringify(j));
    expect(estJeuValide(k)).toBe(true);
    const n = niveauPorteur(k, 'ilka');
    expect(n.niveau).toBe(14);
    expect(n.xp / n.requis!).toBeCloseTo(400 / Math.round(12 * 14 ** 1.6), 2);
  });
});
