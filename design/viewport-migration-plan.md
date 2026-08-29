# Viewport / responsive migration — DONE (v2.0.0, 2026-08-28)

Shipped. This file is now a historical record; the current-state reference for
how the layout works is `mobile/index.html` itself and `docs/wiki.html`.

## What the problem was

`mobile/index.html` shipped with **no `<meta name="viewport">` tag**, relying on the
legacy "lay out on a ~980px virtual canvas, then browser-zoom to fit" fallback, with
every font/padding/gap/size hand-authored at **~2.5×** the intended size for iPhone 14's
zoom factor. The layout's correctness depended on an undocumented browser behaviour keyed
only to viewport *width*, applied to a stack of fixed *heights* — so it was only ever
right at iPhone 14 portrait's ratio. iPad and desktop were unplayable.

## What shipped

- **Real viewport tag**: `<meta name="viewport" content="width=device-width, initial-scale=1">`
  (deliberately *not* `viewport-fit=cover` — that activates `env(safe-area-inset-*)`, which
  the old no-tag build never had, and it added a ~34px strip at the screen edge).
- **Fluid rem scale**: `:root{ font-size:16px; font-size:clamp(15px, 4vw, 16.5px) }`. ~330
  `px` size declarations across both `<style>` blocks divided by 2.5 and converted to `rem`
  (scripted pass over a property whitelist; borders / box-shadows / transforms / the SVG
  left alone, then borders+shadows scaled ~0.6× in a second pass). `--fs-*` / `--radius-*`
  are now used app-wide, not just the HUD.
- **Centred column**: on anything wider than the column, the app is a centred
  `max-width: var(--app-max)` (520px) block with letterbox rails; on tall viewports also
  `max-height: var(--app-max-h)` (920px), centred vertically — a letterboxed rectangle, not
  a stretched column over an empty map. Centring lives in a rule **at the very end of the
  stylesheet** (it has to beat each layer's own `position:fixed; inset:0`) and uses
  `left/top:50%` + `transform:translate(-50%,-50%)` — **not** `margin:auto`, which old
  WebKit doesn't re-resolve after `max-width` clamps a fixed box (this was the bug that
  kept the column pinned to the corner on a ~2014 iPad).
- **Flexible stack**: `.stage` is `overflow-y:auto` (scroll as a last resort); `.map-wrap`
  has a real `min-height` (22rem) so the four floating HUD panels can't collide when the
  map row is squeezed; the tutorial stage-coach is in normal flow (a float-over-map version
  covered the elements it taught).
- **`.stage[hidden]{display:none}`** — `.stage` sets its own `display`, so the empty
  pre-game board had been rendering behind the welcome/select screens.
- **Install gate is phone-only now** (`(max-width: 700px)` added) — the reflowing layout
  plays fine in a tablet browser tab; the gate stays for phones (disappearing toolbar, ITP
  storage purge).

## Verified

Real iPhone, a modern iPad, desktop (320–1920px sweep). All fine.

## Known limitation (out of scope)

A **~2014 iPad on old WebKit** is still degraded — that engine lacks flex `gap` (Safari
14.1) and `aspect-ratio` (Safari 15), both used throughout the layout. Not worth unwinding
for one decade-old device; a current iPad renders correctly. If this ever matters, the work
is: replace every flex `gap` with margins and give `.action-btn` an explicit height.

## Not done (deliberately, per the original scope decision)

- Fluid-fill or landscape-specific layouts — the choice was "centred column, letterbox".
- Any `engine.js` / `game.js` change.
- `design/prototypes/pme-mobile-sheet.html` (frozen) and `mobile/index-redesign-c.html`.
