// Les Récits des origines (Pack des origines, 11 novembre 2026) : l'histoire d'Ilka, puis de Doran et de Véla,
// joués par le lecteur de l'intro (mêmes plans, mêmes sous-titres, même caméra). Bryan : « construis toute la partie pour Ilka ».
// Le texte vient du document « Ossyra — Récit d'Ilka », relu avec Bryan le 10 novembre 2026 :
// le signal de Doran reste son secret (Bible : « Le secret de Doran »), la Glacière n'est jamais nommée.
// Le Récit de Doran (11 novembre 2026) suit le doc « Ossyra — Récit de Doran » : la Mue, le Levage, la Grève, le signal de 2111.
// La lanterne au-dessus de l'eau (2099 et 2111), c'est Véla : aucun récit ne le dit, le joueur relie les morceaux.
// Le Récit de Véla (11 novembre 2026) suit le doc « Ossyra — Récit de Véla » : Corvin, l'Accord ouvert, la Nuit blanche,
// les câbles sans harnais. Elle a vu les trois éclats de 2111 et se tait (validé par Bryan) : son récit ne nomme jamais Doran.
// Les illustrations (public/intro/ilka-XX.webp, doran-XX.webp, vela-XX.webp) sont à générer sur Midjourney (docs/prompts-recit-*.md) ;
// tant qu'elles manquent, la scène dessinée en code du plan s'affiche.

import { lignees, nature, oubli, puits, toi, tours, type Film, type Plan } from './intro';
import { t as tr } from '../core/i18n';
import { RECITS_ORIGINES } from '../core/partie/recits';
import { moduleDef } from '../core/donnees';
import { faceCarte } from './carte';

const f = (id: string, des = 1, camera?: Plan['camera']) => ({ id, des, camera });
/** un plan du Récit : lu en entier (la version courte et la complète sont les mêmes) */
const plan = (p: Omit<Plan, 'court'>): Plan => ({ ...p, court: p.lignes });

