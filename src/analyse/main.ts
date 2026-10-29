// L'outil d'analyse (analyse.html) : une page à part, jamais chargée par le jeu.
// Connexion Google réservée au compte de Bryan (les règles Firestore le vérifient aussi), lecture de toutes les sauvegardes,
// tableau de bord complet pour l'équilibrage, et exports anonymisés (JSON complet, CSV des joueurs) à envoyer pour une analyse détaillée.

import './analyse.css';
import { initializeApp } from 'firebase/app';
import { GoogleAuthProvider, getAuth, onAuthStateChanged, signInWithPopup, signOut, type User } from 'firebase/auth';
import { collection, getDocs, getFirestore, type Timestamp } from 'firebase/firestore';
import { debutJour, estJeuValide } from '../core/jeu';
import { firebaseConfig } from '../net/firebase-config';
import { echap } from '../ui/outils';
import {
  analyser, csvJoueurs, exporter, filtrer, sansTests,
  type Analyse, type Filtre, type LigneCarte, type LigneEconomie, type LigneEnnemi, type LigneJalon, type LigneJoueur, type LignePorteur, type LigneStrate, type Partie,
} from './calculs';
import { barres, bloc, chaleur, chapitre, colonnes, fr, pct, table, tuile, vide, type Tri } from './vue';

const ADMIN = 'houben.bryan@gmail.com';
// une application Firebase à part : se connecter ici ne change pas le compte avec lequel on joue dans ce navigateur
const fb = initializeApp(firebaseConfig, 'analyse');
const auth = getAuth(fb);
auth.languageCode = 'fr';
const db = getFirestore(fb);
const racine = document.getElementById('analyse') as HTMLElement;

interface Donnees { toutes: Partie[]; tests: number; visites: number; lu: number; filtre: Filtre; parties: Partie[]; a: Analyse; tri: Record<string, Tri> }
type Etat = { quoi: 'connexion' } | { quoi: 'chargement' } | { quoi: 'refus'; email: string } | { quoi: 'erreur'; message: string } | ({ quoi: 'ok' } & Donnees);
let etat: Etat = { quoi: 'chargement' };

const dateJour = (jour: number) => new Date(debutJour(jour)).toLocaleDateString('fr-BE', { day: 'numeric', month: 'short' });
function ilYa(ms: number): string {
  const m = Math.round(ms / 60_000);
  if (m < 2) return 'à l’instant';
  if (m < 60) return `il y a ${m} min`;
  const h = Math.round(m / 60);
  return h < 48 ? `il y a ${h} h` : `il y a ${Math.round(h / 24)} j`;
}
const NOMS_COMPTE: Record<string, string> = { protege: 'Google / e-mail', invisible: 'Invisible', aucun: 'Aucun', '—': '—' };
const NOMS_APPAREIL: Record<string, string> = { telephone: 'Téléphone', pc: 'PC', '—': '—' };

// ---------- Lecture ----------

async function lire(): Promise<Partie[]> {
  const snap = await getDocs(collection(db, 'saves'));
  const l: Partie[] = [];
  snap.forEach((d) => {
    const v = d.data() as { data: string; updatedAt: Timestamp | null };
    try {
      const jeu = JSON.parse(v.data);
      if (estJeuValide(jeu)) l.push({ uid: d.id, jeu, maj: v.updatedAt ? v.updatedAt.toMillis() : 0 });
    } catch { /* sauvegarde illisible : ignorée */ }
  });
  return l;
}

function calculer(toutes: Partie[], tests: number, visites: number, lu: number, filtre: Filtre, tri: Record<string, Tri> = {}): Etat {
  const parties = filtrer(toutes, filtre, lu);
  return { quoi: 'ok', toutes, tests, visites, lu, filtre, parties, a: analyser(parties, lu), tri };
}

