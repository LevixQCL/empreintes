// Le serveur de paiement d'Ossyra (11 novembre 2026). Deux fonctions, rien de plus :
// - creerPaiement : appelée par le jeu (joueur connecté avec Google ou un e-mail). Elle prépare la page de paiement Stripe
//   pour un produit de functions/produits.json et renvoie son adresse. Le prix vient d'ici, jamais du téléphone du joueur.
// - paiementRecu : appelée par Stripe (webhook) une fois le paiement encaissé. Elle vérifie la signature de Stripe, puis
//   inscrit les droits dans achats/{uid}. Le jeu lit ce document, et aucune règle ne laisse un joueur l'écrire.
// Les deux clés secrètes vivent dans Secret Manager (firebase functions:secrets:set …), jamais dans le dépôt.
// Mise en place pas à pas : docs/paiement.md.

const { onCall, onRequest, HttpsError } = require('firebase-functions/v2/https');
const { defineSecret } = require('firebase-functions/params');
const { initializeApp } = require('firebase-admin/app');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');
const Stripe = require('stripe');
const { PRODUITS, retourPermis, droitsNouveaux } = require('./droits');

initializeApp();
// le Gardien de la ville (13 novembre 2026) : les frappes, rejouées et comptées ici
exports.compterFrappes = require('./gardien').compterFrappes;
const db = getFirestore();

const STRIPE_CLE = defineSecret('STRIPE_CLE');
const STRIPE_WEBHOOK = defineSecret('STRIPE_WEBHOOK');
const REGION = 'europe-west1';

const acquisDe = async (uid) => {
  const snap = await db.doc(`achats/${uid}`).get();
  const d = snap.exists ? snap.data().droits : [];
  return Array.isArray(d) ? d : [];
};

exports.creerPaiement = onCall({ region: REGION, secrets: [STRIPE_CLE], maxInstances: 5 }, async (req) => {
  // un compte relié à Google ou à un e-mail : un compte invisible se perd avec l'appareil, et l'achat avec lui
  if (!req.auth || req.auth.token.firebase?.sign_in_provider === 'anonymous') {
    throw new HttpsError('unauthenticated', 'Relie ta partie à un compte avant d’acheter.');
  }
  const uid = req.auth.uid;
  const produit = String(req.data?.produit ?? '');
  const retour = retourPermis(req.data?.retour);
  if (!Object.prototype.hasOwnProperty.call(PRODUITS, produit) || !retour) throw new HttpsError('invalid-argument', 'Produit ou adresse inconnus.');
  if (!droitsNouveaux(produit, await acquisDe(uid)).length) throw new HttpsError('already-exists', 'Déjà acquis sur ce compte.');

  const p = PRODUITS[produit];
  const stripe = new Stripe(STRIPE_CLE.value());
  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    locale: req.data?.langue === 'en' ? 'en' : 'fr',
    line_items: [{ quantity: 1, price_data: { currency: 'eur', unit_amount: p.prix, product_data: { name: p.nom } } }],
    client_reference_id: uid,
    metadata: { uid, produit },
    customer_email: req.auth.token.email || undefined,
    success_url: `${retour}?achat=ok`,
    cancel_url: `${retour}?achat=annule`,
  });
  return { url: session.url };
});

exports.paiementRecu = onRequest({ region: REGION, secrets: [STRIPE_CLE, STRIPE_WEBHOOK], maxInstances: 5 }, async (req, res) => {
  let evenement;
  try {
    // la signature prouve que le message vient de Stripe : sans elle, n'importe qui pourrait s'offrir un récit
    evenement = new Stripe(STRIPE_CLE.value()).webhooks.constructEvent(req.rawBody, req.headers['stripe-signature'], STRIPE_WEBHOOK.value());
  } catch {
    res.status(400).send('signature refusée');
    return;
  }
  const s = evenement.data.object;
  const paye = (evenement.type === 'checkout.session.completed' || evenement.type === 'checkout.session.async_payment_succeeded') && s.payment_status === 'paid';
  if (!paye) { res.json({ ignore: evenement.type }); return; }
  const uid = s.metadata?.uid;
  const produit = s.metadata?.produit;
  if (!uid || !Object.prototype.hasOwnProperty.call(PRODUITS, produit ?? '')) { res.status(400).send('paiement sans compte ni produit'); return; }
  // le droit et le reçu s'écrivent ensemble ; Stripe peut renvoyer deux fois le même message : le résultat est le même
  const lot = db.batch();
  lot.set(db.doc(`achats/${uid}`), { droits: FieldValue.arrayUnion(...PRODUITS[produit].droits), maj: FieldValue.serverTimestamp() }, { merge: true });
  lot.set(db.doc(`achats/${uid}/recus/${s.id}`), { produit, montant: s.amount_total, devise: s.currency, le: FieldValue.serverTimestamp() });
  await lot.commit();
  res.json({ ok: true });
});
