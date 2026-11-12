// Le combat à l'écran : la fenêtre de fin, les chiffres qui jaillissent, et l'animation des coups.

import { rodeurDef } from '../core/explorer';
import * as C from '../core/combat';
import { ennemiDef } from '../core/donnees';
import { nomEcho } from '../core/regles';
import * as J from '../core/jeu';
import type { CombatEtat, Evenement, Pas } from '../core/types';
// les animations du combat (ui/impact, ≈ 25 Ko compressés) ne partent pas au démarrage : elles arrivent
// dès qu'une descente commence (prechargerImpacts) et, au pire, au premier coup joué
let fx: typeof import('../ui/impact') | null = null;
let fxCharge: Promise<typeof import('../ui/impact')> | null = null;
export function prechargerImpacts(): Promise<typeof import('../ui/impact')> {
  fxCharge ??= import('../ui/impact').then((m) => (fx = m)).catch((e) => { fxCharge = null; throw e; });
  return fxCharge;
}
import type { Fin } from '../ui/vue';
import { app, K, pause, racine, reduit } from './etat';
import { afficher } from './rendu';
import { montrerPop, type Voie } from '../ui/pops';
import { sauver } from './synchro';

/** les effets que le moteur nomme par un mot fixe (impact.ts s'en sert pour choisir l'animation) : affichés traduits */
const EFFETS_AFFICHES: Record<string, string> = { Fissure: t('Fissure'), Troublé: t('Troublé'), Élan: t('Élan'), Dissonance: t('Dissonance') };
import { t } from '../core/i18n';

// ---------- Combat ----------