async function charger(u: User) {
  if (u.email !== ADMIN) { etat = { quoi: 'refus', email: u.email ?? '' }; afficher(); return; }
  const avant = etat.quoi === 'ok' ? etat : null;
  etat = { quoi: 'chargement' }; afficher();
  try {
    const { parties, tests, visites } = sansTests(await lire());
    etat = calculer(parties, tests, visites, Date.now(), avant?.filtre ?? { periode: 'tout', segment: 'tous' }, avant?.tri);
  } catch (e) {
    const code = (e as { code?: string })?.code ?? '';
    etat = { quoi: 'erreur', message: code === 'permission-denied'
      ? 'Firestore refuse la lecture : la règle de l’outil d’analyse n’est pas encore publiée dans la console Firebase.'
      : `Lecture impossible (${code || String(e).slice(0, 80)}).` };
  }
  afficher();
}

// ---------- Les chapitres ----------

const CHAPITRES: [string, string][] = [
  ['attention', 'À regarder'], ['ensemble', 'Vue d’ensemble'], ['activite', 'Activité'], ['retention', 'Rétention'], ['progression', 'Progression'],
  ['combats', 'Combats'], ['porteurs', 'Porteurs'], ['cartes', 'Cartes'], ['economie', 'Économie'], ['campagne', 'Campagne'], ['fonctions', 'Fonctions'], ['joueurs', 'Joueurs'],
];

function attention(a: Analyse): string {
  if (!a.alertes.length) return vide('Rien de particulier : pas assez de données, ou tout est dans les clous.');
  return `<ul class="an-alertes">${a.alertes.map((x) => `<li class="${x.niveau}"><span class="an-marque">${x.niveau === 'attention' ? '⚠ À vérifier' : 'ℹ À noter'}</span>`
    + `<span class="an-theme">${echap(x.theme)}</span><p>${echap(x.texte)}</p></li>`).join('')}</ul>`;
}

function ensemble(a: Analyse): string {
  return `<div class="an-tuiles">`
    + tuile('Joueurs', fr(a.joueurs), `${fr(a.nouveaux7)} nouveaux en 7 jours`)
    + tuile('Actifs 24 h', fr(a.actifs.jour), pct(a.actifs.jour, a.joueurs))
    + tuile('Actifs 7 jours', fr(a.actifs.semaine), pct(a.actifs.semaine, a.joueurs))
    + tuile('Actifs 30 jours', fr(a.actifs.mois), pct(a.actifs.mois, a.joueurs))
    + tuile('Temps de jeu médian', `${fr(a.mediane.minutes)} min`, `${fr(a.mediane.jours, 1)} jours de jeu · ${fr(a.mediane.sessions, 1)} sessions`)
    + tuile('Session médiane', `${fr(a.mediane.session)} min`, `${fr(a.heuresTotales)} h jouées au total`)
    + `</div>`;
}

function activite(a: Analyse): string {
  const jours = a.parJour.map((d) => ({ valeur: d.actifs, etiquette: dateJour(d.jour), tip: `${dateJour(d.jour)} : ${fr(d.actifs)} joueur${d.actifs > 1 ? 's' : ''} actif${d.actifs > 1 ? 's' : ''}` }));
  const nouveaux = a.parJour.map((d) => ({ valeur: d.nouveaux, etiquette: dateJour(d.jour), tip: `${dateJour(d.jour)} : ${fr(d.nouveaux)} nouveau${d.nouveaux > 1 ? 'x' : ''}` }));
  const totalH = a.heures.reduce((x, y) => x + y, 0);
  const heures = a.heures.map((v, h) => ({ valeur: v, etiquette: `${h} h`, tip: `${h} h – ${h + 1} h : ${fr(v / 3600, 1)} h de jeu (${pct(v, totalH)})` }));
  return bloc('actifs', 'Joueurs actifs par jour', 'Les 30 derniers jours : combien de joueurs ont joué ce jour-là.', colonnes(jours, 5, 'Joueurs actifs par jour'))
    + bloc('nouveaux', 'Nouveaux joueurs par jour', 'Le jour de la première partie.', colonnes(nouveaux, 5, 'Nouveaux joueurs par jour'))
    + bloc('heures', 'Quand joue-t-on ?', 'Le temps de jeu selon l’heure de la journée (heure du téléphone du joueur). Utile pour choisir l’heure des nouveautés.',
      totalH ? colonnes(heures, 3, 'Temps de jeu par heure') : vide('Pas encore de données.'))
    + bloc('durees', 'Durée des sessions', 'Les 30 dernières sessions de chaque joueur.', barres(a.durees))
    + `<div class="an-deux">${bloc('appareils', 'Appareils', '', barres(a.appareils))}${bloc('comptes', 'Comptes', 'Une partie sans compte protégé peut être perdue avec le téléphone.', barres(a.comptes))}</div>`;
}

