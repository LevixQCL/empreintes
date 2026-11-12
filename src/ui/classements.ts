// Le Grand Tableau (23 octobre 2026) : l'écran des classements entre directeurs.
// On y arrive par le menu « Plus », par la Tour du Noyau (« ton rang ») et par la fiche de la Strate en haut de l'écran.
// Dans le lore : les écrans des marchés de Vertiga comparent les districts. Les Hauts aiment les palmarès.
//
// Principes retenus après étude (Clash Royale, Hearthstone, Duolingo, Diablo IV, Slay the Spire) :
//  - plusieurs petits tableaux plutôt qu'un seul : chacun peut être premier quelque part ;
//  - « toi et ceux qui t'entourent », avec l'écart au joueur juste devant : on vise qui on peut rattraper ;
//  - deux horloges : le record de toujours (qui ne redescend jamais) et la semaine (tout le monde repart de zéro le lundi) ;
//  - entre amis (une dizaine de joueurs), toute la liste, pas de ligues : elles viendront au-delà d'une trentaine ;
//  - à profondeur égale, le premier arrivé passe devant, et la date est montrée ;
//  - aucun e-mail : un nom de directeur choisi, et on peut se retirer du Tableau à tout moment.

import { PORTEURS, porteurDef } from '../core/donnees';
import {
  FLECHE, TABLEAUX, VALEUR_DECOUVERTE, VALEUR_METAL, VALEUR_NIVEAU, classer, ecartDevant, fenetre, gardienVaincu, strateDe,
  demiStrates, texteValeur, valeurRegistre, zoneProfondeur, type Entree, type Periode, type TableauId,
} from '../core/classements';
import { NOMS_RARETE, RARETES } from '../core/collection';
import { lundiSuivant, semaineDe, type Jeu } from '../core/jeu';
import { avatar, coquille, duree, ent, type EcranDistrict } from './coquille';
import { ICO, icone } from './icones';
import { fondTableau } from './art';
import { echap } from './outils';
import { langue, t as tr, locale } from '../core/i18n';

/** L'état du Tableau en ligne, tenu par main.ts */
export interface GrandTableau {
  tableau: TableauId;
  periode: Periode;
  etat: 'repos' | 'chargement' | 'ok' | 'erreur';
  entrees: Entree[];
  /** dernière lecture réussie (ms) */
  lu: number;
  erreur: string;
  /** le formulaire du nom de directeur est ouvert */
  edition: boolean;
  /** la fiche « comment ça se calcule » est ouverte */
  regles: boolean;
  /** « Ne plus apparaître » attend sa confirmation */
  retrait: boolean;
  /** la feuille du pseudo s'est ouverte d'elle-même, juste après la connexion (texte d'accueil, « Plus tard ») */
  accueil?: boolean;
}

export const tableauVide = (): GrandTableau => ({ tableau: 'profondeur', periode: 'total', etat: 'repos', entrees: [], lu: 0, erreur: '', edition: false, regles: false, retrait: false });

const connuPorteur = (id: string) => PORTEURS.some((p) => p.id === id) ? id : 'ilka';
const ilYa = (ms: number) => ms < 60_000 ? tr('à l’instant') : tr`il y a ${duree(ms)}`;
const dateCourte = (ms: number) => ms ? new Date(ms).toLocaleDateString(locale(), { day: 'numeric', month: 'short' }) : '';

/** Le rang de ce joueur dans un tableau (pour la Tour du Noyau et la fiche de la Strate), ou null */
function monRang(g: GrandTableau, uid: string | null, t: TableauId, now: number): { rang: number; sur: number } | null {
  if (!uid || !g.entrees.length) return null;
  const l = classer(g.entrees, t, 'total', semaineDe(now));
  const i = l.findIndex((x) => x.e.uid === uid);
  return i < 0 ? null : { rang: l[i]!.rang, sur: l.length };
}

/** « 1er », « 2e » */
const ordinal = (n: number) => {
  if (langue() === 'en') {
    const s = n % 100 >= 11 && n % 100 <= 13 ? 'th' : ['th', 'st', 'nd', 'rd'][n % 10] ?? 'th';
    return `${n}<sup>${s}</sup>`;
  }
  return `${n}<sup>${n === 1 ? 'er' : 'e'}</sup>`;
};

