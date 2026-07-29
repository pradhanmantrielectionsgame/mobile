# ADR-0006: Hung Parliament Tie Resolution

## Status

Superseded by ADR-0010

## Context

The game's win condition is reaching 272 of 543 parliamentary seats (50.1% majority). However, matches can end without a clear winner — either due to deliberate tie outcomes in human vs. human games or by chance in edge cases (both players reaching exactly 271 seats, for example, though the seat distribution mechanics make this rare).

The question: what happens when both players end the game with equal seat counts?

This decision interacts with ADR-0001 (Player 2 matchmaking + AI fallback): the outcome for ties should differ depending on whether Player 2 is a human opponent (who expects fairness) or an AI fallback (which should have a slight disadvantage to incentivize pursuing human multiplayer).

## Decision

**When both players end the game with equal seat counts:**
- **If Player 2 is a human opponent**: The game is a **draw**. Neither player wins; both get feedback emphasizing the rarity and fairness of the outcome.
- **If Player 2 is an AI opponent**: The human player **loses**. The tie favors the AI, incentivizing players to pursue human multiplayer matches for truly fair play.

This creates:
1. **Human multiplayer fairness**: Ties are rare, but when they occur, both players see a fair draw.
2. **AI fallback asymmetry**: The AI has a slight structural advantage to nudge players toward multiplayer.
3. **Matchmaking incentive**: "Play a friend for true fairness; AI takes ties" encourages the preferred human multiplayer path.

## Consequences

### Positive

- **Fair play signal**: Human opponents know ties are genuinely fair, not a system glitch.
- **AI design clarity**: AI doesn't need to be perfectly balanced; the tie-loss rule is an explicit design choice, not a bug.
- **Matchmaking incentive**: Subtle nudge toward human play without feeling like punitive gatekeeping.

### Negative

- **Unexpected loss**: Players may be surprised that a tie counts as a loss against AI, requiring clear UI/end-screen explanation.
- **AI perception**: Could feel unfair on first encounter; mitigation is good UI copy explaining the design choice.

## Related Decisions

- **[ADR-0001] Player 2 Matchmaking with AI Fallback**: This decision applies only when an AI opponent is in play. Human-vs-human matches treat ties as draws, no asymmetry.
- **[ADR-0004] Instant-Effect-Only Special Powers**: Powers can swing seat counts dramatically; ties are more plausible with instant powers than with gradual effects.

## Implementation Notes

- Game-end check: compare final seat counts; if equal, branch on `player2IsAI` flag
- UI/end-screen: display "Draw" or "AI Win (You Tied)" with explanatory copy
- Considered but rejected: "closest to 272 wins" (too many rounding edge cases); "Player 1 wins ties" (unfair to Player 2)
