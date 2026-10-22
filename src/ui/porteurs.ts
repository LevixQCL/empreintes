// L'onglet Porteurs (22 octobre 2026). Bryan voulait un endroit où voir tous ses Porteurs, pour les choisir
// en connaissance de cause, avec leurs effets. Une grille par lignée, et la fiche complète d'un Porteur :
// qui il est, son état (PV, niveau, Usure), sa Marque, ce que sa lignée lui donne, son poste et ses cartes.

import { BATIMENTS, PORTEURS, moduleDef, porteurDef } from '../core/donnees';
import { DISTRICT, enExpedition, enMission, niveauPorteur, porteursPresents, progresMarque, pvMaxCombat, pvNiveau, usureMax, type Jeu } from '../core/jeu';
import { PRESENTATIONS } from '../core/lore-porteurs';
import { BATTU_PAR, REGLES } from '../core/regles';
import { NOMS_EFFET } from '../core/effets';
import { multNiveau } from '../core/collection';
import type { Lignee, PorteurDef } from '../core/types';
import { portrait } from './art';
import { faceCarte } from './carte';
import { NOM_LIGNEE, NOM_LIGNEES, avatar, coquille, entete, type EcranDistrict } from './coquille';
import { barreXp, feuilleDeck, jaugePv } from './district';
import { effetsLignee, plageFrequences } from './guide';
import { ICO } from './icones';
import { COULEUR, echap } from './vue';

const LIGNEES: Lignee[] = ['tech', 'bio', 'reso'];
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
  h += `<p class="pt-intro">Trois Porteurs descendent ensemble, avec leurs cartes et leur Marque. Touche un portrait pour tout savoir de lui.</p>`;
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
  const st = statut(j, id);
  const img = portrait(id);
  let h = `<div class="voile-feuille" data-action="porteur-fermer" aria-hidden="true"></div><section class="feuille fiche-porteur" role="dialog" aria-modal="true" aria-labelledby="fiche-titre" style="--c:${COULEUR[p.lignee]}"><span class="poignee" aria-hidden="true"></span>`
    + `<header class="feuille-tete"><div class="titres"><span class="surtitre" style="color:${COULEUR[p.lignee]}">${NOM_LIGNEE[p.lignee].toUpperCase()} · NIVEAU ${n.niveau}</span><h2 id="fiche-titre">${echap(p.nom)}</h2></div>`
    + `<button type="button" class="btn-icone" data-action="porteur-fermer" aria-label="Fermer">${ICO.fermer}</button></header><div class="feuille-corps">`;

  // qui il est
  h += `<div class="fp-haut">${img ? `<img class="fp-portrait" src="${img}" alt="" decoding="async">` : avatar(id, 96)}<div class="fp-qui">`
    + (pres ? `<strong>${echap(pres.titre)}</strong><p>${echap(pres.texte)}</p>` : '')
    + `</div></div>`
    + (pres?.replique ? `<blockquote class="lore-carte">« ${echap(pres.replique)} »</blockquote>` : '');

  // son état
  const usure = Math.floor(d.usure);
  h += `<div class="stats fp-stats">`
    + `<div class="stat">${ICO.soin}<b>${pv}</b><small>PV en combat</small></div>`
    + `<div class="stat">${ICO.monter}<b>Niv. ${n.niveau}</b><small>${n.requis ? `${n.xp} / ${n.requis} XP` : 'maximum'}</small></div>`
    + `<div class="stat">${ICO.chrono}<b>${usure}</b><small>Usure (max ${usureMax(id)})</small></div>`
    + `</div><p class="fp-statut ${st.classe}">${echap(st.texte)}</p>`;

  // sa Marque
  const m = progresMarque(j, id);
  if (m) {
    h += `<section class="bloc"><h3 class="titre-bloc">${ICO.cristal}Sa Marque</h3><div class="fp-marque${m.acquise ? ' acquise' : ''}">`
      + `<div class="fp-marque-tete"><b>${echap(m.nom)}</b><span>${m.acquise ? `${ICO.ok}Acquise` : `${Math.min(m.n, m.seuil)} / ${m.seuil}`}</span></div>`
      + `<p>${echap(m.texte)}</p>`
      + (m.acquise ? `<small>Active dans chaque combat où ${echap(p.nom)} fait partie de l’escouade.</small>`
        : `<i class="p-marque-jauge"><i style="width:${Math.min(100, (100 * m.n) / m.seuil)}%"></i></i><small>Elle se gagne avec ${m.seuil} ${echap(m.quoi)}, en emmenant ${echap(p.nom)}.</small>`)
      + `</div></section>`;
  }

  // ce que lui donne sa lignée
  const bat = (LIGNEES.find((l) => BATTU_PAR[l] === p.lignee))!;
  const craint = BATTU_PAR[p.lignee];
  const bonus = Math.round((REGLES.bonusLignee - 1) * 100);
  h += `<section class="bloc"><h3 class="titre-bloc">${ICO.cartes}Sa lignée : ${NOM_LIGNEE[p.lignee]}</h3><ul class="g-regles">`
    + `<li>Il porte les cartes <b>${NOM_LIGNEES[p.lignee].toLowerCase()}</b> : Fréquences <b>${plageFrequences(p.lignee)}</b>, surtout ${effetsLignee(p.lignee).map((t) => NOMS_EFFET[t]).join(', ')}.</li>`
    + `<li>Ses cartes font <b>+${bonus} %</b> contre les ennemis ${NOM_LIGNEES[bat].toLowerCase()}.</li>`
    + `<li>Les ennemis ${NOM_LIGNEES[craint].toLowerCase()} le frappent <b>${bonus} % plus fort</b>.</li>`
    + `</ul></section>`;

  // au district
  const ateliers = BATIMENTS.filter((b) => b.affinite === p.lignee).map((b) => b.nom);
  h += `<section class="bloc"><h3 class="titre-bloc">${ICO.ouvrier}Au district</h3><p class="aide">`
    + (ateliers.length
      ? `Il travaille le mieux à : <b>${ateliers.join(', ')}</b> (×${fr(DISTRICT.bonusAffinite)}, contre ×${fr(DISTRICT.bonusPoste)} ailleurs).`
      : `Aucun bâtiment n’est encore fait pour sa lignée : il travaille à ×${fr(DISTRICT.bonusPoste)} partout.`)
    + ` Au repos, la Clinique soigne son Usure, qui retire des PV en combat.</p></section>`;

  // ses cartes
  const cartes = d.modules.filter((k) => j.collection[k]);
  h += `<section class="bloc"><h3 class="titre-bloc">${ICO.greffe}Ses cartes · ${cartes.length} / ${DISTRICT.cartesMax}</h3>`
    + (cartes.length
      ? `<div class="fp-cartes">${cartes.map((k) => { const c = j.collection[k]!; return `<div class="fp-carte">${faceCarte(moduleDef(k), c.niveau, multNiveau(k, c.niveau))}</div>`; }).join('')}</div>`
      : `<p class="aide">Aucune carte : il ne peut rien jouer en combat.</p>`)
    + `<button type="button" class="btn sec large" data-action="deck" data-id="${id}"${enExpedition(j, id) ? ' disabled' : ''}>${ICO.cartes}Changer ses cartes</button></section>`;
  return h + `</div></section>`;
}
