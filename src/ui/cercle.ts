// L'écran du Cercle des quais (3 novembre 2026, plan validé par Bryan) : le bâtiment social de la Cuvette.
// Trois volets : Amis (ajouter, accepter, visiter une vitrine), Duels (défier un ami, répondre à un défi, la semaine),
// Échanges (propositions reçues et envoyées, souhaits, composer un échange). Les détails s'ouvrent en feuille par le bas.
// Ce qui vient du réseau (amis, propositions, défis) arrive dans `CercleEcran` (src/app/cercle.ts) ; la partie, elle, reste dans `j`.

import * as J from '../core/jeu';
import { COLLECTION, NOMS_RARETE, RARETES, multNiveau } from '../core/collection';
import { NOMS_LIGNEE, moduleDef, porteurDef, tirablesEn } from '../core/donnees';
import { clePseudo } from '../core/classements';
import type { Lignee, Rarete } from '../core/types';
import { portrait } from './art';
import { COULEUR_RARETE, faceCarte } from './carte';
import { coquille, entete, type EcranDistrict } from './coquille';
import { ICO, icone } from './icones';
import { echap } from './outils';

// ---------- Ce que l'application garde du Cercle ----------

export interface VitrineAmi {
  nom: string;
  strate: number;
  porteur: string;
  vitrine: { id: string; niveau: number }[];
  doubles: string[];
  souhaits: string[];
  cercle: number;
  victoires: number;
}
export interface AmiCercle { amitie: string; uid: string; nom: string; depuis: number; profil?: VitrineAmi }
export interface DemandeAmi { amitie: string; uid: string; nom: string; le: number; recue: boolean }
export interface PropositionVue { id: string; de: string; a: string; nomDe: string; nomA: string; donne: string; demande: string; etat: string; le: number }
export interface DefiVue { id: string; de: string; a: string; nomDe: string; code: string; mode: 'libre' | 'egal'; etat: string; le: number }
export type OngletCercle = 'amis' | 'duels' | 'echanges';

export interface CercleEcran {
  /** le réseau : pas connecté, en train de lire, prêt, ou en erreur (règles pas encore publiées…) */
  reseau: 'hors-ligne' | 'chargement' | 'pret' | 'erreur';
  erreur?: string;
  amis: AmiCercle[];
  demandes: DemandeAmi[];
  recues: PropositionVue[];
  envoyees: PropositionVue[];
  defisRecus: DefiVue[];
  defisEnvoyes: DefiVue[];
  /** ce qui attend une réponse du joueur (la bulle du bâtiment) */
  aRepondre: number;
  onglet: OngletCercle;
  /** la vitrine d'un ami ouverte (son uid) */
  ami: string | null;
  /** la feuille de choix ouverte : ses souhaits ou sa vitrine */
  choix: 'souhaits' | 'vitrine' | null;
  filtreMetal: Rarete;
  filtreLignee: Lignee | 'tout';
  /** l'échange en train d'être composé : l'ami, la carte qu'on demande, celle qu'on donne */
  echange: { ami: string; recoit?: string; donne?: string } | null;
  /** le mode des défis : libre (ses vraies forces) ou à armes égales */
  mode: 'libre' | 'egal';
  /** une opération réseau en cours, et le dernier message (erreur ou confirmation) */
  occupe: boolean;
  message: string;
  /** la présentation rouverte avec « ? » */
  aide: boolean;
}

export const cercleVide = (): CercleEcran => ({
  reseau: 'hors-ligne', amis: [], demandes: [], recues: [], envoyees: [], defisRecus: [], defisEnvoyes: [], aRepondre: 0,
  onglet: 'amis', ami: null, choix: null, filtreMetal: 'argent', filtreLignee: 'tout', echange: null, mode: 'libre', occupe: false, message: '', aide: false,
});

/** Le décor de l'écran d'ouverture : la scène peinte quand elle sera là, la Cuvette en attendant */
const SCENE_PEINTE = true;
const decor = SCENE_PEINTE ? './art/scenes/cercle.webp' : './art/district/cuvette-vignette.webp';

// ---------- Petits morceaux ----------

const pluriel = (n: number, mot: string, motPluriel = `${mot}s`) => `${n} ${n > 1 ? motPluriel : mot}`;
const niveauDe = (j: J.Jeu, id: string) => j.collection[id]?.niveau ?? COLLECTION.niveauDepart[moduleDef(id).rarete];

