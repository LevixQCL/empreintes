// La Cuvette vivante (2 novembre 2026). Un programme WebGL redessine, par-dessus le tableau, seulement ce qui bouge :
//  - la mer ondule (deux trains de houle obliques et un clapot, les crêtes plus claires) ;
//  - l'eau coule : des filets qui tombent dans les chutes, des rides qui glissent sur les nappes, de l'écume au pied ;
//  - les cristaux s'allument de l'intérieur (l'énergie monte en eux, chacun respire à son rythme) et rayonnent autour ;
//  - le fourneau de la Forge vacille et rougeoie, et sa cheminée fume : un panache qui monte, se tord et part avec le vent.
// Bryan (2 novembre 2026) : des halos ronds qui pulsent et une cascade qui ondule, « hyper cheap » ; ici, tout part des pixels
// du tableau lui-même, découpés par trois masques (scripts/cuvette-animation-masques.py).
// Bryan (même soir) : la nappe juste avant la chute restait figée et la mer au pied de la digue aussi ; la nappe glisse
// désormais vers la lèvre, et la mer a un ressac (vagues qui montent vers la digue, frange d'écume, éclats sur l'écume crème).
// Tout se calcule sur la carte graphique, 30 images par seconde au plus ; la houle s'éteint vers les bords du tableau et ne
// déborde jamais sur la digue. Rien ne tourne si le joueur a réduit les animations, si WebGL manque, ou hors du district.

import { leger, signalerLenteur } from './graphismes';

