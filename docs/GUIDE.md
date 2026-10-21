# Guide : comment le projet est branché

## Ce qui est en place

| Élément | Où | Réglage |
|---|---|---|
| Code | GitHub `LevixQCL/empreintes` (public) | branche `main` |
| Site | GitHub Pages, publié par GitHub Actions | https://levixqcl.github.io/empreintes/ |
| Projet Firebase | `empreintes-8e82d` (forfait gratuit Spark) | Google Analytics désactivé |
| Comptes | Firebase Authentication | Google + e-mail/mot de passe |
| Domaines autorisés | Authentication › Paramètres | `localhost`, `levixqcl.github.io`, domaines Firebase |
| Base | Cloud Firestore, édition Standard | `europe-west1` (Belgique), mode production |
| Règles | Firestore › Règles | copie de `firestore.rules` |

## Publier une nouvelle version

Pousse sur `main`. GitHub Actions lance les tests, construit et publie. Si un test échoue, rien n'est publié :
la version en ligne reste la précédente. Suivi : onglet **Actions** du dépôt.

## Modifier les règles Firestore

1. Modifie `firestore.rules` dans le dépôt.
2. Copie-colle le fichier dans la console Firebase (Firestore › Règles) et clique **Publier**.

(Plus tard, avec l'outil `firebase` en ligne de commande : `firebase deploy --only firestore:rules`.)

## Ce que fait la synchronisation

- Le jeu sauvegarde toujours sur l'appareil, même sans compte.
- Connecté, il envoie aussi la sauvegarde dans `saves/{ton identifiant}`, 1,5 seconde après la dernière action.
- À la connexion, il garde la plus récente des deux (appareil ou compte).

## Avant le multijoueur : passer au forfait Blaze

Les calculs qui doivent être protégés de la triche (Fusions, drops, combats entre joueurs) iront dans des
Cloud Functions, qui demandent le forfait **Blaze** (paiement à l'usage, avec un quota gratuit inclus).
C'est une étape à faire toi-même, car elle demande un moyen de paiement :

1. Console Firebase › **Mettre à niveau** › Blaze.
2. Tout de suite après : Google Cloud › Facturation › **Budgets et alertes** › un budget de 5 € avec alertes
   à 50 %, 90 % et 100 %.

Pas nécessaire pour la tranche verticale solo.
