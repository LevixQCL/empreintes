// Le bestiaire (31 octobre 2026, src/core/strates.ts) : une fiche par ennemi des Strates, dans la Bibliothèque.
// Elle s'ouvre à force de le vaincre : d'où il vient (1re victoire), comment il se bat (4e), son secret (10e).

import { ZONES, ennemiDef, NOMS_LIGNEE } from '../core/donnees';
import { BESTIAIRE, PALIERS_BESTIAIRE, lignesBestiaire } from '../core/strates';
import type { Jeu } from '../core/jeu';
import { illustrationEnnemi, portraitProvisoire } from './art';
import { RODEURS } from '../core/explorer';
import { ICO } from './icones';
import { echap } from './outils';
import { COULEUR } from './vue';

const ZONE_NOMS = ['Les Seuils · −1 à −3', 'Les Salles closes · −4 à −6', 'Les Registres · −7 à −9', 'Le Fond · −10'];

/** Les ennemis d'une zone, ceux qu'elle partage avec une zone d'avant n'y reviennent pas */
function parZone(): string[][] {
  const vus = new Set<string>();
  return ZONES.map((z) => [...z.ennemis, z.boss].filter((id) => BESTIAIRE[id] && !vus.has(id) && (vus.add(id), true)));
}

export function htmlBestiaire(j: Jeu): string {
  const victoires = (id: string) => j.stats?.ennemis[id]?.[0] ?? 0;
  const tous = Object.keys(BESTIAIRE).filter((id) => !RODEURS.some((r) => r.id === id));
  const connus = tous.filter((id) => victoires(id) > 0).length;
  let h = `<p class="aide intro-ecran">Ce que les Veilleurs savent des habitants des Strates. Une fiche s’écrit à force de les vaincre : d’où ils viennent, comment ils se battent, puis leur secret. <b>${connus} / ${tous.length}</b> rencontrés.</p>`;
  parZone().forEach((ids, z) => {
    if (!ids.length) return;
    h += `<section class="bs-zone"><span class="surtitre">${echap(ZONE_NOMS[z] ?? '')}</span><div class="bs-liste">`;
    for (const id of ids) {
      const v = victoires(id);
      const d = ennemiDef(id);
      const img = illustrationEnnemi(id);
      if (!v) {
        h += `<article class="bs-fiche inconnue"><span class="bs-img" aria-hidden="true">${ICO.verrou}</span><div><strong>Pas encore vaincu</strong><small>${echap(d.tag)}</small></div></article>`;
        continue;
      }
      const l = lignesBestiaire(id, v);
      const ligne = (titre: string, t: string | undefined, palier: number) => (t
        ? `<p><b>${titre}</b>${echap(t)}</p>`
        : `<p class="bs-cache">${ICO.verrou}<span>${titre} : à ${palier} victoires</span></p>`);
      h += `<article class="bs-fiche" style="--c:${COULEUR[d.lignee]}"><span class="bs-img" aria-hidden="true">${img ? `<img src="${img}" alt="" loading="lazy" decoding="async">` : ICO.cristal}</span>`
        + `<div><strong>${echap(d.nom)}</strong><small>${echap(d.tag)} · ${echap(NOMS_LIGNEE[d.lignee].nom)} · <b>${v}</b> victoire${v > 1 ? 's' : ''}</small>`
        + ligne('Origine', l.origine, PALIERS_BESTIAIRE[0]) + ligne('Au combat', l.conseil, PALIERS_BESTIAIRE[1]) + ligne('Secret', l.secret, PALIERS_BESTIAIRE[2])
        + `</div></article>`;
    }
    h += `</div></section>`;
  });
  return h + htmlRodeurs(j);
}

/** Les Rôdeurs (31 octobre 2026, explorer.ts) : leurs traces, leur vie restante, leur fiche ; la fiche entière s'ouvre quand il tombe */
function htmlRodeurs(j: Jeu): string {
  let h = `<section class="bs-zone bs-rodeurs"><span class="surtitre">Les Rôdeurs · un par zone, en Explorer</span><div class="bs-liste">`;
  for (const r of RODEURS) {
    const d = ennemiDef(r.id);
    const e = j.rodeurs?.[r.id];
    const f = BESTIAIRE[r.id]!;
    if (!e) {
      h += `<article class="bs-fiche inconnue"><span class="bs-img" aria-hidden="true">${ICO.griffes}</span><div><strong>Des traces, quelque part</strong><small>${echap(d.tag)} · se croise en explorant une Strate déjà vaincue</small></div></article>`;
      continue;
    }
    const img = illustrationEnnemi(r.id);
    const etat = e.abattu ? `<b class="bs-abattu">Abattu</b>` : `il lui reste <b>${Math.round(e.part * 100)} %</b> de sa vie`;
    h += `<article class="bs-fiche${e.abattu ? '' : ' traque'}" style="--c:${COULEUR[d.lignee]}"><span class="bs-img${portraitProvisoire(r.id) ? ' provisoire' : ''}" aria-hidden="true">${img ? `<img src="${img}" alt="" loading="lazy" decoding="async">` : ICO.griffes}</span>`
      + `<div><strong>${echap(d.nom)}</strong><small>${echap(d.tag)} · ${echap(NOMS_LIGNEE[d.lignee].nom)} · ${e.rencontres} rencontre${e.rencontres > 1 ? 's' : ''} · ${etat}</small>`
      + `<p><b>Origine</b>${echap(f.origine)}</p><p><b>Au combat</b>${echap(f.conseil)}</p>`
      + (e.abattu ? `<p><b>Secret</b>${echap(f.secret)}</p>` : `<p class="bs-cache">${ICO.verrou}<span>Secret : quand il tombera</span></p>`)
      + `</div></article>`;
  }
  return h + `</div></section>`;
}
