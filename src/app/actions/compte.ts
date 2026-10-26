// Actions du compte : connexion, déconnexion, partie de secours.

import { app, compteEtat } from '../etat';
import { actionCompte, champ, envoyer, majSecours, restaurerSecours } from '../synchro';
import type { Clic, Suite } from './commun';

export async function agirCompte(a: string, _c: Clic): Promise<Suite> {
  switch (a) {
    case 'compte': compteEtat.ouvert = !compteEtat.ouvert; compteEtat.erreur = ''; compteEtat.info = ''; if (compteEtat.ouvert) { majSecours(); envoyer(); } break;
    case 'secours': if (compteEtat.secours) compteEtat.secours.confirmer = true; break;
    case 'secours-confirmer': restaurerSecours(); break;
    case 'google': await actionCompte(() => app.compte!.connexionGoogle()); return 'fin';
    case 'connexion': await actionCompte(() => app.compte!.connexionEmail(champ('email'), champ('mdp'), false)); return 'fin';
    case 'inscription': await actionCompte(() => app.compte!.connexionEmail(champ('email'), champ('mdp'), true)); return 'fin';
    case 'oubli': await actionCompte(async () => { await app.compte!.motDePasseOublie(champ('email')); compteEtat.info = 'E-mail de réinitialisation envoyé.'; }); return 'fin';
    case 'deconnexion': await actionCompte(() => app.compte!.deconnexion()); return 'fin';
    default: return 'inconnu';
  }
  return 'afficher';
}
