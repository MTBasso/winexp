# Toolchain versions and how much of the Worker gets tested

Type: grilling
Status: resolved
Blocked by: —

## Question

Ticket 03 surfaced a version fork that has to be settled before anything is
scaffolded, because it is painful to reverse once a lockfile exists.

Decide:

- **Vitest 4 or 5.** `@cloudflare/vitest-pool-workers` peer-requires Vitest
  ^4.1.0, but Vitest 5.0.0 is out. Taking the pool means pinning Vitest 4.1.11;
  taking Vitest 5 means no in-workerd tests. So: does anything need testing
  *inside* the Worker runtime with a real local D1, or is the Worker thin enough
  that pure-logic Vitest plus manual checking is honest coverage? ADR-0002 keeps
  Impressions on-device, so the Worker only reads and writes Events and Lineups.
- **TypeScript 5.9 or 7.x.** TypeScript 7 (the native port) is released, but
  ticket 03 could not verify it against the Cloudflare toolchain, Wrangler's
  generated types, or the Vite plugin. Decide whether this project is willing to
  be an early adopter here or pins 5.9 and revisits.
- Whether these pins are worth writing down as an ADR, or are ordinary
  dependency choices that the lockfile records adequately.

Testing of Slide image generation is deliberately **not** in this ticket — it
depends on ticket 02 and remains in the fog.

## Answer

**Vitest 5.0.0, no `@cloudflare/vitest-pool-workers`, TypeScript 5.9.3.**

*Vitest 5 over 4.1.11 + pool-workers.* The Worker is thin by construction:
ADR-0002 keeps Impressions on the device, so the API only reads and writes
Events and Lineups. That leaves almost nothing whose behaviour depends on being
inside workerd — the interesting logic (Axis scoring, Note grapheme clamping,
Carousel composition, local Tasting state) is all pure and testable in plain
Vitest. Paying a major-version pin on the whole test runner to integration-test
a few SQL statements is the wrong trade. Reversible if the Worker grows: drop to
`vitest@4.1.11` and add the pool.

*TypeScript 5.9.3 over 7.0.2.* TypeScript 7's native port is released but ticket
03 could not verify it against `@cloudflare/vite-plugin`, `wrangler types`'
generated declarations, or the Vite plugin's own types. This project's value is
in the Carousel, not in being an early adopter of a compiler rewrite. Revisit
once the Cloudflare toolchain documents support.

*No ADR.* Both are ordinary dependency choices that the lockfile records
adequately, and neither is surprising or hard to reverse — they fail the ADR
bar on two of three counts.
