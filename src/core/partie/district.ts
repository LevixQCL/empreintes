// La vie du district : Confiance, temps qui passe, chantiers et Forge, creuseurs, entraînement, Comptoir.
// Fonctions pures : le temps est toujours passé en paramètre (`now`, en ms).

import { BATIMENTS, MODULES, PORTEURS, batimentDef, carteId, moduleDe, moduleDef, porteurDef } from '../donnees';
import { COLLECTION, NOMS_RARETE, ajouterCarte, composantsNiveau, doublonsRequis } from '../collection';
import { tireur } from '../rng';
import { noterPalmares } from '../classements';
import type { BatimentId, Rarete } from '../types';
import { ACCORD_OUVERT, ARCHIVE, CONFIANCE, CREUSEURS, DISTRICT, type Jeu, type Poste, QUOTIDIENS, type Resultat, XP, confier, creuseursRequis, enExpedition, energieParHeure, jourDe, log, multiplicateur, niveauPorteur, non, posteDe, pvNiveau, semaineDe, stockage, typeDuJour, xpPourNiveau } from './etat';
import { RAVITAILLEMENT, strateVaincue } from './recompenses';
import { avancerFils, porteursPresents, retourDeMission, verifierArrivees } from './descentes';
import { OBJECTIFS } from './objectifs';

export function humeurDistrict(j: Jeu): string {
  const c = j.confiance ?? 50;
  if (c >= CONFIANCE.haute) return 'Le quartier croit en toi : les habitants donnent un coup de main (+10 % d’énergie).';
  if (c <= CONFIANCE.basse) return 'Le quartier doute : le Générateur tourne au ralenti (−10 % d’énergie).';
  return 'Le quartier t’observe. Les chantiers et les expéditions réussies feront monter sa confiance.';
}
export const soinParHeure = (j: Jeu) => (DISTRICT.soinParHeure[j.batiments.clinique] ?? 0) * multiplicateur(j, 'clinique');

/** Ce que coûte la refabrication d'un exemplaire */
export const coutRefabrication = (moduleId: string) => COLLECTION.refabrication[moduleDef(moduleId).rarete];

/** Vitesse de la Forge selon son niveau : +25 % par niveau */
export const vitesseForge = (niveau: number) => 1 + 0.25 * (niveau - 1);

/** Durée de refabrication, en ms (plus rapide avec un forgeron de la bonne lignée et une Forge améliorée) */
export function dureeFabrication(j: Jeu, moduleId: string): number {
  const bonus = multiplicateur(j, 'forge');
  return Math.round((coutRefabrication(moduleId).minutes * 60_000 * DISTRICT.bonusPoste) / (bonus * vitesseForge(j.batiments.forge)));
}

export function coutAmelioration(j: Jeu, b: BatimentId) {
  const d = batimentDef(b);
  const n = j.batiments[b];
  return n >= d.niveauMax ? null : d.couts[n]!;
}

/** Durée du chantier pour monter un bâtiment au niveau suivant, en ms */
export const dureeChantier = (j: Jeu, b: BatimentId) => Math.round((DISTRICT.chantierMinutes[j.batiments[b] + 1] ?? 0) * 60_000 * (j.actes?.fin === 'pacte' ? 1.25 : 1));
export const chantierDe = (j: Jeu, b: BatimentId) => j.chantiers.find((c) => c.batiment === b) ?? null;
export const chantiersMax = (j: Jeu) => (j.batiments.noyau >= DISTRICT.chantiersNoyau2 ? 2 : 1);

/** Une chose que le niveau suivant d'un bâtiment change : un chiffre qui monte (avant → après) ou un déblocage */
export interface GainNiveau {
  quoi: 'energie' | 'soin' | 'stockage' | 'creuseurs' | 'strate' | 'forge' | 'plafond' | 'chantiers' | 'porteur' | 'entrainement' | 'offres' | 'argent';
  texte: string;
  avant?: number;
  apres?: number;
  /** Infinity pour « sans limite » */
  unite?: '%';
  detail?: string;
}

