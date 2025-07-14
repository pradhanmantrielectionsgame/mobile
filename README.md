# Pradhan Mantri Elections Game - Mobile Version

A strategic political simulation game optimized for mobile devices with an immersive Indian election experience.

## Quick Start

1. **Main Game**: Open `index.html` in your browser
2. **Legacy Version**: `svg-test.html` (deprecated, use for reference only)

## File Structure

### Core Application Files
- **`index.html`** - Main game file with clean HTML structure
- **`styles.css`** - Complete styling and responsive design
- **`app.js`** - Main application logic and UI interactions

### Modular Game Systems (NEW)
- **`config-manager.js`** - Configuration management and JSON loading
- **`state-manager.js`** - State data loading and basic operations
- **`popularity-manager.js`** - State popularity calculations and seat projections
- **`player-manager.js`** - Player data, funds, and politician management
- **`investment-system.js`** - Direct investment mechanics
- **`rally-system.js`** - Rally token mechanics
- **`ui-manager.js`** - UI updates, map coloring, seat projections
- **`data-loader.js`** - Coordinates initialization of all data systems
- **`game-data.js`** - Main coordinator and backwards compatibility
- **`campaign-system.js`** - Campaign functionality and modals
- **`phase-system.js`** - Game phase management

### Data Files
- **`data/states_data.json`** - Indian states and union territories data
- **`data/policy-tags.json`** - Campaign policies and pricing
- **`data/politicians-data.json`** - Political leader information

### Assets
- **`assets/icons/`** - SVG map and party logos
- **`assets/images/`** - Leader portraits and backgrounds
- **`sounds/`** - Game audio files

## Features

### Mobile-Optimized UI
- **4-Banner Layout**: Projected seats, enhanced player info (with candidate & party icons, player name, dynamic funds), state info, and regional groups
- **Player Info Section**: Shows candidate icon, party icon, player name, and dynamically updated funds for each player
- **Floating Timer**: Phase tracking with Union Territory quick access
- **Touch-Friendly**: Large buttons and responsive design
- **No Horizontal Scrolling**: All content fits within viewport

### Campaign System
- **3-Tier Policies**: Gold/Silver/Bronze tier organization with visual hierarchy
- **Regional Impact Labels**: Shows which areas benefit (+X%) or suffer (-X%) from policies
- **Nationwide Policies**: Universal effects when no specific regions are targeted
- **Investment Mechanics**: 10-click completion system with cost scaling
- **Real-time Progress**: Visual progress bars and fund tracking
- **Player Competition**: Dual-player investment system with Shift+Click support

### Interactive Map
- **Select & Invest**: Click states to view info AND make direct investment (combined action)
- **Rally Actions**: Alt + Click for simple rally (uses rally tokens)
- **Info Only**: Ctrl/Cmd + Click for state information without investment
- **Player 2 Actions**: Shift + [any click combination] for Player 2
- **Regional Filtering**: 16 data-driven state groups
- **Union Territory Access**: Direct UT selection buttons
- **Visual Feedback**: Highlighting and hover effects

### Game Mechanics
- **Projected Seats**: Real-time seat calculations
- **Popularity Simulation**: Dynamic state popularity changes
- **Player Info**: Candidate and party icons, player name, and funds are always visible and update in real time
- **Fund Management**: Player budget tracking with visual feedback and error animation for insufficient funds
- **Strategic Depth**: Multi-layered policy investments

## Technical Details

### Responsive Design
- **Mobile First**: Optimized for 320px+ screens
- **Progressive Enhancement**: Scales up to 1440px+ displays
- **Touch Optimized**: Minimum 44px touch targets
- **Performance**: Separate file caching and optimization

### Browser Compatibility
- Modern browsers with ES6+ support
- CSS Grid and Flexbox support required
- Fetch API for data loading

### Development

### Architecture Benefits
- **Modular**: Refactored from monolithic 850+ line file into 9 focused modules of ~50-300 lines each
- **Configuration-Driven**: Single source of truth in JSON config eliminates hardcoded values
- **Scalable**: Easy to add new features without making files too large
- **Debuggable**: Issues isolated to specific files and functions
- **Collaborative**: Multiple developers can work simultaneously on different modules

### Code Quality
- All files under 500 lines for maintainability
- Consistent naming conventions
- Comprehensive documentation
- Mobile-first responsive design
- Eliminated code duplication and hardcoded values

## Game Instructions

1. **Select & Invest**: Click on map states to view info and make direct investment
2. **Rally Actions**: Alt + Click on states to use rally tokens  
3. **Info Only**: Ctrl/Cmd + Click states for information without investment
4. **Filter Regions**: Use the 4×4 grid to focus on specific areas
5. **Run Campaigns**: Click the lightning button (⚡) to invest in policies
6. **Track Progress**: Monitor projected seats in the top progress bar

### Campaign Investment
- **Normal Click**: Player 1 investment
- **Shift + Click**: Player 2 investment  
- **Progress**: 10 clicks complete each campaign
- **Cost**: Based on policy tier and magnitude (20M-60M per click)
- **Regional Effects**: Green labels show support areas (+X%), red labels show oppose areas (-X%)
- **Nationwide Policies**: Some policies affect all regions equally when no specific tags are set

## Contributing

When modifying the code:
1. Keep files under 500 lines
2. Update corresponding documentation
3. Test on mobile devices
4. Maintain responsive design principles

## License

This project is part of the Pradhan Mantri Elections Game educational simulation.

---

**Latest Version**: Modular Refactoring & Configuration System  
**Last Updated**: July 14, 2025  
**Repository**: pradhanmantrielectionsgame.github.io

## Recent Major Changes

### Modular Architecture Refactoring (July 14, 2025)
- **Eliminated Duplication**: Removed hardcoded values duplicated between JS and JSON config
- **Improved Maintainability**: Split 850+ line monolithic file into 9 focused modules
- **Configuration System**: Centralized game balance in `game-config.json`
- **File Structure**: All modules kept under 500 lines for readability
- **Backwards Compatibility**: All existing function calls continue to work

### File Load Order
Core system modules → Game coordination → UI systems:
```
config-manager.js → state-manager.js → popularity-manager.js → 
player-manager.js → investment-system.js → rally-system.js → 
ui-manager.js → data-loader.js → game-data.js → 
campaign-system.js → phase-system.js → app.js
```
