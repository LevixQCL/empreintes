// La carte d'une Strate : l'escouade descend salle par salle jusqu'au gardien.
// Vue d'en haut : l'entrée en haut, le gardien tout en bas ; on touche une salle voisine pour y aller.
//
// Revue du 22 octobre 2026 (même équipe que la feuille de bâtiment et l'écran Escouade) :
// - lisibilité : plus aucun texte sous 12 px ; la carte a la hauteur de ses rangées (une fouille n'est plus étirée) ;
//   l'escouade montre ses vrais PV (« 10 / 38 ») ; la profondeur se lit d'un coup d'œil (« gardien dans 5 salles ») ;
// - direction artistique : plus de cartouches ni de plaques à coins coupés, plus de balayage ni de couronne d'ornement ;
//   deux accents seulement : glace pour les salles où l'on peut aller, or pour le chemin parcouru et le butin ;
//   le rouge doux ne marque que le gardien. Les ennemis des routes sont montrés en grand (portraits 3:4 qui se fondent) ;
// - UX : la fiche d'une salle dit ce qu'elle rapporte et coûte en vrais chiffres (PV de l'ennemi, composants,
//   PV rendus au campement), la sortie possible est chiffrée, le butin ne s'affiche qu'une fois.
// 28 octobre 2026 : plus de liste « Où aller ? » ; on choisit sur le plan, la fiche s'ouvre en bas.

import { INDICES, accessibles, butinArchive, butinCache, butinCombat, enAttente, forceStrate, indiceSalle, mainAccordable, peutRemonter, rangsDe, reperentPassage, salleCourante, suitePorte, visionSalle, type Expedition, type Salle, type TypeSalle } from '../core/expedition';
import { CONTENU, halteDef, nombreHaltes, particularite, queteDef, secretDef, voixDetail } from '../core/strates';
import { EXPLORER, rodeurDef, vestigesDe } from '../core/explorer';
import { couleurFrequence } from './carte';
import { paroleDescente } from '../core/campagne';
import { PV_GROUPE, pvProfondeur } from '../core/combat';
import { CONDITIONS, NOMS_LIGNEE, ZONES, ennemiDef, porteurDef } from '../core/donnees';
import { BATTU_PAR } from '../core/regles';
import { CIBLES_FOUILLE, RENCONTRES, XP, etapeQueteTrouvee, gainChoixHalte, halteEnCours, type Jeu } from '../core/jeu';
import { COLLECTION } from '../core/collection';
import { REGLES } from '../core/regles';
import { decorStrate, illustrationEnnemi, portrait, iconeCondition, portraitProvisoire } from './art';
import { COULEUR, htmlLieu } from './vue';
import { ICO, baseIcones, icone } from './icones';
import { echap } from './outils';

const NOMS: Record<TypeSalle, string> = {
  entree: 'Entrée', combat: 'Combat', elite: 'Salle scellée', cache: 'Cache', rencontre: 'Rencontre', camp: 'Campement', archive: 'Archives', gardien: 'Gardien', filon: 'Filon', halte: 'Halte', porte: 'Porte ancienne',
};

/** icônes peintes (public/art/icones/) des salles qui en ont une */
const PEINTES: Partial<Record<TypeSalle, string>> = { entree: 'strate', cache: 'composants', archive: 'codex', filon: 'eclats' };
/** les salles du contenu des Strates (31 octobre 2026) : en trait, en attendant leurs icônes peintes (docs/prompts-strates.md) */
const TRAITS: Partial<Record<TypeSalle, keyof typeof ICO>> = { halte: 'halte', porte: 'porte' };

/** scènes peintes (public/art/salles/), recadrées dans le médaillon */
const baseSalles = new URL('art/salles/', document.baseURI).href;
const SCENES: Partial<Record<TypeSalle, { fichier: string; cadrage: [number, number, number] }>> = {
  camp: { fichier: 'campement', cadrage: [50, 56, 118] },
  rencontre: { fichier: 'rencontre', cadrage: [58, 52, 112] },
};

/** recadrage des portraits d'ennemis dans un médaillon : centre (x %, y %) et taille de l'image (%) */
const CADRAGE: Record<string, [number, number, number]> = {
  'automate-graveur': [36, 44, 170], brigadier: [50, 10, 170], confluence: [40, 30, 150], double: [48, 14, 170], 'echo-veilleur': [44, 10, 170],
  'essaim-ambre': [50, 28, 170], 'gardien-registres': [52, 10, 180], pilleur: [46, 18, 180], 'premier-porteur': [50, 6, 170], rampeur: [50, 16, 160],
  remanent: [40, 14, 160], 'remanent-faible': [40, 14, 160], 'sentinelle-verre': [50, 14, 180], tisseuse: [50, 30, 160], vigie: [52, 36, 170],
};

/** l'intérieur d'un médaillon de la carte : portrait de l'ennemi, scène peinte ou icône peinte */
function medaillon(s: Pick<Salle, 'type' | 'ennemi'>): string {
  const ill = s.ennemi ? illustrationEnnemi(s.ennemi) : null;
  if (ill) {
    const [cx, cy, z] = CADRAGE[s.ennemi!] ?? [50, 28, 210];
    return `<span class="ex-med${portraitProvisoire(s.ennemi!) ? ' provisoire' : ''}" style="--img:url(${ill});--pos:${cx}% ${cy}%;--zoom:${z}%"><i></i></span>`;
  }
  const scene = SCENES[s.type];
  if (scene) {
    const [cx, cy, z] = scene.cadrage;
    return `<span class="ex-med" style="--img:url(${baseSalles}${scene.fichier}.webp);--pos:${cx}% ${cy}%;--zoom:${z}%"><i></i></span>`;
  }
  const peinte = PEINTES[s.type];
  return `<span class="ex-med peinte">${peinte ? `<img src="${baseIcones}${peinte}.webp" alt="" decoding="async">` : ICO[TRAITS[s.type] ?? 'cristal']}</span>`;
}

