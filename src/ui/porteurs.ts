// L'onglet Escouade (25 octobre 2026 ; Porteurs et Cartes réunis). Trois volets : l'escouade et son deck complet,
// tous les Porteurs (une grille par lignée, 22 octobre 2026), et la collection (htmlCartes dans district.ts).
// La fiche complète d'un Porteur : qui il est, son état (PV, niveau, Usure), sa Marque, sa lignée, son poste et ses cartes.

import { BATIMENTS, GESTES_SPECIAUX, ORIGINE_PAQUETAGE, PORTEURS, moduleDef, porteurDef } from '../core/donnees';
import { CHARGE, composantsNiveau, doublonsRequis } from '../core/collection';
import { ACCORD_OUVERT, DISTRICT, XP, bonusPv, chargeMax, chargePortee, deckEscouade, enExpedition, gestesDe, enMission, NB_ESCOUADES, escouadeActive, escouadeDe, escouadeDefense, PILLAGE, strateVaincue, escouadesDe, escouadeVerrouillee, niveauPorteur, porteursPresents, progresMarque, pvMaxCombat, pvNiveau, raisonHorsEscouade, soinParHeure, textePosteQuitte, usureMax, type Jeu } from '../core/jeu';
import { PRESENTATIONS, origineDe } from '../core/lore-porteurs';
import { FILS, etapesDe } from '../core/fils';
import { BATTU_PAR, REGLES, frequenceLibre, signeLibre } from '../core/regles';
import { NOMS_EFFET, effetsDe, nomsEffets, texteEffet } from '../core/effets';
import { multNiveau } from '../core/collection';
import type { GesteDef, Lignee, PorteurDef, TypeGeste } from '../core/types';
import { illustrationBatiment, illustrationModule, portrait } from './art';
import { COULEUR_RARETE, ICONES_ACTION, couleurFrequence, faceCarte } from './carte';
import { NOM_LIGNEE, NOM_LIGNEES, avatar, coquille, entete, voletsEscouade, type EcranDistrict } from './coquille';
import { barreXp, feuilleCarte, feuilleDeck, frequencesDe, jaugeCharge, jaugePv, plusLongueSuite } from './district';
import { effetsLignee, feuilleGuide, lienGuide, plageFrequences, trouveesDe } from './guide';
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
export function arrivee(p: PorteurDef): string {
  if (p.arrivee?.forge) return `Arrive quand la Forge atteint le niveau ${p.arrivee.forge}.`;
  if (p.arrivee?.strate) return `Arrive quand la Strate −${p.arrivee.strate} est ouverte.`;
  if (p.arrivee?.accord) return `Arrive par un Accord ouvert : Clinique niveau ${ACCORD_OUVERT.clinique} et Confiance du quartier au niveau ${ACCORD_OUVERT.confiance}.`;
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
  // le mode d'emploi prend la place des autres feuilles ; en le fermant, on retrouve celle d'où on venait
  if (e.guide) h += feuilleGuide(e.guide, trouveesDe(e.j.collection));
  else if (e.place !== null && e.place !== undefined && !e.reserve) h += voletPlace(e, e.place);
  else if (e.deck) h += feuilleDeck(e);
  else if (e.carte) h += feuilleCarte(e);
  else h += feuillePorteur(e);
  return coquille(e, h, `ecran-porteurs pt${e.reserve ? '' : ' me'}`);
}

// L'onglet Escouade (25 octobre 2026). Bryan : « Les écrans Porteurs et Cartes sont voués à être fusionnés. On voit nos
// Porteurs et vaguement leurs effets spéciaux, mal expliqués, et on ne voit même pas notre deck complet. »
// Une seule feuille de match, de haut en bas : ce que vaut le deck (Fréquences, actions, Marques), puis chaque Porteur
// avec sa Marque en toutes lettres et ses cartes en liste lisible (Fréquence, nom, effet, force), puis les cartes du district.
// Une carte se touche pour son détail ; « Gérer ses cartes » ouvre la feuille où l'on confie et reprend.
// Tout est construit pour une escouade donnée (`blocPorteur`, `bilanDeck`) : le jour où il y en aura deux ou trois,
// chacune aura sa feuille, sans rien réécrire.

