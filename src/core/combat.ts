// Le moteur de combat. Fonctions pures sur un état sérialisable (JSON) :
// l'interface appelle ces fonctions puis anime les « pas » qu'elles renvoient.

import { CONDITIONS, DECK_DEPART, FAVEUR_CONDITION, NOMS_LIGNEE, ZONES, ennemiDef, porteurDef } from './donnees';
import { REGLES, analyserChaine, avantage, frequenceLibre, frequencesEffectives, meilleureFrequence, multEcho, places } from './regles';
import { tireur } from './rng';
import { NOMS_EFFET } from './effets';
import type {
  BonusMarques, CalculHisto, CarteHisto, CibleRegle, CombatEtat, Effet, EnnemiEtat, Evenement, Geste, GesteDef, Intention, Lignee, LigneeGeste,
  LigneHisto, Pas, PorteurEtat, TourHisto, Trait,
} from './types';

export interface Resultat {
  ok: boolean;
  message?: string;
}

const clone = <T>(x: T): T => structuredClone(x);
/**
 * Une photo de l'état pour l'animation : le journal complet n'est pas recopié à chaque pas (il ne fait que grandir,
 * et l'écran ne le lit qu'entre deux tours) ; la photo partage celui de l'état.
 */
function photo(s: CombatEtat): CombatEtat {
  const h = s.historique;
  if (!h) return clone(s);
  delete s.historique;
  const c = clone(s);
  s.historique = h;
  c.historique = h;
  return c;
}

export function creerCombat(opts: {
  porteurs: PorteurEtat[];
  ennemiId: string;
  rng: number;
  deck?: GesteDef[];
  /** puissance de l'ennemi (1 = Strate −1) */
  force?: number;
  /** pioche dans l'ordre du deck, sans mélange (combat guidé) */
  ordonne?: boolean;
  /** ce que les Marques des Porteurs apportent */
  bonus?: BonusMarques;
  /** les ennemis qui accompagnent le premier (combat à plusieurs) */
  escorte?: string[];
  /** la condition de la salle (CONDITIONS) */
  condition?: string;
  /** false : les ennemis jouent sans traits ni seconde phase (Strate −1) */
  traits?: boolean;
  /** PV au même rythme que les coups (les pillages, réglés à part sur la force des garnisons) */
  pvPleins?: boolean;
}): CombatEtat {
  const e = ennemiDef(opts.ennemiId);
  const groupe = [opts.ennemiId, ...(opts.escorte ?? [])];
  // un groupe se partage la puissance d'un ennemi seul (un peu plus au total : il faut choisir qui frapper)
  const force = (opts.force ?? 1) * (PART_GROUPE[groupe.length] ?? PART_GROUPE[3]!);
  // les PV seuls suivent un peu moins la profondeur que les coups (27 octobre 2026 : des combats moins longs en profondeur)
  const pvForce = opts.pvPleins ? force : (opts.force ?? 1) * (PV_GROUPE[groupe.length] ?? PV_GROUPE[3]!) * pvProfondeur(opts.force ?? 1);
  const etat = (id: string, rang: number): EnnemiEtat => {
    const d = ennemiDef(id);
    const pv = Math.round(d.pvMax * pvForce);
    return { id, pv, pvMax: pv, force, bouclier: 0, etape: rang, boost: 1, ...(groupe.length > 1 ? { rang } : {}), ...(opts.traits === false ? { simple: true } : {}) };
  };
  const s: CombatEtat = {
    porteurs: clone(opts.porteurs),
    ennemi: etat(opts.ennemiId, 0),
    ...(groupe.length > 1 ? { autres: groupe.slice(1).map((id, k) => etat(id, k + 1)) } : {}),
    forceBase: opts.force ?? 1,
    ...(opts.condition ? { condition: opts.condition } : {}),
    intention: { type: 'boost' },
    pioche: [],
    defausse: [],
    main: [],
    chaine: [],
    capaBonus: 0,
    bouclier: 0,
    flux: 0,
    tour: 1,
    rng: opts.rng,
    issue: 'en-cours',
    journal: [],
  };
  const deck: Geste[] = (opts.deck ?? DECK_DEPART).map((g, k) => ({ ...g, uid: `g${k}` }));
  s.pioche = opts.ordonne ? deck.slice().reverse() : tireur(s).melanger(deck);
  s.historique = [];
  log(s, groupe.length > 1 ? `${groupe.map((id) => ennemiDef(id).nom).join(', ')} : un groupe surgit dans la Strate.` : `Un ${e.nom} surgit dans la Strate.`, { camp: 'neutre' });
  const b = opts.bonus;
  if (b?.places) s.capaBonus = b.places;
  if (b?.bouclier) s.bouclier = b.bouclier;
  if (b?.lucide) s.lucide = true;
  if (b?.flux) s.flux = Math.min(REGLES.fluxMax, b.flux);
  if (b?.garde) s.gardeMarque = b.garde;
  if (b?.releve) s.releve = b.releve;
  if (b?.veille) s.veille = b.veille;
  if (b?.chitine) s.chitine = b.chitine;
  if (b?.felureFlux) s.felureFlux = b.felureFlux;
  if (b?.fissure) { s.ennemi.fissure = b.fissure; s.ennemi.fissureTours = 2; }
  for (const en of tousEnnemis(s)) choisirIntention(s, en);
  // Ombre courtoise (Aurel) : la première attaque annoncée de chaque ennemi est retenue
  if (b?.desarme) for (const en of tousEnnemis(s)) { const it = intentionDe(s, en); if (it.type === 'atk') it.v = Math.round(it.v * (1 - b.desarme)); }
  piocher(s, REGLES.tailleMain + (b?.main ?? 0));
  fixerFelures(s);
  return s;
}

// ---------- Lecture ----------

const porteurEtat = (s: CombatEtat, id: string) => s.porteurs.find((p) => p.id === id);
export const vivants = (s: CombatEtat) => s.porteurs.filter((p) => p.pv > 0);
const estATerre = (s: CombatEtat, id: string | null) => !!id && (porteurEtat(s, id)?.pv ?? 0) <= 0;
export const capacite = (s: CombatEtat) => REGLES.capaciteBase + s.capaBonus;
export const placesPrises = (s: CombatEtat) => s.chaine.reduce((n, g) => n + places(g), 0);
export const placesLibres = (s: CombatEtat) => capacite(s) - placesPrises(s);
export const ligneeGeste = (g: GesteDef): LigneeGeste => (g.porteur ? porteurDef(g.porteur).lignee : 'neutre');

/** PV et attaques de chaque ennemi d'un groupe, par rapport à un ennemi seul (×1,28 de PV au total pour deux, ×1,35 pour trois ; réglé au joueur moyen : un groupe pèse à peu près autant que ses membres affrontés seuls) */
export const PART_GROUPE: Record<number, number> = { 1: 1, 2: 0.64, 3: 0.45 };
/**
 * Durée des combats (27 octobre 2026, Bryan : 31 tours contre un groupe, c'est trop ; 4 à 6 tours, trop peu). Cible au parcours
 * d'un joueur moyen (`scripts/durees.ts`) : combats normaux 6 à 9 tours, groupes 9 à 13, gardiens 12 à 18.
 * Les PV d'un groupe : chaque ennemi garde sa part de coups (PART_GROUPE), mais a moins de PV.
 */
export const PV_GROUPE: Record<number, number> = { 1: 1, 2: 0.6, 3: 0.4 };
/** En profondeur, les PV montent moins vite que les coups : × 1 jusqu'à la Strate −2, puis de moins en moins, jusqu'au plancher */
export const PV_PROFONDEUR = { depuis: 1.4, pente: 0.12, plancher: 0.82 };
export const pvProfondeur = (force: number) => Math.max(PV_PROFONDEUR.plancher, Math.min(1, 1 - PV_PROFONDEUR.pente * (force - PV_PROFONDEUR.depuis)));

/** Le trait d'un ennemi, s'il l'a */
export function trait<T extends Trait['type']>(en: EnnemiEtat, type: T): Extract<Trait, { type: T }> | undefined {
  if (en.simple) return undefined;
  return ennemiDef(en.id).traits?.find((t) => t.type === type) as Extract<Trait, { type: T }> | undefined;
}
/** Furie : sous la moitié de ses PV, un ennemi frappe 30 % plus fort */
export const FURIE = 1.3;
/** Ce qui multiplie les attaques d'un ennemi : sa concentration, et sa furie */
export const puissance = (en: EnnemiEtat) => en.boost * (trait(en, 'furie') && en.pv > 0 && en.pv <= en.pvMax / 2 ? FURIE : 1);
/**
 * Combats qui s'éternisent : à partir du tour 10, les ennemis se soignent de moins en moins (plus du tout au tour 20),
 * et à partir du tour 25 leurs attaques grossissent de 10 % par tour. Aucun combat ne peut tourner en rond.
 */
export const usureCombat = (s: CombatEtat) => ({
  soins: s.tour <= 10 ? 1 : Math.max(0, 1 - (s.tour - 10) / 10),
  attaque: s.tour <= 25 ? 1 : 1 + 0.1 * (s.tour - 25),
});
/** Éboulis : ce que les pierres retirent à chacun, à chaque tour ennemi */
export const eboulis = (s: CombatEtat) => Math.max(1, Math.round(2 * (s.forceBase ?? s.ennemi.force)));

/** Tous les ennemis du combat, dans l'ordre où ils se tiennent (le visé compris) */
export const tousEnnemis = (s: CombatEtat): EnnemiEtat[] =>
  (s.autres?.length ? [s.ennemi, ...s.autres].sort((a, b) => (a.rang ?? 0) - (b.rang ?? 0)) : [s.ennemi]);
export const ennemisDebout = (s: CombatEtat) => tousEnnemis(s).filter((e) => e.pv > 0);
export const enGroupe = (s: CombatEtat) => !!s.autres?.length;
/** L'intention d'un ennemi : celle du visé est dans `s.intention`, celle des autres dans leur état */
export const intentionDe = (s: CombatEtat, en: EnnemiEtat): Intention => (en === s.ennemi ? s.intention : en.intention ?? { type: 'boost' });
const fixerIntention = (s: CombatEtat, en: EnnemiEtat, it: Intention) => { if (en === s.ennemi) s.intention = it; else en.intention = it; };

/**
 * Vise un autre ennemi du groupe : toute la chaîne le frappera (Désarmer et Fissure aussi).
 * L'ennemi visé passe dans `s.ennemi` (et son intention dans `s.intention`) : le reste du moteur ne change pas.
 */
