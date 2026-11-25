/* Le Tailleur de Nuages - regles du jeu (partagees entre le jeu et le verificateur). */
(function (root) {
  var TN = root.TN = root.TN || {};
  var C = TN.core = {};

  C.norm = function (cells) {
    var mx = 1e9, my = 1e9, i;
    for (i = 0; i < cells.length; i++) { if (cells[i][0] < mx) mx = cells[i][0]; if (cells[i][1] < my) my = cells[i][1]; }
    var o = cells.map(function (c) { return [c[0] - mx, c[1] - my]; });
    o.sort(function (a, b) { return a[1] - b[1] || a[0] - b[0]; });
    return o;
  };
  C.rot = function (cells, r) {
    var o = cells, k;
    for (k = 0; k < ((r % 4) + 4) % 4; k++) o = o.map(function (c) { return [-c[1], c[0]]; });
    return C.norm(o);
  };
  C.key = function (cells) { return cells.map(function (c) { return c[0] + ',' + c[1]; }).join(';'); };
  C.size = function (cells) {
    var w = 0, h = 0; cells.forEach(function (c) { if (c[0] + 1 > w) w = c[0] + 1; if (c[1] + 1 > h) h = c[1] + 1; });
    return { w: w, h: h };
  };
  /* rotations distinctes d'une forme */
  C.rots = function (cells) {
    var seen = {}, out = [], r;
    for (r = 0; r < 4; r++) { var k = C.key(C.rot(cells, r)); if (!seen[k]) { seen[k] = 1; out.push(r); } }
    return out;
  };

  /* liste des morceaux disponibles selon les nuages deja decoupes */
  C.pieces = function (level, cuts) {
    var out = [];
    level.tray.forEach(function (t) {
      if (t.cut && cuts && cuts[t.id]) {
        out.push({ id: t.id + '1', src: t.id, cells: C.norm(t.cut[0]) });
        out.push({ id: t.id + '2', src: t.id, cells: C.norm(t.cut[1]) });
      } else {
        var cells = t.cut ? t.cut[0].concat(t.cut[1]) : t.cells;
        out.push({ id: t.id, src: t.id, cells: C.norm(cells), raw: !!t.cut, cut: t.cut || null });
      }
    });
    return out;
  };

  C.isIsland = function (level, x, y) {
    for (var i = 0; i < level.islands.length; i++) { var s = level.islands[i]; if (x >= s.x0 && x <= s.x1 && y >= s.top) return true; }
    return false;
  };
  C.isBlock = function (level, x, y) {
    var b = level.blocks || [];
    for (var i = 0; i < b.length; i++) if (b[i][0] === x && b[i][1] === y) return true;
    return false;
  };

  /* grille : 0 vide, 1 ile, 2 obstacle, 3+ nuage */
  C.grid = function (level, placed, pieces, only) {
    var g = [], x, y;
    for (y = 0; y < level.H; y++) { g.push([]); for (x = 0; x < level.W; x++) g[y].push(C.isIsland(level, x, y) ? 1 : C.isBlock(level, x, y) ? 2 : 0); }
    pieces.forEach(function (p, i) {
      var pl = placed[p.id]; if (!pl) return; if (only && !only[p.id]) return;
      C.rot(p.cells, pl.r).forEach(function (c) { g[pl.y + c[1]][pl.x + c[0]] = 3 + i; });
    });
    return g;
  };

  C.canPlace = function (level, g, cells, px, py) {
    for (var i = 0; i < cells.length; i++) {
      var x = px + cells[i][0], y = py + cells[i][1];
      if (x < 0 || y < 0 || x >= level.W || y >= level.H) return false;
      if (g[y][x] !== 0) return false;
      if (x === level.start[0] && y === level.start[1]) return false;
      if (x === level.door[0] && y === level.door[1]) return false;
      if (level.star && x === level.star[0] && y === level.star[1]) return false;
    }
    return true;
  };

  /* morceaux accroches a une ile (directement ou par un autre morceau) */
  C.anchored = function (level, placed, pieces) {
    var g = C.grid(level, placed, pieces), ok = {}, changed = true, D = [[1, 0], [-1, 0], [0, 1], [0, -1]];
    while (changed) {
      changed = false;
      pieces.forEach(function (p, i) {
        var pl = placed[p.id]; if (!pl || ok[p.id]) return;
        var cells = C.rot(p.cells, pl.r), k, d;
        for (k = 0; k < cells.length && !ok[p.id]; k++) for (d = 0; d < 4; d++) {
          var x = pl.x + cells[k][0] + D[d][0], y = pl.y + cells[k][1] + D[d][1];
          if (x < 0 || y < 0 || x >= level.W || y >= level.H) continue;
          var v = g[y][x];
          if (v === 1 || v === 2 || (v >= 3 && v !== 3 + i && ok[pieces[v - 3].id])) { ok[p.id] = 1; changed = true; break; }   /* un rocher ou un arbre tient un nuage, comme une ile */
        }
      });
    }
    return ok;
  };

  /* marche du personnage : pas de cote, monte ou descend d'une case au plus */
  C.walk = function (level, g) {
    var W = level.W, H = level.H;
    function solid(x, y) { return y >= H ? false : (x < 0 || x >= W || y < 0) ? false : g[y][x] !== 0; }   /* on marche sur les iles, les nuages, les rochers et les arbres (decision d'Anthony, 12/11/2026) */
    function free(x, y) { return x >= 0 && x < W && y >= 0 && y < H && g[y][x] === 0; }
    function stand(x, y) { return free(x, y) && solid(x, y + 1); }
    var hasStar = !!level.star, sx = level.start[0], sy = level.start[1];
    var q = [[sx, sy, 0]], prev = {}, k0 = sx + ',' + sy + ',0', head = 0, best = null, bestStar = null, far = k0, farX = sx;
    prev[k0] = null;
    while (head < q.length) {
      var c = q[head++], x = c[0], y = c[1], s = c[2], ck = x + ',' + y + ',' + s;
      if (x === level.door[0] && y === level.door[1]) { if (s && !bestStar) bestStar = ck; if (!best) best = ck; if (!hasStar || bestStar) break; }
      if (Math.abs(x - level.door[0]) < Math.abs(farX - level.door[0])) { farX = x; far = ck; }
      var mv = [];
      [-1, 1].forEach(function (d) {
        if (stand(x + d, y)) mv.push([x + d, y]);
        else if (free(x, y - 1) && stand(x + d, y - 1)) mv.push([x + d, y - 1]);
        else if (free(x + d, y) && stand(x + d, y + 1)) mv.push([x + d, y + 1]);
      });
      mv.forEach(function (m) {
        var ns = s || (hasStar && m[0] === level.star[0] && m[1] === level.star[1] ? 1 : 0);
        var nk = m[0] + ',' + m[1] + ',' + ns;
        if (!(nk in prev)) { prev[nk] = ck; q.push([m[0], m[1], ns]); }
      });
    }
    function path(k) { var p = []; while (k) { var a = k.split(',').map(Number); p.unshift(a); k = prev[k]; } return p; }
    var end = hasStar && bestStar ? bestStar : best;
    return { ok: !!best, star: !!bestStar, path: path(end || far) };
  };

  /* verification complete d'une position */
  C.check = function (level, placed, cuts) {
    var pieces = C.pieces(level, cuts), anc = C.anchored(level, placed, pieces);
    var g = C.grid(level, placed, pieces, anc), w = C.walk(level, g), loose = [];
    pieces.forEach(function (p) { if (placed[p.id] && !anc[p.id]) loose.push(p.id); });
    w.loose = loose; w.used = Object.keys(placed).length - loose.length;
    return w;
  };

  /* solveur : toutes les solutions jusqu'a maxPieces morceaux */
  C.solve = function (level, limit, maxNodes) {
    var cuttable = level.tray.filter(function (t) { return !!t.cut; }), sols = [], nodes = 0, m, aborted = false;
    for (m = 0; m < (1 << cuttable.length); m++) {
      var cuts = {}, nc = 0;
      cuttable.forEach(function (t, i) { if (m & (1 << i)) { cuts[t.id] = 1; nc++; } });
      var pieces = C.pieces(level, cuts), seen = {};
      var rotc = pieces.map(function (p) { return C.rots(p.cells).map(function (r) { return { r: r, cells: C.rot(p.cells, r) }; }); });
      (function rec(placed, n) {
        nodes++;
        var g = C.grid(level, placed, pieces);
        if (n > 0) {
          var w = C.walk(level, g);
          if (w.ok) sols.push({ cuts: cuts, placed: JSON.parse(JSON.stringify(placed)), pieces: n, coups: n + nc, star: w.star });
        }
        if (maxNodes && nodes > maxNodes) { aborted = true; return; }
        if (n >= level.maxPieces || (limit && sols.length > limit)) return;
        pieces.forEach(function (p, i) {
          if (placed[p.id]) return;
          rotc[i].forEach(function (rc) {
            for (var y = 0; y < level.H; y++) for (var x = 0; x < level.W; x++) {
              if (!C.canPlace(level, g, rc.cells, x, y)) continue;
              var touch = false, k, d, D = [[1, 0], [-1, 0], [0, 1], [0, -1]];
              for (k = 0; k < rc.cells.length && !touch; k++) for (d = 0; d < 4; d++) {
                var ax = x + rc.cells[k][0] + D[d][0], ay = y + rc.cells[k][1] + D[d][1];
                if (ax >= 0 && ay >= 0 && ax < level.W && ay < level.H && g[ay][ax] !== 0) { touch = true; break; }
              }
              if (!touch) continue;
              placed[p.id] = { x: x, y: y, r: rc.r };
              var key = Object.keys(placed).sort().map(function (id) { var q = placed[id]; return id + ':' + q.x + ',' + q.y + ',' + q.r; }).join('|');
              if (!seen[key]) { seen[key] = 1; rec(placed, n + 1); }
              delete placed[p.id];
            }
          });
        });
      })({}, 0);
    }
    return { sols: sols, nodes: nodes, aborted: aborted };
  };

  /* pars d'un niveau a partir des solutions */
  C.pars = function (level, sols) {
    if (!sols.length) return null;
    var minP = Math.min.apply(null, sols.map(function (s) { return s.pieces; }));
    var need = !!level.star;
    var good = sols.filter(function (s) { return s.pieces <= minP && (!need || s.star); });
    if (!good.length) return { pieces: minP, coups: null };
    var minC = Math.min.apply(null, good.map(function (s) { return s.coups; }));
    var best = good.filter(function (s) { return s.coups === minC; });
    return { pieces: minP, coups: minC, best: best, total: sols.length };
  };

  if (typeof module !== 'undefined') module.exports = TN;
})(typeof window !== 'undefined' ? window : globalThis);
