// npx tsx scripts/fond-fleche.ts [--graines 12 --jours 120 --profil occasionnel|assidu --sommet 10]
// Le pack Ossyra, la Perle de nacre et la Flèche (12-13 novembre 2026). Bryan : justifier l'achat des Strates −11 à −15 par
// l'histoire et un meilleur butin, mais « le joueur gratuit doit pouvoir finir la Flèche » ; plus lent avec le pack, « mais ça ne
// doit pas être impossible ». Ce script ne change rien au jeu : il rejoue les mêmes parties deux fois, avec le Fond (pack acheté,
// arrêt à −15) et sans (le jeu gratuit s'arrête à −10), et compare la Flèche et les nacres.
// Le joueur simulé va au front en priorité : dans le Fond, une séance sur trois part à la Flèche (un vrai joueur alterne), et
// une fois le Fond fini il revient fouiller −10 au lieu de −15 ; sans Perle, il fond ses copies en or à la Forge.
import { PROFILS, mediane, simulerParcours } from '../src/core/parcours';
import { ASCENSION, forceQuai } from '../src/core/partie/fleche';
import { fondrePerle } from '../src/core/partie/perles';
import { FLECHE } from '../src/core/classements';
import { freinPromotion } from '../src/core/collection';
import { moduleDef } from '../src/core/donnees';
import type { Jeu } from '../src/core/partie/etat';

const arg = (nom: string, d: string) => { const i = process.argv.indexOf('--' + nom); return i > 0 ? process.argv[i + 1]! : d; };
const GRAINES = Number(arg('graines', '12')), JOURS = Number(arg('jours', '120'));
const PROFIL = PROFILS[arg('profil', 'occasionnel') as 'occasionnel' | 'assidu'];
if (process.argv.includes('--sommet')) (ASCENSION as { forceSommet: number }).forceSommet = Number(arg('sommet', '10'));
const REPERES = [20, 30, 45, 60, 90, 120, 150, 180].filter((d) => d <= JOURS);

interface Mesure { quai: Record<number, number>; nacre: Record<number, number>; sommet: number; jour15: number; perlesGagnees: number; pretes: number }

let seance = 0;
function partie(graine: number, pack: boolean): Mesure {
  const m: Mesure = { quai: {}, nacre: {}, sommet: Infinity, jour15: Infinity, perlesGagnees: 0, pretes: 0 };
  let avant = 0;
  simulerParcours(PROFIL, JOURS, graine, {
    joueur: 'moyen',
    oser: (_j: Jeu, strate: number) => !(strate >= 11 && (++seance) % 3 === 0),
    session: (j: Jeu, jour: number) => {
      // le jeu gratuit s'arrête à −10, le pack Ossyra à −15 : la galerie suivante ne se perce jamais
      const fin = pack ? 15 : 10;
      if (j.strate >= fin && j.frontVaincu) j.creuseDebut = Number.MAX_SAFE_INTEGER;
      if (j.strate > fin) { j.strate = fin; j.frontVaincu = true; }
      if (j.strate >= 15 && m.jour15 === Infinity) m.jour15 = jour;
      if (pack && j.strate >= 15 && j.frontVaincu) j.strate = 10;
      // les Perles gagnées (le stock monte) ; sans Perle et avec une carte prête, la fonte à la Forge
      if ((j.perles ?? 0) > avant) m.perlesGagnees += (j.perles ?? 0) - avant;
      if (!j.perles && Object.keys(j.collection).some((k) => moduleDef(k).rarete === 'or' && !freinPromotion({ ...j, perles: 1 }, k)) && fondrePerle(j).ok) m.perlesGagnees++;
      avant = j.perles ?? 0;
      const record = j.fleche?.record ?? 0;
      const n = Object.keys(j.collection).filter((k) => k.endsWith('@nacre')).length;
      for (const d of REPERES) if (jour <= d) { m.quai[d] = record; m.nacre[d] = n; }
      if (record >= FLECHE.quais && m.sommet === Infinity) m.sommet = jour;
    },
    fin: (j: Jeu) => { m.pretes = Object.keys(j.collection).filter((k) => moduleDef(k).rarete === 'or' && !freinPromotion({ ...j, perles: 1 }, k)).length; },
  });
  return m;
}

const res = { pack: [] as Mesure[], gratuit: [] as Mesure[] };
for (let i = 0; i < GRAINES; i++) {
  const g = 1000 + i * 7919;
  res.pack.push(partie(g, true));
  res.gratuit.push(partie(g, false));
  process.stderr.write('.');
}
const med = (xs: number[]) => { const v = mediane(xs); return v === Infinity || Number.isNaN(v) ? 'jamais' : String(Math.round(v)); };
const ligne = (titre: string, f: (m: Mesure) => number) => console.log(titre.padEnd(8), med(res.gratuit.map(f)).padEnd(10), med(res.pack.map(f)));
console.log(`\n${PROFIL.nom}, ${GRAINES} parties de ${JOURS} jours (médianes), sommet de la Flèche ${ASCENSION.forceSommet}\n`);
console.log('Strate −15 vaincue (pack) : jour', med(res.pack.map((m) => m.jour15)));
console.log('\nRecord à la Flèche (quai, sur 101)\njour     gratuit    avec le Fond');
for (const d of REPERES) ligne(String(d), (m) => m.quai[d] ?? 0);
console.log('\nCartes en nacre possédées');
for (const d of REPERES) ligne(String(d), (m) => m.nacre[d] ?? 0);
console.log('\nPerles gagnées :', med(res.gratuit.map((m) => m.perlesGagnees)), '/', med(res.pack.map((m) => m.perlesGagnees)),
  '· cartes en or prêtes qui attendent une Perle à la fin :', med(res.gratuit.map((m) => m.pretes)), '/', med(res.pack.map((m) => m.pretes)));
console.log('Sommet atteint : gratuit', `${res.gratuit.filter((m) => m.sommet < Infinity).length}/${GRAINES}`, '(jour', med(res.gratuit.map((m) => m.sommet)) + ')',
  '· avec le Fond', `${res.pack.filter((m) => m.sommet < Infinity).length}/${GRAINES}`, '(jour', med(res.pack.map((m) => m.sommet)) + ')');
console.log('Force des gardiens : quai 50', forceQuai(50).toFixed(1), '· quai 80', forceQuai(80).toFixed(1), '· sommet', forceQuai(101).toFixed(1));