export function viser(s: CombatEtat, rang: number): Resultat {
  if (!s.autres?.length || (s.ennemi.rang ?? 0) === rang) return { ok: false };
  const k = s.autres.findIndex((e) => e.rang === rang);
  if (k < 0 || s.autres[k]!.pv <= 0) return { ok: false };
  const nouveau = s.autres[k]!;
  const ancien = s.ennemi;
  ancien.intention = s.intention;
  s.intention = nouveau.intention ?? { type: 'boost' };
  delete nouveau.intention;
  s.autres[k] = ancien;
  s.ennemi = nouveau;
  return { ok: true };
}

/** Ennemi suivant à viser quand le visé tombe : le plus à gauche encore debout */
function viserSuivant(s: CombatEtat): boolean {
  const r = s.autres?.filter((e) => e.pv > 0).sort((a, b) => (a.rang ?? 0) - (b.rang ?? 0))[0];
  return !!r && viser(s, r.rang ?? 0).ok;
}

export function texteIntention(s: CombatEtat, en: EnnemiEtat = s.ennemi): string {
  const it = intentionDe(s, en);
  if (it.type === 'bouclier') return `Va se protéger : bouclier ${it.v}`;
  if (it.type === 'boost') return 'Se concentre : sa prochaine attaque fera double dégâts';
  if (it.type === 'soin') return `Va se réparer : ${it.nom} +${it.v} PV`;
  if (it.type === 'dissonance') return `${it.nom} : va brouiller tes Fréquences, pas de Résonance au tour suivant`;
  const v = Math.round(it.v * puissance(en) * usureCombat(s).attaque);
  if (it.zone) return `Va frapper toute l’escouade : ${it.nom} ${v}`;
  const cible = it.cibleId ? porteurDef(it.cibleId).nom : '?';
  return `Va frapper ${cible} : ${it.nom} ${v}`;
}

// ---------- Actions du joueur ----------

export function ajouter(s: CombatEtat, uid: string): Resultat {
  if (s.issue !== 'en-cours') return { ok: false };
  const g = s.main.find((x) => x.uid === uid);
  if (!g) return { ok: false };
  if (g.vide) return { ok: false, message: 'Une place vide ne se joue pas : confie une carte de plus à ce Porteur.' };
  if (places(g) > placesLibres(s)) {
    const debut = g.lourd ? `${g.nom} prend 2 places, il n’en reste ${placesLibres(s)}.` : 'La chaîne est pleine.';
    const fin = s.flux > 0 && capacite(s) < REGLES.capaciteMax ? ' Retire une carte ou dépense 1 Flux (+1 place).' : ' Retire une carte.';
    log(s, debut + fin, false);
    return { ok: false, message: debut + fin };
  }
  s.main = s.main.filter((x) => x !== g);
  // une carte à plusieurs Fréquences prend celle qui prolonge la suite
  if (g.fs && g.fs.length > 1) g.f = meilleureFrequence(s.chaine, g.fs);
  // une carte de soin (hors Vague) reçoit une cible proposée : le joueur peut la changer
  if (soigneUnSeul(g)) g.cible = cibleConseillee(s);
  else delete g.cible;
  s.chaine.push(g);
  return { ok: true };
}

/**
 * Brouillard (27 octobre 2026, Bryan : poser puis retirer une carte révélait l'intention, le brouillard ne servait à rien).
 * Il dure tout le combat : on voit ce que prépare l'ennemi (attaque, bouclier, soin…), jamais combien ni sur qui,
 * et sa Fêlure reste cachée.
 */
export const brumeActive = (s: CombatEtat) => s.condition === 'brouillard' && s.issue === 'en-cours';

/** Une carte qui soigne un seul Porteur (la Vague soigne toute l'escouade) */
export const soigneUnSeul = (g: Geste) => g.type === 'soin' && g.effet?.type !== 'vague' && g.effet?.type !== 'debord';

/**
 * La cible proposée pour un soin : le Porteur visé par l'attaque annoncée s'il risque de tomber bas,
 * sinon le plus blessé.
 */
function cibleConseillee(s: CombatEtat): string | undefined {
  const coups = new Map<string, number>();
  if (brumeActive(s)) return plusBlesse(s)?.id;
  for (const en of ennemisDebout(s)) {
    const it = intentionDe(s, en);
    if (it.type === 'atk' && !it.zone && it.cibleId) coups.set(it.cibleId, (coups.get(it.cibleId) ?? 0) + it.v * puissance(en));
  }
  for (const [id, v] of coups) {
    const p = s.porteurs.find((x) => x.id === id && x.pv > 0);
    if (p && p.pv - v <= p.pvMax * 0.3) return p.id;
  }
  return plusBlesse(s)?.id;
}

/** Change la cible d'une carte de soin de la chaîne : passe au Porteur suivant encore debout */
export function cibler(s: CombatEtat, uid: string, porteurId?: string): Resultat {
  const g = s.chaine.find((x) => x.uid === uid);
  if (!g || !soigneUnSeul(g)) return { ok: false };
  const debout = vivants(s).map((p) => p.id);
  if (porteurId) {
    if (!debout.includes(porteurId)) return { ok: false };
    g.cible = porteurId;
  } else g.cible = debout[(debout.indexOf(g.cible ?? '') + 1) % debout.length];
  return { ok: true };
}

/**
 * Protégé (27 octobre 2026, Bryan : « si on a une attaque qui va sur tous les personnages et qu'on a un bouclier, il faudrait
 * pouvoir rediriger le bouclier vers celui qui est le plus faible »). Le bouclier d'escouade reste un seul réservoir, mais il
 * couvre d'abord le protégé : sur une zone, il est touché le premier ; quand plusieurs ennemis frappent des Porteurs
 * différents, le bouclier garde de quoi couvrir les coups encore à venir sur lui, et les autres prennent le reste.
 * Le jeu propose le plus menacé, le joueur peut en choisir un autre d'un toucher (comme la cible d'un soin). Le choix vaut pour le tour.
 */

/** Ce qu'un ennemi va retirer à un Porteur s'il le frappe (0 s'il ne le vise pas) : même calcul que son vrai tour */
function coupSur(s: CombatEtat, en: EnnemiEtat, porteurId: string): number {
  const it = intentionDe(s, en);
  if (s.ombre || it.type !== 'atk' || (!it.zone && it.cibleId !== porteurId)) return 0;
  return Math.round(it.v * puissance(en) * usureCombat(s).attaque * avantage(ennemiDef(en.id).lignee, porteurDef(porteurId).lignee));
}

/** Ce que le bouclier doit encore garder pour le protégé : les coups qui l'attendent chez les ennemis qui n'ont pas encore frappé */
function reservePour(s: CombatEtat, porteurId: string | undefined, ennemis: EnnemiEtat[]): number {
  return porteurId ? ennemis.reduce((t, en) => t + coupSur(s, en, porteurId), 0) : 0;
}

/** Les Porteurs que les attaques annoncées vont toucher */
function porteursVises(s: CombatEtat): PorteurEtat[] {
  return vivants(s).filter((p) => ennemisDebout(s).some((en) => coupSur(s, en, p.id) > 0 || (intentionDe(s, en).type === 'atk' && intentionDe(s, en).cibleId === p.id)));
}

/** Choisir un protégé a un sens : les attaques annoncées touchent au moins deux Porteurs (une zone, ou plusieurs ennemis) */
export const protectionUtile = (s: CombatEtat) => s.issue === 'en-cours' && !brumeActive(s) && porteursVises(s).length >= 2;

/** Le Porteur que le bouclier couvrira en premier : celui choisi ce tour, sinon celui qui finirait le plus bas */
export function protegeDe(s: CombatEtat): string | undefined {
  const debout = vivants(s);
  if (s.protege && debout.some((p) => p.id === s.protege)) return s.protege;
  if (brumeActive(s)) return plusBlesse(s)?.id;
  const vises = porteursVises(s);
  if (!vises.length) return plusBlesse(s)?.id;
  const reste = (p: PorteurEtat) => (p.pv - reservePour(s, p.id, ennemisDebout(s))) / p.pvMax;
  return vises.sort((a, b) => reste(a) - reste(b))[0]?.id;
}

/** Choisit le protégé du tour (un Porteur encore debout) */
export function proteger(s: CombatEtat, porteurId: string): Resultat {
  if (s.issue !== 'en-cours' || !vivants(s).some((p) => p.id === porteurId)) return { ok: false };
  s.protege = porteurId;
  return { ok: true };
}

/** Les Porteurs touchés par une zone, le protégé d'abord : c'est lui que le bouclier couvre en premier */
function ordreZone<T extends { id: string }>(s: CombatEtat, debout: T[]): T[] {
  const id = protegeDe(s);
  const p = debout.find((x) => x.id === id);
  return p ? [p, ...debout.filter((x) => x !== p)] : debout;
}

/** Le bouclier que peut prendre un coup sur ce Porteur : tout pour le protégé, le reste moins la réserve pour les autres */
const bouclierPour = (bouclier: number, porteurId: string, protege: string | undefined, reserve: number) =>
  porteurId === protege ? bouclier : Math.max(0, bouclier - reserve);

/** Pendant le tour ennemi : la part du bouclier gardée pour les coups à venir sur le protégé (recalculée avant chaque ennemi) */
let RESERVE = 0;

/**
 * Soigner depuis l'escouade (27 octobre 2026, Bryan : « la protection se déplace mais pas le soin ») : un toucher sur une
 * tuile envoie tous les soins à un seul Porteur de la chaîne vers lui. Le bouton sur chaque carte permet toujours de les séparer.
 */
export function soignerVers(s: CombatEtat, porteurId: string): Resultat {
  if (s.issue !== 'en-cours' || !vivants(s).some((p) => p.id === porteurId)) return { ok: false };
  const soins = s.chaine.filter(soigneUnSeul);
  if (!soins.length) return { ok: false };
  for (const g of soins) g.cible = porteurId;
  return { ok: true };
}

/** Change la Fréquence d'une carte posée dans la chaîne (cartes à plusieurs Fréquences : argent et plus) */
export function accorder(s: CombatEtat, uid: string, f?: number): Resultat {
  if (s.issue !== 'en-cours') return { ok: false };
  const g = s.chaine.find((x) => x.uid === uid);
  if (!g || !g.fs || g.fs.length < 2) return { ok: false };
  const k = g.fs.indexOf(g.f);
  g.f = f !== undefined && g.fs.includes(f) ? f : g.fs[(k + 1) % g.fs.length]!;
  return { ok: true };
}

export function retirer(s: CombatEtat, uid: string): Resultat {
  const g = s.chaine.find((x) => x.uid === uid);
  if (!g) return { ok: false };
  s.chaine = s.chaine.filter((x) => x !== g);
  if (g.fs) g.f = g.fs[0]!;
  s.main.push(g);
  // les cartes à plusieurs Fréquences qui restent reprennent celle qui prolonge la nouvelle suite
  s.chaine.forEach((x, i) => { if (x.fs && x.fs.length > 1) x.f = meilleureFrequence(s.chaine.slice(0, i), x.fs); });
  return { ok: true };
}

