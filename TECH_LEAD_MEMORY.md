# Tech Lead Memory

## Project
Wine Tasting — Cloudflare Workers + React + D1 app for running wine tasting events: tasters rate pours on a passcode-free device flow and leave with a shareable image carousel; organizers manage event lineups behind a passcode.

## Frontend
- Styling library: none — inline React `style` objects throughout (`App.tsx`, `OrganizerAdmin.tsx`, `RatingSheet.tsx`, etc). No Tailwind/CSS framework; keep using this convention.
- UI pattern: mobile-first, editorial/content feel (serif headers, warm paper palette) — Taster flow is a bottom-sheet modal (`RatingSheet.tsx`), Organizer admin is a simple list/row-expand form.
- Other conventions:
  - Domain language is enforced from `CONTEXT.md` (Event, Pour, Tasting, Impression, Axis, Descriptor, Carousel, Slide — with explicit `_Avoid_` lists). New code must use these terms.
  - `Slides.tsx` (Carousel rendering) has a hard rule: **no `<img>` tag anywhere** — snapdom capture races WebKit's image decode. Any image content must go in via CSS `background-image` with a pre-decode step (e.g. `new Image().decode()` before capture), never an `<img>` element.
  - Carousel generation must stay out of the share-button click handler (ADR-0004) — pre-render in the background, enable the share control only once ready.

## Backend
- Architecture pattern: simple route handlers (`worker/api.ts`, one `api_*`-style module) over D1, no ORM, no migration system — `schema.sql` is `CREATE TABLE IF NOT EXISTS` run on every boot. Altering existing table columns needs a manual migration file (see `migrations/`), not a schema.sql edit.
- Data store: Cloudflare D1 (`DB` binding, database `wine-tasting`). Impressions/ratings/notes never touch the server (ADR-0002, "impressions never leave the device") — only Event/Pour data is server-side.
- Other conventions:
  - Passcode-gated writes only; the passcode is checked server-side on every mutating route (`isAuthorised`), never just hidden client-side.
  - A `Pour` carries its own wine details inline — there is no reusable Wine catalogue to join against.

## Decisions log
- 2026-10-26 — Replace the `gostei` Axis with a 5-point "O que achei" scale (Excelente/Muito bom/Bom/Regular/Não gostei); keep `corpo`/`doce`/`denovo` as binary low/high Axes — the 5-point scale directly supersedes the "how much did you like it" question, the others aren't what the new paper-card reference re-asks.
- 2026-10-26 — `Tipo` (Tinto/Branco/Rosé/Espumante/Fortificado/Outro) is a new **Pour**-level field set once by the Organizer, not a per-Taster Impression axis — it's a fact about the wine (like producer/vintage), not a taster reaction.
- 2026-10-26 — Descriptors move from the flat 12-word casual list to the full Aroma Wheel (Roda do Aroma dos Vinhos), picked two-level: tap a ring-two category (~16 labels) to reveal its specific terms. Rejected: exposing all ~90 leaf terms flat (too much for a phone screen on first tap).
- 2026-10-26 — Picking an aroma term greys out (never hides) wheel categories the wheel marks incompatible with it, reversible on deselect — same dimming pattern already used for the descriptor cap. Also: the picker pre-filters by the Pour's `Tipo` (e.g. a Tinto Pour never shows "Vinho branco" zones) since `Tipo` is already available Pour-side.
- 2026-10-26 — Descriptor cap raised from 3 to 5, to match the richer two-level vocabulary (a flat 12-word list justified 3; the wheel rewards picking across more than one family, e.g. a fruit note plus a wood note).
- 2026-10-26 — Organizer admin gets a "share link" button: tries `navigator.share()` with the event URL (text-only, none of the Carousel's file-share decode risk), falls back to clipboard-copy. Landing page gets a manual event-code entry box. Reason: the `/e/<code>` link already existed but was only ever shown in tiny print on the printed QR sheet — no digital distribution path and no recovery path if someone has only the code.
- 2026-10-26 — Bottle PNG upload: file picker (not URL paste), optional per Pour, 8MB client-side cap (not 3MB — PNG is lossless, phone photos exported as PNG commonly land 5–15MB; 3MB would reject normal photos), no auto-resize for v1.
- 2026-10-26 — Bottle images stored in a new Cloudflare R2 bucket (binding e.g. `BOTTLE_IMAGES`), not inline in D1. Rejected: base64-in-D1 — a single D1 value can't reliably hold an 8MB file (base64 inflates it further), and it would bloat the SQLite DB the free-tier storage quota tracks. R2's free tier (10GB, no egress fees) matches the project's existing "free tier only" commitment (ADR-0001) and is the standard Workers pairing.
