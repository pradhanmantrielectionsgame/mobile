# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

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