/** Déplace une carte posée à une autre place de la chaîne, sans la renvoyer en main (une suite mal posée se répare) */
export function deplacer(s: CombatEtat, uid: string, vers: number): Resultat {
  if (s.issue !== 'en-cours') return { ok: false };
  const de = s.chaine.findIndex((x) => x.uid === uid);
  if (de < 0) return { ok: false };
  const a = Math.max(0, Math.min(s.chaine.length - 1, vers));
  if (a === de) return { ok: false };
  const [g] = s.chaine.splice(de, 1);
  s.chaine.splice(a, 0, g!);
  // les cartes à plusieurs Fréquences reprennent celle qui prolonge la suite à leur nouvelle place
  s.chaine.forEach((x, i) => { if (x.fs && x.fs.length > 1) x.f = meilleureFrequence(s.chaine.slice(0, i), x.fs); });
  return { ok: true };
}

export function viderChaine(s: CombatEtat): void {
  for (const g of s.chaine) if (g.fs) g.f = g.fs[0]!;
  s.main.push(...s.chaine);
  s.chaine = [];
}

export function allonger(s: CombatEtat): Resultat {
  if (s.flux < 1 || capacite(s) >= REGLES.capaciteMax) return { ok: false };
  s.flux--;
  s.capaBonus++;
  log(s, 'Flux dépensé : la chaîne gagne une place ce tour-ci.', { sorte: 'flux' });
  return { ok: true };
}

/** Nouvelle main : les cartes de la main ET celles déjà posées dans la chaîne repartent à la défausse (26 octobre 2026 :
 *  Bryan posait 4 ou 5 cartes puis repiochait, et se retrouvait avec 5 cartes de plus que les autres tours) */
export function repiocher(s: CombatEtat): Resultat {
  if (s.issue !== 'en-cours' || s.flux < 1) return { ok: false };
  s.flux--;
  for (const g of s.chaine) if (g.fs) g.f = g.fs[0]!;
  s.defausse.push(...s.main, ...s.chaine);
  s.main = [];
  s.chaine = [];
  piocher(s);
  log(s, 'Flux dépensé : nouvelle main (la main et la chaîne posée partent à la défausse).', { sorte: 'flux' });
  return { ok: true };
}

/** La relance de la première main peut encore servir : une seule fois, avant de lancer la première chaîne */
export const peutRelancer = (s: CombatEtat) => s.issue === 'en-cours' && s.tour === 1 && !s.relance;

/**
 * Relance gratuite de la première main (27 octobre 2026, Bryan) : une fois par combat, au premier tour seulement.
 * Les cartes de la main (et celles déjà posées) retournent dans la pioche, mélangée, puis on repioche autant de cartes.
 * Ne coûte pas de Flux, contrairement à Repiocher.
 */
export function relancerMain(s: CombatEtat): Resultat {
  if (!peutRelancer(s)) return { ok: false };
  for (const g of s.chaine) if (g.fs) g.f = g.fs[0]!;
  const n = s.main.length + s.chaine.length;
  s.pioche = tireur(s).melanger([...s.pioche, ...s.main, ...s.chaine]);
  s.main = [];
  s.chaine = [];
  s.relance = true;
  piocher(s, n);
  log(s, 'Première main relancée.', { sorte: 'flux' });
  return { ok: true };
}

/** Pour un aperçu : une Fêlure que le joueur ne voit pas (évanescent, brouillard) ne doit rien trahir (27 octobre 2026) */
function masquerFelures(s: CombatEtat, copie: CombatEtat) {
  const brume = brumeActive(s);
  for (const en of tousEnnemis(copie)) if (!en.felureBrisee && (brume || !felureVisible(en))) delete en.felure;
}

/**
 * Ce que la chaîne posée fera si on la lance (26 octobre 2026). Bryan : « ça fait beaucoup de calculs à faire avant de lancer
 * une attaque ». La chaîne est jouée sur une copie du combat, avec exactement les règles du vrai lancer (Résonance, lignées,
 * Blindé, Fissure, bouclier de l'ennemi…) : le total affiché est celui qui tombera. Rien n'est modifié.
 */
export function apercuChaine(s: CombatEtat): { degats: number; absorbe: number; bouclier: number; soin: number; vaincus: number } {
  const r = { degats: 0, absorbe: 0, bouclier: 0, soin: 0, vaincus: 0 };
  if (s.issue !== 'en-cours' || !s.chaine.length) return r;
  const copie = photo(s);
  delete copie.historique;
  masquerFelures(s, copie);
  const debout = ennemisDebout(copie).length;
  lancer(copie, {
    apercu: (ev) => {
      if (ev.kind === 'degats' && ev.cible === 'ennemi') { r.degats += ev.net; r.absorbe += ev.absorbe; }
      else if (ev.kind === 'bouclier' && ev.cible === 'escouade') r.bouclier += ev.v;
      else if (ev.kind === 'soin' && ev.cible !== 'ennemi' && ev.cible !== 'escouade') r.soin += ev.v;
    },
  });
  r.vaincus = debout - ennemisDebout(copie).length;
  return r;
}

/** Un coup annoncé sur un Porteur : l'ennemi qui frappe (son rang), ce qui passera (net) et ce que le bouclier prendra */
export type CoupAttendu = { rang: number; net: number; absorbe: number };

/**
 * Les coups que chaque Porteur va recevoir au tour ennemi (27 octobre 2026). Bryan : « si seulement Ilka avait une marque
 * visuelle, on verrait tout de suite qu'elle est concernée ». Le tour est joué sur une copie, avec la chaîne posée si elle
 * existe : son bouclier, la Fêlure qu'elle brise et l'ennemi qu'elle abat avant qu'il frappe sont donc comptés.
 * Rien sous le brouillard (ni la force, ni la cible ne se voient). Rien n'est modifié.
 */
export function coupsAttendus(s: CombatEtat): Map<string, CoupAttendu[]> {
  const r = new Map<string, CoupAttendu[]>();
  if (s.issue !== 'en-cours' || brumeActive(s)) return r;
  const copie = photo(s);
  delete copie.historique;
  masquerFelures(s, copie);
  const noter = (ev: Evenement) => {
    if (ev.kind !== 'degats' || ev.cible === 'ennemi' || ev.cible === 'escouade' || ev.source) return;
    const l = r.get(ev.cible) ?? [];
    l.push({ rang: ev.rang ?? 0, net: ev.net, absorbe: ev.absorbe });
    r.set(ev.cible, l);
  };
  const camp = CAMP;
  if (copie.chaine.length) lancer(copie, { apercu: noter, riposte: true });
  else tourEnnemi(copie, noter);
  CAMP = camp;
  return r;
}

/** Lance la chaîne, puis joue le tour ennemi. Renvoie les pas à animer. */
export function lancer(s: CombatEtat, opts: { silencieux?: boolean; apercu?: (ev: Evenement) => void; riposte?: boolean } = {}): Pas[] {
  const pas: Pas[] = [];
  if (s.issue !== 'en-cours' || !s.chaine.length) return pas;
  // en mode silencieux (robot d'équilibrage), on ne garde pas les étapes d'animation
  const emettre = opts.apercu ?? (opts.silencieux ? () => {} : (ev: Evenement) => { pas.push({ ev, etat: photo(s) }); });
  CAMP = 'joueur';

  const analyse = analyserChaine(s.chaine);
  // Écho ancien : une suite de 4 résonne comme une suite de 5
  const brut = s.condition === 'echo' && analyse.suite === 4 ? { ...analyse, mult: REGLES.multSuite[5]! } : analyse;
  // Dissonance : l'ennemi a brouillé les Fréquences, la suite ne compte pas ce tour-ci
  const brouille = s.dissonance || s.sansResonance;
  const a = brouille ? { ...brut, suite: 0, mult: 1 } : brut;
  const freqs = frequencesEffectives(s.chaine);
  noterChaine(s, freqs, a.suite >= 3 ? a : undefined, !!brouille && brut.suite >= 3, analyse.echo);
  if (brouille && brut.suite >= 3) {
    log(s, 'Fréquences brouillées : pas de Résonance ce tour-ci.', { sorte: 'effet' });
    emettre({ kind: 'effet', cible: 'escouade', texte: 'Brouillé' });
  }
  s.dissonance = false;
  if (a.suite >= 3) {
    log(s, `Résonance ! Suite de ${a.suite} : effets +${Math.round((a.mult - 1) * 100)} %.`, { sorte: 'effet' });
    emettre({ kind: 'resonance', suite: a.suite, mult: a.mult });
  }
  if (a.echo) {
    log(s, `Écho ! Trois Fréquences identiques : ces cartes +${Math.round((REGLES.echo - 1) * 100)} %.`, { sorte: 'effet' });
    emettre({ kind: 'echo' });
  }
  let fluxFelure = false;
  for (const [i, g] of s.chaine.entries()) {
    RANG = i;
    emettre({ kind: 'carte', rang: i, total: s.chaine.length, lignee: ligneeGeste(g), type: g.type, porteur: g.porteur, suite: a.suite, ...(g.effet ? { effet: g.effet.type } : {}) });
    for (const ev of appliquer(s, g, a.mult, i, a.suite)) emettre(ev);
    // la Fêlure se brise sur chaque ennemi debout dont la chaîne porte la Fréquence, visé ou non (28 octobre 2026, plus intuitif) ;
    // le Flux de la Fêlure ne se gagne qu'une fois par chaîne, même si plusieurs Fêlures cèdent
    for (const en of tousEnnemis(s)) {
      if (en.pv > 0 && freqs[i] === en.felure && !en.felureBrisee) { briser(s, en, emettre, a.suite >= 3 && !fluxFelure); fluxFelure = true; }
    }
    phaseGardien(s, s.ennemi, emettre);
    if (s.ennemi.pv <= 0) tombe(s, s.ennemi, emettre);
    if (s.ennemi.pv <= 0) {
      // dans un groupe, le reste de la chaîne passe à l'ennemi suivant
      if (i < s.chaine.length - 1 && viserSuivant(s)) {
        log(s, `${ennemiDef(s.ennemi.id).nom} est visé à son tour.`);
        emettre({ kind: 'cible', rang: s.ennemi.rang ?? 0 });
      } else break;
    }
  }
  RANG = undefined;
  const gain = (a.suite >= 3 ? 1 : 0) + (a.echo ? 1 : 0);
  if (gain) {
    const avant = s.flux;
    s.flux = Math.min(REGLES.fluxMax, s.flux + gain);
    if (s.flux > avant) {
      log(s, `La Résonance remplit le Flux (+${s.flux - avant}).`, { sorte: 'flux' });
      emettre({ kind: 'flux', gain: s.flux - avant });
    }
  }
  // l'aperçu s'arrête là : seule la chaîne compte, pas la riposte (sauf pour annoncer les coups attendus)
  if (opts.apercu && !opts.riposte) return pas;
  CAMP = 'neutre';
  s.debride = false;
  for (const g of s.chaine) if (g.fs) g.f = g.fs[0]!;
  // Rappel (exclusive) : la carte la plus forte de la chaîne, hors celles qui rappellent, revient en tête de pioche
  const rappel = s.chaine.find((g, i) => effetsEnJeu(g, s.chaine, i, estATerre(s, g.porteur)).some((e) => e?.type === 'rappel'));
  const rappelee = rappel ? s.chaine.filter((g) => g !== rappel && !g.vide && g.effet?.type !== 'rappel').sort((a, b) => b.v - a.v)[0] : undefined;
  s.defausse.push(...s.chaine.filter((g) => g !== rappelee));
  if (rappelee) {
    s.pioche.push(rappelee);
    log(s, `Rappel : ${rappelee.nom} revient en tête de pioche.`, { sorte: 'effet' });
    emettre({ kind: 'effet', cible: 'escouade', texte: 'Rappel' });
  }
  s.chaine = [];
  // les places vides ne restent pas en main : elles ont coûté leur place pour ce tour
  s.defausse.push(...s.main.filter((g) => g.vide));
  s.main = s.main.filter((g) => !g.vide);
  // Élan : les places gagnées servent au tour suivant
  s.capaBonus = Math.min(REGLES.capaciteMax - REGLES.capaciteBase, s.capaProchain ?? 0);
  s.capaProchain = 0;
  // Fissure : dure ce tour-ci et le suivant
  for (const en of tousEnnemis(s)) {
    if (en.fissureTours) {
      en.fissureTours--;
      if (!en.fissureTours) en.fissure = 0;
    }
  }
  // le visé est tombé en fin de chaîne : on vise le suivant pour le tour d'après
  if (s.ennemi.pv <= 0) viserSuivant(s);

  if (!ennemisDebout(s).length) {
    s.issue = 'victoire';
    log(s, ennemisVaincus(s), { camp: 'neutre', sorte: 'info' });
    emettre({ kind: 'fin', issue: 'victoire' });
    CAMP = 'joueur';
    return pas;
  }
  tourEnnemi(s, emettre);
  CAMP = 'joueur';
  return pas;
}

