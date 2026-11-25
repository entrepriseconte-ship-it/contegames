/* Version navigateur (contegames.com) : pas de pub mobile ni d'écran de pub factice ; les bonus sont offerts. */
(function () {
  var TN = window.TN; if (!TN || !TN.ads) return;
  TN.ads.entreNiveaux = function (cb) { cb(); };
  TN.ads.recompense = function (cb) { cb(); };
  TN.ads.banniere = function (scr) { var b = scr.querySelector('.banniere'); if (b) { b.classList.remove('on'); b.innerHTML = ''; } };
})();
/* Pas de pub mobile dans le navigateur : la question d'âge (réservée aux pubs de l'appli) n'est pas posée. */
(function () {
  var TN = window.TN;
  function regler() { if (TN.S && TN.S.age === null) TN.S.age = 16; }
  regler(); setTimeout(regler, 0);
})();
/* Si la fenêtre d'âge est déjà ouverte, on la valide (16 ans ou plus = aucune différence sans pub). */
(function () {
  var n = 0, t = setInterval(function () {
    var b = document.querySelector('[data-a="16"]');
    if (b) { b.click(); clearInterval(t); } else if (++n > 100) clearInterval(t);
  }, 150);
})();
