// npx tsx scripts/force-max.ts : la force (échelle des pillages et de la Flèche) d'escouades repères, pour placer les gardes de la Flèche
import { DEPART_PORTEURS, carteId, porteurDef } from '../src/core/donnees';
import { forceGarnison } from '../src/core/partie/pillages';
import { XP } from '../src/core/partie/etat';
import type { Rarete } from '../src/core/types';

const pv = (id: string, niveau: number) => Math.round(porteurDef(id).pvMax * (1 + XP.pvParNiveau * (niveau - 1)));
const escouade = (metal: Rarete, niveauCarte: number, niveauPorteur: number) => forceGarnison({
  porteurs: ['ilka', 'doran', 'vela'].map((id) => ({ id, pv: pv(id, niveauPorteur), cartes: DEPART_PORTEURS[id]!.map((c) => ({ id: carteId(c, metal), niveau: niveauCarte })) })),
});
for (const [nom, m, nc, np] of [['départ (fer 1, Porteurs 1)', 'fer', 1, 1], ['cuivre 2, Porteurs 6', 'cuivre', 2, 6], ['argent 3, Porteurs 10', 'argent', 3, 10],
  ['or 4, Porteurs 15', 'or', 4, 15], ['or 5, Porteurs 20', 'or', 5, 20], ['nacre 5, Porteurs 20', 'nacre', 5, 20]] as [string, Rarete, number, number][])
  console.log(nom.padEnd(28), escouade(m, nc, np));
