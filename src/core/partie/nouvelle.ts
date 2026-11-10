// Couche 7 — une nouvelle partie, les décisions de la campagne, et la mise à jour des anciennes sauvegardes.
// Fonctions pures : le temps est toujours passé en paramètre (`now`, en ms).

import { PORTEURS, CARTE_CHAMBRE, MODULES, estCarteConnue, moduleDe, moduleDef, porteurDef, CARTES_DE_BASE, COLLECTION_DEPART, DEPART_PORTEURS, carteId } from '../donnees';
import { COLLECTION, doublonsRequis, niveauRequis, poidsCarte } from '../collection';
import { graine } from '../rng';
import { nbFoyers, DISTRICT, VERSION_JEU, XP, xpPourNiveau, chargeMax, chargePortee, enExpedition, confier, niveauConfiance, strateVaincue, jourDe, log, niveauPorteur, non, porteursPresents, semaineDe, type FinCampagne, type GardeChambre, type Jeu, type LectureVela, type PorteurDistrict, type Resultat, typeDuJour } from './etat';
import { SCENES, sceneEnAttente, type ContexteCampagne } from '../campagne';
import { ESCOUADE_DEPART } from './descentes';
import { accorderSeance, comptoirVide } from './district';
import { OBJECTIFS } from './objectifs';
import { ORDRE_FAMILLES } from '../fragments';
import { FAMILLES_DEPART, FAMILLES_DISTRICT, familleDuFragment } from '../familles';
import { SECTEURS } from '../digue';
import { donnerKitRecrues, recompenserLecture } from './recompenses';
import { rattraperCartesFleche } from './fleche';
import { t } from '../i18n';

const DECISION_CHAMBRE: { titre: string; texte: string; options: { id: GardeChambre; nom: string; phrase: string; effet: string }[] } = {
  titre: t('Qui garde la chambre ?'),
  texte: t('La Confluence est tombée, et tout Vertiga parle de la chambre aux empreintes mêlées. Les Brigades du Serment de Veyr sont au pied de la Tour, les Veilleurs de Sédime demandent à l’étudier, et le quartier attend ta décision.'),
  options: [
    { id: 'orseve', nom: t('La Maison Orsève'), phrase: t('Nous n’héritons pas du pouvoir. Nous héritons de la responsabilité de le contenir.'),
      effet: t('Les Brigades sécurisent la chambre et ne te barrent plus la route dans les Strates. Les Hauts paient : +1 Éclat sur chaque gardien vaincu.') },
    { id: 'district', nom: t('Le district seul'), phrase: t('Ce qui est sous notre digue est à nous.'),
      effet: t('Le quartier se mobilise : +20 % de minerai à chaque expédition. Mais les Brigades contestent, et tu les croiseras dans les salles closes.') },
    { id: 'commission', nom: t('Une commission avec les Veilleurs'), phrase: t('Nous ne sommes pas les propriétaires du passé. Nous sommes les prochains à pouvoir le perdre.'),
      effet: t('Les Veilleurs partagent leurs fouilles : 25 % de chances de carte par combat au lieu de 20 %.') },
  ],
};

const DECISION_LECTURE: { titre: string; texte: string; options: { id: LectureVela; nom: string; phrase: string; effet: string }[] } = {
  titre: t('La dernière lecture'),
  texte: t('Sous les salles closes, les cristaux d’un même individu portent des souvenirs qui se contredisent. Véla pense pouvoir lire jusqu’au bout ce qu’ils cachent. Elle sait que son lien avec son empreinte pourrait ne pas y survivre. Elle attend ton accord.'),
  options: [
    { id: 'autoriser', nom: t('Autoriser la lecture'), phrase: t('Une empreinte ne ment jamais. C’est nous qui la lisons mal.'),
      effet: t('Véla gagne une carte unique, Lecture profonde (Fréquence libre, forte attaque), en plus de ses 6 cartes. Son lien s’effiloche : −4 PV pour de bon.') },
    { id: 'refuser', nom: t('Refuser, la protéger'), phrase: t('On n’entre pas deux fois chez quelqu’un sans y être invité.'),
      effet: t('Véla garde son empreinte intacte et reprend des forces : +4 PV pour de bon. Ce que cachent les cristaux attendra.') },
  ],
};

