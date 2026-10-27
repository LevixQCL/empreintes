// npm run voies [-- --parties 200]
// Les voies (docs/familles-de-decks.md) : une carte de voie seule vaut peu, c'est la voie entière qui compte.
// Le robot compare, pour chaque lignée, les 6 cartes d'un Porteur nommé : son deck de départ (fer), le meilleur deck
// « classique » dans le même métal (les 6 cartes les plus puissantes hors voies), et le deck de la voie.
// Les deux autres Porteurs gardent leur deck de départ. Résultat affiché et écrit dans docs/voies-rapport.md.

import { writeFileSync } from 'node:fs';
import { COLLECTION, poidsCarte, puissanceCarte, chargeNiveau } from '../src/core/collection';
import { DEPART_PORTEURS, MODULES, carteId, moduleDef } from '../src/core/donnees';
import { jouerTour, tauxExploration, type Escouade } from '../src/core/robot';
import type { Lignee, Rarete } from '../src/core/types';

const arg = (nom: string, defaut: number) => {
  const i = process.argv.indexOf('--' + nom);
  return i > 0 ? Number(process.argv[i + 1]) : defaut;
};
const PARTIES = arg('parties', 200);
/** Strate et force des ennemis de la mesure : plus durs que dans le rapport du robot, pour que des decks en cuivre ou en or n'y gagnent pas tout */
const STRATE = arg('strate', 3);
const FACTEUR = arg('facteur', 1.1);

/** Les voies de l'étape 1 : le Porteur nommé qui la porte, et ses 6 cartes */
const VOIES: { nom: string; lignee: Lignee; porteur: string; cartes: string[] }[] = [
  { nom: 'Le Moteur', lignee: 'tech', porteur: 'ilka', cartes: ['bobine-recuperation', 'condensateur', 'decharge-arc', 'eclair-captif', 'noyau-instable', 'dorsale'] },
  { nom: 'La Carapace', lignee: 'bio', porteur: 'doran', cartes: ['coup-epaule', 'queue-massue', 'belier-os', 'retour-maree', 'carapace', 'cuir-recif'] },
  { nom: 'Le Chœur', lignee: 'reso', porteur: 'vela', cartes: ['diapason-cristal', 'voix-basse', 'chorale-ombres', 'cloche-abysses', 'grand-unisson', 'plume-givre'] },
];
/** --cartes a,b,c… : essayer un autre deck pour la voie mesurée (avec --seule) */
if (process.argv.includes('--cartes')) {
  const v = VOIES.find((x) => x.lignee === process.argv[process.argv.indexOf('--seule') + 1]);
  if (v) v.cartes = process.argv[process.argv.indexOf('--cartes') + 1]!.split(',');
}
const EFFETS_VOIES = ['riposte', 'decharge', 'diapason', 'unisson'];
const CARTES_VOIES = new Set(VOIES.flatMap((v) => v.cartes.filter((id) => EFFETS_VOIES.includes(moduleDef(id).effet?.type ?? ''))));

const niv = (cle: string) => ({ id: cle, niveau: COLLECTION.niveauDepart[moduleDef(cle).rarete] });
const depart = (): Escouade => Object.fromEntries(Object.entries(DEPART_PORTEURS).map(([p, ids]) => [p, ids.map((id) => niv(carteId(id, 'fer')))]));

/**
 * Le meilleur deck classique d'une lignée dans un métal, à Charge égale : les 6 cartes hors voies dont la puissance
 * totale est la plus haute sans dépasser la Charge du deck de la voie (on compare deux decks qu'un même Porteur peut porter).
 */
function classique(l: Lignee, metal: Rarete, charge: number): string[] {
  const n = COLLECTION.niveauDepart[metal];
  const pool = MODULES.filter((m) => m.lignee === l && !CARTES_VOIES.has(m.id) && !EFFETS_VOIES.includes(m.effet?.type ?? ''))
    .map((m) => carteId(m.id, metal)).map((k) => ({ k, p: puissanceCarte(k, n), w: poidsCarte(k) }));
  let meilleur: { p: number; ks: string[] } = { p: -1, ks: [] };
  const choisir = (i: number, pris: typeof pool, p: number, w: number) => {
    if (w > charge) return;
    if (pris.length === 6) { if (p > meilleur.p) meilleur = { p, ks: pris.map((x) => x.k) }; return; }
    if (i >= pool.length || pool.length - i < 6 - pris.length) return;
    choisir(i + 1, [...pris, pool[i]!], p + pool[i]!.p, w + pool[i]!.w);
    choisir(i + 1, pris, p, w);
  };
  choisir(0, [], 0, 0);
  return meilleur.ks;
}

const mesure = (e: Escouade) => tauxExploration(e, STRATE, PARTIES, 1, jouerTour, FACTEUR).victoire;
const avec = (porteur: string, cles: string[]): Escouade => ({ ...depart(), [porteur]: cles.map(niv) });
const pct = (x: number) => `${Math.round(x * 100)} %`;
const poids = (cles: string[]) => cles.reduce((n, k) => n + poidsCarte(k), 0);

const t0 = Date.now();
const base = mesure(depart());
const lignes: string[] = [];
const classiques: string[] = [];
/** --seule <lignée> et --metal <métal> : ne mesurer qu'une voie ou un métal (pour régler vite) */
const seule = process.argv[process.argv.indexOf('--seule') + 1];
const unMetal = process.argv[process.argv.indexOf('--metal') + 1];
for (const metal of (['cuivre', 'or'] as Rarete[]).filter((m) => !process.argv.includes('--metal') || m === unMetal)) {
  for (const v of VOIES.filter((x) => !process.argv.includes('--seule') || x.lignee === seule)) {
    process.stdout.write(`\r${v.nom} en ${metal}…`.padEnd(50));
    const vo = v.cartes.map((id) => carteId(id, metal));
    const cl = classique(v.lignee, metal, poids(vo));
    classiques.push(`${v.nom} en ${metal} → ${cl.map((k) => moduleDef(k).nom).join(', ')}`);
    const rc = mesure(avec(v.porteur, cl));
    const rv = mesure(avec(v.porteur, vo));
    lignes.push(`| ${v.nom} | ${metal} | ${pct(rc)} (Charge ${poids(cl)}) | ${pct(rv)} (Charge ${poids(vo)}) | ${rv >= rc ? '+' : '−'}${Math.abs(Math.round((rv - rc) * 100))} |`);
  }
}
const texte = `# Rapport des voies

${new Date().toISOString().slice(0, 10)} · ${PARTIES} descentes par mesure · Strate −${STRATE} entière, ennemis ×${FACTEUR} · ${Math.round((Date.now() - t0) / 1000)} s de calcul.

Le robot remplace les 6 cartes d'un Porteur nommé (Ilka, Doran ou Véla) ; les deux autres gardent leur deck de départ,
qui gagne **${pct(base)}** des descentes. « Classique » : les 6 cartes les plus puissantes de la lignée dans ce métal, hors voies, **à Charge égale** avec la voie.
La Charge (entre parenthèses) est la somme des poids des 6 cartes (un Porteur de niveau 1 en porte ${chargeNiveau(1)}, de niveau 10 ${chargeNiveau(10)}).
Le robot essaie toutes les chaînes : il tire mieux parti des voies qu'un joueur moyen.

| Voie | Métal | Deck classique | Deck de la voie | Écart (points) |
|---|---|---|---|---|
${lignes.join('\n')}

Les decks classiques comparés :
${classiques.map((t) => `- ${t}`).join('\n')}
`;
writeFileSync('docs/voies-rapport.md', texte);
process.stdout.write('\r' + texte);
