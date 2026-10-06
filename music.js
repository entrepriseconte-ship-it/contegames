(() => {
  'use strict';

  const audio = document.getElementById('site-music');
  const button = document.querySelector('.music-control');
  if (!audio || !button) return;

  const KEY = 'cg-music';
  const VOLUME = 0.7;
  let wanted = true;
  try { wanted = localStorage.getItem(KEY) !== 'off'; } catch (e) { /* stockage indisponible */ }
  let fadeTimer = 0;

  function show(playing) {
    button.setAttribute('aria-pressed', String(playing));
    button.setAttribute('aria-label', playing ? 'Couper la musique' : 'Lancer la musique');
    button.title = playing ? 'Couper la musique' : 'Lancer la musique';
    button.classList.toggle('is-playing', playing);
  }

  function fadeTo(target, done) {
    clearInterval(fadeTimer);
    fadeTimer = setInterval(() => {
      const step = target > audio.volume ? 0.03 : -0.05;
      const next = audio.volume + step;
      if ((step > 0 && next >= target) || (step < 0 && next <= target)) {
        audio.volume = target;
        clearInterval(fadeTimer);
        if (done) done();
      } else {
        audio.volume = next;
      }
    }, 60);
  }

  function start() {
    if (!audio.paused) return Promise.resolve(true);
    audio.volume = 0;
    return audio.play().then(() => { show(true); fadeTo(VOLUME); return true; }, () => false);
  }

  function stop() {
    show(false);
    fadeTo(0, () => audio.pause());
  }

  function remember(on) {
    wanted = on;
    try { localStorage.setItem(KEY, on ? 'on' : 'off'); } catch (e) { /* stockage indisponible */ }
  }

  // Les navigateurs bloquent le son avant toute action du visiteur :
  // on essaie tout de suite, sinon la musique démarre au premier geste.
  const gestures = ['pointerdown', 'keydown', 'touchend'];
  function onFirstGesture(event) {
    if (event.target.closest && event.target.closest('.music-control')) return;
    start().then((ok) => { if (ok) gestures.forEach((g) => removeEventListener(g, onFirstGesture, true)); });
  }

  show(false);
  if (wanted) {
    start().then((ok) => {
      if (!ok) gestures.forEach((g) => addEventListener(g, onFirstGesture, true));
    });
  }

  button.addEventListener('click', () => {
    if (audio.paused || button.getAttribute('aria-pressed') === 'false') {
      remember(true);
      start();
    } else {
      remember(false);
      stop();
    }
  });

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) { if (!audio.paused) audio.pause(); }
    else if (wanted && button.getAttribute('aria-pressed') === 'true') audio.play().catch(() => show(false));
  });
})();