/** une salle voilée par le brouillard : un disque de verre fumé, l'indice deviné (ou rien que la brume) */
function medaillonVoile(ind: keyof typeof INDICES | null): string {
  return `<span class="ex-med brouillee${ind ? ` i-${ind}` : ' brume'}">${icone(ind ?? 'brume')}</span>`;
}

/** la grande image d'une route : l'ennemi en portrait 3:4, sinon la scène ou l'icône peinte */
function visuel(s: Salle, x?: Expedition): string {
  if (x && visionSalle(x, s) === 'indice') return `<span class="ex-visuel brouillee i-${indiceSalle(s)}">${icone(indiceSalle(s))}</span>`;
  const ill = s.ennemi ? illustrationEnnemi(s.ennemi) : null;
  if (ill) return `<span class="ex-visuel portrait"><img src="${ill}" alt="" decoding="async"></span>`;
  const scene = SCENES[s.type];
  if (scene) return `<span class="ex-visuel scene"><img src="${baseSalles}${scene.fichier}.webp" alt="" decoding="async"></span>`;
  const peinte = PEINTES[s.type];
  return `<span class="ex-visuel icone">${peinte ? `<img src="${baseIcones}${peinte}.webp" alt="" decoding="async">` : ICO[TRAITS[s.type] ?? 'cristal']}</span>`;
}

/** le nom affiché sous une salle */
// un groupe porte le nom de son meneur (le badge ×2 / ×3 dit qu'il n'est pas seul) : deux groupes ne s'appellent plus pareil
const nomSalle = (s: Salle) => (s.ennemi && s.type !== 'elite' ? ennemiDef(s.ennemi).nom : NOMS[s.type]);
const nomsGroupe = (s: Salle) => [s.ennemi!, ...(s.escorte ?? [])].map((id) => ennemiDef(id).nom).join(', ');
/** « A et B », « A, B et C » */
const titreGroupe = (s: Salle) => {
  const n = [s.ennemi!, ...(s.escorte ?? [])].map((id) => ennemiDef(id).nom);
  return n.length > 1 ? `${n.slice(0, -1).join(', ')} et ${n[n.length - 1]}` : n[0]!;
};

/** les PV réels des ennemis d'une salle (même calcul que le moteur : force de la Strate, renfort, part du groupe) */
function pvEnnemis(s: Salle, x: Expedition): number[] {
  const groupe = [s.ennemi!, ...(s.escorte ?? [])];
  const base = forceStrate(x.strate) * (x.facteur ?? 1) * (s.type === 'elite' ? 1.15 : 1);
  const force = base * (PV_GROUPE[groupe.length] ?? PV_GROUPE[3]!) * pvProfondeur(base);
  return groupe.map((id) => Math.round(ennemiDef(id).pvMax * force));
}

