# PradhanMantri Elections Game - Mobile UI Design Documentation

## Overview
This document describes the mobile-first design elements and layout for the PradhanMantri Elections Game. The design prioritizes mobile usability while scaling effectively to larger viewports with a clean, modern interface focused on essential game elements.

## Layout Structure

### 4-Banner System with Floating Elements
The game uses a streamlined 4-banner layout with a floating timer overlay to provide essential game information and controls while keeping the camera notch area clear on modern smartphones and maximizing map space.

#### Banner 1: Camera Notch Area
- **Purpose**: Reserved space for smartphone camera notch and status bar
- **Height**: 35px
- **Background**: Transparent
- **Content**: Intentionally empty
- **Z-index**: 10 (highest priority)
- **Positioning**: Fixed, top: 0

#### Banner 2: Player Info & Stats
- **Purpose**: Display player fund comparison
- **Height**: 42px
- **Background**: Dark panel (`--panel: #1e2238`)
- **Positioning**: Fixed, top: 35px
- **Z-index**: 9

**Content Layout:**
- **Left Section**: Player 1 avatar (green) + funds display
- **Right Section**: Player 2 funds + avatar (red)
- **Clean Focus**: Timer moved to separate floating element for better space utilization

**Elements:**
- Player avatars: 24px circular indicators
- Funds display: Currency format with "M" suffix (e.g., "₹1600M")

#### Banner 3: States Info & Menu
- **Purpose**: Display selected state information and provide access to game options
- **Height**: 32px
- **Background**: Secondary dark (`#262a45`)
- **Positioning**: Fixed, top: 77px (35px + 42px)
- **Z-index**: 8

**Content:**
- **Left Section**: State name and statistics (Seats, P1%, P2%, Others%)
- **Right Section**: Menu button (☰) for game options
- Text overflow handling with ellipsis
- Updates dynamically based on user interaction

#### Banner 4: State Groups (Bottom) - 4×4 Grid Layout
- **Purpose**: Quick access to 16 regional state groupings and filters
- **Height**: 80px
- **Background**: Darker panel (`#2a3048`)
- **Positioning**: Fixed, bottom: 0
- **Z-index**: 8

**Content:**
- **Grid Layout**: 4×4 grid (16 buttons total) for optimal mobile usage
- **State Groups**:
  - Row 1: All, North, South, East
  - Row 2: West, Central, Northeast, Hills
  - Row 3: Coastal, Urban, Rural, Industrial
  - Row 4: Agricultural, Tribal, Metro, Border
- **No Horizontal Scrolling**: All options always visible
- **Touch-Friendly**: Larger buttons suitable for mobile interaction
- Interactive selection with active states and hover effects

#### Floating Timer Overlay
- **Purpose**: Display game phase and countdown timer
- **Position**: Floating overlay in top-right of map area
- **Background**: Semi-transparent glass effect with backdrop blur
- **Z-index**: 12 (above map content)

**Features:**
- **Modern Design**: Glass morphism effect with backdrop-filter
- **Non-Intrusive**: Floats above map without blocking interaction
- **Responsive**: Scales with viewport size
- **Format**: "Phase X/8 | MM:SS"
- **Box Shadow**: Subtle elevation for depth

### Main Content Area

#### Map Container
- **Positioning**: Absolute, constrained between top banners and bottom state groups
- **Top Offset**: 109px (35px + 42px + 32px)
- **Bottom Offset**: 80px (state groups banner only)
- **Dimensions**: Maximized viewport space for better map interaction
- **Background**: Dark blue (`#21263d`)
- **Border**: 3px solid dark border
- **Content**: SVG map of India with interactive elements

#### Action Button (Enhanced)
- **Type**: Floating Action Button (FAB)
- **Size**: 56px × 56px
- **Position**: Fixed, positioned above state groups banner (88px from bottom)
- **Background**: Accent color (`--accent: #3b40bd`)
- **Icon**: Lightning bolt (⚡)
- **Purpose**: Campaigns & Actions (replaces removed campaigns banner)
- **Enhanced Features**: 
  - Hover effects with scale and glow
  - Primary access point for campaign selection
  - Updated tooltip: "Campaigns & Actions"

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
    --state-groups-banner-height: 80px; /* State groups banner (4x4 grid) */
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

### State Groups Navigation (4×4 Grid)
- **Purpose**: Quick filtering and regional focus without scrolling
- **Layout**: 4×4 grid ensures all 16 options are always visible
- **Interaction**: Click to select different regional groupings
- **Visual Feedback**: Active state highlighting with accent color, hover effects
- **Mobile Optimized**: No horizontal scrolling required, touch-friendly sizing
- **Responsive**: Button text scales appropriately for different screen sizes

