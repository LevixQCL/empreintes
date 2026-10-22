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
    types.ts       les types : Porteurs, cartes, ennemis, état du combat
    donnees.ts     le contenu : Porteurs, les 45 cartes, deck de départ, ennemis
    regles.ts      les réglages chiffrés (équilibrage) + Résonance, Écho, triangle
    combat.ts      le moteur de combat
    effets.ts      les noms et textes des effets spéciaux (Perçant, Siphon, Accord…)
    robot.ts       le robot d'équilibrage : un joueur automatique qui joue avec le vrai moteur
    expedition.ts  une suite de combats ; c'est ce qui est sauvegardé
    rng.ts         hasard déterministe (même graine = même partie)
  ui/            l'affichage
    coquille.ts    ressources en haut, navigation en bas, menu, notifications (commun au district)
    district.ts    archipel, Tour du Noyau, escouade, cartes, Bibliothèque ; les détails s'ouvrent en feuille par le bas
    vue.ts         l'écran de combat
    icones.ts      le jeu d'icônes de l'interface (SVG, couleur du texte)
    styles.css     le style « laiton et verre fumé » ; scenes.css (titre, intro) ; face-carte.css (cartes Module)
    bureau.css     la mise en page PC (à partir de 1100 px de large) : rail à gauche, tableaux en pleine hauteur ; le téléphone n’en dépend pas
  save/          la sauvegarde sur l'appareil
  net/           Firebase : comptes et synchronisation (optionnel)
  main.ts        relie tout : clics, animations, sauvegarde
public/art/      les illustrations Midjourney (Porteurs, Modules, ennemis, bâtiments, décors, textures des métaux) ; src/ui/art.ts dit laquelle va où
src/ui/carte.ts  la face des cartes Module (métal de la rareté, effets sur l'illustration)
tests/           les tests automatiques
firestore.rules  qui peut lire et écrire quoi dans la base
```

**La règle d'or :** `src/core` n'utilise jamais le navigateur. Le jour du multijoueur, le serveur
(Cloud Functions) réutilise ces fichiers tels quels pour recalculer les combats et empêcher la triche.
Le jour de Steam ou des stores, on emballe le même build (Electron/Tauri, Capacitor).

## Équilibrer

Tous les chiffres sont dans deux fichiers :
- `src/core/regles.ts` : taille de main, places, bonus de suite, Flux, triangle…
- `src/core/donnees.ts` : force, Fréquences et effet de chaque carte, PV et attaques des ennemis.

**La carte qu'on collectionne est celle qu'on joue** (décision du 22 octobre 2026). Une carte = une place dans le deck.
On la confie à un Porteur de sa lignée (`greffer` dans `jeu.ts`, 6 cartes au plus par Porteur, `DISTRICT.cartesMax`) ;
le deck de combat réunit les cartes des 3 Porteurs de l'escouade, plus les 2 cartes du district (`GESTES_SPECIAUX`).
Au départ, Ilka, Doran et Véla portent chacun 6 cartes en fer : leurs 5 cartes de base et leur carte de départ (`DEPART_PORTEURS`).
En combat, le moteur manipule des « Gestes » : c'est le nom interne d'une carte en jeu (`gesteDeCarte`), avec son Porteur,
son niveau et la Fréquence choisie. Le tableau des cartes garde son nom historique `MODULES`.

**Une carte, cinq métaux.** Chaque carte existe en fer, cuivre, argent, or et nacre. Un exemplaire possédé se note
`carte@métal` (`jambes-ressort@or`) ; le métal est fixé quand on le trouve et ne change jamais. La force de `donnees.ts`
est réglée pour le métal d'origine de la carte ; dans un autre métal, `METAL_FORCE` la règle. Le métal ouvre aussi l'effet
(à partir du cuivre, renforcé en or et en nacre : `METAL_RENFORT`) et les Fréquences (1 en fer et en cuivre, 2 en argent
et en or, 3 en nacre : `METAL_FREQ`). Une carte à plusieurs Fréquences prend d'elle-même celle qui prolonge la suite
(`meilleureFrequence`), et le joueur peut en changer dans la chaîne (`accorder`) : aucun tirage au sort.
Deux métaux d'une même carte sont deux cartes à part : chacune ses doublons, son niveau, et un Porteur n'en porte qu'une.

**Pas de Fusion.** Un métal se trouve dans les Strates, les boss, les choix et les garanties ; il ne se fabrique pas et ne
se gagne pas en fusionnant des cartes (décision du 21 octobre 2026).

**Les effets.** Un effet se déclare dans `donnees.ts` (`{ type: 'percant' }`, `{ type: 'siphon', part: 0.5 }`…),
son texte est dans `effets.ts` et sa règle dans `combat.ts` (l'Accord, qui touche aux suites, est dans `regles.ts`).

**Le robot d'équilibrage.** `npm run robot` (option `-- --parties 300`) joue des milliers d'expéditions avec
un joueur automatique qui essaie toutes les chaînes possibles à chaque tour. Il cherche la Strate où le
deck de départ gagne une fois sur deux, mesure ce que vaut chaque carte (à la place de la carte de départ de
sa lignée) et signale celles qui sortent du lot de leur rareté.
Le rapport est écrit dans `docs/robot-rapport.md`. À relancer après chaque changement de chiffre.

## Firebase

Voir [docs/GUIDE.md](docs/GUIDE.md). Tant que `src/net/firebase-config.ts` est vide, le jeu tourne
entièrement hors ligne.
