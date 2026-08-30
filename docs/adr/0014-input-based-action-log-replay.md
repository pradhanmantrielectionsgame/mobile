# ADR-0014: Input-Based Action-Log Replay, Version-Locked by Design

**Status:** Accepted

**Date:** 2026-08-29

## Context

The v2.2.0 release adds action logging and deterministic replay as groundwork for two future features that are out of scope until a backend is available: multiplayer sync and leaderboard validation.

The core question is how to log a game in a way that serves both needs:
- **Multiplayer sync** needs a durable record of what each player did, so a server can broadcast actions to other players.
- **Leaderboard validation** needs a way to independently verify that a claimed final score is honest and reproducible.

Both would benefit from a small, verifiable game record. There are two candidate approaches:

### Candidate 1: State-Snapshot Log
Serialize the entire game state (player funds, popularity distribution per state, rally tokens deployed, etc.) after each action. Re-verify a result by replaying the snapshot sequence and confirming final seats match.

**Pros:**
- Version-proof — a replay never depends on engine changes.

**Cons:**
- Large (~1 MB per game, vs. ~8 KB for actions).
- Unverifiable — the client just asserts "the game ended here" without proof. A leaderboard cannot tell a padded snapshot from a real one; cheating is possible if the client controls the serialization.
- Useless for multiplayer sync — if one side submits snapshots, what happens when the other side's snapshots diverge (e.g., different funds spent at a given turn)? There's no shared ground truth.

### Candidate 2: Input-Based Action Log
Record every action function call (`investCash`, `playRallyToken`, `craftToken`, `tapAgenda`, `activatePower`, `activateNationwideRally`, `endPhase`) as `{fn, playerKey, args}` in order. Re-play a game by re-applying the recorded calls through the current engine, starting from a seed.

**Pros:**
- Tiny (~8 KB per game).
- Verifiable — each action function self-validates its preconditions and postconditions (funds available, tokens available, etc.). A server re-simulating the log against the same seed can independently verify the final result and reject forged logs that fail on replay.
- Useless for in-game cheating — the log is written by the client, but a corrupt entry fails the moment it's re-played, so the leaderboard server catches it.
- Natural sync payload for multiplayer — both players' action calls in order, the exact ground truth needed to keep game states in sync.

**Cons:**
- Version-locked — engine balance changes (costs, curves, policy magnitudes) make older replays reproduce different outcomes than when they were recorded.

## Decision

Implement an input-based action log:

1. **Seed-based PRNG** — `createGame` now takes a seeded PRNG (Mulberry32 implementation, `G.mulberry32(seed)`) instead of relying on `Math.random`. The seed is stored on `game.seed` for later replay.
2. **Action recording** — every action function that modifies game state records itself to `game.actionLog` with its function name, player key, and arguments. Failures do not record (rolled-back state).
3. **Determinism guarantee** — only `generateStartingPosition` + AI setup (picking a profile and targets) use RNG during game creation. All six action functions and phase/payout/finalize logic are fully deterministic with no randomness, no wall-clock checks.
4. **Replay engine** — `startReplay()` rebuilds the game from `{seed, actionLog}` and re-applies the recorded calls, firing the same visual FX and sounds as live play.
5. **Version stamping** — each replay record carries `GAME_VERSION`, displayed when loading to warn if versions don't match.
6. **Replay verification** — in-browser, `verifyReplay()` logs a console error if the final seats or score diverges from the original; in-test, `assertReplayMatches()` asserts all replayed games land on identical seats **and** score.

## Consequences

**Positive:**
- The log is server-verifiable — a backend re-simulating `{seed, actionLog}` through the same engine code produces the exact same final state, so a leaderboard can reject forged claims.
- Multiplayer sync is natural — one unified action log serves both replay and real-time sync.
- The log is tiny and auditable — an 8 KB record per game is manageable; a human can theoretically read a replay log and follow the game.
- All action functions are already pure and playerKey-agnostic, so a single log format works unchanged for replay, multiplayer, and leaderboard validation.

**Negative:**
- Replays are version-locked — an engine balance patch (cost change, policy tag adjustment) makes older saved replays show different results when re-played.
- **No anti-cheat yet** — a client can still forge an action log, record it, and submit it with the same seed. The server must re-simulate to detect it, not just accept the client's word. This is deferred until the backend exists.

## Rationale for Rejecting Alternatives

**State snapshots:** While version-proof, they are unverifiable and unfit for leaderboard integrity. A server cannot distinguish a genuine snapshot from a forged one without external knowledge. The size penalty (100×) is also unacceptable for a high-volume leaderboard.

**Hybrid (actions + periodic snapshots):** Adds complexity without solving the core problem. A server still can't trust a snapshot, so it gains nothing over pure actions.

## Related Decisions

This decision is paired with **ADR-0015**, which addresses the version-drift problem directly: replay records are stamped with `GAME_VERSION`, players are warned of mismatches, and the leaderboard will reset per balance patch (standard practice in games with replay features, e.g., StarCraft, Factorio, fighting games).
