// L'onglet Porteurs (22 octobre 2026). Bryan voulait un endroit où voir tous ses Porteurs, pour les choisir
// en connaissance de cause, avec leurs effets. Une grille par lignée, et la fiche complète d'un Porteur :
// qui il est, son état (PV, niveau, Usure), sa Marque, ce que sa lignée lui donne, son poste et ses cartes.

import { BATIMENTS, GESTES_SPECIAUX, PORTEURS, moduleDef, porteurDef } from '../core/donnees';
import { ACCORD_OUVERT, DISTRICT, XP, bonusPv, deckEscouade, enExpedition, enMission, escouadeDe, escouadeVerrouillee, niveauPorteur, porteursNouveaux, porteursPresents, progresMarque, pvMaxCombat, pvNiveau, raisonHorsEscouade, soinParHeure, textePosteQuitte, usureMax, type Jeu } from '../core/jeu';
import { PRESENTATIONS, origineDe } from '../core/lore-porteurs';
import { FILS, etapesDe } from '../core/fils';
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
import { COULEUR } from './vue';
import { echap, virgule } from './outils';

const LIGNEES: Lignee[] = ['tech', 'bio', 'reso'];
/** pour accorder « Pourquoi il / elle est là » */
const IL = new Set(['doran', 'sasha', 'aurel', 'coursier', 'docker', 'guetteur']);
const fr = (x: number) => x.toLocaleString('fr-BE');

/** Où est le Porteur en ce moment */
function statut(j: Jeu, id: string): { texte: string; classe: string } {
  const d = j.porteurs[id]!;
  if (enMission(j, id)) return { texte: 'En mission', classe: 'parti' };
  if (enExpedition(j, id)) return { texte: 'En expédition', classe: 'parti' };
  if (d.poste === 'noyau') return { texte: 'À l’entraînement · Tour du Noyau', classe: 'travail' };
  if (d.poste) return { texte: `Au travail · ${BATIMENTS.find((b) => b.id === d.poste)!.nom}`, classe: 'travail' };
  return { texte: 'Disponible', classe: 'libre' };
}

