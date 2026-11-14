// La Confluence côté application (14 novembre 2026) : l'adhésion, les écoutes (seulement l'écran du Cercle ouvert),
// l'apport de la semaine publié, les dons reçus appliqués à la partie, et les gestes du joueur.
// Tant que les règles Firestore ne sont pas publiées, tout échoue sans casser le jeu : l'écran le dit.

import * as J from '../core/jeu';
import { moduleDef } from '../core/donnees';
import type { Confluence, Membre } from '../net/confluence';
import { app, D } from './etat';
import { afficher } from './rendu';
import { sauver } from './synchro';
import { C } from './cercle';
import { t } from '../core/i18n';

let net: typeof import('../net/confluence') | null = null;
const reseau = async () => (net ??= await import('../net/confluence'));

let ecoute: { id: string; arreter: () => void } | null = null;
const F = () => C.cf;

const nom = () => app.jeu.directeur?.nom ?? '';
const fiche = () => ({ uid: app.uid!, nom: nom(), porteur: J.etatCercle(app.jeu).fetiche ?? app.jeu.escouade[0] ?? 'ilka', strate: Math.max(1, app.jeu.strate) });
const redessiner = () => {
  if (app.mode === 'district' && D.vue === 'cercle') afficher();
  else if (D.vue !== 'cercle') arreterConfluence();
};

function erreur(e: unknown) {
  const code = (e as { code?: string })?.code;
  F().etat = 'erreur';
  F().erreur = code === 'permission-denied' ? t('Les Confluences ne sont pas encore ouvertes en ligne (les règles du serveur attendent leur mise à jour).') : t('Le quai ne répond pas pour l’instant.');
  redessiner();
}

/** À l'ouverture du Cercle : retrouver sa Confluence et l'écouter, ou lire celles qui recrutent */
export async function suivreConfluence(force = false) {
  const uid = app.uid;
  const j = app.jeu;
  if (!app.compte || !uid || !J.confluenceOuverte(j) || !j.directeur?.nom) return;
  const local = J.etatConfluence(j, Date.now());
  try {
    const n = await reseau();
    // la partie ne sait pas (autre appareil, ancienne sauvegarde) : l'adhésion en ligne fait foi
    if (!local.id || force) {
      const id = await n.lireAdhesion(uid).catch(() => null);
      if (id) { const c = await n.lireConfluence(id); if (c?.membres.includes(uid)) { J.entrerConfluence(j, c.id, c.nom, Date.now()); sauver(); } }
    }
    const id = J.etatConfluence(j, Date.now()).id;
    if (!id) { arreterConfluence(); F().etat = 'aucune'; lireListe(); return; }
    if (ecoute?.id === id && !force) return;
    arreterConfluence();
    F().etat = 'chargement';
    const a = n.ecouterConfluence(id, (c) => majConfluence(c), erreur);
    const b = n.ecouterMembres(id, (l) => { F().membres = l; redessiner(); }, erreur);
    const c = n.ecouterDemandes(id, (l) => { F().demandes = l; majDemandes(); }, erreur);
    const d = n.ecouterMessages(id, (l) => { F().messages = l; F().nonLus = 0; redessiner(); }, () => {});
    ecoute = { id, arreter: () => { a(); b(); c(); d(); } };
  } catch (e) { erreur(e); }
}

export function arreterConfluence() {
  ecoute?.arreter();
  ecoute = null;
}

function majConfluence(c: Confluence | null) {
  const j = app.jeu;
  const uid = app.uid;
  if (!c || !uid || !c.membres.includes(uid)) {
    // dissoute, ou on nous a écartés : la partie l'oublie (les copies reçues restent)
    const avant = J.etatConfluence(j, Date.now()).nom;
    J.quitterConfluence(j, Date.now()); sauver();
    arreterConfluence();
    F().conf = undefined; F().etat = 'aucune'; F().membres = []; F().demandes = []; F().messages = [];
    if (avant) C.message = t`Tu ne fais plus partie de la Confluence ${avant}.`;
    lireListe();
    redessiner();
    return;
  }
  F().conf = c; F().etat = 'membre';
  if (J.etatConfluence(j, Date.now()).nom !== c.nom) { J.etatConfluence(j, Date.now()).nom = c.nom; sauver(); }
  publierApport();
  redessiner();
}

