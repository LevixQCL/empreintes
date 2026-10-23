// Sortir du navigateur intégré de Messenger, Facebook, Instagram… (23 octobre 2026).
// Ces navigateurs ne sont pas faits pour un jeu (sauvegarde, plein écran, son). Sur Android, on rouvre la page dans
// Chrome ; sur iPhone, Apple ne le permet pas automatiquement : on explique comment faire, avec un bouton Safari
// (iOS récents) et un bouton pour copier le lien. « Continuer ici quand même » reste toujours possible.
(function () {
  var ua = navigator.userAgent || '';
  var integre = /FBAN|FBAV|FB_IAB|FBIOS|FB4A|Messenger|Instagram|MicroMessenger|Snapchat|Line\//i.test(ua);
  try { if (sessionStorage.getItem('empreintes-rester') === '1') return; } catch (e) {}
  if (!integre) return;
  var url = location.href;
  var android = /Android/i.test(ua);
  var ios = /iPhone|iPad|iPod/i.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1);

  if (android) {
    // ouvre Chrome ; si Chrome manque, le navigateur par défaut prend le relais
    location.href = 'intent://' + url.replace(/^https?:\/\//, '') + '#Intent;scheme=https;package=com.android.chrome;S.browser_fallback_url=' + encodeURIComponent(url) + ';end';
  }

  function afficher() {
    var appli = /Instagram/i.test(ua) ? 'Instagram' : /Messenger/i.test(ua) ? 'Messenger' : /FBAN|FBAV|FB_IAB|FBIOS|FB4A/i.test(ua) ? 'Facebook' : 'cette application';
    var geste = ios ? 'Touche <b>⋯</b> en haut à droite, puis <b>Ouvrir dans le navigateur</b> (ou <b>Ouvrir dans Safari</b>).'
      : 'Touche <b>⋮</b> en haut à droite, puis <b>Ouvrir dans Chrome</b> (ou <b>Ouvrir dans le navigateur</b>).';
    var d = document.createElement('div');
    d.id = 'sortir-appli';
    d.setAttribute('role', 'dialog');
    d.setAttribute('aria-modal', 'true');
    d.innerHTML = '<div class="sa-boite">'
      + '<img src="./apple-touch-icon.png" alt="" width="72" height="72">'
      + '<h1>EMPREINTES</h1>'
      + '<p class="sa-intro">Le navigateur de ' + appli + ' ne fait pas bien tourner le jeu : ta partie pourrait ne pas être sauvegardée.</p>'
      + '<p class="sa-geste">' + geste + '</p>'
      + (ios ? '<a class="sa-btn sa-prim" href="x-safari-' + url + '">Ouvrir dans Safari</a>' : '<a class="sa-btn sa-prim" href="' + url + '" target="_blank" rel="noopener">Ouvrir dans le navigateur</a>')
      + '<button type="button" class="sa-btn" id="sa-copier">Copier le lien</button>'
      + '<button type="button" class="sa-lien" id="sa-rester">Continuer ici quand même</button>'
      + '</div>';
    var s = document.createElement('style');
    s.textContent = '#sortir-appli{position:fixed;inset:0;z-index:2147483647;display:grid;place-items:center;padding:24px 16px;background:radial-gradient(120% 80% at 50% 0%,#1E2433,#0B0D12 70%);color:#E9EEF5;font:16px/1.5 system-ui,-apple-system,"Segoe UI",sans-serif;text-align:center}'
      + '#sortir-appli .sa-boite{display:grid;gap:14px;justify-items:center;max-width:360px}'
      + '#sortir-appli img{border-radius:16px;box-shadow:0 0 0 1px rgba(232,194,90,.4),0 10px 30px rgba(0,0,0,.5)}'
      + '#sortir-appli h1{margin:0;font:400 28px "Marcellus SC",Georgia,serif;letter-spacing:.12em;color:#F6F2EA}'
      + '#sortir-appli p{margin:0;color:#C9D6E6}#sortir-appli .sa-geste{padding:12px 14px;border-radius:8px;background:rgba(255,255,255,.06);box-shadow:inset 0 0 0 1px rgba(255,255,255,.1)}'
      + '#sortir-appli b{color:#E8C25A}'
      + '#sortir-appli .sa-btn{display:block;width:100%;box-sizing:border-box;padding:14px;border-radius:8px;border:1px solid rgba(232,194,90,.5);background:transparent;color:#F6F2EA;font:600 16px system-ui,sans-serif;text-decoration:none;cursor:pointer}'
      + '#sortir-appli .sa-prim{background:linear-gradient(180deg,#E8C25A,#B8912F);color:#16120A;border-color:transparent}'
      + '#sortir-appli .sa-lien{background:none;border:0;color:#8E9BAD;font:14px system-ui,sans-serif;text-decoration:underline;cursor:pointer;padding:6px}';
    document.head.appendChild(s);
    document.body.appendChild(d);
    document.getElementById('sa-copier').onclick = function () {
      var b = this;
      var fini = function () { b.textContent = 'Lien copié : colle-le dans ton navigateur'; };
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(url).then(fini, function () { window.prompt('Copie ce lien :', url); });
      else window.prompt('Copie ce lien :', url);
    };
    document.getElementById('sa-rester').onclick = function () {
      try { sessionStorage.setItem('empreintes-rester', '1'); } catch (e) {}
      d.remove(); s.remove();
    };
  }
  if (document.body) afficher(); else document.addEventListener('DOMContentLoaded', afficher);
})();
