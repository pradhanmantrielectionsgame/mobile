# Investment and Rally System Guide

## Overview
Two new interactive features have been added to enhance gameplay: Direct Investment and Rally System. Both use the existing `updateStatePopularity` function for consistent state management.

## Direct Investment System

### How to Use
- **Player 1**: `Click` on any state (shows info + invests)
- **Player 2**: `Shift + Click` on any state (shows info + invests)
- **Info Only**: `Ctrl/Cmd + Click` to view state info without investing

### Mechanics
- **Cost**: Number of Lok Sabha seats × ₹10M per investment
  - Example: Uttar Pradesh (80 seats) = ₹800M per investment
  - Example: Goa (2 seats) = ₹20M per investment
- **Effect**: Base +5% popularity boost with diminishing returns
- **Diminishing Returns**: Each subsequent investment in the same state gives 20% less effect
  - 1st investment: +5.0%
  - 2nd investment: +4.0% 
  - 3rd investment: +3.2%
  - 4th investment: +2.6%
  - Minimum boost: +0.5%

### Strategic Considerations
- Large states are expensive but control more seats
- Small states are cheap for maintaining presence
- Repeated investments become less cost-effective
- Investment tracking is per player, per state

## Rally System

### Rally Tokens (Per Phase)
Each player gets:
- **2 Simple Rally Tokens** 🏟️
- **2 Special Rally Tokens** 🌟

Rally tokens reset at the beginning of each new phase.

### Simple Rally Tokens
- **How to Use**: `Alt + Click` on any state (Player 2: `Shift + Alt + Click`)
- **Effect**: +4% popularity boost in the targeted state
- **Cost**: Free (consumes 1 simple token)
- **Targeting**: Can be used on any state/UT

### Special Rally Tokens  
- **How to Use**: Click "Rally" button → Select "P1/P2 Special Rally"
- **Effect**: +10% popularity boost in ALL states/UTs nationwide
- **Cost**: Free (consumes 1 special token)
- **Strategic Impact**: Affects all 543 constituencies simultaneously

## Visual Feedback

### State Click Colors
- **Normal Click** (state info): Orange border
- **Select & Invest** (Click): Green border  
- **Simple Rally** (Alt+Click): Purple border
- **Info Only** (Ctrl/Cmd+Click): Red border

### Messages
- **Investment messages**: Green background, positioned at top
- **Rally messages**: Purple background, positioned below investment messages

### Rally Token Display
- Token counts are shown below each player's funds
- 🏟️ = Simple Rally tokens remaining
- 🌟 = Special Rally tokens remaining
- Tokens update in real-time as they're used

## Strategic Gameplay Tips

### Investment Strategy
- **Early Game**: Invest in key swing states with medium seat counts
- **Mid Game**: Strengthen your strongholds or contest opponent strongholds
- **Late Game**: Make targeted investments in states that could tip the balance

### Rally Strategy
- **Simple Rallies**: Use for targeted state battles or defending strongholds
- **Special Rallies**: Use when you need nationwide momentum or when trailing significantly
- **Phase Management**: Plan token usage carefully - they reset each phase

### Combination Tactics
- **Investment + Rally**: Double-down on important states with both systems
- **Geographic Focus**: Use rallies for broad regional gains, investments for specific high-value targets
- **Resource Balance**: Balance expensive investments with free rally tokens

## Implementation Details

### Built on Existing Systems
- Uses the proven `updateStatePopularity(stateId, player, change, reason)` function
- Integrates with existing popularity management and seat calculation
- Maintains all existing game balance and proportional seat allocation

### Code Integration
- Investment tracking stored in `gameState.player.investments`
- Rally tokens stored in `gameState.player.rallyTokens`
- All functions exposed to browser console for testing
- Automatic UI updates for funds, popularity, and seat projections

### Console Commands for Testing
```javascript
// Direct investment
handleDirectInvestment('INUP', 'player1')  // Invest in UP as Player 1

// Rally tokens  
useSimpleRallyToken('INMH', 'player2')     // Simple rally in Maharashtra as Player 2
useSpecialRallyToken('player1')            // Special rally nationwide as Player 1

// Check investment stats
getInvestmentStats('player1')              // See Player 1's investment summary

// Reset tokens (typically called automatically each phase)
resetRallyTokensForPhase()
```

## Future Enhancements
- **Investment Cooldowns**: Prevent spam-clicking investments
- **Rally Effectiveness**: Variable effectiveness based on state characteristics
- **Advanced Tokens**: Region-specific or policy-specific rally types
- **Investment ROI**: Visual feedback showing return on investment over time
