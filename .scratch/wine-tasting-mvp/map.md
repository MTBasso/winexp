# Map: Wine Tasting MVP

Label: `wayfinder:map`

## Destination

A working, free-tier-hosted MVP at a public URL where a Taster at a roving wine
group's Event scans a per-Event QR code, is guided through rating each Pour as
it is served using plain-language Axes plus tappable Descriptors, writes a Note
of at most three lines, and shares an auto-generated Instagram-ready Carousel
from their phone — with Organizers managing Events and rotating Lineups through
a passcode-protected admin. Impressions never leave the device. Validated at one
real Event.

## Notes

**Domain**: wine tasting. Read [CONTEXT.md](../../CONTEXT.md) before writing any
ticket or code — the glossary is opinionated and the `_Avoid_` lists are
enforced. "Restaurant", "customer" and "review" are all wrong here.

**This map carries execution.** Wayfinder's default is plan-only, overridden
here: the Destination is a shipped, validated MVP, not a spec. Design decisions
are ticketed first; implementation graduates out of *Not yet specified* once the
decisions it depends on are closed.

**The scaffold exists.** Vite 8 + React 19 + TS 5.9 strict + Zustand + Vitest 5,
one Worker serving `/api/*` with static assets, per ADR-0001. `npm run dev`,
`npm test`, `npm run build`, `npm run deploy` all work. `src/App.tsx` is a shell
on purpose — the Taster flow is tickets 04/07/08, and building it now would
answer them by accident. The ticket-13 share probe lives at `/share-probe`.

**Skills every session should consult**: `/grilling` and `/domain-modeling` by
default; `/prototype` for `wayfinder:prototype` tickets; `/research` subagents
for `wayfinder:research` tickets; `/tdd` once implementation tickets exist.

**Settled while charting** (premises, not route steps — see the ADRs in
[docs/adr/](../../docs/adr/)):

- Stack: Vite + React 19 + TS strict + Zustand + Vitest on Cloudflare Workers
  with static assets; one Worker serves the Event API, backed by D1. Free tier
  throughout. (ADR-0001, amended by ticket 03 — it originally said Pages)
- Impressions are device-local only; no server persistence, no accounts.
  (ADR-0002)
- Sharing goes through `navigator.share({ files })` and is designed as a *save
  to camera roll, then post it yourself* hand-off; Instagram appearing in the
  sheet is a bonus, never a promise. (ADR-0003, rewritten after ticket 01)
- The Carousel is rendered ahead of time, never inside the share handler.
  (ADR-0004, from ticket 02)
- One group, not modelled — no multi-tenancy, one shared Organizer passcode.
- Per-Event QR codes, generated from the admin, not one permanent laminated QR.
- A Pour carries its own wine details; no reusable Wine catalogue.
- Impressions stay freely editable for the whole Tasting.
- Any Pour is rateable at any time — rate-as-served and rate-at-the-end are the
  same non-linear design.
- Menu cached on first load so the flow survives dead venue wifi; no service
  worker.
- pt-BR only, with copy in a lookup object from day one.

## Decisions so far

<!-- one line per closed ticket -->

- [Current Cloudflare free-tier deployment story](issues/03-cloudflare-deployment-story.md)
  — Workers with static assets, **not** Pages: Cloudflare now tells new projects
  to start with Workers, though Pages is not deprecated. ADR-0001 amended and
  renamed. Free-tier headroom is vast — only `/api/*` calls are billable, ~250
  Events/day before any ceiling.

- [Generating Carousel Slides client-side on a phone](issues/02-client-side-image-generation.md)
  — `@zumer/snapdom` 2.24.15 capturing React/CSS Slides from the live DOM. The
  load-bearing finding: `navigator.share()` gets five seconds of transient
  activation, so **Slides must be pre-rendered before the share control is
  tappable** (ADR-0004). No raster images on Slides, self-hosted fonts only.

- [Sharing a Carousel from mobile web into Instagram](issues/01-share-carousel-into-instagram.md)
  — **partly**. The share sheet works; the Instagram half is undocumented and
  unreliable, so the hand-off is built around *saving* Slides plus instructions
  (ADR-0003 rewritten). Slides are 1080x1350 JPEG, Carousel capped at 10 by
  Chromium's limits. `canShare()` cannot gate any of it.

- [Toolchain versions](issues/11-toolchain-versions.md) — Vitest 5 with no
  `vitest-pool-workers` (the Worker is too thin to justify pinning the runner a
  major version back), TypeScript 5.9.3 rather than 7.x until Cloudflare's
  toolchain documents support. No ADR: ordinary, reversible dependency picks.

