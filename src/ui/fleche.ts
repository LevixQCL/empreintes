// La Flèche d'amarrage (28 octobre 2026) : son onglet. La flèche dessinée de bas en haut à gauche (les quais gravés,
// le quai de l'escouade, le record), à droite où l'on en est ; puis les gardiens du prochain quai, les chances,
// ce qu'on gagne ou perd, et les quais gravés avec leurs récompenses. Les règles sont dans src/core/partie/fleche.ts.

import { porteurDef } from '../core/donnees';
import { ASCENSION, chanceQuai, etatFleche, FLECHE, flecheOuverte, forceEscouade, forceQuai, gardiensQuai, pas, plancher, prochainPalier, escouadePourDepart, type Jeu } from '../core/jeu';
import { avatar, coquille, ent, entete, NOM_LIGNEE, type EcranDistrict } from './coquille';
import { ICO } from './icones';
import { fondFleche } from './art';
import { echap } from './outils';
import { COULEUR } from './vue';

/** hauteur d'un quai sur la flèche dessinée (0 = pied, 100 = sommet) */
const hauteur = (q: number) => ((q - 1) / (FLECHE.quais - 1)) * 100;

export function htmlFleche(e: EcranDistrict): string {
  const j = e.j;
  const ouverte = flecheOuverte(j);
  // la présentation : Flèche fermée, première visite (rien n'est encore noté), ou à la demande
  const pres = !ouverte ? 'fermee' : !j.fleche ? 'premiere' : e.flecheAide ? 'aide' : null;
  const aide = pres ? '' : `<button type="button" class="btn-icone" data-action="fleche-aide" aria-label="Comment marche la Flèche">${ICO.aide}</button>`;
  let h = entete('Les Hauts · Flèche d’amarrage', 'La Flèche', aide);
  if (pres) return coquille(e, h + presentation(pres), 'fle fle-pres');
  const f = etatFleche(j);
  const sommet = f.quai >= FLECHE.quais;
  const suivant = prochainPalier(f.quai);

  // la flèche et où l'on en est
  h += `<section class="fl-tete">${fleche(f.quai, f.record)}<div class="fl-ou">`
    + `<span class="surtitre">${ICO.tour}Ton escouade tient</span>`
    + `<p class="fl-quai"><small>Quai</small><b>${f.quai}</b><em>/ ${FLECHE.quais}</em></p>`
    + `<dl class="fl-chiffres"><div><dt>Record</dt><dd>${f.record}</dd></div><div><dt>Gagnés</dt><dd>${f.victoires}</dd></div><div><dt>Perdus</dt><dd>${f.defaites}</dd></div></dl>`
    + (suivant ? `<p class="fl-palier">${ICO.cristal}<span>Prochain quai gravé : <b>${suivant}</b>${f.recus.includes(suivant) ? '' : ` · ${recompense(suivant)}`}</span></p>` : '')
    + `</div></section>`;

  h += sommet ? sieges(true) : assaut(j, f.quai, f.record);
  h += paliers(f.quai, f.recus);
  if (!sommet) h += sieges(false);
  h += `<p class="fl-regle">${ICO.chrono}<span>Pas de jeton : tu montes autant que tu veux. Chaque combat use l’escouade comme la moitié d’une expédition, et la Clinique la remet sur pied. Une défaite fait redescendre, jamais sous le dernier quai gravé atteint.</span></p>`;
  return coquille(e, h, 'fle');
}

/** La flèche dessinée : la colonne, les quais gravés, le record et le quai de l'escouade */
function fleche(quai: number, record: number): string {
  return `<div class="fl-colonne" role="img" aria-label="Quai ${quai} sur ${FLECHE.quais}, record ${record}">`
    + `<i class="fl-fut"></i><i class="fl-monte" style="--h:${hauteur(quai)}%"></i>`
    + FLECHE.paliers.map((p) => `<i class="fl-cran${p <= record ? ' atteint' : ''}" style="--h:${hauteur(p)}%"><em>${p}</em></i>`).join('')
    + (record > quai ? `<i class="fl-record" style="--h:${hauteur(record)}%"></i>` : '')
    + `<b class="fl-ici" style="--h:${hauteur(quai)}%"></b><i class="fl-sieges"></i></div>`;
}

const recompense = (q: number) => {
  const r = ASCENSION.recompenses[q];
  return r ? `${ICO.composants}${ent(r.composants)} ${ICO.eclats}${r.eclats}` : '';
};

