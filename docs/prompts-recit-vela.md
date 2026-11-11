# Prompts Midjourney — le Récit de Véla (Pack des origines, 11 novembre 2026)

Douze images, une par plan du Récit (`VELA` dans src/ui/recits.ts), à déposer dans `public/intro/vela-01.webp` à `vela-12.webp`
(816 × 1456, 9:16), puis à ajouter à `IMAGES_DISPONIBLES` dans src/ui/intro.ts. Tant qu'une image manque, le plan montre sa scène dessinée en code.

- Style : celui de l'intro et des autres Récits (les deux --sref). Midjourney 8.2 : pas de --oref ; le portrait de Véla est déjà en tête de prompt (référence d'image) : `art/references/vela-jeune.webp` (l'image 07) pour Véla à 19 ans (01 à 06), le portrait `art/porteurs/vela.webp` ensuite.

✓ vela-07 dans le jeu (11 novembre 2026), gardée comme référence de Véla jeune.
- Véla : **19 ans en 2097**, 33 ans en 2111, 43 ans en 2121. **Pas de mèche d'or aux images 1 à 5** (avant la greffe) ; la mèche d'or apparaît à l'image 6 et ne la quitte plus. Carré foncé aux épaules, cape ocre, lanterne à flamme violette.
- Sa mère : même visage, cheveux foncés qui grisonnent. Corvin : vieil homme aux cheveux blancs avec une mèche d'or.
- Doran (images 8, 10, 12) reste petit ou de dos : le récit de Véla ne le nomme jamais.
- Rien de gore : la mort de Corvin est un homme qui dort, la greffe un fin bandage.
- Laisser le tiers bas calme : les sous-titres s'y posent (le texte se met en haut aux plans 4, 6, 8 et 10 : y laisser le tiers haut calme).

## vela-01 — Corvin
```
https://levixqcl.github.io/empreintes/art/references/vela-jeune.webp bold graphic fantasy illustration, clean confident ink outlines, cel shading with painted textures, vibrant warm palette, stylized expressive proportions, simplified features, collectible card art. a tiny low room in the lower levels at night lit by a single candle, an old frail man lying in a narrow bed, white hair with a single bright metallic gold streak, eyes closed, peaceful, a slender young woman of nineteen with light olive skin, brown eyes and a dark shoulder-length bob, no gold in her hair, worn ochre work clothes of a crystal digger sitting on the floor beside the bed holding his hand, on the wall behind them the fading shadow of a long serpentine dragon dissolving into the dark, warm candle glow and deep blue shadows, tender and quiet, no injury visible, calm empty lower third, family-friendly --ar 9:16 --sref https://levixqcl.github.io/empreintes/intro/10-cuvette.webp https://levixqcl.github.io/empreintes/intro/09-oubli.webp --no text, letters, words, numbers, blood, gore, religious motifs
```

## vela-02 — Copie de district
```
https://levixqcl.github.io/empreintes/art/references/vela-jeune.webp bold graphic fantasy illustration, clean confident ink outlines, cel shading with painted textures, vibrant warm palette, stylized expressive proportions, simplified features, collectible card art. early morning in front of a small district clinic built on pillars over dark water, a plain paper notice pinned by the door with no readable writing, a few neighbours reading it, a slender young woman of nineteen with light olive skin, brown eyes and a dark shoulder-length bob, no gold in her hair, worn ochre work clothes of a crystal digger standing in front of it, beside her an older tired woman with the same face and greying dark hair holding her by the arm and shaking her head, golden pink dawn light, tense and hopeful, calm empty lower third, family-friendly --ar 9:16 --sref https://levixqcl.github.io/empreintes/intro/10-cuvette.webp https://levixqcl.github.io/empreintes/intro/09-oubli.webp --no text, letters, words, numbers, blood, gore, religious motifs
```

## vela-03 — Soixante
```
https://levixqcl.github.io/empreintes/art/references/vela-jeune.webp bold graphic fantasy illustration, clean confident ink outlines, cel shading with painted textures, vibrant warm palette, stylized expressive proportions, simplified features, collectible card art. close-up on an open young hand, palm up, a small pale violet crystal stone resting in it and glowing softly, behind it out of focus a long queue of dozens of young faces watching, a woman in a plain clinic coat holding the hand from below, a slender young woman of nineteen with light olive skin, brown eyes and a dark shoulder-length bob, no gold in her hair, worn ochre work clothes of a crystal digger only partly visible, soft violet glow, hushed and amazed, calm empty lower third, family-friendly --ar 9:16 --sref https://levixqcl.github.io/empreintes/intro/10-cuvette.webp https://levixqcl.github.io/empreintes/intro/09-oubli.webp --no text, letters, words, numbers, blood, gore, religious motifs
```

## vela-04 — Une seule nuit
```
https://levixqcl.github.io/empreintes/art/references/vela-jeune.webp bold graphic fantasy illustration, clean confident ink outlines, cel shading with painted textures, vibrant warm palette, stylized expressive proportions, simplified features, collectible card art. a plain clinic room at night, a slender young woman of nineteen with light olive skin, brown eyes and a dark shoulder-length bob, no gold in her hair, worn ochre work clothes of a crystal digger asleep on her side on a narrow bed, a small violet crystal held against the back of her neck by a soft ribbon, behind a large window a crowd of silhouettes waiting quietly in the dark street with small lamps, cold blue night and one warm lamp, suspended and anxious, calm empty upper third, family-friendly --ar 9:16 --sref https://levixqcl.github.io/empreintes/intro/10-cuvette.webp https://levixqcl.github.io/empreintes/intro/09-oubli.webp --no text, letters, words, numbers, blood, gore, religious motifs
```

## vela-05 — La Nuit blanche
```
https://levixqcl.github.io/empreintes/art/references/vela-jeune.webp bold graphic fantasy illustration, clean confident ink outlines, cel shading with painted textures, vibrant warm palette, stylized expressive proportions, simplified features, collectible card art. a small clinic room at night lit by one candle, a slender young woman of nineteen with light olive skin, brown eyes and a dark shoulder-length bob, no gold in her hair, worn ochre work clothes of a crystal digger sitting up in bed wide awake with a thin bandage at the base of her skull, an older tired woman with greying dark hair sitting on a chair close to the bed, leaning forward and telling her a story with her hands, the door half open behind her, warm candle light, tender and serious, no injury visible, calm empty lower third, family-friendly --ar 9:16 --sref https://levixqcl.github.io/empreintes/intro/10-cuvette.webp https://levixqcl.github.io/empreintes/intro/09-oubli.webp --no text, letters, words, numbers, blood, gore, religious motifs
```

## vela-06 — C'est toujours toi
```
https://levixqcl.github.io/empreintes/art/references/vela-jeune.webp bold graphic fantasy illustration, clean confident ink outlines, cel shading with painted textures, vibrant warm palette, stylized expressive proportions, simplified features, collectible card art. a small room lit by one candle, on the bare wall a large shadow of a long serpentine flying dragon where the young woman's shadow should be, a slender young woman of nineteen with light olive skin, brown eyes and a dark shoulder-length bob with a single bright metallic gold streak falling from the crown, ochre hooded cloak sitting on the edge of the bed in profile, an older woman with greying dark hair seen from behind sitting next to her, looking at her, warm candle light and violet glow on the wall, quiet wonder, calm empty upper third, family-friendly --ar 9:16 --sref https://levixqcl.github.io/empreintes/intro/10-cuvette.webp https://levixqcl.github.io/empreintes/intro/09-oubli.webp --no text, letters, words, numbers, blood, gore, religious motifs
```

## vela-07 — Sans harnais
```
https://levixqcl.github.io/empreintes/art/porteurs/vela.webp bold graphic fantasy illustration, clean confident ink outlines, cel shading with painted textures, vibrant warm palette, stylized expressive proportions, simplified features, collectible card art. dawn high between two towers on pillars above the sea, a slender young woman of nineteen with light olive skin, brown eyes and a dark shoulder-length bob with a single bright metallic gold streak falling from the crown, ochre hooded cloak walking along a thick steel cable without any harness, arms slightly open, an unhooked harness left hanging on the tower behind her, an old iron lantern with a soft violet flame at her belt, huge drop below with tiny footbridges and water, golden dawn light, free and dizzying, calm empty lower third, family-friendly --ar 9:16 --sref https://levixqcl.github.io/empreintes/intro/10-cuvette.webp https://levixqcl.github.io/empreintes/intro/09-oubli.webp --no text, letters, words, numbers, blood, gore, religious motifs
```

## vela-08 — Les paniers
```
https://levixqcl.github.io/empreintes/art/porteurs/vela.webp bold graphic fantasy illustration, clean confident ink outlines, cel shading with painted textures, vibrant warm palette, stylized expressive proportions, simplified features, collectible card art. night, seen from high above, a slender woman of thirty-three with light olive skin, a dark shoulder-length bob with a single bright metallic gold streak falling from the crown, ochre hooded cloak hanging from cables between dark concrete pillars without a harness, an old iron lantern with a soft violet flame at her belt, lowering a wicker basket of bread on a long rope toward the black water far below, at the bottom a tiny broad-shouldered diver treading water and looking up at her light, her lantern casting a long serpentine dragon shadow on the water, warm lantern glow on black water, quiet and moving, calm empty upper third, family-friendly --ar 9:16 --sref https://levixqcl.github.io/empreintes/intro/10-cuvette.webp https://levixqcl.github.io/empreintes/intro/09-oubli.webp --no text, letters, words, numbers, blood, gore, religious motifs
```

## vela-09 — La place de Corvin
```
https://levixqcl.github.io/empreintes/art/porteurs/vela.webp bold graphic fantasy illustration, clean confident ink outlines, cel shading with painted textures, vibrant warm palette, stylized expressive proportions, simplified features, collectible card art. a narrow crowded stall in the lower market, a slender woman of thirty-three with light olive skin, a dark shoulder-length bob with a single bright metallic gold streak falling from the crown, ochre hooded cloak sitting at a small worn table with her eyes closed, a small crystal held against her temple, facing her a crystal digger covered in grey dust waiting, an old faded sign above the stall, shelves of small crystals glowing faintly, warm amber light, calm and focused, calm empty lower third, family-friendly --ar 9:16 --sref https://levixqcl.github.io/empreintes/intro/10-cuvette.webp https://levixqcl.github.io/empreintes/intro/09-oubli.webp --no text, letters, words, numbers, blood, gore, religious motifs
```

## vela-10 — Ce qu'elle a vu
```
https://levixqcl.github.io/empreintes/art/porteurs/vela.webp bold graphic fantasy illustration, clean confident ink outlines, cel shading with painted textures, vibrant warm palette, stylized expressive proportions, simplified features, collectible card art. night, high above dark flood water between two concrete pillars, a slender woman of thirty-three with light olive skin, a dark shoulder-length bob with a single bright metallic gold streak falling from the crown, ochre hooded cloak clinging to cables under a broken rusty footbridge, holding an old iron lantern with a soft violet flame down at arm's length, below her in the water a tiny heavyset bearded man with teal chitin on his shoulders raising a brass signal lamp, three bright flashes beaming toward a distant pump station, a girl with short dark hair visible only from the shoulders up beside him, her face lit from above, she understands and is silent, cold teal moonlight and warm violet lantern glow, heavy and silent, no injury visible, calm empty upper third, family-friendly --ar 9:16 --sref https://levixqcl.github.io/empreintes/intro/10-cuvette.webp https://levixqcl.github.io/empreintes/intro/09-oubli.webp --no text, letters, words, numbers, blood, gore, religious motifs
```

## vela-11 — Pas sa peur
```
https://levixqcl.github.io/empreintes/art/porteurs/vela.webp bold graphic fantasy illustration, clean confident ink outlines, cel shading with painted textures, vibrant warm palette, stylized expressive proportions, simplified features, collectible card art. night in a small bedroom, a slender woman of forty-three with light olive skin, a dark shoulder-length bob with a single bright metallic gold streak falling from the crown, ochre hooded cloak sitting up in bed, startled awake, one hand on her chest, an old iron lantern with a soft violet flame just lit on the bedside table with a perfectly still flame, on the wall her shadow of a long serpentine dragon trembling and blurred, deep blue night through a small window, uneasy and strange, calm empty lower third, family-friendly --ar 9:16 --sref https://levixqcl.github.io/empreintes/intro/10-cuvette.webp https://levixqcl.github.io/empreintes/intro/09-oubli.webp --no text, letters, words, numbers, blood, gore, religious motifs
```

## vela-12 — Le même
```
https://levixqcl.github.io/empreintes/art/porteurs/vela.webp bold graphic fantasy illustration, clean confident ink outlines, cel shading with painted textures, vibrant warm palette, stylized expressive proportions, simplified features, collectible card art. dawn, deep under the pumps of a district, seen from behind, a slender woman of forty-three with light olive skin, a dark shoulder-length bob with a single bright metallic gold streak falling from the crown, ochre hooded cloak holding up an old iron lantern with a soft violet flame, standing beside a very broad heavyset man in his fifties with short grey hair, grey beard and teal-green chitin plates on his shoulders, his palm laid flat on the smooth curved ancient stone beside a freshly opened dark round doorway, the lantern casting a trembling serpentine dragon shadow on the curved wall, a faint blue glow from inside, solemn and hushed, calm empty lower third, family-friendly --ar 9:16 --sref https://levixqcl.github.io/empreintes/intro/10-cuvette.webp https://levixqcl.github.io/empreintes/intro/09-oubli.webp --no text, letters, words, numbers, blood, gore, religious motifs
```
