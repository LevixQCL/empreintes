// Le passage automatique pour l'interface (9 novembre 2026) : entoure de t(…) / t`…` les morceaux de texte affichés,
// sans jamais englober le HTML autour (une classe CSS changée ne doit pas invalider une traduction).
//   - dans un gabarit HTML : chaque texte entre deux balises, et les attributs title / aria-label / alt / placeholder ;
//     les valeurs ${…} en tête ou en queue du texte (icônes, portraits) restent dehors ;
//   - une chaîne '…' qui contient du HTML devient un gabarit, traité pareil ;
//   - une phrase seule (deux mots ou plus), un gabarit sans HTML qui contient du texte (« ${n} cristaux ») ;
//   - un mot seul affiché (Majuscule ou accent), hors des positions de code (clés, comparaisons, sélecteurs…).
// Jamais : un texte qui sert d'identifiant ailleurs (comparé avec ===, case, includes…), même dans un autre fichier.
// Les gabarits imbriqués sont traités de l'intérieur vers l'extérieur, en plusieurs passes.

import ts from 'typescript';
import { readFileSync, writeFileSync } from 'node:fs';

const ATTRIBUTS = /^(?:title|aria-label|alt|placeholder)$/i;
const MOTS = /[\p{L}]{2,}/u;
const OPERATEURS = new Set([ts.SyntaxKind.EqualsEqualsEqualsToken, ts.SyntaxKind.ExclamationEqualsEqualsToken, ts.SyntaxKind.EqualsEqualsToken, ts.SyntaxKind.ExclamationEqualsToken]);
/** les méthodes dont les arguments sont du code, pas du texte */
const APPELS_CODE = /^(?:querySelector(?:All)?|getElementById|closest|matches|classList|add|remove|toggle|contains|setAttribute|getAttribute|removeAttribute|addEventListener|removeEventListener|getItem|setItem|removeItem|includes|startsWith|endsWith|indexOf|split|replace|replaceAll|join|test|exec|match|warn|error|info|debug|createElement|dispatchEvent|postMessage|has|get|set|delete|animate|scrollIntoView|fetch|import|require)$/;
/** les propriétés qui portent du code (identifiants, classes, chemins), même quand la valeur ressemble à un mot */
const PROPRIETES_CODE = /^(?:id|cle|key|type|classe|class|className|action|mode|icone|ico|image|img|src|href|data|lien|ref|sorte|genre|quoi|poste|batiment|lignee|metal|effet|etat|ecran|onglet|vue|theme|famille|voie|piste|carte|qui|drapeau|code|nom_?id|evenement|cible|categorie|son|anim)$/;

/** Tous les textes qui servent d'identifiants quelque part dans le code (comparés, case, tableaux passés à includes) */
export function textesIdentifiants(fichiers: string[]): Set<string> {
  const ids = new Set<string>();
  for (const f of fichiers) {
    const sf = ts.createSourceFile(f, readFileSync(f, 'utf8'), ts.ScriptTarget.Latest, true);
    const visiter = (n: ts.Node) => {
      if (ts.isStringLiteral(n) || ts.isNoSubstitutionTemplateLiteral(n)) {
        const p = n.parent;
        if (ts.isCaseClause(p) || (ts.isBinaryExpression(p) && OPERATEURS.has(p.operatorToken.kind))) ids.add(n.text);
        if (ts.isArrayLiteralExpression(p) && ts.isPropertyAccessExpression(p.parent) && /^(?:includes|indexOf)$/.test(p.parent.name.text)) ids.add(n.text);
        if (ts.isCallExpression(p) && ts.isPropertyAccessExpression(p.expression) && /^(?:includes|indexOf|has)$/.test(p.expression.name.text)) ids.add(n.text);
        if (ts.isLiteralTypeNode(p)) ids.add(n.text);
      }
      ts.forEachChild(n, visiter);
    };
    visiter(sf);
  }
  return ids;
}

