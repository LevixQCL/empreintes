// Le Port (26 octobre 2026, onglet à part le 28) : sa présentation à la première visite, puis deux volets,
// les pillages et les missions en mer. Les archipels voisins : la carte des pillages. La mer, ton archipel en bas, les archipels à portée
// autour, reliés par les routes des passeurs ; toucher un archipel affiche sa fiche juste dessous (garnison, chances, butin).
// Les règles sont dans src/core/partie/pillages.ts.

import { PILLAGE, achatsRestants, coutJeton, butinPillage, chanceVictoire, difficulte, escouadeActive, escouadeDefense, escouadesDe, etatPillage, forceEscouade, majJetons, MISSIONS, barquesMax, MAREES, bulleBasses, contratsDuMoment, mareesDe, pavillonDe, consigneDe, neutreDes, type Consigne, type RecitDefense, rangRenom, revanchesOuvertes, porteeDe, angleDe, traversee, exposeDe, perteDe, strateVaincue, type Cible, type EntreeHistorique, type Jeu } from '../core/jeu';
import { moduleDef, porteurDef } from '../core/donnees';
import { ageArchipel, bandeauPort, vignetteArchipel, vignetteDistrict, visuel } from './art';
import { avatar, avatarGarde, gardesGarnison, coquille, decompte, ent, entete, NOM_LIGNEE, type EcranDistrict } from './coquille';
import { bloc, cle, etape, replie } from './presentation';
import { ICO, icone } from './icones';
import { htmlMissions } from './district';
import { htmlMarees } from './marees';
import { echap } from './outils';
import { cartePillages, pillagesOuverts, portOuvert } from './acces';
import { COULEUR } from './vue';
import { t } from '../core/i18n';

/** Ton district au centre de la carte ; les autres autour, à leur place fixe sur la mer des piliers (14 novembre 2026) */
const MOI: [number, number] = [50, 50];

/**
 * Les places des districts sur la carte (en % de la carte) : chacun dans sa direction réelle autour du tien, sur deux anneaux
 * (les plus proches dedans), et assez écartés pour que médaillons et noms ne se chevauchent jamais sur un téléphone.
 */
function placesCarte(cibles: Cible[], monId: string): [number, number][] {
  const n = cibles.length;
  if (!n) return [];
  const ordreDist = cibles.map((c, k) => ({ k, m: c.milles ?? 0 })).sort((a, b) => a.m - b.m).map((x) => x.k);
  const proche = new Set(ordreDist.slice(0, Math.ceil(n / 2)));
  // les directions, rangées, puis écartées d'au moins 70 % d'une part égale
  const l = cibles.map((c, k) => ({ k, a: angleDe(c, monId) })).sort((a, b) => a.a - b.a);
  const pas = ((2 * Math.PI) / n) * 0.7;
  for (let passe = 0; passe < 40; passe++) {
    for (let i = 0; i < l.length; i++) {
      const a = l[i]!, b = l[(i + 1) % l.length]!;
      let ecart = b.a - a.a;
      if (i === l.length - 1) ecart += 2 * Math.PI;
      if (ecart < pas) { const d = (pas - ecart) / 2; a.a -= d; b.a += d; }
    }
  }
  const p: [number, number][] = new Array(n);
  for (const { k, a } of l) {
    const r = proche.has(k) ? 30 : 40;
    p[k] = [Math.round((MOI[0] + r * Math.cos(a)) * 10) / 10, Math.round(Math.max(10, Math.min(84, MOI[1] + r * 0.9 * Math.sin(a))) * 10) / 10];
  }
  return p;
}

