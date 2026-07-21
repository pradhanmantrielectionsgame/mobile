# PradhanMantri Elections Game — Mobile Edition

A turn-based election simulation game on a mobile-first interactive India map. Players invest resources in states, manage regional dominance bonuses, and deploy rally tokens to shift vote share. Built with vanilla HTML/CSS/JavaScript for iOS and Android via Capacitor.

## Quick Start

1. **Clone and navigate:**
   ```bash
   git clone <repo>
   cd "PradhanMantri Elections Game Mobile"
   ```

2. **Serve locally:**
   ```bash
   python -m http.server 8000
   ```
   Then open `http://localhost:8000` or add to iPhone home screen via `http://<your-ip>:8000` (current game build at `index.html`).

3. **Play the current build:**
   - Tap states to invest
   - **Shift+Click** a state to alternate players (local hotseat; no AI opponent yet)
   - Use group filter bar to show/hide state groups
   - Rally token buttons boost a state (regular) or nationwide (special)

**Note:** The game engine (js/, data/, assets/, index.html) is functional and working. A redesigned mobile UI (Booth Ink, in `design/prototypes/pme-mobile-sheet.html`) is in progress per `design/plan.md` — the old Shift+Click/Alt+Click controls below apply to the current index.html build, not the incoming redesigned UI.

## Installation

**Prerequisites:**
- Python 3.x (for local dev server) or Node.js (for production hosting)
- Modern browser (Chrome 90+, Safari 14+) or iOS/Android device

**Setup:**
1. Ensure `index.html`, `styles.css`, `app.js`, `game-config.json`, and all asset files are in place
2. Add `<meta charset="UTF-8">` to every HTML file — required for proper emoji/₹ symbol rendering on non-Claude hosting
3. Declare viewport explicitly: `<meta name="viewport" content="width=device-width, initial-scale=1">`

**Local dev server (testing on device):**
```bash
python -m http.server 8000
# Then visit http://<your-machine-ip>:8000 from your phone
```

## Usage

### Controls (Current index.html Build)

- **Tap a state** → invest your Player budget into that state's popularity
- **Shift+Click a state** → alternate to Player 2 (local hotseat, no AI opponent yet)
- **Alt+Click a state** → open rally token menu
- **Ctrl+Click a state** → info-only (no interaction)
- **Rally button** (bottom-right) → open rally token picker; tap token to boost one state
- **Special rally button** → deploy special rally token (5% probability per phase) for nationwide boost
- **Group filter bar** (under header) → toggle visibility of state groups (political alliances)
- **UT (Union Territory) panel** (bottom-left) → batch-invest into all small UTs at once

**Note:** The redesigned Booth Ink UI (coming in Phase 1 per `design/plan.md`) will replace these keyboard-based controls with a touch-first tray-based interaction pattern.

### Game Phases

1. **Investment phase** — both players spend budget on states
2. **Dominance check** — calculate regional bonuses (>50% popularity in any group)
3. **AI or Player 2 turn** — if multiplayer enabled, opponent plays (currently same-device hotseat via Shift+Click)

### Board State

- **Header** — player funds, seats held, current phase
- **Map** — interactive SVG showing states, colored by current leader
- **Info panel** — selected state details and group membership
- **Timer pill** — turn countdown and phase indicator

## Artifacts

**Generated/cached files (none per run):**
The game uses `game-config.json` for all tunable parameters (rally token boosts, player starting funds, regional bonus amounts). No artifacts are written to disk during play — all state is in-memory or browser LocalStorage (if sessions persist).

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

## Current Status

**Game Engine:** Functional and stable. The game logic (`js/*.js`, `data/`, assets) is working and not being rewritten. All current work is UI-focused.

**UI Migration:** Redesigned mobile UI direction is Booth Ink (`design/prototypes/pme-mobile-sheet.html`). This is a new UI skin replacing the old index.html/styles.css, not a replacement for the game engine. The migration is planned in phases:
- **Phase 0** (PWA scaffolding) — Backend matchmaking setup, manifest.json, service worker. *Not yet started.*
- **Phase 1** — Booth Ink implementation, AI opponent port, session start/end screens
- **Phase 2+** — See `design/plan.md` roadmap for replayability redesign and content phases

For more detail, see `design/plan.md`.

## Known Limitations

- **No AI opponent yet** — Player 2 is same-device hotseat (Shift+Click in index.html) only; `ai-player-controller.js` from desktop is not ported
- **No session boundaries** — no welcome screen, game-over screen, or functional options menu (currently stubs)
- **Replayability design complete; implementation pending** — design/plan.md covers the full redesign (20-politician roster, special powers with instant cost/benefit tradeoffs, 3-flavor rally-token economy); code implementation is Phase 4+
- **Booth Ink UI not yet wired to real engine** — `pme-mobile-sheet.html` has UI/interaction only; operates on mock data, not the real js/* engine. Wiring starts Phase 1
- **Small UTs not directly tappable** — Delhi, Chandigarh, Puducherry, etc. route through button-cluster pattern (confirmed as production-ready, see findings.md)
- **SVG map undersized** — current `assets/icons/INDIA_V3_smaller_viewbox.svg` wastes ~27% of viewBox area; tightened viewBox would render 27% larger with zero crop risk

## CSS & Rendering Gotchas

1. **Grid shrink-to-fit sizing bug** — CSS Grid with `grid-template-columns: repeat(Nfr)` and no explicit container width silently overrides declared item sizes. Always give the grid container an explicit, screen-relative width (e.g., `min(calc(100% - Npx), cap)`).
2. **Charset declaration required** — every HTML file must declare `<meta charset="UTF-8">` (first tag). Claude Artifacts set this via header; local dev servers do not.
3. **Artifact viewer chrome distorts proportions** — Claude's ~150–200px title-bar makes a `flex:1` map look shorter than it will on a real device. Size against iPhone 14 viewport (390×844) assumptions, not the Artifact preview.

## Future Work

- **Phase 0** — Backend matchmaking (Firebase/Supabase) + anonymous auth setup
- **Phase 1** — Port + tune AI opponent from desktop codebase; integrate with Player 2 fallback logic
- **Phase 2** — Session start/end screens (welcome, game-over, player names)
- **Phase 3** — Error handling + edge cases (both players accept match, network disconnect mid-game)
- **Phase 4** — Implement replayability redesign: 20-politician roster, personal signature agendas (4 per politician), special powers with instant cost/benefit tradeoffs, 3-flavor rally-token economy (see design/plan.md for specification)

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
