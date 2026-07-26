# ADR-0009: Special Powers May Resolve Instantly or Last Exactly One Phase

## Status

Accepted (revises ADR-0004, 2026-07-26)

## Context

ADR-0004 established an absolute instant-only rule for special powers: every power resolves fully in the phase it's activated, no residual state persists. The stated reason was that a duration-based effect has nothing left to apply to if it unlocks on the game's last phase — a real risk under any achievement-gated unlock.

During a 2026-07-26 session reworking several special powers, Narendra Modi's "Demonetization" was redesigned from an instant flat funds removal into a literal freeze: the opponent can't invest, tap agendas, or activate a funds-costing special power for one full phase. This genuinely needs persistent state — a flag that survives from the activating phase into the next one — which the absolute instant-only rule doesn't allow.

Two ways to resolve this were considered:

1. Find an instant equivalent for Modi (e.g. an instant lump-sum funds removal). Rejected: there's no clean instant equivalent that preserves the "you can't act with money you have" flavor — a lump-sum removal is a different power with different math, not this one reframed.
2. Treat Modi as a one-off undocumented exception to the rule. Rejected by the user, who asked for the rule itself to be clarified rather than quietly special-cased.

The user then explicitly drew a three-way distinction: instant effects, single-phase effects, and longer time-based effects — and stated they're fine with anything in the first two categories; longer-lasting effects are "trickier to code."

## Decision

Special powers may resolve in exactly one of two ways:

1. **Instant** — the effect fully resolves in the activating phase, no state persists afterward. This remains the default and the vast majority of the roster (e.g. Indira Gandhi's National Emergency, an instant confiscation of the opponent's cash and rally tokens; Kejriwal's Anti-Corruption Raid, an instant confiscation of half the opponent's cash — neither of these involves any persistent lock or duration, despite superficially resembling "denial" powers).
2. **One-phase** — the effect sets a single flag on activation that blocks a specific action for exactly one phase, then clears itself automatically once `game.phase` advances past it. Modi's Demonetization is the only power in the roster currently using this category: `pl.fundsFrozenUntilPhase` is set to `game.phase + 1` on activation, and a shared `fundsFrozen()` guard (checked in `investCash`, `tapAgenda`, and `activatePower`'s funds-cost gate) returns `{ok: false}` while `pl.fundsFrozenUntilPhase === game.phase` holds. No countdown, no separate cleanup step — the flag is simply irrelevant once the phase number moves past it.

**Anything lasting more than one phase, or resolving on a delay (e.g. "triggers at the start of the next phase," "decays over N phases"), remains banned.**

## Rationale

A one-phase effect needs exactly one flag, set once, compared against `game.phase`, self-clearing — the same shape every time, regardless of which power uses it. A multi-phase effect needs a countdown or expiry field that's actually decremented or checked across an open-ended number of phase transitions, and has to keep working correctly regardless of how many phases the effect has left when the game ends. That's real, ongoing complexity — not a difference of degree from the one-phase case, a difference of kind.

The late-game weakness ADR-0004 was written to avoid is still real for the one-phase category: if Modi activates Demonetization on the actual last phase, there's no next phase left to freeze, so it does nothing. This is accepted as a deliberate tradeoff, not solved — the user's own playtesting indicates rally tokens are earned quickly enough in practice that the special power is usually crafted and available well before the final phase, making the dead-window case uncommon in real play.

## Consequences

### Positive
- Modi's Demonetization can express its real "you can't spend money right now" flavor instead of an approximated instant lump-sum.
- The implementation cost of the one-phase category is small and fixed: one field, one shared guard function, checked at the 2-3 places funds actually get spent. It doesn't scale up per power.

### Negative
- The category carries the same "worthless if popped on the literal last phase" flaw the instant-only rule was designed to avoid entirely — now an accepted risk rather than an eliminated one.
- Any future one-phase effect needs its own guard added at whichever action(s) it blocks, mirroring `fundsFrozen()`'s pattern — not automatic, has to be done deliberately each time.

## What this does NOT change

Confiscation-style powers (Indira Gandhi, Kejriwal) are still fully instant — seizing the opponent's current cash/tokens right now doesn't require persisting anything; the *opponent's future budget* is smaller as a natural consequence of losing that cash now, not because of any ongoing lock. Modeling the *value* of that denial requires playing out the rest of the game (see `CLAUDE.md`'s testing-methodology note on instant-diff blindness), but the mechanic itself has zero persistent state. Don't confuse "a power whose value plays out over future phases" with "a power that needs duration-based engine state" — only the latter is what this ADR is about.

## Related decisions

- Non-politician powers (Tendulkar, Hema Malini, Rajinikanth, Bachchan) are all instant — none needed the one-phase category.
- Resource-seizure powers (Indira, Kejriwal) confiscate rather than transfer, per the same session's related decision — orthogonal to this ADR, but easy to conflate since both changes landed the same day.

## Revision history

- 2026-07-26: revises ADR-0004's absolute instant-only rule to allow a one-phase category, following Modi's Demonetization redesign.