export function htmlPillages(e: EcranDistrict): string {
  const j = e.j;
  // la présentation (28 octobre 2026) : Port fermé, première visite, ou rouverte par le « ? »
  const pres = !portOuvert(j) ? 'fermee' : !j.portVu ? 'premiere' : e.portAide ? 'aide' : null;
  const aide = pres ? '' : `<button type="button" class="btn-icone" data-action="port-aide" aria-label="${t`Comment marche le Port`}">${ICO.aide}</button>`;
  // le bandeau peint (12 novembre 2026, Bryan : « rendre ceci beaucoup plus visuel ») : la mer des piliers derrière le titre
  let h = entete(t('La mer des piliers'), t('Le Port'), aide).replace('<header class="entete">', `<header class="entete pl-bandeau" style="--decor:url(${bandeauPort})">`);
  if (pres) return coquille(e, h + presentation(pres, pillagesOuverts(j)), 'pl pl-pres');

  // deux volets : les pillages et les missions en mer
  const pillOk = pillagesOuverts(j);
  const volet = e.voletPort ?? 'missions';
  const enMer = j.missions.length;
  majJetons(j, e.now);
  // chaque volet a son icône, et un point d'or quand quelque chose l'attend (12 novembre 2026)
  const ICO_VOLET = { pillages: ICO.grappin, missions: ICO.porteurs, marees: ICO.flux } as const;
  const seg = (id: 'pillages' | 'missions' | 'marees', nom: string, plus: string, attend = false) =>
    `<button type="button" role="tab" class="seg${volet === id ? ' actif' : ''}${attend ? ' attend' : ''}" data-action="port-volet" data-id="${id}" aria-selected="${volet === id}">`
    + `<span class="pl-seg-nom">${ICO_VOLET[id]}${nom}</span><small>${plus}</small></button>`;
  // les contrats de marée (31 octobre 2026) : un troisième volet ; le compte des contrats encore à remplir
  const marees = contratsDuMoment(j, e.now);
  const aRemplir = marees.filter((c) => c.ouvert && !c.reussi).length;
  const gabare = mareesDe(j).contrat;
  h += `<div class="segments-choix trois pl-volets" role="tablist" aria-label="${t`Pillages, missions en mer ou contrats de marée`}">`
    // l'ordre du 14 novembre 2026 (Bryan) : les missions d'abord, les pillages en dernier (ce qu'on utilise le moins)
    + seg('missions', t('Missions'), bulleBasses(j, e.now).aFaire ? t('une famille attend') : t`${enMer} / ${barquesMax(j)} en mer`, bulleBasses(j, e.now).aFaire)
    + seg('marees', t('Marées'), gabare ? t('gabare en mer') : marees.some((c) => c.ouvert) ? t`${aRemplir} à remplir` : t`dès la Strate −${MAREES.montante.strate}`, !gabare && aRemplir > 0)
    + seg('pillages', t('Pillages'), !pillOk ? t`dès la Strate −${PILLAGE.strateMin}` : revanchesOuvertes(j, e.now).length ? t('revanche possible') : t`${etatPillage(j).jetons} / ${PILLAGE.jetonsMax} jetons`, pillOk && (etatPillage(j).jetons >= PILLAGE.jetonsMax || revanchesOuvertes(j, e.now).length > 0)) + `</div>`;
  if (volet === 'missions') return coquille(e, h + htmlMissions(e), 'pl');
  if (volet === 'marees') return coquille(e, h + htmlMarees(e), 'pl');
  // pas encore de pillages : la raison, tirée du district, plutôt qu'une carte grisée
  if (!pillOk) return coquille(e, h + `<p class="fl-condition">${ICO.verrou}<span><strong>${t`Les districts voisins attendent · vaincs le gardien de la Strate −${PILLAGE.strateMin}`}</strong>`
    + `<small>${t`Le passeur ne mène pas de grappin chez les voisins pour un district qu’on ne connaît pas encore. Les missions en mer, elles, partent déjà.`}</small></span></p>`, 'pl');

  const prochain = majJetons(j, e.now);
  const etat = etatPillage(j);
  const monId = e.monId ?? 'moi';
  const { cibles, force, faits } = cartePillages(j, e.now, e.pillagesEnLigne ?? [], monId);
  const choisie = cibles.find((c) => c.id === e.pillageCible) ?? cibles.find((c) => c.bot && !faits.includes(c.id)) ?? cibles[0];
  const places = placesCarte(cibles, monId);

  // les jetons et le coffre : ce qu'on peut faire, ce qu'on risque
  h += `<section class="pl-etat" aria-label="${t`Jetons et coffre`}">`
    + `<div class="pl-jetons"><span class="surtitre">${ICO.grappin}${t`Jetons`}</span>`
    + `<span class="pl-gemmes" role="img" aria-label="${t`${etat.jetons} jetons sur ${PILLAGE.jetonsMax}`}">${Array.from({ length: PILLAGE.jetonsMax }, (_, k) => `<i class="${k < etat.jetons ? 'plein' : ''}"></i>`).join('')}</span>`
    + `<small>${prochain ? decompte(prochain, e.now, t('Un de plus dans ')) : t('Tous là : rien ne se perd.')}</small>${boutonAchat(j, e.now, etat.jetons)}</div>`
    + pavillon(j, e.now) + `</section>`;
  h += revanches(j, e.now);

  // la carte d'abord (audit du 7 novembre 2026 : elle arrivait en bas de l'écran), la garnison dessous
  // la carte
  const age = visuel(j.batiments.noyau);
  h += `<section class="pl-carte" aria-label="${t`La carte des districts voisins`}"><svg class="pl-routes" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">`
    + cibles.map((c, k) => { const [x, y] = places[k]!; return `<line x1="${MOI[0]}" y1="${MOI[1]}" x2="${x}" y2="${y}" class="${c === choisie ? 'vise' : ''}${faits.includes(c.id) || porteeDe(c, force) !== 'ok' ? ' faite' : ''}"/>`; }).join('')
    + `</svg>`
    + cibles.map((c, k) => {
      const [x, y] = places[k]!;
      const d = difficulte(c.force / force);
      const fait = faits.includes(c.id);
      const portee = porteeDe(c, force);
      const etiquette = fait ? t('Pillé') : portee === 'neutre' ? t('Neutre') : portee === 'faible' ? t('Trop faible') : portee === 'forte' ? t('Trop fort') : d.nom;
      return `<button type="button" class="pl-ile d${d.niveau}${c === choisie ? ' choisie' : ''}${fait ? ' faite' : ''}${portee !== 'ok' ? ' hors' : ''}${c.bot ? '' : ` directeur ${c.pavillon === 'pirate' ? 'pirate' : 'neutre'}`}" style="--x:${x}%;--y:${y}%" data-action="pillage-voir" data-id="${echap(c.id)}" aria-pressed="${c === choisie}" aria-label="${echap(`${c.nom} : ${etiquette}`)}">`
        + `<span class="pl-medaillon"><img src="${vignetteArchipel(ageArchipel(c.strate), c.id, true)}" alt="" decoding="async" loading="lazy">${fait ? `<span class="pl-fait">${ICO.ok}</span>` : ''}</span>`
        + `<span class="pl-nom">${c.bot ? '' : `<i class="pl-drapeau" aria-hidden="true"></i>`}${echap(c.nom)}</span><span class="pl-diff">${etiquette}</span></button>`;
    }).join('')
    + `<div class="pl-moi" style="--x:${MOI[0]}%;--y:${MOI[1]}%"><span class="pl-medaillon"><img src="${vignetteDistrict(age)}" alt="" decoding="async"></span><span class="pl-nom">${echap(j.directeur?.nom ?? t('Ton district'))}</span></div>`
    + `</section>`;

  if (choisie) h += ficheCible(j, choisie, force, faits.includes(choisie.id), etat.jetons, e.pavillonAvis === choisie.id);
  h += garde(j);
  h += journal(etat.historique ?? [], e.now);
  h += classement(j, e.renomTop ?? [], monId);
  h += `<p class="pl-regle">${ICO.bouclier}<span>${pavillonDe(j) === 'pirate'
    ? t`Sous pavillon pirate, ta garnison défend ton district même jeu fermé. Une attaque gagnée contre toi prend ${Math.round(PILLAGE.partVolee * 100)} % de ton minerai (${ent(exposeDe(j.composants, strateVaincue(j)))} aujourd’hui, plafonné), puis ${PILLAGE.bouclierMs / 3_600_000} h de bouclier ; ${PILLAGE.subiesMax} attaques par jour au plus. Tes cristaux, tes cartes et tes Éclats ne risquent jamais rien.`
    : t`Sous pavillon neutre, aucun directeur ne peut t’attaquer : rien ne risque rien. Les districts sans directeur restent ouverts à ton escouade.`}</span></p>`;
  return coquille(e, h, 'pl');
}

