# ADR-0004: Instant-Effect-Only Special Powers

## Status

Accepted

## Context

During special-power design for the replayability overhaul, discovered a lateness bug with duration-based power effects:

- Special powers unlock only after a politician's 4-agenda track is fully committed (end-game timing).
- Duration-based effects (e.g., "opponent frozen for 1 phase," "reduced income for 2 phases," "bonus popularity for next 3 phases") could have zero remaining game phases to apply to once the unlock finally triggers.
- Examples: Indira Gandhi's "National Emergency" (opponent frozen for 2 phases) or Rajinikanth's "Thalaivar Announcement" (block opponent actions) would unlock in phase 7–8 of an 8-phase game, leaving no future phases for the effect to apply — silently voiding the cost-balance that was supposed to exist.

Considered framing this as a tuning problem ("just ensure unlock timing leaves enough runway"), but the dependency was fragile: any change to game length, agenda-completion speed, or unlock gating mechanism could reintroduce the bug.

## Decision

Convert every special-power effect to an instant lump-sum equivalent. All costs and benefits resolve in the same game phase the power is activated, with no forward-looking duration clause.

Examples of conversion:
- "Opponent frozen for 1 phase" → "Opponent loses this phase's investment action (immediate)"
- "Reduced income for 2 phases" → "Opponent's income cut by 50% this phase (immediate)"
- "Bonus rally effectiveness for 3 phases" → "Rallies gain +2% boost this phase (immediate)"

This removes the dependency on borrowed future game-time entirely, making the design robust regardless of when the unlock actually occurs.

## Consequences

### Positive

- **Robustness**: Special-power cost/benefit is no longer fragile to game-length changes or unlock-gating mechanism redesigns.
- **Clarity**: "I activated this power, so this effect is happening right now" is simpler for players to reason about than "this effect will last N phases" (especially if those phases never come).
- **Balancing**: Designers can calculate power impact with certainty — no speculation about future phases.

### Negative

- **Immediacy**: Powers now feel more swingy — full impact lands in one phase rather than spread over several. This requires extra care in cost/benefit design (hence the matched-tradeoff requirement in [D4](0000-parent-design-decisions.md)) to avoid creating imbalanced one-shot wins.
- **Reduced "persistence"**: A duration-based power *felt* like it changed the game state over time. An instant power is a one-time intervention. Designers must ensure special powers still feel consequential despite being instant.

## Alternatives Rejected

### Keep duration-based effects; tune unlock timing

- **Problem**: Creates false confidence that the timing is "solved" when it's actually just tuned to the current game length. Any future change (fewer phases, faster agenda completion, different unlock gate) reintroduces the bug.
- **Complexity**: Requires maintaining a dependency from unlock timing (controlled by [D6](0005-token-economy-unlock-gate.md)) to guaranteed remaining phases (controlled by game length). These systems would need to stay synchronized forever.

### Delay unlock to mid-game

- **Problem**: Shifts the design problem from "zero phases left" to "too few phases left." Doesn't fundamentally fix the fragility.
- **Additional problem**: Shifts unlock away from player agency (token-based gates per [D6]) toward a timer, reducing player control.

## Related Decisions

- **[D4] Matched Cost/Benefit Tradeoffs**: Every special power must have a real cost, not pure upside. This becomes even more critical with instant effects, since the player experiences the full impact immediately.
- **[D6] Token Economy as Unlock Gate**: Determines *when* powers unlock; this decision ensures the unlock timing doesn't create duration-based bugs.
