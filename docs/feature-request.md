# Feature Request & Update Checklist

> **How to use this document:**
>
> This checklist is for stepwise feature delivery and tracking. **All coding, architecture, naming, and workflow standards are defined in `.github/copilot-instructions.md`.**
>
> Whenever you are unsure about implementation, style, or project conventions, consult `.github/copilot-instructions.md`.

> You MUST Go through each step in this workflow and update the checklist as eash task is completed
---

## Feature Request Summary

**Rally Token Sound Effect Integration + Rally System Enhancements**

~~Small update to add audio feedback when rally tokens are dropped on the map. User has added `rally_sound.mp3` to the sounds folder and wants this sound to play whenever a rally token is dropped during gameplay.~~ ✅ **COMPLETED**

**New Enhancement Requests:**
1. ✅ **Gold Star Icon for Special Rallies**: Replace current special rally token visual with a gold star icon
2. ✅ **Special Token Rarity System**: Implement 5% probability for receiving special tokens instead of guaranteed 1 per phase
3. ✅ **Rally State Indicators**: Show small icon on states where regular rallies have been conducted

**Technical Implementation Completed:**

**Gold Star Icon (✅ - Enhanced)**
- Updated `index.html` to use ⭐ instead of 🎤 for special rally tokens
- **NEW**: Created full star-shaped styling for special rally token container using CSS clip-path
- Star shape with golden gradient background, enhanced hover effects, and pulsing animation when picked up
- Responsive design maintains star shape on mobile devices

**Special Token Rarity System (✅)**
- Added `specialTokenProbability: 0.05` to `game-config.json`
- Updated `resetRallyTokensForPhase()` to use probability-based distribution
- Added probability configuration to `getRallyConfig()` in config-manager.js
- Special tokens now have only 5% chance per phase instead of guaranteed

**Rally State Indicators (✅)**
- Added `ralliesHeld` array tracking to player data structure
- Created rally indicator functions: `addRallyIndicatorToState()`, `clearAllRallyIndicators()`, `hasRallyIndicator()`
- Added golden circle indicators that appear on states after regular rallies
- Indicators clear at start of each new phase
- Added CSS animations for smooth indicator appearance
- Rally tracking properly integrated with existing rally token system

**Current Status:** All three enhancements implemented and ready for testing.

---

## Live Checklist

- [x] **1. Understand User Intent and Build Context For the problem**
  - [x] Clarify requirements and ask questions if needed.
  - [x] Determine if this is a new feature, update, or bugfix.
  - [x] Check for overlap with existing features.
  - [x] Update the summary above with the latest details.
  - [x] Read the documentation and the codebase so you are better informed
  - [x] Dynamically update the ## Feature Request Summary so you have critical details at your fingertips
- [x] **2. Develop a Plan**
  - [x] Review the existing codebase and documentation for both content and style consistency before planning changes. Refer to `.github/copilot-instructions.md` for all standards and conventions.
  - [x] Outline the approach and steps to implement the request.
  - [x] Identify which files or modules will be affected. If you realize that a large number of changes are required, pause and think of a new approach or provide feedback to the user. Then work with the user to break down the problem into smaller more manageable chunks.
  - [x] Dynamically update the ## Feature Request Summary so you have critical details at your fingertips
- [x] **3. Implement Stepwise**
  - [x] Make changes in small, logical increments.
  - [x] After each step, verify correctness and update the checklist.
  - [x] Avoid introducing new patterns, APIs or structures that don't match the patterns established within the code base.
  - [x] Dynamically update the ## Feature Request Summary so you have critical details at your fingertips
- [x] **4. Test and Validate**
  - [x] Prompt the user manually test the newly implemented feature
  - [x] Check for errors and ensure responsiveness.
  - [x] Dynamically update the ## Feature Request Summary so you have critical details at your fingertips
- [ ] **5. Final Review**
  - [ ] Ensure all steps and standards in `.github/copilot-instructions.md` are followed.
  - [ ] Update documentation appropriately, specifically CHANGELOG.md and README.md
  - [ ] Confirm with the user that the request is fully resolved.
  - [ ] Git commit with appropriate commit message.
