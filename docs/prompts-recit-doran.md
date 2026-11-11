# Prompts Midjourney — le Récit de Doran (Pack des origines, 11 novembre 2026)

✓ Sept images dans le jeu (11 novembre 2026) : 01 à 06 et 10. **07, 08 et 09 à refaire** : Doran n'y ressemblait pas (visage fin, barbe courte). Pour Doran jeune, joindre `public/art/references/doran-jeune.webp` (l'image 06) plutôt que le portrait âgé.

Dix images, une par plan du Récit (`DORAN` dans src/ui/recits.ts), à déposer dans `public/intro/doran-01.webp` à `doran-10.webp`
(816 × 1456, 9:16), puis à ajouter à `IMAGES_DISPONIBLES` dans src/ui/intro.ts. Tant qu'une image manque, le plan montre sa scène dessinée en code.

- Style : celui de l'intro et du Récit d'Ilka (les deux --sref ci-dessous). Midjourney 8.2 : pas de --oref ; joindre le portrait comme référence d'image.
- Doran : joindre `public/art/porteurs/doran.webp`. **25 ans en 2094** (cheveux et barbe foncés, **pas encore de chitine** aux images 1 et 2), 30 ans en 2099, **42 ans en 2111** (il grisonne), 52 ans en 2121 (gris).
- La chitine est **vert-bleu**, aux épaules et aux avant-bras, jamais sur le visage.
- La silhouette à la lanterne (images 7 et 9) est Véla : on ne voit **jamais son visage**, seulement la lanterne et une ombre de dragon serpentin sur l'eau.
- Rien de gore : la mort du père est un homme assis, de dos ; la Mue, des draps humides et de la buée.
- Laisser le tiers bas calme : les sous-titres s'y posent (le texte se met en haut aux plans 2, 4, 7 et 9 : y laisser le tiers haut calme).

## doran-01 — La phrase de mon père
```
bold graphic fantasy illustration, clean confident ink outlines, cel shading with painted textures, vibrant warm palette, stylized expressive proportions, simplified features, collectible card art. a tiny kitchen in a shelter-site home at night, seen from the doorway, an old worn man sitting on a stool facing a bare concrete wall as if listening to something behind it, seen from behind, a broad-shouldered young man of twenty-five with short thick dark hair and a short dark beard and work clothes dusty from carrying beams standing in the doorway watching him, one warm oil lamp, cold blue night through a small window, quiet and heavy, calm empty lower third, family-friendly --ar 9:16 --sref https://levixqcl.github.io/empreintes/intro/10-cuvette.webp https://levixqcl.github.io/empreintes/intro/09-oubli.webp --no text, letters, words, numbers, blood, gore, religious motifs
```

## doran-02 — La file (texte en haut)
```
bold graphic fantasy illustration, clean confident ink outlines, cel shading with painted textures, vibrant warm palette, stylized expressive proportions, simplified features, collectible card art. a crowded floating market between towers on pillars at dawn, seen from above, a long queue of volunteers in front of a recruiting table with a plain banner and a neat clerk in a clean coat, a broad-shouldered young man of twenty-five with short thick dark hair and a short dark beard standing in the queue, a head taller than everyone else, looking down at the dark water between the pillars, golden pink dawn light, hopeful and uneasy, calm empty upper third, family-friendly --ar 9:16 --sref https://levixqcl.github.io/empreintes/intro/10-cuvette.webp https://levixqcl.github.io/empreintes/intro/09-oubli.webp --no text, letters, words, numbers, blood, gore, religious motifs
```

## doran-03 — La maison de mue
```
bold graphic fantasy illustration, clean confident ink outlines, cel shading with painted textures, vibrant warm palette, stylized expressive proportions, simplified features, collectible card art. a warm steamy moulting house in the lower levels, long rows of beds with figures resting under damp sheets, an old woman night nurse with a small lamp walking between the rows and singing, in the foreground a broad-shouldered young man of twenty-five with short thick dark hair and a short dark beard sitting up in bed, a fresh teal-green chitin plate on his shoulder, looking at it in wonder, warm amber light through the steam, tender and strange, no injury visible, calm empty lower third, family-friendly --ar 9:16 --sref https://levixqcl.github.io/empreintes/intro/10-cuvette.webp https://levixqcl.github.io/empreintes/intro/09-oubli.webp --no text, letters, words, numbers, blood, gore, religious motifs
```

## doran-04 — Le Levage (texte en haut)
```
bold graphic fantasy illustration, clean confident ink outlines, cel shading with painted textures, vibrant warm palette, stylized expressive proportions, simplified features, collectible card art. underwater at night along a huge concrete pillar of the Foundations, a line of divers with teal chitin on their shoulders hauling a heavy sealed metal crate upward on ropes, one diver's lamp lighting the scene, a broad-shouldered man with short dark hair and a short dark beard, teal-green chitin plates on his shoulders and forearms, rolled-up work shirt among them looking away from the crate, dark green water, bubbles, mysterious and oppressive, calm empty upper third, family-friendly --ar 9:16 --sref https://levixqcl.github.io/empreintes/intro/10-cuvette.webp https://levixqcl.github.io/empreintes/intro/09-oubli.webp --no text, letters, words, numbers, blood, gore, religious motifs
```

