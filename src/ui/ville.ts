// Le Gardien de la ville (13 novembre 2026) : sa bulle sur la Cuvette, et sa feuille.
// Bryan : « une bulle sur la page, et quand on clique, on se rend sur le boss. Quelque chose d'éphémère à l'écran, mais
// encore consultable. » La bulle n'apparaît que quand quelque chose attend (une tentative, un palier de la ville) ;
// la feuille reste ouverte à tout moment depuis la Tour (« Aujourd'hui en bas »).
// Les règles sont dans src/core/partie/gardien.ts ; la jauge de la ville vient du serveur (src/app/ville.ts).

import { strateVaincue, GARDIEN_VILLE, degatsSemaine, etatGardien, gardienDeLaSemaine, gardienOuvert, metalBonus, perleDeLaSemaine, prochaineTentative, regleDeLaSemaine, type Jeu, type VilleGardien } from '../core/jeu';
import { NOMS_RARETE } from '../core/collection';
import { illustrationEnnemi } from './art';
import { decompte, type EcranDistrict } from './coquille';
import { ICO, icone, perle, baseIcones } from './icones';
import { echap } from './outils';
import { t as tr, locale } from '../core/i18n';


/** Faut-il montrer la bulle ? Une tentative à jouer, ou un palier de la ville pas encore reçu */
export function bulleGardienUtile(j: Jeu, ville: VilleGardien | null | undefined, now: number): boolean {
  if (!gardienOuvert(j) || j.expedition) return false;
  const g = etatGardien(j, now);
  if (g.tentatives > 0) return true;
  const part = ville && ville.semaine === g.semaine ? ville.parts / Math.max(1, ville.pv) : 0;
  return GARDIEN_VILLE.paliers.some((p) => part >= p && !g.recus.includes(p));
}

/** La bulle ronde, avec le portrait du Gardien de la semaine (rangée des bulles, en haut à gauche de la Cuvette) */
export function bulleGardien(e: EcranDistrict): string {
  const j = e.j;
  if (!bulleGardienUtile(j, e.ville, e.now)) return '';
  const g = etatGardien(j, e.now);
  const sem = gardienDeLaSemaine(g.semaine);
  const img = illustrationEnnemi(sem.ennemi);
  return `<button type="button" class="bulle-d gv-bulle prete" data-action="ville" aria-label="${echap(tr`Le Gardien de la ville : ${sem.nom}, ${g.tentatives} tentative${g.tentatives > 1 ? 's' : ''}`)}">`
    + `<span class="bulle-med">${img ? `<img src="${img}" alt="" decoding="async">` : ICO.bouclier}</span>`
    + (g.tentatives > 0 ? `<b class="bulle-nb">${g.tentatives}</b>` : '') + `</button>`;
}

const nombre = (n: number) => Math.round(n).toLocaleString(locale());

/** La part de la ville cette semaine (0 : personne n'a frappé, ou pas encore lue) */
const partVille = (ville: VilleGardien | null | undefined, semaine: number) =>
  ville && ville.semaine === semaine ? ville.parts / Math.max(1, ville.pv) : 0;

/** Le haut de la feuille (14 novembre 2026, Bryan : « l'écran du gardien n'est pas vraiment visuel ») : le Gardien en grand,
 *  sa règle de salle en pastille, et où en est la ville, écrit sur l'image comme la vie d'un boss */
function scene(j: Jeu, ville: VilleGardien | null | undefined, semaine: number): string {
  const sem = gardienDeLaSemaine(semaine);
  const regle = regleDeLaSemaine(semaine);
  const img = illustrationEnnemi(sem.ennemi);
  const v = ville && ville.semaine === semaine ? ville : null;
  const part = partVille(ville, semaine);
  const abattu = part >= 1;
  return `<div class="gv-hero${abattu ? ' abattu' : ''}">${img ? `<img src="${img}" alt="" decoding="async">` : ''}`
    + (regle ? `<span class="gv-regle-pastille">${ICO.boost}${echap(regle.nom)}</span>` : '')
    + `<div class="gv-hero-bas"><b class="gv-pct">${Math.round(part * 100)}<small>%</small></b>`
    + `<span><strong>${abattu ? tr('Abattu par la ville') : tr('Repoussé par la ville')}</strong>`
    + `<small>${v && v.frappeurs ? (v.frappeurs > 1 ? tr`${v.frappeurs} directeurs ont frappé` : tr`${v.frappeurs} directeur a frappé`) : tr('Personne n’a encore frappé')}</small></span></div></div>`
    + (regle ? `<p class="gv-regle"><strong>${tr`Règle de la semaine`}</strong> ${echap(regle.texte)}</p>` : '')
    + piste(j, ville, semaine);
}

