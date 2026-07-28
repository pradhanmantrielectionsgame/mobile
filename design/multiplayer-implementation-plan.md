# Multiplayer Implementation Plan — Real-Time 2-Player-Over-Internet

**Status: approved architecture, not yet built.** This is the implementation-ready plan for resuming ADR-0001/0002 (live human matchmaking, deferred by ADR-0007 until the single-player game was done — it now is). Point a future Claude session at this file and say "implement Phase 0" (or whichever phase) to pick this up with no further design discussion needed — all the research and decisions below are already made.

Written 2026-07-28 after a research pass over the actual current code (`mobile/game.js`, `mobile/main.js`, `mobile/engine.js`) plus ADR-0001/0002/0007. Line numbers below were spot-checked against source at write time; re-verify with a quick grep if this file is picked up much later and the code has moved on.

## Decisions locked in (don't re-litigate these)

- **Backend: Firebase Realtime Database + Anonymous Auth.** (Supabase remains an architecturally-equivalent fallback per ADR-0002 if Firebase turns out to be a blocker for some reason — same design, different API calls — but default to Firebase unless told otherwise.)
- **Sync model: event-sourced action log**, not state-snapshot sync, not server-authoritative simulation. See "Why" below.
- **Disconnect behavior for MVP (Phase 1/2): match just ends.** Grace-period-then-AI-takeover is explicitly Phase 3, deferred — it requires a real refactor (`aiStep` becoming playerKey-parameterized instead of hardcoded to `p2`), not a toggle.
- **Deploy stays build-free**: Firebase's "compat" SDK build via CDN `<script>` tag, not the modular/ES-module SDK. No bundler introduced.
- **First buildable slice is Phase 1's direct-match-code MVP**, not the full matchmaking queue — skip ADR-0001's queue/timeout complexity until Phase 1 is proven working end to end.

## Prerequisites — user must do these before Phase 0 code can be tested live

These need a real Google account and can't be done by Claude:

1. Go to https://console.firebase.google.com, create a new project (free, no credit card).
2. Enable **Realtime Database** (not Firestore) and **Anonymous Authentication** in the project.
3. In Authentication settings, add authorized domains: the GitHub Pages domain this repo deploys to, plus `localhost` for local testing.
4. Copy the project's web config object (a small JSON of public IDs, not secrets) from Project Settings → General → "Your apps" → Web app.
5. Hand that config to Claude (or drop it in a new untracked file, e.g. `mobile/firebase-config.local.js`, gitignored) so it can be wired into `net.js`.

Claude can write and structurally test all the Phase 0 code without this (e.g. the seeded-PRNG determinism check runs in plain Node with no Firebase dependency), but end-to-end live sync testing needs a real project.

## Why this architecture (condensed reasoning)

- All game state is one plain object `game`, built by `createGame` (`mobile/game.js:132`). Action functions — `investCash` (:273), `playRallyToken` (:291), `tapAgenda` (:337), `activatePower` (:412), etc. — are pure, side-effect-free, playerKey-agnostic mutators: `(game, playerKey, ...args) → {ok, reason?}`. No DOM, no sound, no `console`.
- The AI opponent (`aiStep`, `mobile/game.js:609`, `runAIFull` :684) is not a separate code path — it calls those exact same functions with `playerKey='p2'`. A remote human's actions replay through the identical seam.
- `mobile/engine.js`'s `resolveSimultaneousGain` already resolves two players' actions landing on the same state in the same phase — the engine already assumes concurrent two-sided play.
- Given all of the above, an **ordered log of `{type, playerKey, args}` records**, replayed through the existing action functions in order on both clients, is a near-zero-abstraction serialization of what already happens on every tap. Rejected: full state-snapshot sync (expensive per-write; `game.rng` isn't serializable anyway); server-authoritative Cloud Functions simulation (duplicates working client logic, needs a paid/ops-heavier Firebase tier, contradicts ADR-0002's "zero server to host" rationale).

## Architecture summary

