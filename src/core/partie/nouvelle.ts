// Couche 7 — une nouvelle partie, les décisions de la campagne, et la mise à jour des anciennes sauvegardes.
// Fonctions pures : le temps est toujours passé en paramètre (`now`, en ms).

import { PORTEURS, CARTE_CHAMBRE, MODULES, moduleDe, moduleDef, porteurDef, CARTES_DE_BASE, COLLECTION_DEPART, DEPART_PORTEURS, carteId } from '../donnees';
import { niveauRequis, poidsCarte } from '../collection';
import { graine } from '../rng';
import { DISTRICT, VERSION_JEU, chargeMax, chargePortee, enExpedition, confier, strateVaincue, jourDe, log, niveauPorteur, non, porteursPresents, semaineDe, type FinCampagne, type GardeChambre, type Jeu, type LectureVela, type PorteurDistrict, type Resultat, typeDuJour } from './etat';
import { SCENES, sceneEnAttente, type ContexteCampagne } from '../campagne';
import { ESCOUADE_DEPART } from './descentes';
import { comptoirVide } from './district';
import { OBJECTIFS } from './objectifs';
import { donnerKitRecrues, recompenserLecture } from './recompenses';

const DECISION_CHAMBRE: { titre: string; texte: string; options: { id: GardeChambre; nom: string; phrase: string; effet: string }[] } = {
  titre: 'Qui garde la chambre ?',
  texte: 'La Confluence est tombée, et tout Vertiga parle de la chambre aux empreintes mêlées. Les Brigades du Serment de Veyr sont au pied de la Tour, les Veilleurs de Sédime demandent à l’étudier, et le quartier attend ta décision.',
  options: [
    { id: 'orseve', nom: 'La Maison Orsève', phrase: 'Nous n’héritons pas du pouvoir. Nous héritons de la responsabilité de le contenir.',
      effet: 'Les Brigades sécurisent la chambre et ne te barrent plus la route dans les Strates. Les Hauts paient : +1 Éclat sur chaque gardien vaincu.' },
    { id: 'district', nom: 'Le district seul', phrase: 'Ce qui est sous nos piliers est à nous.',
      effet: 'Le quartier se mobilise : +20 % de composants à chaque expédition. Mais les Brigades contestent, et tu les croiseras dans les salles closes.' },
    { id: 'commission', nom: 'Une commission avec les Veilleurs', phrase: 'Nous ne sommes pas les propriétaires du passé. Nous sommes les prochains à pouvoir le perdre.',
      effet: 'Les Veilleurs partagent leurs fouilles : 25 % de chances de carte par combat au lieu de 20 %.' },
  ],
};

const DECISION_LECTURE: { titre: string; texte: string; options: { id: LectureVela; nom: string; phrase: string; effet: string }[] } = {
  titre: 'La dernière lecture',
  texte: 'Sous les salles closes, les cristaux d’un même individu portent des souvenirs qui se contredisent. Véla pense pouvoir lire jusqu’au bout ce qu’ils cachent. Elle sait que son lien avec son empreinte pourrait ne pas y survivre. Elle attend ton accord.',
  options: [
    { id: 'autoriser', nom: 'Autoriser la lecture', phrase: 'Une empreinte ne ment jamais. C’est nous qui la lisons mal.',
      effet: 'Véla gagne une carte unique, Lecture profonde (Fréquence libre, forte attaque), en plus de ses 6 cartes. Son lien s’effiloche : −4 PV pour de bon.' },
    { id: 'refuser', nom: 'Refuser, la protéger', phrase: 'On n’entre pas deux fois chez quelqu’un sans y être invité.',
      effet: 'Véla garde son empreinte intacte et reprend des forces : +4 PV pour de bon. Ce que cachent les cristaux attendra.' },
  ],
};

