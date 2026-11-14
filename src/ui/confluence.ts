// La Confluence et les Rangs, deux volets du Cercle des quais (14 novembre 2026, refonte demandée par Bryan :
// « il manque classement, guilde, canal de discussion »). Ce qui vient du réseau arrive dans `CercleEcran.cf`
// (src/app/confluence.ts) ; la partie reste dans `j`.
//
// Volet Confluence : sans alliance, l'accueil (fonder, chercher, celles qui recrutent) ; membre, la bannière,
// la Crue de la semaine, puis trois sous-volets : le Quai (discussion), les Dons (copies), les Membres.
// Volet Rangs : les classements entre amis, dans sa Confluence, et des Confluences entre elles.

import * as J from '../core/jeu';
import { NOMS_RARETE, multNiveau } from '../core/collection';
import { moduleDef } from '../core/donnees';
import { TABLEAUX, classer, texteValeur, type TableauId, type Entree } from '../core/classements';
import type { Rarete } from '../core/types';
import type { Confluence, Demande, Membre, Message } from '../net/confluence';
import { faceCarte } from './carte';
import { duree, ent, type EcranDistrict } from './coquille';
import { ICO, baseIcones, icone } from './icones';
import { echap } from './outils';
import { t, locale } from '../core/i18n';
import type { CercleEcran } from './cercle';
import { avatarPorteur, ouvrirFeuille } from './cercle';

// ---------- Ce que l'application garde ----------

export type SousVoletConfluence = 'quai' | 'dons' | 'membres';
export type FeuilleConfluence = 'fonder' | 'apercu' | 'demande' | 'reglages' | 'membre' | null;

export interface ConfluenceEcran {
  etat: 'aucune' | 'chargement' | 'membre' | 'erreur';
  erreur?: string;
  conf?: Confluence;
  membres: Membre[];
  demandes: Demande[];
  messages: Message[];
  nonLus: number;
  /** les Confluences les plus fortes (classement, et celles qui recrutent) et quand elles ont été lues */
  liste: Confluence[];
  listeLue: number;
  sous: SousVoletConfluence;
  feuille: FeuilleConfluence;
  /** la Confluence regardée avant d'y entrer, et ses membres */
  apercu?: Confluence;
  apercuMembres?: Membre[];
  /** le membre ouvert (son uid) */
  membre: string | null;
  /** le formulaire de fondation */
  form: { nom: string; devise: string; embleme: number; couleur: number };
  erreurForm: string;
  brouillon: string;
  /** le métal choisi pour une demande de copies */
  metalDemande: Rarete;
  /** une action à confirmer : quitter, écarter */
  confirmer: string | null;
}

export interface RangsEcran {
  portee: 'amis' | 'confluence' | 'confluences';
  tableau: TableauId;
  periode: 'semaine' | 'total';
}

// ---------- Le pavillon ----------

/** Les emblèmes peints (Midjourney) et les couleurs du pavillon */
const EMBLEMES = ['./art/icones/lignee-tech.webp', './art/icones/lignee-bio.webp', './art/icones/lignee-reso.webp', './art/embleme-cristal.webp', './art/empreinte/sillon-sceau.webp', './art/empreinte/trace-sceau.webp'];
export const NOMS_EMBLEMES = [t('L’hexagone'), t('La feuille'), t('La flamme'), t('Le cristal'), t('L’empreinte d’or'), t('L’empreinte de glace')];
export const COULEURS = ['#2F6FA8', '#2F8A61', '#6C4BB4', '#B4432F', '#C98A2A', '#3D4A5A', '#CBBF9F', '#21868C'];
export const NOMS_COULEURS = [t('Azur'), t('Émeraude'), t('Améthyste'), t('Corail'), t('Ambre'), t('Ardoise'), t('Ivoire'), t('Lagune')];

/** Le pavillon d'une Confluence : le drap blanc peint, teint à sa couleur, et son emblème brodé */
export function pavillon(embleme: number, couleur: number, taille = 64): string {
  const e = EMBLEMES[embleme % EMBLEMES.length]!;
  return `<span class="cf-pavillon" style="--t:${taille}px;--c:${COULEURS[couleur % COULEURS.length]};--drap:url(./art/fleche/pavillon-neutre.webp)" aria-hidden="true">`
    + `<img class="cf-drap" src="./art/fleche/pavillon-neutre.webp" alt="" decoding="async"><img class="cf-embleme" src="${e}" alt="" decoding="async"></span>`;
}

// ---------- Petits morceaux ----------

const heure = (ms: number) => new Date(ms).toLocaleTimeString(locale(), { hour: '2-digit', minute: '2-digit' });
const jourCourt = (ms: number) => new Date(ms).toLocaleDateString(locale(), { weekday: 'short', day: 'numeric' });
const initiale = (nom: string) => `<span class="cr-avatar vide" aria-hidden="true">${echap(nom.charAt(0).toUpperCase())}</span>`;
const rangTexte = (n: number) => (locale().startsWith('en') ? `#${n}` : `${n}<sup>${n === 1 ? 'er' : 'e'}</sup>`);

function miniCarte(j: J.Jeu, id: string): string {
  let m;
  try { m = moduleDef(id); } catch { return ''; }
  const niv = j.collection[id]?.niveau ?? 1;
  return `<span class="cf-mini"><span class="cr-face">${faceCarte(m, niv, multNiveau(id, niv))}</span></span>`;
}

