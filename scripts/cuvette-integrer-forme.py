"""Réintègre une sortie Midjourney Edit dans district-vide.png (carte 2464 avec la mer), avec le masque de la silhouette.
usage : python3 integrer_forme.py nom sortie_mj.png"""
import sys, numpy as np, cv2
from PIL import Image

o = 304
def cyl(m, cx, cy, rx, top, k=.55):
    ry = int(rx * k); cv2.ellipse(m, (cx + o, cy), (rx, ry), 0, 0, 360, 1, -1)
    cv2.rectangle(m, (cx - rx + o, top), (cx + rx + o, cy), 1, -1); cv2.ellipse(m, (cx + o, top), (rx, ry), 0, 0, 360, 1, -1)
def ell(m, cx, cy, rx, ry): cv2.ellipse(m, (cx + o, cy), (rx, ry), 0, 0, 360, 1, -1)
def rect(m, x1, y1, x2, y2): cv2.rectangle(m, (x1 + o, y1), (x2 + o, y2), 1, -1)

FORMES = {
    'generateur': ((314, 640), lambda m: (cyl(m, 380, 1175, 170, 1070, .5), ell(m, 215, 1095, 38, 70), ell(m, 548, 1085, 38, 70),
                                         cyl(m, 425, 1080, 32, 875), ell(m, 425, 875, 44, 22))),
    'clinique': ((566, 980), lambda m: (cyl(m, 690, 1462, 125, 1405, .42), cyl(m, 768, 1428, 38, 1300), ell(m, 650, 1484, 95, 30))),
    'comptoir': ((1036, 980), lambda m: (cyl(m, 1110, 1470, 145, 1405, .5), rect(m, 990, 1262, 1024, 1450), rect(m, 950, 1245, 1210, 1280),
                                         rect(m, 925, 1232, 975, 1305), rect(m, 1166, 1280, 1180, 1305), rect(m, 1140, 1300, 1208, 1350), ell(m, 1050, 1505, 140, 45))),
}
nom, mj = sys.argv[1], sys.argv[2]
(x0, y0), dessin = FORMES[nom]
D = np.array(Image.open('district-vide.png').convert('RGB')).astype(np.float32)
A = np.array(Image.open(mj).convert('RGB').resize((756, 756), Image.LANCZOS)).astype(np.float32)
m = np.zeros(D.shape[:2], np.uint8); dessin(m)
m = m[y0:y0 + 756, x0:x0 + 756]
Bc = D[y0:y0 + 756, x0:x0 + 756]
# ce que Midjourney a changé autour (ombre portée, détails qui débordent) est gardé aussi
d = cv2.GaussianBlur(np.abs(A - Bc).sum(2), (0, 0), 4)
m = cv2.dilate(m, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (31, 31)))
m = (m | (cv2.dilate(m, np.ones((61, 61), np.uint8)) & (d > 70))).astype(np.uint8)
m[:10] = 0; m[-10:] = 0; m[:, :10] = 0; m[:, -10:] = 0
a = np.clip((cv2.GaussianBlur(m.astype(np.float32), (0, 0), 6) - 0.1) / 0.8, 0, 1)[..., None]
D[y0:y0 + 756, x0:x0 + 756] = A * a + Bc * (1 - a)
Image.fromarray(D.astype(np.uint8)).save('district-vide.png')
Image.fromarray(D[y0:y0 + 756, x0:x0 + 756].astype(np.uint8)).save(f'{nom}-integre.png')
