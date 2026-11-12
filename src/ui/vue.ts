// Rendu de l'écran de combat à partir d'un état. Aucune règle de jeu ici : seulement de l'affichage.
// Disposition, de haut en bas : la scène de l'ennemi (son intention en évidence), l'escouade, la chaîne et le Flux,
// la main, puis le bouton Lancer toujours au même endroit, sous le pouce.

import { ECLATS, placesCarte, estGardien, genreSuivant, feluresPrevues, apercuChaine, coupsAttendus, type CoupAttendu, detailForce, type DetailForce, protegeDe, protectionUtile, capacite, coupDeFuite, partFelure, eclatsPossibles, felureVisible, ligneeGeste, placesLibres, placesPrises, soigneUnSeul, texteIntention, tousEnnemis, intentionDe, enGroupe, brumeActive as C_brume, puissance, usureCombat, peutRelancer, traitsEnJeu, avantageAnnonce, ligneeEnnemi, nomPhase, voixRefusee, mainBloquee } from '../core/combat';
import { CONDITIONS, NOMS_LIGNEE, ZONES, ennemiDef, porteurDef, texteTrait, zoneDe } from '../core/donnees';
import { BATTU_PAR, REGLES, analyserChaine, frequenceLibre, frequencesEffectives, nomEcho, pctEcho, prolonge, serieFinale } from '../core/regles';
import { NOMS_EFFET, effetsDe, libelleEffet, texteEffet } from '../core/effets';
import type { CombatEtat, EnnemiEtat, Geste, LigneeGeste, Rarete } from '../core/types';
import { peutFuir, peutReculer, sallePrecedente, type Expedition, type TypeSalle } from '../core/expedition';
import { DISTRICT, PILLAGE } from '../core/jeu';
import { portraitProvisoire, ageArchipel, artGardien, fondFleche, vignetteArchipel, fondCombat, illustrationEnnemi, illustrationModule, portrait, visageGarnison, cadragePortrait, sceneDistrict } from './art';
import { SIGNE_LOURD, corpsFace, couleurFrequence, styleFace, type Face } from './carte';
import { sonActif } from './son';
import { ICO, sigle } from './icones';
import { NOM_LIGNEES } from './coquille';
import type { Decouverte } from '../core/decouvertes';
import { feuilleGuide, lienGuide, type OngletGuide } from './guide';
import { decimal, echap } from './outils';
import { queteDef } from '../core/strates';
import { feuilleJournal, type OngletJournal } from './journal';
import { t as tr, locale, enumerer, pourCent } from '../core/i18n';

export const ICONE_SON = '<svg class="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 9h4l5-4v14l-5-4H4z"/><path d="M16.5 8.5a5 5 0 0 1 0 7M19 6a8.5 8.5 0 0 1 0 12"/></svg>';
export const ICONE_MUET = '<svg class="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 9h4l5-4v14l-5-4H4z"/><path d="M17 9l5 6M22 9l-5 6"/></svg>';

export interface Fin {
  titre: string;
  texte: string;
  bouton: string;
  action: 'suivant' | 'remonter';
  /** second bouton facultatif */
  bouton2?: string;
  action2?: 'suivant' | 'remonter';
  /** l'issue dite par le titre lui-même (« Victoire », « Défaite », « Repoussés… ») : pas de surtitre, et la défaite colore la fenêtre */
  issue?: 'victoire' | 'defaite';
}

export interface Compte {
  actif: boolean;
  ouvert: boolean;
  /** anonyme : le compte invisible du premier lancement, pas encore relié à Google ou à un e-mail */
  utilisateur: { nom: string; anonyme?: boolean; verifie?: boolean; via?: 'google' | 'email'; email?: string } | null;
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
  /** l'âge dit au premier lancement : « jeune » (moins de 13 ans) joue sans rien en ligne */
  age?: 'majeur' | 'jeune' | null;
  /** on demande l'âge avant de commencer une nouvelle partie (premier lancement) */
  ageDemande?: boolean;
  /** la suppression du compte : 1 = le joueur a touché « Supprimer », on lui demande de confirmer */
  supprimer?: number;
  /** on sait si le joueur est connecté, et la partie du compte est récupérée (ou il n'y a pas de compte, ou on est hors ligne) */
  pret?: boolean;
}

export interface Ecran {
  x: Expedition;
  etat: CombatEtat;
  verrou: boolean;
  regles: boolean;
  /** ce qui vient de changer pendant la chaîne et se fond (12 novembre 2026) : la Fissure posée, la Fêlure brisée (avec l'état d'avant) */
  fondus?: { fissure?: number; felure?: { ne: number; avant: CombatEtat } };
  fin: Fin | null;
  /** consigne du combat guidé (chambre scellée) */
  lecon?: string;
  /** une mécanique rencontrée pour la première fois, à expliquer (decouvertes.ts) */
  decouverte?: Decouverte;
  /** quand plusieurs découvertes s'enchaînent au premier tour : laquelle sur combien */
  decouvertePage?: { n: number; total: number };
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
  /** la tuile de l'escouade dont le choix « protéger ou soigner » est ouvert */
  tuile?: string;
  /** le mode d'emploi des cartes est ouvert (depuis l'aide), et les cartes trouvées qu'il peut nommer */
  guide?: OngletGuide | null;
  trouvees?: ReadonlySet<string>;
  /** le journal du combat est ouvert (tours joués, ou défausse et pioche) */
  journal?: OngletJournal | null;
  /** le combat automatique est permis ici (Strate déjà vaincue, combat ordinaire), et s'il tourne (31 octobre 2026) */
  autoPermis?: boolean;
  auto?: boolean;
  /** le joueur a déjà visé un ennemi d'un groupe : la bulle d'aide ne revient plus (3 novembre 2026) */
  viserAppris?: boolean;
}

export const COULEUR: Record<LigneeGeste, string> = {
  tech: 'var(--tech)', bio: 'var(--bio)', reso: 'var(--reso)', neutre: 'var(--ivory)',
};

const LIBELLE = { atk: 'attaque', bouclier: 'protection', soin: 'soin' };

const FONDS: Record<string, string> = { ilka: '#3A4E63', doran: '#3B4D37', vela: '#44395C', coursier: '#33465A', docker: '#36462F', guetteur: '#3D3352', sasha: '#3D4752', nuit: '#2F3B2E', aurel: '#3A3050', remanent: '#2A2438', vigie: '#26313D', confluence: '#2E2B22', rampeur: '#2C3326', pilleur: '#2F2A24', brigadier: '#2E2A3E', 'echo-veilleur': '#252238', 'sentinelle-verre': '#22303A', 'gardien-registres': '#2B2533', double: '#2A2236', 'essaim-ambre': '#352A18', 'automate-graveur': '#29303A', tisseuse: '#33261F', 'premier-porteur': '#1E1C2A' };

const pct = (v: number, max: number) => Math.max(0, Math.min(100, (100 * v) / max));

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
  const nomP = g.porteur ? porteurDef(g.porteur).nom : tr('District');
  const accord = frequenceLibre(g.effet);
  const metal = (g.carte?.split('@')[1] as Rarete | undefined) ?? 'fer';
  const d: Face = {
    carte: g.carte, repli: g.porteur ? portrait(g.porteur) : null, metal, type: g.type, v: vReel, ...(tendance ? { tendance } : {}),
    fs: [g.f, ...(g.fs ?? []).filter((f) => f !== g.f)], nom: g.nom, effet: g.effet, ...(g.effet2 ? { effet2: g.effet2 } : {}), lourd: g.lourd, lignee: COULEUR[lign], suite: o.halo,
    felure: o.felure ? ICO.fele : undefined,
  };
  const cls = ['geste', taille, eteinte ? 'eteinte' : '', g.lourd ? 'lourd' : '', o.halo ? 'halo' : '', o.vise ? 'vise' : '', o.serre ? 'serre' : '', o.felure ? 'brise-felure' : ''].filter(Boolean).join(' ');
  const freqs = g.fs && g.fs.length > 1 && !accord ? tr`, Fréquences possibles ${g.fs.join(tr(' ou '))}` : '';
  const label = tr`${g.nom} (${nomP}), Fréquence ${accord ? tr('libre') : g.f}${freqs}, ${LIBELLE[g.type]} ${vReel}${tendance ? tr` (${tendance === 'hausse' ? tr('renforcée') : tr('affaiblie')}, ${g.v} de base)` : ''}${g.lourd ? tr(', prend 2 places') : ''}${effetsDe(g).map((x) => ', ' + libelleEffet(x)).join('')}${o.halo ? tr(', prolonge ta suite') : ''}${o.felure ? tr(', brise la Fêlure de l’ennemi') : ''}${eteinte ? tr(', éteinte : son Porteur est à terre') : ''}`;
  AFFICHES.set(g.uid, { g, d, nomP, eteinte, detail });
  return `<button type="button" class="${cls}" style="--c:${COULEUR[lign]}" data-action="${action}" data-uid="${g.uid}" data-porteur="${g.porteur ?? ''}" aria-label="${echap(label)}"${o.off ? ' disabled' : ''}>`
    + `<span class="nf nf-${metal}${o.halo ? ' nf-suite' : ''}" style="${styleFace(d)}" aria-hidden="true">${corpsFace(d).replace(/ loading="lazy"/g, '')}</span>`
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
    + `<p class="loupe-qui">${eteinte ? tr`Éteinte : ${echap(nomP)} est à terre` : tr`Jouée par ${echap(nomP)}`}${g.lourd ? tr(' · prend 2 places') : ''}</p></div>`;
}

const QUOI = { atk: tr('dégâts'), bouclier: tr('de bouclier'), soin: tr('PV soignés') };
const pourcent = (m: number) => {
  const p = Math.round((m - 1) * 100);
  return `${p > 0 ? '+' : '−'}${pourCent(Math.abs(p))}`;
};

/** Le calcul de la carte dans la loupe : la base, chaque bonus (vert) et malus (rouge), puis le total */
function calculLoupe(g: Geste, d: DetailForce): string {
  const lignes = d.lignes.map((l) => {
    const plus = l.m !== undefined ? l.m > 1 : (l.v ?? 0) > 0;
    const val = l.m !== undefined ? pourcent(l.m) : `${(l.v ?? 0) > 0 ? '+' : '−'}${Math.abs(l.v ?? 0)}`;
    return `<li class="${plus ? 'plus' : 'moins'}"><span>${echap(l.nom)}</span><b>${val}</b></li>`;
  }).join('');
  const total = `<li class="total"><span>${d.siPosee ? tr('Posée maintenant') : tr('Au lancer')}</span><b>${d.total} ${QUOI[g.type]}</b></li>`;
  const bouclier = d.bouclierEnnemi > 0 ? `<p class="lc-note">${tr`Son bouclier (${d.bouclierEnnemi}) absorbe d’abord le coup.`}</p>` : '';
  return `<div class="loupe-calcul"><ul><li class="base"><span>${tr`Force de la carte`}</span><b>${d.base}</b></li>${lignes}${total}</ul>${bouclier}</div>`;
}

/**
 * Une jauge de vie : un rail serti, la vie qui reste, la traînée du dernier coup qui se vide, des graduations
 * (une tous les `pas` PV) et, pour l'ennemi, son bouclier posé au bout de la vie.
 */
export function jauge(classe: string, pv: number, max: number, o: { trace?: number; pas?: number; bouclier?: number; usure?: number; perte?: number } = {}) {
  // l'Usure : les PV perdus pour toute la descente, hachurés au bout de la jauge (la jauge compte alors sur les PV pleins)
  const u = o.usure ?? 0;
  if (u > 0) max += u;
  const v = pct(pv, max);
  const usure = u > 0 ? `<i class="j-usure" style="width:${pct(u, max)}%"></i>` : '';
  const trainee = o.trace !== undefined && o.trace > v ? `<i class="j-trainee" data-cle="t${Math.round(o.trace)}-${Math.round(v)}" style="--de:${o.trace}%;--a:${v}%"></i>` : '';
  const bouclier = o.bouclier ? `<i class="j-bouclier" style="left:${Math.max(0, v - pct(o.bouclier, max))}%;width:${Math.min(v, pct(o.bouclier, max))}%"></i>` : '';
  const pas = o.pas ? pct(o.pas, max) : 10;
  // les PV que le prochain coup ennemi va retirer : un segment rouge qui bat au bout de la vie
  const perte = o.perte ? `<i class="j-perte" style="left:${pct(Math.max(0, pv - o.perte), max)}%;width:${pct(Math.min(pv, o.perte), max)}%"></i>` : '';
  return `<span class="jauge-vie ${classe}${v <= 30 ? ' basse' : ''}" style="--pas:${pas}%" role="img" aria-label="${tr`${pv} PV sur ${max}`}">`
    + `<span class="j-rail">${trainee}<i class="j-vie" style="width:${v}%"></i>${perte}${bouclier}${usure}<span class="j-grad"></span></span></span>`;
}