/** La piste des paliers : cinq crans à égale distance, reliés par la jauge de la ville, chacun avec sa récompense */
function piste(j: Jeu, ville: VilleGardien | null | undefined, semaine: number): string {
  const g = j.gardienVille;
  const part = partVille(ville, semaine);
  const strate = Math.max(1, strateVaincue(j));
  const jour = GARDIEN_VILLE.cristauxJour * strate;
  const perleIci = perleDeLaSemaine(j, semaine);
  const P = GARDIEN_VILLE.paliers;
  const crans: [string, string, string][] = [
    [icone('energie'), nombre(jour / 2), tr`${nombre(jour / 2)} cristaux`],
    [icone('eclats'), '10', tr`10 Éclats`],
    [icone('cartes'), tr('Carte'), tr('Une carte au choix')],
    [perleIci ? perle('ico peinte') : icone('energie'), perleIci ? tr('Perle') : nombre(jour), perleIci ? tr`${nombre(jour)} cristaux et une Perle de nacre` : tr`${nombre(jour)} cristaux`],
    [icone('cartes'), NOMS_RARETE[metalBonus(strate)], tr`Une carte au choix en ${NOMS_RARETE[metalBonus(strate)].toLowerCase()}`],
  ];
  // la jauge avance d'un cran à l'autre : entre deux paliers, la part de l'écart déjà faite
  let rempli = 0;
  for (let i = 0; i < P.length; i++) {
    const avant = i ? P[i - 1]! : 0;
    if (part >= P[i]!) { rempli = i + 1; continue; }
    rempli = i + (part - avant) / (P[i]! - avant);
    break;
  }
  // le premier cran est à 10 % de la piste, les suivants tous les 20 % (cinq colonnes égales)
  const r = Math.min(P.length, rempli);
  const pct = r <= 1 ? r * 10 : 10 + (r - 1) * 20;
  return `<ol class="gv-piste" aria-label="${tr`Ce que la ville gagne`}" style="--rempli:${pct.toFixed(1)}">`
    + crans.map(([ico, court, long], i) => {
      const p = P[i]!;
      const recu = !!g?.recus.includes(p);
      const etat = recu ? 'recu' : part >= p ? 'atteint' : '';
      return `<li class="${etat}${i === P.length - 1 ? ' bonus' : ''}" aria-label="${echap(`${Math.round(p * 100)} % : ${long}${recu ? ` (${tr('reçu')})` : part >= p ? ` (${tr('atteint')})` : ''}`)}">`
        + `<span class="gv-noeud">${ico}${recu ? `<i class="gv-coche">${ICO.ok}</i>` : ''}</span>`
        + `<b>${Math.round(p * 100)} %</b><small>${echap(court)}</small></li>`;
    }).join('') + `</ol>`;
}

