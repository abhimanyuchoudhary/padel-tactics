/* Padel Tactics rules engine. Pure functions, no DOM. Works in browser and Node. */
(function (root) {
  var LV = { 'D+': 1, 'C-': 2, 'C': 3, 'C+': 4 };
  function nm(i) { return i === 0 ? 'Opponent A' : 'Opponent B'; }
  function sideName(s) { return s === 'R' ? 'right (drive)' : 'left (revés)'; }
  var MULTI = ['style', 'ground', 'overhead', 'glass', 'serve', 'lobs', 'weak'];
  function arr(v) { return Array.isArray(v) ? v.filter(function (x) { return x != null && x !== ''; }) : (v == null || v === '' ? [] : [v]); }
  function is(o, f, v) { return arr(o && o[f]).indexOf(v) >= 0; }
  function has(o, w) { return is(o, 'weak', w); }
  /* Contradictory picks within one multi-select question. [a, b, tip] */
  var CONFLICTS = {
    style: [['Mixed', 'Aggressive net'], ['Mixed', 'Defensive back'], ['Aggressive net', 'Defensive back', 'If they do both, pick Mixed.']],
    ground: [['Mix', 'Flat & hard'], ['Mix', 'Heavy topspin'], ['Mix', 'Slice & backspin']],
    overhead: [['Lets it bounce', 'Flat smash']],
    glass: [['Struggles', 'Attacking drive'], ['Struggles', 'Safe lob'], ['Struggles', 'Chiquita']],
    lobs: [['Rarely', 'High & deep'], ['Rarely', 'Low & fast']]
  };
  /* Add `picked` to `current`, removing anything that conflicts with it. */
  function resolvePick(field, current, picked) {
    var removed = [], tips = [];
    var out = arr(current).filter(function (x) {
      if (x === picked) return false;
      var c = (CONFLICTS[field] || []).filter(function (p) { return (p[0] === x && p[1] === picked) || (p[1] === x && p[0] === picked); })[0];
      if (c) { removed.push(x); if (c[2] && tips.indexOf(c[2]) < 0) tips.push(c[2]); return false; }
      return true;
    });
    out.push(picked);
    var note = removed.length ? 'Removed ' + list(removed) + ': doesn\'t fit with ' + picked + '.' + (tips.length ? ' ' + tips.join(' ') : '') : '';
    return { value: out, removed: removed, note: note };
  }
  function sanitize(field, v) { var r = []; arr(v).forEach(function (x) { r = resolvePick(field, r, x).value; }); return r; }
  /* Migrate legacy single-value answers to arrays. Returns a new object. */
  function normalize(a) {
    a = JSON.parse(JSON.stringify(a || {}));
    a.opp = [0, 1].map(function (i) { var o = (a.opp || [])[i] || {}; MULTI.forEach(function (f) { o[f] = sanitize(f, o[f]); }); return o; });
    a.me = a.me || {}; a.me.strength = arr(a.me.strength); a.me.partner = arr(a.me.partner);
    a.beats = arr(a.beats); a.beatsOther = a.beatsOther || ''; a.name = a.name || ''; a.comms = a.comms || '';
    return a;
  }
  function list(xs) { return xs.length <= 1 ? (xs[0] || '') : xs.slice(0, -1).join(', ') + ' and ' + xs[xs.length - 1]; }

  function computeTactics(a) {
    a = normalize(a);
    var A = a.opp[0], B = a.opp[1], me = a.me || {};
    var T = {};
    function add(key, pts, reason) {
      if (!T[key]) T[key] = { score: 0, reasons: [] };
      T[key].score += pts; if (reason && T[key].reasons.indexOf(reason) < 0) T[key].reasons.push(reason);
    }
    var la = LV[A.level] || 3, lb = LV[B.level] || 3;
    var weakIdx = la === lb ? ((A.weak || []).length >= (B.weak || []).length ? 0 : 1) : (la < lb ? 0 : 1);
    var weakP = a.opp[weakIdx], strongIdx = 1 - weakIdx;

    // Pick on weaker player
    if (la !== lb) add('pick', 3 + Math.abs(la - lb), nm(weakIdx) + ' is ' + weakP.level + ' vs ' + a.opp[strongIdx].level + '.');
    else if ((weakP.weak || []).length) add('pick', 1, nm(weakIdx) + ' listed more weaknesses.');

    // Middle
    if (A.hand === 'R' && B.hand === 'R') add('middle', 2, 'Two right-handers: the middle is the backhand of whoever plays left.');
    if (a.opp.some(function (o) { return o.hand === 'L' && o.side === 'L'; })) add('middle', -2, 'A left-hander on the left has the forehand in the middle - aim middle only when they are pulled wide.');
    if (a.opp.some(function (o) { return o.hand === 'L' && o.side === 'R'; })) add('middle', 2, 'A left-hander on the right means both backhands meet in the middle.');
    if (a.comms === 'No') add('middle', 4, 'They do not communicate well, so balls between them cause "yours/mine" errors.');

    // Lob and take the net
    a.opp.forEach(function (o, i) {
      if (is(o, 'style', 'Aggressive net')) add('lob', 2, nm(i) + ' lives at the net.');
      if (has(o, 'Lob defence')) add('lob', 3, nm(i) + ' struggles defending lobs.');
      if (has(o, 'Slow footwork')) add('lob', 1, nm(i) + ' is slow getting back.');
      if (is(o, 'overhead', 'Lets it bounce')) add('lob', 2, nm(i) + ' lets overheads bounce, so lobs give you time to take the net.');
      if (is(o, 'overhead', 'Flat smash')) add('lob', -2, nm(i) + ' smashes flat for winners - only deep lobs.');
    });
    if (is(me, 'strength', 'Lobs & defence') || is(me, 'partner', 'Lobs & defence')) add('lob', 2, 'Your team lobs well.');
    if (is(me, 'strength', 'Net & volleys') || is(me, 'partner', 'Net & volleys')) add('lob', 1, 'You want to be at the net, where your volleys win points.');

    // Slow it down
    a.opp.forEach(function (o, i) {
      if (has(o, 'Impatient')) add('slow', 3, nm(i) + ' is impatient and will force a bad shot.');
      if (is(o, 'ground', 'Flat & hard')) add('slow', 2, nm(i) + ' hits flat and hard; pace-off balls take away their rhythm.');
    });
    if (is(me, 'strength', 'Consistency') || is(me, 'partner', 'Consistency')) add('slow', 2, 'Consistency is your team strength.');
    if (la + lb >= 7) add('slow', 1, 'Strong pair: win by fewer errors, not by outhitting them.');

    // Back glass pressure
    a.opp.forEach(function (o, i) {
      if (is(o, 'glass', 'Struggles') || has(o, 'Back glass / wall rebounds')) add('glass', 4, nm(i) + ' struggles off the back glass.');
      if (is(o, 'style', 'Defensive back') && !is(o, 'glass', 'Attacking drive')) add('glass', 1, nm(i) + ' sits deep - make them play off the glass.');
    });

    // Low to the feet (chiquita)
    a.opp.forEach(function (o, i) {
      if (has(o, 'Low volleys')) add('feet', 4, nm(i) + ' has weak low volleys.');
      if (is(o, 'style', 'Aggressive net') && !is(o, 'overhead', 'Lets it bounce')) add('feet', 1, nm(i) + ' rushes the net - dip it at their feet.');
    });

    // Attack the overhead / backhand
    a.opp.forEach(function (o, i) {
      if (has(o, 'Bandeja/overhead')) add('overhead', 3, nm(i) + ' has a weak bandeja/overhead.');
      if (has(o, 'Backhand')) add('backhand', 3, nm(i) + ' has a weak backhand.');
    });
    // Return pressure
    a.opp.forEach(function (o, i) {
      if (is(o, 'serve', 'Safe') || has(o, 'Weak serve return')) add('return', has(o, 'Weak serve return') ? 3 : 1, nm(i) + (is(o, 'serve', 'Safe') ? ' serves safely - attack the return.' : ' returns badly - serve into their body and backhand.'));
    });
    if (is(me, 'strength', 'Power smash') || is(me, 'partner', 'Power smash')) add('power', 2, 'Your team has a power smash.');
    a.opp.forEach(function (o, i) { if (is(o, 'lobs', 'Low & fast')) add('power', 1, nm(i) + ' lobs low and fast - those are smashable.'); });
    // Spin adjustments
    var spin = a.opp.filter(function (o) { return is(o, 'ground', 'Slice & backspin') || is(o, 'serve', 'Slice off glass'); }).length;
    if (spin) add('spin', 1 + spin, 'They use slice that dies off the glass.');

    var keys = Object.keys(T).filter(function (k) { return T[k].score > 0; })
      .sort(function (x, y) { return T[y].score - T[x].score || x.localeCompare(y); });
    var defaults = ['middle', 'lob', 'slow', 'pick'];
    defaults.forEach(function (k) { if (keys.indexOf(k) < 0) keys.push(k); });
    var n = keys.length && T[keys[3]] && T[keys[3]].score >= 2 ? 4 : 3;
    var seen = {};
    return keys.slice(0, n).map(function (k) {
      var t = wordTactic(k, a, weakIdx, (T[k] || { reasons: [] }).reasons, (T[k] || {}).score || 0);
      ['what', 'why', 'when'].forEach(function (f) {
        var out = sentences(t[f]).filter(function (x) { var key = x.toLowerCase(); if (seen[key]) return false; seen[key] = 1; return true; });
        t[f] = out.join(' ') || t[f];
      });
      return t;
    });
  }

  function spinNote(a, k) {
    var g = {}; a.opp.forEach(function (o) { arr(o.ground).forEach(function (x) { g[x] = 1; }); });
    var n = [];
    if (g['Flat & hard'] && k === 'spin') n.push('Against their flat, hard balls, do the opposite: shorter backswing, block and redirect.');
    if (g['Slice & backspin'] && k === 'slow') n.push('Their slice stays low, so get down early and lift it deep rather than hitting through it.');
    if (g['Heavy topspin']) n.push('Their topspin kicks up off the glass, so give it an extra step of room.');
    return n.length ? ' ' + n.join(' ') : '';
  }
  function wordTactic(k, a, wi, reasons, score) {
    var A = a.opp[0], B = a.opp[1], w = nm(wi), me = a.me || {};
    var leftP = A.side === 'L' ? 'Opponent A' : (B.side === 'L' ? 'Opponent B' : 'the left-side player');
    var why = reasons.join(' ');
    var d = {
      pick: { name: 'Pick on ' + w, short: '70% of balls to ' + w,
        what: 'Send about 70% of rallies to ' + w + ' (' + a.opp[wi].level + ', plays ' + sideName(a.opp[wi].side) + '). Isolate them with crosscourt balls and keep their partner out of the point.',
        when: 'Their partner starts poaching everything, or ' + w + ' gets into a rhythm - then go back to the middle for a few points.' },
      middle: { name: 'Down the middle', short: 'Middle, at the seam',
        what: 'Aim through the middle, low and at the seam between them. ' + (A.hand === 'R' && B.hand === 'R' ? 'Target the backhand of ' + leftP + '.' : 'Watch which side the forehand is and aim at the backhand.'),
        when: 'They start covering the middle and leave the lines open - then go wide to the side glass.' },
      lob: { name: 'Lob and take the net', short: 'Lob deep, run in',
        what: 'Lob high and deep over ' + (a.opp.some(function (o) { return is(o, 'style', 'Aggressive net'); }) ? 'the net-rusher' : 'their backhand side') + ', then move to the net together while they run back.',
        when: 'You are stuck defending at the back, or they crowd the net.' },
      slow: { name: 'Slow it down', short: 'No pace, no gifts',
        what: 'Take pace off: soft, deep, centred balls and patient bandejas. Make them create pace. Aim for 10+ shot rallies.' + spinNote(a, 'slow'),
        when: 'You are making unforced errors, or they are hitting winners off your pace.' },
      glass: { name: 'Make them play the glass', short: 'Deep to back glass',
        what: 'Hit deep, firm balls that bounce near the back glass so they must play the rebound. Target ' + (a.opp.some(function (o, i) { return is(o, 'glass', 'Struggles') || has(o, 'Back glass / wall rebounds'); }) ? a.opp.map(function (o, i) { return (is(o, 'glass', 'Struggles') || has(o, 'Back glass / wall rebounds')) ? nm(i) : null; }).filter(Boolean).join(' and ') : 'the deeper player') + '.',
        when: 'They are camped at the back and returning short or high.' },
      feet: { name: 'Chiquita to the feet', short: 'Soft & low at feet',
        what: 'From the back, play soft dipping balls at the feet of the net player, then step in for the high volley that comes back.',
        when: 'They come to the net fast and close, or you cannot lob safely.' },
      overhead: { name: 'Feed the weak overhead', short: 'Mid-height lobs to bad overhead',
        what: 'Give medium-depth lobs to ' + a.opp.map(function (o, i) { return has(o, 'Bandeja/overhead') ? nm(i) : null; }).filter(Boolean).join(' and ') + ' to force bandejas, and be ready at the net for the soft reply.',
        when: 'You need an easy way to win the net back.' },
      backhand: { name: 'Attack the backhand', short: 'Everything to backhand',
        what: 'Direct serves, volleys and lobs to the backhand of ' + a.opp.map(function (o, i) { return has(o, 'Backhand') ? nm(i) : null; }).filter(Boolean).join(' and ') + ', especially high balls they must play over the shoulder.',
        when: 'In a tight game or on big points.' },
      'return': { name: 'Pressure on the return', short: 'Serve body, attack return',
        what: 'Serve into the body or the backhand and close the net immediately. On their serve, step in and return low crosscourt.',
        when: 'At the start of every service game.' },
      power: { name: 'Punish short lobs', short: 'Smash the short lob',
        what: 'Stay close to the net; any short or low lob ' + (is(me, 'strength', 'Power smash') ? 'you' : 'your partner') + ' smash por 3 or to the feet. Do not smash from behind the service line - bandeja instead.',
        when: 'Their lobs land short of the service line.' },
      spin: { name: 'Read the spin', short: 'Stay back, let slice come',
        what: 'Against their slice, give the ball more space: wait for it off the glass, bend your knees and play it later and lower.' + spinNote(a, 'spin'),
        when: 'You keep misjudging bounces off the glass.' }
    }[k];
    if (!why) why = { middle: 'The seam is where pairs hesitate most, at any level.', lob: 'Owning the net wins most points in amateur padel.', slow: 'Fewer unforced errors wins most C-level matches.', pick: 'Even a small level gap adds up over a set.' }[k] || 'A solid standard pattern.';
    d.key = k; d.why = why; d.score = score;
    return d;
  }

  var SIT = {
    smash: { label: 'Smash my lobs out (por 3)',
      why: 'Your lobs land mid-court or on their forehand, giving them time to set up and smash off the side wall.',
      counter: 'Lob higher and deeper to the back corners, onto the smasher\'s backhand side. When you do lob short, stand near the side glass ready to chase the smash bouncing out.',
      turn: 'A deep lob forces a bandeja instead of a smash; when they retreat, move up to the net together.',
      drill: '20 lobs into the last metre of the court, from both sides. Count how many land; aim for 14 of 20.' },
    glass: { label: 'Side-glass spin makes me misjudge the bounce',
      why: 'Slice that hits the side glass dies and changes direction; you are moving too early and too close.',
      counter: 'Wait one extra beat, stay a step away from the glass and let the ball come off before you move. Bend the knees and play it later.',
      turn: 'After the rebound, lob deep or play a slow ball to the middle instead of forcing a winner.',
      drill: '10 min: partner feeds slice into the side glass; you only watch the rebound for 2 min, then return 20 balls to the middle.' },
    vibora: { label: 'Sliced víbora into the corner leaves me stuck at the back',
      why: 'The víbora sidespin pulls the ball into the corner and keeps it low, so you can only defend.',
      counter: 'Start a little more in the corner, let the ball come off both walls, and play a high deep lob or a soft ball crosscourt.',
      turn: 'After two good defences, use a lob over the player who hit the víbora and take the net.',
      drill: '15 corner balls (side then back glass) per side, returned to a target zone in the middle.' },
    drives: { label: 'Fast flat drives at my body at the net',
      why: 'You stand too close and your racket is low, so flat balls jam you.',
      counter: 'Step back half a metre, racket up at chest height, block short and angled to their feet. Do not swing.',
      turn: 'After two blocks they usually lob - expect it and take it as a bandeja.',
      drill: '10 min blocking flat feeds from 3 m, racket up, aiming at a target near the side wall.' },
    chiquita: { label: 'Chiquitas to my feet forcing weak volleys',
      why: 'You close too far or stay too upright; a dipping ball lands at your feet.',
      counter: 'Bend low, open the racket face and play a soft deep volley to the middle rather than going for a winner.',
      turn: 'Answer with a deep volley to the backhand corner; their next ball is usually high for you.',
      drill: '20 low volleys from feet-height feeds, aiming deep to the middle.' },
    fastlob: { label: 'Their fast lobs push me back and they take the net',
      why: 'You are too close to the net and late turning sideways.',
      counter: 'Play one step further back; on a fast lob turn sideways and run back, let it hit the glass, and lob back high and deep.',
      turn: 'Your high lob gives you time to return to the net. If the lob is short, bandeja to the corner.',
      drill: '10 min: partner feeds fast lobs; you turn, run, play off the glass and lob back.' }
  };

  function sentences(t) { return (String(t).match(/[^.!?]+[.!?]*/g) || []).map(function (x) { return x.trim(); }).filter(Boolean); }
  function computeSituations(a) {
    a = normalize(a);
    var out = (a.beats || []).filter(function (k) { return SIT[k]; }).map(function (k) { var s = SIT[k]; return { key: k, label: s.label, why: s.why, counter: s.counter, turn: s.turn, drill: s.drill }; });
    if ((a.beats || []).indexOf('other') >= 0) {
      var t = (a.beatsOther || '').trim() || 'something not in the list';
      out.push({ key: 'other', label: 'Other: ' + t,
        why: 'You said: "' + t + '". Most problems come from position, rhythm or giving them the shot they like.',
        counter: 'Notice when it happens: which player, which side, after which of your shots. Change that shot first (higher, slower, or to the other player).',
        turn: 'Use one of your tactics above to stop giving them that ball, then attack the moment they adjust.',
        drill: 'Recreate "' + t + '" with a partner for 10 min and practise only the safe reply.' });
    }
    return out;
  }

  function analyse(a) { a = normalize(a); return { tactics: computeTactics(a), situations: computeSituations(a) }; }
  var api = { analyse: analyse, computeTactics: computeTactics, computeSituations: computeSituations, normalize: normalize, resolvePick: resolvePick, sanitize: sanitize, CONFLICTS: CONFLICTS, sentences: sentences, SIT: SIT };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.PadelEngine = api;
})(this);
