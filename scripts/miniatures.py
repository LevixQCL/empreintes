# Les miniatures des portraits (28 octobre 2026) : 120 × 132 px, le visage cadré comme dans les avatars hexagonaux.
# À relancer après l'ajout ou le remplacement d'un portrait dans public/art/porteurs/ :
#   python3 scripts/miniatures.py
import glob
import os

from PIL import Image

racine = os.path.join(os.path.dirname(__file__), '..', 'public', 'art', 'porteurs')
os.makedirs(os.path.join(racine, 'mini'), exist_ok=True)
for chemin in sorted(glob.glob(os.path.join(racine, '*.webp'))):
    image = Image.open(chemin).convert('RGB')
    largeur, hauteur = image.size
    # même rapport que l'hexagone (1 × 1,1) et même cadrage vertical (14 %) que .avatar img
    haut = round(largeur * 1.1)
    dessus = round((hauteur - haut) * 0.14)
    mini = image.crop((0, dessus, largeur, dessus + haut)).resize((120, 132), Image.LANCZOS)
    mini.save(os.path.join(racine, 'mini', os.path.basename(chemin)), 'WEBP', quality=82, method=6)
    print('miniature :', os.path.basename(chemin))
