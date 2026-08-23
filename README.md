# PradhanMantri Elections Game — Mobile Edition

A turn-based election simulation game on a mobile-first interactive India map. Players invest resources in states, manage regional dominance bonuses, and deploy special powers and rally tokens to shift vote share. Play vs. AI opponent or local hotseat on any device. Built with vanilla HTML/CSS/JavaScript for iOS and Android via Capacitor.

## Quick Start

1. **Clone and navigate:**
   ```bash
   git clone <repo>
   cd "PradhanMantri Elections Game Mobile"
   npm install
   ```

2. **Run the tests and live server:**
   ```bash
   npm test              # Run regression test suite (5 full games + all special powers)
   npm run serve         # Live-reload dev server at http://localhost:8000
   ```

3. **Play the game:**
   - Open `http://localhost:8000/mobile/index.html` in your browser, or add to iPhone home screen via `http://<your-machine-ip>:8000/mobile/index.html`
   - Game runs entirely in `mobile/index.html` (Booth Ink UI) wired to the real engine in `mobile/engine.js` and `mobile/game.js`
   - Start from the welcome screen (full-bleed poster background, "Begin Campaign" button), then select your politician, then play vs. AI or hand the phone to Player 2 for local hotseat mode
   - Tap states to invest funds, use rally tokens for regional boosts, activate special powers, and pursue regional dominance bonuses
   - First player to 272/543 seats wins

**Current build:** `mobile/index.html` (Booth Ink UI "Refined Booth Ink" redesign, fully engine-integrated — this filename was `index-redesign-a.html` until 2026-08-22, when it was promoted to be the one and only `mobile/index.html`). Deploys to the public fresh repo (`github.com/pradhanmantrielectionsgame/mobile`) are built by `scripts/deploy-mobile.js`, which assembles a filtered copy (game files + assets/data/sounds only, no legacy desktop code) into a git worktree and pushes it — see that script for details.

## Installation

**Prerequisites:**
- Node.js 16+ (for dev server, testing, and package scripts)
- Modern browser (Chrome 90+, Safari 14+) or iOS/Android device
- Playwright (included in `package-lock.json` via `npm install`)

**Setup:**
1. Clone the repo and run `npm install`
2. Verify `mobile/`, `data/`, `assets/` directories are in place
3. Run `npm test` to validate the build with the regression test suite
4. Run `npm run serve` to start the dev server

**Local dev server (testing on device):**
```bash
npm run serve
# Then visit http://localhost:8000 from your device, or
# http://<your-machine-ip>:8000 for testing from another device on the same LAN
```

**Playwright testing (screenshots, automated checks):**
```bash
npm test              # Runs simulate.js regression suite
# For visual checks: use Playwright's devices['iPhone 14'] profile
# Note: viewport is 390×664 (content height with Chrome), not 844px device height
```

## Usage

### Game Setup

1. **Welcome screen** — see the campaign poster (PradhanMantri Elections branding), then tap "Begin Campaign" to proceed
2. **Politician select** — choose your politician (defines your 4 agenda commitments + unique special power)
3. **Choose opponent** — play solo vs. AI, or select "local hotseat" for 2-player on one device
4. **Game begins** — 10 phases of investment and power deployment

### In-Game Controls

- **Single-tap a state** → select it (shows detail panel) · **Double-tap to invest** your current funds into that state's popularity share
- **Agenda buttons** (corner-right, always visible) → commit funds to that politician's signature policies (instant, per-tap scaling); color-coded per politician
- **Rally tokens** (corner-right fixed grid) → tap state-specific rally or Nationwide Rally to deploy a token (one-time +5% boost per state); persistent colored markers show rally history on map
- **Special power button** (corner-right, below rally tokens) — activate your politician's unique power (one use per game, unlocked after token crafting prerequisites)
- **Group overview** (bottom info panel) — tap to toggle between single-state detail view and LED-indicator grid showing your leading states (50%+ threshold) in each region
- **UT quick-invest buttons** (bottom-left) — invest in multiple small union territories at once

**Local hotseat:** Hand the phone to Player 2 after each phase; the game handles turn rotation automatically.

### Game Phases & Win Condition

