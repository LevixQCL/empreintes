// Rendu de l'écran de combat à partir d'un état. Aucune règle de jeu ici : seulement de l'affichage.

import { capacite, ligneeGeste, placesLibres, placesPrises, texteIntention } from '../core/combat';
import { NOMS_LIGNEE, ennemiDef, porteurDef } from '../core/donnees';
import { BATTU_PAR, REGLES, analyserChaine, frequencesEffectives, places, serieFinale } from '../core/regles';
import { NOMS_EFFET, libelleEffet } from '../core/effets';
import type { CombatEtat, Geste, LigneeGeste } from '../core/types';
import type { Expedition } from '../core/expedition';

export interface Pop {
  id: number;
  cible: string;
  texte: string;
  couleur: string;
}

export interface Fin {
  titre: string;
  texte: string;
  bouton: string;
  action: 'suivant' | 'remonter';
  /** second bouton facultatif */
  bouton2?: string;
  action2?: 'suivant' | 'remonter';
}

export interface Compte {
  actif: boolean;
  ouvert: boolean;
  utilisateur: { nom: string } | null;
  occupe: boolean;
  erreur: string;
  info: string;
  synchro: 'aucune' | 'en-cours' | 'ok' | 'erreur';
}

export interface Ecran {
  x: Expedition;
  etat: CombatEtat;
  verrou: boolean;
  regles: boolean;
  pops: Pop[];
  fin: Fin | null;
  /** consigne du combat guidé (chambre scellée) */
  lecon?: string;
}

export const COULEUR: Record<LigneeGeste, string> = {
  tech: 'var(--tech)', bio: 'var(--bio)', reso: 'var(--reso)', neutre: 'var(--ivory)',
};

const ICONES = {
  atk: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><path d="M7 17 L19 5"/><path d="M5 13 L11 19"/><path d="M4 20 L6 18"/></svg>',
  bouclier: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linejoin="round" aria-hidden="true"><path d="M12 3 L19 6 V11 C19 16 16 19 12 21 C8 19 5 16 5 11 V6 Z"/></svg>',
  soin: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" aria-hidden="true"><path d="M12 5 V19"/><path d="M5 12 H19"/></svg>',
  boost: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--gold)" stroke-width="2.2" aria-hidden="true"><circle cx="12" cy="12" r="7"/><path d="M12 8 V12 L15 14"/></svg>',
};
const LIBELLE = { atk: 'attaque', bouclier: 'protection', soin: 'soin' };

export const FONDS: Record<string, string> = { ilka: '#3A4E63', doran: '#3B4D37', vela: '#44395C', coursier: '#33465A', docker: '#36462F', guetteur: '#3D3352', remanent: '#2A2438', vigie: '#26313D', confluence: '#2E2B22' };

export const echap = (t: string) => t.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);
const pct = (v: number, max: number) => Math.max(0, Math.min(100, (100 * v) / max));

function popsPour(e: Ecran, cible: string) {
  return e.pops.filter((p) => p.cible === cible)
    .map((p) => `<span class="pop" style="--pc:${p.couleur}" aria-hidden="true">${echap(p.texte)}</span>`).join('');
}

function carte(g: Geste, taille: 'moyen' | 'petit', action: string, o: { halo?: boolean; off?: boolean; serre?: boolean } = {}) {
  const lign = ligneeGeste(g);
  const nomP = g.porteur ? porteurDef(g.porteur).nom : 'Spécial';
  const cls = ['geste', taille, g.lourd && taille === 'moyen' ? 'double' : '', o.halo ? 'halo' : '', o.serre ? 'serre' : ''].join(' ');
  const accord = g.effet?.type === 'accord';
  const label = `${g.nom} (${nomP}), fréquence ${accord ? 'libre' : g.f}, ${LIBELLE[g.type]} ${g.v}${g.lourd ? ', prend 2 places' : ''}${g.effet ? ', ' + libelleEffet(g.effet) : ''}`;
  return `<button type="button" class="${cls}" style="--c:${COULEUR[lign]}" data-action="${action}" data-uid="${g.uid}" aria-label="${echap(label)}"${o.off ? ' disabled' : ''}>`
    + `<span class="f">${accord ? '∗' : g.f}</span>`
    + (g.lourd ? '<span class="lourd" aria-hidden="true">2 PLACES</span>' : '')
    + `<span class="eff">${ICONES[g.type]}<span>${g.v}</span></span>`
    + (g.effet ? `<span class="effet">${NOMS_EFFET[g.effet.type]}</span>` : '')
    + `<span class="nom">${echap(g.nom)}${taille === 'moyen' ? ' · ' + echap(nomP) : ''}</span></button>`;
}