/** ce qui attend l'escouade dans une salle accessible, en vrais chiffres */
function annonce(s: Salle, x: Expedition): { sur: string; titre: string; texte: string; faits: string[] } {
  const or = (t: string) => `<b class="ex-or">${t}</b>`;
  // le brouillard (30 octobre 2026) : une salle voisine qui ne montre qu'un indice ne dit rien de plus
  if (visionSalle(x, s) === 'indice') {
    const i = INDICES[indiceSalle(s)];
    return { sur: 'Dans le brouillard', titre: i.nom, texte: i.texte, faits: ['On ne sait pas ce qui attend l’escouade avant d’entrer.'] };
  }
  // ce que tout combat gagné rapporte en plus des composants : l'XP de l'escouade et une chance de carte (30 octobre 2026, Luc)
  const xp = Math.round(XP.combat * (1 + 0.25 * (x.strate - 1)));
  const chance = Math.round(COLLECTION.chanceCombat * 100);
  const enPlus = `${or(`+${xp} XP`)} chacun · ${or(`${chance} %`)} de chance de carte`;
  if (s.rodeur && s.ennemi) {
    const d = ennemiDef(s.ennemi);
    const reste = Math.round((x.rodeur?.part ?? 1) * 100);
    return { sur: 'Rôdeur', titre: d.nom, texte: rodeurDef(s.rodeur)?.traces ?? d.tag,
      faits: [`il s’enfuit au bout de <b>${EXPLORER.rodeur.tours} tours</b>`, `il lui reste <b>${reste} %</b> de sa vie`, `faible contre <b class="ex-lignee" style="--c:${COULEUR[BATTU_PAR[d.lignee]]}">${NOMS_LIGNEE[BATTU_PAR[d.lignee]].nom}</b>`, `abattu : ${or('1 trophée')}`] };
  }
  if (s.ennemi) {
    const d = ennemiDef(s.ennemi);
    const faible = BATTU_PAR[d.lignee];
    const pv = pvEnnemis(s, x);
    const faits = [`<span class="ex-pv"><b>${pv.join(' + ')}</b> PV</span>`];
    if (!s.escorte?.length) faits.push(`faible contre <b class="ex-lignee" style="--c:${COULEUR[faible]}">${NOMS_LIGNEE[faible].nom}</b>`);
    if (s.type === 'gardien') return { sur: 'Gardien de la zone', titre: d.nom, texte: d.tag, faits: [...faits, `${or(`+${butinCombat(x.strate, 2)}`)} composants · fin de la Strate`] };
    if (s.type === 'elite') return { sur: 'Salle scellée', titre: d.nom, texte: 'Plus coriace, mais une carte dort derrière.', faits: [...faits, `${or(`+${Math.round(butinCombat(x.strate, 0) * 1.7)}`)} composants · ${or('1 carte')}`] };
    if (s.escorte?.length) return { sur: `Combat · ${s.escorte.length + 1} ennemis`, titre: titreGroupe(s), texte: 'Ils viennent ensemble : choisis qui frapper.', faits: [...faits, `${or(`+${butinCombat(x.strate, 0)}`)} composants`, enPlus] };
    // −7 : deux souvenirs se disputent la salle ; on choisit lequel affronter en entrant
    if (s.double) return { sur: 'Souvenirs doubles', titre: `${d.nom} ou ${ennemiDef(s.double).nom}`, texte: 'Deux souvenirs de la même salle. Choisis celui que l’escouade traverse.', faits: [`${or(`+${butinCombat(x.strate, 0)}`)} composants`, enPlus] };
    return { sur: 'Combat', titre: d.nom, texte: d.tag, faits: [...faits, `${or(`+${butinCombat(x.strate, 0)}`)} composants`, enPlus] };
  }
  switch (s.type) {
    case 'cache':
      if (s.mur) {
        const force = x.porteurs.some((p) => p.pv > 0 && porteurDef(p.id).lignee === 'tech');
        return { sur: 'Cache murée', titre: 'Un abri muré en 2066', texte: force ? 'Ton Augmenté peut forcer le mur : derrière, une réserve intacte.' : 'Il faudrait un Augmenté debout pour forcer le mur.', faits: [`${or(`+${butinCache(x.strate) * (force ? 2 : 1)}`)} composants${force ? ' (le double)' : ''}`, `<span class="ex-vert">+${Math.round(REGLES.salles.cacheSoin * 100)} % de PV</span> pour l’escouade debout`] };
      }
      if (x.strate === 5) return { sur: 'Niche', titre: 'Une niche du Treillis', texte: 'Vidée par les Hauts, presque toujours. Parfois, un cristal y dort encore.', faits: [`${or(`+${butinCache(x.strate)}`)} composants · ${or(`${Math.round(CONTENU.niche * 100)} %`)} de chance de carte`, `<span class="ex-vert">+${Math.round(REGLES.salles.cacheSoin * 100)} % de PV</span>`] };
      return { sur: 'Cache', titre: 'Une cache de fouilleur', texte: 'La voie sûre : quelques composants et de quoi panser l’escouade, sans combat.', faits: [`${or(`+${butinCache(x.strate)}`)} composants${x.strate >= 3 ? ' · parfois un Éclat' : ''}`, `<span class="ex-vert">+${Math.round(REGLES.salles.cacheSoin * 100)} % de PV</span> pour l’escouade debout`] };
    case 'camp': {
      const rendus = x.porteurs.reduce((t, p) => t + Math.min(p.pvMax, Math.max(0, p.pv) + Math.round(p.pvMax * 0.35)) - Math.max(0, p.pv), 0);
      return { sur: 'Campement', titre: 'Un campement', texte: 'L’escouade souffle. On peut remonter d’ici avec tout le butin.', faits: [rendus ? `<span class="ex-vert">+${rendus} PV</span> pour l’escouade (+35 %)` : 'L’escouade est déjà en pleine forme'] };
    }
    case 'archive': return { sur: 'Archives', titre: 'Une salle d’archives', texte: 'Un fragment de l’histoire, à rapporter au district.', faits: [`${or(`+${butinArchive(x.strate)}`)} composants · ${or('1 archive')}`] };
    case 'rencontre': return { sur: 'Rencontre', titre: 'Quelqu’un, dans le noir', texte: 'Un choix à faire. On ne sait pas encore qui.', faits: [] };
    case 'halte': {
      const h = typeof x.halte === 'number' ? halteDef(x.strate, x.halte) : undefined;
      return h
        ? { sur: `Halte ${ROMAIN[h.n - 1]} sur ${nombreHaltes(x.strate)} · passage obligatoire`, titre: h.titre, texte: 'Tous les chemins passent par ici. Un lieu à regarder de près, et un choix à faire.', faits: [`${or(`+${Math.round(XP.elite * (1 + 0.25 * (x.strate - 1)))} XP`)} chacun · un choix`] }
        : { sur: 'Halte · lieu connu', titre: 'Un lieu connu', texte: 'L’escouade connaît cet endroit, maintenant. Elle y passe sans s’arrêter.', faits: [] };
    }
    case 'porte': {
      const n = suitePorte(x.strate);
      const ecl = x.strate >= 10 ? CONTENU.porte.eclatsFond : CONTENU.porte.eclats;
      return { sur: 'Porte ancienne', titre: 'Une porte à Fréquence', texte: `Elle s’ouvre à qui accorde ${n} cartes dont les Fréquences se suivent. Rien à perdre si on échoue.`, faits: [`${or(`+${ecl}`)} Éclat${ecl > 1 ? 's' : ''} · ${or(`+${Math.round(butinCache(x.strate) * CONTENU.porte.composants)}`)} composants`] };
    }
    case 'filon': return { sur: 'Filon', titre: 'Le filon', texte: 'Ce que tu cherchais : la fouille s’achève ici.', faits: x.fouille ? [echap(CIBLES_FOUILLE[x.fouille].texte)] : [] };
    default: return { sur: NOMS[s.type], titre: NOMS[s.type], texte: '', faits: [] };
  }
}

const ROMAIN = ['I', 'II', 'III'];

const CHEVRON = '<svg class="ico ex-fleche" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 5l7 7-7 7"/></svg>';

/**
 * Un Porteur de l'escouade parle (campagne.ts) : à l'entrée de la Strate, puis quand le gardien est à portée.
 * Toujours le même Porteur pour une même expédition (tiré d'après la carte), jamais dans une fouille devant le filon.
 */
