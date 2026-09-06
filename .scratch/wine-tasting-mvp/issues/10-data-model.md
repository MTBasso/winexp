# The data model and the Event code scheme

Type: grilling
Status: resolved
Blocked by: 05, 06, 07

## Question

With the flows and the lifecycle settled, pin down the shapes — the last
decision before implementation graduates out of the fog.

Decide:

- The server-side schema: Events and their Pours, following the denormalised
  decision (a Pour carries its own wine details), in D1.
- The Event code that appears in the QR URL: length, alphabet, whether it must
  be unguessable, and how it relates to ticket 09's answer.
- The shape of a Tasting as held on the device: Impressions keyed how, and
  scoped to an Event how.
- The API surface: what the Taster's client fetches on scan, and what the
  Organizer's admin calls.
- Which types are shared between client and Functions, and where they live.

Follow [CONTEXT.md](../../../CONTEXT.md) — the type names are the domain terms.

## Notes from ticket 05

Events have no lifecycle states, and Lineups are editable at any time while
Impressions are never destroyed. So the local Tasting must tolerate Impressions
whose Pour no longer exists on the server: reconcile by Pour id, keep unknown
ids rather than pruning them, and never let the server's Lineup delete local
work. An Event carries a required name and a required date.

## Answer

### The Event code

**Six characters of Crockford base32** — alphabet `0123456789ABCDEFGHJKMNPQRSTVWXYZ`,
which drops I, L, O and U so nothing is ambiguous in print. About one billion
combinations: not enumerable in practice, and short enough that a Taster can
*type* it when restaurant lighting defeats their camera. Random, never
sequential — sequential codes would let anyone walk the group's whole history.

The code is public by necessity. What it exposes is a wine list.

### D1 schema

```sql
CREATE TABLE IF NOT EXISTS events (
  id         TEXT PRIMARY KEY,
  code       TEXT NOT NULL UNIQUE,
  name       TEXT NOT NULL,
  date       TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS pours (
  id       TEXT PRIMARY KEY,
  event_id TEXT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  position INTEGER NOT NULL,
  name     TEXT NOT NULL,
  producer TEXT NOT NULL DEFAULT '',
  vintage  TEXT NOT NULL DEFAULT '',
  grape    TEXT NOT NULL DEFAULT '',
  country  TEXT NOT NULL DEFAULT ''
);
```

No Impressions table. Its absence is ADR-0002, not an oversight. There is no
lifecycle column either — ticket 05 gave Events no states.

### API surface

| route | auth | purpose |
|---|---|---|
| `GET /api/events/:code` | public | Event + Lineup. The only route a Taster calls. |
| `POST /api/events` | passcode | Create an Event, server-generated code. |
| `PATCH /api/events/:id` | passcode | Name and date. |
| `PUT /api/events/:id/pours` | passcode | Replace the entire Lineup in one call. |

**The Lineup is replaced wholesale, not edited per Pour.** The live-list admin
changes fields, order and membership continuously; sending the whole array is
one endpoint instead of five, makes reordering trivial, and a Lineup is a
handful of rows. Per-row CRUD would be more orthodox and more code for no gain.

### The local Tasting

One `localStorage` key per Event, `tasting:<code>`, holding a `version`, the
Taster's optional first name, and Impressions keyed by Pour id.

- **Scoped per Event, so a new Event always starts from zero.** Scanning a
  different degustação never inherits anything from the last one.
- **A version mismatch migrates, never discards** — discarding deletes
  someone's evening.
- **Unknown Pour ids are kept, not pruned.** They are Pours an Organizer
  removed, and ticket 05 says the Impression survives.
- **Each Impression stores a copy of its Pour's wine details at rating time.**
  This is what makes the above possible: a Tasting is fully self-sufficient, so
  a Slide can be rendered from the Impression alone even when the Pour is gone
  from the server. Cheap, because Pours are already denormalised.

### Shared types

`src/domain/`, imported by both the client and the Worker — the Vite plugin
builds them together, so no package boundary is needed. Names come verbatim from
[CONTEXT.md](../../../CONTEXT.md): `Event`, `Pour`, `Impression`, `Tasting`,
`Axis`, `Descriptor`, `Slide`. The glossary was written to be the type names.
