/* Les Rouages Enchantés — écrans, fenêtres, publicités et boucle principale */
(function (root) {
  'use strict';
  var RE = root.RE, B = RE.base, C = RE.core, G = B.g, U = B.ui, ctx = B.ctx, IMG = B.img, T = B.T, save = B.save, P = RE.play;
  var W = B.W, H = B.H;
  var App = RE.app = { screen: 'load', next: null, fade: 0, fadeDir: 0, modal: null, t0: 0 };
  var MY = 130, MAPH = 1685, VIEWH = 1412;
  var MAPPTS = {"1":[[621,1631],[493,1555],[364,1482],[239,1402],[245,1295],[389,1266],[537,1261],[684,1243],[769,1143],[651,1065],[504,1045],[357,1027],[214,991],[179,865],[304,791],[449,758],[594,731],[653,632],[519,573],[377,533],[315,429],[452,376],[595,339],[593,240],[453,190]],"2":[[289,1608],[391,1527],[515,1487],[639,1442],[717,1348],[632,1258],[509,1212],[385,1170],[313,1080],[420,1009],[546,975],[676,960],[716,866],[599,811],[471,783],[345,747],[333,659],[459,627],[588,600],[701,540],[642,443],[518,401],[434,338],[555,291],[661,217]],"3":[[349,1594],[421,1510],[507,1440],[583,1362],[528,1279],[437,1216],[464,1123],[552,1056],[557,969],[452,936],[359,891],[437,822],[544,791],[631,744],[529,712],[421,686],[318,646],[370,584],[477,558],[578,514],[517,448],[411,414],[378,349],[481,309],[508,229]],"4":[[391,1580],[491,1555],[591,1528],[687,1493],[777,1443],[781,1352],[696,1295],[719,1209],[772,1121],[757,1025],[675,965],[577,935],[474,931],[372,940],[297,905],[379,843],[452,771],[429,679],[390,586],[454,508],[539,450],[556,352],[624,277],[714,228],[810,191]],"5":[[330,1617],[443,1579],[556,1537],[664,1486],[749,1404],[712,1300],[607,1243],[492,1208],[375,1180],[266,1131],[209,1032],[210,912],[269,812],[376,759],[493,733],[609,704],[708,642],[720,525],[687,410],[682,295],[577,243],[458,229],[340,207],[396,148],[511,113]],"6":[[514,1627],[414,1566],[313,1508],[243,1421],[321,1344],[434,1319],[551,1314],[667,1324],[782,1316],[816,1231],[709,1189],[594,1169],[479,1154],[363,1143],[248,1126],[170,1064],[273,1016],[387,993],[500,967],[603,913],[568,825],[459,784],[349,745],[274,679],[379,630]]};
  var GATES = { 1: 0, 2: 45, 3: 100, 4: 160, 5: 220, 6: 285 };
  var CHESTS = [
    { id: 'c1', world: 1, need: 20, x: 493, y: 469, coins: 100, hints: 1, skin: 'emeraude' }, { id: 'c2', world: 1, need: 50, x: 502, y: 1151, coins: 150, hints: 2 },
    { id: 'c3', world: 2, need: 85, x: 156, y: 921, coins: 150, hints: 2, skin: 'azur' }, { id: 'c4', world: 2, need: 115, x: 822, y: 411, coins: 250, hints: 2 },
    { id: 'c5', world: 3, need: 150, x: 140, y: 493, coins: 250, hints: 2, skin: 'amethyste' }, { id: 'c6', world: 3, need: 185, x: 790, y: 1020, coins: 250, hints: 2 },
    { id: 'c7', world: 4, need: 215, x: 150, y: 1180, coins: 250, hints: 2 }, { id: 'c8', world: 4, need: 250, x: 770, y: 560, coins: 300, hints: 2 },
    { id: 'c9', world: 5, need: 280, x: 800, y: 1560, coins: 300, hints: 2 }, { id: 'c10', world: 5, need: 320, x: 120, y: 560, coins: 350, hints: 3 },
    { id: 'c11', world: 6, need: 350, x: 760, y: 1560, coins: 400, hints: 3 }, { id: 'c12', world: 6, need: 400, x: 130, y: 1010, coins: 600, hints: 4 }];
  var UPS = [
    { id: 'indice', name: { fr: 'Bourse d’indices', en: 'Hint pouch' }, desc: { fr: '+1 indice à utiliser en jeu', en: '+1 hint to use in play' }, max: 0, cost: [60] },
    { id: 'huile', name: { fr: 'Rouages huilés', en: 'Oiled gears' }, desc: { fr: '+2 coups maximum dans chaque niveau', en: '+2 max moves in every level' }, max: 2, cost: [150, 300] },
    { id: 'sablier', name: { fr: 'Grand sablier', en: 'Great hourglass' }, desc: { fr: '+20 secondes dans les niveaux chronométrés', en: '+20 seconds in timed levels' }, max: 2, cost: [120, 240] },
    { id: 'moulin', name: { fr: 'Moulin prospère', en: 'Thriving mill' }, desc: { fr: '+50 % de pièces à chaque victoire', en: '+50% coins on every win' }, max: 2, cost: [200, 400] }
  ];
  var TREASURES = [
    { id: 'source', img: 'm_cascade', name: { fr: 'Fontaine enchantée', en: 'Enchanted fountain' }, how: { fr: 'Niveau 8 : alimente la fontaine', en: 'Level 8: power the fountain' } },
    { id: 'couronne', img: 'm_chateau', name: { fr: 'Cœur mécanique', en: 'Mechanical heart' }, how: { fr: 'Niveau 150 : alimente la tour', en: 'Level 150: power the tower' } }
  ];

  function worldOf(id) { return RE.LEVELS[id - 1].world; }
  function unlocked(id) { if (id === 1) return true; if (!save.stars[id - 1]) return false; return B.totalStars() >= GATES[worldOf(id)]; }
  function nextLevel() { for (var i = 1; i <= RE.LEVELS.length; i++) if (!save.stars[i]) return unlocked(i) ? i : 0; return 0; }
  App.unlocked = unlocked;

  App.go = function (name, arg) { if (App.fadeDir) return; App.next = { name: name, arg: arg }; App.fadeDir = 1; App.modal = null; };
  function enter(name, arg) {
    App.screen = name; App.t0 = B.t; B.parts.length = 0;
    if (name === 'play') P.start(arg);
    if (name !== 'studio') B.audio.startMusic();
    if (name === 'home' && Ads.needAge()) App.modal = 'age';
    if (name === 'map' || name === 'collection' || name === 'upgrades') B.audio.music('carte');
    if (name === 'map') { App.mapCache = {}; var nl0 = nextLevel(), cur = nl0 || save.last || 1; App.mapWorld = arg || worldOf(Math.min(cur, RE.LEVELS.length)); centerMap(cur); }
  }

  /* ───────── publicités ───────── */
  var Ads = RE.ads = { wins: 0, card: null };
  function plugin() { return root.Capacitor && root.Capacitor.Plugins && root.Capacitor.Plugins.AdMob; }
  function unitIds() { var ios = root.Capacitor && root.Capacitor.getPlatform && root.Capacitor.getPlatform() === 'ios'; return ios ? RE.PUBS.ios : RE.PUBS.android; }
  /* démarrage : question d'âge (une fois), consentement Google en Europe, puis initialisation */
  Ads.init = function () { if (plugin() && save.adulte !== null) Ads.start(false); };
  Ads.needAge = function () { return !!plugin() && save.adulte === null; };
  Ads.start = function (redemander) {
    var a = plugin(); if (!a) return; var mineur = save.adulte === false;
    function fin() { try { a.initialize({ initializeForTesting: !!RE.PUBS.test, tagForChildDirectedTreatment: mineur, tagForUnderAgeOfConsent: mineur, maxAdContentRating: mineur ? 'General' : 'ParentalGuidance' }).then(function () { Ads.ok = true; }, function () { Ads.ok = true; }); } catch (e) { } }
    try {
      (redemander ? a.resetConsentInfo() : Promise.resolve()).then(function () { return a.requestConsentInfo({ tagForUnderAgeOfConsent: mineur }); })
        .then(function (i) { if (i && i.isConsentFormAvailable && i.status === 'REQUIRED') return a.showConsentForm(); }).then(fin, fin);
    } catch (e) { fin(); }
  };
  Ads.ready = function () { return !!RE.PUBS; };
  function pauseMusic(on) { for (var k in B.audio.tracks) { var tr = B.audio.tracks[k]; if (on) tr.el.pause(); else if (tr.target > 0 && tr.ok) tr.el.play().catch(function () { }); } }
  /* attend la fin réelle de la publicité (fermeture ou échec), une seule fois */
  function suivre(a, noms, fin) {
    var hs = [], fait = false, garde = setTimeout(function () { if (!vue) clore('delai'); }, 15000), vue = false;
    function clore(n, d) { if (fait) return; fait = true; clearTimeout(garde); hs.forEach(function (h) { Promise.resolve(h).then(function (x) { if (x && x.remove) x.remove(); }, function () { }); }); pauseMusic(false); fin(n, d); }
    noms.forEach(function (n) { try { hs.push(a.addListener(n, function (d) { if (/Showed$/.test(n)) { vue = true; return; } if (/Reward$/.test(n)) { clore.gain = true; return; } clore(n, d); })); } catch (e) { } });
    return clore;
  }
  /* interstitiel : seulement entre deux niveaux, après une victoire */
  Ads.interstitial = function (done) {
    var a = plugin();
    if (a) {
      if (!Ads.ok) { done(); return; }
      pauseMusic(true);
      var c = suivre(a, ['interstitialAdShowed', 'interstitialAdDismissed', 'interstitialAdFailedToShow', 'interstitialAdFailedToLoad'], function () { done(); });
      try { a.prepareInterstitial({ adId: unitIds().interstitiel, isTesting: !!RE.PUBS.test }).then(function () { return a.showInterstitial(); }).then(null, function () { c('erreur'); }); } catch (e) { c('erreur'); }
    } else Ads.card = { t: 0, dur: 1.6, done: function () { done(); }, kind: 'inter' };
  };
  /* vidéo récompensée : toujours un choix du joueur ; la récompense n'est donnée que si la vidéo a été vue */
  Ads.rewarded = function (done) {
    var a = plugin();
    if (a) {
      if (!Ads.ok) { done(false); return; }
      pauseMusic(true);
      var c = suivre(a, ['onRewardedVideoAdShowed', 'onRewardedVideoAdReward', 'onRewardedVideoAdDismissed', 'onRewardedVideoAdFailedToShow', 'onRewardedVideoAdFailedToLoad'], function (n) { done(!!c.gain && /Dismissed$/.test(n)); });
      try { a.prepareRewardVideoAd({ adId: unitIds().recompense, isTesting: !!RE.PUBS.test }).then(function () { return a.showRewardVideoAd(); }).then(null, function () { c('erreur'); }); } catch (e) { c('erreur'); }
    } else Ads.card = { t: 0, dur: 2.2, done: function () { done(true); }, kind: 'reward' };
  };
  Ads.afterWin = function (levelId, go) {
    Ads.wins++;
    if (levelId >= RE.PUBS.pasAvantNiveau && Ads.wins % RE.PUBS.interstitielTousLes === 0) Ads.interstitial(go); else go();
  };
  function drawAdCard() {
    var c = Ads.card; c.t += B.dt;
    U.zone('adblock', 0, 0, W, H, null, { block: true, silent: true });
    ctx.fillStyle = 'rgba(4,6,18,0.93)'; ctx.fillRect(0, 0, W, H);
    G.panel(120, 640, W - 240, 360);
    G.text(T({ fr: 'PUBLICITÉ', en: 'ADVERTISEMENT' }), W / 2, 730, 46, { grad: G.GOLD });
    G.text(T(c.kind === 'reward' ? { fr: 'Vidéo récompensée', en: 'Rewarded video' } : { fr: 'Entre deux niveaux', en: 'Between two levels' }), W / 2, 800, 28, { weight: 700 });
    G.text(T({ fr: 'Aperçu sur ordinateur : la vraie publicité', en: 'Computer preview: the real ad' }), W / 2, 860, 22, { weight: 700, color: '#aab6e6' });
    G.text(T({ fr: 's’affiche ici dans l’application mobile', en: 'appears here in the mobile app' }), W / 2, 892, 22, { weight: 700, color: '#aab6e6' });
    var k = Math.min(1, c.t / c.dur); G.rr(220, 940, W - 440, 14, 7); ctx.fillStyle = '#0c1028'; ctx.fill(); G.rr(220, 940, (W - 440) * k, 14, 7); ctx.fillStyle = '#f2b33a'; ctx.fill();
    if (c.t >= c.dur) { Ads.card = null; c.done(); }
  }

  /* ───────── éléments communs ───────── */
  function dim(a) { U.zone('dim', 0, 0, W, H, null, { block: true, silent: true }); ctx.fillStyle = 'rgba(6,8,24,' + (a || 0.74) + ')'; ctx.fillRect(0, 0, W, H); }
  function title(txt, y, size) {
    var im = IMG.banner, w = 560, h = w * im.height / im.width * 1.05;
    ctx.drawImage(im, W / 2 - w / 2, y - h / 2, w, h); G.text(txt, W / 2, y, size || 46, { grad: G.GOLD, maxW: w - 110 });
  }
  function roundBtn(id, x, y, r, draw, fn) {
    var pr = U.zone(id, x - r, y - r, r * 2, r * 2, fn);
    ctx.save(); ctx.translate(x, y); if (pr) ctx.scale(0.93, 0.93);
    ctx.shadowColor = 'rgba(0,0,0,0.5)'; ctx.shadowBlur = 12; ctx.shadowOffsetY = 5;
    var g = ctx.createLinearGradient(0, -r, 0, r); g.addColorStop(0, '#f2a83a'); g.addColorStop(1, '#a8601a'); ctx.beginPath(); ctx.arc(0, 0, r, 0, 6.2832); ctx.fillStyle = g; ctx.fill(); ctx.shadowColor = 'transparent';
    ctx.lineWidth = 5; ctx.strokeStyle = '#ffe9a6'; ctx.stroke(); ctx.lineWidth = 2; ctx.strokeStyle = '#3a2410'; ctx.beginPath(); ctx.arc(0, 0, r + 3, 0, 6.2832); ctx.stroke();
    draw(r); ctx.restore();
  }
  function icoBack(r) { ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.lineWidth = r * 0.24; ctx.strokeStyle = '#3a1c06'; ctx.beginPath(); ctx.moveTo(r * 0.2, -r * 0.42); ctx.lineTo(-r * 0.25, 0); ctx.lineTo(r * 0.2, r * 0.42); ctx.stroke(); ctx.strokeStyle = '#fff6e0'; ctx.lineWidth = r * 0.14; ctx.stroke(); }
  function icoHome(r) { ctx.lineJoin = 'round'; ctx.beginPath(); ctx.moveTo(-r * 0.5, 0); ctx.lineTo(0, -r * 0.48); ctx.lineTo(r * 0.5, 0); ctx.lineTo(r * 0.34, 0); ctx.lineTo(r * 0.34, r * 0.42); ctx.lineTo(-r * 0.34, r * 0.42); ctx.lineTo(-r * 0.34, 0); ctx.closePath(); ctx.fillStyle = '#fff6e0'; ctx.fill(); ctx.lineWidth = r * 0.09; ctx.strokeStyle = '#3a1c06'; ctx.stroke(); }
  function counter(x, y, w, icon, val) {
    G.rr(x, y - 26, w, 52, 26); ctx.fillStyle = 'rgba(10,14,40,0.85)'; ctx.fill(); ctx.lineWidth = 2.5; ctx.strokeStyle = '#e8b04a'; ctx.stroke();
    icon(x + 28, y); G.text(val, x + 52 + (w - 62) / 2, y + 1, 28, { maxW: w - 70 });
  }
  function slider(id, x, y, w, val, set, label) {
    G.text(label, x, y - 42, 27, { align: 'left', weight: 700 });
    G.text(Math.round(val * 100) + ' %', x + w, y - 42, 25, { align: 'right', weight: 700, color: '#ffe08a' });
    G.rr(x, y - 9, w, 18, 9); ctx.fillStyle = '#0c1028'; ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = '#8f6a2a'; ctx.stroke();
    G.rr(x, y - 9, Math.max(18, w * val), 18, 9); var g = ctx.createLinearGradient(x, 0, x + w, 0); g.addColorStop(0, '#2f7fe0'); g.addColorStop(1, '#7fd8ff'); ctx.fillStyle = g; ctx.fill();
    var kx = x + w * val; ctx.beginPath(); ctx.arc(kx, y, 21, 0, 6.2832); var kg = ctx.createLinearGradient(0, y - 21, 0, y + 21); kg.addColorStop(0, '#fff0b0'); kg.addColorStop(1, '#c8841e'); ctx.fillStyle = kg; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = '#3a2410'; ctx.stroke();
    U.zone(id, x - 30, y - 40, w + 60, 80, null, { silent: true, drag: function (p) { var v = Math.max(0, Math.min(1, (p.x - x) / w)); set(Math.round(v * 20) / 20); } });
  }
  function fmtTime(s) { s = Math.round(s); return Math.floor(s / 60) + ':' + ('0' + (s % 60)).slice(-2); }

  /* ───────── fenêtres pendant le jeu ───────── */
  var O = RE.overlays = {};
  O.tip = function () {
    var L = P.L; dim(0.6);
    G.panel(90, 560, W - 180, 560);
    title(B.lvlName(L), 600, 40);
    G.text(T(RE.WORLDS[L.world - 1].name), W / 2, 690, 25, { color: '#9fd6ff', weight: 700 });
    var hh = G.wrap(T(L.tip), W / 2, 760, 28, W - 290, 42, { color: '#fff3d6' });
    var par = RE.PARS[L.id], y = 790 + hh;
    G.star(W / 2 - 170, y, 15, true); G.text(B.F({ fr: 'en {n} coups ou moins', en: 'in {n} moves or fewer' }, { n: par.par2 }), W / 2 - 145, y + 1, 22, { align: 'left', weight: 700, color: '#ffe9a0' });
    U.button('tipok', 'orange', W / 2 - 170, 1000, 340, 92, T({ fr: 'C’EST PARTI', en: 'LET’S GO' }), function () { save.tips[L.id] = 1; B.persist(); P.overlay = null; });
  };
  O.pause = function () {
    dim();
    G.panel(110, 380, W - 220, 900);
    title(T({ fr: 'PAUSE', en: 'PAUSE' }), 420);
    U.button('p_resume', 'orange', 210, 520, W - 420, 96, T({ fr: 'REPRENDRE', en: 'RESUME' }), function () { P.overlay = null; });
    U.button('p_restart', 'blue', 210, 640, W - 420, 96, T({ fr: 'RECOMMENCER', en: 'RESTART' }), function () { P.restart(); });
    slider('p_mus', 230, 850, W - 460, save.music, function (v) { save.music = v; B.persist(); }, T({ fr: 'Musique', en: 'Music' }));
    slider('p_sfx', 230, 980, W - 460, save.sfx, function (v) { if (v !== save.sfx) { save.sfx = v; B.persist(); B.audio.sfx('tic'); } }, T({ fr: 'Effets sonores', en: 'Sound effects' }));
    U.button('p_map', 'red', 210, 1120, W - 420, 96, T({ fr: 'RETOUR À LA CARTE', en: 'BACK TO MAP' }), function () { App.go('map'); });
  };
  O.nohint = function () {
    dim();
    G.panel(110, 560, W - 220, 520);
    title(T({ fr: 'PLUS D’INDICE', en: 'NO HINTS LEFT' }), 600, 40);
    G.wrap(T({ fr: 'Regarde une courte publicité pour gagner un indice, ou achètes-en dans les Améliorations.', en: 'Watch a short ad to earn a hint, or buy some in Upgrades.' }), W / 2, 710, 26, W - 320, 40, { color: '#fff3d6' });
    U.button('n_ad', 'orange', 190, 850, W - 380, 92, T({ fr: '1 INDICE GRATUIT (PUB)', en: '1 FREE HINT (AD)' }), function () { Ads.rewarded(function (ok) { if (ok) { save.hints++; B.persist(); P.overlay = null; P.askHint(); } }); }, { size: 27 });
    U.button('n_no', 'red', 280, 960, W - 560, 80, T({ fr: 'FERMER', en: 'CLOSE' }), function () { P.overlay = null; }, { size: 26 });
  };
  O.win = function () {
    var L = P.L, r = P.result, par = RE.PARS[L.id]; r.shown += B.dt; var t = r.shown;
    dim(0.7);
    G.panel(70, 250, W - 140, 1180);
    title(T({ fr: 'VICTOIRE !', en: 'VICTORY!' }), 290, 50);
    // étoiles
    for (var i = 0; i < 3; i++) {
      var on = i < r.stars, tt = B.ease.clamp((t - 0.35 - i * 0.38) / 0.4), sc = on ? B.ease.back(tt) : 1, x = W / 2 + (i - 1) * 190, y = i === 1 ? 430 : 462, rr = i === 1 ? 84 : 68;
      G.star(x, y, rr, false);
      if (on && tt > 0) { ctx.save(); ctx.translate(x, y); ctx.scale(sc, sc); G.star(0, 0, rr, true, (1 - tt) * -0.6); ctx.restore(); if (!r['s' + i]) { r['s' + i] = 1; B.audio.sfx('etoile'); B.spark(x, y, 22, '#ffe08a', { v: 260, r: 5 }); } }
    }
    // bâtiment restauré
    var by = 660; ctx.save(); var pul = 1 + 0.03 * Math.sin(B.t * 3);
    var gl = ctx.createRadialGradient(W / 2, by, 30, W / 2, by, 170); gl.addColorStop(0, 'rgba(255,220,120,0.5)'); gl.addColorStop(1, 'rgba(255,220,120,0)'); ctx.fillStyle = gl; ctx.fillRect(W / 2 - 170, by - 170, 340, 340);
    ctx.drawImage(IMG['m_' + L.building], W / 2 - 92 * pul, by - 92 * pul, 184 * pul, 184 * pul); P.ring(W / 2, by, 92 * pul, 7); ctx.restore();
    G.text(T({ fr: 'Bâtiment restauré', en: 'Building restored' }), W / 2, 790, 24, { color: '#9fd6ff', weight: 700 });
    G.text(T(RE.NAMES[L.building]) + ' — ' + B.lvlName(L), W / 2, 830, 32, { maxW: W - 240, grad: G.GOLD });
    // détails
    var rows = [
      [true, T({ fr: 'Objectif réussi', en: 'Goal achieved' })],
      [r.st2, B.F({ fr: 'Coups : {n} (2e étoile : {m} ou moins)', en: 'Moves: {n} (2nd star: {m} or fewer)' }, { n: r.moves, m: par.par2 })],
      [r.st3, L.secondary ? T(L.secondary.type === 'bonus' ? { fr: 'Machine bonus alimentée', en: 'Bonus machine powered' } : { fr: 'Rouage rouge resté immobile', en: 'Red gear kept still' }) : B.F({ fr: 'Solution parfaite (coups : {n})', en: 'Perfect solution (moves: {n})' }, { n: par.opt })]
    ];
    rows.forEach(function (row, k) { var yy = 892 + k * 42; G.star(205, yy, 15, row[0]); G.text(row[1], 235, yy + 1, 24, { align: 'left', weight: 700, color: row[0] ? '#fff3d6' : '#8f98c4', maxW: W - 400 }); });
    G.text(T({ fr: 'Temps ', en: 'Time ' }) + fmtTime(r.time), 235, 1024, 24, { align: 'left', weight: 700, color: '#cfd8ff' });
    G.coin(W - 300, 1022, 19); G.text('+' + r.coins, W - 270, 1024, 30, { align: 'left', color: '#ffe08a' });
    if (r.treasure) G.text(T({ fr: 'Trésor découvert : ', en: 'Treasure found: ' }) + T(TREASURES.filter(function (q) { return q.id === r.treasure; })[0].name), W / 2, 1068, 24, { color: '#ffe08a', maxW: W - 240 });
    else if (r.bonusCoins) G.text(T({ fr: 'Machine bonus alimentée : +40 pièces', en: 'Bonus machine powered: +40 coins' }), W / 2, 1068, 22, { color: '#ffe08a', weight: 700 });
    else if (r.mill) G.text(T({ fr: 'Le moulin tourne : +15 pièces', en: 'The mill is running: +15 coins' }), W / 2, 1068, 22, { color: '#bfe6a8', weight: 700 });
    // boutons
    var last = L.id >= RE.LEVELS.length, canNext = !last && unlocked(L.id + 1);
    if (!r.doubled && Ads.ready()) U.button('w_double', 'blue', 150, 1108, W - 300, 78, T({ fr: 'DOUBLER LES PIÈCES (PUB)', en: 'DOUBLE COINS (AD)' }), function () { Ads.rewarded(function (ok) { if (ok) { r.doubled = true; save.coins += r.coins; r.coins *= 2; B.persist(); B.audio.sfx('piece'); } }); }, { size: 26 });
    else G.text(T({ fr: 'Pièces doublées !', en: 'Coins doubled!' }), W / 2, 1147, 26, { color: '#ffe08a' });
    U.button('w_next', 'orange', 150, 1202, W - 300, 96, canNext ? T({ fr: 'NIVEAU SUIVANT', en: 'NEXT LEVEL' }) : T({ fr: 'VOIR LA CARTE', en: 'SEE THE MAP' }), function () {
      Ads.afterWin(L.id, function () { if (canNext) App.go('play', L.id + 1); else App.go('map'); });
    });
    U.button('w_replay', 'blue', 150, 1314, (W - 320) / 2, 84, T({ fr: 'REJOUER', en: 'REPLAY' }), function () { P.restart(); }, { size: 28 });
    U.button('w_map', 'red', W / 2 + 10, 1314, (W - 320) / 2, 84, T({ fr: 'CARTE', en: 'MAP' }), function () { App.go('map'); }, { size: 28 });
  };
  O.lose = function () {
    var L = P.L; dim();
    G.panel(100, 430, W - 200, 800);
    title(T({ fr: 'MÉCANISME FIGÉ', en: 'MECHANISM FROZEN' }), 470, 38);
    P.drawGear('steel', 'L', W / 2, 610, Math.sin(B.t * 30) * 0.02, 0.8);
    G.lock(W / 2, 614, 60);
    G.text(P.lost === 'temps' ? T({ fr: 'Le sablier est écoulé', en: 'The hourglass ran out' }) : T({ fr: 'Tu n’as plus de coups', en: 'You are out of moves' }), W / 2, 740, 32, { color: '#ffd0c0' });
    G.text(T({ fr: 'La malédiction tient bon… pour l’instant !', en: 'The curse holds… for now!' }), W / 2, 786, 24, { weight: 700, color: '#cfd8ff', maxW: W - 300 });
    var y = 840;
    if (!P.continued && Ads.ready()) { U.button('l_cont', 'blue', 180, y, W - 360, 84, T(L.time ? { fr: '+3 COUPS ET +30 S (PUB)', en: '+3 MOVES & +30 S (AD)' } : { fr: '+3 COUPS (PUB)', en: '+3 MOVES (AD)' }), function () { Ads.rewarded(function (ok) { if (ok) P.secondChance(); }); }, { size: 26 }); y += 98; }
    U.button('l_restart', 'orange', 180, y, W - 360, 92, T({ fr: 'RECOMMENCER', en: 'RESTART' }), function () { P.restart(); }); y += 106;
    U.button('l_hint', 'blue', 180, y, (W - 380) / 2, 84, T({ fr: 'INDICE', en: 'HINT' }) + ' (' + save.hints + ')', function () { P.restart({ hint: true }); }, { size: 26 });
    U.button('l_map', 'red', W / 2 + 10, y, (W - 380) / 2, 84, T({ fr: 'CARTE', en: 'MAP' }), function () { App.go('map'); }, { size: 26 });
  };

  function openSite() { try { window.open('https://contegames.com', '_blank', 'noopener'); } catch (e) { } }
  /* ───────── accueil ───────── */
  var homeSparks = 0;
  function drawHome() {
    var t = B.t;
    var fr = save.lang === 'fr';
    ctx.drawImage(fr ? IMG.home : IMG.home_clean, 0, 0, W, H);
    if (!fr) {
      G.text(T({ fr: 'JOUER', en: 'PLAY' }), 470, 1098, 112, { grad: ['#fff6c0', '#f2a626'], stroke: '#5a2a08', lw: 14, drop: 6, maxW: 430 });
      G.text(T({ fr: 'CARTE', en: 'MAP' }), 180, 1508, 34, { maxW: 210, color: '#fff6e0', lw: 6 });
      G.text(T({ fr: 'COLLECTION', en: 'COLLECTION' }), 471, 1508, 34, { maxW: 226, color: '#fff6e0', lw: 6 });
      G.text(T({ fr: 'PARAMÈTRES', en: 'SETTINGS' }), 767, 1508, 34, { maxW: 226, color: '#fff6e0', lw: 6 });
    }
    // halo du bouton JOUER
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    var a = 0.16 + 0.12 * Math.sin(t * 2.4), g = ctx.createRadialGradient(470, 1100, 60, 470, 1100, 420); g.addColorStop(0, 'rgba(255,220,130,' + a + ')'); g.addColorStop(1, 'rgba(255,220,130,0)'); ctx.fillStyle = g; ctx.fillRect(40, 880, 860, 440);
    var sw = ((t * 0.45) % 1.6) * 760 + 60; if (sw < 800) { ctx.beginPath(); G.rr(190, 1015, 560, 180, 60); ctx.clip(); var sg = ctx.createLinearGradient(sw - 70, 0, sw + 70, 0); sg.addColorStop(0, 'rgba(255,255,255,0)'); sg.addColorStop(0.5, 'rgba(255,255,255,0.32)'); sg.addColorStop(1, 'rgba(255,255,255,0)'); ctx.fillStyle = sg; ctx.transform(1, 0, -0.35, 1, 380, 0); ctx.fillRect(sw - 480, 1000, 200, 220); }
    ctx.restore();
    // rouages décoratifs animés
    ctx.save(); ctx.globalAlpha = 0.96;
    P.drawGear('gold', 'M', 258, 1318, t * 0.5, 0.62, IMG.gear_gold_M); P.drawGear('gold', 'S', 316, 1337, -t * 0.75 + 0.2, 0.62, IMG.gear_gold_S);
    P.drawGear('gold', 'M', 683, 1318, -t * 0.5, 0.62, IMG.gear_gold_M); P.drawGear('gold', 'S', 625, 1337, t * 0.75 + 0.2, 0.62, IMG.gear_gold_S);
    ctx.restore();
    U.button('h_up', 'blue', 300, 1276, 341, 86, T({ fr: 'AMÉLIORATIONS', en: 'UPGRADES' }), function () { App.go('upgrades'); }, { size: 27 });
    function hz(id, x, y, w, h, fn, r) { var pr = U.zone(id, x, y, w, h, fn); if (pr) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; G.rr(x + 8, y + 8, w - 16, h - 16, r || 40); ctx.fillStyle = 'rgba(255,240,190,0.22)'; ctx.fill(); ctx.restore(); } }
    hz('h_play', 150, 990, 640, 225, function () { var n = nextLevel(); if (n) App.go('play', n); else App.go('map'); }, 70);
    hz('h_map', 40, 1392, 275, 178, function () { App.go('map'); });
    hz('h_col', 332, 1392, 280, 178, function () { App.go('collection'); });
    hz('h_set', 630, 1392, 275, 178, function () { App.modal = 'settings'; });
    U.button('h_site', 'blue', 190, 1590, W - 380, 70, T({ fr: 'DÉCOUVREZ NOS AUTRES JEUX', en: 'DISCOVER OUR OTHER GAMES' }), openSite, { size: 24 });
    homeSparks += B.dt; if (homeSparks > 0.09) { homeSparks = 0; B.spark(120 + Math.random() * 700, 300 + Math.random() * 1000, 1, Math.random() < 0.6 ? '#ffe7a0' : '#a8e2ff', { v: 20, up: 30, g: -12, life: 2.2, r: 3.2 }); }
    B.drawParts(B.dt);
  }

  /* ───────── carte (une carte de 25 niveaux par monde, défilement vertical) ───────── */
  function lvlPos(id) { var L = RE.LEVELS[id - 1], p = MAPPTS[L.world][L.slot - 1]; return { x: p[0], y: p[1] }; }
  function clampScroll() { App.mapScroll = Math.max(0, Math.min(MAPH - VIEWH, App.mapScroll || 0)); }
  function centerMap(id) { var L = RE.LEVELS[id - 1]; if (!L || L.world !== App.mapWorld) { App.mapScroll = MAPH - VIEWH; return; } App.mapScroll = lvlPos(id).y - VIEWH * 0.55; clampScroll(); }
  function worldOpen(w) { if (w === 1) return true; var wd = RE.WORLDS[w - 1]; return !!save.stars[wd.first - 1] && B.totalStars() >= GATES[w]; }
  function buildMap(w) {
    var c = document.createElement('canvas'); c.width = W; c.height = MAPH; var x = c.getContext('2d');
    var m = document.createElement('canvas'); m.width = W; m.height = MAPH; var mx = m.getContext('2d');
    var wd = RE.WORLDS[w - 1], nl = nextLevel(), all = true;
    for (var i = 0; i < wd.count; i++) {
      var id = wd.first + i, done = !!save.stars[id]; if (!done) all = false;
      if (done || id === nl || (i === 0 && worldOpen(w))) { var p = lvlPos(id), r = done ? 250 : 180, g = mx.createRadialGradient(p.x, p.y, r * 0.45, p.x, p.y, r); g.addColorStop(0, 'rgba(0,0,0,1)'); g.addColorStop(1, 'rgba(0,0,0,0)'); mx.fillStyle = g; mx.beginPath(); mx.arc(p.x, p.y, r, 0, 6.2832); mx.fill(); }
    }
    if (all) { mx.fillStyle = '#000'; mx.fillRect(0, 0, W, MAPH); }
    mx.globalCompositeOperation = 'source-in'; mx.drawImage(IMG['map' + w], 0, 0, W, MAPH);
    x.drawImage(IMG['map' + w + '_f'], 0, 0, W, MAPH); x.drawImage(m, 0, 0);
    return c;
  }
  function medal(x, y, r, num, state, t) {
    ctx.save(); ctx.translate(x, y);
    ctx.beginPath(); ctx.ellipse(3, r * 0.5 + 6, r * 1.05, r * 0.5, 0, 0, 6.2832); ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.fill();
    var lock = state === 'lock';
    // couronne dentée dorée
    ctx.beginPath(); var n = 12; for (var i = 0; i < n * 2; i++) { var a = i * Math.PI / n, rr = i % 2 ? r * 1.0 : r * 1.16, w2 = 0.11; ctx.lineTo(Math.cos(a - w2) * rr, Math.sin(a - w2) * rr); ctx.lineTo(Math.cos(a + w2) * rr, Math.sin(a + w2) * rr); } ctx.closePath();
    var g = ctx.createLinearGradient(0, -r, 0, r); if (lock) { g.addColorStop(0, '#aeb6cc'); g.addColorStop(1, '#5a6280'); } else { g.addColorStop(0, '#fff0b0'); g.addColorStop(0.5, '#eeb040'); g.addColorStop(1, '#9a5e18'); }
    ctx.fillStyle = g; ctx.fill(); ctx.lineJoin = 'round'; ctx.lineWidth = 3; ctx.strokeStyle = lock ? '#1c2036' : '#3a2008'; ctx.stroke();
    ctx.beginPath(); ctx.arc(0, 0, r * 0.84, 0, 6.2832); var d = ctx.createRadialGradient(-r * 0.3, -r * 0.35, r * 0.1, 0, 0, r * 0.9);
    if (lock) { d.addColorStop(0, '#59607c'); d.addColorStop(1, '#262a40'); } else if (state === 'done') { d.addColorStop(0, '#d84a4a'); d.addColorStop(1, '#7a1422'); } else { d.addColorStop(0, '#ff7a4a'); d.addColorStop(1, '#a8241c'); }
    ctx.fillStyle = d; ctx.fill(); ctx.lineWidth = 2.5; ctx.strokeStyle = lock ? '#1c2036' : '#3a1206'; ctx.stroke();
    ctx.beginPath(); ctx.arc(0, 0, r * 0.84, Math.PI * 1.1, Math.PI * 1.9); ctx.lineWidth = 2; ctx.strokeStyle = 'rgba(255,255,255,0.35)'; ctx.stroke();
    if (lock) G.lock(0, 2, r * 0.9); else G.text(num, 0, 1, r * (num > 9 ? 0.82 : 0.95), { grad: ['#fffbe6', '#ffe08a'], lw: 4 });
    ctx.restore();
  }
  var mapT = 0;
  function drawMap() {
    var t = B.t, i, total = B.totalStars(), nl = nextLevel(), w = App.mapWorld, wd = RE.WORLDS[w - 1], open = worldOpen(w);
    clampScroll(); var sc = App.mapScroll, oy = MY - sc;
    if (!App.mapCache[w]) App.mapCache[w] = buildMap(w);
    ctx.fillStyle = '#10152f'; ctx.fillRect(0, 0, W, H);
    ctx.save(); ctx.beginPath(); ctx.rect(0, MY, W, VIEWH); ctx.clip();
    ctx.drawImage(App.mapCache[w], 0, oy);
    U.zone('mapdrag', 0, MY, W, VIEWH, null, { silent: true, drag: function (p, first) { if (first) { App.dragY = p.y; App.dragS = App.mapScroll; } else { App.mapScroll = App.dragS + (App.dragY - p.y); clampScroll(); } } });
    // étincelles sur les niveaux restaurés
    mapT += B.dt;
    if (mapT > 0.1) { mapT = 0; var done = []; for (i = 0; i < wd.count; i++) if (save.stars[wd.first + i]) done.push(wd.first + i); if (done.length) { var q = lvlPos(done[Math.floor(Math.random() * done.length)]); B.spark(q.x + (Math.random() - 0.5) * 260, q.y + oy + (Math.random() - 0.5) * 220, 1, Math.random() < 0.5 ? '#ffe7a0' : '#bfe8ff', { v: 16, up: 22, g: -10, life: 1.8, r: 3 }); } }
    B.drawParts(B.dt);
    // coffres
    CHESTS.forEach(function (c) {
      if (c.world !== w) return;
      var x = c.x, y = c.y + oy, opened = save.chests[c.id], can = !opened && total >= c.need;
      G.chest(x, y + (can ? Math.sin(t * 5) * 4 : 0), 40, opened, can ? 0.7 + 0.3 * Math.sin(t * 4) : 0);
      if (!opened) { G.rr(x - 40, y + 30, 80, 30, 15); ctx.fillStyle = 'rgba(12,16,44,0.9)'; ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = '#e8b04a'; ctx.stroke(); G.star(x - 24, y + 45, 10, true); G.text(Math.min(total, c.need) + '/' + c.need, x + 8, y + 46, 16, { lw: 2.5, maxW: 54 }); }
      if (y > MY - 40 && y < MY + VIEWH + 40) U.zone('ch_' + c.id, x - 50, y - 50, 100, 110, function () {
        if (opened) return;
        if (can) { save.chests[c.id] = 1; save.coins += c.coins; save.hints += c.hints; if (c.skin) save.items['skin_' + c.skin] = 1; B.persist(); B.audio.sfx('coffre'); App.modal = 'chest'; App.chest = { c: c, t: 0 }; }
        else { App.toast = { t: 0, txt: B.F({ fr: 'Ce coffre s’ouvre avec {n} étoiles', en: 'This chest opens with {n} stars' }, { n: c.need }) }; B.audio.sfx('refus'); }
      }, { silent: true });
    });
    // médaillons
    for (i = 0; i < wd.count; i++) {
      var id = wd.first + i, p = lvlPos(id), y = p.y + oy, st = save.stars[id] || 0, op = unlocked(id);
      if (y < MY - 80 || y > MY + VIEWH + 80) continue;
      if (id === nl && op) {
        var pu = 0.5 + 0.5 * Math.sin(t * 4);
        ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.beginPath(); ctx.arc(p.x, y, 48 + pu * 9, 0, 6.2832); ctx.lineWidth = 7; ctx.strokeStyle = 'rgba(255,235,150,' + (0.5 + 0.4 * pu) + ')'; ctx.stroke(); ctx.restore();
      }
      medal(p.x, y, 33, id, !op ? 'lock' : st ? 'done' : 'open', t);
      if (st > 0) for (var k = 0; k < 3; k++) G.star(p.x + (k - 1) * 19, y + 40 + (k === 1 ? 4 : 0), 9, k < st);
      if (id === nl && op) {
        var by = y - 84 - Math.abs(Math.sin(t * 3.2)) * 14; ctx.save(); ctx.translate(p.x, by); ctx.beginPath(); ctx.moveTo(0, 26); ctx.lineTo(-20, -5); ctx.lineTo(-8, -5); ctx.lineTo(-8, -26); ctx.lineTo(8, -26); ctx.lineTo(8, -5); ctx.lineTo(20, -5); ctx.closePath();
        var ag = ctx.createLinearGradient(0, -26, 0, 26); ag.addColorStop(0, '#fff3a8'); ag.addColorStop(1, '#f09a1a'); ctx.fillStyle = ag; ctx.fill(); ctx.lineWidth = 4; ctx.lineJoin = 'round'; ctx.strokeStyle = '#5a2c08'; ctx.stroke(); ctx.restore();
      }
      (function (id, op, p, y) {
        U.zone('lvl' + id, p.x - 40, y - 40, 80, 84, function () {
          if (op) App.go('play', id);
          else { App.toast = { t: 0, txt: B.F({ fr: 'Termine d’abord le niveau {n}', en: 'Finish level {n} first' }, { n: id - 1 }) }; B.audio.sfx('refus'); }
        }, { silent: !op });
      })(id, op, p, y);
    }
    ctx.restore();
    // monde verrouillé
    if (!open) {
      ctx.fillStyle = 'rgba(8,10,28,0.55)'; ctx.fillRect(0, MY, W, VIEWH);
      G.panel(110, 640, W - 220, 380);
      G.lock(W / 2, 720, 80);
      G.text(T(wd.name), W / 2, 820, 36, { grad: G.GOLD, maxW: W - 300 });
      var prev = RE.WORLDS[w - 2];
      G.text(B.F({ fr: 'Termine le niveau {n}', en: 'Finish level {n}' }, { n: wd.first - 1 }) + (save.stars[wd.first - 1] ? '  ✓' : ''), W / 2, 890, 26, { weight: 700, color: save.stars[wd.first - 1] ? '#bfe6a8' : '#fff3d6' });
      G.star(W / 2 - 150, 944, 16, true); G.text(B.F({ fr: 'Réunis {n} étoiles ({m}/{n})', en: 'Collect {n} stars ({m}/{n})' }, { n: GATES[w], m: Math.min(total, GATES[w]) }), W / 2 + 14, 946, 26, { weight: 700, color: total >= GATES[w] ? '#bfe6a8' : '#fff3d6', maxW: 420 });
    }
    // bandeau du monde + flèches
    var im = IMG.banner, bw = 620, bh = bw * im.height / im.width * 0.92; ctx.save(); ctx.shadowColor = 'rgba(0,0,0,0.6)'; ctx.shadowBlur = 16; ctx.shadowOffsetY = 6; ctx.drawImage(im, W / 2 - bw / 2, MY + 14, bw, bh); ctx.restore();
    var nd = 0; for (i = 0; i < wd.count; i++) if (save.stars[wd.first + i]) nd++;
    G.text(T(wd.name), W / 2, MY + 14 + bh * 0.4, 33, { grad: G.GOLD, maxW: bw - 150 });
    G.text(T({ fr: 'Monde ', en: 'World ' }) + w + ' · ' + nd + '/' + wd.count, W / 2, MY + 14 + bh * 0.72, 20, { weight: 700, color: '#bfd4ff', lw: 3 });
    if (w > 1) roundBtn('w_prev', 62, MY + 14 + bh / 2, 36, icoBack, function () { App.mapWorld = w - 1; App.mapScroll = MAPH - VIEWH; var n2 = nextLevel(); if (n2) centerMap(n2); });
    if (w < RE.WORLDS.length) roundBtn('w_next', W - 62, MY + 14 + bh / 2, 36, function (r) { ctx.scale(-1, 1); icoBack(r); }, function () { App.mapWorld = w + 1; App.mapScroll = MAPH - VIEWH; var n2 = nextLevel(); if (n2) centerMap(n2); });
    // barre du haut
    var tg = ctx.createLinearGradient(0, 0, 0, MY); tg.addColorStop(0, '#232c62'); tg.addColorStop(1, '#141a3e'); ctx.fillStyle = tg; ctx.fillRect(0, 0, W, MY);
    ctx.fillStyle = '#e8b04a'; ctx.fillRect(0, MY - 5, W, 5); ctx.fillStyle = '#3a2410'; ctx.fillRect(0, MY - 1, W, 2);
    roundBtn('m_home', 72, 64, 40, icoHome, function () { App.go('home'); });
    counter(150, 64, 200, function (x, y) { G.star(x, y, 17, true); }, total + '/' + (RE.LEVELS.length * 3));
    counter(368, 64, 200, function (x, y) { G.coin(x, y, 17); }, save.coins);
    counter(586, 64, 150, function (x, y) { ctx.save(); ctx.translate(x, y); ctx.beginPath(); ctx.arc(0, -3, 11, 0, 6.2832); ctx.fillStyle = '#ffe08a'; ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = '#5a2c08'; ctx.stroke(); ctx.fillStyle = '#c9d2e6'; ctx.fillRect(-5, 8, 10, 7); ctx.strokeRect(-5, 8, 10, 7); ctx.restore(); }, save.hints);
    roundBtn('m_set', W - 72, 64, 40, function (r) { ctx.fillStyle = '#fff6e0'; ctx.strokeStyle = '#3a1c06'; ctx.lineWidth = 2; for (var i = 0; i < 8; i++) { ctx.save(); ctx.rotate(i * Math.PI / 4 + B.t * 0.3); ctx.fillRect(-r * 0.1, -r * 0.6, r * 0.2, r * 0.25); ctx.restore(); } ctx.beginPath(); ctx.arc(0, 0, r * 0.4, 0, 6.2832); ctx.fill(); ctx.stroke(); ctx.beginPath(); ctx.arc(0, 0, r * 0.16, 0, 6.2832); ctx.fillStyle = '#b8701e'; ctx.fill(); }, function () { App.modal = 'settings'; });
    // barre du bas
    var y0 = MY + VIEWH; var bg2 = ctx.createLinearGradient(0, y0, 0, H); bg2.addColorStop(0, '#1c2452'); bg2.addColorStop(1, '#10152f'); ctx.fillStyle = bg2; ctx.fillRect(0, y0, W, H - y0);
    ctx.fillStyle = '#e8b04a'; ctx.fillRect(0, y0, W, 5); ctx.fillStyle = '#3a2410'; ctx.fillRect(0, y0 - 1, W, 2);
    var bw2 = (W - 80) / 3;
    U.button('m_play', 'orange', 24, y0 + 24, bw2, 86, nl ? T({ fr: 'NIVEAU ', en: 'LEVEL ' }) + nl : T({ fr: 'REJOUER', en: 'REPLAY' }), function () { if (nl) App.go('play', nl); else { App.toast = { t: 0, txt: T({ fr: 'Gagne plus d’étoiles pour ouvrir la suite', en: 'Earn more stars to open what comes next' }) }; } }, { size: 28 });
    U.button('m_col', 'blue', 40 + bw2, y0 + 24, bw2, 86, T({ fr: 'COLLECTION', en: 'COLLECTION' }), function () { App.go('collection'); }, { size: 26 });
    U.button('m_up', 'blue', 56 + bw2 * 2, y0 + 24, bw2, 86, T({ fr: 'AMÉLIORATIONS', en: 'UPGRADES' }), function () { App.go('upgrades'); }, { size: 24 });
    if (App.toast) { App.toast.t += B.dt; var a = Math.min(1, App.toast.t * 6, (2.8 - App.toast.t) * 3); if (a <= 0) App.toast = null; else { ctx.save(); ctx.globalAlpha = a; G.font(25, 900); var mw = Math.min(860, ctx.measureText(App.toast.txt).width + 70); G.rr(W / 2 - mw / 2, 1440, mw, 60, 30); ctx.fillStyle = 'rgba(12,16,44,0.95)'; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = '#e8b04a'; ctx.stroke(); G.text(App.toast.txt, W / 2, 1471, 25, { maxW: 800, lw: 3 }); ctx.restore(); } }
  }

  /* ───────── collection ───────── */
  function pageBg(ttl) {
    ctx.drawImage(IMG.home, 0, 0, W, H); ctx.fillStyle = 'rgba(8,10,30,0.86)'; ctx.fillRect(0, 0, W, H);
    G.panel(30, 150, W - 60, H - 200, { gems: false });
    title(ttl, 150, 44);
    roundBtn('back', 72, 64, 40, icoBack, function () { App.go(App.from || 'map'); });
    counter(W - 240, 64, 200, function (x, y) { G.coin(x, y, 17); }, save.coins);
  }
  function section(txt, y, right) { G.text(txt, 70, y, 27, { align: 'left', grad: G.GOLD }); if (right) G.text(right, W - 70, y, 24, { align: 'right', color: '#9fd6ff', weight: 700 }); ctx.fillStyle = 'rgba(232,176,74,0.5)'; ctx.fillRect(70, y + 22, W - 140, 2); }
  function drawCollection() {
    var i, t = B.t, NL = RE.LEVELS.length;
    pageBg(T({ fr: 'COLLECTION', en: 'COLLECTION' }));
    var nb = 0, byType = {}, types = ['porte', 'moulin', 'forge', 'cascade', 'roue', 'lanterne', 'pont', 'tour', 'mine', 'grue', 'chateau'];
    RE.LEVELS.forEach(function (L) { var o = byType[L.building] = byType[L.building] || { n: 0, d: 0 }; o.n++; if (save.stars[L.id]) { o.d++; nb++; } });
    section(T({ fr: 'Bâtiments restaurés', en: 'Restored buildings' }), 250, nb + '/' + NL);
    types.forEach(function (ty, k) {
      var o = byType[ty] || { n: 0, d: 0 }, row = k < 6 ? 0 : 1, col = k < 6 ? k : k - 6, x = (row ? 188 : 118) + col * 141, y = 350 + row * 150, on = o.d > 0;
      ctx.drawImage(IMG['m_' + ty + (on ? '' : '_f')], x - 50, y - 50, 100, 100); P.ring(x, y, 50, 5);
      if (!on) G.lock(x, y + 2, 34);
      G.text(T(RE.NAMES[ty]) + ' ' + o.d + '/' + o.n, x, y + 68, 17, { weight: 700, color: on ? '#fff3d6' : '#8f98c4', maxW: 136, lw: 2.5 });
    });
    section(T({ fr: 'Rouages rares', en: 'Rare gears' }), 640, T({ fr: 'Touche pour équiper', en: 'Tap to equip' }));
    Object.keys(RE.SKINS).forEach(function (k, n) {
      var sk = RE.SKINS[k], x = 140 + n * 220, y = 770, own = k === 'or' || save.items['skin_' + k], sel = save.skin === k;
      if (sel) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; var g = ctx.createRadialGradient(x, y, 30, x, y, 120); g.addColorStop(0, 'rgba(255,220,120,0.5)'); g.addColorStop(1, 'rgba(255,220,120,0)'); ctx.fillStyle = g; ctx.fillRect(x - 120, y - 120, 240, 240); ctx.restore(); }
      var im = sk.hue === null ? IMG.gear_gold_M : B.tinted('gear_gold_M', sk.hue);
      ctx.save(); if (!own) ctx.globalAlpha = 0.35; P.drawGear('gold', 'M', x, y, sel ? t * 0.6 : 0.2, 1.05, im); ctx.restore();
      if (!own) G.lock(x, y + 2, 46);
      G.text(T(sk.name), x, y + 100, 20, { weight: 700, color: own ? '#fff3d6' : '#8f98c4', maxW: 200, lw: 2.5 });
      var ch = CHESTS.filter(function (c) { return c.skin === k; })[0];
      G.text(sel ? T({ fr: 'Équipé', en: 'Equipped' }) : own ? T({ fr: 'Disponible', en: 'Available' }) : B.F({ fr: 'Coffre {n} étoiles', en: '{n}-star chest' }, { n: ch.need }), x, y + 128, 17, { weight: 700, color: sel ? '#ffe08a' : '#9fd6ff', lw: 2.5 });
      U.zone('sk_' + k, x - 100, y - 95, 200, 240, function () { if (own) { save.skin = k; B.persist(); B.audio.sfx('pose'); } else B.audio.sfx('refus'); }, { silent: true });
    });
    var nc = 0; for (i = 1; i <= NL; i++) if (save.stars[i] === 3) nc++;
    section(T({ fr: 'Cristaux d’énergie', en: 'Energy crystals' }), 970, nc + '/' + NL);
    RE.WORLDS.forEach(function (wd, k) {
      var c3 = 0; for (var q = 0; q < wd.count; q++) if (save.stars[wd.first + q] === 3) c3++;
      var cx = 160 + (k % 3) * 270, cy = 1040 + Math.floor(k / 3) * 62; ctx.save(); if (!c3) ctx.globalAlpha = 0.3; G.gem(cx - 78, cy + (c3 ? Math.sin(t * 2 + k) * 3 : 0), 18, ['#3fb0ff', '#ffcf4a', '#b070ff'][k % 3]); ctx.restore();
      G.text(c3 + '/' + wd.count, cx - 20, cy, 24, { color: c3 ? '#ffe08a' : '#8f98c4' });
      G.text(T(wd.name), cx + 18, cy + 1, 14, { align: 'left', weight: 700, color: '#9fd6ff', maxW: 128, lw: 2 });
    });
    G.text(T({ fr: 'Un cristal par niveau terminé avec 3 étoiles', en: 'One crystal per level finished with 3 stars' }), W / 2, 1152, 19, { weight: 700, color: '#9fd6ff', lw: 2.5 });
    var no = 0; CHESTS.forEach(function (c) { if (save.chests[c.id]) no++; });
    section(T({ fr: 'Trésors et coffres', en: 'Treasures and chests' }), 1210, T({ fr: 'Coffres ouverts ', en: 'Chests opened ' }) + no + '/' + CHESTS.length);
    TREASURES.forEach(function (tr, n) {
      var x = 150 + n * 215, y = 1322, has = save.items[tr.id];
      ctx.drawImage(IMG[tr.img + (has ? '' : '_f')], x - 62, y - 62, 124, 124); P.ring(x, y, 62, 6); if (!has) G.lock(x, y + 2, 42);
      G.text(T(tr.name), x, y + 88, 20, { weight: 700, color: has ? '#fff3d6' : '#8f98c4', maxW: 206, lw: 2.5 });
      G.text(has ? T({ fr: 'Découvert', en: 'Found' }) : T(tr.how), x, y + 116, 15, { weight: 700, color: '#9fd6ff', maxW: 208, lw: 2 });
    });
    CHESTS.forEach(function (c, n) { var x = 500 + (n % 4) * 104, y = 1282 + Math.floor(n / 4) * 88; G.chest(x, y, 26, save.chests[c.id], 0); G.text(c.need + ' ★', x, y + 44, 16, { weight: 700, color: save.chests[c.id] ? '#ffe08a' : '#8f98c4', lw: 2.5 }); });
    G.text(T({ fr: 'Les coffres s’ouvrent sur les cartes du royaume', en: 'Chests are opened on the kingdom maps' }), W / 2, 1560, 20, { weight: 700, color: '#cfd8ff', maxW: W - 160, lw: 2.5 });
  }

  /* ───────── améliorations ───────── */
  function drawUpgrades() {
    pageBg(T({ fr: 'AMÉLIORATIONS', en: 'UPGRADES' }));
    G.text(T({ fr: 'Dépense tes pièces pour renforcer ton atelier', en: 'Spend your coins to strengthen your workshop' }), W / 2, 250, 23, { weight: 700, color: '#9fd6ff', maxW: W - 140 });
    UPS.forEach(function (u, n) {
      var y = 310 + n * 290, lvl = u.max ? save.up[u.id] : 0, maxed = u.max && lvl >= u.max, cost = maxed ? 0 : u.cost[Math.min(lvl, u.cost.length - 1)], can = !maxed && save.coins >= cost;
      G.panel(60, y, W - 120, 260, { cut: 20, gems: false, top: '#33427f', mid: '#222c5e', bot: '#1a2148' });
      // icône
      var ix = 160, iy = y + 130;
      if (u.id === 'indice') { ctx.save(); ctx.translate(ix, iy); var gl = ctx.createRadialGradient(0, -10, 6, 0, -10, 70); gl.addColorStop(0, 'rgba(255,230,140,0.7)'); gl.addColorStop(1, 'rgba(255,230,140,0)'); ctx.fillStyle = gl; ctx.fillRect(-70, -80, 140, 140); ctx.beginPath(); ctx.arc(0, -12, 32, 0, 6.2832); var bg = ctx.createRadialGradient(-10, -22, 4, 0, -12, 32); bg.addColorStop(0, '#fffbe0'); bg.addColorStop(1, '#f2b33a'); ctx.fillStyle = bg; ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = '#5a2c08'; ctx.stroke(); G.rr(-15, 20, 30, 24, 5); ctx.fillStyle = '#c9d2e6'; ctx.fill(); ctx.stroke(); ctx.restore(); }
      if (u.id === 'huile') { P.drawGear('gold', 'M', ix, iy, B.t * 0.8, 0.8, IMG.gear_gold_M); }
      if (u.id === 'sablier') { ctx.save(); ctx.translate(ix, iy); ctx.fillStyle = '#ffe08a'; ctx.strokeStyle = '#5a2c08'; ctx.lineWidth = 4; ctx.lineJoin = 'round'; ctx.beginPath(); ctx.moveTo(-30, -44); ctx.lineTo(30, -44); ctx.lineTo(6, 0); ctx.lineTo(30, 44); ctx.lineTo(-30, 44); ctx.lineTo(-6, 0); ctx.closePath(); ctx.fill(); ctx.stroke(); G.rr(-38, -54, 76, 12, 5); ctx.fillStyle = '#c8841e'; ctx.fill(); ctx.stroke(); G.rr(-38, 42, 76, 12, 5); ctx.fill(); ctx.stroke(); ctx.restore(); }
      if (u.id === 'moulin') { ctx.drawImage(IMG.m_moulin, ix - 58, iy - 58, 116, 116); P.ring(ix, iy, 58, 6); }
      G.text(T(u.name), 260, y + 62, 33, { align: 'left', grad: G.GOLD, maxW: 560 });
      G.text(T(u.desc), 260, y + 108, 22, { align: 'left', weight: 700, color: '#e8ecff', maxW: 580 });
      if (u.max) for (var k = 0; k < u.max; k++) { G.gem(280 + k * 44, y + 160, 12, k < lvl ? '#ffcf4a' : '#39406a'); }
      else G.text(T({ fr: 'En stock : ', en: 'In stock: ' }) + save.hints, 260, y + 160, 22, { align: 'left', weight: 700, color: '#ffe08a' });
      if (maxed) G.text(T({ fr: 'NIVEAU MAXIMUM', en: 'MAX LEVEL' }), W - 240, y + 196, 24, { color: '#ffe08a', maxW: 300 });
      else U.button('up_' + u.id, can ? 'orange' : 'blue', W - 400, y + 152, 310, 84, cost + '', function () {
        if (!can) { B.audio.sfx('refus'); App.toast2 = { t: 0, txt: T({ fr: 'Pas assez de pièces', en: 'Not enough coins' }) }; return; }
        save.coins -= cost; if (u.max) save.up[u.id]++; else save.hints++; B.persist(); B.audio.sfx('piece'); B.spark(W - 245, y + 194, 18, '#ffe08a', { v: 200 });
      }, { disabled: !can, silent: true, icon: function (x, yy) { G.coin(x, yy, 21); } });
    });
    if (Ads.ready()) U.button('up_ad', 'blue', 180, 1490, W - 360, 84, T({ fr: '1 INDICE GRATUIT (PUB)', en: '1 FREE HINT (AD)' }), function () { Ads.rewarded(function (ok) { if (ok) { save.hints++; B.persist(); B.audio.sfx('indice'); } }); }, { size: 26 });
    if (App.toast2) { App.toast2.t += B.dt; if (App.toast2.t > 1.8) App.toast2 = null; else G.text(App.toast2.txt, W / 2, 1600, 26, { color: '#ffb0a0' }); }
    B.drawParts(B.dt);
  }

  /* ───────── paramètres et coffre ───────── */
  var confirmReset = 0;
  function drawSettings() {
    dim(0.78);
    G.panel(90, 330, W - 180, 1010);
    title(T({ fr: 'PARAMÈTRES', en: 'SETTINGS' }), 370, 42);
    slider('s_mus', 190, 540, W - 380, save.music, function (v) { save.music = v; B.persist(); }, T({ fr: 'Musique', en: 'Music' }));
    slider('s_sfx', 190, 680, W - 380, save.sfx, function (v) { if (v !== save.sfx) { save.sfx = v; B.persist(); B.audio.sfx('tic'); } }, T({ fr: 'Effets sonores', en: 'Sound effects' }));
    U.button('s_lang', 'blue', 190, 760, W - 380, 80, T({ fr: 'LANGUE', en: 'LANGUAGE' }) + ' : ' + RE.LANGS[save.lang][0], function () { App.modal = 'langs'; }, { size: 26, icon: function (x, y, h) { var f = IMG['f_' + save.lang]; if (f && f.naturalWidth) ctx.drawImage(f, x - 24, y - 17, 48, 34); } });
    U.button('s_site', 'blue', 190, 856, W - 380, 80, T({ fr: 'NOS AUTRES JEUX', en: 'OUR OTHER GAMES' }), openSite, { size: 28 });
    var dy = plugin() ? 96 : 0;
    if (dy) U.button('s_pubs', 'blue', 190, 952, W - 380, 80, T({ fr: 'MES CHOIX POUR LES PUBLICITÉS', en: 'MY AD CHOICES' }), function () { Ads.start(true); }, { size: 23 });
    if (confirmReset > 0) confirmReset -= B.dt;
    U.button('s_reset', 'red', 190, 952 + dy, W - 380, 80, confirmReset > 0 ? T({ fr: 'TOUCHE ENCORE POUR CONFIRMER', en: 'TAP AGAIN TO CONFIRM' }) : T({ fr: 'EFFACER LA PROGRESSION', en: 'ERASE PROGRESS' }), function () {
      if (confirmReset > 0) { B.resetSave(); confirmReset = 0; App.modal = null; App.mapCache = {}; App.go('home'); } else confirmReset = 3;
    }, { size: 25 });
    U.button('s_ok', 'orange', 250, 1066 + dy, W - 500, 92, T({ fr: 'FERMER', en: 'CLOSE' }), function () { App.modal = null; confirmReset = 0; });
    G.text('Les Rouages Enchantés · version 1.0', W / 2, 1210 + dy * 0.75, 20, { weight: 700, color: '#9fa8d6', lw: 2.5 });
    G.text('© Conte Games Studio', W / 2, 1244 + dy * 0.72, 20, { weight: 700, color: '#9fa8d6', lw: 2.5 });
  }
  function drawAge() {
    dim(0.86);
    G.panel(110, 520, W - 220, 600);
    title(T({ fr: 'QUEL ÂGE AS-TU ?', en: 'HOW OLD ARE YOU?' }), 566, 40);
    G.text(T({ fr: 'Pour te montrer des publicités adaptées', en: 'So we can show you suitable ads' }), W / 2, 700, 25, { maxW: W - 300, weight: 700, color: '#e8ecff', lw: 3 });
    function choix(v) { save.adulte = v; B.persist(); App.modal = null; Ads.start(false); }
    U.button('ag_m', 'blue', 190, 780, W - 380, 100, T({ fr: 'MOINS DE 16 ANS', en: 'UNDER 16' }), function () { choix(false); }, { size: 30 });
    U.button('ag_p', 'orange', 190, 910, W - 380, 100, T({ fr: '16 ANS OU PLUS', en: '16 OR OLDER' }), function () { choix(true); }, { size: 30 });
  }
  function drawLangs() {
    dim(0.84);
    G.panel(40, 200, W - 80, 1300);
    title(T({ fr: 'LANGUE', en: 'LANGUAGE' }), 240, 42);
    var codes = B.langs, cols = 3, bw = (W - 80 - 80) / cols, bh = 132;
    codes.forEach(function (k, i) {
      var x = 80 + (i % cols) * bw, y = 330 + Math.floor(i / cols) * (bh + 12), sel = k === save.lang, pr = U.zone('lg_' + k, x + 5, y, bw - 10, bh, function () { save.lang = k; B.persist(); App.modal = 'settings'; }, {});
      G.rr(x + 5, y, bw - 10, bh, 18); ctx.fillStyle = sel ? 'rgba(232,176,74,0.30)' : pr ? 'rgba(255,255,255,0.14)' : 'rgba(10,14,40,0.55)'; ctx.fill(); ctx.lineWidth = sel ? 4 : 2; ctx.strokeStyle = sel ? '#ffe08a' : 'rgba(232,176,74,0.55)'; ctx.stroke();
      var f = IMG['f_' + k]; if (f && f.naturalWidth) ctx.drawImage(f, x + bw / 2 - 36, y + 14, 72, 51);
      ctx.save(); var old = save.lang; save.lang = k; G.text(RE.LANGS[k][0], x + bw / 2, y + 100, 25, { maxW: bw - 30, weight: 700, color: '#fff3d6', lw: 3 }); save.lang = old; ctx.restore();
    });
    U.button('lg_close', 'orange', 280, 1370, W - 560, 88, T({ fr: 'FERMER', en: 'CLOSE' }), function () { App.modal = 'settings'; });
  }
  function drawChest() {
    var ch = App.chest, c = ch.c; ch.t += B.dt; dim(0.8);
    G.panel(110, 440, W - 220, 800);
    title(T({ fr: 'COFFRE OUVERT !', en: 'CHEST OPENED!' }), 480, 40);
    var k = B.ease.back(B.ease.clamp(ch.t / 0.5)); G.chest(W / 2, 650, 110 * k, true, 1);
    if (ch.t < 1.2 && Math.random() < 0.5) B.spark(W / 2, 610, 2, '#ffe08a', { v: 260, up: 200, g: 300, r: 5 });
    if (c.skin) { var sk = RE.SKINS[c.skin]; P.drawGear('gold', 'M', W / 2 - 220, 880, B.t * 0.7, 0.8, B.tinted('gear_gold_M', sk.hue)); G.text(T({ fr: 'Rouage ', en: 'Gear ' }) + T(sk.name), W / 2 - 220, 970, 21, { weight: 700, maxW: 210 }); }
    else { G.star(W / 2 - 220, 878, 44, true); G.text(T({ fr: 'Bravo !', en: 'Well done!' }), W / 2 - 220, 970, 24, { color: '#ffe08a' }); }
    G.coin(W / 2, 880, 44); G.text('+' + c.coins, W / 2, 970, 26, { color: '#ffe08a' });
    ctx.save(); ctx.translate(W / 2 + 220, 876); ctx.beginPath(); ctx.arc(0, -8, 34, 0, 6.2832); var bg = ctx.createRadialGradient(-10, -18, 4, 0, -8, 34); bg.addColorStop(0, '#fffbe0'); bg.addColorStop(1, '#f2b33a'); ctx.fillStyle = bg; ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = '#5a2c08'; ctx.stroke(); G.rr(-15, 26, 30, 22, 5); ctx.fillStyle = '#c9d2e6'; ctx.fill(); ctx.stroke(); ctx.restore();
    G.text('+' + c.hints + ' ' + T({ fr: 'Indices', en: 'Hints' }), W / 2 + 220, 970, 24, { color: '#ffe08a' });
    U.button('c_ok', 'orange', 260, 1080, W - 520, 92, T({ fr: 'SUPER !', en: 'GREAT!' }), function () { App.modal = null; });
    B.drawParts(B.dt);
  }
  /* écran du studio, affiché quelques secondes avant l'accueil (un toucher le passe) */
  function drawStudio() {
    var t = B.t - App.t0, im = IMG.studio, y = (H - W) / 2;
    ctx.fillStyle = '#04050c'; ctx.fillRect(0, 0, W, H);
    ctx.save(); ctx.globalAlpha = 0.35; ctx.drawImage(im, 0, 0, im.width, im.height * 0.04, 0, 0, W, y + 2); ctx.drawImage(im, 0, im.height * 0.96, im.width, im.height * 0.04, 0, y + W - 2, W, H - y - W + 2); ctx.restore();
    var k = 1 + 0.03 * B.ease.out(Math.min(1, t / 2.6));
    ctx.save(); ctx.translate(W / 2, H / 2); ctx.scale(k, k); ctx.drawImage(im, -W / 2, -W / 2, W, W); ctx.restore();
    var g1 = ctx.createLinearGradient(0, 0, 0, y + 90); g1.addColorStop(0, 'rgba(4,5,12,1)'); g1.addColorStop(0.75, 'rgba(4,5,12,0.85)'); g1.addColorStop(1, 'rgba(4,5,12,0)'); ctx.fillStyle = g1; ctx.fillRect(0, 0, W, y + 90);
    var g2 = ctx.createLinearGradient(0, y + W - 90, 0, H); g2.addColorStop(0, 'rgba(4,5,12,0)'); g2.addColorStop(0.25, 'rgba(4,5,12,0.85)'); g2.addColorStop(1, 'rgba(4,5,12,1)'); ctx.fillStyle = g2; ctx.fillRect(0, y + W - 90, W, H - y - W + 90);
    if (Math.random() < 0.3) B.spark(80 + Math.random() * 780, y + Math.random() * W, 1, '#ffe7a0', { v: 14, up: 20, g: -8, life: 1.8, r: 2.6 });
    B.drawParts(B.dt);
    U.zone('studio', 0, 0, W, H, function () { App.go('home'); }, { silent: true });
    if (t > 3.4) App.go('home');
  }
  function drawLoad() {
    ctx.fillStyle = '#0d1230'; ctx.fillRect(0, 0, W, H);
    var k = B.loaded / B.total;
    if (IMG.logo.complete && IMG.logo.naturalWidth) { var w = 720, h = w * IMG.logo.height / IMG.logo.width; ctx.drawImage(IMG.logo, W / 2 - w / 2, 1040 - h, w, h); }
    G.rr(220, 1080, W - 440, 22, 11); ctx.fillStyle = '#060818'; ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = '#e8b04a'; ctx.stroke();
    G.rr(220, 1080, Math.max(22, (W - 440) * k), 22, 11); ctx.fillStyle = '#f2b33a'; ctx.fill();
    /* texte "CONTE GAMES STUDIO" désactivé temporairement (demande Anthony 13/11/2026, à remettre après validation stores) : G.text('CONTE GAMES STUDIO', W / 2, 1160, 24, { weight: 700, color: '#cfd8ff' }); */
    /* un toucher lance le jeu : c'est lui qui autorise le son (règle des navigateurs et des téléphones) */
    if (App.loadOk) U.button('l_go', 'orange', W / 2 - 230, 1240, 460, 110, T({ fr: 'TOUCHE POUR JOUER', en: 'TAP TO PLAY' }), function () { /* écran studio + jingle désactivés temporairement (demande Anthony 13/11/2026, à remettre après validation stores) */ enter('home'); App.fade = 1; App.fadeDir = -1; }, { size: 34 });
  }

  /* ───────── boucle ───────── */
  var last = 0, active = null;
  function frame(ts) {
    var dt = Math.min(0.05, (ts - last) / 1000 || 0); last = ts; B.dt = dt; B.t += dt;
    B.begin(); U.reset();
    if (App.screen === 'load') { drawLoad(); App.loadOk = B.ready && document.fonts && document.fonts.status !== 'loading'; }
    else {
      if (App.screen === 'play') { P.update(dt); P.draw(); }
      else if (App.screen === 'studio') drawStudio();
      else if (App.screen === 'home') drawHome();
      else if (App.screen === 'map') drawMap();
      else if (App.screen === 'collection') drawCollection();
      else if (App.screen === 'upgrades') drawUpgrades();
      if (App.modal === 'settings') drawSettings();
      if (App.modal === 'langs') drawLangs();
      if (App.modal === 'age') drawAge();
      if (App.modal === 'chest') drawChest();
      if (Ads.card) drawAdCard();
    }
    if (App.fadeDir) {
      App.fade += App.fadeDir * dt * 5;
      if (App.fadeDir > 0 && App.fade >= 1) { App.fade = 1; App.from = App.screen === 'home' ? 'home' : App.screen === 'map' ? 'map' : App.from; enter(App.next.name, App.next.arg); App.fadeDir = -1; }
      if (App.fadeDir < 0 && App.fade <= 0) { App.fade = 0; App.fadeDir = 0; }
    }
    if (App.fade > 0) { ctx.fillStyle = 'rgba(8,10,28,' + App.fade + ')'; ctx.fillRect(0, 0, W, H); }
    B.audio.tick(dt);
    requestAnimationFrame(frame);
  }
  B.onPointer({
    down: function (p) {
      if (App.fadeDir) return;
      var b = U.hit(p);
      if (b) { active = b; U.hot = b.id; if (b.o.drag) b.o.drag(p, true); }
      else { active = null; if (App.screen === 'play' && !App.modal) P.down(p); }
    },
    move: function (p) { if (active) { if (active.o.drag) active.o.drag(p, false); } else if (App.screen === 'play') P.moveP(p); },
    up: function (p) {
      if (active) {
        var b = U.hit(p), a = active; active = null; U.hot = null;
        if (b && b.id === a.id && a.fn && !a.o.disabled) { if (!a.o.silent) B.audio.sfx('clic'); a.fn(); }
        else if (b && b.id === a.id && a.fn && a.o.disabled) a.fn();
      } else if (App.screen === 'play') P.up(p);
    }
  });
  /* touche Retour (Android) / Échap */
  function goBack() {
    if (Ads.card || App.fadeDir) return;
    if (App.modal) { if (App.modal !== 'age') App.modal = null; return; }
    if (App.screen === 'play') { if (P.overlay === 'pause') P.overlay = null; else if (!P.overlay) P.overlay = 'pause'; else if (P.overlay === 'tip') { save.tips[P.L.id] = 1; P.overlay = null; } else App.go('map'); }
    else if (App.screen === 'map') App.go('home');
    else if (App.screen === 'collection' || App.screen === 'upgrades') App.go(App.from || 'map');
  }
  window.addEventListener('keydown', function (e) { if (e.key === 'Escape' || e.key === 'Backspace') { e.preventDefault(); goBack(); } });
  document.addEventListener('backbutton', goBack, false);
  try { var capApp = root.Capacitor && root.Capacitor.Plugins && root.Capacitor.Plugins.App; if (capApp) capApp.addListener('backButton', function () { if (App.screen === 'home' && !App.modal) capApp.exitApp(); else goBack(); }); } catch (e) { }
  document.addEventListener('visibilitychange', function () { if (document.hidden && App.screen === 'play' && !P.overlay && !P.won && !P.lost) P.overlay = 'pause'; });
  Ads.init();
  requestAnimationFrame(frame);
})(window);
