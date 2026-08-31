# ADR-0016: AI Difficulty Ladder via Feature-Flag Ablation and Seat-Margin Ranking

**Status:** Accepted

**Date:** 2026-08-31

## Context

The single-player game currently ships with one AI opponent (`aiStep()` in `mobile/game.js`) tuned to play at a moderate, roughly-equal-skill level against a typical human. A future feature is a difficulty ladder — multiple AI rungs ranked from easy to very hard, allowing players to progress and find a satisfying skill match.

The challenge: how to design a ladder that is both (1) measurable without AI expertise, (2) constructible via incremental code changes, and (3) ablatable — each rung should be the previous one *minus* one capability, so you can attribute a seat margin to that capability's real strength.

Three approaches were considered:

### Candidate 1: Separate Strategy Class Per Rung
Each rung gets its own bot class (e.g., `EasyAI`, `MediumAI`, `HardAI`, `MaxAI`) with independent implementation.

**Cons:** No shared baseline means no ablation — you can't attribute a margin change to a specific capability because every class is independent. Hard to build incrementally and hard to debug regressions.

### Candidate 2: Tuned Numeric Weights Per Rung
One shared heuristic bot, with numeric weights (investment spend priority, rally token timing, agenda bias, etc.) tuned per rung by numerical optimization.

**Cons:** Not legible — a human looking at the weights can't tell why rung N is stronger than rung N−1. Hard to attribute a margin shift to a cause. Requires automated tuning infrastructure (genetic algorithm, simulated annealing, etc.), which is overkill for a single-player game.

### Candidate 3: Feature Flags on One Shared Heuristic
One `aiStep()` implementation with a set of optional capabilities, each controlled by a boolean flag in an `AI_PROFILE` entry. A new rung is built by setting one or more flags to `true` in a new profile, creating a strictly more-capable version of the previous rung.

