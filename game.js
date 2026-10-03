// PME Mobile — Game state and player actions. The AI opponent that drives the
// p2 seat (and, in headless runs, either seat) lives in mobile/ai.js.
// Built on top of mobile/engine.js's pure redistribution/apportionment
// functions. This file owns the mutable `game` object and every player
// action; mobile/main.js only reads from `game` and calls these functions —
// it never touches game.pop or game.players directly.
(function (root) {
  'use strict';
  var E = root.PMEEngine || require('./engine.js');

  // Seeded PRNG (mulberry32) — a game created with mulberry32(seed) as its
  // rng draws an identical starting position + AI setup every time, which is
  // what lets a recorded action log (game.actionLog) replay to the exact
  // same outcome. Same impl as mobile/simulate.js / balance-sim.js.
  function mulberry32(a) {
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      var t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  // Small UTs/states no dedicated map interaction routes through directly —
  // mirrors the union-territories-container button cluster convention (see
  // CLAUDE.md) plus Delhi/Goa, which get their own quick-invest buttons.
  var SMALL_UT_IDS = ['INCH', 'INDH', 'INPY', 'INLD', 'INAN', 'INDL', 'INGA'];

  // The 5 of the above with no dedicated single-target button (Delhi/Goa do
  // have their own — #delhiBtn/#goaBtn — so those two stay individually
  // investable). The human can only ever invest in these 5 as a group via
  // the "Small UTs" quick-invest button (mirrors main.js's utsBtn handler);
  // the AI must be held to the same all-or-nothing constraint in aiStep
  // below, or it can cheaply snipe just one (e.g. Puducherry) to deny a
  // regional-dominance group for a fraction of what the human has to spend
  // to contest it back.
  var SMALL_UT_BATCH_IDS = SMALL_UT_IDS.filter(function (id) { return id !== 'INDL' && id !== 'INGA'; });

  // Northeast 8 quick-invest button (mirrors the SMALL_UT_IDS/ALL_UTS pattern) —
  // these states are individually tappable on the map, this is just a shortcut.
  var NORTHEAST_IDS = ['INNL', 'INMN', 'INMZ', 'INTR', 'INML', 'INSK', 'INAR', 'INAS'];

  var NON_GROUP_FIELDS = { State: true, LokSabhaSeats: true, SvgId: true, UnionTerritory: true };
  var GROUP_META = [
    { key: 'WesternBorder', icon: '🏔️', img: 'western-border.webp', label: 'Western Border' },
    { key: 'TribalLands', icon: '🌳', img: 'tribal-lands.webp', label: 'Tribal Lands' },
    { key: 'MinorityAreas', icon: '🕌', img: 'minority-areas.webp', label: 'Minority Areas' },
    { key: 'NationalParksWildlife', icon: '🐅', img: 'wildlife.webp', label: 'National Parks & Wildlife' },
    { key: 'SouthIndia', icon: '🌴', img: 'south-india.webp', label: 'South India' },
    { key: 'EasternBorder', icon: '🌄', img: 'eastern-border.webp', label: 'Eastern Border' },
    { key: 'TravelAndTourism', icon: '✈️', img: 'travel-tourism.webp', label: 'Travel & Tourism' },
    { key: 'Education', icon: '🎓', img: 'education.webp', label: 'Education' },
    { key: 'Manufacturing', icon: '⚙️', img: 'manufacturing.webp', label: 'Manufacturing' },
    { key: 'NaturalResources', icon: '⛏️', img: 'natural-resources.webp', label: 'Natural Resources' },
    { key: 'HindiHeartland', icon: '🕉️', img: 'hindi-heartland.webp', label: 'Hindi Heartland' },
    { key: 'IndustrialCorridor', icon: '🏭', img: 'industrial-corridor.webp', label: 'Industrial Corridor' },
    { key: 'Pilgrimage', icon: '🙏', img: 'pilgrimage.webp', label: 'Pilgrimage' },
    { key: 'CoastalIndia', icon: '🌊', img: 'coastal-india.webp', label: 'Coastal India' },
    { key: 'AgriculturalRegion', icon: '🌾', img: 'agricultural.webp', label: 'Agricultural Region' }
  ];

  function stripBOM(s) { return s.charCodeAt(0) === 0xFEFF ? s.slice(1) : s; }

  // A politician's home state(s) — most have one; a few (e.g. Kejriwal:
  // Delhi+Punjab) carry a second real-world stronghold.
  function homeStatesOf(politician) {
    return [politician.homeState].concat(politician.secondaryHomeStates || []);
  }

  // Deliberate exception to the instant-only rule for special powers (see
  // Modi's Demonetization) — a documented one-off, not a pattern to reuse
  // casually. Blocks every funds-spending action through the rest of the
  // activation phase plus the following phase (2 phases total), self-clearing
  // once game.phase moves past fundsFrozenUntilPhase — no separate cleanup
  // step, and no delayed "starts next phase" trigger for a single-phase
  // freeze (that pattern is explicitly banned, see
  // design/economy-status-map.md) — this is a genuine 2-phase duration, not
  // that banned off-by-one.
  function fundsFrozen(pl, game) { return game.phase <= pl.fundsFrozenUntilPhase; }

  // ---------------------------------------------------------------------
  // Data loading / normalization (browser: fetch; Node: fs, for tests)
  // ---------------------------------------------------------------------
  function normalizeGameData(rawStates, rawPolicyTags, rawPoliticians, rawConfig) {
    var states = rawStates.map(function (s) {
      return {
        name: s.State,
        seats: parseInt(s.LokSabhaSeats, 10),
        svgId: s.SvgId,
        tags: Object.keys(s).filter(function (k) { return !NON_GROUP_FIELDS[k] && s[k] === 'TRUE'; })
      };
    });
    var groups = GROUP_META.map(function (g) {
      return {
        key: g.key, icon: g.icon, img: g.img, label: g.label,
        seats: states.filter(function (s) { return s.tags.indexOf(g.key) !== -1; })
          .reduce(function (a, s) { return a + s.seats; }, 0)
      };
    });
    var policyTags = rawPolicyTags.policyTags || rawPolicyTags;
    var politicians = rawPoliticians.politicians || rawPoliticians;
    var cfg = rawConfig.mobileEconomy;
    return { states: states, groups: groups, policyTags: policyTags, politicians: politicians, cfg: cfg };
  }

  async function loadGameData(basePath) {
    basePath = basePath || 'data/';
    function getJSON(name) {
      return fetch(basePath + name).then(function (r) { return r.json(); });
    }
    var results = await Promise.all([
      getJSON('states_data.json'), getJSON('policy-tags.json'),
      getJSON('politicians-data.json'), getJSON('game-config.json')
    ]);
    return normalizeGameData(results[0], results[1], results[2], results[3]);
  }

  function loadGameDataSync(dir) {
    var fs = require('fs'), path = require('path');
    function get(name) { return JSON.parse(stripBOM(fs.readFileSync(path.join(dir, name), 'utf8'))); }
    return normalizeGameData(get('states_data.json'), get('policy-tags.json'), get('politicians-data.json'), get('game-config.json'));
  }

  // ---------------------------------------------------------------------
  // Game creation
  // ---------------------------------------------------------------------
  function makePlayer(politician, cfg, isAI, aiProfile) {
    return {
      politician: politician,
      isAI: !!isAI,
      aiProfile: aiProfile || null,
      fundsCr: cfg.startingFundsCr,
      tokenIncomeStopped: false,
      tokens: { stateRally: 0 },
      tokensSpentThisPhase: 0,
      tokensSpentTotal: 0,
      craftedSpecial: false, usedSpecial: false,
      craftedNationwide: false, usedNationwide: false,
      powerNullified: false,
      agendaProgress: {},
      agendaTokenBonusEarned: 0,
      seatsToWinOverride: null,
      investmentTaps: {},
      aiTargetGroup: null,
      aiAgendaTapsThisPhase: {}
    };
  }

  // The AI lives in mobile/ai.js. These three shims keep every existing call
  // site (main.js, balance-sim.js, the replay path) pointing at PMEGame, and
  // resolve PMEAI per call because in Node this file finishes loading first.
  function ai() { return root.PMEAI; }
  function setupAI(game, playerKey, rng, profileKey) { return ai().setupAI(game, playerKey, rng, profileKey); }
  function aiStep(game, playerKey) { return ai().aiStep(game, playerKey); }
  function runAIFull(game, playerKey) { return ai().runAIFull(game, playerKey); }

  // opts (optional, live-multiplayer only): startingPop replaces the drawn
  // starting position (the guest builds a role-swapped copy of the host's map),
  // human:true skips AI setup so both seats are people. Omitted = today's exact
  // single-player behaviour.
  function createGame(data, p1PoliticianId, p2PoliticianId, rng, opts) {
    opts = opts || {};
    rng = rng || Math.random;
    var p1Pol = data.politicians.filter(function (p) { return p.id === p1PoliticianId; })[0];
    var p2Pol = data.politicians.filter(function (p) { return p.id === p2PoliticianId; })[0];
    if (!p1Pol || !p2Pol) throw new Error('Unknown politician id');

    var pop = opts.startingPop || E.generateStartingPosition(data.states, homeStatesOf(p1Pol), homeStatesOf(p2Pol), rng);
    var statesById = {};
    data.states.forEach(function (s) { statesById[s.svgId] = s; });
    var policiesByName = data.policyTags;

    var game = {
      cfg: data.cfg,
      rng: rng,
      states: data.states,
      statesById: statesById,
      groups: data.groups,
      policiesByName: policiesByName,
      pop: pop,
      phase: 1,
      rallyPlaysByState: {},
      bigActionsThisPhase: [],
      phaseStartSnapshot: null,
      dominanceHeld: {},
      cleanSweepHeld: {},
      log: [],
      actionLog: [],
      winner: null,
      hungParliament: false,
      finalSeats: null,
      players: { p1: makePlayer(p1Pol, data.cfg, false), p2: makePlayer(p2Pol, data.cfg, false) }
    };
    if (!opts.human) setupAI(game, 'p2', rng);
    setupAllies(game, opts.allyIds);
    startPhase(game);
    return game;
  }

  // ticker: eligible for the "BREAKING" news marquee (main.js syncNewsFeed) —
  // only agenda completions, group dominance payouts, state rallies,
  // nationwide rallies, and special power use (Nehru's excepted — his
  // Non-Alignment power is secret by design). Everything else still lands
  // in game.log for the full history, just not surfaced in the ticker.
  // instant: also pop an immediate toast (main.js syncNewsFeed), not just the
  // scrolling ticker — for payouts (regional dominance, clean sweep) that have
  // no other UI feedback at the moment they land, unlike a rally/agenda/power
  // action which the player already sees toasted at the point of tapping it.
  // toastParts: optional [headline, amount] pair — the toast shows these as
  // two short back-to-back popups instead of one long one, since the combined
  // "You swept Uttar Pradesh 100% — +₹800Cr clean sweep bonus" line wraps to
  // two lines in a single toast (too tall for the space above the map).
  function pushLog(game, msg, ticker, instant, toastParts) {
    game.log.unshift({ phase: game.phase, msg: msg, ticker: !!ticker, instant: !!instant, toastParts: toastParts });
    if (game.log.length > 40) game.log.pop();
  }

  // Append one committed action to the replay log. Called from inside each
  // action function once success is guaranteed (past every {ok:false}
  // guard) — so it captures the human's taps AND the AI's, since aiStep()
  // routes through these same functions. args must be JSON-safe primitives.
  // A game whose createGame got a seeded rng can replay this list back to
  // an identical end state (see main.js startReplay).
  function recordAction(game, fn, playerKey, args) {
    if (game.actionLog) game.actionLog.push({ fn: fn, pk: playerKey || null, args: args || [] });
    if (recordHook) recordHook(game, fn, playerKey, args || []);
  }

  // Live multiplayer (main.js/net.js) subscribes here to ship each committed
  // action to the other phone. Module-level, never on the game object, so
  // structuredClone(game) in the AI pacing dry-run still works.
  var recordHook = null;
  function setRecordHook(fn) { recordHook = fn || null; }

  // ---------------------------------------------------------------------
  // Allies (design/allies-side-quests-spec.md)
  // An ally is a labelled slice of the undecided ("others") pool in its
  // footprint states — no new popularity bucket, so the engine is untouched.
  // The slice is derived, never stored: targetSeats' worth of the footprint's
  // *current* undecided (or all of it, if less is left), so a "35-seat" ally is
  // 35 seats whatever the random starting map. Later it shrinks only when the
  // footprint's undecided pool itself runs below the target.
  // others, so it erodes in lockstep with the undecided pool. It only turns
  // into seats at the end of the match, for an owner who didn't defect.
  // ---------------------------------------------------------------------

  // The 3-of-10 draw is seeded from the starting map's undecided shares, not
  // from game.rng: that adds no rng draws (existing seeded runs stay
  // identical), and a friend-match guest's mirrored map swaps only p1/p2, so
  // both phones derive the same draw with nothing extra to transmit.
  function allyDrawSeed(game) {
    var h = 2166136261;
    game.states.forEach(function (s) { h = Math.imul(h ^ game.pop[s.svgId].others, 16777619) >>> 0; });
    return h;
  }

  function hashString(str, h) {
    for (var i = 0; i < str.length; i++) h = Math.imul(h ^ str.charCodeAt(i), 16777619) >>> 0;
    return h;
  }

  // Every ally has TWO ways in (dominate its group, or sweep its state to 100%;
  // either one earns it) and, per player, ONE agenda that makes it leave: drawn
  // from that player's own four, keyed on the politician (not p1/p2) so a
  // friend-match guest's mirrored game picks the same one.
  function setupAllies(game, forcedIds) {
    var acfg = game.cfg.allies;
    game.allies = [];
    if (!acfg) return;
    var list = acfg.list.slice();
    var chosen;
    var seed = allyDrawSeed(game);
    if (forcedIds) {
      chosen = forcedIds.map(function (id) { return list.filter(function (a) { return a.id === id; })[0]; });
    } else {
      var r = mulberry32(seed);
      for (var i = 0; i < acfg.drawCount; i++) {
        var j = i + Math.floor(r() * (list.length - i));
        var t = list[i]; list[i] = list[j]; list[j] = t;
      }
      chosen = list.slice(0, acfg.drawCount);
    }
    var idByName = {};
    game.states.forEach(function (s) { idByName[s.name] = s.svgId; });
    // Each player's four agendas are shuffled once (keyed on the politician, not
    // p1/p2, so a mirrored friend-match game matches); ally i takes the i-th, so
    // the three drawn allies always get three DIFFERENT leave agendas.
    var shuffled = {};
    ['p1', 'p2'].forEach(function (pk) {
      var pol = game.players[pk].politician;
      var names = pol.policies.map(function (p) { return p.name; });
      var rs = mulberry32(hashString(pol.id, seed));
      for (var k = names.length - 1; k > 0; k--) {
        var m = Math.floor(rs() * (k + 1)), tmp = names[k]; names[k] = names[m]; names[m] = tmp;
      }
      shuffled[pk] = names;
    });
    game.allies = chosen.map(function (a, idx) {
      var leave = { p1: shuffled.p1[idx % 4], p2: shuffled.p2[idx % 4] };
      return {
        id: a.id, alias: a.alias, groupKey: a.groupKey, sweepSvgId: idByName[a.sweepState],
        targetSeats: a.targetSeats, leaveAgenda: leave,
        footprintSvgIds: a.footprint.map(function (n) { return idByName[n]; }),
        owner: null, defectedBy: null, offered: { p1: false, p2: false }, offeredVia: { p1: null, p2: null }, bonusBps: {}
      };
    });
  }

  function allyById(game, id) {
    return game.allies.filter(function (a) { return a.id === id; })[0] || null;
  }

  function allyRoutes(game, a, pk) {
    var group = game.groups.filter(function (g) { return g.key === a.groupKey; })[0];
    return {
      group: E.dominanceActive(group, game.states, game.pop, pk, game.cfg.regionalDominance.thresholdBps),
      sweep: game.pop[a.sweepSvgId][pk] === E.BPS
    };
  }

  // Locked for good: this player already completed the agenda that would make
  // the ally leave (agendas never un-complete). Covers both "maxed it before
  // joining" and "joined, then maxed it" (the ally left).
  function allyLocked(game, a, pk) {
    return (game.players[pk].agendaProgress[a.leaveAgenda[pk]] || 0) >= game.cfg.agenda.tapsToComplete;
  }

  // The offer is sticky (`offered`): once a player has met the join condition
  // the ally stays acceptable even if the opponent snipes the state, until
  // someone claims it. Nobody owns it, nothing is locked, no queue.
  function applyAllyRoutes(game) {
    game.allies.forEach(function (a) {
      if (a.owner) return;
      ['p1', 'p2'].forEach(function (pk) {
        if (a.offered[pk] || allyLocked(game, a, pk)) return;
        var via = allyRoutes(game, a, pk);
        // remember which route earned it: the offer never lapses, so the card must not recompute it live
        if (via.group || via.sweep) { a.offered[pk] = true; a.offeredVia[pk] = via; }
      });
    });
  }

  function allyCanAccept(game, a, pk) {
    return !a.owner && a.offered[pk] && !allyLocked(game, a, pk);
  }

  // The owner completing their leave agenda makes the ally leave (its seats
  // return to undecided). It never joins the opponent, but it is up for grabs
  // again: the opponent's sticky offer is re-checked live from scratch.
  function allyTrigger(game, playerKey, agendaName) {
    game.allies.forEach(function (a) {
      if (a.owner !== playerKey || a.leaveAgenda[playerKey] !== agendaName) return;
      a.owner = null;
      a.bonusBps = {};
      a.defectedBy = playerKey;
      var other = playerKey === 'p1' ? 'p2' : 'p1';
      a.offered[other] = false; a.offeredVia[other] = null;
    });
  }

  // First to accept wins the ally; the other side's offer silently vanishes.
  function acceptAlly(game, playerKey, allyId) {
    var a = allyById(game, allyId);
    if (!a || !allyCanAccept(game, a, playerKey)) return { ok: false, reason: 'no_offer' };
    recordAction(game, 'acceptAlly', playerKey, [allyId]);
    a.owner = playerKey;
    return { ok: true, allyId: a.id };
  }

  // pop with every stable owned ally's slice moved from others into its
  // owner's bucket. Allies are applied in draw order, each taking its share
  // of what is still undecided, so overlapping footprints can never push
  // others below zero — and the per-state p1+p2+others==BPS invariant holds,
  // so total seats stay 543 and both sides can't both cross 272 on allies.
  // Per footprint state, what the ally holds, split by where it came from:
  //  - its base slice, from the undecided only (targetSeats' worth, as above)
  //  - its accumulated lift (a.bonusBps[state], +2% a phase while allied),
  //    drawn proportionally from EVERYONE left in the state: p1, p2 (the owner
  //    included) and the undecided, so it never runs dry with the undecided
  //    pool. Integer bps, remainder to the bucket with the most left.
  function allyTakes(game, a, pop) {
    var und = 0;
    a.footprintSvgIds.forEach(function (id) { und += pop[id].others * game.statesById[id].seats / E.BPS; });
    var f = und > a.targetSeats ? a.targetSeats / und : 1;
    return a.footprintSvgIds.map(function (id) {
      var base = Math.floor(f * pop[id].others);
      var left = { p1: pop[id].p1, p2: pop[id].p2, others: pop[id].others - base };
      var pool = left.p1 + left.p2 + left.others;
      var claim = Math.min(a.bonusBps[id] || 0, pool), take = { p1: 0, p2: 0, others: 0 };
      if (claim > 0) {
        var rem = claim, best = 'others';
        ['p1', 'p2', 'others'].forEach(function (k) {
          take[k] = Math.floor(claim * left[k] / pool); rem -= take[k];
          if (left[k] - take[k] > left[best] - take[best]) best = k;
        });
        take[best] += rem;
      }
      take.others += base;
      take.total = take.p1 + take.p2 + take.others;
      return take;
    });
  }

  function allyEffectivePop(game, after) {
    var eff = deepCopyPop(game.pop);
    game.allies.forEach(function (a) {
      if (!a.owner) return;
      var takes = allyTakes(game, a, eff);
      a.footprintSvgIds.forEach(function (id, i) {
        eff[id].p1 -= takes[i].p1; eff[id].p2 -= takes[i].p2; eff[id].others -= takes[i].others;
        eff[id][a.owner] += takes[i].total;
      });
      if (after) after(a, eff, takes);
    });
    return eff;
  }

  // Each held, stable ally's popularity (bps) in every state of its footprint,
  // in draw order: { allyId: { svgId: bps } }.
  function allyStateShares(game) {
    var out = {};
    allyEffectivePop(game, function (a, eff, takes) {
      out[a.id] = {};
      a.footprintSvgIds.forEach(function (id, i) { out[a.id][id] = takes[i].total; });
    });
    return out;
  }

  // Seats each held, stable ally adds to its owner, in draw order (so
  // overlapping footprints are attributed consistently and sum to the total).
  function allySeatsByAlly(game) {
    var out = {}, prev = E.nationalSeats(game.states, game.pop);
    allyEffectivePop(game, function (a, eff) {
      var cur = E.nationalSeats(game.states, eff);
      out[a.id] = cur[a.owner] - prev[a.owner];
      prev = cur;
    });
    return out;
  }

  // Seats an ally would add to its owner right now (live: shrinks as the
  // footprint's undecided pool erodes). Used for the card and the offer.
  function allySliceSeats(game, a) {
    var eff = deepCopyPop(game.pop);
    var takes = allyTakes(game, a, eff);
    a.footprintSvgIds.forEach(function (id, i) {
      eff[id].p1 += takes[i].total; eff[id].others -= takes[i].others;
    });
    return E.nationalSeats(game.states, eff).p1 - E.nationalSeats(game.states, game.pop).p1;
  }

  function nationalSeatsWithAllies(game) {
    return E.nationalSeats(game.states, allyEffectivePop(game));
  }

  // ---------------------------------------------------------------------
  // Phase lifecycle
  // ---------------------------------------------------------------------
  function deepCopyPop(pop) {
    var out = {};
    Object.keys(pop).forEach(function (k) { out[k] = { p1: pop[k].p1, p2: pop[k].p2, others: pop[k].others }; });
    return out;
  }

  // Instant, event-based payout — decided 2026-07-24: pays the moment every
  // member state first crosses the threshold (not deferred to the next
  // phase boundary), and pays again each time it's lost and regained.
  // game.dominanceHeld tracks the last-seen qualified/not state per
  // (group, player) so a call here while nothing changed is a no-op instead
  // of re-paying for a dominance the player already collected.
  function applyRegionalDominancePayouts(game) {
    game.groups.forEach(function (g) {
      ['p1', 'p2'].forEach(function (pk) {
        var key = g.key + '|' + pk;
        var active = E.dominanceActive(g, game.states, game.pop, pk, game.cfg.regionalDominance.thresholdBps);
        if (active && !game.dominanceHeld[key]) {
          var payout = E.dominancePayoutCr(g, game.states, game.cfg.regionalDominance);
          game.players[pk].fundsCr += payout;
          var domWho = pk === 'p1' ? 'You' : 'Opponent';
          pushLog(game, '💰 ' + domWho + ' hold ' + g.label + ' — +₹' + payout + 'Cr regional dominance', true, true,
            ['💰 ' + domWho + ' hold ' + g.label, '+₹' + payout + 'Cr regional dominance']);
        }
        game.dominanceHeld[key] = active;
      });
    });
  }

  // Same instant/held/re-payable shape as regional dominance above, scoped
  // to a single state instead of a whole group: pays the moment a player's
  // share of one state hits a literal 100% (opponent + Others both at 0),
  // again if a seize/steal power knocks them off it and they re-sweep it.
  function applyCleanSweepPayouts(game) {
    game.states.forEach(function (s) {
      ['p1', 'p2'].forEach(function (pk) {
        var key = s.svgId + '|' + pk;
        var active = game.pop[s.svgId][pk] === E.BPS;
        if (active && !game.cleanSweepHeld[key]) {
          var payout = s.seats * game.cfg.cleanSweep.payoutCrPerSeat;
          game.players[pk].fundsCr += payout;
          var sweepWho = pk === 'p1' ? 'You' : 'Opponent';
          pushLog(game, '🎯 ' + sweepWho + ' swept ' + s.name + ' 100% — +₹' + payout + 'Cr clean sweep bonus', true, true,
            ['🎯 ' + sweepWho + ' swept ' + s.name, '+₹' + payout + 'Cr clean sweep bonus']);
        }
        game.cleanSweepHeld[key] = active;
      });
    });
  }

  function applyPayouts(game) {
    applyRegionalDominancePayouts(game);
    applyCleanSweepPayouts(game);
    applyAllyRoutes(game);
  }

  // A held ally resists erosion: every phase it claims another 1% popularity
  // in each state of its footprint, drawn from everyone there (see allyTakes).
  // Only while allied; a defection resets it.
  function applyAllyGrowth(game) {
    game.allies.forEach(function (a) {
      if (!a.owner) return;
      a.footprintSvgIds.forEach(function (id) {
        a.bonusBps[id] = Math.min(E.BPS, (a.bonusBps[id] || 0) + game.cfg.allies.growthPerPhaseBps);
      });
    });
  }

  // Smaller, flat bonus paid at the START of every phase a group is still
  // held from before — thematically "sustained popularity draws ongoing
  // fundraising," distinct from the one-time instant-crossing bonus above.
  // No held/transition tracking like applyRegionalDominancePayouts — this
  // is meant to repeat every phase it's still true, not fire once. Only
  // called from startPhase() (a per-phase-boundary check), never from the
  // shared applyPayouts() wrapper other actions call mid-phase.
  function applyGroupHoldingBonus(game) {
    game.groups.forEach(function (g) {
      ['p1', 'p2'].forEach(function (pk) {
        var active = E.dominanceActive(g, game.states, game.pop, pk, game.cfg.regionalDominance.thresholdBps);
        if (!active) return;
        var payout = E.dominanceHoldingPayoutCr(g, game.states, game.cfg.regionalDominance);
        if (payout <= 0) return;
        game.players[pk].fundsCr += payout;
        var who = pk === 'p1' ? 'You' : 'Opponent';
        pushLog(game, '💰 ' + who + ' continue to hold ' + g.label + ' — +₹' + payout + 'Cr fundraising bonus', true, true,
          ['💰 ' + who + ' hold ' + g.label, '+₹' + payout + 'Cr fundraising bonus']);
      });
    });
  }

  function startPhase(game) {
    game.phaseStartSnapshot = deepCopyPop(game.pop);
    game.bigActionsThisPhase = [];
    ['p1', 'p2'].forEach(function (pk) {
      var pl = game.players[pk];
      pl.fundsCr += game.cfg.fundsRefreshPerPhaseCr;
      if (!pl.tokenIncomeStopped) pl.tokens.stateRally += game.cfg.rally.tokenIncomePerPhase;
      pl.tokensSpentThisPhase = 0;
      if (pl.isAI) { pl.aiAgendaTapsThisPhase = {}; }
    });
    applyAllyGrowth(game);
    applyPayouts(game);
    applyGroupHoldingBonus(game);
    // AI no longer auto-resolves its whole turn here — it acts one move at a
    // time via aiStep(), paced by the caller (main.js throttles to ~20/min;
    // runAIFull() fast-forwards it for Node tests/simulation).
  }

  function endPhase(game) {
    if (game.winner) return game;
    recordAction(game, 'endPhase', null, []);
    if (game.phase >= game.cfg.totalPhases) { finalizeGame(game); return game; }
    game.phase += 1;
    startPhase(game);
    return game;
  }

  function finalizeGame(game) {
    var seats = nationalSeatsWithAllies(game);
    game.finalSeats = seats;
    var p1Threshold = game.players.p1.seatsToWinOverride || game.cfg.seatsToWin;
    var p2Threshold = game.players.p2.seatsToWinOverride || game.cfg.seatsToWin;
    var p1Wins = seats.p1 >= p1Threshold, p2Wins = seats.p2 >= p2Threshold;
    if (p1Wins && p2Wins) {
      // Only Rao's lowered target can let both sides qualify (250 + 272 <= 543);
      // the player who lowered theirs wins, not whoever happens to be p1.
      var p1Lowered = !!game.players.p1.seatsToWinOverride, p2Lowered = !!game.players.p2.seatsToWinOverride;
      game.winner = (p1Lowered === p2Lowered) ? (seats.p1 >= seats.p2 ? 'p1' : 'p2') : (p1Lowered ? 'p1' : 'p2');
    }
    else if (p1Wins) { game.winner = 'p1'; }
    else if (p2Wins) { game.winner = 'p2'; }
    else {
      // Hung parliament is always a draw — revised 2026-07-28, superseding
      // ADR-0006's "loss vs the AI fallback". With the roster now tuned to
      // be harder to win outright (hung parliament rate 48-98% per
      // mobile/balance-sim.js), defaulting every undecided match to an AI
      // win would make a draw the de facto normal outcome disguised as a
      // loss. Neither side reaching a majority is genuinely a draw,
      // regardless of who the opponent is.
      game.hungParliament = true;
      game.winner = 'draw';
    }
    var s = computeScore(game, 'p1');
    game.score = s.score;
    game.scoreBreakdown = s.breakdown;
  }

  // Composite end-of-game score for one player — a pure function of final
  // game state, so the identical number is reproducible from a replayed
  // action log (and, later, server-side from {seed, actionLog}). Weights
  // live in game-config.json's mobileEconomy.scoring; first-pass values.
  // Only additive/non-negative components for now — efficiency/penalty
  // terms can come later once there's real playtest feedback.
  function computeScore(game, playerKey) {
    playerKey = playerKey || 'p1';
    var opp = E.otherPlayer(playerKey);
    var sc = game.cfg.scoring || {};
    var seats = game.finalSeats || E.nationalSeats(game.states, game.pop);
    var margin = seats[playerKey] - seats[opp];
    var pl = game.players[playerKey];

    var threshold = game.cfg.regionalDominance.thresholdBps;
    var groups = game.groups.filter(function (g) {
      return E.dominanceActive(g, game.states, game.pop, playerKey, threshold);
    }).length;
    var agendas = Object.keys(pl.agendaProgress).filter(function (k) {
      return pl.agendaProgress[k] >= game.cfg.agenda.tapsToComplete;
    }).length;
    var sweeps = game.states.filter(function (st) { return game.pop[st.svgId][playerKey] === E.BPS; }).length;

    var outcome = game.winner === playerKey ? (sc.winBonus || 0)
      : game.winner === 'draw' ? (sc.drawBonus || 0) : 0;

    var breakdown = {
      seats: seats[playerKey] * (sc.seatWeight != null ? sc.seatWeight : 1),
      margin: Math.max(0, margin) * (sc.marginWeight || 0),
      outcome: outcome,
      groups: groups * (sc.groupWeight || 0),
      agendas: agendas * (sc.agendaWeight || 0),
      cleanSweeps: sweeps * (sc.cleanSweepWeight || 0)
    };
    var total = 0;
    Object.keys(breakdown).forEach(function (k) { total += breakdown[k]; });
    return { score: Math.round(total), breakdown: breakdown };
  }

  // ---------------------------------------------------------------------
  // Collision-aware application for the two "big" one-shot levers
  // ---------------------------------------------------------------------
  function applyBigAction(game, actorKey, svgId, gainBps) {
    var opp = E.otherPlayer(actorKey);
    var list = game.bigActionsThisPhase;
    var found = null;
    for (var i = 0; i < list.length; i++) {
      if (list[i].player === opp && list[i].svgId === svgId && !list[i].consumed) { found = list[i]; break; }
    }
    if (found) {
      var pre = game.phaseStartSnapshot[svgId];
      var p1Gain = actorKey === 'p1' ? gainBps : found.gainBps;
      var p2Gain = actorKey === 'p2' ? gainBps : found.gainBps;
      var resolved = E.resolveSimultaneousGain(pre, p1Gain, p2Gain);
      game.pop[svgId].p1 = resolved.p1; game.pop[svgId].p2 = resolved.p2; game.pop[svgId].others = resolved.others;
      found.consumed = true;
    } else {
      E.gainAt(game.pop[svgId], actorKey, gainBps, 'both');
      list.push({ player: actorKey, svgId: svgId, gainBps: gainBps, consumed: false });
    }
  }

  // ---------------------------------------------------------------------
  // Player actions
  // ---------------------------------------------------------------------
  function investCash(game, playerKey, svgId) {
    var pl = game.players[playerKey];
    if (fundsFrozen(pl, game)) return { ok: false, reason: 'funds_frozen' };
    var cost = E.investmentCostCr(game.statesById[svgId].seats, game.cfg.investment);
    if (pl.fundsCr < cost) return { ok: false, reason: 'insufficient_funds' };
    recordAction(game, 'investCash', playerKey, [svgId]);
    var tapNum = (pl.investmentTaps[svgId] || 0) + 1;
    pl.fundsCr -= cost;
    pl.investmentTaps[svgId] = tapNum;
    var boost = E.investmentBoostBps(tapNum, game.cfg.investment);
    var gained = E.gainAt(game.pop[svgId], playerKey, boost, 'both');
    applyPayouts(game);
    return { ok: true, gained: gained, cost: cost };
  }

  // rallyPlaysByState[svgId] is an array of the playerKeys that deployed a
  // rally token there (in order), not just a count — main.js reads it to
  // draw a colored marker per token so players can see whose it is, not
  // just that the state is capped out.
  function playRallyToken(game, playerKey, svgId) {
    var pl = game.players[playerKey];
    if (pl.tokens.stateRally <= 0) return { ok: false, reason: 'no_tokens' };
    if (pl.tokensSpentThisPhase >= game.cfg.rally.maxTokenSpendPerPhase) return { ok: false, reason: 'spend_cap' };
    var plays = game.rallyPlaysByState[svgId] || [];
    if (plays.length >= game.cfg.rally.maxPlaysPerStateShared) return { ok: false, reason: 'state_cap' };
    recordAction(game, 'playRallyToken', playerKey, [svgId]);
    pl.tokens.stateRally -= 1;
    pl.tokensSpentThisPhase += 1;
    pl.tokensSpentTotal += 1;
    game.rallyPlaysByState[svgId] = plays.concat([playerKey]);
    var gained = E.gainAt(game.pop[svgId], playerKey, game.cfg.rally.tokenBoostBps, 'both');
    pushLog(game, '📢 ' + who(game, playerKey) + ' held a State Rally in ' + game.statesById[svgId].name, true);
    applyPayouts(game);
    return { ok: true, gained: gained };
  }

  function who(game, playerKey) {
    return playerKey === 'p1' ? game.players.p1.politician.name : game.players.p2.politician.name;
  }

  function craftToken(game, playerKey, flavor) {
    var pl = game.players[playerKey];
    var craftedFlag = flavor === 'special' ? 'craftedSpecial' : 'craftedNationwide';
    var usedFlag = flavor === 'special' ? 'usedSpecial' : 'usedNationwide';
    // The Special Powerup is once per match. The Nationwide Rally is capped
    // only by the token budget: a match yields at most 28 tokens (2/phase x
    // 10, plus 8 from agendas), so after the standard special(6) +
    // nationwide(12) line nobody can reach a second 12 — except Rajiv, whose
    // Telecom Revolution refunds what he has already spent. A hard flag was
    // therefore redundant with the arithmetic, and it was what made his power
    // pay out into nothing.
    if (pl[craftedFlag]) return { ok: false, reason: 'already_done' };
    if (flavor === 'special' && pl[usedFlag]) return { ok: false, reason: 'already_done' };
    var cost = flavor === 'special' ? game.cfg.rally.specialPowerupCraftCost : game.cfg.rally.nationwideRallyCraftCost;
    var minPhase = flavor === 'special' ? game.cfg.rally.specialPowerupMinPhase : game.cfg.rally.nationwideRallyMinPhase;
    if (game.phase < minPhase) return { ok: false, reason: 'too_early' };
    if (pl.tokens.stateRally < cost) return { ok: false, reason: 'insufficient_tokens' };
    // A Special Powerup must not lock in its token cost before the politician's
    // own power could immediately fire — craft and activate unlock together,
    // not craft-then-wait on a phase/funds/agenda gate the token can't help
    // with. powerBlockedReason() is the same check activatePower uses, minus
    // the opts-dependent target-selection checks it doesn't need yet.
    if (flavor === 'special') {
      var powerBlocked = powerBlockedReason(game, playerKey);
      if (powerBlocked) return { ok: false, reason: powerBlocked };
    }
    recordAction(game, 'craftToken', playerKey, [flavor]);
    pl.tokens.stateRally -= cost;
    pl.tokensSpentTotal += cost;
    pl[craftedFlag] = true;
    pushLog(game, (flavor === 'special' ? '⭐ ' : '🇮🇳 ') + who(game, playerKey) +
      ' crafted ' + (flavor === 'special' ? 'a Special Powerup' : 'a Nationwide Rally') + ' — ready to activate');
    return { ok: true };
  }

  function activateNationwideRally(game, playerKey) {
    var pl = game.players[playerKey];
    if (!pl.craftedNationwide) return { ok: false, reason: 'not_ready' };
    // Also gated here, not just at craft: a charge seeded outside craftToken
    // (the old tutorial setup did exactly this) must still not fire early.
    if (game.phase < game.cfg.rally.nationwideRallyMinPhase) return { ok: false, reason: 'too_early' };
    recordAction(game, 'activateNationwideRally', playerKey, []);
    pl.craftedNationwide = false;
    pl.usedNationwide = true;
    var boost = game.cfg.rally.nationwideRallyBoostBps;
    if (pl.nationwideRallyBonusArmedPhase != null) {
      boost += pl.nationwideRallyBonusPerPhaseBps * Math.max(0, game.phase - pl.nationwideRallyBonusArmedPhase);
    }
    game.states.forEach(function (s) { applyBigAction(game, playerKey, s.svgId, boost); });
    pushLog(game, '🇮🇳 BREAKING: ' + who(game, playerKey) + ' launched a Nationwide Rally — every state feels it', true);
    applyPayouts(game);
    return { ok: true };
  }

  function tapAgenda(game, playerKey, policyName) {
    var pl = game.players[playerKey];
    var policy = game.policiesByName[policyName];
    if (!policy) return { ok: false, reason: 'unknown_policy' };
    var progress = pl.agendaProgress[policyName] || 0;
    if (progress >= game.cfg.agenda.tapsToComplete) return { ok: false, reason: 'already_maxed' };
    if (fundsFrozen(pl, game)) return { ok: false, reason: 'funds_frozen' };
    var cost = game.cfg.agenda.costPerTapCr;
    if (pl.fundsCr < cost) return { ok: false, reason: 'insufficient_funds' };
    recordAction(game, 'tapAgenda', playerKey, [policyName]);
    pl.fundsCr -= cost;
    game.states.forEach(function (s) {
      var net = E.netAgendaEffectBps(s, policy);
      if (net === 0) return;
      var delta = E.agendaTapDelta(net, progress, game.cfg.agenda.tapsToComplete);
      if (delta !== 0) E.applySigned(game.pop[s.svgId], playerKey, delta, 'both');
    });
    pl.agendaProgress[policyName] = progress + 1;
    var completed = pl.agendaProgress[policyName] >= game.cfg.agenda.tapsToComplete;
    if (completed) {
      allyTrigger(game, playerKey, policyName);
      var bonusSoFar = pl.agendaTokenBonusEarned;
      if (bonusSoFar < game.cfg.rally.agendaTokenBonusMax) {
        var grant = Math.min(game.cfg.rally.agendaTokenBonusPerCompletion, game.cfg.rally.agendaTokenBonusMax - bonusSoFar);
        pl.tokens.stateRally += grant;
        pl.agendaTokenBonusEarned = bonusSoFar + grant;
      }
      pushLog(game, '📜 BREAKING: ' + who(game, playerKey) + ' fully committed the ' + policyName + ' agenda', true);
    }
    applyPayouts(game);
    return { ok: true, completed: completed };
  }

  // Rough real-time seat-swing preview for the *next* tap of an agenda —
  // read-only, mirrors tapAgenda's own math (net-first-apply-once, per-tap
  // proration) against a scratch copy of each affected state's pop instead
  // of the live one. Seats, not raw bps, are what a player actually cares
  // about, and the two can diverge: a state you already dominate has little
  // headroom left to gain but full room to lose, so a naive bps sum
  // (totalNetEffect) can look positive while the real seat swing is
  // negative once apportionment and the ownership cap are applied.
  function previewAgendaTapSeatDelta(game, playerKey, policyName) {
    var pl = game.players[playerKey];
    var policy = game.policiesByName[policyName];
    if (!policy) return 0;
    var progress = pl.agendaProgress[policyName] || 0;
    if (progress >= game.cfg.agenda.tapsToComplete) return 0;
    var seatDelta = 0;
    game.states.forEach(function (s) {
      var net = E.netAgendaEffectBps(s, policy);
      if (net === 0) return;
      var tapDelta = E.agendaTapDelta(net, progress, game.cfg.agenda.tapsToComplete);
      if (tapDelta === 0) return;
      var before = game.pop[s.svgId];
      var seatsBefore = E.apportionSeats(s.seats, before)[playerKey];
      var after = { p1: before.p1, p2: before.p2, others: before.others };
      E.applySigned(after, playerKey, tapDelta, 'both');
      var seatsAfter = E.apportionSeats(s.seats, after)[playerKey];
      seatDelta += seatsAfter - seatsBefore;
    });
    return seatDelta;
  }

  // A policy's tagEffects region keys are exactly the 15 regional-dominance
  // groups' own keys (one-to-one, confirmed against states_data.json's
  // region columns) — so the magnitude a group-chip emoji reaction should
  // react to is just this static per-agenda table, not a simulated tap
  // outcome. Returns a shallow copy (or {} for an unknown/nationwide-only
  // policy). UI-only consumer (main.js's group-chip emoji reaction).
  function agendaGroupEffects(game, policyName) {
    var policy = game.policiesByName[policyName];
    return (policy && policy.tagEffects) ? Object.assign({}, policy.tagEffects) : {};
  }

  function totalNetEffect(game, policyName) {
    var policy = game.policiesByName[policyName];
    if (!policy) return 0;
    var total = 0;
    game.states.forEach(function (s) { total += E.netAgendaEffectBps(s, policy); });
    return total;
  }

  // ---------------------------------------------------------------------
  // Special powers interpreter
  // ---------------------------------------------------------------------
  function resolvePowerScope(game, playerKey, opp, effect, opts) {
    if (effect.scope === 'nationwide') return game.states.map(function (s) { return s.svgId; });
    if (effect.scope === 'home') {
      var hs = homeStatesOf(game.players[playerKey].politician);
      return game.states.filter(function (s) { return hs.indexOf(s.name) !== -1; }).map(function (s) { return s.svgId; });
    }
    if (effect.scope === 'opponentHome') {
      var hs2 = homeStatesOf(game.players[opp].politician);
      return game.states.filter(function (s) { return hs2.indexOf(s.name) !== -1; }).map(function (s) { return s.svgId; });
    }
    if (effect.scope === 'tags') {
      return game.states.filter(function (s) {
        return effect.tags.some(function (t) { return s.tags.indexOf(t) !== -1; });
      }).map(function (s) { return s.svgId; });
    }
    if (effect.scope === 'state') {
      return game.states.filter(function (s) { return s.name === effect.stateName; }).map(function (s) { return s.svgId; });
    }
    if (effect.scope === 'svgIds') return effect.ids.slice();
    if (effect.scope === 'targetState') return opts.targetStateSvgId ? [opts.targetStateSvgId] : [];
    return [];
  }

  function canActivatePower(game, playerKey) {
    var pl = game.players[playerKey];
    return pl.craftedSpecial && !pl.usedSpecial;
  }

  // Every timing/resource condition on a politician's power, as one reason
  // string (or null when it can fire right now). Deliberately excludes the
  // target-selection checks in activatePower, which need `opts` the caller
  // hasn't chosen yet — this answers "could the player press the button",
  // which is what the HUD needs to grey the slot out. Single source of truth:
  // activatePower calls this too, so the button and the engine cannot drift.
  function powerBlockedReason(game, playerKey) {
    var pl = game.players[playerKey], power = pl.politician.power;
    if (power.requiresMinPhase && game.phase < power.requiresMinPhase) return 'too_early';
    if (power.requiresMinFundsCr && pl.fundsCr < power.requiresMinFundsCr) return 'insufficient_funds';
    if (pl.fundsCr < powerFundsCost(power)) return 'insufficient_funds';
    if (powerFundsCost(power) > 0 && fundsFrozen(pl, game)) return 'funds_frozen';
    if (power.requiresCompletedAgenda) {
      var done = Object.keys(pl.agendaProgress).filter(function (k) {
        return pl.agendaProgress[k] >= game.cfg.agenda.tapsToComplete;
      });
      if (!done.length) return 'no_completed_agenda';
    }
    return null;
  }

  function powerFundsCost(power) {
    var total = 0;
    (power.costs || []).forEach(function (e) { if (e.kind === 'funds' && e.target === 'self') total += -e.amountCr; });
    return total;
  }

  function activatePower(game, playerKey, opts) {
    opts = opts || {};
    var pl = game.players[playerKey], opp = E.otherPlayer(playerKey), oppPl = game.players[opp];
    if (!canActivatePower(game, playerKey)) return { ok: false, reason: 'not_ready' };
    var power = pl.politician.power;
    if (power.requiresTargetState && !opts.targetStateSvgId) return { ok: false, reason: 'need_target' };
    if (power.requiresTargetState) {
      var constraint = (power.benefits[0] || {}).constraint;
      if (constraint === 'smallUT' && SMALL_UT_IDS.indexOf(opts.targetStateSvgId) === -1) {
        return { ok: false, reason: 'target_must_be_small_ut' };
      }
    }
    if (power.requiresCompletedAgenda) {
      var done = Object.keys(pl.agendaProgress).filter(function (k) { return pl.agendaProgress[k] >= game.cfg.agenda.tapsToComplete; });
      if (!done.length) return { ok: false, reason: 'no_completed_agenda' };
      if (!opts.targetAgendaName || done.indexOf(opts.targetAgendaName) === -1) return { ok: false, reason: 'bad_target_agenda' };
    }
    var blocked = powerBlockedReason(game, playerKey);
    if (blocked) return { ok: false, reason: blocked };

    recordAction(game, 'activatePower', playerKey, [{ targetStateSvgId: opts.targetStateSvgId || null, targetAgendaName: opts.targetAgendaName || null }]);
    pl.usedSpecial = true;
    if (pl.powerNullified) return { ok: true, nullified: true };

    function runEffect(e) {
      if (e.kind === 'funds') {
        var who = e.target === 'self' ? pl : oppPl;
        who.fundsCr = Math.max(0, who.fundsCr + e.amountCr);
      } else if (e.kind === 'freezeFunds') {
        var who4 = e.target === 'self' ? pl : oppPl;
        who4.fundsFrozenUntilPhase = game.phase + 1;
        pushLog(game, '🧊 ' + who4.politician.name +
          '\'s funds are frozen for the rest of this phase and all of the next — no investing, agenda taps, or funded powers');
      } else if (e.kind === 'stopTokenIncome') {
        // Self only — a permanent cost (not phase-limited like freezeFunds),
        // spends all of the activator's future rally-token income in
        // exchange for the power's benefit. Tokens already banked stay
        // spendable; only the per-phase income stops.
        pl.tokenIncomeStopped = true;
        pushLog(game, '🛑 ' + pl.politician.name + ' stops earning rally tokens for the rest of the match');
      } else if (e.kind === 'stealFundsPct') {
        var amt = Math.round(oppPl.fundsCr * e.pct / 100);
        oppPl.fundsCr -= amt; pl.fundsCr += amt;
      } else if (e.kind === 'stealTokens') {
        var tt = e.tokenType || 'stateRally';
        var seized = oppPl.tokens[tt] || 0;
        oppPl.tokens[tt] = 0;
        pl.tokens[tt] = (pl.tokens[tt] || 0) + seized;
      } else if (e.kind === 'seizeFundsPct') {
        // Confiscated, not transferred — unlike stealFundsPct, the activator gains nothing.
        oppPl.fundsCr -= Math.round(oppPl.fundsCr * e.pct / 100);
      } else if (e.kind === 'seizeTokens') {
        // Confiscated, not transferred — unlike stealTokens, the activator gains nothing.
        oppPl.tokens[e.tokenType || 'stateRally'] = 0;
      } else if (e.kind === 'refundAgendaSpend') {
        // "The reforms pay for themselves" — refunds every Cr the activator has
        // spent tapping agendas so far this match, self only (spend is tracked
        // as tap counts, not a running Cr total, so derive it from the flat
        // per-tap cost rather than storing a second redundant counter).
        var totalTaps = 0;
        Object.keys(pl.agendaProgress).forEach(function (k) { totalTaps += pl.agendaProgress[k]; });
        pl.fundsCr += totalTaps * game.cfg.agenda.costPerTapCr;
      } else if (e.kind === 'refundTokensSpent') {
        // Refunds every rally token the activator has spent this match (on
        // rallies + crafting), self only — same "derive from a running
        // counter" shape as refundAgendaSpend above.
        pl.tokens.stateRally += pl.tokensSpentTotal;
      } else if (e.kind === 'lowerSeatsToWin') {
        pl.seatsToWinOverride = e.seatsToWin;
      } else if (e.kind === 'tokens') {
        var who2 = e.target === 'self' ? pl : oppPl;
        who2.tokens[e.tokenType] = Math.max(0, (who2.tokens[e.tokenType] || 0) + e.amount);
      } else if (e.kind === 'nullifyOpponentPower') {
        if (!oppPl.usedSpecial) { oppPl.powerNullified = true; }
        else { (power.fallbackBenefits || []).forEach(runEffect); }
      } else if (e.kind === 'replayAgenda') {
        var policy = game.policiesByName[opts.targetAgendaName];
        if (policy) {
          game.states.forEach(function (s) {
            var net = E.netAgendaEffectBps(s, policy);
            if (net !== 0) E.applySigned(game.pop[s.svgId], playerKey, net, 'both');
          });
        }
      } else if (e.kind === 'popularity') {
        var actor = e.target === 'self' ? playerKey : opp;
        var source = e.source || 'both';
        var isBig = source === 'both' && e.bps > 0;
        var states = resolvePowerScope(game, playerKey, opp, e, opts);
        states.forEach(function (svgId) {
          var delta = e.toBps != null ? Math.max(0, e.toBps - game.pop[svgId][actor]) : e.bps;
          if (delta === 0) return;
          if (isBig) applyBigAction(game, actor, svgId, delta);
          else E.applySigned(game.pop[svgId], actor, delta, source);
        });
      } else if (e.kind === 'armNationwideRallyBonus') {
        // No immediate popularity change — just marks the phase this fired
        // in. activateNationwideRally() reads this back later and adds
        // e.bpsPerPhase for every phase that has elapsed since, so the
        // payoff only lands if/when this player's Nationwide Rally is
        // actually deployed afterward. Deploying one earlier (or never)
        // means this power's funds cost bought nothing — a deliberate
        // "long march, patience wager" tradeoff, not a bug.
        var who5 = e.target === 'self' ? pl : oppPl;
        who5.nationwideRallyBonusArmedPhase = game.phase;
        who5.nationwideRallyBonusPerPhaseBps = e.bpsPerPhase;
      }
    }
    (power.costs || []).forEach(runEffect);
    (power.benefits || []).forEach(runEffect);
    // Nehru's Non-Alignment is secret by design — every other politician's
    // power use is real breaking news, his never is.
    pushLog(game, '⚡ BREAKING: ' + who(game, playerKey) + ' invoked ' + power.name, pl.politician.id !== 'jawaharlal-nehru');
    applyPayouts(game);
    return { ok: true };
  }

  var API = {
    setRecordHook: setRecordHook,
    mulberry32: mulberry32,
    SMALL_UT_IDS: SMALL_UT_IDS,
    SMALL_UT_BATCH_IDS: SMALL_UT_BATCH_IDS,
    powerFundsCost: powerFundsCost,
    NORTHEAST_IDS: NORTHEAST_IDS,
    GROUP_META: GROUP_META,
    normalizeGameData: normalizeGameData,
    loadGameData: loadGameData,
    loadGameDataSync: loadGameDataSync,
    createGame: createGame,
    setupAI: setupAI,
    startPhase: startPhase,
    endPhase: endPhase,
    finalizeGame: finalizeGame,
    computeScore: computeScore,
    investCash: investCash,
    powerBlockedReason: powerBlockedReason,
    playRallyToken: playRallyToken,
    craftToken: craftToken,
    activateNationwideRally: activateNationwideRally,
    tapAgenda: tapAgenda,
    activatePower: activatePower,
    acceptAlly: acceptAlly,
    allyCanAccept: allyCanAccept,
    allyLocked: allyLocked,
    allyRoutes: allyRoutes,
    allyTakes: allyTakes,
    allyEffectivePop: allyEffectivePop,
    nationalSeatsWithAllies: nationalSeatsWithAllies,
    allySliceSeats: allySliceSeats,
    allySeatsByAlly: allySeatsByAlly,
    allyStateShares: allyStateShares,
    canActivatePower: canActivatePower,
    totalNetEffect: totalNetEffect,
    previewAgendaTapSeatDelta: previewAgendaTapSeatDelta,
    agendaGroupEffects: agendaGroupEffects,
    pushLog: pushLog,
    aiStep: aiStep,
    runAIFull: runAIFull
  };
  root.PMEGame = API;
  if (typeof module !== 'undefined') {
    module.exports = API;
    require('./ai.js'); // after PMEGame is set — ai.js reads it back at call time
  }
})(typeof window !== 'undefined' ? window : (typeof global !== 'undefined' ? global : this));
