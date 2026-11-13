// Le Gardien de la ville (13 novembre 2026) : sa bulle sur la Cuvette, et sa feuille.
// Bryan : « une bulle sur la page, et quand on clique, on se rend sur le boss. Quelque chose d'éphémère à l'écran, mais
// encore consultable. » La bulle n'apparaît que quand quelque chose attend (une tentative, un palier de la ville) ;
// la feuille reste ouverte à tout moment depuis la Tour (« Aujourd'hui en bas »).
// Les règles sont dans src/core/partie/gardien.ts ; la jauge de la ville vient du serveur (src/app/ville.ts).

import { GARDIEN_VILLE, etatGardien, gardienDeLaSemaine, gardienOuvert, perleDeLaSemaine, prochaineTentative, regleDeLaSemaine, type Jeu, type VilleGardien } from '../core/jeu';
import { illustrationEnnemi } from './art';
import { decompte, type EcranDistrict } from './coquille';
import { ICO, perle } from './icones';
import { echap } from './outils';
import { t as tr, locale } from '../core/i18n';

const parts = (n: number) => n.toLocaleString(locale(), { maximumFractionDigits: 1 });

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

/** La jauge de la ville, avec ses paliers */
function jauge(ville: VilleGardien | null | undefined, semaine: number): string {
  const v = ville && ville.semaine === semaine ? ville : null;
  const part = v ? Math.min(1.5, v.parts / Math.max(1, v.pv)) : 0;
  const pct = Math.round((part / 1.5) * 100);
  const crans = GARDIEN_VILLE.paliers.map((p) => `<i class="gv-cran${part >= p ? ' atteint' : ''}" style="left:${(p / 1.5) * 100}%"><b>${Math.round(p * 100)} %</b></i>`).join('');
  return `<section class="gv-ville" aria-label="${tr`La ville contre le Gardien`}">`
    + `<div class="gv-ville-tete"><span class="surtitre">${ICO.porteurs}${tr`Toute la ville`}</span>`
    + `<b>${v ? tr`${Math.round(part * 100)} % repoussé` : tr('Personne n’a encore frappé')}</b></div>`
    + `<span class="gv-barre" role="progressbar" aria-valuemin="0" aria-valuemax="150" aria-valuenow="${Math.round(part * 100)}"><i style="width:${pct}%"></i>${crans}</span>`
    + (v ? `<small>${v.frappeurs > 1 ? tr`${v.frappeurs} directeurs ont frappé` : tr`${v.frappeurs} directeur a frappé`} · ${tr`${parts(v.parts)} parts sur ${parts(v.pv)}`}</small>` : `<small>${tr('La jauge se remplit des parts de chaque directeur.')}</small>`)
    + `</section>`;
}

