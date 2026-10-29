// La Flèche d'amarrage (28 octobre 2026) : son onglet. La flèche dessinée de bas en haut à gauche (les quais gravés,
// le quai de l'escouade, le record), à droite où l'on en est ; puis les gardiens du prochain quai, les chances,
// ce qu'on gagne ou perd, et les quais gravés avec leurs récompenses. Les règles sont dans src/core/partie/fleche.ts.

import { porteurDef } from '../core/donnees';
import { ASCENSION, chanceQuai, chanceVictoire, etatFleche, FLECHE, flecheOuverte, forceEscouade, forceGarnison, forceQuai, gageEnCaisse, gageJour, gardiensQuai, pas, peutTenir, plancher, prochainPalier, escouadePourDepart, type EtatFleche, type GardienQuai, type Jeu } from '../core/jeu';
import { avatar, coquille, ent, entete, NOM_LIGNEE, type EcranDistrict } from './coquille';
import { bloc, cle, etape, replie } from './presentation';
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

  const gardien = !f.garde && e.gardienQuai && e.gardienQuai.quai === f.quai ? e.gardienQuai.gardien : null;
  h += f.garde ? garde(f) : sommet ? sieges(true) : assaut(j, f.quai, f.record, gardien) + tenir(e);
  h += paliers(f.quai, f.recus);
  if (!sommet) h += sieges(false);
  h += `<p class="fl-regle">${ICO.chrono}<span>Pas de jeton : monte autant que tu veux. La Clinique soigne l’Usure entre deux assauts.</span></p>`;
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
function assaut(j: Jeu, quai: number, record: number, gardien: GardienQuai | null): string {
  const escouade = escouadePourDepart(j);
  const force = forceEscouade(j, escouade);
  const gardiens = gardien ? gardien.porteurs : gardiensQuai(quai);
  const fq = gardien ? gardien.force : forceQuai(quai);
  const chance = Math.round((gardien ? chanceVictoire(fq / Math.max(0.01, force)) : chanceQuai(force, quai)) * 100);
  const niveau = chance >= 85 ? 1 : chance >= 50 ? 2 : chance >= 15 ? 3 : 4;
  const nomNiveau = ['Facile', 'Équilibré', 'Risqué', 'Redoutable'][niveau - 1];
  const haut = Math.min(FLECHE.quais, quai + pas(quai));
  const bas = Math.max(plancher(record), quai - pas(quai));
  const raison = j.expedition ? 'Une expédition est déjà en cours.' : '';
  return `<section class="fl-assaut d${niveau}" aria-label="Le quai ${quai}">`
    + `<header><div><span class="surtitre">${gardien ? `Tenu par ${echap(gardien.nom)}` : 'Gardiens payés par les Hauts'}</span><h2>Quai ${quai}</h2></div>`
    + `<span class="fl-badge">${nomNiveau}<small>${chance < 1 ? '< 1' : chance > 99 ? '> 99' : chance} % de chances</small></span></header>`
    + `<ul class="fl-gardiens">${gardiens.map((id) => `<li style="--c:${COULEUR[porteurDef(id).lignee]}">${avatar(id, 40)}<span><strong>${echap(porteurDef(id).nom)}</strong><small>${NOM_LIGNEE[porteurDef(id).lignee]}</small></span></li>`).join('')}</ul>`
    + `<div class="fl-forces"><span>Gardiens <b>${Math.round(fq * 100)}</b></span><span class="fl-jauge" aria-hidden="true"><i style="width:${Math.min(100, Math.round((50 * fq) / Math.max(0.01, force)))}%"></i></span><span>Escouade <b>${Math.round(force * 100)}</b></span></div>`
    + `<dl class="fl-enjeu"><div class="gain"><dt>Si tu gagnes</dt><dd>${ICO.monter}<b>Quai ${haut}</b><small>+${haut - quai} quai${haut - quai > 1 ? 's' : ''}</small></dd></div>`
    + `<div class="perte"><dt>Si tu perds</dt><dd>${ICO.descendre}<b>Quai ${bas}</b><small>${bas === quai ? 'tu restes sur ton quai gravé' : `−${quai - bas} quai${quai - bas > 1 ? 's' : ''}`}</small></dd></div></dl>`
    + (raison ? `<p class="fl-raison">${ICO.verrou}${raison}</p>` : '')
    + `<button type="button" class="btn prim large" data-action="fleche-preparer"${raison ? ' disabled' : ''}>${ICO.monter}Monter à l’assaut</button></section>`;
}

