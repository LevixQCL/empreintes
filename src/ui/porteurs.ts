// L'onglet Escouade (25 octobre 2026 ; Porteurs et Cartes réunis). Trois volets : l'escouade et son deck complet,
// tous les Porteurs (une grille par lignée, 22 octobre 2026), et la collection (htmlCartes dans district.ts).
// La fiche complète d'un Porteur : qui il est, son état (PV, niveau, Usure), sa Marque, sa lignée, son poste et ses cartes.

import { BATIMENTS, CLE_LEGS, ORIGINE_PAQUETAGE, PORTEURS, moduleDef, porteurDef, deNom } from '../core/donnees';
import { NIVEAU_METAL, composantsNiveau, doublonsRequis } from '../core/collection';
import { absence, LOT_RECITS, PRODUITS, aRecit, droitRecit, lotProposable, prixEuros, ACCORD_OUVERT, ESCOUADES_STRATE, escouadesOuvertes, CONFIANCE, CARTES_COMMUNES, RATELIER, communeOuverte, coutRatelier, gesteCommun, placesRatelier, ratelierDe, ratelierPayable, escouadesAvecCommune, cleDuLegs, DISTRICT, XP, bonusPv, deckEscouade, enExpedition, gestesDe, enMission, escouadeActive, escouadeDe, escouadeDefense, pillagesPermis, escouadesDe, escouadeVerrouillee, niveauPorteur, NOMS_PALIER_MARQUE, PALIERS_MARQUE, porteursPresents, progresMarque, RECITS_ORIGINES, carteDuRecit, pvMaxCombat, pvNiveau, raisonHorsEscouade, soinParHeure, textePosteQuitte, tropBlesse, usureMax, type Jeu } from '../core/jeu';
import { ORIGINES, PRESENTATIONS, origineDe } from '../core/lore-porteurs';
import { RECITS } from './recits';
import { imageDuPlan } from './intro';
import { FILS, etapesDe } from '../core/fils';
import { BATTU_PAR, REGLES, frequenceLibre } from '../core/regles';
import { NOMS_EFFET, effetsDe, nomsEffets, texteEffet } from '../core/effets';
import { multNiveau } from '../core/collection';
import type { BatimentId, GesteDef, Lignee, PorteurDef, TypeGeste } from '../core/types';
import { illustrationBatiment, portrait } from './art';
import { ICONES_ACTION, faceCarte } from './carte';
import { NOM_LIGNEE, NOM_LIGNEES, avatar, coquille, decompte, ongletsFiche, entete, voletsEscouade, type EcranDistrict } from './coquille';
import { barreXp, feuilleCarte, feuilleDeck, frequencesDe, jaugePv, plusLongueSuite } from './district';
import { effetsLignee, feuilleGuide, lienGuide, plageFrequences, trouveesDe } from './guide';
import { ICO, perle, sigle } from './icones';
import { COULEUR } from './vue';
import { echap, virgule, texteReplie } from './outils';
import { t as tr, locale, enumerer, minuscule } from '../core/i18n';

const LIGNEES: Lignee[] = ['tech', 'bio', 'reso'];
/** pour accorder « Pourquoi il / elle est là » */
const IL = new Set(['doran', 'sasha', 'aurel', 'coursier', 'docker', 'guetteur']);
const fr = (x: number) => x.toLocaleString(locale()).replace(/\u202f/g, '\u00a0');

/** Où est le Porteur en ce moment */
function statut(j: Jeu, id: string): { texte: string; classe: string } {
  const d = j.porteurs[id]!;
  if (j.confiee?.porteurs.includes(id)) return { texte: tr`En fouille · Strate −${j.confiee.strate}`, classe: 'parti' };
  if (enMission(j, id)) return { texte: tr('En mission'), classe: 'parti' };
  if (enExpedition(j, id)) return { texte: tr('En expédition'), classe: 'parti' };
  if (d.poste === 'noyau') return { texte: tr('À l’entraînement · Tour du Noyau'), classe: 'travail' };
  if (d.poste) return { texte: tr`Au travail · ${BATIMENTS.find((b) => b.id === d.poste)!.nom}`, classe: 'travail' };
  return { texte: tr('Disponible'), classe: 'libre' };
}

/** Quand arrive un Porteur qui n'est pas encore là */
export function arrivee(p: PorteurDef): string {
  if (p.arrivee?.forge) return tr`Arrive quand la Forge atteint le niveau ${p.arrivee.forge}.`;
  if (p.arrivee?.strate) return tr`Arrive quand la Strate −${p.arrivee.strate} est ouverte.`;
  if (p.arrivee?.accord) return tr`Arrive par un Accord ouvert : Clinique niveau ${ACCORD_OUVERT.clinique} et ${ACCORD_OUVERT.confiance * CONFIANCE.palier} familles qui te suivent.`;
  return tr('Arrive quand la chambre scellée est ouverte.');
}

/** Le même moment, au futur et sans majuscule, pour une phrase qui l'annonce (« … rejoindra le district quand … ») */
export function arriveeFuture(p: PorteurDef): string {
  if (p.arrivee?.forge) return tr`quand la Forge atteindra le niveau ${p.arrivee.forge}`;
  if (p.arrivee?.strate) return tr`quand la Strate −${p.arrivee.strate} sera ouverte`;
  if (p.arrivee?.accord) return tr`par un Accord ouvert : Clinique niveau ${ACCORD_OUVERT.clinique} et ${ACCORD_OUVERT.confiance * CONFIANCE.palier} familles qui te suivent`;
  return tr('quand la chambre scellée sera ouverte');
}

/** Le palier d'une Marque gagnée (1er novembre 2026) : rien à la base, « Affirmée » ou « Gravée » ensuite */
export const badgePalier = (palier: number) => (palier ? `<i class="palier-marque p${palier}">${NOMS_PALIER_MARQUE[palier]}</i>` : '');

/** La Marque, sans boîte : son nom, où on en est, un filet qui se remplit */
function marqueTuile(j: Jeu, id: string): string {
  const m = progresMarque(j, id);
  if (!m) return '';
  return m.acquise
    ? `<span class="pt-marque acquise">${ICO.ok}<span><b>${echap(m.nom)}</b>${badgePalier(m.palier)} ${echap(m.courtEffectif)}</span></span>`
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
  return `<button type="button" class="pt-tuile ${st.classe}" style="--c:${COULEUR[p.lignee]}" data-action="porteur" data-id="${p.id}" aria-label="${tr`${echap(p.nom)}, ${NOM_LIGNEE[p.lignee]}, niveau ${n.niveau}, ${echap(st.texte)}`}">`
    + `<span class="pt-portrait">${img ? `<img src="${img}" alt="" decoding="async" loading="lazy">` : avatar(p.id, 80)}`
    + `<span class="pt-etat ${st.classe}">${echap(st.texte)}</span>`
    + (rang >= 0 ? `<span class="pt-escouade" title="${tr`Dans ton escouade`}">${rang + 1}</span>` : '')
    + (j.vus.porteurs.includes(p.id) ? '' : `<span class="ruban-nouveau">${tr`Nouveau`}</span>`)
    + `<span class="pt-nom"><strong>${echap(p.nom)}</strong><small>${echap(PRESENTATIONS[p.id]?.titre ?? NOM_LIGNEE[p.lignee])}</small></span></span>`
    + `<span class="pt-chiffres"><b>${tr`Niv. ${n.niveau}`}</b><span>${tr`${pv}/${pvM} PV`}</span><span class="${nc >= DISTRICT.cartesMax ? 'plein' : nc ? '' : 'zero'}">${tr`${nc}/${DISTRICT.cartesMax} cartes`}</span></span>`
    + `<span class="pt-jauges" title="${tr`PV et expérience${n.requis ? tr` (${n.xp} / ${n.requis} XP vers le niveau ${n.niveau + 1})` : ''}`}">${jaugePv(pv, pvM, d.usure, usureMax(j, p.id))}${barreXp(j, p.id)}</span>`
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
  if (places > 0 && libresLignee > 0) bouts.push(`<span class="pt-afaire">${ICO.cartes}${tr`Peut porter ${Math.min(places, libresLignee)} carte${Math.min(places, libresLignee) > 1 ? 's' : ''} de plus`}</span>`);
  if (d.usure >= usureMax(j, p.id) * 0.5) bouts.push(`<span class="pt-afaire usure">${ICO.soin}${tr`Usure élevée : repos à la Clinique`}</span>`);
  return bouts.join('');
}

