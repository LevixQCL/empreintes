// La Flèche d'amarrage (28 octobre 2026) : son onglet. La flèche dessinée de bas en haut à gauche (les quais gravés,
// le quai de l'escouade, le record), à droite où l'on en est ; puis les gardiens du prochain quai, les chances,
// ce qu'on gagne ou perd, et les quais gravés avec leurs récompenses. Les règles sont dans src/core/partie/fleche.ts.

import { porteurDef } from '../core/donnees';
import { ASCENSION, chanceQuai, etatFleche, FLECHE, flecheOuverte, forceEscouade, forceQuai, gardiensQuai, pas, plancher, prochainPalier, escouadePourDepart, type Jeu } from '../core/jeu';
import { avatar, coquille, ent, entete, NOM_LIGNEE, type EcranDistrict } from './coquille';
import { ICO } from './icones';
import { echap } from './outils';
import { COULEUR } from './vue';

/** hauteur d'un quai sur la flèche dessinée (0 = pied, 100 = sommet) */
const hauteur = (q: number) => ((q - 1) / (FLECHE.quais - 1)) * 100;

export function htmlFleche(e: EcranDistrict): string {
  const j = e.j;
  let h = entete('Les Hauts · Flèche d’amarrage', 'La Flèche');
  if (!flecheOuverte(j)) return coquille(e, h + fermee(), 'fle');
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

/** Avant la lettre des Hauts : la Flèche se voit, mais ses quais sont fermés */
function fermee(): string {
  return `<section class="fl-fermee"><span class="fl-sommet-ico">${ICO.verrou}</span>`
    + `<h2>Les quais sont fermés</h2>`
    + `<p>La Flèche est la dernière flèche d’amarrage des Hauts. Depuis les Accords de 2101, tout district peut y envoyer une escouade, mais seulement sur invitation : les Hauts n’écrivent qu’aux directeurs qui ont fait parler d’eux.</p>`
    + `<p class="fl-condition">${ICO.strate}<span><strong>Vaincs le gardien de la Strate −6</strong><small>Une lettre scellée de cire blanche t’ouvrira les quais.</small></span></p></section>`;
}
