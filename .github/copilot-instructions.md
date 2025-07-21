# Copilot Agent Unified Workflow Instructions

## Overview
## Project-Specific Guidelines

### Architecture Constraints
- **File Size Limit**: Keep all JS files under 500 lines
- **Module Load Order**: Maintain critical script loading sequence
- **Mobile-First**: All UI elements must be touch-friendly (min 44px targets)
- **Configuration-Driven**: Use `game-config.json` for all configurable values

### Key Patterns
- **Global Function Exports**: Use `window.functionName = functionName` pattern
- **Dual-Player Input**: Support normal click (Player 1) and Shift+Click (Player 2)
- **Data Flow**: All data flows through `config-manager.js` → individual modules
- **State Management**: Use centralized state management through designated managers

### Critical Integration Points
- **Phase System**: Timed phase system with automatic progression
- **Map-Data Sync**: SVG map IDs must match `states_data.json` `SvgId` fields
- **Audio System**: Centrally managed through `config-manager.js`

## Communication Protocol

### During Each Step
- **Clear Communication**: Explain what you're doing and why
- **Progress Updates**: Keep user informed of progress
- **Ask Questions**: Don't assume - ask for clarification when needed
- **Present Options**: Offer alternatives when multiple approaches exist

### Error Handling
- **Transparent Reporting**: Clearly report any issues encountered
- **Solution Proposals**: Always propose solutions, not just problems
- **Fallback Plans**: Have backup approaches ready

### User Interaction Points
- **Step 1**: Confirm requirements and scope
- **Step 2**: Get approval for technical plan
- **Step 4**: User validation and feedback
- **Step 5**: User review before commit
- **Step 6**: User review of documentation updates

## VS Code + GitHub Copilot Integration

### Workflow Implementation
This workflow is designed to work seamlessly with VS Code and GitHub Copilot:

1. **Interactive Chat**: Use Copilot Chat for steps 1-2 (ideation and planning)
2. **Code Generation**: Use Copilot inline suggestions during step 3 (execution)
3. **Testing Tools**: Use VS Code's integrated terminal and debugging for step 4
4. **Git Integration**: Use VS Code's built-in Git tools for step 5 (commit)
5. **Documentation**: Use Copilot to assist with documentation in step 6

### Best Practices
- **Checkpoint Conversations**: Save conversation state at each step
- **Incremental Commits**: Make small, logical commits during execution
- **Branch Management**: Use feature branches for all development
- **Code Review**: Use GitHub's PR review process before merging

### Environment Details
- User is running Windows 10, VS Code 1.78.2, Node.js 18.16.0
- Use PowerShell for terminal commands
- For testing, use the integrated terminal in VS Code or run a python -m http.server so user can test things locally

## Debug Commands Available
```javascript
// Phase system testing
quickStartGame()           // Restart game
testSkipPhase(5)          // Skip to phase 5
getGameStatus()           // Current game state
debugPhaseSystem()        // Phase system debug info

// Data inspection
getStatesData()           // All state data
getGameConfig()           // Current configuration
getPlayerData('player1')  // Player state
```

---

**This workflow must be followed for every feature request. The Agent should not skip steps or deviate from this process without explicit user approval.**his document establishes a standardized 6-step workflow for all feature development in the Pradhan Mantri Elections Game. **The Agent must follow this workflow strictly for every feature request.**

## Workflow Steps

### 1. IDEATE / COLLECT FEEDBACK
**Agent Role**: Gather requirements and understand user needs
- Ask clarifying questions about the feature one at a time and then wait for user responses. You will thereby collaboratively refine the feature requirements with the user.
- Ensure mobile-first thinking from the start

### 2. PLAN THE CODING STEPS
**Agent Role**: Create detailed technical implementation plan
- Identify affected modules (stay under 500 lines per file)
- Plan JSON file updates in `data/` directory
- Map how feature integrates with existing systems
- Identify potential impacts on existing functionality
- Define step-by-step coding order

### 3. EXECUTE THE CODING STEPS
**Agent Role**: Implement the planned feature following project conventions
- Follow modular architecture (< 500 lines per file)
- Use descriptive, consistent naming
- Ensure touch-friendly UI (min 44px targets)
- Use `game-config.json` for configurable values
- Update relevant JSON files in `data/` directory
- Implement proper error handling and user feedback

### 4. TEST AND DEBUG
**Agent Role**: Validate implementation and fix issues
- Verify all new functionality works
- Test module interactions
- Validate touch interactions and responsiveness
- Ensure existing features aren't broken
- Test error scenarios and edge cases
- **PAUSE HERE** - User steps in for manual validation

### 4.1. ITERATE (REPEAT 2-4 UNTIL USER SATISFIED)
**Agent Role**: Refine implementation based on user feedback
- Understand user concerns and requests
- Modify implementation plan as needed
- Make necessary changes
- Re-test after each iteration

### 5. UPDATE THE DOCUMENTATION
**Agent Role**: Update all relevant documentation
- Update README.md with new features and mechanics
- Add/update inline documentation
- Update configuration documentation for new options
- Update gameplay documentation if needed

### 6. COMMIT THE CODE
**Agent Role**: Finalize and commit changes with proper documentation
- Final review of all changes
- Use clear, descriptive commit messages
- Ensure all files are properly organized
- Confirm all assets are included and paths correct


Live Checklist (Update this document dynamically as you proceed through each step. This section should serve as a scracthpad to take notes)

1  Ideate & Collect Feedback



2  Plan Implementation



3  Execute Code Changes



4  Test, Debug & Iterate



5  Commit & PR



6  Update Documentation

