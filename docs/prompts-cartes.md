# Prompts Midjourney des cartes (une lumière par lignée)

Pourquoi (25 octobre 2026) : les illustrations des cartes (`public/art/modules/`) baignent toutes dans la même lumière orange,
comme les anciens portraits. Chaque lignée reçoit la même lumière que ses Porteurs (voir `prompts-porteurs.md`).

27 octobre 2026 (Bryan) : plus de « orange, amber, sunset, fire glow » dans les `--no`. Les cartes sont maintenant triées par lignée :
un peu d'orange dans le décor ne gêne pas, tant que la couleur principale de la lignée domine.

Composition des cartes : comme les cartes existantes, **un seul objet en gros plan**, centré, qui remplit l'image, posé sur un établi
(une nature morte, sans personnage). Une scène large avec un petit personnage ne se lit plus à la taille d'une carte sur téléphone.

Format : 600 × 848, à enregistrer sous le même nom dans `public/art/modules/<id>.webp` (remplace l'ancienne image).

## Résonants : lumière améthyste (lot d'essai)

**Règle du 27 octobre 2026 (Bryan : « les cartes des Résonants sont toujours dans le même style »)** : 15 prompts Résonants sur 20
avaient un cristal violet pour sujet. Désormais, **le cristal n'est jamais le sujet principal** d'une carte Résonante (au plus un détail).
Chaque carte part d'une famille d'objets, avec sa matière, sous la même lumière améthyste :
ombres (silhouettes projetées) · son (instruments de bois et de laiton) · plumes et ailes · encre et papier · brume et eau (miroirs,
reflets) · fils et tissus (voiles, broderies) · masques. **Seconde couleur : toujours l'or** (« rich gold accents », dorures) : c'est la mèche d'or
des Résonants, et le pourpre et l'or font une lignée de rois. Le violet reste la lumière de la lignée : l'or seul se confondrait avec
le métal or des cartes et l'or de la valeur dans l'interface.
Le `--no` ajoute « crystal, gemstone, amethyst rock » quand le nom de la carte n'en parle pas.
Refaits selon cette règle : Murmure, Éclat, Éclat qui chante, Souffle, Grand unisson, Diapason de cristal.
Pas de bougies ni de cercle de cierges : ça évoque un autel, et le jeu ne montre rien de religieux (Grand unisson refait en carillon).

### Apaiser — `apaiser.webp`

```
bold graphic fantasy illustration, clean confident ink outlines, cel shading with painted textures, vibrant warm palette, stylized expressive proportions, simplified features, collectible card art. still life close-up, centered and filling the frame, above a dark worn wooden workbench in a dim workshop, close-up of two gentle cupped hands holding a small softly glowing violet crystal like a quiet heartbeat, slow soothing ripples of light spreading from it, the object glowing with violet light, dominant amethyst and violet lighting, lavender rim light, deep indigo shadows, no text, no letters, no numbers, family-friendly --ar 5:7 --sref https://levixqcl.github.io/empreintes/art/personnages/yse.webp --sw 60 --no text
```

### Chant des abysses — `chant-abysses.webp`

```
bold graphic fantasy illustration, clean confident ink outlines, cel shading with painted textures, vibrant warm palette, stylized expressive proportions, simplified features, collectible card art. still life, a single object in close-up, centered and filling the frame, resting on a dark worn wooden workbench in a dim workshop, a spiral seashell made of translucent violet crystal, glowing sound ripples rising from its opening like underwater waves, the object glowing with violet light, dominant amethyst and violet lighting, lavender rim light, deep indigo shadows, no people, no text, no letters, no numbers, family-friendly --ar 5:7 --sref https://levixqcl.github.io/empreintes/art/personnages/yse.webp --sw 60 --no text, person, character
```

### Écho — `echo.webp`

```
bold graphic fantasy illustration, clean confident ink outlines, cel shading with painted textures, vibrant warm palette, stylized expressive proportions, simplified features, collectible card art. still life, a single object in close-up, centered and filling the frame, resting on a dark worn wooden workbench in a dim workshop, two crystal tuning forks standing side by side on a small brass stand, concentric violet rings of light vibrating between them, the object glowing with violet light, dominant amethyst and violet lighting, lavender rim light, deep indigo shadows, no people, no text, no letters, no numbers, family-friendly --ar 5:7 --sref https://levixqcl.github.io/empreintes/art/personnages/yse.webp --sw 60 --no text, person, character
```

### Éclat — `eclat.webp`

```
bold graphic fantasy illustration, clean confident ink outlines, cel shading with painted textures, vibrant warm palette, stylized expressive proportions, simplified features, collectible card art. still life, a single object in close-up, centered and filling the frame, resting on a dark worn wooden workbench in a dim workshop, a shattered antique hand mirror with an ornate gilded handle, its broken shards floating outward in a burst, each shard reflecting a brighter flash of violet light than the last, dominant amethyst and violet lighting with rich gold accents, lavender rim light, deep indigo shadows, no people, no text, no letters, no numbers, family-friendly --ar 5:7 --sref https://levixqcl.github.io/empreintes/art/personnages/yse.webp --sw 60 --no text, person, character, crystal, gemstone, amethyst rock
```

### Éclat qui chante — `eclat-chant.webp`

```
bold graphic fantasy illustration, clean confident ink outlines, cel shading with painted textures, vibrant warm palette, stylized expressive proportions, simplified features, collectible card art. still life, a single object in close-up, centered and filling the frame, resting on a dark worn wooden workbench in a dim workshop, an old open wooden music box with a polished brass comb and cylinder, three glowing violet musical notes of light rising from it, each one bigger than the one before, dominant amethyst and violet lighting with rich gold accents, lavender rim light, deep indigo shadows, no people, no text, no letters, no numbers, family-friendly --ar 5:7 --sref https://levixqcl.github.io/empreintes/art/personnages/yse.webp --sw 60 --no text, person, character, crystal, gemstone, amethyst rock
```

### Encre ancienne — `encre-ancienne.webp`

```
bold graphic fantasy illustration, clean confident ink outlines, cel shading with painted textures, vibrant warm palette, stylized expressive proportions, simplified features, collectible card art. still life, a single object in close-up, centered and filling the frame, resting on a dark worn wooden workbench in a dim workshop, an old stone inkwell filled with luminous violet ink, a quill resting beside it, a small stone slab with glowing abstract strokes and thin cracks spreading from them, abstract shapes not letters, the object glowing with violet light, dominant amethyst and violet lighting, lavender rim light, deep indigo shadows, no people, no text, no letters, no numbers, family-friendly --ar 5:7 --sref https://levixqcl.github.io/empreintes/art/personnages/yse.webp --sw 60 --no text, person, character
```

### Mèche d'or — `meche-or.webp`

```
bold graphic fantasy illustration, clean confident ink outlines, cel shading with painted textures, vibrant warm palette, stylized expressive proportions, simplified features, collectible card art. still life, a single object in close-up, centered and filling the frame, resting on a dark worn wooden workbench in a dim workshop, a lock of dark hair with one bright metallic gold strand, tied with a thin violet ribbon, lying in a small open velvet jewelry box, the object glowing with violet light, dominant amethyst and violet lighting, lavender rim light, deep indigo shadows, no people, no text, no letters, no numbers, family-friendly --ar 5:7 --sref https://levixqcl.github.io/empreintes/art/personnages/yse.webp --sw 60 --no text, person, character
```

### Miroir de brume — `miroir-brume.webp`

```
bold graphic fantasy illustration, clean confident ink outlines, cel shading with painted textures, vibrant warm palette, stylized expressive proportions, simplified features, collectible card art. still life, a single object in close-up, centered and filling the frame, resting on a dark worn wooden workbench in a dim workshop, an ornate hand mirror whose glass is made of frozen swirling violet mist, a blurred unfamiliar silhouette faintly visible inside, mist spilling over the frame, the object glowing with violet light, dominant amethyst and violet lighting, lavender rim light, deep indigo shadows, no people, no text, no letters, no numbers, family-friendly --ar 5:7 --sref https://levixqcl.github.io/empreintes/art/personnages/yse.webp --sw 60 --no text, person, character
```

### Murmure — `murmure.webp`

```
bold graphic fantasy illustration, clean confident ink outlines, cel shading with painted textures, vibrant warm palette, stylized expressive proportions, simplified features, collectible card art. still life, a single object in close-up, centered and filling the frame, resting on a dark worn wooden workbench in a dim workshop, a translucent violet silk veil hanging from a small dark wooden frame, embroidered with swirling gold thread patterns, gently billowing as if someone had just whispered through it, a few gold threads drifting loose in the air, dominant amethyst and violet lighting with rich gold accents and fine gilded embroidery, lavender rim light, deep indigo shadows, no people, no text, no letters, no numbers, family-friendly --ar 5:7 --sref https://levixqcl.github.io/empreintes/art/personnages/yse.webp --sw 60 --no text, person, character, crystal, gemstone, amethyst rock
```

### Ombre ailée — `ombre-ailee.webp`

```
bold graphic fantasy illustration, clean confident ink outlines, cel shading with painted textures, vibrant warm palette, stylized expressive proportions, simplified features, collectible card art. still life, a single object in close-up, centered and filling the frame, resting on a dark worn wooden workbench in a dim workshop, a small crystal pendant on its chain, casting an immense winged shadow with feathered wings fully open on the wall behind the workbench, the object glowing with violet light, dominant amethyst and violet lighting, lavender rim light, deep indigo shadows, no people, no text, no letters, no numbers, family-friendly --ar 5:7 --sref https://levixqcl.github.io/empreintes/art/personnages/yse.webp --sw 60 --no text, person, character
```

### Ombre de serpent — `ombre-serpent.webp`

```
bold graphic fantasy illustration, clean confident ink outlines, cel shading with painted textures, vibrant warm palette, stylized expressive proportions, simplified features, collectible card art. still life, a single object in close-up, centered and filling the frame, resting on a dark worn wooden workbench in a dim workshop, a coiled crystal bracelet shaped like a serpent, casting a long sinuous serpent shadow that stretches across the whole workbench, the object glowing with violet light, dominant amethyst and violet lighting, lavender rim light, deep indigo shadows, no people, no text, no letters, no numbers, family-friendly --ar 5:7 --sref https://levixqcl.github.io/empreintes/art/personnages/yse.webp --sw 60 --no text, person, character
```

### Plume de givre — `plume-givre.webp`

```
bold graphic fantasy illustration, clean confident ink outlines, cel shading with painted textures, vibrant warm palette, stylized expressive proportions, simplified features, collectible card art. still life, a single object in close-up, centered and filling the frame, resting on a dark worn wooden workbench in a dim workshop, a single large white feather covered with delicate frost crystals, lying on dark velvet, cold violet mist and tiny ice sparkles around it, the object glowing with violet light, dominant amethyst and violet lighting, lavender rim light, deep indigo shadows, no people, no text, no letters, no numbers, family-friendly --ar 5:7 --sref https://levixqcl.github.io/empreintes/art/personnages/yse.webp --sw 60 --no text, person, character
```

### Pressentiment — `pressentiment.webp`

```
bold graphic fantasy illustration, clean confident ink outlines, cel shading with painted textures, vibrant warm palette, stylized expressive proportions, simplified features, collectible card art. still life, a single object in close-up, centered and filling the frame, resting on a dark worn wooden workbench in a dim workshop, an ornate hourglass whose glowing violet sand flows upward instead of down, faint ghostly echoes of the hourglass around it, the object glowing with violet light, dominant amethyst and violet lighting, lavender rim light, deep indigo shadows, no people, no text, no letters, no numbers, family-friendly --ar 5:7 --sref https://levixqcl.github.io/empreintes/art/personnages/yse.webp --sw 60 --no text, person, character
```

### Souffle — `souffle.webp`

```
bold graphic fantasy illustration, clean confident ink outlines, cel shading with painted textures, vibrant warm palette, stylized expressive proportions, simplified features, collectible card art. still life, a single object in close-up, centered and filling the frame, resting on a dark worn wooden workbench in a dim workshop, a large curved horn of pale bone bound with ornate gold rings, a powerful violet gust of wind bursting from its mouth, a long crack splitting the workbench in front of it, dominant amethyst and violet lighting with rich gold accents, lavender rim light, deep indigo shadows, no people, no text, no letters, no numbers, family-friendly --ar 5:7 --sref https://levixqcl.github.io/empreintes/art/personnages/yse.webp --sw 60 --no text, person, character, crystal, gemstone, amethyst rock
```

### Souffle du wyrm — `souffle-wyrm.webp`

```
bold graphic fantasy illustration, clean confident ink outlines, cel shading with painted textures, vibrant warm palette, stylized expressive proportions, simplified features, collectible card art. still life, a single object in close-up, centered and filling the frame, resting on a dark worn wooden workbench in a dim workshop, a large rough crystal with the dark shadow of an ancient serpentine dragon trapped inside it, a spiral torrent of violet energy pouring out of the crystal, the object glowing with violet light, dominant amethyst and violet lighting, lavender rim light, deep indigo shadows, no people, no text, no letters, no numbers, family-friendly --ar 5:7 --sref https://levixqcl.github.io/empreintes/art/personnages/yse.webp --sw 60 --no text, person, character
```

## Augmentés : lumière bleu acier

### Bond — `bond.webp`

```
bold graphic fantasy illustration, clean confident ink outlines, cel shading with painted textures, vibrant warm palette, stylized expressive proportions, simplified features, collectible card art. still life, a single object in close-up, centered and filling the frame, resting on a dark worn wooden workbench in a dim workshop, a single sleek mechanical foot implant with a glowing blue crystal sole, caught just after landing, a small burst of dust and blue sparks beneath it, curved motion lines, the object glowing with cold blue light, dominant cold steel-blue and electric cyan lighting, blue rim light, deep navy shadows, no people, no text, no letters, no numbers, family-friendly --ar 5:7 --sref https://levixqcl.github.io/empreintes/art/personnages/yse.webp --sw 60 --no text, person, character
```

### Bras-grue — `bras-grue.webp`

```
bold graphic fantasy illustration, clean confident ink outlines, cel shading with painted textures, vibrant warm palette, stylized expressive proportions, simplified features, collectible card art. still life, a single object in close-up, centered and filling the frame, resting on a dark worn wooden workbench in a dim workshop, a heavy mechanical arm prosthesis with hydraulic pistons and thick steel fingers, gripping and lifting a short steel beam, a glowing blue crystal in the elbow, the object glowing with cold blue light, dominant cold steel-blue and electric cyan lighting, blue rim light, deep navy shadows, no people, no text, no letters, no numbers, family-friendly --ar 5:7 --sref https://levixqcl.github.io/empreintes/art/personnages/yse.webp --sw 60 --no text, person, character
```

### Cœur de reprise — `coeur-reprise.webp`

```
bold graphic fantasy illustration, clean confident ink outlines, cel shading with painted textures, vibrant warm palette, stylized expressive proportions, simplified features, collectible card art. still life, a single object in close-up, centered and filling the frame, resting on a dark worn wooden workbench in a dim workshop, a worn steel and brass rescue implant the size of a fist, with an open glass window showing a raw uncut jagged blue crystal shard inside, dark and cold, two copper electrodes clamped on it with a bright blue lightning spark striking the crystal and relighting it, a medic's crank and cables beside it, the object glowing with cold blue light, dominant cold steel-blue and electric cyan lighting, blue rim light, deep navy shadows, no people, no text, no letters, no numbers, family-friendly --ar 5:7 --sref https://levixqcl.github.io/empreintes/art/personnages/yse.webp --sw 60 --no text, person, character, heart shape, love heart, diamond, gemstone, anatomical heart, organ, blood
```

### Cœur-turbine — `coeur-turbine.webp`

```
bold graphic fantasy illustration, clean confident ink outlines, cel shading with painted textures, vibrant warm palette, stylized expressive proportions, simplified features, collectible card art. still life, a single object in close-up, centered and filling the frame, resting on a dark worn wooden workbench in a dim workshop, a small brass turbine engine seen from the front, a circle of thin fan blades spinning in a blur, at its hub a raw elongated blue crystal shard spinning with the blades, tiny pipes and rivets, a ring of blue light trailing around the blades, the object glowing with cold blue light, dominant cold steel-blue and electric cyan lighting, blue rim light, deep navy shadows, no people, no text, no letters, no numbers, family-friendly --ar 5:7 --sref https://levixqcl.github.io/empreintes/art/personnages/yse.webp --sw 60 --no text, person, character, heart shape, love heart, diamond, gemstone, anatomical heart, organ, blood
```

### Dorsale renforcée — `dorsale.webp`

```
bold graphic fantasy illustration, clean confident ink outlines, cel shading with painted textures, vibrant warm palette, stylized expressive proportions, simplified features, collectible card art. still life, a single object in close-up, centered and filling the frame, resting on a dark worn wooden workbench in a dim workshop, a long spine implant made of brass vertebrae and blue crystal joints, laid straight along the workbench like a precious tool, the object glowing with cold blue light, dominant cold steel-blue and electric cyan lighting, blue rim light, deep navy shadows, no people, no text, no letters, no numbers, family-friendly --ar 5:7 --sref https://levixqcl.github.io/empreintes/art/personnages/yse.webp --sw 60 --no text, person, character
```

### Esquive — `esquive.webp`

```
bold graphic fantasy illustration, clean confident ink outlines, cel shading with painted textures, vibrant warm palette, stylized expressive proportions, simplified features, collectible card art. still life, a single object in close-up, centered and filling the frame, resting on a dark worn wooden workbench in a dim workshop, a slim steel wrist implant with a small crystal lens, faint blue afterimages of it sliding sideways as a steel bolt passes harmlessly beside it, the object glowing with cold blue light, dominant cold steel-blue and electric cyan lighting, blue rim light, deep navy shadows, no people, no text, no letters, no numbers, family-friendly --ar 5:7 --sref https://levixqcl.github.io/empreintes/art/personnages/yse.webp --sw 60 --no text, person, character
```

### Gant à arc — `gant-arc.webp`

```
bold graphic fantasy illustration, clean confident ink outlines, cel shading with painted textures, vibrant warm palette, stylized expressive proportions, simplified features, collectible card art. still life, a single object in close-up, centered and filling the frame, resting on a dark worn wooden workbench in a dim workshop, a thick worn electrician's glove with a blue crystal set on the back of the hand, a crackling electric arc jumping between its fingertips, the object glowing with cold blue light, dominant cold steel-blue and electric cyan lighting, blue rim light, deep navy shadows, no people, no text, no letters, no numbers, family-friendly --ar 5:7 --sref https://levixqcl.github.io/empreintes/art/personnages/yse.webp --sw 60 --no text, person, character
```

### Grappin à câble — `grappin-cable.webp`

```
bold graphic fantasy illustration, clean confident ink outlines, cel shading with painted textures, vibrant warm palette, stylized expressive proportions, simplified features, collectible card art. still life, a single object in close-up, centered and filling the frame, resting on a dark worn wooden workbench in a dim workshop, a wrist-mounted grappling launcher with folded steel claws and a coil of thin steel cable, a blue crystal glowing in its housing, the object glowing with cold blue light, dominant cold steel-blue and electric cyan lighting, blue rim light, deep navy shadows, no people, no text, no letters, no numbers, family-friendly --ar 5:7 --sref https://levixqcl.github.io/empreintes/art/personnages/yse.webp --sw 60 --no text, person, character
```

### Jambes à ressort — `jambes-ressort.webp`

```
bold graphic fantasy illustration, clean confident ink outlines, cel shading with painted textures, vibrant warm palette, stylized expressive proportions, simplified features, collectible card art. still life, a single object in close-up, centered and filling the frame, resting on a dark worn wooden workbench in a dim workshop, an old bulky pair of mechanical legs with visible coil springs and riveted steel plates, glowing blue crystal cores at the knees, a big wrench lying beside them, the object glowing with cold blue light, dominant cold steel-blue and electric cyan lighting, blue rim light, deep navy shadows, no people, no text, no letters, no numbers, family-friendly --ar 5:7 --sref https://levixqcl.github.io/empreintes/art/personnages/yse.webp --sw 60 --no text, person, character
```

### Lames orbitales — `lames-orbitales.webp`

```
bold graphic fantasy illustration, clean confident ink outlines, cel shading with painted textures, vibrant warm palette, stylized expressive proportions, simplified features, collectible card art. still life, a single object in close-up, centered and filling the frame, resting on a dark worn wooden workbench in a dim workshop, three curved steel blades hovering in a circle around a floating blue crystal, blue light trails tracing their orbit, the object glowing with cold blue light, dominant cold steel-blue and electric cyan lighting, blue rim light, deep navy shadows, no people, no text, no letters, no numbers, family-friendly --ar 5:7 --sref https://levixqcl.github.io/empreintes/art/personnages/yse.webp --sw 60 --no text, person, character
```

### Œil-brouilleur — `oeil-brouilleur.webp`

```
bold graphic fantasy illustration, clean confident ink outlines, cel shading with painted textures, vibrant warm palette, stylized expressive proportions, simplified features, collectible card art. still life, a single object in close-up, centered and filling the frame, resting on a dark worn wooden workbench in a dim workshop, a mechanical eye implant with a shuttered lens, emitting rippling waves of blue static distortion that blur the air around it, the object glowing with cold blue light, dominant cold steel-blue and electric cyan lighting, blue rim light, deep navy shadows, no people, no text, no letters, no numbers, family-friendly --ar 5:7 --sref https://levixqcl.github.io/empreintes/art/personnages/yse.webp --sw 60 --no text, person, character
```

### Œil-relais — `oeil-relais.webp`

```
bold graphic fantasy illustration, clean confident ink outlines, cel shading with painted textures, vibrant warm palette, stylized expressive proportions, simplified features, collectible card art. still life, a single object in close-up, centered and filling the frame, resting on a dark worn wooden workbench in a dim workshop, a mechanical eye implant on a small brass stand, projecting a faint blue holographic image of a distant dark corridor above it, the object glowing with cold blue light, dominant cold steel-blue and electric cyan lighting, blue rim light, deep navy shadows, no people, no text, no letters, no numbers, family-friendly --ar 5:7 --sref https://levixqcl.github.io/empreintes/art/personnages/yse.webp --sw 60 --no text, person, character
```

### Ruée — `ruee.webp`

```
bold graphic fantasy illustration, clean confident ink outlines, cel shading with painted textures, vibrant warm palette, stylized expressive proportions, simplified features, collectible card art. still life, a single object in close-up, centered and filling the frame, resting on a dark worn wooden workbench in a dim workshop, a battered steel shoulder guard with a glowing blue crystal, resting on a bent and snapped metal railing, strong speed lines, the object glowing with cold blue light, dominant cold steel-blue and electric cyan lighting, blue rim light, deep navy shadows, no people, no text, no letters, no numbers, family-friendly --ar 5:7 --sref https://levixqcl.github.io/empreintes/art/personnages/yse.webp --sw 60 --no text, person, character
```

### Tir — `tir.webp`

```
bold graphic fantasy illustration, clean confident ink outlines, cel shading with painted textures, vibrant warm palette, stylized expressive proportions, simplified features, collectible card art. still life, a single object in close-up, centered and filling the frame, resting on a dark worn wooden workbench in a dim workshop, a heavy rail nail gun built from welding tools, with a magnetic rail charged with blue energy and a few construction nails beside it, the object glowing with cold blue light, dominant cold steel-blue and electric cyan lighting, blue rim light, deep navy shadows, no people, no text, no letters, no numbers, family-friendly --ar 5:7 --sref https://levixqcl.github.io/empreintes/art/personnages/yse.webp --sw 60 --no text, person, character
```

### Tir vif — `tir-vif.webp`

```
bold graphic fantasy illustration, clean confident ink outlines, cel shading with painted textures, vibrant warm palette, stylized expressive proportions, simplified features, collectible card art. still life, a single object in close-up, centered and filling the frame, resting on a dark worn wooden workbench in a dim workshop, a compact wrist-mounted rail launcher firing a bright blue streak, a small coin spinning in the air beside it, the object glowing with cold blue light, dominant cold steel-blue and electric cyan lighting, blue rim light, deep navy shadows, no people, no text, no letters, no numbers, family-friendly --ar 5:7 --sref https://levixqcl.github.io/empreintes/art/personnages/yse.webp --sw 60 --no text, person, character
```

## Génés : lumière verte

Les greffes Génés sont dessinées comme des spécimens de naturaliste (bocal, coquille, objet sculpté), jamais comme de la chair : rien de gore.

### Branchies des Fondations — `branchies.webp`

```
bold graphic fantasy illustration, clean confident ink outlines, cel shading with painted textures, vibrant warm palette, stylized expressive proportions, simplified features, collectible card art. still life, a single object in close-up, centered and filling the frame, resting on a dark worn wooden workbench in a dim workshop, a tall glass specimen jar filled with glowing green water, holding a pair of delicate feathery gill fronds like sea ferns, tiny rising bubbles, the object glowing with soft green bioluminescent light, dominant emerald and moss-green lighting, teal reflections, deep green-black shadows, no people, no text, no letters, no numbers, family-friendly --ar 5:7 --sref https://levixqcl.github.io/empreintes/art/personnages/yse.webp --sw 60 --no text, person, character, blood, gore, flesh, organ
```

### Carapace — `carapace.webp`

```
bold graphic fantasy illustration, clean confident ink outlines, cel shading with painted textures, vibrant warm palette, stylized expressive proportions, simplified features, collectible card art. still life, a single object in close-up, centered and filling the frame, resting on a dark worn wooden workbench in a dim workshop, a large curved shoulder plate of dark teal-green beetle chitin, iridescent sheen, deep scratches from years of carrying beams, the object glowing with soft green bioluminescent light, dominant emerald and moss-green lighting, teal reflections, deep green-black shadows, no people, no text, no letters, no numbers, family-friendly --ar 5:7 --sref https://levixqcl.github.io/empreintes/art/personnages/yse.webp --sw 60 --no text, person, character, blood, gore, flesh, organ
```

### Carapace-mère — `carapace-mere.webp`

```
bold graphic fantasy illustration, clean confident ink outlines, cel shading with painted textures, vibrant warm palette, stylized expressive proportions, simplified features, collectible card art. still life, a single object in close-up, centered and filling the frame, resting on a dark worn wooden workbench in a dim workshop, an enormous wide shield of layered teal-green chitin standing upright, so wide it fills the whole frame, small moss patches along its edges, the object glowing with soft green bioluminescent light, dominant emerald and moss-green lighting, teal reflections, deep green-black shadows, no people, no text, no letters, no numbers, family-friendly --ar 5:7 --sref https://levixqcl.github.io/empreintes/art/personnages/yse.webp --sw 60 --no text, person, character, blood, gore, flesh, organ
```

### Charge — `charge.webp`

```
bold graphic fantasy illustration, clean confident ink outlines, cel shading with painted textures, vibrant warm palette, stylized expressive proportions, simplified features, collectible card art. still life, a single object in close-up, centered and filling the frame, resting on a dark worn wooden workbench in a dim workshop, a heavy horned forehead plate of thick green chitin, chunks of broken stone and dust around it, strong impact lines, the object glowing with soft green bioluminescent light, dominant emerald and moss-green lighting, teal reflections, deep green-black shadows, no people, no text, no letters, no numbers, family-friendly --ar 5:7 --sref https://levixqcl.github.io/empreintes/art/personnages/yse.webp --sw 60 --no text, person, character, blood, gore, flesh, organ
```

### Cœur de meute — `coeur-meute.webp`

```
bold graphic fantasy illustration, clean confident ink outlines, cel shading with painted textures, vibrant warm palette, stylized expressive proportions, simplified features, collectible card art. still life, a single object in close-up, centered and filling the frame, resting on a dark worn wooden workbench in a dim workshop, a glowing green seed pod cradled in a nest of twisted roots, three smaller pods around it connected by living vines, all pulsing with light in rhythm, a faint wolf paw print pattern on the main pod, the object glowing with soft green bioluminescent light, dominant emerald and moss-green lighting, teal reflections, deep green-black shadows, no people, no text, no letters, no numbers, family-friendly --ar 5:7 --sref https://levixqcl.github.io/empreintes/art/personnages/yse.webp --sw 60 --no text, person, character, blood, gore, flesh, organ
```

### Crocs fossiles — `crocs-fossiles.webp`

```
bold graphic fantasy illustration, clean confident ink outlines, cel shading with painted textures, vibrant warm palette, stylized expressive proportions, simplified features, collectible card art. still life, a single object in close-up, centered and filling the frame, resting on a dark worn wooden workbench in a dim workshop, a row of ancient stone fossil fangs set into a new jaw frame of pale green chitin, small rock fragments and fossil dust on the workbench, the object glowing with soft green bioluminescent light, dominant emerald and moss-green lighting, teal reflections, deep green-black shadows, no people, no text, no letters, no numbers, family-friendly --ar 5:7 --sref https://levixqcl.github.io/empreintes/art/personnages/yse.webp --sw 60 --no text, person, character, blood, gore, flesh, organ
```

### Cuir de récif — `cuir-recif.webp`

```
bold graphic fantasy illustration, clean confident ink outlines, cel shading with painted textures, vibrant warm palette, stylized expressive proportions, simplified features, collectible card art. still life, a single object in close-up, centered and filling the frame, resting on a dark worn wooden workbench in a dim workshop, a folded piece of thick rough hide textured like coral reef, teal and green, tiny coral polyps on its surface, wet and glistening, the object glowing with soft green bioluminescent light, dominant emerald and moss-green lighting, teal reflections, deep green-black shadows, no people, no text, no letters, no numbers, family-friendly --ar 5:7 --sref https://levixqcl.github.io/empreintes/art/personnages/yse.webp --sw 60 --no text, person, character, blood, gore, flesh, organ
```

### Glande d'ambre — `glande-ambre.webp`

```
bold graphic fantasy illustration, clean confident ink outlines, cel shading with painted textures, vibrant warm palette, stylized expressive proportions, simplified features, collectible card art. still life, a single object in close-up, centered and filling the frame, resting on a dark worn wooden workbench in a dim workshop, a small glass vial holding a glowing seed-like gland, thick honey-gold resin dripping from it and hardening into green-gold drops on the workbench, the object glowing with soft green bioluminescent light, dominant emerald and moss-green lighting, teal reflections, deep green-black shadows, no people, no text, no letters, no numbers, family-friendly --ar 5:7 --sref https://levixqcl.github.io/empreintes/art/personnages/yse.webp --sw 60 --no text, person, character, blood, gore, flesh, organ
```

### Grogner — `grogner.webp`

```
bold graphic fantasy illustration, clean confident ink outlines, cel shading with painted textures, vibrant warm palette, stylized expressive proportions, simplified features, collectible card art. still life, a single object in close-up, centered and filling the frame, resting on a dark worn wooden workbench in a dim workshop, a large spiral horn made of green chitin like a conch, deep green sound waves rippling out of its mouth, dust trembling off the workbench, the object glowing with soft green bioluminescent light, dominant emerald and moss-green lighting, teal reflections, deep green-black shadows, no people, no text, no letters, no numbers, family-friendly --ar 5:7 --sref https://levixqcl.github.io/empreintes/art/personnages/yse.webp --sw 60 --no text, person, character, blood, gore, flesh, organ
```

### Morsure — `morsure.webp`

```
bold graphic fantasy illustration, clean confident ink outlines, cel shading with painted textures, vibrant warm palette, stylized expressive proportions, simplified features, collectible card art. still life, a single object in close-up, centered and filling the frame, resting on a dark worn wooden workbench in a dim workshop, a pair of massive green chitin crusher mandibles like a giant crab claw, cracking open a huge mussel shell, the object glowing with soft green bioluminescent light, dominant emerald and moss-green lighting, teal reflections, deep green-black shadows, no people, no text, no letters, no numbers, family-friendly --ar 5:7 --sref https://levixqcl.github.io/empreintes/art/personnages/yse.webp --sw 60 --no text, person, character, blood, gore, flesh, organ
```

### Mue totale — `mue-totale.webp`

```
bold graphic fantasy illustration, clean confident ink outlines, cel shading with painted textures, vibrant warm palette, stylized expressive proportions, simplified features, collectible card art. still life, a single object in close-up, centered and filling the frame, resting on a dark worn wooden workbench in a dim workshop, an empty translucent shed husk of a whole crab-like carapace, split open along its back, soft green glow inside it, the object glowing with soft green bioluminescent light, dominant emerald and moss-green lighting, teal reflections, deep green-black shadows, no people, no text, no letters, no numbers, family-friendly --ar 5:7 --sref https://levixqcl.github.io/empreintes/art/personnages/yse.webp --sw 60 --no text, person, character, blood, gore, flesh, organ
```

### Poumons d'abysse — `poumons-abysse.webp`

```
bold graphic fantasy illustration, clean confident ink outlines, cel shading with painted textures, vibrant warm palette, stylized expressive proportions, simplified features, collectible card art. still life, a single object in close-up, centered and filling the frame, resting on a dark worn wooden workbench in a dim workshop, a diver's breathing apparatus grown from living green coral and kelp, two air bladders like seaweed floats, standing in a small water tank, the object glowing with soft green bioluminescent light, dominant emerald and moss-green lighting, teal reflections, deep green-black shadows, no people, no text, no letters, no numbers, family-friendly --ar 5:7 --sref https://levixqcl.github.io/empreintes/art/personnages/yse.webp --sw 60 --no text, person, character, blood, gore, flesh, organ
```

### Régénérer — `regenerer.webp`

```
bold graphic fantasy illustration, clean confident ink outlines, cel shading with painted textures, vibrant warm palette, stylized expressive proportions, simplified features, collectible card art. still life, a single object in close-up, centered and filling the frame, resting on a dark worn wooden workbench in a dim workshop, a steaming wooden bowl of glowing green algae soup with a wooden spoon, soft green healing vapor rising from it, the object glowing with soft green bioluminescent light, dominant emerald and moss-green lighting, teal reflections, deep green-black shadows, no people, no text, no letters, no numbers, family-friendly --ar 5:7 --sref https://levixqcl.github.io/empreintes/art/personnages/yse.webp --sw 60 --no text, person, character, blood, gore, flesh, organ
```

### Sang d'ambre — `sang-ambre.webp`

```
bold graphic fantasy illustration, clean confident ink outlines, cel shading with painted textures, vibrant warm palette, stylized expressive proportions, simplified features, collectible card art. still life, a single object in close-up, centered and filling the frame, resting on a dark worn wooden workbench in a dim workshop, a stoppered glass flask of thick glowing honey-gold liquid tinted green, a few drops on the workbench coagulating into small crystals, the object glowing with soft green bioluminescent light, dominant emerald and moss-green lighting, teal reflections, deep green-black shadows, no people, no text, no letters, no numbers, family-friendly --ar 5:7 --sref https://levixqcl.github.io/empreintes/art/personnages/yse.webp --sw 60 --no text, person, character, blood, gore, flesh, organ
```

### Yeux nocturnes — `yeux-nocturnes.webp`

```
bold graphic fantasy illustration, clean confident ink outlines, cel shading with painted textures, vibrant warm palette, stylized expressive proportions, simplified features, collectible card art. still life, a single object in close-up, centered and filling the frame, resting on a dark worn wooden workbench in a dim workshop, an owl-shaped half mask carved from dark teal-green chitin, its feather-like scales all green and teal, a pair of large round glowing golden owl eyes as the only warm color, catching the faintest light, the object glowing with soft green bioluminescent light, dominant emerald and moss-green lighting, teal reflections, deep green-black shadows, no people, no text, no letters, no numbers, family-friendly --ar 5:7 --sref https://levixqcl.github.io/empreintes/art/personnages/yse.webp --sw 60 --no text, person, character, blood, gore, flesh, organ, brown, rust, copper, red
```

## Cartes du district : lumière ivoire

Stimulant et Repli n'appartiennent à aucune lignée : lumière neutre, blanc ivoire et or pâle.

### Stimulant — `stimulant.webp`

```
bold graphic fantasy illustration, clean confident ink outlines, cel shading with painted textures, vibrant warm palette, stylized expressive proportions, simplified features, collectible card art. still life, a single object in close-up, centered and filling the frame, resting on a dark worn wooden workbench in a dim workshop, a district medic's small brass auto-injector with a glass vial of glowing pale ivory liquid, a soft wave of white light rippling out from it, a rolled bandage beside it, the object softly lit by pale ivory-white light with small touches of pale gold, neutral soft lighting, cool grey-blue shadows, no people, no text, no letters, no numbers, family-friendly --ar 5:7 --sref https://levixqcl.github.io/empreintes/art/personnages/yse.webp --sw 60 --no text, person, character, blood, needle
```

### Repli — `repli.webp`

```
bold graphic fantasy illustration, clean confident ink outlines, cel shading with painted textures, vibrant warm palette, stylized expressive proportions, simplified features, collectible card art. still life, a single object in close-up, centered and filling the frame, resting on a dark worn wooden workbench in a dim workshop, a battered round shield made from an old riveted manhole cover, a worn leather strap on its back, deep dents and scratches, propped upright, the object softly lit by pale ivory-white light with small touches of pale gold, neutral soft lighting, cool grey-blue shadows, no people, no text, no letters, no numbers, family-friendly --ar 5:7 --sref https://levixqcl.github.io/empreintes/art/personnages/yse.webp --sw 60 --no text, person, character, blood, needle
```


## Les voies, étape 1 (27 octobre 2026)

Les 14 cartes du Moteur, de la Carapace et du Chœur (`docs/familles-de-decks.md`). Même composition et mêmes lumières que leur lignée.

### Augmentés · Le Moteur

#### Bobine de récupération — `bobine-recuperation.webp`

```
bold graphic fantasy illustration, clean confident ink outlines, cel shading with painted textures, vibrant warm palette, stylized expressive proportions, simplified features, collectible card art. still life, a single object in close-up, centered and filling the frame, resting on a dark worn wooden workbench in a dim workshop, a forearm bracer wrapped with a tight coil of copper wire around a small blue crystal core, faint blue sparks crawling along the coil and flowing back into the crystal, the object glowing with cold blue light, dominant cold steel-blue and electric cyan lighting, blue rim light, deep navy shadows, no people, no text, no letters, no numbers, family-friendly --ar 5:7 --sref https://levixqcl.github.io/empreintes/art/personnages/yse.webp --sw 60 --no text, person, character
```

#### Condensateur — `condensateur.webp`

```
bold graphic fantasy illustration, clean confident ink outlines, cel shading with painted textures, vibrant warm palette, stylized expressive proportions, simplified features, collectible card art. still life, a single object in close-up, centered and filling the frame, resting on a dark worn wooden workbench in a dim workshop, a sturdy glass cylinder capped with riveted steel ends, a small blue lightning bolt trapped and curling inside it, a worn leather belt clip on its side, the object glowing with cold blue light, dominant cold steel-blue and electric cyan lighting, blue rim light, deep navy shadows, no people, no text, no letters, no numbers, family-friendly --ar 5:7 --sref https://levixqcl.github.io/empreintes/art/personnages/yse.webp --sw 60 --no text, person, character
```

#### Décharge d’arc — `decharge-arc.webp`

```
bold graphic fantasy illustration, clean confident ink outlines, cel shading with painted textures, vibrant warm palette, stylized expressive proportions, simplified features, collectible card art. still life, a single object in close-up, centered and filling the frame, resting on a dark worn wooden workbench in a dim workshop, a mechanical gauntlet with an open palm vent, a violent arc of blue-white lightning bursting out of it in one crackling discharge, empty glass gauges on the wrist, the object glowing with cold blue light, dominant cold steel-blue and electric cyan lighting, blue rim light, deep navy shadows, no people, no text, no letters, no numbers, family-friendly --ar 5:7 --sref https://levixqcl.github.io/empreintes/art/personnages/yse.webp --sw 60 --no text, person, character
```

#### Éclair captif — `eclair-captif.webp`

```
bold graphic fantasy illustration, clean confident ink outlines, cel shading with painted textures, vibrant warm palette, stylized expressive proportions, simplified features, collectible card art. still life, a single object in close-up, centered and filling the frame, resting on a dark worn wooden workbench in a dim workshop, a heavy glass sphere held in a brass cage, a restless blue lightning bolt coiled inside like a caged creature pressing against the glass, tiny cracks of light on the surface, the object glowing with cold blue light, dominant cold steel-blue and electric cyan lighting, blue rim light, deep navy shadows, no people, no text, no letters, no numbers, family-friendly --ar 5:7 --sref https://levixqcl.github.io/empreintes/art/personnages/yse.webp --sw 60 --no text, person, character
```

#### Noyau instable — `noyau-instable.webp`

```
bold graphic fantasy illustration, clean confident ink outlines, cel shading with painted textures, vibrant warm palette, stylized expressive proportions, simplified features, collectible card art. still life, a single object in close-up, centered and filling the frame, resting on a dark worn wooden workbench in a dim workshop, a massive old machine core of blackened steel plates, a blinding blue crystal heart showing through gaps between the plates, loose bolts and small arcs of energy escaping, heavy and dangerous, the object glowing with cold blue light, dominant cold steel-blue and electric cyan lighting, blue rim light, deep navy shadows, no people, no text, no letters, no numbers, family-friendly --ar 5:7 --sref https://levixqcl.github.io/empreintes/art/personnages/yse.webp --sw 60 --no text, person, character
```

### Génés · La Carapace

#### Coup d’épaule — `coup-epaule.webp`

```
bold graphic fantasy illustration, clean confident ink outlines, cel shading with painted textures, vibrant warm palette, stylized expressive proportions, simplified features, collectible card art. still life, a single object in close-up, centered and filling the frame, resting on a dark worn wooden workbench in a dim workshop, a thick shoulder pauldron grown from layered dark green chitin plates, knobbed and scarred like a beetle shell, a soft green glow between the plates, a cracked stone block beside it, the object glowing with soft green bioluminescent light, dominant emerald and moss-green lighting, teal reflections, deep green-black shadows, no people, no text, no letters, no numbers, family-friendly --ar 5:7 --sref https://levixqcl.github.io/empreintes/art/personnages/yse.webp --sw 60 --no text, person, character, blood, gore, flesh, organ
```

#### Queue-massue — `queue-massue.webp`

```
bold graphic fantasy illustration, clean confident ink outlines, cel shading with painted textures, vibrant warm palette, stylized expressive proportions, simplified features, collectible card art. still life, a single object in close-up, centered and filling the frame, resting on a dark worn wooden workbench in a dim workshop, a heavy curled tail of bone and teal-green chitin ending in a rounded knobbed club, glowing green ridges along its length, resting coiled on the workbench, the object glowing with soft green bioluminescent light, dominant emerald and moss-green lighting, teal reflections, deep green-black shadows, no people, no text, no letters, no numbers, family-friendly --ar 5:7 --sref https://levixqcl.github.io/empreintes/art/personnages/yse.webp --sw 60 --no text, person, character, blood, gore, flesh, organ
```

#### Bélier d’os — `belier-os.webp`

```
bold graphic fantasy illustration, clean confident ink outlines, cel shading with painted textures, vibrant warm palette, stylized expressive proportions, simplified features, collectible card art. still life, a single object in close-up, centered and filling the frame, resting on a dark worn wooden workbench in a dim workshop, a massive ram-like head crest of fused pale bone and green chitin, thick and curved like a battering ram, glowing green veins of light under the surface, a dented iron plate beside it, the object glowing with soft green bioluminescent light, dominant emerald and moss-green lighting, teal reflections, deep green-black shadows, no people, no text, no letters, no numbers, family-friendly --ar 5:7 --sref https://levixqcl.github.io/empreintes/art/personnages/yse.webp --sw 60 --no text, person, character, blood, gore, flesh, organ
```

#### Retour de marée — `retour-maree.webp`

```
bold graphic fantasy illustration, clean confident ink outlines, cel shading with painted textures, vibrant warm palette, stylized expressive proportions, simplified features, collectible card art. still life, a single object in close-up, centered and filling the frame, resting on a dark worn wooden workbench in a dim workshop, a large round shell shield of dark green chitin, a frozen wave of glowing teal water curling over its rim as if about to crash back, small pebbles and seaweed around it, the object glowing with soft green bioluminescent light, dominant emerald and moss-green lighting, teal reflections, deep green-black shadows, no people, no text, no letters, no numbers, family-friendly --ar 5:7 --sref https://levixqcl.github.io/empreintes/art/personnages/yse.webp --sw 60 --no text, person, character, blood, gore, flesh, organ
```

### Résonants · Le Chœur

#### Diapason de cristal — `diapason-cristal.webp`

```
bold graphic fantasy illustration, clean confident ink outlines, cel shading with painted textures, vibrant warm palette, stylized expressive proportions, simplified features, collectible card art. still life, a single object in close-up, centered and filling the frame, resting on a dark worn wooden workbench in a dim workshop, a slender tuning fork of clear colorless glass standing on a small square of black velvet, just struck, sharp violet ripples bending the air around its prongs, two small gilded tuning forks beside it trembling in sympathy, dominant amethyst and violet lighting with rich gold accents, lavender rim light, deep indigo shadows, no people, no text, no letters, no numbers, family-friendly --ar 5:7 --sref https://levixqcl.github.io/empreintes/art/personnages/yse.webp --sw 60 --no text, person, character
```

#### Voix basse — `voix-basse.webp`

```
bold graphic fantasy illustration, clean confident ink outlines, cel shading with painted textures, vibrant warm palette, stylized expressive proportions, simplified features, collectible card art. still life, a single object in close-up, centered and filling the frame, resting on a dark worn wooden workbench in a dim workshop, a wide low crystal bowl of deep violet, a single slow heavy ring of sound light rising from it, the workbench dust trembling in a perfect circle around it, the object glowing with violet light, dominant amethyst and violet lighting, lavender rim light, deep indigo shadows, no people, no text, no letters, no numbers, family-friendly --ar 5:7 --sref https://levixqcl.github.io/empreintes/art/personnages/yse.webp --sw 60 --no text, person, character
```

#### Chorale des ombres — `chorale-ombres.webp`

```
bold graphic fantasy illustration, clean confident ink outlines, cel shading with painted textures, vibrant warm palette, stylized expressive proportions, simplified features, collectible card art. still life, a single object in close-up, centered and filling the frame, resting on a dark worn wooden workbench in a dim workshop, a cluster of small violet crystal pipes like a tiny organ, every pipe glowing with the same note, soft violet shadows swaying on the wall behind it like a choir, the object glowing with violet light, dominant amethyst and violet lighting, lavender rim light, deep indigo shadows, no people, no text, no letters, no numbers, family-friendly --ar 5:7 --sref https://levixqcl.github.io/empreintes/art/personnages/yse.webp --sw 60 --no text, person, character
```

#### Cloche des abysses — `cloche-abysses.webp`

```
bold graphic fantasy illustration, clean confident ink outlines, cel shading with painted textures, vibrant warm palette, stylized expressive proportions, simplified features, collectible card art. still life, a single object in close-up, centered and filling the frame, resting on a dark worn wooden workbench in a dim workshop, an old bronze bell crusted with strange spiral seashells and violet crystals, hanging from a small wooden frame, a deep violet ring of sound light pulsing out from its rim, the object glowing with violet light, dominant amethyst and violet lighting, lavender rim light, deep indigo shadows, no people, no text, no letters, no numbers, family-friendly --ar 5:7 --sref https://levixqcl.github.io/empreintes/art/personnages/yse.webp --sw 60 --no text, person, character
```

#### Grand unisson — `grand-unisson.webp`

```
bold graphic fantasy illustration, clean confident ink outlines, cel shading with painted textures, vibrant warm palette, stylized expressive proportions, simplified features, collectible card art. still life, a single object in close-up, centered and filling the frame, resting on a dark worn wooden workbench in a dim workshop, a large ornate gilded wind chime hanging from a small dark wooden stand, many slender golden tubes all ringing together, violet sound waves rising from every tube and merging into one single wide ring of light above it, dominant amethyst and violet lighting with rich gold accents, lavender rim light, deep indigo shadows, no people, no text, no letters, no numbers, family-friendly --ar 5:7 --sref https://levixqcl.github.io/empreintes/art/personnages/yse.webp --sw 60 --no text, person, character, crystal, gemstone, amethyst rock
```

## L’Héritage du district (27 octobre 2026) : cartes légendaires

Les dix vierges de l'ancienne directrice (`docs/heritage-du-district.md`). Bryan : elles doivent être **légendaires**.
Premier essai raté (Bryan, capture) : le « coffre ancien », le « sceau doré » et le « filigrane d'or » tiraient tout vers l'orange
et le brun, et l'objet restait un objet de brocante (un gramophone, un cachet). Donc :
- **un objet impossible, qui lévite** au-dessus du coffre ouvert doublé de nacre : la magie est le sujet, pas l'objet ;
- **la couleur de la lignée baigne toute la scène** ; l'or n'est qu'une touche (sauf chez les Résonants, pourpre et or) ;
- pour ces dix cartes seulement, le `--no` interdit à nouveau « sepia, brown, orange » et « mundane » ;
- rien de religieux (pas d'autel, de cierge ni de symbole sacré).
Format habituel : 600 × 848, dans `public/art/modules/<id>.webp` (la Clé de l’Héritage : `cle-legs.webp`).

### Augmentés

#### Foulée de la directrice — `foulee-directrice.webp`

```
bold graphic fantasy illustration, clean confident ink outlines, cel shading with painted textures, vibrant warm palette, stylized expressive proportions, simplified features, collectible card art. legendary artifact, a single impossible magical object levitating above an open dark chest lined with pale pearl-white satin, the inside of the chest glowing with the same color as the object, centered and filling the frame, a pair of winged boots made of pearl-white alloy and blue light, their soles burning with blue crystal fire, a trail of glowing blue footprints spiraling through the air around them, bathed in intense cold blue light that tints the whole scene, electric cyan energy swirling around it, small touches of gold, deep navy shadows, iridescent mother-of-pearl surfaces, a small broken wax seal on the edge of the chest, epic, awe-inspiring, ornate masterpiece detail, no people, no text, no letters, no numbers, family-friendly --ar 5:7 --sref https://levixqcl.github.io/empreintes/art/personnages/yse.webp --sw 60 --no text, person, character, sepia, brown, orange, mundane
```

#### Bras de la Fonderie — `bras-fonderie.webp`

```
bold graphic fantasy illustration, clean confident ink outlines, cel shading with painted textures, vibrant warm palette, stylized expressive proportions, simplified features, collectible card art. legendary artifact, a single impossible magical object levitating above an open dark chest lined with pale pearl-white satin, the inside of the chest glowing with the same color as the object, centered and filling the frame, a colossal mechanical fist of dark steel and mother-of-pearl, its seams pouring blue molten light, lightning crackling between its knuckles, hovering like a meteor about to strike, bathed in intense cold blue light that tints the whole scene, electric cyan energy swirling around it, small touches of gold, deep navy shadows, iridescent mother-of-pearl surfaces, a small broken wax seal on the edge of the chest, epic, awe-inspiring, ornate masterpiece detail, no people, no text, no letters, no numbers, family-friendly --ar 5:7 --sref https://levixqcl.github.io/empreintes/art/personnages/yse.webp --sw 60 --no text, person, character, sepia, brown, orange, mundane
```

#### Cœur de la Glacière — `coeur-glaciere.webp`

```
bold graphic fantasy illustration, clean confident ink outlines, cel shading with painted textures, vibrant warm palette, stylized expressive proportions, simplified features, collectible card art. legendary artifact, a single impossible magical object levitating above an open dark chest lined with pale pearl-white satin, the inside of the chest glowing with the same color as the object, centered and filling the frame, a mechanical heart of frozen glass and pearl-white metal beating with a blue lightning storm inside, shards of ice orbiting around it, frost blooming in the air, bathed in intense cold blue light that tints the whole scene, electric cyan energy swirling around it, small touches of gold, deep navy shadows, iridescent mother-of-pearl surfaces, a small broken wax seal on the edge of the chest, epic, awe-inspiring, ornate masterpiece detail, no people, no text, no letters, no numbers, family-friendly --ar 5:7 --sref https://levixqcl.github.io/empreintes/art/personnages/yse.webp --sw 60 --no text, person, character, sepia, brown, orange, mundane
```

### Génés

#### Carapace des Fondations — `carapace-fondations.webp`

```
bold graphic fantasy illustration, clean confident ink outlines, cel shading with painted textures, vibrant warm palette, stylized expressive proportions, simplified features, collectible card art. legendary artifact, a single impossible magical object levitating above an open dark chest lined with pale pearl-white satin, the inside of the chest glowing with the same color as the object, centered and filling the frame, a giant shell shield of glowing green chitin and mother-of-pearl, a shimmering dome of green energy projected around it, countless healed scars glowing like veins of light, bathed in intense emerald green light that tints the whole scene, teal bioluminescent energy swirling around it, small touches of gold, deep green-black shadows, iridescent mother-of-pearl surfaces, a small broken wax seal on the edge of the chest, epic, awe-inspiring, ornate masterpiece detail, no people, no text, no letters, no numbers, family-friendly --ar 5:7 --sref https://levixqcl.github.io/empreintes/art/personnages/yse.webp --sw 60 --no text, person, character, sepia, brown, orange, mundane, blood, gore, flesh, organ
```

#### Œil de la Grande Nuit — `oeil-grande-nuit.webp`

```
bold graphic fantasy illustration, clean confident ink outlines, cel shading with painted textures, vibrant warm palette, stylized expressive proportions, simplified features, collectible card art. legendary artifact, a single impossible magical object levitating above an open dark chest lined with pale pearl-white satin, the inside of the chest glowing with the same color as the object, centered and filling the frame, a black pearl shaped like an eye with a glowing green-gold predator slit, set in a crown of teal chitin thorns, a halo of luminous night moths orbiting it, beams of green light piercing the darkness, bathed in intense emerald green light that tints the whole scene, teal bioluminescent energy swirling around it, small touches of gold, deep green-black shadows, iridescent mother-of-pearl surfaces, a small broken wax seal on the edge of the chest, epic, awe-inspiring, ornate masterpiece detail, no people, no text, no letters, no numbers, family-friendly --ar 5:7 --sref https://levixqcl.github.io/empreintes/art/personnages/yse.webp --sw 60 --no text, person, character, sepia, brown, orange, mundane, blood, gore, flesh, organ
```

#### Première mue — `premiere-mue.webp`

```
bold graphic fantasy illustration, clean confident ink outlines, cel shading with painted textures, vibrant warm palette, stylized expressive proportions, simplified features, collectible card art. legendary artifact, a single impossible magical object levitating above an open dark chest lined with pale pearl-white satin, the inside of the chest glowing with the same color as the object, centered and filling the frame, the translucent shed skin of a mythical serpent unfolding in the air like a glowing ribbon of mother-of-pearl, green life-light pulsing through it, flowers and sprouts blooming wherever its light falls, bathed in intense emerald green light that tints the whole scene, teal bioluminescent energy swirling around it, small touches of gold, deep green-black shadows, iridescent mother-of-pearl surfaces, a small broken wax seal on the edge of the chest, epic, awe-inspiring, ornate masterpiece detail, no people, no text, no letters, no numbers, family-friendly --ar 5:7 --sref https://levixqcl.github.io/empreintes/art/personnages/yse.webp --sw 60 --no text, person, character, sepia, brown, orange, mundane, blood, gore, flesh, organ
```

### Résonants

#### Lanterne de la première Lecture — `lanterne-lecture.webp`

```
bold graphic fantasy illustration, clean confident ink outlines, cel shading with painted textures, vibrant warm palette, stylized expressive proportions, simplified features, collectible card art. legendary artifact, a single impossible magical object levitating above an open dark chest lined with pale pearl-white satin, the inside of the chest glowing with the same color as the object, centered and filling the frame, a lantern of mother-of-pearl and gold whose violet flame casts a floating staircase of glowing violet steps rising into the dark, bathed in intense amethyst and violet light that tints the whole scene, violet energy swirling around it, rich gold accents, deep indigo shadows, iridescent mother-of-pearl surfaces, a small broken wax seal on the edge of the chest, epic, awe-inspiring, ornate masterpiece detail, no people, no text, no letters, no numbers, family-friendly --ar 5:7 --sref https://levixqcl.github.io/empreintes/art/personnages/yse.webp --sw 60 --no text, person, character, sepia, brown, orange, mundane, crystal, gemstone, amethyst rock
```

#### Sceau volé aux Orsève — `sceau-orseve.webp`

```
bold graphic fantasy illustration, clean confident ink outlines, cel shading with painted textures, vibrant warm palette, stylized expressive proportions, simplified features, collectible card art. legendary artifact, a single impossible magical object levitating above an open dark chest lined with pale pearl-white satin, the inside of the chest glowing with the same color as the object, centered and filling the frame, a giant aristocratic signet seal of mother-of-pearl and gold, its stamp face blazing with a violet emblem of a closed eye, violet wax droplets frozen in mid-air around it, an elegant torn silk ribbon floating beside it, bathed in intense amethyst and violet light that tints the whole scene, violet energy swirling around it, rich gold accents, deep indigo shadows, iridescent mother-of-pearl surfaces, a small broken wax seal on the edge of the chest, epic, awe-inspiring, ornate masterpiece detail, no people, no text, no letters, no numbers, family-friendly --ar 5:7 --sref https://levixqcl.github.io/empreintes/art/personnages/yse.webp --sw 60 --no text, person, character, sepia, brown, orange, mundane, crystal, gemstone, amethyst rock
```

#### Voix du quartier — `voix-quartier.webp`

```
bold graphic fantasy illustration, clean confident ink outlines, cel shading with painted textures, vibrant warm palette, stylized expressive proportions, simplified features, collectible card art. legendary artifact, a single impossible magical object levitating above an open dark chest lined with pale pearl-white satin, the inside of the chest glowing with the same color as the object, centered and filling the frame, a spiraling horn of mother-of-pearl shaped like a giant seashell, hundreds of glowing violet ribbons of sound flowing into it from every direction and bursting out of its mouth as one single shining wave, bathed in intense amethyst and violet light that tints the whole scene, violet energy swirling around it, rich gold accents, deep indigo shadows, iridescent mother-of-pearl surfaces, a small broken wax seal on the edge of the chest, epic, awe-inspiring, ornate masterpiece detail, no people, no text, no letters, no numbers, family-friendly --ar 5:7 --sref https://levixqcl.github.io/empreintes/art/personnages/yse.webp --sw 60 --no text, person, character, sepia, brown, orange, mundane, crystal, gemstone, amethyst rock
```

### Le district

#### Clé de l’Héritage — `cle-legs.webp`

```
bold graphic fantasy illustration, clean confident ink outlines, cel shading with painted textures, vibrant warm palette, stylized expressive proportions, simplified features, collectible card art. legendary artifact, a single impossible magical object levitating above an open dark chest lined with pale pearl-white satin, the inside of the chest glowing with the same color as the object, centered and filling the frame, a giant key of mother-of-pearl and pale gold, its bow shaped like a tower on stilts above water, slowly turning in the air, a keyhole of pure white light opening in the darkness before it, bathed in soft ivory-white and pale gold light that tints the whole scene, pearly white energy swirling around it, cool grey-blue shadows, iridescent mother-of-pearl surfaces, a small broken wax seal on the edge of the chest, epic, awe-inspiring, ornate masterpiece detail, no people, no text, no letters, no numbers, family-friendly --ar 5:7 --sref https://levixqcl.github.io/empreintes/art/personnages/yse.webp --sw 60 --no text, person, character, sepia, brown, orange, mundane
```
