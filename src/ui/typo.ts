// La typographie française pour tout le jeu (8 novembre 2026, audit du lore : les espaces insécables n'étaient posées
// que dans l'intro et les Chroniques). Espace insécable avant « : » et « » », fine insécable avant ; ? !, insécable
// après « , et dans « n° 3 » ou « 4 h 30 ». Sans effet sur un texte déjà corrigé.

import { langue } from '../core/i18n';

/** Un texte brut */
export const typoFr = (t: string): string =>
  t.replace(/ ([:»])/g, ' $1').replace(/ ([;?!])/g, ' $1').replace(/« /g, '« ')
    .replace(/n° /g, 'n° ').replace(/(\d) h (\d)/g, '$1 h $2');

/** En anglais, ni espace avant « : » ni avant « % » (le code colle parfois « … : » entre deux textes traduits) */
export const typoEn = (t: string): string => t.replace(/[ \u00a0\u202f]+([:%])/g, '$1');

/** Un écran en HTML : seulement le texte entre les balises, jamais les attributs ni le code */
export const typoHtml = (h: string): string => h.replace(/>([^<]+)</g, (_, t: string) => `>${langue() === 'fr' ? typoFr(t) : typoEn(t)}<`);