/** une valeur ${…} qui produit du balisage plutôt qu'une donnée */
const HTML_EXPR = /^(?:ICO|ICONES?|SVG)\b|avatar|[iI]cone|svg|[iI]mg|portrait|[bB]adge|pastille|[hH]tml|[jJ]auge|cristal\(|vignette|^h$|^bloc|^ligne/;
/** une liste de classes ou d'identifiants : mots en minuscules sans accent, sans ponctuation */
const listeCode = (s: string) => /^[a-z0-9-]+(?: [a-z0-9-]+){0,3}$/.test(s.trim())
  && !/(?:^| )(?:le|la|les|un|une|des|du|de|ton|ta|tes|son|sa|ses|et|ou|au|aux|en|pas|plus|par|sur|sous|avec|sans|pour)(?: |$)/.test(s.trim());
const estHtml = (s: string) => /<\/?[a-zA-Z][\w-]*(?:\s|>|\/)/.test(s);
const aDuTexte = (s: string) => MOTS.test(s.replace(/&[a-z#0-9]+;/gi, ' '));
const ressembleCode = (s: string) => /[{};=]|\w\(|\bpx\b|^[\w.#-]*$|^\s*[a-z-]+\s*:/.test(s.trim()) && !/\s\p{L}{3,}\s/u.test(` ${s} `);

/** Un mot seul affiché : Majuscule suivie de minuscules, ou une lettre accentuée ; pas un identifiant connu */
const motAffiche = (s: string, ids: Set<string>) => !ids.has(s) && /^[\p{L}’'.\- ]+[.!?…:]?$/u.test(s) && s.trim().length >= 2
  && (/^\p{Lu}\p{Ll}/u.test(s) || /[àâçéèêëîïôûùüÿœæ]/i.test(s));

interface Edit { debut: number; fin: number; texte: string }

/** Les morceaux d'un gabarit : du texte (source brute) ou une valeur ${…} */
type Morceau = { texte: string; debut: number; fin: number } | { expr: string; debut: number; fin: number };

function morceauxDe(g: ts.TemplateExpression | ts.NoSubstitutionTemplateLiteral, code: string): Morceau[] {
  const m: Morceau[] = [];
  if (ts.isNoSubstitutionTemplateLiteral(g)) {
    const d = g.getStart() + 1; const f = g.getEnd() - 1;
    m.push({ texte: code.slice(d, f), debut: d, fin: f });
    return m;
  }
  const d0 = g.head.getStart() + 1; const f0 = g.head.getEnd() - 2;
  m.push({ texte: code.slice(d0, f0), debut: d0, fin: f0 });
  for (const s of g.templateSpans) {
    m.push({ expr: code.slice(s.expression.getStart(), s.expression.getEnd()), debut: s.expression.getStart(), fin: s.expression.getEnd() });
    const fin = ts.isTemplateTail(s.literal) ? s.literal.getEnd() - 1 : s.literal.getEnd() - 2;
    const deb = s.literal.getStart() + 1;
    m.push({ texte: code.slice(deb, fin), debut: deb, fin });
  }
  return m;
}

/**
 * Les « passages » d'un gabarit HTML : suites de texte et de ${…} hors des balises (ou dans un attribut affiché).
 * Rend des plages de la source à entourer, après avoir retiré les ${…} et les espaces en tête et en queue.
 */
function passagesHtml(morceaux: Morceau[]): { debut: number; fin: number }[] {
  type Pos = { pos: number; expr: boolean; fin: number; car?: string; src?: string };
  // un flux de caractères (positions dans la source), les ${…} comptant pour un seul élément
  const flux: Pos[] = [];
  for (const m of morceaux) {
    if ('expr' in m) flux.push({ pos: m.debut - 2, expr: true, fin: m.fin + 1, src: m.expr });
    else for (let i = 0; i < m.texte.length; i++) flux.push({ pos: m.debut + i, expr: false, fin: m.debut + i + 1, car: m.texte[i] });
  }
  const passages: { debut: number; fin: number }[] = [];
  let etat: 'texte' | 'balise' | 'attribut' | 'style' = 'texte';
  let courant: Pos[] = [];
  let attrNom = ''; let guillemet = ''; let attrAffiche = false; let baliseTexte = '';
  const fermer = () => {
    let a = 0; let b = courant.length;
    // en tête et en queue, on laisse dehors les espaces et les valeurs qui produisent du HTML (icônes, portraits…)
    const vide = (p: Pos) => (p.expr ? HTML_EXPR.test(p.src!) : /\s/.test(p.car!));
    while (a < b && vide(courant[a]!)) a++;
    while (b > a && vide(courant[b - 1]!)) b--;
    const garde = courant.slice(a, b);
    const texte = garde.filter((p) => !p.expr).map((p) => p.car).join('');
    if (garde.length && aDuTexte(texte)) passages.push({ debut: garde[0]!.pos, fin: garde[garde.length - 1]!.fin });
    courant = [];
  };
  for (const p of flux) {
    if (etat === 'style') { if (!p.expr) baliseTexte += p.car; if (/<\/style>$/i.test(baliseTexte)) { etat = 'texte'; baliseTexte = ''; } continue; }
    if (etat === 'texte') {
      if (!p.expr && p.car === '<') { fermer(); etat = 'balise'; baliseTexte = '<'; attrNom = ''; continue; }
      courant.push(p);
      continue;
    }
    if (etat === 'balise') {
      if (p.expr) { attrNom = ''; continue; }
      baliseTexte += p.car;
      if (p.car === '>') { etat = /^<style\b/i.test(baliseTexte) ? 'style' : 'texte'; if (etat === 'style') baliseTexte = ''; continue; }
      if (p.car === '"' || p.car === '\'') {
        const avant = baliseTexte.slice(0, -1).match(/([\w-]+)\s*=\s*$/);
        if (avant) { attrNom = avant[1]!; guillemet = p.car; attrAffiche = ATTRIBUTS.test(attrNom); etat = 'attribut'; courant = []; }
      }
      continue;
    }
    // attribut
    if (!p.expr && p.car === guillemet) { if (attrAffiche) fermer(); courant = []; etat = 'balise'; baliseTexte += p.car; continue; }
    if (attrAffiche) courant.push(p);
  }
  if (etat === 'texte') fermer();
  return passages;
}

const echapperGabarit = (s: string) => s.replace(/\\/g, '\\\\').replace(/`/g, '\\`').replace(/\$\{/g, '\\${');

export function envelopperUi(chemin: string, nomT: string, ids: Set<string>): { n: number; code: string } {
  let code = readFileSync(chemin, 'utf8');
  let total = 0;
  for (let passe = 0; passe < 12; passe++) {
    const sf = ts.createSourceFile(chemin, code, ts.ScriptTarget.Latest, true);
    const edits: Edit[] = [];
    const dansT = (n: ts.Node): boolean => {
      for (let p: ts.Node | undefined = n.parent; p; p = p.parent) {
        if (ts.isTaggedTemplateExpression(p)) return true;
        if (ts.isCallExpression(p) && ts.isIdentifier(p.expression) && p.expression.text === nomT) return true;
      }
      return false;
    };
    const positionCode = (n: ts.Node): boolean => {
      const p = n.parent;
      if (ts.isImportDeclaration(p) || ts.isExportDeclaration(p) || ts.isLiteralTypeNode(p) || ts.isExternalModuleReference(p)) return true;
      if (ts.isPropertyAssignment(p) && p.name === n) return true;
      // une propriété « de code » ne protège que les valeurs d'un seul mot : une phrase n'est jamais un identifiant
      if (ts.isPropertyAssignment(p) && (ts.isIdentifier(p.name) || ts.isStringLiteral(p.name)) && PROPRIETES_CODE.test(p.name.text) && !/\s/.test(code.slice(n.getStart(), n.getEnd()).trim())) return true;
      if (ts.isElementAccessExpression(p) || ts.isCaseClause(p)) return true;
      if (ts.isBinaryExpression(p) && OPERATEURS.has(p.operatorToken.kind)) return true;
      if (ts.isCallExpression(p) || ts.isNewExpression(p)) {
        const e = p.expression;
        const nom = ts.isIdentifier(e) ? e.text : ts.isPropertyAccessExpression(e) ? e.name.text : '';
        if (APPELS_CODE.test(nom)) return true;
        if (ts.isPropertyAccessExpression(e) && ts.isIdentifier(e.expression) && e.expression.text === 'console') return true;
      }
      if (ts.isArrayLiteralExpression(p) && ts.isPropertyAccessExpression(p.parent) && /^(?:includes|indexOf)$/.test(p.parent.name.text)) return true;
      return false;
    };
    const visiter = (n: ts.Node) => {
      const estGabarit = ts.isTemplateExpression(n) || ts.isNoSubstitutionTemplateLiteral(n);
      if ((estGabarit || ts.isStringLiteral(n)) && !dansT(n) && !ts.isTaggedTemplateExpression(n.parent) && !positionCode(n)) {
        const brut = code.slice(n.getStart(), n.getEnd());
        const texteFixe = ts.isTemplateExpression(n) ? [n.head.text, ...n.templateSpans.map((s) => s.literal.text)].join(' ') : (n as ts.StringLiteral).text;
        if (estHtml(texteFixe)) {
          if (ts.isStringLiteral(n)) {
            // une chaîne HTML devient un gabarit (traité à la passe suivante)
            const g = '`' + echapperGabarit(n.text) + '`';
            if (aDuTexte(n.text.replace(/<[^>]*>/g, ' '))) edits.push({ debut: n.getStart(), fin: n.getEnd(), texte: g });
          } else {
            for (const p of passagesHtml(morceauxDe(n as ts.TemplateExpression, code))) {
              const morceau = code.slice(p.debut, p.fin);
              edits.push({ debut: p.debut, fin: p.fin, texte: `\${${nomT}\`${morceau}\`}` });
            }
          }
        } else if (!ressembleCode(texteFixe) && !ids.has(texteFixe)) {
          const mots = texteFixe.split(/\s+/).filter((m) => /\p{L}{2,}/u.test(m));
          const phrase = mots.length >= 2 && mots.some((m) => /\p{L}{3}/u.test(m));
          const gabaritTexte = estGabarit && /\s/.test(texteFixe.trim()) && mots.some((m) => /^\p{L}{3,}[.,:;!?…»)]*$/u.test(m));
          if (!listeCode(texteFixe) && (phrase || gabaritTexte || (!estGabarit && motAffiche(texteFixe, ids)))) {
            if (ts.isStringLiteral(n)) edits.push({ debut: n.getStart(), fin: n.getEnd(), texte: `${nomT}(${brut})` });
            else { const avant = code[n.getStart() - 1] ?? ''; edits.push({ debut: n.getStart(), fin: n.getStart(), texte: /[\w$]/.test(avant) ? ` ${nomT}` : nomT }); }
          }
        }
      }
      ts.forEachChild(n, visiter);
    };
    visiter(sf);
    // de l'intérieur vers l'extérieur : on garde les modifications qui n'en contiennent aucune autre
    const gardees = edits.filter((e) => !edits.some((o) => o !== e && o.debut >= e.debut && o.fin <= e.fin && (o.debut !== e.debut || o.fin !== e.fin)));
    const uniques = gardees.filter((e, i) => gardees.findIndex((o) => o.debut === e.debut && o.fin === e.fin) === i);
    if (!uniques.length) break;
    for (const e of uniques.sort((a, b) => b.debut - a.debut)) code = code.slice(0, e.debut) + e.texte + code.slice(e.fin);
    total += uniques.filter((e) => e.texte.startsWith('${') || e.texte.startsWith(nomT) || e.texte === ` ${nomT}`).length;
  }
  writeFileSync(chemin, code);
  return { n: total, code };
}
