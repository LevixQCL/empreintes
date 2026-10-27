// Rendu de l'écran de combat à partir d'un état. Aucune règle de jeu ici : seulement de l'affichage.
// Disposition, de haut en bas : la scène de l'ennemi (son intention en évidence), l'escouade, la chaîne et le Flux,
// la main, puis le bouton Lancer toujours au même endroit, sous le pouce.

import { ECLATS, estGardien, apercuChaine, detailForce, type DetailForce, capacite, coupDeFuite, partFelure, eclatsPossibles, felureVisible, ligneeGeste, placesLibres, placesPrises, soigneUnSeul, texteIntention, tousEnnemis, intentionDe, enGroupe, ennemisDebout as C_ennemisDebout, brumeActive as C_brume, puissance, usureCombat } from '../core/combat';
import { CONDITIONS, NOMS_LIGNEE, ZONES, ennemiDef, porteurDef, texteTrait, zoneDe } from '../core/donnees';
import { BATTU_PAR, REGLES, analyserChaine, frequenceLibre, frequencesEffectives, places, prolonge, serieFinale } from '../core/regles';
import { NOMS_EFFET, effetsDe, libelleEffet, texteEffet } from '../core/effets';
import type { CombatEtat, EnnemiEtat, Geste, LigneeGeste, Rarete } from '../core/types';
import { peutFuir, peutReculer, sallePrecedente, type Expedition, type TypeSalle } from '../core/expedition';
import { DISTRICT, PILLAGE } from '../core/jeu';
import { ageArchipel, artGardien, vignetteArchipel, fondCombat, illustrationEnnemi, illustrationModule, portrait } from './art';
import { corpsFace, couleurFrequence, styleFace, type Face } from './carte';
import { sonActif } from './impact';
import { ICO } from './icones';
import type { Decouverte } from '../core/decouvertes';
import { feuilleGuide, lienGuide, type OngletGuide } from './guide';
import { echap } from './outils';
import { feuilleJournal, type OngletJournal } from './journal';

interface Pop {
  id: number;
  cible: string;
  texte: string;
  /** taille du chiffre (1 = normale) : les coups de fin de chaîne s'affichent plus gros */
  echelle?: number;
  couleur: string;
}

const ICONE_SON = '<svg class="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 9h4l5-4v14l-5-4H4z"/><path d="M16.5 8.5a5 5 0 0 1 0 7M19 6a8.5 8.5 0 0 1 0 12"/></svg>';
const ICONE_MUET = '<svg class="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 9h4l5-4v14l-5-4H4z"/><path d="M17 9l5 6M22 9l-5 6"/></svg>';

export interface Fin {
  titre: string;
  texte: string;
  bouton: string;
  action: 'suivant' | 'remonter';
  /** second bouton facultatif */
  bouton2?: string;
  action2?: 'suivant' | 'remonter';
}

export interface Compte {
  actif: boolean;
  ouvert: boolean;
  /** anonyme : le compte invisible du premier lancement, pas encore relié à Google ou à un e-mail */
  utilisateur: { nom: string; anonyme?: boolean } | null;
  occupe: boolean;
  erreur: string;
  info: string;
  synchro: 'aucune' | 'en-cours' | 'ok' | 'erreur';
  /** le code de la dernière erreur de synchronisation (pour comprendre ce qui bloque) */
  codeErreur?: string;
  /** le pseudo choisi (nom de directeur), affiché à la place du nom du compte Google */
  pseudo?: string;
  /** la partie gardée en secours quand une autre l'a remplacée ; confirmer : le joueur a touché « Restaurer » une première fois */
  secours?: { strate: number; le: number; actuelle: number; confirmer: boolean } | null;
  /** on sait si le joueur est connecté, et la partie du compte est récupérée (ou il n'y a pas de compte, ou on est hors ligne) */
  pret?: boolean;
}

export interface Ecran {
  x: Expedition;
  etat: CombatEtat;
  verrou: boolean;
  regles: boolean;
  pops: Pop[];
  fin: Fin | null;
  /** consigne du combat guidé (chambre scellée) */
  lecon?: string;
  /** une mécanique rencontrée pour la première fois, à expliquer (decouvertes.ts) */
  decouverte?: Decouverte;
  /** ce que dit le gardien, à son entrée ou au passage de sa seconde phase (campagne.ts) */
  parole?: { nom: string; texte: string };
  /** PV (en %) juste avant le dernier coup reçu, par cible : la jauge laisse une traînée qui se vide */
  traces?: Record<string, number>;
  /** pendant l'animation d'une chaîne : la place de la carte qui agit */
  actif?: number;
  /** la feuille « Fuir le combat ? » est ouverte */
  fuite?: boolean;
  /** le choix du Coup d'éclat est déplié (à la place des boutons du Flux) */
  eclats?: boolean;
  /** le mode d'emploi des cartes est ouvert (depuis l'aide), et les cartes trouvées qu'il peut nommer */
  guide?: OngletGuide | null;
  trouvees?: ReadonlySet<string>;
  /** le journal du combat est ouvert (tours joués, ou défausse et pioche) */
  journal?: OngletJournal | null;
}

export const COULEUR: Record<LigneeGeste, string> = {
  tech: 'var(--tech)', bio: 'var(--bio)', reso: 'var(--reso)', neutre: 'var(--ivory)',
};

const LIBELLE = { atk: 'attaque', bouclier: 'protection', soin: 'soin' };

const FONDS: Record<string, string> = { ilka: '#3A4E63', doran: '#3B4D37', vela: '#44395C', coursier: '#33465A', docker: '#36462F', guetteur: '#3D3352', sasha: '#3D4752', nuit: '#2F3B2E', aurel: '#3A3050', remanent: '#2A2438', vigie: '#26313D', confluence: '#2E2B22', rampeur: '#2C3326', pilleur: '#2F2A24', brigadier: '#2E2A3E', 'echo-veilleur': '#252238', 'sentinelle-verre': '#22303A', 'gardien-registres': '#2B2533', double: '#2A2236', 'essaim-ambre': '#352A18', 'automate-graveur': '#29303A', tisseuse: '#33261F', 'premier-porteur': '#1E1C2A' };

const pct = (v: number, max: number) => Math.max(0, Math.min(100, (100 * v) / max));

function popsPour(e: Ecran, cible: string) {
  return e.pops.filter((p) => p.cible === cible)
    .map((p) => `<span class="pop${(p.echelle ?? 1) >= 1.5 ? ' gros' : ''}" style="--pc:${p.couleur};--ps:${p.echelle ?? 1}" aria-hidden="true">${echap(p.texte)}</span>`).join('');
}

/**
 * Une carte en combat (décision du 22 octobre 2026 : la carte qu'on collectionne est celle qu'on joue).
 * Depuis le 27 octobre 2026, la même face que dans la collection (`corpsFace`, src/ui/carte.ts) : à cette taille,
 * elle ne garde que la Fréquence principale, la valeur et l'icône de l'effet. Posée dans la chaîne, la Fréquence affichée
 * est celle qui compte (`g.f`) ; une carte qui prolonge la suite fait briller sa Fréquence, une carte qui brise la Fêlure
 * de l'ennemi le dit dans sa capsule de Fréquence.
 */
/** Les Porteurs à terre du combat affiché : leurs cartes s'affichent éteintes (−15 % de force, sans effet) */
let ETEINTS = new Set<string>();
/** Le combat affiché : chaque carte y lit sa force réelle (detailForce) */
let ETAT: CombatEtat | null = null;

export function geste(g: Geste, taille: 'chaine' | 'main', action: string, o: { halo?: boolean; off?: boolean; serre?: boolean; vise?: boolean; felure?: boolean } = {}) {
  const lign = ligneeGeste(g);
  const eteinte = !!g.porteur && ETEINTS.has(g.porteur);
  // la force affichée est celle qui tombera (27 octobre 2026, Luc et Bryan) : vert si la carte est renforcée, rouge si elle est affaiblie ;
  // le détail (chaque bonus et malus) s'ouvre en appui long, dans la loupe
  const detail = ETAT && action !== 'demo' ? detailForce(ETAT, g.uid) : null;
  const vReel = detail?.total ?? (eteinte ? Math.round(g.v * REGLES.eteinte) : g.v);
  const tendance = vReel > g.v ? 'hausse' as const : vReel < g.v ? 'baisse' as const : undefined;
  if (eteinte) g = { ...g, effet: frequenceLibre(g.effet) ? g.effet : undefined, effet2: undefined };
  const nomP = g.porteur ? porteurDef(g.porteur).nom : 'District';
  const accord = frequenceLibre(g.effet);
  const metal = (g.carte?.split('@')[1] as Rarete | undefined) ?? 'fer';
  const d: Face = {
    carte: g.carte, repli: g.porteur ? portrait(g.porteur) : null, metal, type: g.type, v: vReel, ...(tendance ? { tendance } : {}),
    fs: [g.f, ...(g.fs ?? []).filter((f) => f !== g.f)], nom: g.nom, effet: g.effet, ...(g.effet2 ? { effet2: g.effet2 } : {}), lourd: g.lourd, lignee: COULEUR[lign], suite: o.halo,
    felure: o.felure ? ICO.fele : undefined,
  };
  const cls = ['geste', taille, eteinte ? 'eteinte' : '', g.lourd ? 'lourd' : '', o.halo ? 'halo' : '', o.vise ? 'vise' : '', o.serre ? 'serre' : '', o.felure ? 'brise-felure' : ''].filter(Boolean).join(' ');
  const freqs = g.fs && g.fs.length > 1 && !accord ? `, fréquences possibles ${g.fs.join(' ou ')}` : '';
  const label = `${g.nom} (${nomP}), fréquence ${accord ? 'libre' : g.f}${freqs}, ${LIBELLE[g.type]} ${vReel}${tendance ? ` (${tendance === 'hausse' ? 'renforcée' : 'affaiblie'}, ${g.v} de base)` : ''}${g.lourd ? ', prend 2 places' : ''}${effetsDe(g).map((x) => ', ' + libelleEffet(x)).join('')}${o.halo ? ', prolonge ta suite' : ''}${o.felure ? ', brise la Fêlure de l’ennemi' : ''}${eteinte ? ', éteinte : son Porteur est à terre' : ''}`;
  AFFICHES.set(g.uid, { g, d, nomP, eteinte, detail });
  return `<button type="button" class="${cls}" style="--c:${COULEUR[lign]}" data-action="${action}" data-uid="${g.uid}" data-porteur="${g.porteur ?? ''}" aria-label="${echap(label)}"${o.off ? ' disabled' : ''}>`
    + `<span class="nf nf-${metal}${o.halo ? ' nf-suite' : ''}" style="${styleFace(d)}" aria-hidden="true">${corpsFace(d)}</span>`
    + `</button>`;
}

