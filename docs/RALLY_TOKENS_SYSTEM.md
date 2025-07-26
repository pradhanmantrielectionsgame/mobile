# Rally Tokens System

## Overview

The Rally Tokens System provides players with strategic, limited-use popularity boosts through a token-based mechanic. This system adds tactical depth by requiring players to make strategic decisions about when and where to use their limited rally resources.

## Token Types

### Regular Tokens
- **Effect Scope**: Single state or Union Territory
- **Popularity Boost**: +4% (configurable in `game-config.json`)
- **Spawn Rate**: 95% (common)
- **Placement Limit**: Maximum 2 per state across entire game (both players combined)
- **Strategic Use**: Targeted regional influence

### Special Tokens
- **Effect Scope**: Nationwide (all states and UTs)
- **Popularity Boost**: +4% (configurable in `game-config.json`)
- **Spawn Rate**: 5% (rare)
- **Placement Limit**: None (naturally limited by rarity)
- **Strategic Use**: Game-changing moments

## Token Distribution

### Phase Award System
- **Timing**: Beginning of each phase
- **Quantity**: 2 tokens per player
- **Randomization**: Each token independently rolled for type
  - 95% chance: Regular token
  - 5% chance: Special token
- **Accumulation**: Unused tokens DO NOT carry over to next phase

### Configuration
All distribution parameters are configurable in `game-config.json`:
```json
{
  "rallyTokens": {
    "tokensPerPhase": 2,
    "specialTokenChance": 0.05,
    "regularTokenBoost": 4,
    "specialTokenBoost": 4,
    "maxRegularTokensPerState": 2
  }
}
```

## Placement Rules

### Regular Token Constraints
- **State Limit**: Maximum 2 regular tokens per state
- **Shared Limit**: Limit applies across both players combined
- **Validation**: System prevents placement when limit reached
- **Error Handling**: Player receives error message and sound

### Special Token Constraints
- **No Limits**: Can be placed unlimited times
- **Natural Scarcity**: 5% spawn rate provides built-in limitation
- **Strategic Value**: High impact justifies unlimited placement

## User Interface

### Token Inventory Access
1. Player clicks rally action button on main interface
2. Token inventory panel reveals available tokens
3. Each token displays type (regular/special) and available count

### Token Placement Process
1. Click specific token in inventory to select
2. Click target state or UT on map to place token
3. Immediate effect application and visual feedback
4. Token removed from inventory

### Visual Feedback
- **Placed Tokens**: Visible markers on map
- **Color Coding**: Player-specific colors for token ownership
- **Success Animation**: Confirmation of successful placement
- **Error Messages**: Clear feedback for invalid placements

## Strategic Considerations

### Regular Token Strategy
- **Regional Focus**: Target swing states or competitive regions
- **Timing**: Use before critical phases or close margins
- **Coordination**: Consider where opponent has placed tokens
- **Scarcity**: Each state can only receive 2 total tokens

### Special Token Strategy
- **Game Changers**: Save for pivotal moments
- **Wide Impact**: Affects all 36 states and UTs simultaneously
- **Rarity Value**: Only ~10% of all tokens are special
- **Momentum Shifts**: Can dramatically alter nationwide standings

## Technical Implementation

### Core Components
- **rally-system.js**: Core token logic and validation
- **player-manager.js**: Token inventory management
- **state-manager.js**: State-level token tracking
- **phase-system.js**: Token distribution timing
- **ui-manager.js**: Interface and interaction handling

### Data Flow
1. Phase starts → Token generation → Player inventories updated
2. Player selects token → UI enters placement mode
3. Player clicks state → Validation → Effect application
4. Token consumed → Inventory updated → Visual feedback

### Integration Points
- **Config System**: All values configurable via `game-config.json`
- **Audio System**: Success/error sounds via central audio manager
- **Popularity System**: Integrates with existing popularity calculations
- **Phase System**: Automatic token awards at phase transitions

## Error Handling

### Invalid Placement Scenarios
- **Regular Token Limit Exceeded**: State already has 2 regular tokens
- **No Tokens Available**: Player has no tokens of selected type
- **Invalid Target**: Non-state area clicked during placement

### User Feedback
- **Visual**: Error message overlay with clear explanation
- **Audio**: `invalid_action.mp3` sound effect
- **UI State**: Return to token selection mode after error

## Balancing Considerations

### Regular Tokens
- **Common Availability**: Ensures consistent strategic options
- **Limited Impact**: Single state scope prevents dominance
- **Placement Caps**: Prevents token spam in key states

### Special Tokens
- **Rare Occurrence**: 5% spawn maintains special value
- **High Impact**: Nationwide effect justifies rarity
- **No Limits**: Unlimited placement prevents feel-bad moments

### Economic Balance
- **Free Usage**: Tokens don't cost money, only strategic decision
- **Opportunity Cost**: Using token now means not having it later
- **Risk/Reward**: Special tokens are rare but powerful

## Future Considerations

### Potential Enhancements
- **Token Trading**: Allow players to trade tokens
- **Token Types**: Additional specialized token varieties
- **Persistence**: Tokens that last multiple phases
- **Conditional Effects**: Tokens with situational bonuses

### Configuration Expansion
- **Phase Variation**: Different token awards per phase
- **Dynamic Rarity**: Spawn rates that change over time
- **Regional Tokens**: Tokens that affect specific regions
- **Scaling Effects**: Token power that scales with game state

---

**Documentation Version**: 1.1  
**Last Updated**: July 26, 2025  
**Related Files**: `rally-system.js`, `game-config.json`, `player-manager.js`
