// Les premières rencontres (décision du 22 octobre 2026) : la première fois qu'une mécanique apparaît en combat
// (la Fêlure, le Coup d'éclat, un groupe, un trait d'ennemi, une condition de salle, la seconde phase d'un gardien), une fenêtre l'explique
// avec un conseil concret. Une seule fois par partie : ce qui a été vu est gardé dans `Jeu.decouvertes`.
// Aucun DOM ici : l'écran affiche la découverte que renvoie `decouverteEnAttente`.

import { ECLATS, PHASES3, eclatsPossibles, enGroupe, felureVisible, tousEnnemis, traitsEnJeu } from './combat';
import { CONDITIONS, ennemiDef, texteTrait } from './donnees';
import type { CombatEtat, Trait } from './types';
import { modeleDe, reperentPassage, suitePorte, type Expedition } from './expedition';
import { FOND, PALIERS_BESTIAIRE, estFond, particularite, queteDef } from './strates';
import { t as tr } from './i18n';

export interface Decouverte {
  id: string;
  /** petit titre au-dessus (« PREMIÈRE RENCONTRE »…) */
  sur: string;
  titre: string;
  texte: string;
  conseil: string;
  /** l'ennemi à montrer en portrait, s'il y en a un */
  ennemi?: string;
  /** l'icône à montrer sinon (nom dans ICO) */
  ico?: string;
}

const CONSEILS_TRAITS: Record<Trait['type'], string> = {
  blinde: tr('Les petits coups s’écrasent sur son armure : mise sur des cartes fortes, ou sur Perçant qui passe au travers.'),
  regeneration: tr('Ne le laisse pas souffler : frappe fort et vite, sinon il remonte à chaque tour.'),
  epines: tr('Chaque coup te coûte un peu : préfère quelques gros coups à beaucoup de petits, et garde un soin sous la main.'),
  evanescent: tr('Sans suite, tes coups glissent sur lui : enchaîne des Fréquences qui se suivent (3, 4, 5) pour le toucher pleinement.'),
  essaim: tr('Il revient plus petit quand il tombe : garde de quoi finir le rejeton.'),
  vengeur: tr('Si tu abats son allié, il frappera double au tour suivant : protège-toi, ou abats-le en premier.'),
  furie: tr('Plus il est blessé, plus il frappe fort : une fois sous la moitié de ses PV, achève-le vite.'),
  assimilation: tr('Il prend la lignée de la dernière carte qui le frappe : finis ta chaîne par la lignée qu’il craint le plus pour le tour suivant, et varie tes coups.'),
  aspire: tr('Chaque coup qui passe ton bouclier te prend 1 Flux : bloque-le entièrement, ou dépense ton Flux avant qu’il ne frappe.'),
};

const CONSEILS_CONDITIONS: Record<string, string> = {
  inondee: tr('Les cartes des Génés pèsent plus lourd ici : c’est le moment de les mettre en avant.'),
  courants: tr('Les cartes des Augmentés pèsent plus lourd ici : c’est le moment de les mettre en avant.'),
  chant: tr('Les cartes des Résonants pèsent plus lourd ici : c’est le moment de les mettre en avant.'),
  echo: tr('Une suite de 4 suffit pour le bonus maximal : vise 3-4-5-6.'),
  sanctuaire: tr('Les soins rendent plus : un bon endroit pour remettre l’escouade sur pied.'),
  eboulis: tr('Tout le monde s’use à chaque tour, ennemis compris : un combat long coûte cher, finis-le vite.'),
  brouillard: tr('Tu vois si l’ennemi va attaquer, se protéger ou se réparer, mais pas sur qui ni avec quelle force. Garde du bouclier et des soins pour toute l’escouade.'),
};

