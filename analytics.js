/* Compteur de visites de contegames.com, sans cookies et sans données personnelles :
   on envoie seulement la page vue, la source (TikTok, Facebook…) et les clics vers l'App Store / Google Play.
   Aucun identifiant de visiteur n'est créé ni stocké, donc aucune fenêtre de consentement n'est nécessaire. */
(() => {
  'use strict';
  const ENDPOINT = 'https://contegames-stats.mieuxchaquejour.workers.dev/hit';

  const params = new URLSearchParams(location.search);
  const utm = params.get('utm_source')
    || (params.has('ttclid') ? 'tiktok' : '')
    || (params.has('fbclid') ? 'facebook' : '')
    || (params.has('gclid') ? 'google' : '');

  const send = (type, jeu) => {
    // Pour un clic vers un store, on ajoute le jeu cliqué après le chemin de la page (ex. « /@id6817739082 »).
    const body = JSON.stringify({p: location.pathname + (jeu ? '@' + jeu : ''), t: type, r: document.referrer, u: utm});
    try {
      if (navigator.sendBeacon && navigator.sendBeacon(ENDPOINT, new Blob([body], {type: 'text/plain'}))) return;
    } catch { /* on tente fetch */ }
    fetch(ENDPOINT, {method: 'POST', body, keepalive: true, headers: {'Content-Type': 'text/plain'}}).catch(() => {});
  };

  send('vue');

  document.addEventListener('click', (event) => {
    const anchor = event.target.closest?.('a[href]');
    if (!anchor) return;
    let url;
    try { url = new URL(anchor.href, location.href); } catch { return; }
    const host = url.hostname.toLowerCase();
    if (host === 'apps.apple.com') send('store_ios', (url.pathname.match(/id\d+/) || [''])[0]);
    else if (host === 'play.google.com' && url.pathname.startsWith('/store/apps/')) send('store_android', (url.searchParams.get('id') || '').slice(0, 60));
  }, {capture: true, passive: true});
})();


/* Charge la suggestion de langue/région sur toutes les pages qui utilisent analytics.js. */
(() => {
  'use strict';
  if (document.querySelector('script[data-cg-language-suggest]')) return;
  const script = document.createElement('script');
  script.src = '/language-suggest.js?v=1';
  script.defer = true;
  script.dataset.cgLanguageSuggest = '1';
  document.head.appendChild(script);
})();

/* Marque le système du téléphone (os-ios / os-android) : sur l'accueil, le jeu vedette ne garde alors
   que le bouton de la boutique de ce téléphone. Rien n'est envoyé ni stocké. */
(() => {
  'use strict';
  const ua = navigator.userAgent || '';
  const ios = /iPhone|iPad|iPod/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1);
  if (ios) document.documentElement.classList.add('os-ios');
  else if (/Android/.test(ua)) document.documentElement.classList.add('os-android');
})();
