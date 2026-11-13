// La répétition (12 novembre 2026, Bryan : « deux séances sur trois se passent à refouiller du contenu déjà vaincu ») :
// la Strate remuée du jour, la fouille confiée, et la Flèche pendant les paliers.
import { describe, expect, it } from 'vitest';
import {
  CONFIEE, REMUEE, apercuConfiee, confierFouille, fouiller, forceConfiee, jourDe, nouveauJeu, peutConfier, remonter, strateRemuee, tick,
  escouadesDe, forceEscouade, placerDansEscouade, type Jeu,
} from '../src/core/jeu';
import { FOND, particularite } from '../src/core/strates';
import { jouerExpedition, mediane, simulerParcours, PROFILS } from '../src/core/parcours';
import { jouerTour } from '../src/core/robot';

const H = 3_600_000;
const T0 = Date.UTC(2026, 10, 12, 10);
const partie = (strate: number): Jeu => { const j = nouveauJeu(T0, 7); j.chambre = true; j.recrues = true; j.strate = strate; j.frontVaincu = false; return j; };

describe('La Strate remuée du jour', () => {
  it('rien avant que la Strate −3 soit vaincue', () => {
    expect(strateRemuee(partie(3), T0)).toBeNull();
    expect(strateRemuee(partie(4), T0)).not.toBeNull();
  });

  it('une des trois Strates vaincues les plus profondes, jamais la même deux jours de suite, et une particularité qui n’est pas la sienne', () => {
    const j = partie(9);
    let avant = -1;
    for (let d = 0; d < 60; d++) {
      const r = strateRemuee(j, T0 + d * 24 * H)!;
      expect(r.strate).toBeGreaterThanOrEqual(6);
      expect(r.strate).toBeLessThanOrEqual(8);
      expect(r.strate).not.toBe(avant);
      expect(r.modele).not.toBe(r.strate);
      expect(particularite(r.modele)).toBeTruthy();
      avant = r.strate;
    }
  });

  it('reste au-dessus du Fond (le Fond a déjà sa rotation)', () => {
    const j = partie(15);
    for (let d = 0; d < 20; d++) expect(strateRemuee(j, T0 + d * 24 * H)!.strate).toBeLessThan(FOND.des);
  });

  it('la première fouille réussie du jour y laisse la prime, une seule fois', () => {
    const j = partie(6);
    tick(j, T0);
    const r = strateRemuee(j, T0)!;
    const esc = escouadesDe(j)[0]!;
    const sortie = () => { for (const p of Object.values(j.porteurs)) p.usure = 0; return jouerExpedition(j, () => fouiller(j, esc, r.strate, 'composants', 99).ok, jouerTour); };
    j.eclats = 0;
    expect(sortie()).toBe(true);
    expect(j.remueeFaite).toBe(jourDe(T0));
    expect(j.choix.some((c) => c.source === 'remuee')).toBe(true);
    expect(j.eclats).toBeGreaterThanOrEqual(REMUEE.eclats);
    const n = j.choix.filter((c) => c.source === 'remuee').length;
    sortie();
    expect(j.choix.filter((c) => c.source === 'remuee').length).toBe(n);
  });

  it('la sortie dans la Strate remuée emprunte bien sa particularité', () => {
    const j = partie(6);
    tick(j, T0);
    const r = strateRemuee(j, T0)!;
    fouiller(j, escouadesDe(j)[0]!, r.strate, 'composants', 5);
    expect(j.expedition?.remuee).toBe(true);
    expect(j.expedition?.modele).toBe(r.modele);
    remonter(j);
  });
});

