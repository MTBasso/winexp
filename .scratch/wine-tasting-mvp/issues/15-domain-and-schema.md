# Implement the domain module, D1 schema and migrations

Type: task
Status: open
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
