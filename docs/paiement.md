# Vendre les Récits des origines (mis en place le 11 novembre 2026)

Le jeu web vend les trois Récits (Ilka, Doran, Véla) à l'unité (2,99 €) ou ensemble (5,99 €), par carte bancaire, avec Stripe.
**Tant que `VENTE_OUVERTE` est faux dans `src/net/vente.ts`, rien ne change pour les joueurs** : les récits restent en aperçu.

## Comment ça marche

1. Sur la fiche du Porteur, « Débloquer son récit » déplie l'offre. Il faut un compte relié à Google ou à un e-mail
   (un compte invisible se perd avec l'appareil, et l'achat avec lui). Les moins de 13 ans n'achètent pas.
2. Le jeu appelle la fonction serveur `creerPaiement` (`functions/index.js`). Elle fixe le prix (`functions/produits.json`),
   prépare la page de paiement Stripe et renvoie son adresse. Le joueur paie chez Stripe, puis revient au jeu (`?achat=ok`).
3. Stripe prévient la fonction `paiementRecu` (webhook). Elle vérifie la signature de Stripe et inscrit le droit dans
   `achats/{uid}` (Firestore), avec un reçu dans `achats/{uid}/recus`.
4. Le jeu lit `achats/{uid}` à chaque connexion (`src/app/boutique.ts`) : le récit s'ouvre, sur tous les appareils du compte.
   Aucune règle Firestore ne laisse un joueur écrire ce document (`tests/produits.test.ts` le vérifie).

Les prix sont à deux endroits qui doivent dire la même chose (un test le vérifie) : `src/core/produits.ts` (ce que le jeu
affiche) et `functions/produits.json` (ce que le serveur fait payer).

## Ce que Bryan doit faire, une fois (sur PC)

1. **Stripe** : créer un compte sur stripe.com et l'activer (identité, compte bancaire, statut). Rester en « mode test » pour commencer.
2. **Firebase** : passer le projet `empreintes-8e82d` à la formule Blaze (paiement à l'usage, exigée pour les fonctions serveur).
3. Dans le dossier du jeu : `npm install -g firebase-tools`, `firebase login`, puis `cd functions && npm install && cd ..`.
4. Les deux clés secrètes (jamais dans le dépôt) :
   - `firebase functions:secrets:set STRIPE_CLE` → la clé secrète de Stripe (`sk_test_…`, puis `sk_live_…` le jour de l'ouverture) ;
   - `firebase functions:secrets:set STRIPE_WEBHOOK` → mettre une valeur provisoire, remplacée à l'étape 6.
5. `firebase deploy --only functions,firestore:rules` (publie aussi la règle `achats` de `firestore.rules`).
   La console affiche l'adresse de `paiementRecu`.
6. Dans Stripe › Développeurs › Webhooks : ajouter cette adresse, avec les événements `checkout.session.completed` et
   `checkout.session.async_payment_succeeded`. Copier le « secret de signature » (`whsec_…`) dans `STRIPE_WEBHOOK`
   (même commande qu'à l'étape 4), puis redéployer les fonctions.
7. **Essai** : mettre `VENTE_OUVERTE = true`, pousser, acheter un récit avec la carte de test de Stripe (4242 4242 4242 4242).
   Le récit doit s'ouvrir au retour. Puis passer Stripe en mode réel (clé `sk_live_…`, nouveau webhook réel).

## Essayer sans payer (en développement)

`npm run dev`, puis ouvrir le jeu avec `?vente` (vente ouverte, rien d'acquis) ou `?vente=ilka,doran` (ces récits acquis).
Ce raccourci n'existe pas sur le jeu publié.

## Ce qui reste à faire

- **Les textes des récits sont encore dans le jeu public** (`src/ui/recits.ts`) : quelqu'un qui fouille le code peut les lire.
  Le verrou arrête le joueur normal ; pour un vrai secret, il faudra envoyer les textes depuis le serveur après achat.
- **Remboursements** : un paiement remboursé dans Stripe ne retire pas encore le droit (à faire à la main dans Firestore).
- **Suppression du compte** : les reçus restent (obligation comptable) ; le joueur ne peut pas les effacer lui-même.
- **Juridique** : conditions de vente, mention sur le droit de rétractation (texte provisoire sur la fiche), TVA, statut.
- **Pack Ossyra** (Strates −11 à −15) : pas encore de produit.
