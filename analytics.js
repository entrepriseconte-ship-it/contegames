/* Mesure d'audience Google Analytics 4 (G-ED5GMDZHF8), chargée uniquement
   après accord du visiteur (RGPD). Choix mémorisé 6 mois dans le navigateur.
   Compte aussi les clics vers l'App Store / Google Play. */
(() => {
  'use strict';
  const GA_ID = 'G-ED5GMDZHF8';
  const KEY = 'cg-analytics-consent';
  const MAX_AGE = 1000 * 60 * 60 * 24 * 182;

  const readChoice = () => {
    try {
      const saved = JSON.parse(localStorage.getItem(KEY) || 'null');
      if (saved && Date.now() - saved.t < MAX_AGE) return saved.v;
    } catch { /* stockage indisponible : on redemande */ }
    return null;
  };
  const saveChoice = (v) => {
    try { localStorage.setItem(KEY, JSON.stringify({v, t: Date.now()})); } catch { /* ignoré */ }
  };

  const loadAnalytics = () => {
    if (window.gtag) return;
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { window.dataLayer.push(arguments); };
    window.gtag('js', new Date());
    window.gtag('config', GA_ID, {anonymize_ip: true});
    const s = document.createElement('script');
    s.async = true;
    s.src = 'https://www.googletagmanager.com/gtag/js?id=' + GA_ID;
    document.head.appendChild(s);
  };

  const fr = (document.documentElement.lang || '').toLowerCase().startsWith('fr');
  const text = fr
    ? {msg: 'Nous mesurons l’audience du site (Google Analytics) pour savoir quels jeux vous intéressent. Acceptez-vous ?', yes: 'Accepter', no: 'Refuser'}
    : {msg: 'We measure site traffic (Google Analytics) to learn which games you like. Do you accept?', yes: 'Accept', no: 'Decline'};

  const showBanner = () => {
    const bar = document.createElement('div');
    bar.setAttribute('role', 'dialog');
    bar.setAttribute('aria-label', 'Cookies');
    bar.style.cssText = 'position:fixed;left:12px;right:12px;bottom:12px;z-index:9999;max-width:640px;margin:0 auto;padding:14px 16px;border-radius:12px;background:#2b1b0e;color:#fff6e0;font:15px/1.4 system-ui,sans-serif;box-shadow:0 6px 24px rgba(0,0,0,.35);display:flex;flex-wrap:wrap;gap:10px;align-items:center';
    const p = document.createElement('p');
    p.style.cssText = 'margin:0;flex:1 1 260px';
    p.textContent = text.msg;
    const mk = (label, primary) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.textContent = label;
      b.style.cssText = 'cursor:pointer;border:0;border-radius:8px;padding:8px 14px;font:600 14px system-ui,sans-serif;' +
        (primary ? 'background:#f2b632;color:#2b1b0e' : 'background:transparent;color:#fff6e0;outline:1px solid #fff6e0');
      return b;
    };
    const no = mk(text.no, false);
    const yes = mk(text.yes, true);
    no.addEventListener('click', () => { saveChoice('denied'); bar.remove(); });
    yes.addEventListener('click', () => { saveChoice('granted'); bar.remove(); loadAnalytics(); });
    bar.append(p, no, yes);
    document.body.appendChild(bar);
  };

  const choice = readChoice();
  if (choice === 'granted') loadAnalytics();
  else if (choice === null) showBanner();

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
