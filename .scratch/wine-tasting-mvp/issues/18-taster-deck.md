# Build the Taster deck for real

Type: task
Status: resolved
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

## Answer

Built. A QR scan now lands somewhere: `/e/:code`, live in production.

- **The deck** (ticket 04) with card 0 asking the first name before the first
  bottle, *"Sendo servido agora"* on the next unrated Pour, and re-entry opening
  there rather than at the start.
- **The "ou / ou" rating sheet** (ticket 07), with the Note clamped by grapheme.
- **The local Tasting** exactly as ticket 10 specifies. Every rule is covered by
  a test, because this is where a bug costs someone their evening:
  - scoped per Event, so a different degustação starts from zero;
  - an older version **migrates**, never discards;
  - Impressions for Pours the Organizer removed are **kept** and stay renderable
    from their own stored copy of the wine details;
  - unreadable storage degrades to an empty Tasting rather than throwing.
- **Offline**: the Event is cached on first load. A non-404 network failure
  falls back to the cache and shows a bar saying so, while a 404 is treated as a
  real answer. Once the page has opened once, the whole evening works with no
  connectivity.
- **States**: invalid code, unknown code, empty Lineup ("quem organiza ainda
  está montando"), load failure with a retry, and nothing-rated-yet.

The closing card's share button is deliberately disabled and says so — the
Carousel is ticket 19.

18 new tests, 60 total.

### Regression found and fixed

Wiring the real `database_id` for deploy silently emptied the **local** D1:
miniflare keys local databases by that id, not by binding name, so dev pointed
at a fresh database and every `/api/*` call began returning 500. Fixed by
re-running `npm run migrate` and `npm run seed`, and documented in DEPLOY.md so
the next person does not debug it from scratch.
