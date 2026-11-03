# Détoure chaque bâtiment de la Cuvette (cuvette2-batiments.webp, comparé à cuvette2-nue.webp) pour l'illustration de sa feuille
# (public/art/batiments/<id>.webp, 520 × 520, fond transparent) et fait la vignette ronde du district (district/cuvette-vignette.webp).
# Chaque pixel changé revient au bâtiment dont la zone cliquable (ZONES_CUVETTE, repère 400 × 600) est la plus proche.
# usage : python3 scripts/cuvette-detourer-batiments.py   (à relancer quand un bâtiment est repeint)
import numpy as np, cv2, sys
from PIL import Image
D='public/art/district/'
B=np.asarray(Image.open(D+'cuvette2-batiments.webp').convert('RGB'))
N=np.asarray(Image.open('sources/art/district/cuvette2-nue.webp').convert('RGB'))
d=(np.abs(N.astype(int)-B.astype(int)).sum(2)>45).astype(np.uint8)
Z={
 'noyau':'182,146 232,146 236,250 232,282 182,282 178,250',
 'labo':'286,240 358,238 362,300 330,316 288,312',
 'forge':'72,232 144,228 148,300 120,322 74,318',
 'clinique':'60,326 134,326 138,380 104,398 62,392',
 'generateur':'138,354 212,354 216,420 176,438 140,430',
 'comptoir':'240,312 312,312 314,400 280,420 240,410',
 'port':'296,520 400,520 400,588 300,590',
}
H,W=d.shape
def poly(z): return np.array([[119+float(a)*4.11,float(b)*4.11] for a,b in (q.split(',') for q in z.split())],np.int32)
dist=[]
for k,z in Z.items():
  c=np.ones_like(d); cv2.fillPoly(c,[poly(z)],0); dist.append(cv2.distanceTransform(c,cv2.DIST_L2,5))
proche=np.argmin(np.stack(dist),0)
for ik,(k,z) in enumerate(Z.items()):
  p=np.array([[119+float(a)*4.11,float(b)*4.11] for a,b in (q.split(',') for q in z.split())],np.int32)
  lim=np.zeros_like(d); cv2.fillPoly(lim,[p],1)
  lim=cv2.dilate(lim,cv2.getStructuringElement(cv2.MORPH_ELLIPSE,(110,)*2))
  for dy in range(0,200,10): lim=lim|np.roll(lim,-10,0)
  m=d*lim*(proche==ik)
  m=cv2.morphologyEx(m,cv2.MORPH_CLOSE,cv2.getStructuringElement(cv2.MORPH_ELLIPSE,(31,31)))
  # remplir les trous
  ff=m.copy(); msk=np.zeros((H+2,W+2),np.uint8); cv2.floodFill(ff,msk,(0,0),1); m=m|(1-ff)
  # garder les grandes composantes
  n,lab,st,_=cv2.connectedComponentsWithStats(m)
  keep=np.zeros_like(m)
  coeur=np.zeros_like(d); cv2.fillPoly(coeur,[p],1)
  for i in range(1,n):
    if st[i,4]>800 and (coeur[lab==i]).mean()>0.25: keep[lab==i]=1
  keep=cv2.dilate(keep,cv2.getStructuringElement(cv2.MORPH_ELLIPSE,(9,9)))
  m=cv2.morphologyEx(keep,cv2.MORPH_OPEN,cv2.getStructuringElement(cv2.MORPH_ELLIPSE,(7,7)))
  a=cv2.GaussianBlur(m.astype(np.float32),(0,0),2.2)
  a=np.clip((a-.15)/.7,0,1)
  ys,xs=np.where(a>0.02); x0,x1,y0,y1=xs.min(),xs.max(),ys.min(),ys.max()
  rgba=np.dstack([B,(a*255).astype(np.uint8)])[y0:y1+1,x0:x1+1]
  im=Image.fromarray(rgba,'RGBA')
  c=max(im.size)+40; can=Image.new('RGBA',(c,c)); can.paste(im,((c-im.width)//2,(c-im.height)//2))
  can=can.resize((520,520),Image.LANCZOS)
  can.save(f'public/art/batiments/{k}.webp',quality=90,method=6)
  print(k,(x0,y0,x1,y1))

# la vignette ronde du district (pillages, missions en mer) : la Cuvette entière, carrée, centrée sur la Tour
T=np.asarray(Image.open(D+'cuvette.webp').convert('RGB'))
c=760; x0=(800-c)//2; y0=150
Image.fromarray(T[y0:y0+c,x0:x0+c]).resize((240,240),Image.LANCZOS).save(D+'cuvette-vignette.webp',quality=88)
