# EMPREINTES

Jeu de cartes à collectionner et de gestion, science-fiction avec une touche de fantasy.
Version actuelle : **tranche verticale en construction** — le combat est jouable, le district arrive ensuite.

## Lancer le jeu sur ton ordinateur

```bash
npm install      # une seule fois
npm run dev      # ouvre http://localhost:5173
```

Autres commandes :

| Commande | Ce qu'elle fait |
|---|---|
| `npm test` | Lance les tests des règles (Résonance, Écho, combat complet) |
| `npm run check` | Vérifie le TypeScript sans rien construire |
| `npm run build` | Construit le site dans `dist/` |
| `npm run robot` | Lance le robot d'équilibrage (quelques minutes) et écrit `docs/robot-rapport.md` |

Chaque `git push` sur `main` lance les tests, construit le site et le publie sur GitHub Pages.

## Organisation du code

```
src/
  core/          les règles du jeu, sans affichage (pourront tourner sur un serveur)
    types.ts       les types : Porteurs, Gestes, ennemis, état du combat
    donnees.ts     le contenu : Porteurs, deck de départ, ennemis
    regles.ts      les réglages chiffrés (équilibrage) + Résonance, Écho, triangle
    combat.ts      le moteur de combat
    effets.ts      les noms et textes des effets spéciaux (Perçant, Siphon, Accord…)
    robot.ts       le robot d'équilibrage : un joueur automatique qui joue avec le vrai moteur
    expedition.ts  une suite de combats ; c'est ce qui est sauvegardé
    rng.ts         hasard déterministe (même graine = même partie)
  ui/            l'affichage (vue.ts) et le style (styles.css)
  save/          la sauvegarde sur l'appareil
  net/           Firebase : comptes et synchronisation (optionnel)
  main.ts        relie tout : clics, animations, sauvegarde
public/art/      les illustrations Midjourney (Porteurs, Modules, ennemis, bâtiments, décors) ; src/ui/art.ts dit laquelle va où
tests/           les tests automatiques
firestore.rules  qui peut lire et écrire quoi dans la base
```

**La règle d'or :** `src/core` n'utilise jamais le navigateur. Le jour du multijoueur, le serveur
(Cloud Functions) réutilise ces fichiers tels quels pour recalculer les combats et empêcher la triche.
Le jour de Steam ou des stores, on emballe le même build (Electron/Tauri, Capacitor).

## Équilibrer

Tous les chiffres sont dans deux fichiers :
- `src/core/regles.ts` : taille de main, places, bonus de suite, Flux, triangle…
- `src/core/donnees.ts` : force et Fréquence de chaque Geste, PV et attaques des ennemis.

**Les effets.** Les cartes en fer n'ont pas d'effet ; le cuivre en a un, l'argent deux, l'or en a sur tous
ses Gestes. Un effet se déclare dans `donnees.ts` (`{ type: 'percant' }`, `{ type: 'siphon', part: 0.5 }`…),
son texte est dans `effets.ts` et sa règle dans `combat.ts` (l'Accord, qui touche aux suites, est dans `regles.ts`).

**Le robot d'équilibrage.** `npm run robot` (option `-- --parties 300`) joue des milliers d'expéditions avec
un joueur automatique qui essaie toutes les chaînes possibles à chaque tour. Il cherche la Strate où le
deck de départ gagne une fois sur deux, mesure ce que vaut chaque carte (greffée en plus sur le Porteur de
sa lignée), signale celles qui sortent du lot de leur rareté et compare le deck de départ à 3 et à 6 cartes.
Le rapport est écrit dans `docs/robot-rapport.md`. À relancer après chaque changement de chiffre.

## Firebase

Voir [docs/GUIDE.md](docs/GUIDE.md). Tant que `src/net/firebase-config.ts` est vide, le jeu tourne
entièrement hors ligne.
