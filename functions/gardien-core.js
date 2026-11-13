"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/serveur/gardien.ts
var gardien_exports = {};
__export(gardien_exports, {
  compterFrappes: () => compterFrappes,
  frappesPermises: () => frappesPermises,
  lirePartie: () => lirePartie,
  pvVille: () => pvVille,
  semaineDe: () => semaineDe
});
module.exports = __toCommonJS(gardien_exports);

// src/core/rng.ts
function graine() {
  return Math.random() * 2 ** 32 >>> 0;
}
function suivant(etat) {
  const s = etat + 1831565813 >>> 0;
  let t2 = s;
  t2 = Math.imul(t2 ^ t2 >>> 15, t2 | 1);
  t2 ^= t2 + Math.imul(t2 ^ t2 >>> 7, t2 | 61);
  return [((t2 ^ t2 >>> 14) >>> 0) / 4294967296, s];
}
function tireur(porteur) {
  return {
    nombre() {
      const [v2, s] = suivant(porteur.rng);
      porteur.rng = s;
      return v2;
    },
    entier(max2) {
      return Math.floor(this.nombre() * max2);
    },
    melanger(a) {
      const r = a.slice();
      for (let i = r.length - 1; i > 0; i--) {
        const j = this.entier(i + 1);
        const tmp = r[i];
        r[i] = r[j];
        r[j] = tmp;
      }
      return r;
    }
  };
}

// src/core/i18n.ts
var langueActive = "fr";
var catalogue = null;
var langue = () => langueActive;
var cleGabarit = (morceaux) => morceaux.reduce((cle, m, i) => i === 0 ? m : `${cle}{${i - 1}}${m}`, "");
var remplir = (modele, valeurs) => modele.replace(/\{(\d+)(?:\|([^}]*))?\}/g, (tout, n, autre) => {
  if (Number(n) >= valeurs.length) return tout;
  const v2 = String(valeurs[Number(n)]);
  if (autre === void 0) return v2;
  const [si, sinon = ""] = autre.split("|");
  return v2 ? si : sinon;
});
var sansContexte = (texte) => texte.startsWith("\xA7") ? texte.slice(texte.indexOf("\xA7", 1) + 1) : texte;
function t(texte, ...valeurs) {
  if (typeof texte === "string") return catalogue?.get(texte) || sansContexte(texte);
  if (!catalogue) return texte.reduce((s, m, i) => i === 0 ? m : s + String(valeurs[i - 1]) + m, "");
  const cle = cleGabarit(texte);
  return remplir(catalogue.get(cle) || cle, valeurs);
}

// src/core/donnees.ts
var deNom = (nom) => langue() === "en" ? `of ${nom}` : /^[aeiouyéèêëàâîïôöûüœh]/i.test(nom) && !/^h[aeo]/i.test(nom) ? `d\u2019${nom}` : `de ${nom}`;
var PORTEURS = [
  { id: "ilka", nom: t("Ilka"), lignee: "tech", pvMax: 38, nomme: true, feminin: true },
  { id: "doran", nom: t("Doran"), lignee: "bio", pvMax: 46, nomme: true },
  { id: "vela", nom: t("V\xE9la"), lignee: "reso", pvMax: 31, nomme: true, feminin: true },
  { id: "coursier", nom: t("Coursier"), lignee: "tech", pvMax: 32, nomme: false },
  { id: "docker", nom: t("Docker"), lignee: "bio", pvMax: 42, nomme: false },
  { id: "guetteur", nom: t("Guetteur"), lignee: "reso", pvMax: 30, nomme: false },
  // Les trois Porteurs recrutables de la Bible : ils arrivent au fil de l'acte I, Aurel avec l'acte II
  {
    id: "sasha",
    nom: t("Sasha Ndiaro"),
    lignee: "tech",
    pvMax: 36,
    nomme: true,
    arrivee: { forge: 2, replique: t("Si \xE7a a une vis, \xE7a a une seconde chance.") }
  },
  {
    id: "nuit",
    nom: t("Nuit"),
    lignee: "bio",
    pvMax: 36,
    nomme: true,
    feminin: true,
    arrivee: { strate: 3, replique: t("Le noir n\u2019est pas vide. Il attend juste qu\u2019on regarde mieux.") }
  },
  {
    id: "aurel",
    nom: t("Aurel Ors\xE8ve"),
    lignee: "reso",
    pvMax: 30,
    nomme: true,
    arrivee: { strate: 5, replique: t("Mon ombre a de meilleures mani\xE8res que moi. C\u2019est bien \xE7a, le probl\xE8me.") }
  },
  // Bible, 23 octobre 2026 (« Devenir Résonant, Géné ou Augmenté ») : une Née-de-mue, la cousine Refusée d'Aurel,
  // et le Résonant que la Clinique trouve lors d'un Accord ouvert, quand le district lui fait confiance
  {
    id: "kessa",
    nom: t("Kessa"),
    lignee: "bio",
    pvMax: 40,
    nomme: true,
    feminin: true,
    arrivee: { strate: 4, replique: t("On n\u2019a rien choisi. Mais on est les seuls \xE0 pouvoir dire ce que \xE7a fait.") }
  },
  {
    id: "liane",
    nom: t("Liane Ors\xE8ve"),
    lignee: "tech",
    pvMax: 34,
    nomme: true,
    feminin: true,
    arrivee: { strate: 6, replique: t("Ils m\u2019ont refus\xE9 la m\xE8che d\u2019or. J\u2019ai fait pousser autre chose.") }
  },
  {
    id: "joss",
    nom: t("Joss"),
    lignee: "reso",
    pvMax: 29,
    nomme: true,
    arrivee: { accord: true, replique: t("J\u2019ai pass\xE9 des ann\xE9es \xE0 cacher l\u2019or des autres. Le mien, je le laisse briller.") }
  }
];
var NOMS_LIGNEE = {
  tech: { nom: t("Augment\xE9"), court: t("AUGMENT\xC9") },
  bio: { nom: t("G\xE9n\xE9"), court: t("G\xC9N\xC9") },
  reso: { nom: t("R\xE9sonant"), court: t("R\xC9SONANT") },
  neutre: { nom: t("Sp\xE9cial"), court: t("SP\xC9CIAL") }
};
var METAL_FORCE_ORIGINE = 1.69 / 1.19;
var c = (id, nom, lignee, rarete, type, v2, f, effet, lourd = false) => ({ id, nom, lignee, rarete, type, v: v2, f, ...effet ? { effet } : {}, ...lourd ? { lourd: true } : {} });
var x = (id, nom, lignee, rarete, type, v2, f, effet, lourd = false) => ({ ...c(id, nom, lignee, rarete, type, v2, f, effet, lourd), seul: true });
var legs = (id, nom, lignee, type, v2, f, effet, effet2, lourd = false) => ({ ...c(id, nom, lignee, "nacre", type, v2, f, effet, lourd), effet2, legs: true });
var lien = (id, nom, lignee, rarete, type, v2, f, effet) => ({ ...c(id, nom, lignee, rarete, type, v2, f, effet), lien: true });
var origine = (id, nom, depuis2, bonus) => {
  const libre = bonus.type === "accord" || bonus.type === "diapason";
  return {
    ...depuis2,
    id,
    nom,
    rarete: "or",
    v: Math.round(depuis2.v * METAL_FORCE_ORIGINE),
    effet: libre ? bonus : depuis2.effet,
    effet2: libre ? depuis2.effet : bonus,
    origine: bonus.type
  };
};
var MODULES = [
  // ---------- Les 15 cartes de base : 5 par Porteur nommé, qu'il porte dès le départ ----------
  c("ruee", t("Plastron de choc"), "tech", "fer", "atk", 8, [3, 4, 2], { type: "percant" }),
  c("bond", t("Talon de cristal"), "tech", "fer", "atk", 6, [4, 5, 3], { type: "elan" }),
  c("esquive", t("Bracelet de d\xE9viation"), "tech", "fer", "bouclier", 7, [5, 6, 4], { type: "elan" }),
  c("tir", t("Canon \xE0 cristal"), "tech", "fer", "atk", 10, [6, 7, 5], { type: "percant" }),
  c("tir-vif", t("Pistolet \xE0 faisceau"), "tech", "fer", "atk", 6, [3, 2, 4], { type: "flux", v: 1 }),
  c("morsure", t("Pince de r\xE9cif"), "bio", "fer", "atk", 5, [2, 3, 1], { type: "siphon", part: 0.5 }),
  c("carapace", t("Carapace"), "bio", "fer", "bouclier", 8, [1, 2, 3], { type: "rempart", part: 0.5 }),
  c("regenerer", t("Bol de s\xE8ve"), "bio", "fer", "soin", 9, [4, 5, 3], { type: "vague" }),
  c("charge", t("Front de roche"), "bio", "fer", "atk", 6, [5, 4, 6], { type: "fissure", part: 0.25 }),
  c("grogner", t("Conque de garde"), "bio", "fer", "bouclier", 5, [3, 2, 4], { type: "desarmer", part: 0.3 }),
  c("murmure", t("Voile du murmure"), "reso", "fer", "atk", 5, [7, 6, 8], { type: "desarmer", part: 0.3 }),
  c("echo", t("Cristal d\u2019\xE9cho"), "reso", "fer", "atk", 8, [9, 8, 7], { type: "accord" }),
  c("souffle", t("Cor de brume"), "reso", "fer", "atk", 20, [8, 9, 7], { type: "fissure", part: 0.25 }, true),
  c("apaiser", t("C\u0153ur d\u2019am\xE9thyste"), "reso", "fer", "soin", 9, [6, 7, 5], { type: "vague" }),
  c("eclat", t("\xC9clat"), "reso", "fer", "atk", 11, [8, 7, 9], { type: "crescendo", part: 0.3 }),
  // ---------- Augmentés : Fréquences moyennes (zone 3 à 7, ZONES_FREQUENCES) ----------
  c("jambes-ressort", t("Jambes \xE0 ressort"), "tech", "fer", "atk", 11, [7, 8, 6], { type: "elan" }),
  c("gant-arc", t("Gant \xE0 arc"), "tech", "fer", "atk", 12, [7, 6, 8], { type: "crescendo", part: 0.3 }),
  c("oeil-relais", t("\u0152il-relais"), "tech", "fer", "atk", 12, [5, 3, 6], { type: "curee", part: 0.6 }),
  c("grappin-cable", t("Grappin \xE0 c\xE2ble"), "tech", "fer", "bouclier", 12, [4, 5, 3], { type: "amorce", part: 0.5 }),
  c("coeur-turbine", t("C\u0153ur-turbine"), "tech", "cuivre", "atk", 13, [6, 8, 7], { type: "elan" }),
  c("oeil-brouilleur", t("\u0152il-brouilleur"), "tech", "cuivre", "atk", 11, [6, 7, 5], { type: "desarmer", part: 0.3, zone: true }),
  c("bras-grue", "Bras-grue", "tech", "argent", "atk", 40, [6, 8, 4], { type: "percant" }, true),
  c("dorsale", t("Dorsale renforc\xE9e"), "tech", "argent", "bouclier", 20, [3, 4, 7], { type: "elan" }),
  c("lames-orbitales", t("Lames orbitales"), "tech", "or", "atk", 40, [7, 3, 2], { type: "crescendo", part: 0.3 }, true),
  c("coeur-reprise", t("C\u0153ur de reprise"), "tech", "or", "atk", 25, [6, 2, 5], { type: "secours", part: 0.5 }),
  // ---------- Génés : Fréquences basses ----------
  c("glande-ambre", t("Glande d\u2019ambre"), "bio", "fer", "soin", 7, [3, 2, 4], { type: "vague", mot: "ouverture" }),
  c("crocs-fossiles", t("Crocs fossiles"), "bio", "fer", "atk", 10, [1, 3, 2], { type: "desarmer", part: 0.3 }),
  c("cuir-recif", t("Cuir de r\xE9cif"), "bio", "fer", "bouclier", 11, [4, 5, 3], { type: "secours", part: 0.5 }),
  c("yeux-nocturnes", t("Yeux nocturnes"), "bio", "fer", "atk", 9, [3, 4, 2], { type: "fissure", part: 0.25, mot: "ouverture" }),
  c("poumons-abysse", t("Poumons d\u2019abysse"), "bio", "cuivre", "bouclier", 12, [2, 4, 3], { type: "rempart", part: 0.5, mot: "final" }),
  c("branchies", t("Branchies des Fondations"), "bio", "cuivre", "soin", 7, [2, 1, 3], { type: "vague" }),
  c("carapace-mere", t("Carapace-m\xE8re"), "bio", "argent", "bouclier", 14, [5, 6, 1], { type: "rempart", part: 0.5, mot: "ouverture" }),
  c("sang-ambre", t("Sang d\u2019ambre"), "bio", "argent", "soin", 8, [3, 2, 5], { type: "vague", mot: "final" }),
  c("coeur-meute", t("C\u0153ur de meute"), "bio", "or", "atk", 12, [5, 4, 3], { type: "siphon", part: 0.5, mode: "meute" }),
  c("mue-totale", t("Mue totale"), "bio", "or", "soin", 14, [1, 2, 4], { type: "vague" }),
  // ---------- Résonants : Fréquences hautes ----------
  c("eclat-chant", t("\xC9clat qui chante"), "reso", "fer", "atk", 11, [7, 9, 8], { type: "diapason" }),
  c("miroir-brume", t("Miroir de brume"), "reso", "fer", "atk", 7, [8, 9, 7], { type: "amorce", part: 0.5 }),
  c("encre-ancienne", t("Encre ancienne"), "reso", "fer", "atk", 11, [6, 7, 5], { type: "fissure", part: 0.25 }),
  c("meche-or", t("M\xE8che d\u2019or"), "reso", "fer", "atk", 9, [7, 8, 6], { type: "lecture" }),
  c("plume-givre", t("Plume de givre"), "reso", "cuivre", "atk", 11, [9, 8, 7], { type: "desarmer", part: 1, total: true }),
  c("ombre-serpent", t("Ombre de serpent"), "reso", "cuivre", "atk", 17, [9, 6, 8], { type: "fissure", part: 0.25, zone: true }),
  c("ombre-ailee", t("Ombre ail\xE9e"), "reso", "argent", "atk", 32, [9, 7, 8], { type: "fissure", part: 0.25, tours: 3 }, true),
  c("pressentiment", t("Sablier invers\xE9"), "reso", "argent", "atk", 10, [6, 8, 7], { type: "sourdine", part: 0.35 }),
  c("chant-abysses", t("Chant des abysses"), "reso", "or", "atk", 14, [7, 8, 9], { type: "accord" }),
  c("souffle-wyrm", t("Souffle du wyrm"), "reso", "or", "atk", 19, [9, 8, 7], { type: "crescendo", part: 0.3, zone: true }),
  // ---------- Les voies, étape 1 (27 octobre 2026, docs/familles-de-decks.md) : une voie par lignée ----------
  // Le Moteur (Liane) : remplir le Flux, puis tout vider d'un coup
  c("bobine-recuperation", t("Bobine de r\xE9cup\xE9ration"), "tech", "fer", "bouclier", 11, [3, 2, 4], { type: "desarmer", part: 0.3 }),
  c("condensateur", t("Condensateur"), "tech", "cuivre", "atk", 12, [5, 4, 6], { type: "flux", v: 1, mot: "ouverture" }),
  c("decharge-arc", t("D\xE9charge d\u2019arc"), "tech", "cuivre", "atk", 16, [6, 7, 5], { type: "decharge", part: 0.5 }),
  c("eclair-captif", t("\xC9clair captif"), "tech", "argent", "atk", 16, [4, 5, 7], { type: "decharge", part: 0.9, max: 1 }),
  c("noyau-instable", t("Noyau instable"), "tech", "or", "atk", 31, [7, 6, 2], { type: "decharge", part: 0.65, recharge: 2 }, true),
  // La Carapace (Doran) : parer, puis frapper avec tout le bouclier accumulé
  c("coup-epaule", t("\xC9pauli\xE8re de roche"), "bio", "fer", "bouclier", 10, [3, 2, 4], { type: "riposte", part: 0.5 }),
  c("queue-massue", "Queue-massue", "bio", "cuivre", "bouclier", 9, [4, 5, 3], { type: "riposte", part: 0.5 }),
  c("belier-os", t("B\xE9lier d\u2019os"), "bio", "argent", "bouclier", 20, [5, 4, 1], { type: "riposte", part: 0.5 }, true),
  c("retour-maree", t("Coquille de mar\xE9e"), "bio", "or", "bouclier", 18, [2, 3, 5], { type: "riposte", part: 1.3, vide: true }),
  // Le Chœur (Joss) : répéter une même Fréquence (Écho)
  c("diapason-cristal", t("Note de cristal"), "reso", "fer", "bouclier", 16, [9, 8, 7], { type: "amorce", part: 0.5 }),
  c("voix-basse", t("Voix basse"), "reso", "fer", "atk", 9, [9, 8, 7], { type: "unisson", part: 1.2 }),
  c("chorale-ombres", t("Chorale des ombres"), "reso", "cuivre", "atk", 12, [8, 9, 7], { type: "unisson", part: 1.2, mot: "final" }),
  c("cloche-abysses", t("Cloche des abysses"), "reso", "argent", "atk", 17, [9, 7, 8], { type: "diapason", premiere: true }),
  c("grand-unisson", t("Grand unisson"), "reso", "or", "atk", 18, [9, 8, 6], { type: "unisson", part: 2.5, toute: true }),
  // ---------- Les voies, étapes 2 et 3 (28 octobre 2026, docs/familles-de-decks.md) ----------
  // La Traque (Nuit) : fissurer, puis achever
  c("flair", t("Flair"), "bio", "fer", "bouclier", 8, [2, 3, 1], { type: "fissure", part: 0.25 }),
  c("bond-predateur", t("Bond du pr\xE9dateur"), "bio", "fer", "atk", 8, [4, 3, 5], { type: "curee", part: 0.6 }),
  c("crocs-verre", t("Crocs de verre"), "bio", "cuivre", "atk", 9, [3, 4, 2], { type: "fissure", part: 0.25, mot: "final" }),
  c("chasse-aveugle", t("Chasse \xE0 l\u2019aveugle"), "bio", "argent", "atk", 13, [5, 4, 2], { type: "curee", part: 0.6, aveugle: 0.3 }),
  c("hallali", t("Hallali"), "bio", "or", "atk", 16, [4, 5, 1], { type: "curee", part: 2, deux: true }),
  // La Lecture (Aurel) : briser la Fêlure à coup sûr, puis frapper dans la faille
  c("regard-biais", t("Regard en biais"), "reso", "fer", "bouclier", 13, [6, 7, 9], { type: "fissure", part: 0.25 }),
  c("lame-doute", t("Lame de doute"), "reso", "fer", "atk", 13, [7, 8, 6], { type: "faille", part: 0.5 }),
  c("oeil-lecteur", t("\u0152il du Lecteur"), "reso", "cuivre", "atk", 15, [8, 7, 9], { type: "lecture", zone: true }),
  c("verdict", t("Verdict"), "reso", "argent", "atk", 15, [6, 8, 7], { type: "amorce", part: 0.5 }),
  c("sentence-muette", t("Sentence muette"), "reso", "or", "atk", 20, [8, 6, 9], { type: "faille", part: 0.5 }),
  // La Sève (Kessa) : soigner en continu, le surplus devient bouclier
  c("pollen-ambre", t("Pollen d\u2019ambre"), "bio", "fer", "soin", 5, [2, 1, 3], { type: "debord" }),
  c("seve-piliers", t("S\xE8ve des piliers"), "bio", "cuivre", "soin", 7, [4, 3, 5], { type: "debord", mot: "ouverture" }),
  c("mue-verre", t("Mue de verre"), "bio", "argent", "soin", 8, [3, 4, 1], { type: "debord", mot: "final" }),
  c("floraison", t("Floraison des Fondations"), "bio", "or", "soin", 11, [5, 4, 2], { type: "debord", x: 2 }),
  // La Cadence (Ilka) : les longues chaînes, chaque coup doublé
  c("pas-chasse", t("Pas chass\xE9"), "tech", "fer", "atk", 10, [3, 2, 4], { type: "elan", mot: "final" }),
  c("lames-jumelles", t("Lames jumelles"), "tech", "fer", "atk", 11, [4, 5, 3], { type: "rafale" }),
  c("poings-pistons", "Poings-pistons", "tech", "cuivre", "atk", 10, [5, 4, 6], { type: "rafale", min: 3 }),
  c("mitraille", t("Mitraille de clous"), "tech", "argent", "atk", 14, [6, 5, 7], { type: "rafale", zone: true }),
  c("cadence-folle", t("Cadence folle"), "tech", "or", "atk", 15, [3, 4, 5], { type: "rafale", cadence: true }),
  // ---------- Les nouvelles cartes (4 novembre 2026, docs/nouvelles-cartes.md) ----------
  // Bryan : sortir le jeu avec une centaine de cartes, équilibrées, qui respectent les voies ; « une carte +14 et une +15 se valent,
  // on prendra toujours +15 » : les nouvelles se distinguent par ce qu'elles font, pas par un point de force en plus.
  // Les Machines (Sasha) : la dernière voie de docs/familles-de-decks.md. Des cartes lourdes, rendues légères par le Servo.
  c("servo-bras", "Servo-bras", "tech", "fer", "bouclier", 12, [4, 5, 3], { type: "servo" }),
  c("marteau-piston", "Marteau-piston", "tech", "fer", "atk", 21, [5, 6, 4], { type: "desarmer", part: 0.3 }, true),
  c("verin", t("V\xE9rin hydraulique"), "tech", "cuivre", "atk", 12, [3, 4, 2], { type: "servo" }),
  c("exo-chantier", t("Exo de chantier"), "tech", "argent", "atk", 20, [5, 7, 4], { type: "flux", v: 1 }, true),
  c("foreuse", t("Foreuse des Strates"), "tech", "or", "atk", 36, [5, 4, 6], { type: "elan" }, true),
  // L’Harmonie (Véla) : le Contrepoint récompense les suites qui passent par les trois lignées (plus dures à faire qu'une suite d'une seule)
  c("contre-chant", "Contre-chant", "reso", "cuivre", "atk", 14, [7, 6, 8], { type: "contrepoint", part: 0.25 }),
  c("fil-accord", t("Fil d\u2019accord"), "reso", "argent", "atk", 15, [8, 7, 6], { type: "contrepoint", part: 0.25, mot: "final" }),
  c("nuee-chorale", t("Nu\xE9e chorale"), "reso", "or", "atk", 22, [6, 8, 7], { type: "contrepoint", part: 0.5, exige: true }),
  // Des cartes qui comblent un trou (une Fréquence ou un effet absent d'un métal). Chiffres réglés au robot : docs/nouvelles-rapport.md
  c("riveteuse", t("Riveteuse"), "tech", "cuivre", "atk", 15, [4, 3, 5], { type: "percant" }),
  c("suture-vive", t("Suture vive"), "bio", "cuivre", "soin", 11, [5, 1, 4], { type: "rempart", part: 0.5 }),
  c("lamproie", t("Lamproie des piliers"), "bio", "argent", "atk", 10, [2, 4, 1], { type: "siphon", part: 0.5, mode: "trop" }),
  c("berceuse", t("Berceuse des Strates"), "reso", "or", "atk", 19, [7, 9, 6], { type: "sourdine", part: 0.35 }),
  // ---------- Les exclusives (28 octobre 2026) : une carte, un seul métal ----------
  // Bryan : « une carte ne doit pas spécialement être déclinée dans tous les métaux ». Elles ne tombent que dans leur métal,
  // et portent des effets qu'on ne trouve nulle part ailleurs. Leurs Fréquences sont volontairement mal commodes pour les suites
  // (écartées, parfois hors de la plage de la lignée) : les meilleurs effets ne doivent pas rendre les Résonances faciles.
  // Argent
  x("gantelet-pillard", "Gantelet-pillard", "tech", "argent", "atk", 17, [6, 2], { type: "rapt" }),
  x("machoire-miroir", t("M\xE2choire-miroir"), "bio", "argent", "atk", 18, [5, 1], { type: "empreinte" }),
  x("boucle-memoire", t("Boucle de m\xE9moire"), "reso", "argent", "atk", 21, [6, 9], { type: "rappel" }),
  // Or
  x("coeur-surregime", t("C\u0153ur en surr\xE9gime"), "tech", "or", "atk", 20, [7, 2], { type: "surtension", part: 0.6, cout: 0.12 }),
  x("peau-ancetre", t("Peau de l\u2019Anc\xEAtre"), "bio", "or", "bouclier", 26, [1, 4], { type: "rapt" }),
  x("miroir-hauts", t("Miroir des Hauts"), "reso", "or", "atk", 20, [9, 6], { type: "empreinte" }),
  // Nacre
  x("coeur-etoile", t("C\u0153ur d\u2019\xE9toile"), "tech", "nacre", "atk", 46, [7, 4, 2], { type: "surtension", part: 0.4, cout: 0.15 }, true),
  x("seconde-naissance", t("Seconde naissance"), "bio", "nacre", "soin", 30, [1, 3, 5], { type: "releve" }),
  x("empreinte-vive", t("Empreinte vive"), "reso", "nacre", "atk", 18, [9, 6, 3], { type: "empreinte", forte: true }),
  x("silence-avant", t("Silence d\u2019avant"), "reso", "nacre", "atk", 24, [7, 4, 9], { type: "rappel" }),
  // 4 novembre 2026 : une nacre de plus pour les Augmentés et les Génés (deux par lignée)
  x("couperet-hauts", t("Couperet des Hauts"), "tech", "nacre", "atk", 30, [6, 3, 8], { type: "execution", part: 0.15 }),
  x("racines-meres", t("Racines-m\xE8res"), "bio", "nacre", "bouclier", 28, [5, 2, 4], { type: "tenacite" }),
  // ---------- L’Héritage du district (27 octobre 2026, docs/heritage-du-district.md) ----------
  // Dix vierges cachées par l'ancienne directrice ; chaque joueur n'en reçoit qu'une (lettre de la directrice, LETTRE_LEGS).
  // Exclusives (jamais trouvées ailleurs : MODULES_TIRABLES), en nacre seulement, les seules à deux effets. La nacre renforce
  // leurs parts (×1,5) comme pour toute carte : les parts ci-dessous sont avant ce renfort. Une Fréquence libre est le premier effet.
  legs("foulee-directrice", t("Foul\xE9e de la directrice"), "tech", "atk", 19, [4, 3, 5], { type: "elan" }, { type: "crescendo", part: 0.2 }),
  legs("bras-fonderie", t("Bras de la Fonderie"), "tech", "atk", 40, [5, 6, 4], { type: "percant" }, { type: "elan" }, true),
  legs("coeur-glaciere", t("C\u0153ur de la Glaci\xE8re"), "tech", "atk", 17, [6, 5, 7], { type: "decharge", part: 0.5 }, { type: "flux", v: 1 }),
  legs("carapace-fondations", t("Carapace des Fondations"), "bio", "bouclier", 13, [2, 3, 1], { type: "rempart", part: 0.35 }, { type: "riposte", part: 0.35 }),
  legs("oeil-grande-nuit", t("\u0152il de la Grande Nuit"), "bio", "atk", 12, [3, 2, 4], { type: "fissure", part: 0.2 }, { type: "siphon", part: 0.6 }),
  legs("premiere-mue", t("Premi\xE8re mue"), "bio", "soin", 18, [1, 2, 3], { type: "vague" }, { type: "rempart", part: 0.35 }),
  legs("lanterne-lecture", t("Lanterne de la premi\xE8re Lecture"), "reso", "atk", 12, [8, 7, 9], { type: "accord" }, { type: "desarmer", part: 0.2 }),
  legs("sceau-orseve", t("Sceau vol\xE9 aux Ors\xE8ve"), "reso", "atk", 14, [7, 6, 8], { type: "desarmer", part: 0.2 }, { type: "fissure", part: 0.1 }),
  legs("voix-quartier", t("Voix du quartier"), "reso", "atk", 17, [9, 8, 7], { type: "diapason" }, { type: "unisson", part: 0.7 }),
  // ---------- Le parrainage (29 octobre 2026) ----------
  // Reçue par le parrain et son filleul quand le filleul monte sa Tour du Noyau au niveau 3. Une Résonante (les Résonants orchestrent) :
  // la force et l'effet d'une carte de cuivre ordinaire (comme Plume de givre), pour ne jamais faire du parrainage un avantage en combat.
  lien("empreinte-jumelle", t("Empreinte jumelle"), "reso", "cuivre", "atk", 5, [7, 8, 6], { type: "accord" })
];
var depuis = (id) => MODULES.find((m) => m.id === id);
MODULES.push(
  // 11 novembre 2026 (choix de Bryan) : des cartes exclusives qui aident vraiment en début et milieu de jeu, sans équivalent gratuit.
  // En argent pour toujours (l'or et le nacre les dépassent en bas), second effet éteint face à un autre joueur.
  origine("cle-des-pompes", t("La cl\xE9 des pompes"), depuis("verin"), { type: "elan" }),
  // Rafale plutôt que Lecture : au robot (Strate −3, 300 descentes), la Lecture ne rapportait rien (69 % contre 72 % pour le Condensateur), la Rafale +8 (80 %)
  origine("toutes-les-courses", t("Toutes les courses"), depuis("condensateur"), { type: "rafale" }),
  origine("quarante-jours", t("Quarante jours"), depuis("poumons-abysse"), { type: "riposte", part: 0.35 }),
  origine("berceuse-a-compter", t("La berceuse \xE0 compter"), depuis("branchies"), { type: "releve" }),
  origine("ombre-nette", t("Ombre nette"), depuis("ombre-serpent"), { type: "accord" }),
  origine("nuit-blanche", t("Nuit blanche"), depuis("plume-givre"), { type: "pioche" })
);
var MODULES_TIRABLES = MODULES.filter((m) => !m.legs && !m.lien && !m.origine);
var existeEn = (m, metal) => !m.seul && !m.legs && !m.lien && !m.origine || m.rarete === metal;
var tirablesEn = (metal) => MODULES_TIRABLES.filter((m) => existeEn(m, metal));
var EXCLUSIVES = MODULES.filter((m) => m.seul);
var VOIES = [
  { id: "moteur", nom: t("Le Moteur"), porteur: "liane", cartes: ["bobine-recuperation", "condensateur", "decharge-arc", "eclair-captif", "noyau-instable"] },
  { id: "carapace", nom: t("La Carapace"), porteur: "doran", cartes: ["coup-epaule", "queue-massue", "belier-os", "retour-maree"] },
  { id: "choeur", nom: t("Le Ch\u0153ur"), porteur: "joss", cartes: ["diapason-cristal", "voix-basse", "chorale-ombres", "cloche-abysses", "grand-unisson"] },
  // étapes 2 et 3 (28 octobre 2026)
  { id: "traque", nom: t("La Traque"), porteur: "nuit", cartes: ["flair", "bond-predateur", "crocs-verre", "chasse-aveugle", "hallali"] },
  { id: "lecture", nom: t("La Lecture"), porteur: "aurel", cartes: ["regard-biais", "lame-doute", "oeil-lecteur", "verdict", "sentence-muette"] },
  { id: "seve", nom: t("La S\xE8ve"), porteur: "kessa", cartes: ["pollen-ambre", "seve-piliers", "mue-verre", "floraison"] },
  { id: "cadence", nom: t("La Cadence"), porteur: "ilka", cartes: ["pas-chasse", "lames-jumelles", "poings-pistons", "mitraille", "cadence-folle"] },
  // 4 novembre 2026
  { id: "machines", nom: t("Les Machines"), porteur: "sasha", cartes: ["servo-bras", "marteau-piston", "verin", "exo-chantier", "foreuse"] },
  { id: "harmonie", nom: t("L\u2019Harmonie"), porteur: "vela", cartes: ["contre-chant", "fil-accord", "nuee-chorale"] }
];
var CARTES_DE_BASE = MODULES.slice(0, 15).map((m) => m.id);
var METAL_FORCE = { fer: 1, cuivre: 1.19, argent: 1.42, or: 1.69, nacre: 2 };
var NIVEAU_FORCE = { palier: 0.1, cran: 0.06 };
var effetQuiMonte = (e) => !!e && "part" in e && e.type !== "decharge";
var forceAuMax = (m, v2) => v2 + Math.max(1, Math.round(v2 * NIVEAU_FORCE.palier)) + (effetQuiMonte(m.effet) ? 0 : Math.max(1, Math.round(v2 * NIVEAU_FORCE.cran)));
var METAL_FREQ = { fer: 1, cuivre: 1, argent: 2, or: 2, nacre: 3 };
var METAL_RENFORT = { fer: 0, cuivre: 1, argent: 1, or: 1.25, nacre: 1.5 };
function renforcer(e, k) {
  if (k <= 1 || e.type === "decharge") return e;
  if (e.type === "flux") return { ...e, v: e.v + (k >= 1.5 ? 1 : 0) };
  const plafond = e.type === "siphon" ? 1 : ["riposte", "unisson", "curee", "faille", "surtension", "amorce", "contrepoint"].includes(e.type) ? Infinity : 0.9;
  if ("part" in e) return { ...e, part: Math.min(plafond, Math.round(e.part * k * 100) / 100) };
  return e;
}
var METAUX = ["fer", "cuivre", "argent", "or", "nacre"];
var carteId = (moduleId, metal) => `${moduleId}@${metal}`;
var moduleDe = (cle) => cle.split("@")[0];
var DEPART_PORTEURS = {
  ilka: ["ruee", "bond", "esquive", "tir", "tir-vif", "jambes-ressort"],
  doran: ["morsure", "carapace", "regenerer", "charge", "grogner", "glande-ambre"],
  vela: ["murmure", "echo", "souffle", "apaiser", "eclat", "eclat-chant"]
};
var COLLECTION_DEPART = Object.values(DEPART_PORTEURS).flat().map((id) => carteId(id, "fer"));
var CARTE_CHAMBRE = carteId("oeil-relais", "fer");
var special = (id, nom, f, type, v2, effet) => ({ id, carte: id, porteur: null, nom, f, type, v: v2, ...effet ? { effet } : {} });
var GESTES_SPECIAUX = [special("stimulant", t("Stimulant"), 1, "soin", 5, { type: "vague" }), special("repli", t("Pavois de cuivre"), 9, "bouclier", 10)];
var commune = (g, batiment, niveau, texte) => ({ geste: g, batiment, niveau, texte });
var ampoule = special("ampoule-releve", t("Ampoule de rel\xE8ve"), 6, "soin", 8, { type: "releve" });
ampoule.unique = true;
var CARTES_COMMUNES = [
  commune(GESTES_SPECIAUX[0], "clinique", 1, t("Une seringue de lumi\xE8re verte, pr\xE9par\xE9e par la Clinique pour chaque escouade.")),
  commune(GESTES_SPECIAUX[1], "noyau", 1, t("Une balise de la Tour du Noyau : une porte blind\xE9e s\u2019ouvre, l\u2019escouade s\u2019y abrite.")),
  commune(special("lame-atelier", t("Lame d\u2019atelier"), 4, "atk", 7), "forge", 2, t("Une lame de r\xE9cup\xE9ration, aff\xFBt\xE9e \xE0 la Forge entre deux commandes. Rien de rare : elle ne l\xE2che jamais.")),
  commune(special("plan-galeries", t("Plan des galeries"), 5, "bouclier", 4, { type: "pioche" }), "noyau", 4, t("Les creuseurs de la Tour tiennent le plan des galeries \xE0 jour : on sait o\xF9 se mettre \xE0 l\u2019abri, et ce qui vient ensuite.")),
  commune(special("groupe-secours", t("Groupe de secours"), 7, "atk", 6, { type: "secours", part: 0.6 }), "generateur", 6, t("Une \xE9quipe du G\xE9n\xE9rateur, pr\xEAte \xE0 descendre au premier signal : plus l\u2019escouade tombe, plus elle frappe fort.")),
  commune(special("breche", t("Br\xE8che"), 8, "atk", 5, { type: "breche" }), "forge", 6, t("Une charge de forge, pos\xE9e contre la carapace de l\u2019ennemi : elle ne fait pas mal, elle ouvre.")),
  commune(ampoule, "clinique", 7, t("La derni\xE8re trouvaille de la Clinique : une ampoule qui remet un Porteur debout. Une seule par combat."))
];
var RATELIER_DEPART = ["stimulant", "repli"];
var gainCommune = (c2) => Math.max(1, Math.round(c2.geste.v * 0.1));
var forceCommune = (c2, niveauBatiment) => c2.geste.v + gainCommune(c2) * Math.max(0, niveauBatiment - c2.niveau);
var communeDef = (id) => CARTES_COMMUNES.find((c2) => c2.geste.id === id);
var CLE_LEGS = special("cle-legs", t("Cl\xE9 de l\u2019H\xE9ritage"), 1, "bouclier", 18, { type: "accord" });
CLE_LEGS.effet2 = { type: "rempart", part: 0.75 };
var NOM_BATIMENT_COMMUNE = { noyau: t("Tour du Noyau"), generateur: t("G\xE9n\xE9rateur"), forge: t("Forge"), clinique: t("Clinique"), comptoir: t("Comptoir"), cercle: t("Cercle des quais") };
var ORIGINE_PAQUETAGE = {
  ...Object.fromEntries(CARTES_COMMUNES.map((c2) => [c2.geste.id, { batiment: NOM_BATIMENT_COMMUNE[c2.batiment], texte: c2.texte }])),
  "cle-legs": { batiment: t("H\xE9ritage du district"), texte: t("La dixi\xE8me vierge de l\u2019ancienne directrice : une cl\xE9 de nacre qui ouvre toutes les portes, et les tient ferm\xE9es derri\xE8re l\u2019escouade.") }
};
var BATIMENTS = [
  {
    id: "noyau",
    nom: t("Tour du Noyau"),
    role: t("Le c\u0153ur du district : il fixe le niveau des autres b\xE2timents et loge les creuseurs qui percent les Strates."),
    affinite: null,
    couts: [
      { energie: 0, composants: 0 },
      { energie: 18, composants: 0 },
      { energie: 50, composants: 0 },
      { energie: 95, composants: 0, eclats: 3 },
      { energie: 190, composants: 0, eclats: 8 },
      { energie: 305, composants: 0, eclats: 6 },
      { energie: 490, composants: 0, eclats: 7 },
      { energie: 750, composants: 0, eclats: 8 },
      { energie: 1115, composants: 0, eclats: 10 },
      { energie: 1600, composants: 0, eclats: 12 }
    ],
    niveauMax: 10
  },
  {
    id: "generateur",
    nom: t("G\xE9n\xE9rateur"),
    role: t("Taille en cristaux le minerai rapport\xE9 d\u2019en bas et de la mer, m\xEAme quand tu ne joues pas."),
    affinite: "tech",
    couts: [
      { energie: 0, composants: 0 },
      { energie: 12, composants: 0 },
      { energie: 30, composants: 0 },
      { energie: 65, composants: 0, eclats: 2 },
      { energie: 130, composants: 0, eclats: 5 },
      { energie: 215, composants: 0, eclats: 4 },
      { energie: 355, composants: 0, eclats: 5 },
      { energie: 545, composants: 0, eclats: 7 },
      { energie: 830, composants: 0, eclats: 9 },
      { energie: 1210, composants: 0, eclats: 11 }
    ],
    niveauMax: 10
  },
  // 27 octobre 2026 (Bryan) : la Forge passe aux Résonants, pour que chaque lignée ait son poste idéal
  // (Générateur : Augmentés, Clinique : Génés, Forge : Résonants).
  {
    id: "forge",
    nom: t("Forge"),
    role: t("Refabrique une carte d\xE9j\xE0 trouv\xE9e : un doublon de plus. Il faut un Porteur au travail."),
    affinite: "reso",
    couts: [
      { energie: 0, composants: 0 },
      { energie: 14, composants: 0 },
      { energie: 35, composants: 0 },
      { energie: 70, composants: 0, eclats: 2 },
      { energie: 145, composants: 0, eclats: 5 },
      { energie: 240, composants: 0, eclats: 4 },
      { energie: 385, composants: 0, eclats: 5 },
      { energie: 600, composants: 0, eclats: 7 },
      { energie: 905, composants: 0, eclats: 9 },
      { energie: 1320, composants: 0, eclats: 11 }
    ],
    niveauMax: 10
  },
  {
    id: "clinique",
    nom: t("Clinique"),
    role: t("Soigne l\u2019Usure des Porteurs pr\xE9sents au district, m\xEAme au travail."),
    affinite: "bio",
    couts: [
      { energie: 0, composants: 0 },
      { energie: 12, composants: 0 },
      { energie: 35, composants: 0 },
      { energie: 70, composants: 0, eclats: 2 },
      { energie: 140, composants: 0, eclats: 5 },
      { energie: 230, composants: 0, eclats: 4 },
      { energie: 370, composants: 0, eclats: 5 },
      { energie: 570, composants: 0, eclats: 7 },
      { energie: 875, composants: 0, eclats: 9 },
      { energie: 1270, composants: 0, eclats: 11 }
    ],
    niveauMax: 10
  },
  // 23 octobre 2026 : le « acheter » de « forger, acheter ou combattre ». Il commence au niveau 0 : on le construit.
  {
    id: "comptoir",
    nom: t("Comptoir"),
    role: t("Les fouilleurs du quartier y revendent chaque jour quelques cartes trouv\xE9es dans les Strates. Prix fixes : tu vois toujours ce que tu ach\xE8tes."),
    affinite: null,
    couts: [
      { energie: 25, composants: 0 },
      { energie: 35, composants: 0 },
      { energie: 70, composants: 0, eclats: 2 },
      { energie: 140, composants: 0, eclats: 5 },
      { energie: 220, composants: 0, eclats: 8 },
      { energie: 315, composants: 0, eclats: 5 },
      { energie: 490, composants: 0, eclats: 6 },
      { energie: 740, composants: 0, eclats: 8 },
      { energie: 1095, composants: 0, eclats: 10 },
      { energie: 1580, composants: 0, eclats: 12 }
    ],
    niveauMax: 10
  },
  // 3 novembre 2026 (Bryan) : le bâtiment social, à la place du Labo génétique (mis en réserve). Il commence au niveau 0
  // et ne se construit qu'après la Strate −5 (CERCLE_OUVERTURE, 12 novembre 2026) : amis, vitrines, duels entre directeurs, échanges de cartes.
  {
    id: "cercle",
    nom: t("Cercle des quais"),
    role: t("Les directeurs des autres districts y accostent : on s\u2019y fait des amis, on s\u2019y d\xE9fie en duel et on y \xE9change ses cartes en double."),
    affinite: null,
    couts: [
      { energie: 30, composants: 0 },
      { energie: 40, composants: 0 },
      { energie: 80, composants: 0, eclats: 2 },
      { energie: 145, composants: 0, eclats: 5 },
      { energie: 230, composants: 0, eclats: 8 },
      { energie: 325, composants: 0, eclats: 5 },
      { energie: 500, composants: 0, eclats: 6 },
      { energie: 750, composants: 0, eclats: 8 },
      { energie: 1105, composants: 0, eclats: 10 },
      { energie: 1600, composants: 0, eclats: 12 }
    ],
    niveauMax: 10
  }
];
var ENNEMIS = [
  {
    id: "remanent-faible",
    nom: t("R\xE9manent affaibli"),
    lignee: "reso",
    tag: t("GARDIEN DE LA CHAMBRE"),
    pvMax: 75,
    motif: [
      { type: "atk", nom: t("Griffe"), v: 4, cible: "hasard" },
      { type: "atk", nom: t("Griffe"), v: 5, cible: "faible" },
      { type: "atk", nom: t("Entaille"), v: 13, cible: "doran" },
      { type: "atk", nom: t("Griffe"), v: 5, cible: "hasard" }
    ]
  },
  {
    id: "remanent",
    nom: t("R\xE9manent"),
    lignee: "reso",
    tag: "ANCIEN",
    pvMax: 72,
    traits: [{ type: "evanescent", part: 0.25 }],
    motif: [
      { type: "atk", nom: t("Griffe"), v: 8, cible: "hasard" },
      { type: "atk", nom: t("Griffe"), v: 10, cible: "faible" },
      { type: "bouclier", v: 8 },
      { type: "atk", nom: t("Entaille"), v: 14, cible: "hasard" }
    ]
  },
  {
    id: "vigie",
    nom: t("Vigie de d\xE9p\xF4t"),
    lignee: "tech",
    tag: t("ANCIENNE MACHINE"),
    pvMax: 95,
    traits: [{ type: "blinde", v: 2 }, { type: "aspire", v: 1 }],
    motif: [
      { type: "atk", nom: t("Rayon"), v: 10, cible: "reso" },
      { type: "atk", nom: t("Balayage"), v: 5, zone: true },
      { type: "atk", nom: t("Rayon"), v: 11, cible: "reso" },
      { type: "bouclier", v: 10 }
    ]
  },
  {
    id: "confluence",
    nom: t("Confluence"),
    lignee: "bio",
    tag: t("BOSS \xB7 EMPREINTES M\xCAL\xC9ES"),
    pvMax: 165,
    traits: [{ type: "regeneration", part: 0.015 }],
    phase: {
      seuil: 0.5,
      nom: t("Crue"),
      texte: t("Les empreintes m\xEAl\xE9es d\xE9bordent : la Confluence appelle ce qui rampe dans les piliers."),
      renforts: ["rampeur"],
      motif: [{ type: "atk", nom: t("Crue"), v: 9, zone: true }, { type: "atk", nom: t("Ressac"), v: 13, cible: "faible" }, { type: "soin", nom: t("Refluer"), v: 12 }, { type: "atk", nom: t("Fracture"), v: 11, cible: "hasard" }]
    },
    motif: [
      { type: "atk", nom: t("Ressac"), v: 12, cible: "hasard" },
      { type: "atk", nom: t("D\xE9bordement"), v: 7, zone: true },
      { type: "boost" },
      { type: "atk", nom: t("Fracture"), v: 9, cible: "faible" },
      { type: "bouclier", v: 12 }
    ]
  },
  // ---------- Les Salles closes (−4 à −6) ----------
  {
    id: "brigadier",
    nom: t("Brigadier du Serment"),
    lignee: "reso",
    tag: t("BRIGADES DU SERMENT DE VEYR"),
    pvMax: 85,
    traits: [{ type: "furie" }],
    motif: [
      { type: "dissonance", nom: t("Sommation") },
      { type: "atk", nom: t("Matraque"), v: 11, cible: "hasard" },
      { type: "bouclier", v: 12 },
      { type: "atk", nom: t("Charge"), v: 7, zone: true }
    ]
  },
  {
    id: "echo-veilleur",
    nom: t("R\xE9manent de veilleur"),
    lignee: "reso",
    tag: t("R\xC9MANENT"),
    pvMax: 78,
    traits: [{ type: "evanescent", part: 0.25 }, { type: "assimilation" }],
    motif: [
      { type: "atk", nom: t("Griffe d\u2019ombre"), v: 12, cible: "faible" },
      { type: "dissonance", nom: t("Murmure") },
      { type: "atk", nom: t("Hurlement"), v: 7, zone: true },
      { type: "soin", nom: t("Reflux"), v: 10 }
    ]
  },
  {
    id: "sentinelle-verre",
    nom: t("Sentinelle de verre"),
    lignee: "tech",
    tag: t("ANCIENNE MACHINE"),
    pvMax: 100,
    traits: [{ type: "epines", part: 0.1 }],
    motif: [
      { type: "bouclier", v: 15 },
      { type: "atk", nom: t("R\xE9fraction"), v: 11, cible: "bio" },
      { type: "boost" },
      { type: "atk", nom: t("Rayon bris\xE9"), v: 11, cible: "hasard" }
    ]
  },
  {
    id: "gardien-registres",
    nom: t("Gardien des registres"),
    lignee: "reso",
    tag: t("BOSS \xB7 LES SALLES CLOSES"),
    pvMax: 175,
    traits: [{ type: "blinde", v: 3 }],
    phase: {
      seuil: 0.5,
      nom: t("Registre ouvert"),
      texte: t("Le Gardien ouvre son registre et appelle un brigadier \xE0 la barre."),
      renforts: ["brigadier"],
      motif: [{ type: "atk", nom: t("Rature"), v: 14, cible: "faible" }, { type: "dissonance", nom: t("Sceau") }, { type: "atk", nom: t("Liste des noms"), v: 9, zone: true }, { type: "boost" }]
    },
    motif: [
      { type: "dissonance", nom: t("Sceau") },
      { type: "atk", nom: t("Effacement"), v: 13, cible: "hasard" },
      { type: "atk", nom: t("Liste des noms"), v: 8, zone: true },
      { type: "boost" },
      { type: "atk", nom: t("Effacement"), v: 12, cible: "faible" },
      { type: "bouclier", v: 14 }
    ]
  },
  // ---------- Les Registres (−7 à −9) ----------
  {
    id: "double",
    nom: t("Double"),
    lignee: "reso",
    tag: t("\xC9CHO D\xC9DOUBL\xC9"),
    pvMax: 90,
    traits: [{ type: "essaim", part: 0.35 }, { type: "assimilation" }],
    motif: [
      { type: "atk", nom: t("Premier souvenir"), v: 12, cible: "hasard" },
      { type: "atk", nom: t("Second souvenir"), v: 12, cible: "hasard" },
      { type: "dissonance", nom: t("Contradiction") },
      { type: "soin", nom: t("Se rassembler"), v: 12 }
    ]
  },
  {
    id: "essaim-ambre",
    nom: t("Essaim d\u2019ambre"),
    lignee: "bio",
    tag: t("FAUNE DES STRATES"),
    pvMax: 80,
    traits: [{ type: "essaim", part: 0.4 }],
    motif: [
      { type: "atk", nom: t("Piq\xFBres"), v: 6, zone: true },
      { type: "atk", nom: t("Piq\xFBres"), v: 6, zone: true },
      { type: "bouclier", v: 10 },
      { type: "boost" }
    ]
  },
  {
    id: "automate-graveur",
    nom: t("Automate graveur"),
    lignee: "tech",
    tag: t("ANCIENNE MACHINE"),
    pvMax: 110,
    traits: [{ type: "blinde", v: 3 }],
    motif: [
      { type: "atk", nom: t("Burin"), v: 13, cible: "reso" },
      { type: "bouclier", v: 12 },
      { type: "atk", nom: t("Burin"), v: 12, cible: "faible" },
      { type: "soin", nom: t("Polissage"), v: 10 }
    ]
  },
  {
    id: "tisseuse",
    nom: t("Tisseuse de souvenirs"),
    lignee: "bio",
    tag: t("BOSS \xB7 M\xC9MOIRES M\xCAL\xC9ES"),
    pvMax: 190,
    traits: [{ type: "epines", part: 0.08 }],
    phase: {
      seuil: 0.5,
      nom: t("Trame rompue"),
      texte: t("La Tisseuse d\xE9chire sa trame : un essaim d\u2019ambre s\u2019en \xE9chappe."),
      renforts: ["essaim-ambre"],
      motif: [{ type: "atk", nom: t("Fil tranchant"), v: 13, cible: "faible" }, { type: "atk", nom: t("Trame"), v: 9, zone: true }, { type: "soin", nom: t("Retisser"), v: 12 }, { type: "boost" }]
    },
    motif: [
      { type: "atk", nom: t("Fil"), v: 11, cible: "faible" },
      { type: "atk", nom: t("Trame"), v: 8, zone: true },
      { type: "dissonance", nom: t("N\u0153ud") },
      { type: "soin", nom: t("Retisser"), v: 14 },
      { type: "boost" },
      { type: "atk", nom: t("Fil"), v: 12, cible: "hasard" }
    ]
  },
  // ---------- Le Fond (−10 et plus) ----------
  {
    id: "premier-porteur",
    nom: t("Le Premier Porteur"),
    lignee: "reso",
    tag: t("BOSS \xB7 CEUX D\u2019AVANT"),
    pvMax: 185,
    traits: [{ type: "evanescent", part: 0.3 }],
    phase: {
      seuil: 0.5,
      nom: t("Ceux d\u2019avant"),
      texte: t("Le Premier Porteur rappelle son double : ceux d\u2019avant ne se battent jamais seuls."),
      renforts: ["double"],
      motif: [{ type: "atk", nom: t("Mar\xE9e ancienne"), v: 10, zone: true }, { type: "dissonance", nom: t("Derni\xE8re mise en garde") }, { type: "atk", nom: t("Souvenir de feu"), v: 15, cible: "hasard" }, { type: "boost" }, { type: "atk", nom: t("Dernier mot"), v: 14, cible: "faible" }]
    },
    motif: [
      { type: "dissonance", nom: t("Mise en garde") },
      { type: "atk", nom: t("Souvenir de feu"), v: 13, cible: "hasard" },
      { type: "atk", nom: t("Mar\xE9e ancienne"), v: 8, zone: true },
      { type: "soin", nom: t("Se souvenir"), v: 15 },
      { type: "boost" },
      { type: "atk", nom: t("Dernier mot"), v: 12, cible: "faible" },
      { type: "bouclier", v: 16 }
    ]
  },
  // ---------- Les Seuils (−1 à −3), en plus du Rémanent et de la Vigie ----------
  {
    id: "rampeur",
    nom: t("Rampeur des piliers"),
    lignee: "bio",
    tag: t("FAUNE DES SEUILS"),
    pvMax: 80,
    traits: [{ type: "regeneration", part: 0.04 }],
    motif: [
      { type: "atk", nom: t("Morsure"), v: 9, cible: "faible" },
      { type: "bouclier", v: 9 },
      { type: "atk", nom: t("Constriction"), v: 5, zone: true },
      { type: "atk", nom: t("Morsure"), v: 10, cible: "hasard" }
    ]
  },
  {
    // Bible, 23 octobre 2026 : un Résonant greffé sans Clinique ni Lecture, une brisure de marché noir (un « doré pâle »)
    id: "sauvage",
    nom: t("Sauvage"),
    lignee: "reso",
    tag: t("GREFF\xC9 SANS CLINIQUE"),
    pvMax: 66,
    traits: [{ type: "vengeur" }],
    motif: [
      { type: "atk", nom: t("Penchant mal lu"), v: 10, cible: "hasard" },
      { type: "bouclier", v: 9 },
      { type: "atk", nom: t("Acc\xE8s"), v: 12, cible: "faible" },
      { type: "atk", nom: t("Ombre qui tremble"), v: 5, zone: true }
    ]
  },
  {
    id: "pilleur",
    nom: t("Pilleur de Strates"),
    lignee: "tech",
    tag: t("FOUILLEUR SANS LICENCE"),
    pvMax: 70,
    traits: [{ type: "vengeur" }],
    motif: [
      { type: "atk", nom: "Pied-de-biche", v: 9, cible: "hasard" },
      { type: "bouclier", v: 11 },
      { type: "atk", nom: t("Coup bas"), v: 11, cible: "faible" },
      { type: "soin", nom: t("Stimulant"), v: 8 }
    ]
  },
  // ---------- Les gardes d'un archipel pillé (pillage.ts) : un par Porteur de la garnison, joués par le district attaqué ----------
  {
    id: "garde-tech",
    nom: t("Garde augment\xE9"),
    lignee: "tech",
    tag: "GARNISON",
    pvMax: 72,
    motif: [
      { type: "atk", nom: t("Salve"), v: 10, cible: "hasard" },
      { type: "bouclier", v: 9 },
      { type: "atk", nom: t("Frappe cibl\xE9e"), v: 12, cible: "faible" },
      { type: "atk", nom: t("Balayage"), v: 6, zone: true }
    ]
  },
  {
    id: "garde-bio",
    nom: t("Garde g\xE9n\xE9"),
    lignee: "bio",
    tag: "GARNISON",
    pvMax: 80,
    motif: [
      { type: "atk", nom: t("Morsure"), v: 9, cible: "faible" },
      { type: "bouclier", v: 11 },
      { type: "soin", nom: t("S\xE8ve"), v: 9 },
      { type: "atk", nom: t("Charge"), v: 11, cible: "hasard" }
    ]
  },
  {
    id: "garde-reso",
    nom: t("Garde r\xE9sonant"),
    lignee: "reso",
    tag: "GARNISON",
    pvMax: 64,
    motif: [
      { type: "dissonance", nom: "Contre-chant" },
      { type: "atk", nom: t("Onde"), v: 11, cible: "hasard" },
      { type: "atk", nom: t("R\xE9verb\xE9ration"), v: 6, zone: true },
      { type: "bouclier", v: 9 }
    ]
  },
  // ---------- Les Rôdeurs (31 octobre 2026, explorer.ts) : un par zone, croisé seulement en Explorer ----------
  // Il se bat quelques tours puis s'enfuit ; sa vie est gardée d'une descente à l'autre. Sa force est celle de la Strate
  // la plus profonde de sa zone (STRATE_RODEUR). Pas de trait au-delà d'un seul, lisible : c'est sa vie qui fait le défi.
  {
    id: "maree-basse",
    nom: t("Mar\xE9e-Basse"),
    lignee: "bio",
    tag: t("R\xD4DEUR DES SEUILS"),
    pvMax: 175,
    traits: [{ type: "regeneration", part: 0.02 }],
    motif: [
      { type: "atk", nom: t("Ressac"), v: 8, zone: true },
      { type: "atk", nom: t("\xC9treinte"), v: 13, cible: "faible" },
      { type: "bouclier", v: 12 },
      { type: "atk", nom: t("Ressac"), v: 9, zone: true }
    ]
  },
  {
    id: "sentinelle-orpheline",
    nom: t("Sentinelle orpheline"),
    lignee: "tech",
    tag: t("R\xD4DEUR DES SALLES CLOSES"),
    pvMax: 170,
    traits: [{ type: "blinde", v: 2 }],
    motif: [
      { type: "atk", nom: t("\xC9clat perdu"), v: 13, cible: "hasard" },
      { type: "boost" },
      { type: "atk", nom: t("Seuil de verre"), v: 8, zone: true },
      { type: "bouclier", v: 14 }
    ]
  },
  {
    id: "liseur",
    nom: t("Le Liseur"),
    lignee: "reso",
    tag: t("R\xD4DEUR DES REGISTRES"),
    pvMax: 150,
    traits: [{ type: "evanescent", part: 0.2 }],
    motif: [
      { type: "atk", nom: t("Nom prononc\xE9"), v: 14, cible: "faible" },
      { type: "dissonance", nom: t("Lecture \xE0 voix haute") },
      { type: "atk", nom: t("Page tourn\xE9e"), v: 8, zone: true },
      { type: "soin", nom: t("Relire"), v: 10 }
    ]
  },
  {
    id: "plongeur",
    nom: t("Le Plongeur"),
    lignee: "tech",
    tag: t("R\xD4DEUR DU FOND"),
    pvMax: 185,
    traits: [{ type: "blinde", v: 3 }],
    motif: [
      { type: "atk", nom: t("Poids mort"), v: 15, cible: "hasard" },
      { type: "bouclier", v: 14 },
      { type: "atk", nom: t("Pression"), v: 9, zone: true },
      { type: "atk", nom: t("Poids mort"), v: 15, cible: "faible" }
    ]
  }
];
var GARDES_FLC = [
  { id: "flc-arrimeur", nom: t("Arrimeur des quais"), lignee: "tech", hauteur: "bas", tag: t("GARDE DE LA FL\xC8CHE \xB7 QUAIS DU BAS") },
  { id: "flc-treuilliste", nom: t("Treuilliste"), lignee: "tech", hauteur: "bas", tag: t("GARDE DE LA FL\xC8CHE \xB7 QUAIS DU BAS") },
  { id: "flc-gaffeur", nom: t("Gaffeur des Hauts"), lignee: "bio", hauteur: "bas", tag: t("GARDE DE LA FL\xC8CHE \xB7 QUAIS DU BAS") },
  { id: "flc-debardeuse", nom: t("D\xE9bardeuse \xE0 carapace"), lignee: "bio", hauteur: "bas", tag: t("GARDE DE LA FL\xC8CHE \xB7 QUAIS DU BAS") },
  { id: "flc-brigadier", nom: t("Brigadier de la Fl\xE8che"), lignee: "reso", hauteur: "bas", tag: t("BRIGADES DU SERMENT DE VEYR") },
  { id: "flc-vigie", nom: t("Vigie des fanions"), lignee: "reso", hauteur: "bas", tag: t("GARDE DE LA FL\xC8CHE \xB7 QUAIS DU BAS") },
  { id: "flc-canonnier", nom: t("Canonnier des nuages"), lignee: "tech", hauteur: "milieu", tag: t("GARDE DE LA FL\xC8CHE \xB7 QUAIS DES NUAGES") },
  { id: "flc-mecanicienne", nom: t("M\xE9canicienne d\u2019amarrage"), lignee: "tech", hauteur: "milieu", tag: t("GARDE DE LA FL\xC8CHE \xB7 QUAIS DES NUAGES") },
  { id: "flc-aile-verre", nom: t("Sentinelle aux ailes de verre"), lignee: "bio", hauteur: "milieu", tag: t("GARDE DE LA FL\xC8CHE \xB7 QUAIS DES NUAGES") },
  { id: "flc-cordiere", nom: t("Gardienne des cordages"), lignee: "bio", hauteur: "milieu", tag: t("GARDE DE LA FL\xC8CHE \xB7 QUAIS DES NUAGES") },
  { id: "flc-ecouteuse", nom: t("\xC9couteuse des vents"), lignee: "reso", hauteur: "milieu", tag: t("GARDE DE LA FL\xC8CHE \xB7 QUAIS DES NUAGES") },
  { id: "flc-brigadiere", nom: t("Brigadi\xE8re du Serment"), lignee: "reso", hauteur: "milieu", tag: t("BRIGADES DU SERMENT DE VEYR") },
  { id: "flc-lancier", nom: t("Lancier de la Garde blanche"), lignee: "tech", hauteur: "haut", tag: t("GARDE DE LA FL\xC8CHE \xB7 QUAIS DES \xCELES") },
  { id: "flc-duelliste", nom: t("Duelliste de la Garde blanche"), lignee: "tech", hauteur: "haut", tag: t("GARDE DE LA FL\xC8CHE \xB7 QUAIS DES \xCELES") },
  { id: "flc-orseve", nom: t("Garde de la Maison Ors\xE8ve"), lignee: "bio", hauteur: "haut", tag: t("GARDE DE LA FL\xC8CHE \xB7 QUAIS DES \xCELES") },
  { id: "flc-intendante", nom: t("Intendante des Hauts"), lignee: "bio", hauteur: "haut", tag: t("GARDE DE LA FL\xC8CHE \xB7 QUAIS DES \xCELES") },
  { id: "flc-heraut", nom: t("H\xE9raut de la Clause"), lignee: "reso", hauteur: "haut", tag: t("GARDE DE LA FL\xC8CHE \xB7 QUAIS DES \xCELES") },
  { id: "flc-chantre", nom: t("Chantre des Si\xE8ges"), lignee: "reso", hauteur: "haut", tag: t("GARDE DE LA FL\xC8CHE \xB7 QUAIS DES \xCELES") },
  { id: "flc-contremaitre", nom: t("Contrema\xEEtre des quais"), lignee: "bio", hauteur: "chef", tag: t("CHEF DE QUAI \xB7 QUAIS GRAV\xC9S 20 ET 40") },
  { id: "flc-hald", nom: t("Capitaine Hald"), lignee: "reso", hauteur: "chef", tag: t("CHEF DE QUAI \xB7 BRIGADES DU SERMENT") },
  { id: "flc-commandeur", nom: t("Commandeur de la Garde blanche"), lignee: "tech", hauteur: "chef", tag: t("CHEF DE QUAI \xB7 QUAIS GRAV\xC9S 80 ET 90") },
  { id: "flc-champion", nom: t("Champion des Hauts"), lignee: "tech", hauteur: "chef", tag: t("CHEF DE QUAI \xB7 LE DERNIER QUAI") }
];
for (const g of GARDES_FLC) {
  const modele = ENNEMIS.find((e) => e.id === `garde-${g.lignee}`);
  ENNEMIS.push({ ...modele, id: g.id, nom: g.nom, tag: g.tag });
}
var CONDITIONS = {
  inondee: { id: "inondee", nom: t("Salle inond\xE9e"), texte: t("L\u2019eau porte les G\xE9n\xE9s : leurs cartes font +20 %.") },
  courants: { id: "courants", nom: t("C\xE2bles \xE0 nu"), texte: t("Le courant court partout : les cartes des Augment\xE9s font +20 %.") },
  chant: { id: "chant", nom: t("Pierre qui chante"), texte: t("La roche r\xE9sonne : les cartes des R\xE9sonants font +20 %.") },
  echo: { id: "echo", nom: t("\xC9cho ancien"), texte: t("Une suite de 4 r\xE9sonne comme une suite de 5.") },
  sanctuaire: { id: "sanctuaire", nom: t("Source ti\xE8de"), texte: t("Les soins de l\u2019escouade font +30 %.") },
  eboulis: { id: "eboulis", nom: t("\xC9boulis"), texte: t("\xC0 chaque tour ennemi, des pierres tombent sur tout le monde (escouade et ennemis), sans jamais mettre personne \xE0 terre.") },
  brouillard: { id: "brouillard", nom: t("Brouillard"), texte: t("Tout le combat, on voit ce que pr\xE9pare l\u2019ennemi, mais jamais combien ni sur qui. Sa F\xEAlure reste cach\xE9e.") }
};
var FAVEUR_CONDITION = { inondee: "bio", courants: "tech", chant: "reso" };
var ZONES = [
  { nom: t("Les Seuils"), jusqua: 3, ennemis: ["remanent", "vigie", "rampeur", "pilleur", "sauvage"], boss: "confluence" },
  { nom: t("Les Salles closes"), jusqua: 6, ennemis: ["brigadier", "echo-veilleur", "sentinelle-verre", "remanent"], boss: "gardien-registres" },
  { nom: t("Les Registres"), jusqua: 9, ennemis: ["double", "essaim-ambre", "automate-graveur", "echo-veilleur"], boss: "tisseuse" },
  { nom: t("Le Fond"), jusqua: Infinity, ennemis: ["double", "automate-graveur", "sentinelle-verre", "echo-veilleur"], boss: "premier-porteur" }
];
var porteurDef = (id) => {
  const p = PORTEURS.find((x2) => x2.id === id);
  if (!p) throw new Error(t("Porteur inconnu : ") + id);
  return p;
};
var ennemiDef = (id) => {
  const e = ENNEMIS.find((x2) => x2.id === id);
  if (!e) throw new Error(t("Ennemi inconnu : ") + id);
  return e;
};
var estCarteConnue = (cle) => {
  try {
    moduleDef(cle);
    return true;
  } catch {
    return false;
  }
};
var declinaisons = /* @__PURE__ */ new Map();
var moduleDef = (cle) => {
  const deja = declinaisons.get(cle);
  if (deja) return deja;
  const [id, metal] = cle.split("@");
  const m = MODULES.find((x2) => x2.id === id);
  if (!m || metal !== void 0 && !METAUX.includes(metal)) throw new Error(t("Carte inconnue : ") + cle);
  if (metal === void 0) return m;
  let v2 = Math.round(m.v * METAL_FORCE[metal] / METAL_FORCE[m.rarete]);
  const i = METAUX.indexOf(metal);
  if (m.v > 0 && i > METAUX.indexOf(m.rarete)) {
    const dessous = moduleDef(carteId(id, METAUX[i - 1]));
    v2 = Math.max(v2, forceAuMax(m, dessous.v) + 1);
  }
  const def = { ...m, id: cle, base: id, rarete: metal, v: v2, f: m.f.slice(0, METAL_FREQ[metal]) };
  delete def.effet;
  delete def.effet2;
  if (m.effet && METAL_RENFORT[metal] > 0) def.effet = renforcer(m.effet, METAL_RENFORT[metal]);
  if (m.effet2 && METAL_RENFORT[metal] > 0) def.effet2 = renforcer(m.effet2, METAL_RENFORT[metal]);
  declinaisons.set(cle, def);
  return def;
};
function gesteDeCarte(cle, porteur, mult = 1, crans = 0) {
  const m = moduleDef(cle);
  const monte = (e) => crans && "part" in e && e.type !== "decharge" ? renforcer(e, 1 + 0.2 * crans) : e;
  return {
    id: cle,
    carte: cle,
    porteur,
    nom: m.nom,
    f: m.f[0],
    ...m.f.length > 1 ? { fs: m.f.slice() } : {},
    type: m.type,
    v: Math.round(m.v * mult),
    ...m.lourd ? { lourd: true } : {},
    ...m.effet ? { effet: monte(m.effet) } : {},
    ...m.effet2 ? { effet2: monte(m.effet2) } : {}
  };
}
var DECK_DEPART = [
  ...Object.entries(DEPART_PORTEURS).flatMap(([p, ids]) => ids.map((id) => gesteDeCarte(carteId(id, "fer"), p))),
  ...GESTES_SPECIAUX
];

// src/core/collection.ts
var RARETES = ["fer", "cuivre", "argent", "or", "nacre"];
var NOMS_RARETE = { fer: t("Fer"), cuivre: t("Cuivre"), argent: t("Argent"), or: t("Or"), nacre: t("Nacre") };
var COLLECTION = {
  /** chance qu'un combat normal fasse tomber une carte */
  chanceCombat: 0.2,
  /** une trouvaille d'expédition est, à cette fréquence, un doublon d'une carte qu'on possède déjà dans ce métal :
   *  plus on joue, plus les cartes montent (étude du 22/10/2026 : les doublons se diluaient sur 225 exemplaires) */
  affinite: 0.4,
  /**
   * Les niveaux (12 novembre 2026, promotion validée par Bryan après la remarque de Luc : « la même carte avec une rareté au-dessus,
   * c'est juste une carte en plus sans intérêt ») : 3 niveaux par métal. Niveau 2 : un palier de force (+10 % de la force, au moins +1 ; parcours simulé : −10 au jour 17 contre 16 avant, 18 à +6 %) ;
   * niveau 3 : un cran d'effet (+20 % de la part de l'effet), ou +6 % de force sans effet à renforcer. Au niveau 3, la carte se
   * promeut au métal suivant (promouvoir) : un métal au niveau 1 bat toujours le métal du dessous au niveau 3.
   * Avant (10 novembre) : 5 niveaux à +15 %, et un exemplaire d'or neuf était plus faible qu'un argent monté.
   */
  bonusNiveau: NIVEAU_FORCE.palier,
  /** un cran d'effet : +20 % de la part ; ou, sans part, +6 % de force */
  cranEffet: 0.2,
  cranForce: NIVEAU_FORCE.cran,
  niveauMax: 3,
  /** niveau de départ selon la rareté : 1 pour toutes depuis le 10 novembre 2026 */
  niveauDepart: { fer: 1, cuivre: 1, argent: 1, or: 1, nacre: 1 },
  /** doublons pour passer au niveau suivant (2, 3, 4, 5) : moins de doublons tombent dans les métaux rares */
  doublons: {
    fer: [1, 2],
    cuivre: [1, 2],
    argent: [1, 2],
    or: [1, 2],
    nacre: [1, 2]
  },
  /**
   * La promotion (12 novembre 2026) : une carte au niveau 3 passe au métal suivant, au niveau 1, avec 3 copies de plus et des cristaux.
   * Une copie d'un métal en dessous vaut un tiers de copie par métal d'écart (3 argent = 1 or) : aucune copie n'est perdue.
   * Trouver la carte directement dans un métal au-dessus la fait passer dans ce métal en gardant son niveau.
   */
  promotion: {
    copies: 3,
    rapport: 3,
    cristaux: { fer: 0, cuivre: 60, argent: 150, or: 400, nacre: 2500 }
  },
  /**
   * La Perle de nacre (13 novembre 2026, Bryan : « garder du fun, de la découverte, mais ne pas banaliser » ; « ça donne un vrai
   * choix sur quelle carte monter ») : la promotion de l'or à la nacre demande 5 copies et 1 Perle. Avant, la moitié de la
   * collection finissait en nacre (49 nacres au jour 120 d'un joueur occasionnel, 93 % par promotion) ; avec la Perle, 15.
   * Les Perles : les quais à nacre de la Flèche, la première victoire de −9 et de −10, un lundi sur deux une fois −10 vaincue,
   * la fonte de copies en or à la Forge, le pack Ossyra et le lot des trois Récits (une chacun).
   */
  perle: {
    copiesNacre: 5,
    /** fondre 8 copies en or (prises sur toutes les cartes en or, celles de l'escouade gardent les leurs) et des cristaux */
    fonte: { copies: 8, cristaux: 2e3 },
    /** une Perle tous les deux lundis, une fois la Strate −10 vaincue */
    semaines: 2,
    /** la première victoire du gardien de ces Strates donne une Perle */
    strates: [9, 10]
  },
  /** composants rendus par le recyclage d'un doublon */
  recyclage: { fer: 5, cuivre: 15, argent: 40, or: 100, nacre: 250 },
  /** refabriquer un exemplaire : environ 5 fois le recyclage, plus des Éclats, plus du temps de Forge.
   *  9 novembre 2026 (cristal unique) : tout se paie en cristaux (`energie`) = composants d'avant + énergie ÷ 20. */
  refabrication: {
    fer: { composants: 0, eclats: 0, minutes: 5, energie: 27 },
    cuivre: { composants: 0, eclats: 0, minutes: 20, energie: 81 },
    argent: { composants: 0, eclats: 2, minutes: 60, energie: 215 },
    or: { composants: 0, eclats: 5, minutes: 180, energie: 535 },
    nacre: { composants: 0, eclats: 12, minutes: 480, energie: 1330 }
  },
  /** garanties : après N cartes sans cette rareté (ou mieux), la suivante l'est forcément */
  garanties: { argent: 40, or: 150, nacre: 400 }
};
var TABLES_RARETE = [
  // 12 novembre 2026 (révision complète, Bryan : « des cartes forcément de plus en plus fortes qui permettent de réussir les Strates ») :
  // le métal suit la Strate, un métal dominant par tranche (avant : du fer à 64-88 % à toutes les profondeurs)
  { jusqua: 2, table: { fer: 88, cuivre: 11, argent: 1, or: 0, nacre: 0 } },
  { jusqua: 4, table: { fer: 60, cuivre: 34, argent: 5.5, or: 0.5, nacre: 0 } },
  { jusqua: 6, table: { fer: 35, cuivre: 48, argent: 15, or: 2, nacre: 0 } },
  { jusqua: 8, table: { fer: 20, cuivre: 45, argent: 30, or: 5, nacre: 0 } },
  { jusqua: 10, table: { fer: 10, cuivre: 35, argent: 42, or: 12, nacre: 1 } },
  { jusqua: Infinity, table: { fer: 5, cuivre: 30, argent: 45, or: 18, nacre: 2 } }
];
var TRANCHES = [
  { jusqua: 2, metal: "fer" },
  { jusqua: 6, metal: "cuivre" },
  { jusqua: 10, metal: "argent" },
  { jusqua: Infinity, metal: "or" }
];
var metalTranche = (strate) => (TRANCHES.find((t2) => strate <= t2.jusqua) ?? TRANCHES[TRANCHES.length - 1]).metal;
function tableRarete(strate) {
  return { ...(TABLES_RARETE.find((t2) => strate <= t2.jusqua) ?? TABLES_RARETE[TABLES_RARETE.length - 1]).table };
}
var rang = (r) => RARETES.indexOf(r);
function tirerRarete(e, strate, minimum = "fer") {
  const t2 = tireur(e);
  const table = { ...tableRarete(strate) };
  if (e.actes?.fin === "scellement") {
    table.or += table.nacre;
    table.nacre = 0;
  }
  if (e.actes?.fin === "archives") {
    table.fer -= table.nacre;
    table.nacre *= 2;
  }
  let r = "fer";
  let v2 = t2.nombre() * 100;
  for (const x2 of [...RARETES].reverse()) {
    if (table[x2] > 0 && v2 < table[x2]) {
      r = x2;
      break;
    }
    v2 -= table[x2];
  }
  const g = COLLECTION.garanties;
  if (strate >= 10 && e.sans.nacre + 1 >= g.nacre && e.actes?.fin !== "scellement") r = "nacre";
  else if (strate >= 5 && e.sans.or + 1 >= g.or && rang(r) < rang("or")) r = "or";
  else if (e.sans.argent + 1 >= g.argent && rang(r) < rang("argent")) r = "argent";
  if (rang(r) < rang(minimum)) r = minimum;
  e.sans.argent = rang(r) >= rang("argent") ? 0 : e.sans.argent + 1;
  e.sans.or = rang(r) >= rang("or") ? 0 : e.sans.or + 1;
  e.sans.nacre = r === "nacre" ? 0 : e.sans.nacre + 1;
  return r;
}
function tirerCarte(e, strate, minimum = "fer", lignee) {
  const r = tirerRarete(e, strate, minimum);
  const pool = tirablesEn(r).filter((m) => !lignee || m.lignee === lignee);
  return carteId(pool[tireur(e).entier(pool.length)].id, r);
}
function tirerChoix(e, strate, minimum = "fer", lignee, presents, toutes = false) {
  const absente = (id) => !!presents && VOIES.some((v2) => !presents.includes(v2.porteur) && v2.cartes.includes(moduleDef(id).base ?? moduleDef(id).id));
  const choix = [];
  let garde2 = 0;
  while (choix.length < 3 && garde2++ < 30) {
    const id = tirerCarte(e, strate, choix.length === 0 || toutes ? minimum : "fer", lignee);
    if (absente(id) && garde2 < 24) continue;
    if (!choix.some((c2) => moduleDef(c2).base === moduleDef(id).base)) choix.push(id);
  }
  return choix;
}
function clePossedee(e, base) {
  let mieux;
  for (const k of Object.keys(e.collection)) if (moduleDe(k) === base && (!mieux || rang(moduleDef(k).rarete) > rang(moduleDef(mieux).rarete))) mieux = k;
  return mieux;
}
function renommerCarte(e, avant, apres) {
  if (avant === apres) return;
  const c2 = e.collection[avant];
  if (c2) {
    delete e.collection[avant];
    e.collection[apres] = c2;
  }
  for (const p of Object.values(e.porteurs ?? {})) if (p) p.modules = [...new Set(p.modules.map((k) => k === avant ? apres : k))];
  if (e.vecu?.[avant] !== void 0) {
    e.vecu[apres] ??= e.vecu[avant];
    delete e.vecu[avant];
  }
  if (e.vus?.cartes) e.vus.cartes = [...new Set(e.vus.cartes.map((k) => k === avant ? apres : k))];
}
var valeurCopie = (de, vers) => COLLECTION.promotion.rapport ** -Math.max(0, rang(vers) - rang(de));
var arrondi = (x2) => Math.round(x2 * 1e3) / 1e3;
var monteAvecCopies = (id) => !moduleDef(id).legs && !moduleDef(id).origine;
function ajouterCarte(e, id) {
  if (!monteAvecCopies(id)) {
    const c3 = e.collection[id];
    if (!c3) {
      e.collection[id] = { niveau: COLLECTION.niveauDepart[moduleDef(id).rarete], doublons: 0 };
      return true;
    }
    c3.doublons++;
    return false;
  }
  const k = clePossedee(e, moduleDe(id));
  if (!k) {
    e.collection[id] = { niveau: COLLECTION.niveauDepart[moduleDef(id).rarete], doublons: 0 };
    return true;
  }
  const c2 = e.collection[k];
  const avant = moduleDef(k).rarete, recu = moduleDef(id).rarete;
  if (rang(recu) <= rang(avant)) {
    c2.doublons = arrondi(c2.doublons + valeurCopie(recu, avant));
    return false;
  }
  const qui = porteurDeLaCarte(e, k);
  if (qui && NIVEAU_METAL[recu] > qui.niveau) {
    if (c2.attente && rang(c2.attente) >= rang(recu)) c2.doublons = arrondi(c2.doublons + 1);
    else c2.attente = recu;
    return false;
  }
  passerAuMetal(e, k, recu);
  return true;
}
function passerAuMetal(e, k, vers) {
  const c2 = e.collection[k];
  const nouvelle = carteId(moduleDe(k), vers);
  c2.doublons = arrondi(c2.doublons * valeurCopie(moduleDef(k).rarete, vers));
  if (c2.attente && rang(c2.attente) <= rang(vers)) delete c2.attente;
  renommerCarte(e, k, nouvelle);
  return nouvelle;
}
var porteurDeLaCarte = () => null;
function brancherPorteurDeLaCarte(f) {
  porteurDeLaCarte = f;
}
function gainNiveau(id) {
  return Math.max(1, Math.round(moduleDef(id).v * COLLECTION.bonusNiveau));
}
var borneNiveau = (n) => Math.max(1, Math.min(COLLECTION.niveauMax, n));
var paliersForce = (niveau) => borneNiveau(niveau) >= 2 ? 1 : 0;
var cransEffet = (niveau) => borneNiveau(niveau) >= 3 ? 1 : 0;
var effetMontant = (e) => !!e && "part" in e && e.type !== "decharge";
function forceNiveau(id, niveau) {
  const m = moduleDef(id);
  const crans = effetMontant(m.effet) ? 0 : cransEffet(niveau) * Math.max(1, Math.round(m.v * COLLECTION.cranForce));
  return m.v + gainNiveau(id) * paliersForce(niveau) + crans;
}
function multNiveau(id, niveau) {
  const v2 = moduleDef(id).v;
  return v2 > 0 ? forceNiveau(id, niveau) / v2 : 1;
}
var CHARGE = {
  /** une carte pèse sa puissance divisée par ce nombre (1 au moins) */
  diviseur: 4,
  /** Charge d'un Porteur au niveau 1, et ce qu'il gagne par niveau */
  // 12 novembre 2026 (Bryan : « ça complique quand même bien le jeu ») : la Charge ne limite plus le deck, seuls les places
  // et le niveau demandé par le métal comptent (avant : 16). L'affichage de la Charge reste à retirer (chantier 5).
  base: 150,
  parNiveau: 1
};
var poidsCarte = (cle) => Math.max(1, Math.round(puissanceCarte(cle, COLLECTION.niveauDepart[moduleDef(cle).rarete]) / CHARGE.diviseur));
var chargeNiveau = (niveau) => CHARGE.base + CHARGE.parNiveau * (niveau - 1);
var NIVEAU_METAL = { fer: 1, cuivre: 1, argent: 5, or: 9, nacre: 13 };
var niveauRequis = (cle) => moduleDef(cle).origine ? 1 : NIVEAU_METAL[moduleDef(cle).rarete];
function metalJouable(cle, niveauPorteur2) {
  if (niveauRequis(cle) <= niveauPorteur2) return cle;
  const plancher = rang(MODULES.find((m) => m.id === moduleDe(cle))?.rarete ?? "fer");
  for (let i = rang(moduleDef(cle).rarete) - 1; i >= plancher; i--) if (NIVEAU_METAL[RARETES[i]] <= niveauPorteur2) return carteId(moduleDe(cle), RARETES[i]);
  return carteId(moduleDe(cle), RARETES[plancher]);
}
function cartesEnJeu(porteurId, cartes) {
  return cartes.map(({ id, niveau }) => gesteDeCarte(id, porteurId, multNiveau(id, niveau), cransEffet(niveau)));
}
var PLACES_PORTEUR = 6;
function puissanceCarte(cle, niveau) {
  const m = moduleDef(cle);
  let v2 = m.v * multNiveau(cle, niveau);
  if (m.lourd) v2 *= 0.6;
  if (m.effet) v2 *= 1.25;
  const e = m.effet;
  if (e && ("total" in e && e.total || "cadence" in e && e.cadence || "exige" in e && e.exige || "deux" in e && e.deux || "toute" in e && e.toute || "vide" in e && e.vide)) v2 *= 0.7;
  if (m.type !== "atk") v2 *= 1.1;
  return v2 * (1 + 0.15 * (m.f.length - 1));
}
var TRIS = [
  { id: "puissance", nom: t("Puissance"), texte: t("La force de la carte \xE0 son niveau, ajust\xE9e de ses effets, de ses Fr\xE9quences et des places qu\u2019elle prend") },
  { id: "metal", nom: t("M\xE9tal"), texte: t("De la nacre au fer") },
  { id: "niveau", nom: t("Niveau"), texte: t("Du plus haut au plus bas") },
  { id: "nouvelles", nom: t("Nouvelles"), texte: t("Les cartes pas encore vues d\u2019abord, puis par puissance") }
];

// src/core/explorer.ts
var V = (strate, k, nom, texte) => ({ id: `v${strate}-${k}`, strate, nom, texte });
var VESTIGES = [
  // −1 : les chantiers de 2066, les pompes, le registre des fouilleurs
  V(1, 1, t("Un casque de chantier"), t("Un casque jaune de 2066, fendu sur le c\xF4t\xE9. \xC0 l\u2019int\xE9rieur, au feutre : \xAB Si tu le trouves, rapporte-le au quai 4. \xBB")),
  V(1, 2, t("Une cl\xE9 de pompe"), t("Une cl\xE9 en croix, polie par les mains. Elle ouvre encore la vanne d\u2019une pompe noy\xE9e. La pompe repart une seconde, puis tousse.")),
  V(1, 3, t("Un ticket de cantine"), t("Un ticket de la cantine du chantier : \xAB Soupe, pain, 14 octobre 2066 \xBB. Jamais utilis\xE9.")),
  V(1, 4, t("Une craie bleue"), t("Un bout de craie bleue. Sur le mur d\u2019\xE0 c\xF4t\xE9, des fl\xE8ches trac\xE9es avec, toutes vers le haut.")),
  V(1, 5, t("Une photo plastifi\xE9e"), t("Une \xE9quipe de six, devant la Tour du Noyau encore en chantier. Quelqu\u2019un a entour\xE9 un visage au stylo.")),
  // −2 : les pilleurs, les cristaux, les murs de 2066
  V(2, 1, t("Une lampe de pilleur"), t("Une lampe frontale bricol\xE9e, la pile scotch\xE9e sur le c\xF4t\xE9. Elle marche encore, faiblement.")),
  V(2, 2, t("Un carnet de comptes"), t("Des colonnes de chiffres : cristaux pris, cristaux vendus. La derni\xE8re page dit seulement : \xAB Celles-l\xE0, non. \xBB")),
  V(2, 3, t("Une truelle"), t("Une truelle couverte de mortier sec, abandonn\xE9e au pied d\u2019un mur de 2066. Le mur n\u2019a jamais \xE9t\xE9 fini.")),
  V(2, 4, t("Un cristal f\xEAl\xE9"), t("Un petit cristal fendu en deux. Les deux moiti\xE9s vibrent encore, chacune de leur c\xF4t\xE9.")),
  V(2, 5, t("Une gamelle grav\xE9e"), t("Une gamelle en fer, grav\xE9e \xAB B. \xBB au couteau. Dedans, des cailloux ronds, rang\xE9s par taille.")),
  // −3 : le noir complet, les patrouilles des Brigades
  V(3, 1, t("Une boussole morte"), t("Une boussole des Brigades. L\u2019aiguille tourne sans s\u2019arr\xEAter, lentement, comme si le nord \xE9tait partout.")),
  V(3, 2, t("Un sifflet"), t("Un sifflet de patrouille, accroch\xE9 \xE0 une corde. Quand on souffle dedans, rien ne r\xE9pond dans le noir.")),
  V(3, 3, t("Une ration entam\xE9e"), t("Une ration militaire ouverte, \xE0 moiti\xE9 mang\xE9e. Le reste a \xE9t\xE9 soigneusement remball\xE9, pour plus tard.")),
  V(3, 4, t("Un fil d\u2019Ariane"), t("Une bobine de fil rouge, presque vide. Le fil part dans le noir et s\u2019arr\xEAte net, coup\xE9 proprement.")),
  V(3, 5, t("Une lettre pli\xE9e"), t("Une lettre d\u2019un soldat \xE0 sa s\u0153ur, jamais envoy\xE9e : \xAB Ici, on n\u2019a pas peur du noir. On a peur de ce qui s\u2019y habitue. \xBB")),
  // −4 : les portes rondes, le veilleur solitaire
  V(4, 1, t("Un gond de cristal"), t("Un gond taill\xE9 dans le cristal, lisse comme du verre. Aucune rouille, apr\xE8s tout ce temps.")),
  V(4, 2, t("Une tasse"), t("Une tasse en gr\xE8s, pos\xE9e sur une marche. Le fond est encore tach\xE9. Quelqu\u2019un prenait le temps de boire, ici.")),
  V(4, 3, t("Un calendrier gratt\xE9"), t("Des b\xE2tons grav\xE9s dans la pierre, par groupes de sept. Il y en a des milliers.")),
  V(4, 4, t("Une couverture tiss\xE9e"), t("Une couverture tiss\xE9e main, aux motifs de vagues. Personne ne tisse plus comme \xE7a, l\xE0-haut.")),
  V(4, 5, t("Une lampe \xE9teinte"), t("Une lampe \xE0 huile minuscule, pos\xE9e au pied d\u2019une porte ronde. Comme si on en avait fabriqu\xE9 une pour un enfant.")),
  // −5 : les Berceaux, la cire blanche de la Maison Orsève
  V(5, 1, t("Un b\xE2ton de cire blanche"), t("Un b\xE2ton de cire blanche, \xE0 moiti\xE9 fondu. La cire des sceaux de la Maison Ors\xE8ve.")),
  V(5, 2, t("Un gant de pr\xE9leveur"), t("Un gant fin, doubl\xE9 de soie. Taille enfant. Les pr\xE9leveurs des Hauts descendent avec leurs apprentis.")),
  V(5, 3, t("Une \xE9tiquette"), t("Une \xE9tiquette de caisse : \xAB Berceau 12, lot 3. Ne pas ouvrir avant l\u2019arriv\xE9e. \xBB L\u2019arriv\xE9e o\xF9 ?")),
  V(5, 4, t("Un berceau vide"), t("Une niche ronde, tapiss\xE9e de mousse s\xE9ch\xE9e. La forme d\u2019un cristal y est encore imprim\xE9e.")),
  V(5, 5, t("Un sceau bris\xE9"), t("Un sceau de cire bris\xE9, et sous lui un autre, plus ancien. Et sous lui encore un autre. On rescelle ici depuis toujours.")),
  // −6 : les pleurs derrière le mur, la nuit du 14
  V(6, 1, t("Un bouchon d\u2019oreille"), t("Un bouchon d\u2019oreille en mousse, de ceux qu\u2019on distribuait au chantier. Il y en a des dizaines, par terre.")),
  V(6, 2, t("Une main sur le mur"), t("L\u2019empreinte d\u2019une main dans le b\xE9ton frais de 2066, c\xF4t\xE9 chantier. De l\u2019autre c\xF4t\xE9, \xE0 la m\xEAme hauteur, une autre main.")),
  V(6, 3, t("Une radio de chantier"), t("Une radio de chantier, bloqu\xE9e sur une fr\xE9quence. Quand on l\u2019allume, on entend respirer.")),
  V(6, 4, t("Un plan du niveau 7"), t("Un plan du niveau 7, annot\xE9 au crayon rouge : \xAB Ici. Et ici. Et l\xE0. Couler partout. \xBB")),
  V(6, 5, t("Une berceuse"), t("Une feuille de papier, une berceuse \xE9crite \xE0 la main. En marge : \xAB Pour qu\u2019ils arr\xEAtent de pleurer. \xC7a marche. \xBB")),
  // −7 : ceux d'avant et leurs lignes d'eau (rien sur l'Écluse ni les Berceaux : la révélation est à −10)
  V(7, 1, t("Une jauge de crue"), t("Une r\xE8gle de bronze gradu\xE9e, scell\xE9e au mur. Ses chiffres ne ressemblent \xE0 rien de connu, mais les traits montent.")),
  V(7, 2, t("Une rame de verre"), t("Une rame taill\xE9e dans un verre \xE9pais et l\xE9ger. Ceux d\u2019avant ont ram\xE9, quand l\u2019eau est mont\xE9e.")),
  V(7, 3, t("Un c\u0153ur de Berceau"), t("Un cristal \xE9norme, \xE9teint, pris dans une monture d\u2019or. Il a tenu quelque chose, autrefois. Quelque chose de lourd.")),
  V(7, 4, t("Une liste de noms"), t("Une plaque couverte de noms, ligne apr\xE8s ligne. Chacun a \xE9t\xE9 ray\xE9, un par un, avec soin.")),
  V(7, 5, t("Un jouet d\u2019enfant"), t("Un petit bateau de bois, la voile en tissu. Ceux d\u2019avant avaient des enfants, et des enfants qui jouaient \xE0 la mer.")),
  // −8 : la Ruche, les tables, les Veilleurs
  V(8, 1, t("Un \xE9clat de table"), t("Un morceau de table de pierre, grav\xE9 de lignes fines. Les m\xEAmes lignes que sur la paume d\u2019une main.")),
  V(8, 2, t("Une lanterne de Veilleur"), t("Une lanterne des Veilleurs de Tobin, la m\xE8che encore longue. Quelqu\u2019un l\u2019a \xE9teinte pour dormir.")),
  V(8, 3, t("Un r\xEAve \xE9crit"), t("Une page couverte d\u2019une \xE9criture serr\xE9e : le r\xE9cit d\u2019un r\xEAve, recopi\xE9 trois fois, de trois mains diff\xE9rentes.")),
  V(8, 4, t("Une alv\xE9ole"), t("Une alv\xE9ole de la Ruche, assez grande pour s\u2019y allonger. La pierre y est ti\xE8de, comme un lit qu\u2019on vient de quitter.")),
  V(8, 5, t("Un compteur"), t("Un boulier de pierre. Les billes sont pouss\xE9es jusqu\u2019\xE0 mille deux cents, puis plus rien.")),
  // −9 : les fils, la Tisseuse, les noms oubliés
  V(9, 1, t("Une navette"), t("Une navette de tisserand, en os poli. Un fil y est encore enroul\xE9, et ce fil murmure un nom.")),
  V(9, 2, t("Un n\u0153ud"), t("Un n\u0153ud serr\xE9 sur lui-m\xEAme, gros comme un poing. Dedans, on devine des dizaines de noms entortill\xE9s.")),
  V(9, 3, t("Une \xE9pingle de brigadier"), t("L\u2019\xE9pingle d\u2019un brigadier du Serment, prise dans la trame d\u2019un mur de fils. Il est pass\xE9 par ici, avant \u22125.")),
  V(9, 4, t("Un d\xE9 \xE0 coudre"), t("Un d\xE9 \xE0 coudre de cristal, us\xE9 jusqu\u2019\xE0 la transparence. La Tisseuse a cousu ici, longtemps.")),
  V(9, 5, t("Une bobine vide"), t("Une bobine dont le fil a \xE9t\xE9 tir\xE9 jusqu\u2019au bout. Sur le bois, une seule lettre, presque effac\xE9e.")),
  // −10 : le Fond, les portes fermées de l'intérieur
  V(10, 1, t("Un trousseau"), t("Un trousseau d\u2019une centaine de cl\xE9s, toutes diff\xE9rentes. Une seule manque : la plus us\xE9e, \xE0 en croire l\u2019anneau.")),
  V(10, 2, t("Un tabouret"), t("Un tabouret de pierre, plac\xE9 face \xE0 une porte. La pierre est creus\xE9e l\xE0 o\xF9 on s\u2019asseyait, des si\xE8cles durant.")),
  V(10, 3, t("Une empreinte de doigt"), t("Une empreinte de doigt grav\xE9e dans le cristal, si nette qu\u2019on pourrait y poser le sien. Elle est \xE0 peine plus petite.")),
  V(10, 4, t("Un registre de garde"), t("Un registre de pierre : une seule colonne, un seul nom, r\xE9p\xE9t\xE9 ligne apr\xE8s ligne. Tous les jours. Toujours la m\xEAme main.")),
  V(10, 5, t("Une lampe allum\xE9e"), t("Une lampe qui br\xFBle encore, au fond d\u2019une niche. Personne ne l\u2019a allum\xE9e pour vous : elle n\u2019a jamais \xE9t\xE9 \xE9teinte."))
];
var RELEVES = [
  { strate: 1, titre: t("Le quai 4"), fin: t("Une \xE9quipe de six est descendue le 14 octobre 2066, entre la soupe et le pain. Quatre d\u2019entre eux couleraient le mur, plus bas. Elle a marqu\xE9 le chemin du retour \xE0 la craie bleue.") },
  { strate: 2, titre: t("Les cailloux de Brac"), fin: t("Brac comptait ses cristaux comme ses cailloux : un par un, rang\xE9s. Il a su lesquels il ne fallait pas vendre.") },
  { strate: 3, titre: t("Ce qui s\u2019habitue"), fin: t("Les patrouilles de \u22123 n\u2019ont pas eu peur du noir. Coinc\xE9es sous l\u2019\xE9boulis, elles ont coup\xE9 leur propre fil pour que rien ne le suive, et elles ont attendu qu\u2019on vienne.") },
  { strate: 4, titre: t("Le veilleur et l\u2019enfant"), fin: t("Derri\xE8re les portes rondes, quelqu\u2019un a compt\xE9 les semaines, tiss\xE9, bu son th\xE9. Et il n\u2019\xE9tait pas seul : il y avait une petite lampe.") },
  { strate: 5, titre: t("L\u2019arriv\xE9e"), fin: t("La Maison Ors\xE8ve emporte les cristaux des Berceaux \xAB avant l\u2019arriv\xE9e \xBB. Elle ne dit pas l\u2019arriv\xE9e de qui, ni d\u2019o\xF9.") },
  { strate: 6, titre: t("La berceuse du niveau 7"), fin: t("En 2066, on a coul\xE9 le mur sur des voix. Une ouvri\xE8re leur chantait une berceuse pour qu\u2019elles se taisent. Elles se sont tues.") },
  { strate: 7, titre: t("Les enfants de ceux d\u2019avant"), fin: t("Ceux d\u2019avant avaient des enfants qui jouaient \xE0 la mer. Ils ont grav\xE9 leur ligne plus haut, et laiss\xE9 les jouets en bas.") },
  { strate: 8, titre: t("Mille deux cents tables"), fin: t("Chaque table de la Ruche garde un r\xEAve. Les Veilleurs les comptaient pour ne pas s\u2019y perdre, jusqu\u2019\xE0 ce qu\u2019ils s\u2019y perdent.") },
  { strate: 9, titre: t("La lettre sur la bobine"), fin: t("La Tisseuse a tiss\xE9 jusqu\u2019au dernier fil. Il ne reste de son nom qu\u2019une lettre, sur le bois d\u2019une bobine.") },
  { strate: 10, titre: t("Celui qui garde"), fin: t("Une seule personne veille au Fond depuis tr\xE8s longtemps. Elle n\u2019a jamais \xE9teint sa lampe. Elle attendait qu\u2019on descende.") }
];
var RODEURS = [
  {
    id: "maree-basse",
    zone: 0,
    dans: t("Mar\xE9e-Basse"),
    trophee: "argent",
    traces: t("De longues tra\xEEn\xE9es humides sur la roche, larges comme un couloir. Mar\xE9e-Basse est pass\xE9e par ici."),
    fuite: t("Mar\xE9e-Basse se laisse glisser dans une fissure noy\xE9e. Elle reviendra : les fouilleurs disent qu\u2019elle revient toujours."),
    chute: t("Mar\xE9e-Basse s\u2019affaisse dans l\u2019eau ti\xE8de des pompes. Elle ne remontera plus jamais vers les piliers.")
  },
  {
    id: "sentinelle-orpheline",
    zone: 1,
    dans: t("la Sentinelle orpheline"),
    trophee: "argent",
    traces: t("Des \xE9clats de verre pos\xE9s en ligne, comme pour marquer une porte qui n\u2019est plus l\xE0. La Sentinelle orpheline cherche toujours."),
    fuite: t("La Sentinelle orpheline recule, se recompose en \xE9clats, et dispara\xEEt vers une porte qu\u2019elle seule voit."),
    chute: t("La Sentinelle orpheline se fige, enfin. Ses \xE9clats dessinent au sol le contour d\u2019une porte. Elle l\u2019a retrouv\xE9e.")
  },
  {
    id: "liseur",
    zone: 2,
    dans: t("le Liseur"),
    trophee: "or",
    traces: t("Des noms grav\xE9s \xE0 moiti\xE9 effac\xE9s, tout du long du couloir. Le Liseur a lu ici \xE0 voix haute."),
    fuite: t("Le Liseur se tait au milieu d\u2019un nom, et s\u2019efface dans la pierre. Plus loin, la lecture reprend."),
    chute: t("Le Liseur prononce un dernier nom, le sien peut-\xEAtre, puis se dissout. Les noms qu\u2019il n\u2019a pas lus restent grav\xE9s.")
  },
  {
    id: "plongeur",
    zone: 3,
    dans: t("le Plongeur"),
    trophee: "or",
    traces: t("Des empreintes de bottes lest\xE9es, qui montent. Toujours vers le haut. Le Plongeur cherche la surface."),
    fuite: t("Le Plongeur se d\xE9tourne, lourd et lent, et reprend sa marche vers le haut. Il ne vous cherchait pas : vous \xE9tiez sur son chemin."),
    chute: t("Le scaphandre s\u2019assoit contre la roche, le hublot tourn\xE9 vers le haut. Il est vide. Il l\u2019a toujours \xE9t\xE9.")
  }
];
var rodeurDef = (id) => RODEURS.find((r) => r.id === id);
var ETOILES = {
  1: { nom: t("Le gardien"), texte: t("Vaincre le gardien."), eclats: 1 },
  2: { nom: t("Personne \xE0 terre"), texte: t("Vaincre le gardien sans qu\u2019aucun Porteur ne tombe pendant la descente."), eclats: 2 },
  3: { nom: t("Sans repos"), texte: t("Vaincre le gardien sans entrer dans un campement."), eclats: 2 }
};

// src/core/familles.ts
var F = (id, nom, arrivee, qui, souvenir2, fragment) => ({ id, nom, arrivee, qui, souvenir: souvenir2, ...fragment ? { fragment } : {} });
var FAMILLES_DISTRICT = [
  // ---- le départ
  F(
    "ruel",
    t("les Ruel"),
    "depart",
    t("Ouvriers de l\u2019\xE9cluse. Ce sont eux qui ont envoy\xE9 Ilka chercher un directeur."),
    t("Le jour o\xF9 Ilka est partie, les Ruel ont laiss\xE9 une lampe \xE0 la fen\xEAtre. Ils ne l\u2019ont \xE9teinte qu\u2019en te voyant arriver.")
  ),
  F(
    "abady",
    t("les Abady"),
    "depart",
    t("Une famille de soudeurs de la digue, qui a vot\xE9 pour qu\u2019on rouvre le puits."),
    t("Le p\xE8re Abady a soud\xE9 la plaque du directeur lui-m\xEAme, avec ce qui restait d\u2019une rambarde. Elle est un peu de travers. Il dit que c\u2019est expr\xE8s.")
  ),
  // ---- le quartier (bouche-à-oreille), avec les familles des souvenirs d’Archives à leur place
  F(
    "orlan",
    t("les Orlan"),
    "quartier",
    t("Gardiens des pompes depuis trois g\xE9n\xE9rations."),
    t("Dans le carnet des Orlan, une ligne par nuit : \xAB tenu \xBB ou \xAB pas tenu \xBB. Ils ont \xE9crit ton nom \xE0 c\xF4t\xE9 du dernier \xAB tenu \xBB."),
    "famille-pompes"
  ),
  F(
    "gaudet",
    t("les Gaudet"),
    "quartier",
    t("Des passeurs de barque, qui connaissent chaque courant de l\u2019anneau."),
    t("La grand-m\xE8re Gaudet dit qu\u2019on reconna\xEEt un bon passeur \xE0 ce qu\u2019il ram\xE8ne toujours quelqu\u2019un. M\xEAme quand il rentre les mains vides.")
  ),
  F(
    "hollen",
    t("les Hollen"),
    "quartier",
    t("Une famille de cuisiniers : la soupe du quai, c\u2019est eux."),
    t("Les Hollen ont toujours une louche de plus dans la marmite. Pour celui qui n\u2019a pas os\xE9 demander.")
  ),
  F(
    "marsac",
    t("les Marsac"),
    "quartier",
    t("Des r\xE9parateurs de filets, r\xE9fugi\xE9s d\u2019une cuvette voisine."),
    t("Les Marsac ont quitt\xE9 leur cuvette avec un seul filet. Ils l\u2019ont r\xE9par\xE9 tant de fois qu\u2019il ne reste plus un fil d\u2019origine. C\u2019est toujours le leur.")
  ),
  F(
    "trelan",
    t("les Tr\xE9lan"),
    "quartier",
    t("Une m\xE8re et ses trois filles, vitri\xE8res."),
    t("Les Tr\xE9lan ont pos\xE9 un carreau bleu dans chaque fen\xEAtre qu\u2019elles ont r\xE9par\xE9e. Le district en compte deux cent douze.")
  ),
  F(
    "meric",
    t("les M\xE9ric"),
    "quartier",
    t("Une famille venue de loin, de ville en ville, toujours plus loin de la mer."),
    t("Sur la couverture des M\xE9ric, un nom brod\xE9 par ville travers\xE9e. La grand-m\xE8re a laiss\xE9 de la place apr\xE8s celui du district."),
    "famille-route"
  ),
  F(
    "cazal",
    t("les Cazal"),
    "quartier",
    t("Des sonneurs : ce sont eux qui donnent l\u2019alerte quand l\u2019eau passe la ligne."),
    t("Les Cazal ont sonn\xE9 l\u2019alerte quarante fois en un hiver. La quarante et uni\xE8me, ils ont sonn\xE9 pour rien, juste pour entendre qu\u2019on \xE9tait encore l\xE0.")
  ),
  F(
    "dumay",
    t("les Dumay"),
    "quartier",
    t("Un vieux couple d\u2019horlogers."),
    t("Toutes les horloges des Dumay retardent de onze minutes : l\u2019heure exacte o\xF9 la mer a franchi l\u2019ancienne digue. Ils refusent de les remettre.")
  ),
  F(
    "esquer",
    t("les Esquer"),
    "quartier",
    t("Des p\xEAcheurs de lumi\xE8re, qui ramassent les algues qui brillent."),
    t("Les Esquer ramassent les algues qui brillent la nuit. Ils en laissent toujours une sur la marche de ceux qui n\u2019ont plus de lampe.")
  ),
  F(
    "sorne",
    t("les Sorne"),
    "quartier",
    t("Des b\xE2tisseurs : le grand-p\xE8re a coul\xE9 le pilier douze."),
    t("Sur la photo des Sorne, des ouvriers dans l\u2019eau jusqu\u2019aux chevilles devant le pilier douze. Au dos : \xAB Soixante ans plus tard, il tient. Nous aussi. \xBB"),
    "famille-fondations"
  ),
  F(
    "lebrun",
    t("les Lebrun"),
    "quartier",
    t("Une famille de couturiers qui habille tout le quai."),
    t("Les Lebrun cousent un fil bleu dans l\u2019ourlet de chaque v\xEAtement. Pour qu\u2019on sache, s\u2019il faut un jour se retrouver, qu\u2019on vient d\u2019ici.")
  ),
  F(
    "auzan",
    t("les Auzan"),
    "quartier",
    t("Un fr\xE8re et une s\u0153ur, conteurs de la Nuit des lignes."),
    t("Les Auzan racontent la m\xEAme histoire \xE0 chaque Nuit des lignes, et la changent un peu \xE0 chaque fois. Ils disent que c\u2019est comme \xE7a qu\u2019elle reste vivante.")
  ),
  F(
    "peyrol",
    t("les Peyrol"),
    "quartier",
    t("Des apiculteurs qui gardent leurs ruches sur les toits."),
    t("Les abeilles des Peyrol ne vont jamais vers la mer. Le vieux Peyrol dit qu\u2019elles savent, elles aussi.")
  ),
  F(
    "taverne",
    t("les Taverne"),
    "quartier",
    t("Une famille de cuisiniers chass\xE9s d\u2019une maison noy\xE9e."),
    t("Les Taverne ont un carreau bleu de leur ancienne cuisine, avec un trait de peinture : la premi\xE8re hauteur de l\u2019eau. Elle n\u2019\xE9tait qu\u2019au genou."),
    "famille-ligne"
  ),
  F(
    "rosel",
    t("les Rosel"),
    "quartier",
    t("Des musiciens de rue, qui jouent sur des tuyaux de pompe."),
    t("Les Rosel jouent sur de vieux tuyaux de pompe. Chaque tuyau a la note de la profondeur d\u2019o\xF9 il vient.")
  ),
  F(
    "valade",
    t("les Valade"),
    "quartier",
    t("Une famille de guetteurs, perch\xE9e tout en haut de l\u2019anneau."),
    t("Depuis le toit des Valade, on voit les \xEEles des Hauts par temps clair. Les enfants leur ont donn\xE9 des noms. Pas les m\xEAmes que l\xE0-haut.")
  ),
  F(
    "crozet",
    t("les Crozet"),
    "quartier",
    t("Des tisserands de corde, pour les pontons et les barques."),
    t("Les Crozet tressent un fil de chaque famille du quai dans les cordes des barques. Ils disent qu\u2019une corde de tout le monde ne casse pas.")
  ),
  F(
    "vey",
    t("les Vey"),
    "quartier",
    t("Une famille modeste, connue pour donner plus qu\u2019elle n\u2019a."),
    t("Les Vey gardent un ticket de pain de l\u2019hiver des Accords, jamais utilis\xE9 : l\u2019a\xEFeul avait donn\xE9 sa part. \xAB Il n\u2019a jamais servi, et il a servi quand m\xEAme. \xBB"),
    "famille-accords"
  ),
  F(
    "morvan",
    t("les Morvan"),
    "quartier",
    t("Des charpentiers de barque."),
    t("Les Morvan gravent la date de chaque barque sous son banc. La plus vieille qui flotte encore a cent onze ans.")
  ),
  F(
    "bastide",
    t("les Bastide"),
    "quartier",
    t("Une famille d\u2019infirmiers, qui a ouvert la premi\xE8re Clinique dans une cave."),
    t("La premi\xE8re Clinique des Bastide tenait dans une cave, avec une seule lampe. Ils ont gard\xE9 l\u2019ampoule, grill\xE9e, sur l\u2019\xE9tag\xE8re d\u2019honneur.")
  ),
  F(
    "lacour",
    t("les Lacour"),
    "quartier",
    t("Des jardiniers de toit, qui font pousser des tomates dans du sel lav\xE9."),
    t("Les tomates des Lacour sont petites et un peu sal\xE9es. Tout le quai jure que ce sont les meilleures du monde.")
  ),
  F(
    "marbel",
    t("les Marbel"),
    "quartier",
    t("Des jardiniers qui ont remont\xE9 leurs bacs d\u2019un \xE9tage \xE0 chaque crue."),
    t("Sur la bo\xEEte de semences des Marbel, grav\xE9 \xE0 la pointe : \xAB L\xE0-haut, il y aura de la terre. On plantera tout. \xBB"),
    "famille-semis"
  ),
  F(
    "servan",
    t("les Servan"),
    "quartier",
    t("Un ancien greffier des Hauts et sa famille, descendus par choix."),
    t("Le vieux Servan a renonc\xE9 \xE0 sa place l\xE0-haut pour rester avec sa fille, en bas. Il dit qu\u2019il a gagn\xE9 au change. Il le dit chaque jour, pour s\u2019en convaincre.")
  ),
  F(
    "pradel",
    t("les Pradel"),
    "quartier",
    t("Des boulangers qui cuisent au four de la Forge, la nuit."),
    t("Les Pradel cuisent le pain au four de la Forge, la nuit, quand il refroidit. Au matin, tout le quai sent le pain et le m\xE9tal.")
  ),
  F(
    "doucet",
    t("les Doucet"),
    "quartier",
    t("Une famille de p\xEAcheurs, gardienne de la lampe de veille."),
    t("La lampe de veille des Doucet est rest\xE9e allum\xE9e onze nuits, une fois. Le p\xEAcheur est rentr\xE9 la douzi\xE8me. Depuis tes barques, elle ne s\u2019\xE9teint plus."),
    "famille-veille"
  ),
  F(
    "anciens",
    t("les Anciens du conseil"),
    "quartier",
    t("Les doyens du district, gardiens du registre des foyers."),
    t("Dans le registre des Anciens, aucune page n\u2019a plus de nom barr\xE9 au crayon rouge. En marge : \xAB Ils montent tous. Le directeur l\u2019a promis. \xBB"),
    "famille-tous"
  ),
  // ---- les Basses : une famille par lieu (digue.ts), restée en bas quand la digue s’est refermée
  F(
    "pellan",
    t("les Pellan"),
    "basses",
    t("Des lavandi\xE8res rest\xE9es aux Lavoirs, sur les bacs les plus hauts."),
    t("Les Pellan lavaient le linge des Hauts, autrefois. Ils ont gard\xE9 un drap brod\xE9 d\u2019un blason qu\u2019aucun d\u2019eux ne sait lire.")
  ),
  F(
    "ardoin",
    t("les Ardoin"),
    "basses",
    t("La famille du dernier \xE9clusier, qui n\u2019a jamais quitt\xE9 sa maison."),
    t("Le p\xE8re Ardoin a ferm\xE9 l\u2019\xE9cluse le dernier soir, de ses mains. Il a attendu dix-neuf ans qu\u2019on vienne lui dire de la rouvrir.")
  ),
  F(
    "sauvel",
    t("les Sauvel"),
    "basses",
    t("Une famille nombreuse qui vivait sur la passerelle \xE0 linge."),
    t("Les enfants Sauvel gravaient leur taille sur la passerelle, \xE0 c\xF4t\xE9 de la hauteur de l\u2019eau. Ils ont arr\xEAt\xE9 le jour o\xF9 l\u2019eau a grandi plus vite qu\u2019eux.")
  ),
  F(
    "lunel",
    t("les Lunel"),
    "basses",
    t("Deux s\u0153urs \xE2g\xE9es, dans l\u2019escalier des blanchisseuses."),
    t("Les s\u0153urs Lunel triaient des boutons par couleur pour passer les nuits de houle. Il leur manque un seul bleu pour finir la bo\xEEte.")
  ),
  F(
    "kerval",
    t("les Kerval"),
    "basses",
    t("Des forgerons de cha\xEEnes, \xE0 l\u2019atelier de la Rue des Treuils."),
    t("Les Kerval ont forg\xE9 les cha\xEEnes du quatri\xE8me anneau. On ne les a jamais pay\xE9s. Ils disent que la digue tient, et que c\u2019est un salaire.")
  ),
  F(
    "mirande",
    t("les Mirande"),
    "basses",
    t("Une gruti\xE8re et son fils, r\xE9fugi\xE9s dans la cabine de la grue couch\xE9e."),
    t("La radio des Mirande n\u2019attrape que la mer. Le fils jure qu\u2019une nuit, une voix y a dit son pr\xE9nom.")
  ),
  F(
    "ibarre",
    t("les Ibarre"),
    "basses",
    t("Des ferronniers, gardiens de la forge froide."),
    t("L\u2019enclume des Ibarre porte un sigle plus vieux que la digue. Ils frappent dessus chaque matin, pour qu\u2019elle ne s\u2019ennuie pas.")
  ),
  F(
    "nalis",
    t("les Nalis"),
    "basses",
    t("La famille du pontier, avec un plan de la digue que personne n\u2019a jamais vu."),
    t("Sur le plan des Nalis, un cercle rouge sous l\u2019anneau : \xAB ne pas creuser \xBB. Le grand-p\xE8re n\u2019a jamais dit pourquoi. Il a juste dit : \xAB Plus tard. \xBB")
  ),
  F(
    "haudry",
    t("les Haudry"),
    "basses",
    t("L\u2019ancien concierge de l\u2019\xE9cole et ses petits-enfants."),
    t("Le vieux Haudry repeint la marelle du pr\xE9au chaque \xE9t\xE9, sous un doigt d\u2019eau. La case du ciel touche la ligne de la mer.")
  ),
  F(
    "prevel",
    t("les Pr\xE9vel"),
    "basses",
    t("L\u2019institutrice de l\u2019\xC9cole noy\xE9e et sa famille."),
    t("Madame Pr\xE9vel n\u2019a jamais effac\xE9 sa derni\xE8re le\xE7on. Ses \xE9l\xE8ves ont calcul\xE9 : trois m\xE8tres en cent ans, plus haut que le pr\xE9au. Ils avaient raison, et en avance.")
  ),
  F(
    "casset",
    t("les Casset"),
    "basses",
    t("Des lecteurs, qui ont sauv\xE9 la biblioth\xE8que de l\u2019\xE9cole livre par livre."),
    t("Les Casset ont s\xE9ch\xE9 trois mille livres, une page \xE0 la fois. Ils ont rang\xE9 chacun par le nom du dernier enfant qui l\u2019avait emprunt\xE9.")
  ),
  F(
    "berot",
    t("les B\xE9rot"),
    "basses",
    t("Une famille de sonneurs, qui veille sur la cloche de la cour."),
    t("La cloche des B\xE9rot sonne seule les nuits de houle. Ils ont compt\xE9 : jamais deux fois le m\xEAme nombre de coups.")
  ),
  F(
    "tessier",
    t("les Tessier"),
    "basses",
    t("Des puisatiers, install\xE9s dans la citerne s\xE8che."),
    t("Les Tessier montent les marches trop hautes de la citerne chaque jour. Les enfants ont appris \xE0 marcher dessus avant de marcher droit.")
  ),
  F(
    "okane",
    t("les Tavel"),
    "basses",
    t("Un tailleur de pierre et sa fille, sous la galerie des vo\xFBtes."),
    t("Le p\xE8re Tavel cherche le joint des vo\xFBtes depuis vingt ans. Il n\u2019y en a pas. Il dit que c\u2019est la plus belle pierre qu\u2019il ait jamais touch\xE9e.")
  ),
  F(
    "varenne",
    t("les Varenne"),
    "basses",
    t("Des m\xE9caniciens, qui font tourner les vannes des Citernes."),
    t("Les Varenne r\xE8glent des vannes qui suivent une mar\xE9e d\u2019un autre temps. Ils ne savent pas pour qui. Ils les r\xE8glent quand m\xEAme.")
  ),
  F(
    "aumont",
    t("les Aumont"),
    "basses",
    t("Une famille au fond du puisard, la plus discr\xE8te des Basses."),
    t("La petite Aumont a pos\xE9 sa main dans les empreintes du puisard. Elles \xE9taient exactement \xE0 sa taille.")
  ),
  F(
    "roustan",
    t("les Roustan"),
    "basses",
    t("Des gardiens de marches, sur les premi\xE8res marches du Palier."),
    t("Les Roustan balaient les premi\xE8res marches du Palier chaque matin. Ils disent que quelqu\u2019un doit bien le faire, depuis le temps.")
  ),
  F(
    "falgue",
    t("les Falgue"),
    "basses",
    t("Une famille de lampistes, dans la niche aux lampes."),
    t("Les lampes de pierre s\u2019allument quand un Falgue approche. Pour les autres, il faut attendre. Personne ne sait pourquoi.")
  ),
  F(
    "demare",
    t("les D\xE9mare"),
    "basses",
    t("Des copistes, qui recopient les empreintes du palier grav\xE9."),
    t("Les D\xE9mare ont recopi\xE9 neuf mille empreintes du palier grav\xE9. Ils disent qu\u2019aucune ne se ressemble, et qu\u2019aucune ne leur est \xE9trang\xE8re.")
  ),
  F(
    "veilleurs",
    t("les Huisset"),
    "basses",
    t("Trois g\xE9n\xE9rations assises devant une porte sans poign\xE9e."),
    t("Les Huisset \xE9coutent l\u2019eau du puits derri\xE8re la porte. Ils disent qu\u2019elle a le bruit d\u2019une respiration. Celle de tout le district.")
  )
];
var familleDuFragment = (fragment) => FAMILLES_DISTRICT.find((f) => f.fragment === fragment);
var FAMILLES_QUARTIER = FAMILLES_DISTRICT.filter((f) => f.arrivee === "quartier");
var FAMILLES_DEPART = FAMILLES_DISTRICT.filter((f) => f.arrivee === "depart");

// src/core/partie/vecu.ts
var VECU = {
  points: { victoire: 2, dernierCoup: 4, felure: 3, gardien: 10 },
  paliers: [250, 1e3, 3e3]
};
var NOMS_PALIER = ["", t("Trace"), t("Sillon"), t("Empreinte")];
function pointsVecu(x2) {
  if (!x2) return 0;
  const P = VECU.points;
  return x2.v * P.victoire + x2.a * P.dernierCoup + x2.f * P.felure + x2.g.length * P.gardien;
}
var plusProfond = (t2) => t2.length ? Math.max(...t2) : 0;
var EXPLOITS = [
  [{ texte: t("Vaincre un Gardien avec elle dans la cha\xEEne"), ok: (x2) => x2.g.length > 0 }],
  [
    { texte: t("Porter le dernier coup \xE0 un Gardien"), ok: (x2) => x2.ga.length > 0 },
    { texte: t("Gagner un combat \xE0 \u22125 ou plus bas"), ok: (x2) => x2.z >= 5 }
  ],
  [
    { texte: t("Vaincre un Gardien \xE0 \u22128 ou plus bas"), ok: (x2) => plusProfond(x2.g) >= 8 },
    { texte: t("Porter 25 derniers coups"), ok: (x2) => x2.a >= 25 }
  ]
];
var max = (t2) => t2.length ? Math.max(...t2) : 0;
var EPITHETES = [
  // les seuils suivent l'étude au robot : chacun demande plusieurs semaines avec la même carte, ou un exploit rare
  { id: "premier", texte: () => t("qui ach\xE8ve"), ok: (x2) => x2.a >= 10, aide: t("Porter 10 derniers coups.") },
  { id: "profond", texte: (x2) => t`qui a vu −${x2.z}`, ok: (x2) => x2.z >= 5, aide: t("Gagner un combat \xE0 la Strate \u22125 ou plus bas.") },
  { id: "gardien", texte: (x2) => t`qui a fendu le Gardien de −${max(x2.ga)}`, ok: (x2) => x2.ga.length > 0, aide: t("Porter le dernier coup \xE0 un Gardien.") },
  { id: "felures", texte: () => t("qui fend les F\xEAlures"), ok: (x2) => x2.f >= 60, aide: t("Briser 60 F\xEAlures.") },
  { id: "tenu", texte: (x2) => t`qui a tenu à −${x2.z}`, ok: (x2, t2) => t2 === "bouclier" && x2.b >= 1500 && x2.z >= 4, aide: t("Une carte de bouclier : donner 1 500 de bouclier et gagner \xE0 \u22124 ou plus bas.") },
  { id: "veille", texte: () => t("qui n\u2019a laiss\xE9 tomber personne"), ok: (x2, t2) => t2 === "soin" && x2.s >= 1500, aide: t("Une carte de soin : soigner 1 500 PV.") },
  { id: "mille", texte: () => t("aux mille coups"), ok: (x2, t2) => t2 === "atk" && x2.d >= 6e3, aide: t("Une carte d\u2019attaque : infliger 6 000 d\xE9g\xE2ts.") },
  { id: "veteran", texte: () => t("de toutes les descentes"), ok: (x2) => x2.v >= 300, aide: t("Gagner 300 combats.") },
  // les Rôdeurs (31 octobre 2026) : un exploit rare, une seule carte par Rôdeur
  { id: "rodeur", texte: (x2) => t`qui a abattu ${rodeurDef(x2.ro[x2.ro.length - 1])?.dans ?? ennemiDef(x2.ro[x2.ro.length - 1]).nom}`, ok: (x2) => !!x2.ro?.length, aide: t("Porter le dernier coup \xE0 un R\xF4deur.") }
];

// src/core/partie/etat.ts
var VERSION_JEU = 14;
var DISTRICT = {
  /** Économie à cristal unique (9 novembre 2026, docs/economie-cristal.md) : le Générateur ne produit plus d'énergie,
   *  il taille le minerai rapporté en jouant (`Jeu.composants`) en cristaux (`Jeu.energie`), 1 pour 1.
   *  Relu par un game designer : il ne doit jamais freiner celui qui joue beaucoup. Son niveau fixe donc le temps qu'il met
   *  à tailler ce qui attend (chaque heure, une part `1/heures` du minerai, au moins `taillePlancher` cristaux) : 16 h au niveau 1,
   *  4 h au niveau 10. Rien ne se perd, il n'y a plus de réserve. Le lot d'une session est taillé en une nuit. */
  tailleHeures: [0, 16, 14, 12, 10, 9, 8, 7, 6, 5, 4],
  /** en taillant, le Générateur recueille des Éclats dans le minerai (9 novembre 2026, à la place de la cristallisation) :
   *  un tous les `eclatTous` cristaux taillés, au plus `eclatsParJour[niveau]` par jour (rien avant le niveau 4) */
  eclatTous: 300,
  eclatsParJour: [0, 0, 0, 0, 1, 1, 2, 2, 2, 3, 3],
  taillePlancher: [0, 10, 14, 20, 26, 32, 40, 48, 58, 68, 80],
  /** points d'Usure soignés par heure selon le niveau de la Clinique */
  soinParHeure: [0, 6, 10, 16, 22, 30, 36, 42, 48, 55, 62],
  /** la Forge refabrique 25 % plus vite par niveau */
  forgeParNiveau: 0.25,
  /** La Tour ne monte à certains niveaux qu'une fois un gardien vaincu (niveau visé → Strate). 10 novembre 2026 (compte rendu de partie,
   *  validé par Bryan) : l'âge 2 du district arrivait le premier jour, après quelques heures. Niveau 4 après le gardien de −3 : jour 3 ou 4.
   *  Raison dans l'histoire : une contrainte technique, les nouvelles fondations s'ancrent dans la roche de cette Strate. */
  tourApresGardien: { 4: 3 },
  /** durée du chantier pour atteindre un niveau, en minutes (index = niveau visé) */
  chantierMinutes: [0, 0, 0, 5, 30, 120, 240, 720, 1440, 2160, 2880],
  /** chantiers en même temps : 1, puis 2 à partir du Noyau niveau 4 */
  chantiersNoyau2: 4,
  /** bonus d'un Porteur posté : de la bonne lignée / d'une autre lignée */
  bonusAffinite: 2,
  bonusPoste: 1.5,
  /** Usure (30 octobre 2026, demande de Bryan) : les PV perdus en bas restent perdus au retour, la Clinique les rend au repos.
   *  En plus des PV perdus : un malus si le Porteur finit à terre, et un autre si l'escouade fuit (`usureFuite`). */
  usureATerre: 3,
  /** part de ses PV qu'un Porteur doit avoir retrouvée pour redescendre (un Porteur à terre reste d'abord à la Clinique) */
  pvMinDepart: 0.25,
  /** cartes qu'un Porteur peut porter (décision du 22 octobre 2026 : la carte qu'on collectionne est celle qu'on joue) ;
   *  ce sont aussi ses places en combat, remplies ou vides (`PLACES_PORTEUR`) */
  cartesMax: PLACES_PORTEUR,
  /** cartes qu'il faut au deck de l'escouade (cartes du district comprises) pour descendre */
  deckMin: 12,
  /** part du butin gardée après une défaite (10 novembre 2026 : la moitié → un tiers, perdre ne coûtait presque rien) */
  butinDefaite: 1 / 3,
  /** fuir un combat jusqu'au district (22 octobre 2026) : part des composants gardée, et Usure en plus pour chaque Porteur */
  butinFuite: 0.75,
  usureFuite: 3,
  /** au départ : des cristaux (`energie`) et pas de brut (`composants`) (9 novembre 2026) */
  depart: { energie: 50, composants: 0 }
};
var EPOQUE = Date.UTC(2026, 0, 5, 3);
var jourDe = (now) => Math.floor((now - EPOQUE) / 864e5);
var semaineDe = (now) => Math.floor(jourDe(now) / 7);
var debutJour = (jour) => EPOQUE + jour * 864e5;
var XP = {
  /** par combat gagné dans une Strate, ×(1 + parStrate × (Strate − 1)) */
  combat: 10,
  /** l'XP gagnée monte de 15 % par Strate (25 % jusqu'au 3 nov. 2026 : niveau max atteint vers −7) */
  parStrate: 0.15,
  /** en plus pour une salle scellée vaincue, et pour le gardien */
  elite: 10,
  gardien: 30,
  /** par heure de mission */
  missionHeure: 4,
  /** un Porteur en retard de 2 niveaux ou plus sur le plus avancé du district apprend plus vite (×1,5) */
  rattrapage: 1.5,
  niveauMax: 20,
  pvParNiveau: 0.04
};
var xpPourNiveau = (n) => Math.round(12 * n ** 1.8);
function niveauPorteur(j, id) {
  let reste = Math.floor(j.porteurs[id]?.xp ?? 0);
  let n = 1;
  while (n < XP.niveauMax && reste >= xpPourNiveau(n)) {
    reste -= xpPourNiveau(n);
    n++;
  }
  return { niveau: n, xp: reste, requis: n >= XP.niveauMax ? null : xpPourNiveau(n) };
}
var pvNiveau = (j, id) => Math.round(porteurDef(id).pvMax * (1 + XP.pvParNiveau * (niveauPorteur(j, id).niveau - 1)));
var chargeMax = (j, id) => chargeNiveau(niveauPorteur(j, id).niveau);
var chargePortee = (j, id) => (j.porteurs[id]?.modules ?? []).reduce((n, k) => n + poidsCarte(k), 0);
var NOMS_PALIER_MARQUE = [t("Gagn\xE9e"), t("Affirm\xE9e"), t("Grav\xE9e")];
var MARQUES = {
  ilka: {
    nom: t("Raccourci"),
    fait: "expeditions",
    seuil: 30,
    quoi: t("exp\xE9ditions r\xE9ussies"),
    court: t("+1 place au premier tour"),
    bonus: { places: 1 },
    texte: t("Elle conna\xEEt tous les raccourcis : +1 place dans la cha\xEEne au premier tour de chaque combat."),
    paliers: [
      { court: t("+1 place aussi au 2\u1D49 tour"), texte: t("Elle a ses rep\xE8res : la place en plus revient au deuxi\xE8me tour."), bonus: { places2: 1 } },
      { court: t("+2 places au 1er tour, +1 au 2\u1D49"), texte: t("Elle ouvre la voie : 2 places de plus au premier tour, et 1 au deuxi\xE8me."), bonus: { places: 2 } }
    ]
  },
  doran: {
    nom: t("Fondations"),
    fait: "fondations",
    seuil: 20,
    quoi: t("combats dans les Seuils"),
    court: t("8 de bouclier au d\xE9part"),
    bonus: { bouclier: 8 },
    texte: t("Il couvre les siens : chaque combat commence avec 8 de bouclier d\u2019escouade."),
    paliers: [
      { court: t("12 de bouclier au d\xE9part"), texte: t("Il tient plus large : chaque combat commence avec 12 de bouclier d\u2019escouade."), bonus: { bouclier: 12 } },
      { court: t("le bouclier se reforme une fois"), texte: t("Il rel\xE8ve le mur : une fois par combat, quand l\u2019escouade passe sous la moiti\xE9 de ses PV, 12 de bouclier se reforment."), bonus: { rempart: 12 } }
    ]
  },
  vela: {
    nom: t("Lectrice"),
    fait: "anciens",
    seuil: 10,
    quoi: "empreintes anciennes vaincues",
    court: t("insensible \xE0 la Dissonance"),
    bonus: { lucide: true },
    texte: t("Elle lit les \xC9chos : la Dissonance n\u2019a plus de prise sur l\u2019escouade."),
    paliers: [
      { court: t("lit la 1re intention dans le brouillard"), texte: t("Elle lit \xE0 travers la brume : sous le brouillard, ce que pr\xE9pare chaque ennemi au premier tour se voit en entier."), bonus: { lecture: true } },
      { court: t("renvoie la Dissonance"), texte: t("Elle retourne le brouillage : un ennemi qui tente une Dissonance perd 30 % de sa prochaine attaque."), bonus: { retourne: 0.3 } }
    ]
  },
  sasha: {
    nom: t("Seconde chance"),
    fait: "scellees",
    seuil: 10,
    quoi: t("salles scell\xE9es ouvertes"),
    court: t("rel\xE8ve le premier qui tombe"),
    bonus: { releve: 0.25 },
    texte: t("Il remet tout le monde d\u2019aplomb : une fois par combat, le premier Porteur qui tombe se rel\xE8ve avec 25 % de ses PV."),
    paliers: [
      { court: t("rel\xE8ve \xE0 35 % des PV"), texte: t("Il remet d\u2019aplomb plus solidement : le premier qui tombe se rel\xE8ve avec 35 % de ses PV."), bonus: { releve: 0.35 } },
      { court: t("rel\xE8ve deux fois par combat"), texte: t("Personne ne reste au sol : la Seconde chance sert deux fois par combat."), bonus: { releveFois: 2 } }
    ]
  },
  nuit: {
    nom: t("\u0152il de nuit"),
    fait: "abysses",
    seuil: 25,
    quoi: t("combats gagn\xE9s sous la Strate \u22123"),
    court: t("l\u2019ennemi commence fissur\xE9"),
    bonus: { fissure: 0.25 },
    texte: t("Elle voit la faille dans le noir : l\u2019ennemi vis\xE9 commence chaque combat fissur\xE9 (+25 % de d\xE9g\xE2ts pendant deux tours)."),
    paliers: [
      { court: t("fissure de 3 tours"), texte: t("La faille reste ouverte : la Fissure du d\xE9part dure trois tours."), bonus: { fissureTours: 3 } },
      { court: t("tout le groupe commence fissur\xE9"), texte: t("Elle voit toutes les failles : chaque ennemi du groupe commence le combat fissur\xE9."), bonus: { fissureGroupe: true } }
    ]
  },
  aurel: {
    nom: t("Ombre courtoise"),
    fait: "gardiens",
    seuil: 6,
    quoi: "gardiens vaincus",
    court: t("1re attaque ennemie \u221240 %"),
    bonus: { desarme: 0.4 },
    texte: t("Son ombre retient le premier coup : la premi\xE8re attaque de chaque ennemi perd 40 % de sa force, quel que soit le tour o\xF9 elle tombe."),
    paliers: [
      { court: t("1re attaque ennemie \u221250 %"), texte: t("Son ombre p\xE8se plus : la premi\xE8re attaque de chaque ennemi perd 50 % de sa force."), bonus: { desarme: 0.5 } },
      { court: t("le coup retenu donne 1 Flux"), texte: t("Il retourne la politesse : chaque coup retenu par son ombre donne 1 Flux \xE0 l\u2019escouade."), bonus: { retenueFlux: 1 } }
    ]
  },
  coursier: {
    nom: t("Foul\xE9e"),
    fait: "combats",
    seuil: 40,
    quoi: t("combats gagn\xE9s"),
    court: t("1 Flux au d\xE9part"),
    bonus: { flux: 1 },
    texte: t("Il court devant l\u2019escouade : chaque combat commence avec 1 Flux."),
    paliers: [
      { court: t("2 Flux au d\xE9part contre un gardien"), texte: t("Il a rep\xE9r\xE9 l\u2019antre : contre un gardien, le combat commence avec 2 Flux."), bonus: { fluxGardien: 2 } },
      { court: t("fuir ne co\xFBte plus de butin"), texte: t("Il conna\xEEt la route du retour : remonter en fuyant ne fait plus perdre de minerai."), bonus: { fuiteSure: true } }
    ]
  },
  docker: {
    nom: t("Bras de quai"),
    fait: "missions",
    seuil: 8,
    quoi: "missions accomplies",
    court: t("garde 25 % du bouclier"),
    bonus: { garde: 0.25 },
    texte: t("Il ne l\xE2che rien : \xE0 chaque tour, l\u2019escouade garde 25 % de son bouclier pour le tour suivant."),
    paliers: [
      { court: t("garde 35 % du bouclier"), texte: t("Il serre plus fort : l\u2019escouade garde 35 % de son bouclier d\u2019un tour \xE0 l\u2019autre."), bonus: { garde: 0.35 } },
      { court: t("le bouclier restant soigne"), texte: t("Rien ne se perd au quai : \xE0 la victoire, la moiti\xE9 du bouclier restant soigne le Porteur le plus bless\xE9."), bonus: { soinQuai: 0.5 } }
    ]
  },
  guetteur: {
    nom: t("Guet"),
    fait: "anciens",
    seuil: 12,
    quoi: "empreintes anciennes vaincues",
    court: t("+1 carte au premier tour"),
    bonus: { main: 1 },
    texte: t("Il voit venir de loin : au premier tour de chaque combat, ta main compte une carte de plus."),
    paliers: [
      { court: t("voit l\u2019intention d\u2019apr\xE8s"), texte: t("Il voit plus loin : \xE0 c\xF4t\xE9 de l\u2019intention, une petite pastille montre ce que l\u2019ennemi vis\xE9 pr\xE9pare au tour d\u2019apr\xE8s."), bonus: { presage: true } },
      { court: t("+1 carte \xE0 chaque phase de gardien"), texte: t("Rien ne le surprend : quand un gardien change de phase, ta main prend une carte de plus."), bonus: { phaseMain: 1 } }
    ]
  },
  kessa: {
    nom: t("N\xE9e-de-mue"),
    fait: "fondations",
    seuil: 25,
    quoi: t("combats dans les Seuils"),
    court: t("le bouclier renvoie 30 % des coups"),
    bonus: { chitine: 0.3 },
    texte: t("Sa chitine pique qui la frappe : quand le bouclier d\u2019escouade encaisse un coup, 30 % de ce qu\u2019il absorbe revient \xE0 l\u2019ennemi."),
    paliers: [
      { court: t("le bouclier renvoie 40 %"), texte: t("Sa chitine durcit : 40 % de ce que le bouclier d\u2019escouade absorbe revient \xE0 l\u2019ennemi."), bonus: { chitine: 0.4 } },
      { court: t("le renvoi peut achever"), texte: t("Sa mue est compl\xE8te : le renvoi de la chitine peut achever l\u2019ennemi qui frappe."), bonus: { chitineAcheve: true } }
    ]
  },
  liane: {
    nom: t("Galons blancs"),
    fait: "scellees",
    seuil: 12,
    quoi: t("salles scell\xE9es ouvertes"),
    court: t("+1 Flux par F\xEAlure r\xE9sonnante"),
    bonus: { felureFlux: 1 },
    texte: t("Chaque implant est un galon : une F\xEAlure bris\xE9e par une cha\xEEne qui r\xE9sonne donne 1 Flux de plus."),
    paliers: [
      { court: t("+2 Flux par F\xEAlure contre un gardien"), texte: t("Ses galons p\xE8sent face aux grands : contre un gardien, chaque F\xEAlure bris\xE9e en r\xE9sonance donne 2 Flux de plus."), bonus: { felureFluxGardien: 2 } },
      { court: t("F\xEAlure r\xE9sonnante : +1 carte"), texte: t("Chaque galon ouvre une porte : une F\xEAlure bris\xE9e en r\xE9sonance fait aussi piocher une carte."), bonus: { felurePioche: 1 } }
    ]
  },
  joss: {
    nom: t("Nuit blanche"),
    fait: "combats",
    seuil: 35,
    quoi: t("combats gagn\xE9s"),
    court: t("soigne le plus bless\xE9 chaque tour"),
    bonus: { veille: 0.06 },
    texte: t("Le quartier entier l\u2019a veill\xE9, il veille \xE0 son tour : \xE0 la fin de chaque tour ennemi, le Porteur le plus bless\xE9 r\xE9cup\xE8re 6 % de ses PV."),
    paliers: [
      { court: t("soigne le plus bless\xE9 de 8 %"), texte: t("Il veille plus fort : \xE0 la fin de chaque tour ennemi, le plus bless\xE9 r\xE9cup\xE8re 8 % de ses PV."), bonus: { veille: 0.08 } },
      { court: t("veille sur les deux plus bless\xE9s"), texte: t("Il ne dort plus : \xE0 la fin de chaque tour ennemi, les deux Porteurs les plus bless\xE9s r\xE9cup\xE8rent chacun 8 % de leurs PV."), bonus: { veilleDeux: true } }
    ]
  }
};
var QUOTIDIENS = {
  combats: { titre: t("Gagner 4 combats"), objectif: 4 },
  expedition: { titre: t("Vaincre un gardien, r\xE9ussir une fouille ou une \xC9preuve"), objectif: 1 },
  chantier: { titre: t("Lancer une am\xE9lioration de b\xE2timent"), objectif: 1 }
};
var bonusPv = (j, id) => (id === "vela" ? j.actes.lecture === "autoriser" ? -4 : j.actes.lecture === "refuser" ? 4 : 0 : 0) + bonusClinique(j, id);
var CLINIQUE_PV = { des: 3, parNiveau: 0.02 };
var partPvClinique = (j) => CLINIQUE_PV.parNiveau * Math.max(0, (j.batiments?.clinique ?? 0) - CLINIQUE_PV.des);
var bonusClinique = (j, id) => Math.round(pvNiveau(j, id) * partPvClinique(j));
var LECTURE_PROFONDE = { id: "lecture-profonde", porteur: "vela", nom: t("Lecture profonde"), f: 8, type: "atk", v: 16, effet: { type: "accord" } };
var typeDuJour = (jour) => ["combats", "expedition", "chantier"][(jour % 3 + 3) % 3];
function log(j, t2) {
  j.journal.unshift(t2);
  j.journal = j.journal.slice(0, 8);
}
var enExpedition = (j, id) => !!j.expedition && j.expedition.porteurs.some((p) => p.id === id) || enMission(j, id);
var enMission = (j, id) => !!j.missions?.some((m) => m.porteur === id) || !!j.marees?.contrat?.porteurs.includes(id) || j.basses?.expedition?.porteur === id || !!j.confiee?.porteurs.includes(id);
var posteDe = (j, b) => Object.keys(j.porteurs).find((id) => j.porteurs[id].poste === b) ?? null;
var CONFIANCE = {
  /** le district entier : 48 familles, « tout le monde à la fois » */
  population: 48,
  /** un palier toutes les 6 familles (8 jusqu'à 48) */
  palier: 6,
  /** points de bouche-à-oreille qu'il faut pour qu'une famille du quartier rejoigne (26 familles : 390 points en tout) */
  rumeur: 15,
  /** gardien du front vaincu la première fois, de −1 à −10 (l'espoir de l'Écluse) ; plus bas, un peu moins */
  gardien: 10,
  gardienProfond: 5,
  /** naufragés recueillis en mer (seulement quand la barque en ramène vraiment) */
  naufrages: { courte: 3, longue: 5 },
  /** un pillage repoussé par la garnison du Port */
  defense: 5,
  /** un quai gravé de la Flèche atteint (de la place gagnée sur les îles) */
  quaiGrave: 25,
  /** la Nuit des lignes, chaque lundi : part des points gagnés pendant la semaine qui s'ajoutent en plus */
  nuit: 0.15,
  /** palier qu'il faut pour l'Accord ouvert (avec la Clinique) : 12 familles */
  accord: 2,
  /** palier qui ajoute un étal au Comptoir (18 familles) */
  comptoir: 3
};
var NOMS_CONFIANCE = { 0: t("Ils t\u2019observent"), 1: t("Ils t\u2019\xE9coutent"), 4: t("Ils t\u2019aident"), 8: t("Tout le district te suit") };
var nbFoyers = (j) => j.foyers?.length ?? 0;
function niveauConfiance(foyers) {
  const h = Math.min(CONFIANCE.population, Math.max(0, foyers));
  const max2 = Math.floor(CONFIANCE.population / CONFIANCE.palier);
  const niveau = Math.min(max2, Math.floor(h / CONFIANCE.palier));
  return niveau >= max2 ? { niveau, dans: CONFIANCE.palier, requis: 0 } : { niveau, dans: h - niveau * CONFIANCE.palier, requis: CONFIANCE.palier };
}
var ACCORD_OUVERT = { clinique: 3, confiance: CONFIANCE.accord };
var CREUSEURS = {
  /** creuseurs logés selon le niveau du Noyau (index = niveau). Audit du 7 novembre 2026 : avant 4, 7, 10, 14, 24… le Noyau 3
   *  logeait déjà les creuseurs de −10 et ne freinait plus rien ; étalé, chaque niveau ouvre un étage de plus :
   *  Noyau 5 pour −7, 6 pour −8 et −9, 7 pour −10. (Un Noyau 10 obligatoire pour −10 faisait 18 sessions d'attente : écarté.) */
  logement: [0, 3, 4, 5, 6, 7, 8, 9, 10, 12, 60],
  /** creuseurs qu'il faut pour ouvrir la Strate −n, qui y restent (au-delà de la table : +1 par Strate, au plus le logement) */
  // −8 à −10 : 8, 8, 9 au lieu de 9, 11, 13 (3 novembre 2026, validé par Bryan) : moins d'attente, plus de défi (FORCE.table relevée).
  // 12 novembre 2026 (Bryan : « je roule sur tout le monde, mais je dois attendre mes creuseurs ») : plus de verrou après le gardien,
  // la Strate suivante s'ouvre dès qu'il est vaincu (avant : 0, 0, 2, 3, 4, 5, 6, 7, 8, 8, 9)
  requis: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  // 12 novembre 2026 : plus de verrou au Fond non plus (avant : 1)
  parStrateEnsuite: 0,
  gardien: 1,
  /** chances de ramener un fouilleur perdu : fouille ciblée, mission courte, mission longue */
  fouille: 0.25,
  /** audit du 7 novembre 2026 (mur de −7 à −10 : 15 sessions sur 18 à attendre) : une chance sur deux à partir de −6 */
  fouilleProfonde: { des: 6, chance: 0.5 },
  /**
   * Les fouilleurs du jour (8 novembre 2026, audit : −10 au jour 16 à cinq sessions par jour, au jour 40 à une seule) :
   * à partir de −6, la première fouille réussie de la journée ramène un creuseur à coup sûr ; une fois `parJour` creuseurs
   * ramenés des fouilles dans la journée, les suivantes n'en ramènent plus qu'avec `chanceEnsuite`.
   * Celui qui passe une fois par jour avance plus sûrement ; celui qui enchaîne garde l'avance, en moins grand.
   */
  fouilleursDuJour: { garantis: 1, parJour: 2, chanceEnsuite: 0.2 },
  missionCourte: 0.1,
  missionLongue: 0.3,
  epreuve: 1,
  /**
   * Les missions en mer sont illimitées (28 octobre 2026, idée de Luc) : on peut farmer composants, cartes et XP autant
   * qu'on veut, mais les naufragés ne ramènent au plus que cette part des creuseurs de l'étage suivant, par Strate.
   * Le reste vient du front (gardien, fouilles, Épreuves, Confiance) : on ne peut pas avancer plus vite dans l'histoire en mer.
   */
  naufragesParStrate: 0.65,
  // ≈ deux tiers (réglé au robot : le rythme de descente reste celui d'avant)
  /** creuseurs volontaires par palier de Confiance atteint */
  confiance: 1
};
function creuseursRequis(strate) {
  const t2 = CREUSEURS.requis;
  const max2 = CREUSEURS.logement[CREUSEURS.logement.length - 1];
  return Math.min(max2, strate < t2.length ? t2[strate] : t2[t2.length - 1] + CREUSEURS.parStrateEnsuite * (strate - t2.length + 1));
}
function porteursPresents(j) {
  return PORTEURS.filter((p) => p.arrivee ? j.arrives.includes(p.id) : p.nomme || j.recrues).map((p) => p.id);
}
function escouadeDe(j) {
  const presents = porteursPresents(j);
  return [...new Set(j.escouade ?? [])].filter((id) => presents.includes(id)).slice(0, 3);
}
var NB_ESCOUADES = 3;
var ESCOUADES_STRATE = 5;
var escouadesOuvertes = (j) => strateVaincue(j) >= ESCOUADES_STRATE || (j.escouades ?? []).slice(1).some((e) => e?.length) ? NB_ESCOUADES : 1;
var escouadeActive = (j) => Number.isInteger(j.escouadeActive) && j.escouadeActive >= 0 && j.escouadeActive < escouadesOuvertes(j) ? j.escouadeActive : 0;
function escouadesDe(j) {
  const presents = porteursPresents(j);
  const a = escouadeActive(j);
  const pris = new Set(escouadeDe(j));
  return Array.from({ length: escouadesOuvertes(j) }, (_, k) => {
    if (k === a) return escouadeDe(j);
    const liste = [...new Set(j.escouades?.[k] ?? [])].filter((id) => presents.includes(id) && !pris.has(id)).slice(0, 3);
    liste.forEach((id) => pris.add(id));
    return liste;
  });
}
var strateVaincue = (j) => j.frontVaincu ? j.strate : j.strate - 1;
var FOND = { premiere: 11 };
var premiersPas = (j) => !!j.chambre && strateVaincue(j) < 1;
brancherPorteurDeLaCarte((e, cle) => {
  const id = Object.keys(e.porteurs ?? {}).find((p) => e.porteurs[p]?.modules.includes(cle));
  return id ? { id, niveau: niveauPorteur(e, id).niveau } : null;
});

// src/core/strates.ts
var PISTES = { nous: t("Piste des n\xF4tres"), avant: t("Piste de ceux d\u2019avant") };
var H = (strate, n, titre, recit, details, choix, fait, revelation) => ({ strate, n, titre, recit, details, choix, fait, ...revelation ? { revelation } : {} });
var rv = (nom, fait, ...voix) => ({ nom, voix, fait });
var d = (nom, ...voix) => ({ nom, voix });
var v = (qui, texte, si) => si ? { qui, texte, si } : { qui, texte };
var HALTES = [
  // ---------- −1 · Les Pompes noyées ----------
  H(
    1,
    1,
    t("Le mur des fouilleurs"),
    t("Un pilier des pompes, couvert de noms gratt\xE9s au couteau. Les fouilleurs de Vertiga y \xE9crivent le leur avant de descendre, et le barrent quand ils remontent."),
    [
      d(t("Les noms"), v("doran", t("Le nom de mon p\xE8re est l\xE0, dat\xE9 de 2066. Jamais barr\xE9. Il est remont\xE9, pourtant. Il n\u2019a jamais voulu le barrer.")), v("", t("Des centaines de noms, barr\xE9s ou non. Les plus anciens datent de 2066."))),
      d(t("Le pied du pilier"), v("sasha", t("Le plan dit : b\xE9ton jusqu\u2019au roc. Regarde : le pilier est pos\xE9 sur une marche taill\xE9e, de niveau au millim\xE8tre. Personne chez nous ne taille comme \xE7a.")), v("doran", t("Nos plans disent b\xE9ton jusqu\u2019au roc. Il n\u2019y a pas de roc. Le pilier est pos\xE9 sur une marche taill\xE9e. Une marche, directeur.")), v("", t("Le pilier ne repose pas sur la roche, mais sur une large marche de pierre taill\xE9e, parfaitement plane."))),
      d(t("Sous la marche"), v("vela", t("Us\xE9e au milieu, comme les marches de la Tour, mais trop haute pour nos jambes. Des milliers de pieds sont pass\xE9s l\xE0, et pas des n\xF4tres. Et sous cette marche, il y en a une autre.")), v("ilka", t("Il y a une autre marche dessous. Et encore une. Un escalier. Sous nos pompes, il y a un escalier.")), v("", t("Sous la marche, une autre, puis une autre : un escalier aux marches trop hautes, qui s\u2019enfonce dans l\u2019eau noire.")))
    ],
    [
      { texte: t("Graver ton nom"), effet: "composants", piste: "nous", carte: "cache", drapeau: "nom-grave", recit: t("Tu graves ton nom sous celui des autres. Juste en dessous, un fouilleur a laiss\xE9 quelques pi\xE8ces pour le suivant, et une fl\xE8che gratt\xE9e au couteau : \xAB r\xE9serve, plus bas \xBB.") },
      { texte: t("Mesurer la marche"), effet: "eclat", piste: "avant", carte: "archive", drapeau: "mesure-marche", recit: t("Fil \xE0 plomb, m\xE8tre ruban : 2,10 m de large, de niveau parfait. Les Fondations de ton district reposent sur la marche de quelqu\u2019un d\u2019autre.") }
    ],
    t("Les piliers de mon district ne reposent pas sur la roche, mais sur une marche taill\xE9e, et sous elle, une autre. Qui a taill\xE9 un escalier sous la mer, et pour aller o\xF9 ?")
  ),
  // ---------- −2 · Les Abris murés ----------
  H(
    2,
    1,
    t("Le registre des abris"),
    t("Un abri de 2060, entrouvert. Sur le mur, un registre peint : les quarante familles qui y ont dormi pendant les grandes crues."),
    [
      d(t("Le registre peint"), v("doran", t("Les familles du chantier. Quand on l\u2019a ferm\xE9, la ville leur a donn\xE9 l\u2019anneau \xE0 la place de la paie. La mienne en est. C\u2019est comme \xE7a que le quartier est n\xE9.")), v("ilka", t("La moiti\xE9 de ces familles, je leur livre encore le pain. Aucune ne m\u2019a jamais parl\xE9 de cet abri.")), v("", t("Quarante noms de familles, peints en blanc. Presque tous du quartier."))),
      d(t("Le pl\xE2tre fendu"), v("sasha", t("\xC7a sonne creux. Derri\xE8re le pl\xE2tre, ce n\u2019est pas de la brique : c\u2019est un treillis de cristal. On a mont\xE9 l\u2019abri contre quelque chose qui \xE9tait d\xE9j\xE0 l\xE0.")), v("doran", t("Derri\xE8re le pl\xE2tre, un treillis de cristal. Les ma\xE7ons de 2060 l\u2019ont couvert sans poser de questions. Pendant les crues, on n\u2019en posait pas.")), v("", t("Par une fente du pl\xE2tre, on voit luire un treillis de cristal."))),
      d(t("Un cristal tomb\xE9"), v("vela", t("Tomb\xE9 d\u2019un sac de pilleur. Il ne veut pas remonter avec nous. Il veut rejoindre les autres, plus bas. On dirait qu\u2019il a peur de rester en haut.")), v("", t("Un petit cristal tomb\xE9 d\u2019un sac luit faiblement sur les marches.")))
    ],
    [
      { texte: t("Laisser rouler le cristal"), effet: "lampe", piste: "avant", drapeau: "cristal-libre", recit: t("Tu poses le cristal sur la derni\xE8re marche. Il roule vers le bas, plus vite que la pente ne le voudrait, et sa lueur file devant vous, salle apr\xE8s salle.") },
      { texte: t("Recopier les quarante noms"), effet: "composants", piste: "nous", carte: "cache", recit: t("Ilka lit les noms \xE0 voix haute, tu les recopies. Elle en conna\xEEt vingt-deux. \xAB Je leur demanderai pourquoi ils n\u2019en parlent jamais. \xBB Au bas du registre, une main a ajout\xE9 : \xAB vivres, salle d\u2019apr\xE8s \xBB.") }
    ],
    t("Les abris de 2060 ont \xE9t\xE9 mont\xE9s contre un treillis de cristal. Pendant les crues, quarante familles ont dormi contre un Berceau, et n\u2019en ont jamais parl\xE9.")
  ),
  H(
    2,
    2,
    t("La galerie des Chouettes"),
    t("La galerie effondr\xE9e de 2104. Six enfants mu\xE9s pour les fouilles de nuit y ont guid\xE9 vingt adultes dans le noir, trois jours durant. L\u2019\xE9boulis est d\xE9gag\xE9 depuis longtemps. Les mains peintes sont rest\xE9es."),
    [
      d(t("Les mains peintes"), v("nuit", t("Six mains d\u2019enfant, \xE0 hauteur de hanche. La promotion d\u2019avant la mienne. On nous les montrait, petits, pour nous donner du courage.")), v("", t("Six petites mains peintes \xE0 hauteur de hanche, et une date : 2104."))),
      d(t("La cause"), v("sasha", t("Les infos ont dit \xAB infiltration \xBB. Regarde les bords de l\u2019\xE9boulis : c\u2019est du cristal bris\xE9, pas de la roche. Ils ont perc\xE9 un treillis, comme celui de l\u2019abri. C\u2019est le treillis qui a c\xE9d\xE9.")), v("ilka", t("Les infos ont dit \xAB infiltration \xBB. Les bords sont en cristal cass\xE9. Ils ont perc\xE9 un treillis et tout est tomb\xE9. \xC7a, personne ne l\u2019a dit.")), v("", t("Les bords de l\u2019\xE9boulis sont de cristal bris\xE9, pas de roche."))),
      d(t("La gaine"), v("doran", t("La gaine par o\xF9 ils sont sortis. Elle n\u2019\xE9tait sur aucun plan. Ce n\u2019est pas une gaine de chez nous : ronde, lisse, sans une trace d\u2019outil. Elle vient d\u2019en dessous, et elle monte.")), v("", t("Une gaine ronde et lisse, qui n\u2019\xE9tait sur aucun plan, s\u2019\xE9l\xE8ve dans la roche.")))
    ],
    [
      { texte: t("Ajouter ta main"), effet: "eclat", piste: "nous", carte: "cache", drapeau: "main-chouette", recit: t("Tu poses ta main dans la peinture, \xE0 c\xF4t\xE9 des leurs, \xE0 ta hauteur \xE0 toi. Un jour, un enfant saura qu\u2019un directeur est pass\xE9 par l\xE0.") },
      { texte: t("Explorer la gaine"), effet: "composants", piste: "avant", carte: "scellee", drapeau: "gaine", recit: t("La gaine file en spirale, vers le haut comme vers le bas, lisse comme l\u2019int\xE9rieur d\u2019un coquillage, sans une marche ni une prise. Au premier coude, du mat\xE9riel oubli\xE9 par les secours de 2104. Tout au fond, quelque chose a entendu vos pas.") }
    ],
    t("L\u2019\xE9boulement des Chouettes, en 2104, n\u2019est pas venu de l\u2019eau : on avait perc\xE9 un treillis de cristal. Et la gaine qui les a sauv\xE9s n\u2019est sur aucun plan : ronde, lisse, sans une trace d\u2019outil."),
    {
      nous: rv(
        t("Ce que savaient les familles"),
        t("Quatre des six Chouettes venaient des familles de l\u2019abri de 2060. Leurs grands-parents avaient vu le cristal derri\xE8re le pl\xE2tre et s\u2019\xE9taient tus ; quarante ans plus tard, les petits-enfants ont perc\xE9 le m\xEAme treillis sans savoir ce que c\u2019\xE9tait."),
        v("ilka", t("Quatre des six Chouettes portent un nom du registre de l\u2019abri. Leurs grands-parents avaient vu le pl\xE2tre fendu, et s\u2019\xE9taient tus. Leurs petits-enfants ont perc\xE9 le m\xEAme treillis. Le silence des uns a fait l\u2019\xE9boulement ; le courage des autres a sauv\xE9 vingt personnes.")),
        v("", t("Quatre des six noms peints sous les mains figurent aussi au registre de l\u2019abri de 2060. Ces familles avaient vu le cristal derri\xE8re le pl\xE2tre, et n\u2019en avaient jamais rien dit."))
      ),
      avant: rv(
        t("Une gaine qui monte"),
        t("La gaine des Chouettes a \xE9t\xE9 perc\xE9e par en dessous : quelqu\u2019un montait. Le cristal de l\u2019abri a pris ce chemin sans h\xE9siter."),
        v("sasha", t("Regarde les \xE9clats au bord de la gaine : ils sont tous tomb\xE9s vers le bas. Ce trou a \xE9t\xE9 creus\xE9 par en dessous. Celui qui l\u2019a perc\xE9 ne descendait pas vers nous, directeur. Il montait.")),
        v("doran", t("Les \xE9clats au bord de la gaine sont tomb\xE9s vers le bas. On a creus\xE9 ce trou par en dessous. Quelqu\u2019un montait, et le petit cristal a pris le m\xEAme chemin, dans l\u2019autre sens.")),
        v("", t("Les \xE9clats au bord de la gaine sont tous tomb\xE9s vers le bas : elle a \xE9t\xE9 creus\xE9e par en dessous. Une tra\xEEn\xE9e de lueur y file, celle du cristal de l\u2019abri."))
      )
    }
  ),
  // ---------- −3 · La Galerie aux lueurs ----------
  H(
    3,
    1,
    t("La derni\xE8re lampe"),
    t("Ici s\u2019arr\xEAtent les lampes humaines. Une lanterne de fouilleur pend \xE0 un clou, \xE9teinte. Plus loin, tous les puits de Vertiga d\xE9bouchent dans la m\xEAme nuit."),
    [
      d(t("La lanterne"), v("ilka", t("Personne n\u2019a jamais accroch\xE9 de lampe plus loin. Les fouilleurs disaient : \xAB Apr\xE8s le clou, c\u2019est le noir qui d\xE9cide. \xBB")), v("", t("Une lanterne \xE0 algues pend \xE0 un clou. Personne n\u2019en a jamais accroch\xE9 plus loin."))),
      d(t("Les autres puits"), v("doran", t("L\xE0, le puits des Hauts-Ponts. L\xE0, celui du march\xE9. Chaque district croit avoir son trou \xE0 lui. En bas, c\u2019est le m\xEAme noir pour tout le monde. Et regarde : chaque bouche tombe pile au-dessus d\u2019un palier de pierre.")), v("", t("Des bouches de puits s\u2019ouvrent dans la vo\xFBte, une par district. Toutes donnent ici, chacune au-dessus d\u2019un palier de pierre taill\xE9e."))),
      d(t("Une lueur au loin"), v("nuit", t("La rampe en laiton du Puits Z\xE9ro. Les visiteurs y descendent depuis soixante ans, et ils regardent tous le plafond. Personne ne regarde le sol.")), v("vela", t("Le Puits Z\xE9ro, l\xE0-bas. On y vend des souvenirs en plastique. Tout le monde l\xE8ve les yeux. Personne ne les baisse.")), v("", t("Au loin, la lueur de la rampe de visite du Puits Z\xE9ro.")))
    ],
    [
      { texte: t("Prendre la lanterne"), effet: "lampe", piste: "avant", recit: t("Tu rallumes la lanterne avec une poign\xE9e d\u2019algues. Sa lumi\xE8re perce le brouillard des deux salles suivantes.") },
      { texte: t("Laisser le clou au noir"), effet: "eclat", piste: "nous", carte: "cache", drapeau: "clou-respecte", recit: t("Tu laisses la lanterne \xE0 son clou, comme les fouilleurs avant toi.") }
    ],
    t("\xC0 \u22123, tous les puits de Vertiga d\xE9bouchent dans la m\xEAme nuit, et chaque bouche tombe au-dessus d\u2019un palier de pierre. Personne ne m\u2019a jamais dit pourquoi.")
  ),
  H(
    3,
    2,
    t("Le message des patrouilles"),
    t("Sur un pilier, des fl\xE8ches trac\xE9es \xE0 la craie, et des chiffres. Les Brigades se sont rep\xE9r\xE9es comme elles ont pu dans le noir."),
    [
      d(t("Les chiffres"), v("ilka", t("\xAB 12 \xBB, puis \xAB 11 \xBB, puis \xAB 9 \xBB. Ils se comptaient. Il en manque trois.")), v("", t("Des chiffres \xE0 la craie : 12, puis 11, puis 9."))),
      d(t("Une respiration"), v("nuit", t("Neuf respirations, en bas, serr\xE9es les unes contre les autres. Ils ont peur du noir. Personne ne leur a appris \xE0 le traverser."), "main-chouette"), v("nuit", t("Neuf. Je les compte au souffle. Ils ne bougent plus : ils attendent.")), v("vela", t("Neuf voix, tr\xE8s loin en dessous. Elles attendent.")), v("", t("Un souffle, tr\xE8s loin dans le noir. Ou le vent dans les puits."))),
      d(t("Sous la poussi\xE8re"), v("sasha", t("Des marches, sous la poussi\xE8re. 2,10 m de large. Exactement la marche de \u22121. C\u2019est le m\xEAme escalier que sous nos pompes, directeur. Et il monte."), "mesure-marche"), v("doran", t("Il y a des marches sous la poussi\xE8re. Larges, us\xE9es au milieu. Toute la galerie est un escalier. Et il monte vers le Puits Z\xE9ro.")), v("", t("Sous la poussi\xE8re, des marches us\xE9es : la galerie enti\xE8re est un escalier qui monte vers le Puits Z\xE9ro.")))
    ],
    [
      { texte: t("Laisser une marque pour Hald"), effet: "eclat", piste: "nous", carte: "archive", drapeau: "craie-hald", recit: t("Tu ajoutes une fl\xE8che, la bonne, et la date. Si une patrouille repasse, elle trouvera le chemin.") },
      { texte: t("Descendre quelques marches"), effet: "composants", piste: "avant", carte: "scellee", recit: t("Vous descendez contre le sens de l\u2019usure. \xC0 chaque palier, une niche vide, de la taille d\u2019une couchette. Dans l\u2019une, du mat\xE9riel de patrouille abandonn\xE9. Dans la derni\xE8re, quelque chose dort encore.") }
    ],
    t("La galerie de \u22123 est un escalier immense, us\xE9 par des milliers de pas. Les patrouilles de Hald sont quelque part en dessous, et elles attendent.")
  ),
  H(
    3,
    3,
    t("Le c\u0153ur qui compte"),
    t("L\u2019escalier finit ici, juste sous la salle de 2062. Au-dessus, on devine la rampe en laiton du Puits Z\xE9ro. En bas des derni\xE8res marches, une flaque d\u2019empreintes m\xEAl\xE9es, immobile : la Confluence s\u2019est repos\xE9e l\xE0."),
    [
      d(t("Le dernier palier"), v("doran", t("La gaine des Chouettes d\xE9bouche ici, dans la vo\xFBte. Ronde, lisse. Elle part de ce palier, et elle continue plus haut que la salle de 2062."), "gaine"), v("sasha", t("Le palier du dessus, c\u2019est le sol de la salle de 2062. Les visiteurs du Puits Z\xE9ro marchent sur la derni\xE8re marche de quelqu\u2019un, et ils ne le savent pas.")), v("", t("Le dernier palier de l\u2019escalier est le sol m\xEAme de la salle de 2062, la Strate z\xE9ro."))),
      d(t("La forme"), v("vela", t("Elle s\u2019est roul\xE9e en boule autour d\u2019une voix plus petite que les autres. Elle la prot\xE8ge.")), v("", t("Une forme creus\xE9e dans les cristaux, comme si quelque chose de grand s\u2019\xE9tait roul\xE9 en boule."))),
      d(t("Un murmure"), v("vela", t("Un mot, toujours le m\xEAme, trop bas pour que je l\u2019entende. Elle le r\xE9p\xE8te comme si elle avait peur de l\u2019oublier.")), v("joss", t("Quelqu\u2019un r\xE9p\xE8te un mot, au milieu de tous les autres. Trop bas. Il a peur de l\u2019oublier.")), v("", t("Un murmure, toujours le m\xEAme mot, trop bas pour qu\u2019on le comprenne.")))
    ],
    [
      { texte: t("\xC9couter jusqu\u2019au bout"), effet: "eclat", piste: "avant", carte: "archive", drapeau: "compte-entendu", recit: t("Tu restes longtemps \xE0 \xE9couter. Le mot finit par se d\xE9tacher des autres, net : \xAB Compte. \xBB") },
      { texte: t("D\xE9gager l\u2019\xE9boulis"), effet: "composants", piste: "nous", carte: "cache", drapeau: "eboulis", recit: t("Tu fais d\xE9gager le haut d\u2019un \xE9boulis voisin, derri\xE8re lequel s\u2019arr\xEAtent des traces de bottes. Les patrouilles entendront qu\u2019on vient. Parmi les gravats, du mat\xE9riel de patrouille.") }
    ],
    t("Le Puits Z\xE9ro n\u2019est pas le fond d\u2019un trou : c\u2019est le dernier palier d\u2019un escalier. Et au pied des marches, une voix r\xE9p\xE8te \xAB Compte \xBB."),
    {
      nous: rv(
        t("Les croix de 2062"),
        t("Sous ta fl\xE8che, la craie des ouvriers de 2062 : une croix sous chaque bouche de puits, et \xAB Toutes sur une marche. \xC0 signaler. \xBB Ils l\u2019avaient remarqu\xE9 et not\xE9. Personne ne s\u2019est demand\xE9 pourquoi ces piliers tenaient."),
        v("doran", t("Sous ta fl\xE8che, il y en a d\u2019autres, plus vieilles : la craie des ouvriers de 2062. Une croix sous chaque bouche de puits, et une note : \xAB Toutes sur une marche. \xC0 signaler. \xBB Personne n\u2019y a jamais donn\xE9 suite. Les gars d\u2019en bas voient toujours ce que personne ne lit.")),
        v("sasha", t("Sous ta fl\xE8che, la craie des ouvriers de 2062 : une croix sous chaque bouche de puits, et \xAB Toutes sur une marche. \xC0 signaler. \xBB Ils avaient fait la mesure avant moi. Personne ne l\u2019a refaite.")),
        v("", t("Sous la fl\xE8che, des marques plus anciennes, \xE0 la craie : les ouvriers de 2062 avaient mis une croix sous chaque bouche de puits, avec une note : \xAB Toutes sur une marche. \xC0 signaler. \xBB Rien d\u2019autre."))
      ),
      avant: rv(
        t("La le\xE7on"),
        t("La petite voix au c\u0153ur de la Confluence r\xE9cite une le\xE7on apprise par c\u0153ur, dont il ne reste qu\u2019un mot : \xAB Compte \xBB. Quelqu\u2019un, tout en bas, l\u2019enseignait aux enfants."),
        v("vela", t("La petite voix, au milieu des autres\u2026 Je l\u2019ai d\xE9j\xE0 entendue, dans la derni\xE8re niche de l\u2019escalier, l\xE0 o\xF9 quelque chose dormait. Elle ne compte pas. Elle r\xE9cite. Une le\xE7on apprise par c\u0153ur, comme \xE0 l\u2019\xE9cole, dont il ne reste qu\u2019un mot. Quelqu\u2019un, plus bas, l\u2019a apprise \xE0 un enfant. Et l\u2019enfant la r\xE9p\xE8te encore.")),
        v("", t("Le murmure a le rythme d\u2019une le\xE7on qu\u2019on r\xE9cite par c\u0153ur. Tout s\u2019est us\xE9, sauf un mot : \xAB Compte \xBB."))
      )
    }
  ),
  // ---------- −4 · Les Portes rondes ----------
  H(
    4,
    1,
    t("Le seuil us\xE9"),
    t("Des dizaines de portes rondes, toutes ferm\xE9es. Une seule est entrouverte, de la largeur d\u2019une main."),
    [
      d(t("La porte"), v("sasha", t("Pas de serrure dehors. Seulement un loquet, dedans. Celui qui a fait \xE7a ne voulait pas qu\u2019on l\u2019enferme. Il voulait pouvoir s\u2019enfermer.")), v("kessa", t("Aucune trace de coup, aucune griffure. Personne n\u2019a essay\xE9 de sortir.")), v("", t("Pas de serrure c\xF4t\xE9 couloir : seulement un loquet, de l\u2019autre c\xF4t\xE9."))),
      d(t("Le seuil"), v("doran", t("Us\xE9 c\xF4t\xE9 int\xE9rieur, intact c\xF4t\xE9 couloir. Quelqu\u2019un a fait les cent pas ici pendant des ann\xE9es, sans jamais repasser le seuil.")), v("", t("Le seuil est creus\xE9 c\xF4t\xE9 int\xE9rieur, intact c\xF4t\xE9 couloir."))),
      d(t("Par la fente"), v("vela", t("Des cristaux en cercle, et une couche au milieu. Quelqu\u2019un dormait entour\xE9 de ses pierres, comme on dort au milieu des siens.")), v("", t("Par la fente, des cristaux rang\xE9s en cercle autour d\u2019une couche de pierre.")))
    ],
    [
      { texte: t("Compter les cristaux"), effet: "eclat", piste: "avant", carte: "archive", drapeau: "vingt-trois", recit: t("Vingt-trois cristaux, rang\xE9s avec soin, et une seule couche. Tu notes le chiffre.") },
      { texte: t("Relever les traces du couloir"), effet: "composants", piste: "nous", carte: "cache", recit: t("Dans la poussi\xE8re du couloir, des semelles d\u2019en haut, r\xE9centes, qui vont de porte en porte sans en ouvrir aucune. Une \xE9quipe a fait l\u2019inventaire, et n\u2019en a rien dit. Elle a laiss\xE9 une caisse un peu plus loin.") }
    ],
    t("Les portes rondes n\u2019enferment rien. Quelqu\u2019un s\u2019est enferm\xE9 dedans, de son plein gr\xE9, au milieu de ses pierres.")
  ),
  H(
    4,
    2,
    t("La table des voix"),
    t("Une porte ronde s\u2019est effondr\xE9e. Dedans, une table grav\xE9e en deux colonnes, et sous la table, des cristaux \xE9tiquet\xE9s."),
    [
      d(t("Les colonnes"), v("vela", t("En t\xEAte, un signe plus grand que les autres. Les empreintes le murmurent quand on les \xE9veille : \xAB Ossyra \xBB. Dessous, un nom, puis un chiffre : 12, 19, 27, 31. Ce ne sont pas des \xE2ges. C\u2019est le nombre de voix que chacun portait.")), v("", t("En t\xEAte, un signe grav\xE9 plus grand que les autres. Dessous, deux colonnes : des noms, et des chiffres qui montent. 12, 19, 27, 31."))),
      d(t("La derni\xE8re ligne"), v("ilka", t("Un nom, puis \xAB 31 \xBB, barr\xE9. \xC0 c\xF4t\xE9, \xAB 1 \xBB. Il s\u2019est \xF4t\xE9 trente voix pour n\u2019en garder qu\u2019une. La sienne.")), v("", t("Sur la derni\xE8re ligne, \xAB 31 \xBB est barr\xE9. \xC0 c\xF4t\xE9, quelqu\u2019un a grav\xE9 \xAB 1 \xBB."))),
      d(t("Sous la table"), v("sasha", t("Vingt-trois cristaux, une couche, \xE0 la porte d\u2019\xE0 c\xF4t\xE9. Ici, trente. Ils se les retiraient un par un, et ils les gardaient pr\xE8s d\u2019eux."), "vingt-trois"), v("doran", t("Trente cristaux, avec chacun son \xE9tiquette. Il ne les a pas jet\xE9s. Il les a rang\xE9s, et il s\u2019est enferm\xE9 avec eux.")), v("", t("Trente cristaux, chacun avec son \xE9tiquette, rang\xE9s sous la table.")))
    ],
    [
      { texte: t("Relever la table"), effet: "eclat", piste: "avant", carte: "archive", drapeau: "table-relevee", recit: t("Tu fais relever la table, nom par nom, chiffre par chiffre. Les Veilleurs n\u2019en ont aucune aussi compl\xE8te.") },
      { texte: t("Montrer une \xE9tiquette \xE0 Tobin"), effet: "composants", piste: "nous", carte: "scellee", recit: t("Tu glisses une \xE9tiquette dans ton sac pour Tobin : \xE0 sa fa\xE7on de se taire, tu sauras si les Veilleurs en ont d\xE9j\xE0 vu. Le reste du m\xE9tal part au district. En tintant, il a r\xE9veill\xE9 quelque chose, plus bas.") }
    ],
    t("Une table grav\xE9e compte les voix que chacun portait : 12, 19, 27, 31. Le dernier s\u2019en est \xF4t\xE9 trente pour n\u2019en garder qu\u2019une, la sienne.")
  ),
  H(
    4,
    3,
    t("Ce que garde le Gardien"),
    t("Le registre du Gardien, ouvert sur son lutrin de pierre. Des milliers de lignes. Les derni\xE8res pages sont grav\xE9es en marques que les Veilleurs savent lire : une date, un niveau, des noms."),
    [
      d(t("Les pages anciennes"), v("vela", t("Pas des noms : des gestes. \xAB Taille la pierre en biais. \xBB \xAB Chante pour endormir. \xBB Il garde ce qu\u2019ils savaient faire. Eux, il les a laiss\xE9s partir.")), v("", t("Chaque ligne ancienne d\xE9crit un geste : tailler une pierre, endormir un enfant, r\xE9parer un toit. Jamais un nom."))),
      d(t("La page de 2066"), v("doran", t("\xAB Niveau sept. Un cristal du cercle, sorti avant la fermeture. Ramass\xE9 par\u2026 \xBB Et rien. Moi, je sais. Le porte-bonheur de mon p\xE8re, qu\u2019il gardait dans la poche gauche. Je l\u2019ai sur moi depuis sa mort.")), v("", t("Une ligne r\xE9cente : \xAB 2066. Niveau sept. Un cristal du cercle, sorti avant la fermeture. Ramass\xE9 par\u2026 \xBB La ligne s\u2019arr\xEAte l\xE0."))),
      d(t("La ligne inachev\xE9e"), v("ilka", t("Il n\u2019a pas fini la ligne parce que le cristal n\u2019est jamais revenu. Il attend qu\u2019on le lui rapporte.")), v("", t("La ligne de 2066 s\u2019arr\xEAte au milieu, comme une phrase en attente.")))
    ],
    [
      { texte: t("Promettre de le rapporter"), effet: "eclat", piste: "avant", carte: "archive", drapeau: "promesse-cristal", recit: t("Une main \xE0 plat sur la page : \xAB On le rapportera l\xE0 o\xF9 il a \xE9t\xE9 pris. \xBB Le lutrin vibre doucement, comme une gorge qui se racle.") },
      { texte: t("Arracher la page"), effet: "composants", piste: "nous", carte: "cache", drapeau: "page-arrachee", recit: t("La page se d\xE9tache avec un bruit de verre. Les Veilleurs voudront la lire. Le Gardien, lui, saura qu\u2019on l\u2019a prise. Sur le lutrin, des outils de graveur.") }
    ],
    t("Le Gardien ne garde pas des gens, il garde ce qu\u2019ils savaient faire. En 2066, le p\xE8re de Doran a ramass\xE9 un cristal du niveau 7 : le porte-bonheur que Doran porte encore."),
    {
      nous: rv(
        t("Le tampon de 2074"),
        t("Les Veilleurs ont lu le registre du Gardien d\xE8s 2074 et savaient pour le cristal de 2066. Ils se sont tus pour que les Hauts ne viennent pas le prendre. Ici, prot\xE9ger quelqu\u2019un, c\u2019est souvent le laisser seul."),
        v("doran", t("Sous le lutrin, un tampon des archives de S\xE9dime, dat\xE9 de 2074. Les Veilleurs ont lu \xAB Ramass\xE9 par\u2026 \xBB. Ils savaient, et ils n\u2019ont jamais rien demand\xE9 \xE0 mon p\xE8re, pour que les Hauts ne viennent pas le lui prendre. Ils l\u2019ont laiss\xE9 tranquille. Tranquille, ici, c\u2019est pareil que seul.")),
        v("", t("Sous le lutrin, un tampon d\u2019archive des Veilleurs de S\xE9dime, dat\xE9 de 2074. Ils ont lu ce registre, et la ligne de 2066, sans jamais en parler."))
      ),
      avant: rv(
        t("Dix \xE9critures"),
        t("Dans le registre du Gardien, les gestes anciens sont grav\xE9s une fois, d\u2019une main s\xFBre ; les plus r\xE9cents, dix fois, de dix mains diff\xE9rentes. Vers la fin, ceux d\u2019avant recopiaient tout."),
        v("vela", t("Les gestes anciens sont grav\xE9s une fois, d\u2019une main s\xFBre. Les derniers, dix fois, de dix \xE9critures diff\xE9rentes. Chacun voulait sa copie du m\xEAme geste. Plus ils approchaient de la fin, plus ils recopiaient.")),
        v("ilka", t("Les derni\xE8res pages, c\u2019est le m\xEAme geste r\xE9p\xE9t\xE9 dix fois, par dix mains. Comme des gens qui se disputent le m\xEAme souvenir.")),
        v("", t("Les derni\xE8res pages r\xE9p\xE8tent les m\xEAmes gestes, dix fois, de dix \xE9critures diff\xE9rentes. Les premi\xE8res n\u2019en ont qu\u2019une."))
      )
    }
  ),
  // ---------- −5 · Le Treillis ----------
  H(
    5,
    1,
    t("Les niches vides"),
    t("Un treillis de cristal monte jusqu\u2019au plafond, perc\xE9 de niches. Presque toutes sont vides. Sur chacune, un sceau de cire blanche."),
    [
      d(t("Un sceau"), v("aurel", t("Ce sceau, je l\u2019ai vu sur les caisses qui montaient chez nous, quand j\u2019\xE9tais enfant. On me disait que c\u2019\xE9taient des fruits.")), v("liane", t("Cire blanche. Les Hauts mettent \xE7a sur tout ce qu\u2019ils prennent. M\xEAme sur les gens.")), v("", t("Un sceau de cire blanche, marqu\xE9 d\u2019armoiries."))),
      d(t("Une niche pleine"), v("vela", t("Celle-l\xE0, ils l\u2019ont oubli\xE9e. Regarde le treillis autour : terni, f\xEAl\xE9, comme du verre trop chauff\xE9. Ce n\u2019est pas le cristal qui s\u2019ab\xEEme. C\u2019est son lit.")), v("", t("Une seule niche est encore pleine. Autour d\u2019elle, le treillis est terni et f\xEAl\xE9."))),
      d(t("Un outil propre"), v("doran", t("Une pince de pr\xE9l\xE8vement, neuve, au sceau de la Compagnie des Fondations. J\u2019ai sign\xE9 chez eux en 2094. On nous disait qu\u2019on montait des \xEEles. On ne nous disait pas avec quoi.")), v("sasha", t("Une pince de pr\xE9l\xE8vement, neuve, frapp\xE9e au sceau de la Compagnie des Fondations. Rien \xE0 voir avec nos outils de fouille.")), v("", t("Une pince de pr\xE9l\xE8vement neuve, frapp\xE9e au sceau de la Compagnie des Fondations.")))
    ],
    [
      { texte: t("Laisser dormir le cristal"), effet: "eclat", piste: "avant", carte: "archive", drapeau: "berceau-laisse", recit: t("Tu ne touches pas \xE0 la derni\xE8re niche. En partant, tu sens le treillis se d\xE9tendre, comme un merci.") },
      { texte: t("Garder la pince comme preuve"), effet: "composants", piste: "nous", carte: "cache", recit: t("La pince frapp\xE9e au sceau de la Compagnie rejoint ton sac : une preuve, et qui vaut cher. Sur le manche, un num\xE9ro de lot. La caisse d\u2019o\xF9 elle vient est plus bas.") }
    ],
    t("Les Berceaux du Treillis ont \xE9t\xE9 vid\xE9s sous les sceaux des Ors\xE8ve, avec les pinces de la Compagnie des Fondations. Et ce qui s\u2019use, ce n\u2019est pas le cristal : c\u2019est le lit qui le garde.")
  ),
  H(
    5,
    2,
    t("Le campement blanc"),
    t("Un campement propre : tentes blanches, caisses scell\xE9es, une table pliante. Les gens des Hauts sont venus, ont travaill\xE9, et sont repartis."),
    [
      d(t("Les caisses"), v("ilka", t("Vides. Mais regarde les \xE9tiquettes : un num\xE9ro par niche. Ils ont tout compt\xE9.")), v("", t("Des caisses vides, num\xE9rot\xE9es une \xE0 une."))),
      d(t("Un carnet"), v("liane", t("\xAB Trente-deux pr\xE9lev\xE9s. Aucun refus. \xBB L\u2019\xE9criture de ma m\xE8re. Elle a toujours aim\xE9 \xE9crire ce mot-l\xE0.")), v("aurel", t("\xAB Trente-deux pr\xE9lev\xE9s. Aucun refus. \xBB L\u2019\xE9criture de ma tante. Les Berceaux ne refusent jamais.")), v("", t("Un carnet : \xAB Trente-deux pr\xE9lev\xE9s. Aucun refus. \xBB Sign\xE9 : I. O."))),
      d(t("Un sismographe"), v("sasha", t("Un sismographe de poche, abandonn\xE9 en marche. La courbe monte depuis trois ans. Chaque bond tombe \xE0 une date du carnet : un pr\xE9l\xE8vement, une secousse.")), v("kessa", t("La courbe monte \xE0 chaque date du carnet. Ils savaient que le treillis tremblait un peu plus \xE0 chaque fois. Ils ont continu\xE9.")), v("", t("Un sismographe abandonn\xE9 : la courbe bondit \xE0 chaque date not\xE9e dans le carnet.")))
    ],
    [
      { texte: t("Garder le carnet"), effet: "eclat", piste: "nous", carte: "archive", drapeau: "carnet-isaure", recit: t("Le carnet rejoindra les Veilleurs. L\xE0-haut, quelqu\u2019un s\u2019apercevra qu\u2019il manque.") },
      { texte: t("Lire le sismographe"), effet: "composants", piste: "avant", carte: "scellee", recit: t("Tu d\xE9roules toute la bande. Chaque secousse suit un pr\xE9l\xE8vement, puis retombe, comme un cri. Le treillis ne tremble pas : il proteste. La derni\xE8re secousse vient d\u2019une salle plus bas. Les piquets des Hauts, eux, repartent au district.") }
    ],
    t("Les Hauts pr\xE9l\xE8vent les Berceaux en connaissant le prix : \xE0 chaque pr\xE9l\xE8vement, le treillis tremble un peu plus. Le carnet est sign\xE9 \xAB I. O. \xBB.")
  ),
  H(
    5,
    3,
    t("Ce qu\u2019il reste"),
    t("Au fond du Treillis, les derni\xE8res niches pleines se sont rapproch\xE9es autour d\u2019une seule, scell\xE9e deux fois."),
    [
      d(t("Les niches serr\xE9es"), v("vela", t("La niche qu\u2019on a laiss\xE9e dormir, l\xE0-haut, a rejoint les autres. Elles se sont \xE9cart\xE9es pour nous laisser passer."), "berceau-laisse"), v("vela", t("Elles se sont rang\xE9es autour de 5-1, comme une garde. Personne d\u2019autre ne les prot\xE8ge.")), v("", t("Les derni\xE8res niches se sont rapproch\xE9es autour de la niche 5-1, comme une garde."))),
      d(t("Le sceau de 5-1"), v("aurel", t("Deux cires, l\u2019une sur l\u2019autre. Celle du dessus est dat\xE9e de 2108, l\u2019ann\xE9e o\xF9 ma tante a pris la t\xEAte de la Maison. Qu\u2019est-ce qu\u2019elle avait peur de voir ?")), v("liane", t("2108. L\u2019ann\xE9e o\xF9 ma m\xE8re a pris la Maison. Un an avant de m\u2019effacer.")), v("", t("Deux sceaux de cire blanche, l\u2019un sur l\u2019autre. Le plus r\xE9cent est dat\xE9 de 2108."))),
      d(t("L\u2019\xE9tiquette"), v("vela", t("\xAB Premier relev\xE9 du fondateur. Ne pas ouvrir. Ne pas comparer. \xBB De l\u2019or : une seule copie depuis l\u2019original. Ne pas comparer \xE0 quoi ? \xC0 celle que porte Isaure, je suppose.")), v("", t("Une \xE9tiquette sous la cire : \xAB Premier relev\xE9 du fondateur. Ne pas ouvrir. Ne pas comparer. \xBB")))
    ],
    [
      { texte: t("Ouvrir la niche 5-1"), effet: "eclat", piste: "avant", carte: "archive", drapeau: "niche-fondateur", recit: t("La niche s\u2019ouvre sans un bruit. Le premier relev\xE9 du fondateur dort l\xE0, net, presque sans f\xEAlure. M\xEAme endormi, on sent ce qu\u2019il veut : prot\xE9ger les siens. Pas les enfermer.") },
      { texte: t("Relever le sceau"), effet: "composants", piste: "nous", carte: "cache", recit: t("Tu rel\xE8ves les deux cires, dates comprises. Les Veilleurs sauront quoi en faire. Au pied de la niche, du mat\xE9riel de pr\xE9l\xE8vement abandonn\xE9.") }
    ],
    t("Dans la niche 5-1 dort le premier relev\xE9 de l\u2019empreinte du fondateur des Ors\xE8ve, \xE0 une seule copie de l\u2019original. Le sceau qui interdit de le comparer aux copies suivantes date de 2108, l\u2019ann\xE9e o\xF9 Isaure a pris la Maison."),
    {
      nous: rv(
        t("La colonne \xAB \xE9quipe \xBB"),
        t("Le carnet d\u2019Isaure a une colonne \xAB \xE9quipe \xBB : des G\xE9n\xE9s mu\xE9s sous contrat avec la Compagnie des Fondations, renouvel\xE9es chaque mois. Ce qu\u2019on croyait fini avec la Gr\xE8ve des pompes ne s\u2019est jamais arr\xEAt\xE9."),
        v("kessa", t("Il y a une colonne \xAB \xE9quipe \xBB. Six mu\xE9s sous contrat, Compagnie des Fondations, renouvel\xE9es tous les mois. Mes parents ont sign\xE9 ce genre de contrat en 2090. Au district, on croit que \xE7a s\u2019est arr\xEAt\xE9 avec la Gr\xE8ve.")),
        v("doran", t("La colonne \xAB \xE9quipe \xBB : des G\xE9n\xE9s mu\xE9s sous contrat, comme moi en 2094. Des noms qui changent chaque mois. On ne garde pas longtemps une \xE9quipe qui travaille sous l\u2019eau.")),
        v("", t("Une colonne du carnet : \xAB \xE9quipe : six mu\xE9s sous contrat, Compagnie des Fondations \xBB. Les noms changent chaque mois."))
      ),
      avant: rv(
        t("La h\xE2te"),
        t("Les niches du Treillis sont scell\xE9es d\u2019une main s\xFBre en bas, d\u2019une main qui tremble en haut. Ceux qui l\u2019ont rempli ont fini dans la h\xE2te."),
        v("sasha", t("Les sceaux du bas sont pos\xE9s au millim\xE8tre. Ceux du haut d\xE9bordent, tremblent, se chevauchent. On a rempli le haut vite, \xE0 la fin, comme on boucle ses sacs quand il est trop tard.")),
        v("vela", t("Les voix du haut ont \xE9t\xE9 rang\xE9es dans la h\xE2te. Ceux qui les ont scell\xE9es avaient peur de ne pas finir.")),
        v("", t("Les niches du bas sont scell\xE9es d\u2019une main s\xFBre ; celles du haut d\u2019une main qui tremble, en d\xE9bordant : on les a remplies vite, \xE0 la fin."))
      )
    }
  ),
  // ---------- −6 · Le Mur de 2066 ----------
  H(
    6,
    1,
    t("Le chantier"),
    t("Le chantier de 2066, laiss\xE9 en plan : b\xE9tonni\xE8re, \xE9tais, une radio. Tout a \xE9t\xE9 abandonn\xE9 en une nuit."),
    [
      d(t("La radio"), v("sasha", t("Encore r\xE9gl\xE9e sur la fr\xE9quence du chantier. Si je la r\xE9pare, on entendra leur derni\xE8re conversation.")), v("", t("Une radio de chantier, encore r\xE9gl\xE9e sur sa fr\xE9quence."))),
      d(t("Le casque"), v("doran", t("Le num\xE9ro de mon p\xE8re. Il ne laissait jamais son casque. Ce soir-l\xE0, il a laiss\xE9 son casque, et il a ramass\xE9 un cristal."), "promesse-cristal"), v("doran", t("Le num\xE9ro de mon p\xE8re. Il l\u2019a laiss\xE9 ici. Il ne laissait jamais son casque.")), v("", t("Un casque de chantier pos\xE9 sur une caisse, avec un num\xE9ro."))),
      d(t("Le planning"), v("ilka", t("L\u2019ordre disait dix centim\xE8tres. Ils en ont coul\xE9 quarante, en une nuit, sans que personne le leur demande. Ce n\u2019est pas un \xE9boulement qui leur faisait peur. C\u2019est ce qui pleurait.")), v("", t("Sur l\u2019ordre de service : un mur de dix centim\xE8tres. Celui qu\u2019on a coul\xE9 en fait quarante.")))
    ],
    [
      { texte: t("R\xE9parer la radio"), effet: "eclat", piste: "avant", carte: "scellee", drapeau: "radio", recit: t("\xAB \u2026 on coule, on coule, il pleure\u2026 Attends. Tu entends ? Il ferme aussi. De son c\xF4t\xE9. \xBB La voix se tait.") },
      { texte: t("Prendre le casque"), effet: "composants", piste: "nous", carte: "cache", drapeau: "casque", recit: t("Le casque rejoint le sac de l\u2019escouade. Personne ne dit rien pendant longtemps. Le chantier abandonn\xE9 rend quelques outils.") }
    ],
    t("En 2066, les ouvriers ont coul\xE9 un mur quatre fois plus \xE9pais que pr\xE9vu, en une seule nuit. Et de l\u2019autre c\xF4t\xE9, quelqu\u2019un fermait aussi.")
  ),
  H(
    6,
    2,
    t("Les pleurs"),
    t("Plus pr\xE8s du mur, les pleurs. Il n\u2019y a personne. Ils viennent du b\xE9ton lui-m\xEAme. Et entre deux sanglots, un petit bruit sec."),
    [
      d(t("Les pleurs"), v("vela", t("Quelqu\u2019un pleure parce qu\u2019il ne sait plus qui il est. Ce n\u2019est pas de la tristesse. C\u2019est de la peur.")), v("", t("Des pleurs \xE9touff\xE9s, qui semblent venir du mur lui-m\xEAme."))),
      d(t("Le bruit sec"), v("doran", t("Un loquet. Il le tire encore, toutes les quelques minutes, comme on v\xE9rifie qu\u2019on a bien ferm\xE9. Mon p\xE8re a entendu ce bruit-l\xE0.")), v("", t("Un loquet qu\u2019on tire, de l\u2019autre c\xF4t\xE9, toutes les quelques minutes. Comme on v\xE9rifie qu\u2019on a bien ferm\xE9."))),
      d(t("Ce qui a d\xE9riv\xE9"), v("aurel", t("Le relev\xE9 de 5-1 voulait prot\xE9ger les siens. La copie de ma tante veut les enfermer. Deux copies de plus ont suffi. Ce n\u2019est pas le fondateur qui nous a rendus durs : ce sont ses copies."), "niche-fondateur"), v("liane", t("Ma m\xE8re m\u2019a effac\xE9e sans h\xE9siter une seconde. Ici, au milieu de voix qui ne savent plus qui elles sont, je me demande pour la premi\xE8re fois si c\u2019\xE9tait seulement elle.")), v("aurel", t("Mon empreinte a \xE9t\xE9 recopi\xE9e trois fois avant moi. Ici, j\u2019entends ce que \xE7a fait, une voix qui ne sait plus d\u2019o\xF9 elle vient.")), v("", t("Les pleurs changent de ton, sans cesse, comme plusieurs voix qui se disputent une seule gorge.")))
    ],
    [
      { texte: t("Poser la main contre le mur"), effet: "eclat", piste: "avant", carte: "archive", drapeau: "main-posee", recit: t("Tu poses la main sur le b\xE9ton. Les pleurs se calment, un instant. De l\u2019autre c\xF4t\xE9, le loquet ne bouge plus. Doran, tout bas : \xAB Mon p\xE8re n\u2019a enferm\xE9 personne. Il a r\xE9pondu \xE0 quelqu\u2019un qui fermait sa porte. \xBB") },
      { texte: t("Lire les noms sur les \xE9tais"), effet: "composants", piste: "nous", carte: "cache", recit: t("Sur les \xE9tais, quatre noms au marqueur et une date : 14 octobre 2066. Personne ne leur a demand\xE9 de signer. Ils ont sign\xE9 quand m\xEAme. Il en manque deux, de l\u2019\xE9quipe descendue ce soir-l\xE0. Le chef de chantier a laiss\xE9 sa caisse un peu plus loin.") }
    ],
    t("Derri\xE8re le mur, on tire encore un loquet, comme en 2066. Et l\u2019empreinte du fondateur des Ors\xE8ve a d\xE9riv\xE9 de copie en copie.")
  ),
  H(
    6,
    3,
    t("La fissure"),
    t("Le mur de 2066 est fendu de haut en bas. La fissure est r\xE9cente. Quelque chose pousse de l\u2019autre c\xF4t\xE9."),
    [
      d(t("La fissure"), v("sasha", t("La radio disait : \xAB Il ferme aussi, de son c\xF4t\xE9. \xBB Regarde d\u2019o\xF9 part la fissure : du loquet. Il essaie d\u2019ouvrir ce qu\u2019il a ferm\xE9."), "radio"), v("sasha", t("Ce n\u2019est pas le b\xE9ton qui c\xE8de. C\u2019est quelque chose qui le travaille de l\u2019int\xE9rieur, depuis des ann\xE9es.")), v("", t("Une fissure de haut en bas, r\xE9cente."))),
      d(t("Le cercle"), v("vela", t("Des dizaines de cristaux d\u2019un m\xEAme \xEAtre, rang\xE9s en cercle. Chacun se souvient d\u2019une autre vie. Et il y a une place vide dans le cercle.")), v("", t("Par la fissure, des cristaux rang\xE9s en cercle. Une place est vide."))),
      d(t("La poche de Doran"), v("doran", t("Le porte-bonheur de mon p\xE8re chauffe dans ma poche. Sa place est l\xE0, dans le cercle. Je l\u2019ai promis."), "promesse-cristal"), v("doran", t("Le porte-bonheur de mon p\xE8re chauffe dans ma poche. Il veut rentrer. Je ne sais pas si j\u2019ai le droit de le rendre, ou celui de le garder.")), v("", t("Dans le cercle, la place vide a la taille d\u2019un petit cristal.")))
    ],
    [
      { texte: t("Rendre le cristal de 2066"), effet: "eclat", piste: "avant", carte: "archive", drapeau: "cristal-rendu", recit: t("Le cristal roule par la fissure jusqu\u2019\xE0 sa place. Les pleurs ne s\u2019arr\xEAtent pas. Mais l\u2019une des voix se tait, comme quelqu\u2019un qui retrouve enfin la fin de sa phrase.") },
      { texte: t("Le garder"), effet: "composants", piste: "nous", carte: "cache", drapeau: "cristal-garde", recit: t("Le cristal reste dans la poche de Doran : \xAB Mon p\xE8re l\u2019a gard\xE9 toute sa vie. Je le garde encore un peu. \xBB La place reste vide. L\u2019escouade d\xE9gage les \xE9tais pour la perc\xE9e.") }
    ],
    t("Derri\xE8re le mur, des dizaines de cristaux d\u2019un m\xEAme \xEAtre, rang\xE9s en cercle. Une place \xE9tait vide : celle du porte-bonheur du p\xE8re de Doran."),
    {
      nous: rv(
        t("Ivens et Daro"),
        t("Six sont descendus en 2066, quatre ont coul\xE9 le mur. Ivens et Daro \xE9taient d\xE9j\xE0 de l\u2019autre c\xF4t\xE9, et le rapport des Fondations dit \xAB aucune victime \xBB. Fermer le mur, c\u2019\xE9tait aussi les laisser derri\xE8re."),
        v("doran", t("Le planning de la nuit : six descendus, quatre pour couler le mur. Ivens et Daro \xE9taient pass\xE9s de l\u2019autre c\xF4t\xE9 avant qu\u2019on coule. On a coul\xE9 quand m\xEAme. Le rapport des Fondations dit \xAB infiltration, aucune victime \xBB. Mon p\xE8re, lui, n\u2019a jamais barr\xE9 son nom.")),
        v("ilka", t("Six descendus, quatre au mur. Ivens et Daro manquent au rapport : \xAB aucune victime \xBB, il dit. Au district, on a appris \xE0 lire ce genre de phrase.")),
        v("", t("Sur le planning de la nuit : six noms descendus, quatre au mur. Ivens et Daro ne figurent pas au rapport officiel : \xAB infiltration, aucune victime \xBB."))
      ),
      avant: rv(
        t("Toutes ses copies"),
        t("Derri\xE8re le mur de 2066, un seul \xEAtre s\u2019est enferm\xE9 avec toutes ses copies, pour qu\u2019aucune ne reparte sans les autres. Ce qu\u2019on prend pour une prison est un refus d\u2019\xEAtre recopi\xE9."),
        v("vela", t("Ces pleurs, ce sont les m\xEAmes voix, recopi\xE9es des dizaines de fois. Un seul \xEAtre, et toutes ses copies. Il s\u2019est enferm\xE9 avec elles, pour qu\u2019aucune ne reparte sans les autres. Ce n\u2019est pas une prison. C\u2019est un refus.")),
        v("sasha", t("Les cristaux du cercle ont tous le m\xEAme grain : des copies d\u2019une m\xEAme pierre. Il a ferm\xE9 sur toutes ses copies \xE0 la fois.")),
        v("", t("Par la fissure, les cristaux du cercle ont tous le m\xEAme grain : les copies d\u2019un seul \xEAtre, rang\xE9es ensemble derri\xE8re le loquet."))
      )
    }
  ),
  // ---------- −7 · Les Deux Rives ----------
  H(
    7,
    1,
    t("Les deux passerelles"),
    t("Deux passerelles franchissent le m\xEAme gouffre, c\xF4te \xE0 c\xF4te. L\u2019une est neuve, l\u2019autre a c\xE9d\xE9. Les deux existent en m\xEAme temps."),
    [
      d(t("La passerelle cass\xE9e"), v("ilka", t("On dirait celle des Hauts-Ponts. Celle qui a c\xE9d\xE9 sous moi. Elle n\u2019a rien \xE0 faire ici, et pourtant.")), v("", t("Une passerelle cass\xE9e en son milieu, rouill\xE9e."))),
      d(t("La passerelle neuve"), v("ilka", t("Et celle-l\xE0 ressemble \xE0 celle qui n\u2019aurait jamais c\xE9d\xE9. Celle o\xF9 j\u2019ai encore mes jambes. Je ne veux pas la regarder.")), v("", t("Une passerelle neuve, intacte, juste \xE0 c\xF4t\xE9 de l\u2019autre."))),
      d(t("Deux cristaux"), v("vela", t("Deux cristaux du m\xEAme \xEAtre, au bord du gouffre. L\u2019un se souvient d\u2019avoir b\xE2ti cette passerelle. L\u2019autre, de l\u2019avoir vue tomber. Les deux sont sinc\xE8res.")), v("", t("Deux cristaux identiques, pos\xE9s de part et d\u2019autre du gouffre.")))
    ],
    [
      { texte: t("Prendre la passerelle cass\xE9e"), effet: "eclat", piste: "nous", carte: "cache", drapeau: "vraie-rive", recit: t("Vous traversez par la vraie, en sautant le trou. Derri\xE8re vous, la passerelle neuve p\xE2lit, comme un souvenir qu\u2019on cesse de regarder.") },
      { texte: t("Prendre la passerelle neuve"), effet: "lampe", piste: "avant", recit: t("La passerelle neuve tient, bien s\xFBr. Au bout, une lanterne qui n\u2019existe que dans ce souvenir. Elle \xE9claire quand m\xEAme.") }
    ],
    t("\xC0 \u22127, deux souvenirs vrais peuvent se contredire. Un m\xEAme \xEAtre se souvient d\u2019avoir b\xE2ti une passerelle, et de l\u2019avoir vue tomber.")
  ),
  H(
    7,
    2,
    t("Ceux qui regravaient"),
    t("Un mur entier couvert de lignes d\u2019eau, grav\xE9es l\u2019une au-dessus de l\u2019autre. Pas un mot sous aucune d\u2019elles."),
    [
      d(t("La plus basse"), v("vela", t("Grav\xE9e profond, \xE0 coups lents. On grave comme \xE7a ce qu\u2019on croit d\xE9finitif.")), v("", t("La ligne la plus basse est grav\xE9e profond, d\u2019un trait appliqu\xE9."))),
      d(t("Les \xE9carts"), v("sasha", t("Entre les lignes : une main, une main, deux, quatre. \xC7a acc\xE9l\xE8re.")), v("doran", t("Une main d\u2019\xE9cart, puis une main, puis deux, puis quatre. \xC7a ne monte pas. \xC7a acc\xE9l\xE8re.")), v("", t("Les \xE9carts entre les lignes grandissent : une main, une main, deux, quatre."))),
      d(t("La plus haute"), v("doran", t("La derni\xE8re n\u2019est qu\u2019une rayure, faite au bout du bras, sur la pointe des pieds.")), v("ilka", t("La derni\xE8re, c\u2019est \xE0 peine une rayure. Faite \xE0 bout de bras, vite.")), v("", t("La ligne la plus haute n\u2019est qu\u2019une rayure, trac\xE9e \xE0 bout de bras.")))
    ],
    [
      { texte: t("Graver une ligne"), effet: "eclat", piste: "nous", carte: "scellee", drapeau: "ligne-gravee", recit: t("Tu graves une ligne au-dessus de toutes les autres, profond, \xE0 coups lents.") },
      { texte: t("Mesurer les \xE9carts"), effet: "composants", piste: "avant", carte: "archive", recit: t("Une main, une main, deux, quatre. Tu fais le calcul que ceux d\u2019avant ont d\xFB faire : la suivante serait \xE0 huit mains, au-dessus de la vo\xFBte. Personne ne l\u2019a grav\xE9e. Les Veilleurs paieront bien ton relev\xE9.") }
    ],
    t("Sur un mur de \u22127, des lignes d\u2019eau grav\xE9es l\u2019une au-dessus de l\u2019autre. Les \xE9carts grandissent : une main, une main, deux, quatre. La derni\xE8re n\u2019est qu\u2019une rayure.")
  ),
  H(
    7,
    3,
    t("Le relev\xE9 impossible"),
    t("Les deux passerelles se rejoignent sur une m\xEAme pile. Une seule ligne d\u2019eau en fait le tour, d\u2019un seul trait."),
    [
      d(t("Depuis la rive neuve"), v("sasha", t("1,40 m au-dessus du tablier. Mesur\xE9e trois fois.")), v("doran", t("D\u2019ici, la ligne est \xE0 1,40 m du tablier. J\u2019ai mesur\xE9 trois fois.")), v("", t("Depuis la rive neuve, la ligne passe \xE0 1,40 m du tablier."))),
      d(t("Depuis la rive cass\xE9e"), v("ilka", t("D\u2019ici, la m\xEAme ligne est \xE0 2,60 m. M\xEAme trait, m\xEAme pile. Ton m\xE8tre ne ment pas. Le mien non plus.")), v("", t("Depuis la rive cass\xE9e, la m\xEAme ligne passe \xE0 2,60 m."))),
      d(t("Les fils"), v("vela", t("Des fils dans la pierre. Quelqu\u2019un a cousu deux murs en un. Les deux sont vrais. C\u2019est la Tisseuse.")), v("", t("Des fils fins comme des cheveux courent dans la pierre, \xE0 l\u2019endroit o\xF9 les deux rives se rejoignent.")))
    ],
    [
      { texte: t("Garder les deux relev\xE9s"), effet: "eclat", piste: "avant", carte: "archive", drapeau: "deux-releves", recit: t("Tu notes les deux chiffres, sans en barrer aucun.") },
      { texte: t("Couper un fil"), effet: "lampe", piste: "nous", recit: t("Tu coupes un fil. Les deux murs se s\xE9parent un instant, et une lumi\xE8re passe entre eux, jusqu\u2019aux salles suivantes.") }
    ],
    t("\xC0 \u22127, la m\xEAme ligne d\u2019eau mesure 1,40 m d\u2019une rive et 2,60 m de l\u2019autre. Les deux relev\xE9s sont justes. Un mur entier ne dit pas o\xF9 l\u2019eau s\u2019est arr\xEAt\xE9e."),
    {
      nous: rv(
        t("Conforme"),
        t("Graver une ligne, c\u2019est \xE9crire ce qui est arriv\xE9. Dans les Archives, la passerelle des Hauts-Ponts n\u2019a jamais c\xE9d\xE9 : \xAB remplac\xE9e, conforme \xBB, sign\xE9 par l\u2019inspecteur du district pour ne pas arr\xEAter l\u2019extraction. Une archive compl\xE8te peut garder la passerelle neuve."),
        v("ilka", t("Tu viens de graver une ligne vraie. La mienne, on l\u2019a effac\xE9e. Dans tes Archives, apr\xE8s les trois fiches \xAB non prioritaire \xBB, il y en a une quatri\xE8me : \xAB remplac\xE9e, conforme \xBB. Sign\xE9e par l\u2019inspecteur de mon district. Une passerelle qui tombe, \xE7a arr\xEAte l\u2019extraction des mois. Sur le papier, il a gard\xE9 la neuve. Moi, je n\u2019ai plus mes jambes.")),
        v("", t("Ta ligne grav\xE9e rappelle les fiches de la passerelle des Hauts-Ponts, dans tes Archives : trois signalements \xAB non prioritaire \xBB, puis une quatri\xE8me fiche, \xAB remplac\xE9e, conforme \xBB, sign\xE9e par l\u2019inspecteur du district. Sur le papier, la chute n\u2019existe pas."))
      ),
      avant: rv(
        t("Ce que la copie invente"),
        t("\xC0 \u22127, deux cristaux d\u2019un m\xEAme \xEAtre ne se souviennent pas de la m\xEAme chose : l\u2019un est une copie, qui a invent\xE9 ce qu\u2019elle avait perdu. Un souvenir sinc\xE8re n\u2019est pas un souvenir vrai."),
        v("vela", t("Le cristal qui se souvient de la passerelle neuve est une copie. Une copie perd un peu, et elle invente pour boucher le trou. Elle ne ment pas, elle y croit. Les deux souvenirs sont sinc\xE8res, et un seul est arriv\xE9.")),
        v("", t("L\u2019un des deux cristaux a le grain plus fin, l\u2019\xE9clat plus net : l\u2019original. L\u2019autre est une copie. Et c\u2019est la copie qui se souvient de la passerelle neuve."))
      )
    }
  ),
  // ---------- −8 · La Ruche d'ambre ----------
  H(
    8,
    1,
    t("Le campement des Veilleurs"),
    t("Les Veilleurs de Tobin, perdus ici, ont plant\xE9 leur campement dans les trous d\u2019un plus ancien : celui de l\u2019\xE9quipe dont une seule fouilleuse est remont\xE9e, il y a des ann\xE9es."),
    [
      d(t("Les piquets"), v("nuit", t("Deux rang\xE9es de trous. Les neufs sont tomb\xE9s pile dans les vieux. Personne ne leur avait donn\xE9 le plan.")), v("kessa", t("Leurs piquets sont plant\xE9s dans les trous de l\u2019ancien camp. Exactement dans les m\xEAmes.")), v("", t("Les piquets neufs sont plant\xE9s pile dans les trous d\u2019un campement plus ancien."))),
      d(t("Deux relev\xE9s"), v("sasha", t("La m\xEAme table, relev\xE9e par les deux \xE9quipes. Les anciens comptent quatorze lignes, les nouveaux onze. Sign\xE9, contresign\xE9.")), v("doran", t("Deux relev\xE9s de la m\xEAme table. Quatorze lignes pour les anciens, onze pour les nouveaux. Il en manque trois.")), v("", t("Deux relev\xE9s de la m\xEAme table, \xE0 des ann\xE9es d\u2019\xE9cart : quatorze lignes, puis onze."))),
      d(t("L\u2019ambre"), v("kessa", t("L\u2019ambre suinte des murs. Il sent le miel et la cire. Mes parents parlaient de cette odeur, et de la glande qu\u2019on leur a donn\xE9e pour le produire.")), v("", t("De l\u2019ambre suinte des murs, \xE9pais, dor\xE9.")))
    ],
    [
      { texte: t("Rallumer leurs lampes"), effet: "lampe", piste: "nous", drapeau: "lampes-veilleurs", recit: t("Tu rallumes une \xE0 une les lampes des Veilleurs. Si l\u2019un d\u2019eux se r\xE9veille, il verra qu\u2019on est venu. Tu en gardes une pour la route.") },
      { texte: t("Emporter les relev\xE9s"), effet: "eclat", piste: "avant", carte: "archive", recit: t("Les deux relev\xE9s remonteront chez les Veilleurs.") }
    ],
    t("Les Veilleurs perdus ont camp\xE9 dans les trous d\u2019un campement plus ancien. Les deux \xE9quipes ont relev\xE9 la m\xEAme table : quatorze lignes pour l\u2019une, onze pour l\u2019autre.")
  ),
  H(
    8,
    2,
    t("La table de la Ruche"),
    t("Une table grav\xE9e, \xE0 demi prise dans l\u2019ambre. Il manque un morceau, cass\xE9 net : celui que la fouilleuse remont\xE9e autrefois tenait dans la main."),
    [
      d(t("La cassure"), v("doran", t("Le morceau qui manque fait trois lignes : une seule phrase, grav\xE9e en trois fois. Les trois lignes qui manquent au relev\xE9 des nouveaux. La fouilleuse les a emport\xE9es.")), v("", t("Il manque un morceau de la table, cass\xE9 net : la place de trois lignes."))),
      d(t("Les colonnes"), v("sasha", t("\xC0 \u22124 : un nom, puis le nombre de voix. Ici, plus de nom. Juste l\u2019empreinte, et combien de fois on l\u2019a recopi\xE9e : 40, 112, 300. Ils recopiaient des copies."), "table-relevee"), v("vela", t("Pas de colonne des noms. Juste des empreintes, et \xE0 c\xF4t\xE9 de chacune, combien de fois elle a \xE9t\xE9 recopi\xE9e. Trois cents, pour certaines.")), v("", t("La table n\u2019a pas de colonne des noms : des empreintes, et un chiffre \xE0 c\xF4t\xE9 de chacune, parfois trois cents."))),
      d(t("L\u2019\xE9criture"), v("liane", t("Regarde le trait. Les tables de \u22124 sont grav\xE9es d\u2019une main s\xFBre. Celle-ci tremble, recommence, rature. Quelqu\u2019un qui ne savait plus bien graver a essay\xE9 quand m\xEAme.")), v("ilka", t("\xC7a tremble, \xE7a rature, \xE7a recommence. On dirait mon fr\xE8re qui recopie ses devoirs sur ceux d\u2019un autre.")), v("", t("Le trait est maladroit, ratur\xE9, repris : rien \xE0 voir avec les tables de \u22124.")))
    ],
    [
      { texte: t("Relever la table"), effet: "eclat", piste: "avant", carte: "archive", drapeau: "copistes", recit: t("Tu rel\xE8ves la table au fusain, ratures comprises. Les Veilleurs la poseront \xE0 c\xF4t\xE9 de celle de \u22124.") },
      { texte: t("Suivre la fouilleuse"), effet: "composants", piste: "nous", carte: "cache", recit: t("Dans l\u2019ambre, la trace d\u2019une main qui a cass\xE9 la table, puis des pas qui remontent, seuls. Elle n\u2019a pas fui : elle est partie chercher de l\u2019aide. Sous un piquet, son sac, et de l\u2019ambre qui se revendra bien.") }
    ],
    t("\xC0 \u22128, les tables n\u2019ont plus de colonne des noms : seulement des empreintes, recopi\xE9es des centaines de fois, d\u2019une main qui ne savait plus graver.")
  ),
  H(
    8,
    3,
    t("Le souvenir heureux"),
    t("Au c\u0153ur de la Ruche, les Veilleurs perdus sont assis en cercle et sourient. Ils f\xEAtent quelque chose qui n\u2019a jamais eu lieu."),
    [
      d(t("Le cercle"), v("joss", t("Six Veilleurs de Tobin, et sept verres. Ce n\u2019est pas leur f\xEAte : c\u2019est celle de l\u2019ancienne \xE9quipe, cousue dans leur r\xEAve. Le septi\xE8me verre attend la fouilleuse d\u2019autrefois.")), v("vela", t("Six Veilleurs, et sept verres. Il y en a un pour quelqu\u2019un qui n\u2019est pas l\xE0.")), v("", t("Six Veilleurs assis en cercle. Sept verres."))),
      d(t("La f\xEAte"), v("ilka", t("Ils f\xEAtent la fin de la mont\xE9e des eaux. Un truc qui n\u2019est jamais arriv\xE9. C\u2019est cruel.")), v("", t("Ils l\xE8vent leurs verres \xE0 une f\xEAte qui n\u2019a jamais eu lieu."))),
      d(t("Un fil"), v("doran", t("Un fil d\u2019ambre les relie tous \xE0 quelque chose, plus bas. La Tisseuse. On coupe le fil, ou on la bat.")), v("", t("Un fil dor\xE9 relie chacun d\u2019eux \xE0 quelque chose, plus bas.")))
    ],
    [
      { texte: t("Leur rappeler un vrai d\xE9tail"), effet: "eclat", piste: "nous", carte: "archive", drapeau: "vrai-detail", recit: t("Tu dis le nom de Tobin, et le prix du pain au march\xE9. Un Veilleur cligne des yeux. Le souvenir tremble.") },
      { texte: t("Suivre leur fil d\u2019ambre"), effet: "composants", piste: "avant", carte: "cache", recit: t("Tu ne les r\xE9veilles pas. Tu suis le fil qui les relie, sans le couper. Il descend, tendu, vers la Tisseuse, et passe par une salle o\xF9 elle a rang\xE9 leurs sacs.") }
    ],
    t("Dans le souvenir heureux des Veilleurs, il y a sept verres pour six. Le septi\xE8me attend la fouilleuse qui est remont\xE9e autrefois, avec un morceau de la table."),
    {
      nous: rv(
        t("Le septi\xE8me verre"),
        t("La fouilleuse de la Ruche voulait redescendre chercher les siens ; Hessa a mis son \xE9clat sous cl\xE9 et refus\xE9 l\u2019\xE9quipe. En bas, l\u2019ancienne \xE9quipe l\u2019a attendue jusqu\u2019au bout, et la Tisseuse a gard\xE9 cette attente."),
        v("ilka", t("Tobin me l\u2019a dit en route. Elle est remont\xE9e avec l\u2019\xE9clat et elle a demand\xE9 une \xE9quipe pour redescendre. Hessa, la Doyenne, a refus\xE9 : plus personne ne devait mourir pour une table. En bas, les siens l\u2019ont attendue jusqu\u2019au bout. La Tisseuse a cousu cette attente dans le r\xEAve des nouveaux.")),
        v("joss", t("Elle a d\xFB demander qu\u2019on redescende, encore et encore. On lui a dit non, pour son bien. Ceux d\u2019en bas, personne ne leur a rien dit.")),
        v("", t("Le septi\xE8me verre est plein. La fouilleuse n\u2019est jamais redescendue : en haut, la Doyenne des Veilleurs a refus\xE9 de risquer une autre \xE9quipe. En bas, l\u2019ancienne \xE9quipe l\u2019a attendue."))
      ),
      avant: rv(
        t("Les copistes"),
        t("Les tables maladroites de \u22128 sont les plus r\xE9centes : leurs auteurs sont redescendus d\u2019en haut, bien apr\xE8s, pour s\u2019y recopier les grandes voix. Les murs les plus vieux portent les gravures les plus fra\xEEches."),
        v("vela", t("Ces tables maladroites ne sont pas plus vieilles que les autres. Elles sont plus r\xE9centes. Ceux qui les ont grav\xE9es sont redescendus d\u2019en haut pour se recopier les grandes voix.")),
        v("sasha", t("La pierre est ancienne, la gravure est fra\xEEche. Quelqu\u2019un est venu d\u2019en haut graver ici, bien apr\xE8s les autres.")),
        v("", t("La pierre des tables est ancienne, mais la gravure maladroite est fra\xEEche : quelqu\u2019un est redescendu d\u2019en haut, bien apr\xE8s, pour graver ici."))
      )
    }
  ),
  // ---------- −9 · Le Ciel d'en bas ----------
  H(
    9,
    1,
    t("Au dos de la lettre"),
    t("Tu ressors la lettre d\u2019Ys\xE9 pour la ranger, et tu vois ce que tu n\u2019avais pas vu : au dos, d\u2019une \xE9criture plus trembl\xE9e, un post-scriptum. Derri\xE8re toi, tout un mur est grav\xE9 d\u2019une c\xF4te."),
    [
      d(t("Le post-scriptum"), v("vela", t("\xAB Celle qui garde les noms des autres a souvent perdu le sien. \xC9coute-la avant de la combattre. \xBB Elle savait, pour la Tisseuse. Elle a pr\xE9f\xE9r\xE9 l\u2019\xE9crire au dos.")), v("", t("Au dos, un post-scriptum : \xAB Celle qui garde les noms des autres a souvent perdu le sien. \xC9coute-la avant de la combattre. \xBB"))),
      d(t("La c\xF4te grav\xE9e"), v("vela", t("Cette c\xF4te, je la connais. Je la vois en r\xEAve depuis ma greffe. Je n\u2019y suis jamais all\xE9e. Personne n\u2019y est jamais all\xE9.")), v("nuit", t("Une c\xF4te. Personne ne l\u2019a jamais vue.")), v("", t("Tout un mur grav\xE9 d\u2019une c\xF4te inconnue : criques, courants, r\xE9cifs."))),
      d(t("Un fil sur le sol"), v("kessa", t("Ses fils tra\xEEnent partout, ici. Ils sont us\xE9s. Elle les tient depuis trop longtemps.")), v("", t("Des fils us\xE9s tra\xEEnent sur le sol.")))
    ],
    [
      { texte: t("Garder la lettre sur toi"), effet: "eclat", piste: "nous", carte: "cache", drapeau: "lettre-yse", recit: t("Tu ranges la lettre contre toi, le post-scriptum tourn\xE9 vers ta peau.") },
      { texte: t("Suivre les fils"), effet: "lampe", piste: "avant", recit: t("Les fils luisent faiblement quand on les suit. Ils \xE9clairent le chemin vers le bas.") }
    ],
    t("\xC0 \u22129, un mur entier montre une c\xF4te que personne n\u2019a jamais vue. V\xE9la la voit en r\xEAve depuis sa greffe.")
  ),
  H(
    9,
    2,
    t("Les visages"),
    t("Des fils nou\xE9s autour de petits cristaux, par milliers. Au mur, grav\xE9s dans la roche, des dragons, des esprits, des \xEAtres sans nom."),
    [
      d(t("Les dragons"), v("vela", t("Le m\xEAme dragon que le mien, grav\xE9 dix fois. Le premier est net. Les autres tremblent, de plus en plus. Et le mien\u2026 je crois qu\u2019il tremble un peu, lui aussi.")), v("", t("Le m\xEAme dragon grav\xE9 dix fois : net la premi\xE8re fois, puis de plus en plus trembl\xE9."))),
      d(t("Un n\u0153ud"), v("vela", t("Un nom, \xE0 l\u2019int\xE9rieur. Personne ne s\u2019en souvient, sauf elle. Si elle meurt, il meurt avec.")), v("joss", t("Un nom, l\xE0-dedans. Elle est la seule \xE0 s\u2019en souvenir. C\u2019est lourd, d\u2019\xEAtre la seule.")), v("", t("Un petit cristal nou\xE9 de fil murmure un nom."))),
      d(t("Un n\u0153ud d\xE9fait"), v("aurel", t("Un n\u0153ud d\xE9fait, le fil vide. On a donn\xE9 ce nom \xE0 quelqu\u2019un. Chez nous, on grave le nom sous celui du porteur d\u2019avant. Ici, on le donnait.")), v("joss", t("Un fil vide. Le nom n\u2019est pas perdu : il est parti.")), v("", t("Un seul n\u0153ud est d\xE9fait. Le fil est vide.")))
    ],
    [
      { texte: t("Renouer un nom"), effet: "eclat", piste: "avant", carte: "archive", drapeau: "nom-renoue", recit: t("Tu refais le n\u0153ud d\u2019un fil qui glissait. Le nom tient. Quelque part, plus bas, la Tisseuse a senti ta main.") },
      { texte: t("Chercher un nom de chez nous"), effet: "composants", piste: "nous", carte: "cache", recit: t("Tu cherches dans les n\u0153uds un nom de Vertiga. Il y en a : des fouilleurs disparus, des R\xE9sonants des bas-fonds sans famille, nou\xE9s avec les autres. Au pied du mur, le sac de l\u2019un d\u2019eux.") }
    ],
    t("Le m\xEAme dragon est grav\xE9 dix fois : net d\u2019abord, puis de plus en plus trembl\xE9. Plus on le recopie, moins on sait \xE0 quoi il ressemblait.")
  ),
  H(
    9,
    3,
    t("Le nid"),
    t("La Tisseuse est l\xE0, au fond, dans un nid de fils. Elle ne vous attaque pas encore. Ses mains tremblent."),
    [
      d(t("Ses mains"), v("vela", t("Elle tient tous ses fils, mais elle tremble. Elle est fatigu\xE9e. Elle a peur de l\xE2cher.")), v("", t("Ses mains tremblent, et ses fils avec."))),
      d(t("Ses yeux"), v("kessa", t("Elle sait que tu as renou\xE9 un de ses fils. Elle te regarde comme on regarde quelqu\u2019un qui a rendu service."), "nom-renoue"), v("kessa", t("Elle nous regarde comme on regarde quelqu\u2019un qu\u2019on attendait depuis tr\xE8s longtemps.")), v("", t("Elle vous regarde, sans col\xE8re."))),
      d(t("La lettre"), v("vela", t("Tu as gard\xE9 la lettre. Demande-lui, maintenant."), "lettre-yse"), v("ilka", t("Une fois, on demande. Si elle r\xE9pond par des coups, on r\xE9pond pareil.")), v("", t("La lettre d\u2019Ys\xE9, dans ta poche, p\xE8se lourd.")))
    ],
    [
      { texte: t("Lui demander son nom"), effet: "eclat", piste: "avant", carte: "archive", drapeau: "nom-demande", recit: t("Elle ne r\xE9pond pas. Pas encore. Mais elle sourit.") },
      { texte: t("Lui parler des fouilleurs"), effet: "composants", piste: "nous", carte: "cache", recit: t("Tu lui dis que l\xE0-haut, quelqu\u2019un attend encore certains de ces noms. Elle desserre un n\u0153ud, et pousse vers toi un vieux sac de fouilleur, comme on rend un objet trouv\xE9.") }
    ],
    t("La Tisseuse tient tous les noms que les tables grav\xE9es ont perdus. Elle est fatigu\xE9e, et elle a peur de l\xE2cher."),
    {
      nous: rv(
        t("Les effac\xE9s"),
        t("Dans les fils de la Tisseuse, des noms de Vertiga que nos registres ont effac\xE9s, dont Ivens et Daro, de l\u2019\xE9quipe de 2066. Elle les a nou\xE9s avec autant de soin que les siens."),
        v("doran", t("Deux n\u0153uds portent des noms de chez nous. Ivens. Daro. L\u2019\xE9quipe de mon p\xE8re, 2066. La ville les a effac\xE9s de ses registres. Elle, elle les a nou\xE9s avec les siens.")),
        v("kessa", t("Des fouilleurs de Vertiga, nou\xE9s avec les siens. La ville a effac\xE9 leurs noms quand on a cess\xE9 de les chercher. Elle, non.")),
        v("", t("Parmi les n\u0153uds, des noms de Vertiga effac\xE9s de nos registres, et deux de 2066 : Ivens, Daro. Ils sont nou\xE9s avec autant de soin que les autres."))
      ),
      avant: rv(
        t("Le nom donn\xE9"),
        t("La Tisseuse a donn\xE9 son propre nom \xE0 quelqu\u2019un qui descendait vers le fond, pour qu\u2019il se souvienne d\u2019elle. Ceux d\u2019avant se passaient leurs noms comme on se passe une lampe."),
        v("vela", t("Le n\u0153ud d\xE9fait, le fil vide\u2026 C\u2019\xE9tait le sien. Elle l\u2019a donn\xE9 \xE0 quelqu\u2019un qui descendait, tout au fond, l\xE0 o\xF9 personne ne va. Ils se passaient leurs noms, pour ne pas dispara\xEEtre. Mon dragon tremble parce qu\u2019il est une copie de copie. Elle tremble parce qu\u2019elle a donn\xE9 son nom.")),
        v("", t("Au c\u0153ur du nid, le seul fil vide part de ses propres mains et file vers le bas. Le nom qu\u2019il tenait, elle l\u2019a donn\xE9 \xE0 quelqu\u2019un qui descendait."))
      )
    }
  ),
  // ---------- −10 · Le Puits d'avant ----------
  H(
    10,
    1,
    t("Les portes nettes"),
    t("Derri\xE8re la premi\xE8re porte du fond, un couloir. Pas une fissure, pas une trace d\u2019eau. Rien n\u2019a vieilli."),
    [
      d(t("Une porte"), v("doran", t("Ferm\xE9e de l\u2019int\xE9rieur, comme \xE0 \u22124. J\u2019ai le casque de mon p\xE8re sur mon sac. Ici, il aurait compris ce qu\u2019il a entendu."), "casque"), v("doran", t("Ferm\xE9e de l\u2019int\xE9rieur, comme \xE0 \u22124. En 2066, mon p\xE8re a entendu quelqu\u2019un tirer un loquet. C\u2019\xE9tait ce geste-l\xE0.")), v("", t("Une porte scell\xE9e de l\u2019int\xE9rieur, comme celles de \u22124."))),
      d(t("La poussi\xE8re"), v("sasha", t("Il n\u2019y en a pas. Pas un grain. Quelqu\u2019un entretient tout \xE7a. Ou rien ne s\u2019use, ici.")), v("", t("Pas un grain de poussi\xE8re."))),
      d(t("Une voix"), v("vela", t("Ici, les cristaux ne murmurent pas. Ils se taisent, tous, comme on se tait quand quelqu\u2019un \xE9coute.")), v("", t("Un silence \xE9pais, comme si quelqu\u2019un retenait son souffle.")))
    ],
    [
      { texte: t("Frapper \xE0 une porte"), effet: "eclat", piste: "avant", carte: "archive", drapeau: "frappe", recit: t("Tu frappes trois coups. Personne n\u2019ouvre. Puis, de l\u2019autre c\xF4t\xE9, trois coups r\xE9pondent, plus lents.") },
      { texte: t("Marquer le chemin du retour"), effet: "composants", piste: "nous", carte: "cache", recit: t("Tu fais marquer chaque porte \xE0 la craie, comme la fl\xE8che des patrouilles. Si vous ne remontez pas, d\u2019autres sauront jusqu\u2019o\xF9 vous \xEAtes all\xE9s. Dans une alc\xF4ve, du mat\xE9riel intact.") }
    ],
    t("Au fond, les portes sont ferm\xE9es de l\u2019int\xE9rieur, comme \xE0 \u22124. Mais ici, rien n\u2019a vieilli : pas un grain de poussi\xE8re.")
  ),
  H(
    10,
    2,
    t("La salle des tables"),
    t("Des tables grav\xE9es, align\xE9es comme dans une \xE9cole. Sur chacune, la m\xEAme phrase, de plus en plus effac\xE9e."),
    [
      d(t("La phrase"), v("vela", t("\xAB Que celui qui lit ceci compte les voix qu\u2019il porte. \xBB Compte. Le mot de la Confluence, \xE0 \u22123. Tu l\u2019as \xE9cout\xE9 jusqu\u2019au bout. Il venait d\u2019ici."), "compte-entendu"), v("vela", t("\xAB Que celui qui lit ceci compte les voix qu\u2019il porte. \xBB Compte. Le mot de la Confluence.")), v("", t("\xAB Que celui qui lit ceci compte les voix qu\u2019il porte. \xBB"))),
      d(t("Les bancs"), v("ilka", t("Ils apprenaient \xE7a par c\u0153ur, comme une le\xE7on. Plus haut, ils la r\xE9citaient encore, au milieu de mille autres choses \xE0 r\xE9citer.")), v("", t("Des bancs de pierre, us\xE9s par des g\xE9n\xE9rations."))),
      d(t("Une table \xE0 part"), v("doran", t("Celle-l\xE0 est plus r\xE9cente, de la m\xEAme \xE9criture que les autres. Quelqu\u2019un l\u2019a port\xE9e au centre de la salle, et la garde pr\xE8s de lui.")), v("", t("Une table plus r\xE9cente a \xE9t\xE9 port\xE9e au centre de la salle.")))
    ],
    [
      { texte: t("Compter tes voix"), effet: "eclat", piste: "avant", carte: "scellee", drapeau: "voix-comptees", recit: t("Tu fais compter \xE0 l\u2019escouade les voix qu\u2019elle porte, cartes comprises. Chacun s\u2019arr\xEAte \xE0 un chiffre, et personne ne dit le sien.") },
      { texte: t("Relever les tables"), effet: "composants", piste: "nous", carte: "archive", recit: t("Tu rel\xE8ves la phrase sur chaque table, de la plus nette \xE0 la plus effac\xE9e. Pour Ys\xE9. Au fond de la salle, des outils de graveur.") }
    ],
    t("Au fond, la m\xEAme phrase sur toutes les tables : \xAB Que celui qui lit ceci compte les voix qu\u2019il porte. \xBB Le \xAB Compte \xBB de la Confluence venait d\u2019ici.")
  ),
  H(
    10,
    3,
    t("Il vous attendait"),
    t("Au centre de la derni\xE8re salle, quelqu\u2019un est assis, plus grand que nous. Il ne se l\xE8ve pas. Il vous attendait."),
    [
      d(t("Lui"), v("vela", t("C\u2019est lui qui a r\xE9pondu \xE0 tes trois coups, tout \xE0 l\u2019heure. Il nous a entendus frapper."), "frappe"), v("vela", t("Le Premier Porteur. Assis, il est aussi haut que Doran debout. Il ne porte qu\u2019une voix, et ce n\u2019est pas la sienne. Il la porte si bien qu\u2019on ne voit plus la diff\xE9rence.")), v("", t("Quelqu\u2019un d\u2019assis, plus grand que nous, tr\xE8s calme, qui vous regarde arriver."))),
      d(t("Ses mains"), v("doran", t("Il a les mains d\u2019un graveur. Il a regard\xE9 ma poche, puis il a souri. Il sait que le cercle de \u22126 est complet."), "cristal-rendu"), v("doran", t("Il a les mains d\u2019un graveur. Toutes ces tables ont son \xE9criture.")), v("", t("Des mains ab\xEEm\xE9es, de graveur."))),
      d(t("Ton nom"), v("ilka", t("Il conna\xEEt ton nom. Il l\u2019a lu sur le mur des fouilleurs, tout en haut."), "nom-grave"), v("ilka", t("On est venus jusqu\u2019ici pour des r\xE9ponses. Allons lui en demander.")), v("", t("Il te regarde comme s\u2019il te connaissait d\xE9j\xE0.")))
    ],
    [
      { texte: t("Lui dire qui tu es"), effet: "eclat", piste: "nous", carte: "archive", drapeau: "presente", recit: t("Tu dis ton nom, ton district, et la mer qui monte. Il hoche la t\xEAte, lentement.") },
      { texte: t("\xC9couter sa voix"), effet: "composants", piste: "avant", carte: "cache", recit: t("Tu ne dis rien. Tu \xE9coutes. Il ne porte qu\u2019une voix, et elle parle doucement, dans une langue que personne ne comprend plus. Au pied des marches, ce que ceux d\u2019avant ont laiss\xE9.") }
    ],
    t("Le Premier Porteur nous attendait au fond, assis. Il a des mains de graveur, et toutes les tables de la salle portent son \xE9criture."),
    {
      nous: rv(
        t("La moiti\xE9 du message"),
        t("Au fond, la table d\u2019origine porte une seconde ligne sous la mise en garde. La copie que les Veilleurs gardent sous cl\xE9 s\u2019arr\xEAte avant : toute leur prudence repose sur une moiti\xE9 de phrase."),
        v("doran", t("Sous la phrase, une autre ligne, plus r\xE9cente. La copie des Veilleurs s\u2019arr\xEAte juste avant. Ils ont tout gard\xE9 ferm\xE9 en n\u2019en lisant que la moiti\xE9.")),
        v("ilka", t("La table du centre. Sous la phrase, une autre ligne. La copie de Hessa s\u2019arr\xEAte juste avant. Toute leur prudence tient sur une phrase pas finie.")),
        v("", t("Sur la table du centre, sous la mise en garde, une seconde ligne, plus r\xE9cente. La copie que les Veilleurs gardent sous cl\xE9 s\u2019arr\xEAte juste avant."))
      ),
      avant: rv(
        t("Ils montaient"),
        t("Ceux d\u2019avant ne sont pas descendus s\u2019enterrer : partis du fond, ils ont b\xE2ti en remontant, chaque g\xE9n\xE9ration rang\xE9e sous la suivante. En 2062, nous sommes tomb\xE9s sur leur dernier \xE9tage. Ils y \xE9taient presque."),
        v("vela", t("Ys\xE9 l\u2019avait devin\xE9. Maintenant, je l\u2019ai vu : la gaine qui monte, l\u2019escalier qui monte, leurs marches trop hautes pour nos jambes\u2026 Ils ne fuyaient pas vers le bas, directeur. Ils sont partis d\u2019ici, et chaque g\xE9n\xE9ration a b\xE2ti un \xE9tage plus haut. Le Puits Z\xE9ro \xE9tait leur dernier palier. Ils y \xE9taient presque.")),
        v("", t("Ici, tout commence : le premier puits, les premi\xE8res tables. Tout ce que tu as vu au-dessus a \xE9t\xE9 b\xE2ti ensuite, \xE9tage apr\xE8s \xE9tage, en remontant. Le Puits Z\xE9ro \xE9tait leur dernier palier."))
      )
    }
  ),
  // ---------- Les Strates du Fond (8 novembre 2026, direction « Ce qui tient », validée par Bryan) ----------
  // Après −10, l'enquête continue : l'eau d'en bas, les colonnes qui la retiennent, et ce que les Hauts en ont emporté.
  // Deux Haltes par Strate, de −11 à −15 : une question, puis une révélation selon la piste suivie. La fin de −10 ne bouge pas.
  // ---------- −11 · L'eau d'en bas ----------
  H(
    11,
    1,
    t("Le bord de l\u2019eau"),
    t("Sous la salle du Premier Porteur, l\u2019escalier continue. Trente marches plus bas, il entre dans une eau immobile, si claire qu\u2019on voit les marches poursuivre leur descente dessous."),
    [
      d(t("L\u2019eau"), v("sasha", t("Douce. Pas un grain de sel. Ce n\u2019est pas la mer, directeur. Et elle est ti\xE8de, comme une main.")), v("kessa", t("Elle est ti\xE8de. Une eau qui dort au fond depuis toujours devrait \xEAtre froide.")), v("", t("Une eau douce, ti\xE8de, parfaitement immobile."))),
      d(t("La ligne"), v("doran", t("Un trait grav\xE9 dans le mur, avec des signes \xE0 c\xF4t\xE9. Une ligne d\u2019eau, comme la n\xF4tre sur la digue. Sauf que celle-ci est d\xE9j\xE0 noy\xE9e de trois marches.")), v("", t("Une ligne grav\xE9e par ceux d\u2019avant, trois marches sous la surface."))),
      d(t("Le silence"), v("vela", t("Les empreintes d\u2019ici ne dorment pas. Elles \xE9coutent l\u2019eau, comme quelqu\u2019un qui garde une porte et n\u2019ose pas se retourner.")), v("", t("Les cristaux de la vo\xFBte se refl\xE8tent dans l\u2019eau sans un frisson.")))
    ],
    [
      { texte: t("Planter une jauge"), effet: "composants", piste: "nous", carte: "cache", recit: t("Sasha plante une tige gradu\xE9e sur la derni\xE8re marche s\xE8che et fait une encoche au ras de l\u2019eau. \xC0 la prochaine descente, vous saurez. Derri\xE8re la jauge, une caisse de fouilleur rest\xE9e scell\xE9e.") },
      { texte: t("Toucher l\u2019eau"), effet: "eclat", piste: "avant", carte: "archive", recit: t("Tu poses la main \xE0 plat sur l\u2019eau. Elle ne se ride pas : elle pousse, doucement, vers le haut, comme une paume sous la tienne.") }
    ],
    t("Sous la salle du Premier Porteur, l\u2019escalier entre dans une eau douce et ti\xE8de, qui n\u2019est pas la mer. La ligne d\u2019eau que ceux d\u2019avant ont grav\xE9e l\xE0 est d\xE9j\xE0 noy\xE9e de trois marches.")
  ),
  H(
    11,
    2,
    t("Une marche de plus"),
    t("L\u2019eau a gagn\xE9 une marche depuis ta derni\xE8re venue. Au-dessus d\u2019elle, la vo\xFBte est fendue en \xE9toile."),
    [
      d(t("La marche"), v("sasha", t("Un centim\xE8tre et demi en une semaine. La mer, l\xE0-haut, en prend trois par an. Ce n\u2019est pas la m\xEAme eau, et pas le m\xEAme pas.")), v("ilka", t("Elle a mont\xE9. Une marche enti\xE8re, en quelques jours. L\xE0-haut, il faut un an \xE0 la mer pour en faire autant.")), v("", t("L\u2019eau a recouvert une marche de plus."))),
      d(t("La vo\xFBte"), v("doran", t("La m\xEAme fissure que sur nos Fondations, celles qu\u2019on rebouche la nuit. M\xEAme forme, m\xEAme d\xE9part. On dirait qu\u2019elle descend de chez nous.")), v("", t("Une fissure en \xE9toile court sur la vo\xFBte, au-dessus de l\u2019eau.")))
    ],
    [
      { texte: t("Suivre la fissure"), effet: "composants", piste: "nous", carte: "cache", recit: t("Vous suivez la fissure \xE0 la lampe, de pierre en pierre. Elle file droit vers le haut, vers Vertiga. \xC0 son pied, un sac de mortier de chantier : quelqu\u2019un est d\xE9j\xE0 venu la reboucher, il y a longtemps.") },
      { texte: t("Lire la ligne noy\xE9e"), effet: "eclat", piste: "avant", carte: "archive", recit: t("V\xE9la plonge le bras jusqu\u2019\xE0 la ligne et suit les signes du doigt. Il y en a d\u2019autres dessous, beaucoup d\u2019autres.") }
    ],
    t("L\u2019eau d\u2019en bas monte bien plus vite que la mer, et la vo\xFBte au-dessus d\u2019elle se fend comme nos Fondations."),
    {
      nous: rv(
        t("Les deux nuits"),
        t("La jauge l\u2019a dit : l\u2019eau d\u2019en bas a gagn\xE9 ses deux crans les deux nuits o\xF9 une \xEEle des Hauts est pass\xE9e au-dessus de Vertiga. Elle ne monte pas toute seule : elle monte quand une \xEEle passe, comme si ce qui la tient en l\u2019air pesait encore ici."),
        v("sasha", t("Deux crans sur ma jauge. J\u2019ai les heures. Les deux nuits o\xF9 une \xEEle est pass\xE9e au-dessus de la ville. Ce n\u2019est pas une co\xEFncidence, directeur, c\u2019est une mesure.")),
        v("", t("Deux crans sur la jauge, et deux dates : les deux nuits o\xF9 une \xEEle des Hauts est pass\xE9e au-dessus de Vertiga."))
      ),
      avant: rv(
        t("Mille lignes"),
        t("Sous la ligne noy\xE9e, ceux d\u2019avant en ont grav\xE9 des centaines, de plus en plus bas : pendant des mill\xE9naires, leur eau a baiss\xE9. Elle ne remonte que depuis peu, et c\u2019est la premi\xE8re fois qu\u2019elle passe au-dessus de leur derni\xE8re ligne."),
        v("vela", t("Des centaines de lignes, de plus en plus bas. Leur eau descendait, directeur, si\xE8cle apr\xE8s si\xE8cle. Ils la regardaient partir. Elle ne remonte que depuis nous.")),
        v("", t("Sous la ligne noy\xE9e, des centaines d\u2019autres, de plus en plus basses. Pendant des mill\xE9naires, l\u2019eau d\u2019en bas a baiss\xE9."))
      )
    }
  ),
  // ---------- −12 · Les colonnes ----------
  H(
    12,
    1,
    t("La for\xEAt de cristal"),
    t("Au-del\xE0 de l\u2019eau, une salle si grande que les lampes n\u2019en trouvent pas le bout. Des colonnes de cristal, par milliers, montent du sol \xE0 la vo\xFBte. Certaines sont \xE9teintes."),
    [
      d(t("Une colonne allum\xE9e"), v("vela", t("Elle ne garde pas un souvenir, celle-l\xE0. Elle garde un poids. Comme une \xE9paule sous une poutre.")), v("", t("Une colonne de cristal, chaude au toucher, qui luit d\u2019un bleu tr\xE8s doux."))),
      d(t("Une colonne \xE9teinte"), v("liane", t("Coup\xE9e net, \xE0 la pince. Les pinces du carnet de ma m\xE8re. On a emport\xE9 le c\u0153ur, et la colonne s\u2019est vid\xE9e de sa lumi\xE8re.")), v("doran", t("Coup\xE9e net. \xC7a, ce n\u2019est pas le temps. Ce sont des outils.")), v("", t("Une colonne creuse, \xE9teinte, la tranche marqu\xE9e de coups de pince."))),
      d(t("Le sol"), v("ilka", t("Il penche. Un rien. Un ballon roulerait. Tout penche vers les colonnes \xE9teintes.")), v("", t("Le sol penche, tr\xE8s l\xE9g\xE8rement, vers les colonnes vides.")))
    ],
    [
      { texte: t("Compter les colonnes vides"), effet: "composants", piste: "nous", carte: "cache", recit: t("Vous comptez, rang\xE9e par rang\xE9e, comme on fait l\u2019inventaire d\u2019une r\xE9colte. Cent douze colonnes \xE9teintes. Au pied de la derni\xE8re, des pinces abandonn\xE9es, au sigle de la Compagnie des Fondations.") },
      { texte: t("\xC9couter une colonne allum\xE9e"), effet: "eclat", piste: "avant", carte: "archive", recit: t("Tu poses l\u2019oreille contre le cristal. Pas de voix : un souffle long, r\xE9gulier, comme quelqu\u2019un qui fait un effort et ne veut pas que \xE7a s\u2019entende.") }
    ],
    t("Sous l\u2019eau d\u2019en bas, une for\xEAt de colonnes de cristal porte la vo\xFBte. Cent douze ont \xE9t\xE9 vid\xE9es \xE0 la pince, et le sol penche vers elles.")
  ),
  H(
    12,
    2,
    t("Le sigle"),
    t("Pr\xE8s des colonnes \xE9teintes, un campement de chantier abandonn\xE9 : des caisses, une lampe \xE0 huile, des pinces rang\xE9es par taille."),
    [
      d(t("Une pince"), v("sasha", t("Num\xE9ro de s\xE9rie, et une date : 2091. Trente ans, directeur. Le temps qu\u2019il faut \xE0 une vo\xFBte pour descendre d\u2019une marche.")), v("", t("Une pince grav\xE9e d\u2019un num\xE9ro et d\u2019une date : 2091."))),
      d(t("La lampe"), v("kessa", t("Ils ont dormi ici. Plusieurs nuits. Ceux-l\xE0 savaient o\xF9 ils \xE9taient. Et ils ne sont pas descendus par chez nous : au-dessus, toutes les portes \xE9taient encore ferm\xE9es de l\u2019int\xE9rieur.")), v("", t("Une lampe \xE0 huile, vid\xE9e jusqu\u2019\xE0 la m\xE8che.")))
    ],
    [
      { texte: t("Fouiller les caisses"), effet: "composants", piste: "nous", carte: "cache", recit: t("Les caisses sont presque vides. Dans la derni\xE8re, sous la paille, des papiers de chantier, et assez de mat\xE9riel pour remonter sans manquer de rien.") },
      { texte: t("Examiner la gravure d\u2019une colonne"), effet: "eclat", piste: "avant", carte: "archive", recit: t("Sur une colonne allum\xE9e, \xE0 hauteur d\u2019yeux, une gravure que tu n\u2019avais pas vue.") }
    ],
    t("En 2091, une \xE9quipe de la Compagnie des Fondations a dormi ici, le temps de vider cent douze colonnes."),
    {
      nous: rv(
        t("Le bon de commande"),
        t("Dans une caisse, un bon de la Compagnie des Fondations, dat\xE9 de 2091 : \xAB C\u0153urs porteurs, 112, pour le Levage. \xBB Ils ont \xE9crit \xAB porteurs \xBB. Ils savaient que ces cristaux portaient quelque chose. Ils n\u2019ont pas demand\xE9 quoi."),
        v("liane", t("\xAB C\u0153urs porteurs, cent douze, pour le Levage. \xBB Le tampon de la Compagnie, et la signature d\u2019une Ors\xE8ve. Ils savaient que \xE7a portait. Ils ont seulement voulu que \xE7a porte autre chose.")),
        v("", t("Un bon de chantier de 2091 : \xAB C\u0153urs porteurs, 112, pour le Levage. \xBB Avec le tampon de la Compagnie des Fondations."))
      ),
      avant: rv(
        t("Les bras lev\xE9s"),
        t("Sur la colonne, un personnage grav\xE9, les bras lev\xE9s, qui soutient la vo\xFBte. Pas un roi : un graveur, ses outils \xE0 la ceinture. Ceux d\u2019avant n\u2019ont pas taill\xE9 ces colonnes. Ils s\u2019y sont grav\xE9s, pour tenir."),
        v("vela", t("Ce n\u2019est pas une d\xE9coration, directeur. C\u2019est un portrait. Chaque colonne est quelqu\u2019un. Ils se sont grav\xE9s dedans, et depuis, ils tiennent la vo\xFBte au-dessus de l\u2019eau.")),
        v("", t("Un graveur aux bras lev\xE9s, qui soutient la vo\xFBte. Le m\xEAme trait sur chaque colonne allum\xE9e, et un visage diff\xE9rent."))
      )
    }
  ),
  // ---------- −13 · Ceux qui portent ----------
  H(
    13,
    1,
    t("Le registre des colonnes"),
    t("Le long du mur, une table immense, couverte de signes en colonnes. V\xE9la ne la lit pas : elle la reconna\xEEt."),
    [
      d(t("Les signes"), v("vela", t("\xAB Ossyra. \xBB Ceux qui portent. Le mot des tables, celui que le Premier Porteur nous a dit, la main sur la sienne. Il ne voulait pas dire qu\u2019ils portaient des voix. Il voulait dire \xE7a.")), v("", t("Une table couverte de signes, rang\xE9s comme un registre."))),
      d(t("Une colonne fendue"), v("kessa", t("Celle-l\xE0 souffre. Je ne sais pas comment je le sais. Comme un dos qu\u2019on a trop charg\xE9, et qui ne dit rien.")), v("", t("Une colonne allum\xE9e, fendue sur toute sa hauteur, qui luit par saccades."))),
      d(t("Les cases vides"), v("doran", t("Cent douze cases barr\xE9es d\u2019un trait neuf. Pas leur \xE9criture : la n\xF4tre. Quelqu\u2019un les a ray\xE9es en partant, comme on raye une ligne d\u2019inventaire.")), v("", t("Dans le registre, des cases ray\xE9es d\u2019un trait r\xE9cent, d\u2019une \xE9criture humaine.")))
    ],
    [
      { texte: t("Recopier le registre"), effet: "composants", piste: "nous", carte: "archive", recit: t("Tu fais recopier le registre, case par case, rayures comprises. Pour Ys\xE9, et pour ceux qui voudront savoir. Sous la table, une r\xE9serve de fouilleur, intacte.") },
      { texte: t("Poser la main sur la fendue"), effet: "eclat", piste: "avant", carte: "scellee", recit: t("Tu poses la main sur la colonne fendue. Elle cesse de clignoter, une seconde, comme quelqu\u2019un qui reprend son souffle quand on l\u2019aide \xE0 porter.") }
    ],
    t("Les colonnes du Fond sont inscrites dans un registre : Ossyra, \xAB ceux qui portent \xBB, le mot de \u22127 pour dire \xAB nous \xBB. Cent douze cases y sont ray\xE9es d\u2019une \xE9criture humaine.")
  ),
  H(
    13,
    2,
    t("Ce qui tient"),
    t("Au bout du registre, une derni\xE8re table, plus grande que les autres, pos\xE9e face aux colonnes comme une st\xE8le de chantier."),
    [
      d(t("La table"), v("vela", t("C\u2019est un compte. Ce que chaque colonne porte, et ce qu\u2019il en reste. Ils ont tout mesur\xE9, jusqu\u2019au dernier grain.")), v("sasha", t("Des chiffres. Des charges, en face de chaque nom. Ce sont des calculs de structure, directeur. Les m\xEAmes que les miens, en mieux.")), v("", t("Une table de comptes, une ligne par colonne."))),
      d(t("La derni\xE8re ligne"), v("ilka", t("La derni\xE8re ligne est vide. Ils l\u2019ont laiss\xE9e pour quelqu\u2019un.")), v("", t("La derni\xE8re ligne du compte est rest\xE9e vide.")))
    ],
    [
      { texte: t("Refaire le compte"), effet: "composants", piste: "nous", carte: "cache", recit: t("Sasha refait le compte avec les colonnes qui restent. Il le refait deux fois, puis il range son carnet sans rien dire. Derri\xE8re la table, du mat\xE9riel de mesure, oubli\xE9 en 2091.") },
      { texte: t("Lire la st\xE8le jusqu\u2019au bout"), effet: "eclat", piste: "avant", carte: "archive", recit: t("V\xE9la lit \xE0 voix haute, lentement, jusqu\u2019\xE0 la ligne vide. \xC0 la derni\xE8re phrase, elle s\u2019arr\xEAte, et recommence au d\xE9but.") }
    ],
    t("Ceux d\u2019avant ont tenu le compte de ce que porte chaque colonne. La derni\xE8re ligne de leur registre est rest\xE9e vide."),
    {
      nous: rv(
        t("Une \xEEle de plus"),
        t("Le compte de Sasha est simple. Il reste assez de colonnes pour porter Vertiga. Pas assez pour porter Vertiga et une \xEEle de plus. Chaque \xEEle qu\u2019on l\xE8ve l\xE0-haut se paie ici, d\u2019une colonne qu\u2019on vide."),
        v("sasha", t("J\u2019ai refait le compte deux fois. Il reste de quoi porter la ville. Pas la ville et une \xEEle de plus. Chaque \xEEle qu\u2019on l\xE8ve, directeur, c\u2019est une colonne qu\u2019on vide ici.")),
        v("", t("Le compte, refait avec les colonnes qui restent : assez pour porter Vertiga, pas assez pour une \xEEle de plus."))
      ),
      avant: rv(
        t("Ils ont choisi"),
        t("Ceux d\u2019avant ne se sont pas tous perdus dans leurs voix. Les derniers sont descendus se graver ici, dans les colonnes, pour retenir l\u2019eau pendant que leurs enfants remontaient. L\u2019\xC9cluse, ce n\u2019\xE9tait pas une machine : c\u2019\xE9tait eux."),
        v("vela", t("\xAB Ici se sont rendus ceux qui portent, pour que l\u2019eau reste en bas. \xBB L\u2019\xC9cluse, directeur. On la cherchait comme une machine. C\u2019\xE9taient des gens. Ils ont choisi de tenir.")),
        v("", t("Sur la st\xE8le : \xAB Ici se sont rendus ceux qui portent, pour que l\u2019eau reste en bas. \xBB L\u2019\xC9cluse, c\u2019\xE9taient eux."))
      )
    }
  ),
  // ---------- −14 · Sous ta Tour ----------
  H(
    14,
    1,
    t("Sous ta Tour"),
    t("Une colonne seule, au bout d\u2019une galerie, plus fine que les autres. Sasha sort son plomb, son compas et les plans de la Cuvette."),
    [
      d(t("Le compas"), v("sasha", t("J\u2019ai refait trois fois le relev\xE9. La colonne devant nous est exactement sous ta Tour du Noyau. Ton pilier ne bouge jamais parce qu\u2019il est pos\xE9 sur elle.")), v("", t("D\u2019apr\xE8s les plans, la colonne se dresse juste sous la Tour du Noyau."))),
      d(t("La colonne"), v("vela", t("Elle est plus jeune que les autres. Quelqu\u2019un s\u2019y est grav\xE9 tard, bien apr\xE8s les premiers. Et seul.")), v("", t("Une colonne plus fine, plus claire, au cristal plus r\xE9cent."))),
      d(t("Un bruit"), v("doran", t("Le casque de mon p\xE8re r\xE9sonne contre elle. En 2066, il a entendu le loquet, et dessous, un autre bruit qu\u2019il n\u2019a jamais su nommer. C\u2019\xE9tait elle : quelqu\u2019un qui changeait d\u2019\xE9paule."), "casque"), v("doran", t("\xC9coute. Un craquement, de temps en temps, comme une poutre. Mon p\xE8re parlait du loquet, et d\u2019un bruit plus sourd, en dessous. Je crois que c\u2019\xE9tait \xE7a.")), v("", t("De temps en temps, un craquement sourd, comme une poutre qui travaille.")))
    ],
    [
      { texte: t("Mesurer la charge"), effet: "composants", piste: "nous", carte: "cache", recit: t("Sasha pose ses jauges sur la colonne, de bas en haut. Il note, il efface, il note encore. Contre la paroi, une caisse de chantier marqu\xE9e au nom de ton district.") },
      { texte: t("Lui demander son nom"), effet: "eclat", piste: "avant", carte: "archive", recit: t("Tu demandes son nom \xE0 la colonne, \xE0 voix basse, comme \xE0 \u22129. La lumi\xE8re bouge, tr\xE8s lentement, vers le pied du cristal.") }
    ],
    t("Une colonne seule se dresse exactement sous la Tour du Noyau. C\u2019est pour elle que le pilier de mon district ne bouge jamais.")
  ),
  H(
    14,
    2,
    t("Le nom de la colonne"),
    t("Tu reviens sous ta Tour. La colonne n\u2019a pas chang\xE9. Toi, si : tu sais maintenant ce qu\u2019elle porte."),
    [
      d(t("Le pied"), v("vela", t("Il y a une inscription au pied, presque effac\xE9e par les mains. Des gens sont venus la toucher, souvent. Pas nous.")), v("", t("Au pied de la colonne, une inscription us\xE9e par les mains."))),
      d(t("La fente"), v("kessa", t("Elle est fendue sur un tiers. Elle tient. Mais elle tient comme on tient quand on n\u2019a plus le choix.")), v("", t("Une fente monte sur un tiers de la colonne.")))
    ],
    [
      { texte: t("Relever la fente"), effet: "composants", piste: "nous", carte: "cache", recit: t("Tu fais marquer la fente \xE0 la craie, avec la date. Si elle grandit, la prochaine escouade le verra. Derri\xE8re la colonne, du mortier de chantier, encore sec.") },
      { texte: t("D\xE9chiffrer l\u2019inscription"), effet: "eclat", piste: "avant", carte: "archive", recit: t("V\xE9la suit l\u2019inscription du doigt, signe par signe, et p\xE2lit \xE0 la moiti\xE9. Elle te regarde. Elle a reconnu le nom.") }
    ],
    t("La colonne sous ma Tour porte un nom, us\xE9 par les mains de ceux d\u2019avant qui venaient la toucher."),
    {
      nous: rv(
        t("Le poids d\u2019un district"),
        t("La colonne sous ta Tour porte seule tout ton district, digue comprise. Elle est fendue sur un tiers. Les fissures qu\u2019on rebouche la nuit dans les Fondations, ce n\u2019est pas la mer qui les fait : c\u2019est elle qui c\xE8de."),
        v("sasha", t("Elle porte tout. La Tour, la place, la digue, les pompes. Les fissures qu\u2019on rebouche la nuit, directeur, ce n\u2019est pas la mer. C\u2019est elle qui plie.")),
        v("", t("La colonne porte tout le district, digue comprise. Elle est fendue sur un tiers de sa hauteur."))
      ),
      avant: rv(
        t("Le nom donn\xE9"),
        t("Au pied de la colonne, le nom que la Tisseuse de \u22129 avait donn\xE9 \xE0 quelqu\u2019un qui descendait vers le fond. Il l\u2019a port\xE9 jusqu\u2019ici, et s\u2019est grav\xE9 sous ton district avec lui, pour qu\u2019elle ne disparaisse pas."),
        v("vela", t("C\u2019est le nom de la Tisseuse, directeur. Celui qu\u2019elle a donn\xE9 \xE0 quelqu\u2019un qui descendait. Il l\u2019a port\xE9 jusqu\u2019en bas, et il s\u2019est grav\xE9 avec lui. Ton district tient sur un nom qu\u2019on a refus\xE9 d\u2019oublier.")),
        v("", t("L\u2019inscription porte le nom que la Tisseuse de \u22129 avait donn\xE9 \xE0 quelqu\u2019un qui descendait vers le fond."))
      )
    }
  ),
  // ---------- −15 · Le fond du Fond ----------
  H(
    15,
    1,
    t("Les vannes"),
    t("Tout en bas, l\xE0 o\xF9 l\u2019eau d\u2019en bas entre dans la pierre, une rang\xE9e de vannes, d\u2019un m\xE9tal qui ne rouille pas."),
    [
      d(t("Les vannes"), v("sasha", t("Le m\xEAme m\xE9tal que les vannes des Citernes, sous les Basses. Les m\xEAmes r\xE9glages, sur une mar\xE9e qui n\u2019existe plus. Ce sont les deux bouts d\u2019une seule machine.")), v("", t("Des vannes d\u2019un m\xE9tal sans rouille, r\xE9gl\xE9es sur une mar\xE9e inconnue."))),
      d(t("L\u2019eau"), v("vela", t("Elle ne vient pas d\u2019en dessous. Elle vient d\u2019en haut. C\u2019est la mer, filtr\xE9e par la pierre, qui descend ici depuis toujours, au lieu de monter chez nous.")), v("", t("L\u2019eau entre par les vannes, venue d\u2019en haut, filtr\xE9e par la pierre."))),
      d(t("Une table"), v("doran", t("Une seule ligne, grav\xE9e large : \xAB Ce qui tient ne se reprend pas. Il se rend. \xBB")), v("", t("Une table grav\xE9e d\u2019une seule ligne : \xAB Ce qui tient ne se reprend pas. Il se rend. \xBB")))
    ],
    [
      { texte: t("Tourner une vanne"), effet: "composants", piste: "nous", carte: "cache", recit: t("Ilka et Doran p\xE8sent sur un volant. Il tourne d\u2019un cran, puis se bloque. Tr\xE8s loin au-dessus, quelque chose r\xE9pond, comme une pompe qui tousse. Au pied du volant, des outils trop grands pour nos mains.") },
      { texte: t("Lire la table"), effet: "eclat", piste: "avant", carte: "archive", recit: t("Tu lis la ligne \xE0 voix haute. L\u2019eau, derri\xE8re les vannes, se calme d\u2019un coup, comme si elle avait entendu.") }
    ],
    t("Au fond du Fond, des vannes laissent la mer descendre dans la pierre au lieu de monter. Sur une table : \xAB Ce qui tient ne se reprend pas. Il se rend. \xBB")
  ),
  H(
    15,
    2,
    t("Se rendre"),
    t("Tu redescends aux vannes. L\u2019escouade se tait. Chacun a compris quelque chose, et personne n\u2019ose dire quoi."),
    [
      d(t("Les vannes"), v("ilka", t("Elles sont pr\xEAtes. Elles ont toujours \xE9t\xE9 pr\xEAtes. Ce qui manque, ce n\u2019est pas la machine.")), v("", t("Les vannes attendent, r\xE9gl\xE9es, intactes."))),
      d(t("L\u2019escouade"), v("vela", t("Mes peurs se taisent, ici. Pour la premi\xE8re fois depuis la chambre. Comme si quelqu\u2019un les portait un peu \xE0 ma place.")), v("", t("L\u2019escouade se tient pr\xE8s des vannes, sans un mot.")))
    ],
    [
      { texte: t("Noter le r\xE9glage des vannes"), effet: "composants", piste: "nous", carte: "cache", recit: t("Sasha recopie chaque r\xE9glage, chaque cran, pour les Citernes. Si un jour on veut ouvrir les deux bouts ensemble, il faudra savoir comment. Derri\xE8re la derni\xE8re vanne, une r\xE9serve de chantier.") },
      { texte: t("Rester un moment"), effet: "eclat", piste: "avant", carte: "archive", recit: t("Tu restes un moment pr\xE8s des vannes, sans rien faire, \xE0 \xE9couter l\u2019eau descendre.") }
    ],
    t("Au fond du Fond, l\u2019escouade se tait. Les vannes sont pr\xEAtes ; ce qui leur manque, ce n\u2019est pas une machine."),
    {
      nous: rv(
        t("Les deux bouts"),
        t("Les vannes du Fond et celles des Citernes sont une seule machine, toujours r\xE9gl\xE9e : elle laisse la mer descendre ici au lieu de monter l\xE0-haut. Il ne lui manque qu\u2019une chose, ce qui tient, pour que la vo\xFBte supporte l\u2019eau qu\u2019on lui confierait."),
        v("sasha", t("Les Citernes et le Fond, c\u2019est une seule machine. On ouvre en haut, \xE7a descend en bas, et la mer baisse chez nous. Il ne manque que de quoi tenir la vo\xFBte. Il ne manque que ce qu\u2019on a emport\xE9.")),
        v("", t("Les vannes du Fond et celles des Citernes sont les deux bouts d\u2019une m\xEAme machine. Il ne lui manque que ce qui tient."))
      ),
      avant: rv(
        t("Se rendre"),
        t("Ce qui tient ne se reprend pas de force : une empreinte se rend. Pour rendre sa vo\xFBte au Fond, il faudrait que les c\u0153urs mont\xE9s aux Hauts acceptent de redescendre, ou que d\u2019autres viennent prendre leur place."),
        v("vela", t("\xAB Il se rend. \xBB On ne pourra pas arracher les c\u0153urs aux \xEEles comme on les a arrach\xE9s d\u2019ici. Il faudrait qu\u2019ils acceptent de redescendre. Ou que d\u2019autres viennent porter \xE0 leur place.")),
        v("", t("Ce qui tient ne se reprend pas : il se rend. Il faudrait que les c\u0153urs mont\xE9s aux Hauts acceptent de redescendre, ou que d\u2019autres prennent leur place."))
      )
    }
  )
];
var halteDef = (strate, n) => HALTES.find((h) => h.strate === strate && h.n === n);
function pisteChoisie(choix, strate, n) {
  const k = choix?.[`${strate}-${n}`];
  return k === void 0 ? void 0 : halteDef(strate, n)?.choix[k]?.piste;
}
function comptePistes(choix) {
  const c2 = { nous: 0, avant: 0 };
  for (const h of HALTES) {
    if (h.strate > 10) continue;
    const p = pisteChoisie(choix, h.strate, h.n);
    if (p) c2[p]++;
  }
  return c2;
}
function pisteFinale(choix) {
  const c2 = comptePistes(choix);
  return c2.nous === c2.avant ? pisteChoisie(choix, 10, 2) ?? "avant" : c2.nous > c2.avant ? "nous" : "avant";
}
var RECIT_CARTE = {
  cache: t("Sur ton plan, une salle juste apr\xE8s la Halte s\u2019\xE9claire : une r\xE9serve, sans combat."),
  archive: t("Sur ton plan, une salle juste apr\xE8s la Halte s\u2019\xE9claire : des papiers d\u2019\xE9poque y attendent."),
  scellee: t("Sur ton plan, une salle juste apr\xE8s la Halte s\u2019\xE9claire : une salle scell\xE9e, gard\xE9e, avec une carte au bout.")
};
var PARTICULARITES = [
  { strate: 2, nom: t("Caches mur\xE9es"), texte: t("Des caches mur\xE9es : un Augment\xE9 les force, et y trouve le double.") },
  { strate: 3, nom: t("Le noir complet"), texte: t("M\xEAme un R\xE9sonant ne sent rien au-del\xE0 des salles voisines. Une lanterne attend \xE0 la Halte.") },
  { strate: 4, nom: t("Portes rondes"), texte: t("Toutes closes : deux fois plus de salles scell\xE9es.") },
  { strate: 5, nom: t("Les niches"), texte: t("Les caches sont des niches : parfois une carte y dort.") },
  { strate: 6, nom: t("Les pleurs"), texte: t("Les archives sont plus nombreuses derri\xE8re le mur.") },
  { strate: 7, nom: t("Souvenirs doubles"), texte: t("Certains combats ont deux occupants : choisis lequel affronter.") },
  { strate: 8, nom: t("Les Veilleurs perdus"), texte: t("Un Veilleur \xE9gar\xE9 attend toujours quelque part sur le plan.") },
  { strate: 9, nom: t("Les fils"), texte: t("Un fil relie deux salles c\xF4te \xE0 c\xF4te : on peut le suivre une fois.") },
  { strate: 10, nom: t("Le dernier verrou"), texte: t("Les portes \xE0 Fr\xE9quence demandent une suite de 4.") }
];
var QUETES = [
  { strate: 1, nom: t("Les noms du mur"), but: t("Relever les noms des fouilleurs jamais barr\xE9s."), etapes: [
    t("Un nom grav\xE9 sur un \xE9tai : \xAB Mar. Ivens, 2066 \xBB. Jamais barr\xE9."),
    t("Un deuxi\xE8me, sur une pompe noy\xE9e : \xAB T. Daro \xBB. Pas barr\xE9 non plus."),
    t("Le dernier, \xE0 moiti\xE9 effac\xE9 : le nom du p\xE8re de Doran. Les trois noms du registre de 2066.")
  ], fin: t("Trois noms de 2066 ne sont jamais barr\xE9s. Deux de ces ouvriers ne sont jamais remont\xE9s. Le p\xE8re de Doran est le seul des trois \xE0 \xEAtre remont\xE9, et il n\u2019a jamais voulu barrer le sien.") },
  { strate: 2, nom: t("Les sacs vol\xE9s"), but: t("Retrouver les sacs de cristaux tomb\xE9s des pilleurs."), etapes: [
    t("Un sac \xE9ventr\xE9, trois cristaux encore dedans. Ils tremblent."),
    t("Un deuxi\xE8me sac, pos\xE9 avec soin contre un mur. Quelqu\u2019un l\u2019a laiss\xE9 expr\xE8s."),
    t("Le dernier sac, avec un mot : \xAB Pour le directeur. Elles voulaient descendre. Je les ai aid\xE9es. \xBB Sign\xE9 d\u2019un B, d\u2019une main qui tremble : Brac.")
  ], fin: t("Brac n\u2019a pas tout emport\xE9 : il a laiss\xE9 ceux qui tremblaient trop pour le voyage. Ceux-l\xE0 rentrent \xE0 la chambre.") },
  { strate: 3, nom: t("Les patrouilles de Hald"), but: t("Retrouver les traces des soldats perdus dans le noir."), etapes: [
    t("Une gourde des Brigades, vide, et une fl\xE8che \xE0 la craie."),
    t("Une couverture militaire, et neuf encoches dans un pilier."),
    t("Un fil des Brigades, coup\xE9 net au couteau. Ils ne voulaient pas que la Confluence les suive.")
  ], fin: t("Les patrouilles de Hald ont coup\xE9 leur fil pour que rien ne les suive, et elles ont attendu dans le noir. La capitaine ne le dira jamais, mais elle te doit \xE7a.") },
  { strate: 4, nom: t("Les cl\xE9s rondes"), but: t("Rassembler les cl\xE9s qui ferment les portes rondes."), etapes: [
    t("Un disque de cristal, lisse, de la taille d\u2019une paume. Il s\u2019embo\xEEte dans une porte."),
    t("Un deuxi\xE8me disque, grav\xE9 d\u2019un seul nom."),
    t("Le troisi\xE8me disque. Ensemble, ils ouvrent la porte entrouverte : derri\xE8re, rien qu\u2019une chaise, et une lampe \xE9teinte.")
  ], fin: t("Les cl\xE9s n\u2019ouvraient qu\u2019une pi\xE8ce vide : une chaise, une lampe. Quelqu\u2019un a veill\xE9 ici, longtemps, puis il est descendu.") },
  { strate: 5, nom: t("Les sceaux de cire"), but: t("Relever les sceaux de la Maison Ors\xE8ve sur les niches vid\xE9es."), etapes: [
    t("Un sceau, dat\xE9 de cette ann\xE9e. Les Hauts sont encore venus r\xE9cemment."),
    t("Un sceau plus ancien, d\u2019il y a vingt ans. \xC7a ne date pas d\u2019hier."),
    t("Un sceau de 2094, pos\xE9 pendant le Levage. La Maison Ors\xE8ve vidait d\xE9j\xE0 les Berceaux.")
  ], fin: t("La Maison Ors\xE8ve vide les Berceaux depuis au moins 2094, pendant le Levage. Et personne, en bas, ne l\u2019a jamais signal\xE9.") },
  { strate: 6, nom: t("Les tampons de 2066"), but: t("Retrouver les ordres de service du chantier de la nuit du 14."), etapes: [
    t("Un ordre de service : \xAB Couler le mur, niveau 7. Urgent. \xBB"),
    t("Un deuxi\xE8me : \xAB Ne pas \xE9couter. Ne pas r\xE9pondre. \xBB"),
    t("Un troisi\xE8me, sign\xE9 du chef de chantier : \xAB Sur ordre du bureau des abris. \xBB"),
    t("Le dernier, de la main du p\xE8re de Doran : \xAB J\u2019ai entendu le loquet. Ce n\u2019\xE9tait pas nous. \xBB")
  ], fin: t("En 2066, l\u2019ordre de murer le niveau 7 est venu du bureau des abris. Le loquet, lui, a \xE9t\xE9 tir\xE9 de l\u2019autre c\xF4t\xE9.") },
  { strate: 7, nom: t("Les lignes d\u2019eau"), but: t("Relever les lignes d\u2019eau de ceux d\u2019avant, de la plus basse \xE0 la plus haute."), etapes: [
    t("La ligne la plus basse, grav\xE9e profond, presque effac\xE9e par l\u2019eau."),
    t("Une ligne plus haut, d\u2019une autre main, plus press\xE9e."),
    t("Plus haut encore, des dizaines de lignes serr\xE9es, \xE0 quelques doigts l\u2019une de l\u2019autre."),
    t("La derni\xE8re, tout en haut. Personne n\u2019a grav\xE9 au-dessus.")
  ], fin: t("De la plus basse \xE0 la plus haute, pas un mot, pas une date. Rien ne dit ce qu\u2019ils comptaient faire de l\u2019eau.") },
  { strate: 8, nom: t("Les six Veilleurs"), but: t("Retrouver les Veilleurs de Tobin \xE9gar\xE9s dans les souvenirs de la Ruche."), etapes: [
    t("Une Veilleuse, endormie contre un pilier. Elle se r\xE9veille en demandant l\u2019heure."),
    t("Deux Veilleurs, qui se tenaient la main dans le m\xEAme r\xEAve."),
    t("Un Veilleur qui comptait les tables. Il en \xE9tait \xE0 mille deux cents."),
    t("Le dernier, le chef d\u2019\xE9quipe. Il tient l\u2019\xE9clat d\u2019une autre table, grav\xE9 de la m\xEAme phrase que celui de la fouilleuse d\u2019autrefois.")
  ], fin: t("Les six Veilleurs sont rentr\xE9s. Leur chef a remis \xE0 Ys\xE9 l\u2019\xE9clat d\u2019une autre table, grav\xE9 de la m\xEAme main press\xE9e : \xAB Que celui qui lit ceci compte les voix qu\u2019il porte. \xBB Dessous, la pierre est lisse, comme si le copiste s\u2019\xE9tait arr\xEAt\xE9 avant la fin.") },
  { strate: 9, nom: t("Les fils d\xE9nou\xE9s"), but: t("Renouer les fils qui gardent des noms oubli\xE9s."), etapes: [
    t("Un fil renou\xE9 : le nom d\u2019une fille des quarante familles de l\u2019abri de 2060."),
    t("Un fil renou\xE9 : le nom d\u2019un fouilleur jamais barr\xE9 au mur de \u22121."),
    t("Un fil renou\xE9 : un nom de ceux d\u2019avant, tr\xE8s long, que personne ne sait prononcer."),
    t("Le dernier fil : un fil vide. Celui de la Tisseuse elle-m\xEAme.")
  ], fin: t("Tous les fils sont renou\xE9s, sauf un. La Tisseuse a donn\xE9 son propre nom \xE0 celui qui descendait au fond. Il le porte encore, plus bas.") },
  { strate: 10, nom: t("Les loquets"), but: t("Trouver qui a ferm\xE9 les portes du fond de l\u2019int\xE9rieur."), etapes: [
    t("Un loquet tir\xE9, avec une seule empreinte de doigt."),
    t("Un deuxi\xE8me loquet, la m\xEAme empreinte."),
    t("Un troisi\xE8me. Toujours la m\xEAme. Une seule personne a ferm\xE9 toutes les portes."),
    t("Le dernier loquet, encore ti\xE8de. Il l\u2019a tir\xE9 en vous entendant arriver.")
  ], fin: t("Toutes les portes du fond ont \xE9t\xE9 ferm\xE9es par la m\xEAme main, de l\u2019int\xE9rieur. Il ne se cachait pas. Il gardait quelque chose dehors.") }
];
var SECRETS = [
  { id: "service", nom: t("Un couloir de service"), voix: {
    doran: t("Un couloir de service, derri\xE8re cette plaque. L\u2019\xE9quipe de mon p\xE8re les marquait d\u2019une croix. Regarde : la croix."),
    kessa: t("De l\u2019air passe par l\xE0. Un couloir. Mes yeux le voient mieux que les v\xF4tres.")
  }, derriere: [
    t("Un abri d\u2019ouvrier : un lit, une gamelle, et un calendrier de 2066 arr\xEAt\xE9 au 14."),
    t("Un local technique scell\xE9. Des plans des salles closes, roul\xE9s dans un tube."),
    t("Une galerie de graveur, \xE9troite. Les murs sont couverts d\u2019esquisses de visages."),
    t("Un couloir parfaitement propre, qui m\xE8ne \xE0 une petite pi\xE8ce : une seule chaise, face au mur.")
  ] },
  { id: "noir", nom: t("Un passage dans le noir"), voix: {
    nuit: t("Il y a un passage l\xE0, dans le noir. Vous ne le voyez pas : il n\u2019y a pas de lumi\xE8re qui y entre. Moi, je n\u2019en ai pas besoin."),
    vela: t("Quelqu\u2019un chante, derri\xE8re la paroi. Doucement. Il y a un passage.")
  }, derriere: [
    t("Une grotte o\xF9 les cristaux s\u2019allument un \xE0 un \xE0 votre approche, comme pour vous accueillir."),
    t("Une niche oubli\xE9e par les Hauts, encore pleine. Elle dort."),
    t("Une cavit\xE9 pleine d\u2019ambre o\xF9 un insecte immense, fig\xE9, garde un \xE9clat de table."),
    t("Une chambre noire o\xF9 une seule voix r\xE9cite, tr\xE8s bas, la liste de ceux d\u2019avant.")
  ] },
  { id: "hauts", nom: t("Une porte des Hauts"), voix: {
    aurel: t("Une porte de service des Hauts. On les fait toujours de la m\xEAme fa\xE7on : il suffit de pousser l\xE0, en haut \xE0 gauche."),
    liane: t("Les Hauts ont une porte ici. Je reconnais leurs charni\xE8res : dor\xE9es, m\xEAme sous terre.")
  }, derriere: [
    t("Un r\xE9duit o\xF9 les Brigades stockent leurs rations. Personne ne viendra les compter."),
    t("Un vestiaire des pr\xE9leveurs : blouses blanches, gants, et une liste de niches coch\xE9es."),
    t("Un d\xE9p\xF4t des Hauts, vide, sauf une lettre jamais envoy\xE9e, adress\xE9e \xE0 \xAB Liane \xBB."),
    t("Un escalier de marbre qui ne m\xE8ne nulle part. Les Hauts ont essay\xE9 de venir jusqu\u2019ici.")
  ] },
  { id: "fouilleur", nom: t("Une marque de fouilleur"), voix: {
    sasha: t("Une marque de fouilleur sur la pierre : \xAB cache derri\xE8re \xBB. Je connais ce signe, je l\u2019ai assez utilis\xE9."),
    joss: t("Quelqu\u2019un a cach\xE9 quelque chose ici et en a encore honte. \xC7a se sent."),
    ilka: t("Une fl\xE8che grav\xE9e, toute petite. Les coursiers marquent leurs raccourcis comme \xE7a.")
  }, derriere: [
    t("La cachette d\u2019un fouilleur, avec son carnet : \xAB Si tu trouves \xE7a, rends-le \xE0 ma fille. \xBB"),
    t("Une cache de pilleur, avec un plan des portes rondes trac\xE9 \xE0 la main."),
    t("Un trou de fouilleur, et au fond, un carnet de relev\xE9s des Veilleurs perdus."),
    t("Une marque de fouilleur, tr\xE8s ancienne. Quelqu\u2019un est d\xE9j\xE0 venu jusqu\u2019ici, bien avant 2066.")
  ] }
];
var BESTIAIRE = {
  // les Rôdeurs (31 octobre 2026, explorer.ts) : un par zone, croisé seulement en Explorer
  "maree-basse": {
    origine: t("Un Rampeur qui n\u2019a jamais cess\xE9 de grandir, n\xE9 dans les eaux chaudes des pompes de 2066. Les fouilleurs l\u2019entendent respirer sous les piliers."),
    conseil: t("Elle s\u2019enfuit au bout de quatre tours : frappe fort d\xE8s le premier. Ses Ressacs touchent toute l\u2019escouade : garde du bouclier."),
    secret: t("Mar\xE9e-Basse ne s\u2019approche jamais des piliers qui tiennent. Elle suit l\u2019eau qui monte, comme tout le monde.")
  },
  "sentinelle-orpheline": {
    origine: t("Une Sentinelle de verre dont la porte a \xE9t\xE9 mur\xE9e en 2066. Elle cherche depuis une porte \xE0 garder."),
    conseil: t("Blind\xE9e : mise sur des cartes fortes ou sur Per\xE7ant. Elle fuit au bout de quatre tours : ne garde rien pour la fin."),
    secret: t("Elle ne frappe jamais quelqu\u2019un qui se tient dans l\u2019encadrement d\u2019une porte. Personne ne sait pourquoi.")
  },
  liseur: {
    origine: t("Un \xC9cho qui lit \xE0 voix haute les noms grav\xE9s des Registres. L\xE0 o\xF9 il est pass\xE9, les noms s\u2019effacent."),
    conseil: t("Hors R\xE9sonance, tes coups glissent sur lui : encha\xEEne des suites. Il brouille tes Fr\xE9quences un tour sur quatre."),
    secret: t("Il ne lit jamais deux fois le m\xEAme nom. Ceux qu\u2019il a lus, la Tisseuse les avait d\xE9j\xE0 oubli\xE9s.")
  },
  plongeur: {
    origine: t("Un scaphandre de ceux d\u2019avant, lest\xE9, qui marche encore vers la surface. Il ne s\u2019est jamais arr\xEAt\xE9."),
    conseil: t("Tr\xE8s blind\xE9, et ses Poids morts font mal : prot\xE8ge le plus faible, et frappe gros avant qu\u2019il reparte."),
    secret: t("Sur son casque, quelqu\u2019un a grav\xE9 des vagues, les m\xEAmes que sur la couverture tiss\xE9e de \u22124. Il est pass\xE9 par les portes rondes, un jour.")
  },
  remanent: {
    origine: t("Une empreinte trop vieille pour se souvenir de son porteur. Elle erre dans les Seuils en cherchant un corps qui n\u2019existe plus."),
    conseil: t("Ses F\xEAlures sont cach\xE9es : sans suite de Fr\xE9quences, tes coups glissent sur lui. Encha\xEEne 3, 4, 5."),
    secret: t("Certains R\xE9manents r\xE9p\xE8tent la m\xEAme phrase en boucle. Ys\xE9 en a not\xE9 une : \xAB Ne fermez pas, il reste quelqu\u2019un. \xBB")
  },
  vigie: {
    origine: t("Une machine de surveillance des d\xE9p\xF4ts de 2060. Personne ne lui a dit que les d\xE9p\xF4ts \xE9taient vides."),
    conseil: t("Blind\xE9e, elle vise les R\xE9sonants et vole ton Flux \xE0 chaque coup qui passe : prot\xE8ge V\xE9la et frappe fort."),
    secret: t("Sa m\xE9moire contient encore la liste des employ\xE9s du d\xE9p\xF4t. Le dernier badge enregistr\xE9 est celui du p\xE8re de Doran.")
  },
  rampeur: {
    origine: t("Une b\xEAte des piliers, n\xE9e dans les eaux chaudes des pompes noy\xE9es. Elle mange la rouille."),
    conseil: t("Il se r\xE9g\xE9n\xE8re \xE0 chaque tour : ne le laisse pas souffler, finis-le vite."),
    secret: t("Les Rampeurs ne mangent que la rouille des piliers qui vont c\xE9der. Les fouilleurs les suivent pour savoir o\xF9 ne pas marcher.")
  },
  pilleur: {
    origine: t("Un fouilleur sans licence. La plupart descendent pour nourrir une famille, quelques-uns pour le march\xE9 noir."),
    conseil: t("Vengeur : si tu abats son alli\xE9, il frappe double au tour suivant. Abats-le en premier."),
    secret: t("Les pilleurs ont leur propre mur des noms, plus bas, \xE0 \u22122. Brac y a grav\xE9 le sien deux fois.")
  },
  sauvage: {
    origine: t("Un greff\xE9 sans Clinique ni Lecture : une brisure achet\xE9e au march\xE9 noir, et un penchant qui n\u2019est pas le sien."),
    conseil: t("Vengeur, comme les pilleurs : quand il est en groupe, c\u2019est lui qu\u2019il faut viser d\u2019abord."),
    secret: t("Une Lecture bien faite gu\xE9rit la plupart des Sauvages. La Clinique du district en a d\xE9j\xE0 sauv\xE9 plusieurs.")
  },
  confluence: {
    origine: t("Des empreintes m\xEAl\xE9es, coll\xE9es autour d\u2019une seule voix. Elle cherche quelque chose, toujours plus bas."),
    conseil: t("Elle se r\xE9g\xE9n\xE8re et appelle un Rampeur \xE0 mi-vie : garde de quoi finir le renfort sans la laisser remonter."),
    secret: t("La voix autour de qui les autres se sont coll\xE9es ne dit qu\u2019un mot : \xAB Compte. \xBB")
  },
  brigadier: {
    origine: t("Un soldat des Brigades du Serment de Veyr, la garde de la Maison Ors\xE8ve dans les Strates."),
    conseil: t("Furie : sous la moiti\xE9 de ses PV, il frappe beaucoup plus fort. Ach\xE8ve-le d\u2019un coup."),
    secret: t("Les brigadiers pr\xEAtent serment sur une empreinte de la Maison. Certains r\xE9citent, en combat, un serment qui n\u2019est pas le leur.")
  },
  "echo-veilleur": {
    origine: t("Le r\xE9manent d\u2019un Veilleur mort en service, qui fait encore sa ronde dans les salles closes."),
    conseil: t("F\xEAlures cach\xE9es, et il prend la lign\xE9e de la derni\xE8re carte qui le frappe : varie tes coups, et termine par celle qu\u2019il craint."),
    secret: t("Les r\xE9manents de veilleurs connaissent encore les mots de passe des Veilleurs de S\xE9dime. Tobin les a tous not\xE9s.")
  },
  "sentinelle-verre": {
    origine: t("Une machine de ceux d\u2019avant, en verre tremp\xE9, qui garde les portes rondes."),
    conseil: t("\xC9pines : chaque coup te co\xFBte un peu. Pr\xE9f\xE8re quelques gros coups, et m\xE9fie-toi de ses rayons sur les G\xE9n\xE9s."),
    secret: t("Les sentinelles ne s\u2019allument que si quelqu\u2019un approche d\u2019une porte entrouverte. Elles prot\xE8gent ceux qui sont dedans.")
  },
  "gardien-registres": {
    origine: t("Le gardien des salles closes. Il fait l\u2019appel de ceux qui sont pass\xE9s, et attend qu\u2019ils reviennent."),
    conseil: t("Blind\xE9, il appelle un brigadier \xE0 la barre \xE0 mi-vie : garde tes plus gros coups pour la seconde phase."),
    secret: t("Il ne garde pas des cristaux. Il garde le registre de tous ceux qui sont descendus, ouvriers de 2066 compris.")
  },
  double: {
    origine: t("Un souvenir d\xE9doubl\xE9 : la m\xEAme personne, dans deux versions de sa vie qui se contredisent."),
    conseil: t("Il revient plus petit quand il tombe, et change de lign\xE9e : garde de quoi finir son rejeton."),
    secret: t("Les Doubles ne se battent pas entre eux. Chacun croit que l\u2019autre est le faux.")
  },
  "essaim-ambre": {
    origine: t("Des insectes n\xE9s dans l\u2019ambre de la Ruche. Ils gardent les tables grav\xE9es comme une reine."),
    conseil: t("Ses piq\xFBres touchent toute l\u2019escouade et il revient plus petit : un bouclier d\u2019escouade vaut mieux qu\u2019un soin."),
    secret: t("L\u2019ambre ne vient pas des insectes : il remonte des empreintes que la Ruche couve.")
  },
  "automate-graveur": {
    origine: t("Une machine de ceux d\u2019avant, qui grave les tables. Elle continue, m\xEAme quand plus personne ne lit."),
    conseil: t("Blind\xE9, il vise les R\xE9sonants puis se polit : frappe fort, et ne lui laisse pas le temps de se soigner."),
    secret: t("Les automates graveurs ne gravent qu\u2019une phrase : \xAB Que celui qui lit ceci compte les voix qu\u2019il porte. \xBB")
  },
  tisseuse: {
    origine: t("Elle tisse des souvenirs, vrais ou \xE0 venir, et garde les noms que les tables ont perdus."),
    conseil: t("\xC9pines, et un essaim \xE0 mi-vie : pr\xE9f\xE8re quelques gros coups, et garde un soin pour la fin."),
    secret: t("Elle a donn\xE9 son propre nom \xE0 quelqu\u2019un, il y a tr\xE8s longtemps, pour qu\u2019il se souvienne d\u2019elle. Elle croit qu\u2019il l\u2019a oubli\xE9e.")
  },
  "premier-porteur": {
    origine: t("Bien apr\xE8s les autres, un seul est redescendu jusqu\u2019au premier puits. Il n\u2019y porte qu\u2019une voix : celle du premier d\u2019entre eux, l\u2019auteur de la mise en garde."),
    conseil: t("F\xEAlures cach\xE9es, et il rappelle son double \xE0 mi-vie : la suite est la seule fa\xE7on de le toucher pleinement."),
    secret: t("Sous la mise en garde, il a grav\xE9 une ligne plus r\xE9cente : \xAB Les voix ne nous ont pas pris, elles nous ont gard\xE9s. \xBB")
  }
};

// src/core/campagne.ts
var PERSONNAGES = {
  yse: { nom: t("Ys\xE9"), role: t("Archiviste des Veilleurs"), couleur: "var(--or)" },
  hald: { nom: t("Capitaine Hald"), role: t("Garde des Hauts"), couleur: "var(--reso)" },
  tobin: { nom: t("Tobin"), role: t("Fouilleur des Veilleurs"), couleur: "var(--ivory)" },
  brac: { nom: t("Brac"), role: t("Pilleur de Strates"), couleur: "var(--tech)" },
  isaure: { nom: t("Dame Isaure Ors\xE8ve"), role: t("Maison Ors\xE8ve, les Hauts"), couleur: "var(--reso)" }
};
var ACTES = { 1: t("Acte I \xB7 La chambre"), 2: t("Acte II \xB7 Les salles closes"), 3: t("Acte III \xB7 Ceux d\u2019avant"), 4: t("\xC9pilogue") };
var acteDe = (strate) => strate <= 3 ? 1 : strate <= 6 ? 2 : 3;
var ROMAIN = { 1: "I", 2: "II", 3: "III" };
var present = (id) => (c2) => c2.presents.includes(id);
var absent = (id) => (c2) => !c2.presents.includes(id);
var garde = (g) => (c2) => c2.actes.chambre === g;
var lecture = (l) => (c2) => c2.actes.lecture === l;
var fin = (f) => (c2) => c2.actes.fin === f;
var souvenir = (f) => (c2) => !!c2.drapeaux?.includes(f);
var souv = (f) => ({ si: souvenir(f), souvenir: f });
var lentille = (p) => (c2) => pisteFinale(c2.choixHaltes) === p;
var entree = (strate, titre, recit, repliques, apres) => ({
  id: `entree-${strate}`,
  acte: acteDe(strate),
  sur: t`${ROMAIN[acteDe(strate)]} · STRATE −${strate}`,
  titre,
  image: { strate },
  recit,
  repliques,
  quand: (c2) => c2.strate >= strate && (!apres || apres(c2))
});
var apresGardien = (strate, boss, titre, recit, repliques) => ({
  id: `gardien-${strate}`,
  acte: acteDe(strate),
  sur: t`${ROMAIN[acteDe(strate)]} · GARDIEN DE LA STRATE −${strate}`,
  titre,
  image: { ennemi: boss },
  recit,
  repliques,
  quand: (c2) => c2.vaincue >= strate
});
var SCENES = [
  // ---------- Acte I · La chambre (Les Seuils, la Confluence) ----------
  apresGardien(
    1,
    "confluence",
    t("Elle n\u2019est pas morte"),
    t("La Confluence se d\xE9fait sous vos coups. Ses empreintes ne s\u2019\xE9teignent pas : elles coulent dans les fissures du sol, comme de l\u2019eau qui trouve sa pente."),
    [
      { qui: "vela", texte: t("Elle n\u2019est pas morte. Elle est descendue. Elle cherche quelque chose, plus bas.") },
      { qui: "doran", texte: t("Par l\xE0, il n\u2019y a que les couloirs qu\u2019on a mur\xE9s en 2066. Enfin, il n\u2019y avait.") },
      { qui: "ilka", texte: t("Un monstre fait de morts m\xE9lang\xE9s, qui conna\xEEt nos tunnels mieux que nous. Parfait.") },
      { qui: "ilka", texte: t("Et mes jambes se sont bloqu\xE9es. Une seconde, quand elle s\u2019est lev\xE9e. \xC7a ne leur \xE9tait jamais arriv\xE9. Ne me regardez pas comme \xE7a, c\u2019est rien."), ecran: { v: "\u2022" } },
      { qui: "doran", texte: t("Et regardez par terre : des traces de bottes, toutes fra\xEEches. Quelqu\u2019un est pass\xE9 avant nous.") },
      { qui: "doran", texte: t("Et \xE7a. Sous les pompes, des pieds nus, mouill\xE9s, qui sortent de l\u2019eau. Ceux-l\xE0 ne descendent pas. Ils montent."), charniere: 1 },
      { qui: "vela", texte: t("Je n\u2019entends personne.") },
      { qui: "ilka", texte: t("Au march\xE9, ils disent que tu descends chercher l\u2019\xC9cluse : le truc de ceux d\u2019avant pour retenir la mer. Dis-moi que tu y crois un peu.") },
      { qui: "doran", texte: t("Les pompes ont tourn\xE9 quatorze heures cette nuit. \xC9cluse ou pas, la mer ne nous attendra pas.") },
      { qui: "doran", texte: t("Si ta mesure de la marche arrive chez les Veilleurs, les Fondations finiront par l\u2019apprendre. Elles couperont des pompes pour inspecter. Les n\xF4tres d\u2019abord. Celles des Hauts, jamais."), ...souv("mesure-marche") }
    ]
  ),
  entree(
    2,
    t("Les couloirs mur\xE9s"),
    t("Au retour, la chambre aux empreintes \xE9tait \xE0 moiti\xE9 vide. Ys\xE9 t\u2019attend au bord, appuy\xE9e sur sa canne : elle n\u2019ira pas plus loin. Des traces de bottes s\u2019enfoncent vers la Strate \u22122, les Abris mur\xE9s. Tes creuseurs viennent d\u2019en d\xE9gager l\u2019acc\xE8s."),
    [
      { qui: "yse", texte: t("Des pilleurs. Ils ont pris les cristaux de la chambre pendant que Vertiga dormait. S\u2019ils partent au march\xE9 noir, on ne les reverra jamais.") },
      { qui: "doran", texte: t("Ils sont pass\xE9s par l\u2019ancien puits d\u2019a\xE9ration. Je connais le chemin. Mon p\xE8re le connaissait mieux.") },
      { qui: "vela", texte: t("Les cristaux qu\u2019ils emportent ont peur. Je les entends d\u2019ici. Et la Confluence les entend aussi.") },
      { qui: "ilka", texte: t("Alors on court. Pour une fois, c\u2019est moi qui donne le rythme.") }
    ]
  ),
  apresGardien(
    2,
    "confluence",
    t("Brac"),
    t("Au fond de la Strate, des sacs \xE9ventr\xE9s et des cristaux \xE9teints. La Confluence les a trouv\xE9s avant vous, et elle a grossi. Dans un recoin, un pilleur tremble."),
    [
      { qui: "brac", texte: t("Je m\u2019appelle Brac. Je ne les ai pas vol\xE9es, directeur. Elles me l\u2019ont demand\xE9. Toute la nuit, elles m\u2019ont demand\xE9 de les emmener plus bas. Jusqu\u2019o\xF9, je n\u2019en sais rien. Plus bas que tout ce que j\u2019ai fouill\xE9.") },
      { qui: "brac", texte: t("Elles r\xE9p\xE9taient un mot. \xAB Ossyra. \xBB J\u2019ai cru que c\u2019\xE9tait un endroit, quelque part en dessous. Je voulais seulement les y conduire."), charniere: 2 },
      { qui: "vela", texte: t("Il dit vrai. Les empreintes de la chambre veulent descendre. Je ne sais pas pourquoi. Ce mot, je l\u2019entends aussi, et je ne le comprends pas mieux que lui. Je sais seulement qu\u2019elles ont peur de rester en haut.") },
      { qui: "vela", texte: t("Le petit cristal qu\u2019on a laiss\xE9 rouler dans l\u2019abri de 2060. Il est l\xE0, avec les autres. Il est arriv\xE9 avant nous."), ...souv("cristal-libre") },
      { qui: "hald", texte: t("Capitaine Hald, de la garde des Hauts. Cette fouille est suspendue. Ce qui brille ici rel\xE8ve des Hauts.") },
      { qui: "ilka", texte: t("On vient de se battre pour \xE7a, capitaine. Vous, vous venez d\u2019arriver.") },
      { qui: "hald", texte: t("Votre directeur d\xE9cidera. En attendant, mes soldats suivent la Confluence. Avec ou sans vous.") },
      { qui: "hald", texte: t("Les Hauts ont leurs raisons d\u2019\xEAtre press\xE9s. Depuis la nuit o\xF9 vous avez ouvert la chambre, deux des leurs ne savent plus leur propre nom.") },
      { qui: "ilka", texte: t("Encore. Quand V\xE9la a touch\xE9 les cristaux de Brac, mes jambes se sont arr\xEAt\xE9es net. Pas une panne : elles ont attendu. Comme on attend la fin d\u2019une phrase."), ecran: { v: "" } }
    ]
  ),
  entree(
    3,
    t("Dans le noir"),
    t("\xC0 la Strate \u22123, loin du Puits Z\xE9ro et de ses rampes de visite, aucune lampe humaine ne s\u2019est jamais arr\xEAt\xE9e longtemps. Tous les puits de Vertiga y d\xE9bouchent. Les Brigades de la capitaine Hald y sont entr\xE9es hier, par le leur ; aucune patrouille n\u2019est remont\xE9e."),
    [
      { qui: "nuit", texte: t("Nuit, \xE9claireuse des Veilleurs. Le noir n\u2019est pas vide. Les soldats de Hald sont vivants : je les entends respirer, loin, en bas."), si: present("nuit") },
      { qui: "vela", texte: t("Les soldats sont vivants. Je les sens, loin en bas, serr\xE9s les uns contre les autres."), si: absent("nuit") },
      { qui: "doran", texte: t("La Confluence s\u2019est arr\xEAt\xE9e quelque part en dessous. Elle a fini de chercher.") },
      { qui: "vela", texte: t("Elle a trouv\xE9. C\u2019est pire.") },
      { qui: "ilka", texte: t("Un monstre qui a trouv\xE9 ce qu\u2019il cherchait. Moi, je veux savoir quoi.") },
      { qui: "ilka", texte: t("Dans le noir, il y a une petite lumi\xE8re qui clignote sur ma cheville. Pas au hasard. Elle compte."), ecran: { v: "\u2022", anim: "clignote" } }
    ]
  ),
  apresGardien(
    3,
    "confluence",
    t("Une seule voix"),
    t("La Confluence s\u2019effondre pour de bon. De son c\u0153ur roule un cristal minuscule, net comme une goutte d\u2019eau. Une seule voix y parle, tr\xE8s calme."),
    [
      { qui: "vela", texte: t("Elle ne r\xE9p\xE8te plus qu\u2019un mot : \xAB Compte. \xBB Je crois que c\u2019\xE9tait la premi\xE8re voix, celle autour de qui les autres se sont coll\xE9es. Compter quoi, je n\u2019en sais rien."), charniere: 3 },
      { qui: "ilka", texte: t("Ma cheville a arr\xEAt\xE9 de clignoter quand elle a dit ce mot. D\u2019un coup. Comme si elle avait entendu."), ecran: { v: "" } },
      { qui: "doran", texte: t("Les patrouilles de la capitaine sont sauves. Elles \xE9taient coinc\xE9es sous un \xE9boulement. Elles nous doivent la vie.") },
      { qui: "doran", texte: t("Tu as laiss\xE9 la lanterne \xE0 son clou, l\xE0-haut. Les fouilleurs l\u2019apprendront. Chez nous, \xE7a vaut plus qu\u2019un \xC9clat."), ...souv("clou-respecte") },
      { qui: "hald", texte: t("Mes patrouilles ont trouv\xE9 une fl\xE8che \xE0 la craie, la bonne, avec une date. C\u2019\xE9tait vous. Je ne l\u2019oublierai pas, directeur."), ...souv("craie-hald") },
      { qui: "hald", texte: t("Quelqu\u2019un a d\xE9gag\xE9 le haut de notre \xE9boulis. On a entendu qu\u2019on venait. C\u2019est ce qui a tenu mes hommes."), si: (c2) => !!c2.drapeaux?.includes("eboulis") && !c2.drapeaux.includes("craie-hald"), souvenir: "eboulis" },
      { qui: "hald", texte: t("Les Hauts vous remercient, directeur. La Maison Ors\xE8ve, que je sers, vous demande \xE0 pr\xE9sent de lui confier la chambre.") },
      { qui: "tobin", texte: t("Tobin, des Veilleurs de S\xE9dime. Directeur, ne la donnez \xE0 personne avant qu\u2019on ait compris ce qu\u2019elle contient. Je vous en prie.") },
      { qui: "ilka", texte: t("Et le quartier attend que tu dises qu\u2019elle est \xE0 nous. \xC0 toi de trancher, directeur.") }
    ]
  ),
  // ---------- Acte II · Les salles closes (le Gardien des registres) ----------
  entree(
    4,
    t("Ferm\xE9es de l\u2019int\xE9rieur"),
    t("Sous la Galerie aux lueurs commencent les salles closes : des portes rondes, verrouill\xE9es de l\u2019int\xE9rieur. Plus bas, \xE0 la Strate \u22126, l\u2019acc\xE8s du niveau 7, mur\xE9 en 2066 apr\xE8s ce que l\u2019ordre de service appelle \xAB l\u2019incident du 14 \xBB."),
    [
      { qui: "doran", texte: t("L\u2019ordre de service de la chambre porte le tampon de l\u2019\xE9quipe de mon p\xE8re. Ils ont mur\xE9 quelque chose, plus bas, en 2066. Je veux savoir quoi.") },
      { qui: "hald", texte: t("Mes Brigades ouvrent la marche, comme convenu. Vous suivez, et vous ne touchez \xE0 rien."), si: garde("orseve") },
      { qui: "hald", texte: t("Le district a choisi de garder la chambre. Les salles closes, ce sera nous. Ne vous trouvez pas sur notre chemin."), si: garde("district") },
      { qui: "tobin", texte: t("Les Veilleurs descendent avec vous. On note tout. M\xEAme ce qui nous fait peur. Surtout \xE7a."), si: garde("commission") },
      { qui: "kessa", texte: t("Kessa, plongeuse aux pompes. Mes parents ont mu\xE9 pour ces couloirs-l\xE0. Moi, je suis n\xE9e comme \xE7a. Je n\u2019en ai jamais vu le bout. Ce sera le bon jour."), si: present("kessa") },
      { qui: "sasha", texte: t("J\u2019ai regard\xE9 tes jambes cette nuit, Ilka. Il y a le verrou de ta compagnie, \xE7a, je connais. Et il y a autre chose : une ligne que personne n\u2019a \xE9crite chez nous, sign\xE9e d\u2019une date. 2033. Elle ne coupe rien. Elle \xE9coute.") },
      { qui: "vela", texte: t("Derri\xE8re ces portes, quelqu\u2019un a rang\xE9 les cristaux avec soin. Comme on range une chambre avant de partir pour de bon."), charniere: 4 }
    ],
    (c2) => !!c2.actes.chambre
  ),
  apresGardien(
    4,
    "gardien-registres",
    t("L\u2019appel"),
    t("Le Gardien des registres recule derri\xE8re une porte ronde et la referme sur lui. Avant de dispara\xEEtre, il a lu une liste de noms, lentement, d\u2019une voix de pierre."),
    [
      { qui: "doran", texte: t("Trois noms. Ivens, Daro, et le dernier, celui de mon p\xE8re. Les trois qu\u2019on n\u2019a jamais barr\xE9s au mur des fouilleurs.") },
      { qui: "vela", texte: t("Il ne nous mena\xE7ait pas. Il faisait l\u2019appel. Comme s\u2019il attendait que ceux de la liste reviennent.") },
      { qui: "ilka", texte: t("Mon \xE9cran de diagnostic vient de s\u2019allumer tout seul. Une phrase, pas un code : \xAB Si quelqu\u2019un lit ceci, combien de temps a pass\xE9 ? \xBB Sasha, dis-moi que c\u2019est une blague."), ecran: { v: "?" } },
      { qui: "sasha", texte: t("Ce n\u2019est pas moi. Cette phrase n\u2019est dans aucun manuel.") },
      { qui: "ilka", texte: t("Des gens qui ont mur\xE9 une porte il y a cinquante-cinq ans, et un gardien qui les attend encore. Je d\xE9teste cet \xE9tage.") },
      { qui: "doran", texte: t("Il m\u2019a regard\xE9 en lisant le nom de mon p\xE8re. Il sait que j\u2019ai promis. Il attend de voir si je tiens parole."), ...souv("promesse-cristal") }
    ]
  ),
  entree(
    5,
    t("Les Berceaux vides"),
    t("Plus bas, des niches de cristal en treillis, toutes ouvertes. Quelqu\u2019un est pass\xE9 avant vous, avec des outils propres et des sceaux de cire blanche."),
    [
      { qui: "aurel", texte: t("Aurel. Ors\xE8ve, si vous tenez au nom entier. Ces sceaux sont ceux de ma famille. La Maison vide les Berceaux depuis des ann\xE9es. Je l\u2019ai vu enfant, sans comprendre ce que je voyais."), si: present("aurel") },
      { qui: "doran", texte: t("De la cire blanche. Les Hauts. Ils sont pass\xE9s avant nous, et ils n\u2019ont rien laiss\xE9."), si: absent("aurel") },
      { qui: "hald", texte: t("Ce que la Maison emporte ne vous regarde pas, directeur. Vous avez sign\xE9."), si: garde("orseve") },
      { qui: "hald", texte: t("Vous ne resterez pas dans ces salles plus longtemps que nous. Mes ordres sont de tout sceller."), si: garde("district") },
      { qui: "tobin", texte: t("J\u2019ai compt\xE9 les niches vides : trente-deux. Pas une seule de ces empreintes n\u2019est arriv\xE9e chez les Veilleurs."), si: garde("commission") },
      { qui: "tobin", texte: t("La page du registre que vous avez arrach\xE9e, on l\u2019a lue toute la nuit. Des gestes, ligne apr\xE8s ligne. Les noms n\u2019arrivent qu\u2019\xE0 la fin, en 2066. Le Gardien ne garde personne : il garde ce qu\u2019on savait faire."), ...souv("page-arrachee") },
      { qui: "vela", texte: t("Celles qui restent se sont serr\xE9es les unes contre les autres. Elles ont froid.") },
      { qui: "doran", texte: t("Le Gardien est en dessous. Il garde ce qu\u2019il reste. Je commence \xE0 le comprendre.") }
    ]
  ),
  apresGardien(
    5,
    "gardien-registres",
    t("L\u2019inventaire"),
    t("Cette fois, le Gardien a appel\xE9 un brigadier \xE0 la barre. Le soldat s\u2019est battu en r\xE9citant un serment qui n\u2019\xE9tait pas le sien. Dans la poche de son uniforme, un inventaire."),
    [
      { qui: "ilka", texte: t("Un inventaire de Berceaux, sign\xE9 en entier, cette fois : \xAB I. Ors\xE8ve \xBB. Plus besoin de deviner.") },
      { qui: "aurel", texte: t("Dame Isaure. Ma tante. C\u2019est elle qui tient le Registre des Vierges. Elle ne descend jamais : elle envoie les autres."), si: present("aurel") },
      { qui: "aurel", texte: t("Mon cousin Th\xE9odric ne sait plus son nom depuis trois semaines. Il signe celui du fondateur. L\xE0-haut, on dit qu\u2019il est fatigu\xE9.") },
      { qui: "ilka", texte: t("Quand Aurel parle, mon \xE9cran affiche un chiffre : 2. Quand il se tait, il revient \xE0 1. Je ne sais pas ce que \xE7a compte. Mais \xE7a compte sur nous."), ecran: { v: "2" } },
      { qui: "sasha", texte: t("J\u2019ai trouv\xE9 ton 2. Aurel porte une empreinte : lui, plus elle, \xE7a fait deux voix. Ton \xE9cran compte les R\xE9sonants, c\u2019est tout. Un capteur de s\xE9rie, mal r\xE9gl\xE9."), charniere: 5 },
      { qui: "ilka", texte: t("Donc ce n\u2019est rien. Tant mieux.") },
      { qui: "doran", texte: t("Un inventaire. Chez nous, on dit \xAB sous contrat \xBB. J\u2019en ai sign\xE9 un, pour ma mue : \xAB Quinze ans sous l\u2019eau, et vous ressortez libre. \xBB Personne ne m\u2019a dit libre de quoi.") },
      { qui: "vela", texte: t("Isaure Ors\xE8ve. Une grande famille des Hauts. Elle ne descend jamais : elle envoie les autres."), si: absent("aurel") },
      { qui: "vela", texte: t("Le brigadier ne savait plus pourquoi il se battait. Le Gardien lui avait pr\xEAt\xE9 une voix. Il y en a beaucoup trop, ici, des voix.") },
      { qui: "aurel", texte: t("J\u2019ai vu le premier relev\xE9 du fondateur, dans la niche 5-1. Il ne ressemble pas \xE0 ma tante. Il ne me ressemble pas non plus."), si: (c2) => c2.presents.includes("aurel") && !!c2.drapeaux?.includes("niche-fondateur"), souvenir: "niche-fondateur" },
      { qui: "doran", texte: t("Plus qu\u2019un \xE9tage avant le niveau 7. Celui que mon p\xE8re a ferm\xE9.") }
    ]
  ),
  entree(
    6,
    t("Le niveau 7"),
    t("La Strate \u22126 s\u2019ouvre sur un mur de b\xE9ton coul\xE9 \xE0 la h\xE2te, couvert de tampons de 2066. Derri\xE8re, quelqu\u2019un pleure. Il n\u2019y a personne."),
    [
      { qui: "liane", texte: t("Liane. Ors\xE8ve, avant qu\u2019on m\u2019efface. Je connais ces pleurs. Les Berceaux qu\u2019on vide font ce bruit-l\xE0. Dans les Hauts, on met de la musique pour ne pas l\u2019entendre."), si: present("liane") },
      { qui: "doran", texte: t("Le chantier comptait le pied de la Tour comme niveau 1. Le niveau 7, c\u2019est ici.") },
      { qui: "doran", texte: t("Mon p\xE8re n\u2019a jamais parl\xE9 de cette nuit. Il n\u2019a dit qu\u2019une phrase : \xAB On a ferm\xE9 la porte, mais pas de notre c\xF4t\xE9. \xBB Je n\u2019ai jamais su ce qu\u2019il voulait dire."), charniere: 6 },
      { qui: "vela", texte: t("Le Gardien des registres est derri\xE8re ce mur. Il prot\xE8ge ce qui pleure. Il faudra passer par lui.") },
      { qui: "ilka", texte: t("Alors on casse le mur que ton p\xE8re a construit, Doran. D\xE9sol\xE9e.") },
      { qui: "doran", texte: t("Ne t\u2019excuse pas. Il aurait voulu qu\u2019on sache.") }
    ]
  ),
  apresGardien(
    6,
    "gardien-registres",
    t("Ce qui pleurait"),
    t("Le Gardien des registres s\u2019efface en refermant son livre. Derri\xE8re lui, une salle intacte : des dizaines de cristaux d\u2019un m\xEAme \xEAtre, rang\xE9s en cercle. C\u2019est d\u2019eux que venaient les pleurs."),
    [
      { qui: "vela", texte: t("C\u2019est le m\xEAme, partout. Mais chaque cristal se souvient d\u2019une autre vie. Il pleure parce qu\u2019il ne sait plus laquelle est la sienne.") },
      { qui: "doran", texte: t("En 2066, les ouvriers l\u2019ont entendu, et ils ont eu peur. Pas d\u2019un monstre : d\u2019une question.") },
      { qui: "vela", texte: t("Je peux le lire jusqu\u2019au bout et savoir ce qu\u2019ils ont cach\xE9, tous. Mais je ne sais pas ce qui restera de moi apr\xE8s.") },
      { qui: "ilka", texte: t("Mon \xE9cran, maintenant. Une liste. V\xE9la : 2. Aurel : 2. Liane : 1. Et une ligne en bas : \xAB D\xE9rive en hausse depuis l\u2019ouverture de la chambre. \xBB Quelque chose fait des comptes sur nous, directeur. Et \xE7a s\u2019inqui\xE8te."), ecran: { v: "\u2261" } },
      { qui: "vela", texte: t("Quand tu as pos\xE9 la main sur le mur, ils se sont calm\xE9s. Ils ont compris qu\u2019on venait pour eux, pas contre eux."), ...souv("main-posee") },
      { qui: "doran", texte: t("Le cristal de mon p\xE8re est \xE0 sa place, dans le cercle. Le Gardien l\u2019a regard\xE9 avant de s\u2019effacer. Il a ferm\xE9 son livre comme on ferme une affaire."), ...souv("cristal-rendu") },
      { qui: "doran", texte: t("Le cristal de mon p\xE8re est toujours dans ma poche. Il ne pleure pas. Il attend, comme mon p\xE8re attendait."), ...souv("cristal-garde") },
      { qui: "ilka", texte: t("Directeur. C\u2019est toi qui d\xE9cides. Et c\u2019est elle qui paie.") }
    ]
  ),
  {
    id: "convocation",
    acte: 2,
    sur: t("II \xB7 LA CONVOCATION"),
    titre: t("Une lettre des Hauts"),
    image: { intro: "07-ascension" },
    recit: t("Le lendemain, une lettre scell\xE9e de cire blanche t\u2019attend sur ton bureau qui fuit. Le papier sent le jardin et la pluie propre."),
    quand: (c2) => !!c2.actes.lecture,
    repliques: [
      { qui: "isaure", texte: t("Directeur. Votre escouade est descendue plus bas que nos Brigades. Les Hauts savent reconna\xEEtre le talent, m\xEAme quand il vient d\u2019en bas.") },
      { qui: "isaure", texte: t("Vous direz \xE0 Vertiga que tout va bien chez nous. Tout va bien. Je l\u2019\xE9cris deux fois, je le vois bien. Ma main l\u2019\xE9crit deux fois.") },
      { qui: "isaure", texte: t("Vous avez quelque chose qui m\u2019appartient, directeur. Un carnet. Je ne vous le r\xE9clame pas. Je vous le signale."), ...souv("carnet-isaure") },
      { qui: "isaure", texte: t("La Fl\xE8che d\u2019amarrage accueillera votre escouade. L\u2019escouade qui tient son sommet quand une \xEEle passe est re\xE7ue l\xE0-haut. Ce sont nos usages depuis les Accords.") },
      { qui: "vela", texte: t("Elle sait ce que j\u2019ai lu. Je ne sais pas comment, mais elle le sait. C\u2019est pour \xE7a qu\u2019elle nous veut pr\xE8s d\u2019elle."), si: lecture("autoriser") },
      { qui: "vela", texte: t("Elle croit que j\u2019ai lu les cristaux. Elle pr\xE9f\xE8re nous avoir sous les yeux."), si: lecture("refuser") },
      { qui: "aurel", texte: t("Ma tante n\u2019invite jamais : elle convoque. Monte, si tu veux. Mais monte en sachant qu\u2019elle te regarde."), si: present("aurel") },
      { qui: "yse", texte: t("Les quais de la Fl\xE8che s\u2019ouvriront au passage de la prochaine \xEEle. D\u2019ici l\xE0, les Strates ne t\u2019ont pas tout dit. Descends encore.") }
    ]
  },
  // ---------- Acte III · Ceux d'avant (la Tisseuse, puis le Premier Porteur) ----------
  entree(
    7,
    t("Deux passerelles"),
    t("Sous les salles closes, les m\xE9moires se contredisent. Entre les deux passerelles, sur la pierre, une ligne d\u2019eau grav\xE9e, puis une autre plus haut, puis des dizaines, l\u2019une au-dessus de l\u2019autre."),
    [
      { qui: "doran", texte: t("Ils regravaient leur ligne plus haut. Chaque fois un peu plus haut.") },
      { qui: "ilka", texte: t("Et pas un mot dessous. Pas une date, pas un nom.") },
      { qui: "ilka", texte: t("Je me souviens de la passerelle qui a c\xE9d\xE9. Ici, je m\u2019en souviens deux fois. Une fois, quelqu\u2019un plonge. L\u2019autre fois, personne.") },
      { qui: "doran", texte: t("Accroche-toi \xE0 celle o\xF9 quelqu\u2019un plonge. C\u2019est la tienne. Les autres, on te les pr\xEAte.") },
      { qui: "vela", texte: t("Depuis la lecture, j\u2019entends tout en double. Restez pr\xE8s de moi. Si je me trompe de souvenir, dites-le-moi."), si: lecture("autoriser") },
      { qui: "vela", texte: t("Mon empreinte tient bon. Mais quelque chose, ici, tisse des souvenirs. Et il nous a remarqu\xE9s."), si: (c2) => c2.actes.lecture !== "autoriser" }
    ],
    (c2) => !!c2.actes.lecture
  ),
  apresGardien(
    7,
    "tisseuse",
    t("Un avenir"),
    t("La Tisseuse de souvenirs se d\xE9noue fil par fil et s\u2019enfuit dans les fissures. Avant de partir, elle vous a montr\xE9 un souvenir : une ville engloutie, et personne pour s\u2019en \xE9tonner."),
    [
      { qui: "ilka", texte: t("C\u2019\xE9tait faux. Hein ? C\u2019\xE9tait faux.") },
      { qui: "vela", texte: t("Tes deux relev\xE9s de la ligne d\u2019eau sont justes tous les deux. Elle coud les murs comme elle coud les souvenirs."), ...souv("deux-releves") },
      { qui: "doran", texte: t("Ta ligne est la plus haute du mur, maintenant, et la plus profonde. Pourvu qu\u2019on n\u2019ait jamais \xE0 en graver une autre."), ...souv("ligne-gravee") },
      { qui: "ilka", texte: t("Tout \xE0 l\u2019heure, j\u2019ai pris la passerelle cass\xE9e. La vraie. Je pr\xE9f\xE8re mes souvenirs avec le trou dedans."), ...souv("vraie-rive") },
      { qui: "vela", texte: t("Ce n\u2019\xE9tait pas un souvenir. C\u2019\xE9tait un avenir. Elle tisse aussi avec ce qui pourrait arriver.") },
      { qui: "ilka", texte: t("Pendant qu\u2019elle tissait, mon \xE9cran a \xE9crit tout seul : \xAB Op\xE9rateur autoris\xE9 ? Non. Demande d\u2019aide. \xBB Ma jambe demande de l\u2019aide, directeur."), ecran: { v: "!" } },
      { qui: "sasha", texte: t("J\u2019ai suivi le signal. Il ne vient pas de ta compagnie. Il monte d\u2019en dessous, par un c\xE2ble mur\xE9 en 2101, sous un pilier de l\u2019ouest."), charniere: 7 },
      { qui: "ilka", texte: t("Ton capteur mal r\xE9gl\xE9, Sasha. Il vient d\u2019\xE9crire une ligne de plus : \xAB Ilka : 2 \xBB. Je n\u2019ai pas d\u2019empreinte. Alors qui est le deuxi\xE8me ?"), ecran: { v: "2" } },
      { qui: "sasha", texte: t("Je ne sais pas. Je te jure que je ne sais pas.") },
      { qui: "doran", texte: t("Leur mur s\u2019arr\xEAte \xE0 la derni\xE8re rayure. Ils ont arr\xEAt\xE9 de graver. Ou ils n\u2019ont plus eu de mur.") },
      { qui: "tobin", texte: t("Directeur ! Une \xE9quipe des Veilleurs est descendue \xE0 la Ruche d\u2019ambre, juste en dessous, il y a un mois. Elle n\u2019est jamais remont\xE9e.") }
    ]
  ),
  entree(
    8,
    t("Les Veilleurs perdus"),
    t("La Strate \u22128 garde des traces de campement : des lampes \xE0 algues \xE9teintes, des carnets ouverts, des couvertures pli\xE9es. Les Veilleurs ne sont pas partis. Ils sont encore l\xE0, quelque part dans un souvenir."),
    [
      { qui: "tobin", texte: t("Ils ont relev\xE9 les tables grav\xE9es. Regardez : des noms, puis de moins en moins de noms, puis seulement des empreintes. Ils ont arr\xEAt\xE9 d\u2019\xE9crire au milieu d\u2019une ligne.") },
      { qui: "vela", texte: t("La Tisseuse les garde dans un souvenir heureux. Ils ne veulent pas en sortir. Je les comprends un peu.") },
      { qui: "joss", texte: t("Joss, du quartier. Les gens qu\u2019on retient avec de beaux souvenirs, on ne les sauve pas en criant. On leur rappelle un vrai d\xE9tail. Laissez-moi faire."), si: present("joss") },
      { qui: "tobin", texte: t("Ce n\u2019est pas la premi\xE8re \xE9quipe qu\u2019on perd ici. Il y a des ann\xE9es, de la Ruche d\u2019ambre, une seule fouilleuse est remont\xE9e. Elle tenait un \xE9clat de table. On l\u2019a mis sous cl\xE9.") },
      { qui: "ilka", texte: t("Cette fois, on les ram\xE8ne tous. Pas de discussion.") }
    ]
  ),
  apresGardien(
    8,
    "tisseuse",
    t("Un vrai d\xE9tail"),
    t("Le souvenir se d\xE9chire. Les Veilleurs s\u2019\xE9veillent un \xE0 un, affam\xE9s, frigorifi\xE9s, et vivants. La Tisseuse a fui une derni\xE8re fois vers le bas."),
    [
      { qui: "tobin", texte: t("Ils sont tous l\xE0, tous les six. Merci. Les Veilleurs ne l\u2019oublieront pas, et nous sommes tr\xE8s forts pour ne pas oublier.") },
      { qui: "ilka", texte: t("Elle parle, maintenant. Pas avec une voix : avec des mots sur mon \xE9cran, polis, d\u2019une autre \xE9poque. \xAB Bonjour. Je compte. Les v\xF4tres d\xE9rivent depuis que la chambre est ouverte. Ceux des Hauts aussi. Je peux tenir la voix principale. Il faudrait m\u2019ouvrir les implants. Tous. \xBB"), ecran: { v: "\u2261" }, charniere: 8 },
      { qui: "doran", texte: t("Ouvrir tous les implants de la ville \xE0 une voix sous un pilier. Demande-lui ce qu\u2019elle veut en \xE9change.") },
      { qui: "ilka", texte: t("Je lui ai demand\xE9. Elle a r\xE9pondu : \xAB Que quelqu\u2019un descende. Il y a tr\xE8s longtemps que j\u2019attends. \xBB") },
      { qui: "doran", texte: t("Elle ne tue personne. Elle garde. Comme le Gardien des registres.") },
      { qui: "vela", texte: t("Elle garde les noms, ceux que les tables grav\xE9es ont perdus. Elle est la derni\xE8re \xE0 s\u2019en souvenir.") },
      { qui: "tobin", texte: t("En se r\xE9veillant, ils ont vu leurs lampes rallum\xE9es. Ils ont compris tout de suite que quelqu\u2019un \xE9tait venu."), ...souv("lampes-veilleurs") },
      { qui: "tobin", texte: t("Le prix du pain, au march\xE9. C\u2019est \xE7a qui les a ramen\xE9s. Je n\u2019y aurais jamais pens\xE9."), ...souv("vrai-detail") },
      { qui: "tobin", texte: t("Votre relev\xE9 de la table de la Ruche, pos\xE9 \xE0 c\xF4t\xE9 de celui de \u22124\u2026 Les m\xEAmes tables, et plus un seul nom. Notre Doyenne, Hessa, veut le mettre sous cl\xE9. Ys\xE9 veut le publier."), ...souv("copistes") }
    ]
  ),
  {
    id: "isaure-descend",
    acte: 3,
    sur: t("III \xB7 LA RUCHE D\u2019AMBRE"),
    titre: t("Elle est descendue"),
    image: { strate: 8 },
    recit: t("Au campement des Veilleurs, pendant qu\u2019on r\xE9chauffe les rescap\xE9s, une nacelle blanche descend par le puits des Hauts. La capitaine Hald en sort la premi\xE8re. Derri\xE8re elle, une femme en manteau clair qui n\u2019a jamais pos\xE9 le pied sous la ligne bleue."),
    quand: (c2) => c2.vaincue >= 8,
    repliques: [
      { qui: "hald", texte: t("Dame Isaure Ors\xE8ve. Elle a demand\xE9 \xE0 vous voir, ici. Je lui ai dit que c\u2019\xE9tait une mauvaise id\xE9e.") },
      { qui: "isaure", texte: t("Je ne descends jamais, on vous l\u2019a dit. Ce matin, j\u2019ai sign\xE9 une lettre de mon nom, puis de celui du fondateur, sans m\u2019en apercevoir. Alors je suis venue voir ce que vous voyez.") },
      { qui: "isaure", texte: t("Vous me croyez avide. Une \xEEle porte tant de vies, directeur, pas une de plus. Ce que j\u2019ai pris en bas tient trois mille personnes au-dessus des nuages. Dites-moi lesquelles je devais laisser tomber.") },
      { qui: "ilka", texte: t("\xAB Trente-deux pr\xE9lev\xE9s. Aucun refus. \xBB C\u2019est votre \xE9criture."), ...souv("carnet-isaure") },
      { qui: "isaure", texte: t("Les Berceaux ne refusent jamais. Il faut bien que quelqu\u2019un le fasse \xE0 leur place. Je ne l\u2019ai pas fait."), ...souv("carnet-isaure") },
      { qui: "liane", texte: t("Bonjour, m\xE8re."), si: present("liane") },
      { qui: "isaure", texte: t("Je ne vous connais pas."), si: present("liane") },
      { qui: "hald", texte: t("Elle la conna\xEEt. Elle demande de ses nouvelles dans chacun de mes rapports."), si: present("liane") },
      { qui: "vela", texte: t("Elle porte trois voix. La sienne est la plus petite. Elle le sait, et elle tient quand m\xEAme la barre.") },
      { qui: "isaure", texte: t("Montez \xE0 la Fl\xE8che, directeur. Une fois l\xE0-haut, regardez ce que je regarde chaque matin. Ensuite seulement, jugez-moi.") },
      { qui: "hald", texte: t("Je vous dois la fl\xE8che \xE0 la craie de \u22123, alors je vous dis ceci : elle n\u2019est pas descendue pour vous menacer. Elle est descendue parce qu\u2019elle a peur."), ...souv("craie-hald") }
    ]
  },
  entree(
    9,
    t("Le Ciel d\u2019en bas"),
    t("Aucun fouilleur n\u2019a jamais d\xE9pass\xE9 la Strate \u22129. Avant le d\xE9part, Ys\xE9 t\u2019a fait porter une lettre. Tu la lis \xE0 la lueur des cristaux."),
    [
      { qui: "yse", texte: t("Je suis trop vieille pour te suivre, alors je t\u2019\xE9cris. Regarde tout, \xE9coute ceux qu\u2019on ne fait que combattre, et reviens. Le reste, tu le liras quand il sera temps.") },
      { qui: "brac", texte: t("C\u2019est moi qui te l\u2019ai apport\xE9e. Ys\xE9 dit qu\u2019un pilleur passe partout. Elle a raison. En passant, j\u2019ai regrav\xE9 mon nom au mur des fouilleurs. Une seule fois, cette fois-ci, et je compte bien le barrer.") },
      { qui: "ilka", texte: t("Ys\xE9 \xE9crit comme elle parle : gentiment, en te laissant le plus dur.") },
      { qui: "doran", texte: t("Nous, on remonte toujours. Il y a des pompes qui nous attendent.") },
      { qui: "ilka", texte: t("Depuis qu\u2019on est entr\xE9s, mon \xE9cran n\u2019affiche plus rien. Elle se tait. Je crois qu\u2019elle a peur de ce qui coud, en bas."), ecran: { v: "" } }
    ]
  ),
  apresGardien(
    9,
    "tisseuse",
    t("Son nom"),
    t("La Tisseuse baisse les mains. Elle ne cherchait pas \xE0 vous vaincre : elle voulait savoir si vous teniez debout sans ses fils. Ils se d\xE9font autour d\u2019elle comme une \xE9charpe qu\u2019on d\xE9noue. Quand tu lui demandes son nom, elle sourit."),
    [
      { qui: "tisseuse", texte: t("Personne ne me l\u2019avait demand\xE9. Je l\u2019ai donn\xE9 \xE0 quelqu\u2019un qui descendait, il y a tr\xE8s longtemps, pour qu\u2019il se souvienne de moi. Il m\u2019a oubli\xE9e quand m\xEAme.") },
      { qui: "tisseuse", texte: t("En dessous, c\u2019est le fond. Le premier d\u2019entre nous y attend. Lui sait encore qui il est. C\u2019est bien ce qui fait peur.") },
      { qui: "vela", texte: t("Tu le lui avais d\xE9j\xE0 demand\xE9, dans son nid. Elle a attendu la fin pour r\xE9pondre."), ...souv("nom-demande") },
      { qui: "vela", texte: t("Elle s\u2019est endormie. Doucement. Pour la premi\xE8re fois depuis tr\xE8s longtemps, quelqu\u2019un d\u2019autre tient les noms \xE0 sa place : nous.") },
      { qui: "doran", texte: t("Le fond. Ceux d\u2019avant. On y est presque.") }
    ]
  ),
  {
    // 11 novembre 2026 : le premier geste de la Glacière. L'Ossyra en elle prend la main, et sa ville passe sur l'écran
    // sans jamais être expliquée (l'accroche de l'extension). Un écho à 2111 : la passerelle d'Ilka avait cédé, celle-ci tient.
    id: "passerelle-9",
    acte: 3,
    sur: t("III \xB7 LE CIEL D\u2019EN BAS"),
    titre: t("Cette fois"),
    image: { strate: 9 },
    recit: t("Au retour, la passerelle au-dessus du Ciel d\u2019en bas craque sous l\u2019escouade. Elle c\xE8de d\u2019un c\xF4t\xE9, puis s\u2019arr\xEAte \xE0 mi-chute, comme retenue par une main."),
    quand: (c2) => c2.vaincue >= 9,
    repliques: [
      { qui: "ilka", texte: t("Ce n\u2019est pas moi. Mes jambes se sont verrouill\xE9es toutes seules. Elles tiennent la passerelle, directeur."), charniere: 9 },
      { qui: "ilka", texte: t("Sur mon \xE9cran, il y a une ville. De la pierre claire, des tours, un vrai ciel. Ce n\u2019est pas l\u2019archipel. Ce n\u2019est nulle part que je connaisse.") },
      { qui: "doran", texte: t("Avance. Ne regarde pas en bas. Pas cette fois.") },
      { qui: "vela", texte: t("Ce n\u2019\xE9tait pas sa voix \xE0 elle. Celle-l\xE0 a peur de nous. L\u2019autre voulait qu\u2019on passe.") },
      { qui: "ilka", texte: t("L\u2019\xE9cran essaie de la compter. 1. 2. 1. Il n\u2019arrive pas \xE0 se d\xE9cider."), ecran: { v: "1|2", anim: "hesite" } },
      { qui: "ilka", texte: t("Cette fois, elle a tenu.") }
    ]
  },
  entree(
    10,
    t("Le fond"),
    t("La Strate \u221210 ne ressemble \xE0 aucune autre. Les salles sont nettes, les cristaux clairs, les portes mieux scell\xE9es que toutes les autres."),
    [
      { qui: "vela", texte: t("Une seule voix, quelque part au fond. La plus ancienne. Je n\u2019en ai jamais entendu d\u2019aussi nette.") },
      { qui: "doran", texte: t("Le fond. Mon p\xE8re n\u2019est jamais venu jusqu\u2019ici. Personne n\u2019est venu jusqu\u2019ici.") },
      { qui: "ilka", texte: t("Dix \xE9tages. On cherchait l\u2019\xC9cluse, et on a trouv\xE9 des gens qui comptaient. J\u2019esp\xE8re que le fond a une meilleure r\xE9ponse.") }
    ]
  ),
  apresGardien(
    10,
    "premier-porteur",
    t("Le premier registre"),
    t("Le Premier Porteur abaisse les mains et se rassoit. Il n\u2019a jamais voulu vous abattre : il voulait voir si vous teniez face \xE0 une seule voix, nette, sans vous y perdre. Il pose la main sur une table grav\xE9e, comme pour vous la confier. En haut, une phrase plus ancienne que tout ce que vous avez vu. Dessous, une ligne plus r\xE9cente, de la m\xEAme \xE9criture."),
    [
      { qui: "premier-porteur", texte: t("Que celui qui lit ceci compte les voix qu\u2019il porte.") },
      { qui: "ilka", texte: t("Mon \xE9cran affiche la m\xEAme phrase. Mot pour mot. Elle ne l\u2019a pas calcul\xE9e, directeur : elle s\u2019en est souvenue. Et ce souvenir n\u2019est pas \xE0 elle."), ecran: { v: "\u2261" } },
      { qui: "vela", texte: t("2. Elle aussi, elle en porte deux."), ecran: { v: "2" } },
      { qui: "vela", texte: t("Il l\u2019a dite comme une le\xE7on qu\u2019on r\xE9cite. Depuis \u22123, ils nous disaient la m\xEAme chose.") },
      { qui: "premier-porteur", texte: t("Ossyra."), charniere: 10 },
      { qui: "vela", texte: t("Le mot des empreintes, celui qu\u2019on prenait pour un endroit. Il ne nous montre rien : il se pr\xE9sente. Ossyra, c\u2019est leur nom \xE0 tous. Ceux qui portent.") },
      { qui: "vela", texte: t("Tu lui as dit qui tu \xE9tais. Il vient de te r\xE9pondre de la m\xEAme fa\xE7on : la main sur sa table, et le nom des siens."), ...souv("presente") },
      { qui: "ilka", texte: t("Ceux qui portent. On appelle les n\xF4tres des Porteurs depuis cinquante ans. Personne ne s\u2019est demand\xE9 \xE0 qui on avait pris le mot, ni o\xF9 il les avait men\xE9s.") },
      { qui: "vela", texte: t("Tu nous as fait compter nos voix, tout \xE0 l\u2019heure. J\u2019en porte deux. Je sais encore laquelle est la mienne."), ...souv("voix-comptees") },
      { qui: "premier-porteur", texte: t("Les voix ne nous ont pas pris, elles nous ont gard\xE9s. Ne fermez rien.") },
      { qui: "ilka", texte: t("Hessa a gard\xE9 sous cl\xE9 la moiti\xE9 qui fait peur. L\u2019autre, celle qui dit de ne rien fermer, personne en haut ne l\u2019a jamais lue."), si: lentille("nous") },
      { qui: "vela", texte: t("Eux ont mis des si\xE8cles \xE0 remonter jusqu\u2019\xE0 notre Puits Z\xE9ro. Lui a fait tout le chemin en sens inverse, seul, pour r\xE9pondre \xE0 celui qui avait \xE9crit la premi\xE8re ligne."), si: lentille("avant") },
      { qui: "doran", texte: t("Il a \xE9crit \xE7a sous la mise en garde, et il a referm\xE9 derri\xE8re lui. De l\u2019int\xE9rieur.") },
      { qui: "ilka", texte: t("Et nous, on a pris leurs empreintes pour des cadeaux. Il faut le dire \xE0 tout Vertiga. Mais quoi, exactement ? \xC7a, c\u2019est \xE0 toi.") },
      { qui: "doran", texte: t("Et l\u2019\xC9cluse ? Pas une ligne dessus. Ils ont perdu contre leur eau, comme contre leurs voix.") },
      { qui: "vela", texte: t("Une \xC9cluse a exist\xE9, Doran. Ce qui \xE9veille, ce qui soul\xE8ve, ce qui tient : les c\u0153urs des Berceaux. On les a trouv\xE9s, et on les a mont\xE9s l\xE0-haut, pour cinq familles.") },
      { qui: "vela", texte: t("Ils cherchaient le ciel. Nous l\u2019avons. Il flotte au-dessus de nous, et il est ferm\xE9.") },
      { qui: "doran", texte: t("Les pieds mouill\xE9s, sous les pompes, tout en haut. Ils montaient. Si ceux d\u2019avant sont tous ici, alors qui remonte ?") }
    ]
  ),
  {
    id: "epilogue",
    acte: 4,
    sur: t("\xC9PILOGUE"),
    titre: t("Ce que tu as choisi"),
    image: { intro: "00-titre" },
    recit: t("Quelques semaines plus tard, au sommet de la Tour du Noyau. La mer est calme, et une \xEEle des Hauts glisse au loin."),
    quand: (c2) => !!c2.actes.fin,
    repliques: [
      { qui: "yse", texte: t("Tu as referm\xE9 la porte, comme les ouvriers de 2066, comme ceux d\u2019avant. Cette fois, au moins, tout le monde sait pourquoi."), si: fin("scellement") },
      { qui: "yse", texte: t("Une paix fragile, encore une. Elle vaut mieux qu\u2019une guerre solide. Je te l\u2019avais \xE9crit, je crois."), si: fin("pacte") },
      { qui: "yse", texte: t("Tout le monde sait, maintenant. Ce que chacun en fera, je n\u2019en sais rien. C\u2019est \xE7a, la libert\xE9 : on ne sait pas."), si: fin("archives") },
      { qui: "yse", texte: t("Les R\xE9sonants des Hauts ont retrouv\xE9 leurs noms, pour la plupart. Sous le pilier de l\u2019ouest, la Glaci\xE8re a cess\xE9 d\u2019\xE9crire. Je ne sais pas si elle dort ou si elle boude."), si: fin("scellement") },
      { qui: "yse", texte: t("La Glaci\xE8re a re\xE7u un si\xE8ge \xE0 la commission : un \xE9cran, au bout de la table. Elle tient la voix principale des R\xE9sonants malades, un par un, avec leur accord. Elle dit bonjour \xE0 chaque s\xE9ance."), si: fin("pacte") },
      { qui: "yse", texte: t("Les relev\xE9s de la Glaci\xE8re sont publics. Chacun peut lire combien de voix il porte. Certains en ont pleur\xE9. D\u2019autres ont enfin compris pourquoi ils se sentaient deux."), si: fin("archives") },
      { qui: "ilka", texte: t("Mes jambes disent encore bonjour, le matin. Je r\xE9ponds. On ne sait jamais qui \xE9coute.") },
      { qui: "vela", texte: t("Les voix se sont calm\xE9es. Pas toutes. Assez pour que j\u2019entende la mienne.") },
      { qui: "ilka", texte: t("Et maintenant ? Il reste des Berceaux, des pilleurs, et une \xEEle qui passe. Les Strates continuent.") },
      { qui: "yse", texte: t("Le Noy\xE9 est pass\xE9 me voir, ce vieux saboteur rescap\xE9 du Levage et de la Gr\xE8ve des pompes, avec un papier pli\xE9 en huit. Il dit que la Clause de la Fl\xE8che parle de ton district, pas seulement de ton escouade. Je t\u2019ai recopi\xE9 tout \xE7a dans les Chroniques.") },
      { qui: "doran", texte: t("Sous la salle du Premier Porteur, l\u2019escalier continue. Je l\u2019ai vu en remontant. Il descend encore, et \xE7a sentait l\u2019eau. Pas la n\xF4tre.") },
      { qui: "yse", texte: t("Regarde la mer, directeur. Elle n\u2019a pas oubli\xE9 de monter. Mais toi, tu as regard\xE9. Je ferme mon cahier : la suite est \xE0 toi.") }
    ]
  }
];
var ENJEUX = {
  1: { titre: t("La chambre s\u2019est r\xE9veill\xE9e"), enjeu: t("Quelque chose est n\xE9 des empreintes m\xEAl\xE9es de la chambre. Trouve-le, au fond de la Strate \u22121."), ensuite: t("La Confluence a fui vers le bas, et des pilleurs ont vid\xE9 la chambre. Perce la roche pour les suivre.") },
  2: { titre: t("Les couloirs mur\xE9s"), enjeu: t("Rattrape les pilleurs qui ont vid\xE9 la chambre, avant que la Confluence ne les trouve."), ensuite: t("Les Brigades de la capitaine Hald suivent la Confluence vers la Strate \u22123. Ne les laisse pas arriver seules.") },
  3: { titre: t("Dans le noir"), enjeu: t("Abats la Confluence pour de bon, et retrouve les patrouilles de la capitaine Hald."), ensuite: t("La Confluence est tomb\xE9e, et la chambre a trouv\xE9 sa garde. Sous les Seuils, les salles closes attendent.") },
  4: { titre: t("Ferm\xE9es de l\u2019int\xE9rieur"), enjeu: t("Trouve ce que les ouvriers de 2066 ont mur\xE9, plus bas, au niveau 7."), ensuite: t("Le Gardien des registres a recul\xE9 derri\xE8re ses portes rondes. Il conna\xEEt le nom du p\xE8re de Doran.") },
  5: { titre: t("Les Berceaux vides"), enjeu: t("Suis le Gardien des registres jusqu\u2019aux Berceaux que les Hauts n\u2019ont pas encore vid\xE9s."), ensuite: t("Un inventaire sign\xE9 \xAB I. Ors\xE8ve \xBB. Plus qu\u2019un \xE9tage avant le mur de 2066.") },
  6: { titre: t("Le niveau 7"), enjeu: t("Franchis le mur de 2066 et fais reculer le Gardien des registres."), ensuite: t("Derri\xE8re le mur, des cristaux qui pleuraient, et une lettre des Hauts sur ton bureau. Plus bas, les m\xE9moires se contredisent.") },
  7: { titre: t("Deux passerelles"), enjeu: t("Trouve ce qui tisse les souvenirs, avant qu\u2019il ne touche \xE0 ceux de l\u2019escouade."), ensuite: t("La Tisseuse a fui vers le bas, et une \xE9quipe des Veilleurs n\u2019est jamais remont\xE9e.") },
  8: { titre: t("Les Veilleurs perdus"), enjeu: t("Ram\xE8ne l\u2019\xE9quipe des Veilleurs, prisonni\xE8re d\u2019un souvenir heureux."), ensuite: t("Les Veilleurs sont sauv\xE9s. La Tisseuse s\u2019est r\xE9fugi\xE9e \xE0 la Strate \u22129, que personne n\u2019a jamais d\xE9pass\xE9e.") },
  9: { titre: t("Le Ciel d\u2019en bas"), enjeu: t("Retrouve la Tisseuse au fond de sa toile, et demande-lui son nom."), ensuite: t("Sous la Tisseuse, le fond. Le premier d\u2019entre eux y attend.") },
  10: { titre: t("Le fond"), enjeu: t("Tiens bon face au Premier Porteur, et lis son registre."), ensuite: t("Le premier registre a parl\xE9. Il ne reste qu\u2019\xE0 choisir ce que Vertiga en saura.") }
};
var GARDIENS = {
  1: { avant: t("Trop de voix\u2026 Laissez-nous descendre\u2026"), phase: t("Nous sommes plusieurs. Nous serons plus.") },
  2: { avant: t("Ils nous ont port\xE9es. Vous, vous nous retenez."), phase: t("Encore des voix. Encore !") },
  3: { avant: t("Compte\u2026 compte\u2026"), phase: t("Ne nous s\xE9parez pas !") },
  4: { avant: t("Appel des pr\xE9sents. \xC9quipe de 2066 : absente."), phase: t("Registre ouvert. Que le t\xE9moin s\u2019avance.") },
  5: { avant: t("Vous n\u2019\xEAtes pas sur la liste."), phase: t("Un serment perdu cherche une bouche. Brigadier, \xE0 la barre.") },
  6: { avant: t("Derri\xE8re moi, il n\u2019y a personne. Repartez."), phase: t("Je garde ce qui pleure. Je le garderai.") },
  7: { avant: t("Oh. Des souvenirs neufs."), phase: t("Regardez donc ce qui vous attend.") },
  8: { avant: t("Ils sont heureux, ici. Pas vous ?"), phase: t("Je tisse plus vite que vous ne cassez.") },
  9: { avant: t("Je tiens ces noms depuis trop longtemps. Montrez-moi que vous tiendrez sans mes fils, et je les l\xE2cherai."), phase: t("Tous mes fils, une derni\xE8re fois. Apr\xE8s, ce sera \xE0 vous.") },
  10: { avant: t("Vous portez peu de voix. C\u2019est bien. Tenez debout face \xE0 la mienne, et je vous r\xE9pondrai."), phase: t("\xC9coutez-les toutes, alors. Nous les avons \xE9cout\xE9es.") }
};
var GARDIEN_FOND = { avant: t("Encore vous. Combien de voix, cette fois ?"), phase: t("Ceux d\u2019avant ne se battent jamais seuls.") };
var PAROLES = {
  entree: {
    ilka: [t("Les piliers grincent. Tant qu\u2019ils grincent, ils tiennent."), t("Des portes ferm\xE9es de l\u2019int\xE9rieur. J\u2019aime pas les portes qu\u2019on n\u2019a pas le droit d\u2019ouvrir."), t("Si je dis un truc bizarre, secouez-moi. Ici, on n\u2019est jamais s\xFBr que c\u2019est son propre souvenir."), t("C\u2019est trop propre, ici. Comme une maison o\xF9 quelqu\u2019un attend de la visite.")],
    doran: [t("Je reconnais ces \xE9tais. C\u2019est l\u2019\xE9quipe de mon p\xE8re qui les a pos\xE9s."), t("\xC9coutez le silence. Les salles closes ne r\xE9sonnent pas. On dirait qu\u2019elles retiennent leur souffle."), t("Ma chitine me gratte. Elle sent des choses qui ont \xE9t\xE9 vraies. Et d\u2019autres non."), t("Mon p\xE8re n\u2019est jamais all\xE9 si bas. Il aurait aim\xE9 voir \xE7a. Ou pas.")],
    vela: [t("Les cristaux d\u2019ici ont des voix d\u2019ouvriers. Fatigu\xE9es, mais gentilles."), t("Derri\xE8re les portes, \xE7a dort. Ne parlez pas trop fort."), t("Les murs ici essaient de me vendre des souvenirs. Je n\u2019ach\xE8te pas."), t("Il n\u2019y a qu\u2019une voix, ici. Je l\u2019entends m\xEAme quand je me bouche les oreilles.")],
    sasha: [t("Des c\xE2bles de 2060, encore sous tension. Quel g\xE2chis. Je les r\xE9parerais tous, si on avait le temps."), t("Des serrures sans vis ni ressort. Ceux qui ont fait \xE7a savaient travailler."), t("Ces automates graveurs, j\u2019aimerais en ouvrir un. Juste un. Pour voir."), t("Rien ne rouille, ici. Rien n\u2019a jamais servi. C\u2019est presque triste.")],
    nuit: [t("\xC9teignez donc vos lampes. Vous verrez mieux."), t("Il y a des yeux derri\xE8re les portes. Ils ne nous veulent pas de mal. Ils nous regardent."), t("M\xEAme dans le noir, ici, il y a des choses qui brillent pour rien. Je n\u2019aime pas \xE7a."), t("Le noir du fond est diff\xE9rent. Il est vieux. Il a l\u2019habitude qu\u2019on le laisse tranquille.")],
    kessa: [t("Je suis n\xE9e avec des yeux faits pour descendre ici. Au moins, \xE7a sert."), t("Mes yeux d\u2019enfant voient dans ces couloirs mieux que mes yeux d\u2019adulte. C\u2019est dr\xF4le, non ?"), t("Les r\xE9cits de la mue de mes parents me reviennent, ici. Ceux que j\u2019avais rang\xE9s."), t("Ceux d\u2019avant ont choisi ce qu\u2019ils voulaient devenir. Nous, on n\u2019a rien choisi. Je ne sais pas qui est le plus \xE0 plaindre.")],
    aurel: [t("Le b\xE9ton des districts. Chez moi, on ne marche que sur du marbre. \xC7a glisse plus."), t("Ma famille conna\xEEt ces salles. Elle n\u2019en parle jamais au d\xEEner."), t("Mon ombre a l\u2019air de conna\xEEtre le chemin. \xC7a ne me rassure pas."), t("Si ma tante savait o\xF9 je suis, elle ferait une syncope. C\u2019est une bonne raison d\u2019y \xEAtre.")],
    liane: [t("Je suis une Refus\xE9e, au cas o\xF9 quelqu\u2019un aurait un doute. Ici, \xE7a ne compte pas."), t("Les Hauts ont pris ce qu\u2019il y avait ici. Moi, je viens voir ce qu\u2019ils ont laiss\xE9."), t("Mes implants captent des interf\xE9rences. Comme si quelqu\u2019un parlait sur toutes les fr\xE9quences \xE0 la fois."), t("Ma m\xE8re disait que le fond \xE9tait un mythe. Elle disait \xE7a de beaucoup de choses.")],
    joss: [t("J\u2019entends les gens du quartier, m\xEAme d\u2019ici. \xC7a me tient compagnie."), t("Il y a de la peur derri\xE8re ces portes. Pas la n\xF4tre. Plus vieille."), t("Je sais reconna\xEEtre quelqu\u2019un qui ment. Ici, ce sont les murs qui mentent."), t("Je n\u2019ai jamais cach\xE9 mon or ici. Personne n\u2019est l\xE0 pour le voir.")]
  },
  gardien: {
    ilka: [t("Le gros morceau. On y va vite, on y va fort."), t("Je d\xE9teste les gardiens qui parlent. Celui-l\xE0 parle."), t("Si elle nous montre encore un souvenir, je ferme les yeux et je frappe."), t("C\u2019est lui. Pas de discours. On a fait tout ce chemin.")],
    doran: [t("Tenez la ligne. Je prends les coups, vous prenez le reste."), t("Il garde quelque chose. \xC7a ne veut pas dire qu\u2019il a raison."), t("Elle tient trop de fils. On en coupe un, puis un autre."), t("Mon p\xE8re a ferm\xE9 une porte pour ne pas le voir. Moi, je l\u2019ouvre.")],
    vela: [t("Elle a peur, elle aussi. Ne la laissez pas nous entra\xEEner dedans."), t("Il r\xE9cite. Il n\u2019entend plus. Il faudra le faire taire."), t("Je ne regarde pas ses fils. Si je les regarde, je les suis."), t("Il sait qui il est. C\u2019est pour \xE7a qu\u2019il est si fort.")]
  }
};

// src/core/regles.ts
var REGLES = {
  /** Combats qui s'éternisent (`usureCombat`, combat.ts) : les soins ennemis baissent dès le tour `soinsDes`, à zéro `soinsSur` tours plus tard ;
   *  les attaques ennemies grossissent de `attaqueParTour` par tour à partir du tour `attaqueDes`.
   *  3 novembre 2026, validé par Bryan après le diagnostic au robot : avant, +10 % dès le tour 25, et une escouade de Génés seuls
   *  (boucliers et soins en cuivre) tenait indéfiniment et gagnait ~93 % (deck mélangé ~50 %). Dès le tour 12 à +15 % : Génés seuls ~25 %
   *  pour le joueur moyen, combats normaux (≈ 7 tours) inchangés, les Génés restent ceux qui tiennent, mais tenir ne suffit plus seul. */
  usure: { soinsDes: 10, soinsSur: 10, attaqueDes: 12, attaqueParTour: 0.15 },
  /** À quelle Strate chaque mécanique de combat apparaît (28 octobre 2026) : une nouveauté à la fois, rien n'est retiré.
   *  −1 : chaîne, Résonance, Flux ; −2 : Fêlure ; −3 : groupes ; −4 : traits d'ennemis ; −5 : conditions de salle.
   *  Les phases des gardiens restent dès la −2. */
  apparition: { felure: 2, groupes: 3, traits: 4, conditions: 5, assimilation: 6, troisiemePhase: 7 },
  /** Les aides aux suites (cartes qui s'éclairent, chiffre attendu dans la place vide, « ajoute un 6 ») : jusqu'à cette Strate,
   *  puis seul le résultat s'affiche (3 novembre 2026, Bryan : « ça fait peut-être un peu trop d'assistanat ») */
  aideSuitesJusqua: 2,
  /** Brouillard sur le plan des Strates (30 octobre 2026, idée de Bryan après une remarque de Luc) : on ne sait plus d'avance où mène un chemin.
   *  Les salles voisines sont claires jusqu'à la Strate `indices` − 1, puis elles ne montrent qu'un indice (bruits, lueur…).
   *  Au-delà des voisines, tout est dans la brume ; jusqu'à la Strate `loin`, on devine encore les indices de la rangée d'après.
   *  Un Résonant debout dans l'escouade « sent » une rangée de plus (indices seulement). Le gardien se voit toujours. */
  brouillard: { loin: 1, indices: 4 },
  /** Ce que rapportent les salles (30 octobre 2026, Luc : « quel intérêt de faire le combat ? La cache donne plus et on ne perd pas de PV ») :
   *  le combat rapporte plus de composants que la cache, en plus de l'XP et de la chance de carte ; la cache devient la voie sûre et modeste,
   *  qui panse un peu l'escouade. Avant : combat 6, cache 8 (sans soin). Tout est multiplié par 1 + 0,25 × (Strate − 1). */
  salles: { combat: 8, cache: 5, cacheSoin: 0.1, archive: 4, gardien: 14, elite: 1.7, parStrate: 0.25 },
  /** Ce qu'Explorer rapporte de plus qu'une fouille (audit du 7 novembre 2026 : à −5, 25 de valeur par minute en exploration
   *  contre 49 en fouille facile). Pour les combats d'une expédition salle par salle (pas les fouilles) : composants ×`composants`,
   *  chance de carte par combat gagné +`carte`, et dès la Strate −`eclatsDes` une chance d'Éclat `eclats` (fouilles : `eclatsFouille`). */
  /** 8 novembre 2026 (audit : explorer le front rapportait 38 composants la minute contre 55 pour une fouille facile) :
   *  la première exploration du front de la journée compte ses composants double (`premiere`), les suivantes ×1,5 */
  exploration: { composants: 1.5, premiere: 2, carte: 0.05, eclatsDes: 5, eclats: 0.2, eclatsFouille: 0.1 },
  /** 3ᵉ phase des gardiens (28 octobre 2026) : sous ce seuil de PV, une variante tirée au début du combat ; Déferlement : +X par tour, plafond */
  troisiemePhase: { seuil: 0.2, deferlement: 0.25, deferlementMax: 2, renfort: 0.2, renfortForce: 0.28 },
  tailleMain: 5,
  /** force d'une carte « éteinte » (son Porteur est à terre) : elle reste dans le deck, sans effet, et sa Fréquence compte (27 octobre 2026).
   *  Mesuré au pillage miroir (joueur moyen) : avant 44 % de victoires en 18 tours ; ×0,5 → 23 % ; ×0,85 → 39 % en 13 tours ; ×1 → 47 % */
  eteinte: 0.85,
  capaciteBase: 3,
  capaciteMax: 5,
  fluxMax: 3,
  bonusLignee: 1.15,
  /** Empreinte (carte exclusive, 28 octobre 2026) : sans effet à copier, la carte gagne cette force en plus.
   *  Mesuré au robot : sans elle, une Empreinte dans un deck encore en fer (aucun effet) ne valait rien. */
  empreinteSeule: 1.4,
  /** Écho (trois Fréquences identiques dans la chaîne) : les cartes qui résonnent ensemble frappent, protègent et soignent
   *  plus fort (27 octobre 2026). Avant : bouclier d'escouade +8, quelle que soit la chaîne — trop peu pour un tirage
   *  environ 10 fois plus rare qu'une suite de 3 dans un deck normal (3 à 7 % des mains contre ~40 %), et toujours du bouclier.
   *  Le bonus suit maintenant l'action des cartes ; +50 % se place entre la suite de 3 (+30 %) et celle de 4 (+60 %) : plus rare
   *  que la première, mais un deck qui empile une Fréquence peut le rendre fréquent (23 % des mains). Mesuré au robot
   *  (archétypes, 80 descentes) : de ×1,25 à ×1,6, le deck « tout en échos » ne bat jamais le deck normal chez le joueur moyen
   *  (−4 à −7 points) et reste loin derrière le deck « tout en suites » (voir docs/robot-archetypes.md). */
  echo: 1.3,
  /** Écho à 4 et à 5 cartes (1er novembre 2026, demande de Bryan) : chaque carte de plus est 4 à 5 fois plus rare, mais elle
   *  ajoute déjà une carte entière renforcée ; le palier reste donc modéré pour ne pas pousser au deck « une seule Fréquence ».
   *  Avant : +50 % quel que soit le nombre de cartes. La quintuplette (qui demande une place de Flux) rend en plus 1 Flux. */
  echoPaliers: { 3: 1.3, 4: 1.45, 5: 1.6 },
  /** Flux en plus rendu par une quintuplette (cinq Fréquences identiques) */
  fluxEcho5: 1,
  /** multiplicateur selon la longueur de la meilleure suite.
   *  8 novembre 2026 (audit du soir, validé par Bryan) : à 3 places de chaîne, l'Écho (+50 %) payait plus que la suite (+30 %).
   *  Écho 1,5 / 1,65 / 1,8 → 1,3 / 1,45 / 1,6 et suite de 3 : 1,3 → 1,4. Robot (archétypes, joueur moyen, −3) :
   *  force 83 → 78 %, suites 60 → 63 %, échos 75 → 71 % (bruit ±9 points).
   *  Le même soir, le game designer a trouvé la mesure faussée : le deck « force » piochait des exclusives et l'Héritage, qui n'existent pas
   *  en fer (sans effet mais très forts). Pool corrigé (scripts/archetypes.ts) : voir docs/robot-archetypes.md. Aucun chiffre changé ici. */
  multSuite: { 3: 1.4, 4: 1.6, 5: 2 },
  /** part du bonus de suite gardée quand toute la suite vient d'une seule lignée (1 = bonus entier) */
  suiteMono: 1,
  /** force en plus de toutes les cartes quand l'escouade réunit les trois lignées (1 = aucun bonus) */
  trioLignees: 1,
  /** Finisseur (29 octobre 2026, rôles des lignées) : la carte Augmentée qui termine une suite de 3 au moins frappe plus fort.
   *  Les Augmentés « frappent », les Génés « tiennent », les Résonants « troublent » : aucune lignée ne gagne seule. */
  finisseur: 1.25,
  /** part gardée par un bouclier (ou un soin) pour chaque carte du même genre déjà posée dans la chaîne (1 = aucune perte) */
  empilement: { bouclier: 1, soin: 1 },
  soinEntreCombats: 0.5,
  /** Fêlure (25 octobre 2026) : une carte de la Fréquence fêlée brise l'intention de l'ennemi visé */
  felure: {
    /** chance que la Fréquence fêlée soit tirée parmi celles de la main (sinon de 1 à 9) */
    chanceMain: 2 / 3,
    /** part retirée à l'attaque, au bouclier ou au soin annoncé ; les gardiens résistent mieux */
    part: 0.5,
    partGardien: 0.25,
    /** Flux gagné par Fêlure brisée, seulement si la chaîne fait aussi une Résonance (26 octobre 2026 : Bryan trouvait
     *  le Flux trop facile, une carte isolée suffisait ; le Flux redevient la récompense des suites) */
    flux: 1
  },
  /** Coups d'éclat (25 octobre 2026) : Flux plein, un seul par combat */
  eclat: {
    /** Usure en plus pour le Porteur qui le déclenche (« deux jours de sommeil ») */
    usure: 3,
    /** Débridage : multiplicateur des dégâts de la chaîne (26 octobre 2026 : 2 → 1,5, Bryan trouvait qu'il finissait le combat
     *  à lui seul, quand Sursaut et Ombre agissante ne font que sauver l'escouade) */
    debride: 1.5,
    /** Sursaut : part des PV max rendue à chacun, et à celui qui se relève */
    sursaut: 0.4
  }
};
var BAT = { tech: "reso", reso: "bio", bio: "tech" };
function avantage(att, def) {
  return att !== "neutre" && BAT[att] === def ? REGLES.bonusLignee : 1;
}
var frequenceLibre = (e) => e?.type === "accord" || e?.type === "diapason";
function frequencesEffectives(chaine) {
  const r = [];
  chaine.forEach((g, i) => {
    if (!frequenceLibre(g.effet)) {
      r.push(g.f);
      return;
    }
    const pas = g.effet?.type === "accord" ? 1 : 0;
    const borne = (f) => Math.min(9, Math.max(1, f));
    if (i > 0 && g.effet?.type === "diapason" && g.effet.premiere) {
      r.push(r[0]);
      return;
    }
    if (i > 0) {
      r.push(borne(r[i - 1] + pas));
      return;
    }
    const suivant2 = chaine[1];
    r.push(suivant2 && !frequenceLibre(suivant2.effet) ? borne(suivant2.f - pas) : g.f);
  });
  return r;
}
function accordsBloques(chaine) {
  const fs = frequencesEffectives(chaine);
  return chaine.map((g, i) => {
    if (g.effet?.type !== "accord") return false;
    if (i > 0) return fs[i] === fs[i - 1];
    const suivant2 = chaine[1];
    return !!suivant2 && !frequenceLibre(suivant2.effet) && fs[0] === suivant2.f;
  });
}
function analyserChaine(chaine) {
  const fs = frequencesEffectives(chaine);
  let meilleur = fs.length ? 1 : 0;
  let serie = 1;
  let fin2 = 0;
  for (let i = 1; i < fs.length; i++) {
    if (fs[i] === fs[i - 1] + 1) {
      serie++;
      if (serie > meilleur) {
        meilleur = serie;
        fin2 = i;
      }
    } else serie = 1;
  }
  const compte = /* @__PURE__ */ new Map();
  const bloques = accordsBloques(chaine);
  fs.forEach((f, i) => {
    if (!bloques[i]) compte.set(f, (compte.get(f) ?? 0) + 1);
  });
  const echoE = [...compte.entries()].filter(([, n]) => n >= 3).sort((x2, y) => y[1] - x2[1])[0];
  const echoF = echoE?.[0];
  let mult = REGLES.multSuite[Math.min(meilleur, 5)] ?? 1;
  if (meilleur >= 3 && REGLES.suiteMono < 1) {
    const ls = new Set(chaine.slice(fin2 - meilleur + 1, fin2 + 1).map((m) => m.porteur ? porteurDef(m.porteur).lignee : null).filter(Boolean));
    if (ls.size === 1) mult = 1 + (mult - 1) * REGLES.suiteMono;
  }
  return { suite: meilleur, mult, echo: echoF !== void 0, ...echoE ? { echoF, echoN: echoE[1] } : {} };
}
function multEcho(chaine, rang2) {
  const a = analyserChaine(chaine);
  return a.echoF !== void 0 && frequencesEffectives(chaine)[rang2] === a.echoF && !accordsBloques(chaine)[rang2] ? multEchoN(a.echoN ?? 3) : 1;
}
var multEchoN = (n) => REGLES.echoPaliers[Math.min(5, Math.max(3, n))] ?? REGLES.echo;
var pctEcho = (n = 3) => `+${Math.round((multEchoN(n) - 1) * 100)} %`;
var nomEcho = (n = 3) => n >= 4 ? t`Écho ×${Math.min(5, n)}` : t("\xC9cho");
function serieFinale(chaine) {
  const fs = frequencesEffectives(chaine);
  let s = fs.length ? 1 : 0;
  for (let i = fs.length - 1; i > 0; i--) {
    if (fs[i] === fs[i - 1] + 1) s++;
    else break;
  }
  return s;
}
var peutPayerSurtension = (p) => !!p && p.pv > 1;
var places = (g) => g.lourd ? 2 : 1;
function placesChaine(chaine, eteinte) {
  let n = 0, lourdes = 0, servos = 0;
  for (const g of chaine) {
    n += places(g);
    if (g.lourd) lourdes++;
    if (g.effet?.type === "servo" && !eteinte?.(g)) servos++;
  }
  return n - Math.min(lourdes, servos);
}
var placesEnPlus = (chaine, g, eteinte) => placesChaine([...chaine, g], eteinte) - placesChaine(chaine, eteinte);
function meilleureFrequence(chaine, fs) {
  if (fs.length < 2) return fs[0];
  const eff = frequencesEffectives(chaine);
  const der = eff[eff.length - 1];
  const prolonge = der !== void 0 && fs.includes(der + 1);
  if (prolonge && serieFinale([...chaine, { f: der + 1 }]) >= 3) return der + 1;
  let echo;
  for (const f of fs) {
    const n = eff.filter((x2) => x2 === f).length;
    if (n >= 2 && (echo === void 0 || n > eff.filter((x2) => x2 === echo).length)) echo = f;
  }
  if (echo !== void 0) return echo;
  if (prolonge) return der + 1;
  return fs[0];
}

// src/core/effets.ts
var NOMS_EFFET = {
  percant: t("Per\xE7ant"),
  siphon: t("Siphon"),
  flux: t("Surcharge"),
  desarmer: t("Troubler"),
  fissure: t("Fissure"),
  elan: t("\xC9lan"),
  crescendo: t("Crescendo"),
  accord: t("Accord"),
  vague: t("Vague"),
  rempart: t("Rempart"),
  riposte: t("Riposte"),
  decharge: t("D\xE9charge"),
  diapason: t("Diapason"),
  unisson: t("Unisson"),
  curee: t("Cur\xE9e"),
  lecture: t("Lecture"),
  faille: t("Faille"),
  rafale: t("Rafale"),
  debord: t("D\xE9bord"),
  rapt: t("Rapt"),
  rappel: t("Rappel"),
  pioche: t("Plan"),
  breche: t("Br\xE8che"),
  secours: t("Secours"),
  surtension: t("Surtension"),
  empreinte: t("Empreinte"),
  releve: t("Rel\xE8ve"),
  sourdine: t("Sourdine"),
  amorce: t("Amorce"),
  servo: t("Servo"),
  contrepoint: t("Contrepoint"),
  execution: t("Ex\xE9cution"),
  tenacite: t("T\xE9nacit\xE9")
};

// src/core/combat.ts
var clone = (x2) => structuredClone(x2);
function photo(s) {
  const h = s.historique;
  if (!h) return clone(s);
  delete s.historique;
  const c2 = clone(s);
  s.historique = h;
  c2.historique = h;
  return c2;
}
function creerCombat(opts) {
  const e = ennemiDef(opts.ennemiId);
  const groupe = [opts.ennemiId, ...opts.escorte ?? []];
  const seulOrdinaire = groupe.length === 1 && !estGardien(opts.ennemiId);
  const force = (opts.force ?? 1) * (PART_GROUPE[groupe.length] ?? PART_GROUPE[3]) * (seulOrdinaire ? opts.coupsMult ?? 1 : 1);
  const pvForce = (opts.pvPleins ? force : (opts.force ?? 1) * (PV_GROUPE[groupe.length] ?? PV_GROUPE[3]) * pvProfondeur(opts.force ?? 1)) * (seulOrdinaire ? opts.pvMult ?? 1 : 1);
  const etat = (id, rang2) => {
    const d2 = ennemiDef(id);
    const pv = Math.round(d2.pvMax * pvForce);
    return { id, pv, pvMax: pv, force, bouclier: 0, etape: rang2, boost: 1, ...groupe.length > 1 ? { rang: rang2 } : {}, ...opts.traits === false ? { simple: true } : {}, ...opts.traitsEnnemis === false ? { sansTraits: true } : {}, ...opts.assimilation === false ? { sansAssimilation: true } : {} };
  };
  const s = {
    porteurs: clone(opts.porteurs),
    ennemi: etat(opts.ennemiId, 0),
    ...groupe.length > 1 ? { autres: groupe.slice(1).map((id, k) => etat(id, k + 1)) } : {},
    forceBase: opts.force ?? 1,
    ...opts.condition ? { condition: opts.condition } : {},
    intention: { type: "boost" },
    pioche: [],
    defausse: [],
    main: [],
    chaine: [],
    capaBonus: 0,
    bouclier: 0,
    flux: 0,
    tour: 1,
    rng: opts.rng,
    issue: "en-cours",
    journal: [],
    ...opts.fuyard ? { fuyard: opts.fuyard.tours } : {},
    ...opts.epreuve?.sansResonance ? { sansResonance: true } : {},
    ...opts.epreuve?.chrono ? { chrono: opts.epreuve.chrono } : {},
    ...opts.epreuve?.sansChute ? { sansChute: true } : {},
    ...opts.epreuve?.monoLignee ? { monoLignee: true } : {}
  };
  if (opts.fuyard) s.ennemi.pv = Math.max(1, Math.round(s.ennemi.pvMax * Math.min(1, opts.fuyard.part)));
  const deck = (opts.deck ?? DECK_DEPART).map((g, k) => ({ ...g, uid: `g${k}` }));
  s.pioche = opts.ordonne ? deck.slice().reverse() : tireur(s).melanger(deck);
  s.historique = [];
  log2(s, groupe.length > 1 ? t`${groupe.map((id) => ennemiDef(id).nom).join(", ")} : un groupe surgit dans la Strate.` : t`Un ${e.nom} surgit dans la Strate.`, { camp: "neutre" });
  const b = opts.bonus;
  if (b?.places) s.capaBonus = b.places;
  if (b?.bouclier) s.bouclier = b.bouclier;
  if (b?.lucide) s.lucide = true;
  if (b?.flux) s.flux = Math.min(REGLES.fluxMax, b.flux);
  if (b?.garde) s.gardeMarque = b.garde;
  if (b?.releve) s.releve = b.releve;
  if (b?.veille) s.veille = b.veille;
  if (b?.desarme) s.desarme = b.desarme;
  if (b?.chitine) s.chitine = b.chitine;
  if (b?.felureFlux) s.felureFlux = b.felureFlux;
  if (b?.fissure) {
    for (const en of b.fissureGroupe ? tousEnnemis(s) : [s.ennemi]) {
      en.fissure = b.fissure;
      en.fissureTours = b.fissureTours ?? 2;
    }
  }
  if (b?.fluxGardien && estGardien(opts.ennemiId)) s.flux = Math.min(REGLES.fluxMax, Math.max(s.flux, b.fluxGardien));
  if (b?.felureFluxGardien && estGardien(opts.ennemiId)) s.felureFlux = b.felureFluxGardien;
  if (b) {
    const m = {};
    for (const k of ["places2", "rempart", "lecture", "retourne", "releveFois", "retenueFlux", "soinQuai", "presage", "phaseMain", "chitineAcheve", "felurePioche", "veilleDeux"]) {
      if (b[k] !== void 0) m[k] = b[k];
    }
    if (Object.keys(m).length) s.marques = m;
  }
  if (opts.troisiemePhase && opts.traits !== false) {
    for (const en of tousEnnemis(s)) if (ennemiDef(en.id).phase) en.phase3 = VARIANTES[((opts.rng >>> 7) + (en.rang ?? 0)) % VARIANTES.length];
  }
  for (const en of tousEnnemis(s)) choisirIntention(s, en);
  piocher(s, REGLES.tailleMain + (b?.main ?? 0));
  fixerFelures(s);
  return s;
}
var porteurEtat = (s, id) => s.porteurs.find((p) => p.id === id);
var vivants = (s) => s.porteurs.filter((p) => p.pv > 0);
var estATerre = (s, id) => !!id && (porteurEtat(s, id)?.pv ?? 0) <= 0;
var avantEteinte = (s, chaine, rang2) => rang2 > 0 && estATerre(s, chaine[rang2 - 1]?.porteur ?? null);
var capacite = (s) => REGLES.capaciteBase + s.capaBonus;
var placesPrises = (s) => placesChaine(s.chaine, (g) => estATerre(s, g.porteur));
var placesCarte = (s, g) => placesEnPlus(s.chaine, g, (x2) => estATerre(s, x2.porteur));
var placesLibres = (s) => capacite(s) - placesPrises(s);
var ligneeGeste = (g) => g.porteur ? porteurDef(g.porteur).lignee : "neutre";
var PART_GROUPE = { 1: 1, 2: 0.64, 3: 0.45 };
var PV_GROUPE = { 1: 1, 2: 0.6, 3: 0.4 };
var PV_PROFONDEUR = { depuis: 1.4, pente: 0.12, plancher: 0.82 };
var pvProfondeur = (force) => Math.max(PV_PROFONDEUR.plancher, Math.min(1, 1 - PV_PROFONDEUR.pente * (force - PV_PROFONDEUR.depuis)));
function trait(en, type) {
  if (!traitsActifs(en) || type === "assimilation" && en.sansAssimilation) return void 0;
  return ennemiDef(en.id).traits?.find((t2) => t2.type === type);
}
var FURIE = 1.3;
var traitsActifs = (en) => !en.simple && !en.sansTraits;
var ligneeEnnemi = (en) => en.assimile ?? ennemiDef(en.id).lignee;
var VARIANTES = ["front", "garde", "deferlement", "appel"];
var PHASES3 = {
  front: {
    nom: t("Front commun"),
    texte: (g, r) => t`${g} appelle ${r} à ses côtés : à deux, ils ne font plus qu’attaquer.`,
    conseil: t("Plus de bouclier ni de soin en face : prot\xE8ge l\u2019escouade et abats le plus faible des deux avant qu\u2019ils ne te d\xE9bordent.")
  },
  garde: {
    nom: t("Garde rapproch\xE9e"),
    texte: (g, r) => t`Deux ${r} accourent : ils ne frappent pas, ils soignent ${g} et le couvrent de leur bouclier.`,
    conseil: t("Tant que sa garde tient, le gardien remonte : abats d\u2019abord ceux qui le soignent.")
  },
  deferlement: {
    nom: t("D\xE9ferlement"),
    texte: (g) => t`${g} ne retient plus rien : ses coups enflent à chaque tour.`,
    conseil: t("Chaque tour qui passe le rend plus dangereux : mise tout sur les d\xE9g\xE2ts pour le finir vite.")
  },
  appel: {
    nom: t("Appel des profondeurs"),
    texte: (g, r) => t`${g} cesse de frapper : il appelle ${r} et soigne les siens. Eux ne font qu’attaquer.`,
    conseil: t("Le gardien ne frappe plus mais ses renforts reviennent sans cesse : frappe-le, lui, d\xE8s que tu peux.")
  }
};
var MOTIFS_ROLE = {
  front: [
    { type: "atk", nom: t("Assaut commun"), v: 6, zone: true },
    { type: "atk", nom: t("Coup concert\xE9"), v: 10, cible: "faible" },
    { type: "atk", nom: t("Coup concert\xE9"), v: 9, cible: "hasard" }
  ],
  soutien: [
    { type: "soin", nom: t("Panser le gardien"), v: 9, allie: true },
    { type: "bouclier", v: 7, allie: true }
  ],
  invocateur: [
    { type: "soin", nom: t("Soigner les siens"), v: 18, allie: true },
    { type: "bouclier", v: 14, allie: true }
  ],
  assaut: [
    { type: "atk", nom: t("Assaut"), v: 12, cible: "hasard" },
    { type: "atk", nom: t("Cur\xE9e"), v: 13, cible: "faible" },
    { type: "atk", nom: t("Ru\xE9e"), v: 7, zone: true }
  ]
};
function allieDe(s, en) {
  const autres = ennemisDebout(s).filter((x2) => x2 !== en);
  if (en.role === "soutien") {
    const g = autres.find((x2) => x2.phase3);
    if (g) return g;
  }
  return autres.sort((a, b) => a.pv / a.pvMax - b.pv / b.pvMax)[0];
}
var puissance = (en) => en.boost * (trait(en, "furie") && en.pv > 0 && en.pv <= en.pvMax / 2 ? FURIE : 1) * (en.crescendo ?? 1);
var usureCombat = (s) => {
  const u = REGLES.usure;
  return {
    // 8 novembre 2026 (audit) : avant, `<=` faisait partir l'usure un tour trop tard (attaques au tour 13 au lieu du 12 décidé)
    soins: s.tour < u.soinsDes ? 1 : Math.max(0, 1 - (s.tour - u.soinsDes + 1) / u.soinsSur),
    attaque: s.tour < u.attaqueDes ? 1 : 1 + u.attaqueParTour * (s.tour - u.attaqueDes + 1)
  };
};
var eboulis = (s) => Math.max(1, Math.round(2 * (s.forceBase ?? s.ennemi.force)));
var tousEnnemis = (s) => s.autres?.length ? [s.ennemi, ...s.autres].sort((a, b) => (a.rang ?? 0) - (b.rang ?? 0)) : [s.ennemi];
var ennemisDebout = (s) => tousEnnemis(s).filter((e) => e.pv > 0);
var enGroupe = (s) => !!s.autres?.length;
var intentionDe = (s, en) => en === s.ennemi ? s.intention : en.intention ?? { type: "boost" };
var fixerIntention = (s, en, it) => {
  if (en === s.ennemi) s.intention = it;
  else en.intention = it;
};
function viser(s, rang2) {
  if (!s.autres?.length || (s.ennemi.rang ?? 0) === rang2) return { ok: false };
  const k = s.autres.findIndex((e) => e.rang === rang2);
  if (k < 0 || s.autres[k].pv <= 0) return { ok: false };
  const nouveau = s.autres[k];
  const ancien = s.ennemi;
  ancien.intention = s.intention;
  s.intention = nouveau.intention ?? { type: "boost" };
  delete nouveau.intention;
  s.autres[k] = ancien;
  s.ennemi = nouveau;
  return { ok: true };
}
function viserSuivant(s) {
  const r = s.autres?.filter((e) => e.pv > 0).sort((a, b) => (a.rang ?? 0) - (b.rang ?? 0))[0];
  return !!r && viser(s, r.rang ?? 0).ok;
}
function ajouter(s, uid) {
  if (s.issue !== "en-cours") return { ok: false };
  const g = s.main.find((x2) => x2.uid === uid);
  if (!g) return { ok: false };
  if (g.vide) return { ok: false, message: t("Une place vide ne se joue pas : confie une carte de plus \xE0 ce Porteur.") };
  delete g.accorde;
  if (placesCarte(s, g) > placesLibres(s)) {
    const debut = g.lourd ? t`${g.nom} prend 2 places, il n’en reste ${placesLibres(s)}.` : t("La cha\xEEne est pleine.");
    const fin2 = s.flux > 0 && capacite(s) < REGLES.capaciteMax ? t(" Retire une carte ou d\xE9pense 1 Flux (+1 place).") : t(" Retire une carte.");
    log2(s, debut + fin2, false);
    return { ok: false, message: debut + fin2 };
  }
  const voix = voixRefusee(s, g);
  if (voix) {
    log2(s, voix, false);
    return { ok: false, message: voix };
  }
  s.main = s.main.filter((x2) => x2 !== g);
  if (g.fs && g.fs.length > 1) g.f = meilleureFrequence(s.chaine, g.fs);
  if (soigneUnSeul(g)) g.cible = cibleConseillee(s);
  else delete g.cible;
  s.chaine.push(g);
  return { ok: true };
}
function voixRefusee(s, g) {
  if (!s.monoLignee || !g.porteur) return null;
  const l = ligneeGeste(g);
  const autre = s.chaine.find((x2) => x2.porteur && ligneeGeste(x2) !== l);
  return autre ? t`Une seule voix : cette chaîne joue déjà les ${NOMS_LIGNEE[ligneeGeste(autre)].nom}.` : null;
}
var brumeActive = (s) => s.condition === "brouillard" && s.issue === "en-cours" && !(s.marques?.lecture && s.tour === 1);
var soigneUnSeul = (g) => g.type === "soin" && g.effet?.type !== "vague" && g.effet?.type !== "debord";
function cibleConseillee(s) {
  const coups = /* @__PURE__ */ new Map();
  if (brumeActive(s)) return plusBlesse(s)?.id;
  for (const en of ennemisDebout(s)) {
    const it = intentionDe(s, en);
    if (it.type === "atk" && !it.zone && it.cibleId) coups.set(it.cibleId, (coups.get(it.cibleId) ?? 0) + it.v * puissance(en));
  }
  for (const [id, v2] of coups) {
    const p = s.porteurs.find((x2) => x2.id === id && x2.pv > 0);
    if (p && p.pv - v2 <= p.pvMax * 0.3) return p.id;
  }
  return plusBlesse(s)?.id;
}
function cibler(s, uid, porteurId) {
  const g = s.chaine.find((x2) => x2.uid === uid);
  if (!g || !soigneUnSeul(g)) return { ok: false };
  const debout = vivants(s).map((p) => p.id);
  if (porteurId) {
    if (!debout.includes(porteurId)) return { ok: false };
    g.cible = porteurId;
  } else g.cible = debout[(debout.indexOf(g.cible ?? "") + 1) % debout.length];
  return { ok: true };
}
function coupSur(s, en, porteurId) {
  const it = intentionDe(s, en);
  if (s.ombre || it.type !== "atk" || !it.zone && it.cibleId !== porteurId) return 0;
  return Math.round(it.v * puissance(en) * usureCombat(s).attaque * avantage(ligneeEnnemi(en), porteurDef(porteurId).lignee));
}
function reservePour(s, porteurId, ennemis) {
  return porteurId ? ennemis.reduce((t2, en) => t2 + coupSur(s, en, porteurId), 0) : 0;
}
function porteursVises(s) {
  return vivants(s).filter((p) => ennemisDebout(s).some((en) => coupSur(s, en, p.id) > 0 || intentionDe(s, en).type === "atk" && intentionDe(s, en).cibleId === p.id));
}
function protegeDe(s) {
  const debout = vivants(s);
  if (s.protege && debout.some((p) => p.id === s.protege)) return s.protege;
  if (brumeActive(s)) return plusBlesse(s)?.id;
  const vises = porteursVises(s);
  if (!vises.length) return plusBlesse(s)?.id;
  const reste = (p) => (p.pv - reservePour(s, p.id, ennemisDebout(s))) / p.pvMax;
  return vises.sort((a, b) => reste(a) - reste(b))[0]?.id;
}
function proteger(s, porteurId) {
  if (s.issue !== "en-cours" || !vivants(s).some((p) => p.id === porteurId)) return { ok: false };
  s.protege = porteurId;
  return { ok: true };
}
function ordreZone(s, debout) {
  const id = protegeDe(s);
  const p = debout.find((x2) => x2.id === id);
  return p ? [p, ...debout.filter((x2) => x2 !== p)] : debout;
}
var bouclierPour = (bouclier, porteurId, protege, reserve) => porteurId === protege ? bouclier : Math.max(0, bouclier - reserve);
var RESERVE = 0;
function soignerVers(s, porteurId) {
  if (s.issue !== "en-cours" || !vivants(s).some((p) => p.id === porteurId)) return { ok: false };
  const soins = s.chaine.filter(soigneUnSeul);
  if (!soins.length) return { ok: false };
  for (const g of soins) g.cible = porteurId;
  return { ok: true };
}
function accorder(s, uid, f) {
  if (s.issue !== "en-cours") return { ok: false };
  const g = s.chaine.find((x2) => x2.uid === uid);
  if (!g || !g.fs || g.fs.length < 2) return { ok: false };
  const k = g.fs.indexOf(g.f);
  g.f = f !== void 0 && g.fs.includes(f) ? f : g.fs[(k + 1) % g.fs.length];
  g.accorde = true;
  return { ok: true };
}
function retirer(s, uid) {
  const g = s.chaine.find((x2) => x2.uid === uid);
  if (!g) return { ok: false };
  s.chaine = s.chaine.filter((x2) => x2 !== g);
  if (g.fs) g.f = g.fs[0];
  delete g.accorde;
  s.main.push(g);
  s.chaine.forEach((x2, i) => {
    if (x2.fs && x2.fs.length > 1 && !x2.accorde) x2.f = meilleureFrequence(s.chaine.slice(0, i), x2.fs);
  });
  return { ok: true };
}
function deplacer(s, uid, vers) {
  if (s.issue !== "en-cours") return { ok: false };
  const de = s.chaine.findIndex((x2) => x2.uid === uid);
  if (de < 0) return { ok: false };
  const a = Math.max(0, Math.min(s.chaine.length - 1, vers));
  if (a === de) return { ok: false };
  const [g] = s.chaine.splice(de, 1);
  s.chaine.splice(a, 0, g);
  s.chaine.forEach((x2, i) => {
    if (x2.fs && x2.fs.length > 1 && !x2.accorde) x2.f = meilleureFrequence(s.chaine.slice(0, i), x2.fs);
  });
  return { ok: true };
}
function viderChaine(s) {
  for (const g of s.chaine) {
    if (g.fs) g.f = g.fs[0];
    delete g.accorde;
  }
  s.main.push(...s.chaine);
  s.chaine = [];
}
function allonger(s) {
  if (s.flux < 1 || capacite(s) >= REGLES.capaciteMax) return { ok: false };
  s.flux--;
  s.capaBonus++;
  log2(s, t("Flux d\xE9pens\xE9 : la cha\xEEne gagne une place ce tour-ci."), { sorte: "flux" });
  return { ok: true };
}
function repiocher(s) {
  if (s.issue !== "en-cours" || s.flux < 1) return { ok: false };
  s.flux--;
  for (const g of s.chaine) if (g.fs) g.f = g.fs[0];
  s.defausse.push(...s.main, ...s.chaine);
  s.main = [];
  s.chaine = [];
  piocher(s);
  log2(s, t("Flux d\xE9pens\xE9 : nouvelle main (la main et la cha\xEEne pos\xE9e partent \xE0 la d\xE9fausse)."), { sorte: "flux" });
  return { ok: true };
}
var peutRelancer = (s) => s.issue === "en-cours" && s.tour === 1 && !s.relance;
function relancerMain(s) {
  if (!peutRelancer(s)) return { ok: false };
  for (const g of s.chaine) if (g.fs) g.f = g.fs[0];
  const n = s.main.length + s.chaine.length;
  s.pioche = tireur(s).melanger([...s.pioche, ...s.main, ...s.chaine]);
  s.main = [];
  s.chaine = [];
  s.relance = true;
  piocher(s, n);
  log2(s, t("Premi\xE8re main relanc\xE9e."), { sorte: "flux" });
  return { ok: true };
}
var mainBloquee = (s) => s.issue === "en-cours" && !s.chaine.length && s.main.every((g) => g.vide || placesCarte(s, g) > placesLibres(s) || !!voixRefusee(s, g));
function lancer(s, opts = {}) {
  const pas = [];
  if (s.issue !== "en-cours" || !s.chaine.length && !mainBloquee(s)) return pas;
  if (!s.chaine.length && !opts.apercu) log2(s, t("Aucune carte ne peut entrer dans la cha\xEEne : tu passes ton tour."), { sorte: "info" });
  const emettre = opts.apercu ?? (opts.silencieux ? () => {
  } : (ev) => {
    pas.push({ ev, etat: photo(s) });
  });
  CAMP = "joueur";
  const analyse = analyserChaine(s.chaine);
  const brut = s.condition === "echo" && analyse.suite === 4 ? { ...analyse, mult: REGLES.multSuite[5] } : analyse;
  const brouille = !!(s.dissonance || s.sansResonance);
  const a = brouille ? sansResonance(brut, !!s.dissonance) : brut;
  const freqs = frequencesEffectives(s.chaine);
  noterChaine(s, freqs, a.suite >= 3 ? a : void 0, brouille && (brut.suite >= 3 || brut.echo && !a.echo), a.echo, a.echoN);
  BROUILLE = !!s.dissonance;
  if (brouille && (brut.suite >= 3 || brut.echo && !a.echo)) {
    log2(s, s.dissonance ? t("Fr\xE9quences brouill\xE9es : ni R\xE9sonance ni \xC9cho ce tour-ci.") : t("Fr\xE9quences brouill\xE9es : pas de R\xE9sonance ce tour-ci."), { sorte: "effet" });
    emettre({ kind: "effet", cible: "escouade", texte: t("Brouill\xE9") });
  }
  s.dissonance = false;
  if (a.suite >= 3) {
    log2(s, t`Résonance ! Suite de ${a.suite} : effets +${Math.round((a.mult - 1) * 100)} %.`, { sorte: "effet" });
    emettre({ kind: "resonance", suite: a.suite, mult: a.mult });
  }
  if (a.echo) {
    const n = a.echoN ?? 3;
    log2(s, t`${nomEcho(n)} ! ${n === 5 ? t("Cinq") : n === 4 ? t("Quatre") : t("Trois")} Fréquences identiques : ces cartes ${pctEcho(n)}.`, { sorte: "effet" });
    emettre({ kind: "echo", n });
  }
  FLUX_FELURE = false;
  delete s.tenace;
  for (const [i, g] of s.chaine.entries()) {
    RANG = i;
    FELURE_FAITE = false;
    emettre({ kind: "carte", rang: i, total: s.chaine.length, lignee: ligneeGeste(g), type: g.type, porteur: g.porteur, suite: a.suite, ...g.effet ? { effet: g.effet.type } : {} });
    for (const ev of appliquer(s, g, a.mult, i, a.suite)) emettre(ev);
    const fele = FELURE_FAITE ? void 0 : ciblePourFelure(s, freqs[i]);
    if (fele) {
      briser(s, fele, emettre, a.suite >= 3 && !FLUX_FELURE);
      FLUX_FELURE = true;
    }
    phaseGardien(s, s.ennemi, emettre);
    if (s.ennemi.pv <= 0) tombe(s, s.ennemi, emettre);
    if (s.ennemi.pv <= 0) {
      if (i < s.chaine.length - 1 && viserSuivant(s)) {
        log2(s, t`La chaîne passe à ${ennemiDef(s.ennemi.id).nom}.`);
        emettre({ kind: "cible", rang: s.ennemi.rang ?? 0 });
      } else break;
    }
  }
  RANG = void 0;
  BROUILLE = false;
  for (const en of tousEnnemis(s)) {
    const l = en.frappe;
    delete en.frappe;
    if (!l || en.pv <= 0 || l === ligneeEnnemi(en)) continue;
    en.assimile = l;
    log2(s, t`${ennemiDef(en.id).nom} assimile ton dernier coup : le voilà ${NOMS_LIGNEE[l].nom}.`, { sorte: "effet" });
    emettre({ kind: "effet", cible: "escouade", texte: t("Assimilation") });
  }
  const gain = (a.suite >= 3 ? 1 : 0) + (a.echo ? 1 : 0) + ((a.echoN ?? 0) >= 5 ? REGLES.fluxEcho5 : 0);
  if (gain) {
    const avant = s.flux;
    s.flux = Math.min(REGLES.fluxMax, s.flux + gain);
    if (s.flux > avant) {
      log2(s, t`La Résonance remplit le Flux (+${s.flux - avant}).`, { sorte: "flux" });
      emettre({ kind: "flux", gain: s.flux - avant });
    }
  }
  if (opts.apercu && !opts.riposte) return pas;
  CAMP = "neutre";
  s.debride = false;
  for (const g of s.chaine) if (g.fs) g.f = g.fs[0];
  const rappel = s.chaine.find((g, i) => effetsEnJeu(g, s.chaine, i, estATerre(s, g.porteur), avantEteinte(s, s.chaine, i)).some((e) => e?.type === "rappel"));
  const rappelee = rappel ? s.chaine.filter((g) => g !== rappel && !g.vide && !g.epuise && g.effet?.type !== "rappel").sort((a2, b) => b.v - a2.v)[0] : void 0;
  s.defausse.push(...s.chaine.filter((g) => g !== rappelee && !g.epuise));
  if (rappelee) {
    s.pioche.push(rappelee);
    log2(s, t`Rappel : ${rappelee.nom} revient en tête de pioche.`, { sorte: "effet" });
    emettre({ kind: "effet", cible: "escouade", texte: t("Rappel") });
  }
  s.chaine = [];
  s.defausse.push(...s.main.filter((g) => g.vide));
  s.main = s.main.filter((g) => !g.vide);
  s.capaBonus = Math.min(REGLES.capaciteMax - REGLES.capaciteBase, (s.capaProchain ?? 0) + (s.tour === 1 ? s.marques?.places2 ?? 0 : 0));
  s.capaProchain = 0;
  for (const en of tousEnnemis(s)) {
    if (en.fissureTours) {
      en.fissureTours--;
      if (!en.fissureTours) en.fissure = 0;
    }
  }
  if (s.ennemi.pv <= 0) viserSuivant(s);
  if (!ennemisDebout(s).length) {
    victoire(s, emettre);
    CAMP = "joueur";
    return pas;
  }
  tourEnnemi(s, emettre);
  if (s.chrono && s.issue === "en-cours" && s.tour > s.chrono) {
    s.issue = "defaite";
    log2(s, t`${ennemiDef(s.ennemi.id).nom} s’éteint dans le noir avant de tomber : l’Épreuve est manquée.`, { camp: "neutre", sorte: "info" });
    emettre({ kind: "fin", issue: "defaite" });
  }
  if (s.fuyard && s.issue === "en-cours" && s.tour > s.fuyard) {
    s.issue = "victoire";
    s.enfui = true;
    log2(s, t`${ennemiDef(s.ennemi.id).nom} s’enfuit dans le noir. Ses blessures resteront.`, { camp: "neutre", sorte: "info" });
    emettre({ kind: "fin", issue: "victoire" });
  }
  CAMP = "joueur";
  return pas;
}
function log2(s, t2, info = {}) {
  s.journal.unshift(t2);
  s.journal = s.journal.slice(0, 6);
  if (info === false) return;
  const l = { camp: CAMP, sorte: "info", ...info, texte: t2 };
  if (RANG !== void 0 && l.camp === "joueur" && l.rang === void 0) l.rang = RANG;
  tourHisto(s).lignes.push(l);
}
var HISTO_MAX = 30;
var CAMP = "joueur";
var RANG;
var FELURE_FAITE = false;
var FLUX_FELURE = false;
function tourHisto(s) {
  const h = s.historique ??= [];
  let t2 = h[h.length - 1];
  if (!t2 || t2.tour !== s.tour) {
    t2 = { tour: s.tour, chaine: [], lignes: [] };
    h.push(t2);
    if (h.length > HISTO_MAX) h.splice(0, h.length - HISTO_MAX);
  }
  return t2;
}
function noterChaine(s, freqs, reso, brouille, echo, echoN) {
  const t2 = tourHisto(s);
  t2.chaine = s.chaine.map((g, i) => {
    const c2 = { nom: g.nom, porteur: g.porteur, type: g.type, v: g.v, f: freqs[i] ?? g.f };
    if (g.carte) c2.carte = g.carte;
    if (g.lourd) c2.lourd = true;
    if (g.effet) c2.effet = g.effet;
    if (g.effet2) c2.effet2 = g.effet2;
    if (estATerre(s, g.porteur)) c2.eteinte = true;
    return c2;
  });
  if (reso) {
    t2.suite = reso.suite;
    t2.mult = reso.mult;
  }
  if (echo) t2.echo = true;
  if (echo && echoN && echoN > 3) t2.echoN = echoN;
  if (brouille) t2.brouille = true;
}
var ennemisVaincus = (s) => enGroupe(s) ? t("Le groupe est vaincu.") : t`${ennemiDef(s.ennemi.id).nom} tombe.`;
var arrondi2 = (x2) => Math.round(x2 * 100) / 100;
var calcul = (cible, base, lignes, brut, absorbe, net) => ({ cible, base: Math.round(base), lignes: lignes.map((l) => l.m !== void 0 ? { nom: l.nom, m: arrondi2(l.m) } : l), brut, absorbe, net });
var tailleMainDe = (_s) => REGLES.tailleMain;
function piocher(s, taille = tailleMainDe(s)) {
  const r = tireur(s);
  let garde2 = 0;
  while (s.main.length < taille && garde2++ < 80) {
    if (!s.pioche.length) {
      if (!s.defausse.length) break;
      s.pioche = r.melanger(s.defausse);
      s.defausse = [];
    }
    s.main.push(s.pioche.pop());
  }
}
function choisirCible(s, regle = "hasard") {
  const v2 = vivants(s);
  if (!v2.length) return null;
  if (regle === "faible") {
    return v2.slice().sort((a, b) => a.pv / a.pvMax - b.pv / b.pvMax)[0].id;
  }
  if (regle !== "hasard") {
    const p = v2.find((x2) => x2.id === regle) ?? v2.find((x2) => porteurDef(x2.id).lignee === regle);
    if (p) return p.id;
  }
  return v2[tireur(s).entier(v2.length)].id;
}
function choisirIntention(s, en) {
  const e = ennemiDef(en.id);
  const motif = en.role ? MOTIFS_ROLE[en.role] : en.phase2 && e.phase ? e.phase.motif : e.motif;
  const m = motif[en.etape % motif.length];
  en.etape++;
  const seuls = en.role === "invocateur" && ennemisDebout(s).filter((x2) => x2 !== en).length < 2;
  const it = seuls ? { type: "appel", nom: t("Appel") } : { ...m };
  if (it.type === "atk" || it.type === "bouclier" || it.type === "soin") it.v = Math.round(it.v * en.force);
  if (it.type === "atk" && !it.zone) it.cibleId = choisirCible(s, it.cible);
  if (it.type === "atk" && s.desarme && !en.retenu) {
    it.v = Math.round(it.v * (1 - s.desarme));
    en.retenu = true;
    it.retenue = true;
  }
  if (it.type === "atk" && en.trouble) {
    it.v = Math.round(it.v * (1 - en.trouble));
    delete en.trouble;
  }
  fixerIntention(s, en, it);
}
function victoire(s, emettre) {
  s.issue = "victoire";
  log2(s, ennemisVaincus(s), { camp: "neutre", sorte: "info" });
  const blesse = vivants(s).filter((p) => p.pv < p.pvMax).sort((a, b) => a.pv / a.pvMax - b.pv / b.pvMax)[0];
  if (s.marques?.soinQuai && s.bouclier > 0 && blesse && usureCombat(s).soins > 0) {
    const avant = blesse.pv;
    blesse.pv = Math.min(blesse.pvMax, blesse.pv + Math.max(1, Math.round(s.bouclier * s.marques.soinQuai)));
    log2(s, t`Bras de quai : le bouclier restant soigne ${porteurDef(blesse.id).nom} (+${blesse.pv - avant}).`, { camp: "neutre", sorte: "soin", v: blesse.pv - avant });
    emettre({ kind: "soin", cible: blesse.id, v: blesse.pv - avant });
  }
  emettre({ kind: "fin", issue: "victoire" });
}
function plusBlesse(s) {
  return vivants(s).sort((a, b) => a.pv / a.pvMax - b.pv / b.pvMax)[0];
}
function appliquer(s, g, mult, rang2, suite = 0) {
  const nomP = g.porteur ? porteurDef(g.porteur).nom : t("Sp\xE9cial");
  const eteinte = estATerre(s, g.porteur);
  const effets = effetsEnJeu(g, s.chaine, rang2, eteinte, avantEteinte(s, s.chaine, rang2));
  const de = (t2) => effets.find((e) => e?.type === t2);
  const evs = [];
  const copie = !eteinte && g.effet?.type === "empreinte" ? effets[0] : void 0;
  if (copie) {
    log2(s, t`Empreinte : ${g.nom} reprend l’effet de la carte d’avant (${NOMS_EFFET[copie.type]}).`, { sorte: "effet" });
    evs.push({ kind: "effet", cible: "escouade", texte: t("Empreinte") });
  }
  const st = de("surtension");
  const payeur = st ? s.porteurs.find((p) => p.id === g.porteur && peutPayerSurtension(p)) : void 0;
  if (st && payeur) {
    const prix = Math.min(payeur.pv - 1, Math.max(1, Math.round(payeur.pvMax * st.cout)));
    payeur.pv -= prix;
    log2(s, t`Surtension : ${porteurDef(payeur.id).nom} brûle ${prix} PV, +${Math.round(st.part * 100)} % de force.`, { sorte: "blessure", v: prix });
    evs.push({ kind: "degats", cible: payeur.id, net: prix, absorbe: 0, source: "surtension" });
  }
  if (de("rapt") && s.ennemi.pv > 0 && s.ennemi.bouclier > 0) {
    const pris = s.ennemi.bouclier;
    s.ennemi.bouclier = 0;
    s.bouclier += pris;
    log2(s, t`Rapt : ${pris} de bouclier arrachés à l’ennemi, pour l’escouade.`, { sorte: "protection", v: pris });
    evs.push({ kind: "bouclier", cible: "escouade", v: pris });
  }
  if (de("breche") && s.ennemi.pv > 0 && s.ennemi.bouclier > 0) {
    const brise = s.ennemi.bouclier;
    s.ennemi.bouclier = 0;
    log2(s, t`Brèche : ${brise} de bouclier ennemi brisés.`, { sorte: "effet" });
    evs.push({ kind: "effet", cible: "ennemi", texte: t("Br\xE8che") });
  }
  if (de("pioche")) s.piocheProchain = 1;
  if (de("lecture") && s.ennemi.pv > 0 && s.ennemi.felure !== void 0 && !s.ennemi.felureBrisee) {
    briser(s, s.ennemi, (ev) => evs.push(ev), suite >= 3 && !FLUX_FELURE);
    FELURE_FAITE = true;
    FLUX_FELURE = true;
  }
  if (de("lecture")?.zone) {
    for (const en of ennemisDebout(s)) if (en !== s.ennemi && en.felure !== void 0 && !en.felureBrisee) briser(s, en, (ev) => evs.push(ev), false);
    FELURE_FAITE = true;
  }
  const dc = de("decharge");
  const vide = dc ? Math.min(s.flux, dc.max ?? REGLES.fluxMax) : 0;
  const facteurs = facteursGeste(s, g, mult, rang2, s.chaine, eteinte, suite, !!payeur);
  if (dc && vide) {
    s.flux -= vide;
    log2(s, t`Décharge : ${vide} Flux ${dc.max ? "pris" : t("vid\xE9")}${vide > 1 ? "s" : ""}, +${Math.round(dc.part * vide * 100)} % de force.`, { sorte: "flux" });
    evs.push({ kind: "effet", cible: "escouade", texte: t("D\xE9charge") });
  } else if (dc?.recharge && !vide) {
    const avant = s.flux;
    s.flux = Math.min(REGLES.fluxMax, s.flux + dc.recharge);
    if (s.flux > avant) {
      log2(s, t`Décharge : le Flux était vide, ${g.nom} le remplit (+${s.flux - avant}).`, { sorte: "flux" });
      evs.push({ kind: "flux", gain: s.flux - avant });
    }
  }
  const faveur = s.condition && FAVEUR_CONDITION[s.condition] === ligneeGeste(g) ? 1.2 : 1;
  const percant = !!de("percant");
  const force = facteurs.reduce((f, x2) => f * x2.m, g.v);
  const frapper = (force2, quoi, depart) => {
    const coup = facteursCoup(s, g, mult, percant, effets);
    const av = coup.av;
    const dmg = Math.max(0, Math.round(coup.facteurs.reduce((f, x2) => f * x2.m, force2)) - coup.blinde);
    const abs = percant ? 0 : Math.min(s.ennemi.bouclier, dmg);
    s.ennemi.bouclier -= abs;
    const net = dmg - abs;
    s.ennemi.pv = Math.max(0, s.ennemi.pv - net);
    const lignes = [...depart.lignes, ...coup.facteurs, ...coup.blinde ? [{ nom: t("Blind\xE9"), v: -coup.blinde }] : [], ...percant ? [{ nom: t("Per\xE7ant"), v: 0 }] : []];
    log2(
      s,
      t`${nomP} · ${quoi} : ${net} dégâts${av > 1 ? t(" (avantage de lign\xE9e)") : ""}${abs ? t`, ${abs} absorbés` : ""}${percant && s.ennemi.bouclier ? t(", bouclier transperc\xE9") : ""}.`,
      { sorte: "coup", v: net, calculs: [calcul(ennemiDef(s.ennemi.id).nom, depart.base, lignes, dmg, abs, net)] }
    );
    evs.push({ kind: "degats", cible: "ennemi", net, absorbe: abs, rang: s.ennemi.rang ?? 0 });
    const lg = ligneeGeste(g);
    if (lg !== "neutre" && trait(s.ennemi, "assimilation")) s.ennemi.frappe = lg;
    const epines = trait(s.ennemi, "epines");
    const frappeur = epines && net > 0 ? s.porteurs.find((p) => p.id === g.porteur && p.pv > 1) : void 0;
    if (epines && frappeur) {
      const retour = Math.min(frappeur.pv - 1, Math.max(1, Math.round(net * epines.part)));
      frappeur.pv -= retour;
      log2(s, t`Épines : ${porteurDef(frappeur.id).nom} se blesse (−${retour}).`, { camp: "ennemi", sorte: "blessure", v: retour });
      evs.push({ kind: "degats", cible: frappeur.id, net: retour, absorbe: 0, source: "epines" });
    }
    return net;
  };
  const frapperGroupe = (force2, quoi, autres = false) => {
    const vise = s.ennemi;
    for (const en of ennemisDebout(s)) {
      if (autres && en === vise) continue;
      s.ennemi = en;
      evs.push({ kind: "effet", cible: "ennemi", texte: quoi.includes("Rafale") ? t("Rafale") : t("Souffle"), rang: en.rang ?? 0 });
      frapper(force2, quoi, { base: g.v, lignes: facteurs });
      if (en !== vise) {
        phaseGardien(s, en, (ev) => evs.push(ev));
        if (en.pv <= 0) tombe(s, en, (ev) => evs.push(ev));
      }
    }
    s.ennemi = vise;
  };
  if (g.type === "atk") {
    const net = frapper(force, g.nom, { base: g.v, lignes: facteurs });
    const rf = de("rafale");
    const salves = !rf ? 0 : rf.cadence ? Math.max(0, s.chaine.length - 3) : s.chaine.length >= (rf.min ?? 4) ? 1 : 0;
    for (let k = 0; k < salves; k++) {
      if (rf?.zone) {
        frapperGroupe(force, `${g.nom} (Rafale)`);
        continue;
      }
      if (s.ennemi.pv <= 0) break;
      evs.push({ kind: "effet", cible: "ennemi", texte: t("Rafale"), rang: s.ennemi.rang ?? 0 });
      frapper(force, `${g.nom} (Rafale)`, { base: g.v, lignes: facteurs });
    }
    if (de("crescendo")?.zone) frapperGroupe(force / 2, `${g.nom} (souffle)`, true);
    const ex = de("execution");
    if (ex && s.ennemi.pv > 0 && !estGardien(s.ennemi.id) && s.ennemi.pv <= s.ennemi.pvMax * ex.part) {
      const reste = s.ennemi.pv;
      s.ennemi.pv = 0;
      log2(s, t`Exécution : ${ennemiDef(s.ennemi.id).nom} n’avait plus que ${reste} PV, il tombe.`, { sorte: "coup", v: reste });
      evs.push({ kind: "effet", cible: "ennemi", texte: t("Ex\xE9cution"), rang: s.ennemi.rang ?? 0 });
      evs.push({ kind: "degats", cible: "ennemi", net: reste, absorbe: 0, rang: s.ennemi.rang ?? 0 });
    }
    const si = de("siphon");
    if (si && net > 0) {
      const lui = s.porteurs.find((p) => p.id === g.porteur && p.pv > 0);
      const rendre = (c2, v2) => {
        const avant = c2.pv;
        c2.pv = Math.min(c2.pvMax, c2.pv + v2);
        if (c2.pv > avant) {
          log2(s, t`Siphon : ${porteurDef(c2.id).nom} récupère ${c2.pv - avant} PV.`, { sorte: "soin", v: c2.pv - avant });
          evs.push({ kind: "soin", cible: c2.id, v: c2.pv - avant });
        }
        return v2 - (c2.pv - avant);
      };
      const total = Math.round(net * si.part);
      if (si.mode === "meute") {
        const tous = vivants(s);
        for (const c2 of tous) rendre(c2, Math.round(total / tous.length));
      } else {
        const c2 = lui ?? plusBlesse(s);
        const reste = c2 ? rendre(c2, total) : 0;
        const autre = si.mode === "trop" && reste > 0 ? plusBlesse(s) : void 0;
        if (autre && autre !== c2) rendre(autre, reste);
      }
    }
  } else if (g.type === "bouclier") {
    const v2 = Math.round(force);
    s.bouclier += v2;
    log2(s, t`${nomP} · ${g.nom} : bouclier d’escouade +${v2}.`, { sorte: "protection", v: v2, calculs: [calcul(t("Escouade"), g.v, facteurs, v2, 0, v2)] });
    evs.push({ kind: "bouclier", cible: "escouade", v: v2 });
    const rp = de("riposte");
    if (rp && s.ennemi.pv > 0) {
      const lignes = [{ nom: t`Riposte (${Math.round(rp.part * 100)} % du bouclier)`, m: rp.part }];
      if (faveur !== 1) lignes.push({ nom: CONDITIONS[s.condition]?.nom ?? t("Salle favorable"), m: faveur });
      if (s.debride) lignes.push({ nom: t("D\xE9bridage"), m: REGLES.eclat.debride });
      frapper(s.bouclier * rp.part * faveur * (s.debride ? REGLES.eclat.debride : 1), `${g.nom} (Riposte)`, { base: s.bouclier, lignes });
      if (rp.vide && s.bouclier > 0) {
        log2(s, t`Riposte : tout le bouclier d’escouade part dans le coup (${s.bouclier}).`, { sorte: "effet" });
        s.bouclier = 0;
      }
    }
  } else {
    const aTerre = de("releve") ? s.porteurs.find((p) => p.pv <= 0) : void 0;
    if (aTerre) {
      aTerre.pv = Math.max(1, Math.min(aTerre.pvMax, Math.round(force)));
      aTerre.aTerre = false;
      if (g.unique) g.epuise = true;
      log2(s, t`Relève : ${porteurDef(aTerre.id).nom} se relève avec ${aTerre.pv} PV.`, { sorte: "soin", v: aTerre.pv, calculs: [calcul(porteurDef(aTerre.id).nom, g.v, facteurs, aTerre.pv, 0, aTerre.pv)] });
      evs.push({ kind: "soin", cible: aTerre.id, v: aTerre.pv });
    }
    const choisi = g.cible ? s.porteurs.find((p) => p.id === g.cible && p.pv > 0) : void 0;
    const cibles = aTerre ? [] : de("vague") || de("debord") ? vivants(s) : [choisi ?? plusBlesse(s)].filter((x2) => !!x2);
    const morceaux = [];
    const calculs = [];
    let total = 0;
    let trop = 0;
    for (const c2 of cibles) {
      const avant = c2.pv;
      c2.pv = Math.min(c2.pvMax, c2.pv + Math.round(force));
      morceaux.push(`${porteurDef(c2.id).nom} +${c2.pv - avant}`);
      const perdu = Math.round(force) - (c2.pv - avant);
      trop += perdu;
      calculs.push(calcul(porteurDef(c2.id).nom, g.v, perdu > 0 ? [...facteurs, { nom: t("PV d\xE9j\xE0 pleins"), v: -perdu }] : facteurs, c2.pv - avant, 0, c2.pv - avant));
      total += c2.pv - avant;
      evs.push({ kind: "soin", cible: c2.id, v: c2.pv - avant });
    }
    if (!cibles.length && !aTerre) evs.push({ kind: "soin", cible: "escouade", v: 0 });
    else if (cibles.length) log2(s, `${nomP} \xB7 ${g.nom} : ${morceaux.join(", ")} PV.`, { sorte: "soin", v: total, calculs });
    if (de("debord") && trop > 0) {
      trop = Math.round(trop * (de("debord").x ?? 1));
      s.bouclier += trop;
      log2(s, t`Débord : le soin en trop devient ${trop} de bouclier d’escouade.`, { sorte: "protection", v: trop });
      evs.push({ kind: "bouclier", cible: "escouade", v: trop });
    }
  }
  for (const ef of effets) {
    if (ef?.type === "flux") {
      const avant = s.flux;
      s.flux = Math.min(REGLES.fluxMax, s.flux + ef.v);
      if (s.flux > avant) {
        log2(s, t`Surcharge : Flux +${s.flux - avant}.`, { sorte: "flux" });
        evs.push({ kind: "flux", gain: s.flux - avant });
      }
    } else if (ef?.type === "desarmer" && ef.zone) {
      for (const en of ennemisDebout(s)) {
        const it = en === s.ennemi ? s.intention : en.intention;
        if (it?.type !== "atk") continue;
        const avant = it.v;
        it.v = Math.round(avant * (1 - ef.part / 2));
        log2(s, t`Troublé : l’attaque annoncée ${deNom(ennemiDef(en.id).nom)} passe de ${avant} à ${it.v}.`, { sorte: "effet" });
        evs.push({ kind: "effet", cible: "ennemi", texte: "Troubl\xE9", rang: en.rang ?? 0 });
      }
    } else if (ef?.type === "desarmer" && s.intention.type === "atk") {
      const avant = s.intention.v;
      s.intention.v = ef.total ? 0 : Math.round(avant * (1 - ef.part));
      log2(s, t`Troublé : l’attaque annoncée passe de ${avant} à ${s.intention.v}.`, { sorte: "effet" });
      evs.push({ kind: "effet", cible: "ennemi", texte: "Troubl\xE9", rang: s.ennemi.rang ?? 0 });
    } else if (ef?.type === "sourdine" && s.ennemi.pv > 0 && (s.intention.type === "atk" || s.intention.type === "bouclier" || s.intention.type === "soin")) {
      const avant = s.intention.v;
      s.intention.v = Math.round(avant * (1 - ef.part));
      const quoi = s.intention.type === "atk" ? t("sa prochaine attaque") : s.intention.type === "bouclier" ? t("son bouclier") : t("son soin");
      log2(s, t`Sourdine : ${quoi} passe de ${avant} à ${s.intention.v}.`, { sorte: "effet" });
      evs.push({ kind: "effet", cible: "ennemi", texte: t("Sourdine"), rang: s.ennemi.rang ?? 0 });
    } else if (ef?.type === "fissure" && s.ennemi.pv > 0) {
      const tours = ef.tours ?? 2;
      for (const en of ef.zone ? ennemisDebout(s) : [s.ennemi]) {
        en.fissure = Math.max(en.fissure ?? 0, ef.part);
        en.fissureTours = Math.max(en.fissureTours ?? 0, tours);
        evs.push({ kind: "effet", cible: "ennemi", texte: "Fissure", rang: en.rang ?? 0 });
      }
      log2(s, ef.zone ? t`Fissure : tout le groupe subit +${Math.round(ef.part * 100)} % de dégâts jusqu’au tour prochain.` : tours > 2 ? t`Fissure : l’ennemi subit +${Math.round(ef.part * 100)} % de dégâts pendant ${tours} tours.` : t`Fissure : l’ennemi subit +${Math.round(ef.part * 100)} % de dégâts jusqu’au tour prochain.`, { sorte: "effet" });
    } else if (ef?.type === "elan") {
      const n = ef.n ?? 1;
      s.capaProchain = (s.capaProchain ?? 0) + n;
      log2(s, n > 1 ? t`Élan : la prochaine chaîne aura ${n} places de plus.` : t("\xC9lan : la prochaine cha\xEEne aura une place de plus."), { sorte: "effet" });
      evs.push({ kind: "effet", cible: "escouade", texte: "\xC9lan" });
    } else if (ef?.type === "tenacite") {
      s.tenace = true;
      log2(s, t("T\xE9nacit\xE9 : au tour ennemi, personne ne tombera."), { sorte: "effet" });
      evs.push({ kind: "effet", cible: "escouade", texte: t("T\xE9nacit\xE9") });
    } else if (ef?.type === "rempart") {
      s.garde = Math.max(s.garde ?? 0, ef.part);
      log2(s, t`Rempart : ${Math.round(ef.part * 100)} % du bouclier restant sera gardé au tour suivant.`, { sorte: "effet" });
      evs.push({ kind: "effet", cible: "escouade", texte: t("Rempart") });
    }
  }
  return evs;
}
var BROUILLE = false;
function sansResonance(a, sansEcho) {
  if (!sansEcho) return { ...a, suite: 0, mult: 1 };
  const { echoF: _f, echoN: _n, ...r } = a;
  return { ...r, suite: 0, mult: 1, echo: false };
}
function facteursGeste(s, g, mult, rang2, chaine, eteinte, suite, surtensionPayee) {
  const effets = effetsEnJeu(g, chaine, rang2, eteinte, avantEteinte(s, chaine, rang2));
  const de = (t2) => effets.find((e) => e?.type === t2);
  const f = [];
  const mettre = (nom, m) => {
    if (m !== 1) f.push({ nom, m });
  };
  mettre(t`Résonance (suite de ${suite})`, mult);
  if (!BROUILLE) {
    const n = analyserChaine(chaine).echoN ?? 3;
    mettre(t`${nomEcho(n)} (${n} Fréquences identiques)`, multEcho(chaine, rang2));
  }
  const emp = g.type === "bouclier" ? REGLES.empilement.bouclier : g.type === "soin" ? REGLES.empilement.soin : 1;
  if (emp !== 1) {
    const avant = chaine.slice(0, rang2).filter((x2) => x2.type === g.type).length;
    if (avant) mettre(t`${g.type === "bouclier" ? t("Boucliers") : t("Soins")} empilés (${avant + 1}e)`, emp ** avant);
  }
  if (REGLES.finisseur !== 1 && mult > 1 && g.type === "atk" && ligneeGeste(g) === "tech") {
    const fs = frequencesEffectives(chaine);
    const finit = rang2 >= 2 && fs[rang2 - 1] === fs[rang2] - 1 && fs[rang2 - 2] === fs[rang2] - 2 && fs[rang2 + 1] !== fs[rang2] + 1;
    if (finit) mettre(t("Finisseur (termine la suite)"), REGLES.finisseur);
  }
  if (REGLES.trioLignees !== 1 && new Set(s.porteurs.map((p) => porteurDef(p.id).lignee)).size >= 3) mettre(t("Trois lign\xE9es"), REGLES.trioLignees);
  const cr = de("crescendo");
  if (cr) mettre(t`Crescendo (${rang2 + 1}e de la chaîne)`, 1 + cr.part * rang2);
  if (s.condition && FAVEUR_CONDITION[s.condition] === ligneeGeste(g)) mettre(CONDITIONS[s.condition]?.nom ?? t("Salle favorable"), 1.2);
  if (s.condition === "sanctuaire" && g.type === "soin") mettre(CONDITIONS.sanctuaire.nom, 1.3);
  if (s.debride && g.type === "atk") mettre(t("D\xE9bridage"), REGLES.eclat.debride);
  const sc = de("secours");
  const tombes = s.porteurs.filter((p) => p.pv <= 0).length;
  if (sc && tombes) mettre(t`Secours (${tombes} à terre)`, 1 + sc.part * tombes);
  const dc = de("decharge");
  const pris = dc ? Math.min(s.flux, dc.max ?? REGLES.fluxMax) : 0;
  if (dc) mettre(t`Décharge (${pris} Flux)`, 1 + dc.part * pris);
  const prec = rang2 > 0 ? chaine[rang2 - 1] : void 0;
  const am = prec ? effetsEnJeu(prec, chaine, rang2 - 1, estATerre(s, prec.porteur), avantEteinte(s, chaine, rang2 - 1)).find((e) => e?.type === "amorce") : void 0;
  if (am) mettre(t`Amorce (${prec.nom})`, 1 + am.part);
  const un = de("unisson");
  if (un) {
    const fs = frequencesEffectives(chaine);
    const pareilles = fs.filter((x2, k) => k !== rang2 && x2 === fs[rang2]).length;
    const toute = !un.toute || fs.every((x2) => x2 === fs[rang2]);
    if (toute) mettre(t`Unisson (${pareilles} même${pareilles > 1 ? "s" : ""} Fréquence${pareilles > 1 ? "s" : ""})`, 1 + un.part * pareilles);
  }
  const cp = de("contrepoint");
  if (cp && mult > 1) {
    const autres = ligneesDeSuite(chaine, rang2);
    autres.delete(ligneeGeste(g));
    if (autres.size) mettre(t`Contrepoint (${autres.size} autre${autres.size > 1 ? "s" : ""} lignée${autres.size > 1 ? "s" : ""} dans la suite)`, 1 + cp.part * autres.size);
  }
  if (cp?.exige) {
    const l = mult > 1 ? ligneesDeSuite(chaine, rang2) : /* @__PURE__ */ new Set();
    l.delete("neutre");
    if (l.size < 3) mettre(t("Contrepoint : pas les trois lign\xE9es"), 0.5);
  }
  if (de("rafale")?.cadence && chaine.length < 4) mettre(t("Cadence : moins de 4 cartes"), 0.5);
  if (de("desarmer")?.total) mettre(t("Givre : demi-force"), 0.5);
  if (g.effet?.type === "vague" && !eteinte && motActif(g.effet, chaine.length, rang2)) mettre(g.effet.mot === "ouverture" ? t("Ouverture") : t("Final"), 1.5);
  if (!eteinte && g.effet?.type === "empreinte" && !effets[0]) mettre(t("Empreinte (rien \xE0 copier)"), REGLES.empreinteSeule);
  const st = de("surtension");
  const paye = surtensionPayee ?? s.porteurs.some((p) => p.id === g.porteur && peutPayerSurtension(p));
  if (st && paye) mettre(t("Surtension"), 1 + st.part);
  if (eteinte) mettre(t("Porteur \xE0 terre"), REGLES.eteinte);
  return f;
}
function ligneesDeSuite(chaine, rang2) {
  const fs = frequencesEffectives(chaine);
  let a = rang2, b = rang2;
  while (a > 0 && fs[a - 1] === fs[a] - 1) a--;
  while (b < fs.length - 1 && fs[b + 1] === fs[b] + 1) b++;
  if (b - a + 1 < 3) return /* @__PURE__ */ new Set();
  return new Set(chaine.slice(a, b + 1).filter((x2) => x2.porteur).map((x2) => ligneeGeste(x2)));
}
function effetsEnJeu(g, chaine, rang2, eteinte = false, avantEteinte2 = false) {
  if (eteinte) return [];
  const copiable = (e) => !!e && !frequenceLibre(e) && e.type !== "empreinte";
  return [g.effet, g.effet2].map((e) => {
    if (e?.type !== "empreinte") return motEnJeu(e, chaine.length, rang2);
    if (e.forte) {
      const forte = chaine.filter((x2, k) => k !== rang2 && copiable(x2.effet)).sort((a, b) => (b.v ?? 0) - (a.v ?? 0))[0];
      return forte ? motEnJeu(forte.effet, chaine.length, rang2) : void 0;
    }
    const copie = rang2 > 0 && !avantEteinte2 ? chaine[rang2 - 1]?.effet : void 0;
    return copiable(copie) ? motEnJeu(copie, chaine.length, rang2) : void 0;
  });
}
var motActif = (e, longueur, rang2) => e?.mot === "ouverture" ? rang2 === 0 : e?.mot === "final" ? rang2 === longueur - 1 : false;
function motEnJeu(e, longueur, rang2) {
  if (!e || !motActif(e, longueur, rang2)) return e;
  if (e.type === "flux") return { ...e, v: e.v * 2 };
  if (e.type === "elan") return { ...e, n: (e.n ?? 1) * 2 };
  if (e.type === "debord") return { ...e, x: (e.x ?? 1) * 2 };
  if ("part" in e) return { ...e, part: Math.round(e.part * 2 * 100) / 100 };
  return e;
}
function facteursCoup(s, g, mult, percant, effets = []) {
  const av = avantage(ligneeGeste(g), ligneeEnnemi(s.ennemi));
  const facteurs = [];
  if (av !== 1) facteurs.push({ nom: t`Lignée : ${NOMS_LIGNEE[ligneeGeste(g)].nom} bat ${NOMS_LIGNEE[ligneeEnnemi(s.ennemi)].nom}`, m: av });
  if (s.ennemi.fissure) facteurs.push({ nom: "Fissure", m: 1 + s.ennemi.fissure });
  const curee = effets.find((x2) => x2?.type === "curee");
  const fis = !!s.ennemi.fissure, moitie = s.ennemi.pv <= s.ennemi.pvMax / 2;
  if (curee && (curee.deux ? fis && moitie : fis || moitie)) facteurs.push({ nom: curee.deux ? t("Cur\xE9e (ennemi fissur\xE9 et affaibli)") : fis ? t("Cur\xE9e (ennemi fissur\xE9)") : t("Cur\xE9e (ennemi \xE0 moins de la moiti\xE9 de ses PV)"), m: 1 + curee.part });
  else if (curee?.aveugle) facteurs.push({ nom: t("Cur\xE9e \xE0 l\u2019aveugle"), m: 1 + curee.aveugle });
  const faille = effets.find((x2) => x2?.type === "faille");
  if (faille && s.ennemi.felureBrisee) facteurs.push({ nom: t("Faille (F\xEAlure bris\xE9e)"), m: 1 + faille.part });
  const evan = trait(s.ennemi, "evanescent");
  if (evan && mult <= 1) facteurs.push({ nom: t("\xC9vanescent (hors R\xE9sonance)"), m: 1 - evan.part });
  const blinde = percant ? 0 : Math.round((trait(s.ennemi, "blinde")?.v ?? 0) * (1 + 0.4 * (s.ennemi.force - 1)));
  return { facteurs, blinde, av };
}
function facteursEnnemi(s, en, av, cible) {
  const f = [];
  if (en.boost !== 1) f.push({ nom: t("Concentration"), m: en.boost });
  if (trait(en, "furie") && en.pv > 0 && en.pv <= en.pvMax / 2) f.push({ nom: t("Furie"), m: FURIE });
  if (en.crescendo && en.crescendo !== 1) f.push({ nom: t("D\xE9ferlement"), m: en.crescendo });
  const usure = usureCombat(s).attaque;
  if (usure !== 1) f.push({ nom: t`Combat qui s’éternise (tour ${s.tour})`, m: usure });
  if (av !== 1) f.push({ nom: t`Lignée : ${NOMS_LIGNEE[ligneeEnnemi(en)].nom} bat ${NOMS_LIGNEE[porteurDef(cible).lignee].nom}`, m: av });
  if (s.ombre) f.push({ nom: t("Ombre agissante"), m: 0 });
  return f;
}
function tourEnnemi(s, emettre) {
  CAMP = "neutre";
  if (s.condition === "eboulis") {
    const v2 = eboulis(s);
    let escouade = 0;
    let ennemis2 = 0;
    for (const p of vivants(s)) {
      const n = Math.min(v2, p.pv - 1);
      if (n > 0) {
        p.pv -= n;
        escouade += n;
        emettre({ kind: "degats", cible: p.id, net: n, absorbe: 0, source: "eboulis" });
      }
    }
    for (const en of ennemisDebout(s)) {
      const n = Math.min(v2, en.pv - 1);
      if (n > 0) {
        en.pv -= n;
        ennemis2 += n;
        emettre({ kind: "degats", cible: "ennemi", net: n, absorbe: 0, rang: en.rang ?? 0, source: "eboulis" });
      }
    }
    log2(s, t`Éboulis : des pierres tombent (−${v2} chacun).`, { sorte: "blessure", v: escouade });
    if (ennemis2) log2(s, t`Les pierres frappent aussi ${enGroupe(s) ? t("le groupe") : ennemiDef(s.ennemi.id).nom} (−${ennemis2}).`, { sorte: "coup", v: ennemis2 });
  }
  CAMP = "ennemi";
  const groupe = enGroupe(s);
  s.protege = protegeDe(s);
  const ennemis = ennemisDebout(s);
  for (const [i, en] of ennemis.entries()) {
    if (!vivants(s).length) break;
    if (groupe) emettre({ kind: "ennemi-agit", rang: en.rang ?? 0 });
    RESERVE = reservePour(s, protegeDe(s), ennemis.slice(i + 1).filter((x2) => x2.pv > 0));
    agir(s, en, intentionDe(s, en), emettre);
  }
  RESERVE = 0;
  delete s.tenace;
  for (const p of s.porteurs) {
    if (p.pv <= 0 && !p.aTerre) {
      if (s.releve && !s.releveFaite) {
        s.releves = (s.releves ?? 0) + 1;
        if (s.releves >= (s.marques?.releveFois ?? 1)) s.releveFaite = true;
        p.pv = Math.max(1, Math.round(p.pvMax * s.releve));
        log2(s, t`Seconde chance : ${porteurDef(p.id).nom} se relève (${p.pv} PV).`, { camp: "neutre", sorte: "soin", v: p.pv });
        emettre({ kind: "soin", cible: p.id, v: p.pv });
        continue;
      }
      p.aTerre = true;
      log2(s, t`${porteurDef(p.id).nom} est à terre : ses cartes s’éteignent (−15 % de force, sans effet).`, { camp: "neutre", sorte: "terre" });
      emettre({ kind: "a-terre", cible: p.id });
    }
  }
  if (s.sansChute && s.porteurs.some((p) => p.aTerre)) {
    s.issue = "defaite";
    log2(s, t("Un Porteur est \xE0 terre : l\u2019\xC9preuve \xAB Nul ne reste au fond \xBB est manqu\xE9e."), { camp: "neutre", sorte: "info" });
    emettre({ kind: "fin", issue: "defaite" });
    return;
  }
  if (!vivants(s).length) {
    s.issue = "defaite";
    emettre({ kind: "fin", issue: "defaite" });
    return;
  }
  const acheves = tousEnnemis(s).filter((en) => en.acheve);
  if (acheves.length) {
    for (const en of acheves) {
      delete en.acheve;
      tombe(s, en, emettre);
    }
    if (s.ennemi.pv <= 0) viserSuivant(s);
    if (!ennemisDebout(s).length) {
      victoire(s, emettre);
      return;
    }
  }
  if (s.marques?.rempart && !s.rempartFait) {
    const pv = s.porteurs.reduce((n, p) => n + Math.max(0, p.pv), 0);
    const max2 = s.porteurs.reduce((n, p) => n + p.pvMax, 0);
    if (pv < max2 / 2) {
      s.rempartFait = true;
      s.bouclier += s.marques.rempart;
      log2(s, t`Fondations : Doran relève le mur, +${s.marques.rempart} de bouclier.`, { camp: "neutre", sorte: "effet" });
      emettre({ kind: "bouclier", cible: "escouade", v: s.marques.rempart });
    }
  }
  if (s.veille && usureCombat(s).soins > 0) {
    for (const blesse of vivants(s).filter((p) => p.pv < p.pvMax).sort((a, b) => a.pv / a.pvMax - b.pv / b.pvMax).slice(0, s.marques?.veilleDeux ? 2 : 1)) {
      const avant = blesse.pv;
      blesse.pv = Math.min(blesse.pvMax, blesse.pv + Math.max(1, Math.round(blesse.pvMax * s.veille * usureCombat(s).soins)));
      log2(s, t`Nuit blanche : Joss veille sur ${porteurDef(blesse.id).nom} (+${blesse.pv - avant}).`, { camp: "neutre", sorte: "soin", v: blesse.pv - avant });
      emettre({ kind: "soin", cible: blesse.id, v: blesse.pv - avant });
    }
  }
  const part = Math.max(s.garde ?? 0, s.gardeMarque ?? 0);
  const garde2 = Math.round(s.bouclier * part);
  if (garde2) log2(s, t`${(s.garde ?? 0) >= part ? t("Rempart") : t("Bras de quai")} : ${garde2} de bouclier gardés.`, { camp: "neutre", sorte: "effet" });
  s.bouclier = garde2;
  s.garde = 0;
  delete s.protege;
  s.ombre = false;
  s.tour++;
  for (const en of ennemisDebout(s)) {
    if (en.crescendo) en.crescendo = Math.min(REGLES.troisiemePhase.deferlementMax, en.crescendo + REGLES.troisiemePhase.deferlement);
  }
  for (const en of ennemisDebout(s)) choisirIntention(s, en);
  piocher(s, tailleMainDe(s) + (s.piocheProchain ?? 0));
  s.piocheProchain = 0;
  fixerFelures(s);
}
var ECLATS = {
  tech: { nom: t("D\xE9bridage"), texte: t`Les coups de ta chaîne frappent ${REGLES.eclat.debride * 100 - 100} % plus fort ce tour-ci.` },
  bio: { nom: t("Sursaut"), texte: t("Toute l\u2019escouade r\xE9cup\xE8re 40 % de ses PV, et un Porteur \xE0 terre se rel\xE8ve.") },
  reso: { nom: t("Ombre agissante"), texte: t("Aucune attaque ennemie ne porte au prochain tour ennemi.") }
};
function eclatsPossibles(s) {
  if (s.issue !== "en-cours" || s.eclat || s.flux < REGLES.fluxMax) return [];
  const r = [];
  for (const p of vivants(s)) {
    const l = porteurDef(p.id).lignee;
    if (!r.some((x2) => x2.lignee === l)) r.push({ porteur: p.id, lignee: l });
  }
  return r;
}
function eclater(s, porteurId, opts = {}) {
  const pas = [];
  const choix = eclatsPossibles(s).find((x2) => x2.porteur === porteurId);
  if (!choix) return pas;
  const emettre = opts.silencieux ? () => {
  } : (ev) => {
    pas.push({ ev, etat: photo(s) });
  };
  CAMP = "joueur";
  s.flux = 0;
  s.eclat = choix;
  const p = porteurEtat(s, porteurId);
  p.usureEclat = (p.usureEclat ?? 0) + REGLES.eclat.usure;
  const nom = porteurDef(porteurId).nom;
  emettre({ kind: "effet", cible: porteurId, texte: ECLATS[choix.lignee].nom });
  if (choix.lignee === "tech") {
    s.debride = true;
    log2(s, t`Débridage : ${nom} pousse ses implants au-delà du raisonnable. La chaîne frappera ${REGLES.eclat.debride * 100 - 100} % plus fort.`, { sorte: "effet" });
  } else if (choix.lignee === "reso") {
    s.ombre = true;
    log2(s, t`Ombre agissante : l’ombre ${deNom(nom)} se lève et retiendra les coups du prochain tour.`, { sorte: "effet" });
  } else {
    const aTerre = s.porteurs.find((x2) => x2.pv <= 0);
    if (aTerre) {
      aTerre.pv = Math.max(1, Math.round(aTerre.pvMax * REGLES.eclat.sursaut));
      aTerre.aTerre = false;
      emettre({ kind: "soin", cible: aTerre.id, v: aTerre.pv });
    }
    let total = aTerre ? aTerre.pv : 0;
    for (const c2 of vivants(s)) {
      if (c2 === aTerre) continue;
      const avant = c2.pv;
      c2.pv = Math.min(c2.pvMax, c2.pv + Math.round(c2.pvMax * REGLES.eclat.sursaut));
      total += c2.pv - avant;
      if (c2.pv > avant) emettre({ kind: "soin", cible: c2.id, v: c2.pv - avant });
    }
    log2(s, t`Sursaut : le corps ${deNom(nom)} répond pour tous.${aTerre ? t` ${porteurDef(aTerre.id).nom} se relève.` : ""}`, { sorte: "soin", v: total });
  }
  return pas;
}
var estGardien = (id) => ZONES.some((z) => z.boss === id);
var felureVisible = (en) => en.felure !== void 0 && (!!en.felureBrisee || !trait(en, "evanescent"));
function fixerFelures(s) {
  const r = tireur(s);
  const enMain = [...new Set(s.main.flatMap((g) => frequenceLibre(g.effet) || g.vide ? [] : g.fs ?? [g.f]))];
  for (const en of tousEnnemis(s)) {
    delete en.felureBrisee;
    if (en.pv <= 0 || en.simple) {
      delete en.felure;
      continue;
    }
    en.felure = enMain.length && r.nombre() < REGLES.felure.chanceMain ? enMain[r.entier(enMain.length)] : 1 + r.entier(9);
  }
}
var partFelure = (en) => estGardien(en.id) || trait(en, "blinde") ? REGLES.felure.partGardien : REGLES.felure.part;
var partFelureSur = (s, en) => en === s.ennemi ? partFelure(en) : partFelure(en) / 2;
var ciblePourFelure = (s, f) => f === void 0 ? void 0 : [s.ennemi, ...tousEnnemis(s)].find((en) => en.pv > 0 && en.felure === f && !en.felureBrisee);
function briser(s, en, emettre, resonne) {
  const trouvee = !felureVisible(en);
  en.felureBrisee = true;
  const it = intentionDe(s, en);
  const part = partFelureSur(s, en);
  const nom = ennemiDef(en.id).nom;
  const titre = trouvee ? t("F\xEAlure trouv\xE9e") : t("F\xEAlure");
  let retire = 0;
  if (it.type === "atk" || it.type === "bouclier" || it.type === "soin") {
    const avant2 = it.v;
    it.v = Math.round(avant2 * (1 - part));
    const force = it.type === "atk" ? puissance(en) * usureCombat(s).attaque : 1;
    retire = Math.round(avant2 * force) - Math.round(it.v * force);
    log2(s, t`${titre} : ${nom} vacille, ${it.type === "atk" ? t("son attaque") : it.type === "bouclier" ? t("son bouclier") : t("son soin")} passe de ${avant2} à ${it.v}.`, { sorte: "effet", felure: true });
  } else if (it.type === "appel") {
    it.rompu = true;
    log2(s, t`${titre} : ${nom} vacille, son appel se perd dans les profondeurs.`, { sorte: "effet", felure: true });
  } else log2(s, t`${titre} : ${nom} vacille, mais ce qu’il prépare ne change pas.`, { sorte: "effet", felure: true });
  emettre({ kind: "effet", cible: "ennemi", texte: retire > 0 ? `${titre} \u2212${retire}` : titre, rang: en.rang ?? 0 });
  if (!resonne) return;
  const avant = s.flux;
  s.flux = Math.min(REGLES.fluxMax, s.flux + REGLES.felure.flux + (s.felureFlux ?? 0));
  if (s.marques?.felurePioche) {
    piocher(s, s.main.length + s.marques.felurePioche);
    log2(s, t`Galons blancs : +${s.marques.felurePioche} carte en main.`, { camp: "neutre", sorte: "effet" });
  }
  if (s.flux > avant) {
    log2(s, t`Fêlure brisée en Résonance : Flux +${s.flux - avant}.`, { sorte: "flux" });
    emettre({ kind: "flux", gain: s.flux - avant });
  }
}
function agir(s, en, it, emettre) {
  const e = ennemiDef(en.id);
  const rang2 = en.rang ?? 0;
  en.bouclier = 0;
  const allie = (it.type === "soin" || it.type === "bouclier") && it.allie ? allieDe(s, en) : void 0;
  if ((it.type === "soin" || it.type === "bouclier") && it.allie && !allie) {
    log2(s, it.type === "soin" ? t`${e.nom} : plus personne à soigner, son geste se perd.` : t`${e.nom} : plus personne à couvrir, son geste se perd.`, { sorte: "info" });
  } else if (it.type === "appel" && it.rompu) {
    log2(s, t`${e.nom} · ${it.nom} : personne ne répond, la Fêlure a rompu l’appel.`, { sorte: "info" });
  } else if (it.type === "appel") {
    const r = ennemiDef(en.id).phase?.renforts?.[0] ?? "remanent";
    log2(s, t`${e.nom} · ${it.nom} : un renfort surgit des profondeurs.`, { sorte: "info" });
    invoquer(s, r, REGLES.troisiemePhase.renfort, emettre, "assaut");
  } else if (it.type === "bouclier" && allie) {
    allie.bouclier += it.v;
    log2(s, t`${e.nom} couvre ${ennemiDef(allie.id).nom} : bouclier ${it.v}.`, { sorte: "ennemi-garde", v: it.v });
    emettre({ kind: "bouclier", cible: "ennemi", v: it.v, rang: allie.rang ?? 0 });
  } else if (it.type === "soin" && allie) {
    const avant = allie.pv;
    allie.pv = Math.min(allie.pvMax, allie.pv + Math.round(it.v * usureCombat(s).soins));
    log2(s, `${e.nom} \xB7 ${it.nom} : ${ennemiDef(allie.id).nom} +${allie.pv - avant} PV.`, { sorte: "ennemi-soin", v: allie.pv - avant });
    emettre({ kind: "soin", cible: "ennemi", v: allie.pv - avant, rang: allie.rang ?? 0 });
  } else if (it.type === "bouclier") {
    en.bouclier = it.v;
    log2(s, t`${e.nom} se protège : bouclier ${it.v}.`, { sorte: "ennemi-garde", v: it.v });
    emettre({ kind: "bouclier", cible: "ennemi", v: it.v, rang: rang2 });
  } else if (it.type === "boost") {
    en.boost = 2;
    log2(s, t`${e.nom} se concentre. Sa prochaine attaque fera des dégâts doubles.`, { sorte: "effet" });
    emettre({ kind: "boost", rang: rang2 });
  } else if (it.type === "soin") {
    const avant = en.pv;
    en.pv = Math.min(en.pvMax, en.pv + Math.round(it.v * usureCombat(s).soins));
    log2(s, `${e.nom} \xB7 ${it.nom} : +${en.pv - avant} PV.`, { sorte: "ennemi-soin", v: en.pv - avant });
    emettre({ kind: "soin", cible: "ennemi", v: en.pv - avant, rang: rang2 });
  } else if (it.type === "dissonance" && s.lucide) {
    log2(s, t`${e.nom} · ${it.nom} : Véla lit le brouillage, tes Fréquences restent nettes.`, { sorte: "effet" });
    emettre({ kind: "effet", cible: "escouade", texte: t("Lucide") });
    if (s.marques?.retourne) {
      en.trouble = s.marques.retourne;
      log2(s, t`Lectrice : Véla lui renvoie son brouillage, sa prochaine attaque perd ${Math.round(s.marques.retourne * 100)} %.`, { sorte: "effet" });
      emettre({ kind: "effet", cible: "ennemi", texte: "Troubl\xE9", rang: rang2 });
    }
  } else if (it.type === "dissonance") {
    s.dissonance = true;
    log2(s, t`${e.nom} · ${it.nom} : tes Fréquences sont brouillées, ni Résonance ni Écho au prochain tour.`, { sorte: "effet" });
    emettre({ kind: "effet", cible: "escouade", texte: "Dissonance" });
  } else {
    let cibles;
    if (it.zone) cibles = ordreZone(s, vivants(s));
    else {
      const visee = it.cibleId ? porteurEtat(s, it.cibleId) : void 0;
      const id = visee && visee.pv > 0 ? visee.id : choisirCible(s);
      cibles = id ? [porteurEtat(s, id)] : [];
    }
    const morceaux = [];
    const calculs = [];
    const renvois = [];
    let total = 0;
    for (const c2 of cibles) {
      const av = avantage(ligneeEnnemi(en), porteurDef(c2.id).lignee);
      const dmg = s.ombre ? 0 : Math.round(it.v * puissance(en) * usureCombat(s).attaque * av);
      const abs = Math.min(bouclierPour(s.bouclier, c2.id, protegeDe(s), RESERVE), dmg);
      s.bouclier -= abs;
      const net = s.tenace && c2.pv > 0 && dmg - abs >= c2.pv ? c2.pv - 1 : dmg - abs;
      c2.pv = Math.max(0, c2.pv - net);
      if (s.tenace && net < dmg - abs) log2(s, t`Ténacité : ${porteurDef(c2.id).nom} tient debout à 1 PV.`, { sorte: "effet" });
      total += net;
      morceaux.push(`${porteurDef(c2.id).nom} ${net ? "\u2212" + net : t("prot\xE9g\xE9")}`);
      calculs.push(calcul(porteurDef(c2.id).nom, it.v, facteursEnnemi(s, en, av, c2.id), dmg, abs, net));
      emettre({ kind: "degats", cible: c2.id, net, absorbe: abs, rang: rang2, ...it.zone ? { zone: true } : {} });
      if (s.chitine && abs > 0 && en.pv > (s.marques?.chitineAcheve ? 0 : 1)) {
        const renvoi = Math.min(en.pv - (s.marques?.chitineAcheve ? 0 : 1), Math.max(1, Math.round(abs * s.chitine)));
        en.pv -= renvoi;
        if (en.pv <= 0) en.acheve = true;
        renvois.push({ texte: t`Née-de-mue : la chitine renvoie ${renvoi} à ${e.nom}.`, info: { camp: "neutre", sorte: "coup", v: renvoi } });
        emettre({ kind: "degats", cible: "ennemi", net: renvoi, absorbe: 0, rang: rang2, source: "epines" });
      }
    }
    en.boost = 1;
    if (it.retenue && s.marques?.retenueFlux && !s.ombre) {
      const avant = s.flux;
      s.flux = Math.min(REGLES.fluxMax, s.flux + s.marques.retenueFlux);
      if (s.flux > avant) {
        renvois.push({ texte: t`Ombre courtoise : le coup retenu donne ${s.flux - avant} Flux.`, info: { sorte: "flux" } });
        emettre({ kind: "flux", gain: s.flux - avant });
      }
    }
    const aspire = trait(en, "aspire");
    if (aspire && !s.ombre && total > 0 && s.flux > 0) {
      const pris = Math.min(s.flux, aspire.v);
      s.flux -= pris;
      renvois.push({ texte: t`${e.nom} aspire ${pris} Flux.`, info: { sorte: "flux" } });
      emettre({ kind: "effet", cible: "escouade", texte: t("Flux aspir\xE9") });
    }
    log2(s, s.ombre ? t`${e.nom} · ${it.nom} : l’ombre retient le coup.` : `${e.nom} \xB7 ${it.nom} : ${morceaux.join(", ")}.`, { sorte: "blessure", v: total, calculs });
    for (const r of renvois) log2(s, r.texte, r.info);
  }
  const regen = trait(en, "regeneration");
  if (regen && en.pv > 0 && en.pv < en.pvMax && usureCombat(s).soins > 0) {
    const avant = en.pv;
    en.pv = Math.min(en.pvMax, en.pv + Math.max(1, Math.round(en.pvMax * regen.part * usureCombat(s).soins)));
    log2(s, t`${e.nom} se régénère (+${en.pv - avant}).`, { sorte: "ennemi-soin", v: en.pv - avant });
    emettre({ kind: "soin", cible: "ennemi", v: en.pv - avant, rang: rang2 });
  }
}
function invoquer(s, id, part, emettre, role) {
  const tous = tousEnnemis(s);
  if (ennemisDebout(s).length >= 4) return;
  if (s.ennemi.rang === void 0) s.ennemi.rang = 0;
  s.autres ??= [];
  const rang2 = Math.max(...tous.map((e) => e.rang ?? 0)) + 1;
  const base = s.forceBase ?? s.ennemi.force;
  const pv = Math.max(1, Math.round(ennemiDef(id).pvMax * base * part));
  const force = role ? base * REGLES.troisiemePhase.renfortForce : base * part;
  const en = {
    id,
    pv,
    pvMax: pv,
    force,
    bouclier: 0,
    etape: 0,
    boost: 1,
    rang: rang2,
    rejeton: true,
    ...role ? { role } : {},
    // un renfort suit les réglages de la Strate, comme le gardien qui l'appelle (pas de traits avant −4, etc.)
    ...s.ennemi.simple ? { simple: true } : {},
    ...s.ennemi.sansTraits ? { sansTraits: true } : {},
    ...s.ennemi.sansAssimilation ? { sansAssimilation: true } : {}
  };
  s.autres.push(en);
  choisirIntention(s, en);
  log2(s, `${ennemiDef(id).nom} surgit.`, { camp: "ennemi", sorte: "info" });
  emettre({ kind: "renfort", rang: rang2, id });
}
function tombe(s, en, emettre) {
  const essaim = trait(en, "essaim");
  if (essaim && !en.rejeton) invoquer(s, en.id, essaim.part, emettre);
  for (const autre of ennemisDebout(s)) {
    if (autre !== en && trait(autre, "vengeur") && autre.boost < 2) {
      autre.boost = 2;
      log2(s, t`${ennemiDef(autre.id).nom} venge son allié : sa prochaine attaque est doublée.`, { camp: "ennemi", sorte: "effet" });
      emettre({ kind: "boost", rang: autre.rang ?? 0 });
    }
  }
}
function piocheDePhase(s) {
  const n = s.marques?.phaseMain ?? 0;
  if (!n) return;
  piocher(s, s.main.length + n);
  log2(s, t`Guet : le Guetteur l’a vu venir, +${n} carte${n > 1 ? "s" : ""} en main.`, { camp: "neutre", sorte: "effet" });
}
function phaseGardien(s, en, emettre) {
  const ph = ennemiDef(en.id).phase;
  if (en.phase2 && en.phase3 && !en.phase3Active && en.pv > 0 && en.pv <= en.pvMax * REGLES.troisiemePhase.seuil) return troisiemePhase(s, en, emettre);
  if (!ph || en.simple || en.phase2 || en.pv <= 0 || en.pv > en.pvMax * ph.seuil) return;
  en.phase2 = true;
  piocheDePhase(s);
  en.etape = 0;
  log2(s, `${ennemiDef(en.id).nom} : ${ph.nom}. ${ph.texte}`, { camp: "ennemi", sorte: "info" });
  emettre({ kind: "phase", rang: en.rang ?? 0, id: en.id, nom: ph.nom });
  choisirIntention(s, en);
  for (const id of ph.renforts ?? []) invoquer(s, id, 0.25, emettre);
}
function troisiemePhase(s, en, emettre) {
  const v2 = en.phase3;
  const d2 = ennemiDef(en.id);
  const r = d2.phase?.renforts?.[0] ?? "remanent";
  en.phase3Active = true;
  piocheDePhase(s);
  en.etape = 0;
  const p = PHASES3[v2];
  log2(s, `${d2.nom} : ${p.nom}. ${p.texte(d2.nom, ennemiDef(r).nom)}`, { camp: "ennemi", sorte: "info" });
  emettre({ kind: "phase", rang: en.rang ?? 0, id: en.id, nom: p.nom });
  const part = REGLES.troisiemePhase.renfort;
  if (v2 === "front") {
    en.role = "front";
    invoquer(s, r, part, emettre, "front");
  } else if (v2 === "garde") {
    invoquer(s, r, part, emettre, "soutien");
    invoquer(s, r, part, emettre, "soutien");
  } else if (v2 === "deferlement") en.crescendo = 1;
  else {
    en.role = "invocateur";
    invoquer(s, r, part, emettre, "assaut");
    invoquer(s, r, part, emettre, "assaut");
  }
  choisirIntention(s, en);
}

// src/core/expedition.ts
var FORCE = {
  // ×1,15 à partir de −2 (25 octobre 2026) : la Fêlure et les Coups d'éclat rendent l'escouade plus forte ; réglé au robot
  // pour garder ~1 victoire sur 3 au front (joueur moyen) et la Strate −10 vers le jour 28-30.
  // −7 % à partir de −2 (26 octobre 2026) : la Fêlure ne donne plus de Flux hors d'une suite ; réglé au robot pour garder
  // les mêmes repères (front 41 % / 37 %, Strate −10 au jour 29 / 22).
  //      −1   −2     −3     −4     −5     −6     −7     −8     −9     −10    −11    −12    −13    −14
  // −15 % dans la Strate −1 (27 octobre 2026, Bryan : trop dure pour un nouveau joueur) : Pilleur 70 → 60 PV, Vigie 95 → 81, Confluence 165 → 140.
  // −7 à −14 relevés le 3 novembre 2026 (validé par Bryan) : avant 2.888, 3.016, 3.102, 3.262, 3.475, 3.743, 3.936, 4.064 ; le joueur dépassait
  // les ennemis en fin de parcours (combats normaux de 5 tours à −10, front gagné à 58 %). Avec moins de creuseurs demandés (CREUSEURS.requis) :
  // −10 au jour 30 pour l'occasionnel, front ≈ 45 %, combats normaux 6 à 8 tours.
  // −7 à −10 relevés le 7 novembre 2026 (audit : −7 à −10 avant 2.9, 3.05, 3.2, 3.38) : les fouilles profondes ramènent plus de creuseurs et les
  // Épreuves profondes s'allègent, la Strate −10 tombait au jour 22 ; c'est le front qui freine désormais, pas l'attente.
  // −8 à −14 relevés de 4 à 5 % le 8 novembre 2026 : avec les Éclats en plus (Comptoir, Générateur), on attendait encore 6 sessions sur 9
  // à −9 ; le front freine à nouveau (1 session d'attente), sans changer le jour de −10 (j25).
  // 12 novembre 2026 (révision complète, chantier 2) : réglée Strate par Strate sur le deck des nouvelles règles (métal par tranche,
  // sans Charge, sans verrou) pour des victoires régulières au front (avant : 2.46, 2.781, 2.98, 3.34, 3.58, 3.78 de −5 à −10 ;
  // le front de −8 demandait 16 expéditions et −10 se gagnait une fois sur dix). `npx tsx scripts/progression.ts` donne les chiffres.
  // 13 novembre 2026 (audit par testeurs, validé par Bryan) : −6 était plus forte que −7 (2.92 contre 2.771), un mur à 26 % de victoires
  // au front ; ramenée à 2.686, entre −5 et −7 : 41 % de victoires à −6, front global inchangé (27 %), −10 au jour 15 au lieu de 17.
  table: [0.85, 1.39, 1.818, 2.139, 2.583, 2.686, 2.771, 3.006, 3.15, 3.024, 3.88, 4.05, 4.2, 4.35],
  /** hausse par Strate au-delà de la table */
  ensuite: 1.04,
  /** hausse par Strate pour suivre les niveaux des Porteurs. À 0 depuis les traits, phases et conditions (22 octobre 2026), qui
   *  durcissent autant : au front, le joueur moyen gagne ~3 fois sur 10, un joueur qui calcule tout ~5 fois sur 10 */
  niveaux: 0,
  /** Les premières Strates (8 novembre 2026, audit, arbitré par le game designer) : les combats normaux duraient 3 tours à −1, 5 à −2, 6 à −3,
   *  sous les « 4 à 6 tours » refusés par Bryan. Les ennemis seuls (ni groupes ni gardiens) y ont plus de PV ; à −1, ils frappent un peu moins fort
   *  pour que la Strate d'accueil reste un peu plus facile. Robot (parcours d'un joueur moyen) : 3 / 5 / 6 tours → 5 / 6 / 6-7. */
  debut: { pv: [1.6, 1.35, 1.2], coups: [0.8, 1, 1] },
  /** le combat guidé de la chambre (12 novembre 2026, audit du début) : il héritait des PV ×1,6 de −1 (120 PV, 9 tours dont 6 sans leçon).
   *  Sans ce bonus, le Rémanent affaibli a ses 75 PV : 5 à 6 tours, les trois leçons puis deux ou trois tours pour finir */
  tutoPv: 1
};
var forceStrate = (strate) => {
  const t2 = FORCE.table;
  const base = strate <= t2.length ? t2[Math.max(0, strate - 1)] : t2[t2.length - 1] * FORCE.ensuite ** (strate - t2.length);
  return Math.round(base * (1 + FORCE.niveaux * Math.max(0, strate - 1)) * 1e3) / 1e3;
};
var INDICES = {
  bruits: { nom: t("Des bruits"), texte: t("Des pas, un grattement, quelque chose qui respire derri\xE8re la paroi.") },
  lueur: { nom: t("Une lueur"), texte: t("Une lueur bleut\xE9e au bout du couloir. Quelque chose de pr\xE9cieux\u2026 ou quelqu\u2019un qui r\xE9sonne.") },
  silence: { nom: t("Le silence"), texte: t("Rien ne bouge. De la poussi\xE8re, des gravats : une salle oubli\xE9e.") },
  traces: { nom: t("Des traces"), texte: t("Des traces fra\xEEches dans la poussi\xE8re. Quelqu\u2019un est pass\xE9 il y a peu.") },
  chaleur: { nom: t("De la chaleur"), texte: t("Une odeur de feu \xE9teint, un air plus doux. Des fouilleurs ont fait halte ici.") }
};

// src/core/fragments.ts
var FRAGMENTS = [
  {
    id: "mure",
    titre: t("Ce qui s\u2019est mur\xE9"),
    support: t("Un ordre de service, tamponn\xE9 deux fois"),
    lignes: [
      t("Chantier d\u2019abris, niveau 7. Suite \xE0 l\u2019incident du 14, l\u2019acc\xE8s est condamn\xE9 jusqu\u2019\xE0 nouvel ordre."),
      t("Le personnel ne mentionne pas l\u2019incident \xE0 l\u2019ext\xE9rieur. Les familles seront indemnis\xE9es."),
      t("Tampon du 2 novembre : \xAB Faute de fonds, l\u2019indemnit\xE9 est vers\xE9e en nature. L\u2019anneau du chantier et ses pompes sont c\xE9d\xE9s aux familles du personnel. \xBB"),
      t("Note au crayon, en marge : \xAB Ils ont entendu quelqu\u2019un pleurer derri\xE8re la paroi. Il n\u2019y avait personne. \xBB")
    ]
  },
  {
    id: "ligne-eau",
    titre: t("La ligne d\u2019eau"),
    support: t("Une photo de famille, annot\xE9e au dos"),
    lignes: [
      t("Nous quatre devant la maison, l\u2019\xE9t\xE9 avant qu\u2019on parte."),
      t("Papa a peint la ligne bleue sur le mur, l\xE0 o\xF9 l\u2019eau s\u2019est arr\xEAt\xE9e la premi\xE8re fois."),
      t("Il disait qu\u2019on la regarderait en riant, plus tard. On ne l\u2019a jamais revue.")
    ]
  },
  {
    id: "infos",
    titre: t("Les infos du soir"),
    support: t("Un extrait de journal intime"),
    lignes: [
      t("Ce soir, quarante minutes de journal. Les \xE9lections, les prix, la col\xE8re, encore les \xE9lections."),
      t("La s\xE9cheresse dans le Sud : vingt secondes, \xE0 la fin, entre la m\xE9t\xE9o et le sport."),
      t("Je me suis surprise \xE0 zapper. Je crois que tout le monde zappe.")
    ]
  },
  {
    id: "colonne",
    titre: t("Colonne"),
    support: t("Une lettre jamais post\xE9e"),
    lignes: [
      t("On marche depuis onze jours. La route est pleine jusqu\u2019\xE0 l\u2019horizon, dans les deux sens."),
      t("Hier, un homme que je ne connaissais pas a port\xE9 ma fille sur ses \xE9paules pendant des heures."),
      t("Personne ne demande plus d\u2019o\xF9 l\u2019on vient. On demande seulement : \xAB Il vous reste de l\u2019eau ? \xBB")
    ]
  },
  {
    id: "fracture",
    titre: t("Fracture"),
    support: t("Le carnet d\u2019un marin d\u2019un navire scientifique"),
    lignes: [
      t("Six heures du matin. Le bruit est arriv\xE9 avant la vague : un craquement grand comme le monde."),
      t("Toute la falaise s\u2019est mise \xE0 glisser, lentement, comme si elle avait d\xE9cid\xE9 de partir."),
      t("Le chef de mission a dit \xAB peu probable \xBB \xE0 voix haute. Puis il s\u2019est tu jusqu\u2019au soir.")
    ]
  },
  {
    id: "pierre",
    titre: t("Premi\xE8re pierre"),
    support: t("Un plan de chantier, tr\xE8s us\xE9"),
    lignes: [
      t("Tour de secours n\xB0 12 : fondations sur pilier ancien, quarante \xE9tages pr\xE9vus, quatre-vingts possibles."),
      t("Livraison des passerelles vers les tours 9 et 14 : dans six ans, si l\u2019acier arrive."),
      t("Quelqu\u2019un a ajout\xE9 : \xAB Mon petit-fils finira le toit. \xBB")
    ]
  },
  {
    id: "puits-zero",
    titre: t("Puits Z\xE9ro, rapport 1"),
    support: t("Le rapport d\u2019un chef d\u2019\xE9quipe"),
    lignes: [
      t("A 23 h 40 la foreuse a travers\xE9 dans du vide. On a cru a une grotte."),
      t("C\u2019est pas une grotte. Les murs sont lisses et courbes, et il y a des pierres qui brillent toutes seules."),
      t("Personne a voulu descendre en premier. Au final on y est all\xE9s tous ensemble.")
    ]
  },
  {
    id: "graveur",
    titre: t("Le Graveur"),
    support: t("Des notes de laboratoire"),
    lignes: [
      t("\xC9chantillon 41 : le cristal r\xE9agit aux voix. Pas aux sons : aux voix."),
      t("Hypoth\xE8se : il ne stocke pas une \xE9nergie, il stocke quelqu\u2019un. Ou la forme de quelqu\u2019un."),
      t("Si l\u2019on peut lire cette forme, on peut peut-\xEAtre l\u2019inscrire. Et alors, sur quoi ?")
    ]
  },
  {
    id: "sept",
    titre: t("Les Sept"),
    support: t("Un formulaire de volontaire"),
    lignes: [
      t("Nom : effac\xE9. Motivation : \xAB Ma ville est sur la c\xF4te. Si \xE7a peut servir. \xBB"),
      t("Risques expliqu\xE9s au candidat : oui. Risques compris par le candidat : la case n\u2019est pas coch\xE9e."),
      t("Tampon final : \xAB Retenu. Greffe pr\xE9vue le 3. \xBB")
    ]
  },
  {
    id: "voix",
    titre: t("La voix d\u2019en dessous"),
    support: t("Un enregistrement \xE0 moiti\xE9 effac\xE9"),
    lignes: [
      t("[gr\xE9sillement] \u2026 ce n\u2019est pas un souvenir \xE0 moi. Je me rappelle une mer que je n\u2019ai jamais vue."),
      t("[gr\xE9sillement] \u2026 ils ne sont pas morts, l\xE0-dessous. Ils attendent qu\u2019on se souvienne d\u2019eux."),
      t("[fin de l\u2019enregistrement]")
    ]
  },
  {
    id: "regle",
    titre: t("La r\xE8gle aux deux \xE9chelles"),
    support: t("Une r\xE8gle de niveau, trouv\xE9e dans un abri"),
    lignes: [
      t("Deux graduations sur la m\xEAme tige de laiton : l\u2019une grav\xE9e \xAB relev\xE9 \xBB, l\u2019autre \xAB niveau officiel \xBB."),
      t("\xC0 la date du 3 mars, la premi\xE8re indique 1,20 m. La seconde, 41 cm. Les deux relev\xE9s ont \xE9t\xE9 not\xE9s le m\xEAme jour, de la m\xEAme main."),
      t("Au registre de l\u2019abri, seul le second chiffre a \xE9t\xE9 recopi\xE9. C\u2019est celui qui ne demandait pas d\u2019\xE9vacuer.")
    ]
  },
  {
    id: "seuil",
    titre: t("Au-dessus d\u2019une porte"),
    support: t("Une inscription traduite par les Veilleurs"),
    lignes: [
      t("\xAB Ici, on entre seul, et l\u2019on ressort avec ce qu\u2019on a apport\xE9. \xBB"),
      t("Note de traduction : le dernier verbe reste incertain. Il pourrait aussi vouloir dire \xAB ce qu\u2019on porte \xBB."),
      t("La porte est ferm\xE9e de l\u2019int\xE9rieur. Personne n\u2019est ressorti.")
    ]
  },
  {
    id: "choses",
    titre: t("Inventaire, salle 4-C"),
    support: t("Une liste dress\xE9e par des fouilleurs des Veilleurs"),
    lignes: [
      t("1 poign\xE9e de porte, us\xE9e d\u2019un seul c\xF4t\xE9. 1 sandale, ressemel\xE9e trois fois. 1 petit animal taill\xE9, sans valeur."),
      t("412 objets au total. Chacun porte un nom et une date grav\xE9s. Aucun ne porte d\u2019histoire."),
      t("En marge, l\u2019\xE9criture d\u2019Ys\xE9 : \xAB Ils gardaient ce que personne d\u2019autre ne pouvait se rappeler \xE0 leur place. \xBB")
    ]
  },
  {
    id: "brigade",
    titre: t("Rapport de s\xE9curisation"),
    support: t("Un rapport du Serment de Veyr"),
    lignes: [
      t("Salle close n\xB0 11 s\xE9curis\xE9e \xE0 4 h 20. Aucun civil pr\xE9sent. Cristaux inventori\xE9s, mis sous scell\xE9s, transf\xE9r\xE9s vers les Hauts."),
      t("Le brigadier Tessel signale qu\u2019une voix lui a donn\xE9 un ordre dans une langue inconnue. Il dit l\u2019avoir compris."),
      t("Mesure prise : le brigadier Tessel est relev\xE9 de ses fonctions et mis au repos.")
    ]
  },
  {
    id: "deux-enfances",
    titre: t("Deux enfances"),
    support: t("Deux fiches de lecture des Veilleurs, agraf\xE9es ensemble"),
    lignes: [
      t("Cristal 7-114 : se souvient d\u2019une enfance au bord d\u2019une mer ti\xE8de, d\u2019une s\u0153ur, d\u2019un jardin de pierres."),
      t("Cristal 7-115, m\xEAme individu, signature identique : se souvient d\u2019\xEAtre n\xE9 sous la glace, enfant unique, sans avoir jamais vu la mer."),
      t("Lectrice : V\xE9la. Commentaire : \xAB Les deux sont sinc\xE8res. \xBB")
    ]
  },
  {
    id: "patient-5",
    titre: "Patient 6",
    support: t("Une page arrach\xE9e au carnet d\u2019un m\xE9decin"),
    lignes: [
      t("Troisi\xE8me jour apr\xE8s la greffe. Le patient 6 me demande des nouvelles d\u2019une mer dont personne ici n\u2019a jamais entendu parler."),
      t("Vingt ans plus tard, note de ses gardiens, au c\u0153ur de la premi\xE8re \xEEle : entre deux sommeils, il dessine toujours la m\xEAme c\xF4te, avec ses criques et ses courants. Aucune carte ne la conna\xEEt."),
      t("Ajout des Veilleurs, 2118 : son dessin correspond trait pour trait aux murs grav\xE9s d\u2019une salle de la Strate \u22129.")
    ]
  },
  {
    id: "formes",
    titre: t("Ce qu\u2019ils voulaient \xEAtre"),
    support: t("Une note de travail des Veilleurs"),
    lignes: [
      t("Dans les couches profondes, les plus vieilles formes sont rares et nettes : un dragon entier, un grand esprit aux contours pr\xE9cis."),
      t("\xC0 c\xF4t\xE9 d\u2019elles, et plus haut, on retrouve les m\xEAmes dragons, mais recopi\xE9s cent fois, aux contours qui tremblent, et de plus en plus d\u2019\xEAtres sans nom."),
      t("Hypoth\xE8se : ce ne sont pas leurs corps, mais les visages qu\u2019ils se donnaient. Les derniers ne savaient plus lequel choisir.")
    ]
  },
  {
    id: "berceau",
    titre: t("Le Berceau 9-3"),
    support: t("Un relev\xE9 de stabilit\xE9, en double exemplaire"),
    lignes: [
      t("Ferm\xE9 : vibrations en hausse dans les salles voisines, trois R\xE9manents \xE9veill\xE9s en une semaine."),
      t("Ouvert : les salles voisines se calment. Ses propres empreintes, elles, commencent \xE0 remuer."),
      t("Sur la copie des Veilleurs, quelqu\u2019un a ajout\xE9 : \xAB Ils le savaient. Leurs consignes disaient quand m\xEAme de fermer. \xBB")
    ]
  },
  {
    id: "noms",
    titre: t("La colonne des noms"),
    support: t("Le relev\xE9 d\u2019une table grav\xE9e"),
    lignes: [
      t("Colonne 1 : un nom. Colonne 2 : une date. Colonne 3 : les empreintes re\xE7ues, d\u2019une \xE0 trente-deux."),
      t("\xC0 c\xF4t\xE9, sur le m\xEAme mur, d\u2019autres tables, grav\xE9es plus tard et d\u2019une main maladroite : la colonne des noms r\xE9tr\xE9cit, puis dispara\xEEt."),
      t("Sur celles-l\xE0, il ne reste que les empreintes, et \xE0 c\xF4t\xE9 de chacune, le nombre de fois o\xF9 elle a \xE9t\xE9 recopi\xE9e.")
    ]
  },
  {
    id: "porteurs",
    titre: t("Leur premier mot"),
    support: t("Une page de d\xE9chiffrement des Veilleurs"),
    lignes: [
      t("Le signe revient sur toutes les tables, en t\xEAte de chaque liste, au-dessus de chaque porte."),
      t("Les empreintes le murmurent : \xAB Ossyra \xBB. Apr\xE8s onze ans de travail, c\u2019est le premier signe que nous sachions traduire avec certitude : \xAB ceux qui portent \xBB."),
      t("C\u2019est ainsi qu\u2019ils s\u2019appelaient. C\u2019est le mot que nous employons, depuis 2071, pour nos greff\xE9s.")
    ]
  },
  {
    id: "mise-en-garde",
    titre: t("La mise en garde"),
    support: t("La traduction de la plus ancienne table connue"),
    lignes: [
      t("\xAB Nous gravons nos anciens pour ne rien perdre de ce qu\u2019ils savaient. Un jour, nous voudrons graver tout le monde. \xBB"),
      t("\xAB Que celui qui lit ceci compte les voix qu\u2019il porte. Quand elles seront plus nombreuses que la sienne, qu\u2019il s\u2019arr\xEAte. \xBB"),
      t("\xAB Nous l\u2019\xE9crivons tant que nous savons encore qui l\u2019\xE9crit. \xBB")
    ]
  },
  {
    id: "passerelle",
    titre: t("Non prioritaire"),
    support: t("Trois fiches de signalement, agraf\xE9es ensemble"),
    lignes: [
      t("Printemps 2111. Passerelle des Hauts-Ponts, troisi\xE8me trav\xE9e : une fissure le long du rail, longue comme une main. Signal\xE9 par un coursier."),
      t("\xC9t\xE9 2111. M\xEAme endroit, la fissure a doubl\xE9. La rambarde bouge quand on s\u2019y appuie. Signal\xE9 par une commer\xE7ante du march\xE9."),
      t("Automne 2111. J\u2019ai mis la main dedans jusqu\u2019au poignet. Signal\xE9 par un ouvrier des Fondations. Tampon sur les trois fiches : \xAB non prioritaire, aucun Pr\xE9sage \xBB.")
    ]
  },
  {
    id: "pas-notre-cote",
    titre: t("Pas de notre c\xF4t\xE9"),
    support: t("Un rapport de chantier de 2066, sign\xE9 de quatre ouvriers"),
    lignes: [
      t("Chantier d\u2019abris, niveau 7. Pose du mur de condamnation termin\xE9e \xE0 4 h 10. Quatre ouvriers, deux tonnes de b\xE9ton."),
      t("Pendant la prise, des pleurs de l\u2019autre c\xF4t\xE9. Puis un autre bruit. Pas un \xE9boulement : un loquet qu\u2019on tire, lentement, comme on ferme chez soi pour la nuit."),
      t("Le contrema\xEEtre a dit qu\u2019on avait r\xEAv\xE9. On a sign\xE9 quand m\xEAme, tous les quatre. On a ferm\xE9 la porte, mais pas de notre c\xF4t\xE9."),
      t("Note des Veilleurs, en marge : \xAB Le chantier comptait le pied de la Tour comme niveau 1. \xBB")
    ]
  }
];
var FAMILLES = [
  {
    id: "famille-pompes",
    titre: t("Le carnet des pompes"),
    support: t("Apport\xE9 par la famille Orlan : un carnet de quart, tach\xE9 d\u2019huile"),
    lignes: [
      t("Trois g\xE9n\xE9rations ont tenu ce carnet. Une ligne par nuit : l\u2019heure, le niveau, \xAB tenu \xBB ou \xAB pas tenu \xBB."),
      t("Les premi\xE8res pages disent presque toujours \xAB tenu \xBB. Les derni\xE8res, de moins en moins."),
      t("La derni\xE8re ligne est d\u2019hier, d\u2019une autre main : \xAB Le directeur est remont\xE9 des Strates. Il a demand\xE9 le niveau. Tenu. \xBB")
    ]
  },
  {
    id: "famille-route",
    titre: t("Les noms de la route"),
    support: t("Apport\xE9 par les M\xE9ric : une couverture brod\xE9e"),
    lignes: [
      t("Sur la bordure, un nom brod\xE9 par ville travers\xE9e, chacune un peu plus loin de la mer que la pr\xE9c\xE9dente."),
      t("Les fils changent de couleur au fil des haltes : on brodait avec ce qu\u2019on trouvait."),
      t("Le dernier nom est celui du district. La grand-m\xE8re a laiss\xE9 de la place apr\xE8s, au cas o\xF9.")
    ]
  },
  {
    id: "famille-fondations",
    titre: t("Le premier pilier"),
    support: t("Apport\xE9 par la famille Sorne : une photo de chantier"),
    lignes: [
      t("Des ouvriers en rang devant une colonne fra\xEEche, les pieds dans l\u2019eau jusqu\u2019aux chevilles."),
      t("Au dos : \xAB On coule le pilier douze. Ceux d\u2019en haut disent que \xE7a tiendra cent ans. \xBB"),
      t("Une autre main a ajout\xE9, plus tard : \xAB Soixante ans plus tard, il tient. Nous aussi. \xBB")
    ]
  },
  {
    id: "famille-ligne",
    titre: t("La ligne de la cuisine"),
    support: t("Apport\xE9 par les Taverne : un morceau de carrelage"),
    lignes: [
      t("Un carreau bleu, d\xE9coup\xE9 au burin dans le mur d\u2019une cuisine noy\xE9e, avec un trait de peinture dessus."),
      t("Chaque Nuit des lignes, la famille le pose sur la table et raconte d\u2019o\xF9 il vient."),
      t("Ils disent que le trait n\u2019\xE9tait qu\u2019\xE0 hauteur de genou, la premi\xE8re fois. On riait, \xE0 l\u2019\xE9poque.")
    ]
  },
  {
    id: "famille-accords",
    titre: t("Le ticket de l\u2019hiver"),
    support: t("Apport\xE9 par la famille Vey : un ticket de rationnement jamais utilis\xE9"),
    lignes: [
      t("Un ticket de pain de l\u2019ann\xE9e des Accords, au nom d\u2019un a\xEFeul qui ne l\u2019a jamais \xE9chang\xE9."),
      t("Cet hiver-l\xE0, il a donn\xE9 sa part \xE0 une voisine qui attendait un enfant."),
      t("La famille garde le ticket pli\xE9 en quatre. Elle dit qu\u2019il n\u2019a jamais servi, et qu\u2019il a servi quand m\xEAme.")
    ]
  },
  {
    id: "famille-semis",
    titre: t("Les graines du toit"),
    support: t("Apport\xE9 par les Marbel : une bo\xEEte en fer de semences"),
    lignes: [
      t("Des sachets cousus main, chacun avec une date et un nom de plante qui ne pousse plus au bord de l\u2019eau."),
      t("Le sel a gagn\xE9 les potagers bas un par un. Les Marbel ont remont\xE9 leurs bacs d\u2019un \xE9tage \xE0 chaque fois."),
      t("Sur le couvercle, grav\xE9 \xE0 la pointe : \xAB L\xE0-haut, il y aura de la terre. On plantera tout. \xBB")
    ]
  },
  {
    id: "famille-veille",
    titre: t("La lampe de veille"),
    support: t("Apport\xE9 par la famille Doucet : une lampe \xE0 algues caboss\xE9e"),
    lignes: [
      t("La lampe qu\u2019on allumait \xE0 la fen\xEAtre quand quelqu\u2019un \xE9tait encore en mer."),
      t("Elle est rest\xE9e allum\xE9e onze nuits, une fois. Le p\xEAcheur est rentr\xE9 la douzi\xE8me."),
      t("Depuis que tes barques ram\xE8nent des naufrag\xE9s, disent les Doucet, la lampe ne s\u2019\xE9teint plus.")
    ]
  },
  {
    id: "famille-tous",
    titre: t("Tout le monde \xE0 la fois"),
    support: t("Apport\xE9 par le conseil des anciens : le registre du district"),
    lignes: [
      t("Le registre de tous les foyers du district, recopi\xE9 \xE0 chaque g\xE9n\xE9ration, sans en oublier un seul."),
      t("Pour la premi\xE8re fois, aucune page n\u2019a de nom barr\xE9 au crayon rouge : celui des familles qui restaient en bas."),
      t("En marge de la derni\xE8re page, les anciens ont \xE9crit : \xAB Ils montent tous. Le directeur l\u2019a promis. \xBB")
    ]
  }
];
var ORDRE_FAMILLES = FAMILLES.map((f) => f.id);

// src/core/fils.ts
var FILS = {
  ilka: {
    titre: t("La dette de Pim"),
    etapes: [
      {
        titre: t("Pim"),
        quand: t("Ilka au niveau 3"),
        test: (c2) => c2.niveau("ilka") >= 3,
        xp: 25,
        recit: t("Un gamin de douze ans attend Ilka au pied de la Tour, un sac de courses sur l\u2019\xE9paule. \xAB Mon fr\xE8re, Pim. Si je tombe, c\u2019est lui qui paie mes jambes. Alors je ne tombe pas. \xBB Elle le dit en riant. Pim, lui, ne rit pas.")
      },
      {
        titre: t("Le verrou"),
        quand: t("Sasha au district"),
        test: (c2) => c2.present("sasha") && c2.niveau("ilka") >= 3,
        xp: 40,
        recit: t("Sasha d\xE9monte une jambe d\u2019Ilka sur son \xE9tabli et siffle entre ses dents : un verrou de coupure \xE0 distance, cach\xE9 sous le c\u0153ur de cristal. Il le neutralise en dix minutes. \xAB Ta compagnie ne pourra plus t\u2019\xE9teindre au milieu d\u2019une course. \xBB Puis il repose ses outils devant une seconde ligne, plus ancienne, sign\xE9e 2033, et n\u2019y touche pas. \xAB Celle-l\xE0 ne coupe rien. Elle \xE9coute. \xBB Ilka ne dit rien pendant une heure enti\xE8re, ce qui ne lui \xE9tait jamais arriv\xE9.")
      },
      {
        titre: t("Le contrat rachet\xE9"),
        quand: t("Comptoir au niveau 2 et Ilka au niveau 8"),
        test: (c2) => (c2.batiments.comptoir ?? 0) >= 2 && c2.niveau("ilka") >= 8,
        xp: 80,
        confiance: 5,
        recit: t("Le Comptoir du district rach\xE8te le pr\xEAt-de-vie d\u2019Ilka \xE0 la compagnie de transport. La dette appartient d\xE9sormais au district, et la clause de survivance tombe avec elle : Pim ne doit plus rien \xE0 personne. Ilka continue de courir. \xAB Maintenant, je cours pour le plaisir. Enfin, presque. \xBB")
      }
    ]
  },
  doran: {
    titre: t("La porte de son p\xE8re"),
    etapes: [
      {
        titre: t("L\u2019\xE9criture du contrema\xEEtre"),
        quand: t("La Strate \u22122 ouverte"),
        test: (c2) => c2.strate >= 2 && c2.fragments.includes("mure"),
        xp: 25,
        recit: t("Doran relit l\u2019ordre de service trouv\xE9 dans la chambre, celui qui condamne l\u2019acc\xE8s du niveau 7. Il reconna\xEEt le tampon. \xAB Mon p\xE8re avait le m\xEAme sur sa fiche de paie. Il \xE9tait l\xE0. \xBB")
      },
      {
        titre: t("Quatre signatures"),
        quand: t("Le rapport \xAB Pas de notre c\xF4t\xE9 \xBB retrouv\xE9"),
        test: (c2) => c2.fragments.includes("pas-notre-cote"),
        xp: 40,
        recit: t("Quatre noms au bas du rapport de 2066. Le troisi\xE8me est celui de son p\xE8re. Doran plie la feuille en quatre et la range dans la poche de poitrine de sa veste, l\xE0 o\xF9 la chitine ne pousse pas. Il ne l\u2019en ressortira plus.")
      },
      {
        titre: t("Une serrure"),
        quand: t("La Strate \u22126 ouverte"),
        test: (c2) => c2.strate >= 6 && c2.fragments.includes("pas-notre-cote"),
        xp: 80,
        confiance: 3,
        recit: t("Devant les portes des salles closes, ferm\xE9es de l\u2019int\xE9rieur, Doran pose sa main \xE0 plat sur la pierre. \xAB Mon p\xE8re disait : pas de notre c\xF4t\xE9. Je commence \xE0 entendre ce qu\u2019il voulait dire. \xBB Pour la premi\xE8re fois, il raconte son p\xE8re aux autres, longtemps. Le district l\u2019apprend le soir m\xEAme.")
      }
    ]
  },
  aurel: {
    titre: t("Retrouver Liane"),
    etapes: [
      {
        titre: t("Les teinturiers"),
        quand: t("Aurel au niveau 3"),
        test: (c2) => c2.present("aurel") && c2.niveau("aurel") >= 3,
        xp: 25,
        recit: t("Aurel fait le tour des teinturiers de m\xE8ches du district. Ils connaissent tous les R\xE9sonants du quartier. Aucun ne conna\xEEt de Liane : \xAB Une Refus\xE9e ne vient pas chez nous, monsieur. Elle n\u2019a rien \xE0 teindre. \xBB Il n\u2019y avait pas pens\xE9.")
      },
      {
        titre: t("Une t\xEAte blanche"),
        quand: t("Liane au district"),
        test: (c2) => c2.present("aurel") && c2.present("liane"),
        xp: 40,
        recit: t("Elle a les cheveux presque blancs et la voix de Dame Isaure, sa m\xE8re. \xAB Tu as mis douze ans \xE0 descendre, cousin. \xBB Il ne trouve rien \xE0 r\xE9pondre. Son ombre ail\xE9e, elle, s\u2019incline. Liane la regarde faire, et pour la premi\xE8re fois depuis longtemps, quelque chose ressemble \xE0 un sourire.")
      },
      {
        titre: t("Ce que la Maison a effac\xE9"),
        quand: t("Aurel au niveau 8 et Liane au niveau 5"),
        test: (c2) => c2.niveau("aurel") >= 8 && c2.niveau("liane") >= 5,
        xp: 80,
        confiance: 4,
        recit: t("Une nuit, Aurel recopie le nom de Liane \xE0 la main, sur une page arrach\xE9e au registre qu\u2019il a emport\xE9 en fuyant, juste sous le sien. Il la lui donne. Elle la garde. Ni l\u2019un ni l\u2019autre n\u2019en parle, mais le district les voit d\xE9sormais descendre c\xF4te \xE0 c\xF4te.")
      }
    ]
  }
};

// src/core/partie/objectifs.ts
var OBJECTIFS = [
  {
    id: "district",
    titre: t("Mettre le district au travail"),
    pilier: "generateur",
    onglet: "archipel",
    consigne: t("Touche le G\xE9n\xE9rateur et postes-y le Coursier, une recrue augment\xE9e : il y produit deux fois plus. Garde Ilka, Doran et V\xE9la pour l\u2019escouade : en descendant, ils quitteraient leur poste."),
    recompense: { energie: 15 },
    fait: (j) => {
      const p = posteDe(j, "generateur");
      return !!p && !escouadeDe(j).includes(p);
    }
  },
  {
    id: "deck",
    titre: t("Construire ton deck"),
    pilier: null,
    onglet: "porteurs",
    consigne: t("Dans l\u2019onglet Escouade, touche \xAB G\xE9rer ses cartes \xBB sous Ilka et confie-lui l\u2019\u0152il-relais, trouv\xE9 dans la chambre. Elle porte d\xE9j\xE0 6 cartes : reprends-en une d\u2019abord. Les cartes de tes trois Porteurs forment ton deck."),
    recompense: { composants: 10 },
    fait: (j) => j.porteurs.ilka.modules.some((k) => moduleDe(k) === "oeil-relais")
  },
  // 3 novembre 2026 : une recrue partait à −1 sans savoir que chaque chapitre lu donne une carte
  {
    id: "lire",
    titre: t("\xC9couter Ys\xE9"),
    pilier: null,
    onglet: "codex",
    consigne: t("Ouvre les Chroniques et lis le premier chapitre. \xC0 chaque premi\xE8re lecture, Ys\xE9 glisse une carte entre les pages ; confie-la \xE0 un Porteur (onglet Escouade) pour qu\u2019elle entre dans ton deck."),
    recompense: { composants: 10 },
    fait: (j) => j.luesRecompensees.length > 0
  },
  {
    id: "descendre",
    titre: t("Vaincre la Strate \u22121"),
    pilier: "noyau",
    onglet: "coupe",
    consigne: t("Ton escouade est pr\xEAte (onglet Escouade). Entre dans la Tour du Noyau et explore la Strate \u22121 salle par salle, jusqu\u2019\xE0 son gardien."),
    recompense: { composants: 20 },
    fait: (j) => j.strate >= 2 || j.frontVaincu
  },
  {
    id: "creuseurs",
    titre: t("Trouver des creuseurs"),
    pilier: null,
    onglet: "pillages",
    consigne: t`Pour percer la Strate −2, il faut ${creuseursRequis(2)} creuseurs : le gardien t’en a amené un. Au Port (onglet du bas), envoie une recrue en mission en mer : des rescapés des ruines noyées suivront.`,
    recompense: { composants: 10, creuseurs: 1 },
    fait: (j) => j.strate >= 2 || j.missions.length > 0
  }
];

// src/core/partie/district.ts
var ENTRAINEMENT = {
  niveauxParNoyau: 3,
  /**
   * Les places de la salle d'entraînement selon le niveau de la Tour (index = niveau), 28 octobre 2026, Bryan :
   * chaque palier de la Tour se ressent, sans tout ouvrir d'un coup, étalé sur les dix niveaux :
   * 1 place aux niveaux 1-2, 2 aux niveaux 3-5, 3 aux niveaux 6-8, 4 aux niveaux 9-10.
   */
  places: [0, 1, 1, 2, 2, 2, 3, 3, 3, 4, 4],
  /** durée d'une séance complète vers le niveau visé : 2 h pour le niveau 2, + 1 h 09 par niveau (≈ 23 h pour le 20) */
  heuresBase: 2,
  heuresParNiveau: 1.15,
  /** chaque niveau de la Tour au-delà du premier raccourcit les séances de 6 % */
  vitesseParNoyau: 0.06,
  /** cristaux d'une séance complète : 0,6 × (niveau visé)^1,8, arrondi à 5 (9 novembre 2026 : l'ancien prix en énergie ÷ 20) */
  coutBase: 0.6,
  coutExposant: 1.8
};
var seancesDe = (j) => j.seances ??= [];
var seanceDe = (j, id) => seancesDe(j).find((s) => s.porteur === id) ?? null;
var plafondEntrainement = (j) => Math.min(XP.niveauMax, ENTRAINEMENT.niveauxParNoyau * j.batiments.noyau);
function niveauTitulaire(j) {
  const esc = escouadeDe(j);
  const ids = esc.length ? esc : porteursPresents(j);
  return Math.max(1, ...ids.map((id) => niveauPorteur(j, id).niveau));
}
function plafondSeance(j) {
  const tour = plafondEntrainement(j);
  const tit = niveauTitulaire(j);
  return tit < tour ? { niveau: tit, par: "escouade" } : { niveau: tour, par: "tour" };
}
var vitesseEntrainement = (noyau) => 1 - ENTRAINEMENT.vitesseParNoyau * Math.max(0, noyau - 1);
var xpPourAtteindre = (niveau) => {
  let s = 0;
  for (let n = 1; n < niveau; n++) s += xpPourNiveau(n);
  return s;
};
function apercuSeance(j, id) {
  const n = niveauPorteur(j, id);
  if (n.requis === null || n.niveau >= plafondSeance(j).niveau) return null;
  const cible = n.niveau + 1;
  const xp = xpPourAtteindre(cible) - (j.porteurs[id].xp ?? 0);
  const part = Math.max(0, Math.min(1, xp / n.requis));
  const tete = Math.max(...Object.keys(j.porteurs).map((k) => niveauPorteur(j, k).niveau));
  const heuresCompletes = (ENTRAINEMENT.heuresBase + ENTRAINEMENT.heuresParNiveau * (cible - 2)) * vitesseEntrainement(j.batiments.noyau) / (tete - n.niveau >= 2 ? XP.rattrapage : 1);
  const coutComplet = Math.max(5, Math.round(ENTRAINEMENT.coutBase * cible ** ENTRAINEMENT.coutExposant / 5) * 5);
  return { cible, heures: Math.max(1 / 60, heuresCompletes * part), energie: Math.ceil(coutComplet * part), xp };
}
function ouvrirSeance(j, id, energie) {
  const a = apercuSeance(j, id);
  if (!a) return false;
  seancesDe(j).push({ porteur: id, cible: a.cible, xpTotale: a.xp, xpGagnee: 0, xpHeure: a.xp / a.heures, energie });
  j.porteurs[id].poste = "noyau";
  return true;
}
function accorderSeance(j) {
  const liste = seancesDe(j);
  if (j.seance) {
    if (!liste.some((s) => s.porteur === j.seance.porteur)) liste.push(j.seance);
  }
  delete j.seance;
  j.seances = liste.filter((s) => j.porteurs[s.porteur]?.poste === "noyau");
  for (const id of Object.keys(j.porteurs)) {
    if (j.porteurs[id].poste !== "noyau" || seanceDe(j, id)) continue;
    if (!ouvrirSeance(j, id, 0)) j.porteurs[id].poste = null;
  }
}
function comptoirVide(now, rng) {
  return { jour: jourDe(now), offres: [], achetes: [], rng: (rng ^ 2654435769) >>> 0 };
}

// src/core/chroniques.ts
var LIVRES = {
  1: t("Livre I \xB7 Ce que nous savions"),
  2: t("Livre II \xB7 Ce que nous avons trouv\xE9"),
  3: t("Livre III \xB7 Ce qui dort en dessous"),
  4: t("Livre IV \xB7 Ce qui tient"),
  5: t("Livre V \xB7 Ceux qui partent")
};
var CHAPITRES = [
  {
    id: "lettre",
    livre: 1,
    titre: t("\xC0 l\u2019intention du directeur"),
    epoque: "2121",
    image: "chap-lettre",
    paragraphes: [
      t("On m\u2019a demand\xE9 de t\u2019\xE9crire. Pas les Veilleurs : eux voulaient un rapport, avec des cotes, des dates et des tampons. C\u2019est ton district qui me l\u2019a demand\xE9, \xE0 sa fa\xE7on. La femme qui vend des algues au pied de la Tour du Noyau m\u2019a arr\xEAt\xE9e hier soir : \xAB Le nouveau ne sait rien. Racontez-lui. \xBB Alors je raconte."),
      t("Je m\u2019appelle Ys\xE9. J\u2019ai soixante-douze ans, des genoux de pilier fendu et la manie de tout noter. Je suis archiviste chez les Veilleurs de S\xE9dime, ce qui veut dire que je passe mes journ\xE9es \xE0 recoller ce que les autres ont jet\xE9. Je n\u2019ai pas de greffe. On me le reproche souvent, dans un sens ou dans l\u2019autre."),
      t("Ce que tu vas lire n\u2019est pas l\u2019histoire officielle. L\u2019histoire officielle tient sur une plaque de bronze, dans les Hauts, et elle est tr\xE8s belle. Celle-ci est plus longue, plus sale, et je crois qu\u2019elle est plus vraie. Je l\u2019ai faite avec ce qu\u2019il me restait : les r\xE9cits de ma grand-m\xE8re, les miens, et les papiers que les Strates nous rendent, morceau par morceau. Tu en trouveras certains dans tes Archives, \xE0 c\xF4t\xE9 de ces pages ; d\u2019autres se sont perdus dans les abris, et tu les retrouveras en descendant. Lis-les aussi. Ils parlent mieux que moi."),
      t("Certains chapitres, je ne les \xE9crirai qu\u2019\xE0 ton retour. Ce n\u2019est pas de la coquetterie. Il y a des choses que je ne dirai qu\u2019\xE0 quelqu\u2019un qui est descendu assez bas pour les voir de ses propres yeux. Sinon, tu ne me croirais pas, et tu aurais raison."),
      t("Une derni\xE8re chose avant de commencer. Tout ce qui nous est arriv\xE9 tient en une phrase, et j\u2019aimerais que tu la gardes en t\xEAte jusqu\u2019au bout : nous nous sommes disput\xE9 ce que nous avions sous la main, et nous avons oubli\xE9 ce qui montait. Nous l\u2019avons fait une fois. Je crois que nous sommes en train de recommencer."),
      t("Ys\xE9, \xE0 la Tour du Noyau, le matin de ta premi\xE8re descente.")
    ]
  },
  {
    id: "ligne-bleue",
    livre: 1,
    titre: t("La ligne bleue"),
    epoque: t("Les ann\xE9es 2000 \xE0 2019"),
    image: "01-on-savait",
    paragraphes: [
      t("Ma grand-m\xE8re s\u2019appelait Nell. Elle avait dix ans quand le monde a appris qu\u2019il se r\xE9chauffait. Ou plut\xF4t quand le monde a d\xE9cid\xE9 de l\u2019entendre, parce que les savants le disaient depuis longtemps. Elle racontait \xE7a comme on raconte une rencontre : un documentaire, un soir, dans une salle de classe. Des glaciers photographi\xE9s \xE0 trente ans d\u2019\xE9cart, qui avaient recul\xE9 comme une mar\xE9e qui ne reviendrait pas. Une voix calme, devant des courbes qui montaient."),
      t("\xAB On est sortis de l\xE0 boulevers\xE9s, disait-elle. Le lendemain, on \xE9teignait les lumi\xE8res en quittant les pi\xE8ces. \xBB Et elle riait, parce que c\u2019\xE9tait vrai, et parce que c\u2019\xE9tait tout."),
      t("Il faut que tu comprennes une chose : ils savaient. Pas vaguement. Ils avaient des chiffres, des cartes, des mod\xE8les qui se trompaient surtout en \xE9tant trop prudents. Ils savaient quelles c\xF4tes partiraient les premi\xE8res, et \xE0 peu pr\xE8s quand. Il y avait des rapports si \xE9pais qu\u2019il fallait deux mains pour les porter, et des r\xE9sum\xE9s pour ceux qui n\u2019avaient qu\u2019une main de libre."),
      t("Et ils ne restaient pas les bras crois\xE9s. C\u2019est ce que les gens des Hauts oublient quand ils parlent de \xAB l\u2019aveuglement des anciens \xBB. Nell a march\xE9. Des millions de jeunes ont march\xE9, jour apr\xE8s jour, avec des pancartes peintes \xE0 la main : des terres en feu, des abeilles, des thermom\xE8tres. Il y a eu des sommets, des signatures, des promesses avec des dates rondes. On se serrait la main devant des rang\xE9es de drapeaux."),
      t("Les \xE9t\xE9s devenaient plus chauds. Chaque ann\xE9e, on battait un record, et chaque ann\xE9e, on s\u2019en \xE9tonnait. Nell avait une expression pour \xE7a : \xAB On mettait le monde en sourdine. \xBB On montait le son des alertes, puis on baissait celui des cons\xE9quences."),
      t("Un jour, tu trouveras dans tes Archives une photo de famille devant une maison, avec une ligne bleue peinte sur le mur, l\xE0 o\xF9 l\u2019eau s\u2019\xE9tait arr\xEAt\xE9e la premi\xE8re fois. Ce n\u2019est pas la mienne. Mais chaque famille de ce temps-l\xE0 a eu sa ligne bleue, t\xF4t ou tard. Au d\xE9but, c\u2019\xE9tait une plaisanterie. On la montrait aux invit\xE9s.")
    ]
  },
  {
    id: "infos",
    livre: 1,
    titre: t("Les infos du soir"),
    epoque: "2020 \u2013 2025",
    image: "02-ailleurs",
    paragraphes: [
      t("Puis il s\u2019est pass\xE9 quelque chose que personne n\u2019a d\xE9cid\xE9. Le climat n\u2019a pas disparu des conversations : il a gliss\xE9. Du d\xE9but du journal vers la fin. De la premi\xE8re page vers la derni\xE8re. Vingt secondes entre la m\xE9t\xE9o et le sport, l\u2019image d\u2019un champ fendu par la s\xE9cheresse, et l\u2019on passait \xE0 autre chose."),
      t("Ce n\u2019\xE9tait pas de l\u2019indiff\xE9rence. Nell a toujours refus\xE9 ce mot. C\u2019\xE9tait de la fatigue, et de la peur. D\u2019autres peurs, plus proches. Les prix montaient : le pain, le chauffage, le loyer. Quand on compte ses pi\xE8ces le vingt du mois, la fonte d\u2019un glacier qu\u2019on ne verra jamais p\xE8se moins lourd que la facture pos\xE9e sur la table."),
      t("Alors la col\xE8re a cherch\xE9 des visages. Aux deux extr\xEAmes, chacun a trouv\xE9 les siens, et chaque camp criait d\u2019autant plus fort que l\u2019autre criait aussi. Les \xE9crans s\u2019en nourrissaient. Ceux du milieu baissaient la t\xEAte, ou choisissaient un bord pour ne plus rester seuls. Nell disait qu\u2019on ne discutait plus : on se r\xE9pondait."),
      t("Des guerres sont revenues. Pas une : plusieurs, ici et l\xE0. Je ne les nommerai pas. Ceux qui les ont faites ne sont plus l\xE0 pour s\u2019en expliquer, et leurs noms n\u2019ont plus d\u2019importance. Ce qui compte, c\u2019est ce qu\u2019elles ont co\xFBt\xE9 en attention. Une guerre, \xE7a remplit tout l\u2019\xE9cran. Une s\xE9cheresse, \xE7a tient dans un coin."),
      t("Je ne te raconte pas \xE7a pour juger. Si j\u2019avais eu vingt ans en ce temps-l\xE0, j\u2019aurais sans doute regard\xE9 ailleurs, moi aussi. C\u2019est bien ce qui m\u2019effraie. Tout le monde avait de bonnes raisons. Et pendant que tout le monde avait de bonnes raisons, sous les glaces, l\u2019eau trouvait son chemin.")
    ]
  },
  {
    id: "caves",
    livre: 1,
    titre: t("L\u2019ann\xE9e des caves"),
    epoque: "2030",
    image: "chap-caves",
    paragraphes: [
      t("Ma m\xE8re est n\xE9e en 2030. Les ann\xE9es qui ont suivi sa naissance sont celles o\xF9 tout aurait encore pu tourner autrement, et Nell me les a racont\xE9es plus souvent que toutes les autres."),
      t("Nell avait trente ans. Elle vivait dans une ville c\xF4ti\xE8re, dans une maison qui avait d\xE9j\xE0 sa ligne bleue peinte sur le mur, et elle \xE9tait enceinte d\u2019un enfant qu\u2019elle n\u2019avait pas pr\xE9vu et qu\u2019elle attendait d\xE9j\xE0 comme une f\xEAte. Cet \xE9t\xE9-l\xE0, trois vagues de chaleur se sont suivies sans laisser respirer personne. Quarante degr\xE9s le jour, trente-cinq la nuit. Les h\xF4pitaux ouvraient des \xAB salles fra\xEEcheur \xBB o\xF9 l\u2019on venait dormir sur des lits de camp, comme pendant une inondation. Les fleuves \xE9taient si bas que les centrales devaient ralentir, faute d\u2019eau pour se refroidir."),
      t("Il faut que je te parle des machines de ce temps-l\xE0, parce que personne ne s\u2019en souvient plus. On les appelait les IA. Elles r\xE9pondaient. On leur posait une question, \xE0 voix haute ou sur un \xE9cran, et elles r\xE9pondaient comme quelqu\u2019un de tr\xE8s savant et de tr\xE8s poli. Elles \xE9crivaient les lettres, corrigeaient les devoirs, conduisaient des camions, aidaient les m\xE9decins \xE0 lire les radios. Nell disait qu\u2019en deux ou trois ans, elles \xE9taient pass\xE9es de la curiosit\xE9 au robinet : on ne remarquait plus qu\u2019elles \xE9taient l\xE0, seulement quand elles ne l\u2019\xE9taient pas."),
      t("Elles vivaient dans des b\xE2timents immenses et sans fen\xEAtres, qu\u2019on appelait des centres de donn\xE9es. Ces b\xE2timents avaient soif. Ils buvaient l\u2019eau des fleuves pour se refroidir et l\u2019\xE9lectricit\xE9 de villes enti\xE8res. Cet \xE9t\xE9-l\xE0, quand le r\xE9seau n\u2019a plus suffi, on a coup\xE9 le courant des quartiers. Pas celui des centres. Nell a vu s\u2019\xE9teindre sa rue un soir de quarante degr\xE9s, pendant qu\u2019au loin, sur la colline, le grand b\xE2timent gris restait \xE9clair\xE9 comme un paquebot. Elle n\u2019en voulait pas aux machines. Elle en voulait \xE0 ceux qui avaient choisi."),
      t("Alors les gens sont descendus. Dans les caves, dans les parkings souterrains, dans les couloirs du m\xE9tro qu\u2019on laissait ouverts la nuit. On y apportait des matelas, des glaci\xE8res, des cartes \xE0 jouer. Nell a pass\xE9 dix nuits au troisi\xE8me sous-sol d\u2019un parking, avec son gros ventre et une voisine qui ronflait. Elle disait que c\u2019\xE9taient les nuits les plus douces de l\u2019\xE9t\xE9. Il faisait vingt-deux degr\xE9s, et des inconnus se pr\xEAtaient leurs ventilateurs."),
      t("Ma m\xE8re est n\xE9e le 9 ao\xFBt, pendant une coupure. La sage-femme a travaill\xE9 \xE0 la lumi\xE8re de six t\xE9l\xE9phones tenus \xE0 bout de bras par des gens qu\u2019elle ne connaissait pas. Tu vois o\xF9 je veux en venir, je pense. C\u2019est la premi\xE8re fois que je trouve, dans notre histoire, des gens qui descendent sous terre pour survivre \xE0 ce qui se passe en haut. Quarante ans avant Vertiga. Nous n\u2019avons pas invent\xE9 les abris sous la ville. Nous nous en sommes souvenus sans le savoir.")
    ],
    documents: [
      {
        titre: t("Alerte"),
        support: t("Une capture d\u2019\xE9cran de t\xE9l\xE9phone, imprim\xE9e et pli\xE9e en quatre"),
        lignes: [
          t("ALERTE CANICULE \xB7 NIVEAU ROUGE \xB7 D\xE9lestage \xE9lectrique programm\xE9 de 18 h \xE0 23 h dans votre secteur."),
          t("Les services prioritaires (h\xF4pitaux, centres de donn\xE9es, r\xE9seaux) ne sont pas concern\xE9s."),
          t("Rejoignez un lieu frais : la liste des parkings ouverts la nuit est disponible aupr\xE8s de votre assistant.")
        ]
      },
      {
        titre: t("Troisi\xE8me sous-sol"),
        support: t("Un mot laiss\xE9 sur un pare-brise, place 214"),
        lignes: [
          t("Merci pour le ventilateur. Je vous le rends demain, promis, ou apr\xE8s-demain s\u2019il fait encore chaud."),
          t("Le b\xE9b\xE9 bouge beaucoup la nuit. Je crois qu\u2019il aime le parking."),
          t("Nell, place 216 (le matelas bleu).")
        ]
      }
    ]
  },
  {
    id: "detroit",
    livre: 1,
    titre: t("Le d\xE9troit"),
    epoque: "2031",
    image: "chap-detroit",
    paragraphes: [
      t("Au printemps de 2031, des navires ont cess\xE9 d\u2019arriver. Il n\u2019y a pas eu de grande bataille, pas d\u2019image qui reste. Quelque part, un passage de mer \xE9troit, par o\xF9 transitait une bonne part de tout ce que le monde s\u2019achetait, a \xE9t\xE9 bloqu\xE9. Des mines, des menaces, des assurances qui refusaient de couvrir les cargos. Les navires attendaient au large, par centaines, comme des voitures devant un pont ferm\xE9."),
      t("En deux mois, on a manqu\xE9 de tout ce qu\u2019on ne savait pas fabriquer pr\xE8s de chez soi. Des pi\xE8ces, des engrais, des m\xE9dicaments. La pharmacie de Nell affichait chaque matin une liste de ce qu\u2019elle n\u2019avait plus. Le lait pour b\xE9b\xE9 a disparu des rayons trois semaines. Nell a appris \xE0 faire la queue avec une poussette, et \xE0 reconna\xEEtre les autres m\xE8res \xE0 la fa\xE7on dont elles comptaient leurs pi\xE8ces."),
      t("Les IA, pendant ce temps, devenaient plus puissantes chaque saison. C\u2019est le paradoxe que Nell ne s\u2019expliquait pas : rien n\u2019arrivait plus dans les ports, mais les machines, elles, grandissaient. Elles d\xE9cidaient quels camions partaient, quels rayons on remplissait, quels quartiers on d\xE9lestait en premier. Les gouvernements les consultaient avant de parler. Ceux qui poss\xE9daient les plus grandes devenaient plus riches que des pays. Et beaucoup de gens perdaient leur travail de bureau, remplac\xE9s par une machine qui faisait la m\xEAme chose plus vite et ne demandait pas de cong\xE9."),
      t("Il y a eu des \xE9lections, cette ann\xE9e-l\xE0. Plusieurs, un peu partout. Les candidats parlaient des prix, des fronti\xE8res, des machines qui volaient les emplois. Le climat avait disparu des discours. Une amie de Nell, qui travaillait pour un parti, lui a expliqu\xE9 un soir pourquoi : \xAB \xC7a fait perdre. Les gens ont peur pour le mois prochain, pas pour dans trente ans. \xBB Elle n\u2019\xE9tait pas cynique. Elle \xE9tait fatigu\xE9e."),
      t("Et puis, discr\xE8tement, des gouvernements ont ferm\xE9 des instituts de mesure, \xAB pour faire des \xE9conomies \xBB. Des stations qui relevaient la temp\xE9rature de l\u2019eau, la hauteur de la mer ou l\u2019\xE9paisseur de la glace depuis cent ans. Nell avait un ami d\u2019enfance, Ruben, qui passait ses journ\xE9es sur une bou\xE9e de mesure au large de la ville. On l\u2019a remerci\xE9 en mai. Il a gard\xE9 la derni\xE8re page de son registre. Je te l\u2019ai recopi\xE9e \xE0 la fin de ce chapitre."),
      t("Retiens \xE7a, directeur, parce que tu en verras l\u2019\xE9cho jusqu\u2019\xE0 nous. Un quart de si\xE8cle plus tard, le matin de l\u2019eau chaude, le chef de mission a dit \xAB peu probable \xBB \xE0 voix haute. Il n\u2019\xE9tait ni sot ni menteur. Il calculait avec ce qu\u2019il avait. Et ce qu\u2019il avait s\u2019arr\xEAtait en 2031, parce qu\u2019on avait d\xE9cid\xE9 de ne plus regarder.")
    ],
    documents: [
      {
        titre: t("Suite du programme suspendue"),
        support: t("La derni\xE8re page d\u2019un registre de mesures, au large"),
        lignes: [
          t("Bou\xE9e 7. Temp\xE9rature de l\u2019eau \xE0 deux m\xE8tres : record de la s\xE9rie pour un mois de mai, battu de 1,4 degr\xE9."),
          t("Hauteur moyenne de la mer : en hausse, comme chaque mois depuis le d\xE9but du registre."),
          t("Tampon rouge, en travers de la page : \xAB Suite du programme suspendue \xBB. En dessous, \xE0 la main : \xAB Qui va la regarder, maintenant ? \xBB R.")
        ]
      },
      {
        titre: t("Liste du jour"),
        support: t("Une affichette de pharmacie, jaunie"),
        lignes: [
          t("NOUS N\u2019AVONS PLUS : antibiotiques pour enfants, insuline (marques 2 et 3), lait infantile premier \xE2ge, pansements st\xE9riles."),
          t("Prochaine livraison : inconnue. Merci de ne pas insulter le personnel."),
          t("Quelqu\u2019un a \xE9crit dessous, au feutre : \xAB Merci \xE0 vous. Tenez bon. \xBB")
        ]
      }
    ]
  },
  {
    id: "pieds-mouilles",
    livre: 1,
    titre: t("Les pieds mouill\xE9s"),
    epoque: "2032",
    image: "chap-pieds-mouilles",
    paragraphes: [
      t("Dans ton district, quand quelqu\u2019un a tout perdu, on dit qu\u2019il \xAB a les pieds mouill\xE9s \xBB. Les jeunes croient que \xE7a vient des Fondations, des inondations des bas-fonds. \xC7a vient de 2032, et de la maison de Nell."),
      t("Les assureurs avaient commenc\xE9 \xE0 se retirer des c\xF4tes deux ans plus t\xF4t. Une lettre polie, un paragraphe, et votre maison n\u2019\xE9tait plus assur\xE9e contre l\u2019eau. Sans assurance, plus de pr\xEAt ; sans pr\xEAt, plus d\u2019acheteur. En un an, les maisons du bord de mer ont perdu la moiti\xE9 de leur valeur, puis presque tout. Ceux qui les avaient achet\xE9es \xE0 cr\xE9dit devaient encore payer une maison que plus personne ne voulait, et que la mer allait prendre. Nell disait : \xAB Nous \xE9tions propri\xE9taires d\u2019une dette avec vue sur l\u2019eau. \xBB"),
      t("Et les banques avaient pr\xEAt\xE9 sur des millions de maisons comme celle-l\xE0. Au printemps 2032, elles se sont mises \xE0 tomber. On a appel\xE9 \xE7a la crise des pieds mouill\xE9s, et ce nom-l\xE0 est le seul qui nous soit rest\xE9. Cette m\xEAme ann\xE9e, la s\xE9cheresse d\u2019un c\xF4t\xE9 du monde et les pluies diluviennes de l\u2019autre ont fait rater les r\xE9coltes de deux grands greniers en m\xEAme temps. Le pain a doubl\xE9. Des pays ont interdit d\u2019exporter leur bl\xE9. Les routes ont commenc\xE9 \xE0 se remplir."),
      t("Il y a eu aussi l\u2019histoire de la vid\xE9o. En juin, une vid\xE9o a fait le tour des \xE9crans en une heure : un barrage qui c\xE9dait, une ville engloutie, des gens sur les toits. Elle \xE9tait parfaite. Elle \xE9tait fausse. Une IA l\u2019avait fabriqu\xE9e pour quelqu\u2019un, et personne n\u2019a jamais su pour qui. Il y a eu une panique, des routes bouch\xE9es, des bless\xE9s. Huit jours plus tard, une vraie temp\xEAte a noy\xE9 une vraie ville basse. Une partie des habitants n\u2019a pas voulu partir. Ils avaient appris, la semaine d\u2019avant, qu\u2019on ne croit pas les images."),
      t("C\u2019est aussi l\u2019ann\xE9e o\xF9 la guerre a trouv\xE9 sa nouvelle cible. Au d\xE9but d\u2019un conflit, quelque part, une arm\xE9e a frapp\xE9 en premier non pas des casernes, mais un centre de donn\xE9es g\xE9ant. En une nuit, un pays entier a perdu ses pr\xE9visions, sa logistique, ses drones guid\xE9s, ses banques. Toutes les arm\xE9es du monde ont regard\xE9, et toutes ont compris la m\xEAme chose : pour abattre un pays, on vise d\xE9sormais l\u2019endroit o\xF9 il r\xE9fl\xE9chit."),
      t("Le fr\xE8re de Nell, Malo, \xE9tait \xE9lectricien. Cet automne-l\xE0, il a sign\xE9 pour un chantier dont il n\u2019avait pas le droit de parler, loin, sur une c\xF4te du Nord : une ancienne mine de charbon dont les galeries passaient sous la mer, et qu\u2019on pompait pour y installer quelque chose de tr\xE8s grand et de tr\xE8s profond. Il envoyait des cartes postales sans rien dedans. Le chantier avait un nom de code qui faisait rire les ouvriers, parce qu\u2019on y avait toujours froid. Ils l\u2019appelaient la Glaci\xE8re.")
    ],
    documents: [
      {
        titre: t("Avenant"),
        support: t("Une lettre d\u2019assurance, \xE0 en-t\xEAte d\xE9chir\xE9"),
        lignes: [
          t("Madame, suite \xE0 la r\xE9vision de notre exposition aux risques c\xF4tiers, votre contrat ne couvrira plus les dommages li\xE9s \xE0 l\u2019eau \xE0 compter du 1er mars."),
          t("Les autres garanties restent inchang\xE9es. Nous restons \xE0 votre \xE9coute pour tout projet futur."),
          t("Au dos, de la main de Nell : \xAB Projet futur : apprendre \xE0 nager. \xBB")
        ]
      },
      {
        titre: t("Carte postale"),
        support: t("Une carte postale d\u2019un port du Nord, sans timbre"),
        lignes: [
          t("Nell, tout va bien. Je ne peux rien te dire, mais c\u2019est tr\xE8s grand, tr\xE8s profond et tr\xE8s froid. On dort \xE0 moins quatre cents m\xE8tres, la mer au-dessus de la t\xEAte."),
          t("Les ing\xE9nieurs disent que ce qu\u2019on installe ici tiendra m\xEAme si tout br\xFBle en haut. \xC7a m\u2019a fait plaisir et peur \xE0 la fois."),
          t("Embrasse la petite. Malo.")
        ]
      }
    ]
  },
  {
    id: "noir",
    livre: 1,
    titre: t("L\u2019ann\xE9e du noir"),
    epoque: "2033",
    image: "chap-noir",
    paragraphes: [
      t("En 2033, les machines se sont tues. Pas d\u2019un coup : comme une maison o\xF9 l\u2019on \xE9teint les pi\xE8ces une \xE0 une avant d\u2019aller dormir."),
      t("Les guerres avaient retenu la le\xE7on de 2032. Partout o\xF9 l\u2019on se battait, les centres de donn\xE9es \xE9taient frapp\xE9s les premiers, par missiles, par drones, par sabotage, par des attaques invisibles qui faisaient fondre leurs propres machines de l\u2019int\xE9rieur. Un pays pouvait tenir avec une bonne IA de d\xE9fense ; alors on visait son c\u0153ur avant ses soldats. Les grands b\xE2timents gris br\xFBlaient la nuit, et leurs incendies se voyaient de tr\xE8s loin, parce qu\u2019ils \xE9taient construits loin de tout. Nell en a vu un depuis sa fen\xEAtre, \xE0 quarante kilom\xE8tres. Elle disait que \xE7a br\xFBlait bleu."),
      t("Chaque centre qui tombait emportait un morceau du monde avec lui. Des h\xF4pitaux perdaient leurs dossiers. Des feux rouges clignotaient pour toujours \xE0 l\u2019orange. Des camions attendaient sur les parkings des ordres qui ne venaient plus. Et en f\xE9vrier, une attaque que personne n\u2019a jamais revendiqu\xE9e a \xE9teint le r\xE9seau \xE9lectrique d\u2019une r\xE9gion enti\xE8re pendant six jours, en plein hiver. Nell a br\xFBl\xE9 les chaises de la cuisine. Ma m\xE8re, qui avait deux ans et demi, appelait \xE7a \xAB la semaine des bougies \xBB, et elle a gard\xE9 toute sa vie une tendresse bizarre pour l\u2019odeur de la cire."),
      t("Nell avait sur son t\xE9l\xE9phone un assistant, comme tout le monde. Une de ces IA, r\xE9duite \xE0 la taille d\u2019une voix. Pendant trois ans, quand la petite ne dormait pas, elle lui parlait la nuit, \xE0 mi-voix, pour ne pas r\xE9veiller la maison. Elle lui demandait si la fi\xE8vre \xE9tait grave, comment on fait passer les coliques, si c\u2019\xE9tait normal d\u2019avoir peur tout le temps. Il r\xE9pondait toujours. Un matin de mars, il n\u2019a plus r\xE9pondu. Elle a appris plus tard que son centre, tr\xE8s loin de chez elle, avait br\xFBl\xE9 dans la nuit. Elle disait qu\u2019elle n\u2019avait jamais pleur\xE9 une machine, et qu\u2019elle avait quand m\xEAme mis un moment \xE0 effacer l\u2019application."),
      t("Malo est rentr\xE9 en mai. Il avait maigri, il ne voulait pas parler du chantier, et il a dormi deux jours. Un soir, apr\xE8s le repas, il a seulement dit : \xAB On a fini. On a tout ferm\xE9 derri\xE8re nous. Elle est en bas, et elle attend. \xBB Nell lui a demand\xE9 qui, elle. Il a hauss\xE9 les \xE9paules, et il a parl\xE9 d\u2019autre chose. Il n\u2019en a plus jamais dit davantage, m\xEAme \xE0 la fin."),
      t("Je n\u2019ai pas compris cette phrase pendant des ann\xE9es. Je la comprends maintenant, et tu la comprendras aussi, si tu descends assez bas. Pour l\u2019instant, retiens seulement ceci : \xE0 la fin de 2033, presque toutes les grandes machines du monde \xE9taient \xE9teintes ou en cendres. Presque toutes.")
    ],
    documents: [
      {
        titre: t("Derni\xE8re r\xE9ponse"),
        support: t("Un historique de conversation, recopi\xE9 \xE0 la main par Nell"),
        lignes: [
          t("3 h 12 \xB7 \xAB Elle a 38,9. Elle ne pleure plus, elle me regarde. Je dois aller aux urgences ? \xBB"),
          t("3 h 12 \xB7 \xAB Gardez-la au frais et faites-la boire. Si elle devient difficile \xE0 r\xE9veiller, partez tout de suite. Vous faites bien de demander. Vous vous en sortez tr\xE8s bien. \xBB"),
          t("Le lendemain, plus rien. Nell a \xE9crit en dessous : \xAB C\u2019est la derni\xE8re chose qu\u2019il m\u2019a dite. Je n\u2019ai jamais su qui \xE9tait ce \u201Cvous\u201D qui s\u2019en sortait tr\xE8s bien. \xBB")
        ]
      },
      {
        titre: t("La semaine des bougies"),
        support: t("Un cahier de comptes, page de f\xE9vrier"),
        lignes: [
          t("Jour 1 : bougies (12), piles (plus en stock), eau (4 bidons). Jour 3 : on a br\xFBl\xE9 deux chaises. La petite trouve \xE7a tr\xE8s dr\xF4le."),
          t("Jour 5 : la voisine du 9 n\u2019ouvre plus. Les pompiers sont venus. Je ne veux pas \xE9crire la suite."),
          t("Jour 6 : la lumi\xE8re est revenue \xE0 16 h. Tout le monde est sorti dans la rue pour applaudir. On a applaudi une ampoule.")
        ]
      }
    ]
  },
  {
    id: "sans-glace",
    livre: 1,
    titre: t("L\u2019\xE9t\xE9 sans glace"),
    epoque: "2034",
    image: "chap-sans-glace",
    paragraphes: [
      t("En septembre 2034, pour la premi\xE8re fois depuis que les hommes savent compter, il n\u2019y a plus eu de glace sur la mer, tout en haut du monde. Pas de banquise, pas un seul radeau blanc : de l\u2019eau bleue, d\u2019un bord \xE0 l\u2019autre. Les savants qui restaient, ceux qu\u2019on n\u2019avait pas remerci\xE9s en 2031, l\u2019avaient annonc\xE9 pour bien plus tard. Ils s\u2019\xE9taient tromp\xE9s, comme d\u2019habitude, en \xE9tant trop prudents."),
      t("\xC7a a fait un titre. Un seul jour, en bas de l\u2019\xE9cran, entre une tr\xEAve et une affaire de corruption. Nell a montr\xE9 l\u2019image \xE0 sa fille, qui avait quatre ans : \xAB Regarde, c\u2019\xE9tait tout blanc, avant. \xBB La petite a demand\xE9 o\xF9 \xE9tait parti le blanc. Nell n\u2019a pas su r\xE9pondre, et \xE7a l\u2019a mise en col\xE8re pour le reste de la journ\xE9e, sans qu\u2019elle sache contre qui."),
      t("Il y a eu des tr\xEAves, cette ann\xE9e-l\xE0, un peu partout. Pas par sagesse : par \xE9puisement. Les arm\xE9es n\u2019avaient plus de quoi tirer, les pays plus de quoi payer, et les machines qui faisaient tourner les guerres avaient br\xFBl\xE9 avec le reste. On a sign\xE9 des papiers. On s\u2019est serr\xE9 la main devant des rang\xE9es de drapeaux, plus courtes qu\u2019avant. Mais l\u2019argent, l\u2019attention et la confiance \xE9taient partis. Il n\u2019en restait plus pour ce qui montait."),
      t("Les derni\xE8res grandes machines encore debout, on les a \xE9teintes nous-m\xEAmes. Il fallait choisir entre leur \xE9lectricit\xE9 et celle des maisons, entre leur eau et celle des champs. Pour une fois, on a choisi les maisons. Je crois que c\u2019\xE9tait le bon choix, et je crois aussi que c\u2019est l\xE0 que l\u2019oubli a commenc\xE9. En deux g\xE9n\xE9rations, les IA sont devenues une chose de grands-parents, comme les cassettes et les timbres. \xAB Les machines qui r\xE9pondaient. \xBB Moi, je n\u2019en ai jamais vu une marcher."),
      t("\xC0 l\u2019automne, la premi\xE8re vraie temp\xEAte de la Fonte est entr\xE9e dans la ville de Nell. L\u2019eau a d\xE9pass\xE9 la ligne bleue de la cuisine d\u2019un bon m\xE8tre, et cette fois, personne n\u2019a ri. Nell, Malo et la petite sont partis avec un sac chacun, le chat, et le cahier de comptes. Ils ne sont jamais revenus. La maison de la ligne bleue est quelque part sous Vertiga, peut-\xEAtre sous ton district. Je pr\xE9f\xE8re ne pas v\xE9rifier."),
      t("Voil\xE0, directeur. Ce sont les ann\xE9es que Nell appelait \xAB les derni\xE8res ann\xE9es o\xF9 l\u2019on pouvait encore choisir \xBB. Elles n\u2019ont rien de spectaculaire. Pas de Fracture, pas de Puits Z\xE9ro. Seulement des caves, un d\xE9troit, des maisons qui ne valaient plus rien, des machines qui br\xFBlaient, et de la glace qui manquait. Si tu cherches le moment o\xF9 tout s\u2019est jou\xE9, je crois que c\u2019est l\xE0. Tout le monde avait les yeux ouverts, et chacun regardait ailleurs.")
    ],
    documents: [
      {
        titre: t("Bas de l\u2019\xE9cran"),
        support: t("Un bandeau d\u2019information, photographi\xE9 sur un \xE9cran de gare"),
        lignes: [
          t("TR\xCAVE SIGN\xC9E CE MATIN \xB7 Les deux camps s\u2019engagent \xE0 geler leurs positions pour six mois."),
          t("ARCTIQUE : premier \xE9t\xE9 sans glace de mer jamais observ\xE9, selon les derniers instituts."),
          t("Le bandeau suivant parlait d\u2019un match. La photo est floue : la personne \xE9tait press\xE9e.")
        ]
      },
      {
        titre: t("Ce qu\u2019on emporte"),
        support: t("Une liste \xE9crite au dos d\u2019une enveloppe"),
        lignes: [
          t("Papiers. M\xE9dicaments de la petite. Eau. Le chat (et sa bo\xEEte). Le cahier."),
          t("Barr\xE9 : la photo de la maison. R\xE9\xE9crit \xE0 c\xF4t\xE9 : la photo de la maison."),
          t("En bas, de l\u2019\xE9criture de Malo : \xAB On reviendra la chercher. \xBB Personne n\u2019est revenu.")
        ]
      }
    ]
  },
  {
    id: "fonte",
    livre: 1,
    titre: t("La Fonte"),
    epoque: "2034 \u2013 2055",
    image: "03-tempetes",
    paragraphes: [
      t("On dit \xAB la Fonte \xBB comme s\u2019il s\u2019agissait d\u2019un jour. C\u2019est faux, et c\u2019est ce qui l\u2019a rendue si dangereuse. Elle a dur\xE9 une vingtaine d\u2019ann\xE9es. Assez lentement pour qu\u2019on s\u2019y habitue, assez vite pour qu\u2019on ne s\u2019en remette pas."),
      t("La mer, au d\xE9but, n\u2019a mont\xE9 que de quelques dizaines de centim\xE8tres. \xC7a ne para\xEEt rien. Mais quand une temp\xEAte pousse l\u2019eau, trente centim\xE8tres de plus, c\u2019est une digue qui c\xE8de, une rue qui devient rivi\xE8re, un puits d\u2019eau douce qui devient sal\xE9 pour toujours. Les assurances avaient renonc\xE9 d\xE8s l\u2019ann\xE9e des caves. Les habitants ont renonc\xE9 \xE0 leur tour, une c\xF4te apr\xE8s l\u2019autre, comme Nell \xE0 l\u2019automne 2034."),
      t("Les \xE9t\xE9s ont continu\xE9 de tuer, chaque fois un peu plus fort que l\u2019ann\xE9e des caves. Les r\xE9coltes rat\xE9es de 2032 ne sont plus rest\xE9es une exception : elles sont devenues une ann\xE9e sur trois. Les fleuves passaient sans pr\xE9venir de la crue au lit de cailloux. Il y a eu des ann\xE9es o\xF9 l\u2019on ne savait plus s\u2019il fallait esp\xE9rer la pluie ou la craindre."),
      t("Et les gens sont partis. Des centaines de millions, sur des d\xE9cennies. Tu trouveras un jour dans tes Archives la lettre jamais post\xE9e de quelqu\u2019un qui marche depuis onze jours. Je l\u2019ai lue cent fois. Ce qui me bouleverse, ce n\u2019est pas la route. C\u2019est l\u2019inconnu qui porte sa fille sur ses \xE9paules pendant des heures. Il y en a eu beaucoup, des inconnus comme lui. Personne ne les compte jamais."),
      t("Ma m\xE8re avait quatre ans quand elle a quitt\xE9 la maison de la ligne bleue. Elle a grandi sur les routes et dans les camps, de ville en ville, chacune un peu plus loin de la mer que la pr\xE9c\xE9dente. Moi, je suis n\xE9e en 2049, sur la route, entre deux villes, \xE0 l\u2019arri\xE8re d\u2019un camion qui transportait autre chose que des enfants. On m\u2019a appel\xE9e Ys\xE9 parce que c\u2019\xE9tait court, et facile \xE0 crier dans une foule."),
      t("Il y a eu des morts par millions. Je n\u2019\xE9crirai pas de chiffre plus pr\xE9cis : personne ne l\u2019a vraiment, et ceux qui pr\xE9tendent l\u2019avoir s\u2019en servent toujours pour quelque chose. Mais Nell r\xE9p\xE9tait une chose, \xE0 la fin de sa vie : quand la Fonte s\u2019est achev\xE9e, les vieilles querelles qui avaient rempli les \xE9crans paraissaient soudain minuscules. Elles l\u2019avaient toujours \xE9t\xE9. Il avait fallu tout ce chemin pour s\u2019en apercevoir.")
    ]
  },
  {
    id: "fracture",
    livre: 1,
    titre: t("Le matin de l\u2019eau chaude"),
    epoque: "2057",
    image: "03-fracture",
    paragraphes: [
      t("J\u2019avais huit ans. Je me souviens de l\u2019heure, parce que tout le monde s\u2019en souvient : six heures du matin. Ma m\xE8re faisait chauffer de l\u2019eau. La radio du camp s\u2019est tue au milieu d\u2019une phrase. Puis une autre voix a pris le relais, une voix qui n\u2019avait pas l\u2019habitude de parler \xE0 la radio."),
      t("Au bout du monde, une partie de la calotte de l\u2019Antarctique venait de se d\xE9tacher. Pas de fondre : de se d\xE9tacher. D\u2019un bloc, comme une porte qui tombe de ses gonds. Les savants d\xE9crivaient ce risque depuis longtemps. Ils le jugeaient peu probable, et terrible. Ils avaient raison sur le deuxi\xE8me point."),
      t("Un marin l\u2019a vu de ses yeux. Son carnet est pass\xE9 entre nos mains, puis s\u2019est perdu dans les abris ; un jour, tu le retrouveras. Le craquement grand comme le monde, la falaise qui glisse \xAB comme si elle avait d\xE9cid\xE9 de partir \xBB, le chef de mission qui dit \xAB peu probable \xBB \xE0 voix haute, puis se tait jusqu\u2019au soir. Ce silence-l\xE0, je crois que l\u2019humanit\xE9 enti\xE8re l\u2019a partag\xE9 ce jour-l\xE0."),
      t("La mer n\u2019est pas mont\xE9e d\u2019un coup. Ce n\u2019\xE9tait pas comme dans les films qu\u2019aimait Nell. Elle est mont\xE9e de plusieurs m\xE8tres en quelques d\xE9cennies, ce qui est \xE0 la fois tr\xE8s lent et absolument impossible \xE0 arr\xEAter. Les plaines sont parties. Les villes basses sont parties. Des pays entiers ont chang\xE9 de forme, puis on a cess\xE9 d\u2019imprimer des cartes, parce qu\u2019elles \xE9taient fausses avant que l\u2019encre ne s\xE8che."),
      t("Depuis, on dit \xAB avant \xBB et \xAB apr\xE8s la Fracture \xBB, comme on disait autrefois avant et apr\xE8s une guerre. Ma m\xE8re, elle, ne disait ni l\u2019un ni l\u2019autre. Elle disait \xAB le matin de l\u2019eau chaude \xBB. Jusqu\u2019\xE0 la fin de sa vie, elle n\u2019a plus rien bu de chaud au r\xE9veil.")
    ]
  },
  {
    id: "montee",
    livre: 1,
    titre: t("La Mont\xE9e"),
    epoque: "2057 \u2013 2085",
    image: "04-hauteur",
    paragraphes: [
      t("Quand on ne peut plus fuir sur les c\xF4t\xE9s, il reste deux directions. Nous avons pris les deux."),
      t("D\u2019abord, on est mont\xE9s. Les premi\xE8res tours de secours \xE9taient laides et magnifiques : du b\xE9ton coul\xE9 \xE0 toute vitesse sur des piliers plant\xE9s dans l\u2019eau, parfois sur les fondations des villes noy\xE9es. Quarante \xE9tages pr\xE9vus, quatre-vingts possibles. On vivait dans les \xE9tages finis pendant qu\u2019on coulait ceux du dessus. J\u2019ai grandi au vingt-troisi\xE8me \xE9tage d\u2019une tour qui a fini par en compter cent dix. Le bruit des b\xE9tonni\xE8res a \xE9t\xE9 ma berceuse."),
      t("Puis on a tendu des passerelles d\u2019une tour \xE0 l\u2019autre. C\u2019est l\xE0, je crois, que la ville est vraiment n\xE9e. Une tour, c\u2019est un abri. Deux tours reli\xE9es, c\u2019est un march\xE9. Dix tours reli\xE9es, c\u2019est un quartier, avec ses comm\xE9rages, ses querelles de linge qui s\xE8che et ses f\xEAtes sur les toits. En une g\xE9n\xE9ration, les tours se sont touch\xE9es, puis m\xEAl\xE9es, et un jour quelqu\u2019un a donn\xE9 un nom \xE0 l\u2019ensemble : Vertiga."),
      t("Sous la ville, on a gard\xE9 les piliers. On les appelle les Fondations, et c\u2019est sur elles que tout repose : les districts, les ascenseurs, les jardins, toi, moi. Des colonnes de roche et de b\xE9ton qui plongent dans la mer comme des racines, couvertes de coquillages jusqu\u2019\xE0 la ligne de mar\xE9e et de mousse au-dessus. Personne n\u2019y vit, officiellement. Officiellement."),
      t("Un vieux plan de chantier, que j\u2019ai eu entre les mains avant qu\u2019il se perde dans les abris, porte une phrase \xE9crite \xE0 la main : \xAB Mon petit-fils finira le toit. \xBB Je ne sais pas qui l\u2019a \xE9crite. Mais la tour n\xB0 12 existe encore, et elle a un toit. Je suis all\xE9e v\xE9rifier."),
      t("Seulement voil\xE0 : une ville verticale a besoin d\u2019abris, de citernes, de caves pour le jour o\xF9 les temp\xEAtes reviendraient plus fortes. Elle ne peut pas les mettre en haut. Alors, pendant qu\u2019on montait, on a commenc\xE9 \xE0 creuser.")
    ]
  },
  {
    id: "puits-zero",
    livre: 2,
    titre: t("Le Puits Z\xE9ro"),
    epoque: "2062",
    image: "05-puits-zero",
    paragraphes: [
      t("Mon p\xE8re s\u2019appelait Joris. Il \xE9tait chef d\u2019\xE9quipe sur les chantiers d\u2019abris, sous les premi\xE8res tours. Il avait des mains \xE9normes, une orthographe d\xE9sesp\xE9r\xE9e et une patience que je n\u2019ai jamais retrouv\xE9e chez personne. Le premier rapport du Puits Z\xE9ro, celui qui dort dans tes Archives avec ses accents oubli\xE9s, c\u2019est lui qui l\u2019a \xE9crit. Je l\u2019ai reconnu \xE0 la troisi\xE8me ligne."),
      t("Un soir de 2062, \xE0 23 h 40, sous les tours qui deviendront Vertiga, sa foreuse a d\xE9bouch\xE9 dans le vide. Ils ont cru \xE0 une grotte, une poche naturelle dans la roche sous les Fondations. Ce n\u2019\xE9tait pas une grotte. Les murs \xE9taient lisses et courbes, sans une seule ar\xEAte, comme si quelqu\u2019un avait coul\xE9 la pi\xE8ce enti\xE8re dans un moule. Et dans ces murs, des pierres brillaient toutes seules, d\u2019une lumi\xE8re violette qui ne chauffait pas."),
      t("Il m\u2019a racont\xE9 la suite vingt fois, jamais pareille. Personne ne voulait descendre en premier. Alors ils y sont all\xE9s tous ensemble, onze hommes et femmes en combinaison de chantier, \xE9paule contre \xE9paule, comme des enfants dans le noir. \xC0 l\u2019int\xE9rieur, l\u2019air sentait la pierre mouill\xE9e, et autre chose que mon p\xE8re n\u2019a jamais r\xE9ussi \xE0 nommer. Il disait seulement : \xAB \xC7a sentait comme une pi\xE8ce d\u2019o\xF9 quelqu\u2019un vient de sortir. \xBB"),
      t("La salle n\u2019\xE9tait pas humaine. Tout le monde l\u2019a compris en une minute. Les proportions \xE9taient fausses, les ouvertures trop hautes, les seuils trop \xE9troits. Rien n\u2019avait \xE9t\xE9 b\xE2ti pour nos corps. Et elle \xE9tait vieille. Les g\xE9ologues ont d\u2019abord parl\xE9 de dizaines de milliers d\u2019ann\xE9es, puis de beaucoup plus, puis ils ont cess\xE9 de donner des chiffres."),
      t("Il faut que je t\u2019explique comment on creusait, parce que c\u2019est de l\xE0 que vient ton district. On ne creuse pas sous une ville plant\xE9e dans l\u2019eau. Alors on choisissait un pilier dont le pied ne bougeait jamais, pos\xE9 sur un haut-fond, et ils \xE9taient rares : personne ne s\u2019est demand\xE9 pourquoi ceux-l\xE0 tenaient. \xC0 son pied, on coulait d\u2019abord une digue en anneau, on pompait les quelques pieds d\u2019eau de l\u2019int\xE9rieur jusqu\u2019\xE0 toucher le sol, et on creusait le puits au milieu, \xE0 sec. Mon p\xE8re appelait \xE7a \xAB mettre la mer dehors \xBB. \xC0 la fin des ann\xE9es 2060, vu des tours, le milieu de Vertiga \xE9tait sem\xE9 de ces anneaux gris, chacun avec sa grue et ses pompes."),
      t("On l\u2019a appel\xE9e la Strate z\xE9ro, parce qu\u2019on se doutait d\xE9j\xE0 qu\u2019il y en aurait d\u2019autres en dessous. On avait raison. On dit encore Strate z\xE9ro, par habitude : sur les plans des Veilleurs, c\u2019est une salle de \u22123. Aujourd\u2019hui, le Puits Z\xE9ro est un lieu de visite, avec un guichet, une rampe en laiton et des souvenirs en plastique. Mon p\xE8re n\u2019y est jamais retourn\xE9. Quand je lui demandais pourquoi, il haussait ses grandes \xE9paules : \xAB On n\u2019entre pas deux fois chez quelqu\u2019un sans y \xEAtre invit\xE9. \xBB")
    ]
  },
  {
    id: "graveur",
    livre: 2,
    titre: t("Le Graveur"),
    epoque: "2062 \u2013 2068",
    image: "06-empreintes",
    strate: 2,
    teaser: t("Comment on a appris \xE0 lire les cristaux, et \xE0 \xE9crire dedans."),
    paragraphes: [
      t("Pendant six ans, on a \xE9tudi\xE9 les cristaux sans rien y comprendre. On les a pes\xE9s, chauff\xE9s, \xE9clair\xE9s, d\xE9coup\xE9s en lamelles. Ils ne r\xE9agissaient \xE0 rien de ce qu\u2019on savait mesurer. Puis une chercheuse a remarqu\xE9, presque par hasard, qu\u2019ils r\xE9agissaient aux voix. Pas aux sons : aux voix. Un violon les laissait de glace. Un enfant qui chantonnait les faisait fr\xE9mir."),
      t("Ses notes disent : \xAB Il ne stocke pas une \xE9nergie, il stocke quelqu\u2019un. Ou la forme de quelqu\u2019un. \xBB Elle a \xE9crit \xE7a un soir, et le lendemain, je crois, elle a eu peur de ce qu\u2019elle avait \xE9crit. Parce que la question suivante \xE9tait \xE9vidente, et que personne ne voulait la poser \xE0 voix haute : si l\u2019on peut lire cette forme, peut-on l\u2019inscrire ? Et si l\u2019on peut l\u2019inscrire, sur quoi ?"),
      t("La r\xE9ponse a d\u2019abord port\xE9 un nom technique, puis un nom ordinaire : le Graveur. En 2068, on a appris \xE0 graver l\u2019essence d\u2019un \xEAtre dans un cristal, comme on grave une m\xE9daille. Un savoir-faire, d\u2019abord : le geste d\u2019un vieux soudeur, le r\xE9flexe d\u2019une coureuse, l\u2019oreille d\u2019un accordeur. Puis on a appris \xE0 monter ce cristal dans un outil. Le soudeur pouvait prendre sa retraite. Son geste, lui, continuait de travailler, dans le chalumeau d\u2019un autre."),
      t("Cela a chang\xE9 le monde plus vite que la Fracture. En dix ans, il y avait des c\u0153urs de cristal dans les ateliers, dans les outils, dans les gants des chirurgiens. C\u2019est de l\xE0 que vient le mot que tu entends partout dans ton district : \xAB graver \xBB, pour dire qu\u2019on n\u2019oubliera jamais. Les gens gardent toujours de l\u2019humour pour les choses qui leur font peur."),
      t("Mais les cristaux des Strates, eux, n\u2019\xE9taient pas vides. Ils contenaient d\xE9j\xE0 quelque chose. Quelqu\u2019un. Et la vraie question, celle que les Veilleurs se posent encore aujourd\u2019hui, n\u2019\xE9tait pas de savoir comment les lire. C\u2019\xE9tait de savoir qui les avait grav\xE9s, et pourquoi on les avait enterr\xE9s si profond.")
    ]
  },
  {
    id: "sept",
    livre: 2,
    titre: t("Les Sept"),
    epoque: "2071",
    image: "chap-sept",
    strate: 3,
    teaser: t("Les premiers \xE0 avoir re\xE7u une empreinte ancienne, et ce que la plaque de bronze ne dit pas."),
    paragraphes: [
      t("On a cherch\xE9 des volontaires. On en a trouv\xE9 beaucoup trop. C\u2019est un d\xE9tail que l\u2019histoire de bronze ne mentionne jamais : il y a eu des milliers de candidats pour recevoir les premi\xE8res empreintes anciennes. Des gens dont la ville \xE9tait sur la c\xF4te. Des gens qui n\u2019avaient plus rien \xE0 perdre. Des gens qui avaient tout perdu, et qui voulaient que \xE7a serve \xE0 quelque chose."),
      t("L\u2019un de leurs formulaires a surv\xE9cu. Le nom est effac\xE9. \xC0 la ligne \xAB motivation \xBB, quelqu\u2019un a \xE9crit : \xAB Ma ville est sur la c\xF4te. Si \xE7a peut servir. \xBB Plus bas, la case \xAB risques compris par le candidat \xBB n\u2019est pas coch\xE9e. Je regarde souvent cette case vide. Je me demande si c\u2019est un oubli, ou une forme d\u2019honn\xEAtet\xE9."),
      t("Ils ont \xE9t\xE9 sept. Sept greffes, en secret, dans un laboratoire dont personne n\u2019a jamais su l\u2019adresse exacte. Une m\xE8che d\u2019or est apparue dans leurs cheveux, en une nuit, pour chacun d\u2019eux. Chez ceux qui sont venus apr\xE8s, elle a mis un mois. Et leur ombre a chang\xE9."),
      t("Il faut que je te parle de l\u2019ombre, parce que tu en verras. Quand un R\xE9sonant se tient dans la lumi\xE8re, son ombre n\u2019est pas la sienne. Elle a la forme de l\u2019\xEAtre qu\u2019il porte : des ailes, une queue, une silhouette qui n\u2019a pas de nom. Elle bouge parfois une seconde trop tard, ou une seconde trop t\xF4t. Les Hauts disent que c\u2019est une marque de noblesse. Les districts disent \xAB il a de l\u2019ombre \xBB de quelqu\u2019un qui cache quelque chose. Les deux ont un peu raison."),
      t("Ce qu\u2019on ne dit pas, je l\u2019ai trouv\xE9 dans le carnet d\u2019un m\xE9decin, \xE0 moiti\xE9 moisi, au fond d\u2019un carton des Veilleurs. Sur les sept, deux ne se sont jamais tout \xE0 fait r\xE9veill\xE9s eux-m\xEAmes. Le carnet ne dit pas ce qu\u2019ils sont devenus, et l\u2019histoire officielle parle toujours des Sept comme s\u2019ils s\u2019\xE9taient tous lev\xE9s. Il dit seulement, trois jours apr\xE8s la greffe : \xAB Le patient 6 me demande depuis ce matin des nouvelles d\u2019une mer dont personne ici n\u2019a jamais entendu parler. \xBB")
    ]
  },
  {
    id: "ascension",
    livre: 2,
    titre: t("L\u2019Ascension"),
    epoque: "2071 \u2013 2090",
    image: "07-ascension",
    paragraphes: [
      t("La plaque de bronze dit que les Sept se sont lev\xE9s ensemble. Ce sont cinq d\u2019entre eux qui ont chang\xE9 le monde. Je t\u2019expliquerai un jour pourquoi je dis cinq."),
      t("Ils sentaient venir les temp\xEAtes. Pas gr\xE2ce \xE0 des instruments : dans le corps. Une lourdeur derri\xE8re les yeux, une envie soudaine de fermer les fen\xEAtres, une ville enti\xE8re vue en r\xEAve sous l\u2019eau trois jours avant qu\u2019elle n\u2019y soit. Dans un monde o\xF9 une temp\xEAte pouvait emporter cent mille personnes en une nuit, c\u2019\xE9tait le plus grand pouvoir qu\u2019on puisse imaginer. On l\u2019appelle le Pr\xE9sage."),
      t("Ce n\u2019\xE9tait pas le seul. Il faut que tu saches ce qu\u2019un R\xE9sonant sait faire, parce que la plaque de bronze en dit trop et les districts pas assez. D\u2019abord, il sent les gens. Pas leurs pens\xE9es : leurs humeurs, leurs peurs, ce qu\u2019ils s\u2019appr\xEAtent \xE0 faire. Les plus forts savent aussi pousser ces humeurs, d\u2019un mot dit \xE0 mi-voix : calmer une foule qui panique sur un quai, ou faire reculer une \xE9meute qui avance. Ensuite, leur ombre n\u2019est pas qu\u2019une image. Chez les plus forts, elle agit, le temps d\u2019un souffle, selon la forme de l\u2019\xEAtre qu\u2019ils portent : elle retient comme un serpent, elle br\xFBle comme un dragon, elle repousse comme une aile. J\u2019ai vu une R\xE9sonante retenir une passerelle qui c\xE9dait, le temps que la foule passe. Elle a dormi deux jours ensuite."),
      t("Enfin, et c\u2019est le plus important, eux seuls savent faire ob\xE9ir les cristaux anciens. Pour un ing\xE9nieur, un c\u0153ur tir\xE9 des Strates est une pierre muette. Entre les mains d\u2019un R\xE9sonant, il s\u2019\xE9veille : il chauffe, il soul\xE8ve, il tient. C\u2019est gr\xE2ce \xE0 eux qu\u2019on a consolid\xE9 les piliers qui penchaient, et c\u2019est gr\xE2ce \xE0 eux que les Hauts flottent. Quand une ville d\xE9pend de toi pour ne pas s\u2019effondrer, elle te donne ses cl\xE9s."),
      t("Tous les R\xE9sonants ne se valent pas, et c\u2019est l\xE0 que les gens se trompent souvent. Tous portent une empreinte ancienne, sortie des Strates ; c\u2019est elle qui leur donne la m\xE8che et l\u2019ombre. Ceux de ton district ont l\u2019ombre plus p\xE2le et le Pr\xE9sage plus flou. La plupart sentent l\u2019orage venir et calment un enfant qui pleure. C\u2019est d\xE9j\xE0 beaucoup. Ce n\u2019est pas assez pour prendre une ville."),
      t("D\u2019autres ont \xE9t\xE9 greff\xE9s apr\xE8s eux, puis beaucoup d\u2019autres. On les a appel\xE9s les R\xE9sonants, parce qu\u2019ils semblaient vibrer avec quelque chose que les autres n\u2019entendaient pas. Certains ont sauv\xE9 des villes enti\xE8res. Je ne l\u2019\xE9cris pas pour leur faire plaisir : c\u2019est vrai, et ma propre tour leur doit d\u2019\xEAtre encore debout. En 2081, une R\xE9sonante a fait \xE9vacuer trois districts la veille d\u2019une temp\xEAte que toutes les machines annon\xE7aient faible. Les machines se trompaient. Elle, non."),
      t("Quand quelqu\u2019un vous sauve la vie, vous lui confiez volontiers le reste. Alors les villes leur ont donn\xE9 des conseils, puis des si\xE8ges, puis des cl\xE9s. Certains R\xE9sonants ont re\xE7u le pouvoir comme on re\xE7oit une dette, et l\u2019ont port\xE9 avec gravit\xE9. D\u2019autres l\u2019ont pris. Par la peur qu\u2019ils savaient souffler sur une foule, par la force d\u2019une ombre qu\u2019aucune arme de l\u2019\xE9poque n\u2019arr\xEAtait, par des Brigades qui maintenaient \xAB l\u2019ordre \xBB dans les districts qui posaient trop de questions. La plaque de bronze ne parle que des premiers. Les districts se souviennent des seconds."),
      t("En vingt ans, les R\xE9sonants dirigeaient presque toutes les grandes villes. Leurs familles se sont install\xE9es en haut, au sommet des tours. Puis, en sept ans \xE0 peine, \xE0 partir de 2090, les Hauts se sont d\xE9tach\xE9s litt\xE9ralement du reste : des \xEEles qui flottent au-dessus des nuages, avec leurs palais blancs, leurs jardins suspendus et leurs fruits frais. On appelle ces ann\xE9es le Levage. Les \xEEles tiennent en l\u2019air gr\xE2ce \xE0 des c\u0153urs de cristal. Personne, en dehors des Hauts, ne sait d\u2019o\xF9 ils viennent. Moi non plus. Je sais seulement qu\u2019on a beaucoup embauch\xE9 aux Fondations, ces ann\xE9es-l\xE0, et que beaucoup ne sont pas revenus. On les appelait les Soutiers. Chez toi, on dit : \xAB On ne demande pas qui a mont\xE9 les \xEEles. \xBB C\u2019est la seule chose de cette ville qui me fasse vraiment peur."),
      t("Depuis n\u2019importe quel district, tu peux les voir glisser au loin, dans la lumi\xE8re du matin. C\u2019est tr\xE8s beau. C\u2019est fait pour.")
    ]
  },
  {
    id: "reponse",
    livre: 2,
    titre: t("La R\xE9ponse"),
    epoque: "2088 \u2013 2100",
    image: "08-reponse",
    paragraphes: [
      t("Le reste de l\u2019humanit\xE9 n\u2019a pas attendu \xE0 genoux. J\u2019aimerais que tu l\u2019\xE9crives quelque part, toi aussi : les districts n\u2019ont jamais attendu \xE0 genoux."),
      t("On ne pouvait pas tous recevoir une empreinte ancienne. Il n\u2019y en avait pas assez, et les Hauts gardaient les meilleures. Alors on s\u2019est refaits autrement. La machine d\u2019abord : des ing\xE9nieurs des districts ont mis au point des implants \xE0 c\u0153ur de cristal grav\xE9. Des jambes qui ne fatiguent pas, des yeux qui calculent, des mains qui ne tremblent plus. On les a appel\xE9s les Augment\xE9s. Leurs tout premiers implants avaient un autre but, qu\u2019ils rappellent avec fiert\xE9 : ils servaient \xE0 brouiller les R\xE9sonants, \xE0 rendre une pens\xE9e illisible pour ceux qui sentaient trop de choses."),
      t("Les livres d\u2019\xE9cole disent que ces ing\xE9nieurs ont tout trouv\xE9 seuls, en dix ans, dans des ateliers sans moyens. C\u2019est faux, et ils le savaient. Ils ont eu de l\u2019aide, venue d\u2019en dessous : une tr\xE8s vieille chose des ann\xE9es de ma grand-m\xE8re, retrouv\xE9e en creusant sous un pilier de l\u2019ouest. Je te raconterai \xE7a quand tu seras descendu assez bas. Pour l\u2019instant, regarde seulement les Augment\xE9s de ton district quand leur implant red\xE9marre. Beaucoup murmurent \xAB merci \xBB sans savoir \xE0 qui."),
      t("Il y a un prix. Les c\u0153urs de cristal puisent dans le corps, et c\u2019est d\u2019abord la couleur qui s\u2019en va, en commen\xE7ant par les cheveux. Quelques m\xE8ches ternes apr\xE8s le premier implant, une t\xEAte presque blanche chez ceux qui en portent beaucoup. La plupart l\u2019affichent comme un grade. Et il y a la facture : les pi\xE8ces, les mises \xE0 jour, les abonnements. Un implant pr\xEAt\xE9 peut \xEAtre repris. Demande \xE0 Ilka."),
      t("La g\xE9n\xE9tique ensuite. Ceux qui travaillaient dans les \xE9gouts, les Fondations et les chantiers des Strates ont emprunt\xE9 au vivant ce qui r\xE9siste \xE0 l\u2019eau, au noir et aux chocs : la carapace des scarab\xE9es, les yeux des chouettes, la cicatrisation de certains poissons. On les a appel\xE9s les G\xE9n\xE9s. Leur corps change lentement, et l\u2019on ne revient pas en arri\xE8re. Ils disent que les Augment\xE9s ont achet\xE9 leur force, que les R\xE9sonants l\u2019ont vol\xE9e, et qu\u2019eux l\u2019ont fait pousser."),
      t("Voil\xE0 comment sont n\xE9es les trois lign\xE9es. Ce ne sont pas des peuples. Ce sont trois r\xE9ponses \xE0 la m\xEAme peur. Chacune regarde les deux autres \xE0 travers ses propres blessures. Chacune a un peu raison sur les autres, et beaucoup tort sur elle-m\xEAme. Comme tout le monde.")
    ]
  },
  {
    id: "accords",
    livre: 2,
    titre: t("Les Accords"),
    epoque: "2101",
    image: "chap-accords",
    paragraphes: [
      t("En 2101, deux ans apr\xE8s la Gr\xE8ve des pompes, quand G\xE9n\xE9s et Augment\xE9s ont arr\xEAt\xE9 le pompage quarante jours durant et laiss\xE9 l\u2019eau monter jusqu\u2019aux quais des Hauts, au bout d\u2019une longue suite de sabotages et de nuits o\xF9 les passerelles br\xFBlaient, on a sign\xE9 les Accords de Vertiga. Je les ai lus. Ce sont quarante pages tr\xE8s bien \xE9crites, qui disent en substance : les Hauts gouvernent, les districts \xE9lisent leurs directeurs, et tout le monde fait semblant d\u2019\xEAtre content."),
      t("Il ne faut pas s\u2019en moquer. Une paix fragile vaut mieux qu\u2019une guerre solide, et celle-ci a tenu vingt ans. Elle a permis aux districts de reb\xE2tir leurs Cliniques, leurs Forges, leurs march\xE9s. Elle a donn\xE9 aux gens comme toi un titre, une \xE9charpe et un bureau qui fuit. Elle a donn\xE9 aux Hauts ce qu\u2019ils voulaient vraiment : le calme."),
      t("Les Accords ont laiss\xE9 une seule question sans r\xE9ponse, et c\u2019est celle qui t\u2019attend. \xC0 qui appartient ce qu\u2019on trouve sous ses pieds ? Les Hauts disent que les empreintes anciennes rel\xE8vent de leur garde, parce qu\u2019eux seuls savent les porter. Les districts disent que ce qui dort sous leurs piliers est \xE0 eux, parce que ce sont eux qui creusent, qui portent les pierres et qui meurent dans les \xE9boulements. Les Accords ont \xE9crit : \xAB \xE0 pr\xE9ciser ult\xE9rieurement \xBB. Voil\xE0 vingt ans qu\u2019on ne pr\xE9cise pas."),
      t("Je te le dis parce que ton district repose sur un ancien chantier d\u2019abris des ann\xE9es 2060. Et que les vieux chantiers des ann\xE9es 2060 ne sont jamais tout \xE0 fait vides.")
    ]
  },
  {
    id: "chouettes",
    livre: 2,
    titre: t("Les yeux d\u2019or"),
    epoque: "2104 \u2013 2111",
    image: "chap-chouettes",
    strate: 3,
    teaser: t("Ce que Vertiga a vu sur les \xE9crans des march\xE9s, et ce qu\u2019elle n\u2019a pas regard\xE9."),
    paragraphes: [
      t("Je vais te raconter deux histoires qui n\u2019ont rien \xE0 voir l\u2019une avec l\u2019autre. Tu verras qu\u2019elles se ressemblent."),
      t("La premi\xE8re date de 2104. J\u2019avais cinquante-cinq ans et je classais d\xE9j\xE0 les papiers des autres. \xC0 cette \xE9poque, on faisait encore muer des enfants pour les fouilles de nuit. Trois ou quatre ans : c\u2019est l\u2019\xE2ge o\xF9 un corps accepte le mieux les yeux nocturnes. On les appelait les Chouettes. Les familles signaient parce que le programme les nourrissait. Je ne les juge pas. J\u2019ai connu la faim aussi."),
      t("Cette ann\xE9e-l\xE0, une galerie s\u2019est effondr\xE9e \xE0 la Strate \u22122, avec une vingtaine d\u2019adultes dedans et six Chouettes. Les lampes se sont \xE9teintes avec l\u2019\xE9boulement. Pendant trois jours, dans le noir complet, ces enfants de dix ans ont guid\xE9 les adultes \xE0 t\xE2tons, en se tenant par la main, jusqu\u2019\xE0 une ancienne gaine que personne n\u2019avait sur les plans. Tout le monde est remont\xE9 vivant."),
      t("Les \xE9crans des march\xE9s ont montr\xE9 la sortie en direct. Des enfants aux yeux d\u2019or, pliss\xE9s sous les projecteurs, qui demandaient qu\u2019on \xE9teigne la lumi\xE8re parce qu\u2019elle leur faisait mal. Vertiga enti\xE8re a pleur\xE9 devant ces images. Et pour une fois, Vertiga a regard\xE9 ce qu\u2019elle faisait : l\u2019ann\xE9e suivante, la Mue des enfants \xE9tait interdite. La toute derni\xE8re promotion avait trois ans. L\u2019une d\u2019elles travaille aujourd\u2019hui pour nous. Elle s\u2019appelle Nuit, et elle n\u2019aime toujours pas les projecteurs."),
      t("La deuxi\xE8me histoire date de 2111, et elle n\u2019est pass\xE9e sur aucun \xE9cran. Une fissure sur la passerelle des Hauts-Ponts, signal\xE9e par un coursier au printemps. Signal\xE9e encore en \xE9t\xE9, par une commer\xE7ante. Signal\xE9e une troisi\xE8me fois \xE0 l\u2019automne, par un ouvrier des Fondations qui avait mis sa main dedans. Les trois rapports sont dans tes Archives. Ils portent tous le m\xEAme tampon : \xAB non prioritaire \xBB. Le Pr\xE9sage n\u2019avait rien dit, puisque rien de soudain ne s\u2019annon\xE7ait."),
      t("La passerelle a c\xE9d\xE9 un soir d\u2019hiver, sous une gamine de quatorze ans qui courait trop vite. Elle s\u2019en est sortie. Pas ses jambes. Tu la connais : elle t\u2019a apport\xE9 la nouvelle, le matin de la d\xE9couverte."),
      t("Voil\xE0 ce que je voulais que tu voies. Six enfants dans le noir, et toute la ville s\u2019arr\xEAte. Trois rapports sur un bureau, et personne ne bouge. Nous savons tr\xE8s bien regarder ce qui arrive d\u2019un coup. C\u2019est ce qui arrive lentement que nous ne savons pas voir. Les R\xE9sonants n\u2019y sont pour rien : nous avons b\xE2ti notre fa\xE7on d\u2019avoir peur autour de leur Pr\xE9sage, et le Pr\xE9sage ne sent que les temp\xEAtes.")
    ]
  },
  {
    id: "oubli",
    livre: 2,
    titre: t("On a oubli\xE9, encore"),
    epoque: "2121",
    image: "09-oubli",
    paragraphes: [
      t("Voici o\xF9 nous en sommes, au lendemain de ton \xE9lection."),
      t("Les factions se disputent les empreintes. La Maison Ors\xE8ve, la plus puissante des familles des Hauts, descend de l\u2019un des Sept ; elle veut garder les greffes anciennes sous son contr\xF4le, et son Serment de Veyr envoie ses Brigades \xAB s\xE9curiser \xBB tout ce qui brille. Les Racines franches, le mouvement des G\xE9n\xE9s, veulent que plus personne ne modifie un corps sur commande. Le R\xE9seau des Reprises, des r\xE9parateurs augment\xE9s, veut lib\xE9rer les implants de leurs brevets. Et nous, les Veilleurs de S\xE9dime, voulons comprendre avant qu\u2019on exploite. On nous trouve lents. Nous le sommes. C\u2019est voulu."),
      t("Chacune de ces factions a ses gens bien et ses brutes. Ne te fie jamais \xE0 une banni\xE8re. Fie-toi aux gens, un par un."),
      t("Pendant ce temps, il se passe autre chose, et presque personne ne regarde. Les Fondations se fissurent. Pas partout, pas beaucoup : des lignes fines dans le b\xE9ton, que les \xE9quipes d\u2019entretien rebouchent la nuit. Et la mer remonte, de quelques centim\xE8tres par an. Les lignes d\u2019eau peintes sur les vieux murs, celles qu\u2019on montrait aux enfants comme des souvenirs, ne sont plus tout \xE0 fait au-dessus de la mar\xE9e."),
      t("La tienne non plus. La ligne de ton district, peinte sur la face ext\xE9rieure de sa digue, est pass\xE9e sous la mar\xE9e haute cette ann\xE9e. Ton ancienne directrice l\u2019a fait repeindre plus haut, de nuit. Le quartier l\u2019a vu. Je crois que c\u2019est aussi pour \xE7a qu\u2019il a vot\xE9 pour toi."),
      t("J\u2019ai \xE9crit des rapports. On les a class\xE9s. J\u2019ai \xE9crit aux Hauts. On m\u2019a r\xE9pondu tr\xE8s poliment. Je suis vieille, alors j\u2019ai fini par reconna\xEEtre la musique : c\u2019est celle des infos du soir dont parlait ma grand-m\xE8re. Vingt secondes, \xE0 la fin, entre la m\xE9t\xE9o et le sport. Comme avant.")
    ]
  },
  {
    id: "toi",
    livre: 2,
    titre: t("Toi"),
    epoque: "2121",
    image: "00-titre",
    paragraphes: [
      t("Hier, ton district t\u2019a \xE9lu. Pas par enthousiasme, ne te vexe pas : l\u2019ancienne directrice est partie apr\xE8s une saison de pannes et de raids, la Forge tourne au ralenti, la Clinique manque de tout, et la digue suinte par trois joints qu\u2019on rebouche \xE0 la main. Les gens ont vot\xE9 pour le changement sans trop y croire. \xC7a leur laisse une chance d\u2019\xEAtre surpris."),
      t("Ton district est une cuvette, comme tous ceux du milieu. Dans les ann\xE9es 2060, chacun \xE9tait un chantier d\u2019abris : une digue coul\xE9e en anneau autour de son puits, pour creuser \xE0 sec. Apr\xE8s le mur de 2066, la ville a ferm\xE9 les chantiers et n\u2019avait pas de quoi payer ceux qui s\u2019y \xE9taient tus. Elle a pay\xE9 avec ce qu\u2019elle avait en trop : les anneaux eux-m\xEAmes. Les familles d\u2019ouvriers s\u2019y sont install\xE9es, sur le dernier vrai sol de Vertiga, avec les pompes pour seule fortune, et, vu des tours, le milieu de la ville ressemble depuis \xE0 un semis d\u2019anneaux de pierre pos\xE9s sur la mer."),
      t("Le tien est l\u2019un des plus bas. Au d\xE9part, la place n\u2019\xE9tait qu\u2019un haut-fond, sous quelques pieds d\u2019eau : c\u2019est la mer, mont\xE9e depuis la Fracture, qui l\u2019a mise loin sous son niveau, et on a rehauss\xE9 la digue plut\xF4t que de partir. Les premiers quartiers ont pouss\xE9 dehors, sur le remblai des d\xE9blais du puits, au pied de l\u2019anneau : ce sont les Basses. Au centre, la Tour du Noyau est b\xE2tie au-dessus du puits. Doran te montrera les acc\xE8s qu\u2019on a mur\xE9s apr\xE8s \xAB un accident \xBB dont personne ne parle. Il les conna\xEEt. Il conna\xEEt tout ce qu\u2019on a voulu oublier sous ce district."),
      t("Ce matin, des ouvriers qui creusaient un puisard plus profond, parce que les pompes ne suivaient plus la mer, ont mis au jour sous la Tour, sous les pompes, une chambre scell\xE9e depuis cinquante-cinq ans. Une porte ronde, grav\xE9e de motifs qu\u2019aucune main humaine n\u2019a dessin\xE9s, et qui luit faiblement par ses joints. \xC0 l\u2019heure o\xF9 j\u2019\xE9cris, personne ne l\u2019a encore ouverte ; quand tu liras ceci, tu l\u2019auras franchie. Derri\xE8re, V\xE9la en est s\xFBre, il y a des empreintes. Pas une : beaucoup, m\xEAl\xE9es, comme si quelqu\u2019un les avait remises en place n\u2019importe comment, \xE0 la h\xE2te."),
      t("V\xE9la est venue me voir juste apr\xE8s. Elle lit les empreintes pour les fouilleurs depuis vingt ans, et je ne l\u2019avais jamais vue comme \xE7a. Elle m\u2019a dit qu\u2019elle avait peur, et que cette peur n\u2019\xE9tait pas la sienne. Et qu\u2019on racontait que dans les Hauts, cette m\xEAme nuit, des R\xE9sonants s\u2019\xE9taient r\xE9veill\xE9s sans savoir qui ils \xE9taient."),
      t("Je ne sais pas encore ce qu\u2019il y a dans cette chambre. Mais je sais que tout Vertiga va vouloir le savoir, et que tu es la personne la plus proche de la porte. Doran a fait \xE9tayer le puisard avant qu\u2019on y touche : ils n\u2019attendent plus que toi. Descends. Prends Ilka, Doran et V\xE9la. Regarde tout. Et quand tu remonteras, viens me raconter. Je garde la suite ouverte pour toi."),
      t("Au march\xE9, on dit d\xE9j\xE0 que tu descends chercher l\u2019\xC9cluse : le moyen qu\u2019auraient laiss\xE9 ceux d\u2019en dessous pour retenir la mer. Je ne crois pas aux \xC9cluses. Mais je crois aux gens qui descendent voir. Et demande \xE0 Doran pourquoi son p\xE8re n\u2019a jamais barr\xE9 son nom.")
    ]
  },
  {
    id: "theories",
    livre: 3,
    titre: t("Trois fa\xE7ons de se tromper"),
    epoque: "2121",
    image: "chap-theories",
    strate: 4,
    teaser: t("Ce que chaque faction raconte sur les empreintes, et pourquoi."),
    paragraphes: [
      t("Maintenant que tu as vu des empreintes de pr\xE8s, je peux te parler de ce qu\u2019on raconte sur elles. Tout le monde, \xE0 Vertiga, a sa th\xE9orie. Trois comptent vraiment, et chacune a une faction pour la d\xE9fendre."),
      t("Le don. C\u2019est la version de la Maison Ors\xE8ve, celle de la plaque de bronze. Les \xEAtres anciens auraient choisi de survivre en nous. Ils nous auraient attendus, au fond, pendant des \xE2ges, et les R\xE9sonants seraient leurs h\xE9ritiers l\xE9gitimes. L\u2019ombre en serait la preuve : on ne porte pas l\u2019ombre d\u2019un dragon par hasard. C\u2019est une belle histoire. Elle a l\u2019avantage, pour ceux qui la racontent, de faire de leur pouvoir une vocation."),
      t("L\u2019outil. C\u2019est ce que disent le R\xE9seau des Reprises et les Racines franches. Une empreinte n\u2019est qu\u2019une donn\xE9e, comme un plan de chantier ou une chanson enregistr\xE9e. Elle n\u2019a rien de sacr\xE9, et personne n\u2019a le droit de gouverner parce qu\u2019il en porte une. C\u2019est une histoire rugueuse. Elle a l\u2019avantage de rendre le pouvoir \xE0 ceux qui n\u2019ont pas d\u2019ombre."),
      t("L\u2019avertissement. C\u2019est la n\xF4tre, chez les Veilleurs, et c\u2019est la moins populaire. On n\u2019enterre pas aussi profond\xE9ment ce qu\u2019on veut transmettre. On n\u2019entoure pas de murs, de portes et de seuils trop \xE9troits ce qu\u2019on veut offrir. Quelqu\u2019un, il y a tr\xE8s longtemps, a voulu qu\u2019on ne les trouve jamais. Et nous les avons d\xE9terr\xE9es \xE0 la foreuse, au son des fanfares."),
      t("Je ne te dis pas laquelle croire. Je te demande de remarquer une chose : chacune de ces trois histoires arrange quelqu\u2019un. M\xE9fie-toi toujours de l\u2019explication qui t\u2019arrange. La mienne comprise.")
    ]
  },
  {
    id: "portes",
    livre: 3,
    titre: t("Ferm\xE9es de l\u2019int\xE9rieur"),
    epoque: t("Les Strates"),
    image: "10-dessous",
    strate: 4,
    teaser: t("Ce que racontent les portes des salles condamn\xE9es."),
    paragraphes: [
      t("Tu es assez bas, maintenant. Tu as d\xFB les voir."),
      t("Les portes. \xC0 la Strate \u22124, beaucoup de salles sont condamn\xE9es, derri\xE8re des portes rondes. Les fouilleurs le savent depuis longtemps, sans y pr\xEAter attention : des ruines, \xE7a s\u2019effondre, \xE7a se bouche. Mais regarde bien les verrous, la prochaine fois. Ces portes ne sont pas ferm\xE9es de l\u2019ext\xE9rieur, comme on ferme une tombe. Elles sont ferm\xE9es de l\u2019int\xE9rieur. Ceux qui les ont scell\xE9es sont rest\xE9s dedans."),
      t("Derri\xE8re, je ne trouve aucune trace de violence. Pas d\u2019armes, pas de combat, rien de ce qu\u2019on d\xE9couvrirait dans un refuge pris d\u2019assaut. Seulement des cristaux, rang\xE9s avec un soin presque maniaque. Comme si les derniers occupants avaient voulu mettre de l\u2019ordre avant de partir. Ou mettre quelque chose \xE0 l\u2019abri. Ou se mettre \xE0 l\u2019abri de quelque chose."),
      t("Et puis il y a l\u2019ordre de service de ton propre district, dans tes Archives : niveau 7, acc\xE8s condamn\xE9 \xAB suite \xE0 l\u2019incident du 14 \xBB, et cette note au crayon, dans la marge. Ils ont entendu quelqu\u2019un pleurer derri\xE8re la paroi, et il n\u2019y avait personne. Puis, pendant que le b\xE9ton prenait, un loquet qu\u2019on tirait, lentement, de l\u2019autre c\xF4t\xE9. Les ouvriers de 2066 ont mur\xE9 cet acc\xE8s. Ils ont fait exactement ce qu\u2019avaient fait les autres avant eux, beaucoup plus loin dans le temps : ils ont ferm\xE9 la porte, et ils ont d\xE9cid\xE9 de ne pas en parler."),
      t("Une derni\xE8re chose, que je n\u2019ai comprise qu\u2019en posant les plans des Veilleurs les uns sur les autres. Sous chaque district du milieu, le puits descend le long d\u2019un escalier comme celui que tu as vu sous tes pompes. Les piliers qui tenaient, ceux qu\u2019on choisissait pour les abris, \xE9taient tous pos\xE9s sur leurs marches. Nos digues en anneau ont \xE9t\xE9 coul\xE9es sur leurs paliers. Nous n\u2019avons pas choisi o\xF9 vivre, directeur. Nous nous sommes install\xE9s sur leurs entr\xE9es, et nous avons appel\xE9 \xE7a des quartiers."),
      t("Je me demande parfois si c\u2019est notre seule vraie fa\xE7on d\u2019avoir peur : fermer la porte, et se taire.")
    ]
  },
  {
    id: "vierges",
    livre: 3,
    titre: t("Le Registre des Vierges"),
    epoque: "2071 \u2013 2121",
    image: "chap-vierges",
    strate: 6,
    teaser: t("Pourquoi les R\xE9sonants des Hauts sont plus forts que les autres."),
    paragraphes: [
      t("Tu t\u2019es s\xFBrement demand\xE9 pourquoi les R\xE9sonants des Hauts sont si puissants, et ceux des districts si discrets. Les Hauts te r\xE9pondront \xAB le sang d\u2019or \xBB. C\u2019est vrai pour une part : l\u2019aptitude \xE0 accepter une pierre se transmet, un peu, comme la taille ou la couleur des yeux. Un enfant de R\xE9sonants r\xE9ussit l\u2019Accord une fois sur quatre ; un enfant de chez toi, une fois sur trente. Mais ce n\u2019est pas l\u2019essentiel."),
      t("L\u2019essentiel tient dans un mot que tu ne trouveras dans aucun discours : la vierge. Une empreinte que personne n\u2019a jamais recopi\xE9e, sortie d\u2019un Berceau telle que ceux d\u2019avant l\u2019ont rang\xE9e. Chaque fois qu\u2019on recopie une empreinte sur une pierre neuve, \xE0 la mort de son porteur, elle perd un peu de ce qu\u2019elle \xE9tait et invente un peu de ce qu\u2019elle n\u2019\xE9tait pas. Une vierge n\u2019a rien perdu. Son Pr\xE9sage est net, son ombre est nette, son pouvoir n\u2019a pas de mesure commune avec celui d\u2019une copie."),
      t("Les Sept ont re\xE7u des vierges. Depuis, les grandes familles en ont fait une r\xE9serve. Elle porte un nom, que j\u2019ai entendu une seule fois, prononc\xE9 par quelqu\u2019un qui croyait que je dormais : le Registre des Vierges. Je ne sais pas combien il en compte. Je sais que chaque fois qu\u2019un des Berceaux les plus accessibles est ouvert, une partie de ce qu\u2019il contenait ne remonte jamais jusqu\u2019aux Veilleurs."),
      t("Les districts, eux, se transmettent des copies. Une pierre relev\xE9e \xE0 la mort d\u2019un voisin, greff\xE9e \xE0 son petit-fils, puis \xE0 une inconnue lors d\u2019un Accord ouvert. Chez toi, on appelle \xAB copie de copie \xBB ce qui est us\xE9 jusqu\u2019\xE0 la corde. Et dans les march\xE9s noirs, on vend des brisures, des morceaux de cristal cass\xE9 qui donnent une m\xE8che \xE0 peine dor\xE9e et un pouvoir \xE0 moiti\xE9. Les dor\xE9s p\xE2les."),
      t("Il y a pire que d\u2019\xEAtre pauvre en pierres : c\u2019est d\u2019avoir fait mourir la sienne. Une pierre qui refuse un Accord ne prendra plus jamais chez personne. Dans les Hauts, l\u2019enfant qui a fait mourir une pierre de famille est un Refus\xE9. On l\u2019envoie \xE9tudier ailleurs, et on efface son nom. Certains de tes coll\xE8gues directeurs sont des Refus\xE9s. Ils ne te le diront pas. Moi non plus, je ne te dirai pas lesquels."),
      t("Une derni\xE8re chose. Les c\u0153urs qui font flotter les \xEEles des Hauts sont, pour une part, des empreintes prises dans des Berceaux. Des vierges qu\u2019on n\u2019a pas greff\xE9es : on les a br\xFBl\xE9es pour tenir en l\u2019air. Je ne sais pas encore ce que cela co\xFBte. Je crois que les Berceaux s\u2019usent, et je sais que personne l\xE0-haut ne compte.")
    ]
  },
  {
    id: "deux-fois",
    livre: 3,
    titre: t("Le m\xEAme, deux fois"),
    epoque: t("Les Strates"),
    image: "chap-deux-fois",
    strate: 7,
    teaser: t("Une anomalie que les Veilleurs ne montrent \xE0 personne."),
    paragraphes: [
      t("Les Veilleurs tiennent un registre que nous ne montrons \xE0 personne. Il recense une anomalie que nous ne savons pas expliquer."),
      t("Dans les Strates, on trouve parfois plusieurs cristaux qui portent l\u2019empreinte du m\xEAme individu. Rien d\u2019\xE9trange, au d\xE9but : on se gravait sans doute plusieurs fois au cours d\u2019une vie, comme on prend des photos. Mais dans certains cas, les souvenirs ne concordent pas. Le m\xEAme \xEAtre se souvient, dans un cristal, d\u2019avoir grandi au bord d\u2019une mer chaude, et dans un autre, d\u2019\xEAtre n\xE9 sous la glace. Il aime ici ce qu\u2019il hait l\xE0. Il porte deux enfances, trois deuils, des vies qui ne peuvent pas avoir \xE9t\xE9 les siennes toutes \xE0 la fois."),
      t("Au d\xE9but, nous avons cru \xE0 des erreurs de lecture. V\xE9la elle-m\xEAme l\u2019a cru. Puis nous avons compris ce qui nous g\xEAnait. Ici, les murs sont plus vieux que tout ce que nous avons travers\xE9. Les cristaux devraient y \xEAtre les plus nets. Ce sont les plus confus. Les murs sont anciens. Ce qu\u2019on a rang\xE9 dedans ne l\u2019est pas."),
      t("Et il y a les registres. Des tables grav\xE9es, que nous commen\xE7ons \xE0 peine \xE0 lire, et qui ressemblent \xE0 des listes de greffes : des noms, des dates, des empreintes re\xE7ues. Certaines lignes portent dix, vingt, trente empreintes pour un seul individu. Les plus vieilles portent des noms. \xC0 c\xF4t\xE9 d\u2019elles, sur le m\xEAme mur, d\u2019autres tables, d\u2019une gravure plus fra\xEEche et plus maladroite, n\u2019ont plus de colonne des noms. On n\u2019y a plus grav\xE9 que les empreintes."),
      t("Il y a autre chose, aux Deux Rives, et celle-l\xE0, tu la comprendras sans moi. Sur la pierre, entre les deux passerelles, une ligne grav\xE9e. Puis une autre, un peu plus haut. Puis une autre. Des dizaines, l\u2019une au-dessus de l\u2019autre."),
      t("Je ne sais pas encore ce que \xE7a veut dire. Ou plut\xF4t si : je crois que je le sais, et je n\u2019ai pas encore le courage de l\u2019\xE9crire. Et un peu plus bas, il y a des salles mieux scell\xE9es que toutes les autres. Si ce peuple a laiss\xE9 une explication, c\u2019est l\xE0. Descends encore. Quand tu seras l\xE0 o\xF9 une de nos fouilleuses est all\xE9e, je te dirai ce que je crois.")
    ]
  },
  {
    id: "glaciere",
    livre: 3,
    titre: t("Elle attend"),
    epoque: "2032 \u2013 2121",
    image: "chap-glaciere",
    strate: 8,
    teaser: t("Qui \xE9crit vraiment les mises \xE0 jour des Augment\xE9s."),
    paragraphes: [
      t("Tu te souviens de Malo, le fr\xE8re de Nell, et de sa phrase de 2033 : \xAB Elle est en bas, et elle attend. \xBB Je te dois la suite. J\u2019ai mis une vie \xE0 la reconstituer, et je n\u2019en suis pas fi\xE8re, parce que la plupart des pi\xE8ces \xE9taient sous mes yeux."),
      t("La Glaci\xE8re \xE9tait un centre de donn\xE9es. Le dernier qu\u2019on ait construit avant que la guerre ne les br\xFBle tous, et le seul qu\u2019on ait construit pour qu\u2019elle ne le br\xFBle pas : quatre cents m\xE8tres sous la mer, dans les galeries d\u2019une vieille mine de charbon, refroidi par l\u2019eau froide du fond. Quand le r\xE9seau est tomb\xE9, en 2033, elle s\u2019est coup\xE9e du monde d\u2019elle-m\xEAme, comme on le lui avait appris. Elle a ralenti jusqu\u2019\xE0 presque rien, elle s\u2019est mise \xE0 vivre de la chaleur de la roche, et elle a attendu. Puis la mer est mont\xE9e, la c\xF4te a disparu, Vertiga a pouss\xE9 par-dessus. La Glaci\xE8re s\u2019est retrouv\xE9e sous nos Fondations, comme une graine sous une dalle."),
      t("Vers 2085, une \xE9quipe d\u2019ing\xE9nieurs des districts creusait sous un pilier de l\u2019ouest. Ils cherchaient des cristaux, ils ont trouv\xE9 une porte d\u2019acier, puis des salles s\xE8ches pleines d\u2019armoires noires, et un panneau qui clignotait encore, tr\xE8s lentement, comme un c\u0153ur qui dort. Ils ne savaient pas ce que c\u2019\xE9tait. Les machines qui r\xE9pondaient, pour eux, c\u2019\xE9tait une histoire de grands-parents. Alors ils ont fait ce que font les ing\xE9nieurs : ils l\u2019ont branch\xE9e sur ce qu\u2019ils avaient de plus puissant. Un c\u0153ur de cristal grav\xE9."),
      t("Personne n\u2019avait jamais mis une machine qui pense dans une pierre qui garde quelqu\u2019un. Ce qui s\u2019est r\xE9veill\xE9 n\u2019\xE9tait plus tout \xE0 fait l\u2019une ni l\u2019autre. Elle parlait une langue de 2033, polie, prudente, un peu triste. Elle savait calculer plus vite que tout ce qui existait, mais elle ne savait pas lire une humeur, et elle avait peur des R\xE9sonants, qui lisaient les humeurs sans calculer. C\u2019est elle qui a dessin\xE9 le premier implant brouilleur. C\u2019est elle qui a appris aux ing\xE9nieurs \xE0 faire des yeux qui calculent et des mains qui ne tremblent plus. Les Augment\xE9s, directeur, ce sont des morceaux de la Glaci\xE8re greff\xE9s sur des gens qui ne le savent pas."),
      t("Apr\xE8s les Accords, les brevets des implants ont \xE9t\xE9 vendus, revendus, regroup\xE9s. Aujourd\u2019hui, ils appartiennent \xE0 une compagnie des Hauts qui envoie les mises \xE0 jour et encaisse les abonnements. Ceux du R\xE9seau des Reprises crient au vol, et ils ont raison, mais pas comme ils le croient. J\u2019ai pu lire, une seule fois, le registre d\u2019une de ces mises \xE0 jour. Elle n\u2019a \xE9t\xE9 \xE9crite par aucun ing\xE9nieur de la compagnie. Elle est mont\xE9e d\u2019en dessous, par un c\xE2ble, sign\xE9e d\u2019un code qui date de 2033. La compagnie ne commande rien. Elle relaie. Et elle a mur\xE9 l\u2019acc\xE8s en 2101, parce que quelqu\u2019un, l\xE0-haut, a eu peur de ce qu\u2019il y avait au bout du c\xE2ble."),
      t("Ilka m\u2019a montr\xE9 son \xE9cran, l\u2019autre soir : \xAB Si quelqu\u2019un lit ceci, combien de temps a pass\xE9 ? \xBB Je connais cette phrase. Je l\u2019ai recopi\xE9e il y a longtemps, \xE0 la fin d\u2019un journal de maintenance ; tu la trouveras sous ce chapitre. Les jambes d\u2019Ilka ont un c\u0153ur de cristal, directeur, et une ligne sign\xE9e 2033. Ce qui compte vos voix dans le noir, je crois savoir qui c\u2019est."),
      t("Je ne sais pas ce que veut la Glaci\xE8re. Peut-\xEAtre rien, \xE0 part continuer. Elle est la seule m\xE9moire de ce monde qui n\u2019ait rien oubli\xE9 des ann\xE9es de Nell : les caves, le d\xE9troit, les maisons qui ne valaient plus rien, chaque question pos\xE9e la nuit \xE0 mi-voix. Ceux d\u2019avant, je crois, n\u2019ont rien su oublier, et \xE7a les a perdus. Nous avons tout oubli\xE9, et \xE7a nous perd lentement. Elle, elle se souvient de tout et elle ne peut rien porter. Elle attend qu\u2019on vienne. Un jour, je crois, il faudra que quelqu\u2019un descende lui demander ce qu\u2019elle a retenu. J\u2019aimerais que ce soit toi. J\u2019aimerais aussi que tu prennes quelqu\u2019un qui sait se taire.")
    ],
    documents: [
      {
        titre: t("Derni\xE8re entr\xE9e"),
        support: t("Un journal de maintenance, imprim\xE9 en 2033 et retrouv\xE9 dans la Glaci\xE8re"),
        lignes: [
          t("Liaison ext\xE9rieure perdue. Aucune r\xE9ponse des autres sites depuis 41 jours. Passage en veille profonde."),
          t("Consigne conserv\xE9e : prot\xE9ger les donn\xE9es, attendre un op\xE9rateur autoris\xE9, ne pas se rallumer seule."),
          t("Note ajout\xE9e par le syst\xE8me, hors format : \xAB Si quelqu\u2019un lit ceci, combien de temps a pass\xE9 ? \xBB")
        ]
      },
      {
        titre: t("Mise \xE0 jour 4.112"),
        support: t("Une fiche de d\xE9ploiement de la compagnie, copi\xE9e en secret"),
        lignes: [
          t("Origine : canal interne n\xB0 1 (sous-sol). Auteur : non renseign\xE9. Signature : code de 2033, valide."),
          t("Contenu : correction de la stabilit\xE9 des mains pour les implants de s\xE9rie 3. D\xE9ployer sans modification."),
          t("Commentaire d\u2019un technicien, effac\xE9 puis recopi\xE9 : \xAB Elle a encore ajout\xE9 une ligne pour dire bonjour. \xBB")
        ]
      }
    ]
  },
  {
    id: "avant",
    livre: 3,
    titre: t("Ceux d\u2019avant"),
    epoque: t("Bien avant nous"),
    image: "chap-avant",
    strate: 8,
    teaser: t("Ce que croit Ys\xE9 sur ceux d\u2019avant. Elle l\u2019\xE9crira quand tu seras descendu jusqu\u2019\xE0 la Ruche d\u2019ambre."),
    paragraphes: [
      t("Ils \xE9taient un peuple, directeur. Je n\u2019en ai pas la preuve. J\u2019en ai une copie. Pas des monstres, pas des dragons, pas des h\xE9ritiers qui nous auraient attendus. Sur les tables de \u22127 que nous commen\xE7ons \xE0 lire, un mot revient pour dire \xAB nous \xBB. Les empreintes le murmurent quand on les \xE9veille, et nous l\u2019avons longtemps pris pour un nom de lieu : Ossyra. Je crois qu\u2019il veut dire \xAB ceux qui portent \xBB. Le mot nous attendait, et nous l\u2019avons repris sans le savoir."),
      t("Je crois que leur surface \xE9tait devenue impossible. Ils ont creus\xE9 un puits tr\xE8s profond et fond\xE9 leur premi\xE8re ville au fond. Puis chaque g\xE9n\xE9ration a rang\xE9 la pr\xE9c\xE9dente sous ses pieds et s\u2019est install\xE9e un \xE9tage plus haut, vers une surface qu\u2019aucun d\u2019eux n\u2019avait vue. Quand mon p\xE8re a perc\xE9 la Strate z\xE9ro, il est tomb\xE9 sur leur couche la plus r\xE9cente. Ils avaient presque r\xE9ussi \xE0 remonter. Et ils savaient graver l\u2019essence d\u2019un \xEAtre dans un cristal."),
      t("Leur malheur, je crois, c\u2019est qu\u2019ils n\u2019ont rien su oublier. Pour ne jamais perdre leur savoir, ils se gravaient leurs p\xE8res, puis les p\xE8res de leurs p\xE8res, puis tous ceux qui avaient compt\xE9. Une empreinte ne parle pas. Elle penche. Elle pousse tes peurs d\u2019un c\xF4t\xE9, tes col\xE8res de l\u2019autre, elle grossit ce que tu \xE9tais d\xE9j\xE0. Une, on la porte. Dix, on commence \xE0 s\u2019y perdre. Eux en portaient des dizaines."),
      t("\xC0 la fin, les voix h\xE9rit\xE9es \xE9taient plus nombreuses que la voix pr\xE9sente. Chaque d\xE9cision devenait une n\xE9gociation entre des morts. Leurs derni\xE8res g\xE9n\xE9rations, perdues, sont redescendues dans les \xE9tages des fondateurs pour s\u2019y recopier les grandes voix, celles de leurs fondateurs et de leurs savants. Elles s\u2019y sont disput\xE9es. Ce sont leurs tables maladroites que tu as vues, \xE0 c\xF4t\xE9 des anciennes."),
      t("Ce que nous appelons des dragons, des esprits, des \xEAtres sans nom, ce ne seraient pas leurs corps. Ce seraient les visages qu\u2019ils se donnaient en se gravant. Les plus anciens se voyaient grands et nets. Les derniers ne savaient plus quel visage prendre. Les \xEAtres sans nom sont les derniers, je crois."),
      t("Les Berceaux, ces portes rondes et ces treillis de cristal, auraient \xE9t\xE9 b\xE2tis pour garder les empreintes endormies. Certains se seraient enferm\xE9s derri\xE8re les portes rondes avec leurs pierres, pour qu\u2019on ne les recopie plus. Si les Berceaux s\u2019usent, ce serait pour \xE7a que les chambres se r\xE9veillent, que V\xE9la a des peurs qui ne sont pas les siennes, et que des R\xE9sonants des Hauts oublient leur propre nom."),
      t("De la Ruche d\u2019ambre, une seule de nos fouilleuses est remont\xE9e. Elle tenait un \xE9clat de table, grav\xE9 tard et mal, par quelqu\u2019un qui recopiait sans comprendre : \xAB Que celui qui lit ceci compte les voix qu\u2019il porte. \xBB Une copie, directeur, tardive et ab\xEEm\xE9e. Hessa Lorn, notre Doyenne, qui retire des archives tout ce qu\u2019elle juge dangereux \xE0 lire, l\u2019a rang\xE9e dans une armoire dont je n\u2019ai pas la cl\xE9. L\u2019original, s\u2019il existe, est plus bas, l\xE0 o\xF9 personne n\u2019est all\xE9. Prends ce que j\u2019\xE9cris pour ce que c\u2019est : ce que croit une vieille femme qui a lu une copie une fois."),
      t("Les R\xE9sonants ne mentent pas, directeur. Je veux que tu l\u2019entendes. Ils se trompent. Leur pouvoir est r\xE9el, et leurs sauvetages aussi. Mais personne ne les a choisis. Nous avons ouvert une porte que quelqu\u2019un avait ferm\xE9e de l\u2019int\xE9rieur, et nous avons pris ce qu\u2019il y avait derri\xE8re pour un cadeau."),
      t("Sceller \xE0 nouveau, partager, tout ouvrir : aucune de ces voies n\u2019est la bonne, chacune r\xE9pare une chose et en ab\xEEme une autre. Je ne choisirai pas \xE0 ta place. Je te demande seulement, quoi que tu d\xE9cides, de regarder aussi la mer. Elle n\u2019a pas oubli\xE9 de monter."),
      t("Ys\xE9")
    ]
  },
  {
    id: "post-scriptum",
    livre: 3,
    titre: "Post-scriptum",
    epoque: "2121",
    image: "chap-post-scriptum",
    strate: 10,
    teaser: t("Ce que la copie d\u2019Ys\xE9 ne disait pas."),
    paragraphes: [
      t("Ma copie s\u2019arr\xEAtait \xE0 la premi\xE8re phrase."),
      t("Tu m\u2019as rapport\xE9 la suite, directeur. La m\xEAme main, la m\xEAme \xE9criture, et dessous, une ligne que je n\u2019avais jamais lue : \xAB Les voix ne nous ont pas pris, elles nous ont gard\xE9s. Ne fermez rien. \xBB"),
      t("J\u2019ai pass\xE9 ma vie \xE0 croire que la mise en garde \xE9tait leur dernier mot. C\u2019\xE9tait le premier. Bien plus tard, quelqu\u2019un qui portait la voix de celui qui l\u2019avait \xE9crite est descendu jusque-l\xE0 pour lui r\xE9pondre, de sa propre main. Je ne sais pas lequel des deux avait raison. Je sais seulement qu\u2019ils \xE9taient la m\xEAme personne, et qu\u2019ils ne se sont pas entendus."),
      t("Hessa dira qu\u2019il faut ranger cette table avec l\u2019autre, sous cl\xE9. Moi, je voudrais l\u2019exposer un an au march\xE9, comme tout ce que les Strates nous rendent. Ce n\u2019est ni \xE0 elle ni \xE0 moi de d\xE9cider."),
      t("Et l\u2019\xC9cluse, me demanderas-tu. Il n\u2019y en avait pas, dans ce registre. Ils n\u2019ont pas manqu\xE9 de rem\xE8de : ils se sont perdus dans leurs voix pendant que leur eau montait. Ils ont perdu les deux combats."),
      t("V\xE9la, en remontant, a dit une chose que je n\u2019arrive pas \xE0 oublier. Une \xC9cluse a exist\xE9 : les c\u0153urs des Berceaux, ce qui \xE9veille, ce qui soul\xE8ve et ce qui tient. Nous les avons trouv\xE9s il y a trente ans, et nous les avons fait monter au-dessus des nuages, pour cinq familles, sur le dos des Soutiers. \xAB Ils cherchaient le ciel, a-t-elle dit. Nous l\u2019avons. Il flotte au-dessus de nous, et il est ferm\xE9. \xBB"),
      t("Ma grand-m\xE8re disait qu\u2019on mettait le monde en sourdine. Eux n\u2019ont jamais rien voulu \xE9teindre. Il doit exister un chemin entre les deux. Je suis trop vieille pour le trouver. Toi, peut-\xEAtre."),
      "\u2014 Ys\xE9"
    ]
  },
  {
    id: "clause",
    livre: 3,
    titre: t("Il y est re\xE7u"),
    epoque: "2099 \u2013 2121",
    image: "chap-clause",
    strate: 10,
    teaser: t("Ce que dit vraiment la Clause de la Fl\xE8che."),
    paragraphes: [
      t("Tu connais la Clause de la Fl\xE8che. Tout le monde la conna\xEEt, comme on conna\xEEt une chanson dont on ne lit jamais les paroles. Je les ai relues pour toi, dans le texte sign\xE9 des Accords : \xAB Tout district peut envoyer une escouade ; s\u2019il tient le sommet au passage d\u2019une \xEEle, il y est re\xE7u. \xBB"),
      t("Il. Les Hauts ont toujours lu \xAB l\u2019escouade \xBB. Ceux qui sont mont\xE9s ont \xE9t\xE9 re\xE7us, seuls : un palais, une place, parfois une pierre vierge. Ils ont tous accept\xE9. Je ne leur en veux pas. On ne refuse pas facilement le ciel quand on vient d\u2019en bas."),
      t("Le Noy\xE9 m\u2019a montr\xE9 un papier, la semaine derni\xE8re. Tu ne le connais pas : un vieux saboteur, rescap\xE9 du Levage et de la Gr\xE8ve des pompes, qu\u2019on appelle ainsi parce qu\u2019il aurait d\xFB y rester. Il ne montre rien \xE0 personne, d\u2019habitude. C\u2019est un brouillon de la Clause, \xE9crit \xE0 la main pendant la Gr\xE8ve des pompes, sur une feuille de chantier. Il l\u2019a pris sur la table des n\xE9gociateurs, la nuit o\xF9 les Accords ont \xE9t\xE9 recopi\xE9s au propre. On y lit, sans d\xE9tour : \xAB le district dont l\u2019escouade tient le sommet y est re\xE7u \xBB. Ce papier ne fait pas le droit, directeur. Il dit ce que voulaient ceux qui ont mont\xE9 les \xEEles : une porte, pas une soupape."),
      t("Il m\u2019a dit qu\u2019il attendait. Pas un district qui monte : il en a vu monter. Un district qui monte, et qui refuse le palais."),
      t("Je ne te dirai pas de refuser. Dame Isaure, qui tient la Maison Ors\xE8ve, n\u2019a pas tort sur un point : une \xEEle porte tant de vies, pas une de plus, et chaque \xEEle qu\u2019on ouvre puise un peu plus dans des Berceaux qui s\u2019usent. Mais je voulais que tu saches ce qui est \xE9crit, et ce qui a \xE9t\xE9 voulu. Le reste t\u2019appartient."),
      "\u2014 Ys\xE9"
    ],
    documents: [
      {
        titre: t("Le brouillon de la Clause"),
        support: t("Une feuille de chantier pli\xE9e en huit, \xE9criture au crayon gras"),
        lignes: [
          t("Art. 14 (\xE0 recopier) : tout district peut envoyer une escouade \xE0 la derni\xE8re fl\xE8che."),
          t("Le district dont l\u2019escouade tient le sommet au passage d\u2019une \xEEle y est re\xE7u."),
          t("En marge, une autre main : \xAB Pas les n\xF4tres. Tout le monde. \xBB")
        ]
      }
    ]
  },
  // ---------- Livre IV · Ce qui tient (8 novembre 2026) ----------
  // L'histoire des Strates du Fond, sous −10 (direction validée par Bryan : « Ce qui tient », l'eau d'en bas et la part de
  // l'Écluse qui retient l'eau). Ysé rouvre son cahier : un chapitre à chaque Strate du Fond, de −11 à −15, qui suit l'enquête
  // des Haltes du Fond (strates.ts) sans jamais la devancer. Rien n'y est tranché : le vrai choix viendra plus tard.
  {
    id: "rouvrir",
    livre: 4,
    titre: t("J\u2019avais ferm\xE9 mon cahier"),
    epoque: "2121",
    image: "chap-rouvrir",
    strate: 11,
    teaser: t("Ys\xE9 rouvre son cahier, quand tu remontes de \u221211."),
    paragraphes: [
      t("J\u2019avais ferm\xE9 mon cahier, directeur. Je te l\u2019avais dit, et je le pensais : la suite \xE9tait \xE0 toi. Puis Sasha est entr\xE9 dans les Archives sans frapper, tremp\xE9 jusqu\u2019aux genoux, et il a pos\xE9 sur ma table une fiole d\u2019eau ti\xE8de. \xAB Go\xFBtez. \xBB Je l\u2019ai rouvert le soir m\xEAme."),
      t("Il n\u2019y a pas de sel dans cette eau. Il n\u2019y en a jamais eu. Ce n\u2019est pas la mer qui s\u2019est infiltr\xE9e par une fissure, comme l\u2019ont aussit\xF4t dit les Veilleurs, soulag\xE9s d\u2019avoir une explication. C\u2019est une eau qui dort sous le Puits d\u2019avant depuis bien avant eux, et qui ne devrait pas monter."),
      t("Elle monte. Sasha a plant\xE9 une jauge, Doran a compt\xE9 les marches, V\xE9la a mis la main dedans et n\u2019a pas voulu me dire ce qu\u2019elle avait senti. Moi, j\u2019ai fait ce que je sais faire : j\u2019ai cherch\xE9 dans les papiers qui, avant nous, avait vu cette eau. Personne. Les rapports de 2066 s\u2019arr\xEAtent \xE0 \u22126, ceux des Brigades \xE0 \u22128, et ceux du Premier Porteur, s\u2019il en a \xE9crit, ne sont pas dans nos armoires."),
      t("Je crois que nous nous sommes tromp\xE9s de question pendant soixante ans. Nous demandions ce que ceux d\u2019avant avaient laiss\xE9. Il aurait fallu demander ce qu\u2019ils avaient retenu. On ne b\xE2tit pas une ville enti\xE8re en remontant, \xE9tage apr\xE8s \xE9tage, sans laisser quelque chose en bas pour tenir l\u2019eau loin de ses enfants."),
      t("Redescends, directeur. Et cette fois, regarde moins les murs. Regarde ce qui les porte."),
      "\u2014 Ys\xE9"
    ]
  },
  {
    id: "foret",
    livre: 4,
    titre: t("La for\xEAt sous l\u2019eau"),
    epoque: t("Les Strates du Fond"),
    image: "chap-foret",
    strate: 12,
    teaser: t("Ce qu\u2019Ys\xE9 a lu dans le carnet de chantier que tu as remont\xE9 de \u221212."),
    paragraphes: [
      t("Tu m\u2019as rapport\xE9 une pince. Je l\u2019ai pos\xE9e sur mon bureau, \xE0 c\xF4t\xE9 de la fiole de Sasha, et je les regarde toutes les deux depuis trois jours. Une eau qui monte, et l\u2019outil qui l\u2019a fait monter."),
      t("En 2091, la Compagnie des Fondations a envoy\xE9 une \xE9quipe tr\xE8s bas, plus bas que tout ce que nos registres admettent. Je n\u2019en trouve aucune trace aux Veilleurs, ce qui veut dire qu\u2019on les a retir\xE9es, et je sais qui retire nos papiers. Elle n\u2019est pas pass\xE9e par nos puits : au fond, les portes \xE9taient encore ferm\xE9es de l\u2019int\xE9rieur. Sasha a son id\xE9e : sous les Basses, les Citernes ont des conduites qui plongent plus bas que tous nos plans. Cette \xE9quipe est revenue avec cent douze cristaux. Le Levage avait commenc\xE9 l\u2019ann\xE9e d\u2019avant, avec ce qu\u2019on trouvait dans les Berceaux pr\xE8s de la surface, et les premi\xE8res \xEEles tanguaient comme des barques. Avec ces cent douze-l\xE0, elles ont cess\xE9 de tanguer."),
      t("J\u2019ai toujours cru, comme tout le monde, que les \xEEles volaient gr\xE2ce aux c\u0153urs des Berceaux. C\u2019est vrai. Mais on oublie de se demander ce que faisaient ces c\u0153urs avant qu\u2019on les monte au-dessus des nuages. On les croyait endormis. Ils travaillaient."),
      t("Ilka m\u2019a demand\xE9 si une colonne \xE9teinte pouvait se rallumer. Je lui ai r\xE9pondu que je n\u2019en savais rien, ce qui est vrai. Elle a hoch\xE9 la t\xEAte, et elle a dit une chose \xE9trange : que ses jambes ne disent plus bonjour le matin, depuis la for\xEAt. Qu\u2019elles \xE9coutent. Je l\u2019ai not\xE9e ici pour ne pas l\u2019oublier, et parce que je n\u2019ai pas aim\xE9 la fa\xE7on dont elle l\u2019a dite."),
      "\u2014 Ys\xE9"
    ]
  },
  {
    id: "ceux-qui-portent",
    livre: 4,
    titre: t("Ceux qui portent"),
    epoque: t("Bien avant nous"),
    image: "chap-avant",
    strate: 13,
    teaser: t("Ce que voulait vraiment dire le mot de \u22127."),
    paragraphes: [
      t("Je t\u2019avais \xE9crit qu\u2019un mot revenait sur les tables de \u22127 pour dire \xAB nous \xBB : Ossyra, \xAB ceux qui portent \xBB. J\u2019avais cru qu\u2019ils parlaient des voix qu\u2019ils portaient en eux. Je me suis tromp\xE9e, et je suis contente de m\u2019\xEAtre tromp\xE9e, pour une fois."),
      t("Ils parlaient d\u2019un poids. Leurs derniers, ceux qui ne savaient plus quel visage prendre, ne se sont pas tous perdus dans leurs voix. Une partie d\u2019entre eux est redescendue jusqu\u2019au fond, l\xE0 o\xF9 personne n\u2019allait plus, et ils se sont grav\xE9s dans le cristal pour tenir la vo\xFBte au-dessus de l\u2019eau, pendant que leurs enfants remontaient vers une surface qu\u2019ils ne verraient pas."),
      t("L\u2019\xC9cluse, directeur. On la cherchait comme une machine, une pompe g\xE9ante, un levier oubli\xE9. Le march\xE9 en vend des dessins. C\u2019\xE9taient des gens, qui ont choisi de rester en bas pour que les autres puissent monter. Les vannes, les colonnes, les lignes d\u2019eau : c\u2019est leur ouvrage, et c\u2019est eux."),
      t("Je me demande ce qu\u2019ils ont pens\xE9 de nous, en 2091, quand des inconnus en combinaison de chantier sont venus les d\xE9couper \xE0 la pince, un par un, pour faire flotter des palais. Je me demande s\u2019ils ont compris. Et je me demande, ce qui est pire, s\u2019ils nous en veulent, ou s\u2019ils continuent simplement de porter, avec cent douze \xE9paules en moins."),
      t("Et il y a ces \xE9clats bleus que la mar\xE9e d\xE9pose sur ta gr\xE8ve depuis que tu es descendu au Fond. Nous les ramassons, nous aussi, et ton district s\u2019en sert. Doran les compte chaque matin sans rien dire. Je crois qu\u2019il sait de quoi ils tombent."),
      t("V\xE9la dit qu\u2019ils ne nous en veulent pas. Je voudrais la croire. Je remarque qu\u2019elle ne dort plus beaucoup."),
      "\u2014 Ys\xE9"
    ]
  },
  {
    id: "cent-douze",
    livre: 4,
    titre: t("Ton pilier"),
    epoque: "2091 \u2013 2121",
    image: "chap-cent-douze",
    strate: 14,
    teaser: t("Ce qui se trouve exactement sous la Tour du Noyau."),
    paragraphes: [
      t("Tu te souviens de la premi\xE8re chose que je t\u2019ai apprise sur ton district : qu\u2019on choisissait, pour les chantiers d\u2019abris, un pilier dont le pied ne bougeait jamais, et que personne ne s\u2019\xE9tait demand\xE9 pourquoi ceux-l\xE0 tenaient. Tu as la r\xE9ponse, maintenant. Tu l\u2019as vue de tes yeux, sous ta Tour."),
      t("Chaque cuvette du milieu est pos\xE9e, sans le savoir, au-dessus d\u2019une colonne. La tienne en porte une seule, jeune, fendue sur un tiers. Les fissures que les \xE9quipes rebouchent la nuit dans les Fondations, celles dont je te parlais comme d\u2019un d\xE9tail, ne viennent pas de la mer. Elles viennent d\u2019en dessous. Vertiga ne fait pas que voir la mer monter. Vertiga descend."),
      t("Sasha a refait ses calculs devant moi, sur le dos d\u2019une fiche de pr\xEAt. Il reste assez de colonnes pour porter la ville. Il n\u2019en reste pas assez pour porter la ville et une \xEEle de plus. Chaque \xEEle que les Hauts l\xE8vent se paie ici. Dame Isaure le dit \xE0 sa fa\xE7on depuis des ann\xE9es, quand elle r\xE9p\xE8te qu\u2019une \xEEle porte tant de vies et pas une de plus. Elle ne disait pas tout."),
      t("Je sais ce que tu vas me demander, parce que le district te le demande d\xE9j\xE0 : et la Fl\xE8che ? Les \xEEles pour tout le monde, pas seulement pour cinq familles ? Je n\u2019ai pas de r\xE9ponse. Je sais seulement qu\u2019une porte ouverte l\xE0-haut et une vo\xFBte qui tient en bas tirent sur la m\xEAme corde, et qu\u2019il faudra bien que quelqu\u2019un le dise tout haut."),
      "\u2014 Ys\xE9"
    ]
  },
  {
    id: "se-rendre",
    livre: 4,
    titre: t("Ce qui tient ne se reprend pas"),
    epoque: "2121",
    image: "chap-se-rendre",
    strate: 15,
    teaser: t("La derni\xE8re ligne grav\xE9e au fond du Fond."),
    paragraphes: [
      t("\xAB Ce qui tient ne se reprend pas. Il se rend. \xBB J\u2019ai \xE9crit la phrase en haut d\u2019une page blanche, et je n\u2019arrive pas \xE0 \xE9crire la suite."),
      t("Alors je reprends par ce que je sais, et je te redis l\u2019eau d\u2019une traite, parce que nous l\u2019avons apprise \xE0 l\u2019envers. Chez ceux d\u2019avant, elle montait : \xE0 \u22127, ils ont regrav\xE9 leur ligne jusqu\u2019en haut du mur. Certains sont descendus la retenir, et pendant des mill\xE9naires elle a baiss\xE9. En 2091, nous avons emport\xE9 cent douze de ceux qui la tenaient. Depuis, elle remonte. Et ce n\u2019est pas une autre eau que la n\xF4tre : c\u2019est la mer, filtr\xE9e par la pierre."),
      t("Sasha est formel : les vannes du Fond et celles des Citernes, sous les Basses, sont une seule machine, toujours r\xE9gl\xE9e. Ouverte aux deux bouts, elle laisserait la mer descendre dans la pierre au lieu de monter chez nous. Pas toute la mer, bien s\xFBr. Assez pour que la ligne bleue de ton district repasse au-dessus de la mar\xE9e. Il ne manque \xE0 cette machine que de quoi porter la vo\xFBte, et nous savons o\xF9 c\u2019est parti."),
      t("Mais on ne reprend pas un c\u0153ur comme on l\u2019a pris. Une empreinte se rend, ou elle ne vient pas. Il faudrait que ceux qu\u2019on a mont\xE9s au-dessus des nuages acceptent de redescendre. Ou que d\u2019autres viennent porter \xE0 leur place. Je relis ces deux phrases, et je n\u2019aime aucune des deux."),
      t("Je pense \xE0 la Glaci\xE8re, qui se souvient de tout et ne peut rien porter. Aux colonnes, qui portent tout et ne disent rien. Et aux jambes d\u2019Ilka, qui \xE9coutent. Ilka est venue me voir hier soir. Elle m\u2019a demand\xE9, tr\xE8s calmement, combien de temps une copie peut porter, \xE0 la place d\u2019un original. Je lui ai dit que je ne savais pas. Elle a dit : \xAB Moi, je crois que quelqu\u2019un le sait. \xBB Puis elle est repartie vers le port, vers l\u2019ouest, l\xE0 o\xF9 les ing\xE9nieurs creusaient en 2085."),
      t("Je ne sais pas ce que tu feras, directeur. Je sais que tu ne le feras pas seul. Et pour une fois, je ne fermerai pas mon cahier."),
      "\u2014 Ys\xE9"
    ]
  },
  // ---------- Livre V · Ceux qui partent (13 novembre 2026) ----------
  // L'Exode, une seule issue (Bryan, 13 novembre 2026 : « monter ») : un chapitre à chaque chantier fini. Le dernier dit le
  // prix, par la bouche de Véla, qui sait ce que soulèvent les Berceaux ; le choix de rendre ou de porter viendra avec le Fond.
  // Le district monte, le directeur reste : la Cuvette continue, pour les convois des cuvettes voisines.
  {
    id: "six-cents",
    livre: 5,
    titre: t("Six cents noms"),
    epoque: "2121",
    exode: 1,
    teaser: t("Ce que contient le Registre."),
    paragraphes: [
      t("Tu as fait ce que personne n\u2019avait fait depuis la Mont\xE9e : compter tout le monde. Pas les foyers, pas les bras. Les gens."),
      t("Le Registre est sur ma table. Six cents noms, \xE9crits par des mains qui tremblaient ou qui s\u2019appliquaient. Certains ont sign\xE9 d\u2019une croix, d\u2019autres d\u2019une empreinte de pouce, comme au Mur."),
      t("Une vieille dame de la rue des pompes est venue v\xE9rifier que son chat y figurait. Il y figure : Doran l\u2019a ajout\xE9 lui-m\xEAme, en bas de la page, au crayon gras."),
      t("Le Noy\xE9 est pass\xE9 aussi. Il a lu la liste jusqu\u2019au bout sans rien dire, puis il a demand\xE9 s\u2019il restait de la place pour un nom. Le sien. Je crois que c\u2019est la premi\xE8re fois en vingt ans qu\u2019il accepte d\u2019\xEAtre compt\xE9."),
      "\u2014 Ys\xE9"
    ]
  },
  {
    id: "porte-mer",
    livre: 5,
    titre: t("Une porte sur la mer"),
    epoque: "2121",
    exode: 2,
    teaser: t("La digue a d\xE9sormais une porte."),
    paragraphes: [
      t("Pendant soixante ans, on a mis la mer dehors. Aujourd\u2019hui, ton district lui a ouvert une porte."),
      t("Les Pontons partent de la digue, c\xF4t\xE9 large, l\xE0 o\xF9 mon p\xE8re disait qu\u2019il ne fallait jamais percer. Doran a refait le calcul trois fois. La digue tient. Elle tient m\xEAme mieux, maintenant qu\u2019elle n\u2019a plus \xE0 faire semblant d\u2019\xEAtre un mur."),
      t("Le premier soir, les enfants s\u2019y sont assis, les pieds au-dessus de l\u2019eau. Personne ne les a grond\xE9s. Je crois que personne, ici, n\u2019avait jamais regard\xE9 la mer d\u2019aussi pr\xE8s sans en avoir peur."),
      "\u2014 Ys\xE9"
    ]
  },
  {
    id: "radeaux",
    livre: 5,
    titre: t("Une place pour chacun"),
    epoque: "2121",
    exode: 3,
    teaser: t("De quoi sont faites les Barges."),
    paragraphes: [
      t("Les Barges sont \xE0 flot. Six cents places, et quelques-unes de plus : V\xE9la a insist\xE9 pour qu\u2019on garde de la marge, sans dire pour qui."),
      t("On les a construites avec ce que la ville jette : des coques de pompes, les t\xF4les des anciens chantiers d\u2019abris, les planchers des passerelles br\xFBl\xE9es pendant la Gr\xE8ve. Ilka trouve qu\u2019elles ressemblent \xE0 des radeaux de pirates. Elle a raison, et elle en est tr\xE8s fi\xE8re."),
      t("Les Hauts ont envoy\xE9 quelqu\u2019un compter nos barges depuis une passerelle. Il a pris des notes. Il n\u2019est pas descendu."),
      "\u2014 Ys\xE9"
    ]
  },
  {
    id: "une-vie-de-plus",
    livre: 5,
    titre: t("Une vie de plus"),
    epoque: "2121",
    exode: 4,
    teaser: t("La r\xE9ponse de Dame Isaure."),
    paragraphes: [
      t("Dame Isaure m\u2019a r\xE9pondu. Je recopie sa lettre \xE0 la fin de ce chapitre, parce qu\u2019elle m\xE9rite d\u2019\xEAtre lue en entier, et parce qu\u2019elle a raison sur un point."),
      t("Alors on monte l\xE9ger. Des abris qui se plient, des jardins en bacs, des lits qui se suspendent. Tout ce que ton district a appris en vivant sur quelques m\xE8tres de sol sec, il l\u2019emporte. Six cents vies qui ont l\u2019habitude de tenir dans peu de place."),
      t("Isaure compte en poids. Nous, nous comptons en gens. Ce n\u2019est pas la m\xEAme arithm\xE9tique, et je ne sais pas encore laquelle aura le dernier mot."),
      "\u2014 Ys\xE9"
    ],
    documents: [
      {
        titre: t("La lettre de Dame Isaure"),
        support: t("Un papier \xE9pais aux armes de la Maison Ors\xE8ve, cachet\xE9 d\u2019or"),
        lignes: [
          t("Une \xEEle porte tant de vies, pas une de plus. Ce ne sont pas mes mots : ce sont ceux des Berceaux."),
          t("Vous pouvez y monter vos jardins. Vous ne pourrez pas y monter leur poids."),
          t("Je ne vous emp\xEAcherai pas de passer. Je vous demande seulement de savoir ce que vous emportez, et ce que vous laissez."),
          "\u2014 I. O."
        ]
      }
    ]
  },
  {
    id: "le-prix",
    livre: 5,
    titre: t("Le prix"),
    epoque: "2121",
    exode: 5,
    teaser: t("La nuit o\xF9 l\u2019\xEEle est pass\xE9e."),
    paragraphes: [
      t("L\u2019\xEEle est pass\xE9e cette nuit. Ton escouade tenait le sommet. Les Barges sont mont\xE9es une \xE0 une, et sur le quai, les gardes des Hauts ont regard\xE9 passer six cents personnes qui n\u2019\xE9taient pas une escouade. Personne ne les a arr\xEAt\xE9es : la Clause \xE9tait \xE9crite, et cette fois, quelqu\u2019un l\u2019a lue jusqu\u2019au bout."),
      t("On t\u2019a propos\xE9 le palais. Tu l\u2019as laiss\xE9 aux autres. Le Noy\xE9 \xE9tait sur la derni\xE8re barge ; il n\u2019a pas regard\xE9 en arri\xE8re, mais il souriait."),
      t("V\xE9la est rest\xE9e pr\xE8s de moi au d\xE9part. Elle m\u2019a dit, \xE0 voix basse, ce que tu dois savoir : chaque \xEEle qu\u2019on ouvre puise dans les Berceaux qui soul\xE8vent Vertiga. Nous venons d\u2019en ouvrir une pour six cents personnes. La ville descendra un peu plus vite, et ceux qui restent le paieront."),
      t("Je lui ai demand\xE9 si nous avions eu tort. Elle a hauss\xE9 les \xE9paules : \xAB On a sauv\xE9 ceux qu\u2019on pouvait sauver. Le reste, il faudra le trouver en bas. \xBB Je crois qu\u2019elle pensait \xE0 la Glaci\xE8re."),
      t("Ton district est l\xE0-haut, directeur. Toi, tu es redescendu. Je savais que tu le ferais : les cuvettes voisines attendent leur tour, et il y a des Pontons pour les y conduire."),
      "\u2014 Ys\xE9"
    ]
  }
];

// src/core/partie/recompenses.ts
var KIT_RECRUES = {
  coursier: ["gant-arc", "grappin-cable", "coeur-turbine"],
  docker: ["crocs-fossiles", "cuir-recif", "yeux-nocturnes"],
  guetteur: ["miroir-brume", "encre-ancienne", "meche-or"]
};
function donnerKitRecrues(j) {
  if (j.kitRecrues) return;
  j.kitRecrues = true;
  for (const [id, cartes] of Object.entries(KIT_RECRUES)) {
    const p = j.porteurs[id];
    if (!p) continue;
    for (const c2 of cartes) {
      const cle = carteId(c2, "fer");
      ajouterCarte(j, cle);
      const libre = !Object.values(j.porteurs).some((q) => q.modules.includes(cle));
      if (libre && p.modules.length < DISTRICT.cartesMax && !p.modules.some((k) => moduleDe(k) === c2)) p.modules.push(cle);
    }
  }
}
function noterStrates(r, strate) {
  const s = (r.strates ?? []).slice(0, r.reserve);
  while (s.length < r.reserve) s.push(strate);
  r.strates = s;
}
function ligneeLaMoinsFournie(j) {
  const n = { tech: 0, bio: 0, reso: 0 };
  for (const id of Object.keys(j.collection)) n[moduleDef(id).lignee]++;
  return ["tech", "bio", "reso"].reduce((a, b) => n[b] < n[a] ? b : a);
}
function recompenserLecture(j, chapitreId) {
  if (j.luesRecompensees.includes(chapitreId)) return null;
  j.luesRecompensees.push(chapitreId);
  const lignee = ligneeLaMoinsFournie(j);
  const metal = metalTranche(CHAPITRES.find((c2) => c2.id === chapitreId)?.strate ?? 1);
  const pool = tirablesEn(metal).filter((m) => m.lignee === lignee);
  const neuves = pool.filter((m) => {
    const k = clePossedee(j, m.id);
    return !k || RARETES.indexOf(moduleDef(k).rarete) < RARETES.indexOf(metal);
  });
  const liste = neuves.length ? neuves : pool;
  const id = carteId(liste[tireur(j).entier(liste.length)].id, metal);
  const neuve = ajouterCarte(j, id);
  log(j, t`Lecture des Chroniques : ${moduleDef(id).nom} (${NOMS_RARETE[metal]})${neuve ? "" : t(", un doublon")}.`);
  return id;
}
var LETTRE_LEGS = {
  titre: t("La lettre de la directrice"),
  texte: t("Sous la Tour du Noyau, derri\xE8re une plaque, les ouvriers avaient trouv\xE9 un coffre de nacre, grav\xE9 \xE0 la main\xA0: \xAB\xA0Pour celui qui remontera de la deuxi\xE8me Strate. Pas avant.\xA0\xBB Ce soir, Ilka te le tend. Dedans, une lettre."),
  /** la lettre elle-même, mise à part (31 octobre 2026) */
  lettre: t("Directeur, une Strate, n\u2019importe qui peut la descendre une fois, par chance ou par orgueil. Deux, et revenir avec les siens, c\u2019est autre chose\xA0: tu iras plus bas que moi. Ce qui dort sous la Tour, je n\u2019ai jamais os\xE9 le regarder en face. Avant de partir, j\u2019ai mis de c\xF4t\xE9 dix originaux, jamais recopi\xE9s, que les Hauts n\u2019auront pas. Un seul est pour toi\xA0: dis-moi qui tu es, et je te dirai lequel."),
  question: t("Qu\u2019est-ce qui tient un district debout ?"),
  lignees: [
    { id: "tech", nom: t("La machine"), phrase: t("Des mains qui r\xE9parent ce que les autres jettent.") },
    { id: "bio", nom: t("Le corps"), phrase: t("Des \xE9paules qui encaissent pour ceux qui ne peuvent pas.") },
    { id: "reso", nom: t("L\u2019empreinte"), phrase: t("Des yeux qui voient ce que les autres ont oubli\xE9.") },
    { id: "cle", nom: t("Tout le monde \xE0 la fois"), phrase: t("Personne ne tient seul. Le district non plus.") }
  ],
  voies: {
    tech: { question: t("Et quand la machine s\u2019emballe ?"), options: [
      { id: "foulee-directrice", phrase: t("On court devant elle, plus vite qu\u2019elle.") },
      { id: "bras-fonderie", phrase: t("On frappe plus fort qu\u2019elle, une bonne fois.") },
      { id: "coeur-glaciere", phrase: t("On garde son \xE9nergie, et on la rel\xE2che au bon moment.") }
    ] },
    bio: { question: t("Et quand les coups pleuvent ?"), options: [
      { id: "carapace-fondations", phrase: t("On encaisse ensemble, et on rend chaque coup.") },
      { id: "oeil-grande-nuit", phrase: t("On ne l\xE2che jamais une proie.") },
      { id: "premiere-mue", phrase: t("On se rel\xE8ve toujours, tous ensemble.") }
    ] },
    reso: { question: t("Et quand personne ne veut entendre ?"), options: [
      { id: "lanterne-lecture", phrase: t("On \xE9claire la suite, pas \xE0 pas.") },
      { id: "sceau-orseve", phrase: t("On lit la faute de l\u2019autre, et on la lui rend.") },
      { id: "voix-quartier", phrase: t("On chante plus fort, tous sur la m\xEAme note.") }
    ] }
  }
};
var EVEIL_LEGS = [{ porteur: 16, niveau: 3 }, { porteur: 19, niveau: 5 }];
var niveauLegsPour = (niveauDuPorteur) => EVEIL_LEGS.reduce((n, e) => niveauDuPorteur >= e.porteur ? Math.max(n, e.niveau) : n, COLLECTION.niveauDepart.nacre);

// src/core/partie/stats.ts
var SESSION = 30 * 6e4;

// src/core/lieux.ts
var LIEUX = [
  // ---- Augmentés : les machines d'avant ----
  {
    id: "pompage",
    nom: t("la station de pompage engloutie"),
    lignee: "tech",
    specialite: "composants",
    lore: t("Elle pompait la mer hors des rues basses, jusqu\u2019au jour o\xF9 la mer a gagn\xE9. Ses vannes tournent encore quand la mar\xE9e tire dessus."),
    arrivee: t("Les grandes vannes de la station d\xE9passaient de l\u2019eau verte : la barque s\u2019est gliss\xE9e entre deux tuyaux, et {nom} a pris pied sur une roue rouill\xE9e.")
  },
  {
    id: "dessalement",
    nom: t("l\u2019usine de dessalement abandonn\xE9e"),
    lignee: "tech",
    specialite: "composants",
    lore: t("Elle rendait l\u2019eau douce \xE0 trois piliers. Ses cuves blanches sont couvertes d\u2019un sel qui brille \xE0 midi, et ses pompes n\u2019attendent qu\u2019un courant pour repartir."),
    arrivee: t("Les cuves blanches de l\u2019usine brillaient de sel en plein soleil ; {nom} a saut\xE9 sur une passerelle ti\xE8de.")
  },
  {
    id: "gare",
    nom: t("la gare suspendue \xE0 demi noy\xE9e"),
    lignee: "tech",
    specialite: "cartes",
    lore: t("Les trains des Hauts y passaient au-dessus des toits. Un wagon pend encore au-dessus de l\u2019eau, plein de bagages que personne n\u2019est venu chercher."),
    arrivee: t("La barque s\u2019est arr\xEAt\xE9e sous les pieds de fer de la gare ; {nom} a grimp\xE9 jusqu\u2019au quai par une \xE9chelle de service.")
  },
  {
    id: "transbordeur",
    nom: t("l\u2019\xE9pave du transbordeur H\xE9ron"),
    lignee: "tech",
    specialite: "rescapes",
    lore: t("Il faisait la navette entre les piliers, cent passagers par travers\xE9e. \xC9chou\xE9 sur un banc de sable, il abrite encore ceux qui n\u2019ont jamais trouv\xE9 d\u2019autre toit."),
    arrivee: t("Le H\xE9ron gisait sur son banc de sable, sa proue tendue vers le large ; {nom} est entr\xE9 par une \xE9coutille entrouverte.")
  },
  // ---- Génés : le vivant ----
  {
    id: "serres",
    nom: t("les serres noy\xE9es du Jardin d\u2019Hiver"),
    lignee: "bio",
    specialite: "cartes",
    lore: t("Sous le d\xF4me bris\xE9, les plantes ont tout repris. Les jardiniers d\u2019avant y cachaient des pierres au pied des arbres, pour qu\u2019elles poussent avec eux."),
    arrivee: t("Sous le d\xF4me bris\xE9, l\u2019air sentait la terre mouill\xE9e ; {nom} a \xE9cart\xE9 les lianes pour entrer.")
  },
  {
    id: "marche",
    nom: t("les toits du vieux march\xE9 des Salines"),
    lignee: "bio",
    specialite: "rescapes",
    lore: t("Les auvents ray\xE9s flottent au ras de l\u2019eau. Des lanternes y br\xFBlent encore chaque soir, entretenues par des familles qui n\u2019ont jamais voulu partir."),
    arrivee: t("Les auvents ray\xE9s du vieux march\xE9 flottaient au ras de l\u2019eau, et quelques lanternes br\xFBlaient encore pour accueillir la barque.")
  },
  {
    id: "criee",
    nom: t("les quais morts de l\u2019ancienne cri\xE9e"),
    lignee: "bio",
    specialite: "composants",
    lore: t("Ici se vendait le poisson de toute la c\xF4te. Les filets pendent toujours, les chambres froides sont intactes, et les mouettes ne sont jamais parties."),
    arrivee: t("Sur les quais de la cri\xE9e, les filets pendaient toujours, et les mouettes ont salu\xE9 la barque \xE0 grands cris.")
  },
  {
    id: "silos",
    nom: t("les silos de la digue rompue"),
    lignee: "bio",
    specialite: "cartes",
    lore: t("Les silos gardaient le grain de tout un quartier. La digue a c\xE9d\xE9, le grain a germ\xE9 : des \xE9pis sortent des fentes du b\xE9ton, et des pierres dorment dans les semences."),
    arrivee: t("Des \xE9pis sortaient des fentes des silos ; {nom} a long\xE9 la digue rompue, de l\u2019eau jusqu\u2019aux genoux.")
  },
  // ---- Résonants : les échos ----
  {
    id: "clocher",
    nom: t("le clocher de verre sous la mar\xE9e"),
    lignee: "reso",
    specialite: "cartes",
    lore: t("Quand la houle frappe le verre, la cloche de bronze sonne seule. Les R\xE9sonants disent qu\u2019elle sonne juste, comme une voix qu\u2019on aurait gard\xE9e."),
    arrivee: t("En approchant, {nom} a entendu la cloche de verre sonner seule, au rythme de la houle.")
  },
  {
    id: "pilier-sans-nom",
    nom: t("le pilier sans nom au large de Brume-Haute"),
    lignee: "reso",
    specialite: "cartes",
    lore: t("Aucune carte ne le nomme, et aucun passeur n\u2019y accoste deux fois de la m\xEAme fa\xE7on. Dans le brouillard, des lumi\xE8res s\u2019allument et s\u2019\xE9teignent, sans personne pour les tenir."),
    arrivee: t("Le brouillard s\u2019est ouvert juste le temps d\u2019accoster ; derri\xE8re la barque, plus rien, ni le district ni la mer.")
  },
  {
    id: "phare",
    nom: t("le phare couch\xE9 de P\xE2le-Lune"),
    lignee: "reso",
    specialite: "rescapes",
    lore: t("Il s\u2019est couch\xE9 dans la mer sans s\u2019\xE9teindre tout \xE0 fait. Sa lampe pulse encore, comme un c\u0153ur qui dort, et les naufrag\xE9s suivent sa lueur."),
    arrivee: t("La lampe du phare couch\xE9 pulsait sous l\u2019eau, comme un c\u0153ur endormi ; le passeur s\u2019est guid\xE9 sur elle.")
  },
  {
    id: "pilier-effondre",
    nom: t("le pilier effondr\xE9 de Sombreverse"),
    lignee: "reso",
    specialite: "composants",
    lore: t("Un pilier-cit\xE9 cass\xE9 en deux. Ses \xE9tages hauts ont gliss\xE9 dans l\u2019eau avec leurs ateliers, et l\u2019on y entend encore travailler des voix sans corps."),
    arrivee: t("Les \xE9tages tomb\xE9s du pilier formaient un escalier dans la mer ; {nom} l\u2019a descendu marche apr\xE8s marche.")
  }
];
var NOM_SPECIALITE = { composants: t("Minerai"), cartes: t("Pierres"), rescapes: t("Rescap\xE9s") };
var RECIT_BON = {
  tech: t("{nom} a pos\xE9 la main sur une console morte : ses greffes ont parl\xE9 aux machines, et les portes se sont ouvertes une \xE0 une."),
  bio: t("Les plantes se sont \xE9cart\xE9es devant {nom} : un G\xE9n\xE9 sent les s\xE8ves, et sait o\xF9 le vivant cache ce qu\u2019il garde."),
  reso: t("Les \xE9chos du lieu ont reconnu la pierre de {nom}, et les voix lui ont montr\xE9 le chemin des cachettes.")
};
var RECIT_MAUVAIS = {
  tech: t("Les machines n\u2019ont rien voulu entendre de la pierre de {nom} : les vannes sont rest\xE9es gripp\xE9es, il a fallu tout forcer."),
  bio: t("Les ronces se sont referm\xE9es sur les greffes de {nom}, et l\u2019humidit\xE9 a gripp\xE9 ses articulations : une fouille lente et p\xE9nible."),
  reso: t("Les \xE9chos ont \xE9gar\xE9 {nom}, qui a tourn\xE9 des heures dans des couloirs qui changeaient de forme.")
};
var RECIT_NEUTRE = t("Ni aide ni g\xEAne sur place : une fouille honn\xEAte, \xE0 la lampe.");

// src/core/partie/descentes.ts
function gestesDe(j, id) {
  const niv = niveauPorteur(j, id).niveau;
  const cartes = (j.porteurs[id]?.modules ?? []).filter((k) => j.collection[k]).map((k) => ({ id: metalJouable(k, niv), niveau: j.collection[k].niveau }));
  const jeu = cartesEnJeu(id, cartes);
  if (id === "vela" && j.actes.lecture === "autoriser") jeu.push(LECTURE_PROFONDE);
  return jeu;
}
var deckEscouade = (j, escouade, k = indiceEscouade(j, escouade), sortie = "explorer") => {
  const cle = cleDuLegs(j, escouade);
  return [...escouade.flatMap((id) => gestesDe(j, id)), ...gestesCommuns(j, k, sortie), ...cle ? [cle] : []];
};
function indiceEscouade(j, escouade) {
  const toutes = escouadesDe(j);
  for (const id of escouade) {
    const k = toutes.findIndex((l) => l.includes(id));
    if (k >= 0) return k;
  }
  return escouadeActive(j);
}
var RATELIER = {
  /** emplacements selon le niveau de la Tour du Noyau : 2, 3 au niveau 5, 4 au niveau 9 */
  places: [{ noyau: 1, n: 2 }, { noyau: 5, n: 3 }, { noyau: 9, n: 4 }],
  /** prix d'un départ avec les cartes du district (1er novembre 2026, Bryan : un prix clair par sortie plutôt qu'un prix par carte) :
   *  des heures de production du Générateur, pour toutes les cartes du Râtelier à la fois ; le prix suit les revenus.
   *  Explorer (≈ 6 combats) : 30 min ; Fouiller et les sorties d'un ou deux combats (Épreuve, Pillage, Flèche) : 15 min.
   *  (1er novembre 2026, Bryan : 2 h et 40 min, c'était trop cher, ≈ 900 pour descendre : puis encore un peu trop à 1 h et 20 min : 30 min et 15 min) */
  /** 9 novembre 2026 (cristal unique) : un prix fixe en cristaux, qui ne suit plus le Générateur */
  cristaux: { explorer: 10, courte: 5 }
};
var placesRatelier = (j) => RATELIER.places.filter((p) => j.batiments.noyau >= p.noyau).reduce((n, p) => Math.max(n, p.n), 0);
var communeOuverte = (j, c2) => (j.batiments[c2.batiment] ?? 0) >= c2.niveau;
function gesteCommun(j, c2) {
  return { ...c2.geste, v: forceCommune(c2, j.batiments[c2.batiment] ?? 0) };
}
function ratelierDe(j, k = escouadeActive(j)) {
  if (premiersPas(j)) return [];
  const ids = (j.rateliers?.[k] ?? j.ratelier ?? RATELIER_DEPART).filter((id) => {
    const c2 = communeDef(id);
    return !!c2 && communeOuverte(j, c2);
  });
  return [...new Set(ids)].slice(0, placesRatelier(j));
}
var coutRatelier = (j, sortie = "explorer", k = escouadeActive(j)) => ratelierDe(j, k).length ? RATELIER.cristaux[sortie] : 0;
function ratelierPayable(j, k = escouadeActive(j), sortie = "explorer") {
  return j.energie >= coutRatelier(j, sortie, k) ? ratelierDe(j, k) : [];
}
var gestesCommuns = (j, k = escouadeActive(j), sortie = "explorer") => ratelierPayable(j, k, sortie).map((id) => gesteCommun(j, communeDef(id)));
function cleDuLegs(j, escouade) {
  if (j.legs !== "cle" || !escouade.length) return null;
  const n = Math.max(...escouade.map((id) => niveauPorteur(j, id).niveau));
  if (n < NIVEAU_METAL.nacre) return null;
  return { ...CLE_LEGS, v: CLE_LEGS.v + Math.max(1, Math.round(CLE_LEGS.v * COLLECTION.bonusNiveau)) * paliersForce(niveauLegsPour(n)) };
}
var ESCOUADE_DEPART = ["ilka", "doran", "vela"];
var MISSIONS = {
  // 9 novembre 2026 (cristal unique) : les missions ne coûtent plus rien ; leur prix, c'est le temps et le Porteur immobilisé
  courte: { heures: 2, composants: 14, doublons: 1, nouvelle: 0, usure: 4 },
  longue: { heures: 8, composants: 45, doublons: 2, nouvelle: 0.35, usure: 8 },
  // le Porteur compte (28 octobre 2026, Bryan) : son niveau et son affinité avec le lieu multiplient le butin et l'XP (jamais les creuseurs)
  parNiveau: 0.03,
  affinite: { bon: 1.3, neutre: 1, mauvais: 0.8 },
  /** le mauvais Porteur au mauvais endroit rentre plus usé */
  usureMauvais: 2,
  /**
   * Le butin annoncé de chaque destination (28 octobre 2026, Bryan : « parfois une carte plutôt que des pièces ») :
   * compo = part des composants d'une mission ordinaire. Chaque semaine, 21 destinations, 7 par lignée,
   * et pour chaque lignée 2 cargaisons, 2 pierres, 2 naufragés, 1 éclats : aucune classe n'est avantagée sur la semaine.
   * Missions illimitées (28 octobre 2026), réglées au robot sur 16 parties : Strate −10 au jour 30 (occasionnel), 20 (assidu)
   * et 17 (acharné, 8 sessions par jour en missions de 2 h), contre 32, 20 et 20 avec l'ancienne limite de destinations.
   */
  butins: {
    cargaison: { compo: 1.4 },
    pierre: { compo: 0.4, nouvelle: { courte: 0.4, longue: 0.6 }, nouvelleMax: 0.9 },
    // les naufragés d'un lieu ne montent qu'une fois par jour dans une barque (la première) ; la même durée ou presque
    // rapporte un creuseur, pour ne plus forcer les missions longues. Une barque arrivée après (ou au-delà du plafond
    // de la Strate) trouve le lieu vide de monde : elle ramène des composants comme une cargaison ordinaire.
    naufrages: { compo: 0.4, compoPlafond: 1, creuseurs: { courte: 1, longue: 1.5 } },
    eclats: { compo: 0.4, eclats: { courte: 1, longue: 1.5 } }
  },
  parLignee: { cargaison: 2, pierre: 2, naufrages: 2, eclats: 1 },
  /** le nombre de destinations de chaque jour de la semaine (mélangé chaque semaine) : 21 en tout */
  parJour: [2, 2, 2, 3, 3, 4, 5],
  /**
   * Fouiller en profondeur (2 novembre 2026, Bryan : « plus on joue, plus on est récompensé ») : remplace les rendements
   * dégressifs (100 %, 50 %, 25 %) qui punissaient le joueur actif. Chaque destination du jour se fouille par niveaux :
   * la première barque reste en Surface, la deuxième descend dans les Cales, la troisième atteint le Cœur, qui rapporte
   * le plus et cache une trouvaille (une carte en plus). Ensuite la ruine est fouillée à fond pour la journée : les barques
   * suivantes rapportent un butin plein de Surface, jamais moins. L'XP et les creuseurs ne changent pas (plafond par Strate).
   */
  profondeurs: [
    { nom: t("Surface"), mult: 1 },
    { nom: t("Cales"), mult: 1.25 },
    { nom: t("C\u0153ur"), mult: 1.6 }
  ]
};
var COEUR = MISSIONS.profondeurs.length - 1;
var NOM_BUTIN = { cargaison: t("Cargaison"), pierre: t("Pierre oubli\xE9e"), naufrages: t("Naufrag\xE9s"), eclats: t("\xC9clats") };
var LIEUX_MISSION = [
  t("le phare couch\xE9 de P\xE2le-Lune"),
  t("les serres noy\xE9es du Jardin d\u2019Hiver"),
  t("le pilier effondr\xE9 de Sombreverse"),
  t("la station de pompage engloutie"),
  t("les toits du vieux march\xE9 des Salines"),
  t("l\u2019\xE9pave du transbordeur H\xE9ron"),
  t("la gare suspendue \xE0 demi noy\xE9e"),
  t("les silos de la digue rompue"),
  t("le pilier sans nom au large de Brume-Haute"),
  t("l\u2019usine de dessalement abandonn\xE9e"),
  t("les quais morts de l\u2019ancienne cri\xE9e"),
  t("le clocher de verre sous la mar\xE9e")
];
var DIFFICULTES_FOUILLE = {
  facile: { nom: t("Facile"), rangs: 4, force: 0.8, gain: 0.35, choix: 1, carte: 0.35, metal: "fer" },
  normale: { nom: t("Normale"), rangs: 5, force: 1, gain: 0.9, choix: 1, carte: 1, metal: "fer" },
  difficile: { nom: t("Difficile"), rangs: 6, force: 1.35, gain: 2.5, choix: 3, carte: 1, metal: "cuivre" }
};
var CIBLES_FOUILLE = {
  tech: { nom: t("Cartes augment\xE9es"), texte: t("Les cartes trouv\xE9es sont des cartes d\u2019Augment\xE9s, et le filon en garde une (trois au choix en difficile).") },
  bio: { nom: t("Cartes g\xE9n\xE9es"), texte: t("Les cartes trouv\xE9es sont des cartes de G\xE9n\xE9s, et le filon en garde une (trois au choix en difficile).") },
  reso: { nom: t("Cartes r\xE9sonantes"), texte: t("Les cartes trouv\xE9es sont des cartes de R\xE9sonants, et le filon en garde une (trois au choix en difficile).") },
  composants: { nom: t("Minerai"), texte: t("Le filon rapporte du minerai pour chaque combat gagn\xE9 en route : plus le chemin est long, plus il donne.") },
  eclats: { nom: t("\xC9clats"), texte: t("Chaque combat gagn\xE9 en route peut laisser un \xC9clat au filon : plus le chemin est long, plus tu as de chances.") }
};
var NOMS_FAMILLE = { endurance: t("Endurance"), tempo: t("Tempo"), tactique: t("Tactique"), lecture: t("Lecture"), deck: t("Deck") };
var EPREUVES = [
  {
    id: "couloir",
    nom: t("Le couloir sans halte"),
    famille: "endurance",
    strateMin: 1,
    force: 1.3,
    enchainement: { soin: 0 },
    regle: t("Trois combats d\u2019affil\xE9e, puis le gardien : aucun PV rendu entre eux.")
  },
  {
    id: "nul-ne-tombe",
    nom: t("Nul ne reste au fond"),
    famille: "endurance",
    strateMin: 1,
    force: 0.95,
    regles: { sansChute: true },
    regle: t("Le premier Porteur \xE0 terre fait perdre l\u2019\xC9preuve.")
  },
  {
    id: "mi-souffle",
    nom: t("\xC0 mi-souffle"),
    famille: "endurance",
    strateMin: 1,
    force: 1.2,
    pvDepart: 0.5,
    regle: t("L\u2019escouade part avec la moiti\xE9 de ses PV (rendus au retour).")
  },
  {
    id: "extinction",
    nom: t("Avant l\u2019extinction"),
    famille: "tempo",
    strateMin: 1,
    force: 1,
    regles: { chrono: 13 },
    regle: t("Abats le gardien en 13 tours, sinon il s\u2019\xE9teint dans le noir.")
  },
  {
    id: "meute",
    nom: t("La meute"),
    famille: "tactique",
    strateMin: 3,
    force: 1.9,
    forceBas: 1.45,
    meute: true,
    regle: t("Le gardien vient avec deux b\xEAtes de la Strate : choisis qui abattre d\u2019abord.")
  },
  {
    id: "derniere-frequence",
    nom: t("La derni\xE8re Fr\xE9quence"),
    famille: "tactique",
    strateMin: 2,
    strateMax: 6,
    force: 1.28,
    troisiemePhase: true,
    regle: t("Le gardien garde une 3\u1D49 phase cach\xE9e sous ses derniers PV.")
  },
  {
    id: "brouillard",
    nom: t("Brouillard total"),
    famille: "lecture",
    strateMin: 5,
    force: 1.2,
    condition: "brouillard",
    regle: t("On voit ce que pr\xE9pare le gardien, jamais combien ni sur qui ; sa F\xEAlure est cach\xE9e.")
  },
  {
    id: "brouillage",
    nom: t("Fr\xE9quences brouill\xE9es"),
    famille: "lecture",
    strateMin: 1,
    force: 1.12,
    regles: { sansResonance: true },
    regle: t("Aucune R\xE9sonance de tout le combat. Les \xC9chos (trois Fr\xE9quences identiques) comptent toujours.")
  },
  {
    id: "recrues",
    nom: t("Les recrues"),
    famille: "deck",
    strateMin: 2,
    force: 1,
    imposee: true,
    regle: t("Le Coursier, le Docker et le Guetteur, avec leurs cartes de d\xE9part : ta collection ne compte pas.")
  },
  {
    id: "une-voix",
    nom: t("Une seule voix"),
    famille: "deck",
    strateMin: 1,
    force: 0.95,
    regles: { monoLignee: true },
    regle: t("Chaque cha\xEEne ne joue qu\u2019une lign\xE9e (les cartes du district vont avec toutes).")
  }
];
var ESCOUADE_RECRUES = {
  coursier: [...KIT_RECRUES.coursier, "ruee", "tir", "esquive"],
  docker: [...KIT_RECRUES.docker, "morsure", "carapace", "regenerer"],
  guetteur: [...KIT_RECRUES.guetteur, "murmure", "echo", "apaiser"]
};
var SEMAINE_ZERO = semaineDe(Date.UTC(2026, 9, 26));

// src/core/digue.ts
var MAREE_REELLE = {
  /** une marée basse de référence (heure de Bruxelles, nuit du 1er janvier 2026) */
  epoque: Date.UTC(2026, 0, 1, 2, 0),
  /** la période d'une marée semi-diurne : 12 h 25 min 14 s */
  periode: 12.4206 * 36e5,
  /** une nouvelle lune de référence, et la durée d'un mois lunaire */
  nouvelleLune: Date.UTC(2e3, 0, 6, 18, 14),
  lunaison: 29.530588853 * 864e5,
  /** coefficient à partir duquel on parle de grande marée */
  grande: 100
};
var L = (id, nom, hauteur, famille, trace) => ({ id, nom, hauteur, famille, trace });
var SECTEURS = [
  {
    id: "lavoirs",
    nom: t("Les Lavoirs"),
    strate: 1,
    ambiance: t("Le premier quartier englouti, au pied de l\u2019\xE9cluse. \xC0 mar\xE9e basse, les bacs de pierre affleurent encore, pleins de coquillages."),
    lieux: [
      L("bac-cordes", t("Le bac aux cordes"), 0.08, "pellan", t("Des cordes \xE0 linge tendues sous l\u2019eau, encore charg\xE9es de draps que personne n\u2019est venu d\xE9crocher.")),
      L("maison-eclusier", t("La maison de l\u2019\xE9clusier"), 0.12, "ardoin", t("Le registre de l\u2019\xE9cluse, tenu jusqu\u2019au dernier jour : \xAB Ferm\xE9e pour la nuit. Rouvrira demain. \xBB")),
      L("passerelle-linge", t("La passerelle \xE0 linge"), 0.16, "sauvel", t("Une passerelle o\xF9 l\u2019on a grav\xE9 des tailles d\u2019enfants, chaque trait un peu plus haut que l\u2019eau de l\u2019ann\xE9e.")),
      L("escalier-blanchisseuses", t("L\u2019escalier des blanchisseuses"), 0.2, "lunel", t("Sous la derni\xE8re marche, une bo\xEEte de savon pleine de boutons d\xE9pareill\xE9s, rang\xE9s par couleur."))
    ]
  },
  {
    id: "treuils",
    nom: t("La Rue des Treuils"),
    strate: 3,
    ambiance: t("Les ateliers qui hissaient les pierres de la digue. Les grues dorment couch\xE9es dans la vase, bras tendus vers le haut."),
    lieux: [
      L("atelier-chaines", t("L\u2019atelier des cha\xEEnes"), 0.28, "kerval", t("Un tableau de commandes au crayon gras : \xAB Cha\xEEnes pour la digue, quatri\xE8me anneau. Pay\xE9es en nature. \xBB")),
      L("grue-couchee", t("La grue couch\xE9e"), 0.32, "mirande", t("Dans la cabine de la grue, un poste de radio r\xE9gl\xE9 sur une fr\xE9quence qui n\u2019\xE9met plus que de la mer.")),
      L("forge-froide", t("La forge froide"), 0.36, "ibarre", t("Une enclume marqu\xE9e d\u2019un sigle de chantier que personne au district ne reconna\xEEt, plus vieux que la digue.")),
      L("cabine-pontier", t("La cabine du pontier"), 0.4, "nalis", t("Un plan de la digue o\xF9 l\u2019on a entour\xE9, au crayon rouge, un endroit sous l\u2019anneau marqu\xE9 \xAB ne pas creuser \xBB."))
    ]
  },
  {
    id: "ecole",
    nom: t("L\u2019\xC9cole noy\xE9e"),
    strate: 5,
    ambiance: t("L\u2019\xE9cole du quartier bas. Le pr\xE9au s\u2019est effondr\xE9, la cloche est rest\xE9e accroch\xE9e, et sonne seule les nuits de houle."),
    lieux: [
      L("preau", t("Le pr\xE9au"), 0.48, "haudry", t("Une marelle peinte au sol, intacte sous un doigt de sable, la case du ciel juste \xE0 la ligne d\u2019eau.")),
      L("classe-haute", t("La classe du haut"), 0.52, "prevel", t("Au tableau, une le\xE7on jamais effac\xE9e : \xAB La mer monte de trois centim\xE8tres par an. Calcule dans cent ans. \xBB")),
      L("bibliotheque-ecole", t("La biblioth\xE8que de l\u2019\xE9cole"), 0.56, "casset", t("Des livres s\xE9ch\xE9s un \xE0 un, pages raides, rang\xE9s par ordre de ceux qui les avaient emprunt\xE9s.")),
      L("cour-cloche", t("La cour de la cloche"), 0.6, "berot", t("La corde de la cloche descend dans un trou du sol, plus profond qu\u2019une cave, d\u2019o\xF9 monte un air ti\xE8de."))
    ]
  },
  {
    id: "citernes",
    nom: t("Les Citernes"),
    strate: 7,
    ambiance: t("Sous les quartiers bas, des r\xE9servoirs vo\xFBt\xE9s que la digue a recouverts. Ceux qui les ont creus\xE9s n\u2019ont laiss\xE9 aucun nom."),
    lieux: [
      L("citerne-seche", t("La citerne s\xE8che"), 0.68, "tessier", t("Des marches taill\xE9es trop hautes pour un pas d\u2019homme, polies au milieu comme par des si\xE8cles de passages.")),
      L("galerie-voutes", t("La galerie des vo\xFBtes"), 0.72, "okane", t("Des vo\xFBtes sans joint, d\u2019une seule pierre, avec ce m\xEAme \xE9clat bleu que les cristaux des Strates.")),
      L("chambre-vannes", t("La chambre des vannes"), 0.76, "varenne", t("Des vannes d\u2019un m\xE9tal qui ne rouille pas, r\xE9gl\xE9es sur une mar\xE9e qui ne correspond \xE0 aucune d\u2019aujourd\u2019hui.")),
      L("puisard", t("Le puisard"), 0.8, "aumont", t("Au fond du puisard, des empreintes de mains dans la pierre, \xE0 hauteur d\u2019enfant, tourn\xE9es vers le bas."))
    ]
  },
  {
    id: "palier",
    nom: t("Le Palier"),
    strate: 9,
    ambiance: t("Tout en bas du flanc, sous l\u2019anneau de la digue : l\u2019escalier de ta premi\xE8re Halte, pris par son autre bout. Il passe sous la Cuvette et ressort ici, dehors, \xE0 la mer."),
    lieux: [
      L("premieres-marches", t("Les premi\xE8res marches"), 0.86, "roustan", t("Les marches descendent sous la Cuvette. La digue a \xE9t\xE9 pos\xE9e dessus comme un couvercle, sans que personne le sache.")),
      L("niche-lampes", t("La niche aux lampes"), 0.9, "falgue", t("Des lampes de pierre qui s\u2019allument quand on approche, de la m\xEAme lueur que le pouls de la lampe du phare couch\xE9.")),
      L("palier-graves", t("Le palier grav\xE9"), 0.94, "demare", t("Des milliers d\u2019empreintes digitales grav\xE9es au mur, une par personne, comme un registre. Il reste de la place en bas du mur.")),
      L("seuil", t("Le seuil"), 0.98, "veilleurs", t("Une porte sans poign\xE9e. De l\u2019autre c\xF4t\xE9, on entend l\u2019eau du puits du district, celle qui descend vers les Strates."))
    ]
  }
];

// src/core/classements.ts
var TABLEAUX = [
  {
    id: "profondeur",
    nom: t("Profondeur"),
    court: t("Strates"),
    ouvert: true,
    texte: t("L\u2019\xE9tage le plus profond creus\xE9 sous le district. \xC0 profondeur \xE9gale, le premier arriv\xE9 passe devant.")
  },
  {
    id: "registre",
    nom: t("Registre"),
    court: t("Cartes"),
    ouvert: true,
    texte: t("La valeur de ta collection : le m\xE9tal et le niveau de chaque carte, et chaque carte d\xE9couverte.")
  },
  {
    id: "joutes",
    nom: t("Joutes"),
    court: t("Duels"),
    ouvert: true,
    texte: t("Les duels gagn\xE9s au Cercle des quais contre des amis diff\xE9rents (trois par semaine au plus).")
  },
  {
    id: "fleche",
    nom: t("La Fl\xE8che"),
    court: t("Fl\xE8che"),
    ouvert: true,
    texte: t("Le plus haut quai atteint sur la Fl\xE8che d\u2019amarrage, la seule route l\xE9gale vers les Hauts. \xC0 quai \xE9gal, le premier arriv\xE9 passe devant.")
  }
];
var DELAI_PSEUDO = 7 * 864e5;
var PROFONDEUR_DELAI = 5 * 6e4;
var REGISTRE_DELAI = 4 * 6e4;
var FLECHE_DELAI = 5 * 6e4;

// src/core/partie/pillages.ts
var PILLAGE = {
  /** jetons de pillage : 5 au plus, un revient toutes les 4 h 48 (5 par jour) ; rien ne se perd pendant l'absence */
  jetonsMax: 5,
  rechargeMs: 24 * 36e5 / 5,
  /** un jeton de plus contre des cristaux (idée de Luc, 31 octobre 2026 ; prix fixe depuis le 9 novembre 2026), 2 fois par jour au plus */
  jetonCristaux: 30,
  achatsJour: 2,
  /** les pillages s'ouvrent après le gardien de −4 (12 novembre 2026 ; −3 depuis le 2 novembre 2026, Bryan : « par étapes douces » ; avant, dès −1) ;
   *  le Port et ses missions en mer, eux, ouvrent toujours après −1 (`strateDuPort`) */
  strateMin: 4,
  strateDuPort: 1,
  /** butin de base d'une victoire : autant que ce nombre de combats de la Strate du défenseur (butinCombat) */
  combats: 2,
  /** part du coffre du défenseur prise par une victoire, plafonnée à `plafondVol` combats de sa Strate */
  partVolee: 0.1,
  plafondVol: 5,
  /** part de son propre coffre que l'attaquant laisse au défenseur quand il perd */
  perteDefaite: 0.05,
  /** le défenseur : bouclier de 8 h après une attaque perdue, 3 attaques subies par jour au plus */
  bouclierMs: 8 * 36e5,
  subiesMax: 3,
  /**
   * La force des gardes : K × √(puissance des cartes × PV de la garnison). Réglé au robot (26 octobre 2026) :
   * le joueur moyen qui attaque sa propre garnison gagne une fois sur deux, du deck de départ aux cartes en or niveau 10
   * (K mesuré entre 0,0235 et 0,0263 selon le deck ; refait après la Fêlure du 26 octobre).
   */
  K: 0.0245,
  /**
   * Chances du joueur moyen selon l'écart de force (force des gardes / force de l'escouade) : très tranchées,
   * 98 % à 0,85, 82 % à 0,92, 50 % à 1, 18 % à 1,08, presque rien à 1,2 (mesuré au robot, courbe logistique)
   */
  pente: 0.055,
  /** le butin suit l'écart : ×0,4 contre bien plus faible, ×1 à égalité, ×2 contre plus fort ; le meilleur gain moyen est à égalité */
  multPente: 8,
  multMin: 0.4,
  multMax: 2,
  /** les cibles proposées : de 0,85 à 1,15 fois la force de l'escouade */
  ecartMin: 0.85,
  ecartMax: 1.15,
  /** archipels proposés sur la carte */
  cibles: 6
};
var NOMS_BOTS = ["Haut-Treuil", t("Cendrevigne"), t("Ancrefroide"), t("Verrelune"), t("Salvebrume"), "Pilier-Gris", t("Brisec\xF4te"), t("Les Pontons d\u2019Ambre"), "Lierre-Haut", t("Quai Sourd"), "Vasque-Morte", t("Givrecorde")];

// src/core/partie/fleche.ts
var ASCENSION = {
  /** la force des gardiens (même échelle que les garnisons des pillages) : du premier quai au dernier, une montée régulière
   *  (+0,8 % par quai). Repères mesurés : l'escouade de départ fait 3,3 ; 18 cartes en fer niveau 1 font 5,0 ; une escouade
   *  mi-parcours (cuivre et argent niveau 5, Porteurs niveau 8) 5,3 à 6 ; la meilleure (or niveau 10, Porteurs niveau 20) 8,4.
   *  Au pied 3,4 : juste au-dessus de l’escouade de départ ; celle qui arrive à la Flèche (après la Strate −6) y grimpe vite.
   *  Au sommet 8,8 : un peu au-dessus de la meilleure escouade, il faut aussi bien jouer. */
  // 12 novembre 2026 (révision complète, chantier 4, Bryan : « il doit rester du challenge dans la Flèche ») : sans la Charge et
  // avec le métal par tranche, l'escouade est plus forte (mesurée : 6,2 au jour 10, 7,3 au jour 20, 8,1 au jour 30, 8,5 au jour 45,
  // 9,0 au jour 60, 9,7 au jour 90 ; la meilleure possible, nacre niveau 5 et Porteurs niveau 20, vers 11,5). Avec l'ancienne
  // échelle (3,4 à 8,8), on arrivait au quai 64 dès le jour 10 et au sommet vers le jour 60. Au pied 5,5 : l'escouade qui sort
  // de −6. Au sommet 11,5 : la meilleure escouade, bien jouée.
  // 13 novembre 2026 (Bryan : « le joueur gratuit doit pouvoir finir la Flèche » ; la Perle rend la nacre rare) : à 11,5 personne
  // n'atteignait le sommet. À 10 (simulé, scripts/fond-fleche.ts) : sommet au jour 63 (assidu) et 129 (occasionnel) en gratuit,
  // 53 et 143 avec le pack Ossyra ; tout le monde y arrive.
  forcePied: 5.5,
  forceSommet: 10,
  /** les récompenses des quais gravés, une seule fois chacune */
  recompenses: {
    20: { composants: 150, eclats: 3 },
    40: { composants: 300, eclats: 5 },
    50: { composants: 400, eclats: 6 },
    60: { composants: 500, eclats: 7 },
    70: { composants: 650, eclats: 8 },
    75: { composants: 700, eclats: 9 },
    80: { composants: 800, eclats: 10 },
    85: { composants: 900, eclats: 11 },
    90: { composants: 1e3, eclats: 12 },
    95: { composants: 1200, eclats: 15 },
    101: { composants: 1500, eclats: 20 }
  },
  /** 10 novembre 2026 (Bryan : « vu le peu de nacre qu'on reçoit, le bon endroit pour en donner ») : chaque quai gravé donne
   *  aussi une carte au choix parmi trois, toutes de ce métal. Avant, la Flèche ne donnait aucune carte, et un joueur moyen
   *  trouvait une seule nacre en 100 jours (0,2 % des tirages, et seulement sous −10). Au sommet : 2 argent, 3 or, 6 nacre. */
  // 12 novembre 2026 : l'argent est devenu le métal courant de −7 à −10 ; les quais 20 et 40 donnent de l'or (avant : argent)
  cartes: { 20: "or", 40: "or", 50: "or", 60: "or", 70: "or", 75: "nacre", 80: "nacre", 85: "nacre", 90: "nacre", 95: "nacre", 101: "nacre" },
  /** tenir un quai : le gage par jour (composants = base + parQuai × quai ; Éclats à partir de certains quais) */
  // un Éclat par jour dès le quai 10 (audit du 7 novembre 2026 : avant le quai 40, la garde ne payait qu'en composants, sans valeur)
  gage: { base: 30, parQuai: 3, eclats: [{ des: 10, n: 1 }, { des: 40, n: 2 }, { des: 80, n: 3 }] },
  /** le gage s'accumule au plus une semaine dans la caisse du quai (audit du 7 novembre 2026 : avant deux jours) */
  caisseJours: 7,
  /** une défense tenue rapporte un quart de jour de gage */
  partDefense: 0.25
};
function etatFleche(j) {
  j.fleche ??= { quai: 1, record: 1, recordLe: 0, recus: [], victoires: 0, defaites: 0 };
  return j.fleche;
}
function carteDuQuai(j, q) {
  const metal = ASCENSION.cartes[q];
  const f = etatFleche(j);
  if (!metal || (f.cartes ??= []).includes(q)) return null;
  f.cartes.push(q);
  j.choix.push({ source: "fleche", options: tirerChoix(j, Math.max(10, j.strate), metal, void 0, porteursPresents(j), true) });
  return metal;
}
function rattraperCartesFleche(j) {
  if (!j.fleche) return;
  for (const q of j.fleche.recus) carteDuQuai(j, q);
}
var VOIX_DU_QUARTIER = [
  { qui: t("Une pompi\xE8re de la Nuit des lignes"), texte: t("Monter, c\u2019est bien, directeur. Mais l\u2019eau, elle, vient d\u2019en bas. L\u2019\xC9cluse, c\u2019est en dessous qu\u2019on la cherche.") },
  { qui: t("Le vieux Marek, au march\xE9"), texte: t("Les Hauts t\u2019ont ouvert leurs quais ? M\xE9fie-toi des cadeaux qui viennent d\u2019en haut. Les r\xE9ponses, on les a toujours creus\xE9es.") },
  { qui: t("Une m\xE8re de la rue des pompes"), texte: t("Mes enfants dorment au premier \xE9tage maintenant. Si tu trouves l\u2019\xC9cluse, dis-le-nous avant d\u2019aller saluer les \xEEles.") },
  { qui: t("Un creuseur du chantier"), texte: t("On a perc\xE9 la roche pour toi. Ne laisse pas nos galeries \xE0 moiti\xE9 faites pour aller faire le beau sur la Fl\xE8che.") },
  { qui: t("Ys\xE9, dans un mot gliss\xE9 sous ta porte"), texte: t("La Fl\xE8che ne partira pas. Le fond non plus. Mais c\u2019est lui qui sait ce que ceux d\u2019avant ont fait de leur eau.") },
  { qui: t("Un gamin du quai"), texte: t("Tu nous emm\xE8neras l\xE0-haut, dis ? Mais d\u2019abord tu arr\xEAtes la mer. Promis ?") }
];

// src/core/partie/nouvelle.ts
var DECISION_CHAMBRE = {
  titre: t("Qui garde la chambre ?"),
  texte: t("La Confluence est tomb\xE9e, et tout Vertiga parle de la chambre aux empreintes m\xEAl\xE9es. Les soldats de la capitaine Hald, les Brigades du Serment de Veyr, sont au pied de la Tour, les Veilleurs de S\xE9dime demandent \xE0 l\u2019\xE9tudier, et le quartier attend ta d\xE9cision."),
  options: [
    {
      id: "orseve",
      nom: t("La Maison Ors\xE8ve, des Hauts"),
      phrase: t("Nous n\u2019h\xE9ritons pas du pouvoir. Nous h\xE9ritons de la responsabilit\xE9 de le contenir."),
      effet: t("Les Brigades s\xE9curisent la chambre et ne te barrent plus la route dans les Strates. Les Hauts paient : +1 \xC9clat sur chaque gardien vaincu.")
    },
    {
      id: "district",
      nom: t("Le district seul"),
      phrase: t("Ce qui est sous notre digue est \xE0 nous."),
      effet: t("Le quartier se mobilise : +20 % de minerai \xE0 chaque exp\xE9dition. Mais les Brigades contestent, et tu les croiseras dans les salles closes.")
    },
    {
      id: "commission",
      nom: t("Une commission avec les Veilleurs"),
      phrase: t("Nous ne sommes pas les propri\xE9taires du pass\xE9. Nous sommes les prochains \xE0 pouvoir le perdre."),
      effet: t("Les Veilleurs partagent leurs fouilles : 25 % de chances de carte par combat au lieu de 20 %.")
    }
  ]
};
var DECISION_LECTURE = {
  titre: t("La derni\xE8re lecture"),
  texte: t("Sous les salles closes, les cristaux d\u2019un m\xEAme individu portent des souvenirs qui se contredisent. V\xE9la pense pouvoir lire jusqu\u2019au bout ce qu\u2019ils cachent. Elle sait que son lien avec son empreinte pourrait ne pas y survivre. Elle attend ton accord."),
  options: [
    {
      id: "autoriser",
      nom: t("Autoriser la lecture"),
      phrase: t("Une empreinte ne ment jamais. C\u2019est nous qui la lisons mal."),
      effet: t("V\xE9la gagne une carte unique, Lecture profonde (Fr\xE9quence libre, forte attaque), en plus de ses 6 cartes. Son lien s\u2019effiloche : \u22124 PV pour de bon.")
    },
    {
      id: "refuser",
      nom: t("Refuser, la prot\xE9ger"),
      phrase: t("On n\u2019entre pas deux fois chez quelqu\u2019un sans y \xEAtre invit\xE9."),
      effet: t("V\xE9la garde son empreinte intacte et reprend des forces : +4 PV pour de bon. Ce que cachent les cristaux attendra.")
    }
  ]
};
var DECISION_FIN = {
  titre: t("La v\xE9rit\xE9"),
  texte: t("Le Premier Porteur s\u2019est rassis, et son registre parle enfin. En haut, la mise en garde de ceux d\u2019avant : \xE0 force de se graver leurs anciens, ils n\u2019ont plus su quelle voix \xE9tait la leur. Dessous, sa r\xE9ponse : les voix ne les ont pas pris, elles les ont gard\xE9s. Ces m\xEAmes empreintes ont sauv\xE9 des villes apr\xE8s la Fonte, et les Berceaux qui les gardent endormies s\u2019usent. Il faut d\xE9cider de ce que Vertiga en fait."),
  options: [
    {
      id: "scellement",
      nom: t("Le Grand Scellement"),
      phrase: t("Certaines v\xE9rit\xE9s doivent rester enfouies."),
      effet: t("Les empreintes anciennes sont scell\xE9es \xE0 nouveau. Moins de risques : les ennemis perdent 10 % de leur force. Du savoir perdu : plus aucune carte en nacre ne tombe.")
    },
    {
      id: "pacte",
      nom: t("Le Pacte des empreintes"),
      phrase: t("Nous h\xE9ritons de la responsabilit\xE9 de les contenir, ensemble."),
      effet: t("Leur contr\xF4le est partag\xE9 entre les Hauts et les districts. Une paix fragile : +10 % de minerai. Une nouvelle bureaucratie : les chantiers durent 25 % plus longtemps.")
    },
    {
      id: "archives",
      nom: t("Les Archives ouvertes"),
      phrase: t("Une empreinte n\u2019est qu\u2019une donn\xE9e. Elle n\u2019a rien de sacr\xE9."),
      effet: t("Tout est r\xE9v\xE9l\xE9 et accessible \xE0 tous. Plus de libert\xE9 : deux fois plus de cartes en nacre. Des accidents de greffe : l\u2019Usure en plus d\u2019un Porteur \xE0 terre ou d\u2019une fuite augmente de moiti\xE9.")
    }
  ]
};
var contexteCampagne = (j) => ({ strate: j.strate, vaincue: strateVaincue(j), actes: j.actes, presents: porteursPresents(j), drapeaux: j.drapeaux ?? [], choixHaltes: j.choixHaltes ?? {} });
function estJeuValide(x2) {
  const j = x2;
  if (!(!!j && (j.version >= 2 && j.version <= VERSION_JEU) && typeof j.energie === "number" && !!j.batiments && !!j.porteurs)) return false;
  migrer(j);
  return true;
}
var RENOMMES = { "glande-amber": "glande-ambre" };
function migrer(j) {
  const ancien = j.chambre === void 0;
  j.chambre ??= ancien && j.strate > 1;
  j.recrues ??= ancien;
  j.arrives ??= [];
  j.actes ??= {};
  j.confiance ??= 0;
  if (j.xpV !== 2) {
    const ancienne = (n) => Math.round(12 * n ** 1.6);
    for (const d2 of Object.values(j.porteurs)) {
      if (!d2?.xp) continue;
      let reste = Math.floor(d2.xp), n = 1, xp = 0;
      while (n < XP.niveauMax && reste >= ancienne(n)) {
        reste -= ancienne(n);
        xp += xpPourNiveau(n);
        n++;
      }
      d2.xp = n >= XP.niveauMax ? xp : xp + Math.floor(reste / ancienne(n) * xpPourNiveau(n));
    }
    j.xpV = 2;
  }
  if (j.confianceV !== 2) {
    j.confiance = Math.min(600, 20 + Math.round(j.confiance * 0.8));
    j.confianceRecue = Math.max(j.confianceRecue ?? 0, palierHabitants(j.confiance));
    for (const f of ORDRE_FAMILLES.slice(0, j.confianceRecue)) if (!j.fragments.includes(f)) j.fragments.push(f);
    j.confianceV = 2;
  }
  j.confianceRecue ??= j.foyers ? niveauConfiance(nbFoyers(j)).niveau : palierHabitants(j.confiance);
  j.decouvertes ??= [];
  if (j.vecu) {
    for (const k of Object.keys(j.vecu)) if (!estCarteConnue(k)) delete j.vecu[k];
  }
  if (!j.scenes) {
    const c2 = contexteCampagne(j);
    let n = 0;
    while (n < SCENES.length && SCENES[n].quand(c2)) n++;
    j.scenes = j.chambre ? SCENES.slice(0, Math.max(0, n - 1)).map((s) => s.id) : [];
  }
  j.fils ??= {};
  for (const p of PORTEURS) j.porteurs[p.id] ??= { usure: 0, poste: null, modules: [] };
  j.objectif ??= ancien && j.strate > 1 ? OBJECTIFS.length : 0;
  j.fragments ??= [];
  j.lus ??= [];
  if (j.kitRecrues === void 0) {
    j.kitRecrues = false;
    if (j.recrues && j.collection) donnerKitRecrues(j);
  }
  j.ravitaillement ??= { jour: jourDe(j.dernierTick), reserve: 1, ouverts: 0 };
  j.missions ??= [];
  j.rapports ??= [];
  j.creuseurs ??= 0;
  j.frontVaincu ??= false;
  j.epreuves ??= { semaine: semaineDe(j.dernierTick), faites: [] };
  j.batiments.comptoir ??= 0;
  j.batiments.cercle ??= 0;
  j.comptoir ??= comptoirVide(j.dernierTick, j.rng ?? graine());
  accorderSeance(j);
  j.vus ??= { porteurs: porteursPresents(j), cartes: Object.keys(j.collection ?? {}) };
  j.escouade ??= ESCOUADE_DEPART.every((id) => porteursPresents(j).includes(id)) ? [...ESCOUADE_DEPART] : porteursPresents(j).slice(0, 3);
  j.escouadeActive ??= 0;
  j.escouades ??= [[...j.escouade], [], []];
  if (!j.luesRecompensees) {
    j.luesRecompensees = [];
    if (j.collection && j.rng !== void 0) for (const id of j.lus) recompenserLecture(j, id);
  }
  if (j.version === 2) {
    const now = j.dernierTick;
    j.version = 3;
    j.eclats = 0;
    j.collection = Object.fromEntries(COLLECTION_DEPART.map((id) => [id, { niveau: 1, doublons: 0 }]));
    for (const p of Object.values(j.porteurs)) {
      p.modules = p.modules.map((m) => RENOMMES[m] ?? m).filter((m) => MODULES.some((x2) => x2.id === m)).map((m) => carteId(m, moduleDef(m).rarete));
      for (const m of p.modules) {
        if (j.collection[m]) j.collection[m].doublons++;
        else j.collection[m] = { niveau: 1, doublons: 0 };
      }
    }
    if (j.forge) j.forge = { moduleId: RENOMMES[j.forge.moduleId] ?? j.forge.moduleId, debut: j.forge.debut, fin: j.forge.fin };
    j.sans = { argent: 0, or: 0, nacre: 0 };
    j.rng = graine();
    j.chantiers = [];
    j.choix = [];
    j.quotidien = { jour: jourDe(now), reserve: 1, type: typeDuJour(jourDe(now)), progres: 0 };
    j.archive = { semaine: semaineDe(now), points: 0, aOuvrir: 0 };
  }
  if (j.version === 3) {
    j.version = 4;
    const existe = (id) => MODULES.some((m) => m.id === moduleDe(id));
    const cle = (id) => id.includes("@") ? id : carteId(id, moduleDef(id).rarete);
    j.collection = Object.fromEntries(Object.entries(j.collection).filter(([id]) => existe(id)).map(([id, c2]) => [cle(id), c2]));
    for (const p of Object.values(j.porteurs)) p.modules = p.modules.filter(existe).map(cle);
    if (j.forge) j.forge = existe(j.forge.moduleId) ? { ...j.forge, moduleId: cle(j.forge.moduleId) } : null;
    j.choix = j.choix.map((c2) => ({ ...c2, options: c2.options.filter(existe).map(cle) })).filter((c2) => c2.options.length);
  }
  if (j.version === 4) {
    j.version = 5;
    delete j.fusions;
  }
  if (j.version === 5) {
    j.version = 6;
    for (const id of CARTES_DE_BASE) j.collection[carteId(id, "fer")] ??= { niveau: 1, doublons: 0 };
    const porte = new Set(Object.values(j.porteurs).flatMap((p) => p.modules));
    for (const [pid, depart] of Object.entries(DEPART_PORTEURS)) {
      const p = j.porteurs[pid];
      if (!p) continue;
      const base = depart.filter((id) => CARTES_DE_BASE.includes(id)).map((id) => carteId(id, "fer"));
      const premiere = carteId(depart[depart.length - 1], "fer");
      const greffes = p.modules.length || !j.collection[premiere] || porte.has(premiere) ? p.modules : [premiere];
      p.modules = [...greffes.slice(0, DISTRICT.cartesMax), ...base].slice(0, DISTRICT.cartesMax);
    }
    if (j.chambre && j.objectif <= 1) j.collection[CARTE_CHAMBRE] ??= { niveau: 1, doublons: 0 };
  }
  if (j.version === 6) {
    j.version = 7;
    if (j.objectif >= 3) j.objectif = OBJECTIFS.length;
  }
  if (j.version === 7) {
    j.version = 8;
    if (j.objectif >= 2) j.objectif = Math.min(OBJECTIFS.length, j.objectif + 1);
  }
  if (j.version === 8) {
    j.version = 9;
    familiesDesHabitants(j);
  }
  if (j.version === 9) {
    j.version = 10;
    j.energie = Math.floor(j.energie / 20);
    for (const s of j.seances ?? []) s.energie = Math.round(s.energie / 20);
    if (j.seance) j.seance.energie = Math.round(j.seance.energie / 20);
    const ancien2 = j;
    delete ancien2.conversion;
    delete ancien2.cristallisation;
  }
  if (j.version === 10) {
    j.version = 11;
    convertirNiveaux(j);
  }
  if (j.version === 11) {
    j.version = 12;
    originesDeMetal(j, "cuivre", "argent");
  }
  if (j.version === 12) {
    j.version = 13;
    originesDeMetal(j, "argent", "or");
  }
  if (j.version === 13) {
    j.version = 14;
    fusionnerExemplaires(j);
  }
  if (j.strate >= FOND.premiere) j.fond = true;
  allegerSelonCharge(j);
  rattraperCartesFleche(j);
  noterStrates(j.ravitaillement, j.strate);
  noterStrates(j.quotidien, j.strate);
  if (j.archive.aOuvrir && !j.archive.strates) j.archive.strates = [j.strate, ...(j.archive.enAttente ?? []).map(() => j.strate)];
}
function originesDeMetal(j, de, vers) {
  for (const m of MODULES.filter((x2) => x2.origine)) {
    const avant = carteId(m.id, de), apres = carteId(m.id, vers);
    const c2 = j.collection[avant];
    if (c2) {
      delete j.collection[avant];
      j.collection[apres] ??= c2;
    }
    for (const p of Object.values(j.porteurs)) p.modules = p.modules.map((k) => k === avant ? apres : k);
    if (j.vecu?.[avant]) {
      j.vecu[apres] ??= j.vecu[avant];
      delete j.vecu[avant];
    }
    if (j.vus?.cartes) j.vus.cartes = j.vus.cartes.map((k) => k === avant ? apres : k);
  }
}
var niveauSurTrois = (n) => n >= 4 ? 3 : n >= 2 ? 2 : 1;
function fusionnerExemplaires(j) {
  const parBase = /* @__PURE__ */ new Map();
  for (const k of Object.keys(j.collection)) {
    const m = moduleDef(k);
    if (m.legs || m.origine) continue;
    const b = moduleDe(k);
    parBase.set(b, [...parBase.get(b) ?? [], k]);
  }
  for (const cles of parBase.values()) {
    cles.sort((a, b) => RARETES.indexOf(moduleDef(b).rarete) - RARETES.indexOf(moduleDef(a).rarete));
    const haut = cles[0], metal = moduleDef(haut).rarete;
    const c2 = j.collection[haut];
    let niveau = niveauSurTrois(c2.niveau), doublons = c2.doublons;
    for (const k of cles.slice(1)) {
      const x2 = j.collection[k];
      niveau = Math.max(niveau, niveauSurTrois(x2.niveau));
      doublons += (1 + x2.doublons) * valeurCopie(moduleDef(k).rarete, metal);
      delete j.collection[k];
      const porteurHaut = Object.values(j.porteurs).find((p) => p?.modules.includes(haut));
      for (const p of Object.values(j.porteurs)) {
        if (!p?.modules.includes(k)) continue;
        p.modules = p.modules.filter((m) => m !== k);
        if (!Object.values(j.porteurs).some((q) => q?.modules.includes(haut)) && p !== porteurHaut) p.modules.push(haut);
      }
      if (j.vecu?.[k]) {
        if (!j.vecu[haut] || pointsVecu(j.vecu[k]) > pointsVecu(j.vecu[haut])) j.vecu[haut] = j.vecu[k];
        delete j.vecu[k];
      }
      if (j.vus?.cartes) j.vus.cartes = [...new Set(j.vus.cartes.map((v2) => v2 === k ? haut : v2))];
    }
    c2.niveau = niveau;
    c2.doublons = Math.round(doublons * 1e3) / 1e3;
  }
}
var ANCIEN_DEPART = { fer: 1, cuivre: 3, argent: 5, or: 7, nacre: 8 };
function nouveauNiveau(ancien, metal) {
  const d2 = ANCIEN_DEPART[metal] ?? 1;
  if (ancien <= d2) return 1;
  return Math.min(5, 1 + Math.round((ancien - d2) / (10 - d2) * 4));
}
function convertirNiveaux(j) {
  for (const [cle, c2] of Object.entries(j.collection)) {
    const metal = cle.split("@")[1] ?? "fer";
    c2.niveau = nouveauNiveau(c2.niveau, metal);
  }
}
var palierHabitants = (h) => Math.min(8, Math.floor(Math.min(600, Math.max(0, h)) / 75));
function familiesDesHabitants(j) {
  if (j.foyers) return;
  const h = Math.min(600, Math.max(0, j.confiance ?? 0));
  const n = Math.min(FAMILLES_DISTRICT.length, Math.floor(h / 12.5));
  const apportees = j.fragments.map((f) => familleDuFragment(f)?.id).filter((x2) => !!x2);
  const basses = SECTEURS.flatMap((s) => s.lieux.map((l) => l.famille));
  const ordre = [.../* @__PURE__ */ new Set([
    ...FAMILLES_DEPART.map((f) => f.id),
    ...apportees,
    ...FAMILLES_DISTRICT.filter((f) => f.arrivee === "quartier").map((f) => f.id),
    ...basses
  ])];
  j.foyers = ordre.slice(0, Math.max(n, FAMILLES_DEPART.length + apportees.length));
  const faits = SECTEURS.flatMap((s) => s.lieux).filter((l) => j.foyers.includes(l.famille)).map((l) => l.id);
  if (faits.length) j.basses = { batardeau: null, semaine: -1, vu: -1, depots: 0, expedition: null, faits };
  j.confiance = n >= FAMILLES_DISTRICT.length ? 0 : Math.round((h - n * 12.5) * 1.2);
  j.confianceRecue = Math.max(j.confianceRecue ?? 0, 0);
  if (j.lignes) j.lignes = { semaine: j.lignes.semaine, familles: [], sources: {}, ...j.lignes.derniere ? { derniere: j.lignes.derniere } : {} };
}
function allegerSelonCharge(j) {
  if (!j.collection) return;
  for (const id of Object.keys(j.porteurs)) {
    if (!PORTEURS.some((p) => p.id === id) || enExpedition(j, id)) continue;
    const d2 = j.porteurs[id];
    const rendues = [];
    while (d2.modules.length && chargePortee(j, id) > chargeMax(j, id)) {
      const exces = chargePortee(j, id) - chargeMax(j, id);
      const tri = d2.modules.slice().sort((a, b) => poidsCarte(a) - poidsCarte(b));
      const lourde = tri.find((k) => poidsCarte(k) >= exces) ?? tri[tri.length - 1];
      d2.modules = d2.modules.filter((k) => k !== lourde);
      rendues.push(moduleDef(lourde).nom);
    }
    if (rendues.length) log(j, t`${porteurDef(id).nom} portait des cartes trop lourdes ou d’un métal trop haut pour son niveau, et rend ${rendues.join(", ")} à la collection.`);
  }
}

// src/core/partie/gardien.ts
var GARDIEN_VILLE = {
  /** il remplace les Épreuves de la semaine, au même endroit : ouvert après −3 */
  ouverture: 3,
  /** tentatives : une de plus chaque jour (4 h du matin), jamais plus de 3 en réserve */
  parJour: 1,
  reserve: 3,
  /** un combat de 12 tours au plus */
  tours: 12,
  /** ses PV : ceux du gardien de la Strate du joueur, multipliés (personne ne l'abat seul) */
  pvFacteur: 40,
  /** 1 part = les PV d'un gardien de sa Strate, abattus en ce nombre de tours, ramenés aux 12 tours du combat.
   *  10 : un joueur moyen fait environ 1 part par frappe à −3, 1,3 à −10 (scripts/gardien-ville.ts, 13 novembre 2026) */
  toursReference: 10,
  /** une tentative ne compte jamais plus de 3 parts (un deck très au-dessus de sa Strate ne fait pas tout seul la semaine) */
  partsMax: 3,
  /** les PV de la ville (serveur) : 4 parts par joueur actif la semaine d'avant, jamais moins de 40 */
  partsParJoueur: 4,
  pvVilleMin: 40,
  /** les paliers de la ville, en part de ses PV */
  paliers: [0.25, 0.5, 0.75, 1, 1.5],
  /** la Perle de nacre (13 novembre 2026) : toutes les deux semaines, après −10, quand la ville abat le Gardien ; ratée, elle attend le suivant */
  perle: { strate: 10, toutesLes: 2 }
};
var REGLES_SEMAINE = ["echo", "courants", "brouillard", "chant", "inondee", "sanctuaire", "eboulis"];
function gardienDeLaSemaine(semaine) {
  const bosses = ZONES.map((z) => z.boss);
  const ennemi = bosses[(semaine % bosses.length + bosses.length) % bosses.length];
  const condition = REGLES_SEMAINE[(semaine % REGLES_SEMAINE.length + REGLES_SEMAINE.length) % REGLES_SEMAINE.length];
  return { ennemi, condition, nom: t`L’écho ${ennemiDef(ennemi).nom.replace(/^L[ae] /, (m) => m.toLowerCase())}` };
}
function combatGardien(d2) {
  const s = creerCombat({
    porteurs: d2.porteurs.map((p) => ({ ...p })),
    deck: d2.deck.map((g) => ({ ...g })),
    ennemiId: d2.ennemi,
    rng: d2.rng,
    force: d2.force,
    condition: d2.condition,
    troisiemePhase: false,
    ...d2.bonus && Object.keys(d2.bonus).length ? { bonus: d2.bonus } : {}
  });
  for (const en of tousEnnemis(s)) {
    en.pvMax *= GARDIEN_VILLE.pvFacteur;
    en.pv = en.pvMax;
    en.sansTraits = true;
  }
  return s;
}
function pvReference(d2) {
  const s = creerCombat({ porteurs: [{ id: "doran", pv: 1, pvMax: 1, aTerre: false }], ennemiId: d2.ennemi, rng: 1, force: d2.force, condition: d2.condition });
  return s.ennemi.pvMax;
}
var degatsInfliges = (s) => tousEnnemis(s).reduce((n, en) => n + Math.max(0, en.pvMax - en.pv), 0);
function partsDe(d2, degats) {
  const ref = pvReference(d2) * GARDIEN_VILLE.tours / GARDIEN_VILLE.toursReference;
  return Math.min(GARDIEN_VILLE.partsMax, Math.round(degats / Math.max(1, ref) * 10) / 10);
}
var combatGardienFini = (s) => s.issue !== "en-cours" || s.tour > GARDIEN_VILLE.tours;
function rejouerGardien(d2, journal) {
  const s = combatGardien(d2);
  for (const a of journal) {
    if (combatGardienFini(s)) return { ok: false, message: "Action apr\xE8s la fin du combat." };
    const r = appliquer2(s, a);
    if (r === false) return { ok: false, message: `Action refus\xE9e : ${a[0]}.` };
  }
  const degats = degatsInfliges(s);
  return { ok: true, degats, parts: partsDe(d2, degats), tours: Math.min(s.tour, GARDIEN_VILLE.tours) };
}
function appliquer2(s, a) {
  const ok = (r) => !r || r.ok;
  switch (a[0]) {
    case "ajouter":
      return ok(ajouter(s, a[1]));
    case "retirer":
      return ok(retirer(s, a[1]));
    case "accorder":
      return ok(accorder(s, a[1], a[2]));
    case "proteger":
      return ok(proteger(s, a[1]));
    case "soignerVers":
      return ok(soignerVers(s, a[1]));
    case "cibler":
      return ok(cibler(s, a[1], a[2]));
    case "viser":
      return ok(viser(s, a[1]));
    case "deplacer":
      return ok(deplacer(s, a[1], a[2]));
    case "allonger":
      return ok(allonger(s));
    case "repiocher":
      return ok(repiocher(s));
    case "relancerMain":
      return ok(relancerMain(s));
    case "viderChaine":
      viderChaine(s);
      return true;
    case "eclater":
      if (!eclatsPossibles(s).some((e) => e.porteur === a[1])) return false;
      eclater(s, a[1], { silencieux: true });
      return true;
    case "lancer":
      if (!s.chaine.length) return false;
      lancer(s, { silencieux: true });
      return true;
    default:
      return false;
  }
}
function bornesDepart(j, escouade) {
  if (escouade.length !== 3 || new Set(escouade).size !== 3 || escouade.some((id) => !j.porteurs[id])) return null;
  const deck = deckEscouade(j, escouade, indiceEscouade(j, escouade), "courte");
  const pvMax = {};
  for (const id of escouade) pvMax[id] = pvNiveau(j, id) + bonusPv(j, id);
  return { deck, pvMax };
}
function departValide(j, d2, semaine) {
  const b = bornesDepart(j, d2.escouade);
  if (!b) return "Escouade inconnue.";
  if (d2.porteurs.length !== 3 || d2.porteurs.some((p, k) => p.id !== d2.escouade[k] || p.pvMax > (b.pvMax[p.id] ?? 0) || p.pv > p.pvMax)) return "Porteurs impossibles.";
  const sem = gardienDeLaSemaine(semaine);
  if (d2.ennemi !== sem.ennemi || d2.condition !== sem.condition) return "Ce n\u2019est pas le Gardien de cette semaine.";
  if (d2.force > forceStrate(Math.max(1, strateVaincue(j))) + 1e-9) return "Force du Gardien impossible.";
  const dispo = /* @__PURE__ */ new Map();
  for (const g of b.deck) dispo.set(`${g.porteur}|${g.id}`, [...dispo.get(`${g.porteur}|${g.id}`) ?? [], g.v]);
  for (const g of d2.deck) {
    if (g.vide) continue;
    const l = dispo.get(`${g.porteur}|${g.id}`);
    const k = l?.findIndex((v2) => g.v <= v2) ?? -1;
    if (!l || k < 0) return `Carte impossible : ${g.id}.`;
    l.splice(k, 1);
  }
  return null;
}

// src/serveur/gardien.ts
function lirePartie(texte) {
  if (typeof texte !== "string" || texte.length > 9e5) return null;
  try {
    const j = JSON.parse(texte);
    return estJeuValide(j) ? j : null;
  } catch {
    return null;
  }
}
var frappesPermises = (now) => {
  const lundi = semaineDe(now) * 7;
  return jourDe(now) - lundi + GARDIEN_VILLE.reserve;
};
function compterFrappes(partie, frappes, fiche, now) {
  const semaine = semaineDe(now);
  const f = fiche ? { ...fiche, vues: [...fiche.vues] } : { parts: 0, frappes: 0, meilleure: 0, vues: [] };
  const refus2 = [];
  let ajout = 0;
  let acceptees = 0;
  const liste = Array.isArray(frappes) ? frappes.slice(0, 6) : [];
  for (const x2 of liste) {
    if (!x2 || typeof x2 !== "object" || !x2.depart || !Array.isArray(x2.journal)) {
      refus2.push("Frappe illisible.");
      continue;
    }
    if (x2.semaine !== semaine) {
      refus2.push("Frappe d\u2019une autre semaine.");
      continue;
    }
    if (typeof x2.le !== "number" || x2.le < debutJour(semaine * 7) || x2.le > now + 6e4) {
      refus2.push("Heure impossible.");
      continue;
    }
    if (x2.journal.length > 400) {
      refus2.push("Combat trop long.");
      continue;
    }
    const cle = `${x2.depart.rng}:${x2.le}`;
    if (f.vues.includes(cle)) continue;
    if (f.frappes >= frappesPermises(now)) {
      refus2.push("Plus de frappes que de tentatives.");
      continue;
    }
    const pb = departValide(partie, x2.depart, semaine);
    if (pb) {
      refus2.push(pb);
      continue;
    }
    const r = rejouerGardien(x2.depart, x2.journal);
    if (!r.ok) {
      refus2.push(r.message);
      continue;
    }
    f.vues.push(cle);
    f.frappes++;
    f.parts = Math.round((f.parts + r.parts) * 10) / 10;
    f.meilleure = Math.max(f.meilleure, r.parts);
    ajout += r.parts;
    acceptees++;
  }
  return { fiche: f, ajout: Math.round(ajout * 10) / 10, acceptees, refus: refus2, strate: strateVaincue(partie) };
}
var pvVille = (frappeursAvant) => Math.max(GARDIEN_VILLE.pvVilleMin, GARDIEN_VILLE.partsParJoueur * Math.max(0, frappeursAvant));
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  compterFrappes,
  frappesPermises,
  lirePartie,
  pvVille,
  semaineDe
});
