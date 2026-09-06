# Generating Carousel Slides client-side on a phone

Research for [issue 02](../issues/02-client-side-image-generation.md).
Investigated 2026-09-06. Vocabulary per [CONTEXT.md](../../../CONTEXT.md).

---

## Recommendation

**Render each Slide as ordinary React + CSS in the live DOM, capture it through
the `foreignObject`-SVG-into-canvas route, and encode to JPEG. Use
[`@zumer/snapdom`](https://github.com/zumerlab/snapdom), pinned exactly at
`2.24.15`.**

**And pre-render the whole Carousel before the share control becomes tappable.**
`navigator.share()` gets five seconds of transient activation and no more, in
both engines; six to ten Slides at 1080x1350 will not fit inside it. This is the
single finding with product consequences — see
[The user-gesture window](#the-user-gesture-window-the-load-bearing-constraint).

Why snapdom over the alternatives:

| | version | min+gzip | open issues | last publish |
|---|---|---|---|---|
| `@zumer/snapdom` | 2.24.15 | 50.8 KB | **1** | 2026-08-30 |
| `modern-screenshot` | 4.7.0 | 9.7 KB | 71 | 2026-04-16 |
| `html-to-image` | 1.11.13 | 5.2 KB | 203 | 2025-02-14 |
| `satori` (+ rasteriser) | 0.33.4 | 181 KB + WASM | — | 2026-08-24 |

Sizes from [bundlephobia](https://bundlephobia.com/package/@zumer/snapdom);
versions and dates from the npm registry
([snapdom](https://registry.npmjs.org/@zumer/snapdom),
[modern-screenshot](https://registry.npmjs.org/modern-screenshot),
[html-to-image](https://registry.npmjs.org/html-to-image),
[satori](https://registry.npmjs.org/satori)); issue counts from the GitHub API
on 2026-09-06 ([snapdom](https://github.com/zumerlab/snapdom),
[modern-screenshot](https://github.com/qq15725/modern-screenshot),
[html-to-image](https://github.com/bubkoo/html-to-image)).

1. **The DOM route is the only one where the Slide design and the Slide preview
   are the same artefact.** Ticket 08 has to produce something a Taster is
   willing to post. Authoring that in React/CSS and capturing it verbatim is
   worth a great deal; hand-drawn Canvas 2D and Satori both mean the preview and
   the exported Slide are two separate implementations that drift.
2. **snapdom is the only one of the three DOM libraries under active
   maintenance.** One open issue against 8,085 stars, pushed the day before this
   was written. `html-to-image` has 203 open issues and has shipped nothing since
   February 2025; its canonical iOS bug
   ([#361](https://github.com/bubkoo/html-to-image/issues/361), open since
   January 2023, 28 reactions) is still open, and a user on Safari 18.4 reports
   in [#488](https://github.com/bubkoo/html-to-image/issues/488) that "the only
   way I got this to work on iPad Safari was via modern-screenshot".
3. **snapdom handles the WebKit hazards explicitly rather than by heuristic.**
   Its README documents that Safari captures wait for the fonts the element
   actually uses and *verify the first canvas draw*, citing
   [WebKit bug 219770](https://bugs.webkit.org/show_bug.cgi?id=219770) for the
   font-decode timing problem. `modern-screenshot` addresses the same class of
   bug by blindly re-drawing the SVG once per embedded image with a 100 ms gap
   ([`image-to-canvas.ts`](https://github.com/qq15725/modern-screenshot/blob/main/src/image-to-canvas.ts)),
   which is both slower and less certain. The equivalent snapdom bug
   ([#394](https://github.com/zumerlab/snapdom/issues/394)) was fixed in
   March 2026.
4. **50 KB gzipped is affordable here.** It is smaller than one web font face,
   and the Carousel is the product's whole payoff. `modern-screenshot` 4.7.0 is
   the credible fallback at a fifth the size if snapdom's fidelity disappoints —
   it is a fork of `html-to-image` with the Safari fixes, and its
   [`createContext()`](https://github.com/qq15725/modern-screenshot#singleton-context-and-web-worker)
   lets font embedding be computed once and reused across all ten Slides.

Pin exactly, no caret: snapdom shipped 2.24.7 → 2.24.15 in nine days.

Settings to use:

- `scale: 1, dpr: 1` — **not the defaults.** See
  [the devicePixelRatio trap](#1-the-devicepixelratio-trap-the-most-likely-way-to-crash-a-phone).
- `embedFonts: true`, with the Slide font self-hosted same-origin.
- `type: 'jpeg'`, `quality: 0.92`. Not WebP: snapdom's own README records that on
  Safari 26.5 `canvas.toDataURL('image/webp')` silently returns PNG bytes
  ([Limitations](https://github.com/zumerlab/snapdom#limitations)), so a
  `.webp` Slide would carry PNG data.
- No raster images in the Slide design — gradients, SVG shapes and text only.
  Every embedded `<img>` is a decode race on WebKit and, in `modern-screenshot`,
  literally +100 ms per image per Slide.

---

## The approaches, compared

### A. DOM → `<foreignObject>` SVG → `<img>` → canvas — **recommended**

How it works, per
[html-to-image's own description](https://github.com/bubkoo/html-to-image#how-it-works):
clone the node, copy every computed style onto the clone, inline the `@font-face`
sources and any images as `data:` URLs, serialise to XML, wrap in
`<foreignObject>` inside an `<svg>`, make that a data URL, load it into an
`Image`, `drawImage` it onto a canvas, then `toBlob`.

- **Text layout is the browser's.** Line breaking, hyphenation, `text-wrap:
  balance`, `-webkit-line-clamp` for the three-line Note, bidi, accents — all of
  it is real CSS, identical to the preview. This is the decisive advantage.
- **Fonts must be inlined**, because SVG used as an image is a restricted
  context. Per
  [MDN](https://developer.mozilla.org/en-US/docs/Web/SVG/Guides/SVG_as_an_Image):
  "External resources cannot be loaded — images and stylesheets cannot be loaded
  from external sources, though they can be used if inlined through `data:`
  URLs." All three libraries do this for you; the failure modes are in
  [Fonts](#fonts-what-breaks-silently).
- **The rasterisation step is main-thread-only.** It needs an
  `HTMLImageElement`, which does not exist in a Worker. `OffscreenCanvas` (Safari
  16.4+,
  [MDN BCD](https://github.com/mdn/browser-compat-data/blob/main/api/OffscreenCanvas.json))
  does not rescue this; only the asset *fetching* can be moved off-thread, which
  is what `modern-screenshot`'s worker actually does
  ([`worker.ts`](https://github.com/qq15725/modern-screenshot/blob/main/src/worker.ts)
  is a `fetch` proxy and nothing more).
- **WebKit decodes nested data-URL images asynchronously**, so the first
  `drawImage` can produce a blank or partial Slide with no error. This is the
  most reported bug in this whole family
  ([html-to-image #361](https://github.com/bubkoo/html-to-image/issues/361),
  [#420](https://github.com/bubkoo/html-to-image/issues/420),
  [#488](https://github.com/bubkoo/html-to-image/issues/488),
  [snapdom #394](https://github.com/zumerlab/snapdom/issues/394)). Keeping raster
  images out of the Slide design removes the trigger entirely.

### B. Hand-written Canvas 2D

- **Maximum reliability, maximum cost.** No serialisation, no font inlining, no
  SVG decode race. `fillText` uses the fonts the document has already loaded, and
  emoji come from the platform emoji font for free.
- But you implement line breaking, ellipsis, the three-line Note clamp, long-wine-name
  degradation (ticket 08's explicit concern) and the whole visual identity twice
  — once in CSS for the Taster's preview and once in `measureText` loops for the
  export. They will drift, and the export is the one nobody sees until it is on
  Instagram.
- Reasonable as a *fallback renderer* for a stripped-down Slide if the DOM route
  proves unreliable on some device, not as the primary.

### C. Satori + a rasteriser

[Satori](https://github.com/vercel/satori) turns a JSX subset into SVG using its
own Yoga-based layout engine. It genuinely runs in the browser and in Workers —
"Satori can be directly used in browser, Node.js (>= 16), and Web Workers. It
bundles its underlying WASM dependencies as base64-encoded strings" — and it is
deterministic, which would make Slides unit-testable in Vitest.

Ruled out for this product:

- **Weight.** 181 KB gzipped of JS, plus base64-inlined Yoga and HarfBuzz WASM
  (5.85 MB unpacked tarball), plus a rasteriser: Satori emits SVG, not pixels.
  `@resvg/resvg-wasm` 2.6.2 is another 2.5 MB unpacked and its last stable
  release was March 2024
  ([registry](https://registry.npmjs.org/@resvg/resvg-wasm)). The alternative is
  to rasterise the SVG through `<img>` + canvas, at which point you have taken on
  Satori's weight *and* kept approach A's decode race.
- **Fonts as ArrayBuffers, and no WOFF2.** "Satori currently supports three font
  formats: TTF, OTF and WOFF. Note that WOFF2 is not supported at the moment.
  You must specify the font if any text is rendered with Satori." A WOFF2 face
  is typically 3–6x smaller than the TTF; this multiplies the download on venue
  wifi.
- **Emoji do not render at all** unless you supply `graphemeImages` or
  `loadAdditionalAsset` returning an image per grapheme.
- **It is not the browser's CSS.** Satori's README is explicit: it "does not
  guarantee that the SVG will 100% match the browser-rendered HTML output". The
  preview and the Slide diverge by construction.

### D. Author the Slide as real SVG (no `foreignObject`)

Hand-written `<text>` and `<tspan>`, serialised and rasterised. Sidesteps the
`foreignObject` clone entirely and is small. But SVG 1.1 `<text>` has no
automatic wrapping, so you are back to approach B's manual line-breaking with
none of its ergonomics. Not worth it.

### E. Web Worker / `OffscreenCanvas`

Not an approach — an optimisation, and one that does not apply. The
`foreignObject` rasterisation needs `HTMLImageElement`. `OffscreenCanvas` is
Safari 16.4+ and only useful if you had already gone with approach B and wanted
to move `fillText` off-thread; combined with pre-rendering (below) the main
thread is not actually the bottleneck the Taster perceives.

---

## Phone-specific hazards

### The user-gesture window: the load-bearing constraint

**Both engines give exactly five seconds of transient activation, and
`share()` consumes it.**

- WebKit:
  [`LocalDOMWindow.cpp`](https://github.com/WebKit/WebKit/blob/main/Source/WebCore/page/LocalDOMWindow.cpp)
  — `static constexpr Seconds defaultTransientActivationDuration { 5_s };`
- Chromium:
  [`user_activation_state.h`](https://chromium.googlesource.com/chromium/src/+/main/third_party/blink/public/common/frame/user_activation_state.h)
  — `inline constexpr base::TimeDelta kActivationLifespan = base::Seconds(5);`
- The spec requires it: [Web Share](https://w3c.github.io/web-share/#share-method)
  step 6 rejects with `NotAllowedError` if the global "does not have transient
  activation", and step 7 *consumes* it.
  [MDN](https://developer.mozilla.org/en-US/docs/Web/API/Navigator/share): "It
  must be triggered off a UI event like a button click and cannot be launched at
  arbitrary points by a script."
- WebKit implements exactly that:
  [`Navigator.cpp`](https://github.com/WebKit/WebKit/blob/main/Source/WebCore/page/Navigator.cpp)
  — `if (!window || !window->consumeTransientActivation()) { promise->reject(ExceptionCode::NotAllowedError); return; }`

**The widely repeated claim that "a single `await` loses activation on iOS
Safari" is out of date.** WebKit used to require a live user-gesture stack, and
fixed that in January 2020 —
[bug 197779, "Using Web Share API preceded by an AJAX call"](https://bugs.webkit.org/show_bug.cgi?id=197779):

> our implementation was stricter and would reject the promise if we are not
> currently processing a user-gesture. This behavior did not match Chrome and
> does not appear to be Web compatible. To address the issue, this patch
> introduces the concept of transient activation in WebKit and uses it in
> `navigator.share()`.

That shipped no earlier than Safari 13.1 / iOS 13.4. Since `files` support only
arrives in Safari/iOS 14
([MDN BCD `Navigator.share.data_files_parameter`](https://github.com/mdn/browser-compat-data/blob/main/api/Navigator.json):
Safari 14, Chrome Android 76), **every device that can share files at all already
has the five-second window.** Awaiting is legal. Wall-clock is the constraint,
not the `await`.

**Five seconds is not enough for a Carousel.** Six to ten Slides at 1080x1350
each require, per Slide: a full DOM clone with computed styles, an XML
serialisation of the order of hundreds of KB, an SVG decode, a 1.46-megapixel
`drawImage`, and a JPEG encode. On a mid-range Android that is plausibly
0.5–1.5 s per Slide, so 3–15 s for the set. Even the optimistic end leaves no
margin, and blowing the budget produces a `NotAllowedError` that reads to the
Taster as a share button that does nothing.

**Therefore: pre-render.** Concretely —

- Generate all Slides as soon as the Taster reaches the Carousel screen, showing
  real progress ("Slide 3 of 8"). The Map already lists "what the Taster sees
  while Slides render" as unspecified; this research says that screen is
  mandatory, not optional.
- Hold the finished `File[]` in memory. The share handler must be, in its
  entirety: `if (navigator.canShare?.({ files })) await navigator.share({ files })`.
  Nothing may be computed between the tap and the call.
- Handing over already-materialised `File`s costs nothing in the window: WebKit
  consumes the activation *first* and only then reads the blobs asynchronously
  via `ShareDataReader`
  ([`Navigator.cpp`](https://github.com/WebKit/WebKit/blob/main/Source/WebCore/page/Navigator.cpp)).
- **Guard against double-tap.** WebKit rejects a concurrent call with
  `InvalidStateError` and the message `"share() is already in progress"`. Disable
  the control for the duration of the promise.
- **A failed share needs a fresh tap.** Activation is consumed whether or not the
  share succeeds, so an automatic retry will always fail. Surface a retry
  *button*, never a retry loop.
- If Slides are re-rendered after an Impression is edited, that invalidation must
  finish before the share control re-enables — or the Taster shares stale Slides.

### Memory: what actually bites on iOS

Per Slide at 1080x1350: 1,458,000 px, 4 bytes each = **5.83 MB** of canvas
backing store, plus the SVG data-URL string and the encoded JPEG. Ten live at
once is roughly 60 MB of canvas plus overhead. That is survivable. The dangers
are elsewhere.

#### 1. The `devicePixelRatio` trap (the most likely way to crash a phone)

snapdom's `dpr` option defaults to `devicePixelRatio`
([docs](https://snapdom.dev/docs/options/)). On an iPhone that is 3. Capture a
Slide authored at 1080x1350 with defaults and you get **3240x4050 = 13.1
megapixels = 52 MB per Slide**, and ten of those is over 500 MB. Author the Slide
at exactly 1080x1350 CSS pixels in an offscreen container, scale it *down* with a
CSS `transform` for the on-screen preview, and capture with `scale: 1, dpr: 1`.

#### 2. The iOS canvas area cap is no longer the old 4096x4096

[`CanvasBase.cpp`](https://github.com/WebKit/WebKit/blob/main/Source/WebCore/html/CanvasBase.cpp)
currently returns `8192 * 8192` (67,108,864 px) on `PLATFORM(IOS_FAMILY)`, raised
from `4096 * 4096` (16,777,216) in
[WebKit 276145@main, March 2024](https://bugs.webkit.org/show_bug.cgi?id=271002):
"The maximum size of the canvas on iOS has been 4096x4096. The jetsam limit on
iOS has been raised. So we can safely double the limit." Exceeding it logs
`Canvas area exceeds the maximum limit (width * height > 67108864)` and yields a
blank canvas rather than throwing.

A single Slide at 1.46 MP is 2% of the current cap and 9% of the old one, so it
is never the binding constraint — **unless** you compose the whole Carousel into
one tall canvas (10 x 1350 = 13,500 px tall, 14.6 MP: over the old cap, under the
new one) or fall into the `dpr` trap above. Render Slides one at a time.

#### 3. The page-wide canvas memory ceiling was *removed*, and that made failure worse

The familiar `Total canvas memory use exceeds the maximum limit (384 MB)` error
no longer exists. WebKit deleted `maxActivePixelMemory` in
[bug 195325, June 2023](https://bugs.webkit.org/show_bug.cgi?id=195325)
([265628@main](https://commits.webkit.org/265628@main)):

> After some internal and external discussion we've decided to remove the canvas
> limit and just let the page follow the same memory restrictions as all other
> Web features. **This might mean more pages crash (jetsam) than break.**

So on iOS 17 and later there is no catchable ceiling: overshoot and the tab is
killed and silently reloaded mid-Carousel, losing the Taster's in-memory Slides.
There is no `try/catch` for this. The mitigations are structural — render
sequentially, drop each canvas reference before starting the next, keep only the
encoded `File`s, and never scale by `devicePixelRatio`.

Note this also means older iOS (15/16) and current iOS fail *differently*: the
older ones log an error and hand back transparent canvases, the newer ones crash.
Both are silent from the Taster's point of view.

### Fonts: what breaks silently

- **An unloaded font is a silently substituted font.** The capture serialises
  whatever the browser has right now. `await document.fonts.ready` before the
  first capture, and additionally
  `await document.fonts.load('700 48px "Slide Display"')` for each weight and
  style the Slide design actually uses — `ready` resolves once *pending* loads
  settle, and a face that has not been requested yet is not pending
  ([MDN `FontFaceSet.ready`](https://developer.mozilla.org/en-US/docs/Web/API/FontFaceSet/ready)).
  With `font-display: swap` the preview will look right while the Slide comes out
  in the fallback.
- **Self-host the font, same origin.** Font inlining works by walking
  `document.styleSheets[].cssRules` to find `@font-face` rules; a cross-origin
  stylesheet throws `SecurityError` on `cssRules`
  ([MDN `CSSStyleSheet.cssRules`](https://developer.mozilla.org/en-US/docs/Web/API/CSSStyleSheet/cssRules)),
  so the rules are simply not found and the text renders in the fallback with no
  error. If Google Fonts is used anyway, the `<link>` needs
  `crossorigin="anonymous"` — snapdom documents this explicitly
  ([CORS & External Resources](https://github.com/zumerlab/snapdom#cors--external-resources)).
- **Ship a WOFF alongside the WOFF2.**
  [html-to-image #203](https://github.com/bubkoo/html-to-image/issues/203),
  "woff and woff2 result in missing font on iOS": "When I only import `woff` and
  `woff2` files, the text used in the target `div` is simply left out on iOS…
  The good thing is, that I can include all three formats for it to work." That
  report is from 2021 and may well be stale, but the insurance costs one extra
  file and the failure it prevents is invisible until the Slide is posted.
- **Fonts registered via the `FontFace()` constructor are not embedded.**
  snapdom's README says so directly and points at the `localFonts` option; if the
  app loads the Slide font programmatically rather than via `@font-face`, list it
  explicitly.
- **Font embedding is the slow part on Safari**, per
  [WebKit bug 219770](https://bugs.webkit.org/show_bug.cgi?id=219770) as cited by
  snapdom. Warm it once: capture a throwaway Slide (or use snapdom's `cache`
  policy / `preCache`) before the visible run, so the Taster's progress bar is
  not dominated by the first Slide.

### Emoji

- **On the `foreignObject` route, emoji survive.** The platform emoji font is a
  *local* font, not an external resource, so the SVG-as-image restriction does
  not touch it — Apple Color Emoji on iOS, Noto Color Emoji on Android. This also
  means **a Slide with emoji looks materially different on the two platforms**,
  which is a ticket 08 decision, not a bug. If Descriptors are given emoji
  glyphs, they need checking on both.
- **The surrogate-pair hazard is real but currently handled.**
  `modern-screenshot` scrubs XML-illegal characters before `encodeURIComponent`,
  and its character class includes `\uD800-\uDFFF`
  ([`utils.ts`](https://github.com/qq15725/modern-screenshot/blob/main/src/utils.ts)).
  That range would delete every emoji — except the regex carries the `u` flag,
  under which a well-formed pair is a single code point above U+FFFF and is not
  matched. Verified in Node against 4.7.0's exact pattern: with `/gu`,
  `"Vinho 😊🍷"`, a ZWJ family `👩‍👩‍👧` and the flag `🇧🇷` all pass through
  intact; **drop the `u` flag and all of them vanish**. This was a live bug once
  ([modern-screenshot #35](https://github.com/qq15725/modern-screenshot/issues/35),
  reported from iOS 16.5: "String contained illegal UTF-16 sequence"). If Slide
  text ever contains a *lone* surrogate — truncating a Note by
  `String.prototype.slice` at a code-unit boundary will do it —
  `html-to-image`, which calls `encodeURIComponent` with no scrub at all
  ([`util.ts`](https://github.com/bubkoo/html-to-image/blob/master/src/util.ts)),
  throws `URIError: URI malformed` and the whole Slide fails. **Clamp the Note by
  grapheme, never by code unit.**
- **Satori renders no emoji by default**, requiring `graphemeImages` or
  `loadAdditionalAsset` per grapheme. This is the loudest silent failure among
  the options and a further reason to skip it.

### Two smaller ones

- **The Slide must be laid out to be captured.** These libraries clone live DOM
  and read `getBoundingClientRect`. `display: none` gives a 0x0 capture. Mount the
  offscreen Slides with something like `position: fixed; left: -20000px; top: 0`
  and real dimensions.
- **`html-to-image` builds the image as a base64 string.** Its blob path goes
  `canvas.toDataURL()` → `atob` → `Uint8Array`, holding a multi-megabyte JS string
  per Slide ([`util.ts`](https://github.com/bubkoo/html-to-image/blob/master/src/util.ts)).
  snapdom and `modern-screenshot` use `canvas.toBlob`. One more reason not to
  pick it.

---

## Confidence and gaps

**High confidence** (read from engine source, specs, or library source):

- The five-second transient activation window in both WebKit and Chromium, and
  that `share()` consumes it. Read directly from `LocalDOMWindow.cpp`,
  `user_activation_state.h`, `Navigator.cpp` and the Web Share spec.
- That awaiting before `share()` is permitted on modern iOS — WebKit bug 197779,
  and the fact that `files` support post-dates the fix.
- The iOS canvas area cap of 8192x8192, and the removal of the page-wide canvas
  memory ceiling. Read from `CanvasBase.cpp` and the two WebKit bugs.
- SVG-as-image cannot load external resources, so fonts must be inlined.
- The emoji surrogate behaviour of `modern-screenshot` 4.7.0 — verified by
  running its exact regex.
- Library versions, sizes, maintenance activity — npm registry and GitHub API,
  2026-09-06.

**Medium confidence:**

- **The snapdom-over-modern-screenshot call.** It rests on maintenance signals
  and documented Safari handling, not on a head-to-head test on real phones.
  snapdom's published benchmarks are Chromium-only and appear to time the
  serialisation step rather than rasterisation (0.5 ms for a 4000x2000 capture is
  not a full pixel pipeline), so treat them as marketing. Both libraries are the
  same architecture; switching later is a contained change if the capture is kept
  behind one module.
- Which Safari release each WebKit commit shipped in. The commits are dated
  (June 2023 and March 2024), which puts them at Safari 17.0 and 17.5 at the
  earliest, but I did not verify against Apple's release notes.
- The `html-to-image #203` WOFF-on-iOS finding is from 2021 and may be fixed.

**Genuine gaps — measure, do not guess:**

1. **How long one Slide actually takes on a real mid-range Android and a real
   iPhone.** The 0.5–1.5 s per Slide figure is reasoned from the pipeline, not
   measured. It does not change the pre-render conclusion (the five-second cap
   makes that call regardless), but it decides whether the progress screen is a
   two-second beat or a fifteen-second wait — which is a UX question ticket 08
   needs answered. Instrument the prototype with `performance.now()` per stage
   and run it on the actual phones.
2. **Peak memory during a ten-Slide run on iOS**, and whether sequential
   rendering with dropped references is enough to avoid jetsam. The failure is a
   silent tab kill with no catchable error, so this needs a device, not a
   simulator.
3. **Whether WOFF2-only `@font-face` still fails inside `foreignObject` on
   current iOS.** One afternoon with a test page settles it.
4. **JPEG quality versus file size for the real Slide design**, and whether the
   total lands inside whatever `navigator.share` accepts — that limit is
   [ticket 01](../issues/01-share-carousel-into-instagram.md)'s to establish, and
   this ticket's format recommendation should be revisited against its answer.
5. **How Slide generation gets tested at all.** `jsdom` has no layout and no
   canvas, so none of this is unit-testable in Vitest; the only meaningful check
   is a real browser with visual comparison. Feeds the Map's open "Testing Slide
   image generation" item and ticket 11.
