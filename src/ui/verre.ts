// Le verre qui encaisse la lumière : à chaque coup, l'illustration de l'ennemi se plie comme du verre chaud.
// Une onde part du point d'impact, déforme l'image sur son passage et sépare un instant le rouge du bleu sur ses bords.
// Un petit calque WebGL se glisse juste au-dessus de l'image (sous le nom, l'intention et les chiffres) le temps de l'onde,
// la redessine déformée, puis s'efface : l'image d'origine n'est jamais touchée.
// Sans WebGL 2, ou avec « réduire les animations », rien ne se passe : les autres effets suffisent.

const MAX_ONDES = 4;

/**
 * L'échelle des effets : 1 sur téléphone (scène d'environ 340 × 140 à 390 × 250 px), jusqu'à 2,4 sur un grand écran de PC
 * où l'ennemi est affiché deux à trois fois plus grand. Tout ce qui se mesure en pixels autour de l'ennemi en dépend.
 */
export const echelleScene = (largeur: number, hauteur: number) => Math.min(2.4, Math.max(1, Math.sqrt(largeur * hauteur) / 300));
const DUREE = 560;

interface Onde { x: number; y: number; debut: number; force: number; couleur: [number, number, number] }

let toile: HTMLCanvasElement | null = null;
let gl: WebGL2RenderingContext | null = null;
let prog: WebGLProgram | null = null;
let texture: WebGLTexture | null = null;
let texSrc = '';
let ondes: Onde[] = [];
let boucle = 0;
let impossible = false;
const U: Record<string, WebGLUniformLocation | null> = {};

const SOMMETS = `#version 300 es
in vec2 p;
void main() { gl_Position = vec4(p, 0.0, 1.0); }`;

// tout se calcule en pixels CSS de la scène : on remonte du pixel de l'écran au pixel de l'image (transformations CSS comprises)
const FRAGMENTS = `#version 300 es
precision highp float;
uniform sampler2D img;
uniform vec2 taille;      // la scène, en px CSS
uniform float dpr;
uniform float echelle;   // 1 sur téléphone, plus sur PC
uniform vec4 boite;       // l'image avant transformation : x, y, largeur, hauteur
uniform mat2 inverse;     // l'inverse de la transformation CSS de l'image (respiration, recul)
uniform vec2 decalage;    // sa translation
uniform vec4 couvre;      // object-fit: cover → décalage et taille de l'image peinte dans sa boîte
uniform vec4 ondes[${MAX_ONDES}];   // x, y, avancée (0 → 1), force
uniform vec3 teintes[${MAX_ONDES}];
uniform int n;
out vec4 sortie;

vec2 versUv(vec2 p) {
  vec2 o = boite.xy + boite.zw * 0.5;
  vec2 local = o + inverse * (p - o - decalage);
  return (local - boite.xy - couvre.xy) / couvre.zw;
}
float dans(vec2 uv) { return step(0.0, uv.x) * step(0.0, uv.y) * step(uv.x, 1.0) * step(uv.y, 1.0); }

void main() {
  vec2 p = vec2(gl_FragCoord.x, taille.y * dpr - gl_FragCoord.y) / dpr;
  vec2 d = vec2(0.0);
  float fil = 0.0;
  vec3 lueur = vec3(0.0);
  for (int i = 0; i < ${MAX_ONDES}; i++) {
    if (i >= n) break;
    vec4 o = ondes[i];
    float t = o.z, f = o.w;
    vec2 v = p - o.xy;
    float r = length(v);
    float rayon = (12.0 + (150.0 + f * 34.0) * (1.0 - pow(1.0 - t, 3.0))) * echelle;
    float larg = (16.0 + f * 4.0 + t * 22.0) * echelle;
    float s = (r - rayon) / larg;
    float g = exp(-s * s);
    float amp = (6.0 + f * 2.2) * pow(1.0 - t, 1.6) * pow(echelle, 0.8);
    // le front de l'onde : le verre est poussé vers l'extérieur devant, tiré vers l'intérieur derrière (comme une lentille)
    d += (r > 0.001 ? v / r : vec2(0.0)) * (-s * g * 2.33) * amp;
    fil += g * pow(1.0 - t, 2.0);
    // au centre, juste après le choc, le verre s'enfonce un peu
    float rc = (30.0 + f * 8.0) * echelle;
    float creux = exp(-r * r / (rc * rc)) * max(0.0, 1.0 - t * 3.0);
    d += v * creux * 0.18;
    lueur += teintes[i] * g * pow(1.0 - t, 2.2) * (0.22 + f * 0.04);
  }
  // la dispersion : le rouge et le bleu ne se plient pas tout à fait autant
  vec2 ur = versUv(p - d * 1.35), ug = versUv(p - d), ub = versUv(p - d * 0.65);
  float a = dans(ug);
  if (a == 0.0) discard;
  vec3 c = vec3(texture(img, ur).r, texture(img, ug).g, texture(img, ub).b);
  // l'arête de l'onde accroche la lumière, dans la couleur du coup
  c += lueur + vec3(min(fil, 1.0) * 0.06);
  sortie = vec4(c, 1.0);
}`;

function compiler(type: number, src: string) {
  const s = gl!.createShader(type)!;
  gl!.shaderSource(s, src);
  gl!.compileShader(s);
  if (!gl!.getShaderParameter(s, gl!.COMPILE_STATUS)) throw new Error(gl!.getShaderInfoLog(s) ?? 'shader');
  return s;
}