const DECISION_FIN: { titre: string; texte: string; options: { id: FinCampagne; nom: string; phrase: string; effet: string }[] } = {
  titre: t('La vérité'),
  texte: t('Le Premier Porteur est tombé, et son registre parle enfin : une autre civilisation s’est perdue en se gravant des empreintes, et ses premiers porteurs l’avaient écrit dès le début. Ces mêmes empreintes ont pourtant sauvé l’humanité après la Fonte. Le système qui les tient stables s’use. Il faut décider de ce qu’on en fait.'),
  options: [
    { id: 'scellement', nom: t('Le Grand Scellement'), phrase: t('Certaines vérités doivent rester enfouies.'),
      effet: t('Les empreintes anciennes sont scellées à nouveau. Moins de risques : les ennemis perdent 10 % de leur force. Du savoir perdu : plus aucune carte en nacre ne tombe.') },
    { id: 'pacte', nom: t('Le Pacte des empreintes'), phrase: t('Nous héritons de la responsabilité de les contenir, ensemble.'),
      effet: t('Leur contrôle est partagé entre les Hauts et les districts. Une paix fragile : +10 % de minerai. Une nouvelle bureaucratie : les chantiers durent 25 % plus longtemps.') },
    { id: 'archives', nom: t('Les Archives ouvertes'), phrase: t('Une empreinte n’est qu’une donnée. Elle n’a rien de sacré.'),
      effet: t('Tout est révélé et accessible à tous. Plus de liberté : deux fois plus de cartes en nacre. Des accidents de greffe : l’Usure en plus d’un Porteur à terre ou d’une fuite augmente de moitié.') },
  ],
};

export const DECISIONS = { chambre: DECISION_CHAMBRE, lecture: DECISION_LECTURE, fin: DECISION_FIN } as const;

export type Acte = keyof typeof DECISIONS;

/**
 * Une décision de campagne attend le joueur, dès le gardien qui ferme l'acte vaincu (25 octobre 2026 : avant, elle attendait
 * l'ouverture de l'étage suivant, loin de la scène qui l'amène) : l'acte I après la Strate −3, l'acte II après −6, l'acte III après −10.
 */
export function decisionEnAttente(j: Jeu): Acte | null {
  if (!j.chambre) return null;
  const v = strateVaincue(j);
  if (v >= 3 && !j.actes.chambre) return 'chambre';
  if (v >= 6 && !j.actes.lecture) return 'lecture';
  if (v >= 10 && !j.actes.fin) return 'fin';
  return null;
}

// ---------- La campagne vécue (campagne.ts) ----------

export const contexteCampagne = (j: Jeu): ContexteCampagne => ({ strate: j.strate, vaincue: strateVaincue(j), actes: j.actes, presents: porteursPresents(j), drapeaux: j.drapeaux ?? [], choixHaltes: j.choixHaltes ?? {} });

/** La scène de la campagne à jouer maintenant, au district (jamais pendant une descente, ni avant la chambre) */
export const sceneCampagne = (j: Jeu) => (j.chambre && !j.expedition ? sceneEnAttente(contexteCampagne(j), j.scenes ?? []) : null);

/** Une scène jouée (ou passée) : elle ne revient plus d'elle-même, mais se revoit dans la Bibliothèque */
export function voirScene(j: Jeu, id: string): boolean {
  if (!SCENES.some((s) => s.id === id) || (j.scenes ??= []).includes(id)) return false;
  j.scenes.push(id);
  return true;
}

