// Comparaison visuelle avant / après : construit le jeu tel qu'il est dans un commit de référence et tel qu'il est
// maintenant, photographie les mêmes écrans (téléphone 390 px et PC 1280 px, heure figée, animations réduites)
// et compte les pixels qui changent. Rien n'est enregistré dans le dépôt : tout va dans .visuel/.
// usage : npm run visuel            → compare avec le dernier commit (HEAD)
//         npm run visuel -- main    → compare avec une branche ou un commit
// Il faut Playwright et Chromium sur la machine (npx playwright install chromium).

import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { resolve } from 'node:path';
import { build, preview } from 'vite';

const racine = resolve(import.meta.dirname, '..');
const sortie = resolve(racine, '.visuel');
const ref = process.argv[2] ?? 'HEAD';
const T = Date.parse('2026-10-25T10:00:00Z');

/** Les écrans photographiés : la sauvegarde de départ, puis les gestes pour y arriver */
type Page = import('playwright').Page;
const ENTRER = async (p: Page) => {
  await p.click('.titre-go');
  await p.waitForTimeout(400);
  // les fenêtres d'arrivée (nouveaux Porteurs, retour au district) se ferment d'elles-mêmes
  for (let i = 0; i < 3 && (await p.$('.voile')); i++) {
    await p.click('.voile button.prim, .voile .btn.prim').catch(() => {});
    await p.waitForTimeout(300);
  }
};
const SCENES: { nom: string; sauvegarde: 'district' | 'combat' | 'debut'; faire: (p: Page) => Promise<void> }[] = [
  { nom: 'titre', sauvegarde: 'district', faire: async () => {} },
  { nom: 'archipel', sauvegarde: 'district', faire: ENTRER },
  { nom: 'forge', sauvegarde: 'district', faire: async (p) => { await ENTRER(p); await p.click('button.plaque[data-id="forge"]'); } },
  { nom: 'generateur', sauvegarde: 'district', faire: async (p) => { await ENTRER(p); await p.click('button.plaque[data-id="generateur"]'); } },
  { nom: 'noyau', sauvegarde: 'district', faire: async (p) => { await ENTRER(p); await p.click('button.plaque[data-id="noyau"]'); } },
  { nom: 'tour', sauvegarde: 'district', faire: async (p) => { await ENTRER(p); await p.click('.onglet[data-action="coupe"]'); } },
  { nom: 'porteurs', sauvegarde: 'district', faire: async (p) => { await ENTRER(p); await p.click('.onglet[data-action="porteurs"]'); } },
  { nom: 'deck-echange', sauvegarde: 'district', faire: async (p) => { await ENTRER(p); await p.click('.onglet[data-action="porteurs"]'); await p.click('[data-action="porteur"]'); await p.click('.fp-deck'); await p.click('.deck-porteur [data-action="dk-porte"]'); } },
  { nom: 'cartes', sauvegarde: 'district', faire: async (p) => { await ENTRER(p); await p.click('.onglet[data-action="cartes"]'); } },
  { nom: 'chroniques', sauvegarde: 'district', faire: async (p) => { await ENTRER(p); await p.click('.onglet[data-action="codex"]'); } },
  { nom: 'menu', sauvegarde: 'district', faire: async (p) => { await ENTRER(p); await p.click('.onglet[data-action="menu"]'); await p.click('[data-action="compte"]').catch(() => {}); } },
  { nom: 'classements', sauvegarde: 'district', faire: async (p) => { await ENTRER(p); await p.click('.onglet[data-action="menu"]'); await p.click('[data-action="classements"]'); } },
  { nom: 'fleche', sauvegarde: 'district', faire: async (p) => { await ENTRER(p); await p.click('.onglet[data-action="menu"]'); await p.click('[data-action="classements"]'); await p.click('[data-action="gt-tableau"][data-id="fleche"]'); } },
  { nom: 'strate', sauvegarde: 'combat', faire: ENTRER },
  { nom: 'combat', sauvegarde: 'combat', faire: async (p) => { await ENTRER(p); await p.click('[data-action="salle"]'); await p.waitForTimeout(600); } },
  { nom: 'debut', sauvegarde: 'debut', faire: ENTRER },
];
const TAILLES = [[390, 844], [1280, 800]] as const;

