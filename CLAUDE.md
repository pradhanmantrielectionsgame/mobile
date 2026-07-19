# Project Instructions — PradhanMantri Elections Game Mobile

## UI conventions

- Small UTs (Delhi, Chandigarh, Dadra & Nagar Haveli and Daman & Diu, Puducherry, Lakshadweep, Andaman & Nicobar Islands) are never directly tappable on the map — they're too small to hit reliably. Always route their interaction through the existing button-cluster pattern (`union-territories-container` in `index.html`, paired with the timer-pill), not direct map taps. J&K and Ladakh are large enough to tap directly and don't need this treatment.

## Architecture constraints

- Do not rewrite this game in React Native or Flutter for iOS/Android app store distribution. The UI is DOM/CSS/SVG-heavy (interactive map, CSS animations) and the game itself is turn/phase-based with no native-performance requirement, so a native-framework rewrite buys nothing. Wrap the existing vanilla HTML/CSS/JS with Capacitor instead — it carries the current UI over almost unchanged.
