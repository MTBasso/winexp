# Build the Organizer admin for real

Type: task
Status: resolved
Blocked by: 16

## Question

Promote the "lista viva" prototype (ticket 06) to production code against the
real API. The prototype was written under prototype constraints — no error
handling, no persistence — so this is a rewrite, not a move.

- The passcode gate, holding the passcode in `localStorage` and sending it as a
  bearer header.
- Create an Event; edit name and date in place; the Lineup as the page with rows
  expanding to edit, reordering, and removal.
- Saving: the whole Lineup replaced on change, debounced, with a visible saved
  state and an honest failure state — an Organizer at a venue needs to know
  their list is safe.
- The printable QR sheet with a real QR encoder, and a print stylesheet.
- Past Events.

## Added scope — 2026-09-06

**Populate a new Event's Lineup from a past one.** Organizers tap a previous
degustação and its wines are copied into the Event they are building, as a
starting point to edit rather than a link.

This fits the model exactly as charted: a Pour already carries its own wine
details and there is no Wine catalogue, so copying is a plain array copy with
fresh Pour ids. It gives most of a catalogue's value — never retyping the
regulars — without any of its machinery, and the copies stay independent, so
editing this month's Douro cannot rewrite last month's.

Also: seed a realistic test Lineup so the Taster deck has something to run
against before a real menu exists (ticket 18).

## Answer

Built at `/admin`, against the real API.

- **The passcode is asked once per device and never again.** Held in
  `localStorage`, verified on load with the cheapest authenticated call, and a
  network failure is explicitly *not* treated as a wrong passcode — locking an
  Organizer out because venue wifi blinked would be the worst possible bug here.
- **Autosave with an honest status.** Debounced at 800ms; the badge shows
  saving, saved, or the failure message. A failed save **keeps the pending
  value and retries on the next edit** rather than dropping it.
- **Name and date edited in place**, the Lineup is the page, rows expand, ↑/↓
  reorder, remove. Positions are renumbered client-side and re-derived
  server-side from array order.
- **Copy from a previous degustação** — the requested feature. Fetches the
  source Lineup and appends it as a plain copy with fresh Pour ids. Verified
  end to end that the source is untouched afterwards, which is what makes it
  safe: editing this month's Douro cannot rewrite last month's.
- **A real QR encoder** (`qrcode` 1.5.4) pointing at `/e/<code>`, with the code
  printed underneath as a typeable fallback, plus a print stylesheet that hides
  everything except the sheet.
- **Past Events** listed both on the new-Event screen (to open) and inside an
  Event (to copy from).

### Seed data

`npm run seed` loads two realistic degustações — `TESTE1` (7 wines, Douro) and
`TESTE2` (5 wines, Toscana) — so the Taster deck has something to run against
before a real menu exists. `npm run migrate` applies migrations locally. Both
are re-runnable.