function paroleEscouade(x: Expedition): string {
  const c = x.carte!;
  const ici = salleCourante(x);
  const moment = ici.type === 'entree' ? 'entree' : !x.fouille && accessibles(x).some((s) => s.type === 'gardien') ? 'gardien' : null;
  if (!moment) return '';
  const debout = x.porteurs.filter((p) => p.pv > 0).map((p) => p.id);
  const p = paroleDescente(c.zone, moment, debout, c.rng + (moment === 'gardien' ? 1 : 0));
  if (!p) return '';
  const d = porteurDef(p.qui);
  const img = portrait(p.qui);
  return `<div class="ex-parole" style="--c:${COULEUR[d.lignee]}"><span class="ex-pp" aria-hidden="true">${img ? `<img src="${img}" alt="">` : `<b>${echap(d.nom.charAt(0))}</b>`}</span>`
    + `<p><strong>${echap(d.nom)}</strong>${echap(p.texte)}</p></div>`;
}

/**
 * Choisir son chemin sur le plan lui-même (28 octobre 2026, revue : « Où aller ? » était une liste de texte) :
 * on touche une salle qui brille, une fiche s'ouvre en bas (ce qui attend l'escouade, en vrais chiffres) avec « Entrer ».
 * `choisie` : la salle touchée ; s'il n'y a qu'un chemin, il est choisi d'office.
 */