/** les cartes de combat affichées (par uid), pour la loupe */
const AFFICHES = new Map<string, { g: Geste; d: Face; nomP: string; eteinte: boolean; detail: DetailForce | null }>();

/**
 * La loupe (27 octobre 2026, Bryan) : un appui prolongé sur une carte du combat la montre en grand, au milieu de l'écran,
 * avec son nom, ses effets en entier et qui la joue ; elle disparaît quand on lève le doigt (main.ts), sans jouer la carte.
 */
export function loupe(uid: string): string | null {
  const a = AFFICHES.get(uid);
  if (!a) return null;
  const { g, d, nomP, eteinte, detail } = a;
  const grand: Face = { ...d, suite: false, felure: undefined };
  const effets = effetsDe(g).map((e) => `<li><b>${NOMS_EFFET[e.type]}</b> ${texteEffet(e)}</li>`).join('');
  return `<div class="loupe" aria-hidden="true"><div class="loupe-face"><span class="nf nf-${d.metal}" style="${styleFace(d)}">${corpsFace(grand)}</span></div>`
    + (detail && (detail.lignes.length || detail.bouclierEnnemi) ? calculLoupe(g, detail) : '')
    + (effets ? `<ul class="loupe-effets">${effets}</ul>` : '')
    + `<p class="loupe-qui">${eteinte ? `Éteinte : ${echap(nomP)} est à terre` : `Jouée par ${echap(nomP)}`}${g.lourd ? ' · prend 2 places' : ''}</p></div>`;
}

const QUOI = { atk: 'dégâts', bouclier: 'de bouclier', soin: 'PV soignés' };
const pourcent = (m: number) => {
  const p = Math.round((m - 1) * 100);
  return `${p > 0 ? '+' : '−'}${Math.abs(p)} %`;
};

/** Le calcul de la carte dans la loupe : la base, chaque bonus (vert) et malus (rouge), puis le total */
function calculLoupe(g: Geste, d: DetailForce): string {
  const lignes = d.lignes.map((l) => {
    const plus = l.m !== undefined ? l.m > 1 : (l.v ?? 0) > 0;
    const val = l.m !== undefined ? pourcent(l.m) : `${(l.v ?? 0) > 0 ? '+' : '−'}${Math.abs(l.v ?? 0)}`;
    return `<li class="${plus ? 'plus' : 'moins'}"><span>${echap(l.nom)}</span><b>${val}</b></li>`;
  }).join('');
  const total = `<li class="total"><span>${d.siPosee ? 'Posée maintenant' : 'Au lancer'}</span><b>${d.total} ${QUOI[g.type]}</b></li>`;
  const bouclier = d.bouclierEnnemi > 0 ? `<p class="lc-note">Son bouclier (${d.bouclierEnnemi}) absorbe d’abord le coup.</p>` : '';
  return `<div class="loupe-calcul"><ul><li class="base"><span>Force de la carte</span><b>${d.base}</b></li>${lignes}${total}</ul>${bouclier}</div>`;
}

/**
 * Une jauge de vie : un rail serti, la vie qui reste, la traînée du dernier coup qui se vide, des graduations
 * (une tous les `pas` PV) et, pour l'ennemi, son bouclier posé au bout de la vie.
 */
export function jauge(classe: string, pv: number, max: number, o: { trace?: number; pas?: number; bouclier?: number; usure?: number } = {}) {
  // l'Usure : les PV perdus pour toute la descente, hachurés au bout de la jauge (la jauge compte alors sur les PV pleins)
  const u = o.usure ?? 0;
  if (u > 0) max += u;
  const v = pct(pv, max);
  const usure = u > 0 ? `<i class="j-usure" style="width:${pct(u, max)}%"></i>` : '';
  const trainee = o.trace !== undefined && o.trace > v ? `<i class="j-trainee" style="--de:${o.trace}%;--a:${v}%"></i>` : '';
  const bouclier = o.bouclier ? `<i class="j-bouclier" style="left:${Math.max(0, v - pct(o.bouclier, max))}%;width:${Math.min(v, pct(o.bouclier, max))}%"></i>` : '';
  const pas = o.pas ? pct(o.pas, max) : 10;
  return `<span class="jauge-vie ${classe}${v <= 30 ? ' basse' : ''}" style="--pas:${pas}%" role="img" aria-label="${pv} PV sur ${max}">`
    + `<span class="j-rail">${trainee}<i class="j-vie" style="width:${v}%"></i>${bouclier}${usure}<span class="j-grad"></span></span></span>`;
}

/** Une carte de combat montrée en démonstration (écran « Avant d'ouvrir ») : même rendu, sans action */
export const carteDemo = (g: Geste, taille: 'chaine' | 'main' = 'main') => geste(g, taille, 'demo').replace('<button type="button"', '<div role="img"').replace(/<\/button>$/, '</div>');

/** Une carte posée dans la chaîne : la toucher la retire ; sous elle, de quoi changer sa Fréquence (argent et plus) */
/** la plus haute Fréquence d'une carte : une suite s'arrête là */
const FREQ_MAX = 9;

function maillon(g: Geste, off: boolean) {
  const choix = g.fs && g.fs.length > 1 && !frequenceLibre(g.effet);
  // une carte de soin montre qui elle soigne ; la toucher passe au Porteur suivant
  const soin = soigneUnSeul(g) && g.cible
    ? `<button type="button" class="cibler" data-action="cibler" data-uid="${g.uid}"${off ? ' disabled' : ''} style="--c:${COULEUR[porteurDef(g.cible).lignee]}" aria-label="Soigne ${echap(porteurDef(g.cible).nom)} : toucher pour changer">${ICO.soin}<span>${echap(porteurDef(g.cible).nom)}</span></button>`
    : '';
  const c = `style="--c:${COULEUR[ligneeGeste(g)]}"`;
  if (soin && !choix) return `<div class="maillon" ${c}>${geste(g, 'chaine', 'retirer', { off })}${soin}</div>`;
  if (!choix) return geste(g, 'chaine', 'retirer', { off });
  const suivante = g.fs![(g.fs!.indexOf(g.f) + 1) % g.fs!.length]!;
  return `<div class="maillon" ${c}>${geste(g, 'chaine', 'retirer', { off })}`
    + `<button type="button" class="accorder" data-action="accorder" data-uid="${g.uid}"${off ? ' disabled' : ''} aria-label="Passer ${echap(g.nom)} en Fréquence ${suivante}">${g.fs!.map((f) => `<i class="${f === g.f ? 'actif' : ''}" style="--fc:${couleurFrequence(f)}">${f}</i>`).join('')}</button>${soin}</div>`;
}

/** La partie de secours : on l'échange avec la partie en cours (deux touches), l'échange se défait de la même façon */
function ligneSecours(c: Compte): string {
  const s = c.secours;
  if (!s) return '';
  const le = new Date(s.le).toLocaleDateString('fr-BE', { day: 'numeric', month: 'long' });
  return `<p class="discret">Partie de secours : Strate −${s.strate}, du ${le}.${s.confirmer ? ` Ta partie actuelle (Strate −${s.actuelle}) deviendra la partie de secours : tu pourras revenir en arrière.` : ''}</p>`
    + `<div class="ligne"><button type="button" class="btn sec" data-action="${s.confirmer ? 'secours-confirmer' : 'secours'}">${s.confirmer ? 'Confirmer l’échange' : 'Restaurer cette partie'}</button></div>`;
}