/** Une carte de combat montrée en démonstration (écran « Avant d'ouvrir ») : même rendu, sans action */
export const carteDemo = (g: Geste, taille: 'chaine' | 'main' = 'main') => geste(g, taille, 'demo').replace('<button type="button"', '<div role="img"').replace(/<\/button>$/, '</div>');

/** Une carte posée dans la chaîne : la toucher la retire ; sous elle, de quoi changer sa Fréquence (argent et plus) */
/** la plus haute Fréquence d'une carte : une suite s'arrête là */
const FREQ_MAX = 9;

function maillon(g: Geste, off: boolean, s: CombatEtat) {
  const choix = g.fs && g.fs.length > 1 && !frequenceLibre(g.effet);
  // une carte de soin montre qui elle soigne ; la toucher passe au Porteur suivant
  // un soin vers un Porteur qui a tous ses PV serait perdu : le dire sur l'étiquette
  const cible = g.cible ? s.porteurs.find((p) => p.id === g.cible) : undefined;
  const plein = !!cible && cible.pv >= cible.pvMax;
  const soin = soigneUnSeul(g) && g.cible
    ? `<button type="button" class="cibler${plein ? ' plein' : ''}" data-action="cibler" data-uid="${g.uid}"${off ? ' disabled' : ''} style="--c:${COULEUR[porteurDef(g.cible).lignee]}" aria-label="${tr`Soigne ${echap(porteurDef(g.cible).nom)}${plein ? tr(', qui a déjà tous ses PV') : ''} : toucher pour changer`}">${ICO.soin}<span>${echap(porteurDef(g.cible).nom)}${plein ? tr(' · PV pleins') : ''}</span></button>`
    : '';
  const c = `style="--c:${COULEUR[ligneeGeste(g)]}"`;
  if (soin && !choix) return `<div class="maillon" ${c}>${geste(g, 'chaine', 'retirer', { off })}${soin}</div>`;
  if (!choix) return geste(g, 'chaine', 'retirer', { off });
  const suivante = g.fs![(g.fs!.indexOf(g.f) + 1) % g.fs!.length]!;
  return `<div class="maillon" ${c}>${geste(g, 'chaine', 'retirer', { off })}`
    + `<button type="button" class="accorder" data-action="accorder" data-uid="${g.uid}"${off ? ' disabled' : ''} aria-label="${tr`Passer ${echap(g.nom)} en Fréquence ${suivante}`}">${g.fs!.map((f) => `<i class="${f === g.f ? 'actif' : ''}" style="--fc:${couleurFrequence(f)}">${f}</i>`).join('')}</button>${soin}</div>`;
}

/** La partie de secours : on l'échange avec la partie en cours (deux touches), l'échange se défait de la même façon */
function ligneSecours(c: Compte): string {
  const s = c.secours;
  if (!s) return '';
  const le = new Date(s.le).toLocaleDateString(locale(), { day: 'numeric', month: 'long' });
  return `<p class="discret">${tr`Partie de secours : Strate −${s.strate}, du ${le}.${s.confirmer ? tr` Ta partie actuelle (Strate −${s.actuelle}) deviendra la partie de secours : tu pourras revenir en arrière.` : ''}`}</p>`
    + `<div class="ligne"><button type="button" class="btn sec" data-action="${s.confirmer ? 'secours-confirmer' : 'secours'}">${s.confirmer ? tr('Confirmer l’échange') : tr('Restaurer cette partie')}</button></div>`;
}

/**
 * Avant une nouvelle partie (8 novembre 2026) : l'âge. À 13 ans et plus, la partie est sauvegardée en ligne (compte invisible) ;
 * en dessous, on joue pareil, mais tout reste sur l'appareil. Deux boutons de même poids, sans jugement.
 */
export function panneauAge(): string {
  return `<section class="panneau age" aria-label="${tr`Avant de commencer`}"><strong>${tr`Avant de commencer`}</strong>`
    + `<p class="discret">${tr`Ossyra garde ta partie en ligne pour que tu ne la perdes jamais, et te permet d’apparaître au Grand Tableau sous un pseudo. Pour cela, il faut avoir au moins 13 ans.`}</p>`
    + `<div class="ligne"><button type="button" class="btn prim" data-action="age-debut-majeur">${tr`J’ai 13 ans ou plus`}</button></div>`
    + `<div class="ligne"><button type="button" class="btn sec" data-action="age-jeune">${tr`J’ai moins de 13 ans`}</button></div>`
    + `<p class="discret">${tr`Moins de 13 ans : tu joues au jeu entier, mais ta partie reste sur cet appareil, sans rien en ligne.`} <a class="lien" href="./confidentialite.html" target="_blank" rel="noopener">${tr`Confidentialité et données`}</a></p></section>`;
}

/** retrouver : ouvert depuis le premier écran d'un appareil neuf, pour reprendre une partie jouée ailleurs */
export function panneauCompte(c: Compte, retrouver = false): string {
  if (!c.ouvert) return '';
  if (c.utilisateur && !c.utilisateur.anonyme) {
    const etat = { aucune: '', 'en-cours': tr('Synchronisation…'), ok: tr('Progression enregistrée dans ton compte.'), erreur: tr`Synchronisation impossible pour l’instant, la sauvegarde reste sur l’appareil.${c.codeErreur ? ` (${c.codeErreur})` : ''}` }[c.synchro];
    // dire clairement qu'on est déjà connecté, et avec quoi : sinon on croit devoir se connecter (9 novembre 2026)
    const u = c.utilisateur;
    const avec = u.via === 'google' ? tr('avec Google') : u.via === 'email' ? tr('par e-mail') : '';
    return `<section class="panneau" aria-label="${tr`Compte`}"><p class="connecte">${tr`✓ Connecté ${avec}${u.email ? `<span>${echap(u.email)}</span>` : ''}`}</p>`
      + `<strong>${c.pseudo ? tr`Pseudo : ${echap(c.pseudo)}` : tr('Pas encore de pseudo')}</strong>`
      + `<p class="discret">${c.pseudo ? tr('C’est ce nom que voient les autres joueurs.') : tr('Choisis le nom que verront les autres joueurs : ton nom de compte n’est jamais affiché.')}</p>`
      + `<div class="ligne"><button type="button" class="btn ${c.pseudo ? 'sec' : 'prim'}" data-action="gt-nom">${c.pseudo ? tr('Changer de pseudo') : tr('Choisir mon pseudo')}</button></div>`
      + (etat ? `<p class="discret">${etat}</p>` : '')
      + ligneSecours(c)
      + `<div class="ligne"><button type="button" class="btn sec" data-action="deconnexion"${c.occupe ? ' disabled' : ''}>${tr`Se déconnecter`}</button></div>`
      + blocDonnees(c) + `</section>`;
  }
  if (c.age === 'jeune' && !c.utilisateur) return `<section class="panneau" aria-label="${tr`Compte`}"><strong>${tr`Partie de cet appareil`}</strong>`
    + `<p class="discret">${tr`Les comptes en ligne (sauvegarde, Grand Tableau, Cercle des quais) sont réservés aux 13 ans et plus. Ta partie est gardée sur cet appareil.`}</p>`
    + `<div class="ligne"><button type="button" class="btn sec" data-action="age-majeur">${tr`J’ai 13 ans ou plus`}</button></div>`
    + `<p class="discret"><a class="lien" href="./confidentialite.html" target="_blank" rel="noopener">${tr`Confidentialité et données`}</a></p></section>`;
  const invisible = !!c.utilisateur?.anonyme;
  return `<section class="panneau" aria-label="${tr`Compte`}"><strong>${invisible ? tr('Protège ta partie') : retrouver ? tr('Retrouve ta partie') : tr('Compte')}</strong>`
    + `<p class="discret">${retrouver && !invisible
      ? tr('Connecte-toi avec le compte utilisé sur ton autre appareil : ta partie s’ouvrira ici, là où tu l’as laissée.')
      : invisible
      ? tr('Ta partie est sauvegardée, mais seulement pour ce téléphone. Relie-la à Google ou à un e-mail : elle ne sera jamais perdue, et tu la retrouveras sur un autre appareil.')
      : tr('Optionnel : retrouve ta progression sur un autre appareil.')}</p>`
    + `<div class="ligne"><button type="button" class="btn prim" data-action="google"${c.occupe ? ' disabled' : ''}>${tr`Continuer avec Google`}</button></div>`
    + `<input id="email" type="email" autocomplete="email" placeholder="${tr`E-mail`}" aria-label="${tr`E-mail`}">`
    + `<input id="mdp" type="password" autocomplete="current-password" placeholder="${tr`Mot de passe`}" aria-label="${tr`Mot de passe`}">`
    + `<div class="ligne"><button type="button" class="btn sec" data-action="connexion"${c.occupe ? ' disabled' : ''}>${tr`Se connecter`}</button><button type="button" class="btn sec" data-action="inscription"${c.occupe ? ' disabled' : ''}>${tr`Créer un compte`}</button></div>`
    + `<button type="button" class="lien" data-action="oubli">${tr`Mot de passe oublié`}</button>`
    + (c.erreur ? `<p class="erreur">${echap(c.erreur)}</p>` : '')
    + (c.info ? `<p class="discret">${echap(c.info)}</p>` : '')
    + ligneSecours(c)
    + blocDonnees(c)
    + `</section>`;
}

/**
 * Tes données (8 novembre 2026, RGPD et Play Store) : la page de confidentialité, et supprimer son compte et tout ce qu'il a
 * publié, en deux touches. Sans compte, il n'y a rien en ligne : seulement le lien vers la page.
 */
function blocDonnees(c: Compte): string {
  const page = `<a class="lien" href="./confidentialite.html" target="_blank" rel="noopener">${tr`Confidentialité et données`}</a>`;
  if (!c.utilisateur) return `<p class="discret donnees">${tr`${page} · Réservé aux 13 ans et plus`}</p>` + mentionRecaptcha;
  if (c.supprimer) return `<div class="donnees confirmer" role="group" aria-label="${tr`Supprimer mon compte`}">`
    + `<p><strong>${tr`Tout supprimer, pour de bon ?`}</strong> ${tr`Ta partie (en ligne et sur cet appareil), ton pseudo, ta place au Grand Tableau, ta garde de la Flèche, ta garnison, ta vitrine et tes amis du Cercle seront effacés. Rien ne pourra être récupéré.`}</p>`
    + `<div class="ligne"><button type="button" class="btn sec" data-action="supprimer-annuler"${c.occupe ? ' disabled' : ''}>${tr`Garder mon compte`}</button>`
    + `<button type="button" class="btn danger" data-action="supprimer-confirmer"${c.occupe ? ' disabled' : ''}>${tr`Oui, tout supprimer`}</button></div></div>`;
  return `<p class="discret donnees">${page} · <button type="button" class="lien" data-action="supprimer">${tr`Supprimer mon compte et mes données`}</button></p>` + mentionRecaptcha;
}

/**
 * App Check (8 novembre 2026) : le badge reCAPTCHA est caché (styles.css), donc la mention exigée par Google figure ici,
 * sous le lien Confidentialité du panneau Compte.
 */
const mentionRecaptcha = `<p class="discret recaptcha">${tr`Protégé par reCAPTCHA : les`} <a class="lien" href="https://policies.google.com/privacy" target="_blank" rel="noopener">${tr`règles de confidentialité`}</a> ${tr`et les`} <a class="lien" href="https://policies.google.com/terms" target="_blank" rel="noopener">${tr`conditions d’utilisation`}</a> ${tr`de Google s’appliquent.`}</p>`;

// ---------- Fuir (décision du 22 octobre 2026) ----------
// Deux sorties, au choix : reculer d'une salle sur la carte, ou remonter au district. Dans les deux cas l'attaque annoncée
// touche pendant la fuite (la feuille dit qui elle va toucher, et si quelqu'un tombera). Personne ne meurt.
const NOMS_SALLE: Record<TypeSalle, string> = {
  entree: tr('l’entrée'), combat: tr('la salle de combat'), elite: tr('la salle scellée'), cache: tr('la cache'), rencontre: tr('la salle de la rencontre'),
  camp: tr('le campement'), archive: tr('les archives'), gardien: tr('la salle du gardien'), filon: tr('le filon'), halte: tr('la Halte'), porte: tr('la porte ancienne'),
};

/** Guet affirmé (Guetteur) : la petite pastille « ensuite » de l'intention, le genre du tour d'après */
function ensuite(s: CombatEtat): string {
  const g = genreSuivant(s, s.ennemi);
  if (!g) return '';
  const ico = g === 'atk' ? ICO.atk : g === 'bouclier' ? ICO.bouclier : g === 'soin' ? ICO.soin : g === 'dissonance' ? ICO.flux : ICO.boost;
  const cls = g === 'atk' ? 'danger' : g === 'bouclier' || g === 'soin' ? 'garde' : 'boost';
  return `<span class="int-ensuite ${cls}" role="img" aria-label="${echap(tr`Guet : au tour suivant, ${(GENRE_INTENTION[g] ?? '').toLowerCase()}`)}" title="${tr`Guet : ce qu’il prépare ensuite`}"><small>${tr`puis`}</small>${ico}</span>`;
}

