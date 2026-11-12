// npx tsx scripts/progression.ts [--graines 12 --jours 45 --profil occasionnel|assidu|marathon] --essais "nom:cle=valeur,cle=valeur;nom2:…"
// La progression par la force du deck (11 novembre 2026, Bryan : « je voulais que la progression se fasse surtout avec la force
// du deck qui grandit », pas en attendant des creuseurs). Ce script ne change rien au jeu : il rejoue les mêmes parties d'un joueur
// moyen avec des réglages essayés, et mesure ce qui retient le joueur et de quoi son deck est fait à chaque Strate.
//
// Clés d'un essai (toutes facultatives) :
//   force=0.9 des=4      force des ennemis multipliée à partir de la Strate −des
//   pente=0.95           en plus : force multipliée par pente^(Strate − des) (les Strates profondes baissent davantage, ou montent si > 1)
//   t4=1.05 … t10=0.9    en plus : force de la Strate −4 … −10 multipliée (réglage Strate par Strate)
//   bonus=0.25           COLLECTION.bonusNiveau (niveaux 2 et 4 : part de la force de départ)
//   cran=0.15            COLLECTION.cranForce (niveaux 3 et 5 d'une carte sans effet à renforcer)
//   doublons=0.5         doublons demandés par niveau, multipliés (arrondi, 1 au moins)
//   refab=0.5            prix et durée d'une refabrication à la Forge, multipliés
//   creuseurs=3          plafond des creuseurs demandés par Strate (0 : aucun)
//   noyau=0              1 par défaut ; 0 : la Tour du Noyau ne retient plus les Strates −9 et −10 (NOYAU_MIN)
//   oser=1 conseil=2.15  le joueur ne tente le front que si la force de son escouade (forceEscouade) atteint oser × la force
//                        conseillée de la Strate (conseil × la force de ses ennemis) ; sinon il fouille juste au-dessus pour se renforcer
//   metaux=1             les métaux suivent la profondeur (un métal dominant par paire de Strates) ; metaux=2 : version plus douce
//   charge=0             sans la Charge : seuls les places et le niveau demandé par le métal limitent le deck
//   seuils=1             niveau de Porteur demandé par métal : 1 = argent 5, or 9, nacre 13 ; 2 = argent 6, or 11, nacre 15 ; 3 = cuivre 3, argent 7, or 12, nacre 16
//   niveaux=5            témoin : toutes les cartes possédées sont tenues à ce niveau (ce que vaudraient des niveaux gratuits)
import { CHARGE, COLLECTION, NIVEAU_METAL, TABLES_RARETE } from '../src/core/collection';
import { FORCE, forceStrate } from '../src/core/expedition';
import { CREUSEURS, chargeMax, chargePortee, niveauPorteur } from '../src/core/partie/etat';
import { NOYAU_MIN } from '../src/core/partie/district';
import { PROFILS, mediane, simulerParcours, type Profil } from '../src/core/parcours';
import { moduleDe, moduleDef } from '../src/core/donnees';
import type { Rarete } from '../src/core/types';

const texte = (nom: string, defaut: string) => { const i = process.argv.indexOf('--' + nom); return i > 0 ? process.argv[i + 1]! : defaut; };
const GRAINES = Number(texte('graines', '12')), JOURS = Number(texte('jours', '45'));
const PROFILS_ESSAI: Record<string, Profil> = {
  ...PROFILS,
  // un joueur qui ne lâche pas son téléphone : une expédition par heure de 8 h à 23 h
  marathon: { nom: 'Marathon (16 expéditions par jour)', sessions: Array.from({ length: 16 }, (_, i) => 8 + i) },
  unParJour: { nom: 'Une expédition par jour', sessions: [20] },
};
const PROFIL = PROFILS_ESSAI[texte('profil', 'occasionnel')]!;
const ESSAIS = texte('essais', 'actuel:').split(';').map((e) => {
  const [nom, reste = ''] = e.split(':');
  return { nom: nom!, r: Object.fromEntries(reste.split(',').filter(Boolean).map((kv) => { const [k, v] = kv.split('='); return [k!, Number(v)]; })) as Record<string, number> };
});

