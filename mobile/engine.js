// PME Mobile — Game Engine
// Pure game-logic implementation of design/economy-status-map.md. No DOM
// access anywhere in this file — mobile/main.js is the only thing that
// touches the page. Loaded as a plain <script> (matches the rest of this
// project's convention, see js/*.js) but also usable from Node for the
// self-check at the bottom of this file (`node mobile/engine.js`).
(function (root) {
  'use strict';

  var BPS = 10000; // basis points = 100%, see design doc "Keeping the numbers exact"

  // ---------------------------------------------------------------------
  // Redistribution engine — design doc section #pot, "the one mechanic
  // every lever routes through."
  // ---------------------------------------------------------------------

  function otherPlayer(actor) { return actor === 'p1' ? 'p2' : 'p1'; }

  // Positive boost. source picks who gives it up: 'both' (opponent+others,
  // proportional — the default, used by nearly everything), 'others' (only
  // the undecided middle, e.g. Bachchan's Celebrity Endorsement), 'opponent'
  // (only the rival's share, e.g. Indira Gandhi's National Emergency).
  function gainAt(pop, actor, boostBps, source) {
    source = source || 'both';
    var opp = otherPlayer(actor);
    var self = pop[actor];
    var gain = Math.max(0, Math.min(boostBps, BPS - self));
    if (gain <= 0) return 0;
    if (source === 'both') {
      var oppBps = pop[opp], othBps = pop.others, denom = oppBps + othBps;
      var oppCut = 0, othCut = 0;
      if (denom > 0) {
        oppCut = Math.round(gain * oppBps / denom); // round one side...
        othCut = gain - oppCut;                      // ...derive the other. Never round both.
      }
      pop[opp] -= oppCut;
      pop.others -= othCut;
    } else if (source === 'others') {
      gain = Math.min(gain, pop.others);
      pop.others -= gain;
    } else if (source === 'opponent') {
      gain = Math.min(gain, pop[opp]);
      pop[opp] -= gain;
    }
    pop[actor] += gain;
    return gain;
  }

  // Negative boost — mirrors gainAt's 'both' path exactly, direction reversed.
  function loseAt(pop, actor, lossBps) {
    var opp = otherPlayer(actor);
    var self = pop[actor];
    var loss = Math.max(0, Math.min(lossBps, self));
    if (loss <= 0) return 0;
    var oppBps = pop[opp], othBps = pop.others, denom = oppBps + othBps;
    var oppGain = 0, othGain = 0;
    if (denom > 0) {
      oppGain = Math.round(loss * oppBps / denom);
      othGain = loss - oppGain;
    }
    pop[actor] -= loss;
    pop[opp] += oppGain;
    pop.others += othGain;
    return loss;
  }

  // Single entry point for any signed effect (positive = gain path, negative
  // = loss path, zero = no-op). This is also the "net first, apply once"
  // rule's landing point for agendas: callers must sum a state's tags into
  // one net value BEFORE calling this, never call it once per tag.
  function applySigned(pop, actor, deltaBps, source) {
    if (deltaBps > 0) return gainAt(pop, actor, deltaBps, source);
    if (deltaBps < 0) return -loseAt(pop, actor, -deltaBps);
    return 0;
  }

  // Both players' one-shot "big" levers (Nationwide Rally, Special Powerup)
  // landing on the same state in the same phase can jointly overdraw the
  // undecided middle. Resolved by scaling both requests down to fit exactly
  // — see design doc "When both players act on the same state at once."
  // preSnapshot: {p1,p2,others} as they stood at the START of this phase.
  function resolveSimultaneousGain(preSnapshot, p1GainRaw, p2GainRaw) {
    function unrounded(actor, gainRaw) {
      var opp = otherPlayer(actor);
      var self = preSnapshot[actor];
      var gain = Math.max(0, Math.min(gainRaw, BPS - self));
      var oppBps = preSnapshot[opp], othBps = preSnapshot.others, denom = oppBps + othBps;
      var oppCutRaw = denom > 0 ? gain * oppBps / denom : 0;
      var othCutRaw = gain - oppCutRaw;
      return { oppCutRaw: oppCutRaw, othCutRaw: othCutRaw };
    }
    var c1 = unrounded('p1', p1GainRaw), c2 = unrounded('p2', p2GainRaw);
    var othersDemand = c1.othCutRaw + c2.othCutRaw;
    var scale = 1;
    if (othersDemand > preSnapshot.others && othersDemand > 0) {
      scale = preSnapshot.others / othersDemand;
    }
    function finalGain(c) { return c.oppCutRaw + c.othCutRaw * scale; }
    var g1raw = finalGain(c1), g2raw = finalGain(c2);
    var g1 = Math.round(g1raw), g2 = Math.round(g2raw);
    // split each player's rounded final gain into its opponent-facing/
    // others-facing components, same round-one-derive-other rule as above
    function split(c, gain, gainRaw) {
      var oppShare = gainRaw > 0 ? Math.round(gain * c.oppCutRaw / gainRaw) : 0;
      oppShare = Math.min(oppShare, gain);
      return { oppShare: oppShare, othShare: gain - oppShare };
    }
    var s1 = split(c1, g1, g1raw), s2 = split(c2, g2, g2raw);
    return {
      p1: preSnapshot.p1 + g1 - s2.oppShare,
      p2: preSnapshot.p2 + g2 - s1.oppShare,
      others: preSnapshot.others - s1.othShare - s2.othShare
    };
  }

  // ---------------------------------------------------------------------
  // Seat apportionment — largest-remainder / Hamilton's method, decided
  // 2026-07-23, replaces plain round() to guarantee p1+p2+others == seats.
  // ---------------------------------------------------------------------
  function apportionSeats(seats, shares) {
    var keys = ['p1', 'p2', 'others'];
    var order = { p1: 0, p2: 1, others: 2 };
    var quotas = {}, floors = {}, used = 0;
    keys.forEach(function (k) {
      quotas[k] = shares[k] * seats / BPS;
      floors[k] = Math.floor(quotas[k]);
      used += floors[k];
    });
    var leftover = seats - used;
    var remainders = keys.map(function (k) {
      return { k: k, r: quotas[k] - floors[k], bps: shares[k] };
    });
    remainders.sort(function (a, b) {
      return (b.r - a.r) || (b.bps - a.bps) || (order[a.k] - order[b.k]);
    });
    var result = { p1: floors.p1, p2: floors.p2, others: floors.others };
    for (var i = 0; i < leftover; i++) result[remainders[i].k]++;
    return result;
  }

  function nationalSeats(states, pop) {
    var total = { p1: 0, p2: 0, others: 0 };
    states.forEach(function (s) {
      var seats = apportionSeats(s.seats, pop[s.svgId]);
      total.p1 += seats.p1; total.p2 += seats.p2; total.others += seats.others;
    });
    return total;
  }

  // ---------------------------------------------------------------------
  // Starting position generator — design doc "Starting position," 3 steps.
  // rng: a () => [0,1) function, injectable for deterministic tests.
  // ---------------------------------------------------------------------
  function randInt(rng, lo, hi) { return Math.floor(lo + rng() * (hi - lo + 1)); }

  function generateStartingPosition(states, p1HomeStateName, p2HomeStateName, rng) {
    rng = rng || Math.random;
    var pop = {};
    states.forEach(function (s) {
      var p1 = randInt(rng, 500, 2900), p2 = randInt(rng, 500, 2900);
      pop[s.svgId] = { p1: p1, p2: p2, others: BPS - p1 - p2 };
    });
    var byName = {};
    states.forEach(function (s) { byName[s.name] = s; });
    var p1Home = byName[p1HomeStateName], p2Home = byName[p2HomeStateName];

    if (p1Home && p2Home && p1Home.svgId !== p2Home.svgId) {
      var s1 = pop[p1Home.svgId];
      s1.p1 = Math.min(BPS, s1.p1 + 2500);
      s1.others = BPS - s1.p1 - s1.p2;
      var s2 = pop[p2Home.svgId];
      s2.p2 = Math.min(BPS, s2.p2 + 2500);
      s2.others = BPS - s2.p1 - s2.p2;
    }

    var excluded = {};
    if (p1Home) excluded[p1Home.svgId] = true;
    if (p2Home) excluded[p2Home.svgId] = true;
    var pool = states.filter(function (s) { return !excluded[s.svgId]; }).slice();
    // Fisher-Yates shuffle
    for (var i = pool.length - 1; i > 0; i--) {
      var j = Math.floor(rng() * (i + 1));
      var tmp = pool[i]; pool[i] = pool[j]; pool[j] = tmp;
    }

    var turn = rng() < 0.5 ? 'p1' : 'p2';
    var seatCountWithAdvantage = { p1: 0, p2: 0 };
    var stillDrawing = { p1: true, p2: true };
    var guard = 0;
    while (pool.length > 0 && (stillDrawing.p1 || stillDrawing.p2) && guard++ < 10000) {
      if (!stillDrawing[turn]) { turn = otherPlayer(turn); continue; }
      var budget = 130 - seatCountWithAdvantage[turn];
      var idx = -1;
      for (var k = 0; k < pool.length; k++) { if (pool[k].seats <= budget) { idx = k; break; } }
      if (idx === -1) { stillDrawing[turn] = false; turn = otherPlayer(turn); continue; }
      var st = pool.splice(idx, 1)[0];
      var p = randInt(rng, 3500, 6500);
      pop[st.svgId][turn] = p;
      pop[st.svgId].others = BPS - pop[st.svgId].p1 - pop[st.svgId].p2;
      seatCountWithAdvantage[turn] += st.seats;
      if (seatCountWithAdvantage[turn] > 100) stillDrawing[turn] = false;
      turn = otherPlayer(turn);
    }
    return pop;
  }

  // ---------------------------------------------------------------------
  // Direct cash investment
  // ---------------------------------------------------------------------
  function investmentBoostBps(tapNumber, cfg) {
    if (tapNumber <= cfg.boostGlidePathTaps) {
      var span = cfg.boostGlidePathTaps - 1;
      return Math.round(cfg.boostStartBps - (tapNumber - 1) * (cfg.boostStartBps - cfg.boostFloorBps) / span);
    }
    return cfg.boostFloorBps;
  }
  function investmentCostCr(seats, cfg) { return seats * cfg.costPerSeatCr; }

  // ---------------------------------------------------------------------
  // Agenda commitment — net-first-apply-once, per-tap proration
  // ---------------------------------------------------------------------
  function netAgendaEffectBps(state, policyDef) {
    if (policyDef.nationwideBonus != null) return policyDef.nationwideBonus * 100;
    var net = 0;
    var tagEffects = policyDef.tagEffects || {};
    (state.tags || []).forEach(function (t) {
      if (tagEffects[t] != null) net += tagEffects[t];
    });
    return net * 100;
  }
  // Exact per-tap share via cumulative round-then-diff (same principle as
  // "round one side, derive the other," applied across the 4 taps instead
  // of across two shares) — guarantees the 4 taps sum to netBps exactly.
  function agendaTapDelta(netBps, tapsCompletedBefore, tapsToComplete) {
    var cumBefore = Math.round(netBps * tapsCompletedBefore / tapsToComplete);
    var cumAfter = Math.round(netBps * (tapsCompletedBefore + 1) / tapsToComplete);
    return cumAfter - cumBefore;
  }

  // ---------------------------------------------------------------------
  // Regional dominance
  // ---------------------------------------------------------------------
  function dominanceActive(group, states, pop, player, thresholdBps) {
    var members = states.filter(function (s) { return s.tags.indexOf(group.key) !== -1; });
    if (!members.length) return false;
    return members.every(function (s) { return pop[s.svgId][player] >= thresholdBps; });
  }
  function dominancePayoutCr(group, states, cfg) {
    var seats = states.filter(function (s) { return s.tags.indexOf(group.key) !== -1; })
      .reduce(function (a, s) { return a + s.seats; }, 0);
    return seats * cfg.payoutCrPerSeat;
  }

  root.PMEEngine = {
    BPS: BPS,
    otherPlayer: otherPlayer,
    gainAt: gainAt,
    loseAt: loseAt,
    applySigned: applySigned,
    resolveSimultaneousGain: resolveSimultaneousGain,
    apportionSeats: apportionSeats,
    nationalSeats: nationalSeats,
    generateStartingPosition: generateStartingPosition,
    investmentBoostBps: investmentBoostBps,
    investmentCostCr: investmentCostCr,
    netAgendaEffectBps: netAgendaEffectBps,
    agendaTapDelta: agendaTapDelta,
    dominanceActive: dominanceActive,
    dominancePayoutCr: dominancePayoutCr
  };
})(typeof window !== 'undefined' ? window : (typeof global !== 'undefined' ? global : this));

