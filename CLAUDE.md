# OSSYRA (anciennement EMPREINTES) — consignes pour Claude

Jeu de cartes à collectionner + gestion, SF/fantasy, web mobile d'abord (Vite + TypeScript + Vitest, Firebase).
Tout est en français : code, commentaires, textes du jeu, messages de commit. Lire le README avant de coder.
- Traduction (docs/traduction/README.md) : tout nouveau texte affiché au joueur s'écrit en français entouré de `t(…)` / `t\`…\``
  (src/core/i18n.ts), jamais autour du HTML ; après un changement de texte, lancer `npm run i18n` (les tests l'exigent).

## Règles du code
- `src/core` n'utilise jamais le navigateur (il tournera sur un serveur). L'affichage est dans `src/ui`, l'application (état, actions, rendu) dans `src/app`, le démarrage dans `src/main.ts`.
- Tous les chiffres d'équilibrage sont dans `src/core/regles.ts`, `donnees.ts`, `collection.ts` et `jeu.ts` (rangé par thème dans `partie/`) : les tests et le robot (`npm run robot`) s'en servent.
- Avant chaque push : `npx tsc --noEmit -p .` et `npm test` doivent passer, et `npm run visuel` ne doit montrer que les changements voulus (le déploiement GitHub Pages lance les tests ; s'ils échouent, rien n'est publié).
- Pousser sur `main` publie le jeu (https://levixqcl.github.io/empreintes/). Commits courts, en français, qui disent ce qui change pour le joueur.
- Sauvegardes : en changeant `VERSION_JEU`, ajouter la migration dans `partie/nouvelle.ts` ; `estJeuValide` doit accepter toutes les versions de 2 à `VERSION_JEU` (tests/garde-sauvegarde.test.ts le vérifie). Une partie présente mais illisible n'est jamais écrasée : le jeu s'arrête et prévient (`stockeeIllisible`, `illisible` du compte).
- Toute modification de `firestore.rules` doit être recopiée et publiée dans la console Firebase (projet `empreintes-8e82d`) : demander à Bryan avant de publier.
- Vérifier visuellement à la taille d'un téléphone (≈ 360 à 412 px de large) avec Playwright, puis sur PC (≥ 1100 px).

## Règles fixes du jeu (décidées par Bryan)
- Aucun hasard payant, aucune punition si on ne joue pas. Aucun pay-to-win entre joueurs : ce qui se vend (Récits des origines,
  11 novembre 2026) peut aider en PVE, jamais en duel ni au défi d'un quai (`sansBonusOrigine`). Sinon, du cosmétique vendu en euros.
- Rien de gore ni de religieux, aucun pays, personne ou conflit réel ; aucun nom ou visuel copié d'un autre jeu.
- Images : Bryan les génère sur Midjourney (Claude ne l'utilise jamais) ; Claude écrit les prompts complets avec le préfixe
  « bold graphic fantasy illustration, clean confident ink outlines, cel shading with painted textures, vibrant warm palette,
  stylized expressive proportions, simplified features, collectible card art. » et le --sref du Manifeste des prompts.
- Interface : matière « cristal et lumière », verre fumé, arêtes de glace, or pour la valeur ; tout doit être beau, cohérent
  avec l'existant et « fini » (pas de brouillon), lisible sur téléphone (textes ≥ 12 px, rien de caché au bout d'un défilement).

## Façon de travailler avec Bryan
- Il teste sur son téléphone et envoie des captures : corriger, vérifier en capture, pousser, puis expliquer simplement ce qui change pour le joueur.
- Avant un changement d'équilibrage, donner les chiffres (avant / après) ; relancer le robot pour les gros changements.
- Il regarde ses tokens : aller droit au but, une question à la fois quand il faut choisir.