const NOM_ACTION: Record<TypeGeste, string> = { atk: 'Attaque', bouclier: 'Protection', soin: 'Soin' };

/** La force, comme sur la carte : l'icône au trait de l'action (épée, écu, +) et le chiffre, dans une capsule de sa couleur */
const socle = (t: TypeGeste, v: number, classe: string) =>
  `<span class="${classe} ${t}" title="${NOM_ACTION[t]} ${v}">${ICONES_ACTION[t]}<b>${v}</b></span>`;

/** La Fréquence d'une carte en jeu : son chiffre (ou ses chiffres), ou ∗ pour un Accord */
function cristalFreq(g: GesteDef): string {
  if (frequenceLibre(g.effet)) return `<b class="eq-f" style="--fc:#5d5470" title="Fréquence libre">${signeLibre(g.effet)}</b>`;
  const fs = g.fs ?? [g.f];
  return `<b class="eq-f${fs.length > 1 ? ' multi' : ''}" style="--fc:${couleurFrequence(fs[0]!)}" title="Fréquence ${fs.join(' ou ')}">${fs.join('<i>/</i>')}</b>`;
}

/** Une carte du deck, sur une ligne : l'illustration et sa Fréquence, le nom, l'effet en clair, l'action et la force */
function ligneCarte(j: Jeu, g: GesteDef, prete: (cle: string) => boolean): string {
  const cle = g.carte && j.collection[g.carte] ? g.carte : null;
  const m = cle ? moduleDef(cle) : null;
  const c = cle ? j.collection[cle]! : null;
  // le paquetage du district n'est pas dans la collection : son illustration vient de son identifiant
  const origine = g.porteur === null ? ORIGINE_PAQUETAGE[g.id] : undefined;
  const img = cle ? illustrationModule(cle) : origine ? illustrationModule(g.id) : null;
  const effet = g.effet
    ? effetsDe(g).map((x) => `<span class="eq-effet"><b>${echap(NOMS_EFFET[x.type])}</b> ${echap(texteEffet(x))}</span>`).join('')
    : '';
  const corps = `<span class="eq-vignette" style="--m:${m ? COULEUR_RARETE[m.rarete] : 'rgba(205,239,255,.3)'}">`
    + (img ? `<img src="${img}" alt="" decoding="async" loading="lazy">` : `<span class="eq-sans">${g.porteur ? ICO.cartes : ICO.district}</span>`)
    + cristalFreq(g) + `</span>`
    + `<span class="eq-txt"><strong>${echap(g.nom)}${c ? `<small>Niv. ${c.niveau}</small>` : ''}${g.lourd ? '<small class="eq-lourd">2 places</small>' : ''}${origine ? `<small class="eq-origine">${echap(origine.batiment)}</small>` : ''}${cle && prete(cle) ? `<small class="eq-monte">${ICO.monter}Peut monter</small>` : ''}</strong>${effet}</span>`
    + socle(g.type, g.v, 'eq-force')
    + (cle && !j.vus.cartes.includes(cle) ? `<span class="eq-neuve">Nouvelle</span>` : '');
  return cle
    ? `<li><button type="button" class="eq-carte" data-action="carte" data-id="${cle}" aria-label="${echap(g.nom)}, ${NOM_ACTION[g.type]} ${g.v}${g.effet ? `, ${nomsEffets(g)}` : ''}. Voir la carte">${corps}</button></li>`
    : `<li><div class="eq-carte fixe">${corps}</div></li>`;
}

