// Actions du Cercle des quais (3 novembre 2026) : les volets, les amis, les vitrines, les échanges, les défis, et le duel lui-même.

import * as J from '../../core/jeu';
import type { Lignee, Rarete } from '../../core/types';
import { app, D } from '../etat';
import { afficher } from '../rendu';
import { sauver, champ } from '../synchro';
import {
  C, accepterAmi, accepterProposition, ajouterAmi, annulerDefi, annulerProposition, proposerEchange, publierVitrine, refuserDefi,
  refuserProposition, relireVitrines, retirerAmi, suivreCercle,
} from '../cercle';
import { DL, accepterDefi, confirmerAbandon, defierAmi, duelRobot, quitterDuel, revanche } from '../duel';
import { ouvrir, type Clic, type Suite } from './commun';
import { t } from '../../core/i18n';

const fermerFeuilles = () => { C.ami = null; C.choix = null; C.echange = null; };

export async function agirCercle(a: string, c: Clic): Promise<Suite> {
  const id = c.id;
  // ---------- le duel ----------
  if (a.startsWith('duel-') && app.mode === 'duel') {
    const s = DL.session;
    if (a === 'duel-retour') { quitterDuel(); return 'fin'; }
    if (a === 'duel-revanche') { await revanche(); return 'fin'; }
    if (!s) return 'fin';
    if (a === 'duel-poser') s.poser(c.b.dataset.uid!);
    else if (a === 'duel-reprendre') s.reprendre(c.b.dataset.uid!);
    else if (a === 'duel-viser') s.viser(c.b.dataset.porteur!);
    else if (a === 'duel-soigner') {
      const soin = [...s.brouillon.cotes[s.camp].chaine].reverse().find((g) => g.type === 'soin');
      if (soin) s.soigner(soin.uid, c.b.dataset.porteur!);
    } else if (a === 'duel-allonger') s.allonger();
    else if (a === 'duel-repiocher') s.repiocher();
    else if (a === 'duel-verrouiller') s.verrouiller();
    else if (a === 'duel-reclamer') s.reclamer();
    else if (a === 'duel-quitter') { if (confirmerAbandon()) s.quitter(); else return 'fin'; }
    afficher();
    return 'fin';
  }
  switch (a) {
    case 'cercle': {
      ouvrir('cercle');
      fermerFeuilles();
      C.message = '';
      C.aide = false;
      afficher();
      await suivreCercle();
      relireVitrines();
      return 'fin';
    }
    case 'cercle-entrer': J.etatCercle(app.jeu).vu = true; C.aide = false; sauver(); break;
    case 'cercle-aide': C.aide = true; fermerFeuilles(); break;
    case 'cercle-batiment': ouvrir('archipel'); D.selection = 'cercle'; break;
    case 'cercle-onglet': C.onglet = id as typeof C.onglet; C.message = ''; fermerFeuilles(); window.scrollTo(0, 0); break;
    case 'cercle-relire': await suivreCercle(true); break;
    case 'cercle-fermer': fermerFeuilles(); break;
    // les amis
    case 'cercle-ajouter': {
      const nom = champ('cr-pseudo');
      if (!nom) { C.message = t('Tape le nom de directeur de ton ami.'); break; }
      await ajouterAmi(nom);
      break;
    }
    case 'cercle-accepter-ami': await accepterAmi(id); break;
    case 'cercle-retirer-ami': await retirerAmi(id); break;
    case 'cercle-ami': C.ami = id; C.choix = null; C.echange = null; break;
    // la vitrine et les souhaits
    case 'cercle-choisir': C.choix = id === 'vitrine' ? 'vitrine' : 'souhaits'; C.ami = null; C.echange = null;
      if (C.choix === 'vitrine') C.filtreMetal = 'argent';
      break;
    case 'cercle-filtre-metal': C.filtreMetal = id as Rarete; break;
    case 'cercle-filtre-lignee': C.filtreLignee = id as Lignee | 'tout'; break;
    case 'cercle-souhait': { const r = J.basculerSouhait(app.jeu, id); if (!r.ok) C.message = r.message ?? ''; sauver(); publierVitrine(); break; }
    case 'cercle-vitrine': { const r = J.basculerVitrine(app.jeu, id); C.message = r.ok ? '' : r.message ?? ''; sauver(); publierVitrine(); break; }
    // les échanges
    case 'cercle-echanger': C.echange = { ami: id }; C.ami = null; C.choix = null; C.message = ''; break;
    case 'cercle-recoit': if (C.echange) C.echange = id ? { ami: C.echange.ami, recoit: id } : { ami: C.echange.ami }; break;
    case 'cercle-donne': if (C.echange) C.echange.donne = id; break;
    case 'cercle-proposer': await proposerEchange(); break;
    case 'cercle-prop-accepter': await accepterProposition(id); break;
    case 'cercle-prop-refuser': await refuserProposition(id); break;
    case 'cercle-prop-annuler': await annulerProposition(id); break;
    // les duels
    case 'cercle-mode': C.mode = id === 'egal' ? 'egal' : 'libre'; break;
    case 'cercle-defier': fermerFeuilles(); await defierAmi(id, C.mode); return 'fin';
    case 'cercle-defi-accepter': await accepterDefi(id); return 'fin';
    case 'cercle-defi-refuser': await refuserDefi(id); break;
    case 'cercle-defi-annuler': await annulerDefi(id); break;
    case 'cercle-robot': duelRobot(); return 'fin';
    default: return 'inconnu';
  }
  return 'afficher';
}
