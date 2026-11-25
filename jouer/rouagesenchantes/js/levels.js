/* Les Rouages Enchantés — données des niveaux.
   Pour ajouter un niveau : pousser un objet dans LEVELS (voir le format ci-dessous) puis lancer tools/verifier.js
   Coordonnées en pixels sur le plateau (798 x 723). Tailles : S (8 dents), M (12), L (16). */
(function (root) {
  'use strict';
  var C = root.RE.core, RP = C.RP;
  function pol(a, deg, d) { var r = deg * Math.PI / 180; return { x: +(a.x + d * Math.cos(r)).toFixed(1), y: +(a.y + d * Math.sin(r)).toFixed(1) }; }
  /* position d'une roue de taille sb engrenée avec a, dans la direction deg (0 = droite, 90 = bas) */
  function mesh(a, deg, sb) { return pol(a, deg, RP[a.size] + RP[sb]); }
  /* position d'une roue de taille s engrenée à la fois avec a et b ; side = 1 ou -1 */
  function bridge(a, b, s, side) {
    var r1 = RP[a.size] + RP[s], r2 = RP[b.size] + RP[s], d = C.dist(a, b);
    var k = (d * d + r1 * r1 - r2 * r2) / (2 * d), h = Math.sqrt(Math.max(0, r1 * r1 - k * k));
    var ux = (b.x - a.x) / d, uy = (b.y - a.y) / d;
    return { x: +(a.x + ux * k - uy * h * side).toFixed(1), y: +(a.y + uy * k + ux * h * side).toFixed(1) };
  }
  function G(id, p, size, extra) { var g = { id: id, x: p.x, y: p.y, size: size }; if (extra) for (var k in extra) g[k] = extra[k]; return g; }
  var LEVELS = [];

  /* ───────── MONDE 1 — LE VILLAGE DES MOULINS ───────── */
  (function () { // 1
    var m = G('m', { x: 236, y: 340 }, 'M', { kind: 'motor' });
    var p = mesh(m, 0, 'M'), t = G('t', mesh(G('', p, 'M'), 0, 'M'), 'M');
    LEVELS.push({
      id: 1, world: 1, name: { fr: 'Premier tour de roue', en: 'First Turn' },
      goal: { fr: 'Ouvre la porte du village', en: 'Open the village gate' },
      tip: { fr: 'Touche le rouage doré en bas, puis touche l’axe doré entre le moteur et la porte. Tu peux aussi le faire glisser.', en: 'Drag the golden gear onto the axle to link the magic engine to the gate.' },
      fixed: [m, t], pegs: [p, { x: 368, y: 150 }], tray: ['M'],
      targets: [{ gear: 't', type: 'porte' }], maxMoves: 5, building: 'porte'
    });
  })();
  (function () { // 2
    var m = G('m', { x: 216, y: 330 }, 'M', { kind: 'motor' });
    var t = G('t', { x: 496, y: 330 }, 'M');
    var s1 = pol(m, 0, 0); s1 = { x: m.x + 96, y: m.y - 53.7 }; var s2 = { x: t.x - 96, y: t.y - 53.7 };
    var l = bridge(m, t, 'L', 1);
    LEVELS.push({
      id: 2, world: 1, name: { fr: 'Le bon sens', en: 'The Right Way' },
      goal: { fr: 'Fais tourner le moulin vers la gauche', en: 'Spin the mill to the left' },
      tip: { fr: 'Deux rouages qui se touchent tournent en sens opposés. Maintiens ton doigt sur un rouage pour voir son sens.', en: 'Two touching gears turn in opposite directions. Hold a gear to see its direction.' },
      fixed: [m, t], pegs: [s1, s2, l], tray: ['L', 'S', 'S'],
      targets: [{ gear: 't', type: 'moulin', dir: -1 }], maxMoves: 8, building: 'moulin'
    });
  })();
  (function () { // 3
    var m = G('m', { x: 190, y: 190 }, 'M', { kind: 'motor' });
    var p1 = mesh(m, 0, 'L'), t1 = G('t1', mesh(G('', p1, 'L'), 0, 'M'), 'M');
    var p2 = mesh(t1, 90, 'S'), t2 = G('t2', mesh(G('', p2, 'S'), 135, 'L'), 'L');
    var p3 = mesh(m, 90, 'M');
    LEVELS.push({
      id: 3, world: 1, name: { fr: 'Petit et grand', en: 'Small and Large' },
      goal: { fr: 'Alimente la porte et le moulin', en: 'Power the gate and the mill' },
      tip: { fr: 'Chaque axe accepte une seule taille de rouage. Un petit rouage tourne vite, un grand tourne lentement.', en: 'Each axle fits one gear size. Small gears spin fast, large ones slowly.' },
      fixed: [m, t1, t2], pegs: [p1, p2, p3], tray: ['S', 'M', 'L'],
      targets: [{ gear: 't1', type: 'porte' }, { gear: 't2', type: 'moulin' }], maxMoves: 7, building: 'forge'
    });
  })();
  (function () { // 4
    var m = G('m', { x: 170, y: 250 }, 'M', { kind: 'motor' });
    var p = mesh(m, 0, 'S');
    var r1 = G('r1', mesh(G('', p, 'S'), 0, 'M'), 'M', { rune: { o: 3 } });
    var r2 = G('r2', mesh(r1, 0, 'M'), 'M', { rune: { o: 2 } });
    var t = G('t', mesh(r2, 0, 'L'), 'L');
    var r3 = G('r3', mesh(r1, 90, 'S'), 'S', { rune: { o: 1 } });
    var b = G('b', mesh(r3, 90, 'M'), 'M');
    LEVELS.push({
      id: 4, world: 1, name: { fr: 'Les runes endormies', en: 'Sleeping Runes' },
      goal: { fr: 'Réveille les runes pour ouvrir la porte', en: 'Wake the runes to open the gate' },
      tip: { fr: 'Touche une roue runique pour la faire pivoter. La rune doit pointer vers le haut. Les roues reliées par un fil bleu tournent ensemble.', en: 'Tap a rune wheel to rotate it. The rune must point up. Wheels joined by a blue thread turn together.' },
      fixed: [m, r1, r2, t, r3, b], pegs: [p], tray: ['S'],
      runeLinks: { 0: [1], 2: [0] },
      targets: [{ gear: 't', type: 'porte' }, { gear: 'b', type: 'cascade', bonus: true }],
      secondary: { type: 'bonus' }, maxMoves: 10, building: 'cascade'
    });
  })();

  /* ───────── MONDE 2 — LA FORÊT DES LANTERNES ───────── */
  (function () { // 5
    var m = G('m', { x: 176, y: 150 }, 'M', { kind: 'motor' });
    var a = mesh(m, 0, 'M'), g1 = G('g1', mesh(G('', a, 'M'), 0, 'M'), 'M');
    var b = mesh(g1, 90, 'M'), g2 = G('g2', mesh(G('', b, 'M'), 90, 'M'), 'M');
    var c = mesh(g2, 0, 'S'), t = G('t', mesh(G('', c, 'S'), 0, 'M'), 'M');
    var d = mesh(m, 90, 'M'), e = { x: 176, y: 470 };
    LEVELS.push({
      id: 5, world: 2, name: { fr: 'Dans la brume', en: 'Into the Mist' },
      goal: { fr: 'Trouve le chemin jusqu’à la lanterne', en: 'Find the way to the lantern' },
      tip: { fr: 'La brume cache le mécanisme. Chaque rouage qui tourne éclaire les alentours.', en: 'Mist hides the mechanism. Every turning gear lights its surroundings.' },
      fog: true, fixed: [m, g1, g2, t], pegs: [a, b, c, d, e], tray: ['M', 'M', 'S'],
      targets: [{ gear: 't', type: 'lanterne' }], maxMoves: 8, building: 'lanterne'
    });
  })();
  (function () { // 6
    var m = G('m', { x: 160, y: 360 }, 'M', { kind: 'motor' });
    var p = mesh(m, 0, 'M'), h = G('h', mesh(G('', p, 'M'), 0, 'L'), 'L');
    var ra = G('ra', mesh(h, -70, 'S'), 'S', { rune: { o: 2 } });
    var rb = G('rb', mesh(h, 0, 'S'), 'S', { rune: { o: 3 } });
    var rc = G('rc', mesh(h, 70, 'S'), 'S', { rune: { o: 1 } });
    var la = G('la', mesh(ra, -30, 'M'), 'M'), lb = G('lb', mesh(rb, 0, 'M'), 'M'), lc = G('lc', mesh(rc, 30, 'M'), 'M');
    LEVELS.push({
      id: 6, world: 2, name: { fr: 'Les trois lanternes', en: 'Three Lanterns' },
      goal: { fr: 'Allume les lanternes dans l’ordre 1, 2, 3', en: 'Light the lanterns in order 1, 2, 3' },
      tip: { fr: 'Une lanterne s’allume quand son rouage se met à tourner. Une seule à la fois, dans l’ordre des numéros !', en: 'A lantern lights when its gear starts turning. One at a time, in number order!' },
      fixed: [m, h, ra, rb, rc, la, lb, lc], pegs: [p], tray: ['M'],
      runeLinks: { 0: [1], 2: [0] },
      targets: [{ gear: 'lb', type: 'lanterne', order: 1 }, { gear: 'lc', type: 'lanterne', order: 2 }, { gear: 'la', type: 'lanterne', order: 3 }],
      maxMoves: 14, building: 'lanterne'
    });
  })();
  (function () { // 7
    var m = G('m', { x: 160, y: 360 }, 'M', { kind: 'motor' });
    var t = G('t', { x: 626, y: 360 }, 'L');
    var x1 = mesh(m, -45, 'M'), r = G('r', mesh(G('', x1, 'M'), 0, 'M'), 'M', { kind: 'red' });
    var x2 = bridge(r, t, 'M', -1);
    var y1 = mesh(m, 45, 'M'), b = G('b', mesh(G('', y1, 'M'), 0, 'M'), 'M', { brake: true });
    var y2 = bridge(b, t, 'M', 1);
    LEVELS.push({
      id: 7, world: 2, name: { fr: 'Le rouage maudit', en: 'The Cursed Gear' },
      goal: { fr: 'Remets le pont en mouvement', en: 'Get the bridge moving again' },
      tip: { fr: 'Un rouage enchaîné bloque toute la chaîne : le levier le libère. Évite de faire tourner le rouage rouge pour gagner la 3e étoile.', en: 'A chained gear jams the whole train: the lever frees it. Keep the red gear still to earn the 3rd star.' },
      fixed: [m, t, r, b], pegs: [x1, x2, y1, y2], tray: ['M', 'M'],
      levers: [{ x: 400, y: 640, effects: [{ brake: 'b', when: 0 }] }],
      targets: [{ gear: 't', type: 'pont' }], secondary: { type: 'noRed' }, maxMoves: 9, building: 'pont'
    });
  })();
  (function () { // 8
    var m = G('m', { x: 150, y: 150 }, 'M', { kind: 'motor' });
    var a = G('a', mesh(m, 0, 'L'), 'L');
    var p1 = mesh(a, 90, 'M'), c = G('c', mesh(G('', p1, 'M'), 90, 'S'), 'S'), t1 = G('t1', mesh(c, 180, 'M'), 'M');
    var p2 = mesh(a, 0, 'S'), d = G('d', mesh(G('', p2, 'S'), 0, 'M'), 'M');
    var p3 = mesh(d, 90, 'L'), t2 = G('t2', mesh(G('', p3, 'L'), 90, 'M'), 'M');
    var q = bridge(a, G('', p1, 'M'), 'M', -1);
    LEVELS.push({
      id: 8, world: 2, name: { fr: 'Course contre le sablier', en: 'Race the Hourglass' },
      goal: { fr: 'Alimente le moulin et le pont avant la fin du sablier', en: 'Power the mill and the bridge before time runs out' },
      tip: { fr: 'Attention : trois rouages qui se touchent tous se bloquent entre eux.', en: 'Careful: three gears all touching each other jam.' },
      time: 90, fixed: [m, a, c, t1, d, t2], pegs: [p1, p2, p3, q], tray: ['M', 'S', 'L', 'M'],
      targets: [{ gear: 't1', type: 'moulin' }, { gear: 't2', type: 'pont' }], maxMoves: 8, building: 'roue'
    });
  })();

  /* ───────── MONDE 3 — LES MINES DE CRISTAL ───────── */
  (function () { // 9
    var m = G('m', { x: 150, y: 190 }, 'M', { kind: 'motor' });
    var c1 = G('c1', { x: 414, y: 190 }, 'M');
    var a = mesh(m, 0, 'M'), b1 = { x: m.x + 88, y: m.y - 66 }, b2 = { x: c1.x - 88, y: c1.y - 66 };
    var t1 = G('t1', mesh(c1, 0, 'M'), 'M');
    var c2 = G('c2', { x: 250, y: 540 }, 'M'), c3 = G('c3', mesh(c2, -120, 'S'), 'S');
    var t2 = G('t2', mesh(c2, 0, 'L'), 'L');
    LEVELS.push({
      id: 9, world: 3, name: { fr: 'Le cristal relais', en: 'The Relay Crystal' },
      goal: { fr: 'Grue vers la gauche, mine vers la droite', en: 'Crane to the left, mine to the right' },
      tip: { fr: 'Un rayon de cristal transmet le mouvement à distance, dans le même sens. Le levier choisit le rayon actif.', en: 'A crystal beam carries motion at a distance, same direction. The lever picks the active beam.' },
      fixed: [m, c1, t1, c2, c3, t2], pegs: [a, b1, b2], tray: ['M', 'S', 'S'],
      links: [{ a: 'c1', b: 'c2' }, { a: 'c1', b: 'c3' }],
      levers: [{ x: 620, y: 400, effects: [{ link: 0, when: 0 }, { link: 1, when: 1 }] }],
      targets: [{ gear: 't1', type: 'grue', dir: -1 }, { gear: 't2', type: 'mine', dir: 1 }], maxMoves: 8, building: 'grue'
    });
  })();
  (function () { // 10
    var mb = G('mb', { x: 170, y: 185 }, 'M', { kind: 'motor', color: 'blue' });
    var mg = G('mg', { x: 170, y: 537 }, 'M', { kind: 'motor', color: 'gold' });
    var h = G('h', { x: 380, y: 361 }, 'L');
    var tb = G('tb', { x: 610, y: 215 }, 'M'), tg = G('tg', { x: 610, y: 507 }, 'M');
    var pb = bridge(mb, h, 'M', 1), pg = bridge(mg, h, 'M', -1);
    var hb = bridge(h, tb, 'M', 1), hg = bridge(h, tg, 'M', -1);
    var u1 = mesh(mb, 0, 'M'), u = G('u', mesh(G('', u1, 'M'), 0, 'M'), 'M'), u2 = bridge(u, tb, 'S', -1);
    LEVELS.push({
      id: 10, world: 3, name: { fr: 'Deux énergies', en: 'Two Energies' },
      goal: { fr: 'Énergie bleue pour la grue, dorée pour la mine', en: 'Blue energy for the crane, gold for the mine' },
      tip: { fr: 'Ne mélange jamais deux énergies dans la même chaîne : elle se met en surcharge et tout s’arrête.', en: 'Never mix two energies in one train: it overloads and everything stops.' },
      fixed: [mb, mg, h, tb, tg, u], pegs: [pb, pg, hb, hg, u1, u2], tray: ['M', 'M', 'M', 'S'],
      targets: [{ gear: 'tb', type: 'grue', color: 'blue' }, { gear: 'tg', type: 'mine', color: 'gold' }], maxMoves: 10, building: 'mine'
    });
  })();
  (function () { // 11
    var m = G('m', { x: 150, y: 361 }, 'M', { kind: 'motor' });
    var p = mesh(m, 0, 'S'), j = G('j', mesh(G('', p, 'S'), 0, 'M'), 'M');
    var r1 = G('r1', mesh(j, -60, 'S'), 'S', { rune: { o: 1 } });
    var r2 = G('r2', mesh(j, 60, 'S'), 'S', { rune: { o: 2 } });
    var b1 = G('b1', mesh(r1, -20, 'M'), 'M', { brake: true }), b2 = G('b2', mesh(r2, 20, 'M'), 'M', { brake: true });
    var t1 = G('t1', mesh(b1, 20, 'M'), 'M'), t2 = G('t2', mesh(b2, -20, 'M'), 'M');
    LEVELS.push({
      id: 11, world: 3, name: { fr: 'L’ascenseur de la mine', en: 'The Mine Lift' },
      goal: { fr: 'Alimente la mine (1) puis la tour (2)', en: 'Power the mine (1) then the tower (2)' },
      tip: { fr: 'Le levier libère une chaîne et bloque l’autre. Une rune couchée coupe le passage de l’énergie.', en: 'The lever frees one chain and locks the other. A lying rune cuts the flow of energy.' },
      fixed: [m, j, r1, r2, b1, b2, t1, t2], pegs: [p], tray: ['S'],
      runeLinks: { 0: [1] },
      levers: [{ x: 300, y: 560, effects: [{ brake: 'b1', when: 0 }, { brake: 'b2', when: 1 }] }],
      targets: [{ gear: 't1', type: 'mine', order: 1 }, { gear: 't2', type: 'tour', order: 2 }], maxMoves: 14, building: 'tour'
    });
  })();
  (function () { // 12
    var mb = G('mb', { x: 150, y: 150 }, 'M', { kind: 'motor', color: 'blue' });
    var mg = G('mg', { x: 150, y: 573 }, 'M', { kind: 'motor', color: 'gold' });
    var k = G('k', { x: 600, y: 380 }, 'L');
    var a1 = mesh(mg, 0, 'M'), rg = G('rg', mesh(G('', a1, 'M'), 0, 'M'), 'M', { rune: { o: 2 } });
    var a3 = bridge(rg, k, 'M', -1);
    var b1 = mesh(mb, 0, 'S'), rb = G('rb', mesh(G('', b1, 'S'), 0, 'M'), 'M', { rune: { o: 3 } });
    var tw = G('tw', mesh(rb, 0, 'M'), 'M');
    var z = bridge(tw, k, 'M', -1);
    LEVELS.push({
      id: 12, world: 3, name: { fr: 'Le cœur du château', en: 'Heart of the Castle' },
      goal: { fr: 'Apporte l’énergie dorée au château', en: 'Bring gold energy to the castle' },
      tip: { fr: 'La tour n’est pas obligatoire… mais l’alimenter en bleu rapporte la 3e étoile et un trésor.', en: 'The tower is optional… but powering it with blue earns the 3rd star and a treasure.' },
      fixed: [mb, mg, k, rg, rb, tw], pegs: [a1, a3, b1, z], tray: ['M', 'M', 'S', 'M'],
      runeLinks: { 0: [1] },
      targets: [{ gear: 'k', type: 'chateau', color: 'gold' }, { gear: 'tw', type: 'tour', color: 'blue', bonus: true }],
      secondary: { type: 'bonus' }, maxMoves: 12, building: 'chateau'
    });
  })();

  /* ───────── assemblage : 3 mondes de 25 niveaux (12 faits main + 63 générés et vérifiés) ───────── */
  var HAND = { '1-1': 0, '1-2': 1, '1-3': 2, '1-8': 3, '2-1': 4, '2-6': 5, '2-11': 6, '2-16': 7, '3-1': 8, '3-8': 9, '3-15': 10, '6-25': 11 };
  LEVELS[3].treasure = 'source'; LEVELS[11].treasure = 'couronne';
  LEVELS[11].tip.fr = 'La tour n’est pas obligatoire… mais l’alimenter en bleu rapporte la 3e étoile et un trésor.';
  var NOMS = {
    1: ['', '', '', 'La meule du meunier', 'Le grenier à blé', 'Deux portes, un moteur', 'La roue du lavoir', '', 'Le sceau du forgeron', 'La place du marché', 'Runes jumelles', 'Le raccourci trompeur', 'La fontaine oubliée', 'Les greniers jumeaux', 'Avant la cloche', 'La rune du puits', 'Le long convoi', 'Trois moulins', 'Le carillon', 'Les faux chemins', 'Le bassin secret', 'La moisson pressée', 'Le pont du meunier', 'Le grand marché', 'La fête des moulins'],
    2: ['', 'Lueur dans les arbres', 'Le sentier caché', 'Deux clairières', 'Les racines géantes', '', 'Deux lueurs', 'La ronde des lucioles', 'La lanterne scellée', 'Lanternes dans la brume', '', 'La chaîne rouillée', 'L’impasse maudite', 'Le verrou du pont', 'Le détour prudent', '', 'Le raccourci du hibou', 'Brume et sablier', 'Le verrou runique', 'La farandole runique', 'La tour dans la brume', 'La course des lucioles', 'Le pont enchaîné', 'Lanternes voilées', 'Le cœur de la forêt'],
    3: ['', 'Le premier rayon', 'Le puits de lumière', 'Double galerie', 'Le rayon scellé', 'Les galeries croisées', 'Le verrou de cristal', '', 'Bleu et or', 'Les veines jumelles', 'La croisée des énergies', 'Trois filons', 'Le filon runique', 'Avant l’éboulement', '', 'La cascade de cristal', 'La forge enfouie', 'Le frein du wagonnet', 'L’ordre des filons', 'Runes bicolores', 'La galerie pressée', 'Le grand carrefour', 'Le verrou doré', 'Le cristal de minuit', 'Le filon du roi'],
    4: ['La première pompe', 'L’eau des quais', 'Le canal détourné', 'Trois bassins', 'Le quai encombré', 'Vapeur et marée', 'La rune du phare', 'La première écluse', 'Le bassin fermé', 'Avant la marée', 'L’ordre des grues', 'Le dédale des quais', 'L’écluse runique', 'Le treuil enchaîné', 'Brume sur le port', 'La forge du port', 'La marée pressée', 'Les écluses jumelles', 'Le convoi ordonné', 'Le cristal du phare', 'Le verrou de la digue', 'Runes de marée', 'Le port dans la brume', 'La grande marée', 'Le chantier naval'],
    5: ['Vite et lentement', 'Deux cadences', 'Le balancier', 'Contre la montre', 'Trois aiguilles', 'Les rouages croisés', 'La rune de minuit', 'Tic-tac', 'Le bon sens des aiguilles', 'Le ressort bloqué', 'L’ordre des heures', 'Runes et sablier', 'Le mécanisme serré', 'Les trois cadrans', 'Le cristal de l’heure', 'L’horloge voilée', 'La fontaine du temps', 'La rune pressée', 'Le carillon des heures', 'Le ressort et l’aiguille', 'La grande complication', 'Runes d’horloger', 'La minute de vérité', 'Les heures runiques', 'Le maître du temps'],
    6: ['Les portes du château', 'La salle des cadences', 'Les douves', 'Le couloir voilé', 'La herse', 'La salle des runes', 'Les flambeaux', 'Le puits du donjon', 'La tour secrète', 'La galerie de cristal', 'L’armurerie', 'La garde pressée', 'Les trois bassins', 'Le verrou royal', 'La crypte', 'L’horloge du roi', 'Le grand réservoir', 'La salle obscure', 'L’ordre des chevaliers', 'Les aiguilles royales', 'Le trésor gardé', 'Les écluses du donjon', 'La salle du trône', 'Le dernier verrou', '']
  };
  var ART = { porte: { fr: 'la porte', en: 'the gate' }, moulin: { fr: 'le moulin', en: 'the mill' }, lanterne: { fr: 'la lanterne', en: 'the lantern' }, pont: { fr: 'le pont', en: 'the bridge' }, roue: { fr: 'la roue à eau', en: 'the water wheel' }, chateau: { fr: 'le château', en: 'the castle' }, grue: { fr: 'la grue', en: 'the crane' }, mine: { fr: 'la mine', en: 'the mine' }, forge: { fr: 'la forge', en: 'the forge' }, cascade: { fr: 'la fontaine', en: 'the fountain' }, tour: { fr: 'la tour', en: 'the tower' } };
  /* objectif écrit automatiquement ; {x}, {y}, {n} sont remplacés au moment de l'affichage (voir base.js) */
  function autoGoal(L) {
    var req = L.targets.filter(function (t) { return !t.bonus; }), g;
    if (req[0].order) g = req.every(function (t) { return t.type === 'lanterne'; }) ? { fr: 'Allume les lanternes dans l’ordre des numéros', en: 'Light the lanterns in number order' } : { fr: 'Alimente les machines dans l’ordre des numéros', en: 'Power the machines in number order' };
    else if (req[0].speed) g = { fr: 'Donne la bonne vitesse à chaque machine', en: 'Give each machine the right speed' };
    else if (req[0].color) g = { fr: 'Donne la bonne énergie à chaque machine', en: 'Give each machine the right energy' };
    else if (req.length === 1) g = { fr: 'Alimente {x}', en: 'Power {x}', x: req[0].type };
    else if (req.length === 2 && req[0].type !== req[1].type) g = { fr: 'Alimente {x} et {y}', en: 'Power {x} and {y}', x: req[0].type, y: req[1].type };
    else g = { fr: 'Alimente les {n} machines', en: 'Power all {n} machines', n: req.length };
    if (L.time) g.timed = true;
    return g;
  }
  root.RE.ART = ART; root.RE.TIMED = { fr: '{x} avant la fin du sablier', en: '{x} before time runs out' };
  var ALL = [], GEN = root.RE.GEN || {};
  var TIPS = { '4-1': { fr: 'La pompe (goutte) fait circuler l’eau quand elle tourne. L’eau entraîne la roue hydraulique et ouvre les écluses.', en: 'The pump (drop) moves the water when it turns. Water drives the water wheel and opens the sluices.' },
    '5-1': { fr: 'Le grand moteur fait tourner vite, le petit fait tourner lentement. Deux flèches : rapide. Une flèche et une barre : lent. Ne relie jamais les deux moteurs.', en: 'The big engine spins things fast, the small one slowly. Two arrows: fast. One arrow and a bar: slow. Never link the two engines.' } };
  for (var w = 1; w <= 6; w++) for (var i = 1; i <= 25; i++) {
    var key = w + '-' + i, L;
    if (HAND[key] !== undefined) L = LEVELS[HAND[key]];
    else { L = GEN[key]; if (!L) continue; L.name = { fr: NOMS[w][i - 1], en: NOMS[w][i - 1] }; L.goal = autoGoal(L); L.building = L.targets[0].type; if (TIPS[key]) L.tip = TIPS[key]; }
    L.id = ALL.length + 1; L.world = w; L.slot = i; ALL.push(L);
  }
  LEVELS = ALL;
  var WORLDS = [
    { id: 1, name: { fr: 'Le Village des Moulins', en: 'Mill Village' }, first: 1, count: 25 },
    { id: 2, name: { fr: 'La Forêt des Lanternes', en: 'Lantern Forest' }, first: 26, count: 25 },
    { id: 3, name: { fr: 'Les Mines de Cristal', en: 'Crystal Mines' }, first: 51, count: 25 },
    { id: 4, name: { fr: 'Le Port des Machines', en: 'Machine Harbour' }, first: 76, count: 25 },
    { id: 5, name: { fr: 'La Tour de l’Horloger', en: 'The Clockmaker\'s Tower' }, first: 101, count: 25 },
    { id: 6, name: { fr: 'Le Château du Cœur Mécanique', en: 'Castle of the Mechanical Heart' }, first: 126, count: 25 }
  ];
  root.RE.LEVELS = LEVELS; root.RE.WORLDS = WORLDS; root.RE.geo = { pol: pol, mesh: mesh, bridge: bridge };
})(typeof window !== 'undefined' ? window : globalThis);
