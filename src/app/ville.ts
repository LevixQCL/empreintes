// Le Gardien de la ville en ligne (13 novembre 2026) : inscrire les frappes jouées dans la fiche du directeur,
// lire la jauge de la ville et le classement des dégâts (au plus toutes les 5 minutes), recevoir les paliers atteints. Hors ligne, tout échoue sans bruit : les frappes attendent
// dans la partie (gardienVille.aEnvoyer) et partent au prochain passage.

import * as J from '../core/jeu';
import { semaineDe } from '../core/partie/etat';
import { app, D } from './etat';
import { afficher } from './rendu';
import { sauver } from './synchro';
import { t } from '../core/i18n';
import { NOMS_RARETE } from '../core/collection';

let net: typeof import('../net/gardien') | null = null;
const reseau = async () => (net ??= await import('../net/gardien'));

let luLe = 0;
// en développement seulement (captures d'écran) : poser une jauge et un classement de démonstration, sans réseau
if (import.meta.env.DEV) (window as unknown as { __ville: (v: J.VilleGardien) => void }).__ville = (v) => { D.ville = v; afficher(); };
let enCours: Promise<void> | null = null;
/** la semaine d'avant, déjà réglée pour la Perle (une seule lecture par semaine) */
let reglee = -1;

/** Inscrit les frappes en attente, relit la jauge (au plus toutes les 5 minutes, ou tout de suite si `force`), reçoit les paliers */
export function rafraichirVille(force = false): Promise<void> {
  if (!app.compte || !app.uid || !J.gardienOuvert(app.jeu)) return Promise.resolve();
  if (enCours) return enCours;
  enCours = (async () => {
    try {
      const n = await reseau();
      const now = Date.now();
      const g = J.etatGardien(app.jeu, now);
      const uid = app.uid!;
      // les frappes jouées, une à une (les règles n'acceptent qu'une frappe de plus à la fois)
      let envoye = false;
      for (let tour = 0; g.aEnvoyer.length && tour < 10; tour++) {
        const f = g.aEnvoyer[0]!;
        const d = app.jeu.directeur;
        const qui = { nom: d?.public && d.nom ? d.nom : null, strate: Math.max(1, J.strateVaincue(app.jeu)) };
        let fiche: J.FicheGardien | null;
        try {
          fiche = await n.inscrireFrappe(uid, qui, f);
        } catch (e) {
          // refusée par les règles (pseudo pas encore réservé, horloge du téléphone très décalée) : sans le pseudo, sinon on l'abandonne
          if ((e as { code?: string }).code !== 'permission-denied') throw e;
          try { fiche = await n.inscrireFrappe(uid, { ...qui, nom: null }, f); } catch (e2) {
            if ((e2 as { code?: string }).code !== 'permission-denied') throw e2;
            fiche = null;
            D.message = t('La ville n’a pas pu compter ta frappe : vérifie l’heure de ton téléphone.');
          }
        }
        J.partsComptees(app.jeu, g.semaine, fiche ?? (await n.maFiche(g.semaine, uid)), 1);
        envoye = true;
      }
      if (envoye || force || now - luLe > 300_000) {
        D.ville = await n.lireVille(g.semaine, uid);
        luLe = now;
      }
      // la semaine d'avant : la Perle due, si la ville n'a pas abattu son Gardien, attend le suivant
      const avant = semaineDe(now) - 1;
      if (reglee !== avant) {
        const v = await n.jaugeVille(avant);
        J.reporterPerle(app.jeu, avant, v.frappeurs > 0 && v.parts >= v.pv);
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
    case 'carte': return d.metal ? t`une carte au choix en ${NOMS_RARETE[d.metal].toLowerCase()}` : t('une carte au choix');
    case 'perle': return t('une Perle de nacre');
  }
}
