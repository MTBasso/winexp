# Carousels are handed to the OS share sheet for saving, not published to Instagram

There is no supported path for publishing a Carousel to an ordinary person's
Instagram feed from a mobile web page. The Graph Content Publishing API needs a
server and a Business account, and Meta's only two documented share-into-Instagram
integrations — Sharing to Feed and Sharing to Stories — are both single-asset and
both native-only, requiring a private UTI or a custom intent that
`navigator.share()` cannot produce. We therefore generate the Slides client-side
and pass them to `navigator.share({ files })`, and we build the hand-off around
**saving the Slides to the camera roll**, followed by instructions to post from
the Instagram app.

## Consequences

Whether Instagram appears in the share sheet for a multi-file payload — and what
it does if tapped — is undocumented behaviour of a closed app that varies by
platform and by Instagram release. We neither depend on it nor advertise it.

Ticket 13 observed Instagram *did* appear on one Android device, and that saving
preserved Slide order. That raises our confidence; it does not change this
decision. One observation on one build of a closed app is not a contract, iOS
remains unverified (ticket 14), and copy that promises Instagram would be a
promise we cannot keep. It
also cannot be feature-detected: `canShare()` inspects only that the file array
is non-empty, so it cannot predict the presence or behaviour of any target.

The last step of the flow belongs to the Taster and the OS, so it cannot be
instrumented or guaranteed. Direct publishing is out of scope for this effort —
this ADR exists so it is not re-proposed as an oversight.

Pass `{ files }` only. On iOS, sibling `text` and `url` members become separate
activity items and degrade the sheet.
