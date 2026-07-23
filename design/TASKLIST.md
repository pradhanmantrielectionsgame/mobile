# Build task list — derived from design/economy-status-map.md (2026-07-23)

Original P0/P1 items were verified against actual code before implementation — 5 of them
(marked below) turned out to already be fixed on this branch; the design doc's bug list was
stale. All 13 unblocked items from this pass are now done. See git history / task log for
per-item details.

## P0 — playtest bugs

- [x] AI opponent never spends funds/acts — **verified already working**, not a real bug (it spends to ~0 Cr every phase, synchronously, which just *looked* broken).
- [x] Starting-position randomizer sometimes gives 200 seats — **verified not reproducible** (stress-tested 3000 seeds, max 187).
- [x] P1%+P2%+Others% doesn't always sum to 100% — **real bug found and fixed** while implementing AI personalities: `engine.js`'s `loseAt()` let a loss vanish when a player held exactly 100% of a state (opp=others=0, e.g. a fully-invested 1-seat UT) and then took a negative agenda effect there. Fixed + regression test added.

## P1 — decided design, now coded

- [x] Touch interaction rework — single tap selects, double tap invests, uniformly across the map and the small-UT button cluster.
- [x] Four feedback animations — circular flash, shake+haptic, red/green floating Cr text.
- [x] Audio wiring — all 8 triggers wired, respects new Sound/Music toggles.
- [x] Map state color-by-popularity — margin-based P1↔neutral↔P2 spectrum.
- [x] Agenda effect proration — verified already correct (`agendaTapDelta` in engine.js).
- [x] Seat-conversion rounding — verified already using largest-remainder apportionment.
- [x] Hung parliament resolution — verified already correct (loss vs. AI, this build is always vs-AI).

## P2 — balance passes

- [x] Audit remaining net-negative policies for accidental tag cancellation — done. Fixed Uniform Civil Code (−9.6→+14.0) and partially fixed Indigenous Rights (−12.1→−2.5), both the same accidental same-state-cancellation bug as pre-fix National Defense. Confirmed Land Reforms, Public Sector, Caste Reservation, Agricultural Reforms, Secularism as real polarization, not bugs. New separate finding: Public Sector's tag *directions* look inverted from real-world PSU politics — flagged, not fixed (needs a human call, not an overlap fix). See design/economy-status-map.md's "Remaining net-negative audit."
- [ ] 13 of 20 special powers still need real magnitude numbers — **not attempted**, needs balance/design judgment calls beyond this pass's scope.
- [ ] Per-region policy magnitude tuning pass (the 12/8/4 shared-tier defaults) — **not attempted**, same reason.
- [ ] Two-active-player seat ceiling unmodeled — **not attempted**, needs an adversarial-simulation harness built first.

## P3 — features

- [x] PWA infrastructure — manifest.json + minimal cache-first service worker. Icon PNGs were blocked (no asset creation done); used a generated square SVG icon instead, which manifest.json supports directly, so this didn't stay blocked after all.
- [x] AI difficulty/personality variety — 4 profiles (aggressive-investor, policy-rusher, rally-spammer, group-bonus-rusher), randomly picked per match.
- [x] Options/settings menu — Sound/Music toggles, Pause/Resume, Help text, New Game.
- [ ] Secondary/non-win-condition goals — not attempted, was explicitly out of scope for this pass (low priority, no one asked).

## Still genuinely blocked / needs a decision

- 13 special powers' magnitudes and the per-region tuning pass — design judgment calls, not code.
- Two-active-player seat ceiling — needs a simulation harness built.
- PWA icon PNGs (real image assets, not the placeholder SVG).
- Public Sector's tag-direction question raised by this session's policy audit.