const SOMMETS = `attribute vec2 p;varying vec2 uv;void main(){uv=vec2(p.x*.5+.5,.5-p.y*.5);gl_Position=vec4(p,0.,1.);}`;
const PIXELS = `#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif
uniform sampler2D img,m1,m2,m3;uniform float t,cote;uniform vec2 FUMEE;varying vec2 uv;
float h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float n(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(h(i),h(i+vec2(1.,0.)),f.x),mix(h(i+vec2(0.,1.)),h(i+vec2(1.,1.)),f.x),f.y);}
vec3 ecran(vec3 c,vec3 a){return 1.-(1.-c)*(1.-clamp(a,0.,1.));}
float fbm(vec2 p){float s=0.,a=.5;for(int i=0;i<4;i++){s+=a*n(p);p=p*2.03+vec2(1.7,9.2);a*=.5;}return s;}
// la fumée : des bouffées rondes, cernées d'encre comme le reste du tableau, qui naissent au haut de la cheminée,
// montent, gonflent, partent avec le vent et se dissolvent ; la plus jeune passe devant les autres
vec4 bouffees(vec2 p){
  float alpha=0.,front=2.;vec3 col=vec3(0.);
  for(int i=0;i<9;i++){
    float fi=float(i),a=fract(t*.14+fi/9.);
    vec2 cc=FUMEE+vec2(a*a*46.+sin(a*5.+fi*1.7)*2.6,-a*80.-a*a*6.);
    float r=2.+a*12.5+sin(fi*2.3)*1.2*a;
    vec2 d=p-cc;
    float wob=(n(d*.2+vec2(fi*3.1,t*.25))-.5)*r*.75+(n(d*.55+vec2(t*.4,fi))-.5)*r*.25;
    float dist=length(d)+wob;
    float m=smoothstep(r,r*.9,dist)*(1.-smoothstep(.42,.95,a))*smoothstep(0.,.05,a);
    if(m<.01)continue;
    float sl=dot(d/max(length(d),.001),normalize(vec2(1.,-.7)))+(n(d*.35+fi)-.5)*.5;
    float lit=smoothstep(-.05,.12,sl);
    vec3 pc=mix(vec3(.62,.58,.62),vec3(.98,.91,.8),lit);
    pc=mix(vec3(.36,.3,.32),pc,smoothstep(r*.985,r*.9,dist));
    pc=mix(pc,pc*vec3(.85,.9,1.05)+.04,smoothstep(.25,.7,a));
    pc=ecran(pc,vec3(.8,.35,.08)*(1.-smoothstep(0.,.18,a)));
    if(a<front){front=a;col=pc;}
    alpha=max(alpha,m*(1.-.45*a));
  }
  return vec4(col,alpha);
}
void main(){
  vec4 a=texture2D(m1,uv),b=texture2D(m2,uv);float fh=texture2D(m3,uv).r;
  float mer=a.r,eau=a.g,cr=a.b,av=b.r,feu=b.g,hc=b.b;
  vec2 p=uv*vec2(400.,600.);
  // la fumée de la Forge : un panache qui sort du haut de la cheminée et part avec le vent
  vec2 e=p-FUMEE;float hf=-e.y;
  bool fumee=hf>-4.&&hf<104.&&e.x>-20.&&e.x<62.;
  if(mer+eau+cr+feu+hc+fh<.015&&!fumee)discard;
  vec2 q=uv;float w=0.,bord=0.,ress=0.,prox=0.;
  if(mer>.02){
    // la houle de fond, plus le ressac : des vagues qui montent vers la digue, poussent l'écume peinte contre elle puis la ramènent
    float d=texture2D(m3,uv).g;
    vec2 ex=vec2(2./400.,0.),ey=vec2(0.,2./600.);
    vec2 gr=vec2(texture2D(m3,uv+ex).g-texture2D(m3,uv-ex).g,texture2D(m3,uv+ey).g-texture2D(m3,uv-ey).g);
    vec2 vers=-gr/max(length(gr),.0005);
    prox=1.-smoothstep(.05,1.,d);
    ress=sin(d*11.-t*1.15+(n(p*.025+vec2(0.,t*.05))-.5)*2.4);
    w=sin(p.x*.045+p.y*.11-t*1.1)*.6+sin(-p.x*.07+p.y*.05-t*.7)*.4+sin(p.y*.31+p.x*.02-t*2.3)*.15;
    // sur PC, la mer prolongée ondule avec le tableau (MER_LARGE) : la houle ne s'éteint plus sur ses côtés
    bord=mix(1.,smoothstep(0.,.07,uv.x)*smoothstep(0.,.07,1.-uv.x),cote)*smoothstep(0.,.05,uv.y)*smoothstep(0.,.03,1.-uv.y);
    // en pixels du tableau (repère 400 × 600) : la houle déplace d'1 px, le ressac jusqu'à 3,5 px près du bord
    vec2 dpx=vec2(sin(p.y*.09+p.x*.02-t*.9)*.9,w*1.3)+vers*ress*(.6+2.9*prox)*step(.0005,length(gr));
    // l'écume dérive doucement le long du rivage
    dpx+=vec2(vers.y,-vers.x)*(n(p*.04+vec2(t*.12,0.))-.5)*1.6*prox;
    q=uv+dpx/vec2(400.,600.)*bord;
    if(texture2D(m1,q).r<.5)q=uv;
  }
  vec3 c=texture2D(img,q).rgb;
  if(mer>.02){
    float cr2=smoothstep(.55,1.,w*.5+.5);c*=1.+bord*mer*(.07*cr2-.035*(1.-cr2));
    // la vague qui arrive éclaircit l'eau devant elle, celle qui se retire l'assombrit
    c*=1.+bord*mer*prox*.06*ress;
    // une frange d'écume vivante contre la digue : elle monte quand la vague touche et se déchire en dentelle
    float d=texture2D(m3,uv).g;
    float frange=1.-smoothstep(0.,.05+.07*(ress*.5+.5),d);
    float dentelle=smoothstep(.48,.78,fbm(p*vec2(.22,.3)+vec2(t*.35,-t*.25)));
    c=mix(c,vec3(.99,.97,.72),frange*dentelle*.75*bord*mer);
    // et des éclats qui scintillent sur les plaques d'écume crème du tableau
    float creme=smoothstep(.72,.9,dot(c,vec3(.33)))*step(c.b,c.r-.1);
    float eclat=smoothstep(.78,.95,n(p*.5+vec2(t*.6,-t*.9))*.6+n(p*1.1-vec2(t*.8,t*.3))*.4);
    c=mix(c,c*.86,creme*smoothstep(.55,.8,n(p*.18+vec2(-t*.3,t*.22)))*prox*mer);
    c=ecran(c,vec3(.3)*eclat*creme*mer);
  }
  if(eau>.02){
    float chute=smoothstep(.6,.9,eau);
    if(chute>.01){
      // la chute fait défiler sa propre peinture vers le bas (deux passes décalées qui se relaient, sans à-coup)
      float L=.013,f1=fract(t*1.3),f2=fract(t*1.3+.5);
      vec2 a1=uv-vec2(0.,f1*L),a2=uv-vec2(0.,f2*L);
      vec3 c1=texture2D(m1,a1).g>.6?texture2D(img,a1).rgb:c;
      vec3 c2=texture2D(m1,a2).g>.6?texture2D(img,a2).rgb:c;
      c=mix(c,mix(c1,c2,abs(f1*2.-1.)),chute);
    }
    // la nappe du déversoir glisse vers la lèvre et accélère avant de tomber (Bryan : « l'eau juste avant de tomber ne bouge pas »)
    float nappe=(1.-chute)*step(.35,eau)*step(p.x,94.)*step(419.,p.y);
    if(nappe>.01){
      vec2 D=normalize(vec2(-.62,.8));
      float lev=437.+.5*(p.x-50.),vers=clamp(1.-(lev-p.y)/22.,0.,1.);   // 0 au fond, 1 sur la lèvre
      float L=5.+5.*vers,g1=fract(t*1.2),g2=fract(t*1.2+.5);
      vec2 b1=uv-D*g1*L/vec2(400.,600.),b2=uv-D*g2*L/vec2(400.,600.);
      vec3 n1=texture2D(m1,b1).g>.3?texture2D(img,b1).rgb:c;
      vec3 n2=texture2D(m1,b2).g>.3?texture2D(img,b2).rgb:c;
      c=mix(c,mix(n1,n2,abs(g1*2.-1.)),.85);
      vec2 e2=p-vec2(70.,435.);float along=dot(e2,D),across=dot(e2,vec2(D.y,-D.x));
      float bande=sin(across*.42+(n(vec2(across*.15,along*.05))-.5)*4.);
      float stries=smoothstep(.2,1.,bande)*smoothstep(.4,.8,n(vec2(across*.25,(along+vers*vers*9.)*.09-t*2.4)));
      float tension=smoothstep(.6,1.,vers)*(.5+.5*n(vec2(across*.8,t*2.)));   // le bourrelet clair sur la lèvre
      c=mix(c,vec3(.88,1.,.97),clamp(stries*(.35+.4*vers)+tension*.35,0.,1.));
    }
    float f=n(vec2(p.x*1.5,p.y*.22-t*7.))*.6+n(vec2(p.x*2.6+7.,p.y*.35-t*10.))*.4;
    float filets=smoothstep(.5,.85,f);
    float rides=smoothstep(.6,.9,n(vec2(p.x*.45+t*.9,p.y*.7-t*1.8))*.7+n(vec2(p.x*.9-t*.4,p.y*1.3-t*2.6))*.3);
    float bulles=n(vec2(p.x*1.1+t*1.5,p.y*1.4-t*4.))*.6+n(vec2(p.x*2.7-t*2.,p.y*2.9-t*7.))*.4;
    float ecume=smoothstep(.45,1.,av)*smoothstep(.38,.75,bulles);
    float s=chute*(filets*.75+ecume*.9)+(1.-chute)*(1.-nappe)*(rides*.3+ecume*.85);
    c*=1.-chute*.22*(1.-filets);
    c=mix(c,vec3(.88,1.,.97),clamp(s,0.,1.)*smoothstep(.02,.25,eau));
  }
  if(cr+hc>.01){
    float ph=n(p*.04)*6.283;
    float pouls=.5+.5*sin(t*1.7+ph);
    float flux=.5+.5*sin(p.y*.75+p.x*.15+t*3.2);
    vec3 cy=vec3(.32,.82,1.);
    c=ecran(c,cy*cr*(.12+.3*pouls+.22*flux*(.4+.6*pouls)));
    c=ecran(c,vec3(.85,1.,1.)*cr*smoothstep(.8,1.,flux)*pouls*.45);
    c=ecran(c,cy*hc*(.1+.4*pouls));
  }
  if(feu+fh>.01){
    float v=n(vec2(t*6.,1.))*.55+n(vec2(t*15.,7.))*.3+n(vec2(t*31.,3.))*.15;
    vec3 o=vec3(1.,.52,.16);
    c=ecran(c,o*feu*(.1+.55*v)*(.7+.3*n(p*.6+vec2(0.,-t*4.))));
    c=ecran(c,o*fh*(.08+.42*v));
  }
  if(fumee){vec4 f=bouffees(p);c=mix(c,f.rgb,f.a*.88);}
  gl_FragColor=vec4(c,1.);
}`;

