// Les textes français oubliés hors de t() (9 novembre 2026) : liste les chaînes du code qui contiennent un accent
// et ne passent pas par t() / tr(). Beaucoup sont légitimes (identifiants, motifs, shaders) : c'est une liste à relire,
// pas un test. Usage : npx tsx scripts/i18n-oublis.ts
import ts from 'typescript';
import { globSync, readFileSync } from 'node:fs';

const fichiers = globSync('src/**/*.ts').filter((f) => !f.includes('analyse') && !f.endsWith('.d.ts'));
const accent = /[àâçéèêëîïôûùœÀÂÇÉÈÊËÎÏÔÛÙ’]/;
const ALIAS = ['t', 'tr'];

for (const f of fichiers) {
  const src = ts.createSourceFile(f, readFileSync(f, 'utf8'), ts.ScriptTarget.Latest, true);
  const visiter = (n: ts.Node): void => {
    if (ts.isStringLiteral(n) || ts.isNoSubstitutionTemplateLiteral(n) || ts.isTemplateHead(n) || ts.isTemplateMiddle(n) || ts.isTemplateTail(n)) {
      let p: ts.Node | undefined = n.parent; let traduit = false;
      for (let k = 0; p && k < 4; k++, p = p.parent) {
        if (ts.isCallExpression(p) && ts.isIdentifier(p.expression) && ALIAS.includes(p.expression.text)) traduit = true;
        if (ts.isTaggedTemplateExpression(p) && ts.isIdentifier(p.tag) && ALIAS.includes(p.tag.text)) traduit = true;
        if (ts.isImportDeclaration(p)) traduit = true;
      }
      const texte = n.text.replace(/<[^>]*>/g, ' ').trim();
      if (!traduit && accent.test(texte) && /\p{L}{3}/u.test(texte)) {
        const { line } = src.getLineAndCharacterOfPosition(n.getStart());
        console.log(`${f}:${line + 1} ${JSON.stringify(texte.slice(0, 90))}`);
      }
    }
    ts.forEachChild(n, visiter);
  };
  visiter(src);
}
