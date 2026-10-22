// La page teaser (teaser.html) : seulement l'intro du jeu, à partager.
// Écran titre → les 12 plans de l'intro → écran de fin (« Bientôt. », partager, revoir).
// Aucune sauvegarde, aucun compte, rien du jeu lui-même.

import './ui/styles.css';
import './ui/scenes.css';
import './ui/face-carte.css';
import './ui/holo.css';
import './ui/combat.css';
import './ui/cristal.css';
import './ui/bureau.css';
import { PLANS, htmlIntro } from './ui/intro';
import { animerCompteur, majIntro, precharger } from './ui/intro-lecteur';
import { htmlTitre } from './ui/titre';

const racine = document.getElementById('app') as HTMLElement;
const reduit = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

type Mode = 'titre' | 'intro' | 'fin';
let mode: Mode = 'titre';
let plan = 0;
let lignesVues = 1;
let texteCache = false;

function afficher() {
  const h = mode === 'intro' ? htmlIntro(plan, lignesVues, !reduit, texteCache) : htmlTitre(true, !reduit, mode === 'fin' ? 'fin' : 'teaser');
  racine.dataset.mode = mode === 'intro' ? 'intro' : 'titre';
  if (!(mode === 'intro' && majIntro(racine, h, reduit))) racine.innerHTML = h;
  if (mode === 'intro') { precharger(plan); precharger(plan + 1); animerCompteur(racine, lignesVues, reduit); }
}

function voir() { mode = 'intro'; plan = 0; lignesVues = 1; texteCache = false; }
function avancer(): boolean {
  if (lignesVues < PLANS[plan]!.lignes.length) { lignesVues++; return true; }
  if (plan < PLANS.length - 1) { plan++; lignesVues = 1; return true; }
  mode = 'fin';
  return true;
}
function reculer(): boolean {
  if (lignesVues > 1) { lignesVues--; return true; }
  if (plan > 0) { plan--; lignesVues = PLANS[plan]!.lignes.length; return true; }
  return false;
}

/** Partage natif sur téléphone ; sinon le lien est copié */
async function partager(bouton: HTMLElement) {
  const url = location.href.split('#')[0]!;
  const donnees = { title: 'EMPREINTES', text: '2121. La mer monte. Le passé dort en dessous.', url };
  if (navigator.share) {
    try { await navigator.share(donnees); } catch { /* partage annulé */ }
    return;
  }
  try {
    await navigator.clipboard.writeText(url);
    bouton.textContent = 'Lien copié';
  } catch {
    bouton.textContent = url;
  }
  window.setTimeout(() => { if (bouton.isConnected) bouton.textContent = 'Partager'; }, 2500);
}

racine.addEventListener('click', (ev) => {
  const b = (ev.target as HTMLElement).closest<HTMLElement>('[data-action]');
  if (!b) return;
  switch (b.dataset.action) {
    case 'teaser-voir': voir(); break;
    case 'teaser-partager': void partager(b); return;
    case 'intro-suivant': if (texteCache) texteCache = false; else avancer(); break;
    case 'intro-precedent': texteCache = false; reculer(); break;
    case 'intro-oeil': texteCache = !texteCache; break;
    case 'intro-passer': mode = 'fin'; break;
    default: return;
  }
  afficher();
});

document.addEventListener('keydown', (ev) => {
  if (ev.altKey || ev.ctrlKey || ev.metaKey) return;
  if (mode === 'titre' && (ev.key === 'Enter' || ev.key === ' ')) { ev.preventDefault(); voir(); afficher(); return; }
  if (mode !== 'intro') return;
  let change = false;
  if (ev.key === 'ArrowRight' || ev.key === ' ' || ev.key === 'PageDown') { ev.preventDefault(); if (texteCache) { texteCache = false; change = true; } else change = avancer(); }
  else if (ev.key === 'ArrowLeft' || ev.key === 'PageUp') { ev.preventDefault(); texteCache = false; change = reculer(); }
  else if (ev.key.toLowerCase() === 'h') { texteCache = !texteCache; change = true; }
  else if (ev.key === 'Escape') { mode = 'fin'; change = true; }
  if (change) afficher();
});

afficher();
precharger(0);
