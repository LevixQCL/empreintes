// Le banc d'équilibrage (equilibrage.html, 12 novembre 2026) : une page à part, jamais chargée par le jeu, qui fait tourner le robot
// dans le navigateur, sur tous les cœurs du processeur, et signale les cartes qui sortent du lot. Bryan s'en sert seul, sans Claude.
// Les mesures restent dans ce navigateur (localStorage) : une mesure n'est refaite que si la carte ou les réglages du jeu ont changé.

import '../analyse/analyse.css';
import './equilibrage.css';
import { NOMS_RARETE } from '../core/collection';
import { NOMS_LIGNEE, moduleDef } from '../core/donnees';
import { NOMS_EFFET } from '../core/effets';
import type { Lignee, Rarete } from '../core/types';
import { echap } from '../ui/outils';
import {
  MODES, STRATE_BANC, SEUILS, bruit, empreinteCarte, empreinteReglages, escouadeBanc, estSpeciale, moyennes, rapportTexte, tableau,
  type LigneBanc, type Mesure, type Mode,
} from './banc';
import type { Paquet, Reponse } from './travailleur';

const CLE = 'ossyra-banc';
const REGLAGES = empreinteReglages();
const racine = document.getElementById('banc') as HTMLElement;

// ---------- Ce que la page garde ----------
interface Memoire {
  mode: Mode;
  /** la force des ennemis réglée pour que le deck de départ gagne une descente sur deux */
  facteur?: { reglages: string; valeur: number };
  /** la part de victoires du deck de départ, par réglages, facteur et nombre de descentes */
  bases: Record<string, number>;
  mesures: Record<string, Mesure>;
}
function lire(): Memoire {
  try {
    const m = JSON.parse(localStorage.getItem(CLE) ?? 'null') as Memoire | null;
    if (m && m.mesures) return { mode: m.mode in MODES ? m.mode : 'normal', bases: m.bases ?? {}, mesures: m.mesures, ...(m.facteur ? { facteur: m.facteur } : {}) };
  } catch { /* mémoire illisible : on repart de zéro */ }
  return { mode: 'normal', bases: {}, mesures: {} };
}
const mem = lire();
function garder() { try { localStorage.setItem(CLE, JSON.stringify(mem)); } catch { /* stockage plein ou refusé : les mesures restent pour cette visite */ } }

// ---------- Les travailleurs (un par cœur, moins un pour garder l'écran fluide) ----------
const NB = Math.max(1, Math.min(12, (navigator.hardwareConcurrency || 2) - 1));
let travailleurs: Worker[] = [];
let attente = new Map<number, (r: Reponse) => void>();
let compteur = 0;
/** ms par descente et par cœur, mesurées en route : pour le temps restant */
let msParPartie = 0;

function demarrer() {
  if (travailleurs.length) return;
  travailleurs = Array.from({ length: NB }, () => {
    const w = new Worker(new URL('./travailleur.ts', import.meta.url), { type: 'module' });
    w.onmessage = (ev: MessageEvent<Reponse>) => { const f = attente.get(ev.data.n); attente.delete(ev.data.n); f?.(ev.data); };
    return w;
  });
}
function arreterTravailleurs() {
  for (const w of travailleurs) w.terminate();
  travailleurs = [];
  for (const f of attente.values()) f({ n: -1, victoires: 0, parties: 0, ms: 0, erreur: 'arrêt' });
  attente = new Map();
}

