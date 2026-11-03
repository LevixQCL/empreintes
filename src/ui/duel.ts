// L'écran du duel en temps réel (3 novembre 2026, pas encore branché au jeu : il vit dans duel.html, voir docs/duel.md).
// Il reprend les cartes et les jauges du combat (vue.ts) : en haut l'escouade adverse (toucher un Porteur le vise),
// au centre le chrono et ce qui vient de se passer, puis sa chaîne, son escouade (toucher un Porteur y envoie le dernier soin posé) et sa main.

import { DUEL, apercuDuel, autre, capaciteDuel, cibleEffective, lectureAdverse, placesLibresDuel, type CoteDuel, type EvDuel } from '../core/duel';
import { porteurDef, NOMS_LIGNEE } from '../core/donnees';
import { REGLES, analyserChaine, frequencesEffectives, places, prolonge } from '../core/regles';
import type { SessionDuel } from '../duel/session';
import { portrait } from './art';
import { ICO } from './icones';
import { echap } from './outils';
import { COULEUR, geste, jauge } from './vue';

const lignee = (id: string) => porteurDef(id).lignee;

function tuile(p: CoteDuel['porteurs'][number], action: string, o: { cible?: boolean; soin?: boolean; bouclier?: number }) {
  const img = portrait(p.id);
  const terre = p.pv <= 0;
  const cls = ['dl-porteur', terre ? 'terre' : '', o.cible ? 'cible' : '', o.soin ? 'soigne' : ''].filter(Boolean).join(' ');
  const etat = terre ? 'à terre' : `${p.pv} PV sur ${p.pvMax}`;
  return `<button type="button" class="${cls}" data-action="${action}" data-porteur="${p.id}" style="--c:${COULEUR[lignee(p.id)]}"${terre ? ' disabled' : ''}`
    + ` aria-label="${echap(`${porteurDef(p.id).nom}, ${NOMS_LIGNEE[lignee(p.id)].nom}, ${etat}${o.cible ? ', visé' : ''}`)}">`
    + (img ? `<span class="dl-portrait" style="background-image:url(${img})" aria-hidden="true"></span>` : '<span class="dl-portrait vide" aria-hidden="true"></span>')
    + `<span class="dl-pv" aria-hidden="true"><b>${terre ? '—' : p.pv}</b></span>`
    + (o.cible ? `<span class="dl-marque" aria-hidden="true">${ICO.atk}</span>` : '')
    + `<span class="dl-jauge">${jauge('jp', p.pv, p.pvMax)}</span>`
    + `</button>`;
}

function escouade(c: CoteDuel, action: string, o: { cible?: string | null; soin?: string | null }) {
  return `<div class="dl-escouade">${c.porteurs.map((p) => tuile(p, action, { cible: o.cible === p.id, soin: o.soin === p.id })).join('')}</div>`;
}

function main(s: SessionDuel) {
  const c = s.brouillon.cotes[s.camp];
  const libres = placesLibresDuel(c);
  const fs = frequencesEffectives(c.chaine);
  return c.main.map((g) => {
    if (g.vide) {
      const img = g.porteur ? portrait(g.porteur) : null;
      const nom = g.porteur ? porteurDef(g.porteur).nom : '';
      return `<span class="geste main main-vide" role="img" aria-label="${echap(`Place vide de ${nom} : elle ne se joue pas`)}" style="--c:${COULEUR[g.porteur ? lignee(g.porteur) : 'neutre']}">`
        + (img ? `<span class="mv-ombre" style="background-image:url(${img})" aria-hidden="true"></span>` : '')
        + `<span class="mv-texte" aria-hidden="true"><b>Place vide</b><small>${echap(nom)}</small></span></span>`;
    }
    const halo = !!c.chaine.length && prolonge(g, fs[fs.length - 1]) && places(g) <= libres;
    return geste(g, 'main', 'duel-poser', { halo, off: s.verrouille, serre: places(g) > libres });
  }).join('');
}

function chaine(s: SessionDuel) {
  const c = s.brouillon.cotes[s.camp];
  const cap = capaciteDuel(c);
  let h = c.chaine.map((g) => geste(g, 'chaine', 'duel-reprendre', { off: s.verrouille })).join('');
  for (let k = c.chaine.reduce((n, g) => n + places(g), 0); k < cap; k++) h += '<span class="place-vide" aria-hidden="true"></span>';
  const a = analyserChaine(c.chaine);
  const bonus = a.suite >= 3 ? `<span class="dl-bonus">Résonance ${a.suite}</span>` : a.echo ? `<span class="dl-bonus">Écho ×${a.echoN ?? 3}</span>` : '';
  return `<div class="dl-chaine${s.verrouille ? ' verrouille' : ''}"><div class="dl-rangee">${h}</div>${bonus}</div>`;
}