// La mer prolongée sur PC (9 novembre 2026, Bryan : « tout ce côté de la carte n'est pas animé, le côté droit non plus »).
// L'image large (cuvette-large.webp, 1911 × 1200) a le tableau en son milieu (x = 566 à 1366, même hauteur) : on y calcule
// la même houle, dans le même repère et à la même horloge que le tableau, pour que la mer reste d'un seul tenant à la jonction.
// Son masque (scripts/cuvette-large-masque.py) laisse immobiles le dessous du tableau, la digue, les piliers, le bateau,
// le ponton et le ciel. La mer du fond, près de l'horizon, bouge moins que celle du premier plan.
const MER_LARGE = `#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif
uniform sampler2D img,m1;uniform float t;varying vec2 uv;
const vec2 L=vec2(1911.,1200.);
float h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float n(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(h(i),h(i+vec2(1.,0.)),f.x),mix(h(i+vec2(0.,1.)),h(i+vec2(1.,1.)),f.x),f.y);}
vec3 ecran(vec3 c,vec3 a){return 1.-(1.-c)*(1.-clamp(a,0.,1.));}
void main(){
  float mer=texture2D(m1,uv).r;
  if(mer<.02)discard;
  vec2 P=uv*L,p=(P-vec2(566.,0.))*.5;   // le repère 400 × 600 du tableau, prolongé de chaque côté
  float loin=mix(.35,1.,smoothstep(60.,320.,P.y));
  float bord=smoothstep(0.,.05,uv.y)*smoothstep(0.,.03,1.-uv.y)*loin;
  float w=sin(p.x*.045+p.y*.11-t*1.1)*.6+sin(-p.x*.07+p.y*.05-t*.7)*.4+sin(p.y*.31+p.x*.02-t*2.3)*.15;
  vec2 dpx=vec2(sin(p.y*.09+p.x*.02-t*.9)*.9,w*1.3);
  vec2 q=uv+dpx*2./L*bord;
  if(texture2D(m1,q).r<.5)q=uv;
  vec3 c=texture2D(img,q).rgb;
  float cr2=smoothstep(.55,1.,w*.5+.5);c*=1.+bord*mer*(.07*cr2-.035*(1.-cr2));
  // des éclats qui scintillent sur l'écume crème, comme au pied de la digue dans le tableau
  float creme=smoothstep(.72,.9,dot(c,vec3(.33)))*step(c.b,c.r-.1);
  float eclat=smoothstep(.78,.95,n(p*.5+vec2(t*.6,-t*.9))*.6+n(p*1.1-vec2(t*.8,t*.3))*.4);
  c=ecran(c,vec3(.3)*eclat*creme*mer*.6);
  gl_FragColor=vec4(c*mer,mer);
}`;
/** la même horloge pour le tableau et la mer prolongée */
const T0 = performance.now();
const ECRAN_PC = '(min-width:1100px) and (min-height:600px)';
type Large = { gl: WebGLRenderingContext; toile: HTMLCanvasElement; tLoc: WebGLUniformLocation | null; pret: boolean; image: string };
let large: Large | null = null;
let largeEchec = false;