const ILKA: Plan[] = [
  // ---------- Chapitre 1 · Signalée trois fois (2111) ----------
  plan({ epoque: tr('2111 · Les Hauts-Ponts'), titre: tr('Signalée trois fois'), annees: [2111, 2111], ambiance: 'nuit', camera: 'approche', fonds: [f('ilka-01')], scene: tours, lignes: [
    tr('Ilka a quatorze ans et ses jambes à elle. Elle court déjà plus vite que tous les coursiers du district.'),
    tr('Sa mère répare les pompes. Elle répète toujours : « Tant qu’on entend les pompes, on dort tranquille. »'),
    tr('Ce soir-là, les pompes se taisent. Les quais vont fermer, et il reste un colis à livrer de l’autre côté. Le raccourci passe par la vieille passerelle.'),
    tr('Sur la passerelle, il y a une fissure. Ilka l’a signalée au printemps. Une commerçante l’été, un ouvrier des Fondations l’automne. Les trois rapports sont revenus avec le même tampon : « non prioritaire ».')] }),
  plan({ epoque: tr('Chapitre 1 · Signalée trois fois'), titre: tr('Deux heures'), annees: [2111, 2111], ambiance: 'maree', camera: 'descend', texte: 'haut', fonds: [f('ilka-02')], scene: () => nature(2), lignes: [
    tr('La passerelle cède. Ilka tombe entre deux piliers, les jambes coincées sous le métal. L’eau monte.'),
    tr('Un Géné des pompes plonge, la peau dure comme une carapace. Il tire de toutes ses forces : le métal ne bouge pas. Alors il lui tient la tête hors de l’eau. « Je m’appelle Doran. On attend les pompes. »'),
    tr('Au-dessus d’eux, la moitié de passerelle restée en l’air grince sans tomber. Doran la regarde : « Elle aurait dû lâcher, celle-là. »'),
    tr('Plus haut, quelqu’un s’accroche aux câbles, sans harnais, et leur tend une lanterne. Ilka ne voit pas son visage. Seulement la lumière.'),
    tr('Deux heures. L’eau au menton, puis aux lèvres. Ilka compte en regardant la lumière, pour ne pas crier. Elle n’arrive jamais au bout de cent.')] }),
  plan({ epoque: tr('Chapitre 1 · Signalée trois fois'), titre: tr('Le signal'), annees: [2111, 2111], ambiance: 'nuit', camera: 'approche', fonds: [f('ilka-03')], scene: () => nature(3), lignes: [
    tr('Doran sait ce qui arrive quand on relance les pompes. L’eau repart d’un coup vers les bouches, et emporte tout ce qui traîne au fond. Le métal, et ce qui est pris dessous.'),
    tr('Il allume sa lampe de signal. Trois éclats vers la station : « Relancez. » Là-bas, la mère d’Ilka obéit, sans savoir pour qui.'),
    tr('Il ne dit rien à Ilka. Il lui prend la main. « Quand ça repart, tu serres. Fort. »'),
    tr('Les pompes repartent. Le courant arrache la passerelle vers le fond. L’eau descend. Ilka respire. Sous elle, il n’y a plus rien.')] }),
  plan({ epoque: tr('Chapitre 1 · Signalée trois fois'), titre: tr('La porte d’acier'), annees: [2111, 2111], ambiance: 'cristal', camera: 'porte', texte: 'haut', fonds: [f('ilka-04')], scene: puits, lignes: [
    tr('La clinique n’a plus de courant. Doran soulève Ilka : « Je connais un endroit. » Il la porte toute la nuit, par une galerie que personne n’emprunte plus.'),
    tr('Derrière une porte d’acier, il fait froid, et il y a du courant. Quelque chose bourdonne dans les murs, comme une ville qui respire.'),
    tr('Une médecin travaille jusqu’à l’aube. Doran ne lâche pas la main d’Ilka.'),
    tr('Ilka se réveille avant les autres. Deux jambes de métal. Sur la cheville, une petite lumière clignote. Elle compte. Puis elle s’arrête.')] }),
  // ---------- Chapitre 2 · Prêt-de-vie (2111-2112) ----------
  plan({ epoque: tr('Chapitre 2 · Prêt-de-vie'), titre: tr('Trois façons d’avoir des jambes'), annees: [2111, 2111], ambiance: 'atelier', camera: 'droite', fonds: [f('ilka-05')], scene: (k) => lignees(k), lignes: [
    tr('Le lendemain, un homme de la compagnie de transport attend au pied du lit. « Il y a trois façons d’avoir des jambes. Les acheter. Les louer. Ou nous les rendre en courses. »'),
    tr('Personne aux Hauts-Ponts ne peut les acheter. Il reste les courses. Quinze ans.'),
    tr('Il lit la dernière clause sans lever les yeux : « Si la porteuse décède, la dette passe au plus jeune de la famille. Plus il est jeune, plus il a d’années devant lui. »'),
    tr('Le plus jeune, c’est Pim. Deux ans. Il dort dans les bras de leur mère. Ilka signe en appuyant fort, pour que ça ressemble à une signature d’adulte.')] }),
  plan({ epoque: tr('Chapitre 2 · Prêt-de-vie'), titre: tr('Les jambes d’une autre'), annees: [2111, 2112], ambiance: 'nuit', camera: 'recule', fonds: [f('ilka-06')], scene: tours, lignes: [
    tr('Les jambes ne savent pas marcher. Au premier pas, elles partent. La nuit, elles courent dans son sommeil, sur des passerelles qui n’existent plus.'),
    tr('« Le cœur vient d’une coursière des années 2070, dit le technicien. Elle avait ses habitudes. »'),
    tr('Ilka ne sait plus marcher lentement. « Je ne sais pas si c’est moi qui suis pressée, ou elle. » En un an, ses cheveux blanchissent.')] }),
  plan({ epoque: tr('Chapitre 2 · Prêt-de-vie'), titre: tr('Ce dont on ne parle pas'), annees: [2112, 2112], ambiance: 'foyer', camera: 'gauche', texte: 'haut', fonds: [f('ilka-07')], scene: oubli, lignes: [
    tr('Doran passe tous les soirs. Il n’apporte rien, il s’assoit. Il ne parle jamais de cette nuit, elle non plus.'),
    tr('Un soir, Ilka lui dit merci. Doran se lève d’un coup et sort sans répondre. Elle met ça sur le compte de la pudeur des Génés.'),
    tr('Sur le chemin du retour, il s’arrête devant la station des pompes. Il regarde longtemps sa lampe de signal, puis la jette à l’eau.'),
    tr('À la fin de l’année, la compagnie envoie un relevé : « Reste dû : 14 ans. » Ilka le garde dans sa poche.')] }),
  // ---------- Chapitre 3 · Toutes les courses (2112-2121) ----------
  plan({ epoque: tr('Chapitre 3 · Toutes les courses'), titre: tr('Toujours en avance'), annees: [2112, 2118], ambiance: 'aube-doree', camera: 'monte', fonds: [f('ilka-08')], scene: tours, lignes: [
    tr('Elle devient la coursière la plus rapide du district. Elle connaît tous les raccourcis, et tous les potins des marchés.'),
    tr('Une seule règle : elle accepte toutes les courses. À six ans, Pim demande pourquoi elle ne s’arrête jamais. « Parce que je suis en avance. »'),
    tr('Elle prend la nouvelle passerelle des Hauts-Ponts tous les jours. Pour lui montrer qui a gagné.'),
    tr('Parfois, la nuit, la petite lumière de sa cheville clignote. Elle compte quelque chose. Ilka a arrêté de demander quoi.')] }),
  plan({ epoque: tr('Chapitre 3 · Toutes les courses'), titre: tr('Personne ne savait'), annees: [2118, 2120], ambiance: 'nuit', camera: 'recule', texte: 'haut', fonds: [f('ilka-09')], scene: oubli, lignes: [
    tr('Quand elle court de nuit, c’est Doran qui garde Pim. Il lui apprend à nager.'),
    tr('Une nuit, au bord d’un pilier, Ilka regarde la station des pompes. « Celui qui a donné l’ordre de relancer, cette nuit-là… je voudrais juste savoir s’il savait. »'),
    tr('Doran met longtemps à répondre. « Personne ne savait. » Ilka hoche la tête. Elle le croit. Elle le croit toujours.')] }),
  plan({ epoque: tr('Chapitre 3 · Toutes les courses'), titre: tr('Payé triple'), annees: [2121, 2121], ambiance: 'foyer', camera: 'approche', fonds: [f('ilka-10')], scene: toi, lignes: [
    tr('2121, la nuit de l’élection. Un colis payé triple, sans nom d’expéditeur. Ilka ne pose jamais de question aux colis payés triple. C’est pour ça qu’on les lui confie.'),
    tr('À l’aube, les ouvriers des pompes l’attendent au pied de sa tour. Doran est avec eux. « Il y a quelque chose d’ouvert, en bas. Va chercher le nouveau directeur. »'),
    tr('« Ça tombe bien, dit Ilka. Je ne sais pas faire autrement. » Doran la regarde partir, et compte ses pas jusqu’à ce qu’elle disparaisse.'),
    tr('Dans sa poche, le relevé de la compagnie : « Reste dû : 5 ans. »')] }),
];