/** La Strate la plus profonde que le logement des creuseurs permet d'ouvrir à ce niveau du Noyau (Infinity : plus de limite) */
export function profondeurNoyau(niveau: number): number {
  const max = CREUSEURS.logement[CREUSEURS.logement.length - 1]!;
  if ((CREUSEURS.logement[niveau] ?? max) >= max) return Infinity;
  let s = 1;
  while (noyauRequis(s + 1) <= niveau) s++;
  return s;
}

/**
 * Ce que rapporte le niveau suivant d'un bâtiment, calculé avec les vraies règles sur une copie du district
 * (Porteur posté et Confiance compris) : la feuille du bâtiment l'affiche à côté du bouton Améliorer. Vide au niveau maximum.
 */
export function gainsAmelioration(j: Jeu, b: BatimentId): GainNiveau[] {
  const niv = j.batiments[b];
  if (niv >= batimentDef(b).niveauMax) return [];
  const apres: Jeu = { ...j, batiments: { ...j.batiments, [b]: niv + 1 } };
  const g: GainNiveau[] = [];
  if (b === 'generateur') g.push({ quoi: 'energie', texte: 'Énergie par heure', avant: energieParHeure(j), apres: energieParHeure(apres) });
  if (b === 'clinique') g.push({ quoi: 'soin', texte: 'Usure soignée par heure', avant: soinParHeure(j), apres: soinParHeure(apres), detail: 'pour chaque Porteur au repos' });
  if (b === 'clinique' && niv + 1 === ACCORD_OUVERT.clinique) {
    const joss = PORTEURS.find((p) => p.arrivee?.accord && !j.arrives.includes(p.id));
    if (joss) g.push({ quoi: 'porteur', texte: 'La Clinique peut organiser un Accord ouvert', detail: `un nouveau Résonant, quand la Confiance atteint ${ACCORD_OUVERT.confiance}` });
  }
  if (b === 'forge') {
    g.push({ quoi: 'forge', texte: 'Vitesse de refabrication', avant: Math.round(vitesseForge(niv) * 100), apres: Math.round(vitesseForge(niv + 1) * 100), unite: '%' });
    for (const p of PORTEURS) {
      if (p.arrivee?.forge !== niv + 1 || j.arrives.includes(p.id)) continue;
      g.push({ quoi: 'porteur', texte: `${p.nom} rejoint le district`, ...(j.chambre ? {} : { detail: 'une fois la chambre scellée' }) });
    }
  }
  if (b === 'comptoir') {
    g.push({ quoi: 'offres', texte: 'Cartes en vente chaque jour', avant: etalsDuComptoir(j).length, apres: etalsDuComptoir(apres).length });
    const argent = (x: Jeu) => (COMPTOIR.etals[x.batiments.comptoir] ?? []).includes('argent');
    if (argent(apres) && !argent(j)) g.push({ quoi: 'argent', texte: 'Des cartes en argent', ...(strateVaincue(j) < COMPTOIR.strateArgent ? { detail: `une fois la Strate −${COMPTOIR.strateArgent} vaincue` } : {}) });
  }
  if (b === 'noyau') {
    g.push({ quoi: 'stockage', texte: 'Stockage d’énergie', avant: stockage(j), apres: stockage(apres) });
    const prof = profondeurNoyau(niv + 1);
    g.push({ quoi: 'creuseurs', texte: 'Creuseurs logés', avant: logementCreuseurs(j), apres: logementCreuseurs(apres),
      detail: prof === Infinity ? 'plus aucune limite de profondeur' : `de quoi creuser jusqu’à la Strate −${prof}` });
    const manque = manquePourCreuser(j);
    if (manque && manque.creuseurs === 0 && noyauRequis(j.strate + 1) === niv + 1) g.push({ quoi: 'strate', texte: `Ouvre la Strate −${j.strate + 1}`, detail: 'les creuseurs attendent déjà la place' });
    g.push({ quoi: 'plafond', texte: 'Niveau max. des autres bâtiments', avant: niv, apres: niv + 1 });
    g.push({ quoi: 'entrainement', texte: 'Entraînement à la Tour', avant: xpEntrainement(j), apres: xpEntrainement(apres), detail: `XP par heure, jusqu’au niveau ${plafondEntrainement(apres)}` });
    if (niv + 1 === DISTRICT.chantiersNoyau2) g.push({ quoi: 'chantiers', texte: 'Deux chantiers en même temps' });
  }
  return g;
}

