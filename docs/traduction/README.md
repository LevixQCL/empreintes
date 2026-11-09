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

### Les cas particuliers

- **Entourer le texte, jamais le HTML** : `<b>${t`Niveau ${n}`}</b>`, pas `t`<b>Niveau ${n}</b>``. Une classe CSS changée
  ne doit pas invalider une traduction.
- **Jamais de code dans `t()`** : classes CSS, sélecteurs, chemins d'images, requêtes `matchMedia`, textes de débogage
  pour Bryan. `npx tsx scripts/i18n-oublis.ts` liste au contraire les textes à accent restés hors de `t()` (à relire).
- **Le code ne lit jamais un texte traduit** : pas de `titre.includes('Défaite')` ni de `/minerai/` sur une phrase affichée.
  Passer l'information par une donnée (`fin.issue`, `ligne.felure`, `reessayer`…).
- **Les accords** : une phrase dont un morceau change selon le nombre (`${n > 1 ? 's' : ''}`) garde sa valeur `{1}` ;
  la traduction écrit `{1|s}` (« s » si la valeur n'est pas vide, rien sinon) ou `{1|ies|y}` (« ies » sinon « y »).
  Quand le français change plusieurs mots (« quitte son poste » / « quittent leur poste »), écrire deux phrases entières.
- **Les listes** : `enumerer(['Ilka', 'Doran', 'Véla'])` donne « Ilka, Doran et Véla » (« and » en anglais).
- **Les nombres et les dates** : `locale()` (`fr-BE` ou `en-US`) pour `toLocaleString`, `virgule(n)` (une décimale) et
  `decimal(n)` (tel quel) pour la virgule française.
- **Un même mot, deux sens** : `t('§poids§Charge')` s'affiche « Charge » en français mais a sa propre clé (« Load »),
  distincte du geste ennemi `t('Charge')`.
- **Les noms et pronoms** : `deNom(nom)` (« de Doran », « d’Ilka », « of Doran ») et `ilElle(p)` suivent la langue.

## Ce qui se passe quand on modifie un texte

1. On change la phrase française dans le code, comme d'habitude.
2. `npm run i18n` relit le code : la nouvelle phrase n'a pas de traduction, elle repasse à traduire,
   **avec l'ancienne version jointe** (`"ancien": { "fr": …, "en": … }`) pour ne retoucher que ce qui a changé.
3. On met à jour la traduction (`npm run i18n -- a-traduire <catalogue>` liste ce qui manque).

Seules les phrases modifiées sont à refaire, jamais le reste. Un texte déplacé d'un fichier à l'autre garde sa traduction.

## Le style

On ne traduit pas mot à mot : l'anglais doit être agréable et beau à lire, fidèle au sens, au ton et aux révélations,
mais écrit comme l'aurait écrit un auteur anglophone. Voix de chaque personnage, règles et inspirations : `docs/traduction/style-en.md`.

## Les commandes

| Commande | Ce qu'elle fait |
|---|---|
| `npm run i18n` | met les catalogues à jour d'après le code, puis montre la couverture |
| `npm run i18n -- couverture` | ce qui est traduit, en mots, fichier par fichier |
| `npm run i18n -- verifier` | contrôle les valeurs `{n}`, les balises HTML et le glossaire |
| `npm run i18n -- envelopper <fichiers>` | entoure de `t(…)` les phrases d'un fichier (relire le rapport et le diff) |
| `npm run i18n -- a-traduire <catalogue> [max]` | liste numérotée des entrées vides |
| `npm run i18n -- remplir <catalogue> <lot.json>` | remplit les entrées vides : un tableau dans l'ordre, ou `{ "numéro": "texte" }` numéroté comme `a-traduire` (plus sûr) |
| `npm run i18n -- propager` | recopie une traduction déjà faite dans les entrées vides au texte identique |
| `npm run i18n -- paires <catalogue> [début] [n]` | montre français et traduction côte à côte, numérotés |
| `npm run i18n -- reviser <catalogue> <lot.json>` | réécrit les traductions citées (`{ "numéro": "texte" }`) |

## Les garde-fous (tests/i18n.test.ts, lancés au déploiement)

- Une traduction qui perd ou ajoute une valeur `{0}` ou une balise HTML bloque la publication.
- Un catalogue qui n'a pas été remis à jour après un changement de texte bloque la publication : lancer `npm run i18n`.
- Le glossaire (`traductions/glossaire.json`) fixe la traduction des termes du jeu ; `verifier` signale les écarts
  (simple remarque, sans blocage : le contexte peut justifier une exception).

## Essayer une langue

Ajouter `?langue=en` à l'adresse du jeu (le choix est retenu sur l'appareil ; `?langue=fr` pour revenir). Dès qu'on joue
dans une autre langue, ou qu'une deuxième langue est publiée, Menu › Paramètres propose « Langue · Language ».

Pour relire écran par écran : `VISUEL_LANGUE=en npm run visuel` montre le français (« avant ») à côté de l'anglais
(« après ») et écrit le texte visible de chaque écran dans `.visuel/*-texte.txt`.
La langue est choisie au démarrage (`src/entree.ts`), avant le chargement du jeu, parce que les textes de lore sont traduits
au moment où leurs modules se chargent. Changer de langue recharge donc la page.

L'anglais n'est **pas proposé aux joueurs** tant qu'il n'est pas complet : il entre dans `LANGUES_PUBLIEES`
(`src/core/i18n.ts`) le jour où `couverture` affiche 100 %. Jusque-là, seuls ceux qui ajoutent `?langue=en` le voient.

## État au 9 novembre 2026

- **Tout le jeu est traduit en anglais** (≈ 77 000 mots : lore, interface, combat, glossaire), écrans vérifiés à 390 px.
  Le français n'a pas bougé (`npm run visuel` : aucun changement visible).
- Anglais publié le 9 novembre 2026 : la langue suit celle de l’appareil (sinon l’anglais), réglable dans les Paramètres.
  `index.html` (titre « Ossyra » commun aux deux langues) et le manifeste de l'appli restent en français.
- Les textes déjà enregistrés dans une sauvegarde (journaux, récits d'expédition en cours, messages) restent dans la langue
  où ils ont été écrits : seuls les nouveaux suivent la langue choisie.
- Le prototype de duel (`src/duel/`) n'est pas traduit.
