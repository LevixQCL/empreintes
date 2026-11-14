// Couche « confluence » — les Confluences (14 novembre 2026, plan « Cercle des quais » validé par Bryan le 13 novembre :
// Gardien de la ville chaque semaine, dons de copies, alliances de cuvettes ; « Confluence » choisi comme nom des alliances).
// Une Confluence, c'est quelques districts voisins dont les directeurs ont uni leurs digues : au plus 20 directeurs,
// un quai de discussion, des dons de copies et une Crue commune chaque semaine.
//
// Ce que retient l'étude des autres jeux (Clash Royale, Brawl Stars, Marvel Snap, AFK Arena, Hearthstone) :
//  - le don de cartes est la boucle sociale la plus efficace : on aide, on est remercié, on revient demain ;
//  - un objectif commun hebdomadaire, coopératif, jamais compétitif à l'intérieur du groupe ;
//  - rien de punitif : pas d'exclusion automatique, pas de « guerre » qui pénalise l'absent ;
//  - un chat de groupe, avec des messages rapides pour le téléphone, et les événements (dons, arrivées) dans le fil ;
//  - pas de canal public mondial : impossible à modérer, et coûteux en lectures sur l'offre gratuite de Firebase.
//
// Ce fichier ne garde que ce qui touche la partie (dons du jour, apport de la semaine, paliers reçus, demande en cours) ;
// la Confluence elle-même vit en ligne (src/net/confluence.ts). Le temps est toujours passé en paramètre.

import { ajouterCarte, tirerChoix } from '../collection';
import { moduleDef } from '../donnees';
import type { Rarete } from '../types';
import { cercleConstruit, etatCercle, raisonNonEchangeable } from './cercle';
import { etatGardien } from './gardien';
import { jourDe, non, semaineDe, strateVaincue, type Jeu, type Resultat } from './etat';
import { t } from '../i18n';

export const CONFLUENCE = {
  /** directeurs au plus dans une Confluence */
  membresMax: 20,
  /** fonder une Confluence (en cristaux) */
  prixFondation: 150,
  /** les emblèmes et les couleurs de pavillon proposés */
  emblemes: 6,
  couleurs: 8,
  /** une demande de copies toutes les 8 heures, et combien de copies selon le métal */
  demandeHeures: 8,
  copiesDemandees: { fer: 6, cuivre: 3, argent: 1, or: 0, nacre: 0 } as Record<Rarete, number>,
  /** l'argent se demande à partir du niveau 3 du Cercle */
  argentAuNiveau: 3,
  /** ce que rapporte un don au donneur, en cristaux, selon le métal ; au plus `donsJour` dons récompensés par jour */
  recompenseDon: { fer: 6, cuivre: 15, argent: 40, or: 0, nacre: 0 } as Record<Rarete, number>,
  donsJour: 12,
  /** le Courant de la semaine : ce que chaque geste apporte à la Crue commune */
  apport: { don: 10, joute: 15, partGardien: 4, demiStrate: 5 },
  /** les trois paliers de la Crue, par directeur (au moins 3 comptés : une Confluence d'un seul ne s'en tire pas à bon compte) */
  paliersParMembre: [30, 70, 120],
  membresComptesMin: 3,
  /** les récompenses des paliers (chacun les reçoit s'il a apporté quelque chose cette semaine) */
  recompenses: [{ cristaux: 80 }, { eclats: 3 }, { carte: true }] as { cristaux?: number; eclats?: number; carte?: boolean }[],
  /** messages : 160 caractères, et pas plus d'un toutes les 4 secondes */
  messageMax: 160,
  messageDelai: 4000,
} as const;

/** Les messages rapides (le fil les traduit : seul leur numéro voyage) */
export const MESSAGES_RAPIDES: string[] = [
  t('Bonjour à tous !'),
  t('Merci pour le don !'),
  t('Bien joué !'),
  t('Qui a un double à donner ?'),
  t('Je descends dans les Strates.'),
  t('On frappe le Gardien ?'),
  t('Encore un effort pour la Crue !'),
  t('Bonne nuit, les quais.'),
];

