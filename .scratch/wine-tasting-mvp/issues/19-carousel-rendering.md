# Render the Carousel and wire the share hand-off

Type: task
Status: open
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
