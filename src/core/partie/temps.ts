// Couche 6 — le temps qui passe : rattrape le temps écoulé (énergie, soins, Forge, chantiers, missions, arrivées).
// Fonctions pures : le temps est toujours passé en paramètre (`now`, en ms).

import { batimentDef, moduleDef } from '../donnees';
import { ajouterCarte } from '../collection';
import { noterPalmares } from '../classements';
import { ARCHIVE, enExpedition, nuitDesLignes, energieParHeure, jourDe, log, semaineDe, stockage, type Jeu, typeDuJour } from './etat';
import { avancerFils, retourDeMission, verifierArrivees } from './descentes';
import { creuser, recompenserConfiance, entrainer, garnirComptoir, soinParHeure } from './district';
import { RAVITAILLEMENT, eveillerLegs } from './recompenses';
import { recompenserFilleul } from './parrainage';

/** Rattrape le temps écoulé : énergie, soins, Forge. Rien n'est perdu ni puni pendant l'absence. */
export function tick(j: Jeu, now: number): string[] {
  const nouvelles: string[] = [];
  nouvelles.push(...verifierArrivees(j));
  nouvelles.push(...avancerFils(j));
  eveillerLegs(j);
  nouvelles.push(...recompenserFilleul(j));
  const dt = Math.max(0, now - j.dernierTick);
  const heures = dt / 3_600_000;
  j.dernierTick = now;

  // l'énergie produite (l'entraînement, lui, se paie au lancement de chaque séance : 28 octobre 2026)
  j.energie = Math.min(stockage(j), j.energie + energieParHeure(j) * heures);

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
    if (c.batiment === 'noyau' && creuser(j)) nouvelles.push(`La Tour du Noyau loge assez de creuseurs : la Strate −${j.strate} est ouverte.`);
    const t = `Chantier terminé : ${batimentDef(c.batiment).nom} passe au niveau ${j.batiments[c.batiment]}.`;
    log(j, t);
    nouvelles.push(t);
  }
  j.chantiers = j.chantiers.filter((x) => now < x.fin);
  // la Nuit des lignes, chaque lundi : le bilan de la semaine, et ceux qui rejoignent en plus
  const nuit = nuitDesLignes(j, now);
  if (nuit) nouvelles.push(nuit);
  // la Confiance du quartier : chaque palier atteint amène un creuseur volontaire, qui peut ouvrir l'étage suivant
  const confiance = recompenserConfiance(j);
  if (confiance.length) {
    nouvelles.push(...confiance);
    if (creuser(j)) nouvelles.push(`Les volontaires suffisent : la Strate −${j.strate} est ouverte.`);
  }

  nouvelles.push(...entrainer(j, heures));

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
      const t = 'Le Butin de la semaine est prêt à être ouvert.';
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
