# Paliers des bâtiments de la Cuvette (3 novembre 2026)

À lancer depuis un dossier de travail qui contient `bat.webp` (= sources/art/district/cuvette2-batiments.webp),
`nue.webp` (= sources/art/district/cuvette2-nue.webp), `zooms/` et `mj/` (sorties Midjourney, `<lieu>-<bas|haut>.png`).
Les sorties et les zooms de ce lot sont gardés dans sources/art/district/paliers (mj-*.webp, zoom-*.webp).

1. `masques.py` puis `mid.py` : le bâtiment actuel (palier du milieu) de chaque lieu, par différence avec la Cuvette nue.
2. `zooms.py` : les 14 zooms 756 px, zone vidée en transparence (silhouettes : `formes.py`) ; prompts : `prompts.py`.
3. Bryan peint chaque zoom dans l'éditeur de Midjourney (Edit), sans Upscale.
4. `calques.py` : les calques posés dans le jeu (public/art/district/paliers, positions → CALQUES_CUVETTE dans src/ui/art.ts).
   Un calque ne garde de ses voisins que ce qui est derrière lui ; ils se posent du fond vers l'avant.
5. `feuilles.py` : les illustrations des feuilles de bâtiment (public/art/batiments/<id>-1 à 4.webp ; 2 = l'actuel).
6. `extras.py` : la lueur des cristaux de chaque calque (<lieu>-<palier>-lueur.webp), leurs éclats et la zone cliquable du palier haut.
7. `melange.py sortie.png forge=haut clinique=bas …` : un tableau pour vérifier un mélange de paliers.
