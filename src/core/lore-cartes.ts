// Le petit lore de chaque carte, affiché dans sa fiche (Cartes → toucher une carte).
// Même monde que les Chroniques et les Archives : Vertiga, les Fondations, les Strates, le Graveur, les trois lignées.
// Une à trois phrases, souvent une parole rapportée. Aucun pays, personne ou conflit réel ; rien de gore ni de religieux.

import { t } from './i18n';

export const LORE_CARTES: Record<string, string> = {
  // ---------- Augmentés : cartes de base ----------
  ruee: t('Les coursiers de Vertiga ne courent pas autour des obstacles : ils passent au travers. « Le plus court chemin, c’est celui que personne n’a encore osé », dit Ilka, qui a cassé trois rambardes.'),
  bond: t('Une passerelle s’effondre, un toit s’arrête net au-dessus du vide : les jambes gravées trouvent toujours un appui de plus. Le saut d’après est déjà calculé avant l’atterrissage.'),
  esquive: t('Le cœur de cristal voit le coup partir une fraction de seconde avant l’œil. Il ne reste au corps qu’à suivre. Les Augmentés appellent ça « laisser passer le facteur ».'),
  tir: t('Un clou de chantier, un rail aimanté, et un poignet qui ne tremble jamais. Les premiers tireurs des districts étaient des soudeurs qui en avaient assez qu’on leur prenne leurs outils.'),
  'tir-vif': t('Tirer avant d’avoir fini de viser. Le cristal fait le reste, et rend un peu d’élan au passage, comme une pièce qu’on récupère dans la monnaie.'),

  // ---------- Génés : cartes de base ----------
  morsure: t('Les mâchoires des Génés des Fondations ont été dessinées pour broyer la coque des moules géantes. Ce qu’elles arrachent à l’ennemi, le corps le garde pour lui.'),
  carapace: t('La chitine pousse là où le coup est le plus souvent tombé. Doran a l’épaule gauche d’un scarabée : « Vingt-sept ans de poutres. Elle a appris toute seule. »'),
  regenerer: t('Une cicatrice de Géné se referme en une nuit, au prix d’une faim de trois jours. Dans les Fondations, on soigne une escouade à grands bols de soupe d’algues.'),
  charge: t('Avancer tête baissée sous un plafond qui s’écroule, c’est un métier. Les Génés des chantiers le font sans y penser, et ce qu’ils heurtent garde une fêlure.'),
  grogner: t('Un son grave, venu de la poitrine, que les oreilles humaines sentent plus qu’elles ne l’entendent. Les bêtes des Strates hésitent. Les contremaîtres aussi.'),

  // ---------- Résonants : cartes de base ----------
  murmure: t('Le Résonant ne parle pas à l’ennemi : il parle à l’empreinte qui l’habite. Quelques mots dans une langue que personne n’a jamais apprise, et le bras levé retombe.'),
  echo: t('Une Fréquence s’accorde toujours à celle qui la précède, comme une voix qui reprend la note d’une autre. Les Veilleurs pensent que c’est ainsi que les anciens se parlaient.'),
  souffle: t('Une vieille corne cerclée d’or, sonnée autrefois dans les salles des Hauts. Ce qui en sort quand un Résonant y souffle n’est pas de l’air. Les murs touchés restent fêlés pendant des jours.'),
  apaiser: t('Une main sur l’épaule, une phrase à mi-voix : l’empreinte calme ce que la peur a déréglé. « Ce n’est pas moi qui soigne, dit Véla. C’est elle qui se souvient comment. »'),
  eclat: t('Un miroir de poche des Hauts, brisé d’un seul regard. Chaque éclat renvoie plus de lumière que le précédent, à mesure que la chaîne s’allonge. Les apprentis Lecteurs s’exercent sur des miroirs de rebut, et s’éblouissent souvent.'),

  // ---------- Augmentés ----------
  'jambes-ressort': t('Le premier modèle sorti des ateliers des districts, bien avant les implants de luxe des Hauts. Bruyant, increvable, réparable avec une clé de 12. Ilka refuse de changer les siennes.'),
  'gant-arc': t('Un gant d’électricien dont on a oublié de retirer le cristal. L’arc qui en jaillit grossit à chaque coup de la chaîne, et brûle volontiers les sourcils de son porteur.'),
  'oeil-relais': t('L’œil gravé ne voit pas mieux : il voit ailleurs. Il relaie ce que voit un autre œil, à trois couloirs de là, et repère toujours celui qui saigne déjà. Trouvé dans la chambre scellée, encore réglé sur un porteur disparu.'),
  'grappin-cable': t('Entre deux tours de Vertiga, il y a toujours un câble. Le grappin des coursiers en trouve un dans le noir, s’y accroche, et lance celui qui suit droit sur sa cible.'),
  'coeur-turbine': t('Un cœur de cristal monté sur une petite turbine qui ne s’arrête jamais. Son porteur ne dort plus que quatre heures par nuit, et se plaint du bruit quand tout est calme.'),
  'oeil-brouilleur': t('Les tout premiers implants des Augmentés servaient à cela : rendre une pensée illisible pour les Résonants. L’œil-brouilleur trouble aussi la visée de tout ce qui regarde trop fixement.'),
  'bras-grue': t('Gravé d’après le geste d’un grutier des Fondations qui n’a jamais raté une charge en quarante ans. Le bras soulève une poutre d’une main ; il sait aussi la lancer.'),
  dorsale: t('Une colonne de laiton et de cristal fixée le long du dos. Elle tient le corps droit sous les éboulis, et donne envie d’avancer quand tout invite à reculer.'),
  'lames-orbitales': t('Trois lames qui tournent autour de leur porteur, guidées par un cristal à la mémoire d’un maître d’armes oublié. Plus le combat dure, plus elles accélèrent.'),
  'coeur-reprise': t('On l’appelle ainsi parce qu’il repart quand on le croyait éteint. Les médecins des districts le greffent aux sauveteurs. Ceux qui en portent un ne parlent jamais de leur premier arrêt.'),

  // ---------- Génés ----------
  'glande-ambre': t('Le cristal garde le geste d’une soigneuse des bas-fonds, qui étalait de l’ambre tiède sur les plaies. Doran le tient au harnais, contre la poitrine : il n’a jamais voulu d’une troisième souche. « Deux, c’est assez pour un seul corps. »'),
  'crocs-fossiles': t('Des dents retrouvées dans la roche des premières Strates, plus vieilles que la mer. Le Graveur en a tiré une forme ; les Génés en ont fait des mâchoires qui happent l’arme avant le coup.'),
  'cuir-recif': t('Une peau épaisse et rugueuse, née des coraux que la mer a engloutis. Elle aime l’eau froide et déteste le soleil. Les Génés qui en portent vivent la nuit. Elle se referme plus dure autour des camarades tombés.'),
  'yeux-nocturnes': t('Des yeux de chouette dorés, qui boivent la moindre lueur. Ils repèrent la fissure dans l’armure d’un ennemi comme ils repèrent la fissure dans un mur des Fondations.'),
  'poumons-abysse': t('Des poumons qui tiennent vingt minutes sous l’eau trouble des Fondations. Les plongeurs des égouts les ont demandés les premiers ; les sauveteurs ont suivi.'),
  branchies: t('Deux fentes discrètes sous les côtes, héritées des poissons des bassins de pilotis. Ceux qui en portent ne craignent plus la mer. Ils craignent la sécheresse. Quand l’un d’eux reprend son souffle, toute l’escouade respire mieux.'),
  'carapace-mere': t('Une carapace si large qu’elle protège aussi ceux qui se tiennent derrière. Dans les Fondations, on dit d’un Géné qui en porte une qu’il « fait l’abri ».'),
  'sang-ambre': t('Un sang épais, doré, qui coagule en une seconde et en partage un peu avec les autres. Les Génés le disent gravé d’après une bête des Strates qui ne mourait jamais seule.'),
  'coeur-meute': t('Un cœur qui bat plus fort quand l’escouade est proche. Il prend la force de l’ennemi et la redistribue, comme une louve partage sa chasse. On ne le greffe qu’à ceux qui ne travaillent jamais seuls.'),
  'mue-totale': t('Une fois dans sa vie, le Géné qui la porte quitte tout son corps abîmé, comme un crabe sa carapace. Il en sort neuf, affamé, et un peu étranger à lui-même.'),

  // ---------- Résonants ----------
  'eclat-chant': t('Une boîte à musique remontée des Strates, qui joue une mélodie à trois notes, toujours la même. Quelle que soit la note qu’on vient de jouer, elle la reprend aussitôt. Personne n’a jamais entendu la quatrième note.'),
  'miroir-brume': t('Un miroir dont le tain est fait de brume figée. L’ennemi qui s’y regarde y voit quelqu’un d’autre que lui, et retient son geste, le temps de comprendre qui. Le coup suivant passe avant qu’il ait compris.'),
  'encre-ancienne': t('Une encre qui ne sèche pas, tirée des parois des salles closes. Les signes qu’on trace avec ne veulent rien dire pour nous, mais ils fendent la pierre en séchant enfin.'),
  'meche-or': t('Chez les Sept, la mèche d’or est apparue en une nuit. Chez ceux qui sont venus après, elle met un mois. Certains la teignent pour qu’on les laisse tranquilles. L’empreinte, elle, ne se teint pas, et elle reconnaît d’instinct la faille de celle d’en face.'),
  'plume-givre': t('Une plume tombée d’une ombre ailée, glacée au toucher même en plein été. Elle ralentit tout ce qu’elle effleure, à commencer par les mauvaises intentions.'),
  'ombre-serpent': t('L’ombre d’un Résonant qui s’allonge au sol, bien plus loin que la lumière ne le permet, et s’enroule autour des chevilles de l’ennemi. Elle bouge toujours une seconde trop tôt.'),
  'ombre-ailee': t('Quand ce Résonant se tient dans la lumière, des ailes immenses se déploient sur le mur derrière lui. Les Hauts y voient une noblesse. Les districts, un orage qui attend son heure.'),
  pressentiment: t('Une lourdeur derrière les yeux, une envie soudaine de reculer d’un pas. C’est le don des Sept, celui qui a sauvé des villes entières : savoir avant les machines. Celui qui frappe juste après sait déjà où.'),
  'chant-abysses': t('Une voix venue d’une mer dont personne ici n’a jamais entendu parler. Elle s’accorde à n’importe quelle Fréquence, comme si elle connaissait déjà la suite.'),
  'souffle-wyrm': t('Le souffle d’un être ancien, immense, dont les Veilleurs n’ont retrouvé que l’ombre gravée dans un cristal de la Strate −9. Il grandit à chaque note, et ne s’arrête que lorsque la chaîne se tait.'),

  // ---------- Les voies, étape 1 (27 octobre 2026) ----------
  // Le Moteur
  'bobine-recuperation': t('Une bobine de cuivre cousue sous l’avant-bras. Chaque coup paré lui rend un peu de courant. « Rien ne se perd chez nous, dit Liane. Surtout pas la colère des autres. »'),
  condensateur: t('Un cylindre de verre où dort un éclair en réserve. Les mécaniciens des districts le portent à la ceinture, comme d’autres une gourde.'),
  'decharge-arc': t('Tout ce que le cristal a gardé part d’un seul coup, dans un claquement qui fait trembler les vitres trois rues plus loin. Après, il faut tout recharger. Ça en valait la peine.'),
  'eclair-captif': t('On dit qu’il a été pris dans un orage au-dessus des quais et qu’il cherche encore à rentrer chez lui. Il ne prend jamais qu’une étincelle au Flux, comme s’il économisait pour le voyage, mais il la rend au centuple.'),
  'noyau-instable': t('Un cœur de machine des Strates, trop vieux pour être réglé, trop puissant pour être jeté. Les Brigades ont une règle à son sujet : ne jamais se tenir derrière celui qui le porte. Vidé, il se remplit tout seul, avec un bruit que personne n’aime.'),
  // La Carapace
  'coup-epaule': t('Doran ne frappe pas souvent. Il avance, il encaisse, et quand l’autre s’est épuisé contre lui, il donne un seul coup d’épaule. Celui-là compte.'),
  'queue-massue': t('Une queue d’os et de chitine qui pousse aux Génés des quais après des années de travail dans l’eau froide. Plus on la frappe, plus elle durcit.'),
  'belier-os': t('Le front s’épaissit, la nuque se soude, et tout le corps devient une porte qui avance. Les piliers des Fondations portent encore la marque de ceux qui ont appris à s’en servir.'),
  'retour-maree': t('La mer recule, recule encore, et tout le monde croit qu’elle a renoncé. Puis elle revient avec tout ce qu’elle a retenu. Les Génés des quais se battent comme elle.'),
  // Le Chœur
  'diapason-cristal': t('Un diapason de verre clair qu’on frappe une fois, et qui oblige toutes les empreintes autour de lui à chanter la même note. Les Résonants l’appellent « mettre la salle d’accord ».'),
  'voix-basse': t('Une seule note, tenue très longtemps, si grave qu’on la sent dans les os avant de l’entendre. Seule, elle intrigue. Reprise par d’autres, elle fait céder les murs.'),
  'empreinte-jumelle': t('Deux directeurs ont pressé le pouce sur le même éclat de cristal bleu, chacun dans son district. Depuis, l’éclat garde deux empreintes qui ne se recouvrent jamais tout à fait : quand l’une frappe, l’autre se souvient du coup.'),
  'chorale-ombres': t('Les ombres de plusieurs Résonants qui chantent ensemble, même quand leurs propriétaires se taisent. Joss dit que c’est la seule chorale qui ne fait jamais de fausse note.'),
  'cloche-abysses': t('Une cloche remontée de la Strate −8, couverte de coquillages qui n’existent plus. Quand elle sonne, chaque empreinte autour d’elle répond sur le même ton.'),
  'grand-unisson': t('Le quartier entier, une nuit, a chanté la même note pour veiller un des siens. Les Veilleurs l’ont accordée dans un carillon doré, dont chaque tube porte une voix. Il frappe d’autant plus fort qu’on est nombreux à le faire sonner.'),

  // ---------- Les voies, étapes 2 et 3 (28 octobre 2026) ----------
  // La Traque
  flair: t('Nuit ne regarde pas l’ennemi : elle le sent. La sueur, la rouille, la peur qui remonte. « Tout ce qui vit laisse une trace, dit-elle. Même dans le noir. Surtout dans le noir. »'),
  'bond-predateur': t('Un saut sans élan, sans bruit, des genoux repliés jusqu’à la gorge de la proie. Les Génés des Fondations l’ont pris aux bêtes des piliers, qui chassent toujours ce qui boite.'),
  'crocs-verre': t('Des dents si fines qu’on ne les voit qu’au moment où elles se referment. Elles cherchent d’instinct la fêlure, et ne lâchent plus ce qu’elles ont commencé.'),
  'chasse-aveugle': t('Les yeux fermés, l’oreille contre la roche. Quelque part, quelque chose saigne de l’empreinte. La meute de Nuit l’a déjà encerclé, et elle n’a pas eu besoin de lumière.'),
  hallali: t('Le cri de fin de chasse, poussé quand la proie ne peut plus fuir. Dans les Strates, les créatures fêlées l’entendent avant qu’on l’ait crié.'),
  // La Lecture
  'regard-biais': t('Ne jamais regarder une empreinte en face : elle se cache. Aurel la regarde de côté, comme on regarde une étoile pâle, et la voit trembler à l’endroit exact où elle cédera.'),
  'lame-doute': t('Une lame fine, sans tranchant visible. Elle ne coupe rien de solide. Elle s’enfonce là où l’ennemi hésite déjà, et l’hésitation fait le reste.'),
  'oeil-lecteur': t('L’œil des Lecteurs des salles closes, voilé de nacre. Il lit une créature comme on lit un registre : son nom, sa faute, et la page où elle se déchire.'),
  verdict: t('Une seule phrase, prononcée sans colère. Ce que la Lecture a mis à nu ne se recouvre plus : le coup suivant tombe exactement là.'),
  'sentence-muette': t('Les Orsève jugeaient sans un mot, d’un geste de la main. Aurel a gardé le geste et oublié le reste. « Je n’ai pas besoin de parler. Ils savent déjà ce qu’ils ont fait. »'),
  // La Sève
  'pollen-ambre': t('Une poudre dorée que Kessa souffle sur les plaies. Ce qui n’a pas besoin de guérir durcit en une fine écorce, et protège encore.'),
  'seve-piliers': t('La sève qui suinte des fissures des vieux piliers des Fondations, entre la roche et le béton, tiède même en hiver. Les Nés-de-mue la boivent pour réparer leur corps, et le surplus les recouvre comme un vernis.'),
  'mue-verre': t('Une peau neuve, transparente, qui pousse sous l’ancienne en une seule nuit. Quand on n’en a pas besoin, on la porte comme une armure.'),
  floraison: t('Une fois par génération, la mousse sèche des piliers fleurit. Les Génés y voient un signe : la vie déborde, et ce qu’elle ne peut pas soigner, elle le protège.'),
  // La Cadence
  'pas-chasse': t('Un pas de côté, un autre, et l’ennemi frappe l’air. Ilka danse quand elle se bat, et ne s’en rend même plus compte.'),
  'lames-jumelles': t('Deux lames courtes, montées sur les avant-bras. La première ouvre, la seconde suit avant que la première ne soit revenue. Elles n’aiment pas attendre.'),
  'poings-pistons': t('Des gantelets à air comprimé récupérés sur une presse de chantier. Ils frappent deux fois pour le prix d’une, dans un sifflement que tout le quartier reconnaît.'),
  mitraille: t('Un chargeur de clous de charpentier, recalibré pour tirer en rafale. « C’est pas propre, admet Ilka. Mais c’est rapide, et j’en ai plein les poches. »'),
  'cadence-folle': t('Le cristal s’emballe, le cœur suit, et le corps n’a plus le temps de penser. Les coursiers qui l’ont portée disent qu’on n’en garde aucun souvenir, seulement l’envie de recommencer.'),

  // ---------- Les exclusives (28 octobre 2026) : des empreintes qui refusent la copie ----------
  // Une empreinte se recopie de porteur en porteur, et c'est ainsi qu'on la trouve dans tous les métaux. Certaines refusent :
  // recopiées, elles s'effacent. On ne les trouve donc qu'au rang où elles se sont arrêtées.
  'gantelet-pillard': t('Le gantelet d’un pilleur des Strates, connu pour revenir de chaque descente avec ce que les autres avaient laissé. Toute copie qu’on en tire tombe en poussière : l’empreinte n’aime pas qu’on lui prenne quoi que ce soit.'),
  'machoire-miroir': t('Une mâchoire de Géné qui mord comme mordait ce qui vient de mordre. Les Veilleurs n’ont jamais réussi à la recopier : la copie mord comme l’original, et se dévore elle-même.'),
  'boucle-memoire': t('Un anneau de cristal qui rejoue sans cesse la même seconde, celle du meilleur coup de son porteur. Recopié, il ne rejoue que du silence.'),
  'coeur-surregime': t('Un cœur de machine monté sans frein, par un mécanicien qui voulait sauver sa sœur coincée sous un éboulis. Elle est sortie ; lui, non. Depuis, le cœur refuse toute poitrine qui n’accepte pas d’en payer le prix.'),
  'peau-ancetre': t('La peau d’un des tout premiers Génés des Fondations, relevée une seule fois, à sa mort. Toutes les copies suivantes se sont effacées. Elle n’a jamais servi à protéger : elle sert à prendre. Ce qui la frappe y laisse son armure.'),
  'miroir-hauts': t('Un miroir des grandes salles des Hauts, de ceux qui renvoient les gestes avant les visages. Les Orsève en ont fait fondre toutes les copies. Celui-ci a été volé à temps.'),
  'coeur-etoile': t('On ne sait pas d’où vient ce cœur, seulement qu’il brille dans le noir comme une étoile qui n’existe plus. C’est un original, que personne n’a jamais recopié. Il demande beaucoup à son porteur, et il rend davantage.'),
  'seconde-naissance': t('Une vierge que ceux d’avant n’ont jamais utilisée, rangée seule dans un Berceau. Elle ne soigne pas : elle recommence. Kessa dit qu’en la touchant, on entend un premier cri.'),
  'empreinte-vive': t('Une empreinte sans visage, qui prend celui de ce qu’elle touche. Les Veilleurs se demandent si elle n’imite pas, simplement, comme ceux d’avant imitaient les vivants.'),
  'silence-avant': t('Le silence qui suit une catastrophe, conservé dans une vierge de nacre. Il étouffe tout ce qu’il touche, puis rend aux vivants ce qu’ils ont de meilleur, comme pour s’excuser d’être resté si longtemps seul.'),

  // ---------- Les nouvelles cartes (4 novembre 2026) ----------
  // Les Machines (Sasha) : le chantier, ses outils trop lourds et ce qui les rend légers
  'servo-bras': t('Un bras d’appoint vissé à l’épaule, qui porte la moitié de tout ce qu’on soulève. « Ce n’est pas toi qui deviens plus fort, dit Sasha. C’est la charge qui devient plus polie. »'),
  'marteau-piston': t('Le marteau des poseurs de pilotis, monté sur l’avant-bras. Un coup, et la poutre est enfoncée ; un coup, et ce qui se tenait en face ne se tient plus aussi droit.'),
  verin: t('Un vérin de grue démonté sur un chantier abandonné de la Cuvette. Il ne pousse pas plus fort qu’un autre : il pousse au bon moment, et le reste suit.'),
  'exo-chantier': t('L’armature que portaient les équipes de la digue, quand il fallait tenir un mur le temps qu’on coule le béton derrière. Elle encaisse, et elle garde en réserve tout ce qu’elle a encaissé.'),
  foreuse: t('La tête de forage qui a ouvert le premier puits du district. Elle n’a jamais été conçue pour combattre. Elle a seulement été conçue pour ne pas s’arrêter.'),
  // L’Harmonie (Véla) : la suite qui passe d’une lignée à l’autre
  'contre-chant': t('Une note posée sous la mélodie des autres, jamais à l’unisson. Véla l’apprend aux recrues en premier : « Ne chante pas avec eux. Chante entre eux. »'),
  'fil-accord': t('Un fil d’or tendu entre trois pierres de lignées différentes. Seul, il ne vibre pas. Quand un Augmenté, un Géné et un Résonant le touchent en même temps, on l’entend jusqu’à la Tour.'),
  'nuee-chorale': t('Des oiseaux de papier pliés par les enfants du district, qui tournent ensemble comme des étourneaux dès qu’un Résonant chante. Chacun garde sa couleur, et c’est pour ça qu’ils ne se cognent jamais.'),
  // Des cartes qui comblent un trou de la collection
  riveteuse: t('Un pistolet à rivets de la digue, réglé pour traverser deux tôles d’un coup. Sasha l’a recalibré pour une troisième : « Celle qu’on ne voit pas. »'),
  'suture-vive': t('Un fil de soie de Géné, qui se resserre tout seul dans la plaie. La Clinique le réserve à un seul blessé à la fois : il a besoin de toute l’attention de celui qui coud.'),
  lamproie: t('Une bouche ronde greffée à l’avant-bras, empruntée aux poissons qui s’accrochent aux piliers noyés. Elle ne lâche qu’une fois rassasiée.'),
  berceuse: t('Un air qu’on chantait aux enfants pendant les crues, pour couvrir le bruit de l’eau. Dans les Strates, il endort aussi ce qui se préparait à frapper.'),
  // Deux nacres de plus (une vierge pour les Augmentés, une pour les Génés)
  'couperet-hauts': t('La lame qui tranchait les câbles des passerelles des Hauts, quand on décidait qu’un quartier ne serait plus relié. Elle ne frappe pas souvent. Elle n’a jamais eu besoin de frapper deux fois.'),
  'racines-meres': t('Les racines du premier jardin des Fondations, qui ont tenu le sol pendant que tout le reste glissait. Tant qu’elles tiennent, personne autour d’elles ne tombe tout à fait.'),

  // ---------- L’Héritage du district (27 octobre 2026) : la directrice parle, dans sa lettre ----------
  'foulee-directrice': t('« Je n’ai jamais été la plus forte. J’étais toujours la première arrivée. Ces jambes-là m’ont portée sur chaque passerelle de ce district, et jusqu’aux abris murés. Jamais plus bas. Cours devant, directeur : les autres suivront. »'),
  'bras-fonderie': t('« Ce bras a coulé la première digue du district, du temps où on creusait à sec autour du puits. Il ne sait rien faire de délicat. Il n’en a jamais eu besoin. »'),
  'coeur-glaciere': t('« Un cœur dessiné par la Glacière elle-même, avant qu’on comprenne ce qu’elle était. Il garde tout, et rend tout d’un coup. Ne le laisse jamais s’éteindre. »'),
  'carapace-fondations': t('« Cette carapace a tenu une nuit entière devant la porte de l’ascenseur, pendant la grande crue. Personne n’est passé. Elle se souvient de chaque coup, et les rend. »'),
  'oeil-grande-nuit': t('« La nuit où les lumières du district se sont éteintes, quelqu’un voyait encore. Cet œil-là. Il trouve la faille, et il ne la quitte plus. »'),
  'premiere-mue': t('« La toute première mue d’un Géné, gardée comme un trésor par sa famille, puis par moi. Elle rappelle au corps qu’il sait se refaire. À tous les corps autour. »'),
  'lanterne-lecture': t('« La lanterne de la première Lectrice du district. Elle éclaire toujours la marche suivante, jamais plus loin : c’est assez pour monter un escalier entier. »'),
  'sceau-orseve': t('« Je l’ai pris dans le bureau d’Isaure Orsève, le jour où elle a signé la fermeture de nos Berceaux. Il lit les fautes de ceux qui le regardent. Elle ne l’a jamais réclamé. »'),
  'voix-quartier': t('« Le soir où on a appris la fermeture des Berceaux, le quartier entier est sorti chanter sous la Tour. Une seule note, des heures. Je l’ai gardée. Elle reprend toutes les voix qu’on lui donne. »'),
};

