# The Organizer passcode: what it protects and how

Type: grilling
Status: open
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
