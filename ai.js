// PME Mobile — the AI opponent.
// Every decision the bot makes lives here: which state to invest in, which
// agenda to tap, when to rally, and which regional group to chase. It reads
// the game object but never mutates it directly — every move goes through
// mobile/game.js's action functions, exactly as a human tap does, so the AI
// can't do anything a player couldn't.
//
// Profiles are feature flags, not separate bots: one greedy heuristic reads
// the flags on pl.aiProfile and plays a different shape of game. That's what
// makes a difficulty ladder measurable — remove one flag, measure what it
// cost in seats. Loaded as a plain <script> after game.js (see index.html),
// and required by game.js itself under Node.
(function (root) {
  'use strict';
  var E = root.PMEEngine || require('./engine.js');
  // game.js is the action layer. Under Node it requires this file at the end
  // of its own IIFE, so PMEGame exists by the time any of this runs — but not
  // yet at load time, hence the per-call lookup.
  function G() { return root.PMEGame; }

  // The difficulty ladder (ADR-0016, rebuilt 2026-09-11 from the anchored-Elo
  // staircase experiment in mobile/bot-bank.js/findings.md). Picked to land
  // close to an even ~55-Elo step between rungs (measured range: anchor 1000
  // to the top flag-set's 1545, so (1545-1000)/10 ~= 54.5), NOT "one flag
  // change per rung" the way the previous two reorders were — gameplay
  // smoothness won over that architectural cleanliness on purpose, so which
  // flag flips between two consecutive levels varies rung to rung. See
  // mobile/bot-bank.js's third-generation comment block for the full
  // per-bot measured Elo and the reasoning for each pick.
  //
  // Two previous reorders are preserved verbatim, under stable names
  // decoupled from "level-N", in mobile/bot-bank.js — use that if you need a
  // bot with a specific already-measured Elo regardless of what level-N
  // means today. groupObsession's code stays live (see
  // pickAIInvestmentTarget) only because those archived rungs still use it;
  // nothing on the current ladder does.
  var LADDER_BASE = { agendaTapCapPerPolicyPerPhase: 4, craftsTokens: true, groupFocus: false };
  function rung(key, actionsPerSecond, flags) {
    var p = { key: key, actionsPerSecond: actionsPerSecond };
    Object.keys(LADDER_BASE).forEach(function (k) { p[k] = LADDER_BASE[k]; });
    Object.keys(flags).forEach(function (k) { p[k] = flags[k]; });
    return p;
  }
  // `actionsPerSecond` is a fairness cap on real-time speed, not a difficulty
  // knob — see planAITickPacing() in main.js. Levels 1-8 stay at a human-
  // matchable 1/s; only 9-10 deliberately outpace a human (see below). If
  // re-measurement (mobile/ladder-sim.js) finds a rung scores weaker than the
  // one below it at 1/s, that specific rung is the one to grant a speed
  // exemption to — don't apply it pre-emptively.
  //
  // Measured Elo (mobile/bot-bank.js bank name in parens; level-4's is a
  // placeholder estimate from a small side-comparison, not a full round
  // robin — see patient_egret's own comment):
  //   L1  1068 (sleepy_sloth)         L6  1379 (focused_falcon)
  //   L2  1120 (jumping_gopher)       L7  1416 (guarded_blackbuck)
  //   L3  1166 (silent_myna)          L8  1448 (steadfast_porcupine)
  //   L4 ~1235 (patient_egret, est.)  L9  1501 (greedy_gharial)
  //   L5  1296 (steady_stork)         L10 1545 (lightning_leopard)
  var AI_PROFILES = [
    rung('level-1', 1, {}),
    rung('level-2', 1, { seatRankedAgendas: true, tokenDiscipline: true }),
    rung('level-3', 1, { seatRankedAgendas: true, spreadInvest: true }),
    rung('level-4', 1, { seatRankedAgendas: true, spreadInvest: true, tokenDisciplineLite: true }),
    rung('level-5', 1, { seatRankedAgendas: true, spreadInvest: true, tokenDiscipline: true }),
    rung('level-6', 1, { seatRankedAgendas: true, spreadInvest: true, tokenDiscipline: true,
                         smartGroupTarget: true, groupCap: 1 }),
    rung('level-7', 1, { seatRankedAgendas: true, spreadInvest: true,
                         smartGroupTarget: true, groupCap: 2 }),
    rung('level-8', 1, { seatRankedAgendas: true, spreadInvest: true,
                         smartGroupTarget: true, groupCap: 4 }),
    rung('level-9', 1, { seatRankedAgendas: true, spreadInvest: true, tokenDiscipline: true,
                         smartGroupTarget: true, groupCap: 4 }),
    // Level 10 is level-9's flag-set with the cap removed and speed raised —
    // deliberately the only level that outpaces a human. See bot-bank.js's
    // lightning_leopard/swift_serval comments for why speed is a real,
    // separable lever only at this top flag-set.
    rung('level-10', 2, { seatRankedAgendas: true, spreadInvest: true, tokenDiscipline: true,
                          smartGroupTarget: true })
  ];
  var MAX_LEVEL = AI_PROFILES.length;

  // Fallback only. The real choice is main.js's adaptive level, which passes
  // an explicit profileKey to setupAI; this covers callers that pass none
  // (the headless harnesses). Never random - a random *difficulty* is a worse
  // experience than a random personality was.
  var DEFAULT_RUNG = 'level-3';
  function pickAIProfile(rng) { return profileByKey(DEFAULT_RUNG) || AI_PROFILES[0]; }

  // What each flag turns on:
  //   seatRankedAgendas - rank agenda taps by real seat delta, and skip any
  //                       tap worth less than the same cash spent on investment
  //   valueRallyTarget  - score every open rally target the way an attractive
  //                       investment is scored, and draw weighted by that
  //                       score across the whole map instead of a random
  //                       top-10 — a spray, but a smarter one
  //   tokenDiscipline   - bank rally tokens toward the Nationwide Rally unless
  //                       a state rally beats it per token (only the two
  //                       biggest states do). Wins over valueRallyTarget if
  //                       both are set — hoarding is the stronger of the two
  //   tokenDisciplineLite - same idea, but only saves toward the cheaper
  //                       Special Powerup goal, not the Nationwide Rally
  //                       too — a genuine half-strength discipline, reaches
  //                       its (smaller) savings goal sooner and starts
  //                       spending freely again earlier. (Saving toward the
  //                       Nationwide goal instead was the first attempt and
  //                       measured identical to full discipline — the
  //                       unconditional special-power auto-craft in aiStep
  //                       already covers that cost for free along the way,
  //                       so only the smaller goal actually shortens the
  //                       picky window.) Wins over valueRallyTarget if both
  //                       are set, loses to full tokenDiscipline if both
  //                       are set
  //   smartGroupTarget  - chase the group with the best payout per crore still
  //                       needed, re-picked live, instead of one random group
  //                       fixed at game start. Only takes effect together
  //                       with spreadInvest — see pickAIInvestmentTarget
  //   spreadInvest      - invest for maximum delivered bps, which dodges the
  //                       per-state boost decay; seats-per-crore is otherwise
  //                       identical for every state (see investmentCostCr)
  //   groupObsession(N) - lock onto N random groups at game start and refuse
  //                       to invest outside them, ever. A cruder, no-longer-
  //                       used alternative to smartGroupTarget+spreadInvest;
  //                       kept for bot-bank.js's archived rungs, not on the
  //                       live ladder
  //   groupCap(N)       - stop chasing NEW groups once N are already held.
  //                       The one dial that weakens the bot on purpose (group
  //                       capture snowballs otherwise). Only checked inside
  //                       smartGroupTarget+spreadInvest's live re-pick
  function profileByKey(key) {
    return AI_PROFILES.filter(function (p) { return p.key === key; })[0] || null;
  }

  // Flags a player slot as AI-controlled and gives it a personality profile
  // + a committed state-group target, same setup createGame always does for
  // p2. Exposed so a headless test/simulation can also drive p1 with the
  // real aiStep() logic (a symmetric "AI vs AI" match) instead of p1 always
  // being the unflagged human seat — see mobile/balance-sim.js.
  // profileKey (optional): force a specific ladder profile instead of drawing
  // one at random — the headless ladder harness needs a named opponent.
  function setupAI(game, playerKey, rng, profileKey) {
    var pl = game.players[playerKey];
    pl.isAI = true;
    pl.aiProfile = (profileKey && profileByKey(profileKey)) || pickAIProfile(rng);
    // AI commits to one randomly-chosen state group for the whole match and
    // hammers every state in it toward regional dominance, instead of
    // round-robining across all groups — a simpler, harder-to-read-around
    // opponent than cycling through the full group list.
    // The draw happens either way, so the rng stream (and therefore replay
    // determinism) never depends on which profile was picked.
    var drawn = game.groups.length ? game.groups[Math.floor(rng() * game.groups.length)] : null;
    pl.aiTargetGroup = pl.aiProfile.smartGroupTarget ? null : drawn;
    // Obsession rungs commit to N distinct groups for the whole match and
    // never invest outside them. Drawn here so the choice is fixed at setup,
    // the same way aiTargetGroup is.
    pl.aiObsessionGroups = null;
    if (pl.aiProfile.groupObsession && game.groups.length) {
      var picked = [drawn];
      while (picked.length < pl.aiProfile.groupObsession && picked.length < game.groups.length) {
        var g = game.groups[Math.floor(rng() * game.groups.length)];
        if (picked.indexOf(g) === -1) picked.push(g);
      }
      pl.aiObsessionGroups = picked;
    }
  }

  // ---------------------------------------------------------------------
  // AI opponent — a greedy heuristic bot, not adversarially optimal. See
  // ADR-0001: live human matchmaking is out of scope here (needs the
  // Firebase backend from ADR-0002, an external service the user hasn't
  // asked to stand up); this is the "always have a match available" path
  // that needs no infrastructure.
  // ---------------------------------------------------------------------
  // Random pick among the 10 largest-seat states, once per phase — not the
  // best-scoring target. A fixed "biggest states" pool with a random draw
  // each round is simple to read around defensively, on purpose. If the
  // draw lands on a state that's already capped (playRallyToken rejects
  // it), the token is just left unspent for that phase rather than retried
  // elsewhere — it banks toward the auto-craft threshold in aiStep instead.
  function pickAIRallyTarget(game, profile, playerKey, oppKey) {
    if (profile && profile.tokenDiscipline) return pickDisciplinedRallyTarget(game, playerKey, false);
    if (profile && profile.tokenDisciplineLite) return pickDisciplinedRallyTarget(game, playerKey, true);
    if (profile && profile.valueRallyTarget) return pickValueRallyTarget(game, playerKey, oppKey);
    var top10 = game.states.slice().sort(function (a, b) { return b.seats - a.seats; }).slice(0, 10);
    if (!top10.length) return null;
    return top10[Math.floor(game.rng() * top10.length)].svgId;
  }

  // A token banked toward the Nationwide Rally is worth
  // nationwideRallyBoostBps x every seat in the country / craftCost — about
  // 2.3 seats per token with the shipped numbers. A token spent on a state
  // rally is worth tokenBoostBps x that one state's seats. Break-even lands
  // near 45 seats, which only Uttar Pradesh (80) and Maharashtra (48) clear —
  // so a disciplined bot banks almost everything and rallies only the giants.
  function rallyBreakevenSeats(game) {
    var totalSeats = game.states.reduce(function (a, s) { return a + s.seats; }, 0);
    return totalSeats * game.cfg.rally.nationwideRallyBoostBps /
      (game.cfg.rally.nationwideRallyCraftCost * game.cfg.rally.tokenBoostBps);
  }

  // Weighted random draw by an arbitrary positive per-state value. Used
  // instead of an argmax so the bot doesn't rally the same states every
  // game — value scales the odds, it doesn't force the outcome.
  function weightedPick(game, pool, valueFn) {
    var total = 0;
    var weights = pool.map(function (s) { var v = valueFn(s); total += v; return v; });
    if (total <= 0) return pool[0].svgId;
    var r = game.rng() * total;
    for (var i = 0; i < pool.length; i++) {
      r -= weights[i];
      if (r <= 0) return pool[i].svgId;
    }
    return pool[pool.length - 1].svgId;
  }
  function weightedRallyPick(game, pool) {
    return weightedPick(game, pool, function (s) { return s.seats; });
  }

  // valueRallyTarget profile flag: score every open rally target the same
  // way an attractive investment is scored — real seats swung by the token
  // (capped by remaining headroom) plus a small nudge toward states the
  // opponent already leads in — then draw weighted by that score across
  // every eligible state, not a fixed top-N or top-10. A state worth
  // investing in is worth rallying too, so this reuses that idea instead of
  // a separate one. Weighted, not argmax, on purpose (see pickBestValueGroup
  // for the same reasoning) — rally targets are drawn from a pool a human
  // opponent can also play into.
  function scoreRallyValue(game, s, playerKey, oppKey) {
    var headroom = E.BPS - game.pop[s.svgId][playerKey];
    if (headroom <= 0) return 0;
    var gain = Math.min(game.cfg.rally.tokenBoostBps, headroom);
    var seatsSwung = gain * s.seats / E.BPS;
    var contestBonus = Math.max(0, game.pop[s.svgId][oppKey] - game.pop[s.svgId][playerKey]) / 100;
    return seatsSwung + contestBonus;
  }
  function pickValueRallyTarget(game, playerKey, oppKey) {
    var pool = game.states.filter(function (s) {
      var plays = game.rallyPlaysByState[s.svgId] || [];
      return plays.length < game.cfg.rally.maxPlaysPerStateShared && game.pop[s.svgId][playerKey] < E.BPS;
    });
    if (!pool.length) return null;
    return weightedPick(game, pool, function (s) { return scoreRallyValue(game, s, playerKey, oppKey); });
  }

  // liteMode (tokenDisciplineLite): saves only toward the Special Powerup
  // cost (the cheaper of the two goals), not the Nationwide Rally. Saving
  // for the Nationwide goal instead measured statistically identical to
  // full discipline (see findings.md, 2026-09-11): aiStep's unconditional
  // auto-craft already builds the special power the instant 6 tokens are
  // banked regardless of this "owed" figure, so a bot hoarding toward 12
  // passes through that auto-craft for free along the way and gets no
  // weaker for it. Targeting the smaller 6-token goal instead means "spare"
  // turns positive right as the special auto-crafts, so the picky window
  // is genuinely short - the bot reverts to free spending much sooner than
  // full discipline (which keeps saving to 18) but still hoards with real
  // intent early on, unlike rally=none.
  function pickDisciplinedRallyTarget(game, playerKey, liteMode) {
    var pl = game.players[playerKey];
    var owed = liteMode
      ? (pl.craftedSpecial || pl.usedSpecial ? 0 : game.cfg.rally.specialPowerupCraftCost)
      : (pl.craftedSpecial || pl.usedSpecial ? 0 : game.cfg.rally.specialPowerupCraftCost) +
        (pl.craftedNationwide || pl.usedNationwide ? 0 : game.cfg.rally.nationwideRallyCraftCost);
    var spare = pl.tokens.stateRally - owed;
    var pool = game.states.filter(function (s) {
      var plays = game.rallyPlaysByState[s.svgId] || [];
      return plays.length < game.cfg.rally.maxPlaysPerStateShared && game.pop[s.svgId][playerKey] < E.BPS;
    }).sort(function (a, b) { return b.seats - a.seats; });
    if (!pool.length) return null;
    // Tokens spare of both craft costs: banking has no remaining value, so
    // spread across the biggest handful rather than hammering the top one.
    if (spare > 0) return weightedRallyPick(game, pool.slice(0, 8));
    // Otherwise a state rally must still beat banking the token toward the
    // Nationwide Rally - but among every state that clears that bar, not
    // just the largest one.
    var worth = pool.filter(function (s) { return s.seats >= rallyBreakevenSeats(game); });
    if (worth.length) return weightedRallyPick(game, worth);
    return null; // every open target is worth less than banking the token
  }

  function pickAIPowerTarget(game, power, playerKey, oppKey) {
    var effect = power.benefits[0];
    var constraint = effect.constraint;
    var pool = constraint === 'smallUT' ? game.states.filter(function (s) { return G().SMALL_UT_IDS.indexOf(s.svgId) !== -1; }) : game.states;
    var best = null, bestVal = -1;
    pool.forEach(function (s) {
      var val = effect.target === 'opponent' ? game.pop[s.svgId][oppKey] : (10000 - game.pop[s.svgId][playerKey]);
      if (val > bestVal) { bestVal = val; best = s; }
    });
    return best ? best.svgId : null;
  }

  function pickAICompletedAgenda(game, playerKey) {
    var pl = game.players[playerKey];
    var done = Object.keys(pl.agendaProgress).filter(function (k) { return pl.agendaProgress[k] >= game.cfg.agenda.tapsToComplete; });
    if (!done.length) return null;
    done.sort(function (a, b) { return G().totalNetEffect(game, b) - G().totalNetEffect(game, a); });
    return done[0];
  }

  // groupFocus profile bonus: push a laggard state that's the only thing
  // standing between the AI and a regional-dominance payout.
  function groupFocusBonus(game, state, playerKey) {
    var bonus = 0;
    state.tags.forEach(function (tag) {
      var members = game.states.filter(function (s) { return s.tags.indexOf(tag) !== -1; });
      if (!members.length) return;
      var thisQualifies = game.pop[state.svgId][playerKey] >= game.cfg.regionalDominance.thresholdBps;
      if (thisQualifies) return;
      var qualifying = members.filter(function (s) { return game.pop[s.svgId][playerKey] >= game.cfg.regionalDominance.thresholdBps; }).length;
      if (qualifying >= members.length - 2) bonus += 0.5;
    });
    return bonus;
  }

  // What one more tap of an agenda is really worth, in seats: the seat delta
  // it moves right now (previewAgendaTapSeatDelta, the same function the human
  // UI already shows), plus the completion-bonus tokens if this is the tap
  // that finishes it, valued at what a banked token buys via Nationwide Rally.
  function agendaTapValueSeats(game, playerKey, policyName) {
    var pl = game.players[playerKey];
    var value = G().previewAgendaTapSeatDelta(game, playerKey, policyName);
    var progress = pl.agendaProgress[policyName] || 0;
    if (progress + 1 >= game.cfg.agenda.tapsToComplete &&
        pl.agendaTokenBonusEarned < game.cfg.rally.agendaTokenBonusMax) {
      var totalSeats = game.states.reduce(function (a, s) { return a + s.seats; }, 0);
      value += game.cfg.rally.agendaTokenBonusPerCompletion * totalSeats *
        game.cfg.rally.nationwideRallyBoostBps / (E.BPS * game.cfg.rally.nationwideRallyCraftCost);
    }
    return value;
  }

  // The same cash spent on investment always buys costPerTapCr / 200 seats
  // (cost is 10 x seats, a first tap gains 5% x seats, so the state size
  // cancels out). An agenda tap worth fewer seats than that is a strictly
  // worse buy, so a strong bot skips it instead of completing agendas on
  // principle the way every current profile does.
  function minAgendaTapSeats(game) {
    var crPerSeat = E.BPS * game.cfg.investment.costPerSeatCr / game.cfg.investment.boostStartBps;
    return game.cfg.agenda.costPerTapCr / crPerSeat;
  }

  // Rough crore cost to lift one state to the regional-dominance threshold at
  // the boost its next tap would actually deliver. Deliberately ignores the
  // further decay across the taps it projects: it only has to rank groups.
  function costToThresholdCr(game, s, playerKey) {
    var need = game.cfg.regionalDominance.thresholdBps - game.pop[s.svgId][playerKey];
    if (need <= 0) return 0;
    var pl = game.players[playerKey];
    var boost = E.investmentBoostBps((pl.investmentTaps[s.svgId] || 0) + 1, game.cfg.investment);
    return Math.ceil(need / boost) * E.investmentCostCr(s.seats, game.cfg.investment);
  }

  // Best unheld group by cash payout per crore still needed to finish it.
  // Re-evaluated live rather than fixed at game start (aiTargetGroup), so the
  // bot rolls onto the next-cheapest group as soon as it banks one, and never
  // sinks its endgame into a group it can no longer afford to complete.
  // How many groups this player currently holds outright.
  function heldGroupCount(game, playerKey) {
    return game.groups.filter(function (g) {
      return E.dominanceActive(g, game.states, game.pop, playerKey,
        game.cfg.regionalDominance.thresholdBps);
    }).length;
  }

  // profile.groupCap (optional): stop chasing new groups once this many are
  // held. Regional dominance is the bot's whole economy - each capture pays
  // cash that buys more investment that captures more groups - so capping the
  // count throttles the snowball directly. That is the one genuinely
  // adjustable dial between the weak rungs and max, whose 147-seat gap comes
  // from group capture being all-or-nothing rather than from any single skill.
  function pickBestValueGroup(game, playerKey, profile) {
    var pl = game.players[playerKey];
    if (profile && profile.groupCap != null &&
        heldGroupCount(game, playerKey) >= profile.groupCap) return null;
    var phasesLeft = Math.max(0, game.cfg.totalPhases - game.phase);
    var budget = pl.fundsCr + game.cfg.fundsRefreshPerPhaseCr * phasesLeft;
    var best = null, bestRatio = -1;
    game.groups.forEach(function (g) {
      var members = game.states.filter(function (s) { return s.tags.indexOf(g.key) !== -1; });
      if (!members.length) return;
      var needCr = 0;
      members.forEach(function (s) { needCr += costToThresholdCr(game, s, playerKey); });
      if (needCr <= 0) return;     // already held
      if (needCr > budget) return; // not finishable in the phases left
      var payout = g.seats * (game.cfg.regionalDominance.payoutCrPerSeat +
        game.cfg.regionalDominance.holdingBonusCrPerSeat * phasesLeft);
      var ratio = payout / needCr;
      if (ratio > bestRatio) { bestRatio = ratio; best = g; }
    });
    return best;
  }

  // Seats-per-crore is identical for every state, so the only real investment
  // lever is delivering the biggest boost per tap, i.e. tapping states whose
  // own glide path has not decayed yet, plus finishing a group that pays cash
  // and a small tie-break toward states the opponent leads.
  function scoreInvestStrong(game, pl, s, playerKey, oppKey, groupKey) {
    var cost = E.investmentCostCr(s.seats, game.cfg.investment);
    if (cost > pl.fundsCr) return null;
    var boost = E.investmentBoostBps((pl.investmentTaps[s.svgId] || 0) + 1, game.cfg.investment);
    var effectiveGain = Math.min(boost, E.BPS - game.pop[s.svgId][playerKey]);
    if (effectiveGain <= 0) return null;
    var score = effectiveGain;
    if (groupKey && s.tags.indexOf(groupKey) !== -1 &&
        game.pop[s.svgId][playerKey] < game.cfg.regionalDominance.thresholdBps) score *= 3;
    return score + (game.pop[s.svgId][oppKey] - game.pop[s.svgId][playerKey]) / 100;
  }

  // Investment target: the AI commits to a single state group, chosen once
  // at game start (pl.aiTargetGroup, set in createGame) and hammered for
  // the whole match, instead of chasing whatever single state scores best
  // nationwide — that scattered spend never concentrated enough in one
  // place to clear the 50% regional-dominance bar.
  function scoreInvestState(game, pl, profile, s, playerKey, oppKey) {
    var cost = E.investmentCostCr(s.seats, game.cfg.investment);
    if (cost > pl.fundsCr) return null;
    var tapNum = (pl.investmentTaps[s.svgId] || 0) + 1;
    var boost = E.investmentBoostBps(tapNum, game.cfg.investment);
    // Use actual remaining headroom, not the raw boost — otherwise the AI
    // keeps dumping funds into an already-near-100% state forever (0 real
    // gain) instead of moving on to the next state in its target group,
    // which meant a group could never actually clear regional dominance.
    var effectiveGain = Math.min(boost, 10000 - game.pop[s.svgId][playerKey]);
    if (effectiveGain <= 0) return null;
    var score = effectiveGain / cost + (game.pop[s.svgId][oppKey] - game.pop[s.svgId][playerKey]) / 100000;
    if (profile && profile.groupFocus) score += groupFocusBonus(game, s, playerKey);
    return score;
  }

  function bestInPool(game, pl, profile, pool, playerKey, oppKey) {
    var best = null, bestScore = -Infinity;
    pool.forEach(function (s) {
      var score = scoreInvestState(game, pl, profile, s, playerKey, oppKey);
      if (score !== null && score > bestScore) { bestScore = score; best = s; }
    });
    return best;
  }

  function pickAIInvestmentTarget(game, profile, playerKey, oppKey) {
    var pl = game.players[playerKey];
    // Obsession: max's scorer, but the candidate pool is only the member
    // states of the drawn groups. Returns null rather than spending
    // elsewhere when none of them is affordable - "ignores the rest" is the
    // whole handicap, so the cash banks for agendas instead.
    if (profile && profile.groupObsession && pl.aiObsessionGroups) {
      var keys = pl.aiObsessionGroups.map(function (g) { return g.key; });
      // Chase the first group not yet fully over the threshold. Same
      // "already held" test pickBestValueGroup uses: nothing left to pay for.
      var chase = null;
      for (var gi = 0; gi < keys.length; gi++) {
        var need = 0;
        game.states.forEach(function (s) {
          if (s.tags.indexOf(keys[gi]) !== -1) need += costToThresholdCr(game, s, playerKey);
        });
        if (need > 0) { chase = keys[gi]; break; }
      }
      var oPick = null, oScore = -Infinity;
      game.states.forEach(function (s) {
        var inGroup = keys.some(function (k) { return s.tags.indexOf(k) !== -1; });
        if (!inGroup) return;
        var sc = scoreInvestStrong(game, pl, s, playerKey, oppKey, chase);
        if (sc !== null && sc > oScore) { oScore = sc; oPick = s; }
      });
      return oPick;
    }
    if (profile && profile.spreadInvest) {
      var chased = profile.smartGroupTarget ? pickBestValueGroup(game, playerKey, profile) : pl.aiTargetGroup;
      var chasedKey = chased ? chased.key : null;
      var pick = null, pickScore = -Infinity;
      game.states.forEach(function (s) {
        var sc = scoreInvestStrong(game, pl, s, playerKey, oppKey, chasedKey);
        if (sc !== null && sc > pickScore) { pickScore = sc; pick = s; }
      });
      return pick;
    }
    var group = pl.aiTargetGroup;
    if (!group) return bestInPool(game, pl, profile, game.states, playerKey, oppKey);

    var pool = game.states.filter(function (s) { return s.tags.indexOf(group.key) !== -1; });
    var best = bestInPool(game, pl, profile, pool, playerKey, oppKey);
    if (best) return best;
    // nothing affordable/left with headroom in the target group right now
    // (fully dominant, or momentarily unaffordable) — spend elsewhere
    // rather than stall; next tick re-checks the target group first
    return bestInPool(game, pl, profile, game.states, playerKey, oppKey);
  }

  // Performs exactly one AI action (rally play, token craft, power/nationwide
  // activation, agenda tap, or a single investment tap) and returns a
  // descriptor of what it did ({ type, svgId, costCr }, svgId/costCr null
  // when not applicable) so the caller can animate it, or null if it had
  // nothing to do. Called repeatedly — once per tick in the browser
  // (main.js paces ticks to ~20/min), or in a tight loop by runAIFull() for
  // Node tests, which don't care about real-time pacing.
  // playerKey defaults to 'p2' — the browser and every existing call site
  // (main.js, runAIFull below) call aiStep(game) with no second argument,
  // so this default preserves their exact prior behavior. A second AI-
  // controlled seat (e.g. a headless "AI vs AI" balance simulation, which
  // needs a symmetric opponent instead of a naive/random p1 stand-in) can
  // drive p1 the same way by passing 'p1' explicitly and flagging
  // game.players.p1.isAI/.aiProfile/.aiTargetGroup itself first.
  function aiStep(game, playerKey) {
    playerKey = playerKey || 'p2';
    var oppKey = playerKey === 'p2' ? 'p1' : 'p2';
    var pl = game.players[playerKey];
    if (!pl.isAI || game.winner) return null;
    var profile = pl.aiProfile || AI_PROFILES[0];

    // One rally attempt per tick, at a random top-10-largest state — not a
    // retry loop. A rejected placement (state already at its shared 2-play
    // cap) just leaves the token unspent this tick, banking it toward the
    // auto-craft check below instead of hunting for another target. The real
    // per-phase limit is playRallyToken's own tokensSpentThisPhase check
    // (maxTokenSpendPerPhase, same cap a human plays under) — this used to
    // also gate on a since-removed aiRalliedThisPhase flag that capped the
    // AI to exactly one rally per phase regardless of that shared cap,
    // silently halving the AI's rally usage versus a human every game
    // (found 2026-08-26 from a user report of a lopsided AI-vs-human game).
    if (pl.tokensSpentThisPhase < game.cfg.rally.maxTokenSpendPerPhase && pl.tokens.stateRally > 0) {
      var rallyTarget = pickAIRallyTarget(game, profile, playerKey, oppKey);
      if (rallyTarget && G().playRallyToken(game, playerKey, rallyTarget).ok) {
        return { type: 'rally', svgId: rallyTarget, costCr: null };
      }
    }

    // Auto-craft + deploy the special power the moment 6 tokens are banked
    // — unconditional, not gated by AI personality, so every match the AI
    // reliably gets its own power online instead of draining tokens on
    // individual rally plays and never reaching the threshold.
    if (!pl.craftedSpecial && !pl.usedSpecial && pl.tokens.stateRally >= game.cfg.rally.specialPowerupCraftCost) {
      if (G().craftToken(game, playerKey, 'special').ok) return { type: 'craftSpecial', svgId: null, costCr: null };
    }
    if (profile.craftsTokens && G().craftToken(game, playerKey, 'nationwide').ok) {
      return { type: 'craftNationwide', svgId: null, costCr: null };
    }

    if (pl.craftedSpecial && !pl.usedSpecial) {
      var power = pl.politician.power;
      var canPay = (!power.requiresMinPhase || game.phase >= power.requiresMinPhase) &&
        (!power.requiresMinFundsCr || pl.fundsCr >= power.requiresMinFundsCr) &&
        pl.fundsCr >= G().powerFundsCost(power);
      if (canPay) {
        var opts = {};
        if (power.requiresTargetState) opts.targetStateSvgId = pickAIPowerTarget(game, power, playerKey, oppKey);
        if (power.requiresCompletedAgenda) opts.targetAgendaName = pickAICompletedAgenda(game, playerKey);
        var targetsOk = (!power.requiresTargetState || opts.targetStateSvgId) &&
          (!power.requiresCompletedAgenda || opts.targetAgendaName);
        // activatePower returns ok:true even when the power was secretly
        // nullified (Nehru's Non-Alignment) — ok means "the activation was
        // spent", not "the effect landed". Carry the flag through so the FX
        // layer shows a fizzle instead of a full power burst, the way the
        // human path already does in finishActivatePower.
        var res = targetsOk ? G().activatePower(game, playerKey, opts) : { ok: false };
        if (res.ok) {
          return { type: 'power', svgId: opts.targetStateSvgId || null, costCr: null, nullified: !!res.nullified };
        }
      }
    }

    if (pl.craftedNationwide) { // fires any crafted charge, first or second
      if (G().activateNationwideRally(game, playerKey).ok) return { type: 'nationwide', svgId: null, costCr: null };
    }

    var agendaValue = profile.seatRankedAgendas
      ? function (n) { return agendaTapValueSeats(game, playerKey, n); }
      : function (n) { return G().totalNetEffect(game, n); };
    var ranked = pl.politician.policies.map(function (p) { return p.name; })
      .sort(function (a, b) { return agendaValue(b) - agendaValue(a); });
    for (var i = 0; i < ranked.length; i++) {
      var name = ranked[i];
      var tapsThisPhase = pl.aiAgendaTapsThisPhase[name] || 0;
      if (tapsThisPhase >= profile.agendaTapCapPerPolicyPerPhase) continue;
      if ((pl.agendaProgress[name] || 0) >= game.cfg.agenda.tapsToComplete) continue;
      if (pl.fundsCr < game.cfg.agenda.costPerTapCr) continue;
      if (profile.seatRankedAgendas && agendaValue(name) < minAgendaTapSeats(game)) continue;
      if (G().tapAgenda(game, playerKey, name).ok) {
        pl.aiAgendaTapsThisPhase[name] = tapsThisPhase + 1;
        return { type: 'agenda', svgId: null, costCr: game.cfg.agenda.costPerTapCr };
      }
    }

    var investTarget = pl.fundsCr >= game.cfg.investment.costPerSeatCr ? pickAIInvestmentTarget(game, profile, playerKey, oppKey) : null;
    if (investTarget) {
      if (G().SMALL_UT_BATCH_IDS.indexOf(investTarget.svgId) !== -1) {
        var batchCost = 0, batchAny = false;
        G().SMALL_UT_BATCH_IDS.forEach(function (id) {
          var r = G().investCash(game, playerKey, id);
          if (r.ok) { batchAny = true; batchCost += r.cost; }
        });
        if (batchAny) return { type: 'invest', svgId: investTarget.svgId, costCr: batchCost };
      } else {
        var investResult = G().investCash(game, playerKey, investTarget.svgId);
        if (investResult.ok) return { type: 'invest', svgId: investTarget.svgId, costCr: investResult.cost };
      }
    }

    return null;
  }

  // Fast-forwards the AI's whole turn in one call — for Node tests/
  // simulation only, which don't need real-time pacing. The browser never
  // calls this; it ticks aiStep() on a timer instead (see main.js).
  // IGNORES the rung's `actionsPerSecond` cap, so it is an upper bound on that
  // rung's strength, not the strength a player actually faces. Any harness
  // comparing rungs to each other must cap the turn itself — see
  // mobile/ladder-sim.js's runTurn().
  function runAIFull(game, playerKey) {
    var guard = 0;
    while (aiStep(game, playerKey) && guard++ < 2000) {}
  }


  root.PMEAI = {
    AI_PROFILES: AI_PROFILES,
    MAX_LEVEL: MAX_LEVEL,
    profileByKey: profileByKey,
    setupAI: setupAI,
    aiStep: aiStep,
    runAIFull: runAIFull
  };
  if (typeof module !== 'undefined') module.exports = root.PMEAI;
})(typeof window !== 'undefined' ? window : (typeof global !== 'undefined' ? global : this));
