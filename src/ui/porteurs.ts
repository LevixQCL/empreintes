// L'onglet Porteurs (22 octobre 2026). Bryan voulait un endroit où voir tous ses Porteurs, pour les choisir
// en connaissance de cause, avec leurs effets. Une grille par lignée, et la fiche complète d'un Porteur :
// qui il est, son état (PV, niveau, Usure), sa Marque, ce que sa lignée lui donne, son poste et ses cartes.

import { BATIMENTS, PORTEURS, moduleDef, porteurDef } from '../core/donnees';
import { DISTRICT, XP, bonusPv, enExpedition, enMission, niveauPorteur, porteursPresents, progresMarque, pvMaxCombat, pvNiveau, soinParHeure, usureMax, type Jeu } from '../core/jeu';
import { PRESENTATIONS } from '../core/lore-porteurs';
import { BATTU_PAR, REGLES } from '../core/regles';
import { NOMS_EFFET } from '../core/effets';
import { multNiveau } from '../core/collection';
import type { Lignee, PorteurDef } from '../core/types';
import { illustrationBatiment, portrait } from './art';
import { faceCarte } from './carte';
import { NOM_LIGNEE, NOM_LIGNEES, avatar, coquille, entete, type EcranDistrict } from './coquille';
import { barreXp, feuilleDeck, jaugePv } from './district';
import { effetsLignee, plageFrequences } from './guide';
import { ICO } from './icones';
import { COULEUR, echap } from './vue';
import './fiche-porteur.css';

const LIGNEES: Lignee[] = ['tech', 'bio', 'reso'];
/** pour accorder « Pourquoi il / elle est là » */
const IL = new Set(['doran', 'sasha', 'aurel', 'coursier', 'docker', 'guetteur']);
const fr = (x: number) => x.toLocaleString('fr-BE');

/** Où est le Porteur en ce moment */
function statut(j: Jeu, id: string): { texte: string; classe: string } {
  const d = j.porteurs[id]!;
  if (enMission(j, id)) return { texte: 'En mission', classe: 'parti' };
  if (enExpedition(j, id)) return { texte: 'En expédition', classe: 'parti' };
  if (d.poste) return { texte: `Au travail · ${BATIMENTS.find((b) => b.id === d.poste)!.nom}`, classe: 'travail' };
  return { texte: 'Disponible', classe: 'libre' };
}

/** Quand arrive un Porteur qui n'est pas encore là */
function arrivee(p: PorteurDef): string {
  if (p.arrivee?.forge) return `Arrive quand la Forge atteint le niveau ${p.arrivee.forge}.`;
  if (p.arrivee?.strate) return `Arrive quand la Strate −${p.arrivee.strate} est ouverte.`;
  return 'Arrive quand la chambre scellée est ouverte.';
}

/** La Marque, sans boîte : son nom, où on en est, un filet qui se remplit */
function marqueTuile(j: Jeu, id: string): string {
  const m = progresMarque(j, id);
  if (!m) return '';
  return m.acquise
    ? `<span class="pt-marque acquise">${ICO.ok}<span><b>${echap(m.nom)}</b> ${echap(m.court)}</span></span>`
    : `<span class="pt-marque"><span><b>${echap(m.nom)}</b> ${fr(Math.min(m.n, m.seuil))} / ${fr(m.seuil)} ${echap(m.quoi)}</span><i class="pt-marque-jauge"><i style="width:${Math.min(100, (100 * m.n) / m.seuil)}%"></i></i></span>`;
}

