// Le son du combat (refonte du 29 octobre 2026).
//
// Direction artistique : « cristal et lumière », sous les eaux.
//  - Une seule tonalité pour tout le jeu (Ré majeur pentatonique) : quoi qu'il arrive en même temps, rien ne sonne faux.
//    Plus aucun désaccord au hasard : la variété vient du placement (gauche / droite) et du timbre, jamais de la justesse.
//  - Un instrument par lignée, tous de la même famille « cristal » :
//      Augmentés = cristal vif et grésillant ; Génés = ambre boisé, chaud et court ; Résonants = cloche ronde qui ondule et se répète.
//  - Les coups sont des chocs sourds (un « boum » bref, un grain de matière), pas des notes : la musique, c'est la chaîne.
//  - Tout passe par une salle (réverbération de grotte immergée), un écho discret et un compresseur doux :
//    les sons se fondent au lieu de s'empiler. Plus aucune onde carrée ni dent de scie.
//  - Les suites montent la gamme ; la Résonance s'ouvre en accord tenu ; la victoire se pose sur l'accord de Ré.
//
// Les sons sont synthétisés (aucun fichier à charger) et programmés sur l'horloge audio, pas sur des minuteries :
// une suite reste en mesure même si le téléphone rame.

import type { LigneeGeste } from '../core/types';

// ---------- Réglages et état ----------

export const sonActif = () => { try { return localStorage.getItem('empreintes.son') !== '0'; } catch { return true; } };
export function basculerSon(): boolean {
  const on = !sonActif();
  try { localStorage.setItem('empreintes.son', on ? '1' : '0'); } catch { /* stockage indisponible */ }
  return on;
}

interface Bus { sec: GainNode; salle: GainNode; echo: GainNode; bruit: AudioBuffer }
let ctx: BaseAudioContext | null = null;
let bus: Bus | null = null;
/** voix en cours : au-delà d'un plafond, les sons d'ornement se taisent (un téléphone ne doit jamais saturer) */
let voix = 0;
const PLAFOND = 28;

/** iOS ne laisse jouer le son que s'il a été ouvert pendant un toucher : à appeler dans un clic */
export function debloquerSon(): void {
  if (!sonActif()) return;
  try {
    if (!ctx) ctx = new AudioContext();
    if (ctx instanceof AudioContext && ctx.state === 'suspended') void ctx.resume();
  } catch { /* pas d'audio */ }
}

/** Pour l'écoute hors ligne (planche sonore) : branche le moteur sur un contexte donné */
export function utiliserContexte(c: BaseAudioContext): void { ctx = c; bus = null; voix = 0; }

function prendre(): { c: BaseAudioContext; b: Bus } | null {
  if (!sonActif() && !(ctx && !(ctx instanceof AudioContext))) return null;
  try {
    if (!ctx) ctx = new AudioContext();
    if (!bus) bus = monter(ctx);
    return { c: ctx, b: bus };
  } catch { return null; }
}

// ---------- La console : salle, écho, compresseur ----------

