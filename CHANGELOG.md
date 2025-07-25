# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

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
