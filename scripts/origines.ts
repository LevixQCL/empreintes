// npm run origines [-- --parties 150]
// Les cartes d'origine des Récits (11 novembre 2026) : chacune prend la place de la carte de départ de sa lignée, comme dans
// `npm run exclusives`. On la compare à la carte gratuite dont elle part (en cuivre), mesurée dans la même passe : l'écart
// est ce que le Récit vend. Elle doit aider nettement au début, sans rendre le combat gagné d'avance.

import { DEPART_PORTEURS, MODULES, carteId } from '../src/core/donnees';
import { jouerTour, tauxExploration, type Escouade } from '../src/core/robot';
import type { Lignee } from '../src/core/types';

const arg = (nom: string, defaut: number) => {
  const i = process.argv.indexOf('--' + nom);
  return i > 0 ? Number(process.argv[i + 1]) : defaut;
};
const PARTIES = arg('parties', 150);
const ST = arg('strate', 3);
const FACTEUR = arg('facteur', 0.88);
const DEPART: Record<Lignee, { porteur: string; carte: string }> = {
  tech: { porteur: 'ilka', carte: 'jambes-ressort' },
  bio: { porteur: 'doran', carte: 'glande-ambre' },
  reso: { porteur: 'vela', carte: 'eclat-chant' },
};
const DEPUIS: Record<string, string> = {
  'cle-des-pompes': 'verin', 'toutes-les-courses': 'condensateur', 'quarante-jours': 'poumons-abysse',
  'berceuse-a-compter': 'branchies', 'ombre-nette': 'ombre-serpent', 'nuit-blanche': 'plume-givre',
};
/** l'escouade de départ, où `cles` (une par lignée au plus) remplacent la carte de départ de leur lignée */
function escouade(cles: string[] = []): Escouade {
  const e: Escouade = {};
  for (const l of ['tech', 'bio', 'reso'] as Lignee[]) {
    const { porteur, carte } = DEPART[l];
    const r = cles.find((k) => MODULES.find((m) => m.id === k.split('@')[0])!.lignee === l);
    e[porteur] = DEPART_PORTEURS[porteur]!.map((id) => ({ id: id === carte && r ? r : carteId(id, 'fer'), niveau: 1 }));
  }
  return e;
}
const mesure = (e: Escouade) => Math.round(100 * tauxExploration(e, ST, PARTIES, 1, jouerTour, FACTEUR).victoire);
const base = mesure(escouade());
console.log(`Strate −${ST}, ennemis ×${FACTEUR}, ${PARTIES} descentes par mesure. Deck de départ : ${base} %`);
console.log('| Carte d’origine | avec elle | avec la carte gratuite (cuivre) | ce que vend le Récit |');
console.log('|---|---|---|---|');
for (const [o, g] of Object.entries(DEPUIS)) {
  const a = mesure(escouade([carteId(o, 'argent')])), b = mesure(escouade([carteId(g, 'cuivre')]));
  console.log(`| ${MODULES.find((m) => m.id === o)!.nom} | ${a} % | ${b} % | ${a - b >= 0 ? '+' : ''}${a - b} |`);
}
for (const trio of [['toutes-les-courses', 'berceuse-a-compter', 'ombre-nette'], ['cle-des-pompes', 'quarante-jours', 'nuit-blanche']]) {
  const a = mesure(escouade(trio.map((o) => carteId(o, 'argent')))), b = mesure(escouade(trio.map((o) => carteId(DEPUIS[o]!, 'cuivre'))));
  console.log(`| Les trois : ${trio.map((o) => MODULES.find((m) => m.id === o)!.nom).join(', ')} | ${a} % | ${b} % | ${a - b >= 0 ? '+' : ''}${a - b} |`);
}