/** Les découvertes que ce combat peut déclencher, dans l'ordre où les montrer */
export function decouvertesDuCombat(s: CombatEtat): Decouverte[] {
  const r: Decouverte[] = [];
  // d'abord ce qui compte dès le premier coup (la salle, le groupe), puis la Fêlure
  if (s.condition && CONDITIONS[s.condition]) {
    const c = CONDITIONS[s.condition]!;
    r.push({ id: `condition-${c.id}`, sur: tr('CONDITION DE SALLE'), titre: c.nom, texte: c.texte, conseil: CONSEILS_CONDITIONS[c.id] ?? '' });
  }
  if (enGroupe(s)) {
    r.push({
      id: 'groupe', sur: tr('PREMIÈRE RENCONTRE'), titre: tr('Un groupe d’ennemis'),
      texte: tr('Chaque ennemi a sa vignette en haut à droite : ses PV, et ce qu’il prépare. Touche une vignette pour le viser : toute ta chaîne le frappe, et s’il tombe en route, le reste passe au suivant.'),
      conseil: tr('Abats d’abord celui qui fait le plus mal, ou celui qui est presque à terre : un ennemi de moins, c’est une attaque de moins.'),
    });
  }
  if (tousEnnemis(s).some((en) => en.pv > 0 && felureVisible(en) && !en.felureBrisee)) {
    r.push({
      id: 'felure', sur: tr('PREMIÈRE RENCONTRE'), titre: tr('La Fêlure'),
      texte: tr('L’ennemi montre une gemme fêlée et une Fréquence. Pose une carte de cette Fréquence dans ta chaîne : son prochain coup est brisé, moitié moins fort (un quart chez un gardien ou un blindé). Les cartes de ta main qui la brisent portent la gemme.'),
      conseil: tr('Une Fêlure brisée vaut souvent mieux qu’une suite de plus : elle protège l’escouade. Glisse-la dans une suite : elle remplit aussi le Flux pour ton Coup d’éclat.'),
    });
  }
  const eclats = eclatsPossibles(s);
  if (eclats.length) {
    r.push({
      id: 'eclat', sur: tr('FLUX PLEIN'), titre: tr('Le Coup d’éclat'),
      texte: tr`Ton Flux est plein : le bouton doré « Éclat » remplace ses losanges. Un seul Coup d’éclat par combat, au choix selon les lignées de ton escouade. ${eclats.map((c) => `${ECLATS[c.lignee].nom} : ${ECLATS[c.lignee].texte}`).join(' ')} Il vide le Flux, et le Porteur qui le déclenche prend de l’Usure.`,
      conseil: tr('Garder son Flux pour le Coup d’éclat, ou le dépenser tout de suite pour une place ou une nouvelle main : c’est à toi de voir. Méfie-toi des ennemis qui l’aspirent.'),
    });
  }
  for (const en of tousEnnemis(s)) {
    if (en.simple || en.pv <= 0) continue;
    const d = ennemiDef(en.id);
    for (const t of traitsEnJeu(en)) {
      // la Furie s'explique quand elle s'allume (sous la moitié des PV), pas avant
      if (t.type === 'furie' && en.pv > en.pvMax / 2) continue;
      const x = texteTrait(t);
      r.push({ id: `trait-${t.type}`, sur: tr('TRAIT D’ENNEMI'), titre: x.nom, texte: `${d.nom} : ${x.texte}`, conseil: CONSEILS_TRAITS[t.type], ennemi: d.id });
    }
    // 3ᵉ phase (28 octobre 2026) : une découverte par variante
    if (en.phase3Active && en.phase3) {
      const p = PHASES3[en.phase3];
      const renfort = ennemiDef(d.phase?.renforts?.[0] ?? 'remanent').nom;
      r.push({
        id: `phase3-${en.phase3}`, sur: tr('GARDIEN · DERNIÈRE PHASE'), titre: `${d.nom} : ${p.nom}`,
        texte: tr`${p.texte(d.nom, renfort)} Au dernier quart de ses PV, un gardien des Strates profondes change encore : sa dernière phase n’est pas toujours la même.`,
        conseil: p.conseil, ennemi: d.id,
      });
    }
    if (en.phase2 && d.phase) {
      r.push({
        id: 'phase', sur: 'GARDIEN', titre: `${d.nom} : ${d.phase.nom}`,
        texte: tr`${d.phase.texte} À mi-vie, un gardien change de gestes et appelle de l’aide.`,
        conseil: tr('Regarde sa nouvelle intention avant de lancer, et décide vite : le gardien, ou son renfort ?'), ennemi: d.id,
      });
    }
  }
  return r;
}

/** Les découvertes pas encore vues dans ce combat, dans l'ordre */
export function decouvertesEnAttente(vues: readonly string[], s: CombatEtat): Decouverte[] {
  return decouvertesDuCombat(s).filter((d) => !vues.includes(d.id));
}

/** La première découverte pas encore vue dans ce combat (null s'il n'y en a pas) */
export function decouverteEnAttente(vues: readonly string[], s: CombatEtat): Decouverte | null {
  return decouvertesDuCombat(s).find((d) => !vues.includes(d.id)) ?? null;
}

