// Les contrats de marée, au Port (31 octobre 2026) : le troisième volet, à côté des pillages et des missions en mer.
// En haut, les trois marées (ouverte, remplie, en mer, ou plus bas dans les Strates) ; dessous, le contrat choisi :
// sa ruine peinte, ce qu'il rapporte, ses épreuves avec le Porteur posté sur chacune, et le taux de réussite en grand.
// Toucher une épreuve ouvre la liste des Porteurs libres, classés par leur force sur cette épreuve.
// Les règles sont dans src/core/partie/marees.ts.

import { porteurDef } from '../core/donnees';
import { CONTRAT, MAREES, contratsDuMoment, equipeConseillee, forceSurEpreuve, libresPourContrat, mareesDe, raisonHorsContrat, tauxContrat, CONTRATS, porteursPresents, strateVaincue, type ContratOuvert, type Jeu, type RangMaree } from '../core/jeu';
import { lieuDef, type Affinite } from '../core/lieux';
import type { Lignee } from '../core/types';
import { LIEUX_SLUGS, decorLieu, barque, BARQUE_PEINTE, reflets, sceneDistrict, vignetteDistrict } from './art';
import { NOM_LIGNEE, NOM_LIGNEES, NOM_PHASE, avatar, decompte, tuilePorteur, etapeVoyage, type EcranDistrict } from './coquille';
import { ICO, type Icone } from './icones';
import { echap, texteReplie } from './outils';
import { COULEUR } from './vue';
import { t as tr, enumerer } from '../core/i18n';

/** Le rôle de chaque lignée dans une épreuve (frapper, tenir, orchestrer) */
const ROLE: Record<Lignee, { icone: Icone; verbe: string }> = {
  tech: { icone: 'atk', verbe: tr('frapper') },
  bio: { icone: 'bouclier', verbe: tr('tenir') },
  reso: { icone: 'flux', verbe: tr('orchestrer') },
};
const NOM_AF: Record<Affinite, string> = { bon: tr('Fait pour ça'), neutre: tr('Peut le faire'), mauvais: tr('À contre-emploi') };
const majuscule = (t: string) => t.charAt(0).toUpperCase() + t.slice(1);
const decorDe = (lieu: string) => decorLieu(LIEUX_SLUGS.indexOf(lieu as typeof LIEUX_SLUGS[number]));

/** L'équipe affichée pour un contrat : celle choisie par le joueur (seulement des Porteurs encore libres), sinon la meilleure */
export function equipeAffichee(j: Jeu, c: ContratOuvert, choisie?: (string | null)[]): (string | null)[] {
  if (!choisie) return equipeConseillee(j, c.def);
  const libres = new Set(libresPourContrat(j));
  return c.def.epreuves.map((_, k) => (choisie[k] && libres.has(choisie[k]!) ? choisie[k]! : null));
}

/** Le contrat affiché : celui de la marée choisie, sinon le premier encore à remplir */
export function contratAffiche(j: Jeu, rang: RangMaree | undefined, now: number): ContratOuvert {
  const tous = contratsDuMoment(j, now);
  return tous.find((x) => x.rang === rang) ?? tous.find((x) => x.ouvert && !x.reussi) ?? tous[0]!;
}

/** Ce que rapporte un contrat réussi */
function recompense(j: Jeu, c: ContratOuvert): string {
  const r = MAREES[c.rang];
  const compo = Math.round(r.composants * (1 + 0.25 * (Math.max(1, strateVaincue(j)) - 1)) * (c.prise === 'cargaison' ? CONTRAT.cargaison : 1));
  const lg = `<b style="color:${COULEUR[c.lieu.lignee]}">${NOM_LIGNEES[c.lieu.lignee]}</b>`;
  const metal = c.rang === 'montante' ? `<b class="m-cuivre">${tr`cuivre`}</b>` : `<b class="m-argent">${tr`argent`}</b>`;
  if (c.prise === 'cargaison') return `<li>${ICO.composants}<span>${tr`Cargaison :`} <b>${compo}</b> ${tr`minerai, pas de carte`}</span></li><li>${ICO.lueur}<span>${tr`De l’XP pour toute l’équipe`}</span></li>`;
  const carte = c.rang === 'grande'
    ? (c.prise === 'or' ? `${tr`Prise d’or : 3 cartes des ${lg} au choix, la première en`} <b class="m-or">${tr`or`}</b>` : tr`3 cartes des ${lg} au choix, la première ${`<b class="m-argent">argent</b>`} au moins`)
    : c.prise === 'choix' ? tr`1 carte ${metal} au choix parmi 3, une par lignée` : tr`1 carte ${metal} des ${lg}`;
  return `<li>${ICO.cartes}<span>${carte}</span></li><li>${ICO.composants}<span><b>${compo}</b> ${tr`minerai, et de l’XP pour toute l’équipe`}</span></li>`;
}