function preparer(): boolean {
  if (gl) return true;
  if (impossible) return false;
  try {
    toile = document.createElement('canvas');
    toile.className = 'calque-verre';
    toile.setAttribute('aria-hidden', 'true');
    gl = toile.getContext('webgl2', { premultipliedAlpha: true, alpha: true, antialias: false });
    if (!gl) throw new Error('webgl2');
    prog = gl.createProgram()!;
    gl.attachShader(prog, compiler(gl.VERTEX_SHADER, SOMMETS));
    gl.attachShader(prog, compiler(gl.FRAGMENT_SHADER, FRAGMENTS));
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error('programme');
    gl.useProgram(prog);
    const tampon = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, tampon);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(prog, 'p');
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    for (const nom of ['img', 'taille', 'dpr', 'echelle', 'boite', 'inverse', 'decalage', 'couvre', 'ondes', 'teintes', 'n']) U[nom] = gl.getUniformLocation(prog, nom);
    return true;
  } catch {
    impossible = true;
    gl = null;
    toile = null;
    return false;
  }
}

/** L'image de l'ennemi en texture (une seule à la fois : celle de l'ennemi à l'écran) */
function charger(img: HTMLImageElement): boolean {
  if (!gl || !img.complete || !img.naturalWidth) return false;
  if (texture && texSrc === img.currentSrc) return true;
  if (!texture) texture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, texture);
  try {
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
  } catch { return false; }
  // les mipmaps : l'image est réduite à l'écran, sans elles elle scintillerait
  gl.generateMipmap(gl.TEXTURE_2D);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  texSrc = img.currentSrc;
  return true;
}

const rgb = (hex: string): [number, number, number] => {
  const v = parseInt(hex.replace('#', ''), 16);
  return [((v >> 16) & 255) / 255, ((v >> 8) & 255) / 255, (v & 255) / 255];
};

/** object-position en pourcentages (« 50% 22% ») ; le centre sinon */
function position(img: HTMLImageElement): [number, number] {
  const m = getComputedStyle(img).objectPosition.match(/(-?[\d.]+)%\s+(-?[\d.]+)%/);
  return m ? [Number(m[1]) / 100, Number(m[2]) / 100] : [0.5, 0.5];
}

function dessiner() {
  boucle = 0;
  const t0 = performance.now();
  ondes = ondes.filter((o) => t0 - o.debut < DUREE);
  // le combat se redessine à chaque étape : on retrouve l'image du moment et on se glisse juste au-dessus
  const img = document.querySelector<HTMLImageElement>('.scene-ennemi img.ennemi-art');
  const scene = img?.parentElement;
  if (!ondes.length || !img || !scene || !gl || !toile || !charger(img)) { toile?.remove(); ondes = []; return; }
  if (img.nextElementSibling !== toile) img.after(toile);

  const dpr = Math.min(2, devicePixelRatio || 1);
  const L = scene.clientWidth, H = scene.clientHeight;
  if (toile.width !== Math.round(L * dpr) || toile.height !== Math.round(H * dpr)) {
    toile.width = Math.round(L * dpr);
    toile.height = Math.round(H * dpr);
  }
  gl.viewport(0, 0, toile.width, toile.height);

  // la boîte de l'image dans la scène, et sa transformation CSS du moment (respiration, recul du coup)
  const st = getComputedStyle(img);
  const bx = img.offsetLeft, by = img.offsetTop, bw = img.offsetWidth, bh = img.offsetHeight;
  const m = st.transform && st.transform !== 'none' ? new DOMMatrix(st.transform) : new DOMMatrix();
  const det = m.a * m.d - m.b * m.c || 1;
  // le filtre de l'image (l'éclair blanc du coup) passe aussi sur le calque
  toile.style.filter = st.filter === 'none' ? '' : st.filter;
  toile.style.opacity = st.opacity;
  const echelle = Math.max(bw / img.naturalWidth, bh / img.naturalHeight);
  const pw = img.naturalWidth * echelle, ph = img.naturalHeight * echelle;
  const [ox, oy] = position(img);

  gl.uniform1i(U.img!, 0);
  gl.uniform2f(U.taille!, L, H);
  gl.uniform1f(U.dpr!, toile.width / L);
  gl.uniform1f(U.echelle!, echelleScene(L, H));
  gl.uniform4f(U.boite!, bx, by, bw, bh);
  // colonne par colonne (WebGL) : l'inverse de [a c; b d]
  gl.uniformMatrix2fv(U.inverse!, false, [m.d / det, -m.b / det, -m.c / det, m.a / det]);
  gl.uniform2f(U.decalage!, m.e, m.f);
  gl.uniform4f(U.couvre!, (bw - pw) * ox, (bh - ph) * oy, pw, ph);
  const sc = scene.getBoundingClientRect();
  const o = new Float32Array(MAX_ONDES * 4), c = new Float32Array(MAX_ONDES * 3);
  ondes.slice(-MAX_ONDES).forEach((w, i) => {
    o.set([w.x - sc.left - scene.clientLeft, w.y - sc.top - scene.clientTop, (t0 - w.debut) / DUREE, w.force], i * 4);
    c.set(w.couleur, i * 3);
  });
  gl.uniform4fv(U.ondes!, o);
  gl.uniform3fv(U.teintes!, c);
  gl.uniform1i(U.n!, Math.min(MAX_ONDES, ondes.length));
  gl.clearColor(0, 0, 0, 0);
  gl.clear(gl.COLOR_BUFFER_BIT);
  gl.drawArrays(gl.TRIANGLES, 0, 3);
  boucle = requestAnimationFrame(dessiner);
}

/** Une onde de choc sur l'ennemi, partie du point (x, y) de l'écran ; force de 0 à 5 */
export function ondeDeChoc(x: number, y: number, couleur: string, force: number): void {
  if (!preparer()) return;
  ondes.push({ x, y, debut: performance.now(), force, couleur: rgb(couleur) });
  if (ondes.length > MAX_ONDES) ondes.shift();
  if (!boucle) boucle = requestAnimationFrame(dessiner);
}