// Revue du 22 octobre 2026 (même équipe que la feuille de bâtiment et l'Escouade) :
// le portrait peint en grand au lieu d'un hexagone, des chiffres lisibles, plus de cartouches imbriqués.
function tuile(j: Jeu, p: PorteurDef): string {
  const d = j.porteurs[p.id]!;
  const st = statut(j, p.id);
  const pv = pvMaxCombat(j, p.id);
  const pvM = pvNiveau(j, p.id);
  const n = niveauPorteur(j, p.id);
  const img = portrait(p.id);
  const nc = d.modules.length;
  return `<button type="button" class="pt-tuile ${st.classe}" style="--c:${COULEUR[p.lignee]}" data-action="porteur" data-id="${p.id}" aria-label="${echap(p.nom)}, ${NOM_LIGNEE[p.lignee]}, niveau ${n.niveau}, ${echap(st.texte)}">`
    + `<span class="pt-portrait">${img ? `<img src="${img}" alt="" decoding="async" loading="lazy">` : avatar(p.id, 80)}`
    + `<span class="pt-etat ${st.classe}">${echap(st.texte)}</span>`
    + `<span class="pt-nom"><strong>${echap(p.nom)}</strong><small>${echap(PRESENTATIONS[p.id]?.titre ?? NOM_LIGNEE[p.lignee])}</small></span></span>`
    + `<span class="pt-chiffres"><b>Niv. ${n.niveau}</b><span>${pv}/${pvM} PV</span><span class="${nc >= DISTRICT.cartesMax ? 'plein' : nc ? '' : 'zero'}">${nc}/${DISTRICT.cartesMax} cartes</span></span>`
    + `<span class="pt-jauges" title="PV et expérience${n.requis ? ` (${n.xp} / ${n.requis} XP vers le niveau ${n.niveau + 1})` : ''}">${jaugePv(pv, pvM, d.usure, usureMax(p.id))}${barreXp(j, p.id)}</span>`
    + marqueTuile(j, p.id)
    + aFaire(j, p)
    + `</button>`;
}

/** Ce qui demande une action : des places libres alors que des cartes de sa lignée attendent, une Usure élevée */
function aFaire(j: Jeu, p: PorteurDef): string {
  const d = j.porteurs[p.id]!;
  const portees = new Set(Object.values(j.porteurs).flatMap((x) => x.modules));
  const libresLignee = Object.keys(j.collection).filter((k) => !portees.has(k) && moduleDef(k).lignee === p.lignee).length;
  const places = DISTRICT.cartesMax - d.modules.length;
  const bouts: string[] = [];
  if (places > 0 && libresLignee > 0) bouts.push(`<span class="pt-afaire">${ICO.cartes}Peut porter ${Math.min(places, libresLignee)} carte${Math.min(places, libresLignee) > 1 ? 's' : ''} de plus</span>`);
  if (d.usure >= usureMax(p.id) * 0.5) bouts.push(`<span class="pt-afaire usure">${ICO.soin}Usure élevée : repos à la Clinique</span>`);
  return bouts.join('');
}

/** Un Porteur qui n'est pas encore là : une ligne, pas une tuile vide */
function silhouette(p: PorteurDef): string {
  return `<p class="pt-avenir" style="--c:${COULEUR[p.lignee]}"><span class="pt-ombre" aria-hidden="true">?</span><span><strong>Un Porteur ${NOM_LIGNEE[p.lignee].toLowerCase()} arrivera</strong> ${echap(arrivee(p).replace(/^Arrive /, '').replace(/\.$/, ''))}.</span></p>`;
}

export function htmlPorteurs(e: EcranDistrict): string {
  const j = e.j;
  const presents = porteursPresents(j);
  const libres = presents.filter((id) => statut(j, id).classe === 'libre').length;
  let h = entete(`${presents.length} PORTEUR${presents.length > 1 ? 'S' : ''} · <span class="pt-dispo">${libres} DISPONIBLE${libres > 1 ? 'S' : ''}</span>`, 'Porteurs');
  h += `<p class="pt-intro">Une Augmentée, un Géné, une Résonante : depuis un siècle, les trois lignées se méfient les unes des autres. Sous la Tour, elles descendent ensemble, chacune avec ce que les deux autres n’ont pas. Touche un portrait pour savoir pourquoi chacun est là.</p>`;
  for (const l of LIGNEES) {
    const ici = PORTEURS.filter((p) => p.lignee === l);
    const la = ici.filter((p) => presents.includes(p.id));
    const avenir = ici.filter((p) => !presents.includes(p.id));
    h += `<section class="pt-lignee"><h2 class="titre-section" style="--c:${COULEUR[l]}">${NOM_LIGNEES[l]}</h2>`
      + (la.length ? `<div class="pt-grille">${la.map((p) => tuile(j, p)).join('')}</div>` : '')
      + avenir.map(silhouette).join('') + `</section>`;
  }
  if (e.deck) h += feuilleDeck(e);
  else h += feuillePorteur(e);
  return coquille(e, h, 'ecran-porteurs pt');
}