export function decider(j: Jeu, acte: string, choix: string): Resultat {
  const d = DECISIONS[acte as Acte];
  if (!d) return non(t('Décision inconnue.'));
  const o = (d.options as readonly { id: string; nom: string }[]).find((x) => x.id === choix);
  if (!o) return non(t('Choix inconnu.'));
  if (j.actes[acte as Acte]) return non(t('La décision est déjà prise.'));
  (j.actes as Record<string, string>)[acte] = o.id;
  if (acte === 'chambre') confier(j, o.id === 'district' ? 10 : o.id === 'commission' ? 5 : 0);
  log(j, acte === 'chambre' ? t`La chambre est confiée à : ${o.nom}.` : acte === 'lecture' ? t`Véla : ${o.nom.toLowerCase()}.` : t`Fin de la campagne : ${o.nom}. Les Strates continuent.`);
  return { ok: true, message: t`Décision prise : ${o.nom}.` };
}

export const deciderChambre = (j: Jeu, choix: string) => decider(j, 'chambre', choix);

export function nouveauJeu(now: number, rng = graine()): Jeu {
  const porteurs: Record<string, PorteurDistrict> = {};
  for (const p of PORTEURS) porteurs[p.id] = { usure: 0, poste: null, modules: (DEPART_PORTEURS[p.id] ?? []).map((id) => carteId(id, 'fer')) };
  return {
    version: VERSION_JEU,
    energie: DISTRICT.depart.energie,
    composants: DISTRICT.depart.composants,
    batiments: { noyau: 1, generateur: 1, forge: 1, clinique: 1, comptoir: 0, cercle: 0 },
    porteurs,
    forge: null,
    strate: 1,
    dernierTick: now,
    expedition: null,
    journal: [t('Tu viens d’être élu à la tête du district. La digue t’attend.')],
    introVue: false,
    chambre: false,
    recrues: false,
    arrives: [],
    actes: {},
    confiance: 0,
    confianceV: 2,
    // les ouvriers qui ont envoyé Ilka chercher le directeur (7 novembre 2026 : des familles nommées)
    foyers: FAMILLES_DEPART.map((f) => f.id),
    xpV: 2,
    decouvertes: [],
    scenes: [],
    objectif: 0,
    fragments: [],
    lus: [],
    luesRecompensees: [],
    kitRecrues: false,
    ravitaillement: { jour: jourDe(now), reserve: 1, ouverts: 0 },
    eclats: 0,
    collection: Object.fromEntries(COLLECTION_DEPART.map((id) => [id, { niveau: 1, doublons: 0 }])),
    sans: { argent: 0, or: 0, nacre: 0 },
    rng,
    chantiers: [],
    choix: [],
    quotidien: { jour: jourDe(now), reserve: 1, type: typeDuJour(jourDe(now)), progres: 0 },
    archive: { semaine: semaineDe(now), points: 0, aOuvrir: 0 },
    missions: [],
    rapports: [],
    epreuves: { semaine: semaineDe(now), faites: [] },
    creuseurs: 0,
    frontVaincu: false,
    comptoir: comptoirVide(now, rng),
    escouade: [...ESCOUADE_DEPART],
    escouades: [[...ESCOUADE_DEPART], [], []],
    escouadeActive: 0,
    fils: {},
    // l'escouade et les cartes de départ sont connues : seuls les nouveaux venus portent la pastille
    vus: { porteurs: [...ESCOUADE_DEPART], cartes: [...COLLECTION_DEPART] },
  };
}

export function estJeuValide(x: unknown): x is Jeu {
  const j = x as Jeu | null;
  if (!(!!j && (j.version >= 2 && j.version <= VERSION_JEU) && typeof j.energie === 'number' && !!j.batiments && !!j.porteurs)) return false;
  migrer(j);
  return true;
}

const RENOMMES: Record<string, string> = { 'glande-amber': 'glande-ambre' };

