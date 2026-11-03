# Les à-côtés des calques : la lueur des cristaux (calque à part qui respire en CSS), les éclats et la zone cliquable du palier haut
import numpy as np,cv2,json
from PIL import Image
P=json.load(open('calques/positions.json'));POSZ=json.load(open('zooms/positions.json'))
ZF=np.load('zones.npy',allow_pickle=True).item()
D='/home/claude/empreintes/public/art/district/paliers/'
ID={'tour':'noyau'}
MID={'noyau':'182,146 232,146 236,250 232,282 182,282 178,250','labo':'286,240 358,238 362,300 330,316 288,312','forge':'72,232 144,228 148,300 120,322 74,318',
 'clinique':'60,326 134,326 138,380 104,398 62,392','generateur':'138,354 212,354 216,420 176,438 140,430','comptoir':'240,312 312,312 314,400 280,420 240,410','port':'296,520 400,520 400,588 300,590'}
res={}
for f,(gx,gy,w,h) in P.items():
  k,pal=f.split('-');g=ID.get(k,k)
  c=np.array(Image.open(f'calques/{f}.webp').convert('RGBA')).astype(np.float32)
  r,gg,b,a=[c[...,i] for i in range(4)]
  m=((a>200)&(b>150)&(b>r+60)&(gg>110)).astype(np.uint8)
  S=800/1643;zf=ZF[f].astype(np.uint8)
  zc=zf[int(gy/S):int((gy+h)/S),int(gx/S+120):int((gx+w)/S+120)]
  zc=cv2.resize(cv2.dilate(zc,np.ones((9,9),np.uint8)),(w,h),interpolation=cv2.INTER_NEAREST)
  m=m*zc
  m=cv2.morphologyEx(m,cv2.MORPH_OPEN,np.ones((2,2),np.uint8))
  n,lab,st,cen=cv2.connectedComponentsWithStats(m)
  blobs=sorted([i for i in range(1,n) if st[i,4]>=12],key=lambda i:-st[i,4])
  keep=np.isin(lab,blobs).astype(np.float32)
  # la lueur : les cristaux éclaircis, et un halo doux autour
  coeur=cv2.GaussianBlur(keep,(0,0),.8);halo=cv2.GaussianBlur(keep,(0,0),5)*1.6
  al=np.clip(np.maximum(coeur,halo*.55),0,1)
  col=np.clip(c[...,:3]*keep[...,None]*1.25+np.array([120,230,255])*(1-keep[...,None]),0,255)
  Image.fromarray(np.dstack([col,al*255]).astype(np.uint8),'RGBA').save(f'{D}{g}-{pal}-lueur.webp',quality=88,method=6)
  # éclats : les deux plus gros cristaux (repère 400 x 600)
  ecl=[[round((gx+cen[i][0])/2),round((gy+cen[i][1])/2)] for i in blobs[:2]]
  ent=res.setdefault(g,{});ent[pal]={'eclats':ecl,'cristaux':int(keep.sum())}
  if pal=='haut':
    x0,y0=POSZ[f];z=ZF[f].astype(np.uint8)
    # la silhouette peinte (repère 400 x 600 : x = (X-119)/4.11, y = Y/4.11), réunie à la zone du milieu
    cs,_=cv2.findContours(z,cv2.RETR_EXTERNAL,cv2.CHAIN_APPROX_SIMPLE)
    big=max(cs,key=cv2.contourArea).reshape(-1,2).astype(np.float32)
    pts=np.concatenate([np.stack([(big[:,0]-119)/4.11,big[:,1]/4.11],1),np.array([[float(v) for v in q.split(',')] for q in MID[g].split()])])
    hull=cv2.convexHull(pts.astype(np.float32)).reshape(-1,2)
    hull=cv2.approxPolyDP(hull.reshape(-1,1,2),2.5,True).reshape(-1,2)
    ent['zone']=' '.join(f'{round(x)},{round(y)}' for x,y in hull)
json.dump(res,open('extras.json','w'),indent=1);print(json.dumps(res))