export function htmlExploration(j: Jeu, choisie?: number, ui: { details?: readonly number[]; porte?: readonly number[] } = {}): string {
  const x = j.expedition as Expedition;
  const c = x.carte!;
  const ici = salleCourante(x);
  const voisines = new Set(accessibles(x).map((s) => s.id));
  const libre = !enAttente(x) && x.phase === 'carte' && !x.terminee;
  const routes = libre ? accessibles(x) : [];
  const vue = routes.find((s) => s.id === choisie) ?? (routes.length === 1 ? routes[0] : undefined);
  const zone = ZONES[c.zone]!;
  const rangs = rangsDe(c);
  const decor = decorStrate(x.strate);
  const posX = (s: Salle) => ((s.col + 1) / (s.nCol + 1)) * 100;
  const posY = (s: Salle) => (s.rang / Math.max(1, rangs - 1)) * 100;
  /** une salle qu'on ne visitera plus : sur une rangée déjà passée, ou au même niveau que l'escouade */
  const perdue = (s: Salle) => !s.faite && s.id !== ici.id && s.rang <= ici.rang;
  const reste = rangs - 1 - ici.rang;
  const fin = x.fouille ? 'le filon' : 'le gardien';

  let h = htmlLieu(x) + `<div class="ecran ecran-exploration ex z-${c.zone}">`;

  // ---------- la tête : où l'on est, combien il reste, ce qu'on rapporte ----------
  const g = x.gains;
  const cartes = (g?.elites ?? 0) + (g?.cartes ?? 0);
  h += `<header class="ex-tete"><div class="ex-lieu"><span class="ex-sur">${x.fouille ? `Fouille · ${echap(CIBLES_FOUILLE[x.fouille].nom)}` : `Strate −${x.strate}`}</span>`
    + `<h1>${echap(zone.nom)}</h1>`
    + `<span class="ex-profondeur">${reste > 0 ? `Salle <b>${ici.rang + 1}</b> sur ${rangs} · ${fin} dans <b>${reste}</b> salle${reste > 1 ? 's' : ''}` : `Tu es devant ${fin}`}</span>`
    + teteContenu(j, x) + `</div>`
    + `<div class="ex-butin" aria-label="Butin de l’expédition"><span data-gain="x-composants">${icone('composants')}<b>${x.butin}</b><small>compos.</small></span>`
    + (cartes ? `<span data-gain="x-cartes">${icone('cartes')}<b>${cartes}</b><small>carte${cartes > 1 ? 's' : ''}</small></span>` : '')
    + (g?.eclats ? `<span data-gain="x-eclats">${icone('eclats')}<b>${g.eclats}</b><small>Éclat${g.eclats > 1 ? 's' : ''}</small></span>` : '')
    + (g?.fragment ? `<span>${icone('codex')}<b>1</b><small>archive</small></span>` : '')
    + (g?.vestiges?.length ? `<span class="ex-butin-vestige">${ICO.vestige}<b>${g.vestiges.length}</b><small>Vestige${g.vestiges.length > 1 ? 's' : ''}</small></span>` : '')
    // 27 octobre 2026 : le bouton du bas restait sous les chemins, hors de l'écran sur téléphone → toujours visible en tête
    + (!x.terminee && peutRemonter(x) ? `<button type="button" class="ex-tete-remonter" data-action="retraite" aria-label="Remonter au district${x.butin ? ` avec ${x.butin} composants` : ''}">${ICO.retour}<span>Remonter</span></button>` : '')
    + `</div></header>`;

  // ---------- l'escouade : trois portraits, les vrais PV ----------
  h += '<section class="ex-escouade" aria-label="Escouade">';
  for (const p of x.porteurs) {
    const d = porteurDef(p.id);
    const ko = p.pv <= 0;
    const img = portrait(d.id);
    // la jauge compte sur les PV pleins : la part retirée par l'Usure est hachurée au bout (24 octobre 2026, Bryan : « l'Usure n'a aucune incidence ? »)
    const plein = p.pvMax + (p.usure ?? 0);
    const part = Math.max(0, Math.min(100, (Math.max(0, p.pv) / plein) * 100));
    const partUsure = p.usure ? (100 * p.usure) / plein : 0;
    const bas = !ko && part <= 30;
    h += `<div class="ex-porteur${ko ? ' ko' : ''}${bas ? ' bas' : ''}" data-porteur="${p.id}" style="--c:${COULEUR[d.lignee]}">`
      + `<span class="ex-portrait" aria-hidden="true">${img ? `<img src="${img}" alt="">` : `<b>${echap(d.nom.charAt(0))}</b>`}</span>`
      + `<span class="ex-p-infos"><strong>${echap(d.nom)}</strong>`
      + `<span class="ex-p-pv" aria-label="${ko ? 'À terre' : `${p.pv} PV sur ${p.pvMax}${p.usure ? `, l’Usure en retire ${p.usure}` : ''}`}">${ko ? 'À terre' : `<b>${p.pv}</b> / ${p.pvMax}${p.usure ? `<small class="ex-p-usure" title="PV retirés par l’Usure">−${p.usure}</small>` : ''}`}</span>`
      + `<span class="ex-barre" aria-hidden="true"><i style="width:${part.toFixed(1)}%"></i>${partUsure ? `<i class="ex-usure" style="width:${partUsure.toFixed(1)}%"></i>` : ''}</span></span></div>`;
  }
  h += '</section>';

  // ---------- la carte ----------
  h += `<section class="ex-carte" aria-label="Carte de la Strate" style="--rangs:${rangs}${decor ? `;--decor:url(${decor})` : ''}"><span class="ex-decor" aria-hidden="true"></span><span class="ex-sur ex-carte-titre">Plan de la Strate</span><div class="ex-plan">`;
  let fils = '';
  let halos = '';
  // 28 octobre 2026 : les couloirs se perdaient dans les décors peints → un liseré sombre sous chaque trait
  let ombres = '';
  for (const s of c.salles) {
    for (const v of s.voisins) {
      const t = c.salles[v]!;
      if (t.rang < s.rang) continue;
      const etat = s.id === ici.id && voisines.has(v) && libre ? 'ouvert' : s.faite && t.faite ? 'parcouru' : perdue(t) || perdue(s) ? 'perdu' : 'avenir';
      const x1 = posX(s), y1 = posY(s), x2 = posX(t), y2 = posY(t), ym = (y1 + y2) / 2;
      const d = `M${x1.toFixed(2)} ${y1.toFixed(2)}C${x1.toFixed(2)} ${ym.toFixed(2)} ${x2.toFixed(2)} ${ym.toFixed(2)} ${x2.toFixed(2)} ${y2.toFixed(2)}`;
      if (etat === 'ouvert' || etat === 'parcouru') halos += `<path class="c-${etat} halo" d="${d}"/>`;
      ombres += `<path class="ombre o-${etat}" d="${d}"/>`;
      fils += `<path class="c-${etat}" d="${d}"/>`;
    }
  }
  // −9 : le fil qui relie deux salles côte à côte (on le suit une fois)
  for (const s of c.salles) {
    if (s.fil === undefined || s.fil < s.id) continue;
    const t = c.salles[s.fil]!;
    const d = `M${posX(s).toFixed(2)} ${posY(s).toFixed(2)}Q${((posX(s) + posX(t)) / 2).toFixed(2)} ${(posY(s) + 4).toFixed(2)} ${posX(t).toFixed(2)} ${posY(t).toFixed(2)}`;
    fils += `<path class="c-fil${x.filPris ? ' pris' : ''}" d="${d}"/>`;
  }
  h += `<svg class="ex-couloirs" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">${ombres}${halos}${fils}</svg>`;

  for (const s of c.salles) {
    const acces = voisines.has(s.id) && libre;
    const etat = s.id === ici.id ? 'ici' : acces ? 'accessible' : s.faite ? 'faite' : perdue(s) ? 'perdue' : 'loin';
    // le brouillard (30 octobre 2026) : une salle voilée ne dit rien de son type, même dans ses classes
    const vision = visionSalle(x, s);
    const classes = `ex-salle ${vision === 'claire' ? `t-${s.type}` : `voilee v-${vision}`} ${etat}${vue?.id === s.id ? ' choisie' : ''}`;
    let label: string;
    let dedans: string;
    let nom: string;
    if (vision === 'claire') {
      label = `${s.condition && CONDITIONS[s.condition] ? `${CONDITIONS[s.condition]!.nom} · ` : ''}${NOMS[s.type]}${s.escorte?.length ? ` : un groupe (${nomsGroupe(s)})` : s.ennemi ? ` : ${ennemiDef(s.ennemi).nom}` : ''}${etat === 'ici' ? ' (tu es ici)' : s.faite ? ' (visitée)' : ''}`;
      dedans = medaillon(s);
      if (s.type === 'elite') dedans += `<span class="ex-badge sceau" aria-hidden="true">${ICO.verrou}</span>`;
      if (s.escorte?.length) dedans += `<span class="ex-badge groupe" aria-hidden="true">×${s.escorte.length + 1}</span>`;
      if (s.condition) { const ic = iconeCondition(s.condition); dedans += `<span class="ex-badge condition${ic ? ' peinte' : ''}" aria-hidden="true">${ic ? `<img src="${ic}" alt="" decoding="async">` : ICO.cristal}</span>`; }
      if (s.mur) dedans += `<span class="ex-badge mur" aria-hidden="true">${ICO.mur}</span>`;
      if (s.double) dedans += `<span class="ex-badge double" aria-hidden="true">${ICO.fil}</span>`;

      nom = etat === 'ici' ? 'Vous êtes ici' : nomSalle(s);
    } else {
      const ind = vision === 'indice' ? indiceSalle(s) : null;
      label = ind ? `${INDICES[ind].nom} : on ne sait pas ce qui attend` : 'Une salle dans la brume';
      dedans = medaillonVoile(ind);
      nom = ind ? INDICES[ind].nom : '';
    }
    // un passage que repère un Porteur debout : il le voit même dans le brouillard, dès que la salle est à portée
    if (reperentPassage(x, s).length && (etat === 'accessible' || etat === 'ici')) { dedans += `<span class="ex-badge secret" aria-hidden="true">${ICO.fissure}</span>`; label += ' · un passage repéré'; }
    // la marque de la quête se voit même dans le brouillard
    if (s.quete && !x.gains?.etape && !s.faite) { dedans += `<span class="ex-badge quete" aria-hidden="true">${ICO.quete}</span>`; label += ' · la marque de la quête'; }
    // Explorer (31 octobre 2026) : le Vestige (losange turquoise, en haut à gauche) et les traces du Rôdeur (griffures rouges, en haut)
    // se voient eux aussi dans le brouillard ; formes et couleurs bien distinctes de l'étoile dorée de la quête (revue du game designer)
    if (s.vestige && !s.faite && !x.gains?.vestiges?.includes(s.vestige)) { dedans += `<span class="ex-badge vestige" aria-hidden="true">${ICO.vestige}</span>`; label += ' · un Vestige'; }
    if (s.rodeur && !s.faite) { dedans += `<span class="ex-badge rodeur" aria-hidden="true">${ICO.griffes}</span>`; label += ` · les traces de ${rodeurDef(s.rodeur)?.dans ?? 'un Rôdeur'}`; }
    if (nom) dedans += `<span class="ex-nom">${echap(nom)}</span>`;
    const style = `left:${posX(s).toFixed(2)}%;top:${posY(s).toFixed(2)}%`;
    h += acces
      ? `<button type="button" class="${classes}" style="${style}" data-action="salle-voir" data-id="${s.id}" aria-pressed="${vue?.id === s.id}" aria-label="Voir : ${echap(label)}">${dedans}</button>`
      : `<span class="${classes}" style="${style}" role="img" aria-label="${echap(label)}" title="${echap(label)}">${dedans}</span>`;
  }
  h += `</div></section>`;

  // ---------- le panneau : la rencontre en cours, ou la suite du chemin ----------
  h += `<section class="ex-panneau" aria-live="polite">`;
  const halte = halteEnCours(j);
  if (halte) h += htmlHalte(j, x, ui.details ?? []);
  else if (x.porte) h += htmlPorte(x, ui.porte ?? []);
  else if (x.rencontre) {
    const r = RENCONTRES[x.rencontre]!(j);
    h += `<div class="ex-rencontre"><span class="ex-visuel scene"><img src="${baseSalles}rencontre.webp" alt="" decoding="async"></span>`
      + `<div><span class="ex-sur">Rencontre</span><h2>${echap(r.titre)}</h2></div></div>`
      + `<p class="ex-recit">${echap(r.texte)}</p><div class="ex-choix">`
      + r.options.map((o, k) => {
        // une option qui coûte des composants du butin : grisée, avec ce qui manque, si le butin ne suffit pas
        // (24 octobre 2026 : le bouton « ne fonctionnait pas », le refus ne s'affichait nulle part)
        const cout = Number(/\((\d+) composants\)/.exec(o)?.[1] ?? 0);
        const manque = cout > x.butin ? cout - x.butin : 0;
        return `<button type="button" class="ex-choix-btn${manque ? ' manque' : ''}" data-action="repondre" data-id="${k}"${manque ? ' disabled' : ''}><span>${echap(o)}`
          + (manque ? `<small>Le butin de l’expédition n’a que ${x.butin} composants : il en manque ${manque}.</small>` : '') + `</span>${CHEVRON}</button>`;
      }).join('') + `</div>`;
  } else {
    h += paroleEscouade(x);
    if (x.recit) h += `<p class="ex-recit">${echap(x.recit)}</p>`;
    // juste après la victoire dans la salle marquée : ce que l'escouade a trouvé (31 octobre 2026)
    const qt = x.gains?.etape && x.carte!.salles[x.carte!.position]?.quete ? etapeQueteTrouvee(j, x.strate) : null;
    if (qt) h += `<div class="ex-quete-trouvee" role="status">${ICO.quete}<div><small>Marque de la quête relevée · étape ${qt.etape} sur ${qt.total}</small><b>${echap(qt.nom)}</b><p>${echap(qt.texte)}</p><small>Elle sera rangée dans la quête au retour au district.</small></div></div>`;
    if (libre) h += htmlPassage(x);
    if (libre && vue) {
      // la fiche de la salle touchée : en bas de l'écran sur téléphone, dans la colonne de droite sur PC
      const a = annonce(vue, x);
      const voilee = visionSalle(x, vue) !== 'claire';
      const cond = !voilee && vue.condition && CONDITIONS[vue.condition] ? CONDITIONS[vue.condition]! : null;
      const entrer = voilee ? 'Avancer dans le brouillard' : vue.type === 'gardien' ? 'Affronter le gardien' : vue.ennemi ? 'Combattre' : vue.type === 'camp' ? 'S’arrêter au campement' : 'Entrer';
      h += `<div class="ex-fiche ${voilee ? 'voilee' : `t-${vue.type}`}" role="region" aria-label="Salle choisie">`
        + (routes.length > 1 ? `<button type="button" class="ex-fiche-fermer" data-action="salle-voir" data-id="-1" aria-label="Fermer la fiche">${ICO.fermer}</button>` : '')
        + `<div class="ex-fiche-corps">${visuel(vue, x)}`
        + `<span class="ex-route-txt"><span class="ex-sur">${echap(a.sur)}</span><strong>${echap(a.titre)}</strong>`
        + (a.texte ? `<em>${echap(a.texte)}</em>` : '')
        + (a.faits.length ? `<span class="ex-faits">${a.faits.map((f) => `<span>${f}</span>`).join('')}</span>` : '')
        + (vue.quete && !x.gains?.etape && queteDef(x.strate) ? `<span class="ex-condition ex-c-quete">${ICO.quete}<span><b>${echap(queteDef(x.strate)!.nom)}</b> : la marque de la quête est ici${vue.ennemi ? ' (gagne le combat pour la relever)' : ''}.</span></span>` : '')
        + (vue.vestige && !x.gains?.vestiges?.includes(vue.vestige) ? `<span class="ex-condition ex-c-vestige">${ICO.vestige}<span><b>Un Vestige</b> dort ici${vue.ennemi ? ' (gagne le combat pour le ramasser)' : vue.type === 'porte' ? ' (ouvre la porte pour le ramasser)' : ''}.</span></span>` : '')
        + (reperentPassage(x, vue).length ? `<span class="ex-condition ex-c-secret">${ICO.fissure}<span><b>${echap(porteurDef(reperentPassage(x, vue)[0]!).nom)}</b> y repère un passage caché.</span></span>` : '')
        + (cond ? `<span class="ex-condition">${iconeCondition(cond.id) ? `<img class="ex-cond-ico" src="${iconeCondition(cond.id)}" alt="" decoding="async">` : ICO.cristal}<span><b>${echap(cond.nom)}</b> : ${echap(cond.texte)}</span></span>` : '')
        + `</span></div>`
        + (!voilee && vue.double
          ? `<div class="ex-doubles">${[vue.ennemi!, vue.double].map((e, k) => `<button type="button" class="btn ${k ? 'sec' : 'prim'} large ex-entrer" data-action="salle" data-id="${vue.id}"${k ? ' data-second="1"' : ''}>${echap(`Affronter ${ennemiDef(e).nom}`)}${CHEVRON}</button>`).join('')}</div>`
          : `<button type="button" class="btn prim large ex-entrer" data-action="salle" data-id="${vue.id}">${echap(entrer)}${CHEVRON}</button>`)
        + `</div>`;
    } else if (libre) {
      h += `<p class="ex-indice">${ICO.cristal}<span>Touche une salle qui brille sur le plan : tu verras ce qui t’y attend avant d’entrer${x.strate >= REGLES.brouillard.indices ? ', ou du moins ce que le brouillard en laisse deviner' : ''}.${routes.length > 1 ? ` <b>${routes.length} chemins</b>` : ''}</span></p>`;
    }
  }
  if (x.terminee) h += `<button type="button" class="btn prim large ex-sortie" data-action="remonter">${ICO.cristal}Remonter avec le filon</button>`;
  else if (peutRemonter(x)) {
    h += `<div class="ex-remonter"><p>${ici.type === 'camp' ? 'Le campement est une sortie' : 'L’entrée est une sortie'} : tu peux rentrer maintenant avec tout ce que tu as trouvé.</p>`
      + `<button type="button" class="btn sec ex-retraite" data-action="retraite">${ICO.retour}${x.butin ? `Remonter avec ${x.butin} composant${x.butin > 1 ? 's' : ''}` : 'Remonter au district'}</button></div>`;
  } else if (libre) h += `<p class="ex-note">Les PV remontent surtout aux campements (et parfois lors d’une rencontre). On ne peut remonter que depuis l’entrée ou un campement.</p>`;
  h += `</section>`;

  return h + `</div>`;
}

