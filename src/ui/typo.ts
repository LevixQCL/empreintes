// La typographie française pour tout le jeu (8 novembre 2026, audit du lore : les espaces insécables n'étaient posées
// que dans l'intro et les Chroniques). Espace insécable avant « : » et « » », fine insécable avant ; ? !, insécable
// après « , et dans « n° 3 » ou « 4 h 30 ». Sans effet sur un texte déjà corrigé.

/** Un texte brut */
export const typoFr = (t: string): string =>
  t.replace(/ ([:»])/g, ' $1').replace(/ ([;?!])/g, ' $1').replace(/« /g, '« ')
    .replace(/n° /g, 'n° ').replace(/(\d) h (\d)/g, '$1 h $2');

/** Un écran en HTML : seulement le texte entre les balises, jamais les attributs ni le code */
export const typoHtml = (h: string): string => h.replace(/>([^<]+)</g, (_, t: string) => `>${typoFr(t)}<`);