/** L'étiquette de la prise sur la tuile (la prise « lignée » montre le nom de la lignée, dans sa couleur) */
const ETIQUETTE: Partial<Record<ContratOuvert['prise'], string>> = { choix: tr('Au choix'), cargaison: tr('Cargaison'), or: tr('Prise d’or') };

/** Une tuile de marée, en haut */
function tuile(j: Jeu, c: ContratOuvert, choisie: boolean, now: number): string {
  const r = MAREES[c.rang];
  const enMer = mareesDe(j).contrat?.id === c.id;
  const etat = !c.ouvert ? tr`${ICO.verrou}Strate −${r.strate}` : enMer ? tr`${ICO.chrono}En mer` : c.reussi ? `${ICO.ok}${tr('Rempli')}` : tr`${r.porteurs} Porteurs`;
  return `<button type="button" role="tab" class="mr-tuile r-${c.rang}${choisie ? ' choisi' : ''}${c.ouvert ? '' : ' fermee'}${c.reussi ? ' fait' : ''}" data-action="maree-rang" data-id="${c.rang}" aria-selected="${choisie}">`
    + `<span class="mr-coef" aria-hidden="true">${r.coef}</span><strong>${r.nom}</strong><span class="mr-etat">${etat}</span>`
    + `<em class="mr-prise p-${c.prise}"${c.prise === 'lignee' ? ` style="color:${COULEUR[c.lieu.lignee]}"` : ''}>${ETIQUETTE[c.prise] ?? NOM_LIGNEES[c.lieu.lignee]}</em>`
    + `<small>${c.ouvert ? decompte(c.fin, now, tr('encore ')) : tr('plus bas')}</small></button>`;
}

/** La gabare en mer : la même fenêtre sur le large que les barques, avec toute l'équipe */
function gabare(j: Jeu, now: number): string {
  const m = mareesDe(j).contrat;
  if (!m) return '';
  const n = Number(m.id.split('-')[1]);
  const liste = CONTRATS.filter((x) => x.rang === m.rang);
  const def = liste[((n % liste.length) + liste.length) % liste.length]!;
  const lieu = lieuDef(def.lieu)!;
  const peint = decorDe(lieu.id);
  const { x, phase } = etapeVoyage(m.debut, m.fin, now);
  const age = sceneDistrict(j.batiments.noyau).age;
  return `<div class="voyage mr-gabare ph-${phase}${peint ? ' peint' : ''}" style="--c:${COULEUR[lieu.lignee]};--x:${x.toFixed(4)}${peint ? `;--decor:url(${peint})` : ''}" data-vdebut="${m.debut}" data-vfin="${m.fin}">`
    + `<span class="vg-fond" aria-hidden="true"><i class="vg-pano"></i><i class="vg-reflets" style="--reflets:url(${reflets})"></i></span>`
    + `<div class="vg-tete"><span class="mr-equipe">${m.porteurs.map((p) => avatar(p, 34)).join('')}</span><span class="vg-qui"><strong>${MAREES[m.rang].nom} · ${echap(def.titre)}</strong><small>${echap(majuscule(lieu.nom))} · <b class="mr-taux-mini">${m.taux} %</b> ${tr`de chances`}</small></span>`
    + `<span class="vg-etat"><b data-phase>${NOM_PHASE[phase]}</b><small>${now >= m.fin ? tr('rentre au district') : decompte(m.fin, now, tr('retour dans '))}</small></span></div>`
    + `<div class="vg-route" role="img" aria-label="${tr`${NOM_PHASE[phase]}, vers ${echap(lieu.nom)}`}">`
    + `<span class="vg-port"><img src="${vignetteDistrict(age)}" alt="" decoding="async" loading="lazy"></span>`
    + `<span class="vg-eau"><i class="vg-trace"></i><i class="vg-sillage"></i>`
    + `<span class="vg-barque">${BARQUE_PEINTE ? `<img src="${barque}" alt="" decoding="async">` : ''}<i class="vg-lampe"></i><i class="vg-reflet-lampe"></i></span></span>`
    + `<span class="vg-lieu"><i class="vg-onde"></i><i class="vg-onde"></i></span></div></div>`;
}

