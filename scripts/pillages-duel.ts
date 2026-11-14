// npx tsx scripts/pillages-duel.ts [--duels 40]
// Le pillage d'un directeur en duel (14 novembre 2026) : l'attaquant (robot de duel équilibré) contre la vraie escouade du défenseur,
// jouée par le robot selon sa consigne. Pour chaque écart de force annoncé (forceGarnison) et chaque consigne : les victoires de
// l'attaquant. À force égale, il doit gagner environ une fois sur deux, et aucune consigne ne doit écraser les autres.
import { MODULES_TIRABLES, PORTEURS, porteurDef } from '../src/core/donnees';
import { COLLECTION, NIVEAU_METAL, chargeNiveau, poidsCarte } from '../src/core/collection';
import { XP, forceGarnison, chanceVictoire } from '../src/core/jeu';
import { appliquerChoix, choixRobot, creerDuel, resoudreTour, CHOIX_VIDE, type Consigne, type EscouadeDuel } from '../src/core/duel';
import { tireur } from '../src/core/rng';
import type { Lignee, Rarete } from '../src/core/types';

const nombre = (nom: string, defaut: number) => { const i = process.argv.indexOf('--' + nom); return i > 0 ? Number(process.argv[i + 1]) : defaut; };
const N = nombre('duels', 40);
const METAUX: Rarete[] = ['fer', 'cuivre', 'argent', 'or', 'nacre'];
const ETAPES = [{ niveau: 6, metal: 'cuivre' as Rarete, plus: 1 }, { niveau: 10, metal: 'argent' as Rarete, plus: 2 }, { niveau: 14, metal: 'or' as Rarete, plus: 3 }];
const PAR_LIGNEE: Record<Lignee, string[]> = { tech: [], bio: [], reso: [] };
for (const p of PORTEURS) PAR_LIGNEE[p.lignee].push(p.id);
const rng = { rng: 20261114 };

/** Une escouade d'une étape : un Porteur par lignée le plus souvent, parfois deux de la même (une garnison n'a pas de règle) */
function escouade(nom: string, e: typeof ETAPES[number]): EscouadeDuel {
  const t = tireur(rng);
  const lignees: Lignee[] = t.nombre() < 0.7 ? ['tech', 'bio', 'reso'] : [t.melanger(['tech', 'bio', 'reso'] as Lignee[])[0]!, t.melanger(['tech', 'bio', 'reso'] as Lignee[])[0]!, t.melanger(['tech', 'bio', 'reso'] as Lignee[])[0]!];
  const pris = new Set<string>();
  const porteurs = lignees.map((l) => {
    const id = t.melanger(PAR_LIGNEE[l].filter((x) => !pris.has(x)))[0] ?? t.melanger(PAR_LIGNEE[l])[0]!;
    pris.add(id);
    const charge = chargeNiveau(e.niveau);
    const permis = METAUX.slice(0, METAUX.indexOf(e.metal) + 1).filter((m) => NIVEAU_METAL[m] <= e.niveau);
    const cartes: { id: string; niveau: number }[] = [];
    let poids = 0;
    const candidats = t.melanger(MODULES_TIRABLES.filter((m) => m.lignee === l && permis.includes(m.rarete)));
    candidats.sort((a, b) => METAUX.indexOf(b.rarete) - METAUX.indexOf(a.rarete));
    for (const m of candidats) {
      if (cartes.length >= 6) break;
      const cle = `${m.id}@${m.rarete}`;
      if (poids + poidsCarte(cle) + (5 - cartes.length) * 2 > charge || cartes.some((c) => c.id.split('@')[0] === m.id)) continue;
      poids += poidsCarte(cle);
      cartes.push({ id: cle, niveau: Math.min(COLLECTION.niveauMax, COLLECTION.niveauDepart[m.rarete] + e.plus) });
    }
    return { id, pv: Math.round(porteurDef(id).pvMax * (1 + XP.pvParNiveau * (e.niveau - 1))), cartes };
  });
  return { nom, porteurs };
}

/** Le défenseur ramené à un écart de force voulu (la force suit la racine des PV) */
function aEcart(a: EscouadeDuel, b: EscouadeDuel, ecart: number): EscouadeDuel {
  const k = (ecart * forceGarnison(a) / forceGarnison(b)) ** 2;
  return { ...b, porteurs: b.porteurs.map((p) => ({ ...p, pv: Math.max(1, Math.round(p.pv * k)) })) };
}

function duel(a: EscouadeDuel, b: EscouadeDuel, consigne: Consigne | undefined, graine: number): { gagne: boolean; tours: number } {
  const s = creerDuel(a, b, graine);
  while (s.issue === 'en-cours') {
    const x = choixRobot(s, 0), y = choixRobot(s, 1, consigne);
    if (!appliquerChoix(s, 0, x).ok) appliquerChoix(s, 0, CHOIX_VIDE);
    if (!appliquerChoix(s, 1, y).ok) appliquerChoix(s, 1, CHOIX_VIDE);
    resoudreTour(s);
  }
  return { gagne: s.issue === 'gagne-0', tours: s.tour - 1 };
}

const ECARTS = [0.85, 0.95, 1, 1.05, 1.15];
const CONS: (Consigne | undefined)[] = [undefined, 'rempart', 'riposte', 'harcelement'];
console.log(`${N} duels par case, trois étapes de jeu ; victoires de l'attaquant (courbe affichée entre parenthèses)`);
console.log('consigne      ' + ECARTS.map((e) => `×${e}`.padEnd(13)).join(''));
for (const c of CONS) {
  const l: string[] = [];
  for (const e of ECARTS) {
    let v = 0, tours = 0, n = 0;
    for (let k = 0; k < N; k++) {
      const et = ETAPES[k % ETAPES.length]!;
      const a = escouade('A', et), b = aEcart(a, escouade('B', et), e);
      const r = duel(a, b, c, 7919 * k + 13);
      n++; if (r.gagne) v++; tours += r.tours;
    }
    l.push(`${Math.round((100 * v) / n)} % (${Math.round(100 * chanceVictoire(e))}) ${(tours / n).toFixed(0)}t`.padEnd(13));
  }
  console.log((c ?? 'équilibré').padEnd(14) + l.join(''));
}