/** Complète une sauvegarde d'une version précédente avec les nouveaux champs */
function migrer(j: Jeu) {
  const ancien = j.chambre === undefined;
  j.chambre ??= ancien && j.strate > 1;
  j.recrues ??= ancien;
  j.arrives ??= [];
  j.actes ??= {};
  j.confiance ??= 0;
  if (j.xpV !== 2) {
    // courbe d'XP raidie le 3 novembre 2026 : chaque Porteur garde son niveau et sa progression vers le suivant
    const ancienne = (n: number) => Math.round(12 * n ** 1.6);
    for (const d of Object.values(j.porteurs)) {
      if (!d?.xp) continue;
      let reste = Math.floor(d.xp), n = 1, xp = 0;
      while (n < XP.niveauMax && reste >= ancienne(n)) { reste -= ancienne(n); xp += xpPourNiveau(n); n++; }
      d.xp = n >= XP.niveauMax ? xp : xp + Math.floor((reste / ancienne(n)) * xpPourNiveau(n));
    }
    j.xpV = 2;
  }
  if (j.confianceV !== 2) {
    // la Confiance devient les habitants qui te suivent (30 octobre 2026) : les anciens points sont convertis,
    // les paliers déjà atteints ne rapportent pas de creuseur d'un coup, mais les familles apportent leurs souvenirs
    j.confiance = Math.min(600, 20 + Math.round(j.confiance * 0.8));
    // les creuseurs déjà reçus aux anciens niveaux restent comptés : pas de double récompense
    j.confianceRecue = Math.max(j.confianceRecue ?? 0, palierHabitants(j.confiance));
    for (const f of ORDRE_FAMILLES.slice(0, j.confianceRecue)) if (!j.fragments.includes(f)) j.fragments.push(f);
    j.confianceV = 2;
  }
  j.confianceRecue ??= j.foyers ? niveauConfiance(nbFoyers(j)).niveau : palierHabitants(j.confiance);
  j.decouvertes ??= [];
  // l'empreinte des cartes (28 octobre 2026) notait par erreur les cartes du district (Stimulant, Pavois de cuivre) :
  // ces lignes bloquaient tous les boutons (29 octobre 2026, partie de Luc)
  if (j.vecu) for (const k of Object.keys(j.vecu)) if (!estCarteConnue(k)) delete j.vecu[k];
  if (!j.scenes) {
    // sauvegarde d'avant la campagne vécue (25 octobre 2026) : seule la dernière scène déjà atteinte se joue,
    // les précédentes sont comptées comme vues (elles se revoient dans la Bibliothèque)
    const c = contexteCampagne(j);
    let n = 0;
    while (n < SCENES.length && SCENES[n]!.quand(c)) n++;
    j.scenes = j.chambre ? SCENES.slice(0, Math.max(0, n - 1)).map((s) => s.id) : [];
  }
  j.fils ??= {};
  for (const p of PORTEURS) j.porteurs[p.id] ??= { usure: 0, poste: null, modules: [] };
  j.objectif ??= ancien && j.strate > 1 ? OBJECTIFS.length : 0;
  j.fragments ??= [];
  j.lus ??= [];
  if (j.kitRecrues === undefined) { j.kitRecrues = false; if (j.recrues && j.collection) donnerKitRecrues(j); }
  j.ravitaillement ??= { jour: jourDe(j.dernierTick), reserve: 1, ouverts: 0 };
  j.missions ??= [];
  j.rapports ??= [];
  // sauvegarde d'avant les creuseurs : on commence avec une équipe vide, les Strates déjà ouvertes le restent
  j.creuseurs ??= 0;
  j.frontVaincu ??= false;
  j.epreuves ??= { semaine: semaineDe(j.dernierTick), faites: [] };
  // sauvegarde d'avant le Comptoir (23 octobre 2026) : il reste à construire
  j.batiments.comptoir ??= 0;
  j.batiments.cercle ??= 0;
  j.comptoir ??= comptoirVide(j.dernierTick, j.rng ?? graine());
  // sauvegarde d'avant les séances d'entraînement (28 octobre 2026) : le Porteur posté finit son niveau en cours, offert
  accorderSeance(j);
  // sauvegarde d'avant les pastilles « Nouveau » : tout ce qui est déjà là est considéré comme vu
  j.vus ??= { porteurs: porteursPresents(j), cartes: Object.keys(j.collection ?? {}) };
  // sauvegarde d'avant « Mon escouade » : l'escouade de départ, ou les trois premiers Porteurs présents
  j.escouade ??= ESCOUADE_DEPART.every((id) => porteursPresents(j).includes(id)) ? [...ESCOUADE_DEPART] : porteursPresents(j).slice(0, 3);
  // sauvegarde d'avant les trois escouades (25 octobre 2026) : la sienne devient l'escouade 1, les deux autres sont vides
  j.escouadeActive ??= 0;
  j.escouades ??= [[...j.escouade], [], []];
  if (!j.luesRecompensees) {
    // sauvegarde d'avant les récompenses de lecture : les chapitres déjà lus rapportent leur carte maintenant
    j.luesRecompensees = [];
    if (j.collection && j.rng !== undefined) for (const id of j.lus) recompenserLecture(j, id);
  }
  if (j.version === 2) {
    // version 3 : la collection de cartes, les Éclats, les chantiers, l'objectif du jour et l'Archive
    const now = j.dernierTick;
    j.version = 3;
    j.eclats = 0;
    j.collection = Object.fromEntries(COLLECTION_DEPART.map((id) => [id, { niveau: 1, doublons: 0 }]));
    for (const p of Object.values(j.porteurs)) {
      p.modules = p.modules.map((m) => RENOMMES[m] ?? m).filter((m) => MODULES.some((x) => x.id === m)).map((m) => carteId(m, moduleDef(m).rarete));
      for (const m of p.modules) {
        if (j.collection[m]) j.collection[m]!.doublons++;
        else j.collection[m] = { niveau: 1, doublons: 0 };
      }
    }
    if (j.forge) j.forge = { moduleId: RENOMMES[j.forge.moduleId] ?? j.forge.moduleId, debut: j.forge.debut, fin: j.forge.fin };
    j.sans = { argent: 0, or: 0, nacre: 0 };
    j.rng = graine();
    j.chantiers = [];
    j.choix = [];
    j.quotidien = { jour: jourDe(now), reserve: 1, type: typeDuJour(jourDe(now)), progres: 0 };
    j.archive = { semaine: semaineDe(now), points: 0, aOuvrir: 0 };
  }
  if (j.version === 3) {
    // version 4 : un Module peut exister dans les cinq métaux ; chaque exemplaire garde le métal d'origine de son Module
    j.version = 4;
    const existe = (id: string) => MODULES.some((m) => m.id === moduleDe(id));
    const cle = (id: string) => (id.includes('@') ? id : carteId(id, moduleDef(id).rarete));
    j.collection = Object.fromEntries(Object.entries(j.collection).filter(([id]) => existe(id)).map(([id, c]) => [cle(id), c]));
    for (const p of Object.values(j.porteurs)) p.modules = p.modules.filter(existe).map(cle);
    if (j.forge) j.forge = existe(j.forge.moduleId) ? { ...j.forge, moduleId: cle(j.forge.moduleId) } : null;
    j.choix = j.choix.map((c) => ({ ...c, options: c.options.filter(existe).map(cle) })).filter((c) => c.options.length);
  }
  if (j.version === 4) {
    // version 5 : réservée à la Fusion, retirée le 21 octobre (le métal se trouve, il ne se fabrique pas) ; rien à migrer
    j.version = 5;
    delete (j as Partial<Jeu> & { fusions?: unknown }).fusions;
  }
  if (j.version === 5) {
    // version 6 (22 octobre 2026) : la carte qu'on collectionne est celle qu'on joue. Les Gestes de base deviennent
    // 15 cartes en fer, portées par Ilka, Doran et Véla ; chacun garde ses cartes greffées, jusqu'à 6 cartes.
    j.version = 6;
    for (const id of CARTES_DE_BASE) j.collection[carteId(id, 'fer')] ??= { niveau: 1, doublons: 0 };
    const porte = new Set(Object.values(j.porteurs).flatMap((p) => p.modules));
    for (const [pid, depart] of Object.entries(DEPART_PORTEURS)) {
      const p = j.porteurs[pid];
      if (!p) continue;
      const base = depart.filter((id) => CARTES_DE_BASE.includes(id)).map((id) => carteId(id, 'fer'));
      // sa carte de départ, si elle n'est portée par personne
      const premiere = carteId(depart[depart.length - 1]!, 'fer');
      const greffes = p.modules.length || !j.collection[premiere] || porte.has(premiere) ? p.modules : [premiere];
      p.modules = [...greffes.slice(0, DISTRICT.cartesMax), ...base].slice(0, DISTRICT.cartesMax);
    }
    // le deuxième objectif apprend désormais à confier la carte de la chambre
    if (j.chambre && j.objectif <= 1) j.collection[CARTE_CHAMBRE] ??= { niveau: 1, doublons: 0 };
  }
  if (j.version === 6) {
    // version 7 (23 octobre 2026) : un quatrième objectif guidé, les creuseurs. Qui avait fini les trois anciens a fini.
    j.version = 7;
    if (j.objectif >= 3) j.objectif = OBJECTIFS.length;
  }
  if (j.version === 7) {
    // version 8 (3 novembre 2026) : un objectif « Écouter Ysé » (les Chroniques) avant la descente ; les suivants reculent d'un cran
    j.version = 8;
    if (j.objectif >= 2) j.objectif = Math.min(OBJECTIFS.length, j.objectif + 1);
  }
  if (j.version === 8) {
    // version 9 (7 novembre 2026) : les 600 habitants deviennent 48 familles nommées, les pompes deviennent les Basses
    j.version = 9;
    familiesDesHabitants(j);
  }
  if (j.version === 9) {
    // version 10 (9 novembre 2026) : l'économie à cristal unique (docs/economie-cristal.md), relue par un game designer.
    // Les composants deviennent du minerai 1 pour 1 (le Générateur les taille en une nuit) ; l'énergie devient des cristaux
    // au taux de tous les nouveaux prix (÷ 20), comme le remboursement des séances déjà payées.
    j.version = 10;
    j.energie = Math.floor(j.energie / 20);
    for (const s of j.seances ?? []) s.energie = Math.round(s.energie / 20);
    if (j.seance) j.seance.energie = Math.round(j.seance.energie / 20);
    const ancien = j as Jeu & { conversion?: unknown; cristallisation?: unknown };
    delete ancien.conversion;
    delete ancien.cristallisation;
  }
  if (j.version === 10) {
    // version 11 (10 novembre 2026) : 5 niveaux par carte au lieu de 10 (départ 1 pour tous les métaux, collection.ts).
    // Le chemin parcouru se garde : une carte à mi-chemin de son ancien maximum arrive à mi-chemin du nouveau, une carte au
    // maximum reste maîtrisée. Les doublons déjà réunis restent, sans dépasser ce que demande le niveau suivant.
    j.version = 11;
    convertirNiveaux(j);
  }
  allegerSelonCharge(j);
  // 10 novembre 2026 : les quais gravés déjà passés donnent leur carte au choix (une seule fois, notée dans fleche.cartes)
  rattraperCartesFleche(j);
}

