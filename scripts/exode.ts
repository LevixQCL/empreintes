// npx tsx scripts/exode.ts <occasionnel|assidu> [jours] [parties] (PLAFOND=10 : le Fond fermé, comme le jeu gratuit)
// La durée de l'Exode : le jour où chaque chantier se finit, les convois, et ce qui fait attendre (cristaux, Éclats, sommet de la Flèche).
import { PROFILS, mediane, simulerParcours } from '../src/core/parcours';
import { exodeOuvert, lancerExode, avancementExode, ETAPES_EXODE, EXODE } from '../src/core/jeu';
const prof = (process.argv[2] ?? 'occasionnel') as keyof typeof PROFILS;
const JOURS = Number(process.argv[3] ?? 150), G = Number(process.argv[4] ?? 6);
const res: { ouvre: number[]; fin: (number|null)[]; chantiers: number[][]; convois: number[]; caisse: number[]; ecl: number[] } = { ouvre: [], fin: [], chantiers: [], convois: [], caisse: [], ecl: [] };
for (let g = 0; g < G; g++) {
  let ouvre = 0; const ch: number[] = []; let fin: number | null = null;
  const r = simulerParcours(PROFILS[prof]!, JOURS, 1000 + g * 7919, { joueur: 'moyen', plafond: process.env.PLAFOND ? Number(process.env.PLAFOND) : undefined, session: (j, jour) => {
    if (!exodeOuvert(j)) return;
    if (!ouvre) ouvre = jour;

    const e = j.exode?.etape ?? 0;
    while (ch.length < Math.floor(e / EXODE.etapes)) ch.push(jour);
    if (e >= ETAPES_EXODE && fin === null) fin = jour;
  }, fin: (j) => { res.convois.push(j.exode?.convois ?? 0); res.caisse.push(j.energie); res.ecl.push(j.eclats ?? 0); } });
  res.ouvre.push(ouvre || Infinity); res.fin.push(fin); res.chantiers.push(ch);
}
console.log(PROFILS[prof]!.nom, `${G} parties de ${JOURS} jours`);
console.log('ouverture (médiane)', mediane(res.ouvre));
for (let c = 0; c < 5; c++) console.log(`chantier ${c + 1} fini au jour`, res.chantiers.map((x) => x[c] ?? '—').join(' '));
console.log('convois au dernier jour', res.convois.join(' '), '· caisse', res.caisse.map(Math.round).join(' '), '· Éclats', res.ecl.join(' '));
// goulot : jours où l'étape suivante attend, faute de cristaux ou d'Éclats
{
  const att = { cristaux: 0, eclats: 0, sommet: 0, total: 0 }; const rec: number[] = [];
  for (let g = 0; g < 3; g++) {
    const vus = new Set<number>();
    simulerParcours(PROFILS[prof]!, JOURS, 1000 + g * 7919, { joueur: 'moyen', plafond: process.env.PLAFOND ? Number(process.env.PLAFOND) : undefined, session: (j, jour) => {
      if (!exodeOuvert(j) || vus.has(jour)) return; vus.add(jour);
      const a = avancementExode(j); if (a.enCours) return; att.total++;
      if (!a.fini && (j.exode?.etape ?? 0) >= 40 && (j.fleche?.record ?? 0) < 101) att.sommet++;
      else if (j.energie < a.cout.cristaux) att.cristaux++; else if ((j.eclats ?? 0) < a.cout.eclats) att.eclats++;
    }, fin: (j) => rec.push(j.fleche?.record ?? 0) });
  }
  console.log('jours d\'attente', JSON.stringify(att), '· record de la Flèche au dernier jour', rec.join(' '));
}