// ---------- Interne ----------

/**
 * Une ligne du journal. La dernière s'affiche sous la main ; toutes vont aussi dans le journal complet du tour
 * (sauf `false` : un message passager, comme « la chaîne est pleine »).
 */
function log(s: CombatEtat, t: string, info: Partial<LigneHisto> | false = {}) {
  s.journal.unshift(t);
  s.journal = s.journal.slice(0, 6);
  if (info === false) return;
  const l: LigneHisto = { camp: CAMP, sorte: 'info', ...info, texte: t };
  if (RANG !== undefined && l.camp === 'joueur' && l.rang === undefined) l.rang = RANG;
  tourHisto(s).lignes.push(l);
}

// ---------- Le journal complet (27 octobre 2026) ----------
// Bryan : pouvoir revoir les cartes jouées et comprendre les dégâts subis et reçus. Le moteur note chaque tour :
// la chaîne lancée, chaque ligne du journal, et le calcul de chaque coup (la base, chaque bonus et malus, le bouclier).

/** tours gardés dans le journal (un combat dure 6 à 18 tours ; au-delà, les plus anciens s'effacent) */
export const HISTO_MAX = 30;
/** qui agit en ce moment (le moteur est synchrone : une variable suffit) */
let CAMP: LigneHisto['camp'] = 'joueur';
/** la place de la carte de la chaîne qui agit */
let RANG: number | undefined;

function tourHisto(s: CombatEtat): TourHisto {
  const h = (s.historique ??= []);
  let t = h[h.length - 1];
  if (!t || t.tour !== s.tour) {
    t = { tour: s.tour, chaine: [], lignes: [] };
    h.push(t);
    if (h.length > HISTO_MAX) h.splice(0, h.length - HISTO_MAX);
  }
  return t;
}

/** La chaîne lancée, telle qu'elle est au lancer */
function noterChaine(s: CombatEtat, freqs: number[], reso: { suite: number; mult: number } | undefined, brouille: boolean, echo: boolean) {
  const t = tourHisto(s);
  t.chaine = s.chaine.map((g, i): CarteHisto => {
    const c: CarteHisto = { nom: g.nom, porteur: g.porteur, type: g.type, v: g.v, f: freqs[i] ?? g.f };
    if (g.carte) c.carte = g.carte;
    if (g.lourd) c.lourd = true;
    if (g.effet) c.effet = g.effet;
    if (g.effet2) c.effet2 = g.effet2;
    if (estATerre(s, g.porteur)) c.eteinte = true;
    return c;
  });
  if (reso) { t.suite = reso.suite; t.mult = reso.mult; }
  if (echo) t.echo = true;
  if (brouille) t.brouille = true;
}

const ennemisVaincus = (s: CombatEtat) => (enGroupe(s) ? 'Le groupe est vaincu.' : `${ennemiDef(s.ennemi.id).nom} est vaincu.`);
const arrondi = (x: number) => Math.round(x * 100) / 100;
/** Un calcul pour le journal (les multiplicateurs arrondis : le journal reste léger) */
const calcul = (cible: string, base: number, lignes: CalculHisto['lignes'], brut: number, absorbe: number, net: number): CalculHisto =>
  ({ cible, base: Math.round(base), lignes: lignes.map((l) => (l.m !== undefined ? { nom: l.nom, m: arrondi(l.m) } : l)), brut, absorbe, net });

/**
 * Un Porteur à terre (27 octobre 2026, Bryan : retirer ses cartes et une carte de main était un trop gros malus) :
 * ses cartes restent dans le deck mais s'éteignent (−15 % de force, sans effet, Fréquence intacte). Le deck garde sa taille,
 * donc un Porteur seul ne revoit plus ses 6 cartes à chaque tour (il était « pratiquement imbattable », 24 octobre 2026) :
 * il pioche surtout des cartes éteintes. La main reste à 5.
 */
const tailleMainDe = (_s: CombatEtat) => REGLES.tailleMain;

function piocher(s: CombatEtat, taille: number = tailleMainDe(s)) {
  const r = tireur(s);
  let garde = 0;
  while (s.main.length < taille && garde++ < 80) {
    if (!s.pioche.length) {
      if (!s.defausse.length) break;
      s.pioche = r.melanger(s.defausse);
      s.defausse = [];
    }
    s.main.push(s.pioche.pop() as Geste);
  }
}

function choisirCible(s: CombatEtat, regle: CibleRegle = 'hasard'): string | null {
  const v = vivants(s);
  if (!v.length) return null;
  if (regle === 'faible') {
    return v.slice().sort((a, b) => a.pv / a.pvMax - b.pv / b.pvMax)[0]!.id;
  }
  if (regle !== 'hasard') {
    const p = v.find((x) => x.id === regle) ?? v.find((x) => porteurDef(x.id).lignee === regle);
    if (p) return p.id;
  }
  return v[tireur(s).entier(v.length)]!.id;
}

function choisirIntention(s: CombatEtat, en: EnnemiEtat) {
  const e = ennemiDef(en.id);
  const motif = en.phase2 && e.phase ? e.phase.motif : e.motif;
  const m = motif[en.etape % motif.length]!;
  en.etape++;
  const it: Intention = { ...m };
  if (it.type === 'atk' || it.type === 'bouclier' || it.type === 'soin') it.v = Math.round(it.v * en.force);
  if (it.type === 'atk' && !it.zone) it.cibleId = choisirCible(s, it.cible);
  fixerIntention(s, en, it);
}

function plusBlesse(s: CombatEtat): PorteurEtat | undefined {
  return vivants(s).sort((a, b) => a.pv / a.pvMax - b.pv / b.pvMax)[0];
}

