// Le Cercle des quais côté application (3 novembre 2026) : les écoutes en ligne (amitiés, propositions, défis), la vitrine publiée,
// et ce que chaque réponse change dans la partie (src/core/partie/cercle.ts). Le réseau est dans src/net/cercle.ts.
// Tant que les règles Firestore du Cercle ne sont pas publiées, tout échoue sans casser le jeu : l'écran le dit et propose de réessayer.

import * as J from '../core/jeu';
import { clePseudo } from '../core/classements';
import { moduleDef } from '../core/donnees';
import { cercleVide } from '../ui/acces';
import type { AmiCercle, CercleEcran } from '../ui/cercle';
import type { Amitie, Defi, Profil, Proposition } from '../net/cercle';
import { app, D } from './etat';
import { afficher } from './rendu';
import { sauver } from './synchro';

/** L'état du Cercle, partagé avec l'écran (D.cercle) */
export const C: CercleEcran = cercleVide();
D.cercle = C;

let net: typeof import('../net/cercle') | null = null;
const reseau = async () => (net ??= await import('../net/cercle'));

let ecoute: { uid: string; arreter: () => void } | null = null;
let amities: Amitie[] = [];
const profils = new Map<string, Profil>();

// au district, ou devant l'attente d'un défi (pas pendant le duel lui-même : seul son chrono bouge)
const redessiner = () => { if (app.mode === 'district' || (app.mode === 'duel' && !document.querySelector('.duel'))) afficher(); };
const nomPublic = () => app.jeu.directeur?.nom ?? '';

/**
 * Le petit message quand une demande arrive pendant qu'on joue (3 novembre 2026, Bryan) : une demande d'ami, un défi ou une
 * proposition d'échange qu'on n'avait pas encore vus. Rien au premier chargement : ce qui attendait déjà se voit par la bulle.
 */
const vus = new Set<string>();
const charges = new Set<string>();
function annoncer(sorte: 'amis' | 'defis' | 'echanges', l: { id: string; texte: string }[]) {
  const nouveaux = l.filter((x) => !vus.has(x.id));
  for (const x of l) vus.add(x.id);
  if (!charges.has(sorte)) { charges.add(sorte); return; }
  if (!nouveaux.length) return;
  D.message = nouveaux.length > 1 ? `${nouveaux.length} nouvelles demandes t’attendent au Cercle des quais.` : nouveaux[0]!.texte;
}

function compter() {
  C.aRepondre = C.demandes.filter((d) => d.recue).length
    + C.recues.filter((p) => p.etat === 'propose').length
    + C.defisRecus.filter((d) => d.etat === 'envoye').length;
}

function erreur(e: unknown) {
  const code = (e as { code?: string })?.code;
  C.reseau = 'erreur';
  C.erreur = code === 'permission-denied' ? 'Le Cercle n’est pas encore ouvert en ligne (les règles du serveur attendent leur mise à jour).' : 'Le Cercle ne répond pas pour l’instant.';
  redessiner();
}

/**
 * Commence à écouter le Cercle (au lancement connecté, et à l'ouverture de l'écran). Une seule écoute par compte.
 * Rien ne s'écoute avant que le Cercle soit construit : pas de lectures inutiles pour les joueurs du début.
 */
export async function suivreCercle(force = false) {
  const uid = app.uid;
  if (!app.compte || !uid) { arreterCercle(); C.reseau = 'hors-ligne'; return; }
  if (!J.cercleConstruit(app.jeu)) return;
  if (ecoute?.uid === uid && !force) return;
  arreterCercle();
  C.reseau = 'chargement';
  C.erreur = undefined;
  try {
    const n = await reseau();
    if (app.uid !== uid) return;
    const a = n.ecouterAmities(uid, (l) => { amities = l; majAmis(uid); }, erreur);
    const b = n.ecouterEchanges(uid, (env, rec) => { majEchanges(uid, env, rec); }, erreur);
    const c = n.ecouterDefis(uid, (env, rec) => {
      C.defisEnvoyes = env; C.defisRecus = rec;
      annoncer('defis', rec.filter((d) => d.etat === 'envoye').map((d) => ({ id: d.id, texte: `${d.nomDe} te défie en duel${d.mode === 'egal' ? ' à armes égales' : ''} : rendez-vous au Cercle.` })));
      compter(); redessiner();
    }, erreur);
    ecoute = { uid, arreter: () => { a(); b(); c(); } };
    publierVitrine(2000);
    n.nettoyer(uid, Date.now() - 3 * 86_400_000).catch(() => {});
  } catch (e) { erreur(e); }
}