/** Quand arrive un Porteur qui n'est pas encore là */
function arrivee(p: PorteurDef): string {
  if (p.arrivee?.forge) return `Arrive quand la Forge atteint le niveau ${p.arrivee.forge}.`;
  if (p.arrivee?.strate) return `Arrive quand la Strate −${p.arrivee.strate} est ouverte.`;
  if (p.arrivee?.accord) return `Arrive par un Accord ouvert : Clinique niveau ${ACCORD_OUVERT.clinique} et Confiance du district à ${ACCORD_OUVERT.confiance} ou plus.`;
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
  const rang = escouadeDe(j).indexOf(p.id);
  const st = statut(j, p.id);
  const pv = pvMaxCombat(j, p.id);
  const pvM = pvNiveau(j, p.id);
  const n = niveauPorteur(j, p.id);
  const img = portrait(p.id);
  const nc = d.modules.length;
  return `<button type="button" class="pt-tuile ${st.classe}" style="--c:${COULEUR[p.lignee]}" data-action="porteur" data-id="${p.id}" aria-label="${echap(p.nom)}, ${NOM_LIGNEE[p.lignee]}, niveau ${n.niveau}, ${echap(st.texte)}">`
    + `<span class="pt-portrait">${img ? `<img src="${img}" alt="" decoding="async" loading="lazy">` : avatar(p.id, 80)}`
    + `<span class="pt-etat ${st.classe}">${echap(st.texte)}</span>`
    + (rang >= 0 ? `<span class="pt-escouade" title="Dans ton escouade">${rang + 1}</span>` : '')
    + (j.vus.porteurs.includes(p.id) ? '' : `<span class="ruban-nouveau">Nouveau</span>`)
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

// « Mon escouade » (décision du 23 octobre 2026). Bryan : « Quand on ouvre l’écran Porteurs, on a tous les persos.
// Ce ne serait pas plus simple d’afficher d’abord une page Mon équipe avec les trois qui combattent ? »
// L'onglet s'ouvre donc sur l'escouade, ce qu'on consulte 90 % du temps ; on touche une place pour changer
// son Porteur (volet par le bas), et « Tous les Porteurs » ouvre la liste complète. Pendant une descente,
// l'escouade est verrouillée : on ne change de Porteurs qu'au district.
export function htmlPorteurs(e: EcranDistrict): string {
  let h = e.reserve ? listeTous(e) : monEscouade(e);
  if (e.place !== null && e.place !== undefined && !e.reserve) h += voletPlace(e, e.place);
  else if (e.deck) h += feuilleDeck(e);
  else h += feuillePorteur(e);
  return coquille(e, h, `ecran-porteurs pt${e.reserve ? '' : ' me'}`);
}

/** Une place de l'escouade, en grand : le portrait, ses chiffres, ses cartes, sa Marque, et « Changer » */
function placeEscouade(j: Jeu, id: string | undefined, i: number, verrou: string | null): string {
  if (!id) {
    return `<button type="button" class="me-place vide" data-action="escouade-place" data-index="${i}"${verrou ? ' disabled' : ''}>`
      + `<span class="me-silhouette" aria-hidden="true"></span><b>${i + 1}</b><small>${verrou ? 'Place libre' : 'Choisir un Porteur'}</small></button>`;
  }
  const p = porteurDef(id);
  const d = j.porteurs[id]!;
  const img = portrait(id);
  const n = niveauPorteur(j, id);
  const pv = pvMaxCombat(j, id);
  const pvM = pvNiveau(j, id) + bonusPv(j, id);
  const nc = d.modules.filter((k) => j.collection[k]).length;
  const m = progresMarque(j, id);
  // ce qui l'empêcherait de partir, ou ce qui le rend fragile
  const raison = raisonHorsEscouade(j, id);
  const alerte = raison && !j.expedition
    ? `<span class="me-alerte">${ICO.verrou}<span>${echap(raison.replace(/\.$/, ''))} : il ne pourra pas descendre.</span></span>`
    : textePosteQuitte(j, id) && !j.expedition ? `<span class="me-alerte">${ICO.ouvrier}<span>Au départ, ${echap(textePosteQuitte(j, id)!)}</span></span>`
    : d.usure >= usureMax(id) * 0.5 ? `<span class="me-alerte usure">${ICO.soin}<span>Usure élevée</span></span>` : '';
  return `<div class="me-place" style="--c:${COULEUR[p.lignee]}">`
    + `<button type="button" class="me-portrait" data-action="porteur" data-id="${id}" aria-label="Fiche de ${echap(p.nom)}">`
    + (img ? `<img src="${img}" alt="" decoding="async">` : avatar(id, 72))
    + `<span class="me-rang" aria-hidden="true">${i + 1}</span>`
    + `<span class="me-nom"><strong>${echap(p.nom)}</strong><small>${NOM_LIGNEE[p.lignee]}</small></span></button>`
    + `<span class="me-jauges" title="${pv} / ${pvM} PV${n.requis ? ` · ${n.xp} / ${n.requis} XP` : ''}">${jaugePv(pv, pvM, d.usure, usureMax(id))}${barreXp(j, id)}</span>`
    + `<span class="me-chiffres"><b class="or">Niv. ${n.niveau}</b><span><b>${pv}</b>/${pvM} PV</span></span>`
    + `<button type="button" class="me-cartes${nc ? '' : ' aucune'}${nc >= DISTRICT.cartesMax ? ' pleine' : ''}" data-action="deck" data-id="${id}"${enExpedition(j, id) ? ' disabled' : ''}>${ICO.cartes}<span>${nc} / ${DISTRICT.cartesMax} cartes</span></button>`
    // la Marque : acquise, son effet ; sinon ce qu'il faut accomplir pour la gagner, avec une jauge (24 octobre 2026 : « 10/30 » seul ne se comprenait pas)
    + (m ? `<button type="button" class="me-marque${m.acquise ? ' acquise' : ''}" data-action="porteur" data-id="${id}" title="${echap(m.texte)}">${m.acquise ? ICO.ok : ICO.cristal}<span>`
      + (m.acquise ? `<b>${echap(m.nom)}</b> ${echap(m.court)}`
        : `<small class="me-marque-sur">Marque à gagner</small><b>${echap(m.nom)}</b> : ${echap(m.court)}<i class="me-marque-jauge"><i style="width:${Math.min(100, (100 * m.n) / m.seuil)}%"></i></i><small>${fr(Math.min(m.n, m.seuil))} / ${fr(m.seuil)} ${echap(m.quoi)}</small>`)
      + `</span></button>` : '')
    + alerte
    + (verrou ? '' : `<button type="button" class="me-changer" data-action="escouade-place" data-index="${i}" aria-label="Changer ${echap(p.nom)} de l’escouade">${ICO.recycler}<span>Changer</span></button>`)
    + `</div>`;
}

function monEscouade(e: EcranDistrict): string {
  const j = e.j;
  const esc = escouadeDe(j);
  const verrou = escouadeVerrouillee(j);
  const presents = porteursPresents(j);
  let h = entete(`MON ESCOUADE · <span class="pt-dispo">${esc.length} / 3</span>`, 'Porteurs');
  h += `<p class="pt-intro">Les trois qui descendent sous la Tour. Leurs cartes forment ton deck de combat ; touche un portrait pour sa fiche.</p>`;
  if (verrou) h += `<p class="me-verrou">${ICO.verrou}<span><strong>En descente</strong>${echap(verrou.replace(/^L’escouade est en descente : /, 'L’escouade '))}</span></p>`;
  h += `<section class="me-trio" aria-label="Mon escouade">${[0, 1, 2].map((i) => placeEscouade(j, esc[i], i, verrou)).join('')}</section>`;

  // le deck qu'elle emporte
  if (esc.length) {
    const deck = deckEscouade(j, esc).length;
    const manque = Math.max(0, DISTRICT.deckMin - deck);
    h += `<p class="me-deck${manque ? ' maigre' : ''}">${ICO.cartes}<span><strong>Le deck · ${deck} cartes</strong>`
      + (manque ? `Il en manque ${manque} pour descendre (${DISTRICT.deckMin} au moins) : touche « cartes » sous un Porteur pour lui en confier.`
        : `Les cartes des trois Porteurs, plus les ${GESTES_SPECIAUX.length} cartes du district.`)
      + `</span></p>`;
  }

  // la liste complète, à part
  const autres = presents.filter((id) => !esc.includes(id));
  const libres = autres.filter((id) => !raisonHorsEscouade(j, id)).length;
  const neufs = porteursNouveaux(j).length;
  h += `<button type="button" class="me-tous" data-action="porteurs-tous">${ICO.porteurs}<span><strong>Tous les Porteurs · ${presents.length}${neufs ? `<span class="pastille-n" aria-label="${neufs} nouveau${neufs > 1 ? 'x' : ''}">${neufs} nouveau${neufs > 1 ? 'x' : ''}</span>` : ''}</strong>`
    + `<small>${autres.length ? `${autres.length} hors de l’escouade${libres ? `, dont ${libres} disponible${libres > 1 ? 's' : ''}` : ''}` : 'Toute ta troupe est dans l’escouade'} · leur histoire, leurs Marques, les arrivées à venir</small></span>${ICO.retour}</button>`;
  return h;
}

/** Le volet « Choisir un Porteur » pour une place de l'escouade */
function voletPlace(e: EcranDistrict, place: number): string {
  const j = e.j;
  const esc = escouadeDe(j);
  const actuel = esc[place];
  const candidats = PORTEURS.filter((p) => porteursPresents(j).includes(p.id) && !esc.includes(p.id));
  // d'abord ceux qui peuvent venir, puis les autres
  candidats.sort((a, b) => Number(!!raisonHorsEscouade(j, a.id)) - Number(!!raisonHorsEscouade(j, b.id)));
  const ligne = (p: PorteurDef) => {
    const d = j.porteurs[p.id]!;
    const raison = raisonHorsEscouade(j, p.id);
    const img = portrait(p.id);
    const pv = pvMaxCombat(j, p.id);
    const pvM = pvNiveau(j, p.id) + bonusPv(j, p.id);
    const nc = d.modules.filter((k) => j.collection[k]).length;
    const m = progresMarque(j, p.id);
    return `<button type="button" class="me-choix${raison ? ' indispo' : ''}" style="--c:${COULEUR[p.lignee]}" data-action="escouade-mettre" data-id="${p.id}" data-index="${place}"${raison ? ' disabled' : ''}>`
      + `<span class="me-vignette">${img ? `<img src="${img}" alt="" decoding="async" loading="lazy">` : avatar(p.id, 56)}</span>`
      + `<span class="me-choix-txt"><strong>${echap(p.nom)}${j.vus.porteurs.includes(p.id) ? '' : ' <span class="pastille-n">Nouveau</span>'}</strong><small class="me-lignee">${NOM_LIGNEE[p.lignee]} · Niv. ${niveauPorteur(j, p.id).niveau}</small>`
      + (raison ? `<small class="me-raison">${echap(raison.replace(/\.$/, ''))}</small>`
        : (d.poste ? `<small class="me-raison">${d.poste === 'noyau' ? 'À l’entraînement' : 'Au travail'} · son poste restera vacant</small>` : '') + `<small class="me-stats">${pv}/${pvM} PV · <span class="${nc ? '' : 'zero'}">${nc} carte${nc > 1 ? 's' : ''}</span></small>`
          + (m?.acquise ? `<small class="me-stats or">${ICO.ok}${echap(m.nom)}</small>` : ''))
      + `</span>${raison ? '' : `<span class="me-prendre">Prendre</span>`}</button>`;
  };
  let h = `<div class="voile-feuille" data-action="escouade-fermer" aria-hidden="true"></div>`
    + `<section class="feuille me-volet" role="dialog" aria-modal="true" aria-labelledby="volet-titre"><span class="poignee" aria-hidden="true"></span>`
    + `<header class="feuille-tete"><div class="titres"><span class="surtitre">Place ${place + 1} de l’escouade</span><h2 id="volet-titre">${actuel ? `Remplacer ${echap(porteurDef(actuel).nom)}` : 'Choisir un Porteur'}</h2></div>`
    + `<button type="button" class="btn-icone" data-action="escouade-fermer" aria-label="Fermer">${ICO.fermer}</button></header>`
    + `<div class="feuille-corps">`;
  h += candidats.length
    ? `<div class="me-choix-liste">${candidats.map(ligne).join('')}</div><p class="me-aide">Le Porteur choisi apporte ses cartes au deck. ${actuel ? `${echap(porteurDef(actuel).nom)} reste au district, avec les siennes.` : ''}</p>`
    : `<p class="me-aide">Tous tes Porteurs sont déjà dans l’escouade. D’autres arriveront en descendant les Strates et en agrandissant la Forge.</p>`;
  return h + `</div></section>`;
}

/** La liste de tous les Porteurs, par lignée (l'ancien écran Porteurs, revue du 22 octobre 2026) */
function listeTous(e: EcranDistrict): string {
  const j = e.j;
  const presents = porteursPresents(j);
  const libres = presents.filter((id) => statut(j, id).classe === 'libre').length;
  let h = entete(`${presents.length} PORTEUR${presents.length > 1 ? 'S' : ''} · <span class="pt-dispo">${libres} DISPONIBLE${libres > 1 ? 'S' : ''}</span>`, 'Tous les Porteurs',
    `<button type="button" class="btn-icone" data-action="porteurs-escouade" aria-label="Retour à mon escouade">${ICO.retour}</button>`);
  h += `<p class="pt-intro">Une Augmentée, un Géné, une Résonante : depuis un siècle, les trois lignées se méfient les unes des autres. Sous la Tour, elles descendent ensemble, chacune avec ce que les deux autres n’ont pas. Touche un portrait pour savoir pourquoi chacun est là.</p>`;
  for (const l of LIGNEES) {
    const ici = PORTEURS.filter((p) => p.lignee === l);
    const la = ici.filter((p) => presents.includes(p.id));
    const avenir = ici.filter((p) => !presents.includes(p.id));
    h += `<section class="pt-lignee"><h2 class="titre-section" style="--c:${COULEUR[l]}">${NOM_LIGNEES[l]}</h2>`
      + (la.length ? `<div class="pt-grille">${la.map((p) => tuile(j, p)).join('')}</div>` : '')
      + avenir.map(silhouette).join('') + `</section>`;
  }
  return h;
}

// La fiche d'un Porteur (revue du 22 octobre 2026, même équipe que la feuille de bâtiment et l'Escouade).
// Le portrait peint en grand en tête, comme l'îlot de la feuille de bâtiment ; puis, dans l'ordre où l'on décide :
// son état en vrais chiffres (PV, Usure, niveau, XP), ses cartes (touchables, avec la feuille de deck en pied),
// sa Marque et comment la gagner, sa lignée (qui il bat, qui le bat), et son poste au district.
// Pas de cartouches : des filets qui se fondent ; glace pour ce qui se touche, or pour la valeur et la progression.
/** les cartes d'une lignée (au féminin) */
const CARTES_DE: Record<Lignee, string> = { tech: 'augmentées', bio: 'génées', reso: 'résonantes' };

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

  // ---------- son histoire : d'où vient son don, un palier de plus tous les quelques niveaux ----------
  const histoire = origineDe(id, n.niveau);
  if (histoire.length) {
    h += `<section class="fp-bloc fp-histoire"><h3 class="fp-h3">${ICO.journal}Son histoire <span class="fp-compte">${histoire.filter((x) => x.ouvert).length} / ${histoire.length}</span></h3><ol class="fp-paliers">`
      + histoire.map((x) => (x.ouvert
        ? `<li class="ouvert"><strong>${echap(x.titre)}</strong><p>${echap(x.texte)}</p></li>`
        : `<li class="ferme"><strong>${ICO.verrou}Au niveau ${x.niveau}</strong><p>${echap(p.nom)} n’en parle pas encore.</p></li>`)).join('')
      + `</ol></section>`;
  }

  // ---------- son fil : une petite histoire qui avance toute seule (23 octobre 2026) ----------
  const fil = FILS[id];
  if (fil) {
    const faites = j.fils?.[id] ?? 0;
    const etapes = etapesDe(id, faites);
    const suivante = etapes.find((x) => !x.faite);
    h += `<section class="fp-bloc fp-fil"><h3 class="fp-h3">${ICO.porte}${echap(fil.titre)} <span class="fp-compte${suivante ? '' : ' plein'}">${faites} / ${etapes.length}</span></h3><ol class="fp-paliers">`
      + etapes.filter((x) => x.faite).map((x) => `<li class="ouvert"><strong>${echap(x.titre)}</strong><p>${echap(x.recit)}</p></li>`).join('')
      + (suivante ? `<li class="ferme"><strong>${ICO.verrou}La suite</strong><p>${echap(suivante.quand)}.</p></li>` : '')
      + `</ol></section>`;
  }

  // ---------- son état, en vrais chiffres ----------
  const soin = soinParHeure(j);
  const noteUsure = usure < 1
    ? `Aucune Usure : tous ses PV en combat.`
    : `Usure <b class="rouge">${usure}</b> / ${uMax} : −${usure} PV en combat. `
      + (parti ? 'Elle se soignera à son retour.' : soin > 0 ? `La Clinique en soigne ${virgule(soin)} par heure : effacée dans ${Math.max(1, Math.ceil(d.usure / soin))} h environ.` : 'La Clinique la soignera.');
  const pvSuivant = Math.round(p.pvMax * (1 + XP.pvParNiveau * n.niveau)) + bonusPv(j, id);
  const noteXp = n.requis
    ? `Encore <b>${fr(n.requis - n.xp)} XP</b> pour le niveau ${n.niveau + 1} : <b class="or">${pvSuivant} PV</b> au lieu de ${pvM}. XP gagnée en combat (plus en profondeur, et davantage contre les salles scellées et les gardiens), en mission et à l’entraînement à la Tour du Noyau.`
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
          + `<p class="fp-note"><b>Comment la gagner :</b> ${m.fait === 'missions' ? `envoie ${echap(p.nom)} en mission depuis la Tour` : `emmène ${echap(p.nom)} dans l’escouade`}. Encore <b class="or">${fr(m.seuil - fait)} ${echap(m.quoi)}</b> et elle lui est acquise pour toujours.</p>`)
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
    + `<p class="fp-note">${ateliers.length ? `Ailleurs : ×${virgule(DISTRICT.bonusPoste)}.` : `Aucun bâtiment n’est fait pour sa lignée : ×${virgule(DISTRICT.bonusPoste)} partout.`} Pour le poster, touche un bâtiment au District. S’il descend, il quitte son poste, qui reste vacant.</p>`
    + `</section>`;

  // ---------- pied : la prochaine action ----------
  h += `</div><footer class="feuille-pied fp-pied"><button type="button" class="btn large fp-deck" data-action="deck" data-id="${id}"${parti ? ' disabled' : ''}>${ICO.cartes}${parti ? 'Ses cartes changeront à son retour' : places ? `Lui confier des cartes · ${cartes.length} / ${DISTRICT.cartesMax}` : 'Changer ses cartes'}</button></footer>`;
  return h + `</section>`;
}
