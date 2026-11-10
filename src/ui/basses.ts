// Les Basses, à l'écluse (7 novembre 2026) : la feuille qui remplace les pompes du Générateur.
// En haut, le flanc de la digue en coupe et la ligne d'eau de la vraie marée (ambiance : rien ne dépend de l'heure) ;
// puis ce que la mer a laissé, l'expédition en cours, et les secteurs du flanc, du haut vers le bas, avec le batardeau.
// Le secteur à sec montre ses lieux : chaque famille qui attend, et le Porteur qu'on envoie la chercher.
// Le flanc est peint d'un seul tenant (Midjourney, 7 novembre 2026) ; chaque secteur y a son repère, à sa hauteur.
// Les règles sont dans src/core/partie/basses.ts, le contenu dans src/core/digue.ts.

import { porteurDef } from '../core/donnees';
import { SECTEURS, etatMaree, type SecteurBasses } from '../core/digue';
import { familleDef } from '../core/familles';
import { BASSES, eclatsDepot, bassesDe, bassesOuvertes, famillesDesBasses, libresPourBasses, lieuFait, peutDresser, porteursPresents, raisonHorsContrat, raisonLieu, restantsSecteur, secteurOuvert, valeurDepot, type Jeu } from '../core/jeu';
import { flancBasses } from './art';
import { NOM_LIGNEE, avatar, decompte, jaugeTemps, prix, type EcranDistrict } from './coquille';
import { ICO } from './icones';
import { echap, texteReplie } from './outils';
import { bloc, cle, etape, replie } from './presentation';
import { t as tr, locale } from '../core/i18n';

const majuscule = (t: string) => t.charAt(0).toUpperCase() + t.slice(1);
const heure = (t: number) => new Date(t).toLocaleTimeString(locale(), { hour: '2-digit', minute: '2-digit' });

/** La hauteur de chaque secteur sur le tableau du flanc (en % du haut), relevée sur l'image */
const HAUTEUR: Record<string, number> = { lavoirs: 8, treuils: 30, ecole: 50, citernes: 69, palier: 84 };

/** Le flanc de la digue : le tableau, la ligne d'eau de la vraie marée, et un repère par secteur */
function flanc(e: EcranDistrict): string {
  const j = e.j;
  const m = etatMaree(e.now);
  // la ligne d'eau monte de 4 % (marée basse : le bas de l'escalier) à 34 % de la hauteur (marée haute : le Palier est noyé)
  const haut = Math.round(4 + 30 * m.niveau);
  const texte = tr`${m.montante ? tr('Marée montante') : tr('Marée descendante')} · coef. ${m.coef}`;
  const b = bassesOuvertes(j) ? bassesDe(j) : null;
  const reperes = SECTEURS.map((s) => {
    const ouvert = !!b && secteurOuvert(j, s);
    const sec = b?.batardeau === s.id;
    const etat = !ouvert ? tr`${ICO.verrou}−${s.strate} vaincue` : sec ? tr`${ICO.ok}À sec` : `${s.lieux.length - restantsSecteur(j, s)}/${s.lieux.length}`;
    return `<button type="button" class="bs-repere${sec ? ' sec' : ''}${ouvert ? '' : ' ferme'}" style="top:${HAUTEUR[s.id]}%" data-action="basses-voir" data-id="${s.id}" aria-label="${echap(s.nom)}${sec ? tr(', à sec') : ouvert ? '' : tr`, il faut avoir vaincu la Strate −${s.strate}`}">`
      + `<b>${echap(s.nom)}</b><em>${etat}</em></button>`;
  }).join('');
  return `<figure class="bs-flanc" style="--eau:${haut}%" aria-label="${tr`Le flanc de la digue : ${texte}`}">`
    + `<img src="${flancBasses}" alt="" decoding="async" draggable="false">`
    + `<span class="bs-eau" aria-hidden="true"><i class="bs-ecume"></i></span>${reperes}`
    + `<figcaption><b>${m.grande ? tr`${ICO.etoile}Grande marée` : m.montante ? tr('La mer monte') : tr('La mer descend')}</b>`
    + `<small>${tr`${texte} · basse à ${heure(m.prochaineBasse)}`}</small></figcaption></figure>`;
}

