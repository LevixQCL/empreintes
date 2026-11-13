// La Perle de nacre (13 novembre 2026, document « Ossyra — Monétisation » et révision de la nacre) : la promotion de l'or à la
// nacre en demande une (collection.ts, COLLECTION.perle). Bryan : « ça donne un vrai choix sur quelle carte monter » ;
// « ça peut réellement générer de la frustration de ne pas avoir du tout de solution pour les perles » : d'où une Perle
// un lundi sur deux une fois −10 vaincue, et la fonte des copies en or à la Forge.

import { COLLECTION } from '../collection';
import { moduleDef } from '../donnees';
import { log, non, semaineDe, strateVaincue, type Jeu, type Resultat } from './etat';
import { t as tr } from '../i18n';

/** Ajoute des Perles et le note au journal ; renvoie le message */
export function gagnerPerles(j: Jeu, n: number, raison: string): string {
  j.perles = (j.perles ?? 0) + n;
  const t = n > 1 ? tr`${n} Perles de nacre (${raison}) : à la Forge, chacune fait passer une carte en or en nacre.`
    : tr`Une Perle de nacre (${raison}) : à la Forge, elle fait passer une carte en or en nacre.`;
  log(j, t);
  return t;
}

/** Un lundi sur deux, une fois la Strate −10 vaincue : une Perle. Rien ne se perd pendant une absence (3 au plus d'un coup). */
export function perlesDuLundi(j: Jeu, now: number): string | null {
  if (strateVaincue(j) < 10) return null;
  const s = semaineDe(now), pas = COLLECTION.perle.semaines;
  // la première fois : le compte commence ce lundi-ci
  if (j.perleSemaine === undefined) { j.perleSemaine = s - (s % pas); return null; }
  const n = Math.min(3, Math.floor((s - j.perleSemaine) / pas));
  if (n <= 0) return null;
  j.perleSemaine += n * pas;
  return gagnerPerles(j, n, tr('le lundi des Perles'));
}

/** Les copies en or qui peuvent partir à la fonte : celles des cartes en or hors escouade, et le surplus des cartes portées */
export function copiesAFondre(j: Jeu): { id: string; n: number }[] {
  const portees = new Set(Object.values(j.porteurs).flatMap((p) => p?.modules ?? []));
  return Object.entries(j.collection)
    .filter(([id]) => moduleDef(id).rarete === 'or')
    .map(([id, c]) => ({ id, n: Math.floor((c?.doublons ?? 0) - (portees.has(id) ? COLLECTION.perle.copiesNacre : 0)) }))
    .filter((x) => x.n > 0)
    .sort((a, b) => b.n - a.n);
}

/** Fond des copies en or à la Forge pour une Perle (8 copies prises sur toutes les cartes en or, 2 000 cristaux) */
export function fondrePerle(j: Jeu): Resultat {
  const { copies, cristaux } = COLLECTION.perle.fonte;
  const dispo = copiesAFondre(j);
  if (dispo.reduce((s, x) => s + x.n, 0) < copies) return non(tr`Il faut ${copies} copies en or à fondre.`);
  if (j.energie < cristaux) return non(tr`Il faut ${cristaux} cristaux.`);
  let reste = copies;
  for (const x of dispo) {
    const pris = Math.min(reste, x.n);
    j.collection[x.id]!.doublons -= pris;
    reste -= pris;
    if (!reste) break;
  }
  j.energie -= cristaux;
  gagnerPerles(j, 1, tr`${copies} copies en or fondues`);
  return { ok: true };
}

/** Le lot des trois Récits des origines donne une Perle, une seule fois (l'application l'appelle quand les trois sont acquis) */
export function perleDesRecits(j: Jeu): string | null {
  if (j.perleRecits) return null;
  j.perleRecits = true;
  return gagnerPerles(j, 1, tr('les trois Récits des origines'));
}