/** Le classement des dégâts de la semaine, en dégâts purs (Bryan, 13 novembre 2026) : un podium, puis la suite */
function classement(j: Jeu, ville: VilleGardien | null | undefined, semaine: number, mesDegats: number): string {
  const v = ville && ville.semaine === semaine ? ville : null;
  const lignes = v?.classement ?? [];
  const titre = `<h3 class="titre-bloc">${tr`Les dégâts de la semaine`}</h3>`;
  // toujours consultable (Bryan, 14 novembre 2026) : en attendant la lecture en ligne, ou si personne n'a encore frappé
  if (!lignes.length) return titre + `<p class="gv-vide">${v && v.frappeurs ? tr('Le classement se charge… Il s’affiche dès que tu es en ligne.') : tr('Personne n’a encore frappé cette semaine : le premier coup ouvre le classement.')}</p>`;
  const nom = (n: string | null) => echap(n ?? tr('Un directeur'));
  const toi = `<em>${tr`toi`}</em>`;
  const podium = lignes.slice(0, 3).map((l, i) => {
    const moi = l.uid === v!.moi;
    return `<li class="p${i + 1}${moi ? ' moi' : ''}"><span class="gv-medaille">${i + 1}</span>`
      + `<span class="gv-nom">${nom(l.nom)}</span>${moi ? toi : ''}`
      + `<b>${nombre(l.degats)}</b><small>${tr`dégâts`} · −${l.strate}</small></li>`;
  }).join('');
  const ligne = (rang: number, n: string | null, strate: number, d: number, moi: boolean) =>
    `<li class="${moi ? 'moi' : ''}"><b class="gv-rang">${rang}</b><span>${nom(n)}${moi ? toi : ''}</span><small>−${strate}</small><b>${nombre(d)}</b></li>`;
  let suite = lignes.slice(3).map((l, i) => ligne(i + 4, l.nom, l.strate, l.degats, l.uid === v!.moi)).join('');
  if (v!.rang && v!.rang > lignes.length) suite += `<li class="gv-ecart" aria-hidden="true">···</li>` + ligne(v!.rang, j.directeur?.nom || tr('Un directeur'), Math.max(1, strateVaincue(j)), mesDegats, true);
  return titre + `<ol class="gv-podium">${podium}</ol>`
    + (suite ? `<ol class="gv-classement">${suite}</ol>` : '');
}

/** La feuille du Gardien de la ville */
export function feuilleVille(e: EcranDistrict): string {
  if (!e.villeOuverte) return '';
  const j = e.j;
  const fermer = `<button type="button" class="btn-icone" data-action="ville" aria-label="${tr`Fermer`}">${ICO.fermer}</button>`;
  let h = `<div class="voile-feuille" data-action="ville" aria-hidden="true"></div><section class="feuille bs-feuille gv-feuille" role="dialog" aria-modal="true" aria-labelledby="gv-titre"><span class="poignee" aria-hidden="true"></span>`;
  if (!gardienOuvert(j)) {
    return h + `<header class="feuille-tete"><div class="titres"><span class="surtitre">${tr`CHAQUE SEMAINE`}</span><h2 id="gv-titre">${tr`Le Gardien de la ville`}</h2></div>${fermer}</header>`
      + `<div class="feuille-corps"><p class="xo-raison">${ICO.verrou}<span>${tr`Il se montre aux directeurs qui ont vaincu la Strate −${GARDIEN_VILLE.ouverture}.`}</span></p></div></section>`;
  }
  const g = etatGardien(j, e.now);
  const sem = gardienDeLaSemaine(g.semaine);
  const prochaine = prochaineTentative(j, e.now);
  const envoi = g.aEnvoyer.length;
  const mesDegats = degatsSemaine(g);
  h += `<header class="feuille-tete"><div class="titres"><span class="surtitre">${tr`LE GARDIEN DE LA VILLE · CETTE SEMAINE`}</span><h2 id="gv-titre">${echap(sem.nom)}</h2></div>${fermer}</header><div class="feuille-corps">`;
  h += scene(j, e.ville, g.semaine);
  // frapper : les tentatives en losanges dans le bouton, ce directeur en une ligne dessous
  const losanges = Array.from({ length: GARDIEN_VILLE.reserve }, (_, i) => `<i class="${i < g.tentatives ? 'plein' : ''}"></i>`).join('');
  h += `<section class="gv-frapper">`
    + (g.tentatives > 0
      ? `<button type="button" class="btn prim large gv-go" data-action="ville-preparer"${j.expedition ? ' disabled' : ''}><img class="ico peinte action" src="${baseIcones}frapper.webp" alt="" aria-hidden="true" decoding="async"><span>${tr`Frapper le Gardien`}</span><span class="gv-losanges" aria-label="${echap(tr`${g.tentatives} tentative${g.tentatives > 1 ? 's' : ''} sur ${GARDIEN_VILLE.reserve}`)}">${losanges}</span></button>`
      : `<p class="gv-attente">${ICO.chrono}<span>${prochaine ? `${tr('Prochaine tentative')} ${decompte(prochaine, e.now, tr('dans '))}` : ''}</span></p>`)
    + `<p class="gv-moi">${mesDegats ? `${tr`Ta semaine`} <b>${nombre(mesDegats)}</b> ${tr`dégâts`} · ${tr`plus beau coup`} <b>${nombre(g.record ?? 0)}</b>` : tr`${GARDIEN_VILLE.tours} tours pour frapper. Tu ne peux pas perdre : seuls les dégâts comptent.`}</p>`
    + (envoi ? `<p class="gv-envoi">${ICO.chrono}<span>${envoi > 1 ? tr`${envoi} frappes en route vers la ville : elles comptent dès que tu es en ligne.` : tr('Une frappe en route vers la ville : elle compte dès que tu es en ligne.')}</span></p>` : '')
    + `</section>`;
  h += classement(j, e.ville, g.semaine, mesDegats);
  h += `<details class="gv-aide"><summary>${ICO.aide}${tr`Comment ça marche`}</summary>`
    + `<p>${tr`Il remonte par le puits chaque lundi et menace toutes les cuvettes. Une tentative par jour, trois au plus en réserve : ${GARDIEN_VILLE.tours} tours.`}</p>`
    + `<p>${tr`Choisis librement tes 3 Porteurs pour ce combat, sans toucher à tes escouades. On ne peut pas perdre : tout le monde part à PV pleins et ne prend pas d’Usure.`}</p>`
    + `<p>${tr`La ville additionne les coups de tous les directeurs. Pour la jauge, chaque frappe est ramenée à ta Strate (un débutant compte autant qu’un vétéran) et compte au plus 3 parts.`}</p>`
    + `<p>${tr`Chaque palier atteint revient à tous ceux qui ont frappé au moins une fois cette semaine. Le classement, lui, compte les dégâts purs. Tout repart à zéro le lundi.`}</p></details>`;
  return h + `</div></section>`;
}