function appliquer(s: CombatEtat, g: Geste, mult: number, rang: number, suite = 0): Evenement[] {
  const nomP = g.porteur ? porteurDef(g.porteur).nom : 'Spécial';
  // une carte éteinte (son Porteur est à terre) frappe, protège ou soigne à moitié, sans son effet ; sa Fréquence compte toujours
  const eteinte = estATerre(s, g.porteur);
  // une carte de l’Héritage a deux effets : chacun se lit par son type ; l'Empreinte prend celui de la carte d'avant
  const effets = effetsEnJeu(g, s.chaine, rang, eteinte);
  const de = <T extends Effet['type']>(t: T) => effets.find((e): e is Extract<Effet, { type: T }> => e?.type === t);
  const evs: Evenement[] = [];
  const copie = !eteinte && g.effet?.type === 'empreinte' ? effets[0] : undefined;
  if (copie) {
    log(s, `Empreinte : ${g.nom} reprend l’effet de la carte d’avant (${NOMS_EFFET[copie.type]}).`, { sorte: 'effet' });
    evs.push({ kind: 'effet', cible: 'escouade', texte: 'Empreinte' });
  }
  // Surtension : le Porteur paie de ses PV la force en plus (jamais jusqu'à tomber)
  const st = de('surtension');
  const payeur = st ? s.porteurs.find((p) => p.id === g.porteur && p.pv > 1) : undefined;
  if (st && payeur) {
    const prix = Math.min(payeur.pv - 1, Math.max(1, Math.round(payeur.pvMax * st.cout)));
    payeur.pv -= prix;
    log(s, `Surtension : ${porteurDef(payeur.id).nom} brûle ${prix} PV, +${Math.round(st.part * 100)} % de force.`, { sorte: 'blessure', v: prix });
    evs.push({ kind: 'degats', cible: payeur.id, net: prix, absorbe: 0, source: 'surtension' });
  }
  // Rapt : tout le bouclier de l'ennemi visé passe à l'escouade, avant le coup
  if (de('rapt') && s.ennemi.pv > 0 && s.ennemi.bouclier > 0) {
    const pris = s.ennemi.bouclier;
    s.ennemi.bouclier = 0;
    s.bouclier += pris;
    log(s, `Rapt : ${pris} de bouclier arrachés à l’ennemi, pour l’escouade.`, { sorte: 'protection', v: pris });
    evs.push({ kind: 'bouclier', cible: 'escouade', v: pris });
  }
  // Lecture : la Fêlure de l'ennemi visé se brise, quelle que soit sa Fréquence (avant le coup : la Faille en profite déjà)
  if (de('lecture') && s.ennemi.pv > 0 && s.ennemi.felure !== undefined && !s.ennemi.felureBrisee) briser(s, s.ennemi, (ev) => evs.push(ev), suite >= 3);
  // Décharge (Moteur) : elle vide le Flux et gagne une part de force par Flux vidé (le facteur est lu avant de vider)
  const dc = de('decharge');
  const vide = dc ? s.flux : 0;
  // tous les multiplicateurs de la carte, ceux-là mêmes qu'affiche la loupe (detailForce)
  const facteurs = facteursGeste(s, g, mult, rang, s.chaine, eteinte, suite);
  if (dc && vide) {
    s.flux = 0;
    log(s, `Décharge : ${vide} Flux vidé${vide > 1 ? 's' : ''}, +${Math.round(dc.part * vide * 100)} % de force.`, { sorte: 'flux' });
    evs.push({ kind: 'effet', cible: 'escouade', texte: 'Décharge' });
  }
  const faveur = s.condition && FAVEUR_CONDITION[s.condition] === ligneeGeste(g) ? 1.2 : 1;
  const percant = !!de('percant');
  const force = facteurs.reduce((f, x) => f * x.m, g.v);

  /**
   * Un coup porté à l'ennemi visé : lignées, Fissure, Évanescent, Blindé et bouclier ennemi (Perçant passe outre), puis Épines.
   * depart : d'où part le coup, pour le journal (la force de la carte et ses facteurs, ou la Riposte)
   */
  const frapper = (force: number, quoi: string, depart: { base: number; lignes: CalculHisto['lignes'] }): number => {
    const coup = facteursCoup(s, g, mult, percant, effets);
    const av = coup.av;
    const dmg = Math.max(0, Math.round(coup.facteurs.reduce((f, x) => f * x.m, force)) - coup.blinde);
    const abs = percant ? 0 : Math.min(s.ennemi.bouclier, dmg);
    s.ennemi.bouclier -= abs;
    const net = dmg - abs;
    s.ennemi.pv = Math.max(0, s.ennemi.pv - net);
    const lignes = [...depart.lignes, ...coup.facteurs, ...(coup.blinde ? [{ nom: 'Blindé', v: -coup.blinde }] : []), ...(percant ? [{ nom: 'Perçant', v: 0 }] : [])];
    log(s, `${nomP} · ${quoi} : ${net} dégâts${av > 1 ? ' (avantage de lignée)' : ''}${abs ? `, ${abs} absorbés` : ''}${percant && s.ennemi.bouclier ? ', bouclier transpercé' : ''}.`,
      { sorte: 'coup', v: net, calculs: [calcul(ennemiDef(s.ennemi.id).nom, depart.base, lignes, dmg, abs, net)] });
    evs.push({ kind: 'degats', cible: 'ennemi', net, absorbe: abs, rang: s.ennemi.rang ?? 0 });
    // Épines : une part du coup revient au Porteur qui a frappé, sans jamais le mettre à terre
    const epines = trait(s.ennemi, 'epines');
    const frappeur = epines && net > 0 ? s.porteurs.find((p) => p.id === g.porteur && p.pv > 1) : undefined;
    if (epines && frappeur) {
      const retour = Math.min(frappeur.pv - 1, Math.max(1, Math.round(net * epines.part)));
      frappeur.pv -= retour;
      log(s, `Épines : ${porteurDef(frappeur.id).nom} se blesse (−${retour}).`, { camp: 'ennemi', sorte: 'blessure', v: retour });
      evs.push({ kind: 'degats', cible: frappeur.id, net: retour, absorbe: 0, source: 'epines' });
    }
    return net;
  };

  if (g.type === 'atk') {
    const net = frapper(force, g.nom, { base: g.v, lignes: facteurs });
    // Rafale (Cadence) : dans une chaîne d'au moins 4 cartes, elle frappe une seconde fois
    if (de('rafale') && s.chaine.length >= 4 && s.ennemi.pv > 0) {
      evs.push({ kind: 'effet', cible: 'ennemi', texte: 'Rafale', rang: s.ennemi.rang ?? 0 });
      frapper(force, `${g.nom} (Rafale)`, { base: g.v, lignes: facteurs });
    }
    const si = de('siphon');
    if (si && net > 0) {
      // le Siphon soigne le Porteur qui a joué la carte : c'est lui qui boit la vie (s'il est à terre, le plus blessé)
      const lui = s.porteurs.find((p) => p.id === g.porteur && p.pv > 0);
      const c = lui ?? plusBlesse(s);
      if (c) {
        const avant = c.pv;
        c.pv = Math.min(c.pvMax, c.pv + Math.round(net * si.part));
        if (c.pv > avant) {
          log(s, `Siphon : ${porteurDef(c.id).nom} récupère ${c.pv - avant} PV.`, { sorte: 'soin', v: c.pv - avant });
          evs.push({ kind: 'soin', cible: c.id, v: c.pv - avant });
        }
      }
    }
  } else if (g.type === 'bouclier') {
    const v = Math.round(force);
    s.bouclier += v;
    log(s, `${nomP} · ${g.nom} : bouclier d’escouade +${v}.`, { sorte: 'protection', v, calculs: [calcul('Escouade', g.v, facteurs, v, 0, v)] });
    evs.push({ kind: 'bouclier', cible: 'escouade', v });
    // Riposte (Carapace) : après son bouclier, elle frappe d'une part de tout le bouclier d'escouade, sans le dépenser
    const rp = de('riposte');
    if (rp && s.ennemi.pv > 0) {
      const lignes: CalculHisto['lignes'] = [{ nom: `Riposte (${Math.round(rp.part * 100)} % du bouclier)`, m: rp.part }];
      if (faveur !== 1) lignes.push({ nom: CONDITIONS[s.condition!]?.nom ?? 'Salle favorable', m: faveur });
      if (s.debride) lignes.push({ nom: 'Débridage', m: REGLES.eclat.debride });
      frapper(s.bouclier * rp.part * faveur * (s.debride ? REGLES.eclat.debride : 1), `${g.nom} (Riposte)`, { base: s.bouclier, lignes });
    }
  } else {
    // Relève : le premier Porteur à terre se relève avec tout le soin (sinon, la carte soigne normalement)
    const aTerre = de('releve') ? s.porteurs.find((p) => p.pv <= 0) : undefined;
    if (aTerre) {
      aTerre.pv = Math.max(1, Math.min(aTerre.pvMax, Math.round(force)));
      aTerre.aTerre = false;
      log(s, `Relève : ${porteurDef(aTerre.id).nom} se relève avec ${aTerre.pv} PV.`, { sorte: 'soin', v: aTerre.pv, calculs: [calcul(porteurDef(aTerre.id).nom, g.v, facteurs, aTerre.pv, 0, aTerre.pv)] });
      evs.push({ kind: 'soin', cible: aTerre.id, v: aTerre.pv });
    }
    const choisi = g.cible ? s.porteurs.find((p) => p.id === g.cible && p.pv > 0) : undefined;
    const cibles = aTerre ? [] : de('vague') || de('debord') ? vivants(s) : [choisi ?? plusBlesse(s)].filter((x): x is PorteurEtat => !!x);
    const morceaux: string[] = [];
    const calculs: CalculHisto[] = [];
    let total = 0;
    let trop = 0;
    for (const c of cibles) {
      const avant = c.pv;
      c.pv = Math.min(c.pvMax, c.pv + Math.round(force));
      morceaux.push(`${porteurDef(c.id).nom} +${c.pv - avant}`);
      // un soin ne dépasse pas les PV max : le journal dit ce qui a été perdu
      const perdu = Math.round(force) - (c.pv - avant);
      trop += perdu;
      calculs.push(calcul(porteurDef(c.id).nom, g.v, perdu > 0 ? [...facteurs, { nom: 'PV déjà pleins', v: -perdu }] : facteurs, c.pv - avant, 0, c.pv - avant));
      total += c.pv - avant;
      evs.push({ kind: 'soin', cible: c.id, v: c.pv - avant });
    }
    if (!cibles.length && !aTerre) evs.push({ kind: 'soin', cible: 'escouade', v: 0 });
    else if (cibles.length) log(s, `${nomP} · ${g.nom} : ${morceaux.join(', ')} PV.`, { sorte: 'soin', v: total, calculs });
    // Débord (Sève) : le soin en trop devient du bouclier d'escouade
    if (de('debord') && trop > 0) {
      s.bouclier += trop;
      log(s, `Débord : le soin en trop devient ${trop} de bouclier d’escouade.`, { sorte: 'protection', v: trop });
      evs.push({ kind: 'bouclier', cible: 'escouade', v: trop });
    }
  }

  // effets qui ne dépendent pas du type de la carte (les deux d'une carte de l’Héritage, dans l'ordre)
  for (const ef of effets) {
    if (ef?.type === 'flux') {
      const avant = s.flux;
      s.flux = Math.min(REGLES.fluxMax, s.flux + ef.v);
      if (s.flux > avant) {
        log(s, `Surcharge : Flux +${s.flux - avant}.`, { sorte: 'flux' });
        evs.push({ kind: 'flux', gain: s.flux - avant });
      }
    } else if (ef?.type === 'desarmer' && s.intention.type === 'atk') {
      const avant = s.intention.v;
      s.intention.v = Math.round(avant * (1 - ef.part));
      log(s, `Désarmé : sa prochaine attaque passe de ${avant} à ${s.intention.v}.`, { sorte: 'effet' });
      evs.push({ kind: 'effet', cible: 'ennemi', texte: 'Désarmé', rang: s.ennemi.rang ?? 0 });
    } else if (ef?.type === 'fissure' && s.ennemi.pv > 0) {
      s.ennemi.fissure = Math.max(s.ennemi.fissure ?? 0, ef.part);
      s.ennemi.fissureTours = 2;
      log(s, `Fissure : l’ennemi subit +${Math.round(ef.part * 100)} % de dégâts jusqu’au tour prochain.`, { sorte: 'effet' });
      evs.push({ kind: 'effet', cible: 'ennemi', texte: 'Fissure', rang: s.ennemi.rang ?? 0 });
    } else if (ef?.type === 'elan') {
      s.capaProchain = (s.capaProchain ?? 0) + 1;
      log(s, 'Élan : la prochaine chaîne aura une place de plus.', { sorte: 'effet' });
      evs.push({ kind: 'effet', cible: 'escouade', texte: 'Élan' });
    } else if (ef?.type === 'rempart') {
      s.garde = Math.max(s.garde ?? 0, ef.part);
      log(s, `Rempart : ${Math.round(ef.part * 100)} % du bouclier restant sera gardé au tour suivant.`, { sorte: 'effet' });
      evs.push({ kind: 'effet', cible: 'escouade', texte: 'Rempart' });
    }
  }
  return evs;
}

/**
 * Ce qui change la force d'une carte (27 octobre 2026, Luc et Bryan : afficher sur la carte ce qu'elle fera vraiment).
 * Un seul calcul sert au vrai coup (`appliquer`) et à la loupe (`detailForce`) : les deux ne peuvent pas se contredire.
 * L'ordre des facteurs est celui du calcul d'origine, pour garder exactement les mêmes arrondis.
 */
