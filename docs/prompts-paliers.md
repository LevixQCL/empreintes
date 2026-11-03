# Paliers des bâtiments de la Cuvette — 3 novembre 2026

Trois apparences par bâtiment : **bas** (niveaux 1 à 3, chantier de récup), **milieu** (4 à 7, le tableau actuel), **haut** (8 à 10).
Le Labo et le Port n'ont pas de niveau : ils suivent la Tour du Noyau. Un Comptoir encore fermé reste un étal.

- Méthode : un zoom de la Cuvette par bâtiment et par palier, zone vidée en transparence ; Bryan peint dans Edit, sans Upscale.
  Pour le palier bas, l'ancien bâtiment est d'abord effacé du zoom (sol de la Cuvette nue).
- Pack : 14 zooms (`01-tour-bas.png` … `14-port-haut.png`) et leurs prompts (scripts/cuvette-paliers/prompts.py).
  Préfixe habituel + « salvage technology » ; `--sref art/personnages/yse.webp art/district/cuvette.webp --sw 100`.
- Intégration : scripts/cuvette-paliers (voir LISEZMOI). Dans le jeu : calques `art/district/paliers/<lieu>-<bas|haut>.webp`
  posés sur la Cuvette et sur son animation ; `CALQUES_CUVETTE` / `palierCuvette` (src/ui/art.ts), `tableau()` (src/ui/district.ts).
- La fumée de la Forge suit le haut de sa cheminée (`FUMEE_FORGE`, uniforme FUMEE de houle.ts). Les éclats et étincelles d'un
  bâtiment repeint sont masqués (ils tombaient sur l'ancien).
- Les cristaux d'un bâtiment repeint respirent (calque `-lueur`, CSS) et ont leurs éclats ; au palier haut, la zone cliquable
  suit la silhouette agrandie (`zoneHaut`).
