// Couche 6 — le temps qui passe : rattrape le temps écoulé (énergie, soins, Forge, chantiers, missions, arrivées).
// Fonctions pures : le temps est toujours passé en paramètre (`now`, en ms).

import { batimentDef, moduleDef } from '../donnees';
import { ajouterCarte } from '../collection';
import { tireur } from '../rng';
import { noterPalmares } from '../classements';
import { ARCHIVE, CREUSEURS, enExpedition, energieParHeure, jourDe, log, semaineDe, stockage, type Jeu, typeDuJour } from './etat';
import { avancerFils, retourDeMission, verifierArrivees } from './descentes';
import { creuser, energieEntrainement, entrainer, gagnerCreuseurs, garnirComptoir, heuresEntrainement, soinParHeure } from './district';
import { RAVITAILLEMENT, eveillerLegs } from './recompenses';

/** Rattrape le temps écoulé : énergie, soins, Forge. Rien n'est perdu ni puni pendant l'absence. */
export function tick(j: Jeu, now: number): string[] {
  const nouvelles: string[] = [];
  nouvelles.push(...verifierArrivees(j));
  nouvelles.push(...avancerFils(j));
  eveillerLegs(j);
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
    if (tireur(j).nombre() < CREUSEURS.chantier) gagnerCreuseurs(j, 1, 'le chantier attire un volontaire');
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