/** Les Porteurs qui portent déjà cette carte */
export const greffesDe = (j: Jeu, moduleId: string) => Object.keys(j.porteurs).filter((id) => j.porteurs[id]!.modules.includes(moduleId));

// ---------- Le temps qui passe ----------

/** Rattrape le temps écoulé : énergie, soins, Forge. Rien n'est perdu ni puni pendant l'absence. */
export function tick(j: Jeu, now: number): string[] {
  const nouvelles: string[] = [];
  nouvelles.push(...verifierArrivees(j));
  nouvelles.push(...avancerFils(j));
  const dt = Math.max(0, now - j.dernierTick);
  const heures = dt / 3_600_000;
  j.dernierTick = now;

  // l'énergie produite, moins ce que consomme l'entraînement tant qu'il dure (23 octobre 2026) :
  // si la Tour consomme plus que le Générateur ne produit, l'entraînement s'arrête quand la réserve est vide
  const prod = energieParHeure(j);
  const entrainement = heuresEntrainement(j, heures);
  const conso = energieEntrainement(j);
  let paye = entrainement;
  if (conso > prod && paye > 0) paye = Math.min(paye, j.energie / (conso - prod));
  j.energie = Math.max(0, Math.min(stockage(j), j.energie + (prod - conso) * paye));
  j.energie = Math.min(stockage(j), j.energie + prod * (heures - paye));

  const soin = soinParHeure(j) * heures;
  for (const id of Object.keys(j.porteurs)) {
    if (enExpedition(j, id)) continue;
    const p = j.porteurs[id]!;
    p.usure = Math.max(0, p.usure - soin);
  }

  if (j.forge && now >= j.forge.fin) {
    const f = j.forge;
    ajouterCarte(j, f.moduleId);
    j.forge = null;
    const t = `La Forge a refabriqué ${moduleDef(f.moduleId).nom} : un doublon de plus.`;
    log(j, t);
    nouvelles.push(t);
  }

  for (const c of j.chantiers.filter((x) => now >= x.fin)) {
    j.batiments[c.batiment]++;
    confier(j, CONFIANCE.chantier);
    if ((j.confiance ?? 50) >= CONFIANCE.haute && tireur(j).nombre() < CREUSEURS.confiance) gagnerCreuseurs(j, 1, 'le district a confiance, un volontaire se présente');
    if (c.batiment === 'noyau' && creuser(j)) nouvelles.push(`La Tour du Noyau loge assez de creuseurs : la Strate −${j.strate} est ouverte.`);
    const t = `Chantier terminé : ${batimentDef(c.batiment).nom} passe au niveau ${j.batiments[c.batiment]}.`;
    log(j, t);
    nouvelles.push(t);
  }
  j.chantiers = j.chantiers.filter((x) => now < x.fin);

  const entraine = entrainer(j, paye);
  if (entraine) nouvelles.push(entraine);

  for (const m of j.missions.filter((x) => now >= x.fin)) nouvelles.push(retourDeMission(j, m));
  j.missions = j.missions.filter((x) => now < x.fin);
  if (semaineDe(now) > j.epreuves.semaine) j.epreuves = { semaine: semaineDe(now), faites: [] };

  // un objectif du jour de plus en réserve chaque jour, 3 au plus : rien ne se perd pendant une courte absence
  const jour = jourDe(now);
  if (jour > j.quotidien.jour) {
    const avant = j.quotidien.reserve;
    j.quotidien.reserve = Math.min(3, j.quotidien.reserve + (jour - j.quotidien.jour));
    if (avant === 0) { j.quotidien.type = typeDuJour(jour); j.quotidien.progres = 0; }
    j.quotidien.jour = jour;
  }

  // un colis de ravitaillement de plus chaque jour, 3 au plus (aucune série à perdre)
  if (jour > j.ravitaillement.jour) {
    j.ravitaillement.reserve = Math.min(RAVITAILLEMENT.reserveMax, j.ravitaillement.reserve + (jour - j.ravitaillement.jour));
    j.ravitaillement.jour = jour;
  }

  // l'Archive de la semaine s'ouvre le lundi
  const semaine = semaineDe(now);
  if (semaine > j.archive.semaine) {
    const paliers = ARCHIVE.paliers.filter((p) => j.archive.points >= p).length;
    if (paliers > 0) {
      j.archive.aOuvrir = Math.max(j.archive.aOuvrir, paliers);
      const t = 'L’Archive de la semaine est prête à être ouverte.';
      log(j, t);
      nouvelles.push(t);
    }
    j.archive.points = 0;
    j.archive.semaine = semaine;
  }
  garnirComptoir(j, now);
  noterPalmares(j, now, semaineDe(now));
  return nouvelles;
}

