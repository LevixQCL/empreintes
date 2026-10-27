# La carte optimale : lecture et Midjourney (proposition du 27 octobre 2026)

Pourquoi : les illustrations sont bonnes, mais la carte se lit mal. Le cadre fait le tour de l'image, l'effet est écrit
à la verticale en 8 px, le nom est coupé (« Dorsale renforcé… »), les Fréquences multiples défilent une par une, et le
niveau a le même poids que ce qui compte en combat. Avec des combos en plus, ça devient illisible.

Maquette (téléphone, 390 px) : `docs/carte-optimale-maquette.jpg`. Elle reprend les vraies illustrations ; les pièces
de cadre y sont dessinées en CSS en attendant celles de Midjourney.

## Le panel

Cinq points de vue de game designers seniors, chacun avec sa règle :

| Rôle | Ce qu'il a imposé |
|---|---|
| Design de combat (systèmes) | La Fréquence et la valeur sont les deux seules infos dont on a besoin pour jouer : même ligne, même hauteur, un seul coup d'œil. |
| Lisibilité mobile (UX) | Trois distances de lecture : en main, en collection, en zoom. Chaque info a sa distance, rien n'apparaît à toutes. |
| Direction artistique | Le haut de la carte est à l'illustration. Le métal se voit sans rien lire. |
| Design de cartes (TCG) | Un « budget d'encre » fixe : 2 chiffres, 1 nom, 2 lignes de règle au plus. Au-delà, ça part au zoom. |
| Collection / économie | Le niveau et la lignée sont des infos de collection : une roue de niveau dans la couleur de la lignée, aucun mot. |

## Anatomie (révisée le 27 octobre : l'image n'est plus rognée)

Première version : un socle opaque sur le bas coupait la moitié de l'illustration (remarque de Bryan). Version retenue :
**l'illustration entière occupe toute la carte**, sans aucune coupe ; le texte se pose sur un voile de verre fumé
qui ne couvre que le quart du bas, et l'image reste visible à travers.

```
┌──────────────────────────╲   liseré fin du métal tout autour
│ ⬡6                        │   en haut à gauche : la Fréquence (les autres en dessous, plus petites)
│ ⬡7  ILLUSTRATION ENTIÈRE  │
│ ⬡5  (format 5:7, rien de  │   0 → 75 % : aucune autre interface
│      coupé)               │
│━━━━━━━━━━━━━━━━━━━━━━ ⬢12 │   75 % : la couture, et la valeur dans son médaillon d'or
│░◌ Apaiser░░░░░░░░░░░░░░░░░│
╲░◆ Vague  soigne tous░░░░░░│   voile de verre fumé : 2 lignes seulement
 ╲──────────────────────────┘
```

1. **L'image entière.** Le cadre n'est plus qu'un liseré de métal fin (1,6 % de la largeur) tout autour : il dit le métal
   (fer, cuivre, argent, or, nacre irisée) sans rien cacher. Le badge « Nouvelle » passe en haut à droite, petit.
2. **La Fréquence en haut à gauche** (choix de Bryan : c'est là qu'on la cherche, et elle reste visible quand les cartes
   se chevauchent). La principale en grand ; les autres, en dessous, en colonne et plus petites — **plus d'animation qui
   les fait défiler**. En combat, le cristal d'une carte qui prolonge ta suite s'allume : le combo se lit par la lumière.
   **La valeur en bas à droite**, dans un médaillon d'or posé sur la couture (une fine bande de cristal à 75 % de la
   hauteur) ; sa forme dit l'action : éclat (attaque), écu (bouclier), goutte (soin).
3. **Le voile : deux lignes, pas une de plus.** Dégradé de verre fumé flouté, donc toujours clair sur foncé quel que soit
   le métal ou l'image.
   - Ligne 1 : **la roue de niveau** puis le nom en entier. La roue a 10 crans (`COLLECTION.niveauMax`), remplis jusqu'au
     niveau de la carte, **dans la couleur de la lignée** : plus besoin d'écrire « NIV 8 » ni « RÉSONANT ». Au niveau max,
     la roue devient dorée. (Idée de Bryan.)
   - Ligne 2 : l'effet (icône + mot + formule courte), et « 2 PL. » au bout si la carte est lourde. Une carte avec un combo
     affiche à la place « Lien Géné +4 » ; l'effet passe au zoom.