/** Les crans d'une demande : une goutte par copie, pleine quand elle est donnée */
const gouttes = (recu: number, voulu: number) => `<span class="cf-gouttes" aria-label="${t`${recu} sur ${voulu}`}">`
  + Array.from({ length: voulu }, (_, i) => `<i class="${i < recu ? 'pleine' : ''}"></i>`).join('') + `<b>${recu}/${voulu}</b></span>`;

const roleDe = (c: Confluence, uid: string) => (c.fondateur === uid ? 'fondateur' : c.anciens.includes(uid) ? 'ancien' : 'membre');
const badgeRole = (r: string) => r === 'fondateur' ? `<em class="cf-role fondateur">${t`Fondateur`}</em>` : r === 'ancien' ? `<em class="cf-role ancien">${t`Ancien`}</em>` : '';

/** Le Courant de la semaine de la Confluence (0 si la fiche date d'une autre semaine) */
export const courantDe = (c: Confluence | undefined, now: number) => (c && c.semaineC === J.semaineDe(now) ? c.courant : 0);

/** Ce qui attend le joueur dans le volet (pastille de l'onglet) : paliers à recevoir, demandes qu'il peut remplir */
export function aFaireConfluence(e: EcranDistrict, c: CercleEcran): number {
  const f = c.cf;
  if (!f.conf) return 0;
  const j = e.j;
  const paliers = J.paliersARecevoir(j, courantDe(f.conf, e.now), f.conf.membres.length, e.now).length;
  return paliers + f.demandes.filter((d) => d.uid !== e.uid && d.recu < d.voulu && !J.raisonDon(j, d.carte)).length;
}

// ---------- Le volet Confluence ----------

export function voletConfluence(e: EcranDistrict, c: CercleEcran): string {
  const f = c.cf;
  if (f.etat === 'erreur') return `<p class="cr-etat erreur" role="alert">${ICO.fele}${echap(f.erreur ?? '')} <button type="button" class="btn-sec" data-action="cf-relire">${t`Réessayer`}</button></p>` + accueil(e, c);
  if (f.etat === 'chargement' && !f.conf) return `<p class="cr-etat">${ICO.chrono}${t`Les digues s’ouvrent…`}</p>`;
  if (!f.conf) return accueil(e, c);
  return banniere(e, f.conf) + crue(e, f.conf) + sousVolets(e, c) + (f.sous === 'dons' ? dons(e, c) : f.sous === 'membres' ? membres(e, c) : quai(e, c));
}

/** Sans Confluence : ce que c'est, fonder, chercher, celles qui recrutent */
function accueil(e: EcranDistrict, c: CercleEcran): string {
  const f = c.cf;
  const j = e.j;
  let h = `<section class="cf-accueil"><div class="cf-accueil-texte"><span class="surtitre">${t`Les Confluences · alliances de cuvettes`}</span>`
    + `<h3>${t`Une digue ne tient jamais seule`}</h3>`
    + `<p>${t`Quand l’eau monte, les districts voisins unissent leurs digues. Une Confluence réunit jusqu’à ${J.CONFLUENCE.membresMax} directeurs : on y parle, on s’y donne des copies, et chaque semaine on fait monter la Crue ensemble.`}</p></div>`
    + `<ul class="cf-atouts"><li>${ICO.ami}<span><strong>${t`Le quai`}</strong><small>${t`La discussion de l’alliance.`}</small></span></li>`
    + `<li>${ICO.cartes}<span><strong>${t`Les dons`}</strong><small>${t`Demande des copies, donne tes doubles.`}</small></span></li>`
    + `<li>${ICO.coffre}<span><strong>${t`La Crue`}</strong><small>${t`Un objectif commun, des cristaux et une carte.`}</small></span></li></ul></section>`;

  h += `<section class="bloc cf-trouver"><h3 class="titre-bloc">${ICO.chercher}${t`Trouver une Confluence`}</h3>`
    + `<div class="cr-champ"><input id="cf-chercher" data-garder data-entree="cf-chercher" type="text" autocomplete="off" spellcheck="false" maxlength="22" placeholder="${t`Son nom exact`}" aria-label="${t`Nom de la Confluence`}">`
    + `<button type="button" class="btn sec" data-action="cf-chercher"${c.occupe ? ' disabled' : ''}>${t`Chercher`}</button></div></section>`;

  const ouvertes = f.liste.filter((x) => x.ouverte && x.membres.length < J.CONFLUENCE.membresMax);
  h += `<section class="bloc cr-liste"><h3 class="titre-bloc">${ICO.porteurs}${t`Elles recrutent`} <span class="cr-compte">${ouvertes.length}</span></h3>`;
  if (!f.listeLue) h += `<p class="cr-vide">${t`Les quais se remplissent…`}</p>`;
  else if (!ouvertes.length) h += `<p class="cr-vide">${t`Aucune Confluence n’accueille pour l’instant. Fonde la première, et invite tes amis.`}</p>`;
  for (const x of ouvertes.slice(0, 12)) {
    h += `<button type="button" class="cr-ligne cf-ligne" data-action="cf-voir" data-id="${echap(x.id)}">${pavillon(x.embleme, x.couleur, 44)}`
      + `<span class="cr-qui"><strong>${echap(x.nom)}</strong><small>${echap(x.devise || '')}</small></span>`
      + `<span class="cf-effectif"><b>${x.membres.length}</b>/${J.CONFLUENCE.membresMax}${ICO.lancer}</span></button>`;
  }
  h += `</section>`;

  h += `<section class="bloc cf-fonder"><div><strong>${t`Fonder ta Confluence`}</strong><small>${t`Choisis son nom, sa devise et son pavillon. Tu en deviens le fondateur.`}</small></div>`
    + `<button type="button" class="btn prim" data-action="cf-fonder"${j.energie < J.CONFLUENCE.prixFondation ? ' disabled' : ''}>${ICO.ajouter}${t`Fonder`} · ${J.CONFLUENCE.prixFondation} ${icone('energie')}</button></section>`;
  return h;
}