export function panneauCompte(c: Compte): string {
  if (!c.ouvert) return '';
  if (c.utilisateur && !c.utilisateur.anonyme) {
    const etat = { aucune: '', 'en-cours': 'Synchronisation…', ok: 'Progression enregistrée dans ton compte.', erreur: `Synchronisation impossible pour l’instant, la sauvegarde reste sur l’appareil.${c.codeErreur ? ` (${c.codeErreur})` : ''}` }[c.synchro];
    return `<section class="panneau" aria-label="Compte"><strong>${c.pseudo ? `Pseudo : ${echap(c.pseudo)}` : 'Pas encore de pseudo'}</strong>`
      + `<p class="discret">${c.pseudo ? 'C’est ce nom que voient les autres joueurs.' : 'Choisis le nom que verront les autres joueurs : ton nom de compte n’est jamais affiché.'}</p>`
      + `<div class="ligne"><button type="button" class="btn ${c.pseudo ? 'sec' : 'prim'}" data-action="gt-nom">${c.pseudo ? 'Changer de pseudo' : 'Choisir mon pseudo'}</button></div>`
      + (etat ? `<p class="discret">${etat}</p>` : '')
      + ligneSecours(c)
      + `<div class="ligne"><button type="button" class="btn sec" data-action="deconnexion"${c.occupe ? ' disabled' : ''}>Se déconnecter</button></div></section>`;
  }
  const invisible = !!c.utilisateur?.anonyme;
  return `<section class="panneau" aria-label="Compte"><strong>${invisible ? 'Protège ta partie' : 'Compte'}</strong>`
    + `<p class="discret">${invisible
      ? 'Ta partie est sauvegardée, mais seulement pour ce téléphone. Relie-la à Google ou à un e-mail : elle ne sera jamais perdue, et tu la retrouveras sur un autre appareil.'
      : 'Optionnel : retrouve ta progression sur un autre appareil.'}</p>`
    + `<div class="ligne"><button type="button" class="btn prim" data-action="google"${c.occupe ? ' disabled' : ''}>Continuer avec Google</button></div>`
    + `<input id="email" type="email" autocomplete="email" placeholder="E-mail" aria-label="E-mail">`
    + `<input id="mdp" type="password" autocomplete="current-password" placeholder="Mot de passe" aria-label="Mot de passe">`
    + `<div class="ligne"><button type="button" class="btn sec" data-action="connexion"${c.occupe ? ' disabled' : ''}>Se connecter</button><button type="button" class="btn sec" data-action="inscription"${c.occupe ? ' disabled' : ''}>Créer un compte</button></div>`
    + `<button type="button" class="lien" data-action="oubli">Mot de passe oublié</button>`
    + (c.erreur ? `<p class="erreur">${echap(c.erreur)}</p>` : '')
    + (c.info ? `<p class="discret">${echap(c.info)}</p>` : '')
    + ligneSecours(c)
    + `</section>`;
}

// ---------- Fuir (décision du 22 octobre 2026) ----------
// Deux sorties, au choix : reculer d'une salle sur la carte, ou remonter au district. Dans les deux cas l'attaque annoncée
// touche pendant la fuite (la feuille dit qui elle va toucher, et si quelqu'un tombera). Personne ne meurt.
const NOMS_SALLE: Record<TypeSalle, string> = {
  entree: 'l’entrée', combat: 'la salle de combat', elite: 'la salle scellée', cache: 'la cache', rencontre: 'la salle de la rencontre',
  camp: 'le campement', archive: 'les archives', gardien: 'la salle du gardien', filon: 'le filon',
};

/** Ce que prépare l'ennemi, sans chiffre ni cible (le brouillard laisse voir ça) */
const GENRE_INTENTION: Record<string, string> = { atk: 'Va attaquer', bouclier: 'Va se protéger', soin: 'Va se réparer', boost: 'Se concentre', dissonance: 'Va brouiller tes Fréquences' };

function feuilleFuite(e: Ecran): string {
  const x = e.x;
  const s = e.etat;
  const nom = nomEnnemi(s.ennemi);
  const { porteurs, coups, attaque } = coupDeFuite(s);
  const touches = coups.filter((c) => c.net > 0);
  const tombent = porteurs.filter((p) => p.pv <= 0 && (s.porteurs.find((q) => q.id === p.id)?.pv ?? 0) > 0);
  let coup: string;
  if (C_brume(s)) coup = s.intention.type === 'atk' || enGroupe(s)
    ? 'En fuyant, l’escouade encaisse l’attaque cachée dans le brouillard : impossible de savoir qui elle touchera, ni combien.'
    : `${echap(nom)} ne semble pas préparer d’attaque : l’escouade devrait s’échapper sans un coup.`;
  else if (!attaque) coup = `${echap(nom)} ne prépare pas d’attaque : l’escouade s’échappe sans un coup.`;
  else if (!touches.length) coup = `<b>${echap(attaque)}</b> s’écrasera sur le bouclier : l’escouade s’échappe sans une égratignure.`;
  else coup = `En fuyant, l’escouade encaisse l’attaque annoncée : <b>${echap(attaque)}</b> sur ${touches.map((c) => `${echap(porteurDef(c.id).nom)} (−${c.net})`).join(', ')}.`
    + (tombent.length ? ` <b class="tombe">${tombent.map((p) => echap(porteurDef(p.id).nom)).join(' et ')} ${tombent.length > 1 ? 'tomberont' : 'tombera'} à terre.</b>` : '');

  let h = `<div class="voile-feuille" data-action="fuir" aria-hidden="true"></div><section class="feuille fuite" role="dialog" aria-modal="true" aria-labelledby="fuite-titre"><span class="poignee" aria-hidden="true"></span>`
    + `<header class="feuille-tete"><div class="titres"><span class="surtitre">FUIR</span><h2 id="fuite-titre">Quitter le combat ?</h2></div><button type="button" class="btn-icone" data-action="fuir" aria-label="Fermer">${ICO.fermer}</button></header>`
    + `<div class="feuille-corps"><p class="fuite-coup${touches.length && !C_brume(s) ? ' touche' : ''}">${touches.length || C_brume(s) ? ICO.atk : ICO.bouclier}<span>${coup}</span></p><div class="routes">`;
  if (x.carte) {
    const prec = sallePrecedente(x);
    const ok = peutReculer(x);
    const sortie = prec && (prec.type === 'entree' || prec.type === 'camp');
    h += `<button type="button" class="route" style="--t:#CDEFFF" data-action="fuir-salle"${ok ? '' : ' disabled'}><span class="route-ico">${ICO.retour}</span>`
      + `<span class="route-txt"><small>RECULER D’UNE SALLE</small><strong>Retour à ${prec ? NOMS_SALLE[prec.type] : 'la salle d’avant'}</strong>`
      + `<em>${ok ? `${echap(nom)} garde sa salle : prends un autre chemin, ou reviens l’affronter (un combat neuf). Les PV perdus restent perdus.${sortie ? ' De là, tu pourras remonter avec tout ton butin.' : ''}` : 'Personne ne tiendrait debout après ce coup : il faut remonter.'}</em></span>${ok ? CHEVRON_FUITE : ''}</button>`;
  }
  const garde = Math.floor(x.butin * DISTRICT.butinFuite);
  h += `<button type="button" class="route" style="--t:#F0C96A" data-action="fuir-district"><span class="route-ico">${ICO.strate}</span>`
    + `<span class="route-txt"><small>${x.pillage ? 'ABANDONNER LE PILLAGE' : x.epreuve ? 'ABANDONNER L’ÉPREUVE' : 'REMONTER AU DISTRICT'}</small>`
    + `<strong>${x.epreuve || x.pillage ? 'Rentrer au district' : x.butin ? `Rentrer avec ${garde} composants sur ${x.butin}` : 'Rentrer au district'}</strong>`
    + `<em>${x.pillage ? `Le pillage compte comme perdu : tu laisses ${Math.round(PILLAGE.perteDefaite * 100)} % de ton coffre à ${echap(x.pillage.nom)}.` : x.epreuve ? 'Tu pourras la retenter cette semaine.' : `Tu gardes ${Math.round(DISTRICT.butinFuite * 100)} % des composants et toutes les cartes trouvées.`} L’escouade rentre épuisée : +${DISTRICT.usureFuite} d’Usure chacun, en plus de l’expédition.</em></span>${CHEVRON_FUITE}</button>`
    + `</div><button type="button" class="btn sec large" data-action="fuir">Continuer le combat</button></div></section>`;
  return h;
}
const CHEVRON_FUITE = '<svg class="ico route-fleche" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 5l7 7-7 7"/></svg>';

