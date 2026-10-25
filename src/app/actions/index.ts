// Un toucher sur un bouton [data-action] : chaque thème traite les siennes, puis l'écran se redessine et montre les gains.

import { comparer, montrer, relever } from '../../ui/gains';
import { centreDe } from '../../ui/outils';
import { app, D, racine } from '../etat';
import { afficher } from '../rendu';
import { agirCombat } from './combat';
import type { Clic, Suite } from './commun';
import { agirCompte } from './compte';
import { agirDistrict } from './district';
import { agirIntro } from './intro';
import { agirTableau } from './tableau';

const THEMES = [agirIntro, agirDistrict, agirCombat, agirTableau, agirCompte];

export async function agir(ev: MouseEvent) {
  const b = (ev.target as HTMLElement).closest<HTMLElement>('[data-action]');
  if (!b || (b as HTMLButtonElement).disabled) return;
  const a = b.dataset.action;
  const id = b.dataset.id ?? '';
  const x = app.jeu.expedition;
  const s = x?.combat;
  // ce que le joueur reçoit grâce à cette action (comparé après le rendu, en bas de ce gestionnaire)
  const avantGains = relever(app.jeu);
  const depart = ev.detail === 0 ? centreDe(b) : app.touche;
  D.message = a === 'poster' || a === 'liberer' || a === 'fabriquer' || a === 'ameliorer' || a === 'choisir' || a === 'greffer' || a === 'monter' || a === 'carte' || a === 'colis' || a === 'chapitre' ? D.message : '';
  const c: Clic = { b, ev, id, x, s, avantGains };
  let suite: Suite = 'inconnu';
  for (const theme of THEMES) {
    suite = await theme(a ?? '', c);
    if (suite !== 'inconnu') break;
  }
  if (suite !== 'afficher') return;
  afficher();
  // les gains de l'action : après le rendu, pour que les compteurs visés soient à l'écran
  if (app.mode !== 'titre' && app.mode !== 'intro') montrer(comparer(avantGains, relever(app.jeu)), depart);
  // un nouvel onglet du guide s'ouvre en haut, pas à la hauteur de l'onglet d'avant
  if (a === 'guide') racine.querySelector('.guide-corps')?.scrollTo(0, 0);
}
