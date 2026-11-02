"""Réintègre une sortie Midjourney Edit (zoom 756 px) dans la Cuvette, bords fondus.
usage : python3 integrer.py base.png sortie_mj.png x0 y0 cx cy rx sommet resultat.png
"""
import sys, cv2, numpy as np
from scipy import ndimage

base, mj, x0, y0, cx, cy, rx, top, res = sys.argv[1:]
x0, y0, cx, cy, rx, top = map(int, (x0, y0, cx, cy, rx, top))
A = cv2.imread(mj); B = cv2.imread(base)

# contrôle de l'alignement (doit donner ≈ x0, y0, échelle 0,738)
s = cv2.SIFT_create(8000)
ka, da = s.detectAndCompute(cv2.cvtColor(A, cv2.COLOR_BGR2GRAY), None)
kb, db = s.detectAndCompute(cv2.cvtColor(B, cv2.COLOR_BGR2GRAY), None)
g = [p for p, q in cv2.BFMatcher().knnMatch(da, db, k=2) if p.distance < 0.75 * q.distance]
M, _ = cv2.estimateAffinePartial2D(np.float32([ka[p.queryIdx].pt for p in g]),
                                   np.float32([kb[p.trainIdx].pt for p in g]), ransacReprojThreshold=3)
print('alignement', M.round(3).tolist())

Ar = cv2.resize(A, (756, 756), interpolation=cv2.INTER_AREA).astype(np.float32)
Bc = B[y0:y0 + 756, x0:x0 + 756].astype(np.float32)
z = np.zeros(B.shape[:2], np.uint8); ry = int(rx * .55)
cv2.ellipse(z, (cx, cy), (rx, ry), 0, 0, 360, 1, -1)
cv2.rectangle(z, (cx - rx, top), (cx + rx, cy), 1, -1)
cv2.ellipse(z, (cx, top), (rx, ry), 0, 0, 360, 1, -1)
z = z[y0:y0 + 756, x0:x0 + 756]
d = cv2.GaussianBlur(np.abs(Ar - Bc).sum(2), (0, 0), 6)
n, lab = cv2.connectedComponents((d > 120).astype(np.uint8))
sz = np.bincount(lab.ravel()); sz[0] = 0
m = (z | ndimage.binary_fill_holes(lab == sz.argmax())).astype(np.uint8)
m = cv2.dilate(m, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (41, 41)))
m[:12] = 0; m[-12:] = 0; m[:, :12] = 0; m[:, -12:] = 0
a = np.clip((cv2.GaussianBlur(m.astype(np.float32), (0, 0), 6) - 0.1) / 0.8, 0, 1)[..., None]
out = B.astype(np.float32); out[y0:y0 + 756, x0:x0 + 756] = Ar * a + Bc * (1 - a)
out = np.clip(out, 0, 255).astype(np.uint8)
cv2.imwrite(res, out)
cv2.imwrite(res.replace('.png', '-zoom.png'), out[y0:y0 + 756, x0:x0 + 756])
cv2.imwrite(res.replace('.png', '-vue.png'), cv2.resize(out, (696, 924), interpolation=cv2.INTER_AREA))
