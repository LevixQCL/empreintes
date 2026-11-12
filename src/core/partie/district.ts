// Couche 3 — la vie du district : chantiers et Forge, postes, cartes confiées, creuseurs, entraînement, Comptoir, quotidiens, objectif réclamé.
// Fonctions pures : le temps est toujours passé en paramètre (`now`, en ms).

import { batimentDef, porteurDef, PORTEURS, BATIMENTS, tirablesEn, moduleDe, moduleDef, carteId, CARTES_COMMUNES, forceCommune, deNom } from '../donnees';
import type { BatimentId, Rarete } from '../types';
import { COLLECTION, RARETES, ajouterCarte, auMoins, NOMS_RARETE, composantsNiveau, doublonsRequis, metalDessus, metalTranche, niveauRequis, poidsCarte } from '../collection';
import { tireur } from '../rng';
import { partPvClinique, CERCLE, CERCLE_OUVERTURE, CONFIANCE, accueillirFamille, nbFoyers, ACCORD_OUVERT, escouadeDe, ARCHIVE, niveauConfiance, chargeMax, chargePortee, CREUSEURS, DISTRICT, QUOTIDIENS, XP, creuseursRequis, enExpedition, heuresDeTaille, jourDe, log, multiplicateur, niveauPorteur, non, porteursPresents, posteDe, pvNiveau, strateVaincue, type Comptoir, type Jeu, type Poste, type Seance, type Resultat, xpPourNiveau } from './etat';
import { OBJECTIFS, objectifCourant } from './objectifs';
import { ORDRE_FAMILLES, fragmentDef } from '../fragments';
import { familleDef, familleDuFragment } from '../familles';
import { t as tr, enumerer } from '../i18n';

export function humeurDistrict(j: Jeu): string {
  const f = nbFoyers(j);
  const n = niveauConfiance(f);
  return n.requis ? tr`${f} familles sur ${CONFIANCE.population} te suivent : encore ${n.requis - n.dans} pour le prochain palier.` : tr('Tout le district te suit.');
}

/**
 * Les paliers de Confiance atteints et pas encore récompensés (30 octobre 2026 ; en familles depuis le 7 novembre 2026) :
 * chacun amène un creuseur volontaire (s'il y a de quoi le loger) et une famille qui apporte un souvenir aux Archives.
 * Cette famille-là fait partie du district : si elle n'était pas encore venue, elle arrive avec son souvenir.
 * Renvoie les annonces à montrer.
 */
export function recompenserConfiance(j: Jeu): string[] {
  const annonces: string[] = [];
  while ((j.confianceRecue ?? 0) < niveauConfiance(nbFoyers(j)).niveau) {
    j.confianceRecue = (j.confianceRecue ?? 0) + 1;
    const palier = j.confianceRecue;
    const venus = gagnerCreuseurs(j, CREUSEURS.confiance, tr`${palier * CONFIANCE.palier} familles te suivent`);
    const fragment = ORDRE_FAMILLES.find((f) => !j.fragments.includes(f));
    let porteuse = '';
    if (fragment) {
      j.fragments.push(fragment);
      const fam = familleDuFragment(fragment);
      if (fam) { accueillirFamille(j, fam.id); porteuse = fam.nom; }
    }
    const plus = [venus ? tr`${venus > 1 ? `${venus} volontaires rejoignent` : tr('un volontaire rejoint')} les creuseurs` : '',
      fragment ? tr`${porteuse || tr('une famille')} apporte${porteuse ? 'nt' : ''} « ${fragmentDef(fragment)!.titre} » aux Archives` : '',
      palier === CONFIANCE.comptoir && j.batiments.comptoir > 0 ? tr('un étal de plus rouvre au Comptoir') : ''].filter(Boolean);
    const t = tr`${palier * CONFIANCE.palier} familles te suivent${palier === 8 ? tr(' : tout le district') : ''} !${plus.length ? ` ${plus.join(', ').replace(/^./, (c) => c.toUpperCase())}.` : ''}`;
    log(j, t);
    annonces.push(t);
  }
  return annonces;
}

/** Le nom d'une famille, pour les textes (« les Orlan ») */
export const nomFamille = (id: string) => familleDef(id)?.nom ?? tr('une famille');

export const soinParHeure = (j: Jeu) => (DISTRICT.soinParHeure[j.batiments.clinique] ?? 0) * multiplicateur(j, 'clinique');

/** Ce que coûte la refabrication d'un exemplaire */
export const coutRefabrication = (moduleId: string) => COLLECTION.refabrication[moduleDef(moduleId).rarete];

