# Cloudflare Workers with static assets + D1

The only server-side state this product has is a list of Events and their
Lineups — Impressions never reach a server (see ADR-0002) — so the backend is a
handful of JSON reads per Event. We host the Vite/React client as static assets
on a single Cloudflare Worker, which also serves the small Event API, backed by
D1. It stays far inside the free tier and reuses Cloudflare experience already
in this codebase's neighbourhood.

## Considered Options

Next.js on Vercel with Neon Postgres, and static hosting plus Supabase, were
both rejected as more managed surface than "a few rows of wine" justifies. D1
was chosen over KV because Events→Pours is genuinely relational and Organizers
will want to list past Events.

**Cloudflare Pages was this ADR's original choice and was reversed** by the
research in
[03-cloudflare.md](../../.scratch/wine-tasting-mvp/research/03-cloudflare.md).
Cloudflare's own Pages documentation now leads with "Are you sure you want to
use Pages? … Start new projects with Workers." Pages is **not** deprecated and
has no announced sunset — it is simply no longer the recommended starting point
for a new project. The reasoning above was unaffected by the reversal; only the
hosting primitive changed, and D1 is identical on both.

## Consequences

Custom domains must sit on a Cloudflare-managed zone — Workers cannot serve a
custom domain on a zone hosted elsewhere, which Pages could. Irrelevant here,
and `*.workers.dev` may be enough given Tasters arrive by QR code rather than by
typing a URL.

Static asset requests are free and unbilled, and with a compatibility date of
2025-04-01 or later navigation requests bypass the Worker entirely — so only
`/api/*` calls consume the 100,000 daily invocations. Do not route asset
requests through the Worker (`assets.run_worker_first`) without a specific
reason: on the free tier it converts free requests into billable ones that 429
rather than degrading.