/** La ligne de la Tour (« Aujourd'hui en bas ») : toujours là, pour rouvrir la feuille */
export function ligneVille(e: EcranDistrict, off: boolean): string {
  const j = e.j;
  if (!gardienOuvert(j)) return '';
  const g = etatGardien(j, e.now);
  const sem = gardienDeLaSemaine(g.semaine);
  const v = e.ville && e.ville.semaine === g.semaine ? e.ville : null;
  const part = v ? Math.round((v.parts / Math.max(1, v.pv)) * 100) : 0;
  return `<li class="tr-autour-ligne${g.tentatives ? '' : ' faite'}">${ICO.bouclier}<span><strong>${tr`Gardien de la ville · ${echap(sem.nom)}`}</strong>`
    + `<small>${tr`La ville l’a repoussé à ${part} %.`} ${g.tentatives ? tr`${g.tentatives} tentative${g.tentatives > 1 ? 's' : ''} pour frapper.` : tr('Plus de tentative aujourd’hui.')}</small></span>`
    + `<button type="button" class="btn ${g.tentatives ? 'prim' : 'sec'}" data-action="ville"${off && g.tentatives ? ' disabled' : ''}>${g.tentatives ? tr('Frapper') : tr('Voir')}</button></li>`;
}

/** Sur PC, les bulles laissent place aux panneaux de droite : le Gardien y a sa carte, tant que quelque chose attend */
export function appelVille(e: EcranDistrict): string {
  const j = e.j;
  if (!bulleGardienUtile(j, e.ville, e.now)) return '';
  const g = etatGardien(j, e.now);
  const sem = gardienDeLaSemaine(g.semaine);
  const img = illustrationEnnemi(sem.ennemi);
  const v = e.ville && e.ville.semaine === g.semaine ? e.ville : null;
  const part = v ? Math.round((v.parts / Math.max(1, v.pv)) * 100) : 0;
  return `<button type="button" class="appel gv-appel" data-action="ville">${img ? `<img class="gv-appel-img" src="${img}" alt="" decoding="async">` : ICO.bouclier}`
    + `<span><strong>${tr`Gardien de la ville`}</strong><small>${echap(sem.nom)} · ${g.tentatives ? tr`${g.tentatives} tentative${g.tentatives > 1 ? 's' : ''}` : tr('un palier t’attend')} · ${tr`la ville à ${part} %`}</small></span></button>`;
}