- **10 total phases** — each phase, both players spend budget, commit to agendas, and deploy tokens/powers
- **Phase structure** — investment, rally, agenda, power actions; then next player's turn (AI or human)
- **Win condition** — first player to 272/543 seats (majority) wins the election; checked at phase end
- **Dominance bonus** — controlling all states in a region (50%+ popularity in every state) earns a one-time lump-sum bonus

### Interactive Tutorial

New players can opt into a multi-stage guided tutorial that walks through the core mechanics:

- **Select-screen tutorial** (5 steps) — introduced via a "How to Play" entry button; covers browsing politicians, tapping agendas, reviewing special powers, and a gated first play
- **In-game tutorial** (19 steps) — activates automatically on your first game; gates actions sequentially with live game-state checks (direct cash investment in a target state, rally tokens, agenda commitment, regional dominance strategy)
- **Automatic pacing** — phase timer and AI opponent auto-pause during tutorial steps, so you're never rushed while learning
- **Deterministic path** — always takes the same starting-position draw and uses dynamic funds grants to ensure success regardless of random RNG

Both tutorials are fully optional — skip by completing the final step or closing the tutorial overlay. Tutorial mechanics (seeded RNG, dynamic grants) are only active in tutorial mode; regular games play with normal randomized starts.

### Board State

- **Header** — player politician names + party symbols, funds, seats held, current phase
- **Map** — interactive SVG showing states, colored by current leader and margin intensity (|P1% − P2%|); persistent rally-token markers show where tokens were played
- **Bottom info panel** — toggles between (1) single-state detail view (popularity breakdown, current leader) and (2) group LED-indicator grid (per-state leading indicators for all states in chosen region, with 2-letter state codes)
- **Timer pill** — turn countdown and phase indicator

## Build Outputs

**No artifacts written at runtime** — the game is entirely in-memory. All tunable parameters (economy constants, politician roster, state groupings, policy magnitudes) live in `data/*.json` config files and are loaded at startup.

**Test outputs:**
- `npm test` runs `mobile/simulate.js`: executes 5 full 10-phase games plus all 20 politicians' special powers, validating that bps/seat totals stay consistent throughout (success = all assertions pass)
- Screenshot/browser testing: use `npm run serve` + device browser, or Playwright's webkit engine with `devices['iPhone 14']` for Safari-specific checks

## Architecture & Decisions

### Technology Stack

- **Frontend:** Vanilla HTML5 + CSS Grid (responsive) + JavaScript (ES6)
- **Map asset:** SVG (interactive, clickable states)
- **Styling:** CSS animations (UI chrome, phase transitions)
- **Distribution:** Web-first (Claude Artifacts, local server); Capacitor wrap for iOS App Store + Google Play Store

### Key Architectural Decisions

| Decision | Status | Rationale |
|----------|--------|-----------|
| [ADR-0001: Player 2 Matchmaking with AI Fallback](docs/adr/0001-player2-matchmaking-fallback.md) | Accepted | Prefer live multiplayer, fall back to AI after timeout — matches "always have a game" requirement |
| [ADR-0002: Firebase/Supabase Backend](docs/adr/0002-firebase-matchmaking-backend.md) | Accepted | Zero-ops, anonymous auth, free tier covers hobby scale |
| [ADR-0003: Capacitor (not React Native/Flutter)](docs/adr/0003-capacitor-native-distribution.md) | Accepted | Preserve DOM/CSS/SVG fidelity; game is turn-based, not real-time |
| [ADR-0004: Instant-Effect-Only Special Powers](docs/adr/0004-instant-effect-special-powers.md) | Accepted | Convert all power effects to instant lump-sum equivalents; robustness against game-length changes |
| [ADR-0005: Token Economy as Unlock Gate](docs/adr/0005-token-economy-unlock-gate.md) | Accepted | Gate special powers via rally-token crafting; symmetric opportunity regardless of game state |
| [ADR-0006: Hung Parliament Tie Resolution](docs/adr/0006-hung-parliament-tie-resolution.md) | Accepted | Draw vs. human opponent, Loss vs. AI fallback; ensures fairness in human-vs-human, incentivizes multiplayer |
| [ADR-0007: Single-Player vs. AI Scope](docs/adr/0007-single-player-ai-scope.md) | Accepted | Built single-player-vs-AI only this session; deferred human matchmaking backend to Phase 0. Prioritizes end-to-end design validation + playable game on day 1 |
| [ADR-0008: Additive Config Schema Evolution](docs/adr/0008-additive-config-schema-evolution.md) | Accepted | Preserved backward compatibility with legacy desktop build via new `mobileEconomy` namespace, rather than restructuring entire `game-config.json` |
| [ADR-0009: Special Powers — Instant or One-Phase](docs/adr/0009-special-powers-instant-or-one-phase.md) | Accepted | Clarified instant-only rule: powers may resolve instantly OR last exactly one phase; longer durations remain banned. One-phase effects need only one self-clearing flag; longer effects require genuine expiry tracking (real complexity) |

