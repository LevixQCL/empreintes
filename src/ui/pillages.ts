// Le Port (26 octobre 2026, onglet à part le 28) : sa présentation à la première visite, puis deux volets,
// les pillages et les missions en mer. Les archipels voisins : la carte des pillages. La mer, ton archipel en bas, les archipels à portée
// autour, reliés par les routes des passeurs ; toucher un archipel affiche sa fiche juste dessous (garnison, chances, butin).
// Les règles sont dans src/core/partie/pillages.ts.

import { porteurDef } from '../core/donnees';
import { PILLAGE, achatsRestants, coutJeton, butinPillage, chanceVictoire, difficulte, escouadeActive, escouadeDefense, escouadesDe, etatPillage, forceEscouade, majJetons, MISSIONS, barquesMax, MAREES, contratsDuMoment, mareesDe, type Cible, type EntreeHistorique, type Jeu } from '../core/jeu';
import { ageArchipel, vignetteArchipel, vignetteDistrict, visuel } from './art';
import { avatar, coquille, decompte, ent, entete, NOM_LIGNEE, type EcranDistrict } from './coquille';
import { bloc, cle, etape, replie } from './presentation';
import { ICO, icone } from './icones';
import { htmlMissions } from './district';
import { htmlMarees } from './marees';
import { echap } from './outils';
import { cartePillages, pillagesOuverts, portOuvert } from './acces';
import { COULEUR } from './vue';
import { t } from '../core/i18n';

/** Les places des archipels sur la carte (en % de la carte), autour du tien, en bas au centre */
const PLACES: [number, number][] = [[16, 13], [50, 13], [84, 13], [14, 45], [50, 45], [86, 45]];
const MOI: [number, number] = [50, 80];


