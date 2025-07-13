# Game Phase Management System

This document describes the newly implemented phase management system for the Pradhan Mantri Elections Game.

## Overview

The phase management system provides:
- **10 phases** total (configurable)
- **30-second countdown timer** per phase (configurable)
- **Automatic refresh funds** for both players at the start of each phase
- **Visual timer display** with warnings and animations
- **Automatic phase progression** with smooth transitions

## Configuration

All phase-related settings are stored in `data/game-config.json`:

```json
{
  "gameSettings": {
    "totalPhases": 10,
    "phaseDurationSeconds": 30,
    "refreshFundsPerPhase": 500
  }
}
```

## How to Use

### Game Start
- **Automatic Start**: The game starts automatically when the page loads
- **No Manual Action Required**: Timer begins counting down immediately
- **Visual Indicators**: Body gets `game-started` class for styling

### During Gameplay
- **Timer Display**: Shows current phase and countdown (e.g., "Phase 3/10 | 0:25")
- **Refresh Funds**: Both players automatically receive ₹500M at the start of each phase
- **Rally Token Reset**: All rally tokens are refreshed each phase
- **Visual Warning**: Timer turns red with pulsing animation in the last 10 seconds

### Manual Controls (Testing)
- **Ctrl+Click timer**: Pause/Resume the current phase
- **Shift+Click timer**: Skip to next phase (for testing)

## Console Commands

For testing and debugging, these commands are available in the browser console:

```javascript
// Restart the game (if needed)
quickStartGame()

// Skip to a specific phase (1-10)
testSkipPhase(5)

// View current game status
getGameStatus()

// Manually award refresh funds
testRefreshFunds()

// Pause/resume the current phase
togglePausePhase()
```

## Technical Implementation

### Key Files
- `phase-system.js` - Main phase management logic
- `data/game-config.json` - Configuration file
- `game-data.js` - Updated to integrate with phase system
- `app.js` - Updated initialization
- `styles.css` - Phase-related CSS animations

### Key Features
1. **Countdown Timer**: Updates every second with smooth animations
2. **Phase Transitions**: Smooth transitions between phases with visual feedback
3. **Refresh Funds**: Automatic fund distribution using existing `updatePlayerFunds()`
4. **Rally Token Reset**: Automatic token refresh using `resetRallyTokensForPhase()`
5. **Game End**: Automatic transition to results after final phase

### Integration Points
- Uses existing `updatePlayerFunds()` for refresh funds
- Uses existing `resetRallyTokensForPhase()` for token management
- Uses existing `showElectionResults()` for game end
- Uses existing sound system for audio feedback

## Customization

You can easily modify the game behavior by editing `data/game-config.json`:

- Change `totalPhases` to adjust game length
- Change `phaseDurationSeconds` to make phases shorter/longer
- Change `refreshFundsPerPhase` to adjust economic balance
- Modify `ui.countdownWarningSeconds` to change when warnings appear

## Future Enhancements

Possible improvements:
- Phase-specific events or bonuses
- Variable phase lengths
- Mid-game configuration changes
- Player-controlled phase pacing
- Advanced timer controls (pause, speed up/slow down)
- Phase-based scoring multipliers

## Troubleshooting

If the phase system isn't working:
1. Check browser console for errors
2. Verify `data/game-config.json` exists and is valid JSON
3. Try `getGameStatus()` in console to check current state
4. Use `quickStartGame()` to force-start the system
