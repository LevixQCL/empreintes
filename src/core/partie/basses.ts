// Couche 5 — les Basses (7 novembre 2026) : le flanc extérieur de la digue, ses secteurs noyés et les familles restées en bas.
// Remplace les pompes du Générateur. Réglé avec un game designer externe (voir digue.ts) :
// - la marée réelle ne fait que l'ambiance ; chaque marée basse laisse un dépôt qui attend sans limite (deux au plus) ;
// - le batardeau garde UN secteur à sec : le premier est gratuit, puis on le déplace une fois par semaine (6 h de production) ;
// - dans le secteur à sec, chaque lieu cache une famille : un Porteur va la chercher (3 h), une expédition à la fois ;
// - un nouveau secteur tous les deux Strates (−1, −3, −5, −7, −9) : 20 familles en tout, les autres viennent du quartier.
// Rien ne se perd : un secteur pas encore choisi attend, un dépôt pas ramassé attend.

import { porteurDef } from '../donnees';
import { SECTEURS, etatMaree, indexBasse, lieuBassesDef, secteurDef, secteurDuLieu, type LieuBasses, type SecteurBasses } from '../digue';
import { familleDef } from '../familles';
import { XP, accueillirFamille, coutBatardeau, facteurXp, gagnerXp, log, nbFoyers, niveauConfiance, non, progresMarque, semaineDe, strateVaincue, usureMax, type EtatBasses, type Jeu, type RapportMission, type Resultat } from './etat';
import { rangerRapport } from './descentes';
import { raisonHorsContrat } from './marees';

export const BASSES = {
  /** la Strate qu'il faut avoir vaincue pour ouvrir l'écluse (8 novembre 2026, audit du soir : à −1, Port, missions, Basses,
   *  batardeau et familles arrivaient le même jour ; les Basses passent à −2, un jour après le Port) */
  ouverture: 2,
  /** les dépôts de la marée qui attendent, au plus */
  depotsMax: 2,
  /** composants d'un dépôt (×2 à grande marée), +25 % par Strate vaincue */
  depot: 20,
  /** une expédition : sa durée, l'Usure, les composants trouvés en plus de la famille (gratuite depuis le 9 novembre 2026) */
  heures: 3,
  usure: 4,
  composants: 30,
  /**
   * La suite des Basses (8 novembre 2026, audit du soir : les 48 familles rentrées vers le jour 35, il ne restait qu'un dépôt
   * de ~110 composants). Une fois −10 vaincue, l'eau du Fond remonte jusqu'à la grève : chaque dépôt laisse aussi des éclats
   * de colonne (1 Éclat, 2 à grande marée). Au plus 2 dépôts en attente : 2 à 4 Éclats par jour pour qui passe à l'écluse.
   */
  eclatsDes: 10,
} as const;

/** Les Éclats d'un dépôt (0 avant −10) */
export const eclatsDepot = (j: Jeu, now: number) => (strateVaincue(j) >= BASSES.eclatsDes ? (etatMaree(now).grande ? 2 : 1) : 0);

/** Les gains suivent la Strate, comme les missions en mer (+25 % par Strate vaincue) */
const parStrate = (j: Jeu) => 1 + 0.25 * (Math.max(1, strateVaincue(j)) - 1);

/** L'état des Basses dans la sauvegarde (créé à la première ouverture) */
export function bassesDe(j: Jeu): EtatBasses {
  return (j.basses ??= { batardeau: null, semaine: -1, vu: -1, depots: 0, expedition: null, faits: [] });
}

export const bassesOuvertes = (j: Jeu) => strateVaincue(j) >= BASSES.ouverture
  // une partie qui les avait déjà commencées (ouverture à −1, avant le 8 novembre 2026) les garde
  || !!(j.basses && (j.basses.batardeau || j.basses.faits.length || j.basses.expedition));
export const secteurOuvert = (j: Jeu, s: SecteurBasses) => strateVaincue(j) >= s.strate;
export const secteursOuverts = (j: Jeu) => SECTEURS.filter((s) => secteurOuvert(j, s));
export const lieuFait = (j: Jeu, id: string) => !!j.basses?.faits.includes(id);
/** Les familles qui attendent encore dans un secteur */
export const restantsSecteur = (j: Jeu, s: SecteurBasses) => s.lieux.filter((l) => !lieuFait(j, l.id)).length;
/** Le secteur à sec */
export const secteurASec = (j: Jeu) => (j.basses?.batardeau ? secteurDef(j.basses.batardeau) ?? null : null);

