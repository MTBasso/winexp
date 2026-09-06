# The data model and the Event code scheme

Type: grilling
Status: open
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
