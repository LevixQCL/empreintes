/**
 * La dissolution cristalline d'un ennemi vaincu (28 octobre 2026, choix de Bryan).
 *
 * L'illustration ne s'efface pas en fondu : elle se cristallise (des fêlures de glace parcourent l'image),
 * puis se défait éclat par éclat à partir du point du dernier coup, avec un liseré de lumière sur le front.
 * Tout est calculé dans un petit shader WebGL, à la résolution réelle de l'écran : aucun gros pixel,
 * et la forme change à chaque victoire (point de départ et motif tirés au hasard).
 *
 * Sans WebGL (vieux téléphone) ou avec « réduire les animations », on garde le simple fondu.
 */

const VERTEX = `
attribute vec2 a;
varying vec2 vUv;
void main() { vUv = a * 0.5 + 0.5; gl_Position = vec4(a, 0.0, 1.0); }
`;

const FRAGMENT = `
precision highp float;
varying vec2 vUv;
uniform sampler2D uTex;
uniform float uT;          // le seuil qui avance
uniform vec2 uOrigine;     // d'où part la dissolution (espace de la scène, 0..1)
uniform float uAspect;     // largeur / hauteur de la scène
uniform vec2 uDecal;       // le recadrage « object-fit: cover » de l'image
uniform vec2 uEchelle;
uniform vec3 uGlace;       // la couleur des fêlures et du liseré
uniform float uGraine;

vec2 h2(vec2 p) {
  p = vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)));
  return fract(sin(p + uGraine) * 43758.5453);
}
float h1(vec2 p) { return fract(sin(dot(p, vec2(41.3, 289.1)) + uGraine) * 45758.5453); }
float bruit(vec2 p) {
  vec2 i = floor(p), f = fract(p), u = f * f * (3.0 - 2.0 * f);
  return mix(mix(h1(i), h1(i + vec2(1.0, 0.0)), u.x), mix(h1(i + vec2(0.0, 1.0)), h1(i + vec2(1.0, 1.0)), u.x), u.y);
}
float fbm(vec2 p) { float v = 0.0, a = 0.5; for (int i = 0; i < 4; i++) { v += a * bruit(p); p *= 2.03; a *= 0.5; } return v; }

// les éclats : un pavage de Voronoï ; renvoie (valeur de l'éclat, distance à l'arête)
vec2 eclats(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  float d1 = 8.0, d2 = 8.0; vec2 id = vec2(0.0);
  for (int y = -1; y <= 1; y++) for (int x = -1; x <= 1; x++) {
    vec2 g = vec2(float(x), float(y));
    vec2 o = h2(i + g);
    float d = length(g + o - f);
    if (d < d1) { d2 = d1; d1 = d; id = i + g; } else if (d < d2) { d2 = d; }
  }
  return vec2(h1(id * 1.7), d2 - d1);
}

void main() {
  vec2 uv = vec2(vUv.x, 1.0 - vUv.y);
  vec2 tc = (uv - uDecal) / uEchelle;
  vec4 img = texture2D(uTex, clamp(tc, 0.0, 1.0));
  if (tc.x < 0.0 || tc.y < 0.0 || tc.x > 1.0 || tc.y > 1.0) img = vec4(0.0);

  vec2 p = vec2(uv.x * uAspect, uv.y);
  vec2 e = eclats(p * 6.5);
  float dist = distance(p, vec2(uOrigine.x * uAspect, uOrigine.y));
  float n = 0.42 * e.x + 0.08 * fbm(p * 14.0) + 0.75 * dist;
  float d = n - uT;

  // ce qui est déjà parti : transparent, avec un bord doux (pas d'escalier)
  float aa = fwidth(n) * 1.5 + 0.002;
  float reste = smoothstep(0.0, aa, d);
  if (reste <= 0.0) { gl_FragColor = vec4(0.0); return; }

  vec3 c = img.rgb;
  // la cristallisation : en approchant du front, l'image se glace et des fêlures lumineuses la parcourent
  float proche = 1.0 - smoothstep(0.0, 0.28, d);
  float lum = dot(c, vec3(0.299, 0.587, 0.114));
  c = mix(c, mix(vec3(lum), uGlace, 0.45) * 1.15, proche * 0.55);
  float arete = 1.0 - smoothstep(0.0, 0.035 + fwidth(e.y), e.y);
  c += uGlace * arete * proche * proche * 1.6;
  // le liseré du front : blanc au bord, puis la couleur de la glace
  float lisere = 1.0 - smoothstep(0.0, 0.03, d);
  c = mix(c, mix(vec3(1.0), uGlace, smoothstep(0.0, 0.03, d) * 0.8 + 0.2) * 1.3, lisere * 0.7);

  float a = img.a * reste;
  gl_FragColor = vec4(c * a, a);
}
`;

