// L'écran « Recruter » (29 octobre 2026) : le code de parrainage du directeur, ce que chacun gagne, ses recrues et ses distinctions,
// et, au début de la partie seulement, la case pour entrer le code de celui qui l'a fait venir.
// Dans le lore : on recrute d'autres directeurs pour tenir la ville ensemble ; leur empreinte et la tienne se répondent.

import { moduleDef, PARRAINAGE_CARTE } from '../core/donnees';
import { codeAffiche, PARRAINAGE, peutEtreParraine, recrueActive, recruesRecompensees, type Recrue } from '../core/jeu';
import { coquille, entete, type EcranDistrict } from './coquille';
import { ICO } from './icones';
import { echap } from './outils';
import { faceCarte } from './carte';
import { COLLECTION } from '../core/collection';

/** L'état de l'écran en ligne, tenu par src/app/parrainage.ts */
export interface EtatRecruter {
  etat: 'repos' | 'chargement' | 'ok' | 'erreur';
  erreur: string;
  /** le résultat de la saisie d'un code (succès ou refus) */
  saisie: { ok: boolean; texte: string } | null;
  recrues: Recrue[] | null;
  occupe: boolean;
}

export const recruterVide = (): EtatRecruter => ({ etat: 'repos', erreur: '', saisie: null, recrues: null, occupe: false });

const NOM_PALIER: Record<string, string> = { strate1: '−1', strate3: '−3', noyau3: 'Noyau 3' };

