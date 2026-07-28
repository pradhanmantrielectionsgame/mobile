# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### ✨ Special-Power Visual & Audio Integration — 2026-07-28

#### Power Activation Animations & Sound System Refinement
- **ADDED**: `mobile/main.js` — `spawnPowerBurst()` function: full-screen 5-second animation (radiating color rays + popup card) fired whenever a special power activates, for both human player and AI opponent [C2]
- **ADDED**: `mobile/index.html`, `mobile/index-redesign-a.html`, `mobile/index-redesign-c.html` — matching `.power-burst` CSS (glow/rays/card + 3 keyframe animations) to all three files' independently-duplicated `<style>` blocks; first pass only touched `mobile/index.html`, making the animation invisible on redesign files until this fix [C3]
- **CHANGED**: `mobile/main.js` — agenda info-panel display changed from "X/4 taps invested" to "NN% committed" (renderAgendaCard function), matching the percentage phrasing already used on agenda tray badges [C4]

#### Background Music System Architecture
- **RESTRUCTURED**: `mobile/main.js` — split background music into two separate looping tracks: `bg_music` (original file, gameplay-phase-only) and `intro_music` (`sounds/saare_jahan_se_accha.mp3`, welcome/select/post-game screens) [C1]
- **ADDED**: `mobile/main.js` — new `switchMusic()` helper wired at 4 call sites (welcome-screen "Begin Campaign" tap, game-start transition, playAgainBtn, musicToggleBtn) to ensure the two tracks never overlap and correct track plays at each app state [C1]

#### Documentation Updates
- **FINDINGS**: One new entry prepended to `findings.md` (2026-07-28) covering the three-HTML-file duplicated-`<style>`-block trap that made the power-burst CSS invisible on redesign files [written by /checkpoint, Phase 1.3]

#### Context
Session focused on wiring visual feedback for special-power activation (a 5-second full-screen animation visible to both players) and separating background music into state-specific intro and gameplay loops. Discovered that CSS-only changes must be applied to all three HTML files' `<style>` blocks independently (not just the main `mobile/index.html`) since they share JS engines but not stylesheets — a previously-undocumented caveat now recorded in findings.md. All changes maintain single-player-vs-AI scope.

---

### 🎵 Sound System Fixes & Autoplay Integration — 2026-07-28

#### Audio Asset Corrections & Naming Consistency
- **RENAMED**: `sounds/Rajinikaanth.mp3` → `sounds/Rajinikanth.mp3` to match politician name lookup in `mobile/main.js`'s `playPowerSound()` (extra "a" typo was causing silent fallback to generic fanfare) [C1]
- **ADDED**: `sounds/Narendra_Modi.mp3`, `sounds/Sachin_Tendulkar.mp3` — new per-politician special-power sound assets [C2]
- **ADDED**: `sounds/saare_jahan_se_accha.mp3` — background music asset for ambient campaign theme [C2]

#### Background Music Integration
- **ADDED**: `mobile/main.js` — `playSound('bg_music')` call wired to `welcomeStartBtn` click handler, starting background music from the welcome/login screen onward instead of only once gameplay begins [C2]
- **CHANGED**: `mobile/main.js` `bg_music` Audio source from placeholder to `sounds/saare_jahan_se_accha.mp3` (national anthem-inspired campaign theme) [C2]

