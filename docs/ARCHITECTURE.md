# Architecture Overview - PradhanMantri Elections Game

## System Architecture

The PradhanMantri Elections Game is a client-side web application built with vanilla JavaScript, HTML5, and CSS3. The architecture follows a modular approach with separation of concerns.

## High-Level Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    User Interface Layer                     │
├─────────────────────────────────────────────────────────────┤
│  welcome-screen.html  │  index.html  │  politician.html    │
│  player-info-only.html                                      │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                   Presentation Layer                        │
├─────────────────────────────────────────────────────────────┤
│              CSS Modules (styles/)                          │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │   main.css  │  │   map.css   │  │ panels.css  │   ...  │
│  └─────────────┘  └─────────────┘  └─────────────┘        │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    Application Layer                        │
├─────────────────────────────────────────────────────────────┤
│                   JavaScript Modules (js/)                  │
│  ┌─────────────────┐  ┌─────────────────┐  ┌──────────────┐ │
│  │   main.js       │  │ map-controller  │  │ player-info  │ │
│  │ (Entry Point)   │  │     .js         │  │    .js       │ │
│  └─────────────────┘  └─────────────────┘  └──────────────┘ │
│  ┌─────────────────┐  ┌─────────────────┐  ┌──────────────┐ │
│  │ rally-controller│  │ ai-player-      │  │ game-timer   │ │
│  │     .js         │  │ controller.js   │  │    .js       │ │
│  └─────────────────┘  └─────────────────┘  └──────────────┘ │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                     Data Layer                              │
├─────────────────────────────────────────────────────────────┤
│           Static Data Files (data/)                         │
│  ┌─────────────────┐  ┌─────────────────┐                  │
│  │  states_data    │  │ politicians-    │                  │
│  │    .json        │  │  data.json      │                  │
│  └─────────────────┘  └─────────────────┘                  │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    Asset Layer                              │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐  ┌─────────────────┐  ┌──────────────┐ │
│  │ assets/images/  │  │ assets/icons/   │  │  sounds/     │ │
│  │   (PNG files)   │  │  (SVG files)    │  │ (MP3 files)  │ │
│  └─────────────────┘  └─────────────────┘  └──────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

## Module Architecture

### Core Modules

#### 1. Main Controller (`main.js`)
- **Purpose**: Central orchestrator and entry point
- **Responsibilities**:
  - Initialize game state
  - Coordinate between modules
  - Handle global event listeners
  - Manage game lifecycle

#### 2. Map Controller (`map-controller.js`)
- **Purpose**: Manage the interactive India map
- **Responsibilities**:
  - Load and render SVG map
  - Handle state click events
  - Update visual state indicators
  - Manage map animations

#### 3. Player Info Manager (`player-info.js`)
- **Purpose**: Handle player data and UI updates
- **Responsibilities**:
  - Track player statistics
  - Update UI displays
  - Validate player actions
  - Manage player funds

#### 4. AI Controller (`ai-player-controller.js`)
- **Purpose**: Implement computer player logic
- **Responsibilities**:
  - Make strategic decisions
  - Simulate human-like behavior
  - Evaluate game state
  - Execute AI actions

#### 5. Rally System (`rally-controller.js`)
- **Purpose**: Manage campaign rally mechanics
- **Responsibilities**:
  - Process rally investments
  - Calculate popularity effects
  - Handle rally animations
  - Manage rally cooldowns

#### 6. Game Timer (`game-timer.js`)
- **Purpose**: Control game timing and phases
- **Responsibilities**:
  - Track phase progression
  - Handle pause/resume
  - Trigger phase transitions
  - Display countdown

### Utility Modules

#### 1. Sound Manager (`sound-manager.js`)
- **Purpose**: Handle all audio functionality
- **Dependencies**: None
- **Interface**:
  ```javascript
  playSound(soundId)
  playBackgroundMusic()
  toggleSound(enabled)
  setVolume(level)
  ```

#### 2. Visual Effects (`visual-effects.js`)
- **Purpose**: Manage animations and visual feedback
- **Dependencies**: None
- **Interface**:
  ```javascript
  showCelebration(message)
  highlightState(stateId)
  showPopularityChange(change)
  ```

