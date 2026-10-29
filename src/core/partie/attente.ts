// Ce qui attend le joueur (29 octobre 2026) : les récompenses prêtes à récupérer, d'où qu'il soit.
// La fiche du directeur les liste en tête ; le cristal du rail (PC) et le médaillon de la barre du haut (téléphone)
// s'allument quand l'une d'elles compte vraiment. Rien n'est récupéré tout seul : chaque gain garde son moment.

import { quotidienFait } from './district';
import type { Jeu } from './etat';
import { objectifCourant } from './objectifs';
import { colisAvantChoix, colisDisponible } from './recompenses';

export type AttenteId = 'guide' | 'jour' | 'butin' | 'colis';

export interface Attente {
  id: AttenteId;
  /**
   * une attente « importante » allume le cristal ; un colis ordinaire non (il revient chaque jour :
   * le cristal serait presque toujours allumé et ne voudrait plus rien dire). Le colis qui contient
   * une carte au choix, lui, compte.
   */
  important: boolean;
}

/** Les récompenses prêtes, dans l'ordre où la fiche les montre */
export function enAttente(j: Jeu): Attente[] {
  const r: Attente[] = [];
  const o = objectifCourant(j);
  if (o && o.fait(j)) r.push({ id: 'guide', important: true });
  if (quotidienFait(j)) r.push({ id: 'jour', important: true });
  // le Butin attend la fin des objectifs guidés, comme au district
  if (j.archive.aOuvrir && !o) r.push({ id: 'butin', important: true });
  if (colisDisponible(j)) r.push({ id: 'colis', important: colisAvantChoix(j) === 1 });
  return r;
}

/** Une récompense importante attend : le cristal s'allume */
export const appelDuCristal = (j: Jeu): boolean => enAttente(j).some((a) => a.important);