/** Le petit bandeau de la Tour du Noyau : ton rang en profondeur, et l'entrée vers le Tableau */
export function bandeauTableau(e: EcranDistrict, g: GrandTableau, uid: string | null): string {
  const r = monRang(g, uid, 'profondeur', e.now);
  const texte = r ? tr`${ordinal(r.rang)} sur ${r.sur} en profondeur` : e.compte.actif ? tr('Compare ta profondeur aux autres directeurs') : tr('Ton record de profondeur');
  return `<button type="button" class="gt-bandeau" data-action="classements" data-id="profondeur"><span class="gt-bandeau-ico">${ICO.monter}</span>`
    + `<span><small>${tr`Le Grand Tableau`}</small><strong>${texte}</strong></span>${ICO.lancer}</button>`;
}

// ---------- L'écran ----------

export function htmlClassements(e: EcranDistrict, g: GrandTableau, uid: string | null): string {
  const j = e.j;
  const semaine = semaineDe(e.now);
  const def = TABLEAUX.find((t) => t.id === g.tableau) ?? TABLEAUX[0]!;
  // le compte invisible ne publie rien : un pseudo réservé par une partie qui peut disparaître serait perdu pour tous
  const enLigne = e.compte.actif && !!e.compte.utilisateur && !e.compte.utilisateur.anonyme;
  const publie = !!(j.directeur?.public && j.directeur.nom);
  const nom = publie ? j.directeur!.nom : tr('Toi');

  let h = `<header class="gt-tete"><img class="gt-fond" src="${fondTableau}" alt="" decoding="async">`
    + `<div class="gt-titres"><span class="surtitre">${tr`Écrans des marchés · Vertiga`}</span><h1>${tr`Le Grand Tableau`}</h1>`
    + `<p>${tr`Les districts comparés, chaque jour, sur tous les écrans de la ville. Les Hauts adorent les palmarès.`}</p></div>`
    + carteDirecteur(j, g, uid, nom, publie, semaine) + `</header>`;

  // les quatre tableaux
  h += `<div class="gt-onglets" role="tablist" aria-label="${tr`Classements`}">` + TABLEAUX.map((t) =>
    `<button type="button" role="tab" class="gt-onglet${t.id === def.id ? ' actif' : ''}${t.ouvert ? '' : ' grise'}" aria-selected="${t.id === def.id}" data-action="gt-tableau" data-id="${t.id}">`
    + `<span class="gt-onglet-ico">${t.ouvert ? ICO[ICONE_TABLEAU[t.id]] : ICO.verrou}</span><span>${t.nom}</span>${t.ouvert ? '' : `<small>${tr`bientôt`}</small>`}</button>`).join('') + `</div>`;

  if (!def.ouvert) return coquille(e, h + apercuJoutes(), 'gt');

  // la période
  const fin = lundiSuivant(e.now) - e.now;
  h += `<div class="gt-periode"><div class="segments-choix deux" role="tablist" aria-label="${tr`Période`}">`
    + `<button type="button" role="tab" class="seg${g.periode === 'total' ? ' actif' : ''}" aria-selected="${g.periode === 'total'}" data-action="gt-periode" data-id="total">${tr`Record`}</button>`
    + `<button type="button" role="tab" class="seg${g.periode === 'semaine' ? ' actif' : ''}" aria-selected="${g.periode === 'semaine'}" data-action="gt-periode" data-id="semaine">${tr`Cette semaine`}</button></div>`
    + `<p class="gt-explique">${g.periode === 'total' ? echap(def.texte) : `${tr`${def.id === 'profondeur' ? tr('Les Strates gagnées') : def.id === 'fleche' ? tr('Les quais de record gagnés sur la Flèche') : tr('Les points de Registre gagnés')} depuis lundi. Tout le monde repart de zéro dans`} <b>${duree(fin)}</b>.`}`
    + ` <button type="button" class="lien" data-action="gt-regles" aria-expanded="${g.regles}">${ICO.aide}${tr`Comment ça se calcule ?`}</button></p>`
    + (g.regles ? regles(def.id) : '') + `</div>`;

  // grand écran (7 novembre 2026) : la vitrine, les onglets et la période à gauche, le classement à droite ;
  // sur téléphone et petit PC, les deux colonnes s'effacent (display:contents) et tout reste empilé
  h = `<div class="gt-cols"><div class="gt-col-g">${h}</div><div class="gt-col-d">`;

  // la liste
  if (!e.compte.actif) h += seul(j, def.id, g.periode, semaine, tr('Le Tableau en ligne n’est pas branché sur cette version.'), '');
  else if (!enLigne) h += seul(j, def.id, g.periode, semaine, e.compte.utilisateur?.anonyme ? tr('Protège ta partie pour te mesurer aux autres directeurs.') : tr('Connecte-toi pour te mesurer aux autres directeurs.'),
    `<button type="button" class="btn prim" data-action="gt-connexion">${ICO.compte}${e.compte.utilisateur?.anonyme ? tr('Protéger ma partie') : tr('Se connecter')}</button>`);
  else if (!publie) h += seul(j, def.id, g.periode, semaine, tr('Choisis ton pseudo pour apparaître sur le Tableau.'),
    `<button type="button" class="btn prim" data-action="gt-nom">${ICO.ok}${tr`Choisir mon pseudo`}</button>`);
  else h += liste(g, uid, def.id, semaine, e.now);

  // réglages
  if (enLigne) {
    h += `<footer class="gt-pied">`
      + (g.lu ? `<span>${g.etat === 'chargement' ? tr('Mise à jour…') : tr`Mis à jour ${ilYa(e.now - g.lu)}`}</span>` : '')
      + `<button type="button" class="lien" data-action="gt-actualiser"${g.etat === 'chargement' ? ' disabled' : ''}>${tr`Actualiser`}</button>`
      + (publie ? `<button type="button" class="lien" data-action="gt-nom">${tr`Changer de pseudo`}</button><button type="button" class="lien" data-action="gt-retirer" aria-expanded="${g.retrait}">${tr`Ne plus apparaître`}</button>` : '')
      + (publie && g.retrait ? `<div class="confirmer" role="group" aria-label="${tr`Confirmer`}"><span>${tr`Retirer ton district du Tableau ? Tes records restent dans ta partie, et tu pourras revenir.`}</span>`
        + `<button type="button" class="btn sec petit" data-action="gt-retirer-ok">${tr`Me retirer`}</button><button type="button" class="btn sec petit" data-action="gt-retirer">${tr`Annuler`}</button></div>` : '')
      + `</footer>`;
  }
  h += `</div></div>`;
  return coquille(e, h, 'gt');
}