/** Une carte en petit : sa face, et ce qu'on peut faire en la touchant */
function petiteCarte(j: J.Jeu, id: string, o: { action?: string; data?: string; choisie?: boolean; marque?: string; note?: string; niveau?: number; off?: boolean } = {}): string {
  let m;
  try { m = moduleDef(id); } catch { return ''; }
  const niv = o.niveau ?? niveauDe(j, id);
  const contenu = `<span class="cr-face">${faceCarte(m, niv, multNiveau(id, niv))}</span>`
    + (o.marque ? `<span class="cr-marque">${o.marque}</span>` : '')
    + (o.note ? `<small class="cr-note">${o.note}</small>` : '');
  const cls = `cr-carte${o.choisie ? ' choisie' : ''}${o.off ? ' off' : ''}`;
  return o.action
    ? `<button type="button" class="${cls}" data-action="${o.action}" data-id="${o.data ?? id}" aria-pressed="${!!o.choisie}" aria-label="${echap(`${m.nom}, ${NOMS_RARETE[m.rarete]}`)}"${o.off ? ' disabled' : ''}>${contenu}</button>`
    : `<div class="${cls}" data-carte="${id}">${contenu}</div>`;
}

function avatarPorteur(id: string, taille = 48): string {
  const img = (() => { try { return portrait(id); } catch { return null; } })();
  let lignee: Lignee = 'tech';
  try { lignee = porteurDef(id).lignee; } catch { /* Porteur inconnu de ce jeu */ }
  return `<span class="cr-avatar" style="--t:${taille}px;--c:var(--${lignee})${img ? `;background-image:url(${img})` : ''}" aria-hidden="true"></span>`;
}

const pastille = (n: number) => (n ? ` <span class="pastille-n">${n}</span>` : '');

/** L'ouverture d'une feuille du Cercle : le voile, la poignée, le titre et le bouton qui ferme (à droite, jamais sur le titre) */
function ouvrirFeuille(id: string, surtitre: string, titre: string, classe = '', avant = ''): string {
  return `<div class="voile-feuille" data-action="cercle-fermer" aria-hidden="true"></div><section class="feuille cr-feuille ${classe}" role="dialog" aria-modal="true" aria-labelledby="${id}">`
    + `<span class="poignee" aria-hidden="true"></span><header class="feuille-tete cr-feuille-tete">${avant}<div class="titres"><span class="surtitre">${surtitre}</span><h2 id="${id}">${titre}</h2></div>`
    + `<button type="button" class="btn-icone" data-action="cercle-fermer" aria-label="Fermer">${ICO.fermer}</button></header><div class="feuille-corps">`;
}

// ---------- L'ouverture ----------

function presentation(e: EcranDistrict, ferme: boolean): string {
  const j = e.j;
  return `<section class="cr-intro" style="--decor:url(${decor})"><div class="cr-intro-texte">`
    + `<span class="surtitre">Le Cercle des quais · la place des directeurs</span>`
    + `<h2>Ici, on se mesure sans se battre pour de vrai</h2>`
    + `<p>Depuis les Accords, les directeurs n’ont plus le droit de piller leurs voisins quand ils veulent. Alors ils accostent au Cercle : on s’y salue, on y montre ses plus belles cartes, on s’y défie sur l’estrade, et on y échange ce qu’on a en double.</p></div></section>`
    + (ferme ? `<p class="fl-condition">${ICO.verrou}<span><strong>Le Cercle est fermé · vaincs le gardien de la Strate −${J.CERCLE_OUVERTURE}</strong><small>Aucun directeur ne traite avec un district qui n’a pas encore tenu son puits.</small></span></p>` : '')
    + `<ul class="cr-etapes">`
    + `<li>${ICO.ami}<div><strong>Des amis</strong><small>Ajoute un directeur par son nom. Tu vois sa vitrine : ses plus belles cartes, ses doubles, ce qu’il cherche.</small></div></li>`
    + `<li>${ICO.atk}<div><strong>Des duels</strong><small>Défie un ami en temps réel, avec tes vraies forces ou à armes égales. Tes ${J.CERCLE.duelsSemaine} premières victoires de la semaine contre des amis différents rapportent ${J.CERCLE.recompenseDuel.composants} composants et ${pluriel(J.CERCLE.recompenseDuel.eclats, 'Éclat')}.</small></div></li>`
    + `<li>${ICO.echange}<div><strong>Des échanges</strong><small>Une carte en double contre une carte du même métal. Ta carte ne part jamais, seulement un exemplaire en double. Fer et cuivre gratuits ; argent et or contre des composants ; jamais la nacre.</small></div></li>`
    + `</ul>`
    + (ferme ? ''
      : !J.cercleConstruit(j) ? `<button type="button" class="btn prim large" data-action="cercle-batiment">${ICO.marteau}Construire le Cercle</button>`
        : `<button type="button" class="btn prim large" data-action="cercle-entrer">${ICO.cercle}${e.cercle?.aide ? 'Retour au Cercle' : 'Entrer au Cercle'}</button>`);
}

// ---------- L'écran ----------