/** Le lore d'une carte (« jambes-ressort@or » → celui de « jambes-ressort ») */
export const loreCarte = (cle: string): string | null => LORE_CARTES[cle.split('@')[0]!] ?? null;

/**
 * Le rang d'une empreinte selon son métal (décisions du 28 octobre 2026 : « le métal dit combien de fois l'empreinte a été
 * recopiée ») : nacre jamais (l'original), or une fois, argent deux, cuivre trois à cinq, fer davantage.
 * C'est pourquoi on trouve une carte directement dans son métal, et les métaux rares plus bas, où l'on a moins copié.
 */
export const RANG_METAL: Record<import('./types').Rarete, { rang: string; texte: string }> = {
  fer: { rang: t('Copie lointaine'), texte: t('Recopiée plus de cinq fois, de pierre neuve en pierre neuve. Le geste a perdu ses détails ; il en reste l’essentiel, et c’est déjà beaucoup.') },
  cuivre: { rang: t('Copie de copie'), texte: t('Recopiée trois à cinq fois. Chaque pierre neuve en a perdu un peu, et inventé un peu.') },
  argent: { rang: t('Deuxième copie'), texte: t('Recopiée deux fois : relevée à la mort d’un porteur, gravée sur une pierre neuve, puis encore une fois.') },
  or: { rang: t('Première copie'), texte: t('Recopiée une seule fois : un seul passage la sépare de l’original. Les Hauts en gardent beaucoup, et les districts presque aucune.') },
  nacre: { rang: t('Vierge'), texte: t('Jamais recopiée : c’est l’original. Une vierge de Berceau pour une empreinte ancienne, la gravure faite sur le Donneur lui-même pour un geste humain.') },
};
