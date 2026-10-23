// « Installer le jeu » (23 octobre 2026), comme dans Ma ZP : un bouton sur l'écran titre pour ceux qui ne connaissent pas
// le menu « Ajouter à l'écran d'accueil ». Sur Android/Chrome, il ouvre directement la fenêtre d'installation du navigateur ;
// sur iPhone (aucune fenêtre possible), il montre les deux gestes à faire. Il disparaît une fois le jeu installé.

interface InvitationInstall extends Event { prompt(): Promise<void>; userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }> }

let invitation: InvitationInstall | null = null;
let installe = false;
let surChangement: () => void = () => {};

const autonome = () => window.matchMedia('(display-mode: standalone)').matches || (navigator as { standalone?: boolean }).standalone === true;
export const estIOS = () => /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
const mobile = () => estIOS() || /android/i.test(navigator.userAgent);

export function initInstallation(rafraichir: () => void) {
  surChangement = rafraichir;
  if ('serviceWorker' in navigator) navigator.serviceWorker.register('./sw.js').catch(() => {});
  window.addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); invitation = e as InvitationInstall; surChangement(); });
  window.addEventListener('appinstalled', () => { installe = true; invitation = null; surChangement(); });
}

/** le bouton a-t-il un sens ici ? (pas déjà installé, et le navigateur sait installer ou c'est un téléphone) */
export const peutInstaller = () => !installe && !autonome() && (!!invitation || mobile());

export async function installer() {
  if (invitation) {
    const i = invitation;
    invitation = null;
    await i.prompt();
    const { outcome } = await i.userChoice;
    if (outcome === 'accepted') installe = true;
    surChangement();
    return;
  }
  montrerConsignes();
}

function montrerConsignes() {
  document.getElementById('consignes-install')?.remove();
  const ios = estIOS();
  const el = document.createElement('div');
  el.id = 'consignes-install';
  el.setAttribute('role', 'dialog');
  el.setAttribute('aria-label', 'Installer EMPREINTES');
  const partager = '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3v12M8 7l4-4 4 4"/><path d="M6 11v9h12v-9"/></svg>';
  el.innerHTML = `<div class="ci-carte"><img src="./icon-192.png" alt="" width="64" height="64"><h2>Installer EMPREINTES</h2>`
    + `<p>Le jeu s'ouvrira depuis ton écran d'accueil, en plein écran, comme une application.</p><ol>`
    + (ios
      ? `<li>Touche ${partager} <b>Partager</b>, en bas de Safari.</li><li>Choisis <b>« Sur l'écran d'accueil »</b>, puis <b>Ajouter</b>.</li>`
      : `<li>Touche <b>⋮</b>, en haut à droite du navigateur.</li><li>Choisis <b>« Ajouter à l'écran d'accueil »</b> ou <b>« Installer l'application »</b>.</li>`)
    + `</ol><button type="button" class="prim">Compris</button></div>`;
  el.addEventListener('click', (e) => { if (e.target === el || (e.target as HTMLElement).closest('button')) el.remove(); });
  document.body.appendChild(el);
}