/** La bannière : le pavillon, le nom, la devise, l'effectif et le rang */
function banniere(e: EcranDistrict, conf: Confluence): string {
  const c = e.cercle!;
  const rang = c.cf.liste.length ? [...c.cf.liste].sort((a, b) => b.total - a.total).findIndex((x) => x.id === conf.id) + 1 : 0;
  const moi = e.uid ?? '';
  const chef = roleDe(conf, moi) === 'fondateur';
  return `<section class="cf-banniere" style="--c:${COULEURS[conf.couleur % COULEURS.length]}">${pavillon(conf.embleme, conf.couleur, 84)}`
    + `<div class="cf-banniere-txt"><span class="surtitre">${t`Confluence`}${badgeRole(roleDe(conf, moi))}</span><h3>${echap(conf.nom)}</h3>`
    + (conf.devise ? `<p class="cf-devise">« ${echap(conf.devise)} »</p>` : '')
    + `<div class="cf-puces"><span>${ICO.porteurs}<b>${conf.membres.length}</b>/${J.CONFLUENCE.membresMax}</span>`
    + `<span>${conf.ouverte ? `${ICO.ok}${t`Ouverte`}` : `${ICO.verrou}${t`Fermée`}`}</span>`
    + (rang > 0 ? `<span class="or">${ICO.monter}${rangTexte(rang)}</span>` : '') + `</div></div>`
    + (chef ? `<button type="button" class="btn-icone cf-regler" data-action="cf-reglages" aria-label="${t`Réglages de la Confluence`}">${ICO.marteau}</button>` : '')
    + `</section>`;
}

/** La Crue de la semaine : la jauge commune, ses trois paliers, et l'apport du joueur */
function crue(e: EcranDistrict, conf: Confluence): string {
  const j = e.j;
  const courant = courantDe(conf, e.now);
  const seuils = J.paliersCrue(conf.membres.length);
  const max = seuils[seuils.length - 1]!;
  const a = J.apportSemaine(j, e.now);
  const recus = J.etatConfluence(j, e.now).crue;
  const prets = J.paliersARecevoir(j, courant, conf.membres.length, e.now);
  const fin = J.lundiSuivant(e.now) - e.now;
  const rec = J.CONFLUENCE.recompenses;
  const icoPalier = (i: number) => rec[i]!.cristaux ? icone('energie') : rec[i]!.eclats ? icone('eclats') : icone('coffre');
  const texte = (i: number) => rec[i]!.cristaux ? `${rec[i]!.cristaux}` : rec[i]!.eclats ? `${rec[i]!.eclats}` : t('Carte');
  let h = `<section class="cf-crue"><header><div><span class="surtitre">${t`La Crue de la semaine`}</span><strong><b>${ent(courant)}</b> / ${ent(max)}</strong></div>`
    + `<small>${ICO.chrono}${t`repart dans ${duree(fin)}`}</small></header>`
    + `<div class="cf-jauge" role="progressbar" aria-valuemin="0" aria-valuemax="${max}" aria-valuenow="${courant}"><span class="cf-eau" style="--p:${Math.min(100, (courant / max) * 100)}%"></span>`
    + seuils.map((s, i) => {
      const etat = recus.includes(i) ? 'recu' : prets.includes(i) ? 'pret' : courant >= s ? 'atteint' : '';
      return `<span class="cf-palier ${etat}" style="--x:${(s / max) * 100}%">${prets.includes(i)
        ? `<button type="button" data-action="cf-palier" data-id="${i}" aria-label="${t`Recevoir le palier ${i + 1}`}">${icoPalier(i)}</button>`
        : `<i>${recus.includes(i) ? ICO.ok : icoPalier(i)}</i>`}<small>${texte(i)}</small></span>`;
    }).join('') + `</div>`;
  const morceaux = [a.dons ? t`dons ${a.dons}` : '', a.joutes ? t`Joutes ${a.joutes}` : '', a.gardien ? t`Gardien ${a.gardien}` : '', a.strates ? t`Strates ${a.strates}` : ''].filter(Boolean);
  h += `<p class="cf-apport">${t`Ton apport :`} <b>${ent(a.total)}</b>${morceaux.length ? ` <small>(${morceaux.join(' · ')})</small>` : ''}`
    + (prets.length ? ` <span class="cf-pret">${t`Un palier t’attend : touche-le.`}</span>` : !a.total ? ` <small>${t`Donne une copie, gagne une Joute, frappe le Gardien ou descends : tout compte.`}</small>` : '') + `</p>`;
  return h + `</section>`;
}

