# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

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
