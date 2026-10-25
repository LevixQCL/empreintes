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
| `npm run visuel` | Compare les écrans avant / après une modification (téléphone et PC) : voir `.visuel/` |
| `npm run css` | Repère le CSS inutile (déclarations toujours écrasées, règles en double) ; `-- --ecrire` le nettoie |
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
    jeu.ts         le point d'entrée de la partie ; le code est rangé par thème dans partie/ :
      (en couches : chaque fichier n'utilise que ceux d'au-dessus ; tests/couches.test.ts le vérifie)
      partie/etat.ts         réglages du district, types, expérience et Marques, Confiance, creuseurs, escouade
      partie/objectifs.ts    les objectifs guidés
      partie/district.ts     chantiers, Forge, postes, cartes confiées, creuseurs, entraînement, Comptoir, quotidiens
      partie/recompenses.ts  kit des recrues, lectures et Ravitaillement, nouveautés
      partie/descentes.ts    départs (expédition, fouille, Épreuve), escouade, missions, exploration des Strates
      partie/temps.ts        le temps qui passe
      partie/nouvelle.ts     nouvelle partie, décisions de la campagne, mise à jour des anciennes sauvegardes
    expedition.ts  une suite de combats ; c'est ce qui est sauvegardé
    rng.ts         hasard déterministe (même graine = même partie)
  ui/            l'affichage
    coquille.ts    ressources en haut, navigation en bas, menu, notifications (commun au district)
    district.ts    archipel, Tour du Noyau, escouade, cartes, Bibliothèque ; les détails s'ouvrent en feuille par le bas
    vue.ts         l'écran de combat
    icones.ts      le jeu d'icônes de l'interface (SVG, couleur du texte)
    feuilles.ts    l'ordre des feuilles de style (la cascade) : toutes les feuilles CSS sont importées là, et seulement là
    outils.ts      petits outils partagés (échapper un texte, animations réduites, virgule française)
    styles.css     le style « laiton et verre fumé » ; scenes.css (titre, intro) ; face-carte.css (cartes Module)
    bureau.css     la mise en page PC (à partir de 1100 px de large) : rail à gauche, tableaux en pleine hauteur ; le téléphone n’en dépend pas
  save/          la sauvegarde sur l'appareil
  net/           Firebase : comptes et synchronisation (optionnel)
  app/           l'application : relie les règles (core) et l'affichage (ui)
    etat.ts        l'état partagé : la partie en cours (app.jeu), l'écran affiché, l'état du district, du combat, du Grand Tableau
    rendu.ts       redessine l'écran courant
    actions/       ce que fait chaque bouton [data-action], rangé par thème (intro, district, combat, tableau, compte)
    combat.ts      l'animation des coups et la fenêtre de fin de combat
    horloge.ts     le temps qui passe (chaque seconde)
    synchro.ts     la sauvegarde sur l'appareil et sur le compte, la partie de secours
    tableau.ts     le Grand Tableau en ligne
    clavier.ts, intro.ts
  main.ts        le démarrage et les gestes du joueur
public/art/      les illustrations Midjourney (Porteurs, Modules, ennemis, bâtiments, décors, scènes des salles, icônes, textures des métaux) ; src/ui/art.ts dit laquelle va où
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

**Mon escouade** (décision du 23 octobre 2026). L'escouade est enregistrée dans la partie (`j.escouade`, Ilka, Doran et Véla au départ).
L'onglet Porteurs s'ouvre sur elle (`monEscouade` dans `porteurs.ts`) : on touche « Changer » sous un Porteur pour le remplacer
(`placerDansEscouade`), et « Tous les Porteurs » ouvre la liste complète. Elle ne change qu'au district, jamais pendant une descente
(`escouadeVerrouillee`). L'écran de départ part de cette escouade (`escouadePourDepart`) et la complète si l'un d'eux est au travail ou en mission.

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
- *Premières rencontres* (`src/core/decouvertes.ts`) : la première fois qu'un groupe, un trait, une condition ou une phase de gardien
  apparaît, une fenêtre l'explique avec un conseil (une par tour au plus ; ce qui est vu est gardé dans `Jeu.decouvertes`).
