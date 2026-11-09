// Les contrats de marée (31 octobre 2026, Bryan : « des rangs de mission où il faut envoyer plusieurs agents, avec un taux
// de réussite, et plus c'est haut, meilleures sont les récompenses »). Réglé avec un game designer :
// - trois rangs nommés d'après les marées (8 novembre 2026 : coefficients dans l'échelle réelle des Basses, 25 à 115,
//   « grande marée » à partir de 100 comme dans digue.ts ; on parle de « tâches », pas d'« épreuves », pour ne pas confondre)
// - (avant :) trois rangs nommés d'après les marées (pas d'après les métaux : un « contrat d'or » qui rapporte de l'argent tromperait) ;
// - un contrat part sur la gabare du passeur, à côté des barques : il ne prend aucune barque aux missions ordinaires ;
// - chaque contrat a deux ou trois épreuves, une par Porteur, liées aux rôles des lignées (frapper, tenir, orchestrer) ;
// - le taux de réussite est affiché avant le départ (15 à 95 %) : ce sont les choix d'équipe qui le font monter ;
// - un échec n'est pas une perte sèche : XP entière, 30 % des composants et un Indice (+15 points la fois suivante) ;
// - jamais de creuseurs, d'habitants ni d'Éclats : on n'avance pas dans l'histoire par la mer, et l'argent reste rare.
// Apport mesuré au robot (tous les contrats réussis) : ≈ +29 % de cartes argent et +18 % d'or pour un occasionnel.

import { moduleDef, porteurDef, tirablesEn, carteId } from '../donnees';
import { COLLECTION, ajouterCarte, tirerChoix } from '../collection';
import { tireur } from '../rng';
import { LIEUX, affinite, lieuDef, type Affinite, type LieuDef } from '../lieux';
import type { Lignee, Rarete } from '../types';
import { XP, facteurXp, enExpedition, gagnerXp, jourDe, debutJour, log, niveauPorteur, non, porteursPresents, progresMarque, strateVaincue, tropBlesse, usureMax, type Jeu, type RapportMission, type Resultat } from './etat';
import { MISSIONS, rangerRapport } from './descentes';

export type RangMaree = 'montante' | 'vive' | 'grande';
export const RANGS_MAREE: readonly RangMaree[] = ['montante', 'vive', 'grande'];

/** Les chiffres de chaque rang (tous les réglages des contrats sont ici) */
export const MAREES = {
  montante: { nom: 'Petite vive-eau', coef: 80, strate: 3, porteurs: 2, difficulte: 6, heures: 4, usure: 5, composants: 90 },
  vive: { nom: 'Vive-eau', coef: 95, strate: 6, porteurs: 3, difficulte: 11, heures: 8, usure: 8, composants: 158 },
  grande: { nom: 'Grande marée', coef: 110, strate: 9, porteurs: 3, difficulte: 16, heures: 16, usure: 12, composants: 270 },
} as const satisfies Record<RangMaree, { nom: string; coef: number; strate: number; porteurs: number; difficulte: number; heures: number; usure: number; composants: number }>;

export const CONTRAT = {
  /** la force d'un Porteur sur son épreuve selon sa lignée */
  affinite: { bon: 1, neutre: 0.6, mauvais: 0.35 } as Record<Affinite, number>,
  /** chaque niveau au-dessus (ou en dessous) de la difficulté du rang */
  parNiveau: 0.05,
  niveauMin: 0.5,
  niveauMax: 1.25,
  /** taux = base + pente × moyenne des épreuves, borné */
  base: 10,
  pente: 75,
  min: 15,
  max: 95,
  /** un échec laisse un Indice : +15 points sur ce contrat, deux au plus */
  indice: 15,
  indicesMax: 2,
  /** en cas d'échec : part des composants, Usure ×1,5 */
  partEchec: 0.3,
  usureEchec: 1.5,
  /** grande marée : la première carte du choix est en argent au moins, rarement en nacre (Strate −10 et plus) ;
   *  l'or ne tombe plus par surprise, il vient de la « Prise d'or » annoncée une semaine sur cinq (2 novembre 2026) */
  chanceNacre: 0.03,
  /** cargaison : les composants du rang multipliés, sans carte */
  cargaison: 2,
  strateNacre: 10,
} as const;