function couleur(hex: string): [number, number, number] {
  const v = parseInt(hex.replace('#', ''), 16);
  return [((v >> 16) & 255) / 255, ((v >> 8) & 255) / 255, (v & 255) / 255];
}

/** Recadrage d'une image en « cover » avec son object-position, en fractions de la boîte */
function recadrage(img: HTMLImageElement, w: number, h: number) {
  const cs = getComputedStyle(img);
  const [px, py] = cs.objectPosition.split(' ').map((v) => (v.endsWith('%') ? parseFloat(v) / 100 : 0.5));
  const k = cs.objectFit === 'cover' || cs.objectFit === '' ? Math.max(w / img.naturalWidth, h / img.naturalHeight) : Math.min(w / img.naturalWidth, h / img.naturalHeight);
  const dw = img.naturalWidth * k, dh = img.naturalHeight * k;
  return { decal: [((w - dw) * (px ?? 0.5)) / w, ((h - dh) * (py ?? 0.5)) / h] as const, echelle: [dw / w, dh / h] as const };
}

function compiler(gl: WebGLRenderingContext, type: number, src: string) {
  const s = gl.createShader(type)!;
  gl.shaderSource(s, src);
  gl.compileShader(s);
  return gl.getShaderParameter(s, gl.COMPILE_STATUS) ? s : null;
}

export interface Dissolution {
  /** l'origine du front, en fractions de la scène (par défaut : près du centre, tirée au hasard) */
  origine?: { x: number; y: number };
  delai?: number;
  duree?: number;
  glace?: string;
  /** appelée à chaque image avec des points du front, pour y faire naître des éclats */
  surFront?: (x: number, y: number) => void;
}

/**
 * Dissout l'illustration. Renvoie false si la dissolution peinte n'est pas possible (l'appelant fait alors un fondu).
 */
