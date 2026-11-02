# Images à refaire (audit du 2 novembre 2026)

Bryan relance ces images sur Midjourney. Chaque prompt est complet : le copier tel quel, rien à remplacer.
Toujours une image entière (pas de retouche à la gomme ni de Vary Region). Un visage par personnage.
Lumière de lignée : Augmentés = bleu acier / cyan, Génés = vert émeraude, Résonants = améthyste / violet.

À déposer dans Téléchargements : Claude convertit en webp, met à la taille et range sous le nom indiqué.

## Déjà intégrées (2 novembre, 20 h)

Les 24 images sont intégrées. Les variantes de missions non retenues sont gardées dans `sources/missions-variantes/` (hors du jeu).

## La liste (24 images)

| # | Fichier à remplacer | Ce qui change |
|---|---|---|
| 1 | `public/art/ennemis/flc-contremaitre.webp` | Ressemblait à Doran : devient chauve, rasé, peau sombre, carapace bleu nuit |
| 2 | `public/art/ennemis/flc-chantre.webp` | Décolleté, tête renversée, femme : devient un jeune chantre en tunique blanche à col haut |
| 3 | `public/art/modules/regard-biais.webp` | Lumière orange : violet imposé |
| 4 | `public/art/modules/lame-doute.webp` | Lumière orange : violet imposé |
| 5 | `public/art/modules/oeil-lecteur.webp` | Lumière orange : violet imposé |
| 6 | `public/art/modules/verdict.webp` | Lumière orange : violet imposé |
| 7 | `public/art/modules/sentence-muette.webp` | Lumière orange : violet imposé |
| 8 | `public/art/modules/eclat.webp` | Lumière orange : violet imposé |
| 9 | `public/art/modules/boucle-memoire.webp` | Violet imposé ; écrin au lieu de la cloche de verre |
| 10 | `public/art/modules/miroir-hauts.webp` | Violet imposé ; socle au lieu de la cloche de verre |
| 11 | `public/art/modules/silence-avant.webp` | Violet imposé ; socle au lieu de la cloche de verre |
| 12 | `public/art/modules/coeur-etoile.webp` | Doublon de Boucle de mémoire (sphère d'anneaux) : étoile dans une cage de réacteur |
| 13 | `public/art/porteurs/vela.webp` | Une seule Véla : capuche baissée, mèche d'or sur le front, flamme violette |
| 14 | `public/art/porteurs/aurel.webp` | Visage pâle et mélancolique, queue de cheval, lumière violette |
| 15 | `public/intro/10-toi.webp` | Même scène, avec Doran, Ilka et Véla conformes à leurs portraits |
| 16 | `public/art/strates/strate-10.webp` | Noir et blanc, hors style : obsidienne et braise, en couleur |
| 17 | `public/art/missions/pilier-sans-nom.webp` | Incendie au lieu du brouillard |
| 18 | `public/art/missions/pilier-effondre.webp` | Incendie au lieu de la mer au crépuscule |
| 19 | `public/art/missions/silos.webp` | Incendie au lieu de la tempête |
| 20 | `public/art/modules/hallali.webp` | Fagot de bâtons : devient une trompe de chasse en os |
| 21 | `public/art/modules/meche-or.webp` | Le fil d'or ne se voyait pas |
| 22 | `public/art/modules/souffle-wyrm.webp` | Encore un cristal : devient un crâne de dragon en os |
| 23 | `public/art/modules/mue-totale.webp` | Encore une coque : devient un vieux manteau abandonné |
| 24 | `public/art/modules/carapace-fondations.webp` | Encore une carapace : devient le bouclier-porte de l'ascenseur |

## 1. Gardes de la Flèche

### 1. flc-contremaitre — Contremaître des quais
Change : chauve et rasé, peau sombre, plus jeune et massif, carapace bleu nuit ; plus rien de Doran (ni barbe, ni cheveux gris, ni chitine verte).

```
bold graphic fantasy illustration, clean confident ink outlines, cel shading with painted textures, vibrant warm palette, stylized expressive proportions, simplified features, collectible card art. waist-up portrait of a massive dock foreman in his forties, dark brown skin, completely bald shaved head, clean-shaven face with no beard and no moustache, heavy brow, stern but fair expression, a polished brass whistle on a short chain at his lips, thick midnight-blue chitin plates covering his shoulders and forearms like a dark navy shell armor, sleeveless leather work vest with tools, arms crossed, on a brass mooring platform low on a colossal spire, dark stormy sea below, orange pennants, evening light, no text, no letters, no numbers, no flags, no religious motifs, family-friendly, no blood, no gore --ar 3:4 --sref https://levixqcl.github.io/empreintes/art/ennemis/brigadier.webp https://levixqcl.github.io/empreintes/art/personnages/hald.webp --sw 60 --no beard, moustache, grey hair, white hair, hair, green chitin, old man
```

### 2. flc-chantre — Chantre des Sièges · Résonant
Change : un jeune homme, debout et de face, tunique blanche fermée jusqu'au cou ; bouche ouverte, ondes bleues autour.

```
bold graphic fantasy illustration, clean confident ink outlines, cel shading with painted textures, vibrant warm palette, stylized expressive proportions, simplified features, collectible card art. waist-up portrait of a young male choir singer of the sky houses, a slim young man around twenty, short neat hair, standing upright and facing the viewer, head held level, mouth open mid-song, eyes half closed in focus, a modest long white tunic with a high buttoned collar closed up to the throat and long sleeves, thin gold trim, a small crystal tuning fork pendant over the collar, visible pale blue sound waves curling around him, on a high white and gold platform above the clouds, a white floating city faintly behind, cold bright light, no text, no letters, no numbers, no flags, no religious motifs, family-friendly, no blood, no gore --ar 3:4 --sref https://levixqcl.github.io/empreintes/art/ennemis/brigadier.webp https://levixqcl.github.io/empreintes/art/personnages/hald.webp --sw 60 --no cleavage, low neckline, bare shoulders, bare chest, woman, head thrown back, robe slipping
```

## 2. Cartes Résonantes : le violet imposé

Mêmes sujets que dans `docs/prompts-cartes.md`, avec « dominant amethyst and violet lighting », une scène éclairée seulement en violet,
et « orange, copper glow, brass glow » dans le `--no`.

### 3. Regard en biais — `regard-biais.webp`
Change : la lumière orange devient violette. **2e essai (2 nov.)** : le 1er rendu restait orange ; la référence de style passe sur des cartes violettes et le décor n'est plus l'atelier boisé.

```
bold graphic fantasy illustration, clean confident ink outlines, cel shading with painted textures, vibrant warm palette, stylized expressive proportions, simplified features, collectible card art. still life, a single object in close-up, centered and filling the frame, resting on a dark slate table in a dim violet-lit study, an ornate gilded lorgnette held at an angle on a small stand, its tilted violet lens revealing a thin glowing crack in an otherwise smooth stone mask behind it, the whole scene lit only by cold violet light, dominant amethyst and violet lighting with rich gold accents, lavender rim light, deep indigo shadows, no people, no text, no letters, no numbers, family-friendly --ar 5:7 --sref https://levixqcl.github.io/empreintes/art/modules/voix-basse.webp https://levixqcl.github.io/empreintes/art/modules/miroir-hauts.webp --sw 80 --no text, person, character, crystal, gemstone, amethyst rock, orange, copper glow, brass glow, warm light, candle, fire, amber, sepia, brown
```

### 4. Lame de doute — `lame-doute.webp`
Change : la lumière orange devient violette, la lame est bien translucide et violette.

```
bold graphic fantasy illustration, clean confident ink outlines, cel shading with painted textures, vibrant warm palette, stylized expressive proportions, simplified features, collectible card art. still life, a single object in close-up, centered and filling the frame, resting on a dark worn wooden workbench in a dim workshop, a long thin dagger with an almost invisible translucent violet blade and a gilded hilt, a wisp of violet mist hesitating around its tip, the whole scene lit only by cold violet light, dominant amethyst and violet lighting with rich gold accents, lavender rim light, deep indigo shadows, no people, no text, no letters, no numbers, family-friendly --ar 5:7 --sref https://levixqcl.github.io/empreintes/art/personnages/yse.webp --sw 60 --no text, person, character, crystal, gemstone, amethyst rock, orange, copper glow, brass glow
```

### 5. Œil du Lecteur — `oeil-lecteur.webp`
Change : la lumière orange devient violette, la déchirure de lumière sur la page est violette.

```
bold graphic fantasy illustration, clean confident ink outlines, cel shading with painted textures, vibrant warm palette, stylized expressive proportions, simplified features, collectible card art. still life, a single object in close-up, centered and filling the frame, resting on a dark worn wooden workbench in a dim workshop, an open antique ledger with gilded corners and a reading lens on a hinged arm, the lens projecting a glowing violet tear across the blank page, abstract shapes not letters, the whole scene lit only by cold violet light, dominant amethyst and violet lighting with rich gold accents, lavender rim light, deep indigo shadows, no people, no text, no letters, no numbers, family-friendly --ar 5:7 --sref https://levixqcl.github.io/empreintes/art/personnages/yse.webp --sw 60 --no text, person, character, crystal, gemstone, amethyst rock, orange, copper glow, brass glow
```

### 6. Verdict — `verdict.webp`
Change : la lumière orange devient violette, l'onde de choc est violette. **2e essai (2 nov.)** : le 1er rendu restait orange ; la référence de style passe sur des cartes violettes et le décor n'est plus l'atelier boisé.

```
bold graphic fantasy illustration, clean confident ink outlines, cel shading with painted textures, vibrant warm palette, stylized expressive proportions, simplified features, collectible card art. still life, a single object in close-up, centered and filling the frame, resting on a dark slate table in a dim violet-lit study, a heavy ornate gilded gavel resting on its sounding block, a ring of violet shockwave spreading from the block and splitting a small stone tablet in two, the whole scene lit only by cold violet light, dominant amethyst and violet lighting with rich gold accents, lavender rim light, deep indigo shadows, no people, no text, no letters, no numbers, family-friendly --ar 5:7 --sref https://levixqcl.github.io/empreintes/art/modules/voix-basse.webp https://levixqcl.github.io/empreintes/art/modules/miroir-hauts.webp --sw 80 --no text, person, character, crystal, gemstone, amethyst rock, orange, copper glow, brass glow, warm light, candle, fire, amber, sepia, brown
```

### 7. Sentence muette — `sentence-muette.webp`
Change : la lumière orange devient violette ; le gant est posé seul, sans bras dedans.

```
bold graphic fantasy illustration, clean confident ink outlines, cel shading with painted textures, vibrant warm palette, stylized expressive proportions, simplified features, collectible card art. still life, a single object in close-up, centered and filling the frame, resting on a dark worn wooden workbench in a dim workshop, an elegant empty long glove of dark violet silk embroidered with gold, laid flat with one finger pointing, a sharp beam of violet light shooting from the fingertip, the whole scene lit only by cold violet light, dominant amethyst and violet lighting with rich gold accents, lavender rim light, deep indigo shadows, no people, no text, no letters, no numbers, family-friendly --ar 5:7 --sref https://levixqcl.github.io/empreintes/art/personnages/yse.webp --sw 60 --no text, person, character, crystal, gemstone, amethyst rock, orange, copper glow, brass glow, hand, arm
```

### 8. Éclat — `eclat.webp`
Change : la lumière orange devient violette. **2e essai (2 nov.)** : le 1er rendu restait orange ; la référence de style passe sur des cartes violettes et le décor n'est plus l'atelier boisé.

```
bold graphic fantasy illustration, clean confident ink outlines, cel shading with painted textures, vibrant warm palette, stylized expressive proportions, simplified features, collectible card art. still life, a single object in close-up, centered and filling the frame, resting on a dark slate table in a dim violet-lit study, a shattered antique hand mirror with an ornate gilded handle, its broken shards floating outward in a burst, each shard reflecting a brighter flash of violet light than the last, the whole scene lit only by cold violet light, dominant amethyst and violet lighting with rich gold accents, lavender rim light, deep indigo shadows, no people, no text, no letters, no numbers, family-friendly --ar 5:7 --sref https://levixqcl.github.io/empreintes/art/modules/voix-basse.webp https://levixqcl.github.io/empreintes/art/modules/miroir-hauts.webp --sw 80 --no text, person, character, crystal, gemstone, amethyst rock, orange, copper glow, brass glow, warm light, candle, fire, amber, sepia, brown
```

### 9. Boucle de mémoire (exclusive, argent) — `boucle-memoire.webp`
Change : violet imposé ; dans un écrin ouvert au lieu de la cloche de verre ; un seul anneau plat (l'image actuelle ressemblait à une sphère d'anneaux, comme Cœur d'étoile).

```
bold graphic fantasy illustration, clean confident ink outlines, cel shading with painted textures, vibrant warm palette, stylized expressive proportions, simplified features, collectible card art. unique specimen, a single object lying alone in an open antique jewel case lined with dark violet velvet, like the only one of its kind in a collector's cabinet, centered and filling the frame, a single wide flat ring of dark gilded bronze with a looping violet ribbon of light running endlessly through it, the same tiny frozen moment replaying inside the loop like a moving picture, the whole scene lit only by cold violet light, dominant amethyst and violet lighting with rich gold accents, lavender rim light, deep indigo shadows, cool polished silver hinges and silver clasps on the jewel case, a few faint ghostly copies of the ring crumbling to dust around the case, no people, no text, no letters, no numbers, family-friendly --ar 5:7 --sref https://levixqcl.github.io/empreintes/art/personnages/yse.webp --sw 60 --no text, person, character, crystal, gemstone, amethyst rock, orange, copper glow, brass glow, glass dome, bell jar, armillary sphere, astrolabe
```

### 10. Miroir des Hauts (exclusive, or) — `miroir-hauts.webp`
Change : violet imposé (le reflet de la main reste) ; sur un socle au lieu de la cloche de verre.

```
bold graphic fantasy illustration, clean confident ink outlines, cel shading with painted textures, vibrant warm palette, stylized expressive proportions, simplified features, collectible card art. unique specimen, a single object standing alone on a tall carved pedestal of dark polished stone, like the only one of its kind in a collector's cabinet, centered and filling the frame, a tall ornate gilded hand mirror from an aristocratic hall, its violet glass reflecting a graceful gesture of a hand that is not in front of it, the whole scene lit only by cold violet light, dominant amethyst and violet lighting with rich gold accents, lavender rim light, deep indigo shadows, warm polished gold fittings on the pedestal, a few faint ghostly copies of the mirror crumbling to dust around the pedestal, no people, no text, no letters, no numbers, family-friendly --ar 5:7 --sref https://levixqcl.github.io/empreintes/art/personnages/yse.webp --sw 60 --no text, person, character, crystal, gemstone, amethyst rock, orange, copper glow, brass glow, glass dome, bell jar
```

### 11. Silence d'avant (exclusive, nacre) — `silence-avant.webp`
Change : violet imposé ; la clochette est en nacre (plus en cuivre) ; sur un socle au lieu de la cloche de verre.

```
bold graphic fantasy illustration, clean confident ink outlines, cel shading with painted textures, vibrant warm palette, stylized expressive proportions, simplified features, collectible card art. unique specimen, a single object standing alone on a small round carved pedestal of pale mother-of-pearl, like the only one of its kind in a collector's cabinet, centered and filling the frame, a small closed hand-bell made of iridescent white mother-of-pearl with a slender gold handle and no clapper, a perfectly still violet hush of light around it, motionless dust hanging in the air, the whole scene lit only by cold violet light, dominant amethyst and violet lighting with rich gold accents, lavender rim light, deep indigo shadows, pearly rainbow sheen on the pedestal, a few faint ghostly copies of the hand-bell crumbling to dust around the pedestal, no people, no text, no letters, no numbers, family-friendly --ar 5:7 --sref https://levixqcl.github.io/empreintes/art/personnages/yse.webp --sw 60 --no text, person, character, crystal, gemstone, amethyst rock, orange, copper glow, brass glow, glass dome, bell jar, copper bell, large church bell
```

## 3. Cœur d'étoile (Augmenté, exclusive nacre)

### 12. Cœur d'étoile — `coeur-etoile.webp`
Change : plus de sphère d'anneaux (doublon de Boucle de mémoire) : une petite étoile bleue prisonnière d'une cage de réacteur en laiton, lumière bleu acier. Socle de nacre au lieu de la cloche, comme les exclusives ci-dessus.

```
bold graphic fantasy illustration, clean confident ink outlines, cel shading with painted textures, vibrant warm palette, stylized expressive proportions, simplified features, collectible card art. unique specimen, a single object standing alone on a small round carved pedestal of pale mother-of-pearl, like the only one of its kind in a collector's cabinet, centered and filling the frame, a compact reactor cage of heavy riveted brass bars and thick bolts, straining to hold a tiny blinding blue-white star captive at its center, cold starlight streaming out between the bars, small arcs of electric blue crackling on the rivets, the object glowing with cold blue light, dominant cold steel-blue and electric cyan lighting, blue rim light, deep navy shadows, pearly rainbow sheen on the pedestal, a few faint ghostly copies of the cage crumbling to dust around the pedestal, no people, no text, no letters, no numbers, family-friendly --ar 5:7 --sref https://levixqcl.github.io/empreintes/art/personnages/yse.webp --sw 60 --no text, person, character, heart, anatomical heart, rings, armillary sphere, astrolabe, glass dome, bell jar, orange, amber
```

## 4. Porteurs

Format 600 × 800, `public/art/porteurs/<id>.webp`. Les miniatures (`porteurs/mini/`) ne sont pas à demander à Midjourney :
c'est un recadrage fait par Claude avec `python3 scripts/miniatures.py` après le dépôt du portrait.

### 13. Véla — `vela.webp`
Change : la version fixée. Lore (`src/core/lore-porteurs.ts`) : la quarantaine, Résonante des districts, calme et bienveillante,
ne cache plus sa mèche d'or, porte toujours une lanterne pour vérifier son ombre de dragon serpentin. Capuche baissée,
cheveux sombres mi-longs (pas de tresse), mèche d'or bien visible sur le front, flamme violette (plus de lanterne orange).

```
bold graphic fantasy illustration, clean confident ink outlines, cel shading with painted textures, vibrant warm palette, stylized expressive proportions, simplified features, collectible card art. woman around forty with a single bright metallic gold streak of hair falling across her forehead, clearly visible against her loose shoulder-length dark hair, hood down, the hood of her travel cloak resting folded on her shoulders, calm kind attentive face, a few fine lines at the corners of her eyes, raising a dark iron lantern with a cold violet flame inside, a huge serpentine dragon shadow cast on the stone wall behind her, head and shoulders in the upper half of the frame, half body, dominant amethyst and violet lighting, glowing purple crystal light, lavender rim light, deep indigo shadows, no text, no letters, no numbers, no flags, no real person, no religious motifs, family-friendly, no blood, no gore --ar 3:4 --sref https://levixqcl.github.io/empreintes/art/personnages/yse.webp --sw 60 --no orange, sunset, fire glow, text, hood up, braid, orange flame, warm lantern light
```

### 14. Aurel — `aurel.webp`
Change : plus le jeune homme hâlé et souriant aux boucles : visage pâle et fermé, cheveux raides en queue de cheval, lumière violette.
Lore : il teint sa mèche d'or pour vivre incognito ; on n'en voit qu'un fin reflet doré à la racine.

```
bold graphic fantasy illustration, clean confident ink outlines, cel shading with painted textures, vibrant warm palette, stylized expressive proportions, simplified features, collectible card art. tall slender aristocrat in his early twenties, very pale porcelain skin, sharp narrow face, high cheekbones, long straight black hair pulled back in a low ponytail, the streak at his temple dyed black with only a thin glint of gold showing at the roots, cold distant grey eyes, unsmiling melancholic expression, immaculate long white tailored coat with high collar and silver buttons, slightly rain-darkened at the hem, standing very straight with hands clasped behind his back, three-quarter view, half body, a faint winged shadow behind him, on a dark rainy district street far from home, dominant amethyst and violet lighting, glowing purple crystal light, lavender rim light, deep indigo shadows, no text, no letters, no numbers, no flags, no real person, no religious motifs, family-friendly, no blood, no gore --ar 3:4 --sref https://levixqcl.github.io/empreintes/art/personnages/yse.webp --sw 60 --no orange, sunset, fire glow, text, smile, curly hair, tan skin, loose hair
```

## 5. Intro

### 15. Toi — `public/intro/10-toi.webp`
Change : la même scène (vue en contre-plongée dans le puits, la tour en haut, la porte scellée à l'ombre de dragon, trois Porteurs devant),
mais chacun conforme à son portrait : Ilka (cheveux blancs en pics, taches de rousseur, écharpe bleu ardoise, jambes mécaniques à genoux bleus),
Véla au centre (cheveux sombres mi-longs, mèche d'or sur le front, capuche baissée, lanterne à flamme violette), Doran (cheveux et barbe
gris, plaques de chitine vert sarcelle à l'épaule et à l'avant-bras, chemise retroussée). Format 9:16 (816 × 1456).

```
bold graphic fantasy illustration, clean confident ink outlines, cel shading with painted textures, vibrant warm palette, stylized expressive proportions, simplified features, collectible card art. low-angle view from the bottom of a deep rocky mine shaft dug under an old district tower, the tower visible far above through the round opening against a pale dawn sky, a tall sealed ancient stone door in the shaft wall glowing faintly, a huge serpentine dragon shadow cast on the door, three companions standing in front of it among fallen rocks: on the left a young woman courier with short spiky white hair, freckles and a wide cheeky grin, slate-blue hooded scarf and worn utility jacket, sleek mechanical legs with glowing blue crystal cores at the knees, holding a rough violet crystal; in the center a calm woman around forty with loose shoulder-length dark hair and a single bright metallic gold streak across her forehead, hood down on her shoulders, raising a dark iron lantern with a cold violet flame; on the right a broad-shouldered man in his fifties with grey hair and a thick grey beard, warm tired smile, teal-green chitin plates on his shoulder and forearm, rolled-up work shirt, looking back toward the viewer, each face distinct, cold blue glow on the courier, violet lantern light on the door, soft green glow on the old man, warm dawn light from far above, no text, no letters, no numbers, no signs with writing, no flags, no real person, no religious motifs, family-friendly, no blood, no gore --ar 9:16 --sref https://levixqcl.github.io/empreintes/art/personnages/yse.webp --sw 60 --no text, braid, orange jacket, black armor, glowing orange cracks, orange flame
```

## 6. Strates

### 16. Strate −10, le fond — `strate-10.webp`
Change : l'image actuelle est en noir et blanc, dans un trait qui n'est pas celui des autres Strates. Le fond du monde : obsidienne veinée de braise,
une table gravée qui luit, en couleur, comme les Strates −8 et −9. Format 800 × 1000 (4:5). Le fond flou de combat (`strate-10-fond.webp`)
sera refait par Claude à partir de la nouvelle image.

```
bold graphic fantasy illustration, clean confident ink outlines, cel shading with painted textures, vibrant warm palette, stylized expressive proportions, simplified features, collectible card art. the very bottom of an immense ancient circular shaft, smooth curved walls of glossy black obsidian veined with glowing ember-red and orange cracks like cooling magma, a large round engraved stone table at the center of the floor glowing softly with fine gold and pale blue carved lines, abstract patterns not letters, a faint cold shaft of light falling from very far above, embers drifting slowly in the warm air, deep shadows, mysterious and solemn, no people, no text, no letters, no numbers, family-friendly --ar 4:5 --sref https://levixqcl.github.io/empreintes/art/strates/strate-9.webp https://levixqcl.github.io/empreintes/art/strates/strate-8.webp --sw 60 --no text, letters, people, person, black and white, monochrome, grayscale, machinery, sci-fi panels
```

## 7. Missions en mer

Mêmes sujets que `docs/prompts-missions.md`, ambiance de lumière calmée ; feu et fumée interdits. Format 1500 × 504 (3:1), `public/art/missions/`.

### 17. Le Pilier sans nom — `pilier-sans-nom.webp`
Change : un incendie et de la fumée orange au lieu du brouillard blanc et de la lumière argentée.

```
bold graphic fantasy illustration, clean confident ink outlines, cel shading with painted textures, vibrant warm palette, stylized expressive proportions, simplified features, collectible card art. a lonely nameless rock pillar far out at sea wrapped in thick cold white sea fog, a few dim pale lights near its top, calm dark water, mysterious silver blue moonlight, wide calm sea on the left two thirds, horizon in the upper third, the ruin on the right third, no people, family-friendly, no text, no letters, no numbers --ar 3:1 --sref https://levixqcl.github.io/empreintes/art/personnages/yse.webp --sw 60 --no text, people, boat, fire, flames, smoke, burning, embers, explosion, lava, orange glow
```

### 18. Le Pilier effondré — `pilier-effondre.webp`
Change : un incendie au lieu du pilier brisé penché dans la mer sous un ciel calme.

```
bold graphic fantasy illustration, clean confident ink outlines, cel shading with painted textures, vibrant warm palette, stylized expressive proportions, simplified features, collectible card art. a huge cracked stone pillar city broken in half, its upper floors leaning into the calm sea, empty windows, seaweed on the lower walls, still water reflecting it, peaceful dusk sky in soft violet and rose, wide calm sea on the left two thirds, horizon in the upper third, the ruin on the right third, no people, family-friendly, no text, no letters, no numbers --ar 3:1 --sref https://levixqcl.github.io/empreintes/art/personnages/yse.webp --sw 60 --no text, people, boat, fire, flames, smoke, burning, embers, explosion, lava, orange glow
```

### 19. Les Silos — `silos.webp`
Change : un incendie au lieu de la tempête (et une bande noire en haut de l'image actuelle).

```
bold graphic fantasy illustration, clean confident ink outlines, cel shading with painted textures, vibrant warm palette, stylized expressive proportions, simplified features, collectible card art. a row of round concrete grain silos standing in the sea beside a broken dike, grey sea waves spilling through the gap in white foam, stormy grey-blue sky with rain and a few pale sun rays breaking through, wide calm sea on the left two thirds, horizon in the upper third, the ruin on the right third, no people, family-friendly, no text, no letters, no numbers --ar 3:1 --sref https://levixqcl.github.io/empreintes/art/personnages/yse.webp --sw 60 --no text, people, boat, fire, flames, smoke, burning, embers, explosion, lava, orange glow, black bar, border
```

## 8. Cartes à sujet raté

### 20. Hallali (Génés, la Traque) — `hallali.webp`
Change : l'image montre un fagot de bâtons qui explose ; il faut une trompe de chasse en os, un cri de lumière verte.

```
bold graphic fantasy illustration, clean confident ink outlines, cel shading with painted textures, vibrant warm palette, stylized expressive proportions, simplified features, collectible card art. still life, a single object in close-up, centered and filling the frame, resting on a dark worn wooden workbench in a dim workshop, a long curved hunting horn carved from pale polished bone, with a leather strap and simple carved rings, a bright green cry of light bursting from its wide mouth in a cone of glowing sound waves, the object glowing with soft green bioluminescent light, dominant emerald and moss-green lighting, teal reflections, deep green-black shadows, no people, no text, no letters, no numbers, family-friendly --ar 5:7 --sref https://levixqcl.github.io/empreintes/art/personnages/yse.webp --sw 60 --no text, person, character, blood, gore, flesh, organ, sticks, bundle, dynamite, explosion, skull
```

### 21. Mèche d'or (Résonants) — `meche-or.webp`
**2e essai (2 nov., soir)** : le 1er rendu restait orange (feu pour le wyrm, mèche terne) ; référence de style violette, plus d'atelier boisé.
Change : on voyait un chignon violet sans or ; il faut une boucle de cheveux sombres traversée d'un fil d'or brillant, un ruban violet, dans un écrin.

```
bold graphic fantasy illustration, clean confident ink outlines, cel shading with painted textures, vibrant warm palette, stylized expressive proportions, simplified features, collectible card art. still life, a single object in close-up, centered and filling the frame, resting on a dark slate table in a dim violet-lit study, a small open jewel case lined with dark violet velvet, inside it a single curled lock of glossy jet-black hair with one bright shining metallic gold strand running clearly through its whole length, tied in the middle with a thin violet satin ribbon, the gold strand catching the light, the whole scene lit only by cold violet light, dominant amethyst and violet lighting with rich gold accents, lavender rim light, deep indigo shadows, no people, no text, no letters, no numbers, family-friendly --ar 5:7 --sref https://levixqcl.github.io/empreintes/art/modules/voix-basse.webp https://levixqcl.github.io/empreintes/art/modules/verdict.webp --sw 80 --no text, person, character, crystal, gemstone, amethyst rock, orange, copper glow, brass glow, warm light, candle, fire, flames, amber, sepia, brown, wig, hair bun, purple hair
```

### 22. Souffle du wyrm (Résonants) — `souffle-wyrm.webp`
**2e essai (2 nov., soir)** : le 1er rendu restait orange (feu pour le wyrm, mèche terne) ; référence de style violette, plus d'atelier boisé.
Change : encore un gros cristal ; il faut un crâne de dragon serpentin en os qui exhale un tourbillon violet et or.

```
bold graphic fantasy illustration, clean confident ink outlines, cel shading with painted textures, vibrant warm palette, stylized expressive proportions, simplified features, collectible card art. still life, a single object in close-up, centered and filling the frame, resting on a dark slate table in a dim violet-lit study, the ancient elegant bone skull of a long serpentine dragon, smooth and pale, long jaw slightly open, a spiral torrent of violet and gold light swirling out of its jaws like a breath, majestic not frightening, the whole scene lit only by cold violet light, dominant amethyst and violet lighting with rich gold accents, lavender rim light, deep indigo shadows, no people, no text, no letters, no numbers, family-friendly --ar 5:7 --sref https://levixqcl.github.io/empreintes/art/modules/voix-basse.webp https://levixqcl.github.io/empreintes/art/modules/verdict.webp --sw 80 --no text, person, character, crystal, gemstone, amethyst rock, orange, copper glow, brass glow, warm light, candle, fire, flames, amber, sepia, brown, blood, gore, flesh
```

## 9. Varier les coques des Génés

### 23. Mue totale (Génés, or, soin « Vague » : soigne toute l'escouade) — `mue-totale.webp`
Change : plus de coque vide de crabe. Lore : une fois dans sa vie, le Géné quitte tout son corps abîmé et en sort neuf. Sujet : le vieux manteau
de travail abandonné sur une chaise, qui s'effrite en feuilles sèches, et une vague de pousses vertes qui s'étend tout autour.

```
bold graphic fantasy illustration, clean confident ink outlines, cel shading with painted textures, vibrant warm palette, stylized expressive proportions, simplified features, collectible card art. still life, a single object in close-up, centered and filling the frame, resting on a dark worn wooden workbench in a dim workshop, an old worn and torn work coat left empty and slumped over a small wooden stool, its fabric crumbling at the edges into dry curled leaves drifting away, while a ring of fresh bright green sprouts and tiny leaves bursts from the wood all around the stool in a gentle spreading wave of emerald light, renewal, the object glowing with soft green bioluminescent light, dominant emerald and moss-green lighting, teal reflections, deep green-black shadows, no people, no text, no letters, no numbers, family-friendly --ar 5:7 --sref https://levixqcl.github.io/empreintes/art/personnages/yse.webp --sw 60 --no text, person, character, blood, gore, flesh, organ, shell, seashell, carapace, husk, crab, egg, cocoon, glass dome, bell jar, vial, flask, heart
```

### 24. Carapace des Fondations (Héritage, Doran, bouclier « Rempart » + « Riposte ») — `carapace-fondations.webp`
Change : plus de coque verte en forme d'œuf. Lore : elle a tenu une nuit entière devant la porte de l'ascenseur pendant la grande crue, se souvient
de chaque coup et les rend. Sujet : un grand bouclier fait d'un panneau de porte d'ascenseur en bronze, cabossé, dont chaque coup luit et renvoie
la lumière. Même composition que les autres légendaires (au-dessus d'un coffre ouvert).

```
bold graphic fantasy illustration, clean confident ink outlines, cel shading with painted textures, vibrant warm palette, stylized expressive proportions, simplified features, collectible card art. legendary artifact, a single impossible magical object levitating above an open dark chest lined with pale pearl-white satin, the inside of the chest glowing with the same color as the object, centered and filling the frame, a tall rectangular tower shield forged from an old riveted elevator door panel of green-patinated bronze, with a small round porthole window and a lever handle, its face covered with countless dents from blows, every dent glowing emerald like a remembered strike and casting sharp beams of green light back outward, strands of living kelp and green coral wound around its edges, bathed in intense emerald green light that tints the whole scene, teal bioluminescent energy swirling around it, small touches of gold, deep green-black shadows, a small broken wax seal on the edge of the chest, epic, awe-inspiring, ornate masterpiece detail, no people, no text, no letters, no numbers, family-friendly --ar 5:7 --sref https://levixqcl.github.io/empreintes/art/personnages/yse.webp --sw 60 --no text, person, character, sepia, brown, orange, mundane, blood, gore, flesh, organ, shell, seashell, carapace, turtle shell, egg, cocoon, glass dome, bell jar, vial, heart
```

## Pas encore à faire

- **Les bâtiments de la Cuvette** (la carte du district) : en cours, méthode et prompts dans `docs/prompts-cuvette.md`.
  Les lignes bleues de la paroi intérieure y sont déjà peintes (la Nuit des lignes) : plus rien à attendre d'un « archipel en îlots », piste abandonnée.
- **La plaque « Recruteur »** du Grand Tableau : facultative, prompt dans `docs/prompts-parrainage.md`.