const DECISION_FIN: { titre: string; texte: string; options: { id: FinCampagne; nom: string; phrase: string; effet: string }[] } = {
  titre: 'La vérité',
  texte: 'Le Premier Porteur est tombé, et son registre parle enfin : une autre civilisation s’est perdue en se gravant des empreintes, et ses premiers porteurs l’avaient écrit dès le début. Ces mêmes empreintes ont pourtant sauvé l’humanité après la Fonte. Le système qui les tient stables s’use. Il faut décider de ce qu’on en fait.',
  options: [
    { id: 'scellement', nom: 'Le Grand Scellement', phrase: 'Certaines vérités doivent rester enfouies.',
      effet: 'Les empreintes anciennes sont scellées à nouveau. Moins de risques : les ennemis perdent 10 % de leur force. Du savoir perdu : plus aucune carte en nacre ne tombe.' },
    { id: 'pacte', nom: 'Le Pacte des empreintes', phrase: 'Nous héritons de la responsabilité de les contenir, ensemble.',
      effet: 'Leur contrôle est partagé entre les Hauts et les districts. Une paix fragile : +10 % de composants. Une nouvelle bureaucratie : les chantiers durent 25 % plus longtemps.' },
    { id: 'archives', nom: 'Les Archives ouvertes', phrase: 'Une empreinte n’est qu’une donnée. Elle n’a rien de sacré.',
      effet: 'Tout est révélé et accessible à tous. Plus de liberté : deux fois plus de cartes en nacre. Des accidents de greffe : l’Usure des expéditions augmente de moitié.' },
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

export const contexteCampagne = (j: Jeu): ContexteCampagne => ({ strate: j.strate, vaincue: strateVaincue(j), actes: j.actes, presents: porteursPresents(j) });

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
  if (!d) return non('Décision inconnue.');
  const o = (d.options as readonly { id: string; nom: string }[]).find((x) => x.id === choix);
  if (!o) return non('Choix inconnu.');
  if (j.actes[acte as Acte]) return non('La décision est déjà prise.');
  (j.actes as Record<string, string>)[acte] = o.id;
  if (acte === 'chambre') confier(j, o.id === 'district' ? 10 : o.id === 'commission' ? 5 : -5);
  log(j, acte === 'chambre' ? `La chambre est confiée à : ${o.nom}.` : acte === 'lecture' ? `Véla : ${o.nom.toLowerCase()}.` : `Fin de la campagne : ${o.nom}. Les Strates continuent.`);
  return { ok: true, message: `Décision prise : ${o.nom}.` };
}

export const deciderChambre = (j: Jeu, choix: string) => decider(j, 'chambre', choix);

export function nouveauJeu(now: number, rng = graine()): Jeu {
  const porteurs: Record<string, PorteurDistrict> = {};
  for (const p of PORTEURS) porteurs[p.id] = { usure: 0, poste: null, modules: (DEPART_PORTEURS[p.id] ?? []).map((id) => carteId(id, 'fer')) };
  return {
    version: VERSION_JEU,
    energie: DISTRICT.depart.energie,
    composants: DISTRICT.depart.composants,
    batiments: { noyau: 1, generateur: 1, forge: 1, clinique: 1, comptoir: 0 },
    porteurs,
    forge: null,
    strate: 1,
    dernierTick: now,
    expedition: null,
    journal: ['Tu viens d’être élu à la tête du district. Les piliers t’attendent.'],
    introVue: false,
    chambre: false,
    recrues: false,
    arrives: [],
    actes: {},
    confiance: 50,
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
  if (!(!!j && (j.version === VERSION_JEU || (j.version >= 2 && j.version <= 6)) && typeof j.energie === 'number' && !!j.batiments && !!j.porteurs)) return false;
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
  j.confiance ??= 50;
  j.decouvertes ??= [];
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
  // sauvegarde d'avant les creuseurs : on commence avec une équipe vide, les Strates déjà ouvertes le restent
  j.creuseurs ??= 0;
  j.frontVaincu ??= false;
  j.epreuves ??= { semaine: semaineDe(j.dernierTick), faites: [] };
  // sauvegarde d'avant le Comptoir (23 octobre 2026) : il reste à construire
  j.batiments.comptoir ??= 0;
  j.comptoir ??= comptoirVide(j.dernierTick, j.rng ?? graine());
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
  allegerSelonCharge(j);
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
    if (rendues.length) log(j, `${porteurDef(id).nom} portait des cartes trop lourdes ou d’un métal trop haut pour son niveau, et rend ${rendues.join(', ')} à la collection.`);
  }
}
