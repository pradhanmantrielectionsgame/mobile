# ADR-0009: Special Powers — Instant or One-Phase Duration Allowed

## Status

Accepted (clarification/revision of ADR-0004, 2026-07-26)

## Context

ADR-0004 established an absolute instant-only rule for special powers to avoid lateness bugs with duration-based effects (powers unlocking in late phases with no remaining game time to apply the effect). This rule held throughout the initial builds and worked well for most powers.

During the 2026-07-26 special-powers redesign pass, four opposition politicians' powers required genuine persistent state across a single game phase to function meaningfully:

- **Modi's Demonetization**: opponent's funds are frozen (cannot invest/tap agendas/activate powers/deploy rally tokens) for exactly one phase, then thaw automatically at phase start
- **Indira Gandhi's National Emergency**: opponent's actions are locked for exactly one phase, then unlock
- **Other seizure powers**: resource confiscation effects that deny the opponent's future budget spending (value measured over the phases that follow), requiring at least one phase of persistent state to model accurately

An absolute instant-only rule would force these to resolve as:
- "Opponent loses all funds" (instant) — but this doesn't capture the denial value of the freeze, only the funds loss
- "Opponent loses 2 phases worth of funds" (instant lump-sum) — rough approximation, loses the gating/lock aspect entirely

The prior rule needed clarification: is a one-phase effect still "instant" (in the sense of "resolved in the activating phase, no forward-looking dependency"), or does it cross a line that should stay forbidden?

## Decision

Special powers may resolve in exactly one of two ways:

1. **Instant**: Effect fully resolves in the phase the power is activated. No residual state persists beyond the phase. (Example: Tendulkar's National Icon floor boost, Rajinikanth's population swap, Bachchan's seizure)
2. **One-Phase Duration**: Effect persists via a single self-clearing flag through exactly one additional phase, then expires automatically at the start of the next phase. (Example: Modi's Demonetization funds freeze, Indira Gandhi's National Emergency lock)

**Longer durations (2+ phases, or open-ended) remain absolutely banned.**

## Rationale

### Why One-Phase is Allowed

A one-phase effect needs exactly one boolean flag (`fundsFrozen: true/false`, `actionsLocked: true/false`) checked at action-entry points. The flag is set when the power activates, automatically cleared at phase start (no expiry logic needed). This is cheap and bounded—same complexity pattern as any other transient game state.

### Why Longer Durations Stay Banned

Durations lasting 2+ phases require genuine ongoing expiry tracking: either a countdown field (`turnsRemaining: 3`) decremented each phase, or an expiry timestamp (`expiresAtPhase: 8`) checked on every state transition. This is real operational complexity, especially if multiple powers can stack, or if game length changes (same lateness fragility that motivated ADR-0004).

### The Boundary Matters

"One phase" is the exact threshold where the cost (one flag, checked at specific guards) doesn't justify the upside. "Two phases" crosses into genuine ongoing tracking. Allowing one-phase effects but banning longer ones is a clean, defensible rule.

## Consequences

### Positive

- **Matches Design Intention**: Modi's Demonetization (funds freeze), Indira's National Emergency (action lock), and Kejriwal's Anti-Corruption Raid (funds denial) now capture their intended game-state impact without artificial instant-lump-sum approximations.
- **Testable via Fork**: A one-phase effect's true value can now be measured by forking the game state, playing "with power active" vs. "skipped," and comparing final seats — the effect's persistence across one phase becomes visible in the outcome.
- **Maintains Robustness**: The one-phase rule is just as robust as instant-only to game-length changes. A 10-phase game with one-phase freezes behaves identically to a 16-phase game; the freeze still lasts exactly one additional phase in both cases.

### Negative

- **Slightly More Complex Engine**: Instant-only powers need no state tracking beyond the activation itself. One-phase effects require guards at specific action points and automatic flag clearing. (Mitigation: guards are simple, boolean-only; no countdown arithmetic.)
- **Potential for Confusion**: Players might assume "one-phase effect" means "effect lasts for my one phase of actions," when it actually means "lasts through opponent's next turn as well" (or vice versa, depending on phrasing). Careful wording in in-game UI is required.

## Alternatives Rejected

### Keep Strict Instant-Only; Find an Instant Equivalent

- **Problem**: Modi's funds freeze doesn't have a clean instant equivalent. "Opponent loses 2,500 Cr worth of funds" (one phase's refresh) is crude and loses the lock/gate semantics. "Opponent loses 5,000 Cr" (one phase's starting funds + refresh) is arbitrary. This alternative was explicitly rejected for Modi per user feedback.
- **Additional problem**: Kejriwal's "confiscate half the opponent's current cash" is mechanically instant, but its value (denying future phases' budget) only surfaces if the opponent continues playing. Measuring the real impact requires multi-phase fork testing, not instant-diff snapshots.

### Make Modi a One-Off Undocumented Exception

- **Problem**: Creates a precedent for future exceptions. When the next power needs persistent state, is it "another exception," or does the rule change again? Explicit clarification is cleaner than exception-by-exception.
- **User Request**: Explicitly rejected by user, who asked for the rule itself to be clarified rather than papered over with an undocumented special case.

## Related Decisions

- **[D1] Celebrities Stronger Than Politicians**: Non-politician powers (Tendulkar, Hema Malini, Rajinikanth, Bachchan) are permitted to exceed political-roster ceilings, including one-phase effects if needed.
- **[D3] Resource Seizure is Denial-Only**: Seized funds/tokens are destroyed/deducted, not transferred to the activator. This denial-only framing makes the multi-phase value clearer: "opponent lost X resources that they can't spend in future phases," not "you gained X."
- **[D4] Matched Cost/Benefit Tradeoffs**: Every special power still requires a genuine resource cost (funds, popularity, or rally tokens). A one-phase lock/freeze is never free; it pairs with an explicit cost. Modi's Demonetization pairs the freeze with zero direct cost because the "cost" is the opportunity cost of one phase of delayed investment — this is only acceptable because the power itself is thematically tied to a sudden, temporary disruption (a real-world demonetization does freeze economic activity, not charge a fee).

## Implementation Notes

### Code Structure

- **One-Phase Flags**: Engine adds simple boolean flags like `pop[svgId].fundsFrozen[playerKey]` or `game.actionsLocked[playerKey]`.
- **Guards at Action Entry Points**: `investCash`, `tapAgenda`, `activatePower`, `deployRallyToken` checks: `if (fundsFrozen()) return {ok: false, reason: "Funds frozen"}`.
- **Automatic Expiry**: `startPhase()` clears all one-phase flags at the phase boundary.
- **No Countdown**: No `turnsRemaining` field, no per-tick decrement. The flag lives exactly one phase, then is gone.

### Testing

- **Fork Testing**: To measure a one-phase power's true value, `structuredClone` the game state before activation, play both "activated" and "skipped" versions independently to game end, compare final seat totals.
- **Instant-Diff Blindness**: A before/after `nationalSeats()` diff cannot measure a one-phase effect's value (only the instant-cost side shows, not the denial value). See findings.md for the full discussion.

## Revision History

- **2026-07-26**: Clarified and formalized one-phase allowance, superseding ADR-0004's absolute instant-only stance.
