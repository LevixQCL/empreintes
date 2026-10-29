// npm run archetypes [-- --parties 120 --metal fer]
// Le deck « tout en suites » casse-t-il le jeu ? (27 octobre 2026)
// On compare, sur les mêmes descentes, quatre façons de composer son escouade :
// - mixte, cartes choisies pour leur force (le joueur normal, la référence) ;
// - mixte, cartes choisies pour enchaîner les suites ;
// - une seule lignée, cartes choisies pour leur force ;
// - une seule lignée, cartes choisies pour enchaîner les suites (l'« abuseur de suites »).
// Toutes les cartes sont dans le même métal et au niveau 10, avec la même Charge par Porteur et les mêmes PV,
// pour que seule la composition change. Résultat écrit dans docs/robot-archetypes.md.

import { writeFileSync } from 'node:fs';
import { cartesEnJeu, chargeNiveau, placesVides, poidsCarte, puissanceCarte } from '../src/core/collection';
import { GESTES_SPECIAUX, MODULES, MODULES_TIRABLES, NOMS_LIGNEE, carteId, moduleDef } from '../src/core/donnees';
import { accessibles, cloturerCombat, combatSuivant, entrerSalle, nouvelleExploration, salleCourante } from '../src/core/expedition';
import { REGLES, frequenceLibre } from '../src/core/regles';
import { jouerTour, jouerTourMoyen, type Escouade } from '../src/core/robot';
import type { CombatEtat, Lignee, Rarete } from '../src/core/types';

const arg = (nom: string, defaut: string) => {
  const i = process.argv.indexOf('--' + nom);
  return i > 0 ? process.argv[i + 1]! : defaut;
};
const PARTIES = Number(arg('parties', '120'));
const METAL = arg('metal', 'fer') as Rarete;
const NIVEAU_CARTES = Number(arg('niveau', '10'));
/** --echo 1.6 : essaie un autre bonus d'Écho sans toucher aux règles */
if (process.argv.includes('--echo')) (REGLES as { echo: number }).echo = Number(arg('echo', String(REGLES.echo)));
/** --mono 0.5 : essaie un bonus de suite réduit quand la suite vient d'une seule lignée */
if (process.argv.includes('--suite-mono')) (REGLES as { suiteMono: number }).suiteMono = Number(arg('suite-mono', '1'));
/** --reso-large : essai (29 octobre 2026) d'une échelle Résonante élargie à 5-9, les six cartes en 9 les moins fortes passent en 5 */
if (process.argv.includes('--reso-large')) {
  const neufs = MODULES.filter((m) => m.lignee === 'reso' && !m.exclusif && m.f[0] === 9).sort((a, b) => a.v - b.v).slice(0, 6);
  for (const m of neufs) m.f = [5, ...m.f.slice(1)];
  console.log('Passent en 5 :', neufs.map((m) => m.nom).join(', '));
}
/** --trio 1.15 : essaie un bonus pour l'escouade qui réunit les trois lignées */
if (process.argv.includes('--trio')) (REGLES as { trioLignees: number }).trioLignees = Number(arg('trio', '1'));
/** --empile-bouclier 0.75 --empile-soin 0.75 : essaie des boucliers et soins dégressifs dans une même chaîne */
if (process.argv.includes('--empile-bouclier')) REGLES.empilement.bouclier = Number(arg('empile-bouclier', '1'));
if (process.argv.includes('--empile-soin')) REGLES.empilement.soin = Number(arg('empile-soin', '1'));
/** --genes-atk 0.7 : essai (29 octobre 2026, rôles des lignées) des attaques Génés affaiblies, les Génés devenant le soutien */
if (process.argv.includes('--genes-atk')) {
  const k = Number(arg('genes-atk', '1'));
  for (const m of MODULES) if (m.lignee === 'bio' && m.type === 'atk') m.v = Math.round(m.v * k);
}
/** --sortie fichier.md : écrit le rapport ailleurs que dans docs/ (pour comparer plusieurs réglages) */
const SORTIE = arg('sortie', '');
/** Charge d'un Porteur de niveau 6 : assez pour 6 cartes moyennes, pas pour 6 grosses */
const CHARGE = chargeNiveau(6);
/** Mêmes PV pour tout le monde : les recrues et les Porteurs nommés n'ont pas les mêmes, ça fausserait la comparaison */
const PV = 38;
const STRATE = Number(arg('strate', '3'));
const DEFENSES_MIN = 2;

