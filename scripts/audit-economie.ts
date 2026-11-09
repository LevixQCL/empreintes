// npm run audit [-- --graines 8 --jours 40]
// Le bilan de l'économie d'un joueur occasionnel moyen (audit du 7 novembre 2026) : le jour d'ouverture de chaque Strate,
// les sessions passées à attendre des creuseurs, le brut qui attend d'être taillé, les cristaux et Éclats en main,
// et le niveau du Noyau au fil des jours.
import { PROFILS, mediane, simulerParcours } from '../src/core/parcours';

const arg = (nom: string, defaut: number) => { const i = process.argv.indexOf('--' + nom); return i > 0 ? Number(process.argv[i + 1]) : defaut; };
const GRAINES = arg('graines', 8), JOURS = arg('jours', 40);
const JALONS = [10, 21, 30, 35, 40];

const ouv: Record<number, number[]> = {};
const attente: Record<number, number[]> = {};
const sessions: Record<number, number[]> = {};
const parJour: Record<number, { composants: number[]; eclats: number[]; noyau: number[]; strate: number[]; plein: number[] }> = {};
const pertes: number[] = [];
const attenteMax: number[] = [];
for (let g = 0; g < GRAINES; g++) {
  const att: Record<number, number> = {}, ses: Record<number, number> = {};
  const vus = new Set<number>();
  const energie = { produite: 0, attente: [] as number[] };
  const r = simulerParcours(PROFILS.occasionnel, JOURS, 1000 + g * 7919, {
    joueur: 'moyen', energie,
    session: (j, jour, enAttente) => {
      const cible = j.strate + 1;
      ses[cible] = (ses[cible] ?? 0) + 1;
      if (enAttente) att[cible] = (att[cible] ?? 0) + 1;
      if (JALONS.includes(jour) && !vus.has(jour)) {
        vus.add(jour);
        const p = (parJour[jour] ??= { composants: [], eclats: [], noyau: [], strate: [], plein: [] });
        p.composants.push(j.energie); p.eclats.push(j.eclats ?? 0); p.noyau.push(j.batiments.noyau); p.strate.push(j.strate);
      }
    },
  });
  for (let s = 2; s <= 10; s++) { (ouv[s] ??= []).push(r.ouverture[s] ?? Infinity); (attente[s] ??= []).push(att[s] ?? 0); (sessions[s] ??= []).push(ses[s] ?? 0); }
  pertes.push(mediane(energie.attente)); attenteMax.push(Math.max(...energie.attente));
}
const f = (x: number) => (Number.isFinite(x) ? String(x) : '—');
console.log(`Joueur occasionnel moyen, ${GRAINES} parties de ${JOURS} jours (médianes)\n`);
console.log('Strate  ouverte  sessions  à attendre');
for (let s = 2; s <= 10; s++) console.log(`−${s}`.padEnd(7), ('j' + f(mediane(ouv[s]!))).padStart(7), f(mediane(sessions[s]!)).padStart(9), f(mediane(attente[s]!)).padStart(11));
console.log('\nJour  Strate  Noyau   cristaux  Éclats');
for (const d of JALONS) { const p = parJour[d]; if (p) console.log(`j${d}`.padEnd(5), ('−' + mediane(p.strate)).padStart(6), String(mediane(p.noyau)).padStart(6), String(Math.round(mediane(p.composants))).padStart(11), String(mediane(p.eclats)).padStart(7)); }
console.log(`\nMinerai en attente au début d'une session : ${Math.round(mediane(pertes))} h de taille en médiane, ${Math.round(mediane(attenteMax))} h au pire (rien ne se perd)`);