// ---------- Le contenu des Strates (31 octobre 2026, src/core/strates.ts) ----------

/** Sous le nom de la Strate : sa particularité, et la quête en cours (●●○) */
function teteContenu(j: Jeu, x: Expedition): string {
  let h = '';
  const p = particularite(x.strate);
  // une ligne chacune, sans phrase (28 octobre 2026, Bryan : écrans « surchargés pour rien ») ; la phrase est dans le récit d'entrée
  if (p) h += `<span class="ex-partic" title="${echap(p.texte)}">${ICO.strate}<b>${echap(p.nom)}</b></span>`;
  const q = queteDef(x.strate);
  const faites = j.quetes?.[x.strate] ?? 0;
  if (q && faites < q.etapes.length && x.carte!.salles.some((s) => s.quete)) {
    const n = faites + (x.gains?.etape ? 1 : 0);
    h += `<span class="ex-quete${x.gains?.etape ? ' trouvee' : ''}" title="${echap(q.but)}">${ICO.quete}<b>${echap(q.nom)}</b>`
      + `<span class="ex-points" aria-label="${n} étape${n > 1 ? 's' : ''} sur ${q.etapes.length}">${q.etapes.map((_, k) => `<i${k < n ? ' class="ok"' : ''}></i>`).join('')}</span></span>`;
  }
  // Explorer (31 octobre 2026) : les Vestiges de la Strate (◆ 2 / 5), le gardien éveillé
  if (!x.fouille && vestigesDe(x.strate).length) {
    const n = vestigesDe(x.strate).filter((v) => j.vestiges?.includes(v.id) || x.gains?.vestiges?.includes(v.id)).length;
    const poses = x.carte!.salles.filter((s) => s.vestige).length;
    if (poses || n < 5) h += `<span class="ex-vestiges${n >= 5 ? ' complet' : ''}" title="Vestiges de la Strate">${ICO.vestige}<b>Vestiges ${n} / 5</b>${x.gains?.vestiges?.length ? `<small>+${x.gains.vestiges.length} cette descente</small>` : ''}</span>`;
  }
  if (x.eveille) h += `<span class="ex-eveille">${ICO.lueur}<b>Gardien éveillé</b><small>plus fort, plus généreux</small></span>`;
  if (x.releve) h += `<span class="ex-vestiges complet">${ICO.vestige}<b>Strate relevée</b><small>tout le plan est visible</small></span>`;
  return h;
}