export function htmlPillages(e: EcranDistrict): string {
  const j = e.j;
  // la présentation (28 octobre 2026) : Port fermé, première visite, ou rouverte par le « ? »
  const pres = !portOuvert(j) ? 'fermee' : !j.portVu ? 'premiere' : e.portAide ? 'aide' : null;
  const aide = pres ? '' : `<button type="button" class="btn-icone" data-action="port-aide" aria-label="${t`Comment marche le Port`}">${ICO.aide}</button>`;
  let h = entete(t('La mer des piliers'), t('Le Port'), aide);
  if (pres) return coquille(e, h + presentation(pres, pillagesOuverts(j)), 'pl pl-pres');

  // deux volets : les pillages et les missions en mer
  const pillOk = pillagesOuverts(j);
  const volet = e.voletPort ?? (pillOk ? 'pillages' : 'missions');
  const enMer = j.missions.length;
  majJetons(j, e.now);
  const seg = (id: 'pillages' | 'missions' | 'marees', nom: string, plus: string) =>
    `<button type="button" role="tab" class="seg${volet === id ? ' actif' : ''}" data-action="port-volet" data-id="${id}" aria-selected="${volet === id}">${nom}<small>${plus}</small></button>`;
  // les contrats de marée (31 octobre 2026) : un troisième volet ; le compte des contrats encore à remplir
  const marees = contratsDuMoment(j, e.now);
  const aRemplir = marees.filter((c) => c.ouvert && !c.reussi).length;
  const gabare = mareesDe(j).contrat;
  h += `<div class="segments-choix trois pl-volets" role="tablist" aria-label="${t`Pillages, missions en mer ou contrats de marée`}">`
    + seg('pillages', t('Pillages'), pillOk ? t`${etatPillage(j).jetons} / ${PILLAGE.jetonsMax} jetons` : t`dès la Strate −${PILLAGE.strateMin}`)
    + seg('missions', t('Missions'), t`${enMer} / ${barquesMax(j)} en mer`)
    + seg('marees', t('Marées'), gabare ? t('gabare en mer') : marees.some((c) => c.ouvert) ? t`${aRemplir} à remplir` : t`dès la Strate −${MAREES.montante.strate}`) + `</div>`;
  if (volet === 'missions') return coquille(e, h + htmlMissions(e), 'pl');
  if (volet === 'marees') return coquille(e, h + htmlMarees(e), 'pl');
  // pas encore de pillages : la raison, tirée du district, plutôt qu'une carte grisée
  if (!pillOk) return coquille(e, h + `<p class="fl-condition">${ICO.verrou}<span><strong>${t`Les districts voisins attendent · vaincs le gardien de la Strate −${PILLAGE.strateMin}`}</strong>`
    + `<small>${t`Le passeur ne mène pas de grappin chez les voisins pour un district qu’on ne connaît pas encore. Les missions en mer, elles, partent déjà.`}</small></span></p>`, 'pl');

  const prochain = majJetons(j, e.now);
  const etat = etatPillage(j);
  const { cibles, force, faits } = cartePillages(j, e.now, e.pillagesEnLigne ?? []);
  const choisie = cibles.find((c) => c.id === e.pillageCible) ?? cibles.find((c) => !faits.includes(c.id)) ?? cibles[0];

  // les jetons et le coffre : ce qu'on peut faire, ce qu'on risque
  h += `<section class="pl-etat" aria-label="${t`Jetons et coffre`}">`
    + `<div class="pl-jetons"><span class="surtitre">${ICO.grappin}${t`Jetons`}</span>`
    + `<span class="pl-gemmes" role="img" aria-label="${t`${etat.jetons} jetons sur ${PILLAGE.jetonsMax}`}">${Array.from({ length: PILLAGE.jetonsMax }, (_, k) => `<i class="${k < etat.jetons ? 'plein' : ''}"></i>`).join('')}</span>`
    + `<small>${prochain ? decompte(prochain, e.now, t('Un de plus dans ')) : t('Tous là : rien ne se perd.')}</small>${boutonAchat(j, e.now, etat.jetons)}</div>`
    + `<div class="pl-coffre"><span class="surtitre">${icone('coffre')}${t`Ton coffre`}</span><b>${ent(etat.coffre)}</b>`
    + `<small>${t`minerai gagné en pillant : le seul exposé`}</small></div></section>`;

  // la carte d'abord (audit du 7 novembre 2026 : elle arrivait en bas de l'écran), la garnison dessous
  // la carte
  const age = visuel(j.batiments.noyau);
  h += `<section class="pl-carte" aria-label="${t`La carte des districts voisins`}"><svg class="pl-routes" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">`
    + cibles.map((c, k) => { const [x, y] = PLACES[k % PLACES.length]!; return `<line x1="${MOI[0]}" y1="${MOI[1]}" x2="${x}" y2="${y}" class="${c === choisie ? 'vise' : ''}${faits.includes(c.id) ? ' faite' : ''}"/>`; }).join('')
    + `</svg>`
    + cibles.map((c, k) => {
      const [x, y] = PLACES[k % PLACES.length]!;
      const d = difficulte(c.force / force);
      const fait = faits.includes(c.id);
      return `<button type="button" class="pl-ile d${d.niveau}${c === choisie ? ' choisie' : ''}${fait ? ' faite' : ''}" style="--x:${x}%;--y:${y}%" data-action="pillage-voir" data-id="${echap(c.id)}" aria-pressed="${c === choisie}" aria-label="${echap(`${c.nom} : ${fait ? t('déjà pillé aujourd’hui') : d.nom}`)}">`
        + `<span class="pl-medaillon"><img src="${vignetteArchipel(ageArchipel(c.strate), c.id, true)}" alt="" decoding="async" loading="lazy">${fait ? `<span class="pl-fait">${ICO.ok}</span>` : ''}</span>`
        + `<span class="pl-nom">${echap(c.nom)}</span><span class="pl-diff">${fait ? t('Pillé') : d.nom}</span></button>`;
    }).join('')
    + `<div class="pl-moi" style="--x:${MOI[0]}%;--y:${MOI[1]}%"><span class="pl-medaillon"><img src="${vignetteDistrict(age)}" alt="" decoding="async"></span><span class="pl-nom">${echap(j.directeur?.nom ?? t('Ton district'))}</span></div>`
    + `</section>`;

  if (choisie) h += ficheCible(j, choisie, force, faits.includes(choisie.id), etat.jetons);
  h += garde(j);
  h += journal(etat.historique ?? [], e.now);
  h += `<p class="pl-regle">${ICO.bouclier}<span>${t`Ton district est défendu par ta garnison, même jeu fermé. Une attaque gagnée contre toi prend au plus ${Math.round(PILLAGE.partVolee * 100)} % de ton coffre, puis ${PILLAGE.bouclierMs / 3_600_000} h de bouclier ; ${PILLAGE.subiesMax} attaques par jour au plus. Le reste de ton minerai, tes cristaux, tes cartes et tes Éclats ne risquent rien.`}</span></p>`;
  return coquille(e, h, 'pl');
}

