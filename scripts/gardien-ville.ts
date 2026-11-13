// npx tsx scripts/gardien-ville.ts : combien de parts fait un joueur moyen contre le Gardien de la ville, selon sa Strate
// (12 parties, une frappe simulée par jour avec son vrai deck du moment). Cible : environ 1 part par frappe.
import { PROFILS, mediane, simulerParcours } from '../src/core/parcours';
import { frapperGardien, remonter, combatGardienFini, gardienOuvert } from '../src/core/jeu';
import { jouerTourMoyen } from '../src/core/robot';
import { escouadesDe, strateVaincue } from '../src/core/partie/etat';

const parStrate = new Map<number, number[]>();
for (let g = 0; g < 12; g++) {
  const vus = new Set<number>();
  simulerParcours(PROFILS.occasionnel!, 40, 1000 + g * 7919, { joueur: 'moyen', session: (j, jour) => {
    if (vus.has(jour) || !gardienOuvert(j) || j.expedition) return; vus.add(jour);
    const k = structuredClone(j);
    k.gardienVille = undefined;
    const esc = escouadesDe(k)[0]!;
    if (!frapperGardien(k, esc, k.dernierTick, 1000 + jour).ok) return;
    const s = k.expedition!.combat;
    for (let t = 0; t < 40 && !combatGardienFini(s); t++) jouerTourMoyen(s);
    const r = remonter(k);
    const st = strateVaincue(j);
    parStrate.set(st, [...(parStrate.get(st) ?? []), r.gardien!.parts]);
  } });
}
console.log('Strate vaincue · frappes · parts (médiane, min, max)');
for (const [s, l] of [...parStrate].sort((a, b) => a[0] - b[0])) console.log(`−${s}`, l.length, mediane(l), Math.min(...l), Math.max(...l));