export function htmlRecruter(e: EcranDistrict, r: EtatRecruter, enLigne: boolean): string {
  const j = e.j;
  const p = j.parrainage;
  const code = p?.code;
  let h = entete('PARRAINAGE', 'Recruter des directeurs');
  h += `<p class="rc-intro">La ville ne se tient pas seule. Fais venir un ami : quand il joue vraiment, vous êtes récompensés tous les deux.</p>`;

  // ---------- Ton code ----------
  h += `<section class="rc-code" aria-label="Ton code">`
    + `<img class="rc-embleme" src="./art/embleme-cristal.webp" alt="" decoding="async">`
    + `<span class="surtitre">Ton empreinte de recrutement</span>`;
  if (!enLigne) h += `<p class="aide">Le parrainage passe par ton compte : il s’active dès que le jeu est connecté.</p>`;
  else if (!code) h += `<strong class="rc-valeur rc-attente">${r.etat === 'erreur' ? '— — —' : 'Gravure…'}</strong>${r.etat === 'erreur' ? `<p class="aide">${echap(r.erreur)}</p><button type="button" class="btn sec" data-action="rc-actualiser">Réessayer</button>` : ''}`;
  else {
    h += `<strong class="rc-valeur">${codeAffiche(code)}</strong>`
      + `<div class="rc-boutons"><button type="button" class="btn prim" data-action="rc-partager">${ICO.porteurs}Envoyer le lien</button>`
      + `<button type="button" class="btn sec" data-action="rc-copier">Copier</button></div>`
      + `<small class="aide">Le lien ouvre le jeu avec ton code déjà entré. Ton ami peut aussi le saisir lui-même, au début de sa partie.</small>`;
  }
  h += `</section>`;

  // ---------- Un ami t'a fait venir ? (au début seulement : c'est là que ça compte) ----------
  if (!p?.parrain && peutEtreParraine(j) && enLigne) {
    h += `<section class="bloc rc-saisie"><h3 class="titre-bloc">${ICO.aide}Un ami t’a fait venir ?</h3>`
      + `<p class="aide">Entre son code avant d’avoir vaincu la Strate −${PARRAINAGE.strateMaxPourCode} : vous serez liés pour de bon.</p>`
      + `<div class="rc-champ"><input id="rc-code" type="text" inputmode="text" autocomplete="off" autocapitalize="characters" spellcheck="false" maxlength="12" placeholder="EMP-XXXXXX" aria-label="Code de ton parrain">`
      + `<button type="button" class="btn prim" data-action="rc-entrer"${r.occupe ? ' disabled' : ''}>${r.occupe ? 'Vérification…' : 'Valider'}</button></div>`
      + (r.saisie && !r.saisie.ok ? `<p class="rc-erreur" role="alert">${echap(r.saisie.texte)}</p>` : '')
      + `</section>`;
  }

  // ---------- Ce que vous gagnez ----------
  h += `<section class="bloc rc-gains"><h3 class="titre-bloc">${ICO.coffre}Ce que vous gagnez</h3>`
    + `<div class="rc-palier depart"><span class="rc-marque">${ICO.ok}</span><div><strong>Dès son arrivée</strong>`
    + `<p><b>Lui</b> : ${PARRAINAGE.depart.composants} composants, une carte au choix (au moins du cuivre) et ses colis de Ravitaillement doublés pendant ${PARRAINAGE.depart.joursColisDoubles} jours.</p></div></div>`
    + PARRAINAGE.paliers.map((x) => `<div class="rc-palier"><span class="rc-marque rc-num">${NOM_PALIER[x.id]}</span><div><strong>${echap(x.titre)}</strong>`
      + `<p><b>Toi</b> : ${echap(x.parrain)}.</p>${x.filleul ? `<p><b>Lui</b> : ${echap(x.filleul)}.</p>` : ''}</div></div>`).join('')
    + `<small class="aide">Tes ${PARRAINAGE.recruesRecompensees} premières recrues te rapportent ces récompenses. Au-delà, elles comptent toujours pour les distinctions.</small>`
    + `</section>`;

  // ---------- La carte ----------
  const m = moduleDef(PARRAINAGE_CARTE);
  h += `<section class="bloc rc-carte"><div class="rc-carte-face">${faceCarte(m, COLLECTION.niveauDepart[m.rarete])}</div>`
    + `<div><span class="surtitre">Carte du parrainage</span><h3>${echap(m.nom)}</h3>`
    + `<p class="aide">Elle ne se trouve nulle part ailleurs. Chaque exemplaire garde dans son journal le nom de l’autre directeur. Une carte de cuivre ordinaire en combat : le parrainage ne fait gagner personne.</p></div></section>`;

  // ---------- Tes recrues ----------
  if (enLigne && code) {
    h += `<section class="bloc rc-recrues"><h3 class="titre-bloc">${ICO.porteurs}Tes recrues`
      + `<button type="button" class="lien rc-maj" data-action="rc-actualiser"${r.etat === 'chargement' ? ' disabled' : ''}>${r.etat === 'chargement' ? 'Lecture…' : 'Actualiser'}</button></h3>`;
    const l = r.recrues;
    if (r.etat === 'erreur' && !l) h += `<p class="aide">${echap(r.erreur)}</p>`;
    else if (!l) h += `<p class="aide">Lecture de tes recrues…</p>`;
    else if (!l.length) h += `<p class="rc-vide">Pas encore de recrue. Envoie ton lien à un ami : il apparaîtra ici dès son arrivée.</p>`;
    else {
      const payees = recruesRecompensees(j);
      h += `<ul class="rc-liste">` + l.map((x) => {
        const hors = !payees.includes(x.uid) && payees.length >= PARRAINAGE.recruesRecompensees;
        return `<li class="${recrueActive(x) ? 'active' : ''}"><span class="rc-nom">${echap(x.nom)}${hors ? '<small>hors récompenses</small>' : ''}</span><span class="rc-puces">`
          + PARRAINAGE.paliers.map((pa) => `<span class="rc-puce${x.paliers.includes(pa.id) ? ' faite' : ''}" title="${echap(pa.titre)}">${x.paliers.includes(pa.id) ? ICO.ok : ''}${NOM_PALIER[pa.id]}</span>`).join('')
          + `</span></li>`;
      }).join('') + `</ul><small class="aide">${Math.min(payees.length, PARRAINAGE.recruesRecompensees)} / ${PARRAINAGE.recruesRecompensees} recrues récompensées · une recrue est active dès la Strate −1 vaincue.</small>`;
    }
    h += `</section>`;
  }

  // ---------- Distinctions ----------
  const actives = (r.recrues ?? []).filter(recrueActive).length;
  h += `<section class="bloc rc-distinctions"><h3 class="titre-bloc">${ICO.cristal}Distinctions</h3>`
    + PARRAINAGE.distinctions.map((d) => {
      const gagne = !!p?.cosmetiques.includes(d.id);
      const n = Math.min(actives, d.recrues);
      return `<div class="rc-distinction${gagne ? ' gagne' : ''}">${d.id === 'dos-partage' ? `<span class="rc-dos dos-partage" style="--dos:url(./art/dos-partage-mini.webp)" aria-hidden="true"><img src="./art/embleme.webp" alt=""></span>` : `<span class="rc-titre-ex"><em class="insigne-recruteur">Recruteur</em></span>`}`
        + `<div><strong>${echap(d.nom)}</strong><p class="aide">${echap(d.texte)}</p>`
        + `<span class="rc-jauge" role="img" aria-label="${gagne ? 'Gagnée' : `${n} sur ${d.recrues} recrues actives`}"><i style="width:${gagne ? 100 : (n / d.recrues) * 100}%"></i></span>`
        + `<small class="chiffre">${gagne ? 'Gagnée' : `${n} / ${d.recrues} recrues actives`}</small></div></div>`;
    }).join('') + `</section>`;

  // ---------- Ton parrain ----------
  if (p?.parrain) {
    h += `<section class="bloc rc-parrain"><h3 class="titre-bloc">${ICO.ok}Recommandé par ${echap(p.parrain.nom)}</h3>`
      + `<p class="aide">Chaque palier que tu atteins lui rapporte quelque chose : à la Strate −3 et à la Tour du Noyau niveau 3, tu reçois aussi ta part.</p>`
      + `<span class="rc-puces">${PARRAINAGE.paliers.map((pa) => `<span class="rc-puce${p.recus.includes(pa.id) || p.publies.includes(pa.id) ? ' faite' : ''}">${p.recus.includes(pa.id) || p.publies.includes(pa.id) ? ICO.ok : ''}${echap(pa.titre)}</span>`).join('')}</span></section>`;
  }
  return coquille(e, `<div class="recruter">${h}</div>`, 'rc');
}


