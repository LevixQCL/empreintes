// Le serveur du Gardien de la ville (13 novembre 2026) : il relit la sauvegarde, rejoue les combats et compte les parts lui-même.
import { describe, expect, it } from 'vitest';
import { nouveauJeu, frapperGardien, remonter, combatGardienFini } from '../src/core/jeu';
import { combatNote } from '../src/core/partie/gardien';
import { debutJour } from '../src/core/partie/etat';
import { compterFrappes, frappesPermises, lirePartie, pvVille } from '../src/serveur/gardien';

const ESC = ['ilka', 'doran', 'vela'];
const LUNDI = debutJour(7 * 300) + 3_600_000;

function partieAvecFrappe(rng = 4242) {
  const j = nouveauJeu(0, 1);
  j.chambre = true; j.recrues = true; j.strate = 5; j.frontVaincu = true; j.dernierTick = LUNDI;
  frapperGardien(j, ESC, LUNDI, rng);
  const x = j.expedition!;
  const C = combatNote(x.gardienVille!.journal);
  const s = x.combat;
  for (let t = 0; t < 40 && !combatGardienFini(s); t++) {
    for (const g of [...s.main].sort((a, b) => Number(b.type === 'atk') - Number(a.type === 'atk'))) C.ajouter(s, g.uid);
    if (!s.chaine.length) { C.repiocher(s); continue; }
    C.lancer(s);
  }
  remonter(j);
  // ce que le serveur lit : la partie telle qu'elle est sauvée en ligne (un texte)
  return { j, texte: JSON.stringify(j), frappes: JSON.parse(JSON.stringify(j.gardienVille!.aEnvoyer)) };
}

describe('Le serveur du Gardien', () => {
  it('relit la sauvegarde et compte les mêmes parts que le téléphone', () => {
    const { texte, frappes } = partieAvecFrappe();
    const partie = lirePartie(texte)!;
    expect(partie).not.toBeNull();
    const b = compterFrappes(partie, frappes, null, LUNDI + 3_600_000);
    expect(b.refus).toEqual([]);
    expect(b.acceptees).toBe(1);
    expect(b.ajout).toBe(frappes[0].parts);
    // envoyée deux fois, elle ne compte qu'une fois
    const deux = compterFrappes(partie, frappes, b.fiche, LUNDI + 7_200_000);
    expect(deux.acceptees).toBe(0);
    expect(deux.fiche.parts).toBe(b.fiche.parts);
  });

  it('refuse les dégâts gonflés, les autres semaines et plus de frappes que de tentatives', () => {
    const { texte, frappes } = partieAvecFrappe();
    const partie = lirePartie(texte)!;
    const gonflee = [{ ...frappes[0], depart: { ...frappes[0].depart, deck: frappes[0].depart.deck.map((g: { v: number }) => ({ ...g, v: g.v * 5 })) } }];
    expect(compterFrappes(partie, gonflee, null, LUNDI + 3_600_000).acceptees).toBe(0);
    expect(compterFrappes(partie, frappes, null, LUNDI + 8 * 86_400_000).acceptees).toBe(0);
    const pleine = { parts: 9, frappes: frappesPermises(LUNDI + 3_600_000), meilleure: 2, vues: [] };
    expect(compterFrappes(partie, frappes, pleine, LUNDI + 3_600_000).acceptees).toBe(0);
    expect(lirePartie('pas du json')).toBeNull();
  });

  it('les PV de la ville suivent les directeurs de la semaine d’avant', () => {
    expect(pvVille(0)).toBe(40);
    expect(pvVille(30)).toBe(120);
  });
});
