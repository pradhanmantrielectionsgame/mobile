# Findings

## 2026-07-19 — CSS Grid `1fr` tracks silently override declared pixel sizes when the grid container's width is undefined
**Finding:** `.groups-box` used `grid-template-columns:repeat(8,1fr)` with no explicit `width`, relying on CSS shrink-to-fit. The `.gchip{width:63px}` declared on each grid item was silently overridden — actual rendered icon size came from an accidental shrink-to-fit computation against the viewport, not the CSS value. It happened to look reasonable on the device it was screenshotted on, but nothing guaranteed that on a narrower or wider phone.
**Context:** Investigated after the user asked "what's the solution" for a floating icon bar being "problematic for some screen sizes."
**Implication:** Any future CSS Grid layout with `1fr` tracks in this project must give the grid container an explicit, screen-relative width (e.g. `min(calc(100% - Npx), cap)`) or use `aspect-ratio` on items — never leave sizing to shrink-to-fit when a declared pixel size needs to actually hold.

## 2026-07-19 — Standalone HTML prototypes need an explicit `<meta charset="UTF-8">`
**Finding:** The mobile-first prototype files rendered correctly via Claude's Artifact hosting (which sets a proper `Content-Type: text/html; charset=utf-8` header) but produced full mojibake — every emoji, the ₹ symbol, and em dashes — when served via Python's built-in `http.server`, which sends no charset header at all. The file had no `<meta charset>` tag, so the browser had to guess and guessed wrong.
**Context:** User hit this testing the prototype on their phone via a local LAN server (`python -m http.server`) set up so they could preview it at true device proportions outside the Artifact viewer's chrome.
**Implication:** Every standalone HTML file in this project (prototypes or the real game) should declare `<meta charset="UTF-8">` as the first tag, regardless of intended hosting — don't rely on the host to set the header correctly.

## 2026-07-19 — Claude Artifact viewer chrome makes on-device proportions look wrong in screenshots
**Finding:** Claude's Artifact viewer wraps published pages in its own title-bar UI (~150–200px: page title, "Artifact by you", share/flag icons) sitting above the actual page content. Since the mobile prototype's map region uses `flex:1` to fill all remaining vertical space, a screenshot taken inside the Artifact viewer under-represents how much taller the map (and therefore how much smaller the chrome looks by comparison) will be in a true fullscreen context — several rounds of "make the UI bigger" feedback traced back to this rather than any single wrong pixel value.
**Context:** User compared the same prototype rendered inside the Artifact viewer vs. added to the iPhone home screen from a local server, and the proportions looked very different.
**Implication:** When sizing chrome for a mobile-first prototype meant to be judged against real device proportions, size against actual iPhone 14 viewport assumptions (390×844, this project's stated default target) rather than against how it looks inside the Artifact preview panel — the preview systematically under-represents available map height.

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