/** Joue `parties` descentes réparties entre les travailleurs ; mêmes graines pour toutes les escouades (comparaison juste) */
async function taux(escouade: ReturnType<typeof escouadeBanc>, parties: number, facteur: number, avance?: (fait: number) => void): Promise<number> {
  demarrer();
  const TAILLE = 5;
  const paquets: Paquet[] = [];
  for (let i = 0; i < parties; i += TAILLE) {
    paquets.push({ n: ++compteur, escouade, strate: STRATE_BANC, parties: Math.min(TAILLE, parties - i), graine: 1 + i * 7919, facteur });
  }
  let v = 0, fait = 0, suivant = 0;
  await Promise.all(travailleurs.map(async (w) => {
    while (suivant < paquets.length && run.actif) {
      const p = paquets[suivant++]!;
      const r = await new Promise<Reponse>((ok) => { attente.set(p.n, ok); w.postMessage(p); });
      if (r.erreur) { if (r.erreur !== 'arrêt') throw new Error(r.erreur); return; }
      v += r.victoires; fait += r.parties;
      msParPartie = msParPartie ? msParPartie * 0.9 + (r.ms / r.parties) * 0.1 : r.ms / r.parties;
      avance?.(fait);
    }
  }));
  if (!run.actif) throw new Error('arrêt');
  return v / parties;
}

// ---------- La campagne de mesures ----------
interface Run { actif: boolean; etape: string; fait: number; total: number; carte: string; erreur: string; debut: number }
const run: Run = { actif: false, etape: '', fait: 0, total: 0, carte: '', erreur: '', debut: 0 };
let verrou: { release: () => Promise<void> } | null = null;

async function garderEcranAllume(oui: boolean) {
  try {
    if (oui) verrou = await (navigator as Navigator & { wakeLock?: { request: (t: 'screen') => Promise<{ release: () => Promise<void> }> } }).wakeLock?.request('screen') ?? null;
    else { await verrou?.release(); verrou = null; }
  } catch { /* pas de verrou d'écran : tant pis, la mesure continue tant que la page reste ouverte */ }
}

/** Règle la force des ennemis pour que le deck de départ gagne une descente sur deux (fait une fois par réglages du jeu) */
async function facteur(): Promise<number> {
  if (mem.facteur?.reglages === REGLAGES) return mem.facteur.valeur;
  const N = 100, PAS = 7;
  let bas = 0.6, haut = 1.5;
  for (let i = 0; i < PAS; i++) {
    const m = (bas + haut) / 2;
    run.etape = `Réglage de la mesure (${i + 1}/${PAS})`;
    rendre();
    const t = await taux(escouadeBanc(), N, m, (f) => { run.fait = i * N + f; majProgres(); });
    if (t > 0.5) bas = m; else haut = m;
  }
  const valeur = Math.round(((bas + haut) / 2) * 100) / 100;
  mem.facteur = { reglages: REGLAGES, valeur };
  garder();
  return valeur;
}

async function base(f: number, parties: number): Promise<number> {
  const k = `${REGLAGES}|${f}|${parties}`;
  if (mem.bases[k] !== undefined) return mem.bases[k]!;
  run.etape = 'Le deck de départ';
  run.carte = '';
  rendre();
  const t0 = run.fait;
  const b = await taux(escouadeBanc(), parties, f, (x) => { run.fait = t0 + x; majProgres(); });
  // on ne garde que les bases des réglages d'aujourd'hui
  for (const cle of Object.keys(mem.bases)) if (!cle.startsWith(REGLAGES)) delete mem.bases[cle];
  mem.bases[k] = b;
  garder();
  return b;
}

async function mesurer(ids: string[]) {
  if (run.actif || !ids.length) return;
  const parties = MODES[mem.mode].parties;
  Object.assign(run, { actif: true, fait: 0, erreur: '', debut: Date.now(), carte: '' });
  const reglageAFaire = mem.facteur?.reglages !== REGLAGES;
  run.total = (reglageAFaire ? 700 : 0) + parties * (ids.length + 1);
  await garderEcranAllume(true);
  rendre();
  try {
    const f = await facteur();
    run.fait = reglageAFaire ? 700 : 0;
    const b = await base(f, parties);
    for (const [i, id] of ids.entries()) {
      run.etape = `Carte ${i + 1} sur ${ids.length}`;
      run.carte = id;
      rendre();
      const t0 = run.fait;
      const t = await taux(escouadeBanc(id), parties, f, (x) => { run.fait = t0 + x; majProgres(); });
      mem.mesures[id] = { points: Math.round((t - b) * 100), parties, reglages: REGLAGES, carte: empreinteCarte(id), date: Date.now() };
      garder();
      run.fait = t0 + parties;
    }
  } catch (e) {
    if (String(e) !== 'Error: arrêt') run.erreur = String(e);
  } finally {
    run.actif = false;
    arreterTravailleurs();
    await garderEcranAllume(false);
    rendre();
  }
}

