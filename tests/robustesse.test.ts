// Le filet de sécurité côté tests (29 octobre 2026, après la partie de Luc bloquée sur « Reprendre ») :
// des parties simulées sur plusieurs semaines, comme un vrai joueur, puis on vérifie que tout ce qu'elles contiennent
// se relit sans erreur. Un oubli comme celui de l'empreinte (une carte du district notée comme une carte) échoue ici,
// avant d'être publié, au lieu de figer le jeu chez un joueur.
import { describe, expect, it } from 'vitest';
import * as J from '../src/core/jeu';
import { PROFILS, simulerParcours } from '../src/core/parcours';
import { estCarteConnue, moduleDef } from '../src/core/donnees';

const parties: J.Jeu[] = [];
for (const [profil, jours, graine] of [['assidu', 25, 1237], ['occasionnel', 14, 2024], ['assidu', 12, 77]] as const) {
  simulerParcours(PROFILS[profil], jours, graine, { joueur: 'moyen', fin: (j) => { parties.push(structuredClone(j)); } });
}

describe('Parties simulées : tout se relit', () => {
  it('les simulations ont tourné', () => expect(parties.length).toBe(3));

  it('chaque carte notée (collection, empreinte) est une vraie carte', () => {
    for (const j of parties) {
      for (const k of Object.keys(j.collection)) expect(estCarteConnue(k), `collection : ${k}`).toBe(true);
      for (const k of Object.keys(j.vecu ?? {})) expect(estCarteConnue(k), `empreinte : ${k}`).toBe(true);
    }
  });

  it('l’empreinte de chaque carte se lit sans erreur', () => {
    for (const j of parties) for (const [k, x] of Object.entries(j.vecu ?? {})) {
      expect(() => { J.epithetesDe(k, x); J.palierCarte(j, k); J.journalCarte(x); moduleDef(k); }, k).not.toThrow();
    }
  });

  it('la sauvegarde repasse par le chargement sans changer de forme', () => {
    for (const j of parties) {
      const copie = JSON.parse(JSON.stringify(j));
      expect(J.estJeuValide(copie)).toBe(true);
      expect(() => J.tick(copie, Date.now())).not.toThrow();
    }
  });
});