/** Les copies reçues pour sa demande : ajoutées à la collection, une seule fois chacune */
function majDemandes() {
  const j = app.jeu;
  const mienne = F().demandes.find((d) => d.uid === app.uid);
  if (mienne) {
    const r = J.recevoirDons(j, mienne.le, mienne.recu, Date.now());
    if (r) { C.message = t`${r.n > 1 ? t`${r.n} copies` : t('Une copie')} de ${moduleDef(r.carte).nom} ${r.n > 1 ? t('rejoignent') : t('rejoint')} ta collection.`; sauver(); }
  }
  redessiner();
}

/** Les Confluences les plus fortes (le classement, et celles qui recrutent) : au plus une lecture par minute */
export async function lireListe(force = false) {
  if (!app.compte || !app.uid) return;
  if (!force && Date.now() - F().listeLue < 60_000) return;
  F().listeLue = Date.now();
  try { F().liste = await (await reseau()).lireConfluences(30); redessiner(); } catch (e) { erreur(e); }
}

// ---------- Le Courant ----------

let minuteur: number | undefined;
/** Publier son apport de la semaine (seulement s'il a grandi, ou si sa fiche date d'une autre semaine) */
export function publierApport(delai = 1500) {
  clearTimeout(minuteur);
  minuteur = window.setTimeout(async () => {
    const j = app.jeu;
    const now = Date.now();
    const l = J.etatConfluence(j, now);
    const id = l.id;
    if (!id || !app.uid || !F().conf) return;
    const a = J.apportSemaine(j, now);
    const ecart = a.total - l.publie;
    const moi = F().membres.find((m) => m.uid === app.uid);
    const sem = J.semaineDe(now);
    if (ecart <= 0 && moi && moi.semaine === sem && moi.strate === Math.max(1, j.strate)) return;
    try {
      await (await reseau()).publierApport(id, { ...fiche(), apport: a.total, dons: l.dons }, Math.max(0, ecart), sem);
      l.publie = Math.max(l.publie, l.publie + Math.min(200, Math.max(0, ecart)));
      sauver();
    } catch { /* plus tard */ }
  }, delai);
}

// ---------- Les gestes ----------

const occuper = async <T>(f: () => Promise<T>): Promise<T | null> => {
  C.occupe = true; C.message = ''; afficher();
  try { return await f(); } catch (e) {
    const code = (e as { code?: string })?.code;
    C.message = code === 'permission-denied' ? t('Le serveur a refusé : les règles des Confluences ne sont peut-être pas encore publiées.') : t('Le quai ne répond pas. Réessaie dans un instant.');
    return null;
  } finally { C.occupe = false; }
};

export async function fonderConfluence(nomConf: string, devise: string, embleme: number, couleur: number) {
  const j = app.jeu;
  if (!app.uid || !nom()) return;
  const r = J.raisonNom(nomConf);
  if (r) { F().erreurForm = r; return; }
  const p = J.payerFondation(j);
  if (!p.ok) { F().erreurForm = p.message ?? ''; return; }
  const id = J.cleConfluence(nomConf);
  const fait = await occuper(async () => (await reseau()).fonder({ id, nom: nomConf.trim(), devise: devise.trim().slice(0, 80), embleme, couleur }, fiche(), J.semaineDe(Date.now())));
  if (fait !== 'ok') {
    J.rembourserFondation(j);
    if (fait === 'pris') F().erreurForm = t`Le nom « ${nomConf.trim()} » est déjà pris.`;
    return;
  }
  J.entrerConfluence(j, id, nomConf.trim(), Date.now());
  F().feuille = null; F().erreurForm = '';
  C.message = t`La Confluence ${nomConf.trim()} est fondée. Invite tes amis à la rejoindre.`;
  sauver();
  await suivreConfluence(true);
}