function regles(): string {
  return `<div class="voile-feuille" data-action="regles" aria-hidden="true"></div><section class="feuille regles" role="dialog" aria-modal="true" aria-labelledby="regles-titre"><span class="poignee" aria-hidden="true"></span>`
    + `<header class="feuille-tete"><div class="titres"><span class="surtitre">AIDE</span><h2 id="regles-titre">Comment on joue</h2></div><button type="button" class="btn-icone" data-action="regles" aria-label="Fermer">${ICO.fermer}</button></header><div class="feuille-corps">`
    + `<div class="liens-guide">${lienGuide('carte', 'Lire une carte')}${lienGuide('effets', 'Tous les effets')}</div><ol class="liste-regles">`
    + '<li><b>Ton deck, ce sont tes cartes.</b> Chaque Porteur de l’escouade apporte celles que tu lui as confiées au district (6 au plus), plus les 2 cartes du paquetage du district (Stimulant et Pavois de cuivre). L’illustration est celle de la carte ; à défaut, le portrait du Porteur qui la joue.</li>'
    + `<li><b>Compose une chaîne.</b> Touche les cartes de ta main (${REGLES.capaciteBase} places au départ), puis lance-la. Une carte posée se retire d’un toucher, ou se glisse de côté pour changer de place.</li>`
    + `<li><b>La force</b> est au milieu : ${ICO.atk} dégâts, ${ICO.bouclier} protection de l’escouade, ${ICO.soin} soin (dans la chaîne, touche le nom sous la carte pour choisir qui).</li>`
    + '<li><b>La Fréquence</b> est le chiffre dans la gemme. Des Fréquences qui se suivent dans l’ordre font une Résonance : suite de 3 = +30 %, de 4 = +60 %, de 5 = +100 %. Une flèche dorée marque la carte qui prolonge ta suite.</li>'
    + '<li><b>Plusieurs Fréquences :</b> une carte en argent, en or ou en nacre en porte 2 ou 3. Posée, elle prend celle qui prolonge ta suite ; touche les chiffres sous elle pour en changer. Rien n’est tiré au sort.</li>'
    + `<li><b>L’Écho :</b> trois Fréquences identiques donnent un bouclier d’escouade de +${REGLES.bouclierEcho}.</li>`
    + '<li><b>Le Flux</b> se remplit à chaque Résonance, et encore plus si la suite brise aussi une Fêlure. Dépense-le pour ajouter une place à ta chaîne ou repiocher ta main, ou garde-le pour un Coup d’éclat.</li>'
    + '<li><b>La Fêlure</b> : chaque ennemi montre une Fréquence fêlée. Une carte de cette Fréquence dans la chaîne brise son intention (moitié moins forte, un quart chez un gardien ou un blindé) : en main, ces cartes portent l’icône de la Fêlure dans leur capsule de Fréquence (« Brise » sur grand écran). Dans une suite (3, 4, 5), elle donne aussi 1 Flux. Les évanescents la cachent.</li>'
    + `<li><b>Le Coup d’éclat</b> : Flux plein, un seul par combat, au choix selon les lignées de l’escouade. ${(Object.values(ECLATS)).map((x) => `<b>${x.nom}</b> : ${x.texte}`).join(' ')} Le Porteur qui le déclenche prend ${REGLES.eclat.usure} d’Usure.</li>`
    + '<li><b>« 2 PL. »</b> : cette carte est puissante mais occupe deux places.</li>'
    + '<li><b>La force</b> écrite sur la carte est celle qui tombera, tous bonus et malus compris : <b style="color:#9ff5b6">verte</b> si la carte est renforcée, <b style="color:#ff9b8c">rouge</b> si elle est affaiblie. Garde le doigt dessus pour voir le détail.</li>'
    + '<li><b>Les effets</b> (Perçant, Siphon, Accord…) sont écrits en or. Pose la carte dans la chaîne pour lire ce qu’elle fait. « ∗ » : Fréquence libre, elle prolonge toujours la suite.</li>'
    + '<li><b>Le triangle des lignées :</b> les Augmentés battent les Résonants, les Résonants battent les Génés, les Génés battent les Augmentés (+15 %).</li>'
    + '<li><b>L’ennemi annonce son attaque</b> en haut de l’écran : protège-toi ou finis-le avant.</li>'
    + '<li><b>Les traits</b> des ennemis sont écrits sous leur nom (Blindé, Évanescent, Épines…) : touche-les pour lire ce qu’ils font. Les gardiens changent de gestes à mi-vie et appellent de l’aide.</li>'
    + '<li><b>Les conditions de salle</b> (inondée, éboulis, brouillard…) s’affichent en haut, et sur la carte avant d’entrer.</li>'
    + '<li><b>Contre un groupe</b>, chaque ennemi annonce son geste sur sa vignette, en haut à droite. Touche une vignette pour viser cet ennemi : toute la chaîne le frappe, et s’il tombe, le reste de la chaîne passe au suivant.</li>'
    + `<li><b>Fuir :</b> le bouton en haut à droite. L’attaque annoncée touche pendant la fuite (personne ne meurt), puis tu recules d’une salle sur la carte, ou tu remontes au district avec ${Math.round(DISTRICT.butinFuite * 100)} % des composants et un peu plus de fatigue.</li>`
    + `<li><b>Le journal du combat</b> (${ICO.journal} à côté de la pioche et de la défausse, ou la dernière ligne au-dessus de ta main) : les cartes jouées à chaque tour, le calcul de chaque dégât subi ou infligé, ta défausse et ta pioche. Les « ? » expliquent chaque terme.</li>`
    + '<li><b>La Dissonance :</b> certains ennemis brouillent tes Fréquences. Au tour suivant, aucune suite ne résonne : mise sur la force brute ou la protection.</li></ol></div></section>';
}

// ---------- Le lieu du combat : la salle de la Strate derrière l'interface (22 octobre 2026) ----------
// Bryan trouvait le fond uni (bleu nuit) trop monochrome. Le combat se passe maintenant dans la zone qu'on explore :
// son illustration, floutée comme vue à travers le verre de l'interface, assombrie sur les bords, avec la lumière froide
// de l'interface en haut, de la poussière chaude qui monte et quelques éclats de cristal qui scintillent.
// L'écran est redessiné à chaque action : chaque animation reprend à sa phase (délai négatif calculé sur l'horloge),
// sinon tout repartirait de zéro à chaque carte touchée.

/** hasard fixe (le même à chaque rendu) : la poussière garde sa place d'un rendu à l'autre */
const fixe = (i: number, n: number) => { const v = Math.sin(i * 127.1 + n * 311.7) * 43758.5453; return v - Math.floor(v); };
const PARTICULES = Array.from({ length: 22 }, (_, i) => {
  const eclat = i % 4 === 3; // un sur quatre : un éclat de cristal qui scintille sur place ; les autres : de la poussière chaude qui monte
  return {
    eclat,
    x: 2 + fixe(i, 1) * 96,
    y: 6 + fixe(i, 2) * 80,
    taille: eclat ? 2 + fixe(i, 3) * 1.6 : 1.4 + fixe(i, 3) * 2.2,
    duree: eclat ? 5 + fixe(i, 4) * 6 : 18 + fixe(i, 4) * 16,
    decalage: fixe(i, 5),
    derive: (fixe(i, 6) - 0.5) * 80,
  };
});

/** zone de la Strate (0 Fondations… 3 le fond) : celle de la carte explorée, sinon celle de la profondeur (Épreuves, chambre scellée) */
const zoneDuLieu = (x: Expedition) => x.carte?.zone ?? Math.max(0, ZONES.indexOf(zoneDe(Math.max(1, x.strate))));

export function htmlLieu(x: Expedition): string {
  const zone = zoneDuLieu(x);
  // un pillage se joue sur l'archipel attaqué, en pleine mer, pas dans une Strate
  const img = x.pillage ? vignetteArchipel(ageArchipel(x.strate)) : fondCombat(zone);
  const salle = x.carte?.salles[x.carte.position]?.type;
  const t = performance.now() / 1000;
  const phase = (duree: number, decalage = 0) => `-${((t + decalage * duree) % duree).toFixed(2)}s`;
  let h = `<div class="fond-lieu ${x.pillage ? 'z-pillage' : `z-${zone}`}${salle === 'gardien' || salle === 'elite' ? ' gardien' : ''}" aria-hidden="true"${img ? ` style="--decor:url(${img})"` : ''}>`
    + `<span class="fl-image" style="animation-delay:${phase(90)}"></span><span class="fl-voile"></span><span class="fl-lueur"></span>`;
  for (const p of PARTICULES) {
    h += `<i class="fl-p${p.eclat ? ' eclat' : ''}" style="--x:${p.x.toFixed(1)}%;--y:${p.y.toFixed(1)}%;--s:${p.taille.toFixed(1)}px;--d:${p.duree.toFixed(1)}s;--dx:${p.derive.toFixed(0)}px;animation-delay:${phase(p.duree, p.decalage)}"></i>`;
  }
  return h + '</div>';
}

/**
 * Combat à plusieurs (décision du 22 octobre 2026) : une vignette par ennemi, en haut à droite de la scène.
 * Toucher une vignette vise cet ennemi : toute la chaîne le frappera. La grande scène montre toujours l'ennemi visé.
 */
/**
 * L'intention de l'ennemi visé, en plaque (26 octobre 2026) : ce qu'il prépare en petit, sur qui en clair (avec le portrait),
 * et la valeur en grand à droite. La phrase complète reste pour les lecteurs d'écran.
 */
