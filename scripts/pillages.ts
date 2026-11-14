// npx tsx scripts/pillages.ts [--graines 4 --parties 8 --gardes 1.2]
// Le réglage des pillages (14 novembre 2026) : à quel point la force annoncée prédit l'issue ? Pour des parties d'un joueur
// occasionnel (une photo par Strate de −4 à −10), l'escouade reposée attaque des gardes de 0,85 à 1,2 fois sa force.
// À force égale, le joueur moyen doit gagner environ une fois sur deux ; on lit aussi les PV perdus et le nombre de tours.
import { PROFILS, simulerParcours } from '../src/core/parcours';
import { jouerTourMoyen } from '../src/core/robot';
import * as P from '../src/core/partie/pillages';
import { escouadePourDepart } from '../src/core/jeu';
import type { Jeu } from '../src/core/partie/etat';

const nombre = (nom: string, defaut: number) => { const i = process.argv.indexOf('--' + nom); return i > 0 ? Number(process.argv[i + 1]) : defaut; };
const GRAINES = nombre('graines', 4), PARTIES = nombre('parties', 8);
const K = nombre('gardes', P.PILLAGE.gardes);
(P.PILLAGE as { gardes: number }).gardes = K;
const photos: Jeu[] = [];
for (let g = 0; g < GRAINES; g++) {
  const vues = new Set<number>();
  simulerParcours(PROFILS.occasionnel, 34, 3000 + g * 7919, { joueur: 'moyen', trace: (j) => {
    if (P.pillagesPermis(j) && !vues.has(j.strate)) { vues.add(j.strate); photos.push(structuredClone(j)); }
  } });
}
const ECARTS = [0.85, 0.95, 1, 1.05, 1.2];
const t: Record<number, { v: number; n: number; pv: number; tours: number }> = {};
const debut = Date.UTC(2027, 0, 4);
for (const base of photos) for (const ecart of ECARTS) for (let k = 0; k < PARTIES; k++) {
  const j = structuredClone(base); j.expedition = null; j.pillage = undefined;
  for (const id in j.porteurs) j.porteurs[id]!.usure = 0;
  const esc = escouadePourDepart(j);
  const f = P.forceEscouade(j, esc);
  if (!P.piller(j, esc, { id: 'bot-x', nom: 'X', bot: true, porteurs: esc.slice(), force: f * ecart, strate: base.strate, coffre: 0 }, debut, 17 + k * 7919).ok) continue;
  const s = j.expedition!.combat;
  let n = 0; while (s.issue === 'en-cours' && n < 200) { jouerTourMoyen(s); n++; }
  const perdu = 1 - s.porteurs.reduce((a, p) => a + Math.max(0, p.pv), 0) / s.porteurs.reduce((a, p) => a + p.pvMax, 0);
  const x = (t[ecart] ??= { v: 0, n: 0, pv: 0, tours: 0 });
  x.n++; if (s.issue === 'victoire') x.v++; x.pv += perdu; x.tours += n;
}
console.log(`gardes ×${K} · ${photos.length} photos (Strates ${[...new Set(photos.map((p) => p.strate))].join(', ')}) · ${PARTIES} combats par écart`);
for (const e of ECARTS) { const x = t[e]!; console.log(`écart ${e.toFixed(2)} : ${Math.round((100 * x.v) / x.n)} % de victoires (courbe : ${Math.round(100 * P.chanceVictoire(e))} %), PV perdus ${Math.round((100 * x.pv) / x.n)} %, ${(x.tours / x.n).toFixed(1)} tours`); }
