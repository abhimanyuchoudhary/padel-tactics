(function () {
  var KEY = 'padelTactics.pairs.v1';
  var o = function (v, l) { return { v: v, l: l || v }; };
  var STR = [o('Net & volleys'), o('Lobs & defence'), o('Power smash'), o('Consistency')];
  function oppQs(i) {
    var who = i === 0 ? 'Opponent A' : 'Opponent B', p = function (k) { return ['opp', i, k]; };
    return [
      { path: p('level'), q: who + ': level', opts: [o('D+'), o('C-'), o('C'), o('C+')] },
      { path: p('hand'), q: who + ': which hand?', opts: [o('R', 'Right-handed'), o('L', 'Left-handed')] },
      { path: p('side'), q: who + ': which side do they play?', opts: [o('R', 'Right (drive)'), o('L', 'Left (revés)')] },
      { path: p('style'), q: who + ': playing style (pick all that apply)', multi: 99, opts: [o('Aggressive net'), o('Defensive back'), o('Mixed')] },
      { path: p('ground'), q: who + ': groundstrokes (pick all that apply)', multi: 99, opts: [o('Flat & hard'), o('Heavy topspin'), o('Slice & backspin'), o('Mix')] },
      { path: p('overhead'), q: who + ': overhead (pick all that apply)', multi: 99, opts: [o('Flat smash', 'Flat smash for winners (por 3 / por 4)'), o('Bandeja', 'Bandeja with slice'), o('Vibora', 'Víbora with sidespin'), o('Lets it bounce')] },
      { path: p('glass'), q: who + ': off the back glass (pick all that apply)', multi: 99, opts: [o('Attacking drive'), o('Safe lob'), o('Chiquita'), o('Struggles')] },
      { path: p('serve'), q: who + ': serve (pick all that apply)', multi: 99, opts: [o('Flat'), o('Slice off glass', 'Slice kicking off side glass'), o('Safe')] },
      { path: p('lobs'), q: who + ': lobs (pick all that apply)', multi: 99, opts: [o('High & deep'), o('Low & fast'), o('Rarely')] },
      { path: p('weak'), q: who + ': weaknesses (up to 3)', multi: 3, opts: ['Backhand', 'Lob defence', 'Back glass / wall rebounds', 'Low volleys', 'Bandeja/overhead', 'Slow footwork', 'Impatient', 'Weak serve return'].map(function (x) { return o(x); }) },
      { path: p('best'), q: who + ': best shot (optional)', text: true, optional: true }
    ];
  }
  var QS = [{ path: ['name'], q: 'Name this opponent pair', text: true, placeholder: 'e.g. Tuesday JLT pair' }]
    .concat(oppQs(0), oppQs(1), [
      { path: ['comms'], q: 'Do they communicate and move together well?', opts: [o('Yes'), o('No')] },
      { path: ['beats'], q: 'How do they beat you? (pick 1-2)', multi: 2, opts: Object.keys(PadelEngine.SIT).map(function (k) { return o(k, PadelEngine.SIT[k].label); }).concat([o('other', 'Other (type below)')]), other: 'beatsOther' },
      { path: ['me', 'side'], q: 'You: which side do you play?', opts: [o('R', 'Right (drive)'), o('L', 'Left (revés)')] },
      { path: ['me', 'hand'], q: 'You: which hand?', opts: [o('R', 'Right-handed'), o('L', 'Left-handed')] },
      { path: ['me', 'strength'], q: 'You: your strengths (pick all that apply)', multi: 99, opts: STR },
      { path: ['me', 'partner'], q: 'Your partner\'s strengths (optional, pick all that apply)', multi: 99, opts: STR, optional: true }
    ]);
  function blank() { return PadelEngine.normalize({ id: null }); }
  var S = { ans: blank(), step: 0, mode: 'pair', skipMe: false, isNew: true }, app = document.getElementById('app');
  function get(p) { var x = S.ans; for (var i = 0; i < p.length; i++) { if (x == null) return undefined; x = x[p[i]]; } return x; }
  function set(p, v) { var x = S.ans; for (var i = 0; i < p.length - 1; i++) x = x[p[i]] = x[p[i]] || {}; x[p[p.length - 1]] = v; }
  function load() {
    var l; try { l = JSON.parse(localStorage.getItem(KEY)) || []; } catch (e) { l = []; }
    if (!Array.isArray(l)) l = [];
    l = l.filter(function (p) { return p && typeof p === 'object'; }).map(function (p) { var n = PadelEngine.normalize(p); n.id = p.id || ('p' + Math.random().toString(36).slice(2)); return n; });
    store(l); return l; /* saved back in the new array format */
  }
  function store(l) { localStorage.setItem(KEY, JSON.stringify(l)); }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function el(h) { app.innerHTML = h; window.scrollTo(0, 0); var f = app.querySelector('h2'); if (f) { f.tabIndex = -1; f.focus({ preventScroll: true }); } }
  function on(sel, fn) { app.querySelectorAll(sel).forEach(function (b) { b.addEventListener('click', fn); }); }

  function home() { S.note = ''; prof(); /* seeds profile from most recent pair if none */
    var l = load();
    el('<h2>Your opponent pairs</h2><button class="primary" id="new">+ New opponent pair</button>' +
      (l.length ? l.map(function (p) { return '<div class="card"><h3>' + esc(p.name || 'Unnamed') + '</h3><p class="small">A: ' + esc(p.opp[0].level || '?') + ' ' + esc(p.opp[0].side === 'L' ? 'left' : 'right') + ' side · B: ' + esc(p.opp[1].level || '?') + ' ' + esc(p.opp[1].side === 'L' ? 'left' : 'right') + ' side</p><div class="row"><button class="primary" data-a="view" data-id="' + p.id + '">Tactics</button><button class="ghost" data-a="card" data-id="' + p.id + '">Card</button></div><div class="row"><button class="ghost" data-a="edit" data-id="' + p.id + '">Edit</button><button class="danger" data-a="del" data-id="' + p.id + '">Delete</button></div></div>'; }).join('') : '<p class="small">No saved pairs yet. Answer 29 quick questions about your opponents and get a game plan.</p>'));
    on('#new', function () { startPair(blank(), true); });
    on('[data-a]', function (e) {
      var id = e.currentTarget.dataset.id, a = e.currentTarget.dataset.a, p = l.filter(function (x) { return x.id === id; })[0];
      if (a === 'del') { if (confirm('Delete "' + p.name + '"?')) { store(l.filter(function (x) { return x.id !== id; })); home(); } return; }
      S.ans = PadelEngine.normalize(p); S.ans.id = p.id;
      if (a === 'edit') { startPair(S.ans, false); } else if (a === 'card') card(); else results();
    });
  }
  function valid(q) {
    var v = get(q.path); if (q.optional) return true;
    if (q.multi) return Array.isArray(v) && v.length > 0;
    return v != null && String(v).trim() !== '';
  }
  var P = window.PadelProfile;
  function prof() { return P.load(localStorage, load()); }
  function Q() { return P.steps(QS, S.mode, S.skipMe); }
  function startPair(ans, isNew) {
    var p = prof(); S.mode = 'pair'; S.isNew = isNew; S.step = 0; S.ans = ans;
    S.skipMe = isNew && !!p; if (S.skipMe) S.ans.me = JSON.parse(JSON.stringify(p)); wizard();
  }
  function profileScreen() {
    var p = prof();
    el('<h2>My profile</h2><p class="small">Saved on this device only. Used for every new opponent pair.</p><div class="card"><p>' + (p ? esc(P.describe(p)) : 'No profile yet. It is saved after your first completed run, or set it up now.') + '</p></div>' +
      '<button class="primary" id="pe">' + (p ? 'Edit profile' : 'Set up profile') + '</button>' + (p ? '<button class="danger" id="pc">Clear profile</button>' : '') + '<button class="ghost" id="ph">Back to pairs</button>');
    on('#pe', function () { S.mode = 'profile'; S.step = 0; S.ans = blank(); if (p) S.ans.me = JSON.parse(JSON.stringify(p)); wizard(); });
    on('#pc', function () { if (confirm('Clear your profile? Saved pairs keep their own copy.')) { P.clear(localStorage); profileScreen(); } });
    on('#ph', home);
  }
  function wizard() {
    var QS = Q(), q = QS[S.step], v = get(q.path), pct = Math.round(S.step / QS.length * 100), h;
    if (q.text) h = '<label for="t" class="small">' + (q.optional ? 'Optional - skip if unsure' : 'Type a name') + '</label><input type="text" id="t" value="' + esc(v || '') + '" placeholder="' + esc(q.placeholder || '') + '">';
    else h = q.opts.map(function (x) { var sel = q.multi ? (v || []).indexOf(x.v) >= 0 : v === x.v; return '<button class="opt" aria-pressed="' + sel + '" data-v="' + esc(x.v) + '">' + esc(x.l) + '</button>'; }).join('') +
      (q.other ? '<input type="text" id="oth" placeholder="Other: describe it" value="' + esc(S.ans[q.other] || '') + '">' : '') +
      (S.note ? '<p class="note" role="status">' + esc(S.note) + '</p>' : '') + (q.multi ? '<p class="small">' + (q.multi < q.opts.length ? 'Pick up to ' + q.multi + '. ' : 'Pick all that apply. ') + (q.optional ? 'Optional.' : 'Then tap Next.') + '</p>' : '');
    el('<div class="progress" role="progressbar" aria-valuenow="' + pct + '" aria-valuemin="0" aria-valuemax="100"><div style="width:' + pct + '%"></div></div><p class="small">Question ' + (S.step + 1) + ' of ' + QS.length + '</p><h2>' + esc(q.q) + '</h2>' + h +
      (S.mode === 'pair' && S.skipMe && S.step === QS.length - 1 ? '<div class="card" id="pline"><p>Using your profile: ' + esc(P.describe(S.ans.me)) + '</p><button class="ghost" id="pedit">Edit profile for this run</button></div>' : '') + '<div class="nav"><button class="ghost" id="back">' + (S.step ? 'Back' : 'Cancel') + '</button><button class="primary" id="next" ' + (valid(q) ? '' : 'disabled') + '>' + (S.step === QS.length - 1 ? 'See tactics' : 'Next') + '</button></div>');
    var next = app.querySelector('#next');
    var t = app.querySelector('#t'); if (t) t.addEventListener('input', function () { set(q.path, t.value); next.disabled = !valid(q); });
    var ot = app.querySelector('#oth'); if (ot) ot.addEventListener('input', function () { S.ans[q.other] = ot.value; if (ot.value.trim()) { var c = get(q.path) || []; if (c.indexOf('other') < 0 && c.length < q.multi) { c.push('other'); set(q.path, c); var b = app.querySelector('[data-v=other]'); b.setAttribute('aria-pressed', 'true'); } } next.disabled = !valid(q); });
    on('.opt', function (e) {
      var val = e.currentTarget.dataset.v;
      if (q.multi) { var c = (get(q.path) || []).slice(), i = c.indexOf(val); S.note = ''; if (i >= 0) c.splice(i, 1); else { var r = PadelEngine.resolvePick(q.path[q.path.length - 1], c, val); c = r.value; S.note = r.note; if (c.length > q.multi) { S.note = (S.note ? S.note + ' ' : '') + 'Removed ' + c[0] + ': up to ' + q.multi + ' picks.'; c.shift(); } } set(q.path, c); wizard(); }
      else { set(q.path, q.optional && get(q.path) === val ? undefined : val); if (!q.optional) { go(1); } else wizard(); }
    });
    on('#back', function () { if (S.step) go(-1); else if (S.mode === 'profile') profileScreen(); else home(); });
    on('#next', function () { if (S.step === QS.length - 1) finish(); else go(1); });
    on('#pedit', function () { S.skipMe = false; S.step = Q().findIndex(function (x) { return x.path[0] === 'me'; }); S.note = ''; wizard(); });
  }
  function finish() {
    if (S.mode === 'profile') { P.save(localStorage, S.ans.me); profileScreen(); return; }
    var p = prof();
    if (S.skipMe && p) S.ans.me = JSON.parse(JSON.stringify(p));
    else if (S.isNew) P.save(localStorage, S.ans.me);
    save(); results();
  }
  function go(d) { S.note = ''; S.step += d; wizard(); }
  function save() { var id = S.ans.id; S.ans = PadelEngine.normalize(S.ans); S.ans.id = id; var l = load(); if (!S.ans.id) S.ans.id = 'p' + Date.now(); l = l.filter(function (x) { return x.id !== S.ans.id; }); l.unshift(S.ans); store(l); }
  function results() {
    var r = PadelEngine.analyse(S.ans);
    el('<h2>Game plan vs ' + esc(S.ans.name) + '</h2><button class="primary" id="mc">Open match card</button>' +
      '<h3>Tactics</h3>' + r.tactics.map(function (t, i) { return '<div class="card"><h3>' + (i + 1) + '. ' + esc(t.name) + '</h3><p><span class="lbl">What to do: </span>' + esc(t.what) + '</p><p><span class="lbl">Why it works: </span>' + esc(t.why) + '</p><p><span class="lbl">Switch to this when: </span>' + esc(t.when) + '</p></div>'; }).join('') +
      (r.situations.length ? '<h3>How they beat you - and the fix</h3>' + r.situations.map(function (s) { return '<div class="card"><h3>' + esc(s.label) + '</h3><p><span class="lbl">Why it happens: </span>' + esc(s.why) + '</p><p><span class="lbl">Counter: </span>' + esc(s.counter) + '</p><p><span class="lbl">Turn it around: </span>' + esc(s.turn) + '</p><p><span class="lbl">Drill: </span>' + esc(s.drill) + '</p></div>'; }).join('') : '') +
      '<div class="row"><button class="ghost" id="ed">Edit answers</button><button class="ghost" id="hm">All pairs</button></div>');
    on('#mc', card); on('#ed', function () { startPair(S.ans, false); }); on('#hm', home);
  }
  function card() {
    var r = PadelEngine.analyse(S.ans);
    el('<h2>Match card</h2><div class="match"><strong>vs ' + esc(S.ans.name) + '</strong><ol>' + r.tactics.map(function (t) { return '<li>' + esc(t.name) + '<span class="s">' + esc(t.short) + ' · switch when: ' + esc(t.when.split(/ - |, or |\. /)[0].replace(/\.$/, '')) + '</span></li>'; }).join('') + '</ol>' +
      (r.situations.length ? '<p><strong>If they…</strong></p><ol>' + r.situations.map(function (s) { return '<li>' + esc(s.label) + '<span class="s">' + esc(s.counter.split('. ')[0].replace(/\.$/, '')) + '</span></li>'; }).join('') + '</ol>' : '') +
      '</div><button class="ghost" id="bk">Back to full plan</button>');
    on('#bk', results);
  }
  document.getElementById('home-link').addEventListener('click', home);
  document.getElementById('prof-btn').addEventListener('click', profileScreen);
  home();
})();
