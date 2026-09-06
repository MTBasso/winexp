# Sharing a multi-image Carousel from mobile web into Instagram

Research for [issue 01](../issues/01-share-carousel-into-instagram.md). Researched 2026-09-06.

## Verdict

**Partly — and the missing half is exactly the half the product was counting on.**

The web half is solid and well specified. `navigator.share({ files: [...] })` with
6–10 generated Slides works on current iOS Safari and Android Chrome, is
supported back to iOS 14/15 and Chrome Android 76, and reliably raises the OS
share sheet with all the Slides attached.

The Instagram half is not. **There is no documented, vendor-supported path from a
mobile web page to an Instagram feed Carousel.** Meta documents exactly two
share-into-Instagram integrations — sharing to Feed and sharing to Stories — and
*both are single-asset only*. Neither is reachable from `navigator.share()`
anyway, because both require a native app calling a private UTI or a custom
intent. Whether Instagram appears at all in the share sheet for a multi-file
payload, and what it does with it, is undocumented behaviour of a closed app that
changes between Instagram releases and differs between iOS and Android. It cannot
be relied on, and it cannot be feature-detected: `canShare()` cannot see it (see
Q3).

The path that *is* dependable, on both platforms, and needs no cooperation from
Meta:

1. The Taster taps "Share".
2. `navigator.share({ files: slides })` raises the OS share sheet.
3. The Taster taps **Save N Images** (iOS) / the equivalent Save target
   (Android). Every Slide lands in the camera roll, in order, in one tap.
4. The Taster opens Instagram, taps +, multi-selects the Slides, posts the
   Carousel.

So the Destination survives, but **the "few taps into Instagram" framing does
not**. The realistic promise is "one tap to save your Carousel, then post it" —
roughly six taps in Instagram's own composer, which is the flow Instagram users
already know. Design the hand-off screen around *saving*, and treat an Instagram
icon appearing in the share sheet as an unearned bonus, never as the happy path.

---

## Q1. Does `share({ files })` offer Instagram, and what happens if the Taster picks it?

### What reaches the share sheet (verified from engine source)

