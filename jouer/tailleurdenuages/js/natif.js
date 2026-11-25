/* Le Tailleur de Nuages - pont avec l'appli iPhone / Android (vraies publicites AdMob).
   Sur PC ce fichier ne fait rien : le jeu garde ses ecrans "Publicite de test".
   Dans l'appli : le jeu envoie des messages (age, banniere, interstitiel, recompense) et l'appli repond par TNPub.fin(). */
(function () {
  var TN = window.TN, A = window.TNNatif, I = window.webkit && window.webkit.messageHandlers && window.webkit.messageHandlers.tn;
  if (!A && !I) return;
  TN.natif = A ? 'android' : 'ios';
  function env(o) { try { if (A) A.message(JSON.stringify(o)); else I.postMessage(o); } catch (e) { } }
  var attente = null, enPub = false;
  /* appele par l'appli : quand elle passe en arriere-plan ou qu'une pub plein ecran s'ouvre, la musique se tait */
  window.TNveille = function (on) { if (on) TN.music.stop(); else if (!enPub && TN.S.music && TN.S.age !== null) TN.music.start(); };
  window.TNPub = {
    /* type : 'recompense' ou 'interstitiel' ; ok : recompense gagnee ; absente : aucune pub n'etait prete */
    fin: function (type, ok, absente) { var f = attente; attente = null; enPub = false; window.TNveille(false); if (f) f(!!ok, !!absente); }
  };
  TN.ads.recompense = function (cb) {
    if (attente) return;
    enPub = true; TN.music.stop();
    attente = function (ok, absente) { if (ok) cb(); else if (absente) TN.toast(TN.t('pubNon')); };
    env({ a: 'recompense' });
  };
  /* interstitiel : memes regles que sur PC (jamais avant 10 victoires, au plus 1 niveau sur 3, 3 minutes d'ecart) */
  TN.ads.entreNiveaux = function (cb) {
    var P = TN.PUBS, now = Date.now();
    if (attente || TN.S.wins < P.pasAvantVictoires || TN.S.sinceInter < P.unNiveauSur || now - TN.S.lastInter < P.ecartMinutes * 60000) return cb();
    enPub = true; TN.music.stop();
    attente = function (ok, absente) { if (!absente) { TN.S.sinceInter = 0; TN.S.lastInter = Date.now(); TN.save(); } cb(); };
    env({ a: 'interstitiel' });
  };
  /* banniere : seulement sur l'accueil et la carte, jamais pendant le jeu */
  TN.ads.banniere = function (scr) { var b = scr.querySelector('.banniere'); if (b) b.classList.remove('on'); env({ a: 'banniere', on: TN.S.age !== null }); };
  var montre = TN.show;
  TN.show = function (nom) { montre.apply(TN, arguments); if (nom !== 'home' && nom !== 'map') env({ a: 'banniere', on: false }); };
  /* l'age choisi au premier lancement regle les pubs (enfants : pubs adaptees, non personnalisees) */
  var ageDit = -1;
  setInterval(function () { if (TN.S && TN.S.age !== null && TN.S.age !== ageDit) { ageDit = TN.S.age; env({ a: 'age', age: ageDit }); } }, 400);
  /* bouton Retour d'Android : ferme la fenetre ouverte, sinon revient a l'ecran precedent ; false = quitter */
  window.TNretour = function () {
    if (enPub) return true;
    var v = document.querySelectorAll('.voile');
    if (v.length) { var x = v[v.length - 1].querySelector('.x'); if (x) x.click(); return true; }
    if (TN.current === 'map') { document.querySelector('#cBack').click(); return true; }
    if (TN.current === 'play') { TN.show('map'); return true; }
    return false;
  };
})();
