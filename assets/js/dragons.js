/* Dragons du héros : chaque dragon est une image peinte qui traverse le ciel
   en ondulant, avec un léger battement d'ailes. Aucun script externe. */
(function () {
  var ciel = document.querySelector('.ciel');
  if (!ciel) return;
  var bouton = document.querySelector('.pause-animation');
  var reduit = window.matchMedia('(prefers-reduced-motion: reduce)');
  var dragons = Array.prototype.slice.call(ciel.querySelectorAll('.dragon'));
  var enPause = reduit.matches;
  var debut = performance.now();
  var decalage = 0;

  // Trajectoires : départ / arrivée en % du ciel, durée en s, amplitude de l'ondulation.
  var vols = dragons.map(function (el) {
    return {
      el: el,
      x0: +el.dataset.x0, x1: +el.dataset.x1,
      y: +el.dataset.y, amp: +el.dataset.amp,
      duree: +el.dataset.duree, phase: +el.dataset.phase,
      taille: +el.dataset.taille, sens: el.dataset.sens === 'g' ? -1 : 1
    };
  });

  function place(t) {
    var w = ciel.clientWidth, h = ciel.clientHeight;
    vols.forEach(function (v) {
      var p = ((t / v.duree) + v.phase) % 1;
      var x = (v.x0 + (v.x1 - v.x0) * p) / 100 * w;
      var y = (v.y / 100) * h + Math.sin(p * Math.PI * 4) * v.amp * h / 100;
      var aile = 1 + Math.sin(t * 5.2 + v.phase * 9) * 0.06;
      var pente = Math.cos(p * Math.PI * 4) * 6 * v.sens;
      v.el.style.transform = 'translate(' + x.toFixed(1) + 'px,' + y.toFixed(1) + 'px) rotate(' + pente.toFixed(2) + 'deg) scale(' + (v.sens * v.taille).toFixed(3) + ',' + (v.taille * aile).toFixed(3) + ')';
      // Fondu à l'entrée et à la sortie de l'écran.
      v.el.style.opacity = Math.min(1, p * 8, (1 - p) * 8).toFixed(2);
    });
  }

  function image(maintenant) {
    if (!enPause) place((maintenant - debut) / 1000 + decalage);
    requestAnimationFrame(image);
  }

  function majBouton() {
    if (!bouton) return;
    bouton.setAttribute('aria-pressed', enPause ? 'true' : 'false');
    bouton.textContent = enPause ? 'Relancer l’animation' : 'Mettre l’animation en pause';
  }

  if (bouton) bouton.addEventListener('click', function () {
    if (enPause) { debut = performance.now(); } else { decalage += (performance.now() - debut) / 1000; }
    enPause = !enPause;
    majBouton();
  });

  place(3);
  majBouton();
  requestAnimationFrame(image);
})();
