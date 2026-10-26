// La voix d'Ysé (26 octobre 2026, Bryan) : un bouton « Écouter » à côté du lore, lu par une voix humaine.
// Ysé raconte le lore : une vieille archiviste. On prend la voix française la plus naturelle de l'appareil
// (voix « naturelles », neuronales ou premium d'abord), féminine, un peu posée et un peu lente, comme on raconte.
// Synthèse du navigateur : aucun fichier, aucun service payant ; la qualité dépend donc du téléphone.

import { ICO } from './icones';
import { echap } from './outils';

const VOIX = { hauteur: 0.95, debit: 0.9, volume: 1 } as const;

/** les prénoms des voix féminines connues (Android, iPhone, Windows, Mac) ; les masculines passent après */
const FEMININES = /amélie|amelie|audrey|aurélie|aurelie|marie|julie|denise|hortense|céline|celine|léa|lea\b|virginie|elsa|vivienne|brigitte|éloïse|eloise|joséphine|josephine|charline|sylvie|caroline|chantal|yvette|coralie|ariane|google français|female|femme/i;
const MASCULINES = /thomas|paul|henri|nicolas|daniel|claude|rémi|remi|jacques|antoine|jérôme|jerome|mathieu|rémy|alain|guillaume|gérard|fabrice|male\b|homme/i;

const dispo = () => typeof window !== 'undefined' && 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window;

/** la cle du texte en cours de lecture (null : silence) ; le numéro écarte les fins d'une lecture déjà arrêtée */
let enCours: string | null = null;
let numero = 0;

/** Le bouton « Écouter » d'un texte (rien si l'appareil ne sait pas lire à voix haute) */
export function boutonEcouter(cle: string, texte: string, libelle = 'Écouter'): string {
  if (!dispo()) return '';
  const lit = enCours === cle;
  return `<button type="button" class="btn-ecouter${lit ? ' lit' : ''}" data-ecouter="${echap(cle)}" data-texte="${echap(texte)}" aria-pressed="${lit}">`
    + `<span class="be-ico">${ICO.ecouter}${ICO.arreter}</span><span class="be-txt" data-libelle="${echap(libelle)}">${lit ? 'Arrêter' : echap(libelle)}</span>`
    + `<span class="be-onde" aria-hidden="true"><i></i><i></i><i></i><i></i></span></button>`;
}

/** La voix française la plus humaine de l'appareil, féminine de préférence ; les voix robotiques passent en dernier */
function choisirVoix(): SpeechSynthesisVoice | undefined {
  const fr = speechSynthesis.getVoices().filter((v) => v.lang.toLowerCase().startsWith('fr'));
  const note = (v: SpeechSynthesisVoice) => (/natural|neural|premium|enhanced|wavenet|multilingual|siri/i.test(v.name) ? 4 : 0)
    + (/online/i.test(v.name) ? 2 : 0)
    + (FEMININES.test(v.name) ? 2 : 0) - (MASCULINES.test(v.name) ? 2 : 0)
    - (/espeak|compact|eloquence|robot/i.test(v.name) ? 5 : 0)
    + (v.lang.toLowerCase() === 'fr-fr' ? 0.5 : 0);
  return fr.sort((a, b) => note(b) - note(a))[0];
}

/** Phrase par phrase : Chrome coupe les textes longs au bout d'une quinzaine de secondes */
const phrases = (t: string) => t.replace(/\s+/g, ' ').split(/(?<=[.!?…»:])\s+(?=[«A-ZÀ-ÖØ-Þ0-9])/).map((x) => x.trim()).filter(Boolean);

function marquer() {
  document.querySelectorAll<HTMLButtonElement>('[data-ecouter]').forEach((b) => {
    const lit = b.dataset.ecouter === enCours;
    b.classList.toggle('lit', lit);
    b.setAttribute('aria-pressed', String(lit));
    const t = b.querySelector<HTMLElement>('.be-txt');
    if (t) t.textContent = lit ? 'Arrêter' : t.dataset.libelle ?? 'Écouter';
  });
}

export function arreterVoix() {
  if (!dispo()) return;
  numero++;
  enCours = null;
  speechSynthesis.cancel();
  marquer();
}

function lire(cle: string, texte: string) {
  arreterVoix();
  const n = numero;
  const voix = choisirVoix();
  const morceaux = phrases(texte);
  enCours = cle;
  morceaux.forEach((m, i) => {
    const u = new SpeechSynthesisUtterance(m);
    u.lang = voix?.lang ?? 'fr-FR';
    if (voix) u.voice = voix;
    u.pitch = VOIX.hauteur;
    u.rate = VOIX.debit;
    u.volume = VOIX.volume;
    if (i === morceaux.length - 1) u.onend = u.onerror = () => { if (n === numero) { enCours = null; marquer(); } };
    speechSynthesis.speak(u);
  });
  marquer();
}

/** Un seul écouteur pour tout le jeu ; la lecture s'arrête d'elle-même quand son texte quitte l'écran */
export function brancherVoix(racine: HTMLElement) {
  if (!dispo()) return;
  speechSynthesis.getVoices();
  racine.addEventListener('click', (ev) => {
    const b = (ev.target as HTMLElement).closest<HTMLElement>('[data-ecouter]');
    if (!b) return;
    const cle = b.dataset.ecouter!;
    if (enCours === cle) arreterVoix();
    else lire(cle, b.dataset.texte ?? '');
  });
  new MutationObserver(() => {
    if (enCours && !racine.querySelector(`[data-ecouter="${CSS.escape(enCours)}"]`)) arreterVoix();
  }).observe(racine, { childList: true, subtree: true });
  window.addEventListener('pagehide', arreterVoix);
}