function git(...args: string[]) {
  return execFileSync('git', args, { cwd: racine, encoding: 'utf8' }).trim();
}

async function construire(dossier: string, vers: string) {
  await build({ root: dossier, logLevel: 'error', build: { outDir: vers, emptyOutDir: true } });
}

async function main() {
  rmSync(sortie, { recursive: true, force: true });
  mkdirSync(sortie, { recursive: true });
  // la version de référence, dans un dossier à part (git worktree)
  const avant = resolve(sortie, 'reference');
  // une exécution interrompue a pu laisser l'ancien dossier enregistré : on fait le ménage d'abord
  git('worktree', 'prune');
  git('worktree', 'add', '--detach', avant, ref);
  try {
    if (!existsSync(resolve(avant, 'node_modules'))) symlinkSync(resolve(racine, 'node_modules'), resolve(avant, 'node_modules'));
    console.log(`Construction de ${ref} et de la version actuelle…`);
    await construire(avant, resolve(sortie, 'dist-avant'));
    await construire(racine, resolve(sortie, 'dist-apres'));
    // les sauvegardes de démonstration (milieu de partie, expédition, début), plus une Forge et un chantier en cours
    execFileSync('npx', ['tsx', 'scripts/etat-demo.ts', sortie], { cwd: racine, stdio: 'ignore' });
    const lire = (n: string) => JSON.parse(execFileSync('cat', [resolve(sortie, `${n}.json`)], { encoding: 'utf8' }));
    const saves = { district: lire('district'), combat: lire('combat'), debut: lire('debut') };
    for (const s of Object.values(saves)) s.data.ageVu = 2;
    const d = saves.district.data;
    d.forge = { moduleId: Object.keys(d.collection)[0]!.split('@')[0], debut: T - 600_000, fin: T + 1_234_000 };
    d.chantiers = [{ batiment: 'generateur', debut: T - 300_000, fin: T + 2_500_000 }];

    const serveurs = await Promise.all(['dist-avant', 'dist-apres'].map((dist, i) =>
      preview({ root: racine, logLevel: 'error', build: { outDir: resolve(sortie, dist) }, preview: { port: 4401 + i, strictPort: true } })));
    // require : trouve aussi un Playwright installé pour toute la machine
    const { chromium } = createRequire(import.meta.url)('playwright') as typeof import('playwright');
    const navigateur = await chromium.launch();
    const resultats: { nom: string; differents: number }[] = [];
    const erreurs: string[] = [];
    try {
      for (const [w, h] of TAILLES) {
        for (const scene of SCENES) {
          const photos: Buffer[] = [];
          for (const port of [4401, 4402]) {
            const ctx = await navigateur.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 1, reducedMotion: 'reduce' });
            // aucun accès à Firebase : les tests ne créent pas de comptes et n'écrivent rien dans les vraies données (les polices restent)
            await ctx.route(/identitytoolkit\.googleapis|securetoken\.googleapis|firestore\.googleapis|firebaseinstallations\.googleapis|firebaseapp\.com/, (r) => r.abort());
            // tsx ajoute un petit outil (__name) dans les fonctions envoyées à la page : on le fournit
            await ctx.addInitScript({ content: 'window.__name = (f) => f;' });
            const p = await ctx.newPage();
            p.setDefaultTimeout(4000);
            p.on('pageerror', (e) => erreurs.push(`${port === 4401 ? 'avant' : 'après'} · ${scene.nom} ${w} px : ${e.message}`));
            await p.clock.setFixedTime(T);
            // Math.random figé : les étincelles et particules tombent au même endroit dans les deux versions
            await p.addInitScript(([s]) => {
              let x = 42;
              Math.random = () => ((x = (x * 16807) % 2147483647) - 1) / 2147483646;
              try { localStorage.setItem('empreintes.jeu.v2', s!); } catch { /* stockage bloqué */ }
              // ni chargement ni décodage différés : une image serait peinte ou non selon le moment de la photo
              const html = Object.getOwnPropertyDescriptor(Element.prototype, 'innerHTML')!;
              Object.defineProperty(Element.prototype, 'innerHTML', {
                get() { return html.get!.call(this); },
                set(v: string) { html.set!.call(this, typeof v === 'string' ? v.replaceAll('loading="lazy"', 'loading="eager"').replaceAll('decoding="async"', 'decoding="sync"') : v); },
              });
            }, [JSON.stringify(saves[scene.sauvegarde])]);
            await p.goto(`http://localhost:${port}/`);
            await p.waitForTimeout(300);
            try { await scene.faire(p); } catch (e) { console.log(`  ${scene.nom} ${w} px : geste impossible (${String(e).split('\n')[0]})`); }
            // toutes les images visibles chargées (les portraits arrivent en différé)
            await p.waitForLoadState('networkidle').catch(() => {});
            await p.waitForFunction(() => [...document.images].every((i) => i.complete), null, { timeout: 4000 }).catch(() => {});
            await p.evaluate(() => Promise.all([...document.images].map((i) => i.decode().catch(() => {})))).catch(() => {});
            await p.waitForTimeout(800);
            // l'écran doit être stable : deux photos de suite identiques (une image qui finit de se décoder change la photo)
            let photo = await p.screenshot();
            for (let essai = 0; essai < 8; essai++) {
              await p.waitForTimeout(250);
              const encore = await p.screenshot();
              if (encore.equals(photo)) break;
              photo = encore;
            }
            photos.push(photo);
            await ctx.close();
          }
          const nom = `${scene.nom}-${w}`;
          // la comparaison se fait dans le navigateur : pas de dépendance en plus
          const page = await navigateur.newPage();
          await page.evaluate('window.__name = (f) => f;');
          const differents = await page.evaluate(async ([a, b]) => {
            const img = async (src: string) => { const i = new Image(); i.src = src; await i.decode(); return i; };
            const [A, B] = await Promise.all([img(a!), img(b!)]);
            const pixels = (i: HTMLImageElement) => {
              const c = document.createElement('canvas'); c.width = i.width; c.height = i.height;
              const g = c.getContext('2d')!; g.drawImage(i, 0, 0); return g.getImageData(0, 0, i.width, i.height).data;
            };
            const pa = pixels(A), pb = pixels(B);
            if (pa.length !== pb.length) return -1;
            let n = 0;
            for (let k = 0; k < pa.length; k += 4) {
              if (Math.max(Math.abs(pa[k]! - pb[k]!), Math.abs(pa[k + 1]! - pb[k + 1]!), Math.abs(pa[k + 2]! - pb[k + 2]!)) > 40) n++;
            }
            return n;
          }, photos.map((x) => `data:image/png;base64,${x.toString('base64')}`));
          await page.close();
          resultats.push({ nom, differents });
          if (differents !== 0) {
            writeFileSync(resolve(sortie, `${nom}-avant.png`), photos[0]!);
            writeFileSync(resolve(sortie, `${nom}-apres.png`), photos[1]!);
          }
        }
      }
    } finally {
      await navigateur.close();
      await Promise.all(serveurs.map((s) => s.close()));
    }
    // quelques pixels isolés = lissage des polices ; au-delà, regarder les images dans .visuel/
    const changes = resultats.filter((r) => r.differents > 20 || r.differents < 0);
    const etat = (n: number) => (n < 0 ? '  TAILLE ≠  ' : n === 0 ? '  identique ' : n <= 20 ? '  ≈ identique' : '  CHANGÉ    ');
    for (const r of resultats) console.log(`${etat(r.differents)} ${r.nom}${r.differents > 0 ? ` (${r.differents} px)` : ''}`);
    if (erreurs.length) console.log(`\nErreurs JavaScript dans la page :\n${[...new Set(erreurs)].map((e) => '  ' + e).join('\n')}`);
    console.log(changes.length ? `\n${changes.length} écran(s) changé(s) : voir .visuel/*-avant.png et *-apres.png` : '\nAucun changement visible.');
  } finally {
    git('worktree', 'remove', '--force', avant);
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
