// L'outil d'analyse (analyse.html) : une page à part, jamais chargée par le jeu.
// Connexion Google réservée au compte de Bryan (les règles Firestore le vérifient aussi), lecture de toutes les sauvegardes,
// tableaux pour l'équilibrage, et export anonymisé à envoyer pour une analyse détaillée.

import './analyse.css';
import { initializeApp } from 'firebase/app';
import { GoogleAuthProvider, getAuth, onAuthStateChanged, signInWithPopup, signOut, type User } from 'firebase/auth';
import { collection, getDocs, getFirestore, type Timestamp } from 'firebase/firestore';
import { debutJour, estJeuValide } from '../core/jeu';
import { firebaseConfig } from '../net/firebase-config';
import { echap } from '../ui/outils';
import { analyser, exporter, sansTests, type Analyse, type Ligne, type Partie } from './calculs';

const ADMIN = 'houben.bryan@gmail.com';
// une application Firebase à part : se connecter ici ne change pas le compte avec lequel on joue dans ce navigateur
const fb = initializeApp(firebaseConfig, 'analyse');
const auth = getAuth(fb);
auth.languageCode = 'fr';
const db = getFirestore(fb);
const racine = document.getElementById('analyse') as HTMLElement;

type Etat = { quoi: 'connexion' } | { quoi: 'chargement' } | { quoi: 'refus'; email: string } | { quoi: 'erreur'; message: string }
  | { quoi: 'ok'; parties: Partie[]; a: Analyse; lu: number; tests: number };
let etat: Etat = { quoi: 'chargement' };

const fr = (n: number) => n.toLocaleString('fr-BE');
const pct = (n: number, sur: number) => (sur ? `${Math.round((100 * n) / sur)} %` : '—');
const dateJour = (jour: number) => new Date(debutJour(jour)).toLocaleDateString('fr-BE', { day: 'numeric', month: 'short' });

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

async function charger(u: User) {
  if (u.email !== ADMIN) { etat = { quoi: 'refus', email: u.email ?? '' }; afficher(); return; }
  etat = { quoi: 'chargement' }; afficher();
  try {
    const { parties, tests } = sansTests(await lire());
    const now = Date.now();
    etat = { quoi: 'ok', parties, a: analyser(parties, now), lu: now, tests };
  } catch (e) {
    const code = (e as { code?: string })?.code ?? '';
    etat = { quoi: 'erreur', message: code === 'permission-denied'
      ? 'Firestore refuse la lecture : la règle de l’outil d’analyse n’est pas encore publiée dans la console Firebase.'
      : `Lecture impossible (${code || String(e).slice(0, 80)}).` };
  }
  afficher();
}

// ---------- Les morceaux de la page ----------

const tuile = (nom: string, valeur: string, detail = '') =>
  `<div class="an-tuile"><span>${nom}</span><b>${valeur}</b>${detail ? `<small>${detail}</small>` : ''}</div>`;

/** Barres horizontales, une ligne par valeur, triées comme on les donne ; sur = la valeur qui remplit la barre */
function barres(l: Ligne[], sur = Math.max(1, ...l.map((x) => x.valeur))): string {
  return `<ul class="an-barres">${l.map((x) => `<li data-tip="${echap(x.nom)} : ${fr(x.valeur)}${x.detail ? ` · ${x.detail}` : ''}">`
    + `<span class="an-nom">${echap(x.nom)}</span><span class="an-piste"><i style="width:${(100 * x.valeur) / sur}%"></i></span>`
    + `<b>${fr(x.valeur)}</b>${x.detail ? `<small>${x.detail}</small>` : ''}</li>`).join('')}</ul>`;
}

/** Les 14 derniers jours : une colonne par jour (joueurs actifs), les nouveaux dans l'infobulle */
function colonnes(a: Analyse): string {
  const max = Math.max(1, ...a.parJour.map((d) => d.actifs));
  return `<div class="an-colonnes" role="img" aria-label="Joueurs actifs par jour sur 14 jours">${a.parJour.map((d, i) =>
    `<div class="an-col" data-tip="${dateJour(d.jour)} : ${fr(d.actifs)} actif${d.actifs > 1 ? 's' : ''}, ${fr(d.nouveaux)} nouveau${d.nouveaux > 1 ? 'x' : ''}">`
    + `<i style="height:${(100 * d.actifs) / max}%"></i><span>${i % 2 === 1 || i === 13 ? dateJour(d.jour) : ''}</span></div>`).join('')}</div>`;
}

