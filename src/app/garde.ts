// La garde de la sauvegarde, côté application (2 novembre 2026) : quand la partie risque d'en écraser une autre,
// le jeu arrête d'écrire et le dit au joueur, avec un seul bouton : recharger.
// Après le rechargement, la partie la plus avancée est reprise et l'autre est gardée en secours : rien n'est perdu.

export type Raison = 'version' | 'onglet' | 'appareil' | 'illisible' | 'illisible-compte';

import { mettreDeCoteIllisible } from '../save/local';
import { t as tr } from '../core/i18n';

let raison: Raison | null = null;

/** Le jeu n'écrit plus rien (ni sur l'appareil, ni sur le compte) tant que la fenêtre est ouverte */
export const sauvegardeBloquee = (): boolean => raison !== null || suspendue;

/** Une suppression du compte en cours (8 novembre 2026) : on n'écrit plus rien, sans fenêtre */
let suspendue = false;
export function suspendreSauvegarde(): void { suspendue = true; }
export function reprendreSauvegarde(): void { suspendue = false; }

const TEXTES: Record<Raison, { titre: string; texte: string }> = {
  version: {
    titre: tr('Une nouvelle version t’attend'),
    texte: tr('Ta partie a été jouée avec une version plus récente du jeu. Recharge la page pour la retrouver : rien n’est perdu.'),
  },
  onglet: {
    titre: tr('Ta partie est ouverte ailleurs'),
    texte: tr('Tu joues dans un autre onglet ou une autre fenêtre. Pour ne rien écraser, cette page s’arrête là : recharge-la pour reprendre où tu en es.'),
  },
  illisible: {
    titre: tr('Ta partie est à l’abri'),
    texte: tr('Cette version du jeu n’arrive pas à lire la partie de cet appareil (souvent juste après une mise à jour). Pour ne rien effacer, le jeu s’arrête là. Recharge dans quelques minutes : une correction arrive en général très vite.'),
  },
  'illisible-compte': {
    titre: tr('Ta partie est à l’abri'),
    texte: tr('Cette version du jeu n’arrive pas à lire la partie de ton compte (souvent juste après une mise à jour). Pour ne rien écraser, le jeu s’arrête là. Recharge dans quelques minutes : une correction arrive en général très vite.'),
  },
  appareil: {
    titre: tr('Ta partie a avancé ailleurs'),
    texte: tr('Ton compte a été utilisé sur un autre appareil. Recharge pour reprendre la partie la plus avancée : l’autre sera gardée en secours.'),
  },
};

/** Arrête toute écriture et affiche la fenêtre (une seule, même si plusieurs causes arrivent) */
export function bloquerSauvegarde(r: Raison): void {
  if (raison) return;
  raison = r;
  if (typeof document === 'undefined') return;
  const t = TEXTES[r];
  const el = document.createElement('div');
  el.className = 'incident';
  el.setAttribute('role', 'alertdialog');
  el.setAttribute('aria-modal', 'true');
  el.innerHTML = `<div class="incident-carte"><h2>${t.titre}</h2><p>${t.texte}</p>`
    + `<div class="incident-btns"><button type="button" class="prim" data-i="recharger">${tr`Recharger`}</button></div>`
    // la partie de l'appareil, illisible : en dernier recours, la mettre de côté (jamais effacée) et repartir, après confirmation
    + (r === 'illisible' ? `<details class="incident-recours"><summary>${tr`Repartir de zéro`}</summary><p>${tr`La partie illisible reste gardée à part sur cet appareil : une prochaine version pourra la rendre.`}</p><button type="button" data-i="cote">${tr`Mettre ma partie de côté et recommencer`}</button></details>` : '')
    + `</div>`;
  el.querySelector('[data-i="recharger"]')?.addEventListener('click', () => location.reload());
  el.querySelector('[data-i="cote"]')?.addEventListener('click', () => { mettreDeCoteIllisible(); location.reload(); });
  document.body.appendChild(el);
}
