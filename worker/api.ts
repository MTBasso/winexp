/**
 * The Event API. Pure request handling — no D1 access, no Response building
 * beyond JSON, so the interesting parts are testable without workerd.
 */
import type { Event, Pour } from "../src/domain/types";

export interface EventRow {
  id: string;
  code: string;
  name: string;
  date: string;
}

export interface PourRow {
  id: string;
  event_id: string;
  position: number;
  name: string;
  producer: string;
  vintage: string;
  grape: string;
  country: string;
}

export const toPour = (row: PourRow): Pour => ({
  id: row.id,
  position: row.position,
  name: row.name,
  producer: row.producer,
  vintage: row.vintage,
  grape: row.grape,
  country: row.country,
});

export const toEvent = (row: EventRow, pours: readonly PourRow[]): Event => ({
  id: row.id,
  code: row.code,
  name: row.name,
  date: row.date,
  lineup: pours.map(toPour),
});

/**
 * Ticket 09: the passcode is checked in the API on every mutating route, never
 * only by hiding the admin UI. Compared against a Wrangler secret.
 */
export function isAuthorised(header: string | null, secret: string | undefined): boolean {
  if (!secret) return false;
  const prefix = "Bearer ";
  if (!header || !header.startsWith(prefix)) return false;
  return timingSafeEqual(header.slice(prefix.length).trim(), secret);
}

/** Not security-critical at this threat model, but free to do properly. */
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export interface EventInput {
  readonly name: string;
  readonly date: string;
}

/** Ticket 05: an Event requires both a name and a date. */
export function parseEventInput(body: unknown): EventInput | { error: string } {
  if (typeof body !== "object" || body === null) return { error: "Corpo inválido" };
  const { name, date } = body as Record<string, unknown>;
  if (typeof name !== "string" || name.trim() === "") return { error: "Nome é obrigatório" };
  if (typeof date !== "string" || date.trim() === "") return { error: "Data é obrigatória" };
  return { name: name.trim(), date: date.trim() };
}

export type PourInput = Omit<Pour, "id">;

/**
 * The Lineup is replaced wholesale (ticket 10), so this validates the entire
 * array. Positions are reassigned from array order — the client's ordering is
 * the truth, and trusting a client-sent `position` invites gaps and duplicates.
 */
export function parseLineupInput(body: unknown): PourInput[] | { error: string } {
  const pours = (body as { pours?: unknown } | null)?.pours;
  if (!Array.isArray(pours)) return { error: "Lista de vinhos inválida" };

  const parsed: PourInput[] = [];
  for (const [index, raw] of pours.entries()) {
    if (typeof raw !== "object" || raw === null) return { error: `Vinho ${index + 1} inválido` };
    const p = raw as Record<string, unknown>;
    const str = (v: unknown) => (typeof v === "string" ? v.trim() : "");
    const name = str(p["name"]);
    const producer = str(p["producer"]);
    // A Pour is usable with just a name or a producer (ticket 06) — an
    // Organizer typing at the venue is never blocked by a missing grape.
    if (name === "" && producer === "") {
      return { error: `Vinho ${index + 1} precisa de nome ou produtor` };
    }
    parsed.push({
      position: index + 1,
      name,
      producer,
      vintage: str(p["vintage"]),
      grape: str(p["grape"]),
      country: str(p["country"]),
    });
  }
  return parsed;
}

export const json = (data: unknown, status = 200) =>
  Response.json(data, { status });

export const fail = (message: string, status: number) =>
  Response.json({ error: message }, { status });
