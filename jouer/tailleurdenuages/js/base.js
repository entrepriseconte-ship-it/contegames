/* Le Tailleur de Nuages - socle : taille d'ecran, sauvegarde, textes, sons, musiques, publicites, fenetres. */
(function () {
  var TN = window.TN, stage = TN.stage = document.getElementById('stage');
  TN.$ = function (html) { var d = document.createElement('div'); d.innerHTML = html.trim(); return d.firstChild; };

  /* ---------- taille : scene de 390 de large, hauteur 700 a 900 selon l'ecran ---------- */
  TN.H = 844; TN.scale = 1; TN.resizers = [];
  function fit() {
    var w = window.innerWidth, h = window.innerHeight;
    TN.H = Math.max(700, Math.min(900, Math.round(390 * h / w)));
    TN.scale = Math.min(w / 390, h / TN.H);
    stage.style.height = TN.H + 'px'; stage.classList.toggle('court', TN.H < 770);
    stage.style.transform = 'scale(' + TN.scale + ') translate(-50%,-50%)';
    TN.resizers.forEach(function (f) { f(); });
  }
  window.addEventListener('resize', fit);
  TN.fit = fit;
  /* position d'un pointeur dans la scene */
  TN.pos = function (e) { var r = stage.getBoundingClientRect(); return { x: (e.clientX - r.left) / TN.scale, y: (e.clientY - r.top) / TN.scale }; };

  /* ---------- sauvegarde ---------- */
  var KEY = 'tailleur_de_nuages_v1';
  var DEF = { v: 1, lang: null, age: null, coins: 150, stars: {}, chests: {}, skins: { nacre: 1 }, skin: 'nacre', music: true, sfx: true, wins: 0, sinceInter: 99, lastInter: 0, daily: '', vu: {} };
  function load() {
    var s = {}; try { s = JSON.parse(localStorage.getItem(KEY) || '{}') || {}; } catch (e) { s = {}; }
    for (var k in DEF) if (!(k in s)) s[k] = JSON.parse(JSON.stringify(DEF[k]));
    return s;
  }
  TN.S = load();
  TN.save = function () { try { localStorage.setItem(KEY, JSON.stringify(TN.S)); } catch (e) { } };
  TN.reset = function () { try { localStorage.removeItem(KEY); } catch (e) { } TN.S = load(); };
  TN.totalStars = function () { var n = 0; for (var k in TN.S.stars) n += TN.S.stars[k]; return n; };
  TN.unlocked = function (id) { return id === 1 || !!TN.S.stars[id - 1]; };
  TN.playable = function (id) { return !!TN.levels[id - 1]; };

  /* ---------- textes ---------- */
  TN.setLang = function (l) { TN.S.lang = l; TN.save(); document.documentElement.lang = l; };
  if (!TN.S.lang) {
    var nav = (navigator.language || 'fr').toLowerCase(), found = 'en';
    TN.LANGS.forEach(function (L) { if (nav === L[0].toLowerCase() || nav.split('-')[0] === L[0].split('-')[0].toLowerCase()) found = found === 'en' || nav === L[0].toLowerCase() ? L[0] : found; });
    if (/^zh-(tw|hk|hant)/.test(nav)) found = 'zh-Hant';
    if (/^(no|nn)\b/.test(nav)) found = 'nb';
    TN.S.lang = found;
  }
  TN.t = function (k, a, b) {
    var s = (TN.TX[TN.S.lang] && TN.TX[TN.S.lang][k]) || TN.TX.en[k] || TN.TX.fr[k] || k;
    return s.replace('{0}', a).replace('{1}', b);
  };

  /* ---------- icones ---------- */
  function ic(p) { return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">' + p + '</svg>'; }
  TN.ic = {
    note: ic('<path d="M9 18V5l11-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="17" cy="16" r="3"/>'),
    pause: ic('<path d="M8 5v14M16 5v14"/>'), undo: ic('<path d="M9 14L4 9l5-5"/><path d="M4 9h10a6 6 0 010 12h-3"/>'),
    redo: ic('<path d="M20 11a8 8 0 10-2.3 5.7"/><path d="M20 4v7h-7"/>'), bulb: ic('<path d="M9 18h6M10 21h4M12 3a6 6 0 00-4 10.5c.7.7 1 1.5 1 2.5h6c0-1 .3-1.800 1-2.500A6 6 0 0012 3z"/>'),
    rot: ic('<path d="M20 11a8 8 0 10-2.3 5.7"/><path d="M20 4v7h-7"/>'), cut: ic('<circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><path d="M20 4L8.100 15.900M14.500 14.500L20 20M8.100 8.100L12 12"/>'),
    play: ic('<path d="M7 4l13 8-13 8z" fill="currentColor"/>'), map: ic('<path d="M9 4L3 6v14l6-2 6 2 6-2V4l-6 2-6-2zM9 4v14M15 6v14"/>'),
    book: ic('<path d="M4 5a2 2 0 012-2h13v16H6a2 2 0 00-2 2V5z"/><path d="M4 21a2 2 0 002 2h13"/>'), gear: ic('<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.900 4.900l2.100 2.100M17 17l2.100 2.100M4.900 19.100L7 17M17 7l2.100-2.100"/>'),
    back: ic('<path d="M15 5l-7 7 7 7"/>'), lock: ic('<rect x="5" y="11" width="14" height="10" rx="2" fill="currentColor"/><path d="M8 11V7a4 4 0 018 0v4"/>'), check: ic('<path d="M5 12l5 5 9-10"/>'),
    home: ic('<path d="M3 11l9-8 9 8M5 10v10h14V10"/>')
  };

  /* ---------- drapeaux (dessines, pour s'afficher partout) ---------- */
  function st(cx, cy, r, c) { var p = []; for (var i = 0; i < 10; i++) { var a = -Math.PI / 2 + i * Math.PI / 5, q = i % 2 ? r * 0.4 : r; p.push((cx + q * Math.cos(a)).toFixed(1) + ',' + (cy + q * Math.sin(a)).toFixed(1)); } return '<polygon points="' + p.join(' ') + '" fill="' + c + '"/>'; }
  function v3(a, b, c) { return '<rect width="10" height="20" fill="' + a + '"/><rect x="10" width="10" height="20" fill="' + b + '"/><rect x="20" width="10" height="20" fill="' + c + '"/>'; }
  function h(cols) { var n = cols.length, o = ''; cols.forEach(function (c, i) { o += '<rect y="' + (20 * i / n) + '" width="30" height="' + (20 / n + 0.1) + '" fill="' + c + '"/>'; }); return o; }
  var F = {
    fr: v3('#0055a4', '#fff', '#ef4135'), it: v3('#009246', '#fff', '#ce2b37'), ro: v3('#002b7f', '#fcd116', '#ce1126'),
    de: h(['#000', '#dd0000', '#ffce00']), ru: h(['#fff', '#0039a6', '#d52b1e']), nl: h(['#ae1c28', '#fff', '#21468b']), pl: h(['#fff', '#dc143c']),
    uk: h(['#0057b7', '#ffd700']), id: h(['#ce1126', '#fff']), th: h(['#a51931', '#f4f5f8', '#2d2a4a', '#2d2a4a', '#f4f5f8', '#a51931']),
    es: h(['#aa151b', '#f1bf00', '#f1bf00', '#aa151b']),
    en: '<rect width="30" height="20" fill="#012169"/><path d="M0 0l30 20M30 0L0 20" stroke="#fff" stroke-width="4"/><path d="M0 0l30 20M30 0L0 20" stroke="#c8102e" stroke-width="1.600"/><path d="M15 0v20M0 10h30" stroke="#fff" stroke-width="6"/><path d="M15 0v20M0 10h30" stroke="#c8102e" stroke-width="3.400"/>',
    'pt-BR': '<rect width="30" height="20" fill="#009b3a"/><polygon points="15,2.500 27,10 15,17.500 3,10" fill="#fedf00"/><circle cx="15" cy="10" r="4.400" fill="#002776"/>',
    ja: '<rect width="30" height="20" fill="#fff"/><circle cx="15" cy="10" r="6" fill="#bc002d"/>',
    ko: '<rect width="30" height="20" fill="#fff"/><path d="M10 10a5 5 0 0110 0z" fill="#cd2e3a"/><path d="M10 10a5 5 0 0010 0z" fill="#0047a0"/><path d="M4 4l4 2.500M22 13.500l4 2.500M26 4l-4 2.500M8 13.500L4 16" stroke="#000" stroke-width="1.800"/>',
    zh: '<rect width="30" height="20" fill="#de2910"/>' + st(6, 6, 3.6, '#ffde00') + st(11.5, 2.5, 1.2, '#ffde00') + st(13.5, 5, 1.2, '#ffde00') + st(13.5, 8, 1.2, '#ffde00') + st(11.5, 10.5, 1.2, '#ffde00'),
    'zh-Hant': '<rect width="30" height="20" fill="#fe0000"/><rect width="15" height="10" fill="#000095"/><circle cx="7.500" cy="5" r="2.600" fill="#fff"/>',
    tr: '<rect width="30" height="20" fill="#e30a17"/><circle cx="11" cy="10" r="5" fill="#fff"/><circle cx="12.300" cy="10" r="4" fill="#e30a17"/>' + st(17.5, 10, 2.4, '#fff'),
    vi: '<rect width="30" height="20" fill="#da251d"/>' + st(15, 10, 6, '#ffff00'),
    sv: '<rect width="30" height="20" fill="#006aa7"/><path d="M10 0v20M0 10h30" stroke="#fecc00" stroke-width="4"/>',
    cs: '<rect width="30" height="10" fill="#fff"/><rect y="10" width="30" height="10" fill="#d7141a"/><polygon points="0,0 15,10 0,20" fill="#11457e"/>',
    da: '<rect width="30" height="20" fill="#c8102e"/><path d="M11 0v20M0 10h30" stroke="#fff" stroke-width="3.400"/>',
    nb: '<rect width="30" height="20" fill="#ba0c2f"/><path d="M11 0v20M0 10h30" stroke="#fff" stroke-width="5"/><path d="M11 0v20M0 10h30" stroke="#00205b" stroke-width="2.600"/>',
    fi: '<rect width="30" height="20" fill="#fff"/><path d="M11 0v20M0 10h30" stroke="#002f6c" stroke-width="4.400"/>',
    hu: h(['#ce2939', '#fff', '#477050']),
    el: h(['#0d5eaf', '#fff', '#0d5eaf', '#fff', '#0d5eaf', '#fff', '#0d5eaf', '#fff', '#0d5eaf']) + '<rect width="11.1" height="11.1" fill="#0d5eaf"/><path d="M5.550 0v11.100M0 5.550h11.100" stroke="#fff" stroke-width="2.200"/>'
  };
  TN.flag = function (l) { return '<span class="drap"><svg viewBox="0 0 30 20" preserveAspectRatio="none">' + (F[l] || F.en) + '</svg></span>'; };

  /* ---------- sons (fabriques par le jeu) ---------- */
  var AC = null;
  function ac() { if (!AC) { try { AC = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { } } if (AC && AC.state === 'suspended') AC.resume(); return AC; }
  function tone(f, d, type, vol, to, at) {
    var a = ac(); if (!a || !TN.S.sfx) return;
    var o = a.createOscillator(), g = a.createGain(), t = a.currentTime + (at || 0);
    o.type = type || 'sine'; o.frequency.setValueAtTime(f, t); if (to) o.frequency.exponentialRampToValueAtTime(to, t + d);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol || 0.2, t + 0.012); g.gain.exponentialRampToValueAtTime(0.0001, t + d);
    o.connect(g); g.connect(a.destination); o.start(t); o.stop(t + d + 0.03);
  }
  function souffle(d, vol, at) {
    var a = ac(); if (!a || !TN.S.sfx) return;
    var n = a.sampleRate * d, b = a.createBuffer(1, n, a.sampleRate), ch = b.getChannelData(0);
    for (var i = 0; i < n; i++) ch[i] = (Math.random() * 2 - 1) * (1 - i / n);
    var s = a.createBufferSource(), g = a.createGain(), f = a.createBiquadFilter(); f.type = 'highpass'; f.frequency.value = 2500;
    s.buffer = b; g.gain.value = vol; s.connect(f); f.connect(g); g.connect(a.destination); s.start(a.currentTime + (at || 0));
  }
  TN.sfx = {
    clic: function () { tone(660, 0.07, 'triangle', 0.15, 880); },
    prend: function () { tone(420, 0.09, 'sine', 0.16, 620); },
    pose: function () { tone(300, 0.14, 'sine', 0.24, 180); souffle(0.12, 0.05); },
    refus: function () { tone(190, 0.16, 'square', 0.07, 140); },
    tourne: function () { tone(520, 0.1, 'triangle', 0.14, 760); },
    coupe: function () { souffle(0.09, 0.2); souffle(0.09, 0.2, 0.13); tone(1400, 0.05, 'triangle', 0.08, 900, 0.13); },
    pas: function () { tone(240, 0.05, 'sine', 0.1, 200); },
    saut: function () { tone(380, 0.12, 'sine', 0.13, 640); },
    etoile: function () { tone(1047, 0.2, 'triangle', 0.16); tone(1568, 0.3, 'triangle', 0.14, null, 0.09); },
    piece: function () { tone(1320, 0.07, 'square', 0.06); tone(1760, 0.14, 'square', 0.06, null, 0.06); },
    gagne: function () { [523, 659, 784, 1047, 1319].forEach(function (f, i) { tone(f, 0.28, 'triangle', 0.17, null, i * 0.11); }); },
    perdu: function () { [392, 330, 262].forEach(function (f, i) { tone(f, 0.3, 'sine', 0.16, null, i * 0.16); }); },
    coffre: function () { [659, 784, 988, 1319].forEach(function (f, i) { tone(f, 0.2, 'square', 0.06, null, i * 0.07); }); }
  };

  /* ---------- musiques : une playlist, un morceau au hasard, volume egalise ---------- */
  var PISTES = TN.PISTES = [
    ['fairies_1', 'Moonlight Hall', -16.2], ['fairies_2', 'Enchanted Journey', -18.3], ['fairies_3', 'Canon in D for Two Renaissance Harps', -14.9],
    ['lake_1', 'Galway', -14.6], ['lake_2', 'Enchanted Valley', -17.6], ['lake_3', 'Teller of the Tales', -22.3],
    ['forest_3', 'The Forest and the Trees', -17.3], ['village_1', 'Folk Round', -19.0]
  ];
  if (window.TN_PISTES && window.TN_PISTES.length) PISTES = TN.PISTES = window.TN_PISTES;   /* playlist complete : js/musiques.js */
  var au = null, cur = -1, voulu = false, choix = null;
  /* scene : 'accueil', 'monde' (avec le numero du monde) ou 'niveau' ; liste des pistes possibles (indices dans PISTES) */
  function indices(fichiers) {
    var r = []; (fichiers || []).forEach(function (f) { for (var i = 0; i < PISTES.length; i++) if (PISTES[i][0] === f && r.indexOf(i) < 0) r.push(i); });
    return r;
  }
  function listeScene(nom, monde) {
    var S = window.TN_SCENES; if (!S) return null;
    if (nom === 'monde') return indices([(S.monde || [])[monde]]);
    var l = indices(S[nom]);
    if (nom === 'niveau' && l.length < 3) indices((S.monde || []).filter(Boolean)).forEach(function (i) { if (l.indexOf(i) < 0) l.push(i); });   /* pas encore assez de musiques de niveau : on complete avec celles des mondes */
    return l;
  }
  TN.music = {
    titre: function () { return cur >= 0 ? PISTES[cur][1] : ''; },
    index: function () { return cur; },
    /* playlist de l'accueil : joue la musique choisie (et la rejoue en boucle) jusqu'au prochain changement d'ecran */
    choisir: function (i) {
      if (!TN.S.music) { TN.S.music = true; TN.save(); }
      voulu = true; choix = [i]; cur = -1; TN.music.next();
    },
    /* change de scene : ne coupe pas la musique si celle qui joue convient deja a la nouvelle scene */
    scene: function (nom, monde) {
      var l = listeScene(nom, monde); choix = l && l.length ? l : null;
      voulu = true;
      if (!TN.S.music) return;
      if (au && !au.paused && cur >= 0 && (!choix || choix.indexOf(cur) >= 0)) return;
      TN.music.next();
    },
    next: function () {
      if (!TN.S.music || !voulu) return;
      var l = choix || PISTES.map(function (p, i) { return i; }), n;
      if (l.length === 1) n = l[0];
      else do { n = l[Math.floor(Math.random() * l.length)]; } while (n === cur);
      cur = n;
      if (!au) { au = new Audio(); au.addEventListener('ended', TN.music.next); au.addEventListener('error', function () { setTimeout(TN.music.next, 1500); }); }
      au.src = 'audio/' + PISTES[n][0] + (/\./.test(PISTES[n][0]) ? '' : '.mp3');
      au.volume = Math.max(0.12, Math.min(0.6, 0.3 * Math.pow(10, (-20 - PISTES[n][2]) / 20)));
      var p = au.play(); if (p && p.catch) p.catch(function () { });
    },
    start: function () {
      voulu = true; if (!TN.S.music || (au && !au.paused)) return;
      /* reprise apres une pub ou une mise en veille : on reprend le morceau en cours s'il convient encore */
      if (au && cur >= 0 && au.currentTime > 0 && !au.ended && (!choix || choix.indexOf(cur) >= 0)) { var p = au.play(); if (p && p.catch) p.catch(function () { }); }
      else TN.music.next();
    },
    stop: function () { if (au) au.pause(); },
    set: function (on) { TN.S.music = on; TN.save(); if (on) { voulu = true; TN.music.next(); } else TN.music.stop(); }
  };
  document.addEventListener('visibilitychange', function () { if (!au) return; if (document.hidden) au.pause(); else if (TN.S.music && voulu) { var p = au.play(); if (p && p.catch) p.catch(function () { }); } });

  /* ---------- ecrans, fenetres, messages ---------- */
  TN.screens = {};
  TN.show = function (id) {
    for (var k in TN.screens) TN.screens[k].el.classList.toggle('on', k === id);
    TN.current = id; if (TN.screens[id].enter) TN.screens[id].enter();
  };
  TN.popup = function (html, opt) {
    var v = TN.$('<div class="voile"><div class="fen">' + (opt && opt.noClose ? '' : '<button class="x">&#10005;</button>') + html + '</div></div>');
    v.close = function () { if (v.parentNode) v.parentNode.removeChild(v); if (opt && opt.onClose) opt.onClose(); };
    var x = v.querySelector('.x'); if (x) x.onclick = function () { TN.sfx.clic(); v.close(); };
    stage.appendChild(v); return v;
  };
  TN.toast = function (msg) {
    var old = stage.querySelector('.toast'); if (old) old.remove();
    var t = TN.$('<div class="toast"></div>'); t.textContent = msg; stage.appendChild(t); setTimeout(function () { t.remove(); }, 2400);
  };
  /* retrecit un texte trop large pour sa place (langues aux mots longs) */
  TN.shrink = function (e, max) { if (!e) return; e.style.transform = ''; var w = e.scrollWidth; if (w > max) { e.style.transform = 'scale(' + (max / w) + ')'; } };
  TN.coins = function (n) { TN.S.coins = Math.max(0, TN.S.coins + n); TN.save(); if (n > 0) TN.sfx.piece(); };

  /* ---------- publicites : sur PC un ecran de test remplace la pub (les vraies passent par AdMob dans l'appli) ---------- */
  function ecranPub(titre, secondes, fin) {
    TN.music.stop();
    var p = TN.$('<div class="pub"><b>' + TN.t('pubTest') + '</b><div>' + titre + '</div><div class="carre">AdMob</div><button disabled></button></div>');
    var b = p.querySelector('button'), n = secondes;
    function maj() { if (n > 0) { b.textContent = TN.t('pubAttends', n); } else { b.disabled = false; b.textContent = TN.t('pubFermer'); } }
    maj(); var it = setInterval(function () { n--; maj(); if (n <= 0) clearInterval(it); }, 1000);
    b.onclick = function () { p.remove(); if (TN.S.music) TN.music.start(); fin(true); };
    stage.appendChild(p);
  }
  TN.ads = {
    recompense: function (cb) { ecranPub(TN.t('pubRecomp'), 5, cb); },
    /* interstitiel : jamais avant 10 victoires, au plus 1 niveau sur 3, au moins 3 minutes d'ecart */
    entreNiveaux: function (cb) {
      var P = TN.PUBS, now = Date.now();
      if (TN.S.wins < P.pasAvantVictoires || TN.S.sinceInter < P.unNiveauSur || now - TN.S.lastInter < P.ecartMinutes * 60000) return cb();
      TN.S.sinceInter = 0; TN.S.lastInter = now; TN.save();
      ecranPub(TN.t('pubInter'), 2, cb);
    },
    banniere: function (scr) { var b = scr.querySelector('.banniere'); if (b) { b.classList.toggle('on', TN.S.age !== null); b.innerHTML = '<b>' + TN.t('pubTest') + '</b> ' + TN.t('pubBan'); } }
  };
})();
