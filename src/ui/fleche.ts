// La Flèche d'amarrage (28 octobre 2026) : son onglet. La flèche dessinée de bas en haut à gauche (les quais gravés,
// le quai de l'escouade, le record), à droite où l'on en est ; puis les gardiens du prochain quai, les chances,
// ce qu'on gagne ou perd, et les quais gravés avec leurs récompenses. Les règles sont dans src/core/partie/fleche.ts.

import { GARDES_FLC, ennemiDef, porteurDef } from '../core/donnees';
import { ASCENSION, chanceQuai, chanceVictoire, cibleDefiDe, etatFleche, FLECHE, flecheOuverte, forceEscouade, forceGarnison, forceQuai, gageEnCaisse, gageJour, gardiensQuai, voixDuQuartier, jourDe, pas, plancher, prochainPalier, quaiLibreDe, quaiMaxTenable, escouadePourDepart, type EtatFleche, type GardienQuai, type Jeu, strateVaincue } from '../core/jeu';
import { avatar, coquille, ent, entete, NOM_LIGNEE, type EcranDistrict } from './coquille';
import { bloc, cle, etape, replie } from './presentation';
import { ICO } from './icones';
import { artFleche, fondFleche, miniature } from './art';

/** Les chefs de quai : ils mènent le trio au combat qui passe un quai gravé */
const CHEFS = new Set(GARDES_FLC.filter((g) => g.hauteur === 'chef').map((g) => g.id));
import { echap } from './outils';
import { visageGarde } from './acces';
import { COULEUR } from './vue';
import { t } from '../core/i18n';

/**
 * La Flèche peinte (30 octobre 2026, Bryan : « refaire un truc entièrement original ») : où se trouve un quai sur
 * l'image de la Flèche entière, en % de sa hauteur depuis le haut (le pied posé sur la mer, le sommet sous l'île).
 */
const PIED = 90;
const SOMMET = 13;
const hauteur = (q: number) => PIED - ((Math.min(FLECHE.quais, Math.max(1, q)) - 1) / (FLECHE.quais - 1)) * (PIED - SOMMET);

/** Le récit des Îles ouvertes (arc « Sous la ligne », 29 octobre 2026) : il s'ouvre une fois le Premier Porteur vaincu (−10) */
const recitOuvert = (j: Jeu) => strateVaincue(j) >= 10;

export function htmlFleche(e: EcranDistrict): string {
  const j = e.j;
  const ouverte = flecheOuverte(j);
  // la présentation : Flèche fermée, première visite (rien n'est encore noté), ou à la demande
  const pres = !ouverte ? 'fermee' : !j.fleche ? 'premiere' : e.flecheAide ? 'aide' : null;
  const aide = pres ? '' : `<button type="button" class="btn-icone" data-action="fleche-aide" aria-label="${t`Comment marche la Flèche`}">${ICO.aide}</button>`;
  let h = entete(t('Les Hauts · Flèche d’amarrage'), t('La Flèche'), aide);
  if (pres) return coquille(e, h + presentation(pres, recitOuvert(j)), 'fle fle-pres');
  const f = etatFleche(j);
  const sommet = f.quai >= FLECHE.quais;
  const suivant = prochainPalier(f.quai);

  // la Flèche peinte et où l'on en est
  // deux colonnes sur PC (30 octobre 2026) : à gauche la Flèche et ses quais, à droite la montée et la garde ; sur téléphone, une seule file
  h += `<div class="fl-col fl-g"><section class="fl-tete">${fleche(j, f, e.gardiens?.top ?? [])}<div class="fl-ou">`
    + `<span class="surtitre">${ICO.tour}${t`Ton escouade tient`}</span>`
    + `<p class="fl-quai"><small>${t`Quai`}</small><b>${f.quai}</b><em>/ ${FLECHE.quais}</em></p>`
    + `<dl class="fl-chiffres"><div><dt>${t`Record`}</dt><dd>${f.record}</dd></div><div><dt>${t`Gagnés`}</dt><dd>${f.victoires}</dd></div><div><dt>${t`Perdus`}</dt><dd>${f.defaites}</dd></div></dl>`
    + (suivant ? `<p class="fl-palier">${ICO.cristal}<span>${t`Prochain quai gravé :`} <b>${suivant}</b>${f.recus.includes(suivant) ? '' : ` · ${recompense(suivant)}`}</span></p>` : '')
    + `</div></section>`;

  // ceux qui te suivent (31 octobre 2026) : tant que le fond n'a pas parlé (−10), ils rappellent que l'eau vient d'en bas
  const voix = voixDuQuartier(j, jourDe(e.now));
  if (voix) h += `<blockquote class="fl-voix"><span class="surtitre">${ICO.porteurs}${t`Ceux qui te suivent`}</span><p>${echap(voix.texte)}</p><cite>${echap(voix.qui)}</cite>`
    + `<small>${t`Le récit des îles s’ouvrira quand le fond aura parlé : vaincs le gardien de la Strate −10.`}</small></blockquote>`;
  // l'histoire : la montée contre les gardiens payés ; puis la compétition : la garde, le défi, les gardiens
  h += paliers(f.quai, f.recus);
  if (!sommet) h += sieges(false);
  h += `<p class="fl-regle">${ICO.chrono}<span>${t`Pas de jeton : monte autant que tu veux. La Clinique soigne l’Usure entre deux assauts.`}</span></p></div>`;
  h += `<div class="fl-col fl-d">${sommet ? sieges(true) : assaut(j, f.quai, f.record)}${competition(e, f)}</div>`;
  return coquille(e, h, 'fle');
}