/** Les devises proposées à la fondation (modifiables ensuite) */
export const DEVISES: string[] = [
  t('Ensemble, plus haut que l’eau.'),
  t('Une digue, mille mains.'),
  t('Ce qu’on garde, on le partage.'),
  t('Le courant nous porte.'),
];

export interface DemandeEnCours {
  /** quand elle a été faite (sert d'identifiant : la demande suivante remplace celle-ci en ligne) */
  le: number;
  carte: string;
  voulu: number;
  /** les copies déjà ajoutées à la collection */
  appliques: number;
}

export interface EtatConfluence {
  /** la Confluence du directeur (son identifiant en ligne) et son nom, pour l'affichage hors ligne */
  id?: string;
  nom?: string;
  /** la semaine en cours, et ce qu'elle compte */
  semaine: number;
  dons: number;
  /** les paliers de la Crue déjà reçus cette semaine (0, 1, 2) */
  crue: number[];
  /** l'apport de la semaine déjà publié dans la Confluence */
  publie: number;
  /** les dons récompensés aujourd'hui */
  jourDons: number;
  donsDuJour: number;
  /** la demande de copies en cours (ou la dernière) */
  demande?: DemandeEnCours;
  /** les directeurs qu'on ne veut plus lire sur le quai (seulement chez soi) */
  muets?: string[];
}

export function etatConfluence(j: Jeu, now: number): EtatConfluence {
  const c = (j.confluence ??= { semaine: semaineDe(now), dons: 0, crue: [], publie: 0, jourDons: jourDe(now), donsDuJour: 0 });
  if (c.semaine !== semaineDe(now)) { c.semaine = semaineDe(now); c.dons = 0; c.crue = []; c.publie = 0; }
  if (c.jourDons !== jourDe(now)) { c.jourDons = jourDe(now); c.donsDuJour = 0; }
  return c;
}

/** Les Confluences s'ouvrent avec le Cercle des quais construit */
export const confluenceOuverte = (j: Jeu) => cercleConstruit(j);

/** L'identifiant d'une Confluence : son nom réduit (le même calcul que les pseudos, pour qu'un nom ne serve qu'une fois) */
export function cleConfluence(nom: string): string {
  return nom.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/œ/g, 'oe').replace(/æ/g, 'ae').replace(/ß/g, 'ss').replace(/[^a-z0-9]/g, '');
}