const ICONE_TABLEAU: Record<TableauId, 'strate' | 'cartes' | 'atk' | 'fleche'> = { profondeur: 'strate', registre: 'cartes', joutes: 'atk', fleche: 'fleche' };

/** La carte du directeur : son Porteur de tête, son nom, ses rangs et ses records */
function carteDirecteur(j: Jeu, g: GrandTableau, uid: string | null, nom: string, publie: boolean, semaine: number): string {
  const p = j.palmares;
  const prof = p?.profondeur ?? j.strate * 2;
  const reg = p?.registre ?? valeurRegistre(j.collection).points;
  const rang = (t: TableauId) => {
    if (!publie || !uid) return '';
    const l = classer(g.entrees, t, 'total', semaine);
    const x = l.find((y) => y.e.uid === uid);
    return x ? `<em class="gt-rang r${Math.min(x.rang, 4)}">${ordinal(x.rang)}</em>` : '';
  };
  return `<div class="gt-moi">${avatar(connuPorteur(j.escouade?.[0] ?? 'ilka'), 52)}<div class="gt-moi-nom"><small>${tr`Directeur`}</small><strong>${echap(nom)}</strong></div>`
    + `<dl class="gt-records"><div><dt>${tr`Profondeur`}</dt><dd>${rang('profondeur')}<b>−${strateDe(prof)}</b>${gardienVaincu(prof) ? `<i title="${tr`gardien vaincu`}">${ICO.ok}</i>` : ''}</dd></div>`
    + `<div><dt>${tr`Registre`}</dt><dd>${rang('registre')}<b>${ent(reg)}</b></dd></div></dl></div>`;
}

