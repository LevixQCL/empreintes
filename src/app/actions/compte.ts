// Actions du compte : connexion, déconnexion, partie de secours.

import { app, compteEtat } from '../etat';
import { actionCompte, champ, envoyer, majSecours, restaurerSecours, supprimerCompte } from '../synchro';
import { noterAge } from '../../save/age';
import type { Clic, Suite } from './commun';
import { t } from '../../core/i18n';

export async function agirCompte(a: string, _c: Clic): Promise<Suite> {
  switch (a) {
    case 'compte': compteEtat.ouvert = !compteEtat.ouvert; compteEtat.erreur = ''; compteEtat.info = ''; if (compteEtat.ouvert) { majSecours(); envoyer(); } break;
    case 'secours': if (compteEtat.secours) compteEtat.secours.confirmer = true; break;
    case 'secours-confirmer': restaurerSecours(); break;
    case 'google': noterAge('majeur'); compteEtat.age = 'majeur'; await actionCompte(() => app.compte!.connexionGoogle()); return 'fin';
    case 'connexion': noterAge('majeur'); compteEtat.age = 'majeur'; await actionCompte(() => app.compte!.connexionEmail(champ('email'), champ('mdp'), false)); return 'fin';
    case 'inscription': noterAge('majeur'); compteEtat.age = 'majeur'; await actionCompte(() => app.compte!.connexionEmail(champ('email'), champ('mdp'), true)); return 'fin';
    case 'oubli': await actionCompte(async () => { await app.compte!.motDePasseOublie(champ('email')); compteEtat.info = t('E-mail de réinitialisation envoyé.'); }); return 'fin';
    case 'deconnexion': await actionCompte(() => app.compte!.deconnexion()); return 'fin';
    // supprimer son compte et ses données (8 novembre 2026) : deux touches, puis tout est effacé et le jeu repart de zéro
    case 'supprimer': compteEtat.supprimer = 1; break;
    case 'supprimer-annuler': compteEtat.supprimer = 0; break;
    case 'supprimer-confirmer': await supprimerCompte(); return 'fin';
    case 'age-majeur': noterAge('majeur'); compteEtat.age = 'majeur'; break;
    default: return 'inconnu';
  }
  return 'afficher';
}
