// Le filet de sécurité (29 octobre 2026, après la partie de Luc bloquée sur « Reprendre ») :
// une erreur dans un bouton ou dans l'affichage ne doit plus jamais figer le jeu sans rien dire.
// - le joueur voit une petite fenêtre qui l'explique, avec un bouton pour revenir au district ;
// - le détail technique est gardé sur l'appareil (les 10 derniers) et peut être copié pour Bryan ;
// - la même erreur répétée n'ouvre pas dix fenêtres.

import { app, D, K } from './etat';

const CLE = 'empreintes.incidents';
const MAX = 10;

export interface Incident {
  quand: number;
  ou: string;
  message: string;
  pile: string;
  mode: string;
  vue: string;
}

function lire(): Incident[] {
  try { return JSON.parse(localStorage.getItem(CLE) ?? '[]') as Incident[]; } catch { return []; }
}

/** Les incidents gardés sur cet appareil (le plus récent en dernier) */
export const incidents = (): Incident[] => lire();

const texteDe = (i: Incident) => `EMPREINTES · ${new Date(i.quand).toLocaleString('fr-BE').replace(/\u202f/g, '\u00a0')} · ${i.ou} · écran ${i.mode}/${i.vue}\n${i.message}\n${i.pile}`;

let ouvert = false;
let dernier = '';

/** Une erreur attrapée : notée, puis expliquée au joueur (une fenêtre à la fois) */
export function signaler(e: unknown, ou: string, revenir: () => void): void {
  const err = e instanceof Error ? e : new Error(String(e));
  const i: Incident = {
    quand: Date.now(), ou, message: err.message.slice(0, 300),
    pile: (err.stack ?? '').split('\n').slice(0, 6).join('\n').slice(0, 900),
    mode: app.mode, vue: D.vue,
  };
  console.error('Incident', ou, err);
  const l = lire();
  l.push(i);
  try { localStorage.setItem(CLE, JSON.stringify(l.slice(-MAX))); } catch { /* stockage plein ou bloqué */ }
  if (ouvert || typeof document === 'undefined') return;
  // la même erreur, encore et encore (l'horloge redessine chaque seconde) : une seule fenêtre
  const sig = `${ou}:${i.message}`;
  if (sig === dernier && document.querySelector('.incident')) return;
  dernier = sig;
  ouvert = true;
  const el = document.createElement('div');
  el.className = 'incident';
  el.setAttribute('role', 'alertdialog');
  el.setAttribute('aria-modal', 'true');
  el.innerHTML = `<div class="incident-carte"><h2>Un grain de sable</h2>`
    + `<p>Quelque chose s’est mal passé à l’écran. Ta partie est sauvegardée : rien n’est perdu.</p>`
    + `<p class="incident-aide">Si ça recommence, copie le détail et envoie-le à Bryan.</p>`
    + `<pre>${i.message.replace(/[<&]/g, (c) => (c === '<' ? '&lt;' : '&amp;'))}</pre>`
    + `<div class="incident-btns"><button type="button" class="prim" data-i="district">Revenir au district</button>`
    + `<button type="button" class="sec" data-i="copier">Copier le détail</button></div></div>`;
  el.addEventListener('click', async (ev) => {
    const b = (ev.target as HTMLElement).closest<HTMLElement>('[data-i]');
    if (!b) return;
    if (b.dataset.i === 'copier') {
      try { await navigator.clipboard.writeText(lire().slice(-3).map(texteDe).join('\n\n')); b.textContent = 'Copié'; } catch { b.textContent = 'Copie impossible'; }
      return;
    }
    el.remove();
    ouvert = false;
    // retour au district, fenêtres refermées ; en expédition, le combat reste en cours et se reprend depuis le district
    app.mode = app.jeu.introVue ? 'district' : 'titre';
    D.vue = 'archipel'; D.menu = false;
    K.verrou = false;
    revenir();
  });
  document.body.appendChild(el);
}
