// Le serveur de paiement d'Ossyra (11 novembre 2026). Deux fonctions, rien de plus :
// - creerPaiement : appelée par le jeu (joueur connecté avec Google ou un e-mail). Elle prépare la page de paiement Stripe
//   pour un produit de functions/produits.json et renvoie son adresse. Le prix vient d'ici, jamais du téléphone du joueur.
// - paiementRecu : appelée par Stripe (webhook) une fois le paiement encaissé. Elle vérifie la signature de Stripe, puis
//   inscrit les droits dans achats/{uid} ; un remboursement complet ou un litige perdu les retire. Le jeu lit ce document, et aucune règle ne laisse un joueur l'écrire.
// Les deux clés secrètes vivent dans Secret Manager (firebase functions:secrets:set …), jamais dans le dépôt.
// Mise en place pas à pas : docs/paiement.md.

const { onCall, onRequest, HttpsError } = require('firebase-functions/v2/https');
const { defineSecret } = require('firebase-functions/params');
const { initializeApp } = require('firebase-admin/app');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');
const Stripe = require('stripe');
const { PRODUITS, retourPermis, droitsNouveaux } = require('./droits');

initializeApp();
// le Gardien de la ville (13 novembre 2026) : le rejeu des frappes (./gardien.js) attend en réserve. Tant que le jeu reste
// sur l'offre gratuite de Firebase, chaque directeur écrit sa fiche lui-même (src/net/gardien.ts, bornée par firestore.rules).
// Pour le brancher : exports.compterFrappes = require('./gardien').compterFrappes; et revoir les règles de gardien/.
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
  // un contenu numérique livré tout de suite : la renonciation expresse au droit de rétractation (case cochée dans le jeu)
  if (req.data?.renonce !== true) throw new HttpsError('failed-precondition', 'La renonciation au droit de rétractation manque.');
  const en = req.data?.langue === 'en';
  const renonciation = en
    ? 'Digital content delivered immediately: you asked for immediate access and waived your 14-day right of withdrawal.'
    : 'Contenu numérique fourni immédiatement : vous avez demandé l’accès immédiat et renoncé à votre droit de rétractation de 14 jours.';

  const p = PRODUITS[produit];
  const stripe = new Stripe(STRIPE_CLE.value());
  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    locale: en ? 'en' : 'fr',
    line_items: [{ quantity: 1, price_data: { currency: 'eur', unit_amount: p.prix, product_data: { name: p.nom } } }],
    client_reference_id: uid,
    metadata: { uid, produit, renonciation: 'oui' },
    // repris sur le paiement lui-même : un remboursement ou un litige (qui ne connaissent que le paiement) retrouvent ainsi le
    // compte ; la description s'imprime sur le reçu envoyé par e-mail, la confirmation écrite de la renonciation
    payment_intent_data: { metadata: { uid, produit, renonciation: 'oui' }, description: `${p.nom}. ${renonciation}` },
    custom_text: { submit: { message: renonciation } },
    customer_email: req.auth.token.email || undefined,
    success_url: `${retour}?achat=ok`,
    cancel_url: `${retour}?achat=annule`,
  });
  return { url: session.url };
});

/** Marque le reçu de ce paiement annulé, puis le compte ne garde que les droits de ses reçus encore valables */
async function annulerAchat(uid, paiement, raison) {
  const recus = await db.collection(`achats/${uid}/recus`).get();
  const lot = db.batch();
  const gardes = new Set();
  for (const r of recus.docs) {
    const d = r.data();
    const ici = d.paiement === paiement;
    if (ici && !d.annule) lot.update(r.ref, { annule: raison, annuleLe: FieldValue.serverTimestamp() });
    if (!ici && !d.annule) for (const x of PRODUITS[d.produit]?.droits ?? []) gardes.add(x);
  }
  lot.set(db.doc(`achats/${uid}`), { droits: [...gardes], maj: FieldValue.serverTimestamp() }, { merge: true });
  await lot.commit();
}

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
  // un remboursement complet, ou un litige perdu (13 novembre 2026) : l'achat est annulé, le droit est retiré
  const annule = (evenement.type === 'charge.refunded' && s.refunded) || (evenement.type === 'charge.dispute.closed' && s.status === 'lost');
  if (evenement.type === 'charge.refunded' || evenement.type === 'charge.dispute.closed') {
    if (!annule || !s.payment_intent) { res.json({ ignore: 'remboursement partiel ou litige gagné' }); return; }
    const pi = typeof s.payment_intent === 'string' ? s.payment_intent : s.payment_intent.id;
    const uid = (await new Stripe(STRIPE_CLE.value()).paymentIntents.retrieve(pi)).metadata?.uid;
    if (!uid) { res.json({ ignore: 'paiement sans compte' }); return; }
    await annulerAchat(uid, pi, evenement.type === 'charge.refunded' ? 'rembourse' : 'litige');
    res.json({ ok: true, annule: true });
    return;
  }
  const paye = (evenement.type === 'checkout.session.completed' || evenement.type === 'checkout.session.async_payment_succeeded') && s.payment_status === 'paid';
  if (!paye) { res.json({ ignore: evenement.type }); return; }
  const uid = s.metadata?.uid;
  const produit = s.metadata?.produit;
  if (!uid || !Object.prototype.hasOwnProperty.call(PRODUITS, produit ?? '')) { res.status(400).send('paiement sans compte ni produit'); return; }
  // le droit et le reçu s'écrivent ensemble ; Stripe peut renvoyer deux fois le même message : le résultat est le même
  const lot = db.batch();
  lot.set(db.doc(`achats/${uid}`), { droits: FieldValue.arrayUnion(...PRODUITS[produit].droits), maj: FieldValue.serverTimestamp() }, { merge: true });
  lot.set(db.doc(`achats/${uid}/recus/${s.id}`), { produit, montant: s.amount_total, devise: s.currency, paiement: s.payment_intent ?? null, renonciation: s.metadata?.renonciation === 'oui', le: FieldValue.serverTimestamp() });
  await lot.commit();
  res.json({ ok: true });
});
