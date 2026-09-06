# The Carousel: Slide design and composition

Type: prototype
Status: resolved
Blocked by: 01, 02, 07

## Question

What the Taster actually posts, and therefore what the whole product is judged
on by people who were not at the Event.

Build a prototype of the generated Slides, settling:

- The composition of a Carousel: a cover Slide, one Slide per rated Pour, a
  closing Slide? What appears when only two of seven Pours were rated?
- What a single Pour's Slide shows — wine details, Ratings, Descriptors, the
  Note, the first name — and the hierarchy between them.
- Slide dimensions and safe areas, following the specs from ticket 01.
- Visual identity: this must look like something a person is willing to post,
  not like a form receipt. Whether the group is credited on it.
- How a long Note or a long wine name degrades without breaking the layout.
- Whether the Taster previews and reorders Slides before sharing, or just gets
  them.

Constrained by whatever ticket 02 concludes is reliably renderable on a phone.
Link the prototype from this ticket.

## Notes from ticket 02

Hard constraints on any Slide design, from the image-generation research:

- **No raster images anywhere on a Slide** — every `<img>` is a WebKit decode
  race. Photography of the bottle is therefore off the table; the design must
  carry itself with type, colour and vector shapes.
- **Fonts must be self-hosted same-origin.** A Google Fonts `<link>` will
  silently fall back to a system font in the captured image while looking
  correct on screen.
- Capture at `scale: 1, dpr: 1`; the device pixel ratio default would produce
  3240x4050 Slides at ~52 MB each and can kill the tab outright on iOS 17+.
- Slide count matters for memory, not just taste — a ten-Slide Carousel is a
  real memory risk, so "one Slide per rated Pour" has an upper bound worth
  deciding here.

## Notes from ticket 01

Output specification is now fixed, and it constrains the design directly:

- **Every Slide renders identically at 1080x1350 JPEG.** Instagram keeps a post
  to one orientation throughout, and holds original resolution when the aspect
  ratio sits between 1.91:1 and 3:4; 4:5 portrait is the safe maximum height.
- **Cap a Carousel at 10 Slides.** Instagram allows 20, but Chromium rejects a
  share of more than 10 files or 50 MiB total, so the browser binds first. With
  a Lineup longer than 10 rated Pours, the design must decide what gives — a
  summary Slide, the top N, or splitting.
- 50 MiB total across the Carousel is a real budget: roughly 5 MB per Slide at
  10 Slides, which JPEG at this size clears easily but PNG would not. JPEG it is.
- If ticket 13 finds that saving does not preserve Slide order, the design must
  carry visible numbering so a Taster can reassemble the order by hand.

## Notes from ticket 13

Slide order **was preserved** when saving on Android, and Instagram appeared in
the share sheet. So the design does not need defensive numbering on every Slide.
Treat that as an Android result only until ticket 14 verifies iOS; if numbering
is wanted for its own sake, that is now a design choice rather than a
workaround.

## Prototype — 2026-09-06

Three Carousel designs at `/prototype/carousel?variant=A|B|C`. Slides render at
true 1080x1350 and are scaled for preview, so the type sizes on screen are the
real ones. Composition shown throughout is **cover + one Slide per rated Pour**,
with four of seven Pours rated — the realistic case, not the full house.

- **A — Editorial.** Paper ground, serif headings, the four Axis answers as a
  quiet labelled list, the Note set as an italic pull quote, Descriptors as
  small caps at the foot. Reads like a magazine spread; the most "considered",
  the least obviously social.
- **B — Ficha.** Dark card with a gold rule, big numeral, and the four Axes as a
  2x2 grid of labelled boxes — the rating structure is the design. Descriptors
  become gold pills. Most information per Slide, most obviously a *tasting*.
- **C — Declaração.** The Note is the design: it fills the Slide in huge type on
  a solid accent colour that changes per wine, with the wine details and all
  four answers shrunk to a footer. Least data, most likely to actually get
  posted.

All three obey the constraints research already fixed: no raster images
anywhere, colour and type only, and fonts that will need to be self-hosted
same-origin before capture is trusted.

Open questions the prototype surfaces rather than settles:

- **What gives past 9 rated Pours.** Cover + 10 Pours = 11 Slides, and Chromium
  rejects a share over 10 files. A Lineup of 12 with an enthusiastic Taster
  breaks this. Options: drop the cover, cap at the best-rated 9, or split.
- **An empty Note.** C collapses entirely without one — it has nothing else to
  show. A and B degrade gracefully. If C wins, it needs a fallback built from
  Descriptors.
- Whether the group is credited on the cover at all.

## Answer

**Design A — Editorial.** Paper ground, serif headings, the four Axis answers as
a quiet labelled list, the Note set as an italic pull quote, Descriptors in
small caps at the foot.

**Composition:** a cover Slide carrying the Event name, date and the Taster's
first name, then one Slide per *rated* Pour in Lineup order. An unrated Pour
never becomes a Slide.

**The >9 rule, decided:** a Carousel is never more than 10 files, because
Chromium rejects a share past that (ticket 01). Cover plus up to nine Pour
Slides. If a Taster rates more than nine Pours the cover is dropped and all ten
slots go to wines; past ten rated Pours, the first ten in Lineup order win.
Chronological rather than ranked — it tells the evening as it happened, needs no
tie-breaking against a binary Axis, and is explainable to a Taster in one line.
This is a small, reversible rule; say so if ranking by *O quanto você gostou?*
would be better.

**An empty Note degrades acceptably in A** — the pull quote area simply
collapses and the Axis list and Descriptors still carry the Slide. This is part
of why A won over C, which has nothing left to show without a Note.

Not adopted: B's 2x2 Axis grid (more informative but reads as a form) and C's
full-bleed Note (most postable, but collapses without a Note and shows almost no
wine detail).

### Bug found and fixed while reviewing

The Slides were clipping their bottom ~192px — the Descriptors line and the tail
of the Note. Not a preview artefact: each Slide's inner container set
`padding: 96` together with `height: 100%`, so under the default `content-box`
it laid out 1542px tall inside a 1350px frame and `overflow: hidden` cut the
difference. **It would have clipped identically in the captured JPEG.**

Fixed in two places deliberately: a global `box-sizing: border-box` reset in
`index.html`, *and* an explicit `boxSizing` on every Slide container. The second
is not redundant — ticket 02's capture route serialises the Slide subtree, so a
Slide that depends on an ambient stylesheet can render correctly on screen and
clip only in the saved image, which is the worst version of this bug.

Answers the ticket's "how does a long Note degrade" question directly: with the
fix, a worst-case 140-grapheme Note at four lines uses 800px of the 1158px inner
height, leaving real headroom.
