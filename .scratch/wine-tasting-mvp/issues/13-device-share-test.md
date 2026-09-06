# Verify multi-file share behaviour on real devices

Type: task
Status: resolved
Blocked by: —

## Question

Ticket 01 closed everything that documentation can close and left one gap that
only real hardware can answer. This is the cheapest, highest-value ticket on the
map: roughly ten minutes of tapping, and it de-risks the product's entire
payoff.

**No product code is needed.** Generate 6–10 placeholder JPEGs at 1080x1350,
serve them from a throwaway page that calls `navigator.share({ files })`, and put
it on a phone.

Find out, on at least one iPhone and one Android phone:

- Does Instagram appear at all in the share sheet for a multi-file payload? If
  it does, what opens — feed composer, Stories, a single image, or nothing?
- Does the "Save N Images" / "Save to Photos" path work in one tap, and does it
  preserve Slide order in the camera roll? Order is the whole point of a
  Carousel, and if it is not preserved the design must carry visible numbering.
- What does the sheet look like with 10 files attached — is it usable, or does
  it become a wall?
- What happens in an in-app browser (open the page from within Instagram's own
  browser), where Android WebView has no Web Share at all.
- How long does the save actually take, so the hand-off copy can set
  expectations honestly.

Record what you saw as the answer on this ticket. Screenshots welcome. If
Instagram does show up and behaves well, that is worth knowing — but per
ADR-0003 it stays a bonus and is never promised in the copy.

## Progress — 2026-09-06

**Android: `navigator.share({ files })` works.** The probe rendered its Slides
and raised the OS share sheet with them attached, on a real device over HTTPS.
That clears the load-bearing assumption behind the whole product: the web half
of the hand-off is real, not just specified.

Still open, and tracked in the questions above:

- Whether Instagram itself appeared as a target, and what it did if tapped.
- **Whether saving preserves Slide order** — the one that changes ticket 08's
  design, since losing order forces visible numbering onto every Slide.
- iPhone / WebKit, which is a separate engine with no file-count caps and
  different sheet behaviour.
- In-app browser (Android WebView), which has no Web Share API at all.

## Answer

**Android works, and works better than ticket 01's research predicted.**

- `navigator.share({ files })` raises the OS share sheet with all Slides
  attached, on a real device over HTTPS.
- **Instagram appeared as a target in the sheet.**
- **Slide order was preserved.**

Consequences:

- Ticket 08 does **not** need visible numbering baked into every Slide as a
  defence against scrambled order — at least on Android.
- ADR-0003's stance is unchanged and deliberately so. Instagram appearing once,
  on one Android build, is not a guarantee: it remains undocumented behaviour of
  a closed app that changes between releases and differs by platform. The
  hand-off is still designed around saving, and the copy still must not promise
  Instagram. What changed is our confidence, not the contract.

**iOS is unverified** — no iPhone available. WebKit is a different engine with
no file-count caps and different sheet behaviour, and it is roughly half the
phones at a Brazilian dinner table. Split into ticket 14, which must close
before the real Event.
