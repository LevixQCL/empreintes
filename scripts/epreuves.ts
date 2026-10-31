// npm run epreuves [-- --essais 40 --graines 3]
// Mesure la difficulté des Épreuves de la semaine : un joueur moyen suit son parcours (occasionnel),
// et à l'ouverture de chaque Strate on lui fait tenter chaque Épreuve (sur une copie de sa partie, au premier essai).

import { escouadePourDepart, EPREUVES, epreuvesDeLaSemaine, partirEpreuve, finDeCombat, continuer, remonter } from '../src/core/partie/descentes';
import { PROFILS, simulerParcours } from '../src/core/parcours';
import { jouerTour, jouerTourMoyen } from '../src/core/robot';
const JOUER = process.argv.includes('--robot') ? jouerTour : jouerTourMoyen;
import type { Jeu } from '../src/core/partie/etat';

const arg = (nom: string, defaut: number) => { const i = process.argv.indexOf('--' + nom); return i > 0 ? Number(process.argv[i + 1]) : defaut; };
const ESSAIS = arg('essais', 30);
const GRAINES = arg('graines', 3);
const SEMAINE = 7 * 24 * 3600 * 1000;

/** Un instant où l'Épreuve est au programme */
function semaineAvec(j: Jeu, id: string, depuis: number): number | null {
  for (let k = 0; k < 200; k++) { const t = depuis + k * SEMAINE; if (epreuvesDeLaSemaine(t, j).some((e) => e.id === id)) return t; }
  return null;
}
const FELEE_ON = process.argv.includes('--felee');

function tenter(j0: Jeu, escouade: string[], id: string, now: number, rng: number): boolean | null {
  const j = structuredClone(j0) as Jeu;
  j.expedition = null as never;
  for (const p of escouade) if (j.porteurs[p]) j.porteurs[p]!.usure = 0;
  if (!partirEpreuve(j, escouade, id, now, rng, FELEE_ON).ok) return null;
  let garde = 0;
  while (j.expedition && garde++ < 3000) {
    const x = j.expedition;
    if (x.combat.issue === 'en-cours') JOUER(x.combat);
    else if (!x.cloture) finDeCombat(j);
    else if (x.terminee) return remonter(j).victoire;
    else continuer(j);
  }
  return null;
}

const res: Record<string, Record<number, { v: number; n: number }>> = {};
for (const e of EPREUVES) res[e.id] = {};
for (let g = 1; g <= GRAINES; g++) {
  const vues = new Set<number>();
  simulerParcours(PROFILS.occasionnel, 40, g, {
    joueur: 'moyen',
    trace: (j) => {
      const escouade = escouadePourDepart(j);
      const st = j.strate - 1; // la dernière Strate vaincue
      if (st < 1 || vues.has(st) || j.expedition) return;
      vues.add(st);
      for (const e of EPREUVES) {
        const esc = escouade;
        const now = semaineAvec(j, e.id, Date.UTC(2026, 10, 2, 9));
        if (now === null) continue;
        for (let k = 0; k < ESSAIS; k++) {
          const r = tenter(j, esc, e.id, now!, (g * 7919 + k * 104729 + st) >>> 0);
          if (r === null) continue;
          const c = (res[e.id]![st] ??= { v: 0, n: 0 });
          c.n++; if (r) c.v++;
        }
      }
    },
  });
  process.stdout.write(`\rgraine ${g}/${GRAINES}`);
}
console.log('\n\nTaux de victoire au premier essai (joueur moyen), par Strate vaincue :\n');
const strates = [...new Set(Object.values(res).flatMap((r) => Object.keys(r).map(Number)))].sort((a, b) => a - b);
console.log('Épreuve'.padEnd(22) + strates.map((s) => `−${s}`.padStart(6)).join('') + '   moy.');
for (const e of EPREUVES) {
  const r = res[e.id]!;
  let V = 0, N = 0;
  const cells = strates.map((s) => { const c = r[s]; if (!c || !c.n) return '     ·'; V += c.v; N += c.n; return `${Math.round((100 * c.v) / c.n)}%`.padStart(6); });
  console.log(e.id.padEnd(22) + cells.join('') + `${N ? Math.round((100 * V) / N) : 0}%`.padStart(7));
}
