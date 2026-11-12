// Couche 5 — les secours en mer (12 novembre 2026) : les familles restées dans les quartiers noyés, derrière la digue.
// Bryan : « trop de systèmes pour un nouveau », « pour le pompage j'avoue n'avoir rien compris ». Les Basses du 7 novembre
// (écluse, batardeau à déplacer chaque semaine, dépôts de la marée) sont fondues dans le Port : secourir une famille est
// une mission en mer comme les autres.
// - au Port, volet Missions : une famille à secourir à la fois, dans l'ordre, du haut du flanc vers le bas ;
// - un Porteur libre part 3 h et la ramène, avec un peu de minerai et de l'XP ; une seule équipe de secours à la fois ;
// - un nouveau quartier noyé tous les deux Strates (−2, −3, −5, −7, −9) : 20 familles en tout, les autres viennent du quartier.
// Plus de batardeau, plus de secteur à choisir, plus de dépôts : rien à apprendre, rien qui se perde.

import { porteurDef } from '../donnees';
import { SECTEURS, lieuBassesDef, secteurDuLieu, type LieuBasses, type SecteurBasses } from '../digue';
import { familleDef } from '../familles';
import { XP, accueillirFamille, facteurXp, gagnerXp, log, nbFoyers, niveauConfiance, non, progresMarque, strateVaincue, usureMax, type EtatBasses, type Jeu, type RapportMission, type Resultat } from './etat';
import { rangerRapport } from './descentes';
import { raisonHorsContrat } from './marees';
import { t as tr } from '../i18n';

export const BASSES = {
  /** la Strate qu'il faut avoir vaincue pour que les secours partent (un jour après le Port) */
  ouverture: 2,
  /** un secours : sa durée, l'Usure, le minerai trouvé en plus de la famille */
  heures: 3,
  usure: 4,
  composants: 30,
  /** un ancien dépôt de la marée qui attendait encore dans une sauvegarde (rendu d'un coup, +25 % par Strate vaincue) */
  depot: 20,
} as const;

/** Les gains suivent la Strate, comme les missions en mer (+25 % par Strate vaincue) */
const parStrate = (j: Jeu) => 1 + 0.25 * (Math.max(1, strateVaincue(j)) - 1);

/** L'état des secours dans la sauvegarde (créé à la première ouverture) ; batardeau, semaine, vu et dépôts ne servent plus */
export function bassesDe(j: Jeu): EtatBasses {
  return (j.basses ??= { batardeau: null, semaine: -1, vu: -1, depots: 0, expedition: null, faits: [] });
}

export const bassesOuvertes = (j: Jeu) => strateVaincue(j) >= BASSES.ouverture
  // une partie qui les avait déjà commencées (ouverture à −1, avant le 8 novembre 2026) les garde
  || !!(j.basses && (j.basses.faits.length || j.basses.expedition));
export const secteurOuvert = (j: Jeu, s: SecteurBasses) => strateVaincue(j) >= s.strate;
export const secteursOuverts = (j: Jeu) => SECTEURS.filter((s) => secteurOuvert(j, s));
export const lieuFait = (j: Jeu, id: string) => !!j.basses?.faits.includes(id);
/** Les familles qui attendent encore dans un quartier noyé */
export const restantsSecteur = (j: Jeu, s: SecteurBasses) => s.lieux.filter((l) => !lieuFait(j, l.id)).length;

/** La prochaine famille à secourir : le premier lieu pas encore visité, du haut du flanc vers le bas (null : personne pour l'instant) */
export function prochainSecours(j: Jeu): { lieu: LieuBasses; secteur: SecteurBasses } | null {
  if (!bassesOuvertes(j)) return null;
  for (const s of secteursOuverts(j)) {
    const lieu = s.lieux.find((l) => !lieuFait(j, l.id));
    if (lieu) return { lieu, secteur: s };
  }
  return null;
}

/** Le prochain quartier noyé, pas encore à portée (null : ils le sont tous) */
export const secteurSuivant = (j: Jeu) => SECTEURS.find((s) => !secteurOuvert(j, s)) ?? null;

/** Pourquoi on ne peut pas envoyer quelqu'un dans ce lieu (null = on peut) */
export function raisonLieu(j: Jeu, lieu: string): string | null {
  const s = secteurDuLieu(lieu);
  if (!s || !bassesOuvertes(j)) return tr`Les secours partiront quand le gardien de la Strate −${BASSES.ouverture} sera vaincu.`;
  if (lieuFait(j, lieu)) return tr('Sa famille vit déjà au district.');
  if (!secteurOuvert(j, s)) return tr`Trop bas sur le flanc de la digue : il faut avoir vaincu la Strate −${s.strate}.`;
  if (j.basses?.expedition) return tr('Une équipe de secours est déjà partie : attends son retour.');
  return null;
}

/** Les Porteurs qui peuvent partir secourir une famille (les mêmes que pour la gabare) */
export const libresPourBasses = (j: Jeu) => Object.keys(j.porteurs).filter((id) => !raisonHorsContrat(j, id));