/** Ce que la mer a laissé */
function blocDepots(j: Jeu, now: number): string {
  const b = bassesDe(j);
  const v = valeurDepot(j, now);
  const prochaine = heure(etatMaree(now).prochaineBasse);
  return `<section class="fb-bloc bs-depots"><h3 class="titre-bloc">${ICO.coffre}${tr`Ce que la mer a laissé`}</h3>`
    + (b.depots
      ? `<button type="button" class="btn prim large" data-action="basses-depot">${ICO.composants}${tr`Ramasser${b.depots > 1 ? ` (${b.depots})` : ''} · +${v} minerai${eclatsDepot(j, now) ? ` · +${eclatsDepot(j, now)} ${ICO.eclats}` : ''}`}</button>`
        + `<small class="fb-note">${tr`${eclatsDepot(j, now) ? tr('Depuis que tu as touché le Fond, l’eau d’en bas remonte jusqu’à la grève, chargée d’éclats de colonne. ') : ''}Chaque marée basse dépose quelque chose sur la grève, et ça t’attend : ${BASSES.depotsMax} dépôts au plus.`}</small>`
      : `<p class="fb-vide">${tr`La grève est vide. La prochaine marée basse, vers ${prochaine}, laissera quelque chose : rien ne presse, ça t’attendra.`}</p>`)
    + `</section>`;
}

/** Le Porteur parti dans les Basses */
function blocExpedition(j: Jeu, now: number): string {
  const x = bassesDe(j).expedition;
  if (!x) return '';
  const lieu = SECTEURS.flatMap((s) => s.lieux).find((l) => l.id === x.lieu)!;
  return `<section class="fb-bloc bs-expe">${avatar(x.porteur, 44)}<span><strong>${tr`${echap(porteurDef(x.porteur).nom)} est dans les Basses`}</strong>`
    + `<small>${echap(lieu.nom)} · ${decompte(x.fin, now, tr('retour dans '))}</small><span class="jauge">${jaugeTemps(x.debut, x.fin, now)}</span></span></section>`;
}

/** Un secteur du flanc : son état, le batardeau, et ses lieux s'il est à sec */
function secteur(e: EcranDistrict, s: SecteurBasses): string {
  const j = e.j;
  const b = bassesDe(j);
  const ouvert = secteurOuvert(j, s);
  const sec = b.batardeau === s.id;
  const reste = restantsSecteur(j, s);
  const etat = !ouvert ? tr`${ICO.verrou}Strate −${s.strate} à vaincre` : sec ? tr`${ICO.ok}À sec` : tr('Sous l’eau');
  let h = `<li class="bs-secteur${sec ? ' sec' : ''}${ouvert ? '' : ' ferme'}" id="bs-s-${s.id}"><header><span><strong>${echap(s.nom)}</strong>`
    + `<small>${ouvert ? tr`${s.lieux.length - reste} / ${s.lieux.length} familles ramenées` : tr('Trop bas sur le flanc pour l’instant')}</small></span><em>${etat}</em></header>`;
  if (!ouvert) return h + `</li>`;
  h += texteReplie(s.ambiance, `bs-${s.id}`, 'bs-ambiance');
  if (!sec) {
    const { raison, cout } = peutDresser(j, s.id, e.now);
    if (reste) {
      h += `<button type="button" class="btn sec" data-action="basses-batardeau" data-id="${s.id}"${raison ? ' disabled' : ''}>${ICO.mur}${tr`Dresser le batardeau ici${cout ? prix('energie', cout, j.energie >= cout) : ' · gratuit'}`}</button>`
        + (raison ? `<small class="fb-note">${echap(raison)}</small>` : `<small class="fb-note">${tr`Le secteur à sec change une fois par semaine. Celui qu’on quitte se remplit, mais ses familles attendent.`}</small>`);
    }
    return h + `</li>`;
  }
  h += `<ul class="bs-lieux">`;
  for (const l of s.lieux) {
    const f = familleDef(l.famille)!;
    const fait = lieuFait(j, l.id);
    const enCours = b.expedition?.lieu === l.id;
    const choisi = e.bassesLieu === l.id;
    if (fait) {
      h += `<li class="bs-lieu fait">${ICO.ok}<span><strong>${echap(l.nom)}</strong><small>${tr`${echap(majuscule(f.nom))} vivent au district`}</small></span></li>`;
      continue;
    }
    h += `<li class="bs-lieu${choisi ? ' ouvert' : ''}"><button type="button" class="bs-lieu-btn" data-action="basses-lieu" data-id="${l.id}" aria-expanded="${choisi}">`
      + `<b class="bs-silhouette" aria-hidden="true">?</b><span><strong>${echap(l.nom)}</strong><small>${enCours ? tr('Un Porteur y est descendu') : tr('Une famille attend ici')}</small></span>`
      + `${enCours ? ICO.chrono : `<em>${ICO.porteurs}${tr`Envoyer`}</em>`}</button>`;
    if (choisi && !enCours) h += choixPorteur(j, l.id);
    h += `</li>`;
  }
  return h + `</ul></li>`;
}