function plaqueIntention(s: CombatEtat, classe: string, icone: string, felureHtml: string): string {
  const it = s.intention;
  let nom = '', quoi = '', val = '', unite = '';
  // Brouillard : on sait ce que l'ennemi prépare, pas combien ni sur qui
  if (C_brume(s)) {
    nom = 'Dans le brouillard';
    quoi = it.type === 'atk' ? 'Cible inconnue' : it.type === 'dissonance' ? 'Pas de Résonance au tour suivant' : GENRE_INTENTION[it.type] ?? '';
    if (it.type !== 'dissonance') { val = '?'; unite = it.type === 'atk' || it.type === 'boost' ? 'dégâts' : it.type === 'soin' ? 'PV' : 'bouclier'; }
    return `<div class="intention plaque-int ${classe} brume" aria-live="polite" aria-label="${echap(`Brouillard : ${GENRE_INTENTION[it.type]}, force et cible cachées.`)}">`
      + `<span class="int-ico">${icone}</span>`
      + `<span class="int-corps" aria-hidden="true"><small class="int-nom">${nom}</small><span class="int-quoi">${it.type === 'atk' ? '<i class="int-fleche"></i>' : ''}${quoi}</span></span>`
      + (val ? `<span class="int-val" aria-hidden="true"><b>${val}</b><small>${unite}</small></span>` : '') + '</div>';
  }
  if (it.type === 'atk') {
    nom = it.nom;
    val = String(Math.round(it.v * puissance(s.ennemi) * usureCombat(s).attaque));
    unite = 'dégâts';
    if (it.zone) quoi = `<span class="int-qui">${s.porteurs.filter((p) => p.pv > 0).map((p) => { const im = portrait(p.id); return im ? `<img src="${im}" alt="" style="--c:${COULEUR[porteurDef(p.id).lignee]}">` : ''; }).join('')}</span>Tous`;
    else if (it.cibleId) {
      const d = porteurDef(it.cibleId), im = portrait(it.cibleId);
      quoi = `<span class="int-qui">${im ? `<img src="${im}" alt="" style="--c:${COULEUR[d.lignee]}">` : ''}</span>${echap(d.nom)}`;
    } else quoi = '?';
  } else if (it.type === 'bouclier') { nom = 'Se protège'; quoi = 'Bouclier'; val = `+${it.v}`; unite = 'bouclier'; }
  else if (it.type === 'soin') { nom = it.nom; quoi = 'Se répare'; val = `+${it.v}`; unite = 'PV'; }
  else if (it.type === 'boost') { nom = 'Se concentre'; quoi = 'Prochaine attaque'; val = '×2'; unite = 'dégâts'; }
  else { nom = it.nom; quoi = 'Pas de Résonance au tour suivant'; }
  return `<div class="intention plaque-int ${classe}" aria-live="polite" aria-label="${echap(texteIntention(s))}">`
    + `<span class="int-ico">${icone}</span>`
    + `<span class="int-corps" aria-hidden="true"><small class="int-nom">${echap(nom)}</small><span class="int-quoi">${it.type === 'atk' ? '<i class="int-fleche"></i>' : ''}${quoi}</span></span>`
    + (val ? `<span class="int-val" aria-hidden="true"><b>${val}</b><small>${unite}</small></span>` : '')
    + felureHtml + '</div>';
}

/**
 * La Fêlure, dite en clair sous l'intention (26 octobre 2026). Bryan : « je peux la casser avec la bonne carte, mais je ne
 * sais même pas ce qu'elle fait ». La ligne dit quelle carte poser et ce que ça change, chiffres à l'appui (10 → 8 dégâts, +1 Flux).
 */
function ligneFelure(s: CombatEtat, prevue: boolean, resonne: boolean): string {
  const en = s.ennemi, it = s.intention;
  if (en.felureBrisee) return `<span class="int-felure brisee"><span class="gemme">${ICO.fele}</span><span><b>Fêlure brisée</b> : ${it.type === 'atk' ? 'son attaque est affaiblie' : it.type === 'bouclier' ? 'son bouclier est affaibli' : it.type === 'soin' ? 'son soin est affaibli' : 'il vacille'}</span></span>`;
  if (!felureVisible(en)) return `<span class="int-felure cachee"><span class="gemme">${ICO.fele}<b>?</b></span><span><b>Fêlure cachée</b> : un évanescent ne montre pas la carte qui le brise</span></span>`;
  const f = en.felure!;
  // ce que la Fêlure retire, avec les mêmes arrondis que le moteur
  const reduit = (v: number) => Math.round(v * (1 - partFelure(en)));
  const force = it.type === 'atk' ? puissance(en) * usureCombat(s).attaque : 1;
  const chiffre = (v: number) => Math.round(v * force);
  const effet = it.type === 'atk' ? `${chiffre(it.v)} → <b>${chiffre(reduit(it.v))}</b> dégâts`
    : it.type === 'bouclier' ? `bouclier +${it.v} → <b>+${reduit(it.v)}</b>`
    : it.type === 'soin' ? `soin +${it.v} → <b>+${reduit(it.v)}</b>`
    : 'il vacille';
  // le Flux en plus ne s'annonce que quand la chaîne posée fait une suite (3, 4, 5) : avant, la ligne dit juste ce que la carte brise
  const flux = prevue && resonne && s.flux < REGLES.fluxMax ? `, <b class="gain-flux">+${REGLES.felure.flux} Flux</b>` : '';
  return `<span class="int-felure${prevue ? ' prevue' : ''}" style="--fc:${couleurFrequence(f)}"><span class="gemme">${ICO.fele}<b>${f}</b></span>`
    + `<span>${prevue ? '<b>Ta chaîne la brise</b>' : `Pose un <b class="freq">${f}</b>`} : ${effet}${flux}</span></span>`;
}

/**
 * Le Flux en fiole de cristal (26 octobre 2026), à la place des trois losanges : Bryan les trouvait « jeu des années 90 ».
 * Un tube de verre fumé en trois chambres ; chaque point de Flux est une chambre emplie de lumière.
 */
function jaugeFlux(flux: number): string {
  return `<div class="jauge-flux${flux ? '' : ' vide'}" role="img" aria-label="Flux : ${flux} sur ${REGLES.fluxMax}">`
    + `<span class="jf-nom">${ICO.flux}Flux<b>${flux}</b><small>/ ${REGLES.fluxMax}</small></span>`
    + `<span class="jf-tube">${Array.from({ length: REGLES.fluxMax }, (_, i) => `<i${i < flux ? ' class="plein"' : ''}></i>`).join('')}</span></div>`;
}

/**
 * Le total de la chaîne, en tête de chaîne (26 octobre 2026) : tout compris (Résonance, lignées, Blindé, Fissure, bouclier
 * de l'ennemi), calculé par le moteur sur une copie du combat. Le joueur n'a plus de calcul à faire avant de lancer.
 */
function bilanChaine(s: CombatEtat): string {
  const a = apercuChaine(s);
  const morceaux: string[] = [];
  const dire: string[] = [];
  if (a.degats || s.chaine.some((g) => g.type === 'atk')) {
    morceaux.push(`<span class="bl-atk">${ICO.atk}<b>${a.degats}</b></span>`);
    dire.push(`${a.degats} dégâts${a.absorbe ? ` (${a.absorbe} absorbés par son bouclier en plus)` : ''}`);
  }
  if (a.bouclier) { morceaux.push(`<span class="bl-garde">${ICO.bouclier}<b>+${a.bouclier}</b></span>`); dire.push(`bouclier +${a.bouclier}`); }
  if (a.soin) { morceaux.push(`<span class="bl-soin">${ICO.soin}<b>+${a.soin}</b></span>`); dire.push(`soin +${a.soin} PV`); }
  if (!morceaux.length) return '';
  const fatal = a.vaincus > 0;
  if (fatal) dire.push(a.vaincus > 1 ? `${a.vaincus} ennemis vaincus` : 'ennemi vaincu');
  return `<span class="bilan${fatal ? ' fatal' : ''}" role="status" aria-label="${echap(`Si tu lances : ${dire.join(', ')}`)}"><small aria-hidden="true">${fatal ? 'FATAL' : 'TOTAL'}</small>${morceaux.join('')}</span>`;
}

/** Le nom et le visage d'un ennemi : un garde d'archipel pillé prend ceux du Porteur de la garnison qu'il incarne */
const nomEnnemi = (en: EnnemiEtat) => (en.porteur ? porteurDef(en.porteur).nom : ennemiDef(en.id).nom);
const visageEnnemi = (en: EnnemiEtat) => (en.porteur ? portrait(en.porteur) : illustrationEnnemi(en.id));

