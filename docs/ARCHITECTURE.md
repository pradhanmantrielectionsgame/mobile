# Project Architecture

This document provides a high-level overview of the Pradhan Mantri Elections Game architecture.

## Overview
- Modular JavaScript architecture (each file < 500 lines)
- Centralized state and config management
- Mobile-first, touch-friendly UI

## Key Modules
- `config-manager.js`: Loads and manages configuration, audio, and global state
- `phase-system.js`: Handles timed game phases and progression
- `state-manager.js`: Manages state-specific data and map sync
- `player-manager.js`: Centralized player state and input
- `ui-manager.js`: UI rendering and event handling
- `data-loader.js`: Loads JSON data (states, config, politicians)

## Data Flow
- All config and data flow from `config-manager.js` to other modules
- State and player data managed centrally, accessed via managers

## Integration Points
- SVG map IDs ↔ `states_data.json` `SvgId`
- Audio events routed through `config-manager.js`

## Extensibility
- Add new features by creating new modules and updating config/JSON as needed
- Follow workflow in `.github/copilot-instructions.md`