function arreter() { run.actif = false; arreterTravailleurs(); }

// ---------- Affichage ----------
type Filtre = 'toutes' | 'signalees' | 'amesurer';
const vue = { filtre: 'toutes' as Filtre, metal: '' as Rarete | '', lignee: '' as Lignee | '', choix: new Set<string>(), copie: '' };

const signe = (x: number) => `${x >= 0 ? '+' : '−'}${Math.abs(Math.round(x))}`;
const duree = (ms: number) => {
  const s = Math.round(ms / 1000);
  if (s < 60) return `${s} s`;
  const m = Math.round(s / 60);
  return m < 60 ? `${m} min` : `${Math.floor(m / 60)} h ${String(m % 60).padStart(2, '0')}`;
};
const nomCarte = (id: string) => moduleDef(id).nom;

const VERDICT: Record<LigneBanc['verdict'], { mot: string; classe: string }> = {
  forte: { mot: '▲ Trop forte', classe: 'forte' },
  faible: { mot: '▼ Trop faible', classe: 'faible' },
  ok: { mot: '✓ Dans la norme', classe: 'ok' },
  seule: { mot: '… À comparer', classe: 'seule' },
  perimee: { mot: '↻ À remesurer', classe: 'perimee' },
  aucune: { mot: '· Pas mesurée', classe: 'aucune' },
};
const ORDRE: Record<LigneBanc['verdict'], number> = { forte: 0, faible: 1, perimee: 2, seule: 3, ok: 3, aucune: 4 };

function lignesFiltrees(lignes: LigneBanc[]): LigneBanc[] {
  return lignes
    .filter((l) => (vue.filtre === 'signalees' ? l.verdict === 'forte' || l.verdict === 'faible' : vue.filtre === 'amesurer' ? l.verdict === 'aucune' || l.verdict === 'perimee' : true))
    .filter((l) => !vue.metal || l.metal === vue.metal)
    .filter((l) => !vue.lignee || l.m.lignee === vue.lignee)
    .sort((a, b) => ORDRE[a.verdict] - ORDRE[b.verdict] || (b.mesure?.points ?? -999) - (a.mesure?.points ?? -999) || a.m.nom.localeCompare(b.m.nom, 'fr'));
}

function majProgres() {
  const barre = racine.querySelector<HTMLElement>('.bc-progres i');
  const txt = racine.querySelector<HTMLElement>('.bc-reste');
  if (!barre || !txt) return;
  const p = run.total ? run.fait / run.total : 0;
  barre.style.width = `${Math.round(p * 100)}%`;
  const reste = msParPartie ? ((run.total - run.fait) * msParPartie) / NB : 0;
  txt.textContent = reste ? `encore ≈ ${duree(reste)}` : 'calcul de la durée…';
}

