const E = require('../engine.js'), assert = require('assert');
const sets = {
  rightyPair: { name: 'Two righties', opp: [{ level: 'C-', hand: 'R', side: 'R', style: 'Aggressive net', ground: 'Flat & hard', overhead: 'Lets it bounce', glass: 'Struggles', serve: 'Safe', lobs: 'Rarely', weak: ['Lob defence', 'Impatient'] }, { level: 'C+', hand: 'R', side: 'L', style: 'Mixed', ground: 'Mix', overhead: 'Bandeja', glass: 'Safe lob', serve: 'Flat', lobs: 'High & deep', weak: [] }], comms: 'No', beats: ['drives', 'smash'], me: { side: 'R', hand: 'R', strength: 'Lobs & defence' } },
  leftyLeft: { name: 'Lefty on left', opp: [{ level: 'C', hand: 'R', side: 'R', style: 'Defensive back', ground: 'Slice & backspin', overhead: 'Vibora', glass: 'Attacking drive', serve: 'Slice off glass', lobs: 'Low & fast', weak: ['Low volleys'] }, { level: 'C', hand: 'L', side: 'L', style: 'Aggressive net', ground: 'Heavy topspin', overhead: 'Flat smash', glass: 'Chiquita', serve: 'Flat', lobs: 'Low & fast', weak: ['Bandeja/overhead', 'Backhand'] }], comms: 'Yes', beats: ['glass', 'other'], beatsOther: 'they lob over my partner', me: { side: 'L', hand: 'R', strength: 'Power smash', partner: 'Net & volleys' } },
  steadyPair: { name: 'Steady', opp: [{ level: 'C+', hand: 'R', side: 'R', style: 'Mixed', ground: 'Flat & hard', overhead: 'Bandeja', glass: 'Safe lob', serve: 'Safe', lobs: 'High & deep', weak: ['Weak serve return'] }, { level: 'D+', hand: 'L', side: 'R', style: 'Defensive back', ground: 'Mix', overhead: 'Lets it bounce', glass: 'Struggles', serve: 'Safe', lobs: 'Rarely', weak: ['Back glass / wall rebounds', 'Slow footwork'] }], comms: 'Yes', beats: ['chiquita'], me: { side: 'R', hand: 'L', strength: 'Consistency' } },
  minimal: { name: 'Minimal', opp: [{ level: 'C', hand: 'R', side: 'R', style: 'Mixed', ground: 'Mix', overhead: 'Bandeja', glass: 'Safe lob', serve: 'Flat', lobs: 'High & deep', weak: [] }, { level: 'C', hand: 'R', side: 'L', style: 'Mixed', ground: 'Mix', overhead: 'Bandeja', glass: 'Safe lob', serve: 'Flat', lobs: 'High & deep', weak: [] }], comms: 'Yes', beats: ['other'], beatsOther: '', me: { side: 'R', hand: 'R', strength: 'Net & volleys' } }
};
// multi-select combos
sets.multiCombo = { name: 'Combo', opp: [{ level: 'C', hand: 'R', side: 'R', style: ['Aggressive net', 'Defensive back'], ground: ['Flat & hard', 'Slice & backspin', 'Heavy topspin'], overhead: ['Flat smash', 'Bandeja', 'Vibora', 'Lets it bounce'], glass: ['Struggles', 'Chiquita'], serve: ['Slice off glass', 'Safe'], lobs: ['Low & fast', 'High & deep'], weak: ['Lob defence', 'Impatient', 'Low volleys'] }, { level: 'C', hand: 'L', side: 'R', style: ['Mixed'], ground: ['Flat & hard'], overhead: ['Bandeja'], glass: ['Safe lob'], serve: ['Flat'], lobs: ['Rarely'], weak: ['Backhand'] }], comms: 'No', beats: ['fastlob', 'vibora'], me: { side: 'L', hand: 'R', strength: ['Lobs & defence', 'Consistency', 'Power smash'], partner: ['Lobs & defence', 'Net & volleys'] } };
sets.multiCombo2 = JSON.parse(JSON.stringify(sets.multiCombo)); sets.multiCombo2.opp[0].ground = ['Slice & backspin']; sets.multiCombo2.opp[1].ground = ['Slice & backspin']; sets.multiCombo2.opp[0].weak = ['Back glass / wall rebounds']; sets.multiCombo2.comms = 'Yes'; sets.multiCombo2.me.strength = ['Net & volleys'];
const sigs = {}; let fails = 0;
for (const [k, a] of Object.entries(sets)) {
  const r = E.analyse(a), txt = JSON.stringify(r);
  try {
    assert(r.tactics.length >= 3 && r.tactics.length <= 4, 'tactic count');
    assert(!/undefined|null|NaN|\[object/.test(txt), 'bad text: ' + txt.match(/.{30}(undefined|null|NaN).{30}/));
    r.tactics.forEach(t => ['name', 'what', 'why', 'when', 'short'].forEach(f => assert(t[f] && t[f].length > 3, f)));
    r.situations.forEach(s => ['why', 'counter', 'turn', 'drill'].forEach(f => assert(s[f].length > 3)));
    assert.strictEqual(r.situations.length, a.beats.length);
    const card = []; r.tactics.forEach(t => { const own = []; ['what', 'why', 'when'].forEach(f => E.sentences(t[f]).forEach(x => own.push(x.toLowerCase()))); assert.strictEqual(new Set(own).size, own.length, 'repeat within ' + t.name); card.push(...own); });
    r.situations.forEach(s => ['why', 'counter', 'turn', 'drill'].forEach(f => E.sentences(s[f]).forEach(x => card.push(x.toLowerCase()))));
    const dup = card.filter((x, i) => card.indexOf(x) !== i); assert(!dup.length, 'repeated sentence across card: ' + dup[0]);
    sigs[k] = r.tactics.map(t => t.name).join(' | ');
    console.log('PASS', k, '->', sigs[k]);
  } catch (e) { fails++; console.log('FAIL', k, e.message); }
}
const uniq = new Set(Object.values(sigs));
if (uniq.size !== Object.keys(sigs).length) { fails++; console.log('FAIL selections not distinct'); } else console.log('PASS all', uniq.size, 'tactic selections distinct');
// combined wording: flat + slice + topspin all adjust text
{ const t = E.analyse(sets.multiCombo).tactics.map(t => t.what).join(' ');
  const all = ['slow', 'spin'].length; const raw = JSON.stringify(E.analyse(sets.multiCombo));
  if (/topspin/i.test(raw)) console.log('PASS combo wording mentions topspin'); else { fails++; console.log('FAIL combo wording'); } }
// legacy single-select object
{ const legacy = { id: 'old1', name: 'Legacy', opp: [{ level: 'C', hand: 'R', side: 'R', style: 'Mixed', ground: 'Flat & hard', overhead: 'Bandeja', glass: 'Struggles', serve: 'Safe', lobs: 'Rarely', weak: ['Backhand'] }, { level: 'C-', hand: 'R', side: 'L', style: 'Aggressive net', ground: 'Mix', overhead: 'Lets it bounce', glass: 'Safe lob', serve: 'Flat', lobs: 'High & deep', weak: [] }], comms: 'Yes', beats: ['smash'], me: { side: 'R', hand: 'R', strength: 'Consistency' } };
  try { const n = E.normalize(legacy); ['style','ground','overhead','glass','serve','lobs','weak'].forEach(f => assert(Array.isArray(n.opp[0][f]) && Array.isArray(n.opp[1][f]), f));
    assert.deepStrictEqual(n.opp[0].style, ['Mixed']); assert.deepStrictEqual(n.me.strength, ['Consistency']); assert.deepStrictEqual(n.me.partner, []);
    assert.deepStrictEqual(E.normalize(n), n, 'idempotent');
    const r = E.analyse(legacy); assert(r.tactics.length >= 3 && !/undefined|NaN/.test(JSON.stringify(r)));
    console.log('PASS legacy single-select pair migrates and renders ->', r.tactics.map(t => t.name).join(' | ')); } catch (e) { fails++; console.log('FAIL legacy', e.message); } }
// conflict resolution
try {
  let r = E.resolvePick('glass', ['Attacking drive', 'Safe lob'], 'Struggles');
  assert.deepStrictEqual(r.value, ['Struggles']); assert.strictEqual(r.note, "Removed Attacking drive and Safe lob: doesn't fit with Struggles.");
  r = E.resolvePick('glass', ['Struggles'], 'Chiquita'); assert.deepStrictEqual(r.value, ['Chiquita']);
  r = E.resolvePick('glass', ['Safe lob'], 'Chiquita'); assert.deepStrictEqual(r.value, ['Safe lob', 'Chiquita']); assert.strictEqual(r.note, '');
  r = E.resolvePick('style', ['Aggressive net'], 'Defensive back'); assert.deepStrictEqual(r.value, ['Defensive back']); assert(/pick Mixed/.test(r.note));
  r = E.resolvePick('style', ['Aggressive net', 'Defensive back'], 'Mixed'); assert.deepStrictEqual(r.value, ['Mixed']);
  r = E.resolvePick('ground', ['Flat & hard', 'Slice & backspin'], 'Mix'); assert.deepStrictEqual(r.value, ['Mix']);
  r = E.resolvePick('ground', ['Mix'], 'Heavy topspin'); assert.deepStrictEqual(r.value, ['Heavy topspin']);
  r = E.resolvePick('lobs', ['High & deep', 'Low & fast'], 'Rarely'); assert.deepStrictEqual(r.value, ['Rarely']);
  r = E.resolvePick('overhead', ['Flat smash', 'Bandeja'], 'Lets it bounce'); assert.deepStrictEqual(r.value, ['Bandeja', 'Lets it bounce']);
  r = E.resolvePick('weak', ['Backhand'], 'Impatient'); assert.deepStrictEqual(r.value, ['Backhand', 'Impatient']);
  console.log('PASS conflict resolution (10 cases)');
} catch (e) { fails++; console.log('FAIL conflicts', e.message); }
// sanitize saved pairs with conflicts: last pick wins
try {
  const bad = { name: 'Bad', opp: [{ level: 'C', hand: 'R', side: 'R', style: ['Aggressive net', 'Defensive back'], ground: ['Flat & hard', 'Mix'], overhead: ['Flat smash', 'Vibora', 'Lets it bounce'], glass: ['Struggles', 'Safe lob'], serve: ['Flat', 'Safe'], lobs: ['Rarely', 'High & deep'], weak: ['Backhand'] }, { level: 'C', hand: 'R', side: 'L', style: 'Mixed', ground: 'Mix', overhead: 'Bandeja', glass: 'Struggles', serve: 'Safe', lobs: 'Rarely', weak: [] }], comms: 'Yes', beats: ['smash'], me: { side: 'R', hand: 'R', strength: 'Consistency' } };
  const n = E.normalize(bad), o = n.opp[0];
  assert.deepStrictEqual(o.style, ['Defensive back']); assert.deepStrictEqual(o.ground, ['Mix']); assert.deepStrictEqual(o.overhead, ['Vibora', 'Lets it bounce']);
  assert.deepStrictEqual(o.glass, ['Safe lob']); assert.deepStrictEqual(o.serve, ['Flat', 'Safe']); assert.deepStrictEqual(o.lobs, ['High & deep']);
  assert.deepStrictEqual(n.opp[1].glass, ['Struggles']);
  Object.keys(E.CONFLICTS).forEach(f => n.opp.forEach(p => E.CONFLICTS[f].forEach(c => assert(!(p[f].includes(c[0]) && p[f].includes(c[1])), 'conflict left in ' + f))));
  assert.deepStrictEqual(E.normalize(n), n);
  const r = E.analyse(bad); assert(r.tactics.length >= 3 && !/undefined|NaN/.test(JSON.stringify(r)));
  console.log('PASS conflicting saved pair sanitized (last pick wins) and renders');
} catch (e) { fails++; console.log('FAIL sanitize', e.message); }
process.exit(fails ? 1 : 0);
