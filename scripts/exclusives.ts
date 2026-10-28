// npm run exclusives [-- --parties 150]
// Les cartes exclusives (un seul métal, 28 octobre 2026) : chacune prend la place de la carte de départ de sa lignée,
// dans son métal, comme dans le rapport du robot. On la compare aux cartes ordinaires du même métal, mesurées dans la même
// passe (même Strate, mêmes ennemis) : une exclusive doit tenir son rang dans son métal, sans écraser les autres.

import { writeFileSync } from 'node:fs';
import { COLLECTION, NOMS_RARETE } from '../src/core/collection';
import { NOMS_EFFET } from '../src/core/effets';
import { CARTES_DE_BASE, DEPART_PORTEURS, MODULES, carteId, moduleDef } from '../src/core/donnees';
import { jouerTour, tauxExploration, type Escouade } from '../src/core/robot';
import type { Lignee, ModuleDef, Rarete } from '../src/core/types';

const arg = (nom: string, defaut: number) => {
  const i = process.argv.indexOf('--' + nom);
  return i > 0 ? Number(process.argv[i + 1]) : defaut;
};
const PARTIES = arg('parties', 150);
const ST = 3;
/** --facteur : force des ennemis (le robot règle la sienne pour que le deck de départ gagne une fois sur deux) */
const FACTEUR = arg('facteur', 0.88);
const DEPART: Record<Lignee, { porteur: string; carte: string }> = {
  tech: { porteur: 'ilka', carte: 'jambes-ressort' },
  bio: { porteur: 'doran', carte: 'glande-ambre' },
  reso: { porteur: 'vela', carte: 'eclat-chant' },
};
const niv = (id: string) => ({ id, niveau: COLLECTION.niveauDepart[moduleDef(id).rarete] });
function escouade(remplace?: ModuleDef): Escouade {
  const e: Escouade = {};
  for (const l of ['tech', 'bio', 'reso'] as Lignee[]) {
    const { porteur, carte } = DEPART[l];
    e[porteur] = DEPART_PORTEURS[porteur]!.map((id) => niv(id === carte && remplace?.lignee === l ? remplace.id : carteId(id, 'fer')));
  }
  return e;
}
const mesure = (e: Escouade) => tauxExploration(e, ST, PARTIES, 1, jouerTour, FACTEUR).victoire;
const pts = (x: number) => `${x >= 0 ? '+' : '−'}${Math.abs(Math.round(x * 100))}`;
const t0 = Date.now();
const base = mesure(escouade());
// --seules a,b : ne mesurer que ces cartes (réglage rapide)
const seules = process.argv.includes('--seules') ? process.argv[process.argv.indexOf('--seules') + 1]!.split(',') : null;
const metaux: Rarete[] = ['argent', 'or', 'nacre'];
const lignes: string[] = [];
const moyennes: string[] = [];
for (const metal of metaux) {
  const exclusives = MODULES.filter((m) => m.seul && m.rarete === metal && (!seules || seules.includes(m.id)));
  if (!exclusives.length) continue;
  // les cartes ordinaires de référence : celles de ce métal d'origine ; en nacre, l’Héritage (les seules nacres d'origine)
  // --refs a,b : les cartes de référence à mesurer (sinon toutes celles du métal, ou aucune avec --seules)
  const choix = process.argv.includes('--refs') ? process.argv[process.argv.indexOf('--refs') + 1]!.split(',') : null;
  const refs = choix ? MODULES.filter((m) => choix.includes(m.id) && (metal === 'nacre' ? m.legs : m.rarete === metal)) : seules ? [] : MODULES.filter((m) => !m.seul && !CARTES_DE_BASE.includes(m.id) && (metal === 'nacre' ? m.legs : m.rarete === metal && !m.legs));
  const val = (m: ModuleDef) => mesure(escouade(moduleDef(carteId(m.id, metal)))) - base;
  const vr: number[] = [];
  for (const [k, m] of refs.entries()) { process.stdout.write(`\r${NOMS_RARETE[metal]} réf. ${k + 1}/${refs.length}`.padEnd(40)); vr.push(val(m)); }
  const moy = vr.length ? vr.reduce((a, b) => a + b, 0) / vr.length : NaN;
  if (vr.length) moyennes.push(`${NOMS_RARETE[metal]} : moyenne ${pts(moy)} (de ${pts(Math.min(...vr))} à ${pts(Math.max(...vr))}, ${vr.length} cartes)`);
  for (const m of exclusives) {
    process.stdout.write(`\r${m.nom}`.padEnd(40));
    const v = val(m);
    const ecart = Number.isNaN(moy) ? '' : v > moy + 0.08 ? 'TROP FORTE' : v < moy - 0.08 ? 'trop faible' : 'dans le lot';
    lignes.push(`| ${m.nom} | ${NOMS_RARETE[metal]} | ${NOMS_EFFET[m.effet!.type]} | ${pts(v)} | ${ecart} |`);
  }
}
const texte = `# Rapport des exclusives

${new Date().toISOString().slice(0, 10)} · ${PARTIES} descentes par mesure · Strate −${ST} entière, ennemis ×${FACTEUR} · deck de départ ${Math.round(base * 100)} % · ${Math.round((Date.now() - t0) / 1000)} s de calcul.

Chaque carte prend la place de la carte de départ de sa lignée, à son niveau de départ. Points de victoire par rapport au deck de départ.

${moyennes.map((m) => `- ${m}`).join('\n')}

| Carte | Métal | Effet | Valeur | Dans son métal |
|---|---|---|---|---|
${lignes.join('\n')}
`;
writeFileSync(process.argv.includes('--sortie') ? process.argv[process.argv.indexOf('--sortie') + 1]! : 'docs/exclusives-rapport.md', texte);
process.stdout.write('\r' + texte);