export function finPour(): Fin | null {
  const x = app.jeu.expedition;
  if (!x) return null;
  const s = x.combat;
  if (x.carte && x.phase === 'carte') return null;
  if (x.tutoriel) {
    if (s.issue === 'victoire') return { titre: t('La porte cède'), texte: t('Le gardien se dissipe en poussière lumineuse. Derrière lui, des cristaux aux souvenirs mélangés, et un vieux papier tamponné.'), bouton: t('Remonter avec ce qu’on a trouvé'), action: 'remonter' };
    if (s.issue === 'defaite') return { issue: 'defaite', titre: t('Repoussés'), texte: t('Le gardien a eu le dessus, cette fois. Vise les suites et protège-toi quand il annonce une grosse attaque.'), bouton: t('Remonter et réessayer'), action: 'remonter' };
    return null;
  }
  if (x.fleche?.defi) {
    const q = x.fleche.quai;
    const nom = x.fleche.gardien?.nom ?? t('le gardien');
    if (s.issue === 'victoire') return { titre: t`Le quai ${q} est à toi`, texte: t`L’escouade de ${nom} cède la passerelle. Une copie de ton escouade y monte la garde ; les Hauts te versent le gage du quai.`, bouton: t('Prendre le quai'), action: 'remonter' };
    if (s.issue === 'defaite') return { titre: t`${nom} tient bon`, texte: t`Le quai ${q} reste à ${nom}. Ta montée, elle, ne bouge pas : seule l’Usure compte.`, bouton: t('Rentrer au district'), action: 'remonter' };
    return null;
  }
  if (x.fleche) {
    const q = x.fleche.quai;
    const f = J.etatFleche(app.jeu);
    if (s.issue === 'victoire') return { titre: t`Le quai ${q} est à toi`, texte: t`Les gardiens des Hauts s’écartent de la passerelle. L’escouade monte au quai ${Math.min(J.FLECHE.quais, q + J.pas(q))}.`, bouton: t('Prendre le quai'), action: 'remonter' };
    if (s.issue === 'defaite') {
      const bas = Math.max(J.plancher(f.record), q - J.pas(q));
      return { issue: 'defaite', titre: t('Repoussés sur la passerelle'), texte: t`Les gardiens du quai ${q} tiennent bon.${bas < q ? t` L’escouade redescend au quai ${bas}.` : t(' L’escouade garde son quai gravé.')} Une escouade mieux montée, ou mieux reposée, passera.`, bouton: t('Rentrer au district'), action: 'remonter' };
    }
    return null;
  }
  if (x.pillage) {
    const p = x.pillage;
    if (s.issue === 'victoire') return { titre: t`${p.nom} est pillé`, texte: t`La garnison se replie. L’escouade rapporte ${p.base + p.vol} minerai${p.vol ? t`, dont ${p.vol} pris à son coffre` : ''}.`, bouton: t('Rentrer avec le butin'), action: 'remonter' };
    if (s.issue === 'defaite') {
      const perte = Math.floor(J.etatPillage(app.jeu).coffre * J.PILLAGE.perteDefaite);
      return { issue: 'defaite', titre: t('Repoussés par la garnison'), texte: t`${p.nom} tient bon.${perte ? t` L’escouade laisse ${perte} minerai de son coffre en repartant.` : ''} Une garnison plus faible, ou une escouade mieux montée, passera.`, bouton: t('Rentrer au district'), action: 'remonter' };
    }
    return null;
  }
  if (x.epreuve) {
    const ep = J.epreuveDef(x.epreuve);
    const nom = s.autres?.length ? t('Le groupe') : ennemiDef(s.ennemi.id).nom;
    // « Le couloir sans halte » : on enchaîne, sans PV rendus
    if (s.issue === 'victoire' && !x.terminee) return { titre: t`Combat ${x.index + 1} sur ${x.sequence.length}`, texte: t`${nom} se dissipe. Pas de halte : l’escouade garde ses blessures et avance vers le combat suivant.`, bouton: t('Combat suivant'), action: 'suivant' };
    if (s.issue === 'victoire') {
      const deja = J.epreuveReussie(app.jeu, x.epreuve, false) && (!x.felee || J.epreuveReussie(app.jeu, x.epreuve, true));
      const gain = deja ? t(' Tu l’avais déjà réussie cette semaine : pas de nouvelle récompense.')
        : x.felee && !J.epreuveReussie(app.jeu, x.epreuve, false) ? t` Fêlée du premier coup : deux cartes au choix et ${J.FELEE.eclats} Éclats t’attendent au district.`
        : x.felee ? t` Une carte au choix et ${J.FELEE.eclats} Éclats t’attendent au district.` : t(' Une carte au choix t’attend au district. La Fêlée est ouverte.');
      return { titre: x.felee ? t('Épreuve Fêlée réussie') : t('Épreuve réussie'), texte: t`${ep?.nom ?? t('L’Épreuve')} : ${nom} se dissipe.${gain}`, bouton: t('Remonter au district'), action: 'remonter' };
    }
    if (s.issue === 'defaite') {
      const pourquoi = s.chrono && s.tour > s.chrono ? t`${ennemiDef(s.ennemi.id).nom} s’éteint dans le noir avant de tomber : il fallait frapper plus vite.`
        : s.sansChute && C.vivants(s).length ? t('Un Porteur est tombé : l’Épreuve demandait que personne ne reste au fond.')
        : t('L’escouade a été repoussée.');
      return { titre: t('Épreuve manquée'), texte: t`${pourquoi} Tu peux la retenter quand tu veux cette semaine.`, bouton: t('Remonter au district'), action: 'remonter' };
    }
    return null;
  }
  if (s.issue === 'defaite') {
    return { issue: 'defaite', titre: t('Défaite'), texte: t`Toute l’escouade est à terre. Elle remonte avec un tiers du butin (${Math.floor(x.butin * J.DISTRICT.butinDefaite)} minerai) et devra se reposer à la Clinique.`, bouton: t('Remonter au district'), action: 'remonter' };
  }
  if (s.issue === 'victoire') {
    const nom = s.autres?.length ? t('Le groupe') : ennemiDef(s.ennemi.id).nom;
    if (x.terminee) {
      return { titre: t`Strate −${x.strate} vaincue`, texte: t`${nom} se disperse. L’escouade remonte avec ${x.butin} minerai.${x.strate === app.jeu.strate ? t(' Le passage est libre : avec assez de creuseurs, l’étage suivant pourra être percé (voir la Tour du Noyau).') : ''}`, bouton: t('Remonter au district'), action: 'remonter' };
    }
    // le Rôdeur (explorer.ts) : enfui, il garde ses blessures ; abattu, son trophée attend au district
    if (x.carte && s.enfui) return { titre: t`${nom} s’enfuit`, texte: t`${rodeurDef(s.ennemi.id)?.fuite ?? ''} Il ne lui reste que ${Math.round((s.ennemi.pv / s.ennemi.pvMax) * 100)} % de sa vie : ses blessures resteront jusqu’à la prochaine rencontre. Butin : ${x.butin} minerai.`, bouton: t('Retour à la carte'), action: 'suivant' };
    if (x.carte && rodeurDef(s.ennemi.id)) return { titre: t`${nom} tombe`, texte: t`${rodeurDef(s.ennemi.id)!.chute} Son trophée t’attend au district : une carte au choix. Butin : ${x.butin} minerai.`, bouton: t('Retour à la carte'), action: 'suivant' };
    if (x.carte) {
      // la marque de la quête relevée se dit tout de suite, avec ce qu'on a trouvé (31 octobre 2026)
      const q = x.carte.salles[x.carte.position]?.quete ? J.etapeQueteTrouvee(app.jeu, x.strate) : null;
      return { issue: 'victoire', titre: q ? t('Victoire · marque de la quête relevée') : t('Victoire'), texte: (q ? t`✦ ${q.nom}, étape ${q.etape} sur ${q.total} : ${q.texte} ` : '') + t`${nom} se dissipe. Butin : ${x.butin} minerai. L’escouade reprend sa route : les PV remontent surtout aux campements.`, bouton: t('Retour à la carte'), action: 'suivant' };
    }
    return { issue: 'victoire', titre: t('Victoire'), texte: t`${nom} se dissipe. Butin : ${x.butin} minerai. L’escouade souffle un peu (+50 % de PV) : tu continues, ou tu remontes avec ce que tu as ?`, bouton: t('Combat suivant'), action: 'suivant', bouton2: t('Remonter avec le butin'), action2: 'remonter' };
  }
  return null;
}

