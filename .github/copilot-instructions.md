# Copilot Agent Unified Workflow Instructions

---
**IMPORTANT:**
- Always refer to the documentation in the `docs/` directory for project conventions, architecture, and gameplay details.
- For all feature requests, rigorously follow the process in `docs/feature-request.md`.
- Use `docs/feature-request.md` as a live scratchpad for each new feature request: document your thought process, planning, and progress directly in that file as you work.
- When in doubt, consult and reference the documentation in your responses and planning.
---

## Overview


## Project-Specific Guidelines

### Architecture Constraints
- File Size Limit: Keep all files under 500 lines. Refactor if needed.
- Module Load Order: Maintain critical script loading sequence.
- Mobile-First: All UI elements must be touch-friendly (min 30px targets).
- Configuration-Driven: Use `game-config.json` for all configurable values.

### Key Patterns
- Global Function Exports: Use `window.functionName = functionName` pattern.
- Dual-Player Input: Support normal click (Player 1) and Shift+Click (Player 2). Note: Player 2 is a temporary solution; eventually, a separate AI player will be implemented.
- Data Flow: All data flows through `config-manager.js` → individual modules.
- State Management: Use centralized state management through designated managers.

### Critical Integration Points
- Phase System: Timed phase system with automatic progression.
- Map-Data Sync: SVG map IDs must match `states_data.json` `SvgId` fields.
- Audio System: Centrally managed through `config-manager.js`.

## Communication Protocol

### Workflow Steps
- At each step, check if relevant documentation should be referenced.
- For feature requests, follow `docs/feature-request.md` without exception and use it as a live scratchpad.

### Error Handling
- Transparent reporting of issues.
- Always propose solutions and fallback plans.

### User Interaction Points
- Step 1: Confirm requirements and scope.
- Step 2: Get approval for technical plan.
- Step 4: User validation and feedback.
- Step 5: User review before commit.
- Step 6: User review of documentation updates.

## VS Code + GitHub Copilot Integration

### Workflow Implementation
- Use Copilot Chat for ideation and planning.
- Use Copilot inline suggestions for code generation.
- Use VS Code’s integrated terminal and debugging for testing.
- Use Git tools for commits and PR review.
- Use Copilot for documentation.

### Best Practices
- Save conversation state at each step.
- Make small, logical commits.
- Use feature branches.
- Use PR review before merging.

### Environment Details
- Use PowerShell for terminal commands.
- For testing, use the integrated terminal or `python -m http.server`.





