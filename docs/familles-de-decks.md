# Familles de decks : proposition (26 octobre 2026)

**Étape 1 codée le 27 octobre 2026** (Moteur, Carapace, Chœur) : ses chiffres ci-dessous sont ceux du jeu, réglés au robot
(`npm run voies`, rapport dans `docs/voies-rapport.md`). Le reste est encore une proposition, avec des chiffres de départ.

## 1. Ce qui marche déjà

- **L'échelle des Fréquences 1 à 9, partagée entre les lignées** (Génés 1-5, Augmentés 2-7, Résonants 6-9). Pour faire une longue
  suite, il faut mélanger les lignées : l'escouade de trois est un vrai choix. C'est la meilleure idée du combat, il faut la garder.
- **L'état du combat se lit d'un coup d'œil** : bouclier d'escouade, Flux, Fissure, Fêlure, intention de l'ennemi.
- **Les traits des ennemis demandent des réponses différentes** (Blindé → Perçant, Évanescent → suites, Dissonance → Véla…).
- **Aucun tirage** : les cartes à plusieurs Fréquences se choisissent, la Charge oblige à composer.

## 2. Ce qui manque

1. **Il n'y a qu'une seule bonne stratégie : faire des suites.** La Résonance multiplie *tout* (×1,3 à ×2). Les deux cartes
   signalées « TROP FORTE » par le robot servent les suites : Chant des abysses (Accord) et Plume de givre. Une carte en or vaut
   +23 points en moyenne, une carte en argent +10 : on progresse avec le métal, pas avec les choix.
2. **Des effets sans récompense.** Rempart est sur 5 cartes, mais rien ne profite du bouclier gardé (robot : de −5 à +5).
   Un soin ne sert à rien quand l'escouade a tous ses PV. L'Écho (trois Fréquences identiques) ne rapporte que 8 de bouclier.
3. **Les combos qui demandent plusieurs cartes précises dans la même chaîne sortent rarement.** Avec un deck de 20 cartes et une
   main de 5, les 6 cartes d'un Porteur donnent :
   - au moins 2 de ses cartes en main : **48 %** des tours ;
   - au moins 3 de ses cartes : **13 %** des tours.

   → Règle de conception : **une synergie passe par l'état du combat** (bouclier, Flux, Fissure, Fêlure, PV), qui dure d'une
   carte à l'autre et d'un tour à l'autre. Elle ne doit pas exiger trois cartes précises dans la même main.
4. **Les Porteurs se ressemblent** : seuls leurs PV et leur Marque les distinguent.

## 3. L'idée : neuf voies, une par Porteur nommé

Chaque Porteur nommé **incarne une voie** : une façon de gagner, avec ses cartes, sa récompense et sa faiblesse.
Les cartes restent liées à la lignée (n'importe quel Porteur de la lignée peut les porter). Le Porteur fait découvrir la voie
et sa Marque la sert déjà.

| Lignée | Porteur | Voie | Plan de jeu | Marque actuelle qui la sert |
|---|---|---|---|---|
| Augmentés | **Ilka** (départ) | **La Cadence** | chaînes de 4-5 cartes, coups doublés | +1 place au premier tour |
| Augmentés | **Sasha** (Forge 2) | **Les Machines** | cartes lourdes rendues légères, Perçant | relève le premier qui tombe |
| Augmentés | **Liane** (Strate −6) | **Le Moteur** | remplir le Flux, tout vider d'un coup | 1 Flux au départ |
| Génés | **Doran** (départ) | **La Carapace** | accumuler le bouclier, frapper avec | 8 de bouclier au départ |
| Génés | **Nuit** (Strate −3) | **La Traque** | fissurer, puis achever | l'ennemi commence fissuré |
| Génés | **Kessa** (Strate −4) | **La Sève** | soigner en continu, le surplus devient bouclier | garde 20 % du bouclier |
| Résonants | **Véla** (départ) | **L'Harmonie** | les suites (ce qui existe aujourd'hui) | insensible à la Dissonance |
| Résonants | **Aurel** (Strate −5) | **La Lecture** | briser la Fêlure à coup sûr, contrôler | 1re attaque ennemie −40 % |
| Résonants | **Joss** (Accord ouvert) | **Le Chœur** | répéter une même Fréquence (Écho) | +1 carte au premier tour |

**Pourquoi c'est cohérent :**
- **La prise en main se fait toute seule.** Au départ, trois voies simples (Cadence, Carapace, Harmonie). Ensuite, une voie
  de plus à chaque arrivée de Porteur, dans l'ordre de l'histoire. Les voies les plus subtiles (Lecture, Moteur, Chœur) arrivent
  quand le joueur maîtrise les bases.
