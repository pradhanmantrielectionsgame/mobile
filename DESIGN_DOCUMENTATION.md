# PradhanMantri Elections Game - Mobile UI Design Documentation

## Overview
This document describes the mobile-first design elements and layout for the PradhanMantri Elections Game. The design prioritizes mobile usability while scaling effectively to larger viewports with a clean, modern interface focused on essential game elements.

## Layout Structure

### 4-Banner System with Floating Elements
The game uses a streamlined 4-banner layout with a floating timer overlay to provide essential game information and controls while keeping the camera notch area clear on modern smartphones and maximizing map space.

#### Banner 1: Projected Seats Progress Bar
- **Purpose**: Display real-time projected seat distribution across P1, Others, and P2
- **Height**: 35px
- **Background**: Dark panel (`#1a1f36`)
- **Positioning**: Fixed, top: 0
- **Z-index**: 10 (highest priority)

**Content:**
- **Progress Bar**: Full-width color-coded seat projection using flexbox layout
  - **P1 Segment**: Green gradient (`#4eb85a` to `#5ac461`)
  - **Others Segment**: Gray gradient (`#6b7280` to `#8b9bb5`)
  - **P2 Segment**: Red gradient (`#e65c5c` to `#f56565`)
- **Smart Labels**: Adaptive text display within segments
  - **>20% width**: Shows "P1: 123" format
  - **8-20% width**: Shows just number "123"
  - **<8% width**: No text (too small to read)
- **Real-time Updates**: Automatically recalculates based on state popularity changes
- **Responsive**: Font size scales down on small screens (≤320px)

**Features:**
- Smooth 0.3s transitions when seat projections change
- Single label system (no duplicate text)
- Enhanced text shadow for better readability on gradients
- Winner-takes-all calculation: highest percentage in each state wins all seats
- Updates every 15 seconds with popularity simulation
- Clean flexbox implementation prevents layout issues

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

#### Banner 3: States Info & Menu (Enhanced Two-Row Layout)
- **Purpose**: Display selected state information and provide access to game options
- **Height**: 32px (38px on screens ≤320px for better two-row accommodation)
- **Background**: Secondary dark (`#262a45`)
- **Positioning**: Fixed, top: 77px (35px + 42px)
- **Z-index**: 8

**Enhanced Layout Features:**
- **Two-Row Structure**: State name on top row, statistics on bottom row for optimal space utilization
- **Flexible Design**: Adapts to narrow viewports without truncating information
- **No Text Truncation**: All state information remains visible across all screen sizes
- **Responsive Typography**: Font sizes scale appropriately for different viewports

**Content:**
- **Top Row**: State name with ellipsis handling for extremely long names
- **Bottom Row**: Statistics (Seats, P1%, P2%, Others%) with flexible wrapping
- **Right Section**: Menu button (☰) for game options
- **Smart Spacing**: 1px gap between rows for clean separation

**Responsive Behavior:**
- **≤320px**: Height increases to 38px, font sizes reduce to 12px/11px
- **≥768px**: Font sizes increase to 15px/14px for better readability
- **≥1024px**: Font sizes scale to 18px/16px for desktop viewing
- **≥1440px**: Maximum font sizes of 20px/18px for large displays

**Technical Implementation:**
- **CSS Grid**: 1fr auto layout for state info and menu sections
- **Flexbox**: Column direction for two-row state information layout
- **Text Overflow**: Ellipsis for state names that exceed container width
- **Flex Wrap**: Statistics wrap naturally on very narrow screens
- **Non-Blocking**: Menu button always remains accessible

#### Banner 4: State Groups (Bottom) - 4×4 Grid Layout with Data-Driven Filtering
- **Purpose**: Quick access to 16 data-driven state groupings and filters based on `states_data.json`
- **Height**: 80px
- **Background**: Darker panel (`#2a3048`)
- **Positioning**: Fixed, bottom: 0
- **Z-index**: 8

**Enhanced Content:**
- **Grid Layout**: 4×4 grid (16 buttons total) for optimal mobile usage
- **Data-Driven Categories**: Based on exact boolean flags from `states_data.json`:
  - **Row 1**: All, Union territory, Coastal india, Northeast india
  - **Row 2**: South india, Hindi heartland, Agricultural region, Border lands
  - **Row 3**: Pilgrimage, Industrial corridor, Manufacturing, Education
  - **Row 4**: Tribal lands, Travel and tourism, Natural resources, Minority areas