/**
 * La Flèche peinte : l'image de la Flèche entière (le même tableau flouté derrière, pour remplir la largeur),
 * les plaques des quais gravés de part et d'autre du fût, les fanions des quais tenus, et le médaillon de l'escouade
 * (le portrait de son chef) à la hauteur de son quai.
 */
function fleche(j: Jeu, f: EtatFleche, top: GardienQuai[]): string {
  const chef = escouadePourDepart(j)[0] ?? 'ilka';
  const mini = miniature(chef);
  const fanions = [
    ...top.filter((g) => !(f.garde && g.quai === f.garde.quai && g.depuis === f.garde.depuis)).slice(0, 4)
      .map((g) => `<i class="fl-fanion autre" style="--y:${hauteur(g.quai)}%" title="${t`${echap(g.nom)} · quai ${g.quai}`}"></i>`),
    ...(f.garde ? [`<i class="fl-fanion moi" style="--y:${hauteur(f.garde.quai)}%" title="${t`Ton quai : ${f.garde.quai}`}"></i>`] : []),
  ];
  return `<div class="fl-scene" style="--decor:url(${artFleche('fleche-entiere')});--plaque:url(${artFleche('plaque')});--fanion:url(${artFleche('fanion')});--medaillon:url(${artFleche('medaillon')})" role="img" aria-label="${t`La Flèche : ton escouade au quai ${f.quai} sur ${FLECHE.quais}, record ${f.record}${f.garde ? t`, tu tiens le quai ${f.garde.quai}` : ''}`}">`
    + `<div class="fl-vue">`
    + FLECHE.paliers.map((p, i) => `<i class="fl-plaque${p <= f.record ? ' atteint' : ''}${i % 2 ? ' d' : ' g'}" style="--y:${hauteur(p)}%"><em>${p}</em></i>`).join('')
    + fanions.join('')
    + `<b class="fl-esc" style="--y:${hauteur(f.quai)}%">${mini ? `<img src="${mini}" alt="" decoding="async">` : ''}</b>`
    + `</div></div>`;
}

const recompense = (q: number) => {
  const r = ASCENSION.recompenses[q];
  return r ? `${ICO.energie}${ent(r.composants)} ${ICO.eclats}${r.eclats}` : '';
};

