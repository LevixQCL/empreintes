// Ce qui se décide sans Stripe ni Firebase (testé par tests/produits.test.ts) : quel produit, quels droits, quelle adresse de retour.

const PRODUITS = require('./produits.json');

/** les adresses où le jeu est publié : Stripe ne ramène le joueur que là */
const SITES = ['https://levixqcl.github.io/empreintes/', 'https://ossyra.app/', 'https://www.ossyra.app/'];

/** l'adresse de retour demandée par le jeu, seulement si c'est bien le jeu publié */
const retourPermis = (retour) => (typeof retour === 'string' && SITES.includes(retour) ? retour : null);

/** les droits qu'un produit ajouterait à ce compte (vide : tout est déjà acquis, ou produit inconnu) */
function droitsNouveaux(produit, acquis) {
  const p = Object.prototype.hasOwnProperty.call(PRODUITS, produit) ? PRODUITS[produit] : null;
  return p ? p.droits.filter((d) => !acquis.includes(d)) : [];
}

module.exports = { PRODUITS, SITES, retourPermis, droitsNouveaux };