function rendre() {
  const lignes = tableau(mem.mesures, REGLAGES);
  const aJourN = lignes.filter((l) => l.verdict !== 'aucune' && l.verdict !== 'perimee').length;
  const fortes = lignes.filter((l) => l.verdict === 'forte').length, faibles = lignes.filter((l) => l.verdict === 'faible').length;
  const amesurer = lignes.filter((l) => l.verdict === 'aucune' || l.verdict === 'perimee').map((l) => l.m.id);
  const f = mem.facteur?.reglages === REGLAGES ? mem.facteur.valeur : null;
  const b = f !== null ? mem.bases[`${REGLAGES}|${f}|${MODES[mem.mode].parties}`] : undefined;
  const choix = [...vue.choix].filter((id) => lignes.some((l) => l.m.id === id));
  const visibles = lignesFiltrees(lignes);
  const parties = MODES[mem.mode].parties;
  // estimation de durée avant de lancer : 0,4 s par descente et par cœur si on ne sait pas encore
  const estimer = (n: number) => duree((((f === null ? 700 : 0) + parties * (n + 1)) * (msParPartie || 400)) / NB);

  racine.innerHTML = `
  <header class="an-tete">
    <div><div class="an-sur">OSSYRA · OUTIL</div><h1>Banc d’équilibrage</h1></div>
  </header>
  <div class="an-tuiles">
    <div class="an-tuile"><span>Mesurées</span><b>${aJourN}<small> / ${lignes.length}</small></b><small>sur les réglages du jeu actuels</small></div>
    <div class="an-tuile"><span>Trop fortes</span><b>${fortes}</b><small>à revoir en premier</small></div>
    <div class="an-tuile"><span>Trop faibles</span><b>${faibles}</b><small>cartes qu’on ne jouera pas</small></div>
    <div class="an-tuile"><span>Deck de départ</span><b>${b !== undefined ? Math.round(b * 100) + ' %' : '—'}</b><small>${f !== null ? `Strate −${STRATE_BANC}, ennemis ×${f.toFixed(2)}` : 'réglé à la première mesure'}</small></div>
  </div>

  <section class="an-bloc">
    <h3>Lancer le robot</h3>
    <p class="an-aide">Chaque carte prend la place de la carte de départ de sa lignée et l’escouade descend ${parties} fois la Strate −${STRATE_BANC}. ${NB} cœur${NB > 1 ? 's' : ''} de cet appareil au travail. Laisse la page ouverte : chaque carte finie est gardée, tu peux arrêter et reprendre.</p>
    ${run.actif ? `
      <div class="bc-cours">
        <div class="bc-ligne"><b>${echap(run.etape)}</b>${run.carte ? `<span>${echap(nomCarte(run.carte))}</span>` : ''}<span class="bc-reste"></span></div>
        <div class="bc-progres" role="progressbar" aria-label="Avancement"><i></i></div>
        <button class="an-btn" data-action="arreter">Arrêter</button>
      </div>` : `
      <div class="bc-modes" role="radiogroup" aria-label="Précision">
        ${(Object.keys(MODES) as Mode[]).map((m) => `<button role="radio" aria-checked="${mem.mode === m}" class="bc-mode${mem.mode === m ? ' actif' : ''}" data-mode="${m}"><b>${MODES[m].nom}</b><small>${MODES[m].parties} descentes · ±${bruit(MODES[m].parties)} pts</small></button>`).join('')}
      </div>
      <div class="an-actions bc-lancer">
        <button class="an-btn prim" data-action="manquantes" ${amesurer.length ? '' : 'disabled'}>Mesurer ce qui manque (${amesurer.length}) · ≈ ${estimer(amesurer.length)}</button>
        <button class="an-btn" data-action="choix" ${choix.length ? '' : 'disabled'}>Mesurer la sélection (${choix.length})${choix.length ? ` · ≈ ${estimer(choix.length)}` : ''}</button>
        <button class="an-btn" data-action="tout">Tout remesurer · ≈ ${estimer(lignes.length)}</button>
      </div>
      ${run.erreur ? `<p class="bc-erreur">La mesure s’est arrêtée : ${echap(run.erreur)}</p>` : ''}`}
  </section>

  <section class="an-bloc">
    <h3>Le rapport</h3>
    <p class="an-aide">Un résumé court des cartes signalées, à garder ou à coller dans une conversation.</p>
    <div class="an-actions">
      <button class="an-btn prim" data-action="copier">${vue.copie || 'Copier le rapport'}</button>
      <button class="an-btn" data-action="effacer" ${Object.keys(mem.mesures).length ? '' : 'disabled'}>Effacer toutes les mesures</button>
    </div>
    <p class="an-pied">Les mesures restent dans ce navigateur. Une carte modifiée dans le jeu, ou un changement des ennemis, des règles ou du deck de départ, la fait passer « à remesurer ». Le robot joue bien : un vrai joueur gagne moins souvent, mais les écarts entre cartes restent parlants.</p>
  </section>

  <section class="an-bloc">
    <h3>Les cartes</h3>
    <p class="an-aide">Points de victoire par rapport au deck de départ : +10 = une descente gagnée de plus sur dix. Une carte est signalée si elle s’écarte de plus de ${SEUILS.ecart} points de la moyenne de son métal, ou bat la moyenne du métal au-dessus (Héritage, origine et parrainage : tolérance doublée). « Estimation » = calcul sans simulation, pour repérer une force mal réglée avant de lancer le robot.</p>
    <div class="bc-moyennes">${moyennes(lignes).map((x) => `<span class="bc-metal m-${x.metal}">${NOMS_RARETE[x.metal]} <b>${x.n ? signe(x.moyenne) : '—'}</b><small>${x.n} carte${x.n > 1 ? 's' : ''}</small></span>`).join('')}</div>
    <div class="an-barre-outils">
      <div class="bc-filtres" role="tablist">
        ${(['toutes', 'signalees', 'amesurer'] as Filtre[]).map((x) => `<button role="tab" aria-selected="${vue.filtre === x}" data-filtre="${x}">${{ toutes: 'Toutes', signalees: `Signalées (${fortes + faibles})`, amesurer: `À mesurer (${amesurer.length})` }[x]}</button>`).join('')}
      </div>
      <label>Métal<select data-select="metal"><option value="">Tous</option>${(['cuivre', 'argent', 'or', 'nacre'] as Rarete[]).map((r) => `<option value="${r}" ${vue.metal === r ? 'selected' : ''}>${NOMS_RARETE[r]}${r === 'cuivre' ? ' (et fer)' : ''}</option>`).join('')}</select></label>
      <label>Lignée<select data-select="lignee"><option value="">Toutes</option>${(['tech', 'bio', 'reso'] as Lignee[]).map((l) => `<option value="${l}" ${vue.lignee === l ? 'selected' : ''}>${NOMS_LIGNEE[l].nom}s</option>`).join('')}</select></label>
      <button class="an-btn bc-petit" data-action="cocher">${visibles.length && visibles.every((l) => vue.choix.has(l.m.id)) ? 'Tout décocher' : 'Tout cocher'}</button>
    </div>
    <ul class="bc-liste">
      ${visibles.map((l) => ligne(l)).join('') || '<li class="an-vide">Aucune carte dans ce filtre.</li>'}
    </ul>
  </section>`;
  majProgres();
}