/**
 * La prise d'un contrat (2 novembre 2026, Luc : « ça ne varie pas, la première c'est toujours du cuivre, la deuxième de
 * l'argent »). Revu par un game designer : le métal reste lié au rang (l'échelle reste lisible), c'est la forme de la prise
 * qui tourne, annoncée avant le départ et la même pour tous (aucune surprise, aucun hasard caché) :
 * - lignee : une carte du métal du rang, de la lignée du lieu (comme avant) ;
 * - choix : une carte du métal du rang à choisir parmi trois, une par lignée ;
 * - cargaison : composants ×2, pas de carte (marée montante seulement) ;
 * - or : grande marée, trois cartes au choix dont la première en or (remplace les 20 % d'or au hasard : même moyenne).
 */
export type Prise = 'lignee' | 'choix' | 'cargaison' | 'or';
export const PRISES: Record<RangMaree, readonly Prise[]> = {
  /** un motif de 7 jours : le même jour de la semaine garde la même prise */
  montante: ['lignee', 'lignee', 'choix', 'lignee', 'lignee', 'cargaison', 'lignee'],
  vive: ['lignee', 'lignee', 'choix', 'lignee', 'choix'],
  grande: ['lignee', 'lignee', 'or', 'lignee', 'lignee'],
};

/** La prise d'un contrat selon son rang et son numéro de cycle */
export function priseDe(rang: RangMaree, n: number): Prise {
  const m = PRISES[rang];
  return m[((n % m.length) + m.length) % m.length]!;
}

export interface EpreuveContrat { nom: string; lignee: Lignee }
export interface ContratDef { rang: RangMaree; lieu: string; titre: string; ambiance: string; epreuves: EpreuveContrat[] }

const E = (nom: string, lignee: Lignee): EpreuveContrat => ({ nom, lignee });

/**
 * Les contrats de chaque rang, dans l'ordre où le passeur les propose (les lignées alternent, aucune n'est avantagée).
 * Marée montante : deux épreuves de deux lignées différentes. Vive-eau : une par lignée. Grande marée : deux fois la lignée
 * du lieu, plus une autre.
 */
export const CONTRATS: readonly ContratDef[] = [
  { rang: 'montante', lieu: 'pompage', titre: 'La vanne maîtresse', ambiance: 'La mer n’est jamais descendue si bas : la vanne affleure.',
    epreuves: [E('Forcer la vanne maîtresse', 'tech'), E('Tenir l’amarre dans le reflux', 'bio')] },
  { rang: 'montante', lieu: 'criee', titre: 'Les sirènes de brume', ambiance: 'Les sirènes chantent faux ; tant qu’elles chantent, la glace tient.',
    epreuves: [E('Tenir la chambre froide qui cède', 'bio'), E('Accorder les sirènes de brume', 'reso')] },
  { rang: 'montante', lieu: 'clocher', titre: 'La verrière scellée', ambiance: 'Une note juste, et le verre s’ouvre de lui-même.',
    epreuves: [E('Accorder la cloche', 'reso'), E('Briser la verrière scellée', 'tech')] },
  { rang: 'montante', lieu: 'dessalement', titre: 'Les jauges effacées', ambiance: 'Le sel a mangé les chiffres ; les pompes, elles, se souviennent.',
    epreuves: [E('Relancer la pompe à sel', 'tech'), E('Lire les jauges effacées', 'reso')] },
  { rang: 'montante', lieu: 'marche', titre: 'L’auvent des lanternes', ambiance: 'Les familles du marché gardent leurs lanternes allumées pour la barque.',
    epreuves: [E('Tenir l’auvent qui s’affaisse', 'bio'), E('Hisser la caisse des lanternes', 'tech')] },
  { rang: 'montante', lieu: 'phare', titre: 'Le pouls de la lampe', ambiance: 'La lampe bat plus vite quand on approche. Personne ne sait pourquoi.',
    epreuves: [E('Suivre le pouls de la lampe', 'reso'), E('Tenir la barque dans le ressac', 'bio')] },

  { rang: 'vive', lieu: 'gare', titre: 'Le dernier train des Hauts', ambiance: 'Le dernier train des Hauts n’a jamais été vidé.',
    epreuves: [E('Forcer l’aiguillage rouillé', 'tech'), E('Tenir le wagon qui penche', 'bio'), E('Lire l’horaire des lumières', 'reso')] },
  { rang: 'vive', lieu: 'silos', titre: 'Les semences d’avant', ambiance: 'Sous le grain germé dorment les semences d’avant.',
    epreuves: [E('Tenir la brèche le temps d’un passage', 'bio'), E('Ouvrir la trappe du silo', 'tech'), E('Guider la barque dans les remous', 'reso')] },
  { rang: 'vive', lieu: 'pilier-effondre', titre: 'L’écho de Sombreverse', ambiance: 'Le pilier tombé répète encore les voix de ceux qui y vivaient.',
    epreuves: [E('Démêler les échos du pilier', 'reso'), E('Dégager l’escalier effondré', 'tech'), E('Tenir la voûte le temps de passer', 'bio')] },
  { rang: 'vive', lieu: 'transbordeur', titre: 'La soute du Héron', ambiance: 'Le Héron a gardé sa dernière cargaison, scellée sous la ligne d’eau.',
    epreuves: [E('Relancer le treuil de la soute', 'tech'), E('Retenir l’eau qui s’engouffre', 'bio'), E('Écouter la coque qui craque', 'reso')] },
  { rang: 'vive', lieu: 'marche', titre: 'La réserve des Salines', ambiance: 'Les anciens du marché disent qu’une réserve entière dort sous les étals.',
    epreuves: [E('Tenir les étals qui flottent', 'bio'), E('Forcer la grille de la réserve', 'tech'), E('Retrouver le passage dans le noir', 'reso')] },
  { rang: 'vive', lieu: 'phare', titre: 'La lentille du phare couché', ambiance: 'La lumière bat plus vite à l’approche.',
    epreuves: [E('Accorder la lampe qui pulse', 'reso'), E('Tenir la coque contre la houle', 'bio'), E('Démonter la lentille', 'tech')] },

  { rang: 'grande', lieu: 'pilier-sans-nom', titre: 'Le brouillard levé', ambiance: 'Une fois l’an, le brouillard se lève tout à fait.',
    epreuves: [E('Suivre la lumière qui s’éteint', 'reso'), E('Retrouver le chemin du retour', 'reso'), E('Tenir la barque dans le brouillard', 'bio')] },
  { rang: 'grande', lieu: 'serres', titre: 'Le coffre des jardiniers', ambiance: 'Les racines ont poussé autour de la pierre.',
    epreuves: [E('Écarter le figuier étrangleur', 'bio'), E('Respirer sous le dôme noyé', 'bio'), E('Forcer le coffre des jardiniers', 'tech')] },
  { rang: 'grande', lieu: 'gare', titre: 'La salle des machines des Hauts', ambiance: 'Sous la gare, une machine attend qu’on la réveille depuis la montée des eaux.',
    epreuves: [E('Relancer la turbine noyée', 'tech'), E('Forcer la porte du sas', 'tech'), E('Écouter le rythme des eaux', 'reso')] },
];

