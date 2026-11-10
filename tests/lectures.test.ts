// Les Lectures (prototype du Pack des origines) : le fil, les liens, les intrus et le faux souvenir.
import { describe, expect, it } from 'vitest';
import { COEUR_DES_JAMBES, etoilesLecture, lire, liens, motifCommun, nouvelleLecture, poser, toucherFil, toutAllume } from '../src/core/lectures';

/** tous les fils de 7 fragments entièrement allumés */
function filsAllumes(): string[][] {
  const F = COEUR_DES_JAMBES.fragments;
  const sortie: string[][] = [];
  const suivre = (ch: number[]) => {
    if (ch.length === COEUR_DES_JAMBES.ordre.length) { sortie.push(ch.map((i) => F[i]!.id)); return; }
    F.forEach((f, i) => { if (!ch.includes(i) && (!ch.length || motifCommun(F[ch.at(-1)!]!, f))) suivre([...ch, i]); });
  };
  suivre([]);
  return sortie;
}

describe('Lectures', () => {
  it('le vrai souvenir est un fil tout allumé, et seuls les intrus offrent d’autres fils', () => {
    const fils = filsAllumes();
    expect(fils.map((f) => f.join())).toContain(COEUR_DES_JAMBES.ordre.join());
    // chaque faux fil allumé contient au moins un intrus : l'ordre seul ne piège pas, la lecture des fragments oui
    for (const f of fils.filter((x) => x.join() !== COEUR_DES_JAMBES.ordre.join())) {
      expect(f.some((id) => COEUR_DES_JAMBES.fragments.find((x) => x.id === id)!.intrus)).toBe(true);
    }
    expect(fils.length).toBeGreaterThan(1);
  });

  it('un faux souvenir se lit, puis le vrai', () => {
    const e = nouvelleLecture();
    for (const id of ['porte', 'plafond', 'lampe', 'main', 'plus-vite', 'aube', 'course']) poser(e, id);
    expect(toutAllume(e)).toBe(true);
    expect(lire(e)).toBe('faux');
    expect(e.dernierFaux?.recit).toHaveLength(7);
    // on choisit le moment 5 et on y met le bon fragment : l'intrus retourne aux fragments
    toucherFil(e, 4);
    poser(e, 'murs');
    expect(lire(e)).toBe('vrai');
    expect(etoilesLecture(e)).toBe(2);
  });

  it('échanger deux moments, retirer un fragment', () => {
    const e = nouvelleLecture();
    poser(e, 'plafond'); poser(e, 'porte');
    expect(liens(e)[0]).toBeNull();
    toucherFil(e, 0); toucherFil(e, 1);
    expect(e.fil.slice(0, 2)).toEqual(['porte', 'plafond']);
    expect(liens(e)[0]).toBe('froid');
    toucherFil(e, 1); toucherFil(e, 1);
    expect(e.fil[1]).toBeNull();
  });
});
