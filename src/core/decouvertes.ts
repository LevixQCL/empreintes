// Les premières rencontres (décision du 22 octobre 2026) : la première fois qu'une mécanique apparaît en combat
// (la Fêlure, le Coup d'éclat, un groupe, un trait d'ennemi, une condition de salle, la seconde phase d'un gardien), une fenêtre l'explique
// avec un conseil concret. Une seule fois par partie : ce qui a été vu est gardé dans `Jeu.decouvertes`.
// Aucun DOM ici : l'écran affiche la découverte que renvoie `decouverteEnAttente`.

import { ECLATS, PHASES3, eclatsPossibles, enGroupe, felureVisible, tousEnnemis, traitsEnJeu } from './combat';
import { CONDITIONS, ennemiDef, texteTrait } from './donnees';
import type { CombatEtat, Trait } from './types';

export interface Decouverte {
  id: string;
  /** petit titre au-dessus (« PREMIÈRE RENCONTRE »…) */
  sur: string;
  titre: string;
  texte: string;
  conseil: string;
  /** l'ennemi à montrer en portrait, s'il y en a un */
  ennemi?: string;
}

const CONSEILS_TRAITS: Record<Trait['type'], string> = {
  blinde: 'Les petits coups s’écrasent sur son armure : mise sur des cartes fortes, ou sur Perçant qui passe au travers.',
  regeneration: 'Ne le laisse pas souffler : frappe fort et vite, sinon il remonte à chaque tour.',
  epines: 'Chaque coup te coûte un peu : préfère quelques gros coups à beaucoup de petits, et garde un soin sous la main.',
  evanescent: 'Sans suite, tes coups glissent sur lui : enchaîne des Fréquences qui se suivent (3, 4, 5) pour le toucher pleinement.',
  essaim: 'Il revient plus petit quand il tombe : garde de quoi finir le rejeton.',
  vengeur: 'Si tu abats son allié, il frappera double au tour suivant : protège-toi, ou abats-le en premier.',
  furie: 'Plus il est blessé, plus il frappe fort : une fois sous la moitié de ses PV, achève-le vite.',
  assimilation: 'Il prend la lignée de la dernière carte qui le frappe : finis ta chaîne par la lignée qu’il craint le plus pour le tour suivant, et varie tes coups.',
  aspire: 'Chaque coup qui passe ton bouclier te prend 1 Flux : bloque-le entièrement, ou dépense ton Flux avant qu’il ne frappe.',
};

const CONSEILS_CONDITIONS: Record<string, string> = {
  inondee: 'Les cartes des Génés pèsent plus lourd ici : c’est le moment de les mettre en avant.',
  courants: 'Les cartes des Augmentés pèsent plus lourd ici : c’est le moment de les mettre en avant.',
  chant: 'Les cartes des Résonants pèsent plus lourd ici : c’est le moment de les mettre en avant.',
  echo: 'Une suite de 4 suffit pour le bonus maximal : vise 3-4-5-6.',
  sanctuaire: 'Les soins rendent plus : un bon endroit pour remettre l’escouade sur pied.',
  eboulis: 'Tout le monde s’use à chaque tour, ennemis compris : un combat long coûte cher, finis-le vite.',
  brouillard: 'Tu vois si l’ennemi va attaquer, se protéger ou se réparer, mais pas sur qui ni avec quelle force. Garde du bouclier et des soins pour toute l’escouade.',
};

