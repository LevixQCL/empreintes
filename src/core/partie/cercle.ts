// Couche « cercle » — le Cercle des quais (3 novembre 2026, plan validé par Bryan) : le bâtiment social, à la place du Labo génétique.
// Les directeurs des autres districts y accostent : on s'y fait des amis, on montre sa vitrine, on se défie en duel et on échange
// ses cartes en double. Ce fichier ne garde que ce qui touche la partie (cartes, composants, compteurs du jour et de la semaine) ;
// les amis, les vitrines et les propositions vivent en ligne (src/net/cercle.ts).
//
// Les règles d'un échange (inspirées de ce qui marche ailleurs, et de ce qui a été reproché à Pokémon TCG Pocket) :
// - seulement entre amis, et seulement si l'amitié a quelques jours (contre les comptes créés pour se donner des cartes) ;
// - une carte contre une carte, du même métal ; on ne donne jamais sa carte, seulement un exemplaire en double ;
// - fer et cuivre gratuits, argent et or contre des composants (pas de monnaie à part) ; la nacre et l'Héritage ne s'échangent pas ;
// - la carte proposée est mise de côté (son doublon et le prix sont retenus) jusqu'à la réponse : rien ne se perd si l'ami refuse.

import { COLLECTION, NOMS_RARETE, RARETES, ajouterCarte } from '../collection';
import { moduleDef, porteurDef } from '../donnees';
import type { EscouadeDuel } from '../duel';
import type { Rarete } from '../types';
import { CERCLE, CERCLE_OUVERTURE, jourDe, non, semaineDe, strateVaincue, type Jeu, type Resultat } from './etat';

/** Une proposition envoyée, en attente de la réponse de l'ami : sa carte et son prix sont retenus jusque-là */
export interface EchangeEnAttente {
  /** l'identifiant de la proposition en ligne */
  id: string;
  ami: string;
  nomAmi: string;
  /** l'exemplaire qu'on donne (déjà retiré de ses doublons) */
  donne: string;
  /** la carte qu'on recevra */
  recoit: string;
  /** les composants retenus */
  cout: number;
  le: number;
}

export interface EtatCercle {
  /** les cartes qu'on cherche (montrées à ses amis) */
  souhaits: string[];
  /** les cartes exposées dans sa vitrine */
  vitrine: string[];
  /** le Porteur fétiche montré dans la vitrine (absent : le premier de l'escouade) */
  fetiche?: string;
  /** les échanges du jour */
  jour: number;
  echanges: number;
  /** les propositions envoyées sans réponse */
  enAttente: EchangeEnAttente[];
  /** les propositions déjà conclues (reçues ou envoyées) : jamais appliquées deux fois */
  conclus: string[];
  /** la semaine des duels : les amis déjà battus (un seul gain par ami et par semaine) */
  semaine: number;
  battus: string[];
  /** victoires et défaites en duel, depuis le début */
  victoires: number;
  defaites: number;
  /** les Joutes du Grand Tableau : victoires récompensées (amis différents, trois par semaine au plus) */
  joutes?: number;
  /** la présentation du Cercle a été lue */
  vu?: boolean;
}

export const etatCercle = (j: Jeu): EtatCercle =>
  (j.cercle ??= { souhaits: [], vitrine: [], jour: 0, echanges: 0, enAttente: [], conclus: [], semaine: 0, battus: [], victoires: 0, defaites: 0 });

/** Le Cercle peut être construit : la Strate −2 est vaincue */
export const cercleOuvert = (j: Jeu) => strateVaincue(j) >= CERCLE_OUVERTURE;
/** Le Cercle est construit (niveau 1 ou plus) */
export const cercleConstruit = (j: Jeu) => (j.batiments.cercle ?? 0) >= 1;

const niv = (j: Jeu) => Math.min(10, j.batiments.cercle ?? 0);
export const echangesParJour = (j: Jeu) => CERCLE.echangesJour[niv(j)] ?? 0;
export const ouvertesMax = (j: Jeu) => CERCLE.ouvertes[niv(j)] ?? 0;
export const vitrineMax = (j: Jeu) => CERCLE.vitrine[niv(j)] ?? 0;