function vignettesGroupe(e: Ecran): string {
  const s = e.etat;
  if (!enGroupe(s)) return '';
  const verrou = e.verrou || s.issue !== 'en-cours';
  const avecGardien = tousEnnemis(s).some((en) => estGardien(en.id));
  return `<div class="groupe-ennemis${avecGardien ? ' avec-gardien' : ''}" role="group" aria-label="Le groupe : touche un ennemi pour le viser">` + tousEnnemis(s).map((en) => {
    const d = ennemiDef(en.id);
    const it = intentionDe(s, en);
    const vise = en === s.ennemi;
    const tombe = en.pv <= 0;
    const ill = visageEnnemi(en);
    const cache = C_brume(s);
    const val = cache ? (it.type === 'dissonance' ? '' : '?') : it.type === 'atk' ? String(Math.round(it.v * puissance(en) * usureCombat(s).attaque)) : it.type === 'bouclier' || it.type === 'soin' ? String(it.v) : it.type === 'boost' ? '×2' : '';
    const cls = it.type === 'atk' ? 'danger' : it.type === 'bouclier' || it.type === 'soin' ? 'garde' : 'boost';
    const ico = it.type === 'atk' ? ICO.atk : it.type === 'bouclier' ? ICO.bouclier : it.type === 'soin' ? ICO.soin : it.type === 'dissonance' ? ICO.flux : ICO.boost;
    const traits = (en.simple ? [] : d.traits ?? []).map((t) => texteTrait(t).nom);
    const nom = nomEnnemi(en);
    const label = tombe ? `${nom}, vaincu` : `${vise ? 'Visé : ' : 'Viser '}${nom}${traits.length ? ` (${traits.join(', ')})` : ''}, ${en.pv} PV sur ${en.pvMax}. ${cache ? `${GENRE_INTENTION[it.type]}, force et cible cachées par le brouillard.` : texteIntention(s, en)}`;
    return `<button type="button" class="vignette-ennemi l-${d.lignee}${estGardien(en.id) ? ' gardien' : ''}${vise ? ' visee' : ''}${tombe ? ' tombe' : ''}" data-action="viser" data-id="${en.rang ?? 0}" aria-label="${echap(label)}" title="${echap(label)}" aria-pressed="${vise}"${verrou || tombe || vise ? ' disabled' : ''}>`
      + (ill ? `<img src="${ill}" alt="" decoding="async">` : '<span class="vg-sans"></span>')
      + (tombe ? '' : `<span class="vg-int ${cls}${cache ? ' brume' : ''}">${ico}${val ? `<b>${val}</b>` : ''}</span>`)
      + (tombe || cache || !en.felure ? '' : !felureVisible(en) ? `<span class="vg-felure" aria-hidden="true">${ICO.fele}<b>?</b></span>` : `<span class="vg-felure${en.felureBrisee ? ' brisee' : ''}" style="--fc:${couleurFrequence(en.felure)}" aria-hidden="true">${ICO.fele}<b>${en.felure}</b></span>`)
      + (avecGardien ? `<span class="vg-nom">${echap(nom)}</span>` : '')
      + `<span class="vg-vie"><i style="width:${Math.max(0, Math.round((100 * en.pv) / en.pvMax))}%"></i></span>`
      + popsPour(e, `ennemi-${en.rang ?? 0}`)
      + '</button>';
  }).join('') + '</div>';
}

/** Le nom d'un gardien, dans sa plaque de cristal violet et d'or (27 octobre 2026) */
function plaqueGardien(nom: string, phase: string): string {
  return `<div class="plaque-gardien" style="--plaque:url(${artGardien('plaque')})">`
    + `<h2 class="ennemi-nom">${echap(nom)}</h2>`
    + (phase ? `<span class="pg-phase">${echap(phase)}</span>` : '')
    + '</div>';
}

/**
 * La vie d'un gardien : la jauge coule dans la rainure d'une barre peinte, et un cran de cristal marque le seuil
 * de sa seconde phase (il s'éteint une fois franchi). On voit d'avance qu'il se passera quelque chose, pas quoi.
 */
function vieGardien(e: Ecran): string {
  const en = e.etat.ennemi;
  const ph = ennemiDef(en.id).phase;
  const cran = ph && !en.simple
    ? `<img class="vg-cran${en.phase2 ? ' franchi' : en.pv / en.pvMax <= ph.seuil + 0.12 ? ' proche' : ''}" src="${artGardien('cran')}" alt="" style="--s:${ph.seuil}" title="${en.phase2 ? 'Seconde phase en cours' : 'Seuil de la seconde phase'}">`
    : '';
  return `<div class="vie-ennemi vie-gardien"><span class="vg-barre" style="--cadre:url(${artGardien('barre')})">`
    + `<span class="vg-rainure">${jauge('je', en.pv, en.pvMax, { trace: e.traces?.ennemi, pas: 10, bouclier: en.bouclier })}</span>${cran}</span>`
    + `<span class="je-valeur"><b>${en.pv}</b><small>/ ${en.pvMax}</small></span></div>`;
}

export function htmlCombat(e: Ecran): string {
  return htmlLieu(e.x) + htmlEcranCombat(e);
}