/** Des points d'Archive et la progression de l'objectif du jour */
export function progresser(j: Jeu, quoi: keyof typeof ARCHIVE.points, n = 1) {
  j.archive.points += ARCHIVE.points[quoi] * n;
  const q = j.quotidien;
  if (quoi === 'quotidien' || !quotidienActif(j)) return;
  if ((quoi === 'combat' && q.type === 'combats') || (quoi === 'expedition' && q.type === 'expedition') || (quoi === 'chantier' && q.type === 'chantier')) {
    q.progres = Math.min(QUOTIDIENS[q.type].objectif, q.progres + n);
  }
}

/** L'objectif du jour apparaît une fois les 3 objectifs guidés terminés */
export const quotidienActif = (j: Jeu) => j.objectif >= OBJECTIFS.length && j.quotidien.reserve > 0;
export const quotidienFait = (j: Jeu) => quotidienActif(j) && j.quotidien.progres >= QUOTIDIENS[j.quotidien.type].objectif;

// ---------- Actions du district ----------

/** Le bâtiment à proposer pour l'objectif « lancer une amélioration » : le premier qu'on peut lancer tout de suite,
 *  sinon le moins cher à atteindre (la Tour du Noyau en dernier recours) */
export function batimentConseille(j: Jeu): BatimentId {
  const ids = BATIMENTS.map((b) => b.id).filter((b) => j.batiments[b] > 0 || b === 'comptoir');
  const essai = (b: BatimentId) => { const c = structuredClone(j); return ameliorer(c, b).ok; };
  const pret = ids.find(essai);
  if (pret) return pret;
  const cout = (b: BatimentId) => { const c = coutAmelioration(j, b); return c ? c.energie + 3 * c.composants : Infinity; };
  return [...ids].sort((a, b) => cout(a) - cout(b))[0] ?? 'noyau';
}

export function ameliorer(j: Jeu, b: BatimentId, now = j.dernierTick): Resultat {
  const cout = coutAmelioration(j, b);
  if (!cout) return non('Niveau maximum atteint.');
  if (chantierDe(j, b)) return non('Un chantier est déjà en cours sur ce bâtiment.');
  if (b !== 'noyau' && j.batiments[b] >= j.batiments.noyau) return non('Améliore d’abord la Tour du Noyau.');
  if (b === 'noyau' && j.chantiers.length) return non('Termine d’abord les chantiers en cours avant d’agrandir la Tour du Noyau.');
  if (j.chantiers.length >= chantiersMax(j)) return non(chantiersMax(j) === 1 ? 'Un seul chantier à la fois pour l’instant (deux au Noyau niveau 4).' : 'Deux chantiers sont déjà en cours.');
  if (j.energie < cout.energie || j.composants < cout.composants || j.eclats < (cout.eclats ?? 0)) return non('Pas assez de ressources.');
  j.energie -= cout.energie;
  j.composants -= cout.composants;
  j.eclats -= cout.eclats ?? 0;
  const duree = dureeChantier(j, b);
  progresser(j, 'chantier');
  if (duree <= 0) {
    j.batiments[b]++;
    log(j, `${batimentDef(b).nom} passe au niveau ${j.batiments[b]}.`);
    if (b === 'noyau') creuser(j);
  } else {
    j.chantiers.push({ batiment: b, debut: now, fin: now + duree });
    log(j, `Chantier lancé : ${batimentDef(b).nom} vers le niveau ${j.batiments[b] + 1}.`);
  }
  return { ok: true };
}