/** Le métal le plus rare qu'on peut échanger à ce niveau du Cercle */
export const metalMax = (j: Jeu): Rarete => (niv(j) >= CERCLE.orAuNiveau ? 'or' : 'argent');

/** Les échanges encore possibles aujourd'hui (une proposition en attente en compte déjà un) */
export function echangesRestants(j: Jeu, now: number): number {
  const c = etatCercle(j);
  const faits = c.jour === jourDe(now) ? c.echanges : 0;
  return Math.max(0, echangesParJour(j) - faits);
}

function compter(j: Jeu, now: number, n: number) {
  const c = etatCercle(j);
  if (c.jour !== jourDe(now)) { c.jour = jourDe(now); c.echanges = 0; }
  c.echanges = Math.max(0, c.echanges + n);
}

/** Le métal d'un exemplaire (« ruee@argent » → argent) */
export const metalDe = (id: string): Rarete => moduleDef(id).rarete;

/** Le prix d'un échange pour ce métal (chacun paie le sien) */
export const coutEchange = (id: string) => CERCLE.cout[metalDe(id)];

/** Pourquoi une carte ne peut pas changer de mains (null : elle le peut). Vaut pour la carte donnée comme pour la reçue. */
export function raisonNonEchangeable(j: Jeu, id: string): string | null {
  let m;
  try { m = moduleDef(id); } catch { return 'Carte inconnue.'; }
  if (m.legs) return 'Les cartes de l’Héritage ne quittent jamais le district.';
  if (m.lien) return 'Une carte de parrainage ne s’échange pas : elle se reçoit avec un ami.';
  if (m.rarete === 'nacre') return 'La nacre ne s’échange pas.';
  if (RARETES.indexOf(m.rarete) > RARETES.indexOf(metalMax(j))) return `L’or s’échange à partir du niveau ${CERCLE.orAuNiveau} du Cercle.`;
  return null;
}

/** Les exemplaires en double qu'on peut proposer (ce que ses amis voient dans sa vitrine) */
export function doublesEchangeables(j: Jeu): string[] {
  return Object.entries(j.collection).filter(([id, c]) => c.doublons >= 1 && !raisonNonEchangeable(j, id)).map(([id]) => id);
}

/** Les souhaits qu'un ami peut combler avec ses doubles (sa vitrine en ligne liste ses doubles) */
export const souhaitsComblables = (j: Jeu, doublesAmi: readonly string[]) => etatCercle(j).souhaits.filter((s) => doublesAmi.includes(s));

/** Ajouter ou retirer une carte de ses souhaits */
export function basculerSouhait(j: Jeu, id: string): Resultat {
  const c = etatCercle(j);
  if (c.souhaits.includes(id)) { c.souhaits = c.souhaits.filter((x) => x !== id); return { ok: true, message: 'Retirée de tes souhaits.' }; }
  const r = raisonNonEchangeable(j, id);
  if (r && !r.startsWith('L’or')) return non(r);
  if (c.souhaits.length >= CERCLE.souhaitsMax) return non(`${CERCLE.souhaitsMax} souhaits au plus : retires-en un d’abord.`);
  c.souhaits.push(id);
  return { ok: true, message: 'Ajoutée à tes souhaits : tes amis la verront.' };
}

/** Mettre une carte en vitrine (ou l'en retirer) */
export function basculerVitrine(j: Jeu, id: string): Resultat {
  const c = etatCercle(j);
  if (c.vitrine.includes(id)) { c.vitrine = c.vitrine.filter((x) => x !== id); return { ok: true }; }
  if (!j.collection[id]) return non('Tu ne possèdes pas cette carte.');
  if (c.vitrine.length >= vitrineMax(j)) return non(vitrineMax(j) ? `Ta vitrine tient ${vitrineMax(j)} carte${vitrineMax(j) > 1 ? 's' : ''} : améliore le Cercle pour en montrer plus.` : 'Construis d’abord le Cercle.');
  c.vitrine.push(id);
  return { ok: true };
}

