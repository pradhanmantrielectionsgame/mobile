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
- **`game-data.js`** - Data management and state calculations
- **`campaign-system.js`** - Campaign functionality and modals

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
- **State Selection**: Click states for detailed information
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

## Development

### Architecture Benefits
- **Modular**: Separated concerns for better maintainability
- **Scalable**: Easy to add new features
- **Debuggable**: Issues isolated to specific files
- **Collaborative**: Multiple developers can work simultaneously

### Code Quality
- All files under 500 lines
- Consistent naming conventions
- Comprehensive documentation
- Mobile-first responsive design

## Game Instructions

1. **Select States**: Click on map or use Union Territory buttons
2. **View Information**: State details appear in the info banner
3. **Filter Regions**: Use the 4×4 grid to focus on specific areas
4. **Run Campaigns**: Click the lightning button (⚡) to invest in policies
5. **Track Progress**: Monitor projected seats in the top progress bar

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

**Latest Version**: Player Info UI Overhaul (candidate/party icons, name, dynamic funds)  
**Last Updated**: July 13, 2025  
**Repository**: pradhanmantrielectionsgame.github.io