export function poster(j: Jeu, id: string, b: Poste | null): Resultat {
  const p = j.porteurs[id];
  if (!p || !porteursPresents(j).includes(id)) return non('Porteur inconnu.');
  if (enExpedition(j, id)) return non('Ce Porteur est en expédition.');
  if (b === 'forge' && j.forge && p.poste === 'forge') return non('La Forge travaille : attends la fin de la fabrication.');
  if (b) {
    const occupant = posteDe(j, b);
    if (occupant && occupant !== id) {
      if (b === 'forge' && j.forge) return non('La Forge travaille : attends la fin de la fabrication.');
      j.porteurs[occupant]!.poste = null;
    }
  }
  if (p.poste === 'forge' && j.forge) return non('La Forge travaille : attends la fin de la fabrication.');
  p.poste = b;
  log(j, b === 'noyau' ? `${porteurDef(id).nom} s’entraîne à la Tour du Noyau.` : b ? `${porteurDef(id).nom} travaille maintenant : ${batimentDef(b).nom}.` : `${porteurDef(id).nom} se repose.`);
  return { ok: true };
}

/** La Forge refabrique un exemplaire d'une carte déjà trouvée : un doublon de plus */
export function fabriquer(j: Jeu, moduleId: string, now: number): Resultat {
  if (!j.collection[moduleId]) return non('On ne refabrique qu’une carte déjà trouvée.');
  if (j.forge) return non('La Forge est déjà occupée.');
  if (!posteDe(j, 'forge')) return non('Il faut un Porteur au travail à la Forge.');
  const c = coutRefabrication(moduleId);
  if (j.energie < c.energie) return non(`La Forge manque d’énergie : il en faut ${c.energie}.`);
  if (j.composants < c.composants || j.eclats < c.eclats) return non('Pas assez de ressources.');
  j.energie -= c.energie;
  j.composants -= c.composants;
  j.eclats -= c.eclats;
  j.forge = { moduleId, debut: now, fin: now + dureeFabrication(j, moduleId) };
  log(j, `La Forge refabrique ${moduleDef(moduleId).nom}.`);
  return { ok: true };
}

/** Recycle un doublon en Composants */
export function recycler(j: Jeu, moduleId: string): Resultat {
  const c = j.collection[moduleId];
  if (!c || c.doublons < 1) return non('Aucun doublon à recycler.');
  c.doublons--;
  const gain = COLLECTION.recyclage[moduleDef(moduleId).rarete];
  j.composants += gain;
  log(j, `Un doublon de ${moduleDef(moduleId).nom} recyclé : +${gain} composants.`);
  return { ok: true };
}

/** Monte une carte d'un niveau avec ses doublons */
export function monter(j: Jeu, moduleId: string): Resultat {
  const c = j.collection[moduleId];
  if (!c) return non('Carte inconnue.');
  const requis = doublonsRequis(moduleId, c.niveau);
  if (requis === null) return non('Niveau maximum atteint.');
  if (c.doublons < requis) return non(`Il faut ${requis} doublon${requis > 1 ? 's' : ''}.`);
  const cout = composantsNiveau(c.niveau + 1);
  if (j.composants < cout) return non('Pas assez de composants.');
  c.doublons -= requis;
  j.composants -= cout;
  c.niveau++;
  log(j, `${moduleDef(moduleId).nom} passe au niveau ${c.niveau}.`);
  return { ok: true };
}