/**
 * Les chiffres qui jaillissent (pops.ts) : sur un calque à part, rangés autour de leur cible.
 * Ils se posent après le redessin de l'étape : l'écu du portrait ou la jauge de Flux sont alors à leur place.
 */
function popsDe(ev: Evenement, etat?: CombatEtat) {
  const pop = (cible: string, texte: string, couleur: string, o: { echelle?: number; voie?: Voie; ou?: string } = {}) => montrerPop(racine, { cible, texte, couleur, reduit, ...o });
  // dans un groupe, ce qui touche un ennemi qui n'est pas visé s'affiche sur sa vignette
  if ('rang' in ev && ev.rang !== undefined && 'cible' in ev && ev.cible === 'ennemi' && etat?.autres?.length && (etat.ennemi.rang ?? 0) !== ev.rang) {
    ev = { ...ev, cible: `ennemi-${ev.rang}` } as Evenement;
  }
  // un coup sur l'ennemi grossit avec sa place dans la chaîne et avec sa taille : la fin d'une suite se lit de loin
  if (ev.kind === 'degats') pop(ev.cible, ev.net ? `−${ev.net}` : t('bloqué'), 'var(--danger)', { echelle: ev.cible === 'ennemi' && ev.net ? Math.min(2, 1 + 0.18 * (K.actif ?? 0) + (ev.net >= 25 ? 0.25 : 0) + (ev.net >= 45 ? 0.2 : 0)) : 1 });
  // le bouclier de l'escouade s'écrit sur l'écu du portrait qui le porte
  else if (ev.kind === 'bouclier') pop(ev.cible, `+${ev.v}`, 'var(--ivory)', ev.cible === 'escouade' ? { ou: '.escouade-combat .ecu-tuile' } : { voie: 'info' });
  else if (ev.kind === 'soin' && ev.v) pop(ev.cible, `+${ev.v}`, 'var(--bio)');
  else if (ev.kind === 'echo') pop('escouade', nomEcho(ev.n ?? 3), 'var(--gold)', { echelle: (ev.n ?? 3) >= 5 ? 1.6 : (ev.n ?? 3) >= 4 ? 1.3 : 1 });
  else if (ev.kind === 'effet' && ev.texte === 'Fissure') {
    // la Fissure se lit de loin (12 novembre 2026, Bryan : « presque pas visible ») : en grand, avec ce qu'elle ajoute,
    // sur la ligne au-dessus du point d'impact (elle ne passe plus sous les chiffres des dégâts)
    const en = etat && C.tousEnnemis(etat).find((e) => (e.rang ?? 0) === (ev.rang ?? 0));
    pop(ev.cible, en?.fissure ? t`Fissure +${Math.round(en.fissure * 100)} %` : t('Fissure'), 'var(--gold)', { echelle: 2, voie: 'info' });
  } else if (ev.kind === 'effet') pop(ev.cible, EFFETS_AFFICHES[ev.texte] ?? ev.texte, 'var(--gold)', { voie: 'info' });
  // le Flux gagné s'écrit sur sa jauge
  else if (ev.kind === 'flux') pop('escouade', t`+${ev.gain} Flux`, 'var(--gold)', { ou: '.flux .jf-tube', voie: 'info' });
}

/** le temps laissé aux cartes jouées pour partir à la défausse, avant que l'ennemi ne réponde (ms) */
const RANGEMENT = 420;

