// Le petit lore de chaque carte, affiché dans sa fiche (Cartes → toucher une carte).
// Même monde que les Chroniques et les Archives : Vertiga, les Fondations, les Strates, le Graveur, les trois lignées.
// Une à trois phrases, souvent une parole rapportée. Aucun pays, personne ou conflit réel ; rien de gore ni de religieux.

export const LORE_CARTES: Record<string, string> = {
  // ---------- Augmentés : cartes de base ----------
  ruee: 'Les coursiers de Vertiga ne courent pas autour des obstacles : ils passent au travers. « Le plus court chemin, c’est celui que personne n’a encore osé », dit Ilka, qui en a cassé trois rambardes.',
  bond: 'Une passerelle s’effondre, un toit s’arrête net au-dessus du vide : les jambes gravées trouvent toujours un appui de plus. Le saut d’après est déjà calculé avant l’atterrissage.',
  esquive: 'Le cœur de cristal voit le coup partir une fraction de seconde avant l’œil. Il ne reste au corps qu’à suivre. Les Augmentés appellent ça « laisser passer le facteur ».',
  tir: 'Un clou de chantier, un rail aimanté, et un poignet qui ne tremble jamais. Les premiers tireurs des districts étaient des soudeurs qui en avaient assez qu’on leur prenne leurs outils.',
  'tir-vif': 'Tirer avant d’avoir fini de viser. Le cristal fait le reste, et rend un peu d’élan au passage, comme une pièce qu’on récupère dans la monnaie.',

  // ---------- Génés : cartes de base ----------
  morsure: 'Les mâchoires des Génés des Fondations ont été dessinées pour broyer la coque des moules géantes. Ce qu’elles arrachent à l’ennemi, le corps le garde pour lui.',
  carapace: 'La chitine pousse là où le coup est le plus souvent tombé. Doran a l’épaule gauche d’un scarabée : « Trente ans de poutres. Elle a appris toute seule. »',
  regenerer: 'Une cicatrice de Géné se referme en une nuit, au prix d’une faim de trois jours. Dans les Fondations, on soigne une escouade à grands bols de soupe d’algues.',
  charge: 'Avancer tête baissée sous un plafond qui s’écroule, c’est un métier. Les Génés des chantiers le font sans y penser, et ce qu’ils heurtent garde une fêlure.',
  grogner: 'Un son grave, venu de la poitrine, que les oreilles humaines sentent plus qu’elles ne l’entendent. Les bêtes des Strates hésitent. Les contremaîtres aussi.',

  // ---------- Résonants : cartes de base ----------
  murmure: 'Le Résonant ne parle pas à l’ennemi : il parle à l’empreinte qui l’habite. Quelques mots dans une langue que personne n’a jamais apprise, et le bras levé retombe.',
  echo: 'Une Fréquence s’accorde toujours à celle qui la précède, comme une voix qui reprend la note d’une autre. Les Veilleurs pensent que c’est ainsi que les anciens se parlaient.',
  souffle: 'L’ombre derrière le Résonant inspire, puis expire. Ce qui en sort n’est pas de l’air. Les murs touchés restent tièdes pendant des jours.',
  apaiser: 'Une main sur l’épaule, une phrase à mi-voix : l’empreinte calme ce que la peur a déréglé. « Ce n’est pas moi qui soigne, dit Véla. C’est elle qui se souvient comment. »',
  eclat: 'Un fragment de cristal qui brille de plus en plus fort à mesure que la chaîne s’allonge. Les apprentis Lecteurs s’exercent sur des éclats de rebut, et s’éblouissent souvent.',

  // ---------- Augmentés ----------
  'jambes-ressort': 'Le premier modèle sorti des ateliers des districts, bien avant les implants de luxe des Hauts. Bruyant, increvable, réparable avec une clé de 12. Ilka refuse de changer les siennes.',
  'gant-arc': 'Un gant d’électricien dont on a oublié de retirer le cristal. L’arc qui en jaillit recharge le gant à chaque décharge, et brûle volontiers les sourcils de son porteur.',
  'oeil-relais': 'L’œil gravé ne voit pas mieux : il voit ailleurs. Il relaie ce que voit un autre œil, à trois couloirs de là. Trouvé dans la chambre scellée, encore réglé sur un porteur disparu.',
  'grappin-cable': 'Entre deux tours de Vertiga, il y a toujours un câble. Le grappin des coursiers en trouve un dans le noir, s’y accroche, et tire l’escouade hors de portée.',
  'coeur-turbine': 'Un cœur de cristal monté sur une petite turbine qui ne s’arrête jamais. Son porteur ne dort plus que quatre heures par nuit, et se plaint du bruit quand tout est calme.',
  'oeil-brouilleur': 'Les tout premiers implants des Augmentés servaient à cela : rendre une pensée illisible pour les Résonants. L’œil-brouilleur trouble aussi la visée de tout ce qui regarde trop fixement.',
  'bras-grue': 'Gravé d’après le geste d’un grutier des Fondations qui n’a jamais raté une charge en quarante ans. Le bras soulève une poutre d’une main ; il sait aussi la lancer.',
  dorsale: 'Une colonne de laiton et de cristal fixée le long du dos. Elle tient le corps droit sous les éboulis, et donne envie d’avancer quand tout invite à reculer.',
  'lames-orbitales': 'Trois lames qui tournent autour de leur porteur, guidées par un cristal à la mémoire d’un maître d’armes oublié. Plus le combat dure, plus elles accélèrent.',
  'coeur-reprise': 'On l’appelle ainsi parce qu’il repart quand on le croyait éteint. Les médecins des districts le greffent aux sauveteurs. Ceux qui en portent un ne parlent jamais de leur premier arrêt.',

  // ---------- Génés ----------
  'glande-ambre': 'Une glande qui sécrète une ambre tiède, empruntée à certains arbres de l’ancien monde. Étalée sur une plaie, elle durcit, protège, puis se dissout quand la peau est neuve.',
  'crocs-fossiles': 'Des dents retrouvées dans la roche des premières Strates, plus vieilles que la mer. Le Graveur en a tiré une forme ; les Génés en ont fait des mâchoires.',
  'cuir-recif': 'Une peau épaisse et rugueuse, née des coraux que la Montée a engloutis. Elle aime l’eau froide et déteste le soleil. Les Génés qui en portent vivent la nuit.',
  'yeux-nocturnes': 'Des yeux de chouette dorés, qui boivent la moindre lueur. Ils repèrent la fissure dans l’armure d’un ennemi comme ils repèrent la fissure dans un mur des Fondations.',
  'poumons-abysse': 'Des poumons qui tiennent vingt minutes sous l’eau trouble des Fondations. Les plongeurs des égouts les ont demandés les premiers ; les sauveteurs ont suivi.',
  branchies: 'Deux fentes discrètes sous les côtes, héritées des poissons des bassins de pilotis. Ceux qui en portent ne craignent plus la Montée. Ils craignent la sécheresse.',
  'carapace-mere': 'Une carapace si large qu’elle protège aussi ceux qui se tiennent derrière. Dans les Fondations, on dit d’un Géné qui en porte une qu’il « fait l’abri ».',
  'sang-ambre': 'Un sang épais, doré, qui coagule en une seconde et en partage un peu avec les autres. Les Génés le disent gravé d’après une bête des Strates qui ne mourait jamais seule.',
  'coeur-meute': 'Un cœur qui bat plus fort quand l’escouade est proche. Il prend la force de l’ennemi et la redistribue, comme une louve partage sa chasse. On ne le greffe qu’à ceux qui ne travaillent jamais seuls.',
  'mue-totale': 'Une fois dans sa vie, le Géné qui la porte quitte tout son corps abîmé, comme un crabe sa carapace. Il en sort neuf, affamé, et un peu étranger à lui-même.',

  // ---------- Résonants ----------
  'eclat-chant': 'Un cristal qui fredonne une mélodie à trois notes, toujours la même, depuis qu’on l’a sorti des Strates. Plus on l’écoute, plus il chante fort. Personne n’a jamais entendu la quatrième note.',
  'miroir-brume': 'Un miroir dont le tain est fait de brume figée. L’ennemi qui s’y regarde y voit quelqu’un d’autre que lui, et retient son geste, le temps de comprendre qui.',
  'encre-ancienne': 'Une encre qui ne sèche pas, tirée des parois des salles closes. Les signes qu’on trace avec ne veulent rien dire pour nous, mais ils fendent la pierre en séchant enfin.',
  'meche-or': 'La mèche d’or apparaît en une nuit, chez chaque Résonant, depuis les Sept. Certains la teignent pour qu’on les laisse tranquilles. L’empreinte, elle, ne se teint pas.',
  'plume-givre': 'Une plume tombée d’une ombre ailée, glacée au toucher même en plein été. Elle ralentit tout ce qu’elle effleure, à commencer par les mauvaises intentions.',
  'ombre-serpent': 'L’ombre d’un Résonant qui s’allonge au sol, bien plus loin que la lumière ne le permet, et s’enroule autour des chevilles de l’ennemi. Elle bouge toujours une seconde trop tôt.',
  'ombre-ailee': 'Quand ce Résonant se tient dans la lumière, des ailes immenses se déploient sur le mur derrière lui. Les Hauts y voient une noblesse. Les districts, un orage qui attend son heure.',
  pressentiment: 'Une lourdeur derrière les yeux, une envie soudaine de reculer d’un pas. C’est le don des Sept, celui qui a sauvé des villes entières : savoir avant les machines.',
  'chant-abysses': 'Une voix venue d’une mer dont personne ici n’a jamais entendu parler. Elle s’accorde à n’importe quelle Fréquence, comme si elle connaissait déjà la suite.',
  'souffle-wyrm': 'Le souffle d’un être ancien, immense, dont les Veilleurs n’ont retrouvé que l’ombre gravée dans un cristal de la Strate −9. Il grandit à chaque note, et ne s’arrête que lorsque la chaîne se tait.',
};

/** Le lore d'une carte (« jambes-ressort@or » → celui de « jambes-ressort ») */
export const loreCarte = (cle: string): string | null => LORE_CARTES[cle.split('@')[0]!] ?? null;
