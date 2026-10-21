// Rendu de l'écran de combat à partir d'un état. Aucune règle de jeu ici : seulement de l'affichage.
// Disposition, de haut en bas : la scène de l'ennemi (son intention en évidence), l'escouade, la chaîne et le Flux,
// la main, puis le bouton Lancer toujours au même endroit, sous le pouce.

import { capacite, ligneeGeste, placesLibres, placesPrises, texteIntention } from '../core/combat';
import { NOMS_LIGNEE, ennemiDef, porteurDef } from '../core/donnees';
import { BATTU_PAR, REGLES, analyserChaine, frequencesEffectives, places, serieFinale } from '../core/regles';
import { NOMS_EFFET, libelleEffet } from '../core/effets';
import type { CombatEtat, Geste, LigneeGeste } from '../core/types';
import type { Expedition } from '../core/expedition';
import { illustrationEnnemi, portrait } from './art';
import { couleurFrequence } from './carte';
import { ICO } from './icones';

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

const LIBELLE = { atk: 'attaque', bouclier: 'protection', soin: 'soin' };

export const FONDS: Record<string, string> = { ilka: '#3A4E63', doran: '#3B4D37', vela: '#44395C', coursier: '#33465A', docker: '#36462F', guetteur: '#3D3352', remanent: '#2A2438', vigie: '#26313D', confluence: '#2E2B22', rampeur: '#2C3326', pilleur: '#2F2A24', brigadier: '#2E2A3E', 'echo-veilleur': '#252238', 'sentinelle-verre': '#22303A', 'gardien-registres': '#2B2533', double: '#2A2236', 'essaim-ambre': '#352A18', 'automate-graveur': '#29303A', tisseuse: '#33261F', 'premier-porteur': '#1E1C2A' };

export const echap = (t: string) => t.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);
const pct = (v: number, max: number) => Math.max(0, Math.min(100, (100 * v) / max));

function popsPour(e: Ecran, cible: string) {
  return e.pops.filter((p) => p.cible === cible)
    .map((p) => `<span class="pop" style="--pc:${p.couleur}" aria-hidden="true">${echap(p.texte)}</span>`).join('');
}

/** Un Geste : la Fréquence dans sa gemme (même couleur que sur les cartes Module), la force, le nom */
function geste(g: Geste, taille: 'chaine' | 'main', action: string, o: { halo?: boolean; off?: boolean; serre?: boolean } = {}) {
  const lign = ligneeGeste(g);
  const nomP = g.porteur ? porteurDef(g.porteur).nom : 'Spécial';
  const accord = g.effet?.type === 'accord';
  const cls = ['geste', taille, g.lourd ? 'lourd' : '', o.halo ? 'halo' : '', o.serre ? 'serre' : '', g.effet ? 'a-effet' : ''].filter(Boolean).join(' ');
  const label = `${g.nom} (${nomP}), fréquence ${accord ? 'libre' : g.f}, ${LIBELLE[g.type]} ${g.v}${g.lourd ? ', prend 2 places' : ''}${g.effet ? ', ' + libelleEffet(g.effet) : ''}${o.halo ? ', prolonge ta suite' : ''}`;
  return `<button type="button" class="${cls}" style="--c:${COULEUR[lign]};--fc:${accord ? '#5d5470' : couleurFrequence(g.f)}" data-action="${action}" data-uid="${g.uid}" aria-label="${echap(label)}"${o.off ? ' disabled' : ''}>`
    + `<span class="g-haut"><span class="g-freq">${accord ? '∗' : g.f}</span>${g.lourd ? '<span class="g-lourd">2 PL.</span>' : ''}${o.halo ? `<span class="g-suite">${ICO.monter}</span>` : ''}</span>`
    + `<span class="g-val ${g.type}">${ICO[g.type]}<b>${g.v}</b></span>`
    + (g.effet ? `<span class="g-effet">${NOMS_EFFET[g.effet.type]}</span>` : '')
    + `<span class="g-nom">${echap(g.nom)}</span>`
    + (taille === 'chaine' ? `<span class="g-qui">${echap(nomP)}</span>` : '')
    + `</button>`;
}