/** Les gardiens du prochain quai, les chances, et l'enjeu */
function assaut(j: Jeu, quai: number, record: number): string {
  const escouade = escouadePourDepart(j);
  const force = forceEscouade(j, escouade);
  const gardiens = gardiensQuai(quai);
  const fq = forceQuai(quai);
  const chance = Math.round(chanceQuai(force, quai) * 100);
  const niveau = chance >= 85 ? 1 : chance >= 50 ? 2 : chance >= 15 ? 3 : 4;
  const nomNiveau = [t('Facile'), t('Équilibré'), t('Risqué'), t('Redoutable')][niveau - 1];
  const haut = Math.min(FLECHE.quais, quai + pas(quai));
  const bas = Math.max(plancher(record), quai - pas(quai));
  const raison = j.expedition ? t('Une expédition est déjà en cours.') : '';
  return `<section class="fl-assaut d${niveau}" aria-label="${t`Le quai ${quai}`}">`
    + `<div class="fl-passerelle" style="--decor:url(${artFleche('passerelle')})" aria-hidden="true"></div>`
    + `<header><div><span class="surtitre">${t`La montée · gardiens payés par les Hauts`}</span><h2>${t`Quai ${quai}`}</h2></div>`
    + `<span class="fl-badge">${nomNiveau}<small>${t`${chance < 1 ? '< 1' : chance > 99 ? '> 99' : chance} % de chances`}</small></span></header>`
    + `<ul class="fl-gardiens">${gardiens.map((id) => `<li style="--c:${COULEUR[ennemiDef(id).lignee]}"${CHEFS.has(id) ? ' class="chef"' : ''}>${visageGarde(id, 40)}<span><strong>${echap(ennemiDef(id).nom)}</strong><small>${NOM_LIGNEE[ennemiDef(id).lignee]}</small></span></li>`).join('')}</ul>`
    + `<div class="fl-forces"><span>${t`Gardiens`} <b>${Math.round(fq * 100)}</b></span><span class="fl-jauge" aria-hidden="true"><i style="width:${Math.min(100, Math.round((50 * fq) / Math.max(0.01, force)))}%"></i></span><span>${t`Escouade`} <b>${Math.round(force * 100)}</b></span></div>`
    + `<dl class="fl-enjeu"><div class="gain"><dt>${t`Si tu gagnes`}</dt><dd>${ICO.monter}<b>${t`Quai ${haut}`}</b><small>${t`+${haut - quai} quai${haut - quai > 1 ? 's' : ''}`}</small></dd></div>`
    + `<div class="perte"><dt>${t`Si tu perds`}</dt><dd>${ICO.descendre}<b>${t`Quai ${bas}`}</b><small>${bas === quai ? t('tu restes sur ton quai gravé') : t`−${quai - bas} quai${quai - bas > 1 ? 's' : ''}`}</small></dd></div></dl>`
    + (raison ? `<p class="fl-raison">${ICO.verrou}${raison}</p>` : '')
    + `<button type="button" class="btn prim large" data-action="fleche-preparer"${raison ? ' disabled' : ''}>${ICO.monter}${t`Monter à l’assaut`}</button></section>`;
}

const gage = (q: number) => {
  const g = gageJour(q);
  return `${ICO.energie}${ent(g.composants)}${g.eclats ? ` ${ICO.eclats}${g.eclats}` : ''}`;
};

const visages = (ids: string[]) => `<ul class="fl-gardiens">${ids.map((id) => `<li style="--c:${COULEUR[porteurDef(id).lignee]}">${avatar(id, 40)}<span><strong>${echap(porteurDef(id).nom)}</strong><small>${NOM_LIGNEE[porteurDef(id).lignee]}</small></span></li>`).join('')}</ul>`;

/**
 * La compétition (29 octobre 2026, Bryan : « une partie compétition où l'on veut devenir le gardien de l'étage le plus
 * haut ») : le quai qu'on tient (ou le plus haut quai libre à prendre), le défi du plus haut gardien à portée, et les
 * gardiens les plus hauts de la Flèche. Rien ici ne touche à la montée de l'histoire.
 */