/** Les contrats d'un rang, dans leur ordre de rotation */
const contratsDuRang = (rang: RangMaree) => CONTRATS.filter((c) => c.rang === rang);

/**
 * Le cycle d'un rang au jour donné (déterministe, le même pour tous) : son numéro, et quand il s'ouvre et se ferme.
 * Marée montante : chaque jour. Vive-eau : deux par semaine (3 jours puis 4). Grande marée : une par semaine.
 */
export function cycleMaree(rang: RangMaree, now: number): { n: number; debut: number; fin: number } {
  const jour = jourDe(now);
  const sem = Math.floor(jour / 7);
  const jds = ((jour % 7) + 7) % 7;
  if (rang === 'montante') return { n: jour, debut: debutJour(jour), fin: debutJour(jour + 1) };
  if (rang === 'vive') {
    const second = jds >= 3;
    const d = sem * 7 + (second ? 3 : 0);
    return { n: sem * 2 + (second ? 1 : 0), debut: debutJour(d), fin: debutJour(second ? sem * 7 + 7 : d + 3) };
  }
  const n = Math.floor((jour - 4) / 7);
  const d = n * 7 + 4;
  return { n, debut: debutJour(d), fin: debutJour(d + 7) };
}

export interface ContratOuvert { id: string; def: ContratDef; lieu: LieuDef; rang: RangMaree; prise: Prise; fin: number; reussi: boolean; indices: number; ouvert: boolean }

/** L'état des contrats dans la sauvegarde (répare une sauvegarde d'avant le 31 octobre 2026) */
export function mareesDe(j: Jeu): NonNullable<Jeu['marees']> {
  return (j.marees ??= { contrat: null, reussis: [], indices: {} });
}

/** Le rang est-il ouvert ? (la dernière Strate vaincue) */
export const rangOuvert = (j: Jeu, rang: RangMaree) => strateVaincue(j) >= MAREES[rang].strate;