export function panneauCompte(c: Compte): string {
  if (!c.ouvert) return '';
  if (c.utilisateur) {
    const etat = { aucune: '', 'en-cours': 'Synchronisation…', ok: 'Progression enregistrée dans ton compte.', erreur: 'Synchronisation impossible pour l’instant, la sauvegarde reste sur l’appareil.' }[c.synchro];
    return `<section class="panneau" aria-label="Compte"><strong>Connecté : ${echap(c.utilisateur.nom)}</strong>`
      + (etat ? `<p class="discret">${etat}</p>` : '')
      + `<div class="ligne"><button type="button" class="btn sec" data-action="deconnexion"${c.occupe ? ' disabled' : ''}>Se déconnecter</button></div></section>`;
  }
  return `<section class="panneau" aria-label="Compte"><strong>Compte</strong>`
    + `<p class="discret">Optionnel : retrouve ta progression sur un autre appareil.</p>`
    + `<div class="ligne"><button type="button" class="btn prim" data-action="google"${c.occupe ? ' disabled' : ''}>Continuer avec Google</button></div>`
    + `<input id="email" type="email" autocomplete="email" placeholder="E-mail" aria-label="E-mail">`
    + `<input id="mdp" type="password" autocomplete="current-password" placeholder="Mot de passe" aria-label="Mot de passe">`
    + `<div class="ligne"><button type="button" class="btn sec" data-action="connexion"${c.occupe ? ' disabled' : ''}>Se connecter</button><button type="button" class="btn sec" data-action="inscription"${c.occupe ? ' disabled' : ''}>Créer un compte</button></div>`
    + `<button type="button" class="lien" data-action="oubli">Mot de passe oublié</button>`
    + (c.erreur ? `<p class="erreur">${echap(c.erreur)}</p>` : '')
    + (c.info ? `<p class="discret">${echap(c.info)}</p>` : '')
    + `</section>`;
}

