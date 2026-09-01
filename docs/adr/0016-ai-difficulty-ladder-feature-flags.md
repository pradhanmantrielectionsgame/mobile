# ADR-0016: AI Difficulty Ladder via Feature-Flag Ablation and Seat-Margin Ranking

**Status:** Accepted, amended 2026-09-01

**Date:** 2026-08-31 (amended 2026-09-01)

> **Amendment summary (2026-09-01):** the decision stands — feature flags on one shared heuristic, ranked by seat margin — but two of its stated premises did not survive measurement. Chain ablation does **not** attribute capability strength correctly when flags interact, and the ladder's rungs are **not** all strict supersets of one another. See "Amendment" at the end of this document. Read that section before relying on any per-flag number quoted above.

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

---

## Amendment — 2026-09-01: what measurement changed

The ladder was built and then measured with a new harness (`mobile/ladder-sim.js`, 2,700 games). Three parts of the decision above need correcting.

### 1. Chain ablation misattributes interacting capabilities (the significant one)

The original text claims each rung is the previous one plus one capability, so "(rung N margin) − (rung N−1 margin) directly quantifies capability N's strength" and "a capability worth +30 seats stays worth +30 across the ladder." **Neither holds when two capabilities interact.**

Measured: adding `smartGroupTarget` on top of `seatRankedAgendas` + `tokenDiscipline` was worth +15 ± 10 seats (inside noise, i.e. apparently worthless). Adding `spreadInvest` on top of that was worth +147. The natural reading — `spreadInvest` is the strong one, group targeting does nothing — is wrong. Groups captured per game:

| profile | correct investment scorer | live group targeting | groups captured |
|---|---|---|---|
| `expert` | no | yes | 2.4 |
| `regional-2` | yes | no | 0.2 |
| `max` | yes | yes | **7.3** |

Neither flag does much alone; together they are worth ~147 seats. A chain ablation credits the entire partnership to whichever half was added **last**, purely as an artifact of the ordering.

**Consequence for this ADR:** a single-flag delta from the chain is the value of that flag *given every flag below it*, never the capability's standalone strength. Attribution requires the full round-robin matrix, and interacting flags need a solo-flag row. The "Feature interactions" bullet under Consequences ("won't be known until measured") was correct and turned out to be the dominant effect, not an edge case.

### 2. The rungs are not strict supersets, and two shipped profiles measured out of order

The original design assumes a strictly nested capability set. The shipped ladder is not nested: `level-4` carries `spreadInvest` + `groupObsession` but **not** `smartGroupTarget`, which `level-3` has. It earns its rank by measurement, not by containment.

Two candidate profiles were dropped for losing to the rung below them — exactly the failure the monotonicity check exists to catch:

- `seatRankedAgendas` **alone** measured −14.4 ± 7.2 *weaker* than the flagless baseline. Cause: `agendaTapValueSeats` credits an agenda's completion-bonus tokens (worth ~4.5 seats) entirely to the 4th and final tap, so every earlier tap is valued below the 2.5-seat breakeven and skipped — the bot never starts the agendas it should finish, and starves itself of the tokens the Nationwide Rally needs. Measured against the flagless bot: 1.5 agendas completed vs 4.0, and the Nationwide Rally used in 0 of 6 games vs 2 of 6. The bug is unfixed by explicit decision; `level-2` carries the flag because the rung is still monotone *with* `tokenDiscipline` alongside it.
- `groupCap: 0` (full skill, no groups) lost to `groupObsession: 2` by −20.0 ± 7.7.

### 3. The ladder's real dial is economic throttling, not capability removal

The original design assumes difficulty is tuned by adding or removing capabilities. That produced a 147-seat cliff with nothing able to sit inside it, because the capability in question is a binary flag.

The gap is not a competence gradient at all — it is a **snowball**. Regional dominance requires *every* state in a group over 50%, so it pays nothing until it pays everything; each capture funds investment taps that capture more groups. Measured: `max` makes 429 investment taps per game against `regional-2`'s 170, on near-identical unspent cash (~5 Cr).

So the working dial is `profile.groupCap` — a cap on how many groups a bot may hold, throttling the compounding directly rather than damaging its judgement. It produced the evenly spaced rungs the ladder needed (overall margin: cap0 −31, cap1 +14, cap2 +55, cap4 +98, uncapped +180). **A numeric throttle on the bot's economy interpolates smoothly where a capability flag cannot.**

### 4. Bot-vs-bot ranking still cannot be the only evidence

Unchanged from the original but worth restating: the strongest bot's edge is group compounding, and a human who holds one state in each group switches that engine off entirely. A rung's rating needs at least a sanity check against real play. (Confirmed in the other direction on 2026-08-31: `max` beat a human 374–142 while taking 3 groups to the human's 0.)

### Measured ladder as shipped

Mean seat margin vs the whole field, 2,240 games, mirrored pairs, measured after the rally-randomisation change below:

| level | flags | margin |
|---|---|---|
| 1 | (none) | −115 ± 6 |
| 2 | seatRankedAgendas, tokenDiscipline | −78 ± 6 |
| 3 | + smartGroupTarget | −60 ± 7 |
| 4 | spreadInvest, groupObsession 2 | −40 ± 9 |
| 5 | full, groupCap 1 | −10 ± 8 |
| 6 | full, groupCap 2 | +43 ± 8 |
| 7 | full, groupCap 4 | +86 ± 9 |
| 8 | full, uncapped | +175 ± 11 |

The monotonicity check passes outright — every rung beats the rung below it. Levels 7→8 remain the one step inside noise (67 ± 38); accepted, since the goal is a set of distinguishable strengths rather than a precisely calibrated scale.

(A prior 2,700-game run before the rally change gave −101/−61/−43/−22/+10/+55/+109/+180. The randomisation shifted every rung down slightly and left the ordering intact.)

### Also amended: rally targeting is deliberately randomised

`pickDisciplinedRallyTarget` originally returned the single largest open state, making every `tokenDiscipline` rung (levels 2–8) rally Uttar Pradesh and then Maharashtra in every game. That is both predictable to play against and unfair: `maxPlaysPerStateShared` is a **shared** cap, so a bot camping those states denies them to the human. Replaced with a seat-weighted random draw over the states that clear the same economic bar — value scales linearly with seats, so weighting by seats keeps most of the expected value. Measured across 40 games at level 8: 16 distinct states rallied, with the top two down to 13.8% each.
