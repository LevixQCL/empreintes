// La vente des Récits des origines (11 novembre 2026) : ce que le compte a acquis, l'offre ouverte sur une fiche, le paiement.
// Les droits viennent du compte (achats/{uid}, écrit par le serveur) ; une copie reste sur l'appareil pour jouer hors ligne.
// Tant que la vente n'est pas ouverte (src/net/vente.ts), rien de tout cela ne se voit : les récits restent en aperçu.

import { aRecit, perleDesRecits, PRODUITS } from '../core/jeu';
import { sauver } from './synchro';
import { langue, t } from '../core/i18n';
import { VENTE_OUVERTE, venteEssai } from '../net/vente';
import type { Boutique } from '../ui/coquille';
import { app, compteEtat, compteProtege, D } from './etat';
import { afficher } from './rendu';

const CLE = 'ossyra.achats';
const essai = venteEssai();

export const boutique: Boutique = { ouverte: essai?.ouverte ?? VENTE_OUVERTE, achats: essai?.achats ?? [], offre: null, occupe: false, erreur: '', compte: 'indisponible' };
D.boutique = boutique;

/** Ce récit se lit-il sur ce compte ? (toujours, tant que la vente n'est pas ouverte) */
export const recitOuvert = (recit: string): boolean => !boutique.ouverte || aRecit(boutique.achats, recit);

/** Peut-on acheter avec ce compte ? Il faut un compte relié à Google ou à un e-mail : l'achat y reste attaché,
 *  alors qu'un compte invisible se perd avec l'appareil. Les moins de 13 ans jouent sans rien en ligne : pas d'achat. */
export function majCompteAchat(): void {
  boutique.compte = essai ? 'pret'
    : !compteEtat.actif || compteEtat.age === 'jeune' || !app.compte || !compteEtat.utilisateur ? 'indisponible'
    : compteProtege() ? 'pret' : 'a-relier';
}

const lireCopie = (uid: string): string[] | null => {
  try {
    const c = JSON.parse(localStorage.getItem(CLE) ?? 'null') as { uid?: string; droits?: unknown } | null;
    return c?.uid === uid && Array.isArray(c.droits) ? c.droits.filter((d): d is string => typeof d === 'string') : null;
  } catch { return null; }
};
const garderCopie = (uid: string, droits: string[]) => { try { localStorage.setItem(CLE, JSON.stringify({ uid, droits })); } catch { /* stockage bloqué */ } };

// Le compte de Bryan (11 novembre 2026) : il doit tout voir comme s'il avait payé, pour évaluer. Même empreinte SHA-256 de
// l'adresse que dans firestore.rules (estAdmin) et src/analyse/main.ts : l'adresse n'apparaît pas en clair dans le code publié.
const ADMIN = '1f844d89dfde78aa9740d9368a477833bf3954975d622b52a1b531672fca2ba9';
async function estCompteAdmin(): Promise<boolean> {
  const u = compteEtat.utilisateur;
  if (!u || u.anonyme || !u.verifie || !u.email) return false;
  try {
    const h = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(u.email.trim().toLowerCase()));
    return [...new Uint8Array(h)].map((b) => b.toString(16).padStart(2, '0')).join('') === ADMIN;
  } catch { return false; }
}
const TOUS_LES_DROITS = [...new Set(Object.values(PRODUITS).flatMap((p) => p.droits))];

/** de retour de la page de paiement : « ok » (payé, les droits arrivent) ou « annule » */
let retour: 'ok' | 'annule' | null = null;
/** À lancer une fois au démarrage : lit « ?achat=… » dans l'adresse, puis la nettoie */
export function retourPaiement(): void {
  const p = new URLSearchParams(location.search);
  const a = p.get('achat');
  if (a !== 'ok' && a !== 'annule') return;
  retour = a;
  p.delete('achat');
  const reste = p.toString();
  history.replaceState(null, '', location.pathname + (reste ? `?${reste}` : '') + location.hash);
  if (a === 'annule') D.message = t('Paiement annulé : rien n’a été débité.');
}

/**
 * Le compte change (connexion, déconnexion) : on reprend ses droits. D'abord la copie de l'appareil (hors ligne), puis le compte.
 * Au retour d'un paiement, le serveur met parfois quelques secondes à inscrire le droit : on relit jusqu'à le voir.
 */
export async function chargerAchats(uid: string | null): Promise<void> {
  if (essai || !boutique.ouverte) return;
  majCompteAchat();
  if (!uid) { boutique.achats = []; return; }
  if (await estCompteAdmin()) { boutique.achats = [...TOUS_LES_DROITS]; retour = null; if (app.mode === 'district') afficher(); return; }
  const copie = lireCopie(uid);
  boutique.achats = copie ?? [];
  const attendus = retour === 'ok';
  retour = null;
  try {
    const net = await import('../net/achats');
    for (let essais = attendus ? 8 : 1; essais > 0 && app.uid === uid; essais--) {
      const droits = await net.lireAchats(uid);
      const nouveau = droits.some((d) => !boutique.achats.includes(d));
      boutique.achats = droits;
      garderCopie(uid, droits);
      if (nouveau || !attendus) {
        if (attendus) D.message = t('Merci ! Ton achat est inscrit sur ton compte : le récit t’attend sur la fiche du Porteur.');
        break;
      }
      if (essais === 1) D.message = t('Ton paiement est en cours de confirmation : le récit s’ouvrira dans quelques instants.');
      else await new Promise((r) => setTimeout(r, 2500));
    }
  } catch { /* hors ligne : la copie de l'appareil suffit */ }
  // le lot des trois Récits donne une Perle de nacre, une seule fois (13 novembre 2026)
  if (['ilka', 'doran', 'vela'].every((r) => aRecit(boutique.achats, r))) {
    const perle = perleDesRecits(app.jeu);
    if (perle) { D.message = perle; sauver(); }
  }
  if (app.mode === 'district') afficher();
}

/** Payer un produit : la page de paiement s'ouvre à la place du jeu, puis ramène le joueur ici */
export async function payer(produit: string): Promise<void> {
  if (!PRODUITS[produit] || boutique.occupe) return;
  majCompteAchat();
  if (essai) { boutique.erreur = t('Mode essai : le paiement ne s’ouvre que sur le jeu publié.'); return; }
  if (boutique.compte !== 'pret') return;
  boutique.occupe = true; boutique.erreur = '';
  afficher();
  try {
    const net = await import('../net/achats');
    const url = await net.ouvrirPaiement(produit, location.origin + location.pathname.replace(/index\.html$/, ''), langue());
    location.assign(url);
    return;
  } catch (e) {
    const code = (e as { code?: string })?.code ?? '';
    boutique.erreur = code === 'functions/already-exists' ? t('Ce récit est déjà acquis sur ton compte.')
      : code === 'functions/unavailable' || code === 'functions/internal' || !navigator.onLine ? t('Le paiement ne répond pas. Vérifie ta connexion et réessaie.')
      : t`Le paiement n’a pas pu s’ouvrir. Réessaie dans un instant.${code ? ` (${code})` : ''}`;
    if (code === 'functions/already-exists' && app.uid) await chargerAchats(app.uid);
  }
  boutique.occupe = false;
  afficher();
}