/** Ce que vaut le deck de l'escouade : sa taille, ses Fréquences (par lignée), ses actions */
function bilanDeck(j: Jeu, esc: string[]): string {
  const cartes = deckEscouade(j, esc);
  const n = cartes.length;
  const manque = Math.max(0, DISTRICT.deckMin - n);
  const freqs = frequencesDe(cartes);
  const jokers = cartes.filter((g) => g.effet?.type === 'accord').length;
  const suite = plusLongueSuite(freqs, jokers);
  const max = Math.max(1, ...freqs);
  // chaque colonne empile les cartes de chaque lignée (les cartes du district en neutre)
  const couleurDe = (g: GesteDef) => (g.porteur ? COULEUR[porteurDef(g.porteur).lignee] : 'var(--x-doux)');
  const colonnes = freqs.map((k, i) => {
    const ici = cartes.filter((g) => !frequenceLibre(g.effet) && (g.fs ?? [g.f]).includes(i + 1));
    return `<span class="eq-col${k ? '' : ' trou'}${suite.includes(i + 1) ? ' suite' : ''}">`
      + `<span class="eq-pile" style="--h:${(100 * k) / max}%">${ici.map((g) => `<i style="--c:${couleurDe(g)}"></i>`).join('')}</span>`
      + `<b style="--fc:${couleurFrequence(i + 1)}">${i + 1}</b><small>${k || '—'}</small></span>`;
  }).join('');
  const trous = freqs.map((k, i) => (k ? 0 : i + 1)).filter(Boolean);
  const actions = (['atk', 'bouclier', 'soin'] as TypeGeste[]).map((t) => {
    const k = cartes.filter((g) => g.type === t).length;
    return `<span class="eq-action ${t}${k ? '' : ' zero'}">${socle(t, k, 'eq-socle')}<small>${t === 'atk' ? 'attaque' : t === 'bouclier' ? 'protection' : 'soin'}${k > 1 ? 's' : ''}</small></span>`;
  }).join('');
  // une seule phrase de conseil, la plus utile
  const conseil = manque ? `<b class="rouge">Il manque ${manque} carte${manque > 1 ? 's' : ''}</b> pour descendre (${DISTRICT.deckMin} au moins) : confie-en à un Porteur plus bas.`
    : !cartes.some((g) => g.type === 'soin' && g.porteur) ? `<b class="rouge">Aucun soin</b> dans les cartes de tes Porteurs : seul le Stimulant du paquetage soigne.`
    : suite.length >= 2 ? `Ta plus longue suite va de <b>${suite[0]} à ${suite[suite.length - 1]}</b>${trous.length ? `. Rien en <b>${trous.join(', ')}</b> : ${trous.length > 1 ? 'ces chiffres coupent' : 'ce chiffre coupe'} tes Résonances` : ' : toute l’échelle est couverte'}${jokers ? ` · ${jokers} carte${jokers > 1 ? 's' : ''} ∗ comble${jokers > 1 ? 'nt' : ''} un trou` : ''}.`
    : 'Des Fréquences qui se suivent font des Résonances : ajoute des chiffres voisins.';
  return `<section class="eq-bilan" aria-label="Le deck de l’escouade">`
    + `<div class="eq-bilan-tete"><span class="eq-total${manque ? ' maigre' : ''}"><b>${n}</b><span>cartes<small>dans le deck</small></span></span>`
    + lienGuide('deck', 'Bien construire') + `</div>`
    + `<div class="eq-freqs" role="img" aria-label="Fréquences du deck : ${freqs.map((k, i) => `${i + 1} : ${k}`).join(', ')}">${colonnes}</div>`
    + `<p class="eq-conseil">${conseil}</p>`
    + `<div class="eq-actions">${actions}</div>`
    + `</section>`;
}

