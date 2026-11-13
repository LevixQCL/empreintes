// Le Gardien de la ville, côté serveur (13 novembre 2026). Une seule fonction, appelée par le jeu à la fin d'un combat :
// - compterFrappes : le téléphone envoie de quoi rejouer ses combats (jamais ses dégâts). Le serveur relit sa sauvegarde
//   (saves/{uid}), rejoue chaque combat avec le moteur du jeu (gardien-core.js, construit par `npm run serveur`), puis
//   inscrit les parts dans gardien/{semaine} (la jauge de la ville) et gardien/{semaine}/directeurs/{uid} (sa fiche).
// Les règles Firestore ne laissent personne écrire ces documents : seul ce serveur les tient à jour.

const { onCall, HttpsError } = require('firebase-functions/v2/https');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');
const { compterFrappes, lirePartie, pvVille, semaineDe } = require('./gardien-core');

const REGION = 'europe-west1';
/** les dernières frappes affichées dans le fil de la ville */
const FIL = 12;

exports.compterFrappes = onCall({ region: REGION, maxInstances: 10, memory: '512MiB' }, async (req) => {
  if (!req.auth) throw new HttpsError('unauthenticated', 'Connecte-toi pour frapper le Gardien.');
  const uid = req.auth.uid;
  const now = Date.now();
  const db = getFirestore();
  const semaine = semaineDe(now);
  const save = await db.doc(`saves/${uid}`).get();
  const partie = save.exists ? lirePartie(save.data().data) : null;
  if (!partie) throw new HttpsError('failed-precondition', 'Ta partie n’est pas encore sauvée en ligne : réessaie dans un instant.');
  const pseudo = (await db.doc(`classement/${uid}`).get()).data()?.nom ?? null;

  const refVille = db.doc(`gardien/${semaine}`);
  const refFiche = db.doc(`gardien/${semaine}/directeurs/${uid}`);
  return db.runTransaction(async (tx) => {
    const [ville, fiche] = await Promise.all([tx.get(refVille), tx.get(refFiche)]);
    const bilan = compterFrappes(partie, req.data?.frappes, fiche.exists ? fiche.data() : null, now);
    let v = ville.exists ? ville.data() : null;
    if (!v) {
      // une nouvelle semaine : ses PV se calent sur le nombre de directeurs qui ont frappé la semaine d'avant
      const avant = await tx.get(db.doc(`gardien/${semaine - 1}`));
      v = { semaine, pv: pvVille(avant.exists ? avant.data().frappeurs ?? 0 : 0), parts: 0, frappeurs: 0, fil: [] };
    }
    if (bilan.acceptees) {
      const nouveau = !fiche.exists || !(fiche.data().frappes > 0);
      v = {
        ...v,
        parts: Math.round((v.parts + bilan.ajout) * 10) / 10,
        frappeurs: v.frappeurs + (nouveau ? 1 : 0),
        fil: [{ nom: pseudo ?? 'Un directeur', strate: bilan.strate, parts: Math.round(bilan.ajout * 10) / 10 }, ...(v.fil ?? [])].slice(0, FIL),
        maj: FieldValue.serverTimestamp(),
      };
      tx.set(refVille, v);
      tx.set(refFiche, bilan.fiche);
    } else if (!ville.exists) tx.set(refVille, { ...v, maj: FieldValue.serverTimestamp() });
    return { semaine, parts: bilan.fiche.parts, acceptees: bilan.acceptees, refus: bilan.refus,
      ville: { semaine, pv: v.pv, parts: v.parts, frappeurs: v.frappeurs, fil: v.fil ?? [] } };
  });
});
