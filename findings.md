# Findings

## 2026-07-21 — Real starting-position breakdown: ~54% of the map is genuinely contested, not player-vs-player
**Finding:** `popularity-manager.js`'s actual init algorithm gives Player 1 a 2-state stronghold (Uttar Pradesh + Maharashtra, 128 seats), Player 2 a 3-state stronghold (West Bengal + Bihar + Tamil Nadu, 121 seats), and leaves the remaining 31 states (294 seats, 54% of all 543) as "competitive" territory where both players start low (5–29%) and "Others" dominates. Expected baseline seat share at game start: P1 ≈24.6%, P2 ≈24.3%, Others ≈51.1%.
**Context:** Computed against live `data/states_data.json` while modeling whether the decided economy numbers make the game winnable and how adversarial the early game actually is.
**Implication:** Most of the early game is a race to harvest the uncommitted "Others" pool, not direct player-vs-player combat — real zero-sum friction concentrates in the shared competitive-state pool and in attacks on each other's strongholds, not everywhere.

## 2026-07-21 — Direct cash investment alone cannot win the game under the decided numbers
**Finding:** Simulating the real decay curve against real state-size data, the theoretical best case for cash-only play (full 12,500 lifetime budget, spent optimally spread across all states, opponent does nothing) tops out at ~195/543 seats (35.9%) — well short of the 272-seat majority (50.1%) needed to win.
**Context:** Modeled while assessing whether the newly-decided base economy numbers (2,500 start / 1,000 per phase / seats×10 cost) make the game plausibly winnable.
**Implication:** Rally tokens and agendas are mathematically required to reach a majority under current numbers, not optional flavor layered on top of cash investment — the map-tapping mechanic alone is not a viable win path.

