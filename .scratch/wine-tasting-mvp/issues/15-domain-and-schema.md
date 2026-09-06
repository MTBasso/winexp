# Implement the domain module, D1 schema and migrations

Type: task
Status: resolved
Blocked by: —

## Question

Graduated from the fog now that ticket 10 has settled the shapes. The foundation
both other implementation tickets build on.

- `src/domain/` with `Event`, `Pour`, `Impression`, `Tasting`, `Axis`,
  `Descriptor` — names verbatim from CONTEXT.md, imported by client and Worker
  alike.
- The Event code generator: six characters of Crockford base32, random.
- `migrations/0001_create_events_and_pours.sql` replacing the placeholder, with
  the schema exactly as ticket 10 records it. **No Impressions table** —
  ADR-0002.
- The D1 binding restored to `wrangler.jsonc`, and `npm run cf-typegen` re-run.
- Pure unit tests for the code generator and any validation helpers.

## Answer

Done.

- `src/domain/types.ts` — `Event`, `Pour`, `PourDetails`, `Axis`, `Impression`,
  `Tasting`, names verbatim from CONTEXT.md, shared by client and Worker.
- `src/domain/eventCode.ts` — generator plus `normaliseEventCode`, which maps
  the letters Crockford reads as digits (I and L to 1, O to 0) and strips
  separators, so a Taster typing a printed code by hand in bad light succeeds.
  U is deliberately *not* remapped: Crockford drops it to avoid accidental
  obscenity, not because it collides.
- `migrations/0001_create_events_and_pours.sql` — the real schema, with comments
  recording why there is no Impressions table and no lifecycle column.
- D1 binding restored, `wrangler types` re-run, `DB: D1Database` available.

**Local dev works with a placeholder `database_id`** — miniflare keys its local
D1 off the binding name — but `wrangler deploy` does not. Run
`wrangler d1 create wine-tasting` and paste the real id before deploying;
`wrangler.jsonc` says so at the binding.

11 new tests, 17 total.
