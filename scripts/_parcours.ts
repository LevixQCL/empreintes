import { PROFILS, mediane, simulerParcours } from '../src/core/parcours';
const JOURS = 45;
for (const k of ['occasionnel', 'assidu'] as const) {
  const runs = Array.from({ length: 12 }, (_, i) => simulerParcours(PROFILS[k], JOURS, 1000 + i * 7919, { joueur: 'moyen' }));
  const l: string[] = [];
  for (let st = 2; st <= 13; st++) { const d = mediane(runs.map((x) => x.ouverture[st] ?? Infinity)); l.push(`−${st}:${Number.isFinite(d) ? 'j' + d : '—'}`); }
  const t = runs.reduce((n, x) => n + x.front.tentatives, 0), v = runs.reduce((n, x) => n + x.front.victoires, 0);
  console.log(k, l.join(' '), `front ${Math.round(100 * v / t)} %`);
}
