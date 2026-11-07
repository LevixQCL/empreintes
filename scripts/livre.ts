// Le livre d'EMPREINTES (7 novembre 2026, Bryan : « une sorte de livre, pour que sans jouer je puisse tout lire »).
// Rassemble tous les textes du jeu, tirés directement du code (rien n'est recopié à la main, le livre suit le jeu) :
// l'intro, les Chroniques d'Ysé, la descente (scènes, Haltes avec leurs deux pistes, quêtes, décisions), les Archives,
// les Porteurs, le bestiaire et le lore des cartes, illustrés par les images Midjourney du jeu.
// usage : npx tsx scripts/livre.ts <dossier>  → <dossier>/index.html + <dossier>/images.txt (les images à joindre)
// Les images sont ensuite réduites et copiées par scripts/livre-images.py.

import { mkdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { PLANS } from '../src/ui/intro';
import { CHAPITRES, LIVRES } from '../src/core/chroniques';
import { PERSONNAGES, SCENES, nomActe, type Replique, type Scene } from '../src/core/campagne';
import { HALTES, PISTES, QUETES, BESTIAIRE, nombreHaltes, strateDuSouvenir, type DetailHalte, type Voix } from '../src/core/strates';
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

// ---------- les images (celles du jeu, quand elles existent) ----------
const images = new Set<string>();
const artTs = readFileSync(resolve(racine, 'src/ui/art.ts'), 'utf8');
const carte = (nom: string) => {
  const m = artTs.match(new RegExp(`const ${nom}: Record<string, string> = \\{([\\s\\S]*?)\\n\\};`));
  return Object.fromEntries([...(m?.[1] ?? '').matchAll(/'([^']+)':\s*'([^']+)'/g)].map((x) => [x[1]!, x[2]!]));
};
const MODULES_IMG = carte('MODULES_ILLUSTRES');
const ENNEMIS_IMG = carte('ENNEMIS_ILLUSTRES');
/** un chemin sous public/ s'il existe ; noté pour être joint au livre */
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
const ROMAIN = ['I', 'II', 'III'];
/** le nom et le portrait de celui qui parle (Porteur, personnage, gardien), ou le récit */
function orateur(qui: string): { nom: string; img: string | null } {
  if (!qui) return { nom: '', img: null };
  const p = essai(() => porteurDef(qui));
  if (p && p.nom && !p.nom.startsWith('?')) return { nom: p.nom, img: imgPorteur(qui) };
  if (PERSONNAGES[qui]) return { nom: PERSONNAGES[qui]!.nom, img: imgPersonnage(qui) };
  const en = essai(() => ennemiDef(qui));
  return { nom: en?.nom ?? qui, img: imgEnnemi(qui) };
}
const portraitRond = (src: string | null, nom: string) =>
  src ? `<img class="rond" src="${src}" alt="" loading="lazy">` : `<span class="rond vide">${e(nom.charAt(0) || '·')}</span>`;
const figure = (src: string | null, legende = '', cls = '') =>
  src ? `<figure class="ill ${cls}"><img src="${src}" alt="${e(legende)}" loading="lazy">${legende ? `<figcaption>${e(legende)}</figcaption>` : ''}</figure>` : '';

/** les choix qui posent un souvenir : drapeau → « texte du choix » */
const SOUVENIRS = new Map<string, { texte: string; strate: number }>();
for (const h of HALTES) for (const c of h.choix) if (c.drapeau) SOUVENIRS.set(c.drapeau, { texte: c.texte, strate: h.strate });
const etiquetteSouvenir = (f: string) => {
  const s = SOUVENIRS.get(f);
  return s ? `Si tu as choisi « ${s.texte} » à −${s.strate}` : 'Selon tes choix';
};

// ---------- le sommaire, construit au fil des parties ----------
const sommaire: { id: string; titre: string; niveau: 1 | 2 }[] = [];
const titrePartie = (id: string, sur: string, titre: string, chapeau = '', image: string | null = null) => {
  sommaire.push({ id, titre, niveau: 1 });
  return `<section class="partie" id="${id}">${image ? `<div class="partie-img"><img src="${image}" alt="" loading="lazy"></div>` : ''}<div class="partie-txt"><span class="sur">${e(sur)}</span><h1>${e(titre)}</h1>${chapeau ? `<p class="chapeau">${e(chapeau)}</p>` : ''}</div></section>`;
};
const titreChapitre = (id: string, sur: string, titre: string, court = titre) => {
  sommaire.push({ id, titre: court, niveau: 2 });
  return `<header class="chap" id="${id}"><span class="sur">${e(sur)}</span><h2>${e(titre)}</h2></header>`;
};

let corps = '';

// ---------- Prologue : l'intro ----------
corps += titrePartie('prologue', 'Prologue', 'Ce qu’on a laissé monter', 'L’intro du jeu, dans sa version complète.', imgIntro('00-titre'));
PLANS.forEach((p, k) => {
  corps += `<article class="plan">${figure(p.fonds?.[0] ? imgIntro(p.fonds[0].id) : null)}<span class="sur">${e(p.epoque)} · ${p.annees[0] === p.annees[1] ? p.annees[0] : `${p.annees[0]}–${p.annees[1]}`}</span>`
    + `<h3>${e(p.titre)}</h3>${p.lignes.map((l) => `<p>${e(l)}</p>`).join('')}</article>`;
  if (k === 0) sommaire.push({ id: 'prologue', titre: 'Les douze plans de l’intro', niveau: 2 });
});

// ---------- Partie I : les Chroniques d'Ysé ----------
corps += titrePartie('chroniques', 'Partie I', 'Les Chroniques d’Ysé', 'Une longue lettre d’Ysé, archiviste des Veilleurs de Sédime, au nouveau directeur. Dans le jeu, les chapitres les plus profonds s’ouvrent en descendant.', imgPersonnage('yse'));
let livre = 0;
for (const c of CHAPITRES) {
  if (c.livre !== livre) { livre = c.livre; corps += `<div class="livre-titre">${e(LIVRES[c.livre as 1 | 2 | 3])}</div>`; }
  corps += titreChapitre(`chr-${c.id}`, `${c.epoque}${c.strate ? ` · s’ouvre à −${c.strate}` : ''}`, c.titre);
  corps += figure(c.image ? imgIntro(c.image) : null);
  corps += `<div class="lettre">${c.paragraphes.map((p) => `<p>${e(p)}</p>`).join('')}</div>`;
  for (const d of c.documents ?? []) corps += `<aside class="document"><span class="sur">${e(d.support)}</span><h4>${e(d.titre)}</h4>${d.lignes.map((l) => `<p>${e(l)}</p>`).join('')}</aside>`;
}

// ---------- Partie II : la descente ----------
const replique = (r: Replique) => {
  const o = orateur(r.qui);
  const variante = r.souvenir ? etiquetteSouvenir(r.souvenir) : r.si ? 'Selon ta partie' : '';
  return `<div class="voix${variante ? ' variante' : ''}">${portraitRond(o.img, o.nom)}<div>${variante ? `<em class="cond">◆ ${e(variante)}</em>` : ''}<strong>${e(o.nom)}</strong><p>${e(r.texte)}</p></div></div>`;
};
const scene = (s: Scene) => {
  const im = imgScene(s.id) ?? ('ennemi' in s.image ? imgEnnemi(s.image.ennemi) : 'strate' in s.image ? imgStrate(s.image.strate) : imgIntro(s.image.intro));
  return `<article class="scene">${figure(im, '', 'large')}<span class="sur">${e(s.sur)}</span><h3>${e(s.titre)}</h3><p class="recit">${e(s.recit)}</p>${s.repliques.map(replique).join('')}</article>`;
};
/** un détail de Halte : la voix principale (un Porteur), le récit de secours, et les répliques qui dépendent d'un choix d'avant */
const voixSimple = (v: Voix, nom: string) => {
  const o = orateur(v.qui);
  return `<div class="voix${v.si ? ' variante' : ''}">${portraitRond(o.img, o.nom || nom)}<div>${v.si ? `<em class="cond">◆ ${e(etiquetteSouvenir(v.si))}</em>` : ''}${o.nom ? `<strong>${e(o.nom)}</strong>` : ''}<p>${e(v.texte)}</p></div></div>`;
};
const detail = (d: DetailHalte) => {
  const principale = d.voix.find((v) => v.qui && !v.si) ?? d.voix.find((v) => !v.si)!;
  const souvenirs = d.voix.filter((v) => v.si);
  return `<div class="detail"><span class="detail-nom">${e(d.nom)}</span>${voixSimple(principale, d.nom)}${souvenirs.map((v) => voixSimple(v, d.nom)).join('')}</div>`;
};
function haltes(s: number) {
  let h = '';
  for (let n = 1; n <= nombreHaltes(s); n++) {
    const def = HALTES.find((x) => x.strate === s && x.n === n);
    if (!def) continue;
    h += `<article class="halte"><span class="sur">Halte ${ROMAIN[n - 1]} sur ${nombreHaltes(s)} · Strate −${s}</span><h3>${e(def.titre)}</h3><p class="recit">${e(def.recit)}</p>`
      + def.details.map(detail).join('')
      + `<div class="choix-titre">Que fais-tu ?</div><div class="choix">`
      + def.choix.map((c) => `<div class="choix-carte ${c.piste}"><span class="piste">◆ ${e(PISTES[c.piste])}</span><strong>${e(c.texte)}</strong><p>${e(c.recit)}</p></div>`).join('')
      + `</div>`;
    if (def.revelation) {
      h += `<div class="revelation"><div class="rev-titre">Ce que ton enquête a trouvé</div><p class="rev-aide">${s === 10 ? 'Selon la piste que tu as le plus suivie depuis −1.' : `Selon la piste choisie à la Halte ${ROMAIN[n - 2]}.`}</p><div class="rev-pistes">`
        + (['nous', 'avant'] as const).map((p) => {
          const r = def.revelation![p];
          const v = r.voix.find((x) => x.qui) ?? r.voix[0]!;
          return `<div class="rev ${p}"><span class="piste">◆ ${e(PISTES[p])}</span><h4>${e(r.nom)}</h4>${voixSimple(v, r.nom)}</div>`;
        }).join('') + `</div></div>`;
    }
    h += `<p class="carnet"><span>Carnet du directeur</span>${e(def.fait)}</p></article>`;
  }
  const q = QUETES.find((x) => x.strate === s);
  if (q) h += `<aside class="quete"><span class="sur">La quête de la Strate −${s}</span><h4>${e(q.nom)}</h4><p class="but">${e(q.but)}</p><ol>${q.etapes.map((x) => `<li>${e(x)}</li>`).join('')}</ol><p class="fin">${e(q.fin)}</p></aside>`;
  return h;
}
const decision = (d: { titre: string; texte: string; options: { nom: string; phrase: string; effet: string }[] }, sur: string) =>
  `<article class="decision"><span class="sur">${e(sur)}</span><h3>${e(d.titre)}</h3><p class="recit">${e(d.texte)}</p><div class="options">${d.options.map((o) => `<div class="option"><strong>${e(o.nom)}</strong><p class="phrase">« ${e(o.phrase)} »</p><p>${e(o.effet)}</p></div>`).join('')}</div></article>`;

corps += titrePartie('descente', 'Partie II', 'La descente', 'L’histoire telle que le joueur la vit, Strate après Strate : les scènes, les trois Haltes de chaque Strate avec leurs deux pistes d’enquête, les quêtes et les grandes décisions. Les lignes marquées ◆ dépendent de tes choix.', imgIntro('10-dessous'));
let acte = 0;
let strateVue = 0;
const ouvrirStrate = (s: number) => {
  if (s <= strateVue) return '';
  strateVue = s;
  const z = essai(() => zoneDe(s));
  return titreChapitre(`strate-${s}`, `Strate −${s}${z ? ` · ${z.nom}` : ''}`, NOMS_STRATES[s] ?? `Strate −${s}`, `−${s} · ${NOMS_STRATES[s] ?? ''}`) + figure(existsSync(resolve(racine, `public/art/scenes/entree-${s}.webp`)) ? null : imgStrate(s), '', 'large');
};
const NOMS_STRATES: Record<number, string> = { 1: 'Les Pompes noyées', 2: 'Les Abris murés', 3: 'La Galerie aux lueurs', 4: 'Les Portes rondes', 5: 'Le Treillis', 6: 'Le Mur de 2066', 7: 'Les Deux Rives', 8: 'La Ruche d’ambre', 9: 'Le Ciel d’en bas', 10: 'Le Puits d’avant' };
for (const s of SCENES) {
  if (s.acte !== acte) { acte = s.acte; corps += `<div class="livre-titre">${e(nomActe(s.acte))}</div>`; }
  const m = s.id.match(/^(entree|gardien)-(\d+)$/);
  if (s.id === 'entree-4') corps += decision(DECISIONS.chambre, 'Décision de l’acte I');
  if (s.id === 'entree-7') corps += decision(DECISIONS.lecture, 'Décision de l’acte II');
  if (s.id === 'epilogue') corps += decision(DECISIONS.fin, 'Décision de l’acte III');
  if (m) {
    const n = Number(m[2]);
    corps += ouvrirStrate(n);
    if (m[1] === 'gardien') corps += haltes(n);
  }
  corps += scene(s);
  if (s.id === 'gardien-1') corps += `<article class="decision legs"><span class="sur">Après le gardien de −1</span><h3>${e(LETTRE_LEGS.titre)}</h3><p class="recit">${e(LETTRE_LEGS.texte)}</p><blockquote>${e(LETTRE_LEGS.lettre)}</blockquote></article>`;
}

// ---------- Partie III : les Archives ----------
corps += titrePartie('archives', 'Partie III', 'Les Archives', 'Les papiers d’époque trouvés dans les Strates, rangés dans la Bibliothèque du district.', imgIntro('chap-lettre'));
sommaire.push({ id: 'archives', titre: `${FRAGMENTS.length + FAMILLES.length} papiers`, niveau: 2 });
for (const f of [...FRAGMENTS, ...FAMILLES]) corps += `<aside class="document"><span class="sur">${e(f.support)}</span><h4>${e(f.titre)}</h4>${f.lignes.map((l) => `<p>${e(l)}</p>`).join('')}</aside>`;

// ---------- Partie IV : les Porteurs ----------
corps += titrePartie('porteurs', 'Partie IV', 'Les Porteurs', 'Qui ils sont, d’où vient leur don, et leur histoire personnelle.', imgScene('cercle'));
for (const [id, p] of Object.entries(PRESENTATIONS)) {
  const nom = essai(() => porteurDef(id).nom) ?? id;
  corps += titreChapitre(`porteur-${id}`, p.titre, nom);
  corps += `<div class="porteur">${imgPorteur(id) ? `<img class="portrait" src="${imgPorteur(id)}" alt="" loading="lazy">` : ''}<div><p>${e(p.texte)}</p>${p.replique ? `<p class="replique">« ${e(p.replique)} »</p>` : ''}</div></div>`;
  if (p.pourquoi) corps += `<p><strong class="mini">Pourquoi il est là · </strong>${e(p.pourquoi)}</p>`;
  if (p.aParte) corps += `<aside class="document"><h4>${e(p.aParte.titre)}</h4><p>${e(p.aParte.texte)}</p></aside>`;
  for (const o of ORIGINES[id] ?? []) corps += `<div class="palier"><span class="sur">Niveau ${o.niveau}</span><h4>${e(o.titre)}</h4><p>${e(o.texte)}</p></div>`;
  const fil = FILS[id];
  if (fil) corps += `<aside class="quete"><span class="sur">Son histoire</span><h4>${e(fil.titre)}</h4><ol>${fil.etapes.map((x) => `<li><strong>${e(x.titre)}.</strong> ${e(x.recit)}</li>`).join('')}</ol></aside>`;
}

// ---------- Partie V : le bestiaire ----------
corps += titrePartie('bestiaire', 'Partie V', 'Le bestiaire', 'Ce que les fiches de la Bibliothèque disent de chaque ennemi, secret compris.', imgEnnemi('confluence'));
sommaire.push({ id: 'bestiaire', titre: 'Les fiches', niveau: 2 });
for (const [id, f] of Object.entries(BESTIAIRE)) {
  const nom = RODEURS.find((r) => r.id === id)?.dans ?? essai(() => ennemiDef(id).nom) ?? id;
  corps += `<div class="bete">${imgEnnemi(id) ? `<img src="${imgEnnemi(id)}" alt="" loading="lazy">` : ''}<div><h4>${e(nom)}</h4><p>${e(f.origine)}</p><p class="secret"><span>Secret</span>${e(f.secret)}</p></div></div>`;
}

// ---------- Partie VI : les cartes ----------
corps += titrePartie('cartes', 'Partie VI', 'Les cartes', 'Le petit lore de chaque carte, visible en la touchant dans le jeu.');
sommaire.push({ id: 'cartes', titre: `${Object.keys(LORE_CARTES).length} cartes`, niveau: 2 });
corps += `<div class="cartes">`;
for (const [id, t] of Object.entries(LORE_CARTES)) {
  const nom = essai(() => moduleDef(id).nom) ?? id;
  corps += `<div class="carte">${imgModule(id) ? `<img src="${imgModule(id)}" alt="" loading="lazy">` : ''}<div><h4>${e(nom)}</h4><p>${e(t)}</p></div></div>`;
}
corps += `</div>`;

// ---------- Annexe : les rumeurs ----------
corps += titrePartie('rumeurs', 'Annexe', 'Ce qu’on dit au marché', 'Les rumeurs du district, une par jour dans le jeu.');
corps += `<ul class="rumeurs">${RUMEURS.map((r) => `<li>${e(r.texte)}${r.strate ? ` <small>dès −${r.strate}</small>` : ''}</li>`).join('')}</ul>`;

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
<section class="couverture" id="couverture">${imgIntro('00-titre') ? `<img src="${imgIntro('00-titre')}" alt="">` : ''}<div class="couv-txt"><h1>EMPREINTES</h1><p class="accroche">2121 · Sous les eaux, d’autres se souviennent encore.</p><p class="auteur">Le livre du jeu · INPP Houben</p><p class="date">Tiré du jeu le ${e(date)}</p><button type="button" id="reprendre" hidden>Reprendre la lecture</button></div></section>
${corps}
<footer class="fin-livre">Fin du livre. Il est tiré directement des textes du jeu : il change quand le jeu change.</footer>
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
console.log(`livre : ${(page.length / 1024).toFixed(0)} Ko de texte, ${images.size} images, ${sommaire.length} entrées au sommaire`);
