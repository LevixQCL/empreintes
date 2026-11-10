# Prompts du 11 novembre 2026 : Strates du Fond, Chroniques sans image, garde génée I

Préfixe commun (déjà inclus dans chaque prompt) : « bold graphic fantasy illustration, clean confident ink outlines, cel shading with painted textures, vibrant warm palette, stylized expressive proportions, simplified features, collectible card art. »
Règle : aucun des trois héros reconnaissable (Midjourney ne garde pas leurs visages) ; silhouettes lointaines au plus.

## Strates du Fond — `public/art/strates/strate-11.webp` à `strate-15.webp` (800 × 1000, 4:5)
Aujourd'hui −11 à −15 reprennent le décor de −10. Une fois peintes : passer `STRATES_PEINTES` à 15 dans `src/ui/art.ts` et faire les `-fond.webp` (600 × 750, floutés).

### −11 · L'eau d'en bas — `strate-11.webp`
```
bold graphic fantasy illustration, clean confident ink outlines, cel shading with painted textures, vibrant warm palette, stylized expressive proportions, simplified features, collectible card art. an ancient carved stone staircase descending into perfectly still crystal-clear underground water, the steps clearly visible continuing down below the surface, a long horizontal water line carved into the wall with small abstract marks beside it, already three steps under the water, pale blue crystals in the vaulted ceiling perfectly mirrored in the motionless water, a thin graduated measuring rod planted on the last dry step, faint warm mist, calm and uncanny, no people, no text, no letters, no numbers, family-friendly --ar 4:5 --sref https://levixqcl.github.io/empreintes/art/strates/strate-9.webp https://levixqcl.github.io/empreintes/art/strates/strate-8.webp --sw 60 --no text, letters, people, person, sea waves, salt, machinery
```

### −12 · La forêt de cristal — `strate-12.webp`
```
bold graphic fantasy illustration, clean confident ink outlines, cel shading with painted textures, vibrant warm palette, stylized expressive proportions, simplified features, collectible card art. an immense underground hall filled with thousands of tall crystal columns rising from the floor to a distant stone vault, most of them glowing a soft gentle blue, in the foreground a row of dark extinguished columns cleanly cut at their base, beside them an abandoned old work camp with wooden crates, an oil lamp and large steel pincer tools neatly lined up by size, the stone floor slightly tilted toward the dark columns, vast and silent, no people, no text, no letters, no numbers, family-friendly --ar 4:5 --sref https://levixqcl.github.io/empreintes/art/strates/strate-9.webp https://levixqcl.github.io/empreintes/art/strates/strate-8.webp --sw 60 --no text, letters, people, person, trees, leaves, sci-fi panels
```

### −13 · Le registre des colonnes — `strate-13.webp`
```
bold graphic fantasy illustration, clean confident ink outlines, cel shading with painted textures, vibrant warm palette, stylized expressive proportions, simplified features, collectible card art. a huge ancient stone table as long as a wall, covered with neat columns of abstract engraved glyphs, many of its squares crudely scratched out by rough human tool marks, facing rows of tall glowing blue crystal columns, one column in the middle cracked along its full height and flickering, a massive upright stone slab at the end like a monument, solemn underground light, no people, no text, no letters, no numbers, family-friendly --ar 4:5 --sref https://levixqcl.github.io/empreintes/art/strates/strate-9.webp https://levixqcl.github.io/empreintes/art/strates/strate-8.webp --sw 60 --no text, letters, readable writing, people, person, machinery
```

### −14 · Ton pilier — `strate-14.webp`
```
bold graphic fantasy illustration, clean confident ink outlines, cel shading with painted textures, vibrant warm palette, stylized expressive proportions, simplified features, collectible card art. low-angle view of a single enormous young crystal column holding up a stone vault, from which hang the deep foundations of a district far above, old concrete pillar roots and pipes, the column cracked over one third of its height with blue light leaking from the crack, old grey mortar patches on the vault cracks, at its foot a small engraved panel of abstract glyphs polished smooth by many hands, the other columns far away in the dark, no people, no text, no letters, no numbers, family-friendly --ar 4:5 --sref https://levixqcl.github.io/empreintes/art/strates/strate-9.webp https://levixqcl.github.io/empreintes/art/strates/strate-8.webp --sw 60 --no text, letters, people, person, sci-fi panels
```

