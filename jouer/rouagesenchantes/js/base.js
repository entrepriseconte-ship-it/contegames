/* Les Rouages Enchantés — socle : écran, images, saisie, sauvegarde, sons, petits outils de dessin */
(function (root) {
  'use strict';
  var RE = root.RE, W = 941, H = 1672;
  var B = RE.base = { W: W, H: H, t: 0, dt: 0 };
  var canvas = document.getElementById('jeu'), ctx = canvas.getContext('2d');
  B.canvas = canvas; B.ctx = ctx;

  /* ───────── mise à l'échelle (portrait, toutes résolutions) ───────── */
  var scale = 1;
  function resize() {
    var vw = window.innerWidth, vh = window.innerHeight;
    var s = Math.min(vw / W, vh / H);
    var cw = Math.round(W * s), ch = Math.round(H * s);
    var dpr = Math.min(window.devicePixelRatio || 1, 3);
    var px = Math.min(dpr * s, 2);           // au plus 2x la résolution logique
    canvas.style.width = cw + 'px'; canvas.style.height = ch + 'px';
    canvas.width = Math.round(W * px); canvas.height = Math.round(H * px);
    scale = px; B.cssScale = s;
  }
  window.addEventListener('resize', resize); window.addEventListener('orientationchange', resize); resize();
  B.begin = function () { ctx.setTransform(scale, 0, 0, scale, 0, 0); ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high'; };

  /* ───────── images ───────── */
  var IMG = B.img = {}, names = ['studio.jpg', 'home.jpg', 'home_clean.jpg', 'map1.jpg', 'map1_f.jpg', 'map2.jpg', 'map2_f.jpg', 'map3.jpg', 'map3_f.jpg', 'map4.jpg', 'map4_f.jpg', 'map5.jpg', 'map5_f.jpg', 'map6.jpg', 'map6_f.jpg', 'bg_play.jpg', 'logo.png', 'banner.png', 'btn_red.png', 'btn_blue.png', 'btn_orange.png',
    'btn_pause.png', 'energy_fill.png', 'engine.png', 'engine_gold.png', 'lever.png',
    'gear_steel_S.png', 'gear_steel_M.png', 'gear_steel_L.png', 'gear_gold_S.png', 'gear_gold_M.png', 'gear_gold_L.png', 'gear_red_S.png', 'gear_red_M.png', 'gear_red_L.png'];
  ['moulin', 'lanterne', 'pont', 'roue', 'chateau', 'grue', 'mine', 'forge', 'cascade', 'tour', 'porte'].forEach(function (n) { names.push('m_' + n + '.png'); names.push('m_' + n + '_f.png'); });
  Object.keys(RE.LANGS || {}).forEach(function (k) { names.push('f_' + k + '.webp'); });
  B.loaded = 0; B.total = names.length; B.ready = false;
  names.forEach(function (n) {
    var im = new Image();
    im.onload = im.onerror = function () { B.loaded++; if (B.loaded >= B.total) B.ready = true; };
    im.src = 'img/' + n; IMG[n.replace(/\.(png|jpg|webp)$/, '')] = im;
  });

  /* ───────── sauvegarde locale ───────── */
  var KEY = 'roubages_enchantes_v1';
  function fresh() {
    return { stars: {}, best: {}, coins: 0, hints: 3, up: { huile: 0, sablier: 0, moulin: 0 }, chests: {}, items: {}, skin: 'or', music: 0.6, sfx: 0.8, lang: null, tips: {}, bonus: {}, last: 0, adulte: null };
  }
  var save = fresh();
  try { var raw = localStorage.getItem(KEY); if (raw) { var o = JSON.parse(raw), d = fresh(); for (var k in d) if (o[k] === undefined) o[k] = d[k]; for (var u in d.up) if (o.up[u] === undefined) o.up[u] = 0; save = o; } } catch (e) { }
  B.save = save;
  B.persist = function () { try { localStorage.setItem(KEY, JSON.stringify(save)); } catch (e) { } };
  B.resetSave = function () { var m = save.music, s = save.sfx, ad = save.adulte; var f = fresh(); for (var k in save) delete save[k]; for (var k2 in f) save[k2] = f[k2]; save.music = m; save.sfx = s; save.adulte = ad; B.persist(); };
  B.totalStars = function () { var n = 0; for (var k in save.stars) n += save.stars[k]; return n; };

  /* ───────── textes ───────── */
  /* 21 langues : la phrase française sert de clé ; js/langues.js contient les traductions dans le même ordre */
  var LG = RE.LANGS || {}, KEYS = RE.LANG_KEYS || [], KIDX = {}; KEYS.forEach(function (k, i) { KIDX[k] = i; });
  B.langs = Object.keys(LG);
  B.detectLang = function () { var n = (navigator.language || 'fr'); if (LG[n]) return n; var b = n.split('-')[0]; if (b === 'zh') return /tw|hk|hant/i.test(n) ? 'zh-Hant' : 'zh'; return LG[b] ? b : 'en'; };
  if (!save.lang || !LG[save.lang]) { save.lang = LG.fr ? B.detectLang() : 'fr'; }
  B.T = function (o) {
    if (typeof o === 'string') return o;
    var l = save.lang; if (l === 'fr') return o.fr;
    var i = KIDX[o.fr], t = LG[l] && i !== undefined ? LG[l][1][i] : null;
    return t || o.en || o.fr;
  };
  B.F = function (o, p) { var s = B.T(o); for (var k in p) s = s.split('{' + k + '}').join(p[k]); return s; };
  B.lvlName = function (L) { return save.lang === 'fr' && L.name && L.name.fr ? L.name.fr : B.T({ fr: 'NIVEAU ', en: 'LEVEL ' }) + L.id; };
  B.goalText = function (L) {
    var g = L.goal, p = {}; if (g.x) p.x = B.T(RE.ART[g.x]); if (g.y) p.y = B.T(RE.ART[g.y]); if (g.n) p.n = g.n;
    var s = B.F(g, p); if (g.timed) s = B.F(RE.TIMED, { x: s }); return s;
  };

  /* ───────── saisie tactile / souris ───────── */
  var P = B.pointer = { x: 0, y: 0, down: false, touch: false };
  var handlers = { down: null, move: null, up: null };
  B.onPointer = function (h) { handlers = h; };
  function pos(e) { var r = canvas.getBoundingClientRect(); P.x = (e.clientX - r.left) * W / r.width; P.y = (e.clientY - r.top) * H / r.height; P.touch = e.pointerType === 'touch'; }
  canvas.addEventListener('pointerdown', function (e) { e.preventDefault(); try { canvas.setPointerCapture(e.pointerId); } catch (x) { } pos(e); P.down = true; A.unlock(); if (handlers.down) handlers.down(P); });
  canvas.addEventListener('pointermove', function (e) { pos(e); if (handlers.move) handlers.move(P); });
  function up(e) { pos(e); if (!P.down) return; P.down = false; if (handlers.up) handlers.up(P); }
  canvas.addEventListener('pointerup', up); canvas.addEventListener('pointercancel', up);
  canvas.addEventListener('contextmenu', function (e) { e.preventDefault(); });

  /* ───────── audio ───────── */
  var A = B.audio = { ac: null, unlocked: false };
  /* musique : liste de lecture aléatoire (fichiers listés dans audio/playlist.js), enchaînée sans répétition */
  var LIST = (RE.PLAYLIST || []).slice(), bag = [], lastTrack = '';
  var el = new Audio(); el.preload = 'auto'; A.el = el; A.vol = 0; A.playing = false;
  A.tracks = { liste: { el: el, ok: LIST.length > 0, get target() { return A.playing ? 1 : 0; } } };
  function nextTrack() {
    if (!LIST.length) return;
    if (!bag.length) { bag = LIST.slice(); for (var i = bag.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)), t = bag[i]; bag[i] = bag[j]; bag[j] = t; } if (bag.length > 1 && bag[bag.length - 1] === lastTrack) bag.unshift(bag.pop()); }
    lastTrack = bag.pop(); el.src = 'audio/' + lastTrack; A.vol = 0; el.volume = 0;
    var p = el.play(); if (p && p.catch) p.catch(function () { });
  }
  /* la musique d'accueil (menu.mp3) ouvre toujours la liste ; elle démarre dès l'arrivée sur l'accueil
     quand l'appareil l'autorise, sinon au premier toucher (règle des navigateurs) */
  function startMusic() {
    if (A.playing || !LIST.length) return;
    A.playing = true;
    if (LIST.indexOf('rouages_07_menu.mp3') >= 0) { lastTrack = 'rouages_07_menu.mp3'; el.src = 'audio/rouages_07_menu.mp3'; A.vol = 0; el.volume = 0; var p = el.play(); if (p && p.catch) p.catch(function () { A.playing = false; }); }
    else nextTrack();
  }
  A.startMusic = startMusic;
  /* son du logo du studio : audio/logo.mp3 s'il existe, sinon une harpe synthétisée */
  A.jingle = function () {
    if (save.sfx <= 0) return;
    var j = new Audio(), done = false; j.volume = Math.min(1, save.sfx);
    j.onerror = function () { if (!done) { done = true; A.sfx('harpe'); } };
    j.src = 'audio/logo.mp3'; var p = j.play(); if (p && p.catch) p.catch(function () { if (!done) { done = true; A.sfx('harpe'); } });
  };
  el.addEventListener('ended', nextTrack);
  el.addEventListener('error', function () { LIST = LIST.filter(function (n) { return n !== lastTrack; }); bag = bag.filter(function (n) { return n !== lastTrack; }); if (LIST.length) nextTrack(); });
  A.unlock = function () {
    if (!A.ac) { try { A.ac = new (window.AudioContext || window.webkitAudioContext)(); A.master = A.ac.createGain(); A.master.connect(A.ac.destination); } catch (e) { } }
    if (A.ac && A.ac.state === 'suspended') A.ac.resume();
    if (!A.unlocked) { A.unlocked = true; }
  };
  A.music = function () { };   // la liste de lecture continue d'un écran à l'autre
  A.tick = function (dt) {
    if (!A.playing) return;
    A.vol = Math.min(1, A.vol + dt * 0.8);
    var v = A.vol * save.music * 0.85; if (Math.abs(el.volume - v) > 0.004) el.volume = Math.max(0, Math.min(1, v));
  };
  document.addEventListener('visibilitychange', function () { if (!A.playing) return; if (document.hidden) el.pause(); else el.play().catch(function () { }); });
  /* effets sonores synthétisés (aucun fichier) */
  function tone(f, t0, dur, type, vol, f2) {
    var ac = A.ac, o = ac.createOscillator(), g = ac.createGain();
    o.type = type || 'sine'; o.frequency.setValueAtTime(f, t0); if (f2) o.frequency.exponentialRampToValueAtTime(f2, t0 + dur);
    g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(vol, t0 + 0.012); g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g); g.connect(A.master); o.start(t0); o.stop(t0 + dur + 0.05);
  }
  var noiseBuf = null;
  function noise(t0, dur, vol, freq, q, type) {
    var ac = A.ac;
    if (!noiseBuf) { noiseBuf = ac.createBuffer(1, ac.sampleRate, ac.sampleRate); var d = noiseBuf.getChannelData(0); for (var i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; }
    var s = ac.createBufferSource(), f = ac.createBiquadFilter(), g = ac.createGain();
    s.buffer = noiseBuf; f.type = type || 'bandpass'; f.frequency.value = freq; f.Q.value = q || 1;
    g.gain.setValueAtTime(vol, t0); g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    s.connect(f); f.connect(g); g.connect(A.master); s.start(t0, Math.random() * 0.5); s.stop(t0 + dur + 0.05);
  }
  A.sfx = function (name) {
    if (!A.ac || save.sfx <= 0) return;
    var t = A.ac.currentTime + 0.005; A.master.gain.value = save.sfx;
    switch (name) {
      case 'harpe': [262, 330, 392, 523, 659, 784, 1047, 1319, 1568].forEach(function (f, i) { var tt = t + i * 0.11; tone(f, tt, 1.6, 'triangle', 0.13); tone(f * 2, tt, 0.9, 'sine', 0.05); tone(f * 3, tt, 0.4, 'sine', 0.02); });
        [523, 659, 784, 1047].forEach(function (f) { tone(f, t + 1.15, 2.2, 'triangle', 0.09); tone(f * 2, t + 1.15, 1.4, 'sine', 0.03); }); break;
      case 'clic': tone(880, t, 0.07, 'triangle', 0.10); noise(t, 0.04, 0.05, 3000, 2); break;
      case 'prise': noise(t, 0.05, 0.10, 2400, 3); tone(1400, t, 0.05, 'sine', 0.04); break;
      case 'pose': noise(t, 0.09, 0.22, 900, 2); tone(196, t, 0.16, 'triangle', 0.20, 130); tone(1568, t + 0.02, 0.22, 'sine', 0.06); tone(2349, t + 0.03, 0.18, 'sine', 0.03); break;
      case 'tic': noise(t, 0.03, 0.10, 3800, 6); tone(2093, t, 0.05, 'sine', 0.03); break;
      case 'rotation': for (var i = 0; i < 4; i++) { noise(t + i * 0.055, 0.03, 0.09, 3200 + i * 250, 5); } tone(659, t, 0.22, 'sine', 0.05, 784); break;
      case 'rune': [1047, 1319, 1568].forEach(function (f, i) { tone(f, t + i * 0.07, 0.6, 'sine', 0.10); tone(f * 2.01, t + i * 0.07, 0.4, 'sine', 0.03); }); break;
      case 'energie': tone(220, t, 0.7, 'sawtooth', 0.035, 660); tone(440, t, 0.7, 'sine', 0.09, 1320); noise(t, 0.6, 0.05, 5000, 1, 'highpass'); [1760, 2093, 2637].forEach(function (f, i) { tone(f, t + 0.25 + i * 0.08, 0.5, 'sine', 0.05); }); break;
      case 'bloque': tone(110, t, 0.25, 'square', 0.07, 70); noise(t, 0.18, 0.2, 300, 1, 'lowpass'); noise(t + 0.05, 0.05, 0.12, 2500, 4); break;
      case 'refus': tone(196, t, 0.12, 'triangle', 0.14, 147); tone(147, t + 0.1, 0.16, 'triangle', 0.12, 110); break;
      case 'levier': noise(t, 0.04, 0.2, 1800, 3); noise(t + 0.08, 0.06, 0.25, 700, 2); tone(294, t + 0.08, 0.14, 'triangle', 0.14, 220); break;
      case 'annuler': tone(660, t, 0.1, 'triangle', 0.09, 440); break;
      case 'indice': [1319, 1760].forEach(function (f, i) { tone(f, t + i * 0.09, 0.45, 'sine', 0.09); }); break;
      case 'etoile': tone(1568, t, 0.5, 'sine', 0.12); tone(2349, t + 0.03, 0.5, 'sine', 0.07); tone(3136, t + 0.06, 0.4, 'sine', 0.04); break;
      case 'victoire': [523, 659, 784, 1047, 1319, 1568].forEach(function (f, i) { tone(f, t + i * 0.11, 0.7, 'triangle', 0.13); tone(f * 2, t + i * 0.11, 0.5, 'sine', 0.04); });
        [1047, 1319, 1568].forEach(function (f) { tone(f, t + 0.75, 1.4, 'sine', 0.08); }); break;
      case 'defaite': [392, 349, 294, 220].forEach(function (f, i) { tone(f, t + i * 0.2, 0.5, 'triangle', 0.12); }); noise(t + 0.6, 0.5, 0.08, 200, 1, 'lowpass'); break;
      case 'coffre': noise(t, 0.12, 0.25, 500, 2); tone(131, t, 0.25, 'triangle', 0.18, 98); [1047, 1319, 1568, 2093, 2637].forEach(function (f, i) { tone(f, t + 0.2 + i * 0.07, 0.8, 'sine', 0.08); }); break;
      case 'piece': tone(1976, t, 0.08, 'square', 0.04); tone(2637, t + 0.07, 0.3, 'square', 0.04); break;
      case 'eau': noise(t, 1.1, 0.16, 900, 0.7); noise(t + 0.1, 0.9, 0.1, 2400, 1.2); tone(330, t, 0.5, 'sine', 0.05, 520); tone(660, t + 0.25, 0.6, 'sine', 0.04, 880); break;
      case 'lanterne': tone(784, t, 0.5, 'sine', 0.1, 1175); tone(1568, t + 0.1, 0.5, 'sine', 0.06); break;
    }
  };

  /* ───────── outils de dessin ───────── */
  var G = B.g = {};
  /* Cinzel ne couvre que l'alphabet latin : les autres écritures utilisent la police du système */
  var NONLATIN = { ru: 1, uk: 1, ja: 1, ko: 1, zh: 1, 'zh-Hant': 1, th: 1, vi: 1 };
  G.font = function (size, weight) {
    if (NONLATIN[save.lang]) ctx.font = (weight === 700 ? 700 : 800) + ' ' + Math.round(size * 0.92) + 'px "Segoe UI", "Noto Sans", "Noto Sans CJK SC", "Noto Sans Thai", "Hiragino Sans", "PingFang SC", "Malgun Gothic", "Leelawadee UI", system-ui, sans-serif';
    else ctx.font = (weight || 900) + ' ' + size + 'px Cinzel, "Trajan Pro", Georgia, serif';
  };
  /* texte centré avec contour, réduit automatiquement s'il dépasse maxW */
  G.text = function (str, x, y, size, o) {
    o = o || {}; str = String(str);
    G.font(size, o.weight);
    if (o.maxW) { var w = ctx.measureText(str).width; if (w > o.maxW) { size = Math.max(10, size * o.maxW / w); G.font(size, o.weight); } }
    ctx.textAlign = o.align || 'center'; ctx.textBaseline = o.base || 'middle';
    ctx.lineJoin = 'round';
    if (o.stroke !== false) { ctx.lineWidth = o.lw || Math.max(3, size * 0.16); ctx.strokeStyle = o.stroke || 'rgba(20,12,30,0.9)'; ctx.strokeText(str, x, y + (o.drop === undefined ? 2 : o.drop)); ctx.strokeText(str, x, y); }
    if (o.grad) { var g = ctx.createLinearGradient(0, y - size * 0.5, 0, y + size * 0.5); g.addColorStop(0, o.grad[0]); g.addColorStop(1, o.grad[1]); ctx.fillStyle = g; } else ctx.fillStyle = o.color || '#fff3d6';
    ctx.fillText(str, x, y);
    return size;
  };
  G.GOLD = ['#fff0b0', '#f2b33a'];
  /* texte sur plusieurs lignes ; renvoie la hauteur utilisée */
  G.wrap = function (str, x, y, size, maxW, lineH, o) {
    G.font(size, (o && o.weight) || 700);
    var words = String(str).split(' '), lines = [], cur = '';
    words.forEach(function (w) { var t = cur ? cur + ' ' + w : w; if (ctx.measureText(t).width > maxW && cur) { lines.push(cur); cur = w; } else cur = t; });
    if (cur) lines.push(cur);
    var oo = { weight: 700 }; if (o) for (var k in o) oo[k] = o[k];
    lines.forEach(function (l, i) { G.text(l, x, y + i * lineH, size, oo); });
    return lines.length * lineH;
  };
  G.rr = function (x, y, w, h, r) { ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); };
  /* panneau bleu nuit à double liseré doré, coins coupés */
  function octo(x, y, w, h, c) { ctx.beginPath(); ctx.moveTo(x + c, y); ctx.lineTo(x + w - c, y); ctx.lineTo(x + w, y + c); ctx.lineTo(x + w, y + h - c); ctx.lineTo(x + w - c, y + h); ctx.lineTo(x + c, y + h); ctx.lineTo(x, y + h - c); ctx.lineTo(x, y + c); ctx.closePath(); }
  G.octo = octo;
  G.panel = function (x, y, w, h, o) {
    o = o || {}; var c = o.cut || 26;
    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,0.6)'; ctx.shadowBlur = 40; ctx.shadowOffsetY = 14;
    octo(x, y, w, h, c); ctx.fillStyle = '#1a2148'; ctx.fill(); ctx.restore();
    var g = ctx.createLinearGradient(0, y, 0, y + h); g.addColorStop(0, o.top || '#2c3a78'); g.addColorStop(0.5, o.mid || '#1c2554'); g.addColorStop(1, o.bot || '#141a3c');
    octo(x, y, w, h, c); ctx.fillStyle = g; ctx.fill();
    ctx.save(); octo(x, y, w, h, c); ctx.clip();
    var hl = ctx.createLinearGradient(0, y, 0, y + 90); hl.addColorStop(0, 'rgba(140,170,255,0.20)'); hl.addColorStop(1, 'rgba(140,170,255,0)'); ctx.fillStyle = hl; ctx.fillRect(x, y, w, 90);
    ctx.restore();
    var gg = ctx.createLinearGradient(0, y, 0, y + h); gg.addColorStop(0, '#ffe9a6'); gg.addColorStop(0.45, '#e2a23c'); gg.addColorStop(1, '#8f5a1c');
    octo(x, y, w, h, c); ctx.lineWidth = 7; ctx.strokeStyle = '#3a2410'; ctx.stroke();
    octo(x, y, w, h, c); ctx.lineWidth = 4.5; ctx.strokeStyle = gg; ctx.stroke();
    octo(x + 9, y + 9, w - 18, h - 18, c - 5); ctx.lineWidth = 1.6; ctx.strokeStyle = 'rgba(240,190,90,0.55)'; ctx.stroke();
    if (o.gems !== false) { [[x + w / 2, y], [x + w / 2, y + h]].forEach(function (p) { G.gem(p[0], p[1], 13); }); }
  };
  G.gem = function (x, y, r, col) {
    ctx.save(); ctx.translate(x, y);
    ctx.beginPath(); ctx.moveTo(0, -r - 5); ctx.lineTo(r + 5, 0); ctx.lineTo(0, r + 5); ctx.lineTo(-r - 5, 0); ctx.closePath();
    var gg = ctx.createLinearGradient(0, -r, 0, r); gg.addColorStop(0, '#ffe9a6'); gg.addColorStop(1, '#a86a1e'); ctx.fillStyle = gg; ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = '#3a2410'; ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, -r); ctx.lineTo(r, 0); ctx.lineTo(0, r); ctx.lineTo(-r, 0); ctx.closePath();
    var g = ctx.createLinearGradient(-r, -r, r, r); g.addColorStop(0, '#d8f6ff'); g.addColorStop(0.5, col || '#3fb0ff'); g.addColorStop(1, '#1b4fb8'); ctx.fillStyle = g; ctx.fill();
    ctx.beginPath(); ctx.moveTo(0, -r); ctx.lineTo(r * 0.35, 0); ctx.lineTo(0, r); ctx.closePath(); ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.fill();
    ctx.restore();
  };
  G.star = function (x, y, r, on, rot) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(rot || 0);
    ctx.beginPath(); for (var i = 0; i < 10; i++) { var a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? r * 0.46 : r; ctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr); } ctx.closePath();
    ctx.lineJoin = 'round'; ctx.lineWidth = Math.max(3, r * 0.2); ctx.strokeStyle = on ? '#5a2c08' : '#0c1028'; ctx.stroke();
    if (on) { var g = ctx.createLinearGradient(0, -r, 0, r); g.addColorStop(0, '#fff6b8'); g.addColorStop(0.5, '#ffc93a'); g.addColorStop(1, '#e88a12'); ctx.fillStyle = g; }
    else ctx.fillStyle = '#2a315c';
    ctx.fill();
    if (on) { ctx.beginPath(); ctx.moveTo(0, -r * 0.82); ctx.lineTo(r * 0.2, -r * 0.2); ctx.lineTo(-r * 0.6, -r * 0.2); ctx.closePath(); ctx.fillStyle = 'rgba(255,255,255,0.45)'; ctx.fill(); }
    ctx.restore();
  };
  G.coin = function (x, y, r) {
    ctx.save(); ctx.translate(x, y);
    ctx.beginPath(); ctx.arc(0, 0, r, 0, 6.2832); var g = ctx.createLinearGradient(0, -r, 0, r); g.addColorStop(0, '#fff3a8'); g.addColorStop(0.55, '#f6b52c'); g.addColorStop(1, '#b96a10'); ctx.fillStyle = g; ctx.fill();
    ctx.lineWidth = Math.max(2, r * 0.14); ctx.strokeStyle = '#5a2c08'; ctx.stroke();
    ctx.beginPath(); ctx.arc(0, 0, r * 0.68, 0, 6.2832); ctx.lineWidth = Math.max(1.5, r * 0.09); ctx.strokeStyle = 'rgba(140,70,10,0.8)'; ctx.stroke();
    // petit rouage gravé
    ctx.fillStyle = 'rgba(150,80,10,0.85)'; for (var i = 0; i < 6; i++) { ctx.save(); ctx.rotate(i * Math.PI / 3); ctx.fillRect(-r * 0.09, -r * 0.5, r * 0.18, r * 0.2); ctx.restore(); }
    ctx.beginPath(); ctx.arc(0, 0, r * 0.34, 0, 6.2832); ctx.fill(); ctx.beginPath(); ctx.arc(0, 0, r * 0.14, 0, 6.2832); ctx.fillStyle = '#f6c84a'; ctx.fill();
    ctx.restore();
  };
  G.lock = function (x, y, s) {
    ctx.save(); ctx.translate(x, y); ctx.lineJoin = 'round';
    ctx.beginPath(); ctx.arc(0, -s * 0.28, s * 0.3, Math.PI, 0); ctx.lineWidth = s * 0.2; ctx.strokeStyle = '#2a1a0c'; ctx.stroke(); ctx.lineWidth = s * 0.11; ctx.strokeStyle = '#c9d2e6'; ctx.stroke();
    G.rr(-s * 0.48, -s * 0.28, s * 0.96, s * 0.78, s * 0.14); var g = ctx.createLinearGradient(0, -s * 0.28, 0, s * 0.5); g.addColorStop(0, '#ffe08a'); g.addColorStop(1, '#b8741a'); ctx.fillStyle = g; ctx.fill(); ctx.lineWidth = s * 0.08; ctx.strokeStyle = '#3a2410'; ctx.stroke();
    ctx.beginPath(); ctx.arc(0, s * 0.04, s * 0.11, 0, 6.2832); ctx.fillStyle = '#3a2410'; ctx.fill(); ctx.fillRect(-s * 0.045, s * 0.04, s * 0.09, s * 0.24);
    ctx.restore();
  };
  G.chest = function (x, y, s, open, glow) {
    ctx.save(); ctx.translate(x, y); ctx.lineJoin = 'round';
    if (glow) { var gl = ctx.createRadialGradient(0, 0, s * 0.2, 0, 0, s * 1.5); gl.addColorStop(0, 'rgba(255,220,120,' + (0.5 * glow) + ')'); gl.addColorStop(1, 'rgba(255,220,120,0)'); ctx.fillStyle = gl; ctx.fillRect(-s * 1.5, -s * 1.5, s * 3, s * 3); }
    var w = s * 1.5, h = s * 0.8;
    function band(yy, hh) { var g = ctx.createLinearGradient(0, yy, 0, yy + hh); g.addColorStop(0, '#ffe9a6'); g.addColorStop(1, '#b8741a'); return g; }
    // coffre
    G.rr(-w / 2, -h * 0.1, w, h, s * 0.1); var g1 = ctx.createLinearGradient(0, -h * 0.1, 0, h * 0.9); g1.addColorStop(0, '#9a4a22'); g1.addColorStop(1, '#5a2410'); ctx.fillStyle = g1; ctx.fill(); ctx.lineWidth = s * 0.07; ctx.strokeStyle = '#2a1206'; ctx.stroke();
    ctx.fillStyle = band(-h * 0.1, h); [-0.36, 0.36].forEach(function (k) { ctx.fillRect(w * k - s * 0.07, -h * 0.1, s * 0.14, h); });
    // couvercle
    ctx.save(); if (open) { ctx.translate(0, -h * 0.1); ctx.rotate(-0.5); ctx.translate(-w * 0.12, -h * 0.5); } else ctx.translate(0, -h * 0.1);
    ctx.beginPath(); ctx.moveTo(-w / 2, 0); ctx.lineTo(-w / 2, -h * 0.3); ctx.quadraticCurveTo(-w / 2, -h * 0.75, 0, -h * 0.75); ctx.quadraticCurveTo(w / 2, -h * 0.75, w / 2, -h * 0.3); ctx.lineTo(w / 2, 0); ctx.closePath();
    var g2 = ctx.createLinearGradient(0, -h * 0.75, 0, 0); g2.addColorStop(0, '#c9662c'); g2.addColorStop(1, '#7a3416'); ctx.fillStyle = g2; ctx.fill(); ctx.lineWidth = s * 0.07; ctx.strokeStyle = '#2a1206'; ctx.stroke();
    ctx.fillStyle = band(-h * 0.75, h * 0.75); [-0.36, 0.36].forEach(function (k) { ctx.fillRect(w * k - s * 0.07, -h * 0.62, s * 0.14, h * 0.62); });
    ctx.fillStyle = band(-h * 0.12, h * 0.14); ctx.fillRect(-w / 2, -h * 0.13, w, h * 0.13); ctx.strokeRect(-w / 2, -h * 0.13, w, h * 0.13);
    ctx.restore();
    if (!open) { ctx.beginPath(); ctx.arc(0, h * 0.02, s * 0.16, 0, 6.2832); ctx.fillStyle = band(-s * 0.16, s * 0.4); ctx.fill(); ctx.lineWidth = s * 0.05; ctx.strokeStyle = '#2a1206'; ctx.stroke(); ctx.fillStyle = '#2a1206'; ctx.fillRect(-s * 0.03, -s * 0.02, s * 0.06, s * 0.12); }
    ctx.restore();
  };
  /* bouton à partir d'une image étirée en 3 tranches */
  G.slice3 = function (im, x, y, w, h, cap) {
    var sw = im.width, sh = im.height, c = cap || 60, dc = Math.min(c * h / sh, w / 2);
    ctx.drawImage(im, 0, 0, c, sh, x, y, dc, h);
    ctx.drawImage(im, c, 0, sw - 2 * c, sh, x + dc - 0.5, y, w - 2 * dc + 1, h);
    ctx.drawImage(im, sw - c, 0, c, sh, x + w - dc, y, dc, h);
  };

  /* ───────── boutons (mode immédiat) ───────── */
  var U = B.ui = { list: [], hot: null, modal: 0 };
  U.reset = function () { U.list.length = 0; };
  /* enregistre une zone cliquable ; renvoie true si elle est enfoncée */
  U.zone = function (id, x, y, w, h, fn, o) { U.list.push({ id: id, x: x, y: y, w: w, h: h, fn: fn, o: o || {} }); return U.hot === id; };
  U.hit = function (p) { for (var i = U.list.length - 1; i >= 0; i--) { var b = U.list[i]; if (p.x >= b.x && p.x <= b.x + b.w && p.y >= b.y && p.y <= b.y + b.h) return b; if (b.o.block) return null; } return null; };
  U.button = function (id, kind, x, y, w, h, label, fn, o) {
    o = o || {};
    var pressed = U.zone(id, x, y, w, h, fn, o), im = B.img['btn_' + kind];
    ctx.save();
    var cx = x + w / 2, cy = y + h / 2; ctx.translate(cx, cy); var s = pressed ? 0.95 : 1; ctx.scale(s, s); ctx.translate(-cx, -cy);
    if (o.disabled) ctx.globalAlpha = 0.45;
    ctx.shadowColor = 'rgba(0,0,0,0.5)'; ctx.shadowBlur = 14; ctx.shadowOffsetY = 6;
    G.slice3(im, x, y, w, h, 60);
    ctx.shadowColor = 'transparent';
    if (pressed) { ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = 0.18; G.slice3(im, x, y, w, h, 60); ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = o.disabled ? 0.45 : 1; }
    if (o.icon) o.icon(x + h * 0.62, cy, h);
    var tx = o.icon ? x + h * 1.05 + (w - h * 1.25) / 2 : cx;
    G.text(label, tx, cy + 1, o.size || Math.min(34, h * 0.4), { maxW: (o.icon ? w - h * 1.35 : w - 54), color: '#fff6e0' });
    ctx.restore();
  };

  /* ───────── particules ───────── */
  var parts = B.parts = [];
  B.spark = function (x, y, n, col, o) {
    o = o || {};
    for (var i = 0; i < n; i++) {
      var a = Math.random() * 6.2832, v = (o.v || 120) * (0.3 + Math.random());
      parts.push({ x: x + (Math.random() - 0.5) * (o.spread || 10), y: y + (Math.random() - 0.5) * (o.spread || 10), vx: Math.cos(a) * v, vy: Math.sin(a) * v - (o.up || 0), g: o.g === undefined ? 60 : o.g, life: 0, max: (o.life || 0.9) * (0.6 + Math.random() * 0.7), r: (o.r || 4) * (0.5 + Math.random()), col: col || '#bfe8ff', type: o.type || 'star' });
    }
  };
  B.drawParts = function (dt) {
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    for (var i = parts.length - 1; i >= 0; i--) {
      var p = parts[i]; p.life += dt; if (p.life >= p.max) { parts.splice(i, 1); continue; }
      p.vy += p.g * dt; p.x += p.vx * dt; p.y += p.vy * dt;
      var k = 1 - p.life / p.max, r = p.r * (0.4 + k);
      ctx.globalAlpha = Math.min(1, k * 1.6); ctx.fillStyle = p.col;
      if (p.type === 'smoke') { ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = k * 0.35; ctx.beginPath(); ctx.arc(p.x, p.y, p.r * (2.2 - k), 0, 6.2832); ctx.fill(); ctx.globalCompositeOperation = 'lighter'; continue; }
      ctx.beginPath(); ctx.moveTo(p.x, p.y - r * 2); ctx.quadraticCurveTo(p.x, p.y, p.x + r * 2, p.y); ctx.quadraticCurveTo(p.x, p.y, p.x, p.y + r * 2); ctx.quadraticCurveTo(p.x, p.y, p.x - r * 2, p.y); ctx.quadraticCurveTo(p.x, p.y, p.x, p.y - r * 2); ctx.fill();
    }
    ctx.restore();
  };
  /* images teintées (skins des rouages) mises en cache */
  var tintCache = {};
  B.tinted = function (name, hue) {
    var k = name + '|' + hue; if (tintCache[k]) return tintCache[k];
    var im = IMG[name], c = document.createElement('canvas'); c.width = im.width; c.height = im.height;
    var x = c.getContext('2d'); x.drawImage(im, 0, 0);
    x.globalCompositeOperation = 'hue'; x.fillStyle = 'hsl(' + hue + ',70%,50%)'; x.fillRect(0, 0, c.width, c.height);
    x.globalCompositeOperation = 'destination-in'; x.drawImage(im, 0, 0);
    tintCache[k] = c; return c;
  };
  B.ease = { out: function (t) { return 1 - Math.pow(1 - t, 3); }, back: function (t) { var c = 1.70158; return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2); }, clamp: function (t) { return t < 0 ? 0 : t > 1 ? 1 : t; } };
})(window);