function monter(c: BaseAudioContext): Bus {
  // sortie : un léger adoucissement des aigus, puis un compresseur doux qui colle les sons ensemble
  const doux = c.createBiquadFilter(); doux.type = 'highshelf'; doux.frequency.value = 6500; doux.gain.value = -5;
  const creux = c.createBiquadFilter(); creux.type = 'peaking'; creux.frequency.value = 2800; creux.Q.value = 0.9; creux.gain.value = -2.5;
  const comp = c.createDynamicsCompressor();
  comp.threshold.value = -20; comp.knee.value = 14; comp.ratio.value = 3.5; comp.attack.value = 0.005; comp.release.value = 0.22;
  const sortie = c.createGain(); sortie.gain.value = 0.85;
  doux.connect(creux); creux.connect(comp); comp.connect(sortie); sortie.connect(c.destination);

  const sec = c.createGain(); sec.connect(doux);

  // la salle : une grotte immergée, sombre et longue (réponse générée : bruit qui s'éteint en s'assombrissant)
  const salle = c.createGain();
  const preDelai = c.createDelay(0.1); preDelai.delayTime.value = 0.025;
  const conv = c.createConvolver(); conv.buffer = reponseSalle(c, 2.8);
  const retourSalle = c.createGain(); retourSalle.gain.value = 0.55;
  const basSalle = c.createBiquadFilter(); basSalle.type = 'highpass'; basSalle.frequency.value = 180;
  salle.connect(preDelai); preDelai.connect(conv); conv.connect(basSalle); basSalle.connect(retourSalle); retourSalle.connect(doux);

  // l'écho : une répétition pointée, filtrée, qui retombe dans la salle
  const echo = c.createGain();
  const ligne = c.createDelay(1); ligne.delayTime.value = 0.285;
  const boucle = c.createGain(); boucle.gain.value = 0.32;
  const filtreEcho = c.createBiquadFilter(); filtreEcho.type = 'lowpass'; filtreEcho.frequency.value = 2400;
  const retourEcho = c.createGain(); retourEcho.gain.value = 0.42;
  echo.connect(ligne); ligne.connect(filtreEcho); filtreEcho.connect(boucle); boucle.connect(ligne);
  filtreEcho.connect(retourEcho); retourEcho.connect(doux); retourEcho.connect(salle);

  // un bruit blanc, tiré une fois pour toutes
  const bruit = c.createBuffer(1, Math.floor(c.sampleRate * 1.5), c.sampleRate);
  const d = bruit.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  return { sec, salle, echo, bruit };
}

function reponseSalle(c: BaseAudioContext, duree: number): AudioBuffer {
  const n = Math.floor(c.sampleRate * duree);
  const buf = c.createBuffer(2, n, c.sampleRate);
  for (let canal = 0; canal < 2; canal++) {
    const d = buf.getChannelData(canal);
    let lisse = 0;
    for (let i = 0; i < n; i++) {
      const t = i / n;
      // la queue s'assombrit en s'éteignant : un filtre passe-bas qui se referme
      const k = 0.55 - 0.45 * t;
      lisse += k * ((Math.random() * 2 - 1) - lisse);
      d[i] = lisse * Math.pow(1 - t, 2.6) * (i < 64 ? i / 64 : 1);
    }
  }
  return buf;
}

/** Une sortie de voix : position gauche / droite, et ce qu'elle envoie à la salle et à l'écho */
function sortieVoix(c: BaseAudioContext, b: Bus, o: { pan?: number; salle?: number; echo?: number }, fin: number): GainNode {
  const g = c.createGain();
  let dernier: AudioNode = g;
  if (o.pan && 'createStereoPanner' in c) { const p = c.createStereoPanner(); p.pan.value = o.pan; g.connect(p); dernier = p; }
  dernier.connect(b.sec);
  if (o.salle) { const s = c.createGain(); s.gain.value = o.salle; dernier.connect(s); s.connect(b.salle); }
  if (o.echo) { const e = c.createGain(); e.gain.value = o.echo; dernier.connect(e); e.connect(b.echo); }
  if (!(c instanceof AudioContext)) return g;
  voix++;
  const restant = Math.max(0, fin - c.currentTime) * 1000 + 60;
  setTimeout(() => { voix = Math.max(0, voix - 1); try { g.disconnect(); } catch { /* déjà débranché */ } }, restant);
  return g;
}

// ---------- La gamme ----------

/** Ré majeur pentatonique (ré mi fa# la si) : n'importe quelles notes ensemble sonnent juste */
const PENTA = [0, 2, 4, 7, 9];
const RE4 = 293.66;
/** hauteur d'un degré de la gamme : 0 = ré 4, 5 = ré 5, -5 = ré 3… */
export function degre(n: number): number {
  const oct = Math.floor(n / 5), i = ((n % 5) + 5) % 5;
  return RE4 * Math.pow(2, (oct * 12 + PENTA[i]!) / 12);
}
const alea = (a: number, b: number) => a + Math.random() * (b - a);