const gage = (q: number) => {
  const g = gageJour(q);
  return `${ICO.composants}${ent(g.composants)}${g.eclats ? ` ${ICO.eclats}${g.eclats}` : ''}`;
};

/** Tenir le quai où l'on se tient (29 octobre 2026) : ce que ça rapporte, et pourquoi ce n'est pas possible */
function tenir(e: EcranDistrict): string {
  const j = e.j;
  const quai = etatFleche(j).quai;
  if (quai < 2) return '';
  const p = peutTenir(j, escouadePourDepart(j));
  const raison = !e.compte.utilisateur ? 'Relie ta partie à un compte : les autres directeurs doivent pouvoir t’affronter.' : p.ok ? '' : p.message ?? '';
  return `<section class="fl-tenir" aria-label="Tenir le quai ${quai}"><span class="fl-sommet-ico">${ICO.bouclier}</span><div>`
    + `<strong>Tenir le quai ${quai}</strong>`
    + `<small>Ton escouade s’arrête et remplace les gardiens payés. Les Hauts te versent <b>${gage(quai)}</b> par jour.</small>`
    + (raison ? `<p class="fl-raison">${ICO.verrou}${echap(raison)}</p>` : '')
    + `<button type="button" class="btn sec" data-action="fleche-tenir"${raison ? ' disabled' : ''}>${ICO.bouclier}S’installer sur ce quai</button></div></section>`;
}

/** Le quai tenu : la garnison figée, la caisse du gage, les défenses, et quitter */
function garde(f: EtatFleche): string {
  const g = f.garde!;
  const now = Date.now();
  const caisse = gageEnCaisse({ fleche: f } as Jeu, now);
  const pleine = now - g.gageLe >= ASCENSION.caisseJours * 86_400_000;
  const bas = Math.max(plancher(f.record), g.quai - pas(g.quai));
  const jours = Math.floor((now - g.depuis) / 86_400_000);
  return `<section class="fl-assaut fl-garde" aria-label="Le quai ${g.quai}, tenu par ton escouade">`
    + `<header><div><span class="surtitre">Gardien du quai</span><h2>Tu tiens le quai ${g.quai}</h2></div>`
    + `<span class="fl-badge">${g.repousses}<small>défense${g.repousses > 1 ? 's' : ''} tenue${g.repousses > 1 ? 's' : ''}</small></span></header>`
    + `<ul class="fl-gardiens">${g.garnison.porteurs.map((p) => `<li style="--c:${COULEUR[porteurDef(p.id).lignee]}">${avatar(p.id, 40)}<span><strong>${echap(porteurDef(p.id).nom)}</strong><small>${NOM_LIGNEE[porteurDef(p.id).lignee]}</small></span></li>`).join('')}</ul>`
    + `<dl class="fl-enjeu"><div class="gain"><dt>Gage par jour</dt><dd>${ICO.coffre}<b>${gage(g.quai)}</b><small>${jours ? `tenu depuis ${jours} jour${jours > 1 ? 's' : ''}` : 'tenu depuis aujourd’hui'}</small></dd></div>`
    + `<div class="gain"><dt>Dans la caisse</dt><dd>${ICO.composants}<b>${ent(caisse.composants)}${caisse.eclats ? ` ${ICO.eclats}${caisse.eclats}` : ''}</b><small>${pleine ? 'pleine : deux jours au plus' : `jusqu’à ${ASCENSION.caisseJours} jours de gage`}</small></dd></div></dl>`
    + `<p class="fl-regle">${ICO.porteurs}<span>Ceux qui montent du quai ${g.quai} affrontent ton escouade telle qu’elle était en s’installant (force ${Math.round(forceGarnison(g.garnison) * 100)}). Chaque défense tenue rapporte un quart de jour de gage ; si elle tombe, tu redescends au quai ${bas}.</span></p>`
    + `<div class="fl-garde-actions"><button type="button" class="btn prim large" data-action="fleche-gage"${caisse.composants || caisse.eclats ? '' : ' disabled'}>${ICO.coffre}Recevoir le gage</button>`
    + `<button type="button" class="btn sec" data-action="fleche-quitter">${ICO.monter}Quitter le quai et reprendre la montée</button></div></section>`;
}

