import { describe, expect, it } from 'vitest';
import { analyser, csvJoueurs, estPartieDeTest, exporter, filtrer, sansTests, type Partie } from '../src/analyse/calculs';
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
    expect(a.parJour.at(-1)).toMatchObject({ actifs: 1, nouveaux: 1 });
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

  it('écarte les simples visites : écran titre ouvert sans jamais commencer', () => {
    // c n'a jamais passé l'intro ni joué une minute ; a et b ont commencé
    const r = sansTests(parties);
    expect(r).toMatchObject({ tests: 0, visites: 1 });
    expect(r.parties.map((p) => p.uid)).toEqual(['a', 'b']);
  });

  it('exporte sans identifiant ni pseudo', () => {
    parties[0]!.jeu.directeur = { nom: 'Secret', public: true, change: 0 };
    const texte = JSON.stringify(exporter(parties, T));
    expect(texte).not.toContain('Secret');
    expect(texte).not.toContain('"uid"');
    expect(exporter(parties, T).joueurs[0]).toMatchObject({ joueur: 1, strate: 3 });
  });
});

describe('Outil d’analyse : filtres, points d’attention, CSV', () => {
  it('filtre par période et par groupe', () => {
    const p = [partie('a', 1, []), partie('b', 20, [])];
    p[1]!.jeu.stats!.appareil = 'pc';
    p[1]!.jeu.stats!.compte = 'protege';
    expect(filtrer(p, { periode: '7', segment: 'tous' }, T).map((x) => x.uid)).toEqual(['a']);
    expect(filtrer(p, { periode: 'tout', segment: 'pc' }, T).map((x) => x.uid)).toEqual(['b']);
    expect(filtrer(p, { periode: 'tout', segment: 'invisible' }, T)).toHaveLength(1);
  });

  it('signale un ennemi trop fort et une étape où l’on décroche', () => {
    const p = Array.from({ length: 10 }, (_, i) => partie(`j${i}`, 3, [], { introVue: true, chambre: i < 3 }));
    p[0]!.jeu.stats!.ennemis = { vigie: [10, 8, 4, 40] };
    const a = analyser(p, T);
    expect(a.alertes.some((x) => x.theme === 'Combats' && x.texte.includes('Trop fort'))).toBe(true);
    expect(a.alertes.some((x) => x.theme === 'Progression' && x.texte.includes('Chambre'))).toBe(true);
  });

  it('écrit la liste des joueurs en CSV', () => {
    const csv = csvJoueurs(analyser([partie('a', 2, [1])], T).liste);
    expect(csv.split('\n')).toHaveLength(2);
    expect(csv.split('\n')[0]).toContain('joueur;strate;minutes');
  });
});
