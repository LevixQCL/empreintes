// npm run metaux (voir docs/robot-metaux.md) — chaque carte tirable, dans un métal donné, à la place de la carte de départ de sa lignée.
// npx tsx scripts/metaux.ts <F> <metal> <part> <nbParts> <sortie.json>   (F = "calib" pour calibrer)
import { writeFileSync } from 'node:fs';
import { DEPART_PORTEURS, MODULES_TIRABLES, carteId, moduleDef } from '../src/core/donnees';
import { jouerTour, tauxExploration, type Escouade } from '../src/core/robot';
import type { Lignee, Rarete } from '../src/core/types';
const DEPART: Record<Lignee, { porteur: string; carte: string }> = {
  tech: { porteur: 'ilka', carte: 'jambes-ressort' }, bio: { porteur: 'doran', carte: 'glande-ambre' }, reso: { porteur: 'vela', carte: 'eclat-chant' },
};
const N = 150, ST = 3;
function escouade(remplace?: string): Escouade {
  const e: Escouade = {};
  const l0 = remplace ? moduleDef(remplace).lignee : null;
  for (const l of ['tech', 'bio', 'reso'] as Lignee[]) {
    const { porteur, carte } = DEPART[l];
    e[porteur] = DEPART_PORTEURS[porteur]!.map((id) => ({ id: id === carte && l0 === l ? remplace! : carteId(id, 'fer'), niveau: 1 }));
  }
  return e;
}
const mes = (e: Escouade, f: number) => tauxExploration(e, ST, N, 1, jouerTour, f).victoire;
const [fArg, metal, part, nb, sortie] = process.argv.slice(2) as [string, Rarete, string, string, string];
if (fArg === 'calib') {
  let b = 0.8, h = 2.4;
  for (let i = 0; i < 9; i++) { const m = (b + h) / 2; if (mes(escouade(), m) > 0.5) b = m; else h = m; }
  const F = (b + h) / 2;
  writeFileSync(sortie, JSON.stringify({ F, base: mes(escouade(), F) }));
} else {
  const F = Number(fArg);
  const cartes = MODULES_TIRABLES.filter((m) => !m.seul && !m.legs && !m.lien && !m.origine).filter((_, i) => i % Number(nb) === Number(part));
  const res: Record<string, number> = {};
  for (const m of cartes) { const t = Date.now(); res[m.id] = mes(escouade(carteId(m.id, metal)), F); writeFileSync(sortie, JSON.stringify(res)); console.log(m.id, res[m.id], Date.now() - t); }
}
