// npm run robot [-- --parties 300]
// Le robot joue des milliers d'expéditions et mesure ce que chaque carte change aux chances de victoire.
// Résultat affiché et écrit dans docs/robot-rapport.md.

import { writeFileSync } from 'node:fs';
import { COLLECTION, NOMS_RARETE } from '../src/core/collection';
import { NOMS_EFFET } from '../src/core/effets';
import { CARTES_DE_BASE, DEPART_PORTEURS, METAL_FORCE, METAL_FREQ, METAL_RENFORT, MODULES, carteId, moduleDef } from '../src/core/donnees';
import { jouerTour, jouerTourMoyen, mesurer, tauxExploration, tauxVictoire, type Escouade } from '../src/core/robot';
import { FORCE } from '../src/core/expedition';
import { PROFILS, mediane, simulerParcours } from '../src/core/parcours';
import type { Lignee, ModuleDef, Rarete } from '../src/core/types';

const arg = (nom: string, defaut: number) => {
  const i = process.argv.indexOf('--' + nom);
  return i > 0 ? Number(process.argv[i + 1]) : defaut;
};
const PARTIES = arg('parties', 300);
/** --metaux 1 : mesure aussi chaque Module dans les cinq métaux (plus long) */
const METAUX_ON = arg('metaux', 0) > 0;

/** Le Porteur nommé de chaque lignée, et sa carte de départ (la 6e de ses cartes) */
const DEPART: Record<Lignee, { porteur: string; carte: string }> = {
  tech: { porteur: 'ilka', carte: 'jambes-ressort' },
  bio: { porteur: 'doran', carte: 'glande-ambre' },
  reso: { porteur: 'vela', carte: 'eclat-chant' },
};
const estDepart = (id: string) => Object.values(DEPART).some((d) => d.carte === id);

const niv = (id: string, niveau: 'depart' | 10) => ({ id, niveau: niveau === 10 ? 10 : COLLECTION.niveauDepart[moduleDef(id).rarete] });

/** Le deck de départ (6 cartes en fer par Porteur nommé), avec une carte à la place de la carte de départ de sa lignée */
function escouade(niveau: 'depart' | 10, opts: { remplace?: ModuleDef } = {}): Escouade {
  const e: Escouade = {};
  for (const l of ['tech', 'bio', 'reso'] as Lignee[]) {
    const { porteur, carte } = DEPART[l];
    e[porteur] = DEPART_PORTEURS[porteur]!.map((id) => niv(id === carte && opts.remplace?.lignee === l ? opts.remplace.id : carteId(id, 'fer'), niveau));
  }
  return e;
}

const pct = (x: number) => `${Math.round(x * 100)} %`;
const pts = (x: number) => `${x >= 0 ? '+' : '−'}${Math.abs(Math.round(x * 100))}`;
const t0 = Date.now();
const progres = (t: string) => process.stdout.write(`\r${t.padEnd(60)}`);

// 1. La Strate de référence : celle où le deck de départ gagne environ une fois sur deux,
//    là où une carte de plus ou de moins se voit le mieux.
progres('Recherche de la Strate de référence…');
const courbe: { strate: number; taux: number }[] = [];
for (let st = 1; st <= 16; st++) {
  const taux = tauxVictoire(escouade('depart'), st, Math.max(80, PARTIES / 2));
  courbe.push({ strate: st, taux });
  if (taux < 0.25) break;
}
const ref = courbe.reduce((a, b) => (Math.abs(b.taux - 0.5) < Math.abs(a.taux - 0.5) ? b : a)).strate;
// La mesure des cartes se fait en exploration (une Strate entière, salle par salle), à la Strate −3, avec des ennemis
// renforcés jusqu'à ce que le deck de départ y gagne une fois sur deux : c'est là qu'une carte de plus ou de moins se voit le mieux.
progres('Réglage de la mesure des cartes…');
const ST_CARTES = 3;
const nCartes = Math.max(100, Math.round(PARTIES / 2));
const explorer = (e: Escouade, f: number) => ({ victoire: tauxExploration(e, ST_CARTES, nCartes, 1, jouerTour, f).victoire });
let fBas = 0.8, fHaut = 2.4;
for (let i = 0; i < 9; i++) { const m = (fBas + fHaut) / 2; if (explorer(escouade('depart'), m).victoire > 0.5) fBas = m; else fHaut = m; }
const F_CARTES = (fBas + fHaut) / 2;
const mesureCarte = (e: Escouade) => explorer(e, F_CARTES);

// 2. Ce que vaut chaque carte : elle prend la place de la carte de départ de sa lignée (dans son métal d'origine).
//    Les 15 cartes de base ne sont pas mesurées : elles sont déjà dans le deck. On mesure la part d'expéditions gagnées.
const valeur = (niveau: 'depart' | 10, m: ModuleDef, base: number) =>
  estDepart(m.id) ? 0 : mesureCarte(escouade(niveau, { remplace: moduleDef(carteId(m.id, m.rarete)) })).victoire - base;