/** Le portrait rond d'un Porteur (ou de personne : le récit) */
function rond(qui: string): string {
  if (!qui) return `<span class="hx-pp recit" aria-hidden="true">${ICO.halte}</span>`;
  const img = portrait(qui);
  return `<span class="hx-pp" aria-hidden="true" style="--c:${COULEUR[porteurDef(qui).lignee]}">${img ? `<img src="${img}" alt="">` : `<b>${echap(porteurDef(qui).nom.charAt(0))}</b>`}</span>`;
}

/** La Halte : le décor de la Strate, des détails à toucher (chacun fait parler un Porteur debout), puis un choix */
function htmlHalte(j: Jeu, x: Expedition, vus: readonly number[]): string {
  const h = halteEnCours(j)!;
  const debout = x.porteurs.filter((p) => p.pv > 0).map((p) => p.id);
  const drapeaux = j.drapeaux ?? [];
  let r = `<div class="ex-halte"><div class="hx-scene" style="--decor:url(${decorStrate(x.strate)})"><span class="ex-sur">Halte ${ROMAIN[h.n - 1]} sur ${nombreHaltes(x.strate)} · Strate −${x.strate}</span><h2>${echap(h.titre)}</h2></div>`
    + `<p class="ex-recit hx-recit">${echap(h.recit)}</p><div class="hx-details">`;
  h.details.forEach((dt, k) => {
    if (vus.includes(k)) {
      const v = voixDetail(dt, debout, drapeaux);
      r += `<div class="hx-voix"${v.qui ? ` style="--c:${COULEUR[porteurDef(v.qui).lignee]}"` : ''}>${rond(v.qui)}<p><small>${echap(dt.nom)}</small>${v.qui ? `<strong>${echap(porteurDef(v.qui).nom)}</strong>` : ''}${echap(v.texte)}</p></div>`;
    } else {
      r += `<button type="button" class="hx-detail" data-action="halte-detail" data-id="${k}">${ICO.lueur}<span>${echap(dt.nom)}</span><small>Regarder</small></button>`;
    }
  });
  r += `</div><span class="ex-sur hx-choisir">Que fais-tu ?</span><div class="ex-choix">`
    + h.choix.map((c, k) => `<button type="button" class="ex-choix-btn hx-choix" data-action="halte-choix" data-id="${k}"><span>${echap(c.texte)}<small class="hx-gain">${echap(gainChoixHalte(j, k))}</small></span>${CHEVRON}</button>`).join('')
    + `</div></div>`;
  return r;
}