/** Le contrat du moment pour chaque rang (même verrouillé : l'écran montre ce qui attend plus bas) */
export function contratsDuMoment(j: Jeu, now: number): ContratOuvert[] {
  const m = mareesDe(j);
  return RANGS_MAREE.map((rang) => {
    const c = cycleMaree(rang, now);
    const liste = contratsDuRang(rang);
    const def = liste[((c.n % liste.length) + liste.length) % liste.length]!;
    const id = `${rang}-${c.n}`;
    return { id, def, lieu: lieuDef(def.lieu)!, rang, prise: priseDe(rang, c.n), fin: c.fin, reussi: m.reussis.includes(id), indices: m.indices[id] ?? 0, ouvert: rangOuvert(j, rang) };
  });
}

/** La force d'un Porteur sur une épreuve (0,175 à 1,25) */
export function forceSurEpreuve(j: Jeu, rang: RangMaree, ep: EpreuveContrat, porteur: string): { s: number; affinite: Affinite; niveau: number } {
  const a = affinite(ep.lignee, porteurDef(porteur).lignee);
  const niveau = niveauPorteur(j, porteur).niveau;
  const n = Math.min(CONTRAT.niveauMax, Math.max(CONTRAT.niveauMin, 1 + CONTRAT.parNiveau * (niveau - MAREES[rang].difficulte)));
  return { s: CONTRAT.affinite[a] * n, affinite: a, niveau };
}

/** Le taux de réussite d'une équipe (un Porteur par épreuve, dans l'ordre ; une place vide compte pour zéro) */
export function tauxContrat(j: Jeu, def: ContratDef, equipe: (string | null)[], indices = 0): number {
  const s = def.epreuves.map((ep, k) => (equipe[k] ? forceSurEpreuve(j, def.rang, ep, equipe[k]!).s : 0));
  const moyenne = s.reduce((a, b) => a + b, 0) / def.epreuves.length;
  return Math.min(CONTRAT.max, Math.max(CONTRAT.min, Math.round(CONTRAT.base + CONTRAT.pente * moyenne) + CONTRAT.indice * Math.min(CONTRAT.indicesMax, indices)));
}

/** Pourquoi un Porteur ne peut pas monter sur la gabare (null = il peut) */
export function raisonHorsContrat(j: Jeu, id: string): string | null {
  if (!porteursPresents(j).includes(id)) return 'Pas encore arrivé.';
  if (j.porteurs[id]!.poste) return j.porteurs[id]!.poste === 'noyau' ? 'S’entraîne à la Tour.' : 'Travaille au district.';
  if (enExpedition(j, id)) return 'Pas au district.';
  if (tropBlesse(j, id)) return 'Se remet à la Clinique.';
  return null;
}

/** Les Porteurs qui peuvent partir en contrat */
export const libresPourContrat = (j: Jeu) => porteursPresents(j).filter((id) => !raisonHorsContrat(j, id));

/** La meilleure équipe parmi des Porteurs (par défaut : tous ceux qui sont libres) */
export function equipeConseillee(j: Jeu, def: ContratDef, parmi = libresPourContrat(j)): (string | null)[] {
  const n = def.epreuves.length;
  let best: (string | null)[] = Array(n).fill(null);
  let bestS = -1;
  const force = (k: number, id: string) => forceSurEpreuve(j, def.rang, def.epreuves[k]!, id).s;
  const essayer = (k: number, pris: (string | null)[], total: number) => {
    if (k === n) { if (total > bestS) { bestS = total; best = pris.slice(); } return; }
    let rien = true;
    for (const id of parmi) if (!pris.includes(id)) { rien = false; pris.push(id); essayer(k + 1, pris, total + force(k, id)); pris.pop(); }
    if (rien) { pris.push(null); essayer(k + 1, pris, total); pris.pop(); }
  };
  essayer(0, [], 0);
  return best;
}