type Etat = { gl: WebGLRenderingContext; t0: number; tLoc: WebGLUniformLocation | null; cLoc: WebGLUniformLocation | null; fLoc: WebGLUniformLocation | null; fumee: [number, number]; pret: boolean; image: string; tour: number };
let toile: HTMLCanvasElement | null = null;
let etat: Etat | null = null;
let echec = false;
/**
 * La finesse du dessin (3 novembre 2026, « lourd pour certains portables ») : 1 = la pleine finesse ; si l'appareil n'arrive
 * pas à suivre (les images arrivent à moins de ~18 par seconde), on dessine moins de pixels (étirés, la houle reste douce),
 * et en dernier recours la Cuvette redevient le tableau peint, immobile, et le jeu passe en graphismes légers (graphismes.ts).
 */
let finesse = 1;
const FINESSES = [1, 0.7, 0.5];
/** la Cuvette visible à l'écran (elle peut sortir de l'écran en faisant défiler, sur PC comme sur téléphone) */
let visible = true;
let veille: IntersectionObserver | null = null;

function charger(src: string): Promise<HTMLImageElement> {
  return new Promise((ok, ko) => { const i = new Image(); i.onload = () => ok(i); i.onerror = ko; i.src = src; });
}

function texture(gl: WebGLRenderingContext, unite: number, img: HTMLImageElement) {
  gl.activeTexture(gl.TEXTURE0 + unite);
  gl.bindTexture(gl.TEXTURE_2D, gl.createTexture());
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, img);
}

