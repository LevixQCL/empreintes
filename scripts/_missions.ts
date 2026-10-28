import { PROFILS, mediane, simulerParcours } from '../src/core/parcours';
const JOURS = 40, N = Number(process.argv[2] ?? 10);
const profils = { ...PROFILS, acharne: { nom: 'Acharné', sessions: [8, 10, 12, 14, 16, 18, 20, 22] } } as const;
for (const k of Object.keys(profils) as (keyof typeof profils)[]) {
  const stats: { compo: number; nb: number; creus: number }[] = [];
  const runs = Array.from({ length: N }, (_, i) => simulerParcours(profils[k], JOURS, 1000 + i * 7919, {
    joueur: 'moyen', duree: k === 'acharne' ? 'courte' : 'longue',
    fin: (j) => { const r = j.rapports ?? []; stats.push({ compo: r.reduce((n, x) => n + x.composants, 0), nb: r.length, creus: r.reduce((n, x) => n + x.creuseurs, 0) }); },
  } as never));
  const l: string[] = [];
  for (let st = 2; st <= 10; st++) { const d = mediane(runs.map((x) => x.ouverture[st] ?? Infinity)); l.push(`−${st}:${Number.isFinite(d) ? 'j' + d : '—'}`); }
  const m = (f: (s: typeof stats[0]) => number) => Math.round(mediane(stats.map(f)));
  console.log(k.padEnd(12), l.join(' '), `| missions ${m((s) => s.nb)} (${Math.round(m((s) => s.nb) / JOURS * 10) / 10}/j), compo ${m((s) => s.compo)}, creuseurs ${m((s) => s.creus)}`);
}
