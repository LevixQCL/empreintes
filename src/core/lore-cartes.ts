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
  souffle: 'Une vieille corne cerclée d’or, sonnée autrefois dans les salles des Hauts. Ce qui en sort quand un Résonant y souffle n’est pas de l’air. Les murs touchés restent fêlés pendant des jours.',
  apaiser: 'Une main sur l’épaule, une phrase à mi-voix : l’empreinte calme ce que la peur a déréglé. « Ce n’est pas moi qui soigne, dit Véla. C’est elle qui se souvient comment. »',
  eclat: 'Un miroir de poche des Hauts, brisé d’un seul regard. Chaque éclat renvoie plus de lumière que le précédent, à mesure que la chaîne s’allonge. Les apprentis Lecteurs s’exercent sur des miroirs de rebut, et s’éblouissent souvent.',

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
  'eclat-chant': 'Une boîte à musique remontée des Strates, qui joue une mélodie à trois notes, toujours la même. Plus on l’écoute, plus elle chante fort. Personne n’a jamais entendu la quatrième note.',
  'miroir-brume': 'Un miroir dont le tain est fait de brume figée. L’ennemi qui s’y regarde y voit quelqu’un d’autre que lui, et retient son geste, le temps de comprendre qui.',
  'encre-ancienne': 'Une encre qui ne sèche pas, tirée des parois des salles closes. Les signes qu’on trace avec ne veulent rien dire pour nous, mais ils fendent la pierre en séchant enfin.',
  'meche-or': 'La mèche d’or apparaît en une nuit, chez chaque Résonant, depuis les Sept. Certains la teignent pour qu’on les laisse tranquilles. L’empreinte, elle, ne se teint pas.',
  'plume-givre': 'Une plume tombée d’une ombre ailée, glacée au toucher même en plein été. Elle ralentit tout ce qu’elle effleure, à commencer par les mauvaises intentions.',
  'ombre-serpent': 'L’ombre d’un Résonant qui s’allonge au sol, bien plus loin que la lumière ne le permet, et s’enroule autour des chevilles de l’ennemi. Elle bouge toujours une seconde trop tôt.',
  'ombre-ailee': 'Quand ce Résonant se tient dans la lumière, des ailes immenses se déploient sur le mur derrière lui. Les Hauts y voient une noblesse. Les districts, un orage qui attend son heure.',
  pressentiment: 'Une lourdeur derrière les yeux, une envie soudaine de reculer d’un pas. C’est le don des Sept, celui qui a sauvé des villes entières : savoir avant les machines.',
  'chant-abysses': 'Une voix venue d’une mer dont personne ici n’a jamais entendu parler. Elle s’accorde à n’importe quelle Fréquence, comme si elle connaissait déjà la suite.',
  'souffle-wyrm': 'Le souffle d’un être ancien, immense, dont les Veilleurs n’ont retrouvé que l’ombre gravée dans un cristal de la Strate −9. Il grandit à chaque note, et ne s’arrête que lorsque la chaîne se tait.',

  // ---------- Les voies, étape 1 (27 octobre 2026) ----------
  // Le Moteur
  'bobine-recuperation': 'Une bobine de cuivre cousue sous l’avant-bras. Chaque coup paré lui rend un peu de courant. « Rien ne se perd chez nous, dit Liane. Surtout pas la colère des autres. »',
  condensateur: 'Un cylindre de verre où dort un éclair en réserve. Les mécaniciens des districts le portent à la ceinture, comme d’autres une gourde.',
  'decharge-arc': 'Tout ce que le cristal a gardé part d’un seul coup, dans un claquement qui fait trembler les vitres trois rues plus loin. Après, il faut tout recharger. Ça en valait la peine.',
  'eclair-captif': 'On dit qu’il a été pris dans un orage au-dessus des quais et qu’il cherche encore à rentrer chez lui. Il frappe d’autant plus fort qu’on l’a fait attendre.',
  'noyau-instable': 'Un cœur de machine des Strates, trop vieux pour être réglé, trop puissant pour être jeté. Les Brigades ont une règle à son sujet : ne jamais se tenir derrière celui qui le porte.',
  // La Carapace
  'coup-epaule': 'Doran ne frappe pas souvent. Il avance, il encaisse, et quand l’autre s’est épuisé contre lui, il donne un seul coup d’épaule. Celui-là compte.',
  'queue-massue': 'Une queue d’os et de chitine qui pousse aux Génés des quais après des années de travail dans l’eau froide. Plus on la frappe, plus elle durcit.',
  'belier-os': 'Le front s’épaissit, la nuque se soude, et tout le corps devient une porte qui avance. Les piliers des Fondations portent encore la marque de ceux qui ont appris à s’en servir.',
  'retour-maree': 'La mer recule, recule encore, et tout le monde croit qu’elle a renoncé. Puis elle revient avec tout ce qu’elle a retenu. Les Génés des quais se battent comme elle.',
  // Le Chœur
  'diapason-cristal': 'Un diapason de verre clair qu’on frappe une fois, et qui oblige toutes les empreintes autour de lui à chanter la même note. Les Résonants l’appellent « mettre la salle d’accord ».',
  'voix-basse': 'Une seule note, tenue très longtemps, si grave qu’on la sent dans les os avant de l’entendre. Seule, elle intrigue. Reprise par d’autres, elle fait céder les murs.',
  'chorale-ombres': 'Les ombres de plusieurs Résonants qui chantent ensemble, même quand leurs propriétaires se taisent. Joss dit que c’est la seule chorale qui ne fait jamais de fausse note.',
  'cloche-abysses': 'Une cloche remontée de la Strate −8, couverte de coquillages qui n’existent plus. Quand elle sonne, chaque empreinte autour d’elle répond sur le même ton.',
  'grand-unisson': 'Le quartier entier, une nuit, a chanté la même note pour veiller un des siens. Les Veilleurs l’ont accordée dans un carillon doré, dont chaque tube porte une voix. Il frappe d’autant plus fort qu’on est nombreux à le faire sonner.',

  // ---------- Les voies, étapes 2 et 3 (28 octobre 2026) ----------
  // La Traque
  flair: 'Nuit ne regarde pas l’ennemi : elle le sent. La sueur, la rouille, la peur qui remonte. « Tout ce qui vit laisse une trace, dit-elle. Même dans le noir. Surtout dans le noir. »',
  'bond-predateur': 'Un saut sans élan, sans bruit, des genoux repliés jusqu’à la gorge de la proie. Les Génés des Fondations l’ont pris aux bêtes des piliers, qui chassent toujours ce qui boite.',
  'crocs-verre': 'Des dents si fines qu’on ne les voit qu’au moment où elles se referment. Elles cherchent d’instinct la fêlure, et ne lâchent plus ce qu’elles ont commencé.',
  'chasse-aveugle': 'Les yeux fermés, l’oreille contre la roche. Quelque part, quelque chose saigne de l’empreinte. La meute de Nuit l’a déjà encerclé, et elle n’a pas eu besoin de lumière.',
  hallali: 'Le cri de fin de chasse, poussé quand la proie ne peut plus fuir. Dans les Strates, les créatures fêlées l’entendent avant qu’on l’ait crié.',
  // La Lecture
  'regard-biais': 'Ne jamais regarder une empreinte en face : elle se cache. Aurel la regarde de côté, comme on regarde une étoile pâle, et la voit trembler à l’endroit exact où elle cédera.',
  'lame-doute': 'Une lame fine, sans tranchant visible. Elle ne coupe rien de solide. Elle s’enfonce là où l’ennemi hésite déjà, et l’hésitation fait le reste.',
  'oeil-lecteur': 'L’œil des Lecteurs des salles closes, voilé de nacre. Il lit une créature comme on lit un registre : son nom, sa faute, et la page où elle se déchire.',
  verdict: 'Une seule phrase, prononcée sans colère. Ce que la Lecture a mis à nu ne se recouvre plus : le coup suivant tombe exactement là.',
  'sentence-muette': 'Les Orsève jugeaient sans un mot, d’un geste de la main. Aurel a gardé le geste et oublié le reste. « Je n’ai pas besoin de parler. Ils savent déjà ce qu’ils ont fait. »',
  // La Sève
  'pollen-ambre': 'Une poudre dorée que Kessa souffle sur les plaies. Ce qui n’a pas besoin de guérir durcit en une fine écorce, et protège encore.',
  'seve-piliers': 'La sève qui suinte des vieux piliers de bois des Fondations, tiède même en hiver. Les Nés-de-mue la boivent pour réparer leur corps, et le surplus les recouvre comme un vernis.',
  'mue-verre': 'Une peau neuve, transparente, qui pousse sous l’ancienne en une seule nuit. Quand on n’en a pas besoin, on la porte comme une armure.',
  floraison: 'Une fois par génération, le bois mort des piliers fleurit. Les Génés y voient un signe : la vie déborde, et ce qu’elle ne peut pas soigner, elle le protège.',
  // La Cadence
  'pas-chasse': 'Un pas de côté, un autre, et l’ennemi frappe l’air. Ilka danse quand elle se bat, et ne s’en rend même plus compte.',
  'lames-jumelles': 'Deux lames courtes, montées sur les avant-bras. La première ouvre, la seconde suit avant que la première ne soit revenue. Elles n’aiment pas attendre.',
  'poings-pistons': 'Des gantelets à air comprimé récupérés sur une presse de chantier. Ils frappent deux fois pour le prix d’une, dans un sifflement que tout le quartier reconnaît.',
  mitraille: 'Un chargeur de clous de charpentier, recalibré pour tirer en rafale. « C’est pas propre, admet Ilka. Mais c’est rapide, et j’en ai plein les poches. »',
  'cadence-folle': 'Le cristal s’emballe, le cœur suit, et le corps n’a plus le temps de penser. Les coursiers qui l’ont portée disent qu’on n’en garde aucun souvenir, seulement l’envie de recommencer.',

  // ---------- Les exclusives (28 octobre 2026) : des empreintes qui refusent la copie ----------
  // Une empreinte se recopie de porteur en porteur, et c'est ainsi qu'on la trouve dans tous les métaux. Certaines refusent :
  // recopiées, elles s'effacent. On ne les trouve donc qu'au rang où elles se sont arrêtées.
  'gantelet-pillard': 'Le gantelet d’un pilleur des Strates, connu pour revenir de chaque descente avec ce que les autres avaient laissé. Toute copie qu’on en tire tombe en poussière : l’empreinte n’aime pas qu’on lui prenne quoi que ce soit.',
  'machoire-miroir': 'Une mâchoire de Géné qui mord comme mordait ce qui vient de mordre. Les Veilleurs n’ont jamais réussi à la recopier : la copie mord comme l’original, et se dévore elle-même.',
  'boucle-memoire': 'Un anneau de cristal qui rejoue sans cesse la même seconde, celle du meilleur coup de son porteur. Recopié, il ne rejoue que du silence.',
  'coeur-surregime': 'Un cœur de machine monté sans frein, par un mécanicien qui voulait sauver sa sœur coincée sous un éboulis. Elle est sortie ; lui, non. Le cœur refuse depuis toute autre poitrine que celles qui acceptent d’en payer le prix.',
  'peau-ancetre': 'La peau d’un des tout premiers Génés, sortie des Berceaux bien avant la Montée. Elle n’a jamais servi à protéger : elle sert à prendre. Ce qui la frappe y laisse son armure.',
  'miroir-hauts': 'Un miroir des grandes salles des Hauts, de ceux qui renvoient les gestes avant les visages. Les Orsève en ont fait fondre toutes les copies. Celui-ci a été volé à temps.',
  'coeur-etoile': 'On ne sait pas d’où vient ce cœur, seulement qu’il brille dans le noir comme une étoile qui n’existe plus. Il demande beaucoup à son porteur, et il rend davantage. Aucun Berceau connu n’en garde la forme.',
  'seconde-naissance': 'Une vierge que ceux d’avant n’ont jamais utilisée, rangée seule dans un Berceau. Elle ne soigne pas : elle recommence. Kessa dit qu’en la touchant, on entend un premier cri.',
  'empreinte-vive': 'Une empreinte sans visage, qui prend celui de ce qu’elle touche. Les Veilleurs se demandent si elle n’imite pas, simplement, comme ceux d’avant imitaient les vivants.',
  'silence-avant': 'Le silence qui suit une catastrophe, conservé dans une vierge de nacre. Il protège, puis rend aux vivants ce qu’ils ont de meilleur, comme pour s’excuser d’être resté si longtemps seul.',

  // ---------- L’Héritage du district (27 octobre 2026) : la directrice parle, dans sa lettre ----------
  'foulee-directrice': '« Je n’ai jamais été la plus forte. J’étais toujours la première arrivée. Ces jambes-là m’ont portée à travers chaque Strate ouverte de ce district. Cours devant, directeur : les autres suivront. »',
  'bras-fonderie': '« Ce bras a coulé les premiers piliers du district, du temps où on bâtissait à la main sur l’eau. Il ne sait rien faire de délicat. Il n’en a jamais eu besoin. »',
  'coeur-glaciere': '« Un cœur dessiné par la Glacière elle-même, avant qu’on comprenne ce qu’elle était. Il garde tout, et rend tout d’un coup. Ne le laisse jamais s’éteindre. »',
  'carapace-fondations': '« Cette carapace a tenu une nuit entière devant la porte de l’ascenseur, pendant la grande crue. Personne n’est passé. Elle se souvient de chaque coup, et les rend. »',
  'oeil-grande-nuit': '« La nuit où les lumières du district se sont éteintes, quelqu’un voyait encore. Cet œil-là. Il trouve la faille, et il ne la quitte plus. »',
  'premiere-mue': '« La toute première mue d’un Géné, gardée comme un trésor par sa famille, puis par moi. Elle rappelle au corps qu’il sait se refaire. À tous les corps autour. »',
  'lanterne-lecture': '« La lanterne de la première Lectrice du district. Elle éclaire toujours la marche suivante, jamais plus loin : c’est assez pour monter un escalier entier. »',
  'sceau-orseve': '« Je l’ai pris dans le bureau d’Isaure Orsève, le jour où elle a signé la fermeture de nos Berceaux. Il lit les fautes de ceux qui le regardent. Elle ne l’a jamais réclamé. »',
  'voix-quartier': '« Le soir où on a appris la fermeture des Berceaux, le quartier entier est sorti chanter sous la Tour. Une seule note, des heures. Je l’ai gardée. Elle reprend toutes les voix qu’on lui donne. »',
};