**Cons:** Requires pre-defining all capabilities upfront (some won't be obvious until playtesting reveals them). Changes to shared logic can affect all rungs at once.

## Decision

Implement **feature-flag ablation** (Candidate 3) for the AI difficulty ladder:

### 1. Profile Structure
Each AI profile is an entry in `AI_PROFILES` with a name and a set of feature flags (all defaulting to `false`):

```javascript
AI_PROFILES: [
  { name: 'beginner', flags: { seatRankedAgendas: false, tokenDiscipline: false, smartGroupTarget: false, spreadInvest: false } },
  { name: 'intermediate', flags: { seatRankedAgendas: true, tokenDiscipline: false, smartGroupTarget: false, spreadInvest: false } },
  // ... more profiles, each a strict superset of the previous ...
  { name: 'max', flags: { seatRankedAgendas: true, tokenDiscipline: true, smartGroupTarget: true, spreadInvest: true } }
]
```

The shipped four profiles (`beginner`, `intermediate`, `advanced`, `expert`) initially have all flags `false`, so they behave identically to the original single-bot design — regression-verified via 25-game fixed-seed runs.

### 2. Capabilities as Profiles Are Built
Each flag corresponds to one capability that can be toggled on/off in `aiStep()`:

- **`seatRankedAgendas`** — Rank agenda taps by real seat value via `previewAgendaTapSeatDelta`, skip any agenda worth less than equivalent cash invested (2.5 seats/cr breakeven). Without this, agendas are tapped greedily without seat-value ranking.
- **`tokenDiscipline`** — Bank rally tokens toward the Nationwide Rally unless a state rally offers a higher seat delta per token. Without this, tokens are spent immediately without threshold planning.
- **`smartGroupTarget`** — Chase regional-dominance groups with the best seat-payout-per-crore-remaining, picked live and skipped if they can't be finished in phases remaining. Without this, groups are pursued arbitrarily.
- **`spreadInvest`** — Invest for maximum delivered basis points per spend, avoiding per-state boost decay. Without this, investment is greedy within a phase without lookahead.

### 3. Ladder Measurement: Seat Margin vs. Anchor
The ladder is ranked by **average final-seat margin against a fixed anchor opponent**, measured via simulation (e.g., 500-game matches per profile, both players alternating as P1/P2 to cancel first-player advantage):

- **Why margin, not Elo?** Hung parliaments occur in ~75% of simulated games, making win-rate (the only input to Elo) mostly draw signals. Seat margin is continuous, needs ~10× fewer games for statistical confidence, and yields the same ordering the adaptive matchmaking actually needs (pick the opponent the human is most likely to win against).
- **Why an anchor, not a round-robin?** A balanced round-robin between N bots produces a flat Elo leaderboard (Elo is a monotone re-encoding of win rate in a balanced field, adding no new information). Anchoring all profiles to the strongest ("max") bot creates a consistent reference frame: "this easy bot is +250 seats weaker than max, intermediate is +100 weaker," etc.

### 4. Implementation
New helpers in `mobile/ai.js` to support each capability:
- `rallyBreakevenSeats(state, tokenCost)` — calculate minimum seat value per token to justify spend
- `pickDisciplinedRallyTarget()` — select rally states per tokenDiscipline logic
- `agendaTapValueSeats(policy, previewAgendaTapSeatDelta)` — score an agenda tap by real seat value
- `minAgendaTapSeats()` — threshold calculation for agenda ranking
- `costToThresholdCr()` — investment budget calculation
- `pickBestValueGroup()` — group selection per smartGroupTarget
- `scoreInvestStrong()` — investment scoring per spreadInvest

Profile setup in `setupAI()` reads the feature flags and branches the `aiStep()` logic accordingly.

## Consequences

**Positive:**
- **Ablatable design** — each rung is strictly more capable than the last, so (rung N margin) − (rung N−1 margin) directly quantifies capability N's strength. A capability worth +30 seats stays worth +30 across the ladder.
- **Legible progression** — a player (or developer) can read the flag list and understand exactly what makes `hard` different from `easy` — no black-box weights or mystery tuning.
- **Incremental buildout** — start with all flags `false` (baseline), run regressions to confirm bit-identity with the original single bot, then add capabilities one at a time and measure each one.
- **Server-side verification** — profile setup is deterministic, so a future server can recompute with identical flags and verify a client's claimed ladder rung.
- **Low tuning overhead** — no external tools needed, just: run simulation, measure margin, add next flag, re-run simulation, repeat.

**Negative:**
- **Capabilities must be predefined** — you can't retroactively add a flag that should have been enabled 5 rungs ago (the ladder ordering breaks). The full set of capabilities needs to be identified before the ladder is finalized.
- **Changes to shared `aiStep()` logic can affect all rungs** — a bug fix in the heuristic logic affects every profile, potentially shifting margins. This is intentional (the bugs are fixed) but requires re-measurement after each shared-code change.
- **Feature interactions** — some capabilities may not combine well or may have non-additive effects (e.g., `smartGroupTarget` + `spreadInvest` together may achieve synergy > sum of parts). This won't be known until measured.

## Rationale for Rejecting Alternatives

**Separate class per rung (Candidate 1):** No shared baseline, so no ablation — you can't attribute margin changes to specific causes. Forces re-engineering every class when the heuristics need updating.

**Numeric-weight tuning (Candidate 2):** Requires external optimization infrastructure and produces non-legible weights that are hard to debug and impossible to attribute to causes.

## References

- `mobile/ai.js` — AI module with profile definitions and feature-flag logic
- `mobile/game.js` — delegating shims for `setupAI`, `aiStep`, `runAIFull` (unchanged call sites)
- `mobile/main.js` — playtest hooks (`?ai=<profile>`, profile cycling, build markers)
- `data/game-config.json` — candidate future home for hardened ladder config
- ADR-0007 (single-player AI scope) for context on why AI at all
- Design notebook in findings.md for measured margins and capability-strength data from this session's tuning work