// ---------- Les instruments ----------

interface Jeu { quand?: number; vel?: number; pan?: number; salle?: number; echo?: number; ornement?: boolean }

/** Cristal : cloche de verre (synthèse FM à rapport inharmonique), attaque nette, longue résonance */
function cristal(f: number, o: Jeu & { duree?: number; eclat?: number; rapport?: number } = {}) {
  const m = prendre(); if (!m) return; const { c, b } = m;
  if (o.ornement && voix > PLAFOND * 0.6) return;
  if (voix > PLAFOND) return;
  const t = c.currentTime + (o.quand ?? 0), duree = o.duree ?? 1.4, vel = o.vel ?? 0.12, eclat = o.eclat ?? 1.6;
  const out = sortieVoix(c, b, { pan: o.pan ?? 0, salle: o.salle ?? 0.35, echo: o.echo ?? 0 }, t + duree);
  const porteuse = c.createOscillator(); porteuse.frequency.value = f;
  const mod = c.createOscillator(); mod.frequency.value = f * (o.rapport ?? 3.5);
  const ind = c.createGain();
  ind.gain.setValueAtTime(f * eclat, t); ind.gain.exponentialRampToValueAtTime(f * 0.04, t + 0.22);
  mod.connect(ind); ind.connect(porteuse.frequency);
  // un partiel de verre, au-dessus, qui s'éteint plus vite
  const partiel = c.createOscillator(); partiel.frequency.value = f * 2.756;
  const gp = c.createGain(); gp.gain.setValueAtTime(0.0001, t); gp.gain.linearRampToValueAtTime(vel * 0.22, t + 0.003); gp.gain.exponentialRampToValueAtTime(0.0001, t + duree * 0.35);
  partiel.connect(gp); gp.connect(out);
  const g = c.createGain();
  g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(vel, t + 0.004); g.gain.exponentialRampToValueAtTime(0.0001, t + duree);
  porteuse.connect(g); g.connect(out);
  for (const x of [porteuse, mod, partiel]) { x.start(t); x.stop(t + duree + 0.05); }
}

/** Ambre : lame boisée (marimba de résine), chaude et courte, pour les Génés */
function ambre(f: number, o: Jeu = {}) {
  const m = prendre(); if (!m || voix > PLAFOND) return; const { c, b } = m;
  const t = c.currentTime + (o.quand ?? 0), vel = o.vel ?? 0.16, duree = 0.55;
  const out = sortieVoix(c, b, { pan: o.pan ?? 0, salle: o.salle ?? 0.25, echo: o.echo ?? 0 }, t + duree);
  const porteuse = c.createOscillator(); porteuse.frequency.value = f;
  const mod = c.createOscillator(); mod.frequency.value = f * 4;
  const ind = c.createGain(); ind.gain.setValueAtTime(f * 1.1, t); ind.gain.exponentialRampToValueAtTime(f * 0.02, t + 0.07);
  mod.connect(ind); ind.connect(porteuse.frequency);
  const sous = c.createOscillator(); sous.frequency.value = f / 2;
  const gs = c.createGain(); gs.gain.setValueAtTime(0.0001, t); gs.gain.linearRampToValueAtTime(vel * 0.35, t + 0.006); gs.gain.exponentialRampToValueAtTime(0.0001, t + 0.3);
  sous.connect(gs); gs.connect(out);
  const g = c.createGain();
  g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(vel, t + 0.003); g.gain.exponentialRampToValueAtTime(0.0001, t + duree);
  porteuse.connect(g); g.connect(out);
  for (const x of [porteuse, mod, sous]) { x.start(t); x.stop(t + duree + 0.05); }
}

