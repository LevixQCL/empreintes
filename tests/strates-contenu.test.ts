import { describe, expect, it } from 'vitest';
import { accessibles, cartesAccordees, cloturerCombat, combatSuivant, entrerSalle, genererCarte, nouvelleExploration, ouvrirPorte, RANG_HALTE, reperentPassage, suivrePassage, visionSalle } from '../src/core/expedition';
import { choisirHalte, entrer, nouveauJeu, partir, remonter, fouiller } from '../src/core/jeu';
import { BESTIAIRE, HALTES, PARTICULARITES, QUETES, SECRETS, halteDef, lignesBestiaire, nombreHaltes, voixDetail } from '../src/core/strates';
import { ZONES, porteurDef } from '../src/core/donnees';
import type { GesteDef } from '../src/core/types';

const pret = (strate = 10) => { const j = nouveauJeu(0, 1); j.chambre = true; j.recrues = true; j.strate = strate; return j; };
const ESC = ['ilka', 'doran', 'vela'];

/** va droit à la Halte, en passant par des salles sans combat quand il y en a, ou en gagnant les combats d'office */
function allerALaHalte(j: ReturnType<typeof pret>) {
  for (let g = 0; g < 20 && !j.expedition!.enHalte && j.expedition!.carte!.salles[j.expedition!.carte!.position]!.type !== 'halte'; g++) {
    const x = j.expedition!;
    const halte = accessibles(x).find((s) => s.type === 'halte');
    const s = halte ?? accessibles(x)[0]!;
    entrer(j, s.id);
    let y = j.expedition!;
    if (y.rencontre) y = { ...y, rencontre: undefined };
    if (y.porte) y = { ...y, porte: undefined };
    if (y.phase === 'combat') { y.combat.issue = 'victoire'; y = combatSuivant(cloturerCombat(y)); }
    j.expedition = y;
  }
}

describe('Les Haltes', () => {
  it('une Halte par Strate de −1, deux à −2, trois ensuite ; toutes écrites, avec deux choix et une voix de secours par détail', () => {
    for (let s = 1; s <= 10; s++) {
      expect(nombreHaltes(s)).toBe(Math.min(3, s));
      for (let n = 1; n <= nombreHaltes(s); n++) {
        const h = halteDef(s, n)!;
        expect(h, `Halte ${n} de −${s}`).toBeTruthy();
        expect(h.choix).toHaveLength(2);
        for (const d of h.details) expect(d.voix.some((v) => !v.qui && v.texte)).toBe(true);
      }
    }
    expect(HALTES).toHaveLength(27);
    expect(nombreHaltes(11)).toBe(0);
  });

  it('un passage obligatoire : la rangée de la Halte n’a qu’une salle, et tous les chemins y mènent', () => {
    for (const rng of [1, 7, 42, 99]) {
      const c = genererCarte(4, rng, undefined, false, { halte: true });
      const rang = c.salles.filter((s) => s.rang === RANG_HALTE);
      expect(rang).toHaveLength(1);
      expect(rang[0]!.type).toBe('halte');
      expect(Math.max(...c.salles.map((s) => s.rang))).toBe(9);
      // les salles de la rangée d'avant mènent toutes à la Halte
      for (const s of c.salles.filter((s) => s.rang === RANG_HALTE - 1)) expect(s.voisins).toEqual([rang[0]!.id]);
    }
    // sans Halte (au-delà de −10, fouilles), la carte garde 9 rangées
    expect(Math.max(...genererCarte(4, 1).salles.map((s) => s.rang))).toBe(8);
  });

  it('une Halte de plus à chaque descente ; le choix rapporte, et le souvenir est gardé', () => {
    const j = pret(3);
    partir(j, ESC, 3, 11);
    expect(j.expedition!.halte).toBe(1);
    allerALaHalte(j);
    expect(j.expedition!.enHalte).toBe(true);
    const eclats = j.expedition!.gains!.eclats;
    expect(entrer(j, accessibles(j.expedition!)[0]!.id).ok).toBe(false); // il faut d'abord choisir
    expect(choisirHalte(j, 1).ok).toBe(true); // « Laisser le clou au noir » : un Éclat
    expect(j.expedition!.gains!.eclats).toBe(eclats + 1);
    expect(j.drapeaux).toContain('clou-respecte');
    expect(j.haltes![3]).toBe(1);
    remonter(j);
    partir(j, ESC, 3, 12);
    expect(j.expedition!.halte).toBe(2);
  });

  it('la lanterne éclaire les deux rangées après la Halte', () => {
    const j = pret(3);
    partir(j, ESC, 3, 11);
    allerALaHalte(j);
    choisirHalte(j, 0);
    const x = j.expedition!;
    for (const s of x.carte!.salles.filter((s) => s.rang > RANG_HALTE && s.rang <= RANG_HALTE + 2)) expect(visionSalle(x, s)).toBe('claire');
  });

  it('une fois toutes vues, la Halte devient un lieu connu, sans choix', () => {
    const j = pret(1);
    j.haltes = { 1: 1 };
    partir(j, ESC, 1, 3);
    expect(j.expedition!.halte).toBe('connu');
    allerALaHalte(j);
    expect(j.expedition!.carte!.salles[j.expedition!.carte!.position]!.type).toBe('halte');
    expect(j.expedition!.enHalte).toBeFalsy();
  });

  it('une voix liée à un souvenir passe devant les autres', () => {
    const d = halteDef(10, 3)!.details[2]!;
    expect(voixDetail(d, ['ilka'], []).texte).toMatch(/réponses/);
    expect(voixDetail(d, ['ilka'], ['nom-grave']).texte).toMatch(/mur des fouilleurs/);
    expect(voixDetail(d, ['doran'], []).qui).toBe('');
  });
});

