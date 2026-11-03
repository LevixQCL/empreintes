// L'équilibre du duel (npm run duel) : le robot de duel contre lui-même, avec des escouades réalistes à chaque étape du jeu,
// par lignée, avec des écarts de progression, et l'effet de chaque effet de carte sur les victoires. Écrit docs/duel-rapport.md.
// DUELS=40 (duels par ligne), PARTIES=1,2 (parties à lancer) ; essais : SANS_SUITE=1, SUITE_MONO=0.5 (sans toucher au jeu).

import { writeFileSync } from 'node:fs';
import { MODULES_TIRABLES, PORTEURS, porteurDef } from '../src/core/donnees';
import { COLLECTION, NIVEAU_METAL, chargeNiveau, poidsCarte } from '../src/core/collection';
import { XP } from '../src/core/jeu';
import { appliquerChoix, choixRobot, creerDuel, resoudreTour, CHOIX_VIDE, type EscouadeDuel, type IssueDuel } from '../src/core/duel';
import { tireur } from '../src/core/rng';
import { REGLES } from '../src/core/regles';
import type { Lignee, Rarete } from '../src/core/types';

const METAUX: Rarete[] = ['fer', 'cuivre', 'argent', 'or', 'nacre'];
/** Les étapes du jeu : niveau des Porteurs, meilleur métal, niveaux gagnés par les cartes au-delà de leur départ */
export const ETAPES = {
  debut: { nom: 'Début (niv. 3, fer-cuivre)', niveau: 3, metal: 'cuivre' as Rarete, plus: 0 },
  milieu: { nom: 'Milieu (niv. 8, jusqu’à l’argent)', niveau: 8, metal: 'argent' as Rarete, plus: 2 },
  avance: { nom: 'Avancé (niv. 14, jusqu’à l’or)', niveau: 14, metal: 'or' as Rarete, plus: 4 },
  fin: { nom: 'Fin (niv. 20, jusqu’à la nacre)', niveau: 20, metal: 'nacre' as Rarete, plus: 6 },
};
type Etape = keyof typeof ETAPES;

const PAR_LIGNEE: Record<Lignee, string[]> = { tech: [], bio: [], reso: [] };
for (const p of PORTEURS) PAR_LIGNEE[p.lignee].push(p.id);

/** Une escouade tirée au hasard pour une étape : 6 cartes par Porteur de sa lignée, dans sa Charge, les meilleurs métaux d'abord */
function escouade(nom: string, lignees: Lignee[], etape: Etape, rng: { rng: number }): EscouadeDuel {
  const e = ETAPES[etape];
  const t = tireur(rng);
  const pris = new Set<string>();
  const porteurs = lignees.map((l) => {
    const id = t.melanger(PAR_LIGNEE[l].filter((x) => !pris.has(x)))[0]!;
    pris.add(id);
    const charge = chargeNiveau(e.niveau);
    const permis = METAUX.slice(0, METAUX.indexOf(e.metal) + 1).filter((m) => NIVEAU_METAL[m] <= e.niveau);
    const cartes: { id: string; niveau: number }[] = [];
    let poids = 0;
    const candidats = t.melanger(MODULES_TIRABLES.filter((m) => m.lignee === l && permis.includes(m.rarete)));
    // les métaux les plus hauts d'abord, comme un joueur qui équipe ses meilleures cartes
    candidats.sort((a, b) => METAUX.indexOf(b.rarete) - METAUX.indexOf(a.rarete));
    for (const m of candidats) {
      if (cartes.length >= 6) break;
      const cle = `${m.id}@${m.rarete}`;
      // garder de la Charge pour remplir les 6 places
      const reste = 6 - cartes.length - 1;
      if (poids + poidsCarte(cle) + reste * 2 > charge) continue;
      if (cartes.some((c) => c.id.split('@')[0] === m.id)) continue;
      poids += poidsCarte(cle);
      cartes.push({ id: cle, niveau: Math.min(COLLECTION.niveauMax, COLLECTION.niveauDepart[m.rarete] + e.plus) });
    }
    return { id, pv: Math.round(porteurDef(id).pvMax * (1 + XP.pvParNiveau * (e.niveau - 1))), cartes };
  });
  return { nom, porteurs };
}

