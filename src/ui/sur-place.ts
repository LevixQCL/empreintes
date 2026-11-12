// La mise à jour sur place (12 novembre 2026).
// Bryan trouvait que les animations du combat faisaient « bricolage ». La mesure l'a montré : l'écran était reconstruit
// en entier à chaque étape d'une chaîne (14 fois en 3,8 s pour 3 cartes), et chaque reconstruction coupait net les animations
// en cours (le recul de l'ennemi, la poussée de l'écran, la réaction du Porteur touché : 19 animations sur 39).
// Ici, on compare l'écran affiché au nouvel écran et on ne change que ce qui diffère : un élément qui existe toujours
// reste le même élément, avec ses animations en cours. L'écran obtenu est exactement celui qu'aurait donné innerHTML.

/** les calques posés par les effets dans l'écran (onde de verre, dissolution) : la mise à jour ne les voit pas */
const GARDES = ['calque-verre', 'ennemi-dissolution'];
const garde = (n: Node) => n.nodeType === 1 && GARDES.some((c) => (n as Element).classList.contains(c));

/** ce qui dit qu'un élément est « le même » d'un rendu à l'autre : une carte (uid), un Porteur, un ennemi, un repère posé exprès */
function cle(e: Element): string {
  return e.id || e.getAttribute('data-uid') || e.getAttribute('data-cle') || e.getAttribute('data-porteur') || e.getAttribute('data-id') || '';
}
const nature = (e: Element) => e.classList[0] ?? '';

function pareil(a: Node, b: Node): boolean {
  if (a.nodeType !== b.nodeType) return false;
  if (a.nodeType !== 1) return true;
  const ea = a as Element, eb = b as Element;
  if (ea.tagName !== eb.tagName) return false;
  const ka = cle(ea), kb = cle(eb);
  // une carte change de classe en tête (« en-jeu », « jouee ») : sa clé suffit ; sans clé, la première classe sert de repère
  return ka || kb ? ka === kb : nature(ea) === nature(eb);
}

/** rend `ancien` identique à `neuf`, sans le remplacer */
function fondre(ancien: Node, neuf: Node): void {
  if (ancien.nodeType !== 1) {
    if (ancien.nodeValue !== neuf.nodeValue) ancien.nodeValue = neuf.nodeValue;
    return;
  }
  const a = ancien as Element, b = neuf as Element;
  if (a.isEqualNode(b)) return;
  for (const { name, value } of [...b.attributes]) if (a.getAttribute(name) !== value) a.setAttribute(name, value);
  for (const { name } of [...a.attributes]) if (!b.hasAttribute(name)) a.removeAttribute(name);
  mettreAJour(a, b);
}

/** Met les enfants de `parent` dans l'état de ceux de `neuf` (qui est vidé au passage) */
export function mettreAJour(parent: Element, neuf: Element | DocumentFragment): void {
  // les clés attendues plus loin : un ancien élément qui la porte n'est pas jeté, il sera déplacé à sa place
  const attendues = new Set<string>();
  for (let n = neuf.firstChild; n; n = n.nextSibling) if (n.nodeType === 1 && cle(n as Element)) attendues.add(`${(n as Element).tagName}|${cle(n as Element)}`);
  let o: ChildNode | null = parent.firstChild;
  for (let n = neuf.firstChild; n;) {
    const suivant = n.nextSibling;
    let m: ChildNode | null = null;
    for (let c = o; c; c = c.nextSibling) if (!garde(c) && pareil(c, n)) { m = c; break; }
    if (!m) parent.insertBefore(n, o);
    else {
      // les anciens placés avant lui : jetés, sauf ceux qui resserviront ; les calques des effets restent où ils sont
      let premier: ChildNode | null = null;
      for (let c = o; c && c !== m;) {
        const s: ChildNode | null = c.nextSibling;
        if (!garde(c)) {
          const sert = c.nodeType === 1 && !!cle(c as Element) && attendues.has(`${(c as Element).tagName}|${cle(c as Element)}`);
          if (sert) premier ??= c; else c.remove();
        }
        c = s;
      }
      if (premier) parent.insertBefore(m, premier);
      fondre(m, n);
      o = m.nextSibling;
    }
    n = suivant;
  }
  while (o) { const s: ChildNode | null = o.nextSibling; if (!garde(o)) o.remove(); o = s; }
}
