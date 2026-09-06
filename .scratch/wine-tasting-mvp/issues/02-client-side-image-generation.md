# Generating Carousel Slides client-side on a phone

Type: research
Status: resolved
Blocked by: —

## Question

Slides must be rendered to image files on the Taster's device — nothing reaches
a server, so there is no server-side rendering escape hatch.

Establish:

- The realistic options for turning a designed Slide into a PNG or JPEG in a
  mobile browser — Canvas 2D drawn by hand, `OffscreenCanvas`, DOM-to-image
  libraries (`html-to-image`, `modern-screenshot`), SVG serialised into a canvas,
  or Satori-style layout — with the trade-offs of each on text layout, web fonts
  and reliability.
- Memory and time cost of generating roughly 6–10 images at Instagram-grade
  resolution on a mid-range phone, and where iOS Safari's canvas limits bite.
- How custom fonts and emoji survive each approach, and what breaks silently.
- Whether generation can happen inside the user-gesture window that
  `navigator.share()` may require, or whether Slides must be pre-rendered.
- Any library recommendation, pinned, with bundle-size cost.

Record findings in `.scratch/wine-tasting-mvp/research/02-image-generation.md`.

## Answer

**Author each Slide as ordinary React + CSS in the live DOM and capture it via
the `foreignObject`-SVG-into-canvas route, using `@zumer/snapdom` pinned exactly
at `2.24.15`** (50.8 KB gzip, one open issue, published 2026-08-30). Chosen over
`modern-screenshot` 4.7.0 (smaller, viable fallback) and `html-to-image` 1.11.13
(203 open issues, unmaintained since Feb 2025, with its canonical iOS
blank-image bug still open). Satori is ruled out: 181 KB plus WASM, no WOFF2,
and emoji render as nothing without per-grapheme images.

**The finding with product consequences: Slides must be pre-rendered.**
`navigator.share()` gets exactly five seconds of transient activation and
consumes it, confirmed from both engines' source. Six to ten Slides at 1080x1350
will not render inside that window, so the Carousel must be built before the
share control is tappable. Recorded as
[ADR-0004](../../../docs/adr/0004-slides-are-pre-rendered.md), because it shapes
the flow, ticket 04's share entry point, and ticket 07's edit behaviour.

Corrections and hazards:

- The belief that `await` before `share()` breaks iOS is **wrong** — WebKit
  moved to transient activation in 2020, before file sharing existed. The
  constraint is wall-clock, not the await.
- snapdom's `dpr` defaults to `devicePixelRatio`, which on an iPhone turns a
  1080x1350 Slide into 3240x4050 at ~52 MB. Capture with `scale: 1, dpr: 1`.
- WebKit **removed** the catchable 384 MB canvas ceiling in 2023, so overshooting
  on iOS 17+ kills the tab via jetsam with no catchable error.
- Fonts must be self-hosted same-origin — cross-origin `cssRules` access throws
  and fonts silently fall back.
- The Note must be clamped by grapheme, not code unit.
- Slides should contain no raster images; every `<img>` is a WebKit decode race.

Open gaps needing real devices: per-Slide timing, peak memory across a ten-Slide
run, and whether WOFF2-only still fails on current iOS.

Full findings: [research/02-image-generation.md](../research/02-image-generation.md).