function competition(e: EcranDistrict, f: EtatFleche): string {
  const j = e.j;
  const connecte = !!e.compte.utilisateur;
  const portee = e.gardiens?.portee ?? [];
  let h = `<section class="fl-compet" aria-label="${t`La garde des quais`}"><header class="fl-compet-tete"><span class="surtitre">${ICO.bouclier}${t`La garde · compétition`}</span>`
    + `<small>${t`Tiens le quai le plus haut possible. Ta montée, elle, ne dépend jamais des autres directeurs.`}</small></header>`;
  if (!connecte) {
    h += `<p class="fl-raison">${ICO.verrou}${t`Relie ta partie à un compte pour tenir un quai et défier les autres directeurs.`}</p>`;
  } else {
    // le quai le plus haut qu'on peut prendre sans combat (inconnu tant que les gardiens n'ont pas été lus : son record)
    const libre = e.gardiens ? quaiLibreDe(j, portee) : quaiMaxTenable(j) >= 2 ? quaiMaxTenable(j) : null;
    h += f.garde ? garde(f, libre) : tenir(libre);
    const cible = cibleDefiDe(j, portee);
    if (cible) h += defi(j, cible);
  }
  h += classement(e.gardiens?.top ?? null, f, connecte);
  return h + `</section>`;
}

/** Tenir le plus haut quai libre déjà atteint */
function tenir(libre: number | null): string {
  if (!libre) return `<p class="fl-raison">${ICO.monter}${t`Monte d’abord au-dessus du pied de la Flèche : on ne tient qu’un quai déjà atteint.`}</p>`;
  return `<div class="fl-tenir"><img class="fl-sceau" src="${artFleche('sceau-gardien')}" alt="" decoding="async"><div>`
    + `<strong>${t`Tenir le quai ${libre}`}</strong>`
    + `<small>${t`Le plus haut quai libre que tu as atteint. Une copie de ton escouade y monte la garde pendant que tu continues de grimper ; les Hauts te versent`} <b>${gage(libre)}</b> ${t`par jour.`}</small>`
    + `<button type="button" class="btn sec" data-action="fleche-tenir" data-quai="${libre}">${ICO.bouclier}${t`S’installer sur le quai ${libre}`}</button></div></div>`;
}

/** Le quai tenu : la garnison figée, la caisse du gage, les défenses ; monter sa garde ou quitter */
function garde(f: EtatFleche, libre: number | null): string {
  const g = f.garde!;
  const now = Date.now();
  const caisse = gageEnCaisse({ fleche: f }, now);
  const pleine = now - g.gageLe >= ASCENSION.caisseJours * 86_400_000;
  const jours = Math.floor((now - g.depuis) / 86_400_000);
  const plusHaut = libre && libre > g.quai ? libre : null;
  return `<div class="fl-assaut fl-garde" aria-label="${t`Le quai ${g.quai}, tenu par ton escouade`}">`
    + `<header><img class="fl-sceau" src="${artFleche('sceau-gardien')}" alt="" decoding="async"><div><span class="surtitre">${t`Gardien du quai`}</span><h2>${t`Tu tiens le quai ${g.quai}`}</h2></div>`
    + `<span class="fl-badge">${g.repousses}<small>${t`défense${g.repousses > 1 ? 's' : ''} tenue${g.repousses > 1 ? 's' : ''}`}</small></span></header>`
    + visages(g.garnison.porteurs.map((p) => p.id))
    + `<dl class="fl-enjeu"><div class="gain"><dt>${t`Gage par jour`}</dt><dd>${ICO.chrono}<b>${gage(g.quai)}</b><small>${jours ? t`tenu depuis ${jours} jour${jours > 1 ? 's' : ''}` : t('tenu depuis aujourd’hui')}</small></dd></div>`
    + `<div class="gain"><dt>${t`Dans la caisse`}</dt><dd>${ICO.coffre}<b>${ent(caisse.composants)}${caisse.eclats ? ` ${ICO.eclats}${caisse.eclats}` : ''}</b><small>${pleine ? t`pleine : ${ASCENSION.caisseJours} jours au plus` : t`jusqu’à ${ASCENSION.caisseJours} jours de gage`}</small></dd></div></dl>`
    + `<p class="fl-regle">${ICO.porteurs}<span>${t`Une copie figée de ton escouade (force ${Math.round(forceGarnison(g.garnison) * 100)}) se défend seule. Chaque défense tenue rapporte un quart de jour de gage ; battue, elle perd le quai, jamais ta montée.`}</span></p>`
    + `<div class="fl-garde-actions"><button type="button" class="btn prim large" data-action="fleche-gage"${caisse.composants || caisse.eclats ? '' : ' disabled'}>${ICO.coffre}${t`Recevoir le gage`}</button>`
    + (plusHaut ? `<button type="button" class="btn sec" data-action="fleche-tenir" data-quai="${plusHaut}">${ICO.monter}${t`Monter ta garde au quai ${plusHaut}`}</button>` : '')
    + `<button type="button" class="btn sec petit" data-action="fleche-quitter">${t`Quitter le quai`}</button></div></div>`;
}

