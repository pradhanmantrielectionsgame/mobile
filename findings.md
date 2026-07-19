# Findings

## 2026-07-19 — Claude Artifacts cannot be true installable PWAs
**Finding:** The Claude Artifact runtime only exposes two capabilities (`downloads`, `mcp` — confirmed via the artifact-capabilities skill, contract 0.1.12). There is no way to host a separate `manifest.json` or register a service worker for a published artifact, so real installability (Android install banner, offline caching) is not achievable there. iOS Safari's legacy meta-tag-only standalone mode (`apple-mobile-web-app-capable`, `apple-touch-icon`, no manifest/service worker required) is the only way to get a full-screen home-screen launch from an artifact.
**Context:** User asked whether a published artifact could be made into a PWA for full-screen mobile testing of visual/interaction prototypes.
**Implication:** Fine for prototyping (already applied to the interactive mockups), but a real installable PWA still requires the actual project repo's own hosting (e.g. GitHub Pages) with a real manifest + service worker — this is unrelated to and doesn't substitute for Phase 0 of the mobile parity/PWA plan.

## 2026-07-19 — Real India map SVG wastes ~27% of its rendered area
**Finding:** `assets/icons/INDIA_V3_smaller_viewbox.svg` declares `viewBox="0 0 1000 1000"` (a square), but parsing every path's `d` attribute with a proper path-command parser (handling M/L/H/V/C/S/Q/T/A/Z, absolute and relative) shows the actual content only spans x:100–900, y:45.5–955 — a ~0.88 width:height aspect ratio baked inside a claimed 1:1 square, wasting roughly 10–19% margin per side.
**Context:** Investigated after the map still looked undersized on a phone-width mockup even after removing all UI overlays that had been covering it.
**Implication:** A tightened viewBox (`"84 27 833 946"`, verified against parsed coordinates) renders ~27% more map area with zero risk of cropping any state. Worth applying this same fix to the real game's map asset, not just prototypes — the underlying SVG file itself carries the bug, not any particular layout.

## 2026-07-19 — Small-UT click pattern already exists in production and should be reused
**Finding:** Both the desktop and mobile games already solve "some UTs are too small to tap directly on the map" with a dedicated button cluster (mobile's `index.html` → `union-territories-container`, grouped with the timer-pill overlay) covering exactly 6 UTs: Delhi, Chandigarh, DNH & DD, Puducherry, Lakshadweep, A&N Islands. Note `states_data.json` flags 8 total UTs (also J&K and Ladakh), but those two are large enough to tap directly — only the 6 above need the button-cluster workaround.
**Context:** Needed a way to make small UTs clickable in an interactive prototype; checked the real app's existing approach before inventing a new pattern.
**Implication:** Any future UT-interaction work (real game or further prototyping) should extend this existing button-cluster pattern rather than diverging from it — it's already validated in production.

## 2026-07-19 — Mobile's likely replayability root cause: static regional-dominance payoffs
**Finding:** The regional dominance bonus (>50% popularity across a whole state group → lump sum + recurring per-phase payout) has fixed group membership and fixed payout every match. Random starting popularity changes *where* a player happens to be leading but not *which lever is worth pulling* — so a learned opening ("rush South India") stays optimal in every game, forever.
**Context:** Reasoned from the actual bonus logic in `campaign-system.js` (`checkRegionalDominanceBonuses()`) plus `ROADMAP.md`'s group-bonus description, in response to the user's complaint that the game converges to 2–3 strategies after a few plays.
**Implication:** Highest-leverage replayability fix is randomizing which groups/values are "live" per match and giving random events real strategic teeth — not adding more static content.

## 2026-07-19 — Mobile has no AI opponent; "Player 2" is same-device hotseat
**Finding:** `app.js:53` — `const playerId = event.shiftKey ? 'player2' : 'player1'`. Player 2 has no decision-making logic at all; it's a second local input path via Shift+Click on the same device. Desktop's `ai-player-controller.js` (956 lines, the largest module in either codebase) was never ported to mobile.
**Context:** Discovered while auditing feature parity between desktop and mobile JS modules.
**Implication:** Any "vs AI" or matchmaking work must build/port real AI decision logic from scratch — current mobile behavior is not a stand-in for anything more than a second local input path.

## 2026-07-19 — Mobile has no session start/end; options menu is a non-functional stub
**Finding:** No welcome/setup screen exists (players hardcoded to Modi/BJP vs Rahul/INC in `index.html`), no game-over/results screen exists, and every option card in `app.js`'s `initOptionsModal()` (New Game, Toggle Sound, Toggle Music, Pause/Resume, Help, Random Events, Hard Mode) just calls `console.log` and closes the modal.
**Context:** Found via reading `app.js` and `index.html` while auditing what's implemented vs. stubbed for the desktop/mobile feature-parity audit.
**Implication:** The mobile build currently has no defined session boundary — treat it as a sandbox, not a completable game, until these are built (tracked as Phases 1, 3, 4 in the mobile parity/PWA plan artifact).

## 2026-07-19 — Regional dominance bonus is ported; random events, home bonus, action log are not
**Finding:** `checkRegionalDominanceBonuses()` in `campaign-system.js` correctly replicates desktop's group-bonus system. However, desktop's `random-events.js`, `home-state-bonus.js`, and `actions-log.js` have no mobile equivalent at all.
**Context:** Cross-referenced every desktop JS module against mobile's module list during the feature-parity audit.
**Implication:** Random events and home-state bonus work is purely additive (not blocked on anything else) and doubles as the main replayability lever — see the entry above.