export async function rejoindreConfluence(id: string) {
  const j = app.jeu;
  if (!app.uid || !nom()) return;
  if (J.etatConfluence(j, Date.now()).id) { C.message = t('Quitte d’abord ta Confluence.'); return; }
  const r = await occuper(async () => (await reseau()).rejoindre(id, fiche(), J.semaineDe(Date.now()), J.CONFLUENCE.membresMax));
  if (r === null) return;
  if (r === 'pleine') { C.message = t('Cette Confluence est pleine.'); return; }
  if (r === 'fermee') { C.message = t('Cette Confluence n’accueille personne pour l’instant.'); return; }
  if (r === 'absente') { C.message = t('Cette Confluence n’existe plus.'); lireListe(true); return; }
  const c = F().liste.find((x) => x.id === id) ?? F().apercu;
  J.entrerConfluence(j, id, c?.nom ?? id, Date.now());
  F().feuille = null; F().apercu = undefined;
  C.message = t`Bienvenue dans la Confluence ${c?.nom ?? ''}.`;
  sauver();
  await suivreConfluence(true);
}

/** Chercher une Confluence par son nom exact */
export async function chercherConfluence(texte: string) {
  const cle = J.cleConfluence(texte);
  if (cle.length < 3) { C.message = t('Tape au moins 3 lettres du nom.'); return; }
  const c = await occuper(async () => (await reseau()).lireConfluence(cle));
  if (c === null) { C.message = C.message || t`Aucune Confluence ne s’appelle « ${texte} ».`; return; }
  F().apercu = c; F().feuille = 'apercu';
  try { F().apercuMembres = await (await reseau()).lireMembres(c.id); } catch { F().apercuMembres = []; }
}

/** Voir une Confluence de la liste avant d'y entrer */
export async function voirConfluence(id: string) {
  const c = F().liste.find((x) => x.id === id);
  if (!c) return;
  F().apercu = c; F().feuille = 'apercu'; F().apercuMembres = undefined;
  afficher();
  try { F().apercuMembres = await (await reseau()).lireMembres(id); } catch { F().apercuMembres = []; }
}

export async function quitterLaConfluence() {
  const j = app.jeu;
  const id = J.etatConfluence(j, Date.now()).id;
  const c = F().conf;
  if (!id || !app.uid) return;
  // le flambeau : un ancien d'abord, puis celui qui a le plus apporté cette semaine
  const autres = F().membres.filter((m) => m.uid !== app.uid);
  const succ = [...autres].sort((a, b) => Number(c?.anciens.includes(b.uid)) - Number(c?.anciens.includes(a.uid)) || b.apport - a.apport)[0]?.uid ?? null;
  const fait = await occuper(async () => { await (await reseau()).quitter(id, app.uid!, nom(), succ); return true; });
  if (!fait) return;
  arreterConfluence();
  J.quitterConfluence(j, Date.now());
  F().conf = undefined; F().etat = 'aucune'; F().membres = []; F().demandes = []; F().messages = []; F().feuille = null; F().confirmer = null;
  C.message = t('Tu as quitté la Confluence.');
  sauver();
  lireListe(true);
}

export async function reglerConfluence(r: { devise?: string; ouverte?: boolean; embleme?: number; couleur?: number }) {
  const id = F().conf?.id;
  if (!id) return;
  await occuper(async () => { await (await reseau()).regler(id, r); });
}

export async function basculerAncien(uid: string) {
  const id = F().conf?.id;
  if (id) await occuper(async () => { await (await reseau()).basculerAncien(id, uid); });
}

export async function ecarterMembre(uid: string) {
  const id = F().conf?.id;
  if (!id) return;
  await occuper(async () => { await (await reseau()).ecarter(id, uid); });
  F().membre = null; F().confirmer = null;
}