/** Les découvertes que ce combat peut déclencher, dans l'ordre où les montrer */
export function decouvertesDuCombat(s: CombatEtat): Decouverte[] {
  const r: Decouverte[] = [];
  // d'abord ce qui compte dès le premier coup (la salle, le groupe), puis la Fêlure
  if (s.condition && CONDITIONS[s.condition]) {
    const c = CONDITIONS[s.condition]!;
    r.push({ id: `condition-${c.id}`, sur: 'CONDITION DE SALLE', titre: c.nom, texte: c.texte, conseil: CONSEILS_CONDITIONS[c.id] ?? '' });
  }
  if (enGroupe(s)) {
    r.push({
      id: 'groupe', sur: 'PREMIÈRE RENCONTRE', titre: 'Un groupe d’ennemis',
      texte: 'Chaque ennemi a sa vignette en haut à droite : ses PV, et ce qu’il prépare. Touche une vignette pour le viser : toute ta chaîne le frappe, et s’il tombe en route, le reste passe au suivant.',
      conseil: 'Abats d’abord celui qui fait le plus mal, ou celui qui est presque à terre : un ennemi de moins, c’est une attaque de moins.',
    });
  }
  if (tousEnnemis(s).some((en) => en.pv > 0 && felureVisible(en) && !en.felureBrisee)) {
    r.push({
      id: 'felure', sur: 'PREMIÈRE RENCONTRE', titre: 'La Fêlure',
      texte: 'À côté de son intention, l’ennemi montre une gemme fêlée et une Fréquence. Pose une carte de cette Fréquence dans ta chaîne : son attaque, son bouclier ou son soin se brise (moitié moins fort, un quart chez un gardien ou un blindé ; sans effet sur une Concentration ou une Dissonance). Si ta chaîne fait aussi une suite, ton Flux monte d’un cran. Les cartes de ta main qui la brisent portent la gemme.',
      conseil: 'Une Fêlure brisée vaut souvent mieux qu’une suite de plus : elle protège l’escouade. Glisse-la dans une suite : elle remplit aussi le Flux pour ton Coup d’éclat.',
    });
  }
  const eclats = eclatsPossibles(s);
  if (eclats.length) {
    r.push({
      id: 'eclat', sur: 'FLUX PLEIN', titre: 'Le Coup d’éclat',
      texte: `Ton Flux est plein : le bouton doré « Éclat » remplace ses losanges. Un seul Coup d’éclat par combat, au choix selon les lignées de ton escouade. ${eclats.map((c) => `${ECLATS[c.lignee].nom} : ${ECLATS[c.lignee].texte}`).join(' ')} Il vide le Flux, et le Porteur qui le déclenche prend de l’Usure.`,
      conseil: 'Garder son Flux pour le Coup d’éclat, ou le dépenser tout de suite pour une place ou une nouvelle main : c’est à toi de voir. Méfie-toi des ennemis qui l’aspirent.',
    });
  }
  for (const en of tousEnnemis(s)) {
    if (en.simple || en.pv <= 0) continue;
    const d = ennemiDef(en.id);
    for (const t of traitsEnJeu(en)) {
      // la Furie s'explique quand elle s'allume (sous la moitié des PV), pas avant
      if (t.type === 'furie' && en.pv > en.pvMax / 2) continue;
      const x = texteTrait(t);
      r.push({ id: `trait-${t.type}`, sur: 'TRAIT D’ENNEMI', titre: x.nom, texte: `${d.nom} : ${x.texte}`, conseil: CONSEILS_TRAITS[t.type], ennemi: d.id });
    }
    // 3ᵉ phase (28 octobre 2026) : une découverte par variante
    if (en.phase3Active && en.phase3) {
      const p = PHASES3[en.phase3];
      const renfort = ennemiDef(d.phase?.renforts?.[0] ?? 'remanent').nom;
      r.push({
        id: `phase3-${en.phase3}`, sur: 'GARDIEN · DERNIÈRE PHASE', titre: `${d.nom} : ${p.nom}`,
        texte: `${p.texte(d.nom, renfort)} Au dernier quart de ses PV, un gardien des Strates profondes change encore : sa dernière phase n’est pas toujours la même.`,
        conseil: p.conseil, ennemi: d.id,
      });
    }
    if (en.phase2 && d.phase) {
      r.push({
        id: 'phase', sur: 'GARDIEN', titre: `${d.nom} : ${d.phase.nom}`,
        texte: `${d.phase.texte} À mi-vie, un gardien change de gestes et appelle de l’aide.`,
        conseil: 'Regarde sa nouvelle intention avant de lancer, et décide vite : le gardien, ou son renfort ?', ennemi: d.id,
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
