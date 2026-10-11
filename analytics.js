/* Google Analytics 4: event instrument for outbound game-store clicks.
   This does not load GA4, store cookies or send requests on its own.
   First create/authorize a dedicated contegames.com GA4 property and
   install its tag with a compliant consent flow. */
(() => {
  'use strict';
  document.addEventListener('click', (event) => {
    const anchor = event.target.closest?.('a[href]');
    if (!anchor) return;
    let url;
    try { url = new URL(anchor.href, location.href); } catch { return; }
    const host = url.hostname.toLowerCase();
    const store = host === 'apps.apple.com'
      ? 'app_store'
      : host === 'play.google.com' && url.pathname.startsWith('/store/apps/')
        ? 'google_play' : null;
    if (!store) return;
    // A tag, when installed and consented, supplies gtag itself.
    // Never block normal link navigation or redirect visitors.
    if (typeof window.gtag !== 'function') return;
    const segments = location.pathname.split('/').filter(Boolean);
    const game = ['cocoboum', 'royaumedesmotscroises', 'mieuxchaquejour', 'tableauxensorceles']
      .find(name => segments.includes(name)) || 'catalogue';
    window.gtag('event', 'select_content', {
      content_type: 'game_store_click',
      item_id: game,
      store_name: store,
      link_url: url.origin + url.pathname
    });
  }, {capture: true, passive: true});
})();