export function arreterCercle() {
  vus.clear(); charges.clear();
  ecoute?.arreter();
  ecoute = null;
}

async function majAmis(uid: string) {
  C.reseau = 'pret';
  const ok = amities.filter((a) => a.etat === 'ok');
  C.demandes = amities.filter((a) => a.etat === 'attente').map((a) => {
    const recue = a.a === uid;
    return { amitie: a.id, uid: recue ? a.de : a.a, nom: recue ? a.nomDe : a.nomA, le: a.le, recue };
  });
  const amis: AmiCercle[] = ok.map((a) => {
    const lui = a.de === uid ? a.a : a.de;
    return { amitie: a.id, uid: lui, nom: a.de === uid ? a.nomA : a.nomDe, depuis: a.depuis ?? a.le, ...(profils.get(lui) ? { profil: profils.get(lui)! } : {}) };
  });
  C.amis = amis;
  annoncer('amis', C.demandes.filter((d) => d.recue).map((d) => ({ id: d.amitie, texte: `${d.nom} veut devenir ton ami au Cercle des quais.` })));
  compter();
  redessiner();
  // les vitrines des amis : relues à chaque changement de la liste (une lecture par ami)
  const manquants = amis.map((a) => a.uid);
  if (!manquants.length) return;
  try {
    const l = await (await reseau()).lireProfils(manquants);
    for (const p of l) profils.set(p.uid, p);
    for (const a of C.amis) { const p = profils.get(a.uid); if (p) { a.profil = p; a.nom = p.nom || a.nom; } }
    redessiner();
  } catch { /* vitrines pas encore lisibles */ }
}

/** Les vitrines des amis, relues à l'ouverture de l'écran */
export async function relireVitrines() {
  if (!C.amis.length) return;
  try {
    const l = await (await reseau()).lireProfils(C.amis.map((a) => a.uid));
    for (const p of l) profils.set(p.uid, p);
    for (const a of C.amis) { const p = profils.get(a.uid); if (p) a.profil = p; }
    redessiner();
  } catch { /* hors ligne */ }
}

/**
 * Les propositions : les reçues s'affichent ; les envoyées qui ont reçu une réponse sont appliquées à la partie (une seule fois),
 * puis effacées. Celles restées sans réponse trop longtemps sont reprises.
 */
async function majEchanges(uid: string, envoyees: Proposition[], recues: Proposition[]) {
  C.recues = recues;
  C.envoyees = envoyees;
  annoncer('echanges', recues.filter((p) => p.etat === 'propose').map((p) => ({ id: p.id, texte: `${p.nomDe} te propose un échange de cartes au Cercle.` })));
  compter();
  const j = app.jeu;
  const n = await reseau();
  let change = false;
  for (const p of envoyees) {
    if (p.etat === 'propose') continue;
    const attend = J.etatCercle(j).enAttente.some((e) => e.id === p.id);
    if (attend && p.etat === 'accepte') {
      const r = J.conclureEchange(j, p.id);
      if (r) { change = true; D.message = `${r.nomAmi} a accepté : ${moduleDef(r.recue).nom} rejoint ta collection${r.nouvelle ? ' (nouvelle carte !)' : ''}.`; }
    } else if (attend) {
      const r = J.rendreEchange(j, p.id, Date.now());
      if (r) { change = true; D.message = p.etat === 'refuse' ? `${r.nomAmi} a refusé : ta carte et tes cristaux te reviennent.` : 'Ta proposition est reprise : ta carte te revient.'; }
    }
    if (p.de === uid && p.etat !== 'accepte') n.effacerProposition(p.id).catch(() => {});
  }
  // les propositions restées sans réponse
  for (const e of J.propositionsExpirees(j, Date.now())) {
    const fait = await n.repondre(e.id, 'annule').catch(() => false);
    if (fait && J.rendreEchange(j, e.id, Date.now())) change = true;
  }
  // une proposition gardée dans la partie mais disparue en ligne (effacée ailleurs) : on la rend, seulement pendant 7 jours :
  // un échange accepté ne peut pas être effacé avant (firestore.rules, 8 novembre 2026 après-midi), donc une proposition
  // disparue plus tôt n'a pas été acceptée ; plus tard, elle a pu l'être, et la rendre dupliquerait la carte
  for (const e of J.etatCercle(j).enAttente) {
    const age = Date.now() - e.le;
    if (!envoyees.some((p) => p.id === e.id) && age > 60_000 && age < 7 * 86_400_000 && J.rendreEchange(j, e.id, Date.now())) change = true;
  }
  if (change) { sauver(); publierVitrine(); }
  redessiner();
}

