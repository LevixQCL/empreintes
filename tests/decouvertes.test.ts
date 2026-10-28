// Premières rencontres (22 octobre 2026) : chaque mécanique est expliquée une fois, la première fois qu'elle apparaît.
import { describe, expect, it } from 'vitest';
import { creerCombat } from '../src/core/combat';
import { porteurDef } from '../src/core/donnees';
import { decouverteEnAttente, decouvertesDuCombat } from '../src/core/decouvertes';
import { nouveauJeu } from '../src/core/jeu';

const equipe = () => ['ilka', 'doran', 'vela'].map((id) => ({ id, pv: porteurDef(id).pvMax, pvMax: porteurDef(id).pvMax, aTerre: false }));

describe('Les premières rencontres', () => {
  it('la salle et le groupe d’abord (ils comptent dès le premier coup), puis la Fêlure et les traits', () => {
    const s = creerCombat({ porteurs: equipe(), ennemiId: 'vigie', escorte: ['pilleur'], condition: 'brouillard', rng: 1 });
    expect(decouvertesDuCombat(s).map((d) => d.id)).toEqual(['condition-brouillard', 'groupe', 'felure', 'trait-blinde', 'trait-aspire', 'trait-vengeur']);
  });
  it('la Furie s’explique quand elle s’allume, sous la moitié des PV', () => {
    const s = creerCombat({ porteurs: equipe(), ennemiId: 'brigadier', rng: 1 });
    expect(decouvertesDuCombat(s).some((d) => d.id === 'trait-furie')).toBe(false);
    s.ennemi.pv = Math.floor(s.ennemi.pvMax / 2);
    expect(decouvertesDuCombat(s).some((d) => d.id === 'trait-furie')).toBe(true);
  });
  it('ce qui a été vu ne revient pas', () => {
    const s = creerCombat({ porteurs: equipe(), ennemiId: 'vigie', escorte: ['pilleur'], rng: 1 });
    expect(decouverteEnAttente(['felure', 'groupe', 'trait-blinde', 'trait-aspire'], s)!.id).toBe('trait-vengeur');
    expect(decouverteEnAttente(['felure', 'groupe', 'trait-blinde', 'trait-aspire', 'trait-vengeur'], s)).toBeNull();
  });
  it('rien dans la Strate −1 (ennemis sans traits), et la phase d’un gardien quand elle arrive', () => {
    const simple = creerCombat({ porteurs: equipe(), ennemiId: 'vigie', rng: 1, traits: false });
    expect(decouvertesDuCombat(simple)).toEqual([]);
    const g = creerCombat({ porteurs: equipe(), ennemiId: 'confluence', rng: 1 });
    expect(decouvertesDuCombat(g).some((d) => d.id === 'phase')).toBe(false);
    g.ennemi.phase2 = true;
    expect(decouvertesDuCombat(g).some((d) => d.id === 'phase')).toBe(true);
  });
  it('le Coup d’éclat s’explique la première fois que le Flux est plein', () => {
    const s = creerCombat({ porteurs: equipe(), ennemiId: 'remanent', rng: 1 });
    expect(decouvertesDuCombat(s).some((d) => d.id === 'eclat')).toBe(false);
    s.flux = 3;
    expect(decouvertesDuCombat(s).find((d) => d.id === 'eclat')!.texte).toContain('Débridage');
  });
  it('une nouvelle partie n’a rien vu', () => {
    expect(nouveauJeu(0, 1).decouvertes).toEqual([]);
  });
});