function sousVolets(e: EcranDistrict, c: CercleEcran): string {
  const f = c.cf;
  const aDonner = f.demandes.filter((d) => d.uid !== e.uid && d.recu < d.voulu && !J.raisonDon(e.j, d.carte)).length;
  const s = (id: typeof f.sous, nom: string, n = 0) => `<button type="button" role="tab" class="seg${f.sous === id ? ' actif' : ''}" aria-selected="${f.sous === id}" data-action="cf-sous" data-id="${id}">${nom}${n ? ` <span class="pastille-n">${n}</span>` : ''}</button>`;
  return `<div class="segments-choix trois cf-sous" role="tablist" aria-label="${t`Le quai, les dons ou les membres`}">${s('quai', t('Le quai'))}${s('dons', t('Dons'), aDonner)}${s('membres', t('Membres'))}</div>`;
}

// ---------- Le quai ----------

function quai(e: EcranDistrict, c: CercleEcran): string {
  const f = c.cf;
  const j = e.j;
  const muets = J.etatConfluence(j, e.now).muets ?? [];
  const parUid = new Map(f.membres.map((m) => [m.uid, m]));
  const chef = !!f.conf && (f.conf.fondateur === e.uid || f.conf.anciens.includes(e.uid ?? ''));
  let jour = '';
  let fil = '';
  for (const m of f.messages) {
    if (muets.includes(m.de) && m.sorte !== 'evenement') continue;
    const d = jourCourt(m.le);
    if (d !== jour) { jour = d; fil += `<li class="cf-jour"><span>${echap(d)}</span></li>`; }
    if (m.sorte === 'evenement') { fil += `<li class="cf-evt" data-id="${m.id}">${evenement(j, m)}<time>${heure(m.le)}</time></li>`; continue; }
    const moi = m.de === e.uid;
    const texte = m.sorte === 'rapide' ? `<em>${echap(J.MESSAGES_RAPIDES[Number(m.texte)] ?? '')}</em>` : echap(m.texte);
    const p = parUid.get(m.de);
    fil += `<li class="cf-msg${moi ? ' moi' : ''}" data-id="${m.id}">${moi ? '' : p ? avatarPorteur(p.porteur, 34) : initiale(m.nom)}`
      + `<div class="cf-bulle">${moi ? '' : `<strong>${echap(m.nom)}${f.conf ? badgeRole(roleDe(f.conf, m.de)) : ''}</strong>`}<p>${texte}</p>`
      + `<time>${heure(m.le)}</time>${moi || chef ? `<button type="button" class="cf-effacer" data-action="cf-effacer" data-id="${m.id}" aria-label="${t`Effacer ce message`}">${ICO.fermer}</button>` : ''}</div></li>`;
  }
  if (!fil) fil = `<li class="cf-vide">${t`Le quai est calme. Lance la conversation !`}</li>`;
  return `<section class="cf-quai"><ol class="cf-fil" aria-live="polite">${fil}</ol>`
    + `<div class="cf-rapides" role="group" aria-label="${t`Messages rapides`}">${J.MESSAGES_RAPIDES.map((x, i) => `<button type="button" data-action="cf-rapide" data-id="${i}"${c.occupe ? ' disabled' : ''}>${echap(x)}</button>`).join('')}</div>`
    + `<div class="cf-ecrire"><input id="cf-texte" data-garder type="text" maxlength="${J.CONFLUENCE.messageMax}" autocomplete="off" placeholder="${t`Écrire sur le quai…`}" aria-label="${t`Ton message`}" value="${echap(f.brouillon)}" data-entree="cf-envoyer">`
    + `<button type="button" class="btn prim cf-envoyer" data-action="cf-envoyer" aria-label="${t`Envoyer`}"${c.occupe ? ' disabled' : ''}>${ICO.lancer}</button></div></section>`;
}

function evenement(j: J.Jeu, m: Message): string {
  const nom = `<b>${echap(m.nom)}</b>`;
  const carte = m.carte ? (() => { try { return `<b class="m-${moduleDef(m.carte).rarete}">${echap(moduleDef(m.carte).nom)}</b>`; } catch { return ''; } })() : '';
  void j;
  switch (m.texte) {
    case 'fondee': return `${ICO.etoile}<span>${t`${nom} a fondé la Confluence.`}</span>`;
    case 'arrivee': return `${ICO.ami}<span>${t`${nom} rejoint la Confluence. Bienvenue !`}</span>`;
    case 'depart': return `${ICO.retour}<span>${t`${nom} a quitté la Confluence.`}</span>`;
    case 'demande': return `${ICO.cartes}<span>${t`${nom} demande ${m.n ?? 1} × ${carte}.`}</span>`;
    case 'don': return `${ICO.echange}<span>${t`${nom} a donné ${carte} à ${echap(m.pour ?? '')}.`}</span>`;
    default: return `<span>${nom}</span>`;
  }
}

// ---------- Les dons ----------

