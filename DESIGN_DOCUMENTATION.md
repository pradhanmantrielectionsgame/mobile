# PradhanMantri Elections Game - Mobile UI Design Documentation

## Overview
This document describes the mobile-first design elements and layout for the PradhanMantri Elections Game. The design prioritizes mobile usability while scaling effectively to larger viewports.

## Layout Structure

### 3-Banner System
The game uses a fixed 3-banner layout at the top of the screen to provide essential game information while keeping the camera notch area clear on modern smartphones.

#### Banner 1: Camera Notch Area
- **Purpose**: Reserved space for smartphone camera notch and status bar
- **Height**: 40px
- **Background**: Transparent
- **Content**: Intentionally empty
- **Z-index**: 10 (highest priority)
- **Positioning**: Fixed, top: 0

#### Banner 2: Player Info & Game Stats
- **Purpose**: Display core game information and player status
- **Height**: 48px
- **Background**: Dark panel (`--panel: #1e2238`)
- **Positioning**: Fixed, top: 40px
- **Z-index**: 9

**Content Layout:**
- **Left Section**: Player 1 avatar + funds display
- **Center Section**: Game timer and phase indicator
- **Right Section**: Player 2 funds + avatar

**Elements:**
- Player avatars: 24px circular indicators (green for P1, red for P2)
- Funds display: Currency format with "M" suffix (e.g., "₹1600M")
- Timer pill: Rounded background showing "Phase X/8 | MM:SS"

#### Banner 3: States Info
- **Purpose**: Display selected state information and statistics
- **Height**: 36px
- **Background**: Secondary dark (`#262a45`)
- **Positioning**: Fixed, top: 88px (40px + 48px)
- **Z-index**: 8

**Content:**
- State name (bold, left-aligned)
- State statistics: Seats, Population, Last Winner
- Text overflow handling with ellipsis
- Updates dynamically based on user interaction

### Main Content Area

#### Map Container
- **Positioning**: Absolute, top: 124px (total banner height)
- **Dimensions**: Fills remaining viewport space
- **Background**: Dark blue (`#21263d`)
- **Border**: 3px solid dark border
- **Content**: SVG map of India with interactive elements

#### Action Button
- **Type**: Floating Action Button (FAB)
- **Size**: 56px × 56px
- **Position**: Fixed, bottom-right (20px margins)
- **Background**: Accent color (`--accent: #3b40bd`)
- **Icon**: Lightning bolt (⚡)
- **Purpose**: Quick access to game actions

## Color Scheme

### CSS Custom Properties
```css
:root {
    --bg: #0f1125;        /* Primary background - dark navy */
    --panel: #1e2238;     /* Panel background - lighter navy */
    --accent: #3b40bd;    /* Accent color - blue */
    --text: #fff;         /* Primary text - white */
    --banner-height: 40px; /* Standard banner height */
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

### Dynamic Updates
- **Timer**: Updates every 10 seconds with random phase/time
- **State Info**: Updates immediately on map interaction
- **Funds**: Static display (ready for game logic integration)

### Action Button
- **Hover/Focus**: Standard button interactions
- **Click**: Shows alert (placeholder for future functionality)

## Technical Specifications

### Responsive Breakpoints
- Mobile: 0-767px
- Tablet: 768px-1023px
- Desktop: 1024px-1439px
- Large Desktop: 1440px+

### Z-Index Hierarchy
1. Camera notch banner: z-index 10
2. Player stats banner: z-index 9
3. States info banner: z-index 8
4. Action button: z-index 15

### Layout Calculations
- Total banner height: 124px (40px + 48px + 36px)
- Map container top offset: 124px
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

## Accessibility Features

### Visual Hierarchy
- Clear contrast ratios between background and text
- Consistent spacing and sizing
- Logical tab order for keyboard navigation

### Mobile Usability
- Touch-friendly button sizes (56px FAB meets 44px minimum)
- Readable font sizes across all viewport sizes
- Safe area consideration for modern smartphones

## Future Enhancements

### Planned Features
1. **Animation System**: Smooth transitions between states
2. **Theme Variations**: Light mode support
3. **Advanced Interactions**: Multi-touch gestures for map navigation
4. **Accessibility**: Screen reader support and high contrast mode
5. **Performance**: SVG optimization and lazy loading

### Integration Points
- Real-time game state management
- Multiplayer synchronization
- Audio/visual feedback system
- Save/load game functionality

---

**Version**: Mobile UI Overhaul  
**Last Updated**: July 12, 2025  
**File**: svg-test.html  
**Repository**: pradhanmantrielectionsgame.github.io
