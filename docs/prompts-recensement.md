# Recensement des images : visages (9 novembre 2026)

**Intégré le 10 novembre 2026** : la porte scellée (Véla à la lanterne violette, lueurs `.t-flamme`/`.t-halo`/`.t-porte` recalées, `apercu.jpg` refait) et 5 gardes sur 6.
**Reste à faire : `garnison-bio-1.webp`** (garde génée I). Règle de la Bible appliquée aux versions générées : Augmentés = mèches blanches selon les implants, Résonants = mèche d'or ; ne jamais les mettre dans le `--no`.


Suite du recensement du 9 novembre (section « Images et personnages »). Chaque prompt est complet : le copier tel quel, rien à remplacer.
Une image entière à chaque fois, pas de retouche à la gomme. Un visage par personnage.

Les 4 cartes de départ (Charge, Grogner, Morsure, Bond) ont déjà leurs prompts dans `docs/prompts-departs.md`.

À déposer dans Téléchargements : Claude convertit en webp, met à la taille et range sous le nom indiqué.

| # | Fichier | Ce qui change |
|---|---|---|
| 1 | `public/intro/00-titre.webp` | Le trio conforme aux portraits : Doran gris, Véla avec sa mèche d'or et la lanterne violette, Ilka en écharpe bleu ardoise |
| 2 à 7 | `public/art/ennemis/garnison-<lignée>-<1 ou 2>.webp` | Six gardes de garnison (deux par lignée) : on ne se bat plus contre sa propre Ilka |

---

## 1. La porte scellée — `public/intro/00-titre.webp`

Sert au briefing, à la rencontre de la porte, à l'épilogue, à la chronique « Toi » et à l'aperçu de partage.
**Garder la composition** : la grande porte ronde à l'ombre de dragon en haut au centre, avec son liseré violet, et la lanterne
levée en haut à gauche, au tiers de la largeur. Le jeu pose une lueur animée à cet endroit précis.
Ce qui change : c'est Véla qui lève la lanterne, et la flamme est violette (plus orange).
Format 9:16 (816 × 1456).

```
bold graphic fantasy illustration, clean confident ink outlines, cel shading with painted textures, vibrant warm palette, stylized expressive proportions, simplified features, collectible card art. dramatic low-angle view looking up at three companions crowded close to the viewer in a deep rocky mine shaft, behind them a huge round sealed ancient stone door fills the upper half of the frame, carved concentric rings, a giant serpentine dragon shadow cast across the door, a thin glowing violet rim of light around the door edge, broken wooden scaffolding beams above, on the left a young woman courier with short spiky white hair, freckles and a wide cheeky grin, slate-blue hooded scarf around her neck and worn grey utility jacket, sleek black mechanical legs with glowing blue crystal cores at the knees in the foreground; in the center a calm woman around forty with loose shoulder-length dark hair and a single bright metallic gold streak across her forehead, hood down on her shoulders, her arm raised high to the upper left holding a dark iron lantern with a cold violet flame, the lantern placed at one third of the width and one third of the height; on the right a broad-shouldered man in his fifties with grey hair and a thick grey beard, warm tired smile, teal-green chitin plates on his shoulder and forearm, rolled-up work shirt, each face distinct, cold blue glow on the courier, violet lantern light on the door and faces, soft green glow on the old man, no text, no letters, no numbers, no signs with writing, no flags, no real person, no religious motifs, family-friendly, no blood, no gore --ar 9:16 --sref https://levixqcl.github.io/empreintes/intro/10-toi.webp https://levixqcl.github.io/empreintes/art/personnages/yse.webp --sw 60 --no text, orange jacket, orange scarf, orange flame, brown hair on the old man, brown beard, young man, purple armor, black armor, braid
```

Après intégration : la lueur animée de la lanterne (`.t-flamme` et `.t-halo` dans `src/ui/scenes.css`) passe du orange au violet,
et l'aperçu de partage `apercu.jpg` est regénéré à partir de la nouvelle image.

---

## 2. Gardes de garnison — `public/art/ennemis/garnison-*.webp`

