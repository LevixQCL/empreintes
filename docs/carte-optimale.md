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
| Collection / économie | Le niveau et la lignée sont des infos de collection : petites, toujours au même endroit, jamais sur l'image. |

## Anatomie

```
┌──────────────────────────╲
│                           │
│   ILLUSTRATION SEULE      │  0 → 58 % : aucune interface,
│   (arête de glace fine)   │  juste un liseré de glace
│                           │
│ ⬡7 ⬡6 ━━━━━━━━━━━━━━ ✸17 │  58 % : la COUTURE — Fréquences à gauche,
├───────────────────────────┤        valeur dans son médaillon d'or à droite
│ Cœur-turbine              │  le nom, en entier
│ ◆ Surcharge  Flux +2      │  ligne de règle 1 : l'effet (mot + formule courte)
│ ⬟ Lien Géné  +4           │  ligne de règle 2 : le combo, s'il y en a un
│ ◆AUGM.   2 PL.     NIV 5  │  le talon : lignée, encombrement, niveau
╲───────────────────────────┘
```

1. **Le haut : l'illustration seule.** Plus de cadre sur les côtés ni en haut (l'idée de Bryan, poussée au bout) : un liseré
   d'arête de glace, c'est tout. L'image gagne environ 15 % de surface. Le badge « Nouvelle » passe en haut à droite, petit.
2. **La couture : la ligne de suite.** Une bande de cristal lumineux sépare l'image du socle. Elle porte, à gauche, la ou les
   Fréquences (cristaux octogonaux, la principale en grand, les autres côte à côte en plus petit — **plus d'animation qui
   les fait défiler**), et à droite la valeur dans un médaillon d'or dont la forme dit l'action : éclat (attaque), écu
   (bouclier), goutte (soin). En combat, la couture d'une carte qui prolonge ta suite s'allume : le combo se lit par la
   lumière, pas par du texte.
3. **Le socle : du verre fumé dans un cadre de métal.** Le métal (fer, cuivre, argent, or) n'est que le cadre du socle ;
   le texte est toujours posé sur le même verre fumé sombre, donc toujours clair sur foncé, quel que soit le métal
   (aujourd'hui le cuivre et l'argent ont une encre sombre moins lisible). La Nacre garde son principe : pas de métal,
   l'image descend derrière un verre irisé.
4. **Deux lignes de règle au plus.** Chaque effet reçoit une formule de 15 signes au plus, la phrase entière va au zoom :

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
5. **Les combos : une ligne « Lien », jamais plus d'un par carte.** Icône de la lignée ou de l'effet visé + le gain
   (« Lien Géné +4 »). Les suites et les Échos n'ont besoin d'aucun texte : la couture s'allume.
6. **Le talon** : lignée (losange de sa couleur + nom court), « 2 PL. » si la carte est lourde, « NIV 5 » à droite.
   Textes ≥ 12 px à la taille collection.

## Les trois distances de lecture

| | En main (≈ 70 px) | Collection (≈ 170 px) | Zoom (appui long) |
|---|---|---|---|
| Fréquence(s) | la principale | toutes | toutes + « prend celle qui prolonge ta suite » |
| Valeur + forme de l'action | oui | oui | oui |
| Effet | l'icône seule | mot + formule | phrase entière |
| Combo (Lien) | l'icône seule | mot + gain | phrase entière |
| Nom, lignée, niveau, lourd | non | oui | oui |

En main, le socle se réduit (24 % de la hauteur) : l'image reprend la place.

## Ce que Midjourney fait, et ce qu'il ne fait pas

Midjourney ne sait pas écrire de chiffres fiables, et les chiffres changent avec le niveau : **il dessine les pièces vides,
le code pose le texte**, comme pour les cadres actuels. On procède en deux temps : un concept pour valider l'allure
d'ensemble, puis les pièces, avec le concept choisi en `--sref` en plus de celui du Manifeste pour que tout se tienne.
Toutes les pièces sur fond noir uni (fond blanc pour le cristal à teinter) : je détoure et je règle les découpes.

### Étape 0 — Le concept (4 images, on en garde une)

