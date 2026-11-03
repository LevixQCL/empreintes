import numpy as np,cv2
from PIL import Image
from scipy import ndimage as ndi
B=np.array(Image.open('bat.webp').convert('RGB')).astype(np.float32)
N=np.array(Image.open('nue.webp').convert('RGB')).astype(np.float32)
H,W=B.shape[:2]
d=cv2.GaussianBlur(np.abs(B-N).sum(2),(0,0),2)
P={'tour':(966,1095,588,560),'forge':(560,1235,182,735),'clinique':(536,1545,158,1045),'labo':(1444,1215,1066,715),
   'generateur':(830,1705,452,1205),'comptoir':(1264,1630,886,1130),'port':(1430,2340,1100,1708)}
diff=(d>60).astype(np.uint8)
lab,n=ndi.label(cv2.morphologyEx(diff,cv2.MORPH_CLOSE,np.ones((7,7),np.uint8)))
np.save('lab.npy',lab)
# color label overview
rng=np.random.RandomState(1);col=rng.randint(60,255,(n+1,3));col[0]=0
v=(B*0.4+col[lab]*0.6*(lab[...,None]>0)+B*0.6*(lab[...,None]==0)).astype(np.uint8)
for k,(cx,cy,x0,y0) in P.items():
    cv2.circle(v,(cx,cy),12,(255,0,0),-1);cv2.putText(v,k,(cx-40,cy+40),0,1.5,(255,255,0),3)
Image.fromarray(v).resize((928,1232)).save('/tmp/labels.png')
print(n)