/** Le pavillon (14 novembre 2026) : neutre ou pirate, le Renom et ce qu'on expose */
function pavillon(j: Jeu, now: number): string {
  const p = pavillonDe(j);
  const e = etatPillage(j);
  if (p === 'neutre') {
    return `<div class="pl-pavillon neutre"><span class="surtitre"><i class="pl-drapeau" aria-hidden="true"></i>${t`Pavillon neutre`}</span>`
      + `<small>${t`Personne ne t’attaque. Hisse le pavillon pirate pour piller les autres directeurs et gagner du Renom.`}</small>`
      + `<button type="button" class="btn sec pl-hisser" data-action="pavillon" data-id="pirate">${t`Hisser le pavillon pirate`}</button></div>`;
  }
  const renom = e.renom ?? 0, rang = rangRenom(renom);
  const quand = neutreDes(j, now);
  return `<div class="pl-pavillon pirate"><span class="surtitre"><i class="pl-drapeau" aria-hidden="true"></i>${t`Pirate · ${rang.nom}`}</span>`
    + `<b>${ent(renom)}<small> ${t`Renom`}</small></b>`
    + `<small>${rang.suivant !== null ? t`${ent(rang.suivant - renom)} avant le rang suivant · ` : ''}${t`exposé : ${ent(exposeDe(j.composants, strateVaincue(j)))} minerai`}</small>`
    + (quand ? `<small class="pl-attente">${t`Neutre possible dans ${Math.ceil((quand - now) / 3_600_000)} h`}</small>`
      : `<button type="button" class="btn sec pl-hisser" data-action="pavillon" data-id="neutre">${t`Redevenir neutre`}</button>`) + `</div>`;
}

