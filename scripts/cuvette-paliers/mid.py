import numpy as np,cv2
from PIL import Image
from scipy import ndimage as ndi
lab=np.load('lab.npy')
R={'tour':[(820,560,1110,1170)],'forge':[(400,780,700,1290)],'clinique':[(380,1280,720,1580)],'labo':[(1290,920,1600,1260)],
   'generateur':[(640,1340,1010,1780)],'comptoir':[(1060,1260,1440,1700)],'port':[(1340,2120,1520,2380),(1620,2130,1830,2250)]}
M={}
for k,boxes in R.items():
    reg=np.zeros(lab.shape,bool)
    for x1,y1,x2,y2 in boxes: reg[y1:y2,x1:x2]=True
    m=(lab>0)&reg
    m=cv2.morphologyEx(m.astype(np.uint8),cv2.MORPH_CLOSE,np.ones((25,25),np.uint8))
    m=ndi.binary_fill_holes(m)
    lb,n=ndi.label(m);sz=ndi.sum(m,lb,range(1,n+1))
    m=np.isin(lb,[i+1 for i,s in enumerate(sz) if s>800])
    M[k]=m;ys,xs=np.nonzero(m);print(k,xs.min(),ys.min(),xs.max(),ys.max(),m.sum())
np.savez_compressed('mid.npz',**M)