## doran-05 — Ses épaules
```
bold graphic fantasy illustration, clean confident ink outlines, cel shading with painted textures, vibrant warm palette, stylized expressive proportions, simplified features, collectible card art. a workers' canteen under the Foundations, long tables, divers with teal chitin plates eating, a proud worker showing a little girl with a tiny teal chitin plate on her shoulder, at the end of the room a neat man in a clean pale coat from the sky islands writing in a thick register, a broad-shouldered man with short dark hair and a short dark beard, teal-green chitin plates on his shoulders and forearms, rolled-up work shirt sitting apart with his bowl, watching the register, cold neon light and warm soup steam, unsettling, calm empty lower third, family-friendly --ar 9:16 --sref https://levixqcl.github.io/empreintes/intro/10-cuvette.webp https://levixqcl.github.io/empreintes/intro/09-oubli.webp --no text, letters, words, numbers, blood, gore, religious motifs
```

## doran-06 — L'affiche
```
bold graphic fantasy illustration, clean confident ink outlines, cel shading with painted textures, vibrant warm palette, stylized expressive proportions, simplified features, collectible card art. a printed notice pasted on a wet concrete pillar with a plain company seal, no readable writing, a group of divers in diving gear with teal chitin on their shoulders reading it, seen from behind, a broad-shouldered man with short dark hair and a short dark beard, teal-green chitin plates on his shoulders and forearms, rolled-up work shirt among them, his fists closed, dusk light over the dark water, silent anger, calm empty lower third, family-friendly --ar 9:16 --sref https://levixqcl.github.io/empreintes/intro/10-cuvette.webp https://levixqcl.github.io/empreintes/intro/09-oubli.webp --no text, letters, words, numbers, blood, gore, religious motifs
```

## doran-07 — Les paniers (texte en haut)
```
bold graphic fantasy illustration, clean confident ink outlines, cel shading with painted textures, vibrant warm palette, stylized expressive proportions, simplified features, collectible card art. night, deep under the district, dark water at the foot of the pillars, a wicker basket of bread and dried fish lowered on a long cable from far above, high up a small figure hanging on the cables without a harness holding a lantern, face not visible, on the water the lantern casts the shadow of a long serpentine dragon, a broad-shouldered man with short dark hair and a short dark beard, teal-green chitin plates on his shoulders and forearms, rolled-up work shirt treading water and looking up at the light, a brass signal lamp held against his chest, warm lantern glow on black water, quiet and moving, calm empty upper third, family-friendly --ar 9:16 --sref https://levixqcl.github.io/empreintes/intro/10-cuvette.webp https://levixqcl.github.io/empreintes/intro/09-oubli.webp --no text, letters, words, numbers, blood, gore, religious motifs
```

## doran-08 — Têtus comme une marée
```
bold graphic fantasy illustration, clean confident ink outlines, cel shading with painted textures, vibrant warm palette, stylized expressive proportions, simplified features, collectible card art. dawn, exhausted divers with teal chitin climbing out of the water onto a dock under the district's lanterns, a whole market crowd waiting to greet them with raised arms, an old woman shouting with joy, a broad-shouldered man with short dark hair and a short dark beard, teal-green chitin plates on his shoulders and forearms, rolled-up work shirt carrying an exhausted colleague on his shoulder, golden dawn light, triumphant and tired, calm empty lower third, family-friendly --ar 9:16 --sref https://levixqcl.github.io/empreintes/intro/10-cuvette.webp https://levixqcl.github.io/empreintes/intro/09-oubli.webp --no text, letters, words, numbers, blood, gore, religious motifs
```

## doran-09 — Trois éclats (texte en haut)
```
bold graphic fantasy illustration, clean confident ink outlines, cel shading with painted textures, vibrant warm palette, stylized expressive proportions, simplified features, collectible card art. night, dark flood water between two concrete pillars under a broken rusty footbridge, a broad-shouldered man in his forties with short dark hair going grey and a short beard, teal-green chitin plates on his shoulders and forearms, rolled-up work shirt treading water and raising an old brass signal lamp, three bright flashes of light beaming toward a distant pump station, a girl with short dark hair visible only from the shoulders up beside him in the water, high above them a small figure on the cables holding a lantern, face not visible, the lantern casting the shadow of a serpentine dragon on the water, cold teal moonlight and warm lantern glow, heavy and silent, no injury visible, calm empty upper third, family-friendly --ar 9:16 --sref https://levixqcl.github.io/empreintes/intro/10-cuvette.webp https://levixqcl.github.io/empreintes/intro/09-oubli.webp --no text, letters, words, numbers, blood, gore, religious motifs
```

## doran-10 — Envoyez Ilka
```
bold graphic fantasy illustration, clean confident ink outlines, cel shading with painted textures, vibrant warm palette, stylized expressive proportions, simplified features, collectible card art. dawn, deep under the pumps of a district, a broad-shouldered man in his fifties with short grey hair and a short grey beard, teal-green chitin plates on his shoulders and forearms, rolled-up work shirt seen from behind, standing in front of a freshly opened dark doorway with smooth curved ancient walls, his palm laid flat on the stone, pump workers with lamps waiting behind him, a faint blue glow from inside the doorway, solemn and hushed, calm empty lower third, family-friendly --ar 9:16 --sref https://levixqcl.github.io/empreintes/intro/10-cuvette.webp https://levixqcl.github.io/empreintes/intro/09-oubli.webp --no text, letters, words, numbers, blood, gore, religious motifs
```
