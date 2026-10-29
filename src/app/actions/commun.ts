// Ce que partagent les actions de chaque thème.

import * as J from '../../core/jeu';
import type { Jeu } from '../../core/jeu';
import type { EcranDistrict } from '../../ui/district';
import type { relever } from '../../ui/gains';
import { D } from '../etat';
import { sauver } from '../synchro';

/** change d'onglet : ferme ce qui était ouvert et remonte en haut */
export function ouvrir(v: EcranDistrict['vue']) {
  if (D.vue !== v) window.scrollTo(0, 0);
  D.vue = v; D.selection = null; D.carte = null; D.deck = null; D.menu = false; D.fiche = false; D.guide = null; D.porteur = null; D.place = null;
  if (v === 'porteurs') D.reserve = false;
  else D.retourModif = null;
}

export const resultat = (r: J.Resultat) => { D.message = r.ok ? '' : r.message ?? ''; if (r.ok) sauver(); };

/** Ce que chaque thème reçoit d'un toucher sur un bouton [data-action] */
export interface Clic {
  b: HTMLElement;
  ev: MouseEvent;
  id: string;
  x: Jeu['expedition'];
  s: NonNullable<Jeu['expedition']>['combat'] | undefined;
  /** l'état d'avant l'action, pour montrer les gains */
  avantGains: ReturnType<typeof relever> | null;
}

/** afficher : redessiner et montrer les gains ; fin : tout est déjà fait ; inconnu : ce n'est pas une action de ce thème */
export type Suite = 'afficher' | 'fin' | 'inconnu';