function retention(a: Analyse): string {
  const lignes = `<ul class="an-barres">${a.retention.map((r) => {
    const nom = `Après ${r.delai} jour${r.delai > 1 ? 's' : ''}`;
    if (!r.eligibles) return `<li><span class="an-nom">${nom}</span><span class="an-attente">pas encore assez de recul</span></li>`;
    const p = (100 * r.revenus) / r.eligibles;
    return `<li data-tip="${nom} : ${fr(r.revenus)} joueurs revenus sur ${fr(r.eligibles)}"><span class="an-nom">${nom}</span>`
      + `<span class="an-piste"><i style="width:${p}%"></i></span><b>${Math.round(p)} %</b><small>${fr(r.revenus)}/${fr(r.eligibles)}</small></li>`;
  }).join('')}</ul>`;
  const cohortes = chaleur(a.cohortes.map((c) => ({ nom: `${dateJour(c.debut)} → ${dateJour(c.debut + 6)}`, detail: fr(c.taille), cases: c.retention })), ['J1', 'J7', 'J14', 'J30']);
  return bloc('retention-globale', 'Combien reviennent', 'Parmi ceux qui ont commencé il y a assez longtemps : combien ont rejoué ce nombre de jours (ou plus) après leur première partie.', lignes)
    + bloc('cohortes', 'Rétention par semaine de début', 'Chaque ligne : les joueurs arrivés cette semaine-là. Une semaine qui retient mieux qu’une autre = une mise à jour qui a plu (ou l’inverse).', cohortes);
}

function progression(e: Donnees): string {
  const a = e.a;
  return bloc('entonnoir', 'Les étapes du jeu', 'Combien de joueurs ont atteint chaque étape. Une forte chute au début = un accueil qui décourage.', barres(a.entonnoir, Math.max(1, a.joueurs)))
    + bloc('objectifs', 'Objectifs guidés', 'Combien ont rempli chaque objectif du début de partie.', barres(a.objectifs, Math.max(1, a.joueurs)))
    + bloc('jalons', 'Temps pour arriver à chaque étape', 'Temps de jeu actif (médiane) au moment où l’étape est atteinte pour la première fois. Le rythme du jeu se règle avec ce tableau.',
      table<LigneJalon>('jalons', [
        { cle: 'nom', nom: 'Étape', val: (x) => x.nom, texte: true },
        { cle: 'joueurs', nom: 'Joueurs', val: (x) => x.joueurs, aff: (x) => fr(x.joueurs) },
        { cle: 'minutes', nom: 'Temps médian', val: (x) => x.minutes, aff: (x) => (x.minutes >= 120 ? `${fr(x.minutes / 60, 1)} h` : `${fr(x.minutes)} min`) },
      ], a.jalons, e.tri.jalons))
    + bloc('strates', 'Où en sont les joueurs', 'La Strate la plus profonde ouverte, par joueur.', barres(a.strates));
}