/** Onde : cloche ronde qui ondule doucement (vibrato), pour les Résonants */
function onde(f: number, o: Jeu & { duree?: number } = {}) {
  const m = prendre(); if (!m || voix > PLAFOND) return; const { c, b } = m;
  const t = c.currentTime + (o.quand ?? 0), vel = o.vel ?? 0.12, duree = o.duree ?? 1.8;
  const out = sortieVoix(c, b, { pan: o.pan ?? 0, salle: o.salle ?? 0.45, echo: o.echo ?? 0.3 }, t + duree);
  const vib = c.createOscillator(); vib.frequency.value = 5.2;
  const prof = c.createGain(); prof.gain.setValueAtTime(0, t); prof.gain.linearRampToValueAtTime(f * 0.006, t + 0.4);
  vib.connect(prof);
  const g = c.createGain();
  g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(vel, t + 0.012); g.gain.exponentialRampToValueAtTime(0.0001, t + duree);
  g.connect(out);
  const oscs = [1, 2.0, 3.0].map((k, i) => {
    const x = c.createOscillator(); x.frequency.value = f * k; prof.connect(x.frequency);
    const gx = c.createGain(); gx.gain.value = [1, 0.18, 0.06][i]!;
    x.connect(gx); gx.connect(g); return x;
  });
  for (const x of [vib, ...oscs]) { x.start(t); x.stop(t + duree + 0.05); }
}

/** Souffle : du bruit filtré qui balaie (un geste qui part, de la poussière, un élan) */
function souffle(o: Jeu & { duree: number; de: number; vers: number; q?: number }) {
  const m = prendre(); if (!m || voix > PLAFOND) return; const { c, b } = m;
  const t = c.currentTime + (o.quand ?? 0), vel = o.vel ?? 0.1;
  const out = sortieVoix(c, b, { pan: o.pan ?? 0, salle: o.salle ?? 0.3, echo: o.echo ?? 0 }, t + o.duree);
  const src = c.createBufferSource(); src.buffer = b.bruit; src.loop = true;
  const f = c.createBiquadFilter(); f.type = 'bandpass'; f.Q.value = o.q ?? 1.4;
  f.frequency.setValueAtTime(o.de, t); f.frequency.exponentialRampToValueAtTime(o.vers, t + o.duree);
  const g = c.createGain();
  g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(vel, t + o.duree * 0.35); g.gain.exponentialRampToValueAtTime(0.0001, t + o.duree);
  src.connect(f); f.connect(g); g.connect(out);
  src.start(t, Math.random()); src.stop(t + o.duree + 0.05);
}

