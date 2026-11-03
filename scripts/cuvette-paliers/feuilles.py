import numpy as np,cv2,json,shutil
from rembg import new_session,remove
SESS=new_session('isnet-general-use')
from PIL import Image
N=np.array(Image.open('nue.webp').convert('RGB')).astype(np.float32)
B=np.array(Image.open('bat.webp').convert('RGB')).astype(np.float32)
P=json.load(open('calques/positions.json'));S=800/1643
ID={'tour':'noyau'};ZF=np.load('zones.npy',allow_pickle=True).item()
R='/home/claude/empreintes/public/art/'
for f,(gx,gy,w,h) in P.items():
  k,pal=f.split('-');gid=ID.get(k,k)
  # calque remis à l'échelle du tableau complet
  c=np.array(Image.open(f'calques/{f}.webp').convert('RGBA')).astype(np.float32)
  fx0=int(round(gx/S+120));fy0=int(round(gy/S));fw=int(round(w/S));fh=int(round(h/S))
  c=cv2.resize(c,(fw,fh),interpolation=cv2.INTER_CUBIC)
  al=np.clip(c[...,3]/255,0,1);img=c[...,:3]
  n=N[fy0:fy0+fh,fx0:fx0+fw]
  comp=img*al[...,None]+B[fy0:fy0+fh,fx0:fx0+fw]*(1-al[...,None])
  zz=cv2.dilate(ZF[f][fy0:fy0+fh,fx0:fx0+fw].astype(np.uint8),cv2.getStructuringElement(cv2.MORPH_ELLIPSE,(9,9)))>0
  seuil=45 if pal=='bas' else 110
  dd=cv2.GaussianBlur(np.abs(cv2.GaussianBlur(comp,(0,0),2)-cv2.GaussianBlur(n,(0,0),2)).sum(2),(0,0),2)
  d=((dd>seuil)&zz).astype(np.uint8)
  if pal=='haut' and k in ('tour','comptoir'):
    zys,zxs=np.nonzero(zz);a0,a1,b0,b1=max(zys.min()-20,0),zys.max()+20,max(zxs.min()-20,0),zxs.max()+20
    sub=Image.fromarray(np.clip(comp[a0:a1,b0:b1],0,255).astype(np.uint8))
    r=np.array(remove(sub,session=SESS,only_mask=True)).astype(np.float32)/255
    d=np.zeros(zz.shape,np.uint8);d[a0:a1,b0:b1]=(r>0.5)
    d&=cv2.dilate(zz.astype(np.uint8),cv2.getStructuringElement(cv2.MORPH_ELLIPSE,(15,15)))
  elif pal=='haut':
    gm=np.full(zz.shape,cv2.GC_BGD,np.uint8)
    gm[zz]=cv2.GC_PR_BGD
    gm[zz&(dd>45)]=cv2.GC_PR_FGD
    coeur=cv2.erode(zz.astype(np.uint8),cv2.getStructuringElement(cv2.MORPH_ELLIPSE,(41,41)))>0
    gm[coeur&(dd>110)]=cv2.GC_FGD
    bg=np.zeros((1,65));fg=np.zeros((1,65))
    cv2.grabCut(np.clip(comp,0,255).astype(np.uint8)[...,::-1].copy(),gm,None,bg,fg,6,cv2.GC_INIT_WITH_MASK)
    d=((gm==cv2.GC_FGD)|(gm==cv2.GC_PR_FGD)).astype(np.uint8)
  d=cv2.morphologyEx(d,cv2.MORPH_CLOSE,cv2.getStructuringElement(cv2.MORPH_ELLIPSE,(31,31)))
  ff=d.copy();m=np.zeros((fh+2,fw+2),np.uint8);cv2.floodFill(ff,m,(0,0),1);d=d|(1-ff)
  nl,lab,st,_=cv2.connectedComponentsWithStats(d);keep=np.zeros_like(d)
  big=max(range(1,nl),key=lambda i:st[i,4])
  for i in range(1,nl):
    if st[i,4]>max(800,st[big,4]*0.08): keep[lab==i]=1
  keep=cv2.morphologyEx(cv2.dilate(keep,cv2.getStructuringElement(cv2.MORPH_ELLIPSE,(9,9))),cv2.MORPH_OPEN,cv2.getStructuringElement(cv2.MORPH_ELLIPSE,(7,7)))
  a=np.clip((cv2.GaussianBlur(keep.astype(np.float32),(0,0),2.2)-.15)/.7,0,1)
  ys,xs=np.where(a>0.02);x0,x1,y0,y1=xs.min(),xs.max(),ys.min(),ys.max()
  im=Image.fromarray(np.dstack([comp,a*255]).astype(np.uint8)[y0:y1+1,x0:x1+1],'RGBA')
  cc=max(im.size)+40;can=Image.new('RGBA',(cc,cc));can.paste(im,((cc-im.width)//2,(cc-im.height)//2))
  can=can.resize((520,520),Image.LANCZOS)
  for v in ([1] if pal=='bas' else [3,4]): can.save(f'{R}batiments/{gid}-{v}.webp',quality=90,method=6)
for gid in ['noyau','forge','clinique','generateur','comptoir','labo','port']:
  shutil.copy(f'{R}batiments/{gid}.webp',f'{R}batiments/{gid}-2.webp')
print('ok')