**iOS/WebKit.** `Navigator::share` hands the payload to `WKShareSheet`, which
writes each file into a temporary directory and passes the resulting **file
URLs** as activity items to a `UIActivityViewController`
([`WKShareSheet.mm`](https://github.com/WebKit/WebKit/blob/main/Source/WebKit/UIProcess/Cocoa/WKShareSheet.mm)).
Two consequences matter:

- Targets see `public.jpeg`/`public.png` file URLs, not Photos assets. An app
  whose share extension activates on images will match; an app that only accepts
  photo-library assets will not.
- **`text` and `url` are added to the same activity-items array**, *before* the
  files (`presentWithParameters:` in the same file). A mixed payload of
  string + URL + N images narrows which extensions activate. This is the primary
  source behind the widely repeated practitioner rule "on iOS, pass `files` and
  nothing else" (e.g.
  [Apple Developer Forums thread 665812](https://developer.apple.com/forums/thread/665812)).
  **Send `{ files }` only.** No `title`, no `text`, no `url`.

**Android/Chromium.** When more than one file is shared, Chrome builds an
`Intent.ACTION_SEND_MULTIPLE`; with exactly one file it builds `ACTION_SEND`
([`ShareHelper.java`](https://github.com/chromium/chromium/blob/main/components/browser_ui/share/android/java/src/org/chromium/components/browser_ui/share/ShareHelper.java),
`isMultipleFileShare = fileUris != null && fileUris.size() > 1`). The intent type
is the common MIME type of the files: all-JPEG Slides yield `image/jpeg`; a mix
of JPEG and PNG degrades to `image/*`
([`SharedFileCollator.java`](https://github.com/chromium/chromium/blob/main/components/browser_ui/webshare/android/java/src/org/chromium/components/browser_ui/webshare/SharedFileCollator.java)).

**This is the crux on Android.** A Carousel of 6–10 Slides is `ACTION_SEND_MULTIPLE`,
which is a *different intent action* from `ACTION_SEND`. An app appears in the
chooser only if its manifest declares an `<intent-filter>` for that exact action
([Android `<intent-filter>` docs](https://developer.android.com/guide/topics/manifest/intent-filter-element)).
Instagram's manifest is not published by Meta, and its share entry points
(`com.instagram.share.handleractivity.ShareHandlerActivity` for the feed,
`com.instagram.direct.share.handler.DirectShareHandlerActivity` for Direct — the
component names third-party libraries target, e.g.
[react-native-share#1234](https://github.com/react-native-share/react-native-share/issues/1234))
are undocumented internals. So a single Slide almost certainly offers Instagram;
a multi-Slide Carousel may silently not.

### What Meta actually documents

Both official integrations are **single-asset**:

- [Sharing to Feed](https://developers.facebook.com/docs/instagram-platform/sharing-to-feed):
  Android uses `Intent.ACTION_SEND` with a single `EXTRA_STREAM`; iOS uses a
  Universal Link or the Document Interaction API with a file carrying the
  `com.instagram.photo` UTI. Multi-image is not mentioned anywhere.
- [Sharing to Stories](https://developers.facebook.com/docs/instagram-platform/sharing-to-stories/):
  one background asset plus one optional sticker.

Neither is reachable from a web page — the UTI and the custom intent action both
require native code. `navigator.share()` can only produce a *generic* image
share, which is the undocumented path.

The only documented way to publish a real Carousel programmatically is the
[Instagram Content Publishing API](https://developers.facebook.com/docs/instagram-platform/content-publishing),
which needs a server, an Instagram Business/Creator account, and OAuth. It is
ruled out twice over by the map — ADR-0002 (nothing leaves the device) and
ADR-0003 (no direct publishing).

### What practitioners report

Thin and contradictory, which is itself the finding:

- Instagram returns a user-facing error, *"Couldn't share to Instagram. You can
  only share multiple photos and videos in the Instagram app"*, for at least some
  share payloads from other apps
  ([react-native-share#1442](https://github.com/react-native-share/react-native-share/issues/1442),
  iOS, closed stale). The string is Instagram's own and is the clearest evidence
  that Instagram actively refuses some externally-shared payloads and tells the
  user to do it in-app.
- Multiple reports that on Android, when several images are selected, Instagram's
  *Feed* and *Direct* destinations disappear from the sheet and only *Story*
  remains (Abhishek Maheshwari, ["Android app — share multiple files to
  Instagram"](https://abskmhswri-er.medium.com/android-app-share-multiple-files-to-instagram-be8ed12a652a);
  the page blocks automated fetch, so this is a summary of the indexed content,
  not a verified read).
- A 2023 walkthrough of exactly this web-to-social technique
  ([Sudolabs, 2023-09-19](https://sudolabs.com/insights/share-visual-content-from-web-to-social-media-without-api-or-sdk))
  demonstrates the OS sheet listing Instagram — but only for a **single** image,
  and it never addresses multi-file.

**Conclusion for Q1:** if Instagram appears for a multi-Slide share, the most
likely outcome is Stories (one Slide per Story frame), not a feed Carousel. A
feed Carousel from an external share is not documented by Meta anywhere and
should be assumed unavailable.

---

## Q2. Hard limits: file count, size, MIME types, user gesture

These are firm and come from engine source.

### Chromium (Android Chrome, Edge, Samsung Internet)

From [`navigator_share.cc`](https://github.com/chromium/chromium/blob/main/third_party/blink/renderer/modules/webshare/navigator_share.cc):

| Limit | Value | Failure |
|---|---|---|
| `kMaxSharedFileCount` | **10 files** | `NotAllowedError: "Permission denied"`, console warning `Share too large` |
| `kMaxSharedFileBytes` | **50 MiB total** (52,428,800 bytes) | same |
| `kMaxTitleLength` | 16 KiB | same |
| `kMaxTextLength` | 120 KiB on Android | same |
| `kMaxUrlLength` | 16 KiB | same |
| Filename | must be a safe base name (no `..`, no `/` or `\`) | same |

**10 files is a hard ceiling on Carousel length on Android**, below Instagram's
own 20. A Lineup of 6–8 Pours plus a cover Slide fits; a cover + 8 Pours + a
closing Slide is exactly 10 and leaves no headroom. Budget the Carousel at
**≤ 10 Slides**, and keep the whole set under 50 MiB — at 1080×1350 JPEG q0.85
(~250–500 KB each) that is not close to binding.

MIME types are allowlisted twice — by extension and by content type
([`share_service_impl.cc`](https://github.com/chromium/chromium/blob/main/chrome/browser/webshare/share_service_impl.cc),
kept in sync with the Android implementation and with
[`FILE_TYPES.md`](https://github.com/chromium/chromium/blob/main/third_party/blink/renderer/modules/webshare/FILE_TYPES.md)).
`image/jpeg` (`.jpg`/`.jpeg`), `image/png` (`.png`) and `image/webp` (`.webp`)
are all permitted; the full list is mirrored on
[MDN](https://developer.mozilla.org/en-US/docs/Web/API/Navigator/share#shareable_file_types).
A wrong or missing extension on the `File` name fails the share even when the
MIME type is right — **name the files `slide-1.jpg` etc., and match the type**.

### WebKit (iOS Safari)

From [`Navigator.cpp`](https://github.com/WebKit/WebKit/blob/main/Source/WebCore/page/Navigator.cpp):
**no file-count limit, no byte limit, no MIME allowlist.** WebKit only requires
that the `files` array be non-empty. Practical limits are memory and the time to
write the temporary files, not a coded cap.

### User gesture

Required by the spec — `share()` "consumes user activation" and rejects with
`NotAllowedError` without transient activation
([Web Share API spec, §share method](https://w3c.github.io/web-share/#share-method)).
Both engines implement it:

- Chromium: `LocalFrame::ConsumeTransientUserActivation(...)` →
  `NotAllowedError: "Must be handling a user gesture to perform a share request."`
- WebKit: `window->consumeTransientActivation()` → `NotAllowedError`.

`canShare()` is explicitly exempt and can be called without activation.

**This is the constraint that shapes ticket 02.** Transient activation is
consumed by the *first* `await`, and the gesture window is short. Slide
generation must not sit between the tap and the `share()` call. Either
pre-render the Slides before the Taster reaches the share control, or render on
tap and accept that `share()` will then be outside the activation window on some
browsers. Chromium has historically tolerated an intervening `await` on an
already-started promise; that is not something to build on. **Pre-render.**
Ticket 02 reached the same conclusion independently, from the wall-clock side
(five seconds of transient activation, not enough for 6–10 Slides), and recorded
it as ADR-0004.

Also: only one share may be in flight. WebKit rejects a second with
`InvalidStateError: "share() is already in progress"`; Chromium does the same off
Android (on Android the check is deliberately skipped, because Android does not
always report share completion — a comment in `navigator_share.cc` notes it
"goes against the web share spec to work around the platform-specific bug").
A corollary: **on Android, the promise resolving tells you nothing about whether
the Taster actually posted anything.** Do not build success UI on it.

---

## Q3. Versions, and does `canShare()` predict failure?

### Versions (MDN browser-compat-data, `api/Navigator.json`)

| | `navigator.share` | `share({ files })` | `canShare()` |
|---|---|---|---|
| Chrome Android | 61 | **76** | 75 |
| Safari iOS | 12.1 | **14** | 14 |
| Samsung Internet | — | 11.0 | — |
| Firefox Android | 79 | **never** | 96 |
| **Android WebView** | **never** | **never** | **never** |

Source: [mdn/browser-compat-data](https://github.com/mdn/browser-compat-data/blob/main/api/Navigator.json).
Note a discrepancy worth recording: BCD says Safari 14, while WebKit's own
release notes credit "Web Share level 2 … sharing files from a web page to an
app" to [Safari 15](https://webkit.org/blog/11989/new-webkit-features-in-safari-15/)
(iOS 15, September 2021). Treat **iOS 15+** as the reliable floor. Given it is
2026, neither floor excludes any phone that will be at an Event.

**The version that actually bites is Android WebView: no Web Share at all.**
If a Taster opens the Event link from inside another app's in-app browser on
Android — a link pasted into Instagram, Facebook or a similar app — `navigator.share`
is simply undefined and the share button is dead. QR scans normally open the
default browser, so this mostly threatens Tasters who receive the link
second-hand. The save-to-device fallback must therefore also cover
"`navigator.share` does not exist at all", not just "share failed".

Firefox Android never supports file sharing — same fallback.

### Does `canShare()` predict it? **No. Not for anything that matters.**

Read the implementations:

- **WebKit** `Navigator::canShare` checks only: document fully active, permissions
  policy allows web-share, and that at least one of title/text/url/non-empty
  files is present. It **never inspects file count, size, or MIME type**
  ([`Navigator.cpp`](https://github.com/WebKit/WebKit/blob/main/Source/WebCore/page/Navigator.cpp)).
- **Chromium** `canShare` calls `CanShareInternal`, which checks the same
  emptiness condition plus URL validity. The `kMaxSharedFileCount` /
  `kMaxSharedFileBytes` / filename checks live in `share()` only, and the MIME
  allowlist lives further down in the browser process
  ([`navigator_share.cc`](https://github.com/chromium/chromium/blob/main/third_party/blink/renderer/modules/webshare/navigator_share.cc)).

So `canShare({ files })` returns **true** for 11 files, for 80 MB, and for a
disallowed type — and `share()` then rejects with `NotAllowedError:
"Permission denied"`. The spec itself warns that `canShare()` yields false
positives ([§canShare](https://w3c.github.io/web-share/#canshare-data-method)).

And `canShare()` says nothing at all about whether Instagram is installed, will
appear as a target, or will accept the payload — the spec is explicit that once a
target has the payload "the share is considered successful… it cannot rely on the
sender to handle errors" ([§share method](https://w3c.github.io/web-share/#share-method)).

**Practical rule:** use `canShare({ files })` only as a coarse "does this browser
do file sharing at all" probe. Enforce the ≤10-file and ≤50 MiB budgets yourself
before calling. Then wrap `share()` in try/catch and treat *every* rejection —
including `AbortError`, which is also what a Taster who simply changed their mind
produces — as "offer the save fallback", never as an error message.

Failure modes to handle explicitly:

| Symptom | Cause | Response |
|---|---|---|
| `navigator.share` undefined | Android WebView, old browser | Save fallback only; hide the share button |
| `canShare({files})` false | no file support (Firefox Android) | Save fallback only |
| `TypeError` | empty/invalid share data | bug in our code |
| `NotAllowedError` | no user gesture, or over the 10-file / 50 MiB budget | bug in our code |
| `AbortError` | Taster cancelled, **or no share targets** | silent; leave the save fallback visible |
| Promise resolves | payload handed to *something* | **prove nothing**; keep the fallback visible |

---

## Q4. Slide dimensions, cropping, and Carousel length

All from Instagram's own Help Center — these are the current numbers and they
have moved recently, so re-check before the Event.

**Length.** *"Você pode compartilhar até 20 fotos e vídeos como um único post"* —
up to **20** photos and videos in one post
([help.instagram.com/269314186824048](https://www.facebook.com/help/instagram/269314186824048)).
Raised from 10 in 2024. Irrelevant to us: Chromium's 10-file cap binds first.

**Orientation is per-post, not per-Slide.** *"A orientação que você escolher
(quadrado, retrato ou paisagem) afetará todas as fotos ou vídeos no post. Você
não pode selecionar uma orientação diferente para cada foto ou vídeo."* The Taster
can drag to reframe each item individually, but one orientation governs the whole
Carousel (same source). **Every Slide must be rendered at the same aspect ratio**
— otherwise Instagram crops the odd ones out and the Taster has to fix each by
hand.

**Resolution and cropping.** *"When you share a photo with width between 320 and
1080 pixels, we keep that photo in original resolution provided the aspect ratio
stays between 1.91:1 and 3:4."* Wider than 1080 px is downscaled to 1080; narrower
than 320 px is upscaled; anything outside the ratio range is cropped
([help.instagram.com/1631821640426723](https://www.facebook.com/help/instagram/1631821640426723)).
Note the tall end is now **3:4** (1080×1440), not the older 4:5 — Instagram
extended it in 2025 alongside the 3:4 profile grid.

**Recommendation for ticket 08:** render Slides at **1080 × 1350 (4:5)**.

- It is inside the accepted range with margin at both ends, so it survives a
  future tightening back to 4:5 as well as the current 3:4 allowance.
- 1080 px wide is exactly the point where Instagram stops downscaling; going
  larger buys nothing and costs memory on the phone (ticket 02).
- 1080×1440 (3:4) is taller and legal today, but it is the boundary of the
  documented range and the profile-grid crop is less predictable there.

Recompression is unavoidable regardless — Instagram re-encodes on upload. Design
Slides that survive it: large type, flat backgrounds, no fine gradients behind
small text, no 1 px hairlines. Export **JPEG** (`image/jpeg`, `.jpg`): it is the
only format the Content Publishing API accepts, which is a good proxy for what
Instagram's pipeline prefers, and it is inside Chromium's allowlist.

Note the profile grid center-crops thumbnails — Instagram has cropped the grid
since [portrait and landscape were introduced in 2015](https://about.instagram.com/blog/announcements/introducing-landscape-and-portrait-formats-on-instagram)
and now uses 3:4 tiles. Keep the cover Slide's key content (the Event name, the
Taster's first name) inside a centred safe area rather than at the top or bottom
edge.

---

## Q5. What do other web apps actually do?

Honest answer: **almost nobody ships web → Instagram Carousel, and the ones who
try degrade to save-then-post.** The pattern across every implementation
found:

- The canonical write-up of this technique
  ([Sudolabs, 2023](https://sudolabs.com/insights/share-visual-content-from-web-to-social-media-without-api-or-sdk))
  shares **one** image via `navigator.share`, and its stated fallback is "display
  a fallback screen for unsupported browsers/OS combinations". It never attempts
  multi-file.
- Google's own guidance
  ([web.dev, Web Share](https://web.dev/articles/web-share)) covers files but
  makes no claim about which apps accept them, and treats the share sheet as
  opaque — consistent with the spec's position that the sender cannot know what
  the target did.
- Native apps with dedicated Instagram integrations use the documented
  single-asset paths (Stories intent / `com.instagram.photo` UTI). Libraries that
  wrap them — react-native-share and similar — carry long-lived open issues about
  multi-image Instagram sharing and no working answer
  ([react-native-send-intent#112](https://github.com/lucasferreira/react-native-send-intent/issues/112),
  open since 2019).
- Carousel-maker tools (the many "Instagram carousel generator" sites) are the
  closest analogue to what we are building, and they universally hand the user a
  **download** — individual images or a zip — and instruct them to post from the
  Instagram app. None of them claim a direct hand-off.

The degradation point is consistent and it is early: **the moment more than one
image is involved, everyone falls back to "save the images, then open Instagram
yourself".**

### What this means for the flow

The share hand-off screen (currently *Not yet specified* in the map) should be
designed around saving, not around Instagram:

1. Pre-render all Slides before the Taster reaches the screen (activation window,
   Q2), showing progress while it happens.
2. Primary action: **"Salvar as imagens"** → `navigator.share({ files })`, no
   other fields. On iOS the sheet's own **Save N Images** puts the whole Carousel
   in the camera roll in one tap. If Instagram happens to appear in the sheet,
   the Taster can take it — but the copy should not promise it.
3. Then a short instruction: open Instagram, +, select the Slides in order, post.
   Two or three lines, in pt-BR, on the same screen. This is the actual product
   surface where the Carousel is won or lost.
4. Fallback when `navigator.share` is missing or file sharing is unsupported
   (Android WebView, Firefox Android): per-Slide `<a download>` links, or a
   long-press-to-save grid. `download` is supported on Safari iOS 10.1+ and
   Chrome Android ([BCD, `HTMLAnchorElement.download`](https://github.com/mdn/browser-compat-data/blob/main/api/HTMLAnchorElement.json)),
   but on iOS it deposits files in the Files app rather than Photos, which is a
   worse destination for Instagram — so on iOS prefer the share sheet even when
   it is only being used to save.

Nothing here contradicts ADR-0003; it narrows it. `navigator.share({ files })` is
still the right mechanism. It is just being used to reach the **camera roll**,
not to reach Instagram.

---

## Confidence and gaps

**High confidence** (read directly from primary sources):

- Chromium's 10-file / 50 MiB / MIME-allowlist limits and the exact exceptions —
  read from `navigator_share.cc` and `share_service_impl.cc` on `main`.
- WebKit having no such limits, and both engines' `canShare()` being blind to
  them — read from `Navigator.cpp`.
- `ACTION_SEND_MULTIPLE` vs `ACTION_SEND` on Android, and the common-MIME-type
  rule — read from `ShareHelper.java` and `SharedFileCollator.java`.
- iOS passing temp **file URLs** to `UIActivityViewController`, with `text`/`url`
  added as sibling activity items — read from `WKShareSheet.mm`.
- Transient-activation requirement — spec plus both implementations.
- Browser versions — MDN browser-compat-data.
- Instagram's 20-item limit, per-post orientation, 320–1080 px width and
  1.91:1–3:4 ratio range — Instagram Help Center.

**Not verified — the important gaps:**

1. **Whether Instagram appears in the share sheet for a multi-file payload, on
   either platform, in September 2026.** This is the single question the ticket
   most needs answered and it cannot be answered from documentation, because Meta
   documents none of it and Instagram's iOS extension activation rules and
   Android manifest are not published. **It needs a 10-minute test on a real
   iPhone and a real Android phone** with the current Instagram build: generate
   three JPEGs, call `share({ files })`, photograph the sheet, tap Instagram, and
   record what opens. Do this before ticket 08 commits to a Slide count or a
   preview/reorder step. Re-test on the day of the Event — Instagram ships weekly.
2. **Whether picking Instagram produces a feed Carousel, Stories, or a single
   image.** Reports point to Stories-only on Android for multi-select, and the
   *"You can only share multiple photos and videos in the Instagram app"* error
   suggests outright refusal in some cases — but both are second-hand and dated
   (2022–2023).
3. **The Medium article on Android multi-file sharing to Instagram** (the source
   for "Feed and Chat disappear, only Story remains") blocks automated fetching;
   its claims come from indexed summaries, not a verified read. Worth a manual
   look, but it is a 2021-era post either way.
4. **The exact iOS floor for file sharing** — MDN says Safari 14, WebKit's release
   notes say Safari 15. Immaterial in 2026; noted for completeness.
5. **The 3:4 extension date and its interaction with carousels.** The Help Center
   currently states 1.91:1–3:4, which is authoritative for the range, but
   Instagram published no announcement post that could be located confirming when
   3:4 replaced 4:5 or whether every carousel surface honours it. The 4:5
   recommendation above is deliberately conservative for this reason.
6. **Whether the iOS share sheet's "Save N Images" preserves Slide order** in the
   camera roll. Very likely (files are written in array order), but unverified —
   and if it does not, the Taster has to reorder in Instagram's picker, which is
   a real cost worth measuring in the same 10-minute device test.