/** Ce que prépare l'ennemi, sans chiffre ni cible (le brouillard laisse voir ça) */
const GENRE_INTENTION: Record<string, string> = { atk: tr('Va attaquer'), bouclier: tr('Va se protéger'), soin: tr('Va se réparer'), boost: tr('Se concentre'), dissonance: tr('Va brouiller tes Fréquences'), appel: tr('Va appeler un renfort') };

function feuilleFuite(e: Ecran): string {
  const x = e.x;
  const s = e.etat;
  const nom = nomEnnemi(s.ennemi);
  const { porteurs, coups, attaque } = coupDeFuite(s);
  const touches = coups.filter((c) => c.net > 0);
  const tombent = porteurs.filter((p) => p.pv <= 0 && (s.porteurs.find((q) => q.id === p.id)?.pv ?? 0) > 0);
  let coup: string;
  if (C_brume(s)) coup = s.intention.type === 'atk' || enGroupe(s)
    ? tr('En fuyant, l’escouade encaisse l’attaque cachée dans le brouillard : impossible de savoir qui elle touchera, ni combien.')
    : tr`${echap(nom)} ne semble pas préparer d’attaque : l’escouade devrait s’échapper sans un coup.`;
  else if (!attaque) coup = tr`${echap(nom)} ne prépare pas d’attaque : l’escouade s’échappe sans un coup.`;
  else if (!touches.length) coup = `<b>${echap(attaque)}</b> ${tr`s’écrasera sur le bouclier : l’escouade s’échappe sans une égratignure.`}`;
  else coup = `${tr`En fuyant, l’escouade encaisse l’attaque annoncée :`} <b>${echap(attaque)}</b> ${tr`sur ${touches.map((c) => `${echap(porteurDef(c.id).nom)} (−${c.net})`).join(', ')}.`}`
    + (tombent.length ? ` <b class="tombe">${tombent.length > 1 ? tr`${tombent.slice(0, -1).map((p) => echap(porteurDef(p.id).nom)).join(', ')} et ${echap(porteurDef(tombent[tombent.length - 1]!.id).nom)} tomberont à terre.` : tr`${echap(porteurDef(tombent[0]!.id).nom)} tombera à terre.`}</b>` : '');

  let h = `<div class="voile-feuille" data-action="fuir" aria-hidden="true"></div><section class="feuille fuite" role="dialog" aria-modal="true" aria-labelledby="fuite-titre"><span class="poignee" aria-hidden="true"></span>`
    + `<header class="feuille-tete"><div class="titres"><span class="surtitre">${tr`FUIR`}</span><h2 id="fuite-titre">${tr`Quitter le combat ?`}</h2></div><button type="button" class="btn-icone" data-action="fuir" aria-label="${tr`Fermer`}">${ICO.fermer}</button></header>`
    + `<div class="feuille-corps"><p class="fuite-coup${touches.length && !C_brume(s) ? ' touche' : ''}">${touches.length || C_brume(s) ? ICO.atk : ICO.bouclier}<span>${coup}</span></p><div class="routes">`;
  if (x.carte) {
    const prec = sallePrecedente(x);
    const ok = peutReculer(x);
    const sortie = prec && (prec.type === 'entree' || prec.type === 'camp');
    h += `<button type="button" class="route" style="--t:#CDEFFF" data-action="fuir-salle"${ok ? '' : ' disabled'}><span class="route-ico">${ICO.retour}</span>`
      + `<span class="route-txt"><small>${tr`RECULER D’UNE SALLE`}</small><strong>${tr`Retour à ${prec ? NOMS_SALLE[prec.type] : tr('la salle d’avant')}`}</strong>`
      + `<em>${ok ? tr`${echap(nom)} garde sa salle : prends un autre chemin, ou reviens l’affronter (un combat neuf). Les PV perdus restent perdus.${sortie ? tr(' De là, tu pourras remonter avec tout ton butin.') : ''}` : tr('Personne ne tiendrait debout après ce coup : il faut remonter.')}</em></span>${ok ? CHEVRON_FUITE : ''}</button>`;
  }
  // Foulée gravée (Coursier) : la fuite ne coûte plus de butin
  const sure = !!x.bonus?.fuiteSure;
  const garde = sure ? x.butin : Math.floor(x.butin * DISTRICT.butinFuite);
  h += `<button type="button" class="route" style="--t:#F0C96A" data-action="fuir-district"><span class="route-ico">${ICO.strate}</span>`
    + `<span class="route-txt"><small>${x.fleche ? tr('ABANDONNER L’ASSAUT') : x.pillage ? tr('ABANDONNER LE PILLAGE') : x.epreuve ? tr('ABANDONNER L’ÉPREUVE') : tr('REMONTER AU DISTRICT')}</small>`
    + `<strong>${x.epreuve || x.pillage || x.fleche ? tr('Rentrer au district') : x.butin ? (sure ? tr`Rentrer avec ${garde} minerai` : tr`Rentrer avec ${garde} minerai sur ${x.butin}`) : tr('Rentrer au district')}</strong>`
    + `<em>${tr`${x.fleche?.defi ? tr('Le défi compte comme perdu : ta montée, elle, ne bouge pas.') : x.fleche ? tr('L’assaut compte comme perdu : l’escouade redescend comme après une défaite.') : x.pillage ? tr`Le pillage compte comme perdu : tu laisses ${Math.round(PILLAGE.perteDefaite * 100)} % de ton coffre à ${echap(x.pillage.nom)}.` : x.epreuve ? tr('Tu pourras la retenter cette semaine.') : sure ? tr('Foulée : le Coursier a ouvert la route du retour, tu gardes tout le butin.') : tr`Tu gardes ${Math.round(DISTRICT.butinFuite * 100)} % du minerai et toutes les cartes trouvées.`} L’escouade rentre épuisée : +${DISTRICT.usureFuite} d’Usure chacun, en plus de l’expédition.`}</em></span>${CHEVRON_FUITE}</button>`
    + `</div><button type="button" class="btn sec large" data-action="fuir">${tr`Continuer le combat`}</button></div></section>`;
  return h;
}
const CHEVRON_FUITE = '<svg class="ico route-fleche" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 5l7 7-7 7"/></svg>';

