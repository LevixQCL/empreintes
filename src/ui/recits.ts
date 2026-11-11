// Les Récits des origines (Pack des origines, 11 novembre 2026) : l'histoire d'Ilka, puis de Doran et de Véla,
// joués par le lecteur de l'intro (mêmes plans, mêmes sous-titres, même caméra). Bryan : « construis toute la partie pour Ilka ».
// Le texte vient du document « Ossyra — Récit d'Ilka », relu avec Bryan le 10 novembre 2026 :
// le signal de Doran reste son secret (Bible : « Le secret de Doran »), la Glacière n'est jamais nommée.
// Les illustrations (public/intro/ilka-XX.webp) sont à générer sur Midjourney (docs/prompts-recit-ilka.md) ;
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
    tr('Sur la passerelle, il y a une fissure. Ilka l’a signalée. Deux autres coursiers aussi. On leur a répondu : « Conforme. »')] }),
  plan({ epoque: tr('Chapitre 1 · Signalée trois fois'), titre: tr('Deux heures'), annees: [2111, 2111], ambiance: 'maree', camera: 'descend', texte: 'haut', fonds: [f('ilka-02')], scene: () => nature(2), lignes: [
    tr('La passerelle cède. Ilka tombe entre deux piliers, les jambes coincées sous le métal. L’eau monte.'),
    tr('Un Géné des pompes plonge, la peau dure comme une carapace. Il tire de toutes ses forces : le métal ne bouge pas. Alors il lui tient la tête hors de l’eau. « Je m’appelle Doran. On attend les pompes. »'),
    tr('Au-dessus d’eux, la moitié de passerelle restée en l’air grince sans tomber. Doran la regarde : « Elle aurait dû lâcher, celle-là. »'),
    tr('Deux heures. L’eau au menton, puis aux lèvres. Ilka compte pour ne pas crier. Elle n’arrive jamais au bout de cent.')] }),
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

export const RECITS: Record<string, Film> = {
  ilka: { plans: ILKA, nom: tr('Récit d’Ilka'), fin: tr('Fin du récit') },
};

// ---------- La dernière scène : ce que le personnage garde de cette histoire ----------

/** Le choix de la carte d'origine, à la fin du récit (relire la dernière scène permet de changer d'avis) */
export function htmlChoixRecit(recit: string, actuelle: string | null): string {
  const r = RECITS_ORIGINES[recit]!;
  const nom = RECITS[recit]!.nom;
  return `<div class="ecran choix-recit"><section class="cr-page">`
    + `<p class="surtitre">${nom}</p><h1>${r.question}</h1>`
    + `<p class="cr-aide">${actuelle ? tr('Tu peux changer d’avis : la nouvelle carte prend la place de l’ancienne, au même niveau et dans les mêmes decks.') : tr('Choisis la carte d’origine qu’elle emporte. Tu pourras changer d’avis en relisant cette scène.')}</p>`
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
