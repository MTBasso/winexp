# Build the Taster deck for real

Type: task
Status: open
Blocked by: 16

## Question

Promote the deck (ticket 04) and the "ou / ou" rating screen (ticket 07) to
production code.

- Scan lands on `/e/:code`; the Event and Lineup are fetched once and cached so
  the flow survives dead venue wifi.
- Card 0 asks the first name before the first bottle; the deck opens on the Pour
  being served when a Taster returns.
- The rating sheet, with the Note clamped by grapheme.
- The local Tasting exactly as ticket 10 specifies: `tasting:<code>`, per-Event
  so a new Event starts from zero, migrating rather than discarding, keeping
  unknown Pour ids, and storing a copy of each Pour's details on the Impression.
- Error and empty states: unknown code, empty Lineup, nothing rated yet.