function regles(): string {
  return `<div class="voile-feuille" data-action="regles" aria-hidden="true"></div><section class="feuille regles" role="dialog" aria-modal="true" aria-labelledby="regles-titre"><span class="poignee" aria-hidden="true"></span>`
    + `<header class="feuille-tete"><div class="titres"><span class="surtitre">${tr`AIDE`}</span><h2 id="regles-titre">${tr`Comment on joue`}</h2></div><button type="button" class="btn-icone" data-action="regles" aria-label="${tr`Fermer`}">${ICO.fermer}</button></header><div class="feuille-corps">`
    + `<div class="liens-guide">${lienGuide('carte', tr('Lire une carte'))}${lienGuide('effets', tr('Tous les effets'))}</div><ol class="liste-regles">`
    + `<li><b>${tr`Ton deck, ce sont tes cartes.`}</b> ${tr`Chaque Porteur de l’escouade apporte celles que tu lui as confiées au district (6 au plus), plus les cartes communes de son Râtelier. L’illustration est celle de la carte ; à défaut, le portrait du Porteur qui la joue.`}</li>`
    + `<li><b>${tr`Compose une chaîne.`}</b> ${tr`Touche les cartes de ta main (${REGLES.capaciteBase} places au départ), puis lance-la. Une carte posée se retire d’un toucher, ou se glisse de côté pour changer de place.`}</li>`
    + `<li><b>${tr`La force`}</b> ${tr`est au milieu : ${ICO.atk} dégâts, ${ICO.bouclier} protection de l’escouade, ${ICO.soin} soin (dans la chaîne, touche le nom sous la carte pour choisir qui).`}</li>`
    + `<li><b>${tr`La Fréquence`}</b> ${tr`est le chiffre dans la gemme. Des Fréquences qui se suivent dans l’ordre font une Résonance : suite de 3 = +40 %, de 4 = +60 %, de 5 = +100 %. Une flèche dorée marque la carte qui prolonge ta suite.`}</li>`
    + `<li><b>${tr`Plusieurs Fréquences :`}</b> ${tr`une carte en argent, en or ou en nacre en porte 2 ou 3. Posée, elle prend celle qui prolonge ta suite ; touche les chiffres sous elle pour en changer. Rien n’est tiré au sort.`}</li>`
    + `<li><b>${tr`L’Écho :`}</b> ${tr`trois Fréquences identiques dans la chaîne renforcent ces cartes de +${Math.round((REGLES.echo - 1) * 100)} %, quelle que soit leur action (dégâts, protection ou soin), et donnent 1 Flux. Plus rare qu’une suite, il paie davantage. Quatre identiques : ${pctEcho(4)} ; cinq : ${pctEcho(5)} et 1 Flux de plus.`}</li>`
    + `<li><b>${tr`Le Finisseur :`}</b> ${tr`une carte d’attaque Augmentée qui termine une suite de 3 ou plus frappe +${Math.round((REGLES.finisseur - 1) * 100)} %.`}</li>`
    + `<li><b>${tr`Le Flux`}</b> ${tr`se remplit à chaque Résonance, et encore plus si la suite brise aussi une Fêlure. Dépense-le pour ajouter une place à ta chaîne ou repiocher ta main, ou garde-le pour un Coup d’éclat.`}</li>`
    + `<li><b>${tr`La Fêlure`}</b> ${tr`: chaque ennemi montre une Fréquence fêlée. Une carte de cette Fréquence dans la chaîne brise son intention (moitié moins forte, un quart chez un gardien ou un blindé) ; dans un groupe, elle brise aussi la Fêlure d’un ennemi non visé, deux fois moins fort. Une carte ne brise qu’une Fêlure, celle de l’ennemi visé d’abord : en main, ces cartes portent l’icône de la Fêlure dans leur capsule de Fréquence (« Brise » sur grand écran). Dans une suite (3, 4, 5), elle donne aussi 1 Flux. Les évanescents la cachent.`}</li>`
    + `<li><b>${tr`Le Coup d’éclat`}</b> ${tr`: Flux plein, un seul par combat, au choix selon les lignées de l’escouade. ${(Object.values(ECLATS)).map((x) => `<b>${x.nom}</b> : ${x.texte}`).join(' ')} Le Porteur qui le déclenche prend ${REGLES.eclat.usure} d’Usure.`}</li>`
    + `<li><span class="signe-lourd">${SIGNE_LOURD}</span> <b>${tr`Deux places`}</b> ${tr`: cette carte est puissante mais occupe deux places.`}</li>`
    + `<li><b>${tr`La force`}</b> ${tr`écrite sur la carte est celle qui tombera, tous bonus et malus compris :`} <b style="color:#f2c870">${tr`dorée`}</b> ${tr`si la carte est renforcée,`} <b style="color:#a99bc4;text-decoration:underline dotted">${tr`gris-violet en pointillés`}</b> ${tr`si elle est affaiblie ; la couleur de l’action ne change pas. Garde le doigt dessus pour voir le détail.`}</li>`
    + `<li><b>${tr`Les effets`}</b> ${tr`(Perçant, Siphon, Accord…) sont écrits en or. Pose la carte dans la chaîne pour lire ce qu’elle fait. « ∗ » : Fréquence libre, elle prolonge toujours la suite.`}</li>`
    + `<li><b>${tr`Le triangle des lignées :`}</b> ${tr`les Augmentés ${sigle('tech')} battent les Résonants ${sigle('reso')}, les Résonants battent les Génés ${sigle('bio')}, les Génés battent les Augmentés (+${Math.round((REGLES.bonusLignee - 1) * 100)} %). Sous le nom de l’ennemi, « Faible » et un symbole : la lignée qui le bat.`}</li>`
    + `<li><b>${tr`L’ennemi annonce son attaque`}</b> ${tr`en haut de l’écran : protège-toi ou finis-le avant.`}</li>`
    + `<li><b>${tr`Les traits`}</b> ${tr`des ennemis sont écrits sous leur nom (Blindé, Évanescent, Épines…) : touche-les pour lire ce qu’ils font. Les gardiens changent de gestes à mi-vie et appellent de l’aide.`}</li>`
    + `<li><b>${tr`Les conditions de salle`}</b> ${tr`(inondée, éboulis, brouillard…) s’affichent en haut, et sur la carte avant d’entrer.`}</li>`
    + `<li><b>${tr`Contre un groupe`}</b>${tr`, chaque ennemi annonce son geste sur sa vignette, en haut à droite. Touche une vignette pour viser cet ennemi : toute la chaîne le frappe, et s’il tombe, le reste de la chaîne passe au suivant.`}</li>`
    + `<li><b>${tr`Fuir :`}</b> ${tr`le bouton en haut à droite. L’attaque annoncée touche pendant la fuite (personne ne meurt), puis tu recules d’une salle sur la carte, ou tu remontes au district avec ${Math.round(DISTRICT.butinFuite * 100)} % du minerai et un peu plus de fatigue.`}</li>`
    + `<li><b>${tr`Le journal du combat`}</b> ${tr`(${ICO.journal} à côté de la pioche et de la défausse, ou la dernière ligne au-dessus de ta main) : les cartes jouées à chaque tour, le calcul de chaque dégât subi ou infligé, ta défausse et ta pioche. Les « ? » expliquent chaque terme.`}</li>`
    + `<li><b>${tr`La Dissonance :`}</b> ${tr`certains ennemis brouillent tes Fréquences. Au tour suivant, ni suite ni Écho ne résonne : mise sur la force brute ou la protection.`}</li></ol></div></section>`;
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
  // la Flèche (28 octobre 2026) : en plein ciel, sur une plateforme d'amarrage au-dessus des nuages
  const img = x.fleche ? fondFleche : x.pillage ? vignetteArchipel(ageArchipel(x.strate), x.pillage.cible) : fondCombat(x.strate);
  const salle = x.carte?.salles[x.carte.position]?.type;
  const t = performance.now() / 1000;
  const phase = (duree: number, decalage = 0) => `-${((t + decalage * duree) % duree).toFixed(2)}s`;
  let h = `<div class="fond-lieu ${x.fleche ? 'z-pillage z-fleche' : x.pillage ? 'z-pillage' : `z-${zone}`}${salle === 'gardien' || salle === 'elite' ? ' gardien' : ''}" aria-hidden="true"${img ? ` style="--decor:url(${img})"` : ''}>`
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
function plaqueIntention(s: CombatEtat, classe: string, icone: string, felureHtml: string, avant?: { html: string; delai: string }): string {
  const it = s.intention;
  let nom = '', quoi = '', val = '', unite = '', av = 1;
  // Brouillard : on sait ce que l'ennemi prépare, pas combien ni sur qui
  if (C_brume(s)) {
    nom = tr('Dans le brouillard');
    quoi = it.type === 'atk' ? tr('Cible inconnue') : it.type === 'dissonance' ? tr('Ni suite ni Écho au tour suivant') : GENRE_INTENTION[it.type] ?? '';
    if (it.type !== 'dissonance') { val = '?'; unite = it.type === 'atk' || it.type === 'boost' ? tr('dégâts') : it.type === 'soin' ? 'PV' : 'bouclier'; }
    return `<div class="intention plaque-int ${classe} brume" aria-live="polite" aria-label="${echap(tr`Brouillard : ${GENRE_INTENTION[it.type]}, force et cible cachées.`)}">`
      + `<span class="int-ico">${icone}</span>`
      + `<span class="int-corps" aria-hidden="true"><small class="int-nom">${nom}</small><span class="int-quoi">${it.type === 'atk' ? '<i class="int-fleche"></i>' : ''}${quoi}</span></span>`
      + (val ? `<span class="int-val" aria-hidden="true"><b>${val}</b><small>${unite}</small></span>` : '') + ensuite(s) + '</div>';
  }
  if (it.type === 'atk') {
    nom = it.nom;
    // le chiffre que prendra vraiment la cible : avantage de lignée compris, comme sur sa vignette
    av = avantageAnnonce(s);
    val = String(Math.round(it.v * puissance(s.ennemi) * usureCombat(s).attaque * av));
    unite = av > 1 ? tr('dégâts · lignée') : tr('dégâts');
    if (it.zone) quoi = `<span class="int-qui">${s.porteurs.filter((p) => p.pv > 0).map((p) => { const im = portrait(p.id); return im ? `<img src="${im}" alt="" style="--c:${COULEUR[porteurDef(p.id).lignee]}">` : ''; }).join('')}</span>${tr`Tous`}`;
    else if (it.cibleId) {
      const d = porteurDef(it.cibleId), im = portrait(it.cibleId);
      // le nom n'est plus écrit : le portrait suffit, et la marque sur sa carte dit le reste (27 octobre 2026)
      quoi = im ? `<span class="int-qui">${`<img src="${im}" alt="" style="--c:${COULEUR[d.lignee]}">`}</span>` : echap(d.nom);
    } else quoi = '?';
  } else if (it.type === 'bouclier') { nom = it.allie ? tr('Couvre un allié') : tr('Se protège'); quoi = tr('Bouclier'); val = `+${it.v}`; unite = 'bouclier'; }
  else if (it.type === 'soin') { nom = it.nom; quoi = it.allie ? tr('Soigne un allié') : tr('Se répare'); val = `+${it.v}`; unite = 'PV'; }
  else if (it.type === 'appel') { nom = it.nom; quoi = it.rompu ? tr('Appel rompu') : tr('Un renfort va surgir'); }
  else if (it.type === 'boost') { nom = tr('Se concentre'); quoi = tr('Prochaine attaque'); val = '×2'; unite = tr('dégâts'); }
  else { nom = it.nom; quoi = tr('Ni suite ni Écho au tour suivant'); }
  return `<div class="intention plaque-int ${classe}${avant ? ' nait' : ''}"${avant ? avant.delai : ''} aria-live="polite" aria-label="${echap(texteIntention(s))}">`
    + `<span class="int-ico">${icone}</span>`
    + `<span class="int-corps" aria-hidden="true"><small class="int-nom">${echap(nom)}</small><span class="int-quoi">${it.type === 'atk' ? '<i class="int-fleche"></i>' : ''}${quoi}</span></span>`
    + (val ? `<span class="int-val${av > 1 ? ' alourdi' : ''}" aria-hidden="true"><b>${val}</b><small>${unite}</small></span>` : '')
    + ensuite(s) + felureHtml + (avant ? `<span class="plaque-fantome part"${avant.delai} aria-hidden="true">${avant.html}</span>` : '') + '</div>';
}

/** Un fondu en cours : le retard négatif qui garde l'animation à sa place d'un rendu à l'autre (comme les chiffres qui jaillissent) */
const DUREE_FONDU = 650;
function delaiFondu(ne: number | undefined): string {
  if (!ne) return '';
  const age = Date.now() - ne;
  return age < 0 || age >= DUREE_FONDU ? '' : ` style="animation-delay:-${Math.round(age)}ms"`;
}
/**
 * La Fêlure vient d'être brisée (12 novembre 2026, Bryan) : l'ancienne plaque de l'intention (« 17 ») se dissout par-dessus
 * la nouvelle (« 9 »), qui paraît en même temps. Rien d'autre ne s'ajoute sur l'ennemi.
 */
function plaqueAvant(e: Ecran): { html: string; delai: string } | undefined {
  const f = e.fondus?.felure;
  const delai = delaiFondu(f?.ne);
  if (!f || !delai || C_brume(f.avant)) return undefined;
  const it = f.avant.intention;
  const classe = it.type === 'atk' ? 'danger' : it.type === 'bouclier' || it.type === 'soin' ? 'garde' : 'boost';
  const icone = it.type === 'atk' ? ICO.atk : it.type === 'bouclier' ? ICO.bouclier : it.type === 'soin' ? ICO.soin : it.type === 'dissonance' ? ICO.flux : ICO.boost;
  return { delai, html: plaqueIntention(f.avant, classe, icone, f.avant.ennemi.felure === undefined ? '' : ligneFelure(f.avant, true, false)).replace(' aria-live="polite"', '') };
}

/**
 * La Fêlure, dite en clair sous l'intention (26 octobre 2026). Bryan : « je peux la casser avec la bonne carte, mais je ne
 * sais même pas ce qu'elle fait ». La ligne dit quelle carte poser et ce que ça change, chiffres à l'appui (10 → 8 dégâts, +1 Flux).
 */
function ligneFelure(s: CombatEtat, prevue: boolean, resonne: boolean): string {
  const en = s.ennemi, it = s.intention;
  if (en.felureBrisee) return `<span class="int-felure brisee"><span class="gemme">${ICO.fele}</span><span><b>${tr`Fêlure brisée`}</b> : ${it.type === 'atk' ? tr('son attaque est affaiblie') : it.type === 'bouclier' ? tr('son bouclier est affaibli') : it.type === 'soin' ? tr('son soin est affaibli') : tr('sans effet sur ce qu’il prépare')}</span></span>`;
  if (!felureVisible(en)) return `<span class="int-felure cachee"><span class="gemme">${ICO.fele}<b>?</b></span><span><b>${tr`Fêlure cachée`}</b> ${tr`: un évanescent ne montre pas la carte qui le brise`}</span></span>`;
  const f = en.felure!;
  // ce que la Fêlure retire, avec les mêmes arrondis que le moteur
  const reduit = (v: number) => Math.round(v * (1 - partFelure(en)));
  const force = it.type === 'atk' ? puissance(en) * usureCombat(s).attaque * avantageAnnonce(s) : 1;
  const chiffre = (v: number) => Math.round(v * force);
  const effet = it.type === 'atk' ? `${chiffre(it.v)} → <b>${chiffre(reduit(it.v))}</b><span class="fl-u"> ${tr`dégâts`}</span>`
    : it.type === 'bouclier' ? `${tr`bouclier +${it.v} →`} <b>+${reduit(it.v)}</b>`
    : it.type === 'soin' ? `${tr`soin +${it.v} →`} <b>+${reduit(it.v)}</b>`
    // en une ligne (combat sur téléphone), la phrase se cache : la gemme seule suffit (8 novembre 2026, après-midi)
    : `<span class="fl-mot">${tr`sans effet sur ce qu’il prépare`}</span>`;
  // le Flux en plus ne s'annonce que quand la chaîne posée fait une suite (3, 4, 5) : avant, la ligne dit juste ce que la carte brise
  const flux = prevue && resonne && s.flux < REGLES.fluxMax ? `, <b class="gain-flux">${tr`+${REGLES.felure.flux} Flux`}</b>` : '';
  return `<span class="int-felure${prevue ? ' prevue' : ''}" style="--fc:${couleurFrequence(f)}"><span class="gemme">${ICO.fele}<b>${f}</b></span>`
    // la phrase entière sur PC ; sur téléphone, seulement le chiffre (la gemme dit déjà quelle Fréquence) : combat.css, partie « la table »
    + `<span class="fl-txt"><span class="fl-mot">${prevue ? `<b>${tr`Ta chaîne la brise`}</b>` : `${tr`Pose un`} <b class="freq">${f}</b>`} : </span>${effet}${flux}</span></span>`;
}

/**
 * Le Flux en fiole de cristal (26 octobre 2026), à la place des trois losanges : Bryan les trouvait « jeu des années 90 ».
 * Un tube de verre fumé en trois chambres ; chaque point de Flux est une chambre emplie de lumière.
 */
/*
 * 3 novembre 2026 (Bryan : « le Flux est encore trop mal intégré », « chaque niveau dans une autre couleur pour montrer
 * immédiatement où on en est ») : trois cristaux, chacun de la couleur de son niveau (1 glace, 2 améthyste, 3 or, celui du
 * Coup d'éclat). Le chiffre et le nom prennent la couleur du niveau atteint.
 */
function jaugeFlux(flux: number): string {
  return `<div class="jauge-flux nf-${flux}${flux ? '' : ' vide'}" role="img" aria-label="${tr`Flux : ${flux} sur ${REGLES.fluxMax}`}">`
    + `<span class="jf-nom">${ICO.flux}${tr`Flux`}<b>${flux}</b><small>/ ${REGLES.fluxMax}</small></span>`
    + `<span class="jf-tube">${Array.from({ length: REGLES.fluxMax }, (_, i) => `<i class="n${i + 1}${i < flux ? ' plein' : ''}"></i>`).join('')}</span></div>`;
}
/** Le coût d'une action du Flux, sur son bouton : un petit cristal et le chiffre */
const coutFlux = (n: number) => `<span class="cout-flux" aria-hidden="true"><i></i>${n}</span>`;

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
    dire.push(tr`${a.degats} dégâts` + `${a.absorbe ? tr` (${a.absorbe} absorbés par son bouclier en plus)` : ''}`);
  }
  if (a.bouclier) { morceaux.push(`<span class="bl-garde">${ICO.bouclier}<b>+${a.bouclier}</b></span>`); dire.push(tr`bouclier +${a.bouclier}`); }
  if (a.soin) { morceaux.push(`<span class="bl-soin">${ICO.soin}<b>+${a.soin}</b></span>`); dire.push(tr`soin +${a.soin} PV`); }
  if (!morceaux.length) return '';
  const fatal = a.vaincus > 0;
  if (fatal) dire.push(a.vaincus > 1 ? tr`${a.vaincus} ennemis vaincus` : tr('ennemi vaincu'));
  return `<span class="bilan${fatal ? ' fatal' : ''}" role="status" aria-label="${echap(tr`Si tu lances : ${dire.join(', ')}`)}"><small aria-hidden="true">${fatal ? 'FATAL' : 'TOTAL'}</small>${morceaux.join('')}</span>`;
}