/** Les gardiens du prochain quai, les chances, et l'enjeu */
function assaut(j: Jeu, quai: number, record: number): string {
  const escouade = escouadePourDepart(j);
  const force = forceEscouade(j, escouade);
  const gardiens = gardiensQuai(quai);
  const fq = forceQuai(quai);
  const chance = Math.round(chanceQuai(force, quai) * 100);
  const niveau = chance >= 85 ? 1 : chance >= 50 ? 2 : chance >= 15 ? 3 : 4;
  const nomNiveau = ['Facile', 'Équilibré', 'Risqué', 'Redoutable'][niveau - 1];
  const haut = Math.min(FLECHE.quais, quai + pas(quai));
  const bas = Math.max(plancher(record), quai - pas(quai));
  const raison = j.expedition ? 'Une expédition est déjà en cours.' : '';
  return `<section class="fl-assaut d${niveau}" aria-label="Le quai ${quai}">`
    + `<header><div><span class="surtitre">Gardiens payés par les Hauts</span><h2>Quai ${quai}</h2></div>`
    + `<span class="fl-badge">${nomNiveau}<small>${chance < 1 ? '< 1' : chance > 99 ? '> 99' : chance} % de chances</small></span></header>`
    + `<ul class="fl-gardiens">${gardiens.map((id) => `<li style="--c:${COULEUR[porteurDef(id).lignee]}">${avatar(id, 40)}<span><strong>${echap(porteurDef(id).nom)}</strong><small>${NOM_LIGNEE[porteurDef(id).lignee]}</small></span></li>`).join('')}</ul>`
    + `<div class="fl-forces"><span>Gardiens <b>${Math.round(fq * 100)}</b></span><span class="fl-jauge" aria-hidden="true"><i style="width:${Math.min(100, Math.round((50 * fq) / Math.max(0.01, force)))}%"></i></span><span>Escouade <b>${Math.round(force * 100)}</b></span></div>`
    + `<dl class="fl-enjeu"><div class="gain"><dt>Si tu gagnes</dt><dd>${ICO.monter}<b>Quai ${haut}</b><small>+${haut - quai} quai${haut - quai > 1 ? 's' : ''}</small></dd></div>`
    + `<div class="perte"><dt>Si tu perds</dt><dd>${ICO.descendre}<b>Quai ${bas}</b><small>${bas === quai ? 'tu restes sur ton quai gravé' : `−${quai - bas} quai${quai - bas > 1 ? 's' : ''}`}</small></dd></div></dl>`
    + (raison ? `<p class="fl-raison">${ICO.verrou}${raison}</p>` : '')
    + `<button type="button" class="btn prim large" data-action="fleche-preparer"${raison ? ' disabled' : ''}>${ICO.monter}Monter à l’assaut</button></section>`;
}

/** Les quais gravés : récompense reçue, ou à gagner */
function paliers(quai: number, recus: number[]): string {
  return `<section class="fl-paliers" aria-label="Les quais gravés"><span class="surtitre">${ICO.cristal}Les quais gravés</span><ol>`
    + [...FLECHE.paliers].reverse().map((p) => {
      const recu = recus.includes(p);
      return `<li class="${recu ? 'recu' : p <= quai ? 'atteint' : ''}"><b>${p}</b><span>${p >= FLECHE.quais ? 'Le dernier quai : l’amarrage' : 'Quai gravé'}<small>${p <= 40 ? 'on y monte de 4 en 4' : p <= 70 ? 'on y monte de 2 en 2' : 'on y monte quai par quai'}</small></span>`
        + `<em>${recu ? `${ICO.ok}Reçu` : recompense(p)}</em></li>`;
    }).join('') + `</ol></section>`;
}

/** Le sommet : les Sièges, tenus par des directeurs, qui viendront avec le multijoueur */
function sieges(atteint: boolean): string {
  return `<section class="fl-sommet${atteint ? ' atteint' : ''}"><span class="fl-sommet-ico">${ICO.porte}</span><div>`
    + `<strong>${atteint ? 'Ton escouade tient le dernier quai' : `Au sommet : les ${FLECHE.sieges} Sièges`}</strong>`
    + `<small>Tenus par des directeurs, défendus par leur escouade. Le temps du passage d’une île : ${FLECHE.defaitesMax} défaites éliminent, ${FLECHE.victoiresDefi} victoires ouvrent le défi d’un Siège. Ils s’ouvriront avec les combats entre directeurs.</small></div></section>`;
}

/**
 * La présentation de la Flèche (28 octobre 2026, Bryan : « explique tout ça dans l'écran d'ouverture ») : son histoire,
 * comment on y monte, et ce qui arrive (tenir un quai et en devenir le gardien, les Sièges du sommet).
 * Montrée tant que la Flèche est fermée, à la première visite, puis à la demande (bouton « ? »).
 */
