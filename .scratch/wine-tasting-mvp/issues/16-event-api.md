# Implement the Event API in the Worker

Type: task
Status: claimed
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