/** La garnison (27 octobre 2026) : l'escouade qui garde le port, au choix parmi les trois, et de quoi la composer */
function garde(j: Jeu): string {
  const toutes = escouadesDe(j);
  const def = escouadeDefense(j);
  return `<section class="pl-garde" aria-label="${t`Ta garnison`}"><div class="pl-garde-tete"><span class="surtitre">${ICO.bouclier}${t`Ta garnison · en défense`}</span>`
    + `<button type="button" class="pl-composer" data-action="garnison-modifier">${ICO.porteurs}${t`Composer`}</button></div>`
    + `<div class="pl-garde-choix" role="radiogroup" aria-label="${t`Escouade qui défend le port`}">`
    + toutes.map((l, k) => {
      const f = l.length ? Math.round(forceEscouade(j, l) * 100) : 0;
      return `<button type="button" role="radio" class="pl-garde-esc${k === def ? ' actif' : ''}${l.length ? '' : ' vide'}" data-action="defense-escouade" data-index="${k}" aria-checked="${k === def}"${l.length ? '' : ' disabled'}>`
        + `<strong>${t`Escouade ${k + 1}`}</strong>${l.length ? `<span class="pl-garde-visages">${[0, 1, 2].map((i) => (l[i] ? avatar(l[i]!, 28) : '<i class="pl-garde-place"></i>')).join('')}</span>` : '<span class="esc-serti" aria-hidden="true"></span>'}`
        + `<small>${l.length ? `Force ${f}` : t('À former')}</small></button>`;
    }).join('') + `</div>`
    + `<small class="pl-garde-aide">${t`Elle se défend seule quand d’autres directeurs t’attaquent. L’escouade qui attaque se choisit au départ du pillage${escouadeActive(j) === def ? t(' : la même peut faire les deux') : ''}.`}</small></section>`;
}