const DORAN: Plan[] = [
  // ---------- Chapitre 1 · La phrase de mon père (2094) ----------
  plan({ epoque: tr('2094 · Les chantiers d’abris'), titre: tr('La phrase de mon père'), annees: [2094, 2094], ambiance: 'foyer', camera: 'approche', fonds: [f('doran-01')], scene: oubli, lignes: [
    tr('Doran a vingt-cinq ans. Il porte des poutres sur les chantiers d’abris, comme son père avant lui.'),
    tr('Son père ne parle presque plus. Il reste assis face au mur de la cuisine, comme s’il écoutait quelque chose derrière.'),
    tr('En 2066, avant la naissance de Doran, il a muré des accès sous le district. Il n’en a jamais rien raconté. Sauf une phrase : « On a fermé la porte, mais pas de notre côté. »'),
    tr('Enfant, Doran croyait que c’était une devinette. Adulte, il a compris que son père n’attendait pas de réponse.')] }),
  plan({ epoque: tr('Chapitre 1 · La phrase de mon père'), titre: tr('La file'), annees: [2094, 2094], ambiance: 'aube-doree', camera: 'descend', texte: 'haut', fonds: [f('doran-02')], scene: (k) => lignees(k), lignes: [
    tr('Un soir d’hiver, le père se lève, pose la main à plat sur le mur et la laisse là. Il meurt dans la nuit, assis.'),
    tr('Le lendemain, un recruteur de la Compagnie des Fondations s’installe sur le marché. « Mue payée. Logement payé. Poumons d’amphibien, chitine à l’épaule. Quinze ans sous l’eau, et vous ressortez libre. »'),
    tr('Sous l’eau, sous les Fondations, il y a là où son père n’est jamais redescendu. Doran se met dans la file.'),
    tr('En bas du contrat : « Le corps est modifié pour le poste, pas pour la personne. » Il signe quand même.')] }),
  // ---------- Chapitre 2 · Sous l’eau (2094-2098) ----------
  plan({ epoque: tr('Chapitre 2 · Sous l’eau'), titre: tr('La maison de mue'), annees: [2094, 2095], ambiance: 'atelier', camera: 'droite', fonds: [f('doran-03')], scene: (k) => lignees(k), lignes: [
    tr('La Mue dure sept mois. Fièvre, peau qui pèle, et une faim que rien ne remplit. Doran mange le triple, et c’est la Compagnie qui paie.'),
    tr('La nuit, la veilleuse chante la berceuse à compter les jours. Tous les Génés la connaissent. Doran l’apprend sans s’en rendre compte.'),
    tr('Un matin, sa peau ne pèle plus. Sur son épaule, une plaque vert-bleu, dure comme une coque. Il respire, et quelque chose siffle dans sa gorge.'),
    tr('Première plongée. Il attend la panique. Elle ne vient pas. Sous l’eau, pour la première fois de sa vie, il ne se sent pas lourd.')] }),
  plan({ epoque: tr('Chapitre 2 · Sous l’eau'), titre: tr('Le Levage'), annees: [2095, 2098], ambiance: 'profondeur', camera: 'monte', texte: 'haut', fonds: [f('doran-04')], scene: puits, lignes: [
    tr('Le travail : réparer les piliers, déboucher les bouches des pompes, poser des étais. Et le Levage.'),
    tr('Le Levage, ce sont des caisses. Des caisses scellées, sorties de galeries où les équipes ordinaires n’ont pas le droit d’aller, et remontées de nuit.'),
    tr('Le contremaître a une seule règle : « On ne regarde pas, on ne compte pas, on ne demande pas. »'),
    tr('Doran ne regarde pas. Il ne demande pas. Mais il compte. Quatre ans, deux cent douze caisses.')] }),
  plan({ epoque: tr('Chapitre 2 · Sous l’eau'), titre: tr('Ses épaules'), annees: [2098, 2098], ambiance: 'nuit', camera: 'gauche', fonds: [f('doran-05')], scene: oubli, lignes: [
    tr('Les noms de l’équipe changent chaque mois. Certains rendent leur contrat. D’autres ne remontent pas, et le rapport dit « mutation ».'),
    tr('Un soir, un collègue lui montre sa fille, née avec une plaque de chitine à l’épaule. Il en est fier. Doran ne dit rien.'),
    tr('Le lendemain, un homme des Hauts vient à la cantine avec un registre. « Les enfants nés avec un trait, c’est pour notre recensement. »'),
    tr('Doran décide ce jour-là qu’il n’aura pas d’enfants. Plus tard, il dira seulement : « Je ne voulais pas qu’ils naissent avec mes épaules. »')] }),
  // ---------- Chapitre 3 · Quarante jours (2099-2121) ----------
  plan({ epoque: tr('Chapitre 3 · Quarante jours'), titre: tr('L’affiche'), annees: [2099, 2099], ambiance: 'colere', camera: 'approche', fonds: [f('doran-06')], scene: tours, lignes: [
    tr('2099. Une affiche de la Compagnie : tous les contrats sont prolongés de cinq ans, « pour amortir le coût de la sève ».'),
    tr('Personne ne crie. Les Génés se regardent, et le soir même, ils descendent tous. Ils ne remontent pas.'),
    tr('La Compagnie ne peut envoyer personne les chercher : il n’y a qu’eux pour tenir là-dessous.'),
    tr('Ils arrêtent les pompes des quais des Hauts, et laissent l’eau y monter. Celles du district, ils les gardent en marche. Et plus une seule caisse ne remonte.')] }),
  plan({ epoque: tr('Chapitre 3 · Quarante jours'), titre: tr('Les paniers'), annees: [2099, 2099], ambiance: 'nuit', camera: 'descend', texte: 'haut', fonds: [f('doran-07')], scene: () => nature(2), lignes: [
    tr('Pour parler avec la surface, chacun a une lampe de signal. Un éclat pour « tout va bien ». Trois pour « relancez ». Doran garde la sienne contre sa poitrine.'),
    tr('Le dixième jour, des paniers descendent au bout de câbles. Du pain, du poisson séché, des mots d’enfants. Le district a compris.'),
    tr('Le panier de Doran descend toujours au même endroit, de nuit, tenu par quelqu’un sans harnais. Il ne voit jamais son visage. Seulement, sur l’eau, à la lueur d’une lanterne, l’ombre d’un dragon.'),
    tr('Le vingtième jour, la Compagnie coupe la lumière des galeries. Dans le noir, quelqu’un commence la berceuse à compter les jours. Tout le monde la reprend.')] }),
  plan({ epoque: tr('Chapitre 3 · Quarante jours'), titre: tr('Têtus comme une marée'), annees: [2099, 2109], ambiance: 'aube-doree', camera: 'monte', fonds: [f('doran-08')], scene: tours, lignes: [
    tr('Le quarantième jour, l’affiche est déchirée. Les contrats restent à quinze ans.'),
    tr('Quand ils remontent, le marché entier les attend. Une vieille femme leur crie : « Têtus comme une marée ! » Le mot reste.'),
    tr('2109. Son contrat prend fin. Doran est libre. Il reste aux pompes : sous l’eau, il n’est toujours pas lourd.')] }),
  plan({ epoque: tr('Chapitre 3 · Quarante jours'), titre: tr('Trois éclats'), annees: [2111, 2111] /* même instant que « Le signal » d'Ilka : même image */, ambiance: 'maree', camera: 'approche', texte: 'haut', fonds: [f('ilka-03')], scene: () => nature(3), lignes: [
    tr('2111, la nuit où la passerelle des Hauts-Ponts cède. Une gamine coincée sous le métal. Il plonge sans réfléchir.'),
    tr('Au-dessus d’eux, quelqu’un s’accroche aux câbles et leur tend une lanterne. Sur l’eau, l’ombre d’un dragon. Doran l’a déjà vue, douze ans plus tôt.'),
    tr('Deux heures à lui tenir la tête hors de l’eau. Il sait ce que fera le courant quand les pompes repartiront. Il le sait depuis 2094.'),
    tr('Il sort la lampe de la grève. Il la regarde. Puis trois éclats vers la station.')] }),
  plan({ epoque: tr('Chapitre 3 · Quarante jours'), titre: tr('Envoyez Ilka'), annees: [2112, 2121], ambiance: 'cristal', camera: 'porte', fonds: [f('doran-10')], scene: puits, lignes: [
    tr('Un soir, en rentrant de chez elle, il jette la lampe à l’eau. Il ne dit pas pourquoi. Il n’en parle à personne.'),
    tr('2121, l’aube. Les ouvriers ont trouvé une salle ouverte sous les pompes. Il faut quelqu’un pour aller chercher le directeur.'),
    tr('Tout le monde parle en même temps. Doran dit une seule chose : « Envoyez Ilka. Personne ne court plus vite. »'),
    tr('Devant la salle ouverte, il pose la main à plat sur la pierre. Comme son père sur le mur de la cuisine.')] }),
];

