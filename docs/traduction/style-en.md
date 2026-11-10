# Ossyra in English — style guide (9 November 2026)

Bryan's rule: **never a word-for-word copy of the French.** The English must be pleasant and beautiful to read in its own right,
consistent with the French (same facts, same tone, same reveals), but written the way an English-language author would have written it.
Same meaning, same intention, same effect on the reader — not the same words.

## General rules

- **Translate the intention, not the sentence.** Change the structure, merge or split sentences, swap an image for an English one
  if it hits harder. Never add a fact or a reveal, never remove one (the lore has fixed rules: see `traductions/glossaire.json`).
- **Rhythm first.** Read it aloud. English likes short, concrete, strong verbs; the French likes nouns and commas.
  « C'est ce que… qui… », « Il y a… qui… », « Ce n'est pas X, c'est Y » get rebuilt every time, not copied.
- **Contractions in speech** (don't, it's, we'll), almost never in Ysé's letters (she writes, she doesn't talk).
- **English idioms over French ones**: « avoir les pieds mouillés » stays because it is lore, but ordinary phrases become
  natural English (« faire les cent pas » → *pace*, « prendre sur soi » → *bite your tongue*).
- **Typography**: curly quotes “ ”, apostrophe ’, em dash without spaces is avoided (the game uses colons and commas like the French).
- **The glossary is law** for game terms (Strata, Bearers, Spliced, Shards, Flaw, Heights, Spire…). Everything else is free.

## Voices

| Who | In French | In English |
|---|---|---|
| **Ysé** (Chronicles) | old archivist, tender, wry, a little guilty | Long letter to a young person. Warm, unhurried, precise; plain words, strong endings. A touch of Ursula K. Le Guin's essays and the memoir voice of *Station Eleven*. Never solemn: her irony is quiet. |
| **Ilka** | courier, fast, joking | Quick, slangy, cheeky, cuts corners in her sentences. Jokes when it hurts. |
| **Doran** | Spliced docker, gruff | Few words, short sentences, working-class plainness. Says the important thing last. |
| **Véla** | Resonant reader, calm | Gentle, attentive, sensory. Speaks of what she *feels*, never melodramatic. |
| **Sasha** | mechanic | Practical, numbers, dry humour. Talks to machines like people. |
| **Nuit** | Spliced scout, sees in the dark | Terse, observant, almost no adjectives. |
| **Aurel** | runaway heir | Educated, self-mocking, elegant sentences that undercut themselves. |
| **Liane** | the Refused | Sharp, controlled, bitter dignity. Short barbs. |
| **Kessa** | Moltborn diver | Direct, proud, a bit defiant. |
| **Joss** | the dyer | Cheerful, warm, neighbourhood gossip. |
| **Hald** | Brigades captain | Military clipped register, formal, then human in spite of herself. |
| **Isaure** | head of House Orsève | Cold, courteous, faintly wrong (her copies are drifting): repetitions, too-perfect politeness. |
| **The Icehouse** | AI from 2029 | Polite, careful, slightly old-fashioned assistant speech; sad without saying so. |
| **The ancient tables** | those who came before | Spare, liturgical, timeless. No contractions. |

## Inspirations (tone, not text)

- Lore: Le Guin, *Station Eleven* (Emily St. John Mandel), *The Drowned World* for the drowned cities, Jeff VanderMeer for the strange.
- Game writing: *Hades* and *Disco Elysium* for short barks with character; *Slay the Spire* / *Inscryption* for card flavour text
  (one image, one twist, a single sentence that lands).
- Card flavour text: aim for one or two sentences, ending on the line that stays with you.

## Interface vocabulary (decided 9 November 2026)

Beyond `traductions/glossaire.json`, keep these consistent across the UI:

| French | English | | French | English |
|---|---|---|---|---|
| chaîne (the cards laid this turn) | chain | | place (de la chaîne) | slot |
| suite (Frequencies that follow) | run | | salle (gameplay) / chambre scellée | room / sealed chamber |
| écluse (du district) | sluice | | parrain / parrainage | sponsor / sponsorship |
| Charge (poids) | Load | | Râtelier | Rack |
| colis / Ravitaillement | parcel / supplies | | Butin de la semaine | weekly loot |
| palier | tier | | cran (du Butin) | notch |
| fouille / filon | dig / seam | | barque / gabare | boat / barge |
| Épreuve / Fêlée | Trial / Flawed | | jeton de pillage | raid token |
| quai gravé / gage | engraved quay / stipend | | Sièges | Seats |
| batardeau / flanc de la digue | cofferdam / Dike slope | | doublon | duplicate (a spare, for trades) |
| Cales / Cœur (d'une ruine) | Holds / Heart | | Grand Tableau / Joutes | Great Board / Jousts |
| tailler (le minerai) | cut | | métaux | iron, copper, silver, gold, nacre |

Card effects: Piercing, Siphon, Overcharge, Unsettle (Unsettled), Fissure (fissured), Momentum, Crescendo, Accord, Wave,
Rampart, Riposte, Discharge, Tuning Fork, Unison, Pounce, Reading, Rift, Flurry, Overflow, Seize, Recall, Plan, Breach,
Rescue, Overvolt, Imprint, Second Wind, Dampen, Primer, Servo, Counterpoint, Finisher, Tenacity.
Masterstrokes: Unleashed (Augmented), Rally (Spliced), Active Shadow (Resonants).
Two words that must stay apart (proofread of 10 November 2026): Exécution = Finisher (the effect that fells a weakened
enemy), Finisseur = Closer (the Augmented bonus for ending a run). “Chain full: run of 2” only reads right if chain and
run never swap. Hints never write “a” before a Frequency number (“a 8”): use “one 8”.
UI register: second person, short imperative labels (“Go down”, “Claim”), sentence case, contractions allowed.