Quand on pille un district voisin, ou quand on défie le quai d'un autre directeur sur la Flèche, chaque garde gardait le visage
du Porteur qu'il sert : on se battait contre Ilka, Doran ou Véla. Désormais le garde garde le nom du Porteur, mais prend un visage
de garde de sa lignée (deux variantes par lignée, pour que deux gardes d'une même lignée se distinguent).

Tous portent la même tenue de milice de district (gambison gris ardoise, gorgerin de laiton, petit insigne rond sans motif),
sur la digue d'une cuvette voisine au crépuscule. Aucun ne doit ressembler aux Porteurs : ni cheveux blancs en pics, ni barbe grise,
ni mèche d'or, ni écharpe bleue. Format 3:4, comme les gardes de la Flèche (600 × 797).

### 2. Garde augmentée I — `garnison-tech-1.webp`
Une femme d'une trentaine d'années, peau brune, cheveux noirs rasés sur un côté, bras droit mécanique bleu acier.

```
bold graphic fantasy illustration, clean confident ink outlines, cel shading with painted textures, vibrant warm palette, stylized expressive proportions, simplified features, collectible card art. waist-up portrait of a district garrison guard, a sharp-eyed woman in her thirties, warm brown skin, black hair shaved on one side and swept over the other, a thin scar across her eyebrow, focused unsmiling expression, a sleek steel-blue mechanical right arm with glowing cyan crystal joints resting on a short steel baton, slate-grey padded gambeson with a polished brass gorget and a small plain round brass badge, standing on the top of a high curved stone sea dike at dusk, a sunken circular district basin with pumps and thin blue light lines behind her, grey sea beyond the wall, cold blue rim light, no text, no letters, no numbers, no flags, no religious motifs, family-friendly, no blood, no gore --ar 3:4 --sref https://levixqcl.github.io/empreintes/art/ennemis/brigadier.webp https://levixqcl.github.io/empreintes/art/personnages/hald.webp --sw 60 --no white hair, spiky hair, freckles, blue scarf, mechanical legs, beard, gold streak
```

### 3. Garde augmenté II — `garnison-tech-2.webp`
Un jeune homme d'une vingtaine d'années, roux, peau claire, œil remplacé par une lentille bleue.

```
bold graphic fantasy illustration, clean confident ink outlines, cel shading with painted textures, vibrant warm palette, stylized expressive proportions, simplified features, collectible card art. waist-up portrait of a district garrison guard, a lanky young man around twenty, pale skin, short copper-red hair, clean-shaven, a round glowing blue optical lens replacing his left eye set in a brass socket, nervous but determined half-smile, a steel shoulder brace with small blue indicator lights, slate-grey padded gambeson with a polished brass gorget and a small plain round brass badge, holding a long hooked steel pole, standing on the top of a high curved stone sea dike at dusk, a sunken circular district basin with pumps and thin blue light lines behind him, grey sea beyond the wall, cold blue rim light, no text, no letters, no numbers, no flags, no religious motifs, family-friendly, no blood, no gore --ar 3:4 --sref https://levixqcl.github.io/empreintes/art/ennemis/brigadier.webp https://levixqcl.github.io/empreintes/art/personnages/hald.webp --sw 60 --no white hair, beard, freckles, blue scarf, mechanical legs, dark hair, square jaw
```

### 4. Garde génée I — `garnison-bio-1.webp`
Une femme d'une cinquantaine d'années, peau olive, tresse auburn en couronne, écailles émeraude au cou et aux avant-bras.

```
bold graphic fantasy illustration, clean confident ink outlines, cel shading with painted textures, vibrant warm palette, stylized expressive proportions, simplified features, collectible card art. waist-up portrait of a district garrison guard, a stocky woman in her fifties, olive skin, auburn hair braided in a crown around her head, laugh lines, calm watchful expression, small glossy emerald reptile scales running along the side of her neck and over her forearms, slate-grey padded gambeson with a polished brass gorget and a small plain round brass badge, arms folded over a heavy wooden round shield, standing on the top of a high curved stone sea dike at dusk, a sunken circular district basin with pumps and thin blue light lines behind her, grey sea beyond the wall, soft emerald-green rim light, no text, no letters, no numbers, no flags, no religious motifs, family-friendly, no blood, no gore --ar 3:4 --sref https://levixqcl.github.io/empreintes/art/ennemis/brigadier.webp https://levixqcl.github.io/empreintes/art/personnages/hald.webp --sw 60 --no grey hair, beard, chitin, shell, carapace, man, blue scarf
```

### 5. Garde géné II — `garnison-bio-2.webp`
Un homme d'une trentaine d'années, cheveux noirs en chignon haut, yeux ambre de reptile, ouïes vertes au cou.

```
bold graphic fantasy illustration, clean confident ink outlines, cel shading with painted textures, vibrant warm palette, stylized expressive proportions, simplified features, collectible card art. waist-up portrait of a district garrison guard, a lean man in his thirties, tan skin, straight black hair tied in a high top knot, clean-shaven, amber reptilian eyes with slit pupils, faint green gill slits glowing on the side of his neck, wary sideways glance, slate-grey padded gambeson with a polished brass gorget and a small plain round brass badge, holding a short trident, standing on the top of a high curved stone sea dike at dusk, a sunken circular district basin with pumps and thin blue light lines behind him, grey sea beyond the wall, soft emerald-green rim light, no text, no letters, no numbers, no flags, no religious motifs, family-friendly, no blood, no gore --ar 3:4 --sref https://levixqcl.github.io/empreintes/art/ennemis/brigadier.webp https://levixqcl.github.io/empreintes/art/personnages/hald.webp --sw 60 --no grey hair, beard, moustache, chitin, shell, carapace, old man, blue scarf
```

### 6. Garde résonante I — `garnison-reso-1.webp`
Une jeune femme, peau foncée, cheveux noirs bouclés courts, un diapason de cristal violet à l'oreille.

```
bold graphic fantasy illustration, clean confident ink outlines, cel shading with painted textures, vibrant warm palette, stylized expressive proportions, simplified features, collectible card art. waist-up portrait of a district garrison guard, a young woman in her twenties, deep dark-brown skin, short black curly hair, a small violet crystal tuning fork worn as an earring, eyes faintly glowing violet, serene but alert expression, one hand raised with a thin ring of violet light hovering above her palm, slate-grey padded gambeson with a polished brass gorget and a small plain round brass badge, standing on the top of a high curved stone sea dike at dusk, a sunken circular district basin with pumps and thin blue light lines behind her, grey sea beyond the wall, amethyst and violet rim light, no text, no letters, no numbers, no flags, no religious motifs, family-friendly, no blood, no gore --ar 3:4 --sref https://levixqcl.github.io/empreintes/art/ennemis/brigadier.webp https://levixqcl.github.io/empreintes/art/personnages/hald.webp --sw 60 --no gold streak, hood, lantern, white hair, long hair, blue scarf, orange light
```

### 7. Garde résonant II — `garnison-reso-2.webp`
Un homme d'une quarantaine d'années, longs cheveux bruns ondulés noués, petit bouc, mains éclairées de violet.

```
bold graphic fantasy illustration, clean confident ink outlines, cel shading with painted textures, vibrant warm palette, stylized expressive proportions, simplified features, collectible card art. waist-up portrait of a district garrison guard, a quiet man in his forties, light brown skin, long wavy dark-brown hair tied back at the nape, a short neat goatee, heavy-lidded patient eyes, both hands loosely joined in front of him with soft violet light glowing between his fingers, slate-grey padded gambeson with a polished brass gorget and a small plain round brass badge, standing on the top of a high curved stone sea dike at dusk, a sunken circular district basin with pumps and thin blue light lines behind him, grey sea beyond the wall, amethyst and violet rim light, no text, no letters, no numbers, no flags, no religious motifs, family-friendly, no blood, no gore --ar 3:4 --sref https://levixqcl.github.io/empreintes/art/ennemis/brigadier.webp https://levixqcl.github.io/empreintes/art/personnages/hald.webp --sw 60 --no grey hair, full beard, bald, gold streak, hood, lantern, blue scarf, orange light
```

Après intégration : ajouter les six noms dans `GARNISONS_PEINTES` (`src/ui/art.ts`).