- [Verify multi-file share on real devices](issues/13-device-share-test.md) —
  **Android works**: the sheet raises with Slides attached, Instagram appears as
  a target, and saving preserves Slide order. No defensive Slide numbering
  needed. ADR-0003's stance is unchanged — one observation is not a contract.
  iOS unverified, split into ticket 14.
- [Event lifecycle](issues/05-event-lifecycle.md) — **no states at all.** An
  Event exists once created, its QR opens forever, and its date is shown so
  nobody rates into the wrong dinner. Lineups stay editable at any time and an
  Impression is never destroyed, so a local Tasting must tolerate Pours the
  server no longer has. Name and date both required.

- [The Taster flow](issues/04-taster-flow.md) — a dark full-screen **deck**, one
  Pour per card, name asked on card 0 before the first bottle, the deck opening
  on the Pour *being served now* when a Taster returns, and a closing card
  carrying the share control.
- [The guided rating screen](issues/07-guided-rating-screen.md) — **"ou / ou"**:
  each of four plain-language Axes is a two-way tap, plus up to three tapped
  Descriptors and a Note clamped at 140 graphemes. Accepted trade: no middle
  value anywhere, including on *O quanto você gostou?*.
- [The Carousel](issues/08-carousel-design.md) — **Editorial**: paper ground,
  serif, Axis answers as a labelled list, Note as a pull quote. Cover + one
  Slide per rated Pour, hard-capped at 10 files with the cover dropped first.
  Fixed a `box-sizing` bug that would have clipped every captured Slide.

- [Verify the share flow on an iPhone](issues/14-ios-share-verification.md) —
  **works.** Both engines confirmed; the share hand-off is no longer a risk to
  the Destination on either platform.

- [The Organizer flow](issues/06-organizer-flow.md) — **"lista viva"**: name and
  date edited in place, the Lineup is the page, rows expand to edit, reordering
  inside the expanded row. **The QR exists from the moment the Event does** —
  the only reading consistent with Events having no states.

- [The Organizer passcode](issues/09-organizer-passcode.md) — one shared
  passcode as a bearer header on every mutating route, checked in the API and
  never only in the UI, compared against a Wrangler secret. No sessions. The
  cleartext-in-localStorage trade is accepted: it guards a wine list.
- [The data model and Event code](issues/10-data-model.md) — six-character
  Crockford base32 code (typeable, non-sequential); `events` + `pours` in D1 and
  **no Impressions table**; four routes with the Lineup replaced wholesale; one
  `localStorage` key per Event so a new Event starts from zero, migrating rather
  than discarding, with each Impression carrying a copy of its Pour's details so
  a Tasting is self-sufficient.

- Implementation: [domain and schema](issues/15-domain-and-schema.md),
  [the Event API](issues/16-event-api.md) and
  [the Organizer admin](issues/17-organizer-admin.md) are built and verified
  against a local D1. The admin can copy a past Lineup into a new Event — a
  plain copy with fresh ids, so the source is never touched.
- [The Taster deck](issues/18-taster-deck.md) is built and deployed: a QR scan
  lands on `/e/:code`, the Event is cached so the evening survives dead wifi,
  and the local Tasting keeps Impressions whose Pour an Organizer removed.
  **Live at https://wine-tasting.araraquarawinexp.workers.dev**
- [The Carousel and the share hand-off](issues/19-carousel-rendering.md) — Slides
  captured with snapdom at `dpr: 1`, pre-rendered before the control enables,
  handed to `navigator.share({ files })` with per-Slide downloads as the
  fallback. The flow is complete end to end.

## Not yet specified

- **The pt-BR copy pass** across the whole app. Depends on the Axis and
  Descriptor wording, which is the bulk of it.
- **Testing Slide image generation** — whether it can be meaningfully tested at
  all, or only checked by hand on real phones. Depends on ticket 02. (The
  toolchain half of this graduated into ticket 11.)
- **In-app browsers** — a QR scanned from inside another app lands in a WebView
  with no Web Share API at all. How far to go in detecting and escaping that is
  not yet clear; it may be a line of copy or a real problem.
- **What "validated at one real Event" concretely means** — what is watched for
  on the night, what would count as failure.

## Out of scope

Ruled beyond this Destination. These never graduate; revisiting one means a new
effort with a redrawn Destination.

- Group-facing analytics or any dashboard over Impressions — follows from
  ADR-0002.
- Taster accounts, login, and cross-Event review history.
- Any language but pt-BR.
- Venue or restaurant self-service onboarding.
- Integration with an external wine catalogue (Vivino and similar); manual entry
  of 6–8 bottles is faster than integrating anything.
- Direct-to-Instagram publishing that bypasses the OS share sheet — ADR-0003.
- Payments.
- Full PWA with a service worker and offline install.
- Multi-group multi-tenancy.
- A reusable Wine catalogue with a picker — additive later, not now.
- Server-side persistence of Impressions — ADR-0002.