#### Project Documentation
- **FINDINGS**: Two new entries prepended to `findings.md` (2026-07-28) covering: (1) sound-file naming convention mismatch (Rajinikaanth.mp3 vs. the politician's actual name) and (2) GitHub authentication failures when attempting to push to a new account's repo [written by /checkpoint, Phase 1.3]

#### Context
Session focused on wiring up background music for the welcome screen entry point and correcting a pre-existing sound-file naming typo that was silently falling back to generic fanfare instead of playing Rajinikanth's power sound. All three new sound assets follow the `<PoliticianName with spaces→underscores>.mp3` naming convention. No engine or game-logic modifications.

---

### 🎨 Mobile HUD Prototype Redesign (Concept A) — Polish & Real-Device Testing — 2026-07-27

#### Prototype Refinement & Layout Optimization
- **ADDED**: `mobile/index-redesign-a.html` + `mobile/main.js` — Kerala quick-invest button (`.uts-btn "KERALA"`) mirroring existing Delhi/Goa single-state pattern [C1]
- **ENLARGED**: Bottom info panel (`zoom:1.15` per user feedback; initial `zoom:1.3` was too large) [C2]
- **SCALED**: Shared `:root` font-size tokens (`--fs-1`..`--fs-6`) up ~15% for consistent text increase across top phase bar, player strip, news ticker, agenda/rally buttons; also bumped `.uts-btn` icon/label font sizes directly (hardcoded, non-tokenized) [C3]

#### Politician-Select Ballot-Card Responsive Fix
- **REWORKED**: `mobile/index-redesign-a.html` — ballot-card portrait region from fixed 760px height to flexible `flex:1 1 auto; min-height:260px` that shrinks/grows to content, with `.pol-bio{ flex:0 0 auto }` so text never shrinks; `.pol-art img` switched from `object-fit:cover` to `object-fit:contain` (cover was cropping heads/faces at small sizes with no single anchor working for all 20 portraits' varying compositions) [C4]
  - **Fixes real overflow:** Modi, Indira Gandhi, Nehru, Ambedkar, Patel, Rao cards on real iOS Safari (normal tab, ~664px usable height) had been reporting as 0px overflow in earlier testing at 980×2130 headless viewport (which only matches Safari with chrome hidden) — re-testing at real 980×1669 revealed actual 187-327px overflow, worst on the exact politicians user flagged as cut off
  - **Decision [D1]**: Flexible sizing self-adjusts per card content, rejecting both manual per-card pixel tuning (fragile) and overflow-scroll fallback (user explicitly wants zero scrolling ever)
  - **Decision [D2]**: `object-fit:contain` over per-image `object-position` tuning, matching project rule (CLAUDE.md) for "cropping might cut off a face" — Modi's card (face lower with raised fist above) would break any top-anchor fix for Nehru's card (subject positioned high), so prefer full-visibility letterboxing

#### App Icons & Web Manifest
- **ADDED**: `assets/icons/pme-icon-{32,180,192,512,1024}.png` — new icon set (flat-vector illustration of raised index finger with indelible-ink voting mark, brass-ring border, cream background, matching app color tokens) generated via Gemini + resized via Python/Pillow [C5]
- **WIRED**: Icon set into `mobile/manifest-redesign-a.json`'s `icons` array; linked in `index-redesign-a.html`'s `<link rel="icon">` and `<link rel="apple-touch-icon">` tags [C5]
- **PRESERVED**: Old `assets/icons/pme-icon.svg` left untouched (still referenced by main `mobile/manifest.json`, `mobile/index.html`, `mobile/index-redesign-c.html`)

#### Regional Dominance & Action Panel Visual Refinement
- **ENHANCED**: `mobile/index-redesign-a.html` — group-capture badges (`.gchip.captured-p1/p2`) border thickened 3px→6px plus matching colored `box-shadow` for visual prominence when a player achieves regional dominance (underlying capture-detection logic in main.js already correct; this was pure visual fix) [C6]
- **ENLARGED**: Agenda (`.ne-actions`) and rally (`.se-actions`) floating button panels — `.action-block` width 78px→100px, `.action-btn` icon font-size 52px→64px, badge sizing scaled to match, panel width 19%→23% [C7]
- **REPOSITIONED**: NE agenda panel pushed down, `.ne-actions{ top:130px→165px }` per user request, verified no overlap with news ticker/player-strip [C8]

#### Project Documentation & Testing Notes
- **FINDINGS**: Two new entries prepended to `findings.md` (2026-07-27) covering: (1) viewport convention correction — this app's established Playwright test height (~2130px) only matches Safari with chrome hidden; a normal tab gives ~1669px, hiding real overflow bugs, and (2) `object-fit:cover`'s crop-anchor problem with varying-composition illustration sets [written by /checkpoint, Phase 1.3]
- **UPDATED**: `CLAUDE.md` Playwright-testing-notes with new item (8) documenting the viewport-convention correction [added by /checkpoint, Phase 1.6, user-approved]

#### Context
Session focused on polishing the redesign-A prototype to address real-device testing feedback: Kerala quick-invest button for consistency, enlarged action panels for easier tapping, responsive ballot-card fix to eliminate overflow on real Safari tabs (worst case 327px cut-off on Nehru/Gandhi/Modi), and new app icon set for web manifest. All changes CSS/HTML-only, no engine or game-logic modifications. Prototype remains a candidate to become the final shipped mobile UI (per project memory), not yet promoted to production.

---

### 🎨 Mobile HUD Prototype Redesigns & Proof-of-Concept Testing — 2026-07-27

#### Prototype Builds & Real-Time Map Validation
- **CREATED**: `mobile/index-redesign-a.html` — full interactive UI-only redesign prototype ("Refined Booth Ink" concept) of the in-game HUD, using the real `mobile/engine.js`/`game.js`/`mobile/main.js` engine and live map, CSS/HTML-only reimplementation with no engine changes [C1]
- **CREATED**: `mobile/index-redesign-c.html` — second interactive prototype ("Election Night" dark-theme concept), dark tokens scoped only to `.stage` so other overlays stay light-themed [C2]
- **CREATED**: `mobile/manifest-redesign-a.json` and `mobile/manifest-redesign-c.json` — separate PWA manifests so "Add to Home Screen" on a prototype doesn't hijack back to `index.html`'s start_url [C3]

#### Design Token System & Unified UI Scale (Redesign-A)
- **ADDED**: `index-redesign-a.html` — unified type/radius/shadow token scale at `:root` (--fs-1..6 for font sizes, --radius-sm/md for border-radius, --shadow-sm/md for box-shadow), replacing ~45 ad hoc font-size values scattered through the HUD [C4]

#### HUD Layout Restructuring (Redesign-A)
- **REWORKED**: `index-redesign-a.html` — complete HUD spatial reorganization [C5]:
  - 15 state-group filter chips → vertical single-column sidebar (left edge, evenly fills height with flex:1, no scroll)
  - Player identity + funds + seats → floating strip over map (top, full width, semi-transparent)
  - Agenda/Rally info → rounded-rect floating strips positioned in map's NE/SE "dead space" (inherent to India's shape, not viewBox letterboxing)
  - 4 UT quick-invest buttons (Delhi/Goa/Small UTs/NE8) → single floating bar (bottom, width-matched to player strip)
- **CONVERTED**: State-group chips from horizontal 2-row hexagon honeycomb to vertical rounded-square design, fixing a real low-contrast bug where hex fill was nearly invisible against page background [C6]

#### Real-Device Testing & Proof-of-Concept Verification
- **DOWNLOADED**: `cloudflared.exe` (Windows binary, not pre-installed on this machine, no winget/choco available) to session scratchpad and used with `npm run serve` (port 8934) to expose local dev server publicly for live phone testing of both prototype builds [C7]

#### Design Decisions Documented
- **[D1] Real interactive prototypes over static mockups**: Built both concepts as fully playable builds wired to the real engine, rather than continuing static HTML Artifact iterations, specifically to validate whether the SVG India map stayed tappable and interactive under the redesigned layout (a question static mockups couldn't answer). User explicitly needed to test real map tap-targets before committing to a direction.
- **[D2] HUD actions always visible (no tabs)**: Confirmed that Agenda, Rally, Nationwide Rally, and Special Power buttons must remain simultaneously visible — rejected an earlier iOS-style segmented-control concept that grouped them. Rationale: fast click-based game where opportunity-cost comparison requires seeing all available actions at once each phase.
- **[D3] Floating panel shapes**: Agenda/Rally panels ended up as plain rounded-rectangle floating strips. Rejected two iterations of "quarter-circle corner shelf" panels (built and Playwright-measured twice for precise resizing), in favor of matching the simpler rounded-rect button system already in use.
- **[D4] Map scaling**: Reverted a non-uniform map stretch (scaleY 1.3, scaleX 1.06 to make India "taller without wider") back to uniform scale(1.06). User rejected the vertically-distorted proportions ("Distorted India doesn't look good") even though it technically satisfied the literal request.

#### Context
Session focused on prototyping two alternate HUD concepts as fully interactive builds (CSS/HTML-only, no code changes) to validate layout/map-interaction assumptions that static mockups couldn't answer — specifically whether the SVG India map stayed playable under a redesigned layout that moves state-group controls to a sidebar and floats action panels into inherent dead space around India's triangular shape. Both prototypes run against the real engine and were tested on a real device via a temporary Cloudflare tunnel to the local dev server. Decision [D2] was already saved as project memory (feedback_hud_no_tabs.md) from an earlier part of this session — flagging here for changelog completeness. All work maintains single-player-vs-AI scope; no engine or game-logic changes.

---

### 🎵 Audio Systems, Special-Power Timing Gates & UI Polish — 2026-07-27

#### Audio System & End-Game Sound Priority
- **FIXED**: `mobile/main.js` `doEndPhase()` — win-condition check now happens before dominance-fanfare, preventing fanfare from drowning out game_over sound on final phase [C1]
- **ADDED**: `mobile/main.js` — `playPowerSound()` function plays per-politician special-power sound clips (falls back to fanfare if `sounds/<Name>.mp3` not found), ducks background music to 0 while playing [C2]
- **WIRED**: Special-power activation now calls `playPowerSound()` on both human (`finishActivatePower`) and AI (`scheduleAITick`) paths [C3]
- **ADDED**: `sounds/Amitabh_Bachchan.mp3` — first per-politician power sound asset [C4]
- **ADDED**: `mobile/main.js` — `unlockSounds()` function plays-then-pauses every Audio element to bypass iOS Safari's per-element gesture-unlock requirement; called from welcome screen "Begin Campaign" button (first gesture in app), fixing silent blocks on `game_over`, `cash_added`, `phase_reset` [C10]

#### Special-Power Timing Gates: Expanded & UI Restructured
- **REMOVED**: `data/game-config.json` `rally.specialPowerupMinPhase` — changed 3 → 0, removing craft-timing gate entirely [C5] per **[D1]**: User found 6 tokens reachable via agenda completions alone in round 1, making phase-3 gate arbitrary on already-earned resources; explicitly chose "remove entirely" when offered alternatives
- **EXTENDED**: `data/politicians-data.json` — added `power.requiresMinPhase` gates to 4 new politicians (Modi: 3, Indira Gandhi: 5, Ambedkar: 3, Narasimha Rao: 6), extending Patel's existing phase-5 gate [C6] per **[D2]**: Each justified by real-world timing story (Modi's Demonetization mid-term, Indira's Emergency deep in tenure, Ambedkar's Constitution 3-year draft, Narasimha Rao's minority government only meaningful late-game); CLAUDE.md rule updated to document this extension
- **UPDATED**: `design/economy-status-map.md` + `CLAUDE.md` — synced prose documenting Patel's exception and the four new timing-gated politicians with their historical reasoning [C7]
- **ADDED**: `mobile/index.html` — new `.pow-unlock` row in ballot-card special-power block, displaying "Unlocks at: Phase N" when applicable [C8]
- **SIMPLIFIED**: `data/politicians-data.json` — removed now-redundant phase-gate references from `specialPower.cost` and `power.description` prose for 8 affected politicians (5 gated + 3 celebrities whose text said "usable any phase") [C8] per **[D3]**: User requested "fixed field in header saying 'unlocks at'" instead of text buried in cost — applied consistently across all affected politicians
- **STANDARDIZED**: `data/politicians-data.json` — all funds-cost strings roster-wide changed to "₹X,XXX crores" format (rupee symbol, full word, comma-separated thousands), replacing verbose "Instant X Cr funds cost, deducted on activation" boilerplate [C9] per **[D4]**: User specified desired style via concrete example; applied via targeted script (several strings were identical duplicates)
- **SIMPLIFIED**: Zero-cost strings standardized to "None" (dropped redundant "no cost beyond shared token craft" clause) [C9]

#### Mobile UI Polish: Agenda Buttons, Regional Quick-Invest, Button Sizing
- **REFINED**: `mobile/index.html` + `mobile/main.js` — agenda tray buttons changed from icon+label to icon-only (labels were rendering at ~4px real size due to viewport-scale miss); removed dead `.action-btn-labeled`/`.action-btn-label`/`.action-btn-icon` CSS [C11]
- **ADDED**: `mobile/main.js` + `mobile/index.html` — `activeCluster` state + `renderClusterCard()` — single-tap on NE8/Small-UTs quick-invest buttons now displays member-state info in bottom info panel (previously silent tap with toast only) [C12]
- **RENAMED**: "All UTs" → "Small UTs" across button label, tooltip, toast message, and on-screen instructions text [C13]
- **SCALED**: `.action-btn` icon font-size increased 36px → 74px, now nearly filling button area [C14]
- **SCALED**: `.fx-money` (floating funds display) font-size increased 22px → 60px [C15]

#### Top Panel Redesign & Settings Overlay Updates
- **MOVED**: Pause toggle relocated from Settings overlay into top panel as icon button (⏸ play / ▶ pause symbols) [C16]
- **REMOVED**: "New Game" (reset) button entirely — was the only mid-game abandon control available [C16] per **[D6]**: User explicitly requested removal when adding pause to top panel; flagged that this removes the only way to reset mid-game before execution (no objection raised)
- **RESIZED**: Settings overlay no longer capped to max-width 420px / centered via margin — now fills full screen width like other overlays [C17]
- **SCALED**: Settings overlay CSS `font-size`/`padding`/`gap` up ~2.5x to match app UI scale convention (font 15px→36px for headers, 13px→30px for body; padding 14px→35px rows; body padding 16px→40px, gap 10px→25px) [C18]

#### Project Documentation & Deployment
- **UPDATED**: `CLAUDE.md` — two new durable rules (already written by `/checkpoint`'s Phase 1.6) [C19]:
  - New "Deployment" section: `origin` (`pradhanmantrielectionsgame.github.io`) is a live GitHub Pages site with no build workflow — requires root-level file-diff verification before merging long-lived feature branches (not just commit count check), and every push to `main` is a real public deploy
  - Frontend technical rules extended: iOS Safari blocks `.play()` per-element until that element plays from a real gesture at least once (per-element requirement, not per-page), plus caveat against assuming earlier scale-up passes caught all `mobile/index.html` regions
- **NOTED**: `findings.md` — 4 new entries dated 2026-07-27 documenting GitHub Pages divergence risk, iOS audio-unlock root cause, settings-overlay-unscaled oversight, and deployment decision context

#### Design Decisions Documented
- **[D5] Root-caused non-playing end-game sound to iOS per-element gesture-unlock requirement.** `game_over`, `cash_added`, `phase_reset` only triggered from `setInterval`, never a tap — silently blocked on strict mobile browsers while gesture-triggered sounds worked fine. Fixed all three at once via unlock pass at first gesture (welcome screen tap), not treating as isolated game_over bug. Matches project's "root cause not symptom" convention and identifies the same underlying issue affecting all three.
- **[D7] Did not merge `mobile-ui-overhaul` into `main` or push to GitHub Pages.** Initially recommended as low-risk fast-forward merge (72 commits ahead, 0 behind), but root-level `git diff main mobile-ui-overhaul --stat` revealed `index.html` and all 45 files under `js/` had diverged substantially (not just `mobile/` added alongside desktop game) — merging would have silently overwritten the live desktop build at the root URL. Used temporary Cloudflare quick tunnel (`cloudflared tunnel --url http://localhost:8934`) to point the local dev server instead, entirely bypassing GitHub/Pages interaction. See findings.md 2026-07-27 entry for full context.

#### Context
Multi-turn session focused on adding per-politician special-power sounds, expanding the timing-gate exception pattern to 4 thematically-justified politicians (from 1 original), restructuring how timing gates are communicated in the UI, standardizing all power-cost text for readability, and polishing the settings/top-panel UI to match the established 2.5x scale convention. Also root-caused and fixed iOS audio-unlock issues affecting three non-gesture-triggered sounds at once, and clarified the live-deployment risk posed by the long-diverged feature branch before merging/pushing. All changes maintain single-player-vs-AI scope; no multiplayer backend changes.

---

### 🎮 Special Powers Redesign & Game-Balance Fixes — 2026-07-26

#### Special Powers Engine & Mechanics
- **ADDED**: `mobile/game.js` — new `runEffect` primitives: `seizeFundsPct`/`seizeTokens` (confiscate the opponent's resources, destroyed — no transfer to the activator, unlike the pre-existing `stealFundsPct`/`stealTokens` which do transfer), `stealTokens` (transfer variant, mirrors `stealFundsPct`'s shape), and `freezeFunds` (sets `fundsFrozenUntilPhase` on a player) [C8]
- **ADDED**: `mobile/game.js` — `fundsFrozen()` guard, checked in `investCash`, `tapAgenda`, and `activatePower`'s funds-cost gate; self-clears once `game.phase` advances past the frozen phase, no separate cleanup step [C8]
- **REDESIGNED**: `data/politicians-data.json` — 4 non-politician special powers reworked per [D1] (celebrities deliberately stronger/quirkier than the political roster, not weaker):
  - **Tendulkar (National Icon)**: replaced its flat-bps mechanic with a **30% nationwide popularity floor** (`toBps: 3000`) — snaps any state below 30% up to it, does nothing where he's already above it; costs 1,000 Cr
  - **Hema Malini (Star Power Rally)**: **+8% popularity nationwide, plus another independent +8% in her home state** (16% there total); costs 500 Cr — the cheapest special-power cost in the roster
  - **Rajinikanth (Thalaivar Announcement)**: **+25% popularity in South India, +18% in Maharashtra** (asymmetric, bigger in his real-world base); costs 2,000 Cr — the single largest regional swing in the roster, deliberately
  - **Bachchan (Celebrity Endorsement)**: **+12% popularity nationwide, sourced only from undecided "Others" voters** (never from the opponent) — real payoff is capped by how much undecided share is actually left in each state; costs 1,000 Cr
  [C5]
- **REDESIGNED**: `data/politicians-data.json` — 4 politicians' powers switched to confiscation (denial-only) mechanics, all fully **instant** (no persistent state):
  - **Indira Gandhi (National Emergency)**: confiscates 100% of the opponent's cash and all of their currently-held rally tokens — destroyed, not transferred to her; costs −3% of her own popularity nationwide
  - **Kejriwal (Anti-Corruption Raid)**: reduces the opponent's cash by 50% — confiscated, not transferred; costs −15% of his own popularity in the opponent's home state (unchanged)
  - **Sivaji Rao (One-Day Ordinance)**: fully redesigned, not just rebalanced (see [D4]) — now **free** (no cost at all) and instantly sets his popularity to **100% in his home state, Maharashtra**
  [C9]
- **REDESIGNED**: `data/politicians-data.json` + `mobile/game.js` — **Modi (Demonetization)**: reworked from an instant flat funds removal to a **one-full-phase freeze** — the opponent can't invest, tap agendas, or activate a funds-costing special power for exactly one phase, starting the phase *after* activation (current phase unaffected); costs −5% of his own popularity nationwide (unchanged). This is the roster's first (and so far only) power using the new one-phase category — see [D2] [C9]

#### Game Design Rule Revision
- **[D2] Special Powers Duration Rule, revised**: powers may now resolve **instantly OR last exactly one phase** — was "resolve instantly only, ever." Longer durations remain banned. A one-phase effect needs exactly one self-clearing flag (cheap, bounded, same shape every time); anything longer needs real expiry/decay tracking across an open-ended number of phase transitions, which is genuine ongoing engine complexity. New `docs/adr/0009-special-powers-instant-or-one-phase.md` formalizes this. [C10]

#### Data Corrections & Consistency
- **FIXED**: `data/politicians-data.json` — Tendulkar's National Icon benefit was left at a stray 300bps (3%) since an earlier 2026-07-22 rework that only fixed its cost mechanic, never its magnitude — worse value than Hema Malini's power for double the cost. Corrected in stages this session to its final 30% floor mechanic above. [C2]
- **REMOVED**: `data/politicians-data.json` — redundant "requires holding ≥X Cr" cost-text clauses from 3 funds-gated powers (Tendulkar, Hema Malini, Rajinikanth) — paying a funds cost already implies having the funds [C2]
- **FIXED**: `data/politicians-data.json` — Mamata Banerjee's and B.R. Ambedkar's home-state powers were an exact duplicate (+15% popularity in home state, "both" source) except Ambedkar cost 1,000 Cr more for the identical effect. Ambedkar raised to **+25%** (2,500bps) to match the same 1bps-per-Cr rate at his higher cost — the two are now different values (Mamata stays at +15%/1,500 Cr), no longer a strictly-worse duplicate. [C3]
- **ADDED**: `data/politicians-data.json` + `mobile/engine.js` + `mobile/game.js` + `mobile/main.js` — multi-home-state support via an additive `secondaryHomeStates` array (Kejriwal now Delhi + Punjab, AAP's real second stronghold, since Delhi's 7 Lok Sabha seats made the standard home-state bonus far weaker in absolute terms than politicians with a bigger home state). Every consumer of `homeState` (`engine.js`'s starting-position generator, `game.js`'s `resolvePowerScope` for `home`/`opponentHome` scopes via a new `homeStatesOf()` helper, `main.js`'s display line) now reads through that helper instead of the raw field. The "shared home state nullifies the bonus for both players" rule now applies per overlapping state, not per player. [C4]
- **CLEANED**: `data/politicians-data.json` — roster-wide special-power text audit: fixed ~13 vague/generic cost strings (e.g. "Heavy instant funds hit" → the actual Cr amount), a wrong Vajpayee cost claim (text said a funds penalty; his real `power.costs` array is empty), and 5 stale effect/description mismatches describing old mechanics no longer present in `power.benefits`/`.costs` (Mamata Banerjee and B.R. Ambedkar's text still described a pre-instant-only duration effect; Rajiv Gandhi's still claimed a permanent ongoing discount; Jayalalithaa's named the wrong region; Manmohan Singh's named an extra region not in his actual cost tags) [C6]

#### UI Updates
- **SPLIT**: `mobile/index.html` + `mobile/main.js` — ballot-card power display: replaced one combined prose line with two separate color-coded rows — green (new `--seal-green` CSS variable) for Benefit (using `specialPower.effect`), red (existing `--stamp` variable) for Cost — instead of repeating both in one paragraph plus a separate "Cost:" line [C7]
- **CONDITIONAL**: `mobile/main.js` — hung-parliament end-overlay headline is now conditional on whether the opponent is AI: "Hung parliament — you lose" vs. AI, plain "Hung parliament" otherwise; dropped the now-redundant explanatory sub-text [C1]

#### Project Documentation
- **CREATED**: `docs/adr/0009-special-powers-instant-or-one-phase.md` — formalizes [D2]
- **UPDATED**: `design/economy-status-map.md` — dated notes for every change above, including the full seat-modeling numbers and the rejected design attempts that preceded each final version (see Context below)
- **UPDATED**: `CLAUDE.md` — bullets for [D1]–[D4]'s underlying rules, plus two testing-methodology notes: an instant `nationalSeats()` diff can't measure funds/token-transfer effects (they don't touch `game.pop`), and `aiStep`/`runAIFull` are hardcoded to player `'p2'` — swapping player objects to reuse them for `'p1'` silently corrupts the population data rather than working

#### Design Decisions
- **[D1] Non-politicians are deliberately stronger/quirkier than the political roster, not weaker.** An earlier pass this session made them weaker ("glass cannons," a real popularity-side downside on each) before the user clarified that was a misreading of the intent — celebrities are meant to be fun, over-the-top picks explicitly allowed to exceed political-roster ceilings, including Vajpayee's Pokhran Test (previously "the ceiling nothing else reaches").
- **[D2] Special powers may resolve instantly or last exactly one phase.** See above.
- **[D3] Resource-seizure powers must confiscate/destroy the opponent's resources, not transfer them to the activator.** Kejriwal's, Sivaji Rao's, and an intermediate version of Indira Gandhi's power all originally reused the existing transfer-to-self primitives by default; the user clarified "seizure"/"raid"/"confiscation" should mean the resources vanish, not move to the activator. This changes a power's real value, not just its wording — each self-cost had to be re-modeled after the switch.
- **[D4] Sivaji Rao's power was fully redesigned rather than rebalanced.** After switching to confiscation-only, no self-cost magnitude between −1% and −6% nationwide broke even (true full-game value modeled from −2.4 to −27.2 seats depending on the cost). Rather than keep shrinking the cost toward the smallest number that cleared zero, redesigned around his "one-day CM" archetype directly: free, instant, 100% popularity in his home state.

#### Agenda System & Policy-Tag Reworks — 2026-07-26

**ADDED**: `data/policy-tags.json` — new "Film and TV" agenda (tagEffects: `Education: +8`, `TribalLands: +12`), assigned to Hema Malini, Rajinikanth, Amitabh Bachchan, Sachin Tendulkar, Jayalalithaa, Sivaji Rao (swapped in for each one's weakest-fit existing slot) [C5]

**REWORKED**: `data/policy-tags.json` & `data/politicians-data.json` — 6 politician agenda assignments swapped to improve thematic fit:
  - **Sivaji Rao** (2026-07-26): Press Freedom + Film and TV (journalist/one-day-CM movie-plot fit), dropped Judicial Activism + Infrastructure [C6]
  - **Rahul Gandhi**: Judicial Activism replaces Land Reforms (Bhatta Parsaul anti-land-acquisition framing → "Save the Constitution" 2024 campaign messaging) [C13]
  - **Sardar Patel**: Land Reforms replaces Anti-Corruption (fits forced-integration-of-princely-states historical pattern; new Iron Unification power design reflects this) [C14]

**REWORKED**: Seven policy-tag effects to fix geographic/thematic accuracy (2026-07-26):
  - **Press Freedom**: `Education: +8`, `MinorityAreas: +8`, `TribalLands: +4` (was `Education: +4`, `MinorityAreas: +4`) — bumped 2× [C7]
  - **Public Sector**: `IndustrialCorridor: +4`, `Manufacturing: +4`, `TribalLands: +4`, `AgriculturalRegion: -4` (was backwards: `AgriculturalRegion: +4`, `IndustrialCorridor: -4`, `Manufacturing: -4`) [C8]
  - **National Defense**: dropped `CoastalIndia: -12` (no real-world story), added `MinorityAreas: -4` (Northeast/J&K security friction) [C9]
  - **Caste Reservation**: added `SouthIndia: +4` (Dravidian reservation tradition), removed `MinorityAreas: -12` (conflated caste politics with religious-minority politics) [C10]
  - **Judicial Activism**: `Education: +8`, `MinorityAreas: +4`, `TribalLands: +4`, `IndustrialCorridor: -4`, `Manufacturing: -4` (was a costless `Education: +4`, `IndustrialCorridor: +4` freebie) [C11]
  - **Land Reforms**: `IndustrialCorridor: +8`, `Manufacturing: +8`, `AgriculturalRegion: -8`, `TribalLands: -8` (completely inverted — recast as land-acquisition-liberalization, industry-friendly/anti-farmer, distinct from Agricultural Reforms which stays generic pro-farmer) [C12]

**REDESIGNED**: Three politician special powers (2026-07-26):
  - **Sardar Patel (Iron Unification)**: was a single small-UT 70%-floor for 3,000 Cr (weak/overpriced); now nationwide 20% popularity floor + 1,000 Cr funds gain, zero cost otherwise, gated by new `requiresMinPhase: 5` mechanic (`mobile/game.js`: new field in `makePlayer`, new check in `activatePower`, new AI `canPay` gate). Explicit exception to "no timing-gate costs" rule, documented in CLAUDE.md [C15]
  - **B.R. Ambedkar (Constitutional Reform)**: was home-state-only +25% popularity for 2,500 Cr (thematically mismatched — he authored the *national* Constitution, not a Maharashtra-only reform); now `MinorityAreas: +10%` / `TribalLands: +10%` plus a full refund of all Cr spent on agendas so far. New `refundAgendaSpend` effect kind added to `mobile/game.js`'s `runEffect` (derives total spend from `agendaProgress` tap counts × flat per-tap cost) [C16]
  - **P.V. Narasimha Rao (Minority Government Survival)**: was a generic "replay a completed agenda" mechanic; now lowers his seats-to-win threshold to 250 (from 272) for the rest of the match, same 2,000 Cr cost — reflects his real 1991-96 minority government. New `lowerSeatsToWin` effect kind + per-player `seatsToWinOverride` field, read in `finalizeGame()` instead of the single shared `game.cfg.seatsToWin` constant [C17]

**UPDATED**: `mobile/index.html` — pin button (bottom-right of info panel): fixed 70px button with full button styling instead of faded 48px icon [C2]

**ADDED**: `mobile/main.js` + `mobile/index.html` — group-capture ring feature: `renderGroupCaptureBadges()` function + `.gchip.captured-p1/p2` CSS — hex chip border lights up in the holder's color when a player achieves regional dominance [C3]

**UPDATED**: `data/politicians-data.json` — Hema Malini now has `secondaryHomeStates: ["Tamil Nadu"]` alongside her primary Karnataka, updated her Star Power Rally flavor text to reflect both home states [C4]

**UPDATED**: `CLAUDE.md` (2026-07-26) — two new bullets under Game design principles:
  - Sardar Patel's phase-5 gate as an explicit documented exception to the "no timing-gate costs" rule (flavor decision: "mimicking how long real unification took") [C18]
  - New methodology note: a policy's `tagEffects` sign and region choice should be sanity-checked against real-world Indian political geography, as a distinct pass from magnitude balance or same-state-cancellation [C18]

**UPDATED**: `findings.md` — 7 new dated 2026-07-26 entries documenting this session's findings (funds double-credit confirmation, home-state-collision, Education-tag film-industry mapping, agenda avg-pts balance metric, border/minority tag overlap, win-condition single-check-point, testing-methodology bugs) [C19]

#### Context
This session reviewed every special power in the 20-politician (21 with Sivaji Rao) roster for redundant/duplicate mechanics, reworked the 4 non-politician powers' design philosophy (twice — an initial "weaker" direction was corrected to "stronger" per [D1]), fixed several powers whose text no longer matched their actual mechanics, and redesigned 4 politicians' powers around confiscation instead of transfer per [D3]. Along the way, two testing-methodology bugs were found and fixed in the modeling scripts used to validate these changes (an instant seat-diff test is blind to funds/token effects; reusing the AI's code for both players via a player-object swap silently corrupts data) — see `CLAUDE.md` and `findings.md` for the full detail. Modi's Demonetization needed a real one-phase persistent-state mechanic, which required revising the project's long-standing "instant-only, ever" rule to "instant or exactly one phase" per [D2] — formalized in ADR-0009. All changes maintain single-player-vs-AI scope; multiplayer backend remains deferred per ADR-0007. A parallel comprehensive agenda-system review fixed six politicians' agenda assignments to better match historical/thematic patterns, reworked seven policy-tag effects for geographic and thematic accuracy, and redesigned three major special powers (Sardar Patel, B.R. Ambedkar, P.V. Narasimha Rao) with new engine mechanics (phase-5 gating, agenda-spend refunds, per-player win thresholds). The design rationale for each rework and methodology notes are recorded in CLAUDE.md and findings.md.

---

### 🎮 Northeast Quick-Invest Button & 21st Politician (Sivaji Rao) — 2026-07-25

#### Mobile UI: Regional Quick-Invest Cluster
- **ADDED**: `mobile/index.html` — new `.corner-top-right` container holding NE8 quick-invest button (Nagaland, Manipur, Mizoram, Tripura, Meghalaya, Sikkim, Arunachal Pradesh, Assam) [C2]
- **RESIZED**: All 4 quick-invest buttons (Delhi, Goa, All UTs, NE8) scaled 50% larger (90px→135px icon size, 32px→48px font-size for icon, 13px→20px for label); border-width and box-shadow remain unscaled per project convention [C3]
- **REPOSITIONED**: Goa button moved up relative to All UTs button by increasing `.corner-left` flex gap (14px→26px) to improve visual separation [C4]
- **REPOSITIONED**: Delhi quick-invest button moved into new `.corner-top-left` container, made circular [C1]

#### Game Data & New Politician
- **ADDED**: `data/politicians-data.json` — new 21st politician entry `sivaji-rao` (Lokahit party, Maharashtra home state, archetype "THE PEOPLE'S ONE-DAY CM", 4 signature agendas: Anti-Corruption/Law and Order/Infrastructure/Judicial Activism). Special power "One-Day Ordinance": steals 30% of opponent's cash on hand, costs 6% of player's own nationwide popularity [C8]
- **FIXED**: `data/politicians-data.json` — `rajinikanth` image path now correctly points to `Rajinikanth.png` (was wrongly pointing at `Sivaji_Rao.png`); `br-ambedkar` corrected to `Bhimrao_Ambedkar.png` (was `BR_Ambedkar.png`); `pv-narasimha-rao` corrected to `P_V_Narasimha_Rao.png` (was `PV_Narasimha_Rao.png`) [C9]

#### Portrait Images & Asset Corrections
- **ADDED**: `assets/images/` — 7 new politician portrait images (Bhimrao_Ambedkar.png, Jayalalithaa.png, Hema_Malini.png, P_V_Narasimha_Rao.png, Rajinikanth.png, Lal_Bahadur_Shastri.png, Rajiv_Gandhi.png) [C10]
- **CORRECTED**: Renamed 2 typo'd generated filenames to match convention (Rajinikaanth.png→Rajinikanth.png, Laal_Bahadur_Shastri.png→Lal_Bahadur_Shastri.png) [C10]

#### Mobile Engine & Test Suite
- **ADDED**: `mobile/game.js` — `NORTHEAST_IDS` array (8 state svgIds: Nagaland, Manipur, Mizoram, Tripura, Meghalaya, Sikkim, Arunachal Pradesh, Assam), exported via API alongside existing `SMALL_UT_IDS` [C5]
- **ADDED**: `mobile/main.js` — `neBtn` click handler implementing double-tap-to-invest pattern for NE8 region, looping `G.investCash()` over `G.NORTHEAST_IDS` [C6]
- **FIXED**: `mobile/simulate.js` — replaced two hardcoded "20" strings in test-summary console output with `data.politicians.length` for dynamic roster reflection (roster is now 21 politicians) [C7]

#### Design Decisions
- **[D1] Separate Sivaji Rao Profile**: Added as 21st politician rather than relabeling/reusing the existing Rajinikanth entry. Rationale: Gemini-generated `Sivaji_Rao.png` actually depicts Anil Kapoor's character from the film *Nayak*, not Rajinikanth — a naming coincidence, since "Shivaji Rao" is both the film character's name and Rajinikanth's real birth name (Shivaji Rao Gaekwad). The existing Rajinikanth entry's archetype ("THALAIVAR OF THE MASSES"), Tamil Nadu home state, and special-power mechanics were all genuinely written for Rajinikanth and needed no change. Cleanest resolution: two distinct politicians, each eventually with correct art.

- **[D2] Sivaji Rao Power Mechanics**: "One-Day Ordinance" special power (30% opponent cash steal, 6% nationwide popularity cost) designed as mechanically distinct from Kejriwal's Anti-Corruption Raid (50% steal, opponent-homestate-only cost) despite both being anti-corruption-crackdown themed. Reuses existing effect "kinds" from the unified power schema (funds, stealFundsPct, popularity) without requiring new engine code, following the project convention of politicians sharing effect kinds at different tunings. Rejected alternatives: reusing Kejriwal's exact formula (pure duplicate); inventing a new benefit/cost kind (would need `mobile/game.js`'s `activatePower()` engine changes).

#### Context
Session focused on adding a dedicated quick-invest button for the Northeast region (8 states) to improve regional gameplay flow, expanding the politician roster to 21 entries, and correcting portrait-image mismatches and filename typos discovered during a round of Gemini portrait generation. Image fixes included 4 of 7 new portraits needing filename/path corrections before `politicians-data.json` would resolve them. All changes maintain single-player vs. AI scope and existing game mechanics.

---

### 🎨 Mobile UI Refinements: Welcome Screen & Politician-Select Ballot-Card Details — 2026-07-25

#### UI Enhancements
- **ADDED**: `mobile/index.html` — new full-bleed `#welcomeOverlay` welcome/entry screen displayed before the politician-select carousel, reusing `assets/images/PradhanMantriBg.png` (poster-collage illustration) as an `object-fit:contain` background with a semi-transparent dark-gradient scrim (hiding the image's own baked-in Hindi title text) and a "Begin Campaign" button that hides the welcome screen and reveals `#selectOverlay` [C3]
- **UPDATED**: `mobile/index.html` — politician-select screen's manifesto list (`.pol-agenda-chip` rows) now displays a standalone hollow "punched ballot-stub" circle bullet (`.punched-circle`) before each row's policy icon, and the row divider changed from a dashed horizontal line to a solid ruled line [C2]
- **UPDATED**: `mobile/main.js` — welcome screen and manifesto-list styling wired to real DOM; `#selectOverlay` now starts with `hidden` attribute (revealed by welcome screen's "Begin Campaign" button click) [C2]

#### Design & Planning Documentation
- **CREATED**: `design/viewport-migration-plan.md` — phased roadmap (not yet started) for eventually achieving full responsive design across phone/tablet/desktop screen sizes. Documents the current fixed-viewport fragility root cause, phases 0–4 with risk assessments (Phase 0 safety baseline, Phase 1 real viewport meta tag, Phase 2 flexible-height stack, Phase 3 magic-px-to-relative-units, Phase 4 honeycomb/map redesign), and open decisions (prototype handling, min/max height bounds, tablet layout scope). Scope explicitly excludes game-logic or map visual redesign — purely CSS/layout infrastructure planning. [C1]

#### Project Documentation Updates
- **UPDATED**: `CLAUDE.md` — added new UI conventions bullet documenting the welcome screen as the app's real entry point (`#welcomeOverlay`, poster background with dark scrim, "Begin Campaign" button flow). Extended existing "Playwright testing notes for this project" bullet with 6th sub-point warning: `object-fit:cover` on full-bleed background images can crop noticeably tighter on real phones than Playwright screenshots predict — don't trust emulated screenshots alone for crop tightness on images where edge cropping would cut meaningful content; verify on real device or use `object-fit:contain` instead. [C4]
- **UPDATED**: `findings.md` — 3 new dated 2026-07-25 entries (see Findings.md status in sync report) covering object-fit crop behavior differences vs. Playwright, Gemini image-gen nickname handling, and Gemini MCP tool model unavailability [C5]

#### Design Decisions
- **[D1] Separate Full-Screen Welcome Entry Point**: Added a separate full-bleed welcome overlay (`#welcomeOverlay`) before the politician-select carousel, rather than embedding poster art as a small banner inside the select screen itself. Rationale: user explicitly requested a separate screen with the poster as the full background (reusing existing `PradhanMantriBg.png` asset now rather than commissioning new art immediately).
  - Alternatives considered: (a) small bordered banner embedded in select-screen header above carousel (built first, functional, but user then explicitly asked for separate full-screen instead); (b) generate brand-new flat-vector-style hero art matching Booth Ink's illustration style (offered as future option, not used this session).
  
- **[D2] Punched-Stub Bullet Scope Limited to Select Screen**: Checklist-style punched-stub-circle agenda-list bullet applied only to politician-select screen's manifesto list, not the in-game HUD agenda tray. Rationale: an earlier idea converted the in-game tray from a 2×2 grid to single-column with punched-stub dividers; user explicitly said "scrap this idea" for the in-game tray specifically. The select-screen bullet (hollow circle, standalone marker before icon, solid ruled dividers between rows) is what the user confirmed as correct.
  - Alternatives considered for bullet style: (a) checkmark seal overlapping icon corner (rejected — user wanted icon kept round); (b) icon reshaped to rounded square with seal (rejected — user wanted round icon kept); (c) hollow punched-stub circle as standalone marker (approved).

#### Context
Session focused on welcome-screen art integration and politician-select ballot-card detail polish. The viewport migration plan was drafted as a reference doc before committing to an approach; it captures the design work needed to eventually achieve full responsiveness without making any code changes this session. All UI changes are CSS/DOM additions only — no game logic or engine modifications.

---

### 🤖 AI Targeting & Pacing Improvements, Geography Data Fix — 2026-07-25

#### AI Behavior Fixes
- **SIMPLIFIED**: `mobile/game.js` — AI investment targeting now commits to a single randomly-chosen state group for the entire match (`pl.aiTargetGroup`), replacing round-robin cycling across all groups. [C1]
- **REFACTORED**: `mobile/game.js` — rally token targeting changed to one random pick per phase among the 10 largest-seat states (`pickAIRallyTarget`); rejected placements (state at shared 2-play cap) are left unspent, banking toward the auto-craft threshold. [C2]
- **UNCONDITIONAL**: `mobile/game.js` — AI now auto-crafts and deploys its Special Power the instant 6 rally tokens accumulate (`specialPowerupCraftCost`), no longer gated by AI personality profile's `craftsTokens` flag. [C3]
- **REMOVED**: `mobile/game.js` — round-robin `pl.aiGroupCursor` cursor and its cycling logic, superseded by single-group commitment strategy. [C4]
- **ADDED**: `mobile/game.js` — `game.rng` now stored on the game object to support ongoing random draws during `aiStep()`, not just at game creation. [C5]

#### AI Phase-Pacing Fix
- **ADDED**: `mobile/main.js` — `planAITickPacing(game)` now runs at the start of every phase, dry-running the AI's remaining turn on a `structuredClone` with independent RNG to count exactly how many actions are needed, then paces `scheduleAITick()`'s interval (clamped 300–4000ms) to spread exactly that many ticks evenly across the phase's real duration. [C7]
- **CHANGED**: `mobile/main.js` — `scheduleAITick()` now uses the planned `aiTickIntervalMs` (with ±20% jitter) instead of a fixed 2000+random×2000ms cooldown, eliminating budget waste from action throttling that couldn't keep up with phase spend demand. [C8]

#### Data Corrections
- **FIXED**: `data/states_data.json` — Himachal Pradesh's `WesternBorder` group tag removed (`FALSE`), `EasternBorder` retained (`TRUE`). Rationale: HP borders Tibet/China, not Pakistan; straightforward geography correction. [C6]

#### Documentation
- **UPDATED**: `findings.md` — 3 new dated 2026-07-25 entries covering the real in-browser AI pacing throttle and its budget-waste impact, investment-scoring size-bias formula, and never-crafting-Nationwide-Rally bug. [C9]
- **UPDATED**: `CLAUDE.md` — 3 new bullets under "Game design principles" and "Local development & testing" documenting headless-vs-real AI strength mismatch and AI greedy-scoring size-invariance requirement. [C10]

#### Design Decisions
- **[D1] Bug-First over Balance**: Fixed two real AI implementation bugs (investment-scoring size bias, token-hoarding preventing power crafting) directly in shipped code rather than treating as a politician-balance issue. Rationale: 120-game bulk simulation showed no politician-specific outlier; exploit worked broadly regardless of player selection, proving it was AI-code-level bugs.
  
- **[D2] Single-Group Commitment**: Simplified investment targeting from round-robin-across-groups to one randomly-chosen group for the whole match. Rationale: more cohesive regional focus, direct regional-dominance bonus pursuit; mirrors what a focused human player does.
  
- **[D3] Simple Rally Targeting**: Random pick among top-10 largest states, rejected placements bank toward 6-token Special Power auto-craft. Rationale: matches user's explicit "super simple fix" spec; ensures tokens reliably accumulate instead of always being spent immediately (which was the root cause of AI never reaching Nationwide Rally).
  
- **[D4] Unconditional Crafting**: 6-token Special Power threshold, no personality profile gate. Rationale: ensures AI reliably uses its own kit every match regardless of randomly-drawn profile; profiles now affect investment/pacing strategy, not power usage.
  
- **[D5] Even Pacing, Not Instant Burst**: Dry-run per-phase action count, space ticks across real phase duration. Rationale: user rejected instant catch-up burst (`G.runAIFull()` at phase end) as "cheating" since humans can't compete with machine-speed instant spending. Even pacing preserves original "visibly move, one at a time" design intent while achieving near-full budget utilization.
  
- **[D6] Geography Correction**: Himachal Pradesh borders only China/Tibet, not Pakistan. Rationale: straightforward cartographic fix.

#### Context
Multi-turn session focused on diagnosing why AI felt "too hard then too easy" after earlier player-strategy testing. Isolated three distinct bugs: (1) investment scoring favored tiny states 30–80x over large ones, (2) rally token hoarding prevented Special Power crafting entirely, (3) real-browser action pacing (~20/min) left up to 68% of lifetime budget unspent, while headless tests saw no throttle. Fixed all three per user feedback. Key insight: `G.runAIFull()` headless testing masks real-browser pacing constraints entirely — prior simulation results were an upper bound on AI strength, not a match for the deployed opponent.

---

### 🎨 Mobile UI Polish: Ballot-Card Readability, Layout Fit & Scale Convention — 2026-07-24

#### Real-Device Testing & Layout Optimization
- **FIXED**: `mobile/index.html` — removed errant `justify-content:safe center` from `.pol-card` that broke carousel centering (CSS whitespace bug) [C1]
- **RESIZED**: `mobile/index.html` — politician portrait now a fixed-size centered square (820×820px, `object-fit:cover`, no cropping) inside a full-width gradient band [C2]
- **SCALED**: `mobile/index.html` — ballot-card and declare-card CSS (~2.5x fonts, padding, gaps) to match app's no-viewport-tag 980px virtual-canvas rendering convention; inline border-widths and shadows intentionally remain unscaled [C3]
- **REMOVED**: `mobile/index.html`, `mobile/main.js` — "Booth Ink · Party" footer text; Play button now full-width, enlarged, and centered [C4]
- **POLISHED**: `mobile/index.html` — applied `zoom:.95` to overlay-header, ballot-card, and pol-dots for uniform 5% visual shrink after card was "almost-but-not-quite" fitting one screen [C5]
- **RESTYLED**: `mobile/index.html` — overlay header title (44px→64px font-size), removed subheadline paragraph and its dead CSS rule [C6]
- **REMOVED**: `mobile/index.html`, `mobile/main.js` — entire pol-masthead banner (candidate index + archetype text) after polish pass [C7]
- **REPOSITIONED**: `mobile/index.html`, `mobile/main.js` — party seal moved next to politician name in new `.pol-name-row` flex container, enlarged 76px→100px [C8]
- **SIMPLIFIED**: `mobile/main.js` — `buildPolCard(p, idx, total)` → `buildPolCard(p)`, dropped now-unused `idx` and `total` params [C9]

#### Design Decisions Documented
- **[D1] CSS zoom vs. hand-rescaling:** Used `zoom:.95` on flex children to apply uniform 5% shrink instead of manually adjusting ~40 individual font/padding/gap values. **Rationale**: zoom is Safari/WebKit-friendly (this project's deployment target), and applying it to content-sized flex items avoids fighting outer layout positioning.
- **[D2] Portrait sizing trade-off:** Capped portrait to a smaller centered square (not full-width) inside a gradient band, rather than full-bleed image. **Rationale**: full-width square (~900 real px) exceeded total available vertical budget (~770–792 real px) on real device; smaller square preserves "no cropping" requirement while fitting the layout.
- **[D3] 2.5x scale convention:** Scaled ballot-card CSS ~2.5x instead of adding `<meta viewport>` tag to fix "text too small and unreadable." **Rationale**: app renders on virtual ~980px canvas (no viewport tag) zoomed out ~0.4x; in-game HUD already uses 2.5x authoring scale, ballot-card didn't initially — matching app-wide convention was zero-risk to shared chrome.
- **[D4] Playwright verification:** Verified all layout fixes with custom Playwright harness (393×852 viewport, 3× device scale factor matching user's real device) rather than trusting `devices['iPhone 14']` preset (390×664 ≠ real). Computed real-zoom conversion factor to convert layout-space DOM measurements to true CSS px for exact overflow/margin math. **Rationale**: precise numbers needed for tightest case (Nehru's 266-char power description), not just "looks about right" from screenshots.

#### Context
Multi-turn session iterating on politician-select ballot-card UI based on real iPhone testing, fixing whitespace/cropping/readability bugs, and applying two rounds of polish (5% uniform shrink; bigger title, banner removed, seal relocated and enlarged). All changes CSS/DOM-only — no data files, engine, or game logic touched.

---

### 🎨 Mobile UI Redesign: Ballot-Card Select/End Screens & Region-Effect Agenda Chips — 2026-07-24

#### Visual Design Overhaul
- **REDESIGNED**: Politician-select carousel (was 2-column grid, now full-screen swipeable cards) and end-of-game parliament declaration screen as "ballot cards" — Booth Ink's own light-theme ink/brass/stamp/paper aesthetic (tricolor stripe, brass-ringed seal, ticket-stub die-cut, decree box) instead of a literal Pokémon-style holo-foil card.
  - **Rationale for ballot-card aesthetic [D1]**: Builds trading-card structure from the game's existing Booth Ink materials instead of an unrelated aesthetic; ties every card together as one unified set since only the party color varies.
  - **Rationale for light-only theme [D2]**: The main app has no dark mode anywhere else, so inventing one only for this screen would clash — confirmed 2026-07-24 after rejecting a first dark-card-stock draft specifically for inconsistency.

#### UI Implementation & Components
- **REPLACED**: `mobile/index.html` — 2-column politician grid replaced with full-screen swipeable card carousel; all select-screen layout wired to new ballot-card visual identity [C1]
- **UPDATED**: `mobile/main.js` — agenda chips now tap-to-expand real region-effect breakdown (`agendaEffectChips` shared helper) instead of showing raw bonus numbers [C2]
- **ENHANCED**: `mobile/main.js` — real party-logo images in seal/badge (`partyBadge()`), falling back to emoji if not available [C3]
- **FIXED**: `mobile/index.html` — carousel whitespace bug (dropped margin-top:auto, added justify-content:safe center) [C4]
- **ADDED**: `mobile/index.html`, `mobile/main.js` — pin toggle to state-group info card so it survives state taps while pinned [C5]
- **PORTED**: `mobile/main.js` — desktop's parliamentarch hemicycle SVG into mobile end-game screen [C6]

#### Design Artifacts & Data
- **CREATED**: `design/prototypes/pol-card-mockup.html` — frozen "ballot card" trading-card mockup, approved by user [C7]
- **UPDATED**: `data/politicians-data.json` — added "archetype" flavor field (e.g. "MASS MOBILIZER") to all 20 politicians [C8]
- **WIRED**: `mobile/index.html`, `mobile/main.js` — approved ballot-card design into real select carousel (tricolor stripe, brass seal, art window w/ ticket-stub die-cut, manifesto planks, decree box) [C9]
- **WIRED**: `mobile/index.html`, `mobile/main.js` — matching ballot-card treatment for end-of-game parliament screen (declare-card, seal icon, seat ledger) [C10]

#### Bug Fixes
- **FIXED**: Manifesto-plank accordion — detail now opens under the tapped row, not always the last row [C11]
- **FIXED**: Invisible tricolor stripe on parliament card (zero-width flex-item bug caused by `align-items:center` on parent) [C12]

#### Agenda Information Display Redesign
- **REMOVED**: Raw per-politician agenda bonus numbers from select screen (were meaningless after agenda-effect-system revamp)
- **REPLACED [D3]**: With tap-to-expand real region-effect breakdown (`agendaEffectChips()` shared helper in `mobile/main.js`) showing per-region magnitude impact instead of raw numbers
  - **Rationale**: Reuses the same region-effect data the live in-game agenda-info panel already shows, refactored into one shared helper instead of duplicated logic

#### Context
Session focused on redesigning the politician-select and end-of-game screens as a cohesive visual identity using Booth Ink's light-theme ballot-card aesthetic, refactoring agenda display to show real regional effects instead of raw numbers, wiring the approved mockup into production code, and fixing related UI layout bugs. All changes maintain MVP scope and light-only theme consistency with the rest of the app.

---

### 📚 Documentation Reconciliation & Comprehensive Project Wiki — 2026-07-24

#### Project Wiki & Reference Documentation
- **CREATED**: `docs/wiki.html` — comprehensive project wiki (Claude Artifact, 61 KB). Consolidates game mechanics reference for players, complete architecture/implementation guide for developers, and a full divergence/discovery log covering every significant finding from game development history. Intended as an exploratory companion reference to the authoritative `design/economy-status-map.md`.

#### Design Documentation Synchronization
- **UPDATED**: `design/economy-status-map.md` Core loop section — reconciled funds figures from outdated 2,500/1,000 Cr to actual shipped 5,000/2,500 Cr (starting/refresh per player), 30,000 Cr lifetime budget. Added new "decided 2026-07-24" example card documenting the funds bump rationale from user's multi-round playtesting feedback.
- **RECOMPUTED**: `design/economy-status-map.md` Plausibility-check table — recalculated all margins and seat-equivalent values against the real 30,000 Cr budget (~281/543 seats cash-only, ~371/543 combined, ~99-seat margin vs. 272-seat threshold). Corrected the doc's previous "cash alone can never win" claim, which the recomputed budget reverses.
- **RESOLVED**: `design/economy-status-map.md` Known bugs (2026-07-23) section — struck through three items as "resolved-pending-on-device-confirm" with code citations: AI fund-spend (now correctly spending ~0/phase via greedy heuristic), starting-position 200-seat ceiling (never exceeded 187 in stress test), bps-sum invariant violation (fixed in `mobile/engine.js`'s `loseAt()` degenerate case). All three verified working via `npm test` regression suite (5 full 10-phase games + all 20 politician powers).
- **NARROWED**: `design/economy-status-map.md` Still-not-built section — removed "Options/settings menu" as overbroad (Sound/Music/Pause/New-Game controls confirmed working in `mobile/main.js:799-823`), replaced with granular "Help/tutorial control" item for the only actually missing element.
- **REWORDED**: `design/economy-status-map.md` Special Powers sections — clarified all 20 politicians carry first-pass numeric costs/benefits (confirmed in `data/politicians-data.json` `power` field for every politician). Actual gap is an unrun balance/playtesting pass, not missing numbers.
- **STRUCK**: `design/economy-status-map.md` Still-not-built list — removed "PWA infrastructure" (manifest.json/sw.js/icon all confirmed shipped and registered in `mobile/main.js`), and bonus find "AI difficulty/personality variety" (4 AI_PROFILES fully implemented in `mobile/game.js` via `pickAIProfile()` + `AI_PROFILES` array).
- **FLIPPED**: `design/economy-status-map.md` Agenda section flow-card status pill — changed from `gap` ("not yet migrated into data/policy-tags.json") to `decided` (tagEffects migration confirmed complete in `data/policy-tags.json`, confirmed by direct file read contradicting the old pill status).

#### Project Instructions & Rules
- **UPDATED**: `CLAUDE.md` Game design principles section — added new durable rule: "When a numeric constant in `game-config.json` changes (e.g., economy scale), verify that `design/economy-status-map.md`'s prose sections and plausibility table are also updated — recording a decision in CLAUDE.md alone does not propagate to the design doc." This rule prevents repeat of the 1-day divergence (funds bump existed only in config + CLAUDE.md, never reached the design doc's Core loop or Plausibility-check sections).

#### Context
Full documentation reconciliation checkpoint. Cross-referenced `design/economy-status-map.md` against actual shipped code (`mobile/*.js`, `data/*.json`) and discovered a 1-day gap where the funds bump (2,500/1,000 → 5,000/2,500 Cr, decided 2026-07-24) was recorded only in config and CLAUDE.md, never reaching the design doc's prose or its derived plausibility table. Reconciled all eight divergent sections, recomputed the plausibility table against real budget, struck stale "known bugs" and "still not built" items with code citations, created comprehensive project wiki, and added preventative CLAUDE.md rule for future consistency.

---

### 🎮 Regional Dominance Instant Payout & Mobile Economy Rebalancing — 2026-07-24

#### Game Mechanics & Economy
- **RESTRUCTURED**: `mobile/game.js` — regional dominance bonus changed from recurring per-phase income (re-evaluated only at phase start) to instant, one-shot-per-qualifying-event payout via new `dominanceHeld` transition-tracking object (keyed `group.key+'|'+player`). Checked after every pop-changing action (investCash, playRallyToken, tapAgenda, activatePower, activateNationwideRally, startPhase), so calling while already qualified is a no-op but a false→true transition always pays. Supports repeatable payouts if dominance is lost and regained within same phase.
- **UPDATED**: `data/game-config.json` — mobileEconomy economy scale increased: `startingFundsCr` 2500→5000, `fundsRefreshPerPhaseCr` 1000→2500. Rationale: user's multi-round playtesting found previous scale insufficient to reach a majority win against the AI in adversarial play (caveat: post-change simulate.js still shows hung parliaments, but with substantially shrunk "Others" share; simulate.js uses randomized p1 stand-in rather than skilled human).
- **UPDATED**: `CLAUDE.md` — economy-scale exception bullet now cites new numbers (5,000 starting / 2,500 refresh) and documents the 2026-07-24 rationale for the increase.
- **UPDATED**: `design/economy-status-map.md` Regional Dominance section — rewritten to document instant/event-based payout decision, superseding the old phase-boundary-recurring-income description.

#### Mobile UI Polish & Interaction Refinement
- **REVERTED**: `mobile/index.html` — rolled back an uncommitted viewport-meta-tag + CSS-shrink experiment to original scale. Root cause: total fixed chrome height didn't fit real ~660-700pt Safari-tab viewport; border-widths (3-4px) stayed fixed while button dimensions shrank 43-57%, breaking neubrutalist border-to-size ratio. Rationale: standalone/home-screen-install remains intended deployment, so original larger-scale, no-viewport-tag design is correct.
- **REBUILT**: `mobile/index.html` — portrait-photo feature (pmini-portrait/pmini-id/pname/pmini-stats) rebuilt at original scale, preserving the UI improvement from the same uncommitted diff.
- **ADDED**: `mobile/index.html` — new CSS classes `.led-chip.eff-pos`/`.eff-neg` and `.info-groups.desc` for agenda/action info-panel display modes.
- **ADDED**: `mobile/main.js` — `renderAgendaCard()` and `renderActionInfo()` info-panel modes (activeAgenda/activeAction state), reusing bottom info bar to show regional effect breakdowns (tagEffects) and rally/power configuration details.
- **CHANGED**: `mobile/main.js` — agenda tap interaction changed from single-tap-to-invest to double-tap-to-invest (single tap shows info, double tap invests), matching map/state double-tap pattern for consistency.

#### Context
Session focused on refining mobile UI polish from real-device Safari testing, rebalancing mobile economy scale per playtesting feedback, and restructuring regional dominance payout to trigger instantly on qualifying rather than deferring to next phase. All changes maintain MVP scope.

---

### 🎨 Mobile UI Refinement: Dynamic Colors, AI Pacing, and Group Overview — 2026-07-23

#### AI Execution & Pacing Refactor
- **RESTRUCTURED**: `mobile/game.js` — split monolithic `runAI()` into `aiStep()` (single action, returns `{type, svgId, costCr}` descriptor) and `runAIFull()` (fast-forward all actions for tests), enabling granular action throttling and per-action UI animation.
- **REFACTORED**: `mobile/game.js` — AI investment targeting now cycles through regional groups via `pl.aiGroupCursor` (round-robin) instead of always picking the cheapest state nationwide, creating more cohesive regional strategies.
- **FIXED**: `mobile/game.js` — investment scoring now accounts for remaining headroom (`min(boost, 10000 - currentShare)/cost`) instead of raw boost, preventing endless reinvestment in maxed states (stress test: AI was stuck on group 0 for 2982+ actions, now reaches all 15 group dominances in 911 actions).
- **ADDED**: `mobile/main.js` — `scheduleAITick()` paces AI actions to ~20/min via randomized 2–4s `setTimeout` delays, replacing synchronous lock-step that made AI appear frozen.
- **UPDATED**: `mobile/simulate.js` — added explicit `Game.runAIFull()` calls after `createGame` and `endPhase` to replace removed implicit auto-run, fixing deterministic test behavior.

#### Service Worker & Caching Strategy
- **REFACTORED**: `mobile/sw.js` — switched from cache-first to network-first fetch strategy (`fetch preferred, cache fallback`) and bumped cache name to `pme-mobile-v2`, fixing persistent-stale-build issue where phones stuck on old cached code until service worker bytes changed.

#### Dynamic Politician Styling & Party Symbols
- **ADDED**: `mobile/main.js` — politician colors now pulled from each player's chosen politician's `primaryColor` field, set dynamically into `COLORS.p1`/`COLORS.p2` and CSS `--p1`/`--p2` variables (replacing fixed orange/green defaults).
- **ADDED**: `mobile/main.js`, `mobile/index.html` — `PARTY_SYMBOLS` map and `partySymbol()` function display actual chosen politicians' party symbols in header and state card (replacing hardcoded lotus/hand emoji).

#### AI Action Animation & Visual Feedback
- **ENHANCED**: `mobile/main.js`, `mobile/index.html` — AI investment actions now animate with player 2's color via `.fx-flash.p2` and `.fx-money.p2` CSS classes, providing real-time visual feedback for every AI move (paired with new `aiStep()` descriptor return).
- **ENHANCED**: `mobile/main.js` — same-party politician exclusion in `startGame()` AI opponent selection (Independent politicians remain eligible despite party affiliation).

#### Rally Token Tracking & Display
- **CHANGED**: `mobile/game.js` — `rallyPlaysByState[svgId]` now stores array of `playerKeys` instead of bare count, enabling per-player attribution.
- **ADDED**: `mobile/main.js`, `mobile/index.html` — rally tokens leave persistent colored map markers (`.rally-token-layer`, colored per player) rendered via `renderRallyTokens()`, providing visual history of token plays.

#### Bottom Info Panel Redesign
- **ADDED**: `mobile/main.js`, `mobile/index.html` — bottom info panel now toggles between single-state detail card (`renderStateCard()`) and group LED-indicator grid (`renderGroupCard()`), showing per-state leading indicator (50% threshold matching regional-dominance bonus) and state-code abbreviation (SvgId with "IN" prefix stripped).
- **FIXED**: `mobile/index.html` — added `.vs-bar[hidden]{display:none}` rule to prevent CSS specificity clash where `.vs-bar{display:flex}` was silently overriding browser's `[hidden]` UA-stylesheet rule.

#### Corner-Right Action Button Redesign (3-Iteration Refinement)
- **REMOVED**: `mobile/main.js`, `mobile/index.html` — collapsible agenda/token trays and toggle FABs entirely (removed `setTray()`, `setAgendaTray()`, `tokenToggleBtn`, `agendaToggleBtn`, badges, dots).
- **REMOVED**: `mobile/index.html` — `.group-readout` bar above map entirely, replaced by richer bottom-panel group-overview card.
- **REDESIGNED**: `mobile/index.html` — agenda (4) + rally/special/nationwide (3) buttons moved from hidden collapsible trays to fixed, always-visible corner-right grids. Initial attempt: combined fixed bar under map (too small, ate map flex height). Reverted to floating corner-right overlay after user review of real device (costs zero flex height, allows full-size buttons).
- **SIZED**: `mobile/index.html` — corner-right buttons resized to 98×82px matching corner-left UT/Delhi/Goa buttons exactly.
- **SPLIT**: `mobile/index.html` — buttons grouped into two labeled blocks ("AGENDA" / "RALLY") with real spacing between; group labels moved from below to above each block.
- **POSITIONED**: `mobile/index.html` — special-power button is 2-column-wide (`.action-btn-wide`) below State Rally + Nationwide Rally top row.
- **LABELED**: `mobile/index.html` — agenda buttons now display policy name wrapped under icon (`.action-btn-labeled`, `.action-btn-icon`, `.action-btn-label`); button height grown to 104px to accommodate label text.

#### Design Decisions Documented
- **[D1] Corner-right button placement/sizing** — 3-iteration refinement: (1) combined fixed bar under map (capped ~48px buttons before wrapping, reduced map height), (2) floating corner-right overlay (zero flex cost, full-size buttons), (3) sized to match corner-left UT buttons (98×82px). Rationale: floating overlay preserves map flex height while allowing readable button sizes; fixed bar created an unsolvable tradeoff between button size and map viewport.
- **[D2] Group LED-indicator "leading" state definition** — uses 50% threshold (`regionalDominance.thresholdBps`) matching the actual regional-dominance bonus mechanic, not simpler p1 > p2 majority. Rationale: avoids introducing a second, different definition of "leading" within the same app; directly ties visualization to the real mechanic it's designed to help players pursue.
- **[D3] State code abbreviation scheme** — reuses each state's `svgId` with "IN" prefix stripped (e.g., `INUP` → `UP`, `INMH` → `MH`) for LED grid labels, rather than maintaining a separate 36-entry abbreviation data file. Rationale: zero data-maintenance burden, already available on every state record, matches user's own example exactly.

#### Context
Session focused on finalizing mobile UI polish and interaction responsiveness through AI pacing improvements, service-worker cache strategy fix, dynamic politician styling, persistent rally-token visualization, and a 3-iteration refinement of corner-right button layout (trading off fixed-bar button size against map viewport, ultimately settling on floating overlay per device testing). All changes maintain MVP scope; no external infrastructure or breaking schema changes.

---

### 🤖 AI Personalities, PWA Integration, and Redistribution Engine Fixes — 2026-07-23

#### Engine & AI
- **FIXED**: `mobile/engine.js` — loseAt() degenerate-case bug where a player holding exactly 100% of a state (reachable via repeated cheap UT taps) could lose popularity with nowhere for it to go, breaking the bps-sum invariant. Freed share now falls to Others pool when both opponent and others are at 0 (mirrors existing "round one, derive the other" discipline). Added regression test in engine self-check.
- **ADDED**: `mobile/game.js` — 4 AI personality profiles (aggressive-investor, policy-rusher, rally-spammer, group-bonus-rusher) wired into createGame/runAI/aiInvestRemainingFunds. Profiles vary agenda-tap aggressiveness, rally-token-craft strategy, and group-dominance-seeking investment-scoring bias. Implementation as parameters on the single existing greedy heuristic, not separate AI functions.

#### Mobile Build
- **ENHANCED**: `mobile/main.js` — double-tap-to-invest interaction model, 4 UI feedback animations (tap flash, invalid-action shake+buzz, red/green fund-change flash text), full audio system (8 triggers: bg_music, cash_added, money_spent, invalid_action, fanfare, game_over, phase_reset, rally_sound), margin-based map state coloring (|P1% − P2%|), and settings menu wiring.
- **ENHANCED**: `mobile/index.html` — settings overlay, fx-layer for animations, gear button, manifest/icon links, supporting CSS for new features.
- **CREATED**: `mobile/manifest.json` — minimal PWA manifest (icons, display mode, start URL).
- **CREATED**: `mobile/sw.js` — minimal cache-first service worker with explicit filename precache list (no bare directory paths, which silently 404 on this project's dev server).
- **CREATED**: `assets/icons/pme-icon.svg` — generated square SVG app icon (unblocks PWA manifest icon link; PNG assets remain out of scope for MVP).

#### Data & Design
- **FIXED**: `data/policy-tags.json` — corrected 2 accidental tag-cancellation bugs:
  - Uniform Civil Code: dropped stray `EasternBorder` oppose tag that canceled support in UP/Bihar/Uttarakhand/Himachal Pradesh (same pattern as pre-fix National Defense)
  - Indigenous Rights: reduced `IndustrialCorridor` oppose from -8 to -4 (partial fix, matching Hindi Language precedent; preserves real tribal-land-vs-industry tension while un-canceling policy's core thematic states)
- **UPDATED**: `design/economy-status-map.md` — recorded full policy-audit findings, updated policy ranking table (Uniform Civil Code -9.6→+14.0, Indigenous Rights -12.1→-2.5), expanded "Still open" list with remaining unaudited policies and options-menu gap.
- **CREATED**: `design/TASKLIST.md` — task tracking (initially 13 tasks from design doc's "Known bugs"/"Still open" sections, then updated post-verification: 5 discovered already fixed, 8 implemented or confirmed working, 0 remaining).

#### Project Documentation
- **UPDATED**: `findings.md` (via /checkpoint Phase 1.3) — 3 new 2026-07-23 entries (design doc's "Known bugs" list stale relative to real code, engine.js's loseAt() invariant bug surfaced by AI personality changes, service worker precache 404s on bare directory paths). See findings.md for details.
- **UPDATED**: `CLAUDE.md` (via /checkpoint Phase 1.3, user-approved) — 3 new durable game-design rules (verify design-doc bug lists against code before implementing, service-worker precache lists need explicit filenames on this dev server, re-run npm test + stress test after AI-behavior changes).

#### Key Design Decisions
- **[D1] Task Verification Discipline**: Treated 5 of 13 originally-planned tasks as already-fixed after verifying against actual code (AI fund spend, 200-seat starting-position bug, bps-sum drift, agenda proration, hung-parliament resolution) rather than re-implementing. Ran targeted diagnostic scripts and stress tests directly against mobile/engine.js and mobile/game.js before writing any fix.
  - **Rationale**: Design doc's "Known bugs" and "Still open" sections can be stale relative to real code state. Verifying first caught already-correct code before any wasted re-implementation.
- **[D2] loseAt() Bug Resolution**: Gave freed share to Others (neutral default) when both opponent and others are 0, rather than leaving it lost or assigning to opponent.
  - **Rationale**: Mirrors existing "round one, derive the other" discipline's spirit — no proportion to split by when both other shares are 0, so the neutral "Others" default absorbs it.
- **[D3-D4] Policy Tag Audit Decisions**: 
  - **[D3]** Indigenous Rights: partial magnitude reduction (IndustrialCorridor -8→-4) rather than full removal, matching Hindi Language precedent. Real tribal-land-vs-industry tension is thematically legitimate, unlike UCC's pure accidental collision.
  - **[D4]** Uniform Civil Code: full removal of stray EasternBorder oppose tag. No thematic reason for border proximity to affect this policy; pure accidental collision matching National Defense pattern.
- **[D5-D6] Remaining Policy Audits**: Flagged Public Sector's inverted tag directions (industrial-region PSUs benefiting from public-sector jobs, yet tagged as opposing industrial/manufacturing regions) but did not unilaterally fix — outside this audit's scope per project convention. Reviewed and left unchanged: Land Reforms, Agricultural Reforms, Caste Reservation, Secularism — their support/oppose tag collisions represent real thematic polarization, not bugs.
- **[D7] PWA Asset Strategy**: Used generated square SVG icon instead of PNG assets. PWA infrastructure was originally scoped as blocked on "needs real image assets," but generating a simple vector icon fully unblocked the task rather than leaving it stalled on an asset-creation dependency that was never a hard requirement.
- **[D8] AI Implementation Architecture**: Implemented 4 personality profiles as parameters on the single existing runAI() greedy heuristic, not as separate AI decision functions. Matches the design doc's own stated intent exactly ("3-4 parameter profiles... picked randomly per match, on the same decision engine") and keeps AI a single maintainable code path.

#### Context
Session focused on completing the mobile build end-to-end: AI opponent sophistication (4 personality profiles with tunable parameters), PWA infrastructure (manifest, service worker, icon), full UI polish (double-tap investment, animations, audio, settings menu), and data audit of policy tags for accidental-vs-deliberate polarization. All changes are in-memory or test-scoped; no external infrastructure required.

---

### 📋 Design Documentation Consolidation & Interaction Design Finalization — 2026-07-23

#### Design Reference Consolidation
- **EXPANDED**: `design/economy-status-map.md` — added five major new sections consolidating finalized design decisions:
  - **[C1] Mobile build — known bugs (2026-07-23)**: AI-inactivity/news-ticker mismatch, starting-position-randomizer 120-vs-200 inconsistency, popularity-shares not summing to 100%
  - **[C2] Map visualization**: Margin-based state-color intensity formula (|P1% − P2%|) per playtest feedback, reflecting the two-player contest despite fixed 100%-sum constraint
  - **[C3] Touch interaction & feedback**: Single-tap-select / double-tap-invest model applied uniformly to both direct map taps AND small-UT button cluster; added 4 UI feedback animations (tap flash, invalid-action shake+buzz, red/green fund-change flash text)
  - **[C4] Audio**: Confirmed all 8 sound-file triggers (bg_music, cash_added, money_spent, invalid_action, fanfare, game_over, phase_reset, rally_sound with explicit crafting exclusion)
  - **[C5] Build status & roadmap**: Consolidated tech stack/deployment table, PWA gap, AI-personality-variety gap, options-menu gap from now-deprecated design/plan.md
- **[C6] REMOVED**: `design/plan.md` — fully merged into `design/economy-status-map.md` (git history preserves original content); treating the pre-build gap audit as obsolete now that mobile engine is complete
- **[C7] UPDATED**: `CLAUDE.md` — added "Local development & testing" section (2 bullets: Windows network-category fix for phone LAN testing, mobile/index.html Artifact-publishing limitation)
- **[C8] UPDATED**: `findings.md` — already populated directly by `/checkpoint` Phase 1.3 with 5 new 2026-07-23 entries (live-deployment status, LAN-networking discovery, Artifact-bundling discovery, stale-region-field-already-fixed discovery, options-menu-gap discovery)

#### Interaction Design Decisions Finalized
- **[D1] State map color intensity**: Margin-based formula (|P1% − P2%|), not raw leader-%-based. Rationale: user rejected raw-%-based as incoherent since P1%+P2%+Others% always sum exactly 100% — high raw % can just mean Others is small, not that the opponent is weak; margin is the only reading consistent with the zero-sum constraint.
- **[D2] Tap interaction model**: Single-tap-select / double-tap-invest applies uniformly to both direct map taps AND small-UT button cluster (Delhi, Chandigarh, Dadra & Nagar Haveli and Daman & Diu, Puducherry, Lakshadweep, Andaman & Nicobar Islands). Rationale: consistency across all investable targets over preserving UT buttons as a special case.
- **[D3] Rally sound trigger**: Fires on every individual State Rally token play; explicitly does NOT fire on crafting Special Powerup or Nationwide Rally. Direct user clarification: "it plays whenever a rally token is played. crafting is irrelevant."
- **[D4] Design doc consolidation approach**: Delete design/plan.md outright rather than keep as deprecation stub. Rationale: git history preserves original content; stub would be redundant now that everything relevant is migrated or already tracked elsewhere (ADRs for multiplayer design, findings.md for stale-region-field bug).

#### Documentation Sync
- **UPDATED**: `README.md` — single-tap-select / double-tap-invest interaction model (line 66); updated design/plan.md reference to point to economy-status-map.md "Build status & roadmap" section instead (line 142)

#### Context
Session focused on finalizing design documentation and interaction model decisions from first real on-device playtest of the single-player-vs-AI build. Consolidated design decisions into the authoritative reference (`design/economy-status-map.md`), finalized interaction model per playtest feedback, and deprecated the pre-build planning document (`design/plan.md`). All changes are documentation/design only; no engine code modified.

---

### 🎮 Mobile Game Engine Complete — Single-Player vs. AI Build — 2026-07-23

#### New Mobile Game Build
- **CREATED**: `mobile/engine.js` — pure redistribution engine (bps gain/loss with simultaneous-overdraw collision resolution), largest-remainder seat apportionment (Hamilton's method), 3-step randomized starting-position generator with home-state collision handling, and self-check via `node mobile/engine.js`
- **CREATED**: `mobile/game.js` — complete 10-phase game loop with investment/rally-tokens/agendas/regional-dominance/special-powers systems, greedy heuristic AI opponent for Player 2, and bps/seat invariant assertions
- **CREATED**: `mobile/index.html` — Booth Ink's committed mobile UI (copied from `design/prototypes/pme-mobile-sheet.html`, now wired to real engine), added politician-select overlay, end-game overlay, target-picker banner, dynamic per-politician agenda tray, and proper `<!DOCTYPE html><html><head><body>` document structure (standards mode, not quirks)
- **CREATED**: `mobile/main.js` — all DOM wiring/glue; the only file that touches `document`
- **CREATED**: `mobile/simulate.js` — permanent regression test suite: 5 full 10-phase simulated games plus all 20 politicians' special-power activations, asserting bps/seat invariants throughout
- **UPDATED**: `package.json` + `package-lock.json` — added `playwright` devDependency, `npm test` (run simulate.js), `npm run serve` (live-reload server), `npm run check-data` (consistency check)
- **UPDATED**: `.gitignore` — added `node_modules/`

#### Economy & Data
- **UPDATED**: `data/game-config.json` — added new top-level `mobileEconomy` namespace (phases, funds, investment/rally/agenda/regional-dominance constants) per `design/economy-status-map.md`, without touching existing legacy keys (preserves desktop build compatibility)
- **UPDATED**: `data/politicians-data.json` — added structured, engine-executable `power` field to all 20 politicians with unified effect schema (popularity/funds/tokens/steal/nullify/replayAgenda) and concrete first-pass magnitude numbers for the 13 powers lacking explicit balance numbers in the design doc (flagged as provisional pending real playtesting)

#### Project Documentation
- **UPDATED**: `CLAUDE.md` — updated mobile/ pointer (now the real playable build, not the Booth Ink prototype), documented AI-only scope decision, provisional special-power balance, missing politician portrait images, legacy-config-key fragility as a durable architectural rule, Playwright iPhone-14-viewport gotcha (664px content height, not 844px), and data-file BOM/wrapper-key gotcha
- **UPDATED**: `findings.md` — already populated directly by `/checkpoint` Phase 1.3 with 4 new entries (2026-07-23): legacy config key fragility, Playwright iPhone 14 viewport, data file BOM/wrapper-key, seat-conversion rounding, agenda effect timing clarity, Kejriwal wording ambiguity

#### Architecture Decisions Finalized
- **[D1] Single-Player vs. AI Scope** — Built mobile as single-player-vs-AI only, deferring human matchmaking backend to later phase. Rationale: completeness now (playable game on day 1), design validation before backend investment, independent phase dependencies (see ADR-0007)
- **[D2] Additive Config Schema** — Preserved backward compatibility with legacy desktop build via new `mobileEconomy` namespace, rather than restructuring entire `game-config.json`. Rationale: no silent breakage, explicit namespace isolation, minimal total change (see ADR-0008)
- **[D3] Unified Special-Power Effect Schema** — All 20 politicians' powers execute through one shared interpreter (popularity/funds/tokens/steal/nullify/replayAgenda effects), not bespoke per-politician functions. Rationale: cleaner codebase, 13 powers need magnitude numbers anyway, first-pass balance numbers follow decided conventions
- **[D4] Collision Resolution (Snapshot + Retroactive)** — Same-phase, same-state overlaps (both players' actions landing on same state) resolved via phase-start snapshot plus retroactive joint-recompute when overlap detected, preserving instant tap feedback for non-colliding case
- **[D5] HTML Standards Mode** — `mobile/index.html` wrapped in proper `<!DOCTYPE html><html><head><body>` document structure (standards mode), not bare fragment matching prototype file
- **[D6] Viewport Meta Tag Deferral** — Deferred adding `<meta name="viewport">` to mobile/index.html despite it now being deployable build, because Booth Ink's fixed chrome (~755–765px) relies on Safari's fallback ~980px virtual-canvas mode. Revisit once Capacitor wrapping and chrome density audit are underway.

#### Key Design Validations
- **Starting-position randomization**: 3-step generator (50% home-state baseline + ~100-seat random-advantage draw with collision handling + randomized first-move selection) eliminates permanent first-mover bias while preserving contested-territory balance (~54% of map genuinely contested per existing findings)
- **Redistribution rule conformance**: engine implements exact bps-precision, simultaneous-overdraw joint-solve, "round one, derive the other" discipline per design spec
- **Seat-conversion rounding**: switched from plain `round()` to largest-remainder apportionment (Hamilton's method) per design/economy-status-map.md's worked example
- **Agenda effect timing**: implemented as per-tap prorating (each of 4 taps applies exactly 1/4 of magnitude immediately), matching investment-tap mechanics
- **Special-power balance**: all 20 powers have concrete, non-contingent cost/benefit tradeoffs (instant-only, matched sacrifice + payoff), with Nehru's power as sole deliberate zero-cost exception due to its own risk/uncertainty structure

#### Context
Session focused on delivering a complete, playable mobile game build end-to-end: engine (redistribution + phase loop + AI), UI integration (wiring Booth Ink to real game logic), data (20-politician powers with unified schema, economy constants in new namespace), and regression tests (simulate.js validates bps/seat invariants through 100+ politician-power activations). All changes upstream of the build are in-memory or test-scoped; no external infrastructure required.

---

### 🎯 Policy Tag Schema Migration & Special Powers Rebalancing — 2026-07-23

#### Data & Code Updates
- **MIGRATED**: `data/policy-tags.json` from `supportTags`/`opposeTags`/`baseMagnitude`/`tier` to per-region `tagEffects` schema (one signed magnitude per region per policy)
- **REBALANCED**: Four policies with acute imbalances:
  - Economic Liberalization: added `TribalLands: -8` and `NaturalResources: -8` aux oppose tags alongside existing `AgriculturalRegion: -12` (net: +51.8 → +26.2 seat-equivalent)
  - Education: reduced both support tags from 12 to 8 each (net: +49.4 → +33.0; removes pure-upside structure when no thematic opposition exists)
  - Hindi Language: reduced `EasternBorder` oppose tag from -8 to -4 (net: −16.8 → −8.9; keeps genuine effect without self-cancellation bug)
  - Digital Transformation: raised `Education` and `IndustrialCorridor` support tags from 4 to 8 each (net: −7.5 → +10.2; flips from negative to positive by un-skewing support/oppose balance)
- **UPDATED**: `data/politicians-data.json` — swapped Vajpayee's Economic Liberalization agenda for Privatization (thematic fit + moves him off a number that needed fixing anyway)
- **REWORKED**: Six special powers with concrete cost/benefit tradeoffs (Tendulkar's National Icon, Hema Malini's Star Power Rally, Rajinikanth's Thalaivar Announcement, Kejriwal's Anti-Corruption Raid, Nitish Kumar's Alliance Switch, Nehru's Non-Alignment); each had a distinct structural flaw (see design/economy-status-map.md's Special Powers table for before/after detail)
- **UPDATED**: `check_data_consistency.js` — repointed field-validation check from `supportTags`/`opposeTags` to `tagEffects`
- **CREATED**: `recompute_policy_ranking.js` — one-shot script computing full 24-policy seat-equivalent ranking from `tagEffects` + `states_data.json`

#### Design & Documentation
- **REVISED**: `design/economy-status-map.md` — consolidating hung-parliament resolution, `tagEffects` migration notes, net-first-apply-once redistribution rule with worked examples, updated ranking table (3 final iterations), plausibility recompute, and special-powers rework audit table, plus follow-up refinements:
  - **C1**: Tightened Kejriwal's Anti-Corruption Raid cost wording (clarified −15% popularity cost is paid by activating player, not opponent)
  - **C2**: Added rationale to Nehru's Non-Alignment power (variable/opponent-contingent payoff is itself the cost)
  - **C3**: Decided agenda effects apply exactly 1/4 of net effect per tap, immediately (not withheld until 100% completion)
  - **C4**: Added note confirming rally token per-state cap's denial dynamic (shared, not per-player, lifetime cap) is deliberate and symmetric
  - **C5**: Replaced seat-conversion formula (plain round() → largest-remainder apportionment / Hamilton's method) with worked example and pseudocode
  - **C6**: Updated "Still open" list (struck seat-rounding as resolved), header date (2026-07-23), footer decision log/sources
- **UPDATED**: `CLAUDE.md` — added 3 new durable game-design rules (net-first-apply-once, special-power cost must be real sacrifice, accidental-tag-overlap audit discipline) plus:
  - **C7**: Generalized bps "round one, derive the other" rule to N-way conversion of shares into whole units, referencing largest-remainder apportionment (Hamilton's method) as canonical approach
- **DOCUMENTED**: `findings.md` — 3 new entries (2026-07-23) covering seat-rounding discovery, agenda-timing gap discovery, and Kejriwal wording-ambiguity discovery

#### Key Design Decisions Finalized
- **[D1] Hung parliament tie resolution**: Draw vs. human opponent, Loss vs. AI fallback (incentivizes human multiplayer; ensures fairness in human-vs-human)
- **[D2] Privatization assignment**: Vajpayee's agenda swap from Economic Liberalization (thematic + removes him from needing-fix number)
- **[D3] tagEffects schema**: Per-region magnitude replaces tier/baseMagnitude/supportTags/opposeTags; magnitude is chosen per (policy, region) pair, not policy-wide
- **[D4] Redistribution rule**: State's net agenda effect (sum of every matching tag) computed once, then applied as single transaction (not per-tag)
- **[D5] Economic Liberalization fix**: Additive aux oppose tags eliminate the triple-co-occur problem in Gujarat while keeping other states' genuine cancellations
- **[D6] Education fix**: Magnitude reduction (only lever available when no real thematic opposition exists) drops it to mid-pack +33.0
- **[D7] Hindi Language fix**: Reduced oppose tag preserves genuine effect without accidental-cancellation bug
- **[D8] Digital Transformation fix**: Raised support tags un-skew the imbalance (genuine skew, not accidental overlap)
- **[D9] Six special powers audit**: Each power now has concrete cost/benefit; Vajpayee's Pokhran Test (+10% nationwide) retained as accepted outlier/reference; Nehru's power explicitly zero-cost exception

#### Impact Summary
Combined policy rebalancing compressed the range from [+51.8, −25.3] to [+51.8, −20.3], shrinking the plausibility margin from ~61 to ~19 seats. This wasn't a deliberate margin-tuning move, it's a side effect of fixing real design bugs (the triple co-occur in Gujarat, the pure-upside Education, the accidental cancellations in Hindi Language). Two-active-player match modeling (still open) may further compress the margin toward the 272-seat threshold.

---

### 🎮 Game Economy Redesign: Starting Position, Redistribution, Rally Tokens, and Plausibility — 2026-07-22

#### Design Overhaul
- **REWRITTEN**: `design/economy-status-map.md` as the authoritative single-source-of-truth design reference — now documents: core game loop, win condition, starting-position randomization with home-state seeding, redistribution rule with basis-point precision and joint-solve collision handling, all mechanic categories (direct investment, rally tokens, agendas, regional dominance, special powers), 20-politician roster index, full plausibility proof with ~333/543 (61%) best-case majority margin, and open design items.
  - **Rationale**: consolidates scattered decisions from `design/plan.md`, CHANGELOG.md, findings.md, and session refinements into one place the build cycle references for "how is X supposed to work"
  - **Coverage**: replaces all economy-numbers-only status tracking with finalized game design that tied together 12 interrelated design decisions (see below)

#### Data & Documentation Updates
- **UPDATED**: `data/policy-tags.json` — raised `nationwideBonus` from 2% to 4% for Women's Empowerment, Healthcare, and Anti-Corruption policies (now ~21.7 seat-equivalent each, up from ~10.9; strengthens these policies from "no longer dead" to "real contenders")
- **UPDATED**: `CLAUDE.md` — added two standing notes clarifying that "tier" is a per-(policy, region) magnitude choice (not policy-wide), and that popularity state must be tracked in integer basis points (0–10000), plus corrected policy-pool count to 24 entries (23 actually assigned; Privatization orphaned)
- **UPDATED**: `findings.md` — seven new dated 2026-07-22 entries documenting implementation gaps (rally per-state cap configured but not enforced, three colliding resetRallyTokensForPhase() definitions, dead rally implementation, unclearable random-drift timer) and design confirmations (UP over-representation intentional as stabilizer, 61-seat majority ceiling accepted)

#### Key Design Decisions Finalized
- **D1: Starting position generator redesign** — replaced fixed 128/121-seat stronghold table with randomized generator: each player's home state (seeded from chosen politician) gets 50% baseline, plus ~100-seat random-advantage layer with collision handling (reserves both players' home states from pool to prevent overlaps) and randomized first-move selection to eliminate permanent first-mover bias
- **D2: Home-state tie resolution** — if both players' politicians share a home state, nullify the bonus for both players (not split) — prevents "mega lead from turn 1" scenario on UP's 80 seats; confirmed as deliberate stabilizer given that 10 of 20 politicians have UP as home state
- **D3: Random-advantage draw structure** — single shared shuffled pool with alternating turns and randomized first-player selection, not two independent draws with post-hoc collision resolution
- **D4: Same-state-same-phase redistribution** — when both players act simultaneously in the same state, use joint-solve (scale both demands proportionally if combined ask exceeds available Others pool), not sequential-random-order resolution; order-independent and fair for symmetric spend
- **D5: Basis-point rounding rule** — all in-state popularity tracked as integers 0–10,000 bps; split rounding: round one component to nearest bps, derive the other by subtraction from known total — guarantees shares always sum to exactly 10,000
- **D6: Rally token magnitude** — set regular per-state rally bonus to +5% flat (no decay); anchors to investment's best-case fresh-tap value; 8% would dominate cash investment, 4% or below would make tokens not worth spending given their scarcity
- **D7: Special Powerup confirmation** — the 6-token craft IS the activation mechanism for a politician's unique Special Power (not a separate generic effect); folds individual-power balancing into existing 20-roster audit rather than creating separate magnitude decision
- **D8: Nationwide Rally magnitude** — set 12-token craft to +5% nationwide (~27 seat-equivalent); reuses 5% anchor from D6; ~27 is proportionate given the craft costs 60% of lifetime token budget (12 of 20) and must start almost immediately (6-phase minimum in 10-phase game)
- **D9: Nationwide-bonus strengthening** — implemented immediately in data; Women's Empowerment, Healthcare, Anti-Corruption each raised to 4% nationwide per [C7]
- **D10: Plausibility margin & UP concentration** — confirmed ~61-seat passive-opponent ceiling and 10 of 20 politicians hailing from UP are both intentional, not defects; two-active-player match (unmodeled, still open) expected to compress the 61-seat margin back toward 272
- **D11: Agenda effect formula redesign** — magnitude chosen per (policy, region) pair, not once per policy; tier scale preserved (tier 1 = 12%, tier 2 = 8%, tier 3 = 4%), now describes per-region choice; `nationwideBonus` unaffected; **migration documented but not implemented** — flag for later code/data overhaul
- **D12: Schema migration deferred** — designed safe behavior-preserving migration (default every region's magnitude to old baseMagnitude just restructured per-region) but explicitly deferred per user instruction; document design now, implement later

#### Context
Extremely long single-topic session spent iteratively refining `design/economy-status-map.md` through 12 interrelated design decisions and plausibility proofs. The doc was live-deployed as a Claude Artifact and refined in real-time on the user's phone. Resolved structural questions around starting-position randomization, redistribution collisions, rally-token economy scaling, and agenda-formula rebalancing. No source code changes — purely design, documentation, and data tuning.

### 🔍 Economy Data Corrections & Authoritative Design Reference — 2026-07-22

#### Data Corrections
- **FIXED**: `data/policy-tags.json` National Defense `opposeTags` — removed `HindiHeartland`, kept only `CoastalIndia` (corrects policy effect from −25.3 to +1.8 seat-equivalent)
- **ADDED**: `nationwideBonus: 2` field to Women's Empowerment, Healthcare, and Anti-Corruption policies (implements previously undocumented +2% nationwide effect, distinct from `baseMagnitude` which would overshoot by ~6x)

#### Documentation Consolidation
- **REWRITTEN**: `design/economy-status-map.md` from economy-numbers-only status page into authoritative single-source-of-truth design reference — added core loop, win condition, starting-position breakdown, redistribution rule, all mechanic categories, politician roster index, plausibility proof-numbers, and open items
  - Rationale: consolidates scattered design decisions from `design/plan.md`, CHANGELOG.md, findings.md, and session conversations into one place the build cycle can reference for "how is X supposed to work"
  - Retained previous status-tracking convention (decided/open/gap/assumed fields) for ongoing design clarity
- **UPDATED**: `findings.md` with 7 new dated findings (2026-07-22) and cross-annotations on 3 pre-existing entries, surfacing implementation gaps and undocumented code behaviors

#### Design Decisions Finalized
- **DECISION D1**: National Defense `opposeTags` fix — drop `HindiHeartland`, keep only `CoastalIndia`. Root cause: six states (UP, Bihar, Gujarat, Rajasthan, Uttarakhand, West Bengal) carry both a supported (`EasternBorder`/`WesternBorder`) and an opposed tag (`HindiHeartland`/`CoastalIndia`), netting each to exactly zero. Removing `HindiHeartland` un-cancels UP (+9.6 seat-equiv) and Bihar (+4.8), moving the national effect from −25.3 to +1.8. Rationale: removes an arbitrary thematic collision, keeps a genuine reason (both coastal and border-region states actually cancel).
- **DECISION D2**: Three zero-tag policies (Women's Empowerment, Healthcare, Anti-Corruption) get explicit flat +2% nationwide effect via new `nationwideBonus` field. Rationale: `baseMagnitude` (8–12 for these three) already appears in UI label logic and would produce ~6x the intended effect if used as implementation; a separate field prevents future bugs and documents the real intended number.
- **DECISION D3**: `design/economy-status-map.md` scope expanded to full finalized game design (core loop, win condition, starting position, redistribution rule, all mechanics, politician roster, plausibility numbers, open items) as the single authoritative reference for the build cycle. Rationale: direct match for the explicit request — one document, so build cycle has a single source instead of four scattered ones.

#### Findings & Discoveries
- Session produced 7 dated 2026-07-22 findings entries (written by /checkpoint), covering:
  - Rally per-state cap (`maxRalliesPerState`) is configured in game-config.json but never enforced in the live code path (`useSimpleRallyToken()`), only in dead code
  - Three colliding definitions of `resetRallyTokensForPhase()` across `player-manager.js` and `rally-system.js`; live behavior is decided by script load order in index.html, not an intentional decision
  - Dead rally implementation (8% boost, own token pool) in `campaign-system.js` is never called but still matches campaign grid's on-screen "Alt+Click for rallies" instructional text
  - `simulatePopularityChanges()` is an uncapturable, never-cleared `setInterval` random-drift timer that contradicts the project's own anti-randomization design decisions elsewhere
  - Correction to 2026-07-21 National Defense finding: 6 states cancel (Uttar Pradesh, Bihar, Gujarat, Rajasthan, Uttarakhand, West Bengal), not the originally stated 4 (Himachal Pradesh nets +1, not zero)
  - `state-manager.js` also references retired `BorderLands` field (in addition to already-known `NortheastIndia` references in `campaign-system.js`)
  - Campaign grid display code (generateCampaignGrid()) implies a `baseMagnitude%-nationwide` convention for zero-tag policies that would produce ~65 seat-equivalent for Healthcare if implemented, overshooting the newly-decided +2% by roughly 6x
- (See `findings.md` for full entry texts and code references)

#### Context
Follow-up auditing and data-correction session after 2026-07-21 economy plausibility review. Focused on: fixing an identified policy imbalance (National Defense's self-canceling tags on six overlapping states), documenting an overlooked design intent (+2% nationwide bonus for three unimplemented policies), consolidating all settled design decisions into a single authoritative reference, and surfacing seven new implementation gaps and undocumented code behaviors for priority in the build cycle.

### 💰 Economy Plausibility & Rebalancing — 2026-07-21

#### Key Decisions Finalized
- **DECISION D1**: `totalPhases = 10` is canonical (not 8). Config and phase-system.js both implement 10; design/plan.md's prose and Booth Ink's UI still hardcode 8, which is now stale and needs updating (tracked, not yet done).
- **DECISION D2**: Direct-investment decay curve stays mobile's own existing linear glide (5%→2% over 20 taps, floors at 2%), not desktop's multiplicative formula (5%×max(0.8, 1−spend×0.005)). Deliberately chosen override of the general desktop-reference convention.
- **DECISION D3**: Base economy scale = mobile's own numbers (2,500 Cr start, 1,000 Cr/phase refresh per player, cost = seats×10). Stopped comparing/reconciling against desktop's numbers (200/200/seats×1) entirely. Per-player refresh verified via `phase-system.js`'s `awardRefreshFunds()`. Lifetime budget per player = 12,500 Cr. Scale is now independently canonical per explicit user decision (see CLAUDE.md exception).
- **DECISION D4**: Agenda commitment cost = 500 Cr/tap (each tap = 25% completion). Direct consequence: 2,000 Cr to max one agenda, 8,000 Cr to max all four agendas. Maxing all agendas leaves only 4,500 Cr of lifetime budget for direct map investment.
- **DECISION D5**: Agenda commitment taps NOT capped per phase — players can commit as many taps as funds allow. Only money is the gate, not an action-count cap. Hoarding cash for burst-commits later is strategic (self-taxing via opponent's unopposed popularity climb), not an exploit.
- **DECISION D6**: Group-dominance payout formula corrected: `5 × Σ(seats in group)` (not `0.5 × Σ(seats)` as originally documented). Ties the 0.5 multiplier to the group's cost-as-a-unit (seats×10). Fixes 10× bug in original formula. Even with correction, cost-to-dominate exceeds entire lifetime budget; group dominance is a bonus on states already being pushed to 50% for national seat race, never a standalone cash target.
- **DECISION D7**: Rally token system has three undocumented caps, all confirmed directly by user:
  - Spend cap: max 2 tokens/phase/player
  - Per-state cap: max 2 total plays per state for entire game, shared across both players (Nationwide Rally exempt)
  - Crafting counts against spend cap: Special Powerup (6 tokens → 3-phase minimum), Nationwide Rally (12 tokens → 6-phase minimum) — same pool as individual rallies, not separate actions
  - Consequence: total earnable = 28 (20 base + 8 bonus), but total usable = 20 (2/phase × 10 phases); agenda-bonus tokens give scheduling flexibility only, not ceiling raise

#### Implementation & Code
- **FIXED**: `js/phase-system.js` — removed independent `data/game-config.json` fetch with drifted hardcoded fallback (500/phase vs. live 1000/phase). Now calls shared `getGameConfig()` from `config-manager.js`. One config loader in codebase now, not two that could silently diverge.

#### Documentation & Project Instructions
- **CREATED**: `design/economy-status-map.md` — economy status-map reference (mirrors published Claude Artifact), following design/plan.md convention of storing HTML/CSS content in .md files
- **UPDATED**: `CLAUDE.md` — added explicit exception to game-economy/balance-work bullet, noting mobile's base economy scale is now independently canonical, no longer benchmarked against desktop

#### Findings & Discoveries
- Session produced 9 dated 2026-07-21 findings entries (written by /checkpoint), covering: starting-position breakdown (~54% contested), direct-cash ceiling (~195/543 seats), agenda seat-value swing (±51.8 to −25.3), majority threshold (cash+token+2-agenda barely clears ~278/543), group-dominance payout bug and cost-ROI, rally token caps clarified, phase-count/scale-benchmark conflicts resolved, `checkRegionalDominanceBonuses()` stale/broken, `investAgenda()` cost gap, desktop win-condition found, National Defense self-canceling tags, cost-per-seat-share size-invariance vs. token asymmetry
- (See `findings.md` for full entry texts and economic modeling details)

#### Context
Third session in ongoing economy-redesign series (prior: D1-D5 implementation decisions on 2026-07-21, D1-D9 game-design decisions on 2026-07-20). Focused on plausibility modeling: confirming newly-decided numeric values make the game winnable, fixing config-loader bug allowing separate values to drift, resolving phase-count and economy-scale conflicts that were blocking formula finalization and economy-status-map tool build.

### 🎯 Direct Investment Cost Gating & Game Economy Decisions

#### Implementation
- **FIXED**: `pme-mobile-sheet.html` now routes all cash-driven taps (map click, UT/Delhi/Goa buttons) through new `investInPaid()` cost-gated wrapper, not free `investIn()`
  - Cost formula: `seats × baseCostPerSeat` (fetched live from `data/game-config.json`)
  - Funds deducted before state popularity increases
  - Token/agenda/power-driven calls remain routed through free `investIn()` (they pay via their own resource, not cash)

#### Design Decisions Finalized
- **DECISION D1**: Direct-investment cost formula — only cash-driven UI taps (map click, quick-invest buttons) charge funds; token/agenda/power-driven `investIn()` calls stay free since they're paid via their own resource. Fix applied at cost-gated wrapper layer, not touching resource-paid call paths.
- **DECISION D2**: Agenda region-tag popularity effect — instant + cumulative (each 25% tap applies share immediately), netting via sum-every-matching-tag (not binary per side), single baseMagnitude per policy (not per-tag). NOT YET IMPLEMENTED IN CODE — design decision only. User confirmed this matches desktop's real `policy-popularity-calculator.js` formula.
- **DECISION D3**: Politician/agenda data stays a shared pool (`data/policy-tags.json`, ~23 entries); "exclusive" agendas achieved by convention (only one politician references that entry) rather than explicit exclusivity flag. Matches existing schema size; uniqueness falls out naturally from roster design.
- **DECISION D4**: No CRUD script/tool for managing `politicians-data.json` or `policy-tags.json` — direct natural-language requests to Claude are the intended workflow, with `check_data_consistency.js` as validation safety net.
- **DECISION D5**: Game-economy/balance auditing should reference **desktop app's real code** (`game-config.js`, `state-info.js`, `campaign-spending.js`, `home-state-bonus.js`, `group-rewards.js`, `state-groups.js`), not mobile's ported version. Desktop is working reference implementation; mobile's numbers in this area are provisional/broken.

#### Documentation & Project Instructions
- **UPDATED**: `CLAUDE.md` Data & Config Conventions section — added bullets on shared agenda pool pattern (no bespoke per-politician tables) and no CRUD tooling desired
- **UPDATED**: `CLAUDE.md` Game Design Principles section — added bullet on dominance-threshold rule (every state must individually cross 50%) and desktop-as-reference instruction for economy work

#### Findings & Discoveries
- Session produced 11 dated 2026-07-21 findings entries in `findings.md` (written directly by /checkpoint), covering:
  - Desktop's real seats×1 cost formula (millions), not seats×10
  - Desktop's combined home-state cost-discount + flat-popularity-floor mechanic
  - Desktop's popularity-decay curve (5%×max(0.8, 1−spend×0.005))
  - Desktop's 50%-of-seats dominance payout with carry-forward
  - Confirmation: "every state must individually exceed 50%" rule is intentional, not a mobile bug
  - Mobile's `checkRegionalDominanceBonuses()` stale/broken (retired NortheastIndia field, checks only 4 of 15 groups)
  - Mobile's `investAgenda()` has zero cost (same bug pattern as investIn() before this fix)
  - Desktop's existing win condition (272/543-seat majority check via `showElectionResults()`)
  - totalPhases inconsistency (config says 10, design docs/Booth Ink assume 8)
  - National Defense's self-canceling tags on 4 overlapping states (UP/Bihar/Uttarakhand/Himachal Pradesh)
  - Cost-per-seat-share size-invariance vs. rally tokens' state-size asymmetry

### 🧹 Repository Hygiene — Stale Docs & Prototype Cleanup
- **REMOVED**: 10 stale docs/ files — ARCHITECTURE.md, CODE_STYLE.md, GLOSSARY.md, ONBOARDING.md, TESTING_GUIDE.md, README.md, DEVELOPER_GUIDE.md, RALLY_TOKENS_SYSTEM.md, UI_DESIGN_REQUIREMENTS.md, feature-request.md
  - Reason: 5 were thin generic scaffolding; 2 documented mechanics superseded by replayability redesign and Booth Ink; 1 documented old control scheme (Shift+Click) being replaced by touch tray; 1 was a closed task log
- **REMOVED**: 10+ superseded design/prototypes/ files — pme-mobile-tabs.html, pme-mobile-sheet-template.html, pme-mobile-tabs-template.html, pme-play-broadcast.html, pme-play-evm.html, pme-play-gazette.html, pme-play-template.html, pme-visual-directions.html, generate_mobile_first_mockups.py, generate_play_mockups.py, stray server.log
  - Reason: Only pme-mobile-sheet.html (Booth Ink) is the committed UI direction per CLAUDE.md; the others were dead exploration, templates, and unused generator scripts
- **REMOVED**: live_checklist.md (unfilled template, never used)
- **Rationale**: Reduce context bloat and increase clarity during AI-assisted development; git history preserves all deletions if needed; zero engine-code changes, purely hygiene

### 🎮 Game Design — Replayability Overhaul

#### Design Decisions & Architecture
- **DECISION D1**: Replace magnitude-randomization (random events, home-state bonus, token odds) with structural, politician-driven variety — desktop code analysis revealed all four systems were either non-functional (random events only affect Player 1) or noise dressed as variety (deterministic home-state bonus, hardcoded asymmetric token odds).
- **DECISION D2**: Redesign agenda system as personal (non-contested) per-politician signature policies committed via one lump sum per phase — removes the click-fest from existing 10-click investment bars while simplifying the booking without shared policy races.
- **DECISION D3**: Cap each politician to 5 agenda slots (4 generic + 1 unique special power) — solves screen-space constraints in Booth Ink UI and creates structural variety without requiring a 23-item scrolling list.
- **DECISION D4**: Every special power must have matched cost/benefit tradeoff and qualitatively distinct "verb" — prevents free-win mechanics and keeps a 20-entry roster from feeling repetitive.
- **DECISION D5**: Special-power cost/benefit must resolve instantly, never duration-based — prevents duration-based effects from having zero remaining phases to apply once the power unlocks at game end (ADR-0004).
- **DECISION D6**: Special-power/mega-token unlock gated by redesigned rally-token economy, not popularity/seat threshold — sidesteps the reward-the-leader snowball risk that threshold-based gates create (ADR-0005).
- **DECISION D7**: Redesigned rally-token system into 3 flavors: State Rally (2/phase, accumulates, +2 bonus per agenda, 24 max), Special Powerup (6 tokens crafted, one use per game), Nationwide Rally (12 tokens crafted, one use per game) — removes randomness from acquisition entirely and creates opportunity-cost tension.
- **DECISION D8**: Finalized 20-politician roster (16 politicians + 4 celebrities); Smriti Irani removed as not high-profile enough; Jayalalithaa categorized as politician.
- **DECISION D9**: Anti-click-fest principle: cap player actions per phase to a fixed number — forces prioritization over grinding; applied to whole game design.

#### Documentation Updates
- **UPDATED**: `design/plan.md` Replayability section — complete redesign with 20-politician roster table, special-power design rules and examples, 3-flavor token economy mechanics
- **UPDATED**: `design/plan.md` audit table — marked "Random events" and "Home-state bonus" as superseded by new system
- **UPDATED**: `design/plan.md` roadmap Phase 5 description — now covers agenda/special-power/token implementation instead of porting desktop's random-events.js + home-state-bonus.js
- **UPDATED**: `design/plan.md` header "Reviewed" date to 2026-07-20
- **ADDED**: `CLAUDE.md` game design principles section — documented anti-click-fest rule
- **ADDED**: `CLAUDE.md` UI conventions clarification — Booth Ink (pme-mobile-sheet.html) is committed mobile UI direction, not legacy index.html/styles.css
- **ADDED**: Six findings entries (2026-07-20) documenting desktop code bugs (random-events asymmetry, deterministic home-bonus, hardcoded token odds) and implications for mobile redesign

#### Architecture Decision Records
- **CREATED**: ADR-0004 (Instant-Effect-Only Special Powers) — resolves the duration-based-effect lateness bug by converting all power effects to instant lump-sum equivalents
- **CREATED**: ADR-0005 (Token Economy as Unlock Gate) — resolves the snowball risk of popularity/seat thresholds by using symmetric token income as the unlock currency

#### Context
Long design-ideation session diagnosing why desktop's four "randomization" systems didn't produce felt replayability. Actual code analysis showed all four were non-functional or noise. Designed replacement system (politician-driven agendas + special powers + token-economy gate) that creates structural variety instead of tweaking probabilities. No source code changes — purely design, documentation, and findings.

### 🎨 Mobile-First Visual Prototypes
- **CREATED**: Two structurally distinct HTML + CSS prototype systems — "Booth Ink" (ballot-form aesthetic, light colors) and "Live Count" (broadcast-scoreboard aesthetic, dark colors)
- **CREATED**: `generate_mobile_first_mockups.py` — generator script injecting real `states_data.json` + India map SVG into both templates for interactive testing
- **ADDED**: Booth Ink prototype (`pme-mobile-sheet.html`) with fixed state-detail info panel, full-width groups filter bar, and consolidated header (player funds, seats)
- **ADDED**: Live Count prototype (`pme-mobile-tabs.html`) with tab-based navigation and broadcast-style scoreboard UI

### 🔧 Booth Ink UI Refinements
- **REMOVED**: Lakshadweep + Andaman & Nicobar islands from direct map interaction (replaced with batch "ALL UTS" button at bottom-left for indirect investment)
- **CHANGED**: State-detail sheet from draggable 3-snap-point container to fixed, non-expanding info panel (addresses "too much information" feedback)
- **CHANGED**: Groups filter UI from floating top-right box to full-width bar pinned directly under header in normal document flow (immune to CSS Grid shrink-to-fit sizing bug, stops map overlap in NE region)
- **REMOVED**: Button background boxes from groups bar; now displaying bare icons only (active icon gets background highlight) to minimize whitespace
- **IMPROVED**: Text and icon sizing for true iPhone 14 device proportions (previous sizing was calibrated against Claude Artifact viewer's ~150–200px chrome, which distorts perceived scale)
- **ADDED**: Explicit `<meta charset="UTF-8">` declaration (first tag in both prototype templates) — fixes mojibake when served via non-Claude hosts (`python -m http.server`, GitHub Pages, etc.)

### 📋 Technical Documentation
- **UPDATED**: Project `CLAUDE.md` — added "Frontend technical rules" section documenting three recurring pitfalls:
  - CSS Grid `1fr` tracks with undefined container width silently override declared item sizes
  - Charset declaration required on every standalone HTML file (Artifact hosting sets header; other hosts do not)
  - Artifact viewer chrome distorts proportion perception — size against real device viewport, not preview
- **DOCUMENTED**: Three technical findings in `findings.md`:
  - CSS Grid shrink-to-fit sizing caused real responsive-width bug in a prototype's icon grid
  - Charset mojibake on local dev servers (Python `http.server` sends no charset header)
  - Artifact viewer ~150–200px chrome makes `flex:1` regions appear shorter than on real device

### 🔄 Data Layer Rebalancing & Consistency

#### Politicians Roster Expansion
- **REBALANCED**: `data/politicians-data.json` from 8 to 20 politicians (16 historical + 4 celebrities)
  - Each politician now carries 4 signature agendas + 1 unique special power (5 total slots)
  - Added `specialPower` field defining cost/benefit tradeoff and distinctive abilities
  - Expanded roster: added Mamata Banerjee, Arvind Kejriwal, Chandrababu Naidu, Sharad Pawar, Nitish Kumar, Stalin, Yogi Adityanath, Mulayam Singh Yadav, Naveen Patnaik, Shivraj Singh Chouhan, Manmohan Singh, Pranab Mukherjee, plus 4 celebrities (Amitabh Bachchan, Shah Rukh Khan, Amir Khan, Salman Khan)

#### Regional State Groups Restructure
- **REBALANCED**: `data/states_data.json` state groups from 12→15 groups per replayability plan (design/plan.md)
  - Retired: `BorderLands`, `NortheastIndia`
  - Added: `EasternBorder`, `WesternBorder`, `NationalParksWildlife`
  - Rebalanced seat allocations: Eastern Border (192→197), Tribal Lands (86→101), Minority Areas (107→109)
  - Dual-tagged for geopolitical reality: Ladakh & Himachal Pradesh marked both EasternBorder + WesternBorder (border both China and Pakistan)
  - Added state memberships: Assam & Sikkim to TribalLands; Tripura to MinorityAreas

#### Policy Tag Migration
- **REMAPPED**: `data/policy-tags.json` removed all references to retired `BorderLands`/`NortheastIndia` tags
  - Replaced with `EasternBorder`/`WesternBorder` across 8 affected policies
  - Validated via new consistency checker (see below)

#### Data Consistency Checking
- **CREATED**: `check_data_consistency.js` — standing guard validating state-group and policy-tag field names across data files and engine code
  - Regex-based field extraction from `js/*.js`, `index.html`, `design/prototypes/*.html`
  - Verifies every referenced group field exists in `states_data.json` and every policy tag exists in `policy-tags.json`
  - Catches field renames/removals before silent engine breaks (e.g., BorderLands→EasternBorder migration, which this script validated end-to-end)
  - Run after any `states_data.json`/`policy-tags.json` field rename or removal

#### Documentation Sync
- **UPDATED**: `design/plan.md` state-groups tables, member lists, and seat totals to match all rebalancing (reflects C3, C11 data corrections)

### 🎨 Booth Ink Engine Integration & Map Rendering Fixes

#### Live Data Binding
- **CHANGED**: `pme-mobile-sheet.html` now fetches `data/states_data.json` at page load instead of embedding hand-copied `STATES/GROUPS` array
  - Eliminates single-source-of-truth duplication risk flagged in design/plan.md
  - Verified: session's later data corrections (C11) auto-propagated to Booth Ink with zero code changes

#### Map Selector & Interaction Fixes
- **FIXED**: Map rendering selectors to include `circle[id]` overlays, not just `path[id]`
  - Uttarakhand, Ladakh, Himachal Pradesh each have two SVG elements with the same id (real `<path>` boundary + zero-radius `<circle>` marker)
  - Original selector-gap excluded these three from group highlights, color fills, and click handling
  - Updated: `paintMap()`, `selectState()`, map click handler, `applyGroupHighlight()` all now query both `path[id], circle[id]`

#### SVG Styling & Visual Hierarchy
- **CHANGED**: Group-filter dimming from `opacity` (dims stroke + fill) to `fill-opacity:0` (only dims fill, keeps stroke black)
  - Renders excluded states as hollow outlines instead of faded
- **DARKENED**: `--map-base` color from `#E4E7EC` to `#AEB4C0` for better contrast against `#EEF0F3` page background
  - Result: maximum visual contrast between "in active group" (filled + colored) and "not in group" (hollow outline) with borders always legible

#### Viewport & Layout Adjustments
- **ADDED**: `.map-wrap{min-height:160px}` safety floor to prevent map collapse
- **REDUCED**: `.india-map` CSS transform scale `1.1` → `1.03` to stop edge clipping
- **REVERTED**: Removed `<meta name="viewport">` tag (caused real Safari regression: map collapsed to sliver due to viewport math mismatch with fixed-height chrome)
  - Fixed original double-tap-zoom bug via `touch-action:manipulation` CSS instead (gesture handling only, doesn't touch layout)
  - Verified via real WebKit testing (Playwright + iPhone 14 profile), not Chromium assumptions

#### UT Cluster Optimization
- **ADDED**: Dedicated Delhi quick-invest button above Goa in corner-left cluster (Delhi now has own button vs. batch)
- **SHRUNK**: All 3 corner-left UT buttons `138×123px` → `98×82px` to fit three stacked vertically
- **REMOVED**: Delhi from `SMALL_UTS` batch array — now only `['INDH','INCH','INPY','INLD','INAN']` route through batch button (Chandigarh, Dadra & Nagar Haveli + Daman & Diu, Puducherry, Lakshadweep, Andaman & Nicobar Islands)

### 📝 Project Documentation Updates
- **ADDED**: "Data & Config Conventions" section to CLAUDE.md — recommends config/data files over hardcoding; documents consistency-checking approach (data/politicians-data.json, data/states_data.json, data/policy-tags.json as single source of truth)
- **ADDED**: 4 new "Frontend technical rules" to CLAUDE.md documenting WebKit-vs-Chromium testing requirement, Booth Ink's no-viewport-meta constraint, circle/path SVG selector gap, and opacity-vs-fill-opacity gotcha (all verified by explicit user feedback)

#### Context
Session focused on solidifying the data layer for replayability redesign and integrating Booth Ink with live game data. Discovered and fixed three orthogonal bugs in Booth Ink's map rendering (selector gap, opacity gotcha, viewport regression) plus added systematic data consistency checking to prevent future silent breaks from field renames or group migrations.

## [2.0.5] - 2026-07-19 - Planning & Architecture Session: Mobile Parity Audit

### 📋 Planning & Analysis
- **CONDUCTED**: Feature-parity audit against desktop codebase; identified missing modules (random events, home-state bonus, action log, AI controller)
- **IDENTIFIED**: Replayability root cause (static regional dominance payoffs across games) and recommended fixes
- **ANALYZED**: Small UT click pattern validation — confirmed existing button-cluster approach is production-ready and should be reused

### 🏗️ Architecture Decisions
- **DECISION**: Player 2 strategy — prefer live matchmaking (human opponent) with AI fallback after timeout (ADR-0001), solving the "always have a match" requirement without choosing between AI-only or multiplayer-only
- **DECISION**: Backend stack for matchmaking — Firebase Realtime Database with anonymous auth (or Supabase alternative) for zero-ops, free-tier-friendly infrastructure (ADR-0002)
- **DECISION**: Native app distribution — Capacitor wrap (not React Native/Flutter rewrite) for iOS/Android app stores, preserving DOM/CSS/SVG fidelity without rewrite risk (ADR-0003)

### 🔍 Technical Findings
- Discovered SVG map asset carries bounding-box waste (~27% unused area) — tightened viewBox would render map at 27% larger with zero crop risk (findings.md)
- Confirmed mobile has no AI opponent (only same-device hotseat), no session start/end screens, no functional options menu (findings.md)
- Validated Claude Artifacts cannot host true installable PWAs (iOS standalone mode via meta tags only; service worker registration not available)

### 📄 Documentation
- **ADDED**: ADR-0001 (Player 2 matchmaking + AI fallback design)
- **ADDED**: ADR-0002 (Firebase/Supabase backend recommendation)
- **ADDED**: ADR-0003 (Capacitor for native distribution, not rewrite)
- **ADDED**: Project-level CLAUDE.md with UI conventions (small UT click pattern) and architecture constraint (Capacitor, not native rewrite)
- **ADDED**: findings.md with 7 entries covering parity audit, replayability root cause, SVG map inefficiency, and Claude Artifact PWA limitations

### ℹ️ Note
No source files changed this session — purely analysis, audit, and design planning. Phase 0 (backend + matchmaking infrastructure) is the next execution step; phased rebuild plan with effort estimates delivered as external Claude Artifacts.

## [2.0.4] - 2025-07-26 - Rally System Visual & Audio Enhancements
### 🎵 Audio System Enhancement
- **ADDED**: Rally sound effect (`rally_sound.mp3`) plays when rally tokens are successfully used
- **INTEGRATED**: Sound respects existing audio configuration settings

### ⭐ Special Rally Token Visual Upgrade
- **REDESIGNED**: Special rally tokens now display as complete star shape using CSS clip-path
- **ENHANCED**: Golden gradient background with orange accents
- **ADDED**: Advanced hover, active, and picked-up state animations
- **IMPROVED**: Pulsing glow effect when token is picked up

### 🎲 Special Token Rarity System
- **IMPLEMENTED**: Special tokens now have 5% probability per phase (instead of guaranteed)
- **ADDED**: `specialTokenProbability` configuration option in `game-config.json`
- **ENHANCED**: Probability-based distribution system in `resetRallyTokensForPhase()`

### 🏛️ Rally State Visual Indicators  
- **ADDED**: Golden circle indicators appear on states after regular rallies
- **IMPLEMENTED**: Visual tracking system with `ralliesHeld` array per player
- **CREATED**: Smooth indicator animations and auto-cleanup each phase
- **INTEGRATED**: State indicator functions with existing rally system

### 🎨 UI/UX Improvements
- **RESPONSIVE**: All new features work properly on mobile devices
- **ANIMATIONS**: Smooth transitions and visual feedback throughout
- **ACCESSIBILITY**: Clear visual distinction between regular and special tokens

## [2.0.3] - 2025-07-26 - Rally Token Configuration & System Cleanup
### 🎯 Rally Token Configuration Enhancement
- **UPDATED**: Rally token boost values to 4% for both regular and special tokens
  - Regular tokens: 4% statewide boost (previously 8%)
  - Special tokens: 4% nationwide boost (previously 10%)
- **ENHANCED**: Rally token configuration now fully driven by `game-config.json`
- **ADDED**: New configuration properties `regularTokenBoost` and `specialTokenBoost`

### 🧹 Configuration System Cleanup
- **REMOVED**: Hardcoded fallback configuration from `config-manager.js`
- **IMPROVED**: Configuration system now enforces single source of truth from JSON
- **ENHANCED**: Better error handling - game fails fast with clear message if config missing
- **CLEANED**: Removed all `|| defaultValue` fallback patterns from configuration getters
- **SIMPLIFIED**: Configuration functions now directly access loaded properties

### 🔧 Technical Improvements
- **FIXED**: Missing `initRallyButton` function error replaced with correct `initializeRallyTokenTray`
- **IMPROVED**: Rally system initialization properly integrated with app startup
- **ENHANCED**: Configuration maintenance burden eliminated through single-source approach
- **STREAMLINED**: No more dual maintenance of values in code and JSON

### 📚 Code Quality
- **MAINTAINED**: All existing rally system functionality preserved
- **IMPROVED**: Code clarity through removal of redundant fallback logic
- **ENHANCED**: Configuration consistency across entire application
- **SIMPLIFIED**: Easier debugging with guaranteed config source

## [2.0.2] - 2025-07-25 - Mobile UI Collision Fixes & Rally Token Cleanup
### 🎯 Major UI Collision Resolution
- **FIXED**: Player info panel bleeding where Player 1 elements overlapped with Player 2 elements
- **ENHANCED**: State info banner height increased from `clamp(32px, 4vh, 55px)` to `clamp(40px, 5vh, 65px)`
- **REMOVED**: Rally token display icons from player info panels for cleaner, more spacious layout
- **IMPROVED**: Progressive responsive scaling with better space utilization across all viewports

### 🧹 Rally Token System Cleanup
- **STREAMLINED**: Rally tokens now tracked internally without UI display clutter
- **REMOVED**: Token display elements (`🏟️` and `🌟` icons) from player banners
- **MAINTAINED**: Full rally system functionality preserved for Alt+Click actions
- **SIMPLIFIED**: Cleaner player info panels with focus on essential information (name and funds)

### 📱 Enhanced Mobile Responsiveness
- **OPTIMIZED**: Player panel max-width scaling: 48% → 47% (768px) → 45% (480px) → 43% (320px)
- **IMPROVED**: Text scaling with better font-size progression for smaller screens
- **ENHANCED**: State info banner with better multi-line content handling
- **REFINED**: Gap spacing optimization for collision prevention

### 🔧 Technical Improvements
- **UPDATED**: JavaScript rally token display functions for backwards compatibility
- **CLEANED**: Removed unused rally token CSS while preserving core functionality
- **ENHANCED**: Better overflow protection with `text-overflow: ellipsis`
- **OPTIMIZED**: Icon scaling for very small screens (320px breakpoint)

## [2.0.1] - 2025-07-25 - Mobile UI Optimization & Animation Refinements
### 🎯 Union Territory Panel Optimization
- **ENHANCED**: Timer pill repositioned from `top: 130px` to `top: 160px` to prevent menu overlap
- **OPTIMIZED**: UT buttons significantly reduced in size for better mobile experience
  - Button sizes: `min-width: clamp(40px, 6vw, 75px)` and `min-height: clamp(16px, 2.5vw, 28px)`
  - Font sizes: `clamp(7px, 1vw, 11px)` for better readability on small screens
  - Compact padding and spacing throughout
- **IMPROVED**: Grid layout changed to 3x2 for horizontal space efficiency
- **RESPONSIVE**: Added specific breakpoints for 320px, 480px, and 768px viewports

### 🎨 Animation & Visual Refinements
- **REMOVED**: Distracting `broadcast-sweep` animation from tricolor stripe
- **STATIC**: Tricolor elements now serve as respectful cultural tribute without movement
- **CLEANED**: Removed unused `@keyframes broadcast-sweep` definition
- **IMPROVED**: More focused, less distracting visual experience

### 📱 Mobile Experience Enhancement
- **OPTIMIZED**: Timer pill sizing scales properly on all mobile devices (320px+)
- **TOUCH-FRIENDLY**: Maintained minimum 44px touch targets while optimizing space
- **RESPONSIVE**: Comprehensive mobile breakpoint system for consistent experience

### 📚 Documentation Updates
- **UPDATED**: README.md with mobile optimization features
- **DOCUMENTED**: UT panel improvements and animation changes

## [2.0.0] - 2025-07-25 - Premium Gaming UI Overhaul
### ✨ Major Visual Transformation
- **BREAKING CHANGE**: Complete UI redesign from functional demo to premium gaming experience
- **NEW**: Strategic command center interface with gaming HUD elements
- **NEW**: Indian cultural integration with tricolor accents and gold theme throughout
- **NEW**: Clash Royale-inspired visual design system with sophisticated animations

### 🎨 Enhanced Interface Components
- **NEW**: Election broadcast-style seats progress bar with animated tricolor sweep
- **NEW**: Tactical gaming HUD for player stats with scan lines and strategic indicators
- **NEW**: News ticker-style state information panel with animated data streams
- **NEW**: Strategic command center map area with tactical grid overlay and depth
- **NEW**: Regional control panel with enhanced state groups and Indian flag tribute
- **NEW**: Command interface timer pill with strategic outpost styling
- **ENHANCED**: All buttons and interactive elements with premium hover effects and animations

### 🎮 Gaming Experience Improvements
- **NEW**: Premium color system with gold gradients and party-ready color variables (BJP/INC/AAP)
- **NEW**: Enhanced ripple effects with improved visual feedback
- **NEW**: Sophisticated shadow and glow systems throughout interface
- **NEW**: Glassmorphism effects and depth layering for modern gaming feel
- **NEW**: Custom scrollbars and accessibility enhancements
- **ENHANCED**: All animations upgraded to gaming-quality smoothness and responsiveness

### 🛠️ Technical Improvements
- **NEW**: Future-ready dynamic party color system architecture
- **NEW**: Comprehensive CSS variable system for maintainable theming
- **FIXED**: Timer pill positioning and visibility issues
- **ENHANCED**: Z-index management for proper element layering
- **ENHANCED**: Mobile-first responsive design maintained throughout transformation

### 📚 Documentation Updates
- **UPDATED**: README.md with new premium gaming features and interface descriptions
- **CREATED**: UI_DESIGN_REQUIREMENTS.md for future development reference
- **UPDATED**: Feature documentation to reflect new visual capabilities

### 🐛 Bug Fixes
- Fixed state group map focus issue - clicking state groups other than "All" no longer dims the map (2025-07-25)
- Fixed UT button visual focus issue - clicking UT buttons no longer dims the main map (2025-07-25)
- Fixed timer pill disappearing due to CSS positioning conflicts
- Fixed pseudo-element layering preventing content interaction

## [1.x.x] - Previous Versions
- Initial creation of CHANGELOG.md (2025-07-25)
- Please document every change here with date, summary, and reason for change.
