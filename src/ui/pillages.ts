// Les archipels voisins (26 octobre 2026) : la carte des pillages. La mer, ton archipel en bas, les archipels à portée
// autour, reliés par les routes des passeurs ; toucher un archipel affiche sa fiche juste dessous (garnison, chances, butin).
// Les règles sont dans src/core/partie/pillages.ts.

import { porteurDef } from '../core/donnees';
import { PILLAGE, butinPillage, chanceVictoire, ciblesDuJour, difficulte, escouadeActive, escouadeDefense, escouadePourDepart, escouadesDe, etatPillage, faitsDuJour, forceEscouade, majJetons, strateVaincue, type Cible, type EntreeHistorique, type Jeu } from '../core/jeu';
import { ageArchipel, vignetteArchipel, visuel } from './art';
import { avatar, coquille, decompte, ent, entete, NOM_LIGNEE, type EcranDistrict } from './coquille';
import { ICO, icone } from './icones';
import { echap } from './outils';
import { COULEUR } from './vue';

/** Les places des archipels sur la carte (en % de la carte), autour du tien, en bas au centre */
const PLACES: [number, number][] = [[16, 13], [50, 13], [84, 13], [14, 45], [50, 45], [86, 45]];
const MOI: [number, number] = [50, 80];


/** Les archipels de la carte et ce qu'il faut pour les afficher */
export function cartePillages(j: Jeu, now: number, enLigne: Cible[] = []) {
  const escouade = escouadePourDepart(j);
  const cibles = ciblesDuJour(j, escouade, now, enLigne);
  return { escouade, cibles, force: forceEscouade(j, escouade), faits: faitsDuJour(j, now) };
}

export function htmlPillages(e: EcranDistrict): string {
  const j = e.j;
  const prochain = majJetons(j, e.now);
  const etat = etatPillage(j);
  const { cibles, force, faits } = cartePillages(j, e.now, e.pillagesEnLigne ?? []);
  const choisie = cibles.find((c) => c.id === e.pillageCible) ?? cibles.find((c) => !faits.includes(c.id)) ?? cibles[0];

  let h = entete('Le Port · La mer des piliers', 'Archipels voisins', `<button type="button" class="btn-icone" data-action="archipel" aria-label="Retour au district">${ICO.retour}</button>`);

  // les jetons et le coffre : ce qu'on peut faire, ce qu'on risque
  h += `<section class="pl-etat" aria-label="Jetons et coffre">`
    + `<div class="pl-jetons"><span class="surtitre">${ICO.grappin}Jetons</span>`
    + `<span class="pl-gemmes" role="img" aria-label="${etat.jetons} jetons sur ${PILLAGE.jetonsMax}">${Array.from({ length: PILLAGE.jetonsMax }, (_, k) => `<i class="${k < etat.jetons ? 'plein' : ''}"></i>`).join('')}</span>`
    + `<small>${prochain ? decompte(prochain, e.now, 'Un de plus dans ') : 'Tous là : rien ne se perd.'}</small></div>`
    + `<div class="pl-coffre"><span class="surtitre">${icone('coffre')}Ton coffre</span><b>${ent(etat.coffre)}</b>`
    + `<small>composants gagnés en pillant : les seuls exposés</small></div></section>`;

  h += garde(j);

  // la carte
  const age = visuel(j.batiments.noyau);
  h += `<section class="pl-carte" aria-label="La carte des archipels"><svg class="pl-routes" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">`
    + cibles.map((c, k) => { const [x, y] = PLACES[k % PLACES.length]!; return `<line x1="${MOI[0]}" y1="${MOI[1]}" x2="${x}" y2="${y}" class="${c === choisie ? 'vise' : ''}${faits.includes(c.id) ? ' faite' : ''}"/>`; }).join('')
    + `</svg>`
    + cibles.map((c, k) => {
      const [x, y] = PLACES[k % PLACES.length]!;
      const d = difficulte(c.force / force);
      const fait = faits.includes(c.id);
      return `<button type="button" class="pl-ile d${d.niveau}${c === choisie ? ' choisie' : ''}${fait ? ' faite' : ''}" style="--x:${x}%;--y:${y}%" data-action="pillage-voir" data-id="${echap(c.id)}" aria-pressed="${c === choisie}" aria-label="${echap(`${c.nom} : ${fait ? 'déjà pillé aujourd’hui' : d.nom}`)}">`
        + `<span class="pl-medaillon"><img src="${vignetteArchipel(ageArchipel(c.strate))}" alt="" decoding="async" loading="lazy">${fait ? `<span class="pl-fait">${ICO.ok}</span>` : ''}</span>`
        + `<span class="pl-nom">${echap(c.nom)}</span><span class="pl-diff">${fait ? 'Pillé' : d.nom}</span></button>`;
    }).join('')
    + `<div class="pl-moi" style="--x:${MOI[0]}%;--y:${MOI[1]}%"><span class="pl-medaillon"><img src="${vignetteArchipel(age)}" alt="" decoding="async"></span><span class="pl-nom">${echap(j.directeur?.nom ?? 'Ton district')}</span></div>`
    + `</section>`;

  if (choisie) h += ficheCible(j, choisie, force, faits.includes(choisie.id), etat.jetons);
  h += journal(etat.historique ?? [], e.now);
  h += `<p class="pl-regle">${ICO.bouclier}<span>Ton archipel est défendu par ta garnison, même jeu fermé. Une attaque gagnée contre toi prend au plus ${Math.round(PILLAGE.partVolee * 100)} % de ton coffre, puis ${PILLAGE.bouclierMs / 3_600_000} h de bouclier ; ${PILLAGE.subiesMax} attaques par jour au plus. Tes autres composants, tes cartes et tes Éclats ne risquent rien.</span></p>`;
  return coquille(e, h, 'pl');
}

