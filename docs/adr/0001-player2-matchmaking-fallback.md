# ADR-0001: Player 2 Matchmaking with AI Fallback

## Status
Accepted

## Context

The mobile game currently has two severe limitations for Player 2:
1. No AI opponent exists (desktop's `ai-player-controller.js` was never ported)
2. Local "Player 2" is same-device hotseat (Shift+Click) only

The user's core goal is "always have a match available" — neither excluding AI nor excluding multiplayer was acceptable.

The question: should the strategy be (a) port AI only, drop multiplayer; (b) build multiplayer only, drop AI; or (c) support both?

## Decision

**Implement dynamic Player 2 selection per match: prefer live matchmaking (human opponent via 2-device multiplayer), fall back to AI after a configurable timeout (e.g., 10–30s waiting).**

This means:
- On "New Game", show a guest login screen (no saved account needed — anonymous auth)
- Attempt to match against a waiting human player (via a matchmaking queue)
- If no match arrives within timeout, spawn a tuned AI opponent and proceed
- If a human joins the queue while AI is loading, still prefer the human once available

This approach:
- Keeps matchmaking infrastructure minimal (a simple queue, no rooms/state machines)
- Reuses the existing AI controller (ported with tuning as a later phase)
- Prioritizes human play (which is more engaging) without blocking on it
- Allows solo play to always be available, with zero latency penalty if human play fails

## Consequences

**Positive:**
- Players never "waiting for opponent" — always a game ready to play
- Scales from 0 to many concurrent players without architectural change
- Matches user's stated goal exactly
- Can be phased: multiplayer first, AI fallback added later

**Negative:**
- Requires backend infrastructure (matchmaking queue + auth) — new operational surface
- AI opponent tuning is a separate effort (but can be deferred)
- Introduces latency/network dependency for the happy path (human match)
- Needs concurrency/race-condition handling (e.g., both human and AI accept match simultaneously)

**Later work implied:**
- Phase 0: Backend + anonymous auth (Firebase/Supabase recommended in ADR-0002)
- Phase 1: Port + tune AI from desktop
- Phase 2: Session start/end screens (currently stubbed in mobile)
- Phase 3: Handle edge cases (both players accept, one disconnects mid-game, etc.)
