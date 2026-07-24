// PME Mobile — Game state, actions, and AI opponent.
// Built on top of mobile/engine.js's pure redistribution/apportionment
// functions. This file owns the mutable `game` object and every player
// action; mobile/main.js only reads from `game` and calls these functions —
// it never touches game.pop or game.players directly.
(function (root) {
  'use strict';
  var E = root.PMEEngine || require('./engine.js');

  // Small UTs/states no dedicated map interaction routes through directly —
  // mirrors the union-territories-container button cluster convention (see
  // CLAUDE.md) plus Delhi/Goa, which get their own quick-invest buttons.
  var SMALL_UT_IDS = ['INCH', 'INDH', 'INPY', 'INLD', 'INAN', 'INDL', 'INGA'];

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
    basePath = basePath || '../data/';
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
  // AI personality profiles — picked randomly per match so the single
  // greedy heuristic (runAI, below) plays out a few different ways instead
  // of always the same shape of game. Not adversarially tuned, just varied.
  var AI_PROFILES = [
    { key: 'aggressive-investor', agendaTapCapPerPolicyPerPhase: 1, craftsTokens: true, groupFocus: false },
    { key: 'policy-rusher', agendaTapCapPerPolicyPerPhase: 4, craftsTokens: true, groupFocus: false },
    { key: 'rally-spammer', agendaTapCapPerPolicyPerPhase: 2, craftsTokens: false, groupFocus: false },
    { key: 'group-bonus-rusher', agendaTapCapPerPolicyPerPhase: 2, craftsTokens: true, groupFocus: true }
  ];
  function pickAIProfile(rng) { return AI_PROFILES[Math.floor(rng() * AI_PROFILES.length)]; }

  function makePlayer(politician, cfg, isAI, aiProfile) {
    return {
      politician: politician,
      isAI: !!isAI,
      aiProfile: aiProfile || null,
      fundsCr: cfg.startingFundsCr,
      tokens: { stateRally: 0 },
      tokensSpentThisPhase: 0,
      craftedSpecial: false, usedSpecial: false,
      craftedNationwide: false, usedNationwide: false,
      powerNullified: false,
      agendaProgress: {},
      agendaTokenBonusEarned: 0,
      investmentTaps: {},
      aiGroupCursor: null,
      aiAgendaTapsThisPhase: {}
    };
  }

  function createGame(data, p1PoliticianId, p2PoliticianId, rng) {
    rng = rng || Math.random;
    var p1Pol = data.politicians.filter(function (p) { return p.id === p1PoliticianId; })[0];
    var p2Pol = data.politicians.filter(function (p) { return p.id === p2PoliticianId; })[0];
    if (!p1Pol || !p2Pol) throw new Error('Unknown politician id');

    var pop = E.generateStartingPosition(data.states, p1Pol.homeState, p2Pol.homeState, rng);
    var statesById = {};
    data.states.forEach(function (s) { statesById[s.svgId] = s; });
    var policiesByName = data.policyTags;

    var game = {
      cfg: data.cfg,
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
      log: [],
      winner: null,
      hungParliament: false,
      finalSeats: null,
      players: { p1: makePlayer(p1Pol, data.cfg, false), p2: makePlayer(p2Pol, data.cfg, true, pickAIProfile(rng)) }
    };
    startPhase(game);
    return game;
  }

  function pushLog(game, msg) {
    game.log.unshift({ phase: game.phase, msg: msg });
    if (game.log.length > 40) game.log.pop();
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
          pushLog(game, '💰 ' + (pk === 'p1' ? 'You' : 'Opponent') + ' hold ' + g.label + ' — +₹' + payout + 'Cr regional dominance');
        }
        game.dominanceHeld[key] = active;
      });
    });
  }

  function startPhase(game) {
    game.phaseStartSnapshot = deepCopyPop(game.pop);
    game.bigActionsThisPhase = [];
    ['p1', 'p2'].forEach(function (pk) {
      var pl = game.players[pk];
      pl.fundsCr += game.cfg.fundsRefreshPerPhaseCr;
      pl.tokens.stateRally += game.cfg.rally.tokenIncomePerPhase;
      pl.tokensSpentThisPhase = 0;
      if (pl.isAI) pl.aiAgendaTapsThisPhase = {};
    });
    applyRegionalDominancePayouts(game);
    // AI no longer auto-resolves its whole turn here — it acts one move at a
    // time via aiStep(), paced by the caller (main.js throttles to ~20/min;
    // runAIFull() fast-forwards it for Node tests/simulation).
  }

  function endPhase(game) {
    if (game.winner) return game;
    if (game.phase >= game.cfg.totalPhases) { finalizeGame(game); return game; }
    game.phase += 1;
    startPhase(game);
    return game;
  }

  function finalizeGame(game) {
    var seats = E.nationalSeats(game.states, game.pop);
    game.finalSeats = seats;
    if (seats.p1 >= game.cfg.seatsToWin) { game.winner = 'p1'; }
    else if (seats.p2 >= game.cfg.seatsToWin) { game.winner = 'p2'; }
    else {
      // Hung parliament — decided 2026-07-22 (ADR-0006): draw vs a human
      // opponent, loss vs the AI fallback. This build is always vs-AI.
      game.hungParliament = true;
      game.winner = game.players.p2.isAI ? 'p2' : 'draw';
    }
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
    var cost = E.investmentCostCr(game.statesById[svgId].seats, game.cfg.investment);
    if (pl.fundsCr < cost) return { ok: false, reason: 'insufficient_funds' };
    var tapNum = (pl.investmentTaps[svgId] || 0) + 1;
    pl.fundsCr -= cost;
    pl.investmentTaps[svgId] = tapNum;
    var boost = E.investmentBoostBps(tapNum, game.cfg.investment);
    var gained = E.gainAt(game.pop[svgId], playerKey, boost, 'both');
    applyRegionalDominancePayouts(game);
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
    pl.tokens.stateRally -= 1;
    pl.tokensSpentThisPhase += 1;
    game.rallyPlaysByState[svgId] = plays.concat([playerKey]);
    var gained = E.gainAt(game.pop[svgId], playerKey, game.cfg.rally.tokenBoostBps, 'both');
    pushLog(game, '📢 ' + who(game, playerKey) + ' held a State Rally in ' + game.statesById[svgId].name);
    applyRegionalDominancePayouts(game);
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
    pl.tokens.stateRally -= cost;
    pl[craftedFlag] = true;
    pushLog(game, (flavor === 'special' ? '⭐ ' : '🇮🇳 ') + who(game, playerKey) +
      ' crafted ' + (flavor === 'special' ? 'a Special Powerup' : 'a Nationwide Rally') + ' — ready to activate');
    return { ok: true };
  }

  function activateNationwideRally(game, playerKey) {
    var pl = game.players[playerKey];
    if (!pl.craftedNationwide || pl.usedNationwide) return { ok: false, reason: 'not_ready' };
    pl.usedNationwide = true;
    var boost = game.cfg.rally.nationwideRallyBoostBps;
    game.states.forEach(function (s) { applyBigAction(game, playerKey, s.svgId, boost); });
    pushLog(game, '🇮🇳 BREAKING: ' + who(game, playerKey) + ' launched a Nationwide Rally — every state feels it');
    applyRegionalDominancePayouts(game);
    return { ok: true };
  }

  function tapAgenda(game, playerKey, policyName) {
    var pl = game.players[playerKey];
    var policy = game.policiesByName[policyName];
    if (!policy) return { ok: false, reason: 'unknown_policy' };
    var progress = pl.agendaProgress[policyName] || 0;
    if (progress >= game.cfg.agenda.tapsToComplete) return { ok: false, reason: 'already_maxed' };
    var cost = game.cfg.agenda.costPerTapCr;
    if (pl.fundsCr < cost) return { ok: false, reason: 'insufficient_funds' };
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
      pushLog(game, '📜 BREAKING: ' + who(game, playerKey) + ' fully committed the ' + policyName + ' agenda');
    }
    applyRegionalDominancePayouts(game);
    return { ok: true, completed: completed };
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
      var hs = game.players[playerKey].politician.homeState;
      return game.states.filter(function (s) { return s.name === hs; }).map(function (s) { return s.svgId; });
    }
    if (effect.scope === 'opponentHome') {
      var hs2 = game.players[opp].politician.homeState;
      return game.states.filter(function (s) { return s.name === hs2; }).map(function (s) { return s.svgId; });
    }
    if (effect.scope === 'tags') {
      return game.states.filter(function (s) {
        return effect.tags.some(function (t) { return s.tags.indexOf(t) !== -1; });
      }).map(function (s) { return s.svgId; });
    }
    if (effect.scope === 'state') {
      return game.states.filter(function (s) { return s.name === effect.stateName; }).map(function (s) { return s.svgId; });
    }
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
    if (power.requiresMinFundsCr && pl.fundsCr < power.requiresMinFundsCr) return { ok: false, reason: 'insufficient_funds' };
    if (pl.fundsCr < powerFundsCost(power)) return { ok: false, reason: 'insufficient_funds' };

    pl.usedSpecial = true;
    if (pl.powerNullified) return { ok: true, nullified: true };

    function runEffect(e) {
      if (e.kind === 'funds') {
        var who = e.target === 'self' ? pl : oppPl;
        who.fundsCr = Math.max(0, who.fundsCr + e.amountCr);
      } else if (e.kind === 'stealFundsPct') {
        var amt = Math.round(oppPl.fundsCr * e.pct / 100);
        oppPl.fundsCr -= amt; pl.fundsCr += amt;
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
      }
    }
    (power.costs || []).forEach(runEffect);
    (power.benefits || []).forEach(runEffect);
    pushLog(game, '⚡ BREAKING: ' + who(game, playerKey) + ' invoked ' + power.name);
    applyRegionalDominancePayouts(game);
    return { ok: true };
  }

  // ---------------------------------------------------------------------
  // AI opponent — a greedy heuristic bot, not adversarially optimal. See
  // ADR-0001: live human matchmaking is out of scope here (needs the
  // Firebase backend from ADR-0002, an external service the user hasn't
  // asked to stand up); this is the "always have a match available" path
  // that needs no infrastructure.
  // ---------------------------------------------------------------------
  function pickAIRallyTarget(game) {
    var candidates = game.states.filter(function (s) { return (game.rallyPlaysByState[s.svgId] || []).length < game.cfg.rally.maxPlaysPerStateShared; });
    if (!candidates.length) return null;
    candidates.sort(function (a, b) {
      return (game.pop[b.svgId].p1 - game.pop[b.svgId].p2) - (game.pop[a.svgId].p1 - game.pop[a.svgId].p2);
    });
    return candidates[0].svgId;
  }

  function pickAIPowerTarget(game, power) {
    var effect = power.benefits[0];
    var constraint = effect.constraint;
    var pool = constraint === 'smallUT' ? game.states.filter(function (s) { return SMALL_UT_IDS.indexOf(s.svgId) !== -1; }) : game.states;
    var best = null, bestVal = -1;
    pool.forEach(function (s) {
      var val = effect.target === 'opponent' ? game.pop[s.svgId].p1 : (10000 - game.pop[s.svgId].p2);
      if (val > bestVal) { bestVal = val; best = s; }
    });
    return best ? best.svgId : null;
  }

  function pickAICompletedAgenda(game) {
    var pl = game.players.p2;
    var done = Object.keys(pl.agendaProgress).filter(function (k) { return pl.agendaProgress[k] >= game.cfg.agenda.tapsToComplete; });
    if (!done.length) return null;
    done.sort(function (a, b) { return totalNetEffect(game, b) - totalNetEffect(game, a); });
    return done[0];
  }

  // groupFocus profile bonus: push a laggard state that's the only thing
  // standing between the AI and a regional-dominance payout.
  function groupFocusBonus(game, state) {
    var bonus = 0;
    state.tags.forEach(function (tag) {
      var members = game.states.filter(function (s) { return s.tags.indexOf(tag) !== -1; });
      if (!members.length) return;
      var thisQualifies = game.pop[state.svgId].p2 >= game.cfg.regionalDominance.thresholdBps;
      if (thisQualifies) return;
      var qualifying = members.filter(function (s) { return game.pop[s.svgId].p2 >= game.cfg.regionalDominance.thresholdBps; }).length;
      if (qualifying >= members.length - 2) bonus += 0.5;
    });
    return bonus;
  }

  // Investment target: the AI commits to one state group at a time (round-
  // robin over game.groups, skipping groups it already holds dominance in)
  // instead of chasing whatever single state scores best nationwide — that
  // scattered spend never concentrated enough in one place to clear the 50%
  // regional-dominance bar. pl.aiGroupCursor persists across phases so the
  // campaign keeps progressing group-to-group over the course of the game.
  function scoreInvestState(game, pl, profile, s) {
    var cost = E.investmentCostCr(s.seats, game.cfg.investment);
    if (cost > pl.fundsCr) return null;
    var tapNum = (pl.investmentTaps[s.svgId] || 0) + 1;
    var boost = E.investmentBoostBps(tapNum, game.cfg.investment);
    // Use actual remaining headroom, not the raw boost — otherwise the AI
    // keeps dumping funds into an already-near-100% state forever (0 real
    // gain) instead of moving on to the next state in its target group,
    // which meant a group could never actually clear regional dominance.
    var effectiveGain = Math.min(boost, 10000 - game.pop[s.svgId].p2);
    if (effectiveGain <= 0) return null;
    var score = effectiveGain / cost + (game.pop[s.svgId].p1 - game.pop[s.svgId].p2) / 100000;
    if (profile && profile.groupFocus) score += groupFocusBonus(game, s);
    return score;
  }

  function bestInPool(game, pl, profile, pool) {
    var best = null, bestScore = -Infinity;
    pool.forEach(function (s) {
      var score = scoreInvestState(game, pl, profile, s);
      if (score !== null && score > bestScore) { bestScore = score; best = s; }
    });
    return best;
  }

  function pickAIInvestmentTarget(game, profile) {
    var pl = game.players.p2;
    var groups = game.groups;
    if (!groups.length) return bestInPool(game, pl, profile, game.states);

    if (pl.aiGroupCursor == null) pl.aiGroupCursor = 0;
    var group = null;
    for (var i = 0; i < groups.length; i++) {
      var idx = (pl.aiGroupCursor + i) % groups.length;
      if (!E.dominanceActive(groups[idx], game.states, game.pop, 'p2', game.cfg.regionalDominance.thresholdBps)) {
        pl.aiGroupCursor = idx;
        group = groups[idx];
        break;
      }
    }
    if (!group) return bestInPool(game, pl, profile, game.states); // dominant everywhere already

    var pool = game.states.filter(function (s) { return s.tags.indexOf(group.key) !== -1; });
    var best = bestInPool(game, pl, profile, pool);
    if (best) return best;
    // nothing affordable left in the target group this tick — move on to
    // the next group and fall back to the whole map so funds don't stall
    pl.aiGroupCursor = (pl.aiGroupCursor + 1) % groups.length;
    return bestInPool(game, pl, profile, game.states);
  }

  // Performs exactly one AI action (rally play, token craft, power/nationwide
  // activation, agenda tap, or a single investment tap) and returns a
  // descriptor of what it did ({ type, svgId, costCr }, svgId/costCr null
  // when not applicable) so the caller can animate it, or null if it had
  // nothing to do. Called repeatedly — once per tick in the browser
  // (main.js paces ticks to ~20/min), or in a tight loop by runAIFull() for
  // Node tests, which don't care about real-time pacing.
  function aiStep(game) {
    var pl = game.players.p2;
    if (!pl.isAI || game.winner) return null;
    var profile = pl.aiProfile || AI_PROFILES[0];

    if (pl.tokensSpentThisPhase < game.cfg.rally.maxTokenSpendPerPhase && pl.tokens.stateRally > 0) {
      var rallyTarget = pickAIRallyTarget(game);
      if (rallyTarget && playRallyToken(game, 'p2', rallyTarget).ok) {
        return { type: 'rally', svgId: rallyTarget, costCr: null };
      }
    }

    if (profile.craftsTokens) {
      if (craftToken(game, 'p2', 'special').ok) return { type: 'craftSpecial', svgId: null, costCr: null };
      if (craftToken(game, 'p2', 'nationwide').ok) return { type: 'craftNationwide', svgId: null, costCr: null };
    }

    if (pl.craftedSpecial && !pl.usedSpecial) {
      var power = pl.politician.power;
      var canPay = (!power.requiresMinFundsCr || pl.fundsCr >= power.requiresMinFundsCr) &&
        pl.fundsCr >= powerFundsCost(power);
      if (canPay) {
        var opts = {};
        if (power.requiresTargetState) opts.targetStateSvgId = pickAIPowerTarget(game, power);
        if (power.requiresCompletedAgenda) opts.targetAgendaName = pickAICompletedAgenda(game);
        var targetsOk = (!power.requiresTargetState || opts.targetStateSvgId) &&
          (!power.requiresCompletedAgenda || opts.targetAgendaName);
        if (targetsOk && activatePower(game, 'p2', opts).ok) {
          return { type: 'power', svgId: opts.targetStateSvgId || null, costCr: null };
        }
      }
    }

    if (pl.craftedNationwide && !pl.usedNationwide) {
      if (activateNationwideRally(game, 'p2').ok) return { type: 'nationwide', svgId: null, costCr: null };
    }

    var ranked = pl.politician.policies.map(function (p) { return p.name; })
      .sort(function (a, b) { return totalNetEffect(game, b) - totalNetEffect(game, a); });
    for (var i = 0; i < ranked.length; i++) {
      var name = ranked[i];
      var tapsThisPhase = pl.aiAgendaTapsThisPhase[name] || 0;
      if (tapsThisPhase >= profile.agendaTapCapPerPolicyPerPhase) continue;
      if ((pl.agendaProgress[name] || 0) >= game.cfg.agenda.tapsToComplete) continue;
      if (pl.fundsCr < game.cfg.agenda.costPerTapCr) continue;
      if (tapAgenda(game, 'p2', name).ok) {
        pl.aiAgendaTapsThisPhase[name] = tapsThisPhase + 1;
        return { type: 'agenda', svgId: null, costCr: game.cfg.agenda.costPerTapCr };
      }
    }

    var investTarget = pl.fundsCr >= game.cfg.investment.costPerSeatCr ? pickAIInvestmentTarget(game, profile) : null;
    if (investTarget) {
      var investResult = investCash(game, 'p2', investTarget.svgId);
      if (investResult.ok) return { type: 'invest', svgId: investTarget.svgId, costCr: investResult.cost };
    }

    return null;
  }

  // Fast-forwards the AI's whole turn in one call — for Node tests/
  // simulation only, which don't need real-time pacing. The browser never
  // calls this; it ticks aiStep() on a timer instead (see main.js).
  function runAIFull(game) {
    var guard = 0;
    while (aiStep(game) && guard++ < 2000) {}
  }

  var API = {
    SMALL_UT_IDS: SMALL_UT_IDS,
    GROUP_META: GROUP_META,
    normalizeGameData: normalizeGameData,
    loadGameData: loadGameData,
    loadGameDataSync: loadGameDataSync,
    createGame: createGame,
    startPhase: startPhase,
    endPhase: endPhase,
    finalizeGame: finalizeGame,
    investCash: investCash,
    playRallyToken: playRallyToken,
    craftToken: craftToken,
    activateNationwideRally: activateNationwideRally,
    tapAgenda: tapAgenda,
    activatePower: activatePower,
    canActivatePower: canActivatePower,
    totalNetEffect: totalNetEffect,
    pushLog: pushLog,
    aiStep: aiStep,
    runAIFull: runAIFull
  };
  root.PMEGame = API;
  if (typeof module !== 'undefined') module.exports = API;
})(typeof window !== 'undefined' ? window : (typeof global !== 'undefined' ? global : this));