/** Le journal du port (27 octobre 2026) : les derniers pillages faits et subis, du plus récent au plus ancien */
function journal(h: EntreeHistorique[], now: number): string {
  const ilYa = (le: number) => {
    const m = Math.floor((now - le) / 60_000);
    return m < 1 ? t('à l’instant') : m < 60 ? t`il y a ${m} min` : m < 1440 ? `il y a ${Math.floor(m / 60)} h` : `il y a ${Math.floor(m / 1440)} j`;
  };
  const texte = (x: EntreeHistorique) => {
    const nom = `<b>${echap(x.nom)}</b>`;
    if (x.sens === 'attaque') return x.gagne ? t`Tu as pillé ${nom}` : t`${nom} a repoussé ton escouade`;
    if (x.refusee) return t`${nom} s’est heurté à ton bouclier`;
    return x.gagne ? t`Ta garnison a repoussé ${nom}` : t`${nom} a pillé ton district`;
  };
  const lignes = h.slice(0, 10);
  return `<section class="pl-journal" aria-label="${t`Journal du port`}"><span class="surtitre">${ICO.grappin}${t`Journal du port`}</span>`
    + (lignes.length
      ? `<ul>${lignes.map((x) => `<li class="${x.sens}${x.gagne ? ' gagne' : ' perdu'}">`
        + `<span class="pl-j-ico" aria-label="${x.sens === 'attaque' ? t('Ton attaque') : t('Attaque subie')}">${x.sens === 'attaque' ? ICO.grappin : ICO.bouclier}</span>`
        + `<span class="pl-j-txt"><span>${texte(x)}</span><small>${x.sens === 'attaque' ? (x.bot ? t('District sans directeur · ') : 'Directeur · ') : t('En défense · ')}${ilYa(x.le)}</small></span>`
        + `<b class="pl-j-val${x.composants > 0 ? ' plus' : x.composants < 0 ? ' moins' : ''}">${x.composants > 0 ? '+' : x.composants < 0 ? '−' : ''}${x.composants ? ent(Math.abs(x.composants)) : '—'}</b></li>`).join('')}</ul>`
      : `<p class="pl-j-vide">${t`Aucun pillage pour l’instant. Tes attaques et celles que ta garnison subit s’inscriront ici.`}</p>`)
    + `</section>`;
}

/** La fiche de l'archipel choisi : sa garnison, tes chances, ce que tu gagnes ou laisses */
function ficheCible(j: Jeu, c: Cible, force: number, fait: boolean, jetons: number): string {
  const ecart = c.force / force;
  const d = difficulte(ecart);
  const chance = Math.round(chanceVictoire(ecart) * 100);
  const butin = butinPillage(c, ecart);
  const perte = Math.floor(etatPillage(j).coffre * PILLAGE.perteDefaite);
  const raison = fait ? t('Déjà pillé aujourd’hui : il reviendra demain.') : jetons < 1 ? t('Plus de jeton : le prochain revient bientôt.') : j.expedition ? t('Une expédition est déjà en cours.') : '';
  return `<section class="pl-fiche d${d.niveau}" aria-label="${echap(c.nom)}">`
    + `<header><div><span class="surtitre">${t`${c.bot ? t('District sans directeur · un intendant le tient') : t('Directeur')} · Strate −${c.strate}`}</span><h2>${echap(c.nom)}</h2></div>`
    + `<span class="pl-badge">${d.nom}<small>${t`${chance < 1 ? '< 1' : chance > 99 ? '> 99' : chance} % de chances`}</small></span></header>`
    + `<div class="pl-garnison"><span class="surtitre">${t`La garnison`}</span><ul>${c.porteurs.map((id) => `<li style="--c:${COULEUR[porteurDef(id).lignee]}">${avatar(id, 40)}<span><strong>${echap(porteurDef(id).nom)}</strong><small>${NOM_LIGNEE[porteurDef(id).lignee]}</small></span></li>`).join('')}</ul>`
    + `<div class="pl-forces"><span>${t`Garnison`} <b>${Math.round(c.force * 100)}</b></span><span class="pl-jauge" aria-hidden="true"><i style="width:${Math.min(100, Math.round((50 * c.force) / force))}%"></i></span><span>${t`Escouade ${escouadeActive(j) + 1}`} <b>${Math.round(force * 100)}</b></span></div></div>`
    + `<dl class="pl-enjeu"><div class="pl-gain"><dt>${t`Si tu gagnes`}</dt><dd>${ICO.composants}<b>+${ent(butin.base + butin.vol)}</b><small>${butin.vol ? t`dont ${ent(butin.vol)} pris à son coffre` : 'composants'}</small></dd></div>`
    + `<div class="pl-perte"><dt>${t`Si tu perds`}</dt><dd>${ICO.composants}<b>${perte ? `−${ent(perte)}` : '0'}</b><small>${t`${Math.round(PILLAGE.perteDefaite * 100)} % de ton coffre`}</small></dd></div></dl>`
    + (raison ? `<p class="pl-raison">${ICO.verrou}${raison}</p>` : `<p class="pl-raison pl-suite">${ICO.porteurs}${t`Tu choisis l’escouade qui attaque à l’étape suivante.`}</p>`)
    + `<button type="button" class="btn prim large" data-action="pillage-preparer" data-id="${echap(c.id)}"${raison ? ' disabled' : ''}>${ICO.grappin}${t`Préparer le pillage`}</button></section>`;
}