export interface Facteur { nom: string; m: number }

function facteursGeste(s: CombatEtat, g: Geste, mult: number, rang: number, chaine: Geste[], eteinte: boolean, suite: number): Facteur[] {
  const effets = effetsEnJeu(g, chaine, rang, eteinte);
  const de = <T extends Effet['type']>(t: T) => effets.find((e): e is Extract<Effet, { type: T }> => e?.type === t);
  const f: Facteur[] = [];
  const mettre = (nom: string, m: number) => { if (m !== 1) f.push({ nom, m }); };
  mettre(`Résonance (suite de ${suite})`, mult);
  mettre('Écho (trois Fréquences identiques)', multEcho(chaine, rang));
  // Crescendo : plus la carte arrive tard dans la chaîne, plus elle frappe fort
  const cr = de('crescendo');
  if (cr) mettre(`Crescendo (${rang + 1}e de la chaîne)`, 1 + cr.part * rang);
  // les conditions de salle : une lignée favorisée, une source qui renforce les soins
  if (s.condition && FAVEUR_CONDITION[s.condition] === ligneeGeste(g)) mettre(CONDITIONS[s.condition]?.nom ?? 'Salle favorable', 1.2);
  if (s.condition === 'sanctuaire' && g.type === 'soin') mettre(CONDITIONS.sanctuaire!.nom, 1.3);
  // Débridage (Coup d'éclat des Augmentés) : les coups de ce tour frappent plus fort
  if (s.debride && g.type === 'atk') mettre('Débridage', REGLES.eclat.debride);
  const dc = de('decharge');
  if (dc) mettre(`Décharge (${s.flux} Flux)`, 1 + dc.part * s.flux);
  // Unisson (Chœur) : une part de force en plus pour chaque autre carte de la même Fréquence dans la chaîne
  const un = de('unisson');
  if (un) {
    const fs = frequencesEffectives(chaine);
    const pareilles = fs.filter((x, k) => k !== rang && x === fs[rang]).length;
    mettre(`Unisson (${pareilles} même${pareilles > 1 ? 's' : ''} Fréquence${pareilles > 1 ? 's' : ''})`, 1 + un.part * pareilles);
  }
  // Empreinte (exclusive) sans rien à copier (en tête de chaîne, ou après une carte sans effet) : elle imite la force à la place
  if (!eteinte && g.effet?.type === 'empreinte' && !effets[0]) mettre('Empreinte (rien à copier)', REGLES.empreinteSeule);
  // Surtension (exclusive) : le Porteur paie de ses PV une part de force en plus
  const st = de('surtension');
  if (st) mettre('Surtension', 1 + st.part);
  if (eteinte) mettre('Porteur à terre', REGLES.eteinte);
  return f;
}

/**
 * Les effets d'une carte à sa place dans la chaîne (aucun si son Porteur est à terre). L'Empreinte (exclusive) prend l'effet
 * de la carte posée juste avant elle, sauf une Fréquence libre (elle changerait la suite) ou une autre Empreinte.
 */
export function effetsEnJeu(g: Pick<Geste, 'effet' | 'effet2'>, chaine: readonly Pick<Geste, 'effet'>[], rang: number, eteinte = false): (Effet | undefined)[] {
  if (eteinte) return [];
  return [g.effet, g.effet2].map((e) => {
    if (e?.type !== 'empreinte') return e;
    const copie = rang > 0 ? chaine[rang - 1]?.effet : undefined;
    return copie && !frequenceLibre(copie) && copie.type !== 'empreinte' ? copie : undefined;
  });
}

/** Ce que l'ennemi visé change à un coup : triangle des lignées, Fissure, Évanescent (en facteurs), Blindé (en points retirés) */
function facteursCoup(s: CombatEtat, g: Geste, mult: number, percant: boolean, effets: (Effet | undefined)[] = []): { facteurs: Facteur[]; blinde: number; av: number } {
  const e = ennemiDef(s.ennemi.id);
  const av = avantage(ligneeGeste(g), e.lignee);
  const facteurs: Facteur[] = [];
  if (av !== 1) facteurs.push({ nom: `Lignée : ${NOMS_LIGNEE[ligneeGeste(g)].nom} bat ${NOMS_LIGNEE[e.lignee].nom}`, m: av });
  if (s.ennemi.fissure) facteurs.push({ nom: 'Fissure', m: 1 + s.ennemi.fissure });
  // Curée (Traque) : l'ennemi fissuré est achevé plus fort ; Faille (Lecture) : de même quand sa Fêlure est brisée
  // la Curée vise une proie affaiblie : fissurée, ou sous la moitié de ses PV
  const curee = effets.find((x): x is Extract<Effet, { type: 'curee' }> => x?.type === 'curee');
  if (curee && (s.ennemi.fissure || s.ennemi.pv <= s.ennemi.pvMax / 2)) facteurs.push({ nom: s.ennemi.fissure ? 'Curée (ennemi fissuré)' : 'Curée (ennemi à moins de la moitié de ses PV)', m: 1 + curee.part });
  const faille = effets.find((x): x is Extract<Effet, { type: 'faille' }> => x?.type === 'faille');
  if (faille && s.ennemi.felureBrisee) facteurs.push({ nom: 'Faille (Fêlure brisée)', m: 1 + faille.part });
  // Évanescent : hors Résonance, l'ennemi ne prend qu'une part des coups
  const evan = trait(s.ennemi, 'evanescent');
  if (evan && mult <= 1) facteurs.push({ nom: 'Évanescent (hors Résonance)', m: 1 - evan.part });
  // Blindé : chaque coup perd quelques points (Perçant passe outre) ; l'armure grandit doucement avec la puissance de l'ennemi
  const blinde = percant ? 0 : Math.round((trait(s.ennemi, 'blinde')?.v ?? 0) * (1 + 0.4 * (s.ennemi.force - 1)));
  return { facteurs, blinde, av };
}

/** Ce qui change l'attaque d'un ennemi, pour le journal : sa concentration, sa Furie, l'usure du combat, la lignée, l'Ombre */
function facteursEnnemi(s: CombatEtat, en: EnnemiEtat, av: number, cible: string): Facteur[] {
  const f: Facteur[] = [];
  if (en.boost !== 1) f.push({ nom: 'Concentration', m: en.boost });
  if (trait(en, 'furie') && en.pv > 0 && en.pv <= en.pvMax / 2) f.push({ nom: 'Furie', m: FURIE });
  const usure = usureCombat(s).attaque;
  if (usure !== 1) f.push({ nom: `Combat qui s’éternise (tour ${s.tour})`, m: usure });
  if (av !== 1) f.push({ nom: `Lignée : ${NOMS_LIGNEE[ennemiDef(en.id).lignee].nom} bat ${NOMS_LIGNEE[porteurDef(cible).lignee].nom}`, m: av });
  if (s.ombre) f.push({ nom: 'Ombre agissante', m: 0 });
  return f;
}

/** Le détail d'une carte en combat : sa force de base, chaque bonus et malus, et le chiffre final */
export interface DetailForce {
  base: number;
  total: number;
  lignes: { nom: string; m?: number; v?: number }[];
  /** une carte de la main : le calcul suppose qu'elle est posée au bout de la chaîne */
  siPosee: boolean;
  /** le bouclier de l'ennemi visé, qui absorbera d'abord le coup (Perçant passe outre) */
  bouclierEnnemi: number;
}

/**
 * Ce que fera une carte de la main ou de la chaîne, avec le pourquoi. Posée, elle est calculée à sa place dans la chaîne ;
 * en main, comme si on la posait maintenant au bout. Mêmes règles que `lancer` (Résonance, Écho ancien, Dissonance…).
 * Simplification assumée : l'ennemi visé est celui de maintenant (si un coup plus tôt dans la chaîne l'abat, le reste passe au suivant).
 */
export function detailForce(s: CombatEtat, uid: string): DetailForce | null {
  let rang = s.chaine.findIndex((x) => x.uid === uid);
  const siPosee = rang < 0;
  const g = siPosee ? s.main.find((x) => x.uid === uid) : s.chaine[rang];
  if (!g || g.vide) return null;
  const chaine = siPosee ? [...s.chaine, g] : s.chaine;
  if (siPosee) rang = chaine.length - 1;
  const analyse = analyserChaine(chaine);
  const brut = s.condition === 'echo' && analyse.suite === 4 ? { ...analyse, mult: REGLES.multSuite[5]! } : analyse;
  const a = s.dissonance || s.sansResonance ? { ...brut, suite: 0, mult: 1 } : brut;
  const eteinte = estATerre(s, g.porteur);
  const facteurs = facteursGeste(s, g, a.mult, rang, chaine, eteinte, a.suite);
  const force = facteurs.reduce((f, x) => f * x.m, g.v);
  const lignes: DetailForce['lignes'] = [...facteurs];
  let total = Math.round(force);
  let bouclierEnnemi = 0;
  if (g.type === 'atk') {
    const effets = effetsEnJeu(g, chaine, rang, eteinte);
    const percant = effets.some((e) => e?.type === 'percant');
    const coup = facteursCoup(s, g, a.mult, percant, effets);
    lignes.push(...coup.facteurs);
    if (coup.blinde) lignes.push({ nom: 'Blindé', v: -coup.blinde });
    total = Math.max(0, Math.round(coup.facteurs.reduce((f, x) => f * x.m, force)) - coup.blinde);
    bouclierEnnemi = percant ? 0 : s.ennemi.bouclier;
  }
  return { base: g.v, total, lignes, siPosee, bouclierEnnemi };
}

/**
 * Fuir un combat (décision du 22 octobre 2026) : l'attaque que l'ennemi annonçait touche l'escouade pendant qu'elle s'enfuit.
 * Rien si l'ennemi ne préparait pas d'attaque. Même calcul que son vrai tour (élan, triangle des lignées), et le bouclier
 * de l'escouade protège encore. Un Porteur peut finir à terre, jamais plus : personne ne meurt dans EMPREINTES.
 * Ne modifie pas l'état : renvoie les PV d'après le coup, et les coups portés (pour l'animation).
 */