/** Défier le plus haut gardien à portée */
function defi(j: Jeu, g: GardienQuai): string {
  const force = forceEscouade(j, escouadePourDepart(j));
  const chance = Math.round(chanceVictoire(g.force / Math.max(0.01, force)) * 100);
  const niveau = chance >= 85 ? 1 : chance >= 50 ? 2 : chance >= 15 ? 3 : 4;
  return `<div class="fl-defi d${niveau}"><header><div><span class="surtitre">${t`Le plus haut gardien à ta portée`}</span><h3>${t`${echap(g.nom)} · quai ${g.quai}`}</h3></div>`
    + `<span class="fl-badge">${[t('Facile'), t('Équilibré'), t('Risqué'), t('Redoutable')][niveau - 1]}<small>${t`${chance < 1 ? '< 1' : chance > 99 ? '> 99' : chance} % de chances`}</small></span></header>`
    + `<p class="fl-defi-visages">${g.porteurs.map((id) => avatar(id, 34)).join('')}<small>${t`Gagné : le quai ${g.quai} est à toi. Perdu : seulement l’Usure.`}</small></p>`
    + `<button type="button" class="btn sec" data-action="fleche-defier"${j.expedition ? ' disabled' : ''}>${ICO.atk}${t`Défier ${echap(g.nom)}`}</button></div>`;
}

/** Les gardiens les plus hauts de la Flèche */
function classement(top: GardienQuai[] | null, f: EtatFleche, connecte: boolean): string {
  if (!connecte) return '';
  const moi = (g: GardienQuai) => !!f.garde && g.quai === f.garde.quai && g.depuis === f.garde.depuis;
  const l = (top ?? []).slice(0, 10);
  return `<details class="fl-repli fl-top"${f.garde ? '' : ' open'}><summary><span class="surtitre">${ICO.monter}${t`Les gardiens les plus hauts`}</span></summary>`
    + (top === null ? `<p class="fl-vide">${t`Les quais se chargent…`}</p>`
      : !l.length ? `<p class="fl-vide">${t`Aucun directeur ne tient encore de quai : le plus haut est à prendre.`}</p>`
      : `<ol>${l.map((g, i) => `<li${moi(g) ? ' class="moi"' : ''}>${i ? `<b>${i + 1}</b>` : `<img class="fl-sceau" src="${artFleche('sceau-gardien')}" alt="1">`}<span>${moi(g) ? t('Toi') : echap(g.nom)}</span><em>${t`Quai ${g.quai}`}</em></li>`).join('')}</ol>`)
    + `</details>`;
}