/** Ce qu'un dépôt rapporte maintenant */
export const valeurDepot = (j: Jeu, now: number) => Math.round(BASSES.depot * parStrate(j) * (etatMaree(now).grande ? 2 : 1));

/** Compte les marées basses passées depuis la dernière visite : chacune laisse un dépôt (deux au plus). Appelé par tick. */
export function compterDepots(j: Jeu, now: number) {
  if (!bassesOuvertes(j)) return;
  const b = bassesDe(j);
  const i = indexBasse(now);
  // la première fois, on part de la marée en cours : un dépôt tout de suite pour faire découvrir
  if (b.vu < 0) { b.vu = i; b.depots = 1; return; }
  if (i > b.vu) b.depots = Math.min(BASSES.depotsMax, b.depots + (i - b.vu));
  b.vu = Math.max(b.vu, i);
}

/** Ramasse un dépôt laissé par la marée */
export function ramasserDepot(j: Jeu, now: number): Resultat {
  if (!bassesOuvertes(j)) return non(`L’écluse reste fermée tant que le gardien de la Strate −${BASSES.ouverture} tient le puits.`);
  compterDepots(j, now);
  const b = bassesDe(j);
  if (b.depots < 1) return non(`Rien sur la grève pour l’instant : la mer laissera quelque chose à la prochaine marée basse.`);
  const n = valeurDepot(j, now);
  const e = eclatsDepot(j, now);
  b.depots--;
  j.composants += n;
  j.eclats += e;
  const grande = etatMaree(now).grande;
  if (e) return { ok: true, message: `${grande ? 'La grande marée a tout découvert' : 'L’eau du Fond est remontée jusqu’à la grève'} : +${n} minerai et ${e} Éclat${e > 1 ? 's' : ''} de colonne.` };
  return { ok: true, message: `${grande ? 'La grande marée a tout découvert' : 'La mer a laissé de quoi faire'} : +${n} minerai.` };
}

/** Pourquoi on ne peut pas dresser le batardeau sur ce secteur (null = on peut) ; le coût en cristaux (0 : gratuit) */
export function peutDresser(j: Jeu, id: string, now: number): { raison: string | null; cout: number } {
  const s = secteurDef(id);
  if (!s) return { raison: 'Secteur inconnu.', cout: 0 };
  if (!secteurOuvert(j, s)) return { raison: `Trop bas sur le flanc : il faut avoir vaincu la Strate −${s.strate}.`, cout: 0 };
  const b = bassesDe(j);
  if (b.batardeau === id) return { raison: 'Le batardeau garde déjà ce secteur à sec.', cout: 0 };
  if (!b.batardeau) return { raison: null, cout: 0 };
  if (b.expedition && secteurDuLieu(b.expedition.lieu)?.id === b.batardeau) return { raison: 'Un Porteur est encore dans le secteur à sec : on attend son retour.', cout: 0 };
  if (b.semaine === semaineDe(now)) return { raison: 'Le batardeau a déjà été déplacé cette semaine : il pourra bouger lundi.', cout: 0 };
  const cout = coutBatardeau(j);
  return { raison: j.energie < cout ? `Il faut ${cout} cristaux pour pomper un nouveau secteur.` : null, cout };
}

/** Dresse le batardeau : ce secteur reste à sec, l'ancien se remplit (ses familles attendent, rien n'est perdu) */
export function dresserBatardeau(j: Jeu, id: string, now: number): Resultat {
  const { raison, cout } = peutDresser(j, id, now);
  if (raison) return non(raison);
  const b = bassesDe(j);
  const premier = !b.batardeau;
  j.energie -= cout;
  b.batardeau = id;
  if (!premier) b.semaine = semaineDe(now);
  const s = secteurDef(id)!;
  log(j, `Le batardeau est dressé : ${s.nom} restent à sec.`);
  return { ok: true, message: `${s.nom} : les pompes vident le secteur. ${restantsSecteur(j, s) ? 'Des familles y attendent encore.' : 'Plus personne n’y attend.'}` };
}

/** Pourquoi on ne peut pas envoyer quelqu'un dans ce lieu (null = on peut) */
export function raisonLieu(j: Jeu, lieu: string): string | null {
  const s = secteurDuLieu(lieu);
  if (!s || !bassesOuvertes(j)) return 'L’écluse est fermée.';
  if (lieuFait(j, lieu)) return 'Sa famille vit déjà au district.';
  if (j.basses?.batardeau !== s.id) return 'Ce secteur est sous l’eau : il faut y dresser le batardeau.';
  if (j.basses?.expedition) return 'Un Porteur est déjà dans les Basses.';
  return null;
}

