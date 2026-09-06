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
  parseEventInput,
  parseLineupInput,
  toEvent,
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

      // ── Public: the only route a Taster ever calls ──────────────────────
      const read = pathname.match(/^\/api\/events\/([^/]+)$/);
      if (read && request.method === "GET") {
        return await getEvent(env, read[1]!);
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
    `SELECT id, event_id, position, name, producer, vintage, grape, country
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
 * Replaces the whole Lineup (ticket 10). Delete-then-insert inside a batch so a
 * failure cannot leave an Organizer with half a wine list.
 */
async function putLineup(env: Env, request: Request, eventId: string): Promise<Response> {
  const parsed = parseLineupInput(await request.json().catch(() => null));
  if ("error" in parsed) return fail(parsed.error, 400);

  const exists = await env.DB.prepare("SELECT id FROM events WHERE id = ?")
    .bind(eventId)
    .first<{ id: string }>();
  if (!exists) return fail("Degustação não encontrada", 404);

  const statements = [
    env.DB.prepare("DELETE FROM pours WHERE event_id = ?").bind(eventId),
    ...parsed.map((p) =>
      env.DB.prepare(
        `INSERT INTO pours (id, event_id, position, name, producer, vintage, grape, country)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      ).bind(uuid(), eventId, p.position, p.name, p.producer, p.vintage, p.grape, p.country),
    ),
  ];

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