function combats(e: Donnees): string {
  const a = e.a;
  return bloc('ennemis', 'Combats par ennemi', 'Tous les joueurs additionnés. Touche un en-tête pour trier.',
    table<LigneEnnemi>('ennemis', [
      { cle: 'nom', nom: 'Ennemi', val: (x) => x.nom, texte: true },
      { cle: 'combats', nom: 'Combats', val: (x) => x.combats, aff: (x) => fr(x.combats) },
      { cle: 'joueurs', nom: 'Joueurs', val: (x) => x.joueurs, aff: (x) => fr(x.joueurs) },
      { cle: 'victoires', nom: 'Victoires', val: (x) => x.victoires / Math.max(1, x.combats), aff: (x) => pct(x.victoires, x.combats) },
      { cle: 'defaites', nom: 'Défaites', val: (x) => x.defaites / Math.max(1, x.combats), aff: (x) => pct(x.defaites, x.combats) },
      { cle: 'fuites', nom: 'Fuites', val: (x) => x.fuites / Math.max(1, x.combats), aff: (x) => pct(x.fuites, x.combats) },
      { cle: 'tours', nom: 'Tours moy.', val: (x) => x.tours / Math.max(1, x.combats), aff: (x) => (x.combats ? fr(x.tours / x.combats, 1) : '—') },
    ], a.ennemis, e.tri.ennemis))
    + bloc('expeditions', 'Expéditions par Strate', 'Comment se terminent les descentes (hors combat guidé).',
      table<LigneStrate>('expeditions', [
        { cle: 'strate', nom: 'Strate', val: (x) => x.strate, aff: (x) => `−${x.strate}`, texte: true },
        { cle: 'expeditions', nom: 'Expéditions', val: (x) => x.expeditions, aff: (x) => fr(x.expeditions) },
        { cle: 'gardien', nom: 'Gardien vaincu', val: (x) => x.gardien / Math.max(1, x.expeditions), aff: (x) => pct(x.gardien, x.expeditions) },
        { cle: 'defaites', nom: 'Défaites', val: (x) => x.defaites / Math.max(1, x.expeditions), aff: (x) => pct(x.defaites, x.expeditions) },
        { cle: 'fuites', nom: 'Fuites', val: (x) => x.fuites / Math.max(1, x.expeditions), aff: (x) => pct(x.fuites, x.expeditions) },
        { cle: 'retraites', nom: 'Retraites', val: (x) => x.retraites / Math.max(1, x.expeditions), aff: (x) => pct(x.retraites, x.expeditions) },
      ], a.expeditions, e.tri.expeditions))
    + `<div class="an-deux">${bloc('chaines', 'Longueur des chaînes', 'Le nombre de cartes lancées d’un coup.', barres(a.chaines))}`
    + `${bloc('suites', 'Suites de Fréquences', 'La meilleure suite de chaque chaîne lancée : les joueurs ont-ils compris la Résonance ?', barres(a.suites))}</div>`;
}

function porteurs(e: Donnees): string {
  const a = e.a;
  return bloc('porteurs-table', 'Les Porteurs', 'Présents : combien de joueurs l’ont dans leur district. Expéditions : combien de fois il est descendu.',
    table<LignePorteur>('porteurs', [
      { cle: 'nom', nom: 'Porteur', val: (x) => x.nom, texte: true },
      { cle: 'presents', nom: 'Présents', val: (x) => x.presents, aff: (x) => `${fr(x.presents)} · ${pct(x.presents, a.joueurs)}` },
      { cle: 'niveau', nom: 'Niveau moy.', val: (x) => x.niveau, aff: (x) => (x.presents ? fr(x.niveau, 1) : '—') },
      { cle: 'expeditions', nom: 'Expéditions', val: (x) => x.expeditions, aff: (x) => fr(x.expeditions) },
      { cle: 'gardien', nom: 'Gardien vaincu', val: (x) => x.gardien / Math.max(1, x.expeditions), aff: (x) => pct(x.gardien, x.expeditions) },
    ], a.porteurs, e.tri.porteurs));
}

const NOMS_METAL: Record<string, string> = { fer: 'Fer', cuivre: 'Cuivre', argent: 'Argent', or: 'Or', nacre: 'Nacre' };
function cartes(e: Donnees): string {
  const a = e.a;
  return bloc('cartes-table', 'Les cartes', 'Lancée : combien de fois dans une chaîne. Part : sa part de toutes les cartes lancées. Possédée : combien de joueurs en ont au moins un exemplaire.',
    table<LigneCarte>('cartes', [
      { cle: 'nom', nom: 'Carte', val: (x) => x.nom, texte: true },
      { cle: 'metal', nom: 'Métal d’origine', val: (x) => x.metal, aff: (x) => NOMS_METAL[x.metal] ?? x.metal, texte: true },
      { cle: 'jouee', nom: 'Lancée', val: (x) => x.jouee, aff: (x) => fr(x.jouee) },
      { cle: 'part', nom: 'Part', val: (x) => x.part, aff: (x) => `${fr(x.part * 100, 1)} %` },
      { cle: 'possedee', nom: 'Possédée', val: (x) => x.possedee, aff: (x) => pct(x.possedee, a.joueurs) },
      { cle: 'niveau', nom: 'Niveau moy.', val: (x) => x.niveau, aff: (x) => (x.possedee ? fr(x.niveau, 1) : '—') },
    ], a.cartes, e.tri.cartes))
    + bloc('metaux', 'Les exemplaires par métal', 'Tous les joueurs additionnés.', barres(a.metaux));
}