// ---------- La vitrine publiée ----------

let minuteur: number | undefined;
let publiee = '';

/** Publie sa vitrine (au plus une fois par minute, et seulement si elle a changé) */
export function publierVitrine(delai = 5000) {
  if (!app.compte || !app.uid || !J.cercleConstruit(app.jeu) || !app.jeu.directeur?.nom) return;
  clearTimeout(minuteur);
  minuteur = window.setTimeout(async () => {
    const uid = app.uid;
    const j = app.jeu;
    const nom = j.directeur?.nom;
    if (!uid || !nom) return;
    const c = J.etatCercle(j);
    const p: Profil = {
      uid, nom, cle: clePseudo(nom), strate: j.strate,
      porteur: c.fetiche ?? j.escouade[0] ?? 'ilka',
      vitrine: c.vitrine.filter((id) => j.collection[id]).slice(0, 3).map((id) => ({ id, niveau: j.collection[id]!.niveau })),
      doubles: J.doublesEchangeables(j).slice(0, 400),
      souhaits: c.souhaits.slice(0, 30),
      cercle: Math.min(10, j.batiments.cercle ?? 0),
      victoires: c.victoires,
      maj: Date.now(),
    };
    const cle = JSON.stringify({ ...p, maj: 0 });
    if (cle === publiee) return;
    try { await (await reseau()).publierProfil(p); publiee = cle; } catch { /* règles pas publiées ou pseudo pas encore réservé : plus tard */ }
  }, delai);
}

// ---------- Les gestes ----------

const occuper = async <T>(f: () => Promise<T>): Promise<T | null> => {
  C.occupe = true; C.message = ''; afficher();
  try { return await f(); } catch (e) {
    const code = (e as { code?: string })?.code;
    C.message = code === 'permission-denied' ? 'Le serveur a refusé : les règles du Cercle ne sont peut-être pas encore publiées.' : 'Le Cercle ne répond pas. Réessaie dans un instant.';
    return null;
  } finally { C.occupe = false; }
};

/** Ajouter un ami par son nom de directeur */
export async function ajouterAmi(nom: string) {
  const uid = app.uid;
  const moi = nomPublic();
  const cle = clePseudo(nom);
  if (!uid || !moi) return;
  // 8 novembre 2026 : une demande porte ton pseudo réservé (firestore.rules), pas un nom libre
  if (!app.jeu.directeur?.public) { C.message = 'Choisis d’abord ton pseudo de directeur (Grand Tableau) : c’est sous ce nom que tes amis te verront.'; return; }
  if (!/^[a-z0-9]{3,24}$/.test(cle)) { C.message = 'Ce nom de directeur n’est pas valide.'; return; }
  if (cle === clePseudo(moi)) { C.message = 'C’est ton propre nom.'; return; }
  await occuper(async () => {
    const n = await reseau();
    const lui = await n.trouverParPseudo(cle);
    if (!lui) { C.message = `Aucun directeur ne s’appelle « ${nom} ».`; return; }
    const r = await n.demanderAmi(uid, moi, lui.uid, lui.nom);
    C.message = r === 'acceptee' ? `${lui.nom} et toi êtes maintenant amis.` : r === 'deja' ? `Une demande est déjà en cours avec ${lui.nom}, ou vous êtes déjà amis.` : `Invitation envoyée à ${lui.nom}.`;
  });
}