/**
 * Le nom d'un ennemi. Un garde de garnison (pillage, défi d'un quai) garde son nom de garde (« Garde résonant ») :
 * 12 novembre 2026, Bryan : un garde au visage inconnu s'appelait « Véla », comme si l'héroïne avait changé de camp.
 */
const nomBrut = (en: EnnemiEtat) => ennemiDef(en.id).nom;
/**
 * Deux ennemis du même nom dans un groupe (3 novembre 2026, Luc : « les deux Brigadiers portent le même nom tronqué,
 * impossible de savoir lequel est en grand ») : ils prennent un numéro, I, II, III, dans l'ordre du groupe.
 */
const ROMAINS = ['I', 'II', 'III', 'IV', 'V', 'VI'];
function numeroEnnemi(en: EnnemiEtat): string {
  if (!ETAT) return '';
  const nom = nomBrut(en);
  const memes = tousEnnemis(ETAT).filter((o) => nomBrut(o) === nom);
  if (memes.length < 2) return '';
  const i = memes.findIndex((o) => (o.rang ?? 0) === (en.rang ?? 0));
  return i < 0 ? '' : ROMAINS[i] ?? String(i + 1);
}
const nomEnnemi = (en: EnnemiEtat) => { const n = numeroEnnemi(en); return n ? `${nomBrut(en)} ${n}` : nomBrut(en); };
/** un garde de garnison prend un visage de garde de sa lignée (art.ts, visageGarnison), plus celui du Porteur qu'il sert */
function visageEnnemi(en: EnnemiEtat): string | null {
  if (!en.porteur) return illustrationEnnemi(en.id);
  const lignee = porteurDef(en.porteur).lignee;
  const memes = ETAT ? tousEnnemis(ETAT).filter((o) => o.porteur && porteurDef(o.porteur).lignee === lignee) : [];
  const variante = Math.max(0, memes.findIndex((o) => (o.rang ?? 0) === (en.rang ?? 0)));
  return visageGarnison(lignee, variante, en.porteur);
}

/**
 * La marque d'un Porteur visé (27 octobre 2026). Bryan : « si Ilka avait une marque visuelle, on verrait tout de suite
 * qu'elle est concernée ». Sur son portrait : le visage de chaque ennemi qui le frappe (en groupe) et les PV qu'il perdra,
 * bouclier déduit ; un bouclier qui prend tout le coup se lit en bleu.
 */
function texteCoups(s: CombatEtat, recus: CoupAttendu[], pv: number): string {
  const net = recus.reduce((t, c) => t + c.net, 0);
  const absorbe = recus.reduce((t, c) => t + c.absorbe, 0);
  const noms = [...new Set(recus.map((c) => c.rang))].map((r) => tousEnnemis(s).find((en) => (en.rang ?? 0) === r)).filter((en): en is EnnemiEtat => !!en).map(nomEnnemi);
  const nomsDits = enumerer(noms);
  if (net === 0 && absorbe > 0) return tr`${nomsDits} va frapper : le bouclier prend tout le coup.`;
  return tr`${nomsDits} va frapper : −${net} PV${absorbe ? tr` (${absorbe} pris par le bouclier)` : ''}${net >= pv ? tr(', à terre') : ''}.`;
}

/** Les tuiles de l'escouade affichées (par Porteur), pour l'appui long */
const TUILES = new Map<string, { nom: string; lignee: string; couleur: string; img: string | null | undefined; cadre: number; pv: number; pvMax: number; usure: number; coups: string }>();

/** L'appui long sur une tuile de l'escouade : son nom, sa lignée, ses PV et le coup qu'il va prendre */
export function loupePorteur(id: string): string | null {
  const t = TUILES.get(id);
  if (!t) return null;
  return `<div class="loupe" aria-hidden="true"><div class="loupe-porteur" style="--c:${t.couleur}">`
    + (t.img ? `<img src="${t.img}" alt="" style="object-position:50% ${t.cadre}%">` : '')
    + `<h3>${echap(t.nom)}</h3><span class="lp-lignee">${echap(t.lignee)}</span>`
    + `<span class="lp-pv">${t.pv} <small>${tr`/ ${t.pvMax} PV${t.usure ? tr` · Usure ${t.usure}` : ''}`}</small></span>`
    + (t.coups ? `<p>${echap(t.coups)}</p>` : '') + '</div></div>';
}

function marqueCoups(s: CombatEtat, recus: CoupAttendu[], pv: number): string {
  const net = recus.reduce((t, c) => t + c.net, 0);
  const absorbe = recus.reduce((t, c) => t + c.absorbe, 0);
  const groupe = enGroupe(s);
  const qui = [...new Set(recus.map((c) => c.rang))].map((r) => tousEnnemis(s).find((en) => (en.rang ?? 0) === r)).filter((en): en is EnnemiEtat => !!en);
  const visages = groupe ? qui.map((en) => { const im = visageEnnemi(en); return im ? `<img src="${im}" alt="">` : ''; }).join('') : '';
  const protege = net === 0 && absorbe > 0;
  const dit = texteCoups(s, recus, pv);
  return `<span class="marque-coups${protege ? ' protege' : ''}${net >= pv ? ' fatal' : ''}" role="img" aria-label="${echap(dit)}" title="${echap(dit)}">`
    + (visages ? `<span class="mc-qui">${visages}</span>` : protege ? ICO.bouclier : ICO.atk)
    + `<b>${protege ? '0' : `−${net}`}</b></span>`;
}