export function coupDeFuite(s: CombatEtat): { porteurs: PorteurEtat[]; coups: { id: string; net: number; absorbe: number }[]; attaque: string | null } {
  const porteurs = s.porteurs.map((p) => ({ ...p }));
  let bouclier = s.bouclier;
  const coups: { id: string; net: number; absorbe: number }[] = [];
  const noms: string[] = [];
  const ennemis = ennemisDebout(s);
  const protege = protegeDe(s);
  for (const [i, en] of ennemis.entries()) {
    const it = intentionDe(s, en);
    if (it.type !== 'atk') continue;
    const reserve = reservePour(s, protege, ennemis.slice(i + 1));
    const e = ennemiDef(en.id);
    const debout = porteurs.filter((p) => p.pv > 0);
    let cibles: PorteurEtat[];
    if (it.zone) cibles = ordreZone(s, debout);
    else {
      const visee = it.cibleId ? debout.find((p) => p.id === it.cibleId) : undefined;
      cibles = visee ? [visee] : debout.slice(0, 1);
    }
    for (const c of cibles) {
      const dmg = Math.round(it.v * puissance(en) * usureCombat(s).attaque * avantage(e.lignee, porteurDef(c.id).lignee));
      const absorbe = Math.min(bouclierPour(bouclier, c.id, protege, reserve), dmg);
      bouclier -= absorbe;
      const net = dmg - absorbe;
      c.pv = Math.max(0, c.pv - net);
      if (c.pv <= 0) c.aTerre = true;
      coups.push({ id: c.id, net, absorbe });
    }
    noms.push(it.nom);
  }
  return { porteurs, coups, attaque: noms.length ? noms.join(', ') : null };
}

function tourEnnemi(s: CombatEtat, emettre: (ev: Evenement) => void) {
  CAMP = 'neutre';
  if (s.condition === 'eboulis') {
    // Éboulis : des pierres sur tout le monde, sans mettre personne à terre ni achever un ennemi
    const v = eboulis(s);
    let escouade = 0;
    let ennemis = 0;
    for (const p of vivants(s)) { const n = Math.min(v, p.pv - 1); if (n > 0) { p.pv -= n; escouade += n; emettre({ kind: 'degats', cible: p.id, net: n, absorbe: 0, source: 'eboulis' }); } }
    for (const en of ennemisDebout(s)) { const n = Math.min(v, en.pv - 1); if (n > 0) { en.pv -= n; ennemis += n; emettre({ kind: 'degats', cible: 'ennemi', net: n, absorbe: 0, rang: en.rang ?? 0, source: 'eboulis' }); } }
    log(s, `Éboulis : des pierres tombent (−${v} chacun).`, { sorte: 'blessure', v: escouade });
    if (ennemis) log(s, `Les pierres frappent aussi ${enGroupe(s) ? 'le groupe' : ennemiDef(s.ennemi.id).nom} (−${ennemis}).`, { sorte: 'coup', v: ennemis });
  }
  CAMP = 'ennemi';
  const groupe = enGroupe(s);
  // le protégé proposé est fixé pour tout le tour : il ne change pas au fil des coups
  s.protege = protegeDe(s);
  const ennemis = ennemisDebout(s);
  for (const [i, en] of ennemis.entries()) {
    if (!vivants(s).length) break;
    if (groupe) emettre({ kind: 'ennemi-agit', rang: en.rang ?? 0 });
    // le bouclier garde de quoi couvrir les coups qui attendent encore le protégé
    RESERVE = reservePour(s, protegeDe(s), ennemis.slice(i + 1).filter((x) => x.pv > 0));
    agir(s, en, intentionDe(s, en), emettre);
  }
  RESERVE = 0;
  for (const p of s.porteurs) {
    if (p.pv <= 0 && !p.aTerre) {
      // Seconde chance (Sasha) : le premier qui tombe se relève, une fois par combat
      if (s.releve && !s.releveFaite) {
        s.releveFaite = true;
        p.pv = Math.max(1, Math.round(p.pvMax * s.releve));
        log(s, `Seconde chance : ${porteurDef(p.id).nom} se relève (${p.pv} PV).`, { camp: 'neutre', sorte: 'soin', v: p.pv });
        emettre({ kind: 'soin', cible: p.id, v: p.pv });
        continue;
      }
      p.aTerre = true;
      log(s, `${porteurDef(p.id).nom} est à terre : ses cartes s’éteignent (−15 % de force, sans effet).`, { camp: 'neutre', sorte: 'terre' });
      emettre({ kind: 'a-terre', cible: p.id });
    }
  }
  if (!vivants(s).length) {
    s.issue = 'defaite';
    emettre({ kind: 'fin', issue: 'defaite' });
    return;
  }
  // Nuit blanche (Joss) : il veille sur les siens comme le quartier l'a veillé
  if (s.veille && usureCombat(s).soins > 0) {
    const blesse = vivants(s).filter((p) => p.pv < p.pvMax).sort((a, b) => a.pv / a.pvMax - b.pv / b.pvMax)[0];
    if (blesse) {
      const avant = blesse.pv;
      blesse.pv = Math.min(blesse.pvMax, blesse.pv + Math.max(1, Math.round(blesse.pvMax * s.veille * usureCombat(s).soins)));
      log(s, `Nuit blanche : Joss veille sur ${porteurDef(blesse.id).nom} (+${blesse.pv - avant}).`, { camp: 'neutre', sorte: 'soin', v: blesse.pv - avant });
      emettre({ kind: 'soin', cible: blesse.id, v: blesse.pv - avant });
    }
  }
  // Rempart (et la Marque de Docker) : une part du bouclier restant passe au tour suivant
  const part = Math.max(s.garde ?? 0, s.gardeMarque ?? 0);
  const garde = Math.round(s.bouclier * part);
  if (garde) log(s, `${(s.garde ?? 0) >= part ? 'Rempart' : 'Bras de quai'} : ${garde} de bouclier gardés.`, { camp: 'neutre', sorte: 'effet' });
  s.bouclier = garde;
  s.garde = 0;
  delete s.protege;
  s.ombre = false;
  s.tour++;
  for (const en of ennemisDebout(s)) choisirIntention(s, en);
  piocher(s);
  fixerFelures(s);
}

// ---------- Les Coups d'éclat (25 octobre 2026) ----------
// Quand le Flux est plein, un Porteur peut déclencher le coup de sa lignée, une seule fois par combat pour toute
// l'escouade : le Flux se vide, et il le paiera en Usure au retour. Garder son Flux ou le dépenser, c'est le dilemme.

export const ECLATS: Record<Lignee, { nom: string; texte: string }> = {
  tech: { nom: 'Débridage', texte: `Les coups de ta chaîne frappent ${REGLES.eclat.debride * 100 - 100} % plus fort ce tour-ci.` },
  bio: { nom: 'Sursaut', texte: 'Toute l’escouade récupère 40 % de ses PV, et un Porteur à terre se relève.' },
  reso: { nom: 'Ombre agissante', texte: 'Aucune attaque ennemie ne porte au prochain tour ennemi.' },
};

/** Les Coups d'éclat qu'on peut déclencher maintenant : un par lignée, porté par le premier Porteur debout de cette lignée */
export function eclatsPossibles(s: CombatEtat): { porteur: string; lignee: Lignee }[] {
  if (s.issue !== 'en-cours' || s.eclat || s.flux < REGLES.fluxMax) return [];
  const r: { porteur: string; lignee: Lignee }[] = [];
  for (const p of vivants(s)) {
    const l = porteurDef(p.id).lignee;
    if (!r.some((x) => x.lignee === l)) r.push({ porteur: p.id, lignee: l });
  }
  return r;
}

/** Déclenche le Coup d'éclat d'un Porteur. Renvoie les pas à animer (vide si c'est impossible). */
export function eclater(s: CombatEtat, porteurId: string, opts: { silencieux?: boolean } = {}): Pas[] {
  const pas: Pas[] = [];
  const choix = eclatsPossibles(s).find((x) => x.porteur === porteurId);
  if (!choix) return pas;
  const emettre = opts.silencieux ? () => {} : (ev: Evenement) => { pas.push({ ev, etat: photo(s) }); };
  CAMP = 'joueur';
  s.flux = 0;
  s.eclat = choix;
  const p = porteurEtat(s, porteurId)!;
  p.usureEclat = (p.usureEclat ?? 0) + REGLES.eclat.usure;
  const nom = porteurDef(porteurId).nom;
  emettre({ kind: 'effet', cible: porteurId, texte: ECLATS[choix.lignee].nom });
  if (choix.lignee === 'tech') {
    s.debride = true;
    log(s, `Débridage : ${nom} pousse ses implants au-delà du raisonnable. La chaîne frappera ${REGLES.eclat.debride * 100 - 100} % plus fort.`, { sorte: 'effet' });
  } else if (choix.lignee === 'reso') {
    s.ombre = true;
    log(s, `Ombre agissante : l’ombre de ${nom} se lève et retiendra les coups du prochain tour.`, { sorte: 'effet' });
  } else {
    const aTerre = s.porteurs.find((x) => x.pv <= 0);
    if (aTerre) {
      aTerre.pv = Math.max(1, Math.round(aTerre.pvMax * REGLES.eclat.sursaut));
      aTerre.aTerre = false;
      emettre({ kind: 'soin', cible: aTerre.id, v: aTerre.pv });
    }
    let total = aTerre ? aTerre.pv : 0;
    for (const c of vivants(s)) {
      if (c === aTerre) continue;
      const avant = c.pv;
      c.pv = Math.min(c.pvMax, c.pv + Math.round(c.pvMax * REGLES.eclat.sursaut));
      total += c.pv - avant;
      if (c.pv > avant) emettre({ kind: 'soin', cible: c.id, v: c.pv - avant });
    }
    log(s, `Sursaut : le corps de ${nom} répond pour tous.${aTerre ? ` ${porteurDef(aTerre.id).nom} se relève.` : ''}`, { sorte: 'soin', v: total });
  }
  return pas;
}

// ---------- La Fêlure (25 octobre 2026) ----------
// Chaque tour, chaque ennemi montre une Fréquence fêlée. Une carte de cette Fréquence, posée dans la chaîne pendant
// qu'il est visé, brise son intention (attaque, bouclier ou soin réduits de moitié, d'un quart chez un gardien ou un blindé) ;
// si la chaîne fait aussi une Résonance, elle remplit le Flux.
// Deux fois sur trois, la Fréquence fêlée est l'une de celles de la main : jouable, pas automatique.
// Un évanescent la cache (elle n'est pas affichée, mais existe) ; la Vigie aspire le Flux quand son coup passe le bouclier.

export const estGardien = (id: string) => ZONES.some((z) => z.boss === id);
/** La Fêlure d'un ennemi est-elle visible ? (cachée chez les évanescents tant qu'elle n'est pas brisée) */
export const felureVisible = (en: EnnemiEtat) => en.felure !== undefined && (!!en.felureBrisee || !trait(en, 'evanescent'));

function fixerFelures(s: CombatEtat) {
  const r = tireur(s);
  const enMain = [...new Set(s.main.flatMap((g) => (frequenceLibre(g.effet) || g.vide ? [] : g.fs ?? [g.f])))];
  for (const en of tousEnnemis(s)) {
    delete en.felureBrisee;
    if (en.pv <= 0 || en.simple) { delete en.felure; continue; }
    en.felure = enMain.length && r.nombre() < REGLES.felure.chanceMain ? enMain[r.entier(enMain.length)]! : 1 + r.entier(9);
  }
}

