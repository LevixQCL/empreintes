// Couche 6 — le temps qui passe : rattrape le temps écoulé (énergie, soins, Forge, chantiers, missions, arrivées).
// Fonctions pures : le temps est toujours passé en paramètre (`now`, en ms).

import { batimentDef, moduleDef } from '../donnees';
import { ajouterCarte } from '../collection';
import { noterPalmares } from '../classements';
import { ARCHIVE, enExpedition, nuitDesLignes, raffiner, eclatsDeTaille, jourDe, log, semaineDe, type Jeu, typeDuJour } from './etat';
import { avancerFils, retourDeMission, verifierArrivees } from './descentes';
import { creuser, recompenserConfiance, entrainer, garnirComptoir, soinParHeure } from './district';
import { RAVITAILLEMENT, eveillerLegs, eveillerOrigines, noterStrates } from './recompenses';
import { recompenserFilleul } from './parrainage';
import { retourDeContrat } from './marees';
import { avancerBasses } from './basses';
import { retourConfiee } from './confiees';
import { perlesDuLundi, rattraperPerles } from './perles';
import { ASCENSION } from './fleche';
import { avancerExode } from './exode';
import { t as tr } from '../i18n';

/** Rattrape le temps écoulé : énergie, soins, Forge. Rien n'est perdu ni puni pendant l'absence. */
export function tick(j: Jeu, now: number): string[] {
  const nouvelles: string[] = [];
  nouvelles.push(...verifierArrivees(j));
  nouvelles.push(...avancerFils(j));
  eveillerLegs(j);
  eveillerOrigines(j);
  nouvelles.push(...recompenserFilleul(j));
  const dt = Math.max(0, now - j.dernierTick);
  const heures = dt / 3_600_000;
  j.dernierTick = now;

  // le Générateur taille le cristal brut en cristaux (9 novembre 2026) : rien ne se perd, il finit ce qui reste pendant l'absence
  const ec = eclatsDeTaille(j, raffiner(j, heures), now);
  if (ec) nouvelles.push(tr`Le Générateur a recueilli ${ec > 1 ? tr`${ec} Éclats` : tr('un Éclat')} en taillant le minerai.`);

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
    const t = tr`La Forge a refabriqué ${moduleDef(f.moduleId).nom} : un doublon de plus.`;
    log(j, t);
    nouvelles.push(t);
  }

  for (const c of j.chantiers.filter((x) => now >= x.fin)) {
    j.batiments[c.batiment]++;
    if (c.batiment === 'noyau' && creuser(j)) nouvelles.push(tr`La Tour du Noyau loge assez de creuseurs : la Strate −${j.strate} est ouverte.`);
    const t = tr`Chantier terminé : ${batimentDef(c.batiment).nom} passe au niveau ${j.batiments[c.batiment]}.`;
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
    if (creuser(j)) nouvelles.push(tr`Les volontaires suffisent : la Strate −${j.strate} est ouverte.`);
  }

  nouvelles.push(...entrainer(j, heures));
  // filet de sécurité (31 octobre 2026) : une sauvegarde où tout est prêt (gardien vaincu, assez de creuseurs, Tour assez haute)
  // perce la roche au lieu d'attendre un événement qui ne viendra plus
  if (creuser(j)) nouvelles.push(tr`Tes creuseurs percent la roche : la Strate −${j.strate} est ouverte.`);

  for (const m of j.missions.filter((x) => now >= x.fin)) nouvelles.push(retourDeMission(j, m));
  j.missions = j.missions.filter((x) => now < x.fin);
  if (j.marees?.contrat && now >= j.marees.contrat.fin) nouvelles.push(retourDeContrat(j));
  nouvelles.push(...avancerBasses(j, now));
  // la fouille confiée (12 novembre 2026) : l'escouade rentre, même jeu fermé
  if (j.confiee && now >= j.confiee.fin) nouvelles.push(retourConfiee(j));
  nouvelles.push(...avancerExode(j, now));
  if (semaineDe(now) > j.epreuves.semaine) j.epreuves = { semaine: semaineDe(now), faites: [] };
  const perle = perlesDuLundi(j, now);
  if (perle) nouvelles.push(perle);
  const rattrapage = rattraperPerles(j, Object.keys(ASCENSION.cartes).map(Number).filter((q) => ASCENSION.cartes[q] === 'nacre'));
  if (rattrapage) nouvelles.push(rattrapage);

  // un objectif du jour de plus en réserve chaque jour, 3 au plus : rien ne se perd pendant une courte absence
  const jour = jourDe(now);
  if (jour > j.quotidien.jour) {
    const avant = j.quotidien.reserve;
    j.quotidien.reserve = Math.min(3, j.quotidien.reserve + (jour - j.quotidien.jour));
    if (avant === 0) { j.quotidien.type = typeDuJour(jour); j.quotidien.progres = 0; }
    j.quotidien.jour = jour;
    noterStrates(j.quotidien, j.strate);
  }

  // un colis de ravitaillement de plus chaque jour, une semaine au plus (aucune série à perdre)
  if (jour > j.ravitaillement.jour) {
    j.ravitaillement.reserve = Math.min(RAVITAILLEMENT.reserveMax, j.ravitaillement.reserve + (jour - j.ravitaillement.jour));
    j.ravitaillement.jour = jour;
    noterStrates(j.ravitaillement, j.strate);
  }

  // l'Archive de la semaine s'ouvre le lundi
  const semaine = semaineDe(now);
  if (semaine > j.archive.semaine) {
    const paliers = ARCHIVE.paliers.filter((p) => j.archive.points >= p).length;
    if (paliers > 0) {
      // un Butin pas encore ouvert n'est plus écrasé par le suivant (audit du 7 novembre 2026) : ils s'empilent
      // chaque Butin garde la Strate ouverte ce lundi-là : son métal ne change plus s'il attend (12 novembre 2026)
      const a = j.archive, connues = a.strates ?? [];
      if (!a.aOuvrir) { a.aOuvrir = paliers; a.strates = [j.strate]; }
      else {
        const attente = (a.enAttente ?? []).map((_, i) => connues[i + 1] ?? j.strate);
        a.enAttente = [...(a.enAttente ?? []), paliers].slice(-(ARCHIVE.empilesMax - 1));
        a.strates = [connues[0] ?? j.strate, ...[...attente, j.strate].slice(-(ARCHIVE.empilesMax - 1))];
      }
      const t = tr('Le Butin de la semaine est prêt à être ouvert.');
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
