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

  // The difficulty ladder (ADR-0016). Each rung is the previous rung plus
  // exactly one capability flag, and every other knob is held constant, so
  // (rung N margin - rung N-1 margin) is that one capability's worth in
  // seats. Order matters: index 0 is the weakest rung and the fallback.
  //
  // 'easy' reproduces the old shipped 'policy-rusher' bot exactly, so the
  // bottom of the ladder is the difficulty the game shipped with rather than
  // a newly-invented weak bot. The three other old personality profiles
  // (aggressive-investor, rally-spammer, group-bonus-rusher) were flavour
  // rather than difficulty and are gone; git history has them if the
  // match-to-match variety is missed.
  var LADDER_BASE = { agendaTapCapPerPolicyPerPhase: 4, craftsTokens: true, groupFocus: false };
  function rung(key, flags) {
    var p = { key: key };
    Object.keys(LADDER_BASE).forEach(function (k) { p[k] = LADDER_BASE[k]; });
    Object.keys(flags).forEach(function (k) { p[k] = flags[k]; });
    return p;
  }
  // Level 1-8, weakest to strongest. Ordering measured over 2,700 games with
  // mobile/ladder-sim.js (mean seat margin vs the whole field, in comments
  // below); every step clears its error bar. Two earlier profiles are
  // deliberately absent: 'medium' (seatRankedAgendas alone) measured WEAKER
  // than level 1, and 'cap0' lost to level 4 - both broke the ordering.
  var AI_PROFILES = [
    rung('level-1', {}),                                                                    // -101  was 'easy'
    rung('level-2', { seatRankedAgendas: true, tokenDiscipline: true }),                    //  -61  was 'hard'
    rung('level-3', { seatRankedAgendas: true, tokenDiscipline: true,
                      smartGroupTarget: true }),                                            //  -43  was 'expert'
    rung('level-4', { seatRankedAgendas: true, tokenDiscipline: true,
                      spreadInvest: true, groupObsession: 2 }),                             //  -22  was 'regional-2'
    rung('level-5', { seatRankedAgendas: true, tokenDiscipline: true,
                      smartGroupTarget: true, spreadInvest: true, groupCap: 1 }),           //  +10  was 'cap1'
    rung('level-6', { seatRankedAgendas: true, tokenDiscipline: true,
                      smartGroupTarget: true, spreadInvest: true, groupCap: 2 }),           //  +55  was 'cap2'
    rung('level-7', { seatRankedAgendas: true, tokenDiscipline: true,
                      smartGroupTarget: true, spreadInvest: true, groupCap: 4 }),           // +109  was 'cap4'
    rung('level-8', { seatRankedAgendas: true, tokenDiscipline: true,
                      smartGroupTarget: true, spreadInvest: true })                         // +180  was 'max'
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
  //   tokenDiscipline   - bank rally tokens toward the Nationwide Rally unless
  //                       a state rally beats it per token (only the two
  //                       biggest states do)
  //   smartGroupTarget  - chase the group with the best payout per crore still
  //                       needed, re-picked live, instead of one random group
  //                       fixed at game start
  //   spreadInvest      - invest for maximum delivered bps, which dodges the
  //                       per-state boost decay; seats-per-crore is otherwise
  //                       identical for every state (see investmentCostCr)
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
  function pickAIRallyTarget(game, profile, playerKey) {
    if (!profile || !profile.tokenDiscipline) {
      var top10 = game.states.slice().sort(function (a, b) { return b.seats - a.seats; }).slice(0, 10);
      if (!top10.length) return null;
      return top10[Math.floor(game.rng() * top10.length)].svgId;
    }
    return pickDisciplinedRallyTarget(game, playerKey);
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

  // Seat-weighted random draw. Used instead of picking the single biggest
  // state so the bot doesn't rally the same two states every game: value
  // scales linearly with seats, so weighting by seats keeps most of the
  // expected value while making the target genuinely unpredictable.
  function weightedRallyPick(game, pool) {
    var total = pool.reduce(function (a, s) { return a + s.seats; }, 0);
    if (total <= 0) return pool[0].svgId;
    var r = game.rng() * total;
    for (var i = 0; i < pool.length; i++) {
      r -= pool[i].seats;
      if (r <= 0) return pool[i].svgId;
    }
    return pool[pool.length - 1].svgId;
  }

  function pickDisciplinedRallyTarget(game, playerKey) {
    var pl = game.players[playerKey];
    var owed = (pl.craftedSpecial || pl.usedSpecial ? 0 : game.cfg.rally.specialPowerupCraftCost) +
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
      var rallyTarget = pickAIRallyTarget(game, profile, playerKey);
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
        if (targetsOk && G().activatePower(game, playerKey, opts).ok) {
          return { type: 'power', svgId: opts.targetStateSvgId || null, costCr: null };
        }
      }
    }

    if (pl.craftedNationwide && !pl.usedNationwide) {
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