// les réglages d'origine, remis avant chaque essai
const C = COLLECTION as unknown as { bonusNiveau: number; cranForce: number; doublons: Record<Rarete, number[]>; refabrication: Record<Rarete, { energie: number; minutes: number }> };
const origine = {
  table: [...FORCE.table], bonus: C.bonusNiveau, cran: C.cranForce, requis: [...CREUSEURS.requis],
  doublons: JSON.stringify(C.doublons), refab: JSON.stringify(C.refabrication), noyau: { ...NOYAU_MIN },
};
const raretes = JSON.stringify(TABLES_RARETE);
const chargeBase = CHARGE.base, seuilsOrigine = { ...NIVEAU_METAL };
const SEUILS: Record<number, Partial<Record<Rarete, number>>> = { 1: { argent: 5, or: 9, nacre: 13 }, 2: { argent: 6, or: 11, nacre: 15 }, 3: { cuivre: 3, argent: 7, or: 12, nacre: 16 } };
// Les métaux par profondeur : chaque paire de Strates a son métal dominant, comme une nouvelle zone donne ses cartes
const METAUX: Record<number, typeof TABLES_RARETE> = {
  1: [
    { jusqua: 2, table: { fer: 88, cuivre: 11, argent: 1, or: 0, nacre: 0 } },
    { jusqua: 4, table: { fer: 60, cuivre: 34, argent: 5.5, or: 0.5, nacre: 0 } },
    { jusqua: 6, table: { fer: 35, cuivre: 48, argent: 15, or: 2, nacre: 0 } },
    { jusqua: 8, table: { fer: 20, cuivre: 45, argent: 30, or: 5, nacre: 0 } },
    { jusqua: 10, table: { fer: 10, cuivre: 35, argent: 42, or: 12, nacre: 1 } },
    { jusqua: Infinity, table: { fer: 5, cuivre: 30, argent: 45, or: 18, nacre: 2 } },
  ],
  2: [
    { jusqua: 2, table: { fer: 88, cuivre: 11, argent: 1, or: 0, nacre: 0 } },
    { jusqua: 4, table: { fer: 68, cuivre: 27, argent: 4.5, or: 0.5, nacre: 0 } },
    { jusqua: 6, table: { fer: 50, cuivre: 38, argent: 10.5, or: 1.5, nacre: 0 } },
    { jusqua: 8, table: { fer: 38, cuivre: 42, argent: 17, or: 3, nacre: 0 } },
    { jusqua: 10, table: { fer: 28, cuivre: 42, argent: 24, or: 5.5, nacre: 0.5 } },
    { jusqua: Infinity, table: { fer: 20, cuivre: 42, argent: 28, or: 9, nacre: 1 } },
  ],
};
function regler(r: Record<string, number>): void {
  (CHARGE as { base: number }).base = r.charge === 0 ? 150 : chargeBase;
  Object.assign(NIVEAU_METAL, seuilsOrigine, r.seuils ? SEUILS[r.seuils] : {});
  TABLES_RARETE.splice(0, TABLES_RARETE.length, ...(r.metaux ? METAUX[r.metaux]! : (JSON.parse(raretes) as typeof TABLES_RARETE).map((t) => ({ ...t, jusqua: t.jusqua ?? Infinity }))));
  const des = r.des ?? 4, k = r.force ?? 1, pente = r.pente ?? 1;
  FORCE.table.splice(0, origine.table.length, ...origine.table.map((f, i) => Math.round((i + 1 >= des ? f * k * pente ** (i + 1 - des) : f) * (r['t' + (i + 1)] ?? 1) * 1000) / 1000));
  C.bonusNiveau = r.bonus ?? origine.bonus;
  C.cranForce = r.cran ?? origine.cran;
  const d = JSON.parse(origine.doublons) as Record<Rarete, number[]>;
  for (const m of Object.keys(d) as Rarete[]) C.doublons[m] = d[m]!.map((n) => Math.max(1, Math.round(n * (r.doublons ?? 1))));
  const f = JSON.parse(origine.refab) as Record<Rarete, { energie: number; minutes: number }>;
  for (const m of Object.keys(f) as Rarete[]) Object.assign(C.refabrication[m], { energie: Math.round(f[m]!.energie * (r.refab ?? 1)), minutes: Math.max(1, Math.round(f[m]!.minutes * (r.refab ?? 1))) });
  CREUSEURS.requis.splice(0, origine.requis.length, ...origine.requis.map((n) => (r.creuseurs === undefined ? n : Math.min(n, r.creuseurs))));
  for (const s of Object.keys(origine.noyau)) (NOYAU_MIN as Record<string, number>)[s] = r.noyau === 0 ? 0 : origine.noyau[Number(s)]!;
}

const moy = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : NaN);
const un = (x: number) => (Number.isFinite(x) ? (Math.round(x * 10) / 10).toFixed(1) : '—');
console.log(`${PROFIL.nom}, ${GRAINES} parties de ${JOURS} jours\n`);
console.log('essai'.padEnd(22), 'front'.padEnd(6), '−4'.padEnd(5), '−7'.padEnd(5), '−10 (de… à…)'.padEnd(20), 'attente'.padEnd(8), 'prépare'.padEnd(8), 'blocage'.padEnd(14),
  'niveau des cartes du deck à −4 / −7 / −10'.padEnd(42), 'argent+ dans le deck à −10'.padEnd(27), 'niveau des Porteurs à −10');