function apercu(s: SessionDuel) {
  const a = apercuDuel(s.brouillon, s.camp);
  const cible = a.cible ? porteurDef(a.cible).nom : '—';
  return `<p class="dl-apercu" aria-label="${echap(`Ta chaîne : ${a.degats} dégâts sur ${cible}, ${a.bouclier} de bouclier, ${a.soin} de soin`)}">`
    + `<span class="atk">${ICO.atk}<b>${a.degats}</b><small>sur ${echap(cible)}</small></span>`
    + `<span class="bouclier">${ICO.bouclier}<b>${a.bouclier}</b></span>`
    + `<span class="soin">${ICO.soin}<b>${a.soin}</b></span></p>`;
}

/** Ce qui s'est passé au dernier tour, en deux chiffres : ce qu'on a infligé, ce qu'on a reçu */
function recap(s: SessionDuel) {
  if (!s.resolu) return '<p class="dl-recap">Compose ta chaîne : les deux chaînes partent en même temps.</p>';
  const ev = s.derniers;
  const somme = (f: (e: EvDuel) => number) => ev.reduce((n, e) => n + f(e), 0);
  const inflige = somme((e) => (e.sorte === 'coup' && e.camp === s.camp ? e.v : 0));
  const recu = somme((e) => (e.sorte === 'coup' && e.camp !== s.camp ? e.v : 0));
  const tombes = ev.filter((e) => e.sorte === 'terre').map((e) => (e.sorte === 'terre' ? `${porteurDef(e.porteur).nom} ${e.camp === s.camp ? '(à toi)' : ''}`.trim() : '')).join(', ');
  return `<p class="dl-recap"><span>Tour ${s.resolu}</span><span class="atk">${ICO.atk} infligé <b>${inflige}</b></span><span class="recu">reçu <b>${recu}</b></span>`
    + (tombes ? `<span class="terre">à terre : ${echap(tombes)}</span>` : '') + '</p>';
}

/** L'écran du duel */
export function htmlDuel(s: SessionDuel, maintenant = Date.now()): string {
  const moi = s.brouillon.cotes[s.camp];
  const lui = s.brouillon.cotes[autre(s.camp)];
  const cible = cibleEffective(s.brouillon, s.camp)?.id ?? null;
  const dernierSoin = [...moi.chaine].reverse().find((g) => g.type === 'soin');
  const restant = s.restant(maintenant);
  const lu = lectureAdverse(s.commun, s.camp);
  const etatLui = s.fini ? '' : s.adversairePret ? '<span class="dl-etat pret">a verrouillé</span>' : '<span class="dl-etat">compose sa chaîne…</span>';
  const fin = s.fini ? finDuel(s) : '';
  return `<section class="duel${s.verrouille ? ' attend' : ''}" aria-label="Duel">`
    + `<header class="dl-tete"><div><span class="surtitre">Duel · tour ${s.tour}</span><h1>${echap(lui.nom)}</h1></div>${etatLui}`
    + (lui.bouclier ? `<span class="dl-bouclier" aria-label="Bouclier gardé ${lui.bouclier}">${ICO.bouclier}${lui.bouclier}</span>` : '') + '</header>'
    + escouade(lui, 'duel-viser', { cible })
    + (lu ? `<p class="dl-lu">${ICO.chercher} Lecture : ${lu.atk} attaque${lu.atk > 1 ? 's' : ''}, ${lu.bouclier} bouclier${lu.bouclier > 1 ? 's' : ''}, ${lu.soin} soin${lu.soin > 1 ? 's' : ''}</p>` : '')
    + `<div class="dl-centre"><span class="dl-chrono${restant <= 5 && !s.verrouille ? ' urgent' : ''}" style="--p:${(restant / DUEL.chrono) * 100}%" role="timer" aria-label="${restant} secondes">`
    + `<b>${s.verrouille ? ICO.verrou : restant}</b></span>${recap(s)}</div>`
    + chaine(s)
    + apercu(s)
    + `<div class="dl-moi"><span class="surtitre">${echap(moi.nom)}${moi.bouclier ? ` · ${ICO.bouclier}${moi.bouclier}` : ''}</span>`
    + escouade(moi, 'duel-soigner', { soin: dernierSoin?.cible ?? null }) + '</div>'
    + `<div class="dl-main">${main(s)}</div>`
    + `<div class="dl-actions">`
    + `<span class="dl-flux" aria-label="Flux ${moi.flux} sur ${REGLES.fluxMax}">${ICO.flux}${'<i class="on"></i>'.repeat(moi.flux)}${'<i></i>'.repeat(REGLES.fluxMax - moi.flux)}</span>`
    + `<button type="button" class="btn-sec" data-action="duel-allonger"${s.verrouille || moi.flux < 1 || capaciteDuel(moi) >= REGLES.capaciteMax ? ' disabled' : ''}>${ICO.place}Place</button>`
    + `<button type="button" class="btn-sec" data-action="duel-repiocher"${s.verrouille || moi.flux < 1 ? ' disabled' : ''}>${ICO.repiocher}Main</button>`
    + (s.absent(maintenant)
      ? `<button type="button" class="prim" data-action="duel-reclamer">Réclamer la victoire</button>`
      : `<button type="button" class="prim" data-action="duel-verrouiller"${s.verrouille || s.fini ? ' disabled' : ''}>${s.verrouille ? 'En attente…' : `${ICO.lancer}Verrouiller`}</button>`)
    + `</div>`
    + `<button type="button" class="dl-quitter" data-action="duel-quitter"${s.fini ? ' hidden' : ''}>Abandonner</button>`
    + (s.desynchro ? '<p class="dl-alerte">Un choix adverse illisible a été remplacé par une chaîne vide.</p>' : '')
    + fin + '</section>';
}

