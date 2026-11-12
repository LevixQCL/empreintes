// npx tsx scripts/origines-tranche.ts [--parties 100 --strate 8 --facteur 0.5 --deck argent --niveau 3]
// Audit du 12 novembre 2026 : « la carte d'origine garde un métal d'avance » (or de −1 à −6, nacre à partir de −7).
// On joue l'escouade de départ dont toutes les cartes sont dans le métal `deck` au niveau `niveau`, et on remplace la carte de
// départ de chaque lignée par : la carte gratuite dans le métal du dessus (ce qu'un joueur trouve en prestige), la carte
// d'origine en or, la carte d'origine en nacre. L'écart entre ces lignes est ce que le Récit vend à cette profondeur.
import { DEPART_PORTEURS, MODULES, carteId } from '../src/core/donnees';
import { jouerTour, tauxExploration, type Escouade } from '../src/core/robot';
import type { Lignee, Rarete } from '../src/core/types';

const txt = (nom: string, defaut: string) => { const i = process.argv.indexOf('--' + nom); return i > 0 ? process.argv[i + 1]! : defaut; };
const PARTIES = Number(txt('parties', '100')), ST = Number(txt('strate', '8')), FACTEUR = Number(txt('facteur', '0.5')), NIVEAU = Number(txt('niveau', '3'));
const DECK = txt('deck', 'argent') as Rarete;
const ORDRE: Rarete[] = ['fer', 'cuivre', 'argent', 'or', 'nacre'];
const DESSUS = ORDRE[Math.min(4, ORDRE.indexOf(DECK) + 1)]!;
const DEPART: Record<Lignee, { porteur: string; carte: string }> = {
  tech: { porteur: 'ilka', carte: 'jambes-ressort' }, bio: { porteur: 'doran', carte: 'glande-ambre' }, reso: { porteur: 'vela', carte: 'eclat-chant' },
};
const DEPUIS: Record<string, string> = {
  'cle-des-pompes': 'verin', 'toutes-les-courses': 'condensateur', 'quarante-jours': 'poumons-abysse',
  'berceuse-a-compter': 'branchies', 'ombre-nette': 'ombre-serpent', 'nuit-blanche': 'plume-givre',
};
function escouade(cles: string[] = []): Escouade {
  const e: Escouade = {};
  for (const l of ['tech', 'bio', 'reso'] as Lignee[]) {
    const { porteur, carte } = DEPART[l];
    const r = cles.find((k) => MODULES.find((m) => m.id === k.split('@')[0])!.lignee === l);
    e[porteur] = DEPART_PORTEURS[porteur]!.map((id) => ({ id: id === carte && r ? r : carteId(id, DECK), niveau: NIVEAU }));
  }
  return e;
}
const mesure = (e: Escouade) => Math.round(100 * tauxExploration(e, ST, PARTIES, 1, jouerTour, FACTEUR).victoire);
console.log(`Strate −${ST}, ennemis ×${FACTEUR}, deck en ${DECK} niveau ${NIVEAU}, ${PARTIES} descentes par mesure. Deck seul : ${mesure(escouade())} %`);
console.log(`| Trois cartes | gratuites en ${DESSUS} | d'origine en or | d'origine en nacre |`);
for (const trio of [['toutes-les-courses', 'berceuse-a-compter', 'ombre-nette'], ['cle-des-pompes', 'quarante-jours', 'nuit-blanche']]) {
  const g = mesure(escouade(trio.map((o) => carteId(DEPUIS[o]!, DESSUS))));
  const or = mesure(escouade(trio.map((o) => carteId(o, 'or')))), nacre = mesure(escouade(trio.map((o) => carteId(o, 'nacre'))));
  console.log(`| ${trio.map((o) => MODULES.find((m) => m.id === o)!.nom).join(', ')} | ${g} % | ${or} % | ${nacre} % |`);
}