/** La Marque d'un Porteur, expliquée : ce qu'elle fait, active ou non, et comment la gagner */
function blocMarque(j: Jeu, id: string): string {
  const m = progresMarque(j, id);
  if (!m) return '';
  const p = porteurDef(id);
  // le texte de la Bible commence par une image (« Elle connaît tous les raccourcis : ») : on garde l'effet, en clair
  const effet = m.texte.includes(' : ') ? m.texte.slice(m.texte.indexOf(' : ') + 3) : m.texte;
  const fait = Math.min(m.n, m.seuil);
  return `<button type="button" class="eq-marque${m.acquise ? ' acquise' : ''}" data-action="porteur" data-id="${id}" aria-label="Marque ${echap(m.nom)} : ${echap(effet)} Voir la fiche de ${echap(p.nom)}">`
    + `<span class="eq-marque-ico" aria-hidden="true">${m.acquise ? ICO.ok : ICO.cristal}</span><span class="eq-marque-txt">`
    // allégé le 28 octobre 2026 : le nom et l'effet sur une ligne, la progression en chiffres ; le détail est sur la fiche
    + `<strong>${echap(m.nom)}${m.acquise ? '' : `<small class="eq-marque-compte">${fr(fait)} / ${fr(m.seuil)} ${echap(m.quoi)}</small>`}</strong>`
    + `<span class="eq-marque-effet">${echap(effet.replace(/^./, (x) => x.toUpperCase()))}</span>`
    + (m.acquise ? '' : `<i class="eq-jauge"><i style="width:${(100 * fait) / m.seuil}%"></i></i>`)
    + `</span></button>`;
}

/** Un Porteur de l'escouade : qui il est, sa Marque, puis ses cartes, une par ligne */
function blocPorteur(j: Jeu, id: string | undefined, i: number, verrou: string | null, prete: (cle: string) => boolean): string {
  if (!id) {
    return `<section class="eq-porteur vide"><button type="button" class="eq-choisir" data-action="escouade-place" data-index="${i}"${verrou ? ' disabled' : ''}>`
      + `<span class="eq-rang">${i + 1}</span>${ICO.porteurs}<span><strong>Place libre</strong><small>${verrou ? 'L’escouade est en descente' : 'Choisir un Porteur : il apporte ses cartes au deck'}</small></span></button></section>`;
  }
  const p = porteurDef(id);
  const d = j.porteurs[id]!;
  const img = portrait(id);
  const n = niveauPorteur(j, id);
  const pv = pvMaxCombat(j, id);
  const pvM = pvNiveau(j, id) + bonusPv(j, id);
  const gestes = gestesDe(j, id);
  const nc = d.modules.filter((k) => j.collection[k]).length;
  const places = DISTRICT.cartesMax - nc;
  const parti = enExpedition(j, id);
  const portees = new Set(Object.values(j.porteurs).flatMap((x) => x.modules));
  const attendent = Object.keys(j.collection).filter((k) => !portees.has(k) && moduleDef(k).lignee === p.lignee).length;
  const raison = raisonHorsEscouade(j, id);
  const trop = chargePortee(j, id) > chargeMax(j, id);
  const alerte = trop && !j.expedition
    ? `<p class="eq-alerte">${ICO.cristal}<span>Trop lourd : ${chargePortee(j, id)} de Charge sur ${chargeMax(j, id)}. Reprends-lui une carte pour qu’il descende.</span></p>`
    : raison && !j.expedition
    ? `<p class="eq-alerte">${ICO.verrou}<span>${echap(raison.replace(/\.$/, ''))} : ${IL.has(id) ? 'il' : 'elle'} ne pourra pas descendre.</span></p>`
    : textePosteQuitte(j, id) && !j.expedition ? `<p class="eq-alerte doux">${ICO.ouvrier}<span>Au départ, ${echap(textePosteQuitte(j, id)!)}</span></p>`
    : d.usure >= usureMax(id) * 0.5 ? `<p class="eq-alerte">${ICO.soin}<span>Usure élevée : −${Math.floor(d.usure)} PV en combat. La Clinique la soigne au district.</span></p>`
    // vide, la ligne garde sa place : sur PC, les trois colonnes restent alignées
    : '<p class="eq-alerte"></p>';
  const bat = LIGNEES.find((l) => BATTU_PAR[l] === p.lignee)!;
  return `<section class="eq-porteur" style="--c:${COULEUR[p.lignee]}" aria-label="${echap(p.nom)}">`
    + `<header class="eq-tete">`
    + `<button type="button" class="eq-portrait" data-action="porteur" data-id="${id}" aria-label="Fiche de ${echap(p.nom)}">${img ? `<img src="${img}" alt="" decoding="async">` : avatar(id, 64)}<span class="eq-rang" aria-hidden="true">${i + 1}</span></button>`
    + `<div class="eq-id"><button type="button" class="eq-nom" data-action="porteur" data-id="${id}"><strong>${echap(p.nom)}</strong><small>${NOM_LIGNEE[p.lignee]} · Niv. ${n.niveau}</small></button>`
    + `<span class="eq-pv">${jaugePv(pv, pvM, d.usure, usureMax(id))}<small><b>${pv}</b> / ${pvM} PV</small></span>`
    + `<small class="eq-fort" style="--l:${COULEUR[bat]}">Fort contre les <b>${NOM_LIGNEES[bat]}</b></small></div>`
    + (verrou ? '' : `<button type="button" class="eq-changer" data-action="escouade-place" data-index="${i}" aria-label="Changer ${echap(p.nom)}">${ICO.recycler}<span>Changer</span></button>`)
    + `</header>`
    + blocMarque(j, id) + alerte
    + `<div class="eq-cartes-tete"><h3>${ICO.cartes}Ses cartes <span class="${places ? '' : 'plein'}">${nc} / ${DISTRICT.cartesMax}</span></h3>`
    + `<button type="button" class="eq-gerer" data-action="deck" data-id="${id}"${parti ? ' disabled' : ''}>${ICO.greffe}<span>${parti ? 'À son retour' : 'Gérer ses cartes'}</span></button></div>`
    + jaugeCharge(chargePortee(j, id), chargeMax(j, id))
    + `<ul class="eq-cartes">${gestes.map((g) => ligneCarte(j, g, prete)).join('')}`
    + (places > 0 && !parti ? `<li><button type="button" class="eq-carte libre" data-action="deck" data-id="${id}"><span class="eq-vignette vide">${ICO.place}</span><span class="eq-txt"><strong>${places} place${places > 1 ? 's' : ''} libre${places > 1 ? 's' : ''} · piochée${places > 1 ? 's' : ''} vide${places > 1 ? 's' : ''}</strong>`
      + `<span class="eq-effet sans">${attendent ? `${attendent} carte${attendent > 1 ? 's' : ''} de sa lignée ${attendent > 1 ? 'attendent' : 'attend'} dans ta collection` : 'Aucune carte libre de sa lignée pour l’instant'}</span></span>${attendent ? `<span class="eq-ajout">${ICO.greffe}Confier</span>` : ''}</button></li>` : '')
    + `</ul></section>`;
}