function duel(a: EscouadeDuel, b: EscouadeDuel, graine: number): { issue: IssueDuel; tours: number } {
  const s = creerDuel(a, b, graine);
  while (s.issue === 'en-cours') {
    const x = choixRobot(s, 0), y = choixRobot(s, 1);
    if (!appliquerChoix(s, 0, x).ok) appliquerChoix(s, 0, CHOIX_VIDE);
    if (!appliquerChoix(s, 1, y).ok) appliquerChoix(s, 1, CHOIX_VIDE);
    resoudreTour(s);
  }
  return { issue: s.issue, tours: s.tour - 1 };
}

const MIXTE: Lignee[] = ['tech', 'bio', 'reso'];
if (process.env.SUITE_MONO) (REGLES as { suiteMono: number }).suiteMono = Number(process.env.SUITE_MONO);
if (process.env.SANS_SUITE) Object.assign(REGLES.multSuite, { 3: 1, 4: 1, 5: 1 });
const pct = (n: number, d: number) => `${Math.round((100 * n) / Math.max(1, d))} %`;
const N = Number(process.env.DUELS ?? 40);
const lignes: string[] = ['# Équilibre du duel (robot contre robot)', '', `Généré par \`npm run duel\` (${N} duels par ligne, côtés alternés). Voir docs/duel.md.`, ''];
const rng = { rng: 20261103 };
/** PARTIES=2,3 : ne lancer que certaines parties (réglage rapide) */
const PARTIES = (process.env.PARTIES ?? '1,2,3,4').split(',');

/** a contre b, N duels en alternant les côtés ; renvoie les victoires de a, les égalités, la durée */
function serie(fa: () => EscouadeDuel, fb: () => EscouadeDuel) {
  let gagneA = 0, nul = 0, tours = 0, maxT = 0;
  for (let k = 0; k < N; k++) {
    const a = fa(), b = fb();
    const inverse = k % 2 === 1;
    const r = inverse ? duel(b, a, rng.rng + k * 7919) : duel(a, b, rng.rng + k * 7919);
    if (r.issue === 'egalite') nul++;
    else if ((r.issue === 'gagne-0') !== inverse) gagneA++;
    tours += r.tours;
    maxT = Math.max(maxT, r.tours);
  }
  return { gagneA, nul, tours: tours / N, maxT };
}

