# Event lifecycle: when is an Event live, and what happens after it ends

Type: grilling
Status: resolved
Blocked by: —

## Question

Events are first-class and two may run at once, so "which Event am I in" is
answered by the QR — but the Event's own states are undecided, and both the
Organizer admin and the data model wait on them.

Decide:

- What states an Event has — draft, live, ended? — and who moves it between
  them, deliberately or by date.
- Whether an Organizer can edit a Lineup while an Event is live, and what a
  Taster mid-Tasting sees when a Pour is added, edited, or removed underneath
  them.
- What happens when a QR for a past Event is scanned: does it still open, and
  can a Taster still finish and share a Tasting from last month?
- Whether Events are ever deleted, and what that does to a Tasting held on a
  phone that references them.
- Whether an Event needs a scheduled date at all, or just exists once created.

## Answer

**An Event has no states at all.** It exists once created; there is no draft,
no publish step, no live flag, no ended flag. An Organizer building a Lineup an
hour before service must never face a publish button, and "why is my QR blank"
at a live Event is the worst failure this product could have. Nothing in the
system needs to know an Event is over, because Impressions are device-local and
there is no window to close.

**A past Event's QR opens forever, unchanged.** A Taster reopening last month's
link to finally share their Carousel is a feature, not an edge case. The Event's
**date is shown on screen** so nobody rates into the wrong dinner by accident.

**Organizers may edit a Lineup at any time, including mid-Event, and an
Impression is never destroyed.** A removed Pour disappears from the Lineup, but
any Impression already recorded against it stays on the device and still appears
in that Taster's Carousel. The alternative — deleting someone's opinion because
an Organizer fixed a typo — is unacceptable.

**Consequence for ticket 10:** a local Tasting must survive referencing Pours
that no longer exist server-side, so the device cannot treat the server's Lineup
as authoritative over its own Impressions. Reconciliation is by Pour id, and
unknown ids are kept, not pruned.

**An Event requires both a name and a date.** A name the group recognises
("Douro, casa da Ana") and a date — one field each at creation, and together
they make a past-Events list navigable.