## Project Documentation & References

**Authoritative Design Reference:**
- **`design/economy-status-map.md`** — single source of truth for all finalized game design decisions including: core loop structure, win condition (272/543 seats), starting-position randomization, redistribution rule with basis-point precision, investment/rally/agenda/dominance/special-power mechanics, full 20-politician roster with powers, and plausibility proofs showing ~99-seat idealized advantage vs. AI opponent.

**Project Wiki & Discovery Log:**
- **`docs/wiki.html`** — comprehensive project wiki (Claude Artifact) consolidating game mechanics reference for players, architecture/implementation guide for developers, and the full divergence/discovery log from game development sessions. Serves as an exploratory companion to the authoritative design doc.

**Architecture Decisions:**
See the "Key Architectural Decisions" table above for framework selection, multiplayer strategy, and tech stack choices.

## Current Status

**Game Engine (Complete):** `mobile/engine.js` + `mobile/game.js` + `mobile/index.html` form a fully playable, single-player-vs-AI game. All 10-phase loop, economy mechanics (investment, rally, agenda, dominance), special powers, and AI opponent are functional and validated via regression tests (`mobile/simulate.js`).

**Game Design (Finalized):** All mechanics specified in `design/economy-status-map.md` (authoritative reference for economy scale, phase count, starting position, redistribution rule, agenda/rally/dominance/special-power formulas, 20-politician roster with verified powers, and plausibility validation showing ~19-seat passive-opponent margin).

**Data Layer (Complete):** 
- `data/game-config.json` — extended with `mobileEconomy` namespace (phases=10, starting funds, refresh rate, costs, rally boost, dominance payout)
- `data/politicians-data.json` — all 20 politicians with 4 signature agendas + 1 special power each; powers have concrete cost/benefit tradeoffs
- `data/states_data.json` — 28 states + 8 UTs, 15 regional groups, live-fetched by the game
- `data/policy-tags.json` — 32 policies with per-region effect magnitudes (after tagEffects migration and 2026-08-21 expansion), consistency-checked via `check_data_consistency.js`

**UI (Complete for MVP):** `mobile/index.html` (Booth Ink skin) wired to real engine; includes politician select (with dynamic player colors), end-game overlay, fixed corner-right action buttons (agenda/rally/special power), bottom info panel toggle (state detail ↔ group LED grid), persistent rally-token map markers, AI action animations.

**Testing (Complete):** `mobile/simulate.js` regression suite validates 5 full 10-phase games + all 20 politicians' special-power activations, asserting bps/seat invariants throughout. Run via `npm test`.

**Multiplayer (Deferred):** Single-player vs. AI only for this build. Human matchmaking backend (Firebase/Supabase) planned per ADR-0001/ADR-0002. Local hotseat (pass-the-phone) available now. **A full implementation-ready plan exists at `design/multiplayer-implementation-plan.md`** (written 2026-07-28) — event-sourced action-log sync over Firebase Realtime Database, reusing the existing `mobile/game.js` action functions (already pure, playerKey-agnostic). Point a future session at that file to resume implementation with no re-design needed.

**Next phases:**
- **Phase 0:** Firebase Realtime DB + seeded PRNG setup; determinism verification
- **Phase 1:** Direct match-code MVP (create/join by code, skip full matchmaking queue)
- **Phase 2:** Full ADR-0001 matchmaking queue with timeout → AI fallback
- **Phase 3:** Presence/reconnect + grace-period AI takeover (deferred, needs `aiStep` refactor)
- **Phase 4+:** Capacitor wrapping, session persistence, competitive/ranked mode (if multiplayer gains traction)

See `docs/wiki.html`'s "Architecture" section for current tech stack, deployment status, and open items.