/** Confie une carte à un Porteur de sa lignée (un exemplaire n'est porté que par un Porteur ; il passe de l'un à l'autre) */
export function greffer(j: Jeu, moduleId: string, porteurId: string): Resultat {
  const p = j.porteurs[porteurId];
  if (!j.collection[moduleId]) return non('Carte inconnue.');
  if (!p || !porteursPresents(j).includes(porteurId)) return non('Porteur inconnu.');
  if (enExpedition(j, porteurId)) return non('Ce Porteur est en expédition.');
  if (porteurDef(porteurId).lignee !== moduleDef(moduleId).lignee) return non('Cette carte ne convient qu’à sa lignée.');
  const ancien = greffesDe(j, moduleId)[0];
  if (ancien === porteurId) return { ok: true };
  if (ancien && enExpedition(j, ancien)) return non('Cette carte est en expédition.');
  // il porte déjà cette carte dans un autre métal : la nouvelle prend sa place (24 octobre 2026, Bryan : une Morsure en argent
  // n'apparaissait pas pour Doran, qui portait la Morsure en fer). Un Porteur ne porte toujours qu'un métal de chaque carte.
  const autreMetal = p.modules.find((k) => k !== moduleId && moduleDe(k) === moduleDe(moduleId));
  if (!autreMetal && p.modules.length >= DISTRICT.cartesMax) return non(`${porteurDef(porteurId).nom} porte déjà ${DISTRICT.cartesMax} cartes : retires-en une.`);
  if (ancien) j.porteurs[ancien]!.modules = j.porteurs[ancien]!.modules.filter((m) => m !== moduleId);
  if (autreMetal) {
    p.modules[p.modules.indexOf(autreMetal)] = moduleId;
    log(j, `${moduleDef(moduleId).nom} (${NOMS_RARETE[moduleDef(moduleId).rarete].toLowerCase()}) remplace celle en ${NOMS_RARETE[moduleDef(autreMetal).rarete].toLowerCase()} chez ${porteurDef(porteurId).nom}.`);
    return { ok: true };
  }
  p.modules.push(moduleId);
  log(j, `${moduleDef(moduleId).nom} confiée à ${porteurDef(porteurId).nom}.`);
  return { ok: true };
}

export function degreffer(j: Jeu, moduleId: string): Resultat {
  const id = greffesDe(j, moduleId)[0];
  if (!id) return { ok: true };
  if (enExpedition(j, id)) return non('Ce Porteur est en expédition.');
  j.porteurs[id]!.modules = j.porteurs[id]!.modules.filter((m) => m !== moduleId);
  return { ok: true };
}

/** Résout le premier choix en attente : une des cartes, ou les Éclats si proposé (index -1) */
// ---------- Les creuseurs ----------
// Décision du 22 octobre 2026 : on ne descend pas au rythme d'un minuteur, mais au rythme du jeu. Battre le gardien
// du front prépare l'étage suivant ; il ne se creuse qu'avec assez de creuseurs, et la Tour du Noyau doit pouvoir les loger.
// Les creuseurs qui percent un étage y restent pour l'étayer : on ne peut pas en faire de réserve pour plus tard.
// On gagne des creuseurs en jouant : fouilles ciblées, missions, Épreuves, gardiens vaincus et Confiance du district.

export const logementCreuseurs = (j: Pick<Jeu, 'batiments'>) => CREUSEURS.logement[j.batiments.noyau] ?? CREUSEURS.logement[CREUSEURS.logement.length - 1]!;
/** Le niveau du Noyau qu'il faut pour loger les creuseurs d'une Strate */
export const noyauRequis = (strate: number) => Math.max(1, CREUSEURS.logement.findIndex((n) => n >= creuseursRequis(strate)));

/** Ajoute des creuseurs (dans la limite du logement) ; renvoie le nombre réellement arrivé */
export function gagnerCreuseurs(j: Jeu, n: number, raison: string): number {
  const avant = j.creuseurs ?? 0;
  j.creuseurs = Math.min(logementCreuseurs(j), avant + n);
  const arrives = j.creuseurs - avant;
  if (arrives > 0) log(j, `+${arrives} creuseur${arrives > 1 ? 's' : ''} : ${raison}.`);
  return arrives;
}

/** Ce qui manque pour creuser l'étage suivant (null s'il ne manque rien, ou si le gardien n'est pas vaincu) */
export function manquePourCreuser(j: Jeu): { creuseurs: number; noyau: number } | null {
  if (!j.frontVaincu) return null;
  const cible = j.strate + 1;
  const c = Math.max(0, creuseursRequis(cible) - j.creuseurs);
  const n = Math.max(0, noyauRequis(cible) - j.batiments.noyau);
  return c || n ? { creuseurs: c, noyau: n } : null;
}

/** Creuse l'étage suivant si tout est prêt ; renvoie true si une Strate s'est ouverte */
export function creuser(j: Jeu): boolean {
  if (!j.frontVaincu || manquePourCreuser(j)) return false;
  j.creuseurs -= creuseursRequis(j.strate + 1);
  j.strate++;
  j.frontVaincu = false;
  log(j, `Les creuseurs percent la roche : la Strate −${j.strate} est ouverte.`);
  return true;
}

