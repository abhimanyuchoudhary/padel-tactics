const P = require('../profile.js'), E = require('../engine.js'), assert = require('assert');
function mem() { const d = {}; return { getItem: k => (k in d ? d[k] : null), setItem: (k, v) => { d[k] = String(v); }, removeItem: k => { delete d[k]; }, d }; }
// minimal QS stand-in with the real path shapes
const QS = [['name'], ['opp', 0, 'level'], ['comms'], ['beats'], ['me', 'side'], ['me', 'hand'], ['me', 'strength'], ['me', 'partner']].map(p => ({ path: p }));
let fails = 0; const t = (n, f) => { try { f(); console.log('PASS', n); } catch (e) { fails++; console.log('FAIL', n, e.message); } };
t('no profile on first run -> Part 4 shown', () => { const s = mem(); assert.strictEqual(P.load(s, []), null); assert.strictEqual(P.steps(QS, 'pair', false).length, 8); });
t('save after first run, then skip Part 4', () => { const s = mem(); P.save(s, { side: 'R', hand: 'R', strength: ['Net & volleys'], partner: ['Lobs & defence'] });
  const p = P.load(s, []); assert(p); assert.strictEqual(P.describe(p), 'Right side, Right hand, Net & volleys; partner: Lobs & defence');
  const st = P.steps(QS, 'pair', true); assert.strictEqual(st.length, 4); assert(!st.some(q => q.path[0] === 'me')); });
t('profile mode shows only Part 4', () => { const st = P.steps(QS, 'profile', false); assert.strictEqual(st.length, 4); assert(st.every(q => q.path[0] === 'me')); });
t('edit saves back', () => { const s = mem(); P.save(s, { side: 'R', hand: 'R', strength: ['Net & volleys'] }); P.save(s, { side: 'L', hand: 'L', strength: ['Power smash', 'Consistency'], partner: [] });
  assert.strictEqual(P.describe(P.load(s, [])), 'Left side, Left hand, Power smash + Consistency; partner: not set'); });
t('incomplete profile is not saved', () => { const s = mem(); P.save(s, { side: 'R' }); assert.strictEqual(P.load(s, []), null); });
t('legacy single-select pair seeds profile', () => { const s = mem(); const pairs = [{ name: 'old', me: { side: 'L', hand: 'R', strength: 'Consistency' } }];
  const p = P.load(s, pairs); assert.deepStrictEqual(p, { side: 'L', hand: 'R', strength: ['Consistency'], partner: [] }); assert(s.getItem(P.KEY)); });
t('current-format pair seeds from most recent (first) complete pair', () => { const s = mem();
  const p = P.load(s, [{ me: {} }, { me: { side: 'R', hand: 'L', strength: ['Lobs & defence'], partner: ['Power smash'] } }, { me: { side: 'L', hand: 'L', strength: ['Consistency'] } }]); assert.strictEqual(p.hand, 'L'); assert.strictEqual(p.side, 'R'); });
t('corrupt profile JSON falls back safely', () => { const s = mem(); s.setItem(P.KEY, '{bad'); assert.strictEqual(P.load(s, []), null); });
t('clear sticks (no re-derive from pairs) until saved again', () => { const s = mem(); const pairs = [{ me: { side: 'R', hand: 'R', strength: ['Consistency'] } }];
  assert(P.load(s, pairs)); P.clear(s); assert.strictEqual(P.load(s, pairs), null); P.save(s, pairs[0].me); assert(P.load(s, pairs)); });
t('pair keeps own Part 4 copy independent of profile', () => { const s = mem(); P.save(s, { side: 'R', hand: 'R', strength: ['Net & volleys'] });
  const pair = E.normalize({ me: JSON.parse(JSON.stringify(P.load(s, []))) }); P.save(s, { side: 'L', hand: 'L', strength: ['Consistency'] }); assert.strictEqual(pair.me.side, 'R'); });
process.exit(fails ? 1 : 0);