### −15 · Les vannes — `strate-15.webp`
```
bold graphic fantasy illustration, clean confident ink outlines, cel shading with painted textures, vibrant warm palette, stylized expressive proportions, simplified features, collectible card art. the very bottom of the world, a long row of massive ancient valves and handwheels made of a pale untarnished silver metal set into the bedrock, thin veils of glowing filtered sea water seeping down through the stone into the valves, oversized ancient tools lying at the foot of a handwheel far too big for human hands, in front a large flat stone table engraved with a single broad line of abstract glyphs glowing softly, deep calm, solemn and quiet, no people, no text, no letters, no numbers, family-friendly --ar 4:5 --sref https://levixqcl.github.io/empreintes/art/strates/strate-9.webp https://levixqcl.github.io/empreintes/art/strates/strate-8.webp --sw 60 --no text, letters, people, person, rust, modern pipes, sci-fi panels
```

## Chroniques — `public/intro/<fichier>.webp` (816 × 1456, 9:16)
Neuf chapitres reprennent l'image d'un autre. Une fois peintes : changer `image:` du chapitre dans `src/core/chroniques.ts`.

| Fichier | Chapitre |
|---|---|
| `chap-chouettes` | Les yeux d'or |
| `chap-vierges` | Le Registre des Vierges |
| `chap-post-scriptum` | Post-scriptum |
| `chap-clause` | Il y est reçu |
| `chap-rouvrir` | J'avais fermé mon cahier |
| `chap-foret` | La forêt sous l'eau |
| `chap-ceux-qui-portent` | Ceux qui portent |
| `chap-cent-douze` | Ton pilier |
| `chap-se-rendre` | Ce qui tient ne se reprend pas |

Les prompts sont dans le message du 11 novembre 2026 et ci-dessous.

```
chap-chouettes : a group of exhausted adult miners coming out of a collapsed mine gallery into harsh white market floodlights, led hand in hand by a few ten-year-old children with large glowing golden eyes squinting at the light, giant market screens above showing the scene live, a crowd behind barriers
chap-vierges : a secret vault inside a sky-island palace, rows of velvet cases holding flawless untouched crystal stones glowing pure and clear, a hand in an elegant gold-trimmed sleeve choosing one, while on a worn wooden workers' table in the foreground lies a dull cloudy copied stone
chap-post-scriptum : an old engraved stone tablet resting on an archivist's desk under a lamp, two lines of abstract glyphs carved in the same hand, the second line fresher and deeper, notebooks and a magnifying glass beside it, quiet night
chap-clause : the scarred weathered hands of an old man holding a crumpled handwritten draft on a stained worksite sheet with illegible scribbles, in a dim dockside room, behind him on the wall a polished official framed treaty with a gold seal
chap-rouvrir : an archivist's desk at night, an open notebook, a small glass vial of clear water with condensation catching the lamplight, a trail of wet footprints from the door, stacks of old files
chap-foret : a work team in old heavy work suits with headlamps cutting glowing crystal columns at their base with huge steel pincers, in a vast underground forest of blue crystal columns, wooden crates full of glowing crystal hearts
chap-ceux-qui-portent : tall slender robed figures with hidden faces carving themselves into crystal columns, arms raised to hold up a stone vault above dark water, while far above them a long staircase climbs toward a faint light with small figures going up
chap-cent-douze : a cross-section view of the earth, a sunken circular district basin with its tower at the top, deep below through layers of rock a single cracked crystal column holding it up, other columns under neighbouring basins, a floating sky island above casting a shadow
chap-se-rendre : a single small figure seen from behind standing before a long row of ancient pale metal valves at the very bottom of the world, filtered water glowing as it seeps through the stone, crystal columns rising into the dark above
```
Chaque ligne s'utilise avec le préfixe commun devant, et à la fin : `, no text, no letters, no numbers, no flags, no religious motifs, family-friendly, no blood, no gore --ar 9:16 --sref https://levixqcl.github.io/empreintes/intro/01-on-savait.webp https://levixqcl.github.io/empreintes/intro/chap-lettre.webp`

## Garde génée I — `public/art/ennemis/garnison-bio-1.webp` (600 × 797)
```
bold graphic fantasy illustration, clean confident ink outlines, cel shading with painted textures, vibrant warm palette, stylized expressive proportions, simplified features, collectible card art. waist-up portrait of a district garrison guard, a stocky woman in her fifties, olive skin, auburn hair braided in a crown around her head, laugh lines, calm watchful expression, small glossy emerald reptile scales running along the side of her neck and over her forearms, slate-grey padded gambeson with a polished brass gorget and a small plain round brass badge, arms folded over a heavy wooden round shield, standing on the top of a high curved stone sea dike at dusk, a sunken circular district basin with pumps and thin blue light lines behind her, grey sea beyond the wall, soft emerald-green rim light, no text, no letters, no numbers, no flags, no religious motifs, family-friendly, no blood, no gore --ar 3:4 --sref https://levixqcl.github.io/empreintes/art/ennemis/brigadier.webp https://levixqcl.github.io/empreintes/art/personnages/hald.webp --sw 60 --no grey hair, beard, chitin, shell, carapace, man, blue scarf, white strands, gold streak
```
