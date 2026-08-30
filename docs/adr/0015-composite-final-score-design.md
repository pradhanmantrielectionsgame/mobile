# ADR-0015: Composite "Final Score" as a Weighted-Sum Game-State Metric, Not an Integrity Mechanism

**Status:** Accepted

**Date:** 2026-08-29

## Context

Hung parliament occurs in ~80% of games (per `mobile/balance-sim.js` across the full politician roster), making raw seat count a poor leaderboard discriminator — most games end in a draw, offering no ranking signal.

At the same time, a future leaderboard needs *some* number to rank players by. The question is what that number should measure and what guarantees it provides.

### Three Candidate Designs

**1. Seat Count Only**
Show final `nationalSeats(game)` as the score. Simple, familiar to players.

**Cons:** No discrimination in the 80% hung-parliament case. Two draws of 272-272 are treated identically, even if one player controlled 9 regional-dominance groups and the other none. Leaderboard is structurally broken for the modal outcome.

**2. Composite Additive Sum**
`score = seats·100 + max(0,margin)·50 + (win 50000 | draw 15000) + regionsDominated·4000 + agendasCompleted·1500 + cleanSweeps·2500`

Combines multiple game-state metrics into one ranking number: seat count (primary), seat margin (secondary, so 280-263 ranks higher than 272-270), win/draw bonus (so 272-270 draw ranks higher than 262-280 loss), and secondary achievements (regions, agendas, clean sweeps) to discriminate among draws.

**Cons:** Needs tuning. The weights are a first pass; beta feedback will inform adjustments.

**3. Efficiency/Blowout Metrics**
Rank by longest win streak, shortest time to majority, steepest final margin — metrics that reward decisiveness.

**Cons:** Ignores hung parliament entirely. Doesn't solve the modal-outcome problem.

## Decision

Implement a **composite additive score** (option 2):

1. **Formula** (pure function of final game state):
   ```
   score = round(seats · 100 
            + max(0, (player_seats - opp_seats)) · 50 
            + (winner pays 50000, draw pays 15000, loser pays 0)
            + regionsDominated · 4000 
            + agendasCompleted · 1500 
            + cleanSweeps · 2500)
   ```

2. **Weights stored in config** — `data/game-config.json` `→ mobileEconomy.scoring` with keys `seatWeight`, `marginWeight`, `winBonus`, `drawBonus`, `groupWeight`, `agendaWeight`, `cleanSweepWeight`. Tunable without code changes.

3. **Display** — shown as a total row at the bottom of the Match stats panel, styled like a running total (even though it isn't literally summing the rows above). Removed the original prominent `#endScore` card element per user request; the subtle stats-table placement reflects the score's actual purpose (a leaderboard tiebreaker, not a headline victory marker).

4. **Implementation** — `computeScore(game, playerKey)` in `mobile/game.js` is a pure function of the final game state, taking no parameters beyond the game and player key. This ensures a server re-simulating `{seed, actionLog}` through the engine can reproduce the exact same score independently.

## Consequences

**Positive:**
- Discriminates among hung-parliament draws based on intermediate achievements (regions, agendas), giving players something to optimize even when a majority-win becomes impossible.
- Pure function of game state, so a server-side replay produces the identical number — prerequisite for a trustworthy leaderboard.
- First-pass weights are reasonable and conservative (regional dominance contributes ~4,000 per region, well below a seat's ~100 contribution to the score).
- Weights are data-driven, not hardcoded, so tuning is rapid (edit JSON, reload, no code change).

**Negative:**
- Weights are provisional — they need real playtesting feedback, not just simulation tuning, since the player experience of "this weight feels right" matters more than a symmetric AI-vs-AI metric.
- A user can see a high score in one version, then that same replay recorded in an older version produces a lower score if the weights changed. This is a known version-drift issue (see ADR-0014).

## Rationale for Rejecting Alternatives

**Seat count only:** Fails to discriminate the modal (~80%) hung-parliament outcome, making a leaderboard useless for its intended purpose.

**Efficiency metrics (win streaks, time to majority, margin):** Ignore hung parliament entirely, so they're equally useless for ranking the modal outcome.

**Snapshot integrity check:** Not applicable here — the composite score is not an integrity mechanism. See the next section and ADR-0014 for what *is* responsible for integrity.

## Non-Scope: Score ≠ Integrity Mechanism

A common misconception: "the score provides game integrity, replay integrity, and leaderboard integrity."

**Clarification:** A client-computed score is exactly as forgeable as a client-reported seat count. A user can edit `game.score` in devtools and claim a higher rank.

**What provides real integrity:**
- **Replay integrity** — An input log can be re-played deterministically, and divergence is detected by `verifyReplay()` and `assertReplayMatches()`. But the server must still re-simulate to verify this; a client-supplied log can be fabricated.
- **Leaderboard integrity** — Only the **server** recomputing `{seed, actionLog}` → `game` → `computeScore()` independently provides integrity. A client-reported score means nothing without server-side verification.

**What the composite score *does* provide:**
- A leaderboard ranking number when seats alone don't discriminate.
- A stricter-than-seats replay self-check — divergence in seats alone might be missed by accident, but divergence in the composite score (which folds in groups/agendas/sweeps/margin) is harder to miss and tips off a malformed engine change.

The score's genuine value is (1) it makes hung-parliament draws rankable, and (2) it's sensitive enough to catch subtle engine bugs that seats alone might not.

## References

- `mobile/game.js` → `computeScore(game, playerKey)`
- `data/game-config.json` → `mobileEconomy.scoring` block
- ADR-0014 (input-based action log) for server-side validation prerequisites
- CLAUDE.md "Game design principles" → final-score sections for balance implications