/** Les quais gravés : récompense reçue, ou à gagner */
function paliers(quai: number, recus: number[]): string {
  // repliés (28 octobre 2026) : le prochain quai gravé est déjà annoncé en tête, la liste complète se déplie
  return `<details class="fl-paliers fl-repli" aria-label="Les quais gravés"><summary><span class="surtitre">${ICO.cristal}Les ${FLECHE.paliers.length} quais gravés · ${recus.length} reçu${recus.length > 1 ? 's' : ''}</span></summary><ol>`
    + [...FLECHE.paliers].reverse().map((p) => {
      const recu = recus.includes(p);
      return `<li class="${recu ? 'recu' : p <= quai ? 'atteint' : ''}"><b>${p}</b><span>${p >= FLECHE.quais ? 'Le dernier quai : l’amarrage' : 'Quai gravé'}<small>${p <= 40 ? 'on y monte de 4 en 4' : p <= 70 ? 'on y monte de 2 en 2' : 'on y monte quai par quai'}</small></span>`
        + `<em>${recu ? `${ICO.ok}Reçu` : recompense(p)}</em></li>`;
    }).join('') + `</ol></details>`;
}

/** Le sommet : les Sièges, tenus par des directeurs, qui viendront avec le multijoueur */
function sieges(atteint: boolean): string {
  return `<section class="fl-sommet${atteint ? ' atteint' : ''}"><span class="fl-sommet-ico">${ICO.porte}</span><div>`
    + `<strong>${atteint ? 'Ton escouade tient le dernier quai' : `Au sommet : les ${FLECHE.sieges} Sièges`}</strong>`
    + `<small>Tenus par des directeurs, ils s’ouvriront avec les combats entre directeurs.</small></div></section>`;
}

/**
 * La présentation de la Flèche (28 octobre 2026, Bryan : « explique tout ça dans l'écran d'ouverture ») : son histoire,
 * comment on y monte, et ce qui arrive (tenir un quai et en devenir le gardien, les Sièges du sommet).
 * Montrée tant que la Flèche est fermée, à la première visite, puis à la demande (bouton « ? »).
 */
