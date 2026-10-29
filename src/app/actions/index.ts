// Un toucher sur un bouton [data-action] : chaque thème traite les siennes, puis l'écran se redessine et montre les gains.

import * as J from '../../core/jeu';
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
import { agirParrainage } from './parrainage';
import { signaler } from '../incident';

/** les gains reçus pendant « Ton district » (le kit des recrues, juste après la chambre) */
const gainsEnAttente: ReturnType<typeof comparer> = [];

const THEMES = [agirIntro, agirDistrict, agirCombat, agirTableau, agirParrainage, agirCompte];

/** Un toucher : une erreur dans une action ne fige plus tous les boutons (filet de sécurité du 29 octobre 2026) */
export async function agir(ev: MouseEvent) {
  try { await agirSansFilet(ev); } catch (e) { signaler(e, `bouton ${(ev.target as HTMLElement | null)?.closest<HTMLElement>('[data-action]')?.dataset.action ?? '?'}`, afficher); }
}

/** Le relevé des gains : s'il échoue, l'action se fait quand même, seuls les gains ne s'animent pas */
function releverSur(): ReturnType<typeof relever> | null {
  try { return relever(app.jeu); } catch (e) { signaler(e, 'gains', afficher); return null; }
}

async function agirSansFilet(ev: MouseEvent) {
  const b = (ev.target as HTMLElement).closest<HTMLElement>('[data-action]');
  if (!b || (b as HTMLButtonElement).disabled) return;
  const a = b.dataset.action;
  const id = b.dataset.id ?? '';
  const x = app.jeu.expedition;
  const s = x?.combat;
  // ce que le joueur reçoit grâce à cette action (comparé après le rendu, en bas de ce gestionnaire)
  const avantGains = releverSur();
  const depart = ev.detail === 0 ? centreDe(b) : app.touche;
  D.message = a === 'poster' || a === 'liberer' || a === 'fabriquer' || a === 'ameliorer' || a === 'greffer' || a === 'monter' || a === 'carte' || a === 'colis' || a === 'chapitre' ? D.message : '';
  // la fiche du directeur se referme dès qu'on fait autre chose (une récompense, un classement, la collection…)
  if (a !== 'fiche') D.fiche = false;
  const c: Clic = { b, ev, id, x, s, avantGains };
  let suite: Suite = 'inconnu';
  for (const theme of THEMES) {
    suite = await theme(a ?? '', c);
    if (suite !== 'inconnu') break;
  }
  // statistiques : l'usage de chaque bouton du jeu
  if (suite !== 'inconnu' && a) J.noterAction(app.jeu, a);
  if (suite !== 'afficher') return;
  afficher();
  // les gains de l'action : après le rendu, pour que les compteurs visés soient à l'écran
  // pendant « Ton district », ils attendent la fin des explications pour ne pas passer devant
  if (app.mode !== 'titre' && app.mode !== 'intro') {
    const apres = avantGains && releverSur();
    if (avantGains && apres) gainsEnAttente.push(...comparer(avantGains, apres));
    if (app.mode !== 'district' || D.vue !== 'accueil') montrer(gainsEnAttente.splice(0), depart);
  }
  // un nouvel onglet du guide s'ouvre en haut, pas à la hauteur de l'onglet d'avant
  if (a === 'guide') racine.querySelector('.guide-corps')?.scrollTo(0, 0);
}
