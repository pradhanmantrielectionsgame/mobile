# Pradhan Mantri Elections Game - Mobile Version

A strategic political simulation game optimized for mobile devices with an immersive Indian election experience.

## Quick Start

Open `index.html` in any modern browser. No installation or setup required!

## Game Overview

Experience India's democratic process as you compete to become the next Pradhan Mantri. Invest in policies, run campaigns, and manage your popularity across all 28 states and 8 union territories.

### Key Features
- **Real-time Strategy**: Compete with another player in timed phases
- **Policy Campaigns**: 22 different policies across 3 tiers (Gold/Silver/Bronze)
- **Regional Politics**: Each policy affects different regions differently
- **Direct Investment**: Click states to invest funds and boost popularity
- **Rally System**: Use rally tokens for strategic popularity boosts
- **Interactive Map**: Full map of India with touch-friendly controls
- **Visual Feedback**: Ripple effects and sound feedback for all player actions
- **Mobile-First Design**: Optimized for touch devices with responsive interface

## How to Play

### Basic Controls
- **State Selection**: Click any state to view info and invest funds
- **Union Territory Investment**: Click UT buttons to invest in union territories
- **Rally Actions**: Alt + Click to use rally tokens for popularity boost (works on both map states and UT buttons)
- **Info Only**: Ctrl/Cmd + Click to view state details without investing
- **Player 2**: Add Shift to any action (e.g., Shift+Click to invest as Player 2)
- **Visual Feedback**: 
  - Investment notifications appear as compact red banners in player info area
  - Ripple effects show at click location (states) or geographic center (UTs)
  - Player-specific colors: Green ripples for Player 1, Red ripples for Player 2
- **Audio Feedback**: 
  - Success sound (`money_spent.mp3`) for Player 1 successful investments
  - Error sound (`invalid_action.mp3`) for Player 1 insufficient funds
  - Player 2 actions are silent for reduced audio clutter

### Game Interface
- **Top Bar**: Shows real-time projected seats for both players
- **Player Info**: Displays candidate photos, party logos, and current funds
- **State Info**: Shows details about the currently selected state
- **Regional Filters**: 4×4 grid to focus on specific types of states
- **Timer**: Floating countdown showing current phase and time remaining

### Campaign System
1. **Open Campaigns**: Click the lightning bolt (⚡) button
2. **Choose Policy**: Select from 22 different policies organized by importance
3. **Make Investment**: Click to invest funds (each policy needs 10 clicks to complete)
4. **Strategic Cost Structure**: 
   - **Tier 1 Policies (High Impact)**: ₹180Cr per click (₹1800Cr total) - Major strategic commitments
   - **Tier 2 Policies (Medium Impact)**: ₹120Cr per click (₹1200Cr total) - Significant investments  
   - **Tier 3 Policies (Focused Impact)**: ₹90Cr per click (₹900Cr total) - Accessible but meaningful
5. **Phase Limits**: Each player can contribute maximum 5 times per phase to any single campaign
6. **Progress Tracking**: Visual progress bars show completion status with player-specific colors (immediate updates)
7. **Regional Effects**: Green labels show regions that benefit, red labels show regions that suffer
8. **Audio Feedback**: 
   - Successful investments play money spending sound
   - Blocked actions (insufficient funds, phase limits) play invalid action sound
9. **Phase Reset**: Contribution limits reset automatically when new phase begins
10. **Strategic Timing**: Complete campaigns to gain popularity in target regions

### Investment Strategy
- **Direct Investment**: Quick popularity boost in specific states
  - **Cost Formula**: Number of seats × ₹10Cr (e.g., UP = 80 seats = ₹800Cr)
  - **Glide Path System**: Popularity boost starts at +5% and gradually decreases to +2% over first 20 investments per state, then stays at +2%
  - Works on both map states and Union Territory buttons
  - Compact red notifications show investment amount in crores
- **Policy Campaigns**: Major strategic investments affecting multiple regions
  - **High Risk/Reward**: Tier 1 campaigns require nearly all starting funds but provide massive regional boosts
  - **Medium Strategy**: Tier 2 campaigns balance cost with broad impact
  - **Early Game**: Tier 3 campaigns are more accessible for opening moves
- **Rally Tokens**: Limited but powerful boosts for strategic moments
- **Resource Management**: With aggressive campaign costs, careful fund allocation is crucial
- **Regional Focus**: Use the 4×4 grid to identify key battleground areas

### Economic System
- **Starting Funds**: ₹2500 crores per player
- **Phase Refresh**: ₹1000 crores per phase for both players
- **Investment Scaling**: Costs scale with state importance (seat count)
- **Diminishing Returns**: Smart glide path system prevents exploitation while maintaining viability

### Winning
- **Goal**: Have the most projected seats when all phases complete
- **Seat Calculation**: Based on popularity percentage in each state
- **Strategic Depth**: Balance immediate gains vs long-term campaign effects

## Mobile Features

- **Touch-Optimized**: All buttons sized for comfortable thumb access
- **No Horizontal Scrolling**: Everything fits within your screen
- **Responsive Design**: Adapts from phone (320px) to desktop (1440px+)
- **Visual Feedback**: Clear animations and color coding for all actions
- **Floating Controls**: Timer and action buttons positioned for easy access

## Browser Compatibility

Works on any modern browser (Chrome, Firefox, Safari, Edge) with:
- JavaScript ES6+ support
- CSS Grid and Flexbox
- Touch event handling

## Development

For technical documentation, architecture details, and development setup, see [DEVELOPER_GUIDE.md](DEVELOPER_GUIDE.md).

### Quick Development Setup
1. Clone the repository
2. Open `index.html` in your browser
3. No build tools or dependencies required
4. All assets are local and self-contained

### Project Structure
- `js/` - All JavaScript modules (12 files)
- `styles/` - CSS files  
- `docs/` - Documentation files
- `data/` - Game configuration and data files
- `assets/` - Images, icons, and SVG files
- `sounds/` - Audio files

## Contributing

When modifying the code:
1. Keep files under 500 lines for maintainability
2. Update documentation for any feature changes
3. Test on mobile devices
4. Maintain responsive design principles
5. Follow the modular architecture in DEVELOPER_GUIDE.md

---

**Latest Version**: Enhanced Pricing System with Glide Path Investment  
**Last Updated**: July 18, 2025  
**Repository**: pradhanmantrielectionsgame.github.io