```
bold graphic fantasy illustration, clean confident ink outlines, cel shading with painted textures, vibrant warm palette, stylized expressive proportions, simplified features, collectible card art. empty game card frame design, front view, flat and perfectly symmetrical, the upper sixty percent is an open window filled with flat pure black, bordered only by a very thin glowing ice crystal edge, the lower forty percent is a solid base plate: an ornate polished gold rim framing a large plain dark smoked glass panel, a thin luminous pale blue crystal seam runs horizontally across the card where the window meets the base, one empty octagonal faceted crystal socket sitting on the left end of the seam, one larger round empty gold medallion sitting on the right end of the seam, top right and bottom left corners cut at 45 degrees, crystal and light, frosted glass, icy edges, family-friendly, no text, no letters, no numbers --ar 5:7 --sref https://levixqcl.github.io/empreintes/art/personnages/yse.webp --sw 60 --no text, letters, numbers, symbols, person, character, creature
```

### Étape 1 — Les cinq socles (`public/art/cadres/socle-<métal>.webp`, 1000 × 600)

Le même prompt pour les cinq, seul le passage `{MÉTAL}` change. Ajouter `--sref <URL du concept choisi>` après celui du Manifeste.

```
bold graphic fantasy illustration, clean confident ink outlines, cel shading with painted textures, vibrant warm palette, stylized expressive proportions, simplified features, collectible card art. game card bottom frame piece, front view, flat orthographic, symmetrical, a wide horizontal base plate: {MÉTAL} rim framing one large plain empty dark smoked glass panel, thin ice crystal inner edge around the glass, the top edge perfectly straight with a thin luminous pale blue crystal seam along it, the bottom left corner cut at 45 degrees, nothing inside the glass panel, isolated on a pure flat black background, family-friendly, no text, no letters, no numbers --ar 5:3 --sref https://levixqcl.github.io/empreintes/art/personnages/yse.webp --sw 60 --no text, letters, numbers, symbols, person, character, ornaments inside the panel
```

| Métal | `{MÉTAL}` |
|---|---|
| fer | `a dark forged iron, hammered and riveted, matte steel grey` |
| cuivre | `a warm hammered copper, polished, rosy orange highlights` |
| argent | `a polished silver with cold blue reflections, fine engraved lines` |
| or | `an ornate chiselled gold with delicate filigree, rich warm highlights` |
| nacre | `an iridescent mother-of-pearl and prismatic glass, soft rainbow sheen, pink blue and green reflections` |

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

### Étape 4 — Les trois sceaux de lignée (`lignee-<id>.webp`, 256 × 256)

```
bold graphic fantasy illustration, clean confident ink outlines, cel shading with painted textures, vibrant warm palette, stylized expressive proportions, simplified features, collectible card art. a small simple glowing sigil icon, front view, centered, flat, bold readable silhouette, {SCEAU}, isolated on a pure flat black background, family-friendly, no text, no letters, no numbers --ar 1:1 --sref https://levixqcl.github.io/empreintes/art/personnages/yse.webp --sw 60 --no text, letters, numbers, person
```

| Lignée | `{SCEAU}` |
|---|---|
| Augmentés | `a hexagonal crystal cog with a bright core, cold cyan light` |
| Génés | `a spiral of overlapping scales like a fern frond, vivid green light` |
| Résonants | `three concentric ripple rings around a small gem, amethyst violet light` |

### Étape 5 — Les icônes d'effet et de Lien (`effets/<id>.webp`, 256 × 256)

Même prompt que les sceaux, avec `{SCEAU}` remplacé par le motif, en lumière dorée (`warm gold light`) :

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
2. Les étapes 1 à 3 (11 images) suffisent pour coder la nouvelle face ; les sceaux et icônes peuvent suivre, la maquette
   tient avec des formes simples en attendant.
3. Je code la nouvelle face dans `src/ui/carte.ts` / `face-carte.css` (mêmes unités `cqw`, les trois distances par
   requêtes de conteneur), puis vérification au téléphone et sur PC, et `npm run visuel`.