/** Ce qui manque pour échanger avec cet ami (null : rien) */
export function raisonSansEchange(j: Jeu, amitieDepuis: number, now: number): string | null {
  if (!cercleConstruit(j)) return 'Construis d’abord le Cercle des quais.';
  const jours = (now - amitieDepuis) / 86_400_000;
  if (jours < CERCLE.amitieJours) {
    const reste = Math.ceil(CERCLE.amitieJours - jours);
    return `Une amitié doit avoir ${CERCLE.amitieJours} jours avant le premier échange : encore ${reste} jour${reste > 1 ? 's' : ''}.`;
  }
  return null;
}

/** Vérifie une proposition, sans rien changer */
export function verifierProposition(j: Jeu, donne: string, recoit: string, amitieDepuis: number, now: number): Resultat {
  const sans = raisonSansEchange(j, amitieDepuis, now);
  if (sans) return non(sans);
  const r = raisonNonEchangeable(j, donne) ?? raisonNonEchangeable(j, recoit);
  if (r) return non(r);
  if (metalDe(donne) !== metalDe(recoit)) return non('Un échange se fait entre deux cartes du même métal.');
  if (donne === recoit) return non('C’est la même carte.');
  if ((j.collection[donne]?.doublons ?? 0) < 1) return non('Il te faut un exemplaire en double de cette carte : ta carte, elle, ne part jamais.');
  if (echangesRestants(j, now) < 1) return non('Plus d’échange possible aujourd’hui : le Cercle rouvre demain.');
  if (etatCercle(j).enAttente.length >= ouvertesMax(j)) return non(`Tu as déjà ${ouvertesMax(j)} proposition${ouvertesMax(j) > 1 ? 's' : ''} en attente.`);
  const cout = coutEchange(donne);
  if (j.energie < cout) return non(`Il faut ${cout} cristaux pour échanger une carte en ${NOMS_RARETE[metalDe(donne)].toLowerCase()}.`);
  return { ok: true };
}

/** Envoyer une proposition : l'exemplaire et le prix sont retenus jusqu'à la réponse */
export function proposerEchange(j: Jeu, p: { id: string; ami: string; nomAmi: string; donne: string; recoit: string }, amitieDepuis: number, now: number): Resultat {
  const v = verifierProposition(j, p.donne, p.recoit, amitieDepuis, now);
  if (!v.ok) return v;
  const cout = coutEchange(p.donne);
  j.collection[p.donne]!.doublons--;
  j.energie -= cout;
  compter(j, now, 1);
  etatCercle(j).enAttente.push({ ...p, cout, le: now });
  return { ok: true, message: `Proposition envoyée à ${p.nomAmi}.` };
}

/** Vérifie qu'on peut accepter une proposition reçue (on donne `donne`, on reçoit `recoit`) */
export function verifierAcceptation(j: Jeu, donne: string, recoit: string, amitieDepuis: number, now: number): Resultat {
  const sans = raisonSansEchange(j, amitieDepuis, now);
  if (sans) return non(sans);
  const r = raisonNonEchangeable(j, donne) ?? raisonNonEchangeable(j, recoit);
  if (r) return non(r);
  if (metalDe(donne) !== metalDe(recoit)) return non('Un échange se fait entre deux cartes du même métal.');
  if ((j.collection[donne]?.doublons ?? 0) < 1) return non('Tu n’as plus d’exemplaire en double de cette carte.');
  if (echangesRestants(j, now) < 1) return non('Plus d’échange possible aujourd’hui : le Cercle rouvre demain.');
  const cout = coutEchange(donne);
  if (j.energie < cout) return non(`Il faut ${cout} cristaux pour cet échange.`);
  return { ok: true };
}

/** Accepter une proposition reçue : on donne son double, on reçoit la carte de l'ami */
export function accepterEchange(j: Jeu, id: string, donne: string, recoit: string, amitieDepuis: number, now: number): Resultat & { nouvelle?: boolean } {
  const c = etatCercle(j);
  if (c.conclus.includes(id)) return non('Cet échange est déjà fait.');
  const v = verifierAcceptation(j, donne, recoit, amitieDepuis, now);
  if (!v.ok) return v;
  j.collection[donne]!.doublons--;
  j.energie -= coutEchange(donne);
  const nouvelle = ajouterCarte(j, recoit);
  compter(j, now, 1);
  noterConclu(c, id);
  return { ok: true, nouvelle, message: nouvelle ? 'Nouvelle carte !' : 'Un exemplaire de plus.' };
}