/** Le volet « Marées » du Port */
export function htmlMarees(e: EcranDistrict): string {
  const j = e.j;
  const now = e.now;
  const m = mareesDe(j);
  const tous = contratsDuMoment(j, now);
  const c = contratAffiche(j, e.mareeRang, now);
  let h = `<section class="bloc tr-volet pl-marees">${texteReplie(tr('Aux fortes marées, la mer découvre des ruines qu’aucune barque n’atteint seule. Le passeur affrète sa gabare pour une équipe : un Porteur par tâche, et le bon rôle au bon endroit (frapper, tenir, orchestrer). Plus la marée est haute, plus c’est dur, et plus ça rapporte. Un échec n’est jamais perdu : l’équipe rapporte de quoi faire mieux la fois suivante.'), 'marees', 'aide')}`;
  if (m.contrat) h += gabare(j, now);
  h += `<div class="mr-tuiles" role="tablist" aria-label="${tr`Les trois marées`}">${tous.map((x) => tuile(j, x, x.rang === c.rang, now)).join('')}</div>`;

  // le contrat choisi : sa ruine, ses épreuves, ce qu'il rapporte
  const r = MAREES[c.rang];
  const peint = decorDe(c.lieu.id);
  h += `<article class="mr-contrat r-${c.rang}${c.ouvert ? '' : ' fermee'}" style="--c:${COULEUR[c.lieu.lignee]}${peint ? `;--decor:url(${peint})` : ''}">`
    + `<header class="mr-tete"><span class="surtitre">${tr`${r.nom} · coefficient ${r.coef} · ${NOM_LIGNEES[c.lieu.lignee]}`}</span><h3>${echap(c.def.titre)}</h3>`
    + `<small>${echap(majuscule(c.lieu.nom))}</small><p class="mr-ambiance">${echap(c.def.ambiance)}</p></header>`;
  if (!c.ouvert) {
    h += `<p class="mr-ferme">${ICO.verrou}<span>${tr`Le passeur ne s’aventure à ces marées qu’avec un directeur qui a vaincu la`} <b>${tr`Strate −${r.strate}`}</b>${tr`. Ses équipes doivent avoir fait leurs preuves en bas avant d’affronter le large.`}</span></p></article>`;
    return h + `</section>`;
  }
  h += `<ul class="mr-gains">${recompense(j, c)}</ul>`;
  if (c.reussi) {
    h += `<p class="mr-fait">${ICO.ok}<span>${tr`Contrat rempli. ${c.rang === 'montante' ? tr('Une nouvelle marée montera demain') : tr('Le prochain contrat de cette marée s’ouvre')} ${decompte(c.fin, now, tr('dans '))}.`}</span></p></article>`;
    return h + `</section>`;
  }

  // les épreuves et l'équipe
  const equipe = equipeAffichee(j, c, e.mareeEquipe?.[c.id]);
  const place = e.mareePlace ?? null;
  h += `<ol class="mr-epreuves">`;
  c.def.epreuves.forEach((ep, k) => {
    const id = equipe[k];
    const f = id ? forceSurEpreuve(j, c.rang, ep, id) : null;
    h += `<li class="mr-ep${place === k ? ' ouverte' : ''}${f ? ` af-${f.affinite}` : ' vide'}" style="--c:${COULEUR[ep.lignee]}">`
      + `<span class="mr-role" title="${NOM_LIGNEES[ep.lignee]} : ${ROLE[ep.lignee].verbe}">${ICO[ROLE[ep.lignee].icone]}</span>`
      + `<span class="mr-ep-nom"><strong>${echap(ep.nom)}</strong><small>${tr`Pour un ${NOM_LIGNEE[ep.lignee]} : ${ROLE[ep.lignee].verbe}`}</small></span>`
      + `<button type="button" class="mr-poste" data-action="maree-place" data-index="${k}" aria-expanded="${place === k}" aria-label="${id ? tr`${echap(porteurDef(id).nom)} sur cette tâche : changer` : tr('Choisir un Porteur pour cette tâche')}">`
      + (id ? `${avatar(id, 36)}<span><b>${echap(porteurDef(id).nom)}</b><small class="af">${tr`${NOM_AF[f!.affinite]} · niv. ${f!.niveau}`}</small></span>` : `<span class="mr-vide">+</span><span><b>${tr`Personne`}</b><small>${tr`Choisir`}</small></span>`)
      + `</button></li>`;
    if (place === k) {
      // les Porteurs libres, les plus forts sur cette épreuve d'abord ; ceux qui ne peuvent pas partir, grisés avec la raison
      const libres = libresPourContrat(j).map((p) => ({ p, f: forceSurEpreuve(j, c.rang, ep, p) })).sort((a, b) => b.f.s - a.f.s);
      const autres = porteursPresents(j).filter((p) => raisonHorsContrat(j, p));
      // en tuiles portrait (12 novembre 2026, refonte des fiches), comme partout où l'on choisit un Porteur
      h += `<li class="mr-choix"><div class="tb-cands">`
        + libres.map(({ p, f }) => tuilePorteur(p, { action: 'maree-choisir', data: { id: p }, classe: `af-${f.affinite}${equipe[k] === p ? ' pris' : ''}`,
          badge: equipe.includes(p) && equipe[k] !== p ? `<span class="tb-marque">${tr`ailleurs`}</span>` : '',
          bas: `<span class="tb-eff">${tr`niv. ${f.niveau}`}</span><span class="tb-af">${NOM_AF[f.affinite]}</span>` })).join('')
        + autres.map((p) => tuilePorteur(p, { indispo: true, bas: `<small class="tb-raison">${echap(raisonHorsContrat(j, p)!)}</small>` })).join('')
        + `</div></li>`;
    }
  });
  h += `</ol>`;

  // le taux, en grand, et le départ
  const complet = equipe.every(Boolean);
  const taux = tauxContrat(j, c.def, equipe, c.indices);
  const occupe = !!m.contrat;
  const escouade = (j.escouade ?? []).filter((p) => equipe.includes(p));
  h += `<div class="mr-depart">`
    + `<div class="mr-taux" style="--t:${taux / 100}" role="img" aria-label="${tr`${taux} % de chances de réussir`}"><span class="mr-anneau"></span><b>${taux}<small>%</small></b><span>${tr`de chances`}</span></div>`
    + `<div class="mr-infos">`
    + (c.indices ? `<span class="mr-indice">${ICO.lueur}${tr`${c.indices} Indice${c.indices > 1 ? 's' : ''} · +${c.indices * CONTRAT.indice} %`}</span>` : '')
    + `<small>${ICO.chrono}${tr`${r.heures} h en mer · un échec rapporte ${Math.round(CONTRAT.partEchec * 100)} % du minerai, toute l’XP et un Indice (+${CONTRAT.indice} %)`}</small>`
    + (escouade.length ? `<small class="mr-alerte">${escouade.length > 1 ? tr`${enumerer(escouade.map((p) => echap(porteurDef(p).nom)))} ne pourront pas descendre avant le retour de la gabare.` : tr`${echap(porteurDef(escouade[0]!).nom)} ne pourra pas descendre avant le retour de la gabare.`}</small>` : '')
    + `<div class="mr-boutons"><button type="button" class="btn sec" data-action="maree-conseil">${tr`Meilleure équipe`}</button>`
    + `<button type="button" class="btn prim" data-action="maree-partir" data-id="${c.id}"${complet && !occupe ? '' : ' disabled'}>${tr`Embarquer`}</button></div>`
    + (occupe ? `<small class="aide">${tr`La gabare est en mer : un contrat à la fois.`}</small>` : !complet ? `<small class="aide">${tr`Il manque un Porteur libre : libères-en un d’un bâtiment.`}</small>` : '')
    + `</div></div></article>`;
  return h + `</section>`;
}

