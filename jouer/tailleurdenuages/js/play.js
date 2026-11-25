/* Le Tailleur de Nuages - ecran de jeu : plateau, decoupe, rotation, pose, validation, indices. */
(function () {
  var TN = window.TN, C = TN.core, $ = TN.$, CS = 46, GX = 11, GY = 10, TOP = 84, PAD = 8;
  var el, scene, L, par, st, dom = {}, tex = new Image(), perso, porteEl, filEl, conseil, main;
  tex.src = 'img/nuage.jpg';
  var COUT = { i1: 15, i2: 30, i3: 100, restart: 100 };
  /* un paysage par monde : fond (img/fondN.jpg), falaise et obstacle */
  var ILES = ['prairie', 'foret', 'mer', 'lave', 'cite', 'palais', 'r7', 'r8', 'r9', 'r10', 'r11', 'r12'], OBST = ['rocher', 'arbre', 'obst_mer', 'obst_lave', 'obst_cite', 'obst_palais', 'obst_r7', 'obst_r8', 'obst_r9', 'obst_r10', 'obst_r11', 'obst_r12'];

  el = $('<div class="screen" id="play"><img class="fill" id="pfond">' +
    '<div class="hud"><div class="chip v t" id="hNiv"></div><div class="chip" id="hMor"></div><div class="chip" id="hCou"></div><div class="sp"></div><button class="rond" id="bPause">' + TN.ic.pause + '</button></div>' +
    '<div class="obj" id="hObj"></div><div id="scene"></div>' +
    '<div id="tray"><div class="zone"></div><div class="cmd"><button class="rond" id="bRot">' + TN.ic.rot + '</button><button class="pil o grand t" id="bVal"></button><button class="rond" id="bCut">' + TN.ic.cut + '</button></div></div>' +
    '<div class="bas"><button class="pil v" id="bUndo"></button><button class="pil v" id="bRes"></button><button class="pil o" id="bHint"></button></div></div>');
  TN.stage.appendChild(el); scene = el.querySelector('#scene');
  function q(id) { return el.querySelector(id); }

  /* ---------- dessin d'un morceau de nuage (texture peinte decoupee a la forme) ---------- */
  function tagged(p) { /* cases avec la partie (0/1) pour tracer la ligne de decoupe, apres rotation */
    var cells = p.cut ? p.cut[0].map(function (c) { return [c[0], c[1], 0]; }).concat(p.cut[1].map(function (c) { return [c[0], c[1], 1]; })) : p.cells.map(function (c) { return [c[0], c[1], 0]; });
    for (var k = 0; k < p.r; k++) cells = cells.map(function (c) { return [-c[1], c[0], c[2]]; });
    var mx = Math.min.apply(null, cells.map(function (c) { return c[0]; })), my = Math.min.apply(null, cells.map(function (c) { return c[1]; }));
    return cells.map(function (c) { return [c[0] - mx, c[1] - my, c[2]]; });
  }
  function drawCloud(cells, seed, cs) {
    cs = cs || CS;
    var w = 0, h = 0, has = {}; cells.forEach(function (c) { has[c[0] + ',' + c[1]] = c[2] + 1; if (c[0] + 1 > w) w = c[0] + 1; if (c[1] + 1 > h) h = c[1] + 1; });
    var Wp = w * cs + 2 * PAD, Hp = h * cs + 2 * PAD, m = document.createElement('canvas'); m.width = Wp; m.height = Hp;
    var g = m.getContext('2d'), i = 1.5, rw = cs - 2 * i, R = cs * 0.33; g.fillStyle = '#fff';
    cells.forEach(function (c) {
      var x = c[0] * cs + PAD + i, y = c[1] * cs + PAD + i;
      g.beginPath(); g.moveTo(x + R, y); g.arcTo(x + rw, y, x + rw, y + rw, R); g.arcTo(x + rw, y + rw, x, y + rw, R); g.arcTo(x, y + rw, x, y, R); g.arcTo(x, y, x + rw, y, R); g.fill();
      var rt = has[(c[0] + 1) + ',' + c[1]], dn = has[c[0] + ',' + (c[1] + 1)];
      if (rt) g.fillRect(x + rw / 2, y, cs, rw);
      if (dn) g.fillRect(x, y + rw / 2, rw, cs);
      if (rt && dn && has[(c[0] + 1) + ',' + (c[1] + 1)]) g.fillRect(x + rw / 2, y + rw / 2, cs, cs);
      if (!has[c[0] + ',' + (c[1] - 1)]) { g.beginPath(); g.arc(x + rw * 0.3, y + 5, cs * 0.2, 0, 7); g.arc(x + rw * 0.72, y + 6, cs * 0.17, 0, 7); g.fill(); }
    });
    var t = document.createElement('canvas'); t.width = Wp; t.height = Hp; var tg = t.getContext('2d');
    tg.drawImage(m, 0, 0); tg.globalCompositeOperation = 'source-in';
    var s = 512 / Math.max(Wp, Hp, 300) , ox = (seed * 37) % 120, oy = (seed * 71) % 120;
    if (tex.complete && tex.naturalWidth) tg.drawImage(tex, ox, oy, Math.min(392, Wp * 1.3), Math.min(392, Hp * 1.3), 0, 0, Wp, Hp); else { tg.fillStyle = '#efe9ff'; tg.fillRect(0, 0, Wp, Hp); }
    tg.globalCompositeOperation = 'source-atop';
    var lg = tg.createLinearGradient(0, 0, 0, Hp); lg.addColorStop(0, 'rgba(255,255,255,.55)'); lg.addColorStop(0.45, 'rgba(255,255,255,0)'); lg.addColorStop(1, 'rgba(120,90,200,.38)');
    tg.fillStyle = lg; tg.fillRect(0, 0, Wp, Hp);
    var o = document.createElement('canvas'); o.width = Wp; o.height = Hp; var og = o.getContext('2d');
    og.shadowColor = 'rgba(70,40,140,.55)'; og.shadowBlur = 5; og.shadowOffsetY = 3; og.drawImage(m, 0, 0);
    og.shadowColor = 'transparent'; og.drawImage(t, 0, 0);
    /* ligne de decoupe en pointilles */
    og.strokeStyle = '#3a2580'; og.lineWidth = 3; og.setLineDash([6, 5]); og.lineCap = 'round'; og.beginPath();
    cells.forEach(function (c) {
      var a = has[(c[0] + 1) + ',' + c[1]], b = has[c[0] + ',' + (c[1] + 1)], x = c[0] * cs + PAD, y = c[1] * cs + PAD;
      if (a && a !== c[2] + 1) { og.moveTo(x + cs, y + 3); og.lineTo(x + cs, y + cs - 3); }
      if (b && b !== c[2] + 1) { og.moveTo(x + 3, y + cs); og.lineTo(x + cs - 3, y + cs); }
    });
    og.stroke();
    return o;
  }
  TN.drawCloud = drawCloud;

  /* ---------- etat ---------- */
  function pieces() { return C.pieces(L, st.cuts); }
  function info(id) { var a = pieces(); for (var i = 0; i < a.length; i++) if (a[i].id === id) return a[i]; return null; }
  function placedMap(except) { var m = {}; for (var id in st.pcs) if (st.pcs[id].w === 'g' && id !== except) m[id] = { x: st.pcs[id].x, y: st.pcs[id].y, r: st.pcs[id].r }; return m; }
  function nGrid(except) { return Object.keys(placedMap(except)).length; }
  function snap() { st.hist.push(JSON.stringify({ cuts: st.cuts, pcs: st.pcs, coups: st.coups })); }
  function cellsOf(id) { return C.rot(info(id).cells, st.pcs[id].r); }

  /* ---------- mise en place d'un niveau ---------- */
  TN.startLevel = function (id) {
    L = TN.levels[id - 1]; par = TN.pars[id]; TN.mapRegion = L.world;
    for (var k in dom) dom[k].remove(); dom = {};   /* on redessine tous les nuages : chaque niveau a ses propres formes */
    st = { cuts: {}, pcs: {}, coups: 0, hist: [], errors: 0, sel: null, busy: false, ghosts: [], doubled: false };
    pieces().forEach(function (p) { st.pcs[p.id] = { w: 't', x: 0, y: 0, r: 0 }; });
    q('#pfond').src = 'img/fond' + L.world + '.jpg';
    buildScene(); TN.show('play'); render(); TN.music.scene('niveau');
    if (L.id === 1 && !TN.S.vu.main) showHand();
  };
  function cx(x) { return GX + x * CS + CS / 2; }
  function fy(y) { return GY + (y + 1) * CS; }
  function buildScene() {
    scene.innerHTML = ''; clearHand();
    scene.appendChild($('<div class="pts" style="left:' + GX + 'px;top:' + GY + 'px;width:' + L.W * CS + 'px;height:' + L.H * CS + 'px"></div>'));
    L.islands.forEach(function (s) {
      for (var x = s.x0; x <= s.x1; x++) scene.appendChild($('<img class="ile" src="img/ile_' + ILES[L.world - 1] + '.png" style="left:' + (cx(x) - 35) + 'px;top:' + (GY + s.top * CS - 8) + 'px;width:70px;height:' + ((L.H - s.top) * CS + 60) + 'px">'));
    });
    (L.blocks || []).forEach(function (b) { scene.appendChild($('<img class="obst" data-b="' + b[0] + ',' + b[1] + '" src="img/' + OBST[L.world - 1] + '.png" style="left:' + (GX + b[0] * CS - 4) + 'px;top:' + (GY + b[1] * CS - 4) + 'px;width:' + (CS + 8) + 'px;height:' + (CS + 8) + 'px">')); });
    porteEl = $('<img class="porte" src="img/porte.png" style="left:' + (cx(L.door[0]) - 22) + 'px;top:' + (fy(L.door[1]) - 64) + 'px;width:44px;height:68px">'); scene.appendChild(porteEl);
    filEl = null;
    if (L.star) { filEl = $('<img class="filante" src="img/etoile_filante.png" style="left:' + (cx(L.star[0]) - 21) + 'px;top:' + (fy(L.star[1]) - 42) + 'px;width:42px">'); scene.appendChild(filEl); }
    perso = $('<img class="perso" src="img/perso_idle.png" style="height:46px">'); scene.appendChild(perso); setPerso(L.start[0], L.start[1], 0, 'idle', 1);
    if (conseil) conseil.remove(); conseil = null;
    if (L.tip) { conseil = $('<div class="conseil"></div>'); conseil.textContent = TN.t(L.tip); el.appendChild(conseil); }
  }
  function setPerso(x, y, lift, pose, dir) {
    perso.src = 'img/perso_' + pose + '.png';
    perso.style.transform = 'translate(' + (cx(x) - 12) + 'px,' + (fy(y) - 44 - lift) + 'px) scaleX(' + dir + ')';
    perso.style.transformOrigin = '12px 0';
  }

  /* ---------- affichage ---------- */
  function trayRect() { return { x: 12, y: 436, w: 366, h: TN.H - 64 - 56 - 436 - 4 }; }
  function layoutTray() {
    var ids = Object.keys(st.pcs).filter(function (id) { return st.pcs[id].w === 't'; }).sort(), R = trayRect(), sizes = [30, 26, 22, 19, 16, 13], out = {};
    for (var k = 0; k < sizes.length; k++) {
      var ts = sizes[k], gap = 14, rows = [[]], x = 0, ok = true, totalH = 0;
      ids.forEach(function (id) { var z = C.size(cellsOf(id)), w = z.w * ts; if (x + w > R.w && rows[rows.length - 1].length) { rows.push([]); x = 0; } rows[rows.length - 1].push({ id: id, w: w, h: z.h * ts }); x += w + gap; });
      rows.forEach(function (r) { r.h = Math.max.apply(null, r.map(function (i) { return i.h; }).concat([0])); r.w = r.reduce(function (a, i) { return a + i.w; }, 0) + gap * (r.length - 1); totalH += r.h; if (r.w > R.w) ok = false; });
      totalH += 10 * (rows.length - 1);
      if (totalH > R.h) ok = false;
      if (ok || k === sizes.length - 1) {
        var y = R.y + (R.h - totalH) / 2;
        rows.forEach(function (r) { var xx = R.x + (R.w - r.w) / 2; r.forEach(function (i) { out[i.id] = { x: xx, y: y + (r.h - i.h) / 2, s: ts / CS }; xx += i.w + gap; }); y += r.h + 10; });
        return out;
      }
    }
    return out;
  }
  function place(id, lay) {
    var p = st.pcs[id], d = dom[id];
    if (p.w === 'g') d.style.transform = 'translate(' + (GX + p.x * CS - PAD) + 'px,' + (TOP + GY + p.y * CS - PAD) + 'px) scale(1)';
    else { var t = lay[id]; d.style.transform = 'translate(' + (t.x - PAD * t.s) + 'px,' + (t.y - PAD * t.s) + 'px) scale(' + t.s + ')'; }
  }
  function render() {
    var ps = pieces(), keep = {};
    ps.forEach(function (p, n) {
      var s = st.pcs[p.id], sig = p.id + ':' + s.r + ':' + (p.raw ? 1 : 0);
      keep[p.id] = 1;
      if (!dom[p.id] || dom[p.id]._sig !== sig) {
        var old = dom[p.id], d = old || document.createElement('div');
        d.className = 'piece'; d.innerHTML = ''; d._sig = sig; d._id = p.id;
        d.appendChild(drawCloud(tagged({ cells: p.cells, cut: p.cut, r: s.r }), p.id.charCodeAt(0) + (p.id.length > 1 ? +p.id[1] * 7 : 0) + L.id));
        if (!old) { d.addEventListener('pointerdown', onDown); el.appendChild(d); dom[p.id] = d; }
      }
      dom[p.id].classList.toggle('sel', st.sel === p.id);
      dom[p.id].classList.remove('fuit', 'indice');
      dom[p.id].style.opacity = '';
    });
    for (var id in dom) if (!keep[id]) { dom[id].remove(); delete dom[id]; }
    var lay = layoutTray(), anc = C.anchored(L, placedMap(), ps);
    ps.forEach(function (p) { place(p.id, lay); dom[p.id].classList.toggle('libre', st.pcs[p.id].w === 'g' && !anc[p.id]); });
    el.className = 'screen on peau-' + TN.S.skin; el.id = 'play';
    if (conseil) conseil.style.display = st.coups || st.hist.length ? 'none' : '';
    hud();
  }
  function hud() {
    var n = nGrid();
    q('#hNiv').textContent = TN.t('niveau', L.id);
    q('#hMor').innerHTML = TN.t('morceaux', n, L.maxPieces);
    q('#hCou').textContent = TN.t('coups', st.coups);
    q('#hObj').innerHTML = '<div class="chip">' + TN.t('objPorte') + '</div>' +
      '<div class="chip' + (n <= par.pieces ? ' ok' : '') + '"><img src="img/etoile.png"><img src="img/etoile.png">' + TN.t('objMorc', par.pieces) + '</div>' +
      '<div class="chip' + (st.coups <= par.coups ? ' ok' : '') + '"><img src="img/etoile.png"><img src="img/etoile.png"><img src="img/etoile.png">' + TN.t('objCoups', par.coups) + (L.star ? ' + <img src="img/etoile_filante.png">' : '') + '</div>';
    q('#bVal').innerHTML = TN.ic.play + TN.t('valider');
    q('#bUndo').innerHTML = TN.ic.undo + '<span class="ajuste">' + TN.t('annuler') + '</span>'; q('#bRes').innerHTML = TN.ic.redo + '<span class="ajuste">' + TN.t('recommencer') + '</span>'; q('#bHint').innerHTML = TN.ic.bulb + '<span class="ajuste">' + TN.t('indice') + '</span>';
    el.querySelectorAll('.bas .ajuste').forEach(function (s) { TN.shrink(s, 84); }); TN.shrink(q('#hObj'), 374);
    var s = st.sel && st.pcs[st.sel] ? info(st.sel) : null;
    q('#bRot').disabled = !s; q('#bCut').disabled = !(s && s.raw && st.pcs[st.sel].w === 't');
  }
  function clearGhosts() { st.ghosts.forEach(function (g) { g.remove(); }); st.ghosts = []; scene.querySelectorAll('.cible').forEach(function (c) { c.remove(); }); }
  function ghost(cells, x, y) { cells.forEach(function (c) { var g = $('<div class="fant" style="left:' + (GX + (x + c[0]) * CS + 3) + 'px;top:' + (GY + (y + c[1]) * CS + 3) + 'px;width:' + (CS - 6) + 'px;height:' + (CS - 6) + 'px"></div>'); scene.appendChild(g); st.ghosts.push(g); }); }

  /* ---------- glisser / toucher ---------- */
  var drag = null;
  function onDown(e) {
    if (st.busy || drag) return; e.preventDefault();
    var id = e.currentTarget._id, p = TN.pos(e);
    drag = { id: id, sx: p.x, sy: p.y, moved: false, pid: e.pointerId, cell: null };
    try { e.currentTarget.setPointerCapture(e.pointerId); } catch (x) { }
    e.currentTarget.addEventListener('pointermove', onMove); e.currentTarget.addEventListener('pointerup', onUp); e.currentTarget.addEventListener('pointercancel', onUp);
  }
  function onMove(e) {
    if (!drag || e.pointerId !== drag.pid) return;
    var p = TN.pos(e), d = dom[drag.id];
    if (!drag.moved) { if (Math.abs(p.x - drag.sx) + Math.abs(p.y - drag.sy) < 8) return; drag.moved = true; d.classList.add('drag'); TN.sfx.prend(); clearHand(); clearGhosts(); }
    var cells = cellsOf(drag.id), z = C.size(cells), px = p.x - z.w * CS / 2, py = p.y - z.h * CS - 22;
    d.style.transform = 'translate(' + (px - PAD) + 'px,' + (py - PAD) + 'px) scale(1)';
    var gx = Math.round((px - GX) / CS), gy = Math.round((py - TOP - GY) / CS);
    scene.querySelectorAll('.cible').forEach(function (c) { c.remove(); });
    drag.cell = null;
    if (py + z.h * CS > TOP && py < TOP + GY + L.H * CS && gx > -z.w && gx < L.W) {
      var g = C.grid(L, placedMap(drag.id), pieces()), ok = C.canPlace(L, g, cells, gx, gy) && nGrid(drag.id) < L.maxPieces;
      cells.forEach(function (c) { var X = gx + c[0], Y = gy + c[1]; if (X < 0 || Y < 0 || X >= L.W || Y >= L.H) return; scene.appendChild($('<div class="cible ' + (ok ? 'ok' : 'non') + '" style="left:' + (GX + X * CS + 2) + 'px;top:' + (GY + Y * CS + 2) + 'px;width:' + (CS - 4) + 'px;height:' + (CS - 4) + 'px"></div>')); });
      drag.cell = { x: gx, y: gy, ok: ok, full: C.canPlace(L, g, cells, gx, gy) };
    }
    drag.py = p.y;
  }
  function onUp(e) {
    if (!drag || e.pointerId !== drag.pid) return;
    var d = dom[drag.id], id = drag.id, s = st.pcs[id], dr = drag; drag = null;
    d.removeEventListener('pointermove', onMove); d.removeEventListener('pointerup', onUp); d.removeEventListener('pointercancel', onUp);
    d.classList.remove('drag'); scene.querySelectorAll('.cible').forEach(function (c) { c.remove(); });
    if (!dr.moved) { st.sel = st.sel === id ? null : id; TN.sfx.clic(); if (st.sel && s.w === 't' && L.id === 1) TN.toast(TN.t('tGlisse')); render(); return; }
    if (dr.cell && dr.cell.ok) {
      if (!(s.w === 'g' && s.x === dr.cell.x && s.y === dr.cell.y)) { snap(); st.coups++; }
      s.w = 'g'; s.x = dr.cell.x; s.y = dr.cell.y; st.sel = id; TN.sfx.pose();
    } else if (dr.cell && dr.cell.full && !dr.cell.ok) { TN.sfx.refus(); TN.toast(TN.t('tTrop', L.maxPieces)); }
    else if (dr.py > 430 && s.w === 'g') { snap(); st.coups++; s.w = 't'; TN.sfx.prend(); }
    else if (dr.cell) TN.sfx.refus();
    render();
  }

  /* ---------- actions ---------- */
  function rotate() {
    if (st.busy) return; if (!st.sel) return TN.toast(TN.t('tChoisis'));
    var s = st.pcs[st.sel], nr = (s.r + 1) % 4; clearGhosts();
    if (s.w === 't') { s.r = nr; TN.sfx.tourne(); return render(); }
    var cells = C.rot(info(st.sel).cells, nr), g = C.grid(L, placedMap(st.sel), pieces()), K = [[0, 0], [-1, 0], [1, 0], [0, -1], [0, 1], [-1, -1], [1, -1]];
    for (var i = 0; i < K.length; i++) if (C.canPlace(L, g, cells, s.x + K[i][0], s.y + K[i][1])) { snap(); st.coups++; s.r = nr; s.x += K[i][0]; s.y += K[i][1]; TN.sfx.tourne(); return render(); }
    TN.sfx.refus(); TN.toast(TN.t('tPlace'));
  }
  function cut() {
    if (st.busy) return; var p = st.sel && info(st.sel);
    if (!p || !p.raw || st.pcs[st.sel].w !== 't') return TN.toast(TN.t('tCoupeIci'));
    var r = st.pcs[st.sel].r, d = dom[st.sel].getBoundingClientRect(), sr = TN.stage.getBoundingClientRect();
    var c = $('<img class="cis" src="img/ciseaux.png" style="left:' + ((d.left + d.width / 2 - sr.left) / TN.scale - 27) + 'px;top:' + ((d.top + d.height / 2 - sr.top) / TN.scale - 27) + 'px">'); el.appendChild(c); setTimeout(function () { c.remove(); }, 520);
    snap(); st.coups++; st.cuts[p.src] = 1; delete st.pcs[p.id];
    st.pcs[p.src + '1'] = { w: 't', x: 0, y: 0, r: r }; st.pcs[p.src + '2'] = { w: 't', x: 0, y: 0, r: r };
    st.sel = null; TN.sfx.coupe(); clearGhosts(); render();
  }
  function undo() {
    if (st.busy) return; if (!st.hist.length) return TN.toast(TN.t('tRien'));
    var h = JSON.parse(st.hist.pop()); st.cuts = h.cuts; st.pcs = h.pcs; st.coups = h.coups; st.sel = null; TN.sfx.clic(); clearGhosts(); render();
  }
  function restart(force) {
    if (st.busy) return;
    if (!force && L.id >= 10 && st.errors >= 3) return payRestart();
    TN.sfx.clic(); TN.startLevel(L.id);
  }
  function payRestart(v) {
    var p = TN.popup('<h2>' + TN.t('recommencer') + '</h2><p>' + TN.t('pPayer') + '</p><p><b>' + TN.t('tuAs', TN.S.coins) + '</b></p><div class="col"><button class="pil v" id="a">' + TN.t('pPieces') + '</button><button class="pil o" id="b">' + TN.t('pPub') + '</button><button class="pil c" id="c">' + TN.t('gCarte') + '</button></div>', { noClose: true });
    var a = p.querySelector('#a'); a.disabled = TN.S.coins < COUT.restart;
    a.onclick = function () { TN.coins(-COUT.restart); p.close(); if (v) v.close(); st.busy = false; restart(true); };
    p.querySelector('#b').onclick = function () { TN.ads.recompense(function () { p.close(); if (v) v.close(); st.busy = false; restart(true); }); };
    p.querySelector('#c').onclick = function () { p.close(); if (v) v.close(); st.busy = false; TN.show('map'); };
  }

  /* ---------- validation : le tailleur marche sur le chemin ---------- */
  function validate() {
    if (st.busy) return; if (!nGrid()) return TN.toast(TN.t('tGlisse'));
    st.busy = true; st.sel = null; clearGhosts(); clearHand(); render(); TN.sfx.clic();
    scene.querySelectorAll('.bloque').forEach(function (o) { o.classList.remove('bloque'); });
    var res = C.check(L, placedMap(), st.cuts);
    res.loose.forEach(function (id) { var d = dom[id]; d.classList.remove('libre'); d.classList.add('fuit'); d.style.transform += ' translate(60px,-260px)'; });
    setTimeout(function () { walk(res); }, res.loose.length ? 900 : 250);
  }
  function walk(res) {
    var path = res.path, i = 0, t0 = null, DUR = 240, got = false, dir = 1;
    function step(ts) {
      if (t0 === null) t0 = ts;
      var k = (ts - t0) / DUR;
      if (i >= path.length - 1) return end();
      var a = path[i], b = path[i + 1];
      if (k >= 1) { i++; t0 = ts; TN.sfx.pas(); if (L.star && !got && b[0] === L.star[0] && b[1] === L.star[1] && filEl) { got = true; filEl.style.display = 'none'; TN.sfx.etoile(); } return requestAnimationFrame(step); }
      dir = b[0] >= a[0] ? 1 : -1;
      var x = a[0] + (b[0] - a[0]) * k, y = a[1] + (b[1] - a[1]) * k, hop = b[1] !== a[1] ? Math.sin(Math.PI * k) * 16 : Math.abs(Math.sin(Math.PI * k * 2)) * 2;
      if (b[1] !== a[1] && k < 0.06) TN.sfx.saut();
      setPerso(x, y, hop, b[1] !== a[1] ? 'saut' : (k < 0.5 ? 'm1' : 'm2'), dir);
      requestAnimationFrame(step);
    }
    function end() {
      var last = path[path.length - 1];
      if (res.ok) { setPerso(last[0], last[1], 0, 'joie', 1); porteEl.classList.add('gagne'); TN.sfx.gagne(); confetti(); setTimeout(function () { win(res); }, 900); }
      else { setPerso(last[0], last[1], 0, 'triste', dir); TN.sfx.perdu(); setTimeout(function () { lose(res); }, 800); }
    }
    requestAnimationFrame(step);
  }
  function confetti() {
    var cols = ['#ffd65c', '#ff8fb8', '#9fe8ff', '#c9a3ff', '#fff'];
    for (var i = 0; i < 26; i++) { var c = $('<div class="confetti" style="left:' + (20 + Math.random() * 350) + 'px;top:' + (60 + Math.random() * 80) + 'px;background:' + cols[i % 5] + ';animation-delay:' + (Math.random() * 0.4) + 's"></div>'); el.appendChild(c); (function (c) { setTimeout(function () { c.remove(); }, 2400); })(c); }
  }
  function win(res) {
    var used = nGrid(), s = 1; if (used <= par.pieces) { s = 2; if (st.coups <= par.coups && (!L.star || res.star)) s = 3; }
    var prev = TN.S.stars[L.id] || 0, gain = prev ? 3 + 5 * Math.max(0, s - prev) : 10 + 5 * s;
    if (s > prev) TN.S.stars[L.id] = s;
    TN.S.wins++; TN.S.sinceInter++; TN.coins(gain);
    var next = TN.levels[L.id] ? L.id + 1 : 0, et = '';
    for (var i = 1; i <= 3; i++) et += '<img src="img/etoile' + (i <= s ? '' : '_grise') + '.png"' + (i <= s ? ' class="on" style="animation-delay:' + (i * 0.25) + 's"' : '') + '>';
    var why = s === 1 ? TN.t('rMorc', par.pieces) : s === 2 ? TN.t(L.star ? 'rCoupsEt' : 'rCoups', par.coups) : '';
    var v = TN.popup('<h2>' + TN.t('gagne') + '</h2><div class="etoiles">' + et + '</div>' + (why ? '<p>' + why + '</p>' : '') +
      '<div class="gain"><img src="img/piece.png"><span id="gn">+' + gain + '</span></div>' + (next ? '' : '<p>' + TN.t('gFin') + '</p>') +
      '<div class="col">' + (next ? '<button class="pil o grand" id="n">' + TN.t('gSuivant') + '</button>' : '') + '<button class="pil v" id="d">' + TN.t('gDouble') + '</button><div class="ligne"><button class="pil c" id="r">' + TN.t('gRejouer') + '</button><button class="pil c" id="m">' + TN.t('gCarte') + '</button></div></div>', { noClose: true });
    for (var k = 1; k <= s; k++) (function (k) { setTimeout(TN.sfx.etoile, k * 250); })(k);
    function go(f) { v.close(); st.busy = false; f(); }
    if (next) v.querySelector('#n').onclick = function () { TN.sfx.clic(); TN.ads.entreNiveaux(function () { go(function () { TN.startLevel(next); }); }); };
    v.querySelector('#d').onclick = function () { var b = this; TN.ads.recompense(function () { TN.coins(gain); v.querySelector('#gn').textContent = '+' + (gain * 2); b.remove(); }); };
    v.querySelector('#r').onclick = function () { go(function () { TN.startLevel(L.id); }); };
    v.querySelector('#m').onclick = function () { go(function () { TN.show('map'); }); };
  }
  function lose(res) {
    st.errors++;
    var pay = L.id >= 10 && st.errors >= 3;
    /* arrete devant un rocher ou un arbre : on le dit clairement et on le fait briller en rouge */
    var last = res.path[res.path.length - 1], pres = (L.blocks || []).filter(function (b) { return b[0] - last[0] === (L.door[0] >= last[0] ? 1 : -1) && b[1] - last[1] >= 0 && b[1] - last[1] <= 2; });
    [].forEach(function (b) { var o = scene.querySelector('.obst[data-b="' + b[0] + ',' + b[1] + '"]'); if (o) o.classList.add('bloque'); });
    var v = TN.popup('<h2>' + TN.t('perdu') + '</h2><p>' + TN.t(res.loose.length ? 'pLibre' : 'pBloque') + '</p>' + (L.id >= 10 ? '<p><b>' + TN.t('pErreurs', Math.min(3, st.errors)) + '</b></p>' : '') +
      '<div class="col">' + (pay ? '' : '<button class="pil o grand" id="c">' + TN.t('pCorriger') + '</button>') + '<button class="pil v" id="r">' + TN.t('recommencer') + '</button><button class="pil c" id="m">' + TN.t('gCarte') + '</button></div>', { noClose: true });
    function back() { v.close(); st.busy = false; if (filEl) filEl.style.display = ''; setPerso(L.start[0], L.start[1], 0, 'idle', 1); render(); }
    if (!pay) v.querySelector('#c').onclick = function () { TN.sfx.clic(); back(); };
    v.querySelector('#r').onclick = function () { if (pay) return payRestart(v); v.close(); st.busy = false; restart(true); };
    v.querySelector('#m').onclick = function () { v.close(); st.busy = false; TN.show('map'); };
  }

  /* ---------- indices (3 niveaux d'aide) ---------- */
  function sameRot(id, r1, r2) { var c = info(id).cells; return C.key(C.rot(c, r1)) === C.key(C.rot(c, r2)); }
  function plan() {
    var mine = Object.keys(st.cuts), ok = par.sols.filter(function (s) { return mine.every(function (c) { return s.cuts.indexOf(c) >= 0; }); });
    if (!ok.length) return { type: 'undo' };
    var cur = placedMap(), best = null, bs = -1;
    ok.forEach(function (s) { var n = 0; if (s.cuts.length === mine.length) for (var id in s.placed) if (cur[id] && cur[id].x === s.placed[id].x && cur[id].y === s.placed[id].y && sameRot(id, cur[id].r, s.placed[id].r)) n++; if (n > bs) { bs = n; best = s; } });
    var steps = [];
    best.cuts.forEach(function (c) { if (!st.cuts[c]) steps.push({ type: 'cut', id: c }); });
    if (steps.length) return { type: 'cut', id: steps[0].id, all: steps, sol: best };
    /* ordre : en partant des iles */
    var ps = pieces(), order = [], done = {}, more = true;
    while (more) { more = false; var anc = C.anchored(L, (function () { var m = {}; order.forEach(function (id) { m[id] = best.placed[id]; }); return m; })(), ps);
      for (var id in best.placed) if (!done[id]) { var m2 = {}; order.forEach(function (o) { m2[o] = best.placed[o]; }); m2[id] = best.placed[id]; if (C.anchored(L, m2, ps)[id]) { order.push(id); done[id] = 1; more = true; break; } } }
    for (var k in best.placed) if (!done[k]) order.push(k);
    for (var e in cur) if (!best.placed[e]) return { type: 'remove', id: e, sol: best };
    var todo = order.filter(function (id) { var c = cur[id], t = best.placed[id]; return !(c && c.x === t.x && c.y === t.y && sameRot(id, c.r, t.r)); });
    if (!todo.length) return { type: 'go' };
    return { type: 'place', id: todo[0], t: best.placed[todo[0]], todo: todo, sol: best };
  }
  function showHint(lv) {
    var p = plan(); clearGhosts(); st.sel = null; render();
    if (p.type === 'undo') return TN.toast(TN.t('iAnnule'));
    if (p.type === 'go') return TN.toast(TN.t('iValide'));
    if (p.type === 'remove') { dom[p.id].classList.add('indice'); return TN.toast(TN.t('iRetire')); }
    if (p.type === 'cut') { dom[p.id].classList.add('indice'); st.sel = p.id; hud(); dom[p.id].classList.add('sel'); return TN.toast(TN.t('iCoupe')); }
    dom[p.id].classList.add('indice');
    if (lv === 1) return TN.toast(TN.t('iPrends'));
    var list = lv === 3 ? p.todo : [p.id];
    list.forEach(function (id) { var t = p.sol.placed[id]; ghost(C.rot(info(id).cells, t.r), t.x, t.y); });
    TN.toast(TN.t('iPose'));
  }
  function hints() {
    if (st.busy) return; TN.sfx.clic();
    var v = TN.popup('<h2>' + TN.t('iTitre') + '</h2><p><b>' + TN.t('tuAs', TN.S.coins) + '</b></p><div class="col"><button class="pil v" id="a">' + TN.t('i1', COUT.i1) + '</button><button class="pil v" id="b">' + TN.t('i2', COUT.i2) + '</button><button class="pil v" id="c">' + TN.t('i3', COUT.i3) + '</button><button class="pil o" id="d">' + TN.t('i3pub') + '</button></div>');
    [['#a', 1, COUT.i1], ['#b', 2, COUT.i2], ['#c', 3, COUT.i3]].forEach(function (o) {
      var b = v.querySelector(o[0]); b.disabled = TN.S.coins < o[2];
      b.onclick = function () { TN.coins(-o[2]); v.close(); showHint(o[1]); };
    });
    v.querySelector('#d').onclick = function () { TN.ads.recompense(function () { v.close(); showHint(3); }); };
  }
  function pause() {
    if (st.busy) return; TN.sfx.clic();
    var v = TN.popup('<h2>' + TN.t('pause') + '</h2><button class="inter' + (TN.S.music ? ' on' : '') + '" id="mu" style="width:100%"><span>' + TN.t('musique') + '</span><i></i></button><button class="inter' + (TN.S.sfx ? ' on' : '') + '" id="fx" style="width:100%"><span>' + TN.t('effets') + '</span><i></i></button>' +
      '<div class="col"><button class="pil o grand" id="a">' + TN.t('reprendre') + '</button><button class="pil v" id="b">' + TN.t('recommencer') + '</button><button class="pil c" id="c">' + TN.t('gCarte') + '</button></div>');
    v.querySelector('#mu').onclick = function () { TN.music.set(!TN.S.music); this.classList.toggle('on', TN.S.music); };
    v.querySelector('#fx').onclick = function () { TN.S.sfx = !TN.S.sfx; TN.save(); this.classList.toggle('on', TN.S.sfx); TN.sfx.clic(); };
    v.querySelector('#a').onclick = function () { v.close(); };
    v.querySelector('#b').onclick = function () { v.close(); restart(); };
    v.querySelector('#c').onclick = function () { v.close(); TN.show('map'); };
  }

  /* ---------- main qui montre le geste au niveau 1 ---------- */
  var handT = null;
  function showHand() {
    main = $('<div class="main">&#128070;</div>'); el.appendChild(main); var t = 0;
    handT = setInterval(function () { var d = dom.A; if (!d || !main) return; t = (t + 1) % 40; var k = Math.min(1, t / 26), r = trayRect(), x0 = r.x + r.w / 2 - 10, y0 = r.y + r.h / 2, x1 = GX + 4 * CS - 10, y1 = TOP + GY + 4.6 * CS; main.style.left = (x0 + (x1 - x0) * k) + 'px'; main.style.top = (y0 + (y1 - y0) * k) + 'px'; main.style.opacity = t > 34 ? 0 : 1; }, 50);
  }
  function clearHand() { if (handT) { clearInterval(handT); handT = null; TN.S.vu.main = 1; TN.save(); } if (main) { main.remove(); main = null; } }

  q('#bRot').onclick = rotate; q('#bCut').onclick = cut; q('#bVal').onclick = validate; q('#bUndo').onclick = undo; q('#bRes').onclick = function () { restart(); }; q('#bHint').onclick = hints; q('#bPause').onclick = pause;
  tex.onload = function () { if (TN.current === 'play' && st) { for (var id in dom) dom[id]._sig = ''; render(); } };
  TN.resizers.push(function () { if (TN.current === 'play' && st && !st.busy) render(); });
  TN.screens.play = { el: el, enter: function () { } };
  TN.debug = { state: function () { return st; }, plan: plan, validate: validate, level: function () { return L; } };
})();