function htmlEcranCombat(e: Ecran): string {
  const s = e.etat;
  ETEINTS = new Set(s.porteurs.filter((p) => p.pv <= 0).map((p) => p.id));
  ETAT = s;
  const def = ennemiDef(s.ennemi.id);
  const it = s.intention;
  const faible = BATTU_PAR[def.lignee];
  // Fréquences brouillées : la suite ne compte pas (même règle que le moteur), ni badge ni multiplicateur affiché
  const brut = analyserChaine(s.chaine);
  const a = s.dissonance || s.sansResonance ? { ...brut, suite: 0, mult: 1 } : brut;
  const dernier = s.chaine[s.chaine.length - 1];
  const libres = placesLibres(s);
  const verrou = e.verrou || s.issue !== 'en-cours';
  const fs = frequencesEffectives(s.chaine);

  let conseil: string;
  if (s.sansResonance) conseil = `<b>Épreuve · Fréquences brouillées</b> : aucune Résonance de tout le combat. Les Échos (trois Fréquences identiques) comptent toujours.`;
  else if (s.dissonance && !s.chaine.length) conseil = `<b>Fréquences brouillées</b> : pas de Résonance ce tour-ci. Mise sur la force brute ou la protection.`;
  // le gardien parle (campagne.ts) : à la place du conseil, tant que la chaîne est vide
  else if (e.parole && !s.chaine.length) conseil = `<span class="parole-gardien" role="status"><b>${echap(e.parole.nom)}</b>« ${echap(e.parole.texte)} »</span>`;
  else if (!s.chaine.length) conseil = `Choisis jusqu’à ${capacite(s)} cartes. Des Fréquences qui se suivent (3, 4, 5) déclenchent une <b>Résonance</b>.`;
  else {
    const fin = serieFinale(s.chaine);
    const f = fs[fs.length - 1]!;
    // chaîne pleine : une place de plus ne s'achète qu'avec le Flux
    const flux = s.flux > 0 && capacite(s) < REGLES.capaciteMax;
    if (s.dissonance) conseil = '<b>Fréquences brouillées</b> : pas de Résonance ce tour-ci';
    else if (a.suite >= 3) conseil = `<b>Résonance</b> : suite de ${a.suite}, effets <b>+${Math.round((a.mult - 1) * 100)} %</b>` + (a.suite < 5 && fin === a.suite && (libres > 0 || flux) ? ` · un <b>${f + 1}</b> pour aller plus loin` : '');
    else if (libres === 0 && fin === 2 && flux) conseil = `Suite ${f - 1} → ${f} : 1 Flux t’ouvre une place pour un <b>${f + 1}</b>`;
    else if (libres === 0) conseil = flux ? 'Chaîne pleine : lance-la, ou dépense 1 Flux pour une place de plus' : 'Chaîne pleine : tu peux la lancer';
    else if (f >= FREQ_MAX) conseil = `${FREQ_MAX} est la plus haute Fréquence : une suite ne va pas plus loin. Deux autres ${f} feraient un <b>Écho</b>`;
    else if (fin === 2) conseil = `Suite ${f - 1} → ${f} : ajoute un <b>${f + 1}</b> pour +30 %`;
    else conseil = `Ajoute un <b>${f + 1}</b> pour commencer une suite`;
    if (a.echo) conseil += ` · Écho : bouclier +${REGLES.bouclierEcho}`;
    if (dernier?.effet) conseil += `<span class="effet-texte">${echap(libelleEffet(dernier.effet))}</span>`;
  }

  // pendant l'animation : la carte qui agit, puis la riposte de l'ennemi
  const enJeu = e.actif !== undefined ? s.chaine[e.actif] : undefined;
  if (enJeu) {
    const qui = enJeu.porteur ? porteurDef(enJeu.porteur).nom : 'District';
    conseil = `<span class="pas-chaine">${e.actif! + 1} / ${s.chaine.length}</span><span class="carte-agit" style="--c:${COULEUR[ligneeGeste(enJeu)]}">${echap(enJeu.nom)}</span> · ${echap(qui)}`
      + (a.suite >= 3 ? ` · Résonance <b>×${a.mult.toLocaleString('fr-BE')}</b>` : '');
  } else if (e.verrou && !s.chaine.length && s.issue === 'en-cours' && s.ennemi.pv > 0) conseil = enGroupe(s) ? 'Le groupe riposte…' : `${echap(nomEnnemi(s.ennemi))} riposte…`;

  const ill = visageEnnemi(s.ennemi);
  const classeIntention = it.type === 'atk' ? 'danger' : it.type === 'bouclier' || it.type === 'soin' ? 'garde' : 'boost';
  const iconeIntention = it.type === 'atk' ? ICO.atk : it.type === 'bouclier' ? ICO.bouclier : it.type === 'soin' ? ICO.soin : it.type === 'dissonance' ? ICO.flux : ICO.boost;
  const lieu = e.x.tutoriel ? 'Chambre scellée' : e.x.pillage ? `Pillage · ${e.x.pillage.nom}` : `Strate −${e.x.strate}`;

  // la Fêlure de l'ennemi visé : la Fréquence qui brise son intention (cachée par le brouillard tant que la chaîne est vide)
  const brume = C_brume(s);
  const felF = !brume && s.ennemi.pv > 0 && !s.ennemi.felureBrisee && felureVisible(s.ennemi) ? s.ennemi.felure : undefined;
  const prevue = felF !== undefined && fs.includes(felF);
  const felureHtml = s.ennemi.felure === undefined || brume || s.ennemi.pv <= 0 ? '' : ligneFelure(s, prevue, a.suite >= 3);
  const brise = (g: Geste) => felF !== undefined && !frequenceLibre(g.effet) && (g.fs ?? [g.f]).includes(felF);

  // combat guidé : ce que la leçon du tour désigne du doigt
  const guide = !!e.lecon && !verrou;
  const derniereF = fs[fs.length - 1];
  const viseF = guide && s.tour === 2 ? (!s.chaine.length ? 3 : derniereF !== undefined && derniereF >= 3 && derniereF < 5 && serieFinale(s.chaine) === derniereF - 2 ? derniereF + 1 : null) : null;
  const vise = (g: Geste) => guide && ((s.tour === 1 && libres > 0) || (s.tour === 2 && g.f === viseF) || (s.tour === 3 && g.type === 'bouclier' && libres > 0));
  const lancerVise = guide && s.chaine.length > 0 && (libres === 0 || (s.tour === 2 && a.suite >= 3));

  let h = `<div class="ecran ecran-jeu ecran-combat${verrou ? ' verrouille' : ''}${guide ? ` guide lecon-t${Math.min(s.tour, 4)}` : ''}">`;
  h += `<header class="combat-barre"><div class="puces">${e.x.pillage ? `<span class="puce">${ICO.grappin}<span class="puce-mot">Pillage · </span>${echap(e.x.pillage.nom)}</span>` : `<span class="puce">${ICO.strate}${e.x.tutoriel ? lieu : `<span class="puce-mot">Strate </span>−${e.x.strate}`}</span>`}`
    + (e.x.tutoriel || e.x.pillage ? '' : e.x.carte ? `<span class="puce">${e.x.carte.salles[e.x.carte.position]?.type === 'gardien' ? 'Gardien' : e.x.carte.salles[e.x.carte.position]?.type === 'elite' ? 'Salle scellée' : `Combat ${(e.x.gagnes ?? 0) + 1}`}</span>` : `<span class="puce">Combat ${e.x.index + 1}/${e.x.sequence.length}</span>`)
    + `<span class="puce">Tour ${s.tour}</span>`
    + (s.condition && CONDITIONS[s.condition] ? `<span class="puce condition" tabindex="0" title="${echap(CONDITIONS[s.condition]!.texte)}" aria-label="${echap(`${CONDITIONS[s.condition]!.nom} : ${CONDITIONS[s.condition]!.texte}`)}">${ICO.cristal}${echap(CONDITIONS[s.condition]!.nom)}</span>` : '')
    + `</div>`
    + `<div class="boutons-barre">${peutFuir(e.x) && s.issue === 'en-cours' ? `<button type="button" class="btn-fuir" data-action="fuir" aria-expanded="${!!e.fuite}" aria-label="Fuir le combat"${verrou ? ' disabled' : ''}>${ICO.retour}<span>Fuir</span></button>` : ''}<button type="button" class="btn-icone" data-action="son" aria-pressed="${sonActif()}" aria-label="${sonActif() ? 'Couper le son' : 'Activer le son'}">${sonActif() ? ICONE_SON : ICONE_MUET}</button>`
    + `<button type="button" class="btn-icone" data-action="regles" aria-expanded="${e.regles}" aria-label="Règles">${ICO.aide}</button></div></header>`;

  const marques = (!s.ennemi.simple && def.traits?.length ? def.traits.map((t) => { const x = texteTrait(t); return `<span class="trait" tabindex="0" title="${echap(x.texte)}" aria-label="${echap(`${x.nom} : ${x.texte}`)}">${echap(x.nom)}</span>`; }).join('') : '')
    + (s.ennemi.bouclier ? `<span class="etat garde">${ICO.bouclier}${s.ennemi.bouclier}</span>` : '')
    + (s.ennemi.fissure ? `<span class="etat fissure" tabindex="0" title="Fissure : il subit ${Math.round(s.ennemi.fissure * 100)} % de dégâts en plus">${ICO.fele}Fissure +${Math.round(s.ennemi.fissure * 100)} % dégâts</span>` : '');

  // la scène de l'ennemi
  // un gardien (27 octobre 2026) : son nom dans une plaque peinte, sa vie dans une barre ornée avec le cran de sa seconde phase
  const gardien = estGardien(def.id) && !s.ennemi.porteur;
  h += `<section class="scene-ennemi l-${def.lignee}${gardien ? ' gardien' : ''}${enGroupe(s) ? ' en-groupe' : ''}${s.ennemi.pv > 0 && s.ennemi.pv / s.ennemi.pvMax <= 0.25 ? ' fele' : ''}" style="--fond:${FONDS[def.id] ?? '#2A2438'};--ng:${tousEnnemis(s).length}" aria-label="Ennemi">`
    + (ill ? `<img class="ennemi-art${s.issue === 'victoire' ? ' dissous' : ''}${s.ennemi.porteur ? ' garde' : ''}" src="${ill}" alt="" decoding="async">` : `<span class="ennemi-art sans" aria-hidden="true"></span>`)
    + (s.ennemi.pv > 0 && s.ennemi.pv / s.ennemi.pvMax <= 0.25 ? '<span class="fele-trait" aria-hidden="true"></span>' : '')
    + `<span class="scene-voile" aria-hidden="true"></span>${popsPour(e, 'ennemi')}`

    + vignettesGroupe(e)
    + plaqueIntention(s, classeIntention, iconeIntention, felureHtml)
    + `<div class="ennemi-infos"><div class="tags"><span class="tag" style="--c:${COULEUR[def.lignee]}">${echap(e.x.pillage ? `GARNISON · ${e.x.pillage.nom}` : def.tag)}</span><span class="faible" style="--c:${COULEUR[faible]}">Faible contre <b>${NOMS_LIGNEE[faible].court}</b></span></div>`
    + (gardien ? plaqueGardien(def.nom, s.ennemi.phase2 && def.phase ? def.phase.nom : '')
      : `<h2 class="ennemi-nom">${echap(nomEnnemi(s.ennemi))}${s.ennemi.phase2 && def.phase ? ` <small class="phase">· ${echap(def.phase.nom)}</small>` : ''}</h2>`)
    // les traits et les états passagers (bouclier, Fissure) sur la même ligne : la scène reste basse sur téléphone
    + (marques ? `<div class="traits">${marques}</div>` : '')
    + (gardien ? vieGardien(e)
      : `<div class="vie-ennemi">${jauge('je', s.ennemi.pv, s.ennemi.pvMax, { trace: e.traces?.ennemi, pas: 10, bouclier: s.ennemi.bouclier })}<span class="je-valeur"><b>${s.ennemi.pv}</b><small>/ ${s.ennemi.pvMax}</small></span></div>`)
    + `</div></section>`;

  // l'escouade
  h += '<section class="escouade-combat" aria-label="Escouade">';
  for (const p of s.porteurs) {
    const d = porteurDef(p.id);
    const ko = p.pv <= 0;
    // dans un groupe, chaque ennemi debout annonce sa propre attaque
    const cible = !ko && !C_brume(s) && C_ennemisDebout(s).some((en) => { const i = intentionDe(s, en); return i.type === 'atk' && (i.zone || i.cibleId === p.id); });
    const img = portrait(d.id);
    const basPv = !ko && p.pv / p.pvMax <= 0.3;
    const soigne = !ko && s.chaine.some((g) => soigneUnSeul(g) && g.cible === p.id);
    h += `<div class="combattant${ko ? ' ko' : ''}${cible ? ' cible' : ''}${basPv ? ' bas' : ''}${soigne ? ' soigne' : ''}" data-porteur="${p.id}" data-pvmax="${p.pvMax}" style="--c:${COULEUR[d.lignee]}">${popsPour(e, p.id)}`
      + (img ? `<span class="cb-fond" style="background-image:url(${img})" aria-hidden="true"></span>` : '')
      + `<span class="avatar${img ? '' : ' sans-portrait'}" style="--t:34px" aria-hidden="true">${img ? `<img src="${img}" alt="">` : `<b>${echap(d.nom.charAt(0))}</b>`}</span>`
      + `<div class="cb-infos"><span class="n">${echap(d.nom)}</span><span class="cb-lignee" aria-hidden="true">${ko ? 'À terre' : NOMS_LIGNEE[d.lignee].nom}</span>`
      + `<div class="cb-vie">${jauge('jp', p.pv, p.pvMax, { trace: e.traces?.[p.id], pas: 5, ...(p.usure ? { usure: p.usure } : {}) })}<span class="chiffre" aria-label="${ko ? 'À terre' : `${p.pv} PV sur ${p.pvMax}${p.usure ? `, l’Usure en retire ${p.usure}` : ''}`}">${ko ? '0' : p.pv}<small aria-hidden="true">/ ${p.pvMax}</small></span></div></div>`
      + (cible ? `<span class="marque-cible">${ICO.atk}CIBLE</span>` : '') + (soigne ? `<span class="marque-soin" aria-label="Sera soigné">${ICO.soin}</span>` : '') + `</div>`;
  }
  h += `</section><div class="ligne-escouade">${popsPour(e, 'escouade')}<span class="etat garde${s.bouclier ? ' actif' : ''}">${ICO.bouclier}Bouclier ${s.bouclier}</span>${s.ombre ? `<span class="etat ombre actif">${ICO.eclat}Ombre agissante</span>` : ''}`
    // les piles ouvrent le journal du combat (27 octobre 2026) : les cartes jouées tour par tour, la défausse et la pioche
    + `<button type="button" class="piles" data-action="journal" data-id="cartes" aria-label="${echap(`Pioche ${s.pioche.length}, défausse ${s.defausse.length} : ouvrir le journal du combat`)}"${e.verrou ? ' disabled' : ''}><span>${ICO.cartes}<em>Pioche</em>${s.pioche.length}</span><span>${ICO.recycler}<em>Défausse</em>${s.defausse.length}</span><i class="piles-journal" aria-hidden="true">${ICO.journal}</i></button></div>`;

  // la chaîne
  const mult = a.suite >= 3 ? `×${a.mult.toLocaleString('fr-BE')}` : '';
  h += `<section class="zone-chaine${a.suite >= 3 ? ' resonne' : ''}" aria-label="Chaîne"><div class="chaine-tete"><span class="surtitre">CHAÎNE · ${placesPrises(s)} / ${capacite(s)}</span>`
    + (mult ? `<span class="badge-reso">${ICO.flux}RÉSONANCE ${mult}</span>` : a.suite === 2 ? '<span class="badge-reso faible">SUITE EN COURS</span>' : '')
    + (a.echo ? `<span class="badge-reso echo">${ICO.bouclier}ÉCHO +${REGLES.bouclierEcho}</span>` : '')
    + (s.debride ? `<span class="badge-reso eclat">${ICO.eclat}DÉBRIDAGE ×${String(REGLES.eclat.debride).replace('.', ',')}</span>` : '')
    + (s.chaine.length && e.actif === undefined && !verrou ? bilanChaine(s) : '')
    + `</div><div class="rail">`;
  // pendant l'animation, la carte qui agit s'avance, celles déjà jouées s'éteignent
  s.chaine.forEach((g, i) => {
    const etat = e.actif === undefined ? '' : i === e.actif ? 'en-jeu' : i < e.actif ? 'jouee' : '';
    const html = maillon(g, verrou);
    h += etat ? html.replace('class="', `class="${etat} `) : html;
    // une carte lourde garde sa forme de carte : sa deuxième place est un emplacement relié, au lieu d'une carte étirée
    if (g.lourd) {
      const ill = g.carte ? illustrationModule(g.carte) : null;
      h += `<span class="place-vide place-liee${etat ? ' ' + etat : ''}"${ill ? ` style="--art:url(${ill})"` : ''} aria-hidden="true"><small>2 pl.</small></span>`;
    }
  });
  for (let i = 0; i < libres; i++) h += `<span class="place-vide" aria-hidden="true">${i === 0 && dernier && !a.echo && fs[fs.length - 1]! < FREQ_MAX ? (fs[fs.length - 1]! + 1) : ''}</span>`;
  h += `</div><p class="conseil">${conseil}</p>`;
  if (!e.lecon) {
    // Coup d'éclat : Flux plein, un seul par combat. Un bouton doré dans la rangée du Flux déplie le choix (une lignée par
    // Porteur debout) à la même place : la rangée ne grandit pas, la main garde sa taille sur téléphone.
    const eclats = eclatsPossibles(s);
    if (eclats.length && e.eclats) {
      h += `<div class="flux coups-eclat" role="group" aria-label="Coup d’éclat : un seul par combat, il vide le Flux">`
        + eclats.map((c) => `<button type="button" class="btn-eclat l-${c.lignee}" style="--c:${COULEUR[c.lignee]}" data-action="eclat" data-id="${c.porteur}"${verrou ? ' disabled' : ''} aria-label="${echap(`${ECLATS[c.lignee].nom}, par ${porteurDef(c.porteur).nom} : ${ECLATS[c.lignee].texte}`)}"><strong>${echap(ECLATS[c.lignee].nom)}</strong><small>${echap(porteurDef(c.porteur).nom)}</small></button>`).join('')
        + `<button type="button" class="btn-icone" data-action="eclats" aria-label="Garder mon Flux">${ICO.fermer}</button></div>`;
    } else {
      // Flux plein et Coup d'éclat disponible : le bouton doré prend la place des trois losanges (pleins, par définition)
      h += `<div class="flux">`
        + (eclats.length
          ? `<button type="button" class="btn-flux btn-eclat-ouvrir" data-action="eclats" aria-expanded="false"${verrou ? ' disabled' : ''} aria-label="Flux plein : Coup d’éclat, un seul par combat, il vide le Flux">${ICO.eclat}Éclat</button>`
          : jaugeFlux(s.flux))
        + `<button type="button" class="btn-flux" data-action="allonger"${verrou || s.flux < 1 || capacite(s) >= REGLES.capaciteMax ? ' disabled' : ''}>${ICO.place}+1 place</button>`
        + `<button type="button" class="btn-flux" data-action="repiocher"${verrou || s.flux < 1 ? ' disabled' : ''}>${ICO.repiocher}Repiocher</button>`
        + '</div>';
    }
  }
  h += `</section>`;

  if (e.lecon) h += `<section class="lecon" aria-live="polite"><span class="surtitre">${ICO.cristal}COMBAT GUIDÉ</span><p>${echap(e.lecon)}</p></section>`;

  // la main
  h += `<section class="zone-main" aria-label="Main"><div class="main-tete"><span class="surtitre">MAIN · ${s.main.length}</span>${s.journal[0] ? `<button type="button" class="journal-ligne" data-action="journal" data-id="tours"${e.verrou ? ' disabled' : ''} aria-label="${echap(`${s.journal[0]} Ouvrir le journal du combat`)}"><span>${echap(s.journal[0])}</span>${ICO.journal}</button>` : ''}</div><div class="main${guide && s.tour >= 2 && s.main.some((g) => vise(g) && places(g) <= libres) ? ' tri' : ''}">`;
  for (const g of s.main) {
    // une place qu'on n'a pas remplie chez ce Porteur : elle prend sa place dans la main ce tour-ci, sans se jouer
    if (g.vide) {
      const img = g.porteur ? portrait(g.porteur) : null;
      const nom = g.porteur ? porteurDef(g.porteur).nom : '';
      h += `<span class="geste main main-vide" role="img" aria-label="${echap(`Place vide de ${nom} : elle ne se joue pas`)}" style="--c:${COULEUR[ligneeGeste(g)]}">`
        + (img ? `<span class="mv-ombre" style="background-image:url(${img})" aria-hidden="true"></span>` : '')
        + `<span class="mv-texte" aria-hidden="true"><b>Place vide</b><small>${echap(nom)}</small></span></span>`;
      continue;
    }
    const halo = !!dernier && prolonge(g, fs[fs.length - 1]) && places(g) <= libres;
    h += geste(g, 'main', 'ajouter', { halo, off: verrou, serre: places(g) > libres, vise: vise(g) && places(g) <= libres, felure: brise(g) && !prevue });
  }
  h += '</div></section>';

  h += `<footer class="actions-combat"><button type="button" class="btn sec" data-action="vider"${verrou || !s.chaine.length ? ' disabled' : ''}>${ICO.retirer}Retirer</button>`
    + `<button type="button" class="btn prim lancer${mult ? ' fort' : ''}${lancerVise ? ' vise' : ''}" data-action="lancer"${verrou || !s.chaine.length ? ' disabled' : ''}>${ICO.lancer}Lancer la chaîne${mult ? ` <b>${mult}</b>` : ''}</button></footer>`;

  if (e.journal) h += feuilleJournal(s, e.journal);
  else if (e.guide) h += feuilleGuide(e.guide, e.trouvees ?? new Set());
  else if (e.regles) h += regles();
  else if (e.fuite && peutFuir(e.x) && !verrou) h += feuilleFuite(e);
  if (e.decouverte && !e.fin) {
    const d = e.decouverte;
    const ill = d.ennemi ? illustrationEnnemi(d.ennemi) : null;
    h += `<div class="voile" role="dialog" aria-modal="true" aria-labelledby="decouverte-titre"><div class="fenetre decouverte">`
      + (ill ? `<img class="decouverte-portrait" src="${ill}" alt="" decoding="async">` : `<span class="decouverte-ico" aria-hidden="true">${ICO.cristal}</span>`)
      + `<span class="surtitre">${echap(d.sur)}</span><h2 id="decouverte-titre">${echap(d.titre)}</h2><p>${echap(d.texte)}</p>`
      + (d.conseil ? `<p class="conseil-decouverte"><b>Conseil</b> ${echap(d.conseil)}</p>` : '')
      + `<button type="button" class="btn prim large" data-action="decouverte-ok" data-id="${echap(d.id)}">Compris</button></div></div>`;
  }
  if (e.fin && !e.journal) {
    const victoire = !/Défaite|Repoussés/.test(e.fin.titre);
    h += `<div class="voile" role="dialog" aria-modal="true" aria-labelledby="fin-titre"><div class="fenetre fin ${victoire ? 'victoire' : 'defaite'}"><span class="surtitre">${victoire ? 'VICTOIRE' : 'L’ESCOUADE RECULE'}</span><h2 id="fin-titre">${echap(e.fin.titre)}</h2><p>${echap(e.fin.texte)}</p>`
      + `<button type="button" class="btn prim large" data-action="${e.fin.action}">${echap(e.fin.bouton)}</button>${e.fin.bouton2 ? `<button type="button" class="btn sec large" data-action="${e.fin.action2}">${echap(e.fin.bouton2)}</button>` : ''}`
      + (s.historique?.some((t) => t.chaine.length) ? `<button type="button" class="lien fin-journal" data-action="journal" data-id="tours">${ICO.journal}Revoir le combat</button>` : '') + `</div></div>`;
  }
  return h + `</div>`;
}
