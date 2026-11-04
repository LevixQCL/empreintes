// npm run nouvelles [-- --parties 100 --metaux fer,cuivre]
// Les nouvelles cartes (4 novembre 2026, docs/nouvelles-cartes.md) : chacune prend la place de la carte de départ de sa lignée,
// dans son métal d'origine, comme dans le rapport des exclusives. On la compare aux cartes ordinaires de la même lignée et du
// même métal, mesurées dans la même passe : une nouvelle carte doit tenir son rang, sans écraser les autres.
// En nacre, les références sont les cartes de l’Héritage de la lignée (les seules autres nacres d'origine).

import { writeFileSync } from 'node:fs';
import { COLLECTION, NOMS_RARETE } from '../src/core/collection';
import { NOMS_EFFET } from '../src/core/effets';
import { CARTES_DE_BASE, DEPART_PORTEURS, MODULES, carteId, moduleDef } from '../src/core/donnees';
import { jouerTour, tauxExploration, type Escouade } from '../src/core/robot';
import type { Lignee, ModuleDef, Rarete } from '../src/core/types';

const arg = (nom: string) => { const i = process.argv.indexOf('--' + nom); return i > 0 ? process.argv[i + 1] : undefined; };
const PARTIES = Number(arg('parties') ?? 100);
const ST = 3;
const FACTEUR = Number(arg('facteur') ?? 0.88);
export const NOUVELLES = ['servo-bras', 'marteau-piston', 'verin', 'exo-chantier', 'foreuse', 'contre-chant', 'fil-accord', 'nuee-chorale',
  'riveteuse', 'suture-vive', 'lamproie', 'berceuse', 'couperet-hauts', 'racines-meres'];
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
const metaux = (arg('metaux')?.split(',') ?? ['fer', 'cuivre', 'argent', 'or', 'nacre']) as Rarete[];
const seules = arg('seules')?.split(',');
const lignes: string[] = [];
const cache = new Map<string, number>();
const val = (m: ModuleDef) => {
  const k = carteId(m.id, m.rarete);
  if (!cache.has(k)) cache.set(k, mesure(escouade(moduleDef(k))) - base);
  return cache.get(k)!;
};
for (const metal of metaux) {
  for (const l of ['tech', 'bio', 'reso'] as Lignee[]) {
    const ici = MODULES.filter((m) => NOUVELLES.includes(m.id) && m.rarete === metal && m.lignee === l && (!seules || seules.includes(m.id)));
    if (!ici.length) continue;
    const refs = MODULES.filter((m) => !NOUVELLES.includes(m.id) && m.lignee === l && !CARTES_DE_BASE.includes(m.id) && !m.lien
      && (metal === 'nacre' ? m.legs || (m.seul && m.rarete === 'nacre') : m.rarete === metal && !m.seul && !m.legs));
    const vr = refs.map((m, k) => { process.stdout.write(`\r${NOMS_RARETE[metal]} ${l} réf. ${k + 1}/${refs.length}`.padEnd(40)); return val(m); });
    const moy = vr.reduce((a, b) => a + b, 0) / vr.length;
    for (const m of ici) {
      process.stdout.write(`\r${m.nom}`.padEnd(40));
      const v = val(m);
      const ecart = v > Math.max(...vr) + 0.03 ? 'TROP FORTE' : v < Math.min(...vr) - 0.03 ? 'trop faible' : 'dans le lot';
      lignes.push(`| ${m.nom} | ${NOMS_RARETE[metal]} | ${m.lignee} | ${m.effet ? NOMS_EFFET[m.effet.type] : '—'} | ${pts(v)} | ${pts(moy)} (${pts(Math.min(...vr))} à ${pts(Math.max(...vr))}, ${vr.length}) | ${ecart} |`);
    }
  }
}
const texte = `# Rapport des nouvelles cartes

${new Date().toISOString().slice(0, 10)} · ${PARTIES} descentes par mesure · Strate −${ST} entière, ennemis ×${FACTEUR} · deck de départ ${Math.round(base * 100)} % · ${Math.round((Date.now() - t0) / 1000)} s de calcul.

Chaque carte prend la place de la carte de départ de sa lignée, à son niveau de départ. Points de victoire par rapport au deck de départ,
comparés aux cartes de la même lignée et du même métal (en nacre : l’Héritage et les exclusives de la lignée).

| Carte | Métal | Lignée | Effet | Valeur | Références (moyenne, plage, nombre) | Verdict |
|---|---|---|---|---|---|---|
${lignes.join('\n')}
`;
writeFileSync(arg('sortie') ?? 'docs/nouvelles-rapport.md', texte);
process.stdout.write('\r' + texte);
