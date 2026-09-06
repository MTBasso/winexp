# Current Cloudflare free-tier deployment story for a Vite SPA + API + D1

Type: research
Status: resolved
Blocked by: —

## Question

ADR-0001 picks Cloudflare Pages + Pages Functions + D1. Cloudflare has been
actively reshaping this area (Workers static assets vs Pages), so confirm the
current recommended shape before any project scaffolding is committed to.

Establish:

- As of now, what is Cloudflare's recommended way to deploy a Vite SPA with a
  small API and a D1 binding — Pages, or Workers with static assets? Is Pages
  being sunset for new projects?
- The free-tier limits that actually apply: requests, D1 rows read/written,
  D1 database size, build minutes.
- Local development: how to run the SPA and the API together with a local D1,
  and how migrations are applied to a remote D1.
- Custom domain setup and what it costs.
- The minimal working example: config file, directory layout, and deploy
  command, pinned to current tool versions.

Record findings in `.scratch/wine-tasting-mvp/research/03-cloudflare.md`. If the
recommended shape has moved away from Pages, say so plainly — ADR-0001 should be
amended rather than quietly contradicted.

## Answer

**Use Workers with static assets, not Pages. ADR-0001 amended and renamed to
[0001-cloudflare-workers-d1.md](../../../docs/adr/0001-cloudflare-workers-d1.md).**

Cloudflare's Pages docs landing page now opens with "Are you sure you want to
use Pages? … Start new projects with Workers." Pages is **not** deprecated and
has no announced sunset — it is no longer the recommended starting point, which
is a weaker claim and should be stated as such. The ADR's reasoning survived
intact; only the hosting primitive changed, and D1 is identical either way. The
single capability lost is custom domains on non-Cloudflare zones, which does not
matter here.

**Free-tier headroom is enormous.** Static asset requests are free and
unlimited, and at compatibility date ≥ 2025-04-01 navigation requests — every QR
scan — bypass the Worker entirely, so only `/api/*` calls count against the
100,000 daily invocations. A 40-Taster Event costs roughly 400 invocations,
leaving room for about 250 Events per day. D1 free tier allows 5M rows read per
day and 500 MB of storage against a few hundred rows total. Builds get 3,000
minutes per month. A custom domain costs only the at-cost registrar fee.

**Gotchas carried forward:**

- A toolchain version fork was surfaced and graduated into ticket 11.
- Do not set `assets.directory` when using the Vite plugin.
- Do not use `assets.run_worker_first` to gate the admin UI — on the free tier
  it converts free asset requests into billable invocations that 429 rather than
  degrading. Passcode checks belong in the API. Noted on ticket 09.

Full findings, with sources and a minimal working example:
[research/03-cloudflare.md](../research/03-cloudflare.md).