function regles(): string {
  return `<div class="voile-feuille" data-action="regles" aria-hidden="true"></div><section class="feuille regles" role="dialog" aria-modal="true" aria-labelledby="regles-titre"><span class="poignee" aria-hidden="true"></span>`
    + `<header class="feuille-tete"><div class="titres"><span class="surtitre">AIDE</span><h2 id="regles-titre">Comment on joue</h2></div><button type="button" class="btn-icone" data-action="regles" aria-label="Fermer">${ICO.fermer}</button></header><div class="feuille-corps"><ol class="liste-regles">`
    + `<li><b>Compose une chaîne.</b> Touche les Gestes de ta main (${REGLES.capaciteBase} places au départ), puis lance-la.</li>`
    + `<li><b>La force</b> est au milieu : ${ICO.atk} dégâts, ${ICO.bouclier} protection de l’escouade, ${ICO.soin} soin du plus blessé.</li>`
    + '<li><b>La Fréquence</b> est le chiffre dans la gemme. Des Fréquences qui se suivent dans l’ordre font une Résonance : suite de 3 = +30 %, de 4 = +60 %, de 5 = +100 %. Une flèche dorée marque le Geste qui prolonge ta suite.</li>'
    + `<li><b>L’Écho :</b> trois Fréquences identiques donnent un bouclier d’escouade de +${REGLES.bouclierEcho}.</li>`
    + '<li><b>Le Flux</b> se remplit à chaque Résonance. Dépense-le pour ajouter une place à ta chaîne ou repiocher ta main.</li>'
    + '<li><b>« 2 PL. »</b> : ce Geste est puissant mais occupe deux places.</li>'
    + '<li><b>Les effets</b> (Perçant, Siphon, Accord…) sont écrits en or. Pose le Geste dans la chaîne pour lire ce qu’il fait. « ∗ » : Fréquence libre, il prolonge toujours la suite.</li>'
    + '<li><b>Le triangle des lignées :</b> Tech bat Résonant, Résonant bat Géné, Géné bat Tech (+15 %).</li>'
    + '<li><b>L’ennemi annonce son attaque</b> en haut de l’écran : protège-toi ou finis-le avant.</li></ol></div></section>';
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
  const fs = frequencesEffectives(s.chaine);

  let conseil: string;
  if (s.dissonance) conseil = `<b>Fréquences brouillées</b> : pas de Résonance ce tour-ci. Mise sur la force brute ou la protection.`;
  else if (!s.chaine.length) conseil = `Choisis jusqu’à ${capacite(s)} Gestes. Des Fréquences qui se suivent (3, 4, 5) déclenchent une <b>Résonance</b>.`;
  else {
    const fin = serieFinale(s.chaine);
    const f = fs[fs.length - 1]!;
    if (a.suite >= 3) conseil = `<b>Résonance</b> : suite de ${a.suite}, effets <b>+${Math.round((a.mult - 1) * 100)} %</b>` + (a.suite < 5 && libres > 0 && fin === a.suite ? ` · un <b>${f + 1}</b> pour aller plus loin` : '');
    else if (fin === 2) conseil = `Suite ${f - 1} → ${f} : ajoute un <b>${f + 1}</b> pour +30 %`;
    else conseil = `Ajoute un <b>${f + 1}</b> pour commencer une suite`;
    if (a.echo) conseil += ` · Écho : bouclier +${REGLES.bouclierEcho}`;
    if (dernier?.effet) conseil += `<span class="effet-texte">${echap(NOMS_EFFET[dernier.effet.type])} : ${echap(libelleEffet(dernier.effet))}</span>`;
  }

  const ill = illustrationEnnemi(def.id);
  const classeIntention = it.type === 'atk' ? 'danger' : it.type === 'bouclier' || it.type === 'soin' ? 'garde' : 'boost';
  const iconeIntention = it.type === 'atk' ? ICO.atk : it.type === 'bouclier' ? ICO.bouclier : it.type === 'soin' ? ICO.soin : it.type === 'dissonance' ? ICO.flux : ICO.boost;
  const lieu = e.x.tutoriel ? 'Chambre scellée' : `Strate −${e.x.strate}`;

  let h = `<div class="ecran ecran-combat${verrou ? ' verrouille' : ''}">`;
  h += `<header class="combat-barre"><div class="puces"><span class="puce">${ICO.strate}${lieu}</span>`
    + (e.x.tutoriel ? '' : `<span class="puce">Combat ${e.x.index + 1}/${e.x.sequence.length}</span>`)
    + `<span class="puce">Tour ${s.tour}</span></div>`
    + `<button type="button" class="btn-icone" data-action="regles" aria-expanded="${e.regles}" aria-label="Règles">${ICO.aide}</button></header>`;

  // la scène de l'ennemi
  h += `<section class="scene-ennemi l-${def.lignee}" style="--fond:${FONDS[def.id] ?? '#2A2438'}" aria-label="Ennemi">`
    + (ill ? `<img class="ennemi-art" src="${ill}" alt="" decoding="async">` : `<span class="ennemi-art sans" aria-hidden="true"></span>`)
    + `<span class="scene-voile" aria-hidden="true"></span>${popsPour(e, 'ennemi')}`
    + `<div class="intention ${classeIntention}" aria-live="polite"><span class="int-ico">${iconeIntention}</span><span class="int-txt"><small>INTENTION</small>${echap(texteIntention(s))}</span></div>`
    + `<div class="ennemi-infos"><div class="tags"><span class="tag" style="--c:${COULEUR[def.lignee]}">${echap(def.tag)}</span><span class="faible" style="--c:${COULEUR[faible]}">Faible contre <b>${NOMS_LIGNEE[faible].court}</b></span></div>`
    + `<h2 class="ennemi-nom">${echap(def.nom)}</h2>`
    + `<div class="jauge-ennemi"><i style="width:${pct(s.ennemi.pv, s.ennemi.pvMax)}%"></i><span class="chiffre">${s.ennemi.pv} / ${s.ennemi.pvMax}</span></div>`
    + (s.ennemi.bouclier || s.ennemi.fissure ? `<div class="etats">${s.ennemi.bouclier ? `<span class="etat garde">${ICO.bouclier}${s.ennemi.bouclier}</span>` : ''}${s.ennemi.fissure ? `<span class="etat fissure">Fissure +${Math.round(s.ennemi.fissure * 100)} %</span>` : ''}</div>` : '')
    + `</div></section>`;

  // l'escouade
  h += '<section class="escouade-combat" aria-label="Escouade">';
  for (const p of s.porteurs) {
    const d = porteurDef(p.id);
    const ko = p.pv <= 0;
    const cible = !ko && it.type === 'atk' && (it.zone || it.cibleId === p.id);
    const img = portrait(d.id);
    const basPv = !ko && p.pv / p.pvMax <= 0.3;
    h += `<div class="combattant${ko ? ' ko' : ''}${cible ? ' cible' : ''}${basPv ? ' bas' : ''}" style="--c:${COULEUR[d.lignee]}">${popsPour(e, p.id)}`
      + `<span class="avatar${img ? '' : ' sans-portrait'}" style="--t:34px" aria-hidden="true">${img ? `<img src="${img}" alt="">` : `<b>${echap(d.nom.charAt(0))}</b>`}</span>`
      + `<div class="cb-infos"><span class="n">${echap(d.nom)}</span><div class="jauge-pv"><i class="pv" style="width:${pct(p.pv, p.pvMax)}%"></i></div><span class="chiffre">${ko ? 'À TERRE' : `${p.pv}/${p.pvMax}`}</span></div>`
      + (cible ? `<span class="marque-cible">${ICO.atk}CIBLE</span>` : '') + `</div>`;
  }
  h += `</section><div class="ligne-escouade">${popsPour(e, 'escouade')}<span class="etat garde${s.bouclier ? ' actif' : ''}">${ICO.bouclier}Bouclier ${s.bouclier}</span>`
    + `<span class="piles"><span title="Pioche">${ICO.cartes}${s.pioche.length}</span><span title="Défausse">${ICO.recycler}${s.defausse.length}</span></span></div>`;

  // la chaîne
  const mult = a.suite >= 3 ? `×${a.mult.toLocaleString('fr-BE')}` : '';
  h += `<section class="zone-chaine${a.suite >= 3 ? ' resonne' : ''}" aria-label="Chaîne"><div class="chaine-tete"><span class="surtitre">CHAÎNE · ${placesPrises(s)} / ${capacite(s)}</span>`
    + (mult ? `<span class="badge-reso">${ICO.flux}RÉSONANCE ${mult}</span>` : a.suite === 2 ? '<span class="badge-reso faible">SUITE EN COURS</span>' : '')
    + `</div><div class="rail">`;
  for (const g of s.chaine) h += geste(g, 'chaine', 'retirer', { off: verrou });
  for (let i = 0; i < libres; i++) h += `<span class="place-vide" aria-hidden="true">${i === 0 && dernier && !a.echo ? (fs[fs.length - 1]! + 1) : ''}</span>`;
  h += `</div><p class="conseil">${conseil}</p>`;
  if (!e.lecon) {
    h += `<div class="flux"><span class="surtitre">${ICO.flux}FLUX</span><div class="segments" role="img" aria-label="${s.flux} sur ${REGLES.fluxMax}">`
      + Array.from({ length: REGLES.fluxMax }, (_, i) => `<i class="${i < s.flux ? 'plein' : ''}"></i>`).join('') + '</div>'
      + `<button type="button" class="btn-flux" data-action="allonger"${verrou || s.flux < 1 || capacite(s) >= REGLES.capaciteMax ? ' disabled' : ''}>${ICO.place}+1 place</button>`
      + `<button type="button" class="btn-flux" data-action="repiocher"${verrou || s.flux < 1 ? ' disabled' : ''}>${ICO.repiocher}Repiocher</button></div>`;
  }
  h += `</section>`;

  if (e.lecon) h += `<section class="lecon" aria-live="polite"><span class="surtitre">${ICO.cristal}COMBAT GUIDÉ</span><p>${echap(e.lecon)}</p></section>`;

  // la main
  h += `<section class="zone-main" aria-label="Main"><div class="main-tete"><span class="surtitre">MAIN · ${s.main.length}</span><span class="journal-ligne">${echap(s.journal[0] ?? '')}</span></div><div class="main">`;
  for (const g of s.main) {
    const halo = !!dernier && (g.f === fs[fs.length - 1]! + 1 || g.effet?.type === 'accord') && places(g) <= libres;
    h += geste(g, 'main', 'ajouter', { halo, off: verrou, serre: places(g) > libres });
  }
  h += '</div></section>';

  h += `<footer class="actions-combat"><button type="button" class="btn sec" data-action="vider"${verrou || !s.chaine.length ? ' disabled' : ''}>${ICO.retirer}Retirer</button>`
    + `<button type="button" class="btn prim lancer${mult ? ' fort' : ''}" data-action="lancer"${verrou || !s.chaine.length ? ' disabled' : ''}>${ICO.lancer}Lancer la chaîne${mult ? ` <b>${mult}</b>` : ''}</button></footer>`;

  if (e.regles) h += regles();
  if (e.fin) {
    const victoire = !/Défaite|Repoussés/.test(e.fin.titre);
    h += `<div class="voile" role="dialog" aria-modal="true" aria-labelledby="fin-titre"><div class="fenetre fin ${victoire ? 'victoire' : 'defaite'}"><span class="surtitre">${victoire ? 'VICTOIRE' : 'L’ESCOUADE RECULE'}</span><h2 id="fin-titre">${echap(e.fin.titre)}</h2><p>${echap(e.fin.texte)}</p>`
      + `<button type="button" class="btn prim large" data-action="${e.fin.action}">${echap(e.fin.bouton)}</button>${e.fin.bouton2 ? `<button type="button" class="btn sec large" data-action="${e.fin.action2}">${echap(e.fin.bouton2)}</button>` : ''}</div></div>`;
  }
  return h + `</div>`;
}
