# PradhanMantri Elections Game - API Documentation

## Core Game Classes and Functions

### Main Game Controller (`main.js`)

#### `initGame()`
Initializes the game state, sets up event listeners, and prepares the game board.

#### `startGame()`
Begins the game timer and enables player interactions.

#### `endGame(winner)`
Handles game completion, displays results, and updates statistics.

### Map Controller (`map-controller.js`)

#### `loadMap()`
Loads and renders the India map SVG with interactive state regions.

#### `updateStateColors()`
Updates state colors based on current popularity/control.

#### `handleStateClick(stateId)`
Processes player clicks on map states for campaign actions.

### Player Info (`player-info.js`)

#### `updatePlayerStats(playerId, stats)`
Updates player information display including funds, seats, and popularity.

#### `validatePlayerAction(playerId, action, cost)`
Validates if a player can perform a specific action based on available resources.

### Rally Controller (`rally-controller.js`)

#### `conductRally(stateId, playerId, investment)`
Executes a rally campaign in a specified state.

#### `calculateRallyEffect(investment, statePopulation)`
Calculates the popularity boost from a rally based on investment and state characteristics.

### AI Player (`ai-player-controller.js`)

#### `makeAIDecision()`
Determines AI player's next action based on current game state.

#### `evaluateStateImportance(stateId)`
Calculates strategic value of a state for AI decision making.

### Game Timer (`game-timer.js`)

#### `startTimer(duration)`
Starts the game timer with specified duration.

#### `pauseTimer()`
Pauses the current game timer.

#### `resetTimer()`
Resets the timer to initial state.

### Campaign Spending (`campaign-spending.js`)

#### `spendOnState(stateId, amount, playerId)`
Processes campaign spending in a specific state.

#### `spendOnPolicy(policyId, amount, playerId)`
Processes spending on policy promises.

### Random Events (`random-events.js`)

#### `triggerRandomEvent()`
Generates and applies random events that affect game state.

#### `applyEventEffect(event, players)`
Applies the effects of a random event to the game state.

## Data Structures

### Player Object
```javascript
{
    id: string,
    name: string,
    party: string,
    funds: number,
    seats: number,
    popularity: object, // state-wise popularity scores
    homeState: string
}
```

### State Object
```javascript
{
    id: string,
    name: string,
    seats: number,
    popularity: {
        player1: number,
        player2: number,
        others: number
    },
    isLocked: boolean
}
```

### Event Object
```javascript
{
    id: string,
    name: string,
    description: string,
    effects: object,
    probability: number
}
```

## Game Configuration

### Constants (`game-config.js`)
- `INITIAL_FUNDS`: Starting funds for each player
- `TOTAL_PHASES`: Number of game phases
- `VICTORY_SEATS`: Seats needed to win (272)
- `PHASE_DURATION`: Duration of each phase in seconds

### State Data (`data/states_data.json`)
Contains comprehensive information about Indian states including:
- Total Lok Sabha seats
- Geographic regions
- Population data
- Historical voting patterns

### Politicians Data (`data/politicians-data.json`)
Contains information about political leaders including:
- Party affiliations
- Home states
- Popularity bonuses
- Special abilities

## Audio System (`sound-manager.js`)

### `playSound(soundId)`
Plays specified sound effect.

### `playBackgroundMusic()`
Starts background music loop.

### `toggleSound(enabled)`
Enables/disables sound effects.

### `toggleMusic(enabled)`
Enables/disables background music.

## Visual Effects (`visual-effects.js`)

### `showCelebration(message)`
Displays celebration animation with message.

### `highlightState(stateId, color)`
Highlights a state with specified color.

### `showPopularityChange(stateId, change)`
Displays popularity change animation for a state.

## Error Handling

All functions include error handling for:
- Invalid player IDs
- Insufficient funds
- Invalid state IDs
- Network errors (for future online features)

## Performance Considerations

- Debounced state updates to prevent excessive re-rendering
- Lazy loading of audio files
- Optimized SVG rendering
- Efficient event listener management