const NOMS_BATIMENTS: [keyof LigneEconomie['batiments'], string][] = [['noyau', 'Tour'], ['generateur', 'Générateur'], ['forge', 'Forge'], ['clinique', 'Clinique'], ['comptoir', 'Comptoir']];
function economie(e: Donnees): string {
  return bloc('economie-table', 'Ressources et bâtiments selon l’avancée', 'Médianes par groupe de joueurs (selon leur Strate la plus profonde) ; niveau moyen des bâtiments. Des ressources qui s’entassent = rien d’intéressant à acheter.',
    table<LigneEconomie>('economie', [
      { cle: 'tranche', nom: 'Avancée', val: (x) => x.tranche, texte: true },
      { cle: 'joueurs', nom: 'Joueurs', val: (x) => x.joueurs, aff: (x) => fr(x.joueurs) },
      { cle: 'energie', nom: 'Énergie', val: (x) => x.energie, aff: (x) => fr(x.energie) },
      { cle: 'composants', nom: 'Composants', val: (x) => x.composants, aff: (x) => fr(x.composants) },
      { cle: 'eclats', nom: 'Éclats', val: (x) => x.eclats, aff: (x) => fr(x.eclats) },
      { cle: 'creuseurs', nom: 'Creuseurs', val: (x) => x.creuseurs, aff: (x) => fr(x.creuseurs) },
      { cle: 'confiance', nom: 'Confiance', val: (x) => x.confiance, aff: (x) => fr(x.confiance) },
      ...NOMS_BATIMENTS.map(([b, nom]) => ({ cle: b, nom, val: (x: LigneEconomie) => x.batiments[b], aff: (x: LigneEconomie) => fr(x.batiments[b], 1) })),
    ], e.a.economie, e.tri.economie));
}

function campagne(a: Analyse): string {
  if (!a.campagne.length) return vide('Aucun joueur n’a encore pris de décision de campagne.');
  return `<div class="an-deux">${a.campagne.map((c, i) => bloc(`choix-${i}`, c.titre, '', barres(c.lignes))).join('')}</div>`;
}

function fonctions(a: Analyse): string {
  return bloc('fonctions-part', 'Qui utilise quoi', 'Part des joueurs (avec statistiques de boutons) qui ont utilisé chaque fonction au moins une fois. Une fonction peu utilisée est peut-être mal expliquée.', barres(a.fonctions))
    + bloc('actions', 'Les boutons les plus touchés', 'Tous les joueurs additionnés (les 30 premiers) : la navigation réelle dans le jeu.', barres(a.actions))
    + bloc('eclats', 'Les Coups d’éclat', 'Tous les joueurs additionnés. Si « dont avec un deck du Moteur » reste très bas alors que le Moteur est joué (cartes Décharge dans « Cartes »), la Décharge a fait oublier le Débridage.', barres(a.eclats));
}

