# Cloudflare free-tier deployment story for a Vite SPA + small API + D1

Research for [issues/03-cloudflare-deployment-story.md](../issues/03-cloudflare-deployment-story.md).
Tests the decision in [docs/adr/0001-cloudflare-workers-d1.md](../../../docs/adr/0001-cloudflare-workers-d1.md).

Researched 2026-09-06 against Cloudflare's own documentation. Every doc page cited
below carries a "Last updated" date, quoted where it matters.

---

## 1. Recommendation

**Use Workers with static assets. Not Pages. ADR-0001 needs amending.**

Cloudflare now says this in a banner at the top of the Pages documentation
landing page, under the heading *"Are you sure you want to use Pages?"*:

> Workers supports most Pages use cases and offers a broader feature set. It is
> Cloudflare's primary platform for building applications. **Start new projects
> with Workers.**

— <https://developers.cloudflare.com/pages/> (page last updated 2026-08-25)

That is as plain as Cloudflare gets. It is a steer, not a sunset — see the
nuance below — but ADR-0001 picks Pages for a project that does not exist yet,
and the vendor's own docs tell new projects to go the other way.

### Is Pages being sunset?

**No, and it is important not to overstate this.** I found no deprecation
notice, no end-of-life date, and no announced sunset for Pages. The
Pages→Workers migration guide is explicit that migrating is optional and frames
Workers as offering "a distinctly broader set of features" without declaring
Pages end-of-life
(<https://developers.cloudflare.com/workers/static-assets/migration-guides/migrate-from-pages/>).
The Pages docs remain fully maintained and Pages is still "Available on all
plans".

The thing Cloudflare *has* formally deprecated is **Workers Sites**, the older
static-hosting mechanism, which is a different product from Pages
(<https://developers.cloudflare.com/workers/configuration/sites/>).

So the accurate statement is: *Pages is not going away, but it is no longer the
recommended starting point, and new feature investment is going into Workers.*
For a greenfield MVP that is enough. Choosing Pages today means starting on the
path Cloudflare is steering people off, and the migration guide exists precisely
because that path has an exit cost later.

### What ADR-0001 should be amended to

The ADR's *reasoning* survives intact. What changes is the hosting primitive:

| ADR-0001 as written | Should become |
|---|---|
| Cloudflare Pages (static hosting) | Cloudflare Workers with static assets |
| Pages Functions (the Event API) | A single Worker (`main` in `wrangler.jsonc`), same code, same shape |
| D1 binding | D1 binding — **unchanged**, D1 is identical on both |
| Free tier throughout | **Still true**, with more headroom than under Pages |
| Title/filename `0001-cloudflare-pages-d1.md` | Retitle to `0001-cloudflare-workers-d1.md`, or supersede with ADR-0004 |

Concretely, the ADR's premise line in `map.md` —

> Stack: Vite + React 19 + TS strict + Zustand + Vitest on Cloudflare Pages;
> Pages Functions + D1 for the Event API.

— should read *"…on Cloudflare Workers with static assets; a Workers API + D1
for the Event API."*

Nothing else in the map moves. ADR-0002 (Impressions are device-local) and
ADR-0003 (`navigator.share`) are untouched, and the "handful of JSON reads per
Event" architecture is exactly what the Workers React template ships as its
default shape.

### Two things that get *better* under Workers

1. **Requests to static assets are free and unlimited**, and do not count
   against the 100,000/day free request limit. Only requests that actually
   invoke your Worker script are billed
   (<https://developers.cloudflare.com/workers/platform/pricing/>, footnote 3;
   <https://developers.cloudflare.com/workers/static-assets/billing-and-limitations/>).
   For a Taster app where the SPA shell and its JS/CSS/fonts are the bulk of the
   traffic and the API is a handful of JSON reads, this is the whole ballgame.

2. In `single-page-application` mode with a compatibility date of `2025-04-01`
   or later, **navigation requests do not invoke the Worker at all** — the
   `index.html` is served straight from the asset layer:

   > If you have a Worker script (`main`), have configured
   > `assets.not_found_handling`, and use the
   > `assets_navigation_prefers_asset_serving` compatibility flag (or set a
   > compatibility date of `2025-04-01` or greater), *navigation requests* will
   > not invoke the Worker script. […] This reduces billable invocations of your
   > Worker script.

   — <https://developers.cloudflare.com/workers/static-assets/routing/single-page-application/>
   (last updated 2026-08-25)

   Every QR-code scan that lands a Taster on the app is a navigation request.
   None of them cost anything.

### The one thing that gets worse

Pages supports **custom domains on zones outside Cloudflare**. Workers does not
— it requires an active Cloudflare zone. This is listed under "Unsupported
features" in the migration guide
(<https://developers.cloudflare.com/workers/static-assets/migration-guides/migrate-from-pages/>),
and confirmed in the Custom Domains docs:

> To add a Custom Domain, you must have: 1. An active Cloudflare zone.

— <https://developers.cloudflare.com/workers/configuration/routing/custom-domains/>
(last updated 2026-08-14)

For this project that is a non-issue (see §2, Custom domains), but it is the
real trade-off and should be recorded in the amended ADR rather than glossed.

Also gone relative to Pages: gradual deployments, remote development
(`--remote`), Queue consumers, Email Workers / Image Resizing / Rate Limiting
bindings, and per-environment bindings defined in the dashboard ("Unlike Pages,
Workers does not natively support defining different bindings in production vs.
non-production builds"). None of these are in this project's scope.

---

## 2. Free-tier limits that actually apply

### Workers (the API)

| Limit | Free plan | Source |
|---|---|---|
| Requests to the **Worker script** | 100,000 / day, resets midnight UTC | [Workers limits](https://developers.cloudflare.com/workers/platform/limits/) |
| Requests to **static assets** | Free and unlimited | [Workers pricing](https://developers.cloudflare.com/workers/platform/pricing/) fn.3 |
| CPU time per invocation | 10 ms | [Workers pricing](https://developers.cloudflare.com/workers/platform/pricing/) |
| Duration (wall clock) | No charge | same |
| Memory per isolate | 128 MB | [Workers limits](https://developers.cloudflare.com/workers/platform/limits/) |
| Subrequests per invocation | 50 | same |
| Worker size, uncompressed | 64 MiB | same |
| Static asset files per version | 20,000 | same |
| Individual asset file size | 25 MiB | same |
| Workers per account | 100 | same |

Over the daily request limit, Cloudflare returns **Error 1027**
(<https://developers.cloudflare.com/workers/platform/limits/>). Note there is no
documented per-minute burst limit on the Free plan in the current limits table —
only the daily figure.

### D1 (the Events / Lineups / Pours store)

| Limit | Free plan | Source |
|---|---|---|
| Rows read | 5,000,000 / day | [D1 pricing](https://developers.cloudflare.com/d1/platform/pricing/) |
| Rows written | 100,000 / day | same |
| Storage, account total | 5 GB | same |
| Database size, each | 500 MB | [D1 limits](https://developers.cloudflare.com/d1/platform/limits/) |
| Databases per account | 10 | same |
| **Queries per Worker invocation** | **50** | same |
| Max SQL statement length | 100 KB | same |
| Max bound parameters per query | 100 | same |
| Max columns per table | 100 | same |
| Max row / string / BLOB size | 2 MB | same |
| Max query duration | 30 s | same |
| Time Travel retention | 7 days | same |

Free daily limits reset at 00:00 UTC. Exceeding them does not degrade
gracefully:

> When your account hits the daily read and/or write limits, you will not be
> able to run queries against D1. D1 API will return errors to your client
> indicating that your daily limits have been exceeded.

— <https://developers.cloudflare.com/d1/platform/pricing/> (last updated 2026-04-21)

**Rows read counts rows *scanned*, not rows returned.** A `SELECT *` against a
5,000-row table is 5,000 rows read even if it returns one row. Indexes reduce
this. Each indexed column adds one extra row written per write.

Wrangler CLI queries count too: "any queries you run against your database,
including inserting existing data into a new database, table scans, or creating
indexes count as either reads or writes."

### Workers Builds (CI)

| Limit | Free plan | Source |
|---|---|---|
| Build minutes | 3,000 / month | [Builds limits & pricing](https://developers.cloudflare.com/workers/ci-cd/builds/limits-and-pricing/) |
| Concurrent builds | 1 | same |
| Build timeout | 20 minutes | same |
| CPU / memory / disk | 2 vCPU / 8 GB / 20 GB | same |
| Environment variables | 64, 5 KB each | same |

(Page last updated 2026-05-29.)

### Headroom for this project, concretely

Assume a generous Event: 40 Tasters, 8 Pours, everyone loads the app twice and
the client refetches the Lineup a few times.

- **Worker invocations**: the SPA shell, JS, CSS and fonts are all static
  assets — free and unlimited, and navigation requests skip the Worker
  entirely. Only `fetch("/api/...")` calls invoke it. At ~10 API calls per
  Taster that is ~400 invocations per Event against a **100,000/day** budget.
  Roughly **250 Events per day** before you notice the ceiling.
- **D1 rows read**: the whole dataset is a few hundred rows. Even an
  unindexed full scan of a 500-row table on every one of those 400 calls is
  200,000 rows read against a **5,000,000/day** budget — 4%. With an index on
  the Event lookup it is negligible.
- **D1 rows written**: Impressions never reach the server (ADR-0002), so writes
  are Organizer edits only — a handful per Event against **100,000/day**.
- **D1 storage**: a few hundred rows of wine text is kilobytes against
  **500 MB**. An empty database is ~12 KB.
- **Build minutes**: a Vite build of an app this size is on the order of a
  minute. **3,000/month** is not a constraint.
- **Queries per invocation (50)**: the only limit worth actively designing
  around. Do not write an N+1 loop that issues one query per Pour inside a
  request handler — join, or use `db.batch()`. At 8 Pours you would not hit 50,
  but it is the limit that a naive loop would eventually find.

**Verdict: the free tier is not close to binding for this product.** The
constraint that would actually bite first is Worker invocations, and it is two
and a half orders of magnitude away.

### Custom domains and what they cost

- **Attaching a custom domain to a Worker costs nothing.** Cloudflare creates
  the DNS records and issues the certificates automatically; no certificate
  management, available on the free plan
  (<https://developers.cloudflare.com/workers/configuration/routing/custom-domains/>).
- **The domain name itself** is the only cost. Cloudflare Registrar sells at
  cost: "will only charge you what is paid to the registry for your domain. No
  markup. No surprise fees."
  (<https://developers.cloudflare.com/registrar/>). Typically ~$10/yr for a
  `.com`. DNSSEC and WHOIS redaction are free.
- **Requirement**: the domain must be an active Cloudflare zone, i.e. using
  Cloudflare nameservers. Registering through Cloudflare Registrar satisfies
  this automatically (Registrar domains always use Cloudflare nameservers). A
  domain bought elsewhere works too, as long as you point its nameservers at
  Cloudflare.
- **You may not need one at all.** Every Worker gets a free
  `<name>.<subdomain>.workers.dev` hostname with a certificate. Since Tasters
  reach the app by scanning a per-Event QR code and never type the URL, a
  `workers.dev` hostname is functionally sufficient for the MVP. A custom domain
  is a nice-to-have for the Organizer's confidence, not a requirement.

---

## 3. Local development and migrations

### Running the SPA and the API together, with a local D1

This is the part that is genuinely nicer than it used to be. The
`@cloudflare/vite-plugin` runs your Worker inside **workerd** — the actual
production runtime — as a Vite environment, so a single `npm run dev` gives you
the React app with hot module replacement *and* the API *and* a local D1, all in
one process on one port.

> The Cloudflare Vite plugin enables a full-featured integration between Vite
> and the Workers runtime. Your Worker code runs inside workerd, matching the
> production behavior as closely as possible.

— <https://developers.cloudflare.com/workers/vite-plugin/> (last updated 2026-07-03)

There is no separate `wrangler dev` process, no proxy, and no second port. The
React guide confirms the plugin "runs your application in the Cloudflare Workers
runtime, just like in production, and enables access to local emulations of
bindings"
(<https://developers.cloudflare.com/workers/framework-guides/web-apps/react/>,
last updated 2026-09-05).

Local D1 state persists between runs. Both the Wrangler CLI and the Vite plugin
default to the **same** directory, `.wrangler/state`, so a migration applied
from the CLI is visible to the dev server:

> `persistState` — An optional override for state persistence. By default,
> state is persisted to `.wrangler/state`.

— <https://developers.cloudflare.com/workers/vite-plugin/reference/api/>

Note the wrinkle from the D1 docs: because state persists by default, "if your
local development and testing requires or assumes an empty database, you should
start with a `DROP TABLE <tablename>` statement"
(<https://developers.cloudflare.com/d1/best-practices/local-development/>).

A useful extra for this project specifically: the Vite plugin has a `tunnel`
option that exposes the local dev server over a Cloudflare Tunnel — press
`t` then Enter — which is the easiest way to test a QR code against a real phone
while developing
(<https://developers.cloudflare.com/workers/vite-plugin/reference/api/>).

### Migrations

D1 has a first-party migration system. Each migration is a numbered `.sql` file
in `migrations/`, and applied migrations are recorded in a `d1_migrations` table
inside the database itself
(<https://developers.cloudflare.com/d1/reference/migrations/>, last updated
2026-06-08).

The three commands, in **fish**:

```fish
# create an empty, numbered migration file under migrations/
npx wrangler d1 migrations create wine-tasting create_events_and_pours

# apply to the LOCAL database that vite dev uses
npx wrangler d1 migrations apply wine-tasting --local

# apply to the REMOTE (production) database
npx wrangler d1 migrations apply wine-tasting --remote
```

Flags verified against
<https://developers.cloudflare.com/workers/wrangler/commands/d1/> (last updated
2026-04-23):

- `--local` — "Execute commands/files against a local DB for use with wrangler dev"
- `--remote` — "Execute commands/files against a remote DB"
- `--persist-to <dir>` — override the local state directory (requires `--local`)

`wrangler d1 migrations apply` prompts for confirmation interactively, skips the
prompt in CI, and captures a backup either way. If a migration errors it is
rolled back and the previous successful migration stays applied.

Ad-hoc SQL uses the same `--local` / `--remote` split:

```fish
npx wrangler d1 execute wine-tasting --local --file=./seed/one-event.sql
npx wrangler d1 execute wine-tasting --remote --command "SELECT count(*) FROM pours"
```

**Fish note**: none of these need shell-specific syntax — no `export`, no bash
arrays. Where you would write `export CLOUDFLARE_ENV=staging` in bash, fish
wants:

```fish
set -x CLOUDFLARE_ENV staging
```

The Vite plugin reads `CLOUDFLARE_ENV` to select a Cloudflare environment at dev
or build time
(<https://developers.cloudflare.com/workers/vite-plugin/reference/cloudflare-environments/>).
For a single-environment MVP you will not need it.

The `migrations_dir` / `migrations_table` / `migrations_pattern` fields in the
D1 binding let you relocate or reshape the migrations folder — relevant only if
you later adopt Drizzle, which writes each migration as its own subdirectory and
needs `"migrations_pattern": "migrations/*/migration.sql"`.

---

## 4. Minimal working example

### Pinned versions

Latest published versions as of 2026-09-06 (`npm view <pkg> version`):

| Package | Version | Note |
|---|---|---|
| `wrangler` | `4.129.0` | `@cloudflare/vite-plugin` peer-requires `^4.129.0` |
| `@cloudflare/vite-plugin` | `1.54.4` | peers: `vite ^6.1.0 \|\| ^7.0.0 \|\| ^8.0.0` |
| `vite` | `8.2.2` | |
| `@vitejs/plugin-react` | `6.1.1` | peers `vite ^8.0.0` only — see gotcha below |
| `react` / `react-dom` | `19.2.8` | ADR-0001 specifies React 19 ✓ |
| `zustand` | `5.0.15` | |
| `vitest` | `4.1.11` **or** `5.0.0` | see the pool-workers gotcha below |
| `@cloudflare/vitest-pool-workers` | `0.22.0` | peers `vitest ^4.1.0` — **not** 5.x |
| `typescript` | `5.9.3` (conservative) / `7.0.2` (latest) | see gaps |
| `create-cloudflare` (C3) | `2.72.5` | |

Two version traps worth stating plainly:

1. **`@vitejs/plugin-react@6` requires Vite 8.** If you pin Vite 7, you need
   `@vitejs/plugin-react@5.2.0`, whose peer range is
   `^4.2.0 || ^5.0.0 || ^6.0.0 || ^7.0.0`. Plugin-react 6's other peers
   (`oxc-transform-react`, `@rolldown/plugin-babel`,
   `babel-plugin-react-compiler`) are all marked **optional** in
   `peerDependenciesMeta`, so npm will not force them on you.

2. **`@cloudflare/vitest-pool-workers@0.22.0` peer-requires `vitest ^4.1.0`**,
   but the latest Vitest is `5.0.0`. If you want to test API handlers against a
   real local D1 inside workerd, you must pin `vitest@4.1.11`. If your tests are
   pure-logic only — which, given ADR-0002 puts Impressions on the device, is
   most of what this app needs — plain `vitest@5` is fine and you can skip
   `vitest-pool-workers` entirely. **Decide this before scaffolding**; it is
   annoying to unwind.

### Directory layout

```
wine-tasting/
├── src/                       # the React SPA (client)
│   ├── main.tsx
│   ├── App.tsx
│   ├── copy/                  # pt-BR lookup object (map.md)
│   └── tasting/               # local Tasting state, Zustand
├── worker/
│   └── index.ts               # the Event API — this is `main`
├── migrations/
│   └── 0001_create_events_and_pours.sql
├── public/
├── index.html
├── vite.config.ts
├── wrangler.jsonc             # INPUT config
├── worker-configuration.d.ts  # generated by `wrangler types`
├── tsconfig.json
├── package.json
└── .wrangler/                 # local D1 state — gitignored
```

This mirrors the shape C3 generates for `--framework=react`
(<https://developers.cloudflare.com/workers/framework-guides/web-apps/react/>).

### `wrangler.jsonc`

```jsonc
{
  "$schema": "./node_modules/wrangler/config-schema.json",
  "name": "wine-tasting",
  "main": "./worker/index.ts",
  "compatibility_date": "2026-09-06",
  "assets": {
    "not_found_handling": "single-page-application"
  },
  "d1_databases": [
    {
      "binding": "DB",
      "database_name": "wine-tasting",
      "database_id": "<from `wrangler d1 create`>"
    }
  ]
}
```

Three notes on this file:

- **Do not set `assets.directory`.** With the Vite plugin the directory is
  filled in automatically from the client build output: "The `directory` field
  is not used when configuring assets with Vite"
  (<https://developers.cloudflare.com/workers/vite-plugin/reference/static-assets/>).
- The `compatibility_date` of `2026-09-06` is comfortably past `2025-04-01`, so
  the navigation-requests-skip-the-Worker behaviour is on by default.
- The config you write is the **input** config. `vite build` emits a separate
  output `wrangler.json` in the build directory, and that is what is used for
  preview and deploy. Do not hand-edit the generated one.

### `vite.config.ts`

```ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { cloudflare } from "@cloudflare/vite-plugin";

export default defineConfig({
  plugins: [react(), cloudflare()],
});
```

The Cloudflare plugin goes **after** the framework plugin, and needs no options
— it finds `wrangler.jsonc` in the project root by itself.

### `worker/index.ts` — the Event API

```ts
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    // GET /api/events/:eventId/lineup
    const match = url.pathname.match(/^\/api\/events\/([^/]+)\/lineup$/);
    if (request.method === "GET" && match) {
      const { results } = await env.DB.prepare(
        `SELECT p.id, p.position, p.producer, p.name, p.vintage, p.grape, p.country
           FROM pours p
          WHERE p.event_id = ?1
          ORDER BY p.position`
      )
        .bind(match[1])
        .all();
      return Response.json(results);
    }

    return new Response("Not found", { status: 404 });
  },
} satisfies ExportedHandler<Env>;
```

`Env` comes from `worker-configuration.d.ts`, generated by `wrangler types`,
which derives it from your bindings, compatibility date and flags. Cloudflare
recommends this over installing `@cloudflare/workers-types` by hand
(<https://developers.cloudflare.com/workers/languages/typescript/>). Add the
generated file to `compilerOptions.types` in `tsconfig.json`, and re-run
`wrangler types` after any change to `wrangler.jsonc`.

### `.gitignore` additions

```
.wrangler
.dev.vars*
```

— per <https://developers.cloudflare.com/workers/framework-guides/web-apps/react/>

### Commands (fish)

Scaffold from Cloudflare's template:

```fish
npm create cloudflare@latest -- wine-tasting --framework=react
```

Or add Cloudflare to an existing Vite app:

```fish
npm i -D @cloudflare/vite-plugin wrangler
```

Then, in order:

```fish
# 1. authenticate once
npx wrangler login

# 2. create the remote D1 database; copy the printed database_id into wrangler.jsonc
npx wrangler d1 create wine-tasting

# 3. write the first migration
npx wrangler d1 migrations create wine-tasting create_events_and_pours

# 4. apply it locally, then run everything in one process
npx wrangler d1 migrations apply wine-tasting --local
npm run dev

# 5. generate binding types (re-run after any wrangler.jsonc change)
npx wrangler types

# 6. typecheck
npx tsc --noEmit

# 7. preview the real build output in workerd before shipping
npm run build
npx vite preview

# 8. apply migrations to production, then deploy
npx wrangler d1 migrations apply wine-tasting --remote
npx wrangler deploy
```

All of the above are fish-safe as written. The only bash-ism to watch for in
Cloudflare's docs is `export VAR=value`; in fish that is `set -x VAR value`.

### CI (optional)

Connecting the GitHub repo to **Workers Builds** in the dashboard gives
push-to-deploy with preview URLs on the free plan (3,000 build minutes/month,
1 concurrent build). One caveat from the docs:

> When connecting a repository to a Workers project, the Worker name in the
> Cloudflare dashboard must match the `name` in the Wrangler configuration file
> in the specified root directory, or the build will fail.

— <https://developers.cloudflare.com/workers/ci-cd/builds/>

Migrations are **not** run by Workers Builds automatically. Either add
`wrangler d1 migrations apply wine-tasting --remote` to the deploy command, or
run it by hand before deploying. For a project with one Organizer and a handful
of Events, running it by hand is the honest answer.

---

## 5. Confidence and gaps

### High confidence

- **Cloudflare recommends Workers over Pages for new projects.** Directly
  quoted from the Pages docs landing page, verified twice — once rendered, once
  as raw markdown from `https://developers.cloudflare.com/pages/index.md`. The
  page reports "Last updated Aug 25, 2026".
- **Pages is not deprecated or sunset.** No EOL notice anywhere in the docs;
  the migration guide frames migration as optional. Searching Cloudflare's blog,
  docs and community surfaced no Pages deprecation announcement.
- **All free-tier numbers in §2.** Taken from the current limits and pricing
  tables, each of which carries a recent "Last updated" date (Workers pricing
  2026-08-28, D1 pricing 2026-04-21, Builds limits 2026-05-29).
- **Static asset requests are free and unlimited**, and navigation requests
  bypass the Worker at compatibility date ≥ 2025-04-01. Stated in two
  independent places in the docs.
- **The local dev and migration story.** Command flags read directly off the
  Wrangler command reference rather than from memory.
- **Package versions.** Queried live from the npm registry on 2026-09-06.

### Medium confidence

- **The 5,000,000 rows-read/day and 100,000 rows-written/day figures for D1
  free.** Correct as documented, but "rows read" counts rows *scanned*. My
  headroom estimate in §2 assumes a sane schema with an index on the Event
  lookup. A pathological query pattern could burn the budget faster than the
  arithmetic suggests. Worth checking the `meta.rows_read` field on real queries
  once there is a schema.
- **The 50-queries-per-Worker-invocation D1 free-plan limit.** Documented
  clearly, and comfortably above what this app needs, but it is tighter than the
  paid plan's 1,000 and is the kind of limit an N+1 loop finds by accident.

### Gaps and open questions

- **TypeScript 7.** The latest published TypeScript is `7.0.2` (the native
  port); the latest 5.x is `5.9.3`. I did **not** verify that TS 7 works cleanly
  with `@cloudflare/vite-plugin`, `wrangler types`' generated declarations, or
  Vitest. I have listed 5.9.3 as the conservative pin. Someone should actually
  try TS 7 in a throwaway scaffold before committing the project to it —
  "TS strict" in ADR-0001 does not specify a major version, so this is a live
  decision, not a settled one.
- **Vitest 5 + `@cloudflare/vitest-pool-workers`.** Confirmed from npm metadata
  that pool-workers 0.22.0 declares `vitest ^4.1.0`. I did not check whether a
  Vitest 5-compatible pool-workers is in prerelease. Re-check at scaffold time;
  this may resolve itself.
- **Whether Cloudflare's React template's exact `package.json` pins differ from
  latest.** I read the framework guide's prose and file tree but did not fetch
  the `cloudflare/templates` repo's `react-starter-template/package.json`. Running
  C3 and reading what it actually writes is the cheap way to settle this, and is
  the recommended first step regardless.
- **Free-plan request burst behaviour.** The current limits table gives only a
  daily figure (100,000/day, Error 1027 on exceed) with no documented
  per-minute cap. Older Cloudflare documentation described a per-minute limit. I
  could not find one in the current table, so I have not asserted one. If a
  single Event ever produced a genuine burst, this would be worth re-checking —
  though at ~400 invocations per Event it is academic.
- **`run_worker_first` and the free tier — a real trap for the Organizer
  passcode.** If you later use `assets.run_worker_first` to gate the admin
  behind the shared passcode, note this:

  > **Important note for free tier users**: When using `run_worker_first`,
  > requests matching the specified patterns will always invoke your Worker
  > script. If you exceed your free tier request limits, these requests will
  > receive a 429 (Too Many Requests) response instead of falling back to static
  > asset serving.

  — <https://developers.cloudflare.com/workers/static-assets/billing-and-limitations/>

  Gating the Organizer admin this way converts free asset requests into billable
  Worker invocations. Given the passcode ticket (issue 09) is still open, check
  the passcode in the API rather than at the routing layer, and this never
  arises.

### Sources

- <https://developers.cloudflare.com/pages/> — the "Start new projects with Workers" banner
- <https://developers.cloudflare.com/workers/static-assets/migration-guides/migrate-from-pages/>
- <https://developers.cloudflare.com/workers/static-assets/>
- <https://developers.cloudflare.com/workers/static-assets/routing/single-page-application/>
- <https://developers.cloudflare.com/workers/static-assets/billing-and-limitations/>
- <https://developers.cloudflare.com/workers/platform/pricing/>
- <https://developers.cloudflare.com/workers/platform/limits/>
- <https://developers.cloudflare.com/workers/vite-plugin/>
- <https://developers.cloudflare.com/workers/vite-plugin/reference/api/>
- <https://developers.cloudflare.com/workers/vite-plugin/reference/static-assets/>
- <https://developers.cloudflare.com/workers/vite-plugin/reference/cloudflare-environments/>
- <https://developers.cloudflare.com/workers/framework-guides/web-apps/react/>
- <https://developers.cloudflare.com/workers/languages/typescript/>
- <https://developers.cloudflare.com/workers/configuration/routing/custom-domains/>
- <https://developers.cloudflare.com/workers/configuration/sites/> — Workers Sites deprecation
- <https://developers.cloudflare.com/workers/ci-cd/builds/>
- <https://developers.cloudflare.com/workers/ci-cd/builds/limits-and-pricing/>
- <https://developers.cloudflare.com/workers/wrangler/commands/d1/>
- <https://developers.cloudflare.com/d1/platform/pricing/>
- <https://developers.cloudflare.com/d1/platform/limits/>
- <https://developers.cloudflare.com/d1/best-practices/local-development/>
- <https://developers.cloudflare.com/d1/reference/migrations/>
- <https://developers.cloudflare.com/registrar/>
- <https://developers.cloudflare.com/registrar/get-started/register-domain/>
