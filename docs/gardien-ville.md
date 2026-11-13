# Le Gardien de la ville (13 novembre 2026)

Chaque lundi, un Gardien remonte du réseau des Strates. Tous les directeurs le frappent jusqu'au dimanche ; leurs parts
remplissent une jauge commune, et chaque palier atteint récompense tous ceux qui ont frappé au moins une fois.
Proposition validée : « Ossyra — Le jeu à plusieurs » (Claude Docs).

## Sans serveur, pour commencer (13 novembre 2026, après-midi)

Bryan préfère rester sur l'offre gratuite de Firebase (Spark) tant que le jeu n'a pas pris : sur Spark, aucune facture
n'est possible (un service qui dépasse son quota s'arrête jusqu'au lendemain), alors que Blaze n'a pas de plafond pour
Firestore. Donc, pour l'instant :

- chaque directeur écrit sa fiche `gardien/{semaine}/directeurs/{uid}` (nom public ou null, Strate, parts, frappes,
  plus belle frappe, heure de la dernière frappe) ; `firestore.rules` la borne : une frappe de plus par écriture,
  3 parts au plus par frappe, pas plus de frappes que de jours écoulés dans la semaine + 3, semaine en cours seulement,
  pas d'effacement ;
- la jauge est la somme des fiches (requête d'agrégation : 1 lecture par 1 000 fiches), les PV viennent du nombre de
  fiches de la semaine d'avant ; le classement des dégâts lit les 10 premières fiches et le rang du joueur (≈ 14 lectures
  par rafraîchissement, au plus toutes les 5 minutes) ;
- le classement rend visible tout résultat farfelu ; un tricheur ne dépasse jamais 3 parts par frappe.

Le rejeu des combats (ci-dessous) reste prêt dans le dépôt, mais `compterFrappes` n'est plus exporté par
`functions/index.js`. Le jour où le projet passe en Blaze, on le rebranche et on referme l'écriture des fiches.

**Ce que Bryan doit faire** : recopier `firestore.rules` dans la console Firebase (Firestore → Règles → Publier).

## Le serveur, plus tard (en réserve)

## Où est quoi

| Fichier | Rôle |
|---|---|
| `src/core/partie/gardien.ts` | Les règles : Gardien et règle de la semaine, tentatives (1 par jour, 3 en réserve), combat de 12 tours, parts, paliers, Perle des deux semaines, rejeu d'un combat |
| `src/serveur/gardien.ts` | Ce que fait le serveur : relire la sauvegarde, vérifier le départ, rejouer chaque combat, compter les parts |
| `functions/gardien.js` | La Cloud Function `compterFrappes` : écrit `gardien/{semaine}` (la jauge) et `gardien/{semaine}/directeurs/{uid}` |
| `functions/gardien-core.js` | `src/serveur/gardien.ts` empaqueté (`npm run serveur`, refait aussi avant chaque déploiement) |
| `src/net/gardien.ts`, `src/app/ville.ts` | Le jeu : envoyer les frappes, lire la jauge, recevoir les paliers |
| `src/ui/ville.ts`, `src/ui/ville.css` | La bulle de la Cuvette (téléphone), la carte de droite (PC), la feuille, la ligne de la Tour |
| `scripts/gardien-ville.ts` | Combien de parts fait un joueur moyen selon sa Strate (cible : environ 1 par frappe) |

## Pourquoi le téléphone ne peut pas tricher sur la jauge

Le téléphone n'envoie jamais ses dégâts. Il envoie de quoi rejouer le combat : l'escouade, le deck, la graine et la liste
de ses actions. Le serveur relit sa sauvegarde en ligne, vérifie que chaque carte existe et n'est pas plus forte que
dans la sauvegarde, rejoue le combat avec le moteur du jeu, et compte les parts lui-même. Une frappe envoyée deux fois ne
compte qu'une fois, et jamais plus d'une frappe par jour (plus 3 en réserve). Seul le serveur écrit la jauge.
Limite connue : une sauvegarde entièrement trafiquée reste possible, comme pour tout le jeu.

## Ce que Bryan doit faire, une fois (sur PC)

1. Le projet `empreintes-8e82d` doit être en formule **Blaze** (exigée pour les fonctions serveur ; voir `docs/paiement.md`).
   À l'échelle d'Ossyra, l'usage reste dans la part gratuite (2 millions d'appels par mois).
2. `cd functions && npm install && cd ..` (une fois).
3. Publier la fonction du Gardien et les règles, sans toucher au paiement :
   `firebase deploy --only functions:compterFrappes,firestore:rules`
4. Dire à Claude que c'est fait : il publie alors le jeu (la branche `gardien`).

Tant que la fonction n'est pas publiée, les frappes attendent dans la partie et partent dès qu'elle l'est.