// ---------- Les premières rencontres de l'exploration (31 octobre 2026) ----------
// Bryan : « un nouveau joueur, tout ça lui sera à chaque fois expliqué avant une descente ? » Le contenu des Strates
// (particularité, quête, Halte, passage secret, porte à Fréquence, bestiaire) s'explique la première fois qu'il apparaît,
// au moment où il sert, une seule fois par partie : même mémoire (`Jeu.decouvertes`) que les découvertes du combat.

const CONSEILS_PARTICULARITE: Record<number, string> = {
  2: tr('Garde un Augmenté debout dans l’escouade : sans lui, les murs restent fermés.'),
  3: tr('Avance salle par salle jusqu’à la Halte : la lanterne qui t’y attend rallume le plan.'),
  4: tr('Une salle scellée est plus dure, mais rend une carte de cuivre : entres-y quand l’escouade est en forme.'),
  5: tr('Ne néglige pas les caches : une niche peut rendre une carte au lieu de minerai.'),
  6: tr('Passe par les archives quand tu peux : elles complètent les Chroniques.'),
  7: tr('Regarde les deux occupants avant d’entrer, et choisis celui que ton escouade bat le mieux.'),
  8: tr('Ouvre l’œil sur le plan : le Veilleur égaré vaut le détour.'),
  9: tr('Le fil ne sert qu’une fois : garde-le pour éviter une salle trop dure ou rejoindre un meilleur chemin.'),
  10: tr('Garde dans le deck des cartes aux Fréquences variées : il faudra quatre Fréquences qui se suivent.'),
};

