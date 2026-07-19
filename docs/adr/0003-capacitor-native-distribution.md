# ADR-0003: Capacitor for Native App Distribution (No React Native/Flutter Rewrite)

## Status
Accepted

## Context

The user asked: is the current vanilla HTML/CSS/JS stack (DOM, CSS animations, SVG) appropriate for scaling to iOS and Android app store distribution?

Two approaches emerged:
1. **Rewrite in React Native or Flutter** — true native rendering, requires ~4–8 week rewrite
2. **Wrap existing web app with Capacitor** — carry the existing HTML/CSS/JS to native; minimal changes

## Decision

**Do not rewrite. Use Capacitor to wrap the existing vanilla web app.**

Rationale:
- **Game is DOM/CSS/SVG-heavy** — interactive map (SVG), phase timers (CSS animations), state overlays (HTML). Rewriting to native widgets loses fidelity.
- **Game is turn-based, not real-time** — no native performance requirement (no 60fps animations of complex physics, no high-frequency input loops). A WebView is plenty.
- **Capacitor carries the UI over unchanged** — one codebase, deploy to web, iOS (App Store), and Android (Play Store) with minimal platform-specific code (file I/O, camera, notifications).
- **Rewrite cost is high, risk is high, benefit is zero** — React Native/Flutter do not improve turn-based gameplay, do not fix the SVG map, do not speed up the AI or matchmaking.

Why not a full rewrite:
- Clash Royale's UI works because Clash Royale was designed in a native framework from day 1, not retrofitted. This game's visual system is already optimized for web tech.
- Users do not care whether the app store icon runs WebView or native code — they care that it works, looks good, and launches fast. Capacitor checks all three boxes.

## Consequences

**Positive:**
- Ship to iOS App Store and Google Play Store in <2 weeks of Capacitor setup + build pipeline
- Maintain one codebase (HTML/CSS/JS) for all platforms
- Benefit from web tech (instant iteration, live reload during dev, browser DevTools)
- No rewrite risk or schedule slip

**Negative:**
- WebView performance is slightly lower than native rendering (irrelevant for turn-based)
- App Store review may scrutinize WebView-based apps (but complying is straightforward: privacy policy, terms of service, no dynamic code loading)
- Requires Capacitor + Xcode/Android Studio toolchain (but this is a one-time setup cost)

**Later work implied:**
- Set up Capacitor project in this repo (`npx cap init`)
- Add iOS and Android platforms
- Add App Store + Play Store pipeline (fastlane recommended)
- Clarify privacy policy and terms of service for app stores