/** Ce que la ville gagne à chaque palier */
function paliers(j: Jeu, ville: VilleGardien | null | undefined, semaine: number): string {
  const g = j.gardienVille;
  const part = ville && ville.semaine === semaine ? ville.parts / Math.max(1, ville.pv) : 0;
  const jour = GARDIEN_VILLE.cristauxJour * Math.max(1, Math.min(99, (j.strate ?? 1) - (j.frontVaincu ? 0 : 1)));
  const perleIci = perleDeLaSemaine(j, semaine);
  const lignes: [number, string, string][] = [
    [0.25, ICO.energie, tr`${Math.round(jour / 2)} cristaux`],
    [0.5, ICO.eclats, tr`10 Éclats`],
    [0.75, ICO.cartes, tr('Une carte au choix')],
    [1, perleIci ? perle('ico peinte') : ICO.energie, perleIci ? tr`${jour} cristaux et une Perle de nacre` : tr`${jour} cristaux`],
    [1.5, ICO.district, tr('Un décor pour la Cuvette')],
  ];
  return `<h3 class="titre-bloc">${ICO.etoile}${tr`Ce que la ville gagne`}</h3><ol class="gv-paliers">`
    + lignes.map(([p, ico, quoi]) => {
      const recu = g?.recus.includes(p);
      const atteint = part >= p;
      return `<li class="${recu ? 'recu' : atteint ? 'atteint' : ''}"><b>${Math.round(p * 100)} %</b><span>${ico}${echap(quoi)}</span><i>${recu ? `${ICO.ok}${tr`Reçu`}` : atteint ? tr('Atteint') : ''}</i></li>`;
    }).join('') + `</ol>`
    + `<p class="gv-note">${tr`Chaque palier atteint par la ville revient à tous ceux qui ont frappé au moins une fois cette semaine.`}</p>`;
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
  const regle = regleDeLaSemaine(g.semaine);
  const img = illustrationEnnemi(sem.ennemi);
  const prochaine = prochaineTentative(j, e.now);
  const envoi = g.aEnvoyer.length;
  h += `<header class="feuille-tete"><div class="titres"><span class="surtitre">${tr`LE GARDIEN DE LA VILLE · CETTE SEMAINE`}</span><h2 id="gv-titre">${echap(sem.nom)}</h2></div>${fermer}</header><div class="feuille-corps">`;
  h += `<div class="gv-scene">${img ? `<img src="${img}" alt="" decoding="async">` : ''}<p>${echap(tr`Il remonte par le puits et menace toutes les cuvettes. Chaque directeur a douze tours pour le frapper : la ville additionne les coups.`)}</p></div>`;
  if (regle) h += `<p class="gv-regle">${ICO.boost}<span><strong>${tr`Règle de la semaine · ${echap(regle.nom)}`}</strong>${echap(regle.texte)}</span></p>`;
  h += jauge(e.ville, g.semaine);
  // ce que ce directeur a fait, et ses tentatives
  h += `<section class="fb-bloc gv-moi"><div class="gv-chiffres">`
    + `<span><b>${parts(g.parts + g.aEnvoyer.reduce((n, f) => n + f.parts, 0))}</b><small>${tr`tes parts`}</small></span>`
    + `<span><b>${parts(g.meilleure)}</b><small>${tr`ta plus belle frappe`}</small></span>`
    + `<span><b>${g.tentatives}<i>/${GARDIEN_VILLE.reserve}</i></b><small>${tr`tentatives`}</small></span></div>`
    + (envoi ? `<p class="gv-envoi">${ICO.chrono}<span>${envoi > 1 ? tr`${envoi} frappes en route vers la ville : elles comptent dès que tu es en ligne.` : tr('Une frappe en route vers la ville : elle compte dès que tu es en ligne.')}</span></p>` : '')
    + (g.tentatives > 0
      ? `<button type="button" class="btn prim large" data-action="ville-preparer"${j.expedition ? ' disabled' : ''}>${ICO.atk}${tr`Frapper le Gardien`}</button>`
      : `<p class="gv-attente">${ICO.chrono}<span>${prochaine ? `${tr('Prochaine tentative')} ${decompte(prochaine, e.now, tr('dans '))}` : ''}</span></p>`)
    + `</section>`;
  // le fil des dernières frappes de la ville
  const fil = e.ville && e.ville.semaine === g.semaine ? e.ville.fil ?? [] : [];
  if (fil.length) {
    h += `<h3 class="titre-bloc">${ICO.journal}${tr`Les dernières frappes`}</h3><ul class="gv-fil">`
      + fil.slice(0, 8).map((f) => `<li><span>${echap(f.nom)}</span><small>−${f.strate}</small><b>${parts(f.parts)} ${f.parts >= 2 ? tr('parts') : tr('part')}</b></li>`).join('') + `</ul>`;
  }
  h += paliers(j, e.ville, g.semaine);
  h += `<p class="gv-note">${tr`1 part, c’est à peu près un combat de gardien de ta Strate : un débutant compte autant qu’un vétéran. On ne peut pas perdre : l’escouade ne prend pas d’Usure.`}</p>`;
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