/** Les anciens niveaux de départ (avant le 10 novembre 2026, sur 10 niveaux) */
const ANCIEN_DEPART: Record<string, number> = { fer: 1, cuivre: 3, argent: 5, or: 7, nacre: 8 };
/** Un ancien niveau (départ selon le métal, maximum 10) sur l'échelle de 1 à 5 */
export function nouveauNiveau(ancien: number, metal: string): number {
  const d = ANCIEN_DEPART[metal] ?? 1;
  if (ancien <= d) return 1;
  return Math.min(COLLECTION.niveauMax, 1 + Math.round(((ancien - d) / (10 - d)) * (COLLECTION.niveauMax - 1)));
}
function convertirNiveaux(j: Jeu) {
  for (const [cle, c] of Object.entries(j.collection)) {
    const metal = cle.split('@')[1] ?? 'fer';
    c.niveau = nouveauNiveau(c.niveau, metal);
    const requis = doublonsRequis(cle, c.niveau);
    c.doublons = requis === null ? c.doublons : Math.min(c.doublons, requis);
  }
}

/** Le palier d'une ancienne sauvegarde, comptée en habitants (75 par palier, 600 au plus) */
const palierHabitants = (h: number) => Math.min(8, Math.floor(Math.min(600, Math.max(0, h)) / 75));

