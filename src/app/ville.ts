// Le Gardien de la ville en ligne (13 novembre 2026) : envoyer les frappes jouées (le serveur les rejoue et compte les parts),
// lire la jauge de la ville, recevoir les paliers atteints. Hors ligne, tout échoue sans bruit : les frappes attendent
// dans la partie (gardienVille.aEnvoyer) et partent au prochain passage.

import * as J from '../core/jeu';
import { semaineDe } from '../core/partie/etat';
import { app, D } from './etat';
import { afficher } from './rendu';
import { sauver } from './synchro';
import { t } from '../core/i18n';

let net: typeof import('../net/gardien') | null = null;
const reseau = async () => (net ??= await import('../net/gardien'));

let luLe = 0;
let enCours: Promise<void> | null = null;
/** la semaine d'avant, déjà réglée pour la Perle (une seule lecture par semaine) */
let reglee = -1;

/** Envoie les frappes en attente, relit la jauge (au plus toutes les 2 minutes, ou tout de suite si `force`), reçoit les paliers */
export function rafraichirVille(force = false): Promise<void> {
  if (!app.compte || !app.uid || !J.gardienOuvert(app.jeu)) return Promise.resolve();
  if (enCours) return enCours;
  enCours = (async () => {
    try {
      const n = await reseau();
      const now = Date.now();
      const g = J.etatGardien(app.jeu, now);
      if (g.aEnvoyer.length) {
        const envoyees = g.aEnvoyer.length;
        const r = await n.envoyerFrappes(g.aEnvoyer);
        if (r.semaine === g.semaine) J.partsComptees(app.jeu, r.semaine, r.parts, envoyees);
        else g.aEnvoyer = [];
        D.ville = r.ville;
        luLe = now;
        if (r.refus.length && !r.acceptees) D.message = t`La ville n’a pas compté ta frappe : ${r.refus[0]}`;
      } else if (force || now - luLe > 120_000) {
        D.ville = await n.lireVille(g.semaine);
        luLe = now;
      }
      // la semaine d'avant : la Perle due, si la ville n'a pas abattu son Gardien, attend le suivant
      const avant = semaineDe(now) - 1;
      if (reglee !== avant) {
        const v = await n.lireVille(avant);
        J.reporterPerle(app.jeu, avant, !!v && v.parts >= v.pv);
        reglee = avant;
      }
      g.enLigne = true;
      if (D.ville) {
        const dons = J.recevoirPaliers(app.jeu, D.ville, now);
        if (dons.length) D.message = t`La ville a repoussé le Gardien à ${Math.round((D.ville.parts / Math.max(1, D.ville.pv)) * 100)} % : ` + dons.map(texteDon).join(', ') + '.';
      }
      sauver();
      if (app.mode === 'district') afficher();
    } catch { /* hors ligne, ou fonction pas encore publiée : on réessaiera */ }
    finally { enCours = null; }
  })();
  return enCours;
}

function texteDon(d: J.RecompensePalier): string {
  switch (d.type) {
    case 'cristaux': return t`+${d.n} cristaux`;
    case 'eclats': return t`+${d.n} Éclats`;
    case 'carte': return t('une carte au choix');
    case 'perle': return t('une Perle de nacre');
    default: return t('un décor pour la Cuvette');
  }
}