const VELA: Plan[] = [
  // ---------- Chapitre 1 · Soixante (2097) ----------
  plan({ epoque: tr('2097 · Les bas-fonds'), titre: tr('Corvin'), annees: [2097, 2097], ambiance: 'foyer', camera: 'approche', fonds: [f('vela-01')], scene: oubli, lignes: [
    tr('2097. Véla a dix-neuf ans. Elle est apprentie fouilleuse, et elle a peur du vide.'),
    tr('Quand elle remonte un cristal, elle l’apporte au vieux Corvin. C’est un Muet : un Résonant qui refuse de servir le Présage. Il lit les pierres des fouilleurs pour une soupe.'),
    tr('Ce soir-là, Corvin ne lit rien. Il est couché. « Reste un peu. Je n’ai personne d’autre. »'),
    tr('Il meurt avant l’aube, la main de Véla dans la sienne. À la lueur de la bougie, son ombre de dragon s’efface du mur.')] }),
  plan({ epoque: tr('Chapitre 1 · Soixante'), titre: tr('Copie de district'), annees: [2097, 2097], ambiance: 'aube-doree', camera: 'gauche', fonds: [f('vela-02')], scene: tours, lignes: [
    tr('Le lendemain matin, la Clinique est formelle. Une pierre doit être relevée et reposée dans les trois jours. Sinon, elle s’éteint.'),
    tr('Corvin n’a pas d’héritier. Les Hauts répondent par un mot : « Copie de district. Sans intérêt. »'),
    tr('Alors la Clinique affiche un Accord ouvert. Tout volontaire peut se présenter. La pierre de Corvin choisira.'),
    tr('Sa mère dit non. « Je ne veux pas qu’il y ait quelqu’un d’autre dans ma fille. »')] }),
  plan({ epoque: tr('Chapitre 1 · Soixante'), titre: tr('Soixante'), annees: [2097, 2097], ambiance: 'cristal', camera: 'approche', fonds: [f('vela-03')], scene: (k) => lignees(k), lignes: [
    tr('Le deuxième jour, Véla se présente quand même. Ils sont soixante dans la file.'),
    tr('La liseuse de la Clinique pose la pierre dans chaque main, quelques secondes. Elle ne se réchauffe pour personne. Douze, trente, cinquante-neuf.'),
    tr('Véla est la dernière. La pierre est tiède avant même de toucher sa paume.')] }),
  // ---------- Chapitre 2 · L’Accord ouvert (2097) ----------
  plan({ epoque: tr('Chapitre 2 · L’Accord ouvert'), titre: tr('Une seule nuit'), annees: [2097, 2097], ambiance: 'nuit', camera: 'descend', texte: 'haut', fonds: [f('vela-04')], scene: (k) => lignees(k), lignes: [
    tr('La liseuse est claire. « Une nuit, la pierre contre ta nuque. Si elle refuse, elle meurt. Et le district la perd pour toujours. »'),
    tr('Il n’y aura pas de deuxième essai. Ni pour Véla, ni pour personne.'),
    tr('Le soir, devant la Clinique, il y a du monde. Les cinquante-neuf autres. Des fouilleurs que Corvin aidait. Des inconnus.'),
    tr('Véla ne dort pas. Puis elle dort. Elle rêve d’une mer qu’elle n’a jamais vue, vue d’en haut, de très haut. Elle n’a pas peur.'),
    tr('Au réveil, la pierre est tiède. Dehors, quelqu’un se met à applaudir, puis toute la rue.')] }),
  plan({ epoque: tr('Chapitre 2 · L’Accord ouvert'), titre: tr('La Nuit blanche'), annees: [2097, 2097], ambiance: 'foyer', camera: 'droite', fonds: [f('vela-05')], scene: oubli, lignes: [
    tr('La greffe se fait le jour même : le cristal serti sous la peau, à la base du crâne. Viennent les trois nuits sans sommeil.'),
    tr('La tradition veut que la famille veille le greffé et lui parle de son enfance. Pour qu’il se souvienne de qui il était avant l’arrivée de l’autre.'),
    tr('La première nuit, personne ne vient. La liseuse s’assoit près du lit. Elle ne connaît rien de l’enfance de Véla.'),
    tr('La deuxième nuit, la porte s’ouvre. Sa mère entre sans un mot, s’assoit, et commence : « Tu avais quatre ans, et tu ne voulais jamais descendre des escaliers. »'),
    tr('Elle parle deux nuits entières. Véla écoute tout. Elle ne se souvenait d’aucune de ces histoires.')] }),
  plan({ epoque: tr('Chapitre 2 · L’Accord ouvert'), titre: tr('C’est toujours toi'), annees: [2097, 2097], ambiance: 'cristal', camera: 'approche', texte: 'haut', fonds: [f('vela-06')], scene: oubli, lignes: [
    tr('Le troisième jour, à la lueur de la bougie, l’ombre de Véla sur le mur n’est plus tout à fait la sienne. Elle ondule, longue, comme un serpent qui vole.'),
    tr('Sa mère la regarde longtemps. Puis elle dit : « C’est toujours toi. » Elle ne le dit pas comme une question.')] }),
  // ---------- Chapitre 3 · Sans harnais (2097-2121) ----------
  plan({ epoque: tr('Chapitre 3 · Sans harnais'), titre: tr('Sans harnais'), annees: [2097, 2098], ambiance: 'aube-doree', camera: 'monte', fonds: [f('vela-07')], scene: tours, lignes: [
    tr('Dans le mois, la mèche d’or pousse. Au district, beaucoup de Résonants la teignent pour qu’on les laisse tranquilles.'),
    tr('Véla ne la teint pas. « Ce n’est pas la mienne. C’est celle de Corvin. Je n’ai pas à la cacher. »'),
    tr('Le premier jour sur les câbles, elle décroche son harnais. Elle n’a plus peur du vide. Elle ne sait pas si c’est elle qui a changé, ou si c’est lui.')] }),
  plan({ epoque: tr('Chapitre 3 · Sans harnais'), titre: tr('Les paniers'), annees: [2099, 2099], ambiance: 'nuit', camera: 'descend', texte: 'haut', fonds: [f('vela-08')], scene: () => nature(2), lignes: [
    tr('2099, la Grève des pompes. Personne n’ose descendre les paniers jusqu’à l’eau. Véla, si. Quarante nuits au bout d’un câble, sans harnais, lanterne à la ceinture.'),
    tr('En bas, un Géné aux épaules larges lève toujours la tête vers sa lumière. Elle ne connaît pas son nom. Il ne voit pas son visage.'),
    tr('Chaque soir, elle allume une lanterne et regarde son ombre sur le mur. Elle vérifie qu’elle est toujours la même. Elle l’est. Presque.'),
    tr('Elle rêve de mers vues d’en haut. Des côtes qu’aucune carte du district ne montre.')] }),
  plan({ epoque: tr('Chapitre 3 · Sans harnais'), titre: tr('La place de Corvin'), annees: [2097, 2101], ambiance: 'atelier', camera: 'gauche', fonds: [f('vela-09')], scene: (k) => lignees(k), lignes: [
    tr('Devant la Clinique, elle fait une promesse. Rendre au district ce qu’il lui a donné.'),
    tr('La liseuse lui apprend le métier pendant quatre ans. Poser la pierre contre sa tempe, écouter, et trouver le mot juste pour un penchant.'),
    tr('Puis Véla reprend la place de Corvin. Elle lit les pierres des fouilleurs, et ne demande rien à ceux qui n’ont rien.')] }),
  plan({ epoque: tr('Chapitre 3 · Sans harnais'), titre: tr('Ce qu’elle a vu'), annees: [2111, 2111], ambiance: 'maree', camera: 'approche', texte: 'haut', fonds: [f('vela-10')], scene: () => nature(3), lignes: [
    tr('2111. Elle rentre des câbles quand la passerelle des Hauts-Ponts cède. Elle ne sait pas plonger. Alors elle s’accroche au-dessus de l’eau et tend sa lanterne.'),
    tr('En bas, le Géné de la Grève tient une gamine hors de l’eau. Deux heures. Puis Véla voit sa lampe lancer trois éclats vers la station.'),
    tr('Elle comprend ce que fera le courant une seconde avant qu’il reparte. Elle ne dira jamais à personne ce qu’elle a vu.')] }),
  plan({ epoque: tr('Chapitre 3 · Sans harnais'), titre: tr('Pas sa peur'), annees: [2121, 2121], ambiance: 'nuit', camera: 'recule', fonds: [f('vela-11')], scene: oubli, lignes: [
    tr('Vingt ans passent. Le district la connaît. Quand un fouilleur remonte un cristal, c’est elle qu’on va chercher.'),
    tr('2121, la nuit de l’élection du district. Véla se réveille d’un coup, le cœur qui cogne.'),
    tr('Elle a peur. Mais ce n’est pas sa peur. C’est la peur de quelqu’un d’autre, qui passe en elle comme un courant d’air.'),
    tr('Elle allume la lanterne. Son ombre tremble sur le mur, alors que la flamme est immobile.')] }),
  plan({ epoque: tr('Chapitre 3 · Sans harnais'), titre: tr('Le même'), annees: [2121, 2121], ambiance: 'cristal', camera: 'porte', fonds: [f('vela-12')], scene: puits, lignes: [
    tr('Personne ne l’a appelée. Elle s’habille, prend la lanterne et descend vers les pompes.'),
    tr('À l’aube, sur une passerelle, une coursière aux cheveux blancs la dépasse en courant. Véla la reconnaît. Ilka, non.'),
    tr('En bas, devant l’ouverture, un Géné tient la main posée sur la pierre. Le même. Véla s’arrête à côté de lui. Ni l’un ni l’autre ne dit rien.')] }),
];