const baseDep = mesureCarte(escouade('depart'));
const base10 = mesureCarte(escouade(10)).victoire;
const brut: { m: ModuleDef; dep: number; n10: number }[] = [];
const MESUREES = MODULES.filter((m) => !CARTES_DE_BASE.includes(m.id));
for (const [k, m] of MESUREES.entries()) {
  progres(`Carte ${k + 1}/${MESUREES.length} : ${m.nom}`);
  brut.push({ m, dep: valeur('depart', m, baseDep.victoire), n10: valeur(10, m, base10) });
}
// Une carte est signalée quand elle sort nettement du lot de sa rareté,
// ou quand elle fait mieux que la moyenne de la rareté au-dessus d'elle.
const ECART = 0.08;
const moyenne = (r: Rarete) => {
  const xs = brut.filter((b) => b.m.rarete === r).map((b) => b.dep);
  return xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : NaN;
};
const RANGS: Rarete[] = ['fer', 'cuivre', 'argent', 'or', 'nacre'];
const lignes = brut.map((b) => {
  const moy = moyenne(b.m.rarete);
  const dessus = moyenne(RANGS[RANGS.indexOf(b.m.rarete) + 1] ?? 'nacre');
  const dessous = moyenne(RANGS[RANGS.indexOf(b.m.rarete) - 1] ?? 'fer');
  let alerte = '';
  // une marge de 4 points évite de signaler le simple bruit de la simulation
  if (b.dep > moy + ECART || (!Number.isNaN(dessus) && b.dep > dessus + 0.04)) alerte = 'TROP FORTE';
  else if (b.dep < moy - ECART || (b.m.rarete !== 'fer' && b.dep < dessous - 0.04)) alerte = 'trop faible';
  return { ...b, alerte };
});

// 3 bis. L'exploration salle par salle : plus de combats, des PV qui ne remontent qu'aux campements
progres('Exploration…');
const nExplo = Math.max(60, Math.round(PARTIES / 2));
const explo = Array.from({ length: 12 }, (_, i) => i + 1).map((st) => ({
  st, robot: tauxExploration(escouade('depart'), st, nExplo, 1, jouerTour), moyen: tauxExploration(escouade('depart'), st, nExplo, 1, jouerTourMoyen),
}));

// 3 ter. Le parcours d'un joueur : une partie entière, district et économie compris, jouée par le joueur moyen
progres('Parcours…');
const JOURS_PARCOURS = 45;
const parcours = (['occasionnel', 'assidu'] as const).map((k) => ({
  k, runs: Array.from({ length: 12 }, (_, i) => simulerParcours(PROFILS[k], JOURS_PARCOURS, 1000 + i * 7919, { joueur: 'moyen' })),
}));

// 4. Les métaux : chaque carte (hors cartes de base et de départ), à la place de la carte de départ, dans chacun des cinq métaux
const RANGS_M: Rarete[] = ['fer', 'cuivre', 'argent', 'or', 'nacre'];
const metaux: { m: ModuleDef; v: Record<Rarete, number> }[] = [];
if (METAUX_ON) {
  const hors = MESUREES.filter((m) => !estDepart(m.id));
  for (const [k, m] of hors.entries()) {
    const v = {} as Record<Rarete, number>;
    for (const r of RANGS_M) {
      progres(`Métaux ${k + 1}/${hors.length} : ${m.nom} en ${NOMS_RARETE[r]}`);
      v[r] = mesureCarte(escouade('depart', { remplace: moduleDef(carteId(m.id, r)) })).victoire - baseDep.victoire;
    }
    metaux.push({ m, v });
  }
}
const duree = Math.round((Date.now() - t0) / 1000);
process.stdout.write('\r'.padEnd(62) + '\r');