function joueurs(e: Donnees): string {
  return bloc('joueurs-table', 'Les joueurs', 'Sans nom ni compte : un numéro par joueur, le même dans le CSV.',
    table<LigneJoueur>('joueurs', [
      { cle: 'joueur', nom: 'N°', val: (x) => x.joueur, texte: true },
      { cle: 'strate', nom: 'Strate', val: (x) => x.strate, aff: (x) => `−${x.strate}` },
      { cle: 'minutes', nom: 'Temps', val: (x) => x.minutes, aff: (x) => (x.minutes >= 120 ? `${fr(x.minutes / 60, 1)} h` : `${fr(x.minutes)} min`) },
      { cle: 'sessions', nom: 'Sessions', val: (x) => x.sessions, aff: (x) => fr(x.sessions) },
      { cle: 'jours', nom: 'Jours', val: (x) => x.jours, aff: (x) => fr(x.jours) },
      { cle: 'derniere', nom: 'Dernière partie', val: (x) => x.derniere, aff: (x) => ilYa(e.lu - x.derniere) },
      { cle: 'appareil', nom: 'Appareil', val: (x) => x.appareil, aff: (x) => NOMS_APPAREIL[x.appareil] ?? x.appareil, texte: true },
      { cle: 'compte', nom: 'Compte', val: (x) => x.compte, aff: (x) => NOMS_COMPTE[x.compte] ?? x.compte, texte: true },
      { cle: 'cartes', nom: 'Cartes', val: (x) => x.cartes, aff: (x) => fr(x.cartes) },
      { cle: 'porteurs', nom: 'Porteurs', val: (x) => x.porteurs, aff: (x) => fr(x.porteurs) },
      { cle: 'noyau', nom: 'Tour', val: (x) => x.noyau, aff: (x) => fr(x.noyau) },
      { cle: 'heritage', nom: 'Héritage', val: (x) => x.heritage, aff: (x) => x.heritage, texte: true },
      { cle: 'descente', nom: 'Descente', val: (x) => x.descente, aff: (x) => (x.descente ? (x.descente > 0 ? `−${x.descente}` : 'oui') : '—') },
    ], e.a.liste, e.tri.joueurs, 200));
}

function tableauDeBord(e: Donnees): string {
  const a = e.a;
  const f = e.filtre;
  const option = (v: string, nom: string, actuel: string) => `<option value="${v}"${v === actuel ? ' selected' : ''}>${nom}</option>`;
  return `<div class="an-barre-outils">`
    + `<label>Joueurs actifs<select data-filtre="periode">${option('tout', 'depuis le début', f.periode)}${option('30', 'ces 30 jours', f.periode)}${option('7', 'ces 7 jours', f.periode)}</select></label>`
    + `<label>Groupe<select data-filtre="segment">${option('tous', 'tous', f.segment)}${option('telephone', 'sur téléphone', f.segment)}${option('pc', 'sur PC', f.segment)}`
    + `${option('protege', 'compte Google / e-mail', f.segment)}${option('invisible', 'compte invisible', f.segment)}${option('aucun', 'sans compte', f.segment)}</select></label>`
    + `<span class="an-compte-filtre">${fr(e.parties.length)} joueur${e.parties.length > 1 ? 's' : ''} sur ${fr(e.toutes.length)}</span></div>`
    + `<nav class="an-nav" aria-label="Chapitres">${CHAPITRES.map(([id, nom]) => `<a href="#${id}">${nom}${id === 'attention' && a.alertes.length ? ` <b>${a.alertes.length}</b>` : ''}</a>`).join('')}</nav>`
    + chapitre('attention', 'À regarder', attention(a))
    + chapitre('ensemble', 'Vue d’ensemble', ensemble(a))
    + chapitre('activite', 'Activité', activite(a))
    + chapitre('retention', 'Rétention', retention(a))
    + chapitre('progression', 'Progression', progression(e))
    + chapitre('combats', 'Combats', combats(e))
    + chapitre('porteurs', 'Porteurs', porteurs(e))
    + chapitre('cartes', 'Cartes', cartes(e))
    + chapitre('economie', 'Économie', economie(e))
    + chapitre('campagne', 'Campagne', campagne(a))
    + chapitre('fonctions', 'Fonctions', fonctions(a))
    + chapitre('joueurs', 'Joueurs', joueurs(e))
    + `<p class="an-pied">Lu le ${new Date(e.lu).toLocaleString('fr-BE')} · ${fr(e.toutes.length)} sauvegardes${e.tests ? ` (${fr(e.tests)} parties de test écartées)` : ''}${e.visites ? ` · ${fr(e.visites)} visite${e.visites > 1 ? 's' : ''} sans partie commencée écartée${e.visites > 1 ? 's' : ''}` : ''}`
    + `${a.sansStats ? ` · ${fr(a.sansStats)} sans statistiques (d’avant le 25 octobre 2026)` : ''} · les statistiques sont calculées sur l’appareil des joueurs : un tricheur peut les fausser.</p>`;
}