function presentation(etat: 'fermee' | 'premiere' | 'aide'): string {
  return `<section class="fl-intro" style="--decor:url(${fondFleche})"><div class="fl-intro-texte">`
    + `<span class="surtitre">Clause de la Flèche · Accords de 2101</span>`
    + `<h2>La dernière route vers les Hauts</h2>`
    + `<p>Une aiguille de laiton et de verre, si haute qu’elle traverse les nuages. Les îles des Hauts viennent s’y amarrer.</p></div></section>`
    + (etat === 'fermee' ? `<p class="fl-condition">${ICO.verrou}<span><strong>Les quais sont fermés · vaincs le gardien de la Strate −6</strong><small>Une lettre scellée de cire blanche t’ouvrira les quais.</small></span></p>` : '')

    // allégé le 28 octobre 2026 : une phrase et trois chiffres, l'histoire et le détail se déplient
    + bloc(ICO.monter, 'Comment on monte', 'Un combat par quai, autant que tu veux : seule l’Usure te freine.', [
      cle(ICO.monter, `+${FLECHE.montee[0]!.quais} → +1`, 'quais par victoire, de moins en moins vite'),
      cle(ICO.descendre, 'Plancher', 'jamais sous ton dernier quai gravé'),
      cle(ICO.cristal, String(FLECHE.paliers.length), 'quais gravés à récompense'),
    ])

    + replie('L’histoire', `<p>Les îles des Hauts ne se posent jamais : elles dérivent au-dessus de la mer et ne s’arrêtent qu’aux flèches d’amarrage. Il n’en reste qu’une debout, et ce sont les Hauts qui la tiennent.</p>`
      + `<p>Avant 2101, les districts d’en bas montaient à l’abordage. Les Accords y ont mis fin et n’ont laissé qu’une route légale vers le haut : la Flèche, quai par quai. Tout district invité peut y envoyer une escouade.</p>`
      + `<p>Les Hauts paient des gardiens sur chaque quai, plus forts à mesure qu’on monte : c’est leur façon de trier ceux d’en bas. Le district qui tient le sommet quand une île passe est reçu là-haut.</p>`)
    + replie('Les règles en détail', `<ul class="fl-pr-etapes">`
      + etape(ICO.atk, 'Un combat par quai', 'Ton escouade affronte les trois gardiens du quai. Pas de jeton : tu montes autant que tu veux, seule l’Usure te freine.')
      + etape(ICO.monter, 'Vite en bas, lentement en haut', `Une victoire fait monter de ${FLECHE.montee[0]!.quais} quais jusqu’au ${FLECHE.montee[0]!.jusqua}, de ${FLECHE.montee[1]!.quais} jusqu’au ${FLECHE.montee[1]!.jusqua}, puis d’un seul.`)
      + etape(ICO.descendre, 'Une défaite fait redescendre', 'D’autant de quais, mais jamais sous le dernier quai gravé que tu as atteint.')
      + etape(ICO.cristal, 'Les quais gravés', `${FLECHE.paliers.join(', ')} : chacun donne des composants et des Éclats, une seule fois. Ton record compte au Grand Tableau.`)
      + `</ul>`, ICO.aide)

    + replie('Tenir un quai', `<p>Les Hauts préfèrent payer un directeur qui tient bon qu’un gardien de location. Ton escouade peut s’arrêter sur le quai où elle se tient et en devenir le gardien.</p><ul class="fl-pr-etapes">`
      + etape(ICO.porteurs, 'Tu remplaces les gardiens payés', 'Ton escouade s’installe, figée telle qu’elle est. Ceux qui montent de ce quai doivent passer par elle.')
      + etape(ICO.coffre, 'Les Hauts te versent un gage', `Plus le quai est haut, plus il rapporte (${gage(20)} par jour au quai 20, ${gage(80)} au quai 80). La caisse garde jusqu’à ${ASCENSION.caisseJours} jours.`)
      + etape(ICO.bouclier, 'D’autres directeurs viennent te déloger', 'Ton escouade se défend seule, même jeu fermé. Chaque défense tenue rapporte ; si elle tombe, tu redescends comme après une défaite.')
      + etape(ICO.tour, 'Un quai à ta mesure', 'Les Hauts ne confient pas un quai bas à une escouade trop forte : pour tenir, il faut d’abord monter à sa hauteur. Tant que tu tiens, tu ne montes plus.')
      + `</ul>`, ICO.bouclier)
    + `<details class="fl-pr fl-pr-bientot fl-repli"><summary><span class="surtitre">${ICO.porte}Bientôt · les ${FLECHE.sieges} Sièges <em>à venir</em></span></summary>`
    + `<p>Au sommet, les Sièges sont tenus par des directeurs. Le temps du passage d’une île, ${FLECHE.defaitesMax} défaites t’éliminent et ${FLECHE.victoiresDefi} victoires t’ouvrent le défi d’un Siège.</p></details>`

    + (etat === 'fermee' ? ''
      : `<button type="button" class="btn prim large" data-action="fleche-entrer">${ICO.fleche}${etat === 'premiere' ? 'Entrer sur les quais' : 'Retour aux quais'}</button>`);
}