// ---------- Rapport ----------
const effets = (m: ModuleDef) => (m.effet ? NOMS_EFFET[m.effet.type] : '—');
let r = `# Rapport du robot d'équilibrage\n\n`;
r += `${new Date().toISOString().slice(0, 10)} · ${PARTIES} expéditions par mesure · ${duree} s de calcul. `;
r += `Le robot joue bien (il essaie toutes les chaînes possibles à chaque tour) : un vrai joueur gagne moins souvent, mais les écarts entre cartes restent parlants.\n\n`;
r += `## Le deck de départ selon la profondeur\n\n| Strate | Victoire |\n|---|---|\n`;
r += courbe.map((c) => `| −${c.strate} | ${pct(c.taux)} |`).join('\n');
r += `\n\nMesure des cartes : une Strate −${ST_CARTES} entière en exploration, ennemis ×${F_CARTES.toFixed(2)} (le deck de départ y gagne ${pct(baseDep.victoire)} des descentes ; ancienne Strate de référence en mode linéaire : −${ref}).\n\n`;
r += `## Ce que vaut chaque carte\n\nChaque carte prend la place de la carte de départ de sa lignée (Jambes à ressort, Glande d'ambre ou Éclat qui chante), dans son métal d'origine : 0 = aussi utile que la carte de départ. `;
r += `Les chiffres sont des points de victoire sur cette descente (+10 = une expédition gagnée de plus sur dix), à la découverte de la carte, puis avec toutes les cartes au niveau 10.\n\n`;
r += `| Carte | Rareté | Effets | À la découverte | Au niveau 10 | Alerte |\n|---|---|---|---|---|---|\n`;
for (const l of lignes) r += `| ${l.m.nom} | ${NOMS_RARETE[l.m.rarete]} | ${effets(l.m)} | ${pts(l.dep)} | ${pts(l.n10)} | ${l.alerte} |\n`;
r += `\nMoyenne par rareté, à la découverte : ${RANGS.filter((x) => !Number.isNaN(moyenne(x))).map((x) => `${NOMS_RARETE[x]} ${pts(moyenne(x))}`).join(' · ')}. `;
r += `Une carte est signalée quand elle s'écarte de plus de ${Math.round(ECART * 100)} points de la moyenne de sa rareté, ou dépasse de plus de 4 points la moyenne de la rareté au-dessus.\n\n`;
r += `\n## Une Strate entière avec le deck de départ\n\nLa descente salle par salle jusqu'au gardien, avec les 20 cartes de départ, sans aucune progression. `;
r += `Le robot essaie toutes les chaînes ; le joueur moyen regarde seulement ce qui est affiché (force, suite, attaque annoncée). `;
r += `Force des ennemis : ${FORCE.table.map((f, i) => `−${i + 1} ×${f}`).join(', ')}, puis ×${FORCE.ensuite} par Strate.\n\n`;
r += `| Strate | Force | Robot | Joueur moyen | Combats gagnés (moyen) |\n|---|---|---|---|---|\n`;
r += explo.map((e) => `| −${e.st} | ×${(FORCE.table[e.st - 1] ?? FORCE.table[FORCE.table.length - 1]! * FORCE.ensuite ** (e.st - FORCE.table.length)).toFixed(2)} | ${pct(e.robot.victoire)} | ${pct(e.moyen.victoire)} | ${e.moyen.combats.toFixed(1)} |`).join('\n') + '\n';
r += `\n## Le parcours d'un joueur\n\nUne partie entière, jouée par le joueur moyen pendant ${JOURS_PARCOURS} jours sur 12 parties : il ouvre ses colis, lit les Chroniques, monte ses cartes, construit son deck, améliore le district, `;
r += `tente les Épreuves, envoie ses Porteurs libres en mission, et fait une fouille ciblée quand il bloque deux fois au front. Jour médian d'ouverture de chaque Strate, et expéditions qu'il a fallu depuis la précédente.\n\n`;
r += `| Strate | ${parcours.map((p) => PROFILS[p.k].nom).join(' | ')} |\n|---|${parcours.map(() => '---').join('|')}|\n`;
for (let st = 2; st <= 20; st++) {
  const cases = parcours.map((p) => {
    const jours = p.runs.map((x) => x.ouverture[st] ?? Infinity);
    const d = mediane(jours);
    return Number.isFinite(d) ? `jour ${d} (${mediane(p.runs.map((x) => x.expeditions[st] ?? Infinity))} exp.)` : '—';
  });
  if (cases.every((c) => c === '—')) break;
  r += `| −${st} | ${cases.join(' | ')} |\n`;
}
r += `\nVictoires au front : ${parcours.map((p) => { const t = p.runs.reduce((n, x) => n + x.front.tentatives, 0), v = p.runs.reduce((n, x) => n + x.front.victoires, 0); return `${PROFILS[p.k].nom.split(' ')[0]} ${pct(v / t)}`; }).join(' · ')}.\n`;
if (metaux.length) {
  const moyM = (r: Rarete) => metaux.reduce((a, x) => a + x.v[r], 0) / metaux.length;
  r += `\n## Une carte dans les cinq métaux\n\nChaque carte (hors cartes de base et de départ) à la place de la carte de départ, à la découverte, dans chaque métal. `;
  r += `Réglages actuels : force ${RANGS_M.map((x) => `${NOMS_RARETE[x]} ×${METAL_FORCE[x]}`).join(', ')} ; Fréquences ${RANGS_M.map((x) => `${NOMS_RARETE[x]} ${METAL_FREQ[x]}`).join(', ')} ; effet ${RANGS_M.map((x) => `${NOMS_RARETE[x]} ${METAL_RENFORT[x] ? `×${METAL_RENFORT[x]}` : 'aucun'}`).join(', ')}.\n\n`;
  r += `| Carte | Métal d'origine | ${RANGS_M.map((x) => NOMS_RARETE[x]).join(' | ')} |\n|---|---|${RANGS_M.map(() => '---').join('|')}|\n`;
  for (const x of metaux) r += `| ${x.m.nom} | ${NOMS_RARETE[x.m.rarete]} | ${RANGS_M.map((y) => pts(x.v[y])).join(' | ')} |\n`;
  r += `| **Moyenne** | | ${RANGS_M.map((y) => `**${pts(moyM(y))}**`).join(' | ')} |\n`;
}
writeFileSync(new URL('../docs/robot-rapport.md', import.meta.url), r);
console.log(r);