// 1. La durée à chaque étape (escouades mixtes en miroir)
if (PARTIES.includes('1')) {
lignes.push('## 1. Durée à chaque étape (escouades mixtes, même étape)', '', '| Étape | Tours (moyenne) | Plus long | Égalités |', '|---|---|---|---|');
for (const k of Object.keys(ETAPES) as Etape[]) {
  const r = serie(() => escouade('A', MIXTE, k, rng), () => escouade('B', MIXTE, k, rng));
  lignes.push(`| ${ETAPES[k].nom} | ${r.tours.toFixed(1)} | ${r.maxT} | ${pct(r.nul, N)} |`);
  console.log('durée', k, r);
}

}
// 2. Les lignées : une escouade d'une seule lignée contre une escouade mixte (milieu de jeu)
if (PARTIES.includes('2')) {
lignes.push('', '## 2. Une seule lignée contre une escouade mixte (milieu de jeu)', '', '| Escouade | Victoires contre mixte | Tours |', '|---|---|---|');
for (const l of ['tech', 'bio', 'reso'] as Lignee[]) {
  const r = serie(() => escouade('A', [l, l, l], 'milieu', rng), () => escouade('B', MIXTE, 'milieu', rng));
  lignes.push(`| 3 ${l === 'tech' ? 'Augmentés' : l === 'bio' ? 'Génés' : 'Résonants'} | ${pct(r.gagneA, N - r.nul)} | ${r.tours.toFixed(1)} |`);
  console.log('lignée', l, r);
}
lignes.push('', 'Lignées seules entre elles (le triangle : Augmentés > Résonants > Génés > Augmentés) :', '', '| Escouade A | Escouade B | Victoires de A |', '|---|---|---|');
const NOM_L: Record<Lignee, string> = { tech: 'Augmentés', bio: 'Génés', reso: 'Résonants' };
for (const [a, b] of [['bio', 'tech'], ['reso', 'bio'], ['tech', 'reso']] as [Lignee, Lignee][]) {
  const r = serie(() => escouade('A', [a, a, a], 'milieu', rng), () => escouade('B', [b, b, b], 'milieu', rng));
  lignes.push(`| 3 ${NOM_L[a]} | 3 ${NOM_L[b]} | ${pct(r.gagneA, N - r.nul)} |`);
  console.log('croisé', a, 'contre', b, r);
}

}
// 3. Les écarts de progression
if (PARTIES.includes('3')) {
lignes.push('', '## 3. Écarts de progression (escouades mixtes)', '', '| Plus avancé | Moins avancé | Victoires du plus avancé | Tours |', '|---|---|---|---|');
const ordre = Object.keys(ETAPES) as Etape[];
for (let i = 1; i < ordre.length; i++) {
  const haut = ordre[i]!, bas = ordre[i - 1]!;
  const r = serie(() => escouade('A', MIXTE, haut, rng), () => escouade('B', MIXTE, bas, rng));
  lignes.push(`| ${ETAPES[haut].nom} | ${ETAPES[bas].nom} | ${pct(r.gagneA, N - r.nul)} | ${r.tours.toFixed(1)} |`);
  console.log('écart', haut, bas, r);
}

}
// 4. Les effets : victoires des escouades qui en ont au moins 2 cartes, en miroir de milieu et de fin de jeu
if (PARTIES.includes('4')) {
const parEffet = new Map<string, { avec: number; gagne: number }>();
let total = 0;
for (const k of ['milieu', 'avance', 'fin'] as Etape[]) {
  for (let n = 0; n < N * 2; n++) {
    const a = escouade('A', MIXTE, k, rng), b = escouade('B', MIXTE, k, rng);
    const r = duel(a, b, rng.rng + n);
    if (r.issue === 'egalite') continue;
    total++;
    for (const [e, camp] of [[a, 0], [b, 1]] as const) {
      const compte = new Map<string, number>();
      for (const p of e.porteurs) for (const c of p.cartes) {
        const m = MODULES_TIRABLES.find((x) => `${x.id}@${x.rarete}` === c.id);
        for (const ef of [m?.effet, m?.effet2]) if (ef) compte.set(ef.type, (compte.get(ef.type) ?? 0) + 1);
      }
      for (const [t, nb] of compte) {
        if (nb < 2) continue;
        const x = parEffet.get(t) ?? { avec: 0, gagne: 0 };
        x.avec++;
        if ((r.issue === 'gagne-0') === (camp === 0)) x.gagne++;
        parEffet.set(t, x);
      }
    }
  }
}
lignes.push('', '## 4. Les effets (escouades qui en portent 2 cartes ou plus, miroirs milieu à fin)', '',
  'Une escouade au hasard gagne 50 % ; au-delà de 60 % ou en deçà de 40 % (sur 20 duels au moins), l’effet est à surveiller.', '',
  '| Effet | Duels | Victoires |', '|---|---|---|');
for (const [t, x] of [...parEffet.entries()].sort((a, b) => b[1].gagne / b[1].avec - a[1].gagne / a[1].avec)) {
  const p = x.gagne / x.avec;
  lignes.push(`| ${t} | ${x.avec} | ${pct(x.gagne, x.avec)}${x.avec >= 20 && (p > 0.6 || p < 0.4) ? ' ⚠' : ''} |`);
}
console.log('effets', total, [...parEffet.entries()].map(([t, x]) => `${t} ${x.gagne}/${x.avec}`).join(', '));
}

writeFileSync('docs/duel-rapport.md', lignes.join('\n') + '\n');
console.log('docs/duel-rapport.md écrit');
