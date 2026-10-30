// Fuir un combat (décision du 22 octobre 2026) : reculer d'une salle ou remonter au district.
// Dans les deux cas l'attaque annoncée par l'ennemi touche pendant la fuite ; personne ne meurt.
import { describe, expect, it } from 'vitest';
import { coupDeFuite } from '../src/core/combat';
import { accessibles, peutFuir, peutReculer, salleCourante } from '../src/core/expedition';
import { entrer, fuir, fuirSalle, nouveauJeu, ouvrirChambre, partir, remonter, DISTRICT } from '../src/core/jeu';

const pret = () => { const j = nouveauJeu(0, 1); j.chambre = true; j.recrues = true; return j; };
/** une expédition dans la Strate −1, dans le premier combat */
function enCombat() {
  const j = pret();
  partir(j, ['ilka', 'doran', 'vela'], 1, 5);
  const salle = accessibles(j.expedition!)[0]!;
  entrer(j, salle.id);
  return { j, salle };
}
/** force l'attaque annoncée : 10 dégâts sur Véla */
function attaque(j: ReturnType<typeof pret>, v = 10, cibleId = 'vela') {
  j.expedition!.combat.intention = { type: 'atk', nom: 'Rayon', v, cibleId };
  j.expedition!.combat.ennemi.boost = 1;
  j.expedition!.combat.bouclier = 0;
}

describe('Le dernier coup', () => {
  it('l’attaque annoncée touche, le bouclier protège encore, et un Porteur peut finir à terre sans plus', () => {
    const { j } = enCombat();
    const s = j.expedition!.combat;
    attaque(j, 10);
    const avant = s.porteurs.find((p) => p.id === 'vela')!.pv;
    const r = coupDeFuite(s);
    const net = r.coups[0]!.net;
    expect(net).toBeGreaterThan(0);
    expect(r.porteurs.find((p) => p.id === 'vela')!.pv).toBe(Math.max(0, avant - net));
    expect(s.porteurs.find((p) => p.id === 'vela')!.pv).toBe(avant); // l'état du combat n'est pas touché
    s.bouclier = 100;
    expect(coupDeFuite(s).coups[0]!.net).toBe(0);
    s.bouclier = 0;
    attaque(j, 999);
    const fin = coupDeFuite(s).porteurs.find((p) => p.id === 'vela')!;
    expect(fin.pv).toBe(0);
    expect(fin.aTerre).toBe(true);
  });

  it('sans attaque annoncée, on s’échappe sans un coup', () => {
    const { j } = enCombat();
    j.expedition!.combat.intention = { type: 'bouclier', v: 8 };
    expect(coupDeFuite(j.expedition!.combat).coups).toEqual([]);
  });
});

describe('Reculer d’une salle', () => {
  it('l’escouade revient à la salle d’avant, blessée ; l’ennemi garde sa salle, qu’on peut reprendre', () => {
    const { j, salle } = enCombat();
    attaque(j, 10);
    const pvAvant = j.expedition!.combat.porteurs.find((p) => p.id === 'vela')!.pv;
    expect(peutReculer(j.expedition!)).toBe(true);
    expect(fuirSalle(j).ok).toBe(true);
    const x = j.expedition!;
    expect(x.phase).toBe('carte');
    expect(salleCourante(x).type).toBe('entree');
    expect(x.carte!.salles[salle.id]!.faite).toBe(false);
    expect(x.porteurs.find((p) => p.id === 'vela')!.pv).toBeLessThan(pvAvant);
    expect(x.sequence).toEqual([]);
    expect(x.recit).toMatch(/Véla encaisse Rayon/);
    // la salle est de nouveau accessible : un combat neuf
    expect(accessibles(x).some((s) => s.id === salle.id)).toBe(true);
    expect(entrer(j, salle.id).ok).toBe(true);
    expect(j.expedition!.phase).toBe('combat');
    expect(j.expedition!.combat.ennemi.pv).toBe(j.expedition!.combat.ennemi.pvMax);
  });

  it('impossible si le dernier coup mettait toute l’escouade à terre : il faut remonter', () => {
    const { j } = enCombat();
    j.expedition!.combat.intention = { type: 'atk', nom: 'Balayage', v: 999, zone: true };
    expect(peutReculer(j.expedition!)).toBe(false);
    expect(fuirSalle(j).ok).toBe(false);
    expect(fuir(j).ok).toBe(true);
  });
});

describe('Remonter en fuyant', () => {
  it('on garde 75 % des composants, les cartes trouvées, et chacun rentre plus fatigué', () => {
    const { j } = enCombat();
    attaque(j, 10);
    j.expedition!.butin = 40;
    j.expedition!.gains = { elites: 0, cartes: 1, eclats: 0, fragment: false };
    const usure = j.porteurs.ilka!.usure;
    const cartes = Object.keys(j.collection).length;
    expect(fuir(j).ok).toBe(true);
    const p = j.expedition!.combat.porteurs.find((q) => q.id === 'ilka')!;
    const perdus = p.pvMax - Math.max(0, p.pv);
    const r = remonter(j);
    expect(r.fuite).toBe(true);
    expect(r.victoire).toBe(false);
    expect(r.butin).toBe(Math.floor(40 * DISTRICT.butinFuite));
    expect(j.porteurs.ilka!.usure).toBe(usure + perdus + DISTRICT.usureFuite + (p.pv <= 0 ? DISTRICT.usureATerre : 0));
    expect(Object.keys(j.collection).length).toBeGreaterThanOrEqual(cartes); // la carte trouvée en route est gardée
    expect(j.expedition).toBeNull();
  });

  it('pas de fuite dans la chambre scellée, ni hors combat', () => {
    const j = nouveauJeu(0, 1);
    ouvrirChambre(j, 7);
    expect(peutFuir(j.expedition!)).toBe(false);
    expect(fuir(j).ok).toBe(false);
    const k = pret();
    partir(k, ['ilka', 'doran', 'vela'], 1, 5);
    expect(fuir(k).ok).toBe(false); // sur la carte
  });
});