/** Les quais gravés : récompense reçue, ou à gagner */
function paliers(quai: number, recus: number[]): string {
  // repliés (28 octobre 2026) : le prochain quai gravé est déjà annoncé en tête, la liste complète se déplie
  return `<details class="fl-paliers fl-repli" style="--plaque:url(${artFleche('plaque')})" aria-label="${t`Les quais gravés`}"><summary><span class="surtitre">${ICO.cristal}${t`Les ${FLECHE.paliers.length} quais gravés · ${recus.length} reçu${recus.length > 1 ? 's' : ''}`}</span></summary><ol>`
    + [...FLECHE.paliers].reverse().map((p) => {
      const recu = recus.includes(p);
      return `<li class="${recu ? 'recu' : p <= quai ? 'atteint' : ''}"><b class="fl-plaque-num">${p}</b><span>${p >= FLECHE.quais ? t('Le dernier quai : l’amarrage') : t('Quai gravé')}<small>${p <= 40 ? t('on y monte de 4 en 4') : p <= 70 ? t('on y monte de 2 en 2') : t('on y monte quai par quai')}</small></span>`
        + `<em>${recu ? `${ICO.ok}${t('Reçu')}` : recompense(p)}</em></li>`;
    }).join('') + `</ol></details>`;
}

/** Le sommet : les Sièges, tenus par des directeurs, qui viendront avec le multijoueur */
function sieges(atteint: boolean): string {
  return `<section class="fl-sommet${atteint ? ' atteint' : ''}"><span class="fl-sommet-ico">${ICO.porte}</span><div>`
    + `<strong>${atteint ? t('Ton escouade tient le dernier quai') : t`Au sommet : les ${FLECHE.sieges} Sièges`}</strong>`
    + `<small>${t`Tenus par des directeurs, ils s’ouvriront avec les combats entre directeurs.`}</small></div></section>`;
}

/**
 * La présentation de la Flèche (28 octobre 2026, Bryan : « explique tout ça dans l'écran d'ouverture ») : son histoire,
 * comment on y monte, et ce qui arrive (tenir un quai et en devenir le gardien, les Sièges du sommet).
 * Montrée tant que la Flèche est fermée, à la première visite, puis à la demande (bouton « ? »).
 */