export function htmlCercle(e: EcranDistrict): string {
  const j = e.j;
  const c = e.cercle ?? cercleVide();
  const niv = j.batiments.cercle ?? 0;
  const droite = `<span class="cr-tete-boutons">`
    + (niv && J.etatCercle(j).vu && !c.aide ? `<button type="button" class="btn-icone" data-action="cercle-aide" aria-label="Comment marche le Cercle">${ICO.aide}</button>` : '')
    + `<button type="button" class="cr-niveau" data-action="cercle-batiment" aria-label="Le bâtiment, niveau ${niv}">${icone('marteau')}<b>${niv || '—'}</b></button></span>`;
  let h = entete(niv ? `CERCLE DES QUAIS · NIVEAU ${niv}` : 'CERCLE DES QUAIS', 'Le Cercle', droite);
  const ferme = !J.cercleOuvert(j);
  if (ferme || !niv || !J.etatCercle(j).vu || c.aide) return coquille(e, `<div class="cercle">${h}${presentation(e, ferme)}</div>`, 'cr cr-pres');

  // ce qu'il faut avant tout : être connecté, avoir un nom de directeur
  if (c.reseau === 'hors-ligne') {
    h += `<section class="bloc cr-garde">${ICO.compte}<div><strong>Le Cercle passe par ton compte</strong><small>Les amis, les duels et les échanges ont besoin du jeu connecté. Ta partie, elle, ne change pas.</small></div><button type="button" class="btn prim" data-action="gt-connexion">Se connecter</button></section>`
      + robot();
    return coquille(e, `<div class="cercle">${h}</div>`, 'cr');
  }
  const pseudo = j.directeur?.nom;
  if (!pseudo) {
    h += `<section class="bloc cr-garde">${ICO.ami}<div><strong>Choisis ton nom de directeur</strong><small>C’est par lui que tes amis te trouvent. Jamais ton adresse e-mail.</small></div><button type="button" class="btn prim" data-action="gt-nom">Choisir mon nom</button></section>`;
    return coquille(e, `<div class="cercle">${h}</div>`, 'cr');
  }

  const recus = c.demandes.filter((d) => d.recue).length;
  const defis = c.defisRecus.filter((d) => d.etat === 'envoye').length;
  const props = c.recues.filter((p) => p.etat === 'propose').length;
  const seg = (id: OngletCercle, nom: string, n: number) =>
    `<button type="button" role="tab" class="seg${c.onglet === id ? ' actif' : ''}" aria-selected="${c.onglet === id}" data-action="cercle-onglet" data-id="${id}">${nom}${pastille(n)}</button>`;
  h += `<div class="segments-choix trois cr-volets" role="tablist" aria-label="Amis, duels ou échanges">${seg('amis', 'Amis', recus)}${seg('duels', 'Duels', defis)}${seg('echanges', 'Échanges', props)}</div>`;
  if (c.reseau === 'chargement') h += `<p class="cr-etat">${ICO.chrono}Les quais se remplissent…</p>`;
  if (c.reseau === 'erreur') h += `<p class="cr-etat erreur" role="alert">${ICO.fele}${echap(c.erreur ?? 'Le Cercle ne répond pas.')} <button type="button" class="btn-sec" data-action="cercle-relire">Réessayer</button></p>`;
  if (c.message) h += `<p class="cr-message" role="status">${echap(c.message)}</p>`;

  h += c.onglet === 'duels' ? voletDuels(e, c) : c.onglet === 'echanges' ? voletEchanges(e, c) : voletAmis(e, c);
  h += feuilleAmi(e, c) + feuilleChoix(e, c) + feuilleEchange(e, c);
  return coquille(e, `<div class="cercle">${h}</div>`, 'cr');
}

// ---------- Amis ----------

