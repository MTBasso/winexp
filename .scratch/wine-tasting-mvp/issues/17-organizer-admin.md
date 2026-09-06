# Build the Organizer admin for real

Type: task
Status: open
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