/** Les revanches ouvertes : qui t'a pillé ces dernières 24 h, sans jeton */
function revanches(j: Jeu, now: number): string {
  const l = revanchesOuvertes(j, now);
  if (!l.length) return '';
  return `<section class="pl-revanches" aria-label="${t`Revanches`}"><span class="surtitre">${ICO.atk}${t`Revanche · sans jeton, quelle que soit sa force`}</span><ul>`
    + l.map((r) => `<li><span><strong>${echap(r.nom)}</strong><small>${t`t’a pillé · encore ${Math.max(1, Math.ceil((r.jusqua - now) / 3_600_000))} h`}</small></span>`
      + `<button type="button" class="btn prim" data-action="pillage-revanche" data-id="${echap(r.id)}"${j.expedition ? ' disabled' : ''}>${ICO.grappin}${t`Revanche`}</button></li>`).join('')
    + `</ul></section>`;
}

/** Les pirates les plus redoutés : le classement du Renom */
function classement(j: Jeu, top: { id: string; nom: string; renom: number }[], monId: string): string {
  if (!top.length) return '';
  return `<section class="pl-renom" aria-label="${t`Les pirates les plus redoutés`}"><span class="surtitre">${icone('coffre')}${t`Les pirates les plus redoutés`}</span><ol>`
    + top.slice(0, 10).map((x, k) => `<li class="${x.id === monId ? 'moi' : ''}"><b>${k + 1}</b><span>${echap(x.id === monId ? (j.directeur?.nom ?? x.nom) : x.nom)}<small>${rangRenom(x.renom).nom}</small></span><em>${ent(x.renom)}</em></li>`).join('')
    + `</ol></section>`;
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
    + `<small class="pl-garde-aide">${t`Elle se défend seule, avec ses vraies cartes, quand d’autres directeurs t’attaquent. L’escouade qui attaque se choisit au départ du pillage${escouadeActive(j) === def ? t(' : la même peut faire les deux') : ''}.`}</small>`
    + consignes(j) + `</section>`;
}

/** Les consignes de la garnison (14 novembre 2026) : comment le robot joue tes cartes en défense */
export const NOMS_CONSIGNE: Record<Consigne, { nom: string; texte: string }> = {
  rempart: { nom: t('Rempart'), texte: t('Boucliers et soins d’abord : elle tient le plus longtemps possible.') },
  riposte: { nom: t('Riposte'), texte: t('Elle frappe fort et achève le premier Porteur qui faiblit.') },
  harcelement: { nom: t('Harcèlement'), texte: t('Longues chaînes, suites et cartes qui affaiblissent l’attaquant.') },
};
function consignes(j: Jeu): string {
  const c = consigneDe(j);
  return `<div class="pl-consigne"><span class="surtitre">${ICO.atk}${t`Consigne de la garnison`}</span>`
    + `<div class="pl-consigne-choix" role="radiogroup" aria-label="${t`Consigne de la garnison`}">`
    + (['rempart', 'riposte', 'harcelement'] as Consigne[]).map((k) => `<button type="button" role="radio" class="pl-consigne-btn${k === c ? ' actif' : ''}" data-action="consigne" data-id="${k}" aria-checked="${k === c}">${NOMS_CONSIGNE[k].nom}</button>`).join('')
    + `</div><small>${NOMS_CONSIGNE[c].texte}</small></div>`;
}