/** Sans le Tableau en ligne : ses propres records, et ce qu'il faut pour se comparer */
function seul(j: Jeu, t: TableauId, per: Periode, semaine: number, message: string, bouton: string): string {
  const p = j.palmares;
  const sem = p && p.semaine === semaine;
  const rec = j.fleche?.record ?? 0;
  const v = t === 'fleche'
    ? (per === 'total' ? (rec > 1 ? tr`Quai ${rec} de la Flèche` : tr('Pas encore monté à la Flèche')) : tr`+${sem ? Math.max(0, rec - (p!.flecheDebut ?? 0)) : 0} quais cette semaine`)
    : t === 'profondeur'
    ? (per === 'total' ? tr`Strate −${strateDe(p?.profondeur ?? j.strate * 2)}` : tr`+${demiStrates(sem ? p!.profondeur - p!.profondeurDebut : 0)} Strate cette semaine`)
    : (per === 'total' ? `${ent(p?.registre ?? 0)} points` : tr`+${ent(sem ? p!.registre - p!.registreDebut : 0)} points cette semaine`);
  return `<section class="gt-seul"><span class="gt-seul-ico">${icone(t === 'profondeur' ? 'strate' : t === 'fleche' ? 'fleche' : 'cartes')}</span><strong>${v}</strong>`
    + (t === 'registre' ? detailRegistre(j) : '') + `<p>${message}</p>${bouton}</section>`;
}

/** Le Registre en détail : combien d'exemplaires par métal, et les cartes découvertes */
function detailRegistre(j: Jeu): string {
  const r = valeurRegistre(j.collection);
  return `<ul class="gt-metaux">${RARETES.map((m) => `<li class="m-${m}"><b>${r.parMetal[m]}</b><small>${NOMS_RARETE[m]}</small></li>`).join('')}</ul>`
    + `<p class="gt-decouvertes">${tr`${r.decouvertes} cartes découvertes sur ${r.total}`}${r.enPlus ? ' ' + tr`· ${r.enPlus} en plus (Héritage, origines)` : ''}</p>`;
}

function liste(g: GrandTableau, uid: string | null, t: TableauId, semaine: number, now: number): string {
  if (g.etat === 'chargement' && !g.entrees.length) return `<section class="gt-liste attente"><p>${tr`Les écrans s’allument…`}</p></section>`;
  if (g.etat === 'erreur' && !g.entrees.length) return `<section class="gt-seul"><p>${echap(g.erreur || tr('Le Tableau ne répond pas pour l’instant.'))}</p><button type="button" class="btn sec" data-action="gt-actualiser">${tr`Réessayer`}</button></section>`;
  const l = classer(g.entrees, t, g.periode, semaine);
  if (!l.length) return `<section class="gt-seul"><p>${g.periode === 'semaine' ? tr('Personne n’a encore progressé cette semaine. La première place est libre.') : tr('Personne n’est encore inscrit.')}</p></section>`;

  let h = '';
  // l'écart au joueur juste devant : la cible à rattraper
  const ecart = uid ? ecartDevant(l, uid) : null;
  const moi = l.find((x) => x.e.uid === uid);
  if (ecart) {
    const combien = t === 'profondeur' ? manqueProfondeur(ecart.manque, g.periode) : `${ent(ecart.manque)} point${ecart.manque > 1 ? 's' : ''}`;
    h += `<p class="gt-cible">${ICO.monter}<span>${tr`Encore`} <b>${combien}</b> ${tr`pour passer devant`} <b>${echap(ecart.nom)}</b>.</span></p>`;
  } else if (moi && moi.rang === 1 && l.length > 1) h += `<p class="gt-cible tete">${ICO.ok}<span>${tr`Tu mènes le Tableau. ${echap(l[1]!.e.nom)} te suit.`}</span></p>`;
  else if (l.length === 1) h += `<p class="gt-cible">${ICO.porteurs}<span>${tr`Tu es le seul directeur pour l’instant :`} <button type="button" class="lien" data-action="recruter">${tr`invite tes amis à jouer`}</button>.</span></p>`;

  // le podium, puis la liste
  const podium = l.slice(0, 3);
  if (l.length >= 3) {
    h += `<ol class="gt-podium" aria-label="${tr`Podium`}">` + [podium[1]!, podium[0]!, podium[2]!].map((x) =>
      `<li class="gt-marche r${x.rang}${x.e.uid === uid ? ' moi' : ''}">${avatar(connuPorteur(x.e.porteur), x.rang === 1 ? 64 : 52)}`
      + `<span class="gt-marche-nom">${echap(x.e.nom)}</span><b class="gt-valeur">${texteValeur(t, g.periode, x.v)}</b>`
      + `<span class="gt-socle"><em>${ordinal(x.rang)}</em></span></li>`).join('') + `</ol>`;
  }
  const reste = l.length >= 3 ? l.slice(3) : l;
  const decalage = l.length >= 3 ? 3 : 0;
  const lignes = fenetre(reste, uid, 2, 9);
  if (lignes.length) {
    h += `<ol class="gt-liste" start="${decalage + 1}">` + lignes.map((x) => x === 'ellipse' ? `<li class="gt-ellipse" aria-hidden="true">···</li>` : ligne(x, uid, t, g.periode, now)).join('') + `</ol>`;
  }
  // le joueur absent de la semaine se voit quand même
  if (!moi && uid) h += `<p class="gt-absent">${tr`Tu n’apparais pas encore ici : ${g.periode === 'semaine' ? tr('progresse cette semaine pour entrer dans la course.') : tr('ta première publication arrive.')}`}</p>`;
  return h;
}