/** La garnison (27 octobre 2026) : l'escouade qui garde le port, au choix parmi les trois, et de quoi la composer */
function garde(j: Jeu): string {
  const toutes = escouadesDe(j);
  const def = escouadeDefense(j);
  return `<section class="pl-garde" aria-label="Ta garnison"><div class="pl-garde-tete"><span class="surtitre">${ICO.bouclier}Ta garnison · en défense</span>`
    + `<button type="button" class="pl-composer" data-action="garnison-modifier">${ICO.porteurs}Composer</button></div>`
    + `<div class="pl-garde-choix" role="radiogroup" aria-label="Escouade qui défend le port">`
    + toutes.map((l, k) => {
      const f = l.length ? Math.round(forceEscouade(j, l) * 100) : 0;
      return `<button type="button" role="radio" class="pl-garde-esc${k === def ? ' actif' : ''}${l.length ? '' : ' vide'}" data-action="defense-escouade" data-index="${k}" aria-checked="${k === def}"${l.length ? '' : ' disabled'}>`
        + `<strong>Escouade ${k + 1}</strong><span class="pl-garde-visages">${[0, 1, 2].map((i) => (l[i] ? avatar(l[i]!, 28) : '<i class="pl-garde-place"></i>')).join('')}</span>`
        + `<small>${l.length ? `Force ${f}` : 'Vide'}</small></button>`;
    }).join('') + `</div>`
    + `<small class="pl-garde-aide">Elle se défend seule quand d’autres directeurs t’attaquent. L’escouade qui attaque se choisit au départ du pillage${escouadeActive(j) === def ? ' : la même peut faire les deux' : ''}.</small></section>`;
}

/** Le journal du port (27 octobre 2026) : les derniers pillages faits et subis, du plus récent au plus ancien */
function journal(h: EntreeHistorique[], now: number): string {
  const ilYa = (le: number) => {
    const m = Math.floor((now - le) / 60_000);
    return m < 1 ? 'à l’instant' : m < 60 ? `il y a ${m} min` : m < 1440 ? `il y a ${Math.floor(m / 60)} h` : `il y a ${Math.floor(m / 1440)} j`;
  };
  const texte = (x: EntreeHistorique) => {
    const nom = `<b>${echap(x.nom)}</b>`;
    if (x.sens === 'attaque') return x.gagne ? `Tu as pillé ${nom}` : `${nom} a repoussé ton escouade`;
    if (x.refusee) return `${nom} s’est heurté à ton bouclier`;
    return x.gagne ? `Ta garnison a repoussé ${nom}` : `${nom} a pillé ton archipel`;
  };
  const lignes = h.slice(0, 10);
  return `<section class="pl-journal" aria-label="Journal du port"><span class="surtitre">${ICO.grappin}Journal du port</span>`
    + (lignes.length
      ? `<ul>${lignes.map((x) => `<li class="${x.sens}${x.gagne ? ' gagne' : ' perdu'}">`
        + `<span class="pl-j-ico" aria-label="${x.sens === 'attaque' ? 'Ton attaque' : 'Attaque subie'}">${x.sens === 'attaque' ? ICO.grappin : ICO.bouclier}</span>`
        + `<span class="pl-j-txt"><span>${texte(x)}</span><small>${x.sens === 'attaque' ? (x.bot ? 'Archipel sans directeur · ' : 'Directeur · ') : 'En défense · '}${ilYa(x.le)}</small></span>`
        + `<b class="pl-j-val${x.composants > 0 ? ' plus' : x.composants < 0 ? ' moins' : ''}">${x.composants > 0 ? '+' : x.composants < 0 ? '−' : ''}${x.composants ? ent(Math.abs(x.composants)) : '—'}</b></li>`).join('')}</ul>`
      : `<p class="pl-j-vide">Aucun pillage pour l’instant. Tes attaques et celles que ta garnison subit s’inscriront ici.</p>`)
    + `</section>`;
}