/** Choc : un coup sourd — un grave qui plonge, un grain de matière, un claquement si le coup est net */
function choc(force: number, o: Jeu & { sourd?: boolean } = {}) {
  const m = prendre(); if (!m) return; const { c, b } = m;
  const t = c.currentTime + (o.quand ?? 0), k = Math.min(1, 0.45 + force * 0.11), vel = (o.vel ?? 1) * k;
  const duree = 0.22 + force * 0.05;
  const out = sortieVoix(c, b, { pan: o.pan ?? 0, salle: o.salle ?? 0.12 }, t + duree);
  // le grave : on l'entend aussi sur un haut-parleur de téléphone grâce à son harmonique
  const sub = c.createOscillator(); sub.type = 'sine';
  sub.frequency.setValueAtTime(o.sourd ? 120 : 150, t); sub.frequency.exponentialRampToValueAtTime(o.sourd ? 46 : 52, t + 0.14);
  const gs = c.createGain(); gs.gain.setValueAtTime(0.0001, t); gs.gain.linearRampToValueAtTime(vel * 0.55, t + 0.004); gs.gain.exponentialRampToValueAtTime(0.0001, t + duree);
  const sat = c.createWaveShaper(); sat.curve = courbeChaude(); sub.connect(gs); gs.connect(sat); sat.connect(out);
  // la matière : un bruit étouffé
  const n = c.createBufferSource(); n.buffer = b.bruit;
  const fn = c.createBiquadFilter(); fn.type = 'lowpass'; fn.frequency.setValueAtTime(o.sourd ? 600 : 1400 + force * 250, t); fn.frequency.exponentialRampToValueAtTime(200, t + 0.12);
  const gn = c.createGain(); gn.gain.setValueAtTime(0.0001, t); gn.gain.linearRampToValueAtTime(vel * 0.32, t + 0.002); gn.gain.exponentialRampToValueAtTime(0.0001, t + 0.16);
  n.connect(fn); fn.connect(gn); gn.connect(out);
  n.start(t, Math.random()); n.stop(t + 0.2);
  // le claquement : très court, seulement pour les coups portés
  if (!o.sourd) {
    const cl = c.createBufferSource(); cl.buffer = b.bruit;
    const fc = c.createBiquadFilter(); fc.type = 'highpass'; fc.frequency.value = 2600;
    const gc = c.createGain(); gc.gain.setValueAtTime(vel * 0.12, t); gc.gain.exponentialRampToValueAtTime(0.0001, t + 0.018);
    cl.connect(fc); fc.connect(gc); gc.connect(out);
    cl.start(t, Math.random()); cl.stop(t + 0.03);
  }
  sub.start(t); sub.stop(t + duree + 0.05);
}

let courbe: Float32Array<ArrayBuffer> | null = null;
function courbeChaude(): Float32Array<ArrayBuffer> {
  if (courbe) return courbe;
  courbe = new Float32Array(256);
  for (let i = 0; i < 256; i++) { const x = (i / 255) * 2 - 1; courbe[i] = Math.tanh(x * 2.2) / Math.tanh(2.2); }
  return courbe;
}

/** Nappe : un accord tenu, doux, qui s'ouvre et se pose dans la salle */
function nappe(freqs: number[], o: Jeu & { duree?: number; attaque?: number; clarte?: number; plancher?: number } = {}) {
  const m = prendre(); if (!m) return; const { c, b } = m;
  const t = c.currentTime + (o.quand ?? 0), duree = o.duree ?? 2.4, att = o.attaque ?? 0.18, vel = (o.vel ?? 0.07) / Math.sqrt(freqs.length);
  const out = sortieVoix(c, b, { pan: o.pan ?? 0, salle: o.salle ?? 0.7, echo: o.echo ?? 0 }, t + duree);
  const filtre = c.createBiquadFilter(); filtre.type = 'lowpass'; filtre.Q.value = 0.4;
  filtre.frequency.setValueAtTime(400, t); filtre.frequency.exponentialRampToValueAtTime(o.clarte ?? 2600, t + att * 2);
  const g = c.createGain();
  g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(vel, t + att); g.gain.setTargetAtTime(0.0001, t + att + (duree - att) * 0.25, (duree - att) * 0.3);
  // sous le plancher, on coupe : un accord tenu qui gonfle le grave rend tout pâteux
  const plancher = c.createBiquadFilter(); plancher.type = 'highpass'; plancher.frequency.value = o.plancher ?? 240; plancher.Q.value = 0.5;
  filtre.connect(plancher); plancher.connect(g); g.connect(out);
  const oscs: OscillatorNode[] = [];
  for (const f of freqs) for (const d of [-2, 2]) {
    const x = c.createOscillator(); x.type = 'triangle'; x.frequency.value = f; x.detune.value = d;
    x.connect(filtre); oscs.push(x);
  }
  for (const x of oscs) { x.start(t); x.stop(t + duree + 0.1); }
}