// -------------------------------------------------------------------------
// Self-check — `node mobile/engine.js`. Not a test framework, just asserts
// that fail loudly if the redistribution math ever stops adding up.
// -------------------------------------------------------------------------
if (typeof module !== 'undefined' && require.main === module) {
  var E = (typeof global !== 'undefined' ? global : this).PMEEngine;
  var assert = require('assert');

  // gainAt: worked example from the design doc (20/30/50, P1 taps +5%)
  (function () {
    var pop = { p1: 2000, p2: 3000, others: 5000 };
    var gain = E.gainAt(pop, 'p1', 500);
    assert.strictEqual(gain, 500);
    assert.strictEqual(pop.p1, 2500);
    assert.strictEqual(pop.p1 + pop.p2 + pop.others, 10000);
    assert.strictEqual(pop.p2, 2812); // 30% * (500*30/80=187.5->188 taken) = 3000-188=2812
    assert.strictEqual(pop.others, 4688);
  })();

  // cap at 100%: gain never pushes self past BPS
  (function () {
    var pop = { p1: 9800, p2: 100, others: 100 };
    var gain = E.gainAt(pop, 'p1', 500);
    assert.strictEqual(gain, 200);
    assert.strictEqual(pop.p1, 10000);
    assert.strictEqual(pop.p1 + pop.p2 + pop.others, 10000);
  })();

  // loseAt mirrors gainAt
  (function () {
    var pop = { p1: 2500, p2: 2812, others: 4688 };
    var loss = E.loseAt(pop, 'p1', 500);
    assert.strictEqual(loss, 500);
    assert.strictEqual(pop.p1, 2000);
    assert.strictEqual(pop.p1 + pop.p2 + pop.others, 10000);
  })();

  // simultaneous overdraw: design doc's 10/10/80 -> 50/50/0 worked example.
  // Both plays are "huge" (each alone would try to max the state to 100%,
  // i.e. request >= BPS-self) — that's what triggers the overdraw at all.
  (function () {
    var snap = { p1: 1000, p2: 1000, others: 8000 };
    var res = E.resolveSimultaneousGain(snap, 9000, 9000);
    assert.strictEqual(res.p1 + res.p2 + res.others, 10000);
    assert.strictEqual(res.p1, 5000);
    assert.strictEqual(res.p2, 5000);
    assert.strictEqual(res.others, 0);
  })();

  // apportionSeats: design doc's 3-seat 50/25/25 -> 1/1/1 worked example
  (function () {
    var res = E.apportionSeats(3, { p1: 5000, p2: 2500, others: 2500 });
    assert.strictEqual(res.p1, 1);
    assert.strictEqual(res.p2, 1);
    assert.strictEqual(res.others, 1);
    assert.strictEqual(res.p1 + res.p2 + res.others, 3);
  })();

  // apportionSeats always sums exactly to seats, across many random splits
  (function () {
    for (var i = 0; i < 2000; i++) {
      var a = Math.floor(Math.random() * 10001);
      var b = Math.floor(Math.random() * (10001 - a));
      var shares = { p1: a, p2: b, others: 10000 - a - b };
      var seats = 1 + Math.floor(Math.random() * 80);
      var res = E.apportionSeats(seats, shares);
      assert.strictEqual(res.p1 + res.p2 + res.others, seats);
      assert.ok(res.p1 >= 0 && res.p2 >= 0 && res.others >= 0);
    }
  })();

  // agendaTapDelta: 4 taps always sum exactly to netBps, incl. negative/odd values
  (function () {
    [1234, -777, 0, 4, -4, 9999, -9999].forEach(function (net) {
      var sum = 0;
      for (var t = 0; t < 4; t++) sum += E.agendaTapDelta(net, t, 4);
      assert.strictEqual(sum, net, 'net=' + net + ' summed=' + sum);
    });
  })();

  // generateStartingPosition: every state sums to 10000, home-state tie nulls both
  (function () {
    var states = [
      { svgId: 'A', name: 'Alpha', seats: 80 }, { svgId: 'B', name: 'Beta', seats: 40 },
      { svgId: 'C', name: 'Gamma', seats: 20 }, { svgId: 'D', name: 'Delta', seats: 10 },
      { svgId: 'E', name: 'Epsilon', seats: 5 }
    ];
    var pop = E.generateStartingPosition(states, 'Alpha', 'Alpha', Math.random);
    states.forEach(function (s) {
      var p = pop[s.svgId];
      assert.strictEqual(p.p1 + p.p2 + p.others, 10000);
      assert.ok(p.p1 >= 0 && p.p2 >= 0 && p.others >= 0);
    });
  })();

  console.log('mobile/engine.js self-check: all assertions passed.');
}