/** Envoie une équipe sur un contrat du moment (un Porteur par épreuve, dans l'ordre des épreuves) */
export function envoyerContrat(j: Jeu, id: string, equipe: string[], now: number): Resultat {
  const m = mareesDe(j);
  const c = contratsDuMoment(j, now).find((x) => x.id === id);
  if (!c) return non('Ce contrat n’est plus proposé : la marée a tourné.');
  if (!c.ouvert) return non(`Il faut avoir vaincu la Strate −${MAREES[c.rang].strate} pour ce contrat.`);
  if (c.reussi) return non('Ce contrat est déjà rempli.');
  if (m.contrat) return non('La gabare du passeur est déjà en mer : un contrat à la fois.');
  const r = MAREES[c.rang];
  if (equipe.length !== c.def.epreuves.length || new Set(equipe).size !== equipe.length) return non(`Il faut ${c.def.epreuves.length} Porteurs différents, un par épreuve.`);
  for (const p of equipe) { const pourquoi = raisonHorsContrat(j, p); if (pourquoi) return non(`${porteurDef(p)?.nom ?? 'Ce Porteur'} : ${pourquoi.toLowerCase()}`); }
  const taux = tauxContrat(j, c.def, equipe, c.indices);
  m.contrat = { id, rang: c.rang, porteurs: [...equipe], debut: now, fin: now + r.heures * 3_600_000, taux, strate: strateVaincue(j) };
  log(j, `${equipe.map((p) => porteurDef(p).nom).join(', ')} embarquent sur la gabare : ${r.nom}, ${c.def.titre} (${taux} % de chances).`);
  return { ok: true };
}

/** Une carte d'un métal fixe dans la lignée (marée montante : cuivre, vive-eau : argent) : une qu'on a déjà, ou une nouvelle.
 * Pas de tirage de rareté : un contrat ne fait jamais tomber d'or par surprise (réglé au robot, 31 octobre 2026). */
function carteFixe(j: Jeu, metal: Rarete, lignee: Lignee): string {
  const t = tireur(j);
  const possedees = Object.keys(j.collection).filter((id) => id.endsWith('@' + metal) && !moduleDef(id).legs && moduleDef(id).lignee === lignee);
  if (possedees.length && t.nombre() < COLLECTION.affinite) return possedees[t.entier(possedees.length)]!;
  const pool = tirablesEn(metal).filter((m) => m.lignee === lignee);
  return carteId(pool[t.entier(pool.length)]!.id, metal);
}

/** Le rang minimum de la première carte d'une grande marée (la Prise d'or garantit l'or) */
function minimumGrande(j: Jeu, strate: number, lignee: Lignee, prise: Prise): Rarete {
  if (prise === 'or') return 'or';
  const x = tireur(j).nombre();
  if (strate >= CONTRAT.strateNacre && x < CONTRAT.chanceNacre && tirablesEn('nacre').some((m) => m.lignee === lignee)) return 'nacre';
  return 'argent';
}

/** Les lignées, pour la prise « au choix » : une carte de chaque */
const LIGNEES: readonly Lignee[] = ['tech', 'bio', 'reso'];