/**
 * Les habitants d'une sauvegarde d'avant le 7 novembre 2026 deviennent des familles : 12,5 habitants par famille (600 pour 48),
 * donc les mêmes paliers. D'abord les ouvriers du départ, puis les familles qui ont déjà apporté leur souvenir aux Archives,
 * puis le quartier, enfin les familles des Basses (leur lieu compte alors comme visité). Le reste devient du bouche-à-oreille.
 */
function familiesDesHabitants(j: Jeu) {
  if (j.foyers) return;
  const h = Math.min(600, Math.max(0, j.confiance ?? 0));
  const n = Math.min(FAMILLES_DISTRICT.length, Math.floor(h / 12.5));
  const apportees = j.fragments.map((f) => familleDuFragment(f)?.id).filter((x): x is string => !!x);
  const basses = SECTEURS.flatMap((s) => s.lieux.map((l) => l.famille));
  const ordre = [...new Set([...FAMILLES_DEPART.map((f) => f.id), ...apportees,
    ...FAMILLES_DISTRICT.filter((f) => f.arrivee === 'quartier').map((f) => f.id), ...basses])];
  j.foyers = ordre.slice(0, Math.max(n, FAMILLES_DEPART.length + apportees.length));
  const faits = SECTEURS.flatMap((s) => s.lieux).filter((l) => j.foyers!.includes(l.famille)).map((l) => l.id);
  if (faits.length) j.basses = { batardeau: null, semaine: -1, vu: -1, depots: 0, expedition: null, faits };
  j.confiance = n >= FAMILLES_DISTRICT.length ? 0 : Math.round((h - n * 12.5) * 1.2);
  j.confianceRecue = Math.max(j.confianceRecue ?? 0, 0);
  if (j.lignes) j.lignes = { semaine: j.lignes.semaine, familles: [], sources: {}, ...(j.lignes.derniere ? { derniere: j.lignes.derniere } : {}) };
}