/** Vitesse de la Forge selon son niveau : +25 % par niveau */
export const vitesseForge = (niveau: number) => 1 + DISTRICT.forgeParNiveau * (niveau - 1);

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
  quoi: 'energie' | 'soin' | 'stockage' | 'creuseurs' | 'strate' | 'forge' | 'plafond' | 'chantiers' | 'porteur' | 'entrainement' | 'offres' | 'argent' | 'places' | 'barques' | 'commune' | 'cercle' | 'echanges' | 'ouvertes' | 'vitrine' | 'or' | 'eclats' | 'pv';
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
  if (b === 'generateur') g.push({ quoi: 'energie', texte: tr('Heures pour tailler le minerai'), avant: heuresDeTaille(j), apres: heuresDeTaille(apres), detail: tr('chaque heure, il en taille une part') });
  if (b === 'generateur' && (DISTRICT.eclatsParJour[niv + 1] ?? 0) > (DISTRICT.eclatsParJour[niv] ?? 0)) g.push({ quoi: 'eclats', texte: tr('Éclats recueillis par jour en taillant'), avant: DISTRICT.eclatsParJour[niv] ?? 0, apres: DISTRICT.eclatsParJour[niv + 1] ?? 0 });
  if (b === 'clinique') g.push({ quoi: 'soin', texte: tr('Usure soignée par heure'), avant: soinParHeure(j), apres: soinParHeure(apres), detail: tr('pour chaque Porteur au repos') });
  if (b === 'clinique' && partPvClinique(apres) > partPvClinique(j)) g.push({ quoi: 'pv', texte: tr('PV max. des Porteurs'), avant: Math.round(partPvClinique(j) * 100), apres: Math.round(partPvClinique(apres) * 100), unite: '%', detail: tr('en plus, pour tous') });
  if (b === 'clinique' && niv + 1 === ACCORD_OUVERT.clinique) {
    const joss = PORTEURS.find((p) => p.arrivee?.accord && !j.arrives.includes(p.id));
    if (joss) g.push({ quoi: 'porteur', texte: tr('La Clinique peut organiser un Accord ouvert'), detail: tr`un nouveau Résonant, quand ${ACCORD_OUVERT.confiance * CONFIANCE.palier} familles te suivent` });
  }
  if (b === 'forge') {
    g.push({ quoi: 'forge', texte: tr('Vitesse de refabrication'), avant: Math.round(vitesseForge(niv) * 100), apres: Math.round(vitesseForge(niv + 1) * 100), unite: '%' });
    for (const p of PORTEURS) {
      if (p.arrivee?.forge !== niv + 1 || j.arrives.includes(p.id)) continue;
      g.push({ quoi: 'porteur', texte: tr`${p.nom} rejoint le district`, ...(j.chambre ? {} : { detail: tr('une fois la chambre scellée') }) });
    }
  }
  if (b === 'comptoir') {
    g.push({ quoi: 'offres', texte: tr('Cartes en vente chaque jour'), avant: etalsDuComptoir(j).length, apres: etalsDuComptoir(apres).length });
    const argent = (x: Jeu) => (COMPTOIR.etals[x.batiments.comptoir] ?? []).includes('argent');
    const ec = (x: Jeu) => COMPTOIR.eclats.parJour[x.batiments.comptoir] ?? 0;
    if (ec(apres) > ec(j)) g.push({ quoi: 'eclats', texte: tr('Éclats en vente par jour'), avant: ec(j), apres: ec(apres), detail: tr`de ${COMPTOIR.eclats.prix[0]} à ${COMPTOIR.eclats.prix.at(-1)} cristaux l’Éclat` });
    if (argent(apres) && !argent(j)) g.push({ quoi: 'argent', texte: tr('Des cartes en argent'), ...(strateVaincue(j) < COMPTOIR.strateArgent ? { detail: tr`une fois la Strate −${COMPTOIR.strateArgent} vaincue` } : {}) });
  }
  if (b === 'cercle') {
    const t = (k: 'echangesJour' | 'ouvertes' | 'vitrine', x: Jeu) => CERCLE[k][Math.min(10, x.batiments.cercle ?? 0)] ?? 0;
    if (!niv) g.push({ quoi: 'cercle', texte: tr('Ouvre les amis, les duels et les échanges'), detail: tr('les directeurs des autres districts accostent') });
    if (t('echangesJour', apres) > t('echangesJour', j)) g.push({ quoi: 'echanges', texte: tr('Échanges par jour'), avant: t('echangesJour', j), apres: t('echangesJour', apres) });
    if (t('ouvertes', apres) > t('ouvertes', j)) g.push({ quoi: 'ouvertes', texte: tr('Propositions en attente'), avant: t('ouvertes', j), apres: t('ouvertes', apres) });
    if (t('vitrine', apres) > t('vitrine', j)) g.push({ quoi: 'vitrine', texte: tr('Cartes en vitrine'), avant: t('vitrine', j), apres: t('vitrine', apres) });
    if (niv + 1 === CERCLE.orAuNiveau) g.push({ quoi: 'or', texte: tr('Les cartes en or s’échangent'), detail: tr('la nacre, jamais') });
  }
  if (b === 'noyau') {
    const prof = profondeurNoyau(niv + 1);
    g.push({ quoi: 'creuseurs', texte: tr('Creuseurs logés'), avant: logementCreuseurs(j), apres: logementCreuseurs(apres),
      detail: prof === Infinity ? tr('plus aucune limite de profondeur') : tr`de quoi creuser jusqu’à la Strate −${prof}` });
    const manque = manquePourCreuser(j);
    if (manque && manque.creuseurs === 0 && noyauRequis(j.strate + 1) === niv + 1) g.push({ quoi: 'strate', texte: tr`Ouvre la Strate −${j.strate + 1}`, detail: tr('les creuseurs attendent déjà la place') });
    g.push({ quoi: 'plafond', texte: tr('Niveau max. des autres bâtiments'), avant: niv, apres: niv + 1 });
    if (placesEntrainement(apres) > placesEntrainement(j)) g.push({ quoi: 'places', texte: tr('Places d’entraînement'), avant: placesEntrainement(j), apres: placesEntrainement(apres), detail: tr('des Porteurs en même temps à la Tour') });
    if (barquesMax(apres) > barquesMax(j)) g.push({ quoi: 'barques', texte: tr('Barques en mer'), avant: barquesMax(j), apres: barquesMax(apres), detail: tr('des missions en même temps') });
    if (plafondEntrainement(apres) > plafondEntrainement(j)) g.push({ quoi: 'entrainement', texte: tr('Plafond d’entraînement de la Tour (sans dépasser ton meilleur titulaire)'), avant: plafondEntrainement(j), apres: plafondEntrainement(apres), detail: tr`séances ${Math.round(ENTRAINEMENT.vitesseParNoyau * 100)} % plus courtes` });
    if (niv + 1 === DISTRICT.chantiersNoyau2) g.push({ quoi: 'chantiers', texte: tr('Deux chantiers en même temps') });
  }
  // les cartes communes du Râtelier (31 octobre 2026, Luc : « savoir améliorer les cartes de district ») : on les améliore
  // en montant leur bâtiment ; la feuille du bâtiment le dit, carte par carte
  for (const c of CARTES_COMMUNES.filter((x) => x.batiment === b)) {
    if (c.niveau === niv + 1) g.push({ quoi: 'commune', texte: tr`Nouvelle carte commune : ${c.geste.nom}`, detail: tr('à prendre au Râtelier de l’escouade') });
    else if (c.niveau <= niv) {
      const avant = forceCommune(c, niv), apres = forceCommune(c, niv + 1);
      if (apres > avant) g.push({ quoi: 'commune', texte: tr`Force de la carte ${c.geste.nom}`, avant, apres });
    }
  }
  return g;
}

/** Les Porteurs qui portent déjà cette carte */
export const greffesDe = (j: Jeu, moduleId: string) => Object.keys(j.porteurs).filter((id) => j.porteurs[id]!.modules.includes(moduleId));

// ---------- Le temps qui passe ----------

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

/** Le gardien qu'il faut encore vaincre avant le prochain niveau de la Tour (0 : rien ne la retient) */
export function gardienPourTour(j: Jeu): number {
  const strate = DISTRICT.tourApresGardien[j.batiments.noyau + 1] ?? 0;
  return strate > strateVaincue(j) ? strate : 0;
}