// La fiche d'un Porteur (revue du 22 octobre 2026, même équipe que la feuille de bâtiment et l'Escouade).
// Le portrait peint en grand en tête, comme l'îlot de la feuille de bâtiment ; puis, dans l'ordre où l'on décide :
// son état en vrais chiffres (PV, Usure, niveau, XP), ses cartes (touchables, avec la feuille de deck en pied),
// sa Marque et comment la gagner, sa lignée (qui il bat, qui le bat), et son poste au district.
// Pas de cartouches : des filets qui se fondent ; glace pour ce qui se touche, or pour la valeur et la progression.
/** les cartes d'une lignée (au féminin) */
const CARTES_DE: Record<Lignee, string> = { tech: 'augmentées', bio: 'génées', reso: 'résonantes' };
const virgule = (n: number) => String(Math.round(n * 10) / 10).replace('.', ',');

/** Une figure de l'état : un gros chiffre, son unité, une jauge et une phrase qui dit quoi faire */
function figure(cls: string, nom: string, val: string, sur: string, jauge: string, note: string): string {
  return `<div class="fp-fig ${cls}"><div class="fp-fig-tete"><span class="fp-fig-nom">${nom}</span><b>${val}</b><small>${sur}</small></div>${jauge}<p>${note}</p></div>`;
}

