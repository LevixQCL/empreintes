# Le duel en temps réel

3 novembre 2026, demande de Bryan : coder toute la partie duel, **sans la brancher au jeu**, pour qu'elle soit prête le jour où on la veut.
Idée d'origine (29 octobre 2026) : un lieu social pour des duels en temps réel entre joueurs, éventuellement en pariant une carte.

## Où ça vit

| Fichier | Rôle |
|---|---|
| `src/core/duel.ts` | Le moteur (sans navigateur) : création, composer sa chaîne, résolution simultanée, robot de duel, mise |
| `src/core/duel-escouade.ts` | L'escouade active d'une partie, prête pour le duel |
| `src/duel/session.ts` | Une partie côté joueur : état commun, brouillon, chrono, transport (robot ou en ligne) |
| `src/duel/en-ligne.ts` | Le transport en ligne : sceau, révélation, vérification |
| `src/net/duel.ts` | Firestore : salons à code, choix de chaque tour |
| `src/ui/duel.ts`, `src/ui/duel.css` | L'écran du duel et le salon |
| `duel.html`, `src/duel/main.ts` | La page d'essai (aucun lien depuis le jeu) : `…/empreintes/duel.html` |
| `tests/duel.test.ts` | Les règles, la rejouabilité, la durée au robot |

Rien dans le jeu n'importe ces fichiers. `duel.css` n'est pas dans `feuilles.ts`.

## Les règles

- Chaque directeur vient avec **son escouade active** (3 Porteurs, leurs cartes à leur niveau, PV pleins sans l'Usure). Pas de cartes du district.
- **Un tour = 30 s** (`DUEL.chrono`). Chacun compose sa chaîne en secret (mêmes places, Flux, Fréquences que dans les Strates), vise un Porteur adverse,
  choisit qui soigner, puis verrouille. Le chrono tombé verrouille la chaîne telle qu'elle est.
- **Les deux chaînes se résolvent ensemble**, dans cet ordre : boucliers → Brèche et Rapt → coups (calculés sur l'état du début des coups :
  un Porteur qui tombe frappe quand même ce tour-ci) → soins et Relève → ce qui vaut pour le tour suivant.
- Mêmes calculs que les Strates : Résonance, Écho, Finisseur, triangle des lignées (selon la lignée du Porteur visé), cartes éteintes, Flux.
- **Versions duel** des effets qui visaient l'intention d'un ennemi :
  Désarmer et Sourdine valent pour la chaîne adverse du tour suivant ; Fissure vaut pour la suite de sa chaîne et tout le tour suivant ;
  Lecture montre, au tour suivant, le *genre* de la chaîne verrouillée par l'adversaire (attaques, boucliers, soins), jamais la force ni la cible ;
  Faille gagne sa force quand on lit l'adversaire. La Fêlure n'existe pas en duel.
- Victoire : toute l'escouade adverse à terre. Si les deux tombent au même tour, gagne celui qui a frappé le plus fort ce tour-là.
- Usure du duel dès le tour 10 (+15 % de coups par tour, −10 % de soins) ; au tour 30, le duel se décide aux PV restants.
- Le dernier Porteur debout encaisse un peu moins (×0,85).

### Équilibre mesuré (robot contre robot, escouades de départ)

| PV en duel | Tours (moyenne) | Égalités |
|---|---|---|
| ×1,6 les PV du district | 12 | 12 % |
| **×1,3 (retenu)** | **10 (8 à 13)**, soit 3 à 5 min | 0 % avec le départage au dernier tour |

## En ligne

1. L'hôte crée un salon : `duels/{code}` (code de 6 caractères, sans 0/O/1/I/L), son escouade, une graine.
2. L'ami rejoint avec le code (transaction : une seule place). Le duel commence à `debut`.
3. Chaque tour, chacun écrit `duels/{code}/choix/{tour}-{camp}` en deux temps : **le sceau** (SHA-256 de son choix et d'un sel), puis,
   quand les deux sceaux sont posés, **le choix** et le sel. L'autre vérifie le sceau : personne ne peut lire la chaîne adverse avant de verrouiller.
4. Les deux rejouent les deux choix sur le même état : même graine + mêmes choix = même duel (testé).
5. Adversaire silencieux 45 s après le chrono : « Réclamer la victoire ». Abandon : deux touchers sur « Abandonner ».

**Limite connue** : la main et la pioche adverses sont dans l'état de chaque client (un tricheur pourrait les lire). Le jour du classement
des Joutes, une Cloud Function rejoue les choix (le moteur n'utilise pas le navigateur) et pioche à la place des clients.

### Règles Firestore à ajouter (pas encore publiées)

À coller dans `firestore.rules` avant `match /{document=**}`, puis à publier dans la console Firebase (projet `empreintes-8e82d`) :

```
    // Le duel en temps réel (docs/duel.md) : le code du salon fait office de secret
    match /duels/{code} {
      allow get: if request.auth != null;
      allow create: if request.auth != null
        && request.resource.data.hote.uid == request.auth.uid
        && request.resource.data.etat == 'attente'
        && code.size() == 6;
      // rejoindre (une seule fois), puis finir ou abandonner : seulement les deux joueurs
      allow update: if request.auth != null && (
        (resource.data.etat == 'attente' && !('invite' in resource.data)
          && request.resource.data.invite.uid == request.auth.uid
          && request.resource.data.diff(resource.data).affectedKeys().hasOnly(['invite', 'etat', 'debut', 'maj']))
        || ((resource.data.hote.uid == request.auth.uid || resource.data.invite.uid == request.auth.uid)
          && request.resource.data.diff(resource.data).affectedKeys().hasOnly(['etat', 'gagnant', 'abandon', 'maj'])));
      match /choix/{id} {
        allow read: if request.auth != null
          && request.auth.uid in [get(/databases/$(database)/documents/duels/$(code)).data.hote.uid,
                                  get(/databases/$(database)/documents/duels/$(code)).data.invite.uid];
        allow create: if request.auth != null && request.resource.data.uid == request.auth.uid
          && request.resource.data.keys().hasOnly(['uid', 'tour', 'camp', 'sceau', 'le'])
          && id == string(request.resource.data.tour) + '-' + string(request.resource.data.camp);
        // révéler : seulement son choix, une seule fois, sans toucher au sceau
        allow update: if request.auth != null && resource.data.uid == request.auth.uid
          && !('choix' in resource.data)
          && request.resource.data.diff(resource.data).affectedKeys().hasOnly(['choix', 'sel']);
      }
    }
```

## Le jour du branchement

- Un onglet ou un bâtiment « Joutes » (classement `joutes` déjà prévu, grisé, dans `core/classements.ts`).
- Ouvrir le salon depuis l'escouade active (`escouadeDuelDe`), et `duel.css` dans `feuilles.ts`.
- La mise : `regleMise` dit qui gagne quelle carte ; reste à la retirer et l'ajouter aux collections (doublons, niveau) et à décider
  des limites (même métal au plus, jamais une carte d'Héritage). Toujours sans hasard payant.
- Les Marques des Porteurs ne jouent pas encore en duel.
- Animations : `SessionDuel.derniers` donne, dans l'ordre, chaque bouclier, coup, soin et Porteur à terre du tour résolu.
