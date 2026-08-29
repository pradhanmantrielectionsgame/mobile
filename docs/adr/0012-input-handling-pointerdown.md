# ADR-0012: Input Handling via pointerdown Instead of click

**Status:** Accepted

**Date:** 2026-08-29

## Context

User reports indicated that double-tapping a state to invest "feels laggy even if they don't appear laggy" — an accurate description of a latency that occurs *before* any rendering begins. All game action handlers were previously bound to the `click` event, which structurally cannot fire until `touchend` (after the player's finger lifts the screen).

A real finger dwells on the screen for 70–120 ms. Every millisecond of that dwell occurs *before* the handler fires.

Measured WebKit event order in a real touch sequence: `pointerdown + 0ms → touchstart + 0ms → pointerup + 0ms → touchend + 0ms → click + 7ms` (the 7 ms is a synthetic tap where press and release happen in the same tick). The sound feedback and visual effects for a tap were therefore gated behind the player's own press duration.

This latency is invisible to standard testing harnesses. Playwright's synthetic taps press and release in the same tick, so they measure zero dwell — a synthetic tap at 7 ms cannot reproduce the 70–120 ms lag a real finger introduces.

Performance investigation ruled out game-engine logic (all hot paths in microseconds) and the in-game tap handler itself (3 ms median / 7 ms max). The upstream lag was the event source itself.

## Decision

Bind all game actions to `pointerdown` instead of `click`, with a deduped `click` fallback (700 ms window) for keyboard activation on native `<button>` elements.

Implemented via a new `fastTap()` helper in `mobile/main.js`.

**Exception:** The politician carousel is deliberately excluded. Its `click` binding is what stops a swipe gesture from firing a card-select action — binding to `pointerdown` would break that interaction.

Applied to:
- Interactive map (state taps)
- Five quick-invest buttons (Delhi, Goa, Kerala, Small UTs, Northeast 8)
- Agenda tray
- Rally/Special Power/Nationwide Rally buttons
- Group chips

## Alternatives Considered

1. **Leave on `click` and optimize rendering further** — rejected, rendering was not the cause.
2. **Bind to `touchstart` instead** — rejected, no mouse or pen support; `pointerdown` is the unified event.
3. **Replace `click` outright with no fallback** — rejected, breaks keyboard activation on real `<button>` elements and is inaccessible.

## Consequences

- All tap-based actions now fire at `pointerdown`, eliminating 70–120 ms of perceived latency.
- `click` fallback preserves keyboard accessibility and real-button behavior.
- Synthetic (Playwright) tap tests cannot measure this class of latency. Real-device testing is required to verify.
- Fast repeated tapping now has a much tighter feedback loop, improving perceived responsiveness.
- The principle is: **structured delays in the event pipeline are invisible to synthetic testing and require real-device measurement.**