**1. Sync model.** Each match gets `matches/{matchId}/actions/{pushId}` — an append-only ordered list. Every local action is applied to the local `game` immediately (instant UI feedback) *and* published to this list. Every client's subscriber (including the actor's own, for one code path) replays entries in log order through the existing `G.investCash`/`G.tapAgenda`/etc. functions via a small dispatch table.

**2. Determinism.** `game.rng` is currently seeded with `Math.random` (`main.js:408`) — not shareable across two devices. Add a small deterministic seeded PRNG (~10 lines, e.g. mulberry32) with the identical `()=>[0,1)` contract `engine.js`/`game.js` already expect. Match creator generates a random seed, writes it once to `matches/{matchId}.seed`; both clients call `createGame(data, p1Id, p2Id, seededPRNG(seed))`. No changes needed inside `engine.js` — the injection point already exists. Both players' politician picks must also flow through the match record (today `main.js:404-407` auto-picks `p2Id` randomly — needs a real "player 2 picks their own politician" UI path for human mode).

**3. Phase timer.** Replace local `setInterval` countdown (`main.js:513-546` `startPhaseTimer`/`resumePhaseTimer`/`doEndPhase`) with a shared deadline: write `matches/{matchId}.phaseDeadline = ServerValue.TIMESTAMP + phaseDurationSeconds*1000` once per phase start, both clients compute remaining time from that fixed point using Firebase's `.info/serverTimeOffset`. Phase advancement (`doEndPhase`) becomes a log entry too — whichever client's countdown hits zero first publishes an `endPhase` event, both clients' subscribers apply it identically, rather than each client unilaterally deciding locally.

**4. AI pacing bypass.** `scheduleAITick`/`planAITickPacing` (`main.js:470-508`) exist solely to keep the AI from acting faster than a human could (CLAUDE.md: never give AI an instant-catchup advantage) — this has no meaning in human-vs-human. Add `game.p2Mode: 'ai' | 'human'`. `startGame()` (`main.js:399`) branches: `'ai'` keeps today's exact path unchanged; `'human'` skips `scheduleAITick` entirely and instead subscribes to the action log, applying remote entries as they arrive. All branching stays in `main.js`/`net.js` — `game.js`/`engine.js` stay untouched by networking concerns.

**5. Matchmaking (Phase 2, not MVP).** `queue/{uid}: {joinedAt, politicianId}`. Transaction-guarded match creation to avoid two clients double-claiming each other. Local timeout (~10-30s) spawns today's existing local-AI game if no human found — this needs zero new backend state, it's just today's `createGame(..., Math.random)` path. Best-effort recheck for "a human match just appeared" before committing to the AI spawn, to catch the race ADR-0001 already flags as acceptable to handle non-airtight.

**6. Disconnect/reconnect.** No save/load exists today and none should be built for its own sake — `(data, seed, p1Id, p2Id, actionLog)` deterministically reconstructs current state, so reconnecting = re-run `createGame` + replay the full action log from `matches/{matchId}/actions`. Presence via Firebase's `onDisconnect()`. MVP behavior: a disconnect just ends the session (acceptable — these are friends presumably in voice/text contact). Grace-period-then-AI-takeover is Phase 3 only.

**7. Security rules.** Scope reads/writes to the two match participants (`auth.uid` matching `player1Uid`/`player2Uid`), pin each action write's `playerKey` field to the writer's own slot. No server-side game-legality validation — client-authoritative, accepted per ADR-0002's "ephemeral state, no stats, no stakes" framing. Revisit only if a competitive/ranked mode is ever added.

