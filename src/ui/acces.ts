// Ce que le reste du jeu demande aux écrans Pillages, Flèche et Cercle (8 novembre 2026) : leurs portes d'entrée
// et petites pièces. Les écrans eux-mêmes (pillages.ts, fleche.ts, cercle.ts) ne partent plus au démarrage :
// ils arrivent quand on les ouvre (app/differes.ts). Rien de lourd ici, et rien qui importe ces écrans.

import { ennemiDef } from '../core/donnees';
import { PILLAGE, pillagesPermis, ciblesDuJour, escouadePourDepart, faitsDuJour, forceEscouade, strateVaincue, type Cible, type Jeu } from '../core/jeu';
import { illustrationEnnemi } from './art';
import type { CercleEcran } from './cercle';
import { COULEUR } from './vue';

/** Les archipels de la carte et ce qu'il faut pour les afficher */
export function cartePillages(j: Jeu, now: number, enLigne: Cible[] = [], monId = 'moi') {
  const escouade = escouadePourDepart(j);
  const cibles = ciblesDuJour(j, escouade, now, enLigne, monId);
  return { escouade, cibles, force: forceEscouade(j, escouade), faits: faitsDuJour(j, now) };
}

/** Le Port est ouvert : la Strate −1 est vaincue, le bateau peut quitter le ponton */
export const portOuvert = (j: Jeu) => j.chambre && strateVaincue(j) >= PILLAGE.strateDuPort;
/** Les pillages (2 novembre 2026) : après le gardien de −4 depuis le 12 novembre 2026 ; avant, le Port ne sert qu'aux missions et aux marées */
export const pillagesOuverts = (j: Jeu) => j.chambre && pillagesPermis(j);

/** Le visage rond d'un garde de la Flèche (même gabarit que l'avatar d'un Porteur) */
export function visageGarde(id: string, taille = 40): string {
  const img = illustrationEnnemi(id);
  return `<span class="avatar garde-fleche" style="--c:${COULEUR[ennemiDef(id).lignee]};--t:${taille}px" aria-hidden="true">${img ? `<img src="${img}" alt="" decoding="async" loading="lazy">` : ''}</span>`;
}

export const cercleVide = (): CercleEcran => ({
  reseau: 'hors-ligne', amis: [], demandes: [], recues: [], envoyees: [], defisRecus: [], defisEnvoyes: [], aRepondre: 0,
  onglet: 'amis', ami: null, choix: null, filtreMetal: 'argent', filtreLignee: 'tout', echange: null, mode: 'libre', occupe: false, message: '', aide: false,
});
