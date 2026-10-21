// Hasard déterministe (mulberry32). L'état tient dans un nombre sauvegardé avec le combat :
// le même état de départ donne toujours la même partie, ce qui permettra au serveur de vérifier un combat.

export function graine(): number {
  return (Math.random() * 2 ** 32) >>> 0;
}

/** Renvoie [valeur dans [0,1), nouvel état] */
export function suivant(etat: number): [number, number] {
  const s = (etat + 0x6d2b79f5) >>> 0;
  let t = s;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return [((t ^ (t >>> 14)) >>> 0) / 4294967296, s];
}

/** Petit objet pratique qui avance l'état stocké dans `porteur.rng` */
export function tireur(porteur: { rng: number }) {
  return {
    nombre(): number {
      const [v, s] = suivant(porteur.rng);
      porteur.rng = s;
      return v;
    },
    entier(max: number): number {
      return Math.floor(this.nombre() * max);
    },
    melanger<T>(a: T[]): T[] {
      const r = a.slice();
      for (let i = r.length - 1; i > 0; i--) {
        const j = this.entier(i + 1);
        const tmp = r[i] as T;
        r[i] = r[j] as T;
        r[j] = tmp;
      }
      return r;
    },
  };
}
