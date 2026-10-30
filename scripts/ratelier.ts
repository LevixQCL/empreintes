// npm run ratelier [-- --parties 200 --strate 3]
// Le Râtelier du district (30 octobre 2026) : chaque carte commune, ajoutée au deck de départ (Stimulant + Pavois),
// et à son niveau d'ouverture. Cible (revue game designer) : une carte commune aide sans jamais valoir une carte de Porteur.

import { writeFileSync } from 'node:fs';
import { COLLECTION } from '../src/core/collection';
import { CARTES_COMMUNES, DEPART_PORTEURS, GESTES_SPECIAUX, carteId, forceCommune, moduleDef } from '../src/core/donnees';
import { communesRobot, jouerTour, tauxExploration, type Escouade } from '../src/core/robot';

const arg = (nom: string, defaut: number) => { const i = process.argv.indexOf('--' + nom); return i > 0 ? Number(process.argv[i + 1]) : defaut; };
const PARTIES = arg('parties', 200);
const STRATE = arg('strate', 3);
const FACTEUR = arg('facteur', 1.1);
const niv = (cle: string) => ({ id: cle, niveau: COLLECTION.niveauDepart[moduleDef(cle).rarete] });
const depart = (): Escouade => Object.fromEntries(Object.entries(DEPART_PORTEURS).map(([p, ids]) => [p, ids.map((id) => niv(carteId(id, 'fer')))]));
const pct = (x: number) => `${Math.round(x * 100)} %`;
const mesure = () => tauxExploration(depart(), STRATE, PARTIES, 1, jouerTour, FACTEUR).victoire;

communesRobot([]);
const sans = mesure();
communesRobot(GESTES_SPECIAUX);
const base = mesure();
const lignes = [`| Deck | Victoires | Écart |`, `|---|---|---|`, `| Sans carte commune | ${pct(sans)} | ${pct(sans - base)} |`, `| Stimulant + Pavois (départ) | ${pct(base)} | — |`];
for (const c of CARTES_COMMUNES.filter((x) => !GESTES_SPECIAUX.some((g) => g.id === x.geste.id))) {
  for (const n of [c.niveau, 10]) {
    communesRobot([...GESTES_SPECIAUX, { ...c.geste, v: forceCommune(c, n) }]);
    const t = mesure();
    lignes.push(`| + ${c.geste.nom} (bâtiment niv. ${n}, force ${forceCommune(c, n)}) | ${pct(t)} | ${t >= base ? '+' : ''}${pct(t - base)} |`);
    console.log(lignes[lignes.length - 1]);
  }
}
communesRobot();
const texte = `# Rapport du Râtelier (cartes communes du district)\n\nStrate −${STRATE}, ennemis ×${FACTEUR}, ${PARTIES} parties par ligne, deck de départ (fer) + cartes communes.\n\n${lignes.join('\n')}\n`;
writeFileSync('docs/ratelier-rapport.md', texte);
console.log(texte);
