// Nettoyage du CSS, sans rien changer à l'écran :
//  1. retire les déclarations toujours écrasées (même sélecteur exact, même contexte @media, plus loin dans la cascade) ;
//  2. fusionne les règles d'un même fichier au même sélecteur, quand aucune règle entre les deux ne touche à leurs propriétés.
// usage : npm run css            → dit ce qui peut être nettoyé
//         npm run css -- --ecrire → nettoie (puis vérifier avec npm run visuel)
const postcss = require('postcss');
const fs = require('fs'); const path = require('path');
const R = path.resolve(__dirname, '../src/ui');
const ordre = [...fs.readFileSync(path.join(R, 'feuilles.ts'), 'utf8').matchAll(/import '\.\/([^']+)';/g)].map((m) => m[1]);
const arbres = ordre.map((f) => ({ f, root: postcss.parse(fs.readFileSync(path.join(R, f), 'utf8'), { from: f }) }));
const MODERNE = /dvh|svh|lvh|dvw|svw|color-mix|oklch|oklab|\blch\(|\blab\(|corner-shape|anchor|@supports/;
const contexte = (n) => { const c = []; let p = n.parent; while (p && p.type !== 'root') { if (p.type === 'atrule') { if (/keyframes/.test(p.name)) return null; c.unshift(`@${p.name} ${p.params}`); } p = p.parent; } return c.join(' | '); };
const norm = (s) => s.replace(/\s+/g, ' ').replace(/\s*([>+~,])\s*/g, '$1').trim();

// ---------- 1. déclarations toujours écrasées ----------
// toutes les déclarations, dans l'ordre de la cascade
const decls = [];
for (const { f, root } of arbres) root.walkDecls((d) => {
  if (d.parent.type !== 'rule') return;
  const ctx = contexte(d.parent); if (ctx == null) return;
  decls.push({ d, f, cle: `${ctx}§${norm(d.parent.selector)}§${d.prop.toLowerCase()}` });
});
const derniere = new Map(); // clé -> déclaration la plus loin
for (const x of decls) derniere.set(x.cle, x);
let retirees = 0;
for (const x of decls) {
  const fin = derniere.get(x.cle);
  if (fin === x) continue;
  if (x.d.important && !fin.d.important) continue;
  if (MODERNE.test(fin.d.value) || MODERNE.test(fin.d.prop)) continue; // la dernière pourrait être ignorée par un vieux navigateur
  if (/^--/.test(x.d.prop) === false && x.d.parent === fin.d.parent) continue; // doublon dans la même règle : souvent un repli voulu
  x.d.remove(); retirees++;
}
let vides = 0;
for (const { root } of arbres) { root.walkRules((r) => { if (!r.nodes.length) { r.remove(); vides++; } }); root.walkAtRules((a) => { if (a.nodes && !a.nodes.length) { a.remove(); vides++; } }); }

// ---------- 2. règles au même sélecteur ----------
let fusions = 0;
for (let tour = 0; tour < 5; tour++) {
  const regles = [];
  for (const { f, root } of arbres) root.walkRules((r) => { const ctx = contexte(r); if (ctx != null) regles.push({ r, f, cle: `${f}§${ctx}§${norm(r.selector)}` }); });
  let change = false;
  const vues = new Map();
  for (let i = 0; i < regles.length; i++) {
    const x = regles[i];
    if (!x.r.parent) continue;
    const j0 = vues.get(x.cle);
    vues.set(x.cle, i);
    if (j0 == null) continue;
    const a = regles[j0];
    if (!a.r.parent) continue;
    const props = new Set(a.r.nodes.filter((n) => n.type === 'decl').map((d) => d.prop.toLowerCase()));
    if (a.r.nodes.some((n) => n.type !== 'decl')) continue; // commentaires ou règles imbriquées : on n'y touche pas
    let sur = true;
    for (let k = j0 + 1; k < i && sur; k++) {
      const m = regles[k].r;
      if (!m.parent) continue;
      m.each((n) => { if (n.type === 'decl' && (props.has(n.prop.toLowerCase()) || [...props].some((p) => p.startsWith(n.prop.toLowerCase() + '-') || n.prop.toLowerCase().startsWith(p + '-')))) sur = false; });
    }
    if (!sur) continue;
    // les déclarations de la première passent en tête de la seconde (même ordre qu'avant pour le navigateur)
    const nouvelles = a.r.nodes.map((n) => n.clone());
    x.r.prepend(...nouvelles);
    a.r.remove();
    fusions++; change = true;
  }
  if (!change) break;
}

if (process.argv[2] === '--ecrire') for (const { f, root } of arbres) fs.writeFileSync(path.join(R, f), root.toString());
console.log(`${retirees} déclaration(s) toujours écrasée(s), ${vides} règle(s) vide(s), ${fusions} fusion(s)${process.argv[2] === '--ecrire' ? ' : nettoyé.' : ' possible(s).'}`);