/** L'escouade affichée dans l'onglet : celle choisie par le joueur, sinon celle qui descend */
export const escouadeVue = (e: EcranDistrict) => (e.vueEscouade !== undefined && e.vueEscouade >= 0 && e.vueEscouade < NB_ESCOUADES ? e.vueEscouade : escouadeActive(e.j));

/** Les trois escouades en onglets : leurs portraits, et celle qui descend marquée d'or */
function ongletsEscouades(j: Jeu, vue: number): string {
  const toutes = escouadesDe(j);
  const active = escouadeActive(j);
  const garde = strateVaincue(j) >= PILLAGE.strateMin ? escouadeDefense(j) : -1;
  return `<div class="eq-escouades" role="tablist" aria-label="Mes escouades">` + toutes.map((l, k) =>
    `<button type="button" role="tab" class="eq-esc${k === vue ? ' actif' : ''}${k === active ? ' descend' : ''}${l.length ? '' : ' vide'}" data-action="escouade-voir" data-index="${k}" aria-selected="${k === vue}">`
    + `<span class="eq-esc-nom">Escouade ${k + 1}</span>`
    + `<span class="eq-esc-visages">${[0, 1, 2].map((i) => (l[i] ? avatar(l[i]!, 26) : '<i class="eq-esc-place"></i>')).join('')}</span>`
    + `<small>${k === active ? `${ICO.descendre}Descend` : l.length ? `${l.length} / 3` : 'Vide'}${k === garde ? `<span class="eq-garde" title="Garde le port">${ICO.bouclier}</span>` : ''}</small></button>`).join('') + `</div>`;
}