/** Grondement : du grave qui monte, pour ce qui menace (boss, ennemi qui se renforce) */
function grondement(o: Jeu & { duree: number }) {
  const m = prendre(); if (!m) return; const { c, b } = m;
  const t = c.currentTime + (o.quand ?? 0), vel = o.vel ?? 0.3;
  const out = sortieVoix(c, b, { salle: o.salle ?? 0.4 }, t + o.duree);
  const n = c.createBufferSource(); n.buffer = b.bruit; n.loop = true;
  const f = c.createBiquadFilter(); f.type = 'lowpass'; f.Q.value = 3;
  f.frequency.setValueAtTime(90, t); f.frequency.exponentialRampToValueAtTime(320, t + o.duree * 0.6); f.frequency.exponentialRampToValueAtTime(110, t + o.duree);
  const g = c.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(vel, t + o.duree * 0.4); g.gain.exponentialRampToValueAtTime(0.0001, t + o.duree);
  n.connect(f); f.connect(g); g.connect(out);
  const sub = c.createOscillator(); sub.frequency.setValueAtTime(degre(-10), t); sub.frequency.exponentialRampToValueAtTime(degre(-10) * 1.06, t + o.duree);
  const gs = c.createGain(); gs.gain.setValueAtTime(0.0001, t); gs.gain.linearRampToValueAtTime(vel * 0.6, t + o.duree * 0.3); gs.gain.exponentialRampToValueAtTime(0.0001, t + o.duree);
  const sat = c.createWaveShaper(); sat.curve = courbeChaude(); sub.connect(gs); gs.connect(sat); sat.connect(out);
  n.start(t, Math.random()); n.stop(t + o.duree + 0.05); sub.start(t); sub.stop(t + o.duree + 0.05);
}

// ---------- Le vocabulaire du combat ----------

/** où chaque lignée commence dans la gamme : Génés dans le médium chaud, Résonants au-dessus, Augmentés plus haut et vifs */
const DEPART: Record<LigneeGeste, number> = { bio: 0, reso: 3, tech: 5, neutre: 2 };
const panHasard = () => alea(-0.25, 0.25);

/** Une carte part de la chaîne : sa note monte avec sa place, son timbre dit sa lignée */
export function sonCarte(l: LigneeGeste, rang: number): void {
  const f = degre(DEPART[l] + rang), pan = panHasard();
  souffle({ duree: 0.16, de: 900, vers: 3200, vel: 0.035, pan, salle: 0.1 });
  if (l === 'bio') { ambre(f, { pan, quand: 0.02 }); ambre(f * 2, { pan, quand: 0.02, vel: 0.04 }); }
  else if (l === 'reso') onde(f, { pan, quand: 0.02, vel: 0.11 });
  else if (l === 'tech') {
    cristal(f, { pan, quand: 0.02, vel: 0.1, eclat: 2.4, rapport: 3.01, duree: 0.9 });
    // le grésillement de l'arc : trois grains très brefs
    for (let i = 0; i < 3; i++) souffle({ duree: 0.03, de: 5200, vers: 3800, q: 4, vel: 0.05, pan, quand: 0.01 + i * alea(0.018, 0.03), salle: 0 });
  } else cristal(f, { pan, quand: 0.02, vel: 0.1 });
}

/** Le coup porte : un choc qui grossit avec l'intensité ; au plus fort, quelques éclats de verre */
export function sonImpact(force: number): void {
  const pan = panHasard() * 0.5;
  choc(force, { pan });
  if (force >= 3) for (let i = 0; i < force - 1; i++) cristal(degre(12 + Math.floor(alea(0, 5))), { quand: 0.02 + i * 0.035, vel: 0.022, duree: 0.5, eclat: 3, pan: alea(-0.5, 0.5), ornement: true, salle: 0.5 });
}

/** Le coup ne fait rien (tout bloqué par l'ennemi) : un « toc » mat */
export function sonVain(): void {
  choc(0, { sourd: true, vel: 0.5 });
  cristal(degre(9), { vel: 0.04, duree: 0.18, eclat: 0.6, salle: 0.15 });
}

