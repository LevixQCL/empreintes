// La coquille des écrans du district : barre de ressources en haut, navigation en bas, notifications, menu.
// Tout l'affichage du district passe par ici pour rester cohérent d'un écran à l'autre.

import { porteurDef } from '../core/donnees';
import { CHAPITRES, chapitreOuvert } from '../core/chroniques';
import { energieParHeure, objectifCourant, stockage, type Jeu } from '../core/jeu';
import type { Lignee } from '../core/types';
import { portrait } from './art';
import { ICO, icone, type Icone } from './icones';
import { COULEUR, echap, panneauCompte, type Compte } from './vue';

export type Vue = 'archipel' | 'coupe' | 'escouade' | 'rencontre' | 'codex' | 'cartes';
export type Filtre = 'tout' | Lignee;

export interface EcranDistrict {
  j: Jeu;
  vue: Vue;
  selection: import('../core/types').BatimentId | null;
  escouade: string[];
  strateChoisie: number;
  message: string;
  compte: Compte;
  now: number;
  /** lignes du résumé « Pendant ton absence » (vide = rien à montrer) */
  retour: string[];
  /** menu « Plus » ouvert */
  menu: boolean;
  /** carte ouverte en détail dans l'écran Cartes (clé module@métal) */
  carte: string | null;
  /** Porteur dont on construit le deck (feuille « Les cartes de… »), ou null */
  deck: string | null;
  /** lignée affichée dans l'écran Cartes */
  filtre: Filtre;
  /** Bibliothèque : onglet, chapitre ouvert, et écran où revenir */
  onglet: 'chroniques' | 'archives';
  chapitre: string | null;
  retourBiblio: 'archipel' | 'coupe' | 'titre';
  /** rencontre : nombre de répliques affichées */
  bulles: number;
}

export const ent = (n: number) => Math.floor(n).toLocaleString('fr-BE');
export const duree = (ms: number) => {
  const s = Math.max(0, Math.ceil(ms / 1000));
  if (s >= 86_400) return `${Math.floor(s / 86_400)} j ${Math.floor((s % 86_400) / 3600)} h`;
  if (s >= 3600) return `${Math.floor(s / 3600)} h ${String(Math.floor((s % 3600) / 60)).padStart(2, '0')}`;
  return s >= 60 ? `${Math.floor(s / 60)} min ${String(s % 60).padStart(2, '0')}` : `${s} s`;
};

export const NOM_LIGNEE: Record<Lignee, string> = { tech: 'Augmenté', bio: 'Géné', reso: 'Résonant' };
export const NOM_LIGNEES: Record<Lignee, string> = { tech: 'Augmentés', bio: 'Génés', reso: 'Résonants' };

/**
 * Le portrait d'un Porteur : son illustration si elle existe, sinon son initiale sur un hexagone de sa lignée.
 * @param taille en pixels
 */
export function avatar(id: string, taille = 40, extra = ''): string {
  const d = porteurDef(id);
  const p = portrait(id);
  return `<span class="avatar${p ? '' : ' sans-portrait'}${extra ? ' ' + extra : ''}" style="--c:${COULEUR[d.lignee]};--t:${taille}px" aria-hidden="true">`
    + (p ? `<img src="${p}" alt="" decoding="async" loading="lazy">` : `<b>${echap(d.nom.charAt(0))}</b>`) + `</span>`;
}

/** Une ressource : icône, valeur ; en rouge si on n'en a pas assez */
export function prix(icone: Icone, v: number, assez = true, titre = ''): string {
  return `<span class="prix ${icone}${assez ? '' : ' manque'}"${titre ? ` title="${titre}"` : ''}>${ICO[icone]}${ent(v)}</span>`;
}

export function couts(j: Jeu, c: { energie?: number; composants?: number; eclats?: number }): string {
  return (c.energie ? prix('energie', c.energie, j.energie >= c.energie, 'énergie') : '')
    + (c.composants ? prix('composants', c.composants, j.composants >= c.composants, 'composants') : '')
    + (c.eclats ? prix('eclats', c.eclats, j.eclats >= c.eclats, 'Éclats') : '');
}

/** La barre des ressources, toujours en haut */
export function hud(j: Jeu): string {
  const max = stockage(j);
  const plein = j.energie >= max;
  return `<header class="hud" aria-label="Ressources">`
    + `<div class="res energie${plein ? ' plein' : ''}" title="Énergie : ${ent(j.energie)} sur ${ent(max)}, +${energieParHeure(j)} par heure">${icone('energie')}<span class="v">${ent(j.energie)}</span>`
    + `<span class="jauge-res"><i style="width:${Math.min(100, (100 * j.energie) / Math.max(1, max))}%"></i></span><small>${plein ? 'plein' : `+${energieParHeure(j)}/h`}</small></div>`
    + `<div class="res composants" title="Composants">${icone('composants')}<span class="v">${ent(j.composants)}</span><small>comp.</small></div>`
    + `<div class="res eclats" title="Éclats">${icone('eclats')}<span class="v">${ent(j.eclats)}</span><small>Éclats</small></div>`
    + `<div class="res abysse" title="Strate la plus profonde ouverte">${icone('strate')}<span class="v">−${j.strate}</span><small>Strate</small></div>`
    + `</header>`;
}

