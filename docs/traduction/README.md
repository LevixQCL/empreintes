# Traduire Ossyra (mis en place le 9 novembre 2026)

Le jeu s'écrit en français. Chaque texte affiché au joueur est entouré de `t(…)` (ou `t\`…\`` quand il contient des valeurs),
importé de `src/core/i18n.ts`. **Le texte français sert lui-même de clé** (méthode « gettext ») : il n'y a aucun identifiant
à inventer ni à tenir à jour, et le code reste lisible en français.

```ts
import { t } from '../core/i18n';
titre: t('La ligne bleue'),
texte: t`Il reste ${n} cristaux à tailler.`,   // clé : « Il reste {0} cristaux à tailler. »
```

Les traductions vivent dans `traductions/en/`, un fichier JSON par fichier source, dans l'ordre du code :

```json
{ "source": "src/core/chroniques.ts",
  "entrees": [ { "fr": "La ligne bleue", "en": "The Blue Line" }, … ] }
```

Une entrée dont `en` est vide s'affiche en français : le jeu ne casse jamais pendant que la traduction avance.

## Ce qui se passe quand on modifie un texte

1. On change la phrase française dans le code, comme d'habitude.
2. `npm run i18n` relit le code : la nouvelle phrase n'a pas de traduction, elle repasse à traduire,
   **avec l'ancienne version jointe** (`"ancien": { "fr": …, "en": … }`) pour ne retoucher que ce qui a changé.
3. On met à jour la traduction (`npm run i18n -- a-traduire <catalogue>` liste ce qui manque).

Seules les phrases modifiées sont à refaire, jamais le reste. Un texte déplacé d'un fichier à l'autre garde sa traduction.

## Les commandes

| Commande | Ce qu'elle fait |
|---|---|
| `npm run i18n` | met les catalogues à jour d'après le code, puis montre la couverture |
| `npm run i18n -- couverture` | ce qui est traduit, en mots, fichier par fichier |
| `npm run i18n -- verifier` | contrôle les valeurs `{n}`, les balises HTML et le glossaire |
| `npm run i18n -- envelopper <fichiers>` | entoure de `t(…)` les phrases d'un fichier (relire le rapport et le diff) |
| `npm run i18n -- a-traduire <catalogue> [max]` | liste numérotée des entrées vides |
| `npm run i18n -- remplir <catalogue> <lot.json>` | remplit les entrées vides, dans l'ordre, avec un tableau JSON |

## Les garde-fous (tests/i18n.test.ts, lancés au déploiement)

- Une traduction qui perd ou ajoute une valeur `{0}` ou une balise HTML bloque la publication.
- Un catalogue qui n'a pas été remis à jour après un changement de texte bloque la publication : lancer `npm run i18n`.
- Le glossaire (`traductions/glossaire.json`) fixe la traduction des termes du jeu ; `verifier` signale les écarts
  (simple remarque, sans blocage : le contexte peut justifier une exception).

## Essayer une langue

Ajouter `?langue=en` à l'adresse du jeu (le choix est retenu sur l'appareil ; `?langue=fr` pour revenir).
La langue est choisie au démarrage (`src/entree.ts`), avant le chargement du jeu, parce que les textes de lore sont traduits
au moment où leurs modules se chargent. Changer de langue recharge donc la page.

L'anglais n'est **pas proposé aux joueurs** tant qu'il n'est pas complet : il entre dans `LANGUES_PUBLIEES`
(`src/core/i18n.ts`) le jour où `couverture` affiche 100 %. Jusque-là, seuls ceux qui ajoutent `?langue=en` le voient.

## Ce qui reste à faire (état au 9 novembre 2026)

1. **Le lore** (`src/core` : Chroniques, Strates, campagne, lore des cartes et des Porteurs, fragments, familles, explorer,
   découvertes, lieux, rumeurs, fils, digue) : entouré de `t()`, ≈ 47 500 mots, traduction en cours.
2. **L'interface** (`src/ui`, `src/app`, le reste de `src/core`, ≈ 30 000 mots) : à entourer **à la main**, morceau de texte
   par morceau de texte, sans jamais englober le HTML autour (une classe CSS changée ne doit pas invalider une traduction).
   Le passage automatique ne convient pas ici. Points à traiter au même moment :
   - les mots isolés (« Forge », « Génés »…) que le passage automatique laisse de côté ;
   - les pluriels (`n > 1 ? 's' : ''`) : prévoir une petite fonction de pluriel par langue ;
   - les nombres et dates écrits à la française (`virgule`, `toLocaleString('fr-BE')`) : suivre `langue()` ;
   - le lexique (`core/lexique.ts`) : ses expressions régulières reconnaissent des mots français dans les textes,
     il lui faut une version par langue ;
   - un choix de langue dans les Paramètres ; `index.html` (titre, description) et le manifeste de l'appli.
3. Les textes déjà enregistrés dans une sauvegarde (journaux, messages) restent dans la langue où ils ont été écrits.
