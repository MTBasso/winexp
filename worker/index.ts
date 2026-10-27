/**
 * The Event API.
 *
 * Deliberately tiny: Impressions never reach a server (ADR-0002), so this only
 * serves Events and their Lineups plus what the Organizer admin writes.
 * Navigation requests never arrive here — static assets serve them directly at
 * this compatibility date — so only /api/* costs a Worker invocation.
 */
import { generateEventCode } from "../src/domain/eventCode";
import { normaliseEventCode } from "../src/domain/eventCode";
import {
  fail,
  isAuthorised,
  json,
  MAX_PNG_BYTES,
  parseEventInput,
  parseLineupInput,
  toEvent,
  validateImageUpload,
  type EventRow,
  type PourRow,
} from "./api";

const uuid = () => crypto.randomUUID();

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const { pathname } = url;

    if (!pathname.startsWith("/api/")) {
      // Assets handle everything else; reaching here is unexpected.
      return new Response("Not found", { status: 404 });
    }

    try {
      if (pathname === "/api/health") return json({ ok: true });

      // ── Public: no auth, consistent with getEvent being the app's one
      // other public read route — a bottle photo is no more sensitive than
      // the Pour's name, which is already public. ──────────────────────────
      const read = pathname.match(/^\/api\/events\/([^/]+)$/);
      if (read && request.method === "GET") {
        return await getEvent(env, read[1]!);
      }

      const image = pathname.match(/^\/api\/events\/([^/]+)\/pours\/([^/]+)\/image$/);
      if (image && request.method === "GET") {
        return await getPourImage(env, image[1]!, image[2]!);
      }

      // ── Everything below mutates, so everything below needs the passcode ─
      const authorised = isAuthorised(
        request.headers.get("Authorization"),
        env.ORGANIZER_PASSCODE,
      );
      if (!authorised) return fail("Senha incorreta", 401);

      if (pathname === "/api/events" && request.method === "POST") {
        return await createEvent(env, request);
      }

      const byId = pathname.match(/^\/api\/events\/([^/]+)$/);
      if (byId && request.method === "PATCH") {
        return await patchEvent(env, request, byId[1]!);
      }

      const lineup = pathname.match(/^\/api\/events\/([^/]+)\/pours$/);
      if (lineup && request.method === "PUT") {
        return await putLineup(env, request, lineup[1]!);
      }

      if (image && request.method === "PUT") {
        return await putPourImage(env, request, image[1]!, image[2]!);
      }

      if (pathname === "/api/events" && request.method === "GET") {
        return await listEvents(env);
      }

      return fail("Not found", 404);
    } catch (error) {
      console.error("api error", error);
      return fail("Erro no servidor", 500);
    }
  },
} satisfies ExportedHandler<Env>;

async function getEvent(env: Env, rawCode: string): Promise<Response> {
  const code = normaliseEventCode(rawCode);
  const event = await env.DB.prepare(
    "SELECT id, code, name, date FROM events WHERE code = ?",
  )
    .bind(code)
    .first<EventRow>();

  if (!event) return fail("Degustação não encontrada", 404);

  const { results } = await env.DB.prepare(
    `SELECT id, event_id, position, name, producer, vintage, grape, country, tipo, image_key
       FROM pours WHERE event_id = ? ORDER BY position`,
  )
    .bind(event.id)
    .all<PourRow>();

  return json(toEvent(event, results ?? []));
}

async function createEvent(env: Env, request: Request): Promise<Response> {
  const parsed = parseEventInput(await request.json().catch(() => null));
  if ("error" in parsed) return fail(parsed.error, 400);

  // Retry on the vanishingly unlikely collision rather than pretending it
  // cannot happen: the code is only ~1e9 wide and UNIQUE will reject a clash.
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const id = uuid();
    const code = generateEventCode();
    try {
      await env.DB.prepare(
        "INSERT INTO events (id, code, name, date) VALUES (?, ?, ?, ?)",
      )
        .bind(id, code, parsed.name, parsed.date)
        .run();
      return json({ id, code, name: parsed.name, date: parsed.date, lineup: [] }, 201);
    } catch (error) {
      const message = error instanceof Error ? error.message : "";
      if (!message.includes("UNIQUE")) throw error;
    }
  }
  return fail("Não foi possível gerar um código", 500);
}

async function patchEvent(env: Env, request: Request, id: string): Promise<Response> {
  const parsed = parseEventInput(await request.json().catch(() => null));
  if ("error" in parsed) return fail(parsed.error, 400);

  const result = await env.DB.prepare(
    "UPDATE events SET name = ?, date = ? WHERE id = ?",
  )
    .bind(parsed.name, parsed.date, id)
    .run();

  if (result.meta.changes === 0) return fail("Degustação não encontrada", 404);
  return json({ ok: true });
}

/**
 * Upserts the Lineup by Pour id (not a wholesale delete+reinsert — stable Pour
 * ids ticket). The client generates and keeps each Pour's id stable, so an
 * unrelated field edit on one Pour must not disturb another Pour's row — in
 * particular it must not wipe `image_key`, which this upsert deliberately
 * never writes (the image upload route owns that column exclusively). A row
 * whose id is no longer present in the incoming payload is deleted, which is
 * how the Organizer's "remover" button takes effect.
 */
