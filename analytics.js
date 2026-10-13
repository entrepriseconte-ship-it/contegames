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

  const send = (type) => {
    const body = JSON.stringify({p: location.pathname, t: type, r: document.referrer, u: utm});
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
    if (host === 'apps.apple.com') send('store_ios');
    else if (host === 'play.google.com' && url.pathname.startsWith('/store/apps/')) send('store_android');
  }, {capture: true, passive: true});
})();
