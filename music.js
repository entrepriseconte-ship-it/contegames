(() => {
  'use strict';

  const audio = document.getElementById('site-music');
  if (!audio) return;

  const VOLUME = 0.7;
  let fadeTimer = 0;

  function fadeIn() {
    clearInterval(fadeTimer);
    fadeTimer = setInterval(() => {
      audio.volume = Math.min(VOLUME, audio.volume + 0.04);
      if (audio.volume >= VOLUME) clearInterval(fadeTimer);
    }, 60);
  }

  function start() {
    if (!audio.paused) return Promise.resolve(true);
    audio.volume = 0;
    return audio.play().then(() => { fadeIn(); return true; }, () => false);
  }

  // Les navigateurs bloquent le son avant toute action du visiteur :
  // on essaie tout de suite, sinon la musique démarre au premier geste.
  const gestures = ['pointerdown', 'click', 'touchstart', 'touchend', 'keydown', 'wheel', 'scroll'];
  function onGesture() {
    start().then((ok) => { if (ok) gestures.forEach((g) => removeEventListener(g, onGesture, true)); });
  }

  start().then((ok) => {
    if (!ok) gestures.forEach((g) => addEventListener(g, onGesture, { capture: true, passive: true }));
  });

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) audio.pause();
    else if (audio.currentTime > 0) audio.play().catch(() => {});
  });
})();
