// npm run front [-- --graines 16 --jours 50 --forces 1,0.93,0.9 --des 4 --creuseurs 9,10,11 --profil assidu --jusqua 10]
// Le front (audit du 10 novembre 2026) : le rythme était tenu par la défaite (une victoire sur cinq au front).
// Ce script rejoue les mêmes parties d'un joueur occasionnel moyen avec la force des ennemis multipliée à partir d'une Strate,
// (et, avec --creuseurs, les creuseurs demandés pour ouvrir −8, −9 et −10),
// et donne pour chaque essai : le taux de victoire au front, le jour d'ouverture de −10 et le plus long blocage sur une Strate.
// Il ne change rien au jeu : c'est un outil de réglage (les chiffres retenus vont ensuite dans FORCE, src/core/expedition.ts).
import { FORCE } from '../src/core/expedition';
import { CREUSEURS } from '../src/core/partie/etat';
import { PROFILS, mediane, simulerParcours } from '../src/core/parcours';

const texte = (nom: string, defaut: string) => { const i = process.argv.indexOf('--' + nom); return i > 0 ? process.argv[i + 1]! : defaut; };
const GRAINES = Number(texte('graines', '16')), JOURS = Number(texte('jours', '50')), DES = Number(texte('des', '4'));
const FORCES = texte('forces', '1,0.93,0.9').split(',').map(Number);
const JUSQUA = Number(texte('jusqua', '0')) || undefined;
const PROFIL = texte('profil', 'occasionnel') as keyof typeof PROFILS;
const origine = [...FORCE.table];
const requis = [...CREUSEURS.requis];
const creuseurs = texte('creuseurs', '').split(',').filter(Boolean).map(Number);
creuseurs.forEach((n, i) => { CREUSEURS.requis[8 + i] = n; });

console.log(`${PROFILS[PROFIL].nom}, ${GRAINES} parties de ${JOURS} jours, force changée à partir de −${DES}${creuseurs.length ? `, creuseurs pour −8, −9, −10 : ${creuseurs.join(', ')} (au lieu de ${requis.slice(8, 11).join(', ')})` : ''}\n`);
console.log('Force   front   −10 (médiane, de… à…)   plus long blocage avant −10 (médiane, pire)   expéditions passées au front (médiane)');
for (const k of FORCES) {
  FORCE.table.splice(0, origine.length, ...origine.map((f, i) => (i + 1 >= DES ? Math.round(f * k * 1000) / 1000 : f)));
  const runs = Array.from({ length: GRAINES }, (_, i) => simulerParcours(PROFILS[PROFIL], JOURS, 1000 + i * 7919, { joueur: 'moyen', jusqua: JUSQUA }));
  const t = runs.reduce((n, r) => n + r.front.tentatives, 0), v = runs.reduce((n, r) => n + r.front.victoires, 0);
  const j10 = runs.map((r) => r.ouverture[10] ?? Infinity);
  const fini = j10.filter(Number.isFinite);
  const blocage = runs.map((r) => Math.max(0, ...Object.entries(r.expeditions).filter(([s]) => Number(s) <= 10).map(([, n]) => n)));
  const parStrate = [4, 7, 8, 9].map((s) => `−${s}:${mediane(runs.map((r) => r.expeditions[s + 1] ?? 0))}`).join(' ');
  const f = (x: number) => (Number.isFinite(x) ? 'j' + x : '—');
  console.log(
    `×${k}`.padEnd(7), `${Math.round((100 * v) / Math.max(1, t))} %`.padEnd(7),
    `${f(mediane(j10))} (${fini.length ? f(Math.min(...fini)) : '—'} à ${f(Math.max(...j10))})`.padEnd(25),
    `${mediane(blocage)} (pire : ${Math.max(...blocage)})`.padEnd(35), parStrate,
  );
}
FORCE.table.splice(0, origine.length, ...origine);
CREUSEURS.requis.splice(0, requis.length, ...requis);