export async function accepterAmi(id: string) {
  await occuper(async () => { await (await reseau()).accepterAmi(id); C.message = 'Nouvel ami au Cercle.'; });
}

export async function retirerAmi(id: string) {
  await occuper(async () => { await (await reseau()).retirerAmi(id); C.ami = null; });
}

/** Envoyer la proposition en cours de composition */
export async function proposerEchange() {
  const x = C.echange;
  const uid = app.uid;
  const a = C.amis.find((y) => y.uid === x?.ami);
  if (!x?.recoit || !x.donne || !uid || !a) return;
  const j = app.jeu;
  const v = J.verifierProposition(j, x.donne, x.recoit, a.depuis, Date.now());
  if (!v.ok) { C.message = v.message ?? ''; return; }
  const donne = x.donne, recoit = x.recoit;
  await occuper(async () => {
    const id = await (await reseau()).proposer({ de: uid, a: a.uid, nomDe: nomPublic(), nomA: a.nom, donne, demande: recoit });
    const r = J.proposerEchange(j, { id, ami: a.uid, nomAmi: a.nom, donne, recoit }, a.depuis, Date.now());
    C.message = r.message ?? '';
    C.echange = null;
    sauver();
    publierVitrine();
  });
}

/** Accepter une proposition reçue */
export async function accepterProposition(id: string) {
  const p = C.recues.find((x) => x.id === id);
  const a = C.amis.find((y) => y.uid === p?.de);
  if (!p || !a) { C.message = 'Cette proposition vient d’un directeur qui n’est plus ton ami.'; return; }
  const j = app.jeu;
  const v = J.verifierAcceptation(j, p.demande, p.donne, a.depuis, Date.now());
  if (!v.ok) { C.message = v.message ?? ''; return; }
  await occuper(async () => {
    const fait = await (await reseau()).repondre(id, 'accepte');
    if (!fait) { C.message = 'Cette proposition n’est plus valable.'; return; }
    const r = J.accepterEchange(j, id, p.demande, p.donne, a.depuis, Date.now());
    C.message = r.ok ? `Échange conclu avec ${p.nomDe} : ${moduleDef(p.donne).nom} rejoint ta collection${r.nouvelle ? ' (nouvelle carte !)' : ''}.` : r.message ?? '';
    sauver();
    publierVitrine();
  });
}

export async function refuserProposition(id: string) {
  await occuper(async () => { await (await reseau()).repondre(id, 'refuse'); });
}

/** Reprendre sa propre proposition */
export async function annulerProposition(id: string) {
  await occuper(async () => {
    const n = await reseau();
    const fait = await n.repondre(id, 'annule');
    // déjà acceptée entre-temps : l'écoute la conclura ; sinon la carte revient tout de suite
    if (fait && J.rendreEchange(app.jeu, id, Date.now())) { C.message = 'Ta carte te revient.'; sauver(); publierVitrine(); n.effacerProposition(id).catch(() => {}); }
  });
}

export async function refuserDefi(id: string) {
  await occuper(async () => { await (await reseau()).repondreDefi(id, 'refuse'); });
}

export async function annulerDefi(id: string) {
  await occuper(async () => { await (await reseau()).effacerDefi(id); });
}

/** Les défis : envoyé avec le code d'un salon déjà ouvert (src/app/duel.ts) */
export async function envoyerDefi(ami: string, code: string, mode: 'libre' | 'egal'): Promise<string | null> {
  const uid = app.uid;
  if (!uid) return null;
  return occuper(async () => (await reseau()).defier({ de: uid, a: ami, nomDe: nomPublic(), code, mode }));
}

export async function marquerDefi(id: string, etat: 'accepte' | 'refuse') {
  try { await (await reseau()).repondreDefi(id, etat); } catch { /* le duel compte quand même */ }
}

export type { Defi };