export const RECITS: Record<string, Film> = {
  ilka: { plans: ILKA, nom: tr('Récit d’Ilka'), fin: tr('Fin du récit') },
  doran: { plans: DORAN, nom: tr('Récit de Doran'), fin: tr('Fin du récit') },
  vela: { plans: VELA, nom: tr('Récit de Véla'), fin: tr('Fin du récit') },
};

/** Ce qu'on lit d'un récit sur la fiche du Porteur, et la consigne du choix final (accordée au personnage) */
export const RECITS_TEXTES: Record<string, { accroche: string; emporte: string }> = {
  ilka: { accroche: tr('D’où elle vient, avant la porte : trois chapitres illustrés, et une carte d’origine à garder. Aperçu du Pack des origines.'), emporte: tr('Choisis la carte d’origine qu’elle emporte. Tu pourras changer d’avis en relisant cette scène.') },
  doran: { accroche: tr('D’où il vient, avant la porte : trois chapitres illustrés, et une carte d’origine à garder. Aperçu du Pack des origines.'), emporte: tr('Choisis la carte d’origine qu’il emporte. Tu pourras changer d’avis en relisant cette scène.') },
  vela: { accroche: tr('D’où elle vient, avant la porte : trois chapitres illustrés, et une carte d’origine à garder. Aperçu du Pack des origines.'), emporte: tr('Choisis la carte d’origine qu’elle emporte. Tu pourras changer d’avis en relisant cette scène.') },
};

