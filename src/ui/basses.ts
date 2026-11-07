// Les Basses, à l'écluse (7 novembre 2026) : la feuille qui remplace les pompes du Générateur.
// En haut, le flanc de la digue en coupe et la ligne d'eau de la vraie marée (ambiance : rien ne dépend de l'heure) ;
// puis ce que la mer a laissé, l'expédition en cours, et les secteurs du flanc, du haut vers le bas, avec le batardeau.
// Le secteur à sec montre ses lieux : chaque famille qui attend, et le Porteur qu'on envoie la chercher.
// Le décor est provisoire (la coupe de la Tour) en attendant le panorama Midjourney du flanc de la digue.
// Les règles sont dans src/core/partie/basses.ts, le contenu dans src/core/digue.ts.

import { porteurDef } from '../core/donnees';
import { SECTEURS, etatMaree, type SecteurBasses } from '../core/digue';
import { familleDef } from '../core/familles';
import { BASSES, bassesDe, bassesOuvertes, energieBasses, famillesDesBasses, libresPourBasses, lieuFait, peutDresser, porteursPresents, raisonHorsContrat, raisonLieu, restantsSecteur, secteurOuvert, valeurDepot, type Jeu } from '../core/jeu';
import { decor } from './art';
import { NOM_LIGNEE, avatar, decompte, jaugeTemps, prix, type EcranDistrict } from './coquille';
import { ICO } from './icones';
import { echap, texteReplie } from './outils';

const majuscule = (t: string) => t.charAt(0).toUpperCase() + t.slice(1);
const heure = (t: number) => new Date(t).toLocaleTimeString('fr-BE', { hour: '2-digit', minute: '2-digit' });

/** Le flanc de la digue et sa ligne d'eau (la vraie marée) */
function flanc(now: number): string {
  const m = etatMaree(now);
  // la ligne d'eau monte de 35 % à 75 % de la hauteur de l'image
  const haut = Math.round(35 + 40 * m.niveau);
  const texte = `${m.montante ? 'Marée montante' : 'Marée descendante'} · coef. ${m.coef}`;
  return `<figure class="bs-flanc" style="--eau:${haut}%" aria-label="${texte}">`
    + `<img src="${decor('coupe')}" alt="" decoding="async" draggable="false">`
    + `<span class="bs-eau" aria-hidden="true"><i class="bs-ecume"></i></span>`
    + `<figcaption><b>${m.grande ? `${ICO.etoile}Grande marée` : m.montante ? 'La mer monte' : 'La mer descend'}</b>`
    + `<small>${texte} · basse à ${heure(m.prochaineBasse)}</small></figcaption></figure>`;
}

/** Ce que la mer a laissé */
function blocDepots(j: Jeu, now: number): string {
  const b = bassesDe(j);
  const v = valeurDepot(j, now);
  const prochaine = heure(etatMaree(now).prochaineBasse);
  return `<section class="fb-bloc bs-depots"><h3 class="titre-bloc">${ICO.coffre}Ce que la mer a laissé</h3>`
    + (b.depots
      ? `<button type="button" class="btn prim large" data-action="basses-depot">${ICO.composants}Ramasser${b.depots > 1 ? ` (${b.depots})` : ''} · +${v} composants</button>`
        + `<small class="fb-note">Chaque marée basse dépose quelque chose sur la grève, et ça t’attend : ${BASSES.depotsMax} dépôts au plus.</small>`
      : `<p class="fb-vide">La grève est vide. La prochaine marée basse, vers ${prochaine}, laissera quelque chose : rien ne presse, ça t’attendra.</p>`)
    + `</section>`;
}

/** Le Porteur parti dans les Basses */
function blocExpedition(j: Jeu, now: number): string {
  const x = bassesDe(j).expedition;
  if (!x) return '';
  const lieu = SECTEURS.flatMap((s) => s.lieux).find((l) => l.id === x.lieu)!;
  return `<section class="fb-bloc bs-expe">${avatar(x.porteur, 44)}<span><strong>${echap(porteurDef(x.porteur).nom)} est dans les Basses</strong>`
    + `<small>${echap(lieu.nom)} · ${decompte(x.fin, now, 'retour dans ')}</small><span class="jauge">${jaugeTemps(x.debut, x.fin, now)}</span></span></section>`;
}