/** La fiche de l'archipel choisi : sa garnison, tes chances, ce que tu gagnes ou laisses */
function ficheCible(j: Jeu, c: Cible, force: number, fait: boolean, jetons: number): string {
  const ecart = c.force / force;
  const d = difficulte(ecart);
  const chance = Math.round(chanceVictoire(ecart) * 100);
  const butin = butinPillage(c, ecart);
  const perte = Math.floor(etatPillage(j).coffre * PILLAGE.perteDefaite);
  const raison = fait ? 'Déjà pillé aujourd’hui : il reviendra demain.' : jetons < 1 ? 'Plus de jeton : le prochain revient bientôt.' : j.expedition ? 'Une expédition est déjà en cours.' : '';
  return `<section class="pl-fiche d${d.niveau}" aria-label="${echap(c.nom)}">`
    + `<header><div><span class="surtitre">${c.bot ? 'Archipel sans directeur · un intendant le tient' : 'Directeur'} · Strate −${c.strate}</span><h2>${echap(c.nom)}</h2></div>`
    + `<span class="pl-badge">${d.nom}<small>${chance < 1 ? '< 1' : chance > 99 ? '> 99' : chance} % de chances</small></span></header>`
    + `<div class="pl-garnison"><span class="surtitre">La garnison</span><ul>${c.porteurs.map((id) => `<li style="--c:${COULEUR[porteurDef(id).lignee]}">${avatar(id, 40)}<span><strong>${echap(porteurDef(id).nom)}</strong><small>${NOM_LIGNEE[porteurDef(id).lignee]}</small></span></li>`).join('')}</ul>`
    + `<div class="pl-forces"><span>Garnison <b>${Math.round(c.force * 100)}</b></span><span class="pl-jauge" aria-hidden="true"><i style="width:${Math.min(100, Math.round((50 * c.force) / force))}%"></i></span><span>Escouade ${escouadeActive(j) + 1} <b>${Math.round(force * 100)}</b></span></div></div>`
    + `<dl class="pl-enjeu"><div class="pl-gain"><dt>Si tu gagnes</dt><dd>${ICO.composants}<b>+${ent(butin.base + butin.vol)}</b><small>${butin.vol ? `dont ${ent(butin.vol)} pris à son coffre` : 'composants'}</small></dd></div>`
    + `<div class="pl-perte"><dt>Si tu perds</dt><dd>${ICO.composants}<b>${perte ? `−${ent(perte)}` : '0'}</b><small>${Math.round(PILLAGE.perteDefaite * 100)} % de ton coffre</small></dd></div></dl>`
    + (raison ? `<p class="pl-raison">${ICO.verrou}${raison}</p>` : `<p class="pl-raison pl-suite">${ICO.porteurs}Tu choisis l’escouade qui attaque à l’étape suivante.</p>`)
    + `<button type="button" class="btn prim large" data-action="pillage-preparer" data-id="${echap(c.id)}"${raison ? ' disabled' : ''}>${ICO.grappin}Préparer le pillage</button></section>`;
}

/** Le Port est ouvert : la Strate −1 est vaincue, le bateau peut quitter le ponton */
export const portOuvert = (j: Jeu) => j.chambre && strateVaincue(j) >= PILLAGE.strateMin;