- **No Horizontal Scrolling**: All options always visible
- **Touch-Friendly**: Larger buttons suitable for mobile interaction

**Advanced Filtering Features:**
- **Map Highlighting**: Selected category highlights matching states/UTs with green glow and borders
- **UT Button Integration**: Union Territory buttons light up when their category is selected
- **Smart Dimming**: Non-matching states become semi-transparent (opacity: 0.3)
- **Group Statistics**: State info banner shows category statistics (total count, seats, states vs UTs)
- **Console Logging**: Detailed logging of matching states for debugging

**Exact Category Mapping (JSON Field → Button Label):**
- `UnionTerritory` → "Union territory"
- `CoastalIndia` → "Coastal india"
- `NortheastIndia` → "Northeast india"
- `SouthIndia` → "South india"
- `HindiHeartland` → "Hindi heartland"
- `AgriculturalRegion` → "Agricultural region"
- `BorderLands` → "Border lands"
- `Pilgrimage` → "Pilgrimage"
- `IndustrialCorridor` → "Industrial corridor"
- `Manufacturing` → "Manufacturing"
- `Education` → "Education"
- `TribalLands` → "Tribal lands"
- `TravelAndTourism` → "Travel and tourism"
- `NaturalResources` → "Natural resources"
- `MinorityAreas` → "Minority areas"
- **Special**: "All" (resets filters, shows complete statistics)

**Interactive Selection**: 
- Click to select different category groupings with active state highlighting
- Visual feedback with accent color, hover effects, and real-time filtering
- Responsive button text scaling for different screen sizes
- Integration with Union Territory quick access system
- Direct boolean field matching ensures accurate data-driven filtering

#### Floating Timer Overlay with Union Territories
- **Purpose**: Display game phase, countdown timer, and Union Territory quick access
- **Position**: Floating overlay in top-right of map area
- **Background**: Semi-transparent glass effect with backdrop blur
- **Z-index**: 12 (above map content)
- **Layout**: 4×2 CSS Grid structure

**Structure:**
- **Top Row**: Timer display spanning full width (grid-column: 1 / -1)
- **Bottom 3 Rows**: Union Territories in 2×3 grid layout
  - Row 1: New Delhi | Chandigarh
  - Row 2: DNH | Puducherry  
  - Row 3: Lakshadweep | A&N Islands

**Features:**
- **Modern Design**: Glass morphism effect with backdrop-filter
- **Non-Intrusive**: Floats above map without blocking interaction
- **Responsive**: Scales with viewport size
- **Timer Format**: "Phase X/8 | MM:SS"
- **UT Selection**: Click any UT button to highlight on map and show details
- **Visual Feedback**: Selected UT gets accent styling and map highlighting
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
- **Click/Tap**: Cycles through demo states or select specific states via UT buttons
- **Visual Feedback**: State information updates in Banner 3
- **States Included**: Uttar Pradesh, Maharashtra, Tamil Nadu, West Bengal, Bihar, Karnataka, Gujarat, Rajasthan
- **Union Territory Access**: Direct selection via floating UT buttons for all 6 UTs

### Union Territories Quick Access
- **Purpose**: Direct access to India's 6 Union Territories without map navigation
- **Layout**: Integrated into floating timer container as 3×2 grid
- **UTs Included**: 
  - New Delhi (INDL)
  - Chandigarh (INCH)
  - DNH - Dadra Nagar Haveli and Daman and Diu (INDH)
  - Puducherry (INPY)
  - Lakshadweep (INLD)
  - A&N Islands - Andaman & Nicobar Islands (INAN)
- **Interaction**: Click to highlight UT on map and display details
- **Visual Feedback**: Selected button styling with accent color
- **Map Integration**: Highlights selected UT with green glow and border

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
- **Timer**: Updates every 10 seconds with random phase/time in floating container
- **State Info**: Updates immediately on map interaction or UT selection
- **Funds**: Static display (ready for game logic integration)
- **UT Selection**: Real-time map highlighting and info banner updates

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
3. Floating timer with UTs: z-index 12
4. Camera notch banner: z-index 10
5. Player stats banner: z-index 9
6. States info banner: z-index 8
7. State groups banner: z-index 8

