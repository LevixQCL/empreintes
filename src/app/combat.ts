// Le combat à l'écran : la fenêtre de fin, les chiffres qui jaillissent, et l'animation des coups.

import * as C from '../core/combat';
import { ennemiDef } from '../core/donnees';
import * as J from '../core/jeu';
import type { CombatEtat, Evenement, Pas } from '../core/types';
import { impact, initImpacts } from '../ui/impact';
import type { Fin } from '../ui/vue';
import { app, K, pause, racine, reduit } from './etat';
import { afficher } from './rendu';
import { sauver } from './synchro';

// ---------- Combat ----------

export function finPour(): Fin | null {
  const x = app.jeu.expedition;
  if (!x) return null;
  const s = x.combat;
  if (x.carte && x.phase === 'carte') return null;
  if (x.tutoriel) {
    if (s.issue === 'victoire') return { titre: 'La porte cède', texte: 'Le gardien se dissipe en poussière lumineuse. Derrière lui, des cristaux aux souvenirs mélangés, et un vieux papier tamponné.', bouton: 'Remonter avec ce qu’on a trouvé', action: 'remonter' };
    if (s.issue === 'defaite') return { titre: 'Repoussés', texte: 'Le gardien a eu le dessus, cette fois. Vise les suites et protège-toi quand il annonce une grosse attaque.', bouton: 'Remonter et réessayer', action: 'remonter' };
    return null;
  }
  if (x.epreuve) {
    const ep = J.epreuveDef(x.epreuve);
    if (s.issue === 'victoire') return { titre: 'Épreuve réussie', texte: `${ep?.nom ?? 'L’Épreuve'} : ${ennemiDef(s.ennemi.id).nom} se dissipe.${app.jeu.epreuves.faites.includes(x.epreuve) ? ' Tu l’avais déjà réussie cette semaine : pas de nouvelle carte.' : ' Une carte au choix t’attend au district.'}`, bouton: 'Remonter au district', action: 'remonter' };
    if (s.issue === 'defaite') return { titre: 'Épreuve manquée', texte: 'L’escouade a été repoussée. Tu peux la retenter quand tu veux cette semaine : change de cartes ou de Porteurs pour contourner la règle.', bouton: 'Remonter au district', action: 'remonter' };
    return null;
  }
  if (s.issue === 'defaite') {
    return { titre: 'Défaite', texte: `Toute l’escouade est à terre. Elle remonte avec la moitié du butin (${Math.floor(x.butin * J.DISTRICT.butinDefaite)} composants) et devra se reposer à la Clinique.`, bouton: 'Remonter au district', action: 'remonter' };
  }
  if (s.issue === 'victoire') {
    const nom = s.autres?.length ? 'Le groupe' : ennemiDef(s.ennemi.id).nom;
    if (x.terminee) {
      return { titre: `Strate −${x.strate} vaincue`, texte: `${nom} se disperse. L’escouade remonte avec ${x.butin} composants.${x.strate === app.jeu.strate ? ' Le passage est libre : avec assez de creuseurs, l’étage suivant pourra être percé (voir la Tour du Noyau).' : ''}`, bouton: 'Remonter au district', action: 'remonter' };
    }
    if (x.carte) return { titre: 'Victoire', texte: `${nom} se dissipe. Butin : ${x.butin} composants. L’escouade reprend sa route : les PV remontent surtout aux campements.`, bouton: 'Retour à la carte', action: 'suivant' };
    return { titre: 'Victoire', texte: `${nom} se dissipe. Butin : ${x.butin} composants. L’escouade souffle un peu (+50 % de PV) : tu continues, ou tu remontes avec ce que tu as ?`, bouton: 'Combat suivant', action: 'suivant', bouton2: 'Remonter avec le butin', action2: 'remonter' };
  }
  return null;
}

let idPop = 0;
function pop(cible: string, texte: string, couleur: string, echelle = 1) {
  const id = ++idPop;
  K.pops.push({ id, cible, texte, couleur, echelle });
  setTimeout(() => {
    K.pops = K.pops.filter((p) => p.id !== id);
    if (app.mode === 'combat') afficher();
  }, 900);
}

