// npm run refonte [-- --parties 150 --seules id1,id2 --sortie fichier.json]
// Lot 3 de la refonte des quasi-doublons (9 novembre 2026, docs/refonte-doublons.md) : chaque carte mesurée prend la place de la
// carte de départ de sa lignée, dans son métal d'origine (en cuivre pour une carte de fer : le fer n'a pas d'effet), Strate −3 entière.
// Points de victoire par rapport au deck de départ (+10 = une descente gagnée de plus sur dix), comme aux lots 1 et 2.

import { writeFileSync } from 'node:fs';
import { COLLECTION } from '../src/core/collection';
import { DEPART_PORTEURS, carteId, moduleDef } from '../src/core/donnees';
import { jouerTour, tauxExploration, type Escouade } from '../src/core/robot';
import type { Lignee, Rarete } from '../src/core/types';

const arg = (nom: string) => { const i = process.argv.indexOf('--' + nom); return i > 0 ? process.argv[i + 1] : undefined; };
const PARTIES = Number(arg('parties') ?? 150);
const ST = 3;
const FACTEUR = 0.88;
export const LOT3 = [
  // les voies
  'queue-massue', 'belier-os', 'retour-maree', 'oeil-relais', 'crocs-verre', 'chasse-aveugle', 'hallali',
  'poings-pistons', 'mitraille', 'cadence-folle', 'pas-chasse', 'seve-piliers', 'mue-verre', 'floraison',
  'chorale-ombres', 'grand-unisson', 'cloche-abysses', 'condensateur', 'fil-accord', 'nuee-chorale', 'oeil-lecteur',
  // hors voies
  'flair', 'yeux-nocturnes', 'ombre-serpent', 'ombre-ailee', 'oeil-brouilleur', 'plume-givre', 'glande-ambre', 'sang-ambre',
  'mue-totale', 'coeur-reprise', 'lamproie', 'coeur-meute', 'poumons-abysse', 'suture-vive', 'carapace-mere', 'souffle-wyrm',
  'gant-arc', 'lames-orbitales', 'grappin-cable', 'berceuse', 'sentence-muette', 'empreinte-vive',
];
const DEPART: Record<Lignee, { porteur: string; carte: string }> = {
  tech: { porteur: 'ilka', carte: 'jambes-ressort' },
  bio: { porteur: 'doran', carte: 'glande-ambre' },
  reso: { porteur: 'vela', carte: 'eclat-chant' },
};
const metalDe = (id: string): Rarete => (moduleDef(id).rarete === 'fer' ? 'cuivre' : moduleDef(id).rarete);
function escouade(remplace?: string): Escouade {
  const e: Escouade = {};
  const m = remplace ? moduleDef(remplace) : undefined;
  for (const l of ['tech', 'bio', 'reso'] as Lignee[]) {
    const { porteur, carte } = DEPART[l];
    e[porteur] = DEPART_PORTEURS[porteur]!.map((id) => {
      const cle = id === carte && m?.lignee === l ? carteId(remplace!, metalDe(remplace!)) : carteId(id, 'fer');
      return { id: cle, niveau: COLLECTION.niveauDepart[moduleDef(cle).rarete] };
    });
  }
  return e;
}
const mesure = (e: Escouade) => tauxExploration(e, ST, PARTIES, 1, jouerTour, FACTEUR).victoire;
const base = mesure(escouade());
const r: Record<string, number> = { _base: Math.round(base * 100) };
for (const id of arg('seules')?.split(',') ?? LOT3) {
  r[id] = Math.round((mesure(escouade(id)) - base) * 100);
  process.stdout.write(`${moduleDef(id).nom} (${metalDe(id)}) : ${r[id]! >= 0 ? '+' : ''}${r[id]}\n`);
}
writeFileSync(arg('sortie') ?? '/tmp/refonte.json', JSON.stringify(r, null, 1));
