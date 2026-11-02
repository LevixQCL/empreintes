// La houle sur la mer de la Cuvette (2 novembre 2026, d'après docs/maquette-cuvette2.html).
// Un petit programme WebGL redessine seulement la mer du tableau (masque art/district/cuvette-houle.webp, blanc = mer) en la
// faisant onduler : deux trains de houle obliques et un clapot fin, les crêtes un peu plus claires. Tout se calcule sur la
// carte graphique, à 30 images par seconde au plus ; la houle s'éteint vers les bords du tableau pour se fondre dans la mer
// fixe autour (PC) et ne déborde jamais sur la digue (un point qui tomberait hors de la mer garde sa place).
// Rien ne tourne si le joueur a réduit les animations, si WebGL manque, ou quand le district n'est plus affiché.

const SOMMETS = `attribute vec2 p;varying vec2 uv;void main(){uv=vec2(p.x*.5+.5,.5-p.y*.5);gl_Position=vec4(p,0.,1.);}`;
const PIXELS = `precision mediump float;
uniform sampler2D img,msk;uniform float t;varying vec2 uv;
void main(){
  float m=texture2D(msk,uv).r;
  if(m<.02)discard;
  vec2 p=uv*vec2(400.,600.);
  float w=sin(p.x*.045+p.y*.11-t*1.1)*.6+sin(-p.x*.07+p.y*.05-t*.7)*.4+sin(p.y*.31+p.x*.02-t*2.3)*.15;
  float bord=smoothstep(0.,.07,uv.x)*smoothstep(0.,.07,1.-uv.x)*smoothstep(0.,.05,uv.y)*smoothstep(0.,.03,1.-uv.y);
  vec2 d=vec2(sin(p.y*.09+p.x*.02-t*.9)*.7,w)*.0024*bord;
  vec2 q=uv+d;
  if(texture2D(msk,q).r<.5)q=uv;
  vec3 c=texture2D(img,q).rgb;
  float crete=smoothstep(.55,1.,w*.5+.5);
  c*=1.+bord*(.07*crete-.035*(1.-crete));
  gl_FragColor=vec4(c,1.)*m;
}`;

type Etat = { gl: WebGLRenderingContext; t0: number; tLoc: WebGLUniformLocation | null; pret: boolean; image: string; tour: number };
let toile: HTMLCanvasElement | null = null;
let etat: Etat | null = null;
let echec = false;

function charger(src: string): Promise<HTMLImageElement> {
  return new Promise((ok, ko) => { const i = new Image(); i.onload = () => ok(i); i.onerror = ko; i.src = src; });
}

function texture(gl: WebGLRenderingContext, unite: number, img: HTMLImageElement) {
  const tx = gl.createTexture();
  gl.activeTexture(gl.TEXTURE0 + unite);
  gl.bindTexture(gl.TEXTURE_2D, tx);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, img);
}

function creer(image: string, masque: string): Etat | null {
  toile = document.createElement('canvas');
  toile.setAttribute('aria-hidden', 'true');
  const gl = toile.getContext('webgl', { premultipliedAlpha: true, alpha: true, antialias: false, powerPreference: 'low-power' });
  if (!gl) return null;
  const shader = (type: number, src: string) => {
    const s = gl.createShader(type)!;
    gl.shaderSource(s, src); gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s) ?? 'shader');
    return s;
  };
  const prog = gl.createProgram()!;
  gl.attachShader(prog, shader(gl.VERTEX_SHADER, SOMMETS));
  gl.attachShader(prog, shader(gl.FRAGMENT_SHADER, PIXELS));
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return null;
  gl.useProgram(prog);
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
  const p = gl.getAttribLocation(prog, 'p');
  gl.enableVertexAttribArray(p);
  gl.vertexAttribPointer(p, 2, gl.FLOAT, false, 0, 0);
  gl.uniform1i(gl.getUniformLocation(prog, 'img'), 0);
  gl.uniform1i(gl.getUniformLocation(prog, 'msk'), 1);
  const e: Etat = { gl, t0: performance.now(), tLoc: gl.getUniformLocation(prog, 't'), pret: false, image, tour: 0 };
  Promise.all([charger(image), charger(masque)]).then(([a, b]) => {
    texture(gl, 0, a); texture(gl, 1, b);
    e.pret = true;
  }).catch(() => { echec = true; });
  return e;
}

/** Une image toutes les ~33 ms ; la boucle s'arrête d'elle-même quand la toile quitte l'écran (autre onglet, combat…) */
function boucle(tour: number) {
  let derniere = 0;
  const pas = (now: number) => {
    if (!etat || etat.tour !== tour || !toile?.isConnected || document.hidden) return;
    requestAnimationFrame(pas);
    if (!etat.pret || now - derniere < 32) return;
    derniere = now;
    const { gl } = etat;
    // la taille suit la toile (écran tourné, fenêtre redimensionnée), sans dépasser 2 pixels par point (le tableau en fait 800 de large)
    const r = Math.min(window.devicePixelRatio || 1, 2);
    const w = Math.round(toile.clientWidth * r), h = Math.round(toile.clientHeight * r);
    if (w && h && (toile.width !== w || toile.height !== h)) { toile.width = w; toile.height = h; }
    gl.viewport(0, 0, toile.width, toile.height);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.uniform1f(etat.tLoc, (now - etat.t0) / 1000);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    toile.classList.add('prete');
  };
  requestAnimationFrame(pas);
}

/** Après chaque rendu du district : la même toile WebGL revient à sa place (l'écran est reconstruit chaque seconde) */
export function brancherHoule(racine: HTMLElement) {
  const place = racine.querySelector<HTMLElement>('.toile .houle');
  if (!place || echec) return;
  const image = place.dataset.image!, masque = place.dataset.masque!;
  try {
    if (!etat || etat.image !== image) { etat = creer(image, masque); if (!etat) { echec = true; return; } }
  } catch { echec = true; return; }
  const enCours = toile!.isConnected;
  place.append(toile!);
  if (!enCours || document.hidden) { etat.tour++; boucle(etat.tour); }
}

// au retour sur l'onglet du navigateur, la houle reprend
document.addEventListener('visibilitychange', () => {
  if (!document.hidden && etat && toile?.isConnected) { etat.tour++; boucle(etat.tour); }
});
