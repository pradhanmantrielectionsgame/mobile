// Live two-player multiplayer over Firebase Realtime Database (friend match
// codes only). Nothing here touches the game rules: every phone runs the
// same deterministic game, and this file only ships the recorded action list
// between them. game.js/engine.js never reference it.
//
// Roles: the host creates the match (side 'h'), the guest joins (side 'g').
// Each phone plays its OWN player as 'p1' (the whole UI assumes that); the
// other side's actions are applied as 'p2'. The guest's game is built with
// the players swapped and the host's starting map mirrored, which the
// lockstep test in mobile/mp-check.js proves stays identical to the host's.
//
// The pure helpers at the top (mirrorPop, createApplier) have no Firebase
// dependency so `node mobile/mp-check.js` can test them.
(function (root) {
  'use strict';

  var FIREBASE_VERSION = '10.12.5';
  var CODE_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'; // no 0/O/1/I/L lookalikes
  var CODE_LENGTH = 6;
  // What a phone is allowed to send/apply. Anything else is ignored, so a
  // hand-crafted entry can't call arbitrary functions on the other phone.
  var ALLOWED_FNS = ['investCash', 'playRallyToken', 'tapAgenda', 'craftToken',
    'activateNationwideRally', 'activatePower', 'acceptAlly', 'giveAllyTokens', 'endPhase', 'pause', 'resume'];

  // ---------------------------------------------------------------------
  // Pure helpers
  // ---------------------------------------------------------------------

  // Swap the p1/p2 shares of every state — the guest's view of the host's map.
  function mirrorPop(pop) {
    var out = {};
    Object.keys(pop).forEach(function (k) {
      out[k] = { p1: pop[k].p2, p2: pop[k].p1, others: pop[k].others };
    });
    return out;
  }

  function copyPop(pop) {
    var out = {};
    Object.keys(pop).forEach(function (k) {
      out[k] = { p1: pop[k].p1, p2: pop[k].p2, others: pop[k].others };
    });
    return out;
  }

  // Applies entries in Firebase key order (= time order) so both phones land
  // on the same result even when two taps race for the same last rally slot.
  // A phone applies its own taps immediately for instant feedback; if a
  // remote entry then turns up that sorts BEFORE something already applied,
  // rebuild() throws the game away and the whole ordered list is replayed.
  //   applyOne(entry)  — run one entry against the live game
  //   rebuild()        — reset to a fresh game (same seed/map), no entries applied
  //   rebuilt()        — optional, called once after a rebuild replay finished
  function createApplier(applyOne, rebuild, rebuilt) {
    var applied = []; // entries, sorted by key
    var keys = {};
    return {
      // alreadyApplied: the local tap that produced this entry already ran.
      add: function (entry, alreadyApplied) {
        if (keys[entry.key]) return 'dup';
        keys[entry.key] = true;
        var last = applied.length ? applied[applied.length - 1].key : '';
        if (entry.key > last) {
          applied.push(entry);
          if (!alreadyApplied) applyOne(entry);
          return 'applied';
        }
        // Out of order: insert where it belongs, then replay everything.
        var i = applied.length;
        while (i > 0 && applied[i - 1].key > entry.key) i--;
        applied.splice(i, 0, entry);
        rebuild();
        applied.forEach(applyOne);
        if (rebuilt) rebuilt();
        return 'rebuilt';
      },
      entries: function () { return applied.slice(); }
    };
  }

  function randomCode() {
    var s = '';
    for (var i = 0; i < CODE_LENGTH; i++) s += CODE_ALPHABET.charAt(Math.floor(Math.random() * CODE_ALPHABET.length));
    return s;
  }

  function normalizeCode(text) {
    return String(text || '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, CODE_LENGTH);
  }

  // ---------------------------------------------------------------------
  // Firebase plumbing (browser only)
  // ---------------------------------------------------------------------
  var fb = null; // { db, uid }
  var loading = null;

  function loadScript(src) {
    return new Promise(function (resolve, reject) {
      var el = document.createElement('script');
      el.src = src; el.async = false;
      el.onload = resolve;
      el.onerror = function () { reject(new Error('Could not load ' + src)); };
      document.head.appendChild(el);
    });
  }

  // Firebase is only downloaded when someone opens a friend match, so
  // single-player pays nothing for it.
  function ensureFirebase() {
    if (fb) return Promise.resolve(fb);
    if (loading) return loading;
    var base = 'https://www.gstatic.com/firebasejs/' + FIREBASE_VERSION + '/firebase-';
    loading = loadScript(base + 'app-compat.js')
      .then(function () { return Promise.all([loadScript(base + 'auth-compat.js'), loadScript(base + 'database-compat.js')]); })
      .then(function () {
        var firebase = root.firebase;
        if (!firebase.apps.length) firebase.initializeApp(root.PME_FIREBASE_CONFIG);
        return firebase.auth().signInAnonymously();
      })
      .then(function (cred) {
        fb = { db: root.firebase.database(), uid: cred.user.uid };
        return fb;
      })
      .catch(function (e) { loading = null; throw e; });
    return loading;
  }

  function matchRef(code) { return fb.db.ref('matches/' + code); }

  // Host: reserve a fresh code. The transaction refuses an occupied code, so
  // two hosts can't end up sharing one.
  function createMatch(polId, settings, name) {
    return ensureFirebase().then(function () {
      function attempt(triesLeft) {
        var code = randomCode();
        var ref = matchRef(code);
        var record = {
          hostUid: fb.uid, hostPol: polId,
          phaseSeconds: settings.phaseSeconds, totalPhases: settings.totalPhases,
          seed: (Date.now() ^ (Math.random() * 1e9)) >>> 0,
          status: 'waiting', createdAt: root.firebase.database.ServerValue.TIMESTAMP
        };
        if (name) record.hostName = name;
        return ref.transaction(function (cur) { return cur === null ? record : undefined; })
          .then(function (res) {
            if (res.committed) return { code: code, seed: record.seed };
            if (triesLeft <= 0) throw new Error('Could not reserve a match code');
            return attempt(triesLeft - 1);
          });
      }
      return attempt(5);
    });
  }

  // Guest, before picking a leader: is this code an open match, and who is
  // the host playing? Lets the picker apply the same-party rule up front.
  function peekMatch(code) {
    return ensureFirebase().then(function () { return matchRef(code).once('value'); }).then(function (snap) {
      var m = snap.val();
      if (!m || m.guestUid) throw new Error('No open match with that code');
      return { hostPol: m.hostPol, hostName: m.hostName, phaseSeconds: m.phaseSeconds, totalPhases: m.totalPhases };
    });
  }

  // Guest: claim the empty guest seat. Fails cleanly if the code is wrong or
  // someone already joined. Only the guestUid child is raced over (the
  // security rules don't allow rewriting the whole match node).
  function joinMatch(code, polId, name) {
    var ref;
    return ensureFirebase().then(function () {
      ref = matchRef(code);
      return ref.once('value');
    }).then(function (snap) {
      var m = snap.val();
      if (!m || m.guestUid) throw new Error('No open match with that code');
      return ref.child('guestUid').transaction(function (cur) { return cur === null ? fb.uid : undefined; });
    }).then(function (res) {
      if (!res.committed) throw new Error('No open match with that code');
      return ref.update(name ? { guestPol: polId, guestName: name } : { guestPol: polId });
    }).then(function () { return ref.once('value'); })
      .then(function (snap) { return snap.val(); });
  }

  // cb(matchRecord) on every change; returns an unsubscribe function.
  function watchMatch(code, cb) {
    var ref = matchRef(code);
    var handler = ref.on('value', function (snap) { cb(snap.val()); });
    return function () { ref.off('value', handler); };
  }

  function publishPop0(code, pop0) {
    return matchRef(code).update({ pop0: pop0, status: 'active' });
  }

  // Sends one action. Returns its key (known immediately, so the sender can
  // slot its own tap into the ordered list without waiting for the server).
  function pushEntry(code, side, fn, args, phase) {
    var ref = matchRef(code).child('actions').push();
    ref.set({ s: side, f: fn, a: JSON.stringify(args || []), p: phase == null ? null : phase });
    return ref.key;
  }

  // cb(entry) for every action ever sent on this match, in key order — the
  // sender's own included, so a reconnect can catch up.
  function watchEntries(code, cb) {
    var ref = matchRef(code).child('actions');
    var handler = ref.on('child_added', function (snap) {
      var v = snap.val() || {};
      if (ALLOWED_FNS.indexOf(v.f) === -1 || (v.s !== 'h' && v.s !== 'g')) return;
      var args = [];
      try { args = JSON.parse(v.a || '[]'); } catch (e) { return; }
      if (!Array.isArray(args)) return;
      cb({ key: snap.key, side: v.s, fn: v.f, args: args, phase: v.p });
    });
    return function () { ref.off('child_added', handler); };
  }

  // Rematch handshake, written on the FINISHED match's record. Each side sets
  // its own flag (rmH / rmG); once both are set the host picks a leader, makes
  // a brand-new match and posts its code as nextCode for the guest to follow.
  function requestRematch(code, side) { return matchRef(code).child(side === 'h' ? 'rmH' : 'rmG').set(true); }
  function leaveMatch(code, side) { return matchRef(code).child('left').set(side); }
  function announceNext(oldCode, newCode) { return matchRef(oldCode).child('nextCode').set(newCode); }

  function myUid() { return fb ? fb.uid : null; }

  root.PMENet = {
    mirrorPop: mirrorPop, copyPop: copyPop, createApplier: createApplier,
    normalizeCode: normalizeCode, ALLOWED_FNS: ALLOWED_FNS,
    ensureFirebase: ensureFirebase, createMatch: createMatch, joinMatch: joinMatch, peekMatch: peekMatch,
    watchMatch: watchMatch, publishPop0: publishPop0, pushEntry: pushEntry,
    watchEntries: watchEntries, myUid: myUid,
    requestRematch: requestRematch, leaveMatch: leaveMatch, announceNext: announceNext
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = root.PMENet;
})(typeof window !== 'undefined' ? window : globalThis);
