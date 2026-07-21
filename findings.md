# Findings

## 2026-07-20 — Chromium-based testing cannot reproduce real Safari viewport-meta behavior
**Finding:** Playwright's `chromium` engine, even with an explicit `--viewport-size`/`viewport` option, overrides or ignores a page's own `<meta name="viewport">` tag entirely — every automated check run against Chromium this session passed cleanly, yet the real regression (see the viewport-meta finding below) was fully reproducible only once testing switched to Playwright's `webkit` engine with the `devices['iPhone 14']` device profile (`window.innerHeight` measured 664px in real WebKit vs the naive assumption of 844px).
**Context:** Spent several rounds diagnosing a real-device-only layout bug ("everything stacking") that never showed up in headless Chromium screenshots, before realizing the browser engine itself was the blind spot, not the CSS.
**Implication:** Any future mobile-Safari-specific bug in this project (viewport meta, safe-area-insets, dynamic toolbar behavior) must be verified with Playwright's `webkit` engine + an iPhone device profile — Chromium screenshots, however carefully framed, cannot catch this class of bug.

## 2026-07-20 — Adding a viewport meta tag to Booth Ink collapsed the map region on real Safari
**Finding:** `pme-mobile-sheet.html` had no `<meta name="viewport">` tag at all; adding one (`width=device-width, initial-scale=1`) to fix an unrelated double-tap-zoom bug caused the map to collapse to a near-zero-height sliver on a real iPhone in Safari. Root cause: without a viewport meta tag, Safari falls back to its classic ~980px-wide virtual canvas (confirmed via real WebKit: `window.innerHeight` was 1668px in that fallback mode vs 664px with the tag), which gave `.map-wrap`'s `flex:1` region far more absolute pixel budget than a true 390×844 device-width viewport does. The file's fixed-height chrome (topstrip + news ticker + groups bar + info panel ≈ 755–765px) does not actually fit within a true device-width viewport at all.
**Context:** User reported "everything stacking on top of each other" after the viewport meta tag was added; initial hypothesis (that Safari's real usable viewport, ~664px with browser chrome, was simply less than the assumed 844px) was factually correct but was the wrong explanation — the user correctly pointed out the same setup had worked for 2 days prior, proving the viewport tag itself was the regression trigger, not a previously-hidden constraint.
**Implication:** The viewport meta tag was reverted; the original zoom-on-rapid-tap bug was instead fixed with `touch-action:manipulation` CSS, which doesn't touch viewport/layout math at all. If a real viewport meta tag is ever needed here, the fixed-chrome elements (topstrip/newsticker/groups-bar/info-panel) will need a real density trim first, or the page needs to rely on standalone/home-screen-installed mode (`apple-mobile-web-app-capable`, already present) rather than a plain Safari tab.

## 2026-07-20 — Booth Ink's map renders 3 states as `<circle>` overlays, not `<path>` — selectors must target both
**Finding:** Uttarakhand (`INUT`), Ladakh (`INLA`), and Himachal Pradesh (`INHP`) each have two SVG elements sharing the same `id` — a real traced `<path>` boundary plus a `<circle>` marker with no `r` attribute (renders as literally zero-radius/invisible on its own). Every map interaction function (`paintMap()`, `selectState()`, the map click handler, `applyGroupHighlight()`) originally only queried `path[id]`, so these three states never got leader-color fills, group-highlight opacity, or click handling via their circle element, and any styling applied only to the `<path>` half of the duplicate-ID pair.
**Context:** User reported these three states appearing to be excluded from group-highlight taps; traced to the selector gap after confirming the underlying group-membership data was correct.
**Implication:** Any future map-interaction code in `pme-mobile-sheet.html` must query `path[id], circle[id]` together (not just `path[id]`) or it will silently skip these three states.

## 2026-07-20 — SVG `opacity` dims stroke along with fill; use `fill-opacity` to keep borders visible
**Finding:** `applyGroupHighlight()` originally set `element.style.opacity` to dim non-member states when a group filter is active — this fades the stroke (border) along with the fill, since `opacity` scales the whole element. Switching to `element.style.fillOpacity` keeps the black border fully visible on every state regardless of group membership, dimming only the fill.
**Context:** User reported specific states (Himachal Pradesh, Ladakh) "should show black border like the other ones" after a group filter was tapped — traced to the whole-element opacity dimming, not a state-specific bug.
**Implication:** Any future highlight/dim treatment on the map SVG should default to `fill-opacity` (or `stroke-opacity` if the intent is the reverse), not plain `opacity`, unless fading the border along with the fill is actually the intended effect.

## 2026-07-20 — Booth Ink prototype has no real game logic behind its UI
**Finding:** `design/prototypes/pme-mobile-sheet.html` (759 lines, one inline `<script>` block, 20 functions) is UI/interaction-only — its `seed()` function fabricates mock popularity numbers and `investIn()`/`renderTokens()` etc. operate on that fake data. There is no real popularity math, campaign-fund accounting, phase timer, or policy-tag resolution; none of it calls into or matches the real engine in `js/*.js`.
**Context:** Investigated while evaluating the user's proposal to "abandon the old mobile project" and restart from just `design/plan.md` + Booth Ink, to check whether that would actually preserve working game logic.
**Implication:** Booth Ink is the UI/markup layer only. Any work wiring it into the real game must rewire its stub functions to call the actual engine functions in `investment-system.js`, `rally-system.js`, etc. — it is not a functional replacement for `index.html` + `js/*.js`, which stays as the engine regardless of skin changes.

## 2026-07-20 — Service worker registration needs a secure context; LAN IPs don't qualify, only localhost or real HTTPS
**Finding:** The secure-context exemption that lets service workers register over plain HTTP only applies to `localhost`/`127.0.0.1` on the same machine. Reaching a local dev server from a phone over LAN (e.g. `http://192.168.x.x:8000`) is a plain-HTTP, non-localhost origin from the phone's perspective — not a secure context — so service worker registration (and by extension real PWA install/offline behavior) will not work there.
**Context:** User asked whether a local server is sufficient for testing the planned PWA scaffolding (Phase 0 of `design/plan.md`'s roadmap), or whether GitHub Pages is required.
**Implication:** Desktop-only iteration on manifest/service-worker code can use `localhost` freely. Testing actual "Add to Home Screen" + offline caching on a physical iPhone requires real HTTPS reachable from the phone — GitHub Pages (already in the stack, zero extra setup) or a tunnel (ngrok/Cloudflare Tunnel) for faster iteration than push-to-Pages each time.

## 2026-07-20 — Collapsed trays (`max-height:0`) still occupy their full declared width in flex layouts
**Finding:** In Booth Ink's expandable token/agenda tray pattern, a tray collapsed via `max-height:0; overflow:hidden` still consumed its full 294px declared width as a flex sibling, even while rendering zero height. This silently pushed two adjacent FAB toggle buttons far apart despite an explicit small `gap` on their shared flex row — the visible gap looked huge because ~171px of invisible tray width sat between each button and its own stack.
**Context:** Debugging an unexpectedly large gap between the agenda (📜) and tokens (🎟️) FAB buttons after wiring up the second expandable tray.
**Implication:** Any collapsible tray/panel meant to sit "above" a fixed toggle button in this UI must be taken out of normal flow with `position:absolute` (anchored to a `position:relative` wrapper around just that button) — collapsing height alone does not make a flex sibling neutral to layout width.

## 2026-07-20 — Honeycomb rows with different item counts self-align without manual offset
**Finding:** Building the 2-row hex "groups bar" (8 hexagons on top, 7 on bottom), simply centering each row independently (`justify-content:center`, no horizontal shift) produced a correctly-interlocked honeycomb — no manual `margin-left`/transform offset was needed. An 8-item row and a 7-item row, both centered on the same container width, differ by exactly half a hex+gap pitch, which is precisely the offset a honeycomb needs.
**Context:** Implementing the final groups-bar layout after earlier attempts at explicit tier-clustering produced comically oversized or undersized hexagons (see the existing 2026-07-19 CSS Grid `1fr` finding below — same shrink-to-fit trap, hit again with `repeat(5,1fr)` inside 3 tier rows before being fixed with an explicit `min(vw,px)`/`calc()` hex size).
**Implication:** For any future alternating-row hex/brick layout in this project, prefer differing row item-counts (N, N−1) plus independent centering over manually computed horizontal offsets — it's simpler and self-corrects automatically if the hex size changes later.

## 2026-07-20 — Desktop's random-events.js only ever affects Player 1
**Finding:** In `random-events.js` (desktop repo), `applyRandomEvent()` hardcodes `isPositive` events to help Player 1 and negative events to hurt Player 1 — Player 2's popularity is never touched by any random event, regardless of type. This is a bug, not a design choice.
**Context:** Investigated after the user reported that desktop's random events, home-state bonus, and token odds — despite being "randomization" systems — never made replays feel different.
**Implication:** If random events are ever revisited (currently superseded by the agenda/special-power/token redesign — see `design/plan.md`), this asymmetry must be fixed; don't port the desktop logic as-is.

## 2026-07-20 — Desktop's home-state-bonus.js is deterministic, not random
**Finding:** `home-state-bonus.js` applies a flat, fixed +20% popularity bonus keyed to whichever politician's `homeState` field matches — identical every game a player picks the same politician. Despite being framed as a randomization/replayability lever, there's no randomness in it at all.
**Context:** Same investigation as above — reading the actual desktop modules behind the four "randomization" systems the user described.
**Implication:** Home-state bonus is now folded into the politician roster design (each entry already carries a home state) rather than treated as a standalone randomization system.

## 2026-07-20 — Desktop's rally token "special chance" is a hardcoded asymmetric constant, not dynamic
**Finding:** `rally-controller.js` rolls special-token odds via `Math.random() < specialProbability` where `specialProbability` is hardcoded to `0.1` for Player 1 and `0.05` for Player 2 — permanently asymmetric, never varies game to game despite being described as "dynamic."
**Context:** Same investigation — auditing why previously-implemented randomization systems didn't produce felt variety.
**Implication:** The redesigned 3-flavor token economy (State Rally / Special Powerup / Nationwide Rally, see `design/plan.md` Replayability section) removes randomness from token acquisition entirely rather than trying to fix the odds.

## 2026-07-20 — Mobile's campaign-system.js already has a full agenda UI, but never applies the actual policy effect
**Finding:** `campaign-system.js` fully implements `loadPolicyTags()`, `generateCampaignGrid()` (23 policies with tiers, costs, support/oppose region labels), and click-to-invest progress bars, wired to a `⚡ Campaigns` button + modal already in `index.html`. But `checkAndAwardBonuses()` only pays a cash bonus on completion — it never calls anything like desktop's `calculatePolicyEffect()` to apply the region-tag-based popularity shift. The UI is more built than assumed; the payoff logic is what's actually missing.
**Context:** Investigated while diagnosing why "agenda" felt unimplemented on mobile, before realizing the existing system just never wired up its own effect.
**Implication:** Any agenda-system work should check for and reuse this existing grid/modal machinery rather than assuming a blank slate — though the actual UI target has since shifted to Booth Ink (see next entry), so this specific modal likely won't be the delivery vehicle going forward.

## 2026-07-20 — index.html is not the real UI direction; Booth Ink (pme-mobile-sheet.html) is
**Finding:** The user has committed to "Booth Ink" (`design/prototypes/pme-mobile-sheet.html`, added in commit f5c48fc) as the actual mobile UI direction, and has been heavily tweaking it since. It's a deliberately sparse 3-fixed-region layout (header / map / info panel, stacked, "nothing overlaps, nothing expands" per its own code comments) plus two corner buttons (UT cluster, rally FAB) — no campaign/agenda modal exists in it at all. `index.html`/`styles.css` is the old desktop-ported skin and is no longer the target.
**Context:** Several turns of UI analysis were done against `index.html` before the user corrected this; confirmed by reading the file and cross-referencing the commit that introduced it.
**Implication:** Any future UI/interface work on this project must reference `pme-mobile-sheet.html`, not `index.html`/`styles.css` — check which file is open/referenced before assuming the legacy file is current.

## 2026-07-20 — Seats are allocated proportionally per state, not winner-take-all
**Finding:** `seat-projection.js` computes `p1Seats = Math.round(seats * (popularity.player1 / 100))` per state — seat counts move smoothly in proportion to popularity, confirmed in code after the user corrected an assumption that seat totals could "flip" suddenly like a winner-take-all system.
**Context:** Came up while evaluating "projected seats crossing a threshold" as a candidate special-power unlock trigger (later superseded by the token-economy unlock design).
**Implication:** Seat-based thresholds or triggers in this game behave smoothly, not in sudden jumps — don't assume FPTP-style volatility when reasoning about seat-count mechanics here.

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
**Implication:** Highest-leverage replayability fix is randomizing which groups/values are "live" per match and giving random events real strategic teeth — not adding more static content. (Superseded by the agenda/special-power/token redesign — see `design/plan.md`.)

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
**Implication:** Random events and home-state bonus work is purely additive (not blocked on anything else) and doubles as the main replayability lever — see the entry above. (Superseded — see `design/plan.md` Replayability section for the actual replacement design.)