export function dissoudre(img: HTMLImageElement, o: Dissolution = {}): boolean {
  if (!img.complete || !img.naturalWidth) return false;
  const r = img.getBoundingClientRect();
  if (r.width < 4 || r.height < 4) return false;
  const toile = document.createElement('canvas');
  const gl = (toile.getContext('webgl', { premultipliedAlpha: true, alpha: true, antialias: false }) as WebGLRenderingContext | null);
  if (!gl || !gl.getExtension('OES_standard_derivatives')) return false;

  const vs = compiler(gl, gl.VERTEX_SHADER, VERTEX);
  const fs = compiler(gl, gl.FRAGMENT_SHADER, '#extension GL_OES_standard_derivatives : enable\n' + FRAGMENT);
  if (!vs || !fs) return false;
  const prog = gl.createProgram()!;
  gl.attachShader(prog, vs); gl.attachShader(prog, fs); gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return false;

  // la toile prend exactement la place de l'image, avec ses masques (les gardes de pillage sont détourés)
  const dpr = Math.min(window.devicePixelRatio || 1, 2.5);
  toile.width = Math.round(r.width * dpr);
  toile.height = Math.round(r.height * dpr);
  toile.className = 'ennemi-dissolution';
  toile.setAttribute('aria-hidden', 'true');
  const cs = getComputedStyle(img);
  const st = toile.style as CSSStyleDeclaration & Record<string, string>;
  for (const prop of ['maskImage', 'webkitMaskImage', 'maskSize', 'webkitMaskSize', 'maskPosition', 'webkitMaskPosition', 'maskRepeat', 'webkitMaskRepeat']) {
    const v = (cs as unknown as Record<string, string>)[prop];
    if (v && v !== 'none') st[prop] = v;
  }
  try {
    gl.bindTexture(gl.TEXTURE_2D, gl.createTexture());
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
  } catch {
    return false;
  }

  gl.useProgram(prog);
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(prog, 'a');
  gl.enableVertexAttribArray(loc);
  gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
  const u = (n: string) => gl.getUniformLocation(prog, n);
  const { decal, echelle } = recadrage(img, r.width, r.height);
  const origine = o.origine ?? { x: 0.35 + Math.random() * 0.3, y: 0.3 + Math.random() * 0.3 };
  const aspect = r.width / r.height;
  gl.uniform2f(u('uDecal'), decal[0], decal[1]);
  gl.uniform2f(u('uEchelle'), echelle[0], echelle[1]);
  gl.uniform2f(u('uOrigine'), origine.x, origine.y);
  gl.uniform1f(u('uAspect'), aspect);
  gl.uniform1f(u('uGraine'), Math.random() * 100);
  gl.uniform3fv(u('uGlace'), couleur(o.glace ?? '#8FDCFF'));
  gl.viewport(0, 0, toile.width, toile.height);
  gl.enable(gl.BLEND);
  gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
  const uT = u('uT');

  // le seuil va de « rien n'est parti » à « tout est parti » (distance maximale au point de départ + le bruit)
  const loin = Math.max(...[[0, 0], [1, 0], [0, 1], [1, 1]].map(([x, y]) => Math.hypot((x! - origine.x) * aspect, y! - origine.y)));
  const tMin = -0.02, tMax = 0.75 * loin + 0.52;
  const dessiner = (t: number) => { gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT); gl.uniform1f(uT, t); gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4); };

  const delai = o.delai ?? 0, duree = o.duree ?? 1500;
  // la scène peut être redessinée pendant la dissolution : la toile se replace alors dans la nouvelle scène
  const poser = () => {
    if (toile.isConnected) return true;
    const cible = (img.isConnected ? img : document.querySelector('.scene-ennemi .ennemi-art')) as HTMLElement | null;
    if (!cible?.parentElement) return false;
    cible.after(toile);
    cible.style.opacity = '0';
    return true;
  };
  dessiner(tMin);
  const debut = performance.now() + delai;
  window.setTimeout(() => { poser(); img.style.opacity = '0'; }, delai);
  const image = (maintenant: number) => {
    const k = Math.min(1, Math.max(0, (maintenant - debut) / duree));
    if (maintenant >= debut && !poser()) return;
    // lent au départ (le temps de voir la glace prendre), puis l'éclatement s'accélère
    const e = k * k * (3 - 2 * k) * 0.65 + k * k * 0.35;
    const t = tMin + (tMax - tMin) * e;
    dessiner(t);
    if (o.surFront && k > 0 && k < 1) {
      const b = toile.getBoundingClientRect();
      // des points sur le front (le bruit le fait onduler, on reste donc au voisinage du cercle)
      const rayon = Math.max(0, t - 0.25) / 0.75;
      for (let i = 0; i < 2; i++) {
        const a = Math.random() * Math.PI * 2;
        const fx = origine.x + (Math.cos(a) * rayon) / aspect, fy = origine.y + Math.sin(a) * rayon;
        if (fx > 0.05 && fx < 0.95 && fy > 0.05 && fy < 0.92) o.surFront(b.left + fx * b.width, b.top + fy * b.height);
      }
    }
    if (k < 1) requestAnimationFrame(image);
    else { toile.remove(); gl.getExtension('WEBGL_lose_context')?.loseContext(); }
  };
  requestAnimationFrame(image);
  return true;
}
