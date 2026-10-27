// Le clavier (PC) : Entrée sur l'écran titre, Échap pour fermer, flèches dans l'intro.

import { finPour } from './combat';
import { app, apresTitre, compteEtat, D, K, titrePret } from './etat';
import { avancerIntro, reculerIntro } from './intro';
import { afficher } from './rendu';

export function clavier(ev: KeyboardEvent) {
  if (app.mode === 'titre' && compteEtat.ouvert && ev.key === 'Escape') { compteEtat.ouvert = false; afficher(); return; }
  if (app.mode === 'titre' && !compteEtat.ouvert && titrePret() && (ev.key === 'Enter' || ev.key === ' ')) {
    ev.preventDefault(); app.mode = apresTitre(); if (app.mode === 'combat') K.fin = finPour(); afficher(); return;
  }
  if (ev.key === 'Escape') {
    if (app.mode === 'district' && D.deck && D.echange) { D.echange = null; afficher(); return; }
    if (app.mode === 'district' && (D.selection || D.carte || D.deck || D.menu || D.porteur || D.place != null)) { D.selection = null; D.carte = null; D.deck = null; D.menu = false; D.porteur = null; D.place = null; afficher(); return; }
    if (app.mode === 'combat' && K.journal) { K.journal = null; afficher(); return; }
    if (app.mode === 'combat' && K.regles) { K.regles = false; afficher(); return; }
  }
  if (app.mode !== 'intro' || ev.altKey || ev.ctrlKey || ev.metaKey) return;
  let change = false;
  if (ev.key === 'ArrowRight' || ev.key === ' ' || ev.key === 'PageDown') { ev.preventDefault(); if (app.texteCache) { app.texteCache = false; change = true; } else change = avancerIntro(); }
  else if (ev.key === 'ArrowLeft' || ev.key === 'PageUp') { ev.preventDefault(); app.texteCache = false; change = reculerIntro(); }
  else if (ev.key.toLowerCase() === 'h') { app.texteCache = !app.texteCache; change = true; }
  if (change) afficher();
}