function monEscouade(e: EcranDistrict): string {
  const j = e.j;
  const vue = escouadeVue(e);
  const active = escouadeActive(j);
  const esc = escouadesDe(j)[vue]!;
  const verrou = escouadeVerrouillee(j);
  const prete = (cle: string) => {
    const c = j.collection[cle]; const r = c ? doublonsRequis(moduleDef(cle).id, c.niveau) : null;
    return !!c && r !== null && c.doublons >= r && j.composants >= composantsNiveau(c.niveau + 1);
  };
  const deck = deckEscouade(j, esc).length;
  let h = entete(`ESCOUADE ${vue + 1} · ${esc.length} / 3 · <span class="pt-dispo">${deck} CARTES</span>`, 'Escouade');
  // venu du départ ou du Port : le chemin du retour, bien en vue
  if (e.retourModif) h += `<button type="button" class="eq-revenir" data-action="escouade-revenir">${ICO.retour}<span><strong>${e.retourModif === 'pillages' ? 'Revenir aux Pillages' : e.pillage ? 'Revenir au pillage' : 'Revenir au départ'}</strong>${e.retourModif === 'pillages' ? 'Ta garnison est prise en compte tout de suite.' : 'Avec l’escouade choisie ici.'}</span></button>`;
  h += voletsEscouade(e);
  h += ongletsEscouades(j, vue);
  if (verrou) h += `<p class="me-verrou">${ICO.verrou}<span><strong>En descente</strong>${echap(verrou.replace(/^L’escouade est en descente : /, 'L’escouade '))}</span></p>`;
  // celle qui descend, ou le bouton pour qu'elle descende
  // celle qui descend : l'onglet le dit déjà (« Descend »), rien de plus (allégé le 28 octobre 2026)
  else if (vue !== active && esc.length) h += `<button type="button" class="eq-descend bouton" data-action="escouade-active" data-index="${vue}">${ICO.descendre}<span><strong>Faire descendre l’escouade ${vue + 1}</strong>Elle partira à la place de l’escouade ${active + 1} à la prochaine descente.</span></button>`;
  else if (vue !== active) h += `<p class="eq-descend vide">${ICO.porteurs}<span><strong>Une équipe de réserve</strong>Compose-la pour un autre ennemi, une autre lignée ou une Épreuve : un Porteur n’est que dans une seule escouade, et ses cartes le suivent.</span></p>`;
  if (esc.length) h += bilanDeck(j, esc);
  h += `<div class="eq-trio">${[0, 1, 2].map((i) => blocPorteur(j, esc[i], i, verrou, prete)).join('')}</div>`;
  // le paquetage du district, toujours là
  h += `<section class="eq-district"><div class="eq-cartes-tete"><h3>${ICO.district}Paquetage du district <span>${GESTES_SPECIAUX.length}</span></h3><small>Fourni à chaque escouade qui descend : il reste même si un Porteur tombe</small></div>`
    + `<ul class="eq-cartes">${GESTES_SPECIAUX.map((g) => ligneCarte(j, g, prete)).join('')}</ul></section>`;
  return h;
}