/** Une porte à Fréquence : 5 cartes tirées, en choisir 3 (4 au fond) dont les Fréquences se suivent */
function htmlPorte(x: Expedition, choisies: readonly number[]): string {
  const p = x.porte!;
  const n = suitePorte(x.strate);
  const sel = choisies.filter((i) => p.main.includes(i));
  const possible = !!mainAccordable(x);
  let r = `<div class="ex-porte"><div class="ex-rencontre"><span class="ex-visuel icone">${ICO.porte}</span><div><span class="ex-sur">Porte ancienne</span><h2>Accorde ${n} Fréquences</h2></div></div>`
    + `<p class="ex-recit">Choisis ${n} cartes dont les Fréquences se suivent, comme une suite en combat (par exemple ${Array.from({ length: n }, (_, k) => k + 4).join(', ')}). Une carte à Accord ∗ prolonge toute suite.</p>`
    + `<div class="px-cases" aria-label="${sel.length} carte${sel.length > 1 ? 's' : ''} choisie${sel.length > 1 ? 's' : ''} sur ${n}">`
    + Array.from({ length: n }, (_, k) => { const g = sel[k] !== undefined ? x.deck[sel[k]!] : undefined; return `<span class="px-case${g ? ' pleine' : ''}">${g ? frequences(g) : ''}</span>`; }).join('')
    + `</div><div class="px-main">`;
  for (const i of p.main) {
    const g = x.deck[i]!;
    const c = g.porteur ? COULEUR[porteurDef(g.porteur).lignee] : COULEUR.neutre;
    const on = sel.includes(i);
    r += `<button type="button" class="px-carte${on ? ' choisie' : ''}" data-action="porte-carte" data-id="${i}" aria-pressed="${on}" style="--c:${c}">${frequences(g)}<span>${echap(g.nom)}</span></button>`;
  }
  r += `</div>`
    + (!possible ? `<p class="px-aide">${ICO.aide}<span>Aucune suite de ${n} dans cette main.${p.relance ? ' La porte reste fermée pour cette fois.' : ' Tu peux tirer une autre main.'}</span></p>` : '')
    + `<div class="px-actions"><button type="button" class="btn prim large" data-action="porte-ouvrir"${sel.length === n ? '' : ' disabled'}>${ICO.porte}Ouvrir la porte</button>`
    + `<div class="px-sec">${p.relance ? '' : `<button type="button" class="btn sec" data-action="porte-relancer">${ICO.repiocher}Autre main</button>`}`
    + `<button type="button" class="btn sec" data-action="porte-passer">Laisser la porte</button></div></div></div>`;
  return r;
}

/** Les Fréquences d'une carte, dans de petits cristaux colorés (∗ pour l'Accord) */
function frequences(g: Expedition['deck'][number]): string {
  if (g.effet?.type === 'accord' || g.effet?.type === 'diapason') return `<b class="px-f libre">${g.effet.type === 'accord' ? '∗' : '='}</b>`;
  return (g.fs?.length ? g.fs : [g.f]).map((f) => `<b class="px-f" style="--fc:${couleurFrequence(f)}">${f}</b>`).join('');
}

/** Un passage secret repéré dans la salle où se trouve l'escouade : le Porteur qui l'a vu le dit */
function htmlPassage(x: Expedition): string {
  const ici = salleCourante(x);
  const qui = reperentPassage(x, ici)[0];
  const def = ici.secret ? secretDef(ici.secret) : undefined;
  if (!qui || !def) return '';
  return `<div class="ex-passage" style="--c:${COULEUR[porteurDef(qui).lignee]}">${rond(qui)}<div><span class="ex-sur">${ICO.fissure}${echap(def.nom)}</span>`
    + `<p><strong>${echap(porteurDef(qui).nom)}</strong>${echap(def.voix[qui]!)}</p>`
    + `<button type="button" class="btn sec ex-suivre" data-action="passage">Suivre le passage${CHEVRON}</button></div></div>`;
}
