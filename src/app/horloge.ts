// Le temps qui passe : chaque seconde, la partie avance et les comptes à rebours du district se mettent à jour.

import * as J from '../core/jeu';
import { duree } from '../ui/coquille';
import { comparer, montrer, relever } from '../ui/gains';
import { app, compteEtat, D, racine } from './etat';
import { afficher } from './rendu';
import { sauver } from './synchro';

/**
 * Les comptes à rebours et les jauges de durée du district (decompte, jaugeTemps) avancent chaque seconde sans redessiner l'écran.
 * Renvoie vrai si l'un d'eux est arrivé au bout : l'écran doit alors changer (« Prête », « Sur le retour »…).
 */
function majDecomptes(now: number): boolean {
  let fini = false;
  racine.querySelectorAll<HTMLElement>('[data-fin]').forEach((el) => {
    const fin = Number(el.dataset.fin);
    if (now >= fin) fini = true;
    if (el.dataset.debut) {
      const debut = Number(el.dataset.debut);
      el.style.width = `${Math.min(1, (now - debut) / (fin - debut)) * 100}%`;
    } else el.textContent = (el.dataset.avant ?? '') + duree(fin - now) + (el.dataset.apres ?? '');
  });
  return fini;
}

/**
 * Annonce ce que le temps a rapporté. Les retours de mission ont leur propre rapport (fenêtre au district) :
 * le message en bas dit tout le reste, et plus seulement la première nouvelle du lot.
 */
export function annoncer(nouvelles: string[]) {
  if (!nouvelles.length) return;
  const autres = nouvelles.filter((t) => !t.includes(' rentre de mission'));
  if (autres.length) D.message = autres.join(' ');
  sauver();
}

/** Chaque seconde : la partie avance ; au district, les comptes à rebours bougent, et l'écran se redessine quand il le faut */
export function battre() {
  const now = Date.now();
  // l'état d'avant n'est relevé qu'au district : c'est le seul écran qui montre ce que le temps a rapporté
  const avantTick = app.mode === 'district' ? relever(app.jeu) : null;
  const nouvelles = J.tick(app.jeu, now);
  // statistiques : le temps compte quand l'écran est affiché et que le joueur a touché quelque chose depuis moins de 2 minutes
  const u = compteEtat.utilisateur;
  J.noterTemps(app.jeu, now, {
    actif: !document.hidden && now - app.dernierGeste < 120_000,
    appareil: matchMedia('(min-width: 1100px)').matches ? 'pc' : 'telephone',
    compte: !u ? 'aucun' : u.anonyme ? 'invisible' : 'protege',
  });
  annoncer(nouvelles);
  if (app.mode !== 'district') return;
  const fini = majDecomptes(now);
  if (nouvelles.length > 0 || fini || now - app.dernierRendu > 15_000) {
    app.dernierRendu = Date.now();
    // ne pas redessiner pendant que le joueur tape dans le panneau Compte, ni pendant qu'il fait défiler une liste
    // (un redessin en plein glissement couperait le geste et ramènerait la liste au début)
    if (document.activeElement?.tagName !== 'INPUT' && Date.now() - app.dernierGeste > 2500) {
      afficher();
      // la Forge qui livre, une mission qui rentre, un Porteur qui arrive : sans la production d'énergie, qui coule toute seule
      if (nouvelles.length && avantTick) montrer(comparer(avantTick, relever(app.jeu), { energie: false }));
    }
  }
}
