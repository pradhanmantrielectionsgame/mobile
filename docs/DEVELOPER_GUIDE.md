# Developer Guide - Pradhan Mantri Elections Game

## Quick Start
1. Open `index.html` in any modern browser
2. No build tools or dependencies required
3. All assets are local and self-contained

## Architecture Overview

### Modular System (Post-Refactoring)
The game has been refactored from a monolithic 850+ line file into 9 focused modules:

**Core Modules:**
- `js/config-manager.js` (~80 lines) - Configuration loading from JSON
- `js/state-manager.js` (~150 lines) - State data and lookup operations  
- `js/popularity-manager.js` (~300 lines) - Popularity calculations and seat projections
- `js/player-manager.js` (~200 lines) - Player data and politician management
- `js/investment-system.js` (~120 lines) - Direct investment mechanics
- `js/rally-system.js` (~150 lines) - Rally token system
- `js/ui-manager.js` (~200 lines) - UI updates and map coloring
- `js/data-loader.js` (~60 lines) - Initialization coordinator
- `js/game-data.js` (~50 lines) - Main coordinator and compatibility layer

**UI & Game Logic:**
- `js/app.js` (~220 lines) - Main application and UI interactions
- `js/campaign-system.js` (~160 lines) - Campaign modal and policy investments
- `js/phase-system.js` - Game phase management and timers

### Configuration System
All game balance is now centralized in `data/game-config.json`:
```json
{
  "playerSettings": {
    "startingFunds": 2500
  },
  "investmentSystem": {
    "baseCostPerSeat": 10,
    "basePopularityBoost": 5,
    "finalPopularityBoost": 2,
    "glidePathInvestments": 20,
    "minimumBoost": 2
  },
  "rallySystem": {
    "simpleRallyTokens": 2,
    "specialRallyTokens": 2,
    "popularityBoost": 8
  },
  "gameSettings": {
    "totalPhases": 10,
    "phaseDurationSeconds": 30,
    "refreshFundsPerPhase": 1000
  }
}
```

## Game Systems

### State Popularity System
**Initialization:**
- Player 1: ~100 seats (3-5 territories) with 35-60% popularity
- Player 2: ~100 seats (3-5 territories) with 35-60% popularity
- Others: Residual in all territories, competitive in most

**Seat Allocation:**
- Proportional to popularity percentage (not winner-take-all)
- Real-time calculation: `Math.floor(totalSeats * (popularity / 100))`
- Updates every 15 seconds with simulation

**Map Visualization:**
- Green (Player 1), Red (Player 2), Gray (Others)
- Intensity based on popularity strength (35%=light, 80%=intense)

### Investment System
**Direct Investment (Map Click):**
- Cost: `seats × 10 crores` per investment
- Effect: Glide path system - starts at 5% boost, decreases linearly to 2% over 20 investments, then stays at 2%
- Player 1: Normal click | Player 2: Shift+click
- Info only: Ctrl/Cmd+click

**Campaign Investment (Modal):**
- 22 policies from `policy-tags.json`
- Tier-based costs: Gold (60M), Silver (40M), Bronze (20M)
- 10-click completion system
- Regional effects based on policy tags

### Rally System
**Simple Rally Tokens:**
- 2 tokens per player per phase (configurable)
- Alt+click on states
- Fixed popularity boost (8%, configurable)

**Special Rally Tokens:**
- 2 tokens per player per phase (configurable)
- For Union Territories only
- Enhanced boost for strategic play

### Phase Management
**Phase System:**
- 10 phases total (configurable)
- 30-second countdown per phase (configurable)
- Automatic fund refresh each phase
- Visual timer with warnings and animations

## UI Architecture

### 4-Banner Layout
1. **Projected Seats Bar** (35px) - Real-time seat projections
2. **Player Info** (42px) - Candidate icons, party icons, names, funds
3. **State Info** (32px) - Selected state details and menu
4. **State Groups** (80px) - 4×4 grid for regional filtering

### Floating Elements
- **Timer Overlay** - Phase countdown with Union Territory buttons
- **Action Buttons** - Campaign (left) and Rally (right) FABs

### Responsive Design
- Mobile-first (320px+)
- Touch-friendly (44px+ targets)
- No horizontal scrolling
- Progressive enhancement to 1440px+

## Data Structure

