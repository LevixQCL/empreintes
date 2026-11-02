import numpy as np,cv2,base64,io
from PIL import Image
S=1400;W0,H0=1856,2464;k=S/W0;Hs=int(H0*k)
out=Image.open('district2.png').convert('RGB').resize((S,Hs),Image.LANCZOS)
m=np.load('mer2.npy').astype(np.uint8)*255
bat=np.zeros_like(m);cv2.ellipse(bat,(1700,2200),(160,70),27,0,360,255,-1)   # barque immobile
m=np.where(bat>0,0,m)
mr=cv2.GaussianBlur(cv2.resize(m,(S,Hs),interpolation=cv2.INTER_AREA),(0,0),2)
mer=np.array(out.convert('RGBA'));mer[...,3]=mr
def b64(im,q=82):
    bio=io.BytesIO();im.save(bio,'WEBP',quality=q,method=6);return 'data:image/webp;base64,'+base64.b64encode(bio.getvalue()).decode()
B,M=b64(out),b64(Image.fromarray(mer))
G=[(955,608,45,'b'),(1405,973,45,'b'),(853,1453,40,'b'),(624,1373,35,'b'),(1261,1533,40,'b'),(1420,2148,35,'b'),(619,1187,45,'o')]
glows=''.join(f'<i class="g {c}" style="left:{x/W0*100:.2f}%;top:{y/H0*100:.2f}%;width:{r*2/W0*100:.2f}%;animation-delay:{i*.6:.1f}s"></i>' for i,(x,y,r,c) in enumerate(G))
html=f'''<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>EMPREINTES — maquette du district</title><style>
html,body{{margin:0;height:100%;background:#123c3f;overflow:hidden;font-family:system-ui,sans-serif}}
.scene{{position:absolute;left:50%;top:50%;height:100vh;aspect-ratio:{W0}/{H0};transform:translate(-54%,-50%)}}
.scene img{{position:absolute;inset:0;width:100%;height:100%}}
.mer{{filter:url(#houle)}}
.g{{position:absolute;aspect-ratio:1;transform:translate(-50%,-50%);border-radius:50%;mix-blend-mode:screen;animation:pulse 2.8s ease-in-out infinite}}
.g.b{{background:radial-gradient(circle,rgba(140,230,255,.8) 0,rgba(90,200,255,.25) 40%,transparent 70%)}}
.g.o{{background:radial-gradient(circle,rgba(255,170,80,.8) 0,rgba(255,120,40,.25) 40%,transparent 70%);animation-duration:1.6s}}
@keyframes pulse{{0%,100%{{opacity:.35;transform:translate(-50%,-50%) scale(.85)}}50%{{opacity:1;transform:translate(-50%,-50%) scale(1.1)}}}}
h1{{position:fixed;left:12px;top:10px;margin:0;color:#fff;font:600 14px/1.3 system-ui;text-shadow:0 1px 3px #000a}}
h1 small{{display:block;font-weight:400;opacity:.8}}
</style></head><body>
<svg width="0" height="0" style="position:absolute"><filter id="houle" x="0" y="0" width="100%" height="100%">
<feTurbulence type="fractalNoise" baseFrequency="0.006 0.018" numOctaves="2" seed="3">
<animate attributeName="baseFrequency" dur="14s" values="0.006 0.018;0.0075 0.021;0.006 0.018" repeatCount="indefinite"/></feTurbulence>
<feDisplacementMap in="SourceGraphic" scale="9" xChannelSelector="R" yChannelSelector="G"/></filter></svg>
<div class="scene"><img src="{B}" alt=""><img class="mer" src="{M}" alt="">{glows}</div>
<h1>EMPREINTES — maquette du district<small>INPP Houben</small></h1></body></html>'''
open('maquette-cuvette2.html','w').write(html)