/** La fiche complète d'un Porteur */
export function feuillePorteur(e: EcranDistrict): string {
  const j = e.j;
  const id = e.porteur;
  if (!id || !j.porteurs[id] || !porteursPresents(j).includes(id)) return '';
  const p = porteurDef(id);
  const d = j.porteurs[id]!;
  const pres = PRESENTATIONS[id];
  const n = niveauPorteur(j, id);
  const pv = pvMaxCombat(j, id);
  const pvM = pvNiveau(j, id) + bonusPv(j, id);
  const usure = Math.floor(d.usure);
  const uMax = usureMax(id);
  const st = statut(j, id);
  const img = portrait(id);
  const parti = enExpedition(j, id);
  const c = COULEUR[p.lignee];

  // ---------- en-tête « héros » : le portrait peint en grand ----------
  let h = `<div class="voile-feuille" data-action="porteur-fermer" aria-hidden="true"></div>`
    + `<section class="feuille fiche-porteur fp" role="dialog" aria-modal="true" aria-labelledby="fiche-titre" style="--c:${c}"><span class="poignee" aria-hidden="true"></span>`
    + `<button type="button" class="btn-icone fp-fermer" data-action="porteur-fermer" aria-label="Fermer">${ICO.fermer}</button>`
    + `<div class="feuille-corps fp-corps"><header class="fp-heros">`
    + (img ? `<img class="fp-peint" src="${img}" alt="" decoding="async">` : `<span class="fp-sans">${avatar(id, 120)}</span>`)
    + `<span class="fp-etat ${st.classe}">${echap(st.texte)}</span>`
    + `<div class="fp-titre"><span class="fp-sur">${NOM_LIGNEE[p.lignee]} · Niveau ${n.niveau}</span><h2 id="fiche-titre">${echap(p.nom)}</h2>`
    + (pres ? `<span class="fp-role">${echap(pres.titre)}</span>` : '') + `</div></header>`;

  if (pres) h += `<div class="fp-bio"><p>${echap(pres.texte)}</p>${pres.replique ? `<p class="fp-replique">« ${echap(pres.replique)} »</p>` : ''}</div>`;
  if (pres?.pourquoi) h += `<section class="fp-bloc fp-pourquoi"><h3 class="fp-h3">${ICO.porte}Pourquoi ${IL.has(id) ? 'il' : 'elle'} est là</h3><p class="fp-texte">${echap(pres.pourquoi)}</p></section>`;
  if (pres?.aParte) h += `<aside class="fp-aparte"><strong>${echap(pres.aParte.titre)}</strong><p>${echap(pres.aParte.texte)}</p></aside>`;

  // ---------- son état, en vrais chiffres ----------
  const soin = soinParHeure(j);
  const noteUsure = usure < 1
    ? `Aucune Usure : tous ses PV en combat.`
    : `Usure <b class="rouge">${usure}</b> / ${uMax} : −${usure} PV en combat. `
      + (parti ? 'Elle se soignera à son retour.' : soin > 0 ? `La Clinique en soigne ${virgule(soin)} par heure : effacée dans ${Math.max(1, Math.ceil(d.usure / soin))} h environ.` : 'La Clinique la soignera.');
  const pvSuivant = Math.round(p.pvMax * (1 + XP.pvParNiveau * n.niveau)) + bonusPv(j, id);
  const noteXp = n.requis
    ? `Encore <b>${fr(n.requis - n.xp)} XP</b> pour le niveau ${n.niveau + 1} : <b class="or">${pvSuivant} PV</b> au lieu de ${pvM}. XP gagnée en combat (${XP.combat} par victoire) et en mission.`
    : `Niveau maximum atteint.`;
  h += `<section class="fp-bloc"><h3 class="fp-h3">${ICO.soin}Son état</h3><div class="fp-figs">`
    + figure('pv', 'En combat', `${pv}`, `/ ${pvM} PV`, jaugePv(pv, pvM, d.usure, uMax), noteUsure)
    + figure('xp', `Niveau ${n.niveau}`, n.requis ? fr(n.xp) : '—', n.requis ? `/ ${fr(n.requis)} XP` : 'max', `<i class="fp-jauge"><i style="width:${n.requis ? Math.round((100 * n.xp) / n.requis) : 100}%"></i></i>`, noteXp)
    + `</div></section>`;

  // ---------- ses cartes : touchables, mènent à sa feuille de deck ----------
  const cartes = d.modules.filter((k) => j.collection[k]);
  const portees = new Set(Object.values(j.porteurs).flatMap((x) => x.modules));
  const enAttente = Object.keys(j.collection).filter((k) => !portees.has(k) && moduleDef(k).lignee === p.lignee).length;
  const places = DISTRICT.cartesMax - cartes.length;
  const dispo = parti ? '' : ` data-action="deck" data-id="${id}"`;
  h += `<section class="fp-bloc"><h3 class="fp-h3">${ICO.cartes}Ses cartes <span class="fp-compte${places ? '' : ' plein'}">${cartes.length} / ${DISTRICT.cartesMax}</span></h3>`
    + `<div class="fp-cartes">${cartes.map((k) => { const cc = j.collection[k]!; const m = moduleDef(k);
      return `<button type="button" class="fp-carte"${dispo}${parti ? ' disabled' : ''} aria-label="${echap(m.nom)}, niveau ${cc.niveau}. Changer ses cartes">${faceCarte(m, cc.niveau, multNiveau(k, cc.niveau))}</button>`; }).join('')}`
    + Array.from({ length: places }, () => `<button type="button" class="fp-place"${dispo}${parti ? ' disabled' : ''} aria-label="Place libre : lui confier une carte">${ICO.place}<span>Place libre</span></button>`).join('')
    + `</div>`
    + (parti ? `<p class="fp-note">${echap(p.nom)} est en route : ses cartes changeront à son retour.</p>`
      : places && enAttente ? `<p class="fp-note glace">${enAttente} carte${enAttente > 1 ? 's' : ''} ${enAttente > 1 ? CARTES_DE[p.lignee] : CARTES_DE[p.lignee].replace(/s$/, '')} libre${enAttente > 1 ? 's' : ''} dans ta collection : encore ${Math.min(places, enAttente)} place${Math.min(places, enAttente) > 1 ? 's' : ''} à remplir.</p>`
      : !cartes.length ? `<p class="fp-note rouge">Aucune carte : rien à jouer en combat.</p>`
      : `<p class="fp-note">Ces cartes entrent dans ton deck quand ${echap(p.nom)} descend.</p>`)
    + `</section>`;

  // ---------- sa Marque ----------
  const m = progresMarque(j, id);
  if (m) {
    const fait = Math.min(m.n, m.seuil);
    h += `<section class="fp-bloc fp-marque${m.acquise ? ' acquise' : ''}"><h3 class="fp-h3">${ICO.cristal}Sa Marque</h3>`
      + `<div class="fp-marque-tete"><strong>${echap(m.nom)}</strong>${m.acquise ? `<span class="fp-acquise">${ICO.ok}Acquise</span>` : `<span class="fp-marque-n"><b>${fr(fait)}</b> / ${fr(m.seuil)}</span>`}</div>`
      + `<p class="fp-marque-effet">${echap(m.texte)}</p>`
      + (m.acquise
        ? `<p class="fp-note or">Active dans chaque combat où ${echap(p.nom)} fait partie de l’escouade.</p>`
        : `<i class="fp-jauge"><i style="width:${Math.min(100, (100 * m.n) / m.seuil)}%"></i></i>`
          + `<p class="fp-note"><b>Comment la gagner :</b> emmène ${echap(p.nom)} dans l’escouade. Encore <b class="or">${fr(m.seuil - fait)} ${echap(m.quoi)}</b> et elle lui est acquise pour toujours.</p>`)
      + `</section>`;
  }

  // ---------- sa lignée : ce qu'elle lui donne, qui il bat, qui le bat ----------
  const bat = LIGNEES.find((l) => BATTU_PAR[l] === p.lignee)!;
  const craint = BATTU_PAR[p.lignee];
  const bonus = Math.round((REGLES.bonusLignee - 1) * 100);
  const effets = effetsLignee(p.lignee).map((t) => NOMS_EFFET[t]);
  h += `<section class="fp-bloc"><h3 class="fp-h3">${ICO.porteurs}Sa lignée · ${NOM_LIGNEE[p.lignee]}</h3>`
    + `<p class="fp-texte">${echap(p.nom)} porte les cartes <b style="color:color-mix(in srgb,${c} 55%,white)">${CARTES_DE[p.lignee]}</b> : Fréquences <b class="mono">${plageFrequences(p.lignee).replace(' à ', '</b> à <b class="mono">')}</b>${effets.length ? `, surtout ${effets.join(', ')}` : ''}.</p>`
    + `<div class="fp-duel">`
    + `<div class="fp-duel-l bat" style="--l:${COULEUR[bat]}"><span>Fort contre les</span><strong>${NOM_LIGNEES[bat]}</strong><b>+${bonus}<i>%</i></b><small>de dégâts pour ses cartes</small></div>`
    + `<div class="fp-duel-l craint" style="--l:${COULEUR[craint]}"><span>Faible contre les</span><strong>${NOM_LIGNEES[craint]}</strong><b>+${bonus}<i>%</i></b><small>de dégâts reçus</small></div>`
    + `</div></section>`;

  // ---------- au district : son poste ----------
  const ateliers = BATIMENTS.filter((b) => b.affinite === p.lignee);
  const poste = d.poste ? BATIMENTS.find((b) => b.id === d.poste)! : null;
  const liste = poste && !ateliers.some((b) => b.id === poste.id) ? [poste, ...ateliers] : ateliers;
  h += `<section class="fp-bloc"><h3 class="fp-h3">${ICO.ouvrier}Au district</h3>`
    + (liste.length ? `<ul class="fp-postes">${liste.map((b) => {
      const ici = poste?.id === b.id;
      const ideal = b.affinite === p.lignee;
      return `<li class="${ici ? 'ici' : ''}"><img src="${illustrationBatiment(b.id, j.batiments[b.id])}" alt="" decoding="async" loading="lazy"><span><strong>${echap(b.nom)}</strong><small>${ici ? 'Au travail ici' : ideal ? 'Lignée idéale' : 'Autre lignée'}</small></span><b class="${ideal ? 'or' : ''}">×${virgule(ideal ? DISTRICT.bonusAffinite : DISTRICT.bonusPoste)}</b></li>`;
    }).join('')}</ul>` : '')
    + `<p class="fp-note">${ateliers.length ? `Ailleurs : ×${virgule(DISTRICT.bonusPoste)}.` : `Aucun bâtiment n’est fait pour sa lignée : ×${virgule(DISTRICT.bonusPoste)} partout.`} Pour le poster, touche un bâtiment au District. Au travail, un Porteur peut quand même descendre.</p>`
    + `</section>`;

  // ---------- pied : la prochaine action ----------
  h += `</div><footer class="feuille-pied fp-pied"><button type="button" class="btn large fp-deck" data-action="deck" data-id="${id}"${parti ? ' disabled' : ''}>${ICO.cartes}${parti ? 'Ses cartes changeront à son retour' : places ? `Lui confier des cartes · ${cartes.length} / ${DISTRICT.cartesMax}` : 'Changer ses cartes'}</button></footer>`;
  return h + `</section>`;
}
