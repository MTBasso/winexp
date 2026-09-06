# The Organizer passcode: what it protects and how

Type: grilling
Status: resolved
Blocked by: 06

## Question

One shared passcode is the entire authentication story, so its blast radius
should be a decision rather than an accident.

Decide:

- What the passcode actually protects: creating and editing Events, and nothing
  else — Impressions are not on the server to steal (ADR-0002).
- Where it is checked, so that it is not merely hiding the admin UI while the
  API stays open.
- How the passcode is stored and rotated, and who knows it.
- How long an Organizer stays signed in on their phone.
- The worst case if it leaks — someone edits a wine list — and whether that
  justifies anything more than a passcode.
- Whether reading an Event's Lineup is public (it must be — Tasters are
  unauthenticated) and what that means for guessable Event codes.

## Notes from ticket 03

Cloudflare-specific constraint discovered while researching deployment: do
**not** gate the admin by routing asset requests through the Worker
(`assets.run_worker_first`). On the free tier that converts free, unmetered
asset requests into billable Worker invocations which 429 when exhausted rather
than degrading gracefully. The passcode must be checked in the API, which
reinforces this ticket's question about hiding the UI versus protecting the
endpoint.

## Answer

**One shared passcode, sent as a bearer header on every admin API call, compared
server-side against a Wrangler secret.** No sessions, no tokens, no expiry.

- **What it protects:** creating and editing Events and Lineups. Nothing else.
  There are no Impressions on the server to steal (ADR-0002).
- **Where it is checked:** in the API, on every mutating route — never merely by
  hiding the admin UI. An admin that only hides buttons leaves the endpoints
  open, which is the one genuinely unsafe option.
- **Not** via `assets.run_worker_first`: on the free tier that converts free
  asset requests into billable Worker invocations which 429 rather than
  degrading (ticket 03).
- **Storage:** the passcode lives in `localStorage` on the Organizer's phone and
  is sent as `Authorization: Bearer <passcode>`. The secret itself is a Wrangler
  secret, never in the repo.
- **Rotation:** change the Wrangler secret and tell the group. Organizers
  re-enter it once.
- **Reading a Lineup is public and must be** — Tasters are unauthenticated. See
  ticket 10 for what that means for the Event code.

**The trade, stated plainly:** this stores a shared secret in cleartext in
`localStorage`, which would be indefensible if it guarded anything real. It
guards the ability to edit a wine list, and the worst case if it leaks is
someone changing a vintage. Signed tokens with expiry were rejected as real
session infrastructure for a threat model that does not justify it.

## Amendment — 2026-09-06

The passcode was questioned on the grounds that the app holds nothing sensitive.
That is true and is exactly ADR-0002 — but it is an argument about
*confidentiality*, and the passcode protects *writes*. With the mutating routes
open, anyone who finds the admin can edit or wipe any Lineup, including during a
live Event, and the Event codes are printed on the tables.

**Resolution: the passcode stays, and becomes invisible.** It is entered once,
kept in `localStorage`, and never asked for again on that device, so an
Organizer experiences no login. This keeps the write protection at zero
friction. Removing it entirely remains a one-line change in
`worker/index.ts` if that is preferred.
