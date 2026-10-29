# Répare le détourage des images Midjourney sur fond noir : rebouche les zones sombres
# de l objet devenues transparentes (ex. scarabée de l emblème), garde transparent le vrai fond enfermé.
# Usage : python3 scripts/detourage.py entree.webp sortie.webp
import sys,numpy as np,cv2
from PIL import Image
from scipy import ndimage as ndi
def disk(r):
  y,x=np.ogrid[-r:r+1,-r:r+1];return x*x+y*y<=r*r
def fix(path,out=None,r=None,trou=0.003):
  src=Image.open(path).convert('RGBA');im=np.array(src).astype(np.float32)
  a0=im[...,3].copy();h,w=a0.shape
  if r is None: r=max(3,round(min(h,w)/64))
  solid=a0>=140
  pad=np.pad(solid,r+1)
  closed=ndi.binary_closing(pad,disk(r))[r+1:-r-1,r+1:-r-1]
  sil=ndi.binary_fill_holes(closed|solid)
  hole=sil&(a0<140)
  mx=im[...,:3].max(-1)
  lab,n=ndi.label(hole)
  grand=np.zeros_like(hole);vide=hole&(a0<12)
  for i in range(1,n+1):
    m=lab==i
    if m.sum()<trou*h*w: continue
    # zone enfermée de vrai fond : alpha quasi nul ou noir pur partout
    if np.median(a0[m])<12 or (np.median(mx[m])<12 and np.median(a0[m])<30):
      grand|=m
  petit=vide&~grand              # piqûres : on bouche en reconstituant la couleur
  if petit.any():
    rgb=im[...,:3].astype(np.uint8)
    rgb=cv2.inpaint(rgb,petit.astype(np.uint8),3,cv2.INPAINT_TELEA)
    im[...,:3]=rgb
  plein=(sil&~grand).astype(np.float32)
  plein=ndi.gaussian_filter(plein*255,0.7)
  newa=np.where(sil,np.maximum(a0,plein),a0)
  im[...,3]=np.clip(newa,0,255)
  gain=float(((newa-a0)>40).sum()/max(1,solid.sum()))
  if out: Image.fromarray(im.astype(np.uint8),'RGBA').save(out,'WEBP',quality=92,method=6,exact=True)
  return gain
if __name__=='__main__':
  print(round(fix(sys.argv[1],sys.argv[2])*100,1),'%')