export function panneauCompte(c: Compte): string {
  if (!c.ouvert) return '';
  if (c.utilisateur) {
    const etat = { aucune: '', 'en-cours': 'Synchronisation…', ok: 'Progression enregistrée dans ton compte.', erreur: 'Synchronisation impossible pour l’instant, la sauvegarde reste sur l’appareil.' }[c.synchro];
    return `<section class="panneau" aria-label="Compte"><strong>Connecté : ${echap(c.utilisateur.nom)}</strong>`
      + (etat ? `<p class="discret">${etat}</p>` : '')
      + `<div class="ligne"><button type="button" data-action="deconnexion"${c.occupe ? ' disabled' : ''}>Se déconnecter</button></div></section>`;
  }
  return `<section class="panneau" aria-label="Compte"><strong>Compte</strong>`
    + `<p class="discret">Optionnel : retrouve ta progression sur un autre appareil.</p>`
    + `<div class="ligne"><button type="button" class="prim" data-action="google"${c.occupe ? ' disabled' : ''}>Continuer avec Google</button></div>`
    + `<input id="email" type="email" autocomplete="email" placeholder="E-mail" aria-label="E-mail">`
    + `<input id="mdp" type="password" autocomplete="current-password" placeholder="Mot de passe" aria-label="Mot de passe">`
    + `<div class="ligne"><button type="button" data-action="connexion"${c.occupe ? ' disabled' : ''}>Se connecter</button><button type="button" data-action="inscription"${c.occupe ? ' disabled' : ''}>Créer un compte</button></div>`
    + `<button type="button" class="lien" data-action="oubli">Mot de passe oublié</button>`
    + (c.erreur ? `<p class="erreur">${echap(c.erreur)}</p>` : '')
    + (c.info ? `<p class="discret">${echap(c.info)}</p>` : '')
    + `</section>`;
}

