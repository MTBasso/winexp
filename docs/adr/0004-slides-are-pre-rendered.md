# Slides are pre-rendered before the share control becomes tappable

`navigator.share()` requires transient activation, and both engines grant
exactly five seconds of it per user gesture — WebKit's
`defaultTransientActivationDuration { 5_s }` and Chromium's
`kActivationLifespan = base::Seconds(5)`. Rendering six to ten Slides at
1080x1350 on a mid-range phone does not fit in that budget, so a Carousel cannot
be generated inside the share handler. The whole Carousel is rendered in advance,
in the background, and the share control stays disabled until it is ready; the
share handler contains the `share()` call and nothing else.

## Consequences

The Taster flow needs a rendering state that is visible in the UI — the share
control is not simply always available. Editing an Impression invalidates the
Carousel and must re-render before the control re-enables.

A failed share cannot be retried programmatically: the activation is already
spent, so any automatic retry is guaranteed to fail. Retry means a fresh tap by
the Taster.

**Do not "optimise" this by moving generation into the share handler.** It will
appear to work on a desktop browser and fail on the phones this product runs on.

Note that a common belief — that `await` before `share()` breaks iOS — is wrong.
WebKit moved to transient activation in bug 197779 in January 2020, predating
file-sharing support entirely. The constraint is wall-clock time, not the
presence of an await.
