# PradhanMantri Elections Game - Mobile UI Design Documentation

## Overview
This document describes the mobile-first design elements and layout for the PradhanMantri Elections Game. The design prioritizes mobile usability while scaling effectively to larger viewports.

## Layout Structure

### 5-Banner System
The game uses a comprehensive 5-banner layout with banners at both the top and bottom of the screen to provide essential game information and controls while keeping the camera notch area clear on modern smartphones.

#### Banner 1: Camera Notch Area
- **Purpose**: Reserved space for smartphone camera notch and status bar
- **Height**: 35px (reduced to accommodate bottom banners)
- **Background**: Transparent
- **Content**: Intentionally empty
- **Z-index**: 10 (highest priority)
- **Positioning**: Fixed, top: 0

#### Banner 2: Player Info & Game Stats
- **Purpose**: Display core game information and player status
- **Height**: 42px (reduced from 48px)
- **Background**: Dark panel (`--panel: #1e2238`)
- **Positioning**: Fixed, top: 35px
- **Z-index**: 9

**Content Layout:**
- **Left Section**: Player 1 avatar + funds display
- **Center Section**: Game timer and phase indicator
- **Right Section**: Player 2 funds + avatar

**Elements:**
- Player avatars: 24px circular indicators (green for P1, red for P2)
- Funds display: Currency format with "M" suffix (e.g., "₹1600M")
- Timer pill: Rounded background showing "Phase X/8 | MM:SS"

#### Banner 3: States Info & Menu
- **Purpose**: Display selected state information and provide access to game options
- **Height**: 32px (reduced from 36px)
- **Background**: Secondary dark (`#262a45`)
- **Positioning**: Fixed, top: 77px (35px + 42px)
- **Z-index**: 8

**Content:**
- **Left Section**: State name and statistics (Seats, Population, Last Winner)
- **Right Section**: Menu button (☰) for game options
- Text overflow handling with ellipsis
- Updates dynamically based on user interaction

#### Banner 4: State Groups (Bottom)
- **Purpose**: Quick access to regional state groupings and filters
- **Height**: 44px
- **Background**: Darker panel (`#2a3048`)
- **Positioning**: Fixed, bottom: 100px (above campaigns banner)
- **Z-index**: 8

**Content:**
- 16 state groupings in horizontally scrollable chips:
  - Geographic: North, South, East, West, Central, Northeast
  - Topographic: Hills, Coastal, Border, Island
  - Economic: Urban, Rural, Industrial, Agricultural
  - Demographic: Tribal, Metro
- Interactive selection with active states
- Smooth horizontal scrolling for overflow

#### Banner 5: Campaigns (Bottom, Primary)
- **Purpose**: Campaign action selection and strategy tools
- **Height**: 100px (taller for better usability)
- **Background**: Darkest panel (`#1a1f35`)
- **Positioning**: Fixed, bottom: 0
- **Z-index**: 8

**Content:**
- 6 campaign cards in 3×2 grid layout:
  1. Rally
  2. TV Ads
  3. Social Media
  4. Door-to-Door
  5. Print Media
  6. Radio Ads
- Interactive selection with visual feedback
- Hover and active states for better UX

### Main Content Area

#### Map Container
- **Positioning**: Absolute, constrained between top and bottom banners
- **Top Offset**: 109px (35px + 42px + 32px)
- **Bottom Offset**: 144px (44px + 100px)
- **Dimensions**: Fills remaining viewport space between banners
- **Background**: Dark blue (`#21263d`)
- **Border**: 3px solid dark border
- **Content**: SVG map of India with interactive elements

#### Action Button
- **Type**: Floating Action Button (FAB)
- **Size**: 56px × 56px
- **Position**: Fixed, positioned above state groups banner (152px from bottom)
- **Background**: Accent color (`--accent: #3b40bd`)
- **Icon**: Lightning bolt (⚡)
- **Purpose**: Quick access to game actions

## Color Scheme

### CSS Custom Properties
```css
:root {
    --bg: #0f1125;                    /* Primary background - dark navy */
    --panel: #1e2238;                 /* Panel background - lighter navy */
    --accent: #3b40bd;                /* Accent color - blue */
    --text: #fff;                     /* Primary text - white */
    --banner-height: 35px;            /* Camera notch banner */
    --player-banner-height: 42px;     /* Player stats banner */
    --states-banner-height: 32px;     /* States info banner */
    --state-groups-banner-height: 44px; /* State groups banner */
    --campaigns-banner-height: 100px;   /* Campaigns banner */
}
```

