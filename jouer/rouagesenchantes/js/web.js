/* Version navigateur (contegames.com) : pas de pub mobile ni d'écran de pub factice ; les bonus sont offerts. */
(function () {
  var A = window.RE && window.RE.ads; if (!A) return;
  A.interstitial = function (done) { done(); };
  A.rewarded = function (done) { done(true); };
})();
