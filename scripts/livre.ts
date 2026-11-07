// Le livre d'EMPREINTES (7 novembre 2026, Bryan : « une sorte de livre, pour que sans jouer je puisse tout lire »,
// puis « cohérent, plaisant à lire, intrigant, et surtout une narration logique »).
// Tous les textes viennent du code du jeu (rien n'est recopié à la main : le livre suit le jeu). L'assemblage suit
// la relecture de trois éditeurs : un seul récit, raconté par le dossier qu'Ysé monte avec le carnet du directeur ;
// les chapitres d'Ysé glissés entre les Strates, jamais plus haut que la profondeur où on peut les croire ;
// un chemin principal (les choix les plus repris plus loin), les autres gestes « en marge » ; aucun chiffre de jeu.
// usage : npx tsx scripts/livre.ts <dossier>  → <dossier>/index.html + <dossier>/images.txt (les images à joindre)
// Les images sont ensuite réduites et copiées par scripts/livre-images.py.

import { mkdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { PLANS } from '../src/ui/intro';
import { CHAPITRES, type Chapitre } from '../src/core/chroniques';
import { PERSONNAGES, SCENES, repliquesDe, type ContexteCampagne, type Replique, type Scene } from '../src/core/campagne';
import { HALTES, QUETES, BESTIAIRE, nombreHaltes, revelationDe, voixDetail, type ChoixHalte, type HalteDef, type Voix } from '../src/core/strates';
import { FRAGMENTS, FAMILLES } from '../src/core/fragments';
import { FILS } from '../src/core/fils';
import { ORIGINES, PRESENTATIONS } from '../src/core/lore-porteurs';
import { LORE_CARTES } from '../src/core/lore-cartes';
import { RUMEURS } from '../src/core/rumeurs';
import { RODEURS } from '../src/core/explorer';
import { DECISIONS } from '../src/core/partie/nouvelle';
import { LETTRE_LEGS } from '../src/core/partie/recompenses';
import { ennemiDef, moduleDef, porteurDef, zoneDe } from '../src/core/donnees';

const racine = resolve(import.meta.dirname, '..');
const sortie = resolve(process.argv[2] ?? resolve(racine, '.livre'));
mkdirSync(sortie, { recursive: true });

// ---------- les images du jeu (Midjourney), quand elles existent ----------
const images = new Set<string>();
const artTs = readFileSync(resolve(racine, 'src/ui/art.ts'), 'utf8');
const carte = (nom: string) => {
  const m = artTs.match(new RegExp(`const ${nom}: Record<string, string> = \\{([\\s\\S]*?)\\n\\};`));
  return Object.fromEntries([...(m?.[1] ?? '').matchAll(/'([^']+)':\s*'([^']+)'/g)].map((x) => [x[1]!, x[2]!]));
};
const MODULES_IMG = carte('MODULES_ILLUSTRES');
const ENNEMIS_IMG = carte('ENNEMIS_ILLUSTRES');
function img(chemin: string): string | null {
  if (!existsSync(resolve(racine, 'public', chemin))) return null;
  images.add(chemin);
  return `img/${chemin.replace(/^art\//, '')}`;
}
const imgStrate = (s: number) => img(`art/strates/strate-${s}.webp`);
const imgScene = (id: string) => img(`art/scenes/${id}.webp`);
const imgPorteur = (id: string) => img(`art/porteurs/${id}.webp`);
const imgPersonnage = (id: string) => img(`art/personnages/${id}.webp`);
const imgEnnemi = (id: string) => (ENNEMIS_IMG[id] ? img(`art/ennemis/${ENNEMIS_IMG[id]}.webp`) : img(`art/ennemis/${id}.webp`));
const imgModule = (id: string) => (MODULES_IMG[id] ? img(`art/modules/${MODULES_IMG[id]}.webp`) : null);
const imgIntro = (id: string) => img(`intro/${id}.webp`);

// ---------- petits outils ----------
const e = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const essai = <T>(f: () => T): T | undefined => { try { return f(); } catch { return undefined; } };
function orateur(qui: string): { nom: string; img: string | null } {
  if (!qui) return { nom: '', img: null };
  const p = essai(() => porteurDef(qui));
  if (p?.nom) return { nom: p.nom, img: imgPorteur(qui) };
  if (PERSONNAGES[qui]) return { nom: PERSONNAGES[qui]!.nom, img: imgPersonnage(qui) };
  const en = essai(() => ennemiDef(qui));
  return { nom: en?.nom ?? qui, img: imgEnnemi(qui) };
}
const portraitRond = (src: string | null, nom: string) =>
  src ? `<img class="rond" src="${src}" alt="" loading="lazy">` : `<span class="rond vide">${e(nom.charAt(0) || '·')}</span>`;
const figure = (src: string | null, cls = '') => (src ? `<figure class="ill ${cls}"><img src="${src}" alt="" loading="lazy"></figure>` : '');
const paragraphes = (t: string[]) => t.map((p) => `<p>${e(p)}</p>`).join('');
/** le livre ne compte pas le butin : on retire des récits les phrases de trouvaille (Éclats, composants, matériel) */
const sansButin = (t: string) => {
  const phrases = t.match(/[^.!?…]+[.!?…]+(\s*»)?\s*/g) ?? [t];
  const gardees = phrases.filter((p) => !/Éclat|composants|matériel|outils de graveur|se revend|vivres|du sac de/i.test(p));
  return (gardees.length ? gardees.join('') : t).trim();
};

// ---------- le chemin principal ----------
// Qui est là à chaque Strate : l'escouade de départ, puis les Porteurs à leur arrivée dans la campagne.
const ARRIVEES: [string, number][] = [['ilka', 1], ['doran', 1], ['vela', 1], ['sasha', 2], ['nuit', 3], ['kessa', 4], ['aurel', 5], ['liane', 6], ['joss', 8]];
const presents = (s: number) => ARRIVEES.filter(([, k]) => s >= k).map(([id]) => id);
// Les deux premières décisions du chemin (relecture : la commission, cohérente avec Ysé narratrice ; la lecture refusée)
const ACTES = { chambre: 'commission', lecture: 'refuser' } as const;
// À chaque Halte, le geste dont le souvenir revient le plus souvent plus loin (à égalité : le premier)
const rappels = (f: string | undefined) => !f ? 0
  : HALTES.reduce((n, h) => n + h.details.reduce((m, d) => m + d.voix.filter((v) => v.si === f).length, 0), 0)
  + SCENES.reduce((n, s) => n + s.repliques.filter((r) => r.souvenir === f).length, 0);
const choixFaits: Record<string, number> = {};
const drapeaux: string[] = [];
for (const h of HALTES) {
  const k = rappels(h.choix[1]!.drapeau) > rappels(h.choix[0]!.drapeau) ? 1 : 0;
  choixFaits[`${h.strate}-${h.n}`] = k;
}
const ctx = (s: number, fin?: string): ContexteCampagne => ({
  strate: s, vaincue: s, presents: presents(s), drapeaux: [...drapeaux], choixHaltes: choixFaits,
  actes: { ...(s >= 4 ? { chambre: ACTES.chambre } : {}), ...(s >= 7 ? { lecture: ACTES.lecture } : {}), ...(fin ? { fin } : {}) },
});

// ---------- le sommaire ----------
const sommaire: { id: string; titre: string; niveau: 1 | 2 }[] = [];
const titrePartie = (id: string, sur: string, titre: string, chapeau = '', image: string | null = null) => {
  sommaire.push({ id, titre, niveau: 1 });
  return `<section class="partie" id="${id}">${image ? `<div class="partie-img"><img src="${image}" alt="" loading="lazy"></div>` : ''}<div class="partie-txt"><span class="sur">${e(sur)}</span><h1>${e(titre)}</h1>${chapeau ? `<p class="chapeau">${e(chapeau)}</p>` : ''}</div></section>`;
};
const titreChapitre = (id: string, sur: string, titre: string, court = titre) => {
  sommaire.push({ id, titre: court, niveau: 2 });
  return `<header class="chap" id="${id}"><span class="sur">${e(sur)}</span><h2>${e(titre)}</h2></header>`;
};

// ---------- les textes de liaison (relecture éditoriale du 7 novembre 2026) ----------
const NOTE_ARCHIVISTE = [
  'Ce dossier n’a pas de cote. Je l’ai monté avec deux sortes de pages : les chapitres que je t’ai écrits la troisième nuit après ton élection, et celles de ton carnet, que tu m’as rapportées Strate après Strate, mouillées, raturées, parfois écrites dans le noir. Je les ai rangées les unes entre les autres. Chaque chapitre arrive au moment où tu étais descendu assez bas pour le croire, pas avant.',
  'Tu as souvent hésité entre deux gestes. J’ai mis dans le texte celui que tu as fait, et dans la marge celui que tu as failli faire. Une archive qui ne garde qu’une version n’est pas une archive. C’est une plaque de bronze.',
];
const PORTE_RONDE = [
  'Le puisard avait été creusé pour sauver les pompes. Au fond, la porte attendait : ronde, tiède sous la main, ses joints allumés comme une veilleuse qu’on aurait oubliée. Personne n’y avait touché avant toi. Tu as poussé. Elle a cédé sans un bruit.',
  'Dedans, des cristaux par dizaines, posés n’importe comment, comme on range en tremblant. Par terre, un ordre de service de 2066, tamponné deux fois. Et dans l’air, des voix si mêlées qu’on ne savait plus où finissait l’une. Quelque chose s’est levé de ce mélange, a cherché la pente, et a coulé vers les pompes noyées.',
  'Véla s’est adossée au mur. « Ce n’est pas ma peur, a-t-elle dit. C’est la leur. »',
];
const CHAPEAUX: Record<number, { titre: string; texte: string[] }> = {
  1: { titre: 'Acte I · La chambre', texte: [] },
  2: { titre: 'Acte II · Les salles closes', texte: [
    'Trois Strates, et une certitude : nos piliers reposent sur l’escalier de quelqu’un d’autre. Plus bas, on ne descend plus de marches, on passe des seuils. Les portes y sont rondes et fermées de l’intérieur. Les fouilleurs disent « les salles closes » en baissant la voix, comme on parle des voisins.',
    'C’est là qu’en 2066 le district a muré une paroi derrière laquelle quelqu’un pleurait. Le père de Doran était de l’équipe. Il n’a jamais barré son nom.'] },
  3: { titre: 'Acte III · Ceux d’avant', texte: [
    'Les Hauts t’ont écrit sur un papier qui sent la pluie propre ; on t’attend à la Flèche. Tu descends quand même.',
    'Sous les salles closes commencent les Registres : des tables gravées, des lignes d’eau qui montent, des colonnes où les noms disparaissent. Jusqu’ici, on visitait des ruines. À partir d’ici, on lit des gens.'] },
};
const TROIS_MATINS = 'La Tisseuse coud aussi avec ce qui pourrait arriver. Je l’ai appris trop tard pour m’en servir, assez tôt pour l’écrire. Voici trois matins au sommet de la Tour du Noyau. Un seul aura lieu. C’est la seule page de ce dossier que je ne peux pas écrire à ta place.';
// Les chapitres d'Ysé entre les Strates (0 = l'ouverture ; 'fin' = la dernière page)
const INTERLUDES: Record<string, string[]> = {
  0: ['lettre', 'oubli', 'toi'],
  1: ['ligne-bleue', 'infos', 'caves'],
  2: ['detroit', 'pieds-mouilles', 'noir', 'sans-glace'],
  3: ['chouettes', 'fonte', 'fracture'],
  4: ['portes', 'montee', 'puits-zero'],
  5: ['graveur', 'sept', 'ascension'],
  6: ['reponse', 'accords', 'vierges', 'theories'],
  7: ['deux-fois'],
  8: ['glaciere', 'avant'],
  fin: ['post-scriptum', 'clause'],
};
const NOMS_STRATES: Record<number, string> = { 1: 'Les Pompes noyées', 2: 'Les Abris murés', 3: 'La Galerie aux lueurs', 4: 'Les Portes rondes', 5: 'Le Treillis', 6: 'Le Mur de 2066', 7: 'Les Deux Rives', 8: 'La Ruche d’ambre', 9: 'Le Ciel d’en bas', 10: 'Le Puits d’avant' };

// ---------- les morceaux du récit ----------
const chapitre = (c: Chapitre) => titreChapitre(`chr-${c.id}`, `Lettre d’Ysé · ${c.epoque}`, c.titre)
  + figure(c.image ? imgIntro(c.image) : null)
  + `<div class="lettre">${paragraphes(c.paragraphes)}</div>`
  + (c.documents ?? []).map((d) => `<aside class="document"><span class="sur">${e(d.support)}</span><h4>${e(d.titre)}</h4>${paragraphes(d.lignes)}</aside>`).join('');
const interlude = (cle: string) => (INTERLUDES[cle] ?? []).map((id) => { const c = CHAPITRES.find((x) => x.id === id); return c ? chapitre(c) : ''; }).join('');
const voix = (v: Voix | Replique) => {
  const o = orateur(v.qui);
  return `<div class="voix">${portraitRond(o.img, o.nom)}<div>${o.nom ? `<strong>${e(o.nom)}</strong>` : ''}<p>${e(v.texte)}</p></div></div>`;
};
const recitSeul = (t: string) => `<p class="recit">${e(t)}</p>`;
const scene = (s: Scene, c: ContexteCampagne) => {
  const im = imgScene(s.id) ?? ('ennemi' in s.image ? imgEnnemi(s.image.ennemi) : 'strate' in s.image ? imgStrate(s.image.strate) : imgIntro(s.image.intro));
  return `<article class="scene">${figure(im, 'large')}<h3>${e(s.titre)}</h3>${recitSeul(s.recit)}${repliquesDe(s, c).map(voix).join('')}</article>`;
};
/** une Halte racontée : le lieu, ce qu'on y regarde (la voix d'un Porteur présent), le geste fait, ce que l'enquête trouve */
function halte(h: HalteDef, marge: string[]): string {
  const debout = presents(h.strate);
  const k = choixFaits[`${h.strate}-${h.n}`]!;
  const fait = h.choix[k]!;
  const autre = h.choix[1 - k]!;
  let r = `<article class="halte"><h3>${e(h.titre)}</h3>${recitSeul(h.recit)}`;
  for (const d of h.details) r += `<div class="detail"><span class="detail-nom">${e(d.nom)}</span>${voix(voixDetail(d, debout, drapeaux))}</div>`;
  r += `<p class="geste">${e(sansButin(fait.recit))}</p>`;
  if (fait.drapeau) drapeaux.push(fait.drapeau);
  const rev = revelationDe(choixFaits, h.strate, h.n);
  if (rev) {
    r += `<div class="revelation"><h4>${e(rev.r.nom)}</h4>${voix(voixDetail({ nom: rev.r.nom, voix: rev.r.voix }, debout, drapeaux))}</div>`;
    const autreP = rev.piste === 'nous' ? 'avant' : 'nous';
    const ar = h.revelation![autreP];
    marge.push(`<p><b>Si l’enquête avait suivi l’autre piste · ${e(ar.nom)}.</b> ${e(ar.fait)}</p>`);
  }
  marge.push(`<p><b>${e(h.titre)} · le geste que tu as failli faire : ${e(autre.texte.charAt(0).toLowerCase() + autre.texte.slice(1))}.</b> ${e(sansButin(autre.recit))}</p>`);
  return r + `</article>`;
}
const quete = (s: number) => {
  const q = QUETES.find((x) => x.strate === s);
  return q ? `<aside class="quete"><span class="sur">À force de descendre</span><h4>${e(q.nom)}</h4><p>${e([...q.etapes, q.fin].join(' '))}</p></aside>` : '';
};
const portraitCourt = (id: string) => {
  const p = PRESENTATIONS[id];
  if (!p) return '';
  const nom = essai(() => porteurDef(id).nom) ?? id;
  return `<aside class="arrivee">${imgPorteur(id) ? `<img src="${imgPorteur(id)}" alt="" loading="lazy">` : ''}<div><span class="sur">${e(p.titre)}</span><h4>${e(nom)}</h4><p>${e(p.texte)}</p>${p.replique ? `<p class="replique">« ${e(p.replique)} »</p>` : ''}</div></aside>`;
};
/** une décision racontée comme un débat : chaque voix défend une option, puis le choix retenu */
const decision = (d: { titre: string; texte: string; options: { id: string; nom: string; phrase: string }[] }, qui: Record<string, string>, retenu: string, apres: string) =>
  `<article class="decision"><h3>${e(d.titre)}</h3>${recitSeul(d.texte)}`
  + d.options.map((o) => voix({ qui: qui[o.id] ?? '', texte: `${o.nom}. « ${o.phrase} »` })).join('')
  + `<p class="geste">${e(apres.replace('{choix}', d.options.find((o) => o.id === retenu)!.nom.toLowerCase()))}</p></article>`;

// ---------- l'assemblage ----------
let corps = '';
const ysé = imgPersonnage('yse');
corps += titrePartie('ouverture', 'Ouverture', 'Le dossier d’Ysé', '', ysé);
corps += `<div class="lettre note">${paragraphes(NOTE_ARCHIVISTE)}<p class="signe">— Ysé, à la Tour du Noyau</p></div>`;
corps += interlude('0');
corps += titreChapitre('porte-ronde', 'Le matin de la découverte', 'La porte ronde') + figure(imgIntro('10-toi') ?? imgIntro('10-dessous')) + `<div class="lettre">${paragraphes(PORTE_RONDE)}</div>`;
corps += ['ilka', 'doran', 'vela'].map(portraitCourt).join('');

let acte = 0;
let marge: string[] = [];
let carnet: string[] = [];
const finStrate = (s: number) => {
  let r = quete(s);
  if (carnet.length) r += `<aside class="carnet"><span class="sur">Carnet du directeur · −${s}</span>${carnet.map((t) => `<p>${e(t)}</p>`).join('')}</aside>`;
  if (marge.length) r += `<aside class="marge"><span class="sur">En marge</span>${marge.join('')}</aside>`;
  marge = []; carnet = [];
  return r;
};
for (let s = 1; s <= 10; s++) {
  const a = s <= 3 ? 1 : s <= 6 ? 2 : 3;
  if (a !== acte) {
    acte = a;
    corps += titrePartie(`acte-${a}`, CHAPEAUX[a]!.titre.split(' · ')[0]!, CHAPEAUX[a]!.titre.split(' · ')[1]!, '', a === 1 ? imgStrate(1) : a === 2 ? imgStrate(4) : imgStrate(7));
    if (CHAPEAUX[a]!.texte.length) corps += `<div class="lettre chapeau-acte">${paragraphes(CHAPEAUX[a]!.texte)}</div>`;
    if (a === 3) { const cv = SCENES.find((x) => x.id === 'convocation'); if (cv) corps += scene(cv, ctx(7)); }
  }
  const z = essai(() => zoneDe(s));
  corps += titreChapitre(`strate-${s}`, `Strate −${s}${z ? ` · ${z.nom}` : ''}`, NOMS_STRATES[s]!, `−${s} · ${NOMS_STRATES[s]}`);
  const rumeur = RUMEURS.find((r) => r.strate === s);
  if (rumeur) corps += `<p class="epigraphe">${e(rumeur.texte)}<span>Au marché</span></p>`;
  for (const [id, k] of ARRIVEES) if (k === s && s > 1) corps += portraitCourt(id);
  const entree = SCENES.find((x) => x.id === `entree-${s}`);
  if (entree) corps += scene(entree, ctx(s));
  else corps += figure(imgStrate(s), 'large');
  for (let n = 1; n <= nombreHaltes(s); n++) {
    const h = HALTES.find((x) => x.strate === s && x.n === n);
    if (h) { corps += halte(h, marge); carnet.push(h.fait); const rv = revelationDe(choixFaits, s, n); if (rv) carnet.push(rv.r.fait); }
  }
  const gardien = SCENES.find((x) => x.id === `gardien-${s}`);
  if (gardien) corps += scene(gardien, ctx(s));
  if (s === 1) corps += `<article class="decision"><h3>${e(LETTRE_LEGS.titre)}</h3>${recitSeul(LETTRE_LEGS.texte)}<blockquote>${e(LETTRE_LEGS.lettre)}</blockquote></article>`;
  corps += finStrate(s);
  if (s === 3) corps += decision(DECISIONS.chambre, { orseve: 'hald', district: 'ilka', commission: 'tobin' }, ACTES.chambre, 'Tu as tranché : {choix}. La chambre ne serait ni aux Hauts ni au district seul. Tobin a remonté ses manches.');
  if (s === 6) corps += decision(DECISIONS.lecture, { autoriser: 'vela', refuser: 'doran' }, ACTES.lecture, 'Tu as dit non. Véla a baissé les yeux, puis elle a souri. « On n’entre pas deux fois chez quelqu’un sans y être invité. Tu as raison. Pour cette fois. »');
  corps += interlude(String(s));
}
// la fin : la décision ouverte, les trois matins, l'épilogue commun, puis les deux dernières lettres
const epi = SCENES.find((x) => x.id === 'epilogue')!;
const df = DECISIONS.fin;
corps += titrePartie('fin', 'Épilogue', 'Trois matins', '', imgScene('epilogue'));
corps += `<article class="decision"><h3>${e(df.titre)}</h3>${recitSeul(df.texte)}</article><div class="lettre">${paragraphes([TROIS_MATINS])}</div>`;
const communes = repliquesDe(epi, ctx(10)).map((r) => r.texte);
for (const o of df.options) {
  const propres = repliquesDe(epi, ctx(10, o.id)).filter((r) => !communes.includes(r.texte));
  corps += `<div class="matin"><span class="sur">${e(o.nom)}</span><p class="phrase">« ${e(o.phrase)} »</p>${propres.map(voix).join('')}</div>`;
}
corps += `<article class="scene">${recitSeul(epi.recit)}${repliquesDe(epi, ctx(10)).map(voix).join('')}</article>`;
corps += interlude('fin');

// ---------- les annexes ----------
corps += titrePartie('annexes', 'Annexes', 'Pièces du dossier', 'Ce que le récit n’a pas pu porter : les papiers retrouvés, les Porteurs, le bestiaire, les cartes, et le film d’ouverture du jeu.');
corps += titreChapitre('archives', 'Annexe A', 'Les papiers retrouvés');
for (const f of [...FRAGMENTS, ...FAMILLES]) corps += `<aside class="document"><span class="sur">${e(f.support)}</span><h4>${e(f.titre)}</h4>${paragraphes(f.lignes)}</aside>`;
corps += titreChapitre('porteurs', 'Annexe B', 'Les Porteurs, de plus près');
for (const [id, p] of Object.entries(PRESENTATIONS)) {
  if (['coursier', 'docker', 'guetteur'].includes(id)) continue;
  const nom = essai(() => porteurDef(id).nom) ?? id;
  corps += `<h3 class="annexe-nom">${e(nom)}</h3>`;
  if (p.pourquoi) corps += `<p>${e(p.pourquoi)}</p>`;
  if (p.aParte) corps += `<aside class="document"><h4>${e(p.aParte.titre)}</h4><p>${e(p.aParte.texte)}</p></aside>`;
  for (const o of ORIGINES[id] ?? []) corps += `<div class="palier"><h4>${e(o.titre)}</h4><p>${e(o.texte)}</p></div>`;
  const fil = FILS[id];
  if (fil) corps += `<aside class="quete"><span class="sur">Son histoire</span><h4>${e(fil.titre)}</h4>${fil.etapes.map((x) => `<p><strong>${e(x.titre)}.</strong> ${e(x.recit)}</p>`).join('')}</aside>`;
}
corps += titreChapitre('bestiaire', 'Annexe C', 'Le bestiaire') + `<p class="avertissement">Les fiches contiennent les secrets des ennemis : à lire après le récit.</p>`;
const GARDIENS = new Set(['confluence', 'gardien-registres', 'tisseuse', 'premier-porteur']);
for (const [id, f] of Object.entries(BESTIAIRE)) {
  if (GARDIENS.has(id)) continue;
  const nom = RODEURS.find((r) => r.id === id)?.dans ?? essai(() => ennemiDef(id).nom) ?? id;
  corps += `<div class="bete">${imgEnnemi(id) ? `<img src="${imgEnnemi(id)}" alt="" loading="lazy">` : ''}<div><h4>${e(nom)}</h4><p>${e(f.origine)}</p><p class="secret"><span>Secret</span>${e(f.secret)}</p></div></div>`;
}
corps += titreChapitre('cartes', 'Annexe D', 'Les cartes') + `<div class="cartes">`;
for (const [id, t] of Object.entries(LORE_CARTES)) {
  const nom = essai(() => moduleDef(id).nom) ?? id;
  corps += `<div class="carte">${imgModule(id) ? `<img src="${imgModule(id)}" alt="" loading="lazy">` : ''}<div><h4>${e(nom)}</h4><p>${e(t)}</p></div></div>`;
}
corps += `</div>`;
corps += titreChapitre('marche', 'Annexe E', 'Ce qu’on dit au marché') + `<ul class="rumeurs">${RUMEURS.filter((r) => !r.strate).map((r) => `<li>${e(r.texte)}</li>`).join('')}</ul>`;
corps += titreChapitre('film', 'Annexe F', 'Le film d’ouverture du jeu');
for (const p of PLANS) corps += `<p><strong>${e(p.titre)}.</strong> ${e(p.lignes.join(' '))}</p>`;

// ---------- la page ----------
const toc = sommaire.map((s) => `<a class="n${s.niveau}" href="#${s.id}">${e(s.titre)}</a>`).join('');
const date = new Date().toLocaleDateString('fr-BE', { day: 'numeric', month: 'long', year: 'numeric' });
const page = `<!DOCTYPE html>
<html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>EMPREINTES — Le livre</title>
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Literata:ital,opsz,wght@0,7..72,400;0,7..72,600;1,7..72,400&family=Marcellus&family=Saira:wght@500;600&display=swap" rel="stylesheet">
<style>${readFileSync(resolve(racine, 'scripts/livre.css'), 'utf8')}</style></head>
<body>
<div class="progres" aria-hidden="true"><i></i></div>
<header class="barre"><a href="#couverture" class="marque">EMPREINTES</a><button type="button" id="ouvrir" aria-controls="toc" aria-expanded="false">Sommaire</button></header>
<nav id="toc" class="toc" aria-label="Sommaire" hidden><div class="toc-in"><div class="toc-tete"><span>Sommaire</span><button type="button" id="fermer" aria-label="Fermer le sommaire">✕</button></div>${toc}</div></nav>
<main>
<section class="couverture" id="couverture">${imgIntro('00-titre') ? `<img src="${imgIntro('00-titre')}" alt="">` : ''}<div class="couv-txt"><h1>EMPREINTES</h1><p class="accroche">2121 · Sous les eaux, d’autres se souviennent encore.</p><p class="auteur">Le livre · INPP Houben</p><button type="button" id="reprendre" hidden>Reprendre la lecture</button></div></section>
${corps}
<footer class="fin-livre">Tiré des textes du jeu EMPREINTES le ${e(date)}.</footer>
</main>
<script>
(function(){
  var toc=document.getElementById('toc'),o=document.getElementById('ouvrir'),f=document.getElementById('fermer');
  function montrer(v){toc.hidden=!v;o.setAttribute('aria-expanded',String(v));document.body.classList.toggle('fige',v);}
  o.onclick=function(){montrer(true)};f.onclick=function(){montrer(false)};
  toc.addEventListener('click',function(ev){if(ev.target.tagName==='A'||ev.target===toc)montrer(false);});
  var barre=document.querySelector('.progres i'),repere=null;
  var ancres=[].slice.call(document.querySelectorAll('section[id],header.chap[id]'));
  function maj(){var h=document.documentElement,p=h.scrollTop/(h.scrollHeight-h.clientHeight||1);barre.style.width=(p*100).toFixed(1)+'%';
    var cur=null;for(var i=0;i<ancres.length;i++){if(ancres[i].getBoundingClientRect().top<120)cur=ancres[i].id;else break;}
    if(cur&&cur!==repere){repere=cur;try{localStorage.setItem('empreintes-livre',cur)}catch(e){}}}
  addEventListener('scroll',maj,{passive:true});maj();
  try{var r=localStorage.getItem('empreintes-livre');if(r&&r!=='couverture'&&document.getElementById(r)&&!location.hash){var b=document.getElementById('reprendre');b.hidden=false;b.onclick=function(){document.getElementById(r).scrollIntoView();};}}catch(e){}
})();
</script>
</body></html>`;
writeFileSync(resolve(sortie, 'index.html'), page);
writeFileSync(resolve(sortie, 'images.txt'), [...images].join('\n'));
console.log(`livre : ${(page.length / 1024).toFixed(0)} Ko, ${images.size} images, ${sommaire.length} entrées au sommaire`);