function finDuel(s: SessionDuel) {
  const c = s.commun;
  const titre = c.issue === 'egalite' ? 'Égalité' : s.gagne ? 'Victoire' : 'Défaite';
  const texte = c.abandon !== undefined
    ? (c.abandon === s.camp ? 'Tu as quitté le duel.' : `${c.cotes[c.abandon].nom} a quitté le duel.`)
    : `En ${c.tour - 1} tours.`;
  return `<div class="dl-fin ${c.issue === 'egalite' ? 'nul' : s.gagne ? 'gagne' : 'perdu'}" role="dialog" aria-label="${titre}"><div class="dl-fin-carte">`
    + `<span class="surtitre">Fin du duel</span><h2>${titre}</h2><p>${echap(texte)}</p>`
    + `<button type="button" class="prim" data-action="duel-retour">Retour</button></div></div>`;
}

/** Le salon : contre le robot, créer un duel (un code à partager), rejoindre celui d'un ami */
export function htmlSalon(o: { nom: string; source: string; enLigne: boolean; code?: string; attente?: boolean; message?: string }): string {
  return `<section class="duel-salon" aria-label="Duel">`
    + `<header><span class="surtitre">EMPREINTES · aperçu, pas encore dans le jeu</span><h1>Duel en temps réel</h1>`
    + `<p class="aide">Deux escouades d’un Augmenté, d’un Géné et d’un Résonant, une chaîne chacun, ${DUEL.chrono} secondes par tour : les deux chaînes partent en même temps.</p></header>`
    + `<p class="dl-qui"><b>${echap(o.nom)}</b> · ${echap(o.source)}</p>`
    + `<button type="button" class="prim" data-action="duel-robot">${ICO.lancer}S’entraîner contre le robot</button>`
    + (o.enLigne
      ? (o.attente && o.code
        ? `<div class="dl-code"><span class="label">Code du duel</span><b>${echap(o.code)}</b><p class="aide">Donne ce code à ton adversaire. Le duel commence dès qu’il le rejoint.</p></div>`
        : `<button type="button" class="btn-sec" data-action="duel-creer">Créer un duel entre amis</button>`
          + `<form class="dl-rejoindre" data-action="duel-rejoindre"><input name="code" maxlength="6" autocomplete="off" autocapitalize="characters" placeholder="CODE" aria-label="Code du duel"><button type="submit" class="btn-sec">Rejoindre</button></form>`)
      : '<p class="aide">Le duel entre amis demande une connexion au compte.</p>')
    + (o.message ? `<p class="dl-alerte">${echap(o.message)}</p>` : '')
    + `</section>`;
}