function voletAmis(e: EcranDistrict, c: CercleEcran): string {
  const j = e.j;
  let h = `<section class="bloc cr-ajout"><h3 class="titre-bloc">${ICO.ami}Ajouter un directeur</h3>`
    + `<div class="cr-champ"><input id="cr-pseudo" type="text" autocomplete="off" autocapitalize="off" spellcheck="false" maxlength="18" placeholder="Son nom de directeur" aria-label="Nom de directeur de ton ami">`
    + `<button type="button" class="btn prim" data-action="cercle-ajouter"${c.occupe ? ' disabled' : ''}>${c.occupe ? 'Recherche…' : 'Inviter'}</button></div>`
    + `<small class="aide">Ton nom : <b>${echap(j.directeur?.nom ?? '')}</b>. Donne-le à tes amis pour qu’ils t’ajoutent.</small></section>`;

  const recues = c.demandes.filter((d) => d.recue);
  const envoyees = c.demandes.filter((d) => !d.recue);
  if (recues.length) {
    h += `<section class="bloc cr-liste"><h3 class="titre-bloc">${ICO.porteurs}Ils veulent être tes amis</h3>`
      + recues.map((d) => `<div class="cr-ligne"><span class="cr-avatar vide" aria-hidden="true">${echap(d.nom.charAt(0))}</span><div class="cr-qui"><strong>${echap(d.nom)}</strong><small>veut rejoindre ton Cercle</small></div>`
        + `<div class="cr-actions"><button type="button" class="btn prim" data-action="cercle-accepter-ami" data-id="${d.amitie}">Accepter</button><button type="button" class="btn-sec" data-action="cercle-retirer-ami" data-id="${d.amitie}" aria-label="Refuser ${echap(d.nom)}">${ICO.fermer}</button></div></div>`).join('')
      + `</section>`;
  }

  h += `<section class="bloc cr-liste"><h3 class="titre-bloc">${ICO.cercle}Tes amis <span class="cr-compte">${c.amis.length}</span></h3>`;
  if (!c.amis.length) h += `<p class="cr-vide">Personne pour l’instant. Invite un directeur par son nom, ou envoie ton lien de recrutement : tes recrues deviennent tes amis.</p>`;
  for (const a of [...c.amis].sort((x, y) => x.nom.localeCompare(y.nom))) {
    const p = a.profil;
    const comble = p ? J.souhaitsComblables(j, p.doubles).length : 0;
    const veut = p ? J.doublesEchangeables(j).filter((d) => p.souhaits.includes(d)).length : 0;
    h += `<button type="button" class="cr-ligne cr-ami" data-action="cercle-ami" data-id="${a.uid}" aria-label="La vitrine de ${echap(a.nom)}">`
      + (p ? avatarPorteur(p.porteur) : `<span class="cr-avatar vide" aria-hidden="true">${echap(a.nom.charAt(0))}</span>`)
      + `<span class="cr-qui"><strong>${echap(a.nom)}</strong><small>${p ? `Strate −${p.strate} · Cercle ${p.cercle}` : 'vitrine pas encore ouverte'}</small></span>`
      + `<span class="cr-indices">${comble ? `<span class="cr-indice souhait" title="Il a ${comble} carte(s) que tu cherches">${ICO.etoile}${comble}</span>` : ''}`
      + `${veut ? `<span class="cr-indice veut" title="Il cherche ${veut} de tes doubles">${ICO.echange}${veut}</span>` : ''}${ICO.lancer}</span></button>`;
  }
  if (envoyees.length) h += `<p class="cr-attente">${ICO.chrono}En attente : ${envoyees.map((d) => `${echap(d.nom)} <button type="button" class="cr-lien" data-action="cercle-retirer-ami" data-id="${d.amitie}">annuler</button>`).join(', ')}</p>`;
  h += `</section>`;

  // sa propre vitrine
  const v = J.etatCercle(j).vitrine;
  const max = J.vitrineMax(j);
  h += `<section class="bloc cr-vitrine"><h3 class="titre-bloc">${ICO.cartes}Ta vitrine <span class="cr-compte">${v.length} / ${max}</span></h3>`
    + `<div class="cr-rangee">${v.map((id) => petiteCarte(j, id, { action: 'cercle-choisir', data: 'vitrine' })).join('')}`
    + Array.from({ length: Math.max(0, max - v.length) }, () => `<button type="button" class="cr-place" data-action="cercle-choisir" data-id="vitrine" aria-label="Choisir une carte à montrer">${ICO.ajouter}</button>`).join('')
    + `</div><small class="aide">Ce que tes amis voient de toi${max < 3 ? ` · ${3 - max} place${3 - max > 1 ? 's' : ''} de plus avec le Cercle` : ''}.</small></section>`;
  return h;
}