- **Le kit d'arrivée.** Chaque Porteur qui arrive apporte 2 cartes de sa voie en cuivre, avec une fenêtre « Première rencontre »
  qui explique le plan de jeu. Ça règle un vrai problème : en fer, une carte n'a pas d'effet. Sans kit, il faudrait des jours
  pour voir une voie fonctionner.
- **On garde la règle des métaux** (effet à partir du cuivre). Les nouvelles cartes ont une force correcte en fer, pour ne
  jamais être inutiles.

## 4. Dix nouveaux effets, une phrase chacun

On garde la règle actuelle : une carte = un seul effet. L'Harmonie n'en reçoit aucun, car les suites dominent déjà.

| Effet | Voie | Texte joueur |
|---|---|---|
| **Rafale** | Cadence | Frappe deux fois si la chaîne compte au moins 4 cartes. |
| **Servo** | Machines | La prochaine carte lourde de la chaîne ne prend qu'une place. |
| **Décharge** (X %) | Moteur | Vide le Flux : +X % de force par Flux vidé (pas renforcée en or et en nacre). |
| **Riposte** (X %) | Carapace | Sur une carte de bouclier : après son bouclier, frappe de X % du bouclier d'escouade. |
| **Curée** (X %) | Traque | +X % de force si l'ennemi visé est fissuré. |
| **Débord** | Sève | Soigne toute l'escouade ; le soin en trop devient du bouclier d'escouade. |
| **Lecture** | Lecture | Brise la Fêlure de l'ennemi visé, quelle que soit sa Fréquence (même cachée). |
| **Faille** (X %) | Lecture | +X % de force si la Fêlure de l'ennemi visé est brisée. |
| **Diapason** | Chœur | Fréquence libre : prend celle de la carte posée juste avant (le pendant de l'Accord). |
| **Unisson** (X %) | Chœur | +X % de force pour chaque autre carte de la même Fréquence dans la chaîne. |

Chacun s'appuie sur un état qui existe déjà : le bouclier pour Riposte, le Flux pour Décharge, la Fissure pour Curée, la Fêlure
pour Lecture et Faille, les places pour Rafale et Servo. Les métaux or et nacre renforcent les pourcentages comme aujourd'hui.

## 5. Les cartes (38 nouvelles, plus 1 ou 2 pour l’Harmonie : de 45 à environ 84)

Force dans le métal d'origine, comme dans `donnees.ts`. Les Fréquences vont de la principale à la plus rare, dans la plage de
la lignée. Les cartes existantes qui servent déjà une voie sont rappelées en italique.

### Augmentés

**La Cadence (Ilka)** — *déjà là : Bond, Esquive, Jambes à ressort, Grappin à câble, Dorsale renforcée (Élan)*

| Carte | Métal | Action | Force | Fréq. | Effet |
|---|---|---|---|---|---|
| Pas chassé | fer | attaque | 9 | 3 · 2 · 4 | Élan |
| Lames jumelles | fer | attaque | 8 | 4 · 5 · 3 | Rafale |
| Poings-pistons | cuivre | attaque | 9 | 5 · 4 · 6 | Rafale |
| Mitraille de clous | argent | attaque | 12 | 6 · 5 · 7 | Rafale |
| Cadence folle | or | attaque | 13 | 3 · 4 · 5 | Rafale |

**Les Machines (Sasha)** — *déjà là : Bras-grue, Souffle (lourdes) ; Ruée, Tir, Œil-relais (Perçant)*

| Carte | Métal | Action | Force | Fréq. | Effet |
|---|---|---|---|---|---|
| Servo-bras | fer | bouclier | 8 | 4 · 5 · 3 | Servo |
| Marteau-piston | fer | attaque | 22 (lourde) | 5 · 6 · 4 | Perçant |
| Vérin hydraulique | cuivre | bouclier | 12 | 3 · 4 · 2 | Servo |
| Exo de chantier | argent | bouclier | 32 (lourde) | 2 · 3 · 4 | Élan |
| Foreuse des Strates | or | attaque | 40 (lourde) | 6 · 7 · 5 | Perçant |

**Le Moteur (Liane)** — *déjà là : Tir vif, Gant à arc, Cœur-turbine (Surcharge) ; le robot conseille d'y ajouter une carte Élan (Dorsale renforcée) : Flux et places vont ensemble*

| Carte | Métal | Action | Force | Fréq. | Effet |
|---|---|---|---|---|---|
| Bobine de récupération | fer | bouclier | 9 | 3 · 2 · 4 | Surcharge +1 |
| Condensateur | cuivre | attaque | 12 | 5 · 4 · 6 | Surcharge +1 |
| Décharge d'arc | cuivre | attaque | 14 | 6 · 7 · 5 | Décharge 50 % |
| Éclair captif | argent | attaque | 18 | 4 · 5 · 7 | Décharge 55 % |
| Noyau instable | or | attaque | 38 (lourde) | 7 · 6 · 2 | Décharge 65 % |

### Génés

**La Carapace (Doran)** — *déjà là : Carapace, Cuir de récif, Poumons d'abysse, Branchies, Carapace-mère (Rempart)*

| Carte | Métal | Action | Force | Fréq. | Effet |
|---|---|---|---|---|---|
| Coup d'épaule | fer | bouclier | 10 | 3 · 2 · 4 | Riposte 50 % |
| Queue-massue | cuivre | bouclier | 11 | 4 · 5 · 3 | Riposte 60 % |
| Bélier d'os | argent | bouclier | 22 (lourde) | 5 · 4 · 1 | Riposte 100 % |
| Retour de marée | or | bouclier | 18 | 2 · 3 · 5 | Riposte 80 % |

**La Traque (Nuit)** — *déjà là : Yeux nocturnes, Charge (Fissure) ; Morsure, Crocs fossiles, Cœur de meute (Siphon)*

| Carte | Métal | Action | Force | Fréq. | Effet |
|---|---|---|---|---|---|
| Flair | fer | bouclier | 8 | 2 · 3 · 1 | Fissure 25 % |
| Bond du prédateur | fer | attaque | 10 | 4 · 3 · 5 | Curée 40 % |
| Crocs de verre | cuivre | attaque | 11 | 3 · 4 · 2 | Curée 40 % |
| Chasse à l'aveugle | argent | attaque | 16 | 5 · 4 · 2 | Curée 50 % |
| Hallali | or | attaque | 18 | 4 · 5 · 1 | Curée 60 % |

**La Sève (Kessa)** — *déjà là : Régénérer, Glande d'ambre, Sang d'ambre, Mue totale (Vague)*

| Carte | Métal | Action | Force | Fréq. | Effet |
|---|---|---|---|---|---|
| Pollen d'ambre | fer | soin | 6 | 2 · 1 · 3 | Débord |
| Sève des piliers | cuivre | soin | 7 | 4 · 3 · 5 | Débord |
| Mue de verre | argent | soin | 10 | 3 · 4 · 1 | Débord |
| Floraison des Fondations | or | soin | 13 | 5 · 4 · 2 | Débord |

### Résonants

**L'Harmonie (Véla)** — *déjà là : Écho, Chant des abysses (Accord) ; Éclat, Éclat qui chante, Souffle du wyrm (Crescendo)*

Pas de nouvel effet. À la place, je propose de **revoir Chant des abysses** (signalé « TROP FORTE ») : force 26 → 22, à
confirmer au robot. Une ou deux cartes au plus, seulement pour combler des Fréquences vides.

**La Lecture (Aurel)** — *déjà là : Murmure, Miroir de brume, Mèche d'or, Plume de givre, Pressentiment (Désarmer)*

| Carte | Métal | Action | Force | Fréq. | Effet |
|---|---|---|---|---|---|
| Regard en biais | fer | bouclier | 9 | 6 · 7 · 5 | Lecture |
| Lame de doute | fer | attaque | 11 | 7 · 8 · 6 | Faille 40 % |
| Lire l'empreinte | cuivre | attaque | 10 | 8 · 7 · 9 | Lecture |
| Verdict | argent | attaque | 17 | 6 · 8 · 7 | Faille 50 % |
| Sentence muette | or | attaque | 20 | 8 · 6 · 9 | Faille 60 % |

**Le Chœur (Joss)** — *déjà là : les nombreuses cartes Résonantes en 9 (Écho, Plume de givre, Ombre de serpent, Ombre ailée, Souffle du wyrm)*

| Carte | Métal | Action | Force | Fréq. | Effet |
|---|---|---|---|---|---|
| Diapason de cristal | fer | bouclier | 9 | 9 · 8 · 7 | Diapason |
| Voix basse | fer | attaque | 9 | 9 · 8 · 7 | Unisson 120 % |
| Chorale des ombres | cuivre | attaque | 10 | 8 · 9 · 7 | Unisson 130 % |
| Cloche des abysses | argent | bouclier | 15 | 9 · 7 · 8 | Diapason |
| Grand unisson | or | attaque | 18 | 9 · 8 · 6 | Unisson 140 % |

Exemple de tour : Voix basse (9) + Diapason de cristal (prend 9) + Plume de givre (9). La Voix basse gagne +240 %, l'Écho
donne du bouclier et 1 Flux, et la Dissonance n'y peut rien (elle ne brouille que les suites).

## 6. Chaque voie a sa faiblesse : les trois escouades prennent leur sens

Le jeu permet déjà de composer trois escouades. Avec les voies, chacune aura une raison d'exister : on choisit selon la
Strate et le gardien.

| Voie | Brille contre | Souffre contre |
|---|---|---|
| Cadence | groupes, Essaim (la chaîne passe au suivant) | Blindé (chaque coup perd des points), Épines |
| Machines | Blindé et boucliers (Perçant), Dissonance (ne compte pas sur les suites) | Évanescent (rarement en Résonance) |
| Moteur | gardiens (un énorme coup), Blindé | Vigie (Aspiration du Flux) |
| Carapace | Concentration, Furie, Vengeur (gros coups), Dissonance | Régénération, combats qui traînent |
| Traque | groupes, Régénération (on achève vite) | Évanescent, Épines |
| Sève | Éboulis, attaques de zone, Essaim | un gros coup sur un seul Porteur |
| Harmonie | Évanescent | Dissonance |
| Lecture | Évanescent (Fêlure cachée), ennemis qui se soignent ou se protègent | gardiens et Blindés (leur Fêlure ne retire qu'un quart) |
| Chœur | Dissonance (Gardien des registres, Brigadier) | Évanescent, Augmentés (le triangle frappe les Résonants) |

## 7. Six escouades types (pour vérifier que les voies se combinent)

1. **Forteresse vivante** : Doran (Carapace) + Kessa (Sève) + Aurel (Lecture). Le Débord fait du bouclier, la Riposte le
   transforme en dégâts, Désarmer et la Fêlure brisée réduisent les coups. Lente et solide.
2. **Court-circuit** : Liane (Moteur) + Véla (Harmonie) + un Génés. Les Résonances remplissent le Flux, la Décharge le vide
   d'un coup. Le dilemme : Décharge ou Coup d'éclat ?
3. **Meute de nuit** : Nuit (Traque) + Ilka (Cadence) + Véla. Fissure posée, puis Rafale : chaque coup doublé profite de la
   Fissure et de la Curée.
4. **Chantier** : Sasha (Machines) + Doran (Carapace) + un Résonant. Grosses cartes rendues légères par le Servo : la réponse
   aux gardiens blindés.
5. **Chœur des profondeurs** : Joss + Véla + Guetteur, **trois Résonants**. C'est la seule escouade d'une seule lignée qui
   tienne : tout est entre 7 et 9, l'Écho vient facilement. En échange, le triangle la rend fragile face aux Augmentés.
6. **Les Lecteurs** : Aurel (Lecture) + Nuit (Traque) + Liane (Moteur). La Fêlure brisée à chaque tour, plus une Résonance,
   remplit le Flux à chaque tour. Contrôle, puis un gros coup.

## 8. Ce que ça demande

- **Moteur de combat** : les 10 effets dans `combat.ts`, `regles.ts` (Diapason, à côté de l'Accord), `effets.ts` et `types.ts`,
  avec leurs tests. Environ 150 lignes, chaque effet tient en quelques lignes, comme ceux d'aujourd'hui.
- **Robot** : il mesure aujourd'hui une carte seule, à la place d'une carte de départ. Une carte de voie seule sera toujours
  sous-estimée. Il faut une deuxième mesure : **une voie complète** (les 6 cartes d'un Porteur) contre le deck de départ, et
  vérifier qu'aucune voie ne domine les autres.
- **Collection** : de 45 à environ 84 cartes, une carte précise tombe deux fois moins souvent. Pour compenser : le kit d'arrivée,
  et des **fouilles ciblées par voie** (aujourd'hui par lignée).
- **Images** : environ 40 illustrations à générer sur Midjourney. J'écris les prompts dans `docs/prompts-cartes.md`, avec le préfixe
  et le --sref habituels.
- **Guide des cartes** : un onglet « Les voies » (plan de jeu, cartes, forces et faiblesses), lu dans les données comme le reste.

## 9. Par étapes

1. **Étape 1 (faite le 27 octobre 2026) : une voie par lignée, les plus éloignées des suites.** Carapace, Moteur, Chœur :
   14 cartes, 4 effets (Riposte, Décharge, Diapason, Unisson). Prompts des images dans `docs/prompts-cartes.md`.
2. **Étape 2** : Lecture, Traque, Machines (15 cartes, 4 effets), plus le kit d'arrivée des Porteurs.
3. **Étape 3** : Cadence, Sève, retouches de l’Harmonie (9 à 11 cartes, 2 effets), plus les fouilles par voie et l'onglet du guide.
