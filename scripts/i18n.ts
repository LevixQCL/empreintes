// L'outil de traduction (9 novembre 2026). Mode d'emploi : docs/traduction/README.md
//
//   npm run i18n                          = extraire + couverture : met les catalogues à jour d'après le code
//   npm run i18n -- extraire              relit tous les t(…) / t`…` du code et met à jour traductions/<langue>/
//   npm run i18n -- couverture            ce qui est traduit, fichier par fichier (en mots)
//   npm run i18n -- verifier              valeurs {n}, balises HTML, glossaire (code de sortie 1 si erreur grave)
//   npm run i18n -- envelopper <fichiers> entoure de t(…) les phrases d'un fichier (relire le rapport et le diff !)
//   npm run i18n -- a-traduire <catalogue> [max]   liste numérotée des entrées vides (ou changées)
//   npm run i18n -- paires <catalogue> [début] [n]  montre français et traduction côte à côte, numérotés
//   npm run i18n -- reviser <catalogue> <lot.json>  remplace les traductions citées ({ "numéro": "texte" })
//   npm run i18n -- remplir <catalogue> <lot.json> remplit les entrées vides dans l'ordre avec un tableau JSON de traductions
//
// Le principe : le texte français EST la clé. Si on change une phrase française, l'extraction ne retrouve plus sa traduction :
// l'entrée repasse à traduire, avec l'ancienne version (fr + en) jointe en « ancien » pour aller vite.

import ts from 'typescript';
import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, unlinkSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, resolve, sep } from 'node:path';
import { pathToFileURL } from 'node:url';
import { cleGabarit } from '../src/core/i18n';
import { envelopperUi, textesIdentifiants } from './i18n-envelopper';
import { compterMots, controlerTout, fichiersCatalogue, lireCatalogue, RACINE, type Entree, type FichierTraduction } from './i18n-controle';

