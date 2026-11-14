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
import * as CF from '../confluence';
import { lireTableau } from '../tableau';
import { DL, accepterDefi, confirmerAbandon, defierAmi, duelRobot, quitterDuel, revanche } from '../duel';
import { ouvrir, type Clic, type Suite } from './commun';
import { t } from '../../core/i18n';

const fermerFeuilles = () => { C.ami = null; C.choix = null; C.echange = null; C.cf.feuille = null; C.cf.membre = null; C.cf.confirmer = null; };
/** Ce qui se lit à l'ouverture d'un volet : la Confluence, et le Grand Tableau pour les Rangs */
function lireVolet() {
  if (C.onglet === 'confluence' || C.onglet === 'rangs') { void CF.suivreConfluence(); void CF.lireListe(); }
  if (C.onglet === 'rangs' || C.onglet === 'confluence') void lireTableau().then(afficher);
}
/** Lire un champ sans le vider (les champs gardés se recopient à chaque dessin) */
const valeur = (id: string) => (document.getElementById(id) as HTMLInputElement | null)?.value ?? '';
const poser = (id: string, v: string) => { const i = document.getElementById(id) as HTMLInputElement | null; if (i) i.value = v; };

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
      lireVolet();
      return 'fin';
    }
    case 'cercle-entrer': J.etatCercle(app.jeu).vu = true; C.aide = false; sauver(); break;
    case 'cercle-aide': C.aide = true; fermerFeuilles(); break;
    case 'cercle-batiment': ouvrir('archipel'); D.selection = 'cercle'; break;
    case 'cercle-onglet': C.onglet = (id === 'duels' ? 'amis' : id) as typeof C.onglet; C.message = ''; fermerFeuilles(); window.scrollTo(0, 0); lireVolet(); break;
    case 'cercle-relire': await suivreCercle(true); lireVolet(); break;
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
    // ---------- la Confluence (14 novembre 2026) ----------
    case 'cf-relire': await CF.suivreConfluence(true); await CF.lireListe(true); break;
    case 'cf-sous': C.cf.sous = id as typeof C.cf.sous; C.message = ''; break;
    case 'cf-chercher': { const v = valeur('cf-chercher').trim(); if (!v) { C.message = t('Tape le nom de la Confluence.'); break; } await CF.chercherConfluence(v); break; }
    case 'cf-voir': await CF.voirConfluence(id); break;
    case 'cf-rejoindre': await CF.rejoindreConfluence(id); break;
    case 'cf-fonder': fermerFeuilles(); C.cf.form = { nom: '', devise: J.DEVISES[0]!, embleme: Math.floor(Math.random() * J.CONFLUENCE.emblemes), couleur: Math.floor(Math.random() * J.CONFLUENCE.couleurs) }; C.cf.erreurForm = ''; C.cf.feuille = 'fonder'; break;
    case 'cf-reglages': { const k = C.cf.conf; if (!k) break; fermerFeuilles(); C.cf.form = { nom: k.nom, devise: k.devise, embleme: k.embleme, couleur: k.couleur }; C.cf.erreurForm = ''; C.cf.feuille = 'reglages'; break; }
    case 'cf-devise': C.cf.form.devise = id; poser('cf-devise', id); C.cf.form.nom = valeur('cf-nom') || C.cf.form.nom; break;
    case 'cf-embleme': C.cf.form.embleme = Number(id) || 0; C.cf.form.nom = valeur('cf-nom') || C.cf.form.nom; C.cf.form.devise = valeur('cf-devise'); break;
    case 'cf-couleur': C.cf.form.couleur = Number(id) || 0; C.cf.form.nom = valeur('cf-nom') || C.cf.form.nom; C.cf.form.devise = valeur('cf-devise'); break;
    case 'cf-fonder-ok': { const f = C.cf.form; f.nom = valeur('cf-nom'); f.devise = valeur('cf-devise'); await CF.fonderConfluence(f.nom, f.devise, f.embleme, f.couleur); break; }
    case 'cf-reglages-ok': { const f = C.cf.form; f.devise = valeur('cf-devise'); await CF.reglerConfluence({ devise: f.devise.trim().slice(0, 80), embleme: f.embleme, couleur: f.couleur }); C.cf.feuille = null; break; }
    case 'cf-ouverte': if (C.cf.conf) await CF.reglerConfluence({ ouverte: !C.cf.conf.ouverte }); break;
    case 'cf-palier': CF.recevoirPalier(Number(id)); break;
    case 'cf-envoyer': { const v = valeur('cf-texte'); if (!v.trim()) break; if (await CF.ecrireQuai(v)) poser('cf-texte', ''); break; }
    case 'cf-rapide': await CF.ecrireQuai('', Number(id)); break;
    case 'cf-effacer': await CF.effacerMessage(id); break;
    case 'cf-demander': fermerFeuilles(); C.cf.feuille = 'demande'; C.cf.metalDemande = 'fer'; break;
    case 'cf-metal': C.cf.metalDemande = id as Rarete; break;
    case 'cf-demander-carte': await CF.demanderCopies(id); break;
    case 'cf-donner': await CF.donnerCopie(id); break;
    case 'cf-membre': fermerFeuilles(); C.cf.membre = id; C.cf.feuille = 'membre'; break;
    case 'cf-muet': { const tu = J.basculerMuet(app.jeu, id, Date.now()); C.message = tu ? t('Ses messages ne s’affichent plus chez toi.') : t('Ses messages s’affichent à nouveau.'); sauver(); break; }
    case 'cf-ancien': await CF.basculerAncien(id); break;
    case 'cf-ecarter': C.cf.confirmer = `ecarter:${id}`; break;
    case 'cf-ecarter-ok': await CF.ecarterMembre(id); fermerFeuilles(); break;
    case 'cf-quitter': C.cf.confirmer = 'quitter'; break;
    case 'cf-quitter-ok': await CF.quitterLaConfluence(); break;
    case 'cf-annuler': C.cf.confirmer = null; break;
    case 'cf-ajouter-ami': fermerFeuilles(); await ajouterAmi(id); break;
    // ---------- les Rangs ----------
    case 'rg-portee': C.rangs.portee = id as typeof C.rangs.portee; lireVolet(); break;
    case 'rg-tableau': C.rangs.tableau = id as typeof C.rangs.tableau; break;
    case 'rg-periode': C.rangs.periode = id === 'total' ? 'total' : 'semaine'; break;
    default: return 'inconnu';
  }
  return 'afficher';
}
