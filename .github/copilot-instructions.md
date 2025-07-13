
# Copilot Instructions for Pradhan Mantri Elections Game (Mobile Version)

## Workflow Compliance

**For all feature requests and updates, the agent must strictly follow the workflow steps outlined in `../Feature Request.md` in addition to the standards and conventions in this file.**


## Project Overview

This is a modular, browser-based political simulation game focused on Indian elections, optimized for mobile devices. The codebase is organized for maintainability, scalability, and mobile-first responsive design.

## Architecture & Major Components

- **Entry Point:** `index.html` loads the game UI and scripts.
- **Core Logic:**
  - `app.js`: Main application logic, UI interactions, and event handling.
  - `game-data.js`: Manages game state, calculations, and data loading.
  - `campaign-system.js`: Handles campaign mechanics, modals, and investment logic.
- **Data Files:** All game data is in `data/` as JSON (`states_data.json`, `policy-tags.json`, `politicians-data.json`).
- **Assets:** SVGs and images in `assets/`, audio in `sounds/`.
- **Styling:** `styles.css` implements a mobile-first, touch-friendly UI using CSS Grid and Flexbox.

## Key Patterns & Conventions

- **File Size:** All JS files are kept under 500 lines for readability and modularity.
- **Naming:** Use descriptive, consistent names for functions, variables, and files (e.g., `campaign-system.js` for campaign logic).
- **Data Flow:** Data is loaded via Fetch API from JSON files; state is managed in-memory in JS modules.
- **UI Updates:** DOM manipulation is handled directly in JS, with clear separation between data and presentation logic.
- **Mobile Responsiveness:** All UI elements are designed for touch (min 44px targets), no horizontal scrolling, and adaptive layouts.
- **Player Actions:** Support for dual-player input (normal click = Player 1, Shift+Click = Player 2) is implemented in campaign logic.

## Developer Workflows

- **Quick Start:** Open `index.html` in a browser—no build step required.
- **Debugging:** Use browser dev tools; all logic is client-side and modularized for easy inspection.
- **Testing:** Manual testing on mobile devices is recommended after changes.
- **Adding Features:** Place new logic in a separate JS file if it exceeds 500 lines; update documentation as needed.
- **Documentation:** Update `README.md` with any significant changes to features, mechanics, or data structures.
- **Version Control:** Use clear, descriptive commit messages that reflect the changes made, following the checklist in `../Feature Request.md`.
- **Code Reviews:** Ensure all changes are reviewed against the checklist in `../Feature Request.md` before merging.
- **Environment:** No external dependencies or build tools; all assets are local and referenced directly in HTML/JS. I'm running powershell on Windows, so use powershell commands for any file operations.

## Integration & External Dependencies

- **No external build tools or frameworks**—all dependencies are local assets and standard browser APIs.
- **SVG and image assets** are referenced directly in HTML/JS for map and party visuals.

## Examples

- To add a new policy: Update `data/policy-tags.json` and ensure UI logic in `campaign-system.js` reflects the new entry.
- To modify state data: Edit `data/states_data.json` and verify changes in the map and info banners.


## Reference Files

- `README.md`: Full project and gameplay documentation.
- `app.js`, `game-data.js`, `campaign-system.js`: Core logic modules.
- `data/`: All game data.
- `assets/`, `sounds/`: Visual and audio assets.
- `../Feature Request.md`: **Stepwise workflow for all feature requests and updates (must be strictly followed).**

---

**Keep code modular, mobile-first, and under 500 lines per file. Update documentation with any significant changes.**