/** Le retour de la gabare (appelé par tick) : réussite ou échec, gains, rapport */
export function retourDeContrat(j: Jeu): string {
  const m = mareesDe(j);
  const c = m.contrat!;
  m.contrat = null;
  const r = MAREES[c.rang];
  const n = Number(c.id.split('-')[1]);
  const liste = contratsDuRang(c.rang);
  const def = liste[((n % liste.length) + liste.length) % liste.length]!;
  const lieu = lieuDef(def.lieu)!;
  const t = tireur(j);
  const reussi = t.nombre() * 100 < c.taux;
  const prise = priseDe(c.rang, n);
  const sf = 1 + 0.25 * (Math.max(1, c.strate) - 1);
  const composants = Math.round(r.composants * sf * (prise === 'cargaison' ? CONTRAT.cargaison : 1) * (reussi ? 1 : CONTRAT.partEchec));
  j.composants += composants;
  const cartes: { id: string; nouvelle: boolean }[] = [];
  let choix = false;
  if (reussi) {
    m.reussis = [...m.reussis.filter((x) => x !== c.id), c.id].slice(-12);
    delete m.indices[c.id];
    const metal: Rarete = c.rang === 'montante' ? 'cuivre' : 'argent';
    if (c.rang === 'grande') { j.choix.push({ source: 'maree', options: tirerChoix(j, c.strate, minimumGrande(j, c.strate, lieu.lignee, prise), lieu.lignee) }); choix = true; }
    else if (prise === 'choix') { j.choix.push({ source: 'maree', options: LIGNEES.map((l) => carteFixe(j, metal, l)) }); choix = true; }
    else if (prise === 'lignee') { const id = carteFixe(j, metal, lieu.lignee); cartes.push({ id, nouvelle: ajouterCarte(j, id) }); }
  } else {
    m.indices[c.id] = Math.min(CONTRAT.indicesMax, (m.indices[c.id] ?? 0) + 1);
    // on ne garde les Indices que des contrats encore récents
    const garder = Object.keys(m.indices).slice(-6);
    m.indices = Object.fromEntries(garder.map((k) => [k, m.indices[k]!]));
  }
  // l'épreuve qui a cédé : celle où l'équipe était la plus faible
  const forces = def.epreuves.map((ep, k) => ({ ep, k, f: forceSurEpreuve(j, c.rang, ep, c.porteurs[k]!) }));
  const faible = forces.reduce((a, b) => (b.f.s < a.f.s ? b : a));
  let xpTotal = 0;
  let niveau: number | null = null;
  let usureTotale = 0;
  let marque: string | null = null;
  for (const { k, f } of forces) {
    const id = c.porteurs[k]!;
    const q = j.porteurs[id];
    if (!q) continue;
    const mult = (1 + MISSIONS.parNiveau * (f.niveau - 1)) * MISSIONS.affinite[f.affinite];
    const xp = Math.round(XP.missionHeure * r.heures * facteurXp(c.strate) * mult);
    xpTotal += xp;
    const monte = gagnerXp(j, id, xp);
    if (monte && k === 0) niveau = monte;
    const avant = q.usure;
    q.usure = Math.min(usureMax(j, id), q.usure + (r.usure + (f.affinite === 'mauvais' ? MISSIONS.usureMauvais : 0)) * (reussi ? 1 : CONTRAT.usureEchec));
    usureTotale += q.usure - avant;
    const avantMarque = progresMarque(j, id)?.acquise;
    q.faits = { ...q.faits, missions: (q.faits?.missions ?? 0) + 1 };
    const mq = progresMarque(j, id);
    if (mq?.acquise && !avantMarque) { log(j, `${porteurDef(id).nom} gagne la Marque ${mq.nom} : ${mq.texte}`); marque ??= mq.nom; }
  }
  const noms = c.porteurs.map((p) => porteurDef(p).nom);
  const equipe = noms.length > 1 ? `${noms.slice(0, -1).join(', ')} et ${noms[noms.length - 1]}` : noms[0]!;
  const recit: string[] = [lieu.arrivee.replaceAll('{nom}', equipe), def.ambiance];
  if (reussi) {
    recit.push(`${forces.map(({ ep, k }) => `${porteurDef(c.porteurs[k]!).nom} : ${ep.nom.charAt(0).toLowerCase()}${ep.nom.slice(1)}`).join(' ; ')}. Tout a tenu.`);
    recit.push(choix ? 'Au cœur de la ruine, trois pierres attendaient côte à côte : à toi de choisir celle qui rentre au district.'
      : prise === 'cargaison' ? `La gabare est rentrée à ras bord : ${composants} minerai arraché à la ruine.`
      : `La gabare est rentrée chargée : ${composants} minerai, et une pierre de plus pour tes cartes.`);
  } else {
    recit.push(`${porteurDef(c.porteurs[faible.k]!).nom} n’a pas pu ${faible.ep.nom.charAt(0).toLowerCase()}${faible.ep.nom.slice(1)} : l’équipe a dû faire demi-tour avant la marée descendante.`);
    recit.push(`Ils rapportent ${composants} minerai, et surtout un Indice : la prochaine tentative sur ce contrat aura +${CONTRAT.indice} % de chances.`);
  }
  const rapport: RapportMission = {
    porteur: c.porteurs[0]!, strate: c.strate, duree: 'longue', fin: c.fin, lieu: lieu.id, recit, composants, xp: xpTotal, niveau, cartes, creuseurs: 0,
    usure: Math.round(usureTotale * 10) / 10, marque, lu: false,
    contrat: { rang: c.rang, titre: def.titre, reussi, porteurs: [...c.porteurs], taux: c.taux, choix, cedee: reussi ? undefined : faible.ep.nom },
  };
  rangerRapport(j, rapport);
  const texte = reussi
    ? `${r.nom} réussie (${def.titre}) : +${composants} minerai${cartes.length ? `, ${cartes.map((x) => moduleDef(x.id).nom).join(', ')}` : ''}${choix ? ', une carte au choix' : ''}.`
    : `${r.nom} manquée (${def.titre}) : +${composants} minerai et un Indice pour la prochaine tentative.`;
  log(j, texte);
  return texte;
}

/** Un Porteur est-il sur la gabare ? */
export const enContrat = (j: Pick<Jeu, 'marees'>, id: string) => !!j.marees?.contrat?.porteurs.includes(id);

/** Les lieux possibles (pour les tests : chaque contrat va vers un lieu existant) */
export const LIEUX_CONTRATS = () => CONTRATS.map((c) => LIEUX.find((l) => l.id === c.lieu));