function ligne(l: LigneBanc): string {
  const v = VERDICT[l.verdict];
  const effet = l.m.effet ? NOMS_EFFET[l.m.effet.type] : '';
  const effet2 = l.m.effet2 ? ` + ${NOMS_EFFET[l.m.effet2.type]}` : '';
  const type = { atk: 'attaque', bouclier: 'bouclier', soin: 'soin' }[l.m.type];
  const speciale = estSpeciale(l.m) ? ` · ${l.m.legs ? 'Héritage' : l.m.origine ? 'origine' : 'parrainage'}` : '';
  const est = Math.abs(l.ecartEstimation) >= SEUILS.estimation;
  const pts = l.mesure ? `<b class="bc-pts">${signe(l.mesure.points)}</b><small>±${bruit(l.mesure.parties)}</small>` : '<b class="bc-pts vide">—</b>';
  return `<li class="bc-carte ${v.classe}">
    <label class="bc-coche"><input type="checkbox" data-coche="${l.m.id}" ${vue.choix.has(l.m.id) ? 'checked' : ''} aria-label="Choisir ${echap(l.m.nom)}"></label>
    <div class="bc-nom">
      <b>${echap(l.m.nom)}</b>
      <small>${NOMS_RARETE[l.m.rarete]}${l.m.rarete === 'fer' ? ' (mesurée en cuivre)' : ''} · ${NOMS_LIGNEE[l.m.lignee].nom} · ${type} ${l.m.v}${l.m.lourd ? ' · lourde' : ''}${effet ? ` · ${echap(effet + effet2)}` : ''}${speciale}</small>
      <small class="${est ? 'bc-est' : ''}">Estimation ${l.estimation} (${l.ecartEstimation >= 0 ? '+' : '−'}${Math.abs(l.ecartEstimation)} % du ${NOMS_RARETE[l.metal].toLowerCase()})${est ? ' — à regarder' : ''}</small>
    </div>
    <div class="bc-mesure">${pts}</div>
    <div class="bc-verdict"><span>${v.mot}</span>${l.raison ? `<small>${echap(l.raison)}</small>` : ''}</div>
  </li>`;
}

