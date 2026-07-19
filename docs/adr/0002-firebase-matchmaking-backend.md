# ADR-0002: Firebase/Supabase for Matchmaking Backend

## Status
Accepted

## Context

This session confirmed that the mobile game needs a backend for:
- Matchmaking queue (per ADR-0001)
- Anonymous guest authentication (no saved player accounts)
- Ephemeral match state (no need to persist stats, no user profiles)

The three canonical approaches:
1. **Custom Node.js + WebSocket (socket.io or ws)** — full control, pay for hosting/ops
2. **Colyseus** — purpose-built game rooms framework, still requires hosting a Node process
3. **Firebase Realtime Database or Supabase** — serverless, included auth, free tier covers hobby scale

## Decision

**Use Firebase Realtime Database with anonymous auth** (or Supabase as a FOSS alternative with identical architecture).

Rationale:
- **Zero server to host or maintain** — Firebase is a managed service; Supabase runs on Postgres but abstracts ops away
- **Anonymous auth included for free** — perfect fit for "guest, no saved stats" requirement
- **Free tier easily covers friends-scale usage** — Realtime Database quota is generous; Supabase's free tier is similar
- **Minimal learning curve** — REST API is familiar; JavaScript SDK is battle-tested
- **Scales from 1 to 10,000 concurrent players** without architecture changes (pay-as-you-go beyond free)
- **No stateful processes to restart or debug** — Firebase/Supabase are not your ops problem

Comparison (relevant for our constraints):

| Factor | Custom Node | Colyseus | Firebase | Supabase |
|--------|------------|----------|----------|----------|
| **Hosting cost** | $5–50/mo | $5–50/mo | $0–20/mo | $0–10/mo |
| **Dev ops burden** | High (restart, logs, scale) | Medium (manage Node, rooms) | None | Low (Postgres monitoring) |
| **Auth included** | No (DIY) | No (DIY) | Yes (anonymous, email, etc.) | Yes (Postgres auth, email) |
| **Realtime sync** | ✓ | ✓ | ✓ Realtime DB | ✓ Postgres + PostgREST |
| **Effort to set up** | 2–4 weeks | 1–2 weeks | 2–4 hours | 2–4 hours |
| **Lock-in risk** | Low (standard Node) | Medium (Colyseus patterns) | Medium (Firebase SDK) | Low (standard Postgres) |

(Custom Node and Colyseus are included for completeness; both require you to run/manage the server.)

## Consequences

**Positive:**
- Game can launch multiplayer with zero infrastructure ops
- Anonymous auth means no email, password reset, GDPR complexity — just a UUID
- Free tier is generous enough for development and friends-scale play
- Can migrate off Firebase later if needed (Realtime Database is just REST + JSON)

**Negative:**
- Vendor lock-in (Firebase is Google; Supabase is open-source but hosted)
- Realtime Database has limited querying (no complex joins, no aggregation)
- Late-stage schema changes can require data migration (though early iterations are fine)
- Firebase cost scales with traffic; past hobby scale, consider Colyseus or a custom solution

**Later work implied:**
- Set up Firebase project, enable Realtime Database + anonymous auth
- Design matchmaking queue schema (minimal: `{matchId, player1Id, player2Id, state, createdAt}`)
- Implement match lifecycle (create → waiting → both ready → game → complete → delete)
- Handle race conditions (both human and AI accept the same match)