/** Les Porteurs qui peuvent descendre dans les Basses (les mêmes que pour la gabare) */
export const libresPourBasses = (j: Jeu) => Object.keys(j.porteurs).filter((id) => !raisonHorsContrat(j, id));

/** Envoie un Porteur chercher la famille d'un lieu */
export function envoyerBasses(j: Jeu, lieu: string, porteur: string, now: number): Resultat {
  const r = raisonLieu(j, lieu);
  if (r) return non(r);
  const pourquoi = raisonHorsContrat(j, porteur);
  if (pourquoi) return non(`${porteurDef(porteur)?.nom ?? 'Ce Porteur'} : ${pourquoi.toLowerCase()}`);
  bassesDe(j).expedition = { lieu, porteur, debut: now, fin: now + BASSES.heures * 3_600_000, strate: strateVaincue(j) };
  log(j, `${porteurDef(porteur).nom} descend le flanc de la digue : ${lieuBassesDef(lieu)!.nom}.`);
  return { ok: true };
}

/** Le retour d'une expédition dans les Basses (appelé par tick) : la famille rejoint le district */
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
  if (marque) log(j, `${p.nom} gagne la Marque ${mq!.nom} : ${mq!.texte}`);
  const Nom = `${fam.nom.charAt(0).toUpperCase()}${fam.nom.slice(1)}`;
  const palier = niveauConfiance(nbFoyers(j)).niveau > avantPalier;
  const recit = [
    `${p.nom} descend jusqu’à ${lieu.nom.charAt(0).toLowerCase()}${lieu.nom.slice(1)}, à la lampe, pendant que les pompes tiennent l’eau.`,
    lieu.trace,
    `${Nom} attendaient là. ${fam.qui} Ils remontent avec ${p.nom} : ils vivent désormais au district.`,
    ...(palier ? [`${nbFoyers(j)} familles te suivent : un nouveau palier.`] : []),
  ];
  const rapport: RapportMission = {
    porteur: x.porteur, strate: x.strate, duree: 'courte', fin: x.fin, recit, composants, xp, niveau: monte, cartes: [], creuseurs: 0,
    usure: Math.round((q.usure - usureAvant) * 10) / 10, marque, lu: false, basses: { lieu: lieu.id, famille: fam.id },
  };
  rangerRapport(j, rapport);
  const texte = `${p.nom} remonte des Basses avec ${fam.nom} : +${composants} minerai, +${xp} XP.`;
  log(j, texte);
  return texte;
}

/** Les Basses dans le tick : les dépôts de la marée, le retour de l'expédition */
export function avancerBasses(j: Jeu, now: number): string[] {
  const n: string[] = [];
  // la première fois : on explique (Bryan, 31 octobre 2026 : chaque nouveauté doit être expliquée aux nouveaux joueurs)
  if (!j.basses && bassesOuvertes(j)) {
    const t = 'L’écluse s’ouvre : de l’autre côté de la digue, des familles vivent encore dans les quartiers noyés. Touche l’écluse, au pied de la digue, pour dresser le batardeau et aller les chercher.';
    log(j, t);
    n.push(t);
  }
  compterDepots(j, now);
  if (j.basses?.expedition && now >= j.basses.expedition.fin) n.push(retourDesBasses(j));
  return n;
}

/** Ce qui attend dans les Basses (pour la bulle de l'écluse) */
export function bulleBasses(j: Jeu, now: number): { depots: number; expedition: boolean; aFaire: boolean } {
  if (!bassesOuvertes(j)) return { depots: 0, expedition: false, aFaire: false };
  const b = bassesDe(j);
  const s = secteurASec(j);
  const aFaire = !b.expedition && (!s ? secteursOuverts(j).some((x) => restantsSecteur(j, x) > 0) : restantsSecteur(j, s) > 0 && libresPourBasses(j).length > 0);
  return { depots: b.depots, expedition: !!b.expedition && now < b.expedition.fin, aFaire };
}

/** Les familles des Basses déjà au district, sur combien */
export const famillesDesBasses = (j: Jeu) => ({ faites: j.basses?.faits.length ?? 0, total: SECTEURS.reduce((n, s) => n + s.lieux.length, 0) });

