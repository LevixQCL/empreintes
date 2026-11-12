// npx tsx scripts/puissance.ts [--graines 16 --jours 45]
// La force de l'escouade décide-t-elle de la victoire au front ? (11 novembre 2026)
// Pour chaque Strate, les tentatives au front du joueur moyen sont rangées en trois tiers selon la force de l'escouade au départ
// (forceEscouade, la mesure des pillages : cartes × PV) : si le tiers le plus fort gagne nettement plus souvent, la force du deck
// est bien ce qui fait descendre, et on peut afficher une « force conseillée » par Strate.
import { PROFILS, mediane, simulerParcours } from '../src/core/parcours';

const nombre = (nom: string, defaut: number) => { const i = process.argv.indexOf('--' + nom); return i > 0 ? Number(process.argv[i + 1]) : defaut; };
const GRAINES = nombre('graines', 16), JOURS = nombre('jours', 45);
const t: Record<number, { f: number; v: boolean }[]> = {};
for (let i = 0; i < GRAINES; i++) simulerParcours(PROFILS.occasionnel, JOURS, 1000 + i * 7919, { joueur: 'moyen', tentative: (s, f, v) => { (t[s] ??= []).push({ f, v }); } });
const pc = (xs: { v: boolean }[]) => (xs.length ? `${Math.round((100 * xs.filter((x) => x.v).length) / xs.length)} %`.padEnd(6) : '—'.padEnd(6));
console.log(`Occasionnel, ${GRAINES} parties de ${JOURS} jours : victoires au front selon la force de l'escouade au départ\n`);
console.log('Strate  tentatives  force (du plus faible au plus fort)   tiers faible  moyen  fort    force médiane des victoires / des défaites');
for (let s = 2; s <= 10; s++) {
  const xs = (t[s] ?? []).sort((a, b) => a.f - b.f);
  if (xs.length < 6) continue;
  const k = Math.floor(xs.length / 3);
  const r = (x: number) => Math.round(x * 10) / 10;
  console.log(`−${s}`.padEnd(7), String(xs.length).padEnd(11), `${r(xs[0]!.f)} à ${r(xs[xs.length - 1]!.f)}`.padEnd(37), pc(xs.slice(0, k)).padEnd(13), pc(xs.slice(k, 2 * k)), pc(xs.slice(2 * k)).padEnd(7),
    `${r(mediane(xs.filter((x) => x.v).map((x) => x.f)))} / ${r(mediane(xs.filter((x) => !x.v).map((x) => x.f)))}`);
}
