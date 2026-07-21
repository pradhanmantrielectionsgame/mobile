# Project Instructions — PradhanMantri Elections Game Mobile

## UI conventions

- Small UTs (Delhi, Chandigarh, Dadra & Nagar Haveli and Daman & Diu, Puducherry, Lakshadweep, Andaman & Nicobar Islands) are never directly tappable on the map — they're too small to hit reliably. Always route their interaction through the existing button-cluster pattern (`union-territories-container` in `index.html`, paired with the timer-pill), not direct map taps. J&K and Ladakh are large enough to tap directly and don't need this treatment.
- **Booth Ink (`design/prototypes/pme-mobile-sheet.html`) is the committed mobile UI direction** — not `index.html`/`styles.css`, which is the old desktop-ported skin. Reference Booth Ink for any UI/interface work; check which file is actually open/current before assuming the legacy file applies.

## Game design principles

- Avoid click-fest mechanics — cap player actions per phase (a fixed number of moves/commitments) rather than allowing unlimited repeated clicking with diminishing returns. Every action should have real opportunity cost against the others available that phase.

## Architecture constraints

- Do not rewrite this game in React Native or Flutter for iOS/Android app store distribution. The UI is DOM/CSS/SVG-heavy (interactive map, CSS animations) and the game itself is turn/phase-based with no native-performance requirement, so a native-framework rewrite buys nothing. Wrap the existing vanilla HTML/CSS/JS with Capacitor instead — it carries the current UI over almost unchanged.

## Frontend technical rules

- Never rely on CSS Grid shrink-to-fit with `1fr` tracks when a declared pixel/icon size needs to actually hold — the grid container's width goes undefined and the browser silently overrides the item's declared size to fit an accidental viewport computation. Give the grid container an explicit, screen-relative width (e.g. `min(calc(100% - Npx), cap)`) instead. This already caused a real, hard-to-spot sizing bug in a mobile prototype's icon grid.
- Every standalone HTML file (prototype or real game) must declare `<meta charset="UTF-8">` as the very first tag. Claude's Artifact hosting sets the correct charset header automatically, but any other host (a local dev server, GitHub Pages, etc.) may not — without the explicit tag, every emoji, the ₹ symbol, and em dashes render as mojibake.
- When sizing mobile UI chrome (buttons, text, icons) in a prototype meant to represent real device proportions, calibrate against the actual iPhone 14 viewport (390×844, this project's default target) — not against how it looks inside the Claude Artifact viewer. The Artifact viewer wraps pages in its own ~150–200px title-bar chrome, which makes a `flex:1` map region look shorter than it will on a real device, and everything sized to "look right" against that preview reads as too small once viewed full-screen.
- A collapsible tray/panel (`max-height:0; overflow:hidden` to hide, animated open) still occupies its full declared *width* as a flex sibling even while collapsed to zero height — this silently inflates the gap between adjacent elements in the same flex row. Take it out of normal flow with `position:absolute` (anchored to a `position:relative` wrapper around just its own toggle button) instead of relying on collapsed height alone to make it width-neutral.
- For alternating-row hex/brick (honeycomb) layouts, give neighboring rows differing item counts (N, N−1) and center each row independently (`justify-content:center`) — no manual horizontal offset/margin needed. An N-item row and an (N−1)-item row, both centered on the same container width, differ by exactly half a hex+gap pitch, which is the correct honeycomb interlock offset for free.
