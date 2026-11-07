# Copie les images du livre (images.txt) depuis public/, réduites pour une lecture fluide sur téléphone.
# usage : python3 scripts/livre-images.py <dossier du livre>
import sys, os
from PIL import Image
dossier = sys.argv[1]
racine = os.path.join(os.path.dirname(__file__), '..', 'public')
for ligne in open(os.path.join(dossier, 'images.txt')).read().split():
    src = os.path.join(racine, ligne)
    dst = os.path.join(dossier, 'img', ligne.removeprefix('art/'))
    os.makedirs(os.path.dirname(dst), exist_ok=True)
    im = Image.open(src)
    # les vignettes (cartes, ennemis, portraits) restent petites ; les grandes illustrations gardent 1100 px de large
    large = 360 if ligne.startswith(('art/modules/', 'art/ennemis/')) else 1100
    if im.width > large: im = im.resize((large, round(im.height * large / im.width)), Image.LANCZOS)
    im.save(dst, 'WEBP', quality=74, method=6)
print('ok')
