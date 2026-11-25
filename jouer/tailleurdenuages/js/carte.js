/* Le Tailleur de Nuages - cartes : 2 cartes du ciel de 6 regions chacune, puis l'ecran d'une region avec ses 20 niveaux. */
(function () {
  var TN = window.TN, $ = TN.$, stage = TN.stage, NB = TN.PAR_REGION = 20;
  var vieux = document.getElementById('map'); if (vieux) vieux.remove();
  /* nom, carte (0 ou 1), position du bouton sur la carte en % */
  var REG = [['m1', 0, 27, 80], ['m2', 0, 73, 68], ['m3', 0, 27, 47], ['m4', 0, 73, 34], ['m5', 0, 28, 20], ['m6', 0, 70, 10],
    ['m7', 1, 52, 86], ['m8', 1, 33, 77], ['m9', 1, 66, 64], ['m10', 1, 40, 50], ['m11', 1, 64, 36], ['m12', 1, 50, 15]];
  var COFFRE = 40, GAIN = 100, page = 0;
  var el = $('<div class="screen" id="map"><div class="img"><img id="cImg"><div id="cReg"></div></div><div id="cNiv"></div>' +
    '<div class="nuagem" style="top:30%;animation-duration:38s"></div><div class="nuagem" style="top:58%;animation-duration:52s;animation-delay:-20s"></div>' +
    '<div class="tete"><button class="rond" id="cBack">' + TN.ic.back + '</button><h1 class="t" id="cTitre"></h1><div class="chip" id="cStars"></div><div class="chip" id="cCoins"></div></div>' +
    '<button class="rond" id="cPrec">' + TN.ic.back + '</button><button class="rond" id="cSuiv" style="transform:scaleX(-1)">' + TN.ic.back + '</button><div class="banniere"></div></div>');
  stage.appendChild(el);
  function q(s) { return el.querySelector(s); }
  function debut(r) { return (r - 1) * NB + 1; }
  function etoiles(r) { var n = 0; for (var i = debut(r); i < debut(r) + NB; i++) n += TN.S.stars[i] || 0; return n; }
  function premier() { for (var i = 0; i < TN.levels.length; i++) if (!TN.S.stars[TN.levels[i].id]) return TN.levels[i].id; return 0; }
  function taille() { var mw = Math.max(390, TN.H * 1000 / 1792), im = q('.img'); im.style.setProperty('--mw', mw + 'px'); im.style.setProperty('--mh', (mw * 1.792) + 'px'); im.style.setProperty('--up', Math.max(0, Math.min(26, (mw * 1.792 - TN.H) / 2)) + 'px'); }
  TN.resizers.push(taille);

  function monde() {
    el.classList.remove('vueregion'); taille();
    var cur = premier(), box = q('#cReg'); box.innerHTML = '';
    q('#cImg').src = page ? 'img/carte2.jpg' : 'img/carte.jpg';
    q('#cTitre').textContent = TN.t('carteTitre') + ' ' + (page + 1) + '/2';
    q('#cPrec').style.display = page ? '' : 'none'; q('#cSuiv').style.display = page ? 'none' : '';
    REG.forEach(function (R, i) {
      if (R[1] !== page) return;
      var r = i + 1, ouvert = TN.playable(debut(r)) && TN.unlocked(debut(r)), s = etoiles(r), fini = s && !!TN.S.stars[debut(r) + NB - 1];
      var ici = cur && Math.ceil(cur / NB) === r;
      var b = $('<button class="regionb t' + (ouvert ? '' : ' ferme') + (fini ? ' fini' : '') + (ici ? ' actuel' : '') + '" style="left:' + R[2] + '%;top:' + R[3] + '%"></button>');
      b.innerHTML = '<span></span><small>' + (ouvert ? '&#9733; ' + s + '/' + (NB * 3) : TN.ic.lock) + '</small>'; b.querySelector('span').textContent = TN.t(R[0]);
      b.onclick = function () { TN.sfx.clic(); if (!ouvert) return TN.toast(TN.t('ferme', debut(r) - 1)); TN.mapRegion = r; dessine(); };
      box.appendChild(b);
    });
  }
  function region(r) {
    el.classList.add('vueregion');
    var box = q('#cNiv'), cur = premier(), s = etoiles(r); box.innerHTML = ''; box.style.backgroundImage = 'url(img/fond' + r + '.jpg)';
    q('#cTitre').textContent = TN.t(REG[r - 1][0]);
    var X = [17, 39, 61, 83];
    for (var i = 0; i < NB; i++) (function (i) {
      var id = debut(r) + i, row = Math.floor(i / 4), col = i % 4; if (row % 2) col = 3 - col;
      var x = X[col], y = 81 - row * 13.5, jouable = TN.playable(id), ouvert = jouable && TN.unlocked(id), st = TN.S.stars[id] || 0;
      var b = $('<button class="noeud t' + (ouvert ? '' : ' ferme') + (id === cur ? ' actuel' : '') + '" style="left:' + x + '%;top:' + y + '%"></button>');
      b.innerHTML = ouvert ? id + (st ? '<span class="et">' + [1, 2, 3].map(function (k) { return '<img src="img/etoile' + (k <= st ? '' : '_grise') + '.png">'; }).join('') + '</span>' : '') : '<span class="cad">' + TN.ic.lock + '</span>';
      b.onclick = function () { TN.sfx.clic(); if (!jouable) return TN.toast(TN.t('bientot')); if (!ouvert) return TN.toast(TN.t('ferme', id - 1)); TN.startLevel(id); };
      box.appendChild(b);
      if (id === cur) box.appendChild($('<img class="heros" src="img/perso_idle.png" style="left:' + x + '%;top:' + y + '%">'));
    })(i);
    /* coffre de la region */
    var cle = 'r' + r, pris = TN.S.chests[cle], pret = !pris && s >= COFFRE;
    var c = $('<button class="coffrem' + (pris ? ' ouvert' : pret ? ' pret' : '') + '" style="left:50%;top:14%;width:56px;height:56px;margin:-28px 0 0 -28px">' + (pris ? '' : '<span>' + Math.min(s, COFFRE) + '/' + COFFRE + ' &#9733;</span>') + '</button>');
    c.onclick = function () {
      if (pris) return; if (!pret) { TN.sfx.refus(); return TN.toast(TN.t('coffreIl', COFFRE - s)); }
      TN.S.chests[cle] = 1; TN.coins(GAIN); TN.sfx.coffre();
      var v = TN.popup('<h2>' + TN.t('coffreT') + '</h2><img src="img/coffre_ouvert.png" style="width:130px"><div><span class="gain"><img src="img/piece.png"><span id="gn">+' + GAIN + '</span></span></div><div class="col"><button class="pil o" id="d">' + TN.t('gDouble') + '</button><button class="pil v" id="k">' + TN.t('ok') + '</button></div>', { noClose: true, onClose: dessine });
      v.querySelector('#d').onclick = function () { var bt = this; TN.ads.recompense(function () { TN.coins(GAIN); v.querySelector('#gn').textContent = '+' + (GAIN * 2); bt.remove(); }); };
      v.querySelector('#k').onclick = function () { TN.sfx.clic(); v.close(); };
    };
    box.appendChild(c);
  }
  function dessine() {
    q('#cStars').innerHTML = '<img src="img/etoile.png">' + TN.totalStars();
    q('#cCoins').innerHTML = '<img src="img/piece.png">' + TN.S.coins;
    if (TN.mapRegion) { page = REG[TN.mapRegion - 1][1]; region(TN.mapRegion); } else monde();
    TN.ads.banniere(el);
    musique();
  }
  /* chaque monde a sa musique : celle du monde ouvert, ou sur la carte du ciel celle du monde ou se trouve le tailleur */
  function musique() {
    var r = TN.mapRegion;
    if (!r) { var c = premier(), ici = c ? Math.ceil(c / NB) : REG.length; r = REG[ici - 1][1] === page ? ici : (page ? 7 : 1); }
    TN.music.scene('monde', r);
  }
  q('#cBack').onclick = function () { TN.sfx.clic(); if (TN.mapRegion) { TN.mapRegion = 0; dessine(); } else TN.show('home'); };
  q('#cPrec').onclick = function () { TN.sfx.clic(); page = 0; dessine(); };
  q('#cSuiv').onclick = function () { TN.sfx.clic(); page = 1; dessine(); };
  TN.screens.map = { el: el, enter: function () { dessine(); } };
  TN.carteMonde = function () { TN.mapRegion = 0; var c = premier(); page = c ? REG[Math.ceil(c / NB) - 1][1] : 0; TN.show('map'); };
  /* le bouton Carte de l'accueil ouvre la carte du ciel */
  var hm = document.querySelector('#hMap'); if (hm) hm.onclick = function () { TN.sfx.clic(); TN.carteMonde(); };
})();