function manqueProfondeur(demi: number, per: Periode): string {
  // en demi-étages : une Strate = 2, vaincre son gardien = 1
  if (per === 'total' && demi === 1) return tr('un gardien vaincu');
  const s = Math.ceil(demi / 2);
  return `${s} Strate${s > 1 ? 's' : ''}`;
}

function ligne(x: { e: Entree; v: number; rang: number }, uid: string | null, t: TableauId, per: Periode, now: number): string {
  const e = x.e;
  const sous = t === 'profondeur'
    ? (per === 'total' ? `${echap(zoneProfondeur(e.profondeur).replace(/^(Les|Le|La) /, ''))}${gardienVaincu(e.profondeur) ? tr(' · gardien vaincu') : ''}` : tr`Strate −${strateDe(e.profondeur)} atteinte`)
    : t === 'joutes' ? tr('duels gagnés au Cercle des quais')
    : tr`${e.decouvertes} cartes découvertes`;
  const inactif = now - e.maj > 7 * 86_400_000;
  return `<li class="gt-ligne${e.uid === uid ? ' moi' : ''}${inactif ? ' inactif' : ''}"><span class="gt-num">${x.rang}</span>${avatar(connuPorteur(e.porteur), 40)}`
    + `<span class="gt-qui"><strong>${echap(e.nom)}${e.insigne === 'recruteur' ? ` <em class="insigne-recruteur">${tr`Recruteur`}</em>` : ''}${e.uid === uid ? ` <em>${tr`toi`}</em>` : ''}</strong><small>${sous}</small></span>`
    + `<span class="gt-droite"><b class="gt-valeur">${texteValeur(t, per, x.v)}</b>${per === 'total' && t === 'profondeur' && e.profondeurLe ? `<small>${tr`le ${dateCourte(e.profondeurLe)}`}</small>` : per === 'total' && t === 'fleche' && e.flecheLe ? `<small>${tr`le ${dateCourte(e.flecheLe)}`}</small>` : ''}</span></li>`;
}

/** Comment chaque tableau se calcule : les vrais chiffres du jeu */
function regles(t: TableauId): string {
  if (t === 'joutes') {
    return `<div class="gt-regles"><p>${tr`Les duels gagnés au Cercle des quais contre tes amis. Chaque ami compte une fois par semaine, et trois amis différents au plus : on ne monte pas en jouant toujours contre le même.`}</p>`
      + `<p>${tr`La semaine compte les Joutes gagnées depuis lundi.`}</p><button type="button" class="btn sec" data-action="cercle">${ICO.cercle}${tr`Aller au Cercle`}</button></div>`;
  }
  if (t === 'fleche') {
    return `<div class="gt-regles"><p>${tr`Le plus haut quai que ton escouade a atteint sur la Flèche (${FLECHE.quais} quais). Une défaite te fait redescendre, mais ton record ne bouge pas.`}</p>`
      + `<p>${tr`À quai égal, le premier arrivé passe devant : la date est enregistrée au moment où tu atteins ton record.`}</p>`
      + `<p>${tr`La semaine compte les quais de record gagnés depuis lundi.`}</p><button type="button" class="btn sec" data-action="fleche">${ICO.fleche}${tr`Monter à la Flèche`}</button></div>`;
  }
  if (t === 'profondeur') {
    return `<div class="gt-regles"><p>${tr`La Strate la plus profonde ouverte sous ton district. Vaincre son gardien te place devant ceux qui ne l’ont pas encore battu.`}</p>`
      + `<p>${tr`À profondeur égale, le premier arrivé passe devant : la date est enregistrée au moment où tu atteins la Strate.`}</p>`
      + `<p>${tr`Ton record ne redescend jamais. La semaine compte les Strates gagnées depuis lundi.`}</p></div>`;
  }
  return `<div class="gt-regles"><p>${tr`Chaque carte que tu possèdes vaut selon son métal, et gagne ${Math.round(VALEUR_NIVEAU * 100)} % de sa valeur par niveau monté. Chaque carte différente découverte ajoute ${VALEUR_DECOUVERTE} points.`}</p>`
    + `<ul class="gt-baremes">${RARETES.map((m) => `<li class="m-${m}"><small>${NOMS_RARETE[m]}</small><b>${VALEUR_METAL[m]}</b></li>`).join('')}</ul>`
    + `<p>${tr`Découvrir compte plus que répéter : quarante doublons de fer pèsent moins que quelques cartes nouvelles. Le record ne redescend pas si tu recycles.`}</p></div>`;
}