/** La part retirée à l'intention quand la Fêlure se brise : les gardiens et les blindés résistent mieux (un quart seulement) */
export const partFelure = (en: EnnemiEtat) => (estGardien(en.id) || trait(en, 'blinde') ? REGLES.felure.partGardien : REGLES.felure.part);

/** La Fréquence fêlée d'un ennemi est touchée : son intention se brise ; le Flux monte si la chaîne résonne */
function briser(s: CombatEtat, en: EnnemiEtat, emettre: (ev: Evenement) => void, resonne: boolean) {
  // chez un évanescent, la Fêlure était cachée : le joueur la découvre au moment où elle se brise (27 octobre 2026)
  const trouvee = !felureVisible(en);
  en.felureBrisee = true;
  const it = intentionDe(s, en);
  const part = partFelure(en);
  const nom = ennemiDef(en.id).nom;
  const titre = trouvee ? 'Fêlure trouvée' : 'Fêlure';
  let retire = 0;
  if (it.type === 'atk' || it.type === 'bouclier' || it.type === 'soin') {
    const avant = it.v;
    it.v = Math.round(avant * (1 - part));
    // ce que le joueur verra vraiment en moins (l'attaque compte la concentration, la Furie et l'usure)
    const force = it.type === 'atk' ? puissance(en) * usureCombat(s).attaque : 1;
    retire = Math.round(avant * force) - Math.round(it.v * force);
    log(s, `${titre} : ${nom} vacille, ${it.type === 'atk' ? 'son attaque' : it.type === 'bouclier' ? 'son bouclier' : 'son soin'} passe de ${avant} à ${it.v}.`, { sorte: 'effet' });
  } else log(s, `${titre} : ${nom} vacille, mais ce qu’il prépare ne change pas.`, { sorte: 'effet' });
  emettre({ kind: 'effet', cible: 'ennemi', texte: retire > 0 ? `${titre} −${retire}` : titre, rang: en.rang ?? 0 });
  if (!resonne) return;
  const avant = s.flux;
  s.flux = Math.min(REGLES.fluxMax, s.flux + REGLES.felure.flux + (s.felureFlux ?? 0));
  if (s.flux > avant) {
    log(s, `Fêlure brisée en Résonance : Flux +${s.flux - avant}.`, { sorte: 'flux' });
    emettre({ kind: 'flux', gain: s.flux - avant });
  }
}

/** Ce que fait un ennemi à son tour */
function agir(s: CombatEtat, en: EnnemiEtat, it: Intention, emettre: (ev: Evenement) => void) {
  const e = ennemiDef(en.id);
  const rang = en.rang ?? 0;
  en.bouclier = 0;
  if (it.type === 'bouclier') {
    en.bouclier = it.v;
    log(s, `${e.nom} se protège : bouclier ${it.v}.`, { sorte: 'ennemi-garde', v: it.v });
    emettre({ kind: 'bouclier', cible: 'ennemi', v: it.v, rang });
  } else if (it.type === 'boost') {
    en.boost = 2;
    log(s, `${e.nom} se concentre. Sa prochaine attaque fera double dégâts.`, { sorte: 'effet' });
    emettre({ kind: 'boost', rang });
  } else if (it.type === 'soin') {
    const avant = en.pv;
    en.pv = Math.min(en.pvMax, en.pv + Math.round(it.v * usureCombat(s).soins));
    log(s, `${e.nom} · ${it.nom} : +${en.pv - avant} PV.`, { sorte: 'ennemi-soin', v: en.pv - avant });
    emettre({ kind: 'soin', cible: 'ennemi', v: en.pv - avant, rang });
  } else if (it.type === 'dissonance' && s.lucide) {
    log(s, `${e.nom} · ${it.nom} : Véla lit le brouillage, tes Fréquences restent nettes.`, { sorte: 'effet' });
    emettre({ kind: 'effet', cible: 'escouade', texte: 'Lucide' });
  } else if (it.type === 'dissonance') {
    s.dissonance = true;
    log(s, `${e.nom} · ${it.nom} : tes Fréquences sont brouillées, pas de Résonance au prochain tour.`, { sorte: 'effet' });
    emettre({ kind: 'effet', cible: 'escouade', texte: 'Dissonance' });
  } else {
    let cibles: PorteurEtat[];
    if (it.zone) cibles = ordreZone(s, vivants(s));
    else {
      const visee = it.cibleId ? porteurEtat(s, it.cibleId) : undefined;
      const id = visee && visee.pv > 0 ? visee.id : choisirCible(s);
      cibles = id ? [porteurEtat(s, id)!] : [];
    }
    const morceaux: string[] = [];
    const calculs: CalculHisto[] = [];
    const renvois: { texte: string; info: Partial<LigneHisto> }[] = [];
    let total = 0;
    for (const c of cibles) {
      // Ombre agissante (Coup d'éclat des Résonants) : l'ombre retient le coup
      const av = avantage(e.lignee, porteurDef(c.id).lignee);
      const dmg = s.ombre ? 0 : Math.round(it.v * puissance(en) * usureCombat(s).attaque * av);
      const abs = Math.min(bouclierPour(s.bouclier, c.id, protegeDe(s), RESERVE), dmg);
      s.bouclier -= abs;
      const net = dmg - abs;
      c.pv = Math.max(0, c.pv - net);
      total += net;
      morceaux.push(`${porteurDef(c.id).nom} ${net ? '−' + net : 'protégé'}`);
      calculs.push(calcul(porteurDef(c.id).nom, it.v, facteursEnnemi(s, en, av, c.id), dmg, abs, net));
      emettre({ kind: 'degats', cible: c.id, net, absorbe: abs, rang, ...(it.zone ? { zone: true } : {}) });
      // Née-de-mue (Kessa) : la chitine renvoie une part du coup que le bouclier a pris (sans achever l'ennemi)
      if (s.chitine && abs > 0 && en.pv > 1) {
        const renvoi = Math.min(en.pv - 1, Math.max(1, Math.round(abs * s.chitine)));
        en.pv -= renvoi;
        renvois.push({ texte: `Née-de-mue : la chitine renvoie ${renvoi} à ${e.nom}.`, info: { camp: 'neutre', sorte: 'coup', v: renvoi } });
        emettre({ kind: 'degats', cible: 'ennemi', net: renvoi, absorbe: 0, rang, source: 'epines' });
      }
    }
    en.boost = 1;
    const aspire = trait(en, 'aspire');
    // seulement si au moins 1 dégât passe le bouclier (27 octobre 2026, Bryan : bloquer doit protéger le Flux)
    if (aspire && !s.ombre && total > 0 && s.flux > 0) {
      const pris = Math.min(s.flux, aspire.v);
      s.flux -= pris;
      renvois.push({ texte: `${e.nom} aspire ${pris} Flux.`, info: { sorte: 'flux' } });
      emettre({ kind: 'effet', cible: 'escouade', texte: 'Flux aspiré' });
    }
    // le coup d'abord, puis ce qu'il déclenche (même ordre dans le journal que dans l'animation)
    log(s, s.ombre ? `${e.nom} · ${it.nom} : l’ombre retient le coup.` : `${e.nom} · ${it.nom} : ${morceaux.join(', ')}.`, { sorte: 'blessure', v: total, calculs });
    for (const r of renvois) log(s, r.texte, r.info);
  }
  // Régénération : il regagne une part de ses PV à la fin de son tour
  const regen = trait(en, 'regeneration');
  if (regen && en.pv > 0 && en.pv < en.pvMax && usureCombat(s).soins > 0) {
    const avant = en.pv;
    en.pv = Math.min(en.pvMax, en.pv + Math.max(1, Math.round(en.pvMax * regen.part * usureCombat(s).soins)));
    log(s, `${e.nom} se régénère (+${en.pv - avant}).`, { sorte: 'ennemi-soin', v: en.pv - avant });
    emettre({ kind: 'soin', cible: 'ennemi', v: en.pv - avant, rang });
  }
}

/** Un ennemi surgit en cours de combat (rejeton d'un essaim, renfort d'un gardien) : le combat devient un groupe */
function invoquer(s: CombatEtat, id: string, part: number, emettre: (ev: Evenement) => void) {
  const tous = tousEnnemis(s);
  if (ennemisDebout(s).length >= 4) return;
  if (s.ennemi.rang === undefined) s.ennemi.rang = 0;
  s.autres ??= [];
  const rang = Math.max(...tous.map((e) => e.rang ?? 0)) + 1;
  const force = (s.forceBase ?? s.ennemi.force) * part;
  const pv = Math.max(1, Math.round(ennemiDef(id).pvMax * force));
  const en: EnnemiEtat = { id, pv, pvMax: pv, force, bouclier: 0, etape: 0, boost: 1, rang, rejeton: true };
  s.autres.push(en);
  choisirIntention(s, en);
  log(s, `${ennemiDef(id).nom} surgit.`, { camp: 'ennemi', sorte: 'info' });
  emettre({ kind: 'renfort', rang, id });
}

/** Un ennemi tombe : l'essaim laisse un rejeton, les vengeurs s'enragent */
function tombe(s: CombatEtat, en: EnnemiEtat, emettre: (ev: Evenement) => void) {
  const essaim = trait(en, 'essaim');
  if (essaim && !en.rejeton) invoquer(s, en.id, essaim.part, emettre);
  for (const autre of ennemisDebout(s)) {
    if (autre !== en && trait(autre, 'vengeur') && autre.boost < 2) {
      autre.boost = 2;
      log(s, `${ennemiDef(autre.id).nom} venge son allié : sa prochaine attaque est doublée.`, { camp: 'ennemi', sorte: 'effet' });
      emettre({ kind: 'boost', rang: autre.rang ?? 0 });
    }
  }
}

/** Gardien à deux phases : sous son seuil de PV, il change de gestes et appelle des renforts */
function phaseGardien(s: CombatEtat, en: EnnemiEtat, emettre: (ev: Evenement) => void) {
  const ph = ennemiDef(en.id).phase;
  if (!ph || en.simple || en.phase2 || en.pv <= 0 || en.pv > en.pvMax * ph.seuil) return;
  en.phase2 = true;
  en.etape = 0;
  log(s, `${ennemiDef(en.id).nom} : ${ph.nom}. ${ph.texte}`, { camp: 'ennemi', sorte: 'info' });
  emettre({ kind: 'phase', rang: en.rang ?? 0, id: en.id, nom: ph.nom });
  choisirIntention(s, en);
  for (const id of ph.renforts ?? []) invoquer(s, id, 0.25, emettre);
}