describe('Les particularités des Strates', () => {
  it('−2 : des caches murées ; un Augmenté debout y trouve le double', () => {
    let c = genererCarte(2, 1);
    let g = 0;
    while (!c.salles.some((s) => s.mur) && g < 50) c = genererCarte(2, ++g);
    const mur = c.salles.find((s) => s.mur)!;
    expect(mur.type).toBe('cache');
    const base = { porteurs: ['ilka', 'doran', 'vela'].map((id) => ({ id, pv: 30, pvMax: 30, aTerre: false })), deck: [] as GesteDef[], strate: 2, rng: g };
    const x = nouvelleExploration(base);
    const y = { ...x, carte: { ...x.carte!, position: c.salles.find((s) => s.voisins.includes(mur.id))!.id, salles: x.carte!.salles } };
    const avec = entrerSalle(y, mur.id).x.butin;
    const sansAugmente = { ...y, porteurs: y.porteurs.map((p) => (porteurDef(p.id).lignee === 'tech' ? { ...p, pv: 0 } : p)) };
    expect(avec).toBe(2 * entrerSalle(sansAugmente, mur.id).x.butin);
  });

  it('−7 : une salle à deux souvenirs ; on peut affronter le second', () => {
    let g = 0;
    let c = genererCarte(7, g);
    while (!c.salles.some((s) => s.double && s.rang === 1) && g < 200) c = genererCarte(7, ++g);
    const s = c.salles.find((s) => s.double && s.rang === 1)!;
    const x = nouvelleExploration({ porteurs: [{ id: 'ilka', pv: 30, pvMax: 30, aTerre: false }], deck: [], strate: 7, rng: g });
    expect(visionSalle(x, x.carte!.salles[s.id]!)).toBe('claire');
    const y = entrerSalle(x, s.id, true).x;
    expect(y.combat.ennemi.id).toBe(s.double);
  });

  it('−9 : un fil relie deux salles côte à côte, une seule fois', () => {
    const c = genererCarte(9, 5);
    const a = c.salles.find((s) => s.fil !== undefined)!;
    expect(a).toBeTruthy();
    expect(c.salles[a.fil!]!.rang).toBe(a.rang);
    expect(c.salles[a.fil!]!.fil).toBe(a.id);
  });

  it('−8 : un Veilleur égaré attend toujours sur le plan', () => {
    for (const rng of [1, 2, 3, 4, 5]) expect(genererCarte(8, rng).salles.some((s) => s.rencontre === 'veilleur')).toBe(true);
  });

  it('une particularité de −2 à −10, et une quête de −1 à −10', () => {
    expect(PARTICULARITES.map((p) => p.strate)).toEqual([2, 3, 4, 5, 6, 7, 8, 9, 10]);
    expect(QUETES.map((q) => q.strate)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    for (const q of QUETES) expect(q.etapes.length).toBe(q.strate <= 5 ? 3 : 4);
  });
});

describe('La quête de la Strate', () => {
  it('une marque par descente, en expédition comme en fouille ; trouvée, elle avance la quête au retour', () => {
    const j = pret(3);
    partir(j, ESC, 2, 21);
    expect(j.expedition!.carte!.salles.filter((s) => s.quete)).toHaveLength(1);
    j.expedition!.gains!.etape = true;
    const r = remonter(j);
    expect(r.quete?.etape).toBe(1);
    expect(j.quetes![2]).toBe(1);
    fouiller(j, ESC, 2, 'composants', 3);
    expect(j.expedition!.carte!.salles.filter((s) => s.quete)).toHaveLength(1);
  });

  it('la dernière étape rapporte une carte ; une quête finie ne pose plus de marque', () => {
    const j = pret(3);
    j.quetes = { 1: 2 };
    partir(j, ESC, 1, 4);
    j.expedition!.gains!.etape = true;
    const avant = Object.keys(j.collection).length + Object.values(j.collection).reduce((n, c) => n + c.doublons, 0);
    const r = remonter(j);
    expect(r.quete?.finie).toBe(true);
    expect(r.cartes.length).toBeGreaterThan(0);
    expect(Object.keys(j.collection).length + Object.values(j.collection).reduce((n, c) => n + c.doublons, 0)).toBeGreaterThan(avant);
    partir(j, ESC, 1, 5);
    expect(j.expedition!.carte!.salles.some((s) => s.quete)).toBe(false);
  });
});

describe('Les portes à Fréquence', () => {
  const carte = (f: number, fs?: number[], accord = false): GesteDef => ({ id: `c${f}`, porteur: 'ilka', nom: 'x', f, type: 'atk', v: 1, ...(fs ? { fs } : {}), ...(accord ? { effet: { type: 'accord' } } : {}) });
  it('trois Fréquences qui se suivent ouvrent, dans n’importe quel ordre ; l’Accord prolonge', () => {
    expect(cartesAccordees([carte(5), carte(3), carte(4)], 3)).toBe(true);
    expect(cartesAccordees([carte(5), carte(3), carte(7)], 3)).toBe(false);
    expect(cartesAccordees([carte(5), carte(1, [1, 4]), carte(6)], 3)).toBe(true);
    expect(cartesAccordees([carte(2), carte(9, undefined, true), carte(3)], 3)).toBe(true);
    expect(cartesAccordees([carte(2), carte(3), carte(4)], 4)).toBe(false);
  });

  it('une porte refuse une mauvaise suite sans rien coûter, et rapporte un Éclat à la bonne', () => {
    const deck = [carte(3), carte(4), carte(5), carte(8), carte(1)];
    const x = nouvelleExploration({ porteurs: [{ id: 'ilka', pv: 30, pvMax: 30, aTerre: false }], deck, strate: 6, rng: 1 });
    const y = { ...x, porte: { main: [0, 1, 2, 3, 4], relance: false } };
    expect(ouvrirPorte(y, [0, 1, 3]).ok).toBe(false);
    const r = ouvrirPorte(y, [2, 0, 1]);
    expect(r.ok).toBe(true);
    expect(r.x.gains!.eclats).toBe(1);
    expect(r.x.porte).toBeUndefined();
  });

  it('pas de porte avant −5, des portes ensuite', () => {
    for (const rng of [1, 2, 3, 4, 5, 6]) expect(genererCarte(4, rng).salles.some((s) => s.type === 'porte')).toBe(false);
    expect([1, 2, 3, 4, 5, 6, 7, 8].some((rng) => genererCarte(6, rng).salles.some((s) => s.type === 'porte'))).toBe(true);
  });
});

describe('Les passages secrets', () => {
  it('seuls certains Porteurs les repèrent ; le passage rapporte des composants et une archive, une fois', () => {
    let g = 0;
    let c = genererCarte(4, g);
    while (!c.salles.some((s) => s.secret === 'service') && g < 300) c = genererCarte(4, ++g);
    const s = c.salles.find((s) => s.secret === 'service')!;
    const p = (id: string) => ({ id, pv: 30, pvMax: 30, aTerre: false });
    const avec = nouvelleExploration({ porteurs: [p('doran'), p('ilka')], deck: [], strate: 4, rng: g });
    const sans = nouvelleExploration({ porteurs: [p('vela'), p('ilka')], deck: [], strate: 4, rng: g });
    expect(reperentPassage(avec, s)).toEqual(['doran']);
    expect(reperentPassage(sans, s)).toEqual([]);
    const ici = { ...avec, carte: { ...avec.carte!, position: s.id } };
    const r = suivrePassage(ici);
    expect(r.ok).toBe(true);
    expect(r.x.gains!.fragment).toBe(true);
    expect(suivrePassage(r.x).ok).toBe(false);
    for (const d of SECRETS) for (const id of Object.keys(d.voix)) expect(porteurDef(id)).toBeTruthy();
  });
});

describe('Le bestiaire', () => {
  it('une fiche pour chaque ennemi des Strates, ouverte en trois paliers', () => {
    for (const z of ZONES) for (const id of [...z.ennemis, z.boss]) expect(BESTIAIRE[id], id).toBeTruthy();
    expect(lignesBestiaire('vigie', 0)).toEqual({ prochain: 1 });
    expect(Object.keys(lignesBestiaire('vigie', 4))).toEqual(['origine', 'conseil', 'prochain']);
    expect(lignesBestiaire('vigie', 10).secret).toBeTruthy();
  });
});

import { decouvertesExploration } from '../src/core/decouvertes';

describe('Les premières rencontres de l’exploration (31 octobre 2026)', () => {
  it('la particularité, la quête et la Halte s’expliquent quand elles apparaissent ; rien pendant le tutoriel', () => {
    const j = pret(3);
    partir(j, ESC, 3, 11);
    const ids = () => decouvertesExploration(j.expedition!, j.quetes).map((d) => d.id);
    expect(ids()).toContain('strate-3');
    if (j.expedition!.carte!.salles.some((s) => s.quete)) expect(ids()).toContain('quete');
    expect(ids()).not.toContain('halte');
    allerALaHalte(j);
    expect(ids()).toContain('halte');
    expect(ids()).toContain('bestiaire');
    expect(decouvertesExploration({ ...j.expedition!, tutoriel: true }, j.quetes)).toHaveLength(0);
  });

  it('chaque Strate à particularité a son conseil, et la quête finie ne s’annonce plus', () => {
    for (const p of PARTICULARITES) {
      const j = pret(p.strate);
      partir(j, ESC, p.strate, 5);
      const d = decouvertesExploration(j.expedition!, { [p.strate]: 99 });
      expect(d.find((x) => x.id === `strate-${p.strate}`)!.conseil).not.toBe('');
      expect(d.some((x) => x.id === 'quete')).toBe(false);
    }
  });
});