// ---------- L'entraînement à la Tour (23 octobre 2026) ----------
// Pour devenir plus fort sans descendre : un Porteur posté à la Tour du Noyau s'entraîne avec les creuseurs et gagne
// de l'XP avec le temps, même jeu fermé. Plus lent qu'une mission, sans risque ni Usure, et s'il rejoint l'escouade, il quitte l'entraînement.
// Plafond : 4 niveaux par niveau de la Tour ; au-delà, l'expérience se gagne dans les Strates.
export const ENTRAINEMENT = {
  /** XP par heure selon le niveau de la Tour du Noyau (index = niveau) */
  xpHeure: [0, 3, 4, 5, 6, 8],
  /** énergie consommée par heure d'entraînement (23 octobre 2026) : sans énergie, l'entraînement s'arrête */
  energieHeure: [0, 15, 25, 35, 50, 70],
  niveauxParNoyau: 4,
} as const;
export const xpEntrainement = (j: Jeu) => ENTRAINEMENT.xpHeure[j.batiments.noyau] ?? 0;
export const energieEntrainement = (j: Jeu) => ENTRAINEMENT.energieHeure[j.batiments.noyau] ?? ENTRAINEMENT.energieHeure[ENTRAINEMENT.energieHeure.length - 1]!;
export const plafondEntrainement = (j: Jeu) => Math.min(XP.niveauMax, ENTRAINEMENT.niveauxParNoyau * j.batiments.noyau);
/** XP totale pour atteindre un niveau depuis le niveau 1 */
const xpPourAtteindre = (niveau: number) => { let s = 0; for (let n = 1; n < niveau; n++) s += xpPourNiveau(n); return s; };

/** Les heures d'entraînement à compter sur une durée : 0 sans Porteur à la Tour, et pas au-delà du plafond
 *  (l'énergie, elle, est décomptée par tick) */
function heuresEntrainement(j: Jeu, heures: number): number {
  const id = posteDe(j, 'noyau');
  if (!id || heures <= 0 || enExpedition(j, id)) return 0;
  const plafond = plafondEntrainement(j);
  const n = niveauPorteur(j, id).niveau;
  if (n >= plafond) return 0;
  const tete = Math.max(...Object.keys(j.porteurs).map((k) => niveauPorteur(j, k).niveau));
  const parHeure = xpEntrainement(j) * (tete - n >= 2 ? XP.rattrapage : 1);
  if (parHeure <= 0) return 0;
  return Math.min(heures, (xpPourAtteindre(plafond) - (j.porteurs[id]!.xp ?? 0)) / parHeure);
}

/** Le temps passé à la Tour (appelé par tick) : renvoie l'annonce d'un niveau gagné */
function entrainer(j: Jeu, heures: number): string | null {
  const id = posteDe(j, 'noyau');
  if (!id || heures <= 0 || enExpedition(j, id)) return null;
  const d = j.porteurs[id]!;
  const plafond = plafondEntrainement(j);
  const avant = niveauPorteur(j, id).niveau;
  if (avant >= plafond) return null;
  const tete = Math.max(...Object.keys(j.porteurs).map((k) => niveauPorteur(j, k).niveau));
  const gain = xpEntrainement(j) * heures * (tete - avant >= 2 ? XP.rattrapage : 1);
  // l'XP s'accumule à la fraction près (le district se met à jour chaque seconde), sans dépasser le plafond
  d.xp = Math.min((d.xp ?? 0) + gain, xpPourAtteindre(plafond));
  const apres = niveauPorteur(j, id).niveau;
  if (apres <= avant) return null;
  const t = `${porteurDef(id).nom} s’est entraîné à la Tour : niveau ${apres}, ${pvNiveau(j, id)} PV.`;
  log(j, t);
  return t;
}