function dons(e: EcranDistrict, c: CercleEcran): string {
  const f = c.cf;
  const j = e.j;
  const l = J.etatConfluence(j, e.now);
  const mienneEnLigne = f.demandes.find((d) => d.uid === e.uid);
  const attente = J.prochaineDemande(j, e.now);
  let h = `<section class="bloc cf-ma-demande"><h3 class="titre-bloc">${ICO.cartes}${t`Ta demande`}</h3>`;
  if (mienneEnLigne && l.demande && mienneEnLigne.le === l.demande.le) {
    const d = mienneEnLigne;
    h += `<div class="cf-demande moi">${miniCarte(j, d.carte)}<div><strong>${echap(moduleDef(d.carte).nom)}</strong><small class="m-${moduleDef(d.carte).rarete}">${NOMS_RARETE[moduleDef(d.carte).rarete]}</small>`
      + `${gouttes(d.recu, d.voulu)}<small>${d.recu >= d.voulu ? t('Remplie ! Les copies sont dans ta collection.') : t`Tes alliés voient ta demande.`}</small></div></div>`;
  }
  h += attente
    ? `<p class="cf-attente">${ICO.chrono}${t`Prochaine demande dans ${duree(attente)}.`}</p>`
    : `<button type="button" class="btn prim large" data-action="cf-demander">${ICO.ajouter}${t`Demander des copies`}</button>`;
  h += `<small class="aide">${t`Une demande toutes les ${J.CONFLUENCE.demandeHeures} h : ${J.CONFLUENCE.copiesDemandees.fer} copies en fer, ${J.CONFLUENCE.copiesDemandees.cuivre} en cuivre, ${J.CONFLUENCE.copiesDemandees.argent} en argent (Cercle niveau ${J.CONFLUENCE.argentAuNiveau}).`}</small></section>`;

  const autres = f.demandes.filter((d) => d.uid !== e.uid && d.recu < d.voulu)
    .sort((a, b) => Number(!!J.raisonDon(j, a.carte)) - Number(!!J.raisonDon(j, b.carte)) || b.le - a.le);
  const restants = Math.max(0, J.CONFLUENCE.donsJour - l.donsDuJour);
  h += `<section class="bloc cr-liste"><h3 class="titre-bloc">${ICO.echange}${t`Ils demandent`} <span class="cr-compte">${t`dons récompensés restants : ${restants}/${J.CONFLUENCE.donsJour}`}</span></h3>`;
  if (!autres.length) h += `<p class="cr-vide">${t`Personne n’attend de copie pour l’instant.`}</p>`;
  const parUid = new Map(f.membres.map((m) => [m.uid, m]));
  for (const d of autres) {
    const r = J.raisonDon(j, d.carte);
    const m = moduleDef(d.carte);
    const p = parUid.get(d.uid);
    const gain = restants ? J.CONFLUENCE.recompenseDon[m.rarete] : 0;
    h += `<div class="cf-demande${r ? ' off' : ''}">${miniCarte(j, d.carte)}<div class="cf-demande-txt">`
      + `<span class="cf-qui">${p ? avatarPorteur(p.porteur, 26) : ''}<strong>${echap(d.nom)}</strong></span>`
      + `<small>${echap(m.nom)} · <span class="m-${m.rarete}">${NOMS_RARETE[m.rarete]}</span></small>${gouttes(d.recu, d.voulu)}</div>`
      + `<button type="button" class="btn ${r ? 'sec' : 'prim'}" data-action="cf-donner" data-id="${d.uid}"${r || c.occupe ? ' disabled' : ''} title="${echap(r ?? '')}">`
      + (r ? t('Pas de double') : `${t`Donner`}${gain ? ` · +${gain} ${icone('energie')}` : ''}`) + `</button></div>`;
  }
  return h + `</section>`;
}

/** La feuille d'une demande : ses souhaits d'abord, puis sa collection, par métal */
export function feuilleDemande(e: EcranDistrict, c: CercleEcran): string {
  const f = c.cf;
  if (f.feuille !== 'demande') return '';
  const j = e.j;
  const s = J.etatCercle(j).souhaits;
  const metaux: Rarete[] = (j.batiments.cercle ?? 0) >= J.CONFLUENCE.argentAuNiveau ? ['fer', 'cuivre', 'argent'] : ['fer', 'cuivre'];
  const ids = [...new Set([...s, ...Object.keys(j.collection)])]
    .filter((id) => { try { return moduleDef(id).rarete === f.metalDemande && !J.raisonNonEchangeable(j, id); } catch { return false; } })
    .sort((a, b) => Number(s.includes(b)) - Number(s.includes(a)) || moduleDef(a).nom.localeCompare(moduleDef(b).nom));
  let h = ouvrirFeuille('cf-dem-titre', t`${J.CONFLUENCE.copiesDemandees[f.metalDemande]} ${J.CONFLUENCE.copiesDemandees[f.metalDemande] > 1 ? t('copies') : t('copie')} par demande`, t('Demander des copies'))
    + `<div class="cr-filtres" role="group" aria-label="${t`Métal`}">${metaux.map((r) => `<button type="button" class="cr-filtre${f.metalDemande === r ? ' actif' : ''}" data-action="cf-metal" data-id="${r}" aria-pressed="${f.metalDemande === r}">${NOMS_RARETE[r]}</button>`).join('')}</div>`
    + `<p class="aide">${t`Tes souhaits passent en premier (étoile). Les copies reçues font monter ta carte.`}</p>`
    + `<div class="cr-grille">` + ids.map((id) => `<button type="button" class="cr-carte" data-action="cf-demander-carte" data-id="${id}" aria-label="${echap(moduleDef(id).nom)}">`
      + `<span class="cr-face">${faceCarte(moduleDef(id), j.collection[id]?.niveau ?? 1, multNiveau(id, j.collection[id]?.niveau ?? 1))}</span>`
      + (s.includes(id) ? `<span class="cr-marque">${ICO.etoile}</span>` : '') + (j.collection[id] ? '' : `<small class="cr-note">${t`souhait`}</small>`) + `</button>`).join('')
    + (ids.length ? '' : `<p class="cr-vide">${t`Aucune carte de ce métal à demander.`}</p>`) + `</div>`;
  return h + `</div></section>`;
}

