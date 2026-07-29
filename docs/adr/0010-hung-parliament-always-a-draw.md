# ADR-0010: Hung Parliament Is Always a Draw

Date: 2026-07-28
Status: Accepted

## Context

ADR-0006 decided that a hung parliament (neither player reaching the 272-seat majority) resolves as a draw against a human opponent, but as a loss for the human player against the AI fallback — a deliberate asymmetry meant to nudge players toward human multiplayer, on the premise that ties would be rare.

That premise no longer holds. Over this session, the AI opponent (`mobile/game.js`'s `aiStep`/`runAIFull`) and the win-rate measurement tooling (`mobile/balance-sim.js`) were both fixed and used to rebalance the full 21-politician roster toward an even, human-comparable win rate. A side effect of that measurement work was discovering the game's real hung-parliament rate: 48-98% of games per politician, not the rare edge case ADR-0006 assumed. With the roster now deliberately tuned to be harder to win outright, treating every one of those undecided matches as an automatic AI win — via `game.winner = game.players.p2.isAI ? 'p2' : 'draw'` in `finalizeGame()` — would have made "AI wins by default" the single most common outcome in the game, disguised as a tie.

Live human multiplayer (the scenario ADR-0006's asymmetry was designed to incentivize) also remains out of scope (ADR-0001/ADR-0002/ADR-0007) — there is no human-vs-human path in this build to protect the incentive for.

## Decision

We will resolve every hung parliament as a genuine draw, regardless of whether the opponent is AI or (in a future build) human. `finalizeGame()` now always sets `game.winner = 'draw'` when neither side crosses the seat threshold; the end-screen (`mobile/main.js`'s `showEndOverlay()`) shows "Hung parliament — a draw" unconditionally, dropping the prior AI-only "you lose" branch.

## Consequences

### Positive
- A player who fights the AI to a near-even standoff sees that reflected honestly as a draw, not a disguised loss.
- Matches the actual measured game balance: with hung parliament this common, an automatic AI win on tie would dominate the outcome distribution.

### Negative
- Loses the "AI takes ties" nudge toward eventual human multiplayer that ADR-0006 built in — reintroduce a version of that asymmetry if/when live matchmaking (ADR-0002) actually ships and ties become rare again.

### Neutral / Tradeoffs
- `mobile/balance-sim.js`'s win-rate tally already scored a hung parliament as a 0.5/0.5 split for measurement purposes, independent of this rule — that scoring choice is now the real gameplay behavior too, not just a simulator workaround.

## Alternatives Considered
- Keeping ADR-0006's asymmetry as-is: rejected — it would make "the AI silently wins" the modal outcome given the current ~50-98% hung-parliament rate, which reads as broken rather than intentional.
- A coin-flip tie-break instead of a flat draw: rejected as unnecessary complexity — a draw is the honest description of "neither side reached a majority," and there's no human-vs-human fairness case in this build to protect with randomness.