function vignettesGroupe(e: Ecran): string {
  const s = e.etat;
  if (!enGroupe(s)) return '';
  const verrou = e.verrou || s.issue !== 'en-cours';
  const avecGardien = tousEnnemis(s).some((en) => estGardien(en.id));
  return `<div class="groupe-ennemis${avecGardien ? ' avec-gardien' : ''}" role="group" aria-label="${tr`Le groupe : touche un ennemi pour le viser`}">` + tousEnnemis(s).map((en) => {
    const it = intentionDe(s, en);
    const vise = en === s.ennemi;
    const tombe = en.pv <= 0;
    const ill = visageEnnemi(en);
    const cache = C_brume(s);
    const val = cache ? (it.type === 'dissonance' ? '' : '?') : it.type === 'atk' ? String(Math.round(it.v * puissance(en) * usureCombat(s).attaque)) : it.type === 'bouclier' || it.type === 'soin' ? String(it.v) : it.type === 'boost' ? '×2' : '';
    const cls = it.type === 'atk' ? 'danger' : it.type === 'bouclier' || it.type === 'soin' ? 'garde' : 'boost';
    const ico = it.type === 'atk' ? ICO.atk : it.type === 'bouclier' ? ICO.bouclier : it.type === 'soin' ? ICO.soin : it.type === 'dissonance' ? ICO.flux : ICO.boost;
    const traits = traitsEnJeu(en).map((t) => texteTrait(t).nom);
    const nom = nomEnnemi(en);
    const label = tombe ? tr`${nom}, hors de combat` : tr`${vise ? tr('Visé : ') : tr('Viser ')}${nom}${traits.length ? ` (${traits.join(', ')})` : ''}, ${en.pv} PV sur ${en.pvMax}. ${cache ? tr`${GENRE_INTENTION[it.type]}, force et cible cachées par le brouillard.` : texteIntention(s, en)}`;
    return `<button type="button" class="vignette-ennemi l-${ligneeEnnemi(en)}${estGardien(en.id) ? ' gardien' : ''}${vise ? ' visee' : ''}${tombe ? ' tombe' : ''}" data-action="viser" data-id="${en.rang ?? 0}" aria-label="${echap(label)}" title="${echap(label)}" aria-pressed="${vise}"${verrou || tombe || vise ? ' disabled' : ''}>`
      + (ill ? `<img src="${ill}" alt="" decoding="async">` : '<span class="vg-sans"></span>')
      + (tombe ? '' : `<span class="vg-int ${cls}${cache ? ' brume' : ''}">${ico}${val ? `<b>${val}</b>` : ''}</span>`)
      + (tombe || cache || !en.felure ? '' : !felureVisible(en) ? `<span class="vg-felure" aria-hidden="true">${ICO.fele}<b>?</b></span>` : `<span class="vg-felure${en.felureBrisee ? ' brisee' : feluresPrevues(s).has(en) ? ' prevue' : ''}" style="--fc:${couleurFrequence(en.felure)}" aria-hidden="true">${ICO.fele}<b>${en.felure}</b></span>`)
      + (avecGardien ? `<span class="vg-nom"><span>${echap(nomBrut(en))}</span>${numeroEnnemi(en) ? `<b>${numeroEnnemi(en)}</b>` : ''}</span>` : !tombe && numeroEnnemi(en) ? `<span class="vg-num" aria-hidden="true">${numeroEnnemi(en)}</span>` : '')
      // l'ennemi visé porte un bandeau « VISÉ » (3 novembre 2026) : le repère lumineux seul se perdait hors de l'écran
      + (vise && !tombe ? `<span class="vg-vise" aria-hidden="true">${tr`Visé`}</span>` : '')
      + `<span class="vg-vie"><i style="width:${Math.max(0, Math.round((100 * en.pv) / en.pvMax))}%"></i></span>`
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
    ? `<img class="vg-cran${en.phase2 ? ' franchi' : en.pv / en.pvMax <= ph.seuil + 0.12 ? ' proche' : ''}" src="${artGardien('cran')}" alt="" style="--s:${ph.seuil}" title="${en.phase2 ? tr('Seconde phase en cours') : tr('Seuil de la seconde phase')}">`
    : '';
  // 3ᵉ phase (28 octobre 2026) : un second cran, au dernier quart
  const s3 = REGLES.troisiemePhase.seuil;
  const cran3 = en.phase3 && !en.simple
    ? `<img class="vg-cran${en.phase3Active ? ' franchi' : en.phase2 && en.pv / en.pvMax <= s3 + 0.12 ? ' proche' : ''}" src="${artGardien('cran')}" alt="" style="--s:${s3}" title="${en.phase3Active ? tr('Dernière phase en cours') : tr('Seuil de la dernière phase')}">`
    : '';
  return `<div class="vie-ennemi vie-gardien"><span class="vg-barre" style="--cadre:url(${artGardien('barre')})">`
    + `<span class="vg-rainure">${jauge('je', en.pv, en.pvMax, { trace: e.traces?.ennemi, pas: 10, bouclier: en.bouclier })}</span>${cran}${cran3}</span>`
    + `<span class="je-valeur"><b data-compte="pv-ennemi-${en.rang ?? 0}" data-v="${en.pv}">${en.pv}</b><small>/ ${en.pvMax}</small></span></div>`;
}

export function htmlCombat(e: Ecran): string {
  return htmlLieu(e.x) + htmlEcranCombat(e);
}

/** les illustrations déjà demandées au navigateur (3 novembre 2026 : la main s'affichait noire une seconde au premier combat) */
const PRECHARGEES = new Set<string>();
function prechargerCartes(cartes: (string | undefined)[]) {
  prechargerUrls(cartes.map((c) => (c ? illustrationModule(c) : null)));
}
function prechargerUrls(urls: (string | null)[]) {
  for (const url of urls) {
    if (!url || PRECHARGEES.has(url)) continue;
    PRECHARGEES.add(url);
    const img = new Image();
    img.decoding = 'async';
    img.src = url;
  }
}

function htmlEcranCombat(e: Ecran): string {
  const s = e.etat;
  // toute la pioche se télécharge d'avance : les cartes tirées ensuite s'affichent tout de suite
  prechargerCartes([...s.main, ...s.pioche, ...s.defausse].map((g) => g.carte));
  // le combat de la chambre : le district se télécharge pendant ce temps (il arrivait d'abord sur une mer vide)
  if (e.x.tutoriel) { const sc = sceneDistrict(1); prechargerUrls([sc.url, sc.mer]); }
  ETEINTS = new Set(s.porteurs.filter((p) => p.pv <= 0).map((p) => p.id));
  ETAT = s;
  const def = ennemiDef(s.ennemi.id);
  const it = s.intention;
  const lig = ligneeEnnemi(s.ennemi);
  const faible = BATTU_PAR[lig];
  // Fréquences brouillées : la suite ne compte pas (même règle que le moteur), ni badge ni multiplicateur affiché
  const brut = analyserChaine(s.chaine);
  const a = s.dissonance || s.sansResonance ? { ...brut, suite: 0, mult: 1 } : brut;
  const dernier = s.chaine[s.chaine.length - 1];
  const libres = placesLibres(s);
  const verrou = e.verrou || s.issue !== 'en-cours';
  const fs = frequencesEffectives(s.chaine);
  // les aides aux suites : au combat guidé et dans les premières Strates seulement (REGLES.aideSuitesJusqua)
  const aide = !!e.x.tutoriel || (!e.x.pillage && !e.x.fleche && !e.x.epreuve && e.x.strate <= REGLES.aideSuitesJusqua);

  let conseil: string;
  if (mainBloquee(s)) conseil = `${tr`Aucune carte ne peut entrer dans la chaîne :`} <b>${tr`passe ton tour`}</b>${s.flux >= 1 ? `${tr`, ou dépense 1 Flux pour`} <b>${tr`repiocher`}</b>` : ''}.`;
  else if (s.sansResonance) conseil = `<b>${tr`Épreuve · Fréquences brouillées`}</b> ${tr`: aucune Résonance de tout le combat. Les Échos (trois Fréquences identiques) comptent toujours.`}`;
  else if (s.monoLignee && !s.chaine.length) conseil = `<b>${tr`Épreuve · Une seule voix`}</b> ${tr`: chaque chaîne ne joue qu’une lignée. Les cartes du district vont avec toutes.`}`;
  else if (s.sansChute && !s.chaine.length) conseil = `<b>${tr`Épreuve · Nul ne reste au fond`}</b> ${tr`: si un Porteur tombe, l’Épreuve est perdue. Protège le plus exposé.`}`;
  else if (s.dissonance && !s.chaine.length) conseil = `<b>${tr`Fréquences brouillées`}</b> ${tr`: ni Résonance ni Écho ce tour-ci. Mise sur la force brute ou la protection.`}`;
  // le gardien parle (campagne.ts) : à la place du conseil, tant que la chaîne est vide
  // la bulle d'aide du groupe (3 novembre 2026, Luc : « rien ne dit qu'on peut toucher les vignettes ») : jusqu'au premier ennemi visé
  else if (enGroupe(s) && !e.viserAppris && !s.chaine.length) conseil = `<span class="bulle-viser" role="note">${tr`Touche un ennemi en haut pour le viser : toute ta chaîne le frappe`}</span>`;
  else if (e.parole && !s.chaine.length) conseil = `<span class="parole-gardien" role="status"><b>${echap(e.parole.nom)}</b>« ${echap(e.parole.texte)} »</span>`;
  else if (!s.chaine.length) conseil = `${tr`Pose jusqu’à ${capacite(s)} cartes :`} <b>${tr`trois`}</b> ${tr`Fréquences qui se suivent (3, 4, 5) font une`} <b>${tr`Résonance`}</b>.`;
  else {
    const fin = serieFinale(s.chaine);
    const f = fs[fs.length - 1]!;
    // chaîne pleine : une place de plus ne s'achète qu'avec le Flux
    const flux = s.flux > 0 && capacite(s) < REGLES.capaciteMax;
    if (s.dissonance) conseil = `<b>${tr`Fréquences brouillées`}</b> ${tr`: ni Résonance ni Écho ce tour-ci`}`;
    else if (a.suite >= 3) conseil = `<b>${tr`Résonance`}</b> ${tr`: suite de ${a.suite}, effets`} <b>+${Math.round((a.mult - 1) * 100)} %</b>` + (aide && a.suite < 5 && fin === a.suite && (libres > 0 || flux) ? (libres > 0 ? ` ${tr`· un`} <b>${f + 1}</b> ${tr`pour aller plus loin`}` : ` ${tr`· chaîne pleine : un`} <b>${f + 1}</b> ${tr`avec une place de Flux`}`) : '');
    // passé les premières Strates, le conseil dit où en est la chaîne, sans souffler la carte suivante
    else if (!aide) conseil = libres === 0 ? (fin === 2 ? tr('Chaîne pleine : suite de 2, pas de Résonance') : flux ? tr('Chaîne pleine : lance-la, ou dépense 1 Flux pour une place de plus') : tr('Chaîne pleine : tu peux la lancer')) : fin === 2 ? tr('Suite en cours') : '';
    else if (libres === 0 && fin === 2 && flux) conseil = `${tr`Suite ${f - 1} → ${f} : 1 Flux t’ouvre une place pour un`} <b>${f + 1}</b>`;
    // une suite de 2 ne résonne pas (test critique du 4 novembre 2026 : 7 → 8 avec une carte de 2 places, chaîne pleine, aucun bonus, rien ne le disait)
    else if (libres === 0 && fin === 2) conseil = `${tr`Chaîne pleine :`} <b>${tr`suite de 2 seulement`}</b>${tr`, pas de Résonance (il en faut 3)`}`;
    else if (libres === 0) conseil = flux ? tr('Chaîne pleine : lance-la, ou dépense 1 Flux pour une place de plus') : tr('Chaîne pleine : tu peux la lancer');
    // au sommet des Fréquences, seul l'Écho reste possible : on dit combien il manque de cartes, pas plus
    else if (f >= FREQ_MAX) {
      const n = fs.filter((x) => x === f).length;
      conseil = a.echo ? '' : n >= 2 ? `${tr`Encore un`} <b>${f}</b> ${tr`pour un`} <b>${tr`Écho`}</b>` : `${tr`${f} : pas de suite au-delà · deux autres ${f} pour un`} <b>${tr`Écho`}</b>`;
    }
    else if (fin === 2) conseil = `${tr`Suite ${f - 1} → ${f} : ajoute un`} <b>${f + 1}</b> ${tr`pour +40 %`}`;
    else conseil = `${tr`Ajoute un`} <b>${f + 1}</b> ${tr`pour commencer une suite`}`;
    if (a.echo) { const n = a.echoN ?? 3; conseil = (conseil ? `${conseil} · ` : '') + `<b>${nomEcho(n)}</b> ${tr`: les ${n === 5 ? tr('cinq') : n === 4 ? tr('quatre') : tr('trois')} ${a.echoF}`} <b>${pctEcho(n)}</b>` + (n === 5 ? tr(' et +1 Flux') : ''); }
    if (dernier?.effet) conseil += `<span class="effet-texte">${echap(libelleEffet(dernier.effet))}</span>`;
  }

  // pendant l'animation : la carte qui agit, puis la riposte de l'ennemi
  const enJeu = e.actif !== undefined ? s.chaine[e.actif] : undefined;
  if (enJeu) {
    const qui = enJeu.porteur ? porteurDef(enJeu.porteur).nom : tr('District');
    conseil = `<span class="pas-chaine">${e.actif! + 1} / ${s.chaine.length}</span><span class="carte-agit" style="--c:${COULEUR[ligneeGeste(enJeu)]}">${echap(enJeu.nom)}</span> · ${echap(qui)}`
      + (a.suite >= 3 ? ` ${tr`· Résonance`} <b>×${a.mult.toLocaleString(locale()).replace(/\u202f/g, '\u00a0')}</b>` : '');
  } else if (e.verrou && !s.chaine.length && s.issue === 'en-cours' && s.ennemi.pv > 0) conseil = enGroupe(s) ? tr('Le groupe riposte…') : `${echap(nomEnnemi(s.ennemi))} riposte…`;

  const ill = visageEnnemi(s.ennemi);
  const classeIntention = it.type === 'atk' ? 'danger' : it.type === 'bouclier' || it.type === 'soin' ? 'garde' : 'boost';
  const iconeIntention = it.type === 'atk' ? ICO.atk : it.type === 'bouclier' ? ICO.bouclier : it.type === 'soin' ? ICO.soin : it.type === 'dissonance' ? ICO.flux : ICO.boost;
  const lieu = e.x.tutoriel ? tr('Chambre scellée') : e.x.fleche ? tr`La Flèche · ${e.x.fleche.defi ? tr('défi du ') : ''}quai ${e.x.fleche.quai}` : e.x.pillage ? tr`Pillage · ${e.x.pillage.nom}` : tr`Strate −${e.x.strate}`;

  // la Fêlure de l'ennemi visé : la Fréquence qui brise son intention (cachée par le brouillard tant que la chaîne est vide)
  const brume = C_brume(s);
  const felF = !brume && s.ennemi.pv > 0 && !s.ennemi.felureBrisee && felureVisible(s.ennemi) ? s.ennemi.felure : undefined;
  const prevue = felF !== undefined && fs.includes(felF);
  const felureHtml = s.ennemi.felure === undefined || brume || s.ennemi.pv <= 0 ? '' : ligneFelure(s, prevue, a.suite >= 3);
  // une carte brise une Fêlure, celle du visé d'abord, sinon celle d'un autre ennemi du groupe (28 octobre 2026)
  const prevues = feluresPrevues(s);
  const fels = brume ? [] : tousEnnemis(s).filter((en) => en.pv > 0 && !en.felureBrisee && felureVisible(en) && en.felure !== undefined && !prevues.has(en)).map((en) => en.felure!);
  const brise = (g: Geste) => fels.length > 0 && !frequenceLibre(g.effet) && (g.fs ?? [g.f]).some((f) => fels.includes(f));

  // combat guidé : ce que la leçon du tour désigne du doigt
  const guide = !!e.lecon && !verrou;
  const derniereF = fs[fs.length - 1];
  const viseF = guide && s.tour === 2 ? (!s.chaine.length ? 3 : derniereF !== undefined && derniereF >= 3 && derniereF < 5 && serieFinale(s.chaine) === derniereF - 2 ? derniereF + 1 : null) : null;
  const vise = (g: Geste) => guide && ((s.tour === 1 && libres > 0) || (s.tour === 2 && g.f === viseF) || (s.tour === 3 && g.type === 'bouclier' && libres > 0));
  const lancerVise = guide && s.chaine.length > 0 && (libres === 0 || (s.tour === 2 && a.suite >= 3));

  let h = `<div class="ecran ecran-jeu ecran-combat${verrou ? ' verrouille' : ''}${guide ? ` guide lecon-t${Math.min(s.tour, 4)}` : ''}">`;
  h += `<header class="combat-barre"><div class="puces">${e.x.fleche ? `<span class="puce">${ICO.fleche}<span class="puce-mot">${tr`Flèche · quai`} </span>${e.x.fleche.quai}</span>` : e.x.pillage ? `<span class="puce">${ICO.grappin}<span class="puce-mot">${tr`Pillage ·`} </span>${echap(e.x.pillage.nom)}</span>` : `<span class="puce">${ICO.strate}${e.x.tutoriel ? lieu : `<span class="puce-mot">${tr`Strate`} </span>−${e.x.strate}`}</span>`}`
    + (e.x.tutoriel || e.x.pillage || e.x.fleche ? '' : e.x.carte ? `<span class="puce">${e.x.carte.salles[e.x.carte.position]?.type === 'gardien' ? tr('Gardien') : e.x.carte.salles[e.x.carte.position]?.type === 'elite' ? tr('Salle scellée') : `Combat ${(e.x.gagnes ?? 0) + 1}`}</span>` : `<span class="puce">${tr`Combat ${e.x.index + 1}/${e.x.sequence.length}`}</span>`)
    + `<span class="puce">${tr`Tour ${s.tour}`}</span>`
    // 31 octobre 2026 (Bryan : « quand on fait le combat, on voit rien ») : la marque de la quête se voit aussi pendant le combat
    + (e.x.carte?.salles[e.x.carte.position]?.quete && queteDef(e.x.strate) ? `<span class="puce condition quete" tabindex="0" title="${echap(tr`${queteDef(e.x.strate)!.nom} : gagne ce combat pour relever la marque de la quête.`)}" aria-label="${echap(tr`Marque de la quête ${queteDef(e.x.strate)!.nom} : gagne ce combat pour la relever`)}">${ICO.quete}<span class="puce-mot">${tr`Quête`}</span></span>` : '')
    + (s.condition && CONDITIONS[s.condition] ? `<span class="puce condition" tabindex="0" title="${echap(CONDITIONS[s.condition]!.texte)}" aria-label="${echap(`${CONDITIONS[s.condition]!.nom} : ${CONDITIONS[s.condition]!.texte}`)}">${ICO.cristal}${echap(CONDITIONS[s.condition]!.nom)}</span>` : '')
    + `</div>`
    + `<div class="boutons-barre">${peutFuir(e.x) && s.issue === 'en-cours' ? `<button type="button" class="btn-fuir" data-action="fuir" aria-expanded="${!!e.fuite}" aria-label="${tr`Fuir le combat`}"${verrou ? ' disabled' : ''}>${ICO.retour}<span>${tr`Fuir`}</span></button>` : ''}<button type="button" class="btn-icone" data-action="son" aria-pressed="${sonActif()}" aria-label="${sonActif() ? tr('Couper le son') : tr('Activer le son')}">${sonActif() ? ICONE_SON : ICONE_MUET}</button>`
    + `<button type="button" class="btn-icone" data-action="regles" aria-expanded="${e.regles}" aria-label="${tr`Règles`}">${ICO.aide}</button></div></header>`;

  const enJeuTraits = traitsEnJeu(s.ennemi);
  const fonduFissure = delaiFondu(e.fondus?.fissure);
  const fissurePrevue = !s.ennemi.fissure && s.ennemi.pv > 0 && s.chaine.some((g) => g.effet?.type === 'fissure' || g.effet2?.type === 'fissure') ? apercuChaine(s).fissure : 0;
  // l'Assimilation dit la lignée prise, dans sa couleur (28 octobre 2026) : on voit le changement sans lire le journal
  const marques = (enJeuTraits.length ? enJeuTraits.map((t) => {
    const x = texteTrait(t);
    const pris = t.type === 'assimilation' && s.ennemi.assimile ? NOMS_LIGNEE[s.ennemi.assimile].court : '';
    return `<span class="trait${pris ? ' assimile' : ''}" tabindex="0" title="${echap(x.texte)}" aria-label="${echap(`${x.nom}${pris ? ` (devenu ${pris})` : ''} : ${x.texte}`)}"${pris ? ` style="--c:${COULEUR[s.ennemi.assimile!]}"` : ''}>${echap(x.nom)}${pris ? ` · ${echap(pris)}` : ''}</span>`;
  }).join('') : '')
    + (s.ennemi.bouclier ? `<span class="etat garde">${ICO.bouclier}${s.ennemi.bouclier}</span>` : '')
    // la Fissure vient d'être posée : la pastille en pointillés se dissout, celle en or paraît (12 novembre 2026, Bryan : « moins kitsch »)
    + (s.ennemi.fissure ? `<span class="fondu"><span class="etat fissure${fonduFissure ? ' nait' : ''}"${fonduFissure} tabindex="0" title="${tr`Fissure : il subit ${Math.round(s.ennemi.fissure * 100)} % de dégâts en plus`}">${ICO.fissure}${tr`Fissure +${Math.round(s.ennemi.fissure * 100)} % dégâts`}</span>${fonduFissure ? `<span class="etat fissure prevue part"${fonduFissure} aria-hidden="true">${ICO.fissure}${tr`Fissure +${Math.round(s.ennemi.fissure * 100)} % dégâts`}</span>` : ''}</span>`
      // la chaîne posée va le fissurer : la marque s'annonce déjà, en pointillés (12 novembre 2026)
      : fissurePrevue ? `<span class="etat fissure prevue" tabindex="0" title="${tr`Ta chaîne va le fissurer : il subira ${Math.round(fissurePrevue * 100)} % de dégâts en plus`}">${ICO.fissure}${tr`Fissure +${Math.round(fissurePrevue * 100)} % dégâts`}</span>` : '');

  // la scène de l'ennemi
  // un gardien (27 octobre 2026) : son nom dans une plaque peinte, sa vie dans une barre ornée avec le cran de sa seconde phase
  const gardien = estGardien(def.id) && !s.ennemi.porteur;
  // l'arène (7 novembre 2026, Bryan) : l'illustration de l'ennemi descend en fond jusqu'à la ligne de l'escouade, la chaîne
  // se pose au milieu comme une table ; l'escouade, le Flux et la main viennent dessous (sur PC, l'arène s'efface : display:contents)
  h += `<div class="arene"${ill ? ` style="--art:url(${ill})"` : ''}>`;
  h += `<section class="scene-ennemi l-${lig}${gardien ? ' gardien' : ''}${enGroupe(s) ? ' en-groupe' : ''}${s.ennemi.pv > 0 && s.ennemi.pv / s.ennemi.pvMax <= 0.25 ? ' fele' : ''}" style="--fond:${FONDS[def.id] ?? '#2A2438'};--ng:${tousEnnemis(s).length}" aria-label="${tr`Ennemi`}">`
    + (ill ? `<img class="ennemi-art${portraitProvisoire(def.id) ? ' provisoire' : ''}${s.issue === 'victoire' && !s.enfui ? ' dissous' : ''}${s.ennemi.porteur ? ' garde' : ''}" src="${ill}" alt="" decoding="async">` : `<span class="ennemi-art sans" aria-hidden="true"></span>`)
    + (s.ennemi.pv > 0 && s.ennemi.pv / s.ennemi.pvMax <= 0.25 ? '<span class="fele-trait" aria-hidden="true"></span>' : '')
    + `<span class="scene-voile" aria-hidden="true"></span>`

    + vignettesGroupe(e)
    + plaqueIntention(s, classeIntention, iconeIntention, felureHtml, plaqueAvant(e))
    + `<div class="ennemi-infos"><div class="tags"><span class="tag" style="--c:${COULEUR[lig]}">${echap(e.x.fleche ? tr`GARDIENS · QUAI ${e.x.fleche.quai}` : e.x.pillage ? tr`GARNISON · ${e.x.pillage.nom}` : def.tag)}</span><span class="faible" style="--c:${COULEUR[faible]}" tabindex="0" role="img" title="${tr`Point faible : les cartes ${NOM_LIGNEES[faible]} lui font +${Math.round((REGLES.bonusLignee - 1) * 100)} %`}" aria-label="${tr`Faible contre les ${NOM_LIGNEES[faible]}`}"><span class="faible-mot" aria-hidden="true">${tr`Faible`}</span>${sigle(faible)}</span>`
      // le Rôdeur (explorer.ts) : il s'enfuit à la fin de son dernier tour ; le compte à rebours reste sous les yeux
      // Épreuve « Avant l'extinction » : les tours qui restent pour abattre le gardien
      + (s.chrono && s.issue === 'en-cours' ? `<span class="fuyard chrono" title="${tr`Passé le tour ${s.chrono}, l’Épreuve est perdue.`}">${ICO.griffes}${s.tour >= s.chrono ? tr('Dernier tour !') : tr`S’éteint dans ${s.chrono - s.tour + 1} tours`}</span>` : '')
      + (s.fuyard && s.issue === 'en-cours' ? `<span class="fuyard" title="${tr`Il s’enfuit à la fin de son tour ${s.fuyard}. Ses blessures resteront.`}">${ICO.griffes}${s.tour >= s.fuyard ? tr('S’enfuit à la fin du tour') : tr`S’enfuit dans ${s.fuyard - s.tour + 1} tours`}</span>` : '')
      // le combat qui s'éternise (3 novembre 2026, usure dès le tour 12) : on le voit venir, puis on voit de combien l'ennemi frappe plus fort
      + (s.issue === 'en-cours' ? (() => {
        const u = REGLES.usure, m = usureCombat(s).attaque, reste = u.attaqueDes - s.tour;
        const titre = tr`Combat qui s’éternise : à partir du tour ${u.attaqueDes}, l’ennemi frappe ${Math.round(u.attaqueParTour * 100)} % plus fort à chaque tour.`;
        return m > 1 ? `<span class="fuyard" title="${titre}">${ICO.griffes}${tr`Enragé +${Math.round((m - 1) * 100)} %`}</span>`
          : reste <= 3 ? `<span class="fuyard" title="${titre}">${ICO.griffes}${tr`S’enrage dans ${reste} tour${reste > 1 ? 's' : ''}`}</span>` : '';
      })() : '')
      + `</div>`
    + (gardien ? plaqueGardien(def.nom, nomPhase(s.ennemi))
      : `<h2 class="ennemi-nom">${echap(nomEnnemi(s.ennemi))}${nomPhase(s.ennemi) ? ` <small class="phase">· ${echap(nomPhase(s.ennemi))}</small>` : ''}</h2>`)
    // les traits et les états passagers (bouclier, Fissure) sur la même ligne : la scène reste basse sur téléphone
    + (marques ? `<div class="traits">${marques}</div>` : '')
    + (gardien ? vieGardien(e)
      : `<div class="vie-ennemi">${jauge('je', s.ennemi.pv, s.ennemi.pvMax, { trace: e.traces?.ennemi, pas: 10, bouclier: s.ennemi.bouclier })}<span class="je-valeur"><b data-compte="pv-ennemi-${s.ennemi.rang ?? 0}" data-v="${s.ennemi.pv}">${s.ennemi.pv}</b><small>/ ${s.ennemi.pvMax}</small></span></div>`)
    + `</div></section>`;

  // l'escouade : construite à part, elle vient sous la table
  const avantEscouade = h.length;
  h += '<section class="escouade-combat" aria-label="Escouade">';
  const coups = coupsAttendus(s);
  // Protégé : quand les attaques annoncées touchent plusieurs Porteurs, le bouclier couvre d'abord celui-ci ; un toucher sur une tuile le change
  // (seulement s'il y a du bouclier, posé ou dans la chaîne : sans bouclier, rien à répartir)
  const zone = !verrou && protectionUtile(s) && s.bouclier + apercuChaine(s).bouclier > 0;
  const protege = zone ? protegeDe(s) : undefined;
  // un soin à un seul Porteur dans la chaîne : toucher une tuile y envoie les soins
  const soins = !verrou && s.chaine.some(soigneUnSeul);
  // le bouclier de l'escouade, sur le portrait de celui qu'il couvre en premier (7 novembre 2026) : posé, et ce que la chaîne ajoute
  const ajoutBouclier = s.chaine.length && !verrou ? apercuChaine(s).bouclier : 0;
  const porteBouclier = s.bouclier + ajoutBouclier > 0 ? protegeDe(s) : undefined;
  for (const p of s.porteurs) {
    const d = porteurDef(p.id);
    const ko = p.pv <= 0;
    // les coups annoncés sur lui, calculés par le moteur (bouclier, Fêlure, chaîne posée compris)
    const recus = ko ? [] : coups.get(p.id) ?? [];
    const cible = recus.length > 0;
    const perte = recus.reduce((t, c) => t + c.net, 0);
    const img = portrait(d.id);
    const basPv = !ko && p.pv / p.pvMax <= 0.3;
    const soigne = !ko && s.chaine.some((g) => soigneUnSeul(g) && g.cible === p.id);
    const couvert = !ko && p.id === protege;
    const lignee = ko ? tr('À terre') : NOMS_LIGNEE[d.lignee].nom;
    const dit = `${d.nom}, ${lignee}, ${ko ? tr('à terre') : tr`${p.pv} PV sur ${p.pvMax}${p.usure ? tr`, l’Usure en retire ${p.usure}` : ''}`}`;
    TUILES.set(p.id, { nom: d.nom, lignee, couleur: COULEUR[d.lignee], img, cadre: cadragePortrait(d.id), pv: ko ? 0 : p.pv, pvMax: p.pvMax, usure: p.usure ?? 0, coups: cible ? texteCoups(s, recus, p.pv) : '' });
    h += `<div class="combattant${ko ? ' ko' : ''}${cible ? ' cible' : ''}${cible && perte >= p.pv ? ' fatal' : ''}${basPv ? ' bas' : ''}${soigne ? ' soigne' : ''}${couvert ? ' couvert' : ''}" data-porteur="${p.id}" data-pvmax="${p.pvMax}"${!ko && (zone || soins) ? ` data-action="${zone && soins ? 'tuile' : zone ? 'proteger' : 'soigner'}" data-id="${p.id}" role="button" tabindex="0"` : ' role="group"'} aria-label="${echap(dit + (couvert ? tr(', le bouclier le couvre en premier') : '') + (ko ? '' : zone && soins ? tr(', toucher pour le protéger ou le soigner') : zone && !couvert ? tr(', toucher pour que le bouclier le couvre en premier') : soins && !soigne ? tr(', toucher pour lui envoyer les soins') : ''))}" style="--c:${COULEUR[d.lignee]}">`
      + (img ? `<span class="cb-fond" style="background-image:url(${img});--cadre:${cadragePortrait(d.id)}%" aria-hidden="true"></span>` : `<span class="cb-fond sans-portrait" aria-hidden="true">${echap(d.nom.charAt(0))}</span>`)
      + `<div class="cb-vie" aria-hidden="true"><span class="chiffre"><span data-compte="pv-${p.id}" data-v="${ko ? 0 : p.pv}">${ko ? '0' : p.pv}</span><small>/ ${p.pvMax}</small></span>${jauge('jp', p.pv, p.pvMax, { trace: e.traces?.[p.id], pas: 5, ...(p.usure ? { usure: p.usure } : {}), ...(perte && !verrou ? { perte } : {}) })}</div>`
      + (cible && !verrou ? marqueCoups(s, recus, p.pv) : '') + (soigne ? `<span class="marque-soin" aria-label="${tr`Sera soigné`}">${ICO.soin}</span>` : '')
      + (!ko && p.id === porteBouclier ? `<span class="ecu-tuile${ajoutBouclier ? ' ajout' : ''}" aria-label="${echap(`Bouclier ${s.bouclier}${ajoutBouclier ? tr`, ${s.bouclier + ajoutBouclier} après la chaîne` : ''}`)}"><svg viewBox="0 0 24 28" aria-hidden="true"><path d="M12 1 L22 5 V13 C22 20 17 25 12 27 C7 25 2 20 2 13 V5 Z"/></svg><b data-compte="bouclier" data-v="${s.bouclier}">${s.bouclier}</b>${ajoutBouclier ? `<small>+${ajoutBouclier}</small>` : ''}</span>` : couvert ? `<span class="marque-protege" aria-hidden="true">${ICO.bouclier}</span>` : '')
      // le petit choix, quand il y a à la fois du bouclier et des soins à répartir
      + (!ko && zone && soins && e.tuile === p.id ? `<div class="tuile-choix" role="group" aria-label="${echap(d.nom)}">`
        + `<button type="button" data-action="proteger" data-id="${p.id}" aria-pressed="${couvert}"${couvert ? ' class="pris"' : ''}>${ICO.bouclier}<span>${tr`Protéger`}</span></button>`
        + `<button type="button" data-action="soigner" data-id="${p.id}" aria-pressed="${soigne}"${soigne ? ' class="pris"' : ''}>${ICO.soin}<span>${tr`Soigner`}</span></button></div>` : '')
      + `</div>`;
  }
  // le bouclier se lit sur le portrait du Porteur qu'il couvre (7 novembre 2026) : la ligne ne garde que ce qui n'a pas d'autre place
  h += `</section><div class="ligne-escouade${s.ombre ? '' : ' vide'}"><span class="etat garde${s.bouclier ? ' actif' : ''}">${ICO.bouclier}${tr`Bouclier ${s.bouclier}`}</span>${s.ombre ? `<span class="etat ombre actif">${ICO.eclat}${tr`Ombre agissante`}</span>` : ''}</div>`;
  const escouade = h.slice(avantEscouade);
  h = h.slice(0, avantEscouade);
  // les piles ouvrent le journal du combat (27 octobre 2026) : les cartes jouées tour par tour, la défausse et la pioche ;
  // elles prennent la place de la phrase du journal, en tête de la main (7 novembre 2026, Bryan : « la phrase ne sert à rien »)
  const piles = `<button type="button" class="piles" data-action="journal" data-id="cartes" aria-label="${echap(tr`Pioche ${s.pioche.length}, défausse ${s.defausse.length} : ouvrir le journal du combat`)}"${e.verrou ? ' disabled' : ''}><span>${ICO.cartes}<em>${tr`Pioche`}</em>${s.pioche.length}</span><span>${ICO.recycler}<em>${tr`Défausse`}</em>${s.defausse.length}</span><i class="piles-journal" aria-hidden="true">${ICO.journal}</i></button>`;

  // la chaîne
  const mult = a.suite >= 3 ? `×${a.mult.toLocaleString(locale()).replace(/\u202f/g, '\u00a0')}` : '';
  h += `<section class="zone-chaine${a.suite >= 3 ? ' resonne' : ''}" aria-label="${tr`Chaîne`}"><div class="chaine-tete"><span class="surtitre">${tr`CHAÎNE · ${placesPrises(s)} / ${capacite(s)}`}</span>`
    + (mult ? `<span class="badge-reso">${ICO.flux}${tr`RÉSONANCE ${mult}`}</span>` : a.suite === 2 ? `<span class="badge-reso faible">${tr`SUITE EN COURS`}</span>` : '')
    + (a.echo ? `<span class="badge-reso echo${(a.echoN ?? 3) >= 4 ? ' fort' : ''}">${ICO.boost}${nomEcho(a.echoN ?? 3).toUpperCase()} ${pctEcho(a.echoN ?? 3)}</span>` : '')
    + (s.debride ? `<span class="badge-reso eclat">${ICO.eclat}${tr`DÉBRIDAGE ×${decimal(REGLES.eclat.debride)}`}</span>` : '')
    + (s.chaine.length && e.actif === undefined && !verrou ? bilanChaine(s) : '')
    + `</div><div class="rail">`;
  // pendant l'animation, la carte qui agit s'avance, celles déjà jouées s'éteignent
  s.chaine.forEach((g, i) => {
    const etat = e.actif === undefined ? '' : i === e.actif ? 'en-jeu' : i < e.actif ? 'jouee' : '';
    const html = maillon(g, verrou, s);
    h += etat ? html.replace('class="', `class="${etat} `) : html;
    // une carte lourde garde sa forme de carte : sa deuxième place est un emplacement relié, au lieu d'une carte étirée
    if (g.lourd) {
      const ill = g.carte ? illustrationModule(g.carte) : null;
      h += `<span class="place-vide place-liee${etat ? ' ' + etat : ''}"${ill ? ` style="--art:url(${ill})"` : ''} aria-hidden="true"><small>${tr`2 pl.`}</small></span>`;
    }
  });
  for (let i = 0; i < libres; i++) h += `<span class="place-vide" aria-hidden="true">${aide && i === 0 && dernier && !a.echo && fs[fs.length - 1]! < FREQ_MAX ? (fs[fs.length - 1]! + 1) : ''}</span>`;
  h += `</div><p class="conseil">${conseil}</p></section></div>`;
  if (e.lecon) h += `<section class="lecon" aria-live="polite"><span class="surtitre">${ICO.cristal}${tr`COMBAT GUIDÉ`}</span><p>${echap(e.lecon)}</p></section>`;
  h += escouade;
  if (!e.lecon) {
    // Coup d'éclat : Flux plein, un seul par combat. Un bouton doré dans la rangée du Flux déplie le choix (une lignée par
    // Porteur debout) à la même place : la rangée ne grandit pas, la main garde sa taille sur téléphone.
    const eclats = eclatsPossibles(s);
    if (eclats.length && e.eclats) {
      h += `<div class="flux zone-flux coups-eclat" role="group" aria-label="${tr`Coup d’éclat : un seul par combat, il vide le Flux`}">`
        + eclats.map((c) => `<button type="button" class="btn-eclat l-${c.lignee}" style="--c:${COULEUR[c.lignee]}" data-action="eclat" data-id="${c.porteur}"${verrou ? ' disabled' : ''} aria-label="${echap(tr`${ECLATS[c.lignee].nom}, par ${porteurDef(c.porteur).nom} : ${ECLATS[c.lignee].texte}`)}"><strong>${echap(ECLATS[c.lignee].nom)}</strong><small>${echap(porteurDef(c.porteur).nom)}</small></button>`).join('')
        + `<button type="button" class="btn-icone" data-action="eclats" aria-label="${tr`Garder mon Flux`}">${ICO.fermer}</button></div>`;
    } else {
      // Flux plein et Coup d'éclat disponible : le bouton doré prend la place des trois losanges (pleins, par définition)
      h += `<div class="flux zone-flux nf-${s.flux}">`
        + (eclats.length
          ? `<button type="button" class="btn-flux btn-eclat-ouvrir" data-action="eclats" aria-expanded="false"${verrou ? ' disabled' : ''} aria-label="${tr`Flux plein : Coup d’éclat, un seul par combat, il vide le Flux`}">${ICO.eclat}${tr`Éclat`}</button>`
          : jaugeFlux(s.flux))
        + `<button type="button" class="btn-flux" data-action="allonger" aria-label="${tr`Une place de plus dans la chaîne, pour 1 Flux`}"${verrou || s.flux < 1 || capacite(s) >= REGLES.capaciteMax ? ' disabled' : ''}>${ICO.place}${tr`+1 place${coutFlux(1)}`}</button>`
        + `<button type="button" class="btn-flux" data-action="repiocher" aria-label="${tr`Repiocher, pour 1 Flux`}"${verrou || s.flux < 1 ? ' disabled' : ''}>${ICO.repiocher}${tr`Repiocher${coutFlux(1)}`}</button>`
        + '</div>';
    }
  }

  // la main
  h += `<section class="zone-main" aria-label="${tr`Main`}"><div class="main-tete"><span class="surtitre">${tr`MAIN · ${s.main.length}`}</span>${!e.lecon && peutRelancer(s) ? `<button type="button" class="btn-relance" data-action="relancer"${verrou ? ' disabled' : ''} aria-label="${tr`Relancer la première main : gratuit, une seule fois, avant de lancer la première chaîne`}">${ICO.repiocher}${tr`Relancer`}</button>` : ''}${e.auto ? `<button type="button" class="btn-relance btn-auto en-cours" data-action="auto-stop" aria-label="${tr`Reprendre la main : arrêter le combat automatique après la chaîne en cours`}">${ICO.ok}${tr`Reprendre`}</button>` : e.autoPermis && !e.lecon && s.tour >= 1 ? `<button type="button" class="btn-relance btn-auto" data-action="auto"${verrou ? ' disabled' : ''} aria-label="${tr`Combat automatique : l’escouade joue seule, en accéléré (Strate déjà vaincue)`}">${ICO.lancer}${tr`Auto`}</button>` : ''}${piles}</div><div class="main${guide && s.tour >= 2 && s.main.some((g) => vise(g) && placesCarte(s, g) <= libres) ? ' tri' : ''}">`;
  for (const g of s.main) {
    // une place qu'on n'a pas remplie chez ce Porteur : elle prend sa place dans la main ce tour-ci, sans se jouer
    if (g.vide) {
      const img = g.porteur ? portrait(g.porteur) : null;
      const nom = g.porteur ? porteurDef(g.porteur).nom : '';
      h += `<span class="geste main main-vide" role="img" aria-label="${echap(tr`Place vide de ${nom} : elle ne se joue pas`)}" style="--c:${COULEUR[ligneeGeste(g)]}">`
        + (img ? `<span class="mv-ombre" style="background-image:url(${img})" aria-hidden="true"></span>` : '')
        + `<span class="mv-texte" aria-hidden="true"><b>${tr`Place vide`}</b><small>${echap(nom)}</small></span></span>`;
      continue;
    }
    const halo = aide && !!dernier && prolonge(g, fs[fs.length - 1]) && placesCarte(s, g) <= libres;
    h += geste(g, 'main', 'ajouter', { halo, off: verrou, serre: placesCarte(s, g) > libres || !!voixRefusee(s, g), vise: vise(g) && placesCarte(s, g) <= libres, felure: brise(g) });
  }
  h += '</div></section>';

  h += `<footer class="actions-combat"><button type="button" class="btn sec" data-action="vider"${verrou || !s.chaine.length ? ' disabled' : ''}>${ICO.retirer}${tr`Retirer`}</button>`
    + (mainBloquee(s)
      // aucune carte ne rentre : le bouton principal propose de passer le tour (l'ennemi joue, puis nouvelle main)
      ? `<button type="button" class="btn prim lancer" data-action="lancer"${verrou ? ' disabled' : ''} aria-label="${tr`Aucune carte ne peut entrer dans la chaîne : passer le tour`}">${ICO.lancer}${tr`Passer le tour`}</button></footer>`
      : `<button type="button" class="btn prim lancer${mult ? ' fort' : ''}${lancerVise ? ' vise' : ''}" data-action="lancer"${verrou || !s.chaine.length ? ' disabled' : ''}>${ICO.lancer}${tr`Lancer la chaîne${mult ? ` <b>${mult}</b>` : ''}`}</button></footer>`);

  if (e.journal) h += feuilleJournal(s, e.journal);
  else if (e.guide) h += feuilleGuide(e.guide, e.trouvees ?? new Set());
  else if (e.regles) h += regles();
  else if (e.fuite && peutFuir(e.x) && !verrou) h += feuilleFuite(e);
  if (e.decouverte && !e.fin) h += htmlDecouverte(e.decouverte, e.decouvertePage);
  if (e.fin && !e.journal) {
    const victoire = e.fin.issue !== 'defaite';
    h += `<div class="voile" role="dialog" aria-modal="true" aria-labelledby="fin-titre"><div class="fenetre fin ${victoire ? 'victoire' : 'defaite'}">${e.fin.issue ? '' : `<span class="surtitre">${victoire ? 'VICTOIRE' : tr('L’ESCOUADE RECULE')}</span>`}<h2 id="fin-titre">${echap(e.fin.titre)}</h2><p>${echap(e.fin.texte)}</p>`
      + `<button type="button" class="btn prim large" data-action="${e.fin.action}">${echap(e.fin.bouton)}</button>${e.fin.bouton2 ? `<button type="button" class="btn sec large" data-action="${e.fin.action2}">${echap(e.fin.bouton2)}</button>` : ''}`
      + (s.historique?.some((t) => t.chaine.length) ? `<button type="button" class="lien fin-journal" data-action="journal" data-id="tours">${ICO.journal}${tr`Revoir le combat`}</button>` : '') + `</div></div>`;
  }
  return h + `</div>`;
}

/** La fenêtre « première rencontre » (combat et exploration) */
export function htmlDecouverte(d: Decouverte, page?: { n: number; total: number }): string {
  const ill = d.ennemi ? illustrationEnnemi(d.ennemi) : null;
  const ico = (d.ico && (ICO as Record<string, string>)[d.ico]) || ICO.cristal;
  return `<div class="voile" role="dialog" aria-modal="true" aria-labelledby="decouverte-titre"><div class="fenetre decouverte">`
    + (ill ? `<img class="decouverte-portrait" src="${ill}" alt="" decoding="async">` : `<span class="decouverte-ico" aria-hidden="true">${ico}</span>`)
    + `<span class="surtitre">${echap(d.sur)}${page ? ` · ${page.n} / ${page.total}` : ''}</span><h2 id="decouverte-titre">${echap(d.titre)}</h2><p>${echap(d.texte)}</p>`
    + (d.conseil ? `<p class="conseil-decouverte"><b>${tr`Conseil`}</b> ${echap(d.conseil)}</p>` : '')
    + `<button type="button" class="btn prim large" data-action="decouverte-ok" data-id="${echap(d.id)}">${page && page.n < page.total ? tr('Suivant') : tr('Compris')}</button></div></div>`;
}