const LIGNEES: Lignee[] = ['tech', 'bio', 'reso'];
/** Les Porteurs d'une escouade d'une seule lignée, et ceux de l'escouade mixte */
const MONO: Record<Lignee, string[]> = { tech: ['ilka', 'coursier', 'sasha'], bio: ['doran', 'docker', 'nuit'], reso: ['vela', 'guetteur', 'aurel'] };
const MIXTE = ['ilka', 'doran', 'vela'];

// ---------- Les cartes ----------
const cle = (id: string) => carteId(id, METAL);
const pool = (l: Lignee) => MODULES_TIRABLES.filter((m) => m.lignee === l).map((m) => cle(m.id));
const lign = (c: string) => moduleDef(c).lignee;
const defense = (c: string) => moduleDef(c).type !== 'atk';
const force = (c: string) => puissanceCarte(c, NIVEAU_CARTES);

/**
 * Chance qu'une main de 5 cartes tirées du deck permette une suite de 3 (sur 3 places, Accord compris).
 * Estimation rapide et reproductible, qui sert seulement à choisir les cartes du deck « suites ».
 */
function chanceSuite(deck: string[], tirages = 400): number {
  if (deck.length < 5) return 0;
  let graine = 7;
  const alea = () => ((graine = (graine * 16807) % 2147483647) / 2147483647);
  let ok = 0;
  for (let k = 0; k < tirages; k++) {
    // 20 cartes en jeu : les places pas encore remplies comptent comme des places vides
    const tas = [...deck, ...Array<string>(Math.max(0, 20 - deck.length)).fill('')];
    const main: string[] = [];
    for (let i = 0; i < 5; i++) main.push(tas.splice(Math.floor(alea() * tas.length), 1)[0]!);
    const cartes = main.filter(Boolean).map(moduleDef);
    const accord = cartes.some((m) => frequenceLibre(m.effet));
    const fs = new Set(cartes.filter((m) => !frequenceLibre(m.effet) && !m.lourd).flatMap((m) => m.f));
    let meilleur = 0;
    for (let f = 1; f <= 9; f++) { let n = 0; while (fs.has(f + n)) n++; meilleur = Math.max(meilleur, n); }
    if (meilleur + (accord ? 1 : 0) >= 3) ok++;
  }
  return ok / tirages;
}

/** Chance qu'une main de 5 cartes permette un Écho (trois Fréquences identiques, Diapason compris) */
function chanceEcho(deck: string[], tirages = 400): number {
  if (deck.length < 5) return 0;
  let graine = 11;
  const alea = () => ((graine = (graine * 16807) % 2147483647) / 2147483647);
  let ok = 0;
  for (let k = 0; k < tirages; k++) {
    const tas = [...deck, ...Array<string>(Math.max(0, 20 - deck.length)).fill('')];
    const main: string[] = [];
    for (let i = 0; i < 5; i++) main.push(tas.splice(Math.floor(alea() * tas.length), 1)[0]!);
    const cartes = main.filter(Boolean).map(moduleDef);
    const joker = cartes.some((m) => m.effet?.type === 'diapason') ? 1 : 0;
    const compte = new Map<number, number>();
    for (const m of cartes) if (!frequenceLibre(m.effet) && !m.lourd) for (const f of m.f) compte.set(f, (compte.get(f) ?? 0) + 1);
    if ([...compte.values()].some((n) => n + joker >= 3)) ok++;
  }
  return ok / tirages;
}

type Choix = 'force' | 'suites' | 'echos' | 'hasard';
/**
 * Compose les cartes de chaque Porteur : 6 au plus, Charge respectée, 2 défenses au moins.
 * « hasard » (29 octobre 2026) : un joueur qui équipe ce qu'il a sans calculer, ni force ni Fréquence ;
 * la graine change le deck. C'est la référence « joueur normal », plus réaliste que le deck « force »
 * qui ne tombait sur une suite que dans 15 % des mains.
 */