function presentation(etat: 'fermee' | 'premiere' | 'aide'): string {
  const etape = (ico: string, titre: string, texte: string) => `<li><span class="fl-pr-ico">${ico}</span><span><strong>${titre}</strong><small>${texte}</small></span></li>`;
  return `<section class="fl-intro" style="--decor:url(${fondFleche})"><div class="fl-intro-texte">`
    + `<span class="surtitre">Clause de la Flèche · Accords de 2101</span>`
    + `<h2>La dernière route vers les Hauts</h2>`
    + `<p>Une aiguille de laiton et de verre plantée dans la mer, si haute qu’elle traverse les nuages. Tout en haut, les îles des Hauts viennent s’y amarrer.</p></div></section>`

    + `<section class="fl-pr"><span class="surtitre">${ICO.codex}L’histoire</span>`
    + `<p>Les îles des Hauts ne se posent jamais : elles dérivent au-dessus de la mer et ne s’arrêtent qu’aux flèches d’amarrage. Il n’en reste qu’une debout, et ce sont les Hauts qui la tiennent.</p>`
    + `<p>Avant 2101, les districts d’en bas montaient à l’abordage. Les Accords y ont mis fin et n’ont laissé qu’une route légale vers le haut : la Flèche, quai par quai. Tout district invité peut y envoyer une escouade.</p>`
    + `<p>Les Hauts paient des gardiens sur chaque quai, plus forts à mesure qu’on monte : c’est leur façon de trier ceux d’en bas. Le district qui tient le sommet quand une île passe est reçu là-haut.</p></section>`

    + `<section class="fl-pr"><span class="surtitre">${ICO.monter}Comment on monte</span><ul class="fl-pr-etapes">`
    + etape(ICO.atk, 'Un combat par quai', 'Ton escouade affronte les trois gardiens du quai. Pas de jeton : tu montes autant que tu veux, seule l’Usure te freine.')
    + etape(ICO.monter, 'Vite en bas, lentement en haut', `Une victoire fait monter de ${FLECHE.montee[0]!.quais} quais jusqu’au ${FLECHE.montee[0]!.jusqua}, de ${FLECHE.montee[1]!.quais} jusqu’au ${FLECHE.montee[1]!.jusqua}, puis d’un seul.`)
    + etape(ICO.descendre, 'Une défaite fait redescendre', 'D’autant de quais, mais jamais sous le dernier quai gravé que tu as atteint.')
    + etape(ICO.cristal, 'Les quais gravés', `${FLECHE.paliers.join(', ')} : chacun donne des composants et des Éclats, une seule fois. Ton record compte au Grand Tableau.`)
    + `</ul></section>`

    + `<section class="fl-pr fl-pr-bientot"><span class="surtitre">${ICO.bouclier}Bientôt · tenir un quai <em>à venir</em></span>`
    + `<p>Les Hauts préfèrent payer un directeur qui tient bon qu’un gardien de location. Bientôt, ton escouade pourra s’arrêter sur un quai qu’elle vient de prendre et en devenir le gardien.</p><ul class="fl-pr-etapes">`
    + etape(ICO.porteurs, 'Tu remplaces les gardiens payés', 'Ton escouade s’installe sur le quai. Ceux qui montent doivent passer par elle.')
    + etape(ICO.coffre, 'Les Hauts te versent un gage', 'Chaque jour où tu tiens le quai, et plus il est haut, plus il rapporte.')
    + etape(ICO.bouclier, 'D’autres directeurs viennent te déloger', 'Ton escouade se défend seule, même jeu fermé. Si elle tombe, le quai change de gardien et tu redescends.')
    + etape(ICO.porte, `Au sommet, les ${FLECHE.sieges} Sièges`, `Tenus par des directeurs. Le temps du passage d’une île, ${FLECHE.defaitesMax} défaites t’éliminent et ${FLECHE.victoiresDefi} victoires t’ouvrent le défi d’un Siège.`)
    + `</ul></section>`

    + (etat === 'fermee'
      ? `<p class="fl-condition">${ICO.verrou}<span><strong>Les quais sont fermés · vaincs le gardien de la Strate −6</strong><small>Les Hauts n’écrivent qu’aux directeurs qui ont fait parler d’eux. Une lettre scellée de cire blanche t’ouvrira les quais.</small></span></p>`
      : `<button type="button" class="btn prim large" data-action="fleche-entrer">${ICO.fleche}${etat === 'premiere' ? 'Entrer sur les quais' : 'Retour aux quais'}</button>`);
}
