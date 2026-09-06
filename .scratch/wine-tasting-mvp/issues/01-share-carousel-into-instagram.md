# Sharing a multi-image Carousel from mobile web into Instagram

Type: research
Status: resolved
Blocked by: —

## Question

The entire payoff of this product rests on one assumption: that a Taster can get
a set of generated Slides out of a mobile browser and into an Instagram carousel
post, in a few taps, without a native app.

Establish, against primary sources and current platform behaviour:

- Does `navigator.share({ files: [...] })` with multiple images actually offer
  Instagram as a share target on current iOS Safari and Android Chrome, and what
  happens when the Taster picks it — feed carousel, Stories, or a single image?
- What are the hard limits: file count, per-file and total size, accepted MIME
  types, and any user-gesture requirement on the `share()` call?
- Which iOS and Android versions support multi-file share, and what is the
  failure mode on the ones that do not — does `canShare()` reliably predict it?
- What Slide dimensions and aspect ratios does an Instagram carousel accept, and
  what does it crop or recompress? How many Slides can one carousel hold?
- What do other web apps that ship this flow actually do, and where do they
  degrade to "save the images, then open Instagram yourself"?

Record findings in `.scratch/wine-tasting-mvp/research/01-share-into-instagram.md`.
Flag clearly if the honest answer is that the seamless path does not exist — the
Destination survives a save-to-device fallback, but the flow's design changes.

## Answer

**Partly — the web half works, the Instagram half is undocumented and must not
be relied on.** `navigator.share({ files })` reliably raises the OS share sheet
with 6–10 Slides on iOS Safari (14/15+) and Chrome Android (76+). But there is
no documented, vendor-supported route from a mobile web page to an Instagram
feed Carousel: Meta's two documented share-into-Instagram integrations are both
single-asset and native-only, and the Content Publishing API needs a server and
a Business account, which ADR-0002 and ADR-0003 rule out.

**The design changes: build the hand-off around saving, not around Instagram.**
Tap share → "Salvar N imagens" to the camera roll in one tap → pt-BR
instructions to post from the Instagram app. Whether Instagram itself shows up
in the sheet is a bonus, never a promise. [ADR-0003](../../../docs/adr/0003-share-sheet-not-instagram-api.md)
has been rewritten accordingly.

Hard constraints, from engine source:

- **Chromium caps a share at 10 files and 50 MiB total**, rejecting past that
  with `NotAllowedError`, and enforces a MIME/extension allowlist. WebKit
  imposes no caps.
- **`canShare()` is blind to all of it in both engines** — it checks only that
  the array is non-empty. It returns true for 11 files or a rejected type, and
  can never predict whether Instagram will appear. Do not use it as a gate.
- Both engines require and consume transient activation, independently
  confirming [ADR-0004](../../../docs/adr/0004-slides-are-pre-rendered.md).
- Android sends `ACTION_SEND_MULTIPLE` for more than one file — a different
  intent action from `ACTION_SEND`, which is likely why Instagram may silently
  not appear for a Carousel.
- Pass `{ files }` only; on iOS, `text`/`url` become sibling activity items.
- **Android WebView has no Web Share at all**, so in-app browsers (Instagram's
  own, Facebook's) break the flow completely. A QR scanned from within another
  app may land there.

Instagram's own specs: up to 20 items per post, a single orientation for the
whole post, width 320–1080 px kept at original resolution when the ratio is
between 1.91:1 and 3:4. **Render every Slide identically at 1080x1350 JPEG and
cap a Carousel at 10 Slides** — Chromium binds before Instagram does.

The residual gap cannot be closed from documentation and needs ten minutes on
real devices — graduated into ticket 13.

Full findings: [research/01-share-into-instagram.md](../research/01-share-into-instagram.md).
