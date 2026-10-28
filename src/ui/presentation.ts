// Les présentations du Port et de la Flèche (28 octobre 2026, Bryan : pas de « full texte ») :
// chaque bloc tient en une phrase et trois chiffres clés ; l'histoire et les règles complètes se déplient à la demande.

import { ICO } from './icones';

/** un chiffre clé : une icône, la valeur en grand, deux ou trois mots dessous */
export const cle = (ico: string, valeur: string, texte: string) =>
  `<li class="pr-cle"><span class="pr-cle-ico" aria-hidden="true">${ico}</span><b>${valeur}</b><small>${texte}</small></li>`;

/** un bloc : son titre, une phrase, ses chiffres clés */
export const bloc = (ico: string, titre: string, phrase: string, cles: string[]) =>
  `<section class="fl-pr pr-bloc"><span class="surtitre">${ico}${titre}</span><p class="pr-phrase">${phrase}</p><ul class="pr-cles">${cles.join('')}</ul></section>`;

/** ce qui se lit à la demande : l'histoire, les règles en détail */
export const replie = (titre: string, contenu: string, ico = ICO.codex) =>
  `<details class="fl-pr fl-repli pr-detail"><summary><span class="surtitre">${ico}${titre}</span></summary>${contenu}</details>`;

/** une étape des règles en détail (icône, titre, texte) */
export const etape = (ico: string, titre: string, texte: string) =>
  `<li><span class="fl-pr-ico">${ico}</span><span><strong>${titre}</strong><small>${texte}</small></span></li>`;