/** Compile un programme plein écran (deux triangles) ; null si la carte graphique refuse */
function programme(gl: WebGLRenderingContext, pixels: string): WebGLProgram | null {
  const shader = (type: number, src: string) => {
    const s = gl.createShader(type)!;
    gl.shaderSource(s, src); gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s) ?? 'shader');
    return s;
  };
  const prog = gl.createProgram()!;
  gl.attachShader(prog, shader(gl.VERTEX_SHADER, SOMMETS));
  gl.attachShader(prog, shader(gl.FRAGMENT_SHADER, pixels));
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return null;
  gl.useProgram(prog);
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
  const p = gl.getAttribLocation(prog, 'p');
  gl.enableVertexAttribArray(p);
  gl.vertexAttribPointer(p, 2, gl.FLOAT, false, 0, 0);
  return prog;
}

function creerLarge(image: string, masque: string): Large | null {
  const c = document.createElement('canvas');
  c.setAttribute('aria-hidden', 'true');
  const gl = c.getContext('webgl', { premultipliedAlpha: true, alpha: true, antialias: false, powerPreference: 'low-power', failIfMajorPerformanceCaveat: true });
  if (!gl) return null;
  const prog = programme(gl, MER_LARGE);
  if (!prog) return null;
  ['img', 'm1'].forEach((nom, i) => gl.uniform1i(gl.getUniformLocation(prog, nom), i));
  const l: Large = { gl, toile: c, tLoc: gl.getUniformLocation(prog, 't'), pret: false, image };
  Promise.all([image, masque].map(charger)).then((imgs) => {
    imgs.forEach((im, i) => texture(gl, i, im));
    l.pret = true;
  }).catch(() => { largeEchec = true; });
  return l;
}

/** La mer prolongée, dessinée juste après le tableau, à la même finesse */
function dessinerLarge(sec: number) {
  if (!large?.pret || !large.toile.isConnected || largeEchec) return;
  const { gl, toile: c } = large;
  const r = Math.min(window.devicePixelRatio || 1, 1911 / Math.max(1, c.clientWidth)) * finesse;
  const w = Math.round(c.clientWidth * r), h = Math.round(c.clientHeight * r);
  if (!w || !h) return;
  if (c.width !== w || c.height !== h) { c.width = w; c.height = h; }
  gl.viewport(0, 0, w, h);
  gl.clearColor(0, 0, 0, 0);
  gl.clear(gl.COLOR_BUFFER_BIT);
  gl.uniform1f(large.tLoc, sec);
  gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  c.classList.add('prete');
}

function creer(image: string, masques: string[]): Etat | null {
  toile = document.createElement('canvas');
  toile.setAttribute('aria-hidden', 'true');
  // sans vraie carte graphique (WebGL dessiné par le processeur), la Cuvette reste peinte : sinon elle met le jeu à genoux
  const gl = toile.getContext('webgl', { premultipliedAlpha: true, alpha: true, antialias: false, powerPreference: 'low-power', failIfMajorPerformanceCaveat: true });
  if (!gl) return null;
  const prog = programme(gl, PIXELS);
  if (!prog) return null;
  ['img', 'm1', 'm2', 'm3'].forEach((nom, i) => gl.uniform1i(gl.getUniformLocation(prog, nom), i));
  const e: Etat = { gl, t0: T0, tLoc: gl.getUniformLocation(prog, 't'), cLoc: gl.getUniformLocation(prog, 'cote'), fLoc: gl.getUniformLocation(prog, 'FUMEE'), fumee: [90, 196], pret: false, image, tour: 0 };
  Promise.all([image, ...masques].map(charger)).then((imgs) => {
    imgs.forEach((im, i) => texture(gl, i, im));
    e.pret = true;
  }).catch(() => { echec = true; });
  return e;
}

