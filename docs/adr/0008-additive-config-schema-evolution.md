# ADR-0008: Additive Config Schema Evolution (Backward Compatibility Strategy)

## Status
Accepted

## Context

The mobile game engine requires several economy constants that differ from the legacy desktop app's values (e.g., rally-token boost 5% vs. desktop's 4%, player refresh 1,000 Cr/phase vs. desktop's 200 Cr/phase). Both the desktop app and the mobile build need to read `data/game-config.json` independently.

The legacy desktop build (`js/config-manager.js`, `js/data-loader.js`) reads the JSON via hardcoded property names with **no fallback defaults**:
```javascript
config.investmentSystem.baseCostPerSeat
config.rallySystem.regularTokenBoost
config.playerSettings.startingFunds
// ... etc. Missing or renamed keys silently become undefined/NaN
```

The question: should we restructure `game-config.json` to cleanly represent the decided design numbers, or preserve backward compatibility with the legacy desktop build's key names?

## Decision

**Extend `game-config.json` additively with a new top-level `mobileEconomy` namespace containing all mobile-specific constants; leave all existing legacy keys untouched.**

Rationale:
- **No silent breakage of the legacy build** — desktop reads its existing `investmentSystem`, `rallySystem`, `playerSettings` keys as before and continues to work (even though it's documented as superseded by Booth Ink)
- **Explicit namespace isolation** — mobile code reads from `config.mobileEconomy.*`, making the distinction clear and removing any ambiguity about which build should read which values
- **Minimal total change** — one new namespace in one JSON file, vs. restructuring the whole file and updating every legacy consumer (out of scope)
- **Straightforward to audit** — any future build (Capacitor wrapper, test harness, etc.) can clearly see that mobile uses a separate set of values, not accidentally inheriting a drifted desktop value

Reverse approach rejected:
- **Full restructure + update all legacy consumers**: Would require rewriting `js/config-manager.js` and every module that reads it, explicitly accepting that the legacy desktop build breaks — out of scope for this session
- **Single-namespace compromise**: Tempting but fragile — a future PR might reasonably restructure one set of keys to match decided design, not realizing it silently breaks the other build

## Consequences

**Positive:**
- Both builds remain independently functional with no cross-contamination risk
- New mobile-specific values are clearly namespaced and discoverable
- Future schema changes can preserve backward compatibility by continuing the additive pattern
- Easier debugging — "which build reads which key" is always clear

**Negative:**
- `game-config.json` now carries two parallel sets of economy values (legacy and mobile), some of which contradict each other
- Maintenance burden: any future economy rebalancing must decide which set to update (both, or only one?)
- Schema is not "clean" (has dead code from legacy, similar to other technical debt in the codebase)

**Later work implied:**
- When the legacy desktop build is formally deprecated/removed, the old keys can be deleted in a cleanup pass
- The `mobileEconomy` namespace can be promoted to the root level at that point if desired
- Consider documenting which keys apply to which build in `data/game-config.json`'s own header comment
