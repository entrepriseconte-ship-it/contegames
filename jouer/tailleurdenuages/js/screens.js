/* Le Tailleur de Nuages - ecrans : intro du studio, age, accueil, carte, collection, parametres. */
(function () {
  var TN = window.TN, $ = TN.$, stage = TN.stage;
  var SITE = 'https://contegames.com/', CONFID = 'https://contegames.com/tailleurdenuages/confidentialite.html';

  /* ---------- accueil ---------- */
  var home = $('<div class="screen" id="home"><img class="fill" src="img/accueil.jpg"><div class="haut"><button class="chip" id="hLang"></button><div class="droite"><button class="chip mus" id="hMus">' + TN.ic.note + '</button><div class="chip" id="hCoins"></div></div></div>' +
    '<img class="logo" src="img/logo.png"><button class="plaque or t jouer" id="hPlay"></button>' +
    '<div class="trio"><button class="plaque cr" id="hMap"></button><button class="plaque cr" id="hCol"></button><button class="plaque cr" id="hSet"></button></div>' +
    '<button class="pil v autres" id="hAutres"></button><div class="banniere"></div></div>');
  stage.appendChild(home);
  function firstLevel() { for (var i = 0; i < TN.levels.length; i++) if (!TN.S.stars[TN.levels[i].id]) return TN.levels[i].id; return 0; }
  function homeTexts() {
    var l = TN.S.lang, nm = ''; TN.LANGS.forEach(function (L) { if (L[0] === l) nm = L[1]; });
    home.querySelector('#hLang').innerHTML = TN.flag(l) + nm;
    home.querySelector('#hCoins').innerHTML = '<img src="img/piece.png">' + TN.S.coins;
    var f = firstLevel();
    home.querySelector('#hPlay').innerHTML = '<span>' + TN.t('jouer') + '</span>' + (f ? '<small>' + TN.t('niveau', f) + '</small>' : '');
    home.querySelector('#hMap').innerHTML = TN.ic.map + '<span class="ajuste">' + TN.t('carte') + '</span>';
    home.querySelector('#hCol').innerHTML = TN.ic.book + '<span class="ajuste">' + TN.t('collection') + '</span>';
    home.querySelector('#hSet').innerHTML = TN.ic.gear + '<span class="ajuste">' + TN.t('parametres') + '</span>';
    home.querySelector('#hAutres').textContent = TN.t('autres');
    home.querySelectorAll('.trio .ajuste').forEach(function (s) { TN.shrink(s, 92); });
    TN.ads.banniere(home);
  }
  home.querySelector('#hPlay').onclick = function () { TN.sfx.clic(); var f = firstLevel(); if (f) TN.startLevel(f); else TN.show('map'); };
  home.querySelector('#hMap').onclick = function () { TN.sfx.clic(); TN.show('map'); };
  home.querySelector('#hCol').onclick = function () { TN.sfx.clic(); collection(); };
  home.querySelector('#hSet').onclick = function () { TN.sfx.clic(); settings(); };
  home.querySelector('#hLang').onclick = function () { TN.sfx.clic(); langues(); };
  home.querySelector('#hAutres').onclick = function () { TN.sfx.clic(); window.open(SITE, '_blank'); };
  /* playlist discrete (directive du chef du 24/11) : la liste des musiques du jeu, un toucher = on l'ecoute */
  home.querySelector('#hMus').onclick = function () { TN.sfx.clic(); playlist(); };
  function playlist() {
    var v = TN.popup('<h2>' + TN.t('musique') + '</h2><div class="pistes"></div>');
    var box = v.querySelector('.pistes');
    function dessine() {
      box.innerHTML = '';
      TN.PISTES.forEach(function (p, i) {
        var b = $('<button' + (TN.music.index() === i && TN.S.music ? ' class="on"' : '') + '></button>');
        b.textContent = '♪ ' + p[1];
        b.onclick = function () { TN.music.choisir(i); dessine(); };
        box.appendChild(b);
      });
    }
    dessine();
  }
  TN.screens.home = { el: home, enter: function () { homeTexts(); TN.music.scene('accueil'); } };

  /* ---------- carte : 18 niveaux sur 6 regions ---------- */
  var NODES = [[16, 89.5], [28, 87], [42, 85], [56, 82.5], [69, 79.5], [62, 75.5], [47, 72.5], [37, 68.5], [50, 66.5], [60, 62], [33, 53], [46, 47], [60, 43], [63, 37], [52, 33], [40, 28], [47, 23.5], [52, 19.5]];
  var REG = [['m1', 24, 79.5, 1, 5, 1], ['m2', 76, 70, 6, 10, 1], ['m3', 24, 44, 11, 12], ['m4', 76, 31, 13, 14], ['m5', 26, 17, 15, 16], ['m6', 74, 12, 17, 18]];
  var CHESTS = [[80, 87, 8, 60], [27, 62, 20, 90], [74, 49, 34, 120], [72, 21.5, 48, 200]];
  var map = $('<div class="screen" id="map"><div class="img"><img src="img/carte.jpg"><div id="mNodes"></div></div>' +
    '<div class="nuagem" style="top:30%;animation-duration:38s"></div><div class="nuagem" style="top:58%;animation-duration:52s;animation-delay:-20s"></div><div class="nuagem" style="top:8%;animation-duration:45s;animation-delay:-33s"></div>' +
    '<div class="tete"><button class="rond" id="mBack">' + TN.ic.home + '</button><h1 class="t" id="mTitle"></h1><div class="chip" id="mStars"></div><div class="chip" id="mCoins"></div></div><div class="banniere"></div></div>');
  stage.appendChild(map);
  function mapSize() { var mw = Math.max(390, TN.H * 1000 / 1792), im = map.querySelector('.img'); im.style.setProperty('--mw', mw + 'px'); im.style.setProperty('--mh', (mw * 1.792) + 'px'); im.style.setProperty('--up', Math.max(0, Math.min(26, (mw * 1.792 - TN.H) / 2)) + 'px'); }
  TN.resizers.push(mapSize);
  function mapDraw() {
    mapSize();
    var box = map.querySelector('#mNodes'), tot = TN.totalStars(), cur = firstLevel(); box.innerHTML = '';
    map.querySelector('#mTitle').textContent = TN.t('carteTitre');
    map.querySelector('#mStars').innerHTML = '<img src="img/etoile.png">' + tot;
    map.querySelector('#mCoins').innerHTML = '<img src="img/piece.png">' + TN.S.coins;
    REG.forEach(function (r) {
      var done = true; for (var i = r[3]; i <= r[4]; i++) if (!TN.S.stars[i]) done = false;
      var d = $('<div class="region t' + (r[5] ? '' : '') + (done ? ' fini' : '') + '" style="left:' + r[1] + '%;top:' + r[2] + '%"></div>'); d.textContent = TN.t(r[0]); box.appendChild(d);
    });
    NODES.forEach(function (n, i) {
      var id = i + 1, playable = TN.playable(id), open = playable && TN.unlocked(id), s = TN.S.stars[id] || 0;
      var b = $('<button class="noeud t' + (open ? '' : ' ferme') + (id === cur ? ' actuel' : '') + '" style="left:' + n[0] + '%;top:' + n[1] + '%"></button>');
      b.innerHTML = open ? id + (s ? '<span class="et">' + [1, 2, 3].map(function (k) { return '<img src="img/etoile' + (k <= s ? '' : '_grise') + '.png">'; }).join('') + '</span>' : '') : '<span class="cad">' + TN.ic.lock + '</span>';
      b.onclick = function () { TN.sfx.clic(); if (!playable) return TN.toast(TN.t('bientot')); if (!open) return TN.toast(TN.t('ferme', id - 1)); TN.startLevel(id); };
      box.appendChild(b);
      if (id === cur) box.appendChild($('<img class="heros" src="img/perso_idle.png" style="left:' + n[0] + '%;top:' + n[1] + '%">'));
    });
    CHESTS.forEach(function (c, i) {
      var opened = TN.S.chests[i], ready = !opened && tot >= c[2];
      var b = $('<button class="coffrem' + (opened ? ' ouvert' : ready ? ' pret' : '') + '" style="left:' + c[0] + '%;top:' + c[1] + '%">' + (opened ? '' : '<span>' + Math.min(tot, c[2]) + '/' + c[2] + ' &#9733;</span>') + '</button>');
      b.onclick = function () {
        if (opened) return; if (!ready) { TN.sfx.refus(); return TN.toast(TN.t('coffreIl', c[2] - tot)); }
        TN.S.chests[i] = 1; TN.coins(c[3]); TN.sfx.coffre();
        var v = TN.popup('<h2>' + TN.t('coffreT') + '</h2><img src="img/coffre_ouvert.png" style="width:130px"><div><span class="gain"><img src="img/piece.png"><span id="gn">+' + c[3] + '</span></span></div><div class="col"><button class="pil o" id="d">' + TN.t('gDouble') + '</button><button class="pil v" id="k">' + TN.t('ok') + '</button></div>', { noClose: true, onClose: mapDraw });
        v.querySelector('#d').onclick = function () { var bt = this; TN.ads.recompense(function () { TN.coins(c[3]); v.querySelector('#gn').textContent = '+' + (c[3] * 2); bt.remove(); }); };
        v.querySelector('#k').onclick = function () { TN.sfx.clic(); v.close(); };
      };
      box.appendChild(b);
    });
    TN.ads.banniere(map);
  }
  map.querySelector('#mBack').onclick = function () { TN.sfx.clic(); TN.show('home'); };
  TN.screens.map = { el: map, enter: function () { mapDraw(); TN.music.start(); } };

  /* ---------- collection ---------- */
  var PEAUX = [['nacre', 'sNacre', 0], ['rose', 'sRose', 150], ['menthe', 'sMenthe', 250], ['or', 'sOr', 400]];
  function collection() {
    var done = Object.keys(TN.S.stars).length;
    var v = TN.popup('<h2>' + TN.t('collection') + '</h2><div class="stat"><div><img src="img/etoile.png"> ' + TN.totalStars() + '<small>' + TN.t('cEtoiles') + '</small></div><div>' + done + '/' + TN.levels.length + '<small>' + TN.t('cNiveaux') + '</small></div><div><img src="img/piece.png"> <span id="cc">' + TN.S.coins + '</span><small>' + TN.t('cPieces') + '</small></div></div>' +
      '<p><b>' + TN.t('cApp') + '</b></p><div class="peaux" id="px"></div><div class="col"><button class="pil o" id="pub">' + TN.t('cPub') + '</button></div>', { onClose: function () { if (TN.current === 'home') homeTexts(); } });
    function draw() {
      var box = v.querySelector('#px'); box.innerHTML = ''; v.querySelector('#cc').textContent = TN.S.coins;
      PEAUX.forEach(function (p) {
        var own = TN.S.skins[p[0]], on = TN.S.skin === p[0];
        var b = $('<button class="peau peau-' + p[0] + (on ? ' on' : '') + '"></button>');
        b.appendChild(TN.drawCloud([[0, 0, 0], [1, 0, 0], [2, 0, 0], [0, 1, 0]], 3, 30));
        b.appendChild(document.createTextNode(TN.t(p[1]) + ' - ' + (on ? TN.t('choisi') : own ? TN.t('ok') : TN.t('prix', p[2]))));
        b.onclick = function () {
          if (!own) { if (TN.S.coins < p[2]) { TN.sfx.refus(); return TN.toast(TN.t('tuAs', TN.S.coins)); } TN.coins(-p[2]); TN.S.skins[p[0]] = 1; }
          TN.S.skin = p[0]; TN.save(); TN.sfx.clic(); draw();
        };
        box.appendChild(b);
      });
    }
    draw();
    v.querySelector('#pub').onclick = function () { TN.ads.recompense(function () { TN.coins(40); draw(); }); };
  }

  /* ---------- parametres, langues, credits ---------- */
  function langues(after) {
    var v = TN.popup('<h2>' + TN.t('langue') + '</h2><div class="langues">' + TN.LANGS.map(function (L) { return '<button data-l="' + L[0] + '"' + (L[0] === TN.S.lang ? ' class="on"' : '') + '>' + TN.flag(L[0]) + L[1] + '</button>'; }).join('') + '</div>');
    v.querySelectorAll('.langues button').forEach(function (b) { b.onclick = function () { TN.setLang(b.getAttribute('data-l')); TN.sfx.clic(); v.close(); homeTexts(); if (after) after(); }; });
  }
  function credits() {
    /* musiques originales (4e champ = auteur) ou musiques de Kevin MacLeod (licence CC BY 4.0 a citer) */
    var macleod = TN.PISTES.some(function (p) { return !p[3]; });
    TN.popup('<h2>' + TN.t('credits') + '</h2><p>' + TN.t(macleod ? 'credTxt' : 'credTxt2') + '</p><div class="cred">' + TN.PISTES.map(function (p) { return '&#9834; ' + p[1] + ' - ' + (p[3] || 'Kevin MacLeod (incompetech.com)'); }).join('<br>') + (macleod ? '<br><br>Licensed under Creative Commons: By Attribution 4.0<br>https://creativecommons.org/licenses/by/4.0/' : '') + (TN.music.titre() ? '<br><br><b>' + TN.t('enCours', TN.music.titre()) + '</b>' : '') + '</div>');
  }
  function settings() {
    var v = TN.popup('<h2>' + TN.t('parametres') + '</h2><button class="inter' + (TN.S.music ? ' on' : '') + '" id="mu" style="width:100%"><span>' + TN.t('musique') + '</span><i></i></button><button class="inter' + (TN.S.sfx ? ' on' : '') + '" id="fx" style="width:100%"><span>' + TN.t('effets') + '</span><i></i></button>' +
      '<div class="col"><button class="pil v" id="lg">' + TN.t('langue') + '</button><button class="pil v" id="cr">' + TN.t('credits') + '</button><button class="pil v" id="cf">' + TN.t('confid') + '</button><button class="pil v" id="au">' + TN.t('autres') + '</button><button class="pil c" id="rz">' + TN.t('reinit') + '</button></div><p style="opacity:.7;font-size:11px;margin-top:10px">Conte Games Studio - v1.0</p>');
    v.querySelector('#mu').onclick = function () { TN.music.set(!TN.S.music); this.classList.toggle('on', TN.S.music); };
    v.querySelector('#fx').onclick = function () { TN.S.sfx = !TN.S.sfx; TN.save(); this.classList.toggle('on', TN.S.sfx); TN.sfx.clic(); };
    v.querySelector('#lg').onclick = function () { v.close(); langues(settings); };
    v.querySelector('#cr').onclick = function () { credits(); };
    v.querySelector('#cf').onclick = function () { window.open(CONFID, '_blank'); };
    v.querySelector('#au').onclick = function () { window.open(SITE, '_blank'); };
    v.querySelector('#rz').onclick = function () {
      var c = TN.popup('<h2>' + TN.t('reinitQ') + '</h2><div class="ligne"><button class="pil v" id="o">' + TN.t('oui') + '</button><button class="pil o" id="n">' + TN.t('non') + '</button></div>', { noClose: true });
      c.querySelector('#n').onclick = function () { c.close(); };
      c.querySelector('#o').onclick = function () { var l = TN.S.lang, a = TN.S.age; TN.reset(); TN.S.lang = l; TN.S.age = a; TN.save(); c.close(); v.close(); homeTexts(); };
    };
  }

  /* ---------- age (premier lancement, avant toute publicite) et cadeau du jour ---------- */
  function age(next) {
    if (TN.S.age !== null) return next();
    var v = TN.popup('<h2>' + TN.t('ageQ') + '</h2><p>' + TN.t('ageP') + '</p><div class="col"><button class="pil v" data-a="12">' + TN.t('a1') + '</button><button class="pil v" data-a="15">' + TN.t('a2') + '</button><button class="pil v" data-a="16">' + TN.t('a3') + '</button></div>', { noClose: true });
    v.querySelectorAll('[data-a]').forEach(function (b) { b.onclick = function () { TN.S.age = +b.getAttribute('data-a'); TN.save(); TN.sfx.clic(); v.close(); homeTexts(); next(); }; });
  }
  function cadeau() {
    var d = new Date(), k = d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate();
    if (TN.S.daily === k || !Object.keys(TN.S.stars).length) return;
    var v = TN.popup('<h2>' + TN.t('jour') + '</h2><img src="img/coffre.png" style="width:110px"><p>' + TN.t('jourP') + '</p><div class="col"><button class="pil o grand" id="k">' + TN.t('jourB', 25) + '</button></div>', { noClose: true });
    v.querySelector('#k').onclick = function () { TN.S.daily = k; TN.coins(25); v.close(); homeTexts(); };
  }

  /* ---------- intro du studio : 4 s, fond noir, logo entier, harpe a 85 %, on ne peut pas passer ---------- */
  var intro = $('<div class="screen on" id="intro"><img src="img/studio.png"></div>'); stage.appendChild(intro);
  TN.screens.intro = { el: intro };
  function boot() {
    TN.fit();
    setTimeout(function () { intro.classList.add('vu'); }, 200);
    if (TN.S.music) { try { var h = new Audio('audio/studio_harpe.wav'); h.volume = 0.85; var p = h.play(); if (p && p.catch) p.catch(function () { }); } catch (e) { } }
    setTimeout(function () { intro.classList.add('fin'); }, 3500);
    setTimeout(function () { TN.show('home'); intro.remove(); delete TN.screens.intro; age(cadeau); }, 4000);
  }
  document.addEventListener('pointerdown', function once() { document.removeEventListener('pointerdown', once); if (TN.current && TN.current !== 'intro') TN.music.start(); });
  TN.homeTexts = homeTexts;
  /* 13/11/2026, consigne d'Anthony : logo du studio + harpe coupes pour l'instant (jeu ouvert direct sur l'accueil).
     A remettre a la mise a jour qui suit la validation sur les stores : passer LOGO_STUDIO a true. Rien n'est supprime. */
  var LOGO_STUDIO = false;
  if (!LOGO_STUDIO || /[?&]sansintro/.test(location.search)) { TN.fit(); intro.remove(); delete TN.screens.intro; TN.show('home'); age(cadeau); } else boot();
})();