/** Le lore d'une carte (« jambes-ressort@or » → celui de « jambes-ressort ») */
export const loreCarte = (cle: string): string | null => LORE_CARTES[cle.split('@')[0]!] ?? null;

/**
 * Le rang d'une empreinte selon son métal (Bible, 23 octobre 2026 : « le métal dit le rang »). Une carte de fer est une
 * copie lointaine d'une compétence, une carte de nacre en est la vierge : jamais portée par un humain, tirée d'un Berceau.
 * C'est pourquoi on trouve une carte directement dans son métal, et les métaux rares plus bas, où l'on a moins copié.
 */
export const RANG_METAL: Record<import('./types').Rarete, { rang: string; texte: string }> = {
  fer: { rang: 'Copie lointaine', texte: 'Recopiée tant de fois que le geste a perdu ses détails. Il en reste l’essentiel, et c’est déjà beaucoup.' },
  cuivre: { rang: 'Copie de copie', texte: 'Passée par plusieurs porteurs : chacun en a perdu un peu, chacun en a inventé un peu.' },
  argent: { rang: 'Copie de famille', texte: 'Relevée à la mort de son porteur et transmise avec soin. Elle se souvient encore de ses deux derniers visages.' },
  or: { rang: 'Première copie', texte: 'Un seul passage la sépare de l’original. Les Hauts en gardent beaucoup, et les districts presque aucune.' },
  nacre: { rang: 'Vierge', texte: 'Jamais portée par un humain. Elle sort d’un Berceau telle que ceux d’avant l’ont rangée.' },
};