/** Écrire sur le quai : un message libre ou un message rapide (par son numéro) */
export async function ecrireQuai(texte: string, rapide?: number): Promise<boolean> {
  const id = F().conf?.id;
  if (!id || !app.uid) return false;
  const propre = texte.replace(/\s+/g, ' ').trim().slice(0, J.CONFLUENCE.messageMax);
  if (rapide === undefined && !propre) return false;
  const moi = F().membres.find((m) => m.uid === app.uid);
  if (moi && Date.now() - moi.dernierMsg < J.CONFLUENCE.messageDelai) { C.message = t('Doucement : un message toutes les quelques secondes.'); return false; }
  const ok = await occuper(async () => { await (await reseau()).ecrire(id, app.uid!, nom(), rapide === undefined ? 'texte' : 'rapide', rapide === undefined ? propre : String(rapide)); return true; });
  return !!ok;
}

export async function effacerMessage(msg: string) {
  const id = F().conf?.id;
  if (id) await occuper(async () => { await (await reseau()).effacerMessage(id, msg); });
}

/** Demander des copies d'une carte (remplace la demande précédente) */
export async function demanderCopies(carte: string) {
  const j = app.jeu;
  const id = J.etatConfluence(j, Date.now()).id;
  if (!id || !app.uid) return;
  // les copies déjà reçues pour la demande précédente sont ajoutées avant qu'elle soit remplacée
  majDemandes();
  const avant = J.etatConfluence(j, Date.now()).demande;
  const r = J.demanderCopies(j, carte, Date.now());
  if (!r.ok || !r.demande) { C.message = r.message ?? ''; return; }
  const d = r.demande;
  const ok = await occuper(async () => { await (await reseau()).demander(id, { uid: app.uid!, nom: nom(), carte: d.carte, voulu: d.voulu, le: d.le }); return true; });
  if (!ok) { const l = J.etatConfluence(j, Date.now()); if (avant) l.demande = avant; else delete l.demande; return; }
  F().feuille = null;
  C.message = t`Demande envoyée : ${moduleDef(carte).nom}, ${d.voulu} ${d.voulu > 1 ? t('copies') : t('copie')}.`;
  sauver();
}

/** Donner une copie à un membre */
export async function donnerCopie(pour: string) {
  const j = app.jeu;
  const id = J.etatConfluence(j, Date.now()).id;
  const d = F().demandes.find((x) => x.uid === pour);
  if (!id || !app.uid || !d) return;
  const r = J.donnerCopie(j, d.carte, Date.now());
  if (!r.ok) { C.message = r.message ?? ''; return; }
  const fait = await occuper(async () => (await reseau()).donner(id, pour, app.uid!, nom()));
  if (!fait) {
    J.annulerDon(j, d.carte, r.cristaux ?? 0, Date.now());
    if (!C.message) C.message = t('Cette demande est déjà remplie.');
    return;
  }
  C.message = r.cristaux ? t`Merci pour ${fait.nomPour} : +${r.cristaux} cristaux.` : t`Merci pour ${fait.nomPour}. Tes dons récompensés du jour sont épuisés, mais la Crue compte encore ton geste.`;
  sauver();
  publierApport(800);
}

/** Recevoir un palier de la Crue */
export function recevoirPalier(i: number) {
  const c = F().conf;
  if (!c) return;
  const r = J.recevoirPalier(app.jeu, i, c.semaineC === J.semaineDe(Date.now()) ? c.courant : 0, c.membres.length, Date.now());
  C.message = r.ok ? (r.cristaux ? t`La Crue te rapporte ${r.cristaux} cristaux.` : r.eclats ? t`La Crue te rapporte ${r.eclats} Éclats.` : t('La Crue a rapporté des empreintes : choisis ta carte au district.')) : r.message ?? '';
  sauver();
}

export type { Membre };