// ---------- Les membres ----------

function membres(e: EcranDistrict, c: CercleEcran): string {
  const f = c.cf;
  const conf = f.conf!;
  const sem = J.semaineDe(e.now);
  const l = [...f.membres].sort((a, b) => (b.semaine === sem ? b.apport : 0) - (a.semaine === sem ? a.apport : 0) || a.nom.localeCompare(b.nom));
  const max = Math.max(1, ...l.map((m) => (m.semaine === sem ? m.apport : 0)));
  let h = `<section class="bloc cr-liste cf-membres"><h3 class="titre-bloc">${ICO.porteurs}${t`Les directeurs`} <span class="cr-compte">${t`apport de la semaine`}</span></h3>`;
  l.forEach((m, i) => {
    const ap = m.semaine === sem ? m.apport : 0;
    h += `<button type="button" class="cr-ligne cf-membre${m.uid === e.uid ? ' moi' : ''}" data-action="cf-membre" data-id="${m.uid}"><span class="cf-num">${i + 1}</span>${avatarPorteur(m.porteur, 40)}`
      + `<span class="cr-qui"><strong>${echap(m.nom)}${badgeRole(roleDe(conf, m.uid))}</strong><small>${t`Strate −${m.strate}`}${m.semaine === sem && m.dons ? (m.dons > 1 ? t` · ${m.dons} dons` : t(' · 1 don')) : ''}</small>`
      + `<span class="cf-barre"><i style="--p:${(ap / max) * 100}%"></i></span></span><b class="cf-valeur">${ent(ap)}</b></button>`;
  });
  h += `</section>`;
  const chef = conf.fondateur === e.uid;
  h += `<section class="cf-sortie">` + (f.confirmer === 'quitter'
    ? `<div class="confirmer" role="group"><span>${chef && conf.membres.length > 1 ? t('Tu passes le flambeau à un ancien (ou au plus actif). Quitter la Confluence ?') : conf.membres.length === 1 ? t('Tu es seul : la Confluence sera dissoute. La quitter ?') : t('Quitter la Confluence ? Tu pourras en rejoindre une autre.')}</span>`
      + `<button type="button" class="btn sec petit" data-action="cf-quitter-ok">${t`Quitter`}</button><button type="button" class="btn sec petit" data-action="cf-annuler">${t`Annuler`}</button></div>`
    : `<button type="button" class="cr-lien" data-action="cf-quitter">${t`Quitter la Confluence`}</button>`) + `</section>`;
  return h;
}

export function feuilleMembre(e: EcranDistrict, c: CercleEcran): string {
  const f = c.cf;
  const m = f.membres.find((x) => x.uid === f.membre);
  if (f.feuille !== 'membre' || !m || !f.conf) return '';
  const conf = f.conf;
  const moi = e.uid ?? '';
  const chef = conf.fondateur === moi;
  const ami = c.amis.find((a) => a.uid === m.uid);
  const muet = (J.etatConfluence(e.j, e.now).muets ?? []).includes(m.uid);
  let h = ouvrirFeuille('cf-membre-titre', t`Strate −${m.strate} · apport ${ent(m.semaine === J.semaineDe(e.now) ? m.apport : 0)}`, echap(m.nom), '', avatarPorteur(m.porteur, 56));
  if (m.uid === moi) h += `<p class="cr-vide">${t`C’est toi. Ton apport grandit avec tes dons, tes Joutes, tes frappes sur le Gardien et tes Strates.`}</p>`;
  else {
    h += `<div class="cr-boutons">` + (ami
      ? `<button type="button" class="btn prim" data-action="cercle-defier" data-id="${m.uid}"><img class="ico peinte action" src="${baseIcones}frapper.webp" alt="" aria-hidden="true" decoding="async">${t`Défier`}</button><button type="button" class="btn sec" data-action="cercle-ami" data-id="${m.uid}">${ICO.cartes}${t`Sa vitrine`}</button>`
      : `<button type="button" class="btn prim" data-action="cf-ajouter-ami" data-id="${echap(m.nom)}">${ICO.ami}${t`Ajouter en ami`}</button>`) + `</div>`
      + `<button type="button" class="ligne-menu" data-action="cf-muet" data-id="${m.uid}">${muet ? ICO.ok : ICO.fermer}<span><strong>${muet ? t('Réentendre sur le quai') : t('Ne plus lire ses messages')}</strong><small>${t`Seulement chez toi : il n’en saura rien.`}</small></span></button>`;
    if (chef) {
      h += `<button type="button" class="ligne-menu" data-action="cf-ancien" data-id="${m.uid}">${ICO.etoile}<span><strong>${conf.anciens.includes(m.uid) ? t('Retirer le titre d’ancien') : t('Nommer ancien')}</strong><small>${t`Un ancien peut effacer les messages du quai, et reçoit le flambeau si tu pars.`}</small></span></button>`
        + (f.confirmer === `ecarter:${m.uid}`
          ? `<div class="confirmer" role="group"><span>${t`Écarter ${echap(m.nom)} ? Il ne pourra plus revenir.`}</span><button type="button" class="btn sec petit" data-action="cf-ecarter-ok" data-id="${m.uid}">${t`Écarter`}</button><button type="button" class="btn sec petit" data-action="cf-annuler">${t`Annuler`}</button></div>`
          : `<button type="button" class="cr-lien cr-retirer" data-action="cf-ecarter" data-id="${m.uid}">${t`Écarter de la Confluence`}</button>`);
    }
  }
  return h + `</div></section>`;
}