function composer(porteurs: string[], lignees: Lignee[], choix: Choix, graine = 1): Escouade {
  let g = graine * 48271 + 13;
  const alea = () => ((g = (g * 16807) % 2147483647) / 2147483647);
  const pris: Record<string, string[]> = Object.fromEntries(porteurs.map((p) => [p, []]));
  const poids = (p: string) => pris[p]!.reduce((n, c) => n + poidsCarte(c), 0);
  const utilisees = new Set<string>();
  const peut = (p: string, c: string, i: number) => {
    if (utilisees.has(c) || lign(c) !== lignees[i] || pris[p]!.length >= 6 || poids(p) + poidsCarte(c) > CHARGE) return false;
    // les 6 places doivent rester remplissables avec les cartes les plus légères qui restent (une place vide se pioche sans se jouer)
    const reste = 5 - pris[p]!.length;
    const legeres = pool(lignees[i]!).filter((x) => x !== c && !utilisees.has(x)).map(poidsCarte).sort((a, b) => a - b).slice(0, reste);
    if (poids(p) + poidsCarte(c) + legeres.reduce((n, w) => n + w, 0) > CHARGE) return false;
    // garder de la place pour les défenses qui manquent
    const def = pris[p]!.filter(defense).length;
    return defense(c) || 6 - pris[p]!.length > Math.max(0, DEFENSES_MIN - def);
  };
  for (;;) {
    const deck = Object.values(pris).flat();
    const chance = choix === 'suites' ? chanceSuite : chanceEcho;
    const base = choix === 'force' || choix === 'hasard' ? 0 : chance(deck);
    let meilleur: { p: string; c: string; note: number } | null = null;
    porteurs.forEach((p, i) => {
      for (const c of pool(lignees[i]!)) {
        if (!peut(p, c, i)) continue;
        // « suites » : ce que la carte ajoute aux chances de suite, la force ne départage qu'à égalité
        // « échos » : pareil, avec les chances d'Écho (l'escouade qui empile une seule Fréquence)
        const note = choix === 'hasard' ? alea() : choix === 'force' ? force(c) : (chance([...deck, c]) - base) * 1000 + force(c) / 1000;
        if (!meilleur || note > meilleur.note) meilleur = { p, c, note };
      }
    });
    if (!meilleur) break;
    const m: { p: string; c: string } = meilleur;
    pris[m.p]!.push(m.c);
    utilisees.add(m.c);
  }
  return Object.fromEntries(porteurs.map((p) => [p, pris[p]!.map((id) => ({ id, niveau: NIVEAU_CARTES }))]));
}

// ---------- Une descente ----------
interface Compte { tours: number; resonances: number; echos: number }
/** Une Strate entière, comme le robot d'équilibrage (simulerExploration), avec les mêmes PV pour chacun */
function descente(e: Escouade, rng: number, jouer: (s: CombatEtat) => void, facteur: number, compte: Compte): boolean {
  const ids = Object.keys(e);
  const porteurs = ids.map((id) => ({ id, pv: PV, pvMax: PV, aTerre: false }));
  const deck = [...ids.flatMap((id) => [...cartesEnJeu(id, e[id]!), ...placesVides(id, e[id]!.length)]), ...GESTES_SPECIAUX];
  let x = nouvelleExploration({ porteurs, deck, strate: STRATE, rng, ...(facteur !== 1 ? { facteur } : {}) });
  let garde = 0;
  while (!x.terminee && garde++ < 3000) {
    if (x.phase === 'carte') {
      if (x.rencontre) { x = { ...x, rencontre: undefined }; continue; }
      const choix = accessibles(x);
      if (!choix.length) break;
      const sante = x.porteurs.reduce((n, p) => n + Math.max(0, p.pv), 0) / x.porteurs.reduce((n, p) => n + p.pvMax, 0);
      const prefere = (t: string) => (t === 'camp' ? (sante < 0.7 ? 0 : 3) : t === 'cache' || t === 'archive' ? 1 : t === 'combat' || t === 'gardien' || t === 'rencontre' ? 2 : 4);
      x = entrerSalle(x, choix.slice().sort((a, b) => prefere(a.type) - prefere(b.type))[0]!.id).x;
      continue;
    }
    if (x.combat.issue !== 'en-cours') {
      x = cloturerCombat(x);
      if (!x.terminee) x = combatSuivant(x);
      continue;
    }
    const s = x.combat;
    const tour = s.tour;
    jouer(s);
    const t = s.historique?.find((h) => h.tour === tour);
    compte.tours++;
    if ((t?.suite ?? 0) >= 3) compte.resonances++;
    if (t?.echo) compte.echos++;
  }
  return x.terminee && x.combat.issue === 'victoire' && salleCourante(x).type === 'gardien';
}