**8. New file: `mobile/net.js`.** Loaded after `game.js`, before `main.js` in `mobile/index.html`'s script tags — same plain-script/IIFE pattern as the existing three files. Depends only on `game.js`'s public `G.*` functions and the Firebase SDK global; `game.js`/`engine.js` never reference it (keeps the engine backend-agnostic, still testable via `npm test`'s existing Node self-checks with zero network dependency).

## Concrete schema (Firebase Realtime Database)

```
queue/{authUid}: { joinedAt: ServerValue.TIMESTAMP, politicianId }

matches/{matchId}: {
  player1Uid, player2Uid,
  player1PoliticianId, player2PoliticianId,
  p2Mode: 'pending' | 'human' | 'ai',
  seed,
  phaseDeadline,
  createdAt: ServerValue.TIMESTAMP,
  status: 'waiting' | 'active' | 'complete'
}

matches/{matchId}/actions/{pushId}: { type, playerKey, args, publishedAt }

matches/{matchId}/presence/{uid}: true   // removed via onDisconnect()
```

Security rules sketch (RTDB rules, not Firestore — adapt syntax if Supabase is chosen instead):

```json
{
  "rules": {
    "queue": {
      "$uid": {
        ".read": "auth != null",
        ".write": "auth != null && auth.uid === $uid"
      }
    },
    "matches": {
      "$matchId": {
        ".read": "auth != null && (data.child('player1Uid').val() === auth.uid || data.child('player2Uid').val() === auth.uid || !data.exists())",
        ".write": "auth != null && (!data.exists() || data.child('player1Uid').val() === auth.uid || data.child('player2Uid').val() === auth.uid)",
        "actions": {
          "$pushId": {
            ".write": "auth != null && (root.child('matches/'+$matchId+'/player1Uid').val() === auth.uid || root.child('matches/'+$matchId+'/player2Uid').val() === auth.uid) && newData.child('playerKey').val() === (root.child('matches/'+$matchId+'/player1Uid').val() === auth.uid ? 'p1' : 'p2')"
          }
        },
        "presence": {
          "$uid": { ".write": "auth != null && auth.uid === $uid" }
        }
      }
    }
  }
}
```

## Phased build plan (each phase should ship + be verified before starting the next)

### Phase 0 — plumbing, invisible to players
- Add Firebase "compat" CDN `<script>` tags to `mobile/index.html` (before `net.js`).
- Create `mobile/net.js`: `initAuth()`, `seededPRNG(seed)`.
- Swap `main.js:408`'s `Math.random` for an injectable seed (default to `Math.random`-derived seed for single-player, explicit shared seed for multiplayer).
- **Verify**: extend `engine.js`'s existing Node self-check (or a small new script) to assert two independently-constructed `game` objects built from the same seed produce byte-identical `game.pop`. No Firebase project needed for this check.

### Phase 1 — minimal "two friends can play" MVP
- Direct match-code flow only (create/join by code) — explicitly skip the matchmaking queue.
- `net.js`: `publishAction(matchId, type, playerKey, args)`, `subscribeToActions(matchId, onRemoteAction)`, a dispatch table mapping `type` → the corresponding `G.*` function.
- `main.js`: `startGame()` branches on `p2Mode`; the existing hardcoded-`'p1'` action call sites (`main.js` ~927/993/1012/1028/1033/1045/1073/1157/1170) each also call `Net.publishAction(...)` alongside the existing local `G.*(...)` call.
- Shared phase-deadline countdown (§3 above) replacing local timer.
- Politician-select UI extended so the joining player picks their own politician (replacing today's auto-pick-for-p2 at `main.js:404-407` for the human-mode case only — AI mode keeps auto-pick).
- No reconnect handling — a dropped connection just ends the session.
- **Verify**: two devices/browsers, each with the match code, play a full match against each other — correct synced state, phase timing, end screen. This is the milestone that proves the whole design works.

### Phase 2 — full ADR-0001 matchmaking
- Real queue (`queue/{uid}`, transaction-guarded match creation, timeout → local AI spawn, late-human-preempts-AI recheck).
- Session/waiting-room UI.

### Phase 3 — polish (explicitly deferred, don't build unless asked)
- Presence detection + reconnect via full log-replay.
- Grace-period-then-AI-takeover on mid-game disconnect (needs `aiStep` playerKey-parameterization — a real refactor, budget it as its own task).
- Spectator mode, richer waiting-room UI, connection-status indicators.
- Server-side action validation (Cloud Functions) if a competitive/ranked mode is ever added.

## How to resume this

Tell Claude: *"Read `design/multiplayer-implementation-plan.md` and implement Phase 0"* (or Phase 1, once Phase 0 is done and the Firebase project exists). The prerequisites section above needs to be done by you first if it hasn't been already — Claude can't create the Firebase project itself.
