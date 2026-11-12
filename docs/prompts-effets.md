# Prompts Midjourney — effets de combat à peindre (12 novembre 2026)

Les attaques ont déjà leurs textures peintes. Les effets ci-dessous sont encore tracés en code (traits fins) :
bouclier, parade, soin, Perçant, Crescendo, cristaux suspendus (la Fissure est déjà peinte). Le jeu est prêt à les recevoir
(`VARIANTES` dans `src/ui/impact.ts` : 0 variante = le tracé en code continue de servir).

Pour chaque effet : lancer le prompt, garder les 2 ou 3 meilleures images de la grille (formes différentes, fond bien noir,
effet entier dans l'image, rien de coupé au bord), les télécharger. Claude les détoure avec
`python3 scripts/effets.py <dossier> <nom>` (fond noir → transparent, recadrage, WebP dans `public/art/effets/`),
puis écrit le nombre de variantes dans `VARIANTES`.

## ecu — la coque de glace
Parade devant un Porteur, bouclier qui se pose sur un ennemi.
```
bold graphic fantasy illustration, clean confident ink outlines, cel shading with painted textures, vibrant warm palette, stylized expressive proportions, simplified features, collectible card art. a single hexagonal shield of translucent pale blue ice crystal seen straight from the front, faceted like cut glass, bright white-blue glowing rim, faint frost veins inside, hollow see-through center, glowing magical visual effect for a game, centered on a plain pure black background, isolated, no ground, no character, no text, no letters, family-friendly --ar 1:1 --sref https://levixqcl.github.io/empreintes/art/embleme.webp --sw 50 --no text, letters, words, person, character, hand, frame, border, ground, landscape
```

## rempart — le mur de glace
Bouclier posé sur toute l’escouade, Rempart, Écho.
```
bold graphic fantasy illustration, clean confident ink outlines, cel shading with painted textures, vibrant warm palette, stylized expressive proportions, simplified features, collectible card art. a wide low wall made of five translucent hexagonal ice crystal panels standing side by side, seen straight from the front, pale blue glass with bright white glowing edges, a thin frost mist at its base, very wide horizontal composition, glowing magical visual effect for a game, centered on a plain pure black background, isolated, no ground, no character, no text, no letters, family-friendly --ar 3:1 --sref https://levixqcl.github.io/empreintes/art/embleme.webp --sw 50 --no text, letters, words, person, character, hand, frame, border, ground, landscape
```

## brise — le bouclier qui se brise
Quand un coup passe à travers le bouclier.
```
bold graphic fantasy illustration, clean confident ink outlines, cel shading with painted textures, vibrant warm palette, stylized expressive proportions, simplified features, collectible card art. a burst of shattering ice glass, sharp translucent pale blue crystal shards flying outward from the center in all directions, a white flash at the core, small glittering splinters, glowing magical visual effect for a game, centered on a plain pure black background, isolated, no ground, no character, no text, no letters, family-friendly --ar 1:1 --sref https://levixqcl.github.io/empreintes/art/embleme.webp --sw 50 --no text, letters, words, person, character, hand, frame, border, ground, landscape
```

## soin — l’éclosion de soin
Sur le Porteur soigné.
```
bold graphic fantasy illustration, clean confident ink outlines, cel shading with painted textures, vibrant warm palette, stylized expressive proportions, simplified features, collectible card art. a blooming burst of soft emerald green light, like a glowing flower of energy opening, curling leaf-shaped wisps and tiny golden sparks rising, gentle and warm, glowing magical visual effect for a game, centered on a plain pure black background, isolated, no ground, no character, no text, no letters, family-friendly --ar 1:1 --sref https://levixqcl.github.io/empreintes/art/embleme.webp --sw 50 --no text, letters, words, person, character, hand, frame, border, ground, landscape
```

## vague — la Vague
Soin qui traverse toute l’escouade.
```
bold graphic fantasy illustration, clean confident ink outlines, cel shading with painted textures, vibrant warm palette, stylized expressive proportions, simplified features, collectible card art. a single rolling wave of emerald green light moving from left to right, a curling crest with golden-green spray and tiny sparks, a soft glowing trail behind it, very wide horizontal composition, glowing magical visual effect for a game, centered on a plain pure black background, isolated, no ground, no character, no text, no letters, family-friendly --ar 3:1 --sref https://levixqcl.github.io/empreintes/art/embleme.webp --sw 50 --no text, letters, words, person, character, hand, frame, border, ground, landscape
```

## lance — le Perçant
Lance de lumière qui traverse l’ennemi.
```
bold graphic fantasy illustration, clean confident ink outlines, cel shading with painted textures, vibrant warm palette, stylized expressive proportions, simplified features, collectible card art. a long straight spear of pure light flying horizontally from left to right, razor-thin brilliant white core with a pale gold and icy blue glow, a sharp pointed tip on the right, a fading streak on the left, very wide horizontal composition, glowing magical visual effect for a game, centered on a plain pure black background, isolated, no ground, no character, no text, no letters, family-friendly --ar 4:1 --sref https://levixqcl.github.io/empreintes/art/embleme.webp --sw 50 --no text, letters, words, person, character, hand, frame, border, ground, landscape
```

## anneau — le Crescendo
Anneau doré qui grandit à chaque carte.
```
bold graphic fantasy illustration, clean confident ink outlines, cel shading with painted textures, vibrant warm palette, stylized expressive proportions, simplified features, collectible card art. a single thin ring of golden light, a perfect circular shockwave seen straight from the front, bright warm gold with small amber sparks along the rim, completely empty dark center, glowing magical visual effect for a game, centered on a plain pure black background, isolated, no ground, no character, no text, no letters, family-friendly --ar 1:1 --sref https://levixqcl.github.io/empreintes/art/embleme.webp --sw 50 --no text, letters, words, person, character, hand, frame, border, ground, landscape
```

## cristal — le cristal suspendu
Les cristaux qui flottent au-dessus de l’ennemi pendant une chaîne, puis plongent.
```
bold graphic fantasy illustration, clean confident ink outlines, cel shading with painted textures, vibrant warm palette, stylized expressive proportions, simplified features, collectible card art. a single small elongated crystal shard of light, a slender diamond-shaped sliver pointing straight up, clear white with a faint pale blue tint, bright inner glow, sharp clean facets, glowing magical visual effect for a game, centered on a plain pure black background, isolated, no ground, no character, no text, no letters, family-friendly --ar 1:1 --sref https://levixqcl.github.io/empreintes/art/embleme.webp --sw 50 --no text, letters, words, person, character, hand, frame, border, ground, landscape
```