const ONGLETS: { vue: Vue | 'plus'; nom: string; icone: Icone }[] = [
  { vue: 'archipel', nom: 'District', icone: 'district' },
  { vue: 'coupe', nom: 'Tour', icone: 'tour' },
  { vue: 'cartes', nom: 'Cartes', icone: 'cartes' },
  { vue: 'codex', nom: 'Chroniques', icone: 'codex' },
  { vue: 'plus', nom: 'Plus', icone: 'plus' },
];

/** La navigation du bas. Les onglets fermés avant la chambre scellée portent un cadenas. */
export function navigation(e: EcranDistrict): string {
  const j = e.j;
  const o = objectifCourant(j);
  const alerte: Partial<Record<Vue | 'plus', boolean>> = {
    archipel: !!(j.forge && e.now >= j.forge.fin) || !!(o && o.fait(j)),
    cartes: !!(o && o.titre === 'Greffer une carte' && !o.fait(j)),
    coupe: !!j.expedition || !!(o && o.titre === 'Descendre' && !o.fait(j)),
    codex: CHAPITRES.some((c) => chapitreOuvert(c, j.strate) && !j.lus.includes(c.id)),
  };
  const actif = e.menu ? 'plus' : e.vue === 'escouade' ? 'coupe' : e.vue;
  return `<nav class="nav" aria-label="Navigation">` + ONGLETS.map((t) => {
    const ferme = !j.chambre && t.vue === 'cartes';
    const action = t.vue === 'plus' ? 'menu' : t.vue;
    return `<button type="button" class="onglet${actif === t.vue ? ' actif' : ''}" data-action="${action}"${ferme ? ' disabled' : ''}${actif === t.vue ? ' aria-current="page"' : ''}>`
      + `<span class="onglet-ico">${ferme ? ICO.verrou : icone(t.icone)}${alerte[t.vue] ? '<i class="pastille-alerte" aria-label="nouveau"></i>' : ''}</span><span>${t.nom}</span></button>`;
  }).join('') + `</nav>`;
}

/** Le message du moment, posé au-dessus de la navigation ; on le touche pour le fermer */
export function toast(message: string): string {
  if (!message) return '';
  return `<button type="button" class="toast" data-action="ok-message" role="status">${ICO.cristal}<span>${echap(message)}</span></button>`;
}

/** Le menu « Plus » : compte, intro, journal */
export function menu(e: EcranDistrict): string {
  if (!e.menu) return '';
  const c = e.compte;
  let h = `<div class="voile-feuille" data-action="menu" aria-hidden="true"></div><section class="feuille menu" role="dialog" aria-modal="true" aria-label="Menu">`
    + `<span class="poignee" aria-hidden="true"></span><header class="feuille-tete"><div class="titres"><span class="surtitre">EMPREINTES · ALPHA</span><h2>Menu</h2></div>`
    + `<button type="button" class="btn-icone" data-action="menu" aria-label="Fermer">${ICO.fermer}</button></header><div class="feuille-corps">`;
  h += `<div class="liste-menu">`
    + (c.actif ? `<button type="button" class="ligne-menu" data-action="compte" aria-expanded="${c.ouvert}">${ICO.compte}<span><strong>Compte</strong><small>${c.utilisateur ? `Connecté : ${echap(c.utilisateur.nom)}` : 'Retrouver ta progression sur un autre appareil'}</small></span></button>` : '')
    + `<button type="button" class="ligne-menu" data-action="intro">${ICO.film}<span><strong>Revoir l’intro</strong><small>L’histoire de 2121, depuis le début</small></span></button></div>`;
  h += panneauCompte(c);
  h += `<section class="bloc"><h3 class="titre-bloc">${ICO.journal}Journal du district</h3><ol class="journal-liste">${e.j.journal.map((t) => `<li>${echap(t)}</li>`).join('')}</ol></section>`;
  return h + `</div></section>`;
}

/** Entête d'un écran : sur-titre, titre, et un bouton à droite */
export function entete(surtitre: string, titre: string, droite = ''): string {
  return `<header class="entete"><div class="titres"><span class="surtitre">${surtitre}</span><h1>${titre}</h1></div>${droite}</header>`;
}

/** L'écran complet du district : ressources, contenu, message, navigation, menu */
export function coquille(e: EcranDistrict, contenu: string, classe = ''): string {
  return `<div class="ecran ${classe}">${hud(e.j)}<main class="contenu">${contenu}</main>${toast(e.message)}${navigation(e)}${menu(e)}</div>`;
}