/**
 * La Charge (26 octobre 2026) : un Porteur qui portait plus lourd que sa Charge, dans une sauvegarde d'avant, rend ses cartes
 * à la collection jusqu'à ce que ça tienne, en en rendant le moins possible (rien n'est perdu ; il peut les reprendre en montant de niveau).
 */
function allegerSelonCharge(j: Jeu) {
  if (!j.collection) return;
  for (const id of Object.keys(j.porteurs)) {
    if (!PORTEURS.some((p) => p.id === id) || enExpedition(j, id)) continue;
    const d = j.porteurs[id]!;
    const rendues: string[] = [];
    // le métal demande un niveau (27 octobre 2026) : une carte trop haute pour lui retourne à la collection
    for (const k of d.modules.slice()) if (niveauRequis(k) > niveauPorteur(j, id).niveau) { d.modules = d.modules.filter((x) => x !== k); rendues.push(moduleDef(k).nom); }
    while (d.modules.length && chargePortee(j, id) > chargeMax(j, id)) {
      // la plus légère qui suffit à rentrer dans la Charge ; sinon la plus lourde, et on recommence
      const exces = chargePortee(j, id) - chargeMax(j, id);
      const tri = d.modules.slice().sort((a, b) => poidsCarte(a) - poidsCarte(b));
      const lourde = tri.find((k) => poidsCarte(k) >= exces) ?? tri[tri.length - 1]!;
      d.modules = d.modules.filter((k) => k !== lourde);
      rendues.push(moduleDef(lourde).nom);
    }
    if (rendues.length) log(j, t`${porteurDef(id).nom} portait des cartes trop lourdes ou d’un métal trop haut pour son niveau, et rend ${rendues.join(', ')} à la collection.`);
  }
}
