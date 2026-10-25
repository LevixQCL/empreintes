// Relie tout : les gestes du joueur, l'horloge, le démarrage. La logique est dans src/app/, l'affichage dans src/ui/.

import './ui/feuilles';
import type { Entree } from './core/classements';
import * as J from './core/jeu';
import { montrer } from './ui/gains';
import { initInstallation } from './ui/installer';
import { initToucher } from './ui/toucher';
import { agir } from './app/actions/index';
import { clavier } from './app/clavier';
import { app, compteEtat, G, K, racine, reduit } from './app/etat';
import { battre } from './app/horloge';
import { afficher } from './app/rendu';
import { demarrerCompte, sauver } from './app/synchro';

initToucher(racine, reduit);

// ---------- Les gestes du joueur ----------

racine.addEventListener('click', agir);
document.addEventListener('keydown', clavier);
racine.addEventListener('pointerdown', () => { if (K.verrou) app.rapide = true; });
racine.addEventListener('pointerdown', (ev) => { app.touche = { x: ev.clientX, y: ev.clientY }; }, true);
// le dernier contact ou défilement : le redessin automatique attend que le joueur ait fini
for (const t of ['touchstart', 'touchmove', 'pointerdown', 'wheel'] as const) racine.addEventListener(t, () => { app.dernierGeste = Date.now(); }, { passive: true, capture: true });
racine.addEventListener('scroll', () => { app.dernierGeste = Date.now(); }, { passive: true, capture: true });

/* appui long sur une carte de combat : montre son nom, sans la jouer */
let appui: { el: HTMLElement; t: number; x: number; y: number } | null = null;
let annulerClic = false;
const finAppui = () => { if (appui) { clearTimeout(appui.t); const el = appui.el; appui = null; setTimeout(() => el.classList.remove('nom-visible'), 1200); } };
racine.addEventListener('pointerdown', (ev) => {
  const el = (ev.target as HTMLElement).closest<HTMLElement>('.geste');
  if (!el || app.mode !== 'combat') return;
  annulerClic = false;
  appui = { el, x: ev.clientX, y: ev.clientY, t: window.setTimeout(() => { el.classList.add('nom-visible'); annulerClic = true; }, 450) };
});
racine.addEventListener('pointermove', (ev) => { if (appui && Math.hypot(ev.clientX - appui.x, ev.clientY - appui.y) > 10) { clearTimeout(appui.t); appui = null; } });
for (const t of ['pointerup', 'pointercancel', 'pointerleave'] as const) racine.addEventListener(t, finAppui);
racine.addEventListener('contextmenu', (ev) => { if (app.mode === 'combat' && (ev.target as HTMLElement).closest('.geste')) ev.preventDefault(); });
racine.addEventListener('click', (ev) => { if (annulerClic) { annulerClic = false; ev.stopImmediatePropagation(); ev.preventDefault(); } }, true);

// ---------- Le temps qui passe ----------

setInterval(battre, 1000);
document.addEventListener('visibilitychange', () => { if (!document.hidden) { J.tick(app.jeu, Date.now()); sauver(); if (app.mode === 'district') afficher(); } });

// ---------- Démarrage ----------

K.fin = null;
afficher();
demarrerCompte();
initInstallation(() => { if (app.mode === 'titre') afficher(); });
// pour essayer les gains à la main pendant le développement (absent du site publié)
if (import.meta.env.DEV) Object.assign(window, {
  __gains: { montrer },
  // pour voir le Grand Tableau sans compte : __tableau(entrées, ton uid)
  __pseudo: () => { G.edition = true; G.accueil = true; afficher(); },
  __tableau: (l: Entree[], moi: string) => { G.entrees = l; G.etat = 'ok'; G.lu = Date.now(); app.uid = moi; compteEtat.utilisateur = { nom: 'Essai' }; afficher(); },
});
