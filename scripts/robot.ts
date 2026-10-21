// npm run robot [-- --parties 300]
// Le robot joue des milliers d'expéditions et mesure ce que chaque carte change aux chances de victoire.
// Résultat affiché et écrit dans docs/robot-rapport.md.

import { writeFileSync } from 'node:fs';
import { COLLECTION, NOMS_RARETE } from '../src/core/collection';
import { NOMS_EFFET } from '../src/core/effets';
import { MODULES } from '../src/core/donnees';
import { mesurer, tauxVictoire, type Escouade } from '../src/core/robot';
import type { Lignee, ModuleDef, Rarete } from '../src/core/types';

const arg = (nom: string, defaut: number) => {
  const i = process.argv.indexOf('--' + nom);
  return i > 0 ? Number(process.argv[i + 1]) : defaut;
};
const PARTIES = arg('parties', 300);

/** Le deck de départ actuel : une carte en fer par Porteur nommé */
const DEPART: Record<Lignee, { porteur: string; carte: string }> = {
  tech: { porteur: 'ilka', carte: 'jambes-ressort' },
  bio: { porteur: 'doran', carte: 'glande-ambre' },
  reso: { porteur: 'vela', carte: 'eclat-chant' },
};
/** Le deck de départ du document Économie : deux cartes en fer par Porteur */
const DEPART_6 = { ilka: ['jambes-ressort', 'gant-arc'], doran: ['glande-ambre', 'crocs-fossiles'], vela: ['eclat-chant', 'encre-ancienne'] };

const niv = (id: string, niveau: 'depart' | 10) => ({ id, niveau: niveau === 10 ? 10 : COLLECTION.niveauDepart[MODULES.find((m) => m.id === id)!.rarete] });

/** Le deck de départ, avec une carte en plus (2e greffe) ou en moins */
function escouade(niveau: 'depart' | 10, opts: { ajout?: ModuleDef; retrait?: string } = {}): Escouade {
  const e: Escouade = {};
  for (const l of ['tech', 'bio', 'reso'] as Lignee[]) {
    const { porteur, carte } = DEPART[l];
    e[porteur] = carte === opts.retrait ? [] : [niv(carte, niveau)];
    if (opts.ajout?.lignee === l) e[porteur]!.push(niv(opts.ajout.id, niveau));
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

// 2. Ce que vaut chaque carte : on l'ajoute en 2e greffe sur le Porteur de sa lignée
//    (pour les 3 cartes de départ, on mesure ce qu'on perd en la retirant).
//    On mesure la part d'expéditions gagnées : c'est ce que le joueur ressent.
const valeur = (niveau: 'depart' | 10, m: ModuleDef, base: number) => {
  const depart = Object.values(DEPART).some((d) => d.carte === m.id);
  return depart
    ? base - mesurer(escouade(niveau, { retrait: m.id }), ref, PARTIES).victoire
    : mesurer(escouade(niveau, { ajout: m }), ref, PARTIES).victoire - base;
};
const baseDep = mesurer(escouade('depart'), ref, PARTIES);
const base10 = mesurer(escouade(10), ref, PARTIES).victoire;
const brut: { m: ModuleDef; dep: number; n10: number }[] = [];
for (const [k, m] of MODULES.entries()) {
  progres(`Carte ${k + 1}/${MODULES.length} : ${m.nom}`);
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

// 3. Le deck de départ : 3 cartes ou 6 cartes
progres('Comparaison des decks de départ…');
const six: Escouade = Object.fromEntries(Object.entries(DEPART_6).map(([p, cs]) => [p, cs.map((c) => niv(c, 'depart'))]));
const strates = [...new Set([2, 4, ref - 2, ref])].filter((s) => s >= 1).sort((a, b) => a - b);
const decks = strates.map((st) => ({ st, trois: tauxVictoire(escouade('depart'), st, PARTIES), six: tauxVictoire(six, st, PARTIES) }));
const duree = Math.round((Date.now() - t0) / 1000);
process.stdout.write('\r'.padEnd(62) + '\r');

// ---------- Rapport ----------
const effets = (m: ModuleDef) => [...new Set(m.gestes.flatMap((g) => (g.effet ? [NOMS_EFFET[g.effet.type]] : [])))].join(', ') || '—';
let r = `# Rapport du robot d'équilibrage\n\n`;
r += `${new Date().toISOString().slice(0, 10)} · ${PARTIES} expéditions par mesure · ${duree} s de calcul. `;
r += `Le robot joue bien (il essaie toutes les chaînes possibles à chaque tour) : un vrai joueur gagne moins souvent, mais les écarts entre cartes restent parlants.\n\n`;
r += `## Le deck de départ selon la profondeur\n\n| Strate | Victoire |\n|---|---|\n`;
r += courbe.map((c) => `| −${c.strate} | ${pct(c.taux)} |`).join('\n');
r += `\n\nStrate de référence pour les cartes : **−${ref}** (le deck de départ y gagne ${pct(baseDep.victoire)} des expéditions).\n\n`;
r += `## Ce que vaut chaque carte\n\nChaque carte est greffée en plus sur le Porteur de sa lignée (pour les 3 cartes de départ : ce qu'on perd en la retirant). `;
r += `Les chiffres sont des points de victoire à la Strate −${ref} (+10 = une expédition gagnée de plus sur dix), à la découverte de la carte, puis avec toutes les cartes au niveau 10.\n\n`;
r += `| Carte | Rareté | Effets | À la découverte | Au niveau 10 | Alerte |\n|---|---|---|---|---|---|\n`;
for (const l of lignes) r += `| ${l.m.nom} | ${NOMS_RARETE[l.m.rarete]} | ${effets(l.m)} | ${pts(l.dep)} | ${pts(l.n10)} | ${l.alerte} |\n`;
r += `\nMoyenne par rareté, à la découverte : ${RANGS.filter((x) => !Number.isNaN(moyenne(x))).map((x) => `${NOMS_RARETE[x]} ${pts(moyenne(x))}`).join(' · ')}. `;
r += `Une carte est signalée quand elle s'écarte de plus de ${Math.round(ECART * 100)} points de la moyenne de sa rareté, ou dépasse de plus de 4 points la moyenne de la rareté au-dessus.\n\n`;
r += `## Deck de départ : 3 cartes ou 6 cartes\n\n| Strate | 3 cartes (actuel) | 6 cartes (document Économie) |\n|---|---|---|\n`;
r += decks.map((d) => `| −${d.st} | ${pct(d.trois)} | ${pct(d.six)} |`).join('\n') + '\n';

writeFileSync(new URL('../docs/robot-rapport.md', import.meta.url), r);
console.log(r);
