import { describe, expect, it } from 'vitest';
import { analyser, estPartieDeTest, exporter, type Partie } from '../src/analyse/calculs';
import * as J from '../src/core/jeu';

const T = Date.parse('2026-10-25T10:00:00Z');
const JOUR = 86_400_000;

function partie(uid: string, debut: number, joue: number[], o: Partial<J.Jeu> = {}): Partie {
  const jeu = Object.assign(J.nouveauJeu(T - debut * JOUR), o);
  // un jour de jeu = une seconde active ce jour-là
  for (const d of [debut, ...joue]) J.noterTemps(jeu, T - d * JOUR, { actif: true, appareil: 'telephone', compte: 'invisible' });
  return { uid, jeu, maj: T - Math.min(debut, ...joue) * JOUR };
}

describe('Outil d’analyse', () => {
  const parties = [
    partie('a', 10, [9, 2], { strate: 3, introVue: true, chambre: true }),
    partie('b', 10, [], { strate: 1, introVue: true }),
    partie('c', 0, [], { strate: 1 }),
  ];
  parties[0]!.jeu.stats!.ennemis = { vigie: [3, 1, 0, 12] };
  parties[1]!.jeu.stats!.ennemis = { vigie: [1, 0, 1, 6] };
  const a = analyser(parties, T);

  it('compte les joueurs actifs et la rétention', () => {
    expect(a.joueurs).toBe(3);
    expect(a.actifs).toEqual({ jour: 1, semaine: 2, mois: 3 });
    // a et b ont commencé il y a 10 jours ; seul a est revenu le lendemain et une semaine après
    expect(a.retention.find((r) => r.delai === 1)).toEqual({ delai: 1, eligibles: 2, revenus: 1 });
    expect(a.retention.find((r) => r.delai === 7)).toEqual({ delai: 7, eligibles: 2, revenus: 1 });
    expect(a.parJour[13]).toMatchObject({ actifs: 1, nouveaux: 1 });
  });

  it('suit la progression et additionne les combats de tous les joueurs', () => {
    expect(a.entonnoir.find((l) => l.cle === 'intro')!.valeur).toBe(2);
    expect(a.strates.map((l) => l.valeur)).toEqual([2, 0, 1]);
    expect(a.ennemis[0]).toMatchObject({ id: 'vigie', combats: 6, victoires: 4, defaites: 1, fuites: 1, tours: 18 });
  });

  it('écarte les parties des tests automatiques', () => {
    expect(parties.some(estPartieDeTest)).toBe(false);
    const figee = J.nouveauJeu(Date.parse('2026-10-25T10:00:00Z'));
    expect(estPartieDeTest({ uid: 't', jeu: figee, maj: Date.parse('2026-10-25T14:30:00Z') })).toBe(true);
    // un vrai joueur à 10 h : la sauvegarde arrive tout de suite
    expect(estPartieDeTest({ uid: 'v', jeu: figee, maj: Date.parse('2026-10-25T10:01:00Z') })).toBe(false);
  });

  it('exporte sans identifiant ni pseudo', () => {
    parties[0]!.jeu.directeur = { nom: 'Secret', public: true, change: 0 };
    const texte = JSON.stringify(exporter(parties, T));
    expect(texte).not.toContain('Secret');
    expect(texte).not.toContain('"uid"');
    expect(exporter(parties, T).joueurs[0]).toMatchObject({ joueur: 1, strate: 3 });
  });
});
