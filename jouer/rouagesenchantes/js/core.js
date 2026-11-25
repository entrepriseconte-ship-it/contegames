/* Les Rouages Enchantés — logique des engrenages (partagée jeu + solveur de test)
   Aucune dépendance. Fonctionne dans le navigateur et sous Node. */
(function (root) {
  'use strict';
  var RP = { S: 44, M: 66, L: 88 };        // rayon primitif
  var TEETH = { S: 8, M: 12, L: 16 };
  var ADD = 6.9;                            // hauteur de tête des dents
  var TOL = 3.2;                            // tolérance d'engrènement
  var FOG_R = 215;                          // portée de la lumière dans la brume
  var BOARD = { w: 798, h: 723 };

  function dist(a, b) { return Math.hypot(a.x - b.x, a.y - b.y); }

  /* relation géométrique entre deux roues : 'mesh' (engrenées), 'hit' (collision) ou 'free' */
  function relation(a, b) {
    var d = dist(a, b), m = RP[a.size] + RP[b.size];
    if (Math.abs(d - m) <= TOL) return 'mesh';
    if (d < m + 2 * ADD + 2) return 'hit';
    return 'free';
  }

  function initState(L) {
    return {
      place: L.tray.map(function () { return -1; }),
      runes: L.fixed.filter(function (g) { return g.rune; }).map(function (g) { return g.rune.o; }),
      levers: (L.levers || []).map(function (l) { return l.on ? 1 : 0; }),
      seq: 0,
      moves: 0
    };
  }
  function cloneState(s) {
    return { place: s.place.slice(), runes: s.runes.slice(), levers: s.levers.slice(), seq: s.seq, moves: s.moves };
  }
  function key(s) { return s.place.join(',') + '|' + s.runes.join('') + '|' + s.levers.join('') + '|' + s.seq; }

  /* liste complète des roues présentes sur le plateau pour un état donné */
  function gearsOf(L, s) {
    var out = [], ri = 0, i;
    for (i = 0; i < L.fixed.length; i++) {
      var f = L.fixed[i];
      var g = { id: f.id, x: f.x, y: f.y, size: f.size, kind: f.kind || 'gear', fixed: true, src: f };
      if (f.rune) { g.runeIndex = ri; g.o = s.runes[ri]; g.sealed = (g.o !== 0); ri++; }
      out.push(g);
    }
    for (i = 0; i < L.tray.length; i++) {
      if (s.place[i] >= 0) {
        var p = L.pegs[s.place[i]];
        out.push({ id: '#' + i, x: p.x, y: p.y, size: L.tray[i], kind: 'movable', tray: i, peg: s.place[i] });
      }
    }
    return out;
  }

  function leverEffect(L, s, kind, ref) {
    // renvoie true si l'effet (frein / lien) est actif
    var levers = L.levers || [];
    for (var i = 0; i < levers.length; i++) {
      var eff = levers[i].effects;
      for (var j = 0; j < eff.length; j++) {
        if (eff[j][kind] === ref) return s.levers[i] === (eff[j].when ? 1 : 0);
      }
    }
    return null;
  }

  /* calcule le mouvement de tout le mécanisme */
  function evalOnce(L, s, wet) {
    var gears = gearsOf(L, s), n = gears.length, i, j;
    var idx = {}; for (i = 0; i < n; i++) idx[gears[i].id] = i;
    var adj = []; for (i = 0; i < n; i++) adj.push([]);
    var active = gears.map(function (g) { return !g.sealed; });
    for (i = 0; i < n; i++) for (j = i + 1; j < n; j++) {
      if (!active[i] || !active[j]) continue;
      if (relation(gears[i], gears[j]) === 'mesh') { adj[i].push({ to: j, flip: -1 }); adj[j].push({ to: i, flip: -1 }); }
    }
    var links = L.links || [], linkOn = [];
    for (i = 0; i < links.length; i++) {
      var on = leverEffect(L, s, 'link', i); if (on === null) on = true;
      linkOn.push(on);
      var a = idx[links[i].a], b = idx[links[i].b];
      if (on && active[a] && active[b]) { adj[a].push({ to: b, flip: 1 }); adj[b].push({ to: a, flip: 1 }); }
    }
    var braked = gears.map(function (g) {
      if (g.fixed && g.src.sluice) return !wet;                 // écluse : fermée tant que l'eau ne circule pas
      if (!g.fixed || !g.src.brake) return false;
      var e = leverEffect(L, s, 'brake', g.id);
      return e === null ? true : e;
    });
    // composantes connexes
    var comp = new Array(n).fill(-1), comps = [];
    for (i = 0; i < n; i++) {
      if (comp[i] >= 0 || !active[i]) continue;
      var c = comps.length, list = [i], q = [i]; comp[i] = c;
      while (q.length) { var u = q.pop(); adj[u].forEach(function (e) { if (comp[e.to] < 0) { comp[e.to] = c; list.push(e.to); q.push(e.to); } }); }
      comps.push(list);
    }
    var st = gears.map(function () { return { on: false, jam: false, dir: 0, color: null, speed: 0, phaseFrom: -1 }; });
    comps.forEach(function (list) {
      var motors = list.filter(function (k) { return gears[k].kind === 'motor' || (wet && gears[k].fixed && gears[k].src.water); });
      if (!motors.length) return;
      var jam = false, reason = '';
      var dir = {}, parent = {}, pflip = {}, q2 = [];
      var color = gears[motors[0]].src.color || 'blue';
      motors.forEach(function (m) {
        if ((gears[m].src.color || 'blue') !== color) { jam = true; reason = 'surcharge'; }
        else if (gears[m].size !== gears[motors[0]].size) { jam = true; if (!reason) reason = 'vitesse'; }   // deux moteurs de vitesses différentes
      });
      var m0 = motors[0]; dir[m0] = gears[m0].src.dir || 1; parent[m0] = -1; q2.push(m0);
      while (q2.length) {
        var u = q2.shift();
        adj[u].forEach(function (e) {
          var d = dir[u] * e.flip;
          if (dir[e.to] === undefined) { dir[e.to] = d; parent[e.to] = u; pflip[e.to] = e.flip; q2.push(e.to); }
          else if (dir[e.to] !== d) { jam = true; if (!reason) reason = 'conflit'; }
        });
      }
      motors.forEach(function (m) { if (dir[m] !== (gears[m].src.dir || 1)) { jam = true; if (!reason) reason = 'conflit'; } });
      list.forEach(function (k) { if (braked[k]) { jam = true; reason = gears[k].src.sluice ? 'ecluse' : 'frein'; } });
      var nm = TEETH[gears[m0].size];
      list.forEach(function (k) {
        st[k].jam = jam; st[k].reason = reason; st[k].on = !jam; st[k].dir = dir[k]; st[k].color = color;
        st[k].speed = nm / TEETH[gears[k].size]; st[k].phaseFrom = parent[k]; st[k].phaseFlip = pflip[k];
      });
    });
    // cibles
    var targets = (L.targets || []).map(function (t) {
      var k = idx[t.gear], g = st[k];
      var sp = !t.speed || (t.speed === 'fast' ? g.speed > 1.05 : g.speed < 0.95);
      var ok = g.on && (!t.dir || g.dir === t.dir) && (!t.color || g.color === t.color) && sp;
      return { powered: ok, turning: g.on, wrongDir: g.on && t.dir && g.dir !== t.dir, wrongColor: g.on && t.color && g.color !== t.color, wrongSpeed: g.on && !sp };
    });
    // brume
    var pegVisible = L.pegs.map(function (p) {
      if (!L.fog) return true;
      for (var k = 0; k < n; k++) if ((st[k].on || gears[k].kind === 'motor') && dist(p, gears[k]) <= FOG_R) return true;
      return false;
    });
    var gearVisible = gears.map(function (g, k) {
      if (!L.fog) return true;
      if (st[k].on || g.kind === 'motor' || g.kind === 'movable') return true;
      for (var q = 0; q < n; q++) if ((st[q].on || gears[q].kind === 'motor') && dist(g, gears[q]) <= FOG_R) return true;
      return false;
    });
    var pumping = false; for (i = 0; i < n; i++) if (gears[i].fixed && gears[i].src.pump && st[i].on) pumping = true;
    return { gears: gears, st: st, idx: idx, targets: targets, pegVisible: pegVisible, gearVisible: gearVisible, linkOn: linkOn, braked: braked, adj: adj, wet: wet, pumping: pumping };
  }
  /* l'eau : une pompe qui tourne fait circuler l'eau, ce qui entraîne les roues hydrauliques et ouvre les écluses */
  function evaluate(L, s) {
    var ev = evalOnce(L, s, false);
    if (!L.hasWater) return ev;
    for (var k = 0; k < 4; k++) { if (ev.pumping === ev.wet) return ev; ev = evalOnce(L, s, ev.pumping); }
    return ev.pumping === ev.wet ? ev : evalOnce(L, s, false);
  }

  function canPlace(L, s, ti, peg, ev) {
    if (peg < 0) return s.place[ti] >= 0;
    if (s.place[ti] === peg) return false;
    for (var i = 0; i < s.place.length; i++) if (i !== ti && s.place[i] === peg) return false;
    ev = ev || evaluate(L, s);
    if (!ev.pegVisible[peg]) return false;
    var p = L.pegs[peg];
    if (p.only && p.only.indexOf(L.tray[ti]) < 0) return false;
    var me = { x: p.x, y: p.y, size: L.tray[ti] };
    var r = RP[me.size] + ADD;
    if (p.x - r < -2 || p.y - r < -2 || p.x + r > BOARD.w + 2 || p.y + r > BOARD.h + 2) return false;
    for (var k = 0; k < ev.gears.length; k++) {
      var g = ev.gears[k];
      if (g.tray === ti) continue;
      if (relation(me, g) === 'hit') return false;
    }
    var obs = L.obstacles || [];
    for (var o = 0; o < obs.length; o++) if (dist(me, obs[o]) < r + obs[o].r) return false;
    return true;
  }

  function orderedTargets(L) {
    return (L.targets || []).map(function (t, i) { return { t: t, i: i }; }).filter(function (o) { return o.t.order; })
      .sort(function (a, b) { return a.t.order - b.t.order; });
  }

  /* applique un coup ; renvoie {state, ev, events} ou null si le coup est impossible */
  function applyMove(L, s, mv, evBefore) {
    evBefore = evBefore || evaluate(L, s);
    var ns = cloneState(s), events = [];
    if (mv.t === 'place') {
      if (!canPlace(L, s, mv.g, mv.p, evBefore)) return null;
      ns.place[mv.g] = mv.p;
    } else if (mv.t === 'rune') {
      var grp = [mv.r].concat((L.runeLinks && L.runeLinks[mv.r]) || []);
      grp.forEach(function (r) { ns.runes[r] = (ns.runes[r] + 1) % 4; });
    } else if (mv.t === 'lever') {
      ns.levers[mv.l] = ns.levers[mv.l] ? 0 : 1;
    } else return null;
    ns.moves = s.moves + 1;
    var ev = evaluate(L, ns);
    var ord = orderedTargets(L);
    if (ord.length) {
      var newly = ord.filter(function (o) { return ev.targets[o.i].powered && !evBefore.targets[o.i].powered; });
      newly = newly.filter(function (o) { return o.t.order > ns.seq; });
      if (newly.length > 1) { ns.seq = 0; events.push({ e: 'wrongOrder', i: newly[0].i, together: true }); }
      else newly.forEach(function (o) {
        if (o.t.order === ns.seq + 1) { ns.seq++; events.push({ e: 'lit', i: o.i }); }
        else { ns.seq = 0; events.push({ e: 'wrongOrder', i: o.i }); }
      });
    }
    return { state: ns, ev: ev, events: events };
  }

  function isLit(L, s, ev, i) {
    var t = L.targets[i];
    if (t.order) return t.order <= s.seq;
    return ev.targets[i].powered;
  }
  function isWin(L, s, ev) {
    ev = ev || evaluate(L, s);
    for (var i = 0; i < L.targets.length; i++) {
      if (L.targets[i].bonus) continue;
      if (!isLit(L, s, ev, i)) return false;
    }
    return true;
  }
  function energy(L, s, ev) {
    var need = 0, got = 0;
    for (var i = 0; i < L.targets.length; i++) { if (L.targets[i].bonus) continue; need++; if (isLit(L, s, ev, i)) got++; }
    return need ? got / need : 0;
  }
  /* objectif secondaire (3e étoile) */
  function secondaryOk(L, s, ev) {
    var sec = L.secondary; if (!sec) return null;
    ev = ev || evaluate(L, s);
    if (sec.type === 'bonus') { for (var i = 0; i < L.targets.length; i++) if (L.targets[i].bonus && !ev.targets[i].powered) return false; return true; }
    if (sec.type === 'noRed') { for (var k = 0; k < ev.gears.length; k++) if (ev.gears[k].kind === 'red' && ev.st[k].on) return false; return true; }
    if (sec.type === 'spare') { return s.place.filter(function (p) { return p < 0; }).length >= sec.n; }
    return null;
  }

  function allMoves(L, s, ev) {
    var mv = [], i, p, seen = {};
    for (i = 0; i < L.tray.length; i++) {
      // roues identiques encore dans la réserve : une seule suffit
      if (s.place[i] < 0) { if (seen[L.tray[i]]) continue; seen[L.tray[i]] = 1; }
      for (p = -1; p < L.pegs.length; p++) if (canPlace(L, s, i, p, ev)) mv.push({ t: 'place', g: i, p: p });
    }
    for (i = 0; i < s.runes.length; i++) mv.push({ t: 'rune', r: i });
    for (i = 0; i < s.levers.length; i++) mv.push({ t: 'lever', l: i });
    return mv;
  }

  /* recherche en largeur : plus courte suite de coups vers la victoire.
     opts.secondary : exiger aussi l'objectif secondaire ; opts.limit : nb max d'états */
  function solve(L, s0, opts) {
    opts = opts || {};
    if (opts.clean === undefined && orderedTargets(L).length) { var o2 = {}; for (var kk in opts) o2[kk] = opts[kk]; o2.clean = true; var rc = solve(L, s0, o2); if (rc) return rc; opts = o2; opts.clean = false; }
    var limit = opts.limit || 400000, maxDepth = opts.maxDepth || 40;
    var start = cloneState(s0); start.moves = 0;
    var goal = function (s, ev) { return isWin(L, s, ev) && (!opts.secondary || secondaryOk(L, s, ev) !== false); };
    var ev0 = evaluate(L, start);
    if (goal(start, ev0)) return { moves: [], states: 1 };
    var seen = {}; seen[key(start)] = 1;
    var frontier = [{ s: start, ev: ev0, path: null, mv: null, d: 0 }], count = 1, head = 0;
    while (head < frontier.length) {
      var node = frontier[head++];
      if (node.d >= maxDepth) continue;
      var mvs = allMoves(L, node.s, node.ev);
      for (var i = 0; i < mvs.length; i++) {
        var r = applyMove(L, node.s, mvs[i], node.ev); if (!r) continue;
        if (opts.clean && r.events.some(function (e) { return e.e === 'wrongOrder'; })) continue;
        var k = key(r.state); if (seen[k]) continue; seen[k] = 1; count++;
        var child = { s: r.state, ev: r.ev, path: node, mv: mvs[i], d: node.d + 1 };
        if (goal(r.state, r.ev)) {
          var path = [], c = child; while (c.mv) { path.unshift(c.mv); c = c.path; }
          return { moves: path, states: count };
        }
        if (count > limit) return null;
        if (isWin(L, r.state, r.ev)) continue;   // la partie s'arrête dès la victoire : état terminal
        frontier.push(child);
      }
    }
    return null;
  }

  root.RE = root.RE || {};
  root.RE.core = {
    RP: RP, TEETH: TEETH, ADD: ADD, TOL: TOL, FOG_R: FOG_R, BOARD: BOARD,
    dist: dist, relation: relation, initState: initState, cloneState: cloneState, key: key,
    evaluate: evaluate, canPlace: canPlace, applyMove: applyMove, isWin: isWin, isLit: isLit,
    energy: energy, secondaryOk: secondaryOk, allMoves: allMoves, solve: solve, orderedTargets: orderedTargets
  };
})(typeof window !== 'undefined' ? window : globalThis);