/** Pourquoi ce nom ne convient pas (null : il convient) */
export function raisonNom(nom: string): string | null {
  const n = nom.trim();
  if (n.length < 3 || n.length > 22) return t('Le nom fait de 3 à 22 caractères.');
  if (!/^[\p{L}\p{N} '’.-]+$/u.test(n)) return t('Lettres, chiffres, espaces, apostrophes et tirets seulement.');
  const c = cleConfluence(n);
  if (c.length < 3 || c.length > 24) return t('Le nom doit contenir au moins 3 lettres ou chiffres.');
  return null;
}

/** Fonder : le prix est payé ici ; l'écriture en ligne suit (src/app/confluence.ts), et rembourse si elle échoue */
export function payerFondation(j: Jeu): Resultat {
  if (!confluenceOuverte(j)) return non(t('Construis d’abord le Cercle des quais.'));
  if (j.energie < CONFLUENCE.prixFondation) return non(t`Il faut ${CONFLUENCE.prixFondation} cristaux pour fonder une Confluence.`);
  j.energie -= CONFLUENCE.prixFondation;
  return { ok: true };
}
export function rembourserFondation(j: Jeu) { j.energie += CONFLUENCE.prixFondation; }

/** Rejoindre ou fonder : la partie retient sa Confluence ; la quitter efface la demande en cours (ses copies reçues restent) */
export function entrerConfluence(j: Jeu, id: string, nom: string, now: number) {
  const c = etatConfluence(j, now);
  if (c.id !== id) { c.publie = 0; delete c.demande; }
  c.id = id; c.nom = nom;
}
export function quitterConfluence(j: Jeu, now: number) {
  const c = etatConfluence(j, now);
  delete c.id; delete c.nom; delete c.demande; c.publie = 0;
}

// ---------- Le Courant de la semaine (l'apport à la Crue commune) ----------

/** Ce que ce directeur apporte cette semaine : ses dons, ses Joutes, ses frappes sur le Gardien de la ville, ses Strates */
export function apportSemaine(j: Jeu, now: number): { total: number; dons: number; joutes: number; gardien: number; strates: number } {
  const sem = semaineDe(now);
  const c = etatConfluence(j, now);
  const A = CONFLUENCE.apport;
  const cercle = etatCercle(j);
  const joutes = cercle.semaine === sem ? cercle.battus.length : 0;
  const parts = j.gardienVille && j.gardienVille.semaine === sem ? etatGardien(j, now).parts + etatGardien(j, now).aEnvoyer.reduce((n, f) => n + f.parts, 0) : 0;
  const p = j.palmares;
  const demi = p && p.semaine === sem ? Math.max(0, p.profondeur - p.profondeurDebut) : 0;
  const r = { dons: c.dons * A.don, joutes: joutes * A.joute, gardien: Math.round(parts * A.partGardien), strates: demi * A.demiStrate };
  return { ...r, total: r.dons + r.joutes + r.gardien + r.strates };
}

/** Les trois paliers de la Crue pour une Confluence de `membres` directeurs */
export const paliersCrue = (membres: number) => CONFLUENCE.paliersParMembre.map((p) => p * Math.max(CONFLUENCE.membresComptesMin, membres));

/** Les paliers atteints par la Confluence et pas encore reçus par ce directeur (il doit avoir apporté quelque chose) */
export function paliersARecevoir(j: Jeu, courant: number, membres: number, now: number): number[] {
  const c = etatConfluence(j, now);
  if (!c.id || apportSemaine(j, now).total <= 0) return [];
  return paliersCrue(membres).map((seuil, i) => (courant >= seuil && !c.crue.includes(i) ? i : -1)).filter((i) => i >= 0);
}

/** Recevoir un palier de la Crue */
export function recevoirPalier(j: Jeu, i: number, courant: number, membres: number, now: number): Resultat & { cristaux?: number; eclats?: number; carte?: boolean } {
  if (!paliersARecevoir(j, courant, membres, now).includes(i)) return non(t('Ce palier n’est pas encore atteint.'));
  const r = CONFLUENCE.recompenses[i]!;
  etatConfluence(j, now).crue.push(i);
  if (r.cristaux) j.energie += r.cristaux;
  if (r.eclats) j.eclats += r.eclats;
  if (r.carte) j.choix.push({ source: 'confluence', options: tirerChoix(j, Math.max(1, strateVaincue(j)), 'cuivre') });
  return { ok: true, ...r };
}

// ---------- Les dons de copies ----------

/** Le nombre de copies qu'on peut demander pour cette carte, ou la raison du refus */
export function raisonDemande(j: Jeu, carte: string, now: number): string | null {
  const c = etatConfluence(j, now);
  if (!c.id) return t('Rejoins d’abord une Confluence.');
  let m;
  try { m = moduleDef(carte); } catch { return t('Carte inconnue.'); }
  const r = raisonNonEchangeable(j, carte);
  if (r) return r;
  if (!CONFLUENCE.copiesDemandees[m.rarete]) return t('L’or ne se demande pas : il s’échange entre amis.');
  if (m.rarete === 'argent' && (j.batiments.cercle ?? 0) < CONFLUENCE.argentAuNiveau) return t`L’argent se demande à partir du niveau ${CONFLUENCE.argentAuNiveau} du Cercle.`;
  if (!j.collection[carte] && !etatCercle(j).souhaits.includes(carte)) return t('Demande une carte que tu possèdes déjà, ou une de tes souhaits.');
  const d = c.demande;
  if (d && now - d.le < CONFLUENCE.demandeHeures * 3_600_000) return t`Ta prochaine demande sera possible dans ${Math.ceil((d.le + CONFLUENCE.demandeHeures * 3_600_000 - now) / 3_600_000)} h.`;
  return null;
}

/** Quand la prochaine demande sera possible (0 : tout de suite) */
export function prochaineDemande(j: Jeu, now: number): number {
  const d = etatConfluence(j, now).demande;
  return d ? Math.max(0, d.le + CONFLUENCE.demandeHeures * 3_600_000 - now) : 0;
}

/** Faire une demande : la partie la retient ; l'écriture en ligne suit (une demande remplace la précédente) */
export function demanderCopies(j: Jeu, carte: string, now: number): Resultat & { demande?: DemandeEnCours } {
  const r = raisonDemande(j, carte, now);
  if (r) return non(r);
  const voulu = CONFLUENCE.copiesDemandees[moduleDef(carte).rarete];
  const d: DemandeEnCours = { le: now, carte, voulu, appliques: 0 };
  etatConfluence(j, now).demande = d;
  return { ok: true, demande: d };
}

/** Les copies reçues en ligne (`recu`) pas encore ajoutées à la collection : on les ajoute, une seule fois chacune */
export function recevoirDons(j: Jeu, le: number, recu: number, now: number): { carte: string; n: number } | null {
  const d = etatConfluence(j, now).demande;
  if (!d || d.le !== le) return null;
  const n = Math.max(0, Math.min(d.voulu, recu) - d.appliques);
  if (!n) return null;
  for (let i = 0; i < n; i++) ajouterCarte(j, d.carte);
  d.appliques += n;
  return { carte: d.carte, n };
}

/** Pourquoi on ne peut pas donner cette carte (null : on peut) */
export function raisonDon(j: Jeu, carte: string): string | null {
  const r = raisonNonEchangeable(j, carte);
  if (r) return r;
  if ((j.collection[carte]?.doublons ?? 0) < 1) return t('Il te faut un exemplaire en double de cette carte.');
  return null;
}

/** Donner une copie : le doublon part, le donneur est récompensé (au plus `donsJour` dons récompensés par jour) */
export function donnerCopie(j: Jeu, carte: string, now: number): Resultat & { cristaux?: number } {
  const r = raisonDon(j, carte);
  if (r) return non(r);
  const c = etatConfluence(j, now);
  j.collection[carte]!.doublons = Math.round((j.collection[carte]!.doublons - 1) * 1000) / 1000;
  c.dons++;
  let cristaux = 0;
  if (c.donsDuJour < CONFLUENCE.donsJour) { cristaux = CONFLUENCE.recompenseDon[moduleDef(carte).rarete]; j.energie += cristaux; }
  c.donsDuJour++;
  return { ok: true, cristaux };
}

/** Un don qui n'a pas pu être enregistré en ligne : la copie revient, la récompense repart */
export function annulerDon(j: Jeu, carte: string, cristaux: number, now: number) {
  const c = etatConfluence(j, now);
  if (j.collection[carte]) j.collection[carte]!.doublons = Math.round((j.collection[carte]!.doublons + 1) * 1000) / 1000;
  c.dons = Math.max(0, c.dons - 1);
  c.donsDuJour = Math.max(0, c.donsDuJour - 1);
  j.energie = Math.max(0, j.energie - cristaux);
}

/** Taire ou réentendre un directeur sur le quai (seulement chez soi) */
export function basculerMuet(j: Jeu, uid: string, now: number): boolean {
  const c = etatConfluence(j, now);
  const l = (c.muets ??= []);
  if (l.includes(uid)) { c.muets = l.filter((x) => x !== uid); return false; }
  l.push(uid);
  return true;
}