export function ameliorer(j: Jeu, b: BatimentId, now = j.dernierTick): Resultat {
  const cout = coutAmelioration(j, b);
  if (!cout) return non(tr('Niveau maximum atteint.'));
  if (chantierDe(j, b)) return non(tr('Un chantier est déjà en cours sur ce bâtiment.'));
  if (b === 'cercle' && strateVaincue(j) < CERCLE_OUVERTURE) return non(tr`Aucun directeur n’accoste avant que la Strate −${CERCLE_OUVERTURE} soit vaincue.`);
  if (b !== 'noyau' && j.batiments[b] >= j.batiments.noyau) return non(tr('Améliore d’abord la Tour du Noyau.'));
  if (b === 'noyau' && gardienPourTour(j)) return non(tr`Les nouvelles fondations de la Tour s’ancrent dans la roche de la Strate −${gardienPourTour(j)} : il faut d’abord vaincre son gardien.`);
  if (b === 'noyau' && j.chantiers.length) return non(tr('Termine d’abord les chantiers en cours avant d’agrandir la Tour du Noyau.'));
  if (j.chantiers.length >= chantiersMax(j)) return non(chantiersMax(j) === 1 ? tr('Un seul chantier à la fois pour l’instant (deux au Noyau niveau 4).') : tr('Deux chantiers sont déjà en cours.'));
  if (j.energie < cout.energie || j.composants < cout.composants || j.eclats < (cout.eclats ?? 0)) return non(tr('Pas assez de ressources.'));
  j.energie -= cout.energie;
  j.composants -= cout.composants;
  j.eclats -= cout.eclats ?? 0;
  const duree = dureeChantier(j, b);
  progresser(j, 'chantier');
  if (duree <= 0) {
    j.batiments[b]++;
    log(j, tr`${batimentDef(b).nom} passe au niveau ${j.batiments[b]}.`);
    if (b === 'noyau') creuser(j);
    // le Comptoir rouvert garnit ses étals tout de suite (10 novembre 2026, audit : il affichait « Tout est vendu » jusqu'au tour d'horloge suivant)
    if (b === 'comptoir') garnirComptoir(j, now);
  } else {
    j.chantiers.push({ batiment: b, debut: now, fin: now + duree });
    log(j, tr`Chantier lancé : ${batimentDef(b).nom} vers le niveau ${j.batiments[b] + 1}.`);
  }
  return { ok: true };
}

export function poster(j: Jeu, id: string, b: Poste | null): Resultat {
  const p = j.porteurs[id];
  if (!p || !porteursPresents(j).includes(id)) return non(tr('Porteur inconnu.'));
  if (enExpedition(j, id)) return non(tr('Ce Porteur est en expédition.'));
  if (b === 'forge' && j.forge && p.poste === 'forge') return non(tr('La Forge travaille : attends la fin de la fabrication.'));
  if (p.poste === 'forge' && j.forge && b !== 'forge') return non(tr('La Forge travaille : attends la fin de la fabrication.'));
  if (b === 'noyau') {
    if (seanceDe(j, id)) return { ok: true };
    const a = apercuSeance(j, id);
    if (!a) return non(plafondSeance(j).par === 'escouade' ? tr`${porteurDef(id).nom} a rattrapé ton meilleur Porteur d’escouade : la suite se gagne dans les Strates.` : tr`${porteurDef(id).nom} a atteint le plafond de la Tour : monte-la pour aller plus loin.`);
    const n = placesEntrainement(j);
    if (seancesDe(j).length >= n) return non(n > 1 ? tr`Les ${n} places de la Tour sont prises : arrête une séance ou attends qu’une se termine.` : tr('La place de la Tour est prise : arrête la séance ou attends qu’elle se termine.'));
    if (j.energie < a.energie) return non(tr`Il manque ${a.energie - Math.floor(j.energie)} cristaux pour cette séance.`);
  }
  if (b && b !== 'noyau') {
    const occupant = posteDe(j, b);
    if (occupant && occupant !== id) {
      if (b === 'forge' && j.forge) return non(tr('La Forge travaille : attends la fin de la fabrication.'));
      j.porteurs[occupant]!.poste = null;
    }
  }
  if (p.poste === 'noyau' && b !== 'noyau') interrompreSeance(j, id);
  if (b === 'noyau') {
    const a = apercuSeance(j, id)!;
    j.energie -= a.energie;
    ouvrirSeance(j, id, a.energie);
    log(j, tr`${porteurDef(id).nom} commence une séance à la Tour du Noyau : niveau ${a.cible} (${a.energie} cristaux).`);
    return { ok: true };
  }
  p.poste = b;
  log(j, b ? tr`${porteurDef(id).nom} travaille maintenant : ${batimentDef(b).nom}.` : tr`${porteurDef(id).nom} se repose.`);
  return { ok: true };
}

/** La Forge refabrique un exemplaire d'une carte déjà trouvée : un doublon de plus */
export function fabriquer(j: Jeu, moduleId: string, now: number): Resultat {
  if (!j.collection[moduleId]) return non(tr('On ne refabrique qu’une carte déjà trouvée.'));
  if (moduleDef(moduleId).legs) return non(tr('Une carte de l’Héritage est unique : la Forge ne sait pas la refaire.'));
  if (j.forge) return non(tr('La Forge est déjà occupée.'));
  if (!posteDe(j, 'forge')) return non(tr('Il faut un Porteur au travail à la Forge.'));
  const c = coutRefabrication(moduleId);
  const manque = [
    j.energie < c.energie ? tr`${c.energie - Math.floor(j.energie)} cristaux` : '',
    j.composants < c.composants ? tr`${c.composants - j.composants} minerai` : '',
    j.eclats < c.eclats ? tr`${c.eclats - j.eclats} Éclat${c.eclats - j.eclats > 1 ? 's' : ''}` : '',
  ].filter(Boolean);
  if (manque.length) return non(tr`Pour refabriquer ${moduleDef(moduleId).nom}, il manque ${enumerer(manque)}.`);
  j.energie -= c.energie;
  j.composants -= c.composants;
  j.eclats -= c.eclats;
  j.forge = { moduleId, debut: now, fin: now + dureeFabrication(j, moduleId) };
  log(j, tr`La Forge refabrique ${moduleDef(moduleId).nom}.`);
  return { ok: true };
}

/** Recycle un doublon en minerai (`composants`) */
export function recycler(j: Jeu, moduleId: string): Resultat {
  const c = j.collection[moduleId];
  if (!c || c.doublons < 1) return non(tr('Aucun doublon à recycler.'));
  c.doublons--;
  const gain = COLLECTION.recyclage[moduleDef(moduleId).rarete];
  j.composants += gain;
  log(j, tr`Un doublon ${deNom(moduleDef(moduleId).nom)} recyclé : +${gain} minerai.`);
  return { ok: true };
}