4. **Formule courte de chaque effet** (15 signes au plus, la phrase entière va au zoom) :

   | Effet | Formule |
   |---|---|
   | Perçant | ignore bouclier |
   | Siphon | rend 30 % |
   | Surcharge | Flux +2 |
   | Désarmer | −30 % ennemi |
   | Fissure | +25 % dégâts |
   | Élan | +1 place |
   | Crescendo | +10 % / carte |
   | Accord | Fréquence libre |
   | Vague | soigne tous |
   | Rempart | garde 50 % |

   (les pourcentages viennent de la carte, comme aujourd'hui dans `texteEffet`)
5. **Règle pour les prochaines illustrations** : garder l'objet principal dans les trois quarts du haut, le dernier quart
   étant le plateau de l'établi. Les illustrations actuelles passent déjà (objet centré) ; on ajoute aux prompts
   `the object placed in the upper part of the image, the lower quarter is the plain surface of the workbench`.

## Les trois distances de lecture

| | En main (≈ 70 px) | Collection (≈ 170 px) | Zoom (appui long) |
|---|---|---|---|
| Fréquence(s) | la principale | toutes | toutes + « prend celle qui prolonge ta suite » |
| Valeur + forme de l'action | oui | oui | oui |
| Effet | l'icône seule | mot + formule | phrase entière |
| Combo (Lien) | l'icône seule | mot + gain | phrase entière |
| Nom, roue de niveau (couleur = lignée), lourd | non | oui | oui + « Niveau 8 / 10 · Résonant » en clair |

En main, le voile se réduit à la couture : il ne reste que l'image, les Fréquences et la valeur.

## Ce que Midjourney fait, et ce qu'il ne fait pas

Midjourney ne sait pas écrire de chiffres fiables, et les chiffres changent avec le niveau : **il dessine les pièces vides,
le code pose le texte**, comme pour les cadres actuels. On procède en deux temps : un concept pour valider l'allure
d'ensemble, puis les pièces, avec le concept choisi en `--sref` en plus de celui du Manifeste pour que tout se tienne.
Toutes les pièces sur fond noir uni (fond blanc pour le cristal à teinter) : je détoure et je règle les découpes.

### Étape 0 — Le concept (4 images, on en garde une)

```
bold graphic fantasy illustration, clean confident ink outlines, cel shading with painted textures, vibrant warm palette, stylized expressive proportions, simplified features, collectible card art. empty game card frame design, front view, flat and perfectly symmetrical, a very thin ornate polished gold border running around the whole card, the whole inside is an open window filled with flat pure black, one empty octagonal faceted crystal socket in the top left corner, a thin luminous pale blue crystal seam runs horizontally across the card at three quarters of its height, one larger round empty gold medallion on the right end of the seam, top right and bottom left corners cut at 45 degrees, crystal and light, icy edges, family-friendly, no text, no letters, no numbers --ar 5:7 --sref https://levixqcl.github.io/empreintes/art/personnages/yse.webp --sw 60 --no text, letters, numbers, symbols, person, character, creature, thick frame
```

### Étape 1 — Les cinq liserés de métal (`public/art/cadres/bord-<metal>.webp`, 1000 × 1400)

Le même prompt pour les cinq, seul `{MÉTAL}` change. Ajouter `--sref <URL du concept choisi>` après celui du Manifeste.

```
bold graphic fantasy illustration, clean confident ink outlines, cel shading with painted textures, vibrant warm palette, stylized expressive proportions, simplified features, collectible card art. a very thin game card border only, front view, flat orthographic, perfectly symmetrical, made of {MÉTAL}, the border is a narrow band running around the edge of the card, small elegant corner pieces, top right and bottom left corners cut at 45 degrees, the whole inside is empty flat pure black, family-friendly, no text, no letters, no numbers --ar 5:7 --sref https://levixqcl.github.io/empreintes/art/personnages/yse.webp --sw 60 --no text, letters, numbers, symbols, person, character, ornaments inside, thick frame
```

| Métal | `{MÉTAL}` |
|---|---|
| fer | `dark forged iron, hammered and riveted, matte steel grey` |
| cuivre | `warm hammered copper, polished, rosy orange highlights` |
| argent | `polished silver with cold blue reflections, fine engraved lines` |
| or | `ornate chiselled gold with delicate filigree, rich warm highlights` |
| nacre | `iridescent mother-of-pearl and prismatic glass, soft rainbow sheen, pink blue and green reflections` |

### Étape 2 — Le cristal de Fréquence (`frequence.webp`, 512 × 512, teinté par le code)

```
bold graphic fantasy illustration, clean confident ink outlines, cel shading with painted textures, vibrant warm palette, stylized expressive proportions, simplified features, collectible card art. a single octagonal faceted gemstone, perfectly clear colorless crystal with bright facets, set in a thin polished silver bezel, front view, centered, flat and symmetrical, the center facet large and smooth, isolated on a pure flat white background, family-friendly, no text, no letters, no numbers --ar 1:1 --sref https://levixqcl.github.io/empreintes/art/personnages/yse.webp --sw 60 --no text, letters, numbers, color tint, shadow
```

### Étape 3 — Les trois médaillons de valeur (`valeur-<action>.webp`, 512 × 512)

L'or porte la valeur ; le centre reste sombre et vide pour le chiffre.

```
bold graphic fantasy illustration, clean confident ink outlines, cel shading with painted textures, vibrant warm palette, stylized expressive proportions, simplified features, collectible card art. a game card value medallion, front view, centered, flat and symmetrical, {FORME}, a thick polished gold rim, a large smooth empty dark center for a number, isolated on a pure flat black background, family-friendly, no text, no letters, no numbers --ar 1:1 --sref https://levixqcl.github.io/empreintes/art/personnages/yse.webp --sw 60 --no text, letters, numbers, symbols, cross
```

| Action | `{FORME}` |
|---|---|
| attaque | `a sixteen-pointed burst of sharp red crystal shards radiating around a round core` |
| bouclier | `a plain pointed shield shape made of deep blue crystal, no emblem` |
| soin | `a rounded drop shape made of soft green crystal, a small leaf curling at its tip` |

### Étape 4 — Les icônes d'effet et de Lien (`effets/<id>.webp`, 256 × 256)

```
bold graphic fantasy illustration, clean confident ink outlines, cel shading with painted textures, vibrant warm palette, stylized expressive proportions, simplified features, collectible card art. a small simple glowing icon, front view, centered, flat, bold readable silhouette, {MOTIF}, warm gold light, isolated on a pure flat black background, family-friendly, no text, no letters, no numbers --ar 1:1 --sref https://levixqcl.github.io/empreintes/art/personnages/yse.webp --sw 60 --no text, letters, numbers, person
```

| Effet | Motif |
|---|---|
| Perçant | `a crystal spear tip piercing through a cracked plate` |
| Siphon | `a swirl of red light pulled into a small crystal vial` |
| Surcharge | `a crystal cell overflowing with small lightning arcs` |
| Désarmer | `a short blade snapped in two` |
| Fissure | `a glowing crack spreading across a stone slab` |
| Élan | `an arrow-shaped crystal with curved motion trails` |
| Crescendo | `three crystal shards rising in size like steps` |
| Accord | `a crystal tuning fork with ripples` |
| Vague | `a curling wave of light` |
| Rempart | `a low stone wall with a glowing crystal set in its center` |
| Lien (combo) | `two interlocking crystal chain links` |

## Ordre de travail proposé

1. Bryan lance l'étape 0 et choisit une image.
2. Les étapes 1 à 3 (9 images) suffisent pour coder la nouvelle face ; les icônes peuvent suivre, la maquette
   tient avec des formes simples en attendant.
3. Je code la nouvelle face dans `src/ui/carte.ts` / `face-carte.css` (mêmes unités `cqw`, les trois distances par
   requêtes de conteneur), puis vérification au téléphone et sur PC, et `npm run visuel`.
