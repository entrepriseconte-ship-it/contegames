/* Les Rouages Enchantés — écran de jeu (plateau, rouages, énergie, objectifs) */
(function (root) {
  'use strict';
  var RE = root.RE, B = RE.base, C = RE.core, G = B.g, U = B.ui, ctx = B.ctx, IMG = B.img, T = B.T, save = B.save;
  var W = B.W, H = B.H, BX = 70, BY = 405, BW = 798, BH = 723, W0 = 1.25;
  var COL = { blue: { glow: '80,190,255', hex: '#7fd4ff' }, gold: { glow: '255,205,90', hex: '#ffe08a' } };
  var NAMES = {
    porte: { fr: 'Porte', en: 'Gate' }, moulin: { fr: 'Moulin', en: 'Mill' }, lanterne: { fr: 'Lanterne', en: 'Lantern' }, pont: { fr: 'Pont', en: 'Bridge' },
    roue: { fr: 'Roue à eau', en: 'Water wheel' }, chateau: { fr: 'Château', en: 'Castle' }, grue: { fr: 'Grue', en: 'Crane' }, mine: { fr: 'Mine', en: 'Mine' },
    forge: { fr: 'Forge', en: 'Forge' }, cascade: { fr: 'Fontaine', en: 'Fountain' }, tour: { fr: 'Tour', en: 'Tower' }
  };
  RE.NAMES = NAMES;
  var SKINS = RE.SKINS = { or: { hue: null, name: { fr: 'Laiton doré', en: 'Golden brass' } }, emeraude: { hue: 135, name: { fr: 'Émeraude', en: 'Emerald' } }, azur: { hue: 205, name: { fr: 'Azur', en: 'Azure' } }, amethyste: { hue: 280, name: { fr: 'Améthyste', en: 'Amethyst' } } };
  var P = RE.play = {};
  var fogCanvas = document.createElement('canvas'); fogCanvas.width = BW; fogCanvas.height = BH; var fctx = fogCanvas.getContext('2d');

  P.maxMoves = function (L) { var pr = RE.PARS && RE.PARS[String(L.id)]; var base = (pr && typeof pr.par2 === 'number') ? Math.min(L.maxMoves, pr.par2 + 1) : L.maxMoves; return base + save.up.huile * 2 + (P.extra || 0); };
  P.maxTime = function (L) { return L.time ? L.time + save.up.sablier * 20 : 0; };

  P.start = function (id, opts) {
    var L = RE.LEVELS[id - 1];
    P.L = L; P.s = C.initState(L); P.ev = C.evaluate(L, P.s); P.history = [];
    P.angles = P.angles && P.keepAngles ? P.angles : {}; P.time = 0; P.timeLeft = P.maxTime(L);
    P.drag = null; P.hint = null; P.msg = null; P.won = false; P.lost = false; P.endT = 0; P.overlay = null; P.info = null;
    P.energyShown = 0; P.runeAnim = {}; P.shake = {}; P.flash = {}; P.usedHints = 0; P.leverAnim = {};
    P.result = null; P.press = null; P.sel = null; P.extra = 0; P.continued = false;
    P.fit(); P.tree(); save.last = id; B.persist();
    
    if (L.tip && !save.tips[id]) { P.overlay = 'tip'; } else if (opts && opts.hint) { P.askHint(); }
  };

  /* cadrage : le mécanisme est agrandi et centré pour remplir le plateau */
  var V = P.view = { s: 1, ox: 0, oy: 0 };
  P.fit = function () {
    var L = P.L, x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
    function add(ax, ay, bx, by) { x0 = Math.min(x0, ax); y0 = Math.min(y0, ay); x1 = Math.max(x1, bx); y1 = Math.max(y1, by); }
    var tg = {}; L.targets.forEach(function (t) { tg[t.gear] = t; });
    L.fixed.forEach(function (g) {
      var r = C.RP[g.size] + C.ADD, l = g.kind === 'motor' ? r + 100 : r, t = tg[g.id];
      add(g.x - l, g.y - r - ((t && t.dir) || g.rune ? 26 : 0), g.x + r, g.y + r + (t ? 36 : 0));
    });
    var big = 0; L.tray.forEach(function (z) { big = Math.max(big, C.RP[z] + C.ADD); });
    L.pegs.forEach(function (p) { add(p.x - big, p.y - big, p.x + big, p.y + big); });
    (L.levers || []).forEach(function (l) { add(l.x - 50, l.y - 62, l.x + 50, l.y + 50); });
    var bw = x1 - x0, bh = y1 - y0, sc = Math.min((BW - 24) / bw, (BH - 24) / bh, 1.5);
    V.s = sc; V.ox = (BW - bw * sc) / 2 - x0 * sc; V.oy = (BH - bh * sc) / 2 - y0 * sc;
  };
  function scr(p) { return { x: BX + V.ox + p.x * V.s, y: BY + V.oy + p.y * V.s }; }
  P.scr = scr;
  /* arbre d'entraînement pour le calage visuel des dents */
  P.tree = function () {
    var ev = P.ev, n = ev.gears.length, seen = new Array(n).fill(false), order = [];
    function bfs(r) {
      seen[r] = true; order.push({ k: r, parent: -1, flip: 0 }); var q = [r];
      while (q.length) { var u = q.shift(); ev.adj[u].forEach(function (e) { if (!seen[e.to]) { seen[e.to] = true; order.push({ k: e.to, parent: u, flip: e.flip }); q.push(e.to); } }); }
    }
    for (var i = 0; i < n; i++) if (!seen[i] && ev.gears[i].kind === 'motor') bfs(i);
    for (i = 0; i < n; i++) if (!seen[i]) bfs(i);
    P.order = order;
  };
  function tray(i) { var n = P.L.tray.length, step = Math.min(190, 800 / n); return { x: W / 2 + (i - (n - 1) / 2) * step, y: 1572 }; }
  function sx(g) { return BX + g.x; } function sy(g) { return BY + g.y; }

  /* ───────── coups ───────── */
  P.move = function (mv) {
    if (P.won || P.lost) return false;
    var before = P.ev, r = C.applyMove(P.L, P.s, mv, before);
    if (!r) return false;
    P.history.push(P.s); P.s = r.state; P.ev = r.ev; P.hint = null; P.info = null; P.sel = null;
    P.tree(); P.feedback(before, r, mv);
    if (C.isWin(P.L, P.s, P.ev)) P.win();
    else if (P.s.moves >= P.maxMoves(P.L)) { P.lost = 'coups'; P.endT = 0; }
    return true;
  };
  P.feedback = function (before, r, mv) {
    var ev = r.ev, L = P.L, i;
    var wasJam = before.st.some(function (s) { return s.jam; }), jam = null;
    ev.st.forEach(function (s) { if (s.jam) jam = s.reason; });
    if (mv.t === 'place') B.audio.sfx(mv.p < 0 ? 'prise' : 'pose');
    if (mv.t === 'rune') B.audio.sfx('rotation');
    if (mv.t === 'lever') B.audio.sfx('levier');
    if (mv.t === 'place' && mv.p >= 0) { var p = scr(L.pegs[mv.p]); B.spark(p.x, p.y, 10, '#ffe7a0', { v: 150, r: 3, life: 0.5 }); }
    if (jam && !wasJam) {
      setTimeout(function () { B.audio.sfx('bloque'); }, 120);
      P.say(jam === 'surcharge' ? { fr: 'Surcharge ! Deux énergies se mélangent', en: 'Overload! Two energies are mixing' } : jam === 'vitesse' ? { fr: 'Bloqué ! Deux moteurs de vitesses différentes', en: 'Jammed! Two engines at different speeds' } : jam === 'ecluse' ? { fr: 'Écluse fermée : fais circuler l’eau', en: 'Sluice closed: get the water flowing' } : jam === 'frein' ? { fr: 'Bloqué par le rouage enchaîné', en: 'Jammed by the chained gear' } : { fr: 'Bloqué ! Ces rouages se contrarient', en: 'Jammed! These gears fight each other' }, '#ff9a8a');
    }
    if (ev.wet && !before.wet) { P.say({ fr: 'L’eau circule !', en: 'The water is flowing!' }, '#9fe0ff'); setTimeout(function () { B.audio.sfx('eau'); }, 150); }
    var lit = false;
    for (i = 0; i < L.targets.length; i++) {
      var t = L.targets[i], g = ev.gears[ev.idx[t.gear]];
      if (!t.order && ev.targets[i].powered && !before.targets[i].powered) { lit = true; B.spark(scr(g).x, scr(g).y, 26, COL[ev.st[ev.idx[t.gear]].color || 'blue'].hex, { v: 220, r: 4.5 }); P.flash[t.gear] = 1; }
      if (!jam && ev.targets[i].wrongDir && !before.targets[i].wrongDir) P.say(B.F({ fr: '{x} : mauvais sens de rotation', en: '{x}: wrong direction' }, { x: T(NAMES[t.type]) }), '#ffd27a');
      if (!jam && ev.targets[i].wrongSpeed && !before.targets[i].wrongSpeed) P.say(B.F(t.speed === 'fast' ? { fr: '{x} : trop lent', en: '{x}: too slow' } : { fr: '{x} : trop rapide', en: '{x}: too fast' }, { x: T(NAMES[t.type]) }), '#ffd27a');
      if (!jam && ev.targets[i].wrongColor && !before.targets[i].wrongColor) P.say(B.F({ fr: '{x} : mauvaise énergie', en: '{x}: wrong energy' }, { x: T(NAMES[t.type]) }), '#ffd27a');
    }
    r.events.forEach(function (e) {
      var g = ev.gears[ev.idx[L.targets[e.i].gear]];
      if (e.e === 'lit') { lit = true; B.spark(scr(g).x, scr(g).y, 26, '#ffe08a', { v: 220, r: 4.5 }); P.flash[L.targets[e.i].gear] = 1; setTimeout(function () { B.audio.sfx('lanterne'); }, 200); }
      if (e.e === 'wrongOrder') { setTimeout(function () { B.audio.sfx('refus'); }, 150); P.say(e.together ? { fr: 'Trop d’un coup ! Une seule à la fois', en: 'Too many at once! One at a time' } : { fr: 'Mauvais ordre ! Tout s’éteint', en: 'Wrong order! Everything goes dark' }, '#ff9a8a'); }
    });
    if (lit) setTimeout(function () { B.audio.sfx('energie'); }, 90);
  };
  P.say = function (txt, col) { P.msg = { txt: T(txt), t: 0, col: col || '#fff3d6' }; };
  P.undo = function () {
    if (P.won || P.lost || !P.history.length) { B.audio.sfx('refus'); return; }
    P.s = P.history.pop(); P.ev = C.evaluate(P.L, P.s); P.tree(); P.hint = null; P.info = null; P.sel = null; B.audio.sfx('annuler');
  };
  P.restart = function (opts) { P.keepAngles = true; P.start(P.L.id, opts); P.keepAngles = false; };
  P.askHint = function () {
    if (P.won || P.lost) return;
    if (save.hints <= 0) { P.overlay = 'nohint'; return; }
    var sol = C.solve(P.L, P.s, { limit: 200000 });
    var left = P.maxMoves(P.L) - P.s.moves;
    if (!sol || sol.moves.length > left) { B.audio.sfx('refus'); P.say({ fr: 'Plus assez de coups : recommence le niveau', en: 'Not enough moves left: restart the level' }, '#ffd27a'); return; }
    if (!sol.moves.length) return;
    save.hints--; B.persist(); P.usedHints++; P.hint = { mv: sol.moves[0], t: 0 }; B.audio.sfx('indice');
  };

  /* seconde chance après une défaite (récompense publicitaire) */
  P.secondChance = function () { P.extra += 3; if (P.L.time) P.timeLeft += 30; P.lost = false; P.overlay = null; P.endT = 0; P.continued = true; };
  P.win = function () {
    var L = P.L, par = RE.PARS[L.id], s = P.s, sec = C.secondaryOk(L, s, P.ev);
    var st2 = s.moves <= par.par2, st3 = L.secondary ? sec === true : s.moves <= par.opt;
    var stars = 1 + (st2 ? 1 : 0) + (st3 ? 1 : 0);
    var first = !save.stars[L.id], prev = save.stars[L.id] || 0;
    var coins = 20 + stars * 10 + (first ? 30 : 0);
    var hasMill = L.targets.some(function (t, i) { return t.type === 'moulin' && P.ev.targets[i].powered; });
    if (hasMill) coins += 15;
    coins = Math.round(coins * (1 + 0.5 * save.up.moulin));
    var treasure = null;
    var bonusCoins = 0;
    if (L.secondary && L.secondary.type === 'bonus' && sec === true && !save.bonus[L.id]) { save.bonus[L.id] = 1; if (L.treasure) { treasure = L.treasure; save.items[treasure] = 1; } else { bonusCoins = 40; coins += 40; } }
    save.stars[L.id] = Math.max(prev, stars); save.coins += coins;
    var b = save.best[L.id]; if (!b || s.moves < b.moves || (s.moves === b.moves && P.time < b.time)) save.best[L.id] = { moves: s.moves, time: Math.round(P.time) };
    B.persist();
    P.won = true; P.endT = 0; P.hint = null;
    P.result = { bonusCoins: bonusCoins, stars: stars, st2: st2, st3: st3, coins: coins, first: first, mill: hasMill, treasure: treasure, moves: s.moves, time: P.time, shown: 0 };
    setTimeout(function () { B.audio.sfx('victoire'); }, 350);
  };

  /* ───────── saisie ───────── */
  function gearAt(p, movableOnly) {
    var ev = P.ev, best = null, bd = 1e9, i;
    for (i = 0; i < ev.gears.length; i++) {
      var g = ev.gears[i]; if (movableOnly && g.kind !== 'movable') continue;
      if (!ev.gearVisible[i]) continue;
      var q = scr(g), d = Math.hypot(p.x - q.x, p.y - q.y);
      if (d < (C.RP[g.size] + 10) * V.s && d < bd) { bd = d; best = { g: g, k: i }; }
    }
    return best;
  }
  function trayAt(p) {
    for (var i = 0; i < P.L.tray.length; i++) { if (P.s.place[i] >= 0) continue; var t = tray(i); if (Math.hypot(p.x - t.x, p.y - t.y) < C.RP[P.L.tray[i]] * 0.68 + 16) return i; }
    return -1;
  }
  function leverAt(p) { var lv = P.L.levers || []; for (var i = 0; i < lv.length; i++) if (Math.hypot(p.x - scr(lv[i]).x, p.y - scr(lv[i]).y) < 58 * V.s) return i; return -1; }
  P.down = function (p) {
    if (P.overlay || P.won || P.lost) return;
    P.info = null;
    var ti = trayAt(p), hit = gearAt(p), li = leverAt(p);
    P.press = { x: p.x, y: p.y, t: 0, moved: false, held: false };
    if (ti >= 0) { var t = tray(ti); P.drag = { ti: ti, x: t.x, y: t.y, ox: t.x - p.x, oy: t.y - p.y, from: -1, started: false }; }
    else if (hit && hit.g.kind === 'movable') { var hq = scr(hit.g); P.drag = { ti: hit.g.tray, x: hq.x, y: hq.y, ox: hq.x - p.x, oy: hq.y - p.y, from: hit.g.peg, started: false }; P.press.gear = hit; }
    else if (hit) { P.press.gear = hit; }
    else if (li >= 0) P.press.lever = li;
  };
  P.moveP = function (p) {
    var pr = P.press; if (!pr) return;
    if (Math.hypot(p.x - pr.x, p.y - pr.y) > 12) pr.moved = true;
    if (P.drag) {
      if (pr.moved && !P.drag.started) { P.drag.started = true; B.audio.sfx('prise'); P.info = null; }
      if (P.drag.started) {
        var lift = p.touch ? 78 : 0, k = Math.min(1, pr.t * 6);
        P.drag.x = p.x + P.drag.ox * (1 - k); P.drag.y = p.y + P.drag.oy * (1 - k) - lift * k;
        P.drag.x = Math.max(20, Math.min(W - 20, P.drag.x)); P.drag.y = Math.max(BY - 40, Math.min(H - 20, P.drag.y));
        P.drag.snap = snapFor(P.drag);
      }
    }
  };
  function snapFor(d) {
    var best = -1, bd = 62 * V.s, pegs = P.L.pegs;
    for (var i = 0; i < pegs.length; i++) { if (!P.ev.pegVisible[i]) continue; var dd = Math.hypot(d.x - scr(pegs[i]).x, d.y - scr(pegs[i]).y); if (dd < bd) { bd = dd; best = i; } }
    if (best < 0) return null;
    return { peg: best, ok: best === d.from || C.canPlace(P.L, P.s, d.ti, best, P.ev) };
  }
  P.up = function (p) {
    var pr = P.press; P.press = null; if (!pr) return;
    var d = P.drag; P.drag = null;
    if (d && d.started) {
      var sn = d.snap;
      if (sn && sn.ok && sn.peg !== d.from) { P.move({ t: 'place', g: d.ti, p: sn.peg }); }
      else if (sn && !sn.ok) { B.audio.sfx('refus'); P.shake['peg' + sn.peg] = 1; P.say({ fr: 'Ça ne passe pas ici', en: 'It does not fit here' }, '#ffd27a'); }
      else if (!sn && d.from >= 0) { P.move({ t: 'place', g: d.ti, p: -1 }); }
      return;
    }
    if (pr.held || pr.moved) return;
    /* jeu au simple clic : on touche un rouage doré, puis l'axe où le poser */
    if (d) { P.sel = P.sel === d.ti ? null : d.ti; B.audio.sfx('prise'); return; }
    if (P.sel !== null && !(pr.gear && pr.gear.g.runeIndex !== undefined) && pr.lever === undefined) {
      var bp = -1, bdist = 70 * V.s;
      P.L.pegs.forEach(function (pg, pi) { if (!P.ev.pegVisible[pi]) return; var q = scr(pg), dd = Math.hypot(p.x - q.x, p.y - q.y); if (dd < bdist) { bdist = dd; bp = pi; } });
      if (bp >= 0) {
        if (P.s.place[P.sel] === bp) { P.sel = null; return; }
        if (!P.move({ t: 'place', g: P.sel, p: bp })) { B.audio.sfx('refus'); P.shake['peg' + bp] = 1; P.say({ fr: 'Ça ne passe pas ici', en: 'It does not fit here' }, '#ffd27a'); }
        return;
      }
      if (p.y > 1486 && P.s.place[P.sel] >= 0) { P.move({ t: 'place', g: P.sel, p: -1 }); return; }
      if (!pr.gear) { P.sel = null; return; }
    }
    if (!pr.gear && pr.lever === undefined && P.sel === null && p.y > BY && p.y < BY + BH && P.L.tray.length) {
      var near = false; P.L.pegs.forEach(function (pg) { var q = scr(pg); if (Math.hypot(p.x - q.x, p.y - q.y) < 70 * V.s) near = true; });
      if (near) { P.say({ fr: 'Touche d’abord un rouage doré en bas', en: 'Tap a golden gear below first' }, '#ffd27a'); B.audio.sfx('tic'); return; }
    }
    if (pr.gear) {
      var g = pr.gear.g;
      if (g.runeIndex !== undefined) { P.runeAnim[g.runeIndex] = 1; var grp = (P.L.runeLinks && P.L.runeLinks[g.runeIndex]) || []; grp.forEach(function (r) { P.runeAnim[r] = 1; }); P.move({ t: 'rune', r: g.runeIndex }); }
      else P.showInfo(pr.gear);
    } else if (pr.lever !== undefined) { P.leverAnim[pr.lever] = 1; P.move({ t: 'lever', l: pr.lever }); }
  };
  P.showInfo = function (h) {
    var st = P.ev.st[h.k], g = h.g, txt;
    if (g.sealed) txt = { fr: 'Rune endormie : touche-la pour la tourner', en: 'Sleeping rune: tap to rotate it' };
    else if (g.fixed && g.src.water && !st.on) txt = { fr: 'Roue hydraulique : il lui faut de l’eau', en: 'Water wheel: it needs water' };
    else if (g.fixed && g.src.sluice && !P.ev.wet) txt = { fr: 'Écluse fermée : fais circuler l’eau', en: 'Sluice closed: get the water flowing' };
    else if (st.jam) txt = st.reason === 'surcharge' ? { fr: 'Surcharge : deux énergies mélangées', en: 'Overload: two energies mixed' } : st.reason === 'frein' ? { fr: 'Bloqué par un rouage enchaîné', en: 'Jammed by a chained gear' } : { fr: 'Bloqué : rouages en conflit', en: 'Jammed: conflicting gears' };
    else if (st.on) { var sp = st.speed > 1.05 ? { fr: 'rapide', en: 'fast' } : st.speed < 0.95 ? { fr: 'lent', en: 'slow' } : { fr: 'vitesse normale', en: 'normal speed' }; txt = T(st.dir > 0 ? { fr: 'Tourne à droite ↻', en: 'Turns right ↻' } : { fr: 'Tourne à gauche ↺', en: 'Turns left ↺' }) + ' · ' + T(sp); }
    else txt = g.kind === 'red' ? { fr: 'Rouage maudit : à l’arrêt', en: 'Cursed gear: stopped' } : { fr: 'À l’arrêt : aucune énergie', en: 'Stopped: no energy' };
    P.info = { k: h.k, id: g.id, txt: T(txt), t: 0 };
  };

  /* ───────── mise à jour ───────── */
  P.update = function (dt) {
    var L = P.L, ev = P.ev, i;
    if (!P.overlay) {
      if (!P.won && !P.lost) {
        P.time += dt;
        if (L.time) { P.timeLeft -= dt; if (P.timeLeft <= 0) { P.timeLeft = 0; P.lost = 'temps'; P.endT = 0; P.drag = null; P.press = null; } }
      } else {
        P.endT += dt;
        if (P.won && P.endT > 1.5 && !P.overlay) { P.overlay = 'win'; }
        if (P.lost && P.endT > 0.8 && !P.overlay) { P.overlay = 'lose'; B.audio.sfx('defaite'); }
      }
    }
    if (P.press && !P.press.moved) { P.press.t += dt; if (P.press.t > 0.42 && !P.press.held && P.press.gear) { P.press.held = true; P.drag = null; P.showInfo(P.press.gear); B.audio.sfx('tic'); } }
    else if (P.press) P.press.t += dt;
    // angles
    P.order.forEach(function (o) {
      var g = ev.gears[o.k], st = ev.st[o.k], id = g.id;
      if (P.angles[id] === undefined) P.angles[id] = 0;
      if (o.parent < 0) { if (st.on) P.angles[id] += st.dir * st.speed * W0 * dt; }
      else {
        var pg = ev.gears[o.parent], pa = P.angles[pg.id], ratio = C.TEETH[pg.size] / C.TEETH[g.size];
        if (o.flip > 0) P.angles[id] = pa * ratio;
        else { var al = Math.atan2(g.y - pg.y, g.x - pg.x); P.angles[id] = al + Math.PI + (al - pa) * ratio - Math.PI / C.TEETH[g.size]; }
      }
    });
    var target = C.energy(L, P.s, ev); P.energyShown += (target - P.energyShown) * Math.min(1, dt * 5);
    for (var k in P.runeAnim) { P.runeAnim[k] -= dt * 4; if (P.runeAnim[k] <= 0) delete P.runeAnim[k]; }
    for (k in P.shake) { P.shake[k] -= dt * 3; if (P.shake[k] <= 0) delete P.shake[k]; }
    for (k in P.flash) { P.flash[k] -= dt * 1.2; if (P.flash[k] <= 0) delete P.flash[k]; }
    for (k in P.leverAnim) { P.leverAnim[k] -= dt * 5; if (P.leverAnim[k] <= 0) delete P.leverAnim[k]; }
    if (P.msg) { P.msg.t += dt; if (P.msg.t > 2.6) P.msg = null; }
    if (P.info) { P.info.t += dt; if (P.info.t > 3 && !P.press) P.info = null; }
    if (P.hint) P.hint.t += dt;
    if (P.won && Math.random() < dt * 14) { var t = L.targets[Math.floor(Math.random() * L.targets.length)], g = ev.gears[ev.idx[t.gear]]; B.spark(scr(g).x + (Math.random() - 0.5) * 160, scr(g).y + (Math.random() - 0.5) * 160, 2, Math.random() < 0.5 ? '#ffe08a' : '#9fe0ff', { v: 60, up: 40, g: -20, life: 1.2 }); }
  };

  /* ───────── dessin des rouages ───────── */
  function gearImg(mat, size) {
    var name = 'gear_' + mat + '_' + size;
    if (mat === 'gold' && SKINS[save.skin] && SKINS[save.skin].hue !== null) return B.tinted(name, SKINS[save.skin].hue);
    return IMG[name];
  }
  P.gearImg = gearImg;
  function drawShadow(x, y, r) {
    var g = ctx.createRadialGradient(x + 5, y + 10, r * 0.6, x + 5, y + 10, r + 16); g.addColorStop(0, 'rgba(10,4,2,0.55)'); g.addColorStop(1, 'rgba(10,4,2,0)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x + 5, y + 10, r + 16, 0, 6.2832); ctx.fill();
  }
  function drawGear(mat, size, x, y, ang, sc, img) {
    var im = img || gearImg(mat, size), w = im.width / 2 * (sc || 1);
    ctx.save(); ctx.translate(x, y); ctx.rotate(ang); ctx.drawImage(im, -w / 2, -w / 2, w, w); ctx.restore();
  }
  P.drawGear = drawGear;
  function glow(x, y, r, rgb, a) {
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    var g = ctx.createRadialGradient(x, y, r * 0.5, x, y, r); g.addColorStop(0, 'rgba(' + rgb + ',' + a + ')'); g.addColorStop(1, 'rgba(' + rgb + ',0)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r, 0, 6.2832); ctx.fill(); ctx.restore();
  }
  function arrows(x, y, r, dir, rgb, phase, n) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(phase); ctx.globalCompositeOperation = 'lighter';
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    n = n || 3; var span = (6.2832 / n) * 0.62;
    for (var pass = 0; pass < 2; pass++) {
      ctx.strokeStyle = pass ? 'rgba(235,250,255,0.95)' : 'rgba(' + rgb + ',0.55)'; ctx.fillStyle = ctx.strokeStyle; ctx.lineWidth = pass ? Math.max(2.4, r * 0.085) : Math.max(7, r * 0.24);
      for (var i = 0; i < n; i++) {
        var a0 = i * 6.2832 / n, a1 = a0 + span * dir;
        ctx.beginPath(); ctx.arc(0, 0, r, a0, a1, dir < 0); ctx.stroke();
        var hx = Math.cos(a1) * r, hy = Math.sin(a1) * r, ta = a1 + dir * Math.PI / 2, hs = pass ? r * 0.26 : r * 0.34;
        ctx.beginPath(); ctx.moveTo(hx + Math.cos(ta) * hs, hy + Math.sin(ta) * hs); ctx.lineTo(hx + Math.cos(ta + 2.4) * hs, hy + Math.sin(ta + 2.4) * hs); ctx.lineTo(hx + Math.cos(ta - 2.4) * hs, hy + Math.sin(ta - 2.4) * hs); ctx.closePath(); ctx.fill();
      }
    }
    ctx.restore();
  }
  function ring(x, y, r, lw) {
    var g = ctx.createLinearGradient(0, y - r, 0, y + r); g.addColorStop(0, '#fff0b0'); g.addColorStop(0.5, '#e2a23c'); g.addColorStop(1, '#8f5a1c');
    ctx.beginPath(); ctx.arc(x, y, r, 0, 6.2832); ctx.lineWidth = lw + 3; ctx.strokeStyle = '#2e1a0a'; ctx.stroke();
    ctx.beginPath(); ctx.arc(x, y, r, 0, 6.2832); ctx.lineWidth = lw; ctx.strokeStyle = g; ctx.stroke();
  }
  P.ring = ring;
  function rune(x, y, r, ang, lit) {
    ctx.save(); ctx.translate(x, y);
    var g = ctx.createRadialGradient(-r * 0.3, -r * 0.3, r * 0.1, 0, 0, r); g.addColorStop(0, lit ? '#3c5aa8' : '#59607c'); g.addColorStop(1, lit ? '#10204e' : '#2a2e44');
    ctx.beginPath(); ctx.arc(0, 0, r, 0, 6.2832); ctx.fillStyle = g; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = '#141826'; ctx.stroke();
    ctx.beginPath(); ctx.arc(0, 0, r - 3.5, 0, 6.2832); ctx.lineWidth = 1.5; ctx.strokeStyle = lit ? 'rgba(140,220,255,0.8)' : 'rgba(170,180,210,0.35)'; ctx.stroke();
    ctx.rotate(ang); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    function glyph() { ctx.beginPath(); ctx.moveTo(0, r * 0.56); ctx.lineTo(0, -r * 0.6); ctx.moveTo(-r * 0.42, -r * 0.14); ctx.lineTo(0, -r * 0.6); ctx.lineTo(r * 0.42, -r * 0.14); ctx.stroke(); }
    if (lit) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.strokeStyle = 'rgba(80,190,255,0.55)'; ctx.lineWidth = r * 0.36; glyph(); ctx.restore(); ctx.strokeStyle = '#e6fbff'; }
    else ctx.strokeStyle = '#aab3cc';
    ctx.lineWidth = Math.max(2.5, r * 0.15); glyph();
    ctx.restore();
  }
  function chains(x, y, r, on) {
    ctx.save(); ctx.translate(x, y); ctx.globalAlpha = on ? 1 : 0.0;
    if (on) {
      ctx.lineCap = 'round';
      [-0.6, 0.6].forEach(function (a) {
        ctx.save(); ctx.rotate(a);
        for (var i = -3; i <= 3; i++) { ctx.beginPath(); ctx.ellipse(i * r * 0.31, 0, r * 0.2, r * 0.11, 0, 0, 6.2832); ctx.lineWidth = 6.5; ctx.strokeStyle = '#17110c'; ctx.stroke(); ctx.lineWidth = 3.2; ctx.strokeStyle = i % 2 ? '#8d8f98' : '#b9bcc6'; ctx.stroke(); }
        ctx.restore();
      });
      G.lock(0, 4, r * 0.62);
    }
    ctx.restore();
  }
  function pegDraw(x, y, hl) {
    var g = ctx.createRadialGradient(x - 3, y - 3, 1, x, y, 12); g.addColorStop(0, '#fff0b8'); g.addColorStop(0.5, '#d49a3a'); g.addColorStop(1, '#6e4212');
    ctx.beginPath(); ctx.arc(x + 2, y + 4, 13, 0, 6.2832); ctx.fillStyle = 'rgba(0,0,0,0.4)'; ctx.fill();
    ctx.beginPath(); ctx.arc(x, y, 11, 0, 6.2832); ctx.fillStyle = g; ctx.fill(); ctx.lineWidth = 2.5; ctx.strokeStyle = '#2e1a0a'; ctx.stroke();
    ctx.beginPath(); ctx.arc(x, y, 19, 0, 6.2832); ctx.lineWidth = 2; ctx.setLineDash([5, 6]); ctx.strokeStyle = hl ? 'rgba(255,230,150,0.95)' : 'rgba(255,220,150,0.38)'; ctx.stroke(); ctx.setLineDash([]);
  }
  function badge(x, y, r, txt, col) {
    ctx.beginPath(); ctx.arc(x, y, r, 0, 6.2832); var g = ctx.createLinearGradient(0, y - r, 0, y + r); g.addColorStop(0, col || '#b83a3a'); g.addColorStop(1, '#5e1420'); ctx.fillStyle = g; ctx.fill();
    ctx.lineWidth = 3; ctx.strokeStyle = '#f2c868'; ctx.stroke(); ctx.lineWidth = 1; ctx.strokeStyle = '#2e1a0a'; ctx.beginPath(); ctx.arc(x, y, r + 2, 0, 6.2832); ctx.stroke();
    G.text(txt, x, y + 1, r * 1.25, { lw: 3 });
  }
  P.badge = badge;
  var pillClamp = true;
  function pill(txt, x, y, size, col, bg) {
    G.font(size, 900); var w = ctx.measureText(txt).width + size * 1.1, h = size * 1.5;
    if (pillClamp) { var lo = BX - V.ox / V.s, hi = BX + (BW - V.ox) / V.s; x = Math.max(lo + w / 2 + 6, Math.min(hi - w / 2 - 6, x)); }
    G.rr(x - w / 2, y - h / 2, w, h, h / 2); ctx.fillStyle = bg || 'rgba(16,20,48,0.86)'; ctx.fill(); ctx.lineWidth = 1.5; ctx.strokeStyle = 'rgba(240,190,90,0.7)'; ctx.stroke();
    G.text(txt, x, y + 1, size, { color: col || '#fff3d6', lw: 2.5, drop: 1 });
  }

  /* ───────── dessin principal ───────── */
  P.draw = function () {
    var L = P.L, ev = P.ev, s = P.s, t = B.t, i, g, st, x, y;
    ctx.drawImage(IMG.bg_play, 0, 0, W, H);
    // ── bandeau
    G.text(T({ fr: 'NIVEAU ', en: 'LEVEL ' }) + L.id, 268, 76, 46, { grad: ['#fffaf0', '#f3ddb0'], maxW: 320 });
    var mm = P.maxMoves(L), low = mm - s.moves <= 2;
    G.text(T({ fr: 'COUPS : ', en: 'MOVES: ' }) + s.moves + '/' + mm, 633, 76, 40, { grad: low ? ['#ffd0c0', '#ff7a5a'] : ['#fffaf0', '#f3ddb0'], maxW: 270 });
    G.text(B.goalText(L), 470, 171, 31, { maxW: 590, color: '#fff3d6', weight: 700 });
    U.zone('pause', 830, 22, 98, 98, function () { P.overlay = 'pause'; });
    if (U.hot === 'pause') { ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = 0.25; ctx.drawImage(IMG.btn_pause, 824, 16); ctx.restore(); }

    // ── plateau
    ctx.save(); ctx.beginPath(); ctx.rect(BX - 4, BY - 4, BW + 8, BH + 8); ctx.clip();
    ctx.translate(BX + V.ox, BY + V.oy); ctx.scale(V.s, V.s); ctx.translate(-BX, -BY);
    // moteurs
    for (i = 0; i < ev.gears.length; i++) {
      g = ev.gears[i]; if (g.kind !== 'motor') continue;
      var col = g.src.color || 'blue', im = col === 'gold' ? IMG.engine_gold : IMG.engine, ew = 96, eh = ew * im.height / im.width;
      var ex = sx(g) - C.RP[g.size] - 44, ey = sy(g) - 8;
      ctx.save(); ctx.lineCap = 'round'; ctx.globalCompositeOperation = 'lighter';
      ctx.strokeStyle = 'rgba(' + COL[col].glow + ',0.35)'; ctx.lineWidth = 20 + Math.sin(t * 6) * 3; ctx.beginPath(); ctx.moveTo(ex + 30, sy(g)); ctx.lineTo(sx(g), sy(g)); ctx.stroke();
      ctx.strokeStyle = 'rgba(235,250,255,0.9)'; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(ex + 30, sy(g)); ctx.lineTo(sx(g), sy(g)); ctx.stroke(); ctx.restore();
      ctx.drawImage(im, ex - ew / 2, ey - eh / 2, ew, eh);
      glow(ex, ey + 6, 70, COL[col].glow, 0.25 + 0.1 * Math.sin(t * 3));
    }
    // rayons de cristal
    (L.links || []).forEach(function (lk, li) {
      var a = ev.gears[ev.idx[lk.a]], b = ev.gears[ev.idx[lk.b]], on = ev.linkOn[li], pw = on && ev.st[ev.idx[lk.a]].on && ev.st[ev.idx[lk.b]].on;
      ctx.save(); ctx.lineCap = 'round';
      if (on) {
        ctx.globalCompositeOperation = 'lighter';
        ctx.strokeStyle = pw ? 'rgba(90,220,255,0.5)' : 'rgba(110,150,220,0.28)'; ctx.lineWidth = pw ? 16 + Math.sin(t * 8) * 3 : 10; ctx.beginPath(); ctx.moveTo(sx(a), sy(a)); ctx.lineTo(sx(b), sy(b)); ctx.stroke();
        ctx.strokeStyle = pw ? 'rgba(235,252,255,0.95)' : 'rgba(180,200,240,0.55)'; ctx.lineWidth = 4; ctx.setLineDash([16, 12]); ctx.lineDashOffset = pw ? -t * 90 : 0; ctx.beginPath(); ctx.moveTo(sx(a), sy(a)); ctx.lineTo(sx(b), sy(b)); ctx.stroke();
      } else { ctx.strokeStyle = 'rgba(20,24,50,0.55)'; ctx.lineWidth = 4; ctx.setLineDash([4, 14]); ctx.beginPath(); ctx.moveTo(sx(a), sy(a)); ctx.lineTo(sx(b), sy(b)); ctx.stroke(); }
      ctx.restore();
    });
    // liaisons levier → effets
    (L.levers || []).forEach(function (lv) {
      lv.effects.forEach(function (e) {
        var tx, ty;
        if (e.brake) { var bg = ev.gears[ev.idx[e.brake]]; tx = sx(bg); ty = sy(bg); }
        else { var lk = L.links[e.link], a = ev.gears[ev.idx[lk.a]], b = ev.gears[ev.idx[lk.b]]; tx = (sx(a) + sx(b)) / 2; ty = (sy(a) + sy(b)) / 2; }
        ctx.save(); ctx.setLineDash([3, 9]); ctx.lineCap = 'round'; ctx.lineWidth = 3.5; ctx.strokeStyle = 'rgba(30,14,6,0.6)'; ctx.beginPath(); ctx.moveTo(BX + lv.x, BY + lv.y + 2); ctx.lineTo(tx, ty + 2); ctx.stroke();
        ctx.strokeStyle = 'rgba(240,190,110,0.75)'; ctx.lineWidth = 2.2; ctx.beginPath(); ctx.moveTo(BX + lv.x, BY + lv.y); ctx.lineTo(tx, ty); ctx.stroke(); ctx.restore();
      });
    });
    // axes libres
    var used = {}; s.place.forEach(function (p) { if (p >= 0) used[p] = 1; });
    L.pegs.forEach(function (p, pi) {
      var act = P.drag && P.drag.started ? P.drag.ti : P.sel, actFrom = act === null ? -2 : s.place[act];
      if (used[pi] && actFrom !== pi) return;
      var hl = false, sh = P.shake['peg' + pi] ? Math.sin(P.shake['peg' + pi] * 40) * 6 * P.shake['peg' + pi] : 0;
      if (act !== null && ev.pegVisible[pi] && !(used[pi] && !(P.drag && P.drag.started))) {
        var ok = C.canPlace(L, s, act, pi, ev);
        if (ok) { hl = true; ctx.beginPath(); ctx.arc(BX + p.x, BY + p.y, C.RP[L.tray[act]], 0, 6.2832); ctx.setLineDash([8, 8]); ctx.lineDashOffset = -t * 30; ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(255,225,140,' + (0.45 + 0.25 * Math.sin(t * 6)) + ')'; ctx.stroke(); ctx.setLineDash([]); }
      }
      pegDraw(BX + p.x + sh, BY + p.y, hl);
    });
    // ombres
    for (i = 0; i < ev.gears.length; i++) { g = ev.gears[i]; if (P.drag && P.drag.started && g.tray === P.drag.ti) continue; drawShadow(sx(g), sy(g), C.RP[g.size] + C.ADD); }
    // rouages (éteints d'abord, alimentés ensuite)
    var tOf = {}; L.targets.forEach(function (tg, ti) { tOf[tg.gear] = ti; });
    for (var pass = 0; pass < 2; pass++) for (i = 0; i < ev.gears.length; i++) {
      g = ev.gears[i]; st = ev.st[i];
      if ((pass === 0) === st.on) continue;
      if (P.drag && P.drag.started && g.tray === P.drag.ti) continue;
      x = sx(g); y = sy(g);
      var ang = P.angles[g.id] || 0, rp = C.RP[g.size], ra = rp + C.ADD, c = COL[st.color || 'blue'];
      if (st.jam) { ang += Math.sin(t * 38 + i) * 0.035; }
      var mat = g.kind === 'movable' || g.kind === 'motor' ? 'gold' : g.kind === 'red' ? 'red' : 'steel';
      if (st.on) glow(x, y, ra + 30, c.glow, 0.5);
      if (st.jam) glow(x, y, ra + 22, '255,70,50', 0.35 + 0.2 * Math.sin(t * 10));
      drawGear(mat, g.size, x, y, ang, 1, g.kind === 'motor' ? IMG['gear_gold_' + g.size] : null);
      if (g.sealed) { ctx.save(); ctx.globalAlpha = 0.3; ctx.fillStyle = '#0a0e24'; ctx.beginPath(); ctx.arc(x, y, ra - 2, 0, 6.2832); ctx.fill(); ctx.restore(); }
      var ti2 = tOf[g.id];
      if (ti2 !== undefined) {
        var tg = L.targets[ti2], lit = C.isLit(L, s, ev, ti2), R = rp - 15, fl = P.flash[g.id] || 0;
        var mi = IMG['m_' + tg.type + (lit ? '' : '_f')];
        ctx.drawImage(mi, x - R, y - R, R * 2, R * 2);
        if (lit) { glow(x, y, R + 26 + fl * 30, tg.order ? '255,205,90' : c.glow, 0.35 + fl * 0.5); }
        ring(x, y, R, 5);
        if (tg.color) { ctx.beginPath(); ctx.arc(x, y, R + 5.5, 0, 6.2832); ctx.lineWidth = 3; ctx.strokeStyle = COL[tg.color].hex; ctx.globalAlpha = 0.6 + 0.3 * Math.sin(t * 4); ctx.stroke(); ctx.globalAlpha = 1; }
      } else if (st.on) {
        arrows(x, y, rp * 0.62, st.dir, c.glow, st.dir * t * 1.8 * st.speed, g.size === 'S' ? 2 : 3);
      }
      if (g.runeIndex !== undefined) {
        var ra2 = P.runeAnim[g.runeIndex] || 0; rune(x, y, rp * 0.5, (g.o - ra2) * Math.PI / 2, !g.sealed);
        // repère « haut »
        ctx.save(); ctx.translate(x, y - ra - 9); ctx.beginPath(); ctx.moveTo(0, 9); ctx.lineTo(-9, -6); ctx.lineTo(9, -6); ctx.closePath(); ctx.fillStyle = g.sealed ? '#c9d2e6' : '#7fe0ff'; ctx.fill(); ctx.lineWidth = 2.5; ctx.strokeStyle = '#141826'; ctx.stroke(); ctx.restore();
      }
      if (g.fixed && g.src.brake) chains(x, y, rp, ev.braked[i]);
      if (g.fixed && (g.src.water || g.src.pump || g.src.sluice)) {
        var R3 = rp * 0.5, wet = ev.wet, active = g.src.pump ? st.on : wet;
        var wg = ctx.createRadialGradient(x - R3 * 0.3, y - R3 * 0.3, 2, x, y, R3); wg.addColorStop(0, active ? '#bff2ff' : '#7c8aa6'); wg.addColorStop(1, active ? '#1f7fd0' : '#39445e');
        ctx.beginPath(); ctx.arc(x, y, R3, 0, 6.2832); ctx.fillStyle = wg; ctx.fill(); ring(x, y, R3, 3.5);
        ctx.save(); ctx.translate(x, y); ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.strokeStyle = '#fff'; ctx.fillStyle = '#fff'; ctx.lineWidth = Math.max(2.5, R3 * 0.14);
        if (g.src.water) { for (var wv = -1; wv <= 1; wv++) { ctx.beginPath(); var ph = active ? t * 4 : 0; for (var xx = -R3 * 0.55; xx <= R3 * 0.56; xx += 3) { var yy2 = wv * R3 * 0.32 + Math.sin(xx / (R3 * 0.18) + ph) * R3 * 0.09; if (xx === -R3 * 0.55) ctx.moveTo(xx, yy2); else ctx.lineTo(xx, yy2); } ctx.stroke(); } }
        else if (g.src.pump) { ctx.beginPath(); ctx.moveTo(0, -R3 * 0.62); ctx.bezierCurveTo(R3 * 0.62, R3 * 0.1, R3 * 0.42, R3 * 0.62, 0, R3 * 0.62); ctx.bezierCurveTo(-R3 * 0.42, R3 * 0.62, -R3 * 0.62, R3 * 0.1, 0, -R3 * 0.62); ctx.fill(); if (active && Math.random() < 0.2) B.spark(scr(g).x, scr(g).y, 1, '#9fe0ff', { v: 90, up: 80, g: 200, life: 0.7, r: 3 }); }
        else { ctx.lineWidth = Math.max(3, R3 * 0.16); var gy = wet ? -R3 * 0.5 : R3 * 0.05; ctx.beginPath(); ctx.moveTo(-R3 * 0.5, -R3 * 0.55); ctx.lineTo(-R3 * 0.5, R3 * 0.55); ctx.moveTo(R3 * 0.5, -R3 * 0.55); ctx.lineTo(R3 * 0.5, R3 * 0.55); ctx.stroke(); ctx.fillRect(-R3 * 0.5, gy, R3, R3 * 0.5); }
        ctx.restore();
      }
    }
    // fils des runes liées
    if (L.runeLinks) {
      var runes = ev.gears.filter(function (q) { return q.runeIndex !== undefined; });
      for (var ri in L.runeLinks) L.runeLinks[ri].forEach(function (rj) {
        var a = runes[+ri], b = runes[rj], ax = sx(a), ay = sy(a), bx = sx(b), by = sy(b), d = Math.hypot(bx - ax, by - ay), ux = (bx - ax) / d, uy = (by - ay) / d;
        var r1 = C.RP[a.size] * 0.5 + 4, r2 = C.RP[b.size] * 0.5 + 10;
        var x1 = ax + ux * r1, y1 = ay + uy * r1, x2 = bx - ux * r2, y2 = by - uy * r2, mx = (x1 + x2) / 2 - uy * 26, my = (y1 + y2) / 2 + ux * 26;
        ctx.save(); ctx.lineCap = 'round'; ctx.globalCompositeOperation = 'lighter';
        ctx.strokeStyle = 'rgba(80,190,255,0.45)'; ctx.lineWidth = 9; ctx.beginPath(); ctx.moveTo(x1, y1); ctx.quadraticCurveTo(mx, my, x2, y2); ctx.stroke();
        ctx.strokeStyle = 'rgba(230,250,255,0.95)'; ctx.lineWidth = 3; ctx.setLineDash([9, 8]); ctx.lineDashOffset = -t * 40; ctx.beginPath(); ctx.moveTo(x1, y1); ctx.quadraticCurveTo(mx, my, x2, y2); ctx.stroke(); ctx.setLineDash([]);
        var ta = Math.atan2(y2 - my, x2 - mx); ctx.fillStyle = 'rgba(230,250,255,0.95)'; ctx.beginPath(); ctx.moveTo(x2 + Math.cos(ta) * 10, y2 + Math.sin(ta) * 10); ctx.lineTo(x2 + Math.cos(ta + 2.5) * 11, y2 + Math.sin(ta + 2.5) * 11); ctx.lineTo(x2 + Math.cos(ta - 2.5) * 11, y2 + Math.sin(ta - 2.5) * 11); ctx.closePath(); ctx.fill();
        ctx.restore();
      });
    }
    // cristaux aux extrémités des rayons
    (L.links || []).forEach(function (lk) { [lk.a, lk.b].forEach(function (id) { var q = ev.gears[ev.idx[id]]; G.gem(sx(q), sy(q), 11, '#56d8ff'); }); });
    // leviers
    (L.levers || []).forEach(function (lv, li) {
      var im = IMG.lever, w = 88, h = w * im.height / im.width, on = s.levers[li], k = P.leverAnim[li] || 0;
      ctx.save(); ctx.translate(BX + lv.x, BY + lv.y); ctx.scale((on ? -1 : 1) * (1 - k * 0.25), 1 + k * 0.06);
      ctx.shadowColor = 'rgba(0,0,0,0.5)'; ctx.shadowBlur = 10; ctx.shadowOffsetY = 6; ctx.drawImage(im, -w / 2, -h / 2 - 6, w, h); ctx.restore();
    });
    // étiquettes des cibles
    L.targets.forEach(function (tg, ti) {
      g = ev.gears[ev.idx[tg.gear]]; x = sx(g); y = sy(g); var ra = C.RP[g.size] + C.ADD, tv = ev.targets[ti], lit = C.isLit(L, s, ev, ti);
      var bad = tv.wrongDir || tv.wrongColor;
      pill(T(NAMES[tg.type]) + (tg.bonus ? ' ★' : ''), x, y + ra + 17, 19, lit ? '#ffe9a0' : bad ? '#ff9a8a' : '#e8ecff');
      if (tg.dir) {
        var rr = ra + 13, a0 = -Math.PI / 2 - 0.55 * tg.dir, a1 = -Math.PI / 2 + 0.55 * tg.dir;
        ctx.save(); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
        for (var ps = 0; ps < 2; ps++) {
          ctx.strokeStyle = ps ? (tv.wrongDir ? '#ff6a50' : lit ? '#fff0b0' : '#ffd060') : '#2a1206'; ctx.fillStyle = ctx.strokeStyle; ctx.lineWidth = ps ? 6 : 11;
          ctx.beginPath(); ctx.arc(x, y, rr, a0, a1, tg.dir < 0); ctx.stroke();
          var hx = x + Math.cos(a1) * rr, hy = y + Math.sin(a1) * rr, ta = a1 + tg.dir * Math.PI / 2, hs = ps ? 13 : 17;
          ctx.beginPath(); ctx.moveTo(hx + Math.cos(ta) * hs, hy + Math.sin(ta) * hs); ctx.lineTo(hx + Math.cos(ta + 2.3) * hs, hy + Math.sin(ta + 2.3) * hs); ctx.lineTo(hx + Math.cos(ta - 2.3) * hs, hy + Math.sin(ta - 2.3) * hs); ctx.closePath(); ctx.fill();
        }
        ctx.restore();
      }
      if (tg.order) badge(x + ra * 0.72, y - ra * 0.72, 19, tg.order, lit ? '#d99a1e' : '#b83a3a');
      if (tg.speed) { var bx2 = x + ra * 0.72, by2 = y - ra * 0.72; badge(bx2, by2, 20, '', lit ? '#2f7a3a' : tv.wrongSpeed ? '#b83a3a' : '#3a4a8a'); ctx.save(); ctx.translate(bx2, by2); ctx.fillStyle = '#fff'; ctx.strokeStyle = '#141826'; ctx.lineWidth = 2; ctx.lineJoin = 'round'; var na = tg.speed === 'fast' ? 2 : 1; for (var q2 = 0; q2 < na; q2++) { var ox2 = (q2 - (na - 1) / 2) * 12; ctx.beginPath(); ctx.moveTo(ox2 - 6, -9); ctx.lineTo(ox2 + 7, 0); ctx.lineTo(ox2 - 6, 9); ctx.closePath(); ctx.stroke(); ctx.fill(); } if (tg.speed === 'slow') { ctx.fillRect(-11, -9, 4, 18); } ctx.restore(); }
      if (tg.color) G.gem(x - ra * 0.72, y - ra * 0.72, 11, tg.color === 'gold' ? '#ffcf4a' : '#3fb0ff');
    });
    ctx.restore();
    // brume
    if (L.fog) {
      fctx.globalCompositeOperation = 'source-over'; fctx.clearRect(0, 0, BW, BH);
      var fg = fctx.createLinearGradient(0, 0, 0, BH); fg.addColorStop(0, 'rgba(26,34,70,0.97)'); fg.addColorStop(1, 'rgba(14,18,44,0.97)'); fctx.fillStyle = fg; fctx.fillRect(0, 0, BW, BH);
      for (i = 0; i < 5; i++) { var bx = (i * 190 + t * (12 + i * 3)) % (BW + 300) - 150, by = 90 + i * 130 + Math.sin(t * 0.4 + i) * 30, mg = fctx.createRadialGradient(bx, by, 10, bx, by, 190); mg.addColorStop(0, 'rgba(120,140,210,0.20)'); mg.addColorStop(1, 'rgba(120,140,210,0)'); fctx.fillStyle = mg; fctx.fillRect(bx - 190, by - 190, 380, 380); }
      fctx.globalCompositeOperation = 'destination-out';
      for (i = 0; i < ev.gears.length; i++) {
        g = ev.gears[i]; if (!(ev.st[i].on || g.kind === 'motor')) continue;
        var fq = scr(g), fx0 = fq.x - BX, fy0 = fq.y - BY, R2 = (C.FOG_R + 46) * V.s, hg = fctx.createRadialGradient(fx0, fy0, R2 * 0.55, fx0, fy0, R2); hg.addColorStop(0, 'rgba(0,0,0,1)'); hg.addColorStop(1, 'rgba(0,0,0,0)'); fctx.fillStyle = hg; fctx.beginPath(); fctx.arc(fx0, fy0, R2, 0, 6.2832); fctx.fill();
      }
      ctx.save(); G.rr(BX - 2, BY - 2, BW + 4, BH + 4, 10); ctx.clip(); ctx.drawImage(fogCanvas, BX, BY); ctx.restore();
    }

    // ── sablier
    if (L.time) {
      var tl = Math.ceil(P.timeLeft), urgent = tl <= 15;
      G.rr(380, 372, 182, 54, 27); ctx.fillStyle = urgent ? 'rgba(90,16,20,0.95)' : 'rgba(16,20,48,0.95)'; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = '#e8b04a'; ctx.stroke();
      ctx.save(); ctx.translate(415, 399); ctx.rotate(urgent ? Math.sin(t * 12) * 0.2 : 0); ctx.fillStyle = '#ffe08a'; ctx.strokeStyle = '#2e1a0a'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(-10, -15); ctx.lineTo(10, -15); ctx.lineTo(2, 0); ctx.lineTo(10, 15); ctx.lineTo(-10, 15); ctx.lineTo(-2, 0); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.fillRect(-12, -18, 24, 4); ctx.fillRect(-12, 14, 24, 4); ctx.restore();
      G.text(Math.floor(tl / 60) + ':' + ('0' + (tl % 60)).slice(-2), 492, 400, 32, { color: urgent ? '#ffb0a0' : '#fff3d6', lw: 4 });
    }
    // ── bulle d'information
    if (P.info && ev.gears[P.info.k] && ev.gears[P.info.k].id === P.info.id) {
      g = ev.gears[P.info.k]; var iq = scr(g), ir = C.RP[g.size] * V.s, iy = iq.y - ir - 40; if (iy < BY + 24) iy = iq.y + ir + 50;
      pillClamp = false; G.font(22, 900); var iw = ctx.measureText(P.info.txt).width / 2 + 20; pill(P.info.txt, Math.max(BX + iw, Math.min(BX + BW - iw, iq.x)), iy, 22, '#fff3d6', 'rgba(12,16,44,0.94)'); pillClamp = true;
    }
    // ── message
    if (P.msg) { var a = Math.min(1, P.msg.t * 6, (2.6 - P.msg.t) * 3); ctx.save(); ctx.globalAlpha = Math.max(0, a); G.font(25, 900); var mw = Math.min(760, ctx.measureText(P.msg.txt).width + 60); G.rr(W / 2 - mw / 2, 1082 - 26, mw, 52, 26); ctx.fillStyle = 'rgba(12,16,44,0.94)'; ctx.fill(); ctx.lineWidth = 2.5; ctx.strokeStyle = '#e8b04a'; ctx.stroke(); G.text(P.msg.txt, W / 2, 1083, 25, { color: P.msg.col, maxW: 700, lw: 3 }); ctx.restore(); }

    // ── barre d'énergie
    var ef = P.energyShown;
    if (ef > 0.005) {
      ctx.save(); G.rr(129, 1278, 684, 38, 17); ctx.clip();
      var fw = 684 * ef; ctx.drawImage(IMG.energy_fill, 129, 1278, Math.max(fw, 1), 38);
      ctx.globalCompositeOperation = 'lighter'; var shx = 129 + ((t * 260) % (684 + 200)) - 100; var sg = ctx.createLinearGradient(shx - 60, 0, shx + 60, 0); sg.addColorStop(0, 'rgba(255,255,255,0)'); sg.addColorStop(0.5, 'rgba(255,255,255,0.45)'); sg.addColorStop(1, 'rgba(255,255,255,0)'); ctx.fillStyle = sg; ctx.fillRect(129, 1278, fw, 38);
      ctx.restore();
      glow(129 + fw, 1297, 34, '120,210,255', 0.6);
    }
    // ── boutons du bas
    function lbl(id, x0, y0, w0, h0, txt, tx, mw, fn) {
      var pr = U.zone(id, x0, y0, w0, h0, fn);
      if (pr) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; G.rr(x0 + 6, y0 + 6, w0 - 12, h0 - 12, 18); ctx.fillStyle = 'rgba(255,255,255,0.16)'; ctx.fill(); ctx.restore(); }
      G.text(txt, tx, y0 + h0 / 2 + 1, 31, { maxW: mw, color: '#fff6e0' });
    }
    lbl('undo', 20, 1372, 282, 96, T({ fr: 'ANNULER', en: 'UNDO' }), 196, 168, P.undo);
    lbl('restart', 316, 1372, 332, 96, T({ fr: 'RECOMMENCER', en: 'RESTART' }), 517, 222, function () { P.restart(); });
    lbl('hint', 661, 1372, 264, 96, T({ fr: 'INDICE', en: 'HINT' }), 826, 128, P.askHint);
    badge(905, 1380, 21, save.hints, save.hints > 0 ? '#2f7a3a' : '#7a2f2f');

    // ── réserve de rouages
    G.rr(28, 1486, W - 56, 172, 30); ctx.fillStyle = 'rgba(14,18,44,0.72)'; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(232,176,74,0.85)'; ctx.stroke();
    G.rr(36, 1494, W - 72, 156, 24); ctx.lineWidth = 1.2; ctx.strokeStyle = 'rgba(240,190,90,0.4)'; ctx.stroke();
    var anyTray = false;
    for (i = 0; i < L.tray.length; i++) {
      var tp = tray(i);
      if (s.place[i] >= 0 || (P.drag && P.drag.started && P.drag.ti === i)) { ctx.beginPath(); ctx.arc(tp.x, tp.y, C.RP[L.tray[i]] * 0.68, 0, 6.2832); ctx.setLineDash([6, 8]); ctx.lineWidth = 2; ctx.strokeStyle = 'rgba(240,190,90,0.3)'; ctx.stroke(); ctx.setLineDash([]); continue; }
      anyTray = true; drawShadow(tp.x, tp.y, C.RP[L.tray[i]] * 0.68); if (P.sel === i) { glow(tp.x, tp.y, C.RP[L.tray[i]] * 0.68 + 44, '255,225,140', 0.75); } drawGear('gold', L.tray[i], tp.x, tp.y, P.sel === i ? t * 1.2 : Math.sin(t * 0.8 + i) * 0.15, P.sel === i ? 0.76 : 0.68);
    }
    if (!L.tray.length || (!anyTray && !(P.drag && P.drag.started))) G.text(L.tray.length ? T({ fr: 'Tous les rouages sont posés', en: 'All gears are placed' }) : T({ fr: 'Touche les runes et les leviers', en: 'Tap the runes and levers' }), W / 2, 1572, 24, { color: 'rgba(255,243,214,0.55)', stroke: false, weight: 700 });

    if (P.sel !== null && s.place[P.sel] >= 0) { var sq = scr(L.pegs[s.place[P.sel]]); ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.lineWidth = 6; ctx.strokeStyle = 'rgba(255,235,150,' + (0.6 + 0.3 * Math.sin(t * 7)) + ')'; ctx.beginPath(); ctx.arc(sq.x, sq.y, (C.RP[L.tray[P.sel]] + 14) * V.s, 0, 6.2832); ctx.stroke(); ctx.restore(); }
    // ── indice (et démonstration du geste au tout premier niveau)
    var guide = P.hint || (L.id === 1 && s.moves === 0 && !P.overlay && !P.won && !(P.drag && P.drag.started) ? { mv: { t: 'place', g: 0, p: 0 }, t: t, demo: true } : null);
    if (guide) {
      var mv = guide.mv, pu = 0.5 + 0.5 * Math.sin(guide.t * 7), fx, fy, tx2, ty2;
      ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.lineWidth = 6; ctx.strokeStyle = 'rgba(255,235,150,' + (0.55 + 0.4 * pu) + ')';
      if (mv.t === 'place') {
        var rr2 = C.RP[L.tray[mv.g]];
        if (s.place[mv.g] >= 0) { var hq1 = scr(L.pegs[s.place[mv.g]]); fx = hq1.x; fy = hq1.y; rr2 *= V.s; } else { var tq = tray(mv.g); fx = tq.x; fy = tq.y; rr2 *= 0.68; }
        if (mv.p >= 0) { var hq2 = scr(L.pegs[mv.p]); tx2 = hq2.x; ty2 = hq2.y; } else { tx2 = W / 2; ty2 = 1572; }
        ctx.beginPath(); ctx.arc(fx, fy, rr2 + 14 + pu * 6, 0, 6.2832); ctx.stroke();
        ctx.beginPath(); ctx.arc(tx2, ty2, 26 + pu * 8, 0, 6.2832); ctx.stroke();
        ctx.setLineDash([14, 14]); ctx.lineDashOffset = -guide.t * 80; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(fx, fy); ctx.lineTo(tx2, ty2); ctx.stroke(); ctx.setLineDash([]);
        var kk = (guide.t * 0.7) % 1; ctx.globalAlpha = Math.sin(kk * Math.PI); drawGear('gold', L.tray[mv.g], fx + (tx2 - fx) * kk, fy + (ty2 - fy) * kk, 0, 0.5);
      } else if (mv.t === 'rune') {
        var rg = ev.gears.filter(function (q) { return q.runeIndex === mv.r; })[0]; var rq = scr(rg); ctx.beginPath(); ctx.arc(rq.x, rq.y, (C.RP[rg.size] + 16) * V.s + pu * 8, 0, 6.2832); ctx.stroke();
      } else { var lv2 = L.levers[mv.l]; var lq = scr(lv2); ctx.beginPath(); ctx.arc(lq.x, lq.y, 56 * V.s + pu * 8, 0, 6.2832); ctx.stroke(); }
      ctx.restore();
    }
    // ── rouage en cours de déplacement
    if (P.drag && P.drag.started) {
      var d = P.drag, sz = L.tray[d.ti], dx = d.x, dy = d.y;
      if (d.snap) { var pp = scr(L.pegs[d.snap.peg]); dx = pp.x; dy = pp.y; }
      var dsc = dy > BY + BH + 60 ? 0.68 + (V.s - 0.68) * Math.max(0, 1 - (dy - BY - BH - 60) / 200) : V.s;
      drawShadow(dx + 6, dy + 12, (C.RP[sz] + 8) * dsc);
      if (d.snap && d.snap.ok) glow(dx, dy, (C.RP[sz] + 40) * dsc, '255,225,140', 0.55);
      if (d.snap && !d.snap.ok) glow(dx, dy, (C.RP[sz] + 40) * dsc, '255,70,50', 0.6);
      ctx.save(); ctx.globalAlpha = d.snap && !d.snap.ok ? 0.75 : 1; drawGear('gold', sz, dx, dy, t * 0.6, 1.03 * dsc); ctx.restore();
    }
    B.drawParts(B.dt);
    if (P.overlay) RE.overlays[P.overlay]();
  };
})(window);