/** Un cristal se suspend au-dessus de l'ennemi : une petite note claire qui monte */
export function sonSuspendu(i: number): void {
  cristal(degre(10 + i), { vel: 0.045, duree: 1.6, echo: 0.25, salle: 0.5, pan: (i % 2 ? 1 : -1) * Math.min(0.6, 0.15 * (i + 1)), ornement: true });
}

/** Les cristaux plongent ensemble : l'accord se pose, un grand choc */
export function sonConvergence(n: number): void {
  choc(5, { vel: 1 });
  souffle({ duree: 0.35, de: 4000, vers: 600, vel: 0.06 });
  const accord = [0, 3, 5, 7, 8, 10].slice(0, Math.min(6, n + 2));
  accord.forEach((d, i) => cristal(degre(d), { quand: 0.01 + i * 0.03, vel: 0.07, duree: 2.2, salle: 0.6, pan: (i % 2 ? 0.3 : -0.3) * (i ? 1 : 0) }));
  nappe([degre(0), degre(3), degre(6)], { vel: 0.04, duree: 1.6, attaque: 0.05 });
}

/** Résonance : la suite s'élève note à note, puis s'ouvre en accord (d'autant plus large que la suite est longue) */
export function sonResonance(suite: number): void {
  const notes = [5, 6, 7, 8, 10, 12].slice(0, Math.max(2, Math.min(6, suite)));
  notes.forEach((d, i) => cristal(degre(d), { quand: i * 0.07, vel: 0.075, duree: 1.6, eclat: 1.2, echo: 0.2, salle: 0.55, pan: -0.4 + (0.8 * i) / Math.max(1, notes.length - 1) }));
  if (suite >= 4) nappe(suite >= 5 ? [degre(0), degre(3), degre(6), degre(8)] : [degre(0), degre(3), degre(6)], { quand: notes.length * 0.07, vel: suite >= 5 ? 0.075 : 0.055, duree: 2.2, attaque: 0.12 });
}

/** L'escouade encaisse : un coup sourd, plus lourd si le coup fait mal */
export function sonEncaisse(part: number): void {
  choc(1 + part * 4, { sourd: true, vel: 0.9 });
  if (part >= 0.3) grondement({ duree: 0.5, vel: 0.12 });
}

/** Le bouclier a tout pris : un tintement de verre, à peine un choc */
export function sonPare(): void {
  cristal(degre(12), { vel: 0.07, duree: 0.6, eclat: 2.6, rapport: 2.41, salle: 0.4 });
  choc(0, { sourd: true, vel: 0.35 });
}

/** Le bouclier se brise sous le coup */
export function sonBrise(): void {
  for (let i = 0; i < 4; i++) cristal(degre(11 + Math.floor(alea(0, 4))), { quand: i * 0.025, vel: 0.04, duree: 0.45, eclat: 3, pan: alea(-0.5, 0.5) });
  souffle({ duree: 0.18, de: 6000, vers: 2500, vel: 0.05, q: 0.8 });
}

/** Le coup ricoche sur le bouclier */
export function sonRicochet(): void {
  cristal(degre(10), { vel: 0.07, duree: 0.7, eclat: 2.2, rapport: 2.41, pan: -0.2 });
  cristal(degre(13), { quand: 0.06, vel: 0.04, duree: 0.6, eclat: 2, pan: 0.3 });
}

/** L'ennemi se couvre d'une coque */
export function sonCoque(): void {
  cristal(degre(-2), { vel: 0.08, duree: 1, eclat: 1, rapport: 2.41, salle: 0.5 });
  souffle({ duree: 0.3, de: 500, vers: 1500, vel: 0.04 });
}