async function putLineup(env: Env, request: Request, eventId: string): Promise<Response> {
  const parsed = parseLineupInput(await request.json().catch(() => null));
  if ("error" in parsed) return fail(parsed.error, 400);

  const exists = await env.DB.prepare("SELECT id FROM events WHERE id = ?")
    .bind(eventId)
    .first<{ id: string }>();
  if (!exists) return fail("Degustação não encontrada", 404);

  const ids = parsed.map((p) => p.id);
  const statements = parsed.map((p) =>
    env.DB.prepare(
      `INSERT INTO pours (id, event_id, position, name, producer, vintage, grape, country, tipo)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET
         position = excluded.position,
         name = excluded.name,
         producer = excluded.producer,
         vintage = excluded.vintage,
         grape = excluded.grape,
         country = excluded.country,
         tipo = excluded.tipo`,
    ).bind(p.id, eventId, p.position, p.name, p.producer, p.vintage, p.grape, p.country, p.tipo),
  );

  // Delete any row for this Event whose id is no longer in the payload. With
  // an empty Lineup (Organizer clears the list) there's nothing to exclude.
  statements.push(
    ids.length > 0
      ? env.DB.prepare(
          `DELETE FROM pours WHERE event_id = ? AND id NOT IN (${ids.map(() => "?").join(", ")})`,
        ).bind(eventId, ...ids)
      : env.DB.prepare("DELETE FROM pours WHERE event_id = ?").bind(eventId),
  );

  await env.DB.batch(statements);
  return json({ ok: true, count: parsed.length });
}

async function listEvents(env: Env): Promise<Response> {
  const { results } = await env.DB.prepare(
    `SELECT e.id, e.code, e.name, e.date,
            (SELECT COUNT(*) FROM pours p WHERE p.event_id = e.id) AS pour_count
       FROM events e ORDER BY e.created_at DESC LIMIT 50`,
  ).all();
  return json({ events: results ?? [] });
}

/**
 * Public, like getEvent — a bottle photo is no more sensitive than the Pour's
 * name, which anyone with the Event code can already read.
 */
async function getPourImage(env: Env, rawCode: string, pourId: string): Promise<Response> {
  const code = normaliseEventCode(rawCode);
  const event = await env.DB.prepare("SELECT id FROM events WHERE code = ?")
    .bind(code)
    .first<{ id: string }>();
  if (!event) return fail("Degustação não encontrada", 404);

  const pour = await env.DB.prepare(
    "SELECT image_key FROM pours WHERE id = ? AND event_id = ?",
  )
    .bind(pourId, event.id)
    .first<{ image_key: string | null }>();
  if (!pour || !pour.image_key) return fail("Imagem não encontrada", 404);

  const object = await env.BOTTLE_IMAGES.get(pour.image_key);
  if (!object) return fail("Imagem não encontrada", 404);

  return new Response(object.body, {
    headers: {
      "Content-Type": object.httpMetadata?.contentType ?? "image/png",
      // Safe to cache forever: the key changes on every reupload.
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}

/**
 * Organizer-only (gated by the same isAuthorised() check as putLineup). The
 * uploaded key is timestamped rather than stable per Pour so a reupload
 * cache-busts for free, without a separate versioning scheme.
 */
async function putPourImage(
  env: Env,
  request: Request,
  rawCode: string,
  pourId: string,
): Promise<Response> {
  const code = normaliseEventCode(rawCode);
  const event = await env.DB.prepare("SELECT id FROM events WHERE code = ?")
    .bind(code)
    .first<{ id: string }>();
  if (!event) return fail("Degustação não encontrada", 404);

  // Fast-path rejection on a declared size before reading the whole body.
  const declaredLength = Number(request.headers.get("Content-Length") ?? "0");
  if (Number.isFinite(declaredLength) && declaredLength > MAX_PNG_BYTES) {
    return fail("Imagem demasiado grande", 400);
  }

  const bytes = new Uint8Array(await request.arrayBuffer());
  const validated = validateImageUpload(bytes, request.headers.get("Content-Type"));
  if ("error" in validated) return fail(validated.error, 400);

  // Extension and stored metadata both come from the sniffed type, not the
  // client-sent header, so neither the key nor R2's metadata can be spoofed.
  const extension = validated.contentType === "image/webp" ? "webp" : "png";
  const key = `${pourId}-${Date.now()}.${extension}`;
  await env.BOTTLE_IMAGES.put(key, bytes, { httpMetadata: { contentType: validated.contentType } });

  const result = await env.DB.prepare(
    "UPDATE pours SET image_key = ? WHERE id = ? AND event_id = ?",
  )
    .bind(key, pourId, event.id)
    .run();
  if (result.meta.changes === 0) return fail("Vinho não encontrado", 404);

  return json({ ok: true, imageKey: key });
}