/** Envoie un Porteur chercher la famille d'un lieu */
export function envoyerBasses(j: Jeu, lieu: string, porteur: string, now: number): Resultat {
  const r = raisonLieu(j, lieu);
  if (r) return non(r);
  const pourquoi = raisonHorsContrat(j, porteur);
  if (pourquoi) return non(`${porteurDef(porteur)?.nom ?? tr('Ce Porteur')} : ${pourquoi.toLowerCase()}`);
  bassesDe(j).expedition = { lieu, porteur, debut: now, fin: now + BASSES.heures * 3_600_000, strate: strateVaincue(j) };
  log(j, tr`${porteurDef(porteur).nom} part secourir une famille : ${lieuBassesDef(lieu)!.nom}.`);
  return { ok: true };
}

/** Le retour d'un secours (appelé par tick) : la famille rejoint le district */
export function retourDesBasses(j: Jeu): string {
  const b = bassesDe(j);
  const x = b.expedition!;
  b.expedition = null;
  const lieu = lieuBassesDef(x.lieu) as LieuBasses;
  const fam = familleDef(lieu.famille)!;
  const p = porteurDef(x.porteur);
  b.faits = [...new Set([...b.faits, lieu.id])];
  const avantPalier = niveauConfiance(nbFoyers(j)).niveau;
  accueillirFamille(j, fam.id);
  const composants = Math.round(BASSES.composants * (1 + 0.25 * (Math.max(1, x.strate) - 1)));
  j.composants += composants;
  const xp = Math.round(XP.missionHeure * BASSES.heures * facteurXp(x.strate));
  const monte = gagnerXp(j, x.porteur, xp);
  const q = j.porteurs[x.porteur]!;
  const usureAvant = q.usure;
  q.usure = Math.min(usureMax(j, x.porteur), q.usure + BASSES.usure);
  const avantMarque = progresMarque(j, x.porteur)?.acquise;
  q.faits = { ...q.faits, missions: (q.faits?.missions ?? 0) + 1 };
  const mq = progresMarque(j, x.porteur);
  const marque = mq?.acquise && !avantMarque ? mq.nom : null;
  if (marque) log(j, tr`${p.nom} gagne la Marque ${mq!.nom} : ${mq!.texte}`);
  const Nom = `${fam.nom.charAt(0).toUpperCase()}${fam.nom.slice(1)}`;
  const palier = niveauConfiance(nbFoyers(j)).niveau > avantPalier;
  const recit = [
    tr`${p.nom} longe le flanc de la digue en barque jusqu’à ${lieu.nom.charAt(0).toLowerCase()}${lieu.nom.slice(1)}, à la lampe.`,
    lieu.trace,
    tr`${Nom} attendaient là. ${fam.qui} Ils remontent avec ${p.nom} : ils vivent désormais au district.`,
    ...(palier ? [tr`${nbFoyers(j)} familles te suivent : un nouveau palier.`] : []),
  ];
  const rapport: RapportMission = {
    porteur: x.porteur, strate: x.strate, duree: 'courte', fin: x.fin, recit, composants, xp, niveau: monte, cartes: [], creuseurs: 0,
    usure: Math.round((q.usure - usureAvant) * 10) / 10, marque, lu: false, basses: { lieu: lieu.id, famille: fam.id },
  };
  rangerRapport(j, rapport);
  const texte = tr`${p.nom} rentre au Port avec ${fam.nom} : +${composants} minerai, +${xp} XP.`;
  log(j, texte);
  return texte;
}

/** Les secours dans le tick : l'annonce à l'ouverture, les anciens dépôts rendus, le retour de l'équipe */
export function avancerBasses(j: Jeu, _now: number): string[] {
  const n: string[] = [];
  // la première fois : on explique (Bryan, 31 octobre 2026 : chaque nouveauté doit être expliquée aux nouveaux joueurs)
  if (!j.basses && bassesOuvertes(j)) {
    bassesDe(j);
    const t = tr('Au Port, une nouvelle mission : des familles vivent encore dans les quartiers noyés, derrière la digue. Envoie un Porteur les chercher, une famille à la fois.');
    log(j, t);
    n.push(t);
  }
  // une sauvegarde d'avant le 12 novembre 2026 : les dépôts de la marée qui attendaient sont rendus, rien ne se perd
  if (j.basses?.depots) {
    j.composants += Math.round(BASSES.depot * parStrate(j)) * j.basses.depots;
    j.basses.depots = 0;
  }
  if (j.basses?.expedition && _now >= j.basses.expedition.fin) n.push(retourDesBasses(j));
  return n;
}

/** Ce qui attend au Port pour les secours (pastille du volet Missions) */
export function bulleBasses(j: Jeu, now: number): { expedition: boolean; aFaire: boolean } {
  if (!bassesOuvertes(j)) return { expedition: false, aFaire: false };
  const x = bassesDe(j).expedition;
  return { expedition: !!x && now < x.fin, aFaire: !x && !!prochainSecours(j) && libresPourBasses(j).length > 0 };
}

/** Les familles secourues déjà au district, sur combien */
export const famillesDesBasses = (j: Jeu) => ({ faites: j.basses?.faits.length ?? 0, total: SECTEURS.reduce((n, s) => n + s.lieux.length, 0) });