/** Monte une carte d'un niveau avec ses doublons */
export function monter(j: Jeu, moduleId: string): Resultat {
  const c = j.collection[moduleId];
  if (!c) return non(tr('Carte inconnue.'));
  const requis = doublonsRequis(moduleId, c.niveau);
  if (requis === null) return non(tr('Niveau maximum atteint.'));
  if (c.doublons < requis) return non(tr`Il faut ${requis} doublon${requis > 1 ? 's' : ''}.`);
  const cout = composantsNiveau(c.niveau + 1);
  if (j.energie < cout) return non(tr`Il faut ${cout} cristaux.`);
  c.doublons -= requis;
  j.energie -= cout;
  c.niveau++;
  log(j, tr`${moduleDef(moduleId).nom} passe au niveau ${c.niveau}.`);
  return { ok: true };
}

/** La carte dépasserait-elle la Charge du Porteur (en prenant la place de `retire`) ? Renvoie le refus, sinon null */
function tropLourd(j: Jeu, porteurId: string, cle: string, retire?: string): string | null {
  const libre = chargeMax(j, porteurId) - chargePortee(j, porteurId) + (retire ? poidsCarte(retire) : 0);
  if (poidsCarte(cle) <= libre) return null;
  return tr`Trop lourd : ${moduleDef(cle).nom} pèse ${poidsCarte(cle)}, il ne reste que ${libre} de Charge à ${porteurDef(porteurId).nom}.`;
}

/** Le métal d'une carte demande un niveau de Porteur (NIVEAU_METAL) */
function tropBas(j: Jeu, porteurId: string, cle: string): string | null {
  const requis = niveauRequis(cle);
  if (niveauPorteur(j, porteurId).niveau >= requis) return null;
  return tr`${moduleDef(cle).nom} en ${NOMS_RARETE[moduleDef(cle).rarete].toLowerCase()} demande un Porteur de niveau ${requis} : ${porteurDef(porteurId).nom} est niveau ${niveauPorteur(j, porteurId).niveau}.`;
}

/** Confie une carte à un Porteur de sa lignée (un exemplaire n'est porté que par un Porteur ; il passe de l'un à l'autre) */
export function greffer(j: Jeu, moduleId: string, porteurId: string): Resultat {
  const p = j.porteurs[porteurId];
  if (!j.collection[moduleId]) return non(tr('Carte inconnue.'));
  if (!p || !porteursPresents(j).includes(porteurId)) return non(tr('Porteur inconnu.'));
  if (enExpedition(j, porteurId)) return non(tr('Ce Porteur est en expédition.'));
  if (porteurDef(porteurId).lignee !== moduleDef(moduleId).lignee) return non(tr('Cette carte ne convient qu’à sa lignée.'));
  const ancien = greffesDe(j, moduleId)[0];
  if (ancien === porteurId) return { ok: true };
  if (ancien && enExpedition(j, ancien)) return non(tr('Cette carte est en expédition.'));
  // il porte déjà cette carte dans un autre métal : la nouvelle prend sa place (24 octobre 2026, Bryan : une Morsure en argent
  // n'apparaissait pas pour Doran, qui portait la Morsure en fer). Un Porteur ne porte toujours qu'un métal de chaque carte.
  const autreMetal = p.modules.find((k) => k !== moduleId && moduleDe(k) === moduleDe(moduleId));
  if (!autreMetal && p.modules.length >= DISTRICT.cartesMax) return non(tr`${porteurDef(porteurId).nom} porte déjà ${DISTRICT.cartesMax} cartes : retires-en une.`);
  const bas = tropBas(j, porteurId, moduleId);
  if (bas) return non(bas);
  const trop = tropLourd(j, porteurId, moduleId, autreMetal);
  if (trop) return non(trop);
  if (ancien) j.porteurs[ancien]!.modules = j.porteurs[ancien]!.modules.filter((m) => m !== moduleId);
  if (autreMetal) {
    p.modules[p.modules.indexOf(autreMetal)] = moduleId;
    log(j, tr`${moduleDef(moduleId).nom} (${NOMS_RARETE[moduleDef(moduleId).rarete].toLowerCase()}) remplace celle en ${NOMS_RARETE[moduleDef(autreMetal).rarete].toLowerCase()} chez ${porteurDef(porteurId).nom}.`);
    return { ok: true };
  }
  p.modules.push(moduleId);
  log(j, tr`${moduleDef(moduleId).nom} confiée à ${porteurDef(porteurId).nom}.`);
  return { ok: true };
}

/** Échange une carte que le Porteur porte contre une autre (25 octobre 2026, Bryan : avec 6 cartes, il fallait en reprendre
 *  une puis en confier une autre). La nouvelle prend la place de l'ancienne ; si un autre Porteur la portait, elle passe chez lui. */
export function echanger(j: Jeu, retireId: string, ajouteId: string, porteurId: string): Resultat {
  const p = j.porteurs[porteurId];
  if (!p || !p.modules.includes(retireId)) return non(tr('Ce Porteur ne porte pas cette carte.'));
  if (retireId === ajouteId) return { ok: true };
  if (!j.collection[ajouteId]) return non(tr('Carte inconnue.'));
  if (enExpedition(j, porteurId)) return non(tr('Ce Porteur est en expédition.'));
  if (porteurDef(porteurId).lignee !== moduleDef(ajouteId).lignee) return non(tr('Cette carte ne convient qu’à sa lignée.'));
  if (p.modules.includes(ajouteId)) return non(tr`${porteurDef(porteurId).nom} porte déjà cette carte.`);
  const autreMetal = p.modules.find((k) => k !== retireId && moduleDe(k) === moduleDe(ajouteId));
  if (autreMetal) return non(tr`${porteurDef(porteurId).nom} porte déjà ${moduleDef(ajouteId).nom} en ${NOMS_RARETE[moduleDef(autreMetal).rarete].toLowerCase()} : échange plutôt celle-là.`);
  const bas = tropBas(j, porteurId, ajouteId);
  if (bas) return non(bas);
  const trop = tropLourd(j, porteurId, ajouteId, retireId);
  if (trop) return non(trop);
  const ancien = greffesDe(j, ajouteId)[0];
  if (ancien && enExpedition(j, ancien)) return non(tr('Cette carte est en expédition.'));
  if (ancien) j.porteurs[ancien]!.modules = j.porteurs[ancien]!.modules.filter((m) => m !== ajouteId);
  p.modules[p.modules.indexOf(retireId)] = ajouteId;
  log(j, tr`${moduleDef(ajouteId).nom} remplace ${moduleDef(retireId).nom} chez ${porteurDef(porteurId).nom}.`);
  return { ok: true };
}