/** Un soin : deux notes qui montent, et un scintillement */
export function sonSoin(): void {
  onde(degre(7), { vel: 0.07, duree: 1.4, echo: 0.2 });
  onde(degre(9), { quand: 0.09, vel: 0.06, duree: 1.6, echo: 0.2 });
  cristal(degre(14), { quand: 0.16, vel: 0.02, duree: 1, ornement: true });
}
/** L'ennemi se soigne : la même idée, plus grave et plus sombre */
export function sonSoinEnnemi(): void {
  onde(degre(-3), { vel: 0.07, duree: 1.2 });
  onde(degre(-1), { quand: 0.1, vel: 0.06, duree: 1.3 });
}

/** Écho : une note qui se répète dans la salle */
export function sonEcho(): void { cristal(degre(8), { vel: 0.08, duree: 1.5, echo: 0.65, salle: 0.5 }); }

/** Un ennemi se renforce : un grondement qui monte */
export function sonBoost(): void {
  grondement({ duree: 0.7, vel: 0.2 });
  souffle({ duree: 0.6, de: 200, vers: 900, vel: 0.05, q: 2 });
}

/** Un renfort surgit : de la poussière et un pas lourd */
export function sonRenfort(): void {
  souffle({ duree: 0.35, de: 300, vers: 1200, vel: 0.06 });
  choc(1, { sourd: true, quand: 0.08, vel: 0.6 });
}

/** Le gardien change de phase : le sol gronde, un accord sombre s'ouvre */
export function sonPhase(): void {
  grondement({ duree: 1.8, vel: 0.2 });
  choc(4, { sourd: true, vel: 0.9 });
  nappe([degre(-10), degre(-7), 349.23 / 2], { vel: 0.07, duree: 2.6, attaque: 0.6, clarte: 1100, salle: 0.8, plancher: 110 });
}

/** Fissure : la carapace craque */
export function sonFissure(): void {
  for (let i = 0; i < 4; i++) souffle({ duree: 0.025, de: 3500, vers: 2000, q: 3, vel: 0.07, quand: i * alea(0.02, 0.05), salle: 0.2 });
  cristal(degre(-1), { quand: 0.05, vel: 0.06, duree: 0.6, eclat: 3, rapport: 2.41 });
}

/** Désarmé : l'intention de l'ennemi est frappée, un tintement métallique */
export function sonDesarme(): void { cristal(degre(11), { vel: 0.06, duree: 0.5, eclat: 2.8, rapport: 1.41 }); }

/** Élan : un souffle qui monte */
export function sonElan(): void {
  souffle({ duree: 0.4, de: 400, vers: 3600, vel: 0.06 });
  cristal(degre(8), { quand: 0.22, vel: 0.04, duree: 0.8 });
}

/** Victoire : la gamme monte et se pose sur l'accord de ré, longuement */
export function sonVictoire(): void {
  [0, 2, 3, 5, 7].forEach((d, i) => cristal(degre(d + 3), { quand: i * 0.09, vel: 0.07, duree: 1.8, echo: 0.15, pan: -0.3 + i * 0.15 }));
  nappe([degre(0), degre(3), degre(6), degre(7)], { quand: 0.42, vel: 0.06, duree: 3, attaque: 0.35 });
}

/** Défaite : un accord mineur, grave, qui s'éteint sans bruit */
export function sonDefaite(): void {
  nappe([degre(-5), 174.61, degre(-2)], { vel: 0.06, duree: 3, attaque: 0.5, clarte: 900, salle: 0.8, plancher: 120 });
  [3, 2, 0].forEach((d, i) => onde(degre(d), { quand: 0.2 + i * 0.32, vel: 0.05, duree: 1.4 }));
}

/** Un Porteur tombe : un coup lourd, puis une note grave qui s'en va */
export function sonATerre(): void {
  choc(5, { sourd: true, vel: 1 });
  onde(degre(-5), { quand: 0.12, vel: 0.07, duree: 1.6, echo: 0 });
  nappe([degre(-10), degre(-7)], { quand: 0.1, vel: 0.05, duree: 1.6, attaque: 0.2, clarte: 700, plancher: 90 });
}