// ---------- La dernière scène : ce que le personnage garde de cette histoire ----------

/** Le choix de la carte d'origine, à la fin du récit (relire la dernière scène permet de changer d'avis) */
export function htmlChoixRecit(recit: string, actuelle: string | null): string {
  const r = RECITS_ORIGINES[recit]!;
  const nom = RECITS[recit]!.nom;
  return `<div class="ecran choix-recit"><section class="cr-page">`
    + `<p class="surtitre">${nom}</p><h1>${r.question}</h1>`
    + `<p class="cr-aide">${actuelle ? tr('Tu peux changer d’avis : la nouvelle carte prend la place de l’ancienne, au même niveau et dans les mêmes decks.') : RECITS_TEXTES[recit]!.emporte}</p>`
    + `<div class="cr-choix">${r.choix.map((c) => {
      const m = moduleDef(c.carte);
      const eq = moduleDef(m.equivalent!);
      const garde = actuelle === c.carte;
      return `<button type="button" class="cr-option${garde ? ' garde' : ''}" data-action="recit-garder" data-id="${c.carte}" aria-pressed="${garde}">`
        + `<span class="cr-face">${faceCarte(m, 1)}</span>`
        + `<span class="cr-texte"><strong>${m.nom}</strong><em>${c.phrase}</em>`
        + `<small>${tr`Équivalent gratuit : ${eq.nom}, mêmes chiffres, à trouver dans le jeu.`}</small>`
        + (garde ? `<b class="cr-badge">${tr`Gardée`}</b>` : '') + `</span></button>`;
    }).join('')}</div>`
    + `<button type="button" class="btn sec" data-action="recit-quitter">${actuelle ? tr('Garder mon choix') : tr('Choisir plus tard')}</button>`
    + `</section></div>`;
}
