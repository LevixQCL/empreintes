# Intègre le haut de cheminée de la Forge repeint dans Midjourney (Edit) à partir de docs/pack-cheminee/zoom-cheminee.png.
# Le zoom couvre (112, 430) → (868, 1186) de cuvette2-batiments.webp (1856 × 2464) ; la zone vidée est docs/pack-cheminee/zone.png.
# La sortie Midjourney est réduite à 756 px, fondue sur la zone élargie, puis recopiée dans cuvette2-batiments.webp et dans le
# tableau du jeu (cuvette.webp, 800 × 1200 = x 119 → 1763 de la Cuvette) ; les masques des animations sont refaits ensuite.
# usage : python3 scripts/cuvette-cheminee-integrer.py sortie-midjourney.png
import subprocess, sys
import numpy as np, cv2
from PIL import Image

D = 'public/art/district/'
X0, Y0, T = 112, 430, 756
A = np.asarray(Image.open(sys.argv[1]).convert('RGB').resize((T, T), Image.LANCZOS)).astype(np.float32)
z = (np.asarray(Image.open('docs/pack-cheminee/zone.png').convert('L')) > 0).astype(np.uint8)
z = cv2.dilate(z, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (21, 21)))
a = np.clip((cv2.GaussianBlur(z.astype(np.float32), (0, 0), 4) - .1) / .8, 0, 1)[..., None]

B = np.asarray(Image.open('sources/art/district/cuvette2-batiments.webp').convert('RGB')).astype(np.float32).copy()
B[Y0:Y0 + T, X0:X0 + T] = A * a + B[Y0:Y0 + T, X0:X0 + T] * (1 - a)
Image.fromarray(B.astype(np.uint8)).save('sources/art/district/cuvette2-batiments.webp', quality=92)

# le tableau du jeu : même zone, à l'échelle 800 / 1644
k = 800 / 1644
C = np.asarray(Image.open(D + 'cuvette.webp').convert('RGB')).astype(np.float32).copy()
x0, y0, t = round((X0 - 119) * k), round(Y0 * k), round(T * k)
A2 = cv2.resize(A, (t, t), interpolation=cv2.INTER_AREA)
a2 = cv2.resize(a[..., 0], (t, t), interpolation=cv2.INTER_AREA)[..., None]
xs = max(0, -x0)                                     # le zoom déborde un peu à gauche du tableau : on coupe
zone = C[y0:y0 + t, x0 + xs:x0 + t]
C[y0:y0 + t, x0 + xs:x0 + t] = A2[:, xs:] * a2[:, xs:] + zone * (1 - a2[:, xs:])
Image.fromarray(C.astype(np.uint8)).save(D + 'cuvette.webp', quality=92)
subprocess.run([sys.executable, 'scripts/cuvette-animation-masques.py'], check=True)
print('Cheminée intégrée. Vérifier FUMEE dans src/ui/houle.ts (haut de la cheminée, repère 400 × 600).')
