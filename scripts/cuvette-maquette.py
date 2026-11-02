"""Construit docs/maquette-cuvette.html : district peint + mer animée (houle sur l'eau seule, reflets, cristaux)."""
import numpy as np, cv2, base64, io
from PIL import Image

S = 1400; k = S / 2464; o = 304; x0, y0 = 1612, 1552
out = Image.open('district-mer.png').convert('RGB').resize((S, S), Image.LANCZOS)
can = np.array(Image.open('cuvette-mer-a-peindre.png'))[..., 3]

# parties fixes (ne bougent pas avec l'eau) : la Cuvette, le ponton et la barque
fix = np.zeros((2464, 2464), np.uint8)
P = lambda pts: np.array([(x + x0, y + y0) for x, y in pts])
cv2.fillPoly(fix, [P([(85, 250), (200, 250), (390, 560), (350, 660), (240, 650), (85, 430)])], 255)
cv2.fillPoly(fix, [P([(200, 235), (315, 220), (520, 400), (560, 630), (370, 650)])], 255)
fix = np.maximum(can, fix)
a = cv2.resize(fix, (S, S), interpolation=cv2.INTER_AREA)
mer = np.array(out.convert('RGBA'))
mer[..., 3] = 255 - cv2.GaussianBlur(cv2.dilate(a, np.ones((5, 5), np.uint8)), (0, 0), 3)

# fond : la mer seule, très floue, pour remplir l'écran au-delà de l'image
petit = np.array(out.resize((256, 256), Image.LANCZOS))
mm = cv2.dilate((cv2.resize(can, (256, 256), interpolation=cv2.INTER_AREA) > 10).astype(np.uint8), np.ones((25, 25), np.uint8))
fond = cv2.GaussianBlur(cv2.inpaint(petit, mm, 15, cv2.INPAINT_TELEA), (0, 0), 6)


def b64(im, q=82):
    bio = io.BytesIO(); im.save(bio, 'WEBP', quality=q, method=6)
    return 'data:image/webp;base64,' + base64.b64encode(bio.getvalue()).decode()


B, M = b64(out), b64(Image.fromarray(mer))
F = b64(Image.fromarray(fond).resize((512, 512), Image.BICUBIC), 80)
cr = [(425, 960, 55), (813, 800, 45), (1181, 699, 55), (768, 1335, 35), (1110, 1440, 40), (1288, 1101, 50)]
glows = ''.join(
    f'<i class="g" style="left:{(x + o) * k / S * 100:.2f}%;top:{y * k / S * 100:.2f}%;'
    f'width:{r * 2 * k / S * 100:.2f}%;animation-delay:{i * 0.7:.1f}s"></i>' for i, (x, y, r) in enumerate(cr))

html = f'''<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>EMPREINTES — maquette de la Cuvette</title><style>
html,body{{margin:0;height:100%;background:#5e9480;overflow:hidden;font-family:system-ui,sans-serif}}
.fond{{position:fixed;left:-40px;top:-40px;width:calc(100% + 80px);height:calc(100% + 80px);object-fit:cover;filter:blur(10px)}}
.scene{{position:absolute;left:50%;top:50%;width:min(max(100vw,100vh),130vw,110vh);aspect-ratio:1;transform:translate(-50%,-47%);
 -webkit-mask:linear-gradient(180deg,transparent,#000 7%,#000 93%,transparent);mask:linear-gradient(180deg,transparent,#000 7%,#000 93%,transparent)}}
.cadre{{position:absolute;inset:0;-webkit-mask:linear-gradient(90deg,transparent,#000 7%,#000 93%,transparent);mask:linear-gradient(90deg,transparent,#000 7%,#000 93%,transparent)}}
.scene img{{position:absolute;inset:0;width:100%;height:100%}}
.bord{{position:absolute;inset:0;pointer-events:none;box-shadow:inset 0 0 3vmin 2vmin #5e9480;opacity:.6}}
.mer{{filter:url(#houle)}}
.reflet{{mix-blend-mode:screen;animation:scint 3.2s ease-in-out infinite;
 -webkit-mask:radial-gradient(30% 45% at 92% 30%,#000 0,transparent 70%);mask:radial-gradient(30% 45% at 92% 30%,#000 0,transparent 70%)}}
@keyframes scint{{0%,100%{{opacity:.05}}50%{{opacity:.4}}}}
.g{{position:absolute;aspect-ratio:1;transform:translate(-50%,-50%);border-radius:50%;
 background:radial-gradient(circle,rgba(140,230,255,.75) 0,rgba(90,200,255,.25) 40%,transparent 70%);mix-blend-mode:screen;animation:pulse 2.8s ease-in-out infinite}}
@keyframes pulse{{0%,100%{{opacity:.35;transform:translate(-50%,-50%) scale(.85)}}50%{{opacity:.95;transform:translate(-50%,-50%) scale(1.1)}}}}
h1{{position:fixed;left:12px;top:10px;margin:0;color:#fff;font:600 14px/1.3 system-ui;text-shadow:0 1px 3px #0008}}
h1 small{{display:block;font-weight:400;opacity:.8}}
</style></head><body>
<svg width="0" height="0" style="position:absolute"><filter id="houle" x="0" y="0" width="100%" height="100%">
<feTurbulence type="fractalNoise" baseFrequency="0.006 0.018" numOctaves="2" seed="3">
<animate attributeName="baseFrequency" dur="14s" values="0.006 0.018;0.0075 0.021;0.006 0.018" repeatCount="indefinite"/></feTurbulence>
<feDisplacementMap in="SourceGraphic" scale="9" xChannelSelector="R" yChannelSelector="G"/></filter></svg>
<img class="fond" src="{F}" alt="">
<div class="scene"><div class="cadre">
<img src="{B}" alt="">
<img class="mer" src="{M}" alt="">
<img class="reflet" src="{M}" alt="">
{glows}
</div></div>
<h1>EMPREINTES — maquette du district<small>INPP Houben</small></h1>
</body></html>'''
open('maquette-cuvette.html', 'w').write(html)