// ---------- Les gestes ----------
racine.addEventListener('click', (ev) => {
  const el = (ev.target as HTMLElement).closest<HTMLElement>('[data-action],[data-mode],[data-filtre]');
  if (!el) return;
  if (el.dataset.mode) { mem.mode = el.dataset.mode as Mode; garder(); rendre(); return; }
  if (el.dataset.filtre) { vue.filtre = el.dataset.filtre as Filtre; rendre(); return; }
  const lignes = tableau(mem.mesures, REGLAGES);
  switch (el.dataset.action) {
    case 'arreter': arreter(); break;
    case 'manquantes': void mesurer(lignes.filter((l) => l.verdict === 'aucune' || l.verdict === 'perimee').map((l) => l.m.id)); break;
    case 'choix': void mesurer([...vue.choix]); break;
    case 'tout': if (confirm(`Remesurer les ${lignes.length} cartes ?`)) void mesurer(lignes.map((l) => l.m.id)); break;
    case 'cocher': {
      const vis = lignesFiltrees(lignes);
      const tous = vis.every((l) => vue.choix.has(l.m.id));
      for (const l of vis) { if (tous) vue.choix.delete(l.m.id); else vue.choix.add(l.m.id); }
      rendre();
      break;
    }
    case 'copier': {
      const f = mem.facteur?.reglages === REGLAGES ? mem.facteur.valeur : 1;
      const b = mem.bases[`${REGLAGES}|${f}|${MODES[mem.mode].parties}`] ?? null;
      const t = rapportTexte(lignes, f, b);
      navigator.clipboard?.writeText(t).then(() => { vue.copie = 'Copié ✓'; rendre(); setTimeout(() => { vue.copie = ''; rendre(); }, 2000); }, () => prompt('Copie ce rapport :', t));
      break;
    }
    case 'effacer': if (confirm('Effacer toutes les mesures gardées dans ce navigateur ?')) { mem.mesures = {}; mem.bases = {}; delete mem.facteur; garder(); rendre(); } break;
  }
});
racine.addEventListener('change', (ev) => {
  const el = ev.target as HTMLInputElement | HTMLSelectElement;
  if (el instanceof HTMLInputElement && el.dataset.coche) { if (el.checked) vue.choix.add(el.dataset.coche); else vue.choix.delete(el.dataset.coche); rendre(); return; }
  if (el.dataset.select === 'metal') vue.metal = el.value as Rarete | '';
  if (el.dataset.select === 'lignee') vue.lignee = el.value as Lignee | '';
  rendre();
});
// prévenir avant de fermer la page pendant une mesure
addEventListener('beforeunload', (ev) => { if (run.actif) ev.preventDefault(); });

rendre();