describe('La fouille confiée', () => {
  /** une partie après −4 avec deux escouades complètes */
  const deuxEscouades = (): Jeu => {
    const j = partie(6);
    for (const id of ['liane', 'joss', 'sasha', 'aurel', 'coursier', 'docker', 'guetteur']) if (!j.porteurs[id]) continue;
    tick(j, T0);
    return j;
  };

  it('fermée avant la 2ᵉ escouade', () => {
    const j = partie(4);
    tick(j, T0);
    expect(peutConfier(j, escouadesDe(j)[0]!, 1, 'composants').ok).toBe(false);
  });

  it('ce qui est annoncé avant le départ est ce qui est versé au retour', () => {
    const j = deuxEscouades();
    const esc = escouadesDe(j)[0]!;
    const strate = [1, 2, 3, 4, 5].find((s) => forceEscouade(j, esc) >= forceConfiee(s))!;
    expect(strate).toBeTruthy();
    const a = apercuConfiee(strate, 'composants');
    expect(confierFouille(j, esc, strate, 'composants', T0).ok).toBe(true);
    // une seule à la fois, et l'escouade est partie
    expect(confierFouille(j, esc, strate, 'composants', T0).ok).toBe(false);
    const avant = j.composants;
    tick(j, T0 + (CONFIEE.heures - 1) * H);
    expect(j.confiee).toBeTruthy();
    tick(j, T0 + CONFIEE.heures * H);
    expect(j.confiee).toBeNull();
    expect(j.composants - avant).toBe(a.minerai);
    expect((j.rapports ?? []).some((r) => r.confiee?.strate === strate && !r.lu)).toBe(true);
  });

  it('refusée quand l’escouade est trop juste pour la Strate', () => {
    const j = deuxEscouades();
    const esc = escouadesDe(j)[0]!;
    expect(forceEscouade(j, esc)).toBeLessThan(forceConfiee(6));
    expect(peutConfier(j, esc, 6, 'composants').ok).toBe(false);
  });

  it('rapporte moins qu’une fouille jouée (minerai et expérience)', () => {
    const a = apercuConfiee(5, 'composants');
    expect(a.minerai).toBeGreaterThan(0);
    expect(CONFIEE.part).toBeLessThan(1);
    expect(apercuConfiee(5, 'tech').metal).toBeTruthy();
    expect(apercuConfiee(5, 'eclats').eclats).toBe(CONFIEE.eclats);
  });

  it('une escouade partie ne peut pas descendre, et ses Porteurs ne changent pas d’escouade', () => {
    const j = deuxEscouades();
    const esc = escouadesDe(j)[0]!;
    expect(confierFouille(j, esc, 1, 'composants', T0).ok).toBe(true);
    expect(fouiller(j, esc, 1, 'composants', 3).ok).toBe(false);
    expect(placerDansEscouade(j, 1, esc[0]!, 0).ok).toBe(false);
  });
});

describe('Moins de répétition au parcours simulé', () => {
  it('un joueur assidu refouille bien moins souvent la même Strate, et ouvre −10 au même rythme (médiane de 7 parties)', () => {
    const compter = (ancien: boolean) => {
      let fouilles = 0, total = 0;
      // 7 parties (12 novembre 2026) : sur 5, une seule partie bloquée avant −10 en mode ancien faisait bouger la médiane de 2 jours
      const jours = [1, 2, 3, 4, 5, 6, 7].map((g) => simulerParcours(PROFILS.assidu, 14, g, { joueur: 'moyen', ancien, sorte: (s) => { total++; if (s === 'fouille') fouilles++; } }).ouverture[10] ?? 99);
      return { part: fouilles / total, j10: mediane(jours) };
    };
    const avant = compter(true), apres = compter(false);
    expect(apres.part).toBeLessThan(avant.part / 2);
    // 12 novembre 2026 (promotion des cartes) : les cartes promues rendent l'ouverture de −10 plutôt plus rapide sans la répétition
    // (médianes 7 contre 10) ; ce qui compte ici, c'est que moins refouiller ne ralentisse pas la descente
    // 13 novembre 2026 : sur 21 parties, l'écart était déjà d'un jour avant le réglage de trois cartes (7 contre 8), puis 7 contre 9 :
    // à 7 parties, un jour de plus ou de moins, c'est le bruit de la simulation ; on garde la garde à deux jours
    expect(apres.j10).toBeLessThanOrEqual(avant.j10 + 2);
  }, 240_000);
});