### States Data (`data/states_data.json`)
```json
{
  "id": "INUP",
  "name": "Uttar Pradesh",
  "seats": 80,
  "UnionTerritory": false,
  "CoastalIndia": false,
  "HindiHeartland": true,
  "AgriculturalRegion": true
}
```

### Policy Data (`data/policy-tags.json`)
```json
{
  "name": "Healthcare",
  "tier": 1,
  "baseMagnitude": 12,
  "supportTags": ["AgriculturalRegion", "TribalLands"],
  "opposeTags": ["IndustrialCorridor"]
}
```

### Game Config (`data/game-config.json`)
```json
{
  "playerSettings": {
    "startingFunds": 2500
  },
  "investmentSystem": {
    "baseCostPerSeat": 10,
    "basePopularityBoost": 5,
    "finalPopularityBoost": 2,
    "glidePathInvestments": 20,
    "minimumBoost": 2
  },
  "gameSettings": {
    "totalPhases": 10,
    "phaseDurationSeconds": 30,
    "refreshFundsPerPhase": 1000
  }
}
```

## File Organization

### Script Load Order (index.html)
```html
<!-- Core system modules -->
<script src="js/config-manager.js"></script>
<script src="js/state-manager.js"></script>
<script src="js/popularity-manager.js"></script>
<script src="js/player-manager.js"></script>
<script src="js/investment-system.js"></script>
<script src="js/rally-system.js"></script>
<script src="js/ui-manager.js"></script>
<script src="js/data-loader.js"></script>

<!-- Game coordination -->
<script src="js/game-data.js"></script>
<script src="js/campaign-system.js"></script>
<script src="js/phase-system.js"></script>
<script src="js/app.js"></script>
```

### Project Structure
```
index.html                 # Main entry point
js/                       # All JavaScript files
├── config-manager.js     # Configuration management
├── state-manager.js      # State data operations
├── popularity-manager.js # Popularity and seat calculations
├── player-manager.js     # Player data management
├── investment-system.js  # Direct investment mechanics
├── rally-system.js       # Rally token system
├── ui-manager.js         # UI updates and map coloring
├── data-loader.js        # Data loading coordinator
├── game-data.js          # Main coordinator
├── campaign-system.js    # Campaign modal system
├── phase-system.js       # Game phase management
└── app.js               # Main application logic
styles/                   # CSS files
└── styles.css           # Main stylesheet
docs/                     # Documentation
├── README.md            # User guide and game overview
└── DEVELOPER_GUIDE.md   # Technical documentation
data/                     # Game configuration and data
├── game-config.json     # Game balance and settings
├── states_data.json     # State information
├── politicians-data.json # Politician profiles
└── policy-tags.json     # Policy definitions
assets/                   # Static assets
├── icons/               # SVG icons and logos
└── images/              # PNG images
sounds/                   # Audio files
└── *.mp3               # Game sound effects
```

### CSS Architecture
- CSS Custom Properties for theming
- Mobile-first responsive design
- Component-based styling
- No external frameworks

## Development Workflow

### Adding New Features
1. Determine which module handles the functionality
2. Keep all files under 500 lines
3. Update `game-config.json` for new settings
4. Test on mobile devices
5. Update documentation

### Common Tasks

**Adding a New Policy:**
1. Add to `data/policy-tags.json`
2. Campaign modal automatically loads it
3. No code changes required

**Modifying Game Balance:**
1. Edit values in `data/game-config.json`
2. No code changes required
3. Changes take effect on page reload

**Adding New State Groups:**
1. Add boolean field to `data/states_data.json`
2. Update state groups grid in `js/app.js`
3. Test filtering functionality

### Debugging
- Use browser dev tools
- All logic is client-side
- Modular structure isolates issues
- Console logging for state changes

## Performance Considerations

### Optimization Features
- Async data loading with error handling
- Minimal DOM manipulation
- Hardware-accelerated CSS animations
- Event delegation for efficiency
- Cached references to DOM elements

### Mobile Performance
- Touch-optimized interactions
- Smooth animations (60fps)
- Efficient SVG rendering
- No layout thrashing

## Browser Compatibility
- Modern ES6+ browsers
- CSS Grid and Flexbox support
- Fetch API for data loading
- No polyfills required

## Security & Privacy
- All client-side execution
- No external dependencies
- No data collection
- Local file access only

---

**Note:** This guide covers the technical implementation. For gameplay instructions and user features, see the main README.md file.