### Layout Calculations
- Total top banners height: 109px (35px + 42px + 32px)
- Bottom banner height: 80px (state groups only)
- Map container constraints: top: 109px, bottom: 80px
- Action button position: 88px from bottom (above state groups)
- Floating timer with UTs: 12px from top of map area, 20px from right
- UT container: 4×2 grid (timer + 3 rows of 2 UTs)
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
- Union Territory selection and map highlighting system
- Campaign functionality consolidated into action button
- Floating timer overlay with integrated UT container management

## Accessibility Features

### Visual Hierarchy
- Clear contrast ratios between background and text
- Consistent spacing and sizing
- Logical tab order for keyboard navigation

### Mobile Usability
- Touch-friendly button sizes (state groups 4×4 grid, menu buttons, UT buttons)
- Readable font sizes across all viewport sizes
- Safe area consideration for modern smartphones
- State groups positioning avoids gesture areas
- Modal accessibility with backdrop and close button interactions
- No horizontal scrolling required for essential functions
- Floating timer with UTs doesn't interfere with map interaction
- Action button positioned for comfortable thumb access
- Union Territory buttons sized for touch interaction on all devices

## Future Enhancements

### Planned Features
1. **Animation System**: Smooth transitions between states and banner updates
2. **Theme Variations**: Light mode support with updated color scheme
3. **Advanced Interactions**: Multi-touch gestures for map navigation
4. **Enhanced Campaign System**: Modal/drawer interface for campaign selection
5. **State Group Filtering**: Dynamic map filtering based on selected groups
6. **Advanced Timer Features**: Pause, speed controls, phase transitions
7. **Union Territory Enhancements**: UT-specific campaign strategies and stats
8. **Accessibility**: Screen reader support and high contrast mode
9. **Performance**: SVG optimization and lazy loading for better mobile performance

### Integration Points
- Real-time game state management with banner synchronization
- Multiplayer synchronization across all UI components
- Audio/visual feedback system for user interactions
- Save/load game functionality with persistent UI state
- Campaign strategy integration via action button interface
- State group filtering integration with game logic
- Union Territory data integration with states_data.json
- Timer synchronization with game phases and events
- UT-specific gameplay mechanics and campaign targeting

---

**Version**: Mobile UI Overhaul - 4-Banner System with Projected Seats Display  
**Last Updated**: July 12, 2025  
**File**: svg-test.html  
**Repository**: pradhanmantrielectionsgame.github.io  
**Recent Changes**: Repurposed camera notch banner as projected seats progress bar with real-time election projections, added Union Territories quick access container integrated with floating timer, redesigned state groups as 4×4 grid, removed campaigns banner, enhanced action button for campaign access

## Major UI Changes in This Version

### State Groups Enhancement (NEW)
- **Data-Driven Filtering**: State groups now use exact boolean flags from `states_data.json`
- **Exact Field Mapping**: All 15 JSON boolean fields mapped to sentence-case button labels
- **Enhanced UT Integration**: Union Territory buttons highlight when matching category filters
- **Group Statistics**: State info banner shows real-time category statistics
- **Console Debugging**: Detailed logging of matching states for each category filter

### State Info Banner Two-Row Layout (NEW)
- **Enhanced Readability**: State name and statistics now display in separate rows
- **Responsive Design**: Adapts to narrow viewports without truncating information
- **No Information Loss**: All state details remain visible across all screen sizes
- **Smart Typography**: Font scaling maintains readability on different devices

### Union Territories Integration (ENHANCED)
- **Added**: Integrated UT container with floating timer in 4×2 grid layout
- **Features**: Direct access to all 6 Union Territories with map highlighting
- **Category Integration**: UT buttons light up when category filters match
- **Benefits**: Quick UT selection, no need to search on map, organized layout
- **Design**: Merged with timer for space efficiency and cohesive appearance

### Projected Seats Progress Bar (EXISTING)
- **Real-time Display**: Seat projection display in top banner
- **Features**: Color-coded progress bar showing P1/Others/P2 distribution
- **Algorithm**: Winner-takes-all system based on state popularity percentages
- **Design**: Adaptive labels with smart text sizing based on segment width
- **Benefits**: Immediate visual feedback on election projections, strategic insight