export function htmlCombat(e: Ecran): string {
  const s = e.etat;
  const def = ennemiDef(s.ennemi.id);
  const it = s.intention;
  const faible = BATTU_PAR[def.lignee];
  const a = analyserChaine(s.chaine);
  const dernier = s.chaine[s.chaine.length - 1];
  const libres = placesLibres(s);
  const verrou = e.verrou || s.issue !== 'en-cours';

  let conseil: string;
  if (!s.chaine.length) conseil = `Choisis jusqu’à ${capacite(s)} Gestes. Des chiffres qui se suivent, dans l’ordre (3, 4, 5), déclenchent une Résonance.`;
  else {
    const fin = serieFinale(s.chaine);
    const fs = frequencesEffectives(s.chaine);
    const d = { f: fs[fs.length - 1]! };
    if (a.suite >= 3) conseil = `Résonance : suite de ${a.suite}, effets <b>+${Math.round((a.mult - 1) * 100)} %</b>` + (a.suite < 5 && libres > 0 && fin === a.suite ? ` · ajoute un <b>${d.f + 1}</b> pour aller plus loin` : '');
    else if (fin === 2) conseil = `Suite ${d.f - 1} → ${d.f} : ajoute un <b>${d.f + 1}</b> pour +30 %`;
    else conseil = `Ajoute un <b>${d.f + 1}</b> pour commencer une suite`;
    if (a.echo) conseil += ` · Écho : bouclier +${REGLES.bouclierEcho}`;
    if (dernier?.effet) conseil += `<br><span class="effet-texte">${echap(libelleEffet(dernier.effet))}</span>`;
  }

  const silhouette = `<svg width="92" height="92" viewBox="0 0 96 96" aria-hidden="true"><path d="M8 96 C10 64 26 40 48 38 C62 37 74 44 80 56 L90 46 L86 64 C90 74 90 86 88 96 Z" fill="${COULEUR[def.lignee]}" opacity=".35"/><circle cx="66" cy="56" r="3" fill="var(--gold)"/><circle cx="76" cy="58" r="2.5" fill="var(--gold)"/></svg>`;
  const iconeIntention = it.type === 'atk' ? ICONES.atk.replace('currentColor', 'var(--danger)') : it.type === 'bouclier' ? ICONES.bouclier : ICONES.boost;

  let h = '';
  h += `<header class="top"><div><h1>EMPREINTES</h1><span class="sous">${e.x.tutoriel ? `LA CHAMBRE SCELLÉE · TOUR ${s.tour}` : `COMBAT ${e.x.index + 1}/${e.x.sequence.length} · TOUR ${s.tour} · STRATE −${e.x.strate}`}</span></div><div class="droite">`
    + `<button type="button" class="btn-sec" data-action="regles" aria-expanded="${e.regles}">${e.regles ? 'Fermer' : 'Règles'}</button></div></header>`;


  if (e.regles) h += '<section class="regles" aria-label="Règles"><strong>Comment on joue</strong><ul>'
    + `<li>Touche les Gestes de ta main pour composer une chaîne (${REGLES.capaciteBase} places au départ), puis lance-la.</li>`
    + '<li>Le chiffre du milieu est la force du Geste : lame = dégâts, bouclier = protection de l’escouade, croix = soin du plus blessé.</li>'
    + '<li>Le gros chiffre en haut est la Fréquence. Des Fréquences qui se suivent dans l’ordre font une Résonance : suite de 3 = +30 %, de 4 = +60 %, de 5 = +100 %. Le Geste entouré d’or prolonge ta suite.</li>'
    + `<li>Trois Fréquences identiques font un Écho : bouclier d’escouade +${REGLES.bouclierEcho}.</li>`
    + '<li>Chaque Résonance remplit le Flux. Dépense-le pour ajouter une place à ta chaîne ou repiocher ta main.</li>'
    + '<li>« 2 PLACES » : ce Geste est puissant mais occupe deux places dans la chaîne.</li>'
    + '<li>Les cartes rares ont des effets écrits en or sous leur force (Perçant, Siphon, Accord…). Pose le Geste dans la chaîne pour lire ce qu’il fait. « ∗ » : Fréquence libre, il prolonge toujours la suite.</li>'
    + '<li>Triangle des lignées : Tech bat Résonant, Résonant bat Géné, Géné bat Tech (+15 %).</li>'
    + '<li>L’attaque de l’ennemi est annoncée à l’avance : protège-toi ou finis-le avant.</li></ul></section>';

  h += `<section class="ennemi" aria-label="Ennemi">${popsPour(e, 'ennemi')}`
    + `<div class="portrait" style="background:${FONDS[def.id] ?? '#2A2438'}">${silhouette}</div>`
    + `<div class="infos"><span class="nom">${echap(def.nom)}</span>`
    + `<div class="tags"><span class="tag" style="--c:${COULEUR[def.lignee]}">${echap(def.tag)}</span>`
    + `<span class="faible" style="--c:${COULEUR[faible]}">Faible contre <b>${NOMS_LIGNEE[faible].court}</b></span></div>`
    + `<div class="barre" style="--c:var(--danger)"><div class="piste"><i style="width:${pct(s.ennemi.pv, s.ennemi.pvMax)}%"></i></div><span class="chiffre">${s.ennemi.pv}/${s.ennemi.pvMax}</span></div>`
    + (s.ennemi.bouclier ? `<span class="bouclier-e">Bouclier ${s.ennemi.bouclier}</span>` : '')
    + (s.ennemi.fissure ? `<span class="bouclier-e fissure">Fissure +${Math.round(s.ennemi.fissure * 100)} %</span>` : '')
    + `<div class="intention">${iconeIntention}<span>${echap(texteIntention(s))}</span></div></div></section>`;

  h += '<section aria-label="Escouade" style="display:grid;gap:6px"><div class="escouade">';
  for (const p of s.porteurs) {
    const d = porteurDef(p.id);
    const ko = p.pv <= 0;
    const cible = !ko && it.type === 'atk' && (it.zone || it.cibleId === p.id);
    h += `<div class="porteur${ko ? ' ko' : ''}" style="--c:${COULEUR[d.lignee]};--fond:${FONDS[d.id]}">${popsPour(e, p.id)}`
      + `<div class="tete"><span class="pastille" aria-hidden="true"></span><span class="n">${echap(d.nom)}</span></div>`
      + `<div class="piste"><i style="width:${pct(p.pv, p.pvMax)}%"></i></div>`
      + `<div class="bas"><span class="chiffre">${ko ? 'À TERRE' : `${p.pv}/${p.pvMax}`}</span>${cible ? '<span class="cible">CIBLE</span>' : ''}</div></div>`;
  }
  h += `</div><div class="ligne-escouade" style="position:relative">${popsPour(e, 'escouade')}`
    + `<span class="bouclier-esc">${ICONES.bouclier}Bouclier d’escouade : ${s.bouclier}</span>`
    + `<span class="chiffre">Pioche ${s.pioche.length} · Défausse ${s.defausse.length}</span></div></section>`;

  if (e.lecon) h += `<section class="lecon" aria-live="polite"><span class="label">COMBAT GUIDÉ</span><p>${echap(e.lecon)}</p></section>`;
  if (!e.lecon) h += `<section class="flux" aria-label="Flux"><span class="label">FLUX</span><div class="segments" aria-label="${s.flux} sur ${REGLES.fluxMax}">`
    + Array.from({ length: REGLES.fluxMax }, (_, i) => `<i class="${i < s.flux ? 'plein' : ''}"></i>`).join('') + '</div>'
    + `<button type="button" class="btn-flux" data-action="allonger"${verrou || s.flux < 1 || capacite(s) >= REGLES.capaciteMax ? ' disabled' : ''}>+1 place</button>`
    + `<button type="button" class="btn-flux" data-action="repiocher"${verrou || s.flux < 1 ? ' disabled' : ''}>Repiocher</button></section>`;

  h += `<section class="chaine" aria-label="Chaîne"><div class="entete"><span class="label">CHAÎNE · ${placesPrises(s)} / ${capacite(s)}</span>`
    + `<span class="etat-suite">${a.suite >= 3 ? 'RÉSONANCE ×' + a.mult.toLocaleString('fr-BE') : a.suite === 2 ? 'SUITE EN COURS' : ''}</span></div><div class="places">`;
  for (const g of s.chaine) h += carte(g, 'moyen', 'retirer', { off: verrou });
  for (let i = 0; i < libres; i++) h += '<div class="vide" aria-hidden="true">?</div>';
  h += `</div><div class="conseil">${conseil}</div></section>`;

  h += '<section aria-label="Main" style="display:grid;gap:8px"><span class="label">MAIN</span><div class="main">';
  for (const g of s.main) {
    const fs = frequencesEffectives(s.chaine);
    const halo = !!dernier && (g.f === fs[fs.length - 1]! + 1 || g.effet?.type === 'accord') && places(g) <= libres;
    h += carte(g, 'petit', 'ajouter', { halo, off: verrou, serre: places(g) > libres });
  }
  h += '</div></section>';

  h += `<div class="journal" aria-label="Journal">${s.journal.slice(0, 3).map((t) => `<p>${echap(t)}</p>`).join('')}</div>`;

  h += `<div class="actions"><button type="button" class="sec" data-action="vider"${verrou || !s.chaine.length ? ' disabled' : ''}>Retirer</button>`
    + `<button type="button" class="prim" data-action="lancer"${verrou || !s.chaine.length ? ' disabled' : ''}>Lancer la chaîne</button></div>`;

  if (e.fin) h += `<div class="voile" role="dialog" aria-modal="true" aria-labelledby="fin-titre"><div class="fenetre"><h2 id="fin-titre">${echap(e.fin.titre)}</h2><p>${echap(e.fin.texte)}</p><button type="button" data-action="${e.fin.action}">${echap(e.fin.bouton)}</button>${e.fin.bouton2 ? `<button type="button" class="sec" data-action="${e.fin.action2}">${echap(e.fin.bouton2)}</button>` : ''}</div></div>`;

  return h;
}
