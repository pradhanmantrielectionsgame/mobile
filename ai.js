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
  // takeAllies is on for every rung (2026-10-05): accept any ally that comes on
  // offer, protect held allies' leave agendas, and feed held allies spare
  // tokens. Measured a tie with level 10 (findings.md 2026-10-02); deliberate
  // chasing (chaseAlliesSmart/chaseAllies) stays off the live ladder.
  var LADDER_BASE = { agendaTapCapPerPolicyPerPhase: 4, craftsTokens: true, groupFocus: false, takeAllies: true };
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
  //   chaseAllies(N)    - chase the N best-value allies (cheapest route per
  //                       seat), accept any on offer, and never finish a leave
  //                       agenda that would lose or lock one. Only in
  //                       mobile/bot-bank.js's gen-4 experiment bots so far
  //   takeAllies        - the lazy half of chaseAllies: no investment diverted,
  //                       but accept any ally that comes on offer by accident
  //                       and protect held allies' leave agendas
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
    // A politician whose power lowers the win bar (Narasimha Rao) cannot know
    // until late whether it will matter, so a token-disciplined AI playing one
    // assumes it won't and hoards for two Nationwide Rallies, keeping the power
    // as a last-two-phases option (see raoPlan). Measured +31 seat margin at
    // level 10 (2026-10-05). Keyed on the effect, not the politician.
    var lowersBar = (pl.politician.power.benefits || []).some(function (e) { return e.kind === 'lowerSeatsToWin'; });
    if (lowersBar && pl.aiProfile.tokenDiscipline) {
      pl.aiProfile = Object.assign({}, pl.aiProfile, { skipSpecialCraft: true, twoNationwide: true, raoPlan: true });
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
    if (profile && profile.tokenDiscipline) return pickDisciplinedRallyTarget(game, playerKey, false, profile);
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
  function pickDisciplinedRallyTarget(game, playerKey, liteMode, profile) {
    var pl = game.players[playerKey];
    var owed = liteMode
      ? (pl.craftedSpecial || pl.usedSpecial ? 0 : game.cfg.rally.specialPowerupCraftCost)
      : (pl.craftedSpecial || pl.usedSpecial ? 0 : game.cfg.rally.specialPowerupCraftCost) +
        (pl.craftedNationwide || pl.usedNationwide ? 0 : game.cfg.rally.nationwideRallyCraftCost);
    if (profile && profile.twoNationwide) owed = tokensOwed(game, pl, profile);
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

  // Tokens the bot is still saving toward its craft goals. Default goals: the
  // Special Powerup, plus a Nationwide Rally for tokenDiscipline bots.
  // skipSpecialCraft drops the power from the plan; twoNationwide saves for two
  // Nationwide Rallies (24 of a match's 28 tokens, so it cannot also afford the
  // power). Experiment flags, set only by bot-bank.js profiles.
  function tokensOwed(game, pl, profile) {
    var rally = game.cfg.rally, owed = 0;
    if (!profile.skipSpecialCraft && !(pl.craftedSpecial || pl.usedSpecial)) owed += rally.specialPowerupCraftCost;
    if (profile.twoNationwide) {
      var remaining = Math.max(0, 2 - (pl.aiNationwideLaunches || 0) - (pl.craftedNationwide ? 1 : 0));
      owed += remaining * rally.nationwideRallyCraftCost;
    } else if (profile.tokenDiscipline && !(pl.craftedNationwide || pl.usedNationwide)) {
      owed += rally.nationwideRallyCraftCost;
    }
    return owed;
  }

  // Send one spare token (beyond `owed`) to a held ally. True if one went.
  function feedAllyToken(game, pl, playerKey, owed) {
    if (!game.allies || pl.tokens.stateRally <= owed) return false;
    return game.allies.filter(function (a) { return a.owner === playerKey; })
      .some(function (a) { return G().giveAllyTokens(game, playerKey, a.id, 1).ok; });
  }

  // ---- When to fire the special power ------------------------------------
  // Firing the moment it is affordable wastes powers whose payoff depends on
  // the situation (a 20% floor when we are already above it, a funds seize when
  // the opponent is broke, a nullify after they have already used theirs). So:
  // value the power in seats right now (G().previewPower, converted at the
  // bot's own exchange rates), and fire only when that beats a bar that shrinks
  // to zero by the last phase, so a power with any positive value is never left
  // unused. Powers whose payoff is about WHEN, not how much, get a timing rule
  // keyed on what they do (effect kind), not on who owns them.
  var POWER_MIN_SEATS = 8; // seats of net value wanted at phase 1; scales down to 0 at the end

  function crPerSeat(game) { return E.BPS * game.cfg.investment.costPerSeatCr / game.cfg.investment.boostStartBps; }
  function tokenSeats(game) {
    var total = game.states.reduce(function (a, s) { return a + s.seats; }, 0);
    return total * game.cfg.rally.nationwideRallyBoostBps / (E.BPS * game.cfg.rally.nationwideRallyCraftCost);
  }
  // Cash is worth less the less game is left to spend it in.
  function cashSeats(game, cr) {
    return cr / crPerSeat(game) * (game.cfg.totalPhases - game.phase + 1) / game.cfg.totalPhases;
  }

  function powerValueSeats(game, power, playerKey, opts) {
    var pv = G().previewPower(game, playerKey, opts);
    var v = pv.margin + cashSeats(game, pv.fundsSelf - pv.fundsOpp) + tokenSeats(game) * (pv.tokensSelf - pv.tokensOpp);
    if (pv.incomeStopped) {
      v -= game.cfg.rally.tokenIncomePerPhase * (game.cfg.totalPhases - game.phase) * tokenSeats(game);
    }
    return v;
  }

  function powerKinds(power) {
    var k = {};
    (power.benefits || []).concat(power.costs || []).forEach(function (e) { k[e.kind] = true; });
    return k;
  }

  // True when a lowered win bar would flip the result: we sit between the new and
  // old bar and the opponent is not already over the new one.
  function bridgesWinBar(game, power, playerKey, oppKey) {
    var lowered = power.benefits.filter(function (e) { return e.kind === 'lowerSeatsToWin'; })[0].seatsToWin;
    var seats = G().nationalSeatsWithAllies(game);
    return seats[playerKey] >= lowered && seats[playerKey] < game.cfg.seatsToWin && seats[oppKey] < lowered;
  }

  function powerTimingOk(game, power, playerKey, oppKey, opts) {
    var pl = game.players[playerKey], oppPl = game.players[oppKey];
    var total = game.cfg.totalPhases, phasesLeft = total - game.phase, kinds = powerKinds(power);

    // Nullify: always fire at once. The opponent can craft and deploy in the same
    // breath, so waiting for them to commit means arriving too late; and if theirs
    // is already spent it pays the fallback cash, which is worth taking now.
    if (kinds.nullifyOpponentPower) return true;

    // A lowered win bar only matters if it flips a result: we sit between the
    // new and old bar and the opponent is not already over the new one. The cost
    // is cash, so wait for the last two phases when the outcome is clear.
    if (kinds.lowerSeatsToWin) return phasesLeft <= 1 && bridgesWinBar(game, power, playerKey, oppKey);

    // Arms a bonus on the Nationwide Rally: each phase waited adds to it, so go
    // early, while a Nationwide Rally is still ahead of us.
    if (kinds.armNationwideRallyBonus) {
      if (pl.usedNationwide) return false;
      var perPhase = power.benefits.filter(function (e) { return e.kind === 'armNationwideRallyBonus'; })[0].bpsPerPhase;
      var tokensShort = Math.max(0, game.cfg.rally.nationwideRallyCraftCost - pl.tokens.stateRally);
      var deployPhase = Math.max(game.cfg.rally.nationwideRallyMinPhase, game.phase + Math.ceil(tokensShort / game.cfg.rally.tokenIncomePerPhase));
      var totalSeats = game.states.reduce(function (a, s) { return a + s.seats; }, 0);
      var gain = (deployPhase - game.phase) * perPhase * totalSeats / E.BPS;
      return deployPhase <= total && gain - cashSeats(game, -G().powerFundsCost(power)) >= POWER_MIN_SEATS;
    }

    // Refunded tokens are worth most as another Nationwide Rally (crafting has no
    // per-phase cap), which needs 12 refunded and phase 6+. That is true right
    // after the first Nationwide Rally (12 spent) on top of the earlier crafts, so
    // hold until then. Only in the last two phases settle for what the capped
    // state-rally slots can still use.
    if (kinds.refundTokensSpent) {
      var refund = pl.tokensSpentTotal;
      if (refund >= game.cfg.rally.nationwideRallyCraftCost && game.phase >= game.cfg.rally.nationwideRallyMinPhase) return true;
      return phasesLeft <= 1 && tokenSeats(game) * Math.min(refund, game.cfg.rally.maxTokenSpendPerPhase * (phasesLeft + 1)) > cashSeats(game, G().powerFundsCost(power));
    }

    // A cash seize is a phase-start play: the opponent has just been refilled and
    // has not spent it yet. Fire the moment they hold a real pile; the seat-value
    // gate undervalues it (denying their snowball, not just the Cr), and an AI
    // opponent that spends down its cash every phase would otherwise never be
    // worth hitting.
    if (kinds.seizeFundsPct) return oppPl.fundsCr >= 2000;

    var need = POWER_MIN_SEATS * phasesLeft / total;
    return powerValueSeats(game, power, playerKey, opts) > Math.max(need, 0);
  }

  // Popularity-kill target: the state where the swing in seats is biggest, not
  // merely where the opponent's share is biggest.
  function pickAIPowerTarget(game, power, playerKey, oppKey) {
    var effect = power.benefits[0];
    if (effect.kind === 'popularity' && effect.scope === 'targetState') {
      var bestSwing = null, bestSwingVal = -Infinity;
      game.states.forEach(function (s) {
        if (effect.constraint === 'smallUT' && G().SMALL_UT_IDS.indexOf(s.svgId) === -1) return;
        var v = G().previewPower(game, playerKey, { targetStateSvgId: s.svgId }).margin;
        if (v > bestSwingVal) { bestSwingVal = v; bestSwing = s; }
      });
      return bestSwing ? bestSwing.svgId : null;
    }
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

  // chaseAllies(N) profile flag: go after the N cheapest-per-seat allies still
  // up for grabs. An ally's route is its group (every member state over the
  // dominance threshold) OR its sweep state (100%) - whichever is cheaper to
  // finish. Re-picked live, so an opponent claiming an ally rolls the bot onto
  // the next one. Cost ignores per-tap decay, like costToThresholdCr: it only
  // has to rank allies.
  function allyRoute(game, a, playerKey) {
    var pl = game.players[playerKey];
    var members = game.states.filter(function (s) { return s.tags.indexOf(a.groupKey) !== -1; });
    var groupCost = 0, groupIds = [], groupPer = {};
    members.forEach(function (s) {
      var c = costToThresholdCr(game, s, playerKey);
      if (c > 0) { groupCost += c; groupIds.push(s.svgId); groupPer[s.svgId] = c; }
    });
    var sw = game.statesById[a.sweepSvgId];
    var need = E.BPS - game.pop[sw.svgId][playerKey];
    var boost = E.investmentBoostBps((pl.investmentTaps[sw.svgId] || 0) + 1, game.cfg.investment);
    var sweepCost = need > 0 ? Math.ceil(need / boost) * E.investmentCostCr(sw.seats, game.cfg.investment) : 0;
    if (groupCost <= sweepCost) return { cost: groupCost, svgIds: groupIds, perState: groupPer };
    var sweepPer = {}; sweepPer[sw.svgId] = sweepCost;
    return { cost: sweepCost, svgIds: [sw.svgId], perState: sweepPer };
  }

  // chaseAlliesSmart: the marginal price of a route is what it costs ON TOP of
  // the group the bot is already paying for (states tagged with that group are
  // spend it makes anyway). The ally is worth targetSeats at the bot's own
  // exchange rate (crPerSeat, as in minAgendaTapSeats), halved for slice
  // erosion and defection risk. Chase only a route that costs less than that,
  // only one ally at a time, never one the opponent has already earned.
  function smartChasedAlly(game, profile, playerKey, oppKey) {
    var chased = pickBestValueGroup(game, playerKey, profile);
    var crPerSeat = E.BPS * game.cfg.investment.costPerSeatCr / game.cfg.investment.boostStartBps;
    var best = null, bestRatio = 0;
    game.allies.forEach(function (a) {
      if (a.owner || G().allyLocked(game, a, playerKey) || a.offered[oppKey]) return;
      var r = allyRoute(game, a, playerKey);
      if (r.cost <= 0) return;
      var marginal = 0;
      r.svgIds.forEach(function (id) {
        var overlap = chased && game.statesById[id].tags.indexOf(chased.key) !== -1;
        if (!overlap) marginal += r.perState[id];
      });
      var value = a.targetSeats * crPerSeat * 0.5;
      if (marginal >= value) return;
      var ratio = value / Math.max(marginal, 1);
      if (ratio > bestRatio) { bestRatio = ratio; best = { ally: a, svgIds: r.svgIds, ratio: ratio }; }
    });
    return best ? [best] : [];
  }

  function chasedAllies(game, profile, playerKey) {
    if (profile.chaseAlliesSmart && game.allies) return smartChasedAlly(game, profile, playerKey, playerKey === 'p1' ? 'p2' : 'p1');
    if (!profile.chaseAllies || !game.allies) return [];
    var pl = game.players[playerKey];
    var phasesLeft = Math.max(0, game.cfg.totalPhases - game.phase);
    var budget = pl.fundsCr + game.cfg.fundsRefreshPerPhaseCr * phasesLeft;
    var cands = [];
    game.allies.forEach(function (a) {
      if (a.owner || G().allyLocked(game, a, playerKey)) return;
      var r = allyRoute(game, a, playerKey);
      if (r.cost <= 0 || r.cost > budget) return; // 0 = route already done (offer pending), too dear = skip
      cands.push({ ally: a, svgIds: r.svgIds, ratio: a.targetSeats / r.cost });
    });
    cands.sort(function (x, y) { return y.ratio - x.ratio; });
    return cands.slice(0, profile.chaseAllies);
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
      var allyIds = {};
      chasedAllies(game, profile, playerKey).forEach(function (c) { c.svgIds.forEach(function (id) { allyIds[id] = true; }); });
      var pick = null, pickScore = -Infinity;
      game.states.forEach(function (s) {
        var sc = scoreInvestStrong(game, pl, s, playerKey, oppKey, chasedKey);
        // same weight as a chased group's laggards; the smart rule uses a gentler 2x
        if (sc !== null && allyIds[s.svgId]) sc *= profile.chaseAlliesSmart ? 2 : 3;
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
    // allyFeedFirst (experiment flag): ally tokens come before state rallies, and
    // only the Special Powerup's cost is held back, not the Nationwide Rally's.
    if (profile.allyFeedFirst && pl.tokens.stateRally > 0 &&
        feedAllyToken(game, pl, playerKey, pl.craftedSpecial || pl.usedSpecial ? 0 : game.cfg.rally.specialPowerupCraftCost)) {
      return { type: 'ally', svgId: null, costCr: null };
    }
    if (pl.tokensSpentThisPhase < game.cfg.rally.maxTokenSpendPerPhase && pl.tokens.stateRally > 0) {
      var rallyTarget = pickAIRallyTarget(game, profile, playerKey, oppKey);
      if (rallyTarget && G().playRallyToken(game, playerKey, rallyTarget).ok) {
        return { type: 'rally', svgId: rallyTarget, costCr: null };
      }
    }

    // takeAllies: no state rally landed this tick (spend cap hit, no worthwhile
    // target, or every target capped), so send one spare token to a held ally.
    // "Spare" = beyond what the craft goals still owe, so banked tokens are safe.
    if (profile.takeAllies && pl.tokens.stateRally > 0 && feedAllyToken(game, pl, playerKey, tokensOwed(game, pl, profile))) {
      return { type: 'ally', svgId: null, costCr: null };
    }

    // Auto-craft + deploy the special power the moment 6 tokens are banked
    // — unconditional, not gated by AI personality, so every match the AI
    // reliably gets its own power online instead of draining tokens on
    // individual rally plays and never reaching the threshold.
    if (!profile.skipSpecialCraft && !pl.craftedSpecial && !pl.usedSpecial && pl.tokens.stateRally >= game.cfg.rally.specialPowerupCraftCost) {
      if (G().craftToken(game, playerKey, 'special').ok) return { type: 'craftSpecial', svgId: null, costCr: null };
    }
    // raoPlan (experiment flag, for a lower-the-win-bar power): assume the power
    // will not be needed and hoard for two Nationwide Rallies; only in the last
    // two phases, if the result is close enough that the lowered bar would flip it,
    // spend 6 of the saved tokens on the power instead of the second Nationwide.
    var raoHold = false;
    if (profile.raoPlan) {
      var raoPower = pl.politician.power;
      if (!pl.craftedSpecial && !pl.usedSpecial && game.phase >= game.cfg.totalPhases - 1 &&
          pl.tokens.stateRally >= game.cfg.rally.specialPowerupCraftCost && bridgesWinBar(game, raoPower, playerKey, oppKey) &&
          G().craftToken(game, playerKey, 'special').ok) {
        return { type: 'craftSpecial', svgId: null, costCr: null };
      }
      raoHold = (pl.aiNationwideLaunches || 0) >= 1 && game.phase < game.cfg.totalPhases - 1;
    }
    if (profile.craftsTokens && !raoHold && G().craftToken(game, playerKey, 'nationwide').ok) {
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
        var res = targetsOk && powerTimingOk(game, power, playerKey, oppKey, opts) ? G().activatePower(game, playerKey, opts) : { ok: false };
        if (res.ok) {
          return { type: 'power', svgId: opts.targetStateSvgId || null, costCr: null, nullified: !!res.nullified };
        }
      }
    }

    if (pl.craftedNationwide) { // fires any crafted charge, first or second
      if (G().activateNationwideRally(game, playerKey).ok) {
        pl.aiNationwideLaunches = (pl.aiNationwideLaunches || 0) + 1;
        return { type: 'nationwide', svgId: null, costCr: null };
      }
    }

    // chaseAllies: take any ally on offer at once (free, and the opponent can
    // claim it). Then never FINISH the agenda that would make a held ally leave,
    // or lock out one we are still chasing (completing it first locks it for good).
    var keepAgendas = {};
    if ((profile.chaseAllies || profile.chaseAlliesSmart || profile.takeAllies) && game.allies) {
      game.allies.forEach(function (a) {
        if (G().allyCanAccept(game, a, playerKey) && G().acceptAlly(game, playerKey, a.id).ok) {
          keepAgendas[a.leaveAgenda[playerKey]] = true;
        }
      });
      if (Object.keys(keepAgendas).length) return { type: 'ally', svgId: null, costCr: null };
      game.allies.forEach(function (a) { if (a.owner === playerKey) keepAgendas[a.leaveAgenda[playerKey]] = true; });
      chasedAllies(game, profile, playerKey).forEach(function (c) { keepAgendas[c.ally.leaveAgenda[playerKey]] = true; });
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
      if (keepAgendas[name] && (pl.agendaProgress[name] || 0) + 1 >= game.cfg.agenda.tapsToComplete) continue;
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
