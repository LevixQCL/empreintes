// Plein écran pendant l'intro et les Récits des origines (Bryan, 14 novembre 2026 : « pour plus d'immersion »).
// Seulement sur écran tactile : sur PC, le lecteur occupe déjà toute la fenêtre. Le navigateur exige un toucher du joueur
// pour entrer : on le demande donc depuis l'action qui ouvre le film. iPhone ne le permet pas : rien ne se passe, le jeu continue.

let parNous = false;

export function pleinEcran(oui: boolean): void {
  const doc = document as Document & { webkitExitFullscreen?: () => void; webkitFullscreenElement?: Element | null };
  const el = document.documentElement as HTMLElement & { webkitRequestFullscreen?: () => void };
  try {
    if (oui) {
      if (!matchMedia('(pointer: coarse)').matches || document.fullscreenElement || doc.webkitFullscreenElement) return;
      if (el.requestFullscreen) { el.requestFullscreen({ navigationUI: 'hide' }).then(() => { parNous = true; }, () => {}); }
      else if (el.webkitRequestFullscreen) { el.webkitRequestFullscreen(); parNous = true; }
    } else if (parNous) {
      parNous = false;
      if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
      else if (doc.webkitFullscreenElement) doc.webkitExitFullscreen?.();
    }
  } catch { /* pas de plein écran sur cet appareil */ }
}