/** La vitrine d'un ami : ses cartes exposées, ce qu'il a en double (tes souhaits en premier), ce qu'il cherche */
function feuilleAmi(e: EcranDistrict, c: CercleEcran): string {
  const a = c.amis.find((x) => x.uid === c.ami);
  if (!a) return '';
  const j = e.j;
  const p = a.profil;
  const souhaits = J.etatCercle(j).souhaits;
  const sans = J.raisonSansEchange(j, a.depuis, e.now);
  let h = ouvrirFeuille('cr-ami-titre', p ? `Strate −${p.strate} · ${pluriel(p.victoires, 'victoire')} en duel` : 'Directeur', echap(a.nom), 'cr-ami-feuille', p ? avatarPorteur(p.porteur, 56) : '');
  if (!p) h += `<p class="cr-vide">Sa vitrine n’est pas encore ouverte : elle apparaîtra quand il aura construit son Cercle.</p>`;
  else {
    h += `<div class="cr-boutons"><button type="button" class="btn prim" data-action="cercle-defier" data-id="${a.uid}">${ICO.atk}Défier</button>`
      + `<button type="button" class="btn sec" data-action="cercle-echanger" data-id="${a.uid}"${sans ? ' disabled' : ''}>${ICO.echange}Échanger</button></div>`
      + (sans ? `<small class="aide cr-sans">${echap(sans)}</small>` : '');
    if (p.vitrine.length) h += `<h3 class="titre-bloc">${ICO.cartes}Sa vitrine</h3><div class="cr-rangee">${p.vitrine.map((x) => petiteCarte(j, x.id, { niveau: x.niveau })).join('')}</div>`;
    const doubles = [...p.doubles].sort((x, y) => Number(souhaits.includes(y)) - Number(souhaits.includes(x)));
    h += `<h3 class="titre-bloc">${ICO.echange}Ses doubles <span class="cr-compte">${doubles.length}</span></h3>`
      + (doubles.length ? `<div class="cr-grille">${doubles.slice(0, 60).map((id) => petiteCarte(j, id, { marque: souhaits.includes(id) ? `${ICO.etoile}` : '', note: j.collection[id] ? '' : 'nouvelle pour toi' })).join('')}</div>` : `<p class="cr-vide">Rien en double pour l’instant.</p>`);
    const mesDoubles = J.doublesEchangeables(j);
    h += `<h3 class="titre-bloc">${ICO.etoile}Ce qu’il cherche <span class="cr-compte">${p.souhaits.length}</span></h3>`
      + (p.souhaits.length ? `<div class="cr-grille">${p.souhaits.map((id) => petiteCarte(j, id, { note: mesDoubles.includes(id) ? 'tu l’as en double' : '', marque: mesDoubles.includes(id) ? ICO.ok : '' })).join('')}</div>` : `<p class="cr-vide">Il n’a encore rien noté.</p>`);
  }
  h += `<button type="button" class="cr-lien cr-retirer" data-action="cercle-retirer-ami" data-id="${a.amitie}">Retirer ${echap(a.nom)} de tes amis</button>`;
  return h + `</div></section>`;
}

// ---------- Duels ----------

function voletDuels(e: EcranDistrict, c: CercleEcran): string {
  const j = e.j;
  const s = J.etatCercle(j);
  const reste = J.duelsRecompensesRestants(j, e.now);
  const faits = J.CERCLE.duelsSemaine - reste;
  let h = `<section class="bloc cr-semaine"><div class="cr-crans" aria-label="${faits} victoire(s) récompensée(s) sur ${J.CERCLE.duelsSemaine} cette semaine">`
    + Array.from({ length: J.CERCLE.duelsSemaine }, (_, i) => `<i class="${i < faits ? 'plein' : ''}">${i < faits ? ICO.ok : ''}</i>`).join('') + `</div>`
    + `<div><strong>${reste ? `Encore ${pluriel(reste, 'victoire')} récompensée${reste > 1 ? 's' : ''} cette semaine` : 'Toutes les victoires de la semaine sont gagnées'}</strong>`
    + `<small>${J.CERCLE.recompenseDuel.composants} composants et ${pluriel(J.CERCLE.recompenseDuel.eclats, 'Éclat')} par ami différent battu. Bilan : ${pluriel(s.victoires, 'victoire')}, ${pluriel(s.defaites, 'défaite')}.</small></div></section>`;

  const recus = c.defisRecus.filter((d) => d.etat === 'envoye');
  if (recus.length) {
    h += `<section class="bloc cr-liste"><h3 class="titre-bloc">${ICO.atk}On te défie</h3>`
      + recus.map((d) => `<div class="cr-ligne cr-defi"><span class="cr-avatar vide" aria-hidden="true">${echap(d.nomDe.charAt(0))}</span><div class="cr-qui"><strong>${echap(d.nomDe)}</strong><small>${d.mode === 'egal' ? 'à armes égales' : 'avec vos vraies forces'}</small></div>`
        + `<div class="cr-actions"><button type="button" class="btn prim" data-action="cercle-defi-accepter" data-id="${d.id}">${ICO.lancer}Jouer</button><button type="button" class="btn-sec" data-action="cercle-defi-refuser" data-id="${d.id}" aria-label="Refuser le défi de ${echap(d.nomDe)}">${ICO.fermer}</button></div></div>`).join('')
      + `</section>`;
  }

  const envoyes = c.defisEnvoyes.filter((d) => d.etat === 'envoye');
  h += `<section class="bloc cr-liste"><h3 class="titre-bloc">${ICO.porteurs}Défier un ami</h3>`
    + `<div class="segments-choix deux cr-mode" role="radiogroup" aria-label="Mode du duel">`
    + `<button type="button" role="radio" class="seg${c.mode === 'libre' ? ' actif' : ''}" aria-checked="${c.mode === 'libre'}" data-action="cercle-mode" data-id="libre">Vraies forces</button>`
    + `<button type="button" role="radio" class="seg${c.mode === 'egal' ? ' actif' : ''}" aria-checked="${c.mode === 'egal'}" data-action="cercle-mode" data-id="egal">À armes égales</button></div>`
    + `<small class="aide">${c.mode === 'egal' ? 'Chaque carte revient au niveau de départ de son métal, chaque Porteur à ses PV de base : seule ta façon de jouer compte.' : 'Chacun vient avec son escouade active, ses cartes et ses niveaux.'} Il faut un Augmenté, un Géné et un Résonant dans l’escouade.</small>`;
  if (!c.amis.length) h += `<p class="cr-vide">Ajoute d’abord un ami dans le volet Amis.</p>`;
  for (const a of c.amis) {
    const attend = envoyes.find((d) => d.a === a.uid);
    h += `<div class="cr-ligne">${a.profil ? avatarPorteur(a.profil.porteur) : `<span class="cr-avatar vide" aria-hidden="true">${echap(a.nom.charAt(0))}</span>`}<div class="cr-qui"><strong>${echap(a.nom)}</strong><small>${attend ? 'défi envoyé, il doit l’accepter' : s.battus.includes(a.uid) && s.semaine === J.semaineDe(e.now) ? 'déjà battu cette semaine' : 'prêt à jouer'}</small></div>`
      + `<div class="cr-actions">${attend ? `<button type="button" class="btn-sec" data-action="cercle-defi-annuler" data-id="${attend.id}">Annuler</button>` : `<button type="button" class="btn prim" data-action="cercle-defier" data-id="${a.uid}"${c.occupe ? ' disabled' : ''}>${ICO.atk}Défier</button>`}</div></div>`;
  }
  h += `</section>`;
  return h + robot();
}