/** Une image toutes les ~33 ms ; la boucle s'arrête d'elle-même quand la toile quitte l'écran (autre onglet, combat…) */
function boucle(tour: number) {
  let derniere = 0;
  // les intervalles entre deux images dessinées (la mesure de la fluidité ne commence qu'une fois les textures prêtes)
  const ecarts: number[] = [];
  let depuis = 0;
  const pas = (now: number) => {
    if (!etat || etat.tour !== tour || !toile?.isConnected || document.hidden || echec) return;
    // passé en graphismes légers en cours de route (Paramètres, ou la mesure des images) : le tableau peint reprend
    if (leger()) { toile.remove(); large?.toile.remove(); return; }
    requestAnimationFrame(pas);
    if (!etat.pret || !visible || now - derniere < 32) return;
    // une longue pause (onglet caché, appareil en veille) ne compte pas ; un redessin de l'écran pèse peu dans la médiane
    if (derniere && now - derniere < 3000) ecarts.push(now - derniere);
    derniere = now;
    depuis ||= now;
    // toutes les 2 secondes : trop lent ? un cran de finesse en moins ; au dernier cran, la Cuvette s'arrête
    if (now - depuis > 2000 && ecarts.length >= 4) {
      const tri = [...ecarts].sort((a, b) => a - b);
      const lent = tri[Math.floor(tri.length / 2)]! > 55;
      ecarts.length = 0;
      depuis = now;
      if (lent) {
        const k = FINESSES.indexOf(finesse);
        if (k === FINESSES.length - 1) { arreter(); return; }
        finesse = FINESSES[k + 1]!;
      }
    }
    const { gl } = etat;
    // la taille suit la toile (écran tourné, fenêtre redimensionnée), jamais plus fine que le tableau (800 px de large)
    const r = Math.min(window.devicePixelRatio || 1, 800 / Math.max(1, toile.clientWidth)) * finesse;
    const w = Math.round(toile.clientWidth * r), h = Math.round(toile.clientHeight * r);
    if (w && h && (toile.width !== w || toile.height !== h)) { toile.width = w; toile.height = h; }
    gl.viewport(0, 0, toile.width, toile.height);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    // le temps repart de zéro toutes les heures : les calculs restent précis sur les téléphones
    const sec = ((now - etat.t0) / 1000) % 3600;
    gl.uniform1f(etat.tLoc, sec);
    gl.uniform1f(etat.cLoc, large?.toile.isConnected && large.pret && !largeEchec ? 0 : 1);
    gl.uniform2f(etat.fLoc, etat.fumee[0], etat.fumee[1]);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    toile.classList.add('prete');
    dessinerLarge(sec);
  };
  requestAnimationFrame(pas);
}

/** L'appareil ne suit pas : la Cuvette redevient le tableau peint, et le jeu s'allège pour la semaine */
function arreter() {
  echec = true;
  toile?.remove();
  large?.toile.remove();
  veille?.disconnect();
  signalerLenteur();
}

/** Après chaque rendu du district : la même toile WebGL revient à sa place (l'écran est reconstruit chaque seconde) */
export function brancherHoule(racine: HTMLElement) {
  const place = racine.querySelector<HTMLElement>('.toile .houle');
  if (!place || echec || leger()) return;
  const image = place.dataset.image!, masques = place.dataset.masques!.split(' ');
  try {
    if (!etat || etat.image !== image) { etat = creer(image, masques); if (!etat) { echec = true; return; } }
  } catch { echec = true; return; }
  // la fumée sort du haut de la cheminée de la Forge, qui change avec son palier
  const f = place.dataset.fumee?.split(' ').map(Number);
  if (f?.length === 2 && f.every(Number.isFinite)) etat.fumee = [f[0]!, f[1]!];
  // sur PC, la mer prolongée autour du tableau ondule avec lui (sur téléphone, on n'en voit qu'un liseré : elle reste peinte)
  const placeL = racine.querySelector<HTMLElement>('.mer-fond .houle-large');
  if (placeL && !largeEchec && window.matchMedia?.(ECRAN_PC).matches) {
    try {
      if (!large || large.image !== placeL.dataset.image) { large = creerLarge(placeL.dataset.image!, placeL.dataset.masque!); if (!large) largeEchec = true; }
    } catch { largeEchec = true; }
    if (large && !largeEchec) placeL.append(large.toile);
  } else large?.toile.remove();
  const enCours = toile!.isConnected;
  place.append(toile!);
  // hors de l'écran (le joueur a fait défiler), rien n'est dessiné
  if (typeof IntersectionObserver !== 'undefined') {
    veille?.disconnect();
    veille = new IntersectionObserver((e) => { visible = e.some((x) => x.isIntersecting); });
    veille.observe(place);
  }
  if (!enCours) { etat.tour++; boucle(etat.tour); }
}

// au retour sur l'onglet du navigateur, l'animation reprend
document.addEventListener('visibilitychange', () => {
  if (!document.hidden && etat && toile?.isConnected) { etat.tour++; boucle(etat.tour); }
});
