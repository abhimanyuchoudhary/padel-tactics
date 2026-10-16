/* "My profile" (Part 4 answers) stored on this device only. Pure helpers, testable in Node. */
(function (root) {
  var PKEY = 'padelTactics.profile.v1';
  function norm(me) {
    var E = root.PadelEngine || (typeof require !== 'undefined' ? require('./engine.js') : null);
    var m = E.normalize({ me: me || {} }).me;
    return { side: m.side || '', hand: m.hand || '', strength: m.strength, partner: m.partner };
  }
  function complete(me) { return !!(me && me.side && me.hand && me.strength && me.strength.length); }
  /* Returns the stored profile, or one derived from the most recent saved pair (pairs[0]). */
  function load(storage, pairs) {
    var p = null;
    try { p = JSON.parse(storage.getItem(PKEY)); } catch (e) { p = null; }
    if (p && typeof p === 'object') { p = norm(p); if (complete(p)) return p; }
    if (storage.getItem(PKEY + '.cleared')) return null; /* user cleared it: don't re-derive */
    var recent = (pairs || []).filter(function (x) { return x && complete(norm(x.me)); })[0];
    if (recent) { p = norm(recent.me); save(storage, p); return p; }
    return null;
  }
  function save(storage, me) { var p = norm(me); if (complete(p)) { storage.setItem(PKEY, JSON.stringify(p)); storage.removeItem(PKEY + '.cleared'); } return p; }
  function clear(storage) { storage.removeItem(PKEY); storage.setItem(PKEY + '.cleared', '1'); }
  function sideTxt(v) { return v === 'L' ? 'Left side' : 'Right side'; }
  function handTxt(v) { return v === 'L' ? 'Left hand' : 'Right hand'; }
  function describe(p) {
    if (!p) return '';
    var s = sideTxt(p.side) + ', ' + handTxt(p.hand) + (p.strength.length ? ', ' + p.strength.join(' + ') : '');
    return s + '; partner: ' + (p.partner.length ? p.partner.join(' + ') : 'not set');
  }
  /* Which wizard questions to show. mode: 'pair' or 'profile'. */
  function steps(QS, mode, skipMe) {
    return QS.filter(function (q) { var me = q.path[0] === 'me'; return mode === 'profile' ? me : !(skipMe && me); });
  }
  var api = { KEY: PKEY, load: load, save: save, clear: clear, describe: describe, steps: steps, complete: complete, norm: norm };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.PadelProfile = api;
})(this);