function mesurer(e: Escouade, jouer: (s: CombatEtat) => void, facteur: number, parties = PARTIES) {
  const compte: Compte = { tours: 0, resonances: 0, echos: 0 };
  let v = 0;
  for (let k = 0; k < parties; k++) if (descente(e, 1 + k * 7919, jouer, facteur, compte)) v++;
  return { victoire: v / parties, reso: compte.resonances / Math.max(1, compte.tours), echo: compte.echos / Math.max(1, compte.tours) };
}

// ---------- Les escouades ----------
const t0 = Date.now();
const progres = (t: string) => process.stdout.write(`\r${t.padEnd(70)}`);
/** Nombre de decks « au hasard » qui forment la référence (leur moyenne) */
const HASARDS = Number(arg('hasards', '8'));
const hasards = Array.from({ length: HASARDS }, (_, k) => composer(MIXTE, LIGNEES, 'hasard', k + 1));
const escouades: { nom: string; e: Escouade; ref?: boolean }[] = [
  { nom: 'Mixte · force', e: composer(MIXTE, LIGNEES, 'force') },
  { nom: 'Mixte · suites', e: composer(MIXTE, LIGNEES, 'suites') },
  { nom: 'Mixte · échos', e: composer(MIXTE, LIGNEES, 'echos') },
  ...(process.argv.includes('--mono') ? LIGNEES.flatMap((l) => [
    { nom: `${NOMS_LIGNEE[l].nom}s seuls · force`, e: composer(MONO[l], [l, l, l], 'force') },
    { nom: `${NOMS_LIGNEE[l].nom}s seuls · suites`, e: composer(MONO[l], [l, l, l], 'suites') },
    { nom: `${NOMS_LIGNEE[l].nom}s seuls · échos`, e: composer(MONO[l], [l, l, l], 'echos') },
  ]) : [{ nom: 'Résonants seuls · suites', e: composer(MONO.reso, ['reso', 'reso', 'reso'], 'suites') }]),
];
const deckDe = (e: Escouade) => Object.values(e).flat().map((c) => c.id);

// Force des ennemis réglée pour que les decks « au hasard » gagnent une descente sur deux en moyenne avec le robot
const PAR_HASARD = Math.max(20, Math.round(PARTIES / HASARDS));
const moyenneHasard = (jouer: (s: CombatEtat) => void, facteur: number, parties: number) => {
  const ms = hasards.map((e) => mesurer(e, jouer, facteur, parties));
  const moy = (f: (m: ReturnType<typeof mesurer>) => number) => ms.reduce((n, m) => n + f(m), 0) / ms.length;
  return { victoire: moy((m) => m.victoire), reso: moy((m) => m.reso), echo: moy((m) => m.echo), detail: ms.map((m) => m.victoire) };
};
let bas = 0.6, haut = 3;
for (let i = 0; i < 7; i++) {
  progres(`Réglage de la difficulté ${i + 1}/7…`);
  const m = (bas + haut) / 2;
  if (moyenneHasard(jouerTour, m, Math.max(8, Math.round(PAR_HASARD / 2))).victoire > 0.5) bas = m; else haut = m;
}
const FACTEUR = (bas + haut) / 2;

progres('Référence : decks au hasard (robot)');
const refRobot = moyenneHasard(jouerTour, FACTEUR, PAR_HASARD);
progres('Référence : decks au hasard (joueur moyen)');
const refMoyen = moyenneHasard(jouerTourMoyen, FACTEUR, PAR_HASARD);
const moyDeck = (f: (d: string[]) => number) => hasards.reduce((n, e) => n + f(deckDe(e)), 0) / hasards.length;
const reference = {
  nom: `Mixte · au hasard (joueur normal, moyenne de ${HASARDS} decks)`, e: hasards[0]!, ref: true,
  robot: refRobot, moyen: refMoyen,
  main: moyDeck((d) => chanceSuite(d, 2000)), mainEcho: moyDeck((d) => chanceEcho(d, 2000)),
  puissance: moyDeck((d) => d.reduce((n, c) => n + force(c), 0)),
};