/** Un Porteur qui n'est pas encore là : une ligne, pas une tuile vide */
function silhouette(p: PorteurDef): string {
  return `<p class="pt-avenir" style="--c:${COULEUR[p.lignee]}"><span class="pt-ombre" aria-hidden="true">?</span><span><strong>${tr`Un Porteur ${minuscule(NOM_LIGNEE[p.lignee])} arrivera`}</strong> ${echap(arriveeFuture(p))}.</span></p>`;
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
  else if (e.ratelier && !e.reserve) h += voletRatelier(e);
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

const NOM_ACTION: Record<TypeGeste, string> = { atk: tr('Attaque'), bouclier: tr('Protection'), soin: tr('Soin') };

/**
 * Une carte du deck en vignette (refonte du 28 octobre 2026, comme Clash Royale ou la Forge) : la vraie face de la carte
 * (illustration, Fréquence, force, métal), trois par rangée ; dessous, seulement ce qui ne se lit pas sur la face :
 * le nom de l'effet, « 2 places », l'origine du paquetage. Toucher ouvre le détail.
 */
function tuileCarte(j: Jeu, g: GesteDef, prete: (cle: string) => boolean, scellee = false): string {
  const cle = g.carte && j.collection[g.carte] ? g.carte : null;
  const origine = g.porteur === null ? ORIGINE_PAQUETAGE[g.id] : undefined;
  let face: string;
  if (cle) {
    const c = j.collection[cle]!;
    face = faceCarte(moduleDef(cle), c.niveau, multNiveau(cle, c.niveau));
  } else {
    face = faceCarte({ id: g.id, nom: g.nom, lignee: 'tech', rarete: 'fer', type: g.type, v: g.v, f: [g.f], ...(g.effet ? { effet: g.effet } : {}) } as Parameters<typeof faceCarte>[0], 1, 1, origine ? { origine: origine.batiment } : {});
  }
  const sous = scellee ? `${ICO.cristal}<b>${tr`Scellée`}</b> ${tr`· un Porteur niv. ${NIVEAU_METAL.nacre}`}`
    : [g.effet ? `<b>${echap(nomsEffets(g))}</b>` : '', g.lourd ? tr('2 places') : ''].filter(Boolean).join(' · ');
  const badges = (cle && prete(cle) ? `<span class="eq-t-monte" title="${tr`Peut monter`}">${ICO.monter}</span>` : '')
    + (cle && !j.vus.cartes.includes(cle) ? `<span class="eq-t-neuve" title="${tr`Nouvelle`}"></span>` : '');
  const corps = `<span class="eq-t-face">${face}${badges}</span>${sous ? `<span class="eq-t-sous">${sous}</span>` : ''}`;
  return cle
    ? `<li><button type="button" class="eq-tuile" data-action="carte" data-id="${cle}" aria-label="${tr`${echap(g.nom)}, ${NOM_ACTION[g.type]} ${g.v}${g.effet ? `, ${nomsEffets(g)}` : ''}${prete(cle) ? tr(', peut monter') : ''}. Voir la carte`}">${corps}</button></li>`
    // une carte commune du Râtelier s'ouvre aussi d'un toucher (31 octobre 2026, Luc : « on ne sait pas appuyer dessus comme les autres »)
    : origine && !scellee && g.id !== 'cle-legs' ? `<li><button type="button" class="eq-tuile" data-action="carte" data-id="${g.id}" aria-label="${tr`${echap(g.nom)}, ${NOM_ACTION[g.type]} ${g.v}, carte commune. Voir la carte`}">${corps}</button></li>`
    // la Clé de l’Héritage aussi, scellée ou descellée (31 octobre 2026, Bryan : « on ne sait pas cliquer dessus comme les autres »)
    // la Lecture profonde de Véla aussi (1er novembre 2026, Luc : « qu'elle soit cliquable qu'on voit ce qu'elle fait »)
    : g.id === 'lecture-profonde' ? `<li><button type="button" class="eq-tuile" data-action="carte" data-id="${g.id}" aria-label="${tr`${echap(g.nom)}, carte unique de Véla, ${NOM_ACTION[g.type]} ${g.v}, Accord. Voir la carte`}">${corps}</button></li>`
    : g.id === 'cle-legs' ? `<li><button type="button" class="eq-tuile${scellee ? ' scellee' : ''}" data-action="carte" data-id="${g.id}" aria-label="${tr`${echap(g.nom)}, ton Héritage${scellee ? ', scellée' : `, ${NOM_ACTION[g.type]} ${g.v}`}. Voir la carte`}">${corps}</button></li>`
    : `<li><div class="eq-tuile fixe${scellee ? ' scellee' : ''}">${corps}</div></li>`;
}

/** les couleurs des Fréquences, plus claires pour teinter le cristal peint (en multiplication, une teinte sombre l'éteindrait) */
const couleurCristal = (f: number) => `hsl(${8 + (f - 1) * 34} 75% 62%)`;

/** Ce que vaut le deck de l'escouade : sa taille, ses Fréquences (par lignée), ses actions */
function bilanDeck(j: Jeu, esc: string[]): string {
  const cartes = deckEscouade(j, esc);
  const n = cartes.length;
  const manque = Math.max(0, DISTRICT.deckMin - n);
  const freqs = frequencesDe(cartes);
  const jokers = cartes.filter((g) => g.effet?.type === 'accord').length;
  const suite = plusLongueSuite(freqs, jokers);
    // l'échelle des Fréquences (9 novembre 2026, Bryan) : un cristal peint par chiffre, teinté à la couleur de sa Fréquence,
  // éteint s'il manque ; sous chaque cristal, le symbole peint des lignées qui le couvrent
  const colonnes = freqs.map((k, i) => {
    const ici = cartes.filter((g) => !frequenceLibre(g.effet) && (g.fs ?? [g.f]).includes(i + 1));
    const lignees = [...new Set(ici.filter((g) => g.porteur).map((g) => porteurDef(g.porteur!).lignee))] as Lignee[];
    return `<span class="eq-col${k ? '' : ' trou'}${suite.includes(i + 1) ? ' suite' : ''}" style="--fc:${couleurCristal(i + 1)}">`
      + `<b class="eq-cristal"><i aria-hidden="true"></i>${i + 1}</b><span class="eq-lignees">${lignees.map((l) => sigle(l)).join('')}</span><small>${k ? `×${k}` : '—'}</small></span>`;
  }).join('');
  const trous = freqs.map((k, i) => (k ? 0 : i + 1)).filter(Boolean);
  // les trois actions : l'icône de l'action et le nombre, sans capsule (9 novembre 2026, Bryan : les anciens médaillons ne servent plus)
  const actions = (['atk', 'bouclier', 'soin'] as TypeGeste[]).map((t) => {
    const k = cartes.filter((g) => g.type === t).length;
    return `<span class="eq-action ${t}${k ? '' : ' zero'}"><span class="eq-nb">${ICONES_ACTION[t]}<b>${k}</b></span><small>${t === 'atk' ? (k > 1 ? tr('attaques') : tr('attaque')) : t === 'bouclier' ? (k > 1 ? tr('protections') : tr('protection')) : k > 1 ? tr('soins') : tr('soin')}</small></span>`;
  }).join('');
  // une seule phrase de conseil, la plus utile
  const conseil = manque ? `<b class="rouge">${tr`Il manque ${manque} carte${manque > 1 ? 's' : ''}`}</b> ${tr`pour descendre (${DISTRICT.deckMin} au moins) : confies-en à un Porteur plus bas.`}`
    : !cartes.some((g) => g.type === 'soin' && g.porteur) ? `<b class="rouge">${tr`Aucun soin`}</b> ${tr`dans les cartes de tes Porteurs : seul le Stimulant du paquetage soigne.`}`
    : suite.length >= 2 ? `${tr`Ta plus longue suite va de`} <b>${tr`${suite[0]} à ${suite[suite.length - 1]}`}</b>${trous.length ? `${tr`. Rien en`} <b>${trous.join(', ')}</b> ${tr`: ${trous.length > 1 ? tr('ces chiffres coupent') : tr('ce chiffre coupe')} tes Résonances`}` : tr(' : toute l’échelle est couverte')}${jokers ? tr` · ${jokers} carte${jokers > 1 ? 's' : ''} ∗ comble${jokers > 1 ? 'nt' : ''} un trou` : ''}.`
    : tr('Des Fréquences qui se suivent font des Résonances : ajoute des chiffres voisins.');
  return `<section class="eq-bilan" aria-label="${tr`Le deck de l’escouade`}">`
    + `<div class="eq-bilan-tete"><span class="eq-total${manque ? ' maigre' : ''}"><b>${n}</b><span>${tr`cartes`}<small>${tr`dans le deck`}</small></span></span>`
    + lienGuide('deck', tr('Bien construire')) + `</div>`
    + `<div class="eq-freqs" role="img" aria-label="${tr`Fréquences du deck : ${freqs.map((k, i) => `${i + 1} : ${k}`).join(', ')}`}">${colonnes}</div>`
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
  return `<button type="button" class="eq-marque${m.acquise ? ' acquise' : ''}" data-action="porteur" data-id="${id}" aria-label="${tr`Marque ${echap(m.nom)} : ${echap(effet)} Voir la fiche ${echap(deNom(p.nom))}`}">`
    + `<span class="eq-marque-ico" aria-hidden="true">${m.acquise ? ICO.ok : ICO.cristal}</span><span class="eq-marque-txt">`
    // allégé le 28 octobre 2026 : le nom et l'effet sur une ligne, la progression en chiffres ; le détail est sur la fiche
    + `<strong><small class="eq-marque-lib">${tr`Marque`}</small>${echap(m.nom)}${m.acquise ? badgePalier(m.palier) : `<small class="eq-marque-compte">${fr(fait)} / ${fr(m.seuil)} ${echap(m.quoi)}</small>`}</strong>`
    + `<span class="eq-marque-effet">${echap((m.acquise && m.palier ? m.courtEffectif : effet).replace(/^./, (x) => x.toUpperCase()))}</span>`
    + (m.acquise ? '' : `<i class="eq-jauge"><i style="width:${(100 * fait) / m.seuil}%"></i></i>`)
    + `</span></button>`;
}

/** Un Porteur de l'escouade : qui il est, sa Marque, puis ses cartes, une par ligne */
function blocPorteur(j: Jeu, id: string | undefined, i: number, verrou: string | null, prete: (cle: string) => boolean): string {
  if (!id) {
    return `<section class="eq-porteur vide"><button type="button" class="eq-choisir" data-action="escouade-place" data-index="${i}"${verrou ? ' disabled' : ''}>`
      + `<span class="eq-rang">${i + 1}</span>${ICO.porteurs}<span><strong>${tr`Place libre`}</strong><small>${verrou ? tr('L’escouade est en descente') : tr('Choisir un Porteur : il apporte ses cartes au deck')}</small></span></button></section>`;
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
  const abs = absence(j, id);
  // l'absent (14 novembre 2026, Bryan : « en tout petit, ce n'est vraiment pas clair ») : un bandeau ambre, son retour, et ce qui se passera au départ
  const alerte = raison && !j.expedition
    ? `<div class="eq-absent">${ICO.chrono}<span><strong>${abs ? echap(abs.texte) : echap(raison.replace(/\.$/, ''))}${abs?.fin ? ` · ${decompte(abs.fin, Date.now(), tr('retour dans '))}` : ''}</strong>`
      + `<small>${tr`Au prochain départ, un autre Porteur prendra sa place.`}</small></span></div>`
    : textePosteQuitte(j, id) && !j.expedition ? `<p class="eq-alerte doux">${ICO.ouvrier}<span>${tr`Au départ, ${echap(textePosteQuitte(j, id)!)}`}</span></p>`
    : tropBlesse(j, id) && !j.expedition ? `<p class="eq-alerte">${ICO.soin}<span>${tr`${echap(tropBlesse(j, id)!.replace(/\.$/, ''))} : soins intensifs possibles à la Clinique.`}</span></p>`
    : d.usure >= usureMax(j, id) * 0.5 ? `<p class="eq-alerte">${ICO.soin}<span>${tr`Usure élevée : −${Math.floor(d.usure)} PV en combat. La Clinique la soigne au district.`}</span></p>`
    // vide, la ligne garde sa place : sur PC, les trois colonnes restent alignées
    : '<p class="eq-alerte"></p>';
  const bat = LIGNEES.find((l) => BATTU_PAR[l] === p.lignee)!;
  return `<section class="eq-porteur${raison && !j.expedition ? ' absent' : ''}" style="--c:${COULEUR[p.lignee]}" aria-label="${echap(p.nom)}">`
    // le Porteur et sa Marque dans un même cadre (13 novembre 2026) : le pouvoir se lit comme le sien
    + `<div class="eq-ident"><header class="eq-tete">`
    + `<button type="button" class="eq-portrait" data-action="porteur" data-id="${id}" aria-label="${tr`Fiche ${echap(deNom(p.nom))}`}">${img ? `<img src="${img}" alt="" decoding="async">` : avatar(id, 64)}<span class="eq-rang" aria-hidden="true">${i + 1}</span>${raison && !j.expedition ? `<span class="eq-absent-sceau" aria-hidden="true">${ICO.chrono}</span>` : ''}</button>`
    + `<div class="eq-id"><button type="button" class="eq-nom" data-action="porteur" data-id="${id}"><strong>${echap(p.nom)}</strong><small>${tr`${NOM_LIGNEE[p.lignee]} · Niv. ${n.niveau}`}</small></button>`
    + `<span class="eq-pv">${jaugePv(pv, pvM, d.usure, usureMax(j, id))}<small><b>${pv}</b> ${tr`/ ${pvM} PV`}</small></span>`
    + `<small class="eq-fort" style="--l:${COULEUR[bat]}">${tr`Fort contre les ${sigle(bat)}`}<b>${NOM_LIGNEES[bat]}</b></small></div>`
    + (verrou ? '' : `<button type="button" class="eq-changer" data-action="escouade-place" data-index="${i}" aria-label="${tr`Changer ${echap(p.nom)}`}">${ICO.recycler}<span>${tr`Changer`}</span></button>`)
    + `</header>`
    // l'absent : son bandeau juste sous le portrait, avant la Marque (visible sans défiler)
    + (abs && raison && !j.expedition ? alerte + blocMarque(j, id) + `</div>` : blocMarque(j, id) + `</div>` + alerte)
    // le compte des cartes et « Gérer » sur une seule ligne, juste au-dessus des cartes (12 novembre 2026 : plus de Charge)
    + `<div class="eq-cartes-tete eq-charge-ligne"><span class="eq-compte${nc >= DISTRICT.cartesMax ? ' plein' : ''}">${ICO.cartes}<b>${nc} / ${DISTRICT.cartesMax}</b> ${tr`cartes`}</span>`
    + `<button type="button" class="eq-gerer" data-action="deck" data-id="${id}"${parti ? ' disabled' : ''} aria-label="${parti ? tr('Ses cartes changeront à son retour') : tr`Gérer ses cartes (${nc} sur ${DISTRICT.cartesMax})`}">${ICO.greffe}<span>${parti ? tr('À son retour') : tr('Gérer')}</span></button></div>`
    + `<ul class="eq-grille">${gestes.map((g) => tuileCarte(j, g, prete)).join('')}`
    // les places libres, à la taille d'une carte : on voit tout de suite ce qui manque
    + (places > 0 && !parti ? Array.from({ length: places }, (_, k) => `<li><button type="button" class="eq-tuile libre" data-action="deck" data-id="${id}" aria-label="${tr`Place libre : confier une carte${attendent ? tr` (${attendent} de sa lignée attendent)` : ''}`}">`
      + `<span class="eq-t-vide">${ICO.greffe}<span>${k === 0 ? (attendent ? `${tr`Confier`}<small>${tr`${attendent} en attente`}</small>` : tr('Place libre')) : ''}</span></span></button></li>`).join('') : '')
    + `</ul></section>`;
}

/** L'escouade affichée dans l'onglet : celle choisie par le joueur, sinon celle qui descend */
export const escouadeVue = (e: EcranDistrict) => (e.vueEscouade !== undefined && e.vueEscouade >= 0 && e.vueEscouade < escouadesOuvertes(e.j) ? e.vueEscouade : escouadeActive(e.j));

/** Les trois escouades en onglets : leurs portraits, et celle qui descend marquée d'or */
function ongletsEscouades(j: Jeu, vue: number): string {
  const toutes = escouadesDe(j);
  const active = escouadeActive(j);
  const garde = pillagesPermis(j) ? escouadeDefense(j) : -1;
  return `<div class="eq-escouades" role="tablist" aria-label="${tr`Mes escouades`}">` + toutes.map((l, k) =>
    `<button type="button" role="tab" class="eq-esc${k === vue ? ' actif' : ''}${k === active ? ' descend' : ''}${l.length ? '' : ' vide'}" data-action="escouade-voir" data-index="${k}" aria-selected="${k === vue}">`
    + `<span class="eq-esc-nom">${tr`Escouade ${k + 1}`}</span>`
    // une escouade vide (30 octobre 2026) : un serti de cristal qui attend ses Porteurs, plutôt que trois fantômes
    + (l.length ? `<span class="eq-esc-visages">${[0, 1, 2].map((i) => (l[i] ? (absence(j, l[i]!) && !j.expedition ? `<span class="es-av-absent">${avatar(l[i]!, 26)}<i aria-hidden="true">${ICO.chrono}</i></span>` : avatar(l[i]!, 26)) : '<i class="eq-esc-place"></i>')).join('')}</span>` : `<span class="esc-serti plus" aria-hidden="true"></span>`)
    + `<small>${k === active ? `${ICO.descendre}${tr('Descend')}` : l.length ? `${l.length} / 3` : tr('Former')}${k === garde ? `<span class="eq-garde" title="${tr`Garde le port`}">${ICO.bouclier}</span>` : ''}</small></button>`).join('') + `</div>`;
}

function monEscouade(e: EcranDistrict): string {
  const j = e.j;
  const vue = escouadeVue(e);
  const active = escouadeActive(j);
  const esc = escouadesDe(j)[vue]!;
  const verrou = escouadeVerrouillee(j);
  const prete = (cle: string) => {
    const c = j.collection[cle]; const r = c ? doublonsRequis(moduleDef(cle).id, c.niveau) : null;
    return !!c && r !== null && c.doublons >= r && j.energie >= composantsNiveau(c.niveau + 1);
  };
  const deck = deckEscouade(j, esc).length;
  let h = entete(`${tr`ESCOUADE ${vue + 1} · ${esc.length} / 3 ·`} <span class="pt-dispo">${tr`${deck} CARTES`}</span>`, tr('Escouade'));
  // venu du départ ou du Port : le chemin du retour, bien en vue
  if (e.retourModif) h += `<button type="button" class="eq-revenir" data-action="escouade-revenir">${ICO.retour}<span><strong>${e.retourModif === 'pillages' ? tr('Revenir aux Pillages') : e.pillage ? tr('Revenir au pillage') : tr('Revenir au départ')}</strong>${e.retourModif === 'pillages' ? tr('Ta garnison est prise en compte tout de suite.') : tr('Avec l’escouade choisie ici.')}</span></button>`;
  h += voletsEscouade(e);
  // une seule escouade avant −5 (12 novembre 2026) : pas d'onglets, une ligne qui dit quand viendront les autres
  if (escouadesOuvertes(j) > 1) h += ongletsEscouades(j, vue);
  else h += `<p class="tr-note">${ICO.verrou}${tr`Une seule escouade pour l’instant : tant que le gardien de la Strate −${ESCOUADES_STRATE} tient, le puits n’a d’étais que pour une équipe à la fois.`}</p>`;
  if (verrou) h += `<p class="me-verrou">${ICO.verrou}<span><strong>${tr`En descente`}</strong>${echap(verrou.replace(/^[^:]*:\s*/, '').replace(/^./, (c) => c.toUpperCase()))}</span></p>`;
  // celle qui descend, ou le bouton pour qu'elle descende
  // celle qui descend : l'onglet le dit déjà (« Descend »), rien de plus (allégé le 28 octobre 2026)
  else if (vue !== active && esc.length) h += `<button type="button" class="eq-descend bouton" data-action="escouade-active" data-index="${vue}">${ICO.descendre}<span><strong>${tr`Faire descendre l’escouade ${vue + 1}`}</strong>${tr`Elle partira à la place de l’escouade ${active + 1} à la prochaine descente.`}</span></button>`;
  else if (vue !== active) h += `<p class="eq-descend vide">${ICO.porteurs}<span><strong>${tr`Une équipe de réserve`}</strong>${tr`Compose-la pour un autre ennemi, une autre lignée ou une Épreuve : un Porteur n’est que dans une seule escouade, et ses cartes le suivent.`}</span></p>`;
  if (esc.length) h += bilanDeck(j, esc);
  h += `<div class="eq-trio">${[0, 1, 2].map((i) => blocPorteur(j, esc[i], i, verrou, prete)).join('')}</div>`;
  // le paquetage du district, toujours là
  // la Clé de l’Héritage (29 octobre 2026) : visible dès qu'on l'a choisie, scellée tant qu'aucun Porteur de l'escouade n'a le niveau 10
  const cle = j.legs === 'cle' ? cleDuLegs(j, esc) : null;
  h += ratelierSection(j, vue, prete, !!verrou, cle);
  return h;
}

/**
 * Le Râtelier du district (30 octobre 2026) : les cartes communes qui descendent avec l'escouade. Bryan : « pouvoir les échanger ».
 * Un prix par départ pour toutes les cartes (30 min de Générateur pour explorer, 15 min pour une sortie courte). Elles restent quand un Porteur tombe.
 */
function ratelierSection(j: Jeu, k: number, prete: (cle: string) => boolean, verrou: boolean, cle: GesteDef | null): string {
  const choisies = ratelierDe(j, k);
  const payees = ratelierPayable(j, k).length;
  const places = placesRatelier(j);
  const explorer = coutRatelier(j, 'explorer', k), courte = coutRatelier(j, 'courte', k);
  const manque = payees < choisies.length;
  const vides = Math.max(0, places - choisies.length);
  const sous = choisies.length ? `${ICO.energie}${tr`Explorer`} <b>${explorer}</b> ${tr`· Fouiller`} <b>${courte}</b> ${tr`cristaux par départ${manque ? ` · <em>${tr`pas assez : elles restent au district`}</em>` : ''}`}` : tr('Elles restent même si un Porteur tombe');
  let h = `<section class="eq-district"><div class="eq-cartes-tete"><h3>${ICO.district}${tr`Râtelier de l’escouade ${k + 1}`} <span>${choisies.length} / ${places}</span></h3>`
    + (verrou ? '' : `<button type="button" class="eq-gerer" data-action="ratelier" aria-label="${tr`Changer les cartes du Râtelier de l’escouade ${k + 1}`}">${ICO.recycler}<span>${tr`Changer`}</span></button>`) + `<small>${sous}</small></div>`;
  h += `<ul class="eq-grille">${choisies.map((id) => tuileCarte(j, gesteCommun(j, CARTES_COMMUNES.find((c) => c.geste.id === id)!), prete)).join('')}`
    + (verrou ? '' : Array.from({ length: vides }, (_, n) => `<li><button type="button" class="eq-tuile libre" data-action="ratelier" aria-label="${tr`Emplacement libre : choisir une carte commune`}"><span class="eq-t-vide">${ICO.district}<span>${n === 0 ? tr('Emplacement libre') : ''}</span></span></button></li>`).join(''))
    + `${j.legs === 'cle' ? tuileCarte(j, cle ?? CLE_LEGS, prete, !cle) : ''}</ul></section>`;
  return h;
}

/** Le volet du Râtelier : toutes les cartes communes, celles qu'on peut prendre et celles qu'un bâtiment ouvrira */
function voletRatelier(e: EcranDistrict): string {
  const j = e.j;
  const vue = escouadeVue(e);
  const choisies = ratelierDe(j, vue);
  const places = placesRatelier(j);
  const plein = choisies.length >= places;
  const prochaine = RATELIER.places.find((p) => p.n > places);
  const ligne = (c: (typeof CARTES_COMMUNES)[number], k: number) => {
    const ouverte = communeOuverte(j, c);
    const pris = choisies.includes(c.geste.id);
    const g = gesteCommun(j, c);
    const bat = BATIMENTS.find((b) => b.id === c.batiment)!;
    const raison = ouverte ? '' : tr`${bat.nom} niveau ${c.niveau} : ${echap(raisonFermee(c.batiment))}`;
    // une carte commune peut être dans plusieurs Râteliers : on dit où elle est déjà, sans rien imposer
    const ailleurs = escouadesAvecCommune(j, c.geste.id).filter((n) => n !== vue).map((n) => n + 1);
    const aussi = ailleurs.length ? tr` · aussi dans l’escouade ${enumerer(ailleurs.map(String))}` : '';
    const etat = !ouverte ? '' : pris ? `<span class="me-prendre retirer">${tr`Retirer`}</span>` : plein ? '' : `<span class="me-prendre">${tr`Prendre`}</span>`;
    return `<button type="button" class="me-choix rt-choix${ouverte ? '' : ' indispo'}${pris ? ' pris' : ''}" data-action="ratelier-basculer" data-id="${c.geste.id}" data-index="${vue}"${!ouverte || (plein && !pris) ? ' disabled' : ''} style="--c:#CDEFFF;--i:${k}">`
      + `<span class="rt-face">${tuileFace(g)}</span>`
      + `<span class="me-choix-txt"><strong>${echap(g.nom)}</strong><small class="me-stats">${tr`${NOM_ACTION[g.type]} ${g.v} · Fréquence ${g.f}${g.effet ? ` · ${echap(nomsEffets(g))}` : ''}`}</small>`
      + (g.effet ? `<small class="me-raison">${echap(texteEffet(g.effet))}${c.geste.unique ? tr(' Une fois par combat.') : ''}</small>` : '')
      + `<small class="me-raison">${raison || tr`${echap(bat.nom)} · grandit avec le bâtiment${aussi}`}</small></span>${etat}</button>`;
  };
  let h = `<div class="voile-feuille" data-action="ratelier-fermer" aria-hidden="true"></div>`
    + `<section class="feuille me-volet" role="dialog" aria-modal="true" aria-labelledby="volet-titre"><span class="poignee" aria-hidden="true"></span>`
    + `<header class="feuille-tete"><div class="titres"><span class="surtitre">${tr`Râtelier de l’escouade ${vue + 1} · ${choisies.length} / ${places}`}</span><h2 id="volet-titre">${tr`Cartes communes du district`}</h2></div>`
    + `<button type="button" class="btn-icone" data-action="ratelier-fermer" aria-label="${tr`Fermer`}">${ICO.fermer}</button></header>`
    + `<div class="feuille-corps">${texteReplie(tr('Chaque bâtiment prépare ses cartes, sans lignée ni métal. Elles ne s’éteignent jamais quand un Porteur tombe, et gagnent de la force quand leur bâtiment monte. Le départ coûte quelques cristaux pour toutes les cartes à la fois, quel que soit leur nombre : 10 pour explorer, 5 pour fouiller (et pour une Épreuve, un Pillage ou la Flèche). Chaque escouade a son Râtelier : une même carte peut descendre avec plusieurs.'), 'communes-esc', 'me-aide')}`
    + `<div class="me-choix-liste">${CARTES_COMMUNES.map(ligne).join('')}</div>`
    + (prochaine ? `<p class="me-aide">${tr`Un emplacement de plus au niveau ${prochaine.noyau} de la Tour du Noyau.`}</p>` : '');
  return h + `</div></section>`;
}

/** Pourquoi une carte commune n'est pas encore prête : une raison du district, pas un voile sombre (23 octobre 2026) */
function raisonFermee(b: BatimentId): string {
  return ({
    noyau: tr('les creuseurs n’ont pas encore relevé ces galeries.'),
    generateur: tr('le courant ne suffit pas encore pour équiper une équipe.'),
    forge: tr('le forgeron n’a pas encore l’outillage pour ça.'),
    clinique: tr('la Clinique n’a pas encore le matériel.'),
    comptoir: tr('les fouilleurs n’en ont pas encore rapporté.'),
  } as Record<BatimentId, string>)[b];
}

/** La face d'une carte commune, en petit */
function tuileFace(g: GesteDef): string {
  const o = ORIGINE_PAQUETAGE[g.id];
  return faceCarte({ id: g.id, nom: g.nom, lignee: 'tech', rarete: 'fer', type: g.type, v: g.v, f: [g.f], ...(g.effet ? { effet: g.effet } : {}) } as Parameters<typeof faceCarte>[0], 1, 1, o ? { origine: o.batiment } : {});
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
      + `<span class="me-choix-txt"><strong>${echap(p.nom)}${j.vus.porteurs.includes(p.id) ? '' : ` <span class="pastille-n">${tr`Nouveau`}</span>`}</strong><small class="me-lignee">${tr`${NOM_LIGNEE[p.lignee]} · Niv. ${niveauPorteur(j, p.id).niveau}`}</small>`
      + (raison ? `<small class="me-raison">${echap(raison.replace(/\.$/, ''))}</small>`
        : (ailleurs(p.id) >= 0 ? `<small class="me-raison">${tr`Dans l’escouade ${ailleurs(p.id) + 1}${actuel ? tr` : ${echap(porteurDef(actuel).nom)} y prendra sa place` : tr(' : il la quittera')}`}</small>` : '')
        + (d.poste ? `<small class="me-raison">${tr`${d.poste === 'noyau' ? tr('À l’entraînement') : tr('Au travail')} · son poste restera vacant`}</small>` : '') + `<small class="me-stats">${tr`${pv}/${pvM} PV ·`} <span class="${nc ? '' : 'zero'}">${tr`${nc} carte${nc > 1 ? 's' : ''}`}</span></small>`
          + (m?.acquise ? `<small class="me-stats or">${ICO.ok}${echap(m.nom)}${m.palier ? ` · ${NOMS_PALIER_MARQUE[m.palier]}` : ''}</small>` : ''))
      + `</span>${raison ? '' : `<span class="me-prendre">${tr`Prendre`}</span>`}</button>`;
  };
  let h = `<div class="voile-feuille" data-action="escouade-fermer" aria-hidden="true"></div>`
    + `<section class="feuille me-volet" role="dialog" aria-modal="true" aria-labelledby="volet-titre"><span class="poignee" aria-hidden="true"></span>`
    + `<header class="feuille-tete"><div class="titres"><span class="surtitre">${tr`Escouade ${vue + 1} · place ${place + 1}`}</span><h2 id="volet-titre">${actuel ? `Remplacer ${echap(porteurDef(actuel).nom)}` : tr('Choisir un Porteur')}</h2></div>`
    + `<button type="button" class="btn-icone" data-action="escouade-fermer" aria-label="${tr`Fermer`}">${ICO.fermer}</button></header>`
    + `<div class="feuille-corps">`;
  h += candidats.length
    ? `<div class="me-choix-liste">${candidats.map(ligne).join('')}</div><p class="me-aide">${tr`Le Porteur choisi apporte ses cartes au deck. ${actuel ? tr`${echap(porteurDef(actuel).nom)} reste au district, avec les siennes.` : ''}`}</p>`
    : `<p class="me-aide">${tr`Tous tes Porteurs sont déjà dans cette escouade. D’autres arriveront en descendant les Strates et en agrandissant la Forge.`}</p>`;
  return h + `</div></section>`;
}

/** La liste de tous les Porteurs, par lignée (l'ancien écran Porteurs, revue du 22 octobre 2026) */
function listeTous(e: EcranDistrict): string {
  const j = e.j;
  const presents = porteursPresents(j);
  const libres = presents.filter((id) => statut(j, id).classe === 'libre').length;
  let h = entete(`${tr`${presents.length} PORTEUR${presents.length > 1 ? 'S' : ''} ·`} <span class="pt-dispo">${tr`${libres} DISPONIBLE${libres > 1 ? 'S' : ''}`}</span>`, tr('Porteurs'));
  h += voletsEscouade(e);
  h += `<p class="pt-intro">${tr`Une Augmentée, un Géné, une Résonante : depuis un siècle, les trois lignées se méfient les unes des autres. Sous la Tour, elles descendent ensemble, chacune avec ce que les deux autres n’ont pas. Touche un portrait pour faire sa connaissance.`}</p>`;
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
const CARTES_DE: Record<Lignee, string> = { tech: tr('augmentées'), bio: tr('génées'), reso: tr('résonantes') };

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
  const uMax = usureMax(j, id);
  const st = statut(j, id);
  const img = portrait(id);
  const parti = enExpedition(j, id);
  const c = COULEUR[p.lignee];

  // ---------- en-tête « héros » : le portrait peint en grand ----------
  let h = `<div class="voile-feuille" data-action="porteur-fermer" aria-hidden="true"></div>`
    + `<section class="feuille fiche-porteur fp" role="dialog" aria-modal="true" aria-labelledby="fiche-titre" style="--c:${c}"><span class="poignee" aria-hidden="true"></span>`
    + `<button type="button" class="btn-icone fp-fermer" data-action="porteur-fermer" aria-label="${tr`Fermer`}">${ICO.fermer}</button>`
    + `<div class="feuille-corps fp-corps"><header class="fp-heros">`
    + (img ? `<img class="fp-peint" src="${img}" alt="" decoding="async">` : `<span class="fp-sans">${avatar(id, 120)}</span>`)
    + `<span class="fp-etat ${st.classe}">${echap(st.texte)}</span>`
    + `<div class="fp-titre"><span class="fp-sur">${tr`${NOM_LIGNEE[p.lignee]} · Niveau ${n.niveau}`}</span><h2 id="fiche-titre">${echap(p.nom)}</h2>`
    + (pres ? `<span class="fp-role">${echap(pres.titre)}</span>` : '') + `</div></header>`;

  // deux onglets (12 novembre 2026, refonte des fiches) : « Porteur » (état, cartes, Marque, lignée, poste) d'abord, « Histoire » à part
  const debutHistoire = h.length;
  // ---------- son histoire (14 novembre 2026, Bryan : « tout ce qui se raconte sur elle se débloque avec le récit ») ----------
  // L'onglet Histoire d'un Porteur qui a un Récit des origines se lit comme une quatrième de couverture : sa présentation
  // et sa réplique, gratuites, puis la vitrine du récit, juste dessous. Tout le reste (pourquoi il est là, ses souvenirs,
  // son fil) est dans le récit : rien ne se voit avant de l'avoir, tout s'ouvre d'un coup après. L'XP et la Confiance
  // de son fil restent gagnées en jouant, par tous : seul le texte est réservé (aucun pay-to-win).
  const recit = Object.keys(RECITS_ORIGINES).find((r) => RECITS_ORIGINES[r]!.porteur === id);
  // vente ouverte (src/app/boutique.ts) : le récit ne se lit qu'une fois acquis sur le compte ; vente fermée, tout reste ouvert
  const bq = e.boutique?.ouverte ? e.boutique : null;
  const possede = !recit || !bq || aRecit(bq.achats, recit);
  const garde = recit ? carteDuRecit(j, recit) : null;
  // l'onglet Histoire porte le petit sceau doré du récit tant que son récit n'est pas lu jusqu'au bout (à lire, ou à débloquer)
  const recitALire = !!recit && !garde;
  if (pres) h += `<div class="fp-bio"><p>${echap(pres.texte)}</p>${pres.replique ? `<p class="fp-replique">« ${echap(pres.replique)} »</p>` : ''}</div>`;
  if (recit) h += vitrineRecit(j, bq, recit, p, possede, garde);
  if (possede) {
    if (pres?.pourquoi) h += `<section class="fp-bloc fp-pourquoi"><h3 class="fp-h3">${ICO.porte}${tr`Pourquoi ${IL.has(id) ? tr('il') : tr('elle')} est là`}</h3><p class="fp-texte">${echap(pres.pourquoi)}</p></section>`;
    if (pres?.aParte) h += `<aside class="fp-aparte"><strong>${echap(pres.aParte.titre)}</strong><p>${echap(pres.aParte.texte)}</p></aside>`;

    // ---------- ses souvenirs : d'où vient son don (sans récit : un palier de plus tous les quelques niveaux) ----------
    const histoire = origineDe(id, recit ? Infinity : n.niveau);
    if (histoire.length) {
      const ouverts = histoire.filter((x) => x.ouvert).length;
      h += `<section class="fp-bloc fp-histoire"><h3 class="fp-h3">${ICO.journal}${tr`Son histoire`}${ouverts < histoire.length ? ` <span class="fp-compte">${ouverts} / ${histoire.length}</span>` : ''}</h3><ol class="fp-paliers">`
        + histoire.map((x) => (x.ouvert
          ? `<li class="ouvert"><strong>${echap(x.titre)}</strong><p>${echap(x.texte)}</p></li>`
          : `<li class="ferme"><strong>${ICO.verrou}${tr`Au niveau ${x.niveau}`}</strong><p>${tr`${echap(p.nom)} n’en parle pas encore.`}</p></li>`)).join('')
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
        + (suivante ? `<li class="ferme"><strong>${ICO.verrou}${tr`La suite`}</strong><p>${echap(suivante.quand)}.</p></li>` : '')
        + `</ol></section>`;
    }
  }

  const histoireH = h.slice(debutHistoire);
  h = h.slice(0, debutHistoire);
  const debutFiche = h.length;
  // ---------- son état, en vrais chiffres ----------
  const soin = soinParHeure(j);
  const noteUsure = usure < 1
    ? tr`Aucune Usure : tous ses PV en combat.`
    : `${tr`Usure`} <b class="rouge">${usure}</b> ${tr`/ ${uMax} : −${usure} PV en combat.`} `
      + (parti ? tr('Elle se soignera à son retour.') : soin > 0 ? tr`La Clinique en soigne ${virgule(soin)} par heure : effacée dans ${Math.max(1, Math.ceil(d.usure / soin))} h environ.` : tr('La Clinique la soignera.'));
  const pvSuivant = Math.round(p.pvMax * (1 + XP.pvParNiveau * n.niveau)) + bonusPv(j, id);
  const noteXp = n.requis
    ? `${tr`Encore`} <b>${tr`${fr(n.requis - n.xp)} XP`}</b> ${tr`pour le niveau ${n.niveau + 1} :`} <b class="or">${tr`${pvSuivant} PV`}</b> ${tr`au lieu de ${pvM}. XP gagnée en combat (plus en profondeur, et davantage contre les salles scellées et les gardiens), en mission et à l’entraînement à la Tour du Noyau.`}`
    : tr`Niveau maximum atteint.`;
  h += `<section class="fp-bloc"><h3 class="fp-h3">${ICO.soin}${tr`Son état`}</h3><div class="fp-figs">`
    + figure('pv', tr('En combat'), `${pv}`, `/ ${pvM} PV`, jaugePv(pv, pvM, d.usure, uMax), noteUsure)
    + figure('xp', `Niveau ${n.niveau}`, n.requis ? fr(n.xp) : '—', n.requis ? `/ ${fr(n.requis)} XP` : 'max', `<i class="fp-jauge"><i style="width:${n.requis ? Math.round((100 * n.xp) / n.requis) : 100}%"></i></i>`, noteXp)
    + `</div></section>`;

  // ---------- ses cartes : touchables, mènent à sa feuille de deck ----------
  const cartes = d.modules.filter((k) => j.collection[k]);
  const portees = new Set(Object.values(j.porteurs).flatMap((x) => x.modules));
  const enAttente = Object.keys(j.collection).filter((k) => !portees.has(k) && moduleDef(k).lignee === p.lignee).length;
  const places = DISTRICT.cartesMax - cartes.length;
  const dispo = parti ? '' : ` data-action="deck" data-id="${id}"`;
  h += `<section class="fp-bloc"><h3 class="fp-h3">${ICO.cartes}${tr`Ses cartes`} <span class="fp-compte${places ? '' : ' plein'}">${cartes.length} / ${DISTRICT.cartesMax}</span></h3>`
    + `<div class="fp-cartes">${cartes.map((k) => { const cc = j.collection[k]!; const m = moduleDef(k);
      return `<button type="button" class="fp-carte" data-carte="${k}"${dispo}${parti ? ' disabled' : ''} aria-label="${tr`${echap(m.nom)}, niveau ${cc.niveau}. Changer ses cartes`}">${faceCarte(m, cc.niveau, multNiveau(k, cc.niveau))}</button>`; }).join('')}`
    + Array.from({ length: places }, () => `<button type="button" class="fp-place"${dispo}${parti ? ' disabled' : ''} aria-label="${tr`Place libre : lui confier une carte`}">${ICO.place}<span>${tr`Place libre`}</span></button>`).join('')
    + `</div>`
    + (parti ? `<p class="fp-note">${tr`${echap(p.nom)} est en route : ses cartes changeront à son retour.`}</p>`
      : places && enAttente ? `<p class="fp-note glace">${tr`${enAttente} carte${enAttente > 1 ? 's' : ''} ${enAttente > 1 ? CARTES_DE[p.lignee] : CARTES_DE[p.lignee].replace(/s$/, '')} libre${enAttente > 1 ? 's' : ''} dans ta collection : encore ${Math.min(places, enAttente)} place${Math.min(places, enAttente) > 1 ? 's' : ''} à remplir.`}</p>`
      : !cartes.length ? `<p class="fp-note rouge">${tr`Aucune carte : rien à jouer en combat.`}</p>`
      : `<p class="fp-note">${tr`Ces cartes entrent dans ton deck quand ${echap(p.nom)} descend.`}</p>`)
    + `</section>`;

  // ---------- sa Marque ----------
  const m = progresMarque(j, id);
  if (m) {
    const fait = Math.min(m.n, m.seuil);
    h += `<section class="fp-bloc fp-marque${m.acquise ? ' acquise' : ''}"><h3 class="fp-h3">${ICO.cristal}${tr`Sa Marque`}</h3>`
      + `<div class="fp-marque-tete"><strong>${echap(m.nom)}</strong>${m.acquise ? `<span class="fp-acquise">${ICO.ok}${m.palier === 0 ? tr('Acquise') : NOMS_PALIER_MARQUE[m.palier]}</span>` : `<span class="fp-marque-n"><b>${fr(fait)}</b> / ${fr(m.seuil)}</span>`}</div>`
      + (m.acquise ? '' : `<i class="fp-jauge"><i style="width:${Math.min(100, (100 * m.n) / m.seuil)}%"></i></i>`
          + `<p class="fp-note"><b>${tr`Comment la gagner :`}</b> ${tr`${m.fait === 'missions' ? tr`envoie ${echap(p.nom)} en mission en mer depuis le Port` : tr`emmène ${echap(p.nom)} dans l’escouade`}. Encore`} <b class="or">${fr(m.seuil - fait)} ${echap(m.quoi)}</b> ${tr`et elle lui est acquise pour toujours.`}</p>`)
      // les paliers (1er novembre 2026) : la Marque grandit avec le niveau du Porteur, une fois gagnée
      + `<ol class="fp-mpaliers">` + [{ nom: NOMS_PALIER_MARQUE[0], quand: tr('par l’exploit'), texte: m.texte }, ...m.paliers.map((x, k) => ({ nom: NOMS_PALIER_MARQUE[k + 1], quand: tr`niveau ${PALIERS_MARQUE[k]}`, texte: x.texte }))].map((x, k) => {
        const atteint = m.acquise && m.palier >= k;
        const etat = atteint ? 'atteint' : k && m.niveau >= PALIERS_MARQUE[k - 1]! ? 'pret' : '';
        return `<li class="fp-palier${etat ? ' ' + etat : ''}"><span class="fp-palier-tete"><b>${x.nom}</b><small>${atteint ? `${ICO.ok}${tr('Active')}` : etat === 'pret' ? tr('Niveau atteint · Marque à gagner') : x.quand}</small></span><span class="fp-palier-txt">${echap(x.texte)}</span></li>`;
      }).join('') + `</ol>`
      + (m.acquise ? `<p class="fp-note or">${tr`Active dans chaque combat où ${echap(p.nom)} fait partie de l’escouade${m.palier < 2 ? tr` : elle s’affirme au niveau ${PALIERS_MARQUE[0]} et se grave au niveau ${PALIERS_MARQUE[1]}` : ''}.`}</p>` : '')
      + `</section>`;
  }

  // ---------- sa lignée : ce qu'elle lui donne, qui il bat, qui le bat ----------
  const bat = LIGNEES.find((l) => BATTU_PAR[l] === p.lignee)!;
  const craint = BATTU_PAR[p.lignee];
  const bonus = Math.round((REGLES.bonusLignee - 1) * 100);
  const effets = effetsLignee(p.lignee).map((t) => NOMS_EFFET[t]);
  h += `<section class="fp-bloc"><h3 class="fp-h3">${ICO.porteurs}${tr`Sa lignée · ${NOM_LIGNEE[p.lignee]}`}</h3>`
    + `<p class="fp-texte">${tr`${echap(p.nom)} porte les cartes`} <b style="color:color-mix(in srgb,${c} 55%,white)">${CARTES_DE[p.lignee]}</b> ${tr`: Fréquences`} <b class="mono">${plageFrequences(p.lignee).replace(' à ', '</b> à <b class="mono">')}</b>${effets.length ? tr`, surtout ${effets.join(', ')}` : ''}.</p>`
    + `<div class="fp-duel">`
    + `<div class="fp-duel-l bat" style="--l:${COULEUR[bat]}"><span>${tr`Fort contre les`}</span><strong>${sigle(bat)}${NOM_LIGNEES[bat]}</strong><b>+${bonus}<i>%</i></b><small>${tr`de dégâts pour ses cartes`}</small></div>`
    + `<div class="fp-duel-l craint" style="--l:${COULEUR[craint]}"><span>${tr`Faible contre les`}</span><strong>${sigle(craint)}${NOM_LIGNEES[craint]}</strong><b>+${bonus}<i>%</i></b><small>${tr`de dégâts reçus`}</small></div>`
    + `</div></section>`;

  // ---------- au district : son poste ----------
  const ateliers = BATIMENTS.filter((b) => b.affinite === p.lignee);
  const poste = d.poste ? BATIMENTS.find((b) => b.id === d.poste)! : null;
  const liste = poste && !ateliers.some((b) => b.id === poste.id) ? [poste, ...ateliers] : ateliers;
  h += `<section class="fp-bloc"><h3 class="fp-h3">${ICO.ouvrier}${tr`Au district`}</h3>`
    + (liste.length ? `<ul class="fp-postes">${liste.map((b) => {
      const ici = poste?.id === b.id;
      const ideal = b.affinite === p.lignee;
      return `<li class="${ici ? 'ici' : ''}"><img src="${illustrationBatiment(b.id, j.batiments[b.id])}" alt="" decoding="async" loading="lazy"><span><strong>${echap(b.nom)}</strong><small>${ici ? tr('Au travail ici') : ideal ? tr('Lignée idéale') : tr('Autre lignée')}</small></span><b class="${ideal ? 'or' : ''}">×${virgule(ideal ? DISTRICT.bonusAffinite : DISTRICT.bonusPoste)}</b></li>`;
    }).join('')}</ul>` : '')
    + `<p class="fp-note">${tr`${ateliers.length ? tr`Ailleurs : ×${virgule(DISTRICT.bonusPoste)}.` : tr`Aucun bâtiment n’est fait pour sa lignée : ×${virgule(DISTRICT.bonusPoste)} partout.`} Pour le poster, touche un bâtiment au District. S’il descend, il quitte son poste, qui reste vacant.`}</p>`
    + `</section>`;

  if (histoireH) {
    const ficheH = h.slice(debutFiche);
    const onglet = e.ongletFiche === 'histoire' ? 'histoire' : 'porteur';
    h = h.slice(0, debutFiche) + ongletsFiche([{ id: 'porteur', nom: tr('Porteur') }, { id: 'histoire', nom: recitALire ? `<span class="fp-onglet-recit"><i class="fp-mini-sceau" aria-hidden="true"></i>${tr('Histoire')}</span>` : tr('Histoire') }], onglet) + (onglet === 'histoire' ? histoireH : ficheH);
  }
  // ---------- pied : la prochaine action ----------
  // sur l'onglet Histoire d'un Porteur à récit (14 novembre 2026) : le récit, toujours à portée de pouce, jamais au bout d'un défilement
  const surHistoire = !!recit && e.ongletFiche === 'histoire';
  const pied = !surHistoire
    ? `<button type="button" class="btn large fp-deck" data-action="deck" data-id="${id}"${parti ? ' disabled' : ''}>${ICO.cartes}${parti ? tr('Ses cartes changeront à son retour') : places ? tr`Lui confier des cartes · ${cartes.length} / ${DISTRICT.cartesMax}` : tr('Changer ses cartes')}</button>`
    : possede
      ? `<button type="button" class="btn large fp-deck fp-pied-recit" data-action="recit-lire" data-id="${recit}">${ICO.film}${garde ? tr('Relire son récit') : tr('Lire son récit')}</button>`
      : `<button type="button" class="btn large fp-deck fp-pied-recit scelle" data-action="recit-offre" data-id="${recit}"><i class="fp-mini-sceau" aria-hidden="true"></i>${tr`Ouvrir son histoire`} · ${prixEuros(PRODUITS[droitRecit(recit!)]!.prix)}</button>`;
  // l'offre dépliée a ses propres boutons de paiement : le pied s'efface
  const offreOuverte = surHistoire && !possede && e.boutique?.offre === recit;
  h += `</div>` + (offreOuverte ? '' : `<footer class="feuille-pied fp-pied">${pied}</footer>`);
  return h + `</section>`;
}

/** Les chapitres d'un récit : leur nom et la première illustration (le prologue, daté, n'en est pas un) */
function chapitresDe(recit: string): { nom: string; image: string | null }[] {
  const plans = RECITS[recit]?.plans ?? [];
  const liste: { cle: string; nom: string; image: string | null }[] = [];
  for (const pl of plans.slice(1)) {
    const deja = liste.find((c) => c.cle === pl.epoque);
    if (deja) { deja.image ??= imageDuPlan(pl); continue; }
    liste.push({ cle: pl.epoque, nom: pl.epoque.split(' · ').slice(1).join(' · ') || pl.epoque, image: imageDuPlan(pl) });
  }
  // le prologue appartient au premier chapitre : son image ouvre la vitrine (le Porteur, jeune, avant tout le reste)
  if (liste[0] && plans[0]) liste[0].image = imageDuPlan(plans[0]) ?? liste[0].image;
  return liste;
}

/**
 * La vitrine du Récit des origines d'un Porteur (14 novembre 2026, revue marketing et game design avec Bryan) :
 * scellée, elle montre ce que l'on va lire (les trois chapitres en images, tout ce qui s'ouvre, la carte à gagner) et un seul
 * bouton, dans le pied de la fiche, toujours visible (jamais deux fois le même) ; acquise, elle devient la porte du récit.
 */
function vitrineRecit(j: Jeu, bq: import('./coquille').Boutique | null, recit: string, p: PorteurDef, possede: boolean, garde: string | null): string {
  const id = p.id;
  const il = IL.has(id);
  const nom = echap(p.nom);
  const chapitres = chapitresDe(recit);
  const scenes = RECITS[recit]?.plans.length ?? 0;
  const ouvert = !possede && bq?.offre === recit;
  let h = `<section class="fp-vitrine${possede ? ' acquise' : ' scellee'}${ouvert ? ' ouvert' : ''}" id="vitrine-recit">`
    + `<div class="fv-tete"><span class="fp-sceau" aria-hidden="true"></span><div><span class="fv-sur">${tr`Récit d’origine`}</span>`
    + `<h3 class="fv-titre">${possede ? echap(RECITS[recit]!.nom) : tr`Ce que ${nom} ne dit à personne`}</h3></div></div>`;
  // les trois chapitres : l'illustration est l'appât, on la montre ; scellés, un cadenas doré
  h += `<ol class="fv-chapitres">${chapitres.map((c, k) => `<li${c.image ? '' : ' class="sans"'}>${c.image ? `<img src="${c.image}" alt="" decoding="async" loading="lazy">` : ''}`
    + `<span class="fv-chap"><small>${possede ? '' : ICO.verrou}${tr`Chapitre ${k + 1}`}</small><strong>${echap(c.nom)}</strong></span></li>`).join('')}</ol>`;

  if (possede) {
    const sous = garde ? tr`Carte gardée : « ${moduleDef(garde).nom} »` : tr`${chapitres.length} chapitres illustrés, ${scenes} scènes · une carte d’origine à choisir à la fin`;
    // lire ou relire : le pied de la fiche ; ici, seulement changer la carte gardée
    h += `<p class="fv-note">${echap(sous)}</p>`
      + (garde ? `<div class="fp-recit-actions fv-actions"><button type="button" class="btn sec petit" data-action="recit-fin" data-id="${recit}">${tr`Changer de carte`}</button></div>` : '');
    return h + `</section>`;
  }

  // tout ce qui s'ouvre avec le récit, en vrais chiffres (rien n'est à découvrir après avoir payé)
  const pres = PRESENTATIONS[id];
  const souvenirs = ORIGINES[id] ?? [];
  const fil = FILS[id];
  const vecues = j.fils?.[id] ?? 0;
  const contenu: [string, string, string][] = [
    [ICO.film, tr`${chapitres.length} chapitres illustrés`, tr`${scenes} scènes, à relire quand tu veux`],
    ...(pres?.pourquoi ? [[ICO.porte, il ? tr('Pourquoi il est là') : tr('Pourquoi elle est là'), il ? tr('ce qui l’a amené devant la porte') : tr('ce qui l’a amenée devant la porte')] as [string, string, string]] : []),
    ...(souvenirs.length ? [[ICO.journal, tr`Ses ${souvenirs.length} souvenirs`, enumerer(souvenirs.map((x) => `« ${echap(x.titre)} »`))] as [string, string, string]] : []),
    ...(fil ? [[ICO.porte, tr`Son fil · ${echap(fil.titre)}`, vecues ? tr`${vecues} étape${vecues > 1 ? 's' : ''} sur ${fil.etapes.length} déjà vécue${vecues > 1 ? 's' : ''} : à lire tout de suite` : tr`${fil.etapes.length} étapes, qui s’écrivent en jouant`] as [string, string, string]] : []),
    [ICO.cartes, tr('Une carte d’origine en or'), il ? tr('exclusive, au choix parmi deux, elle grandit avec lui') : tr('exclusive, au choix parmi deux, elle grandit avec elle')],
  ];
  h += `<ul class="fv-contenu">${contenu.map(([ico, titre, detail]) => `<li>${ico}<span><strong>${titre}</strong><small>${detail}</small></span></li>`).join('')}</ul>`;

  const prix = prixEuros(PRODUITS[droitRecit(recit)]!.prix);
  if (!ouvert) {
    h += `<p class="fv-note">${tr`Paiement unique, sans abonnement · à toi pour toujours, sur tous tes appareils`}</p>`
      // le lot des trois récits (14 novembre 2026, Bryan : la Perle « un des trucs les plus intéressants ») : une offre à part
      // entière, la Perle en grand, ce qu'elle fait et l'économie en clair ; la toucher déplie l'offre comme le bouton du pied
      + (bq && lotProposable(bq.achats) ? `<button type="button" class="fv-lot" data-action="recit-offre" data-id="${recit}">${perle('fv-perle')}`
        + `<span><small>${tr`Ou les trois récits · Ilka, Doran et Véla`}</small><strong>${prixEuros(PRODUITS[LOT_RECITS]!.prix)} <s>${prixEuros(3 * PRODUITS[droitRecit(recit)]!.prix)}</s></strong>`
        + `<em>${tr`+ 1 Perle de nacre offerte : de quoi faire passer une carte en or en nacre`}</em></span></button>` : '');
    return h + `</section>`;
  }
  // l'offre dépliée : les deux cartes d'origine en clair avant de payer (Bryan, 11 novembre 2026 : aucune surprise), puis le paiement
  h += `<ul class="fp-cartes-recit">${RECITS_ORIGINES[recit]!.choix.map((c) => {
    const m = moduleDef(c.carte);
    const effets = m.effet ? effetsDe(m).map((x) => `<span><b>${echap(NOMS_EFFET[x.type])}</b> ${echap(texteEffet(x))}</span>`).join('') : `<span>${tr`Pas d’effet : sa force seule.`}</span>`;
    return `<li><span class="fp-carte-face">${faceCarte(m, 1)}</span><span class="fp-carte-texte"><strong>${echap(m.nom)}</strong>${effets}`
      + `<small>${tr`Carte exclusive, en or : elle grandit avec ${nom} au fil de ses niveaux, puis passe en nacre avec une Perle.`}${m.origine ? ' ' + tr`Face à un autre joueur (duel, défi d’un quai), son effet « ${echap(NOMS_EFFET[m.origine])} » est éteint.` : ''}</small></span></li>`;
  }).join('')}</ul>`;
  h += blocPaiement(bq!, [{ id: droitRecit(recit), texte: tr`Ce récit · ${prix}` }]
    .concat(lotProposable(bq!.achats) ? [{ id: LOT_RECITS, texte: tr`Les trois récits · ${prixEuros(PRODUITS[LOT_RECITS]!.prix)} + 1 Perle de nacre` }] : []));
  h += `<button type="button" class="btn sec petit fv-replier" data-action="recit-acheter" data-id="${recit}" aria-expanded="true">${tr`Plus tard`}</button>`;
  return h + `</section>`;
}

/**
 * Le paiement d'une offre dépliée (récit d'un Porteur, pack Ossyra), selon le compte. Cadre légal (13 novembre 2026) :
 * un contenu numérique fourni tout de suite n'a plus de droit de rétractation de 14 jours que si l'acheteur le demande
 * expressément et reconnaît le perdre ; d'où la case à cocher, sans laquelle les boutons de paiement restent éteints.
 * Le serveur refuse aussi un paiement sans elle et la recopie sur le reçu Stripe (la confirmation écrite).
 */
export function blocPaiement(bq: import('./coquille').Boutique, boutons: readonly { id: string; texte: string }[]): string {
  let h = '';
  if (bq.compte === 'pret') {
    const eteint = bq.occupe || !bq.renonce ? ' disabled' : '';
    h += `<label class="fp-renonce"><input type="checkbox" data-action="achat-renonce"${bq.renonce ? ' checked' : ''}>`
      + `<span>${tr`Je veux recevoir mon achat tout de suite, et je renonce à mon droit de rétractation de 14 jours.`}</span></label>`
      + `<div class="fp-recit-actions">${boutons.map((b, i) => `<button type="button" class="btn ${i ? 'sec' : 'prim'} petit" data-action="achat-payer" data-id="${b.id}"${eteint}>${b.texte}</button>`).join('')}</div>`
      + `<p class="fp-legal">${bq.occupe ? tr('Ouverture du paiement…') : tr('Paiement sécurisé par Stripe, en une fois, sans abonnement. Le reçu arrive par e-mail.')}</p>`;
  } else if (bq.compte === 'a-relier') {
    h += `<p class="fp-legal">${tr`Relie d’abord ta partie à un compte Google ou à un e-mail : ton achat y restera attaché, même si tu changes d’appareil.`}</p>`
      + `<div class="fp-recit-actions"><button type="button" class="btn prim petit" data-action="compte">${tr`Relier ma partie`}</button></div>`;
  } else {
    h += `<p class="fp-legal">${tr`L’achat demande une connexion et un compte en ligne. Reviens ici une fois connecté.`}</p>`;
  }
  if (bq.erreur) h += `<p class="fp-legal rouge" role="alert">${echap(bq.erreur)}</p>`;
  return h;
}