function popsDe(ev: Evenement, etat?: CombatEtat) {
  // dans un groupe, ce qui touche un ennemi qui n'est pas visé s'affiche sur sa vignette
  if ('rang' in ev && ev.rang !== undefined && 'cible' in ev && ev.cible === 'ennemi' && etat?.autres?.length && (etat.ennemi.rang ?? 0) !== ev.rang) {
    ev = { ...ev, cible: `ennemi-${ev.rang}` } as Evenement;
  }
  // un coup sur l'ennemi grossit avec sa place dans la chaîne et avec sa taille : la fin d'une suite se lit de loin
  if (ev.kind === 'degats') pop(ev.cible, ev.net ? `−${ev.net}` : 'bloqué', 'var(--danger)', ev.cible === 'ennemi' && ev.net ? Math.min(2, 1 + 0.18 * (K.actif ?? 0) + (ev.net >= 25 ? 0.25 : 0) + (ev.net >= 45 ? 0.2 : 0)) : 1);
  else if (ev.kind === 'bouclier') pop(ev.cible, `+${ev.v}`, 'var(--ivory)');
  else if (ev.kind === 'soin' && ev.v) pop(ev.cible, `+${ev.v}`, 'var(--bio)');
  else if (ev.kind === 'echo') pop('escouade', 'Écho', 'var(--gold)');
  else if (ev.kind === 'effet') pop(ev.cible, ev.texte, 'var(--gold)');
  else if (ev.kind === 'flux') pop('escouade', `+${ev.gain} Flux`, 'var(--gold)');
}
export async function jouer(pas: Pas[]) {
  K.verrou = true;
  app.rapide = false;
  initImpacts(reduit);
  let bonus = 0;
  for (const p of pas) {
    const base = p.ev.kind === 'carte' ? 130 : p.ev.kind === 'resonance' ? 250 : p.ev.kind === 'degats' && p.ev.cible === 'ennemi' ? 300 : 380;
    await pause((base + bonus) * (app.rapide ? 0.35 : 1));
    // la jauge touchée garde une traînée de ses PV d'avant le coup, qui se vide
    if (p.ev.kind === 'degats' && p.ev.net > 0) {
      const avant = K.etat ?? app.jeu.expedition?.combat;
      const cible = p.ev.cible;
      const ev = p.ev;
      const c = cible === 'ennemi' ? (avant && C.tousEnnemis(avant).find((e) => (e.rang ?? 0) === (ev.rang ?? 0))) ?? avant?.ennemi : avant?.porteurs.find((x) => x.id === cible);
      if (c) {
        K.traces[cible] = Math.max(0, Math.min(100, (100 * c.pv) / c.pvMax));
        setTimeout(() => { delete K.traces[cible]; }, 1100);
      }
    }
    K.etat = p.etat;
    if (p.ev.kind === 'carte') K.actif = p.ev.rang;
    else if (p.ev.kind === 'fin' || (p.ev.kind === 'degats' && p.ev.cible !== 'ennemi' && !p.ev.source)) K.actif = undefined;
    popsDe(p.ev, p.etat);
    afficher();
    bonus = impact(p.ev, racine);
  }
  await pause(300 + bonus * (app.rapide ? 0.35 : 1));
  K.actif = undefined;
  K.etat = null;
  if (app.jeu.expedition && app.jeu.expedition.combat.issue !== 'en-cours') J.finDeCombat(app.jeu);
  K.fin = finPour();
  K.verrou = false;
  sauver();
  afficher();
}

/**
 * Fuir : l'attaque annoncée touche pendant la fuite. On la joue comme un vrai coup (traînée de la jauge, chiffres, secousse),
 * puis on quitte l'écran de combat. L'état du combat n'est pas modifié ici : jeu.ts applique le même coup.
 */
export async function jouerFuite() {
  const s = app.jeu.expedition?.combat;
  if (!s) return;
  const { coups } = C.coupDeFuite(s);
  K.fuite = false;
  const pas: Pas[] = [];
  let etat = structuredClone(s);
  for (const c of coups) {
    etat = structuredClone(etat);
    const p = etat.porteurs.find((q) => q.id === c.id)!;
    p.pv = Math.max(0, p.pv - c.net);
    etat.bouclier = Math.max(0, etat.bouclier - c.absorbe);
    pas.push({ ev: { kind: 'degats', cible: c.id, net: c.net, absorbe: c.absorbe }, etat });
    if (p.pv <= 0) { p.aTerre = true; pas.push({ ev: { kind: 'a-terre', cible: c.id }, etat }); }
  }
  if (pas.length) await jouer(pas);
}