Ces mécaniques durcissent les combats d'à peu près ce que l'XP des Porteurs apporte : `FORCE.niveaux` est revenu à 0.

**Ce que rapporte un niveau de bâtiment** (22 octobre 2026). Au pied de la feuille d'un bâtiment, au-dessus du coût,
la liste « Niveau N · ce que ça change » : les chiffres qui montent (avant → après) et ce qui se débloque. Elle vient de
`gainsAmelioration` dans `jeu.ts`, qui applique les vraies règles à une copie du district (Porteur posté et Confiance compris) :
un changement d'équilibrage s'y reporte tout seul. L'apparence (nouvel âge du district, nouveau bâtiment) est ajoutée par `district.ts`.

**Pas de Fusion.** Un métal se trouve dans les Strates, les boss, les choix et les garanties ; il ne se fabrique pas et ne
se gagne pas en fusionnant des cartes (décision du 21 octobre 2026).

**Les effets.** Un effet se déclare dans `donnees.ts` (`{ type: 'percant' }`, `{ type: 'siphon', part: 0.5 }`…),
son texte est dans `effets.ts` et sa règle dans `combat.ts` (l'Accord, qui touche aux suites, est dans `regles.ts`).

**Le mode d'emploi des cartes** (22 octobre 2026, `src/ui/guide.ts` et `guide.css`). Une feuille à trois onglets :
construire son deck (schéma, trois gestes, règles, conseils), lire une carte (la vraie carte annotée, actions, métaux, lignées)
et les effets (règle, astuce, cartes trouvées qui le portent ; les cartes pas encore trouvées restent comptées « à trouver »).
On l'ouvre depuis l'écran Cartes, le « ? » de la feuille d'un Porteur ou d'une carte, l'escouade et l'aide du combat.
Les chiffres sont lus dans les données : un changement d'équilibrage s'y reporte tout seul. Les textes d'effets sont dans `effets.ts`.

**L'onglet Porteurs et les Marques de tous** (22 octobre 2026, `src/ui/porteurs.ts`, `porteurs.css`, `src/core/lore-porteurs.ts`).
Un onglet entre Tour et Cartes : tous les Porteurs par lignée (ceux pas encore arrivés en silhouette, avec leur condition d'arrivée)
et la fiche de chacun (présentation et réplique de la Bible, PV, niveau, Usure, Marque, ce que donne sa lignée, poste, cartes).
Chaque Porteur a maintenant sa Marque (`MARQUES` dans `jeu.ts`, avec son bonus de combat dans `BonusMarques`) :
Sasha *Seconde chance* (salles scellées), Nuit *Œil de nuit* (combats sous −3), Aurel *Ombre courtoise* (gardiens),
Coursier *Foulée* (combats), Docker *Bras de quai* (missions), Guetteur *Guet* (empreintes anciennes).
L'escouade affiche les Marques des trois Porteurs choisis. Le parcours simulé ne change pas : le joueur moyen emmène toujours Ilka, Doran et Véla.

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

**Devenir plus fort sans descendre** (23 octobre 2026). Deux voies au district, réglées dans `jeu.ts` :
- **Le Comptoir** (`COMPTOIR`, `acheter`) : le « acheter » de « forger, acheter ou combattre ». Il se construit sur le pilier
  qui attendait le Labo génétique (niveau 0 au départ). Chaque jour, 3 à 6 cartes à prix fixe selon son niveau, une fois chacune :
  on voit la carte avant de payer, aucun hasard payé. Fer et cuivre, de l'argent après la Strate −4, jamais d'or ni de nacre.
  Une offre sur deux est un doublon d'une carte possédée. Il a son propre hasard (`comptoir.rng`) : il ne touche pas aux trouvailles.
- **L'entraînement à la Tour** (`ENTRAINEMENT`) : un Porteur posté à la Tour du Noyau gagne de l'XP avec le temps (3 à 8 XP/h),
  jusqu'à 4 niveaux par niveau de la Tour. Il ne descend pas pendant ce temps.
Le robot de parcours s'en sert aussi : la Strate −10 arrive vers le jour 29-30 (occasionnel), 23 (assidu), comme avant :
ce sont les creuseurs et la Tour qui tiennent le rythme. Les images `public/art/batiments/comptoir-N.webp` sont provisoires
(le plateau vide du tableau) en attendant celles de Midjourney.

**Lignées et origines** (23 octobre 2026, Bible « Devenir Résonant, Géné ou Augmenté » et « D'où viennent leurs dons »).
- *Son histoire* (`ORIGINES` dans `src/core/lore-porteurs.ts`) : dans la fiche de chaque Porteur, d'où vient son don, en paliers qui s'ouvrent avec son niveau.
- *Les fils* (`src/core/fils.ts`, appliqués par `avancerFils` dans `jeu.ts` à chaque tick) : la dette de Pim (Ilka), la porte de son père (Doran),
  retrouver Liane (Aurel). Trois étapes chacun, qui avancent toutes seules (niveau, arrivée, Strate, fragment, bâtiment) et rapportent de l'XP.
- *Trois nouveaux Porteurs* : Kessa, Née-de-mue (Strate −4), Liane Orsève, la Refusée devenue Délavée (Strate −6), et Joss, trouvé par
  un *Accord ouvert* de la Clinique (`ACCORD_OUVERT` : Clinique niveau 3 et Confiance 70). Portraits Midjourney du 23 octobre.
- *Le rang des métaux* (`RANG_METAL` dans `lore-cartes.ts`) : la fiche d'une carte dit si c'est une copie lointaine (fer) ou une vierge (nacre).
- *Le Sauvage* (ennemi des Fondations), les rencontres *Sauvage* et *vendeur de pierres mortes*,
  la *rumeur du jour* sous la Confiance (`src/core/rumeurs.ts`), deux chapitres des Chroniques (« Les yeux d'or », « Le Registre des Vierges »)
  et deux fragments d'archives (« Non prioritaire », « Pas de notre côté »).

**Le Grand Tableau** (23 octobre 2026, `src/core/classements.ts`, `src/ui/classements.ts`, `src/net/classement.ts`).
Les classements entre directeurs, sur les « écrans des marchés de Vertiga ». On y entre par le menu Plus, le bandeau de la
Tour du Noyau (ton rang en profondeur) et la fiche de la Strate en haut de l'écran. Quatre tableaux :
- *Profondeur* : la Strate la plus profonde (`profondeurDe` : 2 par Strate, +1 quand son gardien est vaincu) ; à égalité, le premier arrivé.
- *Registre* : la valeur de la collection (`VALEUR_METAL` fer 10 → nacre 400, +10 % par niveau monté, +20 par carte découverte) : découvrir compte plus que répéter.
- *Joutes* (combats entre joueurs) et *La Flèche* (tour d'arène vers les Hauts, `FLECHE`) : grisés, avec ce qui arrive.
Deux périodes : le record (ne redescend jamais) et la semaine (ce qui est gagné depuis lundi). Le palmarès est noté à chaque tick
dans `j.palmares` ; connecté, le joueur choisit un nom de directeur (`j.directeur`, jamais l'e-mail) et publie `classement/{uid}`
au plus toutes les 25 s. Entre amis, toute la liste ; au-delà de 12, le podium et les voisins du joueur (`fenetre`).
Les règles Firestore valident chaque entrée (champs, bornes, profondeur qui ne redescend pas et monte de 2 Strates au plus,
date d'arrivée = maintenant quand la profondeur monte). Les pseudos sont uniques : chacun est réservé dans `pseudos/{clé}` (`reserver` dans `src/net/classement.ts`, une transaction), la clé ignore majuscules, accents et séparateurs (`clePseudo`, même table que les règles), le Tableau n'accepte que le pseudo réservé par ce compte, un filtre écarte grossièretés et faux noms officiels (`pseudoInterdit`), et on en change au plus une fois par semaine (`DELAI_PSEUDO`, vérifié dans le jeu). En développement : `__tableau(entrées, uid)` dans la console pour l'essayer sans compte.

## Firebase

Voir [docs/GUIDE.md](docs/GUIDE.md). Tant que `src/net/firebase-config.ts` est vide, le jeu tourne
entièrement hors ligne.