/** Un secteur du flanc : son état, le batardeau, et ses lieux s'il est à sec */
function secteur(e: EcranDistrict, s: SecteurBasses): string {
  const j = e.j;
  const b = bassesDe(j);
  const ouvert = secteurOuvert(j, s);
  const sec = b.batardeau === s.id;
  const reste = restantsSecteur(j, s);
  const etat = !ouvert ? `${ICO.verrou}Strate −${s.strate}` : sec ? `${ICO.ok}À sec` : 'Sous l’eau';
  let h = `<li class="bs-secteur${sec ? ' sec' : ''}${ouvert ? '' : ' ferme'}"><header><span><strong>${echap(s.nom)}</strong>`
    + `<small>${ouvert ? `${s.lieux.length - reste} / ${s.lieux.length} familles ramenées` : 'Trop bas sur le flanc pour l’instant'}</small></span><em>${etat}</em></header>`;
  if (!ouvert) return h + `</li>`;
  h += texteReplie(s.ambiance, `bs-${s.id}`, 'bs-ambiance');
  if (!sec) {
    const { raison, cout } = peutDresser(j, s.id, e.now);
    if (reste) {
      h += `<button type="button" class="btn sec" data-action="basses-batardeau" data-id="${s.id}"${raison ? ' disabled' : ''}>${ICO.mur}Dresser le batardeau ici${cout ? prix('energie', cout, j.energie >= cout) : ' · gratuit'}</button>`
        + (raison ? `<small class="fb-note">${echap(raison)}</small>` : `<small class="fb-note">Le secteur à sec change une fois par semaine. Celui qu’on quitte se remplit, mais ses familles attendent.</small>`);
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
      h += `<li class="bs-lieu fait">${ICO.ok}<span><strong>${echap(l.nom)}</strong><small>${echap(majuscule(f.nom))} vivent au district</small></span></li>`;
      continue;
    }
    h += `<li class="bs-lieu${choisi ? ' ouvert' : ''}"><button type="button" class="bs-lieu-btn" data-action="basses-lieu" data-id="${l.id}" aria-expanded="${choisi}">`
      + `<b class="bs-silhouette" aria-hidden="true">?</b><span><strong>${echap(l.nom)}</strong><small>${enCours ? 'Un Porteur y est descendu' : 'Une famille attend ici'}</small></span>`
      + `${enCours ? ICO.chrono : `<em>${ICO.porteurs}Envoyer</em>`}</button>`;
    if (choisi && !enCours) h += choixPorteur(j, l.id);
    h += `</li>`;
  }
  return h + `</ul></li>`;
}

/** Les Porteurs qu'on peut envoyer chercher la famille d'un lieu */
function choixPorteur(j: Jeu, lieu: string): string {
  const raison = raisonLieu(j, lieu);
  if (raison) return `<p class="fb-note bs-raison">${echap(raison)}</p>`;
  const e = energieBasses(j);
  const assez = j.energie >= e;
  const libres = libresPourBasses(j);
  const autres = porteursPresents(j).filter((p) => raisonHorsContrat(j, p));
  const escouade = new Set(j.escouade ?? []);
  return `<div class="bs-choix"><p class="fb-note">${ICO.chrono}${BASSES.heures} h dans les Basses · ${prix('energie', e, assez)} pour les lampes et les cordes · de l’XP et quelques composants en plus de la famille.</p><ul>`
    + libres.map((p) => `<li><button type="button" class="mr-cand" data-action="basses-envoyer" data-id="${p}"${assez ? '' : ' disabled'}>${avatar(p, 32)}<span><b>${echap(porteurDef(p).nom)}</b><small>${NOM_LIGNEE[porteurDef(p).lignee]}${escouade.has(p) ? ' · dans ton escouade' : ''}</small></span><em>Envoyer</em></button></li>`).join('')
    + autres.map((p) => `<li><span class="mr-cand indispo">${avatar(p, 32)}<span><b>${echap(porteurDef(p).nom)}</b><small>${echap(raisonHorsContrat(j, p)!)}</small></span></span></li>`).join('')
    + `</ul></div>`;
}

/** La feuille de l'écluse */
export function feuilleBasses(e: EcranDistrict): string {
  if (!e.basses) return '';
  const j = e.j;
  const fermer = `<button type="button" class="btn-icone" data-action="basses" aria-label="Fermer">${ICO.fermer}</button>`;
  const tete = `<div class="voile-feuille" data-action="basses" aria-hidden="true"></div><section class="feuille bs-feuille" role="dialog" aria-modal="true" aria-labelledby="bs-titre"><span class="poignee" aria-hidden="true"></span>`
    + `<header class="feuille-tete"><div class="titres"><span class="surtitre">L’ÉCLUSE</span><h2 id="bs-titre">Les Basses</h2></div>${fermer}</header><div class="feuille-corps">`;
  if (!bassesOuvertes(j)) {
    return tete + flanc(e.now) + `<p class="fb-vide">L’écluse reste fermée tant que le gardien de la Strate −${BASSES.ouverture} tient le puits : personne ne laisse le district sans défense pour descendre le flanc de la digue.</p></div></section>`;
  }
  const { faites, total } = famillesDesBasses(j);
  return tete + flanc(e.now)
    + texteReplie('De l’autre côté de la digue, les quartiers d’avant dorment sous l’eau, et des familles y vivent encore, sur ce qui dépasse. Le batardeau garde un secteur à sec : tes Porteurs peuvent y descendre et les ramener. Plus bas sur le flanc, c’est plus ancien.', 'basses', 'res-resume')
    + blocDepots(j, e.now) + blocExpedition(j, e.now)
    + `<h3 class="titre-bloc">${ICO.strate}Le flanc de la digue<b class="mur-compte">${faites} / ${total}</b></h3>`
    + `<ol class="bs-secteurs">${SECTEURS.map((s) => secteur(e, s)).join('')}</ol>`
    + `</div></section>`;
}
