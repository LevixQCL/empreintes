"""Intègre une sortie Midjourney dans district2.png (nouvelle Cuvette). usage : python3 integrer2.py nom image.png"""
import sys,numpy as np,cv2
from PIL import Image
from scipy import ndimage as ndi
exec(open('pack.py').read().split("L=[")[0].split("a=np.array")[0])
def cyl(z,cx,cy,rx,top,k=.5):
    ry=int(rx*k);cv2.ellipse(z,(cx,cy),(rx,ry),0,0,360,255,-1);cv2.rectangle(z,(cx-rx,top),(cx+rx,cy),255,-1);cv2.ellipse(z,(cx,top),(rx,ry),0,0,360,255,-1)
src=open('pack.py').read();exec(src[src.index('def rect'):src.index('L=[')])
def tour(z,cx,cy):
    cyl(z,cx,cy,150,cy-70);cyl(z,cx,cy-30,100,700);cyl(z,cx,715,72,610);cv2.ellipse(z,(cx+165,cy-110),(42,55),0,0,360,255,-1)
P={'1-tour':(tour,966,1095,588,560),'2-forge':(forge,560,1235,182,735),'3-clinique':(clinique,536,1545,158,1045),'4-labo':(labo,1444,1215,1066,715),
   '5-generateur':(generateur,830,1705,452,1205),'6-comptoir':(comptoir,1264,1630,886,1130),'7-port':(port,1430,2340,1100,1708)}
nom,img=sys.argv[1],sys.argv[2]
f,cx,cy,x0,y0=P[nom]
D=np.array(Image.open('district2.png').convert('RGB')).astype(np.float32);H,W=D.shape[:2]
A=np.array(Image.open(img).convert('RGB').resize((756,756),Image.LANCZOS)).astype(np.float32)
z=np.zeros((H,W),np.uint8);f(z,cx,cy);z=(z[y0:y0+756,x0:x0+756]>0).astype(np.uint8)
Bc=D[y0:y0+756,x0:x0+756]
d=cv2.GaussianBlur(np.abs(A-Bc).sum(2),(0,0),3)
lab,_=ndi.label(d>90);ids=np.unique(lab[z>0]);ids=ids[ids>0]
m=(np.isin(lab,ids)&(cv2.dilate(z,np.ones((61,61),np.uint8))>0))|(z>0)
m=ndi.binary_fill_holes(cv2.morphologyEx(m.astype(np.uint8),cv2.MORPH_CLOSE,np.ones((15,15),np.uint8))).astype(np.uint8)
m=cv2.dilate(m,cv2.getStructuringElement(cv2.MORPH_ELLIPSE,(15,15)));m[:8]=0;m[-8:]=0;m[:,:8]=0;m[:,-8:]=0
a=np.clip((cv2.GaussianBlur(m.astype(np.float32),(0,0),4)-0.1)/0.8,0,1)
Image.fromarray(np.dstack([A.astype(np.uint8),(a*255).astype(np.uint8)])).save(f'calques/c2-{nom}.png')
D[y0:y0+756,x0:x0+756]=A*a[...,None]+Bc*(1-a[...,None])
Image.fromarray(D.astype(np.uint8)).save('district2.png')
Image.fromarray(D[y0:y0+756,x0:x0+756].astype(np.uint8)).save(f'c2-{nom}-zoom.png')