const resultats = [reference, ...escouades.map((x, i) => {
  progres(`${i + 1}/${escouades.length} : ${x.nom} (robot)`);
  const robot = mesurer(x.e, jouerTour, FACTEUR);
  progres(`${i + 1}/${escouades.length} : ${x.nom} (joueur moyen)`);
  const moyen = mesurer(x.e, jouerTourMoyen, FACTEUR);
  const deck = deckDe(x.e);
  return { ...x, robot, moyen, main: chanceSuite(deck, 4000), mainEcho: chanceEcho(deck, 4000), puissance: deck.reduce((n, c) => n + force(c), 0) };
})];
process.stdout.write('\r'.padEnd(72) + '\r');

// ---------- Rapport ----------
const pct = (x: number) => `${Math.round(x * 100)} %`;
const ecart = (x: number, r: number) => (x === r ? '—' : `${x >= r ? '+' : '−'}${Math.abs(Math.round((x - r) * 100))}`);
const r0 = resultats[0]!;
let r = `# Les decks « tout en suites » ou « tout en échos » cassent-ils le jeu ?\n\n`;
r += `Référence refaite le 29 octobre 2026 : un joueur normal ne choisit pas ses cartes pour leur seule force, il équipe ce qu'il a. On prend donc la moyenne de plusieurs decks composés au hasard (Charge et défenses respectées).\n\n`;
r += `${new Date().toISOString().slice(0, 10)} · ${PARTIES} descentes par mesure · ${Math.round((Date.now() - t0) / 1000)} s de calcul.\n\n`;
r += `Une Strate −${STRATE} entière, salle par salle jusqu'au gardien, ennemis ×${FACTEUR.toFixed(2)} (réglés pour que les decks de référence, composés au hasard, gagnent en moyenne une descente sur deux avec le robot). `;
r += `Toutes les cartes en ${METAL}, au niveau ${NIVEAU_CARTES} ; chaque Porteur porte 6 cartes au plus, ${CHARGE} de Charge et ${DEFENSES_MIN} défenses au moins ; ${PV} PV chacun.\n\n`;
r += `- **Force** : les cartes les plus puissantes, sans regarder leur Fréquence.\n- **Suites** : les cartes qui donnent le plus de chances de suite, la force ne départage qu'à égalité.\n- **Échos** : les cartes qui donnent le plus de chances d'Écho (une Fréquence empilée), la force ne départage qu'à égalité.\n\n`;
r += `| Escouade | Suite possible en main | Écho possible | Puissance du deck | Victoires (robot) | Écart | Victoires (joueur moyen) | Écart | Tours avec Résonance (robot) | Échos |\n|---|---|---|---|---|---|---|---|---|---|\n`;
for (const x of resultats) {
  r += `| ${x.ref ? '**' + x.nom + '**' : x.nom} | ${pct(x.main)} | ${pct(x.mainEcho)} | ${Math.round(x.puissance)} | ${pct(x.robot.victoire)} | ${ecart(x.robot.victoire, r0.robot.victoire)} | ${pct(x.moyen.victoire)} | ${ecart(x.moyen.victoire, r0.moyen.victoire)} | ${pct(x.robot.reso)} | ${pct(x.robot.echo)} |\n`;
}
r += `\nVictoires des ${HASARDS} decks au hasard (robot) : ${refRobot.detail.map(pct).join(', ')}.\n`;
r += `\nÉcart : points de victoire par rapport à l'escouade de référence (+10 = une descente gagnée de plus sur dix). Le bruit de la mesure est d'environ ±${Math.round(100 / Math.sqrt(PARTIES))} points.\n\n## Les decks\n\n`;
for (const x of resultats) {
  r += `**${x.nom}**\n\n`;
  for (const [p, cs] of Object.entries(x.e)) {
    r += `- ${p} : ${cs.map((c) => { const m = moduleDef(c.id); return `${m.nom} (${frequenceLibre(m.effet) ? '∗' : m.f.join('/')}${m.lourd ? ', lourde' : ''})`; }).join(', ')}\n`;
  }
  r += '\n';
}
writeFileSync(SORTIE || new URL('../docs/robot-archetypes.md', import.meta.url), r);
console.log(r);