function noterConclu(c: EtatCercle, id: string) {
  c.conclus.push(id);
  if (c.conclus.length > 200) c.conclus.splice(0, c.conclus.length - 200);
}

/** L'ami a accepté : on reçoit sa carte (une seule fois) */
export function conclureEchange(j: Jeu, id: string): { recue: string; nouvelle: boolean; nomAmi: string } | null {
  const c = etatCercle(j);
  const e = c.enAttente.find((x) => x.id === id);
  if (!e || c.conclus.includes(id)) return null;
  c.enAttente = c.enAttente.filter((x) => x !== e);
  noterConclu(c, id);
  return { recue: e.recoit, nouvelle: ajouterCarte(j, e.recoit), nomAmi: e.nomAmi };
}

/** Refusée, annulée ou expirée : l'exemplaire et le prix reviennent, et l'échange du jour aussi */
export function rendreEchange(j: Jeu, id: string, now: number): EchangeEnAttente | null {
  const c = etatCercle(j);
  const e = c.enAttente.find((x) => x.id === id);
  if (!e) return null;
  c.enAttente = c.enAttente.filter((x) => x !== e);
  j.collection[e.donne] ??= { niveau: COLLECTION.niveauDepart[metalDe(e.donne)], doublons: 0 };
  j.collection[e.donne]!.doublons++;
  j.energie += e.cout;
  if (c.jour === jourDe(now) && jourDe(e.le) === c.jour) compter(j, now, -1);
  return e;
}

/** Les propositions restées sans réponse trop longtemps */
export const propositionsExpirees = (j: Jeu, now: number) => etatCercle(j).enAttente.filter((e) => now - e.le > CERCLE.propositionHeures * 3_600_000);

// ---------- Les duels ----------

/** Les victoires de la semaine qui rapportent encore */
export function duelsRecompensesRestants(j: Jeu, now: number): number {
  const c = etatCercle(j);
  return c.semaine === semaineDe(now) ? Math.max(0, CERCLE.duelsSemaine - c.battus.length) : CERCLE.duelsSemaine;
}

/**
 * La fin d'un duel contre un ami. Une victoire contre un ami pas encore battu cette semaine rapporte (3 amis différents au plus) :
 * jamais de butin par duel, sinon deux amis s'arrangeraient pour se faire gagner à tour de rôle.
 */
export function finirDuelAmi(j: Jeu, ami: string, victoire: boolean, now: number): { composants: number; eclats: number } | null {
  const c = etatCercle(j);
  if (victoire) c.victoires++; else c.defaites++;
  if (!victoire) return null;
  if (c.semaine !== semaineDe(now)) { c.semaine = semaineDe(now); c.battus = []; }
  if (c.battus.includes(ami) || c.battus.length >= CERCLE.duelsSemaine) return null;
  c.battus.push(ami);
  c.joutes = (c.joutes ?? 0) + 1;
  const { composants, eclats } = CERCLE.recompenseDuel;
  j.energie += composants; // récompense : déjà taillée (9 novembre 2026)
  j.eclats += eclats;
  return { composants, eclats };
}

/**
 * Le duel « à armes égales » : chaque carte revient au niveau de départ de son métal, chaque Porteur à ses PV de base.
 * Deux amis qui n'en sont pas au même point du jeu peuvent ainsi s'affronter sur la seule façon de jouer leurs cartes.
 */
export function aArmesEgales(e: EscouadeDuel): EscouadeDuel {
  return {
    nom: e.nom,
    porteurs: e.porteurs.map((p) => ({
      id: p.id,
      pv: porteurDef(p.id).pvMax,
      cartes: p.cartes.map((c) => ({ id: c.id, niveau: COLLECTION.niveauDepart[metalDe(c.id)] })),
    })),
  };
}