/** S'échauffer contre le robot : toujours possible, même sans connexion */
const robot = () => `<section class="bloc cr-robot"><div><strong>S’échauffer</strong><small>Un duel contre le robot d’entraînement, sans rien à gagner ni à perdre.</small></div><button type="button" class="btn sec" data-action="cercle-robot">${ICO.lancer}S’entraîner</button></section>`;

// ---------- Échanges ----------

function voletEchanges(e: EcranDistrict, c: CercleEcran): string {
  const j = e.j;
  const s = J.etatCercle(j);
  const reste = J.echangesRestants(j, e.now);
  let h = `<section class="bloc cr-regles"><div class="cr-chiffre"><b>${reste}</b><small>échange${reste > 1 ? 's' : ''} possible${reste > 1 ? 's' : ''} aujourd’hui</small></div>`
    + `<div class="cr-chiffre"><b>${s.enAttente.length}/${J.ouvertesMax(j)}</b><small>propositions en attente</small></div>`
    + `<div class="cr-chiffre metal" style="--m:${COULEUR_RARETE[J.metalMax(j)]}"><b>${NOMS_RARETE[J.metalMax(j)]}</b><small>métal le plus rare échangeable</small></div></section>`;

  const recues = c.recues.filter((p) => p.etat === 'propose');
  if (recues.length) {
    h += `<section class="bloc cr-liste"><h3 class="titre-bloc">${ICO.echange}On te propose</h3>`;
    for (const p of recues) {
      const ami = c.amis.find((a) => a.uid === p.de);
      const v = J.verifierAcceptation(j, p.demande, p.donne, ami?.depuis ?? e.now, e.now);
      const cout = J.coutEchange(p.demande);
      h += `<div class="cr-prop"><span class="cr-prop-qui"><strong>${echap(p.nomDe)}</strong><small>te propose</small></span>`
        + `<div class="cr-paire">${petiteCarte(j, p.donne, { note: j.collection[p.donne] ? 'tu la reçois' : 'nouvelle pour toi', marque: s.souhaits.includes(p.donne) ? ICO.etoile : '' })}<span class="cr-fleche" aria-label="contre">${ICO.echange}</span>${petiteCarte(j, p.demande, { note: 'ton double' })}</div>`
        + (v.ok ? '' : `<small class="cr-sans">${echap(v.message ?? '')}</small>`)
        + `<div class="cr-actions"><button type="button" class="btn prim" data-action="cercle-prop-accepter" data-id="${p.id}"${v.ok && !c.occupe ? '' : ' disabled'}>${ICO.ok}Accepter${cout ? ` · ${cout} ${icone('composants')}` : ''}</button>`
        + `<button type="button" class="btn-sec" data-action="cercle-prop-refuser" data-id="${p.id}">Refuser</button></div></div>`;
    }
    h += `</section>`;
  }

  if (s.enAttente.length) {
    h += `<section class="bloc cr-liste"><h3 class="titre-bloc">${ICO.chrono}Tes propositions</h3>`;
    for (const p of s.enAttente) {
      h += `<div class="cr-prop envoyee"><span class="cr-prop-qui"><strong>À ${echap(p.nomAmi)}</strong><small>sans réponse · revient d’elle-même au bout de ${J.CERCLE.propositionHeures} h</small></span>`
        + `<div class="cr-paire">${petiteCarte(j, p.donne, { note: 'tu donnes' })}<span class="cr-fleche" aria-label="contre">${ICO.echange}</span>${petiteCarte(j, p.recoit, { note: 'tu reçois' })}</div>`
        + `<div class="cr-actions"><button type="button" class="btn-sec" data-action="cercle-prop-annuler" data-id="${p.id}">Reprendre ma carte</button></div></div>`;
    }
    h += `</section>`;
  }

  // composer : avec quel ami ?
  const amisOk = c.amis.filter((a) => a.profil && !J.raisonSansEchange(j, a.depuis, e.now));
  h += `<section class="bloc cr-liste"><h3 class="titre-bloc">${ICO.echange}Proposer un échange</h3>`;
  if (!J.cercleConstruit(j)) h += `<p class="cr-vide">Construis d’abord le Cercle.</p>`;
  else if (!c.amis.length) h += `<p class="cr-vide">Ajoute d’abord un ami dans le volet Amis.</p>`;
  else if (!amisOk.length) h += `<p class="cr-vide">${echap(J.raisonSansEchange(j, Math.max(...c.amis.map((a) => a.depuis)), e.now) ?? 'Tes amis n’ont pas encore ouvert leur vitrine.')}</p>`;
  for (const a of amisOk) {
    const p = a.profil!;
    const comble = J.souhaitsComblables(j, p.doubles).length;
    h += `<button type="button" class="cr-ligne cr-ami" data-action="cercle-echanger" data-id="${a.uid}">${avatarPorteur(p.porteur)}<span class="cr-qui"><strong>${echap(a.nom)}</strong><small>${pluriel(p.doubles.length, 'double')}${comble ? ` · ${comble} que tu cherches` : ''}</small></span>${ICO.lancer}</button>`;
  }
  h += `</section>`;

  // ses souhaits
  h += `<section class="bloc cr-souhaits"><h3 class="titre-bloc">${ICO.etoile}Tes souhaits <span class="cr-compte">${s.souhaits.length} / ${J.CERCLE.souhaitsMax}</span></h3>`
    + `<small class="aide">Tes amis voient ce que tu cherches : leurs doubles qui te manquent ressortent en premier.</small>`
    + `<div class="cr-rangee">${s.souhaits.map((id) => petiteCarte(j, id, { action: 'cercle-souhait', note: j.collection[id] ? '' : 'manquante' })).join('')}`
    + `<button type="button" class="cr-place" data-action="cercle-choisir" data-id="souhaits" aria-label="Ajouter un souhait">${ICO.ajouter}</button></div></section>`;
  return h;
}