**Live deployment:** the mobile build ships from a dedicated repo, `github.com/pradhanmantrielectionsgame/mobile` (GitHub Pages, served at `pradhanmantrielectionsgame.github.io/mobile/`) — separate from this repo's own `origin` remote, which is a live Pages site still serving the legacy desktop game and is never merged into.

## Known Limitations

- **Single-player vs. AI only** — no live human multiplayer backend yet (Phase 0, planned for later); local hotseat available via pass-the-phone
- **No session persistence** — game state lives only in memory during a single session; no save/resume or stats tracking across sessions
- **16 of 20 politicians lack a dedicated power-activation sound clip** — falls back to a generic fanfare sound instead
- **Special-power balance provisional** — all 20 politicians have powers with magnitude numbers assigned; these are first-pass numbers pending real playtesting and balance refinement
- **Small UTs require dedicated buttons** — Delhi, Chandigarh, Puducherry, Lakshadweep, Andaman & Nicobar, Dadra & Nagar Haveli/Daman & Diu are not directly tappable on the map (too small); they route through button-cluster pattern at bottom-left (confirmed production-ready)

## Mobile Development Notes

### CSS & Rendering Gotchas

1. **Grid shrink-to-fit sizing bug** — CSS Grid with `grid-template-columns: repeat(Nfr)` and no explicit container width silently overrides declared item sizes. Always give the grid container an explicit, screen-relative width (e.g., `min(calc(100% - Npx), cap)`).
2. **Charset declaration required** — every HTML file must declare `<meta charset="UTF-8">` as the first tag. Claude Artifacts set this via header; local dev servers do not. Without it, emoji and ₹ symbols render as mojibake.
3. **Viewport meta tag and Safari fallback mode** — `mobile/index.html` intentionally has no `<meta name="viewport">` tag because Booth Ink's fixed-height chrome (~755–765px) relies on Safari's fallback virtual-canvas mode (~980px). Do not add a viewport tag without first trimming chrome density or confirming standalone/installed mode.
4. **Playwright iPhone 14 viewport depth** — the preset's `viewport` field is 390×664 (content height with Chrome), not 844px (device height). When evaluating layout fit, use 664px as the usable height, not 844px.
5. **SVG map selector targeting** — Uttarakhand, Ladakh, Himachal Pradesh each render as both a `<path>` boundary and a `<circle>` overlay (duplicate ID). Any map interaction must query `path[id], circle[id]` together, or these states will be silently skipped.

## Future Work

- **Phase 0** — Firebase/Supabase matchmaking backend + anonymous auth setup (per ADR-0001/0002)
- **Phase 1** — Wire Player 2 selection screen to real matchmaking queue; implement human-vs-AI detection and connection handling
- **Phase 2** — Capacitor wrapping + iOS/Android app store build pipeline
- **Phase 3** — Session persistence, stats tracking, player profiles (if multiplayer proves sticky)
- **Phase 4** — Dedicated power-activation sound clips (16 of 20 still missing), balance tuning via real playtesting, edge-case error handling (disconnects mid-game, etc.)
- **Phase 5+** — Consider adding: a tutorial/onboarding flow, replay viewer, leaderboards, seasonal events (if multiplayer takes off)

## Troubleshooting

**Emoji/₹ symbol shows as mojibake** — Ensure `<meta charset="UTF-8">` is present in the HTML file's `<head>` (first tag). If using Python's `http.server` or a host that doesn't set charset headers, the browser will misinterpret the encoding.

**Rally system not working after config change** — Verify `game-config.json` includes `regularTokenBoost` and `specialTokenBoost` properties. The config is loaded synchronously at app startup; missing properties will fail with a clear error message.

**Map looks too small on device** — In the Claude Artifact viewer, the actual rendered area looks compressed because the viewer adds its own chrome. Test on a real device via local server (`http://<ip>:8000`) to see true proportions. See "CSS & Rendering Gotchas" above.

## References

- [Keep a Changelog](https://keepachangelog.com/) — changelog format
- [Semantic Versioning](https://semver.org/) — version numbering
- [ROADMAP.md](ROADMAP.md) — planned phases and effort estimates (generated as external Claude Artifacts)

## License & Attribution

Built by Samit Watve. Part of sidegig portfolio for game development + AI tool exploration.