for (const e of ESSAIS) {
  regler(e.r);
  let sessions = 0, attentes = 0, prepa = 0;
  const parStrate: Record<number, [number, number]> = {};
  const jourNiveau: Record<number, number[]> = { 4: [], 7: [], 10: [], 13: [] }, metal: Record<number, number[]> = {};
  const niveaux: Record<number, number[]> = {}, porteurs: number[] = [], rares: number[] = [], charge: Record<number, number[]> = {};
  const runs = Array.from({ length: GRAINES }, (_, i) => {
    let vue = 1;
    const atteint = new Set<number>();
    return simulerParcours(PROFIL, JOURS, 1000 + i * 7919, {
      joueur: 'moyen',
      tentative: (st, _f, v) => { const x = (parStrate[st] ??= [0, 0]); x[0]++; if (v) x[1]++; },
      ...(e.r.oser ? { oser: (j: { strate: number }, strate: number, force: number) => { const ok = force >= e.r.oser! * (e.r.conseil ?? 2.15) * forceStrate(strate); if (!ok && j.strate < 10) prepa++; return ok; } } : {}),
      session: (j, _jour, attente) => {
        if (e.r.niveaux) for (const c of Object.values(j.collection)) c.niveau = Math.max(c.niveau, e.r.niveaux);
        if (j.strate < 10) { sessions++; if (attente) attentes++; }
        const nv = moy(j.escouade.map((id) => niveauPorteur(j, id).niveau));
        for (const n of [4, 7, 10, 13]) if (nv >= n && !atteint.has(n)) { atteint.add(n); jourNiveau[n]!.push(_jour); }
        while (vue < j.strate) {
          vue++;
          const deck = j.escouade.flatMap((id) => j.porteurs[id]?.modules ?? []);
          (niveaux[vue] ??= []).push(moy(deck.map((k) => j.collection[k]?.niveau ?? 1)));
          (metal[vue] ??= []).push(deck.filter((k) => ['argent', 'or', 'nacre'].includes(k.split('@')[1] ?? moduleDef(moduleDe(k)).rarete)).length / Math.max(1, deck.length));
          (charge[vue] ??= []).push(moy(j.escouade.map((id) => chargePortee(j, id) / Math.max(1, chargeMax(j, id)))));
          if (vue === 10) {
            porteurs.push(moy(j.escouade.map((id) => niveauPorteur(j, id).niveau)));
            rares.push(deck.filter((k) => ['argent', 'or', 'nacre'].includes(k.split('@')[1] ?? moduleDef(moduleDe(k)).rarete)).length / Math.max(1, deck.length));
          }
        }
      },
    });
  });
  const t = runs.reduce((n, r) => n + r.front.tentatives, 0), v = runs.reduce((n, r) => n + r.front.victoires, 0);
  const jour = (s: number) => runs.map((r) => r.ouverture[s] ?? Infinity);
  const f = (x: number) => (Number.isFinite(x) ? 'j' + x : '—');
  const j10 = jour(10), fini = j10.filter(Number.isFinite);
  const blocage = runs.map((r) => Math.max(0, ...Object.entries(r.expeditions).filter(([s]) => Number(s) <= 10).map(([, n]) => n)));
  console.log(
    e.nom.padEnd(22), `${Math.round((100 * v) / Math.max(1, t))} %`.padEnd(6), f(mediane(jour(4))).padEnd(5), f(mediane(jour(7))).padEnd(5),
    `${f(mediane(j10))} (${fini.length ? f(Math.min(...fini)) : '—'} à ${f(Math.max(...j10))})`.padEnd(20),
    `${Math.round((100 * attentes) / Math.max(1, sessions))} %`.padEnd(8), `${Math.round((100 * prepa) / Math.max(1, sessions))} %`.padEnd(8), `${mediane(blocage)} (pire ${Math.max(...blocage)})`.padEnd(14),
    `${un(moy(niveaux[4] ?? []))} / ${un(moy(niveaux[7] ?? []))} / ${un(moy(niveaux[10] ?? []))}`.padEnd(42),
    `${Math.round(100 * moy(rares))} %`.padEnd(27), un(moy(porteurs)).padEnd(6),
    `victoires par front −2…−10 : ${[2, 3, 4, 5, 6, 7, 8, 9, 10].map((x) => (parStrate[x] ? Math.round((100 * parStrate[x]![1]) / parStrate[x]![0]) : '—')).join(' ')}   force −4…−10 : ${FORCE.table.slice(3, 10).join(' ')}   ` + `Porteurs niveau 4 / 7 / 10 / 13 au jour ${[4, 7, 10, 13].map((n) => (jourNiveau[n]!.length >= GRAINES / 2 ? mediane(jourNiveau[n]!) : '—')).join(' / ')}   argent+ à −4 / −7 / −10 : ${[4, 7, 10].map((x) => Math.round(100 * moy(metal[x] ?? [])) + ' %').join(' / ')}   ` + `Charge remplie à −4 / −7 / −10 : ${[4, 7, 10].map((x) => Math.round(100 * moy(charge[x] ?? [])) + ' %').join(' / ')}   ` + 'expéditions par front −2…−9 : ' + [2, 3, 4, 5, 6, 7, 8, 9].map((x) => mediane(runs.map((r) => r.expeditions[x + 1] ?? 0))).join(' '),
  );
}
regler({});
