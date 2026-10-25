// Actions du Grand Tableau : onglets, pseudo, se retirer.

import { clePseudo, DELAI_PSEUDO, nettoyerNom, nomValide, pseudoInterdit, TABLEAUX, type Periode, type TableauId } from '../../core/classements';
import { app, compteEtat, D, G, racine } from '../etat';
import { afficher } from '../rendu';
import { sauver } from '../synchro';
import { lireTableau, planifierPublication, reseauTableau } from '../tableau';
import { ouvrir, type Clic, type Suite } from './commun';

export async function agirTableau(a: string, c: Clic): Promise<Suite> {
  const { id } = c;
  switch (a) {
    case 'classements':
      ouvrir('classements');
      if (id && TABLEAUX.some((t) => t.id === id)) G.tableau = id as TableauId;
      D.ressource = null;
      lireTableau();
      break;
    case 'gt-tableau': G.tableau = id as TableauId; G.regles = false; break;
    case 'gt-periode': G.periode = id as Periode; break;
    case 'gt-regles': G.regles = !G.regles; break;
    case 'gt-actualiser': await lireTableau(true); return 'fin';
    case 'gt-connexion': D.menu = true; compteEtat.ouvert = true; break;
    case 'gt-nom': G.edition = true; G.accueil = false; G.erreur = ''; lireTableau(); break;
    case 'gt-nom-fermer': G.edition = false; G.accueil = false; G.erreur = ''; break;
    case 'gt-nom-ok': {
      const nom = nettoyerNom((racine.querySelector('#gt-nom') as HTMLInputElement | null)?.value ?? '');
      const avant = app.jeu.directeur?.nom ?? null;
      if (!nomValide(nom)) { G.erreur = 'De 3 à 18 caractères : lettres (alphabet latin), chiffres, espaces, points, tirets.'; break; }
      if (pseudoInterdit(nom)) { G.erreur = 'Ce pseudo n’est pas accepté. Choisis-en un autre.'; break; }
      const change = !!avant && clePseudo(avant) !== clePseudo(nom);
      const depuis = app.jeu.directeur?.change ?? 0;
      if (change && Date.now() - depuis < DELAI_PSEUDO) {
        G.erreur = `Un changement de pseudo par semaine : le prochain est possible le ${new Date(depuis + DELAI_PSEUDO).toLocaleDateString('fr-BE', { weekday: 'long', day: 'numeric', month: 'long' })}.`;
        break;
      }
      if (G.entrees.some((x) => x.uid !== app.uid && x.cle === clePseudo(nom))) { G.erreur = 'Ce pseudo est déjà pris par un autre directeur.'; break; }
      // la réservation en ligne : c'est elle qui garantit qu'il n'y a pas deux fois le même pseudo
      if (app.compte && app.uid) {
        G.etat = 'chargement'; afficher();
        try {
          await (await reseauTableau()).reserver(app.uid, nom, avant);
          G.etat = 'ok';
        } catch (e) {
          G.etat = 'ok';
          const net = await reseauTableau();
          G.erreur = e instanceof net.PseudoPris ? 'Ce pseudo est déjà pris par un autre directeur.' : `Impossible de réserver ce pseudo pour l’instant (${(e as { code?: string })?.code ?? 'réseau'}).`;
          break;
        }
        app.pseudoReserve = clePseudo(nom);
      }
      app.jeu.directeur = { nom, public: app.jeu.directeur ? app.jeu.directeur.public || D.vue === 'classements' : true, change: change || !avant ? Date.now() : depuis };
      G.edition = false; G.accueil = false; G.erreur = '';
      D.message = `Bienvenue, ${nom} : c’est ce nom que verront les autres joueurs.`;
      sauver();
      planifierPublication(0);
      break;
    }
    case 'gt-retirer': G.retrait = !G.retrait; break;
    case 'gt-retirer-ok': {
      G.retrait = false;
      if (!app.uid) break;
      try {
        await (await reseauTableau()).retirer(app.uid);
        if (app.jeu.directeur) app.jeu.directeur.public = false;
        G.entrees = G.entrees.filter((x) => x.uid !== app.uid);
        app.monEntree = null;
        sauver();
      } catch { G.erreur = 'Impossible de te retirer pour l’instant. Réessaie dans un instant.'; G.etat = 'erreur'; }
      break;
    }
    default: return 'inconnu';
  }
  return 'afficher';
}