export function degreffer(j: Jeu, moduleId: string): Resultat {
  const id = greffesDe(j, moduleId)[0];
  if (!id) return { ok: true };
  if (enExpedition(j, id)) return non(tr('Ce Porteur est en expédition.'));
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
/**
 * Le Noyau qu'il faut, en plus de loger les creuseurs (8 novembre 2026, audit du soir : le Noyau 7 suffisait pour −10 et
 * s'atteignait au jour 10, à −6 ; avec les Éclats du Comptoir et du Générateur, −10 tombait au jour 24) :
 * Noyau 8 pour −9, 9 pour −10 et le Fond. Les Éclats en trop ont enfin un but : monter la Tour.
 */
// 12 novembre 2026 : plus de niveau de Tour demandé pour −9 et −10 (avant : { 9: 8, 10: 9 })
export const NOYAU_MIN: Record<number, number> = {};
export const noyauRequis = (strate: number) => Math.max(1, CREUSEURS.logement.findIndex((n) => n >= creuseursRequis(strate)),
  NOYAU_MIN[Math.min(10, strate)] ?? 0);

/** Ajoute des creuseurs (dans la limite du logement) ; renvoie le nombre réellement arrivé */
export function gagnerCreuseurs(j: Jeu, n: number, raison: string): number {
  const avant = j.creuseurs ?? 0;
  j.creuseurs = Math.min(logementCreuseurs(j), avant + n);
  const arrives = j.creuseurs - avant;
  if (arrives > 0) log(j, tr`+${arrives} creuseur${arrives > 1 ? 's' : ''} : ${raison}.`);
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
  log(j, tr`Les creuseurs percent la roche : la Strate −${j.strate} est ouverte.`);
  return true;
}

// ---------- L'entraînement à la Tour : des séances d'un niveau (refonte du 28 octobre 2026) ----------
// Avant : un Porteur posté gagnait de l'XP sans fin et payait l'énergie à l'heure. On pouvait l'oublier là des jours,
// ou y garer ses meilleurs Porteurs entre deux parties : la Tour travaillait à la place du joueur.
// Maintenant (modèle « laboratoire » des jeux de gestion) : une séance = UN niveau. L'énergie se paie au lancement,
// la durée et le prix se voient avant de lancer, et à la fin le Porteur quitte la salle : il faut revenir le relancer.
// Rien n'est puni : interrompre (escouade, remplacement, « Arrêter ») garde l'XP gagnée et rend l'énergie du reste.
// Plafond (29 octobre 2026, Bryan : l'entraînement allait 4 à 10 fois plus vite que les missions et montait tout l'effectif
// au niveau 20 dès la Tour 5, sans jouer) : 3 niveaux par niveau de la Tour (niveau 20 à la Tour 7), et jamais au-delà du
// meilleur Porteur de l'escouade. Ce sont les combats qui font monter l'escouade ; la Tour fait suivre les réserves.
export const ENTRAINEMENT = {
  niveauxParNoyau: 3,
  /**
   * Les places de la salle d'entraînement selon le niveau de la Tour (index = niveau), 28 octobre 2026, Bryan :
   * chaque palier de la Tour se ressent, sans tout ouvrir d'un coup, étalé sur les dix niveaux :
   * 1 place aux niveaux 1-2, 2 aux niveaux 3-5, 3 aux niveaux 6-8, 4 aux niveaux 9-10.
   */
  places: [0, 1, 1, 2, 2, 2, 3, 3, 3, 4, 4],
  /** durée d'une séance complète vers le niveau visé : 2 h pour le niveau 2, + 1 h 09 par niveau (≈ 23 h pour le 20) */
  heuresBase: 2,
  heuresParNiveau: 1.15,
  /** chaque niveau de la Tour au-delà du premier raccourcit les séances de 6 % */
  vitesseParNoyau: 0.06,
  /** cristaux d'une séance complète : 0,6 × (niveau visé)^1,8, arrondi à 5 (9 novembre 2026 : l'ancien prix en énergie ÷ 20) */
  coutBase: 0.6,
  coutExposant: 1.8,
} as const;
/**
 * Les barques en mer en même temps selon le niveau de la Tour du Noyau (index = niveau), 28 octobre 2026, Bryan :
 * 1 aux niveaux 1-2, 2 aux niveaux 3-5, 3 aux niveaux 6-8, 4 aux niveaux 9-10. Les destinations du jour (2 à 5) laissent un choix.
 */
export const BARQUES = [0, 1, 1, 2, 2, 2, 3, 3, 3, 4, 4] as const;
export const barquesMax = (j: Jeu): number => BARQUES[Math.min(j.batiments.noyau, BARQUES.length - 1)] ?? 1;
export const placesEntrainement = (j: Jeu) => ENTRAINEMENT.places[Math.min(j.batiments.noyau, ENTRAINEMENT.places.length - 1)] ?? 1;
/** Les séances en cours (répare au passage une sauvegarde qui n'en a pas encore la liste) */
export const seancesDe = (j: Jeu): Seance[] => (j.seances ??= []);
export const seanceDe = (j: Jeu, id: string) => seancesDe(j).find((s) => s.porteur === id) ?? null;
export const plafondEntrainement = (j: Pick<Jeu, 'batiments'>) => Math.min(XP.niveauMax, ENTRAINEMENT.niveauxParNoyau * j.batiments.noyau);
/** Le niveau du meilleur Porteur de l'escouade (sans escouade : le plus avancé du district) */
export function niveauTitulaire(j: Jeu): number {
  const esc = escouadeDe(j);
  const ids = esc.length ? esc : porteursPresents(j);
  return Math.max(1, ...ids.map((id) => niveauPorteur(j, id).niveau));
}
/** Le niveau qu'on peut atteindre à la Tour aujourd'hui, et ce qui le fixe : la Tour, ou le meilleur titulaire */
export function plafondSeance(j: Jeu): { niveau: number; par: 'tour' | 'escouade' } {
  const tour = plafondEntrainement(j);
  const tit = niveauTitulaire(j);
  return tit < tour ? { niveau: tit, par: 'escouade' } : { niveau: tour, par: 'tour' };
}
/** Raccourcissement des séances dû à la Tour (1 = aucun) */
export const vitesseEntrainement = (noyau: number) => 1 - ENTRAINEMENT.vitesseParNoyau * Math.max(0, noyau - 1);
/** XP totale pour atteindre un niveau depuis le niveau 1 */
const xpPourAtteindre = (niveau: number) => { let s = 0; for (let n = 1; n < niveau; n++) s += xpPourNiveau(n); return s; };

/** Ce que coûterait et durerait la séance d'un Porteur (null : rien à gagner, plafond atteint) */
export function apercuSeance(j: Jeu, id: string): { cible: number; heures: number; energie: number; xp: number } | null {
  const n = niveauPorteur(j, id);
  if (n.requis === null || n.niveau >= plafondSeance(j).niveau) return null;
  const cible = n.niveau + 1;
  const xp = xpPourAtteindre(cible) - (j.porteurs[id]!.xp ?? 0);
  const part = Math.max(0, Math.min(1, xp / n.requis));
  const tete = Math.max(...Object.keys(j.porteurs).map((k) => niveauPorteur(j, k).niveau));
  const heuresCompletes = (ENTRAINEMENT.heuresBase + ENTRAINEMENT.heuresParNiveau * (cible - 2)) * vitesseEntrainement(j.batiments.noyau)
    / (tete - n.niveau >= 2 ? XP.rattrapage : 1);
  const coutComplet = Math.max(5, Math.round((ENTRAINEMENT.coutBase * cible ** ENTRAINEMENT.coutExposant) / 5) * 5);
  return { cible, heures: Math.max(1 / 60, heuresCompletes * part), energie: Math.ceil(coutComplet * part), xp };
}

/** Ouvre une séance (le paiement est vérifié par poster) */
function ouvrirSeance(j: Jeu, id: string, energie: number): boolean {
  const a = apercuSeance(j, id);
  if (!a) return false;
  seancesDe(j).push({ porteur: id, cible: a.cible, xpTotale: a.xp, xpGagnee: 0, xpHeure: a.xp / a.heures, energie });
  j.porteurs[id]!.poste = 'noyau';
  return true;
}

/** Arrête la séance d'un Porteur : l'XP gagnée reste, l'énergie des heures non faites est rendue. Renvoie l'énergie rendue. */
export function interrompreSeance(j: Jeu, id: string): number {
  const s = seanceDe(j, id);
  const p = j.porteurs[id];
  if (p?.poste === 'noyau') p.poste = null;
  if (!s) return 0;
  const reste = s.xpTotale > 0 ? Math.max(0, 1 - s.xpGagnee / s.xpTotale) : 0;
  const rendu = Math.max(0, Math.floor(s.energie * reste));
  j.energie += rendu;
  j.seances = seancesDe(j).filter((x) => x !== s);
  log(j, tr`Séance interrompue : ${porteurDef(id).nom} quitte la Tour${rendu ? tr` (${rendu} cristaux rendus)` : ''}.`);
  return rendu;
}

/** Reprend les anciennes sauvegardes (une seule place, ou un Porteur posté sans séance) et répare les séances orphelines */
export function accorderSeance(j: Jeu): void {
  const liste = seancesDe(j);
  if (j.seance) { if (!liste.some((s) => s.porteur === j.seance!.porteur)) liste.push(j.seance); }
  delete j.seance;
  j.seances = liste.filter((s) => j.porteurs[s.porteur]?.poste === 'noyau');
  for (const id of Object.keys(j.porteurs)) {
    if (j.porteurs[id]!.poste !== 'noyau' || seanceDe(j, id)) continue;
    if (!ouvrirSeance(j, id, 0)) j.porteurs[id]!.poste = null;
  }
}

/** Le temps passé à la Tour (appelé par tick) : renvoie l'annonce de chaque séance terminée */
export function entrainer(j: Jeu, heures: number): string[] {
  const annonces: string[] = [];
  for (const s of seancesDe(j).slice()) {
    const d = j.porteurs[s.porteur];
    if (!d || d.poste !== 'noyau' || enExpedition(j, s.porteur)) { interrompreSeance(j, s.porteur); continue; }
    if (heures > 0) {
      // l'XP s'accumule à la fraction près (le district se met à jour chaque seconde)
      const gain = Math.min(s.xpTotale - s.xpGagnee, s.xpHeure * heures);
      s.xpGagnee += gain;
      d.xp = (d.xp ?? 0) + gain;
    }
    // déjà monté par une autre voie (récompense, rapport…) : la séance s'achève, l'énergie des heures non faites revient
    const atteint = niveauPorteur(j, s.porteur).niveau >= s.cible;
    if (s.xpGagnee < s.xpTotale - 1e-6 && !atteint) continue;
    if (atteint && s.xpTotale > 0) j.energie += Math.floor(s.energie * Math.max(0, 1 - s.xpGagnee / s.xpTotale));
    d.xp = Math.max(d.xp ?? 0, xpPourAtteindre(s.cible));
    d.poste = null;
    j.seances = seancesDe(j).filter((x) => x !== s);
    j.derniereSeance = s.porteur;
    const t = tr`${porteurDef(s.porteur).nom} a fini sa séance à la Tour : niveau ${niveauPorteur(j, s.porteur).niveau}, ${pvNiveau(j, s.porteur)} PV. Une place se libère.`;
    log(j, t);
    annonces.push(t);
  }
  return annonces;
}

// ---------- Le Comptoir (23 octobre 2026) ----------
// « Forger, acheter ou combattre » : acheter manquait. Les fouilleurs du quartier y revendent chaque jour quelques cartes
// trouvées dans les Strates, à prix fixe : on voit la carte avant de payer, aucun hasard n'est jamais payé.
// L'or et la nacre ne s'y vendent jamais : ils restent à trouver. L'argent n'y paraît qu'une fois la Strate −4 vaincue.
// Une offre sur deux est, quand c'est possible, un doublon d'une carte qu'on possède : de quoi la faire monter.
export const COMPTOIR = {
  /** les étals de chaque jour selon le niveau du Comptoir (index = niveau ; 0 = pas encore construit) */
  etals: [[], ['fer', 'fer', 'cuivre'], ['fer', 'fer', 'cuivre', 'cuivre'], ['fer', 'cuivre', 'cuivre', 'argent'],
    ['fer', 'fer', 'cuivre', 'cuivre', 'argent'], ['fer', 'fer', 'cuivre', 'cuivre', 'argent', 'argent'],
    // niveaux 6 à 10 (28 octobre 2026) : plus d'étals et davantage d'argent, jamais d'or ni de nacre
    ['fer', 'fer', 'cuivre', 'cuivre', 'cuivre', 'argent', 'argent'], ['fer', 'cuivre', 'cuivre', 'cuivre', 'argent', 'argent', 'argent'],
    ['fer', 'fer', 'cuivre', 'cuivre', 'cuivre', 'argent', 'argent', 'argent'], ['fer', 'cuivre', 'cuivre', 'cuivre', 'cuivre', 'argent', 'argent', 'argent'],
    ['fer', 'cuivre', 'cuivre', 'cuivre', 'argent', 'argent', 'argent', 'argent']] as Rarete[][],
  /** prix fixes : environ 1,5 fois la refabrication à la Forge (qui, elle, ne refait qu'une carte déjà trouvée) */
  prix: { fer: { composants: 40, eclats: 0 }, cuivre: { composants: 120, eclats: 0 }, argent: { composants: 300, eclats: 3 },
    // l'or n'était jamais vendu ; son prix suit la même règle (environ 1,5 fois la refabrication : 535 cristaux et 5 Éclats)
    or: { composants: 800, eclats: 7 } } as Partial<Record<Rarete, { composants: number; eclats: number }>>,
  strateArgent: 4,
  partDoublons: 0.5,
  /** renouveler les étals encore en vente, une fois par jour (1er novembre 2026, Bryan) : la moitié d'une carte en cuivre */
  renouveler: 60,
  /**
   * Des Éclats contre des composants (audit du 7 novembre 2026 : 10 000 composants sans usage au jour 21, Éclats entre 0 et 4
   * dès le jour 10, Noyau bloqué au niveau 8 du jour 25 au jour 40). Les fouilleurs revendent aussi les Éclats qu'ils remontent,
   * en petite quantité. 8 novembre 2026 (audit du soir : 11 000 composants au jour 40, le Comptoir bloqué au niveau 4 faute d'Éclats) :
   * de 1 à 6 Éclats par jour selon le niveau du Comptoir (avant : 1 ou 2), à prix croissant dans la journée (500, 700, puis 1 000).
   * Au plus 5 200 composants par jour au niveau 10 : de quoi absorber le surplus sans que les Éclats deviennent gratuits.
   */
  /** 9 novembre 2026 : 300 / 450 / 650 cristaux (la cristallisation du Générateur a disparu, le Comptoir prend le relais) */
  eclats: { composants: 300, prix: [300, 450, 650] as number[], parJour: [0, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6] as number[] },
} as const;

/** Les Éclats que le Comptoir vend encore aujourd'hui */
export function eclatsAuComptoir(j: Jeu): { max: number; restants: number } {
  const max = COMPTOIR.eclats.parJour[j.batiments.comptoir] ?? 0;
  return { max, restants: Math.max(0, max - (j.comptoir.eclats ?? 0)) };
}

/** Le prix du prochain Éclat au Comptoir aujourd'hui : 500, puis 700, puis 1 000 composants */
export const prixEclatComptoir = (j: Jeu) => COMPTOIR.eclats.prix[Math.min(COMPTOIR.eclats.prix.length - 1, j.comptoir.eclats ?? 0)]!;

/** Achète un Éclat au Comptoir, contre des composants */
export function acheterEclat(j: Jeu, now = j.dernierTick): Resultat {
  if (!j.batiments.comptoir) return non(tr('Le Comptoir est fermé : remets-le d’abord en état.'));
  garnirComptoir(j, now);
  if (!eclatsAuComptoir(j).restants) return non(tr('Les fouilleurs n’ont plus d’Éclats à vendre aujourd’hui : nouvel arrivage demain.'));
  const prix = prixEclatComptoir(j);
  if (j.energie < prix) return non(tr`Il faut ${prix} cristaux pour cet Éclat.`);
  j.energie -= prix;
  j.eclats += 1;
  j.comptoir.eclats = (j.comptoir.eclats ?? 0) + 1;
  log(j, tr`Comptoir : un Éclat acheté (${prix} cristaux).`);
  return { ok: true, message: tr`+1 Éclat pour ${prix} cristaux.` };
}

export function comptoirVide(now: number, rng: number): Comptoir {
  return { jour: jourDe(now), offres: [], achetes: [], rng: (rng ^ 0x9e3779b9) >>> 0 };
}

/** Les métaux des étals du jour (l'argent n'arrive qu'une fois la Strate −4 vaincue ; avant, du cuivre à sa place) */
export function etalsDuComptoir(j: Jeu): Rarete[] {
  // 12 novembre 2026 (révision complète, chantier 4) : les étals suivent la tranche de la Strate la plus profonde ouverte.
  // Un étal « fer » vend le métal sous la tranche, un étal « cuivre » celui de la tranche, un étal « argent » celui du dessus
  // (jamais moins qu'avant, jamais de nacre) : à −8, le Comptoir vend du cuivre, de l'argent et de l'or au lieu de fer.
  const tranche = metalTranche(j.strate), sous = RARETES[Math.max(0, RARETES.indexOf(tranche) - 1)]!;
  const etals = (COMPTOIR.etals[j.batiments.comptoir] ?? []).map((r) => (r === 'argent' && strateVaincue(j) < COMPTOIR.strateArgent ? 'cuivre' : r))
    .map((r): Rarete => (r === 'fer' ? auMoins('fer', sous) : r === 'cuivre' ? auMoins('cuivre', tranche) : auMoins(r, metalDessus(j.strate))));
  // 18 familles qui te suivent (30 octobre 2026) : un marchand du quartier rouvre son étal
  return etals.length && niveauConfiance(nbFoyers(j)).niveau >= CONFIANCE.comptoir ? [...etals, 'cuivre'] : etals;
}
export const prixComptoir = (id: string) => COMPTOIR.prix[moduleDef(id).rarete] ?? { composants: 0, eclats: 0 };

/** Renouvelle les offres chaque jour ; un Comptoir agrandi dans la journée ajoute ses nouveaux étals sans toucher aux autres */
export function garnirComptoir(j: Jeu, now: number): void {
  const c = j.comptoir;
  const jour = jourDe(now);
  if (c.jour !== jour) { c.jour = jour; c.offres = []; c.achetes = []; c.renouvele = false; c.eclats = 0; }
  const etals = etalsDuComptoir(j);
  if (c.offres.length >= etals.length) return;
  const t = tireur(c);
  const bases = new Set(c.offres.map(moduleDe));
  for (let i = c.offres.length; i < etals.length; i++) {
    const id = tirerOffre(j, t, etals[i]!, bases);
    if (!id) break;
    bases.add(moduleDe(id));
    c.offres.push(id);
  }
}

/** Une offre du métal r : un doublon utile une fois sur deux, sinon une carte tirable ; jamais un module déjà dans bases */
function tirerOffre(j: Jeu, t: ReturnType<typeof tireur>, r: Rarete, bases: Set<string>): string | undefined {
  let id: string | undefined;
  const aMonter = Object.keys(j.collection).filter((k) => k.endsWith('@' + r) && !moduleDef(k).legs && !bases.has(moduleDe(k)) && doublonsRequis(k, j.collection[k]!.niveau) !== null);
  if (aMonter.length && t.nombre() < COMPTOIR.partDoublons) id = aMonter[t.entier(aMonter.length)];
  for (let g = 0; !id && g < 40; g++) {
    const pool = tirablesEn(r);
    const m = pool[t.entier(pool.length)]!;
    if (!bases.has(m.id)) id = carteId(m.id, r);
  }
  return id;
}

/** Peut-on renouveler les étals aujourd'hui ? (une fois par jour, s'il reste au moins une carte en vente) */
export function renouvelablesComptoir(j: Jeu): number[] {
  const c = j.comptoir;
  if (!j.batiments.comptoir || c.renouvele) return [];
  return c.offres.map((_, i) => i).filter((i) => !c.achetes.includes(i));
}

/**
 * Renouveler les étals (1er novembre 2026, Bryan : « une fois par jour, payant en composants ») : les cartes encore en
 * vente sont remplacées par d'autres du même métal, jamais les mêmes ; les cartes achetées restent achetées.
 */
export function renouvelerComptoir(j: Jeu, now = j.dernierTick): Resultat {
  if (!j.batiments.comptoir) return non(tr('Le Comptoir est fermé : remets-le d’abord en état.'));
  garnirComptoir(j, now);
  const c = j.comptoir;
  if (c.renouvele) return non(tr('Les étals ont déjà été renouvelés aujourd’hui : nouvel arrivage demain.'));
  const places = renouvelablesComptoir(j);
  if (!places.length) return non(tr('Tout est vendu : nouvel arrivage demain.'));
  if (j.energie < COMPTOIR.renouveler) return non(tr('Pas assez de cristaux.'));
  const t = tireur(c);
  const metaux = places.map((i) => moduleDef(c.offres[i]!).rarete);
  // jamais une carte déjà proposée aujourd'hui ; si le métal n'en a plus assez, on garde l'ancienne
  const bases = new Set(c.offres.map(moduleDe));
  places.forEach((i, n) => {
    const id = tirerOffre(j, t, metaux[n]!, bases);
    if (id) { bases.add(moduleDe(id)); c.offres[i] = id; }
  });
  j.energie -= COMPTOIR.renouveler;
  c.renouvele = true;
  log(j, tr('Comptoir : les étals ont été renouvelés.'));
  return { ok: true };
}

/** Achète l'offre n° index du Comptoir : la carte rejoint la collection (nouvelle carte, ou doublon) */
export function acheter(j: Jeu, index: number, now = j.dernierTick): Resultat {
  if (!j.batiments.comptoir) return non(tr('Le Comptoir est fermé : remets-le d’abord en état.'));
  garnirComptoir(j, now);
  const c = j.comptoir;
  const id = c.offres[index];
  if (!id) return non(tr('Cette offre n’existe pas.'));
  if (c.achetes.includes(index)) return non(tr('Déjà acheté aujourd’hui : le Comptoir se renouvelle demain.'));
  const p = prixComptoir(id);
  if (j.energie < p.composants || j.eclats < p.eclats) return non(tr('Pas assez de ressources.'));
  j.energie -= p.composants;
  j.eclats -= p.eclats;
  c.achetes.push(index);
  const neuve = ajouterCarte(j, id);
  log(j, neuve ? tr`Comptoir : nouvelle carte, ${moduleDef(id).nom} (${NOMS_RARETE[moduleDef(id).rarete]}).` : tr`Comptoir : un doublon ${deNom(moduleDef(id).nom)}.`);
  return { ok: true };
}

// ---------- Les soins intensifs ----------

/** Les soins intensifs de la Clinique : de l'énergie pour effacer l'Usure d'un Porteur tout de suite (sans attendre le repos) */
/** 9 novembre 2026 (cristal unique) : 1 cristal par point d'Usure (relu par un game designer : moins cher, l'Usure ne voudrait plus rien dire) */
/** 10 novembre 2026 (compte rendu de partie, validé par Bryan) : 2 cristaux par point. À 1 cristal, l'Usure n'existait pas (120 cristaux l'escouade entière).
 *  Robot (occasionnel moyen, avec la défaite au tiers du butin) : Strate −10 au jour 28 → 30 ; à 3 cristaux et un quart du butin, jour 34. */
export const SOINS_INTENSIFS = { usureParCristal: 0.5 };
/** Le prix en cristaux pour effacer `points` d'Usure */
export const prixSoins = (points: number) => Math.ceil(points / SOINS_INTENSIFS.usureParCristal);

export function soignerVite(j: Jeu, id: string): Resultat {
  const p = j.porteurs[id];
  if (!p || !porteursPresents(j).includes(id)) return non(tr('Ce Porteur n’est pas au district.'));
  if (j.batiments.clinique < 1) return non(tr('La Clinique est fermée.'));
  if (enExpedition(j, id)) return non(tr('Ce Porteur est en bas.'));
  const usure = Math.ceil(p.usure);
  if (usure < 1) return non(tr('Pas d’Usure à soigner.'));
  // la première fois, la Clinique les offre (4 novembre 2026, test critique : après la Strate −1, un Porteur à terre et
  // l'énergie dépensée à la Tour bloquaient toute nouvelle descente ; la première session finissait sur une impasse)
  if (!j.soinOffert) {
    j.soinOffert = true;
    p.usure = 0;
    return { ok: true, message: tr`La Clinique offre ses premiers soins intensifs : ${porteurDef(id).nom} est de nouveau sur pied (−${usure} Usure).` };
  }
  const points = Math.min(usure, Math.floor(Math.floor(j.energie) * SOINS_INTENSIFS.usureParCristal));
  if (points < 1) return non(tr`Il faut ${prixSoins(1)} cristaux pour un point d’Usure.`);
  j.energie -= prixSoins(points);
  p.usure = Math.max(0, p.usure - points);
  return { ok: true, message: tr`Soins intensifs : −${points} Usure pour ${porteurDef(id).nom} (${prixSoins(points)} cristal${prixSoins(points) > 1 ? 'x' : ''}).` };
}

/** Récupère la récompense de l'objectif en cours s'il est rempli */
export function reclamer(j: Jeu): Resultat {
  const o = objectifCourant(j);
  if (!o || !o.fait(j)) return non(tr('Objectif pas encore rempli.'));
  // les récompenses arrivent déjà taillées (9 novembre 2026)
  j.energie += (o.recompense.energie ?? 0) + (o.recompense.composants ?? 0);
  if (o.recompense.creuseurs && gagnerCreuseurs(j, o.recompense.creuseurs, tr('des volontaires rejoignent le chantier'))) creuser(j);
  j.objectif++;
  log(j, tr`Objectif rempli : ${o.titre}.`);
  return { ok: true };
}