/** Ce que l'expédition montre pour la première fois, dans l'ordre */
export function decouvertesExploration(x: Expedition, quetes: Record<number, number> = {}): Decouverte[] {
  const r: Decouverte[] = [];
  if (!x.carte || x.tutoriel || x.epreuve || x.pillage || x.fleche) return r;
  const m = modeleDe(x), p = particularite(m);
  if (estFond(x.strate)) {
    // le Fond (strates.ts, FOND) : expliqué une fois, à la première descente sous −10
    r.push({ id: 'fond', sur: tr`STRATE −${x.strate} · LE FOND`, titre: tr('Le Fond change chaque semaine'), ico: 'strate',
      texte: tr`Sous −10, les Strates n’ont plus de façon d’être à elles. Chaque semaine, chacune emprunte celle d’une Strate d’au-dessus, et en change le lundi.${p ? tr` Ici, cette semaine : ${p.nom.charAt(0).toLowerCase()}${p.nom.slice(1)} (Strate −${m}).` : ''}`,
      conseil: tr`Le gardien du Fond paie mieux : un choix de cartes en argent et ${FOND.eclatsGardien} Éclats de plus à chaque victoire, une carte en or la première fois.` });
  } else if (p) {
    r.push({ id: `strate-${x.strate}`, sur: tr`STRATE −${x.strate} · SA PARTICULARITÉ`, titre: p.nom, ico: 'strate',
      texte: tr`Chaque Strate a sa façon d’être. Ici : ${p.texte.charAt(0).toLowerCase()}${p.texte.slice(1)} Elle reste rappelée sous le nom de la Strate.`,
      conseil: CONSEILS_PARTICULARITE[x.strate] ?? '' });
  }
  const q = queteDef(x.strate);
  if (q && (quetes[x.strate] ?? 0) < q.etapes.length && x.carte.salles.some((s) => s.quete)) {
    r.push({ id: 'quete', sur: tr('PREMIÈRE RENCONTRE'), titre: tr('La quête de la Strate'), ico: 'quete',
      texte: tr`Chaque Strate cache une quête en plusieurs étapes. Ici : « ${q.nom} ». À chaque descente, une salle porte la marque ✦, visible même dans le brouillard. Passes-y, et gagne le combat s’il y en a un : l’étape est relevée. Elle compte au retour au district, même si la descente finit mal.`,
      conseil: tr('Les points sous le nom de la Strate (●○○) montrent où tu en es. Au bout de la quête : une carte, de l’XP et un morceau de l’histoire.') });
  }
  // Explorer (31 octobre 2026, explorer.ts) : Vestiges, gardien éveillé, Rôdeur
  if (x.carte.salles.some((s) => s.vestige)) {
    r.push({ id: 'vestige', sur: tr('PREMIÈRE RENCONTRE'), titre: tr('Les Vestiges'), ico: 'vestige',
      texte: tr('Chaque Strate cache 5 Vestiges, des objets d’autrefois. Ils ne se trouvent qu’en explorant, jamais en fouille : quelques-uns par descente, marqués d’un losange turquoise sur le plan, même dans le brouillard. Entre dans la salle (et gagne son combat s’il y en a un) pour le ramasser.'),
      conseil: tr('Les cinq réunis, la Strate est complète : une carte au choix, et tes fouilles y verront tout le plan. La Tour montre où tu en es.') });
  }
  if (x.eveille) {
    r.push({ id: 'eveille', sur: tr('PREMIÈRE RENCONTRE'), titre: tr('Le gardien éveillé'), ico: 'lueur',
      texte: tr('Tu explores une Strate déjà vaincue : son gardien s’est éveillé. Il est un peu plus fort (+10 %), mais il laisse de meilleures cartes et un Éclat de plus. Le vaincre peut aussi rapporter les étoiles de la Strate.'),
      conseil: tr('Trois étoiles par Strate : vaincre le gardien, sans qu’aucun Porteur ne tombe, et sans entrer dans un campement.') });
  }
  if (x.rodeur) {
    r.push({ id: 'rodeur', sur: tr('PREMIÈRE RENCONTRE'), titre: tr('Un Rôdeur'), ico: 'griffes',
      texte: tr('Des griffures corail sur le plan : un Rôdeur rôde dans cette zone. Il se bat 4 tours, puis s’enfuit. Ses blessures restent d’une descente à l’autre : il faut le croiser plusieurs fois pour l’abattre.'),
      conseil: tr('Frappe fort dès le premier tour. Abattu, il laisse un trophée : une carte au choix, et une épithète pour la carte qui l’achève.') });
  }
  if (x.enHalte) {
    r.push({ id: 'halte', sur: tr('PREMIÈRE RENCONTRE'), titre: tr('Une Halte'), ico: 'halte',
      texte: tr('Tous les chemins passent par ici. Pas de combat : un lieu de l’enquête. Chaque Strate pose une question. À chaque Halte, ton choix suit une piste : celle des nôtres (ce que les vivants ont su, caché, payé) ou celle de ceux d’avant (ce que sont les cristaux). La dernière Halte de la Strate te montre ce que ta piste a trouvé, et à −10, la piste que tu as le plus suivie décide de la fin.'),
      conseil: tr('Il n’y a pas de mauvais choix : chaque piste rapporte un peu (Éclat, minerai ou lampe) et dévoile une salle plus loin. Touche d’abord les détails : avec une autre escouade, ils racontent autre chose. Ton carnet, dans la Bibliothèque, garde tout.') });
  }
  if (x.carte.salles.some((s) => !s.faite && reperentPassage(x, s).length)) {
    r.push({ id: 'passage', sur: tr('PREMIÈRE RENCONTRE'), titre: tr('Un passage secret'), ico: 'fissure',
      texte: tr('Un de tes Porteurs repère une fissure que les autres ne voient pas (marque sur le plan). Entre dans cette salle et suis-le : une salle cachée hors du chemin, quelques mots de lui, du minerai et une archive.'),
      conseil: tr('Chaque passage n’est repéré que par certains Porteurs : change d’escouade de temps en temps pour en découvrir d’autres.') });
  }
  if (x.porte) {
    const n = suitePorte(x.strate);
    r.push({ id: 'porte', sur: tr('PREMIÈRE RENCONTRE'), titre: tr('Une porte à Fréquence'), ico: 'porte',
      texte: tr`Une porte ancienne, gravée de Fréquences. Cinq cartes de ton deck sont tirées : choisis-en ${n} dont les Fréquences se suivent, comme une suite en combat (l’Accord ∗ prolonge toute suite). Derrière : un Éclat et du minerai.`,
      conseil: tr('Aucun risque : tu peux retirer la main une fois, ou passer ton chemin si la suite n’y est pas.') });
  }
  if ((x.gagnes ?? 0) >= 1) {
    r.push({ id: 'bestiaire', sur: tr('PREMIÈRE VICTOIRE'), titre: tr('Le bestiaire'), ico: 'codex',
      texte: tr`Chaque ennemi vaincu ouvre sa fiche dans la Bibliothèque, onglet Bestiaire. Elle se complète à force de le battre : d’où il vient (${PALIERS_BESTIAIRE[0]} victoire), comment le battre (${PALIERS_BESTIAIRE[1]}), puis son secret (${PALIERS_BESTIAIRE[2]}).`,
      conseil: tr('Bloqué contre un ennemi ? Sa fiche donne un conseil concret pour le battre.') });
  }
  return r;
}

/** Les découvertes de l'exploration pas encore vues */
export function decouvertesExplorationEnAttente(vues: readonly string[], x: Expedition, quetes?: Record<number, number>): Decouverte[] {
  return decouvertesExploration(x, quetes).filter((d) => !vues.includes(d.id));
}