### Color Usage
- **Primary Background**: Deep navy for main game area
- **Panel Backgrounds**: Lighter navy for banners and UI elements
- **Accent Color**: Blue for interactive elements and CTAs
- **Text**: White for primary content, with opacity variations for hierarchy
- **Player Colors**: Green (#5ac461) for Player 1, Red (#e65c5c) for Player 2

## Typography

### Responsive Font Scaling
The design implements a mobile-first approach with progressive enhancement for larger screens:

#### Mobile (Default - up to 767px)
- Banner text: 14px
- General readability optimized for touch interfaces

#### Tablet (768px - 1023px)
- Banner text: 18px (+29% increase)
- Maintains mobile proportions with improved readability

#### Desktop (1024px - 1439px)
- Player info: 28px (+100% increase)
- Timer: 28px
- States banner: 28px
- State stats: 26px
- Avatars: 36px

#### Large Desktop (1440px+)
- Player info: 34px (+143% increase)
- Timer: 34px with increased padding
- States banner: 34px
- State stats: 32px
- Avatars: 44px

### Font Family
- Primary: Arial, Helvetica, sans-serif
- Fallback system ensures cross-platform compatibility

## Interactive Elements

### Map Interaction
- **Click/Tap**: Cycles through demo states
- **Visual Feedback**: State information updates in Banner 3
- **States Included**: Uttar Pradesh, Maharashtra, Tamil Nadu, West Bengal, Bihar, Karnataka, Gujarat, Rajasthan

### State Groups Navigation
- **Purpose**: Quick filtering and regional focus
- **Interaction**: Click to select different regional groupings
- **Visual Feedback**: Active state highlighting with accent color
- **Scrolling**: Horizontal scroll for overflow groups

### Campaign Selection
- **Purpose**: Strategic campaign type selection
- **Layout**: 6 cards in 3×2 grid
- **Interaction**: Click to select campaign strategy
- **Visual Feedback**: Active card highlighting and hover effects

### Game Options Modal
- **Trigger**: Menu button (☰) in states banner
- **Content**: 7 game option cards:
  - 🆕 New Game
  - 🔊 Toggle Sound
  - 🎵 Toggle Music
  - ⏸️ Pause / Resume
  - ❓ Help
  - 🎲 Random Events
  - 💀 Hard Mode
- **Interaction**: Modal overlay with backdrop dismiss
- **Styling**: Centered modal with close button

### Dynamic Updates
- **Timer**: Updates every 10 seconds with random phase/time
- **State Info**: Updates immediately on map interaction
- **Funds**: Static display (ready for game logic integration)

### Action Button
- **Hover/Focus**: Standard button interactions
- **Click**: Shows alert (placeholder for future functionality)
- **Position**: Floating above state groups for easy access

## Technical Specifications

### Responsive Breakpoints
- Mobile: 0-767px
- Tablet: 768px-1023px
- Desktop: 1024px-1439px
- Large Desktop: 1440px+

### Z-Index Hierarchy
1. Options modal: z-index 50 (highest)
2. Action button: z-index 15
3. Camera notch banner: z-index 10
4. Player stats banner: z-index 9
5. States info banner: z-index 8
6. State groups banner: z-index 8
7. Campaigns banner: z-index 8

### Layout Calculations
- Total top banners height: 109px (35px + 42px + 32px)
- Total bottom banners height: 144px (44px + 100px)
- Map container constraints: top: 109px, bottom: 144px
- Action button position: 152px from bottom (above state groups)
- Viewport utilization: Maximizes remaining space for game content

## Performance Considerations

### CSS Optimizations
- Uses CSS custom properties for consistent theming
- Minimal DOM manipulation
- Hardware-accelerated transforms for smooth animations

### JavaScript
- Async SVG loading with error handling
- Event delegation for efficient interaction handling
- Minimal DOM queries with cached references
- Modal management system for game options
- Campaign and state group selection handlers

## Accessibility Features

### Visual Hierarchy
- Clear contrast ratios between background and text
- Consistent spacing and sizing
- Logical tab order for keyboard navigation

### Mobile Usability
- Touch-friendly button sizes (campaign cards, state groups, menu buttons)
- Readable font sizes across all viewport sizes
- Safe area consideration for modern smartphones
- Bottom banner positioning avoids gesture areas
- Modal accessibility with backdrop and close button interactions

## Future Enhancements

### Planned Features
1. **Animation System**: Smooth transitions between states and banner updates
2. **Theme Variations**: Light mode support with updated color scheme
3. **Advanced Interactions**: Multi-touch gestures for map navigation
4. **Enhanced Campaign System**: More campaign types and strategic depth
5. **State Group Filtering**: Dynamic map filtering based on selected groups
6. **Modal System**: Additional modals for help, settings, and game management
7. **Accessibility**: Screen reader support and high contrast mode
8. **Performance**: SVG optimization and lazy loading for better mobile performance

### Integration Points
- Real-time game state management with banner synchronization
- Multiplayer synchronization across all UI components
- Audio/visual feedback system for user interactions
- Save/load game functionality with persistent UI state
- Campaign strategy integration with map visualization
- State group filtering integration with game logic

---

**Version**: Mobile UI Overhaul - 5-Banner System  
**Last Updated**: July 12, 2025  
**File**: svg-test.html  
**Repository**: pradhanmantrielectionsgame.github.io  
**Recent Changes**: Added bottom banners (state groups & campaigns), game options modal, repositioned action button