function afficher() {
  const y = window.scrollY;
  let h = `<header class="an-tete"><div><span class="an-sur">EMPREINTES · OUTIL D’ANALYSE</span><h1>Le jeu en chiffres</h1></div>`;
  if (etat.quoi === 'ok') {
    h += `<div class="an-actions"><button type="button" class="an-btn" data-action="actualiser">Actualiser</button>`
      + `<button type="button" class="an-btn" data-action="csv">Joueurs (CSV)</button>`
      + `<button type="button" class="an-btn prim" data-action="exporter">Exporter tout (JSON)</button></div>`;
  }
  h += `</header>`;
  if (etat.quoi === 'connexion') h += `<div class="an-centre"><p>Réservé au compte ${ADMIN}.</p><button type="button" class="an-btn prim" data-action="connexion">Se connecter avec Google</button></div>`;
  else if (etat.quoi === 'chargement') h += `<div class="an-centre"><p>Lecture des sauvegardes…</p></div>`;
  else if (etat.quoi === 'refus') h += `<div class="an-centre"><p>${echap(etat.email)} n’a pas accès à l’outil d’analyse.</p><button type="button" class="an-btn" data-action="deconnexion">Changer de compte</button></div>`;
  else if (etat.quoi === 'erreur') h += `<div class="an-centre"><p>${echap(etat.message)}</p><button type="button" class="an-btn" data-action="actualiser">Réessayer</button></div>`;
  else h += tableauDeBord(etat);
  racine.innerHTML = h;
  window.scrollTo(0, y);
}

// ---------- Exports ----------

function telecharger(nom: string, contenu: string, type: string) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([contenu], { type }));
  a.download = nom;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}
const jourFichier = () => new Date().toISOString().slice(0, 10);

// ---------- Gestes ----------

racine.addEventListener('click', async (ev) => {
  const b = (ev.target as HTMLElement).closest<HTMLElement>('[data-action]');
  if (!b) return;
  const action = b.dataset.action;
  if (action === 'connexion') await signInWithPopup(auth, new GoogleAuthProvider()).catch((e) => { etat = { quoi: 'erreur', message: `Connexion impossible (${(e as { code?: string })?.code ?? 'erreur'}).` }; afficher(); });
  else if (action === 'deconnexion') await signOut(auth);
  else if (action === 'actualiser' && auth.currentUser) await charger(auth.currentUser);
  else if (etat.quoi !== 'ok') return;
  else if (action === 'exporter') telecharger(`empreintes-stats-${jourFichier()}.json`, JSON.stringify(exporter(etat.parties, Date.now()), null, 1), 'application/json');
  else if (action === 'csv') telecharger(`empreintes-joueurs-${jourFichier()}.csv`, '﻿' + csvJoueurs(etat.a.liste), 'text/csv;charset=utf-8');
  else if (action === 'trier') {
    const id = b.dataset.table!; const cle = b.dataset.cle!;
    const avant = etat.tri[id];
    etat.tri = { ...etat.tri, [id]: { cle, desc: avant?.cle === cle ? !avant.desc : true } };
    afficher();
  }
});

racine.addEventListener('change', (ev) => {
  const s = ev.target as HTMLSelectElement;
  if (etat.quoi !== 'ok' || !s.dataset.filtre) return;
  const filtre = { ...etat.filtre, [s.dataset.filtre]: s.value } as Filtre;
  etat = calculer(etat.toutes, etat.tests, etat.visites, etat.lu, filtre, etat.tri);
  afficher();
});

onAuthStateChanged(auth, (u) => {
  if (u) void charger(u);
  else { etat = { quoi: 'connexion' }; afficher(); }
});
afficher();

// pour voir le tableau de bord sans compte pendant le développement : __apercu(parties) (absent du site publié)
if (import.meta.env.DEV) Object.assign(window, { __apercu: (parties: Partie[]) => { etat = calculer(parties, 0, 0, Date.now(), { periode: 'tout', segment: 'tous' }); afficher(); } });
