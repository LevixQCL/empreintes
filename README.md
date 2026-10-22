# EMPREINTES

Jeu de cartes à collectionner et de gestion, science-fiction avec une touche de fantasy.
Version actuelle : **tranche verticale** — district, combat, Strates explorées salle par salle, Chroniques.

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
scripts/mer-district.py  prolonge chaque tableau du district par sa mer et son ciel pour l'écran PC (public/art/district/mer-N.webp) : à relancer quand un âge change
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

**Combats à plusieurs** (22 octobre 2026). À partir de la Strate −2, une salle de combat sur trois abrite un groupe
(deux ennemis, trois à partir de la Strate −5 : `escorteDe` dans `expedition.ts`). Chaque ennemi a ses PV (`PART_GROUPE` :
un groupe pèse un peu plus qu'un ennemi seul) et sa propre intention. Le joueur vise un ennemi (`viser`) : toute la chaîne
le frappe, Désarmer et Fissure compris ; s'il tombe, le reste de la chaîne passe au suivant. Au tour ennemi, chacun agit.
Côté moteur, l'ennemi visé est toujours `s.ennemi` (et son intention `s.intention`) ; les autres sont dans `s.autres`,
chacun avec son `intention` : `viser` les échange, le reste du moteur ne change pas. `tousEnnemis(s)` les rend dans l'ordre.

**L'expérience des Porteurs** (22 octobre 2026). Les cartes montent avec les doublons ; les Porteurs montent en combattant
(`XP`, `gagnerXp`, `niveauPorteur` dans `jeu.ts`) : XP par combat gagné, salle scellée et gardien (×1 + 0,25 par Strate),
partagée par toute l'escouade au retour, et XP de mission. Niveau 1 à 20, +4 % des PV de base par niveau (`pvNiveau`).
Un Porteur en retard de deux niveaux sur le plus avancé apprend 1,5 fois plus vite. Les ennemis suivaient d'abord par `FORCE.niveaux`
(+2,5 % par Strate) : descendre reste un défi (réglage du 22 octobre 2026, au parcours simulé : le joueur moyen gagne environ 3 tentatives au front sur 10, un joueur qui calcule tout comme le robot 5 à 8 sur 10 ; la Tour du Noyau et les creuseurs gardent le rythme des jours).

**Varier les combats** (22 octobre 2026).
- *Traits des ennemis* (`traits` dans `ENNEMIS`, règles dans `combat.ts`, textes `texteTrait`) : Blindé, Régénération, Épines,
  Évanescent, Essaim, Vengeur, Furie. Dans la Strate −1, les ennemis jouent sans (`simple`) : on apprend d'abord les bases.
- *Gardiens à deux phases* (`phase`) : sous la moitié de leurs PV, nouveaux gestes et un renfort (`invoquer`).
- *Conditions de salle* (`CONDITIONS`, `conditionDe`) : à partir de −2, une salle de combat sur trois (un gardien sur deux) ;
  visibles sur la carte avant d'entrer.
- *Pas de combat sans fin* (`usureCombat`) : après le tour 10 les ennemis se soignent de moins en moins, après le tour 25 ils frappent plus fort.
Ces mécaniques durcissent les combats d'à peu près ce que l'XP des Porteurs apporte : `FORCE.niveaux` est revenu à 0.

**Pas de Fusion.** Un métal se trouve dans les Strates, les boss, les choix et les garanties ; il ne se fabrique pas et ne
se gagne pas en fusionnant des cartes (décision du 21 octobre 2026).

**Les effets.** Un effet se déclare dans `donnees.ts` (`{ type: 'percant' }`, `{ type: 'siphon', part: 0.5 }`…),
son texte est dans `effets.ts` et sa règle dans `combat.ts` (l'Accord, qui touche aux suites, est dans `regles.ts`).

**Le robot d'équilibrage.** `npm run robot` (option `-- --parties 300`) joue des milliers d'expéditions avec
un joueur automatique qui essaie toutes les chaînes possibles à chaque tour. Il cherche la Strate où le
deck de départ gagne une fois sur deux, mesure ce que vaut chaque carte (à la place de la carte de départ de
sa lignée) et signale celles qui sortent du lot de leur rareté.
Le rapport est écrit dans `docs/robot-rapport.md`. À relancer après chaque changement de chiffre.

**La difficulté des Strates** (22 octobre 2026) : `FORCE` dans `src/core/expedition.ts`, une force par Strate (PV et attaques
des ennemis), puis +4 % par Strate au-delà. Elle est réglée sur le **parcours d'un joueur** (`src/core/parcours.ts`) : une partie
entière jouée par un « joueur moyen » (`jouerTourMoyen` : il lit la force, la suite et l'attaque annoncée, sans calculer la suite
du combat comme le robot), avec le vrai district, ses colis, ses niveaux, ses Épreuves, ses missions et ses fouilles. Objectif :
qu'il faille un peu plus d'expéditions pour chaque nouvelle Strate (environ autant d'expéditions que la profondeur), sans mur.

**Le creusement** (22 octobre 2026) : battre le gardien de la Strate la plus profonde prépare l'étage suivant, qui ne
s'ouvre qu'avec assez de **creuseurs** logés par la **Tour du Noyau** (`CREUSEURS` dans `jeu.ts`). Les creuseurs qui percent
un étage y restent : pas de réserve pour plus tard. On en gagne en jouant (fouilles, missions, Épreuves, gardiens, Confiance).
Il en faut dès la Strate −2 (Bryan, 22 octobre 2026 : ralentir dès le début). Réglé pour un joueur occasionnel : −2 vers le jour 3, −5 vers le jour 7, −7 vers le jour 14, −10 vers le jour 30 ; un assidu atteint −10 vers le jour 23.

**Quand on bloque devant une Strate** : les *fouilles ciblées* (`fouiller`, une descente courte sans gardien dans une Strate
vaincue, vers des cartes d'une lignée, des composants ou des Éclats), les *missions* (`envoyerMission`, un Porteur libre part
2 ou 8 h dans la dernière Strate vaincue) et les *Épreuves de la semaine* (`EPREUVES`, un combat à règle spéciale contre le
gardien de la dernière Strate vaincue, une carte au choix dont une en argent à la première victoire de la semaine).

## Firebase

Voir [docs/GUIDE.md](docs/GUIDE.md). Tant que `src/net/firebase-config.ts` est vide, le jeu tourne
entièrement hors ligne.