function tableEnnemis(a: Analyse): string {
  if (!a.ennemis.length) return `<p class="an-vide">Pas encore de combat enregistré.</p>`;
  return `<div class="an-table"><table><thead><tr><th>Ennemi</th><th>Combats</th><th>Victoires</th><th>Défaites</th><th>Fuites</th><th>Tours moy.</th></tr></thead><tbody>`
    + a.ennemis.map((e) => `<tr><td>${echap(e.nom)}</td><td>${fr(e.combats)}</td><td>${pct(e.victoires, e.combats)}</td><td>${pct(e.defaites, e.combats)}</td>`
      + `<td>${pct(e.fuites, e.combats)}</td><td>${e.combats ? (e.tours / e.combats).toFixed(1).replace('.', ',') : '—'}</td></tr>`).join('')
    + `</tbody></table></div>`;
}

function tableStrates(a: Analyse): string {
  if (!a.expeditions.length) return `<p class="an-vide">Pas encore d’expédition enregistrée.</p>`;
  return `<div class="an-table"><table><thead><tr><th>Strate</th><th>Expéditions</th><th>Gardien vaincu</th><th>Défaites</th><th>Fuites</th><th>Retraites</th></tr></thead><tbody>`
    + a.expeditions.map((s) => `<tr><td>−${s.strate}</td><td>${fr(s.expeditions)}</td><td>${pct(s.gardien, s.expeditions)}</td><td>${pct(s.defaites, s.expeditions)}</td>`
      + `<td>${pct(s.fuites, s.expeditions)}</td><td>${pct(s.retraites, s.expeditions)}</td></tr>`).join('')
    + `</tbody></table></div>`;
}

const bloc = (titre: string, aide: string, contenu: string) =>
  `<section class="an-bloc"><h2>${titre}</h2>${aide ? `<p class="an-aide">${aide}</p>` : ''}${contenu}</section>`;

function tableauDeBord(e: Extract<Etat, { quoi: 'ok' }>): string {
  const a = e.a;
  return `<div class="an-tuiles">`
    + tuile('Joueurs', fr(a.joueurs), a.sansStats ? `dont ${fr(a.sansStats)} sans statistiques (avant le 25 octobre)` : '')
    + tuile('Actifs 24 h', fr(a.actifs.jour), pct(a.actifs.jour, a.joueurs))
    + tuile('Actifs 7 jours', fr(a.actifs.semaine), pct(a.actifs.semaine, a.joueurs))
    + tuile('Actifs 30 jours', fr(a.actifs.mois), pct(a.actifs.mois, a.joueurs))
    + tuile('Temps de jeu médian', `${fr(a.mediane.minutes)} min`, `${fr(a.mediane.sessions)} sessions · ${fr(a.mediane.jours)} jours`)
    + `</div>`
    + bloc('Joueurs actifs par jour', 'Les 14 derniers jours. Survole une colonne pour voir les nouveaux joueurs.', colonnes(a))
    + bloc('Rétention', 'Parmi ceux qui ont commencé il y a assez longtemps : combien sont revenus après 1, 7 et 30 jours.',
      `<ul class="an-barres">${a.retention.map((r) => {
        const nom = `Après ${r.delai} jour${r.delai > 1 ? 's' : ''}`;
        if (!r.eligibles) return `<li><span class="an-nom">${nom}</span><span class="an-attente">pas encore assez de recul</span></li>`;
        const p = (100 * r.revenus) / r.eligibles;
        return `<li data-tip="${nom} : ${fr(r.revenus)} joueurs revenus sur ${fr(r.eligibles)}"><span class="an-nom">${nom}</span>`
          + `<span class="an-piste"><i style="width:${p}%"></i></span><b>${Math.round(p)} %</b><small>${fr(r.revenus)}/${fr(r.eligibles)}</small></li>`;
      }).join('')}</ul>`)
    + bloc('Progression', 'Combien de joueurs ont atteint chaque étape. Une grosse chute entre deux lignes = un endroit où l’on décroche.', barres(a.entonnoir, Math.max(1, a.joueurs)))
    + bloc('Où en sont les joueurs', 'La Strate la plus profonde ouverte, par joueur.', barres(a.strates))
    + bloc('Combats par ennemi', 'Tous les joueurs additionnés. Un ennemi qui fait fuir ou perdre beaucoup est peut-être trop fort.', tableEnnemis(a))
    + bloc('Expéditions par Strate', 'Comment se terminent les descentes.', tableStrates(a))
    + bloc('Cartes les plus jouées', 'Combien de fois chaque carte a été lancée dans une chaîne (les 20 premières).', a.cartes.length ? barres(a.cartes) : `<p class="an-vide">Pas encore de chaîne enregistrée.</p>`)
    + `<div class="an-deux">${bloc('Appareils', '', barres(a.appareils))}${bloc('Comptes', '', barres(a.comptes))}</div>`;
}