export async function jouer(pas: Pas[], rapide = false) {
  K.verrou = true;
  app.rapide = rapide;
  // sans réseau et sans le module en cache, le combat se joue quand même, sans les animations
  const f = fx ?? await prechargerImpacts().catch(() => null);
  f?.initImpacts(reduit, rapide);
  const vite = () => (app.rapide ? 0.35 : 1);
  let bonus = 0;
  // les fondus (12 novembre 2026) : la pastille de Fissure et la plaque d'intention changent en douceur, sans effet par-dessus
  K.fondus = {};
  for (let i = 0; i < pas.length; i++) {
    const p = pas[i]!;
    const avant = i ? pas[i - 1]!.etat : null;
    // la chaîne a fini de parler : ses cartes partent à la défausse, l'écran souffle un instant, puis l'ennemi répond
    // (12 novembre 2026 : la riposte s'affichait alors que le dernier coup du joueur était encore à l'écran)
    const range = !!avant && avant.chaine.length > 0 && !p.etat.chaine.length && p.ev.kind !== 'fin';
    if (range) {
      // le dernier coup a le temps de porter, puis la table se vide
      await pause((420 + bonus) * vite());
      K.etat = { ...avant!, chaine: p.etat.chaine, main: p.etat.main, pioche: p.etat.pioche, defausse: p.etat.defausse };
      K.actif = undefined;
      afficher();
      await pause(RANGEMENT * vite());
      bonus = 0;
    }
    const base = range ? 120 : p.ev.kind === 'carte' ? 130 : p.ev.kind === 'resonance' ? 250 : p.ev.kind === 'degats' && p.ev.cible === 'ennemi' ? 300 : 380;
    await pause((base + bonus) * vite());
    // le coup d'un ennemi met du temps à arriver (élan, trajet) : on lance son geste d'abord, et le résultat
    // (chiffre, jauge, bouclier entamé) ne s'affiche qu'au moment où il porte
    const tardif = !!f && p.ev.kind === 'degats' && p.ev.cible !== 'ennemi';
    if (tardif) await pause(f!.impact(p.ev, racine));
    // la jauge touchée garde une traînée de ses PV d'avant le coup, qui se vide
    if (p.ev.kind === 'degats' && p.ev.net > 0) {
      const etatAvant = K.etat ?? app.jeu.expedition?.combat;
      const cible = p.ev.cible;
      const ev = p.ev;
      const c = cible === 'ennemi' ? (etatAvant && C.tousEnnemis(etatAvant).find((e) => (e.rang ?? 0) === (ev.rang ?? 0))) ?? etatAvant?.ennemi : etatAvant?.porteurs.find((x) => x.id === cible);
      if (c) {
        K.traces[cible] = Math.max(0, Math.min(100, (100 * c.pv) / c.pvMax));
        setTimeout(() => { delete K.traces[cible]; }, 1100);
      }
    }
    if (avant && (avant.ennemi.rang ?? 0) === (p.etat.ennemi.rang ?? 0) && p.etat.ennemi.pv > 0) {
      if (!avant.ennemi.fissure && p.etat.ennemi.fissure) K.fondus.fissure = Date.now();
      if (!avant.ennemi.felureBrisee && p.etat.ennemi.felureBrisee) K.fondus.felure = { ne: Date.now(), avant };
    }
    K.etat = p.etat;
    if (p.ev.kind === 'carte') K.actif = p.ev.rang;
    else if (p.ev.kind === 'fin' || (p.ev.kind === 'degats' && p.ev.cible !== 'ennemi' && !p.ev.source)) K.actif = undefined;
    afficher();
    popsDe(p.ev, p.etat);
    bonus = tardif ? 0 : f ? f.impact(p.ev, racine) : 0;
  }
  await pause(300 + bonus * vite());
  K.actif = undefined;
  K.etat = null;
  if (app.jeu.expedition && app.jeu.expedition.combat.issue !== 'en-cours') J.finDeCombat(app.jeu);
  K.fin = finPour();
  K.verrou = false;
  sauver();
  afficher();
}

/**
 * Fuir : l'attaque annoncée touche pendant la fuite. On la joue comme un vrai coup (traînée de la jauge, chiffres, secousse),
 * puis on quitte l'écran de combat. L'état du combat n'est pas modifié ici : jeu.ts applique le même coup.
 */
export async function jouerFuite() {
  const s = app.jeu.expedition?.combat;
  if (!s) return;
  const { coups } = C.coupDeFuite(s);
  K.fuite = false;
  const pas: Pas[] = [];
  let etat = structuredClone(s);
  for (const c of coups) {
    etat = structuredClone(etat);
    const p = etat.porteurs.find((q) => q.id === c.id)!;
    p.pv = Math.max(0, p.pv - c.net);
    etat.bouclier = Math.max(0, etat.bouclier - c.absorbe);
    pas.push({ ev: { kind: 'degats', cible: c.id, net: c.net, absorbe: c.absorbe }, etat });
    if (p.pv <= 0) { p.aTerre = true; pas.push({ ev: { kind: 'a-terre', cible: c.id }, etat }); }
  }
  if (pas.length) await jouer(pas);
}