### Campaign Selection (Via Action Button)
- **Purpose**: Strategic campaign type selection
- **Trigger**: Action button click opens campaign options
- **Options**: Rally, TV Ads, Social Media, Door-to-Door, Print Media, Radio Ads
- **Implementation**: Modal or menu system (placeholder alert in current version)
- **Design Philosophy**: Consolidated into action button to maximize map space

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

### Action Button (Enhanced Campaign Access)
- **Hover/Focus**: Scale animation (1.05x) and enhanced glow effect
- **Click**: Shows campaign menu options (placeholder alert for now)
- **Position**: Floating above state groups for easy thumb access
- **Purpose**: Primary access point for all campaign actions

## Technical Specifications

### Responsive Breakpoints
- Mobile: 0-767px
- Tablet: 768px-1023px
- Desktop: 1024px-1439px
- Large Desktop: 1440px+

### Z-Index Hierarchy
1. Options modal: z-index 50 (highest)
2. Action button: z-index 15
3. Floating timer: z-index 12
4. Camera notch banner: z-index 10
5. Player stats banner: z-index 9
6. States info banner: z-index 8
7. State groups banner: z-index 8

### Layout Calculations
- Total top banners height: 109px (35px + 42px + 32px)
- Bottom banner height: 80px (state groups only)
- Map container constraints: top: 109px, bottom: 80px
- Action button position: 88px from bottom (above state groups)
- Timer position: 12px from top of map area, 20px from right
- Viewport utilization: Maximized map space with essential UI elements

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
- State group selection handlers (4×4 grid)
- Campaign functionality consolidated into action button
- Floating timer overlay management

## Accessibility Features

### Visual Hierarchy
- Clear contrast ratios between background and text
- Consistent spacing and sizing
- Logical tab order for keyboard navigation

### Mobile Usability
- Touch-friendly button sizes (state groups 4×4 grid, menu buttons)
- Readable font sizes across all viewport sizes
- Safe area consideration for modern smartphones
- State groups positioning avoids gesture areas
- Modal accessibility with backdrop and close button interactions
- No horizontal scrolling required for essential functions
- Floating timer doesn't interfere with map interaction
- Action button positioned for comfortable thumb access

## Future Enhancements

### Planned Features
1. **Animation System**: Smooth transitions between states and banner updates
2. **Theme Variations**: Light mode support with updated color scheme
3. **Advanced Interactions**: Multi-touch gestures for map navigation
4. **Enhanced Campaign System**: Modal/drawer interface for campaign selection
5. **State Group Filtering**: Dynamic map filtering based on selected groups
6. **Advanced Timer Features**: Pause, speed controls, phase transitions
7. **Accessibility**: Screen reader support and high contrast mode
8. **Performance**: SVG optimization and lazy loading for better mobile performance

### Integration Points
- Real-time game state management with banner synchronization
- Multiplayer synchronization across all UI components
- Audio/visual feedback system for user interactions
- Save/load game functionality with persistent UI state
- Campaign strategy integration via action button interface
- State group filtering integration with game logic
- Timer synchronization with game phases and events

---

**Version**: Mobile UI Overhaul - 4-Banner System with Floating Timer  
**Last Updated**: July 12, 2025  
**File**: svg-test.html  
**Repository**: pradhanmantrielectionsgame.github.io  
**Recent Changes**: Redesigned state groups as 4×4 grid, removed campaigns banner, added floating timer overlay, enhanced action button for campaign access

## Major UI Changes in This Version

### State Groups Banner Redesign
- **Before**: Horizontal scrolling layout with 16 chips
- **After**: 4×4 grid layout with all options always visible
- **Benefits**: No scrolling required, better mobile usability, cleaner layout

### Campaigns Banner Removal
- **Before**: Dedicated 100px tall campaigns banner at bottom
- **After**: Campaigns accessed via enhanced action button
- **Benefits**: More map space, cleaner interface, consolidated actions

### Floating Timer Implementation
- **Before**: Timer in center of player stats banner
- **After**: Floating overlay in top-right of map area
- **Benefits**: Cleaner player stats section, non-intrusive timer placement, modern glass effect

### Enhanced Action Button
- **Before**: Basic action button with simple functionality
- **After**: Primary campaigns access point with hover effects
- **Benefits**: Consolidated campaign access, better visual feedback, improved positioning