// ---------- Fonder, voir, régler ----------

export function feuilleFonder(_e: EcranDistrict, c: CercleEcran): string {
  const f = c.cf;
  if (f.feuille !== 'fonder' && f.feuille !== 'reglages') return '';
  const reglages = f.feuille === 'reglages';
  const x = f.form;
  let h = ouvrirFeuille('cf-fonder-titre', reglages ? t('Ta Confluence') : t`Fonder · ${J.CONFLUENCE.prixFondation} cristaux`, reglages ? t('Réglages') : t('Nouvelle Confluence'))
    + `<div class="cf-apercu-pav">${pavillon(x.embleme, x.couleur, 96)}<div><strong>${echap(x.nom || (reglages ? f.conf?.nom ?? '' : t('Ton nom ici')))}</strong><small>${echap(x.devise || t('Ta devise'))}</small></div></div>`;
  if (!reglages) h += `<label class="cf-champ"><span>${t`Nom`}</span><input id="cf-nom" data-garder type="text" maxlength="22" autocomplete="off" spellcheck="false" value="${echap(x.nom)}" placeholder="${t`3 à 22 caractères`}"></label>`;
  h += `<label class="cf-champ"><span>${t`Devise`}</span><input id="cf-devise" data-garder type="text" maxlength="80" autocomplete="off" value="${echap(x.devise)}" placeholder="${t`Une phrase qui vous rassemble`}"></label>`
    + `<div class="cf-devises">${J.DEVISES.map((d) => `<button type="button" data-action="cf-devise" data-id="${echap(d)}">${echap(d)}</button>`).join('')}</div>`
    + `<h3 class="titre-bloc">${t`Emblème`}</h3><div class="cf-choix-emb" role="radiogroup">${NOMS_EMBLEMES.map((n, i) => `<button type="button" role="radio" aria-checked="${x.embleme === i}" class="${x.embleme === i ? 'actif' : ''}" data-action="cf-embleme" data-id="${i}" aria-label="${n}"><img src="${EMBLEMES[i]}" alt="" decoding="async"></button>`).join('')}</div>`
    + `<h3 class="titre-bloc">${t`Couleur du pavillon`}</h3><div class="cf-choix-coul" role="radiogroup">${NOMS_COULEURS.map((n, i) => `<button type="button" role="radio" aria-checked="${x.couleur === i}" class="${x.couleur === i ? 'actif' : ''}" style="--c:${COULEURS[i]}" data-action="cf-couleur" data-id="${i}" aria-label="${n}"></button>`).join('')}</div>`;
  if (reglages && f.conf) h += `<button type="button" class="ligne-menu" data-action="cf-ouverte">${f.conf.ouverte ? ICO.ok : ICO.verrou}<span><strong>${f.conf.ouverte ? t('Ouverte à tous') : t('Fermée')}</strong><small>${f.conf.ouverte ? t('Tout directeur peut entrer. Touche pour fermer.') : t('Plus personne n’entre. Touche pour ouvrir.')}</small></span></button>`;
  if (f.erreurForm) h += `<p class="erreur">${echap(f.erreurForm)}</p>`;
  h += `<button type="button" class="btn prim large" data-action="${reglages ? 'cf-reglages-ok' : 'cf-fonder-ok'}"${c.occupe ? ' disabled' : ''}>${ICO.ok}${reglages ? t('Enregistrer') : t('Fonder la Confluence')}</button>`;
  return h + `</div></section>`;
}

export function feuilleApercu(e: EcranDistrict, c: CercleEcran): string {
  const f = c.cf;
  const x = f.apercu;
  if (f.feuille !== 'apercu' || !x) return '';
  const pleine = x.membres.length >= J.CONFLUENCE.membresMax;
  let h = ouvrirFeuille('cf-apercu-titre', t`${x.membres.length}/${J.CONFLUENCE.membresMax} directeurs · Courant ${ent(x.total)}`, echap(x.nom), '', pavillon(x.embleme, x.couleur, 56));
  if (x.devise) h += `<p class="cf-devise">« ${echap(x.devise)} »</p>`;
  h += `<h3 class="titre-bloc">${ICO.porteurs}${t`Ses directeurs`}</h3>`;
  if (!f.apercuMembres) h += `<p class="cr-vide">${t`Lecture…`}</p>`;
  else h += `<div class="cf-visages">${f.apercuMembres.slice(0, 20).map((m) => `<span title="${echap(m.nom)}">${avatarPorteur(m.porteur, 40)}<small>${echap(m.nom)}</small></span>`).join('')}</div>`;
  h += `<button type="button" class="btn prim large" data-action="cf-rejoindre" data-id="${echap(x.id)}"${!x.ouverte || pleine || c.occupe || !!J.etatConfluence(e.j, e.now).id ? ' disabled' : ''}>${ICO.ami}${pleine ? t('Complète') : !x.ouverte ? t('Fermée') : t('Rejoindre')}</button>`;
  return h + `</div></section>`;
}

// ---------- Les Rangs ----------