function presentation(etat: 'fermee' | 'premiere' | 'aide', recit = false): string {
  return `<section class="fl-intro" style="--decor:url(${fondFleche})"><div class="fl-intro-texte">`
    + `<span class="surtitre">${t`Clause de la Flèche · Accords de 2101`}</span>`
    + `<h2>${t`La dernière route vers les Hauts`}</h2>`
    + `<p>${t`Une aiguille de laiton et de verre, si haute qu’elle traverse les nuages. Les îles des Hauts viennent s’y amarrer.`}</p></div></section>`
    + (etat === 'fermee' ? `<p class="fl-condition">${ICO.verrou}<span><strong>${t`Les quais sont fermés · vaincs le gardien de la Strate −6`}</strong><small>${t`Une lettre scellée de cire blanche t’ouvrira les quais.`}</small></span></p>` : '')

    // allégé le 28 octobre 2026 : une phrase et trois chiffres, l'histoire et le détail se déplient
    + bloc(ICO.monter, t('Comment on monte'), t('Un combat par quai, autant que tu veux : seule l’Usure te freine.'), [
      cle(ICO.monter, `+${FLECHE.montee[0]!.quais} → +1`, t('quais par victoire, de moins en moins vite')),
      cle(ICO.descendre, t('Plancher'), t('jamais sous ton dernier quai gravé')),
      cle(ICO.cristal, String(FLECHE.paliers.length), t('quais gravés à récompense')),
    ])

    + replie(t('L’histoire'), `<p>${t`Les îles des Hauts ne se posent jamais : elles dérivent au-dessus de la mer et ne s’arrêtent qu’aux flèches d’amarrage. Il n’en reste qu’une debout, et ce sont les Hauts qui la tiennent.`}</p>`
      + `<p>${t`Avant 2101, les districts d’en bas montaient à l’abordage. Les Accords y ont mis fin et n’ont laissé qu’une route légale vers le haut : la Flèche, quai par quai. Tout district invité peut y envoyer une escouade.`}</p>`
      + `<p>${t`Les Hauts paient des gardiens sur chaque quai, plus forts à mesure qu’on monte : c’est leur façon de trier ceux d’en bas. « S’il tient le sommet au passage d’une île, il y est reçu », dit la Clause. Les Hauts ont toujours lu « l’escouade ».`}</p>`)
    + (recit ? replie(t('Les Îles ouvertes'), `<p>${t`Le Noyé, vieux saboteur rescapé du Levage, garde un brouillon de la Clause, écrit à la main pendant la Grève des pompes : « le district dont l’escouade tient le sommet au passage d’une île y est reçu ». Pas l’escouade : le district.`}</p>`
      + `<p>${t`Ceux qui sont montés ont tous accepté le palais qu’on leur offrait. Le Noyé attend un directeur qui tiendra le sommet, puis refusera, pour réclamer l’île au nom de tous. Le sommet et ses Sièges arrivent bientôt ; l’histoire complète t’attend dans les Chroniques (« Il y est reçu »).`}</p>`, ICO.porte) : '')
    + replie(t('Les règles en détail'), `<ul class="fl-pr-etapes">`
      + etape(ICO.atk, t('Un combat par quai'), t('Ton escouade affronte les trois gardiens du quai. Pas de jeton : tu montes autant que tu veux, seule l’Usure te freine.'))
      + etape(ICO.monter, t('Vite en bas, lentement en haut'), t`Une victoire fait monter de ${FLECHE.montee[0]!.quais} quais jusqu’au ${FLECHE.montee[0]!.jusqua}, de ${FLECHE.montee[1]!.quais} jusqu’au ${FLECHE.montee[1]!.jusqua}, puis d’un seul.`)
      + etape(ICO.descendre, t('Une défaite fait redescendre'), t('D’autant de quais, mais jamais sous le dernier quai gravé que tu as atteint.'))
      + etape(ICO.cristal, t('Les quais gravés'), t`${FLECHE.paliers.join(', ')} : chacun donne des cristaux et des Éclats, une seule fois. Ton record compte au Grand Tableau.`)
      + `</ul>`, ICO.aide)

    + replie(t('La garde des quais · compétition'), `<p>${t`Les Hauts préfèrent payer un directeur qui tient bon plutôt qu’un gardien de location. Les meilleurs directeurs se disputent les quais : le but, tenir le plus haut.`}</p><ul class="fl-pr-etapes">`
      + etape(ICO.monter, t('Ta montée ne dépend que de toi'), t('L’histoire se joue toujours contre les gardiens payés : aucun directeur ne peut te barrer la route.'))
      + etape(ICO.porteurs, t('Tiens un quai déjà atteint'), t('Une copie figée de ton escouade y monte la garde, pendant que tu continues de grimper avec la vraie.'))
      + etape(ICO.coffre, t('Les Hauts te versent un gage'), t`Plus le quai est haut, plus il rapporte (${gage(20)} par jour au quai 20, ${gage(80)} au quai 80). La caisse garde jusqu’à ${ASCENSION.caisseJours} jours.`)
      + etape(ICO.atk, t('Un quai tenu se prend par un défi'), t('Bats son gardien et le quai est à toi. Perdre ne coûte que l’Usure ; un gardien battu perd son quai, jamais sa montée.'))
      + `</ul>`, ICO.bouclier)
    + `<details class="fl-pr fl-pr-bientot fl-repli"><summary><span class="surtitre">${ICO.porte}${t`Bientôt · les ${FLECHE.sieges} Sièges`} <em>${t`à venir`}</em></span></summary>`
    + `<p>${t`Au sommet, les Sièges sont tenus par des directeurs. Le temps du passage d’une île, ${FLECHE.defaitesMax} défaites t’éliminent et ${FLECHE.victoiresDefi} victoires t’ouvrent le défi d’un Siège.`}</p></details>`

    + (etat === 'fermee' ? ''
      : `<button type="button" class="btn prim large" data-action="fleche-entrer">${ICO.fleche}${etat === 'premiere' ? t('Entrer sur les quais') : t('Retour aux quais')}</button>`);
}