function afficher() {
  let h = `<header class="an-tete"><div><span class="an-sur">EMPREINTES · OUTIL D’ANALYSE</span><h1>Le jeu en chiffres</h1></div>`;
  if (etat.quoi === 'ok') {
    h += `<div class="an-actions"><button type="button" class="an-btn" data-action="actualiser">Actualiser</button>`
      + `<button type="button" class="an-btn prim" data-action="exporter">Exporter les statistiques</button></div>`;
  }
  h += `</header>`;
  if (etat.quoi === 'connexion') h += `<div class="an-centre"><p>Réservé au compte ${ADMIN}.</p><button type="button" class="an-btn prim" data-action="connexion">Se connecter avec Google</button></div>`;
  else if (etat.quoi === 'chargement') h += `<div class="an-centre"><p>Lecture des sauvegardes…</p></div>`;
  else if (etat.quoi === 'refus') h += `<div class="an-centre"><p>${echap(etat.email)} n’a pas accès à l’outil d’analyse.</p><button type="button" class="an-btn" data-action="deconnexion">Changer de compte</button></div>`;
  else if (etat.quoi === 'erreur') h += `<div class="an-centre"><p>${echap(etat.message)}</p><button type="button" class="an-btn" data-action="actualiser">Réessayer</button></div>`;
  else h += tableauDeBord(etat) + `<p class="an-pied">Lu le ${new Date(etat.lu).toLocaleString('fr-BE')} · ${fr(etat.parties.length)} sauvegardes${etat.tests ? ` (${fr(etat.tests)} parties de test écartées)` : ''} · les statistiques sont calculées sur l’appareil des joueurs : un tricheur peut les fausser.</p>`;
  racine.innerHTML = h;
}

function telecharger() {
  if (etat.quoi !== 'ok') return;
  const now = Date.now();
  const blob = new Blob([JSON.stringify(exporter(etat.parties, now), null, 1)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `empreintes-stats-${new Date(now).toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(a.href);
}

racine.addEventListener('click', async (ev) => {
  const b = (ev.target as HTMLElement).closest<HTMLElement>('[data-action]');
  if (!b) return;
  const action = b.dataset.action;
  if (action === 'connexion') await signInWithPopup(auth, new GoogleAuthProvider()).catch((e) => { etat = { quoi: 'erreur', message: `Connexion impossible (${(e as { code?: string })?.code ?? 'erreur'}).` }; afficher(); });
  else if (action === 'deconnexion') await signOut(auth);
  else if (action === 'actualiser' && auth.currentUser) await charger(auth.currentUser);
  else if (action === 'exporter') telecharger();
});

onAuthStateChanged(auth, (u) => {
  if (u) void charger(u);
  else { etat = { quoi: 'connexion' }; afficher(); }
});
afficher();

// pour voir le tableau de bord sans compte pendant le développement : __apercu(parties) (absent du site publié)
if (import.meta.env.DEV) Object.assign(window, { __apercu: (parties: Partie[]) => { const now = Date.now(); etat = { quoi: 'ok', parties, a: analyser(parties, now), lu: now, tests: 0 }; afficher(); } });