export function voletRangs(e: EcranDistrict, c: CercleEcran): string {
  const r = c.rangs;
  const p = (id: typeof r.portee, nom: string) => `<button type="button" role="tab" class="seg${r.portee === id ? ' actif' : ''}" aria-selected="${r.portee === id}" data-action="rg-portee" data-id="${id}">${nom}</button>`;
  let h = `<div class="segments-choix trois" role="tablist" aria-label="${t`Qui comparer`}">${p('amis', t('Amis'))}${p('confluence', t('Ma Confluence'))}${p('confluences', t('Confluences'))}</div>`;
  const fin = J.lundiSuivant(e.now) - e.now;
  h += `<div class="rg-periode"><div class="segments-choix deux" role="tablist" aria-label="${t`Période`}">`
    + `<button type="button" role="tab" class="seg${r.periode === 'semaine' ? ' actif' : ''}" aria-selected="${r.periode === 'semaine'}" data-action="rg-periode" data-id="semaine">${t`Cette semaine`}</button>`
    + `<button type="button" role="tab" class="seg${r.periode === 'total' ? ' actif' : ''}" aria-selected="${r.periode === 'total'}" data-action="rg-periode" data-id="total">${t`De toujours`}</button></div>`
    + (r.periode === 'semaine' ? `<small>${ICO.chrono}${t`repart dans ${duree(fin)}`}</small>` : '') + `</div>`;
  if (r.portee === 'confluences') return h + rangsConfluences(e, c);

  h += `<div class="rg-tableaux" role="tablist" aria-label="${t`Classement`}">` + TABLEAUX.filter((x) => x.ouvert).map((x) =>
    `<button type="button" role="tab" class="rg-tab${r.tableau === x.id ? ' actif' : ''}" aria-selected="${r.tableau === x.id}" data-action="rg-tableau" data-id="${x.id}">${ICO[x.id === 'profondeur' ? 'strate' : x.id === 'registre' ? 'cartes' : x.id === 'joutes' ? 'atk' : 'fleche']}<span>${x.court}</span></button>`).join('') + `</div>`;

  const g = e.grand;
  const uids = new Set<string>(r.portee === 'amis' ? [...c.amis.map((a) => a.uid), e.uid ?? ''] : c.cf.membres.map((m) => m.uid));
  if (r.portee === 'confluence' && !c.cf.conf) return h + `<p class="cr-vide rg-vide">${t`Rejoins une Confluence pour comparer ses directeurs.`}</p>`;
  if (!g || (g.etat === 'chargement' && !g.entrees.length)) return h + `<p class="cr-etat">${ICO.chrono}${t`Les écrans s’allument…`}</p>`;
  const entrees: Entree[] = g.entrees.filter((x) => uids.has(x.uid));
  const l = classer(entrees, r.tableau, r.periode, J.semaineDe(e.now));
  if (!l.length) h += `<p class="cr-vide rg-vide">${r.portee === 'amis' ? t('Ajoute des amis (et choisis ton pseudo) pour vous comparer.') : t('Personne ici n’est encore inscrit au Grand Tableau.')}</p>`;
  else {
    h += `<ol class="rg-liste">` + l.map((x) => `<li class="rg-ligne${x.e.uid === e.uid ? ' moi' : ''} r${Math.min(4, x.rang)}"><span class="rg-rang">${x.rang <= 3 ? `<i class="rg-medaille">${x.rang}</i>` : x.rang}</span>`
      + `${avatarPorteur(x.e.porteur, 38)}<span class="cr-qui"><strong>${echap(x.e.nom)}${x.e.uid === e.uid ? ` <em>${t`toi`}</em>` : ''}</strong></span>`
      + `<b class="rg-valeur">${texteValeur(r.tableau, r.periode, x.v)}</b></li>`).join('') + `</ol>`;
  }
  return h + `<button type="button" class="btn sec large rg-tout" data-action="classements" data-id="${r.tableau}">${ICO.monter}${t`Le Grand Tableau : tous les directeurs`}</button>`;
}

function rangsConfluences(e: EcranDistrict, c: CercleEcran): string {
  const f = c.cf;
  const sem = c.rangs.periode === 'semaine';
  const l = [...f.liste].map((x) => ({ x, v: sem ? courantDe(x, e.now) : x.total })).sort((a, b) => b.v - a.v).filter((y) => !sem || y.v > 0);
  const mien = J.etatConfluence(e.j, e.now).id;
  if (!f.listeLue) return `<p class="cr-etat">${ICO.chrono}${t`Les quais se remplissent…`}</p>`;
  if (!l.length) return `<p class="cr-vide rg-vide">${sem ? t('Aucune Confluence n’a encore fait monter sa Crue cette semaine.') : t('Aucune Confluence n’est encore fondée.')}</p>`;
  return `<ol class="rg-liste">` + l.slice(0, 25).map((y, i) => `<li class="rg-ligne${y.x.id === mien ? ' moi' : ''} r${Math.min(4, i + 1)}"><span class="rg-rang">${i < 3 ? `<i class="rg-medaille">${i + 1}</i>` : i + 1}</span>`
    + `${pavillon(y.x.embleme, y.x.couleur, 38)}<span class="cr-qui"><strong>${echap(y.x.nom)}</strong><small>${t`${y.x.membres.length} directeurs`}</small></span>`
    + `<b class="rg-valeur">${ent(y.v)}</b></li>`).join('') + `</ol>`
    + `<p class="aide rg-note">${t`Le Courant : la somme de ce que chaque directeur apporte (dons, Joutes, Gardien de la ville, Strates).`}</p>`;
}
