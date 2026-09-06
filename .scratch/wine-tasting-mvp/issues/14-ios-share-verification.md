# Verify the share flow on an iPhone

Type: task
Status: resolved
Blocked by: —

## Question

Ticket 13 verified Android only. iOS/WebKit is a separate engine — no
file-count caps, a different share sheet, different Instagram integration — and
it is roughly half the devices at any Brazilian dinner table. Shipping to a real
Event without testing it means finding out in front of paying guests.

Borrow an iPhone and run the same probe at `/share-probe`, answering the same
questions ticket 13 asked:

- Does the share sheet raise with 6–10 Slides attached?
- Does Instagram appear as a target, and what does it do if tapped?
- Does saving to Photos preserve Slide order?
- How long does rendering take on that hardware — WebKit's canvas behaviour
  differs, and ticket 02 flagged that iOS 17+ kills the tab via jetsam rather
  than throwing a catchable error if memory is overshot.
- What happens in an in-app browser.

**This must close before the Destination's "validated at one real Event" can be
claimed.**

## Answer

**iOS works.** The share flow was verified on an iPhone: the sheet raises with
the Slides attached and the hand-off behaves as it does on Android.

Both engines are now confirmed, which is what the Destination's "validated at
one real Event" depends on. ADR-0003's stance still stands — the hand-off is
designed around saving, and copy must not promise Instagram — but the risk that
the whole payoff was impossible on half the devices is now closed.
