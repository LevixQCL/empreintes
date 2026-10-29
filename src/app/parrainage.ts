// Le parrainage côté application : le lien ?ref=, la réservation de son code, la lecture de ses recrues,
// et la publication de ses paliers pour son parrain. Le réseau est dans src/net/parrainage.ts, les règles dans src/core/partie/parrainage.ts.

import * as J from '../core/jeu';
import { recruterVide } from '../ui/parrainage';
import { app, D } from './etat';
import { afficher } from './rendu';
import { sauver } from './synchro';

/** L'état de l'écran « Recruter » */
export const R = recruterVide();

const CLE_REF = 'empreintes-ref';
let net: typeof import('../net/parrainage') | null = null;
const reseau = async () => (net ??= await import('../net/parrainage'));

/** Au démarrage : un lien `?ref=CODE` est retenu (sur l'appareil) jusqu'à ce que la partie puisse s'en servir, puis retiré de l'adresse */
export function retenirLien(): void {
  try {
    const u = new URL(location.href);
    const code = J.lireCode(u.searchParams.get('ref') ?? '');
    if (!u.searchParams.has('ref')) return;
    if (code) localStorage.setItem(CLE_REF, code);
    u.searchParams.delete('ref');
    history.replaceState(null, '', u.pathname + (u.search ? u.search : '') + u.hash);
  } catch { /* stockage bloqué : le joueur pourra saisir le code */ }
}

const lienEnAttente = (): string | null => { try { return localStorage.getItem(CLE_REF); } catch { return null; } };
const oublierLien = () => { try { localStorage.removeItem(CLE_REF); } catch { /* rien */ } };

/** Le lien à partager */
export const lienDe = (code: string) => `${location.origin}${location.pathname}?ref=${code}`;

const nomDuJoueur = () => app.jeu.directeur?.nom || 'Un directeur';

/** Réserve (ou retrouve) le code du joueur : à l'ouverture de l'écran */
export async function preparerCode(): Promise<void> {
  if (!app.compte || !app.uid) return;
  const uid = app.uid;
  const e = J.etatParrainage(app.jeu);
  try {
    const code = await (await reseau()).monCode(uid, nomDuJoueur(), e.code);
    if (app.uid !== uid) return;
    if (e.code !== code) { e.code = code; sauver(); }
  } catch (err) {
    R.etat = 'erreur'; R.erreur = `Ton code ne peut pas être gravé pour l’instant (${(err as { code?: string })?.code ?? 'réseau'}).`;
  }
}

/** Relit ses recrues et touche ce qu'elles rapportent */
export async function lireRecrues(): Promise<void> {
  if (!app.compte || !app.uid || !app.jeu.parrainage?.code) return;
  const uid = app.uid;
  R.etat = 'chargement';
  try {
    const l = await (await reseau()).lireRecrues(uid);
    if (app.uid !== uid) return;
    R.recrues = l; R.etat = 'ok';
    const nouvelles = J.reclamerRecrues(app.jeu, l);
    if (nouvelles.length) { D.message = nouvelles.join(' '); sauver(); }
  } catch (err) {
    R.etat = 'erreur'; R.erreur = `Tes recrues ne répondent pas pour l’instant (${(err as { code?: string })?.code ?? 'réseau'}).`;
  }
}

/** À l'ouverture de l'écran : le code d'abord, puis les recrues */
export async function ouvrirRecruter(): Promise<void> {
  R.saisie = null;
  if (!app.compte || !app.uid) return;
  if (!app.jeu.parrainage?.code) await preparerCode();
  if (app.mode === 'district' && D.vue === 'recruter') afficher();
  await lireRecrues();
  if (app.mode === 'district' && D.vue === 'recruter') afficher();
}

/** Entre le code d'un parrain (saisi, ou venu d'un lien) ; renvoie le message à montrer */
export async function entrerCode(saisie: string): Promise<{ ok: boolean; texte: string }> {
  const code = J.lireCode(saisie);
  if (!code) return { ok: false, texte: 'Ce code n’a pas la bonne forme : 6 lettres et chiffres, par exemple EMP-7KQ2X9.' };
  if (!app.compte || !app.uid) return { ok: false, texte: 'Le jeu n’est pas connecté : réessaie dans un instant.' };
  if (!J.peutEtreParraine(app.jeu)) return { ok: false, texte: app.jeu.parrainage?.parrain ? 'Tu as déjà un parrain.' : 'Le parrainage, c’est pour les débuts : ton district est déjà trop avancé.' };
  if (app.jeu.parrainage?.code === code) return { ok: false, texte: 'C’est ton propre code : envoie-le plutôt à un ami.' };
  const n = await reseau();
  try {
    const parrain = await n.lireParrain(code);
    if (!parrain) return { ok: false, texte: 'Aucun directeur n’a ce code. Vérifie-le avec ton ami.' };
    if (parrain.uid === app.uid) return { ok: false, texte: 'C’est ton propre code : envoie-le plutôt à un ami.' };
    await n.rejoindre(app.uid, code, parrain.uid, nomDuJoueur());
    const r = J.devenirFilleul(app.jeu, { uid: parrain.uid, code, nom: parrain.nom }, Date.now());
    if (!r.ok) return { ok: false, texte: r.message ?? 'Refusé.' };
    sauver();
    publierPaliers();
    return { ok: true, texte: `Recommandé par ${parrain.nom} : ta carte au choix et tes composants t’attendent.` };
  } catch (err) {
    if (err instanceof n.CodeRefuse) return { ok: false, texte: err.message };
    return { ok: false, texte: `La vérification a échoué (${(err as { code?: string })?.code ?? 'réseau'}). Réessaie dans un instant.` };
  }
}

let publication = false;
let derniereTentative = 0;

/** Publie les paliers atteints par ce filleul (une écriture par palier, au plus une tentative par minute) */
export async function publierPaliers(): Promise<void> {
  if (publication || !app.compte || !app.uid) return;
  const a = J.paliersAPublier(app.jeu);
  if (!a.length || Date.now() - derniereTentative < 60_000) return;
  publication = true; derniereTentative = Date.now();
  try {
    await (await reseau()).publierPaliers(app.uid, nomDuJoueur(), a);
    J.notePublies(app.jeu, a);
    sauver();
  } catch { /* on réessaiera dans une minute */ } finally { publication = false; }
}

let lancement = false;

/**
 * Chaque seconde : le lien en attente s'applique dès que la partie a commencé et que le compte est prêt,
 * les paliers partent pour le parrain, et une fois par lancement le parrain relit ses recrues.
 */
export function battreParrainage(): void {
  if (!app.compte || !app.uid || app.mode !== 'district' || !app.jeu.chambre) return;
  const ref = lienEnAttente();
  if (ref && !R.occupe) {
    if (!J.peutEtreParraine(app.jeu) || app.jeu.parrainage?.code === ref) oublierLien();
    else {
      R.occupe = true;
      entrerCode(ref).then((r) => {
        R.occupe = false;
        // un refus définitif (code inconnu, déjà un parrain) oublie le lien ; une panne réseau le garde pour plus tard
        if (r.ok || !r.texte.includes('Réessaie')) oublierLien();
        if (r.ok) { D.message = r.texte; afficher(); }
      });
    }
  }
  publierPaliers();
  if (!lancement && app.jeu.parrainage?.code) { lancement = true; lireRecrues(); }
}