/**
 * La présentation du Port (28 octobre 2026, Bryan : « refais tout convenablement ») : son histoire, les missions en mer,
 * les pillages et la défense. Montrée tant que le Port est fermé, à la première visite, puis à la demande (« ? »).
 */
function presentation(etat: 'fermee' | 'premiere' | 'aide', pillOk = true): string {
  const recharge = `${Math.floor(PILLAGE.rechargeMs / 3_600_000)} h ${Math.round((PILLAGE.rechargeMs % 3_600_000) / 60_000)}`;
  const vole = `+${Math.round(PILLAGE.partVolee * 100)} %`, perte = `−${Math.round(PILLAGE.perteDefaite * 100)} %`;
  return `<section class="fl-intro pl-intro" style="--decor:url(${vignetteArchipel(2, 'intro')})"><div class="fl-intro-texte">`
    + `<span class="surtitre">${t`Le Port du district`}</span><h2>${t`Le Port reprend du service`}</h2>`
    + `<p>${t`Devant le sas de la digue, sur ses pilotis, le Port voit partir les barques du passeur : vers les ruines noyées, et vers les cuvettes voisines.`}</p></div></section>`
    + (etat === 'fermee' ? `<p class="fl-condition">${ICO.verrou}<span><strong>${t`Le bateau reste à quai · vaincs le gardien de la Strate −${PILLAGE.strateDuPort}`}</strong><small>${t`Tant que le gardien tient le puits, personne ne quitte le district.`}</small></span></p>` : '')

    // allégé le 28 octobre 2026 : une phrase et trois chiffres par bloc, le détail se déplie
    + bloc(ICO.porteurs, t('Les missions en mer'), t('Un Porteur libre part en barque et revient chargé, même jeu fermé.'), [
      cle(ICO.chrono, `${MISSIONS.courte.heures} · ${MISSIONS.longue.heures} h`, t('courte ou longue')),
      cle(ICO.porteurs, t`${1} à ${4}`, t('barques à la fois, selon la Tour')),
      cle(ICO.coffre, t('Butin'), t('minerai, cartes, creuseurs')),
    ])
    // allégé le 4 novembre 2026 : tant que les pillages sont fermés, une ligne au lieu de deux blocs de règles
    + (!pillOk ? `<p class="fl-condition">${ICO.grappin}<span><strong>${t`Pillages et défense du port · après la Strate −${PILLAGE.strateMin}`}</strong><small>${t`Les districts voisins ne te prennent pas encore au sérieux. Le détail est dans « Les règles en détail ».`}</small></span></p>` : '')
    + (!pillOk ? '' : bloc(ICO.grappin, t('Les pillages'), t('Ton escouade attaque la garnison d’un district voisin de ta force.'), [
      cle(ICO.grappin, String(PILLAGE.jetonsMax), t`jetons, un toutes les ${recharge}`),
      cle(ICO.composants, vole, t('du coffre adverse')),
      cle(ICO.descendre, perte, t('de ton coffre si tu perds')),
    ])
    + bloc(ICO.bouclier, t('Ta défense'), t('Seul ton coffre est exposé, et ta garnison se défend seule.'), [
      cle(ICO.coffre, t('Coffre'), t('gains de pillage seulement')),
      cle(ICO.bouclier, `${PILLAGE.bouclierMs / 3_600_000} h`, t('de bouclier après une défaite')),
      cle(ICO.atk, String(PILLAGE.subiesMax), t('attaques subies par jour au plus')),
    ]))

    + replie(t('L’histoire'), `<p>${t`Quand la mer est montée, chaque quartier s’est accroché à ses piliers ; le tien s’est retranché derrière sa digue. Entre eux, il ne reste que l’eau, les ruines de l’ancien monde, et les passeurs qui connaissent les courants.`}</p>`
      + `<p>${t`Les Accords de 2101 interdisent d’aborder les Hauts. Mais entre districts d’en bas, personne n’a jamais rien signé : on pille, on se défend, et chacun garde un œil sur son coffre.`}</p>`)
    + replie(t('Les règles en détail'), `<ul class="fl-pr-etapes">`
      + etape(ICO.porteurs, t('Un Porteur libre prend la barque'), t`Vers un pilier abandonné ou une ruine noyée : ${MISSIONS.courte.heures} h ou ${MISSIONS.longue.heures} h, sans rien payer : seulement le temps du Porteur. Le nombre de barques en mer en même temps grandit avec la Tour du Noyau : 1, puis 2 au niveau 3, 3 au niveau 6 et 4 au niveau 9.`)
      + etape(ICO.coffre, t('Il revient chargé'), t('Du minerai, des doublons de cartes de sa lignée, parfois une carte nouvelle, et des rescapés qui deviennent creuseurs. L’eau froide laisse un peu d’Usure.'))
      + etape(ICO.grappin, t`${PILLAGE.jetonsMax} jetons, un toutes les ${recharge}`, t('Chaque pillage en coûte un. Rien ne se perd pendant ton absence : ils t’attendent.'))
      + etape(ICO.atk, t('Un combat contre la garnison'), t('Des districts de ta force : de vrais directeurs, et des districts sans directeur pour que la carte ne soit jamais vide. Un district par jour au plus.'))
      + etape(ICO.composants, t('Le butin'), t`Du minerai, plus ${vole.slice(1)} du coffre adverse. Plus la garnison est forte, plus le butin est gros. Perdre te coûte ${perte.slice(1)} de ton coffre.`)
      + etape(ICO.coffre, t('Seul ton coffre est exposé'), t('Le coffre, c’est le minerai gagné en pillant, tant que le Générateur ne l’a pas taillé. Celui des descentes, des missions, et tous tes cristaux sont à l’abri, comme tes cartes et tes Éclats.'))
      + etape(ICO.porteurs, t('Ta garnison se défend seule'), t('Choisis laquelle de tes trois escouades garde le port. Elle se bat même jeu fermé.'))
      + etape(ICO.bouclier, t('Bouclier et limite'), t`Après une attaque perdue, ${PILLAGE.bouclierMs / 3_600_000} h de bouclier ; ${PILLAGE.subiesMax} attaques par jour au plus. Le journal du port garde tout.`)
      + `</ul>`, ICO.aide)

    + (etat === 'fermee' ? ''
      : `<button type="button" class="btn prim large" data-action="port-entrer">${ICO.carte}${etat === 'premiere' ? t('Larguer les amarres') : t('Retour au Port')}</button>`);
}

/** Un jeton de plus contre des cristaux (31 octobre 2026) : visible seulement quand il en manque */
function boutonAchat(j: Jeu, now: number, jetons: number): string {
  if (jetons >= PILLAGE.jetonsMax || j.batiments.generateur < 1) return '';
  const reste = achatsRestants(j, now);
  const cout = coutJeton(j);
  const peut = reste > 0 && j.energie >= cout;
  return `<button type="button" class="btn sec pl-achat" data-action="pillage-jeton"${peut ? '' : ' disabled'} aria-label="${t`Acheter un jeton pour ${cout} cristaux, encore ${reste} aujourd’hui`}">`
    + `<span class="pl-achat-l">${t`+1 jeton · ${ent(cout)}`} ${icone('energie')}</span><small>${reste ? t`${reste} / ${PILLAGE.achatsJour} aujourd’hui` : t('demain')}</small></button>`;
}