// ---------- Le Comptoir (23 octobre 2026) ----------
// « Forger, acheter ou combattre » : acheter manquait. Les fouilleurs du quartier y revendent chaque jour quelques cartes
// trouvées dans les Strates, à prix fixe : on voit la carte avant de payer, aucun hasard n'est jamais payé.
// L'or et la nacre ne s'y vendent jamais : ils restent à trouver. L'argent n'y paraît qu'une fois la Strate −4 vaincue.
// Une offre sur deux est, quand c'est possible, un doublon d'une carte qu'on possède : de quoi la faire monter.
export const COMPTOIR = {
  /** les étals de chaque jour selon le niveau du Comptoir (index = niveau ; 0 = pas encore construit) */
  etals: [[], ['fer', 'fer', 'cuivre'], ['fer', 'fer', 'cuivre', 'cuivre'], ['fer', 'cuivre', 'cuivre', 'argent'],
    ['fer', 'fer', 'cuivre', 'cuivre', 'argent'], ['fer', 'fer', 'cuivre', 'cuivre', 'argent', 'argent']] as Rarete[][],
  /** prix fixes : environ 1,5 fois la refabrication à la Forge (qui, elle, ne refait qu'une carte déjà trouvée) */
  prix: { fer: { composants: 40, eclats: 0 }, cuivre: { composants: 120, eclats: 0 }, argent: { composants: 300, eclats: 3 } } as Partial<Record<Rarete, { composants: number; eclats: number }>>,
  strateArgent: 4,
  partDoublons: 0.5,
} as const;

export interface Comptoir { jour: number; offres: string[]; achetes: number[]; rng: number }
export function comptoirVide(now: number, rng: number): Comptoir {
  return { jour: jourDe(now), offres: [], achetes: [], rng: (rng ^ 0x9e3779b9) >>> 0 };
}

/** Les métaux des étals du jour (l'argent n'arrive qu'une fois la Strate −4 vaincue ; avant, du cuivre à sa place) */
export function etalsDuComptoir(j: Jeu): Rarete[] {
  return (COMPTOIR.etals[j.batiments.comptoir] ?? []).map((r) => (r === 'argent' && strateVaincue(j) < COMPTOIR.strateArgent ? 'cuivre' : r));
}
export const prixComptoir = (id: string) => COMPTOIR.prix[moduleDef(id).rarete] ?? { composants: 0, eclats: 0 };

/** Renouvelle les offres chaque jour ; un Comptoir agrandi dans la journée ajoute ses nouveaux étals sans toucher aux autres */
export function garnirComptoir(j: Jeu, now: number): void {
  const c = j.comptoir;
  const jour = jourDe(now);
  if (c.jour !== jour) { c.jour = jour; c.offres = []; c.achetes = []; }
  const etals = etalsDuComptoir(j);
  if (c.offres.length >= etals.length) return;
  const t = tireur(c);
  const bases = new Set(c.offres.map(moduleDe));
  for (let i = c.offres.length; i < etals.length; i++) {
    const r = etals[i]!;
    let id: string | undefined;
    const aMonter = Object.keys(j.collection).filter((k) => k.endsWith('@' + r) && !bases.has(moduleDe(k)) && doublonsRequis(k, j.collection[k]!.niveau) !== null);
    if (aMonter.length && t.nombre() < COMPTOIR.partDoublons) id = aMonter[t.entier(aMonter.length)];
    for (let g = 0; !id && g < 40; g++) {
      const m = MODULES[t.entier(MODULES.length)]!;
      if (!bases.has(m.id)) id = carteId(m.id, r);
    }
    if (!id) break;
    bases.add(moduleDe(id));
    c.offres.push(id);
  }
}

/** Achète l'offre n° index du Comptoir : la carte rejoint la collection (nouvelle carte, ou doublon) */
export function acheter(j: Jeu, index: number, now = j.dernierTick): Resultat {
  if (!j.batiments.comptoir) return non('Le Comptoir est fermé : remets-le d’abord en état.');
  garnirComptoir(j, now);
  const c = j.comptoir;
  const id = c.offres[index];
  if (!id) return non('Cette offre n’existe pas.');
  if (c.achetes.includes(index)) return non('Déjà acheté aujourd’hui : le Comptoir se renouvelle demain.');
  const p = prixComptoir(id);
  if (j.composants < p.composants || j.eclats < p.eclats) return non('Pas assez de ressources.');
  j.composants -= p.composants;
  j.eclats -= p.eclats;
  c.achetes.push(index);
  const neuve = ajouterCarte(j, id);
  log(j, neuve ? `Comptoir : nouvelle carte, ${moduleDef(id).nom} (${NOMS_RARETE[moduleDef(id).rarete]}).` : `Comptoir : un doublon de ${moduleDef(id).nom}.`);
  return { ok: true };
}