/** Le volet « Choisir un Porteur » pour une place de l'escouade */
function voletPlace(e: EcranDistrict, place: number): string {
  const j = e.j;
  const vue = escouadeVue(e);
  const toutes = escouadesDe(j);
  const esc = toutes[vue]!;
  const actuel = esc[place];
  /** l'autre escouade d'un Porteur (-1 : aucune) */
  const ailleurs = (id: string) => toutes.findIndex((l, k) => k !== vue && l.includes(id));
  const candidats = PORTEURS.filter((p) => porteursPresents(j).includes(p.id) && !esc.includes(p.id));
  // d'abord ceux qui peuvent venir et ne sont dans aucune escouade, puis ceux d'une autre escouade, puis les autres
  const rang = (id: string) => (raisonHorsEscouade(j, id) ? 2 : ailleurs(id) >= 0 ? 1 : 0);
  candidats.sort((a, b) => rang(a.id) - rang(b.id));
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
        : (ailleurs(p.id) >= 0 ? `<small class="me-raison">Dans l’escouade ${ailleurs(p.id) + 1}${actuel ? ` : ${echap(porteurDef(actuel).nom)} y prendra sa place` : ' : il la quittera'}</small>` : '')
        + (d.poste ? `<small class="me-raison">${d.poste === 'noyau' ? 'À l’entraînement' : 'Au travail'} · son poste restera vacant</small>` : '') + `<small class="me-stats">${pv}/${pvM} PV · <span class="${nc ? '' : 'zero'}">${nc} carte${nc > 1 ? 's' : ''}</span></small>`
          + (m?.acquise ? `<small class="me-stats or">${ICO.ok}${echap(m.nom)}</small>` : ''))
      + `</span>${raison ? '' : `<span class="me-prendre">Prendre</span>`}</button>`;
  };
  let h = `<div class="voile-feuille" data-action="escouade-fermer" aria-hidden="true"></div>`
    + `<section class="feuille me-volet" role="dialog" aria-modal="true" aria-labelledby="volet-titre"><span class="poignee" aria-hidden="true"></span>`
    + `<header class="feuille-tete"><div class="titres"><span class="surtitre">Escouade ${vue + 1} · place ${place + 1}</span><h2 id="volet-titre">${actuel ? `Remplacer ${echap(porteurDef(actuel).nom)}` : 'Choisir un Porteur'}</h2></div>`
    + `<button type="button" class="btn-icone" data-action="escouade-fermer" aria-label="Fermer">${ICO.fermer}</button></header>`
    + `<div class="feuille-corps">`;
  h += candidats.length
    ? `<div class="me-choix-liste">${candidats.map(ligne).join('')}</div><p class="me-aide">Le Porteur choisi apporte ses cartes au deck. ${actuel ? `${echap(porteurDef(actuel).nom)} reste au district, avec les siennes.` : ''}</p>`
    : `<p class="me-aide">Tous tes Porteurs sont déjà dans cette escouade. D’autres arriveront en descendant les Strates et en agrandissant la Forge.</p>`;
  return h + `</div></section>`;
}

/** La liste de tous les Porteurs, par lignée (l'ancien écran Porteurs, revue du 22 octobre 2026) */
function listeTous(e: EcranDistrict): string {
  const j = e.j;
  const presents = porteursPresents(j);
  const libres = presents.filter((id) => statut(j, id).classe === 'libre').length;
  let h = entete(`${presents.length} PORTEUR${presents.length > 1 ? 'S' : ''} · <span class="pt-dispo">${libres} DISPONIBLE${libres > 1 ? 'S' : ''}</span>`, 'Porteurs');
  h += voletsEscouade(e);
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
    + jaugeCharge(chargePortee(j, id), chargeMax(j, id), `Ce que pèsent ses cartes sur ce qu’${IL.has(id) ? 'il' : 'elle'} peut porter : +${CHARGE.parNiveau} à chaque niveau.`)
    + `<div class="fp-cartes">${cartes.map((k) => { const cc = j.collection[k]!; const m = moduleDef(k);
      return `<button type="button" class="fp-carte" data-carte="${k}"${dispo}${parti ? ' disabled' : ''} aria-label="${echap(m.nom)}, niveau ${cc.niveau}. Changer ses cartes">${faceCarte(m, cc.niveau, multNiveau(k, cc.niveau))}</button>`; }).join('')}`
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
          + `<p class="fp-note"><b>Comment la gagner :</b> ${m.fait === 'missions' ? `envoie ${echap(p.nom)} en mission en mer depuis le Port` : `emmène ${echap(p.nom)} dans l’escouade`}. Encore <b class="or">${fr(m.seuil - fait)} ${echap(m.quoi)}</b> et elle lui est acquise pour toujours.</p>`)
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