## 2026-07-21 — Agenda seat-equivalent value swings from +51.8 to −25.3 across the real 23-policy pool; 3 policies currently do nothing
**Finding:** Computing `baseMagnitude × Σ(matching support tags − matching oppose tags)` against every real state in `data/states_data.json`, national seat-equivalent value ranges from Economic Liberalization (+51.8, best) to National Defense (−25.3, actively harmful if picked) across the 23 policies in `data/policy-tags.json`. Women's Empowerment, Healthcare, and Anti-Corruption have zero support/oppose tags configured, so completing them currently applies no popularity effect at all under the decided formula.
**Context:** Computed while auditing whether the game is fairly winnable regardless of which of the 20 politicians a player picks, given each is locked into 4 specific agendas.
**Implication:** A single agenda slot can swing ~77 seats between best and worst pick — larger than the ~6-seat margin by which a combined cash+token+2-agenda strategy crosses the majority threshold (see the next finding). Politician/agenda-pick quality is likely a bigger determinant of outcome than player skill under current numbers. The three zero-tag policies are likely an oversight (old `policy-popularity-calculator.js` had a "no tags → flat nationwide bonus" fallback the new formula doesn't implement). Not yet audited: which of the 20 roster politicians got assigned these dead or negative-value agendas.

## 2026-07-21 — A combined cash+token+2-agenda strategy just barely crosses the majority threshold (~278/543)
**Finding:** Adding free rally tokens (+20.6 seat-equiv from 20 base tokens on the biggest states) and two strong agendas (Economic Liberalization + Education, +101.2 combined) on top of a reduced cash allocation reaches ~278/543 seats (51.2%) — a majority, with only ~6 seats to spare.
**Context:** Built as the realistic "best case that isn't cash-only" scenario, following the cash-only ceiling finding above.
**Implication:** The game is winnable, but the margin is thin and highly sensitive to agenda-pick quality (see above) — worth confirming the actual 20-politician roster doesn't leave any politician mathematically unwinnable.

## 2026-07-21 — Group-dominance payout formula was a 10x-too-small bug; even corrected, cost to dominate any group exceeds the entire lifetime budget
**Finding:** The payout formula was first documented as `0.5 × Σseats-in-group` (matching desktop's `group-rewards.js` literally), but the actual intended formula ties the 0.5 multiplier to the *cost* of a tap on the group treated as one unit: `0.5 × (seats × 10) = 5 × seats` — a 10x correction, confirmed by the user via a worked Maharashtra example. Even with the correction, computing the real cash cost to push every member state of a group to 50% (using the real decay curve and real starting positions) shows every single one of the 15 dominable groups costs more to actually dominate via direct cash than the entire 12,500 lifetime budget — e.g. Agricultural Region costs ~12,480 Cr to dominate for a corrected payout of only 1,365 Cr (~11% ROI).
**Context:** Surfaced when the user walked through a concrete cost-vs-payout example and found the numbers "wildly wrong," then clarified the intended formula.
**Implication:** Fixed the formula shape for whenever group dominance is implemented/ported to mobile (`campaign-system.js`'s `checkRegionalDominanceBonuses()` is stale per the existing 2026-07-21 finding below and doesn't implement any payout yet). Group dominance should be understood and communicated as a bonus on states already being pushed to 50% for the national seat-share race — never as a standalone cash-ROI target, even at the corrected magnitude.

## 2026-07-21 — Rally token system has undocumented caps: 2/phase spend, 2/state lifetime, and a real ceiling of 20 usable tokens (not 28)
**Finding:** Clarified directly by the user: token spending (whether an individual per-state rally play or converting tokens into a Special Powerup/Nationwide Rally craft) is capped at 2 per phase per player, and separately capped at 2 total plays per state for the whole game (shared between both players, Nationwide Rally exempt). Since income is also 2/phase, and the spend cap matches it exactly, the real hard ceiling on tokens ever *usable* across a 10-phase game is 20 (2×10) — regardless of the up-to-28 (20 base + 8 agenda bonus) that can be *earned*. The +8 agenda-completion bonus tokens don't raise this ceiling; they only give scheduling flexibility in when the same 20 get spent, and can go permanently unused if a player already spends their base income at the cap every phase.
**Context:** None of these caps were previously documented anywhere in the project. Surfaced through several rounds of direct clarification after incorrect assumptions (tokens unlimited per state; crafting exempt from the per-phase cap; crafting and base income as separate pools) were each proposed and corrected by the user.
**Implication:** Crafting a Special Powerup (6 tokens) needs a minimum of 3 phases of dedicated commitment; a Nationwide Rally (12 tokens) needs a minimum of 6 — meaning it must be started almost immediately in a 10-phase game or it can't be finished in time. This is one shared token pool, not separate tracks for base vs. bonus tokens.

## 2026-07-21 — phase-system.js had its own independent, drifted config loader; fixed to share config-manager.js's
**Finding:** `js/phase-system.js` fetched `data/game-config.json` independently of the rest of the app, with a hardcoded fallback default that had drifted to 500/phase against the real live config value of 1000/phase.
**Context:** User asked to fix the fallback-default inconsistency; investigation found the root cause was two entirely separate config-loading systems in the codebase — `phase-system.js`'s own fetch vs. the shared `config-manager.js` already used by `campaign-system.js`, `player-manager.js`, `rally-system.js`, and `investment-system.js`.
**Implication:** Fixed at the root, not just the number: deleted `phase-system.js`'s independent config-loading system entirely; it now calls the shared `getGameConfig()` from `config-manager.js`, same as every other module. One config loader in the codebase now, not two that could silently drift apart again.

## 2026-07-21 — totalPhases and base economy scale conflicts (flagged earlier this session) are now resolved by decision
**Finding:** The `totalPhases: 8 vs 10` conflict (see finding below) is resolved: 10 is canonical. `design/plan.md`'s "8" references and Booth Ink's UI still need updating to match — not yet done. The desktop-vs-mobile price-scale mismatch (see the `seats × 1 vs seats × 10` and `50% of seats` findings below) is also resolved: mobile keeps its own numbers (2,500 start / 1,000 per phase / seats×10 cost) and stops comparing to desktop's scale entirely — desktop is no longer treated as the numeric reference for base economy scale, though other formula *shapes* (the redistribution rule, the agenda effect formula) were separately confirmed to still match desktop's.
**Context:** Direct user decisions during this session's economy-plausibility review.
**Implication:** Any future economy work should treat these as closed, not reopen the desktop-comparison question — see `design/economy-status-map.md` for the full current formula set.

## 2026-07-21 — Desktop's real direct-investment cost is seats × 1 (millions), not seats × 10
**Finding:** `campaign-spending.js`'s `calculateBaseCost()` on the desktop app computes cost as `seats × 1`, in millions — a full order of magnitude different from mobile's `data/game-config.json` assumption of `seats × 10` (crores).
**Context:** Auditing the in-game economy per explicit instruction to use the desktop app as reference, not mobile's ported/known-broken code.
**Implication:** Any cost/budget tuning should compare cost-to-lifetime-budget ratios, not raw numbers, when reconciling desktop's and mobile's differently-scaled economies. (Superseded 2026-07-21 — see the resolution finding above: mobile's own scale is now canonical, this comparison is closed.)

## 2026-07-21 — Desktop's home-state bonus is both a cost discount and a flat popularity floor, applied together
**Finding:** `home-state-bonus.js` applies a 20% discount on every campaign cost (`getCampaignCost`) **and** a separate one-time flat +20 percentage-point popularity floor the moment the home state is touched (`applyHomeStateBonus`) — not a per-tap scaling multiplier, and not an either/or choice.
**Context:** Read directly while resolving a design question about whether a politician's regional affinity should discount cost or boost effect.
**Implication:** Desktop's actual precedent combines both mechanisms simultaneously; worth knowing before finalizing mobile's politician-state affinity design.

## 2026-07-21 — Desktop's popularity-gain-per-tap decay formula
**Finding:** Each campaign tap gives `5% × max(0.8, 1 − cumulativeSpendInState × 0.005)` — a mild decay toward an 80%-of-base floor as more money is spent in that specific state, confirmed in `state-info.js`'s `recordStateAction()`.
**Context:** Needed the real formula to model cost-to-dominate accurately for an interactive economy-balance tool.
**Implication:** This is now the reference decay curve used in that tool; any future mobile port of investment decay should match it rather than inventing a new one. (Superseded 2026-07-21 — decided to keep mobile's own existing linear-glide curve instead; see the resolution finding above.)

## 2026-07-21 — Desktop's regional dominance bonus pays 50% of the group's seats, plus recurring carry-forward
**Finding:** `group-rewards.js`'s `awardGroupDominationBonus()` pays `Math.round(totalSeats * 0.5)` in currency once dominance is first achieved, then repeats the same award as a carry-forward bonus while dominance is maintained.
**Context:** Same economy audit, reading `group-rewards.js` and `state-groups.js` directly.
**Implication:** Far more generous than mobile's flat 200+50/phase bonus — worth aligning mobile's numbers to this scale since desktop is the intended reference. (Superseded 2026-07-21 — mobile stopped comparing to desktop's scale; and this exact `0.5 × seats` formula was found to be a 10x-too-small bug when computing real ROI — see the group-dominance-payout finding above for the corrected formula.)

## 2026-07-21 — Desktop's "every state in group must individually exceed 50%" rule is intentional, not a mobile bug
**Finding:** `state-groups.js`'s `checkGroupDomination()` requires `p1DominatingStates === states.length` — every single state in the group individually at ≥50%, not a seat-weighted average. Mobile's ported version uses the identical strict rule.
**Context:** Checked desktop's real threshold logic after finding mobile's version used the same rule, to confirm whether it was a porting bug.
**Implication:** This strictness is desktop's actual design; balance work should treat it as intentional rather than something to loosen without deliberate reason.

## 2026-07-21 — Mobile's regional-dominance check is stale and covers only 4 of 15 real groups
**Finding:** `campaign-system.js`'s `checkRegionalDominanceBonuses()` hardcodes only `['SouthIndia', 'HindiHeartland', 'NortheastIndia', 'CoastalIndia']`. `NortheastIndia` was already deleted from `states_data.json` in the 15-group rebalance (retired in favor of Eastern/Western Border) and can never match again; the other 11 of the current 15 groups aren't checked at all.
**Context:** Auditing whether regional dominance bonuses are actually achievable in the current mobile codebase.
**Implication:** This function needs a real rewrite against the current 15-group list before any group beyond South India/Hindi Heartland/Coastal India can ever pay out on mobile.

## 2026-07-21 — Mobile's investAgenda() has zero funds cost, same bug pattern as the pre-fix investIn()
**Finding:** Booth Ink's `investAgenda()` increments agenda progress with no funds check at all, despite `design/plan.md`'s own D2 decision explicitly calling for agenda commitment to cost "one lump sum per phase."
**Context:** Auditing "how much should agendas cost" as part of the in-game economy walkthrough.
**Implication:** Agenda cost-gating needs the same kind of fix `investInPaid()` just received for direct map-tap investment; not yet implemented. (The cost is now decided — 500 Cr/tap, see `design/economy-status-map.md` — but this remains an implementation gap in Booth Ink's code.)

## 2026-07-21 — Desktop already has a working win condition; it's specifically missing from Booth Ink, not the whole project
**Finding:** `js/ui-manager.js`'s `showElectionResults()` implements a real 272/543-seat majority check, wired through `phase-system.js`'s `endGame()`. This contradicts an earlier assumption in this session that no win condition existed anywhere in the codebase.
**Context:** Traced `endGame()`'s call chain while researching how much money it takes to actually win the game.
**Implication:** Porting/adapting this existing logic into Booth Ink is the real Phase 3 task — not writing a win condition from scratch.

## 2026-07-21 — totalPhases is inconsistent: config says 10, design docs and Booth Ink assume 8
**Finding:** `data/game-config.json` and `phase-system.js` both set `totalPhases: 10`, but `design/plan.md`'s roadmap text ("finishing 8 phases shows a result") and Booth Ink's own UI hardcode 8.
**Context:** Computing total lifetime budget (`startingFunds + refreshFundsPerPhase × totalPhases`) for the economy audit surfaced the discrepancy.
**Implication:** Changes total lifetime budget by a full 2 phases' worth of refresh funds (2000Cr at current mobile values) — needs a decision on which number is canonical before finalizing budget-dependent balance work. (Resolved 2026-07-21 — see the resolution finding above: 10 is canonical.)

## 2026-07-21 — National Defense's own support and oppose tags overlap on 4 real states, netting to zero there
**Finding:** National Defense supports `EasternBorder`/`WesternBorder` and opposes `HindiHeartland`/`CoastalIndia` — but Uttar Pradesh, Bihar, Uttarakhand, and Himachal Pradesh are all tagged both `EasternBorder` and `HindiHeartland` simultaneously. Under the agreed sum-every-matching-tag netting rule, these 4 states get +12 and −12 at once, netting to zero for this policy specifically.
**Context:** Worked a concrete manual-investment-vs-agenda cost comparison for National Defense.
**Implication:** The real "clean" affected footprint for National Defense is smaller than its raw support-tag seat count suggests (~137 of 266 seats, not all 266) — worth checking other policies for similar self-canceling overlap before finalizing agenda balance. (See the full 23-policy seat-equivalent ranking above — National Defense nets negative overall, −25.3 seat-equiv.)

## 2026-07-21 — Direct-investment cost-per-seat-share is size-invariant; rally tokens are not
**Finding:** Under the current cost formula (`cost = seats × costPerSeat`, popularity gain independent of seat count), the cost to gain one percentage-point of seat-share is identical regardless of a state's size — investing in Uttar Pradesh (80 seats) is exactly as cost-efficient, seat-for-seat, as investing in a 1-seat union territory. Rally tokens break this: they cost a flat amount regardless of target state size but deliver the same flat percentage swing, so a token is objectively more valuable spent on a large state than a small one.
**Context:** Derived while auditing the total cost to win the game outright, and encoded directly into the interactive economy-balance tool built this session.
**Implication:** There's no pure-efficiency reason to prefer big states over small ones for cash investment; token-spending strategy, by contrast, should explicitly favor the largest available states.

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