/** Le choix d'une carte : pour ses souhaits (tout le catalogue échangeable) ou pour sa vitrine (sa collection) */
function feuilleChoix(e: EcranDistrict, c: CercleEcran): string {
  if (!c.choix) return '';
  const j = e.j;
  const s = J.etatCercle(j);
  const souhaits = c.choix === 'souhaits';
  const metaux = RARETES.filter((r) => r !== 'nacre' || !souhaits);
  const filtre = (id: string) => c.filtreLignee === 'tout' || moduleDef(id).lignee === c.filtreLignee;
  const ids = souhaits
    ? tirablesEn(c.filtreMetal).map((m) => `${m.id}@${c.filtreMetal}`).filter(filtre)
      .sort((x, y) => Number(!!j.collection[x]) - Number(!!j.collection[y]) || moduleDef(x).nom.localeCompare(moduleDef(y).nom))
    : Object.keys(j.collection).filter((id) => moduleDef(id).rarete === c.filtreMetal && filtre(id));
  const choisis = souhaits ? s.souhaits : s.vitrine;
  let h = ouvrirFeuille('cr-choix-titre', souhaits ? `${s.souhaits.length} / ${J.CERCLE.souhaitsMax} souhaits` : `${s.vitrine.length} / ${J.vitrineMax(j)} en vitrine`, souhaits ? 'Les cartes que tu cherches' : 'Ta vitrine')
    + `<p class="aide">${souhaits ? 'Touche une carte pour l’ajouter ou la retirer. Celles qui te manquent passent en premier.' : 'Touche une carte pour la montrer à tes amis, ou la retirer.'}</p>`
    + `<div class="cr-filtres" role="group" aria-label="Métal">${metaux.map((r) => `<button type="button" class="cr-filtre${c.filtreMetal === r ? ' actif' : ''}" style="--m:${COULEUR_RARETE[r]}" data-action="cercle-filtre-metal" data-id="${r}" aria-pressed="${c.filtreMetal === r}">${NOMS_RARETE[r]}</button>`).join('')}</div>`
    + `<div class="cr-filtres" role="group" aria-label="Lignée">${(['tout', 'tech', 'bio', 'reso'] as const).map((l) => `<button type="button" class="cr-filtre${c.filtreLignee === l ? ' actif' : ''}" data-action="cercle-filtre-lignee" data-id="${l}" aria-pressed="${c.filtreLignee === l}">${l === 'tout' ? 'Toutes' : NOMS_LIGNEE[l].nom}s</button>`).join('')}</div>`
    + (souhaits && c.filtreMetal === 'or' && J.metalMax(j) !== 'or' ? `<small class="aide">L’or s’échange à partir du niveau ${J.CERCLE.orAuNiveau} du Cercle : tu peux déjà le noter.</small>` : '')
    + (ids.length ? `<div class="cr-grille">${ids.map((id) => petiteCarte(j, id, { action: souhaits ? 'cercle-souhait' : 'cercle-vitrine', choisie: choisis.includes(id), marque: choisis.includes(id) ? ICO.ok : '', note: souhaits && !j.collection[id] ? 'manquante' : '' })).join('')}</div>`
      : `<p class="cr-vide">Aucune carte ici.</p>`);
  return h + `</div></section>`;
}

