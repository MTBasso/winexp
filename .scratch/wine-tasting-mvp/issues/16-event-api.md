# Implement the Event API in the Worker

Type: task
Status: resolved
Blocked by: 15

## Question

The four routes from ticket 10, in `worker/index.ts`:

- `GET /api/events/:code` — public, returns the Event and its Lineup ordered by
  position. The only route a Taster calls.
- `POST /api/events` — passcode, server-generated code.
- `PATCH /api/events/:id` — passcode, name and date.
- `PUT /api/events/:id/pours` — passcode, replaces the whole Lineup.

With it: the bearer-passcode check from ticket 09 applied to every mutating
route and never to the public one, a Wrangler secret for the passcode, honest
404s for unknown codes, and validation that rejects an Event without a name or
date.

## Answer

Implemented in `worker/index.ts`, with the parsing and auth logic split into
`worker/api.ts` so it is testable without workerd — which is what ticket 11's
choice of plain Vitest depends on.

All four routes verified end to end against a real local D1:

| check | result |
|---|---|
| create without a passcode | 401 |
| create with the wrong passcode | 401 |
| create without a date | 400, *"Data é obrigatória"* |
| create | 201 with a generated code |
| replace Lineup | replaces rather than accumulates; positions reassigned from array order |
| clear Lineup to empty | accepted — an Organizer may empty the list |
| public read by code, no auth | full Event and ordered Lineup |
| read with a lowercased code | resolves, via `normaliseEventCode` |
| unknown code | 404 |
| patch unknown id | 404 |

Decisions made while building:

- **Positions are reassigned from array order**, never trusted from the client.
  A client-sent `position` invites gaps and duplicates, and the live-list admin
  already treats array order as the truth.
- **The Lineup replace runs as a `D1.batch`**, so a failure cannot leave an
  Organizer with half a wine list on the table.
- **Code generation retries on a UNIQUE collision** rather than assuming ~1e9
  is wide enough to ignore.
- **`isAuthorised` fails closed when the secret is unset.** Getting that
  backwards would open every mutating route in any environment missing the
  secret.
- `GET /api/events` (list, passcode-protected) was added for the admin's past
  Events, which ticket 06 kept.

The passcode is a Wrangler secret. `.dev.vars` holds it for local development
and is gitignored; `.dev.vars.example` is committed.

14 new tests, 31 total.
