# ADR-0007: Single-Player vs. AI Scope (Deferred Human Matchmaking)

## Status
Accepted

## Context

ADR-0001 proposed a "live human matchmaking with AI fallback" architecture, with Phase 0 dedicated to standing up the Firebase/Supabase backend and matchmaking queue (per ADR-0002). 

This session built the complete mobile game engine (`mobile/engine.js`, `mobile/game.js`, `mobile/index.html`, etc.) against the finalized game design (`design/economy-status-map.md`). The question became: should this build include the multiplayer backend infrastructure, or defer it?

The tradeoff:
1. **Include backend now**: Adds Firebase/Supabase setup, anonymous auth, matchmaking queue schema, player-connection handling, and match lifecycle management — ~2–4 weeks of backend + devops work
2. **Defer backend, build AI-only now**: Delivers a complete, playable single-player game (Player vs. AI) immediately; multiplayer becomes Phase 1, a later addition

## Decision

**Build single-player-vs-AI only in this session; defer human matchmaking backend to a later phase.**

Rationale:
- **Completeness now, rather than waiting on infrastructure** — the game loop, special powers, economy, and UI are fully playable against an AI opponent today
- **Phase dependencies**: Backend setup (Phase 0) is not blocked by engine work; engine work is not blocked by backend. They are independent efforts. Building engine-first validates the game design end-to-end before committing backend resources.
- **AI tuning is included**: A greedy heuristic AI opponent is implemented and functional; balance/sophistication tuning can happen alongside any later backend work
- **User preference**: The explicit request was "complete the build of the game using [the design and UI templates]," not "set up Firebase"
- **Multiplicative value per feature**: A working single-player game has immediate value for playtesting and balance tuning; multiplayer adds value on top, not underneath

This does **not** invalidate ADR-0001/0002 — it establishes that Phase 0 (backend) comes after Phase 1 (playable single-player game), rather than before.

## Consequences

**Positive:**
- Game is fully playable today against a tuned AI opponent
- Design validation happens immediately (design works in real gameplay, or needs changes surface now)
- No external service account or infrastructure setup required for development/testing
- Multiplayer can be added later without rearchitecting the engine or game loop

**Negative:**
- Players cannot challenge each other in the current build (same-device hotseat only, or solo vs. AI)
- Adding live multiplayer later requires a separate backend integration phase
- Does not satisfy the "always have a match available" goal for human-vs-human play (though "solo vs. AI ready immediately" is its own form of always-available)

**Later work implied:**
- Phase 0: Firebase/Supabase setup + matchmaking backend (as planned in ADR-0001/0002)
- Phase 1: Wire player 2 selection screen, human-vs-AI detection, connection handling into the game loop
- Phase 2: Handle race conditions and disconnections