#### 3. Debug Utilities (`debug-*.js`)
- **Purpose**: Development and testing support
- **Responsibilities**:
  - Provide debug interfaces
  - Log game state
  - Enable testing modes

### Data Flow Architecture

```
User Input
    │
    ▼
Event Handlers (main.js)
    │
    ▼
Action Validation
    │
    ▼
State Updates
    │
    ▼
UI Updates (Multiple Controllers)
    │
    ▼
Visual/Audio Feedback
```

### State Management

#### Game State Structure
```javascript
const gameState = {
    phase: number,
    isRunning: boolean,
    timer: {
        remaining: number,
        isPaused: boolean
    },
    players: {
        player1: PlayerObject,
        player2: PlayerObject
    },
    states: {
        [stateId]: StateObject
    },
    events: {
        active: EventObject[],
        history: EventObject[]
    }
};
```

#### State Update Pattern
1. **Action Initiated**: User or AI triggers action
2. **Validation**: Check if action is valid
3. **State Mutation**: Update game state
4. **UI Sync**: Update all relevant UI components
5. **Side Effects**: Trigger animations, sounds, etc.

### Event System

#### Event Types
- **UI Events**: Click, hover, keyboard input
- **Game Events**: Phase change, player action, AI turn
- **System Events**: Timer updates, audio loading, errors

#### Event Flow
```javascript
// Event registration
document.addEventListener('click', handleStateClick);

// Event handling
function handleStateClick(event) {
    const stateId = event.target.id;
    if (validateStateAction(stateId)) {
        processStateAction(stateId);
        updateUI();
        triggerEffects();
    }
}
```

### Component Communication

#### Direct Communication
- Parent-child module relationships
- Function calls with parameters
- Return values for status/data

#### Event-Based Communication
- Custom events for loose coupling
- Global event bus for system-wide events
- DOM events for UI interactions

#### Shared State
- Global game state object
- Configuration constants
- Utility functions

### Performance Considerations

#### Optimization Strategies
1. **DOM Manipulation**:
   - Batch DOM updates
   - Use document fragments
   - Minimize reflows/repaints

2. **Event Handling**:
   - Event delegation
   - Debounced functions
   - Efficient event listeners

3. **Audio/Visual**:
   - Lazy loading of assets
   - Preload critical resources
   - Optimize animations with CSS3

4. **Memory Management**:
   - Remove unused event listeners
   - Clear intervals/timeouts
   - Manage object references

### Error Handling Architecture

#### Error Types
- **User Errors**: Invalid actions, insufficient funds
- **System Errors**: Asset loading failures, timer issues
- **Network Errors**: (Future) Online features

#### Error Handling Strategy
```javascript
function handleError(error, context) {
    console.error(`Error in ${context}:`, error);
    
    // Show user-friendly message
    showErrorMessage(getErrorMessage(error));
    
    // Attempt recovery
    if (isRecoverable(error)) {
        attemptRecovery(error, context);
    }
    
    // Log for debugging
    logError(error, context);
}
```

### Security Architecture

#### Client-Side Security
- Input validation and sanitization
- XSS prevention measures
- Content Security Policy headers
- Secure asset loading (HTTPS)

#### Data Protection
- No sensitive data stored client-side
- Local storage encryption (if implemented)
- Secure API communication (future features)

### Scalability Considerations

#### Modular Design
- Easy to add new features
- Isolated components
- Clear interfaces between modules

#### Future Extensibility
- Plugin architecture ready
- Configuration-driven features
- Internationalization support structure

#### Performance Scaling
- Code splitting possibilities
- Progressive loading
- Caching strategies

### Testing Architecture

#### Unit Testing Structure
```javascript
// Example test structure
describe('Rally Controller', () => {
    describe('calculateRallyEffect', () => {
        it('should increase popularity correctly', () => {
            // Test implementation
        });
    });
});
```

#### Integration Testing
- End-to-end game flow testing
- Cross-browser compatibility testing
- Performance regression testing

This architecture provides a solid foundation for the current game while being flexible enough to accommodate future enhancements and features.
