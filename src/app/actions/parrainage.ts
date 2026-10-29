// Actions de l'écran « Recruter » : ouvrir, partager le lien, copier le code, entrer le code d'un parrain.

import { codeAffiche } from '../../core/jeu';
import { app, D, racine } from '../etat';
import { afficher } from '../rendu';
import { entrerCode, lienDe, lireRecrues, ouvrirRecruter, preparerCode, R } from '../parrainage';
import { ouvrir, type Clic, type Suite } from './commun';

async function copier(texte: string): Promise<boolean> {
  try { await navigator.clipboard.writeText(texte); return true; } catch { return false; }
}

export async function agirParrainage(a: string, _c: Clic): Promise<Suite> {
  switch (a) {
    case 'recruter':
      ouvrir('recruter');
      D.ressource = null;
      afficher();
      await ouvrirRecruter();
      return 'fin';
    case 'rc-actualiser':
      if (!app.jeu.parrainage?.code) await preparerCode();
      afficher();
      await lireRecrues();
      break;
    case 'rc-partager': {
      const code = app.jeu.parrainage?.code;
      if (!code) break;
      const lien = lienDe(code);
      const texte = `Rejoins-moi sur EMPREINTES : 2121, sous les eaux, d’autres se souviennent encore. Mon code de recrutement : ${codeAffiche(code)}`;
      if (navigator.share) {
        try { await navigator.share({ title: 'EMPREINTES', text: texte, url: lien }); } catch { /* partage annulé */ }
        return 'fin';
      }
      D.message = (await copier(`${texte}\n${lien}`)) ? 'Lien copié : colle-le dans un message à ton ami.' : `Ton lien : ${lien}`;
      break;
    }
    case 'rc-copier': {
      const code = app.jeu.parrainage?.code;
      if (code) D.message = (await copier(codeAffiche(code))) ? `Code ${codeAffiche(code)} copié.` : `Ton code : ${codeAffiche(code)}`;
      break;
    }
    case 'rc-entrer': {
      const saisie = (racine.querySelector('#rc-code') as HTMLInputElement | null)?.value ?? '';
      R.occupe = true; R.saisie = null; afficher();
      R.saisie = await entrerCode(saisie);
      R.occupe = false;
      if (R.saisie.ok) D.message = R.saisie.texte;
      break;
    }
    default: return 'inconnu';
  }
  return 'afficher';
}
