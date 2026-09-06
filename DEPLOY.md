# Deploying

The app is live at **https://wine-tasting.araraquarawinexp.workers.dev**

Cloudflare Workers with static assets and a D1 database, all on the free tier
(ADR-0001). One command:

```fish
npm run deploy
```

## What is already set up

- **D1 database** `wine-tasting`, id `d190723b-ee84-4fdb-8e0d-a4c3decf612b`,
  wired into `wrangler.jsonc`. Migrations applied remotely.
- **`ORGANIZER_PASSCODE`** stored as a Wrangler secret, not in the repo.
- **Seed data**: `TESTE1` (7 wines, Douro) and `TESTE2` (5 wines, Toscana).

## The Organizer passcode

Production and local development use different passcodes on purpose — the local
one lives in `.dev.vars`, which is gitignored, and cannot open production.

To change the production passcode:

```fish
npx wrangler secret put ORGANIZER_PASSCODE
```

Organizers enter it once per device at `/admin` and are never asked again. It
protects writes, not secrets: there is nothing confidential stored (ADR-0002),
but without it anyone who finds `/admin` could wipe a wine list during an Event.

## Gotcha: changing `database_id` resets your local database

Miniflare keys the **local** D1 by `database_id`, not by binding name. Changing
that id in `wrangler.jsonc` silently points local dev at a fresh, empty
database, and every `/api/*` call starts returning 500 with no obvious cause.

The fix is not a rollback, it is a re-apply:

```fish
npm run migrate
npm run seed
```

## Commands

| command | does |
|---|---|
| `npm run dev` | local dev on every interface, so phones on the LAN can reach it |
| `npm run migrate` | apply migrations to the **local** D1 |
| `npm run seed` | load test degustações **locally** |
| `npm run migrate:remote` | apply migrations to **production** |
| `npm run seed:remote` | load test degustações into **production** |
| `npm run deploy` | build and deploy |

## Testing on a phone

The share flow needs HTTPS to have a secure context — `navigator.share` is
undefined without one — so `http://<lan-ip>:5173` will report a false negative.
Use the deployed URL for anything involving sharing. The LAN address is fine for
looking at layout.