/** Composer un échange avec un ami : ce qu'on lui demande (ses doubles), puis ce qu'on donne (ses doubles du même métal) */
function feuilleEchange(e: EcranDistrict, c: CercleEcran): string {
  const x = c.echange;
  if (!x) return '';
  const j = e.j;
  const a = c.amis.find((y) => y.uid === x.ami);
  const p = a?.profil;
  if (!a || !p) return '';
  const souhaits = J.etatCercle(j).souhaits;
  const peut = (id: string) => !J.raisonNonEchangeable(j, id);
  let h = ouvrirFeuille('cr-ech-titre', `Échange avec ${echap(a.nom)} · étape ${x.recoit ? 2 : 1} sur 2`, x.recoit ? 'Que donnes-tu en échange ?' : 'Que veux-tu recevoir ?', 'cr-composer');
  if (!x.recoit) {
    const doubles = p.doubles.filter(peut).sort((u, v) => Number(souhaits.includes(v)) - Number(souhaits.includes(u)) || Number(!!j.collection[u]) - Number(!!j.collection[v]));
    h += `<p class="aide">Ses doubles. Tes souhaits ${ICO.etoile} et les cartes qui te manquent passent en premier.</p>`
      + (doubles.length ? `<div class="cr-grille">${doubles.map((id) => petiteCarte(j, id, { action: 'cercle-recoit', marque: souhaits.includes(id) ? ICO.etoile : '', note: j.collection[id] ? '' : 'nouvelle' })).join('')}</div>`
        : `<p class="cr-vide">${echap(a.nom)} n’a rien en double que tu puisses recevoir pour l’instant.</p>`);
    return h + `</div></section>`;
  }
  const metal = J.metalDe(x.recoit);
  const miens = J.doublesEchangeables(j).filter((id) => J.metalDe(id) === metal && id !== x.recoit)
    .sort((u, v) => Number(p.souhaits.includes(v)) - Number(p.souhaits.includes(u)));
  h += `<p class="aide">Un de tes doubles en ${NOMS_RARETE[metal].toLowerCase()}. Ce qu’il cherche ${ICO.ok} passe en premier : il acceptera plus volontiers.</p>`
    + `<div class="cr-paire grand">${petiteCarte(j, x.recoit, { note: 'tu reçois' })}<span class="cr-fleche">${ICO.echange}</span>${x.donne ? petiteCarte(j, x.donne, { note: 'tu donnes' }) : `<span class="cr-place vide" aria-hidden="true">?</span>`}</div>`
    + (miens.length ? `<div class="cr-grille">${miens.map((id) => petiteCarte(j, id, { action: 'cercle-donne', choisie: x.donne === id, marque: p.souhaits.includes(id) ? ICO.ok : '', note: `${j.collection[id]!.doublons} en double` })).join('')}</div>`
      : `<p class="cr-vide">Tu n’as aucun double en ${NOMS_RARETE[metal].toLowerCase()} à donner.</p>`);
  const v = x.donne ? J.verifierProposition(j, x.donne, x.recoit, a.depuis, e.now) : null;
  const cout = J.coutEchange(x.recoit);
  h += `<div class="cr-pied">${v && !v.ok ? `<small class="cr-sans">${echap(v.message ?? '')}</small>` : ''}`
    + `<button type="button" class="btn-sec" data-action="cercle-recoit" data-id="">${ICO.retour}Changer</button>`
    + `<button type="button" class="btn prim" data-action="cercle-proposer"${v?.ok && !c.occupe ? '' : ' disabled'}>${ICO.lancer}Proposer${cout ? ` · ${cout} ${icone('composants')}` : ''}</button></div>`;
  return h + `</div></section>`;
}

/** Une vérification simple du pseudo tapé (la même clé que le Grand Tableau) */
export const clePseudoValide = (nom: string) => /^[a-z0-9]{3,24}$/.test(clePseudo(nom));
