// Relie tout : les gestes du joueur, l'horloge, le démarrage. La logique est dans src/app/, l'affichage dans src/ui/.

import './ui/feuilles';
import type { Entree } from './core/classements';
import * as J from './core/jeu';
import { montrer } from './ui/gains';
import { initInstallation } from './ui/installer';
import { initToucher, vibrer } from './ui/toucher';
import { loupe, loupePorteur } from './ui/vue';
import { loupeCarte } from './ui/district';
import { agir } from './app/actions/index';
import { clavier } from './app/clavier';
import { app, compteEtat, G, K, racine, reduit } from './app/etat';
import { brancherChaine } from './app/chaine';
import { battre } from './app/horloge';
import { afficher } from './app/rendu';
import { demarrerCompte, envoyer, sauver } from './app/synchro';

initToucher(racine, reduit);

// ---------- Les gestes du joueur ----------

racine.addEventListener('click', agir);
document.addEventListener('keydown', clavier);
racine.addEventListener('pointerdown', () => { if (K.verrou) app.rapide = true; });
racine.addEventListener('pointerdown', (ev) => { app.touche = { x: ev.clientX, y: ev.clientY }; }, true);
// le dernier contact ou défilement : le redessin automatique attend que le joueur ait fini
for (const t of ['touchstart', 'touchmove', 'pointerdown', 'wheel'] as const) racine.addEventListener(t, () => { app.dernierGeste = Date.now(); }, { passive: true, capture: true });
racine.addEventListener('scroll', () => { app.dernierGeste = Date.now(); }, { passive: true, capture: true });

/* appui prolongé sur une carte de combat : la loupe la montre en grand ; elle disparaît quand on lève le doigt, sans jouer la carte */
let appui: { el: HTMLElement; t: number; x: number; y: number } | null = null;
let annulerClic = false;
const fermerLoupe = () => document.querySelectorAll('.loupe').forEach((l) => l.remove());
const finAppui = () => { if (appui) { clearTimeout(appui.t); appui = null; } fermerLoupe(); };
racine.addEventListener('pointerdown', (ev) => {
  // une carte (son détail) ou une tuile de l'escouade (nom, lignée, PV, le coup qu'il va prendre)
  // au district : une carte proposée en récompense (lire son effet avant de la prendre)
  const el = app.mode === 'combat' ? (ev.target as HTMLElement).closest<HTMLElement>('.geste, .combattant')
    : (ev.target as HTMLElement).closest<HTMLElement>('.carte-choix[data-carte]');
  if (!el) return;
  annulerClic = false;
  appui = { el, x: ev.clientX, y: ev.clientY, t: window.setTimeout(() => {
    const html = el.dataset.carte ? loupeCarte(el.dataset.carte, app.jeu) : el.dataset.uid ? loupe(el.dataset.uid) : el.dataset.porteur ? loupePorteur(el.dataset.porteur) : null;
    if (!html) return;
    document.body.insertAdjacentHTML('beforeend', html);
    annulerClic = true;
    vibrer(8);
  }, 380) };
});
racine.addEventListener('pointermove', (ev) => { if (appui && Math.hypot(ev.clientX - appui.x, ev.clientY - appui.y) > 10) { clearTimeout(appui.t); appui = null; } });
for (const t of ['pointerup', 'pointercancel', 'pointerleave'] as const) racine.addEventListener(t, finAppui);
racine.addEventListener('contextmenu', (ev) => { if ((ev.target as HTMLElement).closest(app.mode === 'combat' ? '.geste, .combattant' : '.carte-choix[data-carte]')) ev.preventDefault(); });
racine.addEventListener('click', (ev) => { if (annulerClic) { annulerClic = false; ev.stopImmediatePropagation(); ev.preventDefault(); } }, true);

/* glisser une carte posée le long de la chaîne la change de place */
brancherChaine();

// ---------- Le temps qui passe ----------

setInterval(battre, 1000);
document.addEventListener('visibilitychange', () => {
  if (document.hidden) { void envoyer(); return; }
  J.tick(app.jeu, Date.now()); sauver(); if (app.mode === 'district') afficher();
});
addEventListener('pagehide', () => void envoyer());

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
  // pour régler un combat à la main (captures) : __combat(s => { s.flux = 3; })
  __combat: (f: (s: NonNullable<typeof app.jeu.expedition>['combat']) => void) => { const s = app.jeu.expedition?.combat; if (s) { f(s); afficher(); } },
  __tableau: (l: Entree[], moi: string) => { G.entrees = l; G.etat = 'ok'; G.lu = Date.now(); app.uid = moi; compteEtat.utilisateur = { nom: 'Essai' }; afficher(); },
});
