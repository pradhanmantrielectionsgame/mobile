# Viewport / responsive migration plan (not started)

Written 2026-07-25 to think through before committing to an approach — no code changed yet.
Context: `mobile/index.html` (and both prototypes it descends from) intentionally ship with
no `<meta name="viewport">` tag, relying on the legacy "no viewport tag → lay out on a
virtual ~980px canvas, then browser-zoom to fit" fallback, with every dimension hand-tuned
for that fallback's iPhone-14 zoom factor (~0.4x) — see CLAUDE.md's "2.5x scale convention"
and "no viewport meta" bullets for the full history of why this was ever a deliberate choice.

Confirmed broken on: a different phone width, tablet (iPad), desktop browser window.
Desired end state (per user, 2026-07-25): fully responsive across all screen types, not just
a letterboxed phone column on non-phone screens.

## Why it's currently fragile (root cause, not symptom)

One underlying problem, not three separate bugs: **no dimension in the CSS means the same
thing across environments.** The layout's correctness depends on an undocumented browser
fallback behavior that different browsers implement differently (or not at all), keyed only
to viewport *width*, applied to a stack of regions each given a fixed *height* — so it was
only ever correct for one specific width:height ratio (iPhone 14's).

## Phased plan

### Phase 0 — safety net before touching anything
- Playwright screenshot baseline at iPhone-14 portrait (current known-good state) for every
  screen (HUD mid-game, politician-select carousel, end-of-game card, settings). Nothing in
  later phases should regress this without it being a deliberate, noticed tradeoff.
- `npm test` green as the functional baseline (this migration is CSS/layout only, shouldn't
  touch `engine.js`/`game.js` logic — if it does, that's scope creep, stop and reassess).

### Phase 1 — real viewport meta tag
- Add `<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">`
  to `mobile/index.html` (and the prototypes if they're still meant to preview real device
  behavior — `pme-mobile-sheet.html` is a frozen reference though, may not be worth touching).
- Expected immediately after this alone, before anything else changes: layout looks *worse*
  on the very device this was tuned for, since every px constant assumed the old fallback's
  zoom. This phase is a deliberate one-commit regression, not a fix by itself — don't ship it
  alone; land it together with Phase 2/3 or behind a branch.
- Risk: low, mechanical, fully reversible (delete the tag).

### Phase 2 — fixed-height stack → flexible stack
- `.stage`'s column (topstrip, groups-bar, group-readout, map, info panel) currently assumes
  the *sum* of several fixed-px heights fits one specific device height. Change so exactly
  one region (the map — it's the only one with no fixed intrinsic content) takes `flex:1 1
  auto` and absorbs whatever height is left, instead of every region being a fixed constant.
- Chrome regions (topstrip, groups-bar, info panel) move off single fixed heights onto
  `clamp(floor, preferred, ceiling)` so a short/wide viewport (landscape, tablet) doesn't
  reserve the same vertical budget a tall phone gets.
- Risk: medium. This changes what "the map" visually looks like on every device (it becomes
  variable-height where it was fixed) — needs a design sign-off on min/max map height, not
  just an engineering pass.

### Phase 3 — magic px → relative units
- Bulk mechanical pass: every literal px font-size/padding/gap/icon-size authored under the
  "2.5x convention" (CLAUDE.md's frontend-rules bullet has the full list of affected
  selectors) converts to `clamp()` or a fluid root type-scale.
- Do this *after* Phase 1/2 land and are visually re-approved — reduces the chance of
  debugging three overlapping causes of "it looks wrong" at once.
- Risk: low per-element, high in aggregate (touches nearly every rule in the file) — the
  kind of change that benefits from doing it selector-by-selector with a screenshot diff
  after each group, not as one giant patch.

### Phase 4 — the two genuinely hard parts (design work, not a units fix)
- **Groups-bar honeycomb**: `--hexw` is already computed from `100vw`, so it never overflows
  — but at tablet/desktop width the hexes become oversized rather than capped. Needs a
  `clamp()` max hex size plus a decision on what happens to the freed horizontal space
  (letterbox vs. a wider honeycomb vs. more hexes per row).
- **Map SVG**: scaling it proportionally is easy (Phase 2 already does this). Making it a
  *good* layout at tablet/landscape aspect ratios — more information density, maybe a side
  panel instead of a stacked column — is a real design pass, closer to the ballot-card visual
  work than to a CSS fix. Recommend treating this as its own follow-up decision, not bundled
  into "the responsive fix," since it changes what the game *looks like* on those screens,
  not just whether it fits.

## Open decisions to make before starting Phase 1

- Does `pme-mobile-sheet.html` (frozen design-reference prototype) get migrated too, or left
  as a historical snapshot of the old convention? Leaning: leave it, it's explicitly frozen.
- Map min/max height bounds for Phase 2's `clamp()` — needs an actual number, not "whatever
  fits," or the flexible region just becomes a new unbounded failure mode.
- Groups-bar max hex size for Phase 4 — same kind of number needed.
- Whether tablet/landscape map layout (Phase 4) is in scope for this pass at all, or its own
  later task — it's the one piece of "fully responsive" that isn't just re-plumbing units.

## Explicitly out of scope for this migration

- Any change to `engine.js`/`game.js` game logic.
- Redesigning the map's information density for tablet (tracked as an open decision above,
  not pre-committed to).
- Touching `pme-mobile-sheet.html` (pending the open decision above).
