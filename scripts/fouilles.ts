// npm run fouilles [-- --parties 60]
// Ce que rapporte chaque sortie, par minute de jeu (1er novembre 2026, Bryan : « les récompenses de fouiller sont trop grandes »).
// Une partie moyenne est jouée jusqu'à la Strate visée, puis on compare, depuis le même état : Explorer la Strate du dessus,
// Fouiller (chaque cible, chaque difficulté), et une mission courte en mer (2 h, sans jouer).
// Le temps : ~8 s par tour de combat, ~6 s par salle traversée sans combat (choix, cache, rencontre).
import { simulerParcours, PROFILS, jouerExpedition } from '../src/core/parcours';
import { jouerTourMoyen } from '../src/core/robot';
import { fouiller, partir, composantsMission, MISSIONS, DIFFICULTES_FOUILLE, type DifficulteFouille } from '../src/core/partie/descentes';
import type { Jeu } from '../src/core/partie/etat';
import type { CibleFouille } from '../src/core/expedition';

const arg = (nom: string, d: number) => { const i = process.argv.indexOf('--' + nom); return i > 0 ? Number(process.argv[i + 1]) : d; };
const PARTIES = arg('parties', 60);
const SEC_TOUR = 8, SEC_SALLE = 6;
/** valeur d'une carte et d'un Éclat en composants, pour additionner les butins (prix du Comptoir à peu près) */
const VAL = { carte: 40, choix: 30, eclat: 25 };

type Mesure = { compo: number; cartes: number; choix: number; eclats: number; xp: number; sec: number; victoire: number };
const vide = (): Mesure => ({ compo: 0, cartes: 0, choix: 0, eclats: 0, xp: 0, sec: 0, victoire: 0 });

function etats(strate: number): { j: Jeu; escouade: string[] }[] {
  const r: { j: Jeu; escouade: string[] }[] = [];
  for (let i = 0; r.length < 6 && i < 20; i++) {
    let esc: string[] = [];
    simulerParcours(PROFILS.occasionnel, 60, 4000 + i * 7919, { jusqua: strate + 1, trace: (_j, _d, e) => { if (e.length) esc = e; }, fin: (j) => { if (esc.length === 3) r.push({ j: structuredClone(j), escouade: esc }); } });
  }
  return r;
}

function mesurer(base: { j: Jeu; escouade: string[] }[], salles: number, depart: (j: Jeu, esc: string[], g: number) => boolean): Mesure {
  const m = vide();
  for (let k = 0; k < PARTIES; k++) {
    const { j: j0, escouade } = base[k % base.length]!;
    const j = structuredClone(j0);
    for (const id of escouade) { const p = j.porteurs[id]!; p.usure = 0; p.pv = undefined as never; }
    j.expedition = null;
    (j as { rng: number }).rng = (j.rng ^ Math.imul(k + 1, 0x9e3779b1)) >>> 0;
    const avant = { compo: j.composants, eclats: j.eclats, choix: j.choix.length };
    const bilan: { retour?: any } = {};
    let tours = 0;
    const jouer = (s: any) => { tours++; jouerTourMoyen(s); };
    const g = (k * 2654435761) >>> 0;
    const v = jouerExpedition(j, () => { const ok = depart(j, escouade, g); return ok; }, jouer, undefined, bilan);
    const r = bilan.retour;
    m.compo += j.composants - avant.compo;
    m.eclats += j.eclats - avant.eclats;
    for (const c of j.choix.slice(avant.choix)) m.choix += (c.options.length - 1) / 2; // un choix de 3 compte pour 1, de 2 pour ½
    m.cartes += (r?.cartes?.length ?? 0) + j.choix.slice(avant.choix).length;
    m.xp += r?.xp?.[0]?.xp ?? 0;
    m.victoire += v ? 1 : 0;
    m.sec += tours * SEC_TOUR + salles * SEC_SALLE;
  }
  for (const c of Object.keys(m) as (keyof Mesure)[]) m[c] /= PARTIES;
  return m;
}

const valeur = (m: Mesure) => m.compo + m.cartes * VAL.carte + m.choix * VAL.choix + m.eclats * VAL.eclat;
const ligne = (nom: string, m: Mesure) =>
  `| ${nom} | ${(m.sec / 60).toFixed(1)} | ${Math.round(m.victoire * 100)} % | ${Math.round(m.compo)} | ${m.cartes.toFixed(2)} | ${m.choix.toFixed(2)} | ${m.eclats.toFixed(2)} | ${Math.round(m.xp)} | ${Math.round(valeur(m))} | ${Math.round(valeur(m) / Math.max(0.5, m.sec / 60))} |`;

for (const strate of [2, 5]) {
  const base = etats(strate);
  if (!base.length) { console.log(`Strate −${strate} : aucun état`); continue; }
  console.log(`\n## Strate −${strate} (${base.length} états, ${PARTIES} sorties par ligne)\n`);
  console.log('| Sortie | min | réussite | compo | cartes | choix (3 = 1) | Éclats | XP | valeur | valeur / min |');
  console.log('|---|---|---|---|---|---|---|---|---|---|');
  console.log(ligne('Explorer', mesurer(base, 8, (j, e, g) => partir(j, e, strate, g).ok)));
  for (const d of Object.keys(DIFFICULTES_FOUILLE) as DifficulteFouille[]) for (const c of ['tech', 'composants', 'eclats'] as CibleFouille[])
    console.log(ligne(`Fouiller ${c} (${d})`, mesurer(base, DIFFICULTES_FOUILLE[d].rangs - 1, (j, e, g) => fouiller(j, e, strate, c, g, d).ok)));
  const j = base[0]!.j, p = base[0]!.escouade[0]!;
  const lieu = 'x';
  try { console.log(`| Mission courte 2 h (cargaison, sans jouer) | 0.2 | 100 % | ${composantsMission(j, p, lieu, 'courte', 'cargaison', strate)} | 0 | 0 | 0 | — | ${composantsMission(j, p, lieu, 'courte', 'cargaison', strate)} | — |`); } catch { /* lieu inconnu */ }
  console.log(`(mission courte : ${MISSIONS.courte.composants} compo de base × Strate × cargaison 1,4, 1 doublon)`);
}