/** Le journal du port (27 octobre 2026) : les derniers pillages faits et subis, du plus récent au plus ancien */
function journal(h: EntreeHistorique[], now: number): string {
  const ilYa = (le: number) => {
    const m = Math.floor((now - le) / 60_000);
    return m < 1 ? t('à l’instant') : m < 60 ? t`il y a ${m} min` : m < 1440 ? t`il y a ${Math.floor(m / 60)} h` : t`il y a ${Math.floor(m / 1440)} j`;
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
        + `<span class="pl-j-txt"><span>${texte(x)}${x.carte ? t` · empreinte « ${moduleDef(x.carte).nom} »` : ''}${x.recit ? recit(x.recit) : ''}</span><small>${x.revanche ? t('Revanche · ') : x.sens === 'attaque' ? (x.bot ? t('District sans directeur · ') : t('Directeur · ')) : t('En défense · ')}${x.renom ? `${x.renom > 0 ? '+' : '−'}${Math.abs(x.renom)} ${t('Renom')} · ` : ''}${ilYa(x.le)}</small></span>`
        + `<b class="pl-j-val${x.composants > 0 ? ' plus' : x.composants < 0 ? ' moins' : ''}">${x.composants > 0 ? '+' : x.composants < 0 ? '−' : ''}${x.composants ? ent(Math.abs(x.composants)) : '—'}</b></li>`).join('')}</ul>`
      : `<p class="pl-j-vide">${t`Aucun pillage pour l’instant. Tes attaques et celles que ta garnison subit s’inscriront ici.`}</p>`)
    + `</section>`;
}

/** Le récit d'une défense : combien de tours, combien de Porteurs mis à terre, la carte qui a le plus compté */
function recit(r: RecitDefense): string {
  let nom = '';
  try { nom = r.carte ? moduleDef(r.carte).nom : ''; } catch { /* carte inconnue de cette version */ }
  const parts = [t`${r.tours} tours`, r.abattus ? t`${r.abattus} Porteur${r.abattus > 1 ? 's' : ''} adverse${r.abattus > 1 ? 's' : ''} à terre` : '', nom ? t`« ${nom} » a le plus compté` : ''].filter(Boolean);
  return `<em class="pl-recit">${parts.join(' · ')}</em>`;
}

/** La fiche de l'archipel choisi : sa garnison, tes chances, ce que tu gagnes ou laisses */
function ficheCible(j: Jeu, c: Cible, force: number, fait: boolean, jetons: number, avis = false): string {
  const ecart = c.force / force;
  const d = difficulte(ecart);
  const chance = Math.round(chanceVictoire(ecart) * 100);
  const butin = butinPillage(c, ecart);
  const portee = porteeDe(c, force);
  const perte = c.bot ? 0 : perteDe(j.composants, strateVaincue(j));
  const raison = portee === 'neutre' ? t('Pavillon neutre : ce directeur ne se pille pas.')
    : portee === 'faible' ? t('Trop faible pour toi : on ne pille pas plus petit que soi.')
    : portee === 'forte' ? t('Hors de portée : sa garnison est bien plus forte que ton escouade.')
    : fait ? t('Déjà pillé aujourd’hui : il reviendra demain.') : jetons < 1 ? t('Plus de jeton : le prochain revient bientôt.') : j.expedition ? t('Une expédition est déjà en cours.') : '';
  const qui = c.bot ? t('District sans directeur · un intendant le tient') : c.pavillon === 'pirate' ? t`Pirate · ${rangRenom(c.renom ?? 0).nom} · ${ent(c.renom ?? 0)} Renom` : t('Directeur · pavillon neutre');
  return `<section class="pl-fiche d${d.niveau}" aria-label="${echap(c.nom)}">`
    + `<header><div><span class="surtitre">${t`${qui} · Strate −${c.strate} · traversée ${traversee(c.milles ?? 0)}\u00a0s`}</span><h2>${echap(c.nom)}</h2></div>`
    + `<span class="pl-badge">${d.nom}<small>${t`${chance < 1 ? '< 1' : chance > 99 ? '> 99' : chance} % de chances`}</small></span></header>`
    + `<div class="pl-garnison"><span class="surtitre">${c.garnison ? t`Son escouade · consigne ${NOMS_CONSIGNE[c.garnison.consigne ?? 'riposte'].nom} · en duel` : t`La garnison`}</span><ul>${c.garnison
      ? c.garnison.porteurs.map((p) => { const d = porteurDef(p.id); return `<li style="--c:${COULEUR[d.lignee]}">${avatar(p.id, 40)}<span><strong>${echap(d.nom)}</strong><small>${t`${NOM_LIGNEE[d.lignee]} · ${p.cartes.length} cartes`}</small></span></li>`; }).join('')
      : gardesGarnison(c.porteurs).map((g) => `<li style="--c:${COULEUR[g.lignee]}">${avatarGarde(g, 40)}<span><strong>${echap(g.nom)}</strong><small>${NOM_LIGNEE[g.lignee]}</small></span></li>`).join('')}</ul>`
    + `<div class="pl-forces"><span>${t`Garnison`} <b>${Math.round(c.force * 100)}</b></span><span class="pl-jauge" aria-hidden="true"><i style="width:${Math.min(100, Math.round((50 * c.force) / force))}%"></i></span><span>${t`Escouade ${escouadeActive(j) + 1}`} <b>${Math.round(force * 100)}</b></span></div></div>`
    + `<dl class="pl-enjeu"><div class="pl-gain"><dt>${t`Si tu gagnes`}</dt><dd>${ICO.composants}<b>+${ent(butin.base + butin.vol)}</b><small>${butin.vol ? t`minerai, dont ${ent(butin.vol)} pris à ses réserves` : t('minerai')}</small></dd>`
    + `<p class="pl-plus">${c.bot ? t`une chance sur trois d’emporter l’empreinte d’une carte` : t`+ l’empreinte d’une de ses cartes et du Renom`}</p></div>`
    + `<div class="pl-perte"><dt>${t`Si tu perds`}</dt><dd>${ICO.composants}<b>${perte ? `−${ent(perte)}` : '0'}</b><small>${c.bot ? t('rien à laisser') : t`${Math.round(PILLAGE.perteDefaite * 100)} % de ton minerai, et du Renom`}</small></dd></div></dl>`
    + (raison ? `<p class="pl-raison">${ICO.verrou}${raison}</p>`
      : avis ? `<p class="pl-raison pl-avis">${ICO.atk}${t`Attaquer un directeur hisse ton pavillon pirate : d’autres pirates pourront te piller, et tu ne pourras redevenir neutre que 72 h après ta dernière attaque.`}</p>`
      : `<p class="pl-raison pl-suite">${ICO.porteurs}${t`Tu choisis l’escouade qui attaque à l’étape suivante.`}</p>`)
    + `<button type="button" class="btn prim large" data-action="pillage-preparer" data-id="${echap(c.id)}"${raison ? ' disabled' : ''}>${ICO.grappin}${avis ? t`Hisser le pavillon et préparer` : t`Préparer le pillage`}</button>`
    + (avis ? `<button type="button" class="btn sec" data-action="pavillon-avis">${t`Rester neutre`}</button>` : '') + `</section>`;
}


/**
 * La présentation du Port (28 octobre 2026, Bryan : « refais tout convenablement ») : son histoire, les missions en mer,
 * les pillages et la défense. Montrée tant que le Port est fermé, à la première visite, puis à la demande (« ? »).
 */
function presentation(etat: 'fermee' | 'premiere' | 'aide', pillOk = true): string {
  const recharge = `${Math.floor(PILLAGE.rechargeMs / 3_600_000)} h ${Math.round((PILLAGE.rechargeMs % 3_600_000) / 60_000)}`;
  const perte = `−${Math.round(PILLAGE.perteDefaite * 100)} %`, expose = `${Math.round(PILLAGE.partVolee * 100)} %`;
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
    + (!pillOk ? '' : bloc(ICO.grappin, t('Les pillages'), t('Ton escouade traverse la mer des piliers et attaque la garnison d’un district de ta force.'), [
      cle(ICO.grappin, String(PILLAGE.jetonsMax), t`jetons, un toutes les ${recharge}`),
      cle(ICO.composants, t('Butin'), t('minerai, empreintes de cartes, Renom')),
      cle(ICO.descendre, perte, t('de ton minerai si un pirate te repousse')),
    ])
    + bloc(ICO.bouclier, t('Ton pavillon'), t('Neutre, personne ne t’attaque. Pirate, tu pilles les autres pirates et ils te pillent.'), [
      cle(ICO.coffre, expose, t('de ton minerai exposé, plafonné')),
      cle(ICO.bouclier, `${PILLAGE.bouclierMs / 3_600_000} h`, t('de bouclier après une défaite')),
      cle(ICO.atk, String(PILLAGE.subiesMax), t('attaques subies par jour au plus')),
    ]))

    + replie(t('L’histoire'), `<p>${t`Quand la mer est montée, chaque quartier s’est accroché à ses piliers ; le tien s’est retranché derrière sa digue. Entre eux, il ne reste que l’eau, les ruines de l’ancien monde, et les passeurs qui connaissent les courants.`}</p>`
      + `<p>${t`Les Accords de 2101 interdisent d’aborder les Hauts. Mais entre districts d’en bas, personne n’a jamais rien signé : certains hissent le pavillon pirate, d’autres restent neutres et laissent passer les barques.`}</p>`)
    + replie(t('Les règles en détail'), `<ul class="fl-pr-etapes">`
      + etape(ICO.porteurs, t('Un Porteur libre prend la barque'), t`Vers un pilier abandonné ou une ruine noyée : ${MISSIONS.courte.heures} h ou ${MISSIONS.longue.heures} h, sans rien payer : seulement le temps du Porteur. Le nombre de barques en mer en même temps grandit avec la Tour du Noyau : 1, puis 2 au niveau 3, 3 au niveau 6 et 4 au niveau 9.`)
      + etape(ICO.coffre, t('Il revient chargé'), t('Du minerai, des doublons de cartes de sa lignée, parfois une carte nouvelle, et des rescapés qui deviennent creuseurs. L’eau froide laisse un peu d’Usure.'))
      + etape(ICO.grappin, t`${PILLAGE.jetonsMax} jetons, un toutes les ${recharge}`, t('Chaque pillage en coûte un. Rien ne se perd pendant ton absence : ils t’attendent.'))
      + etape(ICO.carte, t('La mer des piliers'), t('Chaque district a sa place fixe : tes voisins restent tes voisins. Plus ils sont loin, plus la traversée dure (quelques secondes).'))
      + etape(ICO.atk, t('Un combat contre la garnison'), t('Les districts sans directeur sont ouverts à tous. Les vrais directeurs, seulement s’ils sont pirates et de ta force. Un district par jour au plus.'))
      + etape(ICO.composants, t('Le butin'), t`Du minerai (plus la garnison est forte, plus il y en a), parfois l’empreinte d’une carte de la garnison, et contre un directeur : l’empreinte à coup sûr, du Renom, et ${expose} de son minerai.`)
      + etape(ICO.bouclier, t('Ton pavillon'), t`Neutre : aucun directeur ne t’attaque, rien ne risque rien. Pirate : tu exposes ${expose} de ton minerai (plafonné) ; perdre une attaque te coûte ${perte.slice(1)}. Attaquer un directeur hisse le pavillon pirate, et on ne redevient neutre que 72 h après sa dernière attaque. Tes cristaux, tes cartes et tes Éclats ne risquent jamais rien.`)
      + etape(ICO.porteurs, t('Ta garnison se défend seule'), t('Choisis laquelle de tes trois escouades garde le port. Elle se bat même jeu fermé.'))
      + etape(ICO.grappin, t('Revanche, bouclier et limite'), t`Qui te pille, tu peux lui rendre la pareille dans les 24 h, sans jeton. Après une attaque perdue, ${PILLAGE.bouclierMs / 3_600_000} h de bouclier ; ${PILLAGE.subiesMax} attaques par jour au plus.`)
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
