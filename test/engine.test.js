const E = require('../engine.js'), assert = require('assert');
const sets = {
  rightyPair: { name: 'Two righties', opp: [{ level: 'C-', hand: 'R', side: 'R', style: 'Aggressive net', ground: 'Flat & hard', overhead: 'Lets it bounce', glass: 'Struggles', serve: 'Safe', lobs: 'Rarely', weak: ['Lob defence', 'Impatient'] }, { level: 'C+', hand: 'R', side: 'L', style: 'Mixed', ground: 'Mix', overhead: 'Bandeja', glass: 'Safe lob', serve: 'Flat', lobs: 'High & deep', weak: [] }], comms: 'No', beats: ['drives', 'smash'], me: { side: 'R', hand: 'R', strength: 'Lobs & defence' } },
  leftyLeft: { name: 'Lefty on left', opp: [{ level: 'C', hand: 'R', side: 'R', style: 'Defensive back', ground: 'Slice & backspin', overhead: 'Vibora', glass: 'Attacking drive', serve: 'Slice off glass', lobs: 'Low & fast', weak: ['Low volleys'] }, { level: 'C', hand: 'L', side: 'L', style: 'Aggressive net', ground: 'Heavy topspin', overhead: 'Flat smash', glass: 'Chiquita', serve: 'Flat', lobs: 'Low & fast', weak: ['Bandeja/overhead', 'Backhand'] }], comms: 'Yes', beats: ['glass', 'other'], beatsOther: 'they lob over my partner', me: { side: 'L', hand: 'R', strength: 'Power smash', partner: 'Net & volleys' } },
  steadyPair: { name: 'Steady', opp: [{ level: 'C+', hand: 'R', side: 'R', style: 'Mixed', ground: 'Flat & hard', overhead: 'Bandeja', glass: 'Safe lob', serve: 'Safe', lobs: 'High & deep', weak: ['Weak serve return'] }, { level: 'D+', hand: 'L', side: 'R', style: 'Defensive back', ground: 'Mix', overhead: 'Lets it bounce', glass: 'Struggles', serve: 'Safe', lobs: 'Rarely', weak: ['Back glass / wall rebounds', 'Slow footwork'] }], comms: 'Yes', beats: ['chiquita'], me: { side: 'R', hand: 'L', strength: 'Consistency' } },
  minimal: { name: 'Minimal', opp: [{ level: 'C', hand: 'R', side: 'R', style: 'Mixed', ground: 'Mix', overhead: 'Bandeja', glass: 'Safe lob', serve: 'Flat', lobs: 'High & deep', weak: [] }, { level: 'C', hand: 'R', side: 'L', style: 'Mixed', ground: 'Mix', overhead: 'Bandeja', glass: 'Safe lob', serve: 'Flat', lobs: 'High & deep', weak: [] }], comms: 'Yes', beats: ['other'], beatsOther: '', me: { side: 'R', hand: 'R', strength: 'Net & volleys' } }
};
const sigs = {}; let fails = 0;
for (const [k, a] of Object.entries(sets)) {
  const r = E.analyse(a), txt = JSON.stringify(r);
  try {
    assert(r.tactics.length >= 3 && r.tactics.length <= 4, 'tactic count');
    assert(!/undefined|null|NaN|\[object/.test(txt), 'bad text: ' + txt.match(/.{30}(undefined|null|NaN).{30}/));
    r.tactics.forEach(t => ['name', 'what', 'why', 'when', 'short'].forEach(f => assert(t[f] && t[f].length > 3, f)));
    r.situations.forEach(s => ['why', 'counter', 'turn', 'drill'].forEach(f => assert(s[f].length > 3)));
    assert.strictEqual(r.situations.length, a.beats.length);
    sigs[k] = r.tactics.map(t => t.name).join(' | ');
    console.log('PASS', k, '->', sigs[k]);
  } catch (e) { fails++; console.log('FAIL', k, e.message); }
}
const uniq = new Set(Object.values(sigs));
if (uniq.size !== Object.keys(sigs).length) { fails++; console.log('FAIL selections not distinct'); } else console.log('PASS all', uniq.size, 'tactic selections distinct');
process.exit(fails ? 1 : 0);
