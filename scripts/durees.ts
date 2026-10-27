// Durée des combats (en tours) le long du parcours d'un joueur moyen : normaux, groupes et gardiens, Strate par Strate.
// usage : npx tsx scripts/durees.ts [parties]   (cible du 27 octobre 2026 : normaux 6-9, groupes 9-13, gardiens 12-18)
import { PROFILS, simulerParcours, type ToursCombat } from '../src/core/parcours';
const n = Number(process.argv[2] ?? 6);
const t: ToursCombat = { normal: [], groupe: [], gardien: [], epreuve: [], strates: {} };
const ouv: number[] = []; let tent = 0, vict = 0;
for (let i = 0; i < n; i++) { const r = simulerParcours(PROFILS.occasionnel, 32, 1000 + i * 7919, { joueur: 'moyen', tours: t }); ouv.push(r.ouverture[10] ?? Infinity); tent += r.front.tentatives; vict += r.front.victoires; }
const med = (xs: number[]) => { const s = xs.slice().sort((a, b) => a - b); return s.length ? s[Math.floor(s.length / 2)]! : NaN; };
const moy = (xs: number[]) => xs.length ? (xs.reduce((a, b) => a + b, 0) / xs.length).toFixed(1) : '—';
console.log('sorte    médiane  moyenne  combats');
for (const k of ['normal', 'groupe', 'gardien'] as const) console.log(k.padEnd(8), String(med(t[k])).padStart(7), moy(t[k]).padStart(8), String(t[k].length).padStart(8));
console.log('\nStrate  normal  groupe  gardien  (médianes)');
for (let st = 1; st <= 12; st++) {
  const c = (k: string) => { const v = t.strates![k + st]; return v?.length ? String(med(v)) : '—'; };
  console.log(`−${st}`.padEnd(7), c('normal').padStart(6), c('groupe').padStart(7), c('gardien').padStart(8));
}
console.log('\nStrate −10 ouverte au jour (médiane) :', med(ouv), '· victoires au front :', Math.round(100 * vict / tent) + ' %');