/** Les Porteurs qu'on peut envoyer chercher la famille d'un lieu */
function choixPorteur(j: Jeu, lieu: string): string {
  const raison = raisonLieu(j, lieu);
  if (raison) return `<p class="fb-note bs-raison">${echap(raison)}</p>`;
  const libres = libresPourBasses(j);
  const autres = porteursPresents(j).filter((p) => raisonHorsContrat(j, p));
  const escouade = new Set(j.escouade ?? []);
  return `<div class="bs-choix"><p class="fb-note">${ICO.chrono}${tr`${BASSES.heures} h dans les Basses · de l’XP et un peu de minerai en plus de la famille.`}</p><ul>`
    + libres.map((p) => `<li><button type="button" class="mr-cand" data-action="basses-envoyer" data-id="${p}">${avatar(p, 32)}<span><b>${echap(porteurDef(p).nom)}</b><small>${NOM_LIGNEE[porteurDef(p).lignee]}${escouade.has(p) ? tr(' · dans ton escouade') : ''}</small></span><em>${tr`Envoyer`}</em></button></li>`).join('')
    + autres.map((p) => `<li><span class="mr-cand indispo">${avatar(p, 32)}<span><b>${echap(porteurDef(p).nom)}</b><small>${echap(raisonHorsContrat(j, p)!)}</small></span></span></li>`).join('')
    + `</ul></div>`;
}

/**
 * La présentation des Basses (8 novembre 2026, audit : un paragraphe dans la feuille, ni fenêtre ni objectif) :
 * à la première ouverture de l'écluse, puis à la demande (« ? »). Une phrase et trois chiffres par bloc, le détail se déplie.
 */