const LANGUES_CIBLES = ['en'] as const;
const SRC = join(RACINE, 'src');
/** Hors traduction : l'outil d'analyse (réservé à Bryan), les shaders WebGL */
const EXCLUS = [/^analyse\//, /^ui\/(houle|verre|dissolution)\.ts$/];

const posix = (p: string) => p.split(sep).join('/');

function fichiersSource(): string[] {
  const liste: string[] = [];
  const parcourir = (d: string) => {
    for (const n of readdirSync(d).sort()) {
      const p = join(d, n);
      if (statSync(p).isDirectory()) parcourir(p);
      else if (n.endsWith('.ts') && !n.endsWith('.d.ts')) liste.push(p);
    }
  };
  parcourir(SRC);
  return liste.filter((p) => !EXCLUS.some((r) => r.test(posix(relative(SRC, p)))));
}

const lireSource = (p: string) => ts.createSourceFile(p, readFileSync(p, 'utf8'), ts.ScriptTarget.Latest, true);

/** Les noms locaux sous lesquels la fonction t de core/i18n est importée dans ce fichier */
function nomsDeT(sf: ts.SourceFile): Set<string> {
  const noms = new Set<string>();
  for (const st of sf.statements) {
    if (!ts.isImportDeclaration(st) || !ts.isStringLiteral(st.moduleSpecifier)) continue;
    if (!/(^|\/)(core\/)?i18n$/.test(st.moduleSpecifier.text)) continue;
    const liens = st.importClause?.namedBindings;
    if (liens && ts.isNamedImports(liens)) for (const el of liens.elements) if ((el.propertyName ?? el.name).text === 't') noms.add(el.name.text);
  }
  if (sf.fileName.endsWith(`${sep}core${sep}i18n.ts`)) noms.clear();
  return noms;
}

/** Les textes à traduire d'un fichier, dans l'ordre */
function textesDe(sf: ts.SourceFile): { cles: string[]; douteux: string[] } {
  const noms = nomsDeT(sf);
  const cles: string[] = [];
  const douteux: string[] = [];
  if (!noms.size) return { cles, douteux };
  const ligne = (n: ts.Node) => sf.getLineAndCharacterOfPosition(n.getStart()).line + 1;
  const visiter = (n: ts.Node) => {
    if (ts.isCallExpression(n) && ts.isIdentifier(n.expression) && noms.has(n.expression.text)) {
      const a = n.arguments[0];
      if (a && (ts.isStringLiteral(a) || ts.isNoSubstitutionTemplateLiteral(a))) cles.push(a.text);
      else douteux.push(`${posix(relative(RACINE, sf.fileName))}:${ligne(n)} t(…) sans texte écrit en clair : rien à extraire`);
    } else if (ts.isTaggedTemplateExpression(n) && ts.isIdentifier(n.tag) && noms.has(n.tag.text)) {
      const g = n.template;
      cles.push(ts.isNoSubstitutionTemplateLiteral(g) ? g.text : cleGabarit([g.head.text, ...g.templateSpans.map((s) => s.literal.text)]));
    }
    ts.forEachChild(n, visiter);
  };
  visiter(sf);
  return { cles, douteux };
}

// ---------- similarité (pour rattacher une phrase modifiée à son ancienne version) ----------

const mots = (s: string) => new Set(s.toLowerCase().replace(/<[^>]*>/g, ' ').split(/[^\p{L}\p{N}]+/u).filter(Boolean));
function ressemblance(a: string, b: string): number {
  const A = mots(a); const B = mots(b);
  if (!A.size || !B.size) return 0;
  let commun = 0;
  for (const m of A) if (B.has(m)) commun++;
  return (2 * commun) / (A.size + B.size);
}

// ---------- extraire ----------

export function cheminCatalogue(langue: string, source: string): string {
  return join(RACINE, 'traductions', langue, posix(relative(SRC, source)).replace(/\.ts$/, '.json'));
}

/** Ce que le code demande de traduire, fichier source par fichier source (un texte présent deux fois va au premier fichier) */
export function textesDuCode(): { parSource: Map<string, string[]>; vues: Set<string>; douteux: string[] } {
  const parSource = new Map<string, string[]>();
  const vues = new Set<string>();
  const douteux: string[] = [];
  for (const p of fichiersSource()) {
    const r = textesDe(lireSource(p));
    douteux.push(...r.douteux);
    const propres = r.cles.filter((c) => c.trim() && !vues.has(c) && (vues.add(c), true));
    if (propres.length) parSource.set(p, propres);
  }
  return { parSource, vues, douteux };
}

function extraire(): void {
  const { parSource, vues, douteux } = textesDuCode();
  for (const langue of LANGUES_CIBLES) {
    // toutes les traductions connues, quel que soit le fichier (une phrase peut changer de fichier sans perdre sa traduction)
    const connues = new Map<string, Entree>();
    const anciensParFichier = new Map<string, Entree[]>();
    for (const chemin of fichiersCatalogue(langue)) {
      const f = lireCatalogue(chemin);
      anciensParFichier.set(chemin, f.entrees);
      for (const e of f.entrees) if (e.en || e.ancien) connues.set(e.fr, e);
    }
    const ecrits = new Set<string>();
    let nouvelles = 0; let changees = 0;
    for (const [source, cles] of parSource) {
      const chemin = cheminCatalogue(langue, source);
      const avant = anciensParFichier.get(chemin) ?? [];
      const disparues = avant.filter((e) => e.en && !vues.has(e.fr));
      const entrees: Entree[] = cles.map((fr) => {
        const k = connues.get(fr);
        if (k?.en) return { fr, en: k.en };
        if (k?.ancien) return { fr, en: '', ancien: k.ancien };
        nouvelles++;
        let meilleure: Entree | null = null; let score = 0.5;
        for (const d of disparues) { const s = ressemblance(fr, d.fr); if (s > score) { score = s; meilleure = d; } }
        if (meilleure) { changees++; return { fr, en: '', ancien: { fr: meilleure.fr, en: meilleure.en! } }; }
        return { fr, en: '' };
      });
      const contenu: FichierTraduction = { source: posix(relative(RACINE, source)), entrees };
      mkdirSync(dirname(chemin), { recursive: true });
      const texte = `${JSON.stringify(contenu, null, 1)}\n`;
      if (!existsSync(chemin) || readFileSync(chemin, 'utf8') !== texte) writeFileSync(chemin, texte);
      ecrits.add(chemin);
    }
    for (const chemin of fichiersCatalogue(langue)) if (!ecrits.has(chemin)) unlinkSync(chemin);
    console.log(`[${langue}] ${vues.size} textes dans ${parSource.size} fichiers · ${nouvelles} nouveaux à traduire${changees ? ` (dont ${changees} modifiés, ancienne version jointe)` : ''}`);
  }
  for (const d of douteux) console.log(`  ⚠ ${d}`);
}

// ---------- couverture ----------

function couverture(): void {
  for (const langue of LANGUES_CIBLES) {
    let total = 0; let faits = 0;
    const lignes: [string, number, number][] = [];
    for (const chemin of fichiersCatalogue(langue)) {
      const f = lireCatalogue(chemin);
      const t = f.entrees.reduce((s, e) => s + compterMots(e.fr), 0);
      const d = f.entrees.reduce((s, e) => s + (e.en ? compterMots(e.fr) : 0), 0);
      total += t; faits += d;
      lignes.push([f.source, d, t]);
    }
    lignes.sort((a, b) => b[2] - b[1] - (a[2] - a[1]));
    console.log(`\n[${langue}] ${faits.toLocaleString('fr-BE')} / ${total.toLocaleString('fr-BE')} mots traduits (${total ? Math.floor((100 * faits) / total) : 0} %)`);
    for (const [s, d, t] of lignes) console.log(`  ${d === t ? '✓' : ' '} ${String(Math.floor((100 * d) / t)).padStart(3)} %  ${String(t - d).padStart(6)} mots restants  ${s}`);
  }
}

// ---------- vérifier ----------

function verifier(): void {
  let graves = 0;
  for (const langue of LANGUES_CIBLES) {
    const pbs = controlerTout(langue);
    graves += pbs.filter((p) => p.grave).length;
    for (const p of pbs.sort((a, b) => Number(b.grave) - Number(a.grave))) console.log(`${p.grave ? '✗' : '·'} ${p.fichier} — ${p.message}\n    « ${p.fr} »`);
    console.log(`[${langue}] ${pbs.filter((p) => p.grave).length} erreur(s), ${pbs.filter((p) => !p.grave).length} remarque(s) de glossaire`);
  }
  if (graves) process.exit(1);
}

// ---------- a-traduire / remplir ----------

function aTraduire(chemin: string, max = Infinity): void {
  const f = lireCatalogue(chemin);
  let n = 0;
  f.entrees.forEach((e) => {
    if (e.en || n >= max) return;
    n++;
    console.log(`#${n}${e.ancien ? ` (modifié — ancien fr : ${JSON.stringify(e.ancien.fr)} — ancien en : ${JSON.stringify(e.ancien.en)})` : ''}\n${JSON.stringify(e.fr)}`);
  });
  console.log(`\n${f.entrees.filter((e) => !e.en).length} entrée(s) vide(s) dans ${relative(RACINE, chemin)}`);
}

function remplir(chemin: string, lot: string): void {
  const f = lireCatalogue(chemin);
  const traductions = JSON.parse(readFileSync(lot, 'utf8')) as string[];
  const vides = f.entrees.filter((e) => !e.en);
  if (traductions.length > vides.length) throw new Error(`${traductions.length} traductions pour ${vides.length} entrées vides`);
  // garde-fou contre un décalage (une traduction de trop ou de moins au milieu du lot) : longueurs très différentes
  const suspects = traductions.map((tr, i) => [i, vides[i]!.fr, tr] as const)
    .filter(([, fr, tr]) => Math.max(fr.length, tr.length) > 40 && (tr.length / fr.length < 0.45 || tr.length / fr.length > 2));
  if (suspects.length) {
    for (const [i, fr, tr] of suspects) console.log(`#${i + 1} longueurs suspectes :\n  fr ${fr.slice(0, 90)}\n  en ${tr.slice(0, 90)}`);
    if (!process.env.FORCER) throw new Error('lot probablement décalé : rien n’a été écrit (FORCER=1 pour passer outre)');
  }
  traductions.forEach((tr, i) => { const e = vides[i]!; e.en = tr; delete e.ancien; });
  writeFileSync(chemin, `${JSON.stringify(f, null, 1)}\n`);
  console.log(`${traductions.length} entrée(s) remplie(s) ; ${vides.length - traductions.length} encore vide(s).`);
}

// ---------- paires / reviser (relecture d'une traduction déjà faite) ----------

function paires(chemin: string, debut = 1, n = Infinity): void {
  const f = lireCatalogue(chemin);
  f.entrees.slice(debut - 1, debut - 1 + n).forEach((e, i) => console.log(`#${debut + i}\nFR ${e.fr}\nEN ${e.en ?? ''}`));
  console.log(`\n${f.entrees.length} entrée(s) dans ${relative(RACINE, chemin)}`);
}

/** lot : { "numéro": "nouvelle traduction" } (numéros de `paires`), seules les entrées citées changent */
function reviser(chemin: string, lot: string): void {
  const f = lireCatalogue(chemin);
  const nouvelles = JSON.parse(readFileSync(lot, 'utf8')) as Record<string, string>;
  for (const [n, tr] of Object.entries(nouvelles)) {
    const e = f.entrees[Number(n) - 1];
    if (!e) throw new Error(`pas d'entrée n° ${n}`);
    e.en = tr; delete e.ancien;
  }
  writeFileSync(chemin, `${JSON.stringify(f, null, 1)}\n`);
  console.log(`${Object.keys(nouvelles).length} entrée(s) revue(s).`);
}

// ---------- envelopper ----------

/** Une phrase à traduire : au moins deux mots d'au moins deux lettres, hors balises, et pas du code ou du CSS */
export function estPhrase(texte: string): boolean {
  const nu = texte.replace(/<[^>]*>/g, ' ').replace(/&[a-z]+;/g, ' ');
  if (/^[\s\w.#-]*\{[^}]*:[^}]*\}/.test(nu) || /[;{}]\s*$/.test(nu.trim())) return false; // CSS
  if (/^(?:[a-z-]+\s*:\s*[^;]+;\s*)+$/i.test(nu.trim())) return false; // style="…"
  const motsLus = nu.split(/\s+/).filter((m) => /^[«(“"'‘]*[\p{L}][\p{L}’'-]+[»)”"’.,;:!?…]*$/u.test(m));
  return motsLus.length >= 2 && motsLus.some((m) => /\p{L}{3}/u.test(m));
}

const OPERATEURS_COMPARAISON = new Set([ts.SyntaxKind.EqualsEqualsEqualsToken, ts.SyntaxKind.ExclamationEqualsEqualsToken, ts.SyntaxKind.EqualsEqualsToken, ts.SyntaxKind.ExclamationEqualsToken]);

function envelopper(chemins: string[]): void {
  for (const chemin of chemins) {
    const p = join(RACINE, chemin);
    const sf = lireSource(p);
    const code = sf.getFullText();
    // un nom local « t » existe déjà (paramètre, variable…) : la fonction est importée sous le nom « tr »
    let tPris = false;
    const chercherT = (n: ts.Node) => {
      if ((ts.isParameter(n) || ts.isVariableDeclaration(n) || ts.isFunctionDeclaration(n) || ts.isBindingElement(n)) && n.name && ts.isIdentifier(n.name) && n.name.text === 't') tPris = true;
      ts.forEachChild(n, chercherT);
    };
    chercherT(sf);
    const existants = nomsDeT(sf);
    const nom = existants.size ? [...existants][0]! : tPris ? 'tr' : 't';
    const ajouts: { pos: number; texte: string }[] = [];
    const rapport: string[] = [];
    const ligne = (n: ts.Node) => sf.getLineAndCharacterOfPosition(n.getStart()).line + 1;
    const visiter = (n: ts.Node) => {
      const estTexte = ts.isStringLiteral(n) || ts.isNoSubstitutionTemplateLiteral(n) || ts.isTemplateExpression(n);
      if (estTexte) {
        const brut = ts.isTemplateExpression(n) ? [n.head.text, ...n.templateSpans.map((s) => s.literal.text)].join(' ') : n.text;
        const parent = n.parent;
        const exclu = ts.isImportDeclaration(parent) || ts.isExportDeclaration(parent) || ts.isLiteralTypeNode(parent)
          || (ts.isPropertyAssignment(parent) && parent.name === n) || ts.isElementAccessExpression(parent)
          || ts.isTaggedTemplateExpression(parent) || ts.isExternalModuleReference(parent)
          || (ts.isCallExpression(parent) && ts.isIdentifier(parent.expression) && parent.expression.text === nom)
          || (ts.isCallExpression(parent) && ts.isPropertyAccessExpression(parent.expression) && ts.isIdentifier(parent.expression.expression) && parent.expression.expression.text === 'console');
        if (!exclu && estPhrase(brut)) {
          if (ts.isCaseClause(parent) || (ts.isBinaryExpression(parent) && OPERATEURS_COMPARAISON.has(parent.operatorToken.kind))) {
            rapport.push(`  ⚠ ligne ${ligne(n)} : phrase comparée, laissée telle quelle (à vérifier à la main) : ${brut.slice(0, 60)}`);
          } else if (ts.isStringLiteral(n)) {
            ajouts.push({ pos: n.getStart(), texte: `${nom}(` }, { pos: n.getEnd(), texte: ')' });
          } else {
            const avant = code[n.getStart() - 1] ?? '';
            ajouts.push({ pos: n.getStart(), texte: /[\w$]/.test(avant) ? ` ${nom}` : nom });
          }
        }
      }
      ts.forEachChild(n, visiter);
    };
    visiter(sf);
    if (!ajouts.length) { console.log(`${chemin} : aucune phrase.`); continue; }
    let nouveau = code;
    for (const a of ajouts.sort((x, y) => y.pos - x.pos)) nouveau = nouveau.slice(0, a.pos) + a.texte + nouveau.slice(a.pos);
    if (!existants.size) {
      const versI18n = posix(relative(dirname(p), join(SRC, 'core', 'i18n')));
      const chemin18 = versI18n.startsWith('.') ? versI18n : `./${versI18n}`;
      const imp = `import { ${nom === 't' ? 't' : `t as ${nom}`} } from '${chemin18}';\n`;
      // après le dernier import, ou après les commentaires de tête
      const imports = sf.statements.filter(ts.isImportDeclaration);
      const pos = imports.length ? imports[imports.length - 1]!.getEnd() + 1 : (sf.statements[0]?.getStart() ?? 0);
      const decal = ajouts.filter((a) => a.pos < pos).reduce((s, a) => s + a.texte.length, 0);
      nouveau = imports.length ? nouveau.slice(0, pos + decal) + imp + nouveau.slice(pos + decal) : `${nouveau.slice(0, pos + decal)}${imp}\n${nouveau.slice(pos + decal)}`;
    }
    writeFileSync(p, nouveau);
    console.log(`${chemin} : ${ajouts.filter((a) => a.texte !== ')').length} phrase(s) entourée(s) de ${nom}(…)`);
    for (const r of rapport) console.log(r);
  }
}

// ---------- envelopper-ui ----------

function nomEtImport(p: string): { nom: string; ajouterImport: (code: string) => string } {
  const sf = lireSource(p);
  let tPris = false;
  const chercherT = (n: ts.Node) => {
    if ((ts.isParameter(n) || ts.isVariableDeclaration(n) || ts.isFunctionDeclaration(n) || ts.isBindingElement(n)) && n.name && ts.isIdentifier(n.name) && n.name.text === 't') tPris = true;
    ts.forEachChild(n, chercherT);
  };
  chercherT(sf);
  const existants = nomsDeT(sf);
  const nom = existants.size ? [...existants][0]! : tPris ? 'tr' : 't';
  const ajouterImport = (code: string) => {
    if (existants.size) return code;
    const sf2 = ts.createSourceFile(p, code, ts.ScriptTarget.Latest, true);
    const versI18n = posix(relative(dirname(p), join(SRC, 'core', 'i18n')));
    const chemin18 = versI18n.startsWith('.') ? versI18n : `./${versI18n}`;
    const imp = `import { ${nom === 't' ? 't' : `t as ${nom}`} } from '${chemin18}';\n`;
    const imports = sf2.statements.filter(ts.isImportDeclaration);
    if (imports.length) { const pos = imports[imports.length - 1]!.getEnd() + 1; return code.slice(0, pos) + imp + code.slice(pos); }
    const pos = sf2.statements[0]?.getStart() ?? 0;
    return `${code.slice(0, pos)}${imp}\n${code.slice(pos)}`;
  };
  return { nom, ajouterImport };
}

function envelopperInterface(chemins: string[]): void {
  const ids = textesIdentifiants(fichiersSource());
  for (const chemin of chemins) {
    const p = join(RACINE, chemin);
    const avant = readFileSync(p, 'utf8');
    const { nom, ajouterImport } = nomEtImport(p);
    const r = envelopperUi(p, nom, ids);
    if (r.code !== avant) writeFileSync(p, ajouterImport(r.code));
    console.log(`${chemin} : ${r.n} texte(s) entouré(s)`);
  }
}

// ---------- commande ----------

const [commande = 'tout', ...args] = process.argv.slice(2);
if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) switch (commande) {
  case 'tout': extraire(); couverture(); break;
  case 'extraire': extraire(); break;
  case 'couverture': couverture(); break;
  case 'verifier': verifier(); break;
  case 'envelopper': envelopper(args); break;
  case 'envelopper-ui': envelopperInterface(args); break;
  case 'a-traduire': aTraduire(resolve(RACINE, args[0]!), args[1] ? Number(args[1]) : Infinity); break;
  case 'paires': paires(resolve(RACINE, args[0]!), args[1] ? Number(args[1]) : 1, args[2] ? Number(args[2]) : Infinity); break;
  case 'reviser': reviser(resolve(RACINE, args[0]!), resolve(RACINE, args[1]!)); break;
  case 'remplir': remplir(resolve(RACINE, args[0]!), resolve(RACINE, args[1]!)); break;
  default: console.log('Commandes : extraire, couverture, verifier, envelopper <fichiers>, a-traduire <catalogue> [max], remplir <catalogue> <lot.json>');
}
