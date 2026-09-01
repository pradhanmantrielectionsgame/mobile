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
    { key: 'WesternBorder', icon: '🏔️', label: 'Western Border' },
    { key: 'TribalLands', icon: '🌳', label: 'Tribal Lands' },
    { key: 'MinorityAreas', icon: '🕌', label: 'Minority Areas' },
    { key: 'NationalParksWildlife', icon: '🐅', label: 'National Parks & Wildlife' },
    { key: 'SouthIndia', icon: '🌴', label: 'South India' },
    { key: 'EasternBorder', icon: '🌄', label: 'Eastern Border' },
    { key: 'TravelAndTourism', icon: '✈️', label: 'Travel & Tourism' },
    { key: 'Education', icon: '🎓', label: 'Education' },
    { key: 'Manufacturing', icon: '⚙️', label: 'Manufacturing' },
    { key: 'NaturalResources', icon: '⛏️', label: 'Natural Resources' },
    { key: 'HindiHeartland', icon: '🕉️', label: 'Hindi Heartland' },
    { key: 'IndustrialCorridor', icon: '🏭', label: 'Industrial Corridor' },
    { key: 'Pilgrimage', icon: '🙏', label: 'Pilgrimage' },
    { key: 'CoastalIndia', icon: '🌊', label: 'Coastal India' },
    { key: 'AgriculturalRegion', icon: '🌾', label: 'Agricultural Region' }
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
        key: g.key, icon: g.icon, label: g.label,
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

  function createGame(data, p1PoliticianId, p2PoliticianId, rng) {
    rng = rng || Math.random;
    var p1Pol = data.politicians.filter(function (p) { return p.id === p1PoliticianId; })[0];
    var p2Pol = data.politicians.filter(function (p) { return p.id === p2PoliticianId; })[0];
    if (!p1Pol || !p2Pol) throw new Error('Unknown politician id');

    var pop = E.generateStartingPosition(data.states, homeStatesOf(p1Pol), homeStatesOf(p2Pol), rng);
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
    setupAI(game, 'p2', rng);
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
    var seats = E.nationalSeats(game.states, game.pop);
    game.finalSeats = seats;
    var p1Threshold = game.players.p1.seatsToWinOverride || game.cfg.seatsToWin;
    var p2Threshold = game.players.p2.seatsToWinOverride || game.cfg.seatsToWin;
    if (seats.p1 >= p1Threshold) { game.winner = 'p1'; }
    else if (seats.p2 >= p2Threshold) { game.winner = 'p2'; }
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
    if (pl[usedFlag] || pl[craftedFlag]) return { ok: false, reason: 'already_done' };
    var cost = flavor === 'special' ? game.cfg.rally.specialPowerupCraftCost : game.cfg.rally.nationwideRallyCraftCost;
    var minPhase = flavor === 'special' ? game.cfg.rally.specialPowerupMinPhase : game.cfg.rally.nationwideRallyMinPhase;
    if (game.phase < minPhase) return { ok: false, reason: 'too_early' };
    if (pl.tokens.stateRally < cost) return { ok: false, reason: 'insufficient_tokens' };
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
    if (!pl.craftedNationwide || pl.usedNationwide) return { ok: false, reason: 'not_ready' };
    recordAction(game, 'activateNationwideRally', playerKey, []);
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
    if (power.requiresMinPhase && game.phase < power.requiresMinPhase) return { ok: false, reason: 'too_early' };
    if (power.requiresMinFundsCr && pl.fundsCr < power.requiresMinFundsCr) return { ok: false, reason: 'insufficient_funds' };
    if (pl.fundsCr < powerFundsCost(power)) return { ok: false, reason: 'insufficient_funds' };
    if (powerFundsCost(power) > 0 && fundsFrozen(pl, game)) return { ok: false, reason: 'funds_frozen' };

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
    playRallyToken: playRallyToken,
    craftToken: craftToken,
    activateNationwideRally: activateNationwideRally,
    tapAgenda: tapAgenda,
    activatePower: activatePower,
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