// ---------- Les tableaux à venir ----------

function apercuJoutes(): string {
  return `<section class="gt-avenir"><span class="gt-avenir-ico">${ICO.atk}</span><h2>${tr`Les Joutes`} <em class="gt-bientot">${tr`avec le multijoueur`}</em></h2>`
    + `<p>${tr`Bientôt, ton escouade pourra affronter celle d’un autre directeur. Ce tableau classera les combats gagnés contre d’autres joueurs.`}</p>`
    + `<ul class="gt-promesses"><li>${ICO.bouclier}<span><strong>${tr`Ton deck en défense`}</strong><small>${tr`Quand tu ne joues pas, ton escouade se défend toute seule.`}</small></span></li>`
    + `<li>${ICO.ok}<span><strong>${tr`À armes égales`}</strong><small>${tr`Les niveaux des cartes seront plafonnés : la stratégie compte plus que le temps passé.`}</small></span></li>`
    + `<li>${ICO.chrono}<span><strong>${tr`Une saison par mois`}</strong><small>${tr`Ton record reste, le classement de la saison repart à zéro.`}</small></span></li></ul></section>`;
}


// ---------- Le nom de directeur ----------

/** La feuille du pseudo : depuis le Grand Tableau ou le panneau Compte du menu */
export function feuilleNom(j: Jeu, nomCompte: string, erreur: string, accueil = false): string {
  const propose = j.directeur?.nom ?? '';
  void nomCompte;
  return `<div class="voile-feuille" data-action="gt-nom-fermer" aria-hidden="true"></div><section class="feuille gt-feuille" role="dialog" aria-modal="true" aria-labelledby="gt-nom-titre"><span class="poignee" aria-hidden="true"></span>`
    + `<header class="feuille-tete"><div class="titres"><span class="surtitre">${accueil ? tr('Bienvenue, directeur') : tr('Le Grand Tableau')}</span><h2 id="gt-nom-titre">${accueil ? tr('Choisis ton pseudo') : tr('Ton pseudo')}</h2></div>`
    + `<button type="button" class="btn-icone" data-action="gt-nom-fermer" aria-label="${tr`Fermer`}">${ICO.fermer}</button></header>`
    + `<div class="feuille-corps"><p class="aide">${tr`Ton nom de directeur : c’est lui que les autres joueurs verront sur les écrans de Vertiga.`} <b>${tr`Ton nom de compte Google et ton e-mail ne sont jamais affichés.`}</b></p>`
    + `<input id="gt-nom" type="text" maxlength="18" autocomplete="nickname" spellcheck="false" placeholder="${tr`3 à 18 caractères`}" aria-label="${tr`Pseudo`}" value="${echap(propose)}">`
    + (erreur ? `<p class="erreur">${echap(erreur)}</p>` : '')
    + `<p class="aide">${tr`Ton Porteur de tête d’escouade, ${echap(porteurDef(connuPorteur(j.escouade?.[0] ?? 'ilka')).nom)}, sera ton portrait. Tu peux te retirer du Tableau quand tu veux.`}</p>`
    + `<button type="button" class="btn prim large" data-action="gt-nom-ok">${ICO.ok}${j.directeur?.nom ? tr('Enregistrer') : tr('Valider mon pseudo')}</button>`
    + (accueil ? `<button type="button" class="lien" data-action="gt-nom-fermer">${tr`Plus tard (dans Plus, en tête du menu)`}</button>` : '')
    + `</div></section>`;
}