function presentationBasses(j: Jeu, premiere: boolean, now: number): string {
  const { total } = famillesDesBasses(j);
  return `<div class="pl-pres bs-pres"><p class="pr-phrase">${tr`De l’autre côté de la digue, les quartiers d’avant dorment sous la mer. Des familles y vivent encore, sur ce qui dépasse : va les chercher.`}</p>`
    + bloc(ICO.mur, tr('Le batardeau'), tr('Il garde un secteur du flanc à sec. Un seul à la fois.'), [
      cle(ICO.strate, '5', tr('secteurs, du haut vers le bas')),
      cle(ICO.chrono, '1', tr('déplacement par semaine')),
      cle(ICO.descendre, `−${BASSES.ouverture} à −9`, tr('chaque secteur s’ouvre avec une Strate')),
    ])
    + bloc(ICO.porteurs, tr('Les familles'), tr('Un Porteur libre descend au secteur à sec et en ramène une.'), [
      cle(ICO.chrono, `${BASSES.heures} h`, tr('par expédition')),
      cle(ICO.ok, String(total), tr('familles à retrouver')),
    ])
    + bloc(ICO.coffre, tr('Ce que la mer laisse'), tr('Chaque marée basse dépose du minerai au pied de l’écluse.'), [
      cle(ICO.composants, `+${etatMaree(now).grande ? valeurDepot(j, now) / 2 : valeurDepot(j, now)}`, tr('par dépôt')),
      cle(ICO.coffre, String(BASSES.depotsMax), tr('dépôts attendent au plus')),
      cle(ICO.composants, '×2', tr('à grande marée')),
    ])
    + replie(tr('Pourquoi les ramener'), `<ul class="fl-pr-etapes">`
      + etape(ICO.mur, tr('Le Mur des empreintes'), tr('Chaque famille ramenée pose sa main au Mur du district. Elle te suit désormais.'))
      + etape(ICO.monter, tr('Les familles te suivent'), tr('Plus elles sont nombreuses, plus le district s’anime : de nouveaux étals au Comptoir, des souvenirs confiés, des bonus au fil des paliers.'))
      + etape(ICO.porteurs, tr('Le Porteur revient'), tr`Il gagne de l’XP et un peu d’Usure (${BASSES.usure}). Il ne peut pas être en bas en même temps.`)
      + `</ul>`, ICO.aide)
    + (premiere ? `<button type="button" class="btn prim large" data-action="basses-entrer">${ICO.descendre}${tr`Descendre le flanc`}</button>` : '') + `</div>`;
}

/** La feuille de l'écluse */
export function feuilleBasses(e: EcranDistrict): string {
  if (!e.basses) return '';
  const j = e.j;
  const fermer = `<button type="button" class="btn-icone" data-action="basses" aria-label="${tr`Fermer`}">${ICO.fermer}</button>`;
  const tete = `<div class="voile-feuille" data-action="basses" aria-hidden="true"></div><section class="feuille bs-feuille" role="dialog" aria-modal="true" aria-labelledby="bs-titre"><span class="poignee" aria-hidden="true"></span>`
    + `<header class="feuille-tete"><div class="titres"><span class="surtitre">${tr`L’ÉCLUSE`}</span><h2 id="bs-titre">${tr`Les Basses`}</h2></div>${fermer}</header><div class="feuille-corps">`;
  if (!bassesOuvertes(j)) {
    return tete + flanc(e) + `<p class="fb-vide">${tr`L’écluse reste fermée tant que le gardien de la Strate −${BASSES.ouverture} tient le puits : personne ne laisse le district sans défense pour descendre le flanc de la digue.`}</p></div></section>`;
  }
  if (!j.bassesVu || e.bassesAide) return tete + presentationBasses(j, !j.bassesVu, e.now)
    + (e.bassesAide && j.bassesVu ? `<button type="button" class="btn sec large" data-action="basses-aide">${ICO.retour}${tr`Retour à l’écluse`}</button>` : '') + `</div></section>`;
  const { faites, total } = famillesDesBasses(j);
  return tete
    + `<button type="button" class="lien bs-aide" data-action="basses-aide">${ICO.aide}${tr`Comment marchent les Basses`}</button>`
    + texteReplie(tr('De l’autre côté de la digue, les quartiers d’avant dorment sous l’eau, et des familles y vivent encore, sur ce qui dépasse. Le batardeau garde un secteur à sec : tes Porteurs peuvent y descendre et les ramener. Plus bas sur le flanc, c’est plus ancien.'), 'basses', 'res-resume')
    + blocDepots(j, e.now) + blocExpedition(j, e.now) + flanc(e)
    + `<h3 class="titre-bloc">${ICO.strate}${tr`Le flanc de la digue`}<b class="mur-compte">${faites} / ${total}</b></h3>`
    + `<ol class="bs-secteurs">${SECTEURS.map((s) => secteur(e, s)).join('')}</ol>`
    + `</div></section>`;
}
