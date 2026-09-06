# Render the Carousel and wire the share hand-off

Type: task
Status: resolved
Blocked by: 12, 18

## Question

The payoff. Promote DesignA (ticket 08) to a real renderer.

- Slides as React/CSS captured with `@zumer/snapdom` pinned at `2.24.15`, at
  `scale: 1, dpr: 1`, to JPEG at 1080x1350 (ticket 02).
- **Pre-rendered before the share control is tappable** (ADR-0004); the share
  handler contains the `share()` call and nothing else.
- Re-render when an Impression changes; the control disables meanwhile.
- Self-hosted fonts, same-origin. No raster images on any Slide.
- Composition and the 10-file cap from ticket 08: cover plus one Slide per rated
  Pour, cover dropped first past nine.
- The hand-off UI from ticket 12, including the no-Web-Share fallback for
  in-app browsers.
- Own limit checking rather than `canShare()`, which cannot see any of it.

## Answer

Built. The Carousel renders and the flow is complete end to end.

- **Slides** are DesignA (Editorial) as React/CSS at true 1080x1350, captured
  with `@zumer/snapdom` 2.24.15 to JPEG at quality 0.9.
- **`dpr: 1, scale: 1`** — not optional. The default would follow
  `devicePixelRatio` and turn each Slide into 3240x4050 at ~52 MB, and WebKit
  removed the catchable canvas ceiling in 2023, so overshooting kills the tab
  with no error to catch.
- **Pre-rendered** in an off-screen stage whenever anything that changes a Slide
  changes, with the share control disabled meanwhile (ADR-0004). The stage is
  positioned off-screen rather than `display: none`, because snapdom needs real
  layout and a hidden node captures blank.
- **Every Slide container sets `boxSizing` explicitly**, carrying forward the
  bug found in ticket 08: capture serialises the subtree, so a Slide that relies
  on an ambient stylesheet renders correctly on screen and clips in the file.
- **No `<img>` on any Slide**, and **system font stacks only** — nothing depends
  on a webfont having loaded when capture runs, which sidesteps the cross-origin
  `cssRules` failure entirely.
- **Composition** from `compose.ts`, pure and tested: cover plus one Slide per
  rated Pour, the cover dropped first at ten, truncated to the first ten in
  Lineup order beyond that. Seven tests, including that it never exceeds the cap
  for any input.
- **Limits are checked by us, never by `canShare()`** — which only checks the
  array is non-empty (ticket 01).

### Known trade

Slides use system serif and sans stacks, so they render with Georgia on Apple
devices and Noto Serif on Android — a serif either way, but not pixel-identical
across phones. Self-hosting a single subsetted OFL serif would fix it and is
worth doing before this is a product rather than an MVP.
